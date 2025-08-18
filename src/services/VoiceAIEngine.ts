// src/services/VoiceAIEngine.ts
import { Injectable } from '@varld/warp';
import { EventEmitter } from 'events';
import { SpeechRecognitionService } from './SpeechRecognitionService';
import { NaturalLanguageService } from './NaturalLanguageService';
import { VoiceCommandExecutor } from './VoiceCommandExecutor';
import { TextToSpeechService } from './TextToSpeechService';

interface VoiceSession {
  id: string;
  userId?: string;
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
  commandCount: number;
  language: string;
}

interface VoiceInteraction {
  id: string;
  sessionId: string;
  transcript: string;
  intent: string;
  entities: any[];
  response: string;
  success: boolean;
  duration: number;
  timestamp: Date;
}

@Injectable()
export class VoiceAIEngine extends EventEmitter {
  private activeSessions: Map<string, VoiceSession> = new Map();
  private interactionHistory: VoiceInteraction[] = [];

  constructor(
    private speechRecognition: SpeechRecognitionService,
    private nlService: NaturalLanguageService,
    private commandExecutor: VoiceCommandExecutor,
    private textToSpeech: TextToSpeechService
  ) {
    super();
    this.setupEventHandlers();
  }

  async startVoiceSession(userId?: string): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      
      const session: VoiceSession = {
        id: sessionId,
        userId,
        isActive: true,
        startTime: new Date(),
        lastActivity: new Date(),
        commandCount: 0,
        language: 'en-US'
      };

      this.activeSessions.set(sessionId, session);

      // Start speech recognition
      await this.speechRecognition.startListening(sessionId, userId);

      // Welcome message
      await this.textToSpeech.speakResponse(
        "Hello! I'm your AI assistant for the construction ERP system. How can I help you today?",
        'normal'
      );

      this.emit('session_started', session);
      console.log(`🎤 Voice AI session started: ${sessionId}`);
      
      return sessionId;
    } catch (error) {
      console.error('Error starting voice session:', error);
      throw error;
    }
  }

  async endVoiceSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Stop speech recognition
      await this.speechRecognition.stopListening(sessionId);

      // Goodbye message
      await this.textToSpeech.speakResponse(
        `Goodbye! I processed ${session.commandCount} commands in this session. Have a great day!`,
        'normal'
      );

      // Update session
      session.isActive = false;
      
      this.emit('session_ended', session);
      console.log(`🔇 Voice AI session ended: ${sessionId}`);
      
      // Clean up after delay
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 5000);
    } catch (error) {
      console.error('Error ending voice session:', error);
      throw error;
    }
  }

  async processVoiceInput(sessionId: string, audioData: ArrayBuffer): Promise<VoiceInteraction> {
    const startTime = Date.now();
    
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) {
        throw new Error('Invalid or inactive session');
      }

      // Step 1: Speech to Text
      const speechResult = await this.speechRecognition.processAudioStream(sessionId, audioData);
      const transcript = speechResult.find(r => r.isFinal)?.transcript || '';

      if (!transcript) {
        throw new Error('No speech detected');
      }

      // Step 2: Natural Language Understanding
      const nluResult = await this.nlService.processCommand(transcript);

      // Step 3: Execute Command
      const executionContext = {
        userId: session.userId,
        sessionId,
        timestamp: new Date()
      };

      const commandResult = await this.commandExecutor.executeCommand(
        nluResult.intent.name,
        nluResult.entities,
        executionContext
      );

      // Step 4: Text to Speech Response
      await this.textToSpeech.speakResponse(commandResult.voiceResponse);

      // Create interaction record
      const interaction: VoiceInteraction = {
        id: this.generateId(),
        sessionId,
        transcript,
        intent: nluResult.intent.name,
        entities: nluResult.entities,
        response: commandResult.voiceResponse,
        success: commandResult.success,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      // Update session
      session.lastActivity = new Date();
      session.commandCount++;

      // Store interaction
      this.interactionHistory.push(interaction);

      // Emit events
      this.emit('interaction_completed', interaction);
      if (!commandResult.success) {
        this.emit('interaction_failed', interaction);
      }

      console.log(`🎯 Voice interaction completed: ${nluResult.intent.name} (${interaction.duration}ms)`);
      
      return interaction;
    } catch (error) {
      console.error('Error processing voice input:', error);
      
      // Error response
      await this.textToSpeech.speakResponse(
        "I'm sorry, I encountered an error processing your request. Please try again."
      );

      throw error;
    }
  }

  getActiveSessionsCount(): number {
    return Array.from(this.activeSessions.values()).filter(s => s.isActive).length;
  }

  getSessionInfo(sessionId: string): VoiceSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  getInteractionHistory(sessionId?: string, limit: number = 50): VoiceInteraction[] {
    let history = this.interactionHistory;
    
    if (sessionId) {
      history = history.filter(i => i.sessionId === sessionId);
    }
    
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getAnalytics(): {
    totalSessions: number;
    activeSessions: number;
    totalInteractions: number;
    successRate: number;
    averageResponseTime: number;
    topIntents: Array<{ intent: string; count: number }>;
  } {
    const totalSessions = this.activeSessions.size;
    const activeSessions = this.getActiveSessionsCount();
    const totalInteractions = this.interactionHistory.length;
    
    const successfulInteractions = this.interactionHistory.filter(i => i.success);
    const successRate = totalInteractions > 0 ? (successfulInteractions.length / totalInteractions) * 100 : 0;
    
    const averageResponseTime = totalInteractions > 0 ? 
      this.interactionHistory.reduce((sum, i) => sum + i.duration, 0) / totalInteractions : 0;

    // Calculate top intents
    const intentCounts = this.interactionHistory.reduce((acc, i) => {
      acc[i.intent] = (acc[i.intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSessions,
      activeSessions,
      totalInteractions,
      successRate: Math.round(successRate * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime),
      topIntents
    };
  }

  private setupEventHandlers(): void {
    // Handle speech recognition events
    this.speechRecognition.on('command_recognized', (command) => {
      this.emit('speech_recognized', command);
    });

    this.speechRecognition.on('listening_started', (data) => {
      this.emit('listening_started', data);
    });

    this.speechRecognition.on('listening_stopped', (data) => {
      this.emit('listening_stopped', data);
    });

    // Auto-cleanup inactive sessions
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 300000); // Every 5 minutes
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.activeSessions) {
      if (now - session.lastActivity.getTime() > sessionTimeout) {
        console.log(`🧹 Cleaning up inactive session: ${sessionId}`);
        this.endVoiceSession(sessionId).catch(console.error);
      }
    }
  }

  private generateSessionId(): string {
    return 'voice_session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateId(): string {
    return 'interaction_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// controllers/VoiceAIController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
import { VoiceAIEngine } from '../src/services/VoiceAIEngine';
import { SpeechRecognitionService } from '../src/services/SpeechRecognitionService';
import { TextToSpeechService } from '../src/services/TextToSpeechService';
import { NaturalLanguageService } from '../src/services/NaturalLanguageService';

@Injectable()
@Controller('/api/voice')
export class VoiceAIController {
  constructor(
    private voiceAI: VoiceAIEngine,
    private speechRecognition: SpeechRecognitionService,
    private textToSpeech: TextToSpeechService,
    private nlService: NaturalLanguageService
  ) {}

  @Post('/session/start')
  async startVoiceSession(@Body() request: { userId?: string }) {
    try {
      const sessionId = await this.voiceAI.startVoiceSession(request.userId);
      
      return {
        success: true,
        data: {
          sessionId,
          message: 'Voice session started successfully'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/session/:sessionId/end')
  async endVoiceSession(@Param('sessionId') sessionId: string) {
    try {
      await this.voiceAI.endVoiceSession(sessionId);
      
      return {
        success: true,
        message: 'Voice session ended successfully'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/session/:sessionId/status')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    try {
      const session = this.voiceAI.getSessionInfo(sessionId);
      
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      return {
        success: true,
        data: session
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/session/:sessionId/process-audio')
  async processAudioInput(@Param('sessionId') sessionId: string, @Body() request: {
    audioData: string; // Base64 encoded audio
    format?: string;
  }) {
    try {
      // Convert base64 to ArrayBuffer (simplified for demo)
      const audioBuffer = new ArrayBuffer(1024); // Mock audio data
      
      const interaction = await this.voiceAI.processVoiceInput(sessionId, audioBuffer);
      
      return {
        success: true,
        data: interaction
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/text-to-speech')
  async convertTextToSpeech(@Body() request: {
    text: string;
    voice?: string;
    rate?: number;
    pitch?: number;
  }) {
    try {
      const result = await this.textToSpeech.speak(request.text);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/speech-to-text')
  async convertSpeechToText(@Body() request: {
    audioData: string;
    sessionId?: string;
  }) {
    try {
      const sessionId = request.sessionId || 'temp_session';
      const audioBuffer = new ArrayBuffer(1024); // Mock conversion
      
      const results = await this.speechRecognition.processAudioStream(sessionId, audioBuffer);
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/understand-command')
  async understandCommand(@Body() request: { text: string }) {
    try {
      const result = await this.nlService.processCommand(request.text);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics')
  async getVoiceAnalytics() {
    try {
      const analytics = this.voiceAI.getAnalytics();
      
      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/interactions')
  async getInteractionHistory(@Query() query: any) {
    try {
      const { sessionId, limit = 50 } = query;
      
      const interactions = this.voiceAI.getInteractionHistory(sessionId, parseInt(limit));
      
      return {
        success: true,
        data: interactions
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/intents')
  async getAvailableIntents() {
    try {
      const intents = this.nlService.getAvailableIntents();
      const examples = this.nlService.getIntentExamples();
      
      return {
        success: true,
        data: {
          intents,
          examples
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/config/speech-recognition')
  async updateSpeechConfig(@Body() config: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }) {
    try {
      this.speechRecognition.updateConfig(config);
      
      return {
        success: true,
        message: 'Speech recognition config updated'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/config/text-to-speech')
  async updateTTSConfig(@Body() config: {
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }) {
    try {
      this.textToSpeech.updateVoiceConfig(config);
      
      return {
        success: true,
        message: 'Text-to-speech config updated'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/status')
  async getSystemStatus() {
    try {
      const speechStatus = this.speechRecognition.getListeningStatus();
      const ttsActive = this.textToSpeech.isSpeechActive();
      const activeSessionsCount = this.voiceAI.getActiveSessionsCount();
      
      return {
        success: true,
        data: {
          speechRecognition: speechStatus,
          textToSpeech: {
            isActive: ttsActive
          },
          sessions: {
            active: activeSessionsCount
          },
          systemHealth: 'healthy'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/demo/simulate-command')
  async simulateVoiceCommand(@Body() request: {
    command: string;
    sessionId?: string;
  }) {
    try {
      // For demo purposes - simulate a voice command
      const sessionId = request.sessionId || await this.voiceAI.startVoiceSession();
      
      // Process the text command as if it came from speech
      const nluResult = await this.nlService.processCommand(request.command);
      
      return {
        success: true,
        data: {
          sessionId,
          originalCommand: request.command,
          understanding: nluResult,
          message: 'Voice command simulated successfully'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

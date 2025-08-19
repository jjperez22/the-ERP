"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAIEngine = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
const SpeechRecognitionService_1 = require("./SpeechRecognitionService");
const NaturalLanguageService_1 = require("./NaturalLanguageService");
const VoiceCommandExecutor_1 = require("./VoiceCommandExecutor");
const TextToSpeechService_1 = require("./TextToSpeechService");
let VoiceAIEngine = class VoiceAIEngine extends events_1.EventEmitter {
    speechRecognition;
    nlService;
    commandExecutor;
    textToSpeech;
    activeSessions = new Map();
    interactionHistory = [];
    constructor(speechRecognition, nlService, commandExecutor, textToSpeech) {
        super();
        this.speechRecognition = speechRecognition;
        this.nlService = nlService;
        this.commandExecutor = commandExecutor;
        this.textToSpeech = textToSpeech;
        this.setupEventHandlers();
    }
    async startVoiceSession(userId) {
        try {
            const sessionId = this.generateSessionId();
            const session = {
                id: sessionId,
                userId,
                isActive: true,
                startTime: new Date(),
                lastActivity: new Date(),
                commandCount: 0,
                language: 'en-US'
            };
            this.activeSessions.set(sessionId, session);
            await this.speechRecognition.startListening(sessionId, userId);
            await this.textToSpeech.speakResponse("Hello! I'm your AI assistant for the construction ERP system. How can I help you today?", 'normal');
            this.emit('session_started', session);
            console.log(`🎤 Voice AI session started: ${sessionId}`);
            return sessionId;
        }
        catch (error) {
            console.error('Error starting voice session:', error);
            throw error;
        }
    }
    async endVoiceSession(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            await this.speechRecognition.stopListening(sessionId);
            await this.textToSpeech.speakResponse(`Goodbye! I processed ${session.commandCount} commands in this session. Have a great day!`, 'normal');
            session.isActive = false;
            this.emit('session_ended', session);
            console.log(`🔇 Voice AI session ended: ${sessionId}`);
            setTimeout(() => {
                this.activeSessions.delete(sessionId);
            }, 5000);
        }
        catch (error) {
            console.error('Error ending voice session:', error);
            throw error;
        }
    }
    async processVoiceInput(sessionId, audioData) {
        const startTime = Date.now();
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session || !session.isActive) {
                throw new Error('Invalid or inactive session');
            }
            const speechResult = await this.speechRecognition.processAudioStream(sessionId, audioData);
            const transcript = speechResult.find(r => r.isFinal)?.transcript || '';
            if (!transcript) {
                throw new Error('No speech detected');
            }
            const nluResult = await this.nlService.processCommand(transcript);
            const executionContext = {
                userId: session.userId,
                sessionId,
                timestamp: new Date()
            };
            const commandResult = await this.commandExecutor.executeCommand(nluResult.intent.name, nluResult.entities, executionContext);
            await this.textToSpeech.speakResponse(commandResult.voiceResponse);
            const interaction = {
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
            session.lastActivity = new Date();
            session.commandCount++;
            this.interactionHistory.push(interaction);
            this.emit('interaction_completed', interaction);
            if (!commandResult.success) {
                this.emit('interaction_failed', interaction);
            }
            console.log(`🎯 Voice interaction completed: ${nluResult.intent.name} (${interaction.duration}ms)`);
            return interaction;
        }
        catch (error) {
            console.error('Error processing voice input:', error);
            await this.textToSpeech.speakResponse("I'm sorry, I encountered an error processing your request. Please try again.");
            throw error;
        }
    }
    getActiveSessionsCount() {
        return Array.from(this.activeSessions.values()).filter(s => s.isActive).length;
    }
    getSessionInfo(sessionId) {
        return this.activeSessions.get(sessionId) || null;
    }
    getInteractionHistory(sessionId, limit = 50) {
        let history = this.interactionHistory;
        if (sessionId) {
            history = history.filter(i => i.sessionId === sessionId);
        }
        return history
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getAnalytics() {
        const totalSessions = this.activeSessions.size;
        const activeSessions = this.getActiveSessionsCount();
        const totalInteractions = this.interactionHistory.length;
        const successfulInteractions = this.interactionHistory.filter(i => i.success);
        const successRate = totalInteractions > 0 ? (successfulInteractions.length / totalInteractions) * 100 : 0;
        const averageResponseTime = totalInteractions > 0 ?
            this.interactionHistory.reduce((sum, i) => sum + i.duration, 0) / totalInteractions : 0;
        const intentCounts = this.interactionHistory.reduce((acc, i) => {
            acc[i.intent] = (acc[i.intent] || 0) + 1;
            return acc;
        }, {});
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
    setupEventHandlers() {
        this.speechRecognition.on('command_recognized', (command) => {
            this.emit('speech_recognized', command);
        });
        this.speechRecognition.on('listening_started', (data) => {
            this.emit('listening_started', data);
        });
        this.speechRecognition.on('listening_stopped', (data) => {
            this.emit('listening_stopped', data);
        });
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 300000);
    }
    cleanupInactiveSessions() {
        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000;
        for (const [sessionId, session] of this.activeSessions) {
            if (now - session.lastActivity.getTime() > sessionTimeout) {
                console.log(`🧹 Cleaning up inactive session: ${sessionId}`);
                this.endVoiceSession(sessionId).catch(console.error);
            }
        }
    }
    generateSessionId() {
        return 'voice_session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    generateId() {
        return 'interaction_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.VoiceAIEngine = VoiceAIEngine;
exports.VoiceAIEngine = VoiceAIEngine = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [SpeechRecognitionService_1.SpeechRecognitionService,
        NaturalLanguageService_1.NaturalLanguageService,
        VoiceCommandExecutor_1.VoiceCommandExecutor,
        TextToSpeechService_1.TextToSpeechService])
], VoiceAIEngine);
//# sourceMappingURL=VoiceAIEngine.js.map
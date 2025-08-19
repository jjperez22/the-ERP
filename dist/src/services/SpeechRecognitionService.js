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
exports.SpeechRecognitionService = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
let SpeechRecognitionService = class SpeechRecognitionService extends events_1.EventEmitter {
    isListening = false;
    currentSession = null;
    activeStreams = new Map();
    config;
    constructor() {
        super();
        this.config = {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            maxAlternatives: 3
        };
    }
    async startListening(sessionId, userId) {
        try {
            console.log(`🎤 Starting speech recognition for session: ${sessionId}`);
            this.currentSession = sessionId;
            this.isListening = true;
            this.simulateSpeechRecognition(sessionId, userId);
            this.emit('listening_started', { sessionId, userId, timestamp: new Date() });
            return sessionId;
        }
        catch (error) {
            console.error('Error starting speech recognition:', error);
            throw error;
        }
    }
    async stopListening(sessionId) {
        try {
            console.log(`🔇 Stopping speech recognition for session: ${sessionId}`);
            if (this.activeStreams.has(sessionId)) {
                const stream = this.activeStreams.get(sessionId);
                clearInterval(stream);
                this.activeStreams.delete(sessionId);
            }
            this.isListening = false;
            this.currentSession = null;
            this.emit('listening_stopped', { sessionId, timestamp: new Date() });
        }
        catch (error) {
            console.error('Error stopping speech recognition:', error);
            throw error;
        }
    }
    async processAudioStream(sessionId, audioData) {
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const results = await this.simulateAudioProcessing(audioData);
            for (const result of results) {
                this.emit('speech_result', { sessionId, result });
            }
            return results;
        }
        catch (error) {
            console.error('Error processing audio stream:', error);
            throw error;
        }
    }
    async recognizeCommand(audioData, sessionId) {
        try {
            const speechResults = await this.processAudioStream(sessionId, audioData);
            const bestResult = speechResults.find(r => r.isFinal) || speechResults[0];
            if (!bestResult) {
                throw new Error('No speech detected');
            }
            const command = {
                id: this.generateId(),
                transcript: bestResult.transcript,
                intent: 'unknown',
                entities: {},
                confidence: bestResult.confidence,
                sessionId,
                timestamp: new Date()
            };
            this.emit('command_recognized', command);
            return command;
        }
        catch (error) {
            console.error('Error recognizing command:', error);
            throw error;
        }
    }
    getListeningStatus() {
        return {
            isListening: this.isListening,
            currentSession: this.currentSession,
            activeSessions: this.activeStreams.size
        };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 Speech recognition config updated:', this.config);
    }
    simulateSpeechRecognition(sessionId, userId) {
        const sampleCommands = [
            'show me inventory status',
            'create new order for customer John Doe',
            'what are today\'s sales figures',
            'check supplier performance',
            'add fifty cement bags to inventory',
            'generate purchase order for steel bars',
            'show me project progress for downtown construction',
            'update order status to shipped',
            'check low stock items',
            'create invoice for order number 1234'
        ];
        let commandIndex = 0;
        const interval = setInterval(() => {
            if (!this.isListening || !this.activeStreams.has(sessionId)) {
                clearInterval(interval);
                return;
            }
            if (Math.random() > 0.7) {
                const command = sampleCommands[commandIndex % sampleCommands.length];
                commandIndex++;
                const result = {
                    transcript: command,
                    confidence: 0.85 + Math.random() * 0.15,
                    isFinal: true,
                    timestamp: new Date(),
                    duration: 2000 + Math.random() * 3000
                };
                this.emit('speech_result', { sessionId, result });
                const voiceCommand = {
                    id: this.generateId(),
                    transcript: command,
                    intent: 'unknown',
                    entities: {},
                    confidence: result.confidence,
                    sessionId,
                    userId,
                    timestamp: new Date()
                };
                this.emit('command_recognized', voiceCommand);
            }
        }, 3000);
        this.activeStreams.set(sessionId, interval);
    }
    async simulateAudioProcessing(audioData) {
        const results = [];
        results.push({
            transcript: 'show me...',
            confidence: 0.6,
            isFinal: false,
            timestamp: new Date(),
            duration: 500
        });
        results.push({
            transcript: 'show me inventory status',
            confidence: 0.92,
            isFinal: true,
            timestamp: new Date(),
            duration: 1500
        });
        return results;
    }
    generateId() {
        return 'speech_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    async integrateWithGoogleSpeech(apiKey) {
        console.log('🌐 Integrating with Google Cloud Speech-to-Text...');
        return true;
    }
    async integrateWithAWSTranscribe(credentials) {
        console.log('🌐 Integrating with AWS Transcribe...');
        return true;
    }
    async integrateWithAzureSpeech(subscriptionKey) {
        console.log('🌐 Integrating with Azure Speech Services...');
        return true;
    }
};
exports.SpeechRecognitionService = SpeechRecognitionService;
exports.SpeechRecognitionService = SpeechRecognitionService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SpeechRecognitionService);
//# sourceMappingURL=SpeechRecognitionService.js.map
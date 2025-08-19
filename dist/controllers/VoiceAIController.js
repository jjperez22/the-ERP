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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAIController = void 0;
const warp_1 = require("@varld/warp");
const VoiceAIEngine_1 = require("../src/services/VoiceAIEngine");
const SpeechRecognitionService_1 = require("../src/services/SpeechRecognitionService");
const TextToSpeechService_1 = require("../src/services/TextToSpeechService");
const NaturalLanguageService_1 = require("../src/services/NaturalLanguageService");
let VoiceAIController = class VoiceAIController {
    voiceAI;
    speechRecognition;
    textToSpeech;
    nlService;
    constructor(voiceAI, speechRecognition, textToSpeech, nlService) {
        this.voiceAI = voiceAI;
        this.speechRecognition = speechRecognition;
        this.textToSpeech = textToSpeech;
        this.nlService = nlService;
    }
    async startVoiceSession(request) {
        try {
            const sessionId = await this.voiceAI.startVoiceSession(request.userId);
            return {
                success: true,
                data: {
                    sessionId,
                    message: 'Voice session started successfully'
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async endVoiceSession(sessionId) {
        try {
            await this.voiceAI.endVoiceSession(sessionId);
            return {
                success: true,
                message: 'Voice session ended successfully'
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getSessionStatus(sessionId) {
        try {
            const session = this.voiceAI.getSessionInfo(sessionId);
            if (!session) {
                return { success: false, error: 'Session not found' };
            }
            return {
                success: true,
                data: session
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async processAudioInput(sessionId, request) {
        try {
            const audioBuffer = new ArrayBuffer(1024);
            const interaction = await this.voiceAI.processVoiceInput(sessionId, audioBuffer);
            return {
                success: true,
                data: interaction
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async convertTextToSpeech(request) {
        try {
            const result = await this.textToSpeech.speak(request.text);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async convertSpeechToText(request) {
        try {
            const sessionId = request.sessionId || 'temp_session';
            const audioBuffer = new ArrayBuffer(1024);
            const results = await this.speechRecognition.processAudioStream(sessionId, audioBuffer);
            return {
                success: true,
                data: results
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async understandCommand(request) {
        try {
            const result = await this.nlService.processCommand(request.text);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getVoiceAnalytics() {
        try {
            const analytics = this.voiceAI.getAnalytics();
            return {
                success: true,
                data: analytics
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getInteractionHistory(query) {
        try {
            const { sessionId, limit = 50 } = query;
            const interactions = this.voiceAI.getInteractionHistory(sessionId, parseInt(limit));
            return {
                success: true,
                data: interactions
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateSpeechConfig(config) {
        try {
            this.speechRecognition.updateConfig(config);
            return {
                success: true,
                message: 'Speech recognition config updated'
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateTTSConfig(config) {
        try {
            this.textToSpeech.updateVoiceConfig(config);
            return {
                success: true,
                message: 'Text-to-speech config updated'
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async simulateVoiceCommand(request) {
        try {
            const sessionId = request.sessionId || await this.voiceAI.startVoiceSession();
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
};
exports.VoiceAIController = VoiceAIController;
__decorate([
    (0, warp_1.Post)('/session/start'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "startVoiceSession", null);
__decorate([
    (0, warp_1.Post)('/session/:sessionId/end'),
    __param(0, (0, warp_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "endVoiceSession", null);
__decorate([
    (0, warp_1.Get)('/session/:sessionId/status'),
    __param(0, (0, warp_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "getSessionStatus", null);
__decorate([
    (0, warp_1.Post)('/session/:sessionId/process-audio'),
    __param(0, (0, warp_1.Param)('sessionId')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "processAudioInput", null);
__decorate([
    (0, warp_1.Post)('/text-to-speech'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "convertTextToSpeech", null);
__decorate([
    (0, warp_1.Post)('/speech-to-text'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "convertSpeechToText", null);
__decorate([
    (0, warp_1.Post)('/understand-command'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "understandCommand", null);
__decorate([
    (0, warp_1.Get)('/analytics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "getVoiceAnalytics", null);
__decorate([
    (0, warp_1.Get)('/interactions'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "getInteractionHistory", null);
__decorate([
    (0, warp_1.Get)('/intents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "getAvailableIntents", null);
__decorate([
    (0, warp_1.Post)('/config/speech-recognition'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "updateSpeechConfig", null);
__decorate([
    (0, warp_1.Post)('/config/text-to-speech'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "updateTTSConfig", null);
__decorate([
    (0, warp_1.Get)('/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "getSystemStatus", null);
__decorate([
    (0, warp_1.Post)('/demo/simulate-command'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAIController.prototype, "simulateVoiceCommand", null);
exports.VoiceAIController = VoiceAIController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/voice'),
    __metadata("design:paramtypes", [VoiceAIEngine_1.VoiceAIEngine,
        SpeechRecognitionService_1.SpeechRecognitionService,
        TextToSpeechService_1.TextToSpeechService,
        NaturalLanguageService_1.NaturalLanguageService])
], VoiceAIController);
//# sourceMappingURL=VoiceAIController.js.map
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
exports.TextToSpeechService = void 0;
const warp_1 = require("@varld/warp");
let TextToSpeechService = class TextToSpeechService {
    config;
    isSpeaking = false;
    constructor() {
        this.config = {
            voice: 'en-US-Standard-A',
            rate: 1.0,
            pitch: 1.0,
            volume: 0.8,
            language: 'en-US'
        };
    }
    async speak(text, sessionId) {
        try {
            console.log(`🔊 Converting text to speech: "${text.substring(0, 50)}..."`);
            this.isSpeaking = true;
            const result = await this.simulateSpeechSynthesis(text);
            this.isSpeaking = false;
            return result;
        }
        catch (error) {
            this.isSpeaking = false;
            console.error('Error in text-to-speech:', error);
            throw error;
        }
    }
    async speakResponse(response, priority = 'normal') {
        try {
            const formattedResponse = this.formatForSpeech(response);
            await this.speak(formattedResponse);
            console.log(`🗣️ Voice response delivered: "${response}"`);
        }
        catch (error) {
            console.error('Error delivering voice response:', error);
        }
    }
    async simulateSpeechSynthesis(text) {
        const duration = Math.max(1000, text.length * 50);
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            id: this.generateId(),
            text,
            duration,
            timestamp: new Date(),
            success: true,
            audioUrl: `https://tts-api.example.com/audio/${this.generateId()}.mp3`
        };
    }
    formatForSpeech(text) {
        return text
            .replace(/\./g, '. ')
            .replace(/,/g, ', ')
            .replace(/\$(\d+)/g, '$1 dollars')
            .replace(/\b(success|error|warning|critical)\b/gi, (match) => `<emphasis>${match}</emphasis>`)
            .replace(/\s+/g, ' ')
            .trim();
    }
    updateVoiceConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 Voice config updated:', this.config);
    }
    getVoiceConfig() {
        return { ...this.config };
    }
    isSpeechActive() {
        return this.isSpeaking;
    }
    async integrateWithGoogleTTS(apiKey) {
        console.log('🌐 Integrating with Google Cloud Text-to-Speech...');
        return true;
    }
    async integrateWithAWSPolly(credentials) {
        console.log('🌐 Integrating with AWS Polly...');
        return true;
    }
    generateId() {
        return 'tts_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.TextToSpeechService = TextToSpeechService;
exports.TextToSpeechService = TextToSpeechService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TextToSpeechService);
//# sourceMappingURL=TextToSpeechService.js.map
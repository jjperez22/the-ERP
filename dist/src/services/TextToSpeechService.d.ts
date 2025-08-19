interface VoiceConfig {
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
    language: string;
}
interface SpeechSynthesisResult {
    id: string;
    text: string;
    audioUrl?: string;
    duration: number;
    timestamp: Date;
    success: boolean;
}
export declare class TextToSpeechService {
    private config;
    private isSpeaking;
    constructor();
    speak(text: string, sessionId?: string): Promise<SpeechSynthesisResult>;
    speakResponse(response: string, priority?: 'low' | 'normal' | 'high'): Promise<void>;
    private simulateSpeechSynthesis;
    private formatForSpeech;
    updateVoiceConfig(newConfig: Partial<VoiceConfig>): void;
    getVoiceConfig(): VoiceConfig;
    isSpeechActive(): boolean;
    integrateWithGoogleTTS(apiKey: string): Promise<boolean>;
    integrateWithAWSPolly(credentials: any): Promise<boolean>;
    private generateId;
}
export {};
//# sourceMappingURL=TextToSpeechService.d.ts.map
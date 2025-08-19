import { EventEmitter } from 'events';
interface SpeechConfig {
    language: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
}
interface SpeechResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
    timestamp: Date;
    duration: number;
}
interface VoiceCommand {
    id: string;
    transcript: string;
    intent: string;
    entities: Record<string, any>;
    confidence: number;
    sessionId: string;
    userId?: string;
    timestamp: Date;
}
export declare class SpeechRecognitionService extends EventEmitter {
    private isListening;
    private currentSession;
    private activeStreams;
    private config;
    constructor();
    startListening(sessionId: string, userId?: string): Promise<string>;
    stopListening(sessionId: string): Promise<void>;
    processAudioStream(sessionId: string, audioData: ArrayBuffer): Promise<SpeechResult[]>;
    recognizeCommand(audioData: ArrayBuffer, sessionId: string): Promise<VoiceCommand>;
    getListeningStatus(): {
        isListening: boolean;
        currentSession: string | null;
        activeSessions: number;
    };
    updateConfig(newConfig: Partial<SpeechConfig>): void;
    private simulateSpeechRecognition;
    private simulateAudioProcessing;
    private generateId;
    integrateWithGoogleSpeech(apiKey: string): Promise<boolean>;
    integrateWithAWSTranscribe(credentials: any): Promise<boolean>;
    integrateWithAzureSpeech(subscriptionKey: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=SpeechRecognitionService.d.ts.map
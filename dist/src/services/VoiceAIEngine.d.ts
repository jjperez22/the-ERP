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
export declare class VoiceAIEngine extends EventEmitter {
    private speechRecognition;
    private nlService;
    private commandExecutor;
    private textToSpeech;
    private activeSessions;
    private interactionHistory;
    constructor(speechRecognition: SpeechRecognitionService, nlService: NaturalLanguageService, commandExecutor: VoiceCommandExecutor, textToSpeech: TextToSpeechService);
    startVoiceSession(userId?: string): Promise<string>;
    endVoiceSession(sessionId: string): Promise<void>;
    processVoiceInput(sessionId: string, audioData: ArrayBuffer): Promise<VoiceInteraction>;
    getActiveSessionsCount(): number;
    getSessionInfo(sessionId: string): VoiceSession | null;
    getInteractionHistory(sessionId?: string, limit?: number): VoiceInteraction[];
    getAnalytics(): {
        totalSessions: number;
        activeSessions: number;
        totalInteractions: number;
        successRate: number;
        averageResponseTime: number;
        topIntents: Array<{
            intent: string;
            count: number;
        }>;
    };
    private setupEventHandlers;
    private cleanupInactiveSessions;
    private generateSessionId;
    private generateId;
}
export {};
//# sourceMappingURL=VoiceAIEngine.d.ts.map
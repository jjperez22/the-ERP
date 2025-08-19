import { DatabaseService } from '../../services/DatabaseService';
interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
    voiceResponse: string;
}
interface ExecutionContext {
    userId?: string;
    sessionId: string;
    timestamp: Date;
}
export declare class VoiceCommandExecutor {
    private databaseService;
    constructor(databaseService: DatabaseService);
    executeCommand(intent: string, entities: any[], context: ExecutionContext): Promise<CommandResult>;
    private handleCheckInventory;
    private handleAddInventory;
    private handleCheckSales;
    private handleHelp;
}
export {};
//# sourceMappingURL=VoiceCommandExecutor.d.ts.map
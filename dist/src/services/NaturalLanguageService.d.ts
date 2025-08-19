interface Intent {
    name: string;
    confidence: number;
    parameters: Record<string, any>;
}
interface Entity {
    type: string;
    value: string;
    confidence: number;
    start: number;
    end: number;
}
interface NLUResult {
    intent: Intent;
    entities: Entity[];
    originalText: string;
    processedAt: Date;
}
interface CommandPattern {
    pattern: RegExp;
    intent: string;
    entityExtractors: Array<{
        type: string;
        regex: RegExp;
        transform?: (match: string) => any;
    }>;
}
export declare class NaturalLanguageService {
    private commandPatterns;
    private entityTypes;
    constructor();
    processCommand(text: string): Promise<NLUResult>;
    private extractIntent;
    private extractEntities;
    private extractIntentSpecificEntities;
    private initializePatterns;
    private initializeEntityTypes;
    private normalizeText;
    private extractParametersFromMatch;
    addCustomPattern(pattern: CommandPattern): void;
    getAvailableIntents(): string[];
    getIntentExamples(): Record<string, string[]>;
    trainModel(trainingData: Array<{
        text: string;
        intent: string;
        entities: Entity[];
    }>): Promise<boolean>;
}
export {};
//# sourceMappingURL=NaturalLanguageService.d.ts.map
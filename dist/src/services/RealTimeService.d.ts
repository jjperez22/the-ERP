import { Server as HttpServer } from 'http';
import { AIOrchestrator } from './AIOrchestrator';
import { EventEmitter } from 'events';
export interface RealTimeEvent {
    type: 'inventory_update' | 'order_created' | 'ai_insight' | 'alert' | 'market_update' | 'system_notification';
    data: any;
    timestamp: Date;
    userId?: string;
    companyId?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export declare class RealTimeService extends EventEmitter {
    private aiOrchestrator;
    private io;
    private connectedClients;
    private userSubscriptions;
    private eventBuffer;
    constructor(aiOrchestrator: AIOrchestrator, server?: HttpServer);
    private initializeWebSocket;
    private handleClientConnection;
    private setupAIEventHandlers;
    private startRealTimeProcessing;
    private simulateInventoryUpdates;
    private simulateMarketUpdates;
    broadcastEvent(event: RealTimeEvent): void;
    private shouldReceiveEvent;
    private bufferEvent;
    private sendBufferedEvents;
    private cleanupBufferedEvents;
    private handleAIQuery;
    private handleActionRequest;
    private handleReorderProduct;
    private handleUpdatePrice;
    private handleSendAlert;
    private handleUpdateCustomerStatus;
    getConnectedClientsCount(): number;
    getUserSubscriptions(): Map<string, Set<string>>;
}
//# sourceMappingURL=RealTimeService.d.ts.map
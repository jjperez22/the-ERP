// src/services/RealTimeService.ts
import { Service } from '@varld/warp';
import { Server as SocketIOServer, Socket } from 'socket.io';
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

@Service()
export class RealTimeService extends EventEmitter {
  private io!: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map();
  private eventBuffer: Map<string, RealTimeEvent[]> = new Map();

  constructor(
    private aiOrchestrator: AIOrchestrator,
    server?: HttpServer
  ) {
    super();
    
    if (server) {
      this.initializeWebSocket(server);
    }
    this.setupAIEventHandlers();
    this.startRealTimeProcessing();
  }

  private initializeWebSocket(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.handleClientConnection(socket);
    });
  }

  private handleClientConnection(socket: Socket) {
    this.connectedClients.set(socket.id, socket);

    // Handle authentication and user identification
    socket.on('authenticate', (data: { userId: string, companyId: string, role: string }) => {
      socket.data.userId = data.userId;
      socket.data.companyId = data.companyId;
      socket.data.role = data.role;
      
      // Send buffered events for this user
      this.sendBufferedEvents(socket);
      
      console.log(`User authenticated: ${data.userId} (${data.role})`);
    });

    // Handle subscription to specific event types
    socket.on('subscribe', (eventTypes: string[]) => {
      const userId = socket.data.userId;
      if (userId) {
        if (!this.userSubscriptions.has(userId)) {
          this.userSubscriptions.set(userId, new Set());
        }
        eventTypes.forEach(type => this.userSubscriptions.get(userId)!.add(type));
      }
    });

    // Handle unsubscription
    socket.on('unsubscribe', (eventTypes: string[]) => {
      const userId = socket.data.userId;
      if (userId && this.userSubscriptions.has(userId)) {
        eventTypes.forEach(type => this.userSubscriptions.get(userId)!.delete(type));
      }
    });

    // Handle AI query requests
    socket.on('ai_query', async (query: { type: string, context: any }) => {
      try {
        const result = await this.handleAIQuery(query, socket.data);
        socket.emit('ai_response', { success: true, data: result });
      } catch (error) {
        socket.emit('ai_response', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Handle real-time action requests
    socket.on('action_request', async (action: { type: string, payload: any }) => {
      try {
        const result = await this.handleActionRequest(action, socket.data);
        socket.emit('action_response', { success: true, data: result });
        
        // Broadcast the action result to relevant users
        this.broadcastEvent({
          type: 'system_notification',
          data: {
            action: action.type,
            result,
            user: socket.data.userId
          },
          timestamp: new Date(),
          companyId: socket.data.companyId,
          priority: 'medium'
        });
      } catch (error) {
        socket.emit('action_response', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      this.connectedClients.delete(socket.id);
    });
  }

  private setupAIEventHandlers() {
    this.aiOrchestrator.on('insights_updated', (insights) => {
      this.broadcastEvent({
        type: 'ai_insight',
        data: { insights, type: 'batch_update' },
        timestamp: new Date(),
        priority: 'medium'
      });
    });

    this.aiOrchestrator.on('critical_alerts', (alerts) => {
      this.broadcastEvent({
        type: 'alert',
        data: { alerts, severity: 'critical' },
        timestamp: new Date(),
        priority: 'critical'
      });
    });
  }

  private startRealTimeProcessing() {
    // Simulate real-time inventory updates
    setInterval(() => {
      this.simulateInventoryUpdates();
    }, 15000); // Every 15 seconds

    // Simulate market data updates
    setInterval(() => {
      this.simulateMarketUpdates();
    }, 60000); // Every minute

    // Process and clear old buffered events
    setInterval(() => {
      this.cleanupBufferedEvents();
    }, 300000); // Every 5 minutes
  }

  private simulateInventoryUpdates() {
    const mockUpdate = {
      productId: 'P' + String(Math.floor(Math.random() * 8) + 1).padStart(3, '0'),
      productName: ['Lumber', 'Cement', 'Roofing', 'Wire', 'Pipe', 'Insulation', 'Drywall', 'Tiles'][Math.floor(Math.random() * 8)],
      quantityChange: Math.floor(Math.random() * 50) - 25, // -25 to +25
      newQuantity: Math.floor(Math.random() * 500) + 50,
      location: ['Warehouse A', 'Warehouse B', 'Warehouse C'][Math.floor(Math.random() * 3)],
      reason: ['Sale', 'Receiving', 'Adjustment', 'Transfer'][Math.floor(Math.random() * 4)]
    };

    this.broadcastEvent({
      type: 'inventory_update',
      data: mockUpdate,
      timestamp: new Date(),
      priority: Math.abs(mockUpdate.quantityChange) > 15 ? 'high' : 'medium'
    });
  }

  private simulateMarketUpdates() {
    const marketData = {
      category: ['Lumber', 'Concrete', 'Steel', 'Roofing'][Math.floor(Math.random() * 4)],
      priceChange: (Math.random() - 0.5) * 10, // -5% to +5%
      factors: ['Supply chain disruption', 'Seasonal demand', 'Economic indicators', 'Weather impact'][Math.floor(Math.random() * 4)],
      impact: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      forecast: Math.random() > 0.5 ? 'increasing' : 'decreasing'
    };

    this.broadcastEvent({
      type: 'market_update',
      data: marketData,
      timestamp: new Date(),
      priority: Math.abs(marketData.priceChange) > 3 ? 'high' : 'medium'
    });
  }

  public broadcastEvent(event: RealTimeEvent) {
    // Buffer the event for users who might connect later
    this.bufferEvent(event);

    // Send to connected clients
    this.connectedClients.forEach((socket) => {
      if (this.shouldReceiveEvent(socket, event)) {
        socket.emit('realtime_event', event);
      }
    });

    // Emit for other services to listen
    this.emit('event_broadcasted', event);
  }

  private shouldReceiveEvent(socket: Socket, event: RealTimeEvent): boolean {
    // Check if user is authenticated
    if (!socket.data.userId) return false;

    // Check company scope
    if (event.companyId && socket.data.companyId !== event.companyId) return false;

    // Check user scope
    if (event.userId && socket.data.userId !== event.userId) return false;

    // Check subscriptions
    const userSubs = this.userSubscriptions.get(socket.data.userId);
    if (userSubs && userSubs.size > 0 && !userSubs.has(event.type)) return false;

    // Always send critical events
    if (event.priority === 'critical') return true;

    return true;
  }

  private bufferEvent(event: RealTimeEvent) {
    const key = event.companyId || 'global';
    if (!this.eventBuffer.has(key)) {
      this.eventBuffer.set(key, []);
    }
    
    const buffer = this.eventBuffer.get(key)!;
    buffer.push(event);
    
    // Keep only last 50 events per company
    if (buffer.length > 50) {
      buffer.shift();
    }
  }

  private sendBufferedEvents(socket: Socket) {
    const companyId = socket.data.companyId;
    const buffer = this.eventBuffer.get(companyId) || this.eventBuffer.get('global') || [];
    
    // Send last 10 relevant events
    const recentEvents = buffer
      .filter(event => this.shouldReceiveEvent(socket, event))
      .slice(-10);
    
    if (recentEvents.length > 0) {
      socket.emit('buffered_events', recentEvents);
    }
  }

  private cleanupBufferedEvents() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    this.eventBuffer.forEach((buffer, key) => {
      const filtered = buffer.filter(event => event.timestamp > cutoffTime);
      this.eventBuffer.set(key, filtered);
    });
  }

  private async handleAIQuery(query: { type: string, context: any }, userData: any) {
    const aiContext = {
      userRole: userData.role || 'user',
      companySize: 'midsize' as const, // This would come from company settings
      industry: 'construction' as const,
      preferences: query.context || {}
    };

    switch (query.type) {
      case 'demand_forecast':
        return await this.aiOrchestrator.getDemandForecasts(aiContext);
      case 'inventory_optimization':
        return await this.aiOrchestrator.getInventoryOptimization(aiContext);
      case 'customer_intelligence':
        return await this.aiOrchestrator.getCustomerIntelligence(aiContext);
      case 'comprehensive_insights':
        return await this.aiOrchestrator.generateComprehensiveInsights(aiContext);
      default:
        throw new Error('Unknown AI query type');
    }
  }

  private async handleActionRequest(action: { type: string, payload: any }, userData: any) {
    // Handle various real-time actions
    switch (action.type) {
      case 'reorder_product':
        return this.handleReorderProduct(action.payload, userData);
      case 'update_price':
        return this.handleUpdatePrice(action.payload, userData);
      case 'send_alert':
        return this.handleSendAlert(action.payload, userData);
      case 'update_customer_status':
        return this.handleUpdateCustomerStatus(action.payload, userData);
      default:
        throw new Error('Unknown action type');
    }
  }

  private async handleReorderProduct(payload: any, userData: any) {
    // Simulate product reorder
    const result = {
      productId: payload.productId,
      quantity: payload.quantity,
      supplier: payload.supplier,
      estimatedCost: payload.quantity * payload.unitCost,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      poNumber: 'PO' + Date.now(),
      status: 'draft'
    };

    // Broadcast the reorder event
    this.broadcastEvent({
      type: 'order_created',
      data: {
        type: 'purchase_order',
        ...result
      },
      timestamp: new Date(),
      companyId: userData.companyId,
      priority: 'medium'
    });

    return result;
  }

  private async handleUpdatePrice(payload: any, userData: any) {
    // Simulate price update
    const result = {
      productId: payload.productId,
      oldPrice: payload.oldPrice,
      newPrice: payload.newPrice,
      reason: payload.reason,
      effectiveDate: payload.effectiveDate || new Date(),
      updatedBy: userData.userId
    };

    return result;
  }

  private async handleSendAlert(payload: any, userData: any) {
    // Send custom alert
    this.broadcastEvent({
      type: 'alert',
      data: {
        title: payload.title,
        message: payload.message,
        severity: payload.severity || 'info',
        sender: userData.userId
      },
      timestamp: new Date(),
      companyId: userData.companyId,
      priority: payload.severity === 'critical' ? 'critical' : 'medium'
    });

    return { sent: true, timestamp: new Date() };
  }

  private async handleUpdateCustomerStatus(payload: any, userData: any) {
    // Simulate customer status update
    const result = {
      customerId: payload.customerId,
      oldStatus: payload.oldStatus,
      newStatus: payload.newStatus,
      reason: payload.reason,
      updatedBy: userData.userId,
      updatedAt: new Date()
    };

    // Broadcast the update
    this.broadcastEvent({
      type: 'system_notification',
      data: {
        type: 'customer_status_changed',
        ...result
      },
      timestamp: new Date(),
      companyId: userData.companyId,
      priority: 'medium'
    });

    return result;
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public getUserSubscriptions(): Map<string, Set<string>> {
    return this.userSubscriptions;
  }
}

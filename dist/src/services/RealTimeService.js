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
exports.RealTimeService = void 0;
const warp_1 = require("@varld/warp");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const AIOrchestrator_1 = require("./AIOrchestrator");
const events_1 = require("events");
let RealTimeService = class RealTimeService extends events_1.EventEmitter {
    aiOrchestrator;
    io;
    connectedClients = new Map();
    userSubscriptions = new Map();
    eventBuffer = new Map();
    constructor(aiOrchestrator, server) {
        super();
        this.aiOrchestrator = aiOrchestrator;
        if (server) {
            this.initializeWebSocket(server);
        }
        this.setupAIEventHandlers();
        this.startRealTimeProcessing();
    }
    initializeWebSocket(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            this.handleClientConnection(socket);
        });
    }
    handleClientConnection(socket) {
        this.connectedClients.set(socket.id, socket);
        socket.on('authenticate', (data) => {
            socket.data.userId = data.userId;
            socket.data.companyId = data.companyId;
            socket.data.role = data.role;
            this.sendBufferedEvents(socket);
            console.log(`User authenticated: ${data.userId} (${data.role})`);
        });
        socket.on('subscribe', (eventTypes) => {
            const userId = socket.data.userId;
            if (userId) {
                if (!this.userSubscriptions.has(userId)) {
                    this.userSubscriptions.set(userId, new Set());
                }
                eventTypes.forEach(type => this.userSubscriptions.get(userId).add(type));
            }
        });
        socket.on('unsubscribe', (eventTypes) => {
            const userId = socket.data.userId;
            if (userId && this.userSubscriptions.has(userId)) {
                eventTypes.forEach(type => this.userSubscriptions.get(userId).delete(type));
            }
        });
        socket.on('ai_query', async (query) => {
            try {
                const result = await this.handleAIQuery(query, socket.data);
                socket.emit('ai_response', { success: true, data: result });
            }
            catch (error) {
                socket.emit('ai_response', { success: false, error: error.message });
            }
        });
        socket.on('action_request', async (action) => {
            try {
                const result = await this.handleActionRequest(action, socket.data);
                socket.emit('action_response', { success: true, data: result });
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
            }
            catch (error) {
                socket.emit('action_response', { success: false, error: error.message });
            }
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            this.connectedClients.delete(socket.id);
        });
    }
    setupAIEventHandlers() {
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
    startRealTimeProcessing() {
        setInterval(() => {
            this.simulateInventoryUpdates();
        }, 15000);
        setInterval(() => {
            this.simulateMarketUpdates();
        }, 60000);
        setInterval(() => {
            this.cleanupBufferedEvents();
        }, 300000);
    }
    simulateInventoryUpdates() {
        const mockUpdate = {
            productId: 'P' + String(Math.floor(Math.random() * 8) + 1).padStart(3, '0'),
            productName: ['Lumber', 'Cement', 'Roofing', 'Wire', 'Pipe', 'Insulation', 'Drywall', 'Tiles'][Math.floor(Math.random() * 8)],
            quantityChange: Math.floor(Math.random() * 50) - 25,
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
    simulateMarketUpdates() {
        const marketData = {
            category: ['Lumber', 'Concrete', 'Steel', 'Roofing'][Math.floor(Math.random() * 4)],
            priceChange: (Math.random() - 0.5) * 10,
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
    broadcastEvent(event) {
        this.bufferEvent(event);
        this.connectedClients.forEach((socket) => {
            if (this.shouldReceiveEvent(socket, event)) {
                socket.emit('realtime_event', event);
            }
        });
        this.emit('event_broadcasted', event);
    }
    shouldReceiveEvent(socket, event) {
        if (!socket.data.userId)
            return false;
        if (event.companyId && socket.data.companyId !== event.companyId)
            return false;
        if (event.userId && socket.data.userId !== event.userId)
            return false;
        const userSubs = this.userSubscriptions.get(socket.data.userId);
        if (userSubs && userSubs.size > 0 && !userSubs.has(event.type))
            return false;
        if (event.priority === 'critical')
            return true;
        return true;
    }
    bufferEvent(event) {
        const key = event.companyId || 'global';
        if (!this.eventBuffer.has(key)) {
            this.eventBuffer.set(key, []);
        }
        const buffer = this.eventBuffer.get(key);
        buffer.push(event);
        if (buffer.length > 50) {
            buffer.shift();
        }
    }
    sendBufferedEvents(socket) {
        const companyId = socket.data.companyId;
        const buffer = this.eventBuffer.get(companyId) || this.eventBuffer.get('global') || [];
        const recentEvents = buffer
            .filter(event => this.shouldReceiveEvent(socket, event))
            .slice(-10);
        if (recentEvents.length > 0) {
            socket.emit('buffered_events', recentEvents);
        }
    }
    cleanupBufferedEvents() {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.eventBuffer.forEach((buffer, key) => {
            const filtered = buffer.filter(event => event.timestamp > cutoffTime);
            this.eventBuffer.set(key, filtered);
        });
    }
    async handleAIQuery(query, userData) {
        const aiContext = {
            userRole: userData.role || 'user',
            companySize: 'midsize',
            industry: 'construction',
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
    async handleActionRequest(action, userData) {
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
    async handleReorderProduct(payload, userData) {
        const result = {
            productId: payload.productId,
            quantity: payload.quantity,
            supplier: payload.supplier,
            estimatedCost: payload.quantity * payload.unitCost,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            poNumber: 'PO' + Date.now(),
            status: 'draft'
        };
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
    async handleUpdatePrice(payload, userData) {
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
    async handleSendAlert(payload, userData) {
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
    async handleUpdateCustomerStatus(payload, userData) {
        const result = {
            customerId: payload.customerId,
            oldStatus: payload.oldStatus,
            newStatus: payload.newStatus,
            reason: payload.reason,
            updatedBy: userData.userId,
            updatedAt: new Date()
        };
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
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    getUserSubscriptions() {
        return this.userSubscriptions;
    }
};
exports.RealTimeService = RealTimeService;
exports.RealTimeService = RealTimeService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [AIOrchestrator_1.AIOrchestrator,
        http_1.Server])
], RealTimeService);
//# sourceMappingURL=RealTimeService.js.map
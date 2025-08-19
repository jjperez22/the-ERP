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
exports.NotificationService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("./DatabaseService");
let NotificationService = class NotificationService {
    databaseService;
    templates = new Map();
    subscriptions = new Map();
    retryQueue = [];
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.initializeTemplates();
        this.startRetryProcessor();
    }
    async send(notificationData) {
        try {
            const notification = {
                id: this.generateId(),
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                data: notificationData.data,
                priority: notificationData.priority || 'medium',
                channels: notificationData.channels || this.getDefaultChannels(notificationData.type),
                recipientId: notificationData.recipientId,
                recipientEmail: notificationData.recipientEmail,
                recipientPhone: notificationData.recipientPhone,
                status: 'pending',
                createdAt: new Date(),
                retryCount: 0,
                maxRetries: this.getMaxRetries(notificationData.priority || 'medium')
            };
            await this.databaseService.create('notifications', notification);
            await this.processNotification(notification);
            console.log(`📧 Notification sent: ${notification.type} - ${notification.title}`);
            return notification;
        }
        catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
    async sendBulk(notifications) {
        try {
            const results = [];
            for (const notificationData of notifications) {
                try {
                    const result = await this.send(notificationData);
                    results.push(result);
                }
                catch (error) {
                    console.error('Error in bulk notification:', error);
                    results.push({
                        error: error.message,
                        data: notificationData
                    });
                }
            }
            return results.filter(r => !r.error);
        }
        catch (error) {
            console.error('Error sending bulk notifications:', error);
            throw error;
        }
    }
    async getNotifications(recipientId, options = {}) {
        try {
            const { page = 1, limit = 20, status, type, unreadOnly } = options;
            let query = { recipientId };
            if (status)
                query.status = status;
            if (type)
                query.type = type;
            if (unreadOnly)
                query.readAt = { $exists: false };
            const skip = (page - 1) * limit;
            const notifications = await this.databaseService.find('notifications', query, {
                skip,
                limit,
                sort: { createdAt: -1 }
            });
            const total = await this.databaseService.count('notifications', query);
            return { notifications, total };
        }
        catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }
    async markAsRead(notificationId) {
        try {
            await this.databaseService.update('notifications', notificationId, {
                status: 'read',
                readAt: new Date()
            });
            console.log(`📖 Notification marked as read: ${notificationId}`);
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
    async markAllAsRead(recipientId) {
        try {
            const unreadNotifications = await this.databaseService.find('notifications', {
                recipientId,
                status: { $ne: 'read' }
            });
            let updatedCount = 0;
            for (const notification of unreadNotifications) {
                await this.markAsRead(notification.id);
                updatedCount++;
            }
            console.log(`📚 Marked ${updatedCount} notifications as read for user: ${recipientId}`);
            return updatedCount;
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    async subscribe(subscription) {
        try {
            this.subscriptions.set(subscription.userId, subscription);
            await this.databaseService.create('notification_subscriptions', subscription);
            console.log(`🔔 User subscribed to notifications: ${subscription.userId}`);
        }
        catch (error) {
            console.error('Error subscribing to notifications:', error);
            throw error;
        }
    }
    async unsubscribe(userId, channels) {
        try {
            const subscription = this.subscriptions.get(userId);
            if (subscription) {
                if (channels) {
                    for (const channel of channels) {
                        if (channel === 'email')
                            subscription.preferences.email = false;
                        if (channel === 'sms')
                            subscription.preferences.sms = false;
                        if (channel === 'push')
                            subscription.preferences.push = false;
                    }
                }
                else {
                    subscription.preferences = {
                        email: false,
                        sms: false,
                        push: false,
                        categories: []
                    };
                }
                this.subscriptions.set(userId, subscription);
                await this.databaseService.update('notification_subscriptions', userId, subscription);
            }
            console.log(`🔕 User unsubscribed from notifications: ${userId}`);
        }
        catch (error) {
            console.error('Error unsubscribing from notifications:', error);
            throw error;
        }
    }
    async createTemplate(template) {
        try {
            const newTemplate = {
                id: this.generateId(),
                ...template
            };
            this.templates.set(newTemplate.id, newTemplate);
            await this.databaseService.create('notification_templates', newTemplate);
            console.log(`📄 Notification template created: ${newTemplate.name}`);
            return newTemplate;
        }
        catch (error) {
            console.error('Error creating notification template:', error);
            throw error;
        }
    }
    async getTemplate(type) {
        try {
            for (const [_, template] of this.templates) {
                if (template.type === type) {
                    return template;
                }
            }
            const template = await this.databaseService.findOne('notification_templates', { type });
            if (template) {
                this.templates.set(template.id, template);
            }
            return template;
        }
        catch (error) {
            console.error('Error getting notification template:', error);
            return null;
        }
    }
    async getAnalytics(timeRange) {
        try {
            const notifications = await this.databaseService.find('notifications', {
                createdAt: {
                    $gte: timeRange.start,
                    $lte: timeRange.end
                }
            });
            const analytics = {
                total: notifications.length,
                byStatus: this.groupBy(notifications, 'status'),
                byType: this.groupBy(notifications, 'type'),
                byChannel: this.getChannelStats(notifications),
                deliveryRate: this.calculateDeliveryRate(notifications),
                readRate: this.calculateReadRate(notifications)
            };
            return analytics;
        }
        catch (error) {
            console.error('Error getting notification analytics:', error);
            throw error;
        }
    }
    async processNotification(notification) {
        try {
            const template = await this.getTemplate(notification.type);
            const subscription = this.subscriptions.get(notification.recipientId || 'anonymous');
            for (const channel of notification.channels) {
                if (!channel.enabled)
                    continue;
                if (subscription && !this.isChannelAllowed(channel.type, subscription.preferences)) {
                    continue;
                }
                switch (channel.type) {
                    case 'email':
                        await this.sendEmail(notification, template?.emailTemplate);
                        break;
                    case 'sms':
                        await this.sendSMS(notification, template?.smsTemplate);
                        break;
                    case 'push':
                        await this.sendPush(notification, template?.pushTemplate);
                        break;
                    case 'in_app':
                        await this.sendInApp(notification);
                        break;
                    case 'webhook':
                        await this.sendWebhook(notification, channel.config);
                        break;
                }
            }
            await this.databaseService.update('notifications', notification.id, {
                status: 'sent',
                sentAt: new Date()
            });
        }
        catch (error) {
            console.error('Error processing notification:', error);
            if (notification.retryCount < notification.maxRetries) {
                notification.retryCount++;
                this.retryQueue.push(notification);
            }
            else {
                await this.databaseService.update('notifications', notification.id, {
                    status: 'failed'
                });
            }
        }
    }
    async sendEmail(notification, template) {
        try {
            const subject = template?.subject || notification.title;
            const body = template?.htmlBody || notification.message;
            console.log(`📧 Email sent to ${notification.recipientEmail}: ${subject}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    async sendSMS(notification, template) {
        try {
            const message = template || notification.message;
            console.log(`📱 SMS sent to ${notification.recipientPhone}: ${message}`);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }
    async sendPush(notification, template) {
        try {
            const title = template?.title || notification.title;
            const body = template?.body || notification.message;
            console.log(`🔔 Push notification sent: ${title} - ${body}`);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }
    async sendInApp(notification) {
        try {
            await this.databaseService.create('in_app_notifications', {
                ...notification,
                displayed: false
            });
            console.log(`💬 In-app notification created: ${notification.title}`);
        }
        catch (error) {
            console.error('Error sending in-app notification:', error);
            throw error;
        }
    }
    async sendWebhook(notification, config) {
        try {
            const payload = {
                notification,
                timestamp: new Date().toISOString()
            };
            console.log(`🔗 Webhook sent to ${config?.url}: ${notification.type}`);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        catch (error) {
            console.error('Error sending webhook:', error);
            throw error;
        }
    }
    isChannelAllowed(channelType, preferences) {
        switch (channelType) {
            case 'email':
                return preferences.email;
            case 'sms':
                return preferences.sms;
            case 'push':
                return preferences.push;
            default:
                return true;
        }
    }
    getDefaultChannels(type) {
        const defaultChannels = [
            { type: 'in_app', enabled: true }
        ];
        if (['low_stock_alert', 'order_confirmation', 'system_alert'].includes(type)) {
            defaultChannels.push({ type: 'email', enabled: true });
        }
        if (['critical_alert', 'security_alert'].includes(type)) {
            defaultChannels.push({ type: 'sms', enabled: true });
        }
        return defaultChannels;
    }
    getMaxRetries(priority) {
        switch (priority) {
            case 'critical':
                return 5;
            case 'high':
                return 3;
            case 'medium':
                return 2;
            case 'low':
            default:
                return 1;
        }
    }
    startRetryProcessor() {
        setInterval(() => {
            this.processRetryQueue();
        }, 60000);
    }
    async processRetryQueue() {
        if (this.retryQueue.length === 0)
            return;
        console.log(`🔄 Processing ${this.retryQueue.length} notifications in retry queue`);
        const toRetry = this.retryQueue.splice(0, 10);
        for (const notification of toRetry) {
            try {
                await this.processNotification(notification);
            }
            catch (error) {
                console.error('Error in retry processing:', error);
            }
        }
    }
    initializeTemplates() {
        const defaultTemplates = [
            {
                id: 'template_001',
                name: 'Low Stock Alert',
                type: 'low_stock_alert',
                channels: [
                    { type: 'email', enabled: true },
                    { type: 'in_app', enabled: true }
                ],
                emailTemplate: {
                    subject: 'Low Stock Alert - {{productName}}',
                    htmlBody: '<h2>Low Stock Alert</h2><p>{{productName}} is running low. Current stock: {{quantity}}</p>',
                    textBody: 'Low Stock Alert: {{productName}} is running low. Current stock: {{quantity}}'
                },
                smsTemplate: 'Low Stock: {{productName}} ({{quantity}} remaining)'
            },
            {
                id: 'template_002',
                name: 'Order Confirmation',
                type: 'order_confirmation',
                channels: [
                    { type: 'email', enabled: true },
                    { type: 'in_app', enabled: true }
                ],
                emailTemplate: {
                    subject: 'Order Confirmation - {{orderNumber}}',
                    htmlBody: '<h2>Order Confirmed</h2><p>Your order {{orderNumber}} has been confirmed. Total: ${{total}}</p>',
                    textBody: 'Order Confirmed: {{orderNumber}} - Total: ${{total}}'
                }
            }
        ];
        for (const template of defaultTemplates) {
            this.templates.set(template.id, template);
        }
        console.log('✅ Default notification templates initialized');
    }
    groupBy(items, field) {
        return items.reduce((acc, item) => {
            const key = item[field] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    getChannelStats(notifications) {
        const channelStats = {};
        for (const notification of notifications) {
            for (const channel of notification.channels) {
                const key = channel.type;
                channelStats[key] = (channelStats[key] || 0) + 1;
            }
        }
        return channelStats;
    }
    calculateDeliveryRate(notifications) {
        if (notifications.length === 0)
            return 0;
        const delivered = notifications.filter(n => ['sent', 'delivered', 'read'].includes(n.status));
        return (delivered.length / notifications.length) * 100;
    }
    calculateReadRate(notifications) {
        if (notifications.length === 0)
            return 0;
        const read = notifications.filter(n => n.status === 'read');
        return (read.length / notifications.length) * 100;
    }
    generateId() {
        return 'notif_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], NotificationService);
//# sourceMappingURL=NotificationService.js.map
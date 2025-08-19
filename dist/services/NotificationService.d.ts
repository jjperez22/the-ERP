import { DatabaseService } from './DatabaseService';
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    channels: NotificationChannel[];
    recipientId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
    createdAt: Date;
    sentAt?: Date;
    readAt?: Date;
    retryCount: number;
    maxRetries: number;
}
interface NotificationChannel {
    type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
    enabled: boolean;
    config?: any;
}
interface NotificationTemplate {
    id: string;
    name: string;
    type: string;
    channels: NotificationChannel[];
    emailTemplate?: EmailTemplate;
    smsTemplate?: string;
    pushTemplate?: PushTemplate;
}
interface EmailTemplate {
    subject: string;
    htmlBody: string;
    textBody: string;
    attachments?: string[];
}
interface PushTemplate {
    title: string;
    body: string;
    icon?: string;
    badge?: number;
    data?: any;
}
interface NotificationSubscription {
    userId: string;
    email?: string;
    phone?: string;
    preferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
        categories: string[];
    };
}
export declare class NotificationService {
    private databaseService;
    private templates;
    private subscriptions;
    private retryQueue;
    constructor(databaseService: DatabaseService);
    send(notificationData: {
        type: string;
        title: string;
        message: string;
        data?: any;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        recipientId?: string;
        recipientEmail?: string;
        recipientPhone?: string;
        channels?: NotificationChannel[];
    }): Promise<Notification>;
    sendBulk(notifications: Array<{
        type: string;
        title: string;
        message: string;
        data?: any;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        recipientId?: string;
        recipientEmail?: string;
        recipientPhone?: string;
    }>): Promise<Notification[]>;
    getNotifications(recipientId: string, options?: {
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(recipientId: string): Promise<number>;
    subscribe(subscription: NotificationSubscription): Promise<void>;
    unsubscribe(userId: string, channels?: string[]): Promise<void>;
    createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate>;
    getTemplate(type: string): Promise<NotificationTemplate | null>;
    getAnalytics(timeRange: {
        start: Date;
        end: Date;
    }): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byChannel: Record<string, number>;
        deliveryRate: number;
        readRate: number;
    }>;
    private processNotification;
    private sendEmail;
    private sendSMS;
    private sendPush;
    private sendInApp;
    private sendWebhook;
    private isChannelAllowed;
    private getDefaultChannels;
    private getMaxRetries;
    private startRetryProcessor;
    private processRetryQueue;
    private initializeTemplates;
    private groupBy;
    private getChannelStats;
    private calculateDeliveryRate;
    private calculateReadRate;
    private generateId;
}
export {};
//# sourceMappingURL=NotificationService.d.ts.map
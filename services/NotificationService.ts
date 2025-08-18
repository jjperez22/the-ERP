// services/NotificationService.ts
import { Injectable } from '@varld/warp';
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

@Injectable()
export class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private retryQueue: Notification[] = [];

  constructor(private databaseService: DatabaseService) {
    this.initializeTemplates();
    this.startRetryProcessor();
  }

  async send(notificationData: {
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    recipientId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    channels?: NotificationChannel[];
  }): Promise<Notification> {
    try {
      const notification: Notification = {
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

      // Save notification to database
      await this.databaseService.create('notifications', notification);

      // Process notification immediately
      await this.processNotification(notification);

      console.log(`📧 Notification sent: ${notification.type} - ${notification.title}`);
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendBulk(notifications: Array<{
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    recipientId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
  }>): Promise<Notification[]> {
    try {
      const results = [];
      
      for (const notificationData of notifications) {
        try {
          const result = await this.send(notificationData);
          results.push(result);
        } catch (error) {
          console.error('Error in bulk notification:', error);
          results.push({
            error: error.message,
            data: notificationData
          });
        }
      }

      return results.filter(r => !r.error) as Notification[];
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  async getNotifications(recipientId: string, options: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { page = 1, limit = 20, status, type, unreadOnly } = options;
      
      let query: any = { recipientId };
      if (status) query.status = status;
      if (type) query.type = type;
      if (unreadOnly) query.readAt = { $exists: false };

      const skip = (page - 1) * limit;
      const notifications = await this.databaseService.find<Notification>('notifications', query, {
        skip,
        limit,
        sort: { createdAt: -1 }
      });

      const total = await this.databaseService.count('notifications', query);

      return { notifications, total };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.databaseService.update('notifications', notificationId, {
        status: 'read',
        readAt: new Date()
      });

      console.log(`📖 Notification marked as read: ${notificationId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    try {
      const unreadNotifications = await this.databaseService.find<Notification>('notifications', {
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async subscribe(subscription: NotificationSubscription): Promise<void> {
    try {
      this.subscriptions.set(subscription.userId, subscription);
      await this.databaseService.create('notification_subscriptions', subscription);
      
      console.log(`🔔 User subscribed to notifications: ${subscription.userId}`);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  async unsubscribe(userId: string, channels?: string[]): Promise<void> {
    try {
      const subscription = this.subscriptions.get(userId);
      
      if (subscription) {
        if (channels) {
          // Partial unsubscribe
          for (const channel of channels) {
            if (channel === 'email') subscription.preferences.email = false;
            if (channel === 'sms') subscription.preferences.sms = false;
            if (channel === 'push') subscription.preferences.push = false;
          }
        } else {
          // Full unsubscribe
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
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    }
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    try {
      const newTemplate: NotificationTemplate = {
        id: this.generateId(),
        ...template
      };

      this.templates.set(newTemplate.id, newTemplate);
      await this.databaseService.create('notification_templates', newTemplate);

      console.log(`📄 Notification template created: ${newTemplate.name}`);
      return newTemplate;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }

  async getTemplate(type: string): Promise<NotificationTemplate | null> {
    try {
      // First check in-memory cache
      for (const [_, template] of this.templates) {
        if (template.type === type) {
          return template;
        }
      }

      // Fallback to database
      const template = await this.databaseService.findOne<NotificationTemplate>('notification_templates', { type });
      
      if (template) {
        this.templates.set(template.id, template);
      }

      return template;
    } catch (error) {
      console.error('Error getting notification template:', error);
      return null;
    }
  }

  async getAnalytics(timeRange: { start: Date; end: Date }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byChannel: Record<string, number>;
    deliveryRate: number;
    readRate: number;
  }> {
    try {
      const notifications = await this.databaseService.find<Notification>('notifications', {
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
    } catch (error) {
      console.error('Error getting notification analytics:', error);
      throw error;
    }
  }

  private async processNotification(notification: Notification): Promise<void> {
    try {
      const template = await this.getTemplate(notification.type);
      const subscription = this.subscriptions.get(notification.recipientId || 'anonymous');

      for (const channel of notification.channels) {
        if (!channel.enabled) continue;

        // Check user preferences
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

      // Update notification status
      await this.databaseService.update('notifications', notification.id, {
        status: 'sent',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Error processing notification:', error);
      
      // Add to retry queue if not exceeded max retries
      if (notification.retryCount < notification.maxRetries) {
        notification.retryCount++;
        this.retryQueue.push(notification);
      } else {
        await this.databaseService.update('notifications', notification.id, {
          status: 'failed'
        });
      }
    }
  }

  private async sendEmail(notification: Notification, template?: EmailTemplate): Promise<void> {
    try {
      const subject = template?.subject || notification.title;
      const body = template?.htmlBody || notification.message;
      
      // In a real implementation, this would use nodemailer or similar
      console.log(`📧 Email sent to ${notification.recipientEmail}: ${subject}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private async sendSMS(notification: Notification, template?: string): Promise<void> {
    try {
      const message = template || notification.message;
      
      // In a real implementation, this would use Twilio or similar
      console.log(`📱 SMS sent to ${notification.recipientPhone}: ${message}`);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  private async sendPush(notification: Notification, template?: PushTemplate): Promise<void> {
    try {
      const title = template?.title || notification.title;
      const body = template?.body || notification.message;
      
      // In a real implementation, this would use Firebase or similar
      console.log(`🔔 Push notification sent: ${title} - ${body}`);
      
      // Simulate push sending delay
      await new Promise(resolve => setTimeout(resolve, 30));
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  private async sendInApp(notification: Notification): Promise<void> {
    try {
      // Store in-app notification in database for real-time display
      await this.databaseService.create('in_app_notifications', {
        ...notification,
        displayed: false
      });
      
      console.log(`💬 In-app notification created: ${notification.title}`);
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      throw error;
    }
  }

  private async sendWebhook(notification: Notification, config: any): Promise<void> {
    try {
      const payload = {
        notification,
        timestamp: new Date().toISOString()
      };
      
      // In a real implementation, this would make HTTP request
      console.log(`🔗 Webhook sent to ${config?.url}: ${notification.type}`);
      
      // Simulate webhook delay
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error sending webhook:', error);
      throw error;
    }
  }

  private isChannelAllowed(channelType: string, preferences: any): boolean {
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

  private getDefaultChannels(type: string): NotificationChannel[] {
    const defaultChannels: NotificationChannel[] = [
      { type: 'in_app', enabled: true }
    ];

    // Add email for important notifications
    if (['low_stock_alert', 'order_confirmation', 'system_alert'].includes(type)) {
      defaultChannels.push({ type: 'email', enabled: true });
    }

    // Add SMS for critical notifications
    if (['critical_alert', 'security_alert'].includes(type)) {
      defaultChannels.push({ type: 'sms', enabled: true });
    }

    return defaultChannels;
  }

  private getMaxRetries(priority: string): number {
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

  private startRetryProcessor(): void {
    setInterval(() => {
      this.processRetryQueue();
    }, 60000); // Process retry queue every minute
  }

  private async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    console.log(`🔄 Processing ${this.retryQueue.length} notifications in retry queue`);

    const toRetry = this.retryQueue.splice(0, 10); // Process up to 10 at a time
    
    for (const notification of toRetry) {
      try {
        await this.processNotification(notification);
      } catch (error) {
        console.error('Error in retry processing:', error);
      }
    }
  }

  private initializeTemplates(): void {
    // Initialize default templates
    const defaultTemplates: NotificationTemplate[] = [
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

  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private getChannelStats(notifications: Notification[]): Record<string, number> {
    const channelStats: Record<string, number> = {};
    
    for (const notification of notifications) {
      for (const channel of notification.channels) {
        const key = channel.type;
        channelStats[key] = (channelStats[key] || 0) + 1;
      }
    }

    return channelStats;
  }

  private calculateDeliveryRate(notifications: Notification[]): number {
    if (notifications.length === 0) return 0;
    
    const delivered = notifications.filter(n => ['sent', 'delivered', 'read'].includes(n.status));
    return (delivered.length / notifications.length) * 100;
  }

  private calculateReadRate(notifications: Notification[]): number {
    if (notifications.length === 0) return 0;
    
    const read = notifications.filter(n => n.status === 'read');
    return (read.length / notifications.length) * 100;
  }

  private generateId(): string {
    return 'notif_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

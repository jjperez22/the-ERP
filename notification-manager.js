/**
 * Construction ERP - Notification Manager
 * Handles push notification subscriptions, permissions, and in-app notifications
 */

class NotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = this.isSupported ? Notification.permission : 'denied';
        this.subscription = null;
        this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWKMBkehd_hQCsjKM5rKYlzjpgFXQME7bBUQw3tQFyF9YHKfGWo3THEs'; // Demo VAPID key
        
        this.notificationQueue = [];
        this.settings = this.loadSettings();
        
        console.log('🔔 NotificationManager initialized', {
            supported: this.isSupported,
            permission: this.permission
        });
        
        if (this.isSupported) {
            this.initializeSubscription();
        }
    }
    
    /**
     * Initialize push notification subscription
     */
    async initializeSubscription() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                this.subscription = await registration.pushManager.getSubscription();
                
                if (this.subscription) {
                    console.log('✅ Existing push subscription found');
                    this.updateSubscriptionOnServer();
                } else {
                    console.log('📱 No existing push subscription');
                }
            }
        } catch (error) {
            console.error('❌ Failed to initialize push subscription:', error);
        }
    }
    
    /**
     * Request notification permission from user
     */
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Push notifications are not supported');
        }
        
        if (this.permission === 'granted') {
            return 'granted';
        }
        
        if (this.permission === 'denied') {
            throw new Error('Push notifications are blocked. Please enable them in browser settings.');
        }
        
        try {
            this.permission = await Notification.requestPermission();
            console.log('🔔 Notification permission:', this.permission);
            
            if (this.permission === 'granted') {
                await this.subscribeToPush();
                this.showInAppNotification('🎉 Notifications Enabled', 'You will now receive important updates!', 'success');
            }
            
            return this.permission;
        } catch (error) {
            console.error('❌ Failed to request notification permission:', error);
            throw error;
        }
    }
    
    /**
     * Subscribe to push notifications
     */
    async subscribeToPush() {
        if (!this.isSupported || this.permission !== 'granted') {
            throw new Error('Cannot subscribe: notifications not supported or not permitted');
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Convert VAPID key
            const applicationServerKey = this.urlB64ToUint8Array(this.vapidPublicKey);
            
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            console.log('✅ Push notification subscription created:', this.subscription.endpoint);
            
            // Send subscription to server
            await this.updateSubscriptionOnServer();
            
            return this.subscription;
        } catch (error) {
            console.error('❌ Failed to subscribe to push notifications:', error);
            throw error;
        }
    }
    
    /**
     * Unsubscribe from push notifications
     */
    async unsubscribeFromPush() {
        if (!this.subscription) {
            console.log('📱 No subscription to unsubscribe from');
            return;
        }
        
        try {
            await this.subscription.unsubscribe();
            console.log('🔕 Unsubscribed from push notifications');
            
            // Remove subscription from server
            await this.removeSubscriptionFromServer();
            
            this.subscription = null;
            this.showInAppNotification('🔕 Notifications Disabled', 'You will no longer receive push notifications.', 'info');
        } catch (error) {
            console.error('❌ Failed to unsubscribe from push notifications:', error);
            throw error;
        }
    }
    
    /**
     * Send subscription to server
     */
    async updateSubscriptionOnServer() {
        if (!this.subscription) {
            return;
        }
        
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: this.subscription,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                console.log('✅ Subscription sent to server');
            } else {
                console.warn('⚠️ Failed to send subscription to server:', response.status);
            }
        } catch (error) {
            console.warn('⚠️ Could not send subscription to server:', error);
            // This is not critical for demo purposes
        }
    }
    
    /**
     * Remove subscription from server
     */
    async removeSubscriptionFromServer() {
        if (!this.subscription) {
            return;
        }
        
        try {
            const response = await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: this.subscription.endpoint
                })
            });
            
            if (response.ok) {
                console.log('✅ Subscription removed from server');
            } else {
                console.warn('⚠️ Failed to remove subscription from server:', response.status);
            }
        } catch (error) {
            console.warn('⚠️ Could not remove subscription from server:', error);
        }
    }
    
    /**
     * Show in-app notification
     */
    showInAppNotification(title, message, type = 'info', duration = 5000) {
        const notification = {
            id: this.generateId(),
            title,
            message,
            type, // 'success', 'error', 'warning', 'info'
            timestamp: Date.now(),
            duration
        };
        
        this.notificationQueue.push(notification);
        this.displayInAppNotification(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeInAppNotification(notification.id);
        }, duration);
        
        return notification.id;
    }
    
    /**
     * Display in-app notification in UI
     */
    displayInAppNotification(notification) {
        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.id = `notification-${notification.id}`;
        notificationEl.className = `notification notification--${notification.type}`;
        notificationEl.innerHTML = `
            <div class="notification__icon">
                ${this.getNotificationIcon(notification.type)}
            </div>
            <div class="notification__content">
                <div class="notification__title">${notification.title}</div>
                <div class="notification__message">${notification.message}</div>
            </div>
            <button class="notification__close" onclick="notificationManager.removeInAppNotification('${notification.id}')">
                ×
            </button>
        `;
        
        // Add styles if not already present
        this.ensureNotificationStyles();
        
        // Add to notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notificationEl);
        
        // Animate in
        setTimeout(() => {
            notificationEl.classList.add('notification--show');
        }, 100);
        
        console.log('🔔 In-app notification displayed:', notification.title);
    }
    
    /**
     * Remove in-app notification
     */
    removeInAppNotification(notificationId) {
        const notificationEl = document.getElementById(`notification-${notificationId}`);
        if (notificationEl) {
            notificationEl.classList.add('notification--hide');
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }
        
        // Remove from queue
        this.notificationQueue = this.notificationQueue.filter(n => n.id !== notificationId);
    }
    
    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Ensure notification styles are present
     */
    ensureNotificationStyles() {
        if (document.getElementById('notification-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
                width: 100%;
            }
            
            .notification {
                display: flex;
                align-items: flex-start;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 16px;
                margin-bottom: 12px;
                pointer-events: auto;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                border-left: 4px solid #3b82f6;
            }
            
            .notification--show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .notification--hide {
                opacity: 0;
                transform: translateX(100%);
            }
            
            .notification--success {
                border-left-color: #10b981;
            }
            
            .notification--error {
                border-left-color: #ef4444;
            }
            
            .notification--warning {
                border-left-color: #f59e0b;
            }
            
            .notification--info {
                border-left-color: #3b82f6;
            }
            
            .notification__icon {
                font-size: 20px;
                margin-right: 12px;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .notification__content {
                flex: 1;
                min-width: 0;
            }
            
            .notification__title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
                font-size: 14px;
            }
            
            .notification__message {
                color: #6b7280;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .notification__close {
                background: none;
                border: none;
                font-size: 18px;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 8px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .notification__close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            @media (max-width: 480px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .notification {
                    margin-bottom: 8px;
                    padding: 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Show browser push notification
     */
    async showPushNotification(title, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            console.warn('⚠️ Cannot show push notification - not supported or not permitted');
            return;
        }
        
        const defaultOptions = {
            body: '',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now()
            },
            requireInteraction: false,
            silent: false
        };
        
        const notificationOptions = { ...defaultOptions, ...options };
        
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, notificationOptions);
            console.log('🔔 Push notification shown:', title);
        } catch (error) {
            console.error('❌ Failed to show push notification:', error);
            // Fallback to in-app notification
            this.showInAppNotification(title, notificationOptions.body, 'info');
        }
    }
    
    /**
     * Test notification functionality
     */
    async testNotifications() {
        try {
            // Test in-app notification
            this.showInAppNotification('🧪 Test Notification', 'This is a test of the in-app notification system.', 'info');
            
            // Test push notification if enabled
            if (this.permission === 'granted') {
                await this.showPushNotification('🧪 Test Push Notification', {
                    body: 'This is a test of the push notification system.',
                    tag: 'test-notification'
                });
            }
            
            console.log('✅ Notification test completed');
        } catch (error) {
            console.error('❌ Notification test failed:', error);
            this.showInAppNotification('❌ Test Failed', error.message, 'error');
        }
    }
    
    /**
     * Load notification settings
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('erp_notification_settings');
            return settings ? JSON.parse(settings) : {
                enabled: true,
                types: {
                    orders: true,
                    inventory: true,
                    financial: true,
                    system: true
                },
                quiet_hours: {
                    enabled: false,
                    start: '22:00',
                    end: '08:00'
                }
            };
        } catch (error) {
            console.error('❌ Failed to load notification settings:', error);
            return {};
        }
    }
    
    /**
     * Save notification settings
     */
    saveSettings(settings) {
        try {
            this.settings = { ...this.settings, ...settings };
            localStorage.setItem('erp_notification_settings', JSON.stringify(this.settings));
            console.log('✅ Notification settings saved');
        } catch (error) {
            console.error('❌ Failed to save notification settings:', error);
        }
    }
    
    /**
     * Check if notifications should be shown (quiet hours, etc.)
     */
    shouldShowNotification(type = 'system') {
        if (!this.settings.enabled) {
            return false;
        }
        
        if (this.settings.types && !this.settings.types[type]) {
            return false;
        }
        
        // Check quiet hours
        if (this.settings.quiet_hours && this.settings.quiet_hours.enabled) {
            const now = new Date();
            const currentTime = now.getHours() * 100 + now.getMinutes();
            const startTime = this.parseTime(this.settings.quiet_hours.start);
            const endTime = this.parseTime(this.settings.quiet_hours.end);
            
            if (startTime > endTime) {
                // Quiet hours span midnight
                if (currentTime >= startTime || currentTime < endTime) {
                    return false;
                }
            } else {
                // Normal quiet hours
                if (currentTime >= startTime && currentTime < endTime) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Parse time string to minutes since midnight
     */
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 100 + minutes;
    }
    
    /**
     * Convert VAPID key from base64 to Uint8Array
     */
    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get subscription status
     */
    getStatus() {
        return {
            supported: this.isSupported,
            permission: this.permission,
            subscribed: !!this.subscription,
            endpoint: this.subscription?.endpoint || null,
            settings: this.settings
        };
    }
    
    /**
     * Show notification settings UI
     */
    showSettings() {
        // This would open a settings modal - for now just log current settings
        console.log('🔔 Current notification settings:', this.settings);
        this.showInAppNotification('⚙️ Settings', 'Check console for current notification settings.', 'info');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
} else if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
}

console.log('🔔 NotificationManager class loaded');

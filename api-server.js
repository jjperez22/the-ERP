// Mock API Server for Construction ERP
// Handles push notification subscriptions and data synchronization

const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// VAPID keys for push notifications (in production, store these securely)
const vapidKeys = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI8HcYbAUNNW7wt0VKOHrPY4s3l1EWMVVGNHf5hPy6FJWQxv_rWtmNWLj0',
  privateKey: 'T-GEQ_I0n2P7QlvKbwJFJz9LlKGGrVh0DGp-qcBa_x8'
};

webpush.setVapidDetails(
  'mailto:admin@constructerp.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory storage for demo (use database in production)
let subscriptions = [];
let notifications = [];
let syncData = {
  products: [],
  customers: [],
  orders: [],
  lastSync: new Date().toISOString()
};

// =============================================================================
// PUSH NOTIFICATION ENDPOINTS
// =============================================================================

// Get VAPID public key for client-side subscription
app.get('/api/vapid-public-key', (req, res) => {
  res.json({
    publicKey: vapidKeys.publicKey
  });
});

// Subscribe to push notifications
app.post('/api/notifications/subscribe', (req, res) => {
  const subscription = req.body;
  
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({
      error: 'Invalid subscription object',
      message: 'Subscription must include endpoint'
    });
  }
  
  // Check if subscription already exists
  const existingIndex = subscriptions.findIndex(
    sub => sub.endpoint === subscription.endpoint
  );
  
  if (existingIndex !== -1) {
    subscriptions[existingIndex] = subscription;
    console.log('🔄 Updated existing subscription');
  } else {
    subscriptions.push(subscription);
    console.log('🔔 New push notification subscription added');
  }
  
  res.status(201).json({
    success: true,
    message: 'Subscription saved successfully',
    subscriptionCount: subscriptions.length
  });
});

// Unsubscribe from push notifications
app.post('/api/notifications/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({
      error: 'Missing endpoint',
      message: 'Endpoint is required for unsubscribe'
    });
  }
  
  const initialLength = subscriptions.length;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  
  if (subscriptions.length < initialLength) {
    console.log('🔕 Push notification subscription removed');
    res.json({
      success: true,
      message: 'Successfully unsubscribed',
      subscriptionCount: subscriptions.length
    });
  } else {
    res.status(404).json({
      error: 'Subscription not found',
      message: 'No subscription found with the provided endpoint'
    });
  }
});

// Send push notification (for testing/admin)
app.post('/api/notifications/send', async (req, res) => {
  const { title, body, icon, badge, data } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({
      error: 'Missing notification data',
      message: 'Title and body are required'
    });
  }
  
  const notificationPayload = {
    title,
    body,
    icon: icon || '/assets/icons/icon-192x192.png',
    badge: badge || '/assets/icons/icon-72x72.png',
    data: data || { timestamp: new Date().toISOString() },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/assets/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  // Store notification for history
  const notification = {
    id: Date.now().toString(),
    ...notificationPayload,
    sentAt: new Date().toISOString(),
    recipientCount: subscriptions.length
  };
  notifications.unshift(notification);
  
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications = notifications.slice(0, 100);
  }
  
  // Send to all subscribers
  let successCount = 0;
  let errorCount = 0;
  
  const sendPromises = subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
      successCount++;
      return { success: true, endpoint: subscription.endpoint };
    } catch (error) {
      errorCount++;
      console.error('❌ Push notification failed:', error.message);
      
      // Remove invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        subscriptions = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
        console.log('🧤 Removed invalid subscription');
      }
      
      return { success: false, endpoint: subscription.endpoint, error: error.message };
    }
  });
  
  const results = await Promise.all(sendPromises);
  
  console.log(`📨 Sent push notification: ${successCount} success, ${errorCount} failed`);
  
  res.json({
    success: true,
    message: 'Push notification sent',
    results: {
      total: subscriptions.length,
      successful: successCount,
      failed: errorCount
    },
    notification: notification
  });
});

// =============================================================================
// DATA SYNCHRONIZATION ENDPOINTS
// =============================================================================

// Get sync data for offline storage
app.get('/api/sync/data', (req, res) => {
  const { lastSync } = req.query;
  
  console.log('🔄 Client requesting sync data, last sync:', lastSync);
  
  // In a real app, filter data based on lastSync timestamp
  const responseData = {
    ...syncData,
    serverTime: new Date().toISOString(),
    hasChanges: !lastSync || new Date(lastSync) < new Date(syncData.lastSync)
  };
  
  res.json(responseData);
});

// Upload data from client to server (offline changes)
app.post('/api/sync/upload', (req, res) => {
  const { products, customers, orders, clientTime } = req.body;
  
  console.log('📤 Client uploading sync data from:', clientTime);
  
  let mergedCount = 0;
  
  // Merge products
  if (products && products.length > 0) {
    products.forEach(product => {
      const existingIndex = syncData.products.findIndex(p => p.id === product.id || p.sku === product.sku);
      if (existingIndex !== -1) {
        syncData.products[existingIndex] = { ...syncData.products[existingIndex], ...product };
      } else {
        syncData.products.push(product);
      }
      mergedCount++;
    });
  }
  
  // Merge customers
  if (customers && customers.length > 0) {
    customers.forEach(customer => {
      const existingIndex = syncData.customers.findIndex(c => c.id === customer.id);
      if (existingIndex !== -1) {
        syncData.customers[existingIndex] = { ...syncData.customers[existingIndex], ...customer };
      } else {
        syncData.customers.push(customer);
      }
      mergedCount++;
    });
  }
  
  // Merge orders
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const existingIndex = syncData.orders.findIndex(o => o.id === order.id);
      if (existingIndex !== -1) {
        syncData.orders[existingIndex] = { ...syncData.orders[existingIndex], ...order };
      } else {
        syncData.orders.push(order);
      }
      mergedCount++;
    });
  }
  
  // Update last sync time
  syncData.lastSync = new Date().toISOString();
  
  console.log(`✅ Merged ${mergedCount} items from client`);
  
  res.json({
    success: true,
    message: `Successfully merged ${mergedCount} items`,
    serverTime: syncData.lastSync,
    itemCounts: {
      products: syncData.products.length,
      customers: syncData.customers.length,
      orders: syncData.orders.length
    }
  });
});

// Get notification history
app.get('/api/notifications/history', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  const startIndex = parseInt(offset);
  const endIndex = startIndex + parseInt(limit);
  const paginatedNotifications = notifications.slice(startIndex, endIndex);
  
  res.json({
    notifications: paginatedNotifications,
    total: notifications.length,
    limit: parseInt(limit),
    offset: parseInt(offset),
    hasMore: endIndex < notifications.length
  });
});

// Get subscription status
app.get('/api/notifications/status', (req, res) => {
  res.json({
    subscriptionCount: subscriptions.length,
    notificationsSent: notifications.length,
    serverTime: new Date().toISOString()
  });
});

console.log('🚀 Starting Construction ERP Mock API Server...');
app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`🔔 Push notifications: http://localhost:${PORT}/api/notifications/*`);
  console.log(`🔄 Data sync: http://localhost:${PORT}/api/sync/*`);
});

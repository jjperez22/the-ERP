// Construction ERP Service Worker
// Version 1.0.0

const CACHE_NAME = 'construction-erp-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Assets to cache immediately when service worker installs
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/favicon.svg',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  OFFLINE_PAGE
];

// API endpoints that should be cached with network-first strategy
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/products',
  '/api/customers', 
  '/api/orders',
  '/api/employees'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Static assets cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Cache cleanup completed');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(event.request)) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (isAPIRequest(event.request)) {
    // Network-first strategy for API calls
    event.respondWith(networkFirstStrategy(event.request));
  } else if (isNavigationRequest(event.request)) {
    // Navigation requests - serve cached page or offline page
    event.respondWith(navigationStrategy(event.request));
  } else {
    // Default: try network, fallback to cache
    event.respondWith(networkFallbackStrategy(event.request));
  }
});

// Strategy implementations

// Cache-first: Check cache first, fallback to network
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('[ServiceWorker] Cache miss, fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first strategy failed:', error);
    throw error;
  }
}

// Network-first: Try network first, fallback to cache
async function networkFirstStrategy(request) {
  try {
    console.log('[ServiceWorker] Network-first for:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful API responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[ServiceWorker] Cached API response:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // If no cache and network failed, return offline response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature is not available offline',
        offline: true
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Navigation strategy: For page requests
async function navigationStrategy(request) {
  try {
    console.log('[ServiceWorker] Navigation request:', request.url);
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Navigation failed, serving offline page');
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match(OFFLINE_PAGE);
    
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback offline page if not cached
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Construction ERP - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f8fafc;
              color: #1e293b;
            }
            .offline-icon { 
              font-size: 64px; 
              margin-bottom: 20px;
              color: #64748b;
            }
            .retry-btn {
              background: #1FB8CD;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">🏗️</div>
          <h1>You're Offline</h1>
          <p>Construction ERP is not available right now.<br>Please check your connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Network fallback strategy: Try network, fallback to cache
async function networkFallbackStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Helper functions

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.ico') ||
    pathname.includes('/assets/') ||
    pathname.includes('/fonts/')
  );
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Message handling for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    console.log('[ServiceWorker] Manual cache update requested');
    event.waitUntil(updateCache());
  }
});

// Manual cache update function
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    console.log('[ServiceWorker] Updating cache for', requests.length, 'items');
    
    const updatePromises = requests.map(async request => {
      try {
        const response = await fetch(request);
        if (response.status === 200) {
          await cache.put(request, response);
          console.log('[ServiceWorker] Updated cache for:', request.url);
        }
      } catch (error) {
        console.warn('[ServiceWorker] Failed to update cache for:', request.url, error);
      }
    });
    
    await Promise.allSettled(updatePromises);
    console.log('[ServiceWorker] Cache update completed');
  } catch (error) {
    console.error('[ServiceWorker] Cache update failed:', error);
  }
}

// Enhanced Background Sync for offline actions
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    console.log('[ServiceWorker] Background sync event:', event.tag);
    
    switch (event.tag) {
      case 'background-sync-erp':
        event.waitUntil(syncOfflineActions());
        break;
      case 'sync-products':
        event.waitUntil(syncSpecificData('products'));
        break;
      case 'sync-customers':
        event.waitUntil(syncSpecificData('customers'));
        break;
      case 'sync-orders':
        event.waitUntil(syncSpecificData('orders'));
        break;
      case 'sync-notifications':
        event.waitUntil(syncNotifications());
        break;
      default:
        console.log('[ServiceWorker] Unknown sync tag:', event.tag);
    }
  });
}

// Enhanced sync offline actions with retry logic
async function syncOfflineActions() {
  try {
    console.log('[ServiceWorker] Starting comprehensive offline sync');
    
    // Get offline actions from IndexedDB
    const offlineActions = await getOfflineActionsFromDB();
    
    if (offlineActions.length === 0) {
      console.log('[ServiceWorker] No offline actions to sync');
      return { success: true, synced: 0, failed: 0 };
    }
    
    console.log('[ServiceWorker] Syncing', offlineActions.length, 'offline actions');
    
    let syncResults = { success: 0, failed: 0, retryLater: 0 };
    
    // Process actions in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < offlineActions.length; i += batchSize) {
      const batch = offlineActions.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (action) => {
        try {
          const result = await syncSingleActionWithRetry(action);
          
          if (result.success) {
            await removeOfflineActionFromDB(action.id);
            syncResults.success++;
            console.log('[ServiceWorker] ✅ Synced action:', action.id);
            
            // Notify main thread of successful sync
            await notifyClientsOfSync(action, 'success');
          } else if (result.shouldRetry) {
            // Update retry count and schedule for later
            action.retryCount = (action.retryCount || 0) + 1;
            action.nextRetryAt = Date.now() + (Math.pow(2, action.retryCount) * 1000); // Exponential backoff
            
            if (action.retryCount < 5) {
              await updateOfflineActionInDB(action);
              syncResults.retryLater++;
              console.log('[ServiceWorker] ⏰ Will retry action later:', action.id);
            } else {
              await removeOfflineActionFromDB(action.id);
              syncResults.failed++;
              console.log('[ServiceWorker] ❌ Action failed after max retries:', action.id);
              await notifyClientsOfSync(action, 'failed');
            }
          } else {
            await removeOfflineActionFromDB(action.id);
            syncResults.failed++;
            console.log('[ServiceWorker] ❌ Action failed permanently:', action.id);
            await notifyClientsOfSync(action, 'failed');
          }
        } catch (error) {
          console.warn('[ServiceWorker] Error processing action:', action.id, error);
          syncResults.failed++;
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < offlineActions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('[ServiceWorker] Sync completed:', syncResults);
    
    // Notify clients of overall sync completion
    await broadcastMessage({
      type: 'SYNC_COMPLETED',
      results: syncResults,
      timestamp: Date.now()
    });
    
    return syncResults;
    
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
    await broadcastMessage({
      type: 'SYNC_ERROR',
      error: error.message,
      timestamp: Date.now()
    });
    throw error;
  }
}

// Sync specific data types
async function syncSpecificData(dataType) {
  try {
    console.log(`[ServiceWorker] Syncing ${dataType} data`);
    
    const actions = await getOfflineActionsByType(dataType);
    if (actions.length === 0) {
      console.log(`[ServiceWorker] No ${dataType} actions to sync`);
      return;
    }
    
    let successCount = 0;
    for (const action of actions) {
      try {
        const result = await syncSingleActionWithRetry(action);
        if (result.success) {
          await removeOfflineActionFromDB(action.id);
          successCount++;
        }
      } catch (error) {
        console.warn(`[ServiceWorker] Failed to sync ${dataType} action:`, error);
      }
    }
    
    console.log(`[ServiceWorker] Successfully synced ${successCount}/${actions.length} ${dataType} actions`);
    
  } catch (error) {
    console.error(`[ServiceWorker] Failed to sync ${dataType}:`, error);
  }
}

// Enhanced single action sync with retry logic
async function syncSingleActionWithRetry(action) {
  const maxRetryAttempts = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetryAttempts; attempt++) {
    try {
      console.log(`[ServiceWorker] Sync attempt ${attempt}/${maxRetryAttempts} for action:`, action.id);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...action.headers
        },
        body: action.body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        return { 
          success: true, 
          data: responseData,
          attempt 
        };
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - don't retry
        console.warn(`[ServiceWorker] Client error ${response.status} - not retrying:`, action.id);
        return { 
          success: false, 
          shouldRetry: false, 
          status: response.status,
          attempt 
        };
      } else {
        // Server error - retry
        lastError = new Error(`Server error: ${response.status}`);
        console.warn(`[ServiceWorker] Server error ${response.status} - will retry:`, action.id);
      }
      
    } catch (error) {
      lastError = error;
      console.warn(`[ServiceWorker] Network error on attempt ${attempt}:`, error.message);
      
      if (error.name === 'AbortError') {
        console.warn('[ServiceWorker] Request timed out');
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetryAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  return { 
    success: false, 
    shouldRetry: true, 
    error: lastError?.message || 'Unknown error',
    attempts: maxRetryAttempts 
  };
}

// Sync notifications
async function syncNotifications() {
  try {
    console.log('[ServiceWorker] Syncing pending notifications');
    
    const pendingNotifications = await getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      try {
        await self.registration.showNotification(notification.title, notification.options);
        await removePendingNotification(notification.id);
        console.log('[ServiceWorker] Displayed pending notification:', notification.title);
      } catch (error) {
        console.warn('[ServiceWorker] Failed to display notification:', error);
      }
    }
    
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync notifications:', error);
  }
}

// IndexedDB helper functions for offline actions
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ConstructionERP-ServiceWorker', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores for offline actions
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
      
      // Create store for pending notifications
      if (!db.objectStoreNames.contains('pendingNotifications')) {
        const store = db.createObjectStore('pendingNotifications', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Get all offline actions from IndexedDB
async function getOfflineActionsFromDB() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to get offline actions:', error);
    return [];
  }
}

// Get offline actions by type
async function getOfflineActionsByType(type) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    const index = store.index('type');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[ServiceWorker] Failed to get ${type} actions:`, error);
    return [];
  }
}

// Remove offline action from IndexedDB
async function removeOfflineActionFromDB(actionId) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(actionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to remove offline action:', error);
  }
}

// Update offline action in IndexedDB
async function updateOfflineActionInDB(action) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.put(action);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to update offline action:', error);
  }
}

// Get pending notifications
async function getPendingNotifications() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['pendingNotifications'], 'readonly');
    const store = transaction.objectStore('pendingNotifications');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to get pending notifications:', error);
    return [];
  }
}

// Remove pending notification
async function removePendingNotification(notificationId) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['pendingNotifications'], 'readwrite');
    const store = transaction.objectStore('pendingNotifications');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(notificationId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to remove pending notification:', error);
  }
}

// Add offline action to queue
async function addOfflineActionToDB(action) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    const actionWithMetadata = {
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
      priority: action.priority || 'normal'
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(actionWithMetadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to add offline action:', error);
  }
}

// Enhanced notification function with status
async function notifyClientsOfSync(action, status = 'success') {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETED',
      action: action,
      status: status,
      timestamp: Date.now()
    });
  });
}

// Legacy helper functions for compatibility
async function getOfflineActions() {
  return getOfflineActionsFromDB();
}

async function removeOfflineAction(actionId) {
  return removeOfflineActionFromDB(actionId);
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push notification received');
  
  const options = {
    body: 'You have new updates in Construction ERP',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Updates',
        icon: '/assets/icons/shortcut-dashboard.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/icon-72x72.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.title = payload.title || 'Construction ERP';
      options.body = payload.body || options.body;
      options.icon = payload.icon || options.icon;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.warn('[ServiceWorker] Failed to parse push payload:', error);
      options.title = 'Construction ERP';
    }
  } else {
    options.title = 'Construction ERP';
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  // Handle action buttons
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // If app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[ServiceWorker] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[ServiceWorker] Unhandled promise rejection:', event.reason);
});

// Utility function to broadcast messages to all clients
async function broadcastMessage(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage(message));
}

console.log('[ServiceWorker] Service worker script loaded');

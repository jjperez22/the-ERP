# Construction ERP API Server

This mock API server provides backend endpoints for push notifications and data synchronization in the Construction ERP Progressive Web Application.

## Features

### 🔔 Push Notifications
- VAPID key management for web push notifications
- Subscription management (subscribe/unsubscribe)
- Send notifications to all subscribers
- Notification history tracking
- Support for different notification types (info, warning, error, success)

### 📊 Data Synchronization
- Fetch latest data from server
- Upload offline changes from PWA
- Conflict resolution for data sync
- Support for products, customers, and orders
- Timestamp-based synchronization

### 🛡️ Security & CORS
- CORS enabled for cross-origin requests
- JSON body parsing middleware
- Error handling and validation

## Quick Start

### 1. Install Dependencies

```bash
# Use the API-specific package.json
cp api-package.json package.json
npm install
```

### 2. Start the Server

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

The server will start on `http://localhost:3001`

### 3. Test the API

```bash
# Run the test script
npm run test-notification

# Or run directly
node test-notification.js
```

## API Endpoints

### Push Notifications

#### Get VAPID Public Key
```http
GET /api/vapid-public-key
```
Returns the VAPID public key for push notification subscription.

**Response:**
```json
{
  "publicKey": "your-vapid-public-key-here"
}
```

#### Subscribe to Notifications
```http
POST /api/subscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "key-data",
    "auth": "auth-data"
  }
}
```

#### Send Notification
```http
POST /api/send-notification
Content-Type: application/json

{
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info",
  "data": {
    "action": "view_order",
    "orderId": "12345"
  }
}
```

#### Get Notification History
```http
GET /api/notifications/history
```

#### Check Subscription Status
```http
GET /api/subscription/status
```

### Data Synchronization

#### Get Sync Data
```http
GET /api/sync/data
```
Returns all current data for synchronization.

**Response:**
```json
{
  "products": [...],
  "customers": [...],
  "orders": [...],
  "lastSync": "2024-01-15T10:30:00.000Z"
}
```

#### Upload Offline Changes
```http
POST /api/sync/upload
Content-Type: application/json

{
  "products": [
    {
      "id": "temp-123",
      "name": "New Product",
      "action": "create",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "customers": [...],
  "orders": [...]
}
```

## Configuration

### Environment Variables

You can set these environment variables:

```bash
# Server port (default: 3001)
PORT=3001

# VAPID keys (auto-generated if not provided)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

### VAPID Keys

The server automatically generates VAPID keys if not provided. For production, you should set your own keys:

```bash
# Generate VAPID keys using web-push
npx web-push generate-vapid-keys
```

## Integration with PWA

The Construction ERP PWA (`index.html`) is already configured to work with this API server:

1. **Push Notifications**: The PWA subscribes to notifications and handles incoming push messages
2. **Data Sync**: Offline data is synchronized when the connection is restored
3. **Service Worker**: Handles background sync and push notification display

### PWA Configuration

In your PWA, update the API base URL if needed:

```javascript
// In index.html or your PWA code
const API_BASE_URL = 'http://localhost:3001';
```

## Sample Data

The API server includes sample data for testing:

- **Products**: Construction materials with pricing
- **Customers**: Construction companies and contacts
- **Orders**: Sample orders with status tracking

## Development

### File Structure
```
.
├── api-server.js          # Main API server
├── api-package.json       # Dependencies for API server
├── test-notification.js   # Test script
└── API-SERVER-README.md   # This documentation
```

### Adding New Endpoints

To add new API endpoints, edit `api-server.js`:

```javascript
// Add new endpoint
app.get('/api/your-endpoint', (req, res) => {
  res.json({ message: 'Your response' });
});
```

### Testing

The `test-notification.js` script tests all endpoints:

- ✅ VAPID public key retrieval
- ✅ Push notification subscription
- ✅ Send push notification
- ✅ Notification history retrieval
- ✅ Data synchronization
- ✅ Offline changes upload

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `api-server.js` or kill the process using port 3001
2. **CORS errors**: The server has CORS enabled, but check your PWA origin
3. **Push notification failures**: Ensure VAPID keys are properly configured
4. **Module not found**: Run `npm install` using `api-package.json`

### Debug Mode

The server logs all requests and responses. Check the console for detailed information.

### Testing Push Notifications

To test push notifications:

1. Start the API server
2. Open the Construction ERP PWA
3. Allow notifications when prompted
4. Use the test script or send POST requests to `/api/send-notification`

## Production Deployment

For production deployment:

1. Set proper VAPID keys
2. Configure HTTPS
3. Set up proper database (replace in-memory storage)
4. Add authentication middleware
5. Set up proper logging
6. Configure environment variables

```bash
# Example production start
PORT=80 VAPID_SUBJECT="mailto:admin@yourcompany.com" npm start
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **web-push**: Push notification library
- **nodemon**: Development auto-restart (dev dependency)

## License

MIT License - see the main project for details.

---

🏗️ **Construction ERP API Server** - Built for progressive web applications with offline-first capabilities.

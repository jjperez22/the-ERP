# Construction ERP API Documentation

A comprehensive RESTful API for the Construction ERP Demo system with authentication, third-party integrations, and data import/export capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm 8+

### Installation
```bash
npm install
```

### Running the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API server will start on `http://localhost:3001`

## 🔐 Authentication

The API uses JWT tokens for authentication with OAuth2-style endpoints.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@constructerp.com",
  "password": "admin123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h",
    "user": {
      "id": "user-001",
      "email": "admin@constructerp.com",
      "name": "John Admin",
      "role": "administrator",
      "permissions": ["read", "write", "delete", "admin"]
    }
  }
}
```

### Using the Token
Include the access token in all subsequent API requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Demo Accounts
- **Admin:** `admin@constructerp.com` / `admin123`
- **Manager:** `manager@constructerp.com` / `manager123`

## 📋 Core API Endpoints

### Products

#### Get All Products
```http
GET /api/products?page=1&limit=50&category=Lumber&search=2x4
```

#### Get Product by ID
```http
GET /api/products/P001
```

#### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "sku": "LUM-2x6-001",
  "name": "2x6 Lumber - 10ft",
  "category": "Lumber",
  "price": 8.99,
  "cost": 5.99,
  "stock": 250,
  "reorderPoint": 50,
  "supplier": "Northwest Lumber Co",
  "location": "Warehouse A"
}
```

#### Update Product
```http
PUT /api/products/P001
Content-Type: application/json

{
  "price": 5.49,
  "stock": 400
}
```

#### Bulk Update Stock
```http
POST /api/products/bulk-update-stock
Content-Type: application/json

{
  "updates": [
    {"id": "P001", "stock": 500},
    {"sku": "LUM-2x4-001", "stock": 300}
  ]
}
```

### Customers

#### Get All Customers
```http
GET /api/customers?type=General%20Contractor&churnRisk=High
```

#### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "name": "XYZ Construction Corp",
  "type": "General Contractor",
  "email": "contact@xyz-construction.com",
  "phone": "(555) 234-5678",
  "address": "456 Builder St, Phoenix, AZ 85001",
  "paymentTerms": "Net 30"
}
```

#### Assess Churn Risk
```http
POST /api/customers/C001/assess-churn-risk
```

### Orders

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerId": "C001",
  "items": [
    {
      "productId": "P001",
      "quantity": 100,
      "unitPrice": 4.99
    },
    {
      "productId": "P002", 
      "quantity": 50
    }
  ],
  "notes": "Rush order for Project Phoenix",
  "priority": "High"
}
```

#### Update Order Status
```http
PATCH /api/orders/ORD001/status
Content-Type: application/json

{
  "status": "Shipped",
  "notes": "Shipped via FedEx, tracking #1234567890"
}
```

### Employees

#### Get All Employees
```http
GET /api/employees?department=Construction&status=Active
```

#### Create Employee
```http
POST /api/employees
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@constructerp.com",
  "phone": "(555) 345-6789",
  "position": "Site Manager",
  "department": "Construction", 
  "salary": 75000,
  "payType": "Salary",
  "hireDate": "2024-01-15",
  "manager": "John Smith",
  "skills": ["Site Management", "Safety", "Scheduling"]
}
```

## 🔌 Third-Party Integrations

### Get Integration Status
```http
GET /api/integrations
```

### Connect to QuickBooks
```http
POST /api/integrations/quickbooks/connect
Content-Type: application/json

{
  "companyId": "123456",
  "code": "auth_code_from_quickbooks"
}
```

### Sync Integration Data
```http
POST /api/integrations/accounting/quickbooks/sync
Content-Type: application/json

{
  "syncType": "full"
}
```

### Disconnect Integration
```http
POST /api/integrations/accounting/quickbooks/disconnect
```

## 📤 Data Import/Export

### Export Products
```http
GET /api/export/products/csv?format=csv
```

### Import Products from CSV
```http
POST /api/import/products/csv
Content-Type: multipart/form-data

file: [CSV file with columns: sku,name,category,price,cost,stock,reorderPoint,supplier,location]
```

### Bulk Export
```http
POST /api/export/bulk
Content-Type: application/json

{
  "entities": ["products", "customers", "orders"],
  "format": "json"
}
```

## 🪝 Webhooks

### Create Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/construction-erp",
  "events": ["product.created", "order.status_changed"],
  "active": true,
  "description": "Main webhook for order updates"
}
```

### Webhook Event Types
- `product.created` - New product added
- `product.updated` - Product modified
- `customer.created` - New customer added
- `order.created` - New order placed
- `order.status_changed` - Order status updated
- `quickbooks.data_changed` - QuickBooks data synchronized
- `salesforce.record_updated` - Salesforce record changed

### Webhook Payload Format
```json
{
  "event": "order.status_changed",
  "data": {
    "orderId": "ORD001",
    "oldStatus": "Processing",
    "newStatus": "Shipped",
    "customer": "ABC Construction Co",
    "total": 4567.89
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Analytics Endpoints

### Product Analytics
```http
GET /api/products/analytics
```

### Customer Analytics  
```http
GET /api/customers/analytics
```

### Order Analytics
```http
GET /api/orders/analytics
```

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-based permissions** (read, write, delete, admin)
- **Rate limiting** (100 requests per 15 minutes, 5 auth attempts per 15 minutes)
- **CORS protection** with configurable origins
- **Helmet.js** security headers
- **Input validation** and sanitization
- **Audit logging** for all operations

## 📝 Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    "product": { ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

### Common Error Codes
- `MISSING_TOKEN` - Authorization token required
- `TOKEN_EXPIRED` - Access token has expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource with same identifier exists

## 🧪 Testing

### Run Tests
```bash
npm test

# Watch mode
npm run test:watch
```

### Test with cURL

#### Login and get token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@constructerp.com","password":"admin123"}'
```

#### Get products with authentication
```bash
curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🚀 Deployment

### Environment Variables
```bash
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-frontend.com,https://admin.your-app.com
```

### Production Setup
1. Set strong JWT secrets
2. Configure allowed CORS origins
3. Set up HTTPS with SSL certificates
4. Use a production database (PostgreSQL/MongoDB)
5. Set up monitoring and logging
6. Configure reverse proxy (Nginx)

## 📈 Performance

- **Pagination** available on all list endpoints (default: 50 items)
- **Filtering and sorting** on major data endpoints
- **Compression** middleware for response optimization
- **Rate limiting** to prevent abuse
- **Efficient data structures** with indexed lookups

## 🔧 Customization

The API is designed to be easily extensible:

1. **Add new endpoints** in the `/routes` directory
2. **Extend data models** in the `appData` structure
3. **Add custom middleware** for additional security/logging
4. **Integrate new third-party services** via the integrations system
5. **Custom webhook events** for specific business logic

---

For additional support or feature requests, please refer to the project repository or contact the development team.

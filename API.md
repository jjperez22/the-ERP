# RESTful API Documentation

This document describes the enhanced RESTful API architecture with OpenAPI documentation, JWT authentication, and role-based access control.

## 🚀 Quick Start

### 1. Access Interactive Documentation
Once the server is running:
- **Swagger UI**: http://localhost:3000/api-docs
- **JSON Spec**: http://localhost:3000/api-docs.json

### 2. Authentication Flow
```bash
# Login to get JWT token
POST /api/auth/login
{
  "email": "admin@construction-erp.com",
  "password": "admin123"
}

# Use token in subsequent requests
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication & Authorization

### Pre-created Test Users
| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@construction-erp.com | admin123 | admin | Full system access |
| manager@construction-erp.com | manager123 | manager | Project management |
| user@construction-erp.com | user123 | user | Read-only access |

### Role-Based Permissions

#### Admin
- ✅ Create/Read/Update/Delete products
- ✅ Create/Read/Update/Delete projects
- ✅ Register new users
- ✅ View all projects regardless of manager

#### Manager
- ✅ Create/Read/Update products
- ✅ Create/Read/Update their own projects
- ❌ Delete resources
- ❌ Register users
- ❌ View other managers' projects

#### User
- ✅ Read products and projects
- ✅ View their profile
- ❌ Create/Update/Delete resources

## 📋 API Endpoints Overview

### Authentication Routes (`/api/auth`)
- `POST /login` - User authentication
- `POST /register` - User registration (admin only)
- `GET /profile` - Current user profile
- `POST /refresh` - Refresh JWT token

### Products API (`/api/products`)
- `GET /` - List products (with filtering & pagination)
- `GET /:id` - Get product by ID
- `POST /` - Create product (admin/manager)
- `PUT /:id` - Update product (admin/manager)
- `DELETE /:id` - Delete product (admin only)

### Projects API (`/api/projects`)
- `GET /` - List projects (role-based filtering)
- `GET /:id` - Get project by ID
- `POST /` - Create project (admin/manager)
- `PUT /:id` - Update project (admin/manager)
- `DELETE /:id` - Delete project (admin only)

## 📖 Detailed API Examples

### Authentication Examples

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@construction-erp.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "email": "admin@construction-erp.com",
      "name": "Administrator",
      "role": "admin"
    },
    "expiresIn": "24h"
  }
}
```

#### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

### Products API Examples

#### List Products with Filters
```bash
# Get all products
curl http://localhost:3000/api/products

# Filter by category with pagination
curl "http://localhost:3000/api/products?category=Materials&page=1&limit=5"

# Filter active products only
curl "http://localhost:3000/api/products?active=true"
```

#### Create Product (Authenticated)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "High-Grade Steel Rebar",
    "description": "Premium construction steel rebar #4",
    "price": 145.75,
    "category": "Steel Materials",
    "sku": "SR-004-HG",
    "stockQuantity": 500
  }'
```

#### Update Product
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "price": 155.00,
    "stockQuantity": 750
  }'
```

### Projects API Examples

#### List Projects
```bash
# All projects (admin view)
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/projects

# Filter by status
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/projects?status=in-progress"

# Manager's own projects only
curl -H "Authorization: Bearer <manager-token>" \
  http://localhost:3000/api/projects
```

#### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Modern Residential Complex",
    "description": "75-unit residential development",
    "status": "planning",
    "budget": 4500000,
    "startDate": "2024-08-01",
    "endDate": "2025-06-30",
    "managerId": "2",
    "clientName": "Horizon Developments",
    "location": "789 Maple Street, Suburbs"
  }'
```

## 🔍 Query Parameters

### Pagination (Available on list endpoints)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Product Filters
- `category` - Filter by category name
- `active` - Filter by active status (true/false)

### Project Filters
- `status` - Filter by project status
  - `planning`
  - `in-progress`
  - `completed`
  - `on-hold`
  - `cancelled`
- `managerId` - Filter by manager (admin only)

## 📄 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## 🚨 Common Error Codes

### Authentication Errors
- `AUTH_TOKEN_MISSING` - No authorization header provided
- `AUTH_TOKEN_INVALID` - Invalid or expired JWT token
- `AUTH_INVALID_CREDENTIALS` - Wrong email/password combination
- `AUTH_ACCOUNT_DEACTIVATED` - User account is deactivated

### Authorization Errors
- `AUTH_REQUIRED` - Authentication required for this endpoint
- `AUTH_INSUFFICIENT_PERMISSIONS` - User role lacks required permissions
- `ACCESS_DENIED` - Access denied for specific resource

### Validation Errors
- `VALIDATION_ERROR` - Missing or invalid required fields
- `SKU_DUPLICATE` - Product SKU already exists
- `INVALID_STATUS` - Invalid project status value
- `INVALID_BUDGET` - Budget must be a positive number

### Resource Errors
- `PRODUCT_NOT_FOUND` - Product with specified ID not found
- `PROJECT_NOT_FOUND` - Project with specified ID not found
- `USER_NOT_FOUND` - User not found

## 🛡 Security Features

### JWT Token Security
- Tokens expire after 24 hours
- Secure token generation with configurable secrets
- Token refresh capability

### Input Validation
- All inputs validated before processing
- SQL injection prevention
- XSS protection

### Role-Based Access Control
- Fine-grained permissions per endpoint
- Resource-level access control
- Manager can only access their own projects

## 🔧 API Architecture

### File Structure
```
api/
├── docs/
│   └── swagger.ts         # OpenAPI configuration
├── middleware/
│   └── auth.ts           # JWT authentication middleware
└── routes/
    ├── auth.ts           # Authentication endpoints
    ├── products.ts       # Products CRUD endpoints
    └── projects.ts       # Projects CRUD endpoints
```

### Key Features
- **RESTful Design**: Clean URL structure following REST principles
- **OpenAPI 3.0**: Complete API specification with Swagger UI
- **Middleware Architecture**: Reusable authentication and authorization
- **Error Handling**: Consistent error responses with specific codes
- **Data Validation**: Comprehensive input validation
- **Mock Data**: Realistic test data for immediate use

## 🧪 Testing the API

### Using Swagger UI
1. Start the server: `npm run dev`
2. Open http://localhost:3000/api-docs
3. Click "Authorize" and enter a JWT token
4. Test any endpoint directly from the browser

### Using curl
See the examples above for curl commands for each endpoint.

### Using Postman
Import the OpenAPI spec from http://localhost:3000/api-docs.json into Postman for a complete API collection.

## 📈 Performance Considerations

### Pagination
- All list endpoints support pagination
- Default limit of 10 items per page
- Efficient slicing for mock data (replace with database queries in production)

### Filtering
- Server-side filtering reduces response sizes
- Case-insensitive text searches
- Multiple filter combinations supported

### Authentication
- Stateless JWT tokens
- No server-side session storage required
- Scalable across multiple server instances

---

*This RESTful API provides a solid foundation for the Construction ERP system with modern authentication, comprehensive documentation, and role-based security.*

# Advanced AI Integration - Usage Guide

The Construction ERP system now includes advanced AI capabilities alongside the basic AI features. Both services work together to provide comprehensive intelligent insights for construction materials management.

## 🤖 AI Services Overview

### Basic AI Service (`/api/ai/*`)
- Simple inventory recommendations
- Basic demand forecasting
- Simple price suggestions

### Advanced AI Service (`/api/ai/advanced/*`)
- Seasonal demand forecasting with weather/economic data
- Dynamic pricing optimization
- Comprehensive supplier risk analysis

## 🚀 Getting Started

### 1. Check Advanced AI Health
```bash
GET /api/ai/advanced/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "details": "All advanced AI features operational",
    "features": [
      "Seasonal Demand Forecasting",
      "Dynamic Pricing Optimization", 
      "Supplier Risk Analysis",
      "Market Intelligence",
      "Weather Impact Analysis"
    ]
  }
}
```

## 📊 Seasonal Demand Forecasting

Generates comprehensive demand forecasts using weather data, economic indicators, and seasonal patterns.

### Endpoint
```
POST /api/ai/advanced/seasonal-forecast
```

### Request Body
```json
{
  "category": "Steel Materials",
  "weatherData": {
    "location": "Chicago, IL",
    "temperature": {
      "current": 15,
      "forecast": [
        {"date": "2024-01-15", "high": 18, "low": 8},
        {"date": "2024-01-16", "high": 20, "low": 10}
      ]
    },
    "precipitation": {
      "current": 5,
      "forecast": [
        {"date": "2024-01-15", "probability": 0.3, "amount": 2},
        {"date": "2024-01-16", "probability": 0.1, "amount": 0}
      ]
    },
    "seasonality": {
      "season": "winter",
      "constructionSeasonActive": false
    }
  },
  "economicIndicators": {
    "indicators": {
      "constructionIndex": 105,
      "materialCostIndex": 110,
      "laborCostIndex": 108,
      "interestRates": 5.5,
      "inflationRate": 3.2
    },
    "marketTrends": {
      "housingStarts": 1200000,
      "commercialProjects": 15000,
      "infrastructureSpending": 2000000000
    },
    "regionalFactors": {
      "region": "Midwest",
      "economicGrowth": 2.5,
      "unemploymentRate": 4.2,
      "populationGrowth": 0.8
    }
  },
  "parameters": {
    "timeHorizon": 365,
    "granularity": "weekly",
    "confidenceLevel": 0.85
  }
}
```

### Response
```json
{
  "success": true,
  "data": {
    "productCategory": "Steel Materials",
    "timeHorizon": {
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2025-01-15T00:00:00.000Z",
      "periods": 52
    },
    "demandPredictions": [
      {
        "period": "weekly",
        "date": "2024-01-15T00:00:00.000Z",
        "predictedDemand": 850,
        "confidence": 0.82,
        "adjustmentFactors": [
          {
            "factor": "winter_season",
            "impact": -0.3,
            "description": "Winter season reduces construction activity"
          }
        ]
      }
    ],
    "seasonalPatterns": {
      "peakSeason": {
        "months": ["March", "April", "May", "June", "July", "August", "September", "October"],
        "demandMultiplier": 1.4
      },
      "lowSeason": {
        "months": ["November", "December", "January", "February"], 
        "demandMultiplier": 0.7
      }
    },
    "recommendations": [
      {
        "type": "inventory",
        "action": "Increase inventory levels by 40% before peak construction season",
        "reasoning": "Historical data shows demand increases significantly during construction season",
        "priority": "high",
        "expectedImpact": "Prevent stockouts and capture peak season revenue"
      }
    ]
  }
}
```

## 💰 Dynamic Pricing Analysis

Analyzes market conditions to recommend optimal pricing strategies and scenarios.

### Endpoint
```
POST /api/ai/advanced/dynamic-pricing
```

### Request Body
```json
{
  "productId": "steel-rebar",
  "marketConditions": {
    "competitorAnalysis": {
      "averagePricing": 120.00,
      "priceRange": {
        "min": 110.00,
        "max": 135.00
      },
      "marketShare": 0.25,
      "competitorCount": 4
    },
    "supplyChainStatus": {
      "materialAvailability": "medium",
      "shippingCosts": 15.50,
      "leadTimes": 14,
      "supplierReliability": 0.92
    },
    "demandSignals": {
      "currentDemand": 850,
      "trendDirection": "increasing",
      "volatility": 0.15
    }
  }
}
```

### Response
```json
{
  "success": true,
  "data": {
    "productId": "steel-rebar",
    "currentPrice": 125.50,
    "recommendedPrice": 128.75,
    "priceElasticity": -1.15,
    "competitivePressure": 0.45,
    "demandSensitivity": 0.62,
    "pricingStrategy": {
      "type": "competitive",
      "reasoning": "Balanced market conditions suggest competitive pricing approach",
      "expectedOutcome": "Maintain market position with stable margins"
    },
    "scenarios": [
      {
        "pricePoint": 131.78,
        "expectedDemand": 805,
        "projectedRevenue": 106084.90,
        "marketResponse": "Minimal market reaction, stable customer base"
      },
      {
        "pricePoint": 128.75,
        "expectedDemand": 823,
        "projectedRevenue": 105962.25,
        "marketResponse": "Optimal balance of price and volume based on market analysis"
      }
    ]
  }
}
```

## 🏭 Supplier Risk Assessment

Evaluates supplier risks across multiple dimensions and provides alternative recommendations.

### Endpoint
```
POST /api/ai/advanced/supplier-risk
```

### Request Body
```json
{
  "supplierId": "supplier-001",
  "includeAlternatives": true
}
```

### Response
```json
{
  "success": true,
  "data": {
    "supplierId": "supplier-001",
    "supplierName": "Premium Steel Co.",
    "riskScore": 25,
    "riskFactors": [
      {
        "category": "operational",
        "factor": "Limited Operating History", 
        "severity": "medium",
        "impact": 0.15,
        "description": "Relatively new business with limited track record"
      }
    ],
    "recommendations": [
      {
        "action": "Implement enhanced monitoring and backup plans",
        "priority": "short-term",
        "cost": 15000,
        "benefit": "Early warning system for potential issues"
      }
    ],
    "alternatives": [
      {
        "supplierId": "alt-supplier-001",
        "name": "Reliable Materials Corp",
        "riskScore": 25,
        "estimatedSwitchingCost": 15000
      },
      {
        "supplierId": "alt-supplier-002", 
        "name": "Quality Supply Co",
        "riskScore": 35,
        "estimatedSwitchingCost": 20000
      }
    ]
  }
}
```

## 🔧 Integration Tips

### 1. Error Handling
All advanced AI endpoints return structured error responses:
```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "SPECIFIC_ERROR_CODE"
}
```

### 2. Validation
- Required fields are validated before processing
- Invalid data formats return 400 status codes
- Missing authentication returns 401 status codes

### 3. Performance
- Use appropriate parameters to control processing time
- Seasonal forecasting with shorter time horizons processes faster
- Cache results when possible for repeated queries

### 4. Mock Data
- The current implementation uses realistic mock data
- Integrations with real weather APIs, economic data sources, and ML models can be added
- All interfaces are designed for production-ready implementations

## 🎯 Use Cases

### Construction Season Planning
```bash
# Get seasonal forecast for concrete materials
POST /api/ai/advanced/seasonal-forecast
# Use recommendations to adjust inventory levels
# Plan procurement schedules based on peak/low seasons
```

### Competitive Pricing Strategy
```bash
# Analyze current market conditions for steel products
POST /api/ai/advanced/dynamic-pricing  
# Implement recommended pricing strategy
# Monitor competitor responses and adjust
```

### Supply Chain Risk Management
```bash
# Assess key supplier risks quarterly
POST /api/ai/advanced/supplier-risk
# Evaluate alternative suppliers
# Implement recommended risk mitigation strategies
```

## 📈 Monitoring & Health

### System Health
Monitor both AI services through the health endpoint:
```bash
GET /health
```

### Advanced AI Health
Get detailed status of advanced AI features:
```bash
GET /api/ai/advanced/health
```

---

The Advanced AI integration provides powerful tools for construction materials management while maintaining compatibility with existing basic AI features. All endpoints are documented in the interactive Swagger UI at `/api-docs`.

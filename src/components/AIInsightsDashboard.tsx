// src/components/AIInsightsDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  data: any;
  createdAt: Date;
}

interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const AIInsightsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealTimeEvent[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const newSocket = io('ws://localhost:3000');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsLoading(false);
      
      // Authenticate with the server
      newSocket.emit('authenticate', {
        userId: 'user123',
        companyId: 'company456',
        role: 'admin'
      });
      
      // Subscribe to AI insights and real-time events
      newSocket.emit('subscribe', ['ai_insight', 'alert', 'inventory_update', 'market_update']);
      
      // Request initial comprehensive insights
      newSocket.emit('ai_query', {
        type: 'comprehensive_insights',
        context: { focus: 'dashboard_overview' }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('ai_response', (response) => {
      if (response.success && response.data) {
        setInsights(response.data);
      }
    });

    newSocket.on('realtime_event', (event: RealTimeEvent) => {
      setRealtimeEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
      
      if (event.type === 'ai_insight') {
        setInsights(prev => [...event.data.insights, ...prev]);
      }
    });

    newSocket.on('buffered_events', (events: RealTimeEvent[]) => {
      setRealtimeEvents(prev => [...events, ...prev]);
    });

    setSocket(newSocket);
  };

  const handleActionRequest = useCallback((action: string, payload: any) => {
    if (socket && isConnected) {
      socket.emit('action_request', { type: action, payload });
    }
  }, [socket, isConnected]);

  const handleInsightAction = (insight: AIInsight, actionIndex: number) => {
    const action = insight.recommendations[actionIndex];
    
    // Map recommendation to actionable request
    if (action.includes('reorder') || action.includes('Reorder')) {
      handleActionRequest('reorder_product', {
        productId: insight.data.productId || 'P001',
        quantity: insight.data.recommendedQuantity || 100,
        supplier: insight.data.preferredSupplier || 'default',
        unitCost: insight.data.estimatedCost || 50
      });
    } else if (action.includes('price') || action.includes('Price')) {
      handleActionRequest('update_price', {
        productId: insight.data.productId || 'P001',
        oldPrice: insight.data.currentPrice || 100,
        newPrice: insight.data.recommendedPrice || 105,
        reason: `AI Recommendation: ${insight.title}`
      });
    } else if (action.includes('alert') || action.includes('Schedule')) {
      handleActionRequest('send_alert', {
        title: `Action Required: ${insight.title}`,
        message: action,
        severity: insight.severity
      });
    }
    
    // Mark insight as acted upon (you'd implement this in the backend)
    setInsights(prev => 
      prev.map(i => i.id === insight.id 
        ? { ...i, data: { ...i.data, actionTaken: action } }
        : i
      )
    );
  };

  const filteredInsights = insights.filter(insight => 
    activeFilter === 'all' || insight.severity === activeFilter
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-400 text-red-700';
      case 'warning': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'info': return 'bg-blue-100 border-blue-400 text-blue-700';
      default: return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return '💡';
      default: return '📊';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'inventory_update': return '📦';
      case 'ai_insight': return '🧠';
      case 'market_update': return '📈';
      case 'alert': return '🔔';
      case 'order_created': return '📋';
      default: return '📊';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🧠 AI Insights Dashboard</h2>
            <p className="text-sm text-gray-600">Real-time intelligence for your construction business</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="text-sm text-gray-600">
              {filteredInsights.length} insights
            </div>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 mt-4">
          {(['all', 'critical', 'warning', 'info'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {insights.filter(i => i.severity === filter).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Insights List */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedInsight?.id === insight.id ? 'ring-2 ring-blue-500' : ''
                } ${getSeverityColor(insight.severity)}`}
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getSeverityIcon(insight.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{insight.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(insight.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                    
                    {insight.actionable && insight.recommendations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {insight.recommendations.slice(0, 2).map((rec, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightAction(insight, index);
                            }}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                          >
                            {rec.length > 40 ? rec.substring(0, 40) + '...' : rec}
                          </button>
                        ))}
                        {insight.recommendations.length > 2 && (
                          <span className="text-xs text-gray-600 px-2 py-1">
                            +{insight.recommendations.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredInsights.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-lg font-medium text-gray-900">No insights available</h3>
                <p className="text-gray-600">AI is analyzing your data. Check back in a moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-80 border-l border-gray-200 bg-gray-50">
          {selectedInsight ? (
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{getSeverityIcon(selectedInsight.severity)}</div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedInsight.title}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedInsight.confidence && `${Math.round(selectedInsight.confidence * 100)}% confidence`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{selectedInsight.description}</p>
                </div>
                
                {selectedInsight.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
                    <div className="space-y-2">
                      {selectedInsight.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="text-blue-600 text-sm mt-1">•</div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{rec}</p>
                            <button
                              onClick={() => handleInsightAction(selectedInsight, index)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Execute Action →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedInsight.data && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                    <div className="bg-white rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(selectedInsight.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">👆</div>
              <p className="text-gray-600">Select an insight to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <h4 className="font-medium text-gray-900 mb-3">🔄 Live Activity Feed</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {realtimeEvents.slice(0, 5).map((event, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm">
              <div className="text-lg">{getEventIcon(event.type)}</div>
              <div className="flex-1">
                <span className="text-gray-700">
                  {event.type === 'inventory_update' && `${event.data.productName} stock ${event.data.quantityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(event.data.quantityChange)}`}
                  {event.type === 'market_update' && `${event.data.category} price trend: ${event.data.forecast}`}
                  {event.type === 'ai_insight' && `New AI insight: ${event.data.type}`}
                  {event.type === 'alert' && `Alert: ${event.data.title}`}
                  {event.type === 'order_created' && `New order created: ${event.data.poNumber}`}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          
          {realtimeEvents.length === 0 && (
            <p className="text-sm text-gray-500 italic">Waiting for real-time events...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsDashboard;

// src/components/InventoryHistory.tsx
// Component for displaying inventory transaction history and audit trail

import React, { useState, useEffect } from 'react';

interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

interface InventoryHistoryProps {
  productId: string;
  onClose?: () => void;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({
  productId,
  onClose
}) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionHistory();
  }, [productId]);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock API call - in production this would fetch from the server
      // const response = await fetch(`/api/inventory/${productId}/transactions`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockTransactions: InventoryTransaction[] = [
        {
          id: 'txn-001',
          productId,
          type: 'PURCHASE',
          quantity: 100,
          reason: 'Initial stock purchase',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          createdBy: 'admin'
        },
        {
          id: 'txn-002',
          productId,
          type: 'SALE',
          quantity: -25,
          reason: 'Sale to customer XYZ',
          createdAt: new Date('2024-01-16T14:30:00Z'),
          createdBy: 'sales-user'
        },
        {
          id: 'txn-003',
          productId,
          type: 'ADJUSTMENT',
          quantity: -5,
          reason: 'Inventory count adjustment',
          createdAt: new Date('2024-01-17T09:15:00Z'),
          createdBy: 'warehouse-manager'
        },
        {
          id: 'txn-004',
          productId,
          type: 'PURCHASE',
          quantity: 50,
          reason: 'Restocking order #12345',
          createdAt: new Date('2024-01-20T11:00:00Z'),
          createdBy: 'purchasing-agent'
        },
        {
          id: 'txn-005',
          productId,
          type: 'RETURN',
          quantity: 10,
          reason: 'Customer return - defective items',
          createdAt: new Date('2024-01-22T16:45:00Z'),
          createdBy: 'customer-service'
        }
      ];

      setTimeout(() => {
        setTransactions(mockTransactions);
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transaction history');
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'PURCHASE': return '#28a745';
      case 'SALE': return '#007bff';
      case 'ADJUSTMENT': return '#ffc107';
      case 'RETURN': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getTransactionTypeIcon = (type: string): string => {
    switch (type) {
      case 'PURCHASE': return '📦';
      case 'SALE': return '💰';
      case 'ADJUSTMENT': return '⚖️';
      case 'RETURN': return '↩️';
      default: return '📋';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="inventory-history">
        <div className="history-header">
          <h3>Transaction History</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-history">
        <div className="history-header">
          <h3>Transaction History</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchTransactionHistory} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-history">
      <div className="history-header">
        <h3>Transaction History</h3>
        <div className="history-stats">
          <span className="total-transactions">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="history-content">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found for this item.</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-icon">
                  <span 
                    className="type-badge"
                    style={{ backgroundColor: getTransactionTypeColor(transaction.type) }}
                  >
                    {getTransactionTypeIcon(transaction.type)}
                  </span>
                </div>

                <div className="transaction-details">
                  <div className="transaction-header">
                    <h4 className="transaction-type">
                      {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                    </h4>
                    <span 
                      className={`quantity ${transaction.quantity > 0 ? 'positive' : 'negative'}`}
                    >
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                    </span>
                  </div>

                  <p className="transaction-reason">{transaction.reason}</p>
                  
                  <div className="transaction-meta">
                    <span className="transaction-date">
                      {formatDate(transaction.createdAt)}
                    </span>
                    <span className="transaction-user">
                      by {transaction.createdBy}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="history-footer">
        <button onClick={fetchTransactionHistory} className="refresh-btn">
          Refresh History
        </button>
      </div>
    </div>
  );
};

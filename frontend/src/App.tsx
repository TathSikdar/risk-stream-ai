import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, ListFilter, Settings as SettingsIcon, LogOut, User as UserIcon, Bell, Info, Plus } from 'lucide-react';
import TransactionTable from './components/TransactionTable';
import TransactionDetails from './components/TransactionDetails';
import IngestModal from './components/IngestModal';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Settings from './views/Settings';
import { transactionService, authService } from './services/api';
import { initSocket } from './services/socket';

interface RealTimeEvent {
  type: string;
  transactionId: number;
  message: string;
  status?: string;
  riskScore?: number;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<RealTimeEvent[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
      
      // Senior SWE: Initialize real-time WebSocket stream
      initSocket((event: RealTimeEvent) => {
        setNotifications(prev => [event, ...prev].slice(0, 5));
        
        // Auto-refresh the list when an analysis is completed or a new txn is ingested
        if (event.type === 'ANALYSIS_COMPLETED' || event.type === 'INGESTED') {
          loadTransactions();
        }

        // Show a brief toast notification logic (mocked here with state)
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n !== event));
        }, 8000);
      });
    }
  }, [isAuthenticated]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this transaction from the ledger?')) return;
    
    try {
      await transactionService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (selectedTxnId === id) setSelectedTxnId(null);
    } catch (error) {
      alert('Failed to delete transaction. Insufficient permissions.');
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setTransactions([]);
  };

  const selectedTransaction = transactions.find(t => t.id === selectedTxnId);

  const handleSelectTransaction = (id: number) => {
    setSelectedTxnId(id);
  };

  const handleAnalysisComplete = (id: number, score: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: score >= 80 ? 'Flagged' : t.status };
      }
      return t;
    }));
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      {/* Sidebar Component */}
      <aside className="app__sidebar sidebar" role="navigation" aria-label="Main Navigation">
        <div className="sidebar__logo">
          <Shield size={32} color="#ed1c24" aria-hidden="true" />
          <span className="sidebar__title">RiskStream AI</span>
        </div>
        
        <nav className="sidebar__nav">
          <button 
            className={`sidebar__item ${activeTab === 'dashboard' ? 'sidebar__item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard size={20} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`sidebar__item ${activeTab === 'transactions' ? 'sidebar__item--active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            aria-current={activeTab === 'transactions' ? 'page' : undefined}
          >
            <ListFilter size={20} aria-hidden="true" />
            <span>Transactions</span>
          </button>
          <button 
            className={`sidebar__item ${activeTab === 'settings' ? 'sidebar__item--active' : ''}`}
            onClick={() => setActiveTab('settings')}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
          >
            <SettingsIcon size={20} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user" aria-label={`Logged in as ${user?.full_name}`}>
            <UserIcon size={20} aria-hidden="true" />
            <span>{user?.full_name || 'Guest'}</span>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} aria-label="Logout of application">
            <LogOut size={20} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app__content">
        <header className="header">
          <h1 className="header__title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <div className="header__actions">
            {activeTab === 'transactions' && (
              <button 
                className="btn-ingest" 
                onClick={() => setIsIngestModalOpen(true)}
                aria-label="Ingest new transaction"
              >
                <Plus size={18} />
                <span>Ingest Transaction</span>
              </button>
            )}
            <span className="header__badge">{user?.role?.replace('_', ' ') || 'User'}</span>
          </div>
        </header>

        <section className="view-container">
          {activeTab === 'transactions' ? (
            <div className="transaction-view">
              {isLoading ? (
                <div className="loading-state">
                  <Loader2 size={40} className="spinner" />
                  <p>Loading secure ledger...</p>
                </div>
              ) : (
                <TransactionTable 
                  transactions={transactions} 
                  onSelectTransaction={handleSelectTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}
            </div>
          ) : activeTab === 'dashboard' ? (
            <Dashboard />
          ) : activeTab === 'settings' ? (
            <Settings />
          ) : (
            <div className="placeholder-view">
              <p>Section coming soon.</p>
            </div>
          )}
        </section>

        {/* Real-time Notification Overlay */}
        <div className="notification-overlay">
          {notifications.map((note, idx) => (
            <div key={idx} className={`notification-toast notification-toast--${note.type.toLowerCase()}`}>
              <Info size={16} />
              <span>{note.message}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Ingest Modal */}
      {isIngestModalOpen && (
        <IngestModal 
          onClose={() => setIsIngestModalOpen(false)} 
          onSuccess={loadTransactions} 
        />
      )}

      {/* Analysis Slide-out Panel */}
      {selectedTransaction && (
        <TransactionDetails 
          transaction={selectedTransaction}
          onClose={() => setSelectedTxnId(null)}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
      
      {/* Backdrop for the panel */}
      {selectedTransaction && (
        <div className="backdrop" onClick={() => setSelectedTxnId(null)}></div>
      )}
    </div>
  );
};

// Helper for loading state in table view
const Loader2 = ({ size, className }: { size: number, className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default App;

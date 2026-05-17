import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, ListFilter, Settings, LogOut, User as UserIcon } from 'lucide-react';
import TransactionTable from './components/TransactionTable';
import TransactionDetails from './components/TransactionDetails';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import { transactionService, authService } from './services/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
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
            <Settings size={20} aria-hidden="true" />
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
                />
              )}
            </div>
          ) : activeTab === 'dashboard' ? (
            <Dashboard />
          ) : (
            <div className="placeholder-view">
              <p>Section coming soon.</p>
            </div>
          )}
        </section>
      </main>

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

import React, { useEffect, useState } from 'react';
import { transactionService } from '../services/api';
import { Activity, AlertTriangle, TrendingUp, Users, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

interface DashboardStats {
  summary: {
    total_transactions: number;
    flagged_transactions: number;
    total_volume: number;
    pending_review: number;
  };
  risk_distribution: Array<{ risk_level: string; count: number }>;
  recent_activity: Array<{
    sender_name: string;
    receiver_name: string;
    risk_score: number;
    assessment_date: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await transactionService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleGlobalScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await transactionService.scanTransactions();
      setScanResult(result.message);
      // Refresh stats to show new data
      await fetchStats();
      
      // Clear message after 5 seconds
      setTimeout(() => setScanResult(null), 5000);
    } catch (error) {
      console.error('Global scan failed:', error);
      setScanResult('Surveillance scan failed. Please check network connectivity.');
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={48} className="spinner" />
        <p>Aggregating risk metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-error">
        <p>Failed to load dashboard data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Global Surveillance Controls */}
      <section className="dashboard-banner">
        <div className="dashboard-banner__content">
          <div className="dashboard-banner__info">
            <h2 className="dashboard-banner__title">Global Surveillance Scan</h2>
            <p className="dashboard-banner__description">
              Synchronize with external banking ledgers to discover new transactions for targeted entities.
            </p>
          </div>
          <div className="dashboard-banner__actions">
            <button 
              className={`btn-scan ${isScanning ? 'btn-scan--loading' : ''}`}
              onClick={handleGlobalScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <RefreshCw size={18} className="spinner" />
              ) : (
                <Search size={18} />
              )}
              <span>{isScanning ? 'Scanning External Ledgers...' : 'Auto Check for Updates'}</span>
            </button>
          </div>
        </div>
        {scanResult && (
          <div className="dashboard-banner__result">
            <ShieldCheck size={16} />
            <span>{scanResult}</span>
          </div>
        )}
      </section>

      <div className="dashboard__grid">
        {/* Summary Cards */}
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <Activity size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Total Transactions</span>
            <span className="stat-card__value">{stats.summary.total_transactions}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Flagged High Risk</span>
            <span className="stat-card__value">{stats.summary.flagged_transactions}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Total Volume (USD)</span>
            <span className="stat-card__value">
              {stats.summary.total_volume.toLocaleString(undefined, { 
                style: 'currency', 
                currency: 'USD',
                maximumFractionDigits: 0
              })}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--orange">
            <Users size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Pending Review</span>
            <span className="stat-card__value">{stats.summary.pending_review}</span>
          </div>
        </div>
      </div>

      <div className="dashboard__sections">
        {/* Risk Distribution Chart Placeholder (using simple bars) */}
        <section className="dashboard-section risk-distribution">
          <h2 className="dashboard-section__title">Risk Distribution</h2>
          <div className="risk-bars">
            {['High', 'Medium', 'Low'].map(level => {
              const item = stats.risk_distribution.find(d => d.risk_level === level);
              const count = item ? item.count : 0;
              const percentage = stats.summary.total_transactions > 0 
                ? (count / stats.summary.total_transactions) * 100 
                : 0;
              
              return (
                <div key={level} className="risk-bar-container">
                  <div className="risk-bar-label">
                    <span>{level} Risk</span>
                    <span>{count}</span>
                  </div>
                  <div className="risk-bar-bg">
                    <div 
                      className={`risk-bar-fill risk-bar-fill--${level.toLowerCase()}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity List */}
        <section className="dashboard-section recent-activity">
          <h2 className="dashboard-section__title">Recent Risk Assessments</h2>
          <div className="activity-list">
            {stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-item__details">
                    <p className="activity-item__entities">
                      {activity.sender_name} → {activity.receiver_name}
                    </p>
                    <p className="activity-item__date">
                      {new Date(activity.assessment_date).toLocaleString()}
                    </p>
                  </div>
                  <div className={`activity-item__score activity-item__score--${
                    activity.risk_score >= 80 ? 'high' : activity.risk_score >= 40 ? 'medium' : 'low'
                  }`}>
                    {activity.risk_score}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent assessments found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

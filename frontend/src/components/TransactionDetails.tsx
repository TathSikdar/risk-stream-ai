import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, BrainCircuit, ExternalLink, Loader2 } from 'lucide-react';
import { transactionService } from '../services/api';

interface AnalysisResult {
  risk_score: number;
  reasoning: string;
  sources_checked: string[];
}

interface TransactionDetailsProps {
  transaction: any;
  onClose: () => void;
  onAnalysisComplete: (id: number, score: number) => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction, onClose, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(transaction.analysis || null);
  const [error, setError] = useState<string | null>(null);

  // Update local analysis state if the transaction prop changes (e.g., user selects a different txn)
  React.useEffect(() => {
    setAnalysis(transaction.analysis || null);
    setError(null);
  }, [transaction]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await transactionService.analyzeTransaction(transaction.id);
      setAnalysis(data.analysis);
      onAnalysisComplete(transaction.id, data.analysis.risk_score);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className={`analysis-panel ${transaction ? 'analysis-panel--open' : ''}`}
      role="dialog"
      aria-labelledby="analysis-title"
      aria-modal="true"
    >
      <div className="analysis-panel__header">
        <h2 id="analysis-title" className="analysis-panel__title">Transaction Deep-Dive</h2>
        <button className="analysis-panel__close" onClick={onClose} aria-label="Close analysis panel">
          <X size={24} aria-hidden="true" />
        </button>
      </div>

      <div className="analysis-panel__content">
        <section className="detail-section" aria-labelledby="basic-info-title">
          <h3 id="basic-info-title" className="detail-section__title">Basic Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Transaction ID</label>
              <span>#{transaction.id}</span>
            </div>
            <div className="detail-item">
              <label>Date</label>
              <span>{new Date(transaction.transaction_date).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Amount</label>
              <span className="detail-item--bold">
                {transaction.amount.toLocaleString(undefined, { style: 'currency', currency: transaction.currency })}
              </span>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <span className={`status-badge status-badge--${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
            </div>
          </div>
          <div className="detail-item detail-item--full">
            <label>Description</label>
            <span>{transaction.description || 'N/A'}</span>
          </div>
        </section>

        <section className="detail-section" aria-labelledby="ai-investigation-title">
          <h3 id="ai-investigation-title" className="detail-section__title">AI Risk Orchestration</h3>
          {!analysis && !isAnalyzing && (
            <div className="analysis-trigger">
              <p>Perform autonomous AML investigation using LangGraph Agent.</p>
              <button className="btn-primary" onClick={handleAnalyze} aria-label="Run AI investigation">
                <BrainCircuit size={18} aria-hidden="true" />
                Run AI Analysis
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="analysis-loading" role="status" aria-live="polite">
              <Loader2 size={40} className="spinner" aria-hidden="true" />
              <p>Agent is extracting entities and querying sanction lists...</p>
              <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-label="Investigation progress">
                <div className="progress-bar__fill"></div>
              </div>
            </div>
          )}

          {analysis && (
            <div className="analysis-results" role="region" aria-live="assertive">
              <div 
                className={`risk-meter risk-meter--${analysis.risk_score >= 80 ? 'high' : analysis.risk_score >= 40 ? 'medium' : 'low'}`}
                aria-label={`Risk score is ${analysis.risk_score}`}
              >
                <div className="risk-meter__score">{analysis.risk_score}</div>
                <div className="risk-meter__label">Risk Score</div>
              </div>

              <div className="analysis-reasoning">
                <h4>Agent Reasoning</h4>
                <p>{analysis.reasoning}</p>
              </div>

              <div className="analysis-sources">
                <h4>Sources Verified</h4>
                <ul>
                  {analysis.sources_checked.map((source, i) => (
                    <li key={i}>
                      <ExternalLink size={14} aria-hidden="true" />
                      {source}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {error && <div className="analysis-error" role="alert">{error}</div>}
        </section>
      </div>
    </div>
  );
};

export default TransactionDetails;

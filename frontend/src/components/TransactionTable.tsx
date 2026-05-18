import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AlertCircle, CheckCircle, Clock, ArrowRight, Trash2, ChevronRight } from 'lucide-react';

interface Transaction {
  id: number;
  sender_name: string;
  receiver_name: string;
  amount: number;
  currency: string;
  status: string;
  transaction_date: string;
  analysis?: {
    risk_score: number;
    reasoning: string;
  };
}

interface TransactionTableProps {
  transactions: Transaction[];
  onSelectTransaction: (id: number) => void;
  onDeleteTransaction: (id: number) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onSelectTransaction, onDeleteTransaction }) => {
  
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <Clock size={48} />
        <p>No transactions found in the secure ledger.</p>
        <p className="empty-state__sub">Ingest a new transaction or run a surveillance scan to begin.</p>
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const txn = transactions[index];
    
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Approved': return <CheckCircle size={16} color="#28a745" />;
        case 'Flagged': return <AlertCircle size={16} color="#dc3545" />;
        default: return <Clock size={16} color="#ffc107" />;
      }
    };

    const riskScore = txn.analysis?.risk_score;

    return (
      <div 
        className={`table-row ${index % 2 === 0 ? 'table-row--even' : ''}`} 
        style={style}
        role="row"
        aria-label={`Transaction ${txn.id} from ${txn.sender_name} to ${txn.receiver_name}`}
      >
        <div className="table-row__cell table-row__cell--id" role="gridcell">#{txn.id}</div>
        <div className="table-row__cell table-row__cell--entities" role="gridcell">
          <span className="entity-name">{txn.sender_name}</span>
          <ArrowRight size={12} className="entity-arrow" aria-hidden="true" />
          <span className="entity-name">{txn.receiver_name}</span>
        </div>
        <div className="table-row__cell table-row__cell--amount" role="gridcell">
          {txn.amount.toLocaleString(undefined, { style: 'currency', currency: txn.currency })}
        </div>
        <div className="table-row__cell table-row__cell--status" role="gridcell">
          <span className={`status-badge status-badge--${txn.status.toLowerCase()}`}>
            {getStatusIcon(txn.status)}
            {txn.status}
          </span>
        </div>
        <div className="table-row__cell table-row__cell--risk" role="gridcell">
          {riskScore !== undefined ? (
            <div className={`risk-score-pill risk-score-pill--${riskScore >= 80 ? 'high' : riskScore >= 40 ? 'medium' : 'low'}`}>
              {riskScore}
            </div>
          ) : (
            <span className="risk-pending">--</span>
          )}
        </div>
        <div className="table-row__cell table-row__cell--actions" role="gridcell">
          <div className="table-action-group">
            <button 
              className="btn-table-action btn-table-action--analyze"
              onClick={() => onSelectTransaction(txn.id)}
              title="Analyze Transaction"
            >
              <span>Analyze</span>
              <ChevronRight size={14} />
            </button>
            <button 
              className="btn-table-action btn-table-action--delete"
              onClick={() => onDeleteTransaction(txn.id)}
              title="Remove Transaction"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="transaction-table" role="grid" aria-label="Transaction Ledger">
      <div className="transaction-table__header" role="row">
        <div className="table-header__cell table-header__cell--id" role="columnheader">ID</div>
        <div className="table-header__cell table-header__cell--entities" role="columnheader">Entities (Sender → Receiver)</div>
        <div className="table-header__cell table-header__cell--amount" role="columnheader">Amount</div>
        <div className="table-header__cell table-header__cell--status" role="columnheader">Status</div>
        <div className="table-header__cell table-header__cell--risk" role="columnheader">Risk</div>
        <div className="table-header__cell table-header__cell--actions" role="columnheader">Actions</div>
      </div>
      
      <List
        height={600}
        itemCount={transactions.length}
        itemSize={60}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};

export default TransactionTable;

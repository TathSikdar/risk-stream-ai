import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface Transaction {
  id: number;
  sender_name: string;
  receiver_name: string;
  amount: number;
  currency: string;
  status: string;
  transaction_date: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onSelectTransaction: (id: number) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onSelectTransaction }) => {
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const txn = transactions[index];
    
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Approved': return <CheckCircle size={16} color="#28a745" />;
        case 'Flagged': return <AlertCircle size={16} color="#dc3545" />;
        default: return <Clock size={16} color="#ffc107" />;
      }
    };

    return (
      <div 
        className={`table-row ${index % 2 === 0 ? 'table-row--even' : ''}`} 
        style={style}
        onClick={() => onSelectTransaction(txn.id)}
        role="row"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelectTransaction(txn.id)}
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
        <div className="table-row__cell table-row__cell--date" role="gridcell">
          {new Date(txn.transaction_date).toLocaleDateString()}
        </div>
        <div className="table-row__cell table-row__cell--status" role="gridcell">
          <span className={`status-badge status-badge--${txn.status.toLowerCase()}`}>
            {getStatusIcon(txn.status)}
            {txn.status}
          </span>
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
        <div className="table-header__cell table-header__cell--date" role="columnheader">Date</div>
        <div className="table-header__cell table-header__cell--status" role="columnheader">Status</div>
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

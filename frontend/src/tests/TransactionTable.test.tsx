import React from 'react';
import { render, screen } from '@testing-library/react';
import TransactionTable from '../components/TransactionTable';

const mockTransactions = [
  { id: 1, sender_name: 'Entity A', receiver_name: 'Entity B', amount: 1000, currency: 'USD', status: 'Flagged', transaction_date: '2026-05-14' }
];

describe('TransactionTable Component', () => {
  it('renders high-risk (Flagged) items correctly', () => {
    render(<TransactionTable transactions={mockTransactions} onSelectTransaction={() => {}} />);
    
    const statusBadge = screen.getByText('Flagged');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('status-badge--flagged');
  });

  it('renders entity names correctly', () => {
    render(<TransactionTable transactions={mockTransactions} onSelectTransaction={() => {}} />);
    
    expect(screen.getByText('Entity A')).toBeInTheDocument();
    expect(screen.getByText('Entity B')).toBeInTheDocument();
  });
});

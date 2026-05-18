import React, { useState } from 'react';
import { X, Send, Zap, Loader2, AlertCircle } from 'lucide-react';
import { transactionService } from '../services/api';

interface IngestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const IngestModal: React.FC<IngestModalProps> = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sender_name: '',
    receiver_name: '',
    amount: '',
    currency: 'USD',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await transactionService.ingestTransaction({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ingestion failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateHighRisk = () => {
    setFormData({
      sender_name: 'SMIC',
      receiver_name: 'Tech Corp Global',
      amount: '4500000',
      currency: 'USD',
      description: 'Advanced lithography equipment components'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-card__header">
          <h2 className="modal-card__title">Ingest Live Transaction</h2>
          <button className="modal-card__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-card__body">
          <p className="modal-card__intro">
            Simulate a real-time banking event. This will trigger the AI Agent for autonomous research.
          </p>

          <div className="simulation-shortcuts">
            <button className="btn-shortcut" onClick={simulateHighRisk}>
              <Zap size={14} />
              <span>Load High-Risk Preset (SMIC)</span>
            </button>
          </div>

          <form className="ingest-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Sender Name</label>
                <input 
                  name="sender_name" 
                  value={formData.sender_name} 
                  onChange={handleChange} 
                  placeholder="e.g. AMD"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Receiver Name</label>
                <input 
                  name="receiver_name" 
                  value={formData.receiver_name} 
                  onChange={handleChange} 
                  placeholder="e.g. TSMC"
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount</label>
                <input 
                  name="amount" 
                  type="number" 
                  value={formData.amount} 
                  onChange={handleChange} 
                  placeholder="0.00"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Transaction Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Details of the transfer..."
                rows={3}
              />
            </div>

            {error && (
              <div className="form-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? <Loader2 size={18} className="spinner" /> : (
                  <>
                    <Send size={18} />
                    <span>Broadcast to AI Stream</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IngestModal;

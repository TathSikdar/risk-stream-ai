import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/api';
import { Target, Trash2, Plus, Shield, Globe, Cpu, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TargetedEntity {
  id: number;
  entity_name: string;
  category: string;
}

interface SystemConfig {
  llm_provider: string;
  db_engine: string;
  ai_engine_url: string;
  version: string;
}

const Settings: React.FC = () => {
  const [targets, setTargets] = useState<TargetedEntity[]>([]);
  const [system, setSystem] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', category: 'General' });
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [targetsData, systemData] = await Promise.all([
        settingsService.getTargets(),
        settingsService.getSystemConfig()
      ]);
      setTargets(targetsData);
      setSystem(systemData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage(null);
    try {
      await settingsService.addTarget(newEntity.name, newEntity.category);
      setNewEntity({ name: '', category: 'General' });
      await fetchData();
      setMessage({ text: 'Target entity added successfully.', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.response?.data?.error || 'Failed to add target.', type: 'error' });
    } finally {
      setIsAdding(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveTarget = async (id: number) => {
    try {
      await settingsService.removeTarget(id);
      setTargets(targets.filter(t => t.id !== id));
      setMessage({ text: 'Entity removed from watchlist.', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to remove entity.', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="settings-loading">
        <Loader2 size={40} className="spinner" />
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="settings-view">
      {message && (
        <div className={`settings-alert settings-alert--${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-grid">
        {/* Watchlist Section */}
        <section className="settings-section watchlist">
          <div className="settings-section__header">
            <Target size={22} className="icon--blue" />
            <h2 className="settings-section__title">Surveillance Watchlist</h2>
          </div>
          <p className="settings-section__desc">
            Define companies for the Global Surveillance Scan to monitor.
          </p>

          <form className="add-target-form" onSubmit={handleAddTarget}>
            <input 
              type="text" 
              placeholder="Entity Name (e.g. NVIDIA)"
              value={newEntity.name}
              onChange={e => setNewEntity({...newEntity, name: e.target.value})}
              required
            />
            <select 
              value={newEntity.category}
              onChange={e => setNewEntity({...newEntity, category: e.target.value})}
            >
              <option value="General">General</option>
              <option value="High Risk">High Risk</option>
              <option value="Competitor">Competitor</option>
              <option value="Sanctioned">Sanctioned</option>
            </select>
            <button type="submit" disabled={isAdding || !newEntity.name}>
              {isAdding ? <Loader2 size={16} className="spinner" /> : <Plus size={18} />}
            </button>
          </form>

          <div className="target-list">
            {targets.length > 0 ? targets.map(target => (
              <div key={target.id} className="target-item">
                <div className="target-item__info">
                  <span className="target-item__name">{target.entity_name}</span>
                  <span className={`target-item__badge target-item__badge--${target.category.toLowerCase().replace(' ', '-')}`}>
                    {target.category}
                  </span>
                </div>
                <button 
                  className="btn-remove" 
                  onClick={() => handleRemoveTarget(target.id)}
                  title="Remove from watchlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <p className="empty-state">No entities on watchlist. The scan will default to all external records.</p>
            )}
          </div>
        </section>

        {/* System Config Section */}
        <section className="settings-section system-config">
          <div className="settings-section__header">
            <Shield size={22} className="icon--red" />
            <h2 className="settings-section__title">System Configuration</h2>
          </div>
          
          <div className="config-grid">
            <div className="config-item">
              <div className="config-item__label">
                <Cpu size={16} />
                <span>AI Reasoning Engine</span>
              </div>
              <div className="config-item__value">{system?.llm_provider || 'GEMINI'}</div>
            </div>

            <div className="config-item">
              <div className="config-item__label">
                <Globe size={16} />
                <span>External Scan Mode</span>
              </div>
              <div className="config-item__value">Active (Simulated)</div>
            </div>

            <div className="config-item">
              <div className="config-item__label">
                <Globe size={16} />
                <span>Search API</span>
              </div>
              <div className="config-item__value">Tavily (Real-time)</div>
            </div>

            <div className="config-item">
              <div className="config-item__label">
                <Shield size={16} />
                <span>Build Version</span>
              </div>
              <div className="config-item__value">{system?.version}</div>
            </div>
          </div>

          <div className="security-notice">
            <AlertCircle size={16} />
            <p>Environment variables (API Keys) are managed at the Docker orchestration level for maximum security.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError('Invalid credentials. Standard password is "password".');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-view">
      <div className="login-card">
        <div className="login-card__header">
          <Shield size={48} color="#ed1c24" />
          <h1 className="login-card__title">RiskStream AI</h1>
          <p className="login-card__subtitle">Enterprise AML Compliance Portal</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__field">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <User size={18} />
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-form__field">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="login-form__error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button className="btn-login" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 size={20} className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="login-card__footer">
          <p>Protected by RiskStream AI Cybersecurity Standards</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

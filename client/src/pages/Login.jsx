import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText } from 'lucide-react';

const TEST_ACCOUNTS = [
  { email: 'alice@ajaia.com', name: 'Alice Johnson' },
  { email: 'bob@ajaia.com', name: 'Bob Smith' },
  { email: 'carol@ajaia.com', name: 'Carol Davis' },
  { email: 'prem@ajaia.com', name: 'Prem Prakash' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (acctEmail) => {
    setEmail(acctEmail);
    setPassword('password123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <FileText size={28} />
        </div>
        <h1 className="login-title">CollabDocs</h1>
        <p className="login-subtitle">Sign in to your workspace</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@ajaia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-accounts">
          <h4>Quick Login (Demo Accounts)</h4>
          {TEST_ACCOUNTS.map((acct) => (
            <button
              key={acct.email}
              className="login-account-btn"
              onClick={() => quickLogin(acct.email)}
              type="button"
            >
              <div className="avatar avatar-sm" style={{ background: '#6366f1' }}>
                {acct.name[0]}
              </div>
              <span>{acct.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-dim)' }}>
                {acct.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

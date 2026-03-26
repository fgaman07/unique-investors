import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(userId, password);
      setLoading(false);

      if (!result) {
        setError('Invalid user ID or password. Please try again.');
        return;
      }

      navigate(result.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch {
      setLoading(false);
      setError('Unable to connect to the server. Please check your network.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-brand-border bg-brand-surface shadow-sm">
        <div className="border-b border-brand-border px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-muted">Unique Investors</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-primary uppercase">Secure Portal Login</h1>
          <p className="mt-2 text-sm text-brand-muted">Sign in with your assigned production credentials.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 px-6 py-6">
          {error ? (
            <div className="border border-brand-danger/20 bg-brand-danger/5 px-3 py-2 text-sm font-medium text-brand-danger">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="w-full border border-brand-border px-3 py-2 text-sm outline-none transition focus:border-brand-primary"
              placeholder="Enter your user ID"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-brand-border px-3 py-2 pr-10 text-sm outline-none transition focus:border-brand-primary"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-sidebar px-4 py-2.5 text-sm font-bold text-brand-accent transition hover:bg-brand-sidebarHover border border-brand-accent/20 uppercase tracking-widest mt-2"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

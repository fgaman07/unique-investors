import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const authUser = await login(userId, password);
    setLoading(false);

    if (!authUser) {
      setError('Login failed. Please check your user ID, password, and backend connection.');
      return;
    }

    navigate(authUser.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Unique Investors</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Secure Portal Login</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with your assigned production credentials.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 px-6 py-6">
          {error ? (
            <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="Enter your user ID"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
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

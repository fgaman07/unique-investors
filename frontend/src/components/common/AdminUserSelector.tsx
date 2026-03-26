import { useEffect, useState } from 'react';
import { api, useAuth } from '../../context/AuthContext';

export const AdminUserSelector = () => {
  const { user, targetUserId, setTargetUserId } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/auth/users?limit=1000');
        // Handle both paginated { users: [...] } and flat array responses
        const userData = Array.isArray(data) ? data : data.users;
        setUsers(userData || []);
      } catch (err) {
        console.error('Failed to load users for selector', err);
      }
    };
    fetchUsers();
  }, [user]);

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="bg-slate-900 border-b border-white/10 p-2 px-4 shadow-md mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30">
          <span className="text-lg">👑</span>
        </div>
        <div>
          <h3 className="text-[12px] font-black text-brand-accent uppercase tracking-wider">Admin Impersonation</h3>
          <p className="text-[10px] text-slate-400 font-medium italic">Viewing system as another user</p>
        </div>
      </div>
      <div>
        <select
          aria-label="Target User"
          className="border border-slate-700 text-[13px] font-bold outline-none rounded bg-slate-800 text-white px-3 py-1.5 min-w-[280px] shadow-inner focus:border-brand-accent transition-all"
          value={targetUserId || ''}
          onChange={(e) => setTargetUserId(e.target.value || null)}
        >
          <option value="" className="bg-slate-900">-- SYSTEM VIEW (ADMIN) --</option>
          <optgroup label="Select User to Impersonate" className="bg-slate-900 text-slate-400 font-normal">
            {users.map(u => (
              <option key={u.id} value={u.id} className="bg-slate-800 text-white font-bold">
                {u.name} ({u.userId})
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
};

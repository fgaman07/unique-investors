import { useEffect, useState } from 'react';
import { api, useAuth } from '../../context/AuthContext';

export const AdminUserSelector = () => {
  const { user, targetUserId, setTargetUserId } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/auth/users');
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users for selector', err);
      }
    };
    fetchUsers();
  }, [user]);

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="bg-yellow-50 border-b-4 border-yellow-400 p-2 px-4 shadow-sm mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">👑</span>
        <div>
          <h3 className="text-[13px] font-bold text-yellow-800 uppercase tracking-wide">Admin Impersonation Mode</h3>
          <p className="text-[11px] text-yellow-700">Select an agent to view and edit their data.</p>
        </div>
      </div>
      <div>
        <select
          aria-label="Target User"
          className="border border-yellow-300 text-[13px] font-bold outline-none rounded bg-white px-3 py-1.5 min-w-[250px] shadow-sm focus:border-yellow-500"
          value={targetUserId || ''}
          onChange={(e) => setTargetUserId(e.target.value || null)}
        >
          <option value="">-- View My Own Data (Admin) --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.userId})</option>
          ))}
        </select>
      </div>
    </div>
  );
};

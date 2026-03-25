import { useEffect, useMemo, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

interface UserRecord {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  mobile: string;
  panNo?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  status: 'ACTIVE' | 'BLOCKED';
  rank: string;
  sponsor?: {
    userId: string;
    name: string;
  } | null;
  joiningDate: string;
  _count?: {
    downline: number;
  };
}

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  panNo: '',
  password: '',
  role: 'AGENT',
  rank: 'Associate',
  sponsorId: '',
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const sponsorOptions = useMemo(
    () => users.filter((user) => user.role !== 'ADMIN'),
    [users],
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<UserRecord[]>('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users', error);
      setMessage('Failed to load users from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateOrUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, {
          name: form.name,
          email: form.email || null,
          mobile: form.mobile,
          panNo: form.panNo || null,
          role: form.role,
          rank: form.rank,
          sponsorId: form.sponsorId || null,
        });
        setMessage('User updated successfully.');
      } else {
        await api.post('/auth/users', {
          ...form,
          email: form.email || undefined,
          panNo: form.panNo || undefined,
          sponsorId: form.sponsorId || null,
        });
        setMessage('User created successfully.');
      }

      resetForm();
      await loadUsers();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email || '',
      mobile: user.mobile,
      panNo: user.panNo || '',
      password: '',
      role: user.role,
      rank: user.rank,
      sponsorId: sponsorOptions.find((option) => option.userId === user.sponsor?.userId)?.id || '',
    });
    setMessage('');
  };

  const handleStatusToggle = async (user: UserRecord) => {
    try {
      await api.patch(`/auth/users/${user.id}/status`, {
        status: user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE',
      });
      await loadUsers();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to update user status.');
    }
  };

  const tableData = users.map((user) => ({
    ...user,
    sponsorName: user.sponsor ? `${user.sponsor.name} (${user.sponsor.userId})` : 'Company',
    downlineCount: user._count?.downline || 0,
    joiningDate: new Date(user.joiningDate).toLocaleDateString('en-GB'),
    role: `${user.role} / ${user.status}`,
    actions: (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleEdit(user)}
          className="bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleStatusToggle(user)}
          className={`px-2 py-1 text-xs font-semibold ${user.status === 'ACTIVE' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
        >
          {user.status === 'ACTIVE' ? 'Block' : 'Activate'}
        </button>
      </div>
    ),
  }));

  const columns = [
    { header: 'System ID', field: 'userId' },
    { header: 'Full Name', field: 'name' },
    { header: 'Rank', field: 'rank' },
    { header: 'Contact', field: 'mobile' },
    { header: 'PAN (KYC)', field: 'panNo' },
    { header: 'Role / Status', field: 'role' },
    { header: 'Direct Sponsor', field: 'sponsorName' },
    { header: 'Total Group', field: 'downlineCount' },
    { header: 'Joined', field: 'joiningDate' },
    { header: 'Actions', field: 'actions' },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          {editingUser ? (
            <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500">
              Cancel Edit
            </button>
          ) : null}
        </div>

        {message ? (
          <div className="mb-4 border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleCreateOrUpdate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} className="border px-3 py-2 text-sm" placeholder="Full name" required />
          <input value={form.email} onChange={(event) => handleChange('email', event.target.value)} className="border px-3 py-2 text-sm" placeholder="Email" />
          <input value={form.mobile} onChange={(event) => handleChange('mobile', event.target.value)} className="border px-3 py-2 text-sm" placeholder="Mobile number" required />
          <input value={form.panNo} onChange={(event) => handleChange('panNo', event.target.value)} className="border px-3 py-2 text-sm" placeholder="PAN number" />
          {!editingUser ? (
            <input value={form.password} onChange={(event) => handleChange('password', event.target.value)} className="border px-3 py-2 text-sm" placeholder="Temporary password" type="password" required />
          ) : null}
          <select value={form.role} onChange={(event) => handleChange('role', event.target.value)} className="border px-3 py-2 text-sm">
            <option value="AGENT">Agent</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input value={form.rank} onChange={(event) => handleChange('rank', event.target.value)} className="border px-3 py-2 text-sm" placeholder="Rank" required />
          <select value={form.sponsorId} onChange={(event) => handleChange('sponsorId', event.target.value)} className="border px-3 py-2 text-sm">
            <option value="">No sponsor / Company</option>
            {sponsorOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.userId})
              </option>
            ))}
          </select>
          <div className="md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <LegacyTable title="Master User & Agent Directory" dateRange={false} columns={columns} data={loading ? [] : tableData} />
    </div>
  );
};

export default AdminUsers;

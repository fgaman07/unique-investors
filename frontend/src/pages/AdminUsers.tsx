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
  address?: string | null;
  bankName?: string | null;
  accountNo?: string | null;
  ifscCode?: string | null;
  tdsPercentage?: number;
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
  address: '',
  bankName: '',
  accountNo: '',
  ifscCode: '',
  tdsPercentage: 5,
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
      const response = await api.get('/auth/users?limit=1000');
      // Handle both paginated { users: [...] } and flat array responses
      const userData = Array.isArray(response.data) ? response.data : response.data.users;
      setUsers(userData || []);
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
          address: form.address || null,
          bankName: form.bankName || null,
          accountNo: form.accountNo || null,
          ifscCode: form.ifscCode || null,
          tdsPercentage: Number(form.tdsPercentage) || 5,
        });
        setMessage('User updated successfully.');
      } else {
        await api.post('/auth/users', {
          ...form,
          email: form.email || undefined,
          panNo: form.panNo || undefined,
          sponsorId: form.sponsorId || null,
          address: form.address || undefined,
          bankName: form.bankName || undefined,
          accountNo: form.accountNo || undefined,
          ifscCode: form.ifscCode || undefined,
          tdsPercentage: Number(form.tdsPercentage) || 5,
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
      address: user.address || '',
      bankName: user.bankName || '',
      accountNo: user.accountNo || '',
      ifscCode: user.ifscCode || '',
      tdsPercentage: user.tdsPercentage || 5,
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
          className="bg-brand-info/10 px-2 py-1 text-xs font-bold text-brand-info border border-brand-info/20 hover:bg-brand-info hover:text-white transition-colors uppercase"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleStatusToggle(user)}
          className={`px-2 py-1 text-xs font-bold border transition-colors uppercase ${user.status === 'ACTIVE' ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/20 hover:bg-brand-danger hover:text-white' : 'bg-brand-success/10 text-brand-success border-brand-success/20 hover:bg-brand-success hover:text-white'}`}
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
    <div className="space-y-4 p-4 bg-brand-bg min-h-full">
      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between border-b border-brand-border pb-2">
          <h2 className="text-lg font-bold text-brand-primary uppercase tracking-tight">
            {editingUser ? 'Edit User Record' : 'Enroll New User'}
          </h2>
          {editingUser ? (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-brand-muted hover:text-brand-danger uppercase">
              Cancel Edit
            </button>
          ) : null}
        </div>

        {message ? (
          <div className="mb-4 border border-brand-info/20 bg-brand-info/5 px-3 py-2 text-sm font-medium text-brand-info">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleCreateOrUpdate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Full name" required />
          <input value={form.email} onChange={(event) => handleChange('email', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Email" />
          <input value={form.mobile} onChange={(event) => handleChange('mobile', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Mobile number" required />
          <input value={form.panNo} onChange={(event) => handleChange('panNo', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="PAN number" />
          {!editingUser ? (
            <input value={form.password} onChange={(event) => handleChange('password', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Temporary password" type="password" required />
          ) : null}
          <select value={form.role} onChange={(event) => handleChange('role', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary font-bold">
            <option value="AGENT">Member Agent</option>
            <option value="MANAGER">District Manager</option>
            <option value="ADMIN">System Administrator</option>
          </select>
          <input value={form.rank} onChange={(event) => handleChange('rank', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary font-bold" placeholder="Rank" required />
          <select value={form.sponsorId} onChange={(event) => handleChange('sponsorId', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary font-bold">
            <option value="">No sponsor / Company Root</option>
            {sponsorOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.userId})
              </option>
            ))}
          </select>
          <input value={form.address} onChange={(event) => handleChange('address', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Address" />
          <input value={form.bankName} onChange={(event) => handleChange('bankName', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Bank Name" />
          <input value={form.accountNo} onChange={(event) => handleChange('accountNo', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="Account Number" />
          <input value={form.ifscCode} onChange={(event) => handleChange('ifscCode', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="IFSC Code" />
          <input type="number" step="0.1" value={form.tdsPercentage} onChange={(event) => handleChange('tdsPercentage', event.target.value)} className="border border-brand-border px-3 py-2 text-sm bg-brand-bg/30 focus:bg-white transition-colors outline-none focus:border-brand-primary" placeholder="TDS % (e.g. 5.0)" />
          <div className="md:col-span-2 xl:col-span-4 pt-2">
            <button
              type="submit"
              className="bg-brand-sidebar px-6 py-2.5 text-sm font-bold text-brand-accent hover:bg-brand-sidebarHover border border-brand-accent/20 transition-all uppercase tracking-widest"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : editingUser ? 'Apply User Updates' : 'Confirm User Enrollment'}
            </button>
          </div>
        </form>
      </div>

      <LegacyTable title="Master User & Agent Directory" dateRange={false} columns={columns} data={loading ? [] : tableData} />
    </div>
  );
};

export default AdminUsers;

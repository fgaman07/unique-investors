import { useEffect, useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Award, Calendar, CreditCard, MapPin, Landmark, TrendingUp, TrendingDown, Wallet, AlertCircle, Edit, Save, X } from 'lucide-react';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const UserSummary = () => {
  const { targetUserId, user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
      const [profileRes, summaryRes] = await Promise.all([
        api.get(`/auth/me${query}`),
        api.get(`/mlm/summary${query}`),
      ]);
      setUser(profileRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching user summary', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

  const handleEditClick = () => {
    setEditForm({
      mobile: user.mobile,
      email: user.email || '',
      panNo: user.panNo || '',
      address: user.address || '',
      bankName: user.bankName || '',
      accountNo: user.accountNo || '',
      ifscCode: user.ifscCode || '',
      tdsPercentage: user.tdsPercentage ?? 5
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...editForm, tdsPercentage: Number(editForm.tdsPercentage) };
      await api.put(`/auth/users/${user.id}`, payload);
      setEditing(false);
      await fetchData(); 
    } catch (error) {
      console.error('Failed to update user', error);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  const renderRow = (label: string, value: string | number, bg = '', bold = false) => (
    <div className={`flex justify-between items-center px-4 py-2 border-b border-gray-100 ${bg}`}>
      <span className={`text-[13px] text-gray-700 ${bold ? 'font-bold text-blue-900' : ''}`}>{label}</span>
      <span className={`text-[13px] font-semibold text-gray-900 ${bold ? 'text-blue-900 font-black' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <AdminUserSelector />
      
      {/* Header Tab */}
      <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2">
        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">User Summary</span>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm p-4 space-y-6">
        
        {authUser?.role === 'ADMIN' && (
           <div className="flex justify-end mb-2">
             {editing ? (
               <div className="flex gap-2">
                 <button onClick={() => setEditing(false)} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded text-sm font-bold text-gray-600 hover:bg-gray-200">
                   <X size={16} /> Cancel
                 </button>
                 <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-green-600 px-3 py-1.5 rounded text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
                   <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                 </button>
               </div>
             ) : (
               <button onClick={handleEditClick} className="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded text-sm font-bold text-blue-700 hover:bg-blue-200">
                 <Edit size={16} /> Edit Profile Data
               </button>
             )}
           </div>
        )}

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded shadow-sm overflow-hidden">
            <div className="bg-brand-sidebar text-white p-5 flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-brand-sidebarHover">
                <User size={36} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{user.name}</h2>
                <p className="text-yellow-300 text-sm font-semibold">{user.rank}</p>
                <p className="text-xs opacity-75 mt-0.5">ID: {user.userId}</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { icon: Phone, label: 'Mobile', value: user.mobile, field: 'mobile' },
                { icon: Mail, label: 'Email', value: user.email || 'N/A', field: 'email' },
                { icon: CreditCard, label: 'PAN No.', value: user.panNo || 'Pending KYC', field: 'panNo' },
                { icon: MapPin, label: 'Address', value: user.address || 'Not provided', field: 'address' },
                { icon: Calendar, label: 'Joining Date', value: new Date(user.joiningDate).toLocaleDateString('en-GB') },
                { icon: Award, label: 'Sponsor', value: user.sponsor ? `${user.sponsor.name} (${user.sponsor.userId})` : 'Direct' },
              ].map(({ icon: Icon, label, value, field }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                    {editing && field ? (
                      <input 
                        type="text" 
                        value={editForm[field] || ''} 
                        onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                        className="w-full border p-1 text-sm bg-blue-50 focus:outline-none focus:border-blue-400 rounded mt-1 text-gray-800"
                        placeholder={`Enter ${label}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-white border rounded shadow-sm overflow-hidden">
            <div className="bg-[#f5f6f8] border-b px-4 py-2 flex items-center gap-2">
              <Landmark size={16} className="text-brand-primary" />
              <span className="text-[13px] font-bold text-gray-700 uppercase">Banking Details</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Bank Name', value: user.bankName || 'Not provided', field: 'bankName' },
                { label: 'Account Number', value: user.accountNo || 'Not provided', field: 'accountNo' },
                { label: 'IFSC Code', value: user.ifscCode || 'Not provided', field: 'ifscCode' },
                { label: 'TDS Rate (%)', value: `${user.tdsPercentage ?? 5}`, field: 'tdsPercentage' },
              ].map(({ label, value, field }) => (
                <div key={label} className="grid grid-cols-2 gap-2 border-b border-gray-50 py-2 last:border-0 items-center">
                  <span className="text-[12px] text-gray-500 font-semibold">{label}</span>
                  {editing && field ? (
                    <input 
                      type={field === 'tdsPercentage' ? "number" : "text"}
                      step={field === 'tdsPercentage' ? "0.1" : undefined}
                      value={editForm[field] || ''} 
                      onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                      className="w-full border p-1 text-[12px] bg-blue-50 focus:outline-none focus:border-blue-400 rounded text-gray-800"
                      placeholder={`Enter ${label}`}
                    />
                  ) : (
                    <span className="text-[12px] text-gray-800 font-medium">{field === 'tdsPercentage' && value !== 'Not provided' ? `${value}%` : value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        {summary && (
          <div className="bg-white border rounded shadow-sm overflow-hidden">
            <div className="bg-[#f5f6f8] border-b px-4 py-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-primary" />
              <span className="text-[13px] font-bold text-gray-700 uppercase">Financial Summary</span>
            </div>
            <div className="divide-y divide-gray-50">
              {renderRow('Promotional Incentive', `₹ ${summary.promotionalIncentive.toLocaleString('en-IN')}`, 'bg-[#e8f5e9]')}
              {renderRow('Level Incentive', `₹ ${summary.levelIncentive.toLocaleString('en-IN')}`, 'bg-[#e3f2fd]')}
              {renderRow('Total Earning (Promotional + Level)', `₹ ${summary.totalEarning.toLocaleString('en-IN')}`)}
              {renderRow(`TDS @ ${summary.tdsRate}%`, `₹ ${summary.tds.toLocaleString('en-IN')}`)}
              {renderRow('Released Amount', `₹ ${summary.releasedAmount.toLocaleString('en-IN')}`, 'bg-[#e3f2fd]')}
              {renderRow('Balance (Promotional + Level)', `₹ ${summary.balance.toLocaleString('en-IN')}`, 'bg-[#e8f5e9]', true)}
            </div>
            <div className="p-4 bg-gray-50 flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-500" />
              <p className="text-[11px] text-gray-500 italic">All amounts are subject to final verification and TDS deductions as per Income Tax rules.</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: 'Total Earning', value: `₹ ${summary.totalEarning.toLocaleString('en-IN')}`, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: TrendingDown, label: 'TDS Deducted', value: `₹ ${summary.tds.toLocaleString('en-IN')}`, color: 'text-red-500', bg: 'bg-red-50' },
              { icon: Wallet, label: 'Released', value: `₹ ${summary.releasedAmount.toLocaleString('en-IN')}`, color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Award, label: 'Balance', value: `₹ ${summary.balance.toLocaleString('en-IN')}`, color: 'text-brand-primary', bg: 'bg-orange-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`${bg} border rounded p-4 flex items-center gap-3`}>
                <div className={`${color} flex-shrink-0`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
                  <p className={`text-sm font-black ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSummary;

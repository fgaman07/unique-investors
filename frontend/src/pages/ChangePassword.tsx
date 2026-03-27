import { useState } from 'react';
import { api } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { AdminUserSelector } from '../components/common/AdminUserSelector';
import { useAuth } from '../context/AuthContext';

// ★ CRITICAL: This component MUST be defined OUTSIDE of ChangePassword.
// Defining it inside causes React to destroy and recreate the <input> on every keystroke,
// which unmounts the element, loses focus, and makes typing appear frozen.
const PasswordInput = ({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) => (
  <div>
    <label className="block text-[13px] font-semibold text-gray-600 mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-primary pr-10"
        placeholder={placeholder}
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

const ChangePassword = () => {
  const { targetUserId } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      let res;
      if (targetUserId) {
        res = await api.post(`/auth/users/${targetUserId}/reset-password`, {
          newPassword: form.newPassword
        });
      } else {
        res = await api.put('/auth/change-password', {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      }
      setMessage({ type: 'success', text: res.data?.message || 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));
  const toggleShow = (field: keyof typeof showPass) => setShowPass(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <AdminUserSelector />
      <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2">
        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Change Password</span>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm p-6 max-w-md mx-auto mt-4">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
            <Lock size={20} className="text-brand-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Change Your Password</h2>
            <p className="text-xs text-gray-500">Keep your account secure with a strong password.</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!targetUserId && (
            <PasswordInput
              label="Current Password"
              value={form.currentPassword}
              onChange={val => updateField('currentPassword', val)}
              show={showPass.current}
              onToggle={() => toggleShow('current')}
              placeholder="Enter current password"
            />
          )}
          <PasswordInput
            label="New Password"
            value={form.newPassword}
            onChange={val => updateField('newPassword', val)}
            show={showPass.new}
            onToggle={() => toggleShow('new')}
            placeholder="Enter new password"
          />
          <PasswordInput
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={val => updateField('confirmPassword', val)}
            show={showPass.confirm}
            onToggle={() => toggleShow('confirm')}
            placeholder="Enter confirm new password"
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-sidebarHover text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-[11px] text-gray-400 space-y-1">
          <p>• Password must be at least 6 characters long.</p>
          <p>• Include uppercase, lowercase, numbers for stronger security.</p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

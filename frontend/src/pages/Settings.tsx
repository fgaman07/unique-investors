import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';

interface CompanySettings {
  companyName: string;
  registrationNo?: string;
  address?: string;
  supportEmail?: string;
  contactNumber?: string;
}

interface CommissionSetting {
  id?: string;
  level: number;
  label: string;
  percentage: number;
  isActive: boolean;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'mlm'>('company');
  const [company, setCompany] = useState<CompanySettings>({
    companyName: '',
    registrationNo: '',
    address: '',
    supportEmail: '',
    contactNumber: '',
  });
  const [mlmSettings, setMlmSettings] = useState<CommissionSetting[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [companyResponse, mlmResponse] = await Promise.all([
          api.get<CompanySettings>('/settings/company'),
          api.get<CommissionSetting[]>('/settings/mlm'),
        ]);
        setCompany(companyResponse.data);
        setMlmSettings(mlmResponse.data);
      } catch (error) {
        console.error('Error fetching settings', error);
        setMessage('Failed to load system settings.');
      }
    };

    loadSettings();
  }, []);

  const handleCompanySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.put('/settings/company', company);
      setMessage('Company profile updated successfully.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to update company settings.');
    }
  };

  const handleMlmSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.put('/settings/mlm', { settings: mlmSettings });
      setMessage('MLM commission slabs updated successfully.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to update MLM settings.');
    }
  };

  const handleRecalculate = async () => {
    try {
      await api.post('/settings/mlm/recalculate');
      setMessage('Commission ledger recalculated successfully.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to recalculate the commission ledger.');
    }
  };

  return (
    <div className="space-y-4 p-4">
      {message ? (
        <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'company' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}
        >
          Company Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mlm')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'mlm' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}
        >
          MLM Engine Settings
        </button>
      </div>

      {activeTab === 'company' ? (
        <form onSubmit={handleCompanySubmit} className="grid gap-4 border border-slate-200 bg-white p-4 md:grid-cols-2">
          <input value={company.companyName} onChange={(event) => setCompany((current) => ({ ...current, companyName: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="Company name" required />
          <input value={company.registrationNo || ''} onChange={(event) => setCompany((current) => ({ ...current, registrationNo: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="Registration number" />
          <input value={company.supportEmail || ''} onChange={(event) => setCompany((current) => ({ ...current, supportEmail: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="Support email" />
          <input value={company.contactNumber || ''} onChange={(event) => setCompany((current) => ({ ...current, contactNumber: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="Contact number" />
          <textarea value={company.address || ''} onChange={(event) => setCompany((current) => ({ ...current, address: event.target.value }))} className="min-h-28 border px-3 py-2 text-sm md:col-span-2" placeholder="Registered address" />
          <div className="md:col-span-2">
            <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Save Company Settings
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleMlmSubmit} className="space-y-4 border border-slate-200 bg-white p-4">
          {mlmSettings.map((setting, index) => (
            <div key={setting.level} className="grid gap-3 md:grid-cols-4">
              <input value={setting.level} readOnly className="border px-3 py-2 text-sm bg-slate-50" />
              <input value={setting.label} onChange={(event) => setMlmSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} className="border px-3 py-2 text-sm" placeholder="Label" />
              <input type="number" value={setting.percentage} onChange={(event) => setMlmSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, percentage: Number(event.target.value) } : item))} className="border px-3 py-2 text-sm" placeholder="Percentage" />
              <label className="flex items-center gap-2 border px-3 py-2 text-sm">
                <input type="checkbox" checked={setting.isActive} onChange={(event) => setMlmSettings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} />
                Active
              </label>
            </div>
          ))}

          <div className="flex gap-3">
            <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Save MLM Settings
            </button>
            <button type="button" onClick={handleRecalculate} className="border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900">
              Recalculate Ledger
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;

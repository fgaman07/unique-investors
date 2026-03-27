import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';
import { Plus, X } from 'lucide-react';

const COLUMNS = [
  { header: 'Date', field: 'date' },
  { header: 'Income Source', field: 'incomeType' },
  { header: 'Amount (₹)', field: 'amount' },
  { header: 'Remarks/Receipt', field: 'remarks' },
  { header: 'Mode of Payment', field: 'paymentMode' },
  { header: 'Status', field: 'status' }
];

const IncentiveReport = () => {
  const { user, targetUserId } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incentiveForm, setIncentiveForm] = useState({ userId: '', amount: '', incomeType: 'Custom Bonus', remarks: '' });
  
  // Fetch agents for the dropdown if Admin
  const { data: agentsData } = useQuery({
    queryKey: ['allAgentsDropdown'],
    queryFn: async () => {
      const res = await api.get('/auth/users?limit=1000');
      return res.data.users;
    },
    enabled: user?.role === 'ADMIN' && isModalOpen
  });

  const { data: rawCommissions, isLoading: loading } = useQuery({
    queryKey: ['commissions', targetUserId || 'self'],
    queryFn: async () => {
      const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
      const response = await api.get(`/mlm/commissions${query}`);
      return response.data.commissions.filter((c: any) => c.incomeType !== 'Promotional');
    }
  });

  const standardCommissions = rawCommissions || [];
  const data = standardCommissions.map((item: any) => ({
    ...item,
    date: new Date(item.createdAt).toLocaleDateString('en-GB'),
    amount: parseFloat(item.amount).toLocaleString('en-IN')
  }));

  const totals = {
    pending: standardCommissions.filter((c: any) => c.status === 'PENDING').reduce((s: number, c: any) => s + c.amount, 0),
    released: standardCommissions.filter((c: any) => c.status === 'RELEASED').reduce((s: number, c: any) => s + c.amount, 0),
    total: standardCommissions.reduce((s: number, c: any) => s + c.amount, 0)
  };

  const generateIncentiveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/mlm/commissions/custom', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setIsModalOpen(false);
      setIncentiveForm({ userId: '', amount: '', incomeType: 'Custom Bonus', remarks: '' });
      alert('Custom Incentive Generated successfully!');
    },
    onError: (error: any) => alert(error.response?.data?.message || 'Error creating incentive')
  });

  const handleCreateIncentive = (e: React.FormEvent) => {
    e.preventDefault();
    generateIncentiveMutation.mutate({
      ...incentiveForm,
      amount: Number(incentiveForm.amount)
    });
  };

  return (
    <div className="w-full h-full pb-10 flex flex-col space-y-4 relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1"><AdminUserSelector /></div>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-brand-primary text-white px-4 py-2 text-sm font-bold shadow-md hover:bg-brand-accent transition-colors"
          >
            <Plus size={16} />
            <span>Generate Custom Incentive</span>
          </button>
        )}
      </div>

      <LegacyTable 
        title="Agent Incentive & Commission Ledger" 
        dateRange={true} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
      
      {!loading && (
        <div className="bg-white border border-gray-300 p-4 flex justify-between items-center text-sm font-bold shadow-sm">
          <div className="text-gray-600">Total Pending: <span className="text-orange-500">₹ {totals.pending.toLocaleString('en-IN')}</span></div>
          <div className="text-gray-600">Total Released: <span className="text-green-600">₹ {totals.released.toLocaleString('en-IN')}</span></div>
          <div className="text-gray-800 text-base">Grand Total: <span className="text-brand-primary font-black ml-2">₹ {totals.total.toLocaleString('en-IN')}</span></div>
        </div>
      )}

      {/* Manual Incentive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-brand-primary">Issue Custom Incentive</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleCreateIncentive} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Select Beneficiary Agent</label>
                <select 
                  required
                  value={incentiveForm.userId}
                  onChange={e => setIncentiveForm(s => ({...s, userId: e.target.value}))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Choose Agent --</option>
                  {agentsData?.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.userId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Incentive Type</label>
                <select 
                  required
                  value={incentiveForm.incomeType}
                  onChange={e => setIncentiveForm(s => ({...s, incomeType: e.target.value}))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="Custom Bonus">Custom Bonus</option>
                  <option value="Diwali Bonus">Festival Bonus (Diwali)</option>
                  <option value="Target Bonus">Target Completion Bonus</option>
                  <option value="Travel Fund">Travel Allowance</option>
                  <option value="Car Fund">Car Fund</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  required min="1"
                  value={incentiveForm.amount}
                  onChange={e => setIncentiveForm(s => ({...s, amount: e.target.value}))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. 5000"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Remarks (Optional)</label>
                <textarea 
                  value={incentiveForm.remarks}
                  onChange={e => setIncentiveForm(s => ({...s, remarks: e.target.value}))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Reason for incentive..."
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={generateIncentiveMutation.isPending} className="px-4 py-2 bg-brand-primary text-white font-bold hover:bg-brand-accent">
                  {generateIncentiveMutation.isPending ? 'Generating...' : 'Issue Incentive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentiveReport;

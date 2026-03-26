import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const AdminPayments = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mlm/all-commissions');
      
      const formatted = (response.data.commissions || []).map((item: any) => ({
        ...item,
        date: new Date(item.createdAt).toLocaleDateString('en-GB'),
        agentInfo: `${item.user?.name} (${item.user?.userId})`,
        amountRaw: item.amount,
        amount: `₹ ${item.amount.toLocaleString('en-IN')}`,
        statusDisplay: item.status === 'RELEASED' ? (
          <span className="text-green-600 font-bold px-2 py-0.5 bg-green-50 border border-green-200 text-[10px] rounded">CLEARED</span>
        ) : (
          <span className="text-orange-600 font-bold px-2 py-0.5 bg-orange-50 border border-orange-200 text-[10px] rounded">PENDING</span>
        ),
        actions: (
          <div className="flex items-center space-x-2 min-w-[120px]">
            {item.status === 'PENDING' ? (
              confirmId === item.id ? (
                <div className="flex items-center space-x-1 animate-in fade-in duration-300">
                  <button 
                    onClick={() => performRelease(item.id)}
                    className="bg-green-600 text-white text-[10px] px-2 py-1 rounded shadow hover:bg-green-700 font-bold"
                  >
                    YES, NEFT
                  </button>
                  <button 
                    onClick={() => setConfirmId(null)}
                    className="bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded shadow hover:bg-gray-300 font-bold"
                  >
                    NO
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmId(item.id)}
                  disabled={!isAdmin || releasingId === item.id}
                  className="bg-brand-primary text-white text-[10px] px-3 py-1 rounded shadow hover:bg-brand-sidebarHover disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {releasingId === item.id ? 'RELEASING...' : 'APPROVE & RELEASE'}
                </button>
              )
            ) : (
              <span className="text-[10px] text-gray-500 font-semibold italic">{item.paymentMode || 'NEFT'} Disbursal</span>
            )}
          </div>
        )
      }));
      
      setData(formatted);
    } catch (error) {
      console.error('Error fetching admin payments', error);
      setMessage({ type: 'error', text: 'Failed to fetch the global ledger records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refresh, confirmId]); // Reload when entering/exiting confirm state to update UI buttons

  const performRelease = async (id: string) => {
    if (!isAdmin) return;
    try {
      setReleasingId(id);
      setConfirmId(null);
      setMessage(null);
      
      await api.put(`/mlm/commissions/${id}/release`, { 
        paymentMode: 'NEFT', 
        remarks: 'Admin approved release via Central Disbursal' 
      });
      
      setMessage({ type: 'success', text: 'Payment released and cleared successfully!' });
      setRefresh(r => r + 1);
    } catch (err: any) {
      console.error('Release failed:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Transaction failed. Please try again.' 
      });
    } finally {
      setReleasingId(null);
    }
  };

  const columns = [
    { header: 'Gen. Date', field: 'date' },
    { header: 'Agent Code / Name', field: 'agentInfo' },
    { header: 'Commission Type', field: 'incomeType' },
    { header: 'Amount Due', field: 'amount' },
    { header: 'Current Status', field: 'statusDisplay' },
    { header: 'Admin Action', field: 'actions' }
  ];

  return (
    <div className="w-full h-full pb-10 flex flex-col space-y-4">
       <div className="bg-white border border-brand-primary p-3 flex justify-between items-center text-sm shadow-sm rounded-t">
        <div className="flex items-center space-x-2">
          <CheckCircle size={18} className="text-brand-primary" />
          <h3 className="font-bold text-slate-800 tracking-tight uppercase">Central Bank Clearance / Payment Disbursal</h3>
        </div>
        {!isAdmin && (
          <div className="flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
            <AlertCircle size={14} />
            <p className="font-bold text-[10px]">ADMIN PRIVILEGES REQUIRED</p>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 text-sm font-semibold border-l-4 rounded flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100 italic text-[11px]">Dismiss</button>
        </div>
      )}

      <div className="flex-1 bg-white rounded shadow-sm overflow-hidden">
        <LegacyTable 
          title="Global Commission Tracking & Payout Ledger" 
          dateRange={true} 
          columns={columns} 
          data={loading ? [] : data} 
        />
      </div>
    </div>
  );
};

export default AdminPayments;

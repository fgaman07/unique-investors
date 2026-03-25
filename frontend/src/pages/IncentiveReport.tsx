import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const COLUMNS = [
  { header: 'Date', field: 'date' },
  { header: 'Income Source', field: 'incomeType' },
  { header: 'Amount (₹)', field: 'amount' },
  { header: 'Remarks/Receipt', field: 'remarks' },
  { header: 'Mode of Payment', field: 'paymentMode' },
  { header: 'Status', field: 'status' }
];

const IncentiveReport = () => {
  const { targetUserId } = useAuth();
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({ pending: 0, released: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Exclude promotional incentives for this standard commission report
        const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
        const response = await api.get(`/mlm/commissions${query}`);
        
        const standardCommissions = response.data.commissions.filter((c: any) => c.incomeType !== 'Promotional');
        const formatted = standardCommissions.map((item: any) => ({
          ...item,
          date: new Date(item.createdAt).toLocaleDateString('en-GB'),
          amount: parseFloat(item.amount).toLocaleString('en-IN')
        }));
        
        setData(formatted);
        
        // Calculate filtered totals
        const pTotal = standardCommissions.filter((c: any) => c.status === 'PENDING').reduce((s: number, c: any) => s + c.amount, 0);
        const rTotal = standardCommissions.filter((c: any) => c.status === 'RELEASED').reduce((s: number, c: any) => s + c.amount, 0);
        setTotals({ pending: pTotal, released: rTotal, total: pTotal + rTotal });

      } catch (error) {
        console.error('Error fetching incentive report', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetUserId]);

  return (
    <div className="w-full h-full pb-10 flex flex-col space-y-4">
      <AdminUserSelector />
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
    </div>
  );
};

export default IncentiveReport;

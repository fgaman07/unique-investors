import { useEffect, useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const PromotionalIncentive = () => {
  const { targetUserId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ pending: 0, released: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
        const response = await api.get(`/mlm/commissions${query}`);
        const promotional = response.data.commissions.filter((c: any) => c.incomeType === 'Promotional');
        setData(
          promotional.map((item: any) => ({
            ...item,
            date: new Date(item.createdAt).toLocaleDateString('en-GB'),
            amountDisplay: `₹ ${parseFloat(item.amount).toLocaleString('en-IN')}`,
          }))
        );
        setTotals({
          pending: promotional.filter((c: any) => c.status === 'PENDING').reduce((s: number, c: any) => s + c.amount, 0),
          released: promotional.filter((c: any) => c.status === 'RELEASED').reduce((s: number, c: any) => s + c.amount, 0),
        });
      } catch (error) {
        console.error('Error fetching promotional incentive', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetUserId]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <AdminUserSelector />
      {/* Header Tab */}
      <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2">
        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Promotional Incentive</span>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
        {/* Stats Bar */}
        {!loading && (
          <div className="bg-[#B2EBF2] p-3 grid grid-cols-3 text-center border-b border-gray-200">
            <div>
              <p className="text-[11px] text-gray-600 font-semibold uppercase">Total Promotional</p>
              <p className="text-base font-bold text-blue-900">₹ {(totals.pending + totals.released).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-600 font-semibold uppercase">Released</p>
              <p className="text-base font-bold text-green-700">₹ {totals.released.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-600 font-semibold uppercase">Pending</p>
              <p className="text-base font-bold text-orange-600">₹ {totals.pending.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-[12px]">
            <thead>
              <tr className="bg-[#D1D1D1] border-b border-gray-400">
                {['Date', 'Income Type', 'Amount (₹)', 'Remarks', 'Payment Mode', 'Status'].map(col => (
                  <th key={col} className="p-2 border-r border-white text-[11px] font-bold text-gray-800 uppercase text-center">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-gray-500 italic font-bold">Loading Promotional Incentive Records...</td></tr>
              ) : data.length > 0 ? data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100 text-center">
                  <td className="p-2 border-r border-gray-200">{row.date}</td>
                  <td className="p-2 border-r border-gray-200 font-medium text-blue-700">{row.incomeType}</td>
                  <td className="p-2 border-r border-gray-200 text-green-700 font-semibold">{row.amountDisplay}</td>
                  <td className="p-2 border-r border-gray-200 text-gray-600">{row.remarks || '-'}</td>
                  <td className="p-2 border-r border-gray-200">{row.paymentMode || '-'}</td>
                  <td className={`p-2 font-semibold ${row.status === 'RELEASED' ? 'text-green-600' : 'text-orange-500'}`}>{row.status}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-16 text-center text-gray-400 italic">No promotional incentive records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-center py-3 text-[11px] text-gray-400 italic font-bold border-t">
          (c) uniqueinvestors PVT. LTD All Rights Reserved 2021
        </div>
      </div>
    </div>
  );
};

export default PromotionalIncentive;

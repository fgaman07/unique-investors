import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

const AdminPayments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mlm/all-commissions');
      
      const formatted = response.data.commissions.map((item: any) => ({
        ...item,
        date: new Date(item.createdAt).toLocaleDateString('en-GB'),
        agentInfo: `${item.user?.name} (${item.user?.userId})`,
        amountRaw: item.amount,
        amount: `₹ ${item.amount.toLocaleString()}`,
        statusDisplay: item.status === 'RELEASED' ? (
          <span className="text-green-600 font-bold px-2 py-0.5 bg-green-50 border border-green-200">CLEARED</span>
        ) : (
          <span className="text-orange-600 font-bold px-2 py-0.5 bg-orange-50 border border-orange-200">PENDING</span>
        ),
        actions: item.status === 'PENDING' ? (
          <button 
            onClick={() => handleRelease(item.id)}
            className="bg-brand-primary text-white text-[10px] px-3 py-1 rounded shadow hover:bg-brand-sidebarHover"
          >
            APPROVE & RELEASE
          </button>
        ) : (
          <span className="text-[10px] text-gray-500">{item.paymentMode}</span>
        )
      }));
      
      setData(formatted);
    } catch (error) {
      console.error('Error fetching admin payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refresh]);

  const handleRelease = async (id: string) => {
    if (window.confirm("Approve and trigger release of this commission via NEFT?")) {
      try {
        await api.put(`/mlm/commissions/${id}/release`, { paymentMode: 'NEFT', remarks: 'Admin approved release' });
        setRefresh(r => r + 1); // trigger table reload
        alert("Payment Marked as Released");
      } catch (err) {
        alert("Failed to release payment");
      }
    }
  };

  const columns = [
    { header: 'Generated Date', field: 'date' },
    { header: 'Agent Code / Name', field: 'agentInfo' },
    { header: 'Commission Type', field: 'incomeType' },
    { header: 'Amount Due', field: 'amount' },
    { header: 'Current Status', field: 'statusDisplay' },
    { header: 'Admin Action', field: 'actions' }
  ];

  return (
    <div className="w-full h-full pb-10">
       <div className="bg-white border border-brand-primary p-3 mb-4 flex justify-between items-center text-sm">
        <h3 className="font-bold text-gray-700">Central Bank Clearance / Payment Disbursal</h3>
        <p className="text-red-600 font-bold">Only Admin can execute this action.</p>
      </div>

      <LegacyTable 
        title="Global Commission Tracking & Payout Ledger" 
        dateRange={true} 
        columns={columns} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default AdminPayments;

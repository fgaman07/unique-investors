import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';

const COLUMNS = [
  { header: 'Ledger Ref', field: 'id' },
  { header: 'Agent Code', field: 'agentCode' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Amount Requested (₹)', field: 'amount' },
  { header: 'Payment Method', field: 'paymentMode' },
  { header: 'Remarks/Status', field: 'remarks' },
  { header: 'Current Phase', field: 'phase' }
];

const ReleasePayment = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Agent sees their own pending commissions, Admin sees all pending
        const endpoint = isAdmin ? '/mlm/all-commissions?status=PENDING' : '/mlm/commissions?status=PENDING';
        const response = await api.get(endpoint);
        
        const formatted = response.data.commissions.map((item: any) => ({
          ...item,
          agentCode: item.user?.userId || user?.userId || '-',
          name: item.user?.name || user?.name || '-',
          amount: parseFloat(item.amount).toLocaleString('en-IN'),
          paymentMode: item.paymentMode || 'NEFT (Default)',
          phase: 'Awaiting Admin Approval',
          id: item.id.substring(0, 8).toUpperCase()
        }));
        
        setData(formatted);
      } catch (error) {
        console.error('Error fetching pending payments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, user]);

  return (
    <div className="w-full h-full pb-10">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm text-yellow-800">
        <p className="font-bold">Payment Clearance Process</p>
        <p>All pending commissions listed below will be automatically processed by the system during the next payout cycle. Please ensure your Bank Details / KYC are updated.</p>
      </div>

      <LegacyTable 
        title="Pending Commission Release Status" 
        dateRange={true} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default ReleasePayment;

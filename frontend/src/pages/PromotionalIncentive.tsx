import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

const COLUMNS = [
  { header: 'Date', field: 'date' },
  { header: 'Bonus / Promotion Title', field: 'remarks' },
  { header: 'Amount (₹)', field: 'amount' },
  { header: 'Payment Mode', field: 'paymentMode' },
  { header: 'Status', field: 'status' }
];

const PromotionalIncentive = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/mlm/commissions?type=Promotional');
        const formatted = response.data.commissions.map((item: any) => ({
          ...item,
          date: new Date(item.createdAt).toLocaleDateString('en-GB'),
          amount: parseFloat(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        }));
        
        setData(formatted);
      } catch (error) {
        console.error('Error fetching promotional incentives', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full h-full pb-10">
      <LegacyTable 
        title="Special Promotional & Achievers Incentive Report" 
        dateRange={true} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default PromotionalIncentive;

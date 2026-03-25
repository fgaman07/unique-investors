import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

const COLUMNS = [
  { header: 'S.No', field: 'sno' },
  { header: 'Agent ID', field: 'userId' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Rank', field: 'rank' },
  { header: 'Mobile', field: 'mobile' },
  { header: 'Joining Date', field: 'joiningDate' }
];

const DirectMemberReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/mlm/direct-members');
        const formatted = response.data.members.map((item: any, idx: number) => ({
          ...item,
          sno: idx + 1,
          joiningDate: new Date(item.joiningDate).toLocaleDateString('en-GB')
        }));
        
        setData(formatted);
      } catch (error) {
        console.error('Error fetching direct members', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full h-full pb-10">
      <LegacyTable 
        title="Direct Sponsor Report (Level 1)" 
        dateRange={true} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default DirectMemberReport;

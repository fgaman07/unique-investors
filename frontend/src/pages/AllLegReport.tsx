import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

const COLUMNS = [
  { header: 'Level/Leg', field: 'level' },
  { header: 'Agent ID', field: 'userId' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Role/Rank', field: 'rank' },
  { header: 'Sponsor ID', field: 'sponsorId' },
  { header: 'Joining Date', field: 'joiningDate' }
];

const AllLegReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/mlm/downline');
        const formatted = response.data.downline.map((item: any) => ({
          ...item,
          level: `Leg ${item.level}`,
          sponsorId: item.sponsorId || 'Direct',
          joiningDate: new Date(item.joiningDate).toLocaleDateString('en-GB')
        })).sort((a: any, b: any) => a.level.localeCompare(b.level));
        
        setData(formatted);
      } catch (error) {
        console.error('Error fetching all leg report', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full h-full pb-10">
      <LegacyTable 
        title="All Leg Network Configuration Report" 
        dateRange={false} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default AllLegReport;

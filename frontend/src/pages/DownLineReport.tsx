import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

const COLUMNS = [
  { header: 'Level', field: 'level' },
  { header: 'Agent ID', field: 'userId' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Rank', field: 'rank' },
  { header: 'Mobile', field: 'mobile' },
  { header: 'Joining Date', field: 'joiningDate' }
];

const DownLineReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/mlm/downline');
        // Format the table data
        const formatted = response.data.downline.map((item: any) => ({
          ...item,
          level: `Level ${item.level}`,
          joiningDate: new Date(item.joiningDate).toLocaleDateString('en-GB')
        })).sort((a: any, b: any) => a.level.localeCompare(b.level)); // Sort by level
        
        setData(formatted);
      } catch (error) {
        console.error('Error fetching downline report', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full h-full pb-10">
      <LegacyTable 
        title="Comprehensive Downline Report (All Levels)" 
        dateRange={false} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default DownLineReport;

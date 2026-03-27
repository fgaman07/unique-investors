import { useQuery } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const COLUMNS = [
  { header: 'Level', field: 'level' },
  { header: 'Agent ID', field: 'userId' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Rank', field: 'rank' },
  { header: 'Mobile', field: 'mobile' },
  { header: 'Joining Date', field: 'joiningDate' }
];

const DownLineReport = () => {
  const { targetUserId } = useAuth();

  const { data: downline = [], isLoading: loading } = useQuery({
    queryKey: ['downline', targetUserId || 'self'],
    queryFn: async () => {
      const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
      const response = await api.get(`/mlm/downline${query}`);
      return response.data.downline.map((item: any) => ({
        ...item,
        level: `Level ${item.level}`,
        joiningDate: new Date(item.joiningDate).toLocaleDateString('en-GB')
      })).sort((a: any, b: any) => a.level.localeCompare(b.level));
    }
  });

  const data = downline;

  return (
    <div className="w-full h-full pb-10">
      <AdminUserSelector />
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

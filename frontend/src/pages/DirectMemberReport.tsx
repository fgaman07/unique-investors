import { useQuery } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const COLUMNS = [
  { header: 'S.No', field: 'sno' },
  { header: 'Agent ID', field: 'userId' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Rank', field: 'rank' },
  { header: 'Mobile', field: 'mobile' },
  { header: 'Leg Size', field: 'legSize' },
  { header: 'Business Volume (₹)', field: 'businessVolumeDisplay' },
  { header: 'Joining Date', field: 'joiningDate' },
];

const DirectMemberReport = () => {
  const { targetUserId } = useAuth();

  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ['directMembersWithVolume', targetUserId || 'self'],
    queryFn: async () => {
      const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
      const response = await api.get(`/mlm/direct-members-with-volume${query}`);
      return response.data.members.map((item: any, idx: number) => ({
        ...item,
        sno: idx + 1,
        businessVolumeDisplay: `₹ ${item.businessVolume.toLocaleString('en-IN')}`,
        joiningDate: new Date(item.joiningDate).toLocaleDateString('en-GB'),
      }));
    }
  });

  const data = members;

  return (
    <div className="w-full h-full pb-10 space-y-2">
      <AdminUserSelector />
      <LegacyTable
        title="Direct Sponsor Report (Level 1)"
        dateRange={true}
        columns={COLUMNS}
        data={loading ? [] : data}
        rowHighlight={(row: any) => row.isBiggerLeg ? 'bg-orange-50 border-l-2 border-orange-400' : ''}
      />

      {/* Bigger Leg Legend */}
      {!loading && (
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-5 h-5 bg-orange-100 border-l-2 border-orange-400 shadow-sm flex-shrink-0"></div>
          <span className="text-[12px] font-bold text-gray-700 italic">Bigger Leg (Highest Business Volume)</span>
        </div>
      )}
    </div>
  );
};

export default DirectMemberReport;

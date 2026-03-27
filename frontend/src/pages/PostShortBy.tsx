import { useQuery } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

const COLUMNS = [
  { header: 'Current Rank', field: 'currentRank' },
  { header: 'Next Target Rank', field: 'nextRank' },
  { header: 'Required Direct Sales', field: 'reqDirectSales' },
  { header: 'Actual Direct Sales', field: 'actualDirectSales' },
  { header: 'Short By', field: 'shortBy' },
  { header: 'Status', field: 'status' }
];

const PostShortBy = () => {
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['postShortBy'],
    queryFn: async () => {
      const { data: stats } = await api.get('/dashboard/stats');
      const ranks = ['Associate', 'Manager', 'Senior Manager', 'Director'];
      const targets = [0, 5, 15, 50];
      const currentRankIndex = ranks.indexOf(stats.user.rank) !== -1 ? ranks.indexOf(stats.user.rank) : 0;
      const nextRankIndex = Math.min(currentRankIndex + 1, ranks.length - 1);
      const isMaxRank = currentRankIndex === ranks.length - 1;
      const targetSales = targets[nextRankIndex];
      const actualSales = stats.totalSales;
      const shortBy = Math.max(0, targetSales - actualSales);
      return [{
        currentRank: stats.user.rank,
        nextRank: isMaxRank ? 'MAX RANK ACHIEVED' : ranks[nextRankIndex],
        reqDirectSales: isMaxRank ? '-' : targetSales,
        actualDirectSales: actualSales,
        shortBy: isMaxRank ? '-' : shortBy,
        status: isMaxRank ? 'Completed' : (shortBy === 0 ? 'Eligible for Promotion' : 'In Progress')
      }];
    },
  });

  return (
    <div className="w-full h-full pb-10">
      <LegacyTable 
        title="Rank Target & Shortfall Analysis" 
        dateRange={false} 
        columns={COLUMNS} 
        data={loading ? [] : data} 
      />
    </div>
  );
};

export default PostShortBy;

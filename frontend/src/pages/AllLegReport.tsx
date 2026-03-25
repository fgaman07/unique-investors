import { useEffect, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const COLUMNS = [
  { header: 'Level/Leg', field: 'levelLabel' },
  { header: 'Agent ID', field: 'userId' },
  { header: 'Agent Name', field: 'name' },
  { header: 'Role/Rank', field: 'rank' },
  { header: 'Mobile', field: 'mobile' },
  { header: 'Sponsor ID', field: 'sponsorIdDisplay' },
  { header: 'Joining Date', field: 'joiningDate' },
];

const AllLegReport = () => {
  const { targetUserId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({ prom: '', from: '', to: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
      const response = await api.get(`/mlm/downline${query}`);
      let filtered = response.data.downline;

      // Filter by date range if provided
      if (searchParams.from) {
        filtered = filtered.filter((u: any) => new Date(u.joiningDate) >= new Date(searchParams.from));
      }
      if (searchParams.to) {
        filtered = filtered.filter((u: any) => new Date(u.joiningDate) <= new Date(searchParams.to));
      }

      const formatted = filtered
        .map((item: any) => ({
          ...item,
          levelLabel: `Leg ${item.level}`,
          sponsorIdDisplay: item.sponsorId || 'Direct',
          joiningDate: new Date(item.joiningDate).toLocaleDateString('en-GB'),
        }))
        .sort((a: any, b: any) => a.levelLabel.localeCompare(b.levelLabel));

      setData(formatted);
    } catch (error) {
      console.error('Error fetching all leg report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <AdminUserSelector />
      {/* Header Tab */}
      <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2">
        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">All Leg Report</span>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-purple-300 shadow-sm overflow-hidden">
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 bg-[#B2EBF2] border-b border-gray-200">
          <div className="p-2 px-4 flex items-center gap-2 border-b md:border-b-0 md:border-r border-cyan-200">
            <span className="text-[13px] font-bold text-blue-900 underline italic whitespace-nowrap">Prom</span>
            <input
              type="text"
              value={searchParams.prom}
              onChange={e => setSearchParams(p => ({ ...p, prom: e.target.value }))}
              placeholder="Promotional ID"
              className="w-full h-6 border border-gray-400 px-2 text-[12px] outline-none bg-white"
            />
          </div>
          <div className="p-2 px-4 flex items-center gap-2 border-b md:border-b-0 md:border-r border-cyan-200">
            <span className="text-[13px] font-bold text-blue-900 underline italic">From</span>
            <input
              type="date"
              value={searchParams.from}
              onChange={e => setSearchParams(p => ({ ...p, from: e.target.value }))}
              className="w-full h-6 border border-gray-400 px-2 text-[12px] outline-none bg-white"
            />
          </div>
          <div className="p-2 px-4 flex items-center gap-2">
            <span className="text-[13px] font-bold text-blue-900 underline italic">To</span>
            <input
              type="date"
              value={searchParams.to}
              onChange={e => setSearchParams(p => ({ ...p, to: e.target.value }))}
              className="w-full h-6 border border-gray-400 px-2 text-[12px] outline-none bg-white"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="bg-[#B2EBF2] p-1.5 flex justify-center border-b border-gray-200">
          <button
            onClick={fetchData}
            className="bg-white border border-gray-400 hover:bg-gray-50 text-blue-900 text-[12px] px-8 py-0.5 font-bold shadow-sm transition-colors uppercase"
          >
            Search
          </button>
        </div>

        <div className="p-2">
          <LegacyTable
            title="All Leg Network Configuration Report"
            dateRange={false}
            columns={COLUMNS}
            data={loading ? [] : data}
          />
        </div>
      </div>
    </div>
  );
};

export default AllLegReport;

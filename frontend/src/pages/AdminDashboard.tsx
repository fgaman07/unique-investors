import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Users, Building, DollarSign, Briefcase } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/admin-stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Global Admin Data...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load admin stats. Please check server connection.</div>;

  return (
    <div className="p-4 bg-gray-50 space-y-6 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Global Admin Control Center</h1>
          <p className="text-sm text-gray-500">Unique Investors Unified System Status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">TOTAL NETWORK</p>
            <h2 className="text-2xl font-bold text-gray-800">{stats.totalUsers}</h2>
            <p className="text-xs text-gray-400 mt-1">{stats.totalAgents} Active Agents</p>
          </div>
        </div>

        {/* Global Sales */}
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-green-500 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">GLOBAL REVENUE</p>
            <h2 className="text-2xl font-bold text-gray-800">₹ {(stats.totalSaleAmount / 100000).toFixed(2)}L</h2>
            <p className="text-xs text-green-600 mt-1">₹ {(stats.totalCollected / 100000).toFixed(2)}L Collected</p>
          </div>
        </div>

        {/* Projects / Inventory */}
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-orange-500 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
            <Building size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">INVENTORY</p>
            <h2 className="text-2xl font-bold text-gray-800">{stats.totalProperties}</h2>
            <p className="text-xs text-gray-400 mt-1">Units across {stats.totalProjects} Projects</p>
          </div>
        </div>

        {/* Global Commissions */}
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-purple-500 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">COMMISSIONS (PENDING)</p>
            <h2 className="text-2xl font-bold text-red-600">₹ {(stats.pendingCommissions / 100000).toFixed(2)}L</h2>
            <p className="text-xs text-green-600 mt-1">₹ {(stats.releasedCommissions / 100000).toFixed(2)}L Released</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border rounded shadow-sm p-4 h-96 overflow-auto custom-scrollbar">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Live Activity (Recent Sales)</h3>
          {stats.recentSales?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSales.map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center p-3 border rounded text-sm hover:bg-gray-50">
                  <div>
                    <span className="font-bold block text-brand-primary">{sale.receiptNo}</span>
                    <span className="text-gray-500">{sale.agent?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold flex items-center text-gray-700">₹{sale.totalAmount.toLocaleString()}</span>
                    <span className="text-gray-400 block text-xs">{sale.property?.propertyNo} ({sale.property?.type})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-gray-400 mt-10">No recent sales found</div>
          )}
        </div>

        <div className="bg-white border rounded shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Inventory Status</h3>
          <div className="mt-8 space-y-6">
            <div>
              <div className="flex justify-between mb-1 text-sm font-medium">
                <span>Booked Properties</span>
                <span>{stats.bookedProperties} / {stats.totalProperties}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(stats.bookedProperties / stats.totalProperties) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-sm font-medium">
                <span>Payment Collection (EMIs)</span>
                <span>{stats.paidEMIs} / {stats.totalEMIs} Paid</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.totalEMIs ? (stats.paidEMIs / stats.totalEMIs) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

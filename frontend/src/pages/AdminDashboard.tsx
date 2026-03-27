import { useQuery } from '@tanstack/react-query';
import { api } from '../context/AuthContext';
import { Users, Building, IndianRupee, Briefcase } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading: loading, error } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin-stats');
      return data;
    }
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Global Admin Data...</div>;
  if (error || !stats) return <div className="p-8 text-center text-red-500">Failed to load admin stats. Please check server connection.</div>;

  return (
    <div className="p-4 bg-brand-bg space-y-6 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary uppercase tracking-tight">Global Admin Control Center</h1>
          <p className="text-sm text-brand-muted font-medium">Unique Investors Unified System Status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="card p-4 border-l-4 border-brand-info flex items-center space-x-4">
          <div className="p-3 bg-brand-info/5 text-brand-info rounded-full border border-brand-info/20">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">TOTAL NETWORK</p>
            <h2 className="text-2xl font-bold text-brand-primary">{stats.totalUsers}</h2>
            <p className="text-xs text-brand-muted mt-1 font-medium">{stats.totalAgents} Active Agents</p>
          </div>
        </div>

        {/* Global Sales */}
        <div className="card p-4 border-l-4 border-brand-success flex items-center space-x-4">
          <div className="p-3 bg-brand-success/5 text-brand-success rounded-full border border-brand-success/20">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">GLOBAL REVENUE</p>
            <h2 className="text-2xl font-bold text-brand-primary">₹ {(stats.totalSaleAmount / 100000).toFixed(2)}L</h2>
            <p className="text-xs text-brand-success mt-1 font-semibold">₹ {(stats.totalCollected / 100000).toFixed(2)}L Collected</p>
          </div>
        </div>

        {/* Projects / Inventory */}
        <div className="card p-4 border-l-4 border-brand-warning flex items-center space-x-4">
          <div className="p-3 bg-brand-warning/5 text-brand-warning rounded-full border border-brand-warning/20">
            <Building size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">INVENTORY</p>
            <h2 className="text-2xl font-bold text-brand-primary">{stats.totalProperties}</h2>
            <p className="text-xs text-brand-muted mt-1 font-medium">Units across {stats.totalProjects} Projects</p>
          </div>
        </div>

        {/* Global Commissions */}
        <div className="card p-4 border-l-4 border-brand-danger flex items-center space-x-4">
          <div className="p-3 bg-brand-danger/5 text-brand-danger rounded-full border border-brand-danger/20">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">COMMISSIONS (PENDING)</p>
            <h2 className="text-2xl font-bold text-brand-danger">₹ {(stats.pendingCommissions / 100000).toFixed(2)}L</h2>
            <p className="text-xs text-brand-success mt-1 font-semibold">₹ {(stats.releasedCommissions / 100000).toFixed(2)}L Released</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-4 h-96 overflow-auto custom-scrollbar">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-border pb-2 mb-4 flex items-center">
            <span className="w-1 h-5 bg-brand-accent mr-3"></span>
            Live Activity (Recent Sales)
          </h3>
          {stats.recentSales?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSales.map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center p-3 border border-brand-border bg-brand-surface text-sm hover:bg-brand-bg transition-colors">
                  <div>
                    <span className="font-bold block text-brand-primary">{sale.receiptNo}</span>
                    <span className="text-brand-muted text-xs">{sale.agent?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold flex items-center text-brand-primary">₹{sale.totalAmount.toLocaleString()}</span>
                    <span className="text-brand-muted block text-xs">{sale.property?.propertyNo} ({sale.property?.type})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-brand-muted mt-10">No recent sales found</div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-border pb-2 mb-4 flex items-center">
            <span className="w-1 h-5 bg-brand-accent mr-3"></span>
            Inventory Status
          </h3>
          <div className="mt-8 space-y-6">
            <div>
              <div className="flex justify-between mb-2 text-sm font-bold text-brand-primary">
                <span>Booked Properties</span>
                <span className="text-brand-danger">{stats.bookedProperties} / {stats.totalProperties}</span>
              </div>
              <div className="w-full bg-brand-bg rounded-full h-3 border border-brand-border">
                <div className="bg-brand-danger h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${stats.totalProperties > 0 ? (stats.bookedProperties / stats.totalProperties) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 text-sm font-bold text-brand-primary">
                <span>Payment Collection (EMIs)</span>
                <span className="text-brand-success">{stats.paidEMIs} / {stats.totalEMIs} Paid</span>
              </div>
              <div className="w-full bg-brand-bg rounded-full h-3 border border-brand-border">
                <div className="bg-brand-success h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${stats.totalEMIs ? (stats.paidEMIs / stats.totalEMIs) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

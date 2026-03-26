import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Users, User, IndianRupee, Activity, FileText } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="p-4 bg-brand-bg space-y-6 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Welcome, {stats.user.name}</h1>
          <p className="text-sm text-brand-muted">ID: {stats.user.userId} | Rank: {stats.user.rank} | Joined: {new Date(stats.user.joiningDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Card */}
        <div className="card p-4 flex items-center space-x-4">
          <div className="p-3 bg-brand-info/5 text-brand-info rounded-full border border-brand-info/20">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">TOTAL SALES</p>
            <h2 className="text-2xl font-bold text-brand-primary">{stats.totalSales}</h2>
            <p className="text-xs text-brand-success mt-1 font-semibold">Amount: ₹ {stats.totalSaleAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Commissions Card */}
        <div className="card p-4 flex items-center space-x-4">
          <div className="p-3 bg-brand-success/5 text-brand-success rounded-full border border-brand-success/20">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">TOTAL INCOME</p>
            <h2 className="text-2xl font-bold text-brand-primary">₹ {stats.totalCommission.toLocaleString()}</h2>
            <p className="text-xs text-brand-warning mt-1 font-semibold">Pending: ₹ {stats.pendingCommission.toLocaleString()}</p>
          </div>
        </div>

        {/* Direct Team */}
        <div className="card p-4 flex items-center space-x-4">
          <div className="p-3 bg-brand-primary/5 text-brand-primary rounded-full border border-brand-primary/20">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">DIRECT MEMBERS</p>
            <h2 className="text-2xl font-bold text-brand-primary">{stats.directMembers}</h2>
            <p className="text-xs text-brand-muted mt-1">Level 1 referrals</p>
          </div>
        </div>

        {/* Total Downline */}
        <div className="card p-4 flex items-center space-x-4">
          <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-full border border-brand-accent/20">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">TOTAL TEAM</p>
            <h2 className="text-2xl font-bold text-brand-primary">{stats.totalDownline}</h2>
            <p className="text-xs text-brand-muted mt-1 font-medium">All levels combined</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="card p-5 flex flex-col items-center">
          <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mb-4 border-2 border-brand-accent/20">
            <User size={48} className="text-brand-muted opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-brand-primary">{stats.user.name}</h3>
          <p className="text-sm text-brand-accent font-bold mb-4 uppercase tracking-wider">{stats.user.rank}</p>
          
          <div className="w-full space-y-2 text-sm border-t border-brand-border pt-4">
            <div className="flex justify-between">
              <span className="text-brand-muted">User ID</span>
              <span className="font-bold text-brand-primary">{stats.user.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Mobile</span>
              <span className="font-bold text-brand-primary">{stats.user.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Joining Date</span>
              <span className="font-bold text-brand-primary">{new Date(stats.user.joiningDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2 flex items-center">
            <span className="w-1 h-6 bg-brand-accent mr-3"></span>
            Welcome to Unique Investors
          </h3>
          <div className="text-sm text-brand-primary/80 leading-relaxed space-y-4 text-justify">
            <p>
              We are Unique Investors Pvt. Ltd., a leading Real Estate Consultants group. We specialize in 
              services related to the purchase of properties, investment, advisory services, property 
              valuation, and assisting clients.
            </p>
            <p>
              Unique Investors Pvt. Ltd. began with a long-term thinking by a group of entrepreneurs, 
              who dreamt big and stuck to their vision relentlessly. The result was the creation of 
              Unique Investors Pvt. Ltd., having its base in Delhi and very soon expanding all over 
              the country.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-4">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-border pb-2 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/sale-report" className="text-sm font-bold text-brand-primary hover:text-brand-accent p-2 bg-brand-bg rounded text-center border border-brand-border transition-colors">View Sales Report</a>
            <a href="/down-line-report" className="text-sm font-bold text-brand-primary hover:text-brand-accent p-2 bg-brand-bg rounded text-center border border-brand-border transition-colors">View Full Team</a>
            <a href="/incentive-report" className="text-sm font-bold text-brand-primary hover:text-brand-accent p-2 bg-brand-bg rounded text-center border border-brand-border transition-colors">Check Commissions</a>
            <a href="/user-tree" className="text-sm font-bold text-brand-primary hover:text-brand-accent p-2 bg-brand-bg rounded text-center border border-brand-border transition-colors">MLM Visual Tree</a>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-border pb-2 mb-4">Recent Notices</h3>
          <ul className="space-y-3 text-sm text-brand-primary/80">
            <li className="flex items-start"><span className="text-brand-accent mr-2 font-bold">♦</span> Q1 2026 Promotional Bonus eligibility ends on March 31st.</li>
            <li className="flex items-start"><span className="text-brand-accent mr-2 font-bold">♦</span> Welcome to the new Unique Investors unified portal.</li>
            <li className="flex items-start"><span className="text-brand-accent mr-2 font-bold">♦</span> Phase 2 properties in Block D are now open for booking.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

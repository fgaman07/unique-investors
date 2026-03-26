import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Users, User, DollarSign, Activity, FileText } from 'lucide-react';

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
    <div className="p-4 bg-gray-50 space-y-6 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {stats.user.name}</h1>
          <p className="text-sm text-gray-500">ID: {stats.user.userId} | Rank: {stats.user.rank} | Joined: {new Date(stats.user.joiningDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Card */}
        <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">TOTAL SALES</p>
            <h2 className="text-2xl font-bold text-gray-800">{stats.totalSales}</h2>
            <p className="text-xs text-green-600 mt-1">Amount: ₹ {stats.totalSaleAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Commissions Card */}
        <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">TOTAL INCOME</p>
            <h2 className="text-2xl font-bold text-gray-800">₹ {stats.totalCommission.toLocaleString()}</h2>
            <p className="text-xs text-orange-500 mt-1">Pending: ₹ {stats.pendingCommission.toLocaleString()}</p>
          </div>
        </div>

        {/* Direct Team */}
        <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">DIRECT MEMBERS</p>
            <h2 className="text-2xl font-bold text-gray-800">{stats.directMembers}</h2>
            <p className="text-xs text-gray-400 mt-1">Level 1 referrals</p>
          </div>
        </div>

        {/* Total Downline */}
        <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">TOTAL TEAM</p>
            <h2 className="text-2xl font-bold text-gray-800">{stats.totalDownline}</h2>
            <p className="text-xs text-gray-400 mt-1">All levels combined</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white border rounded shadow-sm p-5 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-brand-primary/20">
            <User size={48} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{stats.user.name}</h3>
          <p className="text-sm text-brand-primary font-semibold mb-4">{stats.user.rank}</p>
          
          <div className="w-full space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500">User ID</span>
              <span className="font-medium">{stats.user.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mobile</span>
              <span className="font-medium">{stats.user.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joining Date</span>
              <span className="font-medium">{new Date(stats.user.joiningDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border rounded shadow-sm p-6">
          <h3 className="text-xl font-bold text-[#2E5B9A] mb-4 border-b pb-2">Welcome to Unique Investors</h3>
          <div className="text-sm text-gray-600 leading-relaxed space-y-4 text-justify">
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
        <div className="bg-white border rounded shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/sale-report" className="text-sm text-blue-600 hover:underline p-2 bg-blue-50 rounded text-center">View Sales Report</a>
            <a href="/down-line-report" className="text-sm text-blue-600 hover:underline p-2 bg-blue-50 rounded text-center">View Full Team</a>
            <a href="/incentive-report" className="text-sm text-blue-600 hover:underline p-2 bg-blue-50 rounded text-center">Check Commissions</a>
            <a href="/user-tree" className="text-sm text-blue-600 hover:underline p-2 bg-blue-50 rounded text-center">MLM Visual Tree</a>
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Recent Notices</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start"><span className="text-brand-primary mr-2">♦</span> Q1 2026 Promotional Bonus eligibility ends on March 31st.</li>
            <li className="flex items-start"><span className="text-brand-primary mr-2">♦</span> Welcome to the new Unique Investors unified portal.</li>
            <li className="flex items-start"><span className="text-brand-primary mr-2">♦</span> Phase 2 properties in Block D are now open for booking.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

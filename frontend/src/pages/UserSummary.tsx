import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { User, Phone, Mail, Award, Calendar, CreditCard } from 'lucide-react';

const UserSummary = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Error fetching profile', error);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="p-6 h-full bg-gray-50">
      <div className="bg-[#f5f6f8] border border-gray-300 px-4 py-2 text-[14px] font-bold text-gray-700 mb-6 drop-shadow-sm flex items-center">
        <User size={18} className="mr-2 text-brand-primary" />
        User Profile Summary
      </div>

      <div className="bg-white border rounded shadow-sm max-w-4xl max-h-[70vh] overflow-hidden flex flex-col md:flex-row">
        {/* Left Profile Card */}
        <div className="bg-brand-sidebar text-white p-6 flex flex-col items-center justify-center md:w-1/3 text-center border-r border-gray-200">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 border-4 border-brand-sidebarHover shadow-md">
            <User size={48} className="text-brand-primary" />
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-yellow-300 font-semibold mb-2">{user.rank}</p>
          <div className="bg-black/20 px-3 py-1 rounded text-sm uppercase tracking-wider mb-2">
            ID: {user.userId}
          </div>
          <p className="text-xs opacity-80 mt-4">Active Member</p>
        </div>

        {/* Right Details Container */}
        <div className="p-6 md:w-2/3 flex flex-col justify-center space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
            <div className="flex items-start">
              <Phone className="text-gray-400 mt-1 mr-3" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Mobile Number</p>
                <p className="text-gray-800 font-medium">{user.mobile}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Mail className="text-gray-400 mt-1 mr-3" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Email Address</p>
                <p className="text-gray-800 font-medium">{user.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <CreditCard className="text-gray-400 mt-1 mr-3" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">PAN Number</p>
                <p className="text-gray-800 font-medium">{user.panNo || 'Pending KYC'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="text-gray-400 mt-1 mr-3" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Joining Date</p>
                <p className="text-gray-800 font-medium">{new Date(user.joiningDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Award className="text-gray-400 mt-1 mr-3" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Sponsor Detail</p>
                <p className="text-gray-800 font-medium">
                  {user.sponsor ? `${user.sponsor.name} (${user.sponsor.userId})` : 'Direct Company'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSummary;

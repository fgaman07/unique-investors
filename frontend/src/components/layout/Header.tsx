import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-14 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 z-10 w-full">
      <div className="flex items-center text-brand-primary font-black ml-2 uppercase tracking-wide">
        Unique Investors Platform
      </div>

      <div className="flex items-center space-x-6">
        {/* User Info from Database context */}
        <div className="flex items-center space-x-3 cursor-pointer p-1.5 rounded-md transition duration-200">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
            <User size={16} className="text-brand-primary" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-bold text-gray-800 leading-tight">
              {user ? user.name : 'Guest User'}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">
              {user ? `${user.role} - ${user.userId}` : 'Unverified'}
            </span>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>

        {/* Vertical Separator */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* Direct Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded transition font-semibold text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Header;

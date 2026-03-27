import { ChevronDown, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-14 bg-brand-surface shadow-sm border-b border-brand-border flex items-center justify-between px-2 md:px-4 z-10 w-full font-bold">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-1.5 mr-1 -ml-1 text-brand-muted hover:bg-brand-bg rounded-md md:hidden transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center text-brand-primary font-black ml-1 md:ml-2 uppercase tracking-wide text-xs sm:text-base truncate">
          Unique Investors Platform
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-6">
        {/* User Info from Database context */}
        <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer p-1 md:p-1.5 rounded-md transition duration-200 hover:bg-brand-bg/50">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-brand-bg flex items-center justify-center border border-brand-border shrink-0">
            <User size={14} className="text-brand-primary" />
          </div>
          <div className="hidden sm:flex flex-col justify-center max-w-[120px]">
            <span className="text-[12px] md:text-[14px] font-bold text-brand-primary leading-tight truncate">
              {user ? user.name : 'Guest User'}
            </span>
            <span className="text-[9px] md:text-[10px] text-brand-muted font-bold uppercase tracking-tighter truncate">
              {user ? `${user.role} - ${user.userId}` : 'Unverified'}
            </span>
          </div>
          <ChevronDown size={14} className="text-brand-muted hidden sm:block" />
        </div>

        {/* Vertical Separator */}
        <div className="h-6 md:h-8 w-px bg-brand-border"></div>

        {/* Direct Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-1 text-brand-danger hover:text-white hover:bg-brand-danger px-2 md:px-3 py-1.5 rounded transition font-bold text-xs md:text-sm uppercase tracking-wide whitespace-nowrap"
        >
          <LogOut size={14} className="md:w-4 md:h-4" />
          <span className="hidden xs:inline">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Header;

import { NavLink } from 'react-router-dom';
import { Home, Mail, UserCircle, FileText, Users, DollarSign, Calendar, Map, CheckSquare, Settings, Database, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const USER_MENU = [
  { path: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  { path: '/welcome-letter', label: 'Welcome Letter', icon: <Mail size={18} /> },
  { path: '/user-summary', label: 'User Summary', icon: <UserCircle size={18} /> },
  { path: '/sale-report', label: 'Sale Report', icon: <FileText size={18} /> },
  { path: '/down-line-report', label: 'Down Line Report', icon: <Users size={18} /> },
  { path: '/direct-member-report', label: 'Direct Member Report', icon: <Users size={18} /> },
  { path: '/all-leg-report', label: 'All Leg Report', icon: <FileText size={18} /> },
  { path: '/incentive-report', label: 'Incentive Report', icon: <DollarSign size={18} /> },
  { path: '/promotional-incentive', label: 'Promotional Incentive', icon: <DollarSign size={18} /> },
  { path: '/emi-report', label: 'EMI Report', icon: <Calendar size={18} /> },
  { path: '/user-tree', label: 'User Tree', icon: <Users size={18} /> },
  { path: '/post-short-by', label: 'Post Short By', icon: <CheckSquare size={18} /> },
  { path: '/release-payment', label: 'Release Payment', icon: <DollarSign size={18} /> },
  { path: '/project-details', label: 'Project Details', icon: <Map size={18} /> },
  { path: '/change-password', label: 'Change Password', icon: <Lock size={18} /> }
];

const ADMIN_MENU = [
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: <Home size={18} /> },
  { path: '/admin/users', label: 'Manage All Users', icon: <Users size={18} /> },
  { path: '/admin/projects', label: 'Inventory & Projects', icon: <Database size={18} /> },
  { path: '/admin/payments', label: 'Global Ledger & Release', icon: <DollarSign size={18} /> },
  { path: '/setting', label: 'System Settings', icon: <Settings size={18} /> },
  ...USER_MENU.filter(m => m.path !== '/dashboard')
];

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const activeMenu = isAdmin ? ADMIN_MENU : USER_MENU;
  const titleText = isAdmin ? 'A d m i n   P a n e l' : 'U s e r   P a n e l';

  return (
    <div className="w-56 bg-brand-primary text-white h-full flex flex-col shadow-lg z-20">
      <div className="h-14 flex items-center justify-center bg-brand-sidebar">
        <h1 className="text-xl font-medium tracking-wide">Unique Investors</h1>
      </div>
      <div className="py-2 text-[10px] text-center border-b border-brand-sidebarHover bg-brand-primary font-bold tracking-[0.25em]">
        {titleText}
      </div>
      
      <nav className="flex-1 overflow-y-auto mt-2 pb-4 scrollbar-thin scrollbar-thumb-brand-sidebarHover">
        <ul className="flex flex-col">
          {activeMenu.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2 text-[13px] transition-colors duration-150 ${
                    isActive 
                      ? 'text-yellow-300 font-semibold bg-brand-sidebarHover' 
                      : 'text-gray-100 hover:bg-brand-sidebarHover hover:text-white'
                  }`
                }
              >
                <span className="opacity-90">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;

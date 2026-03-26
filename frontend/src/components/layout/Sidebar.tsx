import { NavLink, useLocation } from 'react-router-dom';
import { Home, Mail, UserCircle, FileText, Users, IndianRupee, Calendar, Map, CheckSquare, Settings, Database, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const USER_MENU = [
  { path: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  { path: '/welcome-letter', label: 'Welcome Letter', icon: <Mail size={18} /> },
  { path: '/user-summary', label: 'User Summary', icon: <UserCircle size={18} /> },
  { path: '/sale-report', label: 'Sale Report', icon: <FileText size={18} /> },
  { path: '/down-line-report', label: 'Down Line Report', icon: <Users size={18} /> },
  { path: '/direct-member-report', label: 'Direct Member Report', icon: <Users size={18} /> },
  { path: '/all-leg-report', label: 'All Leg Report', icon: <FileText size={18} /> },
  { path: '/incentive-report', label: 'Incentive Report', icon: <IndianRupee size={18} /> },
  { path: '/promotional-incentive', label: 'Promotional Incentive', icon: <IndianRupee size={18} /> },
  { path: '/emi-report', label: 'EMI Report', icon: <Calendar size={18} /> },
  { path: '/user-tree', label: 'User Tree', icon: <Users size={18} /> },
  { path: '/post-short-by', label: 'Post Short By', icon: <CheckSquare size={18} /> },
  { path: '/release-payment', label: 'Release Payment', icon: <IndianRupee size={18} /> },
  { path: '/project-details', label: 'Project Details', icon: <Map size={18} /> },
  { path: '/change-password', label: 'Change Password', icon: <Lock size={18} /> }
];

const ADMIN_MENU = [
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: <Home size={18} /> },
  ...USER_MENU.filter(m => m.path !== '/dashboard' && m.path !== '/change-password'),
  { path: '/admin/projects', label: 'Inventory & Projects', icon: <Database size={18} /> },
  { path: '/admin/users', label: 'Manage All Users', icon: <Users size={18} /> },
  { path: '/admin/payments', label: 'Global Ledger & Release', icon: <IndianRupee size={18} /> },
  { path: '/setting', label: 'System Settings', icon: <Settings size={18} /> },
  { path: '/change-password', label: 'Change Password', icon: <Lock size={18} /> }
];

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const activeMenu = isAdmin ? ADMIN_MENU : USER_MENU;
  const titleText = isAdmin ? 'A d m i n   P a n e l' : 'U s e r   P a n e l';

  return (
    <div className="w-56 bg-brand-sidebar text-brand-primary h-full flex flex-col shadow-sm border-r border-brand-border z-20 transition-colors duration-300">
      <div className="h-14 flex items-center justify-center bg-brand-sidebar border-b border-brand-border shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-brand-accent drop-shadow-sm flex items-center">
          <span className="w-2 h-6 bg-brand-accent mr-2 rounded-sm shadow-sm"></span>
          Unique Investors
        </h1>
      </div>
      <div className="py-2 text-[10px] text-center border-b border-brand-border bg-brand-bg font-bold tracking-[0.25em] text-brand-muted uppercase">
        {titleText}
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <nav className="px-2 space-y-1">
          {activeMenu.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                    ? 'text-brand-accent font-bold bg-brand-sidebarHover border border-brand-accent/20'
                    : 'text-brand-muted hover:bg-brand-sidebarHover hover:text-brand-accent'
                  }`
                }
              >
                <span className="transition-colors">
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

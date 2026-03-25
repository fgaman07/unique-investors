import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GlobalLayout from './components/layout/GlobalLayout';
import Login from './pages/Login';

// User Pages
import Dashboard from './pages/Dashboard';
import WelcomeLetter from './pages/WelcomeLetter';
import UserSummary from './pages/UserSummary';
import SaleReport from './pages/SaleReport';
import DownLineReport from './pages/DownLineReport';
import DirectMemberReport from './pages/DirectMemberReport';
import AllLegReport from './pages/AllLegReport';
import IncentiveReport from './pages/IncentiveReport';
import PromotionalIncentive from './pages/PromotionalIncentive';
import EMIReport from './pages/EMIReport';
import UserTree from './pages/UserTree';
import PostShortBy from './pages/PostShortBy';
import ReleasePayment from './pages/ReleasePayment';
import ProjectDetails from './pages/ProjectDetails';
import ChangePassword from './pages/ChangePassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProjects from './pages/AdminProjects';
import AdminPayments from './pages/AdminPayments';
import Settings from './pages/Settings';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { user, token } = useAuth();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<GlobalLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* USER & AGENT ROUTES */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/welcome-letter" element={<ProtectedRoute><WelcomeLetter /></ProtectedRoute>} />
          <Route path="/user-summary" element={<ProtectedRoute><UserSummary /></ProtectedRoute>} />
          <Route path="/sale-report" element={<ProtectedRoute><SaleReport /></ProtectedRoute>} />
          <Route path="/down-line-report" element={<ProtectedRoute><DownLineReport /></ProtectedRoute>} />
          <Route path="/direct-member-report" element={<ProtectedRoute><DirectMemberReport /></ProtectedRoute>} />
          <Route path="/all-leg-report" element={<ProtectedRoute><AllLegReport /></ProtectedRoute>} />
          <Route path="/incentive-report" element={<ProtectedRoute><IncentiveReport /></ProtectedRoute>} />
          <Route path="/promotional-incentive" element={<ProtectedRoute><PromotionalIncentive /></ProtectedRoute>} />
          <Route path="/emi-report" element={<ProtectedRoute><EMIReport /></ProtectedRoute>} />
          <Route path="/user-tree" element={<ProtectedRoute><UserTree /></ProtectedRoute>} />
          <Route path="/post-short-by" element={<ProtectedRoute><PostShortBy /></ProtectedRoute>} />
          <Route path="/release-payment" element={<ProtectedRoute><ReleasePayment /></ProtectedRoute>} />
          <Route path="/project-details" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

          {/* ADMIN ROUTES */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute requiredRole="ADMIN"><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute requiredRole="ADMIN"><AdminPayments /></ProtectedRoute>} />
          
          {/* Common Settings accessible by all or Admin only depending on logic */}
          <Route path="/setting" element={<ProtectedRoute requiredRole="ADMIN"><Settings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

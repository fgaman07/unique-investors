import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const GlobalLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f0f0] font-sans">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 2. Top Header */}
        <Header />

        {/* 3. Main Content Portal */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fa] p-3">
          <div className="bg-white border rounded shadow-sm min-h-full">
            <Outlet />
          </div>
        </main>
        
        {/* 4. Exact Footer Signature */}
        <footer className="py-2 text-center text-xs text-gray-500 border-t bg-white">
          &copy; uniqueinvestors PVT. LTD All Rights Reserved 2026
        </footer>
      </div>
    </div>
  );
};

export default GlobalLayout;

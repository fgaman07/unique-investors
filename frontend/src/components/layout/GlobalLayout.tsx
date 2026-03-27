import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const GlobalLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f0f0] font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. Left Fixed Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* 2. Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* 3. Main Content Portal */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fa] p-3 w-full">
          <div className="bg-white border rounded shadow-sm min-h-full w-full">
            <Outlet />
          </div>
        </main>
        
        {/* 4. Exact Footer Signature */}
        <footer className="py-2 text-center text-xs text-gray-500 border-t bg-white w-full">
          &copy; uniqueinvestors PVT. LTD All Rights Reserved 2026
        </footer>
      </div>
    </div>
  );
};

export default GlobalLayout;

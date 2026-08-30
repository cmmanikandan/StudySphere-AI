import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { LoadingSpinner } from './LoadingSpinner';

export const Layout: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isChatPage = location.pathname.startsWith('/chat');

  if (loading) {
    return <LoadingSpinner label="Authenticating with StudySphere AI..." fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        isChatPage ? 'pb-0' : 'pb-16 lg:pb-0'
      }`}
    >
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex w-full min-h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`flex-1 w-full min-w-0 overflow-y-auto ${
            isChatPage ? 'p-0 sm:p-4 lg:p-6' : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <div className={`${isChatPage ? 'w-full h-full' : 'max-w-6xl mx-auto'}`}>
            <Outlet />
          </div>
        </main>
      </div>
      {!isChatPage && <MobileBottomNav />}
      <PWAInstallPrompt />
    </div>
  );
};

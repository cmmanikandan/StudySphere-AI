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
        isChatPage ? 'pb-0 h-screen overflow-hidden' : 'pb-16 lg:pb-0'
      }`}
    >
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex w-full min-w-0 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`flex-1 w-full min-w-0 ${
            isChatPage ? 'p-0 h-[calc(100vh-4rem)] overflow-hidden flex flex-col' : 'p-4 sm:p-6 lg:p-8 overflow-y-auto'
          }`}
        >
          <div className={`${isChatPage ? 'w-full h-full min-w-0 flex flex-col' : 'max-w-6xl mx-auto'}`}>
            <Outlet />
          </div>
        </main>
      </div>
      {!isChatPage && <MobileBottomNav />}
      <PWAInstallPrompt />
    </div>
  );
};

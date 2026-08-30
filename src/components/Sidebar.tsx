import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  MessageSquareText,
  FileSpreadsheet,
  BrainCircuit,
  Settings,
  LogOut,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Study Library', icon: Files },
    { to: '/upload', label: 'Upload Materials', icon: UploadCloud },
    { to: '/chat', label: 'AI Workspace', icon: MessageSquareText },
    { to: '/summaries', label: 'Summary Tool', icon: FileSpreadsheet },
    { to: '/quizzes', label: 'Quiz Arena', icon: BrainCircuit },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#070b14]/80 backdrop-blur-xl h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 ease-in-out z-20 ${
        isOpen ? 'w-64 min-w-[16rem] p-4 opacity-100' : 'w-0 min-w-0 p-0 overflow-hidden opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Navigation Items */}
        <div className="space-y-4">
          <NavLink
            to="/chat"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Study Session</span>
          </NavLink>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50/80 dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Box */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {/* Profile Card */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-violet-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                {(profile?.name || user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile?.name || user?.displayName || 'Student'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'StudySphere Member'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50/80 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200/60 dark:border-red-900/40 transition-all hover:scale-[1.01]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

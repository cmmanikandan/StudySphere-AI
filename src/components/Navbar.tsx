import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Plus,
  BrainCircuit,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen = true, onToggleSidebar }) => {
  const { user, profile, logout } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hidden lg:flex items-center justify-center"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            )}
          </button>
        )}

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <img
            src="/logo.jpeg"
            alt="StudySphere AI"
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-violet-500/20 group-hover:ring-violet-500/50 transition-all shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight gradient-text">
              StudySphere AI
            </span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
              Personal AI Tutor
            </span>
          </div>
        </Link>
      </div>

      {/* Center Quick Actions */}
      <div className="hidden md:flex items-center gap-2.5">
        <Link
          to="/upload"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200/60 dark:border-violet-800/40 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Material</span>
        </Link>
        <Link
          to="/chat"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Start Chat</span>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
        </button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {profile?.avatar_url || user.photoURL ? (
                <img
                  src={profile?.avatar_url || user.photoURL || ''}
                  alt={profile?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs">
                  {(profile?.name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn border border-slate-200 dark:border-slate-800"
                onClick={() => setShowDropdown(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile?.name || user.displayName || 'Student'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>

                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserIcon className="w-4 h-4 text-violet-500" />
                  <span>Settings & Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

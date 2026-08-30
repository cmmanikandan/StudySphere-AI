import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareText,
  UploadCloud,
  Sparkles,
  User,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const tabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/chat', label: 'Chat', icon: MessageSquareText },
    { to: '/upload', label: 'Upload', icon: UploadCloud, isSpecial: true },
    { to: '/tools', label: 'Tools', icon: Sparkles },
    { to: '/settings', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        if (tab.isSpecial) {
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center -mt-4 transition-all ${
                  isActive ? 'scale-105' : 'hover:scale-105'
                }`
              }
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/40">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-1">
                {tab.label}
              </span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-violet-600 dark:text-violet-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

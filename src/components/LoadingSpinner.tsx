import React from 'react';
import { Sparkles, BrainCircuit, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none">
        {/* Ambient Glowing Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/15 to-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-sm mx-auto animate-fadeIn">
          {/* Glowing Animated Logo */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-xl opacity-60 animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 p-[2px] shadow-2xl overflow-hidden">
              <img
                src="/logo.jpeg"
                alt="StudySphere AI"
                className="w-full h-full object-cover rounded-[22px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {/* Orbiting Sparkle */}
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/50 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Branding & Status */}
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-violet-300 bg-clip-text text-transparent">
              StudySphere AI
            </h1>
            <p className="text-xs font-medium text-slate-400">
              {label || 'Authenticating your study session...'}
            </p>
          </div>

          {/* Sleek Animated Progress Bar */}
          <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 rounded-full w-full animate-indeterminate" />
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Connecting to Groq AI & PostgreSQL</span>
          </div>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-md animate-pulse" />
        <Loader2 className={`${sizeClasses[size]} text-violet-600 dark:text-violet-400 animate-spin relative`} />
      </div>
      {label && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>}
    </div>
  );
};

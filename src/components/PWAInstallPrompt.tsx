import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show if user previously dismissed in this session
      if (!sessionStorage.getItem('pwa_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-full animate-slideUp">
      <div className="glass-panel p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-violet-500/30 dark:border-violet-500/20 bg-gradient-to-r from-violet-50/90 to-indigo-50/90 dark:from-violet-950/80 dark:to-indigo-950/80">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="StudySphere Logo" className="w-10 h-10 rounded-xl object-cover shadow" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Install StudySphere AI</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Install as native PWA for quick access</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

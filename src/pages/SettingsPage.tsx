import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchUserSettings, updateUserSettings } from '../lib/api';
import { UserSettings } from '../types';
import {
  User,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Shield,
  Download,
  Check,
  Save,
  Loader2,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [answerStyle, setAnswerStyle] = useState<'simple' | 'detailed'>('detailed');
  const [showSources, setShowSources] = useState(true);
  const [generalKnowledgeFallback, setGeneralKnowledgeFallback] = useState(true);
  const [language, setLanguage] = useState('en');

  // PWA Install State
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await fetchUserSettings(user.uid);
        if (data) {
          setSettings(data);
          setAnswerStyle(data.answer_style || 'detailed');
          setShowSources(data.show_sources !== false);
          setGeneralKnowledgeFallback(data.general_knowledge_fallback !== false);
          setLanguage(data.language || 'en');
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    try {
      setSaving(true);
      await updateUserSettings(user.uid, {
        answer_style: answerStyle,
        show_sources: showSources,
        general_knowledge_fallback: generalKnowledgeFallback,
        language,
        theme,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePWAInstall = async () => {
    if (!installPromptEvent) {
      alert('StudySphere AI is either already installed or your browser does not support install prompts from this button.');
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallPromptEvent(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your account profile, AI tutor behavior, appearance themes, and device synchronization.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Authenticated User Profile */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Profile Information</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {profile?.avatar_url || user?.photoURL ? (
              <img
                src={profile?.avatar_url || user?.photoURL || ''}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-500/20 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-violet-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {(profile?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}

            <div className="space-y-1 text-center sm:text-left truncate w-full">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                {profile?.name || user?.displayName || 'Student'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold mt-2">
                <Shield className="w-3 h-3" />
                <span>Google Firebase Authenticated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Appearance & Theme */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Appearance & Theme</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-xs flex flex-col items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-xs flex flex-col items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-violet-500" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border text-xs flex flex-col items-center gap-2 transition-all ${
                theme === 'system'
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Laptop className="w-5 h-5 text-indigo-500" />
              <span>System</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">Theme preference is saved to your Supabase account and synced across devices.</p>
        </div>

        {/* Section 3: AI Tutor Preferences */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">AI Tutor Engine Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Answer Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                AI Answer Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAnswerStyle('simple')}
                  className={`p-3.5 rounded-2xl border text-xs text-left transition-all ${
                    answerStyle === 'simple'
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-bold mb-0.5 text-slate-900 dark:text-white">Simple & Intuitive</p>
                  <p className="text-[10px] text-slate-400 font-normal">Beginner-friendly explanations with real-world analogies.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setAnswerStyle('detailed')}
                  className={`p-3.5 rounded-2xl border text-xs text-left transition-all ${
                    answerStyle === 'detailed'
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-bold mb-0.5 text-slate-900 dark:text-white">Detailed & Academic</p>
                  <p className="text-[10px] text-slate-400 font-normal">Comprehensive structured breakdowns with formal terms.</p>
                </button>
              </div>
            </div>

            {/* Show Sources Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Show Verified Sources</span>
                <p className="text-[11px] text-slate-400">Display clickable document names and page numbers on responses.</p>
              </div>
              <input
                type="checkbox"
                checked={showSources}
                onChange={(e) => setShowSources(e.target.checked)}
                className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 accent-violet-600 cursor-pointer"
              />
            </div>

            {/* General Knowledge Fallback Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">General Knowledge Fallback</span>
                <p className="text-[11px] text-slate-400">Allow AI to supplement answers when a concept is missing from uploaded notes.</p>
              </div>
              <input
                type="checkbox"
                checked={generalKnowledgeFallback}
                onChange={(e) => setGeneralKnowledgeFallback(e.target.checked)}
                className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 accent-violet-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Application & PWA Installation */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Progressive Web App (PWA)</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Install StudySphere AI App</h4>
              <p className="text-[11px] text-slate-400">Install to your home screen or desktop taskbar for 1-click access.</p>
            </div>
            <button
              type="button"
              onClick={handlePWAInstall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Install PWA</span>
            </button>
          </div>
        </div>

        {/* Section 5: Push Notifications & Study Reminders */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Push Notifications & Reminders</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Study Reminders & AI Updates</h4>
              <p className="text-[11px] text-slate-400">Receive browser notifications when document processing or quizzes complete.</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!('Notification' in window)) {
                  alert('This browser does not support desktop notifications.');
                  return;
                }
                const perm = await Notification.requestPermission();
                if (perm === 'granted') {
                  new Notification('StudySphere AI', {
                    body: '🔔 Notifications are enabled! Your study assistant is ready.',
                    icon: '/logo.jpeg',
                  });
                } else {
                  alert('Notification permission was not granted.');
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all hover:scale-105"
            >
              <span>Test Push Notification</span>
            </button>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Settings successfully synchronized to Supabase!</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

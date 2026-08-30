import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BrainCircuit,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  BookOpen,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner label="Authenticating with StudySphere AI..." fullScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Header / Nav */}
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="StudySphere AI" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-violet-500/20" />
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight gradient-text">StudySphere AI</span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1">Personal AI Tutor</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:scale-105"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:scale-105"
            >
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4 sm:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/80 text-violet-700 dark:text-violet-300 text-xs font-bold mb-8 animate-pulse-subtle shadow-sm">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>Retrieval-Augmented Generation (RAG) for Modern Academic Study</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
          Your Study Materials.{' '}
          <span className="gradient-text">Your Personal AI Tutor.</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed font-normal">
          Upload your study materials, ask questions, and learn smarter with AI-powered answers based on your own documents.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            to="/login"
            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold shadow-sm transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Cards Showcase */}
        <div className="relative rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-violet-500/20 via-indigo-500/10 to-transparent border border-violet-500/30 dark:border-violet-500/20 shadow-2xl">
          <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Multi-Format Ingestion</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seamlessly extracts content and preserves page metadata from PDF, DOCX, PPTX, and TXT files.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Strict RAG Grounding</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Answers strictly backed by your real document chunks with verifiable page numbers and excerpts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Summaries & Quizzes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Instant 1-page quick summaries, exam cram notes, and interactive quizzes generated in seconds via Groq.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            How StudySphere AI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            A state-of-the-art Retrieval-Augmented Generation pipeline built for precision and zero hallucination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md">1</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Upload Material</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload your lecture slides, textbooks, or course notes securely.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md">2</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Extract & Chunk</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Text is parsed page-by-page and chunked into searchable semantic segments.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md">3</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Ask Anything</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Our retrieval engine finds exact matches across your documents.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-md">4</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Learn with Sources</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Groq generates crystal clear answers with real page citations.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Device Synchronization Banner */}
      <section className="py-12 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-slate-900 dark:bg-[#0c1322] text-white p-8 sm:p-12 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Multi-Device Synchronization</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold">Access your study room anywhere</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your documents, chats, summaries, and quizzes are persistently synced via Supabase PostgreSQL and Firebase Auth across your phone, tablet, and laptop.
            </p>
          </div>
          <Link
            to="/login"
            className="flex-shrink-0 px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all hover:scale-105"
          >
            Sign In Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.jpeg" alt="StudySphere AI" className="w-5 h-5 rounded object-cover" />
          <span className="font-bold text-slate-700 dark:text-slate-300">StudySphere AI</span>
        </div>
        <p>Your study materials. Your personal AI tutor. Built with Firebase, Supabase, and Groq.</p>
      </footer>
    </div>
  );
};

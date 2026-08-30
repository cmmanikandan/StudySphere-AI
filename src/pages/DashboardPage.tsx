import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAnalytics, fetchDocuments, fetchConversations } from '../lib/api';
import { AnalyticsStats, DocumentItem, Conversation } from '../types';
import {
  Files,
  MessageSquareText,
  BrainCircuit,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { DashboardStatsSkeleton, DocumentCardSkeleton, Skeleton } from '../components/SkeletonLoader';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, docsData, chatsData] = await Promise.all([
          fetchAnalytics(user.uid),
          fetchDocuments(user.uid),
          fetchConversations(user.uid),
        ]);
        setStats(statsData);
        setRecentDocs(docsData.slice(0, 4));
        setRecentChats(chatsData.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
        {/* Banner Skeleton */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-200/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse">
          <Skeleton className="w-48 h-8 rounded-xl" />
          <Skeleton className="w-72 h-4 rounded-lg" />
        </div>
        {/* Stats Skeleton */}
        <DashboardStatsSkeleton />
        {/* Grids Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="w-40 h-5 rounded-lg" />
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
          </div>
          <div className="space-y-4">
            <Skeleton className="w-40 h-5 rounded-lg" />
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const isBrandNewUser = stats && stats.documentsCount === 0 && stats.conversationsCount === 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-violet-50/70 to-indigo-50/50 dark:from-[#0c1322] dark:via-violet-950/25 dark:to-indigo-950/20 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_4px_24px_-4px_rgba(124,58,237,0.08)] dark:shadow-none">
        <div className="space-y-2">
          <div className="badge-pill bg-violet-100/90 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-600 dark:text-violet-400" />
            <span>AI Study Assistant Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="gradient-text">{profile?.name || user?.displayName || 'Student'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Ask questions, generate high-yield summaries, or practice custom quizzes from your notes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/upload"
            className="btn-primary"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Material</span>
          </Link>
          <Link
            to="/chat"
            className="btn-secondary"
          >
            <MessageSquareText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Start Chat</span>
          </Link>
        </div>
      </div>

      {/* Brand New User Empty State */}
      {isBrandNewUser ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center max-w-xl mx-auto space-y-6 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-inner border border-violet-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to StudySphere AI</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Upload your course materials and start learning with your personal AI assistant.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary w-full sm:w-auto"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your First Document</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="btn-secondary w-full sm:w-auto"
            >
              <MessageSquareText className="w-4 h-4 text-violet-500" />
              <span>Start a New Chat</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Real Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Materials</span>
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
                  <Files className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.documentsCount || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats?.totalPages || 0} total pages indexed</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI Study Chats</span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <MessageSquareText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.conversationsCount || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats?.messagesCount || 0} messages exchanged</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quizzes Created</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <BrainCircuit className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.quizzesCount || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats?.quizAttemptsCount || 0} attempts completed</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Quiz Score</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.quizAttemptsCount ? `${stats.averageQuizScore}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Based on real quiz attempts</p>
            </div>
          </div>

          {/* Two Column Layout: Recent Docs & Recent Chats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Documents */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Files className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Study Materials</h3>
                </div>
                <Link to="/documents" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-semibold">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentDocs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-violet-500/40 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex-shrink-0">
                          <Files className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {doc.original_file_name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {doc.total_pages} {doc.total_pages === 1 ? 'page' : 'pages'} • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/chat?docId=${doc.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white text-xs font-bold flex-shrink-0 transition-all shadow-sm"
                      >
                        Chat
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Study Sessions</h3>
                </div>
                <Link to="/chat" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-semibold">
                  <span>Open Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentChats.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No chat sessions started yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {recentChats.map((conv) => (
                    <Link
                      key={conv.id}
                      to={`/chat/${conv.id}`}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all shadow-sm block group"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          <MessageSquareText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-500 transition-colors">
                            {conv.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                            <span>• {conv.message_count || 0} messages</span>
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-violet-500 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

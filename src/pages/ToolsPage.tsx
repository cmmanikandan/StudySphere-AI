import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileSpreadsheet,
  BrainCircuit,
  Files,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const ToolsPage: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      to: '/summaries',
      title: 'AI Document Summarizer',
      badge: 'High-Yield Notes',
      badgeColor: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
      description: 'Transform lengthy textbook chapters and slides into executive briefs, detailed outlines, or rapid exam cram sheets.',
      icon: FileSpreadsheet,
      gradient: 'from-violet-600 to-indigo-600',
      highlights: ['Executive Briefs', 'Bullet Summaries', 'Exam Cram Cheat Sheets'],
    },
    {
      to: '/quizzes',
      title: 'AI Quiz Arena',
      badge: 'Self-Assessment',
      badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      description: 'Generate grounded multiple choice, true/false, or conceptual question sets from your notes to test retention and exam readiness.',
      icon: BrainCircuit,
      gradient: 'from-purple-600 to-violet-600',
      highlights: ['Multiple Choice', 'True / False', 'Instant Answer Explanations'],
    },
    {
      to: '/documents',
      title: 'Study Library & Notes Reader',
      badge: 'Material Hub',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      description: 'Browse, manage, and search all your uploaded course materials. Preview slides, inspect indexed chunks, and download notes.',
      icon: Files,
      gradient: 'from-blue-600 to-indigo-600',
      highlights: ['PDF, DOCX, PPTX Viewer', 'In-Document Search', 'Note Exports'],
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <div className="badge-pill bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>StudySphere Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Study <span className="gradient-text">Tools</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Select an AI learning tool to summarize, test yourself, or organize your course materials.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className="glass-card card-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between group bg-white/80 dark:bg-[#0c1322]/80 space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tool.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {tool.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                    >
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

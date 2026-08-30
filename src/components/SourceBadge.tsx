import React, { useState } from 'react';
import { FileText, BookOpen, X, ChevronRight } from 'lucide-react';
import { SourceCitation } from '../types';

interface SourceBadgeProps {
  sources: SourceCitation[];
}

export const SourceBadgeList: React.FC<SourceBadgeProps> = ({ sources }) => {
  const [selectedSource, setSelectedSource] = useState<SourceCitation | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
        <BookOpen className="w-3.5 h-3.5 text-violet-500" />
        <span>Verified Sources ({sources.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((src, index) => (
          <button
            key={index}
            onClick={() => setSelectedSource(src)}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 transition-all text-left"
          >
            <FileText className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
              {src.documentName}
            </span>
            {src.pageNumber && (
              <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-mono text-[10px]">
                p.{src.pageNumber}
              </span>
            )}
            <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Source Excerpt Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {selectedSource.documentName}
                  </h4>
                  {selectedSource.pageNumber && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Page Reference: {selectedSource.pageNumber}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Relevant Context Excerpt
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-sm text-slate-700 dark:text-slate-300 max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                {selectedSource.excerpt}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

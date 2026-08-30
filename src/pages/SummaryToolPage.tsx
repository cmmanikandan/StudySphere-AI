import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { fetchDocuments, fetchSummaries, generateSummary, deleteSummary } from '../lib/api';
import { DocumentItem, SummaryItem } from '../types';
import {
  FileSpreadsheet,
  UploadCloud,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Zap,
  BookOpen,
  GraduationCap,
  Loader2,
  FileText,
  Clock,
  Download,
  BrainCircuit,
  MessageSquareText,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const SummaryToolPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('docId');
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(docIdParam || '');
  const [summaryType, setSummaryType] = useState<'quick' | 'detailed' | 'exam_notes'>('quick');

  const [generating, setGenerating] = useState(false);
  const [activeSummary, setActiveSummary] = useState<SummaryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [docs, summs] = await Promise.all([
          fetchDocuments(user.uid),
          fetchSummaries(user.uid),
        ]);
        setDocuments(docs);
        setSummaries(summs);

        if (docIdParam) {
          setSelectedDocId(docIdParam);
        } else if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }

        if (summs.length > 0) {
          setActiveSummary(summs[0]);
        }
      } catch (err) {
        console.error('Failed to load summary tool data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, docIdParam]);

  const handleGenerate = async () => {
    if (!user || !selectedDocId || generating) return;
    try {
      setGenerating(true);
      const newSummary = await generateSummary(user.uid, selectedDocId, summaryType);
      setActiveSummary(newSummary);
      setSummaries((prev) => [newSummary, ...prev]);
    } catch (err: any) {
      alert(`Summary generation failed: ${err.message || 'Error occurred.'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Delete this saved summary?')) return;
    try {
      await deleteSummary(id, user.uid);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      if (activeSummary?.id === id) {
        setActiveSummary(summaries.find((s) => s.id !== id) || null);
      }
    } catch (err) {
      console.error('Failed to delete summary:', err);
    }
  };

  const handleCopy = () => {
    if (!activeSummary) return;
    navigator.clipboard.writeText(activeSummary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeSummary) return;
    const docName = documents.find((d) => d.id === activeSummary.document_id)?.original_file_name || 'study_summary';
    const blob = new Blob([activeSummary.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.replace(/\.[^/.]+$/, '')}_${activeSummary.summary_type}_summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateReadingTime = (text: string) => {
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return <LoadingSpinner label="Loading summary engine..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Mobile Back Button */}
      <div className="md:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Document Summarizer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Transform comprehensive study materials into digestible executive summaries, detailed deep-dives, or high-yield exam cram sheets.
        </p>
      </div>

      {/* Generator Control Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 bg-white/70 dark:bg-[#0d1322]/80 shadow-xl border border-slate-200/80 dark:border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Study Material
            </label>
            {documents.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>No documents available. Upload notes first.</span>
                <button
                  onClick={() => navigate('/upload')}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
                >
                  Upload
                </button>
              </div>
            ) : (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-medium"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.original_file_name} ({doc.total_pages || 1} pages)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Summary Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSummaryType('quick')}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                  summaryType === 'quick'
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Quick</span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryType('detailed')}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                  summaryType === 'detailed'
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Detailed</span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryType('exam_notes')}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                  summaryType === 'exam_notes'
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-purple-500" />
                <span>Exam Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={!selectedDocId || generating}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Document with Groq AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area: Saved Summaries Drawer + Active Summary View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Saved Summaries List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saved Summaries ({summaries.length})
            </h3>
          </div>

          {summaries.length === 0 ? (
            <div className="p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No saved summaries yet. Select a document above to generate.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {summaries.map((summ) => {
                const doc = documents.find((d) => d.id === summ.document_id);
                const isSelected = activeSummary?.id === summ.id;
                return (
                  <div
                    key={summ.id}
                    onClick={() => setActiveSummary(summ)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-violet-600 bg-violet-50/80 dark:bg-violet-950/60 shadow-md ring-1 ring-violet-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                        {summ.summary_type.replace('_', ' ')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(summ.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {doc?.original_file_name || 'Study Document'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(summ.created_at).toLocaleDateString()} • {calculateReadingTime(summ.content)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed Summary Viewer */}
        <div className="lg:col-span-2">
          {activeSummary ? (
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-xl">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                      {activeSummary.summary_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {calculateReadingTime(activeSummary.content)}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {documents.find((d) => d.id === activeSummary.document_id)?.original_file_name || 'Summary'}
                  </h2>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => navigate(`/chat?docId=${activeSummary.document_id}`)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>

              {/* Rendered Summary Markdown */}
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans space-y-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeSummary.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-4 border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">No Summary Selected</h3>
                <p className="text-xs text-slate-400">
                  Select a document from the dropdown above and click "Generate AI Summary" to create your study notes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

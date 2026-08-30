import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchDocuments, deleteDocument, renameDocument, fetchDocumentPreview } from '../lib/api';
import { DocumentItem } from '../types';
import {
  Files,
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Edit2,
  MessageSquareText,
  FileSpreadsheet,
  BrainCircuit,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Eye,
  Download,
  X,
  Loader2,
  Sparkles,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { DocumentCardSkeleton, Skeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { RenameModal } from '../components/RenameModal';

export const DocumentLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Preview State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewChunks, setPreviewChunks] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');

  const loadDocuments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const docs = await fetchDocuments(user.uid);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this study material? All indexed chunks will be removed.')) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteDocument(id, user.uid);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (previewDoc?.id === id) setPreviewDoc(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (newName: string) => {
    if (!user || !renameTarget) return;
    try {
      const updated = await renameDocument(renameTarget.id, user.uid, newName);
      setDocuments((prev) => prev.map((d) => (d.id === renameTarget.id ? updated : d)));
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  const handleOpenPreview = async (doc: DocumentItem) => {
    if (!user) return;
    setPreviewDoc(doc);
    setLoadingPreview(true);
    setPreviewSearch('');
    try {
      const data = await fetchDocumentPreview(doc.id, user.uid);
      setPreviewChunks(data.chunks || []);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadText = (doc: DocumentItem) => {
    const fullText = previewChunks.length > 0
      ? previewChunks.map((c) => `--- PAGE ${c.page_number} ---\n${c.chunk_text}`).join('\n\n')
      : `StudySphere AI Document Export: ${doc.original_file_name}\nTotal Pages: ${doc.total_pages}\nFile Size: ${(doc.file_size / (1024 * 1024)).toFixed(2)} MB`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.original_file_name.replace(/\.[^/.]+$/, '')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFormatBadge = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'DOC';
    if (ext === 'PDF') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">PDF</span>;
    } else if (ext === 'PPTX' || ext === 'PPT') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">PPTX</span>;
    } else if (ext === 'DOCX' || ext === 'DOC') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">DOCX</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">TXT</span>;
  };

  // Filter & Sort
  const filteredDocuments = documents
    .filter((doc) =>
      doc.original_file_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'name') {
        comparison = a.original_file_name.localeCompare(b.original_file_name);
      } else if (sortBy === 'size') {
        comparison = a.file_size - b.file_size;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const filteredPreviewChunks = previewChunks.filter((chunk) =>
    previewSearch ? chunk.chunk_text.toLowerCase().includes(previewSearch.toLowerCase()) : true
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8 rounded-xl" />
          <Skeleton className="w-80 h-4 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your uploaded textbooks, lecture slides, and notes for AI grounded learning.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all hover:scale-105"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Search & Sort Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>

          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Materials List / Grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={Files}
          title={searchQuery ? 'No matching materials found' : 'Your study library is empty'}
          description={
            searchQuery
              ? 'Try searching with different keywords.'
              : 'Upload your course textbooks, lecture notes, or PDF slides to chat with AI.'
          }
          actionText={searchQuery ? 'Clear Search' : 'Upload First Material'}
          onAction={searchQuery ? () => setSearchQuery('') : () => navigate('/upload')}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="glass-card rounded-3xl p-5 flex flex-col justify-between hover:border-violet-500/40 hover:shadow-lg transition-all group relative bg-white/70 dark:bg-[#0d1322]/80"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getFormatBadge(doc.original_file_name)}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {doc.processing_status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3
                    className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"
                    title={doc.original_file_name}
                  >
                    {doc.original_file_name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{doc.total_pages || 1} {doc.total_pages === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {/* Actions: Rename & Delete */}
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={() => setRenameTarget(doc)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* AI Tools & Preview/Download Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(doc)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Preview document notes"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadText(doc)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Download document text"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to={`/summaries?docId=${doc.id}`}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Generate Summary"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/chat?docId=${doc.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {doc.original_file_name}
                      </h3>
                      {getFormatBadge(doc.original_file_name)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {doc.total_pages || 1} pages • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPreview(doc)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadText(doc)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRenameTarget(doc)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/chat?docId=${doc.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all"
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Chat</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={!!renameTarget}
          initialValue={renameTarget.original_file_name}
          title="Rename Study Material"
          onClose={() => setRenameTarget(null)}
          onSave={handleRename}
        />
      )}

      {/* Document Reader / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#0c1322] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                      {previewDoc.original_file_name}
                    </h3>
                    {getFormatBadge(previewDoc.original_file_name)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {previewDoc.total_pages} {previewDoc.total_pages === 1 ? 'page' : 'pages'} • {(previewDoc.file_size / (1024 * 1024)).toFixed(2)} MB • Grounded for AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadText(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  title="Export notes"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                placeholder="Search keywords inside this document..."
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {previewSearch && (
                <button onClick={() => setPreviewSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingPreview ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-600 dark:text-violet-400 mx-auto" />
                  <p className="text-xs text-slate-400">Loading indexed document contents...</p>
                </div>
              ) : filteredPreviewChunks.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  {previewSearch ? 'No text segments matched your search.' : 'No chunks found for this document.'}
                </div>
              ) : (
                filteredPreviewChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-violet-600 dark:text-violet-400">
                      <span>PAGE / SLIDE {chunk.page_number || 1} • SEGMENT #{idx + 1}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {chunk.chunk_text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {filteredPreviewChunks.length} section{filteredPreviewChunks.length === 1 ? '' : 's'} available
              </span>
              <button
                onClick={() => navigate(`/chat?docId=${previewDoc.id}`)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chat with this Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

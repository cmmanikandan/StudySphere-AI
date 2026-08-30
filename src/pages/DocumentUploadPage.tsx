import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { uploadDocument } from '../lib/api';

export const DocumentUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'reading' | 'extracting' | 'preparing' | 'ready' | 'failed'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isUploading = stage !== 'idle' && stage !== 'ready' && stage !== 'failed';

  // Prevent accidental tab close or page reload during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = 'You have an active document upload in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading]);

  const allowedExtensions = ['pdf', 'docx', 'pptx', 'txt'];

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      setErrorMessage(`Unsupported file format (.${ext}). Please upload PDF, DOCX, PPTX, or TXT.`);
      return false;
    }
    if (file.size > 35 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 35MB limit.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        startProcessing(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        startProcessing(file);
      }
    }
  };

  const startProcessing = async (file: File) => {
    if (!user) return;
    try {
      abortControllerRef.current = new AbortController();
      setStage('uploading');
      setProgress(20);

      const t1 = setTimeout(() => {
        setStage('reading');
        setProgress(45);
      }, 400);

      const t2 = setTimeout(() => {
        setStage('extracting');
        setProgress(70);
      }, 800);

      const t3 = setTimeout(() => {
        setStage('preparing');
        setProgress(90);
      }, 1200);

      const uploadedDoc = await uploadDocument(user.uid, file);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setProgress(100);
      setCreatedDocId(uploadedDoc.id);
      setStage('ready');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        resetUpload();
        return;
      }
      console.error('Upload failed:', err);
      setStage('failed');
      setErrorMessage(err.message || "We couldn't process this document. Please check database permissions or try again.");
    }
  };

  const confirmCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setShowCancelConfirm(false);
    resetUpload();
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setStage('idle');
    setProgress(0);
    setErrorMessage(null);
    setCreatedDocId(null);
    setShowCancelConfirm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stagesList = [
    { key: 'uploading', label: 'Uploading File', desc: 'Transferring to private storage' },
    { key: 'reading', label: 'Reading Document', desc: 'Parsing structure & pages' },
    { key: 'extracting', label: 'Extracting Content', desc: 'Processing raw text & metadata' },
    { key: 'preparing', label: 'Preparing for AI', desc: 'Chunking & indexing for RAG' },
    { key: 'ready', label: 'Ready', desc: 'Ready for chat, quizzes & summaries' },
  ];

  const getStageIndex = (s: string) => {
    return stagesList.findIndex((item) => item.key === s);
  };

  const currentStageIndex = getStageIndex(stage);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Upload Your Study Material
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Upload PDF, DOCX, PPTX, or TXT files and start asking questions with AI.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800/80 shadow-xl text-center relative overflow-hidden">
        {stage === 'idle' ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 cursor-pointer transition-all ${
              dragActive
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50/50 dark:hover:bg-slate-850/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Drag & Drop your study materials here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              or click to browse from your computer or mobile device
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <span>PDF • DOCX • PPTX • TXT (Max 35MB)</span>
            </div>
          </div>
        ) : stage === 'failed' ? (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Processing Failed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {errorMessage || "We couldn't process this document. Please try again."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetUpload}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        ) : stage === 'ready' ? (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Document Ready for AI!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                "{selectedFile?.name}" has been extracted, chunked, and indexed into your private library.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/chat?docId=${createdDocId}`)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Chat Session</span>
              </button>
              <button
                onClick={resetUpload}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
              >
                Upload Another File
              </button>
            </div>
          </div>
        ) : (
          /* Processing Progress Stages with Cancel Option */
          <div className="space-y-6 py-4 animate-fadeIn">
            {/* File Info Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white max-w-lg mx-auto shadow-sm">
              <div className="flex items-center gap-3 truncate">
                <FileText className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <div className="text-left truncate">
                  <p className="text-xs font-bold truncate">{selectedFile?.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB • {selectedFile?.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Cancel Button triggers confirmation */}
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition-colors ml-3 flex-shrink-0"
                title="Cancel processing"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="max-w-lg mx-auto space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="capitalize">{stagesList[currentStageIndex]?.label}...</span>
                <span className="font-mono text-violet-600 dark:text-violet-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 4-Step Progress Stepper - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-xl mx-auto pt-1">
              {stagesList.slice(0, 4).map((s, index) => {
                const isActive = stage === s.key;
                const isCompleted = currentStageIndex > index;
                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center min-h-[90px] transition-all duration-300 ${
                      isActive
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/70 text-violet-950 dark:text-violet-200 font-bold shadow-md shadow-violet-500/20 ring-2 ring-violet-500/30 scale-[1.02]'
                        : isCompleted
                        ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-black/40">
                        0{index + 1}
                      </span>
                      {isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 dark:text-violet-400" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold mt-1 leading-tight">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {errorMessage && stage === 'idle' && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cancel Upload Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cancel Document Upload?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your file is currently being processed and indexed for AI. If you cancel now, your upload progress will be discarded.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Keep Processing
              </button>
              <button
                onClick={confirmCancelUpload}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all"
              >
                Yes, Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

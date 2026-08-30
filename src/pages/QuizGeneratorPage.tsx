import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchDocuments, fetchQuizzes, generateQuiz } from '../lib/api';
import { DocumentItem, QuizItem } from '../types';
import {
  BrainCircuit,
  Plus,
  Play,
  Award,
  Layers,
  Sparkles,
  Loader2,
  FileQuestion,
  HelpCircle,
  AlertCircle,
  X,
  ArrowLeft,
} from 'lucide-react';
import { CardSkeleton, Skeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';

export const QuizGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('docId');
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(!!docIdParam);

  // Form State
  const [selectedDocId, setSelectedDocId] = useState(docIdParam || '');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState<'mcq' | 'true_false' | 'short_answer'>('mcq');
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [docs, qzList] = await Promise.all([
          fetchDocuments(user.uid),
          fetchQuizzes(user.uid),
        ]);
        setDocuments(docs);
        setQuizzes(qzList);

        if (docIdParam) {
          setSelectedDocId(docIdParam);
          setShowCreateModal(true);
        } else if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, docIdParam]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDocId || generating) return;
    try {
      setGenerating(true);
      setErrorMessage(null);
      const newQuiz = await generateQuiz({
        userId: user.uid,
        documentId: selectedDocId,
        title: title.trim() || undefined,
        difficulty,
        questionCount,
        questionType,
      });

      setShowCreateModal(false);
      navigate(`/quizzes/${newQuiz.id}`);
    } catch (err: any) {
      console.error('Quiz creation error:', err);
      setErrorMessage(err.message || 'Failed to generate quiz with AI.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8 rounded-xl" />
          <Skeleton className="w-80 h-4 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Quiz Arena
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate grounded multiple-choice, true/false, or conceptual quizzes directly from your course materials.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No Quizzes Created Yet"
          description="Test your understanding by generating self-assessment quizzes from your notes and textbooks."
          actionText="Create First Quiz"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:border-violet-500/50 hover:shadow-xl transition-all group bg-white/70 dark:bg-[#0c1322]/80 space-y-6"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-violet-500/10 dark:from-purple-500/20 dark:to-violet-500/20 text-purple-600 dark:text-purple-400">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                      quiz.difficulty === 'easy'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : quiz.difficulty === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1">
                  {quiz.title}
                </h3>
                <p className="text-[11px] text-slate-400 truncate mb-3">
                  Source: {quiz.document_name || 'Study Material'}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-violet-500" />
                    <span>{quiz.question_count} questions</span>
                  </span>
                  {quiz.attempts_count ? (
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Best: {quiz.best_score}/{quiz.question_count}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Not attempted yet</span>
                  )}
                </div>
              </div>

              <Link
                to={`/quizzes/${quiz.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white text-xs font-bold transition-all shadow-sm group-hover:bg-violet-600 group-hover:text-white"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{quiz.attempts_count ? 'Retake Quiz' : 'Take Quiz'}</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1322] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Create AI Quiz</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Study Material
                </label>
                {documents.length === 0 ? (
                  <p className="text-xs text-amber-500">No documents found. Please upload notes first.</p>
                ) : (
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    required
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.original_file_name} ({doc.total_pages} pages)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Quiz Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physical Layer & Topologies Review"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard Academic)</option>
                    <option value="hard">Hard (Advanced Synthesis)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                  >
                    <option value={3}>3 Questions (Quick Check)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Question Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionType('mcq')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      questionType === 'mcq'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionType('true_false')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      questionType === 'true_false'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionType('short_answer')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      questionType === 'short_answer'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Short Answer
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || documents.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

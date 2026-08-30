import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchQuizDetails, submitQuizAttempt } from '../lib/api';
import { QuizItem, QuizQuestionItem } from '../types';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const QuizArenaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    evaluatedAnswers: any[];
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const data = await fetchQuizDetails(id);
        setQuiz(data.quiz);
        setQuestions(data.questions);
      } catch (err) {
        console.error('Failed to load quiz details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [id]);

  const handleSelectOption = (questionId: string, option: string) => {
    if (result) return; // already finished
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!id || !user || submitting) return;
    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] || '',
    }));

    try {
      setSubmitting(true);
      const res = await submitQuizAttempt(id, user.uid, answersPayload);
      setResult(res);
    } catch (err: any) {
      alert(`Submission error: ${err.message || 'Error submitting quiz.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
  };

  if (loading) {
    return <LoadingSpinner label="Loading quiz questions..." />;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-slate-400">Quiz not found or has no questions.</p>
        <Link to="/quizzes" className="text-xs text-violet-600 hover:underline">
          Back to Quiz Arena
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/quizzes"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Arena</span>
        </Link>

        <div className="text-right">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
            {quiz.title}
          </h2>
          <p className="text-[11px] text-slate-400">Source: {quiz.document_name || 'Notes'}</p>
        </div>
      </div>

      {result ? (
        /* Results View */
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card rounded-3xl p-8 sm:p-10 text-center space-y-4 border border-violet-500/30 shadow-xl bg-gradient-to-b from-violet-500/10 via-transparent to-transparent">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Quiz Completed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You scored <span className="font-bold text-violet-600 dark:text-violet-400">{result.score}</span> out of {result.total} questions ({result.percentage}%)
              </p>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className={`h-full transition-all duration-500 ${
                  result.percentage >= 80 ? 'bg-emerald-500' : result.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
              <Link
                to="/quizzes"
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
              >
                All Quizzes
              </Link>
            </div>
          </div>

          {/* Question Breakdown with Explanations */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white px-2">
              Detailed Question Review & Explanations
            </h4>

            {result.evaluatedAnswers.map((evalAns, index) => {
              const q = questions.find((item) => item.id === evalAns.questionId);
              if (!q) return null;

              return (
                <div
                  key={index}
                  className={`glass-card rounded-2xl p-5 border ${
                    evalAns.isCorrect
                      ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10'
                      : 'border-red-500/40 bg-red-50/10 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-500">
                      Question {index + 1} of {result.total}
                    </span>
                    {evalAns.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    {q.question}
                  </p>

                  <div className="space-y-1.5 text-xs mb-3">
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-white">Your Answer:</strong>{' '}
                      <span className={evalAns.isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                        {evalAns.selectedAnswer || '(No answer provided)'}
                      </span>
                    </p>
                    {!evalAns.isCorrect && (
                      <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
                        <strong>Correct Answer:</strong> {evalAns.correctAnswer}
                      </p>
                    )}
                  </div>

                  {evalAns.explanation && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                      <strong className="text-violet-600 dark:text-violet-400 block mb-1">Explanation:</strong>
                      {evalAns.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Interactive Question Taking */
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <span>{answeredCount}/{totalQuestions} Answered</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options && Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              currentQ.options.map((opt, index) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between shadow-sm cursor-pointer ${
                      isSelected
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 font-bold shadow-md ring-1 ring-violet-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })
            ) : (
              /* Short Answer input */
              <div className="space-y-2">
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all disabled:opacity-50"
              >
                {submitting ? 'Evaluating Answers...' : 'Submit & Finish Quiz'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import {
  fetchConversations,
  fetchMessages,
  sendChatMessage,
  deleteConversation,
  renameConversation,
  fetchDocuments,
  executeChatAction,
} from '../lib/api';
import {
  Conversation,
  ChatMessageItem,
  DocumentItem,
  SourceCitation,
} from '../types';
import {
  Plus,
  Send,
  MessageSquareText,
  Trash2,
  Edit2,
  Sparkles,
  Files,
  X,
  Search,
  BookOpen,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  Copy,
  Check,
  Loader2,
  UploadCloud,
  ChevronDown,
  ListFilter,
  ArrowDown,
  ArrowLeft,
  History,
  Mic,
  MicOff,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RenameModal } from '../components/RenameModal';

export const ChatWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const { conversationId: routeConvId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const queryDocId = searchParams.get('docId');
  const navigate = useNavigate();

  // Conversations & Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(routeConvId || null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

  // Study Materials filter state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(queryDocId ? [queryDocId] : []);
  const [docMode, setDocMode] = useState<'all' | 'selected'>(queryDocId ? 'selected' : 'all');

  // Chat UI state
  const [inputValue, setInputValue] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [showQuestionsMenu, setShowQuestionsMenu] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showMobileHistoryDrawer, setShowMobileHistoryDrawer] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice Dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setInputValue((prev) => {
              const cleaned = prev.trim();
              return cleaned ? `${cleaned} ${currentTranscript.trim()}` : currentTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is supported in Google Chrome, Edge, and Safari. Please ensure microphone permissions are allowed.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollDown(isUp);
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, sending]);

  // Load conversations and documents
  useEffect(() => {
    if (!user) return;
    const loadInitial = async () => {
      try {
        setLoadingConv(true);
        const [convs, docs] = await Promise.all([
          fetchConversations(user.uid),
          fetchDocuments(user.uid),
        ]);
        setConversations(convs);
        setDocuments(docs);

        if (routeConvId) {
          setActiveConvId(routeConvId);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      } finally {
        setLoadingConv(false);
      }
    };
    loadInitial();
  }, [user, routeConvId, queryDocId]);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    const loadMsgs = async () => {
      try {
        const msgs = await fetchMessages(activeConvId);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMsgs();
  }, [activeConvId]);

  // Auto-grow textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (customPrompt || inputValue).trim();
    if (!query || sending || !user) return;

    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || '',
      user_id: user.uid,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    if (!customPrompt) setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);

    try {
      const response = await sendChatMessage({
        conversationId: activeConvId || undefined,
        userId: user.uid,
        message: query,
        documentIds: docMode === 'selected' ? selectedDocIds : undefined,
        selectedDocumentMode: docMode,
      });

      if (!activeConvId) {
        setActiveConvId(response.conversationId);
        navigate(`/chat/${response.conversationId}`, { replace: true });
        const updatedConvs = await fetchConversations(user.uid);
        setConversations(updatedConvs);
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage,
      ]);
    } catch (err: any) {
      console.error('Send message error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: activeConvId || '',
          user_id: user.uid,
          role: 'assistant',
          content: `⚠️ Error generating answer: ${err.message || 'Server connection error.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start New Chat
  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    navigate('/chat');
  };

  // Delete Conversation
  const handleDeleteConv = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await deleteConversation(convId, user.uid);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Rename Conversation
  const handleRenameConv = async (newName: string) => {
    if (!user || !renameTarget) return;
    try {
      const updated = await renameConversation(renameTarget.id, user.uid, { title: newName });
      setConversations((prev) => prev.map((c) => (c.id === renameTarget.id ? updated : c)));
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // AI Actions: Copy, Simplify, Explain More, Give Example, Create Quiz
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAIAction = async (action: 'simplify' | 'explain_more' | 'give_example', messageText: string, messageId: string) => {
    if (!user || sending) return;
    try {
      setActionLoadingId(`${action}-${messageId}`);
      let prompt = '';
      if (action === 'simplify') {
        prompt = '💡 Can you simplify the previous explanation into plain, beginner-friendly terms with real-world analogies and key takeaways?';
      } else if (action === 'explain_more') {
        prompt = '📖 Can you provide a deeper, comprehensive academic breakdown of the previous explanation with detailed concepts and theoretical background?';
      } else if (action === 'give_example') {
        prompt = '❓ Can you give 2-3 concrete real-world examples and practical applications illustrating the concepts mentioned above?';
      }
      await handleSendMessage(undefined, prompt);
    } catch (err) {
      console.error('AI action failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateQuizFromChat = async (messageText: string) => {
    if (!user) return;
    if (documents.length === 0) {
      await handleSendMessage(undefined, '📝 Can you generate a 3-question quick self-test quiz based on the previous explanation with answers and explanations?');
      return;
    }
    const docId = selectedDocIds[0] || documents[0].id;
    navigate(`/quizzes?docId=${docId}`);
  };

  const jumpToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowQuestionsMenu(false);
    }
  };

  // User questions list for easy jump
  const userQuestions = messages.filter((m) => m.role === 'user');

  // Group conversations by date
  const groupConversations = (convList: Conversation[]) => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const prev7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - 86400000;
    const sevenDaysAgo = todayMidnight - 7 * 86400000;

    convList.forEach((c) => {
      const time = new Date(c.updated_at).getTime();
      if (time >= todayMidnight) {
        today.push(c);
      } else if (time >= yesterdayMidnight) {
        yesterday.push(c);
      } else if (time >= sevenDaysAgo) {
        prev7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return { today, yesterday, prev7Days, older };
  };

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const grouped = groupConversations(filteredConvs);

  if (loadingConv && conversations.length === 0) {
    return <LoadingSpinner label="Loading Study AI Workspace..." />;
  }

  return (
    <div className="h-full w-full min-w-0 flex rounded-none sm:rounded-3xl overflow-hidden glass-card border-0 sm:border border-slate-200/80 dark:border-slate-800/80 shadow-none sm:shadow-2xl relative">
      {/* Left Chat Sidebar (Conversations) */}
      <div className="w-80 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#070b14]/80 flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <p className="text-xs text-slate-400 font-medium">No study conversations yet.</p>
              <p className="text-[11px] text-slate-500">Ask a question to start your first session.</p>
            </div>
          ) : (
            <>
              {grouped.today.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">Today</p>
                  {grouped.today.map((c) => (
                    <ConvListItem
                      key={c.id}
                      conv={c}
                      isActive={activeConvId === c.id}
                      onSelect={() => {
                        setActiveConvId(c.id);
                        navigate(`/chat/${c.id}`);
                      }}
                      onRename={() => setRenameTarget(c)}
                      onDelete={(e) => handleDeleteConv(e, c.id)}
                    />
                  ))}
                </div>
              )}

              {grouped.yesterday.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">Yesterday</p>
                  {grouped.yesterday.map((c) => (
                    <ConvListItem
                      key={c.id}
                      conv={c}
                      isActive={activeConvId === c.id}
                      onSelect={() => {
                        setActiveConvId(c.id);
                        navigate(`/chat/${c.id}`);
                      }}
                      onRename={() => setRenameTarget(c)}
                      onDelete={(e) => handleDeleteConv(e, c.id)}
                    />
                  ))}
                </div>
              )}

              {grouped.prev7Days.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">Previous 7 Days</p>
                  {grouped.prev7Days.map((c) => (
                    <ConvListItem
                      key={c.id}
                      conv={c}
                      isActive={activeConvId === c.id}
                      onSelect={() => {
                        setActiveConvId(c.id);
                        navigate(`/chat/${c.id}`);
                      }}
                      onRename={() => setRenameTarget(c)}
                      onDelete={(e) => handleDeleteConv(e, c.id)}
                    />
                  ))}
                </div>
              )}

              {grouped.older.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">Older</p>
                  {grouped.older.map((c) => (
                    <ConvListItem
                      key={c.id}
                      conv={c}
                      isActive={activeConvId === c.id}
                      onSelect={() => {
                        setActiveConvId(c.id);
                        navigate(`/chat/${c.id}`);
                      }}
                      onRename={() => setRenameTarget(c)}
                      onDelete={(e) => handleDeleteConv(e, c.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-[#080d19] relative overflow-hidden">
        {/* Top Chat Action Bar */}
        <div className="p-3 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-[#0b101d]/50 relative z-30 overflow-visible">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-visible">
            {/* Mobile-Only Back to Dashboard Button */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="md:hidden p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 flex-shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Mobile History Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileHistoryDrawer(true)}
              className="md:hidden p-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-1 flex-shrink-0"
              title="Chat History"
            >
              <History className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-[11px]">History</span>
            </button>

            {/* Document Context Selector Button (Opens Modal Popup) */}
            <button
              type="button"
              onClick={() => setShowDocSelector(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors shadow-sm cursor-pointer"
            >
              <Files className="w-3.5 h-3.5 text-violet-500" />
              <span className="truncate max-w-[130px] sm:max-w-none">
                {docMode === 'all'
                  ? 'Context: All Study Materials'
                  : selectedDocIds.length === 0
                  ? 'Context: Select Materials'
                  : `Selected (${selectedDocIds.length}) Notes`}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>



            {/* Selected Document Chips */}
            {docMode === 'selected' && selectedDocIds.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-sm">
                {selectedDocIds.map((id) => {
                  const doc = documents.find((d) => d.id === id);
                  if (!doc) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/80 text-[11px] text-violet-700 dark:text-violet-300 truncate max-w-[120px]"
                    >
                      <span className="truncate">{doc.original_file_name}</span>
                      <button
                        onClick={() => setSelectedDocIds(selectedDocIds.filter((dId) => dId !== id))}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Questions Quick Jump Menu */}
            {userQuestions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQuestionsMenu(!showQuestionsMenu)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors shadow-sm cursor-pointer flex-shrink-0"
                  title="Jump to question"
                >
                  <ListFilter className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-[11px] sm:text-xs">Questions ({userQuestions.length})</span>
                </button>

                {showQuestionsMenu && (
                  <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl p-3 shadow-2xl z-50 border border-slate-200 dark:border-slate-800 space-y-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 animate-fadeIn">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                      Questions in this session
                    </div>
                    {userQuestions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          jumpToMessage(q.id);
                          setShowQuestionsMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 truncate flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-[10px] text-violet-500 font-bold">Q{idx + 1}:</span>
                        <span className="truncate">{q.content}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link
              to="/upload"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Upload More Notes"
            >
              <UploadCloud className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6 relative w-full min-w-0"
        >
          {messages.length === 0 ? (
            /* Clean Empty AI Workspace with Quick Study Questions */
            <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-6 space-y-5 max-w-xl mx-auto animate-fadeIn">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/20">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What would you like to learn today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  Ask anything grounded in your study materials. Select questions below to get started instantly:
                </p>
              </div>

              {/* Quick Study Starter Questions Grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                {[
                  {
                    icon: '📝',
                    title: 'Summarize Key Concepts',
                    prompt: 'Summarize the core concepts, principles, and definitions from my study materials in structured bullet points.',
                  },
                  {
                    icon: '🎯',
                    title: 'Generate Practice Questions',
                    prompt: 'Generate 5 challenging practice exam questions with detailed answer explanations based on my notes.',
                  },
                  {
                    icon: '💡',
                    title: 'Explain Simply with Examples',
                    prompt: 'Explain the most complex and difficult topics in my study materials in simple, easy-to-understand terms with real-world examples.',
                  },
                  {
                    icon: '🔍',
                    title: 'Formulas & Exam Highlights',
                    prompt: 'List all key formulas, theorems, rules, and crucial points that are likely to appear on an exam.',
                  },
                ].map((item, idx) => (
                  <button
                       onClick={() => {
                      setInputValue(item.prompt);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
                          }
                        }, 50);
                      }
                    }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 hover:bg-violet-50/70 dark:hover:bg-violet-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-700 text-slate-800 dark:text-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm text-left flex items-start gap-2.5 cursor-pointer"
                  >
                    <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/upload"
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:scale-105"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Material</span>
                </Link>
                <button
                  onClick={() => setShowDocSelector(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Files className="w-4 h-4 text-violet-500" />
                  <span>Select Documents</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex gap-2 sm:gap-3 w-full min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm space-y-2.5 min-w-0 break-words [word-break:break-word] overflow-hidden ${
                    msg.role === 'user'
                      ? 'ml-auto max-w-[85%] sm:max-w-[75%] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                      : 'mr-auto max-w-[90%] sm:max-w-[82%] bg-slate-50 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words [word-break:break-word]">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="space-y-3 min-w-0 max-w-full overflow-hidden">
                      <div className="markdown-body text-xs sm:text-sm max-w-full overflow-hidden">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Real Verified Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <SourceBadgeList sources={msg.sources} />
                      )}

                      {/* Assistant Actions Bar - Scrollable on Mobile */}
                      <div className="pt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs border-t border-slate-100 dark:border-slate-800/80 -mx-1 px-1 max-w-full">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
                          title="Copy Answer"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleAIAction('simplify', msg.content, msg.id)}
                          disabled={actionLoadingId !== null || sending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                          title="Simplify Explanation"
                        >
                          {actionLoadingId === `simplify-${msg.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          ) : (
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className="text-[11px]">Simplify</span>
                        </button>

                        <button
                          onClick={() => handleAIAction('explain_more', msg.content, msg.id)}
                          disabled={actionLoadingId !== null || sending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                          title="Deep Dive Explanation"
                        >
                          {actionLoadingId === `explain_more-${msg.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span className="text-[11px]">Explain More</span>
                        </button>

                        <button
                          onClick={() => handleAIAction('give_example', msg.content, msg.id)}
                          disabled={actionLoadingId !== null || sending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                          title="Give Real Examples"
                        >
                          {actionLoadingId === `give_example-${msg.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="text-[11px]">Give Example</span>
                        </button>

                        <button
                          onClick={() => handleCreateQuizFromChat(msg.content)}
                          disabled={sending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                          title="Generate Quiz from this"
                        >
                          <FileQuestion className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[11px]">Create Quiz</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Animated AI Typing Indicator */}
          {sending && (
            <div className="flex items-start gap-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 bg-slate-50 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-bounce" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Thinking & searching study materials...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollDown && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 right-6 p-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl hover:scale-110 active:scale-95 transition-all z-20 animate-bounce-subtle cursor-pointer"
            title="Scroll to latest response"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        {/* Multiline Auto-Expanding Input Box with Glowing Effects */}
        <div className="p-2.5 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#090e1a] w-full">
          <form
            onSubmit={handleSendMessage}
            className="group relative flex items-end gap-2 bg-slate-100/90 dark:bg-[#101726] rounded-2xl p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500/70 focus-within:border-violet-500 dark:focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/15 dark:focus-within:ring-violet-400/20 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all duration-300 w-full"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                  }
                }
              }}
              placeholder={isListening ? 'Listening to your voice... speak now' : 'Ask anything about your study materials... (Shift+Enter for newline)'}
              disabled={sending}
              className="flex-1 bg-transparent py-1 px-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none border-none ring-0 resize-none min-h-[38px] max-h-[160px] leading-relaxed"
            />

            <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
              {/* Glowing Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30 shadow-lg shadow-red-500/40 scale-110'
                    : 'text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Dictation'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || sending}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  inputValue.trim() && !sending
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/30 hover:scale-105 active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Rename Conversation Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={!!renameTarget}
          initialValue={renameTarget.title}
          title="Rename Study Session"
          onClose={() => setRenameTarget(null)}
          onSave={handleRenameConv}
        />
      )}

      {/* Mobile Chat History Drawer */}
      {showMobileHistoryDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-4/5 max-w-xs h-full bg-white dark:bg-[#070b14] border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shadow-2xl animate-slideRight">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                    <History className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">Chat History</span>
                </div>
                <button
                  onClick={() => setShowMobileHistoryDrawer(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowMobileHistoryDrawer(false);
                  handleNewChat();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Grouped conversations */}
            <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3">
              {filteredConvs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No chats found.</p>
              ) : (
                <>
                  {grouped.today.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Today</p>
                      {grouped.today.map((c) => (
                        <ConvListItem
                          key={c.id}
                          conv={c}
                          isActive={activeConvId === c.id}
                          onSelect={() => {
                            setActiveConvId(c.id);
                            setShowMobileHistoryDrawer(false);
                            navigate(`/chat/${c.id}`);
                          }}
                          onRename={() => {
                            setShowMobileHistoryDrawer(false);
                            setRenameTarget(c);
                          }}
                          onDelete={(e) => handleDeleteConv(e, c.id)}
                        />
                      ))}
                    </div>
                  )}

                  {grouped.yesterday.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Yesterday</p>
                      {grouped.yesterday.map((c) => (
                        <ConvListItem
                          key={c.id}
                          conv={c}
                          isActive={activeConvId === c.id}
                          onSelect={() => {
                            setActiveConvId(c.id);
                            setShowMobileHistoryDrawer(false);
                            navigate(`/chat/${c.id}`);
                          }}
                          onRename={() => {
                            setShowMobileHistoryDrawer(false);
                            setRenameTarget(c);
                          }}
                          onDelete={(e) => handleDeleteConv(e, c.id)}
                        />
                      ))}
                    </div>
                  )}

                  {grouped.prev7Days.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Previous 7 Days</p>
                      {grouped.prev7Days.map((c) => (
                        <ConvListItem
                          key={c.id}
                          conv={c}
                          isActive={activeConvId === c.id}
                          onSelect={() => {
                            setActiveConvId(c.id);
                            setShowMobileHistoryDrawer(false);
                            navigate(`/chat/${c.id}`);
                          }}
                          onRename={() => {
                            setShowMobileHistoryDrawer(false);
                            setRenameTarget(c);
                          }}
                          onDelete={(e) => handleDeleteConv(e, c.id)}
                        />
                      ))}
                    </div>
                  )}

                  {grouped.older.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Older</p>
                      {grouped.older.map((c) => (
                        <ConvListItem
                          key={c.id}
                          conv={c}
                          isActive={activeConvId === c.id}
                          onSelect={() => {
                            setActiveConvId(c.id);
                            setShowMobileHistoryDrawer(false);
                            navigate(`/chat/${c.id}`);
                          }}
                          onRename={() => {
                            setShowMobileHistoryDrawer(false);
                            setRenameTarget(c);
                          }}
                          onDelete={(e) => handleDeleteConv(e, c.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowMobileHistoryDrawer(false)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Close History
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileHistoryDrawer(false)} />
        </div>
      )}
      {/* Grounding Materials Modal Popup */}
      {showDocSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1322] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <Files className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">AI Grounding Material</h3>
                  <p className="text-xs text-slate-400">Choose which notes AI should reference</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocSelector(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDocMode('all');
                  setSelectedDocIds([]);
                  setShowDocSelector(false);
                }}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                  docMode === 'all'
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Library Notes
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocMode('selected');
                  if (selectedDocIds.length === 0 && documents.length > 0) {
                    setSelectedDocIds([documents[0].id]);
                  }
                }}
                className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                  docMode === 'selected'
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                Pick Specific
              </button>
            </div>

            {docMode === 'selected' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedDocIds.length} of {documents.length} materials selected</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDocIds(documents.map((d) => d.id))}
                      className="text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDocIds([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {documents.length === 0 ? (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-xs text-slate-400">No documents found in your library.</p>
                      <Link
                        to="/upload"
                        className="inline-flex items-center gap-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Notes</span>
                      </Link>
                    </div>
                  ) : (
                    documents.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl text-xs cursor-pointer border transition-all ${
                            isSelected
                              ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-500/50 text-slate-900 dark:text-white font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedDocIds(selectedDocIds.filter((id) => id !== doc.id));
                              } else {
                                setSelectedDocIds([...selectedDocIds, doc.id]);
                              }
                            }}
                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                          />
                          <span className="truncate flex-1 font-semibold">
                            {doc.original_file_name}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">
                            {doc.total_pages} pages
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowDocSelector(false)}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/25 cursor-pointer"
                >
                  Apply Context ({selectedDocIds.length} Selected)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ConvListItemProps {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConvListItem: React.FC<ConvListItemProps> = ({
  conv,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between gap-2 p-2.5 sm:px-3 sm:py-2.5 rounded-2xl text-xs cursor-pointer transition-all border ${
        isActive
          ? 'bg-violet-50 dark:bg-violet-950/70 border-violet-500 text-violet-900 dark:text-violet-200 font-bold shadow-sm ring-1 ring-violet-500/30'
          : 'bg-white/80 dark:bg-[#0e1626]/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50/40 dark:hover:bg-slate-800/80 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${
            isActive
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
        </div>
        <span className="truncate font-medium">{conv.title}</span>
      </div>

      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Rename"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

interface SourceBadgeListProps {
  sources: SourceCitation[];
}

const SourceBadgeList: React.FC<SourceBadgeListProps> = ({ sources }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>{sources.length} Verified Sources Grounded</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-violet-700 dark:text-violet-300">
                <span className="truncate">{src.documentName}</span>
                <span>Page {src.pageNumber}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "{src.excerpt}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

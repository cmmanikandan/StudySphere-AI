export interface UserProfile {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  file_name: string;
  original_file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  processing_status: 'uploading' | 'processing' | 'ready' | 'failed';
  total_pages: number;
  created_at: string;
  updated_at: string;
  chunks_count?: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  chunk_text: string;
  page_number: number;
  metadata?: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  selected_document_mode: 'all' | 'selected';
  created_at: string;
  updated_at: string;
  message_count?: number;
  selected_document_ids?: string[];
}

export interface SourceCitation {
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerpt: string;
  relevanceScore?: number;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface SummaryItem {
  id: string;
  user_id: string;
  document_id: string;
  document_name?: string;
  summary_type: 'quick' | 'detailed' | 'exam_notes';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionItem {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  source?: string;
  created_at: string;
}

export interface QuizItem {
  id: string;
  user_id: string;
  document_id?: string;
  document_name?: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_count: number;
  created_at: string;
  attempts_count?: number;
  best_score?: number;
  questions?: QuizQuestionItem[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface UserSettings {
  id?: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  answer_style: 'simple' | 'detailed';
  show_sources: boolean;
  general_knowledge_fallback: boolean;
  language: string;
  updated_at?: string;
}

export interface AnalyticsStats {
  documentsCount: number;
  totalPages: number;
  conversationsCount: number;
  messagesCount: number;
  quizzesCount: number;
  quizAttemptsCount: number;
  averageQuizScore: number;
  summariesCount: number;
}

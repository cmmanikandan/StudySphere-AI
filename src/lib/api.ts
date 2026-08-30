import {
  UserProfile,
  DocumentItem,
  Conversation,
  ChatMessageItem,
  SummaryItem,
  QuizItem,
  QuizAttempt,
  UserSettings,
  AnalyticsStats,
  SourceCitation,
} from '../types';
import { supabase } from './supabase';

const API_BASE = '/api';

export async function syncUserProfile(user: {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> {
  try {
    const res = await fetch(`${API_BASE}/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        avatarUrl: user.photoURL || '',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.profile;
    }
  } catch (e) {
    console.warn('API sync endpoint notice, syncing directly with Supabase:', e);
  }

  // Direct Supabase Fallback
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(
      {
        firebase_uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        avatar_url: user.photoURL || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firebase_uid' }
    )
    .select('*')
    .single();

  if (error) {
    console.warn('Supabase direct profile error:', error);
    return {
      id: user.uid,
      firebase_uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      avatar_url: user.photoURL || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return profile;
}

export async function fetchAnalytics(userId: string): Promise<AnalyticsStats> {
  try {
    const res = await fetch(`${API_BASE}/analytics/${userId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API analytics notice, calculating via direct Supabase query:', e);
  }

  // Direct Supabase Query Fallback
  try {
    const [docsRes, convsRes, msgsRes, quizzesRes, attemptsRes, summariesRes] = await Promise.all([
      supabase.from('documents').select('id, total_pages', { count: 'exact' }).eq('user_id', userId),
      supabase.from('conversations').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('messages').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('quizzes').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('quiz_attempts').select('score, total_questions').eq('user_id', userId),
      supabase.from('summaries').select('id', { count: 'exact' }).eq('user_id', userId),
    ]);

    const totalPages = (docsRes.data || []).reduce((acc: number, d: any) => acc + (d.total_pages || 1), 0);
    const attempts = attemptsRes.data || [];
    let avgScore = 0;
    if (attempts.length > 0) {
      const sumPercentage = attempts.reduce(
        (acc: number, a: any) => acc + (a.score / (a.total_questions || 1)) * 100,
        0
      );
      avgScore = Math.round(sumPercentage / attempts.length);
    }

    return {
      documentsCount: docsRes.count || (docsRes.data || []).length,
      totalPages: totalPages,
      conversationsCount: convsRes.count || (convsRes.data || []).length,
      messagesCount: msgsRes.count || (msgsRes.data || []).length,
      quizzesCount: quizzesRes.count || (quizzesRes.data || []).length,
      quizAttemptsCount: attempts.length,
      averageQuizScore: avgScore,
      summariesCount: summariesRes.count || (summariesRes.data || []).length,
    };
  } catch (err) {
    return {
      documentsCount: 0,
      totalPages: 0,
      conversationsCount: 0,
      messagesCount: 0,
      quizzesCount: 0,
      quizAttemptsCount: 0,
      averageQuizScore: 0,
      summariesCount: 0,
    };
  }
}

export async function fetchDocuments(userId: string): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/documents/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.documents || [];
    }
  } catch (e) {
    console.warn('API fetchDocuments notice, querying Supabase directly:', e);
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Supabase direct documents error:', error);
    return [];
  }
  return data || [];
}

export async function uploadDocument(
  userId: string,
  file: File,
  onProgress?: (status: string) => void
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('file', file);

  if (onProgress) onProgress('Processing and indexing document chunks...');

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload and process document');
  }

  const data = await res.json();
  return data.document;
}

export async function renameDocument(id: string, userId: string, originalFileName: string): Promise<DocumentItem> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalFileName, userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.document;
    }
  } catch (e) {
    console.warn('API renameDocument notice, updating Supabase directly:', e);
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ original_file_name: originalFileName, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string, userId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('API deleteDocument notice, deleting from Supabase directly:', e);
  }

  await supabase.from('document_chunks').delete().eq('document_id', id);
  await supabase.from('documents').delete().eq('id', id).eq('user_id', userId);
}

export async function fetchDocumentPreview(id: string, userId: string): Promise<{ document: DocumentItem; chunks: any[]; totalChunks: number }> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}/preview?userId=${userId}`);
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API fetchDocumentPreview notice, loading from Supabase directly:', e);
  }

  const [docRes, chunksRes] = await Promise.all([
    supabase.from('documents').select('*').eq('id', id).single(),
    supabase.from('document_chunks').select('*').eq('document_id', id).order('chunk_index', { ascending: true }),
  ]);

  return {
    document: docRes.data,
    chunks: chunksRes.data || [],
    totalChunks: (chunksRes.data || []).length,
  };
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.conversations || [];
    }
  } catch (e) {
    console.warn('API fetchConversations notice, loading from Supabase directly:', e);
  }

  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return data || [];
}

export async function createConversation(
  userId: string,
  title?: string,
  selectedDocumentMode: 'all' | 'selected' = 'all',
  documentIds?: string[]
): Promise<Conversation> {
  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, selectedDocumentMode, documentIds }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.conversation;
    }
  } catch (e) {
    console.warn('API createConversation notice, creating in Supabase directly:', e);
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title || 'New Study Session',
      selected_document_mode: selectedDocumentMode,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversation(
  id: string,
  userId: string,
  updates: { title?: string; selectedDocumentMode?: 'all' | 'selected'; documentIds?: string[] }
): Promise<Conversation> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.conversation;
    }
  } catch (e) {
    console.warn('API updateConversation notice, updating in Supabase directly:', e);
  }

  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (updates.title) updatePayload.title = updates.title;
  if (updates.selectedDocumentMode) updatePayload.selected_document_mode = updates.selectedDocumentMode;

  const { data, error } = await supabase
    .from('conversations')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export const renameConversation = updateConversation;

export async function deleteConversation(id: string, userId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('API deleteConversation notice, deleting in Supabase directly:', e);
  }

  await supabase.from('messages').delete().eq('conversation_id', id);
  await supabase.from('conversations').delete().eq('id', id).eq('user_id', userId);
}

export async function fetchMessages(conversationId: string): Promise<ChatMessageItem[]> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      return data.messages || [];
    }
  } catch (e) {
    console.warn('API fetchMessages notice, querying Supabase directly:', e);
  }

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return (data || []).map((m: any) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    user_id: m.user_id || '',
    role: m.role,
    content: m.content,
    sources: m.sources || [],
    created_at: m.created_at,
  }));
}

export async function sendChatMessage(params: {
  conversationId?: string;
  userId: string;
  message: string;
  documentIds?: string[];
  selectedDocumentMode?: 'all' | 'selected';
}): Promise<{
  conversationId: string;
  userMessage: ChatMessageItem;
  assistantMessage: ChatMessageItem;
  sources: SourceCitation[];
  isFallback: boolean;
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate AI response');
  }

  return res.json();
}

export async function executeChatAction(action: 'simplify' | 'explain_more' | 'give_example', text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, text }),
  });
  if (!res.ok) throw new Error('Action execution failed');
  const data = await res.json();
  return data.result;
}

export async function generateSummary(userId: string, documentId: string, summaryType: 'quick' | 'detailed' | 'exam_notes'): Promise<SummaryItem> {
  const res = await fetch(`${API_BASE}/summaries/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, documentId, summaryType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate summary');
  }
  const data = await res.json();
  return data.summary;
}

export async function fetchSummaries(userId: string): Promise<SummaryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/summaries/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.summaries || [];
    }
  } catch (e) {
    console.warn('API fetchSummaries notice, querying Supabase directly:', e);
  }

  const { data } = await supabase
    .from('summaries')
    .select('*, documents(original_file_name, file_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map((s: any) => ({
    ...s,
    document_name: s.documents?.original_file_name,
    file_type: s.documents?.file_type,
  }));
}

export async function deleteSummary(id: string, userId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/summaries/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('API deleteSummary notice, deleting from Supabase directly:', e);
  }

  await supabase.from('summaries').delete().eq('id', id).eq('user_id', userId);
}

export async function generateQuiz(params: {
  userId: string;
  documentId: string;
  title?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionType: 'mcq' | 'true_false' | 'short_answer';
}): Promise<QuizItem> {
  const res = await fetch(`${API_BASE}/quizzes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate quiz');
  }
  const data = await res.json();
  return data.quiz;
}

export async function fetchQuizzes(userId: string): Promise<QuizItem[]> {
  try {
    const res = await fetch(`${API_BASE}/quizzes/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.quizzes || [];
    }
  } catch (e) {
    console.warn('API fetchQuizzes notice, querying Supabase directly:', e);
  }

  const { data } = await supabase
    .from('quizzes')
    .select('*, documents(original_file_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map((q: any) => ({
    ...q,
    document_name: q.documents?.original_file_name,
  }));
}

export async function fetchQuizDetails(id: string): Promise<{ quiz: QuizItem; questions: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/quizzes/${id}/details`);
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API fetchQuizDetails notice, querying Supabase directly:', e);
  }

  const [quizRes, questionsRes] = await Promise.all([
    supabase.from('quizzes').select('*').eq('id', id).single(),
    supabase.from('quiz_questions').select('*').eq('quiz_id', id).order('question_number', { ascending: true }),
  ]);

  return {
    quiz: quizRes.data,
    questions: questionsRes.data || [],
  };
}

export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: { questionId: string; selectedAnswer: string }[]
): Promise<{
  attempt: QuizAttempt;
  score: number;
  total: number;
  percentage: number;
  evaluatedAnswers: any[];
}> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, answers }),
  });
  if (!res.ok) throw new Error('Failed to submit quiz attempt');
  return res.json();
}

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.settings;
    }
  } catch (e) {
    console.warn('API fetchUserSettings notice, querying Supabase directly:', e);
  }

  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) {
    return {
      user_id: userId,
      theme: 'system',
      answer_style: 'detailed',
      show_sources: true,
      general_knowledge_fallback: true,
      language: 'en',
    };
  }
  return data;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      return data.settings;
    }
  } catch (e) {
    console.warn('API updateUserSettings notice, updating Supabase directly:', e);
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

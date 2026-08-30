import { supabase } from './db.ts';
import { generateGroqCompletion, ChatMessage } from './groq.ts';

export interface RetrievedSource {
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerpt: string;
  relevanceScore: number;
}

export interface RagResult {
  answer: string;
  sources: RetrievedSource[];
  isFallback: boolean;
}

export async function searchDocumentChunks(
  userId: string,
  query: string,
  documentIds?: string[],
  topK: number = 6
): Promise<RetrievedSource[]> {
  try {
    let queryBuilder = supabase
      .from('document_chunks')
      .select('id, document_id, chunk_text, page_number, documents(id, file_name, original_file_name)')
      .eq('user_id', userId);

    if (documentIds && documentIds.length > 0) {
      queryBuilder = queryBuilder.in('document_id', documentIds);
    }

    const { data: chunks, error } = await queryBuilder;
    if (error || !chunks || chunks.length === 0) {
      return [];
    }

    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scoredChunks = chunks.map((row: any) => {
      const lowerText = (row.chunk_text || '').toLowerCase();
      let score = 0;

      if (lowerText.includes(query.toLowerCase())) {
        score += 25;
      }

      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}`, 'gi');
        const matches = (lowerText.match(regex) || []).length;
        score += matches * 3;
      }

      score = score / Math.sqrt((row.chunk_text || '').length / 100 + 1);

      const docInfo = Array.isArray(row.documents) ? row.documents[0] : row.documents;
      const docName = docInfo?.original_file_name || docInfo?.file_name || 'Study Material';

      return {
        documentId: row.document_id,
        documentName: docName,
        pageNumber: row.page_number || 1,
        excerpt: (row.chunk_text || '').slice(0, 300) + ((row.chunk_text || '').length > 300 ? '...' : ''),
        fullChunk: row.chunk_text,
        relevanceScore: Math.round(score * 10) / 10,
      };
    });

    scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const filtered = scoredChunks.filter((c) => c.relevanceScore > 0);
    const topResults = filtered.length > 0 ? filtered.slice(0, topK) : scoredChunks.slice(0, Math.min(3, scoredChunks.length));

    return topResults.map((item) => ({
      documentId: item.documentId,
      documentName: item.documentName,
      pageNumber: item.pageNumber,
      excerpt: item.excerpt,
      relevanceScore: item.relevanceScore,
    }));
  } catch (err) {
    console.error('searchDocumentChunks error:', err);
    return [];
  }
}

export async function generateRagAnswer(
  userId: string,
  userQuestion: string,
  history: ChatMessage[] = [],
  documentIds?: string[],
  userSettings?: {
    answerStyle?: string;
    showSources?: boolean;
    generalKnowledgeFallback?: boolean;
  }
): Promise<RagResult> {
  const sources = await searchDocumentChunks(userId, userQuestion, documentIds, 5);
  const hasRelevantSources = sources.some((s) => s.relevanceScore > 0);

  if (sources.length === 0) {
    if (userSettings?.generalKnowledgeFallback) {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are StudySphere AI, a brilliant personal AI academic tutor. Provide a helpful, comprehensive academic response. At the top of your response, include: '> **Note**: Answering using general AI knowledge because no specific study materials were matched.'`,
        },
        ...history.slice(-4),
        { role: 'user', content: userQuestion },
      ];
      const answer = await generateGroqCompletion(messages, 0.3);
      return {
        answer,
        sources: [],
        isFallback: true,
      };
    } else {
      return {
        answer: "I couldn't find this information in your selected study materials. Please upload relevant notes or enable 'General Knowledge Fallback' in your settings.",
        sources: [],
        isFallback: false,
      };
    }
  }

  const contextText = sources
    .map(
      (s, idx) =>
        `[Source ${idx + 1}] (Document: "${s.documentName}", Page: ${s.pageNumber})\n${s.excerpt}`
    )
    .join('\n\n---\n\n');

  const answerStyle = userSettings?.answerStyle || 'detailed';
  const styleInstruction =
    answerStyle === 'simple'
      ? 'Explain in simple, beginner-friendly terms with clear analogies.'
      : 'Provide a structured, rigorous, and comprehensive explanation with headings, bullet points, and key definitions.';

  const systemPrompt = `You are StudySphere AI, an intelligent personal AI tutor.
Your mission is to help the student learn effectively based strictly on their study materials.

DOCUMENT CONTEXT:
"""
${contextText}
"""

GUIDELINES:
1. Ground your answer primarily in the provided study materials above.
2. ${styleInstruction}
3. Always format your answer with clean Markdown (headings, bullet points, bold key terms, tables or code blocks where appropriate).
4. If the provided document context does NOT contain enough information to answer the question:
   ${
     userSettings?.generalKnowledgeFallback
       ? "Explicitly state what the documents say, and then provide supplementary explanation clearly marked as '(General Knowledge Supplement)'."
       : "Explicitly state: \"I couldn't find this information in your selected study materials.\" Do not invent facts."
   }
5. Do not invent page numbers or document names. Use the exact references provided.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4),
    { role: 'user', content: userQuestion },
  ];

  const answer = await generateGroqCompletion(messages, 0.2);

  return {
    answer,
    sources: userSettings?.showSources !== false ? sources : [],
    isFallback: !hasRelevantSources,
  };
}

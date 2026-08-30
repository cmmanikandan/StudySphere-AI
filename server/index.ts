import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from './db.ts';
import { parseDocumentBuffer } from './parser.ts';
import { chunkDocument } from './chunker.ts';
import { generateRagAnswer } from './rag.ts';
import { generateGroqCompletion, ChatMessage } from './groq.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StudySphere AI Backend', timestamp: new Date().toISOString() });
});

// 1. Auth Profile Sync
app.post('/api/auth/sync', async (req, res) => {
  const { firebaseUid, email, name, avatarUrl } = req.body;
  if (!firebaseUid || !email) {
    return res.status(400).json({ error: 'firebaseUid and email are required' });
  }

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .upsert(
        {
          firebase_uid: firebaseUid,
          email,
          name: name || email.split('@')[0],
          avatar_url: avatarUrl || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firebase_uid' }
      )
      .select('*')
      .single();

    if (profileErr) throw profileErr;

    // Ensure default settings exist
    await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: firebaseUid,
          theme: 'system',
          answer_style: 'detailed',
          show_sources: true,
          general_knowledge_fallback: true,
          language: 'en',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    res.json({ success: true, profile });
  } catch (err: any) {
    console.error('Auth sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Real Analytics
app.get('/api/analytics/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [docsRes, convsRes, msgsRes, quizzesRes, attemptsRes, summariesRes] = await Promise.all([
      supabase.from('documents').select('id, total_pages', { count: 'exact' }).eq('user_id', userId),
      supabase.from('conversations').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('messages').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('quizzes').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('quiz_attempts').select('score, total_questions').eq('user_id', userId),
      supabase.from('summaries').select('id', { count: 'exact' }).eq('user_id', userId),
    ]);

    const totalPages = (docsRes.data || []).reduce((acc, d: any) => acc + (d.total_pages || 1), 0);
    const attempts = attemptsRes.data || [];
    let avgScore = 0;
    if (attempts.length > 0) {
      const sumPercentage = attempts.reduce(
        (acc: number, a: any) => acc + (a.score / (a.total_questions || 1)) * 100,
        0
      );
      avgScore = Math.round(sumPercentage / attempts.length);
    }

    res.json({
      documentsCount: docsRes.count || (docsRes.data || []).length,
      totalPages,
      conversationsCount: convsRes.count || (convsRes.data || []).length,
      messagesCount: msgsRes.count || (msgsRes.data || []).length,
      quizzesCount: quizzesRes.count || (quizzesRes.data || []).length,
      quizAttemptsCount: attempts.length,
      averageQuizScore: avgScore,
      summariesCount: summariesRes.count || (summariesRes.data || []).length,
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Document Upload & Ingestion
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  const { userId } = req.body;
  const file = req.file;

  if (!userId || !file) {
    return res.status(400).json({ error: 'Missing userId or file' });
  }

  try {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/documents/${Date.now()}_${sanitizedFileName}`;

    // 1. Insert document record in processing state
    const { data: docRecord, error: insertErr } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_name: sanitizedFileName,
        original_file_name: originalName,
        file_type: file.mimetype || 'application/octet-stream',
        file_size: file.size,
        storage_path: storagePath,
        processing_status: 'processing',
        total_pages: 1,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;

    // 2. Parse document text and pages
    const extracted = await parseDocumentBuffer(file.buffer, file.mimetype, originalName);

    // 3. Chunk text
    const chunks = chunkDocument(extracted, 250, 50);

    // 4. Save chunks in batches (to support large 50-150+ page PDFs)
    if (chunks.length > 0) {
      const chunksPayload = chunks.map((c) => ({
        document_id: docRecord.id,
        user_id: userId,
        chunk_index: c.chunkIndex,
        chunk_text: c.chunkText,
        page_number: c.pageNumber,
        metadata: c.metadata,
      }));

      for (let i = 0; i < chunksPayload.length; i += 50) {
        const batch = chunksPayload.slice(i, i + 50);
        const { error: chunksErr } = await supabase.from('document_chunks').insert(batch);
        if (chunksErr) console.warn('Chunks batch insert notice:', chunksErr);
      }
    }

    // 5. Update document to ready
    const { data: updatedDoc, error: updateErr } = await supabase
      .from('documents')
      .update({
        processing_status: 'ready',
        total_pages: extracted.totalPages || 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', docRecord.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      document: updatedDoc,
      chunksCount: chunks.length,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

// 4. Document List
app.get('/api/documents/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ documents: documents || [] });
  } catch (err: any) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Rename Document
app.patch('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { originalFileName, userId } = req.body;
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .update({ original_file_name: originalFileName, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, document });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete Document
app.delete('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId as string);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Document Preview & Chunks Content
app.get('/api/documents/:id/preview', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docErr || !doc) return res.status(404).json({ error: 'Document not found' });

    const { data: chunks, error: chunksErr } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', id)
      .order('chunk_index', { ascending: true });

    if (chunksErr) throw chunksErr;

    res.json({
      document: doc,
      chunks: chunks || [],
      totalChunks: (chunks || []).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 7. Conversations
app.get('/api/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ conversations: conversations || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations', async (req, res) => {
  const { userId, title, selectedDocumentMode, documentIds } = req.body;
  try {
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || 'New Study Session',
        selected_document_mode: selectedDocumentMode || 'all',
      })
      .select('*')
      .single();

    if (error) throw error;

    if (documentIds && Array.isArray(documentIds)) {
      const convDocs = documentIds.map((dId) => ({
        conversation_id: conv.id,
        document_id: dId,
      }));
      await supabase.from('conversation_documents').insert(convDocs);
    }

    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/conversations/:id', async (req, res) => {
  const { id } = req.params;
  const { title, selectedDocumentMode, documentIds, userId } = req.body;
  try {
    const updates: any = { updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    if (selectedDocumentMode) updates.selected_document_mode = selectedDocumentMode;

    const { data: conv, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;

    if (documentIds && Array.isArray(documentIds)) {
      await supabase.from('conversation_documents').delete().eq('conversation_id', id);
      const convDocs = documentIds.map((dId) => ({ conversation_id: id, document_id: dId }));
      await supabase.from('conversation_documents').insert(convDocs);
    }

    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/conversations/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId as string);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ messages: messages || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. RAG Chat Completion
app.post('/api/chat', async (req, res) => {
  const { conversationId, userId, message, documentIds, selectedDocumentMode } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
    let currentConvId = conversationId;

    if (!currentConvId) {
      const generatedTitle = message.slice(0, 35) + (message.length > 35 ? '...' : '');
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: generatedTitle,
          selected_document_mode: selectedDocumentMode || 'all',
        })
        .select('id')
        .single();

      if (convErr) throw convErr;
      currentConvId = newConv.id;
    }

    // Save user message
    const { data: userMsg, error: userMsgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConvId,
        user_id: userId,
        role: 'user',
        content: message,
      })
      .select('*')
      .single();

    if (userMsgErr) throw userMsgErr;

    // Fetch user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch recent message history
    const { data: recentMsgs } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConvId)
      .order('created_at', { ascending: false })
      .limit(6);

    const history: ChatMessage[] = (recentMsgs || []).reverse().map((r: any) => ({
      role: r.role as 'user' | 'assistant',
      content: r.content,
    }));

    // Run RAG generation
    const ragResult = await generateRagAnswer(
      userId,
      message,
      history,
      documentIds,
      {
        answerStyle: settings?.answer_style,
        showSources: settings?.show_sources,
        generalKnowledgeFallback: settings?.general_knowledge_fallback,
      }
    );

    // Save assistant response
    const { data: assistantMsg, error: astErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConvId,
        user_id: userId,
        role: 'assistant',
        content: ragResult.answer,
        sources: ragResult.sources,
      })
      .select('*')
      .single();

    if (astErr) throw astErr;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConvId);

    res.json({
      conversationId: currentConvId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      sources: ragResult.sources,
      isFallback: ragResult.isFallback,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// 9. Quick AI Actions (Simplify, Explain More, Give Example)
app.post('/api/chat/action', async (req, res) => {
  const { action, text } = req.body;
  if (!text || !action) {
    return res.status(400).json({ error: 'Missing text or action' });
  }

  let prompt = '';
  if (action === 'simplify') {
    prompt = `Please explain the following content in very simple, plain English terms as if teaching a beginner student. Use everyday analogies:\n\n${text}`;
  } else if (action === 'explain_more') {
    prompt = `Please provide a deeper, comprehensive academic explanation of the concepts mentioned in this text with detailed breakdowns, theoretical background, and real-world importance:\n\n${text}`;
  } else if (action === 'give_example') {
    prompt = `Please provide 2-3 concrete, step-by-step practical examples or case studies illustrating the concepts explained in this text:\n\n${text}`;
  } else {
    prompt = `Please review and elaborate on this study text:\n\n${text}`;
  }

  try {
    const result = await generateGroqCompletion(
      [
        { role: 'system', content: 'You are StudySphere AI, a brilliant personal academic tutor.' },
        { role: 'user', content: prompt },
      ],
      0.3
    );

    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Summaries Generation
app.post('/api/summaries/generate', async (req, res) => {
  const { userId, documentId, summaryType } = req.body;
  if (!userId || !documentId || !summaryType) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docErr || !doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: chunks } = await supabase
      .from('document_chunks')
      .select('chunk_text, page_number')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })
      .limit(25);

    const docText = (chunks || [])
      .map((c: any) => `[Page ${c.page_number}]: ${c.chunk_text}`)
      .join('\n\n')
      .slice(0, 4000);



    let instruction = '';
    if (summaryType === 'quick') {
      instruction = 'Create a concise, executive 1-page summary. Include 5 high-impact bullet points, core takeaway, and essential terms.';
    } else if (summaryType === 'detailed') {
      instruction = 'Create an in-depth, section-by-section breakdown of the document with full explanations, subheadings, key definitions, and synthesis.';
    } else if (summaryType === 'exam_notes') {
      instruction = 'Create an Exam Cram / High-Yield Notes sheet. Include: Key Formulas/Theorems, High-Probability Exam Questions & Answers, Critical Definitions, and Common Pitfalls to Avoid.';
    }

    const systemPrompt = `You are StudySphere AI, an expert academic tutor summarizing study material for a student.
Format with clean Markdown, clear typography, and highlighted key takeaways.`;

    const summaryContent = await generateGroqCompletion(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Document Name: ${doc.original_file_name}\nSummary Type: ${summaryType}\nInstruction: ${instruction}\n\nDocument Content:\n"""\n${docText}\n"""`,
        },
      ],
      0.3
    );

    const { data: savedSummary, error: saveErr } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        document_id: documentId,
        summary_type: summaryType,
        content: summaryContent,
      })
      .select('*')
      .single();

    if (saveErr) throw saveErr;

    res.json({
      success: true,
      summary: {
        ...savedSummary,
        document_name: doc.original_file_name,
      },
    });
  } catch (err: any) {
    console.error('Summary generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. List Summaries
app.get('/api/summaries/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: summaries, error } = await supabase
      .from('summaries')
      .select('*, documents(original_file_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (summaries || []).map((s: any) => ({
      ...s,
      document_name: Array.isArray(s.documents)
        ? s.documents[0]?.original_file_name
        : s.documents?.original_file_name || 'Study Material',
    }));

    res.json({ summaries: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/summaries/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId as string);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Quiz Generator
app.post('/api/quizzes/generate', async (req, res) => {
  const { userId, documentId, title, difficulty = 'medium', questionCount = 5, questionType = 'mcq' } = req.body;
  if (!userId || !documentId) {
    return res.status(400).json({ error: 'Missing userId or documentId' });
  }

  try {
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docErr || !doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: chunks } = await supabase
      .from('document_chunks')
      .select('chunk_text, page_number')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })
      .limit(20);

    const docText = (chunks || [])
      .map((c: any) => c.chunk_text)
      .filter((t: string) => !t.includes('[Content_Types].xml') && !t.includes('PK!'))
      .join('\n\n')
      .slice(0, 3500) || `Study Material: ${doc.original_file_name}`;

    const prompt = `Generate a ${difficulty} difficulty quiz with ${questionCount} questions based on this study material.
Question Format: ${questionType === 'true_false' ? 'True/False' : questionType === 'short_answer' ? 'Short Conceptual Question' : 'Multiple Choice with 4 options'}.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "${title || 'Quiz on ' + doc.original_file_name}",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation of why this answer is correct based on the material.",
      "source": "Page 1"
    }
  ]
}

Document Content:
"""
${docText}
"""`;

    let questions: any[] = [];
    let quizTitle = title || `Quiz: ${doc.original_file_name}`;

    try {
      const rawJson = await generateGroqCompletion(
        [
          { role: 'system', content: 'You are an expert exam creator. Output strict JSON only without markdown fences.' },
          { role: 'user', content: prompt },
        ],
        0.3,
        { type: 'json_object' }
      );

      let parsed: any = {};
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        const match = rawJson.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
      }

      if (parsed.title) quizTitle = parsed.title;
      if (Array.isArray(parsed.questions)) questions = parsed.questions;
    } catch (aiErr: any) {
      console.warn('Groq quiz creation warning:', aiErr?.message);
    }

    if (!questions || questions.length === 0) {
      questions = [
        {
          question: `What is the core subject matter covered in ${doc.original_file_name}?`,
          options: ['Fundamental principles and concepts', 'Irrelevant information', 'Blank data', 'None of the above'],
          correct_answer: 'Fundamental principles and concepts',
          explanation: `This study material introduces foundational concepts regarding ${doc.original_file_name}.`,
          source: 'Page 1',
        },
        {
          question: `Why is understanding ${doc.original_file_name} important for your studies?`,
          options: ['It builds foundational knowledge for exams', 'It is optional background', 'It has no relevance', 'It is purely historical'],
          correct_answer: 'It builds foundational knowledge for exams',
          explanation: 'Mastering these core topics helps ensure solid understanding and high test performance.',
          source: 'Page 1',
        },
        {
          question: `True or False: The concepts presented in ${doc.original_file_name} should be reviewed systematically.`,
          options: ['True', 'False'],
          correct_answer: 'True',
          explanation: 'Systematic study and review of material leads to better retention.',
          source: 'Page 1',
        },
      ];
    }

    const { data: quizRecord, error: quizErr } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        document_id: documentId,
        title: quizTitle,
        difficulty,
        question_count: questions.length,
      })
      .select('*')
      .single();

    if (quizErr) throw quizErr;

    const savedQuestions = [];
    for (const q of questions) {
      const { data: qRes } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizRecord.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : ['True', 'False'],
          correct_answer: q.correct_answer || (q.options ? q.options[0] : 'True'),
          explanation: q.explanation || 'Based on study materials.',
          source: q.source || 'Page 1',
        })
        .select('*')
        .single();

      if (qRes) savedQuestions.push(qRes);
    }


    res.json({
      success: true,
      quiz: {
        ...quizRecord,
        document_name: doc.original_file_name,
        questions: savedQuestions,
      },
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 13. List Quizzes & Attempts
app.get('/api/quizzes/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*, documents(original_file_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (quizzes || []).map((q: any) => ({
      ...q,
      document_name: Array.isArray(q.documents)
        ? q.documents[0]?.original_file_name
        : q.documents?.original_file_name || 'Study Material',
    }));

    res.json({ quizzes: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id/details', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*, documents(original_file_name)')
      .eq('id', id)
      .single();

    if (quizErr || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('created_at', { ascending: true });

    res.json({
      quiz: {
        ...quiz,
        document_name: Array.isArray(quiz.documents)
          ? quiz.documents[0]?.original_file_name
          : quiz.documents?.original_file_name,
      },
      questions: questions || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quizzes/:id/attempt', async (req, res) => {
  const { id } = req.params;
  const { userId, answers } = req.body;
  if (!userId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Missing userId or answers' });
  }

  try {
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id);

    const questionsMap = new Map((questions || []).map((q: any) => [q.id, q]));

    let correctCount = 0;
    const evaluatedAnswers: any[] = [];

    for (const ans of answers) {
      const q: any = questionsMap.get(ans.questionId);
      const isCorrect = q
        ? q.correct_answer.trim().toLowerCase() === (ans.selectedAnswer || '').trim().toLowerCase()
        : false;
      if (isCorrect) correctCount++;
      evaluatedAnswers.push({
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
        correctAnswer: q?.correct_answer,
        explanation: q?.explanation,
      });
    }

    const { data: attempt, error: attemptErr } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: id,
        user_id: userId,
        score: correctCount,
        total_questions: answers.length,
      })
      .select('*')
      .single();

    if (attemptErr) throw attemptErr;

    const answersPayload = evaluatedAnswers.map((evalAns) => ({
      attempt_id: attempt.id,
      question_id: evalAns.questionId,
      selected_answer: evalAns.selectedAnswer,
      is_correct: evalAns.isCorrect,
    }));

    await supabase.from('quiz_answers').insert(answersPayload);

    res.json({
      success: true,
      attempt,
      score: correctCount,
      total: answers.length,
      percentage: Math.round((correctCount / (answers.length || 1)) * 100),
      evaluatedAnswers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Settings
app.get('/api/settings/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      const { data: inserted } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          theme: 'system',
          answer_style: 'detailed',
          show_sources: true,
          general_knowledge_fallback: true,
          language: 'en',
        })
        .select('*')
        .single();
      return res.json({ settings: inserted });
    }

    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/:userId', async (req, res) => {
  const { userId } = req.params;
  const { theme, answerStyle, showSources, generalKnowledgeFallback, language } = req.body;
  try {
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          theme,
          answer_style: answerStyle,
          show_sources: showSources,
          general_knowledge_fallback: generalKnowledgeFallback,
          language,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SPA Catch-all: serve index.html for any client-side routes on refresh
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('StudySphere AI App: Please run `npm run build` or use Vite dev server on port 5173');
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 StudySphere AI backend server is running on http://localhost:${port}`);
  });
}

export default app;

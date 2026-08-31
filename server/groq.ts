import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY || '';

if (!groqApiKey) {
  console.warn('⚠️ GROQ_API_KEY is not set in environment variables.');
}

export const groq = new Groq({
  apiKey: groqApiKey || 'dummy_key',
});

export const AVAILABLE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateGroqCompletion(
  messages: ChatMessage[],
  temperature: number = 0.3,
  responseFormat?: { type: 'json_object' }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || groqApiKey;
  if (!apiKey || apiKey === 'dummy_key') {
    throw new Error('GROQ_API_KEY is missing on the server. Please add GROQ_API_KEY to your deployment Environment Variables in your hosting dashboard (e.g. Vercel Project Settings > Environment Variables).');
  }

  // Truncate messages if total text length is too large to prevent 413 rate limit
  const sanitizedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content.length > 5000 ? m.content.slice(0, 5000) + '...' : m.content,
  }));

  let lastError: any = null;

  for (const model of AVAILABLE_MODELS) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: sanitizedMessages,
        model,
        temperature,
        response_format: responseFormat,
      });

      const content = chatCompletion.choices[0]?.message?.content || '';
      if (content) {
        return content;
      }
    } catch (err: any) {
      console.warn(`Groq model (${model}) failed:`, err?.message);
      lastError = err;
      // Continue to next fallback model
    }
  }

  console.error('All Groq models failed:', lastError);
  throw new Error(`AI generation failed: ${lastError?.message || 'Unknown Groq error'}`);
}


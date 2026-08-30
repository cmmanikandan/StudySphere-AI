import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY || '';

export const groq = new Groq({
  apiKey: groqApiKey,
});

export const PRIMARY_MODEL = 'openai/gpt-oss-120b';
export const FALLBACK_MODEL = 'qwen/qwen3.8-27b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateGroqCompletion(
  messages: ChatMessage[],
  temperature: number = 0.3,
  responseFormat?: { type: 'json_object' }
): Promise<string> {
  // Truncate messages if total text length is too large to prevent 413 rate limit
  const sanitizedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content.length > 5000 ? m.content.slice(0, 5000) + '...' : m.content,
  }));

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: sanitizedMessages,
      model: PRIMARY_MODEL,
      temperature,
      response_format: responseFormat,
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err: any) {
    console.warn(`Groq primary model (${PRIMARY_MODEL}) fallback:`, err?.message);
    try {
      const fallbackCompletion = await groq.chat.completions.create({
        messages: sanitizedMessages,
        model: FALLBACK_MODEL,
        temperature,
        response_format: responseFormat,
      });
      return fallbackCompletion.choices[0]?.message?.content || '';
    } catch (fallbackErr: any) {
      console.error('Groq generation error:', fallbackErr);
      throw new Error(`AI generation failed: ${fallbackErr.message || 'Unknown Groq error'}`);
    }
  }
}

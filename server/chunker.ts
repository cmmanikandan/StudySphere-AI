import { ExtractedDocument } from './parser.ts';

export interface ChunkItem {
  chunkIndex: number;
  chunkText: string;
  pageNumber: number;
  metadata: {
    wordCount: number;
    charCount: number;
    preview: string;
  };
}

export function chunkDocument(
  doc: ExtractedDocument,
  maxChunkWords: number = 250,
  overlapWords: number = 50
): ChunkItem[] {
  const chunks: ChunkItem[] = [];
  let chunkIndex = 0;

  for (const page of doc.pages) {
    const text = page.text.trim();
    if (!text) continue;

    const words = text.split(/\s+/);
    if (words.length <= maxChunkWords) {
      chunks.push({
        chunkIndex: chunkIndex++,
        chunkText: text,
        pageNumber: page.pageNumber,
        metadata: {
          wordCount: words.length,
          charCount: text.length,
          preview: words.slice(0, 15).join(' ') + '...',
        },
      });
      continue;
    }

    // Slide over words with overlap
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + maxChunkWords, words.length);
      const chunkWords = words.slice(start, end);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        chunkIndex: chunkIndex++,
        chunkText,
        pageNumber: page.pageNumber,
        metadata: {
          wordCount: chunkWords.length,
          charCount: chunkText.length,
          preview: chunkWords.slice(0, 15).join(' ') + '...',
        },
      });

      if (end >= words.length) break;
      start += (maxChunkWords - overlapWords);
    }
  }

  return chunks;
}

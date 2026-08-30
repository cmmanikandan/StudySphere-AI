import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  totalPages: number;
  pages: ExtractedPage[];
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<ExtractedDocument> {
  const ext = fileName.toLowerCase().split('.').pop() || '';

  if (ext === 'pdf' || fileType.includes('pdf')) {
    return parsePdfFast(buffer);
  } else if (ext === 'docx' || fileType.includes('wordprocessingml')) {
    return parseDocxFast(buffer);
  } else if (ext === 'pptx' || fileType.includes('presentationml')) {
    return parsePptxFast(buffer);
  } else {
    const text = buffer.toString('utf-8');
    return {
      text,
      totalPages: 1,
      pages: [{ pageNumber: 1, text }],
    };
  }
}

async function parsePdfFast(buffer: Buffer): Promise<ExtractedDocument> {
  try {
    const data = await pdfParse(buffer);
    const fullText = (data.text || '').trim();
    const totalPages = data.numpages || 1;

    let rawPages = fullText.split(/\f|\n\s*\n\s*\n/).filter((p) => p.trim().length > 0);
    if (rawPages.length === 0 && fullText) {
      rawPages = [fullText];
    }

    const pages: ExtractedPage[] = rawPages.map((pText, idx) => ({
      pageNumber: idx + 1,
      text: pText.trim(),
    }));

    return {
      text: fullText,
      totalPages: Math.max(totalPages, pages.length),
      pages,
    };
  } catch (err: any) {
    console.warn('PDF parse fallback:', err?.message);
    const raw = buffer.toString('latin1');
    const cleaned = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    return {
      text: cleaned,
      totalPages: 1,
      pages: [{ pageNumber: 1, text: cleaned }],
    };
  }
}

async function parseDocxFast(buffer: Buffer): Promise<ExtractedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value || '').trim();
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const pages: ExtractedPage[] = [];
  let currentPageText = '';
  let pageNum = 1;

  for (const para of paragraphs) {
    currentPageText += para + '\n\n';
    if (currentPageText.split(/\s+/).length >= 400) {
      pages.push({ pageNumber: pageNum++, text: currentPageText.trim() });
      currentPageText = '';
    }
  }

  if (currentPageText.trim()) {
    pages.push({ pageNumber: pageNum, text: currentPageText.trim() });
  }

  if (pages.length === 0 && text) {
    pages.push({ pageNumber: 1, text });
  }

  return {
    text,
    totalPages: pages.length || 1,
    pages,
  };
}

async function parsePptxFast(buffer: Buffer): Promise<ExtractedDocument> {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const slideEntries = zipEntries
      .filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.entryName.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

    const pages: ExtractedPage[] = [];

    for (let i = 0; i < slideEntries.length; i++) {
      const xml = slideEntries[i].getData().toString('utf-8');
      const textMatches: string[] = [];
      const tagRegex = /<a:t[^>]*>(.*?)<\/a:t>/g;
      let m;
      while ((m = tagRegex.exec(xml)) !== null) {
        if (m[1] && m[1].trim()) {
          textMatches.push(m[1].trim());
        }
      }
      const slideText = textMatches.join(' ');
      if (slideText) {
        pages.push({
          pageNumber: i + 1,
          text: slideText,
        });
      }
    }

    const fullText = pages.map((p) => `[Slide ${p.pageNumber}]: ${p.text}`).join('\n\n');

    return {
      text: fullText || 'No readable text extracted from slides',
      totalPages: Math.max(1, pages.length),
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: 'No text extracted' }],
    };
  } catch (err: any) {
    console.warn('PPTX zip parse error:', err?.message);
    return {
      text: 'Error reading presentation slides',
      totalPages: 1,
      pages: [{ pageNumber: 1, text: 'Error reading presentation slides' }],
    };
  }
}

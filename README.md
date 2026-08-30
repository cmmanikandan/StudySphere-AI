# 🧠 StudySphere AI — Your Personal AI Study Assistant

<div align="center">
  <img src="public/logo.jpeg" alt="StudySphere AI Logo" width="120" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(124, 58, 237, 0.3);" />
  
  <h3>Your study materials. Your personal AI tutor.</h3>
  <p>Transform PDFs, DOCX, and PPTX lecture slides into intelligent grounded conversations, high-yield summaries, and interactive self-assessment quiz arenas.</p>

  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC.svg)](https://tailwindcss.com/)
  [![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange.svg)](https://groq.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
</div>

---

## ✨ Features

- 💬 **AI Study Workspace (RAG Grounded Chat)**: Ask questions directly against your uploaded lecture slides, textbooks, and notes with source citations.
- 🎙️ **Voice-to-Text Dictation**: Ask study questions hands-free using real-time Web Speech API voice recognition.
- 📝 **AI Document Summarizer**: Generate Executive Briefs, Detailed Outlines, and Exam Cram Cheat Sheets from lengthy materials in seconds.
- 🏆 **AI Quiz Arena**: Test your exam readiness with multiple-choice, true/false, and conceptual questions with instant feedback and answer explanations.
- 📚 **Multi-Format Document Library**: Full parsing support for PDF, DOCX, and PPTX files with in-document preview and chunk indexing.
- 🌓 **Dual Theme Engine**: Deep Space OLED Dark Mode and Studio Minimalist Light Mode.
- 📱 **Mobile-First Responsive PWA**: Edge-to-edge mobile chat layout, swipeable drawer history, and bottom quick navigation.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, React Router v6
- **AI Engine**: Groq SDK (`llama-3.3-70b-versatile` & `llama-3.1-8b-instant`)
- **Backend & Database**: Supabase (PostgreSQL, Vector Storage, Realtime Database)
- **Document Processing**: `pdf-parse`, `mammoth`, `officeparser`

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/cmmanikandan/StudySphere-AI.git
cd StudySphere-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License
MIT License © 2026 StudySphere AI

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentLibraryPage } from './pages/DocumentLibraryPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { ChatWorkspacePage } from './pages/ChatWorkspacePage';
import { SummaryToolPage } from './pages/SummaryToolPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { QuizArenaPage } from './pages/QuizArenaPage';
import { ToolsPage } from './pages/ToolsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes inside App Shell */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/documents" element={<DocumentLibraryPage />} />
              <Route path="/upload" element={<DocumentUploadPage />} />
              <Route path="/chat" element={<ChatWorkspacePage />} />
              <Route path="/chat/:id" element={<ChatWorkspacePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/summaries" element={<SummaryToolPage />} />
              <Route path="/quizzes" element={<QuizGeneratorPage />} />
              <Route path="/quizzes/:id" element={<QuizArenaPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

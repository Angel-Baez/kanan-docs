import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Toaster } from './components/ui/Toaster.tsx';
import { DocumentListPage } from './pages/DocumentListPage.tsx';
import { DocumentEditorPage } from './pages/DocumentEditorPage.tsx';

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DocumentListPage />} />
            <Route path="/documents/:id" element={<DocumentEditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </ToastProvider>
  );
}

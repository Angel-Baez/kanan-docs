import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Toaster } from './components/ui/Toaster.tsx';
import { AppShell } from './components/shell/AppShell.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DocumentListPage } from './pages/DocumentListPage.tsx';
import { DocumentEditorPage } from './pages/DocumentEditorPage.tsx';
import { ClientProfilePage } from './pages/ClientProfilePage.tsx';
import { ClientListPage } from './pages/ClientListPage.tsx';
import { ProjectProfilePage } from './pages/ProjectProfilePage.tsx';
import { ProjectPipelinePage } from './pages/ProjectPipelinePage.tsx';
import { FinancePage } from './pages/FinancePage.tsx';
import { TasksPage } from './pages/TasksPage.tsx';

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Document editor: full-screen, outside the shell */}
            <Route path="/documents/:id" element={<DocumentEditorPage />} />

            {/* All other routes: inside the OS shell */}
            <Route element={<ShellLayout />}>
              <Route path="/"             element={<DashboardPage />} />
              <Route path="/projects"     element={<ProjectPipelinePage />} />
              <Route path="/projects/:id" element={<ProjectProfilePage />} />
              <Route path="/clients"      element={<ClientListPage />} />
              <Route path="/clients/:id"  element={<ClientProfilePage />} />
              <Route path="/documents"    element={<DocumentListPage />} />
              {/* Fase 3+ placeholders */}
              <Route path="/tasks"        element={<TasksPage />} />
              <Route path="/finance"      element={<FinancePage />} />
              <Route path="/team"         element={<ComingSoon label="Equipo" />} />
              <Route path="/settings"     element={<ComingSoon label="Configuración" />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </ToastProvider>
  );
}

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ padding: '64px 48px', fontFamily: "'IBM Plex Mono', monospace" }}>
      <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#4A4540', margin: '0 0 16px' }}>
        Próximamente
      </p>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, color: '#E8DFCF', lineHeight: 1.0, margin: 0 }}>
        {label}
      </h1>
    </div>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';

/** Wraps any routes that require authentication. Shows a loader while checking session. */
export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F0D0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#4A4540',
      }}>
        Cargando...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

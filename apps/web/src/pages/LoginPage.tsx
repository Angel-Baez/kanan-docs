import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const T = {
  bg:     '#0F0D0B',
  card:   '#161310',
  border: '#2A2520',
  text:   '#E8DFCF',
  muted:  '#7A7068',
  dim:    '#4A4540',
  accent: '#B95D34',
  error:  '#C4673A',
} as const;

const STYLES = `
@keyframes kFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.k-login { animation: kFadeUp 0.32s ease both; }
input:-webkit-autofill,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #161310 inset !important;
  -webkit-text-fill-color: #E8DFCF !important;
  caret-color: #E8DFCF;
}
`;

export function LoginPage() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#0F0D0B',
    border: `1px solid ${T.border}`,
    color: T.text,
    padding: '11px 14px',
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    outline: 'none',
    transition: 'border-color 0.12s',
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'IBM Plex Mono', monospace",
        padding: 24,
      }}>
        <div className="k-login" style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo / Brand */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: T.accent, margin: '0 0 10px' }}>
              Sistema Operativo
            </p>
            <h1 style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 42,
              fontWeight: 400,
              color: T.text,
              margin: 0,
              lineHeight: 1,
            }}>
              Kanan
            </h1>
          </div>

          {/* Card */}
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            padding: '32px 28px',
          }}>
            <p style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.dim, margin: '0 0 24px' }}>
              Iniciar sesión
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = T.border)}
                />
              </div>

              <div>
                <label style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6 }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = T.border)}
                />
              </div>

              {error && (
                <p style={{ fontSize: 10, color: T.error, margin: 0, padding: '8px 10px', background: `${T.error}15`, border: `1px solid ${T.error}30` }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  background: loading ? T.border : T.accent,
                  color: loading ? T.muted : '#fff',
                  border: 'none',
                  padding: '12px 0',
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.14s',
                  width: '100%',
                }}
              >
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>

          <p style={{ fontSize: 8, color: T.dim, textAlign: 'center', marginTop: 20 }}>
            Kanan Remodelaciones · Uso interno
          </p>
        </div>
      </div>
    </>
  );
}

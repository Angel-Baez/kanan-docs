import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ThemeMode } from '@kanan/shared';

interface ThemeCtx {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'o', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('o');

  const setTheme = (t: ThemeMode) => {
    document.body.classList.remove('m-base', 'm-t', 'm-o', 'm-plena');
    document.body.classList.add(`m-${t}`);
    setThemeState(t);
  };

  useEffect(() => { setTheme('o'); }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

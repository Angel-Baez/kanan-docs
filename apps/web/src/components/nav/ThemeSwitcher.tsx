import type { ThemeMode } from '@kanan/shared';
import { useTheme } from '../../context/ThemeContext.tsx';
import { KananIsotipo } from '../brand/KananIsotipo.tsx';
import { cn } from '../../lib/utils.ts';

interface ModeConfig {
  id: ThemeMode;
  name: string;
  desc: string;
}

const MODES: ModeConfig[] = [
  { id: 'base',  name: 'Base',   desc: 'Uso diario · silencioso'   },
  { id: 't',     name: 'Modo T', desc: 'Familia · residencial'      },
  { id: 'o',     name: 'Modo O', desc: 'Oficio · comercial'         },
  { id: 'plena', name: 'Plena',  desc: 'Institucional · bicolor'    },
];

interface ThemeSwitcherProps {
  onAfterChange?: (t: ThemeMode) => void;
}

export function ThemeSwitcher({ onAfterChange }: ThemeSwitcherProps = {}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="kanan-theme-bar flex border-b border-carbon/10 overflow-x-auto scrollbar-none" style={{ background: '#dcd5c8' }}>
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => { setTheme(m.id); onAfterChange?.(m.id); }}
          className={cn(
            'flex-1 min-w-[130px] flex items-center gap-2.5 px-3.5 py-3 text-left border-r border-carbon/8 last:border-r-0 transition-colors',
            theme === m.id
              ? 'bg-crema'
              : 'bg-transparent hover:bg-crema/50'
          )}
        >
          <KananIsotipo mode={m.id} size={14} className="flex-shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[11px] font-bold tracking-[0.14em] text-carbon uppercase">{m.name}</span>
            <span className="text-[10px] text-piedra tracking-[0.05em] mt-0.5 truncate">{m.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

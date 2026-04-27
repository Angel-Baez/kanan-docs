import { Link } from 'react-router-dom';
import { Printer, FileDown, CheckCircle, Loader2 } from 'lucide-react';
import { KananLogoNav } from '../ui/KananLogo.tsx';
import { cn } from '../../lib/utils.ts';
import type { SaveStatus } from '../../context/DocumentContext.tsx';

interface AppNavProps {
  saveStatus?: SaveStatus;
  showPrint?: boolean;
  onExportPdf?: () => void;
}

export function AppNav({ saveStatus, showPrint = false, onExportPdf }: AppNavProps) {
  return (
    <nav className="bg-carbon flex items-center gap-1 px-4 sticky top-0 z-10 min-h-[48px] overflow-x-auto scrollbar-none">
      <Link to="/" className="flex items-center gap-2 mr-4 flex-shrink-0" aria-label="Kanan inicio">
        <KananLogoNav />
        <span className="text-crema font-sans font-black text-sm tracking-[0.22em]">KANAN</span>
      </Link>

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {saveStatus && saveStatus !== 'idle' && (
          <span className={cn(
            'flex items-center gap-1 text-[10px] tracking-widest font-mono transition-colors',
            saveStatus === 'saving' ? 'text-piedra' : 'text-olivo'
          )}>
            {saveStatus === 'saving'
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Guardando</>
              : <><CheckCircle className="w-3 h-3" /> Guardado</>
            }
          </span>
        )}

        {showPrint && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-crema/70 hover:text-crema text-[10px] tracking-widest font-mono px-3 py-1.5 border border-transparent hover:border-crema/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        )}

        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 bg-olivo text-crema text-[10px] tracking-widest font-mono px-3 py-1.5 hover:bg-olivo-deep transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            PDF
          </button>
        )}
      </div>
    </nav>
  );
}

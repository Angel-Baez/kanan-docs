import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { cn } from '../../lib/utils.ts';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'border-olivo/40 text-olivo',
  error: 'border-terracota/40 text-terracota',
  info: 'border-piedra/40 text-carbon',
};

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-[320px]">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 bg-crema border px-4 py-3 shadow-md',
              'text-[11px] font-mono tracking-wide animate-in slide-in-from-right-4',
              STYLES[toast.type]
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 flex items-center gap-3 cursor-pointer ${
            t.type === 'error'
              ? 'bg-rose-900/90 text-rose-50 border-rose-700'
              : t.type === 'info'
              ? 'bg-slate-900/95 text-slate-100 border-slate-700'
              : 'bg-teal-900/95 text-teal-50 border-teal-700'
          }`}
        >
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

import { useToast } from '../context/ToastContext';

const styles = {
  info: 'bg-slate-900/90 border-slate-700',
  success: 'bg-emerald-500/20 border-emerald-400/40',
  error: 'bg-rose-500/20 border-rose-400/40'
};

export default function ToastList() {
  const { toasts } = useToast();

  return (
    <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm text-slate-100 shadow-lg ${styles[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

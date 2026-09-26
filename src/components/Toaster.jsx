import { Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { dismissToast, toastStore, useStore } from '../lib/store.js';

export default function Toaster() {
  const toasts = useStore(toastStore);
  return createPortal(
    <ol
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 grid justify-items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.li
            key={t.id}
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="panel pointer-events-auto flex w-full max-w-sm items-stretch overflow-hidden"
          >
            <span
              className={`grid w-10 flex-none place-items-center border-ink border-e-2 ${t.tone === 'error' ? 'bg-ink text-paper' : 'bg-blade'}`}
            >
              {t.tone === 'error' ? (
                <X className="size-4" />
              ) : (
                <Check className="size-4" />
              )}
            </span>
            <span className="grid min-w-0 flex-1 px-3 py-2 text-sm leading-snug">
              <span className="font-semibold">{t.title}</span>
              {t.body && <span className="truncate text-grey">{t.body}</span>}
            </span>
            <button
              type="button"
              aria-label="Dismiss"
              className="grid w-9 place-items-center text-grey hover-fine:text-ink"
              onClick={() => dismissToast(t.id)}
            >
              <X className="size-4" />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>,
    document.body,
  );
}

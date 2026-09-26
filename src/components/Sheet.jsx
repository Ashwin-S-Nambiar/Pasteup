import { X } from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Sheet({ open, onClose, title, meta, children }) {
  const panel = useRef(null);
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      back?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="panel relative flex max-h-[86dvh] w-full max-w-[44rem] flex-col rounded-b-none border-b-0 pb-[env(safe-area-inset-bottom)] outline-none md:mb-6 md:rounded-b-md md:border-b-2"
            initial={{ y: '100%' }}
            animate={{
              y: 0,
              transition: { duration: 0.34, ease: [0.32, 0.72, 0, 1] },
            }}
            exit={{
              y: '100%',
              transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
            }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
          >
            <div
              className="flex cursor-grab touch-none items-center gap-3 border-ink border-b-2 py-2.5 ps-4 pe-2.5 active:cursor-grabbing"
              onPointerDown={(e) => controls.start(e)}
            >
              <h2 className="font-bold text-[0.9375rem]">{title}</h2>
              {meta && <span className="text-grey text-sm">{meta}</span>}
              <button
                type="button"
                className="btn ring-hover press ms-auto w-9 h-9 px-0"
                aria-label="Close"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <X />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

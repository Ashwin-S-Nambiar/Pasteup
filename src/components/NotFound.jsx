import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Not found · Pasteup';
  }, []);

  return (
    <main className="on-mat grid h-full place-items-center p-4">
      <div className="grid w-full max-w-md justify-items-center gap-6 text-center">
        <div className="relative grid aspect-[4/3] w-full place-items-center rounded-md border-2 border-paper border-dashed">
          <span className="caption-type absolute inset-x-4 top-4 text-[clamp(1.75rem,8vw,2.75rem)]">
            This page
          </span>
          <span className="font-mono text-on-mat text-sm">404</span>
          <span className="caption-type absolute inset-x-4 bottom-4 text-[clamp(1.75rem,8vw,2.75rem)]">
            Got cut
          </span>
        </div>
        <a href="/" className="btn press ring-hover bg-blade">
          Back to Pasteup
        </a>
      </div>
    </main>
  );
}

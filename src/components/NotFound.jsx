import { useEffect } from 'react';
import SiteFooter from './SiteFooter.jsx';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Not found · Pasteup';
  }, []);

  return (
    <div className="mx-auto grid h-full max-w-[100rem] grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:gap-4 md:p-4 xl:px-5">
      <main className="on-mat grid place-items-center">
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
      <SiteFooter />
    </div>
  );
}

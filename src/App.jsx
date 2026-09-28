import { History, ImageUp, LayoutGrid, Volume2, VolumeOff } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Captions from './components/Captions.jsx';
import Kept from './components/Kept.jsx';
import Sheet from './components/Sheet.jsx';
import Stage from './components/Stage.jsx';
import Templates from './components/Templates.jsx';
import Toaster from './components/Toaster.jsx';
import {
  applyTemplate,
  editorStore,
  keptStore,
  loadTemplates,
  refreshKept,
  templateFromFile,
  templatesStore,
} from './lib/editor.js';
import { sfx, soundStore } from './lib/sound.js';
import { toast, useStore } from './lib/store.js';

const HOME_TITLE = 'Pasteup · Pick a meme, write the joke';

export default function App() {
  const { template } = useStore(editorStore);
  const templates = useStore(templatesStore);
  const kept = useStore(keptStore);
  const sound = useStore(soundStore);
  const [sheet, setSheet] = useState(null);
  const fileInput = useRef(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const [wanted, setWanted] = useState(() =>
    new URLSearchParams(location.search).get('t'),
  );

  useEffect(() => {
    loadTemplates();
    refreshKept();
  }, []);

  useEffect(() => {
    const id = wanted;
    if (!id || templates.status === 'idle' || templates.status === 'loading') {
      return;
    }
    setWanted(null);
    const found = templates.list.find((t) => t.id === id);
    if (found && editorStore.get().template.id !== id) applyTemplate(found);
  }, [templates, wanted]);

  useEffect(() => {
    document.title =
      template.kind === 'imgflip' && template.id !== '181913649'
        ? `${template.name} · Pasteup`
        : template.kind === 'upload'
          ? `Your image · Pasteup`
          : HOME_TITLE;
    if (wanted) return;
    const url = new URL(location.href);
    if (template.kind === 'imgflip') url.searchParams.set('t', template.id);
    else url.searchParams.delete('t');
    history.replaceState(null, '', url);
  }, [template, wanted]);

  const openFile = useCallback(async (file) => {
    try {
      const t = await templateFromFile(file);
      if (!t) {
        toast({
          title: 'Not an image',
          body: 'Pick a JPG, PNG, WebP or GIF.',
          tone: 'error',
        });
        return;
      }
      applyTemplate(t);
      sfx.pick();
      setSheet(null);
    } catch {
      toast({
        title: 'Couldn’t open that image',
        body: 'Try a different file.',
        tone: 'error',
      });
    }
  }, []);

  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files || [])].find((f) =>
        f.type.startsWith('image/'),
      );
      if (!file) return;
      e.preventDefault();
      openFile(file);
    };
    const onTap = (e) => {
      const el = e.target.closest?.('button, [role="button"], a');
      if (!el || el.closest('[data-sfx="none"]') || el.disabled) return;
      sfx.tap();
    };
    window.addEventListener('paste', onPaste);
    window.addEventListener('pointerdown', onTap);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('pointerdown', onTap);
    };
  }, [openFile]);

  const pick = (t) => {
    const keepText = editorStore.get().captions.some((c) => c.text);
    applyTemplate(t, { keepText });
    sfx.pick();
    setSheet(null);
  };

  const upload = () => fileInput.current?.click();

  return (
    <MotionConfig reducedMotion="user">
      <div className="shell mx-auto grid h-full max-w-[100rem] gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:gap-4 md:p-4 xl:px-5">
        <header className="on-mat flex items-center gap-2 [grid-area:top]">
          <h1 className="caption-type me-auto text-[1.75rem] md:text-[2.125rem]">
            Pasteup
          </h1>
          <button
            type="button"
            className="btn press ring-hover w-10 px-0 sm:w-auto sm:px-3.5 xl:hidden"
            onClick={() => setSheet('templates')}
          >
            <LayoutGrid />
            <span className="max-sm:sr-only">Templates</span>
          </button>
          <button
            type="button"
            className="btn press ring-hover w-10 px-0 sm:w-auto sm:px-3.5"
            onClick={upload}
          >
            <ImageUp />
            <span className="max-sm:sr-only">Your image</span>
          </button>
          <button
            type="button"
            className="btn press ring-hover w-10 px-0 sm:w-auto sm:px-3.5"
            onClick={() => setSheet('kept')}
          >
            <History />
            <span className="max-sm:sr-only">Made here</span>
            {kept.list.length > 0 && (
              <span className="font-mono text-grey text-xs max-sm:hidden">
                {kept.list.length}
              </span>
            )}
          </button>
          <button
            type="button"
            data-sfx="none"
            className="btn press ring-hover w-10 px-0"
            aria-label={sound ? 'Mute sounds' : 'Turn sounds on'}
            data-tip={sound ? 'Mute' : 'Sound on'}
            aria-pressed={!sound}
            onClick={() => {
              soundStore.set(!sound);
              if (!sound) setTimeout(() => sfx.tap(), 0);
            }}
          >
            {sound ? <Volume2 /> : <VolumeOff />}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) openFile(file);
            }}
          />
        </header>

        <aside
          aria-label="Templates"
          className="panel hidden min-h-0 flex-col overflow-hidden [grid-area:tray] xl:flex"
        >
          <Templates onPick={pick} onUpload={upload} />
        </aside>

        <Stage onFile={openFile} hidden={!!wanted} />
        <Captions hidden={!!wanted} />

        <footer className="on-mat flex justify-center gap-4 text-on-mat text-xs [grid-area:foot] md:justify-between">
          <span>
            Templates from{' '}
            <a
              className="text-paper underline underline-offset-2"
              href="https://imgflip.com/memetemplates"
              target="_blank"
              rel="noreferrer"
            >
              Imgflip
            </a>
          </span>
          <span>
            Made by{' '}
            <a
              className="text-paper underline underline-offset-2"
              href="https://ashwin.co.in"
              target="_blank"
              rel="noreferrer"
            >
              Ashwin
            </a>
          </span>
        </footer>
      </div>

      <Sheet
        open={sheet === 'templates'}
        onClose={closeSheet}
        title="Templates"
      >
        <div className="flex h-[80dvh] min-h-0 flex-col">
          <Templates onPick={pick} onUpload={upload} />
        </div>
      </Sheet>
      <Sheet
        open={sheet === 'kept'}
        onClose={closeSheet}
        title="Made here"
        meta={kept.list.length ? `${kept.list.length}` : null}
      >
        <Kept onPicked={closeSheet} />
      </Sheet>
      <Toaster />
    </MotionConfig>
  );
}

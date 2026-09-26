import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { forget, forgetAll, keptStore, reopen } from '../lib/editor.js';
import { sfx } from '../lib/sound.js';
import { useStore } from '../lib/store.js';

function useThumbs(list) {
  const [urls, setUrls] = useState(() => new Map());
  useEffect(() => {
    const next = new Map(list.map((k) => [k.id, URL.createObjectURL(k.thumb)]));
    setUrls(next);
    return () => {
      for (const u of next.values()) URL.revokeObjectURL(u);
    };
  }, [list]);
  return urls;
}

const when = (at) => {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

export default function Kept({ onPicked }) {
  const { loaded, list } = useStore(keptStore);
  const thumbs = useThumbs(list);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  if (loaded && !list.length) {
    return (
      <div className="grid gap-1 p-4 text-sm">
        <p className="font-semibold">Nothing here yet.</p>
        <p className="text-grey">
          Memes you save, copy or share land here so you can edit them again.
          They stay on this device.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-2.5 gap-y-3 overflow-y-auto p-3">
        {list.map((k) => (
          <li key={k.id} className="group relative">
            <button
              type="button"
              className="press grid w-full gap-1.5 text-start"
              onClick={() => {
                reopen(k);
                sfx.pick();
                onPicked();
              }}
            >
              <span className="ring-hover block overflow-hidden rounded border-2 border-ink bg-rule">
                <img
                  src={thumbs.get(k.id) || undefined}
                  alt=""
                  className="block aspect-square w-full object-contain"
                />
              </span>
              <span className="grid text-xs leading-tight">
                <span className="truncate font-semibold">
                  {k.captions.find((c) => c.text)?.text || k.template.name}
                </span>
                <span className="text-grey">{when(k.at)}</span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Remove from this list"
              className="press absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-md border-2 border-ink bg-paper transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => forget(k.id)}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 border-ink border-t-2 px-3.5 py-2.5 text-grey text-xs">
        <span>Kept on this device only.</span>
        <button
          type="button"
          className={`btn press ring-hover ms-auto h-9 ${confirm ? 'bg-ink text-paper' : ''}`}
          onClick={() => (confirm ? forgetAll() : setConfirm(true))}
        >
          <Trash2 /> {confirm ? 'Tap again to clear' : 'Clear all'}
        </button>
      </div>
    </>
  );
}

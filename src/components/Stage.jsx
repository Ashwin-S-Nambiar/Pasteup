import { ImageOff, LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  editorStore,
  loadImage,
  nudge,
  selectCaption,
  updateCaption,
} from '../lib/editor.js';
import { draw, fontsReady, layout } from '../lib/meme.js';
import { sfx } from '../lib/sound.js';
import { useStore } from '../lib/store.js';

const focusField = (id) => document.getElementById(`field-${id}`)?.focus();

export default function Stage({ onFile, hidden }) {
  const meme = useStore(editorStore);
  const canvas = useRef(null);
  const frame = useRef(null);
  const [fonts, setFonts] = useState(0);
  const [loaded, setLoaded] = useState({ url: null, img: null });
  const [failed, setFailed] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [dropping, setDropping] = useState(false);
  const url = meme.template.url;

  useEffect(() => {
    fontsReady().then(() => setFonts((n) => n + 1));
  }, []);

  useEffect(() => {
    let live = true;
    setFailed(null);
    loadImage(url, attempt)
      .then((img) => live && setLoaded({ url, img }))
      .catch(() => live && setFailed(url));
    return () => {
      live = false;
    };
  }, [url, attempt]);

  const lay = useMemo(() => {
    void fonts;
    return layout(meme);
  }, [meme, fonts]);

  const ready = loaded.url === url;

  useLayoutEffect(() => {
    if (!ready || !canvas.current) return;
    draw(canvas.current.getContext('2d'), loaded.img, meme, lay);
  }, [ready, loaded, meme, lay]);

  const onDrop = (e) => {
    e.preventDefault();
    setDropping(false);
    const file = [...e.dataTransfer.files].find((f) =>
      f.type.startsWith('image/'),
    );
    if (file) onFile(file);
  };

  const pct = (v, total) => `${(v / total) * 100}%`;

  return (
    <section
      aria-label="Meme"
      className="stage on-mat relative grid min-h-0 place-items-center [grid-area:stage]"
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes('Files')) {
          e.preventDefault();
          setDropping(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDropping(false);
      }}
      onDrop={onDrop}
    >
      <div
        ref={frame}
        hidden={hidden}
        className="frame relative"
        style={{ '--ar': lay.W / lay.H }}
      >
        <canvas
          ref={canvas}
          width={lay.W}
          height={lay.H}
          role="img"
          aria-label={`${meme.template.name}${
            meme.captions.some((c) => c.text)
              ? `: ${meme.captions
                  .map((c) => c.text)
                  .filter(Boolean)
                  .join(' / ')}`
              : ''
          }`}
          className={`block size-full rounded-[3px] border-2 border-ink bg-paper transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
        {!ready && !failed && (
          <div className="shimmer absolute inset-0 grid place-items-center rounded-[3px] border-2 border-ink">
            <LoaderCircle className="size-6 animate-spin text-grey" />
          </div>
        )}
        {failed === url && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 rounded-[3px] border-2 border-ink bg-paper p-4 text-center text-sm">
            <ImageOff className="size-6" />
            <p>This image didn’t load.</p>
            <button
              type="button"
              className="btn ring-hover press"
              onClick={() => setAttempt((n) => n + 1)}
            >
              <RotateCcw /> Try again
            </button>
          </div>
        )}
        {ready && <Overlay meme={meme} lay={lay} frame={frame} pct={pct} />}
        {dropping && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-[3px] border-2 border-blade border-dashed bg-ink/60">
            <span className="caption-type text-2xl">Drop to use it</span>
          </div>
        )}
      </div>
    </section>
  );
}

function Overlay({ meme, lay, frame, pct }) {
  const { W, H, imgH, barH, bar, placed } = lay;
  const drag = useRef(null);

  const start = (e, p, mode) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = frame.current.getBoundingClientRect();
    drag.current = {
      id: p.caption.id,
      mode,
      x0: e.clientX,
      y0: e.clientY,
      c: p.caption,
      rect,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    selectCaption(p.caption.id);
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    if (d.mode === 'move') {
      const imgPx = (d.rect.height * imgH) / H;
      updateCaption(d.id, {
        x: Math.min(1, Math.max(0, d.c.x + dx / d.rect.width)),
        y: Math.min(1, Math.max(0, d.c.y + dy / imgPx)),
      });
    } else {
      const sign = d.mode === 'right' ? 1 : -1;
      updateCaption(d.id, {
        w: Math.min(1, Math.max(0.12, d.c.w + (2 * sign * dx) / d.rect.width)),
      });
    }
  };

  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) sfx.drop();
  };

  const onKey = (e, id) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const keys = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (keys[e.key]) {
      e.preventDefault();
      nudge(id, ...keys[e.key]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      focusField(id);
    }
  };

  return (
    <div className="absolute inset-[2px] select-none">
      {bar && (
        <button
          type="button"
          aria-label={`Caption 1, top bar${bar.caption.text ? `: ${bar.caption.text}` : ''}`}
          className={`absolute inset-x-0 top-0 rounded-t-[3px] outline-offset-[-4px] ${meme.selected === bar.caption.id ? 'outline-2 outline-blade outline-dashed' : ''}`}
          style={{ height: pct(barH, H) }}
          onClick={() => {
            selectCaption(bar.caption.id);
            focusField(bar.caption.id);
          }}
        >
          {!bar.caption.text && (
            <span className="absolute start-[4.5%] top-1/2 -translate-y-1/2 text-grey text-sm">
              1
            </span>
          )}
        </button>
      )}
      {placed.map((p) => {
        const selected = meme.selected === p.caption.id;
        const empty = !p.caption.text;
        return (
          <button
            type="button"
            key={p.caption.id}
            aria-label={`Caption ${p.index + 1}${empty ? ', empty' : `: ${p.caption.text}`}. Drag or use arrow keys to move it.`}
            aria-pressed={selected}
            className={`group absolute cursor-grab touch-none rounded-[3px] outline-offset-4 before:absolute before:-inset-2 before:content-[''] active:cursor-grabbing focus-visible:outline-blade ${selected ? 'outline-2 outline-blade outline-dashed' : empty ? 'outline-2 outline-paper/80 outline-dashed' : 'hover-fine:outline-2 hover-fine:outline-paper/70 hover-fine:outline-dashed'}`}
            style={{
              left: pct(p.box.x, W),
              top: pct(p.box.y, H),
              width: pct(p.box.w, W),
              height: pct(p.box.h, H),
            }}
            onPointerDown={(e) => start(e, p, 'move')}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onDoubleClick={() => focusField(p.caption.id)}
            onKeyDown={(e) => onKey(e, p.caption.id)}
          >
            {empty && (
              <span className="caption-type pointer-events-none absolute inset-0 grid place-items-center text-lg opacity-80">
                {p.index + 1}
              </span>
            )}
            {selected &&
              ['left', 'right'].map((side) => (
                <span
                  key={side}
                  aria-hidden="true"
                  className={`absolute top-1/2 z-10 grid h-8 w-6 -translate-y-1/2 cursor-ew-resize place-items-center ${side === 'left' ? '-left-4' : '-right-4'}`}
                  onPointerDown={(e) => start(e, p, side)}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                >
                  <span className="h-5 w-2.5 rounded-sm border-2 border-ink bg-blade" />
                </span>
              ))}
          </button>
        );
      })}
    </div>
  );
}

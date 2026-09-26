import { Copy, Download, Plus, Share, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  canCopy,
  canShare,
  copyMeme,
  saveMeme,
  shareMeme,
} from '../lib/actions.js';
import {
  addCaption,
  clampSize,
  editorStore,
  removeCaption,
  selectCaption,
  setStyle,
  updateCaption,
} from '../lib/editor.js';
import {
  COLORS,
  MAX_CAPTIONS,
  SIZE_MAX,
  SIZE_MIN,
  STYLES,
} from '../lib/meme.js';
import { useStore } from '../lib/store.js';

const ACTION_COLS =
  canCopy && canShare
    ? 'grid-cols-3 md:grid-cols-2'
    : canCopy || canShare
      ? 'grid-cols-2'
      : 'grid-cols-1';

const PREVIEW = {
  classic: <span className="caption-type text-lg leading-none">Aa</span>,
  subtitle: (
    <span className="self-end pb-1.5 font-bold text-[0.8125rem] text-paper [paint-order:stroke_fill] [-webkit-text-stroke:3px_var(--color-ink)]">
      Aa
    </span>
  ),
  bar: (
    <span className="grid size-full grid-rows-[auto_1fr]">
      <span className="bg-paper px-1.5 py-1 text-start font-medium text-[0.6875rem] leading-none">
        Aa
      </span>
      <span />
    </span>
  ),
};

export default function Captions({ hidden }) {
  const { template, captions, style, selected } = useStore(editorStore);
  const current = captions.find((c) => c.id === selected) ?? captions[0];
  const currentIndex = captions.indexOf(current);
  const full = captions.length >= MAX_CAPTIONS;

  const add = () => {
    const id = addCaption();
    if (id)
      requestAnimationFrame(() =>
        document.getElementById(`field-${id}`)?.focus(),
      );
  };

  return (
    <aside
      aria-label="Captions"
      className="panel flex min-h-0 flex-col overflow-hidden [grid-area:side]"
    >
      <div className="hidden items-baseline gap-3 border-ink border-b-2 px-3.5 py-3 md:flex">
        <h2 className="font-bold text-[0.8125rem]">Captions</h2>
        <span className="ms-auto truncate text-grey text-xs">
          {hidden ? '' : template.name}
        </span>
      </div>

      <div
        className={`grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto p-2.5 md:p-3.5 ${hidden ? 'invisible' : ''}`}
      >
        <ol key={template.id} className="grid gap-2">
          <AnimatePresence initial={false}>
            {captions.map((c, i) => (
              <motion.li
                key={c.id}
                layout="position"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-1.5"
              >
                <span
                  aria-hidden="true"
                  className="text-center font-mono text-grey text-xs"
                >
                  {i + 1}
                </span>
                <label className="contents">
                  <span className="sr-only">
                    Caption {i + 1}
                    {style === 'bar' && i === 0 ? ', top bar' : ''}
                  </span>
                  <input
                    id={`field-${c.id}`}
                    className={`field ${c.id === current?.id ? 'shadow-[inset_0_0_0_2px_var(--color-blade)]' : ''}`}
                    value={c.text}
                    placeholder={
                      style === 'bar' && i === 0
                        ? 'Top bar text'
                        : i === 0
                          ? 'Write the joke'
                          : `Caption ${i + 1}`
                    }
                    autoComplete="off"
                    enterKeyHint="next"
                    onFocus={() => selectCaption(c.id)}
                    onChange={(e) =>
                      updateCaption(c.id, { text: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      const next = captions[i + 1];
                      if (next)
                        document.getElementById(`field-${next.id}`)?.focus();
                      else e.currentTarget.blur();
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md text-grey transition-colors hover-fine:bg-ink/5 hover-fine:text-ink disabled:opacity-30"
                  aria-label={`Remove caption ${i + 1}`}
                  disabled={captions.length === 1}
                  onClick={() => removeCaption(c.id)}
                >
                  <X className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>

        <button
          type="button"
          className="press h-9 rounded-md border-2 border-ink border-dashed transition-colors hover-fine:bg-ink/5 font-semibold text-[0.8125rem] disabled:opacity-40"
          onClick={add}
          disabled={full}
        >
          <Plus className="-mt-0.5 me-1 inline size-4" />
          {full ? `${MAX_CAPTIONS} is the limit` : 'Add a caption'}
        </button>

        <fieldset className="mt-1 grid gap-1.5">
          <legend className="mb-1.5 font-semibold text-grey text-xs">
            Style
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(STYLES).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                aria-pressed={style === key}
                className="group press grid gap-1 text-center"
                onClick={() => setStyle(key)}
              >
                <span className="ring-hover grid h-11 place-items-center overflow-hidden rounded-md border-2 border-ink bg-[#8a8a84] group-aria-pressed:after:opacity-100 group-aria-pressed:after:shadow-[inset_0_0_0_2px_var(--color-ink),inset_0_0_0_5px_var(--color-blade)]">
                  {PREVIEW[key]}
                </span>
                <span className="text-grey text-xs group-aria-pressed:font-semibold group-aria-pressed:text-ink">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {current && (
          <fieldset className="mt-1 grid gap-1.5">
            <legend className="mb-1.5 font-semibold text-grey text-xs">
              Caption {currentIndex + 1}: size and colour
            </legend>
            <div className="flex items-center gap-3">
              <label className="flex min-w-0 flex-1">
                <span className="sr-only">Text size</span>
                <input
                  type="range"
                  className="slider w-full"
                  min={SIZE_MIN}
                  max={SIZE_MAX}
                  step={0.002}
                  value={current.size}
                  onChange={(e) =>
                    updateCaption(current.id, {
                      size: clampSize(Number(e.target.value)),
                    })
                  }
                />
              </label>
              <div className="flex gap-1.5">
                {Object.entries(COLORS).map(([key, c]) => (
                  <label key={key} className="press relative">
                    <input
                      type="radio"
                      name="caption-colour"
                      className="peer sr-only"
                      checked={current.color === key}
                      disabled={style === 'bar' && currentIndex === 0}
                      onChange={() => updateCaption(current.id, { color: key })}
                    />
                    <span className="sr-only">{c.label}</span>
                    <span
                      aria-hidden="true"
                      className="block size-8 cursor-pointer rounded-full border-2 border-ink peer-checked:shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-ink peer-focus-visible:outline-offset-4 peer-disabled:cursor-default peer-disabled:opacity-30"
                      style={{ background: c.fill }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
        )}
      </div>

      <div
        className={`grid gap-2 border-ink border-t-2 p-2.5 md:p-3.5 ${ACTION_COLS}`}
      >
        <button
          type="button"
          className={`btn press ring-hover h-11 bg-blade text-[0.9375rem] ${canCopy && canShare ? 'md:col-span-2 md:h-12' : ''}`}
          onClick={saveMeme}
        >
          <Download /> Save
        </button>
        {canCopy && (
          <button
            type="button"
            className="btn press ring-hover h-11"
            onClick={copyMeme}
          >
            <Copy /> Copy
          </button>
        )}
        {canShare && (
          <button
            type="button"
            className="btn press ring-hover h-11"
            onClick={shareMeme}
          >
            <Share /> Share
          </button>
        )}
      </div>
    </aside>
  );
}

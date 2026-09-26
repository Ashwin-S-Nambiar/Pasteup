import { RotateCcw, Search, Shuffle, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { editorStore, loadTemplates, templatesStore } from '../lib/editor.js';
import { useStore } from '../lib/store.js';

const FILTERS = [
  ['all', 'Any'],
  ['2', '2'],
  ['3', '3'],
  ['4', '4+'],
];

const SKELETON = Array.from({ length: 12 }, (_, i) => `s${i}`);

const matches = (filter, boxes) =>
  filter === 'all' || (filter === '4' ? boxes >= 4 : boxes === Number(filter));

export default function Templates({ onPick, onUpload, scrollClass = '' }) {
  const { status, list } = useStore(templatesStore);
  const current = useStore(editorStore).template.id;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const q = useDeferredValue(query.trim().toLowerCase());

  const shown = useMemo(
    () =>
      list.filter(
        (t) => matches(filter, t.boxes) && t.name.toLowerCase().includes(q),
      ),
    [list, filter, q],
  );

  const shuffle = () => {
    const pool = shown.length > 1 ? shown : list;
    const others = pool.filter((t) => t.id !== current);
    const pick = others[Math.floor(Math.random() * others.length)];
    if (pick) onPick(pick);
  };

  return (
    <>
      <div className="grid gap-2.5 border-ink border-b-2 p-3">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search templates</span>
            <Search className="-translate-y-1/2 pointer-events-none absolute start-3 top-1/2 size-4 text-grey" />
            <input
              type="search"
              className="field ps-9 pe-9 [&::-webkit-search-cancel-button]:hidden"
              placeholder="Search templates"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                className="-translate-y-1/2 absolute end-1.5 top-1/2 grid size-7 place-items-center rounded text-grey hover-fine:text-ink"
                onClick={() => setQuery('')}
              >
                <X className="size-4" />
              </button>
            )}
          </label>
          <button
            type="button"
            className="btn ring-hover press w-10 px-0"
            aria-label="Random template"
            onClick={shuffle}
            disabled={!list.length}
          >
            <Shuffle />
          </button>
        </div>
        <fieldset className="flex items-center gap-2.5">
          <legend className="sr-only">Caption boxes</legend>
          <span aria-hidden="true" className="text-grey text-xs font-semibold">
            Boxes
          </span>
          <div className="flex flex-1 overflow-hidden rounded-md border-2 border-ink">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                className="h-8 flex-1 transition-colors hover-fine:bg-ink/5 border-ink border-e-2 font-semibold text-[0.8125rem] last:border-e-0 aria-pressed:bg-ink aria-pressed:text-paper"
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto p-3 ${scrollClass}`}>
        {status === 'error' ? (
          <div className="grid justify-items-start gap-3 p-1 text-sm">
            <p>
              Imgflip didn’t answer, so there are no templates right now. Try
              again, or caption your own image.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn ring-hover press"
                onClick={loadTemplates}
              >
                <RotateCcw /> Try again
              </button>
              <button
                type="button"
                className="btn ring-hover press"
                onClick={onUpload}
              >
                Use your image
              </button>
            </div>
          </div>
        ) : status !== 'ready' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-x-2.5 gap-y-3">
            {SKELETON.map((k) => (
              <div key={k} className="grid gap-1.5">
                <div className="shimmer aspect-square rounded border-2 border-rule" />
                <div className="shimmer h-3 w-3/4 rounded-sm" />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="grid justify-items-start gap-3 p-1 text-sm">
            <p>
              No template matches “{query.trim()}”
              {filter !== 'all' && ' with that many boxes'}. Try one word, like
              “drake” or “cat”.
            </p>
            <button
              type="button"
              className="btn ring-hover press"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              Show all
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-x-2.5 gap-y-3">
            {shown.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="group press grid w-full gap-1.5 text-start"
                  aria-current={t.id === current ? 'true' : undefined}
                  onClick={() => onPick(t)}
                >
                  <span className="ring-hover relative block aspect-square overflow-hidden rounded border-2 border-ink bg-rule group-aria-current:after:opacity-100 group-aria-current:after:shadow-[inset_0_0_0_2px_var(--color-ink),inset_0_0_0_6px_var(--color-blade)]">
                    <img
                      src={t.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                      style={{ animation: 'fade-in 200ms var(--ease-out)' }}
                    />
                    <span className="absolute end-1 bottom-1 rounded-[3px] border-[1.5px] border-ink bg-paper px-1 font-mono text-[0.625rem] leading-4">
                      {t.boxes}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-grey text-xs leading-tight group-aria-current:text-ink group-aria-current:font-semibold">
                    {t.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

import { clearKept, deleteKept, listKept, putKept } from './db.js';
import {
  defaultCaptions,
  draw,
  layout,
  MAX_CAPTIONS,
  makeCaption,
  SIZE_MAX,
  SIZE_MIN,
  slug,
} from './meme.js';
import { createStore } from './store.js';

export const DRAKE = {
  id: '181913649',
  name: 'Drake Hotline Bling',
  url: 'https://i.imgflip.com/30b1gx.jpg',
  width: 1200,
  height: 1200,
  boxes: 2,
  kind: 'imgflip',
};

function readDraft() {
  try {
    const d = JSON.parse(localStorage.getItem('pu:draft'));
    if (d?.template?.url && Array.isArray(d.captions)) return d;
  } catch {}
  return null;
}

function fresh(template, style = 'classic') {
  const captions = defaultCaptions(template);
  return {
    template,
    captions,
    style,
    selected: captions[0]?.id ?? null,
    keptId: null,
  };
}

const draft = readDraft();
export const editorStore = createStore(
  draft
    ? {
        ...draft,
        selected: draft.captions[0]?.id ?? null,
        keptId: draft.keptId ?? null,
      }
    : fresh(DRAKE),
);

let draftTimer;
editorStore.subscribe(() => {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const { template, captions, style, keptId } = editorStore.get();
    if (template.kind !== 'imgflip') return;
    try {
      localStorage.setItem(
        'pu:draft',
        JSON.stringify({ template, captions, style, keptId }),
      );
    } catch {}
  }, 300);
});

const patch = (fn) => editorStore.set((s) => ({ ...s, ...fn(s) }));

export function applyTemplate(template, { keepText = false } = {}) {
  editorStore.set((s) => {
    const next = fresh(template, s.style === 'bar' ? 'bar' : s.style);
    if (keepText) {
      next.captions.forEach((c, i) => {
        if (s.captions[i]) c.text = s.captions[i].text;
      });
    }
    return next;
  });
}

export function updateCaption(id, changes) {
  patch((s) => ({
    captions: s.captions.map((c) => (c.id === id ? { ...c, ...changes } : c)),
  }));
}

export const selectCaption = (id) => patch(() => ({ selected: id }));

export function addCaption() {
  const { captions } = editorStore.get();
  if (captions.length >= MAX_CAPTIONS) return null;
  const c = makeCaption(0.5, 0.5, 0.8, 0.07);
  patch((s) => ({ captions: [...s.captions, c], selected: c.id }));
  return c.id;
}

export function removeCaption(id) {
  patch((s) => {
    const i = s.captions.findIndex((c) => c.id === id);
    const captions = s.captions.filter((c) => c.id !== id);
    const selected =
      s.selected === id
        ? (captions[Math.min(i, captions.length - 1)]?.id ?? null)
        : s.selected;
    return { captions, selected };
  });
}

export const setStyle = (style) => patch(() => ({ style }));

export function nudge(id, dx, dy) {
  const c = editorStore.get().captions.find((x) => x.id === id);
  if (!c) return;
  updateCaption(id, {
    x: Math.min(1, Math.max(0, c.x + dx)),
    y: Math.min(1, Math.max(0, c.y + dy)),
  });
}

export const clampSize = (v) => Math.min(SIZE_MAX, Math.max(SIZE_MIN, v));

export const templatesStore = createStore({ status: 'idle', list: [] });

export async function loadTemplates() {
  if (templatesStore.get().status === 'loading') return;
  templatesStore.set((s) => ({ ...s, status: 'loading' }));
  try {
    const res = await fetch('https://api.imgflip.com/get_memes');
    const json = await res.json();
    if (!json.success) throw new Error('Imgflip said no');
    const list = json.data.memes.map((m) => ({
      id: String(m.id),
      name: m.name,
      url: m.url.replace(/^http:/, 'https:'),
      width: m.width,
      height: m.height,
      boxes: m.box_count,
      kind: 'imgflip',
    }));
    templatesStore.set({ status: 'ready', list });
  } catch {
    templatesStore.set((s) => ({ ...s, status: 'error' }));
  }
}

const images = new Map();
export function loadImage(url, attempt = 0) {
  if (attempt && images.has(url)) images.delete(url);
  if (!images.has(url)) {
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => {
        images.delete(url);
        reject(new Error('image failed'));
      };
      img.src = url;
    });
    images.set(url, p);
  }
  return images.get(url);
}

export async function templateFromFile(file) {
  if (!file?.type.startsWith('image/')) return null;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  return {
    id: `upload-${Date.now()}`,
    name: file.name?.replace(/\.[^.]+$/, '') || 'Your image',
    url,
    width: img.naturalWidth,
    height: img.naturalHeight,
    boxes: 2,
    kind: 'upload',
    blob: file,
    png: file.type === 'image/png',
  };
}

async function renderCanvas() {
  const meme = editorStore.get();
  const image = await loadImage(meme.template.url);
  const canvas = document.createElement('canvas');
  draw(canvas.getContext('2d'), image, meme, layout(meme));
  return canvas;
}

const toBlob = (canvas, type, q) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), type, q),
  );

export async function exportMeme(forClipboard = false) {
  const canvas = await renderCanvas();
  const { template } = editorStore.get();
  const png =
    forClipboard || template.png || /\.png($|\?)/.test(template.url || '');
  const blob = await toBlob(
    canvas,
    png ? 'image/png' : 'image/jpeg',
    png ? undefined : 0.92,
  );
  const name = `${slug(template.name)}.${png ? 'png' : 'jpg'}`;
  keep(canvas);
  return { blob, name };
}

export const keptStore = createStore({ loaded: false, list: [] });

export async function refreshKept() {
  try {
    const list = await listKept();
    keptStore.set({ loaded: true, list });
  } catch {
    keptStore.set({ loaded: true, list: [] });
  }
}

async function keep(canvas) {
  const s = editorStore.get();
  const scale = Math.min(1, 360 / canvas.width);
  const thumb = document.createElement('canvas');
  thumb.width = Math.round(canvas.width * scale);
  thumb.height = Math.round(canvas.height * scale);
  thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
  const id = s.keptId || `k${Date.now().toString(36)}`;
  if (!s.keptId) patch(() => ({ keptId: id }));
  const { url, ...template } = s.template;
  try {
    await putKept({
      id,
      at: Date.now(),
      template: template.kind === 'upload' ? template : { ...template, url },
      captions: s.captions,
      style: s.style,
      thumb: await toBlob(thumb, 'image/jpeg', 0.8),
    });
    const list = await listKept();
    for (const old of list.slice(40)) await deleteKept(old.id);
    await refreshKept();
  } catch {}
}

export function reopen(item) {
  const template =
    item.template.kind === 'upload'
      ? { ...item.template, url: URL.createObjectURL(item.template.blob) }
      : item.template;
  editorStore.set({
    template,
    captions: item.captions,
    style: item.style,
    selected: item.captions[0]?.id ?? null,
    keptId: item.id,
  });
}

export async function forget(id) {
  await deleteKept(id);
  if (editorStore.get().keptId === id) patch(() => ({ keptId: null }));
  await refreshKept();
}

export async function forgetAll() {
  await clearKept();
  patch(() => ({ keptId: null }));
  await refreshKept();
}

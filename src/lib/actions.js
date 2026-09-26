import { exportMeme } from './editor.js';
import { sfx } from './sound.js';
import { haptic, toast } from './store.js';

export const canCopy =
  typeof window !== 'undefined' &&
  'ClipboardItem' in window &&
  !!navigator.clipboard?.write;

export const canShare = (() => {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File([''], 'a.png', { type: 'image/png' })],
    });
  } catch {
    return false;
  }
})();

export async function saveMeme() {
  try {
    const { blob, name } = await exportMeme();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    sfx.snip();
    haptic(12);
    toast({ title: 'Saved', body: name, tone: 'done' });
  } catch {
    failed('Not saved', 'The image did not load. Try again in a moment.');
  }
}

export async function copyMeme() {
  try {
    const item = new ClipboardItem({
      'image/png': exportMeme(true).then((r) => r.blob),
    });
    await navigator.clipboard.write([item]);
    sfx.snip();
    haptic(12);
    toast({ title: 'Copied', body: 'Paste it into any chat.', tone: 'done' });
  } catch {
    failed('Not copied', 'Your browser blocked it. Save it instead.');
  }
}

export async function shareMeme() {
  try {
    const { blob, name } = await exportMeme();
    const file = new File([blob], name, { type: blob.type });
    await navigator.share({ files: [file] });
    sfx.snip();
  } catch (err) {
    if (err?.name === 'AbortError') return;
    failed('Not shared', 'Save it and send it from your photos.');
  }
}

function failed(title, body) {
  sfx.error();
  toast({ title, body, tone: 'error' });
}

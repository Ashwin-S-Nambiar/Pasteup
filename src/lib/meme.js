import { PRESETS } from './presets.js';

export const COLORS = {
  white: { fill: '#ffffff', stroke: '#0b0b0b', label: 'White' },
  yellow: { fill: '#ffe14d', stroke: '#0b0b0b', label: 'Yellow' },
  black: { fill: '#0b0b0b', stroke: '#ffffff', label: 'Black' },
};

export const STYLES = {
  classic: { label: 'Classic' },
  subtitle: { label: 'Subtitle' },
  bar: { label: 'Top bar' },
};

export const MAX_CAPTIONS = 10;
export const SIZE_MIN = 0.03;
export const SIZE_MAX = 0.16;

const DISPLAY = '"Anton", Impact, sans-serif';
const TEXT = '"Schibsted Grotesk", Arial, sans-serif';

let nextId = 1;
export const captionId = () => `c${Date.now().toString(36)}${nextId++}`;

export function makeCaption(x, y, w, size) {
  return { id: captionId(), text: '', x, y, w, size, color: 'white' };
}

function defaultSize(w) {
  return Math.min(0.1, Math.max(0.045, w * 0.16));
}

export function defaultCaptions(template) {
  const preset = PRESETS[template.id];
  if (preset) {
    return preset.map(([x, y, w]) => makeCaption(x, y, w, defaultSize(w)));
  }
  const n = Math.max(1, template.boxes || 2);
  if (n <= 2) {
    return [
      makeCaption(0.5, 0.1, 0.92, 0.1),
      makeCaption(0.5, 0.9, 0.92, 0.1),
    ].slice(0, n);
  }
  return Array.from({ length: n }, (_, i) =>
    makeCaption(0.5, (i + 0.5) / n, 0.8, 0.07),
  );
}

export function outputWidth(template) {
  return Math.round(Math.min(1600, Math.max(900, template.width)));
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      const next = `${line} ${word}`;
      if (ctx.measureText(next).width <= maxWidth) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function fontFor(kind, px) {
  if (kind === 'classic') return `400 ${px}px ${DISPLAY}`;
  if (kind === 'subtitle') return `700 ${px}px ${TEXT}`;
  return `500 ${px}px ${TEXT}`;
}

const LINE = { classic: 1.04, subtitle: 1.2, bar: 1.25 };

function fitText(ctx, kind, raw, px, maxWidth, maxLines) {
  const text = kind === 'classic' ? raw.toUpperCase() : raw;
  let size = px;
  for (let i = 0; i < 40; i++) {
    ctx.font = fontFor(kind, size);
    const lines = wrap(ctx, text, maxWidth);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if ((widest <= maxWidth && lines.length <= maxLines) || size < 10) {
      return { lines, size, widest };
    }
    size *= 0.94;
  }
  ctx.font = fontFor(kind, size);
  const lines = wrap(ctx, text, maxWidth);
  return {
    lines,
    size,
    widest: Math.max(...lines.map((l) => ctx.measureText(l).width)),
  };
}

let scratch;
function measureCtx() {
  if (!scratch) scratch = document.createElement('canvas').getContext('2d');
  return scratch;
}

export function layout(meme) {
  const { template, captions, style } = meme;
  const W = outputWidth(template);
  const imgH = Math.round((W * template.height) / template.width);
  const ctx = measureCtx();
  let barH = 0;
  let bar = null;
  const placed = [];

  captions.forEach((c, i) => {
    if (style === 'bar' && i === 0) {
      const pad = W * 0.045;
      const px = Math.max(W * 0.035, W * c.size * 0.42);
      const fit = fitText(ctx, 'bar', c.text || ' ', px, W - pad * 2, 6);
      const lh = fit.size * LINE.bar;
      barH = Math.round(Math.max(W * 0.09, fit.lines.length * lh + pad * 1.6));
      bar = { caption: c, ...fit, lh, pad, x: pad };
      return;
    }
    const kind = style === 'subtitle' ? 'subtitle' : 'classic';
    const maxWidth = Math.max(W * 0.08, c.w * W);
    const px = c.size * W * (kind === 'subtitle' ? 0.7 : 1);
    const fit = fitText(ctx, kind, c.text || '', px, maxWidth, 3);
    const lh = fit.size * LINE[kind];
    const h = Math.max(lh, fit.lines.length * lh);
    const w = Math.max(maxWidth, fit.widest);
    const pad = fit.size * 0.1;
    const cy = Math.min(
      Math.max(c.y * imgH, h / 2 + pad),
      Math.max(h / 2 + pad, imgH - h / 2 - pad),
    );
    const cx = Math.min(Math.max(c.x * W, w / 2), W - w / 2);
    placed.push({
      caption: c,
      index: i,
      kind,
      ...fit,
      lh,
      box: { x: cx - w / 2, y: barH + cy - h / 2, w, h },
      cx,
      cy: barH + cy,
    });
  });

  if (bar) bar.y = (barH - bar.lines.length * bar.lh) / 2;
  return { W, H: imgH + barH, imgH, barH, bar, placed };
}

export function draw(ctx, image, meme, lay = layout(meme)) {
  const { W, H, imgH, barH, bar, placed } = lay;
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (image) ctx.drawImage(image, 0, barH, W, imgH);
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  if (bar?.caption.text) {
    ctx.font = fontFor('bar', bar.size);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0b0b0b';
    bar.lines.forEach((line, i) => {
      ctx.fillText(line, bar.x, bar.y + bar.lh * (i + 0.5));
    });
  }

  for (const p of placed) {
    if (!p.caption.text) continue;
    const color = COLORS[p.caption.color] || COLORS.white;
    ctx.font = fontFor(p.kind, p.size);
    ctx.textAlign = 'center';
    ctx.lineWidth = p.size * (p.kind === 'classic' ? 0.16 : 0.2);
    ctx.strokeStyle = color.stroke;
    ctx.fillStyle = color.fill;
    const top = p.cy - (p.lines.length * p.lh) / 2;
    p.lines.forEach((line, i) => {
      const y = top + p.lh * (i + 0.5);
      ctx.strokeText(line, p.cx, y);
      ctx.fillText(line, p.cx, y);
    });
  }
  return lay;
}

export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load(`400 40px ${DISPLAY}`),
      document.fonts.load(`500 40px ${TEXT}`),
      document.fonts.load(`700 40px ${TEXT}`),
    ]);
  } catch {}
}

export function slug(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'meme'
  );
}

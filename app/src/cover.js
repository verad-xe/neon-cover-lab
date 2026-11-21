// Neon Cover Lab — the cover renderer.
// Draws a multi-panel, GTA-poster-style cover onto any 2D canvas: white-guttered panels filled with
// graded photos, a film-grain and vignette finish, a circular lab badge, and bold original caption
// lettering set in Anton (SIL Open Font License, shipped under app/fonts/). Everything is drawn from
// the photos and words the caller supplies; no artwork, logo or font from any game is used.

/** The three post sizes the lab exports, keyed by the name the editor uses. */
export const COVER_SIZES = {
  square: { width: 1080, height: 1080, label: '1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: '1080 × 1350' },
  wide: { width: 1920, height: 1080, label: '1920 × 1080' },
};

/** Colour grades: a saturation/contrast lift plus screen, multiply and overlay washes per panel. */
export const COLOR_GRADES = {
  sunset: {
    label: 'Sunset Boulevard',
    saturation: 1.32, contrast: 1.06,
    glow: '255, 154, 61', shade: '146, 16, 96', wash: 'rgba(255, 84, 128, 0.10)',
  },
  neon: {
    label: 'Neon Nights',
    saturation: 1.5, contrast: 1.12,
    glow: '43, 226, 255', shade: '176, 0, 178', wash: 'rgba(84, 32, 255, 0.12)',
  },
  dusk: {
    label: 'Dusk Patrol',
    saturation: 1.12, contrast: 1.1,
    glow: '96, 128, 255', shade: '8, 10, 66', wash: 'rgba(40, 60, 200, 0.10)',
  },
  gold: {
    label: 'Golden Hour',
    saturation: 1.22, contrast: 1.03,
    glow: '255, 214, 96', shade: '128, 62, 4', wash: 'rgba(255, 166, 32, 0.10)',
  },
};

/** The panel layouts the lab offers, keyed by the name the editor uses. */
export const COVER_LAYOUTS = {
  grid9: { label: 'Grid — 9 panels', panels: 9 },
  hero3: { label: 'Hero + 3 panels', panels: 4 },
  quad: { label: 'Quad — 4 panels', panels: 4 },
  full: { label: 'Full bleed — 1 panel', panels: 1 },
};

const TITLE_FONT = '"Anton", "Arial Black", sans-serif';

/**
 * Splits a cover rectangle into panel rectangles for a layout, leaving a white outer frame and
 * white gutters between panels — the framed collage look of a game cover poster.
 */
export function layoutPanelRects(layout, width, height) {
  const frame = Math.round(width * 0.016);
  const gutter = Math.round(width * 0.011);
  const inner = { x: frame, y: frame, w: width - frame * 2, h: height - frame * 2 };
  const split = (rect, cols, rows) => {
    const rects = [];
    const pw = (rect.w - gutter * (cols - 1)) / cols;
    const ph = (rect.h - gutter * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rects.push({ x: rect.x + c * (pw + gutter), y: rect.y + r * (ph + gutter), w: pw, h: ph });
      }
    }
    return rects;
  };
  if (layout === 'grid9') return split(inner, 3, 3);
  if (layout === 'quad') return split(inner, 2, 2);
  if (layout === 'full') return [inner];
  // hero3: one tall hero panel on the left, three stacked panels on the right.
  const heroW = Math.round((inner.w - gutter) * 0.58);
  const hero = { x: inner.x, y: inner.y, w: heroW, h: inner.h };
  const side = { x: inner.x + heroW + gutter, y: inner.y, w: inner.w - heroW - gutter, h: inner.h };
  return [hero, ...split(side, 1, 3)];
}

/** Draws one photo into a panel rect, cover-fitted, honouring the panel's zoom and focal point. */
function drawPanelPhoto(ctx, photo, rect, view) {
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * view.zoom;
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  const dx = rect.x - view.fx * (dw - rect.w);
  const dy = rect.y - view.fy * (dh - rect.h);
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/** Placeholder art for a panel with no photo yet: a dusk gradient with a low sun disc. */
function drawEmptyPanel(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#3b1560');
  grad.addColorStop(0.55, '#8c1d6e');
  grad.addColorStop(1, '#e85d3d');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const sunR = Math.min(rect.w, rect.h) * 0.22;
  const sun = ctx.createRadialGradient(
    rect.x + rect.w * 0.68, rect.y + rect.h * 0.34, 0,
    rect.x + rect.w * 0.68, rect.y + rect.h * 0.34, sunR,
  );
  sun.addColorStop(0, 'rgba(255, 214, 130, 0.95)');
  sun.addColorStop(1, 'rgba(255, 214, 130, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(rect.x + rect.w * 0.68, rect.y + rect.h * 0.34, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `${Math.round(Math.min(rect.w, rect.h) * 0.09)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h * 0.88);
}

/** Applies a colour grade inside the current clip: screen glow, multiply shade, overlay wash. */
function applyGrade(ctx, rect, grade) {
  ctx.globalCompositeOperation = 'screen';
  let grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, `rgba(${grade.glow}, 0.34)`);
  grad.addColorStop(0.55, `rgba(${grade.glow}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'multiply';
  grad = ctx.createLinearGradient(rect.x, rect.y + rect.h * 0.4, rect.x, rect.y + rect.h);
  grad.addColorStop(0, `rgba(${grade.shade}, 0)`);
  grad.addColorStop(1, `rgba(${grade.shade}, 0.62)`);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
}

/** A tileable film-grain pattern, generated once and reused for every cover. */
let grainPattern = null;
function getGrainPattern(ctx) {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

/** Wraps the caption into at most two lines that fit the cover width at the given font size. */
function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [words[0]];
  for (const word of words.slice(1)) {
    const candidate = `${lines[lines.length - 1]} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth || lines.length === 2) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
  }
  return lines.slice(0, 2);
}

/** Draws the bold caption lettering: gradient-filled, dark-outlined, slightly sheared capitals. */
function drawTitle(ctx, caption, width, height) {
  const text = caption.trim().toUpperCase();
  if (!text) return;
  let size = height * 0.118;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let lines = [];
  while (size > 14) {
    ctx.font = `${size}px ${TITLE_FONT}`;
    lines = wrapTitle(ctx, text, width * 0.9);
    if (lines.every((line) => ctx.measureText(line).width <= width * 0.9)) break;
    size -= 3;
  }
  const lineHeight = size * 1.04;
  const blockH = lineHeight * lines.length;
  const top = height * 0.038;
  const cx = width / 2;
  ctx.save();
  ctx.translate(cx, top);
  ctx.transform(1, 0, -0.055, 1, 0, 0);
  const fill = ctx.createLinearGradient(0, 0, 0, blockH);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.62, '#ffe9b8');
  fill.addColorStop(1, '#ffb347');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#170b31';
  ctx.lineWidth = size * 0.17;
  lines.forEach((line, i) => ctx.strokeText(line, 0, i * lineHeight));
  ctx.shadowColor = 'rgba(255, 45, 150, 0.55)';
  ctx.shadowBlur = size * 0.22;
  ctx.shadowOffsetY = size * 0.045;
  ctx.fillStyle = fill;
  lines.forEach((line, i) => ctx.fillText(line, 0, i * lineHeight));
  ctx.restore();
  // A sunset rule under the lettering, as wide as the widest line.
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const barW = Math.min(widest * 0.72, width * 0.8);
  const barH = Math.max(4, size * 0.085);
  const bar = ctx.createLinearGradient(cx - barW / 2, 0, cx + barW / 2, 0);
  bar.addColorStop(0, '#ff2d95');
  bar.addColorStop(0.5, '#ff7847');
  bar.addColorStop(1, '#ffc837');
  ctx.fillStyle = bar;
  ctx.beginPath();
  ctx.roundRect(cx - barW / 2, top + blockH + size * 0.1, barW, barH, barH / 2);
  ctx.fill();
}

/** Draws the subtitle in a dark band along the foot of the cover, under a gradient hairline. */
function drawSubtitleBand(ctx, subtitle, width, height) {
  const text = subtitle.trim().toUpperCase();
  if (!text) return;
  const bandH = height * 0.072;
  const y = height - bandH;
  ctx.fillStyle = 'rgba(9, 4, 24, 0.78)';
  ctx.fillRect(0, y, width, bandH);
  const line = ctx.createLinearGradient(0, 0, width, 0);
  line.addColorStop(0, '#ff2d95');
  line.addColorStop(0.5, '#ff7847');
  line.addColorStop(1, '#ffc837');
  ctx.fillStyle = line;
  ctx.fillRect(0, y, width, Math.max(2, height * 0.004));
  let size = bandH * 0.42;
  ctx.font = `${size}px ${TITLE_FONT}`;
  try { ctx.letterSpacing = `${size * 0.16}px`; } catch { /* older engines: spacing is a garnish */ }
  while (ctx.measureText(text).width > width * 0.86 && size > 10) {
    size -= 2;
    ctx.font = `${size}px ${TITLE_FONT}`;
    try { ctx.letterSpacing = `${size * 0.16}px`; } catch { /* as above */ }
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fdf6ec';
  ctx.shadowColor = 'rgba(255, 45, 150, 0.6)';
  ctx.shadowBlur = size * 0.3;
  ctx.fillText(text, width / 2, y + bandH * 0.56);
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* as above */ }
}

/** The lab's own round badge, stickered over the lower-left corner like a rating mark. */
function drawLabBadge(ctx, width, height) {
  const r = height * 0.052;
  const cx = width * 0.016 + r + width * 0.008;
  const cy = height - height * 0.072 - r - height * 0.014;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.14);
  const ring = ctx.createLinearGradient(-r, -r, r, r);
  ring.addColorStop(0, '#ff2d95');
  ring.addColorStop(1, '#ffc837');
  ctx.fillStyle = '#170b31';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = r * 0.13;
  ctx.strokeStyle = ring;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.62}px ${TITLE_FONT}`;
  ctx.fillText('NCL', 0, -r * 0.12);
  ctx.font = `${r * 0.26}px ${TITLE_FONT}`;
  ctx.fillStyle = '#ffc837';
  ctx.fillText('ORIGINAL', 0, r * 0.38);
  ctx.restore();
}

/**
 * Draws the whole cover described by `art` onto `canvas` at the canvas's own size.
 * art: { layout, grade, caption, subtitle, grain, panels: [{ photo, fx, fy, zoom }] }.
 * When `editorMark` is a panel index, that panel gets the editor's selection outline (never exported).
 */
export function drawCover(canvas, art, editorMark = -1) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = COLOR_GRADES[art.grade] ?? COLOR_GRADES.sunset;
  const rects = layoutPanelRects(art.layout, w, h);
  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const panel = art.panels[i] ?? { photo: null, fx: 0.5, fy: 0.5, zoom: 1 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel.photo) {
      ctx.filter = `saturate(${grade.saturation}) contrast(${grade.contrast})`;
      drawPanelPhoto(ctx, panel.photo, rect, panel);
      ctx.filter = 'none';
    } else {
      drawEmptyPanel(ctx, rect, i);
    }
    applyGrade(ctx, rect, grade);
    ctx.restore();
    ctx.strokeStyle = 'rgba(23, 11, 49, 0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  });
  if (art.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = getGrainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vignette.addColorStop(0, 'rgba(10, 2, 24, 0)');
  vignette.addColorStop(1, 'rgba(10, 2, 24, 0.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  drawTitle(ctx, art.caption, w, h);
  drawSubtitleBand(ctx, art.subtitle, w, h);
  drawLabBadge(ctx, w, h);
  if (editorMark >= 0 && rects[editorMark]) {
    const rect = rects[editorMark];
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
    ctx.strokeStyle = '#170b31';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rect.x + 7, rect.y + 7, rect.w - 14, rect.h - 14);
    ctx.setLineDash([]);
    ctx.font = `700 ${Math.max(13, h * 0.016)}px system-ui, sans-serif`;
    const tag = `PANEL ${editorMark + 1} — DRAG TO MOVE · SCROLL TO ZOOM`;
    const tw = ctx.measureText(tag).width + 18;
    ctx.fillStyle = 'rgba(23, 11, 49, 0.88)';
    ctx.beginPath();
    ctx.roundRect(rect.x + 10, rect.y + 10, tw, h * 0.032, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, rect.x + 19, rect.y + 10 + h * 0.016);
    ctx.restore();
  }
}

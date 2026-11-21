// Neon Cover Lab — the editor.
// Wires the page to the renderer in ./cover.js: a photo tray (your own photos, read on this machine
// and never uploaded, plus five model-made samples), clickable panels you can drag and zoom, layout,
// size and grade pickers, caption fields, and one-click PNG export at the three post sizes.
import { COLOR_GRADES, COVER_LAYOUTS, COVER_SIZES, drawCover, layoutPanelRects } from './cover.js';
import { markShotReady, readShotConfig } from './shots.js';

const SAMPLE_PHOTOS = ['neon-portrait', 'coast-driver', 'marina', 'boulevard', 'pier'];
const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const zoomSlider = document.getElementById('zoom');
const panelName = document.getElementById('panel-name');

const state = {
  size: 'wide',
  layout: 'grid9',
  grade: 'sunset',
  caption: 'Neon Heat',
  subtitle: 'Vice Shores · Original Cover Art',
  grain: true,
  photos: [],
  panels: [],
  selected: 0,
};

/** A fresh panel: no photo, centred, unzoomed. */
function blankPanel() {
  return { photo: null, fx: 0.5, fy: 0.5, zoom: 1 };
}

/** Rebuilds the panel list for the current layout, keeping assignments that still fit. */
function syncPanels() {
  const count = COVER_LAYOUTS[state.layout].panels;
  const next = [];
  for (let i = 0; i < count; i++) next.push(state.panels[i] ?? blankPanel());
  state.panels = next;
  state.selected = Math.min(state.selected, count - 1);
}

/** Loads an image from a URL, resolving once it can be drawn. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Redraws the preview at the export size, marking the selected panel for the editor. */
function redraw() {
  const { width, height } = COVER_SIZES[state.size];
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const art = {
    layout: state.layout, grade: state.grade, caption: state.caption,
    subtitle: state.subtitle, grain: state.grain, panels: state.panels,
  };
  const inShotCover = document.body.classList.contains('shot-cover');
  drawCover(canvas, art, inShotCover ? -1 : state.selected);
  panelName.textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  zoomSlider.value = String(Math.round((state.panels[state.selected]?.zoom ?? 1) * 100));
}

/** Rebuilds the photo tray thumbnails; clicking one assigns it to the selected panel. */
function renderTray() {
  tray.replaceChildren();
  state.photos.forEach((entry, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = `${entry.name} — click to place in panel ${state.selected + 1}`;
    const img = document.createElement('img');
    img.src = entry.url;
    img.alt = entry.name;
    button.append(img);
    button.addEventListener('click', () => {
      state.panels[state.selected].photo = entry.img;
      status.textContent = `${entry.name} placed in panel ${state.selected + 1}.`;
      redraw();
    });
    tray.append(button);
    void i;
  });
}

/** Adds a loaded image to the tray under a display name. */
function addPhoto(img, url, name) {
  state.photos.push({ img, url, name });
  renderTray();
}

/** Spreads the tray photos across the panels in order, wrapping around when panels outnumber photos. */
function spreadPhotos() {
  if (!state.photos.length) return;
  state.panels.forEach((panel, i) => {
    panel.photo = state.photos[i % state.photos.length].img;
    panel.fx = 0.5;
    panel.fy = 0.5;
  });
  redraw();
}

/** Fills every panel with the photo currently in the selected panel (or the first tray photo). */
function fillPanels() {
  const source = state.panels[state.selected].photo ?? state.photos[0]?.img;
  if (!source) return;
  state.panels.forEach((panel) => { panel.photo = source; });
  redraw();
}

/** Exports the cover as a PNG at the exact post size, drawn clean with no editor marks. */
function exportPng(sizeKey) {
  const { width, height, label } = COVER_SIZES[sizeKey];
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  drawCover(out, {
    layout: state.layout, grade: state.grade, caption: state.caption,
    subtitle: state.subtitle, grain: state.grain, panels: state.panels,
  });
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-cover-${width}x${height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = `Saved neon-cover-${width}x${height}.png (${label}).`;
  }, 'image/png');
}

/** Marks one button in a picker group as active, by its data value. */
function markActive(groupId, value) {
  document.querySelectorAll(`#${groupId} button`).forEach((button) => {
    button.classList.toggle('active', button.dataset.value === value);
  });
}

/** Builds a picker group's click behaviour from a data-value attribute. */
function wirePicker(groupId, apply) {
  document.querySelectorAll(`#${groupId} button`).forEach((button) => {
    button.addEventListener('click', () => {
      apply(button.dataset.value);
      markActive(groupId, button.dataset.value);
      redraw();
    });
  });
}

wirePicker('layout-picker', (value) => { state.layout = value; syncPanels(); });
wirePicker('size-picker', (value) => { state.size = value; });
wirePicker('grade-picker', (value) => { state.grade = value; });

document.getElementById('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
zoomSlider.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomSlider.value) / 100;
  redraw();
});
document.getElementById('spread').addEventListener('click', spreadPhotos);
document.getElementById('fill').addEventListener('click', fillPanels);
document.querySelectorAll('.export-btn').forEach((button) => {
  button.addEventListener('click', () => exportPng(button.dataset.size));
});

document.getElementById('photo-files').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    addPhoto(img, url, file.name);
  }
  if (files.length) {
    status.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} added — click a thumbnail to place it, or Spread.`;
    if (state.panels.every((panel) => !panel.photo)) spreadPhotos();
  }
  e.target.value = '';
});

// Pointer work on the preview: click selects a panel, drag pans its photo, wheel zooms it.
let drag = null;
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const rects = layoutPanelRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
  if (hit >= 0) state.selected = hit;
  drag = { x: point.x, y: point.y };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const panel = state.panels[state.selected];
  const rects = layoutPanelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[state.selected];
  if (panel.photo && rect) {
    const scale = Math.max(rect.w / panel.photo.naturalWidth, rect.h / panel.photo.naturalHeight) * panel.zoom;
    const rangeX = Math.max(1, panel.photo.naturalWidth * scale - rect.w);
    const rangeY = Math.max(1, panel.photo.naturalHeight * scale - rect.h);
    panel.fx = Math.min(1, Math.max(0, panel.fx - (point.x - drag.x) / rangeX));
    panel.fy = Math.min(1, Math.max(0, panel.fy - (point.y - drag.y) / rangeY));
  }
  drag = point;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.min(3, Math.max(1, panel.zoom * (event.deltaY < 0 ? 1.07 : 0.93)));
  redraw();
}, { passive: false });

/** Loads the five model-made sample photos into the tray and spreads them over the panels. */
async function loadSamples(names = SAMPLE_PHOTOS) {
  for (const name of names) {
    const url = `samples/${name}.jpg`;
    const img = await loadImage(url);
    addPhoto(img, url, name);
  }
  spreadPhotos();
}

/** Applies a ?shot= scene (see ./shots.js), then flags it ready for the screenshot. */
async function applyShot(shot) {
  if (shot.mode === 'cover') document.body.classList.add('shot-cover');
  if (shot.layout && COVER_LAYOUTS[shot.layout]) { state.layout = shot.layout; syncPanels(); }
  if (shot.size && COVER_SIZES[shot.size]) state.size = shot.size;
  if (shot.grade && COLOR_GRADES[shot.grade]) state.grade = shot.grade;
  if (shot.caption !== null) state.caption = shot.caption;
  if (shot.subtitle !== null) state.subtitle = shot.subtitle;
  document.getElementById('caption').value = state.caption;
  document.getElementById('subtitle').value = state.subtitle;
  markActive('layout-picker', state.layout);
  markActive('size-picker', state.size);
  markActive('grade-picker', state.grade);
  await loadSamples(shot.photos.length ? shot.photos : undefined);
  await document.fonts.load('100px "Anton"');
  redraw();
  markShotReady();
}

syncPanels();
const shot = readShotConfig();
if (shot) {
  applyShot(shot);
} else {
  loadSamples().then(async () => {
    await document.fonts.load('100px "Anton"');
    redraw();
  });
  redraw();
}

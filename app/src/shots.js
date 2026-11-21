// Fixed scenes for screenshots: a `?shot=` query describes one scene and the editor builds it, so a
// headless browser can photograph the lab exactly as a person would see it.
//   ?shot=cover  — the cover alone, filling the window (an exported cover's own drawing).
//   ?shot=editor — the full editor with sample photos loaded and a panel selected.
// Optional params: layout, size, grade, caption, subtitle, photos (comma-separated sample names).

/** Reads the shot scene out of the page URL, or returns null for a normal visit. */
export function readShotConfig() {
  const query = new URLSearchParams(location.search);
  const mode = query.get('shot');
  if (!mode) return null;
  return {
    mode,
    layout: query.get('layout'),
    size: query.get('size'),
    grade: query.get('grade'),
    caption: query.get('caption'),
    subtitle: query.get('subtitle'),
    photos: (query.get('photos') ?? '').split(',').map((name) => name.trim()).filter(Boolean),
  };
}

/** Flags the scene as painted, two frames after the caller asks, so screenshots never catch a half-drawn cover. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

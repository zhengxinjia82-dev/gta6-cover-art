// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos;
// ?shot=cover shows the cover alone. Params: photo (comma list of samples),
// caption, layout (grid|hero|strip), grade (sunset|neon|dusk), size (WxH),
// pos (top|bottom), color (hex). window.__shotReady is set once painted.
export async function runShot(shot, query, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = (query.get('photo') ?? 'pier').split(',');
  for (const name of photos) await app.loadSample(name.trim());
  if (query.get('layout')) app.setLayout(query.get('layout'));
  if (query.get('grade')) app.setGrade(query.get('grade'));
  if (query.get('size')) app.setSize(query.get('size'));
  if (query.get('caption')) app.setCaption(query.get('caption'));
  if (query.get('pos')) app.state.captionPos = query.get('pos');
  if (query.get('color')) app.state.captionColor = query.get('color');
  // Vary the panel crops so one photo fills several panels differently.
  app.state.panels.forEach((p, i) => {
    p.photo = i % app.state.photos.length;
    p.ox = (i % 2 ? -0.12 : 0.12) * (i + 1) * 0.3;
    p.oy = i % 3 === 0 ? -0.08 : 0.06;
    p.zoom = 1.25 + (i % 3) * 0.18;
  });
  await document.fonts.ready;
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

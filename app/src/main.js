// Vice Cover Maker: wires the editor UI to the cover renderer (./cover.js).
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, panelCount } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panelInfo = document.getElementById('panel-info');

export const state = {
  layout: 'grid',
  grade: 'sunset',
  caption: 'Sunset Heist',
  captionPos: 'bottom',
  captionColor: '#ffffff',
  photos: [],
  panels: [],
  selected: 0,
};

function defaultPanels() {
  const n = panelCount(state.layout);
  const panels = [];
  for (let i = 0; i < n; i++) {
    const old = state.panels[i];
    panels.push(old || { photo: state.photos.length ? i % state.photos.length : 0, ox: 0, oy: 0, zoom: 1.2 });
  }
  return panels;
}

function redraw() {
  state.panels = defaultPanels();
  drawCover(canvas, state);
  drawSelection();
  panelInfo.textContent = `Panel ${state.selected + 1} of ${state.panels.length} selected — drag it to pan, use Zoom below.`;
  zoomInput.value = String(state.panels[state.selected]?.zoom ?? 1.2);
}

function drawSelection() {
  // No selection outline on a cover shot — the exported cover must be clean.
  if (document.body.classList.contains('shot-cover')) return;
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const rects = panelRectsForCanvas();
  const r = rects[state.selected];
  if (!r) return;
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(4, w * 0.006);
  ctx.setLineDash([w * 0.02, w * 0.012]);
  ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
  ctx.restore();
}

import { layoutRects } from './cover.js';
function panelRectsForCanvas() {
  return layoutRects(state.layout, canvas.width, canvas.height);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotos(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push(img);
    addThumb(img, state.photos.length - 1);
  }
  // Fill empty panels with the new photos, cycling.
  state.panels = defaultPanels();
  state.panels.forEach((p, i) => { if (!state.photos[p.photo]) p.photo = i % state.photos.length; });
  redraw();
}

function addThumb(img, index) {
  const box = document.getElementById('thumbs');
  const el = document.createElement('img');
  el.src = img.src;
  el.alt = `Photo ${index + 1}`;
  el.title = `Photo ${index + 1} — click to put it in the selected panel`;
  el.addEventListener('click', () => {
    state.panels[state.selected].photo = index;
    document.querySelectorAll('#thumbs img').forEach((t) => t.classList.remove('on'));
    el.classList.add('on');
    redraw();
  });
  box.appendChild(el);
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos.push(img);
  addThumb(img, state.photos.length - 1);
  redraw();
}

document.getElementById('photo').addEventListener('change', (e) => addPhotos([...e.target.files]));
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));
document.getElementById('panel-photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  state.photos.push(img);
  addThumb(img, state.photos.length - 1);
  state.panels[state.selected].photo = state.photos.length - 1;
  redraw();
});

document.getElementById('layouts').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  state.layout = btn.dataset.layout;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b === btn));
  state.selected = 0;
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b === btn));
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
document.getElementById('pos-top').addEventListener('click', (e) => setPos('top', e.currentTarget));
document.getElementById('pos-bottom').addEventListener('click', (e) => setPos('bottom', e.currentTarget));
function setPos(pos, btn) {
  state.captionPos = pos;
  document.getElementById('pos-top').classList.toggle('on', pos === 'top');
  document.getElementById('pos-bottom').classList.toggle('on', pos === 'bottom');
  redraw();
}
document.getElementById('colors').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-color]');
  if (!btn) return;
  state.captionColor = btn.dataset.color;
  document.querySelectorAll('#colors .sw').forEach((b) => b.classList.toggle('on', b === btn));
  redraw();
});
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  redraw();
});

// Click a panel to select it; drag to pan the photo inside it.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * canvas.width, y: (e.clientY - r.top) / r.height * canvas.height };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = panelRectsForCanvas();
  const i = rects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  if (i < 0) return;
  state.selected = i;
  drag = { x: p.x, y: p.y, ox: state.panels[i].ox, oy: state.panels[i].oy, rect: rects[i] };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (p.x - drag.x) / drag.rect.w));
  panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (p.y - drag.y) / drag.rect.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// Drag-and-drop photos onto the preview.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) addPhotos([...e.dataTransfer.files]);
});

const sizeSelect = document.getElementById('size');
sizeSelect.addEventListener('change', () => {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  redraw();
});

// Renders the cover at the chosen export size and returns a PNG data URL.
export async function exportPNG() {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return { dataUrl: off.toDataURL('image/png'), width: w, height: h };
}

document.getElementById('export').addEventListener('click', async () => {
  const { dataUrl, width, height } = await exportPNG();
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `vice-cover-${width}x${height}.png`;
  a.click();
  status.textContent = `Saved vice-cover-${width}x${height}.png`;
});

// Test hooks for Playwright: load samples, set state, export, check readiness.
window.__app = {
  state,
  loadSample,
  redraw,
  exportPNG,
  setCaption(text) { state.caption = text; captionInput.value = text; redraw(); },
  setLayout(layout) { state.layout = layout; state.selected = 0;
    document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
    redraw(); },
  setGrade(grade) { state.grade = grade;
    document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === grade));
    redraw(); },
  setSize(size) { sizeSelect.value = size; sizeSelect.dispatchEvent(new Event('change')); },
};

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), window.__app);
} else {
  redraw();
}

// Draws the multi-panel poster cover: photo panels in a layout, a sunset/neon
// colour grade (canvas gradients + filters, all original art), and a bold
// Anton caption with a dark outline and drop shadow. No third-party artwork.

// Panel rects as fractions of the canvas, with a small gap between panels.
export function layoutRects(layout, w, h) {
  const g = 0.012; // gap as a fraction of the short side
  const gap = Math.min(w, h) * g;
  if (layout === 'hero') {
    const bigW = w * 0.64 - gap / 2;
    const smallW = w - bigW - gap;
    const smallH = (h - gap) / 2;
    return [
      { x: 0, y: 0, w: bigW, h },
      { x: bigW + gap, y: 0, w: smallW, h: smallH },
      { x: bigW + gap, y: smallH + gap, w: smallW, h: smallH },
    ];
  }
  if (layout === 'strip') {
    const pw = (w - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (pw + gap), y: 0, w: pw, h }));
  }
  // Vice Grid: 2 x 2.
  const pw = (w - gap) / 2;
  const ph = (h - gap) / 2;
  return [
    { x: 0, y: 0, w: pw, h: ph },
    { x: pw + gap, y: 0, w: pw, h: ph },
    { x: 0, y: ph + gap, w: pw, h: ph },
    { x: pw + gap, y: ph + gap, w: pw, h: ph },
  ];
}

export const GRADES = {
  sunset: { filter: 'saturate(1.3) contrast(1.08) brightness(1.02)', stops: [[0, 'rgba(255,190,80,0.10)'], [0.55, 'rgba(255,110,60,0.16)'], [1, 'rgba(190,30,110,0.42)']] },
  neon: { filter: 'saturate(1.55) contrast(1.12)', stops: [[0, 'rgba(60,220,255,0.16)'], [0.55, 'rgba(120,60,255,0.18)'], [1, 'rgba(255,40,160,0.40)']] },
  dusk: { filter: 'saturate(1.15) contrast(1.05) brightness(0.96)', stops: [[0, 'rgba(255,150,90,0.08)'], [0.6, 'rgba(140,60,140,0.22)'], [1, 'rgba(30,10,60,0.48)']] },
};

export function panelCount(layout) {
  return layoutRects(layout, 100, 100).length;
}

// Draw one photo into a panel rect, cover-fit, with per-panel pan/zoom.
// p = { ox, oy } offsets in fractions of the panel (-0.5..0.5), zoom >= 1.
function drawPanel(ctx, img, rect, p, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = base * (p.zoom || 1);
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const cx = x + w / 2 + (p.ox || 0) * w;
    const cy = y + h / 2 + (p.oy || 0) * h;
    ctx.filter = grade.filter;
    ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#3a2347';
    ctx.fillRect(x, y, w, h);
  }
  const tint = ctx.createLinearGradient(x, y, x, y + h);
  for (const [stop, color] of grade.stops) tint.addColorStop(stop, color);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// state: { layout, grade, caption, captionPos, captionColor, photos: [img],
//   panels: [{ photo, ox, oy, zoom }] } — panels indexed by panel slot.
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#160d1e';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const p = state.panels[i] || { photo: 0, ox: 0, oy: 0, zoom: 1.2 };
    const img = state.photos[p.photo] || null;
    drawPanel(ctx, img, rect, p, grade);
    // Thin bright frame around each panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  });
  drawCaption(ctx, w, h, state);
  // Selected-panel marker is drawn by the editor overlay, not here.
}

function drawCaption(ctx, w, h, state) {
  const text = (state.caption || '').trim().toUpperCase();
  if (!text) return;
  const top = state.captionPos === 'top';
  // Dark band behind the caption so it reads over any photo.
  const bandH = h * 0.2;
  const bandY = top ? 0 : h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, top ? 'rgba(10,5,18,0.72)' : 'rgba(10,5,18,0)');
  band.addColorStop(1, top ? 'rgba(10,5,18,0)' : 'rgba(10,5,18,0.72)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  let size = h * 0.11;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > w * 0.92 && size > 14) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cy = top ? h * 0.09 : h - h * 0.09;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.14);
  ctx.strokeStyle = 'rgba(20,8,28,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeText(text, w / 2, cy);
  ctx.fillStyle = state.captionColor || '#ffffff';
  ctx.fillText(text, w / 2, cy);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

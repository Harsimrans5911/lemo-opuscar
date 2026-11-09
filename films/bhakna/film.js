// The Voyage Home: one tall painted sheet, read downward. Everything is a pure function of t.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = DUR_FILM;
let PAPER_IMG, OBJ = [], BARS = [], TALLY, END = {}, FRAME_TEXTS = [];
const EV = [];
const QS = new URLSearchParams(location.search);

// ---------- camera: centre (cx, cy) on the sheet and zoom; one world -> screen function ----------
const camY = monotone([[0, 960], [4.2, 960], [6.2, 2460], [10.6, 2472], [12.8, 2560], [16.5, 2570], [18.4, 4100], [23.8, 4114], [25.6, 5750], [31.0, 5764], [32.9, 6030], [35.3, 6040], [37.2, 7500], [42.6, 7700], [44.4, 9200], [46.2, 9204], [50.2, 9290], [61.2, 9290]]);
const camX = monotone([[0, 540], [10.6, 540], [12.8, 470], [16.5, 470], [18.2, 540], [31, 540], [32.9, 450], [35.3, 450], [36.8, 540], [37.2, 540], [42.6, 600], [44.2, 540], [46.2, 540], [50.2, 530], [61.2, 530]]);
const camZ = monotone([[0, 1], [10.6, 1], [12.8, 1.9], [16.5, 1.96], [18.2, 1], [31.0, 1], [32.9, 1.82], [35.3, 1.88], [36.8, 1], [46.2, 1], [50.2, 1.32], [61.2, 1.32]]);
const cam = t => ({ x: camX(t), y: camY(t), z: camZ(t) });
const toScreen = (c, wx, wy) => [(wx - c.x) * c.z + W / 2, (wy - c.y) * c.z + H / 2];
function setWorld(c) { ctx.setTransform(c.z, 0, 0, c.z, W / 2 - c.x * c.z, H / 2 - c.y * c.z); }

// ---------- objects: built once under a seed, painted in by a cue, then cached as a sprite ----------
function hiSprite(L, k) {
  const [x0, y0, x1, y1] = bbox(L, 10), s = document.createElement('canvas');
  s.width = Math.max(1, Math.ceil((x1 - x0) * k)); s.height = Math.max(1, Math.ceil((y1 - y0) * k));
  const c = s.getContext('2d'); c.scale(k, k); c.translate(-x0, -y0); for (const st of L) drawS(c, st, 1);
  return { cv: s, x0, y0, w: x1 - x0, h: y1 - y0 };
}
function add(name, seed, gen, x, y, sc, t0, dur, o = {}) {
  const S = withSeed(seed, gen), ob = { name, S, x, y, sc, t0, dur, sway: o.sway || 0, ph: seed * .7, a: o.a ?? 1, rot: o.rot || 0, move: o.move, layer: o.layer || 0, zmax: o.zmax || 1 };
  ob.spr = hiSprite(S, Math.min(2.2, sc * ob.zmax));
  OBJ.push(ob);
  if (!o.quiet) EV.push({ t: t0, type: 'brush', dur, pan: (x - 540) / 700, gain: o.gain ?? 1 });
  return ob;
}
function drawObj(ob, t, c) {
  const p = (t - ob.t0) / ob.dur; if (p <= 0) return;
  const [mx, my] = ob.move ? ob.move(t) : [ob.x, ob.y];
  const sk = p >= 1 && ob.sway ? ob.sway * (Math.sin(1.15 * t + ob.ph) + .4 * Math.sin(2.7 * t + 2 * ob.ph)) : 0;
  ctx.save(); ctx.translate(mx, my); if (ob.rot) ctx.rotate(ob.rot); ctx.transform(ob.sc, 0, -sk * ob.sc, ob.sc, 0, 0); ctx.globalAlpha = ob.a;
  if (p < 1) drawList(ctx, ob.S, p); else ctx.drawImage(ob.spr.cv, ob.spr.x0, ob.spr.y0, ob.spr.w, ob.spr.h);
  ctx.restore();
}

// ---------- text: every text drawn goes through here, so readcheck sees exactly what the viewer sees ----------
function text(id, txt, font, x, y, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.font = font; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  if (o.track) ctx.letterSpacing = o.track + 'px';
  const w = ctx.measureText(txt).width, x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x, hh = o.h || 46;
  const m = ctx.getTransform(), a = m.transformPoint(new DOMPoint(x0, y - hh)), b = m.transformPoint(new DOMPoint(x0 + w, y + hh));
  if (!o.silent) FRAME_TEXTS.push({ id, text: txt, x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) });
  ctx.beginPath(); ctx.rect(x0 - 10, y - hh * 1.6, (w + 20) * (o.fade ? 1 : eo(p)), hh * 3.2); ctx.clip();
  ctx.globalAlpha *= (o.fade ? ss(p) : 1);
  ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = o.halo ?? 12; ctx.fillStyle = rgba(o.col || INK, o.a ?? .9);
  ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
}
const HAND = (s, w = 500) => `${w} ${s}px Caveat`, MONO = s => `400 ${s}px "IBM Plex Mono"`, SERIF = (s, it) => `${it ? 'italic ' : ''}500 ${s}px "Cormorant Garamond"`;
function leader(x0, y0, x1, y1, p, bend = 20, a = .75) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p)));
  ctx.beginPath(); for (let i = 0; i <= m; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(INK, a); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3.5, 0, 7); ctx.fillStyle = rgba(INK, a); ctx.fill(); }
}
// hand notes on the sheet: [id, text, size, x, y, t0, writeDur, align, leader?]
const NOTES = [
  ['q1', 'Why would a free man', 106, 540, 700, 0.2, 0.8, 'center'],
  ['q2', 'sail home to a prison?', 106, 540, 828, 1.0, 0.9, 'center'],
  ['n_or', 'Oregon, USA', 50, 80, 1830, 7.0, 0.7, 'left'],
  ['n_ins', '“a man from a slave country”', 36, 228, 2318, 12.9, 0.9, 'left', [440, 2346, 452, 2392, 10]],
  ['n_pres', 'first president: Sohan Singh Bhakna', 46, 540, 4170, 20.0, 0.9, 'center'],
  ['n_idol1', 'no idol,', 54, 76, 5110, 26.6, 0.5, 'left'],
  ['n_idol2', 'only the Word', 54, 76, 5172, 27.1, 0.7, 'left', [300, 5196, 392, 5236, -14]],
  ['n_baba', 'Baba Kesar Singh', 34, 190, 5770, 32.5, 0.7, 'left', [290, 5796, 296, 5878, 10]],
  ['n_home', 'homeward, 1914', 54, 520, 7090, 38.0, 0.8, 'left'],
  ['n_cal', 'Calcutta, 13 October 1914', 48, 540, 8790, 45.0, 0.9, 'center'],
];
NOTES.forEach(n => EV.push({ t: n[5], type: 'pen', dur: n[6], pan: (n[3] - 540) / 800 }));

// ---------- build ----------
function build() {
  // Oregon: cool sky, a far ridge, pines, the mill, the lumber, the man
  add('or_sky', 11, () => bands(-60, 1140, 1840, 2080, 3, 170, ['#cfdbdc', '#d6e0de'], { a: .34 }), 0, 0, 1, 4.6, 1.3);
  add('or_ridge', 12, () => bands(-60, 1140, 2330, 2420, 2, 150, ['#9ab1a4', '#a7bcae'], { a: .42, rise: -60 }), 0, 0, 1, 4.8, 1.3);
  [[250, 2640, 470, 13, ['#7f998a', '#8ba594', '#74907f'], .8], [840, 2650, 430, 14, ['#7f998a', '#8ba594', '#74907f'], .8], [110, 2700, 640, 15], [960, 2710, 720, 16], [30, 2720, 380, 17]].forEach(([x, y, h, sd, cols, a], i) =>
    add('pine' + i, sd, () => pine(h, cols), x, y, 1, 5.0 + i * .28, 1.7, { sway: .005, a: a ?? 1, quiet: i > 2 }));
  add('or_ground', 18, () => bands(-60, 1140, 2716, 2800, 2, 110, ['#c9b48a', '#d2bf97'], { a: .5 }), 0, 0, 1, 6.0, 1.1, { quiet: true });
  add('shed', 19, shed, 770, 2690, .95, 6.3, 1.6, { zmax: 2 });
  add('lumber', 20, lumber, 250, 2706, 1, 6.9, 1.3, { zmax: 2 });
  add('man1', 21, () => figure({ plank: true, coat: '#66727f', face: 1 }), 480, 2700, 1, CUE.figure, 1.7, { zmax: 2 });
  // the paper: a newspaper sheet, its masthead, a seal
  add('news_wash', 30, () => bands(-350, 350, -400, 400, 8, 124, ['#e3d6bb', '#dccfb2', '#e8dcc4'], { a: .5, amp: 4 }), 540, 4000, 1, 17.0, 1.3, { rot: -.035 });
  add('news_edge', 31, () => sheetEdges(352, 456), 540, 4000, 1, 17.6, .9, { rot: -.035, quiet: true });
  add('news_rule', 32, () => { const S = []; L_(S, -300, 0, 300, 0, 3, INK2, { prof: 'even', nb: 0, a: .7 }); L_(S, -300, 9, 300, 9, 1.4, INK2, { prof: 'even', nb: 0, a: .7 }); return S; }, 540, 3838, 1, 18.9, .5, { rot: -.035, quiet: true });
  add('news_lines', 33, () => newsLines(300, 9, 30), 540, 4238, 1, 19.0, 1.4, { rot: -.035, quiet: true });
  add('seal', 34, seal, 770, 4326, 1, CUE.stamp, .22, { rot: -.3, quiet: true });
  EV.push({ t: CUE.stamp, type: 'stamp' });
  // what he bows to: a gurdwara and its flag, a lamp, a teacher
  add('f_sky', 40, () => bands(-60, 1140, 4980, 5230, 3, 170, ['#cfdbe0', '#d7e1e2'], { a: .34 }), 0, 0, 1, 24.8, 1.2);
  add('f_ground', 41, () => bands(-60, 1140, 5722, 5790, 2, 90, ['#d6c29a', '#dccaa6'], { a: .5 }), 0, 0, 1, 25.0, 1.0, { quiet: true });
  add('gurdwara', 42, gurdwara, 470, 5706, .95, CUE.faith, 2.5);
  add('nishan', 43, nishan, 812, 5706, .95, 27.0, 1.0, { sway: .006 });
  add('shade', 44, shade, 300, 6130, 1, 30.4, 1.6, { zmax: 2, sway: .003 });
  add('lampbowl', 45, lampBowl, 610, 6132, 1.25, 28.0, .7, { zmax: 2 });
  add('teacher', 46, teacher, 300, 6130, 1, 31.5, 1.6, { zmax: 2 });
  add('f_floor', 47, () => bands(60, 860, 6150, 6200, 2, 70, ['#d6c29a', '#cdb88e'], { a: .5 }), 0, 0, 1, 28.2, .9, { quiet: true });
  // the sea and the ship
  add('s_sky', 50, () => bands(-60, 1140, 6820, 6990, 2, 170, ['#e6dcc6', '#dfe0d6'], { a: .34 }), 0, 0, 1, 35.1, 1.0);
  [['#a9bcc9', 7110], ['#9fb4c4', 7260], ['#8ea8bb', 7420], ['#86a0b5', 7590], ['#7a96ad', 7770], ['#7390a8', 7950], ['#6c8aa3', 8130]].forEach(([col, y], i) =>
    add('sea' + i, 51 + i, () => bands(-80, 1160, y, y + 70, 2, 150, [col], { a: .44 }), 0, 0, 1, 35.4 + i * .25, 1.2, { quiet: i % 3 > 0 }));
  add('waves', 60, () => { const S = []; for (let i = 0; i < 46; i++) { const x = rnd(-20, 1100), y = rnd(7100, 8160); L_(S, x, y, x + rnd(40, 110), y + rnd(-4, 4), rnd(4, 8), pick(['#5f7c95', '#587590', '#f1e9da']), { prof: 'leaf', nb: 0, a: rnd(.3, .6), bend: rnd(-8, 8) }); } return S; }, 0, 0, 1, 37.0, 1.6, { quiet: true });
  const sx = monotone([[36.0, 150], [43.4, 880]]), sy = monotone([[36.0, 7400], [43.4, 7590]]);
  add('ship', 61, ship, 0, 0, 1, CUE.sea + .2, 1.5, { move: t => [sx(t), sy(t) + Math.sin(t * 1.3) * 5] });
  END.route = t => { const p = seg(t, 37.2, 43.4); if (p <= 0) return; const x1 = sx(t) - 250, n = 26; ctx.save(); ctx.setLineDash([22, 18]); ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = rgba(SAFFRON, .8); ctx.beginPath(); for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(-40, x1, u), tt = 36 + (x + 250 - 150) / (880 - 150) * 7.4, y = lerp(7400, 7590, clamp((tt - 36) / 7.4)) - 12 + Math.sin(x * .011) * 7; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); };
  EV.push({ t: CUE.sea + 1.2, type: 'horn' });
  // Calcutta: haze, a far waterfront, palms, the moored ship, the quay, the men waiting, the man
  add('c_sky', 70, () => bands(-60, 1140, 8700, 8960, 3, 180, ['#edd6b2', '#ead9bb'], { a: .36 }), 0, 0, 1, 42.7, 1.1);
  add('skyline', 71, skyline, 560, 9150, 1.1, 42.9, 1.5, { a: .9 });
  add('palm1', 72, () => palm(330), 940, 9420, 1, 43.4, 1.1, { sway: .006, quiet: true });
  add('palm2', 73, () => palm(250), 1010, 9430, 1, 43.6, 1.1, { sway: .007, quiet: true });
  add('c_water', 74, () => bands(-80, 1160, 9270, 9390, 2, 120, ['#a9ab8e', '#b2b498'], { a: .42 }), 0, 0, 1, 43.0, 1.1, { quiet: true });
  add('ship2', 75, ship, 30, 9404, 1.25, 43.1, 1.3, { zmax: 1.4 });
  add('quay', 76, quay, 540, 9450, 1, 43.3, 1.1, { zmax: 1.4 });
  add('sold1', 77, soldier, 800, 9446, .92, 44.4, 1.0, { zmax: 1.4 });
  add('sold2', 78, soldier, 910, 9452, .95, 44.7, 1.0, { zmax: 1.4, quiet: true });
  add('man2', 79, () => figure({ bundle: true, coat: '#59626d', face: 1 }), 540, 9448, 1, 45.4, 1.1, { zmax: 1.4 });
  // the bars: painted over him, one stroke every half beat
  withSeed(90, () => { for (let i = 0; i < NBARS; i++) { const x = 122 + i * 126 + rnd(-8, 8); BARS.push({ s: mk(qcurve(x, 8300, x + rnd(-6, 6), 10300, rnd(-10, 10), 22), 34, INK, { prof: 'even', nb: 7, a: .93, rough: .16 }), t0: CUE.bars + i * BAR_STEP }); } });
  BARS.forEach((b, i) => EV.push({ t: b.t0, type: 'bar', i, pan: (i - 3) / 5 }));
  // after: sixteen years, the lamp, the answer
  TALLY = withSeed(91, () => tally(16));
  for (let i = 0; i < 16; i++) EV.push({ t: 51.9 + i * .125, type: 'tick', i });
  END.dawn = withSeed(92, () => bands(-60, 1140, 800, 1010, 4, 120, [SAFFRON, SAFF2, '#eda145'], { a: .2, amp: 8 }));
  END.bowl = withSeed(93, lampBowl); END.flame = withSeed(94, flame);
  EV.push({ t: 50.4, type: 'mist', dur: 2.2 }, { t: 53.4, type: 'brush', dur: .7, pan: 0, gain: 1 }, { t: 54.0, type: 'brush', dur: 1.4, pan: 0, gain: 1 }, { t: CUE.lamp, type: 'ding' }, { t: CUE.dawn, type: 'ding' });
  EV.push({ t: 55.4, type: 'pen', dur: 1.2, pan: 0 });
  VO.forEach(([id, s, d]) => EV.push({ t: s, type: 'vo', id, dur: d }));
  for (const k in CUE) EV.push({ t: CUE[k], type: 'cue', name: k });
  EV.sort((a, b) => a.t - b.t);
}

// ---------- pieces drawn per frame ----------
function drawPaper(c) {                                // the sheet scrolls with the camera; tiles are mirrored so there is no seam
  setWorld(c);
  const top = c.y - H / 2 / c.z, k = Math.floor(top / H);
  for (let i = k; i <= k + 1; i++) for (let j = -1; j <= 1; j++) {
    ctx.save(); ctx.translate(j * W, i * H);
    if (j & 1) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    if (i & 1) { ctx.translate(0, H); ctx.scale(1, -1); }
    ctx.drawImage(PAPER_IMG, 0, 0, W, H + 1); ctx.restore();
  }
}
function paperScreen() { ctx.drawImage(PAPER_IMG, 0, 0); }
function vignette() {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .72); g.addColorStop(0, 'rgba(120,96,60,0)'); g.addColorStop(1, 'rgba(120,96,60,.10)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function glow(x, y, r, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(SAFF2, a)); g.addColorStop(.45, rgba(SAFFRON, a * .45)); g.addColorStop(1, rgba(SAFFRON, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
function drawFlame(L, x, y, sc, t, t0) {
  const p = seg(t, t0, t0 + .5); if (p <= 0) return;
  const fl = 1 + .05 * Math.sin(t * 9.3) + .04 * Math.sin(t * 15.1), sk = .05 * Math.sin(t * 3.1) + .03 * Math.sin(t * 7.7);
  glow(x, y - 80 * sc, 250 * sc * (.94 + .06 * Math.sin(t * 5.2)), .34 * ss(p));
  ctx.save(); ctx.translate(x, y); ctx.transform(sc, 0, -sk * sc, sc * fl, 0, 0); drawList(ctx, L, eo(p) >= 1 ? 1 : eo(p)); ctx.restore();
}
function drawNotes(t) {
  for (const [id, txt, size, x, y, t0, d, align, ld] of NOTES) {
    if (t < t0 - .4) continue;
    if (ld) leader(ld[0], ld[1], ld[2], ld[3], seg(t, t0 - .35, t0 + .2), ld[4]);
    text(id, txt, HAND(size, id[0] === 'q' ? 600 : 500), x, y, seg(t, t0, t0 + d), { align, h: size * .5 });
  }
  // the newspaper's own type, rotated with the sheet
  const pm = seg(t, CUE.party, CUE.party + .8);
  if (pm > 0) { ctx.save(); ctx.translate(540, 4000); ctx.rotate(-.035);
    text('mast', 'Ghadar', SERIF(170, true), 0, -262, pm, { align: 'center', h: 80, halo: 0, a: .88 });
    text('mast2', 'THE GHADAR PARTY · 1913', MONO(24), 0, -126, seg(t, 18.9, 19.5), { align: 'center', h: 16, track: 4, halo: 0, a: .8 });
    ctx.restore(); }
}
function drawMist(t) {
  const c = eio(seg(t, 50.4, 52.6)); if (c <= 0) return;
  for (const [lift, a] of [[170, .55], [0, 1]]) {
    const top = H + 140 - c * (H + 520) - lift;
    ctx.save(); ctx.beginPath(); ctx.moveTo(-10, H + 20);
    for (let x = -10; x <= W + 40; x += 40) ctx.lineTo(x, top + (vnoise(x * .006 + lift) - .5) * 190 + Math.sin(x * .01 + t) * 14);
    ctx.lineTo(W + 10, H + 20); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; paperScreen(); ctx.restore();
  }
}
function drawEnding(t) {
  if (t < 51.5) return;
  const z = 1 + .06 * eio(seg(t, 53.4, DUR_FILM)), LX = 540, LY = 1060;
  ctx.save(); ctx.translate(LX, LY - 80); ctx.scale(z, z); ctx.translate(-LX, -(LY - 80));
  // sixteen strokes
  ctx.save(); ctx.translate(540 - 341, 520);
  TALLY.forEach((s, i) => drawS(ctx, s, seg(t, 51.9 + i * .125, 51.9 + i * .125 + .16)));
  ctx.restore();
  text('yrs', '1914 — 1930', MONO(30), 540, 650, seg(t, 52.4, 53.0), { align: 'center', h: 18, track: 6, a: .8 });
  // dawn, lamp
  drawList(ctx, END.dawn, eio(seg(t, CUE.dawn, CUE.dawn + 1.6)));
  ctx.save(); ctx.translate(LX, LY); ctx.scale(1.9, 1.9); drawList(ctx, END.bowl, seg(t, 53.3, 54.0)); ctx.restore();
  drawFlame(END.flame, LX, LY, 1.9, t, CUE.dawn);
  text('ans', 'because freedom was his prayer', HAND(66, 600), 540, 1180, seg(t, 55.4, 56.6), { align: 'center', h: 34 });
  text('name', 'Baba Sohan Singh Bhakna', SERIF(58), 540, 1262, seg(t, 56.8, 57.4), { align: 'center', h: 30, fade: true });
  text('dates', '1870 — 1968', MONO(26), 540, 1316, seg(t, 57.3, 57.9), { align: 'center', h: 16, track: 6, a: .8, fade: true });
  ctx.restore();
}
// ---------- subtitles: on the paper, above the app's bottom interface ----------
function wrap(txt, maxW) {
  if (ctx.measureText(txt).width <= maxW) return [txt];
  const words = txt.split(' '); let best = null;
  for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width); if (!best || m < best[0]) best = [m, a, b]; }
  return [best[1], best[2]];
}
const fade2 = (t, a, b, fi = .25, fo = .35) => ss(seg(t, a, a + fi)) * (1 - ss(seg(t, b - fo, b)));
function drawSubs(t) {
  for (const [, s, d, en] of VO) {
    const f = fade2(t, s - .15, s + d + .6); if (f <= 0) continue;
    ctx.save(); ctx.globalAlpha = f * .86; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = rgba(PAPER, 1); ctx.shadowBlur = 20; ctx.font = SERIF(50, true);
    const lines = wrap(en, 940), y0 = lines.length > 1 ? 1418 : 1448;
    for (let k = 0; k < 3; k++) { ctx.fillStyle = INK; lines.forEach((ln, i) => ctx.fillText(ln, 540, y0 + i * 58)); }
    ctx.restore();
  }
}

// ---------- the frame ----------
function render(t) {
  FRAME_TEXTS = [];
  const c = cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  drawPaper(c);
  setWorld(c);
  const top = c.y - H / 2 / c.z - 400, bot = c.y + H / 2 / c.z + 400;
  for (const ob of OBJ) {
    if (t < ob.t0) continue;
    if (ob.y && (ob.y < top - 900 || ob.y > bot + 900)) continue;
    if (ob.name === 'ship') END.route(t);
    drawObj(ob, t);
    if (ob.name === 'lampbowl') drawFlame(END.flame, 610, 6132, 1.25, t, CUE.lamp);
  }
  drawNotes(t);
  for (const b of BARS) drawS(ctx, b.s, eo(seg(t, b.t0, b.t0 + .4)));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawMist(t);
  drawEnding(t);
  vignette();
  drawSubs(t);
}
window.render = render;
window.TEXTS = t => { render(t); return FRAME_TEXTS.map(x => ({ ...x })); };
(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['500 50px Caveat', '600 50px Caveat', '500 50px "Cormorant Garamond"', 'italic 500 50px "Cormorant Garamond"', '400 20px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
  build();
  window.EV = EV;
  window.READY = true;
})();

// Things that get painted: every generator returns a list of strokes in local coordinates (base at 0,0, y up = negative).
const SAFFRON = '#e2862a', SAFF2 = '#f3bd5c';
const L_ = (S, x0, y0, x1, y1, w, col, o = {}) => { const s = mk(qcurve(x0, y0, x1, y1, o.bend || 0, o.n || 10), w, col, o); S.push(s); return s; };

function pine(h, cols = ['#3f5a4a', '#4d6b55', '#35503f']) {
  const S = [], tr = L_(S, 0, 0, rnd(-6, 6), -h, h * .05, '#5a4636', { prof: 'trunk', nb: 4, n: 14 });
  S.push(edgeOf(tr, 1, 2.2, INK2, .7));
  const N = 13;
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1), y = -h * (.22 + .76 * s), len = lerp(h * .25, h * .035, s) * rnd(.85, 1.1);
    for (const sd of [-1, 1]) L_(S, 0, y, sd * len, y + len * rnd(.28, .42), len * .34, pick(cols), { prof: 'leaf', bend: sd * len * .12, a: rnd(.7, .92), rough: .3, nb: 4 });
  }
  L_(S, 0, -h * .96, 0, -h * 1.05, h * .03, cols[0], { prof: 'tip', nb: 0 });
  return S;
}
function washBand(x0, x1, y, w, cols, o = {}) {       // one wide horizontal brush pass, slightly wavy
  const S = [], n = 18, pts = []; const ph = rnd(0, 9), amp = o.amp ?? w * .12;
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(x0, x1, u), y + Math.sin(u * 5 + ph) * amp + (o.rise || 0) * Math.sin(u * Math.PI)]); }
  S.push(mk(pts, w, pick(cols), { prof: 'even', nb: o.nb ?? 8, a: o.a ?? .5, rough: .28, rib: .7 }));
  return S;
}
function bands(x0, x1, y0, y1, n, w, cols, o = {}) {  // a wash made of n overlapping passes, alternating direction
  const S = [];
  for (let i = 0; i < n; i++) { const y = lerp(y0, y1, n > 1 ? i / (n - 1) : 0), flip = i % 2; S.push(...washBand(flip ? x1 : x0, flip ? x0 : x1, y, w * rnd(.9, 1.1), cols, o)); }
  return S;
}
function shed() {
  const S = [];
  for (let i = 0; i < 7; i++) { const x = -168 + i * 56; L_(S, x, -212 + i * 6, x + rnd(-3, 3), 6, 84, pick(['#b0906a', '#a98862', '#b89a74']), { prof: 'even', a: .72, nb: 7 }); }
  const rf = L_(S, -222, -262, 222, -196, 50, '#6a655f', { prof: 'even', nb: 8, a: .85 });
  S.push(edgeOf(rf, 1, 2.4, INK, .75));
  L_(S, 70, -128, 70, 0, 62, '#4a3b30', { prof: 'even', a: .85, nb: 5 });
  L_(S, -100, -150, -100, -92, 54, '#5d5a58', { prof: 'even', a: .7, nb: 4 });
  L_(S, -146, -258, -148, -372, 30, '#7a5a48', { prof: 'even', nb: 4 });
  clump(S, -120, -440, 48, 12, ['#b3aea6', '#c6c1b8', '#a39e97'], { l0: 26, l1: 56, w0: 18, w1: 36, a0: .22, a1: .42, dir: -.6, spread: .7 });
  return S;
}
function lumber() {
  const S = [];
  for (let r = 0; r < 5; r++) for (let k = 0; k < 2; k++) {
    const y = -12 - r * 22, x0 = -150 + r * 6 + rnd(-8, 8), x1 = 140 - r * 4 + rnd(-8, 8);
    if (k === 0) L_(S, x0, y, x1, y - 2, 19, pick(['#d6b77e', '#c9a66b', '#dcc38f']), { prof: 'even', nb: 5, a: .88 });
    else L_(S, x0, y + 9, x1, y + 7, 2, '#7a5f3e', { prof: 'even', nb: 0, a: .6 });
  }
  return S;
}
// a small brush figure, 300 tall. o: coat, plank, bundle, beard, turban, face (+1 looks right)
function figure(o = {}) {
  const S = [], coat = o.coat || '#66727f', f = o.face ?? 1;
  L_(S, -15, -122, -19, 0, 24, '#4a4038', { prof: 'even', nb: 3 }); L_(S, 15, -122, 17, 0, 24, '#4a4038', { prof: 'even', nb: 3 });
  L_(S, -22, -4, -34 + f * 20, -2, 12, INK, { prof: 'even', nb: 0 }); L_(S, 12, -4, 2 + f * 22, -2, 12, INK, { prof: 'even', nb: 0 });
  const b = L_(S, 0, -238, 0, -96, 84, coat, { prof: 'even', nb: 8, a: .9 });
  S.push(edgeOf(b, -f, 3, INK2, .6));
  L_(S, -f * 34, -228, -f * 46, -128, 22, coat, { prof: 'tip', nb: 3, bend: -f * 6 });
  if (o.plank) { L_(S, f * 32, -228, f * 54, -268, 22, coat, { prof: 'even', nb: 3 }); L_(S, -150, -262, 170, -292, 17, '#d6b77e', { prof: 'even', nb: 5 }); L_(S, -150, -253, 170, -283, 2, '#7a5f3e', { prof: 'even', nb: 0, a: .6 }); }
  else L_(S, f * 34, -228, f * 44, -130, 22, coat, { prof: 'tip', nb: 3, bend: f * 6 });
  if (o.bundle) { L_(S, f * 30, -128, f * 62, -96, 44, '#b99a63', { prof: 'leaf', nb: 4 }); }
  L_(S, -2, -280, 0, -246, 44, '#b98a5e', { prof: 'leaf', nb: 0, a: .95 });
  L_(S, f * 2, -262, f * 8, -216, 36, o.beard || '#2b2520', { prof: 'leaf', nb: 4, a: .9 });
  const tb = o.turban || '#39507a';
  L_(S, -26, -280, 26, -284, 22, tb, { prof: 'leaf', bend: -16, nb: 4 });
  L_(S, -22, -292, 22, -298, 20, tb, { prof: 'leaf', bend: -14, nb: 4 });
  L_(S, -f * 18, -300, f * 14, -316, 14, mixc(tb, '#000000', .18), { prof: 'leaf', bend: -6, nb: 0 });
  return S;
}
function soldier() {
  const S = [], k = '#8c7c52';
  L_(S, -13, -120, -15, 0, 22, '#75683f', { prof: 'even', nb: 3 }); L_(S, 13, -120, 15, 0, 22, '#75683f', { prof: 'even', nb: 3 });
  L_(S, -20, -4, -42, -2, 12, INK, { prof: 'even', nb: 0 }); L_(S, 10, -4, -12, -2, 12, INK, { prof: 'even', nb: 0 });
  const b = L_(S, 0, -236, 0, -104, 70, k, { prof: 'even', nb: 7, a: .9 }); S.push(edgeOf(b, 1, 3, INK2, .6));
  L_(S, -30, -226, -52, -150, 20, k, { prof: 'tip', nb: 3 });
  L_(S, -18, -104, 18, -106, 10, '#5a4a30', { prof: 'even', nb: 0 });
  L_(S, 0, -276, 0, -246, 38, '#d2a583', { prof: 'leaf', nb: 0 });
  L_(S, -30, -282, 30, -282, 26, '#d9d0b8', { prof: 'leaf', bend: -20, nb: 3 }); L_(S, -36, -272, 30, -272, 7, '#b8ad92', { prof: 'even', nb: 0 });
  L_(S, -58, -70, -40, -330, 5, INK, { prof: 'even', nb: 0 }); L_(S, -40, -330, -38, -362, 2.4, INK, { prof: 'even', nb: 0 });
  return S;
}
function teacher() {      // seated, in white: read against the shade behind him
  const S = [], wh = '#d5d8d6', sh = '#9aa3a6';
  const lg = L_(S, -104, -24, 104, -24, 56, wh, { prof: 'leaf', nb: 5, a: .9, bend: 8 }); S.push(edgeOf(lg, 1, 3, sh, .8));
  const b = L_(S, 0, -168, 0, -40, 104, wh, { prof: 'even', nb: 8, a: .9 }); S.push(edgeOf(b, -1, 3, sh, .8), edgeOf(b, 1, 3, sh, .7));
  L_(S, -44, -150, -70, -52, 24, wh, { prof: 'tip', nb: 3 }); L_(S, 44, -150, 66, -52, 24, wh, { prof: 'tip', nb: 3 });
  L_(S, -66, -50, -30, -44, 3, sh, { prof: 'even', nb: 0 });
  L_(S, 0, -212, 0, -178, 44, '#b98a5e', { prof: 'leaf', nb: 0, a: .95 });
  L_(S, 0, -192, 0, -128, 44, '#c9c6bd', { prof: 'leaf', nb: 4, a: .95 }); L_(S, -8, -186, -6, -136, 3, sh, { prof: 'even', nb: 0, a: .6 });
  const t1 = L_(S, -30, -214, 30, -214, 26, wh, { prof: 'leaf', bend: -18, nb: 4 }); S.push(edgeOf(t1, -1, 2.4, sh, .8));
  L_(S, -24, -228, 24, -230, 18, wh, { prof: 'leaf', bend: -10, nb: 3 });
  return S;
}
function shade() {        // tree shade behind the teacher
  const S = [];
  const tr = L_(S, 110, 0, 86, -330, 44, '#6b5a45', { prof: 'trunk', nb: 6, bend: 20 }); S.push(edgeOf(tr, 1, 3, INK2, .6));
  S.push(...bands(-170, 210, -250, -30, 4, 96, ['#86997a', '#93a686', '#7b8f72'], { a: .42 }));
  clump(S, 40, -400, 150, 46, ['#5e7a4e', '#6f8b5c', '#4f6b45'], { l0: 28, l1: 60, w0: 16, w1: 34, a0: .5, a1: .85, sx: 1.5, sy: .6 });
  return S;
}
function dome(S, cx, by, r, col, col2) {
  const pr = [.72, .93, 1, .97, .88, .74, .56, .38, .21, .09];
  pr.forEach((p, k) => { const y = by - k * r * .165, hw = p * r; L_(S, cx - hw, y, cx + hw, y, r * .2, k % 3 === 2 ? col2 : col, { prof: 'leaf', nb: 3, a: .9, bend: -r * .04 }); });
  L_(S, cx, by - r * 1.62, cx, by - r * 2.05, 3.4, INK2, { prof: 'even', nb: 0 });
  L_(S, cx - 5, by - r * 1.78, cx + 5, by - r * 1.78, 9, col2, { prof: 'leaf', nb: 0 });
}
function gurdwara() {
  const S = [], wall = ['#e3d5b9', '#dccdaf', '#e7dabf'];
  L_(S, -300, -8, 300, -8, 24, '#cbbca0', { prof: 'even', nb: 6 });
  for (let i = 0; i < 7; i++) { const x = -240 + i * 80; L_(S, x, -252, x, -18, 88, pick(wall), { prof: 'even', a: .66, nb: 7 }); }
  const c1 = L_(S, -268, -258, 268, -258, 15, '#b59c76', { prof: 'even', nb: 4 }); S.push(edgeOf(c1, 1, 2, INK2, .5));
  for (const [x, h, w] of [[-160, 150, 56], [0, 184, 70], [160, 150, 56]]) { L_(S, x, -h, x, -14, w * .62, '#4d5a70', { prof: 'even', a: .85, nb: 4, rough: .1 }); L_(S, x - w * .3, -h + 4, x + w * .3, -h + 4, w * .34, '#4d5a70', { prof: 'leaf', bend: -w * .34, nb: 0, a: .85 }); }
  for (let i = 0; i < 4; i++) { const x = -111 + i * 74; L_(S, x, -402, x, -266, 80, pick(wall), { prof: 'even', a: .66, nb: 6 }); }
  const c2 = L_(S, -134, -406, 134, -406, 11, '#b59c76', { prof: 'even', nb: 3 }); S.push(edgeOf(c2, 1, 2, INK2, .5));
  for (const x of [-74, 0, 74]) L_(S, x, -362, x, -300, 26, '#5d6a80', { prof: 'leaf', nb: 0, a: .75 });
  dome(S, 0, -420, 104, '#d9b25c', '#bb9240');
  for (const x of [-214, 214]) { L_(S, x - 22, -300, x - 22, -264, 5, '#b59c76', { prof: 'even', nb: 0 }); L_(S, x + 22, -300, x + 22, -264, 5, '#b59c76', { prof: 'even', nb: 0 }); dome(S, x, -304, 36, '#d9b25c', '#bb9240'); }
  return S;
}
function nishan() {       // the flagpole and saffron flag of a gurdwara
  const S = [];
  L_(S, 0, 0, 0, -690, 10, SAFFRON, { prof: 'even', nb: 3, a: .9 });
  L_(S, -22, -6, 22, -6, 16, '#cbbca0', { prof: 'even', nb: 0 });
  L_(S, 4, -684, 118, -648, 34, SAFFRON, { prof: 'tip', nb: 5 }); L_(S, 4, -660, 84, -640, 22, SAFFRON, { prof: 'tip', nb: 3, a: .8 });
  L_(S, -7, -694, 7, -694, 8, SAFF2, { prof: 'leaf', nb: 0 });
  return S;
}
function lampBowl() {
  const S = [];
  const b = L_(S, -50, -38, 50, -38, 32, '#a5583a', { prof: 'leaf', bend: 26, nb: 5 }); S.push(edgeOf(b, 1, 2.6, '#6e3622', .8));
  L_(S, -22, -6, 22, -6, 12, '#8f4a30', { prof: 'even', nb: 0 });
  L_(S, -40, -44, 40, -44, 5, '#c98d5c', { prof: 'leaf', nb: 0, a: .8 });
  return S;
}
function flame() {
  const S = [];
  L_(S, 0, -42, 5, -128, 38, SAFFRON, { prof: 'leaf', nb: 4, bend: 6 });
  L_(S, 0, -46, 2, -96, 16, SAFF2, { prof: 'leaf', nb: 0 });
  return S;
}
function ship() {
  const S = [];
  const h = L_(S, -232, -28, 216, -32, 54, '#333a45', { prof: 'even', nb: 8, a: .92, n: 16 }); S.push(edgeOf(h, -1, 2.4, INK, .7));
  L_(S, 204, -20, 268, -64, 30, '#333a45', { prof: 'tip', nb: 4 });
  L_(S, -228, -5, 228, -7, 9, '#8d4a36', { prof: 'even', nb: 2 });
  const d = L_(S, -134, -72, 112, -74, 36, '#d6cfbf', { prof: 'even', nb: 5, a: .9 }); S.push(edgeOf(d, -1, 2, INK2, .6));
  for (let i = 0; i < 6; i++) L_(S, -112 + i * 38, -78, -112 + i * 38, -68, 7, '#4d5a70', { prof: 'even', nb: 0, a: .8 });
  for (const x of [-52, 30]) { L_(S, x, -90, x - 7, -176, 32, '#3a3530', { prof: 'even', nb: 5 }); L_(S, x - 20, -160, x + 8, -162, 8, '#8d4a36', { prof: 'even', nb: 0 }); }
  L_(S, -182, -52, -186, -206, 4, INK, { prof: 'even', nb: 0 }); L_(S, 170, -54, 168, -196, 4, INK, { prof: 'even', nb: 0 });
  L_(S, -186, -200, -60, -176, 1.6, INK, { prof: 'even', nb: 0, a: .6 }); L_(S, 168, -190, 30, -168, 1.6, INK, { prof: 'even', nb: 0, a: .6 });
  clump(S, -150, -232, 78, 16, ['#8f8a84', '#a9a49c', '#7d7873'], { l0: 34, l1: 78, w0: 20, w1: 44, a0: .2, a1: .46, dir: Math.PI - .15, spread: .4, sx: 1.7, sy: .5 });
  return S;
}
function palm(h) {
  const S = [], tx = 22;
  L_(S, 0, 0, tx, -h, h * .06, '#6b5a45', { prof: 'trunk', nb: 4, bend: 14 });
  for (let i = 0; i < 8; i++) { const a = -Math.PI * (.08 + .84 * i / 7) + rnd(-.08, .08), len = h * rnd(.34, .46); L_(S, tx, -h, tx + Math.cos(a) * len, -h + Math.sin(a) * len * .7 + len * .22, h * .07, pick(['#5e7a4e', '#6f8b5c', '#4f6b45']), { prof: 'leaf', nb: 3, bend: Math.cos(a) * len * .25, a: .85 }); }
  return S;
}
function skyline() {      // a far colonial waterfront: long arcaded block, one dome, two towers
  const S = [], c = ['#b9aaa6', '#c3b5ae', '#ada09e'];
  S.push(...bands(-520, 520, -70, -20, 2, 84, c, { a: .5, amp: 3 }));
  for (let i = 0; i < 15; i++) L_(S, -470 + i * 67, -66, -470 + i * 67, -14, 15, '#8a7f86', { prof: 'leaf', nb: 0, a: .5 });
  S.push(...bands(-120, 120, -150, -110, 2, 60, c, { a: .5, amp: 2 }));
  dome(S, 0, -176, 62, '#a99a9b', '#93868c');
  for (const x of [-330, 340]) { L_(S, x, -210, x, -100, 44, pick(c), { prof: 'even', a: .55, nb: 4 }); L_(S, x - 20, -214, x + 20, -214, 30, '#93868c', { prof: 'leaf', bend: -16, nb: 0, a: .7 }); }
  return S;
}
function quay() {
  const S = [];
  const q = L_(S, -620, 6, 620, 2, 46, '#8c7257', { prof: 'even', nb: 8, a: .9, n: 20 }); S.push(edgeOf(q, -1, 2.6, INK2, .7));
  S.push(...bands(-620, 620, 60, 110, 2, 70, ['#9b8468', '#a48d70'], { a: .5, amp: 3 }));
  for (let i = 0; i < 9; i++) L_(S, -520 + i * 130, 30, -520 + i * 130, 130, 3, INK2, { prof: 'even', nb: 0, a: .45 });
  for (const x of [-260, 300]) { L_(S, x, -4, x, -40, 22, INK, { prof: 'even', nb: 3 }); L_(S, x - 14, -40, x + 14, -40, 10, INK, { prof: 'leaf', nb: 0 }); }
  return S;
}
function seal() {         // a saffron seal, stamped
  const S = [], n = 22;
  const ring = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 - 1.2; ring.push([Math.cos(a) * 62, Math.sin(a) * 62]); }
  S.push(mk(ring, 13, SAFFRON, { prof: 'even', nb: 4, a: .9, rough: .35 }));
  for (let k = 0; k < 5; k++) L_(S, -40 + rnd(-4, 4), -30 + k * 15, 40 + rnd(-4, 4), -30 + k * 15, 9, SAFFRON, { prof: 'even', nb: 3, a: .8, rough: .4 });
  return S;
}
function newsLines(w, rows, gap) {
  const S = [];
  for (let c = 0; c < 2; c++) for (let r = 0; r < rows; r++) {
    const x0 = c ? 18 : -w, x1 = c ? w : -18, y = r * gap, short = r === rows - 1 ? rnd(.4, .7) : 1;
    L_(S, x0, y, lerp(x0, x1, short), y + rnd(-2, 2), 4.2, '#6b6258', { prof: 'even', nb: 2, a: .5, rough: .5, bend: rnd(-2, 2) });
  }
  return S;
}
function sheetEdges(w, h) {
  const S = [], j = () => rnd(-4, 4);
  for (const [a, b, c, d] of [[-w, -h, w, -h], [w, -h, w, h], [w, h, -w, h], [-w, h, -w, -h]]) L_(S, a + j(), b + j(), c + j(), d + j(), 3.2, INK2, { prof: 'even', nb: 0, a: .7, rough: .5, bend: rnd(-5, 5) });
  return S;
}
function tally(n) {       // n prison years, in fives
  const S = [];
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5), k = i % 5, gx = g * 190;
    if (k < 4) L_(S, gx + k * 30 + rnd(-3, 3), -58 + rnd(-5, 5), gx + k * 30 + rnd(-3, 3), 58 + rnd(-5, 5), 9, INK, { prof: 'even', nb: 2, a: .85, rough: .4 });
    else L_(S, gx - 22, 36 + rnd(-5, 5), gx + 112, -40 + rnd(-5, 5), 9, INK, { prof: 'even', nb: 2, a: .85, rough: .4 });
  }
  return S;
}

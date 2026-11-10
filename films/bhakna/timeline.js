// Single source of truth: voice lines, beat grid, cues. Read by film.js (picture) and, through events.json, by mix.py.
const BEAT = 0.9, BAR = 3.6;                       // 66.7 bpm, 4/4
const DUR_FILM = 61.2;                             // 17 bars, in score time
// The picture and the score are written in score time. The film plays them through this map (film time -> score time),
// one stretch per scene, so each scene lasts as long as its narration needs.
const WARP = [[0, 0], [6.6, 4.2], [13.7, 10.8], [21.0, 17.0], [28.8, 24.0], [36.4, 31.5], [42.3, 35.8], [51.1, 43.0], [58.3, 50.2], [64.9, 55.0], [73.3, 61.2]];
const _pw = (P, x, i, o) => { if (x <= P[0][i]) return P[0][o]; for (let k = 1; k < P.length; k++) if (x <= P[k][i]) return P[k - 1][o] + (x - P[k - 1][i]) / (P[k][i] - P[k - 1][i]) * (P[k][o] - P[k - 1][o]); return P[P.length - 1][o]; };
const toScore = T => _pw(WARP, T, 0, 1), toFilm = s => _pw(WARP, s, 1, 0);
// id, start (film time), measured length, subtitle
const VO = [
  ['v01', 0.5, 5.709, 'ਗੁਰੂ ਨਾਨਕ ਦਾ ਬਚਨ ਹੈ: ਜੇ ਪ੍ਰੇਮ ਦੀ ਖੇਡ ਖੇਡਣੀ ਹੈ, ਤਾਂ ਸਿਰ ਤਲੀ ਉੱਤੇ ਰੱਖ ਕੇ ਆ।'],
  ['v02', 6.8, 6.524, 'ਅਮਰੀਕਾ, ਓਰੇਗਨ। ਪੰਜਾਬ ਦਾ ਇੱਕ ਕਿਸਾਨ, ਸੋਹਣ ਸਿੰਘ ਭਕਨਾ, ਆਰਾ ਮਿੱਲ ਵਿੱਚ ਲੱਕੜਾਂ ਢੋਂਦਾ ਹੈ।'],
  ['v03', 13.9, 6.72, 'ਇੱਥੇ ਉਸ ਨੂੰ ਤਾਅਨਾ ਮਿਲਦਾ ਹੈ: ਤੂੰ ਗ਼ੁਲਾਮ ਮੁਲਕ ਦਾ ਬੰਦਾ ਹੈਂ। ਇਹੀ ਚੋਟ ਉਸ ਦੀ ਅੱਗ ਬਣ ਜਾਂਦੀ ਹੈ।'],
  ['v04', 21.2, 6.712, '1913 ਵਿੱਚ ਮਜ਼ਦੂਰ ਗ਼ਦਰ ਪਾਰਟੀ ਬਣਾਉਂਦੇ ਹਨ, ਅਤੇ ਉਸ ਨੂੰ ਪਹਿਲਾ ਪ੍ਰਧਾਨ ਚੁਣਦੇ ਹਨ।'],
  ['v05', 29.0, 6.945, 'ਉਹ ਕਿਸੇ ਮੂਰਤੀ ਅੱਗੇ ਨਹੀਂ ਝੁਕਦਾ। ਉਸ ਦਾ ਸਿਰ ਸਿਰਫ਼ ਗੁਰੂ ਦੇ ਸ਼ਬਦ ਅੱਗੇ ਝੁਕਦਾ ਹੈ: ਜ਼ੁਲਮ ਅੱਗੇ ਡਟ ਜਾ।'],
  ['v06', 36.6, 5.432, 'ਬਾਬਾ ਕੇਸਰ ਸਿੰਘ ਨੇ ਉਸ ਨੂੰ ਸਿਖਾਇਆ ਸੀ: ਆਪਣੇ ਲਈ ਨਹੀਂ, ਦੂਜਿਆਂ ਲਈ ਜੀਓ।'],
  ['v07', 42.5, 8.319, '1914। ਜੰਗ ਛਿੜਦੀ ਹੈ, ਅਤੇ ਉਹ ਸਭ ਕੁਝ ਛੱਡ ਕੇ ਵਤਨ ਵੱਲ ਜਹਾਜ਼ ਚੜ੍ਹ ਜਾਂਦਾ ਹੈ। ਸਿਰ ਤਲੀ ਉੱਤੇ ਰੱਖ ਕੇ।'],
  ['v08', 51.7, 5.581, 'ਕਲਕੱਤੇ ਅੰਗਰੇਜ਼ ਉਡੀਕ ਰਹੇ ਹਨ। ਜਹਾਜ਼ੋਂ ਉਤਰਦਿਆਂ ਹੀ ਉਹ ਗ੍ਰਿਫ਼ਤਾਰ ਹੋ ਜਾਂਦਾ ਹੈ।'],
  ['v09', 58.5, 6.079, 'ਪਹਿਲਾਂ ਫਾਂਸੀ ਦੀ ਸਜ਼ਾ, ਫਿਰ ਉਮਰ ਕੈਦ। 16 ਸਾਲ ਜੇਲ੍ਹ ਵਿੱਚ, ਪਰ ਸਿਰ ਨਹੀਂ ਝੁਕਿਆ।'],
  ['v10', 65.1, 6.466, 'ਉਸ ਨੇ ਆਜ਼ਾਦ ਭਾਰਤ ਵੇਖਿਆ। ਕੁਰਬਾਨੀ ਇਹੀ ਹੈ: ਸਿਰ ਦੇ ਦੇਣਾ, ਪਰ ਸਿਰ ਨਾ ਝੁਕਾਉਣਾ।'],
];
// cues on the grid (bar numbers start at 1)
const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;
const CUE = {
  oregon: bar(2), figure: bar(3), insult: bar(4), party: bar(6), stamp: bar(6, 3), faith: bar(8),
  lamp: bar(9), teacher: bar(10), sea: bar(11), musicOut: bar(13), quay: bar(13), bars: bar(14),
  mist: bar(15), dawn: bar(16), last: bar(17),
};
const NBARS = 7, BAR_STEP = BEAT / 2;              // prison bars: one stroke every half beat

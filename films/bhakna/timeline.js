// Single source of truth: voice lines, beat grid, cues. Read by film.js (picture) and, through events.json, by mix.py.
const BEAT = 0.9, BAR = 3.6;                       // 66.7 bpm, 4/4
const DUR_FILM = 61.2;                             // 17 bars
// id, start, measured length, subtitle
const VO = [
  ['v01', 0.5, 2.922, 'Why would a free man sail home to a prison?'],
  ['v02', 4.5, 5.747, 'Oregon. Sohan Singh Bhakna, a farmer from Punjab, stacks lumber in a sawmill.'],
  ['v03', 11.1, 5.509, 'Here he is taunted as a man from a slave country. The insult becomes his fuel.'],
  ['v04', 17.3, 6.251, 'In 1913 the workers found the Ghadar Party, and choose him as its first president.'],
  ['v05', 24.5, 6.495, 'He bows to no idol. As a Sikh, he bows only to the Guru’s word: stand against tyranny.'],
  ['v06', 31.7, 3.943, 'A saint, Baba Kesar Singh, had taught him to live for others.'],
  ['v07', 36.5, 5.926, 'So in 1914, as war begins, he sails for India to raise a revolt.'],
  ['v08', 44.3, 4.655, 'The British are waiting. He is arrested as his ship reaches Calcutta.'],
  ['v09', 50.0, 4.628, 'Sentenced to death, then to life, he spends 16 years in prison.'],
  ['v10', 55.6, 3.238, 'He never bows. And he lives to see India free.'],
];
// cues on the grid (bar numbers start at 1)
const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;
const CUE = {
  oregon: bar(2), figure: bar(3), insult: bar(4), party: bar(6), stamp: bar(6, 3), faith: bar(8),
  lamp: bar(9), teacher: bar(10), sea: bar(11), musicOut: bar(13), quay: bar(13), bars: bar(14),
  mist: bar(15), dawn: bar(16), last: bar(17),
};
const NBARS = 7, BAR_STEP = BEAT / 2;              // prison bars: one stroke every half beat

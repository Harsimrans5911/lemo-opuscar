// Single source of truth: voice lines, beat grid, cues. Read by film.js (picture) and, through events.json, by mix.py.
const BEAT = 0.9, BAR = 3.6;                       // 66.7 bpm, 4/4
const DUR_FILM = 61.2;                             // 17 bars, in score time
const K = 1.08;                                    // the film runs K times slower than score time, to give the narrator room; VO starts below are in film time
// id, start (film time), measured length, subtitle
const VO = [
  ['v01', 0.5, 3.058, 'Why would a free man sail home to a prison?'],
  ['v02', 4.3, 6.237, 'Oregon. Sohan Singh Bhakna, a farmer from Punjab, stacks lumber in a sawmill.'],
  ['v03', 11.5, 5.753, 'Here he is taunted as a man from a slave country. The insult becomes his fuel.'],
  ['v04', 18.4, 6.549, 'In 1913 the workers found the Ghadar Party, and choose him as its first president.'],
  ['v05', 25.6, 7.795, 'He bows to no idol. As a Sikh, he bows only to the Guru’s word: stand against tyranny.'],
  ['v06', 33.9, 5.792, 'A saint, Baba Kesar Singh, had taught him to live for others.'],
  ['v07', 40.1, 6.022, 'So in 1914, as war begins, he sails for India to raise a revolt.'],
  ['v08', 47.2, 5.765, 'The British are waiting. He is arrested as his ship reaches Calcutta.'],
  ['v09', 54.3, 4.329, 'Sentenced to death, then to life, he spends 16 years in prison.'],
  ['v10', 59.6, 2.965, 'He never bows. And he lives to see India free.'],
];
// cues on the grid (bar numbers start at 1)
const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;
const CUE = {
  oregon: bar(2), figure: bar(3), insult: bar(4), party: bar(6), stamp: bar(6, 3), faith: bar(8),
  lamp: bar(9), teacher: bar(10), sea: bar(11), musicOut: bar(13), quay: bar(13), bars: bar(14),
  mist: bar(15), dawn: bar(16), last: bar(17),
};
const NBARS = 7, BAR_STEP = BEAT / 2;              // prison bars: one stroke every half beat

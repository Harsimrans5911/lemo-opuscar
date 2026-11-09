# Score, foley and voice for "The Voyage Home" -> out/mix.wav. Everything is placed from events.json (exported from the page).
# Run from the library root: .venv/bin/python films/bhakna/mix.py
import os, sys, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(HERE + '/../..')
sys.path.insert(0, LIB)
from core.audio import pluck as P
from core.audio.sfx import SR, add, bp, lp, hp, noise, norm, thump, ding, compress, limit, t_

E = json.load(open(HERE + '/events.json')); DUR = E['dur']; EV = E['ev']
CUE = {e['name']: e['t'] for e in EV if e['type'] == 'cue'}
N = int(DUR * SR) + SR
rng = np.random.default_rng(5)
BEAT, BAR = 0.9, 3.6
bar = lambda n, b=1: (n - 1) * BAR + (b - 1) * BEAT
M = lambda p: P.midi(p)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def padd(a, b):                              # sum two sounds of different lengths
    n = max(len(a), len(b)); o = np.zeros(n); o[:len(a)] += a; o[:len(b)] += b; return o
def fade(x, a=.02, r=.05):
    n = len(x); e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na); e[n - nr:] = np.linspace(1, 0, nr); return x * e
def env_pts(pts, n=N):                       # piecewise-linear envelope from (time, value) points
    return np.interp(np.arange(n) / SR, [p[0] for p in pts], [p[1] for p in pts])

# ---------------- music ----------------
music = np.zeros((N, 2), np.float32)
# drone: a tanpura-like bed on D and A, slow beating partials
def drone(d, notes=((38, 1), (45, .55), (50, .8), (57, .3))):
    t = t_(d); x = np.zeros_like(t)
    for m, g in notes:
        f = hz(m)
        for h in range(1, 9):
            a = g / h ** 1.15 * (1 + .5 * np.sin(2 * np.pi * (.07 * h + .03) * t + h))
            x += a * np.sin(2 * np.pi * f * h * (1 + .0007 * np.sin(2 * np.pi * .21 * t + h)) * t + rng.uniform(0, 6))
    return hp(lp(x, 2600), 70)
dr = norm(drone(DUR + .9), 1.0)
dr_env = env_pts([(0, 0), (2.0, .8), (CUE['faith'], .8), (CUE['faith'] + 1, 1), (CUE['sea'], .9), (CUE['musicOut'] - .5, .9), (CUE['musicOut'] + .3, 0),
                  (CUE['mist'], 0), (CUE['mist'] + 2.4, .9), (CUE['last'] + 1.2, 1), (DUR - .3, .5), (DUR + .5, 0)], len(dr))
dr = dr * dr_env
add(music, dr, 0, .16, -.15); add(music, np.roll(dr, 2400), 0, .13, .2)

def pl(t, pitch, vel=.6, dur=2.4, pan=-.15, bend=None, gain=1.0):
    add(music, P.pluck('nylon_guitar', pitch, dur, vel=vel, **({'bend': bend} if bend else {})), t, .5 * gain, pan)
def drum(t, v=1.0, hi=False):
    if hi: x = fade(bp(noise(.07), 500, 1800) * np.exp(-t_(.07) / .014), .001, .02) * .5
    else: x = padd(thump(.7, 82), .3 * fade(bp(noise(.12), 120, 500) * np.exp(-t_(.12) / .03), .001, .03))
    add(music, x, t, .26 * v, .1)
def flute(t, pitch, d, vel=.5, pan=.25):     # a breathy bamboo flute: few harmonics, breath, late vibrato
    n = int((d + .35) * SR); tt = np.arange(n) / SR; f = hz(M(pitch))
    vib = 1 + .006 * np.sin(2 * np.pi * 5.1 * tt) * np.clip((tt - .35) / .5, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + .28 * np.sin(2 * ph + .4) + .09 * np.sin(3 * ph) + .04 * np.sin(4 * ph)
    br = bp(rng.standard_normal(n), f * 1.6, min(f * 5, 9000)) * .22
    e = np.minimum(1, tt / .11) * np.minimum(1, np.maximum(0, (d + .35 - tt) / .33)) * (.82 + .18 * np.sin(2 * np.pi * .9 * tt + 1))
    add(music, (x + br) * e, t, .13 * vel * 2, pan)

# bar 2: two plain notes under "Oregon"
pl(bar(2), 'D3', .6, 3.2); pl(bar(2, 3), 'A3', .5, 3)
# bars 3-5: Oregon, D minor mode, sparse; a slide into the insult
for (b, bt, p, v) in [(3, 1, 'D4', .62), (3, 3, 'F4', .55), (3, 4, 'E4', .5), (4, 1, 'D4', .6), (4, 3, 'A3', .55), (4, 4.5, 'C4', .45), (5, 1, 'C4', .6), (5, 3, 'D4', .5)]:
    pl(bar(b, bt), p, v, bend=[(.05, -1), (.3, 0)] if (b, bt) == (5, 1) else None)
for b in (3, 4, 5): pl(bar(b), 'D2', .5, 3.4, pan=.1, gain=.9); drum(bar(b), .8); drum(bar(b, 3), .55)
# bars 6-7: the party, a fourth higher and fuller
for (b, bt, p, v) in [(6, 1, 'G4', .7), (6, 2, 'A4', .62), (6, 3, 'C5', .72), (6, 4, 'A4', .58), (7, 1, 'G4', .66), (7, 2, 'F4', .58), (7, 3, 'G4', .62), (7, 4, 'A4', .7)]:
    pl(bar(b, bt), p, v)
for b in (6, 7):
    pl(bar(b), 'G2', .6, 3.4, pan=.1); pl(bar(b, 3), 'D3', .5, 1.6, pan=.1)
    for bt, v, hi in [(1, 1, 0), (2, .5, 1), (2.5, .4, 1), (3, .8, 0), (4, .5, 1)]: drum(bar(b, bt), v, hi)
# bar 8: the drum stops; drone only, one flute breath (first near-silence)
flute(bar(8, 3), 'A4', 1.6, .38)
# bars 9-10: what he bows to. Flute over the drone; the lamp lights on bar 9
flute(bar(9), 'D5', 1.9, .56); flute(bar(9, 3.5), 'C5', .4, .46); flute(bar(9, 4), 'B4', .42, .46); flute(bar(9, 4.5), 'A4', .4, .5)
flute(bar(10), 'A4', 1.3, .52); flute(bar(10, 2.5), 'F4', .4, .44); flute(bar(10, 3), 'G4', .8, .48); flute(bar(10, 4), 'A4', .9, .52)
pl(bar(9), 'D3', .45, 3.4, pan=.1); pl(bar(10), 'D3', .4, 3.4, pan=.1)
# bars 11-12: the voyage, a rolling figure
roll = ['D3', 'A3', 'D4', 'A3', 'F4', 'A3', 'D4', 'A3']
for b, top in ((11, None), (12, 'G4')):
    for i, p in enumerate(roll):
        pl(bar(b) + i * .45, top if (top and i == 4) else p, .5 + (.14 if i % 4 == 0 else 0), 1.6, gain=.9)
    for bt, v, hi in [(1, 1, 0), (2, .45, 1), (3, .8, 0), (3.5, .4, 1), (4, .5, 1)]: drum(bar(b, bt), v, hi)
flute(bar(12), 'A4', 2.6, .44)
# bars 13-14: nothing. The arrest is water and brush only.
# bars 16-17: the same mode turned major
for i, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): pl(bar(16) + i * .3, p, .55 + .03 * i, 3.4)
flute(bar(16, 3), 'F#5', 1.5, .5); flute(bar(16, 4.75), 'E5', .25, .42)
for i, p in enumerate(['D2', 'D3', 'A3', 'D4', 'F#4']): pl(bar(17) + i * .045, p, .66, 4.2)
flute(bar(17), 'D5', 3.0, .54)
# a short soft room on the music
def room(x, rt=1.1, mix=.2):
    n = int(rt * SR); ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / (rt * SR / 6.9))[:, None]; ir = np.stack([lp(ir[:, 0], 5000), lp(ir[:, 1], 5000)], 1)
    from scipy.signal import fftconvolve
    w = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1); w *= np.abs(x).max() / (np.abs(w).max() + 1e-9)
    return x * (1 - mix) + w * mix
music = room(music.astype(np.float64)).astype(np.float32)
bass = np.stack([lp(music[:, c], 120) for c in (0, 1)], 1); music = music - .3 * bass          # keep the low end light

# ---------------- ambience and foley ----------------
fx = np.zeros((N, 2), np.float32)
def bed(x, pts, gain, pan=0):
    add(fx, x * env_pts(pts, len(x)), 0, gain, pan)
long = lambda: rng.standard_normal(N)
room_tone = lp(hp(long(), 120), 900)
bed(norm(room_tone), [(0, .6), (5, .3), (24, .3), (26, .7), (35, .6), (36.5, .2), (50, .2), (52, .7), (DUR, .7)], .012)
wind = bp(long(), 180, 900) * (.6 + .4 * np.sin(2 * np.pi * .11 * np.arange(N) / SR) + .25 * np.sin(2 * np.pi * .31 * np.arange(N) / SR + 1))
bed(norm(wind), [(0, 0), (4.4, 0), (6.5, 1), (11, .9), (13, .45), (16.6, .4), (18.4, 0), (DUR, 0)], .05, -.2)
saw = bp(long(), 1800, 4200) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 38 * np.arange(N) / SR))) * np.clip(np.sin(2 * np.pi * .23 * np.arange(N) / SR), 0, 1) ** 2
bed(norm(saw), [(0, 0), (6.4, 0), (7.5, 1), (10.5, 1), (12, .2), (16, 0), (DUR, 0)], .011, .5)
tt = np.arange(N) / SR
sea = lp(long(), 700) * (.55 + .45 * np.sin(2 * np.pi * .19 * tt) ** 2) + .5 * bp(long(), 900, 3200) * np.clip(np.sin(2 * np.pi * .19 * tt + .6), 0, 1) ** 3
bed(norm(sea), [(0, 0), (34.6, 0), (36.4, .8), (38, 1), (42.6, 1), (44.2, .5), (50.4, .5), (52.6, 0), (DUR, 0)], .085, .1)       # in early under the lamp (J-cut), on over the bars (L-cut)
lap = bp(long(), 300, 1400) * np.clip(np.sin(2 * np.pi * .7 * tt) * np.sin(2 * np.pi * .13 * tt + 1), 0, 1) ** 2
bed(norm(lap), [(0, 0), (43.2, 0), (44.4, 1), (50.4, 1), (52.4, 0), (DUR, 0)], .05, -.3)

def brush(d, v=1.0):                         # paper brush: band-passed noise, light tremolo, pitch falling as the stroke runs out
    n = int(d * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 900, 5200) * (.75 + .25 * np.sin(2 * np.pi * 9 * t + rng.uniform(0, 6)))
    x = x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .6 * (1 - .4 * t / d)
    return fade(x, .03, .08) * v
def pen(d):
    n = int(d * SR); t = np.arange(n) / SR
    g = (np.sin(2 * np.pi * 7.3 * t) > -.2) * (np.sin(2 * np.pi * 2.9 * t + 1) > -.6)
    return fade(bp(rng.standard_normal(n), 2400, 7500) * lp(g.astype(float), 60) * (.7 + .3 * rng.uniform(size=n)), .01, .05)
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'brush':
        d = min(e['dur'], 1.5); x = brush(d, e.get('gain', 1)); n = len(x); pan = float(np.clip(e.get('pan', 0), -.8, .8))
        sweep = np.linspace(-.3, .3, n) + pan; L = x * np.sqrt(np.clip(.5 - sweep / 2, 0, 1)); R = x * np.sqrt(np.clip(.5 + sweep / 2, 0, 1))
        i = int(t * SR); fx[i:i + n, 0] += .075 * L[:N - i]; fx[i:i + n, 1] += .075 * R[:N - i]
    elif ty == 'pen': add(fx, pen(e['dur']), t, .05, float(np.clip(e.get('pan', 0), -.6, .6)))
    elif ty == 'stamp': add(fx, padd(thump(1, 95), .5 * fade(bp(noise(.09), 200, 1600) * np.exp(-t_(.09) / .02), .001, .02)), t, .32, .25)
    elif ty == 'ding':                       # a small brass bowl
        d = 2.6; x = sum(a * np.sin(2 * np.pi * f * t_(d)) * np.exp(-t_(d) / tau) for f, a, tau in [(1174.7, 1, .7), (2362, .45, .4), (3540, .2, .22), (587.3, .3, .9)])
        add(fx, fade(x, .002, .2), t, .11, .1)
    elif ty == 'horn':
        d = 1.7; x = sum(np.sin(2 * np.pi * f * t_(d) + i) / (i + 1) for i, f in enumerate([98, 147, 196, 294])); x = lp(x, 900) * np.minimum(1, t_(d) / .25) * np.minimum(1, (d - t_(d)) / .5)
        add(fx, x, t, .05, -.35)
    elif ty == 'bar':                        # each bar: a wet, heavy brush pass ending in a low thump
        x = brush(.42, 1.3); x = lp(x, 2600); add(fx, x, t, .2, e['pan'])
        add(fx, padd(thump(1, 58 + 2 * e['i']), .35 * fade(bp(noise(.3), 90, 420) * np.exp(-t_(.3) / .09), .002, .05)), t + .3, .4, e['pan'])
    elif ty == 'tick': add(fx, fade(bp(noise(.11), 1500, 5200) * np.exp(-t_(.11) / .04), .004, .03), t, .07, (e['i'] - 8) / 14)
    elif ty == 'mist':
        d = e['dur'] + .8; x = lp(hp(rng.standard_normal(int(d * SR)), 300), 2400) * np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 1.5
        add(fx, x, t - .2, .07, 0)

# ---------------- voice ----------------
vo = np.zeros((N, 2), np.float32); vmask = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    x, sr = sf.read(f"{HERE}/voices/{e['id']}.wav", dtype='float32'); x = soxr.resample(x, sr, SR)
    x = hp(x, 90); x = compress(x, thr=.12, ratio=3.0); rms = np.sqrt(np.mean(x[np.abs(x) > .01] ** 2)); x = limit(x / rms * .1, ceil=.1 * 10 ** (11 / 20))
    i = int(e['t'] * SR); add(vo, x.astype(np.float32), e['t'], 1.0, 0); vmask[i:i + len(x)] = 1
k = int(.3 * SR); duck = np.convolve(vmask, np.hanning(k) / np.hanning(k).sum(), 'same')
# music about 9 dB under the voice while it speaks, 4 dB down under speech
mrms = np.sqrt(np.mean(music[np.abs(music).max(1) > 1e-4] ** 2)); music *= (.1 * 10 ** (-8 / 20)) / mrms
music *= (1 - .38 * duck)[:, None]; fx *= (1 - .2 * duck)[:, None]
mix = vo + music + fx * 1.25
mix = mix[:int(DUR * SR)]
mix[-int(.4 * SR):] *= np.linspace(1, 0, int(.4 * SR))[:, None]
mix *= .89 / np.abs(mix).max()
os.makedirs(HERE + '/out', exist_ok=True)
sf.write(HERE + '/out/mix.wav', mix, SR, subtype='PCM_24')
for name, s in (('voice', vo), ('music', music), ('fx', fx)):
    s = s[:int(DUR * SR)]; print(name, 'rms dB', round(20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9), 1), 'peak', round(float(np.abs(s).max()), 3))
from scipy.signal import welch
f, p = welch(mix.mean(1), SR, nperseg=8192); lo = p[(f > 20) & (f < 120)].sum(); rest = p[f >= 120].sum(); print('20-120 Hz vs rest dB', round(10 * np.log10(lo / rest), 1))
print('wrote out/mix.wav', round(len(mix) / SR, 2), 's')

# Narration with an ElevenLabs voice (online, needs an API key for api.elevenlabs.io). Writes voices/<id>.wav (24 kHz, trimmed) and dur.json.
# usage: ELEVENLABS_API_KEY=... .venv/bin/python films/bhakna/tts_el.py [voice_id]
# Default voice: "Sufi - Wise Punjabi Conversation" (ElevenLabs voice library, Punjabi), model Eleven v3.
import json, os, subprocess, sys
import numpy as np, soundfile as sf
H = os.path.dirname(os.path.abspath(__file__)); OUT = H + '/voices'; os.makedirs(OUT, exist_ok=True)
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'HkrBPy9A2svfb9tZ9YaL'
KEY = os.environ.get('ELEVENLABS_API_KEY', 'proxy-injected')
lines = json.load(open(H + '/tts/lines.json'))
ONLY = [x for x in os.environ.get('ONLY', '').split(',') if x]      # ONLY=v05,v07 regenerates just those lines
dur = json.load(open(OUT + '/dur.json')) if ONLY and os.path.exists(OUT + '/dur.json') else {}
for i, ln in enumerate(lines):
    if ONLY and ln['id'] not in ONLY: continue
    body = {'text': ln['text'], 'model_id': 'eleven_v3', 'language_code': 'pa'}
    mp3 = f"{OUT}/{ln['id']}.mp3"
    r = subprocess.run(['curl', '-sS', '--max-time', '120', '-o', mp3, '-w', '%{http_code}', '-X', 'POST', f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128',
                        '-H', 'Content-Type: application/json', '-H', f'xi-api-key: {KEY}', '-d', json.dumps(body)], capture_output=True, text=True)
    if r.stdout.strip() != '200': sys.exit(f"{ln['id']}: HTTP {r.stdout} {open(mp3, 'rb').read(300)!r}")
    wav = f"{OUT}/{ln['id']}.wav"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', '24000', wav], check=True); os.remove(mp3)
    x, sr = sf.read(wav, dtype='float32'); idx = np.where(np.abs(x) > .01 * np.abs(x).max())[0]
    x = x[max(0, idx[0] - int(.01 * sr)): idx[-1] + int(.1 * sr)]
    # shorten only the long pauses inside a line to 0.42 s, so the film stays near a minute
    w = int(.02 * sr); n = len(x) // w; quiet = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1)) < .036 * np.abs(x).max()
    out, pos, s0, MAX = [], 0, None, 21
    for k, q in enumerate(quiet):
        if q and s0 is None: s0 = k
        if not q and s0 is not None:
            if k - s0 > MAX and s0 > 0: keep = s0 + MAX // 2; out.append(x[pos * w:keep * w]); pos = keep + (k - s0 - MAX)
            s0 = None
    out.append(x[pos * w:]); x = np.concatenate(out); sf.write(wav, x, sr)
    dur[ln['id']] = round(len(x) / sr, 3); print(ln['id'], dur[ln['id']], ln['text'])
json.dump(dur, open(OUT + '/dur.json', 'w'), indent=1)

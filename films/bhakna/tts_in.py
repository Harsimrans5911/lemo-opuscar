# Narration with a Microsoft neural Indian English voice (edge-tts, online). Writes voices/<id>.wav (24 kHz, trimmed) and dur.json.
# usage: .venv/bin/python films/bhakna/tts_in.py [voice] [rate]     (HTTPS_PROXY is used when set)
import asyncio, json, os, subprocess, sys
import numpy as np, soundfile as sf, edge_tts
H = os.path.dirname(os.path.abspath(__file__)); OUT = H + '/voices'; os.makedirs(OUT, exist_ok=True)
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'en-IN-PrabhatNeural'; RATE = sys.argv[2] if len(sys.argv) > 2 else '-4%'
lines = json.load(open(H + '/tts/lines.json')); dur = {}
async def main():
    for ln in lines:
        mp3 = f"{OUT}/{ln['id']}.mp3"
        await edge_tts.Communicate(ln['sub'], VOICE, rate=ln.get('rate', RATE), proxy=os.environ.get('HTTPS_PROXY')).save(mp3)
        wav = f"{OUT}/{ln['id']}.wav"
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', '24000', wav], check=True); os.remove(mp3)
        x, sr = sf.read(wav, dtype='float32'); thr = .01 * np.abs(x).max(); idx = np.where(np.abs(x) > thr)[0]
        x = x[max(0, idx[0] - int(.01 * sr)): idx[-1] + int(.1 * sr)]; sf.write(wav, x, sr)
        dur[ln['id']] = round(len(x) / sr, 3); print(ln['id'], dur[ln['id']], ln['sub'])
    json.dump(dur, open(OUT + '/dur.json', 'w'), indent=1)
asyncio.run(main())

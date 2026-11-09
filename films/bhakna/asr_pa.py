# Speech-to-text check of the Punjabi lines with ElevenLabs Scribe (online). usage: python3 asr_pa.py [voices_dir]
import json, os, re, subprocess, sys, difflib
H = os.path.dirname(os.path.abspath(__file__)); D = sys.argv[1] if len(sys.argv) > 1 else H + '/voices'
KEY = os.environ.get('ELEVENLABS_API_KEY', 'proxy-injected'); bad = 0
norm = lambda s: re.sub(r'[\s।,:.\-"“”?!]+', ' ', s).strip()
for ln in json.load(open(H + '/tts/lines.json')):
    r = subprocess.run(['curl', '-sS', '--max-time', '120', '-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text', '-H', f'xi-api-key: {KEY}',
                        '-F', 'model_id=scribe_v1', '-F', 'language_code=pa', '-F', f"file=@{D}/{ln['id']}.wav"], capture_output=True, text=True)
    heard = json.loads(r.stdout).get('text', r.stdout[:200]); sim = difflib.SequenceMatcher(None, norm(heard), norm(ln['text'])).ratio()
    ok = sim >= .92; bad += not ok; print('ok  ' if ok else 'DIFF', ln['id'], round(sim, 2), '|', heard)
sys.exit(1 if bad else 0)

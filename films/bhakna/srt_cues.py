# Subtitle cues from the VO table in timeline.js -> out/srt_cues.json (Punjabi) and out/srt_cues_en.json (English translation)
import re, json, os
H = os.path.dirname(os.path.abspath(__file__)); s = open(H + '/timeline.js', encoding='utf8').read()
rows = re.findall(r"\['(v\d\d)', ([\d.]+), ([\d.]+), '(.*)'\],", s)
en = {l['id']: l['en'] for l in json.load(open(H + '/tts/lines.json', encoding='utf8'))}
st = [float(r[1]) for r in rows] + [1e9]
os.makedirs(H + '/out', exist_ok=True)
for name, pick in (('srt_cues.json', lambda i, t: t), ('srt_cues_en.json', lambda i, t: en[i])):
    cues = [{'t0': max(0, float(a) - .15), 't1': min(float(a) + float(d) + .6, st[k + 1] - .2), 'text': pick(i, t)} for k, (i, a, d, t) in enumerate(rows)]
    json.dump(cues, open(H + '/out/' + name, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(len(rows), 'cues')

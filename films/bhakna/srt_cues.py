# Subtitle cues from the VO table in timeline.js -> out/srt_cues.json
import re, json, os
H = os.path.dirname(os.path.abspath(__file__)); s = open(H + '/timeline.js').read()
rows = re.findall(r"\['(v\d\d)', ([\d.]+), ([\d.]+), '(.*)'\],", s)
st = [float(r[1]) for r in rows] + [1e9]
cues = [{'t0': max(0, float(a) - .15), 't1': min(float(a) + float(d) + .6, st[i + 1] - .2), 'text': t.replace('\\u2019', '’')} for i, (_, a, d, t) in enumerate(rows)]
os.makedirs(H + '/out', exist_ok=True); json.dump(cues, open(H + '/out/srt_cues.json', 'w'), ensure_ascii=False, indent=1); print(len(cues), 'cues')

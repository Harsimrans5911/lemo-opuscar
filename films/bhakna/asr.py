# Speech-to-text check of the voice lines (whisper base.en through sherpa-onnx, offline).
# usage: .asr/bin/python asr.py lines.json voices_dir
import sys, json, re, os
import numpy as np, soundfile as sf, sherpa_onnx
HERE = os.path.dirname(os.path.abspath(__file__)); M = HERE + '/.asr/model/sherpa-onnx-whisper-base.en/'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + 'base.en-encoder.int8.onnx', decoder=M + 'base.en-decoder.int8.onnx', tokens=M + 'base.en-tokens.txt', language='en', num_threads=4)
norm = lambda s: re.sub(r"[^a-z0-9' ]", ' ', s.lower()).split()
bad = 0
for ln in json.load(open(sys.argv[1])):
    x, sr = sf.read(f"{sys.argv[2]}/{ln['id']}.wav", dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    st = rec.create_stream(); st.accept_waveform(sr, x); rec.decode_stream(st)
    heard = st.result.text.strip(); want = ln.get('asr', ln['text'])
    ok = norm(heard) == norm(want); bad += not ok
    print(('ok  ' if ok else 'DIFF'), ln['id'], '|', heard)
sys.exit(1 if bad else 0)

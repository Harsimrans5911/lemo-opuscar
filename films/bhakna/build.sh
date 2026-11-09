#!/bin/sh
# One command: rebuilds picture, sound, subtitles and the finished film.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
[ -f "$HERE/fonts.css" ] || (cd "$HERE" && node fetch_fonts.mjs)
[ -f "$HERE/paper.jpg" ] || (cd "$HERE" && "$LIB/.venv/bin/python" paper.py)
[ -f "$HERE/voices/v01.wav" ] || "$LIB/.venv/bin/python" "$HERE/tts_in.py" en-IN-PrabhatNeural +5%   # online: Microsoft neural voice
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
"$LIB/.venv/bin/python" "$HERE/srt_cues.py"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/voyage-home.srt"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/voyage-home.mp4" 30 1

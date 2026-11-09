// Download the film's fonts (Google Fonts, OFL) into fonts/ and write fonts.css. Run once: node fetch_fonts.mjs
import fs from 'fs';
const get = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r; };
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams = ['family=Cormorant+Garamond:ital,wght@0,500;1,500', 'family=Caveat:wght@500;600', 'family=IBM+Plex+Mono:wght@400'];
let out = '', n = 0; fs.mkdirSync('fonts', { recursive: true });
for (const f of fams) {
  const css = await (await get(`https://fonts.googleapis.com/css2?${f}&display=block`, { headers: { 'User-Agent': UA } })).text();
  for (const blk of css.split('/*').slice(1)) {
    if (!blk.startsWith(' latin */')) continue;            // Latin slice only
    let b = blk.slice(blk.indexOf('@font-face'));
    const u = b.match(/https:\/\/[^)]+/)[0], name = `f${n++}.woff2`;
    fs.writeFileSync('fonts/' + name, Buffer.from(await (await get(u)).arrayBuffer()));
    out += b.replace(u, 'fonts/' + name).replace(/unicode-range:[^;]*;\s*/, '');
  }
}
fs.writeFileSync('fonts.css', out); console.log('font files', n);

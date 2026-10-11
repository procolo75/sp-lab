// Genera src/fonts.js: i contorni dei caratteri usati per le scritte (licenza SIL OFL).
// Uso: npm install (le librerie sono tra le devDependencies)
//      npm run fonts
import fs from 'fs';
import opentype from 'opentype.js';
const FONTS = [
  ['tondo', 'Fredoka', 'node_modules/@fontsource/fredoka/files/fredoka-latin-600-normal.woff'],
  ['corsivo', 'Pacifico', 'node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff'],
  ['natalizio', 'Mountains of Christmas', 'node_modules/@fontsource/mountains-of-christmas/files/mountains-of-christmas-latin-700-normal.woff', 3],
];
let chars = '';
for (let c = 32; c < 127; c++) chars += String.fromCharCode(c);
chars += 'àèéìòùÀÈÉÌÒÙáíóúçñäöüÄÖÜß’€°';
const out = {};
// contorni appiattiti in segmenti e semplificati (Douglas-Peucker): per i caratteri con bordi molto mossi
function simplified(cmds, tol) {
  const polys = []; let cur = null, x = 0, y = 0;
  const bez = (pts, n, f) => { for (let i = 1; i <= n; i++) cur.push(f(i / n)); };
  for (const c of cmds) {
    if (c.type === 'M') { cur = [[c.x, c.y]]; polys.push(cur); }
    else if (c.type === 'L') cur.push([c.x, c.y]);
    else if (c.type === 'Q') { const [x0, y0] = cur[cur.length - 1]; bez(0, 6, t => { const u = 1 - t; return [u * u * x0 + 2 * u * t * c.x1 + t * t * c.x, u * u * y0 + 2 * u * t * c.y1 + t * t * c.y]; }); }
    else if (c.type === 'C') { const [x0, y0] = cur[cur.length - 1]; bez(0, 8, t => { const u = 1 - t; return [u * u * u * x0 + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x, u * u * u * y0 + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y]; }); }
  }
  const dp = (pts) => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]]; let md = 0, mi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const d = Math.abs(dy * px - dx * py + b[0] * a[1] - b[1] * a[0]) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md <= tol) return [a, b];
    return dp(pts.slice(0, mi + 1)).slice(0, -1).concat(dp(pts.slice(mi)));
  };
  let s = '';
  for (const p of polys) {
    // contorno chiuso: lo divido in due metà, altrimenti inizio e fine coincidono e Douglas-Peucker lo annulla
    const mid = Math.floor(p.length / 2);
    const q = dp(p.slice(0, mid + 1)).slice(0, -1).concat(dp(p.slice(mid))).map(([px, py]) => [Math.round(px), Math.round(-py)]);
    while (q.length > 3 && q[q.length - 1][0] === q[0][0] && q[q.length - 1][1] === q[0][1]) q.pop();
    if (q.length < 3) continue;
    s += 'M' + q[0].join(' ') + q.slice(1).map(v => 'L' + v.join(' ')).join('') + 'Z';
  }
  return s;
}
for (const [id, name, file, simplify] of FONTS) {
  const buf = fs.readFileSync(file);
  const f = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  const g = {};
  for (const ch of chars) {
    const gl = f.charToGlyph(ch);
    if (!gl || gl.index === 0) continue;
    const p = gl.getPath(0, 0, f.unitsPerEm);   // y verso il basso, unità del font
    let s = '';
    if (simplify) { g[ch] = [Math.round(gl.advanceWidth), simplified(p.commands, simplify)]; continue; }
    let lx = null, ly = null;
    for (const c of p.commands) {
      if (c.type === 'L' && Math.round(c.x) === lx && Math.round(-c.y) === ly) continue;   // punto doppio
      if (c.x !== undefined) { lx = Math.round(c.x); ly = Math.round(-c.y); }
      const r = (v) => Math.round(v);
      if (c.type === 'M' || c.type === 'L') s += c.type + r(c.x) + ' ' + r(-c.y);
      else if (c.type === 'Q') s += 'Q' + r(c.x1) + ' ' + r(-c.y1) + ' ' + r(c.x) + ' ' + r(-c.y);
      else if (c.type === 'C') s += 'C' + r(c.x1) + ' ' + r(-c.y1) + ' ' + r(c.x2) + ' ' + r(-c.y2) + ' ' + r(c.x) + ' ' + r(-c.y);
      else if (c.type === 'Z') s += 'Z';
    }
    g[ch] = [Math.round(gl.advanceWidth), s];
  }
  const os2 = f.tables.os2 || {};
  out[id] = { name, upm: f.unitsPerEm, cap: os2.sCapHeight || Math.round(f.unitsPerEm * 0.7), g };
}
const js = '// Generato da tools/make-fonts.mjs: non modificare a mano.\n// Caratteri Fredoka, Pacifico e Mountains of Christmas, licenza SIL Open Font License 1.1.\n(function (root) { root.SPRECOLO_FONTS = ' + JSON.stringify(out) + '; })(typeof globalThis !== "undefined" ? globalThis : this);\n';
fs.writeFileSync('src/fonts.js', js);
console.log(Object.entries(out).map(([k, v]) => `${k}: ${Object.keys(v.g).length} glifi, cap ${v.cap}/${v.upm}`).join('\n'), '\n', (js.length / 1024).toFixed(0) + ' KB');

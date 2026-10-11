// Rigenera src/logos.js dagli STL in assets/: contorno 2D di ogni logo + spessore minimo delle linee.
// Uso: node tools/make-logos.mjs
import fs from 'fs';
import Module from '../node_modules/manifold-3d/manifold.js';
const wasm = await Module(); wasm.setup();
const { CrossSection } = wasm;
const LOGOS = { SP: 'assets/logo-sp.stl', viso: 'assets/logo-volto-40mm.stl' };
const out = {};
for (const [id, file] of Object.entries(LOGOS)) {
  const d = fs.readFileSync(new URL('../' + file, import.meta.url)), n = d.readUInt32LE(80);
  const tris = [];
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50;
    if (d.readFloatLE(o + 8) < 0.5) continue;   // solo le facce rivolte in alto
    const p = []; for (let k = 0; k < 3; k++) p.push([d.readFloatLE(o + 12 + k * 12), d.readFloatLE(o + 16 + k * 12)]);
    const a = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1]);
    if (Math.abs(a) > 1e-9) tris.push(a > 0 ? p : [p[0], p[2], p[1]]);
  }
  let cs = CrossSection.union(tris.map(t => new CrossSection([t], 'Positive'))).offset(0.01, 'Miter').offset(-0.01, 'Miter').simplify(0.005);
  const b = cs.bounds(), H = b.max[1] - b.min[1], W = b.max[0] - b.min[0], A0 = cs.area();
  // spessore minimo delle linee: la più piccola erosione che fa sparire più del 3% dell'area
  let wmin = 0;
  for (let r = 0.02; r < 3; r += 0.01) {
    const e = cs.offset(-r, 'Round').offset(r, 'Round');
    if (e.area() < A0 * 0.97) { wmin = 2 * r; break; }
  }
  // poligoni normalizzati: altezza 1, origine in basso a sinistra
  const polys = cs.toPolygons().map(q => q.map(([x, y]) => [+((x - b.min[0]) / H).toFixed(4), +((y - b.min[1]) / H).toFixed(4)]));
  out[id] = { w: +(W / H).toFixed(4), h0: +H.toFixed(2), wmin: +(wmin / H).toFixed(5), polys };
  console.log(id, 'altezza', H.toFixed(1), 'mm, larghezza', W.toFixed(1), 'mm, linea minima', wmin.toFixed(2), 'mm');
}
fs.writeFileSync(new URL('../src/logos.js', import.meta.url), '// Generato da tools/make-logos.mjs: contorni dei loghi (altezza 1) e spessore minimo delle linee (in frazione dell\'altezza).\n(function (root) { root.SPRECOLO_LOGOS = ' + JSON.stringify(out) + '; })(typeof globalThis !== \'undefined\' ? globalThis : this);\n');

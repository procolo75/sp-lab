// Rigenera src/gusci.js: le cover già fatte (STL in assets/) che il generatore usa così come sono, al posto di quella calcolata.
// Uso: node tools/make-gusci.mjs
// Ogni guscio viene centrato sul telefono (x guardando lo schermo, y verso la cima, z = 0 sul retro esterno, come nel file),
// semplificato (scarto massimo 0,005 mm) e salvato quantizzato a passi di 0,005 mm.
import fs from 'fs';
import Module from '../node_modules/manifold-3d/manifold.js';
const wasm = await Module(); wasm.setup();
const { Manifold, Mesh } = wasm;
// dx, dy: spostamento per mettere il centro del telefono in (0, 0); fondo: z del piano dove appoggia il retro del telefono;
// tasca: z del fondo della tasca della fotocamera; gx, gy, gz: gioco del file originale per lato (larghezza, altezza) e sullo spessore, misurato sull'STL rispetto alle quote
// della scheda tecnica (vedi il commento in telefoni.js); bordo: quanto il labbro copre il vetro (dal contorno del telefono),
// alto: quanto sporge sopra lo schermo
const GUSCI = {
  'motorola-edge-60-neo': { file: 'assets/hardshell-v3-motorola-edge-60-neo.stl', fonte: 'HardShell V3 (flat)', dx: 0.5, dy: 0, fondo: 3.8, tasca: 1.4, gx: 0.1, gy: 0.15, gz: 0, bordo: 1.07, alto: 0.95 },
};
const Q = 0.005, out = {};
for (const [id, g] of Object.entries(GUSCI)) {
  const d = fs.readFileSync(new URL('../' + g.file, import.meta.url)), n = d.readUInt32LE(80);
  const map = new Map(), V = [], I = new Uint32Array(n * 3);
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
    const o = 84 + i * 50 + 12 + k * 12, x = d.readFloatLE(o) + g.dx, y = d.readFloatLE(o + 4) + g.dy, z = d.readFloatLE(o + 8);
    const key = x + ',' + y + ',' + z; let v = map.get(key);
    if (v === undefined) { v = V.length / 3; map.set(key, v); V.push(x, y, z); }
    I[i * 3 + k] = v;
  }
  const mesh = new Mesh({ numProp: 3, vertProperties: new Float32Array(V), triVerts: I }); mesh.merge();
  const m0 = new Manifold(mesh), m = m0.simplify(Q);
  const r = m.getMesh(), nv = r.vertProperties.length / 3;
  const q = new Int16Array(nv * 3);
  for (let i = 0; i < nv * 3; i++) q[i] = Math.round(r.vertProperties[i] / Q);
  if (nv > 65535) throw new Error('troppi vertici');
  const t = Uint16Array.from(r.triVerts);
  // controllo: il guscio ricostruito dai dati salvati deve essere ancora un solido chiuso
  const back = new Manifold(new Mesh({ numProp: 3, vertProperties: Float32Array.from(q, v => v * Q), triVerts: Uint32Array.from(t) }));
  if (back.status() !== 'NoError' && back.status() !== 0) throw new Error('guscio non valido: ' + back.status());
  console.log(id, n, '→', t.length / 3, 'triangoli; volume', m0.volume().toFixed(1), '→', back.volume().toFixed(1), 'mm³');
  const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const { file, dx, dy, ...meta } = g;
  out[id] = { ...meta, q: Q, v: b64(q), t: b64(t) };
}
fs.writeFileSync(new URL('../src/gusci.js', import.meta.url),
  '// Generato da tools/make-gusci.mjs: cover già fatte, usate dal generatore al posto di quella calcolata (vertici int16 × q mm, triangoli uint16, base64).\n' +
  '(function (root) { root.SP_GUSCI = ' + JSON.stringify(out) + '; })(typeof globalThis !== \'undefined\' ? globalThis : this);\n');

// Rigenera src/emoji.js: i disegni Fluent Emoji (Microsoft, licenza MIT) usati da SP Lab.
// Per ogni soggetto salva la versione "Flat" (a colori) e "High Contrast" (a linea),
// già trasformate in poligoni, più la tavolozza ridotta a 4 colori (il più esteso per primo).
// Uso: node tools/make-emoji.mjs
import fs from 'fs';
import { createRequire } from 'module';
import Module from '../node_modules/manifold-3d/manifold.js';
const require = createRequire(import.meta.url);
const S = require('../src/svg.js');
const FLAT = require('@iconify-json/fluent-emoji-flat/icons.json'), HC = require('@iconify-json/fluent-emoji-high-contrast/icons.json');
const wasm = await Module(); wasm.setup();
const { CrossSection } = wasm;

// soggetti scelti: [nome Fluent, nome italiano, gruppo]
const LIST = [
  ['christmas-tree', 'Albero di Natale', 'Natale'], ['santa-claus', 'Babbo Natale', 'Natale'], ['mrs-claus', 'Mamma Natale', 'Natale'],
  ['deer', 'Renna', 'Natale'], ['snowman', 'Pupazzo di neve', 'Natale'], ['snowman-without-snow', 'Pupazzo (senza fiocchi)', 'Natale'],
  ['person-elf', 'Elfo', 'Natale'], ['baby-angel', 'Angelo', 'Natale'], ['bell', 'Campana', 'Natale'], ['wrapped-gift', 'Regalo', 'Natale'],
  ['candle', 'Candela', 'Natale'], ['glowing-star', 'Stella', 'Natale'], ['star', 'Stella semplice', 'Natale'], ['shooting-star', 'Stella cometa', 'Natale'],
  ['sparkles', 'Scintille', 'Natale'], ['sled', 'Slitta', 'Natale'], ['ribbon', 'Fiocco', 'Natale'], ['cookie', 'Biscotto', 'Natale'],
  ['candy', 'Caramella', 'Natale'], ['lollipop', 'Lecca-lecca', 'Natale'], ['teddy-bear', 'Orsetto', 'Natale'], ['nesting-dolls', 'Matrioske', 'Natale'],
  ['church', 'Chiesa', 'Natale'], ['house', 'Casa', 'Natale'], ['house-with-garden', 'Casa con giardino', 'Natale'], ['hot-beverage', 'Cioccolata calda', 'Natale'],
  ['crescent-moon', 'Luna', 'Natale'],
  ['snowflake', 'Fiocco di neve', 'Inverno'], ['cloud-with-snow', 'Nuvola con neve', 'Inverno'], ['snow-capped-mountain', 'Montagna innevata', 'Inverno'],
  ['evergreen-tree', 'Abete', 'Inverno'], ['gloves', 'Guanti', 'Inverno'], ['scarf', 'Sciarpa', 'Inverno'], ['coat', 'Cappotto', 'Inverno'],
  ['socks', 'Calze', 'Inverno'], ['skier', 'Sciatore', 'Inverno'], ['ice-skate', 'Pattino', 'Inverno'],
  ['penguin', 'Pinguino', 'Animali'], ['polar-bear', 'Orso polare', 'Animali'], ['bear', 'Orso', 'Animali'], ['fox', 'Volpe', 'Animali'],
  ['owl', 'Gufo', 'Animali'], ['cat', 'Gatto', 'Animali'], ['dog', 'Cane', 'Animali'], ['rabbit', 'Coniglio', 'Animali'],
  ['hedgehog', 'Riccio', 'Animali'], ['bird', 'Uccellino', 'Animali'], ['dove', 'Colomba', 'Animali'],
  ['red-heart', 'Cuore', 'Feste'], ['heart-with-ribbon', 'Cuore con fiocco', 'Feste'], ['sparkling-heart', 'Cuore scintillante', 'Feste'],
  ['four-leaf-clover', 'Quadrifoglio', 'Feste'], ['crown', 'Corona', 'Feste'], ['party-popper', 'Festa', 'Feste'], ['confetti-ball', 'Coriandoli', 'Feste'],
  ['balloon', 'Palloncino', 'Feste'], ['fireworks', 'Fuochi d\'artificio', 'Feste'],
];

const { simplify, simplifyRing } = S;
const pack = (shapes) => shapes.filter(s => s.polys && s.fill && s.fill !== 'none').map(s => [s.fill, s.rule === 'evenodd' ? 1 : 0,
  s.polys.map(q => simplifyRing(q, 0.015)).filter(q => q.length >= 3).map(q => q.flatMap(([x, y]) => [+x.toFixed(2), +(32 - y).toFixed(2)]))]).filter(s => s[2].length);
const cs = (s) => new CrossSection(s[2].map(q => { const p = []; for (let i = 0; i < q.length; i += 2) p.push([q[i], q[i + 1]]); return p; }), s[1] ? 'EvenOdd' : 'NonZero');

const out = [];
for (const [id, it, g] of LIST) {
  const f = pack(S.parse(`<svg viewBox="0 0 32 32">${FLAT.icons[id].body}</svg>`).shapes);
  const h = pack(S.parse(`<svg viewBox="0 0 32 32" color="#000000">${HC.icons[id].body}</svg>`).shapes);
  // aree visibili per colore (le forme dopo coprono quelle prima)
  let cover = null; const area = {};
  for (let i = f.length - 1; i >= 0; i--) {
    const c = cs(f[i]), vis = cover ? c.subtract(cover) : c;
    area[f[i][0]] = (area[f[i][0]] || 0) + vis.area();
    cover = cover ? cover.add(c) : c;
  }
  const pal = S.reduceColors(Object.entries(area).map(([hex, w]) => ({ hex, w })), 4);
  out.push({ id, it, g, pal, f, h });
}
const NOTICE = fs.readFileSync(new URL('../LICENSE-fluent-emoji.txt', import.meta.url), 'utf8').trim().split('\n').map(l => '// ' + l).join('\n');
const js = '// Generato da tools/make-emoji.mjs.\n' + NOTICE + '\n' +
  '// Ogni voce: id, it (nome), g (gruppo), pal (4 colori, il più esteso per primo), f (forme a colori), h (versione a linea).\n' +
  '// Forma: [colore, 1 se evenodd, [[x,y,x,y,…], …]] in un quadrato 32×32 con y verso l\'alto.\n' +
  '(function (root) { root.SPLAB_EMOJI = ' + JSON.stringify(out) + '; })(typeof globalThis !== \'undefined\' ? globalThis : this);\n';
fs.writeFileSync(new URL('../src/emoji.js', import.meta.url), js);
console.log(out.length, 'disegni,', Math.round(js.length / 1024), 'KB');

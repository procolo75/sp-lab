// Generatori di Natale: palline, decorazioni piatte con scritta, alberi, stelle, lanterne, formine per biscotti.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto.
// Colori: ogni parte ha `color` e `group`; le parti dello stesso gruppo diventano un unico oggetto multicolore nel 3MF.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function natale(H) {
    const { Manifold, Mesh, CrossSection, reg, union, sub, box, cylZ, coneZ, cylY, hullPts, fmt, knurled } = H;
    const smoothW = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
    const FONTS = root.SPRECOLO_FONTS || {};

    // ---------- strumenti 2D ----------
    const R2 = (c) => reg(c);
    const P2 = (pts) => R2(CrossSection.ofPolygons([pts], 'NonZero'));
    const C2 = (x, y, r, seg = 48) => R2(R2(CrossSection.circle(r, seg)).translate([x, y]));
    const E2 = (x, y, rx, ry, rot = 0, seg = 48) => R2(R2(R2(R2(CrossSection.circle(1, seg)).scale([rx, ry])).rotate(rot)).translate([x, y]));
    const RECT = (x0, y0, x1, y1) => P2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const U = (list) => { list = list.filter(Boolean); return list.length === 0 ? null : list.length === 1 ? list[0] : R2(CrossSection.union(list)); };
    const D = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
    const I = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
    const OFF = (c, d, j = 'Round') => (c ? R2(c.offset(d, j)) : null);
    const MV = (c, x, y) => R2(c.translate([x, y]));
    const ROT = (c, deg) => R2(c.rotate(deg));
    const empty = (c) => !c || c.isEmpty() || c.area() < 0.05;
    // arrotonda gli spigoli (convessi e concavi) di r
    const soft = (c, r) => OFF(OFF(OFF(c, -r), 2 * r), -r);
    // tratto di pennello di larghezza w lungo una spezzata
    function stroke(pts, w) {
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push(R2(CrossSection.hull([C2(pts[i][0], pts[i][1], w / 2, 24), C2(pts[i + 1][0], pts[i + 1][1], w / 2, 24)])));
      return U(segs);
    }
    function starCS(n, R, r, cx = 0, cy = 0, rot = 90) {
      const pts = [];
      for (let i = 0; i < 2 * n; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, q = i % 2 ? r : R; pts.push([cx + q * Math.cos(a), cy + q * Math.sin(a)]); }
      return P2(pts);
    }
    // solo i contorni esterni: per fori e formine (le isole interne cadrebbero)
    function fillHoles(c) {
      const area = (q) => { let a = 0; for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
      const outer = c.toPolygons().filter(q => area(q) > 0);
      return outer.length ? R2(CrossSection.ofPolygons(outer, 'NonZero')) : c;
    }
    function rng(seed) { let a = (seed | 0) * 2654435761 >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    // estrusione di una sezione 2D tra z0 e z1
    const EXT = (c, z0, z1) => (empty(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
    // prisma lungo -y (sezione disegnata nel piano x,z), da y = y0 a y = y1 (y1 < y0)
    const prismY = (c, y0, y1) => reg(reg(reg(c.extrude(y0 - y1)).rotate([90, 0, 0])).translate([0, y0, 0]));
    const bounds = (c) => { const b = c.bounds(); return { x0: b.min[0], y0: b.min[1], x1: b.max[0], y1: b.max[1], w: b.max[0] - b.min[0], h: b.max[1] - b.min[1] }; };

    // ---------- scritte ----------
    function glyphPolys(path, s, ox, oy, out) {
      const re = /([MLQCZ])([^MLQCZ]*)/g;
      let m, cur = null, x = 0, y = 0;
      const P = (px, py) => cur.push([ox + px * s, oy + py * s]);
      while ((m = re.exec(path))) {
        const t = m[1], v = m[2].trim() ? m[2].trim().split(/\s+/).map(Number) : [];
        if (t === 'M') { cur = []; out.push(cur); x = v[0]; y = v[1]; P(x, y); }
        else if (t === 'L') { x = v[0]; y = v[1]; P(x, y); }
        else if (t === 'Q') { for (let i = 1; i <= 5; i++) { const k = i / 5, u = 1 - k; P(u * u * x + 2 * u * k * v[0] + k * k * v[2], u * u * y + 2 * u * k * v[1] + k * k * v[3]); } x = v[2]; y = v[3]; }
        else if (t === 'C') { for (let i = 1; i <= 7; i++) { const k = i / 7, u = 1 - k; P(u * u * u * x + 3 * u * u * k * v[0] + 3 * u * k * k * v[2] + k * k * k * v[4], u * u * u * y + 3 * u * u * k * v[1] + 3 * u * k * k * v[3] + k * k * k * v[5]); } x = v[4]; y = v[5]; }
      }
    }
    // loghi dentro le scritte: {SP} e {viso}. Il logo è alto LOGO_K volte le maiuscole e centrato sulla riga.
    // Se le linee del logo vengono più sottili dell'ugello, vengono ingrossate fino alla larghezza dell'ugello.
    const LOGOS = root.SPRECOLO_LOGOS || {};
    const LOGO_K = 1.35, LOGO_RE = /\{(SP|viso)\}/gi;
    const logoKey = (t) => Object.keys(LOGOS).find(k => k.toLowerCase() === t.toLowerCase());
    let lastLogos = [];   // loghi usati nell'ultima scritta costruita (per gli avvisi)
    const NOTES = new Set();
    // testo centrato in (0,0); capH = altezza delle maiuscole in mm; noz = diametro dell'ugello
    function textCS(lines, fontId, capH, noz = 0.4) {
      const F = FONTS[fontId] || FONTS.tondo;
      lines = lines.map(l => String(l || '').trim()).filter(Boolean);
      lastLogos = [];
      if (!F || !lines.length) return null;
      const s = capH / F.cap, lh = capH * 1.5, polys = [], logoCS = [];
      const LH = capH * LOGO_K, gap = capH * 0.22;
      // ogni riga diventa una sequenza di pezzi: testo oppure logo
      const pieces = (line) => {
        const out = []; let last = 0, m;
        LOGO_RE.lastIndex = 0;
        while ((m = LOGO_RE.exec(line))) {
          const k = logoKey(m[1]);
          if (m.index > last) out.push({ t: line.slice(last, m.index) });
          if (k) out.push({ logo: k }); else out.push({ t: m[0] });
          last = m.index + m[0].length;
        }
        if (last < line.length) out.push({ t: line.slice(last) });
        return out;
      };
      const widthOf = (pc, i, all) => pc.logo ? LOGOS[pc.logo].w * LH + (i > 0 ? gap : 0) + (i < all.length - 1 ? gap : 0) : [...pc.t].reduce((w, ch) => w + (F.g[ch] || F.g['?'])[0] * s, 0);
      lines.forEach((line, li) => {
        const pcs = pieces(line);
        let w = 0; pcs.forEach((pc, i) => { w += widthOf(pc, i, pcs); });
        let x = -w / 2;
        const y = ((lines.length - 1) / 2 - li) * lh - capH / 2;
        pcs.forEach((pc, i) => {
          if (pc.logo) {
            const L = LOGOS[pc.logo];
            if (i > 0) x += gap;
            const y0 = y + capH / 2 - LH / 2;
            let c = P2s(L.polys.map(q => q.map(([u, v]) => [x + u * LH, y0 + v * LH])));
            const lw = L.wmin * LH, d = Math.max(0, (noz * 1.05 - lw) / 2);
            if (d > 0.005) c = OFF(c, d);
            logoCS.push(c);
            lastLogos.push({ id: pc.logo, h: LH, lw, d, hmin: noz * 1.05 / L.wmin });
            x += L.w * LH + (i < pcs.length - 1 ? gap : 0);
          } else {
            for (const ch of pc.t) { const g = F.g[ch] || F.g['?']; if (g[1]) glyphPolys(g[1], s, x, y, polys); x += g[0] * s; }
          }
        });
      });
      const ok = polys.filter(p => p.length >= 3);
      if (!ok.length && !logoCS.length) return null;
      let c = U([ok.length ? P2s(ok) : null, ...logoCS]);
      if (empty(c)) return null;
      const b = bounds(c);
      return MV(c, -(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2);
    }
    const P2s = (polys) => R2(CrossSection.ofPolygons(polys, 'NonZero'));
    // avvisi sui loghi dell'ultima scritta: quanto sono alti e se le linee sono state ingrossate
    function logoNotes(noz) {
      for (const q of lastLogos) {
        const nm = q.id === 'SP' ? 'Logo SP' : 'Viso';
        if (q.d > 0.005) NOTES.add(`${nm} alto ${fmt(q.h)} mm: linee ingrossate a ${fmt2(q.lw + 2 * q.d)} mm per l'ugello da ${fmt2(noz)}. Per avere tutti i dettagli fallo alto almeno ${Math.ceil(q.hmin)} mm (lettere da ${Math.ceil(q.hmin / LOGO_K)} mm)`);
      }
    }
    const fmt2 = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');
    // scritta adattata a un riquadro {x,y,w,h}; restituisce anche l'altezza effettiva delle lettere
    function fitText(p, bx, capWanted) {
      const lines = [p.scritta, p.scritta2], noz = +p.ugello || 0.4;
      let c = textCS(lines, p.carattere, capWanted, noz);
      if (!c) return null;
      const b = bounds(c), f = Math.min(1, bx.w / b.w, bx.h / b.h);
      // se va rimpicciolita la ricostruisco alla misura giusta: così i loghi si ingrossano quanto serve
      if (f < 1) { c = textCS(lines, p.carattere, capWanted * f, noz); const b2 = bounds(c), f2 = Math.min(1, bx.w / b2.w, bx.h / b2.h); if (f2 < 1) c = R2(c.scale([f2, f2])); }
      logoNotes(noz);
      return { cs: MV(c, bx.x, bx.y), cap: capWanted * f, reduced: f < 0.97 };
    }

    // ---------- disegni: Fluent Emoji (libreria) e SVG caricati ----------
    // Un "disegno" è { f: forme a colori, h: versione a linea (può mancare), pal: 4 colori } in un quadrato 32×32, y in alto.
    const EMO = root.SPLAB_EMOJI || [], EMO_BY = {};
    for (const e of EMO) EMO_BY[e.id] = e;
    const SVGL = root.SPLAB_SVG;
    // i vecchi motivi disegnati a mano puntano ai disegni Fluent più simili
    const OLD = { albero: 'christmas-tree', pupazzo: 'snowman', babbo: 'santa-claus', renna: 'deer', campana: 'bell', campanelle: 'bell', regalo: 'wrapped-gift',
      candela: 'candle', angelo: 'baby-angel', pinguino: 'penguin', slitta: 'sled', fiocco: 'snowflake', cometa: 'shooting-star', casetta: 'house', muffola: 'gloves',
      nastro: 'ribbon', globo: 'snowman', gnomo: 'person-elf', omino: 'cookie', cappello: 'santa-claus', calza: 'socks', maglione: 'coat', bastoncino: 'candy',
      pallina: 'christmas-tree', agrifoglio: 'four-leaf-clover', poinsettia: 'sparkling-heart', ghirlanda: 'ribbon', luna: 'crescent-moon' };
    const svgCache = new Map();
    // disegno scelto: un id Fluent, oppure "svg" con il testo del file caricato
    function artOf(id, svgVal) {
      if (id === 'svg') {
        const txt = svgVal && svgVal.text;
        if (!txt || !SVGL) return null;
        if (!svgCache.has(txt)) { let a = null; try { a = SVGL.pack(SVGL.parse(txt)); } catch (e) { a = null; } svgCache.clear(); svgCache.set(txt, a); }
        return svgCache.get(txt);
      }
      return EMO_BY[id] || EMO_BY[OLD[id]] || null;
    }
    const isArt = (id) => id === 'svg' || !!EMO_BY[id] || !!OLD[id];
    // forme compatte → sezioni 2D, scalate di k e spostate di (ox, oy)
    function artCS(list, k, ox, oy) {
      const out = [];
      for (const it of list) {
        const ps = it[2].map(q => { const p = []; for (let i = 0; i + 1 < q.length; i += 2) p.push([q[i] * k + ox, q[i + 1] * k + oy]); return p; });
        let c = null;
        if (it[1] === 2) {   // tratto: lo trasformo in area
          const w = Math.max(0.05, it[3] * k);
          c = U(ps.map((p, j) => (p.length >= 2 ? stroke(it[4] && it[4][j] ? p.concat([p[0]]) : p, w) : null)));
        } else c = R2(CrossSection.ofPolygons(ps.filter(p => p.length >= 3), it[1] ? 'EvenOdd' : 'NonZero'));
        if (!empty(c)) out.push({ hex: it[0], cs: c });
      }
      return out;
    }
    // geometria del disegno alto S (o largo al massimo maxW), centrato in (0,0):
    // sil = sagoma intera, regions = parti visibili per colore originale (quelle sopra coprono quelle sotto), lines = versione a linea
    function artGeom(art, S, maxW) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const it of art.f) for (const q of it[2]) for (let i = 0; i + 1 < q.length; i += 2) { x0 = Math.min(x0, q[i]); x1 = Math.max(x1, q[i]); y0 = Math.min(y0, q[i + 1]); y1 = Math.max(y1, q[i + 1]); }
      const k = Math.min(S / Math.max(1e-6, y1 - y0), maxW ? maxW / Math.max(1e-6, x1 - x0) : Infinity);
      const ox = -(x0 + x1) / 2 * k, oy = -(y0 + y1) / 2 * k;
      const shapes = artCS(art.f, k, ox, oy);
      const regions = {}; let cover = null;
      for (let i = shapes.length - 1; i >= 0; i--) {
        const vis = D(shapes[i].cs, cover);
        if (!empty(vis)) regions[shapes[i].hex] = U([regions[shapes[i].hex], vis]);
        cover = U([cover, shapes[i].cs]);
      }
      const lines = art.h && art.h.length ? U(artCS(art.h, k, ox, oy).map(s => s.cs)) : null;
      return { sil: cover, regions, lines, k };
    }
    // colori del disegno → filamenti: ogni colore va sul filamento più vicino (1 = il pezzo sotto, che si vede da solo)
    // tavolozza "disegno": i filamenti sono i 4 colori del disegno stesso
    function filaments(p, art) {
      const F = [p.col1 || '#b3202a', p.col2 || '#e3b341', p.col3 || '#ffffff', p.col4 || '#2b2b2b'];
      if (p.col1 === undefined && art && art.pal) art.pal.forEach((c, i) => { if (i < 4) F[i] = c; });
      return F;
    }
    // parti del disegno per filamento (2, 3, 4), ripulite dai dettagli più stretti dell'ugello
    function artSlots(g, F, clip, noz, notes) {
      const by = { 2: [], 3: [], 4: [] };
      for (const [hex, cs] of Object.entries(g.regions)) { const k = SVGL ? SVGL.nearest(hex, F) + 1 : 2; if (k > 1) by[k].push(cs); }
      const out = {}; let lost = 0, tot = 0;
      for (const k of [2, 3, 4]) {
        let c = I(U(by[k]), clip);
        if (empty(c)) continue;
        const r = noz * 0.45, cl = OFF(OFF(c, -r), r);
        tot += c.area(); lost += Math.max(0, c.area() - (cl ? cl.area() : 0));
        if (!empty(cl)) out[k] = cl;
      }
      if (tot > 0 && lost / tot > 0.01) notes.push(`Dettagli più stretti dell'ugello (${fmt2(noz)} mm) tolti: ${Math.round(100 * lost / tot)}% dei colori. Ingrandisci il disegno per tenerli`);
      return out;
    }

    // disegno messo in un punto: sagoma e parti per filamento (2, 3, 4) secondo i colori F; il colore 1 non si stampa
    function artPlace(art, H, x, y, F, maxW) {
      if (!art) return null;
      const g = artGeom(art, H, maxW), sl = {};
      for (const [hex, cs] of Object.entries(g.regions)) { const k = SVGL ? SVGL.nearest(hex, F) + 1 : 2; if (k > 1) sl[k] = U([sl[k], MV(cs, x, y)]); }
      const lines = g.lines ? MV(g.lines, x, y) : null, linesIn = g.lines ? MV(I(g.lines, OFF(g.sil, -1.3 * g.k)), x, y) : null;
      return { sil: MV(g.sil, x, y), slots: sl, lines, linesIn, w: bounds(g.sil).w, h: bounds(g.sil).h };
    }
    const artSil = (id, H, x, y) => { const g = artGeom(EMO_BY[id], H); return MV(g.sil, x, y); };

    // ---------- forme 2D (altezza S, centrate) ----------
    // ognuna restituisce { base, decor, box (riquadro per la scritta), hang (punto di aggancio in alto), holes }
    const SHAPES = {
      stella(S, p) {
        const n = Math.max(4, Math.min(12, p.punte | 0 || 5)), R = S / 2;
        return { base: soft(starCS(n, R, R * 0.48), 0.6), box: { x: 0, y: -R * 0.04, w: R * 0.95, h: R * 0.42 }, hang: [0, R] };
      },
      cuore(S) {
        const pts = [], s = S / 29;
        for (let i = 0; i < 120; i++) { const t = 2 * Math.PI * i / 120; pts.push([16 * Math.pow(Math.sin(t), 3) * s, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * s]); }
        return { base: soft(P2(pts), 0.6), box: { x: 0, y: 0.06 * S, w: 0.62 * S, h: 0.3 * S }, hang: [0, 7.5 * s] };
      },
      palla(S, p) {
        // due scelte indipendenti: lo sfondo che riempie la palla e la figura grande sopra il nome
        // (i valori salvati con il vecchio menu unico "disegno" vengono convertiti)
        const old = String(p.disegno || '');
        const figSel = p.figura !== undefined ? p.figura : old.startsWith('fig:') ? old.slice(4) : old === 'motivo' ? p.motivo : 'nessuna';
        const fig = figSel && figSel !== 'nessuna' ? figSel : null;
        let d = p.sfondo !== undefined ? p.sfondo : (old.startsWith('fig:') || old === 'motivo') ? 'nessuno' : (old || 'fiocchi');
        if (d === 'agrifoglio') d = 'ghirlanda';
        const R = S / 2, rnd = rng((p.variante || 1) * 7 + 3);
        const disc = C2(0, 0, R, 128);
        // cappuccio con scanalature
        const cw = 0.3 * S, yc0 = Math.sqrt(R * R - cw * cw / 4) - 0.02 * S, yc1 = R + 0.075 * S;
        const capC = soft(U([RECT(-cw / 2, yc0, cw / 2, yc1), RECT(-cw * 0.36, yc1 - 0.01 * S, cw * 0.36, yc1 + 0.025 * S)]), 0.4);
        const gw = Math.max(0.8, 0.012 * S), grooves = [];
        for (let i = -2; i <= 2; i++) grooves.push(RECT(i * cw / 6 - gw / 2, yc0 + 0.035 * S, i * cw / 6 + gw / 2, yc1 - 0.012 * S));
        const capDec = p.cappuccio === false ? null : D(capC, U(grooves));
        // riquadro della scritta: al centro, più in alto sopra le scene, in basso sotto i motivi grandi
        const nl = [p.scritta, p.scritta2].filter(x => x && String(x).trim()).length;
        const pad = Math.min(4, Math.max(2, 0.3 * p.altTesto));
        const Rin = R - (p.bordo ? p.bordoL : 0) - 2.5;            // il nome deve stare tutto dentro questo cerchio
        const pos = fig ? -0.3 : ({ bosco: 0.15, paese: 0.15, regali: 0.15, slitta: -0.29 }[d] || 0);
        // misura la scritta alla grandezza chiesta, poi trova la più grande che ci sta:
        // il rettangolo della scritta (w·f × h·f) centrato in ty deve stare nel cerchio Rin
        const t0 = nl ? textCS([p.scritta, p.scritta2], p.carattere, p.altTesto, +p.ugello || 0.4) : null;
        const w0 = t0 ? bounds(t0).w : 0, h0 = t0 ? bounds(t0).h : 0;
        const fitAt = (y) => { const A = (w0 * w0 + h0 * h0) / 4, B = Math.abs(y) * h0, C = y * y - Rin * Rin; return C >= 0 || !A ? 0 : (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A); };
        const maxH = 0.46 * S;
        let ty = pos * S, f = 1;
        if (t0) {
          // con le scene e i personaggi il nome sta verso il bordo; se è grande si avvicina al centro
          const hw = Math.min(h0, maxH);
          if (pos) ty = Math.sign(pos) * Math.max(0, Math.min(Math.abs(pos) * S, Rin - hw / 2 - pad));
          f = Math.min(1, fitAt(ty), maxH / h0);
        }
        let bh = t0 ? f * h0 + 2 * pad : 0;
        const box = { x: 0, y: ty, w: f * w0 + 0.6, h: f * h0 + 0.6 };
        // spazio libero sopra il nome, per i motivi grandi
        const fTop = R - 0.07 * S, fBot = ty + bh / 2 + 0.01 * S, fMid = (fTop + fBot) / 2, fH = fTop - fBot;
        const keep = RECT(-R, ty - bh / 2, R, ty + bh / 2);           // zona del nome da lasciare libera
        const inner = OFF(disc, -Math.max(1.2, p.bordo ? p.bordoL + 0.8 : 1.2));
        let c2 = [], c3 = [], c4 = [];                                 // colore 2, 3 e 4
        const F = [p.col1 || '#b3202a', p.col2 || '#e3b341', p.col3 || '#ffffff', p.col4 || '#2b2b2b'];
        const r1 = [];
        const addSlots = (pl) => { if (pl) { r1.push(pl.sil); if (pl.slots[2]) c2.push(pl.slots[2]); if (pl.slots[3]) c3.push(pl.slots[3]); if (pl.slots[4]) c4.push(pl.slots[4]); } };
        // figura grande sopra il nome (disegno Fluent o il tuo SVG), a colori
        const figPl = fig ? artPlace(artOf(fig, p.svg), fH * 0.95, 0, fMid, F, 0.62 * S) : null;
        const fb = figPl ? bounds(OFF(figPl.sil, 2)) : null, halo = figPl ? OFF(figPl.sil, 1.5) : null;
        // oggetti sparsi senza sovrapposizioni, lontani dal nome
        const scatter = (n, sMin, sMax, make, area) => {
          const placed = [];
          for (let k = 0; k < n * 40 && placed.length < n; k++) {
            const s = sMin + (sMax - sMin) * rnd(), a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()) * (R - s / 2 - 1.5);
            const x = rr * Math.cos(a), y = rr * Math.sin(a);
            if (area && !area(x, y, s)) continue;
            if (Math.abs(y - ty) < bh / 2 + s / 2 + 1 && nl) continue;
            if (fb && x + s / 2 > fb.x0 && x - s / 2 < fb.x1 && y + s / 2 > fb.y0 && y - s / 2 < fb.y1) continue;   // lontano dalla figura
            if (placed.some(q => Math.hypot(q[0] - x, q[1] - y) < (q[2] + s) / 2 + 1.5)) continue;
            placed.push([x, y, s]);
          }
          return U(placed.map(([x, y, s], i) => make(x, y, s, i)));
        };
        const n = Math.max(3, p.quantita | 0 || 14);
        const flake = (x, y, s, i) => {
          const r2 = rng(i * 13 + (p.variante | 0)), w = Math.max(0.9, s * 0.08), L = s / 2, arm = [stroke([[0, 0], [0, L - w / 2]], w)];
          const t1 = 0.4 + 0.2 * r2(), b1 = L * (0.3 + 0.15 * r2());
          for (const sx of [-1, 1]) arm.push(stroke([[0, t1 * L], [sx * b1 * 0.7, t1 * L + b1 * 0.7]], w * 0.9));
          const one = U(arm), all = [C2(0, 0, w * 1.1, 12)];
          for (let k = 0; k < 6; k++) all.push(ROT(one, k * 60 + r2() * 0));
          return MV(ROT(U(all), rnd() * 60), x, y);
        };
        const star = (x, y, s) => MV(ROT(soft(starCS(5, s / 2, s * 0.21), Math.min(0.4, s * 0.03)), rnd() * 72), x, y);
        const heart = (x, y, s) => MV(ROT(SHAPES.cuore(s).base, (rnd() - 0.5) * 50), x, y);
        const hills = (y0, amp) => { const pts = [[-R, -R]]; for (let i = 0; i <= 48; i++) { const x = -R + 2 * R * i / 48; pts.push([x, y0 + amp * Math.sin(x / R * 2.2 + 0.6) + amp * 0.5 * Math.sin(x / R * 5.1)]); } pts.push([R, -R]); return P2(pts); };
        const upper = (yMin) => (x, y, s) => y - s / 2 > yMin;
        if (d === 'fiocchi') c3.push(scatter(n, 0.1 * S, 0.2 * S, flake));
        else if (d === 'stelle') { c2.push(scatter(n, 0.08 * S, 0.17 * S, star)); }
        else if (d === 'cuori') c3.push(scatter(n, 0.09 * S, 0.17 * S, heart));
        else if (d === 'pois') {
          const g = S / Math.max(6, Math.round(Math.sqrt(n * 4))), rd = g * 0.24, dots = [];
          for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) {
            const x = (i + (j % 2 ? 0.5 : 0)) * g, y = j * g * 0.87;
            if (Math.hypot(x, y) < R - rd - 1.5 && Math.abs(y - ty) > bh / 2 + rd) dots.push(C2(x, y, rd, 24));
          }
          c3.push(U(dots));
        } else if (d === 'righe') {
          const per = S / Math.max(4, Math.round(n / 2)), wa = per * 0.34, st3 = [], st2 = [];
          for (let k = -12; k <= 12; k++) { st3.push(ROT(RECT(-S, k * per - wa / 2, S, k * per + wa / 2), 35)); st2.push(ROT(RECT(-S, k * per + per / 2 - wa / 8, S, k * per + per / 2 + wa / 8), 35)); }
          c3.push(D(U(st3), keep)); c2.push(D(U(st2), keep));
        } else if (d === 'spicchi') {
          const w = Math.max(1, 0.022 * S), lines = [RECT(-w / 2, -R, w / 2, R)];
          for (const k of [0.38, 0.72]) lines.push(D(E2(0, 0, R * k + w / 2, R + w / 2, 0, 96), E2(0, 0, Math.max(0.1, R * k - w / 2), R - w / 2, 0, 96)));
          lines.push(RECT(-R, R * 0.55 - w / 2, R, R * 0.55 + w / 2), RECT(-R, -R * 0.55 - w / 2, R, -R * 0.55 + w / 2));
          c2.push(D(U(lines), keep));
        } else if (d === 'onde' || d === 'zigzag') {
          const band = (yc, w, amp, k, zig) => {
            const top = [], bot = [];
            for (let i = 0; i <= 60; i++) { const x = -R + 2 * R * i / 60, ph = x / R * k * Math.PI; const y = yc + amp * (zig ? 2 / Math.PI * Math.asin(Math.sin(ph)) : Math.sin(ph)); top.push([x, y + w / 2]); bot.push([x, y - w / 2]); }
            return P2([...bot, ...top.reverse()]);
          };
          const z = d === 'zigzag', y1 = Math.max(bh / 2 + 0.07 * S, 0.24 * S);
          for (const sg of [-1, 1]) {
            c2.push(band(sg * y1, 0.05 * S, 0.03 * S, z ? 6 : 3, z));
            if (y1 + 0.12 * S < R) c3.push(band(sg * (y1 + 0.11 * S), 0.035 * S, 0.025 * S, z ? 8 : 4, z));
          }
        } else if (d === 'nordico') {
          const y1 = Math.max(bh / 2 + 0.05 * S, 0.22 * S), tw = 0.07 * S;
          for (const sg of [-1, 1]) {
            c2.push(RECT(-R, sg * y1 - 0.012 * S, R, sg * y1 + 0.012 * S));
            const tri = [], dia = [];
            for (let i = -8; i <= 8; i++) {
              const x = i * tw, yb = sg * (y1 + 0.03 * S);
              tri.push(P2(sg > 0 ? [[x - tw * 0.42, yb], [x + tw * 0.42, yb], [x, yb + 0.06 * S]] : [[x - tw * 0.42, yb], [x, yb - 0.06 * S], [x + tw * 0.42, yb]]));
              const yd = sg * (y1 + 0.15 * S), q = 0.03 * S;
              dia.push(P2([[x + tw / 2, yd - q], [x + tw / 2 + q, yd], [x + tw / 2, yd + q], [x + tw / 2 - q, yd]]));
            }
            c3.push(U(tri)); c2.push(U(dia));
            if (y1 + 0.26 * S < R) c3.push(U([-2, -1, 0, 1, 2].map(i => C2(i * 0.12 * S, sg * (y1 + 0.26 * S), 0.018 * S, 16))));
          }
        } else if (d === 'ghirlanda') {
          const rr = R - 0.1 * S, leaves = [], ber = [], N = 16;
          const leaf = (L, W) => R2(CrossSection.hull([C2(-L / 2, 0, 0.3, 8), C2(L / 2, 0, 0.3, 8), E2(0, 0, L * 0.3, W / 2, 0, 24)]));
          for (let i = 0; i < N; i++) {
            const a = 360 * i / N, ar = a * Math.PI / 180;
            for (const sg of [-1, 1]) {
              const r2 = rr + sg * 0.035 * S, a2 = ar + 0.09;
              leaves.push(MV(ROT(leaf(0.1 * S, 0.042 * S), a + 90 + sg * 35), r2 * Math.cos(a2), r2 * Math.sin(a2)));
            }
            if (i % 2 === 0) for (const [dr, da] of [[-0.012, -0.03], [0.012, 0.03]]) ber.push(C2((rr + dr * S) * Math.cos(ar + da), (rr + dr * S) * Math.sin(ar + da), 0.02 * S, 16));
          }
          const bow = MV(U([E2(-0.07 * S, 0, 0.075 * S, 0.04 * S, -20), E2(0.07 * S, 0, 0.075 * S, 0.04 * S, 20), C2(0, 0, 0.03 * S)]), 0, -rr);
          c2.push(D(D(U(leaves), OFF(U(ber), 0.6)), OFF(bow, 0.8))); c3.push(U([U(ber), bow]));
        } else if (d === 'cielo') {
          c2.push(D(C2(0.22 * S, 0.2 * S, 0.13 * S, 64), C2(0.27 * S, 0.24 * S, 0.11 * S, 64)));
          c2.push(scatter(n, 0.05 * S, 0.1 * S, star, (x, y) => Math.hypot(x - 0.22 * S, y - 0.2 * S) > 0.17 * S && y > -0.2 * S));
          c3.push(I(disc, hills(-0.33 * S, 0.035 * S)));
        } else if (d === 'bosco' || d === 'paese') {
          const gy = -0.2 * S, hMax = (ty - bh / 2 - 1.5) - (gy - 0.02 * S), hk = (h) => Math.min(h, Math.max(0.08 * S, hMax)), ground = I(disc, hills(gy, 0.03 * S)), obj = [];
          c3.push(ground);
          if (d === 'bosco') {
            for (const [x, h] of [[-0.3, 0.2], [-0.16, 0.28], [0, 0.22], [0.15, 0.3], [0.3, 0.19]]) { const H = hk(h * S); obj.push(artSil('evergreen-tree', H, x * S, gy - 0.02 * S + H / 2)); }
          } else {
            const hs = [[-0.2, 0.22], [0.12, 0.26]];
            for (const [x, s0] of hs) { const H = hk(s0 * S); obj.push(artSil('house', H, x * S, gy - 0.02 * S + H / 2)); }
            for (const [x, h] of [[-0.36, 0.17], [-0.03, 0.2], [0.33, 0.16]]) { const H = hk(h * S); obj.push(artSil('evergreen-tree', H, x * S, gy - 0.02 * S + H / 2)); }
            c2.push(D(C2(-0.24 * S, 0.33 * S, 0.075 * S, 48), C2(-0.21 * S, 0.355 * S, 0.065 * S, 48)));
          }
          c2.push(D(U(obj), OFF(keep, 1)));
          c3.push(scatter(Math.round(n * 0.7), 0.05 * S, 0.1 * S, flake, upper(gy + 0.1 * S)));
        } else if (d === 'slitta') {
          const mr = Math.min(0.27 * S, fH / 2), mx = 0.04 * S, my = fMid;
          const moon = C2(mx, my, mr, 96);
          const sled = MV(artGeom(EMO_BY.sled, mr, 1.3 * mr).sil, mx, my - 0.1 * mr);
          c3.push(D(moon, OFF(sled, 0.8)));
          c2.push(sled);
          c2.push(scatter(Math.round(n * 0.6), 0.05 * S, 0.09 * S, star, (x, y, s) => Math.hypot(x - mx, y - my) > mr + s / 2 + 1.5));
        } else if (d === 'regali') {
          const gifts = [[-0.2, 0.3], [0.19, 0.32], [0.005, 0.22]];
          for (const [x, s] of gifts) addSlots(artPlace(EMO_BY['wrapped-gift'], s * S, x * S, -0.43 * S + s * S / 2 - 0.01 * S, F));
          c3.push(I(disc, RECT(-R, -R, R, -0.43 * S)));
          c2.push(scatter(Math.round(n * 0.6), 0.05 * S, 0.09 * S, star, upper(-0.12 * S)));
        }
        let dec2 = U(c2), dec3 = U(c3), dec4 = U(c4);
        if (p.fascia && nl) {
          const band = I(disc, keep);
          dec2 = U([D(dec2, OFF(keep, 1.2)), band]); dec3 = D(dec3, OFF(keep, 1.2)); dec4 = D(dec4, OFF(keep, 1.2));
        }
        dec2 = I(dec2, inner); dec3 = I(dec3, inner); dec4 = I(dec4, inner);
        // i colori non si sovrappongono: 4 sopra 3 sopra 2
        if (dec4) { dec3 = D(dec3, dec4); dec2 = D(dec2, dec4); }
        if (dec3) dec2 = D(dec2, dec3);
        // lo sfondo si ferma attorno alla figura
        if (halo) { dec2 = D(dec2, halo); dec3 = D(dec3, halo); dec4 = D(dec4, halo); }
        const fsl = figPl ? figPl.slots : {};
        const groups = [
          { name: 'Sfondo', slots: { 2: dec2, 3: dec3, 4: dec4 }, raise1: r1.length ? D(I(U(r1), inner), halo) : null, styleKey: 'stileSfondo', hKey: 'spSfondo' },
          { name: 'Figura', slots: { 2: I(fsl[2], inner), 3: I(fsl[3], inner), 4: I(fsl[4], inner) }, raise1: figPl ? I(figPl.sil, inner) : null,
            lines: figPl ? I(figPl.lines, inner) : null, linesIn: figPl ? figPl.linesIn : null, styleKey: 'stileFigura', hKey: 'spFigura' },
        ];
        return { base: U([disc, capC]), groups, decorFix: capDec, box, clear: p.fascia ? 0.9 : 1.6, hang: [0, yc1 + 0.025 * S], F };
      },
      medaglione(S) { return { base: C2(0, 0, S / 2, 96), box: { x: 0, y: 0, w: 0.8 * S, h: 0.42 * S }, hang: [0, S / 2] }; },
      targhetta(S) {
        const W = 2.4 * S;
        return { base: soft(RECT(-W / 2, -S / 2, W / 2, S / 2), Math.min(0.2 * S, 6)), box: { x: 0, y: 0, w: W - 0.35 * S, h: 0.62 * S }, hang: [0, S / 2] };
      },
    };
    const SHAPE_NAMES = { stella: 'Stella', cuore: 'Cuore', medaglione: 'Medaglione', targhetta: 'Targhetta', nome: 'Nome', palla: 'Palla piatta', svg: 'Disegno' };

    if (root.SPRECOLO_DEBUG) root.__NATALE = { SHAPES, textCS, fillHoles };
    const part = (name, m, color, group, extra) => (m ? Object.assign({ name, m, role: 'body', color, group }, extra || {}) : null);
    const ok = (list) => list.filter(Boolean);
    const U3 = (list) => { list = ok(list); return !list.length ? null : list.length === 1 ? list[0] : union(list); };

    // ============ DECORAZIONE PIATTA ============
    // scritta traforata: ponticelli che tengono attaccato l'interno di lettere come o, a, e, B
    function stencil(c, capH) {
      const area = (q) => { let A = 0; for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; A += x0 * y1 - x1 * y0; } return A / 2; };
      const bw = Math.max(0.9, capH * 0.1), br = [];
      for (const q of c.toPolygons()) {
        if (area(q) >= 0) continue;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const [x, y] of q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        const cx = (x0 + x1) / 2;
        br.push(RECT(cx - bw / 2, y0 - capH * 0.4, cx + bw / 2, y1 + capH * 0.4));
      }
      return br.length ? D(c, U(br)) : c;
    }
    // decorazione fatta solo dalla scritta: il contorno unisce le lettere
    function nameShape(p) {
      const cap = p.altTesto;
      let tc = textCS([p.scritta, p.scritta2], p.carattere, cap, +p.ugello || 0.4) || textCS(['Nome'], p.carattere, cap);
      logoNotes(+p.ugello || 0.4);
      const pad = (p.bordo ? p.bordoL : 0) + 1.6, r = cap * 0.35;
      const base = OFF(OFF(tc, pad + r), -r);
      const b = bounds(base), strip = I(base, RECT(-1.5, -1e4, 1.5, 1e4));
      const top = strip && !strip.isEmpty() ? bounds(strip).y1 : b.y1;
      return { sh: { base, decor: null, box: null, hang: [0, top - 0.6] }, txt: { cs: tc, cap } };
    }
    // decorazione da un disegno (Fluent o SVG caricato): sagoma con contorno, colori sui filamenti, nome su targhetta
    function artShape(p, notes, forStamp) {
      const art = artOf(p.forma, p.svg);
      const S = p.altezza, noz = +p.ugello || 0.4;
      if (!art) {
        notes.push(p.forma === 'svg' ? 'Carica un file SVG con il pulsante qui a sinistra' : 'Disegno non trovato');
        return Object.assign(SHAPES.medaglione(S), { F: filaments(p) });
      }
      const g = artGeom(art, S), con = forStamp ? 1.5 : Math.max(0, p.contorno === undefined ? 1.6 : +p.contorno);   // nella formina un po' di contorno addolcisce la lama
      let base = con > 0 ? OFF(g.sil, con) : g.sil;
      base = OFF(OFF(base, 0.4), -0.4);   // chiude le fessure più sottili
      // parti staccate (fiocchi attorno al pupazzo, scintille…): le unisco alla parte grande con un ponticello
      let comps = base.decompose().map(R2).filter(c => c.area() > 0.5).sort((a, b) => b.area() - a.area());
      if (comps.length > 1) {
        // le parti piccole (meno del 6% della principale) le tolgo, le altre le collego con un ponticello
        const A0 = comps[0].area(), small = comps.slice(1).filter(c => c.area() < 0.06 * A0), big = comps.slice(1).filter(c => c.area() >= 0.06 * A0);
        const mb = bounds(comps[0]), mc = [(mb.x0 + mb.x1) / 2, (mb.y0 + mb.y1) / 2], w = Math.max(2.4, 3 * noz);
        const bars = big.map(c => { const b = bounds(c); return stroke([[(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2], mc], w); });
        base = U([comps[0], ...big, ...bars]);
        if (small.length) notes.push(`${small.length} part${small.length > 1 ? 'i piccole staccate tolte' : 'e piccola staccata tolta'} (aumenta il contorno per tenerle)`);
        if (big.length) notes.push(`${big.length} part${big.length > 1 ? 'i staccate unite' : 'e staccata unita'} con un ponticello`);
      }
      // nome: targhetta sotto o sopra il disegno, oppure sopra il disegno stesso
      const has = [p.scritta, p.scritta2].some(x => x && String(x).trim());
      const pos = p.posNome || 'sotto';
      let box = null, plate = null, clear = 0.9;
      if (has && (pos === 'sotto' || pos === 'sopra')) {
        const t0 = textCS([p.scritta, p.scritta2], p.carattere, p.altTesto, noz);
        if (t0) {
          const tb = bounds(t0), pad = Math.max(2, 0.35 * p.altTesto), pw = Math.max(tb.w + 2 * pad, 0.4 * S), ph = tb.h + 2 * pad;
          const bb = bounds(base), ov = Math.min(ph * 0.35, 0.12 * S);
          const cy = pos === 'sopra' ? bb.y1 + ph / 2 - ov : bb.y0 - ph / 2 + ov, r = Math.min(ph / 2 - 0.05, 5);
          plate = OFF(RECT(-pw / 2 + r, cy - ph / 2 + r, pw / 2 - r, cy + ph / 2 - r), r);
          box = { x: 0, y: cy, w: tb.w + 0.6, h: tb.h + 0.6 };
          base = U([base, plate]);
        }
      } else if (has) {
        const sb = bounds(g.sil);
        box = { x: (sb.x0 + sb.x1) / 2, y: (sb.y0 + sb.y1) / 2, w: sb.w * 0.8, h: sb.h * 0.35 };
        clear = 1.6;
      }
      const F = filaments(p, art);
      let clip = OFF(base, -((p.bordo && !forStamp) ? p.bordoL : 0) - 0.01);
      if (plate) clip = D(clip, OFF(plate, 0.6));
      const slots = artSlots(g, F, clip, noz, notes);
      const lines = g.lines ? I(g.lines, OFF(base, -0.8)) : null;
      // per i traforati tolgo la linea di contorno del disegno, che staccherebbe tutto l'interno
      const linesIn = g.lines ? I(g.lines, OFF(g.sil, -1.3 * g.k)) : null;
      // aggancio: nel punto più alto
      // aggancio: sulla parte più alta; se lassù ci sono più punte (orecchie, corna) scelgo la più vicina al centro
      const bb = bounds(base), topSl = I(base, RECT(-1e4, bb.y1 - 3, 1e4, bb.y1 + 1));
      let hx = 0, hy = bb.y1;
      if (topSl && !empty(topSl)) {
        const tips = topSl.decompose().map(R2).map(c => bounds(c)).sort((a, b2) => (b2.y1 - a.y1) || (Math.abs(a.x0 + a.x1) - Math.abs(b2.x0 + b2.x1)));
        const best = tips.filter(t2 => t2.y1 > bb.y1 - 0.8).sort((a, b2) => Math.abs(a.x0 + a.x1) - Math.abs(b2.x0 + b2.x1))[0] || tips[0];
        hx = (best.x0 + best.x1) / 2; hy = best.y1;
      }
      // in rilievo tutto il disegno sporge allo stesso modo: anche le parti del colore del pezzo
      return { base, slots, lines, linesIn, box, clear, F, plate, hang: [hx, hy - 0.6], art: true, raise1: I(g.sil, clip) };
    }
    function flatDesign(p, forStamp) {
      const notes = [];
      if (p.forma === 'nome') {
        const { sh, txt } = nameShape(p);
        if (!(p.scritta || p.scritta2)) notes.push('Scrivi il nome nella Riga 1');
        return { sh, base: sh.base, txt, notes };
      }
      const S = p.altezza;
      const sh = isArt(p.forma) ? artShape(p, notes, forStamp) : SHAPES[p.forma] ? SHAPES[p.forma](S, p) : SHAPES.stella(S, p);
      let base = sh.base;
      let txt = null;
      if ((p.scritta || p.scritta2) && String(p.scritta || p.scritta2).trim()) {
        if (sh.box) {
          txt = fitText(p, sh.box, p.altTesto);
          if (txt && txt.reduced) notes.push(`Scritta ridotta a ${fmt(txt.cap)} mm per starci: allunga la forma o accorcia il testo`);
          if (txt && txt.cs) txt.cs = I(txt.cs, OFF(base, -(p.bordo && !forStamp ? p.bordoL + 0.4 : 0.8)));
        } else notes.push(`Il motivo "${SHAPE_NAMES[p.forma]}" non ha spazio per una scritta`);
      }
      if (txt && txt.cap < 4.5) notes.push('Lettere sotto i 4,5 mm: vengono poco leggibili');
      return { sh, base, txt, notes };
    }

    // disegni traforati: buchi solo all'interno (resta una cornice di 1,2 mm lungo il contorno)
    // e ponticelli verticali per le parti del pezzo che resterebbero staccate e cadrebbero
    function perforate(h, base) {
      let holes = I(h, OFF(base, -1.2));
      if (empty(holes)) return { holes: null, bridges: 0 };
      let bridges = 0;
      for (let k = 0; k < 4; k++) {
        const rest = D(base, holes), comps = rest.decompose().map(R2).sort((a, b) => b.area() - a.area());
        if (comps.length <= 1) break;
        const bars = comps.slice(1).filter(c => c.area() > 0.3).map(c => { const bc = bounds(c), cx = (bc.x0 + bc.x1) / 2; return RECT(cx - 0.8, -1e4, cx + 0.8, 1e4); });
        if (!bars.length) break;
        bridges += bars.length;
        holes = D(holes, U(bars));
        if (empty(holes)) return { holes: null, bridges };
      }
      return { holes, bridges };
    }
    function piatto(p) {
      const { sh, txt, notes } = flatDesign(p);
      let base = sh.base;
      const t = p.spessore, hR = p.rilievo, hT = Math.max(p.rilievo, p.rilievoTesto);
      const f2 = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');
      // appendino
      if (sh.hang && p.appendino === 'occhiello') {
        const ro = Math.max(3.6, p.altezza * 0.05), ri = ro - 2;
        const cx = sh.hang[0], cy = sh.hang[1] + ri + 0.4;
        base = U([base, D(C2(cx, cy, ro, 40), C2(cx, cy, ri, 32))]);
      } else if (sh.hang && p.appendino === 'foro') {
        base = D(base, C2(sh.hang[0], sh.hang[1] - 4.5, 1.8, 24));
      }
      if (sh.holes) base = D(base, sh.holes);
      const zone = txt && txt.cs ? OFF(txt.cs, sh.clear || 0.9) : null;
      const border = p.bordo ? D(base, OFF(base, -p.bordoL)) : null;
      const st = p.stile || 'rilievo';
      // filamenti: 1 = il pezzo, 2-3-4 = disegni; la scritta va sul filamento scelto
      const F = sh.F || [p.col1, p.col2, p.col3, p.col4 || '#2b2b2b'];
      // colore della scritta: scelto, oppure in automatico quello che stacca di più dal pezzo
      let ts = Math.min(4, Math.max(2, +p.colTesto || 3));
      if ((p.colTesto === 'auto' || p.colTesto === undefined) && SVGL) ts = [2, 3, 4].sort((a, b2) => SVGL.dist(F[b2 - 1], F[0]) - SVGL.dist(F[a - 1], F[0]))[0];
      // gruppi di disegni, ognuno con il suo stile e il suo spessore ("uguale" = come la scritta).
      // La decorazione ha un gruppo solo; la palla piatta ne ha due: sfondo e figura.
      const groups = (sh.groups || [{ name: 'Disegno', slots: sh.slots || { 2: sh.decor, 3: sh.decor3 }, lines: sh.lines, linesIn: sh.linesIn, raise1: sh.raise1, styleKey: 'stileDec', hKey: 'rilievo' }])
        .map(g => Object.assign({}, g, { sd: !p[g.styleKey] || p[g.styleKey] === 'uguale' ? st : p[g.styleKey], h: +p[g.hKey] || hR }));
      // parti fisse (bordo, cappuccio della palla): non si incidono e non si traforano; a filo solo se tutti i disegni sono a filo
      let fixed = U([border, p.decorazioni !== false && sh.decorFix ? I(sh.decorFix, base) : null]);
      if (sh.holes) fixed = D(fixed, OFF(sh.holes, 0.6));
      fixed = D(fixed, zone);
      if (empty(fixed)) fixed = null;
      const tcs = txt ? txt.cs : null;
      const dT = Math.min(t, p.profTesto), through = dT >= t - 0.01;   // spessore della scritta a filo / incisa
      let body = EXT(base, 0, t);
      const c = { 2: [], 3: [], 4: [] };   // solidi per filamento
      const up = [];                        // parti che sporgono: { k: filamento, h: altezza }
      let filo = false;
      const ginfo = [];
      // --- scritta ---
      if (!empty(tcs)) {
        if (st === 'filo') { body = sub(body, EXT(tcs, through ? -1 : t - dT, t + 1)); c[ts].push(EXT(tcs, through ? 0 : t - dT, t)); filo = true; }
        else if (st === 'inciso') body = sub(body, EXT(tcs, t - Math.min(dT, t - 0.6), t + 1));
        else if (st === 'traforata') body = sub(body, EXT(stencil(tcs, txt.cap), -1, t + 1));
        else { c[ts].push(EXT(tcs, t, t + hT)); up.push({ k: ts, h: hT }); }
      }
      // --- disegni, gruppo per gruppo ---
      for (const g of groups) {
        const L = {};
        for (const k of [2, 3, 4]) {
          let cs = p.decorazioni !== false && g.slots && g.slots[k] ? I(g.slots[k], base) : null;
          if (cs && sh.holes) cs = D(cs, OFF(sh.holes, 0.6));
          cs = D(D(cs, zone), fixed);
          if (!empty(cs)) L[k] = cs;
        }
        const des = U(Object.values(L)), sd = g.sd, h = g.h;
        const thr = h >= t - 0.01, dI = Math.min(h, t - 0.6);
        const hasLines = g.lines && !empty(g.lines);
        if (!des && !hasLines && !(g.raise1 && !empty(g.raise1))) continue;
        if (sd === 'filo') {
          for (const k of [2, 3, 4]) if (L[k]) { body = sub(body, EXT(L[k], thr ? -1 : t - h, t + 1)); c[k].push(EXT(L[k], thr ? 0 : t - h, t)); filo = true; }
        } else if (sd === 'inciso') {
          // con un disegno a linea incido le sue linee, altrimenti le parti colorate
          const e = hasLines ? D(g.lines, zone) : des;
          if (!empty(e) && dI > 0.1) body = sub(body, EXT(e, t - dI, t + 1));
          else if (!empty(e)) notes.push(`${g.name}: pezzo troppo sottile per incidere, aumenta lo spessore`);
        } else if (sd === 'traforata') {
          const r = perforate(g.linesIn ? D(g.linesIn, OFF(zone, 0.6)) : des, base);
          if (r.holes) body = sub(body, EXT(r.holes, -1, t + 1));
          if (r.bridges) notes.push(`${g.name}: ${r.bridges} ponticell${r.bridges > 1 ? 'i tengono' : 'o tiene'} attaccate le parti che sarebbero cadute`);
        } else {
          // tutto il disegno sporge dello stesso spessore, qualunque sia il colore delle sue parti
          for (const k of [2, 3, 4]) if (L[k]) { c[k].push(EXT(L[k], t, t + h)); up.push({ k, h }); }
          // anche le parti del colore del pezzo
          if (p.decorazioni !== false && g.raise1) {
            const r1 = D(D(I(g.raise1, base), des), U([zone, fixed]));
            if (!empty(r1)) { body = union([body, EXT(r1, t - 0.01, t + h)]); up.push({ k: 1, h }); }
          }
        }
        ginfo.push([g.name, { rilievo: `in rilievo ${f2(h)} mm`, filo: thr ? 'a filo, passante: si vede dai due lati' : `a filo, spesso ${f2(h)} mm`, inciso: hasLines ? `linee incise ${f2(Math.max(0, dI))} mm` : `inciso ${f2(Math.max(0, dI))} mm`, traforata: 'traforato' }[sd]]);
      }
      // --- parti fisse ---
      const fixFilo = groups.length ? groups.every(g => g.sd === 'filo') : st === 'filo';
      if (fixed) {
        const thrF = hR >= t - 0.01;
        if (fixFilo) { body = sub(body, EXT(fixed, thrF ? -1 : t - hR, t + 1)); c[2].push(EXT(fixed, thrF ? 0 : t - hR, t)); filo = true; }
        else { c[2].push(EXT(fixed, t, t + hR)); up.push({ k: 2, h: hR }); }
      }
      const G = SHAPE_NAMES[p.forma] || (EMO_BY[p.forma] && EMO_BY[p.forma].it) || (p.forma === 'svg' ? 'Disegno' : 'Decorazione');
      const solid = { 2: U3(c[2]), 3: U3(c[3]), 4: U3(c[4]) };
      const parts = ok([part(`${G} · base`, body, F[0], G),
        ...[2, 3, 4].map(k => part(`${G} · colore ${k}`, solid[k], F[k - 1], G))]);
      const b = bounds(base);
      const info = [['Misure', `${fmt(b.w)} × ${fmt(b.h)} × ${f2(t + Math.max(0, ...up.map(u => u.h)))} mm`]];
      if (txt) info.push(['Lettere', `${fmt(txt.cap)} mm` + ({ inciso: `, incise ${f2(Math.min(dT, t - 0.6))} mm`, traforata: ', traforate con ponticelli', filo: through ? ', passanti: si vedono dai due lati' : `, a filo, spesse ${f2(dT)} mm` }[st] || '')]);
      for (const gi of ginfo) info.push(gi);
      const used = [1, ...[2, 3, 4].filter(k => solid[k])];
      info.push(['Filamenti', used.length > 1 ? used.map(k => (k === 1 ? '1 pezzo' : String(k))).join(' · ') + ' (una parte per filamento nel 3MF)' : '1']);
      if (filo && parts.length > 1) {
        notes.push('A filo i colori sono negli stessi strati: serve una stampante multicolore (AMS, MMU…)');
      } else if (parts.length > 1 && up.length) {
        // con un solo estrusore si cambia filamento salendo: a ogni altezza deve esserci un colore solo
        const byH = new Map();
        for (const u of up) { const key = Math.round(u.h * 100); if (!byH.has(key)) byH.set(key, new Set()); byH.get(key).add(u.k); }
        if ([...byH.values()].some(set => set.size > 1)) notes.push('Più colori alla stessa altezza: per stamparli serve una stampante multicolore. Con un solo estrusore dai a ogni colore un\'altezza diversa');
        else {
          const hs = [...byH.keys()].sort((a, b2) => a - b2);
          info.push(['Stampante a un colore', 'cambio filamento a ' + hs.map((key, i) => `${f2(t + (i ? hs[i - 1] / 100 : 0))} mm → colore ${[...byH.get(key)][0]}`).join(', ')]);
        }
      }
      if (filo) {
        const al = (v) => [0.2, 0.28].some(h => Math.abs(v / h - Math.round(v / h)) < 0.02);
        if (![t, dT, hR, ...groups.map(g => g.h)].every(al)) notes.push('Alcuni spessori non sono multipli di 0,2 o 0,28 mm: lo slicer arrotonda agli strati');
      }
      // segnaposto: base con fessura
      if (p.supporto) {
        const L = Math.max(30, Math.min(b.w * 0.8, 90)), Wd = 16, Hs = 9, sl = t + p.tolleranza;
        let st = sub(H.slab(L, Wd, 3, 0, Hs), box(-L / 2 + 4, -sl / 2, Hs - 6, L / 2 - 4, sl / 2, Hs + 1));
        parts.push(part('Supporto da tavolo', st, F[0], 'Supporto', { at: [0, b.y0 - Wd / 2 - 8, 0] }));
        info.push(['Supporto', `${fmt(L)} × ${fmt(Wd)} × ${fmt(Hs)} mm, fessura ${fmt(sl)} mm`]);
      }
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info, view: [0, -0.6, 1] };
    }

    // ============ FORMINA PER BISCOTTI ============
    function formina(p) {
      const q = Object.assign({}, p, { bordo: false, posNome: 'centro' });   // nella formina il nome va sul timbro
      const { sh, txt, notes } = flatDesign(q, true);
      const out = soft(fillHoles(sh.base), 1);
      const Hc = p.profondita, lama = p.lama;
      const cutter = union(ok([EXT(D(OFF(out, lama), out), 0, Hc), EXT(D(OFF(out, lama + 1.2), out), 0, Math.max(3, Hc * 0.5)), EXT(D(OFF(out, lama + p.flangia), out), 0, 2.4)]));
      const parts = [part('Formina', cutter, p.col1, 'Formina')];
      const b = bounds(OFF(out, lama + p.flangia));
      const info = [['Formina', `${fmt(b.w)} × ${fmt(b.h)} × ${fmt(Hc)} mm`], ['Lama', `${fmt(lama)} mm, la bordatura larga va sul piatto`]];
      if (p.timbro) {
        const plate = OFF(out, -(p.tolleranza + 0.6));
        const ring = D(plate, OFF(plate, -1.2));
        const zt = txt && txt.cs ? OFF(txt.cs, 1) : null;
        // disegno sul timbro: le linee del disegno (versione a linea), altrimenti i dettagli colorati
        const art = p.decorazioni ? (sh.lines ? sh.lines : sh.slots ? U(Object.values(sh.slots)) : sh.decor) : null;
        const rel = U([ring, art ? D(I(art, plate), zt) : null, txt ? txt.cs : null]);
        const mir = (c) => (c ? R2(c.scale([-1, 1])) : null);   // il timbro si preme capovolto: disegno a specchio
        const stamp = union(ok([EXT(mir(plate), 0, 3), EXT(mir(I(rel, plate)), 3, 5)]));
        parts.push(part('Timbro', stamp, p.col2, 'Timbro', { at: [b.w + 10, 0, 0] }));
        info.push(['Timbro', 'entra nella formina; disegno e scritta sono a specchio']);
        if (txt) info.push(['Lettere', `${fmt(txt.cap)} mm`]);
      }
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info };
    }

    // ============ PALLINA 3D ============
    function profile(forma, Dm, low) {
      const R = Dm / 2, pts = [];
      const n = low ? 8 : 64;
      if (forma === 'goccia' || forma === 'cipolla') {
        const Ht = 1.55 * Dm, zc = Ht / 2 - R, zb = -Ht / 2, sgn = forma === 'cipolla' ? -1 : 1;
        const half = [];
        const m1 = low ? 5 : 40, m2 = low ? 4 : 32;
        for (let i = 0; i <= m1; i++) { const s = 1 - i / m1; half.push([R * Math.pow(Math.cos(s * Math.PI / 2), 1.3), zc - s * (zc - zb)]); }
        for (let i = 1; i <= m2; i++) { const a = Math.PI / 2 * i / m2; half.push([R * Math.cos(a), zc + R * Math.sin(a)]); }
        for (const [r, z] of half) pts.push([r, sgn * z]);
        if (sgn < 0) pts.reverse();
      } else {
        const Rz = forma === 'oliva' ? 0.7 * Dm : R;
        for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; pts.push([R * Math.cos(a), Rz * Math.sin(a)]); }
      }
      // poligono completo e simmetrico (il revolve usa solo la metà con x > 0)
      const right = pts.map(([r, z]) => [Math.max(0, r), z]);
      const left = right.slice().reverse().map(([r, z]) => [-r, z]);
      const all = [...right, ...left.slice(1, -1)];
      const zs = right.map(q => q[1]);
      let zW = 0, rMax = 0;
      for (const [r, z] of right) if (r > rMax) { rMax = r; zW = z; }
      return { cs: P2(all), zBot: Math.min(...zs), zTop: Math.max(...zs), rMax, zW };
    }
    // posizioni distribuite sulla superficie: [angolo dal fronte (-y), z, raggio]
    function spots(pr, count, rows, avoid) {
      const res = [], span = (pr.zTop - pr.zBot);
      for (let j = 0; j < rows; j++) {
        const z = pr.zW + (j - (rows - 1) / 2) * span * 0.22;
        for (let i = 0; i < count; i++) res.push([(i + (j % 2) * 0.5) * 360 / count, z]);
      }
      return res.filter(([a, z]) => !avoid || !avoid(a, z));
    }
    // prisma radiale: sezione 2D (piano x,z) spinta verso l'esterno nella direzione dell'angolo a
    const radial = (c, z, a, len) => reg(reg(prismY(c, 0, -len).translate([0, 0, z])).rotate([0, 0, a]));

    function pallina(p) {
      const Dm = p.diametro, t = p.spessore, h = p.rilievo, low = p.sfaccettata;
      const pr = profile(p.forma, Dm, low);
      const seg = low ? 10 : 96, J = low ? 'Miter' : 'Round';
      const rev = (c) => reg(c.revolve(seg));
      const outer = rev(pr.cs);
      let body = sub(outer, rev(OFF(pr.cs, -t, J)));
      const shell = (d) => sub(rev(OFF(pr.cs, d, J)), outer);   // strato esterno spesso d, aderente alla superficie
      const notes = [], info = [];
      const big = Dm * 2;
      // fino a quattro scritte, ognuna proiettata sulla superficie dove decide l'utente:
      // lato = angolo attorno alla pallina (0° davanti, 90° a destra, 180° dietro), altezza in % (0 = equatore, +100 = cima)
      const texts = [], zonesM = [], textMs = [];
      for (let i = 1; i <= 4; i++) {
        const str = String(p[i === 1 ? 'scritta' : 'scritta' + i] || '').trim();
        if (!str) continue;
        const ang = +p['lato' + i] || 0, hp = Math.max(-85, Math.min(85, +p['quota' + i] || 0)), cap = +p[i === 1 ? 'altTesto' : 'altTesto' + i] || p.altTesto;
        const zc = pr.zW + hp / 100 * (hp > 0 ? pr.zTop - pr.zW : pr.zW - pr.zBot);
        const rz = Math.max(4, radiusAt(pr, zc));
        // spazio in altezza: fino al bordo della pallina, senza toccare il cappuccio
        const room = Math.max(4, Math.min(pr.zTop - 4 - zc, zc - pr.zBot - 2) * 2 * 0.9);
        const q = Object.assign({}, p, { scritta: str, scritta2: '' }), keepN = new Set(NOTES);
        const undoNotes = () => { for (const n of [...NOTES]) if (!keepN.has(n)) NOTES.delete(n); };   // tengo solo gli avvisi dell'ultima prova
        let tf = fitText(q, { x: 0, y: 0, w: rz * 1.15, h: Math.min(room, (pr.zTop - pr.zBot) * 0.42) }, cap);
        if (!tf) continue;
        // tutta la scritta deve stare sulla parte "frontale" della pallina, non solo il suo centro:
        // ai bordi alto e basso la pallina è più stretta e più curva, e gli angoli (del logo, delle lettere)
        // finirebbero fuori o stirati. Limiti: metà larghezza <= 0,6 del raggio a quell'altezza,
        // e la scritta non sale/scende oltre il 72% tra l'equatore e la cima/il fondo.
        const zHi = pr.zW + 0.72 * (pr.zTop - pr.zW), zLo = pr.zW - 0.72 * (pr.zW - pr.zBot);
        for (let it = 0; it < 6; it++) {
          const bt = bounds(tf.cs), w = bt.w, hh = bt.h;
          const zt = zc + hh / 2, zb = zc - hh / 2;
          const lim = 0.6 * Math.min(radiusAt(pr, Math.min(zt, zHi)), radiusAt(pr, Math.max(zb, zLo)));
          let k = Math.min(1, lim / (w / 2));
          if (zt > zHi) k = Math.min(k, Math.max(0.05, (zHi - zc) / (hh / 2)));
          if (zb < zLo) k = Math.min(k, Math.max(0.05, (zc - zLo) / (hh / 2)));
          if (k > 0.985) break;
          undoNotes();
          tf = fitText(q, { x: 0, y: 0, w: w * k, h: hh * k }, cap);
          tf.reduced = true;
        }
        const c = MV(tf.cs, 0, zc), bc = bounds(c);
        const halfA = Math.asin(Math.min(1, bc.w / 2 / rz)) * 180 / Math.PI;
        const turn = (m) => reg(m.rotate([0, 0, ang]));
        if (p.stileTesto === 'traforata') body = sub(body, turn(prismY(stencil(c, tf.cap), 0, -big)));
        else textMs.push(turn(reg(prismY(c, 0, -big).intersect(shell(p.rilievoTesto)))));
        zonesM.push(turn(prismY(OFF(c, 1.5), 0, -big)));
        texts.push({ i, ang, zc, h: bc.h, halfA, cap: tf.cap });
        if (tf.reduced) notes.push(`Scritta ${i} ridotta a ${fmt(tf.cap)} mm per starci`);
        if (p.costruzione === 'meta') {
          const a0 = ((ang % 180) + 180) % 180;   // distanza dalla giunzione (a 90° e 270°)
          if (Math.abs(a0 - 90) < halfA + 2) notes.push(`Scritta ${i} sulla giunzione delle due metà: spostala verso 0° o 180°`);
        }
      }
      let textM = textMs.length ? union(textMs) : null;
      const zoneM = zonesM.length ? union(zonesM) : null;
      const avoid = (a, z) => {
        const aa = ((a + 540) % 360) - 180;
        if (p.costruzione === 'meta') { const d = Math.abs(Math.cos(aa * Math.PI / 180)); if (d < 0.25) return true; }   // lontano dalla giunzione
        return texts.some(q => { const da = Math.abs(((a - q.ang + 540) % 360) - 180); return da < q.halfA + 18 && Math.abs(z - q.zc) < q.h / 2 + Dm * 0.1; });
      };
      // decorazioni
      let dec = null;
      const n = Math.max(2, p.numero | 0);
      if (p.decorazione === 'spicchi') {
        const w = Math.max(1.6, Dm * 0.035), pl = [];
        for (let i = 0; i < n; i++) pl.push(reg(box(-w / 2, 0, -big, w / 2, big, big).rotate([0, 0, 180 / n + i * 360 / n])));
        dec = reg(union(pl).intersect(shell(h)));
      } else if (p.decorazione === 'anelli') {
        const w = Math.max(1.6, Dm * 0.04), bands = [], span = pr.zTop - pr.zBot;
        for (let i = 0; i < n; i++) { const z = pr.zBot + span * (i + 1) / (n + 1); bands.push(box(-big, -big, z - w / 2, big, big, z + w / 2)); }
        dec = reg(union(bands).intersect(shell(h)));
      } else if (['puntini', 'stelle', 'traforata'].includes(p.decorazione)) {
        const rows = (pr.zTop - pr.zBot) > Dm * 1.2 ? 4 : 3;
        const sp = spots(pr, n, rows, avoid);
        const rs = Math.min(Dm * 0.09, Math.PI * pr.rMax / n * 0.42);
        const items = sp.map(([a, z]) => {
          if (p.decorazione === 'puntini') {
            const r = Math.max(1.5, rs * 0.45), rr = pr.rMax;   // pallino: sfera appoggiata alla superficie
            return reg(reg(Manifold.sphere(r, 24)).translate([0, -(radiusAt(pr, z) + r * 0.15), z]).rotate([0, 0, a]));
          }
          return radial(soft(starCS(5, rs, rs * 0.45), 0.3), z, a, big);
        });
        if (items.length) {
          if (p.decorazione === 'traforata') body = sub(body, union(items));
          else if (p.decorazione === 'stelle') dec = reg(union(items).intersect(shell(h)));
          else dec = sub(union(items), outer);
        }
      }
      if (dec && zoneM) dec = sub(dec, zoneM);
      // appendino
      const rh = Math.max(2.2, Dm * 0.05), zT = pr.zTop;
      let cap = null;
      if (p.appendino === 'cappuccio') {
        body = sub(body, cylZ(rh, zT - t * 3 - 2, zT + 1, 0, 0, 32));
        if (dec) dec = sub(dec, cylZ(rh + 3, zT - 6, zT + 1, 0, 0, 32));
        let c = sub(knurled(2 * (rh + 2.6), zT - 4, zT + 5), outer);
        c = sub(c, reg(reg(Manifold.cylinder(4 * rh + 20, 1.3, 1.3, 20, true)).rotate([0, 90, 0]).translate([0, 0, zT + 2.6])));
        c = union([c, cylZ(rh - p.tolleranza / 2, zT - t - 3, zT + 1, 0, 0, 32)]);   // perno che entra nel foro, unito al cappuccio
        // fessura per il filo delle lucine: taglio verticale dal centro verso il dietro (il nastro passa da sinistra a destra)
        if (p.filoLuci) c = sub(c, box(-p.fessura / 2, 0, zT - t - 4, p.fessura / 2, big, zT + 7));
        cap = c;
      } else {
        const ro = Math.max(4, Dm * 0.07), ri = ro - 2.2, cz = zT + ri + 0.4;
        body = union([body, reg(sub(cylY(0, cz, ro, -1.4, 1.4, 40), cylY(0, cz, ri, -2, 2, 32)))]);
      }
      // foro per il LED sul fondo: per una lucina della catena dell'albero (aperto) o un LED a pila (con tappo).
      // Con le due metà il foro è tagliato a metà e nella stampa è orizzontale: allora ha due punte a 45°
      // verso l'alto e verso il basso di ogni metà, così il bordo del foro regge senza supporti.
      let led = null;
      if (p.foroLed && p.foroLed !== 'nessuno') {
        const rMaxL = Math.max(3, pr.rMax * 0.42);
        const rL = Math.min(p.diamLed / 2, rMaxL);
        if (rL < p.diamLed / 2 - 0.01) notes.push(`Foro per il LED ridotto a Ø ${fmt(2 * rL)} mm: di più indebolisce la pallina`);
        const tip = (c, r) => (p.costruzione === 'meta' ? R2(CrossSection.hull([c, C2(0, r * Math.SQRT2, 0.05, 4), C2(0, -r * Math.SQRT2, 0.05, 4)])) : c);
        const shapeL = (d) => tip(C2(0, 0, rL + d, 64), rL + d);
        const ext = (p.costruzione === 'meta' ? Math.SQRT2 : 1) * rL;
        // il foro sale finché la parete interna è più larga del foro
        let z1 = pr.zBot + t + 1;
        for (let z = pr.zBot; z < pr.zW; z += 0.5) { if (radiusAt(pr, z) - t > ext + 0.6) { z1 = z + 1; break; } }
        const hole = EXT(shapeL(0), pr.zBot - 2, z1);
        const clear = EXT(shapeL(3), pr.zBot - 2, z1 + 3);   // decorazioni e anello stanno lontani dal foro
        body = sub(body, hole);
        if (dec) dec = sub(dec, clear);
        if (textM) textM = sub(textM, clear);
        led = { rL, z1, clear };
        if (p.foroLed === 'tappo') {
          // tappo: perno che entra nel foro e, sotto, un piedino con la faccia piatta che copre il bordo del foro.
          // Si stampa appoggiato sulla faccia piatta (niente sbalzi) e la pallina ci sta anche in piedi.
          // Se il fondo è a punta (goccia) il piedino sarebbe un cilindro attorno alla punta: allora il tappo
          // è solo la punta, a filo, e si stampa capovolto.
          const zF = pr.zBot - 0.8, ext2 = (p.costruzione === 'meta' ? Math.SQRT2 : 1) * (rL + 2);
          let zs = null;
          for (let z = pr.zBot; z < pr.zW; z += 0.25) { if (radiusAt(pr, z) >= ext2) { zs = z; break; } }
          const plug = reg(EXT(shapeL(-p.tolleranza / 2), zF, z1).intersect(outer));
          if (zs !== null && zs - pr.zBot < 4) {
            led.lid = union([sub(EXT(shapeL(2), zF, zs + 0.5), outer), plug]);
            led.flat = true;
          } else led.lid = plug;
        }
      }
      const parts = [];
      const L1 = 'Colore 1', col = [p.col1, p.col2, p.col3];
      if (p.costruzione === 'meta') {
        const front = box(-big, -big, -big, big, 0, big), back = box(-big, 0, -big, big, big, big);
        const half = (m, k) => (m ? reg(m.intersect(k)) : null);
        const pf = (m) => (m ? reg(m.rotate([-90, 0, 0])) : null), pb = (m) => (m ? reg(m.rotate([90, 0, 0])) : null);
        const addHalf = (k, nameG, pr2) => {
          const bm = half(body, k), dm = half(dec, k), tm = half(textM, k);
          parts.push(part(`${nameG} · corpo`, bm, col[0], nameG, { print: pr2(bm) }));
          if (dm && dm.volume() > 0.5) parts.push(part(`${nameG} · decorazioni`, dm, col[1], nameG, { print: pr2(dm) }));
          if (tm && tm.volume() > 0.5) parts.push(part(`${nameG} · scritta`, tm, col[2], nameG, { print: pr2(tm) }));
        };
        addHalf(front, 'Metà davanti', pf);
        addHalf(back, 'Metà dietro', pb);
        notes.push('Due metà: fuori non servono supporti, ma dentro la cupola è a sbalzo e lo slicer può chiederli');
        // anello di giunzione: aderisce all'interno sul piano di separazione
        const inr = OFF(pr.cs, -t - p.tolleranza, J);
        let ring = reg(prismY(D(OFF(inr, 1, J), OFF(inr, -1.6, J)), 3, -3).intersect(rev(inr)));   // il bordo esterno lo dà la superficie interna
        ring = sub(ring, cylZ(rh + 3, zT - 12, zT + 2, 0, 0, 32));
        if (led) ring = sub(ring, led.clear);
        parts.push(part('Anello di giunzione', ring, col[0], 'Anello', { print: reg(ring.rotate([90, 0, 0])) }));
      } else {
        parts.push(part('Pallina · corpo', body, col[0], 'Pallina'));
        if (dec) parts.push(part('Pallina · decorazioni', dec, col[1], 'Pallina'));
        if (textM) parts.push(part('Pallina · scritta', textM, col[2], 'Pallina'));
        notes.push('Intera: serve il supporto sotto, e dentro la cupola in cima resta a sbalzo');
      }
      if (cap) parts.push(part('Cappuccio', cap, col[1], 'Cappuccio', { print: reg(cap.rotate([180, 0, 0])) }));
      if (led && led.lid) parts.push(part('Tappo del LED', led.lid, col[0], 'Tappo', { at: [pr.rMax + 25, 0, 0], print: led.flat ? led.lid : reg(led.lid.rotate([180, 0, 0])) }));
      info.push(['Misure', `Ø ${fmt(2 * pr.rMax)} × ${fmt(pr.zTop - pr.zBot)} mm, guscio ${fmt(t)} mm`]);
      const latoN = (a) => { const x = ((a % 360) + 360) % 360; return x === 0 ? 'davanti' : x === 180 ? 'dietro' : x === 90 ? 'a destra' : x === 270 ? 'a sinistra' : `${x}°`; };
      for (const q of texts) info.push([`Scritta ${q.i}`, `${fmt(q.cap)} mm, ${latoN(q.ang)}`]);
      if (texts.length && p.stileTesto === 'traforata') info.push(['Lettere', 'traforate: con un LED dentro si illuminano']);
      const tap = led && led.lid ? ' + tappo' : '';
      info.push(['Pezzi', p.costruzione === 'meta' ? `2 metà + anello${cap ? ' + cappuccio' : ''}${tap}: incolla le metà sull'anello` : `1${cap ? ' + cappuccio' : ''}${tap}`]);
      if (p.appendino === 'cappuccio') info.push(['Cappuccio', `foro per il nastro Ø 2,6 mm${p.filoLuci ? `, fessura per il filo da ${fmt(p.fessura)} mm` : ''}`]);
      if (p.appendino === 'cappuccio' && p.filoLuci) info.push(['Lucine', `i LED entrano dal foro in cima, Ø ${fmt(2 * rh)} mm`]);
      if (led) info.push(['Foro LED', `sul fondo, Ø ${fmt(2 * led.rL)} mm${led.lid ? ', con tappo' : ', aperto'}`]);
      if (p.costruzione === 'meta' && (dec || textM)) info.push(['Colori', 'decorazioni e scritta sono sulla cupola: serve una stampante multicolore']);
      for (const x of notes) info.push(['Nota', x]);
      return { parts: ok(parts), info, view: [-0.3, -1, 0.35] };
    }
    function radiusAt(pr, z) {
      // raggio del profilo all'altezza z (ricavato dalla sezione)
      const b = pr.cs.bounds();
      const sl = reg(pr.cs.intersect(RECT(0, z - 0.01, b.max[0] + 1, z + 0.01)));
      return sl.isEmpty() ? 0 : sl.bounds().max[0];
    }

    // ============ PALLINA A SPIRALE (intera, senza supporti) ============
    // Una sfera vuota stampata intera vorrebbe i supporti sotto (fuori) e in cima (dentro, il soffitto).
    // Qui sopra e sotto la superficie è fatta di spicchi pieghettati: ogni faccia della piega resta entro 45°
    // dalla verticale, quindi si regge da sola. In mezzo c'è la fascia liscia per scritte e simboli traforati.
    // Le pieghe possono essere dritte, a spirale o a V. La profondità delle valli si calcola partendo dal polo:
    //  - la faccia tra cresta e valle non deve sporgere oltre 45° (la cresta segue la sfera e ruota con la spirale);
    //  - la valle non può allargarsi troppo in fretta salendo (anche lei sporgerebbe).
    // La superficie interna ha le facce parallele a quelle esterne (spessore misurato perpendicolare alla faccia).
    const SPIR_SYMBOLS = { stella: 'Stella', cuore: 'Cuore', fiocco: 'Fiocco di neve', albero: 'Albero', campana: 'Campana', luna: 'Luna',
      pupazzo: 'Pupazzo di neve', regalo: 'Regalo', cometa: 'Stella cometa', candela: 'Candela', renna: 'Renna' };
    const SPIR_EMO = { fiocco: 'snowflake', albero: 'christmas-tree', campana: 'bell', luna: 'crescent-moon', pupazzo: 'snowman', regalo: 'wrapped-gift',
      cometa: 'shooting-star', candela: 'candle', renna: 'deer' };
    function symbolCS(id, S) {
      if (id === 'stella') return fillHoles(SHAPES.stella(S, { punte: 5 }).base);
      if (id === 'cuore') return SHAPES.cuore(S).base;
      const e = EMO_BY[SPIR_EMO[id]];
      return e ? fillHoles(artGeom(e, S, S * 1.2).sil) : null;
    }
    function spirale(p) {
      const Dm = p.diametro, R = Dm / 2, t = p.spessore, N = Math.max(8, Math.round(p.spicchi / 2) * 2), al = Math.PI / N;
      const cA = Math.cos(al), sA = Math.sin(al), TB = Math.tan(Math.PI / 4) / 1.2;   // 45° con margine (verificato con OrcaSlicer)
      const trama = p.trama, TG = trama === 'dritta' ? 0 : Math.tan(Math.max(0, Math.min(25, p.inclinazione)) * Math.PI / 180);
      const dir = p.verso === 'sinistra' ? -1 : 1, fascia = p.fascia;
      const notes = [], info = [], big = Dm * 2;
      // piedino piatto (Ø 0,6 del diametro) e foro per il LED dentro il piedino
      let rLed = p.foroLed && p.foroLed !== 'nessuno' ? p.diamLed / 2 : 0;
      const rFoot = Math.max({ piccolo: 0.15, medio: 0.225, grande: 0.3 }[p.piedino] * Dm || 0.15 * Dm, rLed + 4);
      if (rLed > rFoot - 3) { rLed = rFoot - 3; notes.push(`Foro per il LED ridotto a Ø ${fmt(2 * rLed)} mm`); }
      const zF = -Math.sqrt(R * R - rFoot * rFoot), zT = R, rh = Math.max(2.2, Dm * 0.05);
      // ---- profondità delle valli (x = raggio valle / raggio cresta), dal polo verso l'equatore ----
      const DS = 0.02;
      const f1 = (x, ap) => (ap * x * sA + TG * Math.abs(1 - x * cA)) / Math.sqrt(1 + x * x - 2 * x * cA);
      function march(cap) {
        const X = []; let b = 0;
        for (let i = Math.round(R / DS); i >= 0; i--) {
          const s = i * DS, a = Math.sqrt(Math.max(0, R * R - s * s)), ap = a > 1e-6 ? s / a : 1e6;
          let xr = 0; for (let x = 1; x >= 0; x -= 0.0025) { if (f1(x, ap) <= TB) { xr = x; break; } }
          const s1 = s + DS, aP = Math.sqrt(Math.max(0, R * R - s1 * s1));
          let rate;
          if (aP > 1e-6) { const e = Math.sqrt(aP * aP + b * b - 2 * aP * b * cA); rate = Math.max(0, (TB * e - TG * (b / aP) * Math.abs(aP * cA - b)) / (aP * sA)); }
          else rate = TB / sA;
          b = Math.min(xr * a, b + DS * rate, a * cap);
          X[i] = a > 1e-6 ? b / a : 0;
        }
        return X;
      }
      const Xc = march(1);
      // spicchi che continuano nella fascia: stessa profondità che hanno a 45° di latitudine, costante fino all'equatore
      const iRef = Math.round(R * Math.SQRT1_2 / DS), Xd = fascia === 'continua' ? null : Xc.map((x, i) => (i < iRef ? Math.min(x, Xc[iRef]) : x));
      const xOf = (X, z) => X[Math.min(X.length - 1, Math.round(Math.abs(z) / DS))];
      let zB = 0; for (let i = 0; i < Xc.length; i++) { if (Xc[i] < 0.999) { zB = i * DS; break; } }
      if (fascia !== 'nessuna' && zB < 3) notes.push('Fascia molto stretta: riduci l\'inclinazione della spirale o aumenta il diametro');
      // ---- rotazione della spirale ----
      const PSI = []; { let q = 0; for (let i = 0; i <= Math.round(R / DS); i++) { const z = i * DS, a = Math.sqrt(Math.max(1e-6, R * R - z * z)); PSI.push(q); const pleated = fascia === 'continua' ? Xc[i] < 0.999 : true; if (pleated) q += TG * DS / Math.max(a, 1.5); } }
      const psi = (z) => { const v = PSI[Math.min(PSI.length - 1, Math.round(Math.abs(z) / DS))]; return trama === 'v' ? v : dir * (z < 0 ? -v : v); };
      // ---- scritte e simboli: un lato ciascuno (davanti, destra, dietro, sinistra) ----
      const SIDES = [['Davanti', 0], ['Destra', 90], ['Dietro', 180], ['Sinistra', 270]];
      const hBox = Math.max(3, 2 * zB - 3), holes = [], wins = [];
      if (fascia !== 'nessuna') {
        SIDES.forEach(([nm, ang], k) => {
          const i = k + 1, kind = p['lato' + i];
          let cs = null, desc = '';
          if (kind === 'scritta') {
            const str = String(p['testo' + i] || '').trim(); if (!str) return;
            const tf = fitText(Object.assign({}, p, { scritta: str, scritta2: '' }), { x: 0, y: 0, w: 1.2 * R * 0.95, h: hBox }, p.altTesto);
            if (!tf) return;
            cs = stencil(tf.cs, tf.cap); desc = `"${str}", lettere ${fmt(tf.cap)} mm`;
            if (tf.reduced) notes.push(`${nm}: scritta ridotta a ${fmt(tf.cap)} mm per stare nella fascia`);
          } else if (kind === 'simbolo') {
            const S = Math.min(p.altSimbolo, hBox);
            let c0 = symbolCS(p['simbolo' + i], S); if (!c0) return;
            const b0 = bounds(c0), f = Math.min(1, 1.2 * R * 0.95 / b0.w, hBox / b0.h);
            if (f < 1) c0 = R2(c0.scale([f, f]));
            const b1 = bounds(c0); cs = MV(c0, -(b1.x0 + b1.x1) / 2, -(b1.y0 + b1.y1) / 2);
            desc = `${SPIR_SYMBOLS[p['simbolo' + i]] || ''}, alto ${fmt(bounds(cs).h)} mm`;
            if (S < p.altSimbolo - 0.05 || f < 0.97) notes.push(`${nm}: simbolo ridotto per stare nella fascia`);
          } else return;
          if (empty(cs)) return;
          const bb = bounds(cs), half = Math.asin(Math.min(1, (Math.max(-bb.x0, bb.x1) + 2) / R));
          holes.push(reg(reg(prismY(cs, 0, -big)).rotate([0, 0, ang])));
          wins.push({ c: (ang - 90) * Math.PI / 180, half });
          info.push([nm, desc]);
        });
      }
      // ---- profondità della valle in base a quota e angolo (cartigli: liscio solo attorno a scritte e simboli) ----
      const FADE = 1.5 * 2 * al;
      const wAt = (th) => { let w = 0; for (const q of wins) { let d = Math.abs(((th - q.c) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); const v = d <= q.half ? 1 : d >= q.half + FADE ? 0 : smoothW(1 - (d - q.half) / FADE); w = Math.max(w, v); } return w; };
      const xAt = (z, th) => fascia === 'continua' ? xOf(Xc, z) : fascia === 'nessuna' ? xOf(Xd, z) : (() => { const d = xOf(Xd, z), c = xOf(Xc, z), w = wAt(th); return d + (c - d) * w; })();
      // ---- anelli di vertici ----
      const SUB = Math.max(3, Math.min(8, Math.round(320 / (2 * N))));
      const u = (th) => [Math.cos(th), Math.sin(th)];
      function lineOf(P, Q, ridge, thr, ap, vt, inner) {
        const ex = Q[0] - P[0], ey = Q[1] - P[1], L = Math.hypot(ex, ey) || 1e-9;
        let nx = ey / L, ny = -ex / L; if (nx * (P[0] + Q[0]) + ny * (P[1] + Q[1]) < 0) { nx = -nx; ny = -ny; }
        let hh = 0;
        if (inner) {
          const ur = u(thr), vx = ap * ur[0] - vt * ur[1], vy = ap * ur[1] + vt * ur[0];   // velocità della cresta salendo (vz = 1)
          const nzv = ex * vy - ey * vx, nl = Math.hypot(ey, ex, nzv);
          hh = t / Math.sqrt(Math.max(0.05, 1 - (nzv / nl) ** 2));
        }
        return { nx, ny, c: nx * P[0] + ny * P[1] - hh };
      }
      const meet = (l1, l2) => { const det = l1.nx * l2.ny - l1.ny * l2.nx; return Math.abs(det) < 1e-9 ? null : [(l1.c * l2.ny - l1.ny * l2.c) / det, (l1.nx * l2.c - l1.c * l2.nx) / det]; };
      function ring(z, inner) {
        const a = Math.sqrt(Math.max(0, R * R - z * z)), ap = -z / a, ps = psi(z), vt = a * (psi(z + 0.05) - psi(z - 0.05)) / 0.1;
        const ri = inner ? Math.sqrt(Math.max(0, (R - t) ** 2 - z * z)) : a;
        const th = [], xs = [], Rk = [], Vk = [];
        for (let k = 0; k < N; k++) { th.push(ps + 2 * k * al); const x = xAt(z, ps + (2 * k + 1) * al); xs.push(x); const ur = u(th[k]), uv = u(th[k] + al); Rk.push([a * ur[0], a * ur[1]]); Vk.push([x * a * uv[0], x * a * uv[1]]); }
        let R2k = Rk, V2k = Vk, rMin = Infinity;
        if (inner) {
          const LA = [], LB = [];
          for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; LA.push(lineOf(Rk[k], Vk[k], 0, th[k], ap, vt, true)); LB.push(lineOf(Vk[k], Rk[k1], 1, th[k1], ap, vt, true)); }
          R2k = []; V2k = [];
          for (let k = 0; k < N; k++) {
            const kp = (k + N - 1) % N; let r = meet(LB[kp], LA[k]), v = meet(LA[k], LB[k]);
            const ur = u(th[k]), uv = u(th[k] + al);
            if (!r || r[0] * ur[0] + r[1] * ur[1] <= 0) r = [0.3 * ur[0], 0.3 * ur[1]];
            if (!v || v[0] * uv[0] + v[1] * uv[1] < 0.3) v = [0.3 * uv[0], 0.3 * uv[1]];
            R2k.push(r); V2k.push(v); rMin = Math.min(rMin, Math.hypot(...r));
          }
        }
        const pts = [];
        for (let k = 0; k < N; k++) {
          const k1 = (k + 1) % N, w = smoothW((xs[k] - 0.995) / 0.005);
          const segs = [[R2k[k], V2k[k], th[k]], [V2k[k], R2k[k1], th[k] + al]];
          for (const [A, B, th0] of segs) for (let s = 0; s < SUB; s++) {
            const f = s / SUB, ang = th0 + f * al;
            let px = A[0] + (B[0] - A[0]) * f, py = A[1] + (B[1] - A[1]) * f;
            if (w > 0) { px = px * (1 - w) + ri * Math.cos(ang) * w; py = py * (1 - w) + ri * Math.sin(ang) * w; }
            pts.push(px, py, z);
          }
        }
        return { pts, rMin };
      }
      function loft(rows, zBot, zTop) {
        const n = rows[0].length / 3, P = [], T = [];
        for (const r of rows) for (const v of r) P.push(v);
        const cb = P.length / 3; P.push(0, 0, zBot); const ct = cb + 1; P.push(0, 0, zTop);
        for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < n; i++) { const a0 = j * n + i, b0 = j * n + (i + 1) % n, c0 = (j + 1) * n + (i + 1) % n, d0 = (j + 1) * n + i; T.push(a0, b0, c0, a0, c0, d0); }
        const l = (rows.length - 1) * n;
        for (let i = 0; i < n; i++) { T.push(cb, (i + 1) % n, i); T.push(ct, l + i, l + (i + 1) % n); }
        return reg(new Manifold(new Mesh({ numProp: 3, vertProperties: new Float32Array(P), triVerts: new Uint32Array(T) })));
      }
      const DZ = Math.max(0.2, Dm / 350);
      const oRows = []; for (let z = zF; z < zT - 0.3; z += DZ) oRows.push(ring(z, false).pts);
      const outer = loft(oRows, zF, zT);
      const iRows = []; let zTopI = zF + t;
      for (let z = zF + t; z < R - t; z += DZ) { const r = ring(z, true); if (r.rMin < rh - 0.6) { zTopI = z; break; } iRows.push(r.pts); zTopI = z + DZ; }
      const inner = loft(iRows, zF + t, zTopI);
      let body = sub(outer, inner);
      body = sub(body, cylZ(rh, Math.min(R - t * 3 - 2, zTopI - 1), R + 1, 0, 0, 40));   // foro del perno del cappuccio (e delle lucine)
      if (rLed > 0) body = sub(body, cylZ(rLed, zF - 1, zF + t + 1, 0, 0, 64));
      if (holes.length) body = sub(body, reg(union(holes).intersect(box(-big, -big, -zB + 0.3, big, big, zB - 0.3))));
      // ---- cappuccio: sotto segue le pieghe; fessura per il filo delle lucine ----
      let cap = sub(knurled(2 * (rh + 2.6), zT - 4, zT + 5), outer);
      cap = sub(cap, reg(reg(Manifold.cylinder(4 * rh + 20, 1.3, 1.3, 20, true)).rotate([0, 90, 0]).translate([0, 0, zT + 2.6])));
      cap = union([cap, cylZ(rh - p.tolleranza / 2, zT - t - 3, zT + 1, 0, 0, 32)]);
      if (p.filoLuci) cap = sub(cap, box(-p.fessura / 2, 0, zT - t - 4, p.fessura / 2, big, zT + 7));
      // ---- fasce colorate: tagli orizzontali a strati interi (0,2 mm dal piatto) ----
      // con un multicolore sono parti dello stesso oggetto; con un solo ugello basta cambiare filamento a quelle altezze
      const LH = 0.2, snap = (z) => zF + Math.round((z - zF) / LH) * LH, segs = [];
      if (p.coloreFascia && fascia !== 'nessuna' && zB > 1) segs.push([snap(-zB), snap(zB), 3]);
      const nr = Math.max(0, Math.min(6, p.righe | 0));
      if (nr > 0) {
        const w = Math.max(2 * LH, Math.round(p.altRighe / LH) * LH), z0 = (fascia === 'nessuna' ? 0 : zB) + 1.5;
        const spans = [[z0, zT - 6], [z0, -zF - 2]];        // sopra (fino al cappuccio) e sotto (fino al piedino)
        spans.forEach(([lo, hi], side) => {
          if (hi - lo < w * 1.5) return;
          for (let i = 0; i < nr; i++) {
            const zc = lo + (hi - lo) * (i + 0.5) / nr;
            const c = side ? -zc : zc; segs.push([snap(c - w / 2), snap(c + w / 2), 4]);
          }
        });
      }
      const parts = [];
      if (segs.length) {
        const slab = (q) => box(-big, -big, q[0], big, big, q[1]);
        const byCol = { 3: segs.filter(q => q[2] === 3), 4: segs.filter(q => q[2] === 4) };
        const all = union(segs.map(slab));
        parts.push(part('Pallina · colore 1', sub(body, all), p.col1, 'Pallina'));
        if (byCol[3].length) parts.push(part('Pallina · fascia', reg(body.intersect(union(byCol[3].map(slab)))), p.col3, 'Pallina'));
        if (byCol[4].length) parts.push(part('Pallina · righe', reg(body.intersect(union(byCol[4].map(slab)))), p.col4, 'Pallina'));
        // cambi di filamento dal basso, in mm dal piatto
        const ev = []; for (const q of segs) { ev.push([q[0], q[2]]); ev.push([q[1], 1]); }
        ev.sort((a, b) => a[0] - b[0]);
        info.push(['Cambi colore', ev.map(([z, c]) => `${fmt(z - zF)} mm → ${c === 1 ? 'colore 1' : c === 3 ? 'colore 3' : 'colore 4'}`).join(' · ')]);
      } else parts.push(part('Pallina a spirale', body, p.col1, 'Pallina'));
      parts.push(part('Cappuccio', cap, p.col2, 'Cappuccio', { print: reg(cap.rotate([180, 0, 0])) }));
      if (rLed > 0 && p.foroLed === 'tappo') {
        const lid = union([cylZ(rFoot - 0.5, zF - 1.2, zF, 0, 0, 96), cylZ(rLed - p.tolleranza / 2, zF, zF + t + 1.5, 0, 0, 64)]);
        parts.push(part('Tappo del LED', lid, p.col1, 'Tappo', { at: [R + rFoot + 8, 0, 1.2] }));
      }
      const tramaN = trama === 'dritta' ? 'dritti' : trama === 'v' ? `a V, ${p.inclinazione}°` : `a spirale, ${p.inclinazione}°`;
      info.unshift(['Misure', `Ø ${fmt(Dm)} × ${fmt(zT - zF)} mm, guscio ${fmt(t)} mm`], ['Spicchi', `${N} ${tramaN}`],
        ['Fascia', fascia === 'nessuna' ? 'nessuna: spicchi dappertutto' : `${fascia === 'continua' ? 'continua' : 'solo attorno a scritte e simboli'}, alta ${fmt(2 * zB)} mm`]);
      info.push(['Piedino', `Ø ${fmt(2 * rFoot)} mm`]);
      if (rLed > 0) info.push(['Foro LED', `Ø ${fmt(2 * rLed)} mm${p.foroLed === 'tappo' ? ', con tappo' : ', aperto'}`]);
      info.push(['Foro in cima', `Ø ${fmt(2 * rh)} mm: perno del cappuccio${p.filoLuci ? ' e lucine su filo' : ''}`]);
      info.push(['Stampa', 'intera, supporti disattivati, brim']);
      info.push(['Pezzi', `pallina + cappuccio${parts.length > 2 ? ' + tappo' : ''}`]);
      for (const x of notes) info.push(['Nota', x]);
      return { parts: ok(parts), info, view: [-0.3, -1, 0.3] };
    }

    // ============ ALBERO 3D ============
    function albero(p) {
      const Ht = p.altezza, R = p.diametro / 2, n = Math.max(3, Math.min(12, p.punte | 0)), parts = [], info = [], notes = [];
      if (p.stile === 'incastro') return alberoIncastro(p);
      const G = 'Albero';
      let zb = 0, plinth = null, textM = null;
      if (p.base) {
        const hb = Math.max(Ht * 0.08, p.scritta || p.scritta2 ? p.altTesto * 1.6 + 4 : 0, 6), rb = R * 1.08 + 2;
        plinth = roundCylZ(rb, 0, hb);
        const tf = (p.scritta || p.scritta2) ? fitText(p, { x: 0, y: hb / 2, w: rb * 1.3, h: hb - 3 }, p.altTesto) : null;
        if (tf) {
          textM = reg(prismY(tf.cs, 0, -rb * 2).intersect(sub(cylZ(rb + p.rilievoTesto, 0, hb, 0, 0, 96), cylZ(rb - 0.01, -1, hb + 1, 0, 0, 96))));
          info.push(['Lettere', `${fmt(tf.cap)} mm, sul bordo della base`]);
          if (tf.reduced) notes.push('Scritta ridotta per stare sulla base');
        }
        zb = hb;
      }
      const hTree = Ht - zb - (p.stella ? R * 0.2 : 0);
      const cs = soft(starCS(n, R, R * 0.6), Math.min(1.5, R * 0.04));
      let tree;
      if (p.stile === 'strati') {
        const k = Math.max(3, p.strati | 0), hl = hTree / k, layers = [];
        for (let i = 0; i < k; i++) {
          const s = 1 - 0.85 * i / k;
          layers.push({ m: EXT(ROT(R2(cs.scale([s, s])), i * p.torsione / k), zb + i * hl - (i ? 0.01 : 0), zb + (i + 1) * hl), i });
        }
        if (p.alterna) {
          const a = layers.filter(l => l.i % 2 === 0).map(l => l.m), b = layers.filter(l => l.i % 2 === 1).map(l => l.m);
          tree = union(a); parts.push(part('Albero · strati colore 1', tree, p.col1, G));
          if (b.length) { const tb = union(b); parts.push(part('Albero · strati colore 2', tb, p.col2, G)); tree = union([tree, tb]); }
          info.push(['Stampante a un colore', `cambia filamento ogni ${fmt(hl)} mm`]);
        } else { tree = union(layers.map(l => l.m)); parts.push(part('Albero', tree, p.col1, G)); }
      } else {
        tree = reg(reg(cs.extrude(hTree, Math.ceil(hTree / 1.2), p.torsione, 0.02)).translate([0, 0, zb]));
        parts.push(part('Albero', tree, p.col1, G));
        notes.push('Si può stampare in modalità vaso a spirale: diventa vuoto e leggerissimo');
      }
      const zTop = zb + hTree;
      if (p.stella) {
        const Rs = Math.max(8, R * 0.32), star = union([reg(star3D(5, Rs, Rs * 0.45, Math.max(2.5, Rs * 0.22)).translate([0, 0, zTop + Rs * 0.62])), cylZ(Math.max(2, Rs * 0.15), zTop - Rs * 0.4, zTop + Rs * 0.4, 0, 0, 24)]);
        const s2 = reg(star);
        for (const q of parts) q.m = sub(q.m, s2);
        parts.push(part('Stella', s2, p.col2, G));
      }
      if (plinth) {
        parts.push(part('Base', plinth, p.col3, G));
        if (textM) parts.push(part('Scritta', textM, p.col2, G));
      }
      info.unshift(['Misure', `Ø ${fmt(plinth ? 2 * (R * 1.08 + 2) : 2 * R)} × ${fmt(p.stella ? zTop + Math.max(8, R * 0.32) * 1.55 : zTop)} mm`]);
      info.push(['Colori', `${parts.length > 1 ? parts.length + ' parti' : '1'}, stampa in piedi`]);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [-0.35, -1, 0.45] };
    }
    function roundCylZ(r, z0, z1) { return H.roundCyl(r, z0, z1, Math.min(1.2, (z1 - z0) / 4), 0.4, 96); }
    function alberoIncastro(p) {
      const S = p.altezza, tk = p.spessore, sl = tk + p.tolleranza;
      // sagoma: l'albero di Natale Fluent; decorazioni (palline, stella) = tutto ciò che non è del verde principale
      const g = artGeom(EMO_BY['christmas-tree'], S), main = EMO_BY['christmas-tree'].pal[0];
      const sh = { base: OFF(OFF(OFF(g.sil, 0.8), 0.4), -0.4), decor: U(Object.entries(g.regions).filter(([hex]) => hex !== main).map(([, cs]) => cs)) };
      const slotA = RECT(-sl / 2, 0, sl / 2, S), slotB = RECT(-sl / 2, -S, sl / 2, 0);
      const parts = [];
      const make = (slot, name, rotZ) => {
        const bs = D(sh.base, slot), ds = p.decorazioni ? D(I(sh.decor, sh.base), OFF(slot, 1)) : null;
        const b = EXT(bs, -tk / 2, tk / 2), d = EXT(ds, tk / 2, tk / 2 + p.rilievo);
        const place = (m) => (m ? reg(reg(reg(m.rotate([90, 0, 0])).rotate([0, 0, rotZ])).translate([0, 0, S / 2])) : null);
        const flat = (m) => (m ? reg(m.translate([0, 0, tk / 2])) : null);
        parts.push(part(`${name} · albero`, place(b), p.col1, name, { print: flat(b) }));
        if (d) parts.push(part(`${name} · decorazioni`, place(d), p.col2, name, { print: flat(d) }));
      };
      make(slotA, 'Pezzo A', 0);
      make(slotB, 'Pezzo B', 90);
      return { parts: ok(parts), info: [['Misure', `${fmt(S)} mm di altezza, 2 pezzi piatti da ${fmt(tk)} mm`], ['Montaggio', 'infila il pezzo A (fessura in alto) sul pezzo B (fessura in basso)'], ['Stampante a un colore', `cambio filamento a ${fmt(tk)} mm → colore 2`]] };
    }

    // ============ STELLA 3D ============
    function star3D(n, R, r, d) {
      const pts = (i, q) => { const a = (90 + i * 180 / n) * Math.PI / 180; return [q * Math.cos(a), 0, q * Math.sin(a)]; };
      const tips = [];
      for (let i = 0; i < n; i++) tips.push(hullPts([[0, -d, 0], [0, d, 0], pts(2 * i, R), pts(2 * i - 1, r), pts(2 * i + 1, r)]));
      return union(tips);
    }
    function stella(p) {
      const n = Math.max(4, Math.min(12, p.punte | 0)), R = p.diametro / 2, r = R * p.rapporto / 100, d = R * p.spessore / 100;
      let m = star3D(n, R, r, d);
      const info = [['Misure', `Ø ${fmt(2 * R)} mm, spessore ${fmt(2 * d)} mm`]];
      if (p.uso === 'puntale') {
        const ri = p.attacco / 2 + p.tolleranza / 2, ro = ri + 2.4, zt = -r * Math.cos(Math.PI / n) * 0.6, zb2 = zt - p.lunghezzaAttacco;
        const tube = sub(cylZ(ro, zb2, zt, 0, 0, 64), coneZ(ri, ri * 0.75, zb2 - 0.01, zt - 2, 64));
        m = union([sub(m, coneZ(ri, ri * 0.75, zb2 - 0.01, zt - 2, 64)), tube]);
        info.push(['Attacco', `tubo Ø ${fmt(2 * ri)} mm (si stringe verso l'alto), lungo ${fmt(p.lunghezzaAttacco)} mm`]);
      } else {
        const ro = Math.max(3.5, R * 0.08), ri = ro - 2, cz = R + ri - 1.6;
        m = union([m, sub(cylY(0, cz, ro, -1.4, 1.4, 40), cylY(0, cz, ri, -2, 2, 32))]);
      }
      const big = R * 4;
      const fr = reg(m.intersect(box(-big, -big, -big, big, 0, big))), bk = reg(m.intersect(box(-big, 0, -big, big, big, big)));
      return {
        parts: [part('Stella · metà davanti', fr, p.col1, 'Metà davanti', { print: reg(fr.rotate([-90, 0, 0])) }), part('Stella · metà dietro', bk, p.col1, 'Metà dietro', { print: reg(bk.rotate([90, 0, 0])) })],
        info: info.concat([['Stampa', 'le due metà con il lato piatto sul piatto, poi incollale']]),
      };
    }

    // ============ LANTERNA ============
    function lanterna(p) {
      const Dl = p.diametro, Hl = p.altezza, w = p.parete, fondo = 2.4, hex = p.forma === 'esagonale';
      const parts = [], info = [], notes = [];
      const R = hex ? Dl / Math.sqrt(3) : Dl / 2, seg = hex ? 6 : 96;
      const prism = (r, z0, z1) => reg(reg(Manifold.cylinder(z1 - z0, r, r, seg)).translate([0, 0, z0]));
      const inR = hex ? (Dl / 2 - w) / Math.cos(Math.PI / 6) : Dl / 2 - w;
      let body = sub(prism(R, 0, Hl), prism(inR, fondo, Hl + 1));
      // sede del lumino e foro per spingerlo fuori
      const rt = 19.3 + p.tolleranza / 2;
      body = union([body, sub(cylZ(rt + 1.6, fondo - 0.01, fondo + 4, 0, 0, 64), cylZ(rt, fondo - 0.1, fondo + 5, 0, 0, 64))]);
      body = sub(body, cylZ(8, -1, fondo + 1, 0, 0, 48));
      // fascia bassa con scritta
      const lines = [p.scritta, p.scritta2].filter(x => x && x.trim());
      let band = 10, textM = null;
      if (lines.length) {
        const bw = hex ? Dl / Math.sqrt(3) * 0.92 : Dl * 0.8;
        const tf = fitText(p, { x: 0, y: 0, w: bw, h: Math.max(8, p.altTesto * 2.4) }, p.altTesto);
        if (tf) {
          band = bounds(tf.cs).h + 8;
          const c = MV(tf.cs, 0, band / 2);
          const outer = hex ? prism(R, -1, Hl + 1) : cylZ(R, -1, Hl + 1, 0, 0, 96);
          const sh2 = sub(hex ? prism(R + p.rilievoTesto / Math.cos(Math.PI / 6), 0, Hl) : cylZ(R + p.rilievoTesto, 0, Hl, 0, 0, 96), outer);
          if (p.stileTesto === 'traforata') body = sub(body, prismY(stencil(c, tf.cap), 0, -2 * Dl));
          else textM = reg(prismY(c, 0, -2 * Dl).intersect(sh2));
          info.push(['Lettere', `${fmt(tf.cap)} mm`]);
          if (tf.reduced) notes.push('Scritta ridotta per stare sulla fascia');
        }
      }
      // motivi traforati
      const rows = Math.max(1, p.righe | 0), per = hex ? 6 * Math.max(1, Math.round((p.perRiga | 0) / 6)) : Math.max(3, p.perRiga | 0);
      const top = 10, zone = Hl - band - top, size = Math.min(p.motivo, zone / rows * 0.85, (hex ? Dl / Math.sqrt(3) : Math.PI * Dl / per) * 0.8);
      // motivi traforati: sagome dei disegni Fluent (le stelle restano geometriche, più pulite da traforare)
      const motif = p.disegno === 'stelle' ? fillHoles(SHAPES.stella(size, { punte: 5 }).base)
        : fillHoles(artGeom(EMO_BY[{ fiocchi: 'snowflake', alberi: 'evergreen-tree', cuori: 'red-heart' }[p.disegno] || 'snowflake'], size).sil);
      const holes = [];
      for (let j = 0; j < rows; j++) {
        const z = band + zone * (j + 0.5) / rows;
        for (let i = 0; i < per; i++) {
          let a = (i + (hex ? 0 : (j % 2) * 0.5)) * 360 / per;
          if (textM && j === 0 && false) continue;
          holes.push(radial(motif, z, a, Dl));
        }
      }
      if (holes.length) body = sub(body, union(holes));
      parts.push(part('Lanterna', body, p.col1, 'Lanterna'));
      if (textM) parts.push(part('Lanterna · scritta', textM, p.col2, 'Lanterna'));
      info.unshift(['Misure', `${hex ? 'esagonale ' : 'Ø '}${fmt(Dl)} × ${fmt(Hl)} mm`]);
      info.push(['Lumino', `sede Ø ${fmt(2 * rt)} mm per lumini LED da 38 mm`]);
      info.push(['Motivi', `${rows * per} da ${fmt(size)} mm`]);
      info.push(['Attenzione', 'usa solo lumini LED: la plastica non regge la fiamma']);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [-0.3, -1, 0.5] };
    }

    // palla piatta: una decorazione piatta con forma e disegni propri
    function palla(p) { return Object.assign(piatto(Object.assign({}, p, { forma: 'palla', altezza: p.diametro, decorazioni: true })), { view: [0, -0.7, 1] }); }

    // ogni generatore riporta in fondo gli avvisi sui loghi
    const withNotes = (fn) => (p) => { NOTES.clear(); const r = fn(p); for (const n of NOTES) r.info.push(['Nota', n]); NOTES.clear(); return r; };
    return { pallina: withNotes(pallina), spirale: withNotes(spirale), piatto: withNotes(piatto), palla: withNotes(palla), albero: withNotes(albero), stella, lanterna: withNotes(lanterna), formina: withNotes(formina) };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

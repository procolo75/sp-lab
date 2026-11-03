// Casetta di Natale in kit: una cartolina piatta come le stampate dei modellini, con i pezzi attaccati al telaio da
// piccoli canali da spezzare. Si staccano e si montano a incastro: quattro pareti con gli angoli a pettine, due falde
// del tetto con le asole, una base con le fessure, alberi, pupazzo di neve e pacco regalo che si infilano nella base.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto.
// - ogni pezzo si stampa piatto, faccia esterna in alto: sopra c'è lo strato colorato (decorazioni) di spessore p.strato,
//   quindi con una stampante a un colore basta un cambio filamento;
// - le decorazioni hanno linee larghe almeno 0,9 mm (due passate con ugello 0,4) e gli spazi almeno 0,6 mm;
// - l'anteprima mostra la cartolina e, a destra, la casetta montata (ruolo 'model': non va nel file).
// Nello stesso file: lanterna in kit (4 pannelli traforati a pettine, base, cappello, manico) e albero in kit
// (3 sagome incrociate a 60° su una base tonda). Tutti e tre hanno la "prova incastri": pochi pezzi piccoli per tarare il gioco.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function casetta(H) {
    const { CrossSection, reg, union, fmt } = H;
    const DEG = Math.PI / 180;

    // ---------- strumenti 2D ----------
    const R2 = (c) => reg(c);
    const P2 = (pts) => R2(CrossSection.ofPolygons([pts], 'NonZero'));
    const C2 = (x, y, r, seg) => R2(R2(CrossSection.circle(r, seg || Math.max(16, Math.min(64, Math.round(r * 6))))).translate([x, y]));
    const RECT = (x0, y0, x1, y1) => P2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const U = (list) => { list = list.filter(c => c && !c.isEmpty()); return list.length === 0 ? null : list.length === 1 ? list[0] : R2(CrossSection.union(list)); };
    const D = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
    const I = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
    const OFF = (c, d, j = 'Round') => (c ? R2(c.offset(d, j)) : null);
    const MV = (c, x, y) => (c ? R2(c.translate([x, y])) : null);
    const ROT = (c, deg) => (c ? R2(c.rotate(deg)) : null);
    const MIRX = (c) => (c ? R2(c.mirror([1, 0])) : null);
    const MIRY = (c) => (c ? R2(c.mirror([0, 1])) : null);
    const HULL = (list) => R2(CrossSection.hull(list.filter(Boolean)));
    const empty = (c) => !c || c.isEmpty() || c.area() < 0.05;
    const bounds = (c) => { const b = c.bounds(); return { x0: b.min[0], y0: b.min[1], x1: b.max[0], y1: b.max[1], w: b.max[0] - b.min[0], h: b.max[1] - b.min[1] }; };
    // toglie le parti più sottili di w (non si stamperebbero)
    const clean = (c, w) => (empty(c) ? null : OFF(OFF(c, -w / 2, 'Miter'), w / 2, 'Round'));
    const EXT = (c, z0, z1) => (empty(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
    function stroke(pts, w) {
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push(HULL([C2(pts[i][0], pts[i][1], w / 2, 16), C2(pts[i + 1][0], pts[i + 1][1], w / 2, 16)]));
      return U(segs);
    }
    function starCS(n, R, r, cx = 0, cy = 0, rot = 90) {
      const pts = [];
      for (let i = 0; i < 2 * n; i++) { const a = (rot + i * 180 / n) * DEG, q = i % 2 ? r : R; pts.push([cx + q * Math.cos(a), cy + q * Math.sin(a)]); }
      return P2(pts);
    }
    function rng(seed) { let a = (seed | 0) * 2654435761 >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    // ---------- forme ----------
    const arch = (x, y0, w, h) => U([RECT(x - w / 2, y0, x + w / 2, y0 + Math.max(0.1, h - w / 2)), C2(x, y0 + Math.max(0.1, h - w / 2), w / 2, 48)]);
    function pointed(x, y0, w, h) {   // arco a sesto acuto
      const ys = y0 + Math.max(0.1, h - 0.866 * w);
      const top = I(I(C2(x - w / 2, ys, w, 64), C2(x + w / 2, ys, w, 64)), RECT(x - w, ys, x + w, ys + 2 * w));
      return U([RECT(x - w / 2, y0, x + w / 2, ys + 0.01), top]);
    }
    function heart(cx, cy, s) {
      const r = s * 0.27, tip = C2(cx, cy - s * 0.46, 0.25, 8);
      return U([HULL([C2(cx - s * 0.22, cy + s * 0.12, r), tip]), HULL([C2(cx + s * 0.22, cy + s * 0.12, r), tip])]);
    }
    function flake(cx, cy, r, w = 1) {
      const out = [];
      for (let k = 0; k < 6; k++) {
        const a = (90 + k * 60) * DEG, ca = Math.cos(a), sa = Math.sin(a);
        out.push(stroke([[cx, cy], [cx + r * ca, cy + r * sa]], w));
        if (r > 3.2) for (const s of [-1, 1]) {
          const bx = cx + 0.55 * r * ca, by = cy + 0.55 * r * sa, b = a + s * 45 * DEG;
          out.push(stroke([[bx, by], [bx + 0.36 * r * Math.cos(b), by + 0.36 * r * Math.sin(b)]], w));
        }
      }
      return U(out);
    }
    const star = (cx, cy, R) => starCS(5, R, R * 0.45, cx, cy);
    // fiocco del pacco: due anse e il nodo
    const bow = (cx, cy, s) => U([HULL([C2(cx - s * 0.42, cy + s * 0.2, s * 0.22), C2(cx, cy, 0.4, 8)]), HULL([C2(cx + s * 0.42, cy + s * 0.2, s * 0.22), C2(cx, cy, 0.4, 8)]), C2(cx, cy, s * 0.14)]);

    // ---------- aperture: finestre, porte, ornamenti ----------
    // ogni elemento aggiunge al lato: hole (traforo passante), decor (strato colorato), keep (zona da non coprire con altre decorazioni)
    const FR = 1.6, MW = 1.6;   // cornice e listelli delle finestre
    function newFace() { return { holes: [], decor: [], keep: [], base: [] }; }
    function windowAt(F, kind, x, y0, w, h, holed, extra = {}) {
      let sh, bars;
      if (kind === 'arco') { sh = arch(x, y0, w, h); bars = U([RECT(x - MW / 2, y0, x + MW / 2, y0 + h), RECT(x - w, y0 + (h - w / 2) * 0.62 - MW / 2, x + w, y0 + (h - w / 2) * 0.62 + MW / 2)]); }
      else if (kind === 'acuta') { sh = pointed(x, y0, w, h); bars = U([RECT(x - MW / 2, y0, x + MW / 2, y0 + h), RECT(x - w, y0 + (h - 0.866 * w) * 0.95 - MW / 2, x + w, y0 + (h - 0.866 * w) * 0.95 + MW / 2)]); }
      else if (kind === 'tonda') { sh = C2(x, y0 + h / 2, w / 2, 48); bars = U([RECT(x - MW / 2, y0 - 1, x + MW / 2, y0 + h + 1), RECT(x - w, y0 + h / 2 - MW / 2, x + w, y0 + h / 2 + MW / 2)]); }
      else if (kind === 'rosone') {
        sh = C2(x, y0 + h / 2, w / 2, 64);
        const sp = []; for (let k = 0; k < 4; k++) sp.push(ROT(RECT(-w, -MW / 2, w, MW / 2), k * 45));
        bars = U([MV(U(sp), x, y0 + h / 2), D(C2(x, y0 + h / 2, w * 0.2), C2(x, y0 + h / 2, w * 0.2 - MW))]);
      } else if (kind === 'vetrina') {
        sh = RECT(x - w / 2, y0, x + w / 2, y0 + h);
        const n = Math.max(2, Math.round(w / 11)), vb = [];
        for (let k = 1; k < n; k++) vb.push(RECT(x - w / 2 + k * w / n - MW / 2, y0, x - w / 2 + k * w / n + MW / 2, y0 + h));
        vb.push(RECT(x - w / 2, y0 + h * 0.74 - MW / 2, x + w / 2, y0 + h * 0.74 + MW / 2));
        bars = U(vb);
      } else { sh = RECT(x - w / 2, y0, x + w / 2, y0 + h); bars = U([RECT(x - MW / 2, y0, x + MW / 2, y0 + h), RECT(x - w / 2, y0 + h / 2 - MW / 2, x + w / 2, y0 + h / 2 + MW / 2)]); }
      bars = I(bars, sh);
      if (holed) F.holes.push(D(sh, bars));
      F.decor.push(D(OFF(sh, FR), sh), bars);
      if (kind !== 'tonda' && kind !== 'rosone') F.decor.push(RECT(x - w / 2 - FR - 1.4, y0 - FR - 1.8, x + w / 2 + FR + 1.4, y0 - FR + 0.2));   // davanzale
      let keep = OFF(sh, FR + 2.2);
      if (extra.shutters) {
        // scuri: due ante ai lati, con un cuore traforato nel colore del pezzo
        const sw = Math.max(4, w * 0.48), top = y0 + h;
        for (const s of [-1, 1]) {
          const x0 = s < 0 ? x - w / 2 - FR - 0.8 - sw : x + w / 2 + FR + 0.8, panel = RECT(x0, y0, x0 + sw, top);
          F.decor.push(D(panel, U([heart(x0 + sw / 2, top - Math.min(sw, h) * 0.32, Math.min(sw * 0.6, 4.2)), RECT(x0 + 1.2, y0 + h * 0.42, x0 + sw - 1.2, y0 + h * 0.42 + 0.8)])));
          keep = U([keep, OFF(panel, 2)]);
        }
      }
      F.keep.push(keep);
      return sh;
    }
    function doorAt(F, kind, x, w, h, opts = {}) {
      const sh = kind === 'acuta' ? pointed(x, 0, w, h) : kind === 'arco' ? arch(x, 0, w, h) : RECT(x - w / 2, 0, x + w / 2, h);
      const ring = D(OFF(sh, FR), sh);
      F.decor.push(I(ring, RECT(x - w, 0, x + w, h + 10)));
      // pannelli della porta: una cornice interna e la maniglia
      const inner = OFF(sh, -2.4);
      if (!empty(inner)) F.decor.push(I(D(inner, OFF(inner, -1)), RECT(x - w, 2.4, x + w, h)));
      F.decor.push(C2(x + w * 0.28, h * 0.42, 1.15));
      if (opts.planks) for (let k = 1; k < 4; k++) F.decor.push(I(RECT(x - w / 2 + k * w / 4 - 0.5, 3, x - w / 2 + k * w / 4 + 0.5, h), OFF(inner, -1.2)));
      if (opts.heart) { const hs = Math.min(w * 0.36, 7); F.holes.push(heart(x, h - w / 2 - hs * 0.15, hs)); }
      if (opts.wreath) wreath(F, x, h * 0.66, Math.min(w * 0.3, 6));
      F.keep.push(OFF(sh, FR + 2.2));
      F.door = sh;
      return sh;
    }
    function wreath(F, cx, cy, r) {
      const ring = D(C2(cx, cy, r, 48), C2(cx, cy, r - 1.6, 48));
      F.decor.push(ring, bow(cx, cy - r + 0.4, r * 0.9));
      F.keep.push(C2(cx, cy, r + 2.5));
    }
    // ornamento nel timpano: cuore o stella traforati con il bordo, fiocco di neve, finestra tonda, ghirlanda
    function ornament(F, kind, cx, cy, s, holed) {
      if (kind === 'nessuno' || s < 6) return;
      if (kind === 'cuore' || kind === 'stella') {
        const sh = kind === 'cuore' ? heart(cx, cy, s) : star(cx, cy, s * 0.55);
        if (holed) F.holes.push(sh); else F.decor.push(OFF(sh, -0.01));
        F.decor.push(D(OFF(sh, 1.6), sh));
        F.keep.push(OFF(sh, 3.6));
      } else if (kind === 'fiocco') { F.decor.push(flake(cx, cy, s * 0.5, 1.2)); F.keep.push(C2(cx, cy, s * 0.5 + 2.5)); }
      else if (kind === 'tondo') windowAt(F, 'tonda', cx, cy - s * 0.4, s * 0.8, s * 0.8, holed);
      else if (kind === 'rosone') windowAt(F, 'rosone', cx, cy - s * 0.45, s * 0.9, s * 0.9, holed);
      else if (kind === 'ghirlanda') wreath(F, cx, cy, s * 0.45);
    }
    // tenda a strisce sopra la vetrina (bottega): strisce alterne col bordo a festoni
    function awning(F, x0, x1, y, h) {
      const n = Math.max(3, Math.round((x1 - x0) / 7)), sw = (x1 - x0) / n, out = [];
      for (let k = 0; k < n; k += 2) out.push(U([RECT(x0 + k * sw, y, x0 + (k + 1) * sw, y + h), C2(x0 + (k + 0.5) * sw, y, sw / 2, 24)]));
      out.push(RECT(x0 - 1, y + h, x1 + 1, y + h + 1.4));
      F.decor.push(...out);
      F.keep.push(RECT(x0 - 2.5, y - sw / 2 - 2.2, x1 + 2.5, y + h + 3.6));
    }

    // ---------- bordi innevati ----------
    // neve (o glassa) su tutti i bordi rivolti in alto: una fascia alta bw e le gocce che colano. Stile 'pizzo' = festoni.
    function icing(outline, bw, seed, style) {
      const R = rng(seed), out = [D(outline, MV(outline, 0, -bw))];
      for (const q of outline.toPolygons()) {
        for (let i = 0; i < q.length; i++) {
          const [ax, ay] = q[i], [bx, by] = q[(i + 1) % q.length], ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey);
          if (L < 3 || -ex / L < 0.4) continue;   // solo i bordi con la normale verso l'alto
          const step = style === 'pizzo' ? bw * 1.25 : bw * 1.7, n = Math.floor(L / step);
          for (let k = 0; k < n; k++) {
            const t = (k + 0.5 + (L / step - n) / 2) / (L / step), px = ax + ex * t, py = ay + ey * t;
            if (style === 'pizzo') { out.push(C2(px, py - bw, bw * 0.62, 24)); continue; }
            const len = bw * (0.3 + 1.3 * R()), w = bw * (0.55 + 0.3 * R());
            out.push(stroke([[px, py - bw * 0.6], [px, py - bw - len]], w));
          }
        }
      }
      let c = U(out);
      if (style === 'pizzo') {
        // forellini nei festoni
        const holes = [];
        for (const q of outline.toPolygons()) for (let i = 0; i < q.length; i++) {
          const [ax, ay] = q[i], [bx, by] = q[(i + 1) % q.length], ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey);
          if (L < 3 || -ex / L < 0.4) continue;
          const step = bw * 1.25, n = Math.floor(L / step);
          for (let k = 0; k < n; k++) { const t = (k + 0.5 + (L / step - n) / 2) / (L / step); holes.push(C2(ax + ex * t, ay + ey * t - bw * 1.05, Math.max(0.5, bw * 0.17), 12)); }
        }
        c = D(c, U(holes));
      }
      return c;
    }
    // cumuli di neve alla base delle pareti
    function drifts(x0, x1, h, seed) {
      const R = rng(seed), out = [RECT(x0, 0, x1, h * 0.55)];
      for (let x = x0; x < x1; x += h * 1.1) out.push(C2(x + h * 0.5 * R(), h * 0.45, h * (0.4 + 0.35 * R()), 24));
      return I(U(out), RECT(x0, 0, x1, 3 * h));
    }
    // sparsi: fiocchi o stelline dove c'è posto
    function scatter(F, free, kind, size, max, seed) {
      if (kind === 'nessuno' || empty(free)) return;
      const R = rng(seed), b = bounds(free), pts = [], st = size * 1.7;
      for (let y = b.y0 + size / 2; y < b.y1; y += st) for (let x = b.x0 + size / 2; x < b.x1; x += st) pts.push([x + (R() - 0.5) * st * 0.6, y + (R() - 0.5) * st * 0.6]);
      for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
      let n = 0;
      for (const [x, y] of pts) {
        if (n >= max) break;
        const s = size * (0.75 + 0.4 * R()), c = C2(x, y, s / 2 + 1.3, 20);
        if (!empty(D(c, free))) continue;
        if (kind === 'stelle') F.holes.push(MV(ROT(star(0, 0, s * 0.5), R() * 30), x, y));
        else if (kind === 'cuori') F.decor.push(heart(x, y, s * 0.8));
        else F.decor.push(flake(x, y, s / 2, 1));
        free = D(free, C2(x, y, s / 2 + 3.5, 20)); n++;
      }
    }

    // ---------- motivi del tetto (coordinate della falda: x dal colmo verso la gronda, y lungo la casa) ----------
    function roofPattern(kind, L, y0, y1, seed) {
      const R = rng(seed), lines = [], g = 0.7;
      if (kind === 'tegole') {
        const r = 3.4;
        for (let i = 0, x = 1.5; x < L + r; i++, x += r) for (let y = y0 - r * 2 + (i % 2) * r; y < y1 + r * 2; y += 2 * r) {
          const pts = []; for (let k = 0; k <= 10; k++) { const a = (-90 + k * 18) * DEG; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
          lines.push(stroke(pts, g));
        }
      } else if (kind === 'mattoni') {
        const bh = 4, bwd = 8.5;
        for (let i = 0, x = 1.5; x < L; i++, x += bh) {
          lines.push(RECT(x - g / 2, y0 - 1, x + g / 2, y1 + 1));
          for (let y = y0 - bwd + (i % 2) * bwd / 2; y < y1 + bwd; y += bwd) lines.push(RECT(x, y - g / 2, x + bh, y + g / 2));
        }
      } else if (kind === 'assi') {
        const bwd = 5.5;
        for (let y = y0 + bwd; y < y1; y += bwd) {
          lines.push(RECT(-1, y - g / 2, L + 1, y + g / 2));
          let x = 4 + 10 * R(); while (x < L - 3) { lines.push(RECT(x - g / 2, y, x + g / 2, y + bwd)); x += 9 + 9 * R(); }
        }
      }
      return U(lines);
    }
    // muri: assi orizzontali (righe), mattoni (righe) o pietre d'angolo (blocchi)
    function wallPattern(kind, x0, x1, top, seed) {
      const R = rng(seed);
      if (kind === 'assi') { const out = []; for (let y = 5; y < top + 80; y += 5.5) out.push(RECT(x0, y - 0.45, x1, y + 0.45)); return { lines: U(out) }; }
      if (kind === 'mattoni') {
        const out = [], bh = 3.6, bwd = 7.5;
        for (let i = 0, y = 0; y < top; i++, y += bh) {
          out.push(RECT(x0, y - 0.35, x1, y + 0.35));
          for (let x = x0 - bwd + (i % 2) * bwd / 2 + 2 * R(); x < x1 + bwd; x += bwd) out.push(RECT(x - 0.35, y, x + 0.35, y + bh));
        }
        return { grooves: U(out) };
      }
      if (kind === 'pietra') {
        const out = [];
        for (let i = 0, y = 1; y + 4.2 < top; i++, y += 5.4) for (const s of [-1, 1]) {
          const w = i % 2 ? 4.2 : 7, xe = s < 0 ? x0 : x1;
          out.push(RECT(s < 0 ? xe : xe - w, y, s < 0 ? xe + w : xe, y + 4.4));
        }
        return { blocks: U(out) };
      }
      return {};
    }

    // ---------- stili delle case ----------
    const STYLES = {
      zenzero: { pitch: 42, ovE: 5, ovF: 4, tetto: 'mattoni', pareti: 'liscio', orn: 'cuore', ornB: 'stella', sparsi: 'fiocchi', neve: 'goccia' },
      baita: { pitch: 30, ovE: 7, ovF: 6, tetto: 'neve', pareti: 'assi', orn: 'tondo', ornB: 'tondo', sparsi: 'nessuno', neve: 'goccia', drifts: true },
      chiesa: { pitch: 46, ovE: 4, ovF: 4, tetto: 'tegole', pareti: 'pietra', orn: 'rosone', ornB: 'tondo', sparsi: 'stelle', neve: 'goccia', ext: 'torre' },
      bottega: { pitch: 34, ovE: 5, ovF: 4, tetto: 'tegole', pareti: 'mattoni', orn: 'stella', ornB: 'stella', sparsi: 'fiocchi', neve: 'goccia', ext: 'insegna' },
      nordica: { pitch: 55, ovE: 4, ovF: 3, tetto: 'assi', pareti: 'liscio', orn: 'stella', ornB: 'cuore', sparsi: 'fiocchi', neve: 'pizzo', drifts: true },
    };
    const NAMES = { zenzero: 'Casetta di pan di zenzero', baita: 'Baita di montagna', chiesa: 'Chiesetta', bottega: 'Bottega', nordica: 'Casa nordica' };

    function cardify(flatList, p, notes, sp, lay) {
      const T = H.decor || {};
      // ===== cartolina: pezzi sul telaio, attaccati con canali sottili =====
      const telaio = p.telaio !== false, bed = Math.max(120, +p.piatto || 220);
      const gap = telaio ? 2.2 : 5, barW = 2.6, gW = 1.2, gH = Math.min(sp, Math.max(0.4, +p.canale || 0.8));
      const maxInner = bed - 2 * barW - 1;
      const items = flatList.map((it) => Object.assign({}, it, { b0: bounds(it.base) }));
      const tooBig = items.filter(it => Math.min(it.b0.w, it.b0.h) + 2 * gap > maxInner || Math.max(it.b0.w, it.b0.h) + 2 * gap > maxInner);
      if (tooBig.length) notes.push(`${tooBig.map(t => t.name).join(', ')} più grand${tooBig.length > 1 ? 'i' : 'e'} del piatto da ${fmt(bed)} mm: rimpicciolisci il modello o metti il piatto giusto`);
      // scritta in testa alla cartolina
      let header = null;
      if (telaio && String(p.scritta || '').trim() && T.fitText) {
        const tf = T.fitText(p, { x: 0, y: 0, w: maxInner - 12, h: Math.max(8, 1.25 * (+p.altTesto || 9) + (String(p.scritta2 || '').trim() ? 1.9 * (+p.altTesto2 || +p.altTesto || 9) : 0)) }, +p.altTesto || 9);
        if (tf) header = { cs: tf.cs, h: tf.box.h + 7, w: tf.box.w };
        if (tf && tf.reduced) notes.push('~Scritta della cartolina ridotta per stare nella larghezza del piatto');
      }
      // impacchettamento a "skyline": ogni cella (pezzo + spazio) si appoggia sulle celle già messe, separate da una barra.
      // y verso il basso, dentro la cornice. Restituisce le celle messe e quelle avanzate
      function pack(list, Wmax, Hmax) {
        let sky = [{ x: 0, y: 0, w: Wmax + barW }];
        const placed = [], rest = [];
        for (const it of list) {
          let best = null;
          for (const rot of [0, 90]) {
            const cw = (rot ? it.b0.h : it.b0.w) + 2 * gap, ch = (rot ? it.b0.w : it.b0.h) + 2 * gap;
            for (let i = 0; i < sky.length; i++) {
              const x = sky[i].x;
              if (x + cw > Wmax + 1e-6) break;
              let y = 0;
              for (const sg of sky) if (sg.x < x + cw + barW - 1e-6 && sg.x + sg.w > x + 1e-6) y = Math.max(y, sg.y);
              if (y + ch > Hmax + 1e-6) continue;
              const score = (y + ch) * 1000 + x;
              if (!best || score < best.score) best = { score, x, y, cw, ch, rot };
            }
          }
          if (!best) { rest.push(it); continue; }
          placed.push(Object.assign({ it }, best));
          // nuovo tratto dello skyline e taglio di quelli coperti
          const nx0 = best.x, nx1 = best.x + best.cw + barW, ny = best.y + best.ch + barW, out = [];
          for (const sg of sky) {
            if (sg.x + sg.w <= nx0 + 1e-9 || sg.x >= nx1 - 1e-9) { out.push(sg); continue; }
            if (sg.x < nx0) out.push({ x: sg.x, y: sg.y, w: nx0 - sg.x });
            if (sg.x + sg.w > nx1) out.push({ x: nx1, y: sg.y, w: sg.x + sg.w - nx1 });
          }
          out.push({ x: nx0, y: ny, w: nx1 - nx0 });
          out.sort((a, b) => a.x - b.x);
          sky = [];
          for (const sg of out) { const l = sky[sky.length - 1]; if (l && Math.abs(l.y - sg.y) < 1e-6 && Math.abs(l.x + l.w - sg.x) < 1e-6) l.w += sg.w; else sky.push(Object.assign({}, sg)); }
        }
        const W2 = Math.max(0, ...placed.map(q => q.x + q.cw)), H2 = Math.max(0, ...placed.map(q => q.y + q.ch));
        return { placed, rest, W: W2, H: H2 };
      }
      // prima i pezzi grandi; provo varie larghezze e tengo la cartolina più piccola e più quadrata che sta nel piatto
      const mx2 = (it) => Math.max(it.b0.w, it.b0.h), ar = (it) => it.b0.w * it.b0.h;
      const orders = [(a, b) => mx2(b) - mx2(a) || ar(b) - ar(a), (a, b) => ar(b) - ar(a), (a, b) => b.b0.h - a.b0.h || ar(b) - ar(a), (a, b) => b.b0.w - a.b0.w || ar(b) - ar(a), (a, b) => Math.min(b.b0.w, b.b0.h) - Math.min(a.b0.w, a.b0.h)];
      const cards = [];
      let left = items;
      while (left.length && cards.length < 6) {
        const hdr = cards.length === 0 && header ? header.h + barW : 0, Hmax = maxInner - hdr;
        const minW = Math.max(...left.map(it => Math.min(it.b0.w, it.b0.h) + 2 * gap), header && !cards.length ? header.w + 12 : 0);
        let best = null;
        // ordini fissi più qualche mescolata (sempre la stessa): si tiene la cartolina migliore
        const lists = orders.map(o => left.slice().sort(o)), RR = rng(97);
        for (let k = 0; k < 24; k++) { const l = left.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(RR() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } lists.push(l); }
        for (const lst of lists) for (let Wt = maxInner; Wt >= minW - 1e-6; Wt -= 4) {
          const r = pack(lst, Wt, Hmax);
          if (!r.placed.length) continue;
          const Wc = Math.max(r.W, hdr ? header.w + 12 : 0), sc = (r.rest.length ? 1e9 : 0) - r.placed.length * 1e6 + Wc * (r.H + hdr) + 0.6 * Math.abs(Wc - r.H - hdr) * Math.max(Wc, r.H);
          if (!best || sc < best.sc) best = Object.assign(r, { sc, Wc });
        }
        if (!best) break;
        cards.push({ placed: best.placed, w: best.Wc + 2 * barW, h: best.H + hdr + 2 * barW, hdr });
        left = best.rest;
      }
      // i pezzi più grandi del piatto vanno comunque nel file, ognuno nella sua cartolina
      for (const it of left) {
        const r = pack([it], 1e4, 1e4);
        if (r.placed.length) cards.push({ placed: r.placed, w: r.W + 2 * barW, h: r.H + 2 * barW, hdr: 0 });
      }

      const parts = [];
      let cx0 = 0, maxCardX = 0, cardH0 = 0;
      const colB = p.col1, colD = p.col2;
      cards.forEach((c, ci) => {
        const Wc = c.w, Hc = c.h;
        // da coordinate della cartolina con y verso il basso a quelle vere (y in alto, cartolina tra x = cx0 e cx0 + Wc)
        const X = (x) => cx0 + x, Y = (y) => Hc - y;
        const R4 = (x0, y0, x1, y1) => RECT(X(x0), Y(y1), X(x1), Y(y0));
        const frame = [D(R4(0, 0, Wc, Hc), R4(barW, barW, Wc - barW, Hc - barW))], gates = [], pcsB = [], pcsD = [];
        if (c.hdr) frame.push(R4(0, 0, Wc, barW + header.h + barW));
        for (const q of c.placed) {
          const it = q.it, x0 = barW + q.x, y0 = barW + c.hdr + q.y, x1 = x0 + q.cw, y1 = y0 + q.ch;
          const bs = q.rot ? ROT(it.base, 90) : it.base, ds = q.rot ? ROT(it.decor, 90) : it.decor;
          const bb0 = bounds(bs), dx = X((x0 + x1) / 2) - (bb0.x0 + bb0.x1) / 2, dy = Y((y0 + y1) / 2) - (bb0.y0 + bb0.y1) / 2;
          const bb = MV(bs, dx, dy), dd = MV(ds, dx, dy);
          pcsB.push(bb); if (dd) pcsD.push(dd);
          it.flat = { bb, dd };
          if (!telaio) continue;
          frame.push(D(R4(x0 - barW, y0 - barW, x1 + barW, y1 + barW), R4(x0, y0, x1, y1)));
          // canali: a sinistra e a destra verso la cornice della cella; sopra e sotto se il pezzo è largo
          const cX0 = X(x0), cX1 = X(x1), cY0 = Y(y1), cY1 = Y(y0);
          // canali per ogni pezzo della cella (nelle celle con due pezzi accostati, ognuno ha i suoi)
          for (const pc of bb.decompose().map(R2)) {
          const b = bounds(pc);
          const gate = (side) => {
            const hor = side === 'l' || side === 'r';
            const strip = I(pc, side === 'l' ? RECT(b.x0, b.y0, b.x0 + 1.5, b.y1) : side === 'r' ? RECT(b.x1 - 1.5, b.y0, b.x1, b.y1) : side === 'b' ? RECT(b.x0, b.y0, b.x1, b.y0 + 1.5) : RECT(b.x0, b.y1 - 1.5, b.x1, b.y1));
            if (empty(strip)) return null;
            const sb = bounds(strip), mid = hor ? (sb.y0 + sb.y1) / 2 : (sb.x0 + sb.x1) / 2;
            const line = I(pc, hor ? RECT(b.x0, mid - gW / 2, b.x1, mid + gW / 2) : RECT(mid - gW / 2, b.y0, mid + gW / 2, b.y1));
            if (empty(line)) return null;
            const lb = bounds(line);
            if (side === 'l') return RECT(cX0 - 0.01, mid - gW / 2, lb.x0 + 0.6, mid + gW / 2);
            if (side === 'r') return RECT(lb.x1 - 0.6, mid - gW / 2, cX1 + 0.01, mid + gW / 2);
            if (side === 'b') return RECT(mid - gW / 2, cY0 - 0.01, mid + gW / 2, lb.y0 + 0.6);
            return RECT(mid - gW / 2, lb.y1 - 0.6, mid + gW / 2, cY1 + 0.01);
          };
          gates.push(gate('l'), gate('r'));
          if (b.w > 30) gates.push(gate('t'), gate('b'));
          if (b.h > 40) { gates.push(gate('t')); }
          }
        }
        const frameCS = telaio ? D(U(frame), U(pcsB)) : null, gateCS = telaio ? D(U(gates.filter(Boolean)), U(pcsB)) : null;
        let decorCS = U(pcsD);
        const nm = cards.length > 1 ? `Cartolina ${ci + 1}` : 'Cartolina';
        if (telaio) {
          const bodyM = union([EXT(U(pcsB), 0, sp), EXT(frameCS, 0, sp), gateCS ? EXT(gateCS, 0, gH) : null].filter(Boolean));
          let markM = null;
          if (c.hdr) {
            const hy = Y(barW + header.h / 2), tcs = MV(header.cs, X(Wc / 2), hy);
            const extras = [], room = (Wc - 2 * barW - header.w) / 2 - 4;
            if (room > 8) for (const s of [-1, 1]) { const r = Math.min(room - 2, header.h - 3, 13) / 2; extras.push(flake(X(Wc / 2) + s * (header.w / 2 + 3 + r), hy, r, 1.1)); }
            decorCS = U([decorCS, tcs, ...extras]);
            if (p.marchio && T.placeMark) {
              const face = R4(barW + 1, barW + 0.8, Wc - barW - 1, barW + header.h - 0.8);
              const mk = T.placeMark(face, p, notes, U([tcs, ...extras]), 0.5);
              if (mk) markM = EXT(mk, sp, sp + lay);
            }
          }
          parts.push({ name: `${nm} · pezzi e telaio`, m: bodyM, role: 'body', color: colB, group: nm });
          const dm = EXT(decorCS, sp, sp + lay);
          if (dm) parts.push({ name: `${nm} · decorazioni`, m: dm, role: 'body', color: colD, group: nm });
          if (markM) parts.push({ name: `${nm} · logo SP`, m: markM, role: 'body', color: p['col' + (T.markCol ? T.markCol(p, 2) : 2)] || colD, group: nm });
        }
        if (ci === 0) cardH0 = Hc;
        maxCardX = cx0 + Wc;
        cx0 += Wc + 10;
      });

      // pezzi sciolti (senza telaio): ogni pezzo è un oggetto
      const flatOf = (it) => ({ b: EXT(it.base, 0, sp), d: EXT(it.decor, sp, sp + lay) });
      if (!telaio) {
        for (const it of items) {
          if (!it.flat) continue;
          parts.push({ name: it.name, m: EXT(it.flat.bb, 0, sp), role: 'body', color: colB, group: it.name });
          if (!empty(it.flat.dd)) parts.push({ name: `${it.name} · decorazioni`, m: EXT(it.flat.dd, sp, sp + lay), role: 'body', color: colD, group: it.name });
        }
      }
      return { parts, cards, maxCardX, cardH0, telaio, gW, gH, items };
    }

    // larghezza dei tratti più sottili di una sezione (quelli che spariscono aprendola: più dell'1% dell'area)
    function thinnest(c) {
      const A = c.area(); let lo = 0.01, hi = 3;
      for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2, o = OFF(OFF(c, -m, 'Round'), m, 'Round'); if ((A - (o ? o.area() : 0)) / A > 0.01) hi = m; else lo = m; }
      return 2 * lo;
    }
    // scritta che sta in un riquadro w × h: una riga o, se viene troppo piccola, due righe spezzate allo spazio più centrale.
    // I tratti più sottili di due passate dell'ugello vengono ingrossati (se no lo slicer li salta o la pulizia li toglie)
    function signText(txt, font, w, h, noz) {
      const T = H.decor || {};
      const fit = (lines, cap) => {
        let c = T.textCS(lines, font, cap, noz);
        if (!c) return null;
        const b = bounds(c), k = Math.min(1, (w - 1.6) / b.w, (h - 1.2) / b.h);   // margine per l'ingrossamento
        if (k < 1) c = R2(c.scale([k, k]));
        return { cs: c, cap: cap * k, lines: lines.length };
      };
      let best = fit([txt], Math.min(9, h * 0.62));
      const sp = [...txt.matchAll(/ /g)].map(m => m.index);
      if (best && best.cap < 5 && sp.length) {
        const i = sp.reduce((a, b) => (Math.abs(b - txt.length / 2) < Math.abs(a - txt.length / 2) ? b : a));
        const two = fit([txt.slice(0, i), txt.slice(i + 1)], Math.min(9, h * 0.36));
        if (two && two.cap >= best.cap * 0.92) best = two;
      }
      if (!best) return null;
      const wmin = Math.max(0.9, 2 * noz * 1.05), t0 = thinnest(best.cs);
      best.bold = t0 < wmin;
      if (best.bold) best.cs = OFF(best.cs, (wmin - t0) / 2 + 0.02, 'Round');
      return best;
    }

    function casetta(p) {
      const notes = [], info = [];
      const st = STYLES[p.stile] || STYLES.zenzero, style = STYLES[p.stile] ? p.stile : 'zenzero';
      const pick = (v, d) => (v && v !== 'auto' ? v : d);
      const tetto = pick(p.tetto, st.tetto), pareti = pick(p.pareti, st.pareti), orn = pick(p.ornamento, st.orn), ornB = pick(p.ornamento, st.ornB), sparsi = pick(p.sparsi, st.sparsi);
      const sp = Math.max(0.8, +p.spessore || 1.6), lay = Math.max(0.12, +p.strato || 0.4), tol = Math.max(0, +p.gioco || 0);
      if (p.prova) return provaKit('pettine', p, sp, lay, tol, notes);
      const W = Math.max(30, +p.larghezza), Dp = Math.max(30, +p.profondita), Hw = Math.max(25, +p.altezza);
      const holed = p.finestre !== 'disegnate', snow = p.neve !== false, seed = (+p.variante | 0) * 7919 + 13;
      const pitch = Math.max(20, Math.min(62, +p.pendenza || st.pitch));
      const th = pitch * DEG, ca = Math.cos(th), sa = Math.sin(th);
      const Hr = (W / 2) * Math.tan(th), Ls = (W / 2) / ca;
      const ovE = st.ovE, ovF = st.ovF, Lr = Ls + ovE;
      const ext = st.ext, frontCovered = !ext;   // con torre o insegna la falda parte dietro la facciata
      const tF = ext ? -Dp / 2 + sp + tol : -Dp / 2 - ovF, tB = Dp / 2 + ovF;
      const bw = Math.max(2.4, Math.min(4.5, W * 0.06));   // fascia di neve sui bordi

      // pettine degli angoli: n denti, quelli pari della facciata e del retro, quelli dispari dei fianchi
      const n = Math.max(3, 2 * Math.round((Hw / 9 - 1) / 2) + 1), hz = Hw / n;
      const wB = Math.min(10, W * 0.18), wT = 7, wG = Math.min(7, Ls * 0.22);   // linguette: sotto, in cima ai fianchi, sul timpano
      const tabT = sp / ca;   // altezza delle linguette dei fianchi: a filo con la faccia di sopra del tetto sul bordo esterno

      // ===== pareti (u verso destra di chi guarda, v in alto, v = 0 sulla base) =====
      function wallOutline(Wd, gable) {
        const e = Wd / 2 - sp - tol / 2, list = [RECT(-e, 0, e, Hw)];
        for (let k = 0; k < n; k++) {
          if ((k % 2 === 0) !== gable) continue;
          const v0 = k * hz + (gable ? 0 : tol / 2), v1 = (k + 1) * hz - (gable ? 0 : tol / 2);
          list.push(RECT(e - 0.01, v0, Wd / 2, v1), RECT(-Wd / 2, v0, -e + 0.01, v1));
        }
        if (gable) list.push(P2([[-Wd / 2, Hw - 0.01], [Wd / 2, Hw - 0.01], [0, Hw + Hr]]));
        return U(list);
      }
      const bottomTabs = (Wd) => U([-1, 1].map(s => RECT(s * Wd / 4 - wB / 2, -sp, s * Wd / 4 + wB / 2, 0.01)));
      // linguette in cima al timpano, a metà di ogni falda, perpendicolari al tetto
      function gableTabs() {
        const out = [];
        for (const s of [-1, 1]) {
          const sg = Ls / 2, px = s * sg * ca, py = Hw + Hr - sg * sa, ex = s * ca, ey = -sa, nx = s * sa, ny = ca, e = sp + 0.01;
          const a = [px - ex * wG / 2 - nx * 0.01, py - ey * wG / 2 - ny * 0.01], b = [px + ex * wG / 2 - nx * 0.01, py + ey * wG / 2 - ny * 0.01];
          out.push(P2([a, b, [b[0] + nx * e, b[1] + ny * e], [a[0] + nx * e, a[1] + ny * e]]));
        }
        return U(out);
      }
      const sideTopTabs = () => U([-1, 1].map(s => RECT(s * Dp / 4 - wT / 2, Hw - 0.01, s * Dp / 4 + wT / 2, Hw + tabT)));

      // facciata con torre (chiesa) o con il frontone dell'insegna (bottega)
      let extShape = null, tower = null, sign = null;
      if (ext === 'torre') {
        const Tw = Math.max(12, W * 0.34), vT = Hw + Hr + Math.max(10, Hr * 0.42), spH = Tw * 0.95, apex = vT + spH;
        tower = { Tw, vT, apex };
        extShape = U([RECT(-Tw / 2, Hw + Hr * 0.3, Tw / 2, vT + 0.01), P2([[-Tw / 2 - 1.5, vT], [Tw / 2 + 1.5, vT], [0, apex]]),
          RECT(-1.3, apex - 3, 1.3, apex + 8), RECT(-3.8, apex + 3, 3.8, apex + 5.6)]);
      } else if (ext === 'insegna') {
        const vF = Hw + Hr + Math.max(8, Hr * 0.4);
        extShape = D(U([RECT(-W / 2, Hw, W / 2, vF), C2(0, vF, W * 0.2, 64)]), U([C2(-W / 2, vF, 5, 32), C2(W / 2, vF, 5, 32)]));
        const sh = Math.min(20, (vF - Hw) * 0.62), sw = W - 2 * sp - 9, sc = Hw + (vF - Hw) * 0.5;
        sign = { x0: -sw / 2, x1: sw / 2, y0: sc - sh / 2, y1: sc + sh / 2, vF };
      }

      const pieces = [];
      const T = H.decor || {};
      function wallPiece(name, which) {
        const gable = which !== 'side', Wd = gable ? W : Dp, F = newFace(), R = rng(seed + which.length * 31);
        let outline = wallOutline(Wd, gable);
        if (which === 'front' && extShape) outline = U([outline, extShape]);
        // ---- aperture per stile ----
        const winH = (r) => Hw * r;
        if (which === 'front') {
          if (style === 'zenzero') {
            doorAt(F, 'arco', 0, W * 0.26, Hw * 0.58, { heart: holed });
            for (const s of [-1, 1]) windowAt(F, 'arco', s * W * 0.3, Hw * 0.3, W * 0.17, winH(0.42), holed);
          } else if (style === 'baita') {
            doorAt(F, 'rett', 0, W * 0.24, Hw * 0.58, { planks: true, wreath: true });
            for (const s of [-1, 1]) windowAt(F, 'quadra', s * W * 0.31, Hw * 0.36, W * 0.14, winH(0.3), holed);
          } else if (style === 'chiesa') {
            doorAt(F, 'acuta', 0, W * 0.24, Hw * 0.64, { planks: true });
            for (const s of [-1, 1]) windowAt(F, 'acuta', s * W * 0.31, Hw * 0.3, W * 0.11, winH(0.4), holed);
          } else if (style === 'bottega') {
            const vx0 = -W / 2 + sp + 4, vx1 = W * 0.16;
            windowAt(F, 'vetrina', (vx0 + vx1) / 2, Hw * 0.2, vx1 - vx0, winH(0.36), holed);
            doorAt(F, 'rett', W * 0.31, W * 0.2, Hw * 0.56, {});
            awning(F, -W / 2 + sp + 2.5, W / 2 - sp - 2.5, Hw * 0.66, Hw * 0.12);
          } else {
            doorAt(F, 'arco', 0, W * 0.22, Hw * 0.52, { heart: false, wreath: true });
            for (const s of [-1, 1]) windowAt(F, 'quadra', s * W * 0.3, Hw * 0.3, W * 0.13, winH(0.42), holed);
          }
        } else if (which === 'back') {
          if (style === 'chiesa') windowAt(F, 'acuta', 0, Hw * 0.28, W * 0.12, winH(0.44), holed);
          else for (const s of [-1, 1]) windowAt(F, style === 'zenzero' ? 'arco' : style === 'chiesa' ? 'acuta' : 'quadra', s * W * 0.24, Hw * 0.32, W * 0.16, winH(style === 'nordica' ? 0.42 : 0.36), holed, { shutters: style === 'baita' });
        } else {
          if (style === 'chiesa') for (const k of [-1, 0, 1]) windowAt(F, 'acuta', k * Dp * 0.27, Hw * 0.24, Math.min(Dp * 0.1, 8), winH(0.52), holed);
          else if (style === 'bottega') windowAt(F, 'quadra', 0, Hw * 0.34, Dp * 0.18, winH(0.32), holed);
          else for (const s of [-1, 1]) windowAt(F, style === 'zenzero' ? 'arco' : 'quadra', s * Dp * 0.24, Hw * (style === 'baita' ? 0.36 : 0.3), Dp * (style === 'baita' ? 0.13 : 0.17), winH(style === 'baita' ? 0.3 : 0.4), holed, { shutters: style === 'baita' });
        }
        // ---- timpano ----
        if (gable) {
          const s0 = Math.min(Hr * 0.5, W * 0.3), cy = Hw + Hr * 0.36;
          if (which === 'front' && ext === 'torre') {
            ornament(F, orn, 0, Hw + Hr * 0.3, Math.min(s0, tower.Tw * 0.62), holed);
            // cella campanaria: arco traforato nella torre, sopra il colmo
            const bh = (tower.vT - Hw - Hr) * 0.72, bwd = Math.min(tower.Tw * 0.5, bh * 0.7);
            windowAt(F, 'arco', 0, Hw + Hr + 1.2, bwd, bh, holed);
            F.decor.push(star(0, tower.apex + 4.3, 0.01));
          } else if (which === 'front' && ext === 'insegna') {
            // insegna con la scritta
            const sg = RECT(sign.x0, sign.y0, sign.x1, sign.y1);
            F.decor.push(D(sg, OFF(sg, -1.2, 'Miter')));
            const txt = String(p.insegna || '').trim();
            if (txt && T.textCS) {
              const st = signText(txt, p.carattere || 'tondo', sign.x1 - sign.x0 - 4.4, sign.y1 - sign.y0 - 4, +p.ugello || 0.4);
              if (st) {
                const b2 = bounds(st.cs);
                F.text = MV(st.cs, -(b2.x0 + b2.x1) / 2, (sign.y0 + sign.y1) / 2 - (b2.y0 + b2.y1) / 2);
                if (st.lines > 1) notes.push('~Insegna su due righe per stare nel riquadro');
                if (st.cap < 3.2) notes.push(`Insegna piccola (lettere di ${fmt(st.cap)} mm): ${st.bold ? 'i tratti sono stati ingrossati per stamparli, ' : ''}si legge meglio con meno lettere, con il carattere Tondo o con una casa più larga`);
              }
            }
            F.keep.push(OFF(sg, 2));
            if (W / 2 - sign.x1 > 7.5) for (const s of [-1, 1]) F.decor.push(star(s * (sign.x1 + (W / 2 - sign.x1) / 2 + 0.5), (sign.y0 + sign.y1) / 2, Math.min(4.5, (W / 2 - sign.x1) / 2 - 1.5)));
          } else ornament(F, which === 'back' ? ornB : orn, 0, cy, s0, holed);
        }
        // ---- muri ----
        const safe = OFF(outline, -(sp > 1 ? 0.9 : 0.6), 'Miter');
        const keepAll = U(F.keep);
        const wp = wallPattern(pareti, -Wd / 2 + sp + tol, Wd / 2 - sp - tol, Hw - 1, seed + 5);
        // via i pezzetti troppo corti rimasti tra finestre e porte
        const noBits = (c, a) => (empty(c) ? null : U(c.decompose().map(R2).filter(q => q.area() >= a)));
        const keepT = OFF(keepAll, -1.2);
        if (wp.lines) F.decor.push(noBits(D(I(wp.lines, gable ? I(outline, MV(outline, 0, -bw * 2.4)) : RECT(-Wd / 2, 0, Wd / 2, Hw - 2)), keepT), 5));
        if (wp.blocks) F.decor.push(noBits(D(wp.blocks, keepT), 6));
        let grooves = null;
        if (wp.grooves) { F.decor.push(D(I(RECT(-Wd / 2, Hw * 0.0, Wd / 2, Hw * 0.42), safe), keepAll)); grooves = wp.grooves; }
        // ---- neve sui bordi in alto e cumuli ----
        if (snow) {
          const top = gable ? outline : null;
          if (top) F.decor.push(icing(D(top, RECT(-Wd, -50, Wd, Hw - 0.5)) || top, bw, seed + 101, st.neve));
          if (st.drifts) F.decor.push(D(drifts(-Wd / 2, Wd / 2, Math.min(6, Hw * 0.12), seed + 7), F.door ? OFF(F.door, 0.6) : null));
        }
        // ---- sparsi ----
        if (sparsi !== 'nessuno') {
          let free = D(D(OFF(outline, -3, 'Miter'), U(F.keep)), RECT(-Wd, -10, Wd, Hw * 0.22));
          if (snow && gable) free = D(free, OFF(D(outline, MV(outline, 0, -bw * 2.8)), 1));
          if (sign) free = D(free, RECT(-W, Hw, W, sign.vF + 30));
          scatter(F, free, sparsi, Math.max(6.5, Math.min(9, W * 0.13)), gable ? 6 : 3, seed + which.length * 17);
        }
        let holes = U(F.holes);
        if (holes) holes = I(holes, OFF(outline, -1.2, 'Miter'));
        let base = D(outline, holes);
        let decor = U(F.decor);
        if (grooves) decor = D(decor, D(grooves, OFF(keepAll, 0)));
        decor = I(decor, OFF(base, -0.25));
        decor = I(decor, safe);
        decor = clean(decor, 0.8);
        // la scritta dell'insegna non passa dalla pulizia: è già ingrossata quanto serve (signText)
        if (F.text) decor = U([D(decor, OFF(F.text, 0.6)), I(F.text, OFF(base, -0.25))]);
        const tabs = U([bottomTabs(Wd), which === 'side' ? sideTopTabs() : (which === 'back' || frontCovered) ? gableTabs() : null]);
        base = U([base, tabs]);
        return { name, base, decor, kind: which };
      }

      const front = wallPiece('Facciata', 'front'), back = wallPiece('Retro', 'back'), side = wallPiece('Fianco', 'side');

      // ===== tetto: una falda (x dal colmo verso la gronda, y lungo la casa); l'altra è la stessa specchiata =====
      function roofPiece() {
        let out = RECT(0, tF, Lr, tB);
        const slots = [];
        const sgap = tol / 2;
        // asole delle linguette dei fianchi
        const s0 = (W / 2 - sp - sp * sa) / ca, s1 = (W / 2) / ca;
        for (const s of [-1, 1]) slots.push(RECT(s0 - sgap - 0.15, s * Dp / 4 - wT / 2 - sgap, s1 + sgap, s * Dp / 4 + wT / 2 + sgap));
        // asole delle linguette dei timpani
        const sg = Ls / 2;
        const planes = [[Dp / 2 - sp, Dp / 2]];
        if (frontCovered) planes.push([-Dp / 2, -Dp / 2 + sp]);
        for (const [a, b] of planes) slots.push(RECT(sg - wG / 2 - sgap, a - sgap, sg + wG / 2 + sgap, b + sgap));
        const slotCS = U(slots);
        // ghiaccioli sulla gronda
        let icicles = null;
        if (snow) {
          const R = rng(seed + 77), ic = [];
          for (let y = tF + 3; y < tB - 2; y += 3.2 + 1.6 * R()) { const len = 1.5 + 3.5 * R(); ic.push(P2([[Lr - 0.2, y - 1.3], [Lr - 0.2, y + 1.3], [Lr + len, y + 0.2 * (R() - 0.5)]])); }
          icicles = U(ic);
          out = U([out, icicles]);
        }
        out = D(out, slotCS);
        const safe = OFF(RECT(0, tF, Lr, tB), -0.9, 'Miter');
        let decor;
        if (tetto === 'neve') {
          // manto di neve: tutta la falda, col bordo verso il colmo ondulato
          const R = rng(seed + 9), wav = [];
          for (let y = tF; y < tB + 6; y += 6) wav.push(C2(2.6 + 1.3 * R(), y, 2.6 + 1.6 * R(), 24));
          decor = D(RECT(2.4, tF, Lr + 10, tB), U(wav));
        } else if (tetto === 'liscio') decor = snow ? RECT(Lr - bw * 1.2, tF, Lr + 10, tB) : null;
        else decor = D(RECT(0, tF, Lr + 10, tB), roofPattern(tetto, Lr, tF, tB, seed + 3));
        if (snow && tetto !== 'neve') decor = U([decor, RECT(Lr - bw, tF, Lr + 10, tB), RECT(0, tF, 2.2, tB)]);
        if (snow) decor = U([decor, icicles]);
        decor = D(decor, OFF(slotCS, 1.3, 'Miter'));
        decor = I(decor, OFF(out, -0.25, 'Miter'));
        decor = I(decor, U([safe, icicles ? OFF(icicles, -0.3) : null, RECT(Lr - 1, tF + 0.9, Lr + 10, tB - 0.9)]));
        decor = clean(decor, 0.8);
        return { base: out, decor };
      }
      const roofR = roofPiece();

      // ===== base =====
      const nT = Math.max(0, Math.min(2, p.alberi | 0)), snowman = !!p.pupazzo, gift = !!p.regalo;
      const hT = Math.max(18, Math.min(Hw * 0.95, 70)), twT = hT * 0.62;
      const mx = nT ? twT + 7 : 6, mf = snowman || gift ? Math.max(14, Hw * 0.3) : 6, mb = 6;
      const bx0 = -W / 2 - mx, bx1 = W / 2 + mx, by0 = -Dp / 2 - mf, by1 = Dp / 2 + mb;
      const accs = [];   // accessori: { name, base, decor, x, y }
      const houseFoot = RECT(-W / 2 - 0.01, -Dp / 2 - 0.01, W / 2 + 0.01, Dp / 2 + 0.01);
      const baseSlots = [];
      const slotRect = (x0, y0, x1, y1) => RECT(x0 - tol / 2, y0 - tol / 2, x1 + tol / 2, y1 + tol / 2);
      for (const s of [-1, 1]) {
        baseSlots.push(slotRect(s * W / 4 - wB / 2, -Dp / 2, s * W / 4 + wB / 2, -Dp / 2 + sp));
        baseSlots.push(slotRect(s * W / 4 - wB / 2, Dp / 2 - sp, s * W / 4 + wB / 2, Dp / 2));
        baseSlots.push(slotRect(W / 2 - sp, s * Dp / 4 - wB / 2, W / 2, s * Dp / 4 + wB / 2));
        baseSlots.push(slotRect(-W / 2, s * Dp / 4 - wB / 2, -W / 2 + sp, s * Dp / 4 + wB / 2));
      }
      // ---- accessori: sagoma piatta con linguetta sotto, in piedi nella base, faccia decorata davanti ----
      function treePiece(h) {
        const tw = h * 0.62, trunkW = Math.max(5, tw * 0.2), trunkH = h * 0.12, tiers = 3, out = [], dec = [];
        let v = trunkH;
        for (let k = 0; k < tiers; k++) {
          const w = tw * (1 - k * 0.24), th2 = (h - trunkH - h * 0.1) * (k === tiers - 1 ? 0.5 : 0.42), top = v + th2;
          out.push(P2([[-w / 2, v], [w / 2, v], [0, Math.min(h * 0.92, top + th2 * 0.25)]]));
          // festone e palline
          const yA = v + th2 * 0.35;
          dec.push(stroke([[-w * 0.36, yA + th2 * 0.06], [-w * 0.12, yA - th2 * 0.06], [w * 0.12, yA + th2 * 0.04], [w * 0.34, yA - th2 * 0.06]], 1.0));
          dec.push(C2(-w * 0.2, v + th2 * 0.12 + 1.4, 1.3), C2(w * 0.22, v + th2 * 0.62, 1.2));
          v += th2 * 0.62;
        }
        const tree = U(out);
        const stH = Math.max(3.2, h * 0.09);
        out.push(RECT(-trunkW / 2, 0, trunkW / 2, trunkH + 1), star(0, bounds(tree).y1 + stH * 0.15, stH));
        dec.push(OFF(star(0, bounds(tree).y1 + stH * 0.15, stH), -0.01));
        const base = U([U(out), RECT(-trunkW / 2, -sp, trunkW / 2, 0.01)]);
        let decor = I(U([...dec, snow ? I(icing(tree, Math.max(1.6, h * 0.045), seed + 3, 'goccia'), tree) : null]), OFF(U(out), -0.5));
        return { base, decor: clean(decor, 0.8), tabW: trunkW };
      }
      function snowmanPiece(h) {
        const r1 = h * 0.24, r2 = h * 0.18, r3 = h * 0.13;
        const c1 = r1, c2 = 2 * r1 + r2 * 0.75, c3 = c2 + r2 + r3 * 0.7;
        const body = U([C2(0, c1, r1), C2(0, c2, r2), C2(0, c3, r3)]);
        const hatW = r3 * 1.5, hatTop = c3 + r3 * 0.6 + h * 0.15;
        const hat = U([RECT(-hatW * 0.65, c3 + r3 * 0.55, hatW * 0.65, c3 + r3 * 0.55 + 1.6), RECT(-hatW * 0.42, c3 + r3 * 0.55, hatW * 0.42, hatTop)]);
        const arms = U([stroke([[-r2 * 0.8, c2 + r2 * 0.1], [-r2 * 1.7, c2 + r2 * 0.65], [-r2 * 2.05, c2 + r2 * 1.0]], 1.8), stroke([[r2 * 0.8, c2 + r2 * 0.1], [r2 * 1.75, c2 + r2 * 0.75]], 1.8)]);
        const tabW = Math.max(5, r1);
        const base = U([body, hat, arms, RECT(-tabW / 2, -sp, tabW / 2, 0.5)]);
        // corpo bianco; occhi, bottoni, sciarpa e naso restano del colore del pezzo
        const details = U([C2(-r3 * 0.36, c3 + r3 * 0.2, Math.max(0.8, r3 * 0.13)), C2(r3 * 0.36, c3 + r3 * 0.2, Math.max(0.8, r3 * 0.13)),
          P2([[-0.2, c3 - r3 * 0.05], [-0.2, c3 - r3 * 0.3], [r3 * 0.75, c3 - r3 * 0.2]]),
          RECT(-r2 * 1.1, c2 + r2 * 0.62, r2 * 1.1, c2 + r2 * 0.62 + Math.max(1.6, h * 0.05)), RECT(r2 * 0.25, c2 + r2 * 0.1, r2 * 0.25 + 1.8, c2 + r2 * 0.66),
          C2(0, c2 - r2 * 0.05, Math.max(0.8, r2 * 0.12)), C2(0, c1 + r1 * 0.35, Math.max(0.8, r2 * 0.12)), C2(0, c1 - r1 * 0.2, Math.max(0.8, r2 * 0.12))]);
        const decor = clean(U([D(OFF(body, -0.5), details), RECT(-hatW * 0.42 + 0.6, c3 + r3 * 0.55 + 2.4, hatW * 0.42 - 0.6, c3 + r3 * 0.55 + 3.6)]), 0.8);
        return { base, decor, tabW };
      }
      function giftPiece(h) {
        const w = h * 1.05, bh = h * 0.68, lid = h * 0.14;
        const box = U([RECT(-w / 2, 0, w / 2, bh), RECT(-w / 2 - 1, bh - 0.01, w / 2 + 1, bh + lid)]);
        const bo = bow(0, bh + lid + h * 0.03, h * 0.5);
        const tabW = Math.max(5, w * 0.4);
        const base = U([box, bo, RECT(-tabW / 2, -sp, tabW / 2, 0.01)]);
        const rib = Math.max(1.6, w * 0.13);
        const decor = clean(I(U([RECT(-rib / 2, 0, rib / 2, bh + lid), RECT(-w, bh + 0.8, w, bh + lid - 0.8), OFF(bo, -0.4), snow ? RECT(-w, bh + lid - 1.1, w, bh + lid) : null]), OFF(U([box, bo]), -0.45)), 0.8);
        return { base, decor, tabW };
      }
      if (nT) {
        const t = treePiece(hT);
        for (let k = 0; k < nT; k++) {
          const s = k === 0 ? -1 : 1;
          accs.push({ name: nT > 1 ? `Albero ${k + 1}` : 'Albero', ...t, x: s * (W / 2 + 3 + twT / 2), y: -Dp / 6 });
        }
      }
      const hS = Math.max(16, Math.min(Hw * 0.55, 40));
      if (snowman) accs.push({ name: 'Pupazzo di neve', ...snowmanPiece(hS), x: W * 0.33, y: -Dp / 2 - mf / 2 });
      if (gift) accs.push({ name: 'Pacco regalo', ...giftPiece(Math.max(11, Hw * 0.28)), x: -W * 0.33, y: -Dp / 2 - mf / 2 });
      for (const a of accs) baseSlots.push(slotRect(a.x - a.tabW / 2, a.y - sp / 2, a.x + a.tabW / 2, a.y + sp / 2));
      const baseOut = OFF(OFF(RECT(bx0, by0, bx1, by1), -4), 4);
      const baseSlotCS = U(baseSlots);
      let baseCS = D(baseOut, baseSlotCS);
      // decorazioni della base: bordo di neve a festoni, vialetto di sassi davanti alla porta, fiocchi
      let baseDecor = null;
      {
        const dl = [];
        const R = rng(seed + 55);
        if (snow) {
          const ring = D(baseOut, OFF(baseOut, -2.2, 'Miter'));
          const sc = [];
          const per = 2 * (bx1 - bx0 + by1 - by0), nS = Math.round(per / 6);
          for (let k = 0; k < nS; k++) {
            let d = (k + 0.5) * per / nS, x, y;
            const w0 = bx1 - bx0, h0 = by1 - by0;
            if (d < w0) { x = bx0 + d; y = by0 + 2.2; } else if ((d -= w0) < h0) { x = bx1 - 2.2; y = by0 + d; } else if ((d -= h0) < w0) { x = bx1 - d; y = by1 - 2.2; } else { d -= w0; x = bx0 + 2.2; y = by1 - d; }
            sc.push(C2(x, y, 2.2 + 0.6 * R(), 20));
          }
          dl.push(I(U([ring, U(sc)]), baseOut));
        }
        // vialetto: sassi ovali dalla porta al bordo davanti
        if (mf > 8) {
          let y = -Dp / 2 - 3.2;
          while (y > by0 + 4) { const w = 3.4 + 1.6 * R(); dl.push(R2(R2(R2(CrossSection.circle(1, 20)).scale([w, 1.7])).translate([(R() - 0.5) * 2, y]))); y -= 4.4; }
        }
        let free = D(D(OFF(baseOut, -3.4, 'Miter'), OFF(houseFoot, 2.5, 'Miter')), OFF(baseSlotCS, 2.4, 'Miter'));
        if (mf > 8) free = D(free, RECT(-5, by0, 5, -Dp / 2));
        for (const a of accs) free = D(free, RECT(a.x - a.tabW / 2 - 4, a.y - 5, a.x + a.tabW / 2 + 4, a.y + 5));
        const F2 = newFace();
        scatter(F2, free, 'fiocchi', 5.5, 6, seed + 66);
        dl.push(...F2.decor);
        baseDecor = I(U(dl), OFF(baseCS, -0.4));
        baseDecor = D(baseDecor, OFF(U([houseFoot, baseSlotCS]), 1.2, 'Miter'));
        for (const a of accs) baseDecor = D(baseDecor, RECT(a.x - a.tabW / 2 - 1.6, a.y - sp / 2 - 1.6, a.x + a.tabW / 2 + 1.6, a.y + sp / 2 + 1.6));
        baseDecor = clean(baseDecor, 0.8);
      }

      // ===== elenco dei pezzi, con la posa nella casetta montata =====
      const rotX = (m) => reg(m.rotate([90, 0, 0]));
      // parete: faccia decorata (z in alto nel pezzo piatto) verso fuori; half = distanza della faccia esterna dal centro
      const placeWall = (m, half, az) => reg(reg(reg(rotX(m).translate([0, -half + sp, sp]))).rotate([0, 0, az]));
      const placeAcc = (m, x, y) => reg(rotX(m).translate([x, y + sp / 2, sp]));
      const zR = sp + Hw + Hr;
      const placeRoof = (m, left) => { const r = reg(reg(m.rotate([0, pitch, 0])).translate([0, 0, zR])); return left ? reg(r.rotate([0, 0, 180])) : r; };
      const list = [
        { name: 'Facciata', base: front.base, decor: front.decor, place: [(m) => placeWall(m, Dp / 2, 0)] },
        { name: 'Retro', base: back.base, decor: back.decor, place: [(m) => placeWall(m, Dp / 2, 180)] },
        { name: 'Fianco', count: 2, base: side.base, decor: side.decor, place: [(m) => placeWall(m, W / 2, 90), (m) => placeWall(m, W / 2, -90)] },
        { name: 'Falda destra', base: roofR.base, decor: roofR.decor, place: [(m) => placeRoof(m, false)] },
        { name: 'Falda sinistra', base: MIRY(roofR.base), decor: MIRY(roofR.decor), place: [(m) => placeRoof(m, true)] },
        { name: 'Base', base: baseCS, decor: baseDecor, place: [(m) => m], flatOnBed: true },
      ];
      for (const a of accs) list.push({ name: a.name, base: a.base, decor: a.decor, place: [(m) => placeAcc(m, a.x, a.y)] });
      // i fianchi sono due pezzi uguali: nella cartolina ce ne sono due
      const flatList = [];
      for (const it of list) for (let k = 0; k < (it.count || 1); k++) flatList.push({ name: it.count ? `${it.name} ${k + 1}` : it.name, base: it.base, decor: it.decor, place: it.place[k] || it.place[0] });

      const { parts, cards, maxCardX, cardH0, telaio, gW, gH, items } = cardify(flatList, p, notes, sp, lay);
      const flatOf = (it) => ({ b: EXT(it.base, 0, sp), d: EXT(it.decor, sp, sp + lay) });
      const colB = p.col1, colD = p.col2;

      // casetta montata, a destra della cartolina (solo anteprima)
      const check = !!p.__check;
      const ox = maxCardX + 25 + (bx1 - bx0) / 2, oy = -(by1 + by0) / 2 + cardH0 / 2;
      const asmB = [], asmD = [];
      for (const it of flatList) {
        const { b, d } = flatOf(it);
        const pb = it.place(b), pd = d ? it.place(d) : null;
        if (check) {
          const mv = (m) => reg(m.translate([ox, oy, 0]));
          parts.push({ name: `Montata · ${it.name}`, m: mv(pb), role: 'body', color: colB });
          if (pd) parts.push({ name: `Montata · ${it.name} · decorazioni`, m: mv(pd), role: 'body', color: colD });
        } else { asmB.push(pb); if (pd) asmD.push(pd); }
      }
      if (!check && p.anteprima !== 'cartolina') {
        const mvM = (m) => reg(m.translate([ox, oy, 0]));
        parts.push({ name: 'Casetta montata', m: mvM(union(asmB)), role: 'model', color: colB });
        if (asmD.length) parts.push({ name: 'Casetta montata · decorazioni', m: mvM(union(asmD)), role: 'model', color: colD });
      }

      // ===== informazioni =====
      const Htot = Hw + Hr + (tower ? tower.apex + 8 - Hw - Hr : sign ? sign.vF + W * 0.2 - Hw - Hr : 0) + sp;
      info.push(['Casa', `${NAMES[style]}: ${fmt(W)} × ${fmt(Dp)} mm, alta ${fmt(Htot)} mm, tetto a ${fmt(pitch)}°`]);
      info.push(['Base', `${fmt(bx1 - bx0)} × ${fmt(by1 - by0)} mm`]);
      info.push(['Pezzi', `${flatList.length}: facciata, retro, 2 fianchi, 2 falde, base${accs.length ? ', ' + accs.map(a => a.name.toLowerCase()).join(', ') : ''}`]);
      if (telaio) info.push(['Cartolina', cards.map((c, i) => `${cards.length > 1 ? `n. ${i + 1}: ` : ''}${fmt(c.w)} × ${fmt(c.h)} mm`).join(' · ') + `, spessa ${fmt(sp)} mm + ${fmt(lay)} mm di colore`]);
      info.push(['Stampante a un colore', `cambio filamento a ${fmt(sp)} mm → colore 2 (le decorazioni)`]);
      info.push(['Canali', telaio ? `larghi ${fmt(gW)} mm e alti ${fmt(gH)} mm: si spezzano con le dita, rifinisci con una lima o un tronchesino` : 'niente telaio: i pezzi sono sciolti']);
      info.push(['Incastri', `gioco ${fmt(tol)} mm: angoli a pettine (${n} denti), linguette nella base e nelle asole del tetto. Se entrano duri aumenta il gioco; un punto di colla li blocca`]);
      info.push(['Montaggio', '1) facciata e retro nelle fessure della base, 2) i fianchi tra i denti, 3) le falde sulle linguette, 4) alberi, pupazzo e regalo nelle loro fessure']);
      if (holed) info.push(['Luce', W - 2 * sp >= 40 && Dp - 2 * sp >= 40 ? 'dentro ci sta un lumino LED da 38 mm: le finestre si illuminano' : 'per un lumino LED da 38 mm servono almeno 44 mm di larghezza e profondità']);
      if (lay < 0.4) notes.push('~Strato colorato sotto 0,4 mm: con colori chiari su scuri si vede il colore sotto');
      if (sp < 1.2) notes.push('Pezzi sotto 1,2 mm di spessore: gli incastri sono fragili');
      for (const x of notes) info.push(['Nota', x]);
      const res = { parts, info, view: [0.15, -1, 0.75] };
      if (check) res.pieces = flatList.map(it => [it.name, it.base.decompose().length, it.decor ? +it.decor.area().toFixed(0) : 0]);
      return res;
    }

    // ====================== prototipi: lanterna e albero in kit ======================
    const rotXm = (m) => reg(m.rotate([90, 0, 0]));
    // parete con gli angoli a pettine (own = denti pari)
    function fingerPanel(Wd, Hh, sp, tol, n, own) {
      const hz = Hh / n, e = Wd / 2 - sp - tol / 2, list = [RECT(-e, 0, e, Hh)];
      for (let k = 0; k < n; k++) {
        if ((k % 2 === 0) !== own) continue;
        const v0 = k * hz + (own ? 0 : tol / 2), v1 = (k + 1) * hz - (own ? 0 : tol / 2);
        list.push(RECT(e - 0.01, v0, Wd / 2, v1), RECT(-Wd / 2, v0, -e + 0.01, v1));
      }
      return U(list);
    }
    // cartolina + oggetto montato accanto (solo da guardare)
    // due pezzi in una cella sola, il secondo girato di 180° e accostato al primo finché restano a gap mm (sagome a triangolo)
    function nestPair(a, b, name, gap = 2.6) {
      const ba = bounds(a.base), b2 = ROT(b.base, 180), d2 = ROT(b.decor, 180), bb = bounds(b2);
      const at = (dx) => MV(b2, ba.x1 - bb.x0 + dx, (ba.y0 + ba.y1) / 2 - (bb.y0 + bb.y1) / 2);
      const grown = OFF(a.base, gap);
      let lo = -Math.min(ba.w, bb.w), hi = gap;
      if (empty(I(grown, at(lo)))) hi = lo;
      else for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (empty(I(grown, at(m)))) hi = m; else lo = m; }
      const dx = ba.x1 - bb.x0 + hi, dy = (ba.y0 + ba.y1) / 2 - (bb.y0 + bb.y1) / 2;
      return { name, base: U([a.base, MV(b2, dx, dy)]), decor: U([a.decor, d2 ? MV(d2, dx, dy) : null]) };
    }
    function kitFinish(flatList, p, notes, sp, lay, extraModels = [], cardList = null) {
      const { parts, maxCardX, cardH0, cards } = cardify(cardList || flatList, p, notes, sp, lay);
      const asmB = [], asmD = [];
      for (const it of flatList) {
        const b = EXT(it.base, 0, sp), d = EXT(it.decor, sp, sp + lay);
        asmB.push(it.place(b)); if (d) asmD.push(it.place(d));
      }
      const mb = union(asmB), md = asmD.length ? union(asmD) : null;
      const bb = mb.boundingBox(), ox = maxCardX + 30 - bb.min[0], oy = cardH0 / 2 - (bb.min[1] + bb.max[1]) / 2;
      const mv = (m) => reg(m.translate([ox, oy, -bb.min[2]]));
      if (p.__check) flatList.forEach((it) => { const b = EXT(it.base, 0, sp); parts.push({ name: 'Montata · ' + it.name, m: mv(it.place(b)), role: 'body', color: p.col1 }); });
      else if (p.anteprima !== 'cartolina') {
        parts.push({ name: 'Montato', m: mv(mb), role: 'model', color: p.col1 });
        if (md) parts.push({ name: 'Montato · decorazioni', m: mv(md), role: 'model', color: p.col2 });
        for (const [m, c] of extraModels) parts.push({ name: 'Esempio', m: mv(m), role: 'model', color: c });
      }
      if (p.__check) parts.pieces = flatList.map(it => [it.name, it.base.decompose().length]);
      return { parts, cards };
    }

    // ---------------- LANTERNA IN KIT ----------------
    function kitLanterna(p) {
      const notes = [], sp = Math.max(0.8, +p.spessore || 1.6), lay = Math.max(0.12, +p.strato || 0.4), tol = Math.max(0, +p.gioco || 0);
      if (p.prova) return provaKit('pettine', p, sp, lay, tol, notes);
      const W = Math.max(44, +p.lato || 64), Hh = Math.max(50, +p.altezza || 96), R = rng((+p.variante | 0) * 7919 + 11);
      const n = Math.max(3, 2 * Math.round((Hh / 10 - 1) / 2) + 1);
      const wB = Math.min(10, W * 0.18), wT = 8;
      const tabsB = U([-1, 1].map(s => RECT(s * W / 4 - wB / 2, -sp, s * W / 4 + wB / 2, 0.01)));
      const dJ = Math.min(12, Hh * 0.12);   // altezza dell'incastro del manico
      const sx0 = -W / 2 + sp + 5, sx1 = W / 2 - sp - 5, g = 9;   // zona della scena, terreno a g
      function scene(kind, Fh, Fd) {
        const sky = RECT(sx0, g + 2, sx1, Hh - 6);
        const stars = (k, avoid) => { let free = D(OFF(sky, -3), avoid); for (let i = 0; i < 60 && k > 0; i++) { const x = sx0 + (sx1 - sx0) * R(), y = g + 10 + (Hh - g - 18) * R(), r = 1.6 + 1.6 * R(), c = C2(x, y, r + 1.6); if (!empty(D(c, free))) continue; Fh.push(star(x, y, r)); free = D(free, C2(x, y, r + 3)); k--; } };
        const moon = (x, y, r) => D(C2(x, y, r), C2(x + r * 0.45, y + r * 0.25, r * 0.85));
        if (kind === 'villaggio') {
          const houses = [], roofs = [];
          const defs = [[-0.30, 0.34, 0.30], [0.02, 0.30, 0.42], [0.31, 0.30, 0.26]];
          for (const [cx, w, hh] of defs) {
            const x = cx * W, ww = w * W, ht = hh * Hh, rh = ww * 0.55;
            const body = RECT(x - ww / 2, g - 1, x + ww / 2, g + ht), roof = P2([[x - ww / 2 - 1.5, g + ht - 0.01], [x + ww / 2 + 1.5, g + ht - 0.01], [x, g + ht + rh]]);
            const hs = U([body, roof]); houses.push(hs);
            roofs.push(I(D(roof, MV(roof, 0, -2.6)), roof));
            const nw = ww > 18 ? 2 : 1;
            for (let k = 0; k < nw; k++) { const wx = x - ww / 2 + (k + 1) * ww / (nw + 1); Fh.push(D(RECT(wx - 2.4, g + ht * 0.42, wx + 2.4, g + ht * 0.42 + 5.4), U([RECT(wx - 0.6, g, wx + 0.6, g + 99), RECT(wx - 9, g + ht * 0.42 + 2.1, wx + 9, g + ht * 0.42 + 3.3)]))); }
            Fh.push(C2(x, g + ht + rh * 0.42, Math.min(2.2, rh * 0.18)));
          }
          const hU = U(houses);
          Fd.push(D(OFF(hU, 0.9), hU), U(roofs));
          stars(7, OFF(hU, 2)); Fh.push(moon(sx1 - 7, Hh - 15, 5.5));
        } else if (kind === 'bosco') {
          const trees = [];
          for (const [cx, hh] of [[-0.3, 0.55], [-0.06, 0.72], [0.17, 0.5], [0.33, 0.62]]) {
            const x = cx * W, ht = hh * (Hh - g - 12), w = ht * 0.5, t = [];
            for (let k = 0; k < 3; k++) { const y0 = g + 4 + k * ht * 0.27, ww = w * (1 - k * 0.27); t.push(P2([[x - ww / 2, y0], [x + ww / 2, y0], [x, y0 + ht * 0.42]])); }
            t.push(RECT(x - 1.3, g, x + 1.3, g + 5));
            trees.push(U(t));
          }
          const tU = U(trees); Fh.push(tU);
          Fd.push(D(OFF(tU, 1.1), tU));
          stars(9, OFF(tU, 2));
        } else if (kind === 'slitta' && T.artGeom && T.EMO_BY) {
          // due renne sulla neve, una davanti all'altra, sotto la luna
          const sw2 = sx1 - sx0, deer = T.artGeom(T.EMO_BY['deer'], sw2 * 0.5).sil, deer2 = T.artGeom(T.EMO_BY['deer'], sw2 * 0.38).sil;
          const b1 = bounds(deer), b2 = bounds(deer2);
          const s1 = MV(deer, sx0 + sw2 * 0.34 - (b1.x0 + b1.x1) / 2, g + 1.5 - b1.y0), s2 = MV(MIRX(deer2), sx1 - sw2 * 0.2 - (b2.x0 + b2.x1) / 2, g + 1.5 - b2.y0);
          const fig = clean(U([s1, s2]), 1.2); Fh.push(fig);
          Fh.push(moon(sx1 - 9, Hh - 15, 7)); stars(6, OFF(U([fig, C2(sx1 - 9, Hh - 15, 10)]), 2));
          // alberelli sul terreno, disegnati
          for (const x of [-0.28, 0.06, 0.3]) Fd.push(D(P2([[x * W - 5, g], [x * W + 5, g], [x * W, g + 13]]), P2([[x * W - 3.4, g + 1], [x * W + 3.4, g + 1], [x * W, g + 10.5]])));
        } else if (kind === 'stelle') {
          const mr = Math.min(12, (sx1 - sx0) * 0.22); Fh.push(moon(0, Hh * 0.62, mr)); stars(16, C2(0, Hh * 0.62, mr + 3));
        } else if (kind === 'cuori') {
          let free = OFF(sky, -2);
          for (let i = 0; i < 80; i++) { const s = 6 + 6 * R(), x = sx0 + (sx1 - sx0) * R(), y = g + 4 + (Hh - g - 12) * R(), c = C2(x, y, s / 2 + 1.6); if (!empty(D(c, free))) continue; Fh.push(heart(x, y, s)); free = D(free, C2(x, y, s / 2 + 3)); }
        } else {
          let free = OFF(sky, -2);
          for (let i = 0; i < 80; i++) { const r = 3.5 + 3.5 * R(), x = sx0 + (sx1 - sx0) * R(), y = g + 4 + (Hh - g - 12) * R(), c = C2(x, y, r + 1.6); if (!empty(D(c, free))) continue; Fh.push(flake(x, y, r, 1.4)); free = D(free, C2(x, y, r + 3)); }
        }
      }
      const panels = [];
      const sc4 = [p.scena1 || 'villaggio', p.scena2 || 'bosco', p.scena3 || 'slitta', p.scena4 || 'fiocchi'];
      for (const [nm, kind, own, az] of [['Pannello 1', sc4[0], true, 0], ['Pannello 2', sc4[1], false, 90], ['Pannello 3', sc4[2], true, 180], ['Pannello 4', sc4[3], false, -90]]) {
        const outline = fingerPanel(W, Hh, sp, tol, n, own), Fh = [], Fd = [];
        scene(kind, Fh, Fd);
        const holes = I(U(Fh), OFF(RECT(sx0, 3, sx1, Hh - 3), 0));
        // cornice e neve sul terreno
        const fr = D(RECT(-W / 2 + sp + 1, 1, W / 2 - sp - 1, Hh - 1), RECT(-W / 2 + sp + 3, 3, W / 2 - sp - 3, Hh - 3));
        const ground = U([RECT(-W / 2, 0, W / 2, g - 2), ...Array.from({ length: 9 }, (_, k) => C2(-W / 2 + k * W / 8, g - 2.2, 2 + 1.5 * R(), 20))]);
        // i trafori non devono lasciare isole staccate (cadrebbero): tengo solo il pezzo più grande
        let solid = D(outline, holes);
        const bits = solid.decompose().map(R2);
        if (bits.length > 1) { bits.sort((a, b) => b.area() - a.area()); solid = bits[0]; }
        // pannelli dei fianchi: tacca in alto al centro per il manico (incastro a mezzo legno)
        if (p.manico !== false && !own) solid = D(solid, RECT(-(sp + tol) / 2, Hh - dJ / 2 - tol, (sp + tol) / 2, Hh + 1));
        let base = U([solid, tabsB]);
        let decor = U([fr, ground, ...Fd]);
        decor = clean(D(I(decor, OFF(solid, -0.3)), OFF(holes, 0.5)), 0.8);
        panels.push({ name: nm, base, decor, place: (m) => reg(reg(rotXm(m).translate([0, -W / 2 + sp, sp])).rotate([0, 0, az])) });
      }
      // base e cappello: piastre con le fessure delle linguette
      const slots = [];
      for (const s of [-1, 1]) {
        slots.push(RECT(s * W / 4 - wB / 2 - tol / 2, -W / 2 - tol / 2, s * W / 4 + wB / 2 + tol / 2, -W / 2 + sp + tol / 2), RECT(s * W / 4 - wB / 2 - tol / 2, W / 2 - sp - tol / 2, s * W / 4 + wB / 2 + tol / 2, W / 2 + tol / 2));
        slots.push(RECT(W / 2 - sp - tol / 2, s * W / 4 - wB / 2 - tol / 2, W / 2 + tol / 2, s * W / 4 + wB / 2 + tol / 2), RECT(-W / 2 - tol / 2, s * W / 4 - wB / 2 - tol / 2, -W / 2 + sp + tol / 2, s * W / 4 + wB / 2 + tol / 2));
      }
      const sl = U(slots);
      const bOut = OFF(OFF(RECT(-W / 2 - 4.5, -W / 2 - 4.5, W / 2 + 4.5, W / 2 + 4.5), -3), 3);
      const scal = (outC, k) => { const out = [D(outC, OFF(outC, -2, 'Miter'))]; const b = bounds(outC); for (let i = 0; i <= k; i++) for (const [x, y] of [[b.x0 + 2 + i * (b.w - 4) / k, b.y0 + 2], [b.x0 + 2 + i * (b.w - 4) / k, b.y1 - 2], [b.x0 + 2, b.y0 + 2 + i * (b.h - 4) / k], [b.x1 - 2, b.y0 + 2 + i * (b.h - 4) / k]]) out.push(C2(x, y, 2.3, 20)); return I(U(out), outC); };
      const ring = D(C2(0, 0, 20.6, 64), C2(0, 0, 19.6, 64));
      const baseP = { name: 'Base', base: D(bOut, sl), decor: clean(D(U([scal(bOut, 10), ring, ...[0, 90, 180, 270].map(a => ROT(MV(star(0, 0, 3), 26, 0), a + 45))]), OFF(sl, 1.2)), 0.8), place: (m) => m };
      // manico ad arco: i piedi scendono nei pannelli dei fianchi, incastrati a mezzo legno nelle tacche in alto
      const Rc = W / 2 - sp / 2, hb = 6;
      const arcCS = I(D(C2(0, 0, Rc + hb / 2, 128), C2(0, 0, Rc - hb / 2, 128)), RECT(-Rc - hb, 0, Rc + hb, Rc + hb));
      const loop = D(C2(0, Rc + hb / 2 + 3.5, 5.5, 40), C2(0, Rc + hb / 2 + 3.5, 2.8, 32));
      const feet = U([-1, 1].map(s => D(RECT(s * Rc - hb / 2, -dJ, s * Rc + hb / 2, 0.01), RECT(s * Rc - (sp + tol) / 2, -dJ - 1, s * Rc + (sp + tol) / 2, -dJ / 2 + tol))));
      const handleCS = U([arcCS, loop, feet]);
      const handleP = { name: 'Manico', base: handleCS, decor: clean(I(U([...[-60, -30, 0, 30, 60].map(a => ROT(MV(star(0, 0, 1.9), 0, Rc), a))]), OFF(arcCS, -0.4)), 0.8), place: (m) => reg(rotXm(m).translate([0, sp / 2, sp + Hh])) };
      const flatList = [...panels, baseP];
      if (p.manico !== false) flatList.push(handleP);
      // lumino d'esempio
      const tea = union([reg(reg(H.Manifold.cylinder(15, 19, 19, 48)).translate([0, 0, sp])), reg(reg(H.Manifold.cylinder(9, 2.2, 0.3, 24)).translate([0, 0, sp + 15]))]);
      const r = kitFinish(flatList, p, notes, sp, lay, [[tea, '#f3d36b']]);
      const info = [['Lanterna', `${fmt(W)} × ${fmt(W)} × ${fmt(Hh)} mm: 4 pannelli traforati e base${p.manico !== false ? ', manico' : ''}`],
        ...kitInfo(r.cards, p, sp, lay, tol, n),
        ['Montaggio', p.manico !== false ? '1) i pannelli nella base, incastrando i denti agli angoli, 2) il manico dall\'alto nelle tacche dei due fianchi: i piedi del manico e i fianchi si incastrano a croce' : 'i pannelli nella base, incastrando i denti agli angoli'],
        ['Luce', W - 2 * sp >= 40 ? 'lumino LED da 38 mm: sta nel cerchio disegnato sulla base' : 'stretta per un lumino da 38 mm: usa una lucina più piccola'],
        ['Attenzione', 'solo lumini LED, mai candele vere'], ...notes.map(x => ['Nota', x])];
      return { parts: r.parts, info, view: [0.15, -1, 0.8] };
    }

    // ---------------- ALBERO 3D A SAGOME INCROCIATE ----------------
    function kitAlbero(p) {
      const notes = [], sp = Math.max(1, +p.spessore || 2), lay = Math.max(0.12, +p.strato || 0.4), tol = Math.max(0, +p.gioco || 0);
      if (p.prova) return provaKit('croce', p, sp, lay, tol, notes);
      const h = Math.max(60, +p.altezza || 120), w = h * 0.62, R = rng((+p.variante | 0) * 7919 + 5);
      const trunkW = Math.max(18, w * 0.22), trunkH = h * 0.08;
      // sagoma: 5 palchi con il bordo sotto a festoni, tronco
      const tiers = [], dec = [];
      let y = trunkH;
      for (let k = 0; k < 5; k++) {
        const ww = w * (1 - k * 0.17), th = (h * 0.86 - trunkH) * (k === 4 ? 0.36 : 0.27), apex = Math.min(h * 0.93, y + th * 1.25);
        const tri = P2([[-ww / 2, y], [ww / 2, y], [0, apex]]);
        const nb = Math.max(3, Math.round(ww / 9)), bumps = [];
        for (let i = 0; i <= nb; i++) bumps.push(C2(-ww / 2 + 2 + i * (ww - 4) / nb, y + 1.2, Math.min(4.2, ww / nb / 2 + 0.6), 24));
        const tier = U([tri, I(U(bumps), RECT(-ww / 2, y - 6, ww / 2, y + 3))]);
        tiers.push(tier);
        // festone e palline
        const yA = y + th * 0.42;
        if (p.festoni !== false) dec.push(stroke([[-ww * 0.32, yA + 2], [-ww * 0.1, yA - 1.5], [ww * 0.1, yA + 0.8], [ww * 0.3, yA - 2]], 1.2));
        if (p.palline !== false) for (let i = 0; i < 3; i++) dec.push(C2(-ww * 0.3 + i * ww * 0.3 + (R() - 0.5) * 3, y + 3.5 + R() * th * 0.25, 1.8));
        y += th * 0.72;
      }
      const tree = U([...tiers, RECT(-trunkW / 2, 0, trunkW / 2, trunkH + 2)]);
      const snowD = p.neve !== false ? I(icing(U(tiers), Math.max(2, h * 0.018), 9, 'goccia'), OFF(tree, -0.5)) : null;
      const decAll = U([...dec, snowD]);
      const top = bounds(U(tiers)).y1, stR = h * 0.075;
      const starCSx = p.stella !== false ? star(0, top + stR * 0.45, stR) : null;
      const sw = 1.75 * sp + tol, r0 = sp + tol;
      const tabAt = (x) => RECT(x - 2, -sp, x + 2, 0.01);
      const tx = trunkW / 2 - 3.2;
      const A = { base: U([D(tree, RECT(-sw / 2, h / 2 - tol, sw / 2, h * 2)), tabAt(-tx), tabAt(tx)]), decor: decAll };
      const B = { base: U([D(U([tree, starCSx]), RECT(-sw / 2, -sp - 1, sw / 2, h / 2 + tol)), tabAt(-tx), tabAt(tx)]), decor: U([decAll, starCSx ? OFF(starCSx, -0.01) : null]) };
      const xc = (r0 + trunkW / 2) / 2;
      const Cb = U([I(tree, RECT(r0, -1, w, h * 2)), tabAt(xc)]);
      const C = { base: Cb, decor: I(decAll, RECT(r0 + 0.8, -1, w, h * 2)) };
      for (const q of [A, B, C]) q.decor = clean(I(q.decor, OFF(q.base, -0.3)), 0.8);
      const stand = (az) => (m) => reg(reg(rotXm(m).translate([0, sp / 2, sp])).rotate([0, 0, az]));
      // base tonda con le fessure a raggiera e la scritta
      const Rb = Math.max(trunkW / 2 + 12, w * 0.36 + 4), bOut = C2(0, 0, Rb, 128), slots = [];
      const slotR = (x, az) => ROT(RECT(x - 2 - tol / 2, -sp / 2 - tol / 2, x + 2 + tol / 2, sp / 2 + tol / 2), az);
      for (const az of [0, 60]) { slots.push(slotR(-tx, az), slotR(tx, az)); }
      slots.push(slotR(xc, 120), slotR(-xc, 120));
      const sl = U(slots);
      const scal = []; for (let k = 0; k < 40; k++) { const a = k * 9 * DEG; scal.push(C2(Rb * Math.cos(a) * 0.97, Rb * Math.sin(a) * 0.97, 2.6, 20)); }
      let txt = null;
      const baseP = { name: 'Base', base: D(bOut, sl), decor: clean(D(I(U([D(bOut, C2(0, 0, Rb - 1.8, 128)), D(U(scal), txt ? OFF(txt, 1.2) : null), txt]), OFF(bOut, -0.3)), OFF(sl, 1.2)), 0.8), place: (m) => m };
      const flatList = [
        { name: 'Sagoma A', ...A, place: stand(0) }, { name: 'Sagoma B', ...B, place: stand(60) },
        { name: 'Mezza sagoma C 1', ...C, place: stand(120) }, { name: 'Mezza sagoma C 2', ...C, place: stand(300) }, baseP,
      ];
      const cardList = [nestPair(flatList[0], flatList[1], 'Sagome A e B'), nestPair(flatList[2], flatList[3], 'Mezze sagome C'), baseP];
      const r = kitFinish(flatList, p, notes, sp, lay, [], cardList);
      const info = [['Albero', `alto ${fmt(h + (starCSx ? stR : 0) + sp)} mm, largo ${fmt(w)} mm: 3 sagome incrociate a 60° (6 rami) su una base tonda Ø ${fmt(2 * Rb)} mm`],
        ...kitInfo(r.cards, p, sp, lay, tol, 0),
        ['Montaggio', '1) la sagoma A (fessura in alto) nella base, 2) la B (fessura in basso, con la stella) calata dall\'alto sulla A, 3) le due mezze sagome C nelle fessure rimaste'],
        ...notes.map(x => ['Nota', x])];
      return { parts: r.parts, info, view: [0.15, -1, 0.6] };
    }

    // righe comuni del riquadro misure
    function kitInfo(cards, p, sp, lay, tol, n) {
      const out = [];
      if (p.telaio !== false) out.push(['Cartolina', cards.map((c, i) => `${cards.length > 1 ? `n. ${i + 1}: ` : ''}${fmt(c.w)} × ${fmt(c.h)} mm`).join(' · ') + `, spessa ${fmt(sp)} mm + ${fmt(lay)} mm di colore`]);
      out.push(['Stampante a un colore', `cambio filamento a ${fmt(sp)} mm → colore 2 (le decorazioni)`]);
      out.push(['Incastri', `gioco ${fmt(tol)} mm${n ? `, angoli a pettine (${n} denti)` : ''}: prima stampa la prova incastri (Spessori → Solo prova incastri)`]);
      return out;
    }

    // ---------------- PROVA INCASTRI: pochi pezzi piccoli, veloci da stampare ----------------
    // 'pettine': un angolo con due pareti a denti e un pezzo di base con le fessure (casetta, lanterna);
    // 'croce': tre sagome corte con le fessure a metà e la base tonda a raggiera (albero).
    function provaKit(kind, p, sp, lay, tol, notes) {
      const list = [];
      const dot = (x, y) => star(x, y, 2.6);   // un po' di colore: si prova anche il cambio filamento
      const stand = (az, dy = 0) => (m) => reg(reg(rotXm(m).translate([0, sp / 2 + dy, sp])).rotate([0, 0, az]));
      if (kind === 'pettine') {
        const S = 26, Hh = 18, tw = 8;
        const tab = RECT(-tw / 2, -sp, tw / 2, 0.01);
        const wallP = (own, name, az) => ({ name, base: U([fingerPanel(S, Hh, sp, tol, 3, own), tab]), decor: dot(0, Hh / 2), place: (m) => reg(reg(rotXm(m).translate([0, -S / 2 + sp, sp])).rotate([0, 0, az])) });
        list.push(wallP(true, 'Prova · parete A', 0), wallP(false, 'Prova · parete B', 90));
        const out = OFF(OFF(RECT(-S / 2 - 4, -S / 2 - 4, S / 2 + 4, S / 2 + 4), -2), 2);
        const sl = U([RECT(-tw / 2 - tol / 2, -S / 2 - tol / 2, tw / 2 + tol / 2, -S / 2 + sp + tol / 2), RECT(S / 2 - sp - tol / 2, -tw / 2 - tol / 2, S / 2 + tol / 2, tw / 2 + tol / 2)]);
        list.push({ name: 'Prova · base', base: D(out, sl), decor: dot(-S / 4, S / 4), place: (m) => m });
      } else {
        const S = 13, Hh = 30, sw = 1.75 * sp + tol, r0 = sp + tol, tx = 6, xc = (r0 + S) / 2;
        const tabAt = (x) => RECT(x - 2, -sp, x + 2, 0.01);
        list.push({ name: 'Prova · sagoma A', base: U([D(RECT(-S, 0, S, Hh), RECT(-sw / 2, Hh / 2 - tol, sw / 2, Hh + 1)), tabAt(-tx), tabAt(tx)]), decor: dot(-S / 2, Hh * 0.3), place: stand(0) });
        list.push({ name: 'Prova · sagoma B', base: U([D(RECT(-S, 0, S, Hh), RECT(-sw / 2, -sp - 1, sw / 2, Hh / 2 + tol)), tabAt(-tx), tabAt(tx)]), decor: dot(-S / 2, Hh * 0.7), place: stand(60) });
        list.push({ name: 'Prova · mezza sagoma C', base: U([RECT(r0, 0, S, Hh), tabAt(xc)]), decor: null, place: stand(120) });
        const slotR = (x, az) => ROT(RECT(x - 2 - tol / 2, -sp / 2 - tol / 2, x + 2 + tol / 2, sp / 2 + tol / 2), az);
        const sl = U([slotR(-tx, 0), slotR(tx, 0), slotR(-tx, 60), slotR(tx, 60), slotR(xc, 120)]);
        list.push({ name: 'Prova · base', base: D(C2(0, 0, S + 5, 64), sl), decor: null, place: (m) => m });
      }
      const r = kitFinish(list, Object.assign({}, p, { scritta: '', marchio: false }), notes, sp, lay);
      const info = [['Prova incastri', `solo ${list.length} pezzi piccoli${p.telaio !== false ? ' su una cartolina mini, con i canali' : ''}: si stampa in pochi minuti`],
        ['Come provare', kind === 'pettine' ? 'infila le due pareti nella base e incastra i denti dell\'angolo. Devono entrare con una leggera pressione e restare ferme' : 'infila la A nella base, cala la B dall\'alto sulla A, poi la mezza sagoma C nella sua fessura. Devono entrare con una leggera pressione'],
        ['Se entrano duri', `aumenta il gioco (ora ${fmt(tol)} mm) di 0,05–0,1 mm; se ballano diminuiscilo. Poi spegni la prova e stampa tutto`],
        ['Stampante a un colore', `cambio filamento a ${fmt(sp)} mm: le stelline provano anche lo strato colorato`],
        ...notes.map(x => ['Nota', x])];
      return { parts: r.parts, info, view: [0.15, -1, 0.7] };
    }

    const T = H.decor || {};
    const withN = (fn) => (p) => { const N = H.decor && H.decor.NOTES; if (N) N.clear(); const r = fn(p); if (N) { for (const x of N) r.info.push(['Nota', x]); N.clear(); } return r; };
    return { casetta: withN(casetta), lanternakit: withN(kitLanterna), alberokit: withN(kitAlbero) };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

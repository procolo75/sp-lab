// Casetta di Natale in kit: una cartolina piatta come le stampate dei modellini, con i pezzi attaccati al telaio da
// piccoli canali da spezzare. Si staccano e si montano a incastro: quattro pareti con gli angoli a pettine, due falde
// del tetto con le asole, una base con le fessure, alberi, pupazzo di neve e pacco regalo che si infilano nella base.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto.
// - ogni pezzo si stampa piatto, faccia esterna in alto: sopra c'è lo strato colorato (decorazioni) di spessore p.strato,
//   quindi con una stampante a un colore basta un cambio filamento;
// - le decorazioni hanno linee larghe almeno 0,9 mm (due passate con ugello 0,4) e gli spazi almeno 0,6 mm;
// - l'anteprima mostra la cartolina e, a destra, la casetta montata (ruolo 'model': non va nel file).
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

    function casetta(p) {
      const notes = [], info = [];
      const st = STYLES[p.stile] || STYLES.zenzero, style = STYLES[p.stile] ? p.stile : 'zenzero';
      const pick = (v, d) => (v && v !== 'auto' ? v : d);
      const tetto = pick(p.tetto, st.tetto), pareti = pick(p.pareti, st.pareti), orn = pick(p.ornamento, st.orn), ornB = pick(p.ornamento, st.ornB), sparsi = pick(p.sparsi, st.sparsi);
      const sp = Math.max(0.8, +p.spessore || 1.6), lay = Math.max(0.12, +p.strato || 0.4), tol = Math.max(0, +p.gioco || 0);
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
        const sh = Math.min(16, (vF - Hw) * 0.5), sw = W * 0.66, sc = Hw + (vF - Hw) * 0.55;
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
              const capW = Math.min(sign.y1 - sign.y0 - 5, 9);
              let tc = T.textCS([txt], p.carattere || 'tondo', capW, +p.ugello || 0.4);
              if (tc) {
                const b = bounds(tc), k = Math.min(1, (sign.x1 - sign.x0 - 5) / b.w, (sign.y1 - sign.y0 - 4.4) / b.h);
                if (k < 1) tc = R2(tc.scale([k, k]));
                const b2 = bounds(tc);
                F.decor.push(MV(tc, -(b2.x0 + b2.x1) / 2, (sign.y0 + sign.y1) / 2 - (b2.y0 + b2.y1) / 2));
                if (k < 0.97) notes.push('~Scritta dell\'insegna ridotta per stare nel riquadro');
              }
            }
            F.keep.push(OFF(sg, 2));
            for (const s of [-1, 1]) F.decor.push(star(s * (sign.x1 + (W / 2 - sign.x1) / 2 + 0.5), (sign.y0 + sign.y1) / 2, Math.min(4.5, (W / 2 - sign.x1) / 2 - 1.5)));
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

      // ===== cartolina: pezzi sul telaio, attaccati con canali sottili =====
      const telaio = p.telaio !== false, bed = Math.max(120, +p.piatto || 220);
      const gap = telaio ? 2.2 : 5, barW = 2.6, gW = 1.2, gH = Math.min(sp, Math.max(0.4, +p.canale || 0.8));
      const maxInner = bed - 2 * barW - 1;
      const items = flatList.map((it) => Object.assign({}, it, { b0: bounds(it.base) }));
      const tooBig = items.filter(it => Math.min(it.b0.w, it.b0.h) + 2 * gap > maxInner || Math.max(it.b0.w, it.b0.h) + 2 * gap > maxInner);
      if (tooBig.length) notes.push(`${tooBig.map(t => t.name).join(', ')} più grand${tooBig.length > 1 ? 'i' : 'e'} del piatto da ${fmt(bed)} mm: rimpicciolisci la casa o metti il piatto giusto`);
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
        for (const ord of orders) for (let Wt = maxInner; Wt >= minW - 1e-6; Wt -= 4) {
          const r = pack(left.slice().sort(ord), Wt, Hmax);
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
          const b = bounds(bb), cX0 = X(x0), cX1 = X(x1), cY0 = Y(y1), cY1 = Y(y0);
          const gate = (side) => {
            const hor = side === 'l' || side === 'r';
            const strip = I(bb, side === 'l' ? RECT(b.x0, b.y0, b.x0 + 1.5, b.y1) : side === 'r' ? RECT(b.x1 - 1.5, b.y0, b.x1, b.y1) : side === 'b' ? RECT(b.x0, b.y0, b.x1, b.y0 + 1.5) : RECT(b.x0, b.y1 - 1.5, b.x1, b.y1));
            if (empty(strip)) return null;
            const sb = bounds(strip), mid = hor ? (sb.y0 + sb.y1) / 2 : (sb.x0 + sb.x1) / 2;
            const line = I(bb, hor ? RECT(b.x0, mid - gW / 2, b.x1, mid + gW / 2) : RECT(mid - gW / 2, b.y0, mid + gW / 2, b.y1));
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

    return { casetta: (p) => { const N = H.decor && H.decor.NOTES; if (N) N.clear(); const r = casetta(p); if (N) { for (const x of N) r.info.push(['Nota', x]); N.clear(); } return r; } };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

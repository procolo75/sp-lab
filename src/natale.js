// Generatori di Natale: palline, decorazioni piatte con scritta, alberi, stelle, lanterne, formine per biscotti.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto.
// Colori: ogni parte ha `color` e `group`; le parti dello stesso gruppo diventano un unico oggetto multicolore nel 3MF.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function natale(H) {
    const { Manifold, CrossSection, reg, union, sub, box, cylZ, coneZ, cylY, hullPts, fmt, knurled } = H;
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
    // testo centrato in (0,0); capH = altezza delle maiuscole in mm
    function textCS(lines, fontId, capH) {
      const F = FONTS[fontId] || FONTS.tondo;
      lines = lines.map(l => String(l || '').trim()).filter(Boolean);
      if (!F || !lines.length) return null;
      const s = capH / F.cap, lh = capH * 1.5, polys = [];
      lines.forEach((line, i) => {
        let w = 0;
        for (const ch of line) w += (F.g[ch] || F.g['?'])[0] * s;
        let x = -w / 2;
        const y = ((lines.length - 1) / 2 - i) * lh - capH / 2;
        for (const ch of line) { const g = F.g[ch] || F.g['?']; if (g[1]) glyphPolys(g[1], s, x, y, polys); x += g[0] * s; }
      });
      const ok = polys.filter(p => p.length >= 3);
      if (!ok.length) return null;
      let c = P2s(ok);
      if (empty(c)) return null;
      const b = bounds(c);
      return MV(c, -(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2);
    }
    const P2s = (polys) => R2(CrossSection.ofPolygons(polys, 'NonZero'));
    // scritta adattata a un riquadro {x,y,w,h}; restituisce anche l'altezza effettiva delle lettere
    function fitText(p, bx, capWanted) {
      const lines = [p.scritta, p.scritta2];
      let c = textCS(lines, p.carattere, capWanted);
      if (!c) return null;
      const b = bounds(c), f = Math.min(1, bx.w / b.w, bx.h / b.h);
      if (f < 1) c = R2(c.scale([f, f]));
      return { cs: MV(c, bx.x, bx.y), cap: capWanted * f, reduced: f < 0.97 };
    }

    // ---------- forme 2D (altezza S, centrate) ----------
    // ognuna restituisce { base, decor, box (riquadro per la scritta), hang (punto di aggancio in alto), holes }
    const SHAPES = {
      stella(S, p) {
        const n = Math.max(4, Math.min(12, p.punte | 0 || 5)), R = S / 2;
        return { base: soft(starCS(n, R, R * 0.48), 0.6), box: { x: 0, y: -R * 0.04, w: R * 0.95, h: R * 0.42 }, hang: [0, R] };
      },
      albero(S) {
        const W = 0.78 * S, y0 = -S / 2 + 0.11 * S, top = S / 2 - 0.1 * S;
        const tier = (w, yb, ya) => P2([[-w / 2, yb], [0, yb - 0.025 * S], [w / 2, yb], [0, ya]]);
        const tiers = [tier(W, y0, y0 + 0.42 * S), tier(0.76 * W, y0 + 0.25 * S, y0 + 0.6 * S), tier(0.52 * W, y0 + 0.47 * S, top + 0.02 * S)];
        const star = starCS(5, 0.1 * S, 0.045 * S, 0, top);
        const base = soft(U([...tiers, RECT(-0.08 * S, -S / 2, 0.08 * S, y0 + 0.02 * S), star]), 0.5);
        const rb = 0.034 * S;
        const balls = [[-0.24, y0 / S + 0.07], [0.25, y0 / S + 0.05], [0.02, y0 / S + 0.26], [-0.14, y0 / S + 0.33], [0.15, y0 / S + 0.36], [-0.05, y0 / S + 0.56], [0.08, y0 / S + 0.63]]
          .map(([x, y]) => C2(x * S, y * S, rb, 24));
        return { base, decor: U([star, ...balls]), box: { x: 0, y: y0 + 0.14 * S, w: 0.42 * S, h: 0.1 * S }, hang: [0, top + 0.1 * S] };
      },
      fiocco(S, p) {
        const r = rng(p.variante || 1), R = S / 2, wa = Math.max(2.4, R * 0.1);
        const arm = [stroke([[0, 0], [0, R - wa / 2]], wa)];
        const nb = 2 + Math.floor(r() * 2);
        for (let k = 0; k < nb; k++) {
          const t = 0.3 + 0.55 * (k + 0.2 + r() * 0.6) / nb, L = R * (1 - t) * (0.45 + 0.35 * r());
          const a = (45 + r() * 25) * Math.PI / 180, y = t * R;
          for (const sx of [-1, 1]) arm.push(stroke([[0, y], [sx * L * Math.sin(a), y + L * Math.cos(a)]], wa * 0.85));
        }
        if (r() > 0.4) { const q = wa * (1.1 + r() * 0.6); arm.push(P2([[0, R - 2 * q], [q, R - q * 1.2], [0, R], [-q, R - q * 1.2]])); }
        const one = U(arm), all = [C2(0, 0, R * (0.16 + 0.1 * r()), 6)];
        for (let i = 0; i < 6; i++) all.push(ROT(one, i * 60));
        return { base: U(all), box: { x: 0, y: 0, w: R * 0.3, h: R * 0.3 }, hang: [0, R] };
      },
      campana(S) {
        const yb = -S / 2 + 0.08 * S, yt = S / 2 - 0.15 * S, Hb = yt - yb, n = 40, R = [], L = [];
        for (let i = 0; i <= n; i++) {
          const v = i / n, y = yb + v * Hb;
          const w = v < 0.8 ? 0.2 * S + 0.24 * S * Math.pow((0.8 - v) / 0.8, 2.6) : 0.2 * S * Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.8) / 0.2, 2)));
          R.push([w, y]); L.unshift([-w, y]);
        }
        const bell = soft(P2([...R, ...L]), 1);
        const bow = U([E2(-0.11 * S, yt + 0.035 * S, 0.12 * S, 0.06 * S, 20), E2(0.11 * S, yt + 0.035 * S, 0.12 * S, 0.06 * S, -20), C2(0, yt + 0.02 * S, 0.045 * S)]);
        const band = I(bell, RECT(-S, yb + 0.07 * S, S, yb + 0.13 * S));
        return { base: U([bell, C2(0, yb - 0.02 * S, 0.075 * S), bow]), decor: U([bow, band]), box: { x: 0, y: yb + 0.45 * Hb, w: 0.36 * S, h: 0.13 * S }, hang: [0, yt + 0.09 * S] };
      },
      pallina(S) {
        const R = 0.42 * S, cy = -S / 2 + R;
        const cap = RECT(-0.11 * S, cy + R - 0.03 * S, 0.11 * S, cy + R + 0.08 * S);
        const ball = C2(0, cy, R, 96);
        const wave = (yc) => {
          const top = [], bot = [];
          for (let i = 0; i <= 40; i++) { const x = -R + 2 * R * i / 40, y = yc + 0.02 * S * Math.sin(x / R * 3 * Math.PI); top.push([x, y + 0.035 * S]); bot.push([x, y - 0.035 * S]); }
          return P2([...bot, ...top.reverse()]);
        };
        const bands = I(ball, U([wave(cy + 0.55 * R), wave(cy - 0.55 * R)]));
        return { base: U([ball, cap]), decor: U([cap, bands]), box: { x: 0, y: cy, w: 1.45 * R, h: 0.5 * R }, hang: [0, cy + R + 0.08 * S] };
      },
      cuore(S) {
        const pts = [], s = S / 29;
        for (let i = 0; i < 120; i++) { const t = 2 * Math.PI * i / 120; pts.push([16 * Math.pow(Math.sin(t), 3) * s, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * s]); }
        return { base: soft(P2(pts), 0.6), box: { x: 0, y: 0.06 * S, w: 0.62 * S, h: 0.3 * S }, hang: [0, 7.5 * s] };
      },
      pupazzo(S) {
        const r1 = 0.25 * S, y1 = -S / 2 + r1, r2 = 0.17 * S, y2 = y1 + r1 + r2 * 0.7, yb = y2 + r2 * 0.72;
        const hat = U([RECT(-0.18 * S, yb, 0.18 * S, yb + 0.035 * S), RECT(-0.11 * S, yb + 0.03 * S, 0.11 * S, yb + 0.19 * S)]);
        const base = soft(U([C2(0, y1, r1, 96), C2(0, y2, r2, 64), hat]), 0.5);
        const decor = U([hat, C2(0, y1 + 0.12 * S, 0.026 * S, 24), C2(0, y1, 0.026 * S, 24), C2(0, y1 - 0.12 * S, 0.026 * S, 24),
          C2(-0.06 * S, y2 + 0.045 * S, 0.02 * S, 20), C2(0.06 * S, y2 + 0.045 * S, 0.02 * S, 20),
          P2([[0, y2 - 0.005 * S], [0.12 * S, y2 - 0.03 * S], [0, y2 - 0.045 * S]]),
          I(base, RECT(-S, y1 + r1 - 0.035 * S, S, y1 + r1 + 0.03 * S))]);
        return { base, decor, box: { x: 0, y: y1 - 0.02 * S, w: 0.36 * S, h: 0.12 * S }, hang: [0, yb + 0.19 * S] };
      },
      bastoncino(S) {
        const w = 0.15 * S, rh = 0.19 * S, sx = 0.12 * S, yT = S / 2 - w / 2, cx = sx - rh, cy = yT - rh;
        const pts = [[sx, -S / 2 + w / 2], [sx, cy]];
        for (let i = 1; i <= 16; i++) { const a = Math.PI * i / 16; pts.push([cx + rh * Math.cos(a), cy + rh * Math.sin(a)]); }
        pts.push([cx - rh, cy - 0.1 * S]);
        const base = stroke(pts, w);
        const st = [];
        for (let k = -8; k <= 8; k++) st.push(ROT(RECT(-S, k * 0.13 * S - 0.03 * S, S, k * 0.13 * S + 0.03 * S), 35));
        return { base, decor: I(base, U(st)), box: null, hang: [cx, yT + w / 2] };
      },
      calza(S) {
        const leg = RECT(-0.2 * S, -0.22 * S, 0.14 * S, 0.3 * S), cuff = RECT(-0.24 * S, 0.3 * S, 0.18 * S, 0.5 * S);
        const foot = R2(CrossSection.hull([C2(-0.04 * S, -0.3 * S, 0.2 * S, 64), C2(0.25 * S, -0.33 * S, 0.17 * S, 64)]));
        const base0 = soft(U([leg, foot, cuff]), 1.2), base = MV(base0, -0.04 * S, 0);
        const decor = U([MV(cuff, -0.04 * S, 0), I(base, C2(0.32 * S, -0.34 * S, 0.14 * S)), I(base, C2(-0.13 * S, -0.42 * S, 0.12 * S))]);
        return { base, decor, box: { x: -0.07 * S, y: 0.4 * S, w: 0.37 * S, h: 0.13 * S }, hang: [-0.24 * S, 0.5 * S] };
      },
      regalo(S) {
        const o = 0.06 * S;
        const boxC = RECT(-0.34 * S, -0.5 * S + o, 0.34 * S, 0.08 * S + o), lid = RECT(-0.38 * S, 0.08 * S + o, 0.38 * S, 0.2 * S + o);
        const bow = U([E2(-0.13 * S, 0.28 * S + o, 0.14 * S, 0.075 * S, 25), E2(0.13 * S, 0.28 * S + o, 0.14 * S, 0.075 * S, -25), C2(0, 0.24 * S + o, 0.05 * S)]);
        const ribbon = U([RECT(-0.05 * S, -0.5 * S + o, 0.05 * S, 0.2 * S + o), RECT(-0.34 * S, -0.27 * S + o, 0.34 * S, -0.18 * S + o)]);
        return { base: soft(U([boxC, lid, bow]), 0.6), decor: U([ribbon, bow]), box: { x: 0, y: -0.06 * S, w: 0.58 * S, h: 0.14 * S }, hang: [0, 0.36 * S + o] };
      },
      casetta(S) {
        const walls = RECT(-0.3 * S, -0.5 * S, 0.3 * S, 0.02 * S), roof = P2([[-0.42 * S, 0], [0.42 * S, 0], [0, 0.45 * S]]);
        const chim = RECT(0.14 * S, 0.12 * S, 0.24 * S, 0.42 * S);
        const base = soft(U([walls, roof, chim]), 0.5);
        const snow = U([D(roof, MV(roof, 0, -0.07 * S)), RECT(0.13 * S, 0.38 * S, 0.25 * S, 0.43 * S)]);
        const decor = U([I(base, snow), RECT(-0.07 * S, -0.5 * S, 0.07 * S, -0.27 * S), RECT(-0.23 * S, -0.22 * S, -0.12 * S, -0.11 * S), RECT(0.12 * S, -0.22 * S, 0.23 * S, -0.11 * S)]);
        return { base, decor, box: { x: 0, y: -0.04 * S, w: 0.5 * S, h: 0.09 * S }, hang: [0, 0.45 * S] };
      },
      angelo(S) {
        const robe = P2([[-0.27 * S, -0.5 * S], [0.27 * S, -0.5 * S], [0.08 * S, 0.12 * S], [-0.08 * S, 0.12 * S]]);
        const head = C2(0, 0.2 * S, 0.11 * S, 64);
        const wings = U([E2(-0.17 * S, 0.03 * S, 0.21 * S, 0.11 * S, -35), E2(0.17 * S, 0.03 * S, 0.21 * S, 0.11 * S, 35)]);
        const halo = D(E2(0, 0.35 * S, 0.13 * S, 0.05 * S), E2(0, 0.35 * S, 0.09 * S, 0.025 * S));
        const base = soft(U([robe, head, wings, halo]), 0.5);
        return { base, decor: U([halo, D(wings, OFF(U([robe, head]), 0.6))]), box: { x: 0, y: -0.3 * S, w: 0.34 * S, h: 0.1 * S }, hang: [0, 0.4 * S] };
      },
      renna(S) {
        const head = E2(0, -0.08 * S, 0.2 * S, 0.24 * S), muzzle = E2(0, -0.24 * S, 0.16 * S, 0.12 * S);
        const ears = U([E2(-0.22 * S, 0.06 * S, 0.1 * S, 0.045 * S, 30), E2(0.22 * S, 0.06 * S, 0.1 * S, 0.045 * S, -30)]);
        const w = Math.max(2.4, 0.05 * S), ant = [];
        for (const sx of [-1, 1]) {
          ant.push(stroke([[sx * 0.08 * S, 0.1 * S], [sx * 0.16 * S, 0.3 * S], [sx * 0.2 * S, 0.47 * S]], w));
          ant.push(stroke([[sx * 0.15 * S, 0.27 * S], [sx * 0.3 * S, 0.33 * S]], w));
          ant.push(stroke([[sx * 0.18 * S, 0.39 * S], [sx * 0.09 * S, 0.46 * S]], w));
        }
        const base = soft(U([head, muzzle, ears, ...ant]), 0.4);
        return { base, decor: C2(0, -0.25 * S, 0.065 * S), holes: U([C2(-0.08 * S, 0, 0.022 * S, 20), C2(0.08 * S, 0, 0.022 * S, 20)]), box: null, hang: [0, 0.16 * S] };
      },
      luna(S) {
        const R = S / 2, base = soft(D(C2(0, 0, R, 96), C2(0.38 * R, 0.16 * R, 0.82 * R, 96)), 0.6);
        return { base, box: null, hang: [-0.17 * R, 0.98 * R] };
      },
      // ---- motivi aggiunti: personaggi, oggetti, simboli ----
      gnomo(S) {
        const hat = P2([[-0.3 * S, -0.04 * S], [0.3 * S, -0.04 * S], [0.12 * S, 0.3 * S], [0.02 * S, 0.5 * S], [-0.05 * S, 0.3 * S]]);
        const brim = RECT(-0.32 * S, -0.08 * S, 0.32 * S, 0.02 * S);
        const beard = R2(CrossSection.hull([E2(0, -0.17 * S, 0.3 * S, 0.12 * S), C2(0, -0.47 * S, 0.03 * S)]));
        const nose = C2(0, -0.09 * S, 0.09 * S);
        const base = soft(U([hat, brim, beard, nose]), 0.6);
        return { base, decor: U([D(beard, nose), brim]), box: { x: 0, y: -0.27 * S, w: 0.36 * S, h: 0.11 * S }, hang: [0.02 * S, 0.5 * S] };
      },
      omino(S) {
        const w = 0.17 * S, iw = Math.max(1.2, 0.022 * S);
        const head = C2(0, 0.3 * S, 0.17 * S, 64);
        const body = R2(CrossSection.hull([C2(0, 0.03 * S, 0.19 * S, 64), C2(0, -0.13 * S, 0.19 * S, 64)]));
        const arms = stroke([[-0.37 * S, 0.12 * S], [0.37 * S, 0.12 * S]], w);
        const legs = U([stroke([[-0.09 * S, -0.15 * S], [-0.24 * S, -0.41 * S]], 0.18 * S), stroke([[0.09 * S, -0.15 * S], [0.24 * S, -0.41 * S]], 0.18 * S)]);
        const base = soft(U([head, body, arms, legs]), 1);
        const zig = (x0, y0, x1, y1, n) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + (i % 2 ? 0.015 * S : 0), y0 + (y1 - y0) * t + (i % 2 ? 0.02 * S : -0.0)]); } return stroke(pts, iw); };
        const icing = U([zig(-0.4 * S, 0.06 * S, -0.4 * S, 0.18 * S, 4), zig(0.4 * S, 0.06 * S, 0.4 * S, 0.18 * S, 4),
          zig(-0.32 * S, -0.39 * S, -0.2 * S, -0.47 * S, 4), zig(0.32 * S, -0.39 * S, 0.2 * S, -0.47 * S, 4),
          C2(-0.06 * S, 0.34 * S, 0.022 * S, 20), C2(0.06 * S, 0.34 * S, 0.022 * S, 20),
          stroke([[-0.07 * S, 0.25 * S], [-0.03 * S, 0.225 * S], [0.03 * S, 0.225 * S], [0.07 * S, 0.25 * S]], iw),
          C2(0, 0.06 * S, 0.026 * S, 20), C2(0, -0.04 * S, 0.026 * S, 20), C2(0, -0.14 * S, 0.026 * S, 20)]);
        return { base, decor: I(icing, OFF(base, -0.5)), box: { x: 0, y: -0.04 * S, w: 0.32 * S, h: 0.1 * S }, hang: [0, 0.47 * S] };
      },
      cappello(S) {
        const band = soft(RECT(-0.42 * S, -0.5 * S, 0.42 * S, -0.29 * S), 0.06 * S);
        const pts = [];
        const bz = (a, b, c, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
        for (let i = 0; i <= 16; i++) pts.push(bz([-0.36 * S, -0.31 * S], [-0.1 * S, 0.48 * S], [0.3 * S, 0.22 * S], i / 16));
        for (let i = 1; i <= 16; i++) pts.push(bz([0.3 * S, 0.22 * S], [0.12 * S, 0.12 * S], [0.36 * S, -0.31 * S], i / 16));
        const cone = P2(pts), pom = C2(0.31 * S, 0.21 * S, 0.1 * S);
        return { base: soft(U([band, cone, pom]), 0.6), decor: U([band, pom]), box: { x: 0, y: -0.395 * S, w: 0.74 * S, h: 0.13 * S }, hang: [0.31 * S, 0.31 * S] };
      },
      babbo(S) {
        const face = C2(0, 0.04 * S, 0.17 * S, 64);
        const beard = R2(CrossSection.hull([E2(0, -0.1 * S, 0.29 * S, 0.14 * S), C2(0, -0.44 * S, 0.06 * S)]));
        const hat = P2([[-0.25 * S, 0.14 * S], [0.25 * S, 0.14 * S], [0.22 * S, 0.3 * S], [0.12 * S, 0.44 * S], [-0.12 * S, 0.33 * S]]);
        const brim = soft(RECT(-0.28 * S, 0.1 * S, 0.28 * S, 0.21 * S), 0.04 * S), pom = C2(0.14 * S, 0.43 * S, 0.07 * S);
        const mous = U([E2(-0.08 * S, -0.05 * S, 0.1 * S, 0.04 * S, 15), E2(0.08 * S, -0.05 * S, 0.1 * S, 0.04 * S, -15)]);
        const base = soft(U([face, beard, hat, brim, pom]), 0.6);
        return { base, decor: U([D(beard, D(face, RECT(-S, -0.02 * S, S, S))), brim, pom, mous]), holes: U([C2(-0.06 * S, 0.06 * S, 0.02 * S, 20), C2(0.06 * S, 0.06 * S, 0.02 * S, 20)]),
          box: { x: 0, y: -0.25 * S, w: 0.38 * S, h: 0.1 * S }, hang: [0.14 * S, 0.5 * S] };
      },
      pinguino(S) {
        const body = E2(0, -0.08 * S, 0.27 * S, 0.36 * S, 0, 64);
        const wings = U([E2(-0.25 * S, -0.1 * S, 0.07 * S, 0.19 * S, -18), E2(0.25 * S, -0.1 * S, 0.07 * S, 0.19 * S, 18)]);
        const feet = U([E2(-0.1 * S, -0.44 * S, 0.1 * S, 0.045 * S), E2(0.1 * S, -0.44 * S, 0.1 * S, 0.045 * S)]);
        const hat = P2([[-0.2 * S, 0.21 * S], [0.2 * S, 0.21 * S], [0.14 * S, 0.36 * S], [0.06 * S, 0.47 * S], [-0.08 * S, 0.36 * S]]);
        const brim = soft(RECT(-0.22 * S, 0.18 * S, 0.22 * S, 0.25 * S), 0.03 * S), pom = C2(0.07 * S, 0.47 * S, 0.055 * S);
        const belly = E2(0, -0.15 * S, 0.18 * S, 0.25 * S), beak = P2([[-0.04 * S, 0.1 * S], [0.04 * S, 0.1 * S], [0, 0.04 * S]]);
        const base = soft(U([body, wings, feet, hat, brim, pom]), 0.5);
        return { base, decor: U([belly, beak, feet, brim, pom]), holes: U([C2(-0.07 * S, 0.14 * S, 0.02 * S, 20), C2(0.07 * S, 0.14 * S, 0.02 * S, 20)]),
          box: { x: 0, y: -0.2 * S, w: 0.3 * S, h: 0.1 * S }, hang: [0.07 * S, 0.52 * S] };
      },
      ghirlanda(S) {
        const R = 0.4 * S, bumps = [C2(0, 0, R, 96)];
        for (let i = 0; i < 18; i++) { const a = 2 * Math.PI * i / 18; bumps.push(C2(R * Math.cos(a), R * Math.sin(a), 0.07 * S, 24)); }
        const ring = D(U(bumps), C2(0, 0, 0.26 * S, 96));
        const banner = P2([[-0.5 * S, -0.1 * S], [0.5 * S, -0.1 * S], [0.45 * S, 0], [0.5 * S, 0.1 * S], [-0.5 * S, 0.1 * S], [-0.45 * S, 0]]);
        const bow = U([E2(-0.09 * S, -0.43 * S, 0.1 * S, 0.055 * S, -20), E2(0.09 * S, -0.43 * S, 0.1 * S, 0.055 * S, 20), C2(0, -0.43 * S, 0.04 * S)]);
        const berries = U([[-0.3, 0.3], [0.32, 0.27], [0, 0.42], [-0.38, -0.2], [0.38, -0.22]].map(([x, y]) => U([C2(x * S, y * S, 0.03 * S, 20), C2(x * S + 0.04 * S, y * S - 0.02 * S, 0.03 * S, 20)])));
        return { base: soft(U([ring, banner, bow]), 0.5), decor: U([bow, D(berries, banner)]), box: { x: 0, y: 0, w: 0.8 * S, h: 0.14 * S }, hang: [0, R + 0.07 * S] };
      },
      agrifoglio(S) {
        const leaf = (cx, cy, rot) => {
          let l = E2(0, 0, 0.3 * S, 0.12 * S, 0, 64);
          for (let i = -3; i <= 3; i++) for (const sy of [-1, 1]) l = D(l, C2(i * 0.082 * S, sy * 0.145 * S, 0.042 * S, 24));
          return MV(ROT(l, rot), cx, cy);
        };
        const leaves = U([leaf(-0.21 * S, -0.1 * S, 30), leaf(0.21 * S, -0.1 * S, -30), leaf(0, 0.14 * S, 90)]);
        const berries = U([C2(-0.06 * S, -0.04 * S, 0.075 * S), C2(0.07 * S, -0.03 * S, 0.075 * S), C2(0, 0.06 * S, 0.075 * S)]);
        return { base: U([leaves, berries]), decor: berries, box: null, hang: [0, 0.43 * S] };
      },
      poinsettia(S) {
        const pet = [];
        for (let i = 0; i < 6; i++) pet.push(ROT(MV(E2(0, 0, 0.11 * S, 0.24 * S), 0, 0.22 * S), i * 60));
        for (let i = 0; i < 6; i++) pet.push(ROT(MV(E2(0, 0, 0.08 * S, 0.17 * S), 0, 0.17 * S), i * 60 + 30));
        const center = U([C2(0, 0, 0.06 * S), C2(0.05 * S, 0.04 * S, 0.03 * S), C2(-0.05 * S, 0.03 * S, 0.03 * S), C2(0, -0.06 * S, 0.03 * S)]);
        return { base: soft(U(pet), 0.6), decor: center, box: null, hang: [0, 0.46 * S] };
      },
      maglione(S) {
        const body = RECT(-0.3 * S, -0.45 * S, 0.3 * S, 0.27 * S);
        const sl = (sx) => P2(sx < 0 ? [[-0.3 * S, 0.27 * S], [-0.5 * S, -0.12 * S], [-0.37 * S, -0.18 * S], [-0.3 * S, -0.02 * S]] : [[0.3 * S, -0.02 * S], [0.37 * S, -0.18 * S], [0.5 * S, -0.12 * S], [0.3 * S, 0.27 * S]]);
        const base0 = soft(D(U([body, sl(-1), sl(1)]), C2(0, 0.32 * S, 0.11 * S)), 0.8);
        const tri = [];
        for (let i = -5; i <= 5; i++) tri.push(P2([[i * 0.06 * S - 0.03 * S, 0.06 * S], [i * 0.06 * S + 0.03 * S, 0.06 * S], [i * 0.06 * S, 0.12 * S]]));
        const decor = U([I(base0, RECT(-S, -0.45 * S, S, -0.38 * S)), I(base0, D(C2(0, 0.32 * S, 0.16 * S), C2(0, 0.32 * S, 0.11 * S))),
          I(base0, U([ROT(RECT(-0.5 * S, -0.2 * S, -0.36 * S, -0.13 * S), 0)])), I(base0, RECT(0.36 * S, -0.2 * S, 0.5 * S, -0.13 * S)), I(RECT(-0.29 * S, 0, 0.29 * S, 0.2 * S), U(tri)),
          ...[-0.2, -0.1, 0, 0.1, 0.2].map(x => C2(x * S, 0.17 * S, 0.018 * S, 16))]);
        return { base: base0, decor, box: { x: 0, y: -0.17 * S, w: 0.5 * S, h: 0.13 * S }, hang: [-0.18 * S, 0.27 * S] };
      },
      muffola(S) {
        const hand = R2(CrossSection.hull([C2(0.02 * S, 0.24 * S, 0.2 * S, 64), RECT(-0.18 * S, -0.26 * S, 0.22 * S, 0.1 * S)]));
        const thumb = E2(-0.22 * S, -0.02 * S, 0.09 * S, 0.16 * S, -25);
        const cuff = soft(RECT(-0.22 * S, -0.5 * S, 0.26 * S, -0.25 * S), 0.03 * S);
        return { base: soft(U([hand, thumb, cuff]), 1), decor: cuff, box: { x: 0.02 * S, y: -0.375 * S, w: 0.42 * S, h: 0.15 * S }, hang: [0.02 * S, 0.44 * S] };
      },
      candela(S) {
        const body = RECT(-0.12 * S, -0.4 * S, 0.12 * S, 0.17 * S);
        const flame = R2(CrossSection.hull([C2(0, 0.28 * S, 0.075 * S), C2(0, 0.48 * S, 0.01 * S, 12)]));
        const dish = E2(0, -0.42 * S, 0.32 * S, 0.075 * S);
        const wick = RECT(-0.012 * S, 0.15 * S, 0.012 * S, 0.24 * S);
        const drip = I(body, U([RECT(-S, 0.1 * S, S, 0.17 * S), C2(-0.06 * S, 0.08 * S, 0.035 * S), C2(0.05 * S, 0.05 * S, 0.035 * S)]));
        return { base: soft(U([body, flame, dish, wick]), 0.5), decor: U([flame, dish, drip]), box: null, hang: [0, 0.49 * S] };
      },
      cometa(S) {
        const star = soft(starCS(5, 0.22 * S, 0.1 * S, 0.24 * S, 0.24 * S, 90 - 18), 0.5);
        const tail = [];
        for (const [k, w] of [[-1, 0.06], [0, 0.08], [1, 0.06]]) {
          const pts = [];
          for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([0.24 * S - 0.7 * S * t + k * 0.09 * S * t, 0.24 * S - 0.62 * S * t - k * 0.09 * S * t + 0.12 * S * Math.sin(Math.PI * t)]); }
          tail.push(stroke(pts, Math.max(2.4, w * S * 0.8)));
        }
        const tl = U(tail);
        return { base: U([star, tl]), decor: D(tl, OFF(star, 0.3)), box: null, hang: [0.24 * S, 0.46 * S] };
      },
      slitta(S) {
        const rw = Math.max(2.4, 0.045 * S), pts = [[-0.46 * S, -0.34 * S]];
        for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + Math.PI * 0.9 * i / 10; pts.push([0.34 * S + 0.1 * S * Math.cos(a), -0.24 * S + 0.1 * S * Math.sin(a)]); }
        const runner = stroke(pts, rw);
        const struts = U([stroke([[-0.3 * S, -0.34 * S], [-0.3 * S, -0.18 * S]], rw), stroke([[0.15 * S, -0.34 * S], [0.15 * S, -0.18 * S]], rw)]);
        const body = soft(P2([[-0.44 * S, -0.2 * S], [0.28 * S, -0.2 * S], [0.4 * S, 0.02 * S], [0.3 * S, 0.06 * S], [0.18 * S, -0.02 * S], [-0.28 * S, -0.02 * S], [-0.34 * S, 0.24 * S], [-0.46 * S, 0.24 * S]]), 0.025 * S);
        const gifts = U([RECT(-0.25 * S, -0.04 * S, -0.06 * S, 0.14 * S), RECT(-0.06 * S, -0.04 * S, 0.1 * S, 0.08 * S), RECT(-0.19 * S, 0.12 * S, -0.03 * S, 0.24 * S)]);
        const base = soft(U([runner, struts, body, gifts]), 0.4);
        return { base, decor: U([runner, D(gifts, OFF(body, 0.01))]), box: { x: -0.05 * S, y: -0.11 * S, w: 0.44 * S, h: 0.1 * S }, hang: [-0.4 * S, 0.24 * S] };
      },
      nastro(S) {
        const loops = U([E2(-0.22 * S, 0.12 * S, 0.25 * S, 0.15 * S, 18), E2(0.22 * S, 0.12 * S, 0.25 * S, 0.15 * S, -18)]);
        const tails = U([P2([[-0.04 * S, 0.06 * S], [0.02 * S, 0.02 * S], [-0.22 * S, -0.48 * S], [-0.3 * S, -0.38 * S], [-0.36 * S, -0.44 * S]]), P2([[0.04 * S, 0.06 * S], [0.36 * S, -0.44 * S], [0.3 * S, -0.38 * S], [0.22 * S, -0.48 * S], [-0.02 * S, 0.02 * S]])]);
        const knot = E2(0, 0.08 * S, 0.08 * S, 0.1 * S);
        const inner = U([E2(-0.24 * S, 0.13 * S, 0.12 * S, 0.06 * S, 18), E2(0.24 * S, 0.13 * S, 0.12 * S, 0.06 * S, -18)]);
        return { base: soft(U([loops, tails, knot]), 0.5), decor: U([knot, inner]), box: null, hang: [0, 0.18 * S] };
      },
      campanelle(S) {
        const one = SHAPES.campana(0.72 * S);
        const L = MV(ROT(one.base, 14), -0.16 * S, -0.1 * S), Rr = MV(ROT(one.base, -14), 0.16 * S, -0.1 * S);
        const dl = MV(ROT(one.decor, 14), -0.16 * S, -0.1 * S), dr = MV(ROT(one.decor, -14), 0.16 * S, -0.1 * S);
        const bow = U([E2(-0.1 * S, 0.36 * S, 0.11 * S, 0.06 * S, 20), E2(0.1 * S, 0.36 * S, 0.11 * S, 0.06 * S, -20), C2(0, 0.35 * S, 0.045 * S)]);
        return { base: U([L, Rr, bow]), decor: U([dl, dr, bow]), box: null, hang: [0, 0.42 * S] };
      },
      globo(S) {
        const glass = C2(0, 0.08 * S, 0.36 * S, 96);
        const foot = soft(P2([[-0.34 * S, -0.5 * S], [0.34 * S, -0.5 * S], [0.26 * S, -0.26 * S], [-0.26 * S, -0.26 * S]]), 0.02 * S);
        const tree = SHAPES.albero(0.4 * S);
        const flakes = U([[-0.2, 0.25], [0.18, 0.3], [-0.24, 0.0], [0.24, 0.05], [0.0, 0.36], [-0.1, -0.12], [0.12, -0.1]].map(([x, y]) => C2(x * S, y * S, 0.02 * S, 16)));
        const snow = I(glass, RECT(-S, -0.3 * S, S, -0.18 * S));
        return { base: U([glass, foot]), decor: U([MV(tree.base, 0, 0.06 * S), flakes, snow]), box: { x: 0, y: -0.38 * S, w: 0.5 * S, h: 0.13 * S }, hang: [0, 0.44 * S] };
      },
      // ---- palla piatta: disco con cappuccio, disegni a colori e nome ----
      palla(S, p) {
        const R = S / 2, d = p.disegno || 'fiocchi', rnd = rng((p.variante || 1) * 7 + 3);
        const disc = C2(0, 0, R, 128);
        // cappuccio con scanalature
        const cw = 0.3 * S, yc0 = Math.sqrt(R * R - cw * cw / 4) - 0.02 * S, yc1 = R + 0.075 * S;
        const capC = soft(U([RECT(-cw / 2, yc0, cw / 2, yc1), RECT(-cw * 0.36, yc1 - 0.01 * S, cw * 0.36, yc1 + 0.025 * S)]), 0.4);
        const gw = Math.max(0.8, 0.012 * S), grooves = [];
        for (let i = -2; i <= 2; i++) grooves.push(RECT(i * cw / 6 - gw / 2, yc0 + 0.035 * S, i * cw / 6 + gw / 2, yc1 - 0.012 * S));
        const capDec = p.cappuccio === false ? null : D(capC, U(grooves));
        // riquadro della scritta: al centro, più in alto sopra le scene, in basso sotto i motivi grandi
        const nl = Math.max(1, [p.scritta, p.scritta2].filter(x => x && String(x).trim()).length), tH = p.altTesto * (1 + 1.5 * (nl - 1));
        const chord = (y) => 2 * Math.sqrt(Math.max(0, R * R - y * y));
        const pad = Math.max(2, 0.3 * p.altTesto);
        let bh = Math.min(0.46 * S, tH * 1.7 + 2 * pad);
        let ty = { bosco: 0.15, paese: 0.15, regali: 0.15, slitta: -0.29, motivo: -0.3 }[d] * S || 0;
        // con due righe il riquadro si sposta verso il centro per restare dentro la palla
        if (ty < 0) ty = Math.min(0, Math.max(ty, -R + 0.1 * S + bh / 2)); else if (ty > 0) ty = Math.max(0, Math.min(ty, R - 0.14 * S - bh / 2));
        const box = { x: 0, y: ty, w: Math.min(chord(ty + bh / 2), chord(ty - bh / 2)) * 0.9, h: bh - 2 * pad };
        // misura la scritta vera e stringe la zona del nome attorno a lei (verso il bordo, se non è al centro)
        const tf = fitText(p, box, p.altTesto);
        if (tf) {
          const th = bounds(tf.cs).h + 0.5, bh2 = Math.min(bh, th + 2 * pad), sh = (bh - bh2) / 2 * Math.sign(ty);
          ty += sh; bh = bh2; box.y = ty; box.h = th;
        }
        // spazio libero sopra il nome, per i motivi grandi
        const fTop = R - 0.07 * S, fBot = ty + bh / 2 + 0.01 * S, fMid = (fTop + fBot) / 2, fH = fTop - fBot;
        const keep = RECT(-R, ty - bh / 2, R, ty + bh / 2);           // zona del nome da lasciare libera
        const inner = OFF(disc, -Math.max(1.2, p.bordo ? p.bordoL + 0.8 : 1.2));
        let c2 = [], c3 = [];                                          // colore 2 e colore 3
        // oggetti sparsi senza sovrapposizioni, lontani dal nome
        const scatter = (n, sMin, sMax, make, area) => {
          const placed = [];
          for (let k = 0; k < n * 40 && placed.length < n; k++) {
            const s = sMin + (sMax - sMin) * rnd(), a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()) * (R - s / 2 - 1.5);
            const x = rr * Math.cos(a), y = rr * Math.sin(a);
            if (area && !area(x, y, s)) continue;
            if (Math.abs(y - ty) < bh / 2 + s / 2 + 1 && nl) continue;
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
        const tree = (x, yb, h) => { const w = h * 0.62; return U([P2([[x - w / 2, yb + 0.12 * h], [x + w / 2, yb + 0.12 * h], [x, yb + 0.62 * h]]), P2([[x - w * 0.4, yb + 0.42 * h], [x + w * 0.4, yb + 0.42 * h], [x, yb + h]]), RECT(x - 0.06 * h, yb, x + 0.06 * h, yb + 0.14 * h)]); };
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
        } else if (d === 'agrifoglio') {
          for (const [x, y, rot, s] of [[-0.25, 0.25, -25, 0.42], [0.27, -0.26, 155, 0.42]]) {
            const h = SHAPES.agrifoglio(s * S);
            c2.push(MV(ROT(D(h.base, h.decor), rot), x * S, y * S)); c3.push(MV(ROT(h.decor, rot), x * S, y * S));
          }
          c3.push(scatter(Math.round(n / 2), 0.07 * S, 0.11 * S, flake, (x, y) => x * y > 0));
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
            for (const [x, h] of [[-0.3, 0.2], [-0.16, 0.28], [0, 0.22], [0.15, 0.3], [0.3, 0.19]]) obj.push(tree(x * S, gy - 0.02 * S, hk(h * S)));
          } else {
            const hs = [[-0.2, 0.22], [0.12, 0.26]];
            for (const [x, s0] of hs) { const s = hk(s0 * S) / S, h = SHAPES.casetta(s * S); obj.push(MV(D(h.base, I(h.decor, OFF(h.base, -0.3))), x * S, gy + s * S / 2 - 0.02 * S)); }
            for (const [x, h] of [[-0.36, 0.17], [-0.03, 0.2], [0.33, 0.16]]) obj.push(tree(x * S, gy - 0.02 * S, hk(h * S)));
            c2.push(D(C2(-0.24 * S, 0.33 * S, 0.075 * S, 48), C2(-0.21 * S, 0.355 * S, 0.065 * S, 48)));
          }
          c2.push(D(U(obj), OFF(keep, 1)));
          c3.push(scatter(Math.round(n * 0.7), 0.05 * S, 0.1 * S, flake, upper(gy + 0.1 * S)));
        } else if (d === 'slitta') {
          const mr = Math.min(0.27 * S, fH / 2), mx = 0.04 * S, my = fMid;
          const moon = C2(mx, my, mr, 96), sl = SHAPES.slitta(1.33 * mr);
          const sled = MV(sl.base, 0, my - 0.07 * mr);
          c3.push(D(moon, OFF(sled, 0.8)));
          c2.push(sled);
          c2.push(scatter(Math.round(n * 0.6), 0.05 * S, 0.09 * S, star, (x, y, s) => Math.hypot(x - mx, y - my) > mr + s / 2 + 1.5));
        } else if (d === 'regali') {
          const gifts = [[-0.2, 0.3], [0.19, 0.32], [0.005, 0.22]];
          for (const [x, s] of gifts) {
            const g = SHAPES.regalo(s * S), y = -0.43 * S - bounds(g.base).y0 - 0.01 * S;
            c2.push(MV(D(g.base, g.decor), x * S, y)); c3.push(MV(g.decor, x * S, y));
          }
          c3.push(I(disc, RECT(-R, -R, R, -0.43 * S)));
          c2.push(scatter(Math.round(n * 0.6), 0.05 * S, 0.09 * S, star, upper(-0.12 * S)));
        } else if (d === 'motivo') {
          const k = SHAPES[p.motivo] ? p.motivo : 'pupazzo', ms = 0.52 * S, m = SHAPES[k](ms, Object.assign({}, p, { punte: 5 }));
          const b = bounds(m.base), sc = Math.min(1, 0.6 * S / b.w, fH * 0.95 / b.h);
          const place = (c) => (c ? MV(R2(c.scale([sc, sc])), -(b.x0 + b.x1) / 2 * sc, fMid - (b.y0 + b.y1) / 2 * sc) : null);
          const det = m.decor ? I(m.decor, m.base) : null;
          c2.push(place(D(D(m.base, det), m.holes))); c3.push(place(D(det, m.holes)));
          const mw = b.w * sc / 2 + 1.5;
          c3.push(scatter(Math.round(n * 0.4), 0.05 * S, 0.08 * S, flake, (x, y, s) => Math.abs(x) > mw + s / 2 && y - s / 2 > fBot));
        }
        let dec2 = U(c2), dec3 = U(c3);
        if (p.fascia && nl) {
          const band = I(disc, keep);
          dec2 = U([D(dec2, OFF(keep, 1.2)), band]); dec3 = D(dec3, OFF(keep, 1.2));
        }
        dec2 = I(dec2, inner); dec3 = I(dec3, inner);
        if (dec3) dec2 = D(dec2, dec3);
        return { base: U([disc, capC]), decor: U([dec2, capDec]), decor3: dec3, box, clear: p.fascia ? 0.9 : 1.6, hang: [0, yc1 + 0.025 * S] };
      },
      medaglione(S) { return { base: C2(0, 0, S / 2, 96), box: { x: 0, y: 0, w: 0.8 * S, h: 0.42 * S }, hang: [0, S / 2] }; },
      targhetta(S) {
        const W = 2.4 * S;
        return { base: soft(RECT(-W / 2, -S / 2, W / 2, S / 2), Math.min(0.2 * S, 6)), box: { x: 0, y: 0, w: W - 0.35 * S, h: 0.62 * S }, hang: [0, S / 2] };
      },
    };
    const SHAPE_NAMES = { stella: 'Stella', albero: 'Albero', fiocco: 'Fiocco di neve', campana: 'Campana', pallina: 'Pallina', cuore: 'Cuore', pupazzo: 'Pupazzo di neve', bastoncino: 'Bastoncino', calza: 'Calza', regalo: 'Regalo', casetta: 'Casetta', angelo: 'Angelo', renna: 'Renna', luna: 'Luna', medaglione: 'Medaglione', targhetta: 'Targhetta', gnomo: 'Gnomo', omino: 'Omino di pan di zenzero', cappello: 'Cappello di Babbo Natale', babbo: 'Babbo Natale', pinguino: 'Pinguino', ghirlanda: 'Ghirlanda', agrifoglio: 'Agrifoglio', poinsettia: 'Stella di Natale', maglione: 'Maglione', muffola: 'Muffola', candela: 'Candela', cometa: 'Stella cometa', slitta: 'Slitta', nastro: 'Fiocco', campanelle: 'Campanelle', globo: 'Palla di neve', nome: 'Nome', palla: 'Palla piatta' };

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
      let tc = textCS([p.scritta, p.scritta2], p.carattere, cap) || textCS(['Nome'], p.carattere, cap);
      const pad = (p.bordo ? p.bordoL : 0) + 1.6, r = cap * 0.35;
      const base = OFF(OFF(tc, pad + r), -r);
      const b = bounds(base), strip = I(base, RECT(-1.5, -1e4, 1.5, 1e4));
      const top = strip && !strip.isEmpty() ? bounds(strip).y1 : b.y1;
      return { sh: { base, decor: null, box: null, hang: [0, top - 0.6] }, txt: { cs: tc, cap } };
    }
    function flatDesign(p, forStamp) {
      const notes = [];
      if (p.forma === 'nome') {
        const { sh, txt } = nameShape(p);
        if (!(p.scritta || p.scritta2)) notes.push('Scrivi il nome nella Riga 1');
        return { sh, base: sh.base, txt, notes };
      }
      const S = p.altezza, sh = SHAPES[p.forma] ? SHAPES[p.forma](S, p) : SHAPES.stella(S, p);
      let base = sh.base;
      let txt = null;
      if ((p.scritta || p.scritta2) && String(p.scritta || p.scritta2).trim()) {
        if (sh.box) {
          txt = fitText(p, sh.box, p.altTesto);
          if (txt && txt.reduced) notes.push(`Scritta ridotta a ${fmt(txt.cap)} mm per starci: allunga la forma o accorcia il testo`);
          if (txt && txt.cs) txt.cs = I(txt.cs, OFF(base, -(p.bordo && !forStamp ? p.bordoL + 0.4 : 0.8)));
        } else notes.push(`Il motivo "${SHAPE_NAMES[p.forma]}" non ha spazio per una scritta: prova Nome, Medaglione, Targhetta, Cappello o Ghirlanda`);
      }
      if (txt && txt.cap < 4.5) notes.push('Lettere sotto i 4,5 mm: vengono poco leggibili');
      return { sh, base, txt, notes };
    }

    function piatto(p) {
      const { sh, txt, notes } = flatDesign(p);
      let base = sh.base;
      const t = p.spessore, hR = p.rilievo, hT = Math.max(p.rilievo, p.rilievoTesto);
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
      // dettagli nel colore 3 (fiocchi bianchi, neve…): stanno alla stessa altezza della scritta
      const d3 = p.decorazioni && sh.decor3 ? D(I(sh.decor3, base), zone) : null;
      let col2 = U([p.decorazioni && sh.decor ? I(sh.decor, base) : null, border]);
      if (sh.holes) col2 = D(col2, OFF(sh.holes, 0.6));
      col2 = D(D(col2, zone), d3);
      const tcs = txt ? txt.cs : null, x3 = empty(d3) ? null : d3;
      let body, dec, text;
      const dT = Math.min(t, p.profTesto), through = dT >= t - 0.01;   // spessore della scritta a filo / incisa
      body = EXT(base, 0, t);
      if (p.stile === 'filo') {
        // a livello: decorazioni e scritta incassate, la superficie resta piana
        if (!empty(col2)) body = sub(body, EXT(col2, t - hR, t + 1));
        if (!empty(tcs)) body = sub(body, EXT(tcs, through ? -1 : t - dT, t + 1));
        if (x3) body = sub(body, EXT(x3, t - hR, t + 1));
        dec = EXT(D(col2, tcs), t - hR, t); text = U3([EXT(tcs, through ? 0 : t - dT, t), EXT(D(x3, tcs), t - hR, t)]);
      } else if (p.stile === 'inciso') {
        if (!empty(tcs)) body = sub(body, EXT(tcs, t - Math.min(dT, t - 0.6), t + 1));
        dec = EXT(col2, t, t + hR); text = EXT(x3, t, t + hR);
      } else if (p.stile === 'traforata') {
        if (!empty(tcs)) body = sub(body, EXT(stencil(tcs, txt.cap), -1, t + 1));
        dec = EXT(col2, t, t + hR); text = EXT(x3, t, t + hR);
      } else {
        dec = EXT(col2, t, t + hR); text = EXT(U([tcs, x3]), t, t + hT);
      }
      const G = SHAPE_NAMES[p.forma] || 'Decorazione';
      const parts = ok([part(`${G} · base`, body, p.col1, G), part(`${G} · decorazioni`, dec, p.col2, G), part(`${G} · scritta`, text, p.col3, G)]);
      const b = bounds(base);
      const f2 = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');
      const hTot = p.stile === 'filo' ? t : p.stile === 'rilievo' ? t + (text ? hT : dec ? hR : 0) : t + (text || dec ? hR : 0);
      const info = [['Misure', `${fmt(b.w)} × ${fmt(b.h)} × ${f2(hTot)} mm`]];
      if (txt) info.push(['Lettere', `${fmt(txt.cap)} mm` + ({ inciso: `, incise ${f2(Math.min(dT, t - 0.6))} mm`, traforata: ', traforate con ponticelli', filo: through ? ', passanti: si vedono dai due lati' : `, a filo, spesse ${f2(dT)} mm` }[p.stile] || '')]);
      info.push(['Colori', `${parts.length}${parts.length > 1 ? ' (una parte per colore nel 3MF)' : ''}`]);
      if (p.stile === 'rilievo' && parts.length > 1) {
        const ch = [];
        if (dec) ch.push(`${f2(t)} mm → colore 2`);
        if (text) ch.push(`${f2(dec && hT > hR ? t + hR : t)} mm → colore 3`);
        info.push(['Stampante a un colore', 'cambio filamento a ' + ch.join(', ')]);
        if (dec && text && hT <= hR) notes.push('Scritta alta come le decorazioni: con un solo estrusore i colori 2 e 3 coincidono. Alza il rilievo della scritta');
      } else if (p.stile === 'filo' && parts.length > 1) {
        notes.push('A filo i colori sono negli stessi strati: serve una stampante multicolore (AMS, MMU…)');
      } else if (p.stile !== 'rilievo' && dec) info.push(['Stampante a un colore', `cambio filamento a ${f2(t)} mm → colore 2` + (text ? ' (i dettagli del colore 3 sono negli stessi strati)' : '')]);
      if (p.stile === 'filo') {
        const al = (v) => [0.2, 0.28].some(h => Math.abs(v / h - Math.round(v / h)) < 0.02);
        if (![t, dT, hR].every(al)) notes.push('Alcuni spessori non sono multipli di 0,2 o 0,28 mm: lo slicer arrotonda agli strati');
      }
      // segnaposto: base con fessura
      if (p.supporto) {
        const L = Math.max(30, Math.min(b.w * 0.8, 90)), Wd = 16, Hs = 9, sl = t + p.tolleranza;
        let st = sub(H.slab(L, Wd, 3, 0, Hs), box(-L / 2 + 4, -sl / 2, Hs - 6, L / 2 - 4, sl / 2, Hs + 1));
        parts.push(part('Supporto da tavolo', st, p.col1, 'Supporto', { at: [0, b.y0 - Wd / 2 - 8, 0] }));
        info.push(['Supporto', `${fmt(L)} × ${fmt(Wd)} × ${fmt(Hs)} mm, fessura ${fmt(sl)} mm`]);
      }
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info };
    }

    // ============ FORMINA PER BISCOTTI ============
    function formina(p) {
      const q = Object.assign({}, p, { bordo: false });
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
        const rel = U([ring, p.decorazioni && sh.decor ? I(sh.decor, plate) : null, txt ? txt.cs : null]);
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
        const tf = fitText(Object.assign({}, p, { scritta: str, scritta2: '' }), { x: 0, y: 0, w: rz * 1.15, h: Math.min(room, (pr.zTop - pr.zBot) * 0.42) }, cap);
        if (!tf) continue;
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
      const textM = textMs.length ? union(textMs) : null, zoneM = zonesM.length ? union(zonesM) : null;
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
        cap = c;
      } else {
        const ro = Math.max(4, Dm * 0.07), ri = ro - 2.2, cz = zT + ri + 0.4;
        body = union([body, reg(sub(cylY(0, cz, ro, -1.4, 1.4, 40), cylY(0, cz, ri, -2, 2, 32)))]);
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
        // anello di giunzione: aderisce all'interno sul piano di separazione
        const inr = OFF(pr.cs, -t - p.tolleranza, J);
        let ring = reg(prismY(D(OFF(inr, 1, J), OFF(inr, -1.6, J)), 3, -3).intersect(rev(inr)));   // il bordo esterno lo dà la superficie interna
        ring = sub(ring, cylZ(rh + 3, zT - 12, zT + 2, 0, 0, 32));
        parts.push(part('Anello di giunzione', ring, col[0], 'Anello', { print: reg(ring.rotate([90, 0, 0])) }));
      } else {
        parts.push(part('Pallina · corpo', body, col[0], 'Pallina'));
        if (dec) parts.push(part('Pallina · decorazioni', dec, col[1], 'Pallina'));
        if (textM) parts.push(part('Pallina · scritta', textM, col[2], 'Pallina'));
        notes.push('Intera serve il supporto sotto: con le due metà invece stampa senza supporti');
      }
      if (cap) parts.push(part('Cappuccio', cap, col[1], 'Cappuccio', { print: reg(cap.rotate([180, 0, 0])) }));
      info.push(['Misure', `Ø ${fmt(2 * pr.rMax)} × ${fmt(pr.zTop - pr.zBot)} mm, guscio ${fmt(t)} mm`]);
      const latoN = (a) => { const x = ((a % 360) + 360) % 360; return x === 0 ? 'davanti' : x === 180 ? 'dietro' : x === 90 ? 'a destra' : x === 270 ? 'a sinistra' : `${x}°`; };
      for (const q of texts) info.push([`Scritta ${q.i}`, `${fmt(q.cap)} mm, ${latoN(q.ang)}`]);
      if (texts.length && p.stileTesto === 'traforata') info.push(['Lettere', 'traforate: con un LED dentro si illuminano']);
      info.push(['Pezzi', p.costruzione === 'meta' ? `2 metà + anello${cap ? ' + cappuccio' : ''}: incolla le metà sull'anello` : `1${cap ? ' + cappuccio' : ''}`]);
      if (p.appendino === 'cappuccio') info.push(['Cappuccio', `foro per il nastro Ø 2,6 mm`]);
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
      const S = p.altezza, tk = p.spessore, sl = tk + p.tolleranza, sh = SHAPES.albero(S, p);
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
      const motif = (() => { const sh = SHAPES[p.disegno === 'fiocchi' ? 'fiocco' : p.disegno === 'alberi' ? 'albero' : p.disegno === 'cuori' ? 'cuore' : 'stella'](size, { punte: 5, variante: 3 }); return fillHoles(sh.base); })();
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

    return { pallina, piatto, palla, albero, stella, lanterna, formina };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

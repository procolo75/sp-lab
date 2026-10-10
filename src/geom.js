// Motore geometrico Gridfinity: contenitori, basi, cassettiere.
// Coordinate: x = larghezza, y = profondità (fronte verso -y), z = altezza. Unità: mm.
(function (root) {
  const GF = {
    PITCH: 42,      // passo griglia
    CLEAR: 0.5,     // gioco tra contenitori (42n - 0.5)
    R_OUT: 3.75,    // raggio esterno contenitore
    UNIT_H: 7,      // unità di altezza
    FOOT_H: 4.75,   // altezza profilo piedino
    LIP_H: 4.4,     // altezza bordo impilabile
    PLATE_R: 4,     // raggio esterno base
    MAG_OFF: 13,    // posizione fori magnete dal centro cella
  };

  function createGeom(wasm) {
    const { Manifold } = wasm;
    let pool = [];
    const reg = (m) => { pool.push(m); return m; };
    const cleanup = () => { for (const m of pool) { try { m.delete(); } catch (e) {} } pool = []; };

    // ---- primitive ----
    function rr(w, d, r, z, cx = 0, cy = 0) {
      r = Math.max(0.05, Math.min(r, w / 2 - 0.01, d / 2 - 0.01));
      const seg = Math.max(3, Math.ceil(r * 2.2));
      const pts = [];
      const hw = w / 2 - r, hd = d / 2 - r;
      const corners = [[hw, hd, 0], [-hw, hd, 90], [-hw, -hd, 180], [hw, -hd, 270]];
      for (const [x, y, a0] of corners) {
        for (let i = 0; i <= seg; i++) {
          const a = (a0 + (90 * i) / seg) * Math.PI / 180;
          pts.push([cx + x + r * Math.cos(a), cy + y + r * Math.sin(a), z]);
        }
      }
      return pts;
    }
    // tronco di piramide arrotondato tra due sezioni
    const loft = (a, b) => reg(Manifold.hull(a.concat(b)));
    const slab = (w, d, r, z0, z1, cx = 0, cy = 0) => loft(rr(w, d, r, z0, cx, cy), rr(w, d, r, z1, cx, cy));
    const chain = (secs) => { const parts = []; for (let i = 0; i < secs.length - 1; i++) parts.push(loft(secs[i], secs[i + 1])); return union(parts); };
    const box = (x0, y0, z0, x1, y1, z1) => reg(reg(Manifold.cube([x1 - x0, y1 - y0, z1 - z0])).translate([x0, y0, z0]));
    const union = (list) => list.length === 1 ? list[0] : reg(Manifold.union(list));
    const sub = (a, b) => reg(a.subtract(b));
    const cylZ = (r, z0, z1, x, y, seg = 32) => reg(reg(Manifold.cylinder(z1 - z0, r, r, seg)).translate([x, y, z0]));
    const hullPts = (pts) => reg(Manifold.hull(pts));

    // ---- piedino Gridfinity (una cella) ----
    function foot(cx, cy) {
      return chain([
        rr(35.6, 35.6, 0.8, 0, cx, cy),
        rr(37.2, 37.2, 1.6, 0.8, cx, cy),
        rr(37.2, 37.2, 1.6, 2.6, cx, cy),
        rr(41.5, 41.5, 3.75, GF.FOOT_H, cx, cy),
      ]);
    }
    function cellCenters(nx, ny) {
      const c = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++)
        c.push([(i - (nx - 1) / 2) * GF.PITCH, (j - (ny - 1) / 2) * GF.PITCH]);
      return c;
    }
    function magnetHoles(nx, ny, p, zBase, dir) {
      // dir = +1: fori dal basso verso l'alto partendo da zBase
      const holes = [];
      if (!p.magneti && !p.viti) return holes;
      for (const [cx, cy] of cellCenters(nx, ny)) {
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
          const x = cx + sx * GF.MAG_OFF, y = cy + sy * GF.MAG_OFF;
          if (p.magneti) {
            const r = p.magDiam / 2 + p.tolleranza / 2;
            holes.push(dir > 0 ? cylZ(r, zBase - 1, zBase + p.magAlt, x, y) : cylZ(r, zBase - p.magAlt, zBase + 1, x, y));
          }
          if (p.viti) {
            const r = 1.5 + p.tolleranza / 2;
            holes.push(dir > 0 ? cylZ(r, zBase - 1, zBase + 6, x, y, 20) : cylZ(r, zBase - 6, zBase + 1, x, y, 20));
          }
        }
      }
      return holes;
    }

    // ---- bordo impilabile: sezioni della cavità (dall'alto verso H) ----
    function lipSocket(W, D, R, H) {
      return [
        rr(W + 1, D + 1, R + 0.5, H + GF.LIP_H + 0.5),
        rr(W, D, R, H + GF.LIP_H),
        rr(W - 1.4, D - 1.4, R - 0.7, H + GF.LIP_H - 0.7),
        rr(W - 1.4, D - 1.4, R - 0.7, H + 1.9),
        rr(W - 5.2, D - 5.2, R - 2.6, H),
      ];
    }

    // corpo esterno comune (piedini + blocco + eventuale bordo)
    function outerBody(nx, ny, H, lip) {
      const W = GF.PITCH * nx - GF.CLEAR, D = GF.PITCH * ny - GF.CLEAR, R = GF.R_OUT;
      const parts = cellCenters(nx, ny).map(([x, y]) => foot(x, y));
      parts.push(slab(W, D, R, GF.FOOT_H - 0.01, H));
      if (lip) parts.push(slab(W, D, R, H - 0.01, H + GF.LIP_H - 0.15));
      return { solid: union(parts), W, D, R };
    }

    // divisori + scoop + etichette in un vano rettangolare
    function interiorFeatures(x0, y0, x1, y1, zF, zTop, p, wallOverlap) {
      const add = [];
      const nx = Math.max(1, p.divX | 0), ny = Math.max(1, p.divY | 0);
      const t = p.spDiv;
      const iw = x1 - x0, id = y1 - y0;
      const cw = (iw - (nx - 1) * t) / nx, cd = (id - (ny - 1) * t) / ny;
      const ov = wallOverlap;
      for (let i = 1; i < nx; i++) {
        const x = x0 + i * cw + (i - 1) * t;
        add.push(box(x, y0 - ov, zF - 0.1, x + t, y1 + ov, zTop));
      }
      for (let j = 1; j < ny; j++) {
        const y = y0 + j * cd + (j - 1) * t;
        add.push(box(x0 - ov, y, zF - 0.1, x1 + ov, y + t, zTop));
      }
      for (let j = 0; j < ny; j++) {
        const yFront = y0 + j * (cd + t), yBack = yFront + cd;
        if (p.scoop && p.scoopR > 0) {
          const r = Math.min(p.scoopR, cd * 0.5, zTop - zF - 1);
          if (r > 0.5) {
            const blk = box(x0 - ov, yFront - 0.01, zF - 0.1, x1 + ov, yFront + r, zF + r);
            const cyl = reg(reg(reg(Manifold.cylinder(iw + 2 * ov + 2, r, r, 48)).rotate([0, 90, 0])).translate([x0 - ov - 1, yFront + r, zF + r]));
            add.push(sub(blk, cyl));
          }
        }
        if (p.etichetta && p.etiProf > 0) {
          const dd = Math.min(p.etiProf, cd * 0.6);
          const zt = zTop, th = 1.2;
          const pts = [];
          for (const x of [x0 - ov, x1 + ov]) {
            pts.push([x, yBack + 0.01, zt], [x, yBack - dd, zt], [x, yBack - dd, zt - th], [x, yBack + 0.01, zt - th - dd]);
          }
          add.push(hullPts(pts));
        }
      }
      return add;
    }

    // ============ CONTENITORE ============
    function bin(p) {
      const H = GF.UNIT_H * p.altU;
      const lip = !!p.bordo;
      const { solid, W, D, R } = outerBody(p.gridX, p.gridY, H, lip);
      const t = Math.min(p.pareti, lip ? 2.4 : 10);
      const Wi = W - 2 * t, Di = D - 2 * t, Ri = Math.max(0.6, R - t);
      const zF = GF.FOOT_H + p.fondo;
      let cav;
      if (lip) {
        const secs = lipSocket(W, D, R, H);
        const ledge = ((Wi - (W - 5.2)) / 2);
        const zl = H - Math.max(0.01, ledge);
        secs.push(rr(Wi, Di, Ri, zl));
        secs.push(rr(Wi, Di, Ri, zF));
        cav = chain(secs);
      } else {
        cav = slab(Wi, Di, Ri, zF, H + 1);
      }
      let m = sub(solid, cav);
      const feats = interiorFeatures(-Wi / 2, -Di / 2, Wi / 2, Di / 2, zF, H, p, t / 2);
      if (feats.length) m = union([m, ...feats]);
      const holes = magnetHoles(p.gridX, p.gridY, p, 0, +1);
      if (holes.length) m = sub(m, union(holes));
      return {
        parts: [{ name: `Contenitore ${p.gridX}x${p.gridY}x${p.altU}`, m, role: 'body' }],
        info: [
          ['Esterno', `${fmt(W)} × ${fmt(D)} × ${fmt(H + (lip ? GF.LIP_H - 0.15 : 0))} mm`],
          ['Interno', `${fmt(Wi)} × ${fmt(Di)} × ${fmt(H - zF)} mm`],
          ['Vani', `${Math.max(1, p.divX)} × ${Math.max(1, p.divY)}`],
        ],
      };
    }

    // ============ BASE ============
    function baseplate(p) {
      const nx = p.gridX, ny = p.gridY;
      const W = GF.PITCH * nx, D = GF.PITCH * ny;
      const hb = (p.magneti || p.viti) ? Math.max(p.fondoBase, p.magAlt + 0.8) : p.fondoBase;
      const top = hb + 4.65;
      let m = slab(W, D, GF.PLATE_R, 0, top);
      const cavs = [];
      for (const [cx, cy] of cellCenters(nx, ny)) {
        const secs = [
          rr(43, 43, 4.5, top + 0.5, cx, cy),
          rr(42, 42, 4, top, cx, cy),
          rr(37.7, 37.7, 1.85, top - 2.15, cx, cy),
          rr(37.7, 37.7, 1.85, top - 3.95, cx, cy),
          rr(36.3, 36.3, 1.15, top - 4.65, cx, cy),
        ];
        if (hb <= 0.01) secs.push(rr(36.3, 36.3, 1.15, -1, cx, cy));
        cavs.push(chain(secs));
      }
      m = sub(m, union(cavs));
      if (hb > 0.01) {
        const holes = magnetHoles(nx, ny, p, hb, -1);
        if (holes.length) m = sub(m, union(holes));
      }
      return {
        parts: [{ name: `Base ${nx}x${ny}`, m, role: 'body' }],
        info: [
          ['Esterno', `${fmt(W)} × ${fmt(D)} × ${fmt(top)} mm`],
          ['Celle', `${nx * ny}`],
        ],
      };
    }

    // ============ CASSETTIERA ============
    function cabinet(p) {
      const H = GF.UNIT_H * p.altU;
      const lip = !!p.bordo;
      const { solid, W, D, R } = outerBody(p.gridX, p.gridY, H, lip);
      const t = p.pareti, tol = p.tolleranza;
      const zF = GF.FOOT_H + p.fondo;
      const zC = H - p.cielo;
      const Wi = W - 2 * t;
      const yBack = D / 2 - t, yFront = -D / 2;
      const Ri = Math.max(0.5, R - t);
      // cavità: aperta sul davanti
      const cavW = Wi, cavD = (yBack - (yFront - 5));
      let m = sub(solid, slab(cavW, cavD, Ri, zF, zC, 0, (yBack + (yFront - 5)) / 2));
      const rows = Math.max(1, p.righe | 0), cols = Math.max(1, p.colonne | 0);
      const st = p.spRipiani;
      const sw = (Wi - (cols - 1) * st) / cols;
      const sh = (zC - zF - (rows - 1) * st) / rows;
      const adds = [];
      for (let i = 1; i < cols; i++) {
        const x = -Wi / 2 + i * sw + (i - 1) * st;
        adds.push(box(x, yFront, zF - 0.1, x + st, yBack + t / 2, zC + 0.1));
      }
      for (let j = 1; j < rows; j++) {
        const z = zF + j * sh + (j - 1) * st;
        adds.push(box(-Wi / 2 - t / 2, yFront, z, Wi / 2 + t / 2, yBack + t / 2, z + st));
      }
      if (adds.length) m = union([m, ...adds]);
      if (lip) m = sub(m, chain(lipSocket(W, D, R, H)));
      const holes = magnetHoles(p.gridX, p.gridY, p, 0, +1);
      if (holes.length) m = sub(m, union(holes));

      const parts = [{ name: `Cassettiera ${p.gridX}x${p.gridY}x${p.altU}`, m, role: 'body' }];
      // cassetto (uno, poi istanziato)
      const dw = sw - 2 * tol, dh = sh - 2 * tol, dd = (yBack - yFront) - tol;
      const dr = Math.max(0.6, Math.min(Ri - tol, 3));
      let drawer = null;
      if (dw > 8 && dh > 6 && dd > 10) drawer = makeDrawer(dw, dd, dh, dr, p);
      if (drawer) {
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const x = -Wi / 2 + i * (sw + st) + sw / 2;
          const z = zF + j * (sh + st) + tol;
          parts.push({
            name: `Cassetto ${j * cols + i + 1}`, m: drawer.m, role: 'drawer',
            at: [x, yFront + dd / 2, z], size: [dw, dd, dh],
          });
        }
      }
      return {
        parts,
        info: [
          ['Esterno', `${fmt(W)} × ${fmt(D)} × ${fmt(H + (lip ? GF.LIP_H - 0.15 : 0))} mm`],
          ['Vano cassetto', `${fmt(sw)} × ${fmt(yBack - yFront)} × ${fmt(sh)} mm`],
          ['Cassetto', drawer ? `${fmt(dw)} × ${fmt(dd)} × ${fmt(dh)} mm` : 'troppo piccolo'],
          ['Interno cassetto', drawer ? `${fmt(drawer.iw)} × ${fmt(drawer.id)} × ${fmt(drawer.ih)} mm` : '–'],
          ['Cassetti', `${rows * cols}`],
        ],
      };
    }

    // cassetto centrato in x,y con base a z=0; fronte verso -y
    function makeDrawer(w, d, h, r, p) {
      const t = p.cPareti, f = p.cFondo;
      let m = slab(w, d, r, 0, h);
      const iw = w - 2 * t, id = d - 2 * t, ri = Math.max(0.4, r - t);
      m = sub(m, slab(iw, id, ri, f, h + 1));
      const feats = interiorFeatures(-iw / 2, -id / 2, iw / 2, id / 2, f, h,
        { divX: p.cDivX, divY: p.cDivY, spDiv: p.spDiv, scoop: false, etichetta: false }, t / 2);
      if (feats.length) m = union([m, ...feats]);
      const yF = -d / 2;
      if (p.maniglia === 'tacca') {
        const rh = Math.min(10, h * 0.45), hw = Math.min(w * 0.5, 40) / 2;
        const c1 = reg(reg(reg(Manifold.cylinder(t + 2, rh, rh, 40)).rotate([-90, 0, 0])).translate([-hw + rh, yF - 1, h]));
        const c2 = reg(reg(reg(Manifold.cylinder(t + 2, rh, rh, 40)).rotate([-90, 0, 0])).translate([hw - rh, yF - 1, h]));
        m = sub(m, reg(Manifold.hull([c1, c2])));
      } else if (p.maniglia === 'aletta') {
        const hw = Math.min(w * 0.5, 40) / 2, pr = Math.min(9, d * 0.15);
        const zt = Math.max(Math.min(h - 1.5, h * 0.8), 4), th = Math.min(3, zt);
        const pts = [];
        for (const x of [-hw, hw]) pts.push([x, yF + 0.01, zt], [x, yF - pr, zt], [x, yF - pr, zt - th], [x, yF + 0.01, Math.max(0, zt - th - pr)]);
        m = union([m, hullPts(pts)]);
      } else if (p.maniglia === 'pomello') {
        const rk = Math.min(5, h * 0.3), L = 9;
        const knob = reg(reg(reg(Manifold.cylinder(L + 0.5, rk, rk * 0.8, 40)).rotate([90, 0, 0])).translate([0, yF + 0.5, h * 0.55]));
        m = union([m, knob]);
      }
      return { m, iw, id, ih: h - f };
    }

    // profili 2D nel piano (y,z) estrusi lungo x
    const { CrossSection } = wasm;
    const csPoly = (pts) => reg(CrossSection.ofPolygons([pts]));
    const csCircle = (u, v, r, seg = 40) => reg(reg(CrossSection.circle(r, seg)).translate([u, v]));
    const csRect = (u0, v0, u1, v1) => csPoly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    const csUnion = (list) => list.length === 1 ? list[0] : reg(CrossSection.union(list));
    const csSub = (a, b) => reg(a.subtract(b));
    const prismX = (cs, x0, x1) => reg(reg(reg(cs.extrude(x1 - x0)).rotate([90, 0, 90])).translate([x0, 0, 0]));
    const cylX = (y, z, r, x0, x1, seg = 32) => reg(reg(reg(Manifold.cylinder(x1 - x0, r, r, seg)).rotate([0, 90, 0])).translate([x0, y, z]));

    // ============ RACK TELEFONI / TABLET ============
    function rack(p) {
      // spessori delle fessure: lista personalizzata oppure uniformi
      let thick = String(p.spessoriLista || '').split(/[;,\s]+/).map(s => parseFloat(s.replace(',', '.'))).filter(v => isFinite(v) && v > 0);
      const custom = thick.length > 0;
      if (!custom) thick = Array.from({ length: Math.max(1, p.fessure | 0) }, () => p.spessore);
      thick = thick.slice(0, 40).map(v => Math.min(60, Math.max(2, v)));
      const gaps = thick.map(s => s + p.gioco);
      const ft = p.spSep, hs = p.altSep, a = p.inclinazione, ar = a * Math.PI / 180;
      let L = p.lunghezza; const rf = Math.min(p.raccordo, ft * 1.5);
      // posizione radici separatori lungo y
      const ys = [0];
      for (const g of gaps) ys.push(ys[ys.length - 1] + (g + ft) / Math.cos(ar));
      const lean = hs * Math.sin(ar);
      const yMin = ys[0] - ft / 2 - 3, yMax = ys[ys.length - 1] + ft / 2 + lean + 2;
      const needD = yMax - yMin, needW = L + 4;
      const gf = p.base === 'gridfinity';
      let solid, zB, W, D, nx = 0, ny = 0;
      if (gf) {
        nx = Math.max(1, Math.ceil((needW + GF.CLEAR) / GF.PITCH));
        ny = Math.max(1, Math.ceil((needD + GF.CLEAR) / GF.PITCH));
        W = GF.PITCH * nx - GF.CLEAR; D = GF.PITCH * ny - GF.CLEAR;
        L = W - 3;   // i separatori riempiono la larghezza della griglia
        zB = GF.FOOT_H + p.spBase;
        const parts = cellCenters(nx, ny).map(([x, y]) => foot(x, y));
        parts.push(slab(W, D, GF.R_OUT, GF.FOOT_H - 0.01, zB));
        solid = union(parts);
      } else {
        W = needW; D = needD; zB = p.spBase;
        solid = slab(W, D, Math.min(4, W / 4, D / 4), 0, zB);
      }
      const yShift = -(yMin + yMax) / 2;  // centra i separatori sulla base
      const fins = [];
      const nw = L * p.taccaLarg / 100, nd = hs * p.taccaProf / 100;
      for (const y of ys) {
        let f = reg(Manifold.hull([box(-L / 2, -ft / 2, -1, L / 2, ft / 2, hs - ft / 2), cylX(0, hs - ft / 2, ft / 2, -L / 2, L / 2, 24)]));
        if (rf > 0.2) {
          const fil = csSub(csRect(-ft / 2 - rf, -1, ft / 2 + rf, rf), csUnion([csCircle(-ft / 2 - rf, rf, rf, 32), csCircle(ft / 2 + rf, rf, rf, 32)]));
          f = union([f, prismX(fil, -L / 2, L / 2)]);
        }
        if (p.tacca && nw > 4 && nd > 2) {
          const r = Math.min(nw / 2, nd);
          const cz = hs - nd + r;
          const c1 = reg(reg(reg(Manifold.cylinder(ft + 2 * rf + 4, r, r, 40)).rotate([90, 0, 0])).translate([-(nw / 2 - r), ft / 2 + rf + 2, cz]));
          const c2 = reg(reg(reg(Manifold.cylinder(ft + 2 * rf + 4, r, r, 40)).rotate([90, 0, 0])).translate([nw / 2 - r, ft / 2 + rf + 2, cz]));
          const top = box(-nw / 2, -ft / 2 - rf - 2, cz, nw / 2, ft / 2 + rf + 2, hs + 2);
          f = sub(f, reg(Manifold.hull([c1, c2, top])));
        }
        f = reg(reg(f.rotate([-a, 0, 0])).translate([0, y + yShift, zB]));
        fins.push(f);
      }
      let m = union([solid, ...fins]);
      if (gf) {
        const holes = magnetHoles(nx, ny, p, 0, +1);
        if (holes.length) m = sub(m, union(holes));
      } else if (p.piedini) {
        const r = 5.2, ix = W / 2 - 9, iy = D / 2 - 9;
        if (ix > r && iy > r) m = sub(m, union([[-ix, -iy], [ix, -iy], [-ix, iy], [ix, iy]].map(([x, y]) => cylZ(r, -1, 1.2, x, y))));
      }
      const parts = [{ name: `Rack ${gaps.length} fessure`, m, role: 'body', print: p.stampa === 'fianco' ? reg(m.rotate([0, 90, 0])) : m }];
      // dispositivi di esempio (solo anteprima)
      const devH = Math.max(hs / 0.4, hs + 20);
      for (let i = 0; i < gaps.length; i++) {
        const yc = (ys[i] + ys[i + 1]) / 2 + yShift;
        const s = thick[i];
        const dw = Math.min(p.lunghezza, L) - 2;
        const g = reg(reg(box(-dw / 2, -s / 2, 0.3, dw / 2, s / 2, devH).rotate([-a, 0, 0])).translate([0, yc, zB]));
        parts.push({ name: 'esempio', m: g, role: 'ghost' });
      }
      const fmtList = (arr) => arr.map(fmt).join(' · ');
      const info = [
        ['Fessure', `${gaps.length}`],
        ['Larghezza fessure', custom ? fmtList(gaps) + ' mm' : `${fmt(gaps[0])} mm`],
        ['Spessore max dispositivo', custom ? fmtList(thick) + ' mm' : `${fmt(thick[0])} mm (con ${fmt(p.gioco)} mm di gioco)`],
        ['Ingombro', `${fmt(W)} × ${fmt(D)} × ${fmt(zB + hs * Math.cos(ar))} mm`],
      ];
      if (gf) info.push(['Griglia Gridfinity', `${nx} × ${ny}`]);
      info.push(['Separatori', `${fmt(hs)} mm, inclinati ${fmt(a)}°`]);
      info.push(['Lunghezza appoggio', `${fmt(L)} mm`]);
      if (p.stampa === 'fianco') info.push(['Stampa', 'sul fianco (separatori più robusti)']);
      const maxDim = p.stampa === 'fianco' ? Math.max(D, zB + hs, L) : Math.max(W, D);
      if (maxDim > 250) info.push(['Nota', `Lato di ${fmt(maxDim)} mm: controlla che stia nel piatto`]);
      return { parts, info };
    }

    // ============ VASI ============
    function sect(shape, w, d, r, z) {
      if (shape === 'tondo') {
        const n = 96, R = w / 2, pts = [];
        for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; pts.push([R * Math.cos(a), R * Math.sin(a), z]); }
        return pts;
      }
      if (shape === 'esagonale') {
        const R = w / Math.sqrt(3), pts = [];
        for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push([R * Math.cos(a), R * Math.sin(a), z]); }
        return pts;
      }
      if (shape === 'quadrato') return rr(w, w, r, z);
      return rr(w, d, r, z);
    }

    function pot(p) {
      const shape = p.forma;
      const H = p.altezza, k = p.base / 100, t = p.pareti, f = p.fondo, tol = p.tolleranza;
      const wT = p.larghezza, dT = shape === 'rettangolare' ? p.profondita : (shape === 'quadrato' ? wT : wT);
      const rT = Math.min(p.raggio, wT / 2 - 1, dT / 2 - 1);
      const wAt = (z) => wT * (k + (1 - k) * z / H), dAt = (z) => dT * (k + (1 - k) * z / H), rAt = (z) => Math.max(0.5, rT * (k + (1 - k) * z / H));
      const alpha = Math.atan(((wT - wT * k) / 2) / H);
      const th = t / Math.cos(alpha);
      const S = (z, inset = 0) => sect(shape, wAt(z) - 2 * inset, dAt(z) - 2 * inset, Math.max(0.5, rAt(z) - inset), z);
      const ncomp = shape === 'rettangolare' ? Math.max(1, p.scomparti | 0) : 1;
      const warn = [];
      const auto = p.tipo === 'autoirrigante';

      // ---- vaso esterno ----
      let outer = loft(S(0), S(H));
      if (p.bordo) {
        const zr0 = H - 8;
        outer = union([outer, hullPts([...S(zr0 - 2, 0), ...S(zr0, -2), ...S(H, -2)])]);
      }
      const cavity = loft(S(f, th), S(H + 1, th));
      let vaso = sub(outer, cavity);
      // divisori (fioriera)
      const innerW = (z) => wAt(z) - 2 * th;
      const compX = (j, z) => { const W = innerW(z); const cw = (W - (ncomp - 1) * p.spDiv) / ncomp; return { x0: -W / 2 + j * (cw + p.spDiv), cw }; };
      if (ncomp > 1 && !auto) {
        const divs = [];
        for (let j = 1; j < ncomp; j++) { const c = compX(j, H); divs.push(box(c.x0 - p.spDiv, -dT, f - 0.1, c.x0, dT, H - 3)); }
        vaso = union([vaso, reg(union(divs).intersect(outer))]);
      }
      const parts = [];
      const info = [];
      const ml = (v) => v >= 1000000 ? `${fmt(v / 1000000)} L` : `${Math.round(v / 1000)} ml`;

      if (!auto) {
        // fori di drenaggio + canali
        const holes = [], chans = [];
        const zh = f;
        for (let j = 0; j < ncomp; j++) {
          const c = compX(j, zh);
          const cx = c.x0 + c.cw / 2;
          const hx = c.cw / 2, hy = (shape === 'rettangolare' ? dAt(zh) - 2 * th : innerW(zh)) / 2;
          const ring = 0.5 * Math.min(hx, hy);
          const pts = [[cx, 0]];
          const n = Math.max(1, p.nFori | 0);
          for (let i = 0; i < n - 1; i++) { const a = 2 * Math.PI * i / (n - 1) + Math.PI / 4; pts.push([cx + ring * Math.cos(a), ring * Math.sin(a)]); }
          for (const [x, y] of (p.fori ? pts : [])) holes.push(cylZ(p.diamFori / 2, -1, f + 1, x, y, 24));
          if (p.canali && p.fori) {
            const depth = Math.min(1.6, f - 0.8);
            const dirs = n > 1 ? pts.slice(1).map(([x, y]) => Math.atan2(y, x - cx)) : [0, Math.PI / 2, Math.PI, -Math.PI / 2];
            for (const a of dirs) {
              const L = Math.max(wT, dT);
              const bar = reg(reg(box(0, -2, -1, L, 2, depth).rotate([0, 0, a * 180 / Math.PI])).translate([cx, 0, 0]));
              chans.push(bar);
            }
          }
        }
        if (holes.length) vaso = sub(vaso, union(holes));
        if (chans.length) vaso = sub(vaso, union(chans));
        const lift = p.sottovaso ? p.fondoSv + 3 : 0;
        parts.push({ name: 'Vaso', m: vaso, role: 'body', at: lift ? [0, 0, lift] : null });
        if (p.sottovaso) {
          const m = p.margineSv, hs = p.altSv, ts = Math.max(1.6, t), fs = p.fondoSv;
          const wb = wAt(0) + 2 * (m + ts), db = dAt(0) + 2 * (m + ts), rb = rAt(0) + m + ts;
          const fl = hs * 0.12;
          const so = hullPts([...sect(shape, wb, db, rb, 0), ...sect(shape, wb + 2 * fl, db + 2 * fl, rb + fl, hs)]);
          const si = hullPts([...sect(shape, wb - 2 * ts, db - 2 * ts, Math.max(0.5, rb - ts), fs), ...sect(shape, wb + 2 * fl - 2 * ts, db + 2 * fl - 2 * ts, Math.max(0.5, rb + fl - ts), hs + 1)]);
          let sv = sub(so, si);
          // rialzi: il vaso appoggia sopra e l'acqua scorre sotto
          const ribs = [];
          if (shape === 'rettangolare') {
            const nr = Math.max(2, Math.round(wAt(0) / 30));
            for (let i = 0; i < nr; i++) { const x = -wAt(0) / 2 + 10 + (wAt(0) - 20) * i / (nr - 1); ribs.push(box(x - 1.2, -db, fs - 0.1, x + 1.2, db, fs + 3)); }
          } else {
            for (let i = 0; i < 6; i++) ribs.push(reg(reg(box(wAt(0) * 0.12, -1.2, fs - 0.1, wAt(0) * 0.48, 1.2, fs + 3).rotate([0, 0, i * 60])).translate([0, 0, 0])));
          }
          sv = union([sv, reg(union(ribs).intersect(si))]);
          parts.push({ name: 'Sottovaso', m: sv, role: 'saucer' });
          info.push(['Sottovaso', `${fmt(wb + 2 * fl)} × ${fmt(shape === 'rettangolare' ? db + 2 * fl : wb + 2 * fl)} × ${fmt(hs)} mm`]);
        }
        info.unshift(['Terra (circa)', ml(reg(cavity.intersect(box(-1e4, -1e4, 0, 1e4, 1e4, H - 5))).volume())]);
      } else {
        // ---- autoirrigante: vaso esterno = riserva, vaso interno a fondo piatto, cestelli pescanti separati ----
        const g = tol + 0.7;
        const rw = p.pescante / 2, tb = 1.6;
        const zwb = f + 2;                                   // fondo del cestello, 2 mm sopra il fondo
        const Sin = (z, extra = 0) => S(z, th + g + extra);  // superficie esterna vaso interno
        let zr = f + p.riserva;                              // fondo del vaso interno
        if (zr > H - 25) { zr = Math.max(f + 10, H - 25); warn.push(`Riserva ridotta a ${fmt(zr - f)} mm: serve spazio per la terra`); }
        const ft = 2;      // flangia appoggiata sul bordo
        const fondoI = Math.max(1.6, t);
        let inner = union([loft(Sin(zr), Sin(H)), loft(S(H, 0).map(([x, y]) => [x, y, H]), S(H, 0).map(([x, y]) => [x, y, H + ft]))]);
        inner = sub(inner, loft(Sin(zr + fondoI, th), Sin(H + ft + 1, th)));
        // centri dei cestelli
        const Wo = wAt(zr) - 2 * (th + g);
        const cxs = Array.from({ length: ncomp }, (_, j) => ncomp === 1 ? 0 : -Wo / 2 + (j + 0.5) * Wo / ncomp);
        if (ncomp > 1) {
          const divs = [];
          for (let j = 1; j < ncomp; j++) { const x = -Wo / 2 + j * Wo / ncomp; divs.push(box(x - p.spDiv / 2, -dT, zr + 0.5, x + p.spDiv / 2, dT, H - 3)); }
          inner = union([inner, reg(union(divs).intersect(loft(Sin(zr), Sin(H))))]);
        }
        const rHole = rw + tb + tol / 2 + 0.2;
        const holesI = cxs.map(cx => cylZ(rHole, zr - 1, zr + fondoI + 1, cx, 0, 48));
        // piccoli fori di aerazione/drenaggio nel fondo
        for (const cx of cxs) for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, rr2 = rHole + 9; holesI.push(cylZ(2, zr - 1, zr + fondoI + 1, cx + rr2 * Math.cos(a), rr2 * Math.sin(a), 16)); }
        inner = sub(inner, union(holesI));
        // tubo di riempimento
        if (p.tubo) {
          const ro = 6, ri = 4.5;
          let tx, ty;
          if (shape === 'tondo' || shape === 'esagonale') { tx = 0; ty = (wAt(zr) / 2 - th - g - th - ro - 0.5) * (shape === 'esagonale' ? 0.97 : 1); }
          else { tx = -(wAt(zr) / 2 - th - g - th - ro - 0.5 - rAt(zr) * 0.3); ty = dAt(zr) / 2 - th - g - th - ro - 0.5 - rAt(zr) * 0.3; }
          inner = union([inner, cylZ(ro, zr, H + ft, tx, ty, 32)]);
          inner = sub(inner, cylZ(ri, zr - 1, H + ft + 1, tx, ty, 32));
        }
        // cestello pescante: cilindro forato con flangia, si infila dall'alto nel foro
        const L = (zr + fondoI) - zwb;
        let cest = union([cylZ(rw + tb, 0, L, 0, 0, 48), cylZ(rw + tb + 3, L, L + 1.6, 0, 0, 48)]);
        cest = sub(cest, cylZ(rw, 1.6, L + 2, 0, 0, 48));
        const sl = [];
        const slotH = L - 6;
        if (slotH > 3) for (let i = 0; i < 8; i++) sl.push(reg(reg(box(rw - 1, -1, 3, rw + tb + 1, 1, 3 + slotH).rotate([0, 0, i * 45]))));
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; sl.push(cylZ(1.5, -1, 2.6, rw * 0.5 * Math.cos(a), rw * 0.5 * Math.sin(a), 16)); }
        cest = sub(cest, union(sl));
        // troppo pieno: subito sotto il fondo del vaso interno
        const zo = zr - 3;
        if (p.troppoPieno && zo > f + 3) {
          const hole = reg(reg(reg(Manifold.cylinder(Math.max(wT, dT), 2.5, 2.5, 20)).rotate([90, 0, 0])).translate([0, 0, zo]));
          vaso = sub(vaso, hole);
        }
        parts.push({ name: 'Vaso esterno (riserva)', m: vaso, role: 'body' });
        parts.push({ name: 'Vaso interno', m: inner, role: 'inner' });
        cxs.forEach((cx, j) => parts.push({ name: `Cestello pescante ${j + 1}`, m: cest, role: 'latch', at: [cx, 0, zwb], print: reg(cest.rotate([180, 0, 0])) }));
        // volumi
        const soilV = reg(loft(Sin(zr + fondoI, th), Sin(H - 5, th))).volume();
        const wl = p.troppoPieno ? zo : zr;
        const water = reg(cavity.intersect(box(-1e4, -1e4, 0, 1e4, 1e4, wl))).volume() - ncomp * Math.PI * (rw + tb) ** 2 * Math.max(0, wl - zwb);
        info.push(['Terra (circa)', ml(soilV)]);
        info.push(['Riserva d\'acqua', `${ml(water)}${p.troppoPieno ? ' (fino al troppo pieno)' : ''}`]);
        info.push(['Altezza riserva', `${fmt(zr - f)} mm`]);
        info.push(['Cestello pescante', `Ø ${fmt(2 * (rw + tb))} × ${fmt(L + 1.6)} mm (${ncomp})`]);
        const clash = reg(inner.intersect(vaso)).volume();
        if (clash > 0.5) warn.push('Il vaso interno tocca quello esterno: aumenta la tolleranza');
      }
      const ext = shape === 'rettangolare' ? `${fmt(wT + (p.bordo ? 4 : 0))} × ${fmt(dT + (p.bordo ? 4 : 0))}` : `${fmt(wT + (p.bordo ? 4 : 0))}`;
      info.push(['Bocca', shape === 'tondo' ? `Ø ${ext} mm` : `${ext} mm`]);
      info.push(['Altezza', `${fmt(H)} mm`]);
      if (ncomp > 1) info.push(['Scomparti', `${ncomp}`]);
      info.push(['Per tenere l\'acqua', auto ? 'almeno 3 perimetri, meglio PETG' : 'sottovaso con almeno 3 perimetri']);
      for (const w of warn) info.push(['Nota', w]);
      return { parts, info };
    }

    function fmt(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }

    // estrai mesh (Float32Array posizioni, Uint32Array triangoli)
    function meshOf(m) {
      const mesh = m.getMesh();
      const np = mesh.numProp;
      const n = mesh.vertProperties.length / np;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = mesh.vertProperties[i * np]; pos[i * 3 + 1] = mesh.vertProperties[i * np + 1]; pos[i * 3 + 2] = mesh.vertProperties[i * np + 2]; }
      return { pos, tri: new Uint32Array(mesh.triVerts) };
    }

    function build(kind, p) {
      try {
        const res = kind === 'bin' ? bin(p) : kind === 'base' ? baseplate(p) : kind === 'rack' ? rack(p) : kind === 'vaso' ? pot(p) : cabinet(p);
        if (p.__check) {
          res.check = [];
          const placed = res.parts.map(q => q.at ? reg(q.m.translate(q.at)) : q.m);
          for (let i = 0; i < res.parts.length; i++) for (let j = i + 1; j < res.parts.length; j++) {
            if (res.parts[i].role === 'ghost' || res.parts[j].role === 'ghost') continue;
            const v = reg(placed[i].intersect(placed[j])).volume();
            res.check.push([res.parts[i].name, res.parts[j].name, +v.toFixed(3)]);
          }
          if (res.hinge) {
            const bodyM = res.parts[0].m;
            for (const a of [5, 20, 45, 90, 120, 150]) {
              for (const part of res.parts.filter(q => q.pivot)) {
                const rm = reg(reg(reg(part.m.translate([0, -res.hinge.y, -res.hinge.z])).rotate([-a, 0, 0])).translate([0, res.hinge.y, res.hinge.z]));
                const v = reg(rm.intersect(bodyM)).volume();
                if (v > 0.001) res.check.push(['open ' + a, part.name, +v.toFixed(3)]);
              }
            }
          }
        }
        const cache = new Map();
        const get = (m) => {
          if (!cache.has(m)) {
            const bb = m.boundingBox();
            cache.set(m, { ...meshOf(m), min: bb.min, max: bb.max, volume: m.volume(), status: m.status(), genus: m.genus() });
          }
          return cache.get(m);
        };
        for (const part of res.parts) {
          part.mesh = get(part.m);
          part.printMesh = part.print ? get(part.print) : part.mesh;
          delete part.m; delete part.print;
        }
        return res;
      } finally { cleanup(); }
    }

    return { build, GF };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createGeom };
  else root.createGeom = createGeom;
})(typeof globalThis !== 'undefined' ? globalThis : this);

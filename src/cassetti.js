// Cassetti modulari a mattoncino: moduli impilabili come i Lego, con un cassetto che scorre su due guide e i separatori.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm: x larghezza, y profondità (fronte verso -y), z altezza.
// Tutto senza supporti:
// - il modulo si stampa sdraiato sulla schiena (pareti, guide e gonna verticali; cavità e fori con la chiave piatta verso l'alto di stampa);
// - i bottoncini si stampano a parte, in piedi, e si avvitano nei fori filettati del cielo;
// - sotto, la gonna cava e le cavità tonde ricevono i bottoncini del modulo di sotto.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function cassetti(H) {
    const { Manifold, reg, union, sub, box, cylZ, coneZ, hullPts, fmt } = H;
    const CIELO = 4;      // spessore del cielo: ci si avvita il gambo del bottoncino
    const FONDO = 7;      // piastra del fondo, sopra la gonna
    const GONNA = 7;      // altezza della gonna cava sotto il modulo
    const INCAVO = 5;     // profondità delle cavità tonde nella piastra del fondo
    const GUIDA = 1.75;   // sporgenza delle guide sui fianchi interni

    // posizioni a passo fisso centrate nel vano (almeno `m` mm dalle pareti)
    function slots(span, pitch, m) {
      const n = Math.max(0, Math.floor((span - 2 * m) / pitch + 1e-6));
      const out = [];
      for (let i = 0; i <= n; i++) out.push((i - n / 2) * pitch);
      return span - 2 * m >= 0 ? out : [];
    }
    // k posizioni prese dalla lista, distribuite il più uniformemente possibile
    function spread(list, k) {
      if (k >= list.length) return list.slice();
      const out = [];
      for (let i = 0; i < k; i++) out.push(list[Math.round((i + 1) * (list.length + 1) / (k + 1)) - 1]);
      return [...new Set(out)];
    }
    // foro tondo lungo z con la chiave piatta verso -y (in stampa, col modulo sulla schiena, -y è l'alto): il cielo del foro è un ponte corto
    function keyhole(r, kw, ext, z0, z1, x, y) {
      return hullPts([cylZ(r, z0, z1, x, y, 72), box(x - kw / 2, y - r - ext, z0, x + kw / 2, y - r - ext + 0.01, z1)]);
    }
    // separatore stampato in piano: lungo L (x), alto hp (y), spesso th (z); tacche a mezza altezza dove si incrocia,
    // angoli sotto smussati a 45° per stare sopra il raccordo del cassetto
    function plate(L, hp, th, notches, fromTop, s, rc) {
      const c = Math.min(rc, hp / 2, L / 4);
      const corner = (sx) => hullPts([[sx * (L / 2 + 1), -1, -1], [sx * (L / 2 + 1), c, -1], [sx * (L / 2 - c - 1), -1, -1],
        [sx * (L / 2 + 1), -1, th + 1], [sx * (L / 2 + 1), c, th + 1], [sx * (L / 2 - c - 1), -1, th + 1], [sx * (L / 2 + 1), c + 1, -1], [sx * (L / 2 + 1), c + 1, th + 1]]);
      const cuts = [corner(-1), corner(1)];
      if (notches.length) for (const x of notches.filter(x => Math.abs(x) < L / 2 - c - s)) cuts.push(fromTop
        ? box(x - s / 2, hp / 2 - 0.1, -1, x + s / 2, hp + 1, th + 1)
        : box(x - s / 2, -1, -1, x + s / 2, hp / 2 + 0.1, th + 1));
      return sub(box(-L / 2, 0, 0, L / 2, hp, th), union(cuts));
    }

    function lego(p) {
      const U = +p.unita, nx = Math.max(1, p.larghezza | 0), ny = Math.max(1, p.profondita | 0);
      const W = nx * U, D = ny * U, Hm = +p.altezza, t = +p.pareti;
      const notes = [];
      let ds = +p.diamBott;
      if (ds > U - 2 * t - 4) { ds = U - 2 * t - 4; notes.push(`~Bottoncini ridotti a ${fmt(ds)} mm: devono stare dentro la gonna del modulo di sopra`); }
      const gI = +p.giocoIncastro, gT = +p.viteGioco, rS = ds / 2 + gI / 2;
      const hs = GONNA + INCAVO - 0.6;                                   // testa del bottoncino: entra in gonna + cavità con 0,6 mm d'aria
      const sp = { D: Math.round(ds * 0.587 * 10) / 10, P: Math.max(2, Math.round(ds / 10)) };   // filetto grosso, come nel modello Pork3D (Ø 17,6 passo 3 sul bottoncino da 30)
      const rCore = sp.D / 2 - 0.8;                                      // anima piena: il filetto sporge solo 0,8 mm, come nell'originale
      const Ls = CIELO - 0.6;
      const zF = GONNA + FONDO, zC = Hm - CIELO;                         // pavimento e soffitto del vano
      const xI = W / 2 - t, yF = -D / 2, yB = D / 2 - t;
      const zc = (zF + zC) / 2, rb = Math.min(10, (zC - zF) / 4);         // centro e mezza base delle guide
      if (zC - zF < 15) notes.push('Il vano è troppo basso: aumenta l\'altezza del modulo.');

      // ---- modulo ----
      const cx = [], cy = [];
      for (let i = 0; i < nx; i++) cx.push((i - (nx - 1) / 2) * U);
      for (let j = 0; j < ny; j++) cy.push((j - (ny - 1) / 2) * U);
      const solid = [box(-W / 2, -D / 2, 0, W / 2, D / 2, Hm)];
      // guide: trapezio a 45° sui fianchi interni, per tutta la profondità del vano
      for (const sx of [-1, 1]) {
        const x0 = sx * (xI + 0.01), x1 = sx * (xI - GUIDA), pts = [];
        for (const y of [yF, yB + 0.01]) pts.push([x0, y, zc - rb], [x0, y, zc + rb], [x1, y, zc - rb + GUIDA], [x1, y, zc + rb - GUIDA]);
        solid.push(hullPts(pts));
      }
      const cuts = [box(-xI, yF - 1, zF, xI, yB, zC)];
      // gonna cava sotto: fianchi dritti, davanti e dietro smussati a 45° (in stampa il davanti è in alto e non fa ponte)
      const gi = t + GONNA;
      cuts.push(hullPts([box(-xI, -D / 2 + t - 1, -1, xI, D / 2 - t + 1, -0.99), box(-xI, -D / 2 + gi, GONNA - 0.01, xI, D / 2 - gi, GONNA)]));
      const hole = union([reg(H.vite.rod(sp, CIELO + 1, gT / 2, false, 0.5).translate([0, 0, Hm - CIELO - 0.5])), cylZ(rCore + gT / 2, Hm - CIELO - 0.5, Hm + 0.5, 0, 0, 96)]);
      const rKey = rCore + gT / 2;
      for (const x of cx) for (const y of cy) {
        cuts.push(keyhole(rS, Math.min(14, rS), 1.8, -1, GONNA + INCAVO, x, y));   // cavità per il bottoncino del modulo sotto (taglia anche lo smusso della gonna)
        cuts.push(reg(hole.translate([x, y, 0])), keyhole(rKey, Math.min(6, sp.D / 3), 1.2, Hm - CIELO - 0.5, Hm + 0.5, x, y));
      }
      const body = sub(union(solid), union(cuts));
      const parts = [{ name: `Modulo ${nx}×${ny}`, m: body, role: 'body', print: reg(body.rotate([-90, 0, 0])) }];
      const info = [
        ['Modulo', `${fmt(W)} × ${fmt(D)} × ${fmt(Hm)} mm (${nx} × ${ny} unità da ${fmt(U)} mm)`],
        ['Vano', `${fmt(2 * xI)} × ${fmt(yB - yF)} × ${fmt(zC - zF)} mm, guide sui fianchi`],
      ];

      // ---- bottoncini: testa Ø ds alta hs (smusso in cima), gambo filettato sotto ----
      const c = -gT / 2, r0 = rCore + c - 0.5;
      let rod = union([reg(H.vite.rod(sp, Ls + 0.5, c, false, 0.5).translate([0, 0, -Ls])), cylZ(rCore + c, -Ls, 0.5, 0, 0, 96)]);
      rod = reg(rod.intersect(coneZ(r0, r0 + Ls + 2, -Ls, 2, 96)));
      const st = union([hullPts([cylZ(ds / 2, 0, hs - 1, 0, 0, 96), cylZ(ds / 2 - 1, hs - 0.01, hs, 0, 0, 96)]), rod]);
      // nell'anteprima giro il bottoncino finché il suo filetto combacia con quello del foro
      const probe = sub(cylZ(sp.D, -CIELO, 0, 0, 0, 48), reg(hole.translate([0, 0, -Hm])));
      let stA = st, best = Infinity;
      for (let k = 0; k < 24; k++) {
        const r = reg(st.rotate([0, 0, k * 15])), v = reg(r.intersect(probe)).volume();
        if (v < best - 1e-6) { best = v; stA = r; }
      }
      const nS = cx.length * cy.length, cols = Math.ceil(Math.sqrt(nS)), step = ds + 4, flipS = reg(st.rotate([180, 0, 0]));
      const placed = [], flat = [];
      for (const x of cx) for (const y of cy) placed.push(reg(stA.translate([x, y, Hm])));
      for (let k = 0; k < nS; k++) flat.push(reg(flipS.translate([(k % cols) * step, Math.floor(k / cols) * step, 0])));
      parts.push({ name: `Bottoncini (${nS} pezzi)`, m: union(placed), role: 'pin', print: union(flat) });

      // ---- cassetto ----
      const gd = +p.giocoCassetto, ct = +p.cPareti, ts = ct + GUIDA + 0.6;   // fianchi più spessi: c'è la scanalatura per la guida
      const dw = 2 * xI - 2 * gd, dh = zC - zF - 2 * gd, dd = yB - yF - gd;
      const nT = p.separatori === 'nessuno' ? 0 : Math.max(0, p.sepTrasv | 0), nL = p.separatori === 'nessuno' ? 0 : Math.max(0, p.sepLong | 0);
      if (dw > 20 && dh > 10 && dd > 20) {
        const iw = dw - 2 * ts, id = dd - 2 * ct, f = ct, R = Math.max(0.5, Math.min(+p.raccordo, iw / 4, id / 4, (dh - f) / 2));
        let dm = box(-dw / 2, -dd / 2, 0, dw / 2, dd / 2, dh);
        const cav = [];
        for (const x of [-iw / 2 + R, iw / 2 - R]) for (const y of [-id / 2 + R, id / 2 - R]) cav.push(reg(reg(Manifold.sphere(R, 48)).translate([x, y, f + R])), cylZ(R, f + R, dh + 1, x, y, 48));
        const dcuts = [hullPts(cav)];
        // scanalature sui fianchi: la guida entra con 0,25 mm di gioco sopra e sotto e 0,35 in fondo
        const zg = zc - zF - gd, a = rb - GUIDA + 0.25, gdp = GUIDA - gd + 0.35;
        for (const sx of [-1, 1]) {
          const xo = sx * (dw / 2 + 1), xi = sx * (dw / 2 - gdp), pts = [];
          for (const y of [-dd / 2 - 1, dd / 2 + 1]) pts.push([xo, y, zg - a - gdp - 1], [xo, y, zg + a + gdp + 1], [xi, y, zg - a], [xi, y, zg + a]);
          dcuts.push(hullPts(pts));
        }
        // tacca tonda per le dita nel frontale: larga 2 rw, profonda quanto chiesto (il fondo è un arco)
        const rw = Math.min(15, dw * 0.2), tp = p.maniglia === 'tacca' ? Math.min(+p.taccaProf, dh - f - 2) : 0;
        const tacca = tp > 0 ? reg(hullPts([reg(reg(reg(Manifold.cylinder(ct + 2, rw, rw, 64)).rotate([-90, 0, 0])).translate([0, -dd / 2 - 1, dh - tp + rw])), box(-rw, -dd / 2 - 1, dh + 1, rw, -dd / 2 + ct + 1, dh + 2)])
          .intersect(box(-rw - 1, -dd / 2 - 2, dh - tp, rw + 1, -dd / 2 + ct + 2, dh + 3))) : null;
        dm = sub(dm, union(dcuts));
        const at = [0, yF + dd / 2, zF + gd], size = [dw, dd, dh];
        if (nT || nL) {
          const removable = p.separatori === 'estraibili';
          const s = +p.spDiv + (removable ? 0.3 : 0), rt = 0.8, rp = 1.2, pitch = +p.passo, th = +p.spDiv;
          const even = (span, n) => [...Array(n)].map((_, i) => -span / 2 + span * (i + 1) / (n + 1));
          const yT = nT ? (removable ? slots(id, pitch, R + 4) : even(id, nT)) : [];
          const xLg = nL ? (removable ? slots(iw, pitch, R + 4) : even(iw, nL)) : [];
          if (removable) {   // scanalature: coppie di costole verticali sulle pareti interne
            const ribs = [], pair = (q) => [[q - s / 2 - rt, q - s / 2], [q + s / 2, q + s / 2 + rt]];
            for (const y of yT) for (const [y0, y1] of pair(y)) ribs.push(box(-iw / 2 - 0.01, y0, f - 0.01, -iw / 2 + rp, y1, dh), box(iw / 2 - rp, y0, f - 0.01, iw / 2 + 0.01, y1, dh));
            for (const x of xLg) for (const [x0, x1] of pair(x)) {
              if (!tacca || Math.abs(x) > rw + s / 2 + rt + 1) ribs.push(box(x0, -id / 2 - 0.01, f - 0.01, x1, -id / 2 + rp, dh));   // sul frontale, non dentro la tacca
              ribs.push(box(x0, id / 2 - rp, f - 0.01, x1, id / 2 + 0.01, dh));
            }
            if (ribs.length) dm = union([dm, ...ribs]);
          }
          const hp = dh - f - (removable ? 0.8 : 0), both = yT.length && xLg.length;
          const fixedM = [];
          const mk = (L, notchAt, fromTop, count, positions, alongY, label) => {
            if (!count || !positions.length) return;
            const pl = plate(L, hp, th, both ? notchAt : [], fromTop, s, R + 0.3);
            const up = reg(pl.rotate([90, 0, 0]));   // in piedi: l'altezza va su z, lo spessore verso -y
            const use = removable ? spread(positions, count) : positions;
            const inDrawer = union(use.map(v => alongY
              ? reg(reg(reg(up.translate([0, th / 2, f])).rotate([0, 0, 90])).translate([v, 0, 0]))
              : reg(up.translate([0, v + th / 2, f]))));
            if (!removable) { fixedM.push(inDrawer); return; }
            const flatP = union(use.map((_, i) => reg(pl.translate([0, i * (hp + 4), 0]))));
            parts.push({ name: `Separatori ${label} (${use.length})`, m: inDrawer, role: 'drawer', print: flatP, at, size });
            if (use.length < count) notes.push(`~Separatori ${label}: c'è posto per ${positions.length} scanalature, ne stampo ${use.length}`);
          };
          mk(iw - (removable ? 0.5 : -0.2), xLg, true, nT, yT, false, 'trasversali');
          mk(id - (removable ? 0.5 : -0.2), yT, false, nL, xLg, true, 'longitudinali');
          if (fixedM.length) dm = union([dm, ...fixedM]);
          if (removable && both) info.push(['Incroci', `ogni separatore ha una tacca a ogni scanalatura (passo ${fmt(pitch)} mm): li sposti dove vuoi e si incrociano sempre`]);
        }
        if (tacca) dm = sub(dm, tacca);
        parts.splice(2, 0, { name: 'Cassetto', m: dm, role: 'drawer', at, size });
        info.push(['Cassetto', `${fmt(dw)} × ${fmt(dd)} × ${fmt(dh)} mm, interno ${fmt(iw)} × ${fmt(id)} × ${fmt(dh - f)} mm`]);
      } else info.push(['Cassetto', 'troppo piccolo']);
      info.push(['Bottoncini', `${nS}, Ø ${fmt(ds)} × ${fmt(hs)} mm, gambo Ø ${fmt(2 * rCore)} con filetto fino a Ø ${fmt(sp.D)}, passo ${fmt(sp.P)}: si avvitano a mano nel cielo. Sul modulo in cima puoi non metterli`]);
      info.push(['Stampa', 'Modulo sdraiato sulla schiena, bottoncini con la testa sul piatto, cassetto sul fondo, separatori in piano: niente supporti']);
      info.push(['Prova', 'Se il bottoncino entra duro nella cavità aumenta il gioco dell\'incastro, se si avvita duro il gioco del filetto']);
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info, view: [-0.6, -1, 0.75] };
    }

    return { lego };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

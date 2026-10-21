// Cassetti modulari a mattoncino: moduli impilabili come i Lego, con un cassetto e i separatori.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm: x larghezza, y profondità (fronte verso -y), z altezza.
// Modello nostro, fatto per usare poca plastica e stampare tutto dritto, senza supporti:
// - la vaschetta (fondo, fianchi e schiena, davanti aperto) si stampa sul fondo; sotto ha i fori tondi per i bottoncini;
// - il coperchio è una piastra che si stampa piatta con i bottoncini pieni sopra; entra fra le pareti e poggia su un
//   battente a 45°; a scatto (un dentino sulle pareti) oppure da incollare;
// - i bottoncini del coperchio entrano nei fori del fondo del modulo di sopra.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function cassetti(H) {
    const { Manifold, reg, union, sub, box, cylZ, hullPts, fmt } = H;
    const GUIDA = 1.75;   // sporgenza delle guide sui fianchi interni (se ci sono)
    const LED = 2;        // larghezza del battente che regge il coperchio
    const SMU = 1;        // smusso del bordo del coperchio (a scatto): il dentino delle pareti ci si aggancia sopra

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
    // prisma lungo una parete: profilo [u (verso l'interno), z] estruso lungo la parete; side: 'sx', 'dx' o 'dietro'
    function along(side, prof, xI, y0, yB) {
      const pts = [];
      for (const [u, z] of prof) {
        if (side === 'dietro') pts.push([-xI, yB - u, z], [xI, yB - u, z]);
        else { const sx = side === 'sx' ? -1 : 1; pts.push([sx * (xI - u), y0, z], [sx * (xI - u), yB, z]); }
      }
      return hullPts(pts);
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
      const W = nx * U, D = ny * U, Hm = +p.altezza, t = +p.pareti, tl = +p.cielo;
      const notes = [];
      const gI = +p.giocoIncastro, gc = +p.giocoCoperchio, hb = +p.altBott, snap = p.fissaggio !== 'colla', smu = Math.min(SMU, tl - 0.4);
      // bottoncino: deve stare nella sua unità, lontano dalle pareti
      let ds = +p.diamBott;
      const dMax = U - 2 * t - 4;
      if (ds > dMax) { ds = Math.floor(dMax * 2) / 2; notes.push(`~Bottoncini ridotti a ${fmt(ds)} mm: devono stare nella loro unità`); }
      const tf = hb + 0.4;                                                 // fondo: il bottoncino del modulo sotto ci entra e resta 0,4 mm più basso
      const xI = W / 2 - t, yB = D / 2 - t, y0 = -D / 2;
      const zL = Hm - tl;                                                  // il coperchio poggia qui, sul battente
      const zF = tf, zC = zL - LED;                                        // pavimento e soffitto del vano (sotto il battente)
      const guide = p.guide === 'si';
      const zc = (zF + zC) / 2, rb = Math.min(10, (zC - zF) / 4);         // centro e mezza base delle guide
      if (zC - zF < 15) notes.push('Il vano è troppo basso: aumenta l\'altezza del modulo.');
      const cx = [], cy = [];
      for (let i = 0; i < nx; i++) cx.push((i - (nx - 1) / 2) * U);
      for (let j = 0; j < ny; j++) cy.push((j - (ny - 1) / 2) * U);

      // ---- vaschetta: stampata sul fondo; il battente a 45° e il dentino crescono dalla parete ----
      const sides = ['sx', 'dx', 'dietro'];
      const add = sides.map(sd => along(sd, [[0, zL - LED], [0, zL], [LED, zL]], xI, y0, yB));
      // dentino a scatto: sopra il bordo smussato del coperchio, sporge b verso l'interno, sopra e sotto a 45°
      const bd = smu / 2;
      if (snap) for (const sd of sides) add.push(along(sd, [[0, Hm - smu], [bd, Hm - bd], [0, Hm]], xI, y0, yB));
      const holes = [];
      for (const x of cx) for (const y of cy) holes.push(cylZ(ds / 2 + gI / 2, -1, tf + 1, x, y, 96));
      const tray = sub(union([sub(box(-W / 2, y0, 0, W / 2, D / 2, Hm), box(-xI, y0 - 1, tf, xI, yB, Hm + 1)), ...add,
        ...(guide ? [-1, 1].map(sx => {   // guide: trapezio a 45° sui fianchi interni, per tutta la profondità del vano
          const x0 = sx * (xI + 0.01), x1 = sx * (xI - GUIDA), pts = [];
          for (const y of [y0, yB + 0.01]) pts.push([x0, y, zc - rb], [x0, y, zc + rb], [x1, y, zc - rb + GUIDA], [x1, y, zc + rb - GUIDA]);
          return hullPts(pts);
        }) : [])]), union(holes));
      const parts = [{ name: `Vaschetta ${nx}×${ny}`, m: tray, role: 'body' }];

      // ---- coperchio: piastra fra le pareti con i bottoncini pieni sopra; a scatto il bordo è smussato sotto il dentino ----
      const lx = xI - gc, ly0 = y0, ly1 = yB - gc;
      let lid = box(-lx, ly0, zL, lx, ly1, Hm);
      if (snap) lid = sub(lid, union([
        hullPts([[-lx - 1, ly0 - 1, Hm - smu - 1], [-lx - 1, ly0 - 1, Hm + 1], [-lx + smu + 1, ly0 - 1, Hm + 1], [-lx - 1, ly1 + 1, Hm - smu - 1], [-lx - 1, ly1 + 1, Hm + 1], [-lx + smu + 1, ly1 + 1, Hm + 1]]),
        hullPts([[lx + 1, ly0 - 1, Hm - smu - 1], [lx + 1, ly0 - 1, Hm + 1], [lx - smu - 1, ly0 - 1, Hm + 1], [lx + 1, ly1 + 1, Hm - smu - 1], [lx + 1, ly1 + 1, Hm + 1], [lx - smu - 1, ly1 + 1, Hm + 1]]),
        hullPts([[-lx - 1, ly1 + 1, Hm - smu - 1], [-lx - 1, ly1 + 1, Hm + 1], [-lx - 1, ly1 - smu - 1, Hm + 1], [lx + 1, ly1 + 1, Hm - smu - 1], [lx + 1, ly1 + 1, Hm + 1], [lx + 1, ly1 - smu - 1, Hm + 1]]),
      ]));
      const studs = [];
      for (const x of cx) for (const y of cy) studs.push(cylZ(ds / 2, Hm - 0.01, Hm + hb, x, y, 96));
      lid = union([lid, ...studs]);
      parts.push({ name: 'Coperchio', m: lid, role: 'pin', print: reg(lid.translate([0, 0, -zL])) });
      const nS = cx.length * cy.length;
      const info = [
        ['Modulo', `${fmt(W)} × ${fmt(D)} × ${fmt(Hm)} mm (${nx} × ${ny} unità da ${fmt(U)} mm), pareti ${fmt(t)}, fondo ${fmt(tf)}, coperchio ${fmt(tl)} mm`],
        ['Vano', `${fmt(2 * xI)} × ${fmt(yB - y0)} × ${fmt(zC - zF)} mm${guide ? ', guide sui fianchi' : ''}`],
      ];

      // ---- cassetto ----
      // con le guide i fianchi sono più spessi della scanalatura (dietro resta la parete normale); senza, il cassetto scorre sul pavimento
      const gd = +p.giocoCassetto, ct = +p.cPareti, gdp = guide ? GUIDA - gd + 0.35 : 0, ts = ct + gdp;
      const dw = 2 * xI - 2 * gd, dh = zC - zF - 2 * gd, dd = yB - y0 - gd;
      const nT = p.separatori === 'nessuno' ? 0 : Math.max(0, p.sepTrasv | 0), nL = p.separatori === 'nessuno' ? 0 : Math.max(0, p.sepLong | 0);
      if (dw > 20 && dh > 10 && dd > 20) {
        const iw = dw - 2 * ts, id = dd - 2 * ct, f = +p.cFondo, R = Math.max(0.5, Math.min(+p.raccordo, iw / 4, id / 4, (dh - f) / 2));
        let dm = box(-dw / 2, -dd / 2, 0, dw / 2, dd / 2, dh);
        const cav = [];
        for (const x of [-iw / 2 + R, iw / 2 - R]) for (const y of [-id / 2 + R, id / 2 - R]) cav.push(reg(reg(Manifold.sphere(R, 48)).translate([x, y, f + R])), cylZ(R, f + R, dh + 1, x, y, 48));
        const dcuts = [hullPts(cav)];
        // scanalature sui fianchi: la guida entra con 0,25 mm di gioco sopra e sotto e 0,35 in fondo
        const zg = zc - zF - gd, a = rb - GUIDA + 0.25;
        if (guide) for (const sx of [-1, 1]) {
          const xo = sx * (dw / 2 + 1), xi = sx * (dw / 2 - gdp), pts = [];
          for (const y of [-dd / 2 - 1, dd / 2 + 1]) pts.push([xo, y, zg - a - gdp - 1], [xo, y, zg + a + gdp + 1], [xi, y, zg - a], [xi, y, zg + a]);
          dcuts.push(hullPts(pts));
        }
        // tacca tonda per le dita nel frontale: larga 2 rw, profonda quanto chiesto (il fondo è un arco)
        const rw = Math.min(15, dw * 0.2), tp = p.maniglia === 'tacca' ? Math.min(+p.taccaProf, dh - f - 2) : 0;
        const tacca = tp > 0 ? reg(hullPts([reg(reg(reg(Manifold.cylinder(ct + 2, rw, rw, 64)).rotate([-90, 0, 0])).translate([0, -dd / 2 - 1, dh - tp + rw])), box(-rw, -dd / 2 - 1, dh + 1, rw, -dd / 2 + ct + 1, dh + 2)])
          .intersect(box(-rw - 1, -dd / 2 - 2, dh - tp, rw + 1, -dd / 2 + ct + 2, dh + 3))) : null;
        dm = sub(dm, union(dcuts));
        const at = [0, y0 + dd / 2, zF + gd], size = [dw, dd, dh];
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
      info.push(['Bottoncini', `${nS} pieni, Ø ${fmt(ds)} alti ${fmt(hb)} mm, stampati sul coperchio; entrano nei fori Ø ${fmt(ds + gI)} del fondo del modulo di sopra`]);
      info.push(['Coperchio', snap ? `a scatto: si preme fra le pareti finché il dentino (${fmt(bd)} mm) scatta sul bordo smussato` : 'poggia sul battente: incollalo lungo i bordi']);
      info.push(['Stampa', 'Vaschetta sul fondo, coperchio piatto con i bottoncini in su, cassetto sul fondo, separatori in piano: niente supporti']);
      info.push(['Prova', 'Il gioco dell\'incastro allarga o stringe i fori del fondo (i bottoncini non cambiano): se balla diminuiscilo, se entra duro aumentalo']);
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info, view: [-0.6, -1, 0.75] };
    }

    return { lego };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

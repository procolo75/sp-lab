// Reggimensole e ganci. Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm.
// Tutto è costruito nel "piano di stampa": il profilo sta nel piano x,y (x = fuori dal muro, y = in alto)
// e la larghezza va lungo z. Così il pezzo si stampa sdraiato sul fianco e gli strati seguono il profilo:
// è il modo più robusto per squadre e ganci. Per l'anteprima il pezzo viene poi raddrizzato (z in alto).
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function supporti(H) {
    const { Manifold, CrossSection, reg, union, sub, box, fmt } = H;

    // ---------- strumenti 2D ----------
    const R2 = (c) => reg(c);
    const P2 = (pts) => R2(CrossSection.ofPolygons([pts], 'NonZero'));
    const C2 = (x, y, r, seg = 40) => R2(R2(CrossSection.circle(r, seg)).translate([x, y]));
    const E2 = (x, y, rx, ry, seg = 96) => R2(R2(R2(CrossSection.circle(1, seg)).scale([rx, ry])).translate([x, y]));
    const RECT = (x0, y0, x1, y1) => P2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const U = (list) => { list = list.filter(Boolean); return list.length === 0 ? null : list.length === 1 ? list[0] : R2(CrossSection.union(list)); };
    const D = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
    const I = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
    const OFF = (c, d, j = 'Round') => (c ? R2(c.offset(d, j)) : null);
    const empty = (c) => !c || c.isEmpty() || c.area() < 0.05;
    const soft = (c, r) => (r > 0 ? OFF(OFF(OFF(c, -r), 2 * r), -r) : c);
    function stroke(pts, w) {
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push(R2(CrossSection.hull([C2(pts[i][0], pts[i][1], w / 2, 32), C2(pts[i + 1][0], pts[i + 1][1], w / 2, 32)])));
      return U(segs);
    }
    // goccia: foro orizzontale stampabile senza supporti (la punta va verso l'alto di stampa, cioè +z)
    const tear = (a, b, r, tip, tipX = 0) => R2(CrossSection.hull([C2(a, b, r, 36), C2(a + tipX * r * 1.41, b + tip * r * 1.41, 0.05, 4)]));

    // ---------- estrusioni ----------
    const EXTZ = (c, z0, z1) => (empty(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));        // c nel piano x,y
    const EXTX = (c, x0, x1) => reg(reg(reg(c.extrude(x1 - x0)).rotate([90, 0, 90])).translate([x0, 0, 0]));   // c nel piano (y, z)
    const EXTY = (c, y0, y1) => reg(reg(reg(c.extrude(y1 - y0)).rotate([-90, 0, 0])).translate([0, y0, 0]));  // c nel piano (x, -z)
    const cone = (h, r0, r1) => reg(Manifold.cylinder(h, r0, r1, 40));
    const U3 = (list) => { list = list.filter(Boolean); return !list.length ? null : list.length === 1 ? list[0] : union(list); };

    // foro per vite che attraversa una piastra verticale (asse x), svasatura sulla faccia x = T
    function holeX(y, z, d, T, csk) {
      const r = d / 2 + 0.15, dk = 2 * d, hc = (dk - d) / 2;
      const hole = EXTX(tear(y, z, r, 1), -1, T + 1);
      if (!csk) return hole;
      return union([hole, reg(reg(cone(hc + 0.02, r, dk / 2 + 0.2).rotate([0, 90, 0])).translate([T - hc, y, z]))]);
    }
    // foro per vite verticale (asse y) in un braccio orizzontale tra y0 e y1, svasatura sotto (faccia y0)
    // back: il pezzo si stampa sulla schiena (x = 0 sul piatto), quindi la punta della goccia va verso +x
    function holeY(x, z, d, y0, y1, csk, back) {
      const r = d / 2 + 0.15, dk = 2 * d, hc = (dk - d) / 2;
      const hole = EXTY(back ? tear(x, -z, r, 0, 1) : tear(x, -z, r, -1), y0 - 1, y1 + 1);
      if (!csk) return hole;
      return union([hole, reg(reg(cone(hc + 0.02, dk / 2 + 0.2, r).rotate([-90, 0, 0])).translate([x, y0 - 0.02, z]))]);
    }
    // sede per magnete rotondo sul retro (faccia x = 0)
    const magnet = (y, z, dm, hm) => reg(reg(reg(Manifold.cylinder(hm + 0.01, dm / 2, dm / 2, 48)).rotate([0, 90, 0])).translate([-0.01, y, z]));

    // dal piano di stampa alla posizione d'uso (z in alto, larghezza lungo y, centrata)
    const toUse = (m, L) => (m ? reg(reg(m.rotate([90, 0, 0])).translate([0, L / 2, 0])) : null);
    // stampa sulla schiena: il retro (x = 0) va sul piatto
    const toBack = (m) => (m ? reg(m.rotate([0, -90, 0])) : null);
    const bb = (m) => { const b = m.boundingBox(); return { x: b.max[0] - b.min[0], y: b.max[1] - b.min[1], z: b.max[2] - b.min[2] }; };
    const dims = (m) => { const b = bb(m); return `${fmt(b.x)} × ${fmt(b.y)} × ${fmt(b.z)} mm`; };
    const part = (name, m, extra) => Object.assign({ name, m, role: 'body' }, extra || {});
    const ghost = (m) => ({ name: 'esempio', m, role: 'ghost' });

    // gancio a J: braccio lungo `P` dal punto (x0,y0), curva di raggio rc verso l'alto, punta alta Ht (dalla linea del braccio)
    function jHook(x0, y0, P, rc, Ht, ang, s, pom, pre) {
      rc = Math.max(s * 0.6, Math.min(rc, P));
      const pts = [...(pre || []), [x0, y0]], bx = x0 + P - rc;
      if (bx > x0 + 0.01) pts.push([bx, y0]);
      for (let i = 1; i <= 14; i++) { const a = -Math.PI / 2 + Math.PI / 2 * i / 14; pts.push([bx + rc * Math.cos(a), y0 + rc + rc * Math.sin(a)]); }
      if (Ht > rc) pts.push([x0 + P, y0 + Ht]);
      // inclinazione: tutto ruota attorno all'attacco
      const c = Math.cos(ang * Math.PI / 180), sn = Math.sin(ang * Math.PI / 180);
      const rot = ([x, y]) => [x0 + (x - x0) * c - (y - y0) * sn, y0 + (x - x0) * sn + (y - y0) * c];
      const rp = pts.map((q, i) => (i < (pre || []).length ? q : rot(q)));
      const tip = rp[rp.length - 1];
      return { cs: U([stroke(rp, s), pom ? C2(tip[0], tip[1], s * 0.78, 32) : null]), tip, top: Math.max(...rp.map(q => q[1])) + (pom ? s * 0.78 : s / 2) };
    }

    // ================= REGGIMENSOLA =================
    function mensola(p) {
      const D0 = p.profondita, Hh = p.altezza, W = p.larghezza, T = p.spessore, k = p.rinforzo / 100;
      const notes = [], info = [];
      const a = (D0 - T) * k, b = (Hh - T) * k, x1 = T + a, y1 = Hh - T - b, top = Hh - T;
      const wall = RECT(0, 0, T, Hh), arm = RECT(0, top, D0, Hh);
      const fr = Math.min(T, a * 0.3, b * 0.3), fil = D(RECT(T - 0.01, top - fr, T + fr, top + 0.01), C2(T + fr, top - fr, fr, 32));
      let rib = null;
      const tri = P2([[T - 0.01, top + 0.01], [x1, top + 0.01], [T - 0.01, y1]]);
      if (p.tipo === 'triangolo') rib = tri;
      else if (p.tipo === 'alleggerito') {
        const rr = Math.min(4, T);
        const hole = OFF(OFF(tri, -(T * 1.1 + rr)), rr);
        rib = empty(hole) ? tri : D(tri, hole);
        if (empty(hole)) notes.push('~Rinforzo troppo piccolo per alleggerirlo: è rimasto pieno');
      } else if (p.tipo === 'diagonale') {
        const w = T * 1.25;
        rib = I(stroke([[T * 0.5, y1], [x1, top + T * 0.5]], w), RECT(0, 0, D0, Hh));
        rib = U([rib, tri && I(tri, U([C2(T, y1, w * 1.2), C2(x1, top, w * 1.2)]))]);
      } else if (p.tipo === 'arco') {
        const w = T * 1.15;
        // arco concavo: quarto di ellisse con centro nell'angolo lontano, dal muro alla mensola
        const ring = D(E2(x1, y1, a + w / 2, b + w / 2), E2(x1, y1, Math.max(1, a - w / 2), Math.max(1, b - w / 2)));
        rib = I(ring, RECT(T - 0.01, y1, x1, top + 0.01));
      } else if (p.tipo === 'curvo') {
        rib = D(RECT(T - 0.01, y1, x1, top + 0.01), E2(x1, y1, a, b));
      }
      const lip = p.labbro > 0 ? RECT(D0 - Math.max(3, T * 0.7), Hh - 0.01, D0, Hh + p.labbro) : null;
      // piastra al muro: può salire sopra la mensola (altre viti al muro) ed essere più larga della squadra
      const up = Math.max(0, +p.sopra || 0), Wp = Math.max(W, +p.larghPiastra || W), wide = Wp > W + 0.01;
      const sM = Math.max(5, +p.spMensola || 18), zc = W / 2;
      const plate = RECT(0, 0, T, Hh + up);
      let m;
      if (!wide) m = EXTZ(soft(U([wall, arm, fil, rib, lip, up ? plate : null]), Math.min(1.5, T * 0.2)), 0, W);
      else m = union([EXTZ(soft(U([wall, arm, fil, rib, lip]), Math.min(1.5, T * 0.2)), 0, W), EXTZ(soft(plate, Math.min(1.5, T * 0.2)), zc - Wp / 2, zc + Wp / 2)]);
      // piastra più larga della squadra: sul fianco il braccio sarebbe a sbalzo, quindi si stampa sulla schiena
      const back = wide;
      // fori: solo dove la vite e il cacciavite non sbattono contro il rinforzo
      const d = p.vite, dk = 2 * d, free = p.tipo !== 'nessuno';
      const holes = [];
      let nW = Math.max(0, p.foriMuro | 0), nM = Math.max(0, p.foriMensola | 0);
      if (nW) {
        const yA = dk / 2 + 3, yB = (free ? y1 - dk / 2 - 2 : top - dk / 2 - 2);
        const fit = Math.max(0, Math.floor((yB - yA) / (dk + 3)) + 1);
        if (fit < nW) { notes.push(fit ? `Al muro ci stanno solo ${fit} viti sotto il rinforzo: alza la squadra o riduci il rinforzo` : 'Nessuno spazio per le viti al muro sotto il rinforzo: alza la squadra o riduci il rinforzo'); nW = fit; }
        for (let i = 0; i < nW; i++) holes.push(holeX(nW === 1 ? (yA + yB) / 2 : yA + (yB - yA) * i / (nW - 1), W / 2, d, T, p.svasati));
      }
      if (nM) {
        const xA = (free ? x1 + dk / 2 + 2 : T + dk / 2 + 3), xB = D0 - (lip ? Math.max(3, T * 0.7) : 0) - dk / 2 - 2;
        const fit = Math.max(0, Math.floor((xB - xA) / (dk + 3)) + 1);
        if (fit < nM) { notes.push(fit ? `Sotto la mensola ci stanno solo ${fit} viti: allunga la squadra o riduci il rinforzo` : 'Nessuno spazio per le viti della mensola: allunga la squadra o riduci il rinforzo'); nM = fit; }
        for (let i = 0; i < nM; i++) holes.push(holeY(nM === 1 ? (xA + xB) / 2 : xA + (xB - xA) * i / (nM - 1), W / 2, d, top, Hh, p.svasati, back));
      }
      // viti al muro sopra la mensola: sopra lo spessore della mensola, in fila lungo la larghezza della piastra, poi su più righe
      let nS = up ? Math.max(0, p.foriSopra | 0) : 0;
      if (nS) {
        const yA = Hh + sM + dk / 2 + 2, yB = Hh + up - dk / 2 - 3, zA = zc - Wp / 2 + dk / 2 + 3, zB = zc + Wp / 2 - dk / 2 - 3;
        const rows = yB < yA - 0.01 ? 0 : Math.floor((yB - yA) / (dk + 3)) + 1, cols = zB < zA - 0.01 ? 1 : Math.floor((zB - zA) / (dk + 3)) + 1;
        if (!rows) { notes.push(`Sopra la mensola non c'è posto per le viti: la piastra deve salire almeno ${fmt(Math.ceil(sM + dk + 5))} mm (con una mensola spessa ${fmt(sM)} mm)`); nS = 0; }
        else {
          if (rows * cols < nS) { notes.push(`Sopra la mensola ci stanno solo ${rows * cols} viti: alza o allarga la piastra`); nS = rows * cols; }
          const nc = Math.min(cols, nS), nr = Math.ceil(nS / nc);
          const ys = nr === 1 ? [(yA + yB) / 2] : Array.from({ length: nr }, (_, i) => yA + (yB - yA) * i / (nr - 1));
          let left = nS;
          for (const y of ys) {
            const k = Math.min(nc, left); left -= k;
            const span = Math.min(zB - zA, (k - 1) * Math.max(dk + 3, (zB - zA) / Math.max(1, nc - 1)));
            for (let i = 0; i < k; i++) holes.push(holeX(y, k === 1 ? zc : zc - span / 2 + span * i / (k - 1), d, T, p.svasati));
          }
        }
      }
      if (holes.length) m = sub(m, union(holes));
      const n = Math.max(1, p.copie | 0), gap = Math.max(W + 30, 90), parts = [];
      const gapP = Math.max(Wp + 30, 90);
      for (let i = 0; i < n; i++) parts.push(part(n > 1 ? `Reggimensola ${i + 1}` : 'Reggimensola', toUse(m, W), { print: back ? toBack(m) : m, at: [0, (i - (n - 1) / 2) * gapP, 0] }));
      // mensola d'esempio appoggiata sopra (con la piastra alta parte dalla piastra)
      const span = (n - 1) * gapP + Wp + 80, depth = lip ? D0 - Math.max(3, T * 0.7) - 0.5 : D0, x0g = up ? T + 0.5 : 0;
      parts.push(ghost(box(x0g, -span / 2, Hh, depth, span / 2, Hh + sM)));
      info.push(['Misure', `${fmt(D0)} × ${fmt(Hh + up)} mm, larga ${fmt(W)} mm, spessore ${fmt(T)} mm`]);
      if (up || wide) info.push(['Piastra al muro', `alta ${fmt(Hh + up)} mm${up ? ` (sale ${fmt(up)} mm sopra la mensola)` : ''}, larga ${fmt(Wp)} mm`]);
      info.push(['Viti', `${nW} al muro sotto la mensola${up ? `, ${nS} al muro sopra` : ''}, ${nM} nella mensola, Ø ${fmt(d)} mm${p.svasati ? ' a testa svasata' : ''}`]);
      if (lip) info.push(['Labbro', `${fmt(p.labbro)} mm: la mensola va profonda al massimo ${fmt(depth - x0g)} mm`]);
      else if (up) info.push(['Mensola', `appoggia contro la piastra: profonda al massimo ${fmt(D0 - T)} mm sopra la squadra`]);
      info.push(['Pezzi', `${n}, già ${back ? 'sulla schiena' : 'sdraiati sul fianco'}`]);
      info.push(['Stampa', back
        ? 'sulla schiena (piastra sul piatto), perché la piastra è più larga della squadra: sul fianco il braccio sarebbe a sbalzo. Regge meno che sul fianco: per pesi forti usa almeno 4 perimetri e riempimento al 40%'
        : 'sul fianco: gli strati seguono il profilo e la squadra non si apre sotto carico']);
      if (T < 5 || W < 15) notes.push('Squadra sottile: va bene per mensole leggere. Per libri e pesi spessore 7 mm o più e larghezza 25 mm o più');
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [0.75, -0.9, 0.45] };
    }

    // ================= GANCI =================
    function gancio(p) {
      const s = p.spessoreG, W = p.larghezza, tipo = p.tipo, notes = [], info = [];
      const n = tipo === 'muro' || tipo === 'porta' ? Math.max(1, p.numero | 0) : 1;
      const ia = Math.max(W + 4, p.interasse);
      let L = (n - 1) * ia + W, prof = null, plate = null, ghostM = null;
      const hooks = [];       // profili dei ganci, estrusi a ogni posizione
      let holes = [], extraNote = null;
      if (tipo === 'muro') {
        const T = p.spessoreP, y0 = s / 2;
        const g = Math.min(p.sporgenza * 0.35, s * 1.6);
        const j = jHook(T, y0, p.sporgenza, p.raggio, p.punta, p.inclinazione, s, p.pomello);
        const gus = P2([[T - 0.5, y0], [T - 0.5, y0 + s / 2 + g], [T + g, y0]]);
        hooks.push(I(U([j.cs, gus]), RECT(0, -1e3, 1e3, 1e3)));
        const d = p.vite, dk = 2 * d;
        let Hp = p.altezzaP;
        const need = p.fissaggio === 'viti' ? j.top + dk + 8 : j.top * 0.6;
        if (p.fissaggio === 'viti' && Hp < need) { notes.push(`~Piastra alzata a ${fmt(need)} mm: le viti stanno sopra la punta, dove arriva il cacciavite`); Hp = need; }
        const nv = Math.max(1, p.viti | 0);
        if (p.fissaggio === 'viti') L = Math.max(L + 6, nv * (dk + 6));
        else if (p.fissaggio === 'magneti') L = Math.max(L + 6, (p.numMag | 0) * (p.magnete + 4) + 4);
        else L = Math.max(L + 6, 20);
        plate = EXTX(soft(RECT(0, 0, Hp, L), Math.min(4, Hp / 4, L / 4)), 0, T);
        if (p.fissaggio === 'viti') {
          const yv = (Math.max(j.top, s) + Hp) / 2;
          for (let i = 0; i < nv; i++) holes.push(holeX(yv, L * (i + 0.5) / nv, d, T, p.svasati));
          info.push(['Fissaggio', `${nv} vit${nv > 1 ? 'i' : 'e'} Ø ${fmt(d)} mm sopra i ganci`]);
        } else if (p.fissaggio === 'magneti') {
          const nm = Math.max(1, p.numMag | 0), hm = p.magneteH + 0.2;
          if (T < hm + 0.8) notes.push(`Piastra sottile per magneti alti ${fmt(p.magneteH)} mm: porta lo spessore piastra ad almeno ${fmt(hm + 1)} mm`);
          for (let i = 0; i < nm; i++) holes.push(magnet(Hp / 2, L * (i + 0.5) / nm, p.magnete + p.tolleranza, Math.min(hm, T - 0.6)));
          info.push(['Fissaggio', `${nm} magnet${nm > 1 ? 'i' : 'e'} Ø ${fmt(p.magnete)} × ${fmt(p.magneteH)} mm sul retro (incollali)`]);
        } else info.push(['Fissaggio', `biadesivo sul retro: piastra ${fmt(Hp)} × ${fmt(L)} mm`]);
        ghostM = box(-4, -15, -15, 0, Hp + 15, L + 15);
      } else if (tipo === 'porta') {
        const T = s, gap = p.porta + p.tolleranza, br = p.ponte;
        const clip = U([RECT(-T, -p.esterno, 0, br), RECT(-T, 0, gap + T, br), RECT(gap, -p.interno, gap + T, br)]);
        plate = EXTZ(soft(clip, Math.min(1, br * 0.3)), 0, L);
        const j = jHook(gap + T - 0.5, -p.interno + s / 2, p.sporgenza, p.raggio, p.punta, p.inclinazione, s, p.pomello);
        hooks.push(j.cs);
        if (br > 3) notes.push(`~Il ponte sopra la porta è ${fmt(br)} mm: controlla che passi nella fessura tra porta e telaio (di solito 2–3 mm)`);
        info.push(['Porta', `spessore ${fmt(p.porta)} mm + ${fmt(p.tolleranza)} di gioco, ponte ${fmt(br)} mm`]);
        ghostM = box(0, -p.interno - 80, -20, p.porta, 0, L + 20);
      } else if (tipo === 'tubo') {
        const R = p.tubo / 2 + p.tolleranza / 2, T = s;
        const ring = D(C2(0, 0, R + T, 96), C2(0, 0, R, 96));
        // apertura per agganciarlo al tubo: sul fianco, così il peso appoggia sulla parte chiusa in alto
        const half = Math.asin(Math.min(0.99, p.apertura / 100 * R / (R + T / 2))) * 180 / Math.PI;
        const a0 = 0, big = 4 * (R + T);
        const wedge = P2([[0, 0], [big * Math.cos((a0 - half) * Math.PI / 180), big * Math.sin((a0 - half) * Math.PI / 180)], [big * Math.cos(a0 * Math.PI / 180) * 1.4, big * Math.sin(a0 * Math.PI / 180) * 1.4], [big * Math.cos((a0 + half) * Math.PI / 180), big * Math.sin((a0 + half) * Math.PI / 180)]]);
        let c = soft(D(ring, wedge), Math.min(1.2, T * 0.3));
        const yb = -R - T / 2 - p.gambo;
        const j = jHook(0, yb, p.sporgenza, p.raggio, p.punta, 0, s, p.pomello, [[0, -R - T / 2]]);
        hooks.push(U([c, j.cs]));
        info.push(['Tubo', `Ø ${fmt(p.tubo)} mm, apertura ${fmt(2 * R * p.apertura / 100)} mm: si aggancia a scatto`]);
        ghostM = reg(reg(Manifold.cylinder(W + 40, p.tubo / 2, p.tubo / 2, 64)).translate([0, 0, -20]));
      } else {   // a S
        const r1 = p.aperturaSopra / 2 + s / 2, r2 = p.aperturaSotto / 2 + s / 2, h = p.gambo / 2, pts = [];
        for (let i = 0; i <= 28; i++) { const a = (180 - 220 * i / 28) * Math.PI / 180; pts.unshift([r1 + r1 * Math.cos(a), h + r1 * Math.sin(a)]); }
        for (let i = 0; i <= 28; i++) { const a = (0 - 220 * i / 28) * Math.PI / 180; pts.push([-r2 + r2 * Math.cos(a), -h + r2 * Math.sin(a)]); }
        const ends = p.pomello ? [C2(pts[0][0], pts[0][1], s * 0.78), C2(pts[pts.length - 1][0], pts[pts.length - 1][1], s * 0.78)] : [];
        hooks.push(U([stroke(pts, s), ...ends]));
        info.push(['Aperture', `sopra ${fmt(p.aperturaSopra)} mm, sotto ${fmt(p.aperturaSotto)} mm`]);
      }
      // ganci estrusi alle loro posizioni lungo la larghezza
      const z0 = (L - ((n - 1) * ia + W)) / 2, solids = [plate];
      for (let i = 0; i < n; i++) for (const h of hooks) solids.push(EXTZ(h, z0 + i * ia, z0 + i * ia + W));
      let m = U3(solids);
      if (holes.length) m = sub(m, union(holes));
      const print = tipo === 'muro' && p.stampa === 'schiena' ? toBack(m) : m;
      const parts = [part(n > 1 ? `Gancio ×${n}` : 'Gancio', toUse(m, L), { print })];
      if (ghostM) parts.push(ghost(toUse(ghostM, L)));
      const nameT = { muro: 'a muro', porta: 'sopra porta o anta', tubo: 'per tubo o bastone', esse: 'a S' }[tipo];
      info.unshift(['Misure', dims(toUse(m, L))]);
      info.splice(1, 0, ['Gancio', `${nameT}${n > 1 ? `, ${n} ganci ogni ${fmt(ia)} mm` : ''}, spessore ${fmt(s)} mm`]);
      if (tipo !== 'esse') info.push(['Sporgenza', `${fmt(p.sporgenza)} mm, punta ${fmt(p.punta)} mm`]);
      info.push(['Stampa', print === m ? 'sul fianco: gli strati seguono la curva, il gancio non si spezza' : 'sulla schiena: più comodo, ma il gancio è meno robusto']);
      if (p.interasse < W + 4 && n > 1) notes.push(`~Interasse portato a ${fmt(ia)} mm: i ganci si toccavano`);
      if (s < 4) notes.push('Gancio sottile: per giacche e borse almeno 6 mm');
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [0.8, -0.85, 0.45] };
    }

    return { mensola, gancio };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

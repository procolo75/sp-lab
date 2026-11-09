// Medagliette per collari di cani e gatti: osso, cuore, tondo, tondo con la zampa… con la scritta sui due lati (davanti il nome, dietro il telefono).
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT e usa le scritte di natale.js (H.decor). Coordinate in mm, z in alto.
// - si stampa piatta, il davanti in alto: la scritta davanti è scavata dall'alto, quella dietro dal basso (sono i primi strati);
// - dietro la scritta è a specchio, così si legge giusta girando la medaglietta;
// - a filo: le lettere sono un'altra parte colorata nello stesso oggetto (serve una stampante multicolore); incisa: scavata, un colore solo;
// - aggancio: foro per l'anellino (dentro la forma o su una linguetta), asola sopra per il collare, oppure due fessure ai lati:
//   il collare entra davanti da una, passa dietro e riesce dall'altra; la medaglietta sta piatta sul collare e il dietro non si vede.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function collari(H) {
    const { CrossSection, reg, union, sub, fmt } = H;

    // ---------- strumenti 2D ----------
    const R2 = (c) => reg(c);
    const P2 = (pts) => R2(CrossSection.ofPolygons([pts], 'NonZero'));
    const C2 = (x, y, r, seg = 64) => R2(R2(CrossSection.circle(r, seg)).translate([x, y]));
    const E2 = (x, y, rx, ry, rot = 0, seg = 64) => R2(R2(R2(R2(CrossSection.circle(1, seg)).scale([rx, ry])).rotate(rot)).translate([x, y]));
    const RECT = (x0, y0, x1, y1) => P2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const U = (list) => { list = list.filter(Boolean); return list.length === 0 ? null : list.length === 1 ? list[0] : R2(CrossSection.union(list)); };
    const D = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
    const I = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
    const OFF = (c, d, j = 'Round') => (c ? R2(c.offset(d, j)) : null);
    const MV = (c, x, y) => R2(c.translate([x, y]));
    const MIR = (c) => (c ? R2(c.scale([-1, 1])) : null);
    const HULL = (list) => R2(CrossSection.hull(list.filter(Boolean)));
    const empty = (c) => !c || c.isEmpty() || c.area() < 0.05;
    const soft = (c, r) => OFF(OFF(OFF(c, -r), 2 * r), -r);           // arrotonda spigoli convessi e concavi
    const close = (c, r) => OFF(OFF(c, r), -r);                         // riempie le rientranze strette
    const EXT = (c, z0, z1) => (empty(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
    const bounds = (c) => { const b = c.bounds(); return { x0: b.min[0], y0: b.min[1], x1: b.max[0], y1: b.max[1], w: b.max[0] - b.min[0], h: b.max[1] - b.min[1] }; };
    const cen = (c) => { const b = bounds(c); return MV(c, -(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2); };
    const contains = (outer, inner) => empty(D(inner, outer));
    const part = (name, m, color, group) => (m ? { name, m, role: 'body', color, group } : null);
    const f2 = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');

    // ---------- forme ----------
    // ogni forma, larga L: sagoma centrata, riquadro della scritta {x, y, w, h} e dove va il foro: 'dentro' (vicino al bordo in alto)
    // oppure 'linguetta' (la forma lassù è stretta: il foro va su una linguetta tonda che sporge)
    function heart(L) {
      const pts = [], s = L / 32;
      for (let i = 0; i < 160; i++) { const t = 2 * Math.PI * i / 160; pts.push([16 * Math.pow(Math.sin(t), 3) * s, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s]); }
      return cen(soft(P2(pts), 0.8));
    }
    function star(L) {
      const R = L / 1.902, r = R * 0.55, pts = [];
      for (let i = 0; i < 10; i++) { const a = (90 + i * 36) * Math.PI / 180, q = i % 2 ? r : R; pts.push([q * Math.cos(a), q * Math.sin(a)]); }
      return soft(P2(pts), 0.07 * L);
    }
    function shield(L) {
      const H0 = 1.1 * L, right = [];
      for (let i = 0; i <= 30; i++) { const t = i / 30; right.push([L / 2 * (1 - Math.pow(t, 2.4)), 0.42 * H0 - t * H0]); }
      return cen(soft(P2([[-L / 2, 0.42 * H0], ...right, ...right.slice(0, -1).reverse().map(([x, y]) => [-x, y])]), 0.08 * L));
    }
    // solo i contorni esterni: niente buchi rimasti chiusi dentro la sagoma
    function fillHoles(c) {
      const area = (q) => { let a = 0; for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
      const outer = c.toPolygons().filter(q => area(q) > 0);
      return outer.length ? R2(CrossSection.ofPolygons(outer, 'NonZero')) : c;
    }
    const SHAPES = {
      osso(L) {
        const r = 0.165 * L, cx = L / 2 - r, cy = 0.125 * L, bh = 0.17 * L;
        const c = U([RECT(-cx, -bh, cx, bh), C2(-cx, cy, r), C2(-cx, -cy, r), C2(cx, cy, r), C2(cx, -cy, r)]);
        return { base: soft(c, 0.04 * L), box: { x: 0, y: 0, w: 2 * cx - 0.9 * r, h: 2 * bh - 1.6 }, foro: 'linguetta' };
      },
      zampa2(L) {
        // medaglia tonda con l'impronta di una zampa sopra il nome, dello stesso colore e stile della scritta davanti
        const R = L / 2, k = L / 40;
        const pad = soft(U([E2(0, -2 * k, 4.6 * k, 3.6 * k), E2(-2.6 * k, -3.4 * k, 2.6 * k, 2.1 * k), E2(2.6 * k, -3.4 * k, 2.6 * k, 2.1 * k)]), 0.4 * k);
        const toes = [[-5.6, 2, 1.7, 2.2, 25], [5.6, 2, 1.7, 2.2, -25], [-2, 4.6, 1.8, 2.3, 8], [2, 4.6, 1.8, 2.3, -8]].map(([x, y, rx, ry, r]) => E2(x * k, y * k, rx * k, ry * k, r));
        const paw = MV(U([pad, ...toes]), 0, 0.1 * L);
        return { base: C2(0, 0, R, 120), decor: paw, box: { x: 0, y: -0.2 * L, w: 0.78 * L, h: 0.24 * L }, foro: 'dentro' };
      },
      cuore: (L) => ({ base: heart(L), box: { x: 0, y: 0.04 * L, w: 0.62 * L, h: 0.3 * L }, foro: 'linguetta' }),
      tondo: (L) => ({ base: C2(0, 0, L / 2, 120), box: { x: 0, y: 0, w: 0.76 * L, h: 0.42 * L }, foro: 'dentro' }),
      ovale: (L) => ({ base: E2(0, 0, L * 0.36, L / 2, 0, 120), box: { x: 0, y: 0, w: 0.58 * L, h: 0.5 * L }, foro: 'dentro' }),
      scudo: (L) => ({ base: shield(L), box: { x: 0, y: 0.04 * L, w: 0.7 * L, h: 0.34 * L }, foro: 'dentro' }),
      rettangolo: (L) => ({ base: soft(RECT(-L / 2, -0.3 * L, L / 2, 0.3 * L), 0.12 * L), box: { x: 0, y: 0, w: 0.84 * L, h: 0.36 * L }, foro: 'linguetta' }),
      stella: (L) => ({ base: cen(star(L)), box: { x: 0, y: 0, w: 0.46 * L, h: 0.22 * L }, foro: 'dentro' }),
    };
    const SHAPE_NAMES = { osso: 'Osso', zampa2: 'Tondo con zampa', cuore: 'Cuore', tondo: 'Tondo', ovale: 'Ovale', scudo: 'Scudo', rettangolo: 'Rettangolo', stella: 'Stella' };

    // punto più alto della sagoma vicino a x
    function topAt(base, x) {
      const s = I(base, RECT(x - 0.8, -1e4, x + 0.8, 1e4));
      return s && !s.isEmpty() ? bounds(s).y1 : bounds(base).y1;
    }
    // il riquadro più grande (con le proporzioni w:h) che sta tutto dentro region, il più vicino possibile al centro voluto [cx, cy].
    // I centri possibili sono la regione erosa dal rettangolo: la intersezione della regione spostata dei punti del suo contorno
    function fitRect(region, w, h, cx, cy) {
      if (empty(region)) return null;
      const pts = [];
      for (let i = 0; i <= 4; i++) { const k = i / 4 - 0.5; pts.push([k, -0.5], [k, 0.5], [-0.5, k], [0.5, k]); }
      const centers = (f) => {
        let c = I(region, RECT(cx - 0.05, cy - 1.5, cx + 0.05, cy + 1.5));   // sull'asse della forma e vicino al centro voluto: piuttosto si rimpicciolisce
        for (const [a, b] of pts) { c = I(c, MV(region, -a * w * f, -b * h * f)); if (empty(c)) return null; }
        return c;
      };
      let lo = 0, hi = 1, best = null;
      if (centers(1)) { lo = 1; best = centers(1); }
      else for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2, c = centers(m); if (c) { lo = m; best = c; } else hi = m; }
      if (!best) return null;
      // il punto dei centri possibili più vicino a quello voluto
      let at = [cx, cy];
      if (empty(I(best, C2(cx, cy, 0.05, 8)))) {
        let bd = Infinity;
        for (const q of best.toPolygons()) for (let i = 0; i < q.length; i++) {
          const [ax, ay] = q[i], [bx, by] = q[(i + 1) % q.length], ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey || 1e-12;
          const t = Math.max(0, Math.min(1, ((cx - ax) * ex + (cy - ay) * ey) / L2)), px = ax + t * ex, py = ay + t * ey, d = Math.hypot(px - cx, py - cy);
          if (d < bd) { bd = d; at = [px, py]; }
        }
      }
      return { x: at[0], y: at[1], w: w * lo, h: h * lo, f: lo };
    }

    // ---------- medaglietta ----------
    function collare(p) {
      const notes = [], DEC = H.decor;
      const L = Math.max(15, +p.misura || 36);
      const sh = (SHAPES[p.forma] || SHAPES.osso)(L);
      let base = sh.base, box = sh.box;
      let t = Math.max(1.2, +p.spessore || 3);
      const sF = p.stileDavanti || 'filo', sB = p.stileDietro || 'filo';
      let dF = Math.max(0.2, +p.profDavanti || 0.2), dB = Math.max(0.2, +p.profDietro || 0.2);
      const g = Math.max(0, +p.gioco || 0.3);
      const agg = p.aggancio || 'foro';
      let holes = null, keepOut = null, aggInfo = '';
      let backOn = true, between = null, betweenY = 0;

      // --- aggancio ---
      if (agg === 'foro') {
        const rh = Math.max(1, (+p.diamForo || 4) / 2), wall = Math.max(1.6, +p.paretForo || 2.2);
        let c;
        {
          const y = topAt(base, 0) - rh - wall;
          const ring = C2(0, y, rh + wall);
          if (sh.foro === 'dentro' && contains(base, ring)) c = [0, y];
          else {
            // linguetta tonda che sporge in alto, raccordata alla sagoma
            const top = sh.tabTop !== undefined ? sh.tabTop : topAt(base, 0), cy = top + rh * 0.55;
            const tab = HULL([C2(0, cy, rh + wall), C2(0, top - 0.8 * (rh + wall), (rh + wall) * 0.6)]);
            base = fillHoles(U([base, tab, I(close(U([base, tab]), 1.2), OFF(tab, 1.5))]));   // raccordo solo attorno alla linguetta
            c = [0, cy];
          }
        }
        if (!contains(base, C2(c[0], c[1], rh + Math.min(wall, 1.2)))) notes.push('Attorno al foro resta poco materiale: rimpicciolisci il foro o ingrandisci la medaglietta');
        holes = C2(c[0], c[1], rh, 48);
        keepOut = C2(c[0], c[1], rh + wall + 0.6);
        aggInfo = `foro Ø ${f2(2 * rh)} mm per l'anellino, ${f2(wall)} mm di materiale attorno`;
      } else if (agg === 'asola') {
        // linguetta sopra con la fessura: il collare ci passa dentro
        const cw = Math.max(5, +p.largCollare || 15) + 2 * g, ct = Math.max(1, +p.spCollare || 2.5) + 2 * g, wall = 2.6;
        const top = sh.tabTop !== undefined ? sh.tabTop : topAt(base, 0), y0 = top - 1.5, cyS = y0 + wall + ct / 2;
        const tab = soft(RECT(-cw / 2 - wall, y0 - 4, cw / 2 + wall, cyS + ct / 2 + wall), Math.min(3, wall + ct / 2 - 0.1));
        base = fillHoles(U([base, tab, I(close(U([base, tab]), 1.5), OFF(tab, 2))]));
        const r = Math.min(ct / 2 - 0.01, 1);
        holes = soft(RECT(-cw / 2, cyS - ct / 2, cw / 2, cyS + ct / 2), r);
        keepOut = OFF(holes, wall + 0.6);
        aggInfo = `asola ${f2(cw)} × ${f2(ct)} mm (collare ${fmt(+p.largCollare || 15)} × ${f2(+p.spCollare || 2.5)} mm più ${f2(g)} mm di gioco per lato)`;
      } else if (agg === 'fessure') {
        // due fessure verticali ai lati: il collare (orizzontale) entra davanti da una, passa dietro, riesce dall'altra
        const cw = Math.max(5, +p.largCollare || 15) + 2 * g, ct = Math.max(1, +p.spCollare || 2.5) + 2 * g, wall = 2.2;
        const r = Math.min(ct / 2 - 0.01, 1);
        let yc = 0;
        const slot = (x) => soft(RECT(x - ct / 2, yc - cw / 2, x + ct / 2, yc + cw / 2), r);
        // centri possibili di una fessura con la sua parete attorno: la sagoma erosa dal rettangolo (punti del contorno);
        // le due fessure stanno a specchio, il più lontano possibile dal centro, all'altezza dove la forma è più larga
        const outline = OFF(slot(0), wall).toPolygons()[0], step = Math.max(1, Math.floor(outline.length / 28));
        let feas = base;
        for (let i = 0; i < outline.length && !empty(feas); i += step) feas = I(feas, MV(base, -outline[i][0], -outline[i][1]));
        feas = empty(feas) ? null : I(feas, MIR(feas));
        let xs = null;
        if (!empty(feas)) {
          let best = null;
          for (const q of feas.toPolygons()) for (const [x, y] of q) if (x > 0 && (!best || x > best[0])) best = [x, y];
          if (best) {
            yc = best[1];
            for (let x = best[0]; x > ct; x -= 0.2) if (contains(base, OFF(slot(x), wall)) && contains(base, OFF(slot(-x), wall))) { xs = x; break; }
          }
        }
        const gap = xs === null ? 0 : 2 * (xs - ct / 2 - wall);
        if (xs === null) notes.push(`La forma è troppo piccola per le fessure di un collare da ${fmt(+p.largCollare || 15)} mm: ingrandisci la medaglietta, scegli un'altra forma o il foro`);
        else if (gap < 14) notes.push(`Con questa forma le fessure stanno vicine e tra loro resta poco posto per il nome (${fmt(gap)} mm): meglio osso, rettangolo o tondo, o una medaglietta più grande`);
        if (xs !== null) {
        holes = U([slot(xs), slot(-xs)]);
        keepOut = OFF(holes, wall);
        between = RECT(-xs + ct / 2 + wall, -1e4, xs - ct / 2 - wall, 1e4);   // la scritta sta tra le due fessure
        betweenY = yc;
        backOn = false;
        }
        aggInfo = xs === null ? 'fessure: non ci stanno' : `due fessure ${f2(ct)} × ${f2(cw)} mm, una per lato (collare ${fmt(+p.largCollare || 15)} × ${f2(+p.spCollare || 2.5)} mm più ${f2(g)} mm di gioco per lato): il collare entra davanti da una, passa dietro e riesce dall'altra`;
        if (xs !== null && String(p.dietro || p.dietro2 || '').trim()) notes.push('~Con le fessure il dietro sta contro il collare e non si vede: la scritta dietro non c\'è');
      }

      // --- spessori: le due scritte non devono toccarsi, in mezzo almeno 0,6 mm di pezzo ---
      const need = (sF ? dF : 0) + (backOn ? dB : 0) + 0.6;
      if (t < need) {
        const k = (t - 0.6) / (dF + (backOn ? dB : 0));
        dF = Math.max(0.2, Math.round(dF * k * 5) / 5); dB = Math.max(0.2, Math.round(dB * k * 5) / 5);
        notes.push(`Medaglietta troppo sottile per le due scritte: profondità ridotte a ${f2(dF)} e ${f2(dB)} mm. Aumenta lo spessore`);
      }

      // --- scritte ---
      const noz = +p.ugello || 0.4, inner = D(OFF(I(sh.zone ? I(sh.zone, base) : base, between || base), -1.2), keepOut);
      // la scritta occupa il rettangolo più grande che sta nella zona libera, vicino al centro del riquadro della forma.
      // Dietro si guarda girata: zona e centro a specchio, poi la scritta torna a specchio sul pezzo
      const fit = (lines, caps, side) => {
        if (!lines.some(s => String(s || '').trim())) return null;
        const q = { scritta: lines[0], scritta2: lines[1], altTesto: caps[0], altTesto2: caps[1] || caps[0], carattere: p.carattere, ugello: p.ugello, pos1: [0, 0], pos2: [0, 0] };
        const dB = side === 'dietro';
        const room = dB ? inner : D(inner, sh.decor ? OFF(sh.decor, 1.5) : null);   // davanti la scritta lascia posto al disegno
        const zone = dB ? MIR(room) : room;
        const t0 = DEC.fitText(q, { x: 0, y: 0, w: 1e4, h: 1e4 }, caps[0]);
        if (!t0 || !t0.cs) return null;
        const r = fitRect(zone, t0.box.w + 0.4, t0.box.h + 0.4, dB ? -box.x : box.x, between ? betweenY : box.y);
        if (!r) { notes.push(`Non c'è spazio per la scritta ${side}: ingrandisci la medaglietta`); return null; }
        const tf = DEC.fitText(q, { x: r.x, y: r.y, w: r.w, h: r.h }, caps[0]);
        if (!tf || !tf.cs) return null;
        let cs = I(dB ? MIR(tf.cs) : tf.cs, room);
        if (tf.reduced) notes.push(`~Scritta ${side} ridotta a ${f2(tf.cap)} mm per starci: accorciala o ingrandisci la medaglietta`);
        if (tf.cap < 2.5) notes.push(`Lettere ${side} alte ${f2(tf.cap)} mm: si leggono male. Ingrandisci la medaglietta o accorcia il testo`);
        return empty(cs) ? null : { cs, cap: tf.cap };
      };
      const front = fit([p.davanti, p.davanti2], [+p.altDavanti || 7, +p.altDavanti2 || +p.altDavanti || 7], 'davanti');
      DEC.logoNotes(noz);
      const back = backOn ? fit([p.dietro, p.dietro2], [+p.altDietro || 4, +p.altDietro2 || +p.altDietro || 4], 'dietro') : null;
      DEC.logoNotes(noz);
      // logo SP: dietro, lontano dalla scritta e dal foro (se il dietro non si vede, davanti)
      let mark = null;
      if (p.marchio) {
        const avoid = U([backOn ? (back && MIR(back.cs)) : (front && front.cs)]);
        const face = D(OFF(base, -0.8), keepOut);
        const m = DEC.placeMark(backOn ? MIR(face) : face, p, notes, avoid, 0.5);
        mark = m ? (backOn ? MIR(m) : m) : null;
      }
      const backCs = backOn ? U([back && back.cs, mark]) : (back && back.cs);
      const decor = sh.decor ? D(I(sh.decor, OFF(base, -1)), keepOut) : null;   // disegno davanti: stesso stile e colore della scritta
      const frontCs = U([front && front.cs, decor, backOn ? null : mark]);

      // --- solidi ---
      let body = EXT(base, 0, t);
      if (holes) body = sub(body, EXT(holes, -1, t + 1));
      const colB = p.colDietro === '3' ? 3 : 2;
      const solids = { 2: [], 3: [] };
      if (!empty(frontCs)) {
        if (sF === 'filo') { body = sub(body, EXT(frontCs, t - dF, t + 1)); solids[2].push(EXT(frontCs, t - dF, t)); }
        else body = sub(body, EXT(frontCs, t - dF, t + 1));
      }
      if (!empty(backCs)) {
        if (sB === 'filo') { body = sub(body, EXT(backCs, -1, dB)); solids[colB].push(EXT(backCs, 0, dB)); }
        else body = sub(body, EXT(backCs, -1, dB));
      }
      const G = 'Medaglietta';
      const U3 = (l) => (!l.length ? null : l.length === 1 ? l[0] : union(l));
      const parts = [part(`${G} · base`, body, p.col1, G), part(`${G} · scritta davanti`, U3(solids[2]), p.col2, G), part(`${G} · scritta dietro`, U3(solids[3]), p.col3, G)].filter(Boolean);
      if (colB === 2 && solids[2].length && parts[1]) parts[1].name = `${G} · scritte`;

      // --- info ---
      const bb = bounds(base);
      const st = (s, d) => (s === 'filo' ? `a filo, colorata, ${f2(d)} mm` : `incisa ${f2(d)} mm`);
      const info = [
        ['Forma', `${SHAPE_NAMES[p.forma] || 'Osso'}, ${fmt(bb.w)} × ${fmt(bb.h)} × ${f2(t)} mm`],
        ['Davanti', front ? `lettere ${f2(front.cap)} mm, ${st(sF, dF)}` : 'senza scritta'],
        ['Dietro', !backOn ? 'contro il collare' : back ? `lettere ${f2(back.cap)} mm, ${st(sB, dB)}, a specchio: si legge girando la medaglietta` : 'senza scritta'],
        ['Aggancio', aggInfo || 'nessuno'],
      ];
      const filo = parts.length > 1;
      info.push(['Filamenti', filo ? parts.map((q, i) => (i === 0 ? '1 pezzo' : q.name.split('· ')[1])).join(' · ') + ' (una parte per filamento nel 3MF)' : '1']);
      if (filo) notes.push('~A filo i colori sono negli stessi strati: serve una stampante multicolore (AMS, MMU…). Con un colore solo scegli Incisa');
      info.push(['Stampa', 'piatta, il davanti in alto, senza supporti. Per un cane che corre meglio PETG; i bordi si possono passare con carta vetrata']);
      const al = (v) => [0.2, 0.28].some(h => Math.abs(v / h - Math.round(v / h)) < 0.02);
      if (![t, dF, dB].every(al)) notes.push('Alcuni spessori non sono multipli di 0,2 o 0,28 mm: lo slicer arrotonda agli strati');
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info, view: [0, -0.55, 1] };
    }

    return { collare };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

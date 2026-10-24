// Antivibrazione per racchette: tennis (bottone e verme) e padel (tappo nel foro e passante).
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z in alto.
// Vanno stampati in TPU morbido (85A–95A) o TPE: è la gomma che smorza, il PLA non serve a niente.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function racchette(H) {
    const { CrossSection, reg, union, sub, cylZ, coneZ, fmt } = H;

    // ---------- strumenti 2D ----------
    const R2 = (c) => reg(c);
    const P2 = (pts) => R2(CrossSection.ofPolygons([pts], 'NonZero'));
    const C2 = (x, y, r, seg = 48) => R2(R2(CrossSection.circle(r, seg)).translate([x, y]));
    const RECT = (x0, y0, x1, y1) => P2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const U = (list) => { list = list.filter(Boolean); return list.length === 0 ? null : list.length === 1 ? list[0] : R2(CrossSection.union(list)); };
    const D = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
    const I = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
    const OFF = (c, d, j = 'Round') => (c ? R2(c.offset(d, j)) : null);
    const MV = (c, x, y) => R2(c.translate([x, y]));
    const empty = (c) => !c || c.isEmpty() || c.area() < 0.05;
    const soft = (c, r) => OFF(OFF(OFF(c, -r), 2 * r), -r);
    const EXT = (c, z0, z1) => (empty(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
    // prisma lungo -y (sezione disegnata nel piano x,z), da y = y0 a y = y1 (y1 < y0)
    const prismY = (c, y0, y1) => reg(reg(reg(c.extrude(y0 - y1)).rotate([90, 0, 0])).translate([0, y0, 0]));
    const part = (name, m, color, group, extra) => (m ? Object.assign({ name, m, role: 'body', color, group }, extra || {}) : null);
    // sagoma estrusa con i bordi arrotondati a gradini da uno strato (rT sopra, rB sotto)
    function roundExt(cs, z0, z1, rT, rB) {
      const n = 5, out = [EXT(cs, z0 + rB, z1 - rT)];
      for (const [r, top] of [[rT, true], [rB, false]]) {
        if (!(r > 0)) continue;
        for (let k = 0; k < n; k++) {
          const ins = Math.min(r * 0.9, r - Math.sqrt(Math.max(0, r * r - (r * (k + 1) / n) ** 2)));
          const za = top ? z1 - r + k * r / n - 0.01 : z0 + r - (k + 1) * r / n, zb = top ? z1 - r + (k + 1) * r / n : z0 + r - k * r / n + 0.01;
          out.push(EXT(OFF(cs, -ins), za, zb));
        }
      }
      return union(out.filter(Boolean));
    }
    // sagome centrate, larghe L (in x)
    function heart(L) {
      const pts = [], s = L / 32;
      for (let i = 0; i < 120; i++) { const t = 2 * Math.PI * i / 120; pts.push([16 * Math.pow(Math.sin(t), 3) * s, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * s]); }
      const c = soft(P2(pts), 0.6), b = c.bounds();
      return MV(c, 0, -(b.min[1] + b.max[1]) / 2);
    }
    const cen = (c) => { const b = c.bounds(); return MV(c, -(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2); };
    // poligono regolare con un lato in alto e uno in basso, largo L da lato a lato
    const ngon = (n, L, rot) => R2(R2(CrossSection.circle(L / 2 / Math.cos(Math.PI / n), n)).rotate(rot));
    function star(n, R, r) {
      const pts = [];
      for (let i = 0; i < 2 * n; i++) { const a = (90 + i * 180 / n) * Math.PI / 180, q = i % 2 ? r : R; pts.push([q * Math.cos(a), q * Math.sin(a)]); }
      return P2(pts);
    }
    function shield(L) {
      const right = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24; right.push([L / 2 * (1 - Math.pow(t, 2.2)), 0.42 * L - t * L]); }
      return cen(soft(P2([[-L / 2, 0.42 * L], ...right, ...right.slice(0, -1).reverse().map(([x, y]) => [-x, y])]), 1));
    }
    // forme geometriche: sagoma larga L e riquadro della scritta
    const GEO = {
      tondo: (L) => [C2(0, 0, L / 2, 96), { x: 0, y: 0, w: 0.72 * L, h: 0.42 * L }],
      ovale: (L) => [R2(R2(CrossSection.circle(1, 96)).scale([L / 2, L * 0.36])), { x: 0, y: 0, w: 0.78 * L, h: 0.4 * L }],
      esagono: (L) => [soft(ngon(6, L, 30), 1), { x: 0, y: 0, w: 0.72 * L, h: 0.42 * L }],
      ottagono: (L) => [soft(ngon(8, L, 22.5), 1), { x: 0, y: 0, w: 0.74 * L, h: 0.44 * L }],
      quadrato: (L) => [soft(RECT(-L / 2, -L / 2, L / 2, L / 2), 0.16 * L), { x: 0, y: 0, w: 0.8 * L, h: 0.5 * L }],
      scudo: (L) => [shield(L), { x: 0, y: 0.08 * L, w: 0.66 * L, h: 0.32 * L }],
      goccia: (L) => [cen(R2(CrossSection.hull([C2(0, 0, L / 2, 96), C2(0, 0.72 * L, 0.5, 16)]))), { x: 0, y: -0.11 * L, w: 0.68 * L, h: 0.36 * L }],
      stella: (L) => [cen(soft(star(5, L / 1.902, L / 1.902 * 0.5), 1.2)), { x: 0, y: 0, w: 0.44 * L, h: 0.2 * L }],
      cuore: (L) => [heart(L), { x: 0, y: 0.08 * L, w: 0.6 * L, h: 0.3 * L }],
      fiore: (L) => [U([C2(0, 0, 0.24 * L, 64), ...[0, 1, 2, 3, 4, 5].map(i => C2(0.31 * L * Math.cos(i * Math.PI / 3), 0.31 * L * Math.sin(i * Math.PI / 3), 0.19 * L, 48))]), { x: 0, y: 0, w: 0.48 * L, h: 0.28 * L }],
    };
    // solo i contorni esterni: l'antivibrazione è pieno
    function fillHoles(c) {
      const area = (q) => { let a = 0; for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
      const outer = c.toPolygons().filter(q => area(q) > 0);
      return outer.length ? R2(CrossSection.ofPolygons(outer, 'NonZero')) : c;
    }
    // sagoma della forma scelta, larga L: { cs, box (riquadro della scritta), g (geometria del disegno, se è un disegno) }
    function shapeOf(p, L, notes) {
      const DEC = H.decor;
      if (!DEC.isArt(p.forma)) { const [cs, box] = (GEO[p.forma] || GEO.tondo)(L); return { cs, box }; }
      const art = DEC.artOf(p.forma, p.svg);
      if (!art) {
        notes.push(p.forma === 'svg' ? 'Carica un file SVG con il pulsante qui a sinistra' : 'Disegno non trovato: scegli un\'altra forma');
        const [cs, box] = GEO.tondo(L); return { cs, box };
      }
      const g = DEC.artGeom(art, 1.15 * L, L);
      // contorno di 0,8 mm, fessure chiuse, niente buchi; delle parti staccate resta la più grande
      let cs = fillHoles(OFF(OFF(OFF(g.sil, 0.8), 0.6), -0.6));
      const comps = cs.decompose().map(R2).sort((a, b) => b.area() - a.area());
      if (comps.length > 1) { cs = comps[0]; if (comps[1].area() > 1) notes.push('~Parti staccate del disegno tolte: l\'antivibrazione è un pezzo solo'); }
      const b = cs.bounds(), w = b.max[0] - b.min[0], h = b.max[1] - b.min[1];
      return { cs, box: { x: (b.min[0] + b.max[0]) / 2, y: (b.min[1] + b.max[1]) / 2, w: 0.7 * w, h: 0.36 * h }, g };
    }
    // colori del disegno a filo sulla faccia (filamenti 2–4), tolto il posto della scritta. ext come in applyText
    function drawFace(p, sh, clip, textCs, ext, body, notes) {
      if (!sh.g || p.coloriDisegno === false) return { body, parts: [] };
      const DEC = H.decor, t = Math.max(0.4, +p.rilievoTesto || 0.6);
      const slots = DEC.artSlots(sh.g, DEC.filaments(p), clip, +p.ugello || 0.4, notes, true), out = [];
      for (const k of [2, 3, 4]) {
        const c = D(slots[k], textCs ? OFF(textCs, 0.4) : null);
        if (empty(c)) continue;
        const m = reg(ext(c, -t, 0).intersect(body));
        if (m.isEmpty()) continue;
        body = sub(body, m);
        out.push([k, m]);
      }
      return { body, parts: out };
    }
    const fmt2 = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');   // calibri delle corde: servono i centesimi
    const grams = (ms) => ms.filter(Boolean).reduce((a, m) => a + m.volume(), 0) * 1.21 / 1000;   // TPU ≈ 1,21 g/cm³

    // la scritta (una sola riga) adattata al riquadro; null se non c'è
    function oneLine(p, bx, notes) {
      if (!String(p.scritta || '').trim()) return null;
      const tf = H.decor.fitText(Object.assign({}, p, { scritta2: '' }), bx, p.altTesto);
      if (tf && tf.reduced) notes.push('~Scritta ridotta per starci: accorciala o ingrandisci il pezzo');
      return tf;
    }
    // applica la scritta (cs nel piano della faccia) a un corpo: in rilievo, a filo colorata o incisa.
    // ext(cs, a, b) estrude la sezione tra la quota a e b misurate dalla faccia verso l'esterno (negative = dentro)
    function applyText(body, cs, ext, p) {
      const t = Math.max(0.2, +p.rilievoTesto || 0.6);
      if (p.stileTesto === 'incisa') return { body: sub(body, ext(cs, -t, 1)), text: null };
      if (p.stileTesto === 'filo') { const tm = reg(ext(cs, -t, 0).intersect(body)); return { body: sub(body, tm), text: tm }; }
      return { body, text: ext(cs, -0.01, t) };
    }
    const styleName = (p) => ({ incisa: 'incisa', filo: 'a filo, colorata' }[p.stileTesto] || 'in rilievo');

    // ============ TENNIS ============
    const SCHEMI = { '16x19': 12.5, '18x20': 10.5 };
    // tassello che si incastra nello spazio tra due corde, nel piano x,z, centrato in xc. Le corde vanno da z = -g a z = 0:
    // collo largo quanto lo spazio più la presa, sotto un dentino a gradino che scatta sotto le corde (il verme si stampa di fianco)
    function plugProf(xc, w, g) {
      const a = 0.8, hl = 2.2, z0 = -g, tip = Math.max(1.2, w - 1.2);
      return U([RECT(xc - w / 2, z0 - 0.01, xc + w / 2, 0.01),
        P2([[xc - w / 2, z0 + 0.01], [xc + w / 2, z0 + 0.01], [xc + w / 2 + a, z0 + 0.01], [xc + w / 2 + a, z0 - a - 0.3], [xc + tip / 2, z0 - hl], [xc - tip / 2, z0 - hl], [xc - w / 2 - a, z0 - a - 0.3], [xc - w / 2 - a, z0 + 0.01]])]);
    }
    function tennis(p) {
      const S = p.schema === 'misura' ? +p.interasse : SCHEMI[p.schema] || 12.5;
      const g = +p.calibro, gap = S - g, w = gap + (+p.presa || 0);   // tassello più largo dello spazio tra le corde: lo stringono
      const parts = [], info = [], notes = [], G = 'Antivibrazione';
      let body, text = null, markM = null, drawn = [], back = null;
      if (p.modello === 'verme') {
        const Lw = +p.lunghezza, hh = +p.altVerme, T = +p.spessore;
        // corde coperte, in numero pari: i tasselli vanno a spazi alterni (se no i dentini vicini si uniscono sotto la corda) e restano simmetrici
        const n = Math.max(2, 2 * Math.floor((Math.floor((Lw - hh) / S) + 1) / 2)), np = n / 2;
        // profilo nel piano x,z: striscia con le punte tonde appoggiata sopra le corde, un tassello ogni due spazi tra le corde
        const bar = U([RECT(-Lw / 2 + hh / 2, 0, Lw / 2 - hh / 2, hh), C2(-Lw / 2 + hh / 2, hh / 2, hh / 2, 64), C2(Lw / 2 - hh / 2, hh / 2, hh / 2, 64)]);
        const prof = U([bar, ...Array.from({ length: np }, (_, i) => plugProf((2 * i + 0.5 - (n - 1) / 2) * S, w, g))]);
        body = prismY(prof, T / 2, -T / 2);
        info.push(['Misure', `${fmt(Lw)} × ${fmt(hh)} mm, spessore ${fmt(T)} mm`]);
        info.push(['Tasselli', `${np}, a spazi alterni tra ${n} corde, larghi ${fmt2(w)} mm (spazio ${fmt2(gap)} mm), sporgono ${fmt(g + 2.2)} mm sotto`]);
        const tf = oneLine(p, { x: 0, y: hh / 2, w: Lw - hh, h: hh - 1.6 }, notes);
        // la faccia davanti è y = -T/2: "fuori" è verso -y. Il marchio SP nell'angolo in basso, stesso stile della scritta
        const faceV = OFF(D(bar, RECT(-Lw, -1, Lw, 0.6)), -0.6), mk = H.decor.placeMark(faceV, p, notes, tf && tf.cs, 0.3);
        const extV = (c, a, b) => prismY(c, -T / 2 - a, -T / 2 - b);
        if (tf) { const r = applyText(body, I(tf.cs, faceV), extV, p); body = r.body; text = r.text; info.push(['Lettere', `${fmt(tf.cap)} mm, ${styleName(p)}, sul fianco`]); }
        if (mk) { const r = applyText(body, mk, extV, p); body = r.body; markM = r.text; info.push(['Logo SP', `${styleName(p)}, sul fianco`]); }
        const flat = (m) => (m ? reg(m.rotate([-90, 0, 0])) : null);
        parts.push(part('Verme', body, p.col1, G, { print: flat(body) }));
        if (text) parts.push(part('Verme · scritta', text, p.col2, G, { print: flat(text) }));
        if (markM) parts.push(part('Verme · logo SP', markM, p['col' + H.decor.markCol(p, 2)], G, { print: flat(markM) }));
        info.push(['Montaggio', 'sotto l\'ultima corda orizzontale, appoggiato sulle corde verticali: spingi ogni tassello nel suo spazio tra due corde finché il dentino scatta sotto']);
        info.push(['Stampa', 'sdraiato, scritta in alto']);
      } else {
        let L = +p.larghezza;
        if (L < S + g + 4) { L = S + g + 4; notes.push(`~Larghezza portata a ${fmt(L)} mm: deve coprire le due corde`); }
        // la forma deve avere materiale sopra tutte e due le corde: se non ce l'ha la allargo
        const covers = (c) => [-1, 1].every(sg => { const a = S / 2 + g / 2 + 0.2, st = I(c, sg > 0 ? RECT(a, -1e3, a + 1.4, 1e3) : RECT(-a - 1.4, -1e3, -a, 1e3)); return !empty(st) && st.area() > 5; });
        const L0 = L, shN = [];
        let sh = shapeOf(p, L, shN);
        while (!covers(sh.cs) && L < 1.35 * L0) { L += 1.5; shN.length = 0; sh = shapeOf(p, L, shN); }
        if (!covers(sh.cs)) {
          // forma troppo stretta dove passano le corde: resta della sua misura e sopra le corde le aggiungo una fascia
          L = L0; shN.length = 0; sh = shapeOf(p, L, shN);
          const xb = S / 2 + g / 2 + 2.2;
          sh.cs = U([sh.cs, soft(RECT(-xb, -4, xb, 4), 2)]);
          shN.push('~Forma stretta dove passano le corde: aggiunta una fascia che le copre');
        } else if (L > L0) shN.push(`~Forma allargata a ${fmt(L)} mm: deve coprire le due corde`);
        // come quelli in commercio: due dischi uguali, uno davanti e uno dietro le corde, uniti al centro da un blocchetto che
        // si incastra nello spazio tra le due corde centrali. Simmetrico rispetto al piano delle corde (z = 0, corde tra
        // z = -g/2 e g/2): ogni pezzo ha il suo disco e metà blocchetto. Dentro, il pezzo dietro ha il perno e quello
        // davanti la sede in cui scatta: così si stampano piatti senza supporti, davanti a faccia in su, dietro a faccia in giù
        const W = w + 1.6;
        if (!(I(sh.cs, RECT(-W / 2, -1e3, W / 2, 1e3)) && I(sh.cs, RECT(-W / 2, -1e3, W / 2, 1e3)).area() > 4 * W)) {
          sh.cs = U([sh.cs, soft(RECT(-W / 2 - 1, -4, W / 2 + 1, 4), 2)]);
          shN.push('~Forma vuota al centro: aggiunta una fascia sopra il blocchetto');
        }
        notes.push(...shN);
        const cs = sh.cs, bb = cs.bounds(), hg = g / 2;
        const strip = I(cs, RECT(-w / 2 - 1, -1e3, w / 2 + 1, 1e3)), sb = strip.bounds();
        const Lp = Math.max(6, Math.min(12, 0.6 * (sb.max[1] - sb.min[1]))), yc = (sb.min[1] + sb.max[1]) / 2;
        // perno: gambo, testa con i fianchi a 45° e punta smussata; la sede ha l'imbocco più stretto del gambo e il tetto conico
        const ds = Math.max(2.4, Math.min(4, w - 2.4, Lp - 2.4)), dh = ds + 1.2, h1 = 1.2, hP = h1 + 1 + (dh - ds + 1) / 2;
        const de = ds - 0.2, dc = dh + 0.1, zr = h1 + 1.05 + (dc - ds + 1) / 2;
        const sk = 1 + (p.stileTesto !== 'rilievo' || (sh.g && p.coloriDisegno !== false) ? Math.max(0.4, +p.rilievoTesto || 0.6) : 0);   // pelle sopra la sede
        let Ht = +p.altezza;
        if (Ht < zr + sk - hg) { Ht = Math.ceil((zr + sk - hg) * 2) / 2; notes.push(`~Dischi portati a ${fmt(Ht)} mm: devono contenere la sede del perno`); }
        // disco con lo smusso a 45° sul bordo di fuori (il dietro lo ha sul piatto: col tondo andrebbe a sbalzo) e 0,4 mm verso le corde
        const cF = Math.min(1.2, Ht / 4);
        const disc = (z0, z1, outTop) => {
          const n = 4, out = [EXT(cs, z0 + (outTop ? 0.4 : cF), z1 - (outTop ? cF : 0.4))];
          for (let k = 0; k < n; k++) {
            const d = cF * (k + 1) / n, hc = cF / n;
            out.push(outTop ? EXT(OFF(cs, -d), z1 - cF + k * hc - 0.01, z1 - cF + (k + 1) * hc) : EXT(OFF(cs, -d), z0 + cF - (k + 1) * hc, z0 + cF - k * hc + 0.01));
          }
          out.push(outTop ? EXT(OFF(cs, -0.3), z0, z0 + 0.41) : EXT(OFF(cs, -0.3), z1 - 0.41, z1));
          return union(out.filter(Boolean));
        };
        const at = (m) => reg(m.translate([0, yc, 0]));
        const peg = at(union([coneZ(ds / 2, ds / 2, -0.01, h1 + 0.01, 32), coneZ(ds / 2, dh / 2, h1, h1 + 0.6, 32), coneZ(dh / 2, dh / 2, h1 + 0.59, h1 + 1.01, 32), coneZ(dh / 2, (ds - 1) / 2, h1 + 1, hP, 32)]));
        const socket = at(union([coneZ(de / 2, de / 2, -1, h1 + 0.01, 32), coneZ(de / 2, dc / 2, h1, h1 + 0.05 + (dc - de) / 2, 32), coneZ(dc / 2, dc / 2, h1 + 0.04 + (dc - de) / 2, h1 + 1.06, 32), coneZ(dc / 2, (ds - 1) / 2 + 0.05, h1 + 1.05, zr, 32)]));
        // blocchetto tra le corde, alto quanto la corda e diviso a metà: le corde lo stringono di fianco e i dischi le chiudono
        const bk = soft(RECT(-w / 2, yc - Lp / 2, w / 2, yc + Lp / 2), Math.min(1.5, w / 2 - 0.2));
        back = union([disc(-hg - Ht, -hg, false), EXT(bk, -hg - 0.01, 0), peg]);
        body = sub(union([disc(hg, hg + Ht, true), EXT(bk, 0, hg + 0.01)]), socket);
        const top = hg + Ht;
        info.push(['Misure', `${fmt(bb.max[0] - bb.min[0])} × ${fmt(bb.max[1] - bb.min[1])} mm, due dischi uguali da ${fmt(Ht)} mm, in tutto ${fmt(2 * Ht + g)} mm`]);
        info.push(['Corde', `parte centrale larga ${fmt2(w)} mm e lunga ${fmt(Lp)} mm nello spazio di ${fmt2(gap)} mm tra corde da ${fmt2(g)} mm`]);
        info.push(['Perno', `Ø ${fmt(ds)} mm con la testa da ${fmt(dh)} mm, dentro: scatta nella sede del disco davanti`]);
        const tf = oneLine(p, sh.box, notes), faceC = OFF(cs, -cF - 0.4), ext = (c, a, b) => EXT(c, top + a, top + b);
        const mk = H.decor.placeMark(faceC, p, notes, tf && tf.cs, 0), tcs = U([tf ? I(tf.cs, faceC) : null, mk]);   // marchio SP: stesso stile della scritta, colore suo
        const dr = drawFace(p, sh, faceC, tcs, ext, body, notes);
        body = dr.body; drawn = dr.parts;
        if (tf) { const r = applyText(body, I(tf.cs, faceC), ext, p); body = r.body; text = r.text; info.push(['Lettere', `${fmt(tf.cap)} mm, ${styleName(p)}`]); }
        if (mk) { const r = applyText(body, mk, ext, p); body = r.body; markM = r.text; info.push(['Logo SP', `${styleName(p)}, sulla faccia`]); }
        const GF = 'Antivibrazione · davanti', GB = 'Antivibrazione · dietro';
        parts.push(part('Disco davanti', body, p.col1, GF));
        if (text) parts.push(part('Disco davanti · scritta', text, p.col2, GF));
        if (markM) parts.push(part('Disco davanti · logo SP', markM, p['col' + H.decor.markCol(p, 2)], GF));
        for (const [k, m] of drawn) parts.push(part(`Disco davanti · disegno colore ${k}`, m, p['col' + k], GF));
        parts.push(part('Disco dietro', back, p.col1, GB));
        info.push(['Montaggio', 'tra le due corde verticali centrali, sotto l\'ultima orizzontale: da dietro infila la parte centrale nello spazio tra le corde, poi da davanti premi il disco con la scritta sul perno finché scatta']);
        info.push(['Stampa', 'due pezzi piatti, senza supporti: il disco davanti con la scritta in alto, il disco dietro a faccia in giù con il perno in alto']);
      }
      info.splice(1, 0, ['Peso', `circa ${fmt(grams([body, back, text, markM, ...drawn.map(d => d[1])]))} g in TPU`]);
      const cols = new Set([...(text ? [2] : []), ...(markM ? [H.decor.markCol(p, 2)] : []), ...drawn.map(d => d[0])]), Ht0 = p.modello === 'verme' ? +p.spessore : body.boundingBox().max[2];   // in stampa: faccia con la scritta in alto
      const tc = Math.max(0.4, +p.rilievoTesto || 0.6);
      if (cols.size > 1) info.push(['Colori', `${cols.size + 1} filamenti: serve una stampante multicolore (AMS, MMU)`]);
      else if (cols.size) info.push(['Stampante a un colore', `cambia filamento a ${fmt(p.stileTesto === 'rilievo' && (text || markM) ? Ht0 : Ht0 - tc)} mm${p.modello === 'verme' ? '' : ' (solo il disco davanti)'}`]);
      info.push(['Materiale', 'TPU morbido (85A–95A) o TPE; più morbido smorza di più. Riempimento gyroid 30–50%, 3 pareti, 20 mm/s, brim']);
      info.push(['Regole', 'ITF: l\'antivibrazione va fuori dall\'incrocio delle corde']);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: p.modello === 'verme' ? [0.2, -1, 0.35] : [-0.3, -0.8, 1] };
    }

    // ============ PADEL ============
    function padel(p) {
      const df = +p.foro, ds = df + (+p.presa || 0), rs = ds / 2, n = Math.max(1, p.copie | 0);
      const parts = [], info = [], notes = [];
      let body, text = null, top, headD, sh, headT;
      if (p.tipo === 'passante') {
        const Lp = Math.max(10, +p.spRacchetta - 0.5), tc = 1.4;
        headD = df + 3; top = Lp + tc; headT = tc;
        sh = { cs: C2(0, 0, headD / 2, 64), box: GEO.tondo(headD)[1] };
        const rib = (z) => union([coneZ(rs, rs + 0.5, z, z + 0.8, 64), coneZ(rs + 0.5, rs, z + 0.8, z + 1.8, 64)]);
        body = union([coneZ(rs - 0.5, rs, 0, 1, 64), cylZ(rs, 1 - 0.01, Lp + 0.01, 0, 0, 64), rib(Lp * 0.3), rib(Lp * 0.62),
          roundExt(C2(0, 0, headD / 2, 64), Lp, top, 0.4, 0.3)]);
        body = sub(body, cylZ(Math.max(1.5, rs - 2), -1, Lp - 1, 0, 0, 48));   // vuoto dentro: più leggero e più morbido
        info.push(['Misure', `Ø ${fmt(ds)} × ${fmt(Lp)} mm, colletto Ø ${fmt(headD)} mm`]);
        info.push(['Montaggio', `infilalo in un foro finché il colletto appoggia: arriva quasi all'altra faccia (racchetta da ${fmt(+p.spRacchetta)} mm)`]);
      } else {
        const Ls = +p.gambo, th = +p.spTesta;
        headD = Math.max(+p.diamTesta, df + 3); top = Ls + th; headT = th;
        sh = shapeOf(p, headD, notes);
        sh.cs = U([sh.cs, C2(0, 0, rs + 1.5, 64)]);   // la testa copre sempre il gambo
        const zb = Math.min(3, Ls * 0.35);
        // gambo con dentino: imbocco conico, poi il gradino che fa presa
        body = union([coneZ(rs - 0.6, rs + 0.8, 0, zb, 64), cylZ(rs, zb - 0.01, Ls + 0.01, 0, 0, 64),
          roundExt(sh.cs, Ls, top, 0.4, 0.6)]);
        // foro e taglio nel gambo: si stringe entrando
        body = sub(body, union([cylZ(Math.max(1, rs * 0.45), -1, Ls - 1, 0, 0, 32), H.box(-0.8, -rs - 2, -1, 0.8, rs + 2, Ls * 0.7)]));
        info.push(['Misure', `testa ${fmt(headD)} mm, gambo Ø ${fmt(ds)} × ${fmt(Ls)} mm`]);
        info.push(['Montaggio', 'spingi il gambo nel foro finché il dentino scatta e la testa appoggia']);
      }
      const pt = Object.assign({}, p, { rilievoTesto: Math.min(+p.rilievoTesto || 0.6, headT - 0.4) });   // lettere e disegno non bucano la testa
      const tf = oneLine(p, sh.box, notes), faceC = OFF(sh.cs, -0.8), ext = (c, a, b) => EXT(c, top + a, top + b);
      const mk = H.decor.placeMark(faceC, p, notes, tf && tf.cs, 0), tcs = U([tf ? I(tf.cs, faceC) : null, mk]);   // marchio SP: stesso stile della scritta, colore suo
      const dr = drawFace(pt, sh, faceC, tcs, ext, body, notes);
      body = dr.body;
      let markM = null;
      if (tf) { const r = applyText(body, I(tf.cs, faceC), ext, pt); body = r.body; text = r.text; info.push(['Lettere', `${fmt(tf.cap)} mm, ${styleName(p)}`]); }
      if (mk) { const r = applyText(body, mk, ext, pt); body = r.body; markM = r.text; info.push(['Logo SP', `${styleName(p)}, sulla testa`]); }
      // la testa va sul piatto: in stampa il pezzo è capovolto
      const flip = (m) => (m ? reg(m.rotate([0, 180, 0])) : null), gap = headD + 6;
      for (let i = 0; i < n; i++) {
        const G = n > 1 ? `Antivibrazione ${i + 1}` : 'Antivibrazione', at = [(i - (n - 1) / 2) * gap, 0, 0];
        parts.push(part(G, body, p.col1, G, { print: flip(body), at }));
        if (text) parts.push(part(`${G} · scritta`, text, p.col2, G, { print: flip(text), at }));
        if (markM) parts.push(part(`${G} · logo SP`, markM, p['col' + H.decor.markCol(p, 2)], G, { print: flip(markM), at }));
        for (const [k, m] of dr.parts) parts.push(part(`${G} · disegno colore ${k}`, m, p['col' + k], G, { print: flip(m), at }));
      }
      info.splice(1, 0, ['Peso', `circa ${fmt(grams([body, text, markM, ...dr.parts.map(d => d[1])]))} g l'uno in TPU`]);
      info.push(['Pezzi', `${n}, con la testa sul piatto`]);
      info.push(['Dove', 'a coppie, uno per faccia nello stesso punto: in alto più potenza, verso il manico più controllo']);
      const cols = new Set([...(text ? [2] : []), ...(markM ? [H.decor.markCol(p, 2)] : []), ...dr.parts.map(d => d[0])]);
      if (cols.size > 1) info.push(['Colori', `${cols.size + 1} filamenti: serve una stampante multicolore (AMS, MMU)`]);
      else if (cols.size) info.push(['Stampante a un colore', `i colori sono nei primi ${fmt(pt.rilievoTesto)} mm: inizia col colore ${[...cols][0]} e cambia filamento dopo`]);
      info.push(['Materiale', 'TPU morbido (85A–95A) o TPE, riempimento 30–50%, 20 mm/s. Prova prima un pezzo: se è lento aumenta la presa']);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [-0.4, -0.9, 0.7] };
    }

    // avvisi sui loghi in fondo, come gli altri generatori con scritte
    const withNotes = (fn) => (p) => { const N = H.decor.NOTES; N.clear(); const r = fn(p); for (const x of N) r.info.push(['Nota', x]); N.clear(); return r; };
    return { tennis: withNotes(tennis), padel: withNotes(padel) };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

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
    function shape(forma, L) {
      if (forma === 'ovale') return R2(R2(CrossSection.circle(1, 96)).scale([L / 2, L * 0.36]));
      if (forma === 'esagono') return soft(R2(R2(CrossSection.circle(L / 2 / Math.cos(Math.PI / 6), 6)).rotate(30)), 1);
      if (forma === 'cuore') return heart(L);
      return C2(0, 0, L / 2, 96);
    }
    // riquadro della scritta su ogni sagoma
    const textBox = (forma, L) => (forma === 'cuore' ? { x: 0, y: 0.08 * L, w: 0.6 * L, h: 0.3 * L } : forma === 'ovale' ? { x: 0, y: 0, w: 0.78 * L, h: 0.4 * L } : { x: 0, y: 0, w: 0.72 * L, h: 0.42 * L });
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
    function tennis(p) {
      const S = p.schema === 'misura' ? +p.interasse : SCHEMI[p.schema] || 12.5;
      const g = +p.calibro, dc = Math.max(0.6, g - (+p.presa || 0));   // canale più stretto della corda: la tiene ferma
      const parts = [], info = [], notes = [], G = 'Antivibrazione';
      let body, text = null;
      if (p.modello === 'verme') {
        const Lw = +p.lunghezza, hh = +p.altVerme, T = +p.spessore;
        const dn = Math.min(4, hh * 0.42), n = Math.max(2, Math.floor((Lw - hh) / S) + 1);
        // profilo nel piano x,z: striscia con le punte tonde e le tacche per le corde sul bordo di sotto
        let prof = U([RECT(-Lw / 2 + hh / 2, 0, Lw / 2 - hh / 2, hh), C2(-Lw / 2 + hh / 2, hh / 2, hh / 2, 64), C2(Lw / 2 - hh / 2, hh / 2, hh / 2, 64)]);
        const slots = [];
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * S;
          slots.push(RECT(x - dc / 2, -1, x + dc / 2, dn - dc / 2), C2(x, dn - dc / 2, dc / 2, 24), P2([[x - dc / 2 - 0.8, -0.01], [x + dc / 2 + 0.8, -0.01], [x + dc / 2, 0.8], [x - dc / 2, 0.8]]));
        }
        prof = D(prof, U(slots));
        body = prismY(prof, T / 2, -T / 2);
        info.push(['Misure', `${fmt(Lw)} × ${fmt(hh)} mm, spessore ${fmt(T)} mm`]);
        info.push(['Tacche', `${n}, ogni ${fmt(S)} mm, larghe ${fmt2(dc)} mm e profonde ${fmt(dn)} mm`]);
        const tf = oneLine(p, { x: 0, y: dn + (hh - dn) / 2, w: Lw - hh, h: hh - dn - 1.6 }, notes);
        if (tf) {
          // la faccia davanti è y = -T/2: "fuori" è verso -y
          const face = I(tf.cs, OFF(D(prof, RECT(-Lw, -1, Lw, dn + 0.6)), -0.6));
          const r = applyText(body, face, (c, a, b) => prismY(c, -T / 2 - a, -T / 2 - b), p);
          body = r.body; text = r.text;
          info.push(['Lettere', `${fmt(tf.cap)} mm, ${styleName(p)}, sul fianco`]);
        }
        const flat = (m) => (m ? reg(m.rotate([-90, 0, 0])) : null);
        parts.push(part('Verme', body, p.col1, G, { print: flat(body) }));
        if (text) parts.push(part('Verme · scritta', text, p.col2, G, { print: flat(text) }));
        info.push(['Montaggio', 'sotto l\'ultima corda orizzontale, infilando una tacca su ogni corda verticale']);
        info.push(['Stampa', 'sdraiato, scritta in alto']);
      } else {
        let L = +p.larghezza;
        const Ht = +p.altezza, mouth = Math.max(0.5, 0.65 * g), zc = 0.8 + dc / 2;
        if (L < S + dc + 4) { L = S + dc + 4; notes.push(`~Larghezza portata a ${fmt(L)} mm: deve coprire le due corde`); }
        const cs = shape(p.forma, L);
        body = roundExt(cs, 0, Ht, Math.min(1.4, Ht / 4), 0.4);
        // due canali passanti lungo y sotto il bottone: buco di serratura con imbocco svasato, la corda entra di scatto
        const ch = [];
        for (const x of [-S / 2, S / 2]) {
          ch.push(C2(x, zc, dc / 2, 24), RECT(x - mouth / 2, -1, x + mouth / 2, zc), P2([[x - mouth / 2 - 0.7, -0.01], [x + mouth / 2 + 0.7, -0.01], [x + mouth / 2, 0.5], [x - mouth / 2, 0.5]]));
        }
        body = sub(body, prismY(U(ch), L, -L));
        info.push(['Misure', `${fmt(L)} × ${fmt(cs.bounds().max[1] - cs.bounds().min[1])} mm, spessore ${fmt(Ht)} mm`]);
        info.push(['Corde', `canali a ${fmt(S)} mm, Ø ${fmt2(dc)} mm per corda da ${fmt2(g)} mm, sporgono ${fmt(zc + dc / 2)} mm sotto`]);
        const tf = oneLine(p, textBox(p.forma, L), notes);
        if (tf) {
          const face = I(tf.cs, OFF(cs, -Math.min(1.4, Ht / 4) - 0.4));
          const r = applyText(body, face, (c, a, b) => EXT(c, Ht + a, Ht + b), p);
          body = r.body; text = r.text;
          info.push(['Lettere', `${fmt(tf.cap)} mm, ${styleName(p)}`]);
        }
        parts.push(part('Bottone', body, p.col1, G));
        if (text) parts.push(part('Bottone · scritta', text, p.col2, G));
        info.push(['Montaggio', 'tra le due corde verticali centrali, sotto l\'ultima orizzontale: premi finché le corde scattano nei canali']);
        info.push(['Stampa', 'canali sul piatto, scritta in alto, senza supporti']);
      }
      info.splice(1, 0, ['Peso', `circa ${fmt(grams([body, text]))} g in TPU`]);
      if (p.stileTesto === 'filo' && text) info.push(['Stampante a un colore', 'cambia filamento all\'altezza della scritta']);
      info.push(['Materiale', 'TPU morbido (85A–95A) o TPE; più morbido smorza di più. Riempimento gyroid 30–50%, 3 pareti, 20 mm/s, brim']);
      info.push(['Regole', 'ITF: l\'antivibrazione va fuori dall\'incrocio delle corde']);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: p.modello === 'verme' ? [0.2, -1, 0.35] : [-0.3, -0.8, 1] };
    }

    // ============ PADEL ============
    function padel(p) {
      const df = +p.foro, ds = df + (+p.presa || 0), rs = ds / 2, n = Math.max(1, p.copie | 0);
      const parts = [], info = [], notes = [];
      let body, text = null, top, headD;
      if (p.tipo === 'passante') {
        const Lp = Math.max(10, +p.spRacchetta - 0.5), tc = 1.4;
        headD = df + 3; top = Lp + tc;
        const rib = (z) => union([coneZ(rs, rs + 0.5, z, z + 0.8, 64), coneZ(rs + 0.5, rs, z + 0.8, z + 1.8, 64)]);
        body = union([coneZ(rs - 0.5, rs, 0, 1, 64), cylZ(rs, 1 - 0.01, Lp + 0.01, 0, 0, 64), rib(Lp * 0.3), rib(Lp * 0.62),
          roundExt(C2(0, 0, headD / 2, 64), Lp, top, 0.4, 0.3)]);
        body = sub(body, cylZ(Math.max(1.5, rs - 2), -1, Lp - 1, 0, 0, 48));   // vuoto dentro: più leggero e più morbido
        info.push(['Misure', `Ø ${fmt(ds)} × ${fmt(Lp)} mm, colletto Ø ${fmt(headD)} mm`]);
        info.push(['Montaggio', `infilalo in un foro finché il colletto appoggia: arriva quasi all'altra faccia (racchetta da ${fmt(+p.spRacchetta)} mm)`]);
      } else {
        const Ls = +p.gambo, th = +p.spTesta;
        headD = Math.max(+p.diamTesta, df + 3); top = Ls + th;
        const zb = Math.min(3, Ls * 0.35);
        // gambo con dentino: imbocco conico, poi il gradino che fa presa
        body = union([coneZ(rs - 0.6, rs + 0.8, 0, zb, 64), cylZ(rs, zb - 0.01, Ls + 0.01, 0, 0, 64),
          roundExt(shape(p.forma, headD), Ls, top, 0.4, 0.6)]);
        // foro e taglio nel gambo: si stringe entrando
        body = sub(body, union([cylZ(Math.max(1, rs * 0.45), -1, Ls - 1, 0, 0, 32), H.box(-0.8, -rs - 2, -1, 0.8, rs + 2, Ls * 0.7)]));
        info.push(['Misure', `testa ${fmt(headD)} mm, gambo Ø ${fmt(ds)} × ${fmt(Ls)} mm`]);
        info.push(['Montaggio', 'spingi il gambo nel foro finché il dentino scatta e la testa appoggia']);
      }
      const forma = p.tipo === 'passante' ? 'tondo' : p.forma;
      const tf = oneLine(p, textBox(forma, headD), notes);
      if (tf) {
        const face = I(tf.cs, OFF(forma === 'tondo' ? C2(0, 0, headD / 2, 64) : shape(forma, headD), -0.8));
        const r = applyText(body, face, (c, a, b) => EXT(c, top + a, top + b), Object.assign({}, p, { rilievoTesto: Math.min(+p.rilievoTesto || 0.6, top - (p.tipo === 'passante' ? +p.spRacchetta - 0.5 : +p.gambo) - 0.4) }));
        body = r.body; text = r.text;
        info.push(['Lettere', `${fmt(tf.cap)} mm, ${styleName(p)}`]);
      }
      // la testa va sul piatto: in stampa il pezzo è capovolto
      const flip = (m) => (m ? reg(m.rotate([0, 180, 0])) : null), gap = headD + 6;
      for (let i = 0; i < n; i++) {
        const G = n > 1 ? `Antivibrazione ${i + 1}` : 'Antivibrazione', at = [(i - (n - 1) / 2) * gap, 0, 0];
        parts.push(part(G, body, p.col1, G, { print: flip(body), at }));
        if (text) parts.push(part(`${G} · scritta`, text, p.col2, G, { print: flip(text), at }));
      }
      info.splice(1, 0, ['Peso', `circa ${fmt(grams([body, text]))} g l'uno in TPU`]);
      info.push(['Pezzi', `${n}, con la testa sul piatto`]);
      info.push(['Dove', 'a coppie, uno per faccia nello stesso punto: in alto più potenza, verso il manico più controllo']);
      if (text) info.push(['Stampante a un colore', `la scritta sono i primi ${fmt(Math.min(+p.rilievoTesto || 0.6, 1.2))} mm: inizia col colore 2 e cambia filamento dopo`]);
      info.push(['Materiale', 'TPU morbido (85A–95A) o TPE, riempimento 30–50%, 20 mm/s. Prova prima un pezzo: se è lento aumenta la presa']);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [-0.4, -0.9, 0.7] };
    }

    // avvisi sui loghi in fondo, come gli altri generatori con scritte
    const withNotes = (fn) => (p) => { const N = H.decor.NOTES; N.clear(); const r = fn(p); for (const x of N) r.info.push(['Nota', x]); N.clear(); return r; };
    return { tennis: withNotes(tennis), padel: withNotes(padel) };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

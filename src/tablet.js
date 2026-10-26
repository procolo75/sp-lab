// Supporti per tablet (schermi Home Assistant): cornice che abbraccia il tablet senza custodia, appoggiata su due piedini.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm: x larghezza, y profondità (schermo verso -y), z altezza.
// - la cornice ha un labbro davanti che copre solo il bordo nero; un lato è tutto aperto: da lì entra il tablet e lì
//   restano libere presa e tasti (sui Fire stanno tutti su un lato). Si stampa sulla schiena, senza supporti;
// - se è più grande del piatto si divide in due metà unite da code di rondine nella schiena (incastro a puzzle);
// - i piedini sono il blocco a cui si toglie la cornice inclinata: la cornice ci entra con il gioco.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function tablet(H) {
    const { Manifold, CrossSection, reg, union, sub, box, fmt } = H;
    // misure ufficiali: larghezza × altezza × spessore, tenuto in orizzontale
    const TABLETS = {
      fire10_2021: { name: 'Fire HD 10 (11ª gen., 2021)', W: 247, H: 166, T: 9.2 },
      fire8_2018: { name: 'Fire HD 8 (8ª gen., 2018)', W: 214, H: 128, T: 9.7 },
      fire7_2017: { name: 'Fire 7 (7ª gen., 2017)', W: 192, H: 115, T: 9.6 },
    };
    const WALL = 2.5, LIP = 2, RR = 4, BAND = 25, FOOT_W = 30, FLOOR = 3, DOVE_G = 0.15;
    const rrect = (x0, z0, x1, z1, r) => reg(reg(reg(CrossSection.square([x1 - x0 - 2 * r, z1 - z0 - 2 * r])).translate([x0 + r, z0 + r])).offset(r, 'Round', 2, 32));
    const slab = (cs, y0, y1) => reg(reg(reg(cs.extrude(y1 - y0)).rotate([90, 0, 0])).translate([0, y1, 0]));   // profilo nel piano (x, z), y fra y0 e y1

    function tablet(p) {
      const tb = p.modello === 'misura' ? { name: 'Misure tue', W: +p.larghezza, H: +p.altezza, T: +p.spessore } : TABLETS[p.modello] || TABLETS.fire10_2021;
      const notes = [];
      const g = +p.gioco, tilt = +p.inclinazione, bed = +p.piatto;
      const vert = p.orientamento === 'verticale';
      // la cornice si costruisce sempre col lato lungo su x; in verticale poi si gira di 90° (in alto va il lato sinistro)
      const A = Math.max(tb.W, tb.H), B = Math.min(tb.W, tb.H), T = tb.T;
      const w = A + 2 * g, h = B + 2 * g, t = T + 2 * g, X = w / 2 + WALL, Ztop = 2 * WALL + h;
      const split = Math.max(2 * X, Ztop) > bed;
      const bk = split ? 3 : 2;            // schiena: più spessa quando ci sono le code di rondine
      // lato aperto, nella cornice costruita in orizzontale
      const use = p.latoAperto;
      const open = !vert ? use : { sopra: 'sinistra', destra: 'sopra', sinistra: 'sotto' }[use];
      const ext = (x0, z0, x1, z1, e) => open === 'sopra' ? [x0, z0, x1, z1 + e] : open === 'destra' ? [x0, z0, x1 + e, z1] : open === 'sinistra' ? [x0 - e, z0, x1, z1] : [x0, z0 - e, x1, z1];

      let fr = slab(rrect(-X, 0, X, Ztop, RR), -LIP, t + bk);
      const [px0, pz0, px1, pz1] = ext(-w / 2, WALL, w / 2, WALL + h, 20);
      fr = sub(fr, box(px0, 0, pz0, px1, t, pz1));                                                  // tasca del tablet
      // labbri, lato per lato come si vede il tablet in uso; in verticale: sopra = sinistra della cornice costruita, destra = sopra, sotto = destra, sinistra = sotto
      const lb = (k) => Math.max(0, +p['bordo' + k] || 0);
      const ov = vert ? { L: lb('Sopra'), T: lb('Destra'), R: lb('Sotto'), B: lb('Sinistra') } : { L: lb('Sinistra'), T: lb('Sopra'), R: lb('Destra'), B: lb('Sotto') };
      const [sx0, sz0, sx1, sz1] = ext(-w / 2 + ov.L, WALL + ov.B, w / 2 - ov.R, WALL + h - ov.T, 20);
      fr = sub(fr, slab(rrect(sx0, sz0, sx1, sz1, Math.min(3, ...Object.values(ov).filter(v => v > 0))), -LIP - 1, 0.01));                              // finestra dello schermo
      const bw = Math.min(BAND, h / 4);
      fr = sub(fr, slab(rrect(-w / 2 + bw, WALL + bw, w / 2 - bw, WALL + h - bw, 10), t - 0.01, t + bk + 1));   // finestra sul retro

      // ---- divisione in due metà: taglio a x = 0, una coda di rondine nella fascia sotto e una in quella sopra ----
      let frames = [fr];
      if (split) {
        const dove = (zc) => CrossSection.ofPolygons([[[-1, zc - 4], [0, zc - 4], [10, zc - 7], [10, zc + 7], [0, zc + 4], [-1, zc + 4]]]);
        const tabs = reg(CrossSection.union([dove((WALL + bw) / 2 + 1), dove(Ztop - bw / 2)]));
        const left = union([reg(fr.intersect(box(-X - 1, -50, -10, 0, 50, Ztop + 10))), reg(fr.intersect(slab(tabs, t, t + bk)))]);
        const right = sub(reg(fr.intersect(box(0, -50, -10, X + 1, 50, Ztop + 10))), slab(reg(tabs.offset(DOVE_G, 'Miter')), t - 0.5, t + bk + 1));
        frames = [left, right];
        if (2 * X / 2 + 10 > bed) notes.push('~Anche le metà sono più grandi del piatto');
      }

      // tablet di esempio (solo per vederlo), stessa costruzione
      const ghost = union([box(-A / 2, g, WALL + g, A / 2, g + T, WALL + g + B), box(-A / 2 + 12, g - 0.3, WALL + g + 12, A / 2 - 12, g, WALL + g + B - 12)]);

      // ---- da cornice in orizzontale a cornice in uso: girata se verticale, inclinata all'indietro, appoggiata sui piedini ----
      const turn = (m) => (vert ? reg(reg(m.rotate([0, 90, 0])).translate([0, 0, X])) : m);   // in verticale: lato lungo su z, sinistra in alto
      const lean = (m) => reg(reg(m.translate([0, LIP, 0])).rotate([-tilt, 0, 0]));
      const z0 = lean(turn(fr)).boundingBox().min[2];
      const place = (m) => reg(lean(turn(m)).translate([0, 0, FLOOR - z0]));
      const Xu = vert ? Ztop / 2 : X;                                                           // mezza larghezza in uso
      const shift = vert ? -Ztop / 2 : 0;                                                       // in verticale la cornice va centrata su x
      const at = (m) => reg(place(m).translate([shift, 0, 0]));

      // piedini: blocco col profilo, meno la cornice (con gioco) inclinata; davanti restano sotto lo schermo
      const th = LIP + t + bk, fg = 0.25;
      const prof = reg(CrossSection.ofPolygons([[[-12, 0], [75, 0], [75, 4], [38, 50], [18, 50], [6, 8], [-12, 8]]]));
      const outerU = vert ? [Ztop, 2 * X] : [2 * X, Ztop];
      const cutter = reg(reg(reg(Manifold.cube([outerU[0] + 2, th + 2 * fg, 600])).translate([-outerU[0] / 2 - 1, -fg, -fg])).rotate([-tilt, 0, 0]));
      const foot = sub(reg(reg(reg(prof.extrude(FOOT_W)).rotate([90, 0, 90])).translate([-FOOT_W / 2, 0, 0])), reg(cutter.translate([0, 0, FLOOR - z0])));
      const fx = Math.min(Xu - FOOT_W / 2 - 10, Math.max(Xu * 0.6, FOOT_W));

      const parts = [];
      const flat = (m) => reg(m.rotate([-90, 0, 0]));                                           // sulla schiena
      if (frames.length === 1) parts.push({ name: 'Cornice', m: at(fr), role: 'body', print: flat(fr) });
      else frames.forEach((f, i) => parts.push({ name: `Cornice ${vert ? (i ? 'sotto' : 'sopra') : (i ? 'destra' : 'sinistra')}`, m: at(f), role: 'body', print: flat(f) }));
      const footPrint = reg(foot.rotate([0, 90, 0]));                                          // sul fianco: il profilo sta sul piatto
      for (const sx of [-1, 1]) parts.push({ name: `Piedino ${sx < 0 ? 'sinistro' : 'destro'}`, m: reg(foot.translate([sx * fx, 0, 0])), role: 'pin', print: footPrint });
      parts.push({ name: 'esempio', m: at(ghost), role: 'ghost' });

      const lato = { sopra: 'in alto', destra: 'a destra', sinistra: 'a sinistra' }[use];
      const info = [
        ['Tablet', `${tb.name}: ${fmt(tb.W)} × ${fmt(tb.H)} × ${fmt(tb.T)} mm, ${vert ? 'in verticale' : 'in orizzontale'}`],
        ['Cornice', `${fmt(outerU[0])} × ${fmt(outerU[1])} × ${fmt(th)} mm, gioco ${fmt(g)} mm per lato; labbri: ${['Sotto', 'Sopra', 'Sinistra', 'Destra'].filter(k => k.toLowerCase() !== use).map(k => `${k.toLowerCase()} ${fmt(lb(k))}`).join(', ')} mm`],
        ['Lato aperto', `${lato}: il tablet entra da lì e presa e tasti restano liberi. Mettilo dove il tuo tablet ha la presa di ricarica.`],
        ['Base', `due piedini larghi ${fmt(FOOT_W)} mm, inclinazione ${fmt(tilt)}°; la cornice ci entra con ${fmt(fg)} mm di gioco`],
      ];
      if (split) info.push(['Divisa in due', `la cornice (${fmt(Math.max(2 * X, Ztop))} mm) è più grande del piatto (${fmt(bed)} mm): due metà con due code di rondine nella schiena, gioco ${DOVE_G.toString().replace('.', ',')} mm. Si uniscono premendo; una goccia di colla se vuoi.`]);
      info.push(['Stampa', `cornice sulla schiena, piedini sul fianco: niente supporti`]);
      for (const n of notes) info.push(['Nota', n]);
      return { parts, info, view: [0.45, -1, 0.45] };
    }

    return { tablet };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

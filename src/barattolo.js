// Barattoli tondi con tappo a vite: filetto grosso a un principio, lungo poco meno di un giro, quindi si chiude con un giro solo.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto, barattolo chiuso centrato in (0, 0).
// - il collo è più stretto del corpo di quanto servono filetto e parete del tappo: chiuso, il tappo è a filo con il barattolo;
// - i filetti hanno i fianchi a 45° (niente supporti: il barattolo si stampa dritto, il tappo capovolto) e le punte che si
//   assottigliano agli estremi, così il tappo imbocca da solo;
// - il tappo chiude battendo sull'orlo del collo; sopra ha scritta, loghi e il tuo SVG, a filo (a colori) o incisi.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function barattolo(H) {
    const { Manifold, Mesh, CrossSection, reg, union, sub, cylZ, fmt } = H;
    const FORMATI = {
      piccolo: { D: 50, H: 45 }, medio: { D: 70, H: 70 }, grande: { D: 90, H: 100 }, alto: { D: 70, H: 130 }, largo: { D: 120, H: 80 },
    };
    const TIP = 1, EMB = 0.5, ARC = 330, TAPER = 40, M = 1;   // punta del filetto, quanto entra nella parete, giro del filetto (°), tratto che si assottiglia (°), margini sul collo

    // filetto lungo ARC gradi attorno al cilindro di raggio R (dir 1: sporge verso fuori, -1: verso dentro), dal centro z0 che sale di P a giro.
    // Sezione a trapezio con i fianchi a 45°: alla parete è larga b = TIP + 2 td; entra EMB nella parete per unirsi bene.
    function rib(R, dir, z0, P, td, seg) {
      const n = Math.max(24, Math.round(seg * ARC / 360)), hb = TIP / 2 + td, pts = [], tri = [];
      for (let i = 0; i <= n; i++) {
        const a = ARC * i / n, t = Math.min(1, a / TAPER, (ARC - a) / TAPER), s = t * t * (3 - 2 * t), d = td * s;
        const z = z0 + P * a / 360, ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
        for (const [u, v] of [[-EMB, -(hb + EMB)], [d, -(hb - d)], [d, hb - d], [-EMB, hb + EMB]]) { const r = R + dir * u; pts.push(r * ca, r * sa, z + v); }
      }
      const q = (a, b, c, d) => (dir > 0 ? tri.push(a, b, c, a, c, d) : tri.push(a, c, b, a, d, c));
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; q(4 * i + k, 4 * (i + 1) + k, 4 * (i + 1) + k1, 4 * i + k1); }
      q(0, 1, 2, 3); q(4 * n + 3, 4 * n + 2, 4 * n + 1, 4 * n);
      return reg(new Manifold(new Mesh({ numProp: 3, vertProperties: new Float32Array(pts), triVerts: new Uint32Array(tri) })));
    }
    const rev = (poly, seg) => reg(reg(CrossSection.ofPolygons([poly])).revolve(seg));

    function barattolo(p) {
      const f0 = FORMATI[p.formato];
      const Do = f0 ? f0.D : +p.diametro, Ht = f0 ? f0.H : +p.altezza;
      const w = +p.pareti, fl = +p.fondo, lt = +p.spCoperchio, g = +p.gioco;
      const notes = [], info = [];
      let td = +p.profFiletto, P = +p.passo;
      const Ro = Do / 2, seg = Math.max(96, Math.min(240, Math.round(Math.PI * Do / 1.2)));
      // il giro del tappo deve passare sopra il filetto del collo senza toccarlo: passo minimo
      const Pmin = 2 * TIP + 2 * td + g + 0.2;
      if (P < Pmin) { notes.push(`~Passo portato a ${fmt(Pmin)} mm: con un filetto profondo ${fmt(td)} mm il tappo non passerebbe`); P = Pmin; }
      const hb = TIP / 2 + td, dz = TIP + td;            // dz: il filetto del tappo sta sotto quello del collo, fianco contro fianco con il gioco
      const Rli = Ro - w, Rn = Rli - td - g, Rni = Rn - w;   // parete interna del tappo, esterno e interno del collo
      if (Rni < 6) return { parts: [], info: [['Nota', 'Barattolo troppo stretto per il filetto e le pareti: aumenta il diametro o riduci pareti e filetto']] };
      const rise = P * ARC / 360;
      const Hn = M + 2 * hb + dz + rise + M;                // collo: dal gradino all'orlo
      const zRim = Ht - lt, zSh = zRim - Hn, cone = Ro - w - Rni;   // orlo, gradino, raccordo interno a 45° sotto il collo
      if (zSh - cone < fl + 3) return { parts: [], info: [['Nota', `Barattolo troppo basso per il tappo a vite: servono almeno ${fmt(Math.ceil(lt + Hn + cone + fl + 3))} mm di altezza`]] };
      const zN = zSh + M + hb + dz;                         // centro dell'inizio del filetto del collo
      const ch = Math.min(0.8, w / 2);

      // ---- barattolo: profilo girato attorno all'asse, più il filetto del collo ----
      let jar = rev([[0, 0], [Ro - ch, 0], [Ro, ch], [Ro, zSh], [Rn, zSh], [Rn, zRim], [Rni, zRim], [Rni, zSh], [Ro - w, zSh - cone], [Ro - w, fl], [0, fl]], seg);
      jar = union([jar, rib(Rn, 1, zN, P, td, seg)]);
      const vol = rev([[0, fl], [Ro - w, fl], [Ro - w, zSh - cone], [Rni, zSh], [Rni, zRim], [0, zRim]], seg).volume() / 1000;

      // ---- tappo: piatto in cima e gonna con il filetto dentro; chiuso, la gonna resta 0,4 mm sopra il gradino ----
      const zS = zSh + 0.4;
      let lid = rev([[0, zRim], [Rli, zRim], [Rli, zS], [Ro - ch, zS], [Ro, zS + ch], [Ro, Ht - ch], [Ro - ch, Ht], [0, Ht]], seg);
      lid = union([lid, rib(Rli, -1, zN - dz, P, td, seg)]);
      if (p.zigrinatura) {
        // righe per la presa sulla gonna, lontane dagli smussi
        const n = Math.max(16, Math.round(2 * Math.PI * Ro / 4)), rn = Math.min(0.9, w * 0.4), cuts = [];
        for (let i = 0; i < n; i++) { const a = 2 * Math.PI * (i + 0.5) / n, rc = Ro + rn * 0.35; cuts.push(cylZ(rn, zS + ch + 0.6, Ht - ch - 0.6, rc * Math.cos(a), rc * Math.sin(a), 12)); }
        lid = sub(lid, union(cuts));
      }

      // ---- decorazione sopra il tappo: scritta, loghi e il tuo SVG (il tappo si stampa capovolto, la faccia di sopra sul piatto) ----
      const DEC = H.decor, lidCol = {};
      let decoInfo = null;
      if (DEC) DEC.NOTES.clear();
      const art = DEC && p.disegno === 'svg' ? DEC.artOf('svg', p.svg) : null;
      const F = DEC ? DEC.filaments(p, art) : [p.col1, p.col2, p.col3, p.col4];
      if (DEC) {
        const R2 = (c) => reg(c);
        const CU = (l) => { l = l.filter(c => c && !c.isEmpty()); return !l.length ? null : l.length === 1 ? l[0] : R2(CrossSection.union(l)); };
        const CD = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
        const CI = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
        const OFF = (c, d) => (c ? R2(c.offset(d, 'Round')) : null);
        const emptyC = (c) => !c || c.isEmpty() || c.area() < 0.05;
        const EZ = (c, z0, z1) => (emptyC(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
        const noz = +p.ugello || 0.4, st = p.stileCop === 'inciso' ? 'inciso' : 'filo', depth = Math.min(+p.profCop || 0.6, lt - 0.6);
        const hasT = [p.scritta, p.scritta2].some(x => x && String(x).trim());
        if (p.disegno === 'svg' && !art) notes.push('Carica un file SVG con il pulsante del riquadro "Il tuo disegno"');
        // zona libera: il cerchio di sopra, lontano dallo smusso e dalle righe; si impagina nel quadrato un po' più grande di quello inscritto
        const Rd = Ro - ch - (p.zigrinatura ? 2.5 : 1.5), area = R2(CrossSection.circle(Rd, seg)), L = 1.6 * Rd;
        let artCS = null, txt = null;
        let ts = Math.min(4, Math.max(2, +p.colTesto || 3));
        if (p.colTesto === 'auto' && root.SPLAB_SVG) ts = [2, 3, 4].sort((a, b) => root.SPLAB_SVG.dist(F[b - 1], F[0]) - root.SPLAB_SVG.dist(F[a - 1], F[0]))[0];
        if (art || hasT) {
          const thA = (((+p.rotDisegno || 0) % 360) + 360) % 360;
          const has1 = p.scritta && String(p.scritta).trim(), has2 = p.scritta2 && String(p.scritta2).trim();
          const tH = hasT ? 1.5 * ((has1 ? +p.altTesto : 0) + (has2 ? +p.altTesto2 || +p.altTesto : 0)) : 0, gap = art && hasT ? 3 : 0;
          const Sa = art ? Math.max(6, Math.min(+p.altDisegno, L - tH - gap, L)) : 0;
          const cy = (Sa + gap + tH) / 2;
          const slots = {};
          if (art) {
            const dP = Array.isArray(p.posDisegno) ? p.posDisegno : [0, 0], g0 = DEC.artGeom(art, Sa, L), acx = +dP[0] || 0, acy = cy - Sa / 2 + (+dP[1] || 0);
            const place = (c) => (c ? (thA ? R2(R2(R2(c.rotate(thA)).translate([acx, acy]))) : R2(c.translate([acx, acy]))) : null);
            artCS = st === 'filo' ? place(g0.sil) : (g0.lines ? place(g0.lines) : place(g0.sil));
            if (st === 'filo') {
              const sl = DEC.artSlots(g0, F, OFF(g0.sil, 0.01), noz, notes, true);
              for (const k of [2, 3, 4]) if (sl[k]) slots[k] = place(sl[k]);
              const sA = g0.sil.area(), cA = [2, 3, 4].reduce((s, k) => s + (sl[k] ? sl[k].area() : 0), 0);
              if (sA > 1 && cA < 0.05 * sA) notes.push('Il disegno ha quasi solo il colore del tappo (Colore 1), quindi a filo non si vede: dagli un colore diverso nei Colori 2–4, oppure cambia il Colore 1');
            }
          }
          if (hasT) {
            txt = DEC.fitLines(p, { x: 0, y: cy - Sa - gap - tH / 2, w: L, h: Math.max(4, tH), hMax: L }, [p.rotTesto, p.rotTesto2]);
            if (txt && txt.reduced) notes.push(`~Scritta ridotta a ${fmt(txt.cap)} mm per starci`);
          }
          for (const [c, nm, o] of [[txt && txt.cs, 'La scritta', 'a'], [artCS, 'Il disegno', 'o']]) {
            const kc = CI(c, area);
            if (c && (emptyC(kc) || kc.area() < c.area() * 0.98)) notes.push(`${nm} esce dal cerchio del tappo e viene tagliat${o}: rimpicciolisci${o === 'a' ? 'la' : 'lo'} o sposta${o === 'a' ? 'la' : 'lo'} con le frecce`);
          }
          const keep = (c) => CI(c, area);
          if (st === 'filo') {
            const tcs = txt ? keep(txt.cs) : null;
            for (const k of [2, 3, 4]) {
              let c = slots[k] ? keep(CD(slots[k], tcs ? OFF(tcs, 0.6) : null)) : null;
              if (k === ts) c = CU([c, tcs]);
              const sol = EZ(c, Ht - depth, Ht + 0.01);
              if (sol) lidCol[k] = reg(sol.intersect(lid));
            }
            decoInfo = `a filo, negli ultimi ${fmt(depth)} mm del tappo (che si stampano per primi): serve una stampante multicolore, o un cambio di filamento a ${fmt(depth)} mm dal piatto`;
          } else {
            const hole = CU([artCS ? keep(artCS) : null, txt ? keep(txt.cs) : null]);
            if (!emptyC(hole)) lid = sub(lid, EZ(hole, Ht - depth, Ht + 1));
            decoInfo = `inciso ${fmt(depth)} mm`;
          }
          if (txt && txt.cap < 4) notes.push('Lettere sotto i 4 mm: vengono poco leggibili. Ingrandisci la scritta o accorcia il testo');
        }
        // marchio SP in basso sul tappo (visto da sopra), lontano da scritta e disegno; stesso stile della scritta
        const mk = DEC.placeMark(area, p, notes, CU([txt ? txt.cs : null, artCS]), 0);
        if (mk) {
          if (st === 'filo') { const kM = DEC.markCol(p, ts), sol = EZ(mk, Ht - depth, Ht + 0.01); if (sol) lidCol[kM] = reg(union([lidCol[kM], sol.intersect(lid)].filter(Boolean))); }
          else lid = sub(lid, EZ(mk, Ht - depth, Ht + 1));
          if (!decoInfo) decoInfo = st === 'filo' ? `a filo, negli ultimi ${fmt(depth)} mm del tappo` : `inciso ${fmt(depth)} mm`;
        }
        if (hasT) DEC.logoNotes(noz);
        for (const k of [2, 3, 4]) if (lidCol[k]) lid = sub(lid, lidCol[k]);
      }

      // ---- pezzi: barattolo dritto, tappo accanto (capovolto per la stampa) ----
      const parts = [];
      const flip = (q) => reg(q.rotate([180, 0, 0]));
      const atL = p.__closed ? undefined : [2 * Ro + 12, 0, -zS];
      const colored = Object.keys(lidCol).length > 0;
      parts.push({ name: 'Barattolo', m: jar, role: 'body' });
      parts.push(Object.assign({ name: 'Tappo', m: lid, role: 'inner', print: flip(lid), at: atL }, colored ? { color: F[0], group: 'Tappo' } : {}));
      for (const k of [2, 3, 4]) if (lidCol[k]) parts.push({ name: `Tappo · colore ${k}`, m: lidCol[k], role: 'inner', print: flip(lidCol[k]), at: atL, color: F[k - 1], group: 'Tappo' });

      info.push(['Esterno', `Ø ${fmt(Do)} × ${fmt(Ht)} mm, chiuso`]);
      info.push(['Capienza', `circa ${vol >= 100 ? Math.round(vol / 10) * 10 : Math.round(vol)} ml`]);
      info.push(['Bocca', `Ø ${fmt(2 * Rni)} mm (il corpo dentro è Ø ${fmt(2 * (Ro - w))} mm: sotto il collo c'è un raccordo a 45°)`]);
      info.push(['Filetto', `un principio, passo ${fmt(P)} mm, profondo ${fmt(td)} mm, fianchi a 45°, gioco ${fmt(g)} mm; lungo ${ARC}°: si chiude con meno di un giro`]);
      info.push(['Tappo', `alto ${fmt(Ht - zS)} mm, a filo con il barattolo; chiude battendo sull'orlo del collo${p.zigrinatura ? ', righe per la presa' : ''}`]);
      if (decoInfo) info.push(['Tappo decorato', decoInfo]);
      info.push(['Stampa', 'barattolo dritto, tappo capovolto (la faccia di sopra sul piatto): niente supporti. Per alimenti: PETG o PP, e meglio una guarnizione']);
      if (td - g < 0.8) notes.push(`~Il filetto si aggancia solo per ${fmt(td - g)} mm: aumenta la profondità o riduci il gioco, sennò il tappo può saltare`);
      for (const x of notes) info.push(['Nota', x]);
      if (DEC) { for (const x of DEC.NOTES) info.push(['Nota', x]); DEC.NOTES.clear(); }
      const res = { parts, info, view: [0.6, -1, 0.7] };
      if (p.__check) {
        // chiuso e a ogni ottavo di giro mentre si svita: il tappo non deve toccare il barattolo
        res.closed = [];
        for (const a of [0, 45, 90, 180, 270, 330]) {
          const m = reg(reg(lid.rotate([0, 0, a])).translate([0, 0, P * a / 360 + 0.001]));
          res.closed.push(['svitato ' + a + '°', +reg(m.intersect(jar)).volume().toFixed(3)]);
        }
        // tirato su dritto senza girarlo deve incastrarsi: il filetto fa presa
        res.closed.push(['tirato su 1 mm', +reg(reg(lid.translate([0, 0, 1])).intersect(jar)).volume().toFixed(3)]);
      }
      return res;
    }

    return { barattolo };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

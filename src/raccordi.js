// Tubi e guarnizioni: O-ring (da stampare in TPU) e raccordi per tubi con filetto gas BSP e portagomma.
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto: i pezzi escono già come si stampano.
// - O-ring: misure AS568 (ISO 3601), misure tue o calcolate dalla sede (schiacciamento 20 %, cava larga 1,4 volte la corda);
//   sezione tonda (con il fondo appena appiattito per stare sul piatto), quadra o piatta (guarnizione piatta per i raccordi gas).
// - Raccordi: ogni uscita è un "braccio" costruito lungo +z e poi girato nella sua direzione; il mozzo al centro unisce
//   le basi dei bracci. Tutti i passaggi e i fondi cambiano diametro a 45°, così si stampa senza supporti (tranne il braccio del T). Filetto gas BSP con profilo Whitworth 55° (ISO 228 G cilindrico, ISO 7 R conico 1:16).
(function (root) {
  const IN = 25.4;
  // AS568: sigla → [Ø interno, corda] in pollici. Serie 0xx corda 1,78, 1xx 2,62, 2xx 3,53, 3xx 5,33.
  const AS568 = {};
  const id0 = { 6: 0.114, 7: 0.145, 8: 0.176, 9: 0.208, 10: 0.239 };
  for (let n = 6; n <= 30; n++) AS568['0' + String(n).padStart(2, '0')] = [n <= 10 ? id0[n] : 0.301 + (n - 11) * 0.0625, 0.070];
  for (let n = 110; n <= 140; n++) AS568[String(n)] = [0.362 + (n - 110) * 0.0625, 0.103];
  for (let n = 210; n <= 240; n++) AS568[String(n)] = [n <= 222 ? 0.734 + (n - 210) * 0.0625 : 1.609 + (n - 223) * 0.125, 0.139];
  for (let n = 325; n <= 349; n++) AS568[String(n)] = [1.475 + (n - 325) * 0.125, 0.210];
  // [Ø esterno, filetti per pollice, lunghezza utile ISO 7, distanza del piano di misura dalla punta (ISO 7)]
  const BSP = {
    g18: [9.728, 28, 6.5, 4.0, '1/8"'], g14: [13.157, 19, 9.7, 6.0, '1/4"'], g38: [16.662, 19, 10.1, 6.4, '3/8"'],
    g12: [20.955, 14, 13.2, 8.2, '1/2"'], g34: [26.441, 14, 14.5, 9.5, '3/4"'], g1: [33.249, 11, 16.8, 10.4, '1"'],
    g114: [41.910, 11, 19.1, 12.7, '1 1/4"'], g112: [47.803, 11, 19.1, 12.7, '1 1/2"'], g2: [59.614, 11, 23.4, 15.9, '2"'],
  };
  for (const k in BSP) { const b = BSP[k]; b.P = IN / b[1]; b.name = b[4]; }
  // per le liste dell'interfaccia (app.js)
  root.TUBI_DATI = { IN, AS568, BSP };
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function raccordi(H) {
    const { Manifold, CrossSection, reg, union, sub, fmt } = H;
    const fmt2 = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');

    // ================= O-RING =================
    const asMM = (k) => AS568[k] && [AS568[k][0] * IN, AS568[k][1] * IN];
    const cordaAuto = (d) => (d <= 10 ? 1.78 : d <= 30 ? 2.62 : d <= 70 ? 3.53 : 5.33);
    const SQUEEZE = 0.2, GW = 1.4;   // schiacciamento, larghezza cava / corda

    function ringSolid(ID, cs, sez, flat, h) {
      const Ri = ID / 2, seg = Math.max(64, Math.min(360, Math.round(Math.PI * (ID + 2 * cs) / 0.8)));
      let poly;
      if (sez === 'tonda') {
        const r = cs / 2, c = Ri + r, cut = flat ? 0.1 * cs : 0, n = 40, pts = [];
        // cerchio dal punto in basso a destra del taglio, in senso antiorario, fino al punto in basso a sinistra
        const t0 = -Math.PI / 2 + Math.acos((r - cut) / r);
        for (let i = 0; i <= n; i++) { const t = t0 + (2 * Math.PI - 2 * (t0 + Math.PI / 2)) * i / n; pts.push([c + r * Math.cos(t), r + r * Math.sin(t) - cut]); }
        poly = pts;
      } else if (sez === 'quadra') {
        const e = Math.min(0.2, cs * 0.08);
        poly = [[Ri + e, 0], [Ri + cs - e, 0], [Ri + cs, e], [Ri + cs, cs - e], [Ri + cs - e, cs], [Ri + e, cs], [Ri, cs - e], [Ri, e]];
      } else poly = [[Ri, 0], [Ri + cs, 0], [Ri + cs, h], [Ri, h]];
      return reg(reg(CrossSection.ofPolygons([poly])).revolve(seg));
    }

    // guarnizione piatta per i raccordi gas: sta in fondo alla femmina, quindi passa dentro il Ø di nocciolo del filetto
    const piattaBSP = (k) => { const b = BSP[k], D = b[0], Dm = D - 2 * WW_H * b.P; return { OD: Dm - 0.3, ID: Math.round(0.64 * D * 2) / 2, h: D < 18 ? 1.5 : 2 }; };

    function oring(p) {
      const info = [], notes = [];
      const sez = p.sezione || 'tonda';
      let ID, cs, h = cs, label = '';
      if (sez === 'piatta') {
        if (p.piatta !== 'mia' && BSP[p.piatta]) { const g = piattaBSP(p.piatta); ID = g.ID; cs = (g.OD - g.ID) / 2; h = g.h; label = `per raccordi gas ${BSP[p.piatta].name}`; }
        else { ID = +p.dInt; cs = (+p.dEst - +p.dInt) / 2; h = +p.spessore; }
        if (cs < 1) return { parts: [], info: [['Nota', 'Guarnizione troppo stretta: il Ø esterno deve superare quello interno di almeno 2 mm']] };
      } else if (p.misura === 'as568') {
        const m = asMM(p.sigla) || asMM('020'); ID = m[0]; cs = m[1]; label = `AS568-${p.sigla}`;
      } else if (p.misura === 'sede') {
        const d = +p.dSede;
        cs = p.corda === 'auto' ? cordaAuto(d) : +p.corda;
        if (p.sede === 'pistone') {
          const g = d - 2 * (1 - SQUEEZE) * cs; ID = g / 1.03;
          info.push(['Cava sul pezzo', `Ø fondo ${fmt2(g)} mm, larga ${fmt2(GW * cs)} mm (il pezzo entra nel foro da Ø ${fmt2(d)})`]);
        } else {
          const g = d + 2 * (1 - SQUEEZE) * cs; ID = d * 0.985;
          info.push(['Cava nel foro', `Ø fondo ${fmt2(g)} mm, larga ${fmt2(GW * cs)} mm (sull'albero da Ø ${fmt2(d)})`]);
        }
        if (ID < 2) return { parts: [], info: [['Nota', 'Sede troppo piccola per questa corda: riduci la corda o aumenta il diametro']] };
      } else { ID = +p.dInt; cs = p.corda === 'auto' ? cordaAuto(ID) : +p.corda; }
      const corr = +p.correzione || 0;   // dopo la prima stampa: il TPU può uscire un po' più stretto o più largo
      ID += corr;
      if (sez !== 'piatta') h = cs;
      const n = Math.max(1, Math.round(+p.copie || 1));
      const one = ringSolid(ID, cs, sez, p.fondoPiatto !== false, h);
      const OD = ID + 2 * cs, cols = Math.ceil(Math.sqrt(n)), step = OD + 4, list = [];
      for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); list.push(reg(one.translate([(c - (cols - 1) / 2) * step, (r - (Math.ceil(n / cols) - 1) / 2) * step, 0]))); }
      const m = union(list);
      const nm = sez === 'piatta' ? 'Guarnizione piatta' : sez === 'quadra' ? 'Anello a sezione quadra' : 'O-ring';
      if (label) info.push(['Misura', label]);
      info.push(['Diametri', `interno ${fmt2(ID)} mm, esterno ${fmt2(OD)} mm`]);
      info.push([sez === 'piatta' ? 'Larghezza' : 'Corda', sez === 'piatta' ? `${fmt2(cs)} mm, spessa ${fmt2(h)} mm` : `${fmt2(cs)} mm${sez === 'tonda' && p.fondoPiatto !== false ? ` (fondo appiattito di ${fmt2(0.1 * cs)} mm per stare sul piatto)` : ''}`]);
      if (sez !== 'piatta' && p.misura !== 'sede') {
        info.push(['Cava consigliata', `profonda ${fmt2((1 - SQUEEZE) * cs)} mm, larga ${fmt2(GW * cs)} mm (schiacciamento 20 %)`]);
      }
      if (n > 1) info.push(['Copie', `${n} sul piatto`]);
      if (corr) info.push(['Correzione', `Ø interno ${corr > 0 ? '+' : ''}${fmt2(corr)} mm rispetto alla misura`]);
      info.push(['Stampa', 'TPU 95A, riempimento 100 %, lento (20–30 mm/s), niente retrazioni lunghe. Più è morbido il TPU, meglio tiene']);
      if (Math.min(cs, h) < 1.5) notes.push('Sotto 1,5 mm di sezione con l\'ugello 0,4 il TPU viene male: meglio comprarlo');
      for (const x of notes) info.push(['Nota', x]);
      return { parts: [{ name: n > 1 ? `${nm} ×${n}` : nm, m, role: 'body' }], info, view: [0.4, -1, 1.1] };
    }

    // ================= FILETTO GAS BSP =================
    const WW_H = 0.640327, WW_K = 2 * 0.960491, WW_S = Math.sqrt(1 + WW_K * WW_K);   // profondità / passo, pendenza dei fianchi, offset normale → radiale
    const segFor = (D) => Math.max(36, Math.min(96, 2 * Math.round(D * 1.6)));
    // sezione del filetto Whitworth a z = 0 (cresta e fondo tagliati piatti); c: scostamento (negativo = maschio più piccolo, positivo = foro più grande)
    function wwSection(D, P, c, N) {
      const Rmaj = D / 2, h = WW_H * P, apex = Rmaj + (0.960491 - WW_H) * P / 2 + c * WW_S;
      const crest = Rmaj + c, rootR = Rmaj - h + c;
      const r = (u) => Math.min(crest, Math.max(rootR, apex - WW_K * Math.abs(u - P / 2)));
      const us = [];
      for (let i = 0; i < N; i++) us.push(P * i / N);
      for (const R of [crest, rootR]) { const t = (apex - R) / WW_K; if (t > 0 && t < P / 2) us.push(P / 2 - t, P / 2 + t); }
      const pts = us.map(u => { const a = -2 * Math.PI * u / P; return [Math.atan2(Math.sin(a), Math.cos(a)), r(u)]; });
      pts.sort((a, b) => a[0] - b[0]);
      const out = [];
      for (const [a, R] of pts) { if (out.length && Math.abs(a - out[out.length - 1][2]) < 1e-7) continue; out.push([R * Math.cos(a), R * Math.sin(a), a]); }
      return out.map(([x, y]) => [x, y]);
    }
    // barra filettata destra da z = 0 a z = len; taper: rapporto tra il Ø in cima e quello in fondo (filetto conico)
    function wwRod(D, P, len, c, taper = 1) {
      const N = segFor(D), turns = len / P;
      const cs = reg(CrossSection.ofPolygons([wwSection(D, P, c, N)]));
      return reg(cs.extrude(len, Math.max(1, Math.ceil(turns * N * 0.5)), 360 * turns, [taper, taper]));
    }
    const cyl = (r0, r1, z0, z1, seg = 64) => reg(reg(Manifold.cylinder(z1 - z0, r0, r1, seg)).translate([0, 0, z0]));
    const hex = (s, z0, z1) => { const R = s / Math.sqrt(3); return reg(reg(reg(Manifold.cylinder(z1 - z0, R, R, 6)).rotate([0, 0, 30])).translate([0, 0, z0])); };
    const revolve = (poly, seg = 72) => {   // profilo (r, z) girato attorno a z; il verso del profilo non conta
      let A = 0; for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; A += x0 * y1 - x1 * y0; }
      return reg(reg(CrossSection.ofPolygons([A < 0 ? poly.slice().reverse() : poly])).revolve(seg));
    };
    const hexFor = (D) => Math.round(D + 2 * Math.max(2.4, 0.11 * D));
    const boreBSP = (b) => Math.max(1.5, (b[0] - 2 * WW_H * b.P) / 2 - Math.max(1.6, 0.08 * b[0]));   // raggio del passaggio nel maschio

    // O-ring sulla battuta del maschio G: il più piccolo AS568 che passa sopra il filetto, corda in proporzione
    function faceRing(D) {
      const want = D < 14 ? '0' : D < 30 ? '1' : '2';
      let best = null;
      for (const k in AS568) {
        if (k[0] !== want && !(want === '0' && k.length === 3 && k[0] === '0')) continue;
        const [id, cs] = asMM(k);
        if (id >= D + 0.3 && (!best || id < best.id)) best = { k, id, cs };
      }
      return best;
    }

    // ---- bracci: costruiti lungo +z, base a z = 0 (attaccata al mozzo), punta a z = L ----
    // ritorna { outer, cut (filetti, fondo della femmina: si toglie sempre), bore (passaggio: non nei tappi), base (sezione per il mozzo), R, rb, L, txt }
    function armBSP(e, g) {
      const b = BSP[e.misura] || BSP.g12, D = b[0], P = b.P, h = WW_H * P;
      const Lt = e.lung > 0 ? e.lung : b[2];
      const notes = [];
      if (e.tipo === 'maschio') {
        const conico = e.filetto === 'R', ten = conico ? 'teflon' : e.tenuta;
        const ring = ten === 'oring' ? faceRing(D) : null;
        let s = hexFor(D);
        if (ring) s = Math.max(s, Math.ceil(2 * (ring.id / 2 + GW * ring.cs + 1.2)));   // la cava sta dentro i piatti dell'esagono
        const Rc = s / Math.sqrt(3), kh0 = Math.max(4, 0.3 * D);
        const rTip = D / 2 - 0.5 * h, chamf = ten === 'teflon' ? Math.max(0, Rc - rTip) : 0;   // lato della punta a 45° (fin dentro il filetto) quando non serve la battuta
        const kh = kh0 + chamf;
        let collar = hex(s, 0, kh);
        if (chamf > 0) collar = reg(collar.intersect(cyl(rTip + kh, rTip, 0, kh, 96)));
        // filetto: G cilindrico; R conico 1:16 sul diametro, Ø nominale al piano di misura
        const Dbase = conico ? D + (Lt - b[3]) / 16 : D, taper = conico ? (D - b[3] / 16) / Dbase : 1;
        let rod = reg(wwRod(Dbase, P, Lt, -g, taper).translate([0, 0, kh]));
        const rMinTip = (Dbase * taper) / 2 - h - g - 0.1;
        rod = reg(rod.intersect(cyl(rMinTip + Lt + 0.01, rMinTip, kh - 0.01, kh + Lt, segFor(D) * 2)));   // invito a 45° in punta
        rod = union([rod, cyl(D / 2 - h - g + 0.05, D / 2 - h - g + 0.05, kh - 0.01, kh + Lt - 0.6, segFor(D))]);
        let outer = union([collar, rod]);
        const cuts = [];
        if (ring) {
          const ri = ring.id / 2, dep = 0.75 * ring.cs;
          cuts.push(sub(cyl(ri + GW * ring.cs, ri + GW * ring.cs, kh - dep, kh + 0.01, 96), cyl(ri, ri, kh - dep - 0.1, kh + 0.1, 96)));
        }
        const rb = Math.min(boreBSP(b), rMinTip - 1.4);
        const txt = `${b.name} maschio ${conico ? 'R conico (teflon)' : 'G cilindrico'}, filetto lungo ${fmt(Lt)} mm, esagono da ${s}` +
          (ring ? `, O-ring AS568-${ring.k} (${fmt2(ring.id)} × ${fmt2(ring.cs)}) sulla battuta` : ten === 'piatta' ? ', battuta piatta per la guarnizione' : '');
        return { outer, cut: cuts.length ? union(cuts) : null, bore: cyl(rb, rb, -0.01, kh + Lt + 1, 48), base: hex(s, 0, 0.01), R: Rc, rb, L: kh + Lt, txt, notes,
          flatTip: ten !== 'teflon', ring };
      }
      // femmina: esagono fuori, filetto G dentro (ci va anche un maschio R), fondo piatto per la guarnizione o conico
      const s = hexFor(D), Rc = s / Math.sqrt(3), floor = 1.2, L = Lt + floor + 0.8;
      const outer = hex(s, 0, L);
      const zf = L - Lt - floor, rMin = D / 2 - h + g;
      // il solco del filetto finisce a 45° verso il fondo (niente soffitto piatto quando la femmina sta sul piatto)
      const cuts = [reg(reg(wwRod(D, P, Lt + floor + 2, g).translate([0, 0, zf])).intersect(cyl(rMin, rMin + Lt + floor + 2, zf, zf + Lt + floor + 2, segFor(D) * 2)))];
      cuts.push(cyl(D / 2 + g + 0.5 - (h + 0.6), D / 2 + g + 0.5, L - (h + 0.6), L + 0.01, segFor(D) * 2));   // svasatura a 45° dell'imbocco, larga sulla bocca
      cuts.push(cyl(rMin, rMin, zf, L, segFor(D)));
      const rb = boreBSP(b);
      if (e.tenuta !== 'piatta') cuts.push(cyl(0.01, rMin, zf - rMin, zf + 0.01, segFor(D)));   // fondo a 45°, fino a raccordarsi con il passaggio più stretto
      const gk = piattaBSP(e.misura);
      const txt = `${b.name} femmina G, filetto lungo ${fmt(Lt)} mm, esagono da ${s}` + (e.tenuta === 'piatta' ? `, fondo piatto per la guarnizione ${fmt2(gk.OD)} × ${fmt2(gk.ID)} × ${fmt2(gk.h)}` : '');
      return { outer, cut: union(cuts), bore: cyl(rb, rb, -0.01, zf + 0.02, 48), base: hex(s, 0, 0.01), R: Rc, rb, L, txt, notes, ledge: rMin - rb };
    }

    // AS568 della stessa corda con il Ø interno più vicino (entro il 3 %), per comprare l'O-ring invece di stamparlo
    function nearAS(ID, cs) {
      let best = null;
      for (const k in AS568) { const [id, c] = asMM(k); if (Math.abs(c - cs) < 0.05 && (!best || Math.abs(id - ID) < Math.abs(best.id - ID))) best = { k, id }; }
      return best && Math.abs(best.id - ID) <= 0.03 * ID ? best : null;
    }
    // attacco a incastro (fontane, pompe con l'adattatore a pressione): tubo liscio con le cave per l'O-ring.
    // maschio: entra nel foro della fontana (Ø = foro); femmina: riceve il tubo della fontana (Ø = tubo).
    // Le cave hanno i fianchi a 45° (si stampano in piedi o capovolte); l'O-ring sta sul fondo piatto largo 1,4 volte la corda.
    function armPush(e, gi) {
      const D = Math.max(4, +e.dInc || 20), prof = Math.max(5, +e.profInc || 20), n = Math.max(0, Math.min(2, Math.round(+e.oringInc || 0)));
      const cs = e.cordaInc === 'auto' || !e.cordaInc ? cordaAuto(D) : +e.cordaInc, dep = (1 - SQUEEZE) * cs, wall = Math.max(1.6, 0.08 * D);
      const notes = [], seg = Math.max(64, Math.min(160, Math.round(Math.PI * D / 0.7)));
      const groove = (rWall, rBot, zc) => {   // trapezio della cava, in (r, z), da togliere
        const wb = GW * cs, dz = Math.abs(rWall - rBot), s = rWall > rBot ? 1 : -1, ext = 0.3 * s;
        return revolve([[rWall + ext, zc - wb / 2 - dz - 0.3], [rBot, zc - wb / 2], [rBot, zc + wb / 2], [rWall + ext, zc + wb / 2 + dz + 0.3]].map(([r, z]) => [Math.max(0, r), z]), seg);
      };
      const wTop = GW * cs + 2 * dep, step = wTop + 2, z0 = 1.5 + wTop / 2 + 0.8;   // ingombro di una cava, distanza dalla punta
      if (e.incastro === 'femmina') {
        const Ri = D / 2 + gi, rg = D / 2 + dep, Ro = Math.max(rg, Ri) + wall, L = prof + 1.5;
        const cuts = [cyl(Ri, Ri, L - prof, L + 0.01, seg), cyl(Ri, Ri + 0.8, L - 0.8, L + 0.01, seg), cyl(0.01, Ri, L - prof - Ri, L - prof + 0.01, seg)];
        let k = 0;
        for (let i = 0; i < n; i++) { const zc = L - z0 - i * step; if (zc - wTop / 2 < L - prof + 1) break; cuts.push(groove(Ri - 0.3, rg, zc)); k++; }
        if (k < n) notes.push(k ? '~Il foro è poco profondo: ci sta una cava sola per l\'O-ring' : '~Il foro è poco profondo: non ci sta la cava per l\'O-ring');
        const rb = Math.max(1.5, D / 2 - Math.max(1.5, 0.12 * D)), ID = D * 0.985, as = nearAS(ID, cs);
        return { outer: cyl(Ro, Ro, 0, L, seg), cut: union(cuts), bore: cyl(rb, rb, -0.01, L - prof + 0.02, 48), base: cyl(Ro, Ro, 0, 0.01, seg), R: Ro, rb, L, notes,
          txt: `a incastro femmina per un tubo da Ø ${fmt2(D)}, profonda ${fmt(prof)} mm, gioco ${fmt2(gi)} per lato` +
            (k ? `; ${k === 1 ? 'una cava' : 'due cave'} dentro (Ø fondo ${fmt2(2 * rg)}) per O-ring ${fmt2(ID)} × ${fmt2(cs)}${as ? ` (AS568-${as.k})` : ''}` : '') };
      }
      const Ro = D / 2 - gi, rg = D / 2 - dep, Rcol = Ro + Math.max(1.5, 0.08 * D), zc0 = 2, L = zc0 + (Rcol - Ro) + prof;
      const rb = rg - wall;
      if (rb < 1) notes.push('~Foro troppo piccolo per la cava dell\'O-ring e la parete: togli l\'O-ring o riduci la corda');
      const rb2 = Math.max(1, Math.min(rb, Ro - 1.2));
      const cuts = [];
      let k = 0;
      for (let i = 0; i < n; i++) { const zc = L - z0 - i * step; if (zc - wTop / 2 < zc0 + (Rcol - Ro) + 1) break; cuts.push(groove(Ro + 0.3, rg, zc)); k++; }
      if (k < n) notes.push(k ? '~L\'innesto è corto: ci sta una cava sola per l\'O-ring' : '~L\'innesto è corto: non ci sta la cava per l\'O-ring');
      const ch = Math.min(0.8, (Ro - rb2) / 2);
      let outer = revolve([[0, 0], [Rcol, 0], [Rcol, zc0], [Ro, zc0 + (Rcol - Ro)], [Ro, L - ch], [Ro - ch, L], [0, L]], seg);
      if (cuts.length) outer = sub(outer, union(cuts));
      const ID = 2 * rg / 1.03, as = nearAS(ID, cs);
      return { outer, cut: null, bore: cyl(rb2, rb2, -0.01, L + 1, 48), base: cyl(Rcol, Rcol, 0, 0.01, seg), R: Rcol, rb: rb2, L, notes,
        txt: `a incastro maschio per un foro da Ø ${fmt2(D)} (fuori Ø ${fmt2(2 * Ro)}), lungo ${fmt(prof)} mm, battuta alla base` +
          (k ? `; ${k === 1 ? 'una cava' : 'due cave'} (Ø fondo ${fmt2(2 * rg)}) per O-ring ${fmt2(ID)} × ${fmt2(cs)}${as ? ` (AS568-${as.k})` : ''}` : '') };
    }

    // portagomma a dente di sega: il fianco ripido a 45° verso la base (si stampa anche in piedi), la rampa lunga verso la punta
    function armBarb(e) {
      const d = Math.max(3, +e.tubo || 13), n = Math.max(1, Math.min(8, Math.round(e.dentini || 3)));
      const valley = d / 2, peak = d * 1.12 / 2, rise = peak - valley;
      const wall = Math.max(1, 0.16 * d), rb = d / 2 - wall;
      const pt = Math.max(2.5, 0.45 * d), Rcol = peak + 1.5, zc = 2;
      const poly = [[0, 0], [Rcol, 0], [Rcol, zc]];
      let z = zc + (Rcol - valley);
      poly.push([valley, z]);
      for (let i = 0; i < n; i++) { poly.push([peak, z + rise]); z += pt; poly.push([valley, z]); }
      z += Math.max(2, 0.2 * d);                       // codolo liscio in punta, per imboccare il tubo
      const ch = Math.min(0.6, wall / 2);
      poly.push([valley, z - ch], [valley - ch, z], [0, z]);
      const seg = Math.max(48, Math.min(128, Math.round(Math.PI * d * 1.12 / 0.8)));
      const L = z;
      return { outer: revolve(poly, seg), cut: null, bore: cyl(rb, rb, -0.01, L + 1, 48), base: cyl(Rcol, Rcol, 0, 0.01, seg), R: Rcol, rb, L, tubo: d, peak,
        txt: `portagomma per tubo Ø interno ${fmt(d)} mm, ${n} dentini (Ø ${fmt2(2 * peak)}), passaggio Ø ${fmt2(2 * rb)}`, notes: [] };
    }

    // ================= FASCETTE (per i portagomma) =================
    // Ø esterno tipico dei tubi, per Ø interno (si può dare quello misurato)
    const TUBO_EST = { 4: 6, 6: 9, 8: 12, 10: 14, 12: 16, 13: 19, 15: 21, 16: 22, 19: 25, 25: 32 };
    const tuboEst = (d, est) => (est > d ? est : TUBO_EST[d] || Math.round(d * 1.35 + 1.5));
    const ext2 = (cs, z0, z1) => reg(reg(cs.extrude(z1 - z0)).translate([0, 0, z0]));
    const ring2 = (r, seg = 96) => reg(CrossSection.circle(r, seg));

    // fascetta a vite: due metà uguali con le orecchie, strette da due viti con dado. Si stampano piatte.
    // Di: Ø interno con le metà a 2,5 mm l'una dall'altra (il tubo sul portagomma); stringendo le viti si chiude ancora.
    function fascettaVite(Di, w) {
      const Rin = Di / 2, t = Math.max(2, 0.08 * Di + 1.2), Rout = Rin + t, gp = 2.5;
      const M = Di < 22 ? { n: 'M3', dh: 3.4, L: 16 } : { n: 'M4', dh: 4.5, L: 20 };
      const xh = Rout + M.dh * 0.9, et = Math.max(4, M.dh + 0.8), xe = xh + M.dh / 2 + 2.2;
      let cs = reg(ring2(Rout).subtract(ring2(Rin)));
      cs = reg(CrossSection.union([cs, reg(CrossSection.square([xe - Rin - 0.3, et]).translate([Rin + 0.3, gp / 2])), reg(CrossSection.square([xe - Rin - 0.3, et]).translate([-xe, gp / 2]))]));
      cs = reg(reg(cs.subtract(ring2(Rin))).intersect(reg(CrossSection.square([4 * xe, 2 * Rout + 10]).translate([-2 * xe, gp / 2]))));
      let half = ext2(cs, 0, w);
      for (const sx of [-1, 1]) half = sub(half, reg(reg(reg(Manifold.cylinder(et + 2, M.dh / 2, M.dh / 2, 24)).rotate([-90, 0, 0])).translate([sx * xh, gp / 2 - 1, w / 2])));
      const other = reg(half.rotate([0, 0, 180]));
      const pair = union([reg(half.translate([0, 3, 0])), reg(other.translate([0, -3, 0]))]);   // le due metà un po' staccate sul piatto
      return { m: pair, txt: `a vite in 2 metà, Ø interno ${fmt2(Di)} con le metà a ${fmt(gp)} mm (stringendo arriva a circa Ø ${fmt2(Di - gp + 0.3)}), alta ${fmt(w)} mm; 2 viti ${M.n} × ${M.L} con dado` };
    }

    // fascetta a cremagliera: una spirale che si sovrappone a sé stessa; la coda ha i denti fuori, la testa dentro.
    // Esce stampata già agganciata al primo dente e larga; si stringe con una pinza sulle due alette (non si riapre).
    function fascettaCremagliera(Dmax, Dmin, w) {
      const t = Dmax < 20 ? 1.6 : 2, gap = 0.6, h = 0.8, p = 1.6, R0 = Dmax / 2;
      const travel = Math.PI * (Dmax - Dmin) + 1, Lh = 4 * p, Lr = Math.ceil((travel + Lh) / p) * p;
      const Rm = R0 + t, ang = (s) => s / Rm;                     // arco (mm) → angolo (rad) sul primo giro
      const Th = 2 * Math.PI + ang(Lh + 0.2), pitch = (t + gap) / (2 * Math.PI);
      const base = (a) => R0 + pitch * a;                         // raggio interno della spirale
      const saw = (s) => { const f = s / p - Math.floor(s / p); return h * f; };
      // contorno: lato interno da 0 a Th, poi lato esterno all'indietro
      const N = Math.ceil(Th / (p / Rm / 6)), inner = [], outer = [];
      for (let i = 0; i <= N; i++) {
        const a = Th * i / N, s = a * Rm, s2 = (a - 2 * Math.PI) * Rm;
        let ri = base(a), ro = ri + t;
        if (s <= Lr) ro += saw(s);                                // denti della coda (primo giro), fuori
        if (a >= 2 * Math.PI) { ri += saw(s2); ro = base(a) + t + h; }   // testa (secondo giro): denti dentro, combaciano con la coda
        inner.push([ri * Math.cos(a), ri * Math.sin(a)]); outer.push([ro * Math.cos(a), ro * Math.sin(a)]);
      }
      let cs = reg(CrossSection.ofPolygons([[...outer, ...inner.reverse()]]));   // in senso antiorario: pieno
      // alette per la pinza: in fondo alla testa e sul primo giro subito dopo la cremagliera
      const lug = (a, r0, r1, wd) => { const c = Math.cos(a), sn = Math.sin(a), tx = -sn, ty = c; return reg(CrossSection.ofPolygons([[[r0 * c, r0 * sn], [r1 * c, r1 * sn], [r1 * c + wd * tx, r1 * sn + wd * ty], [r0 * c + wd * tx, r0 * sn + wd * ty]]])); };
      const top = base(Th) + t + h + 4;
      cs = reg(CrossSection.union([cs, lug(Th, base(Th) + t + h - 0.3, top, -3), lug(ang(Lr + 2), base(ang(Lr + 2)) + t - 0.3, top, 3)]));
      return { m: ext2(cs, 0, w), txt: `a cremagliera, esce larga Ø ${fmt2(Dmax)}, si stringe con la pinza fino a Ø ${fmt2(Dmin)} (${Math.round((Lr - Lh) / p)} denti da ${fmt(p)} mm), alta ${fmt(w)} mm, una volta stretta non si riapre` };
    }

    // ---- forme: direzione di ogni uscita (angolo dalla verticale nel piano x-z) ----
    const FORME = {
      dritto: { dirs: [180, 0], name: 'Dritto' }, tappo: { dirs: [0], name: 'Tappo' },
      gomito90: { dirs: [-45, 45], name: 'Gomito 90°', cut: true }, gomito45: { dirs: [180, 45], name: 'Gomito 45°' },
      t: { dirs: [180, 0, 90], name: 'T' }, y: { dirs: [180, -40, 40], name: 'Y' },
    };
    const place = (m, th, L0) => { const r = th * Math.PI / 180; return reg(reg(m.rotate([0, th, 0])).translate([L0 * Math.sin(r), 0, L0 * Math.cos(r)])); };
    // punteggio per scegliere quale uscita va sul piatto nel raccordo dritto: meglio una femmina, peggio un maschio con la battuta piatta
    // (la femmina con il fondo piatto per la guarnizione, capovolta, ha il fondo a sbalzo)
    const score = (e, a) => (e.tipo === 'femmina' ? (e.tenuta === 'piatta' ? 1.5 : 0) : e.tipo === 'incastro' ? (e.incastro === 'femmina' ? 0 : 1) : e.tipo === 'portagomma' ? 1 : a && a.flatTip ? 3 : 2);

    function raccordo(p) {
      const forma = FORME[p.forma] ? p.forma : 'dritto', F = FORME[forma];
      const g = +p.gioco >= 0 ? +p.gioco : 0.15;
      const ids = ['A', 'B', 'C'].slice(0, F.dirs.length);
      const ends = ids.map(k => {
        const tipo = p['tipo' + k] || 'portagomma';
        return { id: k, tipo, misura: p['misura' + k], filetto: p['filetto' + k], tenuta: tipo === 'femmina' ? p['tenutaF' + k] || 'teflon' : p['tenuta' + k] || 'teflon',
          lung: +p['lung' + k] || 0, tubo: p['tubo' + k] === 'mio' ? +p['tuboMio' + k] : +p['tubo' + k], dentini: +p.dentini || 3,
          est: +p['tuboEst' + k] || 0, incastro: p['incastro' + k], dInc: p['dInc' + k], profInc: p['profInc' + k], oringInc: p['oringInc' + k], cordaInc: p['cordaInc' + k] };
      });
      const info = [], notes = [];
      const gi = +p.giocoInc >= 0 ? +p.giocoInc : 0.2;
      const arms = ends.map(e => (e.tipo === 'portagomma' ? armBarb(e) : e.tipo === 'incastro' ? armPush(e, gi) : armBSP(e, g)));
      let dirs = F.dirs.slice();
      if (forma === 'dritto' && score(ends[0], arms[0]) > score(ends[1], arms[1])) { dirs = [0, 180]; }   // gira il pezzo: sul piatto va l'uscita migliore
      // distanza del mozzo: i bracci vicini non si devono toccare
      const rmin = Math.min(...arms.map(a => a.rb));
      let L0 = 0;
      if (forma === 'tappo') L0 = 3;
      else if (forma === 'dritto') L0 = Math.max(1, Math.abs(arms[0].R - arms[1].R) / 2 + 0.5, Math.max(...arms.map(a => a.rb)) - rmin + 0.5);
      else for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
        const phi = Math.abs(dirs[i] - dirs[j]) % 360, ph = Math.min(phi, 360 - phi) * Math.PI / 360;
        L0 = Math.max(L0, (Math.max(arms[i].R, arms[j].R) + 0.8) / Math.sin(ph));
      }
      // mozzo: dritto e tappo raccordano le due basi; le altre forme hanno un nodo al centro (le basi girate nel centro) e un prolungamento per braccio
      const outers = [], cuts = [];
      let hub;
      if (forma === 'dritto' || forma === 'tappo') {
        const bases = arms.map((a, i) => place(a.base, dirs[i], L0));
        if (forma === 'tappo') bases.push(arms[0].base);
        hub = reg(Manifold.hull(bases));
      } else {
        const core = reg(Manifold.hull(arms.map((a, i) => place(a.base, dirs[i], 0))));
        hub = union([core, ...arms.map((a, i) => reg(Manifold.hull([place(a.base, dirs[i], 0), place(a.base, dirs[i], L0)])))]);
        cuts.push(reg(Manifold.sphere(rmin, 48)));
      }
      arms.forEach((a, i) => {
        outers.push(place(a.outer, dirs[i], L0));
        if (a.cut) cuts.push(place(a.cut, dirs[i], L0));
        if (forma !== 'tappo') {
          cuts.push(place(a.bore, dirs[i], L0));
          cuts.push(place(cyl(rmin, rmin, 0, L0 + 0.1, 48), dirs[i], 0));
          // da un passaggio più largo a uno più stretto: cono a 45°, niente gradini a sbalzo
          if (a.rb > rmin + 0.05) cuts.push(place(cyl(rmin, a.rb, -(a.rb - rmin), 0.02, 48), dirs[i], L0));
        }
      });
      let cut = union(cuts);
      if (forma === 'tappo') cut = reg(cut.intersect(reg(reg(Manifold.cube([1000, 1000, 1000], true)).translate([0, 0, 500 + L0]))));   // il fondo del tappo resta pieno
      let m = sub(union([hub, ...outers]), cut);
      { const pcs = m.decompose(); if (pcs.length > 1) { pcs.forEach(reg); m = pcs.reduce((a, b) => (b.volume() > a.volume() ? b : a)); } else reg(pcs[0]); }   // via le schegge dove si incontrano i fori
      // gomito a V: si taglia il fondo piatto sotto il passaggio
      if (F.cut) {
        const zb = -rmin * 1.0, zo = m.boundingBox().min[2];
        const zc = Math.max(zo, Math.min(zb - 1.6, -0.45 * Math.max(...arms.map(a => a.R))));
        m = reg(m.intersect(reg(reg(Manifold.cube([1000, 1000, 1000], true)).translate([0, 0, 500 + zc]))));
      }
      const bb = m.boundingBox();
      m = reg(m.translate([-(bb.min[0] + bb.max[0]) / 2, -(bb.min[1] + bb.max[1]) / 2, -bb.min[2]]));
      const size = [bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]];

      info.push(['Forma', F.name]);
      ends.forEach((e, i) => info.push([ids.length > 1 ? `Uscita ${e.id}` : 'Uscita', arms[i].txt]));
      info.push(['Ingombro', `${fmt(size[0])} × ${fmt(size[1])} × ${fmt(size[2])} mm`]);
      if (ends.some(e => e.tipo === 'maschio' || e.tipo === 'femmina')) info.push(['Gioco filetto', `${fmt2(g)} mm per lato`]);
      const sideways = dirs.some(t => Math.abs(t) === 90);
      info.push(['Stampa', (forma === 'gomito90' ? 'appoggiato a V, con le due uscite inclinate a 45° in su' : forma === 'tappo' ? 'in piedi, con la testa sul piatto' : 'in piedi') +
        '. PETG per l\'acqua, almeno 4 perimetri, riempimento alto vicino ai filetti']);
      if (sideways) notes.push('~Il braccio laterale del T è orizzontale: servono i supporti sotto. Senza supporti usa la Y');
      const down = dirs.indexOf(180);
      if (down >= 0 && score(ends[down], arms[down]) === 3) notes.push(`~Il maschio dell'uscita ${ends[down].id} sta sul piatto: sotto l'esagono c'è la battuta piatta a sbalzo. Metti i supporti solo lì, o scegli la tenuta col teflon (battuta a 45°)`);
      if (down >= 0 && score(ends[down], arms[down]) === 1.5) notes.push(`~La femmina dell'uscita ${ends[down].id} sta sul piatto: il fondo piatto per la guarnizione resta a sbalzo (un anello di ${fmt(arms[down].ledge)} mm, di solito viene). Con la tenuta col teflon il fondo è a 45°`);
      for (const e of ends) if (e.tipo !== 'portagomma' && e.misura === 'g18') { notes.push('~Il filetto da 1/8" ha il passo di 0,9 mm: stampalo con strati da 0,12 e ugello 0,4'); break; }
      for (const x of notes) info.push(['Nota', x]);
      for (const a of arms) for (const x of a.notes) info.push(['Nota', x]);
      const view = forma === 'gomito90' || forma === 'y' || forma === 't' ? [0.25, -1, 0.35] : [0.6, -1, 0.5];
      const parts = [{ name: `Raccordo ${F.name.toLowerCase()}`, m, role: 'body' }];
      // fascette: una per ogni portagomma, della misura del suo tubo, accanto al raccordo sul piatto
      if (p.fascetta === 'vite' || p.fascetta === 'cremagliera') {
        let x = size[0] / 2 + 6;
        ends.forEach((e, i) => {
          if (e.tipo !== 'portagomma') return;
          const a = arms[i], OD = tuboEst(a.tubo, e.est);
          const Don = OD + (2 * a.peak - a.tubo);              // il tubo sul portagomma si allarga quanto i dentini
          const w = Math.max(6, Math.min(12, Math.round(0.3 * OD + 3)));
          const f = p.fascetta === 'vite' ? fascettaVite(Don, w) : fascettaCremagliera(Don + 1, OD - 1.5, w);
          const fb = f.m.boundingBox();
          const fm = reg(f.m.translate([x - fb.min[0], -(fb.min[1] + fb.max[1]) / 2, -fb.min[2]]));
          x += fb.max[0] - fb.min[0] + 6;
          parts.push({ name: `Fascetta uscita ${e.id}`, m: fm, role: 'inner' });
          info.push([`Fascetta ${e.id}`, `${f.txt}; tubo Ø ${fmt(a.tubo)} × ${fmt2(OD)}${e.est > a.tubo ? '' : ' (esterno tipico: se il tuo è diverso, misuralo e scrivilo)'}`]);
        });
        if (parts.length > 1) info.push(['Fascette', 'PETG, non PLA (al sole si allenta), stampate piatte come escono, 4 perimetri e riempimento 100 %. Infilala sul tubo prima di spingerlo sul portagomma']);
      }
      return { parts, info, view, size };
    }

    // prova dei filetti (solo per i controlli): maschio e foro della stessa misura avvitati, quanto si toccano
    function filettoProva(p) {
      const b = BSP[p.misura] || BSP.g12, g = +p.gioco, L = 3 * b.P;
      const male = wwRod(b[0], b.P, L, -g), hole = wwRod(b[0], b.P, L + 2 * b.P, g).translate([0, 0, -b.P]);
      return { parts: [{ name: 'maschio', m: male, role: 'body' }, { name: 'foro', m: reg(hole), role: 'ghost' }], info: [['Tocca', fmt2(reg(male.subtract(reg(hole))).volume())]] };
    }

    return { oring, raccordo, filettoProva };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

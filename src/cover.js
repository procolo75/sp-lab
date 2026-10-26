// Cover per telefoni. Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm.
// La cover si costruisce come si stampa: retro sul piatto (z = 0) e apertura in alto, senza supporti.
// Guardando lo schermo x va a destra e y in alto, con il centro del telefono in (0, 0). Le misure dei telefoni sono in telefoni.js.
// Il labbro sullo schermo gira tutto attorno. TPU: il telefono entra a scatto. PLA/PETG: la cover è rigida, quindi il labbro
// è più stretto e il telefono entra inclinato (prima la cima, poi si preme giù il fondo): le pareti si piegano di pochi decimi.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function cover(H) {
    const { Manifold, CrossSection, reg, union, sub, box, fmt } = H;
    const DB = root.SP_TELEFONI || [], BY = {};
    for (const t of DB) BY[t.id] = t;

    // ---------- strumenti 2D ----------
    const R2 = (c) => reg(c);
    const P2 = (pts) => R2(CrossSection.ofPolygons([pts], 'NonZero'));
    const C2 = (x, y, r, seg = 48) => R2(R2(CrossSection.circle(r, seg)).translate([x, y]));
    const RECT = (x0, y0, x1, y1) => P2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const U = (list) => { list = list.filter(Boolean); return !list.length ? null : list.length === 1 ? list[0] : R2(CrossSection.union(list)); };
    const D = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
    const I = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
    const OFF = (c, d) => (c ? R2(c.offset(d, 'Round')) : null);
    const MV = (c, x, y) => R2(c.translate([x, y]));
    const empty = (c) => !c || c.isEmpty() || c.area() < 0.05;
    const bounds = (c) => { const b = c.bounds(); return { x0: b.min[0], y0: b.min[1], x1: b.max[0], y1: b.max[1], w: b.max[0] - b.min[0], h: b.max[1] - b.min[1] }; };
    // rettangolo arrotondato tra (x0, y0) e (x1, y1)
    const RR = (x0, y0, x1, y1, r) => { r = Math.max(0.01, Math.min(r, (x1 - x0) / 2 - 0.01, (y1 - y0) / 2 - 0.01)); return OFF(RECT(x0 + r, y0 + r, x1 - r, y1 - r), r); };
    function stroke(a, b, w) { return R2(CrossSection.hull([C2(a[0], a[1], w / 2, 32), C2(b[0], b[1], w / 2, 32)])); }

    // ---------- solidi ----------
    const EXTZ = (c, z0, z1) => (empty(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
    const prismX = (c, x0, x1) => reg(reg(reg(c.extrude(x1 - x0)).rotate([90, 0, 90])).translate([x0, 0, 0]));   // c nel piano (y, z)
    const prismY = (c, y0, y1) => reg(reg(reg(c.extrude(y1 - y0)).rotate([90, 0, 0])).translate([0, y1, 0]));    // c nel piano (x, z)
    const U3 = (list) => { list = list.filter(Boolean); return !list.length ? null : list.length === 1 ? list[0] : union(list); };
    // solido convesso che passa per più sezioni: [[sezione 2D, z], ...]
    const loft = (secs) => reg(Manifold.hull(secs.flatMap(([c, z]) => c.toPolygons().flatMap(q => q.map(([x, y]) => [x, y, z])))));
    const loftX = (secs) => reg(Manifold.hull(secs.flatMap(([c, x]) => c.toPolygons().flatMap(q => q.map(([u, v]) => [x, u, v])))));   // sezioni nel piano (y, z)
    const flip = (m, zr) => (m ? reg(reg(m.rotate([0, 180, 0])).translate([0, 0, zr])) : null);

    // ---------- il telefono ----------
    // contorno guardando lo schermo, dagli angoli del disegno (spline tra i punti quotati)
    function outline(t) {
      const a = t.a, q = [], P = (i) => a[Math.max(0, Math.min(a.length - 1, i))];
      for (let i = 0; i < a.length - 1; i++) for (let k = 0; k < 6; k++) {
        const s = k / 6, p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        const f = (j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s * s + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s * s * s);
        q.push([f(0), f(1)]);
      }
      q.push(a[a.length - 1]);
      const hw = t.W / 2, hl = t.L / 2, pts = [], rq = q.slice().reverse();
      for (const [x, y] of q) pts.push([-hw + x, hl - y]);     // angolo in alto a sinistra, dal fianco alla cima
      for (const [x, y] of rq) pts.push([hw - x, hl - y]);
      for (const [x, y] of q) pts.push([hw - x, -hl + y]);
      for (const [x, y] of rq) pts.push([-hw + x, -hl + y]);
      return P2(pts);
    }
    // profilo del bordo dal piano medio alla faccia: [distanza, rientro]; se la quota più esterna non arriva alla faccia la prolungo
    function profile(list, half) {
      const out = [[0, 0], ...list.filter(([z]) => z > 0.01 && z < half - 0.005)];
      const last = list[list.length - 1], [zl, il] = out[out.length - 1];
      if (last[0] >= half - 0.005) out.push([half, last[1]]);
      else out.push([half, il + 3 * (half - zl)]);
      return out;
    }
    // il telefono con il gioco g sui lati e gz sullo spessore (tutto verso lo schermo), retro a z0
    function phoneSolid(t, base, g, gz, z0) {
      const zm = z0 + t.T / 2, secs = [];
      for (const [z, i] of profile(t.pr || t.pf, t.T / 2)) secs.push([OFF(base, g - i), zm - z]);
      for (const [z, i] of profile(t.pf, t.T / 2)) secs.push([OFF(base, g - i), zm + z + gz]);
      return loft(secs);
    }
    // fotocamera: le quote del disegno del retro (x da sinistra guardando il retro) diventano coordinate della cover
    const backRR = (t, [x0, y0, x1, y1, r]) => RR(t.W / 2 - x1, t.L / 2 - y1, t.W / 2 - x0, t.L / 2 - y0, r);
    function camera(t, base) {
      const c = t.cam;
      // il rialzo largo quanto il telefono ha i bordi arrotondati come il retro: è più stretto del telefono di quanto rientra il retro
      const backIn = profile(t.pr || t.pf, t.T / 2).slice(-1)[0][1];
      // con la forma del rialzo (b0 e tasca, dagli originali Anycubic) il rialzo ha i fianchi arrotondati: la tasca della
      // copertura rientra sempre di più man mano che si allontana dal retro del telefono. ins(d) = rientro alla profondità d
      let B0 = null, ins = null;
      if (c.b0) {
        B0 = RR(-t.W / 2, t.L / 2 - c.b0[1], t.W / 2, t.L / 2 - c.b0[0], c.b0[2]);
        const tq = c.tasca;
        ins = (d) => { if (d <= tq[0][0]) return tq[0][1]; for (let i = 1; i < tq.length; i++) if (d <= tq[i][0]) { const [d0, o0] = tq[i - 1], [d1, o1] = tq[i]; return o0 + (o1 - o0) * (d - d0) / (d1 - d0); } return tq[tq.length - 1][1]; };
      }
      const plat = B0 ? OFF(B0, -(ins(0) + 0.6)) : c.tutto ? I(OFF(base, -backIn), RECT(-t.W, t.L / 2 - c.r[3], t.W, t.L)) : backRR(t, c.r);
      const win = c.f ? backRR(t, c.f) : R2(CrossSection.hull([plat, ...(c.fori || []).map(([x, y, d]) => C2(t.W / 2 - x, t.L / 2 - y, d / 2))]));
      // il rialzo vero, dal retro del telefono (z0) verso fuori (z decrescente): con i fianchi arrotondati se ne conosco la forma
      const bump = (z0) => {
        if (!B0) return EXTZ(plat, z0 - c.h, z0 + 0.5);
        const at = (d) => OFF(B0, -(ins(d) + 0.6)), ds = [...new Set([...c.tasca.map(q => q[0]).filter(d => d < c.h), c.h])];
        const segs = [EXTZ(at(0), z0 - 0.01, z0 + 0.5)];
        for (let i = 1; i < ds.length; i++) segs.push(loft([[at(ds[i - 1]), z0 - ds[i - 1]], [at(ds[i]), z0 - ds[i]]]));
        return U3(segs);
      };
      return { plat, win, B0, ins, bump };
    }
    // telefono con le misure scritte a mano: angoli e bordi tondi
    function custom(p) {
      const W = p.larghezza, L = p.altezza, T = p.spessore;
      const ra = Math.max(1, Math.min(p.raggioAngoli, W / 2 - 1)), re = Math.max(0.2, Math.min(p.raggioBordo, T / 2 - 0.1));
      const a = [], pf = [];
      for (let i = 0; i <= 8; i++) { const q = Math.PI / 2 * i / 8; a.push([ra - ra * Math.cos(q), ra - ra * Math.sin(q)]); }
      for (let i = 0; i <= 6; i++) { const q = Math.PI / 2 * i / 6; pf.push([T / 2 - re + re * Math.sin(q), re - re * Math.cos(q)]); }
      const list = (txt) => String(txt || '').split(/[,;]+/).map(x => x.trim().split(/\s*[/x×]\s*/).map(v => Number(v.replace(',', '.'))))
        .filter(q => q.length >= 2 && Number.isFinite(q[0]) && Number.isFinite(q[1]) && q[1] > 0).map(([c, l]) => [c, l, 'tasto']);
      const camR = [p.camX, p.camY, p.camX + p.camL, p.camY + p.camA, p.camR];
      const cam = p.camTutto ? { r: [0, 0, 0, Math.max(p.camFine, camR[3]), 0], tutto: true, f: camR, h: p.camH, v: Math.max(p.camH, p.camV) }
        : { r: camR, h: p.camH, v: Math.max(p.camH, p.camV) };
      return { nome: 'misure tue', W, L, T, a, pf, sx: list(p.tastiSx), dx: list(p.tastiDx), w: p.tastiA, cam,
        usb: [W / 2, p.usbL, p.usbA, Math.min(p.usbA, p.usbL) / 2], sp: [W / 2 - p.fondoL / 2, W / 2 + p.fondoL / 2], piano: 1.5, custom: true };
    }
    const phoneOf = (p) => (p.modello === 'misure' ? custom(p) : BY[p.modello] || DB[0]);

    // ================= COVER =================
    function cover(p) {
      const DEC = H.decor, notes = [], info = [];
      if (DEC) DEC.NOTES.clear();
      const t = phoneOf(p), tpu = p.materiale !== 'pla';
      const g = p.gioco, gz = p.giocoZ, s = p.pareti, lip = p.sporgenza, hs = p.bordoSchermo, cb = p.giocoTasti, cw = p.giocoCam;
      const base = outline(t), cam = camera(t, base), C = t.cam;
      const stand = p.tipo === 'cavalletto', vert = p.orientamento !== 'orizzontale';
      const DD = 1.2;                                   // profondità della guida del cavalletto
      // lenti: protette da una copertura a parte (consigliata; il valore si chiama ancora 'cornice') oppure da un retro spesso quanto sporgono
      const prot = typeof p.protezione === 'string' ? p.protezione : p.protezione ? 'retro' : 'cornice';
      // retro: con la copertura a parte resta quello scelto (la copertura abbraccia il rialzo della fotocamera e fa da gobba fuori).
      // Senza copertura, il rialzo largo quanto il telefono sta in una tasca e il retro resta piatto fuori, quindi è più spesso.
      let tb = p.retro;
      const thick = C.tutto && prot !== 'cornice';
      if (thick) tb += C.h + 0.2;
      if (stand) tb = Math.max(tb, DD + 1);
      // incavo MagSafe dentro la cover e guida del cavalletto fuori: tra i due restano almeno 0,6 mm
      if (stand && !vert && p.magsafe === 'dentro') tb = Math.max(tb, DD + p.magSp + 0.1 + 0.6);
      const TF = 1.0, RW = 1.2, tolR = p.giocoCornice ?? 0.15, up = p.alzoCornice ?? 0.5;   // flangia, bordo e gioco della copertura
      if (prot === 'retro') tb = Math.max(tb, C.v + up);
      const ring = prot === 'cornice' && C.v + up > tb;
      if (ring) tb = Math.max(tb, TF + 0.6);
      const zm = tb + t.T / 2, zf = tb + t.T + gz, zr = zf + hs;
      const Wo = t.W + 2 * (g + s), Lo = t.L + 2 * (g + s);

      // ---- guscio esterno, con il profilo scelto sugli spigoli ----
      const out = OFF(base, g + s), rb = Math.max(0, Math.min(p.raggio, s + g + 0.3, zr / 2 - 0.2));
      const secs = [];
      if (p.profilo === 'dritto' || rb < 0.1) secs.push([out, 0], [out, zr]);
      else if (p.profilo === 'smussato') secs.push([OFF(out, -rb), 0], [out, rb], [out, zr - rb], [OFF(out, -rb), zr]);
      else {
        // in basso il tondo parte da 45°: sul piatto non resta uno sbalzo
        secs.push([OFF(out, -0.586 * rb), 0]);
        for (let i = 0; i <= 4; i++) { const q = Math.PI / 4 + Math.PI / 4 * i / 4; secs.push([OFF(out, -(rb - rb * Math.sin(q))), rb - rb * Math.cos(q)]); }
        for (let i = 0; i <= 6; i++) { const q = Math.PI / 2 * i / 6; secs.push([OFF(out, -(rb - rb * Math.cos(q))), zr - rb + rb * Math.sin(q)]); }
      }
      let shell = loft(secs);
      const adds = [], cuts = [];

      // ---- vano del telefono e apertura sullo schermo ----
      const body = phoneSolid(t, base, g, gz, tb);
      const open = EXTZ(OFF(base, -lip), zm, zr + 1);
      cuts.push(body, open);

      // ---- fotocamera ----
      // senza copertura: finestra passante con i fianchi a 45° (non entrano nel campo delle lenti).
      // Con la copertura: la finestra è dritta e larga quanto la copertura, più il gioco.
      const chamf = Math.min(tb, 2.5) * 0.8;
      // con la copertura la finestra prende tutto il rialzo (largo o no); senza, solo lenti e flash
      const camW = ring && C.tutto ? cam.plat : cam.win;
      let W0 = ring ? I(OFF(camW, cw + RW), OFF(base, g - tolR)) : null;   // la copertura fuori dalla cover: mai dentro le pareti
      // rialzo largo quanto il telefono: in alto la copertura segue gli angoli del telefono, in basso il rialzo finisce dritto.
      // Arrotondo anche gli angoli in basso con raggio 5,75 mm, lasciando attorno al rialzo una parete di almeno RW: la copertura
      // scende sotto il rialzo quanto basta (circa raggio − 1,8 mm). Con raggio 9 e parete libera di arrivare a zero
      // negli angoli restava un buco. Se lo spazio non basta il raggio si riduce
      // con la forma del rialzo nota la copertura è il rettangolo di riferimento rientrato come negli originali Anycubic
      // (2,65 mm, più il gioco attorno alla fotocamera oltre gli 0,6 mm già compresi): angoli uguali sopra e sotto
      if (ring && cam.B0) W0 = I(OFF(cam.B0, -2.65 + cw), OFF(base, g - tolR));
      else if (ring && C.tutto) {
        const keep = OFF(cam.plat, cw), cav = OFF(base, g - tolR), wall = I(OFF(keep, RW - 0.05), cav);
        search: for (let R = 5.75; R >= 2; R -= 0.25) {
          for (let ext = 0; ext <= 8; ext += 0.25) {
            const s2 = I(R2(CrossSection.hull([W0, MV(W0, 0, -ext)])), cav), y0 = bounds(s2).y0;
            const r = U([OFF(OFF(s2, -R), R), I(s2, RECT(-t.W, y0 + R, t.W, t.L))]);
            if (empty(D(wall, r))) { W0 = r; break search; }
          }
        }
      }
      const winOut = ring ? OFF(W0, tolR) : OFF(cam.win, cw + chamf);
      if (!ring) cuts.push(loft([[winOut, -0.01], [OFF(cam.win, cw), tb + 0.01]]));
      if (thick) cuts.push(EXTZ(OFF(cam.plat, g), tb - C.h - 0.25, tb + 0.02));          // tasca per il rialzo largo
      // copertura a parte: chiude la finestra lasciando aperti solo lenti, flash e sensori, e sporge oltre le lenti.
      // Ha una flangia che sta in un incavo dentro la cover, sotto il telefono: la tiene ferma il telefono, senza colla.
      // Senza le posizioni delle lenti (misure scritte a mano) è solo un anello attorno alla fotocamera.
      let insert = null, ringOut = 0, FLinfo = 0, capFace = null, capZ = 0;   // capFace: parte piatta della faccia esterna della copertura (a z = capZ)
      if (ring) {
        // si infila da dentro la cover prima del telefono: passa nella finestra e il suo bordo largo (flangia) resta
        // in un incavo scavato nel retro, dalla parte del telefono. Fuori non esce perché la finestra è più stretta,
        // dentro non rientra perché ci appoggia il telefono (sul rialzo della fotocamera)
        const zTop = tb, ta = zTop - TF;                           // la flangia va da ta al piano del telefono
        // si stampa con la faccia esterna sul piatto: la flangia si allarga a 55° (niente supporti) e poi è dritta per 0,3 mm
        const hf = TF - 0.3, FL = Math.min(1.5, hf * Math.tan(55 * Math.PI / 180));
        const room = OFF(base, g - tolR - 0.3);                     // l'incavo non tocca le pareti della cover
        const inner = OFF(camW, cw), flange = I(OFF(W0, FL), room);
        const zR = tb - C.v - up;                                // faccia esterna della copertura, fuori dal retro
        ringOut = -zR; FLinfo = FL;
        cuts.push(EXTZ(OFF(W0, tolR), -0.01, ta + 0.01), loft([[OFF(W0, tolR), ta], [OFF(flange, tolR), ta + hf]]), EXTZ(OFF(flange, tolR), ta + hf - 0.01, zTop + 0.01));
        const WMIN = 0.9;                                          // parete più sottile che si stampa bene (due passate da 0,4 mm)
        const ch = Math.max(0, Math.min(RW - WMIN, 0.6));
        const solid = U3([EXTZ(W0, zR, ta + 0.01), loft([[W0, ta], [flange, ta + hf]]), EXTZ(flange, ta + hf - 0.01, zTop)]);
        let m;
        if (t.lenti) {
          // tasca per il rialzo e un foro svasato a 45° per ogni lente e sensore.
          // La copertura si costruisce a fette orizzontali, dal piatto in su, e ogni fetta è "aperta": le parti più strette di
          // WMIN (tra tasca e bordo quando la fotocamera è vicina al bordo del telefono, punte tra tasca e fori) spariscono,
          // invece di diventare pareti di pochi decimi che lo slicer salta lasciando dei buchi. Lì la tasca arriva alla parete
          // della cover. Ogni fetta sta sopra quella sotto (o sporge al massimo di un gradino della flangia): niente sbalzi
          const zp = Math.max(zR + 0.4, zTop - C.h - 0.2);           // da qui in su c'è la tasca per il rialzo
          // fori: 0,4 mm di gioco attorno al vetro, meno se due fori sono così vicini che il setto resterebbe sotto WMIN
          const lens = t.lenti.map(([x, y, d], i) => {
            let c = 0.4;
            t.lenti.forEach(([x2, y2, d2], j) => { if (j !== i) c = Math.min(c, (Math.hypot(x2 - x, y2 - y) - d / 2 - d2 / 2 - WMIN) / 2); });
            return [t.W / 2 - x, t.L / 2 - y, d / 2 + Math.max(0.1, c)];
          });
          const holes2 = U(lens.map(([X, Y, r]) => C2(X, Y, r, 64))), P = U([OFF(cam.plat, cw), holes2]);
          // tasca alla quota z (la fetta va fino a z1: prendo la tasca più larga, quella in alto)
          const Pat = (z1) => (cam.B0 ? U([OFF(cam.B0, -cam.ins(zTop - z1) + (cw - 0.6)), holes2]) : P);
          // semplifico il contorno: ogni fetta parte da quella sotto e senza semplificare i punti raddoppiano a ogni fetta (lentissimo)
          const OPEN = (c) => (empty(c) ? null : R2(R2(R2(c.offset(-WMIN / 2, 'Round', 2, 48)).offset(WMIN / 2, 'Round', 2, 48)).simplify(0.01)));
          // contorno esterno all'altezza z: W0 fino a ta, poi la flangia si allarga a gradini (stanno dentro l'incavo della cover)
          // nella parte che si allarga ogni gradino sta dentro la flangia smussata sia sotto sia sopra: quindi anche nell'incavo
          const NS = 3, flLoft = loft([[W0, ta], [flange, ta + hf]]);
          const outerOf = (z0, z1) => (z1 <= ta + 1e-4 ? W0 : z0 >= ta + hf - 1e-4 ? flange : I(R2(flLoft.slice(Math.max(z0, ta) + 1e-3)), R2(flLoft.slice(Math.min(z1, ta + hf) - 1e-3))));
          const cuts2 = [zR, zp, ta, ...Array.from({ length: NS }, (_, k) => ta + hf * (k + 1) / NS), zTop, ...(cam.B0 ? Array.from({ length: Math.ceil((zTop - zp) / 0.2) }, (_, k) => zp + 0.2 * k) : [])].filter((z) => z >= zR && z <= zTop);
          const zz = [...new Set(cuts2.map(z => +z.toFixed(4)))].sort((u, v) => u - v);
          const slabs = [];
          let prev = null;
          for (let i = 0; i < zz.length - 1; i++) {
            const z0 = zz[i], z1 = zz[i + 1];
            if (z1 - z0 < 0.02) continue;
            const grow = z0 >= ta - 1e-4 && z0 < ta + hf - 1e-4 || Math.abs(z0 - ta - hf) < 1e-3;
            let sec = OPEN(D(outerOf(z0, z1), z0 >= zp - 1e-4 ? Pat(z1) : holes2));
            if (prev && sec) sec = OPEN(I(sec, grow ? OFF(prev, FL / NS + 0.01) : prev));   // non sporge oltre la fetta sotto
            if (empty(sec)) break;
            slabs.push(EXTZ(sec, z0 - (i ? 0.005 : 0), z1));
            prev = sec;
          }
          m = U3(slabs);
          // svasature sulla faccia esterna: non mangiano il setto tra due fori vicini (ne restano almeno 1,2 mm sul piatto)
          // né il bordo della copertura (resta almeno WMIN)
          const fl0 = Math.min(1.2, 0.6 * (zp - zR));
          const flares = [];
          for (const [X, Y, r] of lens) {
            let fl = fl0;
            for (const [X2, Y2, r2] of lens) if (X2 !== X || Y2 !== Y) fl = Math.min(fl, (Math.hypot(X2 - X, Y2 - Y) - r - r2 - 1.2) / 2);
            let lo = 0, hi = r + fl0 + WMIN;                       // raggio del cerchio più grande attorno al foro che sta nella copertura
            if (!empty(D(C2(X, Y, hi, 64), W0))) { for (let q = 0; q < 14; q++) { const mid = (lo + hi) / 2; if (empty(D(C2(X, Y, mid, 64), W0))) lo = mid; else hi = mid; } fl = Math.min(fl, lo - r - WMIN); }
            if (fl > 0.05) flares.push(loft([[C2(X, Y, r + fl, 64), zR - 0.01], [C2(X, Y, r, 64), zR + fl]]));
          }
          if (flares.length) m = sub(m, U3(flares));
          capFace = D(W0, OFF(holes2, fl0 + 0.3)); capZ = zR;
        } else { m = sub(solid, U3([EXTZ(inner, zR - 1, zTop + 1), loft([[OFF(inner, ch), zR - 0.01], [inner, zR + ch]])])); capFace = D(W0, OFF(inner, ch + 0.3)); capZ = zR; }
        insert = m;
      }

      // ---- tasti ----
      const keys = [...t.sx.map(k => [-1, k]), ...t.dx.map(k => [1, k])].map(([sd, [c, len, tipo]]) => ({ sd, y: t.L / 2 - c, len, tipo, w: tipo === 'camera' ? (t.wcc || t.w) : t.w }));
      const xs = (sd, a, b) => (sd < 0 ? [-b, -a] : [a, b]);
      let covered = 0;
      const bh = [];   // fori dei tasti
      for (const k of keys) {
        const always = k.tipo === 'camera' || k.tipo === 'silenzioso';
        const hMax = t.T + gz - 0.5;
        if (tpu && p.tasti === 'coperti' && !always) {
          // tasto coperto: la parete si assottiglia a 0,8 mm sopra il tasto e fuori c'è un rilievo da premere
          const [a0, a1] = xs(k.sd, t.W / 2 - 1, t.W / 2 + g + s - 0.8);
          cuts.push(prismX(RR(k.y - k.len / 2 - 0.6, zm - Math.min(k.w + 1, hMax) / 2, k.y + k.len / 2 + 0.6, zm + Math.min(k.w + 1, hMax) / 2, 1), a0, a1));
          const [b0, b1] = xs(k.sd, t.W / 2 + g + s - 0.05, t.W / 2 + g + s + 0.6);
          adds.push(prismX(RR(k.y - k.len / 2 + 0.6, zm - (k.w - 0.4) / 2, k.y + k.len / 2 - 0.6, zm + (k.w - 0.4) / 2, (k.w - 0.4) / 2), b0, b1));
          covered++;
          continue;
        }
        // il Camera Control vuole 25 × 4,2 mm liberi (linee guida Apple); gli altri tasti 2 mm in più per parte, la parete è aperta
        const cc = k.tipo === 'camera', len = cc ? Math.max(k.len + 2 * cb, 25) : k.len + 2 * cb + 4;
        bh.push({ sd: k.sd, y0: k.y - len / 2, y1: k.y + len / 2, w: cc ? Math.max(k.w + 2 * cb, 4.2) : k.w + 2 * cb, cc, n: 1 });
      }
      // i tasti vicini sullo stesso fianco (azione e volume, interruttore e volume) diventano un'unica apertura
      bh.sort((a, b) => a.sd - b.sd || a.y0 - b.y0);
      const slots = [];
      for (const h of bh) {
        const q = slots[slots.length - 1];
        if (q && q.sd === h.sd && !q.cc && !h.cc && h.y0 - q.y1 < 10) { q.y1 = Math.max(q.y1, h.y1); q.w = Math.max(q.w, h.w); q.n++; }
        else slots.push(Object.assign({}, h));
      }
      for (const h of slots) {
        if (!h.cc) {
          // parete aperta dal retro fino al bordo sullo schermo (come le cover in commercio): il dito arriva a tutto il tasto
          const r = Math.min(2, (h.y1 - h.y0) / 2), [a0, a1] = xs(h.sd, t.W / 2 - 6, t.W / 2 + g + s + 1);
          cuts.push(prismX(RR(h.y0, tb + 0.2, h.y1, zr + 2 * r + 1, r), a0, a1));
          continue;
        }
        // Camera Control: asola; con una cover rigida è più alta e svasata fuori, così il dito ci arriva
        const hh = Math.min(tpu ? h.w : Math.max(h.w, 4.5), t.T + gz - 0.5), ch = tpu ? 0.4 : 0.8;
        const sec = RR(h.y0, zm - hh / 2, h.y1, zm + hh / 2, hh / 2), xo = h.sd * (t.W / 2 + g + s);
        const [a0, a1] = xs(h.sd, t.W / 2 - 1.5, t.W / 2 + g + s + 1);
        cuts.push(prismX(sec, a0, a1), loftX([[sec, xo - h.sd * ch], [OFF(sec, ch + 0.01), xo + h.sd * 0.01]]));
      }
      const opens = slots.filter(h => !h.cc).length, ccSlot = slots.some(h => h.cc);

      // ---- fondo: aperto dal retro al bordo per cavo, altoparlante e microfoni (non tocca gli angoli) ----
      const X = (u) => -t.W / 2 + u, [uc, uw] = t.usb, sp = t.sp || [uc, uc];
      const fx0 = Math.max(X(Math.min(sp[0], uc - uw / 2 - cb) - 3), -t.W / 2 + 9), fx1 = Math.min(X(Math.max(sp[1], uc + uw / 2 + cb) + 3), t.W / 2 - 9);
      cuts.push(prismY(RR(fx0, tb + 0.2, fx1, zr + 6, 2.5), -t.L / 2 - g - s - 1, -t.L / 2 + 6));
      // ---- cima: fori dei microfoni [centro x guardando lo schermo, larghezza], asole tonde a metà spessore ----
      for (const [u, w] of (t.cima || [])) {
        const a = w + 2 * cb, h = Math.min(a, t.T - 2);
        cuts.push(prismY(RR(X(u) - a / 2, zm - h / 2, X(u) + a / 2, zm + h / 2, h / 2), t.L / 2 - 3, t.L / 2 + g + s + 1));
      }

      // ---- MagSafe: incavo ad anello per un anello magnetico adesivo, centrato sul MagSafe del telefono ----
      // dentro: sul lato del telefono, l'anello resta nascosto; fuori: sul retro, a vista
      let magCS = null, magInfo = null, magY0 = Infinity;   // magY0: dove finisce in basso l'incavo
      if (p.magsafe === 'dentro' || p.magsafe === 'fuori') {
        const cy = t.L / 2 - (t.mag || t.L / 2), tl = 0.15, dep = p.magSp + 0.1;
        const ro = p.magDe / 2 + tl, ri = Math.max(1, p.magDi / 2 - tl);
        magCS = D(C2(0, cy, ro, 128), C2(0, cy, ri, 128));
        if (p.magCoda) magCS = U([magCS, RR(-5.5 - tl, cy - ro - 6.5, 5.5 + tl, cy - ro + 1, 1)]);   // linguetta che orienta gli accessori
        magY0 = cy - ro - (p.magCoda ? 6.5 : 0);
        const inside = p.magsafe === 'dentro';
        if (inside && tb - dep < 0.6) notes.push(`Incavo MagSafe profondo ${fmt(dep)} mm su un retro di ${fmt(tb)} mm: sotto restano ${fmt(Math.max(0, tb - dep))} mm. Aumenta lo spessore del retro`);
        cuts.push(inside ? EXTZ(magCS, tb - dep, tb + 0.01) : EXTZ(magCS, -0.01, dep));
        magInfo = `incavo ${inside ? 'dentro la cover (anello nascosto)' : 'sul retro (anello a vista)'} per un anello Ø ${fmt(p.magDe)}/${fmt(p.magDi)} × ${fmt(p.magSp)} mm${p.magCoda ? ' con linguetta' : ''}, centrato sul MagSafe del telefono`;
      }

      // ---- guida a coda di rondine per il cavalletto, scavata nel retro (stretta fuori, larga dentro) ----
      const wn = 8, wd = wn + 2 * DD;
      let slotCS = null, ys = 0, yTop = 0, slot = null;
      const winY0 = bounds(winOut).y0;
      if (stand) {
        const dove = (c0) => P2([[c0 - wn / 2, -0.01], [c0 + wn / 2, -0.01], [c0 + wd / 2, DD], [c0 - wd / 2, DD]]);
        // in verticale la guida sta sotto la fotocamera e sotto l'anello MagSafe
        if (vert) { ys = Math.min(-t.L / 2 + 0.4 * t.L, winY0 - wd, magY0 - wd / 2 - 1.5); slot = prismX(dove(ys), -Wo / 2 - 1, Wo / 2 + 1); slotCS = RECT(-Wo, ys - wd / 2 - 0.8, Wo, ys + wd / 2 + 0.8); }
        else { yTop = winY0 - 4; slot = prismY(dove(0), -Lo / 2 - 1, yTop); slotCS = RECT(-wd / 2 - 0.8, -Lo, wd / 2 + 0.8, yTop + 0.8); }
        cuts.push(slot);
      }

      // ---- retro: scritta e disegno, visti da fuori (quindi a specchio guardando dentro la cover) ----
      const F = DEC ? DEC.filaments(p, p.disegno === 'svg' ? DEC.artOf('svg', p.svg) : null) : [p.col1, p.col2, p.col3, p.col4];
      const deco = { 2: [], 3: [], 4: [] }, depth = Math.min(p.profRetro, tb - 0.4), st = p.stileRetro;
      let capMark = null, capCol = 2;   // logo SP a filo sulla copertura delle lenti e il suo colore (quello della scritta)
      let decoInfo = null;
      if (DEC) {
        const noz = +p.ugello || 0.4, hasT = [p.scritta, p.scritta2].some(x => x && String(x).trim());
        const art = p.disegno === 'svg' ? DEC.artOf('svg', p.svg) : null;   // sul retro solo il disegno SVG caricato
        if (p.disegno === 'svg' && !art) notes.push('Carica un file SVG con il pulsante del riquadro "Il tuo disegno"');
        // zona libera: sotto la fotocamera, lontano dai bordi
        const ax0 = -t.W / 2 + 6, ax1 = t.W / 2 - 6, ay1 = winY0 - 5;
        // con il cavalletto in verticale la decorazione sta sopra la guida: sotto la copre la gamba
        const ay0 = stand && vert && ay1 - (ys + wd / 2 + 3) >= 22 ? ys + wd / 2 + 3 : -t.L / 2 + 10;
        const area = I(OFF(base, -5), RECT(ax0, ay0, ax1, ay1));   // dove parte la scritta (poi le frecce la portano in tutta la zona libera)
        const mir = (c) => (empty(c) ? null : R2(c.mirror([1, 0])));
        // zona libera: tutta la parte piatta del retro (dove finisce l'arrotondamento dello spigolo) meno 1,5 mm, senza la finestra
        // della fotocamera, la guida del cavalletto e il MagSafe scavato fuori. Vista da fuori, quindi a specchio
        const flatOut = p.profilo === 'dritto' || rb < 0.1 ? out : OFF(out, -(p.profilo === 'smussato' ? rb : 0.586 * rb));
        const zone = mir(D(OFF(flatOut, -1.5), U([OFF(winOut, 2), slotCS, magCS && p.magsafe === 'fuori' ? OFF(magCS, 0.6) : null])));
        let artCS = null, txt = null;
        // colore della scritta (e del marchio SP): scelto, oppure quello che stacca di più dalla cover
        let ts = Math.min(4, Math.max(2, +p.colTesto || 3));
        if (p.colTesto === 'auto' && root.SPLAB_SVG) ts = [2, 3, 4].sort((a, b) => root.SPLAB_SVG.dist(F[b - 1], F[0]) - root.SPLAB_SVG.dist(F[a - 1], F[0]))[0];
        if ((art || hasT) && area && ay1 - ay0 > 15) {
          const has2 = p.scritta2 && String(p.scritta2).trim(), has1 = p.scritta && String(p.scritta).trim();
          const tH = hasT ? 1.5 * ((has1 ? p.altTesto : 0) + (has2 ? +p.altTesto2 || p.altTesto : 0)) : 0, gap = art && hasT ? 5 : 0;
          const Sa = art ? Math.max(8, Math.min(p.altDisegno, ay1 - ay0 - tH - gap, ax1 - ax0)) : 0;
          const tot = Sa + gap + tH, cy = (ay0 + ay1) / 2 + tot / 2;
          const slots = {};
          if (art) {
            const dP = Array.isArray(p.posDisegno) ? p.posDisegno : [0, 0], g0 = DEC.artGeom(art, Sa, ax1 - ax0), ay = cy - Sa / 2 + (+dP[1] || 0), place = (c) => (c ? MV(c, +dP[0] || 0, ay) : null);
            const sil = place(g0.sil);
            artCS = st === 'filo' ? sil : st === 'inciso' ? (g0.lines ? place(g0.lines) : sil) : (g0.lines ? place(I(g0.lines, OFF(g0.sil, -1.3 * g0.k))) : sil);
            if (st === 'filo') {
              const sl = DEC.artSlots(g0, F, OFF(g0.sil, 0.01), noz, notes, true);
              for (const k of [2, 3, 4]) if (sl[k]) slots[k] = place(sl[k]);
              { const sA = g0.sil.area(), cA = [2, 3, 4].reduce((s, k) => s + (sl[k] ? sl[k].area() : 0), 0); if (sA > 1 && cA < 0.05 * sA) notes.push('Il disegno ha quasi solo il colore della cover (Colore 1), quindi a filo non si vede: dagli un colore diverso nei Colori 2–4, oppure cambia il Colore 1'); }
              // le parti del colore della cover restano della cover: la sagoma serve solo a ritagliare
            }
          }
          if (hasT) {
            txt = DEC.fitText(p, { x: 0, y: cy - Sa - gap - tH / 2, w: ax1 - ax0, h: Math.max(4, tH) }, p.altTesto);
            if (txt && txt.reduced) notes.push(`~Scritta ridotta a ${fmt(txt.cap)} mm per starci`);
          }
          const keep = (c) => I(c, zone);
          if (txt) { const kc = keep(txt.cs); if (empty(kc) || kc.area() < txt.cs.area() * 0.98) notes.push('La scritta esce dalla parte piatta del retro o tocca fotocamera, guida o MagSafe: lì viene tagliata. Spostala con le frecce o rimpiccioliscila'); }
          if (st === 'filo') {
            const tcs = txt ? keep(txt.cs) : null;
            for (const k of [2, 3, 4]) {
              let c = slots[k] ? keep(D(slots[k], tcs ? OFF(tcs, 0.6) : null)) : null;
              if (k === ts) c = U([c, tcs]);
              if (!empty(c)) deco[k].push(EXTZ(mir(c), 0, depth));
            }
            decoInfo = `a filo, nei primi ${fmt(depth)} mm del retro (serve una stampante multicolore, o un cambio di filamento a ${fmt(depth)} mm)`;
          } else {
            let hole = U([artCS ? keep(artCS) : null, txt ? keep(st === 'traforata' ? DEC.stencil(txt.cs, txt.cap) : txt.cs) : null]);
            if (st === 'traforata' && artCS) { const r = DEC.perforate(hole, OFF(base, -3)); hole = r.holes; if (r.bridges) notes.push(`~${r.bridges} ponticell${r.bridges > 1 ? 'i tengono' : 'o tiene'} attaccate le parti del disegno`); }
            if (!empty(hole)) cuts.push(st === 'traforata' ? EXTZ(mir(hole), -1, tb + 0.05) : EXTZ(mir(hole), -1, depth));
            decoInfo = st === 'traforata' ? 'traforato: si vede il retro del telefono' : `inciso ${fmt(depth)} mm`;
          }
          if (txt && txt.cap < 4) notes.push('Lettere sotto i 4 mm: vengono poco leggibili. Ingrandisci la scritta o accorcia il testo');
          if (stand) notes.push('~La guida del cavalletto passa sul retro: la decorazione le lascia spazio');
        } else if (art || hasT) notes.push('Sul retro non c\'è spazio per la decorazione: togli la scritta o il disegno, oppure rimpiccioliscili');
        // marchio SP: nell'angolo in basso della parte piatta del retro (visto da fuori), lontano da scritta e disegno; stesso stile della scritta.
        // Oppure sulla faccia esterna della copertura delle lenti, tra i fori
        const onCap = p.doveMarchio === 'lenti';
        if (p.marchio && onCap && !capFace) notes.push('Logo SP sulla copertura delle lenti: c\'è solo con "Copertura a parte" e lenti che sporgono dal retro. L\'ho messo sul retro');
        if (p.marchio && onCap && capFace) {
          const mk = DEC.placeMark(mir(OFF(capFace, -0.5)), p, notes, null, 0.3), dC = Math.min(depth, 0.6);
          if (mk) {
            const sol = EXTZ(mir(mk), capZ - 0.01, capZ + dC);
            capMark = st === 'filo' ? sol : null; capCol = DEC.markCol(p, ts);
            insert = sub(insert, sol);
            info.push(['Logo SP', `sulla copertura delle lenti, ${st === 'filo' ? `a filo nei primi ${fmt(dC)} mm` : `inciso ${fmt(dC)} mm`}`]);
          }
        }
        const mk = onCap && capFace ? null : DEC.placeMark(zone, p, notes, U([txt ? txt.cs : null, artCS]), 0);
        if (mk) {
          if (st === 'filo') deco[DEC.markCol(p, ts)].push(EXTZ(mir(mk), 0, depth));
          else cuts.push(st === 'traforata' ? EXTZ(mir(DEC.stencil(mk, 5)), -1, tb + 0.05) : EXTZ(mir(mk), -1, depth));
          if (!decoInfo) decoInfo = st === 'filo' ? `a filo, nei primi ${fmt(depth)} mm del retro` : st === 'traforata' ? 'traforato' : `inciso ${fmt(depth)} mm`;
        }
        DEC.logoNotes(noz);
      }

      // ---- montaggio ----
      if (adds.length) shell = union([shell, ...adds]);
      let bodyM = sub(shell, U3(cuts));
      const colorM = {};
      for (const k of [2, 3, 4]) {
        let m = U3(deco[k]);
        if (m) { bodyM = sub(bodyM, m); colorM[k] = m; }
      }
      // striscia di prova: un pezzo della cover per controllare le misure in pochi minuti
      const strip = p.prova === 'cima' ? box(-Wo, t.L / 2 - 22, -5, Wo, Lo, zr + 5) : p.prova === 'fondo' ? box(-Wo, -Lo, -5, Wo, -t.L / 2 + 22, zr + 5) : null;
      const cut = (m) => (m && strip ? reg(m.intersect(strip)) : m);
      bodyM = cut(bodyM);
      const G = 'Cover', parts = [];
      const part = (name, m, color, extra) => (m && !m.isEmpty() ? Object.assign({ name, m: flip(m, zr), print: m, role: 'body', color, group: G }, extra || {}) : null);
      parts.push(part('Cover', bodyM, F[0]));
      for (const k of [2, 3, 4]) if (colorM[k]) parts.push(part(`Cover · colore ${k}`, cut(colorM[k]), F[k - 1]));

      // ---- cavalletto: pezzo a parte, stampato steso sul fianco (la gamba non si spezza tra gli strati) ----
      let standInfo = null;
      if (stand && !strip) {
        const tol = p.giocoCav, tl = 3.2, beta = p.inclinazione * Math.PI / 180;
        // dal piede della cover (lo spigolo che appoggia sul tavolo) al centro della guida, lungo il retro
        const d = vert ? ys + Lo / 2 : Wo / 2, hc = (vert ? Lo : Wo) / 2;
        const xcm = hc * Math.sin(beta) - (tb + t.T / 2) * Math.cos(beta);
        const Px = d * Math.sin(beta), Py = d * Math.cos(beta), Qx = Math.max(1.6 * xcm, Px + 14);
        // profilo nel piano (u lungo il retro verso il tavolo, w fuori dal retro)
        const uQ = Py * Math.cos(beta) - (Qx - Px) * Math.sin(beta), wQ = (Qx - Px) * Math.cos(beta) + Py * Math.sin(beta);
        // linguetta: i fianchi a 45° della guida, rientrati del gioco (in orizzontale fa gioco × √2)
        const tw = (w) => wn / 2 - w - tol * Math.SQRT2, wt = -(DD - tol);
        const tongue = P2([[-tw(0.4), 0.4], [tw(0.4), 0.4], [tw(wt), wt], [-tw(wt), wt]]);
        const pad = RR(-wd / 2 - 3, 0, wd / 2 + 3, tl, 1);
        const prof = U([tongue, pad, stroke([wn / 2, tl / 2], [uQ, wQ], tl)]);
        const Ls = vert ? Wo - 12 : Math.min(60, yTop + Lo / 2 - 8);
        const flat = EXTZ(prof, 0, Ls);                                  // per la stampa: profilo sul piatto
        const ycen = vert ? ys : (-Lo / 2 + yTop) / 2;
        // in posizione nella guida (coordinate della cover)
        const placed = reg(reg(flat.translate([0, 0, 0])).warp(vert
          ? (v) => { const [u, w, e] = [v[0], v[1], v[2]]; v[0] = e - Ls / 2; v[1] = ys - u; v[2] = -w; }
          : (v) => { const [u, w, e] = [v[0], v[1], v[2]]; v[0] = -u; v[1] = ycen + Ls / 2 - e; v[2] = -w; }));
        parts.push({ name: 'Cavalletto', m: flip(placed, zr), print: flat, role: 'body', color: F[0], group: 'Cavalletto' });
        standInfo = `${vert ? 'in verticale' : 'in orizzontale'}, inclinato di ${fmt(p.inclinazione)}°: gamba ${fmt(Math.hypot(uQ - wn / 2, wQ))} mm, largo ${fmt(Ls)} mm. Si infila nella guida ${vert ? 'da un fianco' : 'dal fondo'}`;
      }
      if (insert && p.prova !== 'fondo') {
        const k = Math.min(4, Math.max(1, +p.colCornice || 1));
        parts.push({ name: 'Copertura fotocamera', m: flip(insert, zr), print: insert, role: 'body', color: F[k - 1], group: 'Copertura fotocamera' });
        if (capMark) parts.push({ name: 'Copertura fotocamera · logo', m: flip(capMark, zr), print: capMark, role: 'body', color: F[capCol - 1], group: 'Copertura fotocamera' });
        if (capMark && capCol === k) notes.push('Il logo sulla copertura ha lo stesso colore della copertura: a filo non si vede. Cambia il colore della scritta o della copertura');
      }
      // il telefono, per vedere come ci sta
      const ghostM = U3([phoneSolid(t, base, 0, 0, tb), cam.bump(tb)]);
      parts.push({ name: 'Telefono', m: flip(cut(ghostM), zr), role: 'ghost' });

      // ---- riquadro misure ----
      info.push(['Telefono', `${t.nome}: ${fmt(t.W)} × ${fmt(t.L)} × ${fmt(t.T)} mm` + (t.fonte ? ` (disegno Apple del ${t.fonte.split('-').reverse().join('/')})` : t.misure ? ` (${t.misure})` : '')]);
      info.push(['Cover', `${fmt(Wo)} × ${fmt(Lo)} × ${fmt(zr)} mm · pareti ${fmt(s)} mm · retro ${fmt(tb)} mm`]);
      info.push(['Materiale', tpu ? 'TPU: il telefono entra a scatto sotto il bordo' : 'PLA o PETG: rigida. Il telefono entra inclinato: prima la cima sotto il bordo, poi premi giù il fondo (le pareti si piegano un poco)']);
      info.push(['Gioco', `${fmt(g)} mm sui lati, ${fmt(gz)} mm sullo spessore, ${fmt(cb)} mm attorno a tasti e connettore`]);
      info.push(['Bordo sullo schermo', `copre ${fmt(lip)} mm di vetro e sporge ${fmt(hs)} mm sopra lo schermo`]);
      const lens = C.v - tb;
      if (insert) info.push(['Fotocamera', `${t.lenti ? 'copertura a parte: chiude la finestra e lascia aperti solo lenti, flash e sensori' : 'cornice a parte attorno alla fotocamera'}; sporge ${fmt(ringOut)} mm dal retro, ${fmt(up)} mm oltre le lenti. Si infila da dentro la cover prima del telefono: il suo bordo largo ${fmt(FLinfo)} mm resta in un incavo del retro e il telefono la tiene ferma`]);
      else info.push(['Fotocamera', lens > 0.05 ? `le lenti sporgono ${fmt(lens)} mm dal retro della cover` : `lenti ${fmt(-lens)} mm dentro il retro: appoggiata sul tavolo la cover non le tocca`]);
      if (thick) info.push(['Retro', `${fmt(tb)} mm: il rialzo della fotocamera è largo quanto il telefono e sta in una tasca, così fuori il retro resta piatto`]);
      if (covered) info.push(['Tasti', `${covered} coperti: si premono attraverso la cover`]);
      info.push(['Aperture', `${opens ? 'fianchi aperti dal retro al bordo dove ci sono i tasti' : 'tasti coperti'}${ccSlot ? ', asola per il Camera Control' : ''}; fondo aperto per cavo, altoparlante e microfoni${t.cima ? '; foro per il microfono in cima' : ''}`]);
      if (decoInfo) info.push(['Decorazione', decoInfo]);
      if (standInfo) info.push(['Cavalletto', standInfo]);
      if (magInfo) {
        info.push(['MagSafe', magInfo]);
        if (!empty(I(magCS, OFF(winOut, 0.5)))) notes.push('L\'incavo MagSafe arriva alla finestra della fotocamera: usa un anello più piccolo');
        if (slotCS && !empty(I(magCS, slotCS))) notes.push(p.magsafe === 'dentro' ? '~La guida del cavalletto passa sotto l\'incavo MagSafe: il retro è più spesso perché tra i due restino 0,6 mm' : '~La guida del cavalletto attraversa l\'incavo MagSafe sul retro: l\'anello ci passa sopra');
        if (t.custom) notes.push('~Misure tue: l\'incavo MagSafe è al centro del telefono');
      }
      if (strip) info.push(['Prova', `solo ${p.prova === 'cima' ? 'la cima' : 'il fondo'} (22 mm): stampala per controllare misure e gioco, poi spegni la prova`]);
      info.push(['Stampa', `retro sul piatto, senza supporti${tpu ? '; il TPU va stampato lento (20–30 mm/s)' : ''}`]);
      if (!insert && lens > 0.15) notes.push('Le lenti sporgono dalla cover: scegli la copertura a parte per proteggerle');
      if (insert) notes.push('~Stampa la copertura in PLA o PETG opaco, con la faccia esterna sul piatto come la cover: il TPU è troppo morbido e un materiale chiaro fa passare la luce del flash nelle foto');
      if (t.fonte && tb > 2.1) notes.push(`Retro di ${fmt(tb)} mm: Apple indica al massimo 2,1 mm perché la ricarica MagSafe funzioni sempre: riduci lo spessore del retro`);
      if (!tpu && lip > 0.8) notes.push(`Bordo sul vetro di ${fmt(lip)} mm: con PLA o PETG il telefono rischia di non entrare o di rompere la cover. Meglio 0,6 mm o meno`);
      if (t.piano && lip > t.piano + 0.6) notes.push(`Il bordo arriva ${fmt(lip - t.piano)} mm dentro la parte piatta dello schermo: riduci il bordo sul vetro`);
      if (t.misure) notes.push('~Misure non da un disegno ufficiale: stampa prima la striscia di prova (cima e fondo) per controllare fotocamera, tasti e gioco. Se il telefono balla anche con gioco 0, prova −0,1 e poi −0,2' + (tpu ? '' : '; con PLA o PETG tiene meglio anche un bordo sul vetro di 0,8 mm'));
      for (const n of notes) info.push(['Nota', n]);
      if (DEC) { for (const n of DEC.NOTES) info.push(['Nota', n]); DEC.NOTES.clear(); }
      return { parts: parts.filter(Boolean), info, view: [0.55, -0.9, 0.75] };
    }

    return { cover };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

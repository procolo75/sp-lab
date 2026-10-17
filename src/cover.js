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
      const plat = c.tutto ? I(OFF(base, -backIn), RECT(-t.W, t.L / 2 - c.r[3], t.W, t.L)) : backRR(t, c.r);
      const win = c.f ? backRR(t, c.f) : R2(CrossSection.hull([plat, ...(c.fori || []).map(([x, y, d]) => C2(t.W / 2 - x, t.L / 2 - y, d / 2))]));
      return { plat, win };
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
      // Arrotondo anche gli angoli in basso (raggio 9 mm): la copertura scende quanto basta perché il rialzo ci stia ancora dentro
      if (ring && C.tutto) {
        const R = 9, keep = OFF(cam.plat, cw), cav = OFF(base, g - tolR);
        for (let ext = 0; ext <= 14; ext += 0.5) {
          const s2 = I(R2(CrossSection.hull([W0, MV(W0, 0, -ext)])), cav), y0 = bounds(s2).y0;
          const r = U([OFF(OFF(s2, -R), R), I(s2, RECT(-t.W, y0 + R, t.W, t.L))]);
          if (empty(D(keep, r))) { W0 = r; break; }
        }
      }
      const winOut = ring ? OFF(W0, tolR) : OFF(cam.win, cw + chamf);
      if (!ring) cuts.push(loft([[winOut, -0.01], [OFF(cam.win, cw), tb + 0.01]]));
      if (thick) cuts.push(EXTZ(OFF(cam.plat, g), tb - C.h - 0.25, tb + 0.02));          // tasca per il rialzo largo
      // copertura a parte: chiude la finestra lasciando aperti solo lenti, flash e sensori, e sporge oltre le lenti.
      // Ha una flangia che sta in un incavo dentro la cover, sotto il telefono: la tiene ferma il telefono, senza colla.
      // Senza le posizioni delle lenti (misure scritte a mano) è solo un anello attorno alla fotocamera.
      let insert = null, ringOut = 0, FLinfo = 0;
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
        const ch = Math.min(RW - 0.5, 0.6);
        const solid = U3([EXTZ(W0, zR, ta + 0.01), loft([[W0, ta], [flange, ta + hf]]), EXTZ(flange, ta + hf - 0.01, zTop)]);
        let m;
        if (t.lenti) {
          // tasca per il rialzo (se non è già quello il piano d'appoggio) e un foro svasato a 45° per ogni lente e sensore
          const holes = [EXTZ(OFF(cam.plat, cw), zTop - C.h - 0.2, zTop + 1)];
          const fl = Math.min(1.2, 0.6 * (zTop - C.h - zR));
          for (const [x, y, d] of t.lenti) {
            const X = t.W / 2 - x, Y = t.L / 2 - y, r = d / 2 + 0.4;
            holes.push(EXTZ(C2(X, Y, r, 64), zR - 1, zTop + 1), loft([[C2(X, Y, r + fl, 64), zR - 0.01], [C2(X, Y, r, 64), zR + fl]]));
          }
          m = sub(solid, U3(holes));
        } else m = sub(solid, U3([EXTZ(inner, zR - 1, zTop + 1), loft([[OFF(inner, ch), zR - 0.01], [inner, zR + ch]])]));
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
      let decoInfo = null;
      if (DEC) {
        const noz = +p.ugello || 0.4, hasT = [p.scritta, p.scritta2].some(x => x && String(x).trim());
        const art = p.disegno === 'svg' ? DEC.artOf('svg', p.svg) : null;   // sul retro solo il disegno SVG caricato
        if (p.disegno === 'svg' && !art) notes.push('Carica un file SVG con il pulsante del riquadro "Il tuo disegno"');
        // zona libera: sotto la fotocamera, lontano dai bordi
        const ax0 = -t.W / 2 + 6, ax1 = t.W / 2 - 6, ay1 = winY0 - 5;
        // con il cavalletto in verticale la decorazione sta sopra la guida: sotto la copre la gamba
        const ay0 = stand && vert && ay1 - (ys + wd / 2 + 3) >= 22 ? ys + wd / 2 + 3 : -t.L / 2 + 10;
        const area = I(OFF(base, -5), RECT(ax0, ay0, ax1, ay1));
        if ((art || hasT) && area && ay1 - ay0 > 15) {
          const has2 = p.scritta2 && String(p.scritta2).trim(), has1 = p.scritta && String(p.scritta).trim();
          const tH = hasT ? 1.5 * ((has1 ? p.altTesto : 0) + (has2 ? +p.altTesto2 || p.altTesto : 0)) : 0, gap = art && hasT ? 5 : 0;
          const Sa = art ? Math.max(8, Math.min(p.altDisegno, ay1 - ay0 - tH - gap, ax1 - ax0)) : 0;
          const tot = Sa + gap + tH, cy = (ay0 + ay1) / 2 + tot / 2;
          let artCS = null, txt = null;
          const slots = {};
          if (art) {
            const g0 = DEC.artGeom(art, Sa, ax1 - ax0), ay = cy - Sa / 2, place = (c) => (c ? MV(c, 0, ay) : null);
            const sil = place(g0.sil);
            artCS = st === 'filo' ? sil : st === 'inciso' ? (g0.lines ? place(g0.lines) : sil) : (g0.lines ? place(I(g0.lines, OFF(g0.sil, -1.3 * g0.k))) : sil);
            if (st === 'filo') {
              const sl = DEC.artSlots(g0, F, OFF(g0.sil, 0.01), noz, notes);
              for (const k of [2, 3, 4]) if (sl[k]) slots[k] = place(sl[k]);
              // le parti del colore della cover restano della cover: la sagoma serve solo a ritagliare
            }
          }
          if (hasT) {
            txt = DEC.fitText(p, { x: 0, y: cy - Sa - gap - tH / 2, w: ax1 - ax0, h: Math.max(4, tH) }, p.altTesto);
            if (txt && txt.reduced) notes.push(`~Scritta ridotta a ${fmt(txt.cap)} mm per starci`);
          }
          // colore della scritta: scelto, oppure quello che stacca di più dalla cover
          let ts = Math.min(4, Math.max(2, +p.colTesto || 3));
          if (p.colTesto === 'auto' && root.SPLAB_SVG) ts = [2, 3, 4].sort((a, b) => root.SPLAB_SVG.dist(F[b - 1], F[0]) - root.SPLAB_SVG.dist(F[a - 1], F[0]))[0];
          const mir = (c) => (empty(c) ? null : R2(c.mirror([1, 0])));
          const keep = (c) => D(D(I(c, area), slotCS), p.magsafe === 'fuori' ? OFF(magCS, 0.6) : null);
          if (txt && txt.moved) { const kc = keep(txt.cs); if (empty(kc) || kc.area() < txt.cs.area() * 0.98) notes.push('La scritta spostata esce dalla zona libera del retro (sotto la fotocamera, a 5 mm dai bordi): la parte fuori viene tagliata: riportala dentro con le frecce'); }
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
      }
      // il telefono, per vedere come ci sta
      const ghostM = U3([phoneSolid(t, base, 0, 0, tb), EXTZ(cam.plat, tb - C.h, tb + 0.5)]);
      parts.push({ name: 'Telefono', m: flip(cut(ghostM), zr), role: 'ghost' });

      // ---- riquadro misure ----
      info.push(['Telefono', `${t.nome}: ${fmt(t.W)} × ${fmt(t.L)} × ${fmt(t.T)} mm` + (t.fonte ? ` (disegno Apple del ${t.fonte.split('-').reverse().join('/')})` : '')]);
      info.push(['Cover', `${fmt(Wo)} × ${fmt(Lo)} × ${fmt(zr)} mm · pareti ${fmt(s)} mm · retro ${fmt(tb)} mm`]);
      info.push(['Materiale', tpu ? 'TPU: il telefono entra a scatto sotto il bordo' : 'PLA o PETG: rigida. Il telefono entra inclinato: prima la cima sotto il bordo, poi premi giù il fondo (le pareti si piegano un poco)']);
      info.push(['Gioco', `${fmt(g)} mm sui lati, ${fmt(gz)} mm sullo spessore, ${fmt(cb)} mm attorno a tasti e connettore`]);
      info.push(['Bordo sullo schermo', `copre ${fmt(lip)} mm di vetro e sporge ${fmt(hs)} mm sopra lo schermo`]);
      const lens = C.v - tb;
      if (insert) info.push(['Fotocamera', `${t.lenti ? 'copertura a parte: chiude la finestra e lascia aperti solo lenti, flash e sensori' : 'cornice a parte attorno alla fotocamera'}; sporge ${fmt(ringOut)} mm dal retro, ${fmt(up)} mm oltre le lenti. Si infila da dentro la cover prima del telefono: il suo bordo largo ${fmt(FLinfo)} mm resta in un incavo del retro e il telefono la tiene ferma`]);
      else info.push(['Fotocamera', lens > 0.05 ? `le lenti sporgono ${fmt(lens)} mm dal retro della cover` : `lenti ${fmt(-lens)} mm dentro il retro: appoggiata sul tavolo la cover non le tocca`]);
      if (thick) info.push(['Retro', `${fmt(tb)} mm: il rialzo della fotocamera è largo quanto il telefono e sta in una tasca, così fuori il retro resta piatto`]);
      if (covered) info.push(['Tasti', `${covered} coperti: si premono attraverso la cover`]);
      info.push(['Aperture', `${opens ? 'fianchi aperti dal retro al bordo dove ci sono i tasti' : 'tasti coperti'}${ccSlot ? ', asola per il Camera Control' : ''}; fondo aperto per cavo, altoparlante e microfoni`]);
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
      if (!t.custom && tb > 2.1) notes.push(`Retro di ${fmt(tb)} mm: Apple indica al massimo 2,1 mm perché la ricarica MagSafe funzioni sempre: riduci lo spessore del retro`);
      if (!tpu && lip > 0.8) notes.push(`Bordo sul vetro di ${fmt(lip)} mm: con PLA o PETG il telefono rischia di non entrare o di rompere la cover. Meglio 0,6 mm o meno`);
      if (t.piano && lip > t.piano + 0.6) notes.push(`Il bordo arriva ${fmt(lip - t.piano)} mm dentro la parte piatta dello schermo: riduci il bordo sul vetro`);
      for (const n of notes) info.push(['Nota', n]);
      if (DEC) { for (const n of DEC.NOTES) info.push(['Nota', n]); DEC.NOTES.clear(); }
      return { parts: parts.filter(Boolean), info, view: [0.55, -0.9, 0.75] };
    }

    return { cover };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Box per schede ESP, rifatto un passo alla volta. Per ora: processore e moduli in fila sul fondo, ognuno nel suo alloggio
// con le pareti piene alte fino alla faccia di sopra del circuito e dentro un gradino su cui poggia, tutti con i piedini in su. Niente torri.
// Le misure delle schede sono in dati/schede-misure.js (SCHEDE_MISURE). Si aggancia al motore tramite SPRECOLO_EXT.
// Coordinate: x lungo la scatola (la USB del processore esce dalla parete sinistra), y in profondità (fronte verso -y), z in alto. mm.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function schede(H) {
    const { Manifold, reg, union, sub, box, slab, hullPts, fmt } = H;
    const U = (list) => { list = list.filter(Boolean); return !list.length ? null : list.length === 1 ? list[0] : union(list); };
    const X = (a, b) => reg(a.intersect(b));
    const cylZ = (x, y, z0, z1, r0, r1, seg = 40) => reg(reg(Manifold.cylinder(z1 - z0, r0, r1 === undefined ? r0 : r1, seg)).translate([x, y, z0]));
    // modulo ruotato (vista dall'alto, in senso antiorario): misure e lati dei piedini
    const ROT = { 90: { S: 'E', E: 'N', N: 'W', W: 'S' }, 180: { S: 'N', N: 'S', E: 'W', W: 'E' }, 270: { S: 'W', W: 'N', N: 'E', E: 'S' } };
    // un punto della scheda (x lungo L, y lungo W) dopo la rotazione
    const rotP = (deg, L, W) => deg === 90 ? (x, y) => [W - y, x] : deg === 180 ? (x, y) => [L - x, W - y] : (x, y) => [y, L - x];
    const ruotaF = (fi, deg, L, W) => {
      if (!fi) return fi;
      const t = rotP(deg, L, W);
      if (fi.cx !== undefined) { const [cx, cy] = t(fi.cx, fi.cy); return Object.assign({}, fi, { cx, cy }, fi.w !== undefined && deg !== 180 ? { w: fi.h, h: fi.w } : {}); }
      const [a, b] = t(fi.x0, fi.y0), [c, d] = t(fi.x1, fi.y1);
      return Object.assign({}, fi, { x0: Math.min(a, c), y0: Math.min(b, d), x1: Math.max(a, c), y1: Math.max(b, d) });
    };
    const ruota = (b, deg) => (!ROT[deg] ? b : Object.assign({}, b, deg === 180 ? {} : { L: b.W, W: b.L }, { pines: (b.pines || []).map(q => Object.assign({}, q, { lato: ROT[deg][q.lato] })), finestra: ruotaF(b.finestra, deg, b.L, b.W) }));
    // zona di una fila di piedini in pianta: dal bordo (e ext oltre) fino a 1,5 mm oltre il centro dei piedini, lunga quanto la fila più 1 mm per parte
    const pinZone = (b, bx, by, q, passo, ext) => {
      const h = q.n * passo / 2 + 1, cx = bx + b.L / 2, cy = by + b.W / 2, d = q.off + 1.5;
      return q.lato === 'S' ? [cx - h, by - ext, cx + h, by + d] : q.lato === 'N' ? [cx - h, by + b.W - d, cx + h, by + b.W + ext]
        : q.lato === 'W' ? [bx - ext, cy - h, bx + d, cy + h] : [bx + b.L - d, cy - h, bx + b.L + ext, cy + h];
    };
    const ov = (r, s) => r[0] < s[2] && s[0] < r[2] && r[1] < s[3] && s[1] < r[3];

    function schede(p) {
      const { SCHEDE, CONN, DUP, LED } = root.SCHEDE_MISURE;
      const gH = Math.max(0.6, +p.gradinoH || 2.5);
      const info = [], notes = [];
      const g = p.gioco, pw = p.pareteAll, w = p.pareti, f = p.fondo, tl = p.spCoperchio, R = p.raggio, m = p.margine, gap = p.distanza;
      const Hin = Math.max(5, +p.altezza || 25);

      // schede: il processore (piedini saldati dal lato dei componenti: sta dritto; dal lato opposto: capovolto) e i moduli, sempre dritti
      const cpuB = SCHEDE[p.cpu] && SCHEDE[p.cpu].ruolo === 'cpu' ? SCHEDE[p.cpu] : SCHEDE.d1mini;
      const items = [{ b: cpuB, cpu: true, capo: p.cpuPin === 'sotto' }];
      // i moduli "sotto il coperchio" non stanno nella fila: appoggiano su una mensola della parete scelta e su due gambe, il coperchio li blocca
      const alti = [];
      for (let i = 1; i <= 5; i++) {
        const b = SCHEDE[p['mod' + i]]; if (!b || b.ruolo !== 'mod') continue;
        const it = { b: ruota(b, +p['mod' + i + 'Rot'] || 0), cpu: false, capo: false, slot: i, rot: +p['mod' + i + 'Rot'] || 0 };
        if (p['mod' + i + 'Liv'] === 'coperchio') { it.parete = ['davanti', 'dietro', 'destra'].includes(p['mod' + i + 'Parete']) ? p['mod' + i + 'Parete'] : 'davanti'; it.lungo = +p['mod' + i + 'Lungo'] || 0; alti.push(it); }
        else items.push(it);
      }

      // ---- quote: ogni scheda il più in basso possibile ----
      // il circuito poggia sempre su un gradino: dritta, alto quanto scelto (sotto ci sono le punte dei piedini); capovolta, sopra i componenti (e la USB).
      // Con la USB la spina deve restare sopra il piano del tavolo: se serve la scheda si alza
      for (const it of items) {
        const b = it.b, c = it.cpu && b.usb ? CONN[b.usb.tipo] : null;
        let zp = it.capo ? f + Math.max(gH, b.hTop + 0.3) : f + gH;
        if (c) {
          const mid = (c.z0 + c.z1) / 2;   // centro del connettore dalla faccia dei componenti
          zp = it.capo ? Math.max(zp, c.spina[1] / 2 + 0.3 + mid, f + c.z1 + 0.2) : Math.max(zp, c.spina[1] / 2 + 0.3 - mid - b.pcb);
          it.usbZ = it.capo ? zp - mid : zp + b.pcb + mid;
        }
        it.zp = zp; it.zt = zp + b.pcb;
      }

      // ---- viti M6 (stampate) agli angoli: colonnine dal fondo, boccole filettate sotto il coperchio ----
      const VT = H.vite, vm = VT.spec(p.viteM || 'M6'), vg = Math.max(0.1, +p.viteGioco || 0.3);
      const pr = vm.D / 2 + 2.5, pc = pr + 0.3, bossLen = Math.max(6, 1.5 * vm.D);
      // svasatura sotto il fondo a 55° (a 45° lo slicer mette i supporti); se il cono esce dalla colonnina, sotto c'è un rialzo pieno
      const t55 = Math.tan(55 * Math.PI / 180), rh = (vm.D + 0.8) / 2, r0 = vm.D + 0.5, hcs = (r0 - rh) * t55;
      const rP = r0 + 0.8, zP = (rP - pr) * t55, pad = zP > f;
      const rz = (pad ? rP : pr) + 0.5;   // zona libera attorno alle colonnine

      // ---- in pianta: alloggi in fila da sinistra, il processore contro la parete sinistra ----
      // il primo e l'ultimo alloggio stanno tra le colonnine degli angoli: la scatola è profonda quanto basta
      // con i LED davanti, dietro o a destra la fila si allontana da quella parete quanto lo spazio dietro i LED
      const depth = (b) => b.W + 2 * g + 2 * pw;
      const lenL = Math.max(5, +p.ledSpazio || 25), ledSu = (lato) => [1, 2, 3, 4].some(i => p['led' + i] === lato);
      // i moduli sotto il coperchio occupano una striscia lungo la loro parete (scheda, gioco e dentino delle gambe): la fila si allontana anche da quella
      const legW = pw, perp = (it) => it.parete === 'destra' ? it.b.L : it.b.W, along = (it) => it.parete === 'destra' ? it.b.W : it.b.L;
      const striscia = (lato) => Math.max(0, ...alti.filter(it => it.parete === lato).map(it => perp(it) + 2 * g + legW));
      const lato = (s) => m + Math.max(ledSu(s) ? lenL : 0, striscia(s));
      const mF = lato('davanti'), mB = lato('dietro'), mR = lato('destra');
      // lungo la parete il modulo resta fuori dalla zona delle colonnine: se non ci sta la scatola si allarga
      const lenAlto = (it) => along(it) + 2 * (g + legW) + 2 * (pc + rz);
      items.forEach((it, k) => { const end = k === 0 || k === items.length - 1; it.lo = end ? Math.max(mF, pc + rz) : mF; it.hi = end ? Math.max(mB, pc + rz) : mB; });
      const Yin = Math.max(...items.map(it => it.lo + it.hi + depth(it.b)), ...alti.filter(it => it.parete === 'destra').map(lenAlto));
      let x = w;
      items.forEach((it, k) => {
        const b = it.b;
        it.x0 = k === 0 ? w - 0.01 : x;                     // il processore usa la parete della scatola dalla parte della USB
        it.bx = k === 0 ? w + g : x + pw + g;              // angolo davanti a sinistra della scheda
        it.x1 = it.bx + b.L + g + pw;
        it.y0 = w + it.lo + (Yin - it.lo - it.hi - depth(b)) / 2; it.by = it.y0 + pw + g; it.y1 = it.y0 + depth(b);
        x = it.x1 + gap;
      });
      const Xin = Math.max(items[items.length - 1].x1 - w + mR, 2 * (pc + rz) + 2, ...alti.filter(it => it.parete !== 'destra').map(lenAlto));
      const Xo = Xin + 2 * w, Yo = Yin + 2 * w, Zw = f + Hin, Htot = Zw + tl;
      const rimH = Math.min(3, Hin - 0.5);   // bordino del coperchio che entra nella scatola

      // ---- moduli sotto il coperchio: in pianta contro la parete, la faccia di sopra del circuito sotto il bordino del coperchio ----
      // posizione lungo la parete come per i LED: dal centro, positiva verso destra guardando la parete da fuori
      for (const it of alti) {
        const b = it.b, A = along(it), len = it.parete === 'destra' ? Yin : Xin;
        const aMax = Math.max(0, len / 2 - (pc + rz) - A / 2 - g - legW), a = Math.min(aMax, Math.max(-aMax, it.lungo));
        if (Math.abs(a - it.lungo) > 0.01) notes.push(`${b.nome.split(' (')[0]}: spostato a ${fmt(a)} mm dal centro della parete ${it.parete}, il punto più vicino a quello scelto lontano dalle colonnine delle viti`);
        it.a = a; it.A = A; it.P = perp(it);
        if (it.parete === 'davanti') { it.bx = w + Xin / 2 + a - b.L / 2; it.by = w + g; }
        else if (it.parete === 'dietro') { it.bx = w + Xin / 2 - a - b.L / 2; it.by = w + Yin - g - b.W; }
        else { it.by = w + Yin / 2 + a - b.W / 2; it.bx = w + Xin - g - b.L; }
        it.zt = Zw - Math.max(rimH, b.hTop + 0.4); it.zp = it.zt - b.pcb;
        it.zone = (b.pines || []).map(q => pinZone(b, it.bx, it.by, q, DUP.passo, g + 1));
        // dalla terna del modulo (u lungo la parete, v dalla parete verso dentro) alla pianta
        it.pt = (u, v) => it.parete === 'davanti' ? [it.bx + u, it.by + v] : it.parete === 'dietro' ? [it.bx + u, it.by + b.W - v] : [it.bx + b.L - v, it.by + u];
        it.rect = (u0, v0, u1, v1) => { const [x0, y0] = it.pt(u0, v0), [x1, y1] = it.pt(u1, v1); return [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)]; };
      }

      // ---- scatola: guscio con il fondo ----
      const ri = Math.max(0.5, R - w);
      const adds = [], cuts = [];
      let scat = sub(slab(Xo, Yo, R, 0, Zw, Xo / 2, Yo / 2), slab(Xin, Yin, ri, f, Zw + 1, Xo / 2, Yo / 2));
      const inner = slab(Xin, Yin, ri, f - 0.02, Htot + 1, Xo / 2, Yo / 2);
      const postXY = [[w + pc, w + pc], [w + Xin - pc, w + pc], [w + pc, w + Yin - pc], [w + Xin - pc, w + Yin - pc]];
      for (const [x, y] of postXY) {
        adds.push(cylZ(x, y, f - 0.01, Zw - bossLen - 0.2, pr));
        if (pad) adds.push(X(cylZ(x, y, f - 0.01, zP, rP), inner), X(cylZ(x, y, zP - 0.01, zP + rP - pr, rP, pr), inner));
      }

      // ---- alloggi: pareti piene fino alla faccia di sopra del circuito, dentro un gradino su cui poggia il circuito ----
      // il gradino gira lungo il bordo, sotto è vuoto (saldature e componenti); si interrompe sotto le file di piedini e, se la scheda è capovolta, sotto la USB
      const st = p.gradinoL;
      for (const it of items) {
        const b = it.b, zTop = it.zt, ax0 = it.bx - g, ay0 = it.by - g, ax1 = it.bx + b.L + g, ay1 = it.by + b.W + g;
        adds.push(sub(box(it.x0, it.y0, f - 0.01, it.x1, it.y1, zTop), box(ax0, ay0, f - 0.02, ax1, ay1, zTop + 1)));
        const holes = [box(it.bx + st, it.by + st, f - 0.02, it.bx + b.L - st, it.by + b.W - st, it.zp + 1)];
        for (const q of b.pines || []) { const r = pinZone(b, it.bx, it.by, q, DUP.passo, g + 1); holes.push(box(r[0], r[1], f - 0.02, r[2], r[3], it.zp + 1)); }
        if (it.capo && it.cpu && b.usb) { const hw = CONN[b.usb.tipo].w / 2 + 1, yc = it.by + b.usb.y; holes.push(box(ax0 - 1, yc - hw, f - 0.02, it.bx + st + 1, yc + hw, it.zp + 1)); }
        adds.push(sub(box(ax0, ay0, f - 0.01, ax1, ay1, it.zp), U(holes)));
      }

      // ---- moduli sotto il coperchio: mensola sulla parete e due gambe dal fondo ----
      // mensola: il piano a filo sotto il circuito, largo quanto il gradino; sotto scende verso la parete a 55° (senza supporti)
      // gambe: pilastrini sotto il circuito vicino agli angoli lontani dalla parete, con un dentino fuori dal circuito che lo tiene fermo di lato.
      // Dove sotto ci sono i piedini (con i dupont) la mensola si interrompe e le gambe scorrono lungo il bordo fino al primo punto libero
      const pd = 2, altiM = [];
      for (const it of alti) {
        const { A, P } = it, zp = it.zp, free = (r) => !it.zone.some(z => ov(r, z));
        const pts = [];
        for (const u of [0, A]) for (const [v, z] of [[-g - 0.02, zp], [st, zp], [st, zp - 0.8], [-g - 0.02, zp - 0.8 - (g + st) * t55]]) { const [x, y] = it.pt(u, v); pts.push([x, y, z]); }
        let shelf = hullPts(pts);
        if (it.zone.length) shelf = sub(shelf, U(it.zone.map(r => box(r[0], r[1], f - 1, r[2], r[3], Zw))));
        if ((it.b.pines || []).some(q => q.lato === { davanti: 'S', dietro: 'N', destra: 'E' }[it.parete])) notes.push(`${it.b.nome.split(' (')[0]}: i piedini sono sul bordo contro la parete, lì la mensola e il bordino del coperchio sono interrotti. Ruotalo di 180° perché lo tengano meglio`);
        it.pads = [];
        for (const k of [0, 1]) {
          const cand = [[k ? A - pd : 0, P - pd]];
          for (let v = P - pd - 1; v >= P / 2; v -= 1) cand.push([k ? A - pd : 0, v]);
          for (let u = 1; u <= A / 2 - pd; u += 1) cand.push([k ? A - pd - u : u, P - pd]);
          const c = cand.find(([u, v]) => free(it.rect(u, v, u + pd, v + pd)));
          if (c) it.pads.push(c);
        }
        if (it.pads.length < 2) notes.push(`${it.b.nome.split(' (')[0]}: non c'è posto per una gamba lontano dai piedini. Prova a ruotarlo`);
        const legs = it.pads.map(([u0, v0]) => {
          const e = g + legW, r = it.rect(u0 === 0 ? -e : u0, v0, u0 + pd >= A - 1e-6 ? A + e : u0 + pd, v0 + pd >= P - 1e-6 ? P + e : v0 + pd);
          const pcbR = it.rect(-g, -g, A + g, P + g);
          return sub(box(r[0], r[1], f - 0.01, r[2], r[3], it.zt - 0.2), box(pcbR[0], pcbR[1], zp, pcbR[2], pcbR[3], Zw));
        });
        it.solid = U([shelf, ...legs]);
        adds.push(it.solid); altiM.push(it.solid);
        // sotto il circuito scendono piedini e dupont, più la curva dei fili
        const low = zp - (DUP.plastica + DUP.corpo + 3);
        if (low < f) notes.push(`${it.b.nome.split(' (')[0]}: sotto il circuito i dupont (${fmt(DUP.plastica + DUP.corpo)} mm più la curva dei fili) arrivano a ${fmt(low - f)} mm dal fondo. Alza l'altezza di almeno ${fmt(f - low)} mm`);
      }
      for (let i = 0; i < alti.length; i++) for (let j = i + 1; j < alti.length; j++) {
        const r = (it) => [it.bx - g - legW, it.by - g - legW, it.bx + it.b.L + g + legW, it.by + it.b.W + g + legW];
        if (ov(r(alti[i]), r(alti[j]))) notes.push(`${alti[i].b.nome.split(' (')[0]} e ${alti[j].b.nome.split(' (')[0]}: sotto il coperchio si sovrappongono. Spostali lungo la parete`);
      }

      // ---- LED nelle pareti: foro passante e, dentro, una culla a U dal fondo che regge LED, saldature e dupont ----
      // la culla ha il fondo piatto (niente sbalzi) all'altezza del collarino; il LED entra da dentro e la punta resta a filo della parete:
      // contro la parete c'è un manicotto lungo quanto la testa meno la parete, il collarino ci si appoggia dietro
      const ledGhost = [];
      const leds = [];
      const muro = {   // per ogni parete: centro della faccia interna, rotazione attorno a z (dentro = +y ruotato), lunghezza interna
        davanti: { o: [w + Xin / 2, w], rot: 0, len: Xin }, dietro: { o: [w + Xin / 2, w + Yin], rot: 180, len: Xin },
        sinistra: { o: [w, w + Yin / 2], rot: -90, len: Yin }, destra: { o: [w + Xin, w + Yin / 2], rot: 90, len: Yin } };
      for (let i = 1; i <= 4; i++) {
        const M = muro[p['led' + i]]; if (!M) continue;
        const L = LED[p['led' + i + 'D']] || LED[5], wc = Math.max(L.fl, 2 * DUP.passo) + 0.6, wo = wc + 2 * 1.2, dz = Math.max(L.fl / 2 + 0.15, DUP.passo / 2 + 0.2);
        const zMin = f + dz, zMax = Zw - rimH - Math.max(L.fl / 2 + 0.3, L.d / 2 + 1.4), aMax = Math.max(0, M.len / 2 - wo / 2);
        const zc = Math.min(zMax, Math.max(zMin, f + (+p['led' + i + 'Z'] || 0))), a = Math.min(aMax, Math.max(-aMax, +p['led' + i + 'Pos'] || 0));
        if (Math.abs(zc - f - (+p['led' + i + 'Z'] || 0)) > 0.01 || Math.abs(a - (+p['led' + i + 'Pos'] || 0)) > 0.01) notes.push(`LED ${i}: spostato a ${fmt(a)} mm dal centro della parete e ${fmt(zc - f)} mm dal fondo: è il punto più vicino a quello scelto in cui ci sta`);
        // nel sistema della parete davanti: x lungo la parete (verso destra guardandola da fuori), y verso l'interno, z assoluta
        const place = (q) => reg(reg(q.rotate([0, 0, M.rot])).translate([M.o[0], M.o[1], 0]));
        const cyl = (r, y0, y1) => reg(reg(reg(Manifold.cylinder(y1 - y0, r, r, 40)).rotate([-90, 0, 0])).translate([a, y0, zc]));
        const sl = Math.max(0, L.h - L.flH - w);   // manicotto: dalla parete al collarino
        const cradle = U([sub(box(a - wo / 2, -0.01, f - 0.01, a + wo / 2, lenL, zc), box(a - wc / 2, sl, zc - dz, a + wc / 2, lenL + 1, zc + 1)),
          sl > 0 ? box(a - wo / 2, -0.01, f - 0.01, a + wo / 2, sl, zc + L.d / 2 + 1.2) : null]);
        const hole = cyl(L.d / 2 + 0.15, -w - 1, sl + 0.5);
        const gl = U([cyl(L.d / 2, sl - (L.h - L.flH), sl), cyl(L.fl / 2, sl, sl + L.flH),
          box(a - 1.5, sl + L.flH, zc - 0.25, a + 1.5, lenL - DUP.corpo, zc + 0.25),
          box(a - DUP.passo, lenL - DUP.corpo, zc - DUP.passo / 2, a + DUP.passo, lenL, zc + DUP.passo / 2)]);
        leds.push({ i, cradle: place(cradle), hole: place(hole), zc, a, L, lato: p['led' + i] });
        ledGhost.push(place(gl));
      }
      for (const l of leds) adds.push(l.cradle);
      // la culla non deve finire negli alloggi, sulle colonnine, sulla USB o su un'altra culla
      for (const l of leds) {
        const hit = (m) => m && reg(l.cradle.intersect(m)).volume() > 0.01;
        if (items.some(it => hit(box(it.x0, it.y0, f, it.x1, it.y1, Zw)))) notes.push(l.lato === 'sinistra' ? `LED ${l.i}: la culla entra in un alloggio. Sulla parete sinistra c'è il processore con la USB: il LED ci sta solo davanti o dietro al suo alloggio, aumenta lo spazio attorno agli alloggi o spostalo` : `LED ${l.i}: la culla entra in un alloggio. Spostalo lungo la parete`);
        if (postXY.some(([x, y]) => hit(cylZ(x, y, f, Zw, pr + 0.3)))) notes.push(`LED ${l.i}: la culla tocca una colonnina delle viti. Spostalo verso il centro della parete`);
        if (leds.some(o => o !== l && hit(o.cradle))) notes.push(`LED ${l.i}: la culla tocca quella di un altro LED`);
        if (altiM.some(hit) || alti.some(it => hit(box(it.bx - g, it.by - g, it.zp - (DUP.plastica + DUP.corpo + 3), it.bx + it.b.L + g, it.by + it.b.W + g, it.zt)))) notes.push(`LED ${l.i}: la culla tocca un modulo sotto il coperchio (mensola, gambe o i dupont sotto). Spostalo lungo la parete o abbassalo`);
        info.push([`LED ${l.i}`, `${l.L.d} mm sulla parete ${l.lato}, centro a ${fmt(l.a)} mm dal centro della parete (verso destra guardandola da fuori) e a ${fmt(l.zc - f)} mm dal fondo; foro da ${fmt(l.L.d + 0.3)} mm, culla lunga ${fmt(lenL)} mm. Il LED si infila da dentro fino al collarino e la punta resta a filo della parete`]);
      }
      scat = U([scat, ...adds]);

      // ---- USB del processore: apertura nella parete sinistra e incavo per la spina da fuori ----
      const it0 = items[0];
      if (it0.b.usb) {
        const c = CONN[it0.b.usb.tipo], yc = it0.by + it0.b.usb.y, cl = 0.6, hz = (c.z1 - c.z0) / 2;
        cuts.push(box(-1, yc - c.w / 2 - cl, it0.usbZ - hz - cl, w + g + 0.5, yc + c.w / 2 + cl, it0.usbZ + hz + cl));
        if (w > 1.4) cuts.push(box(-1, yc - c.spina[0] / 2 - 0.4, Math.max(0, it0.usbZ - c.spina[1] / 2 - 0.4), w - 0.8, yc + c.spina[0] / 2 + 0.4, it0.usbZ + c.spina[1] / 2 + 0.4));
        info.push(['USB', `${c.nome}: centro a ${fmt(it0.usbZ)} mm dal piano del tavolo, a ${fmt(yc)} mm dal davanti`]);
      }
      for (const [x, y] of postXY) cuts.push(cylZ(x, y, -1, Zw + 0.1, rh, rh, 32), cylZ(x, y, -0.01, hcs, r0, rh, 40));
      for (const l of leds) cuts.push(l.hole);
      const it0u = items[0];
      if (it0u.b.usb) for (const l of leds) if (l.lato === 'sinistra' && reg(l.hole.intersect(box(-1, it0u.by + it0u.b.usb.y - 8, it0u.usbZ - 6, w + 1, it0u.by + it0u.b.usb.y + 8, it0u.usbZ + 6))).volume() > 0.01) notes.push(`LED ${l.i}: il foro è troppo vicino alla presa USB`);
      scat = sub(scat, U(cuts));

      // ---- coperchio: piastra con un bordino che entra nella scatola ----
      const cc = 0.25, rimW = 1.2;
      let lid = U([slab(Xo, Yo, R, Zw, Htot, Xo / 2, Yo / 2),
        sub(slab(Xin - 2 * cc, Yin - 2 * cc, Math.max(0.3, ri - cc), Zw - rimH, Zw + 0.01, Xo / 2, Yo / 2),
          slab(Xin - 2 * cc - 2 * rimW, Yin - 2 * cc - 2 * rimW, Math.max(0.3, ri - cc - rimW), Zw - rimH - 1, Zw, Xo / 2, Yo / 2)),
        ...postXY.map(([x, y]) => X(cylZ(x, y, Zw - bossLen, Zw + 0.02, pr), inner))]);
      // moduli sotto il coperchio: pioli sopra le gambe (e sul bordo della parete se il bordino non ci arriva) che premono il circuito,
      // finestra sopra il display o il sensore, bordino e pioli tolti sopra le saldature dei piedini
      const pegs = [], pegR = [], holesL = [];
      for (const it of alti) {
        // la finestra per l'aria serve solo se non ci sono le fessure: con le fessure l'aria passa già da lì
        const fi = it.b.finestra && it.b.finestra.tipo === 'aria' && p['mod' + it.slot + 'Aria'] === 'si' ? null : it.b.finestra, bx = it.bx, by = it.by, c = 0.3;
        const win = !fi ? null : fi.cx === undefined ? [bx + fi.x0 - c, by + fi.y0 - c, bx + fi.x1 + c, by + fi.y1 + c]
          : fi.w !== undefined ? [bx + fi.cx - fi.w / 2 - c, by + fi.cy - fi.h / 2 - c, bx + fi.cx + fi.w / 2 + c, by + fi.cy + fi.h / 2 + c] : null;
        if (win) holesL.push(box(win[0], win[1], it.zt, win[2], win[3], Htot + 1));
        else if (fi && fi.d) holesL.push(cylZ(bx + fi.cx, by + fi.cy, it.zt, Htot + 1, fi.d / 2 + c));
        it.winR = win || (fi && fi.d ? [bx + fi.cx - fi.d / 2 - c, by + fi.cy - fi.d / 2 - c, bx + fi.cx + fi.d / 2 + c, by + fi.cy + fi.d / 2 + c] : null);
        const spots = it.pads.map(([u, v]) => it.rect(u + 0.2, v + 0.2, u + pd - 0.2, v + pd - 0.2));
        if (it.zt < Zw - rimH - 0.05) spots.push(it.rect(0.2, 0.2, 1.8, 1.8), it.rect(it.A - 1.8, 0.2, it.A - 0.2, 1.8));
        for (const r of spots) if (!it.zone.some(z => ov(r, z)) && !(win && ov(r, win))) { pegs.push(box(r[0], r[1], it.zt, r[2], r[3], Zw + 0.01)); pegR.push(r); }
        for (const z of it.zone) holesL.push(box(z[0], z[1], it.zt - 1, z[2], z[3], Math.min(it.zt + 1.5, Zw - 0.01)));
        it.fin = !!fi;
      }
      // prese d'aria nel coperchio sopra le schede che le vogliono: fessure da 2 mm lungo il lato lungo, lontano dalle boccole e dai pioli.
      // Se c'è la finestra non la attraversano: stanno nella striscia accanto che ne fa passare di più, con 1,5 mm di coperchio in mezzo
      const sw = 2, sg = 2, ribW = 1.5;
      const fessure = ([x0, y0, x1, y1]) => {
        if (Math.max(x1 - x0, y1 - y0) < 4 || Math.min(x1 - x0, y1 - y0) < sw) return [];
        const along = x1 - x0 >= y1 - y0, span = along ? y1 - y0 : x1 - x0, n = Math.max(1, Math.floor((span + sg) / (sw + sg))), st = (span - (n * sw + (n - 1) * sg)) / 2;
        return Array.from({ length: n }, (_, k) => { const a = (along ? y0 : x0) + st + k * (sw + sg); return along ? [x0, a, x1, a + sw] : [a, y0, a + sw, y1]; });
      };
      const vents = [], ventR = [];
      for (const it of [...items, ...alti]) {
        if ((it.cpu ? p.cpuAria : p['mod' + it.slot + 'Aria']) !== 'si') continue;
        const b = it.b, x0 = it.bx + 2, x1 = it.bx + b.L - 2, y0 = it.by + 2, y1 = it.by + b.W - 2, W = it.winR;
        const zone = !W ? [[x0, y0, x1, y1]] : [[x0, y0, x1, W[1] - ribW], [x0, W[3] + ribW, x1, y1], [x0, y0, W[0] - ribW, y1], [W[2] + ribW, y0, x1, y1]];
        const area = (l) => l.reduce((s, r) => s + (r[2] - r[0]) * (r[3] - r[1]), 0);
        const slots = zone.map(fessure).reduce((best, l) => area(l) > area(best) ? l : best, []);
        if (!slots.length) { if (W) notes.push(`${b.nome.split(' (')[0]}: la finestra occupa quasi tutto il modulo, nel coperchio sopra non c'è posto per le fessure d'aria`); continue; }
        for (const r of slots) { vents.push(box(r[0], r[1], Zw - 1, r[2], r[3], Htot + 1)); ventR.push(r); }
        it.aria = slots.length;
      }
      if (vents.length) lid = sub(lid, sub(U(vents), U([...postXY.map(([x, y]) => cylZ(x, y, Zw - bossLen - 1, Htot + 2, pr + 1)), ...pegR.filter(r => ventR.some(q => ov(r, q))).map(r => box(r[0] - 1, r[1] - 1, Zw - 2, r[2] + 1, r[3] + 1, Htot + 2))])));
      if (pegs.length) lid = U([lid, ...pegs]);
      if (holesL.length) lid = sub(lid, U(holesL));
      // boccole: foro filettato aperto sotto, chiuso 0,8 mm sotto la faccia di sopra
      lid = sub(lid, U(postXY.map(([x, y]) => reg(VT.hole(p.viteM || 'M6', bossLen + tl - 0.8, vg, true).translate([x, y, Zw - bossLen])))));
      // viti: testa svasata a filo sotto il fondo, punta nella boccola
      const Ls = Math.floor((Htot - 1.3) * 2) / 2, sc = VT.screw(p.viteM || 'M6', Ls, vg, 'taglio');
      info.push(['Viti', `4 viti ${vm.name || p.viteM} stampate, testa svasata con taglio, lunghe ${fmt(sc.L)} mm: entrano da sotto il fondo e si avvitano nelle boccole sotto il coperchio. Stampale in piedi con la testa sul piatto, strati sottili, 4 perimetri, meglio PETG. Gioco del filetto ${fmt(vg)} mm${pad ? `. Sotto le colonnine c'è un rialzo da ${fmt(zP - f)} mm perché il fondo è più sottile della svasatura` : ''}`]);

      // ---- esempio: circuiti, componenti e piedini (in su) ----
      const ghost = [];
      const pinH = DUP.plastica + DUP.perno;
      for (const it of items) {
        const b = it.b, bx = it.bx, by = it.by;
        ghost.push(box(bx, by, it.zp, bx + b.L, by + b.W, it.zt));
        ghost.push(it.capo ? box(bx + 2, by + 2, it.zp - b.hTop, bx + b.L - 2, by + b.W - 2, it.zp) : box(bx + 2, by + 2, it.zt, bx + b.L - 2, by + b.W - 2, it.zt + b.hTop));
        for (const q of b.pines || []) {
          const len = q.n * DUP.passo, s = DUP.passo / 2;
          const r = q.lato === 'S' ? [bx + b.L / 2 - len / 2, by + q.off - s, bx + b.L / 2 + len / 2, by + q.off + s]
            : q.lato === 'N' ? [bx + b.L / 2 - len / 2, by + b.W - q.off - s, bx + b.L / 2 + len / 2, by + b.W - q.off + s]
              : q.lato === 'W' ? [bx + q.off - s, by + b.W / 2 - len / 2, bx + q.off + s, by + b.W / 2 + len / 2]
                : [bx + b.L - q.off - s, by + b.W / 2 - len / 2, bx + b.L - q.off + s, by + b.W / 2 + len / 2];
          ghost.push(box(r[0], r[1], it.zt, r[2], r[3], it.zt + pinH));
        }
        // sopra i piedini ci vanno i dupont: header + connettore 16,5 mm, più la curva dei fili
        const need = it.zt + DUP.plastica + DUP.corpo + 3;
        if ((b.pines || []).length && need > Zw) notes.push(`${b.nome.split(' (')[0]}: sopra i piedini i dupont (${fmt(DUP.plastica + DUP.corpo)} mm più la curva dei fili) arrivano a ${fmt(need - f)} mm dal fondo, oltre l'altezza interna di ${fmt(Hin)} mm. Alza l'altezza`);
      }
      for (const it of alti) {
        const b = it.b, bx = it.bx, by = it.by;
        ghost.push(box(bx, by, it.zp, bx + b.L, by + b.W, it.zt), box(bx + 2, by + 2, it.zt, bx + b.L - 2, by + b.W - 2, it.zt + b.hTop));
        for (const q of b.pines || []) {
          const len = q.n * DUP.passo, s = DUP.passo / 2;
          const r = q.lato === 'S' ? [bx + b.L / 2 - len / 2, by + q.off - s, bx + b.L / 2 + len / 2, by + q.off + s]
            : q.lato === 'N' ? [bx + b.L / 2 - len / 2, by + b.W - q.off - s, bx + b.L / 2 + len / 2, by + b.W - q.off + s]
              : q.lato === 'W' ? [bx + q.off - s, by + b.W / 2 - len / 2, bx + q.off + s, by + b.W / 2 + len / 2]
                : [bx + b.L - q.off - s, by + b.W / 2 - len / 2, bx + b.L - q.off + s, by + b.W / 2 + len / 2];
          ghost.push(box(r[0], r[1], it.zp - pinH, r[2], r[3], it.zp));
        }
      }
      const ghostM = U([...ghost, ...ledGhost]);

      const center = (q) => reg(q.translate([-Xo / 2, -Yo / 2, 0]));
      // viti come si stampano, con la testa sul piano
      const scP = sc.print, zS = scP.boundingBox().min[2];
      const screws = U([0, 1, 2, 3].map(k => reg(scP.translate([(k - 1.5) * (2 * vm.D + 3), 0, -zS]))));
      const parts = [
        { name: 'Scatola', m: center(scat), role: 'body' },
        { name: 'Coperchio', m: center(lid), role: 'inner', print: reg(center(lid).rotate([180, 0, 0])), at: p.__closed ? undefined : [0, Yo + 12, -(Zw - Math.max(rimH, bossLen))] },   // aperto: il coperchio poggia sul piano con le boccole
        { name: 'esempio', m: center(ghostM), role: 'ghost' },
        { name: `Viti ${p.viteM || 'M6'}×${fmt(sc.L)} (4 pezzi)`, m: screws, role: 'pin', at: p.__closed ? undefined : [Xo / 2 + 1.5 * (2 * vm.D + 3) + vm.D + 8, 0, 0] },
      ];
      info.unshift(['Esterno', `${fmt(Xo)} × ${fmt(Yo)} × ${fmt(Htot)} mm`], ['Interno', `${fmt(Xin)} × ${fmt(Yin)} × ${fmt(Hin)} mm`]);
      for (const it of items) info.push([it.cpu ? 'Processore' : `Modulo ${it.slot}`, `${it.b.nome}, ${fmt(it.b.L)} × ${fmt(it.b.W)} mm${it.rot ? ` (ruotato di ${it.rot}°)` : ''}${it.aria ? `, ${it.aria} ${it.aria === 1 ? 'fessura' : 'fessure'} d'aria nel coperchio sopra` : ''}: ${it.capo ? 'capovolto (componenti verso il fondo)' : 'componenti in su'}, il circuito poggia su un gradino a ${fmt(it.zp - f)} mm dal fondo, piedini in su`]);
      for (const it of alti) info.push([`Modulo ${it.slot}`, `${it.b.nome}, ${fmt(it.b.L)} × ${fmt(it.b.W)} mm${it.rot ? ` (ruotato di ${it.rot}°)` : ''}${it.aria ? `, ${it.aria} ${it.aria === 1 ? 'fessura' : 'fessure'} d'aria nel coperchio sopra` : ''}: sotto il coperchio contro la parete ${it.parete}, centro a ${fmt(it.a)} mm dal centro della parete. Componenti in su${it.fin ? ' con la finestra nel coperchio sopra' : ''}, piedini in giù; il circuito poggia a ${fmt(it.zp - f)} mm dal fondo su una mensola della parete e su ${it.pads.length} gambe, e lo blocca il coperchio${it.zt < Zw - rimH - 0.05 ? ' con i suoi pioli' : ' con il bordino e i pioli'}`]);
      for (const x of notes) info.push(['Nota', x]);
      const res = { parts, info, view: [0.55, -0.95, 0.8] };
      if (p.__check) { const v = (a, c) => +reg(a.intersect(c)).volume().toFixed(3); res.closed = [['scatola-coperchio', v(scat, lid)], ['scatola-esempio', v(scat, ghostM)], ['coperchio-esempio', v(lid, ghostM)],
        ['alloggi-colonnine', v(U(items.map(it => box(it.x0, it.y0, f, it.x1, it.y1, f + 1))), U(postXY.map(([x, y]) => cylZ(x, y, f, f + 1, rz - 0.5))))],
        ['alti-alloggi', alti.length ? v(U(alti.map(it => box(it.bx - g, it.by - g, f, it.bx + it.b.L + g, it.by + it.b.W + g, Zw))), U(items.map(it => box(it.x0, it.y0, f, it.x1, it.y1, Zw)))) : 0]]; }
      return res;
    }

    return { schede };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

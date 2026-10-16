// Powerbank fai-da-te: scatola con vani per celle 18650 (contatti a molla, come le pile) e scheda di ricarica.
// Si aggancia al motore tramite SPRECOLO_EXT.
// Coordinate: x lungo la scatola, y in profondità (fronte con le porte verso -y), z in alto. mm.
// Nel catalogo ci sono solo misure pubblicate: disegni quotati dei venditori, standard USB, schede tecniche.
(function (root) {
  // celle: misure massime dalle schede tecniche
  const CELLE = {
    normale: { nome: '18650', D: 18.55, L: 65.25, mAh: 3000, fonte: 'misure massime Samsung INR18650-35E' },
    protetta: { nome: '18650 protetta', D: 19.0, L: 70.0, mAh: 3000, fonte: 'circuito di protezione sotto la guaina: fino a circa 19 × 70 mm' },
  };
  // piastrine a molla per 18650 in commercio: 16 × 16,5 mm (anche 16 × 18,5 con i piedini), spessore 0,3 mm
  const PIASTRA = { w: 16, h: 16.5, hMax: 18.5, t: 0.3 };
  // connettori: corpo (larghezza, quote z dalla faccia del circuito) dalle misure standard; spina: ingombro della parte in plastica
  const CONN = {
    usba: { nome: 'USB-A', w: 13.1, z0: 0, z1: 7.0, spina: [16.5, 8.5] },
    usbc: { nome: 'USB-C', w: 8.94, z0: -0.6, z1: 3.26, spina: [12.5, 7.0] },
    micro: { nome: 'micro-USB', w: 7.5, z0: -0.3, z1: 2.7, spina: [11.5, 8.0] },
    lightning: { nome: 'Lightning', w: 9.7, z0: -1.0, z1: 3.0, spina: [11.0, 7.0] },
    led5: { nome: 'LED', w: 5, z0: 0, z1: 5, spina: [5.6, 5.6] },   // LED da 5 mm della torcia: foro tondo
  };
  // schede. Riferimento: x lungo il bordo anteriore (porte) da sinistra, y dal bordo anteriore verso il retro, z dalla faccia superiore.
  // porte: [x, tipo, nome, larghezza misurata se diversa dallo standard]; fianchi: porte sui lati corti [lato, tipo, y, nome]
  // sotto: connettori sulla faccia di sotto (la scheda si monta col display in su); appoggi: 'bordi' o 'porte' (sotto i corpi delle USB-A)
  // dove: dove si compra
  // pulsante: lato 'fronte' (x) o 'sx'/'dx' (y); display: finestra aperta; led: finestra sottile; prec: gioco in più se le posizioni sono incerte
  const SCHEDE = {
    lcd24: {
      nome: '18650 LCD 2.4A, 2 USB', uscita: '5 V 2,4 A (12 W) su due USB-A',
      fonte: 'misure del venditore 6,5 × 2,5 × 1 cm; porte in scala dalla foto dall\'alto (±0,5 mm)',
      dove: 'AliExpress e Amazon (cerca "18650 dual USB 2.4A LCD")',
      L: 65, P: 23.5, pcb: 1.2, sopra: 8.8, sporge: 1.0, prec: 0,
      porte: [[12.1, 'usba', 'USB-A uscita'], [28.4, 'usba', 'USB-A uscita'], [42.4, 'usbc', 'USB-C ingresso'], [54.3, 'micro', 'micro-USB ingresso']],
      fianchi: [['dx', 'lightning', 15.9, 'Lightning ingresso']],
      pulsante: { lato: 'sx', y: 16.0, z: 1.75, sporge: 0.8 },
      display: [18.6, 9.5, 45.0, 23.0],
    },
    sw6106: {
      nome: 'SW6106 18 W PD/QC', uscita: 'fino a 18 W (PD/QC) su USB-A e USB-C',
      fonte: 'disegno quotato del venditore 71,5 × 17,9 mm; porte in scala dalla foto dall\'alto (±0,5 mm)',
      dove: 'AliExpress (su Amazon non si trova)',
      L: 71.5, P: 17.9, pcb: 1.2, sopra: 7.5, sporge: 1.0, prec: 0,
      porte: [[43.7, 'usbc', 'USB-C ingresso/uscita'], [60.0, 'usba', 'USB-A uscita']],
      fianchi: [],
      pulsante: { lato: 'fronte', x: 7.8, z: 1.75, sporge: 0.3 },
      led: [21.4, 1.3, 34.6, 3.8],
    },
    sw6208: {
      nome: 'SW6208 22,5 W PD/QC', uscita: 'fino a 22,5 W (PD/QC) su due USB-A e USB-C',
      fonte: 'disegno quotato del venditore 71,8 × 27 mm; porte in scala dalla foto dall\'alto (±0,5 mm)',
      dove: 'AliExpress (su Amazon non si trova)',
      L: 71.8, P: 27, pcb: 1.2, sopra: 7.5, sporge: 1.9, prec: 0,
      porte: [[9.4, 'micro', 'micro-USB ingresso', 9.9], [24.4, 'usbc', 'USB-C ingresso/uscita'], [42.4, 'usba', 'USB-A uscita'], [62.6, 'usba', 'USB-A uscita']],
      fianchi: [],
      pulsante: { lato: 'sx', y: 17.5, z: 1.75, sporge: 0.85 },
    },
    ip5328p: {
      nome: 'IP5328P 18 W QC', uscita: 'fino a 18 W (QC) su due USB-A e USB-C',
      fonte: 'misure del venditore 64,6 × 32,3 mm (65 × 32,5 su Amazon); porte in scala dalla foto dall\'alto (±0,5 mm)',
      dove: 'Amazon (Hailege, QUARKZMAN e altri) e AliExpress',
      L: 64.6, P: 32.3, pcb: 1.2, sopra: 7.5, sporge: 1.0, prec: 0,
      porte: [[15.4, 'usba', 'USB-A uscita'], [32.7, 'usbc', 'USB-C ingresso/uscita'], [50.6, 'usba', 'USB-A uscita']],
      fianchi: [['dx', 'micro', 21.2, 'micro-USB ingresso']],
      led: [2.0, 10.0, 4.6, 22.2],
    },
    dusb21: {
      nome: 'Doppia USB 1 A + 2,1 A con LCD e torcia', uscita: '5 V su due USB-A: 2,1 A e 1 A',
      fonte: 'misure del venditore 58 × 27 × 15 mm (Amazon); porte e display in scala dalle foto dall\'alto (±0,5 mm)',
      dove: 'Amazon (cerca "Doppio USB 5V 1A 2.1A 18650 LCD") e AliExpress',
      L: 58, P: 27, pcb: 1.2, sopra: 6.8, sotto: 7.6, sporge: 0.9, prec: 0, appoggi: 'porte', ledSporge: 7.5,   // LED misurato in scala sulla foto
      // porte e torcia sono sulla faccia di sotto: la scheda si monta con l'LCD in su
      porte: [[11.4, 'usba', 'USB-A uscita 2,1 A', 0, true], [24.2, 'micro', 'micro-USB ingresso', 0, true], [36.9, 'usba', 'USB-A uscita 1 A', 0, true]],
      fianchi: [['sx', 'led5', 6.0, 'LED della torcia', true]],
      pulsante: { lato: 'dx', y: 6.0, z: -2.95, sporge: 0.5 },
      display: [9.8, 10.7, 39.1, 25.8],
    },
  };

  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function powerbank(H) {
    const { Manifold, CrossSection, reg, union, sub, box, rr, hullPts, slab, fmt } = H;
    const U = (list) => { list = list.filter(Boolean); return !list.length ? null : list.length === 1 ? list[0] : union(list); };
    const X = (a, b) => reg(a.intersect(b));
    const hull = (list) => reg(Manifold.hull(list.filter(Boolean)));
    const cylX = (x0, x1, y, z, r, seg = 40) => reg(reg(reg(Manifold.cylinder(x1 - x0, r, r, seg)).rotate([0, 90, 0])).translate([x0, y, z]));
    const cylZ = (x, y, z0, z1, r0, r1, seg = 40) => reg(reg(Manifold.cylinder(z1 - z0, r0, r1 === undefined ? r0 : r1, seg)).translate([x, y, z0]));
    const EXTX = (pts, x0, x1) => reg(reg(reg(reg(CrossSection.ofPolygons([pts])).extrude(x1 - x0)).rotate([90, 0, 90])).translate([x0, 0, 0]));
    // prisma a sezione rettangolare arrotondata: (u0,v0)-(u1,v1) nel piano perpendicolare all'asse, da t0 a t1 lungo l'asse
    function prism(axis, u0, v0, u1, v1, r, t0, t1) {
      r = Math.max(0.05, Math.min(r, (u1 - u0) / 2 - 0.01, (v1 - v0) / 2 - 0.01));
      const cs = reg(reg(reg(CrossSection.ofPolygons([[[u0 + r, v0 + r], [u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r]]])).offset(r, 'Round', 2, 24)));
      const e = reg(cs.extrude(t1 - t0));
      if (axis === 'z') return reg(e.translate([0, 0, t0]));
      if (axis === 'x') return reg(reg(e.rotate([90, 0, 90])).translate([t0, 0, 0]));
      return reg(reg(e.rotate([90, 0, 0])).translate([0, t1, 0]));   // y: (u, v) = (x, z)
    }
    // apertura con smusso a 45° sulla faccia esterna: sezione base da t0 a t1, allargata di c sulla faccia "out" (t0 o t1)
    function opening(axis, u0, v0, u1, v1, r, t0, t1, c, out) {
      const base = prism(axis, u0, v0, u1, v1, r, t0, t1);
      if (!(c > 0)) return base;
      const f = out === 't0' ? t0 : t1, s = out === 't0' ? 1 : -1;
      const wide = prism(axis, u0 - c, v0 - c, u1 + c, v1 + c, r + c, Math.min(f, f - s * 0.5), Math.max(f, f - s * 0.5));
      const thin = prism(axis, u0, v0, u1, v1, r, Math.min(f + s * c, f + s * (c + 0.01)), Math.max(f + s * c, f + s * (c + 0.01)));
      return U([base, hull([wide, thin])]);
    }
    // guscio esterno: rettangolo arrotondato con i bordi sopra e sotto raccordati
    function shell(W, D, R, H0, rb, rt) {
      const pts = [], k = 6;
      const sec = (inset, z) => pts.push(...rr(W - 2 * inset, D - 2 * inset, Math.max(0.3, R - inset), z, W / 2, D / 2));
      for (let j = 0; j <= k; j++) { const a = j / k * Math.PI / 2; sec(rb * (1 - Math.sin(a)), rb * (1 - Math.cos(a))); }
      for (let j = 0; j <= k; j++) { const a = j / k * Math.PI / 2; sec(rt * (1 - Math.cos(a)), H0 - rt + rt * Math.sin(a)); }
      return hullPts(pts);
    }

    function powerbank(p) {
      const info = [], notes = [];
      const B = SCHEDE[p.scheda] || SCHEDE.lcd24, C = CELLE[p.cella] || CELLE.normale;
      const n = p.contatti === 'portapile' ? Math.max(1, Math.min(6, p.ppN | 0)) * Math.max(1, Math.min(6, p.ppCelle | 0)) : Math.max(1, Math.min(8, p.celle | 0));
      const w = p.pareti, f = p.fondo, tl = p.spCoperchio, tol = p.tolleranza;
      const g = p.gioco + (B.prec || 0);
      const viti = p.coperchio === 'viti';
      // portapile già pronto: le misure le scrive chi lo usa (lunghezza lungo le celle, larghezza, altezza); più portapile uno accanto all'altro
      const pp = p.contatti === 'portapile' ? { L: p.ppL, W: p.ppW, H: p.ppH } : null;
      const molle = !pp && p.contatti !== 'saldate';
      const gruppi = pp ? Array.from({ length: Math.max(1, Math.min(6, p.ppN | 0)) }, () => Math.max(1, Math.min(6, p.ppCelle | 0))) : [];
      const dv = p.vite === 'M2.5' ? 2.5 : 3;
      // ---- vani delle celle ----
      const Dc = C.D + 0.5, pitch = Dc + 1.2;
      const te = molle ? 2.6 : 0, ppW = () => (pp ? pp.W + 0.8 : 0);                         // parete di testa con la fessura della piastrina
      const Lb = pp ? pp.L + 0.8 : molle ? C.L + 5 : C.L + 4;                // tra le facce delle piastrine: molla compressa e bottone del +
      // angoli: l'interno è arrotondato con raggio ri = R - w, così la parete è spessa w anche sulle curve
      const R = Math.min(p.raggio, w + 4.5), ri = Math.max(0.5, R - w);
      const chMin = viti ? 7.5 : pp ? 4.0 : (molle ? 3.5 : 1.0);        // canale per i fili (e per le colonnine delle viti) alle due teste
      // ---- scheda ----
      const pul = B.pulsante, lati = new Set(B.fianchi.map(q => q[0]));
      if (pul && pul.lato !== 'fronte') lati.add(pul.lato);
      const hasL = lati.has('sx'), hasR = lati.has('dx');
      // dagli angoli arrotondati dell'interno: gli spigoli davanti della scheda devono restare dentro la curva
      const yF0 = 0.2 + B.sporge, gapC = yF0 < ri ? ri - Math.sqrt(Math.max(0, ri * ri - (ri - yF0) ** 2)) + 0.3 : 0;
      // il LED della torcia sporge dal bordo (B.ledSporge): la scheda si allontana dalla parete quanto basta perché la punta arrivi a filo fuori
      const gLed = (lato) => (B.fianchi.some(q => q[0] === lato && q[1] === 'led5') ? (B.ledSporge || 7.5) - w - 0.3 : 0);
      const gapL = Math.max(pul && pul.lato === 'sx' ? 2.0 : 0.8, gapC, gLed('sx')), gapR = Math.max(pul && pul.lato === 'dx' ? 2.0 : 0.8, gapC, gLed('dx'));
      const Xin = Math.max(gapL + B.L + gapR, 2 * (chMin + te) + Lb);
      const ch = (Xin - 2 * te - Lb) / 2;
      const bxIn = !hasL && hasR ? Xin - B.L - gapR : gapL;   // la scheda va verso il lato dove ha qualcosa
      const yF = 0.2 + B.sporge, yB = yF + B.P, yC = yB + 0.8;
      const Yin = pp ? yC + gruppi.reduce((a, k) => a + ppW(k), 0) + (gruppi.length - 1) * 1.2 + 0.4 : yC + n * Dc + (n - 1) * 1.2 + 0.4;
      const Hin = Math.max(pp ? pp.H + 0.8 : Dc + 1.0, molle ? PIASTRA.hMax + 1.2 : 0, Math.max(2.5, (B.sotto || 0) + 1) + B.pcb + B.sopra + 0.5);
      const zr = (c, under) => (under ? [-B.pcb - c.z1, -B.pcb - c.z0] : [c.z0, c.z1]);   // quote dalla faccia superiore
      const rz = Hin - B.pcb - B.sopra - 0.5;
      const Xo = Xin + 2 * w, Yo = Yin + 2 * w, Zw = f + Hin, Htot = Zw + tl;
      const ox = w, oy = w, zT = f + rz + B.pcb, bX = ox + bxIn, bY = oy + yF;
      const rf = viti ? Math.min(1.6, tl * 0.8) : 0.6;   // a slitta la parete sopra la guida è sottile: raccordo piccolo   // a slitta la parete sopra la guida è sottile: raccordo piccolo
      const xb0 = ox + ch + te, xb1 = xb0 + Lb;             // facce delle piastrine (interno del vano)
      const cyOf = (i) => oy + yC + Dc / 2 + i * pitch, czc = f + Dc / 2;

      const S = shell(Xo, Yo, R, Htot, Math.min(1.2, f * 0.75), rf);
      const cuts = [slab(Xin, Yin, ri, f, Htot + 1, ox + Xin / 2, oy + Yin / 2)];
      const adds = [];

      // ---- fronte: porte con smusso e incavo per la spina ----
      for (const [x, t, , wm, under] of B.porte) {
        const c = CONN[t], cx = bX + x, hw = (wm || c.w) / 2 + g, [cz0, cz1] = zr(c, under);
        const z0 = zT + cz0 - g, z1 = zT + cz1 + g, zc = (z0 + z1) / 2;
        cuts.push(opening('y', cx - hw, z0, cx + hw, z1, 0.8, -1, w + 1, 0.6, 't0'));
        // la parete davanti alla spina resta 1 mm: la spina entra fino in fondo
        const sw = Math.max(c.spina[0], 2 * hw) / 2 + 0.4, sh = Math.max(c.spina[1], z1 - z0) / 2 + 0.4;
        if (w > 1.4) cuts.push(opening('y', cx - sw, Math.max(f + 0.6, zc - sh), cx + sw, Math.min(Zw - 0.8, zc + sh), 1.6, -1, w - 1.0, 0.6, 't0'));
      }
      // ---- fianchi: porte sui lati corti (foro grande quanto la spina, che entra anche se la scheda è lontana) ----
      if (p.fianchi) for (const [lato, t, yy, , under] of B.fianchi) {
        const c = CONN[t], [cz0, cz1] = zr(c, under), cy = bY + yy, cz = zT + (cz0 + cz1) / 2, sw = c.spina[0] / 2 + g, sh = c.spina[1] / 2 + g;
        const x0 = lato === 'sx' ? -1 : Xo - w - 0.5, x1 = lato === 'sx' ? w + 0.5 : Xo + 1;
        cuts.push(opening('x', cy - sw, cz - sh, cy + sw, cz + sh, 1.8, x0, x1, 0.6, lato === 'sx' ? 't0' : 't1'));
      }
      // ---- pulsante: linguetta flessibile con dentino, o foro ----
      if (pul) {
        const cz = zT + pul.z;
        const along = pul.lato === 'fronte' ? bX + pul.x : bY + pul.y;
        const gap = pul.lato === 'fronte' ? yF : pul.lato === 'sx' ? bxIn : Xin - bxIn - B.L;
        const nl = gap - pul.sporge - 0.3;
        if (p.pulsante === 'lamella') {
          const tw = 7, s = 0.7, t = Math.min(w, 1.2);
          const z0 = Math.max(f + 1.5, cz - 6), z1 = Math.min(Zw - 1.2, cz + 3.5);
          const ring = (a0, a1) => {   // taglio a U (cerniera in basso) attraverso la parete, tra a0 e a1 nello spessore
            const outer = pul.lato === 'fronte' ? box(along - tw / 2 - s, a0, z0, along + tw / 2 + s, a1, z1 + s) : box(a0, along - tw / 2 - s, z0, a1, along + tw / 2 + s, z1 + s);
            const inner = pul.lato === 'fronte' ? box(along - tw / 2, a0 - 1, z0 - 1, along + tw / 2, a1 + 1, z1) : box(a0 - 1, along - tw / 2, z0 - 1, a1 + 1, along + tw / 2, z1);
            return sub(outer, inner);
          };
          const [a0, a1] = pul.lato === 'fronte' ? [-1, w + 0.01] : pul.lato === 'sx' ? [-1, w + 0.01] : [Xo - w - 0.01, Xo + 1];
          cuts.push(ring(a0, a1));
          // linguetta assottigliata all'esterno, con un piccolo incavo tondo per il dito
          const thin = pul.lato === 'fronte' ? box(along - tw / 2, -1, z0, along + tw / 2, w - t, z1) : pul.lato === 'sx' ? box(-1, along - tw / 2, z0, w - t, along + tw / 2, z1) : box(Xo - w + t, along - tw / 2, z0, Xo + 1, along + tw / 2, z1);
          if (w > t) cuts.push(thin);
          if (nl > 0.2) {
            if (pul.lato === 'fronte') adds.push(reg(reg(reg(Manifold.cylinder(nl + 0.01, 1.4, 1.4, 24)).rotate([-90, 0, 0])).translate([along, w - 0.01, cz])));
            else if (pul.lato === 'sx') adds.push(cylX(w - 0.01, w + nl, along, cz, 1.4, 24));
            else adds.push(cylX(Xo - w - nl, Xo - w + 0.01, along, cz, 1.4, 24));
          }
        } else {
          if (pul.lato === 'fronte') cuts.push(opening('y', along - 1.6, cz - 1.6, along + 1.6, cz + 1.6, 1.6, -1, w + 1, 0.5, 't0'));
          else cuts.push(opening('x', along - 1.6, cz - 1.6, along + 1.6, cz + 1.6, 1.6, pul.lato === 'sx' ? -1 : Xo - w - 1, pul.lato === 'sx' ? w + 1 : Xo + 1, 0.5, pul.lato === 'sx' ? 't0' : 't1'));
        }
      }

      // ---- appoggi della scheda ----
      if (B.appoggi === 'porte') {
        // sotto la scheda ci sono componenti: la scheda appoggia sui corpi metallici delle USB-A
        for (const [x, t, , , under] of B.porte) if (t === 'usba' && under) {
          const c = CONN[t], top = zT + zr(c, true)[0];
          adds.push(box(bX + x - c.w / 2 + 1, bY + 2, f - 0.01, bX + x + c.w / 2 - 1, bY + 12, top));
        }
      } else {
        adds.push(box(bX, bY + 1, f - 0.01, bX + 1.5, bY + B.P, f + rz));             // appoggi staccati di 1 mm dal fronte: lontani dalla curva dell'angolo
        adds.push(box(bX + B.L - 1.5, bY + 1, f - 0.01, bX + B.L, bY + B.P, f + rz));
        adds.push(box(bX, oy + yB - 1.5, f - 0.01, bX + B.L, oy + yB, f + rz));
      }

      // ---- vani delle celle ----
      const yv0 = oy + yC - 0.4, yv1 = oy + Yin;
      const ppBox = [];   // ingombro dei portapile [y0, y1, posti]
      if (pp) {
        // cornice bassa attorno a ogni portapile, aperta al centro delle testate per i fili
        let y = oy + yC;
        for (const k of gruppi) { ppBox.push([y, y + ppW(k), k]); y += ppW(k) + 1.2; }
        const rim = [];
        const x0 = xb0, x1 = xb1, hR = f + 5;
        rim.push(box(x0 - 1.2, yv0, f - 0.01, x0, yv1, hR), box(x1, yv0, f - 0.01, x1 + 1.2, yv1, hR));
        for (let i = 0; i < ppBox.length - 1; i++) rim.push(box(x0, ppBox[i][1], f - 0.01, x1, ppBox[i][1] + 1.2, hR));
        const gaps = ppBox.map(([a, b]) => box(x0 - 2, (a + b) / 2 - 5, f + 0.01, x1 + 2, (a + b) / 2 + 5, hR + 1));
        adds.push(sub(U(rim), U(gaps)));
      }
      if (!pp) for (let i = 0; i < n - 1; i++) {   // divisori bassi tra le celle
        const y = oy + yC + (i + 1) * Dc + i * 1.2;
        adds.push(box(xb0, y, f - 0.01, xb1, y + 1.2, f + Dc * 0.42));
      }
      if (!pp) for (const xr of [0.25, 0.75]) {     // culle
        const x = xb0 + Lb * xr - 1;
        const holes = []; for (let i = 0; i < n; i++) holes.push(cylX(x - 1, x + 3, cyOf(i), czc, Dc / 2, 64));
        adds.push(sub(box(x, yv0, f - 0.01, x + 2, yv1, f + 5), U(holes)));
      }
      const plates = [];
      if (molle) {
        for (const side of [0, 1]) {
          const xw0 = side ? xb1 : xb0 - te, xw1 = side ? xb1 + te : xb0;
          let wall = box(xw0, yv0, f - 0.01, xw1, yv1, Zw - 0.6);
          const sl = [];
          for (let i = 0; i < n; i++) {
            const cy = cyOf(i);
            // fessura per la piastrina (aperta in alto): 0,8 mm dalla faccia del vano
            const xs0 = side ? xb1 + 0.8 : xb0 - 1.6, xs1 = xs0 + 0.8;
            sl.push(box(xs0, cy - PIASTRA.w / 2 - 0.4, f + 0.6, xs1, cy + PIASTRA.w / 2 + 0.4, Zw));
            // finestra per molla e bottone, aperta in alto
            const xl0 = side ? xb1 - 0.1 : xb0 - 0.9, xl1 = xl0 + 1.0;
            sl.push(box(xl0, cy - 6, f + 2.5, xl1, cy + 6, Zw));
            // passaggio del filo verso il canale
            const xo0 = side ? xs1 - 0.1 : xw0 - 0.1, xo1 = side ? xw1 + 0.1 : xs0 + 0.1;
            sl.push(box(xo0, cy - 2.5, f + 0.6, xo1, cy + 2.5, f + 5));
            plates.push(box(xs0 + 0.25, cy - PIASTRA.w / 2, f + 0.7, xs0 + 0.25 + PIASTRA.t, cy + PIASTRA.w / 2, f + 0.7 + PIASTRA.h));
            // segni + e − incisi sul fondo (molla = −, piastrina col bottone = +)
            const mx = side ? xb1 - 6 : xb0 + 6;
            sl.push(box(mx - 2.2, cy - 0.5, f - 0.5, mx + 2.2, cy + 0.5, f + 0.1));
            if (side) sl.push(box(mx - 0.5, cy - 2.2, f - 0.5, mx + 0.5, cy + 2.2, f + 0.1));
          }
          adds.push(sub(wall, U(sl)));
        }
      }
      // ---- coperchio ----
      let box0, lid;
      const dsp = B.display, led = B.led;
      const lidCuts = [];
      if (dsp) {   // finestra del display, svasata verso l'alto
        const x0 = bX + dsp[0] - 0.4, x1 = bX + dsp[2] + 0.4, y0 = bY + dsp[1] - 0.4, y1 = bY + dsp[3] + 0.4;
        lidCuts.push(opening('z', x0, y0, x1, y1, 1, Zw - 4, Htot + 1, tl * 0.8, 't1'));
      }
      if (led) {   // sopra i LED il coperchio resta 0,4 mm: la luce passa (meglio con filamento chiaro)
        lidCuts.push(prism('z', bX + led[0] - 1, bY + led[1] - 0.8, bX + led[2] + 1, bY + led[3] + 0.8, 0.8, Zw - 4, Htot - 0.4));
      }
      const posts = [];
      if (viti) {
        const pr = dv + 0.2;
        for (const px of [ox + pr + 0.2, ox + Xin - pr - 0.2])   // colonnine attaccate alla parete, senza fessure
           for (const py of [oy + yC + 3.6, oy + Yin - 3.6]) posts.push([px, py]);
        box0 = X(S, box(-1, -1, -1, Xo + 1, Yo + 1, Zw));
        box0 = sub(box0, U(cuts));
        const pp = posts.map(([x, y]) => cylZ(x, y, f - 0.01, Zw - 6.2, pr, pr, 40));
        box0 = U([box0, ...adds, ...pp]);
        const holes = [];
        for (const [x, y] of posts) {
          holes.push(cylZ(x, y, -1, Zw, dv / 2 + 0.2, dv / 2 + 0.2, 24));
          const r0 = dv * 0.95 + 0.1, r1 = dv / 2 + 0.2;   // svasatura a 90° sotto, la testa resta a filo
          holes.push(cylZ(x, y, -0.01, r0 - r1, r0, r1, 32));
        }
        box0 = sub(box0, U(holes));
        lid = X(S, box(-1, -1, Zw + 0.01, Xo + 1, Yo + 1, Htot + 1));
        const bosses = posts.map(([x, y]) => cylZ(x, y, Zw - 6, Zw + 0.02, pr, pr, 40));
        lid = U([lid, ...bosses]);
        lidCuts.push(...posts.map(([x, y]) => cylZ(x, y, Zw - 7, Htot - 0.8, dv * 0.42, dv * 0.42, 24)));
        lid = sub(lid, U(lidCuts));
      } else {
        // a slitta: guide a coda di rondine nelle pareti davanti e dietro, entra dal fianco destro
        const d = Math.min(1.2, w - 0.8), s2 = 0.8;
        // la guida segue il contorno dell'interno allargato di d (anche sugli angoli e nella parete sinistra),
        // e a destra prosegue dritta fuori dalla scatola: la parete resta spessa w - d dappertutto
        const groove = (e) => {
          const x0 = ox - d + e, x1 = Xo + 60, y0 = oy - d + e, y1 = oy + Yin + d - e;
          const a = rr(x1 - x0, y1 - y0, ri + d - e, Zw, (x0 + x1) / 2, (y0 + y1) / 2);
          const b = rr(x1 - x0 - 2 * s2, y1 - y0 - 2 * s2, Math.max(0.3, ri + d - e - s2), Htot + 0.02, (x0 + x1) / 2 + s2, (y0 + y1) / 2);
          return hullPts(a.concat(b));
        };
        cuts.push(groove(0));
        // agli angoli del lato destro la parete sopra la guida diventerebbe sottilissima: lì il coperchio copre tutto l'angolo
        const cap = (e) => box(Xo - R + e, -1, Zw, Xo + 60, Yo + 1, Htot + 1);
        cuts.push(cap(0));
        cuts.push(box(Xo - w - 0.5, oy - d + s2, Zw, Xo + 1, oy + Yin + d - s2, Htot + 1));
        box0 = U([sub(S, U(cuts)), ...adds]);
        lid = X(S, U([groove(tol), cap(tol)]));
        // presa per l'unghia vicino al bordo da tirare
        lidCuts.push(prism('z', Xo - 9, Yo / 2 - 9, Xo - 4, Yo / 2 + 9, 2.5, Htot - 0.7, Htot + 1));
        lid = sub(lid, U(lidCuts));
      }

      // ---- coperchio: scritta, loghi ({SP}, {viso}, {visoNatale}) e il tuo SVG, sulla faccia di sopra ----
      // Il coperchio si stampa capovolto, con la faccia di sopra sul piatto (come il retro della cover): a filo (colori nei primi strati), inciso o traforato.
      const DEC = H.decor, lidCol = {};   // lidCol[k] = solido del colore k
      let decoInfo = null;
      if (DEC) DEC.NOTES.clear();
      const F = DEC ? DEC.filaments(p, p.disegno === 'svg' ? DEC.artOf('svg', p.svg) : null) : [p.col1, p.col2, p.col3, p.col4];
      if (DEC) {
        const R2 = (c) => reg(c);
        const CU = (l) => { l = l.filter(c => c && !c.isEmpty()); return !l.length ? null : l.length === 1 ? l[0] : R2(CrossSection.union(l)); };
        const CD = (a, b) => (!a ? null : !b ? a : R2(a.subtract(b)));
        const CI = (a, b) => (!a || !b ? null : R2(a.intersect(b)));
        const OFF = (c, d) => (c ? R2(c.offset(d, 'Round')) : null);
        const MV = (c, x, y) => R2(c.translate([x, y]));
        const RECT = (x0, y0, x1, y1) => R2(CrossSection.ofPolygons([[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]]));
        const emptyC = (c) => !c || c.isEmpty() || c.area() < 0.05;
        const EZ = (c, z0, z1) => (emptyC(c) ? null : reg(reg(c.extrude(z1 - z0)).translate([0, 0, z0])));
        const noz = +p.ugello || 0.4, st = p.stileCop || 'filo', depth = Math.min(p.profCop || 0.6, tl - 0.4);
        const hasT = [p.scritta, p.scritta2].some(x => x && String(x).trim());
        const art = p.disegno === 'svg' ? DEC.artOf('svg', p.svg) : null;
        if (p.disegno === 'svg' && !art) notes.push('Carica un file SVG con il pulsante del riquadro "Il tuo disegno"');
        // zona libera: sopra le celle, lontano dai bordi, dalle viti e dalla presa per l'unghia
        const m = viti ? 9.5 : 5;
        const ax0 = ox + m, ax1 = Math.min(ox + Xin - m, viti ? Infinity : Xo - 12), ay0 = oy + yC + 2, ay1 = oy + Yin - m + 1;
        const area = RECT(ax0, ay0, ax1, ay1);
        if ((art || hasT) && ax1 - ax0 > 15 && ay1 - ay0 > 12) {
          const has1 = p.scritta && String(p.scritta).trim(), has2 = p.scritta2 && String(p.scritta2).trim();
          const tH = hasT ? 1.5 * ((has1 ? p.altTesto : 0) + (has2 ? +p.altTesto2 || p.altTesto : 0)) : 0, gap = art && hasT ? 4 : 0;
          const Sa = art ? Math.max(8, Math.min(p.altDisegno, ay1 - ay0 - tH - gap, ax1 - ax0)) : 0;
          const cx = (ax0 + ax1) / 2, cy = (ay0 + ay1) / 2 + (Sa + gap + tH) / 2;
          let artCS = null, txt = null; const slots = {};
          if (art) {
            const g0 = DEC.artGeom(art, Sa, ax1 - ax0), place = (c) => (c ? MV(c, cx, cy - Sa / 2) : null);
            const sil = place(g0.sil);
            artCS = st === 'filo' ? sil : st === 'inciso' ? (g0.lines ? place(g0.lines) : sil) : (g0.lines ? place(CI(g0.lines, OFF(g0.sil, -1.3 * g0.k))) : sil);
            if (st === 'filo') { const sl = DEC.artSlots(g0, F, OFF(g0.sil, 0.01), noz, notes); for (const k of [2, 3, 4]) if (sl[k]) slots[k] = place(sl[k]); }
          }
          if (hasT) {
            txt = DEC.fitText(p, { x: cx, y: cy - Sa - gap - tH / 2, w: ax1 - ax0, h: Math.max(4, tH) }, p.altTesto);
            if (txt && txt.reduced) notes.push(`Scritta ridotta a ${fmt(txt.cap)} mm per starci`);
            if (txt && txt.moved) { const kc = CI(txt.cs, area); if (emptyC(kc) || kc.area() < txt.cs.area() * 0.98) notes.push('La scritta spostata esce dalla zona libera del coperchio: la parte fuori viene tagliata'); }
          }
          let ts = Math.min(4, Math.max(2, +p.colTesto || 3));
          if (p.colTesto === 'auto' && root.SPLAB_SVG) ts = [2, 3, 4].sort((a, b) => root.SPLAB_SVG.dist(F[b - 1], F[0]) - root.SPLAB_SVG.dist(F[a - 1], F[0]))[0];
          const keep = (c) => CI(c, area);
          if (st === 'filo') {
            const tcs = txt ? keep(txt.cs) : null;
            for (const k of [2, 3, 4]) {
              let c = slots[k] ? keep(CD(slots[k], tcs ? OFF(tcs, 0.6) : null)) : null;
              if (k === ts) c = CU([c, tcs]);
              const sol = EZ(c, Htot - depth, Htot + 0.01);
              if (sol) lidCol[k] = reg(sol.intersect(lid));
            }
            decoInfo = `a filo, negli ultimi ${fmt(depth)} mm del coperchio (che si stampano per primi): serve una stampante multicolore, o un cambio di filamento a ${fmt(depth)} mm dal piatto`;
          } else {
            let hole = CU([artCS ? keep(artCS) : null, txt ? keep(st === 'traforata' ? DEC.stencil(txt.cs, txt.cap) : txt.cs) : null]);
            if (st === 'traforata' && artCS) { const r = DEC.perforate(hole, OFF(area, -1)); hole = r.holes; if (r.bridges) notes.push(`${r.bridges} ponticell${r.bridges > 1 ? 'i tengono' : 'o tiene'} attaccate le parti del disegno`); }
            if (!emptyC(hole)) lid = sub(lid, st === 'traforata' ? EZ(hole, Zw - 1, Htot + 1) : EZ(hole, Htot - depth, Htot + 1));
            decoInfo = st === 'traforata' ? 'traforato: si vede dentro la scatola' : `inciso ${fmt(depth)} mm`;
          }
          if (txt && txt.cap < 4) notes.push('Lettere sotto i 4 mm: vengono poco leggibili');
        } else if (art || hasT) notes.push('Sul coperchio non c\'è spazio per la decorazione');
        if (hasT) DEC.logoNotes(noz);
        for (const k of [2, 3, 4]) if (lidCol[k]) lid = sub(lid, lidCol[k]);
      }

      // ---- esempio: scheda, celle, piastrine (solo anteprima) ----
      const gh = [box(bX, bY, f + rz, bX + B.L, bY + B.P, zT)];
      if (dsp) gh.push(box(bX + dsp[0], bY + dsp[1], zT, bX + dsp[2], bY + dsp[3], zT + 7));
      for (const [x, t, , , under] of B.porte) { const c = CONN[t], [a0, a1] = zr(c, under); gh.push(box(bX + x - c.w / 2, bY - B.sporge, zT + (under ? a0 + 0.3 : Math.max(0, a0)), bX + x + c.w / 2, bY + 8, zT + (under ? Math.min(-B.pcb, a1) : a1 - 0.3))); }
      if (pp) {
        let c = 0;
        for (const [a, b, k] of ppBox) {
          const hx0 = xb0 + 0.4, hy0 = a + 0.4, hy1 = b - 0.4, H0 = f + pp.H;
          gh.push(sub(box(hx0, hy0, f, hx0 + pp.L, hy1, H0), box(hx0 + 1.5, hy0 + 1.2, f + 1.5, hx0 + pp.L - 1.5, hy1 - 1.2, H0 + 1)));
          const pit = (hy1 - hy0) / k;
          if (pit >= C.D && pp.L >= C.L + 3 && pp.H >= C.D + 1.5) for (let j = 0; j < k && c < n; j++, c++) gh.push(cylX(hx0 + (pp.L - C.L) / 2, hx0 + (pp.L + C.L) / 2, hy0 + pit * (j + 0.5), f + 1.5 + C.D / 2, C.D / 2, 40));
        }
      } else for (let i = 0; i < n; i++) gh.push(cylX(xb0 + 2.5, xb0 + 2.5 + C.L, cyOf(i), czc, C.D / 2, 48));
      gh.push(...plates);
      const ghostM = U(gh);

      // ---- pezzi ----
      const center = (q) => reg(q.translate([-Xo / 2, -Yo / 2, 0]));
      const flip = (q) => reg(q.rotate([180, 0, 0]));
      const parts = [];
      const prova = p.prova === true ? 'fronte' : (p.prova || 'nessuna');
      let note_prova = null;
      if (prova === 'nessuna') {
        parts.push({ name: 'Scatola', m: center(box0), role: 'body' });
        const colored = Object.keys(lidCol).length > 0, atL = p.__closed ? undefined : [0, Yo + 12, -Zw];
        parts.push(Object.assign({ name: 'Coperchio', m: center(lid), role: 'inner', print: flip(center(lid)), at: atL }, colored ? { color: F[0], group: 'Coperchio' } : {}));
        for (const k of [2, 3, 4]) if (lidCol[k]) parts.push({ name: `Coperchio · colore ${k}`, m: center(lidCol[k]), role: 'inner', print: flip(center(lidCol[k])), at: atL, color: F[k - 1], group: 'Coperchio' });
      } else {
        if (prova === 'fronte' || prova === 'tutte') {
          parts.push({ name: 'Prova del fronte', m: center(X(box0, box(-10, -10, -1, Xo + 10, oy + yF + 8, Htot + 2))), role: 'body' });
          info.push(['Prova fronte', 'la parete davanti con porte e pulsante e gli appoggi della scheda: appoggiaci la scheda e prova a infilare le spine']);
        }
        if (prova === 'chiusura' || prova === 'tutte') {
          const dy = prova === 'tutte' ? Yo + 10 : 0;
          if (viti) {
            // un angolo con la sua colonnina e il pezzo di coperchio sopra: si avvitano insieme come quelli veri
            const [px, py] = posts[posts.length - 1], a = 8;
            const win = box(px - a, py - a, -1, Xo + 1, Yo + 1, Htot + 2);
            parts.push({ name: 'Prova viti: angolo', m: reg(center(X(box0, win)).translate([0, dy, 0])), role: 'body' });
            const lp = center(X(lid, win));
            parts.push({ name: 'Prova viti: coperchio', m: reg(lp.translate([0, dy, 0])), role: 'inner', print: flip(lp), at: p.__closed ? undefined : [0, 0, 10] });
            note_prova = `un angolo della scatola con la colonnina e il suo pezzo di coperchio: avvitali con una vite ${p.vite} svasata. Se la vite gira a vuoto o è troppo dura, prova un'altra lunghezza o l'altra misura di vite`;
          } else {
            // l'ultimo tratto di guida (con il fianco destro abbassato) e un pezzo di coperchio che ci scorre dentro
            const L = Math.min(30, Xo * 0.4), z0 = Math.max(f, Zw - 5);
            const win = box(Xo - L, -1, z0, Xo + 1, Yo + 1, Htot + 2);
            const rim = center(X(box0, win));
            parts.push({ name: 'Prova slitta: guida', m: reg(reg(rim.translate([0, dy, -z0]))), role: 'body', print: reg(rim.translate([0, 0, -z0])) });
            const lp = center(X(lid, box(Xo - L, -1, -1, Xo + 1, Yo + 1, Htot + 2)));
            parts.push({ name: 'Prova slitta: coperchio', m: reg(lp.translate([0, dy, -z0])), role: 'inner', print: flip(lp) });   // nell'anteprima è già infilato nella guida
            note_prova = `gli ultimi ${fmt(L)} mm della guida, alti 5 mm, e un pezzo di coperchio: infilalo dal lato destro. Se è duro aumenta la tolleranza, se balla diminuiscila`;
          }
        }
      }
      if (prova === 'nessuna' || prova === 'fronte') parts.push({ name: 'esempio', m: center(ghostM), role: 'ghost' });

      // ---- misure e note ----
      const Wh = n * C.mAh / 1000 * 3.6;
      info.push(['Esterno', `${fmt(Xo)} × ${fmt(Yo)} × ${fmt(Htot)} mm`]);
      info.push(['Celle', `${n} × ${C.nome} in parallelo (${C.fonte})`]);
      info.push(['Capacità', `circa ${fmt(n * C.mAh / 1000)} Ah con celle da ${C.mAh} mAh: ${fmt(Wh)} Wh, all'uscita a 5 V circa ${Math.round(Wh * 0.85 / 5 * 10) * 100} mAh`]);
      info.push(['Scheda', `${B.nome}: ${B.uscita}`]);
      info.push(['Misure scheda', B.fonte]);
      if (B.dove) info.push(['Dove si compra', B.dove]);
      info.push(['Porte', [...B.porte.map(q => q[2]), ...(p.fianchi ? B.fianchi.map(q => `${q[3]} (fianco ${q[0] === 'sx' ? 'sinistro' : 'destro'})`) : [])].join(', ') + `; gioco ${fmt(g)} mm per lato`]);
      if (pul) info.push(['Pulsante', p.pulsante === 'lamella' ? `linguetta nella parete ${pul.lato === 'fronte' ? 'davanti' : pul.lato === 'sx' ? 'sinistra' : 'destra'}: premila e il dentino preme il tasto` : 'foro Ø 3,2 mm: il tasto si preme con una punta']);
      if (dsp) info.push(['Display', 'si vede dalla finestra del coperchio']);
      if (led) info.push(['LED', 'sopra i LED il coperchio è spesso 0,4 mm: la luce passa, meglio se stampi il coperchio in un colore chiaro']);
      if (molle) {
        info.push(['Contatti', `${2 * n} piastrine a molla per 18650 (16 × 16,5 mm, vanno bene anche quelle da 16 × 18,5): si infilano dall'alto nelle fessure. Molla a sinistra (−), piastrina col bottone a destra (+), come segnato sul fondo`]);
        info.push(['Collegamenti', `prendi le piastrine con i fili già attaccati: i fili passano dai fori in fondo alle fessure ai canali laterali. Tutti i + insieme e tutti i − insieme con due morsetti a leva (tipo Wago 221), poi alle piazzole B+ e B− della scheda`]);
      } else if (pp) {
        info.push(['Portapile', `${gruppi.length} × ${fmt(pp.L)} × ${fmt(pp.W)} × ${fmt(pp.H)} mm (le tue misure), ${gruppi[0]} cell${gruppi[0] > 1 ? 'e' : 'a'} ciascuno; nella cornice c'è 0,4 mm di gioco per lato`]);
        info.push(['Attenzione', 'il portapile deve essere in parallelo: sopra c\'è scritto 3,7 V o Parallel. Se dice 7,4 V o 11,1 V è in serie e con queste schede non va']);
        info.push(['Collegamenti', gruppi.length > 1 ? 'tutti i fili rossi insieme e tutti i neri insieme con due morsetti a leva (tipo Wago 221), poi alle piazzole B+ e B− della scheda. Nessuna saldatura sulle celle' : 'il filo rosso a B+ e il nero a B− della scheda. Nessuna saldatura sulle celle']);
      } else info.push(['Celle', 'pacco già saldato a punti con nastro di nichel (come lo fanno i negozi di batterie)']);
      info.push(['Coperchio', viti ? `a viti nascoste: 4 viti ${p.vite} svasate da sotto, lunghe ${dv === 3 ? 16 : 16}–20 mm, che si avvitano nel coperchio. Sopra non si vede niente` : 'a slitta: entra dal fianco destro nelle guide a coda di rondine; la tacca vicino al bordo serve per tirarlo']);
      if (decoInfo) info.push(['Coperchio decorato', decoInfo]);
      info.push(['Stampa', 'PETG o ASA (il PLA si deforma al sole in auto). Scatola aperta in su, coperchio capovolto: senza supporti']);
      notes.push('Le piazzole B+ e B− della scheda sono da saldare: sono le uniche due saldature, tutto il resto è a contatti e morsetti. Se non saldi, fattele fare (bastano due minuti a chi ha un saldatore)');
      notes.push('Metti nella scatola solo celle uguali e cariche allo stesso modo, con il + verso destra: al contrario la scheda si brucia');
      if (pp && pp.H < 19) notes.push(`Portapile alto ${fmt(pp.H)} mm: controlla la misura, una 18650 è alta 18,5 mm`);
      if (p.cella === 'normale' && !pp) notes.push('Celle protette (più lunghe, fino a 70 mm)? Scegli "18650 protette", altrimenti non entrano');
      for (const x of notes) info.push(['Nota', x]);
      if (DEC) { for (const x of DEC.NOTES) info.push(['Nota', x]); DEC.NOTES.clear(); }
      const res = { parts, info, view: [0.55, -0.95, 0.8] };
      if (note_prova) info.splice(1, 0, ['Prova chiusura', note_prova]);
      if (p.__probe) res.probe = p.__probe({ box0, lid, CrossSection, Zw, Htot });   // solo per i test
      if (p.__check && prova === 'nessuna') {
        const v = (a, b) => +X(a, b).volume().toFixed(3);
        res.closed = [['scatola-coperchio', v(box0, lid)], ['scatola-esempio', v(box0, ghostM)], ['coperchio-esempio', v(lid, ghostM)]];
      }
      return res;
    }

    return { powerbank };
  });
  root.SPLAB_POWERBANK = { CELLE, CONN, SCHEDE, PIASTRA };
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Bastoncino di zucchero (candy cane) a pezzi: un tubo che sale dritto, gira a mezzo cerchio e scende un poco, tagliato in pezzi
// rossi e bianchi con tagli obliqui, così montato ha le strisce in diagonale. I pezzi si uniscono con perni (stampati o tondino).
// Si aggancia al motore di geom.js tramite SPRECOLO_EXT. Coordinate in mm, z verso l'alto; il bastoncino sta nel piano x, z.
// - ogni pezzo è un solo colore: si stampa anche con una stampante a un colore;
// - si stampa appoggiato su una faccia di taglio, scelta in modo che le pareti sporgano il meno possibile (sempre entro 45°);
// - i fori dei perni sono perpendicolari alle facce di taglio: nella faccia sul piatto salgono dritti e finiscono a punta 45°,
//   quindi niente ponti né supporti.
(function (root) {
  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function bastoncino(H) {
    const { Manifold, Mesh, CrossSection, reg, union, sub, fmt } = H;
    const DEG = Math.PI / 180;
    const add = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const Y = [0, 1, 0];
    const f2 = (v) => String(Math.round(v * 100) / 100).replace('.', ',');

    function bastoncino(p) {
      const notes = [], info = [];
      const D = +p.diametro, r = D / 2;
      const domeB = p.fondo !== 'piatto';
      // manico: raggio della curva (sull'asse del tubo); dentro deve restare un buco di almeno 2 mm
      let R = (+p.larghezza - D) / 2;
      const Rmin = r + 2;
      if (R < Rmin) { R = Rmin; notes.push(`~Manico allargato a ${fmt(2 * R + D)} mm: più stretto il tubo si chiuderebbe su se stesso`); }
      const TAIL = Math.max(0, +p.punta);
      let L = +p.altezza - R - r - (domeB ? r : 0);   // tratto dritto del fusto
      if (L < D) { L = D; notes.push(`Altezza troppo bassa per questo diametro e questo manico: portata a ${fmt(L + R + r + (domeB ? r : 0))} mm`); }
      const ARC = Math.PI * R, STOT = L + ARC + TAIL;
      const seg = Math.max(48, Math.min(160, Math.round(Math.PI * D / 0.9)));
      const verso = p.verso === 'sinistra' ? -1 : 1;

      // asse: punto, tangente T e normale P (nel piano x, z, verso il centro della curva)
      function frame(s) {
        if (s <= L) return [[0, 0, s], [0, 0, 1], [1, 0, 0]];
        if (s <= L + ARC) {
          const a = (s - L) / R, c = Math.cos(a), sn = Math.sin(a);
          return [[R - R * c, 0, L + R * sn], [sn, 0, c], [c, 0, -sn]];
        }
        const t = s - L - ARC;
        return [[2 * R, 0, L - t], [0, 0, -1], [-1, 0, 0]];
      }

      // tubo lungo l'asse da sA a sB, con le estremità a cupola (mezza sfera) o piatte. Mesh scritta a mano: anelli lungo l'asse.
      function tube(sA, sB, domeA, domeEnd) {
        const STEP = Math.min(1.5, R * 4 * DEG);
        const ss = [sA];
        for (let k = Math.floor(sA / STEP) + 1; k * STEP < sB - 0.05; k++) ss.push(k * STEP);
        for (const b of [L, L + ARC]) if (b > sA + 0.05 && b < sB - 0.05 && !ss.some(v => Math.abs(v - b) < 0.05)) ss.push(b);
        ss.push(sB); ss.sort((a, b) => a - b);
        const rings = [];   // [centro, P, raggio, T]
        const ND = Math.max(6, Math.round(seg / 8));
        const dome = (s, dir, out) => {   // anelli della cupola, dal bordo verso il polo
          const [c, T, P] = frame(s);
          for (let k = 1; k < ND; k++) { const f = k / ND * 90 * DEG; out.push([add(c, T, dir * r * Math.sin(f)), P, r * Math.cos(f)]); }
          return add(c, T, dir * r);
        };
        let poleA, poleB;
        if (domeA) { const tmp = []; poleA = dome(sA, -1, tmp); rings.push(...tmp.reverse()); } else poleA = frame(sA)[0];
        for (const s of ss) { const [c, , P] = frame(s); rings.push([c, P, r]); }
        if (domeEnd) poleB = dome(sB, 1, rings); else poleB = frame(sB)[0];
        const pts = [], tri = [];
        for (const [c, P, rad] of rings) for (let j = 0; j < seg; j++) {
          const a = 2 * Math.PI * j / seg, ca = Math.cos(a), sa = Math.sin(a);
          pts.push(c[0] + rad * (ca * P[0] + sa * Y[0]), c[1] + rad * (ca * P[1] + sa * Y[1]), c[2] + rad * (ca * P[2] + sa * Y[2]));
        }
        const n = rings.length, iA = n * seg, iB = iA + 1;
        pts.push(...poleA, ...poleB);
        for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
          const a = i * seg + j, b = i * seg + (j + 1) % seg, c = a + seg, d = b + seg;
          tri.push(a, b, d, a, d, c);
        }
        for (let j = 0; j < seg; j++) {
          tri.push(iA, (j + 1) % seg, j);
          tri.push(iB, (n - 1) * seg + j, (n - 1) * seg + (j + 1) % seg);
        }
        return reg(new Manifold(new Mesh({ numProp: 3, vertProperties: new Float32Array(pts), triVerts: new Uint32Array(tri) })));
      }

      // ---- tagli ----
      let N = Math.max(2, Math.round(+p.pezzi));
      const Nasked = N;
      const thetaAsked = Math.max(0, Math.min(45, +p.inclinazione)) * DEG;
      let theta = thetaAsked;
      const cutsFor = (th) => {
        const c = [];
        for (let k = 1; k < N; k++) {
          const s = k * STOT / N, [pt, T, P] = frame(s);
          const nrm = add(T.map(v => v * Math.cos(th)), P, verso * Math.sin(th));
          // u: nel piano del taglio, perpendicolare a y (serve per mettere i perni sulla faccia)
          c.push({ s, pt, T, P, n: nrm, off: dot(nrm, pt), u: add(P.map(v => v * Math.cos(th)), T, -verso * Math.sin(th)) });
        }
        return c;
      };
      // tubo attorno al pezzo i (un po' oltre i due tagli) tagliato dai due piani
      function piece(i, cuts, th) {
        const m = r * Math.tan(th) + r + 3;
        const sA = i === 0 ? 0 : Math.max(0, cuts[i - 1].s - m), sB = i === N - 1 ? STOT : Math.min(STOT, cuts[i].s + m);
        let q = tube(sA, sB, i === 0 && domeB, i === N - 1);
        if (i > 0) q = reg(q.trimByPlane(cuts[i - 1].n, cuts[i - 1].off));
        if (i < N - 1) q = reg(q.trimByPlane(cuts[i].n.map(v => -v), -cuts[i].off));
        return q;
      }

      // ---- orientamento per la stampa: una faccia di taglio sul piatto, quella con lo sbalzo minore ----
      // ruoto attorno a y (le normali dei tagli stanno nel piano x, z) finché la faccia scelta guarda in giù
      const faceDown = (q, v) => {   // v = normale uscente della faccia da mettere sul piatto
        const g = Math.atan2(v[0], v[2]);
        return reg(q.rotate([0, 180 - g / DEG, 0]));
      };
      function overhang(q) {   // sbalzo massimo in gradi dalla verticale, escluse le facce appoggiate sul piatto
        const mesh = q.getMesh(), V = mesh.vertProperties, T = mesh.triVerts, np = mesh.numProp;
        let z0 = Infinity; for (let k = 2; k < V.length; k += np) z0 = Math.min(z0, V[k]);
        let worst = 0;
        for (let k = 0; k < T.length; k += 3) {
          const a = T[k] * np, b = T[k + 1] * np, c = T[k + 2] * np;
          if (V[a + 2] < z0 + 0.02 && V[b + 2] < z0 + 0.02 && V[c + 2] < z0 + 0.02) continue;
          const ux = V[b] - V[a], uy = V[b + 1] - V[a + 1], uz = V[b + 2] - V[a + 2], vx = V[c] - V[a], vy = V[c + 1] - V[a + 1], vz = V[c + 2] - V[a + 2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, len = Math.hypot(nx, ny, nz);
          if (len < 1e-4) continue;
          if (nz / len < 0) worst = Math.max(worst, Math.asin(Math.min(1, -nz / len)) / DEG);
        }
        return worst;
      }

      // pezzi validi: con il manico stretto due tagli vicini possono incrociarsi dentro il tubo (riduco l'inclinazione);
      // se un pezzo del manico sporge oltre 45° aggiungo pezzi, così tutto si stampa senza supporti
      let cuts, pieces, orient, worstOv;
      const Nmax = Math.max(N, Math.ceil(STOT / (0.35 * D)));
      for (;;) {
        theta = thetaAsked;
        for (let tries = 0; ; tries++) {
          cuts = cutsFor(theta);
          pieces = [];
          for (let i = 0; i < N; i++) pieces.push(piece(i, cuts, theta));
          let bad = pieces.some(q => q.isEmpty() || q.decompose().map(reg).length !== 1);
          for (let i = 0; !bad && i < N - 1; i++) if (reg(pieces[i].intersect(pieces[i + 1])).volume() > 0.05) bad = true;
          if (!bad || tries > 14) break;
          theta *= 0.85;
        }
        orient = pieces.map((q, i) => {
          const opts = [];
          if (i > 0) opts.push({ v: cuts[i - 1].n.map(x => -x) });   // faccia del taglio prima
          if (i < N - 1) opts.push({ v: cuts[i].n });                // faccia del taglio dopo
          let best = null;
          for (const o of opts) { const ov = overhang(faceDown(q, o.v)); if (!best || ov < best.ov - 0.5) best = Object.assign({ ov }, o); }
          return best;
        });
        worstOv = Math.max(...orient.map(o => o.ov));
        if (worstOv <= 45.5 || N >= Nmax) break;
        N++;
      }
      if (N > Nasked) notes.push(`~Pezzi portati a ${N}: con meno, un pezzo del manico sporgerebbe oltre 45° e servirebbero i supporti`);
      if (theta < thetaAsked - 0.01 * DEG) notes.push(`~Inclinazione ridotta a ${fmt(theta / DEG)}°: con questo manico i tagli si incrocerebbero dentro il tubo`);

      // ---- perni ----
      // fori perpendicolari al taglio: nella faccia appoggiata sul piatto salgono dritti. Per ogni giunzione scelgo la rotazione dei
      // perni che li tiene più lontani dai fori dell'altra faccia del pezzo, con almeno WALL di parete attorno
      let nP = Math.max(0, Math.min(4, Math.round(+p.perni)));
      const nPasked = nP;
      const pinD = +p.diamPerno, hd = pinD / 2 + +p.gioco, WALL = 1.6;   // gioco per lato
      let depth = Math.max(3, +p.lungPerno / 2 + 0.5);
      const holeVol = () => Math.PI * hd * hd * depth + Math.PI * hd * hd * hd / 3;
      // distanza di un punto dall'asse del tubo
      function axisDist(x) {
        let d = Math.hypot(x[0], x[1], x[2] < 0 ? x[2] : x[2] > L ? x[2] - L : 0);
        if (x[2] >= L) d = Math.min(d, Math.hypot(Math.hypot(x[0] - R, x[2] - L) - R, x[1]));
        const zt = x[2] < L - TAIL ? L - TAIL - x[2] : x[2] > L ? x[2] - L : 0;
        return Math.min(d, Math.hypot(x[0] - 2 * R, x[1], zt));
      }
      function segDist(a0, a1, b0, b1) {   // distanza minima tra due segmenti
        const u = add(a1, a0, -1), v = add(b1, b0, -1), w = add(a0, b0, -1);
        const A = dot(u, u), B = dot(u, v), C = dot(v, v), Dd = dot(u, w), E = dot(v, w), den = A * C - B * B;
        let sc = den < 1e-9 ? 0 : Math.min(1, Math.max(0, (B * E - C * Dd) / den));
        let tc = Math.min(1, Math.max(0, (B * sc + E) / C));
        sc = Math.min(1, Math.max(0, (B * tc - Dd) / A));
        return Math.hypot(...add(add(w, u, sc), v, -tc));
      }
      const pinPos = (c, rp, phi) => {
        const out = [];
        for (let k = 0; k < Math.max(1, nP); k++) {
          const a = phi + (90 + k * 360 / Math.max(1, nP)) * DEG, w = nP > 1 ? [Math.cos(a) * rp, Math.sin(a) * rp] : [0, 0];
          out.push(add(add(c.pt, c.u, w[0] / Math.cos(theta)), Y, w[1]));
        }
        return out;
      };
      // quanto margine lascia un foro (asse da q lungo dir per len): parete del tubo e faccia opposta del pezzo
      function holeMargin(q, dir, len, far, farSign) {
        let m = Infinity;
        for (let k = 0; k <= 8; k++) m = Math.min(m, r - WALL - hd - axisDist(add(q, dir, len * k / 8)));
        if (far) { const e = add(q, dir, len + 0.5); m = Math.min(m, farSign * (dot(far.n, e) - far.off) - 0.6); }
        return m;
      }
      function planPins() {   // → { rp, phis } oppure null
        const len = depth + hd;
        const rps = nP > 1 ? [] : [0];
        if (nP > 1) { const need = hd / Math.sin(Math.PI / nP) + 0.6; for (let x = 0.5 * r; x >= need - 1e-6; x -= 0.25) rps.push(x); }
        const PH = []; for (let a = 0; a < 360 / Math.max(1, nP); a += 5) PH.push(a * DEG);
        for (const rp of rps) {
          const phis = [];
          let ok = true;
          for (let j = 0; j < cuts.length && ok; j++) {
            const c = cuts[j];
            let best = null;
            for (const phi of (nP > 1 ? PH : [0])) {
              const pts = pinPos(c, rp, phi);
              let m = Infinity;
              for (const q of pts) {
                m = Math.min(m, holeMargin(q, c.n, len, cuts[j + 1], -1));                 // verso il pezzo dopo
                m = Math.min(m, holeMargin(q, c.n.map(v => -v), len, cuts[j - 1], 1));     // verso il pezzo prima
              }
              if (j > 0) {   // fori dell'altra faccia del pezzo j (giunzione j-1, che salgono lungo la sua normale)
                const cp = cuts[j - 1], prev = pinPos(cp, rp, phis[j - 1]);
                for (const q of pts) for (const q0 of prev) m = Math.min(m, segDist(q, add(q, c.n, -len), q0, add(q0, cp.n, len)) - 2 * hd - 0.8);
              }
              if (!best || m > best.m) best = { m, phi };
            }
            if (best.m < 0) ok = false; else phis.push(best.phi);
          }
          if (ok) return { rp, phis };
        }
        return null;
      }
      let finals = pieces, pinOk = nP > 0, plan = null;
      if (nP > 0 && N > 1) {
        for (;;) {
          plan = planPins();
          if (plan) {
            const hole = reg(reg(CrossSection.ofPolygons([[[0, -depth - hd], [hd, -depth], [hd, depth], [0, depth + hd]]])).revolve(32));
            const HS = cuts.map((c, j) => pinPos(c, plan.rp, plan.phis[j]).map(q => reg(reg(hole.rotate([0, Math.atan2(c.n[0], c.n[2]) / DEG, 0])).translate(q))));
            let ok = true;
            finals = pieces.map((q, i) => {
              const hs = [...(i > 0 ? HS[i - 1] : []), ...(i < N - 1 ? HS[i] : [])];
              const out = sub(q, union(hs));
              // controllo finale: ogni foro tutto dentro il pezzo e nessun foro che ne incontra un altro
              if (out.genus() !== 0 || out.decompose().map(reg).length !== 1 || q.volume() - out.volume() < hs.length * holeVol() * 0.985) ok = false;
              return out;
            });
            if (ok) break;
          }
          if (depth <= 3.01) {
            if (nP > 1) { nP--; depth = Math.max(3, +p.lungPerno / 2 + 0.5); continue; }   // ci riprovo con un perno in meno
            pinOk = false; finals = pieces; nP = nPasked; notes.push('I perni non stanno nei pezzi: aumenta il diametro del tubo, usa perni più sottili, oppure incolla i pezzi'); break;
          }
          depth = Math.max(3, depth - 0.5);
        }
        if (pinOk && nP < nPasked) notes.push(`~${nP === 1 ? 'Un perno' : nP + ' perni'} per giunzione invece di ${nPasked}: di più non stanno nel tubo`);
        if (pinOk && depth < +p.lungPerno / 2 + 0.5 - 0.01) notes.push(`~Perni accorciati a ${fmt(2 * depth - 1)} mm: più lunghi i fori uscirebbero dai pezzi`);
      }

      // ---- pezzi ----
      const col = (i) => (i % 2 === 0 ? p.col1 : p.col2);
      const which = p.quali;
      const parts = [];
      const pieceLen = STOT / N;
      finals.forEach((q, i) => {
        const o = orient[i], k = i % 2 === 0 ? 1 : 2;
        const skip = (which === 'c1' && k !== 1) || (which === 'c2' && k !== 2);
        parts.push(Object.assign({ name: `Pezzo ${i + 1} · colore ${k}`, m: q, print: faceDown(q, o.v), color: col(i) }, skip ? { role: 'ghost' } : { role: 'body' }));
      });
      const nPins = pinOk ? nP * (N - 1) : 0, pinL = 2 * depth - 1;
      if (nP > 0 && p.stampaPerni && which !== 'c2' && pinOk) {
        // perni in piedi, con le estremità smussate: entrano meglio e non serve il brim
        const ch = Math.min(0.5, pinD * 0.12), pr = pinD / 2;
        const pin = union([reg(Manifold.cylinder(ch, pr - ch, pr, 32)), reg(reg(Manifold.cylinder(pinL - 2 * ch, pr, pr, 32)).translate([0, 0, ch])), reg(reg(Manifold.cylinder(ch, pr, pr - ch, 32)).translate([0, 0, pinL - ch]))]);
        const per = Math.ceil(Math.sqrt(nPins)), step = pinD + 4;
        for (let k = 0; k < nPins; k++) {
          const at = [2 * R + D + 15 + (k % per) * step, -Math.floor(k / per) * step, -r];
          parts.push({ name: `Perno ${k + 1}`, m: reg(pin.translate(at)), print: pin, color: p.col1, role: 'body' });
        }
      }

      // ---- misure ----
      const Hreal = L + R + r + (domeB ? r : 0);
      info.push(['Misure', `alto ${fmt(Hreal)} mm, manico largo ${fmt(2 * R + D)} mm, tubo Ø ${fmt(D)} mm`]);
      info.push(['Pezzi', `${N}: ${Math.ceil(N / 2)} del colore 1 e ${Math.floor(N / 2)} del colore 2, lunghi ${fmt(pieceLen)} mm sull'asse; tagli inclinati di ${fmt(theta / DEG)}°`]);
      if (nP > 0 && pinOk) {
        info.push(['Perni', `${nPins} (${nP} per giunzione), Ø ${f2(pinD)} × ${fmt(pinL)} mm${p.stampaPerni ? ', nel file, da stampare in piedi' : ': tondino o filamento tagliato a misura'}`]);
        info.push(['Fori', `Ø ${f2(2 * hd)} mm (perno + ${f2(+p.gioco)} di gioco per lato), profondi ${fmt(depth)} mm per lato, perpendicolari al taglio, con la punta a 45°`]);
      } else info.push(['Montaggio', 'senza perni: incolla i pezzi con colla cianoacrilica']);
      info.push(['Stampa', `ogni pezzo su una faccia di taglio, senza supporti: sbalzo massimo ${fmt(Math.round(worstOv))}°. Riempimento 10–15%, 3 perimetri`]);
      if (worstOv > 45.5) notes.push(`Un pezzo ha uno sbalzo di ${fmt(Math.round(worstOv))}°: metti più pezzi o allarga il manico, così si stampa senza supporti`);
      info.push(['Montaggio', 'dal pezzo 1 (in fondo) al pezzo ' + N + ' (punta del manico); i pezzi del manico sono tutti diversi, quelli del fusto uguali']);
      if (which !== 'tutti') info.push(['Nel file', `solo i pezzi del colore ${which === 'c1' ? 1 : 2}${which === 'c1' && nP > 0 && p.stampaPerni ? ' e i perni' : ''}: gli altri sono in azzurro e non si esportano`]);
      for (const x of notes) info.push(['Nota', x]);
      return { parts, info, view: [0.35, -1, 0.3] };
    }

    return { bastoncino };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

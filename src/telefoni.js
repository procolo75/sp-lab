// Misure dei telefoni per il generatore di cover, in millimetri.
// iPhone: quote prese dai disegni quotati che Apple pubblica per chi progetta accessori
// (developer.apple.com, Accessory Design Guidelines, "Dimensional Drawings"); `fonte` è la data del disegno.
// Le quote segnate "scala" nei commenti non sono scritte sul disegno: sono misurate in scala sulla vista del retro (±0,2 mm).
//
// Riferimenti: x da sinistra guardando lo SCHERMO, y dall'alto, z dal retro.
//   a    angolo in pianta: punti [x, y] dal fianco alla cima (A(...) = elenco simmetrico delle quote del disegno)
//   pf   profilo del bordo verso lo schermo: [distanza dal piano medio, rientro]; pr verso il retro (se manca è uguale)
//   sx   tasti sul fianco sinistro [centro dall'alto, lunghezza, tipo]; dx sul fianco destro. w = altezza dei tasti
//        (wcc per il Camera Control); i tasti sono a metà spessore
//   cam  rialzo della fotocamera, con le quote del disegno del RETRO (x da sinistra guardando il retro: il generatore le ribalta)
//        r: [x0, y0, x1, y1, raggio]; h: quanto sporge il rialzo; v: quanto sporge il vetro delle lenti (dal retro);
//        tutto: il rialzo è largo quanto il telefono; f: finestra se diversa dal rialzo; fori: [x, y, Ø] fuori dal rialzo (flash)
//   usb  connettore sul fondo [centro x, larghezza, altezza, raggio] (zona da lasciare libera); lightning: true se Lightning
//   sp   fori di altoparlanti e microfoni sul fondo [x0, x1]; piano: distanza dal bordo dove il vetro diventa piatto
//   mag  centro del MagSafe dalla cima, se non è al centro del telefono
//   cima fori sulla cima [centro x, larghezza] (microfoni), se servono
// Altri telefoni (marca diversa da Apple): niente disegni quotati pubblici. `misure` dice da dove vengono le quote:
// ingombri dalla scheda tecnica, contorno, fotocamera e tasti in scala dalla foto ufficiale del retro, il resto stimato.
(function (root) {
  const A = (...v) => v.map((x, i) => [x, v[v.length - 1 - i]]);
  // profili ricorrenti
  const P16 = [[1.62, 0], [2.12, 0], [2.61, 0.02], [3.09, 0.13], [3.50, 0.40], [3.77, 0.81]];
  const P14 = [[2.71, 0], [3.14, 0.01], [3.54, 0.14], [3.79, 0.49], [3.82, 0.91]];
  const P13 = [[2.63, 0], [3.07, 0.01], [3.47, 0.14], [3.71, 0.46], [3.75, 0.91]];
  const P12 = [[2.50, 0], [2.94, 0.01], [3.36, 0.15], [3.59, 0.51], [3.62, 0.95]];
  const A16 = A(0, 0.04, 0.59, 2.29, 5.24, 9.06, 13.21, 17.40);
  const A16P = A(0, 0.04, 0.89, 3.74, 8.36, 13.75, 19.23);
  const A15P = A(0, 0.05, 0.90, 3.48, 7.58, 12.36, 17.24);
  const A17P = A(0, 0.04, 0.92, 3.80, 8.46, 13.90, 19.43);
  const A14 = [[0, 16.14], [0.06, 11.63], [0.95, 7.20], [3.22, 3.40], [6.97, 0.95], [11.38, 0.07], [15.89, 0]];
  const A13 = A(0, 0.07, 0.92, 3.31, 7.04, 11.43, 15.89);
  const A12 = A(0, 0.13, 1.07, 3.31, 6.66, 10.59, 14.64);
  // tasti
  const act = (c, h) => [c, 2 * h, 'azione'], vol = (c, h) => [c, 2 * h, 'volume'], mute = (c, h) => [c, 2 * h, 'silenzioso'];
  const side = (c, h) => [c, 2 * h, 'laterale'], cc = (c, h) => [c, 2 * h, 'camera'];
  // fotocamere ricorrenti
  const CAM16 = { r: [1.09, 1.25, 26.16, 43.72, 12.53], h: 1.85, v: 3.48, fori: [[30.01, 22.48, 6.28]] };
  const CAM16P = { r: [1.04, 1.04, 45.22, 46.54, 13], h: 2.05, v: 4.28 };          // raggio: scala
  // rialzo largo quanto il telefono, con i bordi arrotondati. Forma presa dagli originali Anycubic (cover stampata e provata):
  // b0 = rettangolo di riferimento [rientro dalla cima, fine dalla cima, raggio], largo quanto il telefono;
  // tasca = [profondità dal retro del telefono, rientro da b0] della tasca della copertura (gioco di 0,6 mm compreso)
  const CAM17P = { r: [0, 0, 0, 48.75, 0], tutto: true, h: 2.55, v: 4.43,
    b0: [0.21, 47.97, 14.85], tasca: [[0, 2.3], [0.5, 2.95], [1.2, 3.86], [2.0, 4.46], [2.4, 4.65]] };

  const T = [
    { id: 'iphone-17-pro-max', nome: 'iPhone 17 Pro Max', fonte: '2025-09-09', W: 77.98, L: 163.43, T: 8.75, a: A17P,
      pf: [[1.50, 0.01], [2.99, 0.15], [4.24, 0.90], [4.29, 1.20], [4.38, 2.61]], pr: [[1.44, 0], [2.86, 0.17], [4.01, 0.97], [4.35, 2.35], [4.38, 3.79]],
      sx: [act(34.28, 3.45), vol(48.43, 5.60), vol(62.63, 5.60)], dx: [side(55.53, 8.85), cc(111.82, 8.55)], w: 2.66, wcc: 3.13,
      cam: Object.assign({}, CAM17P, { f: [3.93, 3.93, 74.05, 43.96, 10.5] }), usb: [38.99, 12.45, 6.60, 3.25], sp: [15.41, 62.57], piano: 2.61 },
    { id: 'iphone-17-pro', nome: 'iPhone 17 Pro', fonte: '2025-09-09', W: 71.85, L: 150.01, T: 8.75, a: A17P,
      pf: [[1.50, 0.01], [2.99, 0.15], [4.24, 0.90], [4.29, 1.20], [4.38, 2.61]], pr: [[1.44, 0], [2.86, 0.17], [4.01, 0.97], [4.35, 2.35], [4.38, 3.79]],
      sx: [act(34.28, 3.45), vol(48.43, 5.60), vol(62.63, 5.60)], dx: [side(55.53, 8.85), cc(98.40, 8.55)], w: 2.66, wcc: 3.03,
      cam: Object.assign({}, CAM17P, { f: [3.99, 3.93, 67.86, 43.93, 10.5] }), usb: [35.92, 12.45, 6.60, 3.25], sp: [15.46, 56.45], piano: 2.61, mag: 77.74 },
    { id: 'iphone-air', nome: 'iPhone Air', fonte: '2025-09-09', W: 74.70, L: 156.18, T: 5.64, a: A(0, 0.04, 0.91, 3.78, 8.43, 13.85),
      pf: [[0.38, 0], [1.47, 0.02], [2.44, 0.47], [2.79, 1.49], [2.82, 2.58]],
      sx: [act(34.08, 3.45), vol(48.23, 5.60), vol(62.43, 5.60)], dx: [side(55.33, 8.90), cc(104.77, 8.55)], w: 2.35, wcc: 2.53,
      // rialzo largo quanto il telefono, con una rampa da y 31,9 a 34,0 (scala); finestra attorno a lente e flash
      cam: { r: [0, 0, 0, 34.0, 0], tutto: true, h: 3.03, v: 5.68, f: [8.38, 8.38, 61.57, 24.20, 7.91] },
      usb: [37.35, 12.45, 6.60, 3.25], sp: [24.34, 50.38], piano: 2.58, mag: 78.34 },
    { id: 'iphone-17', nome: 'iPhone 17', fonte: '2025-09-09', W: 71.45, L: 149.61, T: 7.95, a: A(0, 0.02, 0.48, 2.26, 5.56, 9.87, 14.53, 19.23),
      pf: [[1.69, 0], [2.27, 0], [2.85, 0.05], [3.39, 0.27], [3.78, 0.70], [3.93, 1.27]],
      sx: [act(34.08, 3.45), vol(48.23, 5.60), vol(62.43, 5.60)], dx: [side(55.32, 8.85), cc(98.20, 8.55)], w: 2.66, wcc: 3.03,
      cam: { r: [1.18, 1.34, 26.06, 43.62, 12.44], h: 1.78, v: 3.45, fori: [[30.41, 22.48, 6.28]] }, usb: [35.72, 12.45, 6.60, 3.25], sp: [19.71, 56.25], piano: 2.41 },
    { id: 'iphone-16-pro-max', nome: 'iPhone 16 Pro Max', fonte: '2024-09-19', W: 77.58, L: 163.03, T: 8.25, a: A16P,
      pf: [[1.84, 0], [2.86, 0.02], [3.76, 0.45], [4.10, 1.39], [4.12, 2.41]],
      sx: [act(34.08, 3.45), vol(48.23, 5.60), vol(62.43, 5.60)], dx: [side(55.33, 8.85), cc(111.62, 8.55)], w: 2.66, wcc: 3.03,
      cam: CAM16P, usb: [38.79, 12.45, 6.60, 3.25], sp: [20.11, 61.97], piano: 2.41 },
    { id: 'iphone-16-pro', nome: 'iPhone 16 Pro', fonte: '2024-09-19', W: 71.45, L: 149.81, T: 8.25, a: A16P,
      pf: [[1.84, 0], [2.86, 0.07], [3.76, 0.58], [4.10, 1.47], [4.12, 2.41]],
      sx: [act(34.08, 3.45), vol(48.23, 5.60), vol(62.43, 5.60)], dx: [side(55.33, 8.85), cc(98.19, 8.55)], w: 2.66, wcc: 3.03,
      cam: CAM16P, usb: [35.72, 12.45, 6.60, 3.25], sp: [18.70, 56.25], piano: 2.41 },
    { id: 'iphone-16-plus', nome: 'iPhone 16 Plus', fonte: '2024-09-19', W: 77.76, L: 160.89, T: 7.81, a: A16, pf: P16,
      sx: [act(34.08, 3.45), vol(48.23, 5.60), vol(62.43, 5.60)], dx: [side(55.33, 8.85), cc(109.48, 8.55)], w: 2.66, wcc: 3.03,
      cam: CAM16, usb: [38.88, 12.45, 6.60, 3.25], sp: [20.16, 62.11], piano: 2.41 },
    { id: 'iphone-16', nome: 'iPhone 16', fonte: '2024-09-19', W: 71.63, L: 147.64, T: 7.81, a: A16, pf: P16,
      sx: [act(34.08, 3.45), vol(48.23, 5.60), vol(62.43, 5.60)], dx: [side(55.33, 8.85), cc(96.23, 8.55)], w: 2.66, wcc: 3.03,
      cam: CAM16, usb: [35.81, 12.45, 6.60, 3.25], sp: [19.75, 56.39], piano: 2.41 },
    { id: 'iphone-16e', nome: 'iPhone 16e', fonte: '2025-03-17', W: 71.52, L: 146.71, T: 7.80, a: A14, pf: P14,
      sx: [act(31.28, 3.77), vol(45.43, 5.92), vol(59.63, 5.92)], dx: [side(52.53, 9.17)], w: 3.31,
      // niente rialzo: sporge solo l'anello della lente
      cam: { r: [5.84, 5.84, 20.81, 20.81, 7.49], h: 1.68, v: 1.68, fori: [[29.68, 13.32, 3.75], [24.30, 13.32, 1.30]] },
      usb: [35.76, 12.45, 6.60, 3.25], sp: [18.79, 57.24], piano: 1.15 },
    { id: 'iphone-15-pro-max', nome: 'iPhone 15 Pro Max', fonte: '2023-10-10', W: 76.73, L: 159.86, T: 8.25, a: A15P,
      pf: [[1.84, 0], [2.46, 0], [3.07, 0.06], [3.62, 0.32], [3.99, 0.81]],
      sx: [act(31.67, 3.02), vol(45.22, 5.60), vol(59.42, 5.60)], dx: [side(56.17, 8.85)], w: 2.66,
      cam: Object.assign({}, CAM16P, { v: 4.07 }), usb: [38.37, 12.45, 6.60, 3.25], sp: [20.40, 60.84], piano: 2.41 },
    { id: 'iphone-15-pro', nome: 'iPhone 15 Pro', fonte: '2023-10-10', W: 70.60, L: 146.61, T: 8.25, a: A15P,
      pf: [[1.84, 0], [2.46, 0], [3.07, 0.06], [3.62, 0.32], [3.99, 0.81]],
      sx: [act(31.67, 3.02), vol(45.22, 5.60), vol(59.42, 5.60)], dx: [side(56.17, 8.85)], w: 2.66,
      cam: Object.assign({}, CAM16P, { v: 3.78 }), usb: [35.30, 12.45, 6.60, 3.25], sp: [19.59, 55.52], piano: 2.41 },
    { id: 'iphone-15-plus', nome: 'iPhone 15 Plus', fonte: '2023-10-10', W: 77.76, L: 160.89, T: 7.81, a: A16, pf: P16,
      sx: [mute(31.94, 2.96), vol(45.39, 5.60), vol(59.59, 5.60)], dx: [side(52.49, 8.85)], w: 2.66,
      cam: { r: [1.22, 1.22, 37.15, 37.15, 11.5], h: 1.85, v: 3.48 }, usb: [38.88, 12.45, 6.60, 3.25], sp: [20.39, 61.87], piano: 2.41 },
    { id: 'iphone-15', nome: 'iPhone 15', fonte: '2023-10-10', W: 71.63, L: 147.64, T: 7.81, a: A16, pf: P16,
      sx: [mute(32.83, 2.96), vol(46.27, 5.60), vol(60.47, 5.60)], dx: [side(53.37, 8.85)], w: 2.66,
      cam: { r: [1.22, 1.22, 37.15, 37.15, 11.5], h: 1.85, v: 3.48 }, usb: [35.81, 12.45, 6.60, 3.25], sp: [19.59, 56.55], piano: 2.41 },
    { id: 'iphone-14-pro-max', nome: 'iPhone 14 Pro Max', fonte: '2022-09-21', W: 77.58, L: 160.71, T: 7.85,
      a: [[0, 15.55], [0.21, 10.98], [1.47, 6.60], [4.25, 3.01], [8.23, 0.81], [12.74, 0.06], [17.32, 0]],
      pf: [[2.73, 0], [3.16, 0.01], [3.57, 0.14], [3.81, 0.49], [3.85, 0.92]],
      sx: [mute(31.14, 2.96), vol(44.59, 5.90), vol(58.79, 5.90)], dx: [side(55.54, 9.15)], w: 3.26,
      cam: { r: [2.19, 2.19, 44.12, 45.61, 10], h: 1.85, v: 4.18 }, usb: [38.79, 13.65, 6.85, 3.40], lightning: true, sp: [19.91, 62.17], piano: 1.15 },
    { id: 'iphone-14-pro', nome: 'iPhone 14 Pro', fonte: '2022-09-21', W: 71.45, L: 147.46, T: 7.85, a: A(0, 0.08, 1.00, 3.61, 7.68, 12.45, 17.32),
      pf: [[2.73, 0], [3.16, 0], [3.57, 0.13], [3.81, 0.48], [3.85, 0.91]],
      sx: [mute(31.14, 2.96), vol(44.59, 5.90), vol(58.79, 5.90)], dx: [side(55.54, 9.15)], w: 3.26,
      cam: { r: [2.19, 2.19, 44.12, 45.61, 10], h: 1.85, v: 4.18 }, usb: [35.73, 12.59, 6.85, 3.34], lightning: true, sp: [19.11, 56.86], piano: 1.05 },
    { id: 'iphone-14-plus', nome: 'iPhone 14 Plus', fonte: '2022-09-21', W: 78.07, L: 160.84, T: 7.80,
      a: [[0, 15.96], [0.17, 11.32], [1.35, 6.85], [4.10, 3.14], [8.10, 0.85], [12.67, 0.07], [17.32, 0]], pf: P14,
      sx: [mute(31.98, 2.96), vol(45.43, 5.92), vol(59.63, 5.92)], dx: [side(52.53, 9.17)], w: 3.31,
      cam: { r: [1.28, 1.28, 36.57, 36.57, 11.5], h: 1.85, v: 3.42 }, usb: [39.04, 13.65, 6.85, 3.40], lightning: true, sp: [20.16, 62.42], piano: 1.15 },
    { id: 'iphone-14', nome: 'iPhone 14', fonte: '2022-09-21', W: 71.52, L: 146.71, T: 7.80, a: A14, pf: P14,
      sx: [mute(31.98, 2.96), vol(45.43, 5.92), vol(59.63, 5.92)], dx: [side(52.53, 9.17)], w: 3.31,
      cam: { r: [1.15, 1.15, 35.90, 35.90, 11.5], h: 1.85, v: 3.42 }, usb: [35.76, 12.59, 6.85, 3.45], lightning: true, sp: [19.14, 56.89], piano: 1.15 },
    { id: 'iphone-13-pro-max', nome: 'iPhone 13 Pro Max', fonte: '2021-09-28', W: 78.07, L: 160.84, T: 7.65, a: A(0, 0.08, 1.00, 3.61, 7.67, 12.44, 17.32), pf: P13,
      sx: [mute(32.22, 2.90), vol(45.53, 5.80), vol(59.53, 5.80)], dx: [side(52.53, 9.05)], w: 3.06,
      cam: { r: [1.15, 1.15, 42.39, 43.62, 12.5], h: 1.68, v: 3.60 }, usb: [39.04, 13.65, 6.85, 3.40], lightning: true, sp: [20.18, 62.42], piano: 1.15 },
    { id: 'iphone-13-pro', nome: 'iPhone 13 Pro', fonte: '2021-09-28', W: 71.52, L: 146.71, T: 7.65, a: A13, pf: P13,
      sx: [mute(32.22, 2.90), vol(45.53, 5.80), vol(59.53, 5.80)], dx: [side(52.53, 9.05)], w: 3.06,
      cam: { r: [1.15, 1.15, 42.39, 43.62, 12.5], h: 1.68, v: 3.60 }, usb: [35.76, 13.65, 6.85, 3.40], lightning: true, sp: [19.14, 56.89], piano: 1.15 },
    { id: 'iphone-13', nome: 'iPhone 13', fonte: '2021-09-28', W: 71.52, L: 146.70, T: 7.65, a: A13, pf: P13,
      sx: [mute(32.22, 2.90), vol(45.53, 5.82), vol(59.53, 5.82)], dx: [side(52.53, 9.07)], w: 3.11,
      cam: { r: [1.15, 1.15, 35.12, 35.12, 11], h: 1.50, v: 2.59 }, usb: [35.76, 13.65, 6.85, 3.40], lightning: true, sp: [19.14, 56.89], piano: 1.15 },
    { id: 'iphone-13-mini', nome: 'iPhone 13 mini', fonte: '2021-09-28', W: 64.21, L: 131.50, T: 7.65, a: A(0, 0.06, 0.82, 2.93, 6.25, 10.12, 14.09), pf: P13,
      sx: [mute(23.37, 2.85), vol(36.68, 5.82), vol(50.68, 5.82)], dx: [side(43.68, 9.07)], w: 3.11,
      // nel disegno le due altezze del rialzo hanno le etichette scambiate: il rialzo è il più basso
      cam: { r: [1.04, 1.04, 33.15, 33.15, 10], h: 1.48, v: 2.51 }, usb: [32.11, 13.65, 6.85, 3.40], lightning: true, sp: [17.74, 50.22], piano: 1.15 },
    { id: 'iphone-12-pro-max', nome: 'iPhone 12 Pro Max', fonte: '2020-10-16', W: 78.07, L: 160.84, T: 7.39, a: A(0, 0.14, 1.16, 3.81, 7.26, 11.54, 15.96), pf: P12,
      sx: [mute(33.34, 2.85), vol(46.65, 5.65), vol(60.65, 5.65)], dx: [side(53.65, 8.90)], w: 2.76,
      cam: { r: [1.70, 1.70, 40.17, 42.60, 12], h: 1.26, v: 2.79 }, usb: [39.04, 13.65, 6.85, 3.40], lightning: true, sp: [20.20, 62.38], piano: 1.15 },
    { id: 'iphone-12-pro', nome: 'iPhone 12 Pro', fonte: '2020-10-16', W: 71.52, L: 146.71, T: 7.39, a: A12, pf: P12,
      sx: [mute(25.99, 2.85), vol(39.31, 5.65), vol(53.31, 5.65)], dx: [side(46.31, 8.90)], w: 2.76,
      cam: { r: [2.12, 2.12, 35.46, 37.63, 10], h: 0.94, v: 1.72 }, usb: [35.76, 13.65, 6.85, 3.40], lightning: true, sp: [19.14, 56.85], piano: 1.15 },
    { id: 'iphone-12', nome: 'iPhone 12', fonte: '2020-10-16', W: 71.52, L: 146.71, T: 7.39, a: A12, pf: P12,
      sx: [mute(25.99, 2.85), vol(39.31, 5.65), vol(53.31, 5.65)], dx: [side(46.31, 8.90)], w: 2.76,
      cam: { r: [3.43, 3.43, 34.13, 36.27, 9.5], h: 0.73, v: 1.51 }, usb: [35.76, 13.65, 6.85, 3.40], lightning: true, sp: [19.18, 56.85], piano: 1.15 },
    { id: 'iphone-12-mini', nome: 'iPhone 12 mini', fonte: '2020-10-16', W: 64.21, L: 131.50, T: 7.39, a: A(0, 0.11, 0.84, 2.83, 5.92, 9.42, 13.03), pf: P12,
      sx: [mute(23.37, 2.85), vol(36.68, 5.65), vol(50.68, 5.65)], dx: [side(43.68, 8.90)], w: 2.76,
      cam: { r: [1.67, 1.67, 30.78, 33.98, 9.5], h: 0.73, v: 1.51 }, usb: [32.11, 13.65, 6.85, 3.40], lightning: true, sp: [17.78, 50.94], piano: 1.15 },
    // OnePlus Nord (2020, AC2003). 158,3 × 73,3 × 8,2 mm dalla scheda tecnica OnePlus. Contorno, fotocamera, flash e tasti misurati
    // in scala (10,28 px/mm, ±0,2 mm) sulla foto ufficiale del retro di oneplus.com/it/nord. Profilo dei bordi, finestra del flash
    // e aperture sul fondo ripresi da una cover già provata sul telefono (One_Plus_Nord_case_v13.stl: cavità 74,3 × 159,3 mm,
    // 0,5 mm di gioco per lato; isola della fotocamera e tasti coincidono con la foto entro 0,3 mm). Sporgenza della fotocamera: stima.
    // Schermo piatto, telaio in plastica, retro in vetro curvo ai lati. Tasti: volume a sinistra; Alert Slider e accensione a destra.
    { id: 'oneplus-nord', nome: 'OnePlus Nord', marca: 'OnePlus', W: 73.3, L: 158.3, T: 8.2,
      misure: 'scheda tecnica OnePlus; contorno, fotocamera e tasti in scala dalla foto ufficiale del retro (±0,2 mm), confrontati con una cover già provata, da cui vengono anche bordi, flash e fondo; sporgenza della fotocamera stimata',
      a: A(0, 0.06, 0.19, 0.44, 0.92, 1.50, 2.50, 3.60, 4.85, 6.30, 7.75, 9.20, 10.60),
      pf: [[2.65, 0], [3.15, 0.25], [3.65, 0.57], [3.95, 0.88], [4.10, 1.05]],                 // dalla cover di riferimento
      pr: [[1.85, 0], [2.25, 0.09], [2.55, 0.21], [2.85, 0.34], [3.05, 0.49], [3.35, 0.72], [3.65, 1.10], [3.85, 1.46], [4.05, 2.12], [4.10, 2.30]],   // vetro curvo sul retro
      sx: [vol(54.82, 9.54)], dx: [mute(44.45, 4.33), side(65.57, 5.79)], w: 2.6,               // mute = Alert Slider (sempre aperto)
      // isola verticale a pillola con 4 lenti; flash doppio fuori dall'isola, a destra guardando il retro. Sporgenza: stima
      cam: { r: [7.44, 6.25, 19.49, 47.61, 6.0], h: 1.2, v: 1.2, fori: [[22.80, 12.40, 6.2]] },   // flash: foto (y 10,3–15,4) e cover di riferimento (y 7,5–16,2)
      usb: [36.65, 12.45, 6.60, 3.25], sp: [25.6, 64.6], cima: [[42.8, 3.1]], piano: 1.0 },   // fondo come la cover di riferimento: microfono e USB, altoparlante
  ];
  // lenti, flash, microfono e sensore sul retro [x, y, Ø] (quote del disegno del retro): i fori della copertura della fotocamera
  const L16 = [[13.62, 13.62, 16.00], [13.62, 31.34, 16.00], [30.01, 22.48, 6.28], [20.54, 22.48, 1.00]];
  const L16P = [[14.17, 14.17, 16.20], [14.17, 33.41, 16.20], [32.16, 23.79, 16.20], [32.16, 10.22, 6.92], [38.00, 34.14, 0.75]];
  const L14P = [[14.28, 14.28, 15.61], [14.28, 33.52, 15.61], [32.12, 23.90, 15.61], [32.12, 10.32, 6.90], [37.91, 33.98, 1.15]];
  const L13P = [[13.43, 13.43, 15.53], [13.43, 31.35, 15.53], [30.08, 22.39, 15.80], [30.08, 9.42, 6.28], [35.78, 32.21, 1.15]];
  const L17P = (x) => [[14.37, 14.37, 16.20], [14.37, 33.61, 16.20], [32.36, 23.99, 16.20], [x, 13.82, 6.80], [x, 23.99, 1.15], [x, 34.16, 6.65]];
  const LENTI = {
    'iphone-17-pro-max': L17P(64.16), 'iphone-17-pro': L17P(58.03),
    'iphone-air': [[16.29, 16.29, 15.82], [51.34, 16.29, 2.30], [58.42, 16.29, 6.30]],
    'iphone-17': [[13.62, 13.62, 16.00], [13.62, 31.34, 16.00], [30.41, 22.48, 6.28], [20.54, 22.48, 1.00]],
    'iphone-16-pro-max': L16P, 'iphone-16-pro': L16P, 'iphone-16-plus': L16, 'iphone-16': L16,
    'iphone-16e': [[13.32, 13.32, 14.97], [24.30, 13.32, 1.30], [29.68, 13.32, 3.75]],
    'iphone-15-pro-max': L16P.map((q, i) => (i === 3 ? [32.16, 10.22, 6.90] : i === 4 ? [37.95, 33.86, 0.75] : q)),
    'iphone-15-pro': L16P.map((q, i) => (i === 4 ? [37.95, 33.86, 0.75] : q)),
    'iphone-15-plus': [[12.73, 12.73, 15.07], [25.64, 25.64, 15.07], [27.32, 11.06, 6.28], [11.47, 26.90, 2.10]],
    'iphone-15': [[12.73, 12.73, 15.07], [25.64, 25.64, 15.07], [27.32, 11.06, 6.28], [11.47, 26.90, 2.10]],
    'iphone-14-pro-max': L14P, 'iphone-14-pro': L14P,
    'iphone-14-plus': [[12.55, 12.55, 14.38], [25.30, 25.30, 14.38], [26.97, 10.87, 6.28], [11.29, 26.56, 2.10]],
    'iphone-14': [[11.88, 11.88, 14.38], [24.63, 24.63, 14.38], [26.30, 10.21, 6.28], [10.62, 25.89, 2.10]],
    'iphone-13-pro-max': L13P, 'iphone-13-pro': L13P,
    'iphone-13': [[11.88, 11.88, 13.69], [24.24, 24.24, 13.69], [26.11, 10.01, 6.28], [10.43, 25.69, 2.40]],
    'iphone-13-mini': [[10.85, 10.85, 13.69], [23.21, 23.21, 13.69], [24.9, 8.98, 6.28], [9.40, 24.66, 2.40]],   // flash: x in scala
    'iphone-12-pro-max': [[13.43, 13.43, 14.11], [13.43, 30.90, 14.11], [28.56, 22.16, 14.11], [28.56, 10.11, 6.28], [33.69, 30.89, 1.15]],
    'iphone-12-pro': [[12.16, 12.16, 12.45], [12.16, 27.58, 12.45], [25.51, 19.87, 12.45], [25.51, 9.17, 6.28], [30.23, 27.38, 1.15]],
    'iphone-12': [[12.73, 12.73, 12.10], [12.73, 27.01, 12.10], [25.28, 12.28, 2.40], [25.28, 19.87, 5.66]],
    'iphone-12-mini': [[10.67, 10.67, 12.10], [10.67, 24.95, 12.10], [22.21, 10.22, 2.40], [22.21, 17.81, 5.66]],
  };
  for (const t of T) if (LENTI[t.id]) t.lenti = LENTI[t.id];
  root.SP_TELEFONI = T;
})(typeof globalThis !== 'undefined' ? globalThis : this);

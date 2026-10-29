(function () {
  'use strict';
  // ================= PARAMETRI =================
  const common = [
    { sec: 'Incastri e magneti', id: 'tolleranza', label: 'Tolleranza stampante', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', help: 'Gioco sugli incastri (cassetti, fori magnete). Aumentala se i pezzi entrano troppo stretti.' },
    { sec: 'Incastri e magneti', id: 'magneti', label: 'Fori per magneti', type: 'bool', def: false },
    { sec: 'Incastri e magneti', id: 'magDiam', label: 'Diametro magnete', type: 'num', min: 3, max: 10, step: 0.5, def: 6, unit: 'mm', show: p => p.magneti },
    { sec: 'Incastri e magneti', id: 'magAlt', label: 'Altezza magnete', type: 'num', min: 1, max: 5, step: 0.1, def: 2, unit: 'mm', show: p => p.magneti },
    { sec: 'Incastri e magneti', id: 'viti', label: 'Fori per viti M3', type: 'bool', def: false },
  ];
  const grid = (defX, defY, defU, withU = true) => [
    { sec: 'Dimensioni', id: 'gridX', label: 'Larghezza', type: 'int', min: 1, max: 10, def: defX, unit: '× 42 mm' },
    { sec: 'Dimensioni', id: 'gridY', label: 'Profondità', type: 'int', min: 1, max: 10, def: defY, unit: '× 42 mm' },
    ...(withU ? [{ sec: 'Dimensioni', id: 'altU', label: 'Altezza', type: 'int', min: 2, max: 30, def: defU, unit: '× 7 mm' }] : []),
  ];

  // ---- viteria ----
  const SIZES = ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16', 'M20', 'M24', 'M30'];
  const threadP = (defL) => [
    { sec: 'Misura', id: 'misura', label: 'Filetto metrico', type: 'select', def: 'M8', options: [...SIZES.map(s => [s, s]), ['custom', 'Altro']], help: 'Passo grosso ISO. Con "Altro" scegli diametro e passo.', onSet: (k, v) => headFill(k, v) },
    { sec: 'Misura', id: 'diam', label: 'Diametro', type: 'num', min: 3, max: 60, step: 0.5, def: 8, unit: 'mm', show: p => p.misura === 'custom' },
    { sec: 'Misura', id: 'passo', label: 'Passo', type: 'num', min: 0.35, max: 6, step: 0.05, def: 1.25, unit: 'mm', show: p => p.misura === 'custom', help: 'Distanza tra due creste del filetto.' },
    { sec: 'Misura', id: 'lunghezza', label: 'Lunghezza', type: 'num', min: 4, max: 300, step: 1, def: defL, unit: 'mm', help: 'Misurata sotto la testa, come per le viti vere. Per la svasata comprende la testa.' },
    { sec: 'Misura', id: 'filettata', label: 'Lunghezza filettata', type: 'num', min: 0, max: 300, step: 1, def: 0, unit: 'mm', help: '0 = filettata tutta. Il resto del gambo resta liscio.' },
  ];
  // a "Su misura" acceso (o cambiando testa/filetto) i campi ripartono dalle misure standard
  const headFill = (_, v) => (v.testaSu && G && v.testa !== 'nessuna') ? (({ w, h }) => ({ testaL: +w.toFixed(1), testaH: +h.toFixed(1) }))(G.headStd(v, v.testa)) : null;
  const headP = (opts, def) => [
    { sec: 'Testa', id: 'testa', label: 'Testa', type: 'select', def, options: opts, onSet: headFill },
    { sec: 'Testa', id: 'testaSu', label: 'Misure testa su misura', type: 'bool', def: false, show: p => p.testa !== 'nessuna', onSet: headFill, help: 'Spento = misure standard ISO. Acceso parti da quelle e le cambi.' },
    { sec: 'Testa', id: 'testaL', label: 'Larghezza testa', type: 'num', min: 3, max: 120, step: 0.5, def: 13, unit: 'mm', show: p => p.testaSu && p.testa !== 'nessuna', help: 'Esagonale: misura della chiave. Le altre: diametro.' },
    { sec: 'Testa', id: 'testaH', label: 'Altezza testa', type: 'num', min: 1, max: 60, step: 0.5, def: 5.5, unit: 'mm', show: p => p.testaSu && !['nessuna', 'svasata'].includes(p.testa), },
    { sec: 'Testa', id: 'impronta', label: 'Impronta', type: 'select', def: 'brugola', options: [['brugola', 'Esagono incassato'], ['taglio', 'Taglio'], ['nessuna', 'Nessuna']], show: p => ['cilindrica', 'svasata', 'nessuna'].includes(p.testa) },
  ];
  const HEAD_OPTS = [['esagonale', 'Esagonale'], ['cilindrica', 'Cilindrica'], ['svasata', 'Svasata'], ['zigrinata', 'Zigrinata a mano']];
  const threadTail = (printOpts) => [
    { sec: 'Filetto', id: 'gioco', label: 'Gioco filetto', type: 'num', min: 0, max: 0.8, step: 0.05, def: 0.3, unit: 'mm', help: 'Spazio tra i fianchi di vite e dado. Se il dado è duro aumentalo, se balla riducilo.' },
    { sec: 'Filetto', id: 'sinistro', label: 'Filetto sinistro', type: 'bool', def: false, help: 'Si avvita in senso antiorario.' },
    { sec: 'Stampa', id: 'stampa', label: 'Orientamento vite', type: 'select', def: 'piedi', options: printOpts, help: 'In piedi il filetto viene più preciso. Sdraiata (con un lato piatto) la vite è molto più resistente a trazione e flessione.' },
  ];
  const SCREW_PRINT = [['piedi', 'In piedi'], ['sdraiata', 'Sdraiata']];

  // ---- Natale ----
  const PALETTES = {
    rossoro: { col1: '#b3202a', col2: '#e3b341', col3: '#ffffff', col4: '#1f6b3a' },
    verde: { col1: '#1f6b3a', col2: '#c62828', col3: '#ffffff', col4: '#e3b341' },
    bianco: { col1: '#f4f4f2', col2: '#b8bcc2', col3: '#c62828', col4: '#1f6b3a' },
    blu: { col1: '#1d4e89', col2: '#c9ced6', col3: '#ffffff', col4: '#e3b341' },
    legno: { col1: '#c8a36a', col2: '#7a4a24', col3: '#2b2b2b', col4: '#ffffff' },
    sport: { col1: '#d4e33b', col2: '#1b1b1b', col3: '#ffffff', col4: '#1d4e89' },
  };
  // disegni: Fluent Emoji (libreria) e SVG caricati dall'utente
  const EMOJI = window.SPLAB_EMOJI || [], EMO_BY = Object.fromEntries(EMOJI.map(e => [e.id, e]));
  const isArtId = (k) => k === 'svg' || !!EMO_BY[k];
  // i 4 colori del disegno scelto (per l'abbinamento "Colori del disegno")
  const artPal = (v, key = 'forma') => {
    const k = v[key];
    const pal = k === 'svg' ? (v.svg && v.svg.pal) : EMO_BY[k] && EMO_BY[k].pal;
    if (!pal || !pal.length) return null;
    // sui coperchi e sulle cover un disegno di un solo colore non cambia i colori scelti: va comunque su un colore diverso dal pezzo (vedi artSlots)
    if (key === 'disegno' && pal.length === 1) return {};
    // con più colori vanno sui colori 2–4: il colore 1 resta quello del pezzo (sennò il colore principale del disegno diventa il pezzo e sparisce)
    if (key === 'disegno') { const o2 = {}; pal.slice(0, 3).forEach((c, i) => { o2['col' + (i + 2)] = c; }); return o2; }
    const out = {}; pal.slice(0, 4).forEach((c, i) => { out['col' + (i + 1)] = c; });
    return out;
  };
  // sport = true: c'è anche (ed è il predefinito) l'abbinamento giallo pallina e nero
  const colorsP = (labels, art, sport) => [
    { sec: 'Colori', id: 'tavolozza', label: 'Abbinamenti pronti', type: 'select', def: art ? 'disegno' : sport ? 'sport' : 'rossoro',
      options: [...(art ? [['disegno', 'Colori del disegno']] : []), ...(sport ? [['sport', 'Giallo pallina e nero']] : []), ['rossoro', 'Rosso e oro'], ['verde', 'Verde e rosso'], ['bianco', 'Bianco e argento'], ['blu', 'Blu e argento'], ['legno', 'Legno']],
      onSet: (k, v) => (k === 'disegno' ? artPal(v, art) : PALETTES[k]),
      help: art ? 'Al massimo 4 filamenti: il colore 1 è il pezzo. Ogni colore del disegno va sul filamento più simile; quelli uguali al colore 1 restano del colore del pezzo. "Colori del disegno" riduce i colori originali a 4.'
        : 'Nel 3MF ogni colore è una parte separata dello stesso oggetto: nello slicer dai un filamento a ciascuna.' },
    ...labels.map((l, i) => ({ sec: 'Colori', id: 'col' + (i + 1), label: l, type: 'color', def: PALETTES[sport ? 'sport' : 'rossoro']['col' + (i + 1)] })),
  ];
  // spessori allineati agli strati: multipli di 0,2 e di 0,28 (primo strato a 0,28)
  const LAYER_STOPS = (() => { const v = new Set(); for (const h of [0.2, 0.28]) for (let k = 1; k * h <= 12.01; k++) v.add(+(k * h).toFixed(2)); return [...v].sort((a, b) => a - b); })();
  const layerP = (o) => Object.assign({ type: 'num', stops: LAYER_STOPS.filter(x => x >= o.min - 1e-6 && x <= o.max + 1e-6), step: 0.01, unit: 'mm' }, o);
  // loghi dentro le scritte: {viso} e {visoNatale}; il logo SP è il marchio a parte (markP). L'ugello decide quanto si ingrossano
  // le linee quando il logo è piccolo, e la misura del marchio
  const hasLogo = (p) => !!p.marchio || ['scritta', 'scritta2', 'scritta3', 'scritta4', 'testo1', 'testo2', 'testo3', 'testo4'].some(k => /\{(visonatale|viso)\}/i.test(String(p[k] || '')));
  const nozzleP = (sec, show) => ({ sec, id: 'ugello', label: 'Ugello', type: 'select', def: '0.4', options: [['0.2', '0,2'], ['0.4', '0,4'], ['0.6', '0,6'], ['0.8', '0,8']], unit: 'mm',
    show: p => (!show || show(p)) && (hasLogo(p) || isArtId(p.forma) || (p.figura && p.figura !== 'nessuna')), help: 'Diametro dell\'ugello della stampante. Se il logo è piccolo le sue linee vengono ingrossate fino a questa larghezza, così si stampano.' });
  const FONT_OPTS = [['tondo', 'Tondo'], ['corsivo', 'Corsivo'], ['natalizio', 'Natalizio']];
  // due righe di scritta, ognuna con la sua altezza e la sua posizione (frecce per spostarla, il centro la rimette al centro)
  const linesP = (sec, d1, d2, cap, show, max = 40, help = 'Altezza delle maiuscole (i loghi sono alti 1,35 volte). Se la scritta non ci sta viene ridotta da sola.') => {
    const on = (p) => !show || show(p), has = (k) => (p) => on(p) && String(p[k] || '').trim() !== '';
    return [
      { sec, id: 'scritta', label: 'Riga 1', type: 'text', def: d1, placeholder: 'es. un nome', show, logos: true },
      { sec, id: 'altTesto', label: 'Altezza riga 1', type: 'num', min: 3, max, step: 0.5, def: cap, unit: 'mm', help, show },
      { sec, id: 'pos1', label: 'Posizione riga 1', type: 'pad', def: [0, 0], show: has('scritta') },
      { sec, id: 'scritta2', label: 'Riga 2', type: 'text', def: d2, placeholder: 'facoltativa', show, logos: true },
      { sec, id: 'altTesto2', label: 'Altezza riga 2', type: 'num', min: 3, max, step: 0.5, def: cap, unit: 'mm', show: has('scritta2') },
      { sec, id: 'pos2', label: 'Posizione riga 2', type: 'pad', def: [0, 0], show: has('scritta2') },
    ];
  };
  // righe con la loro rotazione (coperchio del Powerbank): "Rotazione riga N" subito dopo "Posizione riga N"
  const withRot = (list) => list.flatMap(q => (q.id === 'pos1' || q.id === 'pos2') ? [q, { sec: q.sec, id: q.id === 'pos1' ? 'rotTesto' : 'rotTesto2', label: q.id === 'pos1' ? 'Rotazione riga 1' : 'Rotazione riga 2', type: 'int', min: 0, max: 345, step: 15, def: 0, unit: '°', wrap: true, show: q.show,
    help: q.id === 'pos1' ? 'Gira la riga attorno al suo centro, 15° a clic. Le frecce la spostano sempre a destra/sinistra e su/giù del coperchio.' : undefined }] : [q]);
  // una sola riga di scritta (antivibrazione): stili tra rilievo, a filo colorata e incisa
  const oneTextP = (d, cap, styles) => [
    ...linesP('Scritta', d, '', cap, undefined, 20).filter(q => !['scritta2', 'altTesto2', 'pos2'].includes(q.id))
      .map(q => Object.assign({}, q, { label: { scritta: 'Scritta', altTesto: 'Altezza lettere', pos1: 'Posizione' }[q.id] })),
    { sec: 'Scritta', id: 'carattere', label: 'Carattere', type: 'select', def: 'tondo', options: FONT_OPTS },
    nozzleP('Scritta'),
    { sec: 'Scritta', id: 'stileTesto', label: 'Stile', type: 'select', def: styles[0][0], options: styles, show: p => String(p.scritta || '').trim() !== '',
      help: 'A filo: le lettere sono di un altro colore ma non sporgono, non si consumano e non si staccano.' },
    { sec: 'Scritta', id: 'rilievoTesto', label: 'Spessore scritta', type: 'num', min: 0.4, max: 1.2, step: 0.2, def: 0.6, unit: 'mm', show: p => String(p.scritta || '').trim() !== '' || (isArtId(p.forma) && p.coloriDisegno !== false), help: 'In rilievo: quanto sporge. A filo o incisa: quanto è profonda. Vale anche per i colori del disegno.' },
  ];
  // marchio SP: piccolo, alla misura che l'ugello stampa pulita con margine; stesso stile e colore della scritta.
  // corner: pezzi con una faccia piatta, dove si sceglie l'angolo in basso; negli altri sta dietro, in basso
  const markP = (corner, show, extra = []) => {
    const on = (p) => (!show || show(p)) && p.marchio;
    return [
      { sec: 'Logo SP', id: 'marchio', label: 'Aggiungi logo SP', type: 'bool', def: false, show,
        help: `Il marchio SP piccolo ${corner ? 'nell\'angolo in basso' : 'dietro'}, alla misura che l'ugello stampa pulita con margine (linee larghe 3 volte l'ugello: con 0,4 circa 9 × 6 mm), solo su una superficie piatta. Stesso stile e colore della scritta.` },
      ...extra.map(q => Object.assign({ sec: 'Logo SP' }, q, { show: (p) => on(p) && (!q.show || q.show(p)) })),
      { sec: 'Logo SP', id: 'colMarchio', label: 'Colore', type: 'select', def: 'scritta', options: [['scritta', 'Come la scritta'], ['2', '2'], ['3', '3'], ['4', '4']], show: on,
        help: 'Il filamento del logo (vale a filo e in rilievo; inciso o traforato non ha colore). Il colore 1 è il pezzo: lì il logo non si vedrebbe.' },
      ...(corner ? [{ sec: 'Logo SP', id: 'latoMarchio', label: 'Angolo', type: 'select', def: 'dx', options: [['dx', 'In basso a destra'], ['sx', 'In basso a sinistra']], show: on }] : []),
      { sec: 'Logo SP', id: 'posMarchio', label: 'Posizione', type: 'pad', def: [0, 0], show: on,
        text: (v) => { const [x, y] = v.posMarchio || [0, 0], f = (n) => String(+Math.abs(n).toFixed(1)).replace('.', ','), t = [];
          if (Math.abs(x) > 0.01) t.push(`${x > 0 ? 'destra' : 'sinistra'} ${f(x)}`); if (Math.abs(y) > 0.01) t.push(`${y > 0 ? 'su' : 'giù'} ${f(y)}`);
          return t.length ? t.join(' · ') + ' mm' : (corner ? 'nell\'angolo' : 'al suo posto'); } },
    ];
  };
  // colori che il pezzo non ha (fino al 4) ma che servono al logo SP se glieli dai: compaiono solo allora
  const markColorsP = (have) => [3, 4].filter(k => k > have).map(k => ({ sec: 'Colori', id: 'col' + k, label: `Colore ${k} · logo SP`, type: 'color', def: PALETTES.rossoro['col' + k], show: p => p.marchio && p.colMarchio === String(k) }));
  const textP = (d1, d2, font, cap, show) => [
    ...linesP('Scritta', d1, d2, cap, show),
    { sec: 'Scritta', id: 'carattere', label: 'Carattere', type: 'select', def: font, options: FONT_OPTS, show },
    nozzleP('Scritta', show),
    { sec: 'Scritta', id: 'rilievoTesto', label: 'Rilievo scritta', type: 'num', min: 0.4, max: 4, step: 0.2, def: 1.4, unit: 'mm', show: p => (!show || show(p)) && (p.stile === undefined || p.stile === 'rilievo') && p.stileTesto !== 'traforata' },
  ];
  // pallina: fino a quattro scritte, ognuna con testo, lato, altezza e dimensione
  const ballTextP = (defs) => defs.flatMap(([txt, lato, quota, cap], k) => {
    const i = k + 1, sec = `Scritta ${i}`, has = (p) => String(p[i === 1 ? 'scritta' : 'scritta' + i] || '').trim() !== '';
    return [
      { sec, id: i === 1 ? 'scritta' : 'scritta' + i, label: 'Testo', type: 'text', def: txt, placeholder: i === 1 ? 'es. un nome' : 'facoltativa', logos: true },
      { sec, id: 'lato' + i, label: 'Lato', type: 'int', min: 0, max: 345, step: 15, def: lato, unit: '°', show: has, wrap: true, help: i === 1 ? '0° davanti, 90° a destra, 180° dietro, 270° a sinistra.' : undefined },
      { sec, id: 'quota' + i, label: 'Altezza', type: 'int', min: -85, max: 85, step: 5, def: quota, unit: '%', show: has, help: i === 1 ? '0 = a metà pallina, valori positivi verso l\'alto, negativi verso il basso.' : undefined },
      { sec, id: i === 1 ? 'altTesto' : 'altTesto' + i, label: 'Altezza lettere', type: 'num', min: 3, max: 40, step: 0.5, def: cap, unit: 'mm', show: has },
      // sulla sfera le frecce girano la scritta (15° a clic) e la alzano o abbassano (5% a clic); il centro la porta a metà altezza
      { sec, id: 'pos' + i, label: 'Posizione', type: 'pad', def: [0, 0], show: has,
        move: (v, dx, dy) => ({ ['lato' + i]: (((Math.round(v['lato' + i] / 15) + dx) * 15) % 360 + 360) % 360, ['quota' + i]: Math.max(-85, Math.min(85, Math.round(v['quota' + i] / 5) * 5 + 5 * dy)) }),
        center: () => ({ ['quota' + i]: 0 }), text: (v) => `lato ${v['lato' + i]}° · altezza ${v['quota' + i]}%` },
    ];
  });
  // motivi delle decorazioni piatte, divisi per gruppo nel menu
  const SHAPE_OPTS = [
    ['nome', 'Solo il nome', 'Con il nome'], ['medaglione', 'Medaglione', 'Con il nome'], ['targhetta', 'Targhetta', 'Con il nome'],
    ...EMOJI.map(e => [e.id, e.it, e.g]),
    ['stella', 'Stella a punte', 'Forme'], ['cuore', 'Cuore semplice', 'Forme'],
    ['svg', 'Il tuo SVG (caricalo qui sopra)', 'Il tuo disegno'],
  ];
  // forme degli antivibrazione: geometriche, i disegni (prima quelli sportivi) e il tuo SVG
  const DAMP_OPTS = [
    ...[['tondo', 'Tondo'], ['ovale', 'Ovale'], ['esagono', 'Esagono'], ['ottagono', 'Ottagono'], ['quadrato', 'Quadrato'], ['scudo', 'Scudo'],
      ['goccia', 'Goccia'], ['stella', 'Stella'], ['cuore', 'Cuore'], ['fiore', 'Fiore']].map(([k, l]) => [k, l, 'Forme']),
    ...EMOJI.filter(e => e.g === 'Sport').map(e => [e.id, e.it, e.g]),
    ...EMOJI.filter(e => e.g !== 'Sport').map(e => [e.id, e.it, e.g]),
    ['svg', 'Il tuo SVG (caricalo qui sopra)', 'Il tuo disegno'],
  ];
  const dampShapeP = (label, show) => [
    { sec: 'Modello', id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'forma', use: { forma: 'svg' }, unuse: { forma: 'tondo' }, using: p => p.forma === 'svg', show },
    { sec: 'Modello', id: 'forma', label, type: 'select', menu: true, def: 'tondo', options: DAMP_OPTS, show,
      help: 'Forme semplici, i disegni Fluent Emoji (licenza MIT) o il tuo SVG: la sagoma del disegno diventa la forma. Se la forma non copre bene le corde viene allargata.' },
    { sec: 'Modello', id: 'coloriDisegno', label: 'Colori del disegno sulla faccia', type: 'bool', def: true, show: p => (!show || show(p)) && isArtId(p.forma),
      help: 'I colori del disegno a filo sulla faccia, sui filamenti 2–4 più simili. Spento resta solo la sagoma.' },
  ];
  // colori degli antivibrazione: il 3 e il 4 servono solo ai colori del disegno
  const dampColorsP = (show) => colorsP(['Colore 1 · antivibrazione', 'Colore 2 · scritta', 'Colore 3 · disegno', 'Colore 4 · disegno'], false, true)
    .map(q => (q.id === 'col3' || q.id === 'col4' ? Object.assign(q, { show: p => (show(p) && isArtId(p.forma) && p.coloriDisegno !== false) || (p.marchio && p.colMarchio === q.id.slice(3)) }) : q));
  // disegni della palla piatta
  const PALLA_OPTS = [
    ['fiocchi', 'Fiocchi di neve', 'Sfondi'], ['stelle', 'Stelle', 'Sfondi'], ['cuori', 'Cuori', 'Sfondi'], ['pois', 'Pois', 'Sfondi'],
    ['righe', 'Righe a bastoncino', 'Sfondi'], ['spicchi', 'Spicchi', 'Sfondi'], ['onde', 'Onde', 'Sfondi'], ['zigzag', 'Zig-zag', 'Sfondi'], ['nordico', 'Maglione nordico', 'Sfondi'],
    ['ghirlanda', 'Ghirlanda sul bordo', 'Natura'],
    ['cielo', 'Cielo stellato con luna', 'Scene'], ['bosco', 'Bosco innevato', 'Scene'], ['paese', 'Paesino con casette', 'Scene'], ['slitta', 'Luna con la slitta', 'Scene'], ['regali', 'Regali', 'Scene'],
    ['nessuno', 'Nessuno sfondo', 'Nessuno'],
  ];
  // figura grande sopra il nome nella palla piatta: i disegni Fluent e il proprio SVG
  const FIG_OPTS = [['nessuna', 'Nessuna figura', 'Nessuna'], ...EMOJI.map(e => [e.id, e.it, e.g]), ['svg', 'Il tuo SVG (caricalo qui sopra)', 'Il tuo disegno']];
  // stile e spessore di un gruppo di disegni (sfondo, figura…)
  const STYLE_OPTS = [['uguale', 'Come la scritta'], ['rilievo', 'In rilievo'], ['filo', 'A filo'], ['inciso', 'Inciso'], ['traforata', 'Traforato']];
  const decoStyleP = (sec, idS, idH, show) => [
    { sec, id: idS, label: 'Stile', type: 'select', def: 'uguale', options: STYLE_OPTS, show,
      help: 'Inciso: scavato nella superficie. Traforato: buchi passanti, con una cornice lungo il bordo e ponticelli dove servono.' },
    layerP({ sec, id: idH, label: 'Spessore', min: 0.2, max: 8, def: 0.8, show,
      help: 'In rilievo: quanto sporge. A filo e inciso: quanto entra nel pezzo (a filo, se è pari allo spessore della palla, passa da parte a parte).' }),
  ];
  const shapeP = (sec, defH) => [
    { sec, id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'forma', use: { forma: 'svg' }, unuse: { forma: 'christmas-tree' }, using: p => p.forma === 'svg' },
    { sec, id: 'forma', label: 'Motivo', type: 'select', menu: true, def: 'christmas-tree', options: SHAPE_OPTS, onSet: (k, v) => (v.tavolozza === 'disegno' && v.col1 !== undefined ? artPal(Object.assign({}, v, { forma: k })) : null),
      help: 'Disegni Fluent Emoji di Microsoft (licenza MIT). Con "Solo il nome" la decorazione è la scritta stessa. Il tuo disegno SVG si carica nel riquadro qui sopra.' },
    { sec, id: 'punte', label: 'Punte', type: 'int', min: 4, max: 12, def: 5, show: p => p.forma === 'stella' },
    { sec, id: 'altezza', label: 'Altezza', type: 'num', min: 25, max: 250, step: 1, def: defH, unit: 'mm', show: p => p.forma !== 'nome' },
    { sec, id: 'contorno', label: 'Contorno', type: 'num', min: 0, max: 8, step: 0.2, def: 1.6, unit: 'mm', show: p => isArtId(p.forma),
      help: 'Margine attorno alla sagoma del disegno: tiene unite le parti vicine e rende il bordo più robusto.' },
  ];
  // pallina a spirale: un lato per ogni scritta o simbolo
  const SPIR_SYM = [['stella', 'Stella'], ['cuore', 'Cuore'], ['fiocco', 'Fiocco di neve'], ['albero', 'Albero'], ['campana', 'Campana'], ['luna', 'Luna'],
    ['pupazzo', 'Pupazzo di neve'], ['regalo', 'Regalo'], ['cometa', 'Stella cometa'], ['candela', 'Candela'], ['renna', 'Renna']];
  const spirSideP = (defs) => defs.flatMap(([sec, kind, txt, sym], k) => {
    const i = k + 1, on = (p) => p.fascia !== 'nessuna';
    return [
      { sec, id: 'lato' + i, label: 'Cosa mettere', type: 'select', def: kind, options: [['nessuno', 'Niente'], ['scritta', 'Scritta'], ['simbolo', 'Simbolo']], show: on },
      { sec, id: 'testo' + i, label: 'Testo', type: 'text', def: txt, placeholder: 'es. un nome', logos: true, show: p => on(p) && p['lato' + i] === 'scritta' },
      { sec, id: i === 1 ? 'altTesto' : 'altTesto' + i, label: 'Altezza lettere', type: 'num', min: 4, max: 30, step: 0.5, def: 10, unit: 'mm', show: p => on(p) && p['lato' + i] === 'scritta',
        help: i === 1 ? 'Se non ci stanno nella fascia vengono ridotte da sole.' : undefined },
      { sec, id: 'pos' + i, label: 'Posizione', type: 'pad', def: [0, 0], show: p => on(p) && p['lato' + i] === 'scritta', help: i === 1 ? 'In su e in giù solo finché resta nella fascia liscia.' : undefined },
      { sec, id: 'simbolo' + i, label: 'Simbolo', type: 'select', def: sym, options: SPIR_SYM, show: p => on(p) && p['lato' + i] === 'simbolo' },
    ];
  });
  // cover: i telefoni del database (src/telefoni.js), raggruppati per serie, più le misure scritte a mano
  const PHONES = window.SP_TELEFONI || [];
  const serie = (t) => (/Air/.test(t.nome) ? '17' : (t.nome.match(/iPhone (\d+)/) || [0, ''])[1]);
  const gruppo = (t) => (t.marca ? t.marca : serie(t) === '17' ? 'iPhone 17 e Air' : 'iPhone ' + serie(t));
  const PHONE_OPTS = [...PHONES.map(t => [t.id, t.nome, gruppo(t)]), ['misure', 'Misure mie', 'Altro']];
  const mine = (p) => p.modello === 'misure';
  const PHONE_FIELDS = [
    { id: 'larghezza', label: 'Larghezza', min: 40, max: 120, def: 71.63 },
    { id: 'altezza', label: 'Altezza', min: 90, max: 220, def: 147.64 },
    { id: 'spessore', label: 'Spessore', min: 4, max: 15, def: 7.81 },
    { id: 'raggioAngoli', label: 'Raggio angoli', min: 1, max: 30, def: 12.85, help: 'Gli angoli del telefono visto di fronte.' },
    { id: 'raggioBordo', label: 'Raggio bordo', min: 0.2, max: 6, def: 1.22, help: 'Quanto è arrotondato il bordo tra fianco e schermo.' },
    { id: 'tastiSx', label: 'Tasti a sinistra', type: 'text', def: '34.08/6.9, 48.23/11.2, 62.43/11.2', placeholder: 'centro/lunghezza, …', unit: undefined, help: 'Guardando lo schermo: distanza del centro di ogni tasto dalla cima e sua lunghezza, separati da virgole.' },
    { id: 'tastiDx', label: 'Tasti a destra', type: 'text', def: '55.33/17.7, 96.23/17.1', placeholder: 'centro/lunghezza, …', unit: undefined },
    { id: 'tastiA', label: 'Altezza tasti', min: 1, max: 6, def: 2.66 },
    { id: 'camX', label: 'Fotocamera: dal bordo', min: 0, max: 80, def: 1.09, help: 'Guardando il retro, con la fotocamera in alto a sinistra: distanza dal bordo sinistro.' },
    { id: 'camY', label: 'Fotocamera: dalla cima', min: 0, max: 80, def: 1.25 },
    { id: 'camL', label: 'Fotocamera: larghezza', min: 5, max: 90, def: 32.06 },
    { id: 'camA', label: 'Fotocamera: altezza', min: 5, max: 90, def: 42.47 },
    { id: 'camR', label: 'Fotocamera: raggio', min: 0, max: 30, def: 12.53 },
    { id: 'camH', label: 'Sporgenza del rialzo', min: 0, max: 6, def: 1.85 },
    { id: 'camV', label: 'Sporgenza delle lenti', min: 0, max: 8, def: 3.48, help: 'Dal retro del telefono al vetro delle lenti.' },
    { id: 'camTutto', label: 'Rialzo largo quanto il telefono', type: 'bool', def: false, unit: undefined },
    { id: 'camFine', label: 'Fine del rialzo dalla cima', min: 10, max: 90, def: 48, show: p => mine(p) && p.camTutto },
    { id: 'usbL', label: 'Connettore: larghezza', min: 5, max: 25, def: 12.45 },
    { id: 'usbA', label: 'Connettore: altezza', min: 2, max: 12, def: 6.6 },
    { id: 'fondoL', label: 'Fori sul fondo: larghezza', min: 10, max: 90, def: 43.15, help: 'Apertura per altoparlanti e microfoni, centrata.' },
  ];
  // misure del modello scelto nei campi "Misure mie": così si parte da un telefono vero
  const r2 = (v) => Math.round(v * 100) / 100;
  function phoneFields(id) {
    const t = PHONES.find(q => q.id === id);
    if (!t) return null;
    // raggio del cerchio che taglia l'angolo come la curva del disegno (alla diagonale)
    let dg = t.a[0][1] * 0.29;
    for (let i = 0; i < t.a.length - 1; i++) { const [x0, y0] = t.a[i], [x1, y1] = t.a[i + 1]; if (x0 <= y0 && x1 >= y1) { const k = (y0 - x0) / ((y0 - x0) - (y1 - x1)); dg = x0 + k * (x1 - x0); break; } }
    const pf = t.pf[t.pf.length - 1], c = t.cam;
    let r = c.tutto ? c.f : c.r;
    if (c.fori) for (const [x, y, d] of c.fori) r = [Math.min(r[0], x - d / 2), Math.min(r[1], y - d / 2), Math.max(r[2], x + d / 2), Math.max(r[3], y + d / 2), r[4]];
    const half = t.W / 2, sp = t.sp || [half - 20, half + 20];
    return { larghezza: t.W, altezza: t.L, spessore: t.T, raggioAngoli: r2(dg / (1 - Math.SQRT1_2)), raggioBordo: r2(pf[1] + 3 * Math.max(0, t.T / 2 - pf[0])),
      tastiSx: t.sx.map(([cc, l]) => `${cc}/${r2(l)}`).join(', '), tastiDx: t.dx.map(([cc, l]) => `${cc}/${r2(l)}`).join(', '), tastiA: t.w,
      camX: r2(r[0]), camY: r2(r[1]), camL: r2(r[2] - r[0]), camA: r2(r[3] - r[1]), camR: r[4], camH: c.h, camV: c.v, camTutto: !!c.tutto, camFine: c.tutto ? c.r[3] : 48,
      usbL: t.usb[1], usbA: t.usb[2], fondoL: r2(2 * Math.max(Math.abs(sp[0] - half), Math.abs(sp[1] - half)) + 2) };
  }

  // processori e moduli (misure in dati/schede-misure.js)
  const SCHEDE_DB = (window.SCHEDE_MISURE && window.SCHEDE_MISURE.SCHEDE) || {};
  const schedeOpts = (ruolo) => Object.entries(SCHEDE_DB).filter(([, v]) => v.ruolo === ruolo).map(([k, v]) => [k, `${v.nome} · ${String(v.L).replace('.', ',')} × ${String(v.W).replace('.', ',')} mm`]);
  const MODES = {
    bin: {
      label: 'Contenitore',
      params: [
        ...grid(2, 1, 6),
        { sec: 'Dimensioni', id: 'bordo', label: 'Bordo impilabile', type: 'bool', def: true, help: 'Permette di impilare un contenitore sopra l\'altro.' },
        { sec: 'Struttura', id: 'pareti', label: 'Spessore pareti', type: 'num', min: 0.4, max: 2.4, step: 0.4, def: 1.2, unit: 'mm', help: 'Meglio un multiplo dell\'ugello (0,4 → 0,8 · 1,2 · 1,6).' },
        { sec: 'Struttura', id: 'fondo', label: 'Spessore fondo', type: 'num', min: 0.6, max: 5, step: 0.2, def: 1.2, unit: 'mm' },
        { sec: 'Divisori', id: 'divX', label: 'Vani in larghezza', type: 'int', min: 1, max: 12, def: 2 },
        { sec: 'Divisori', id: 'divY', label: 'Vani in profondità', type: 'int', min: 1, max: 12, def: 1 },
        { sec: 'Divisori', id: 'spDiv', label: 'Spessore divisori', type: 'num', min: 0.4, max: 3, step: 0.4, def: 1.2, unit: 'mm' },
        { sec: 'Divisori', id: 'scoop', label: 'Raccordo frontale', type: 'bool', def: true, help: 'Fondo curvo sul davanti per prendere facilmente i pezzi piccoli.' },
        { sec: 'Divisori', id: 'scoopR', label: 'Raggio raccordo', type: 'num', min: 2, max: 25, step: 1, def: 8, unit: 'mm', show: p => p.scoop },
        { sec: 'Divisori', id: 'etichetta', label: 'Ripiano etichetta', type: 'bool', def: true },
        { sec: 'Divisori', id: 'etiProf', label: 'Profondità etichetta', type: 'num', min: 6, max: 20, step: 1, def: 12, unit: 'mm', show: p => p.etichetta },
        ...common,
      ],
    },
    cab: {
      label: 'Cassettiera',
      params: [
        ...grid(2, 3, 8),
        { sec: 'Dimensioni', id: 'bordo', label: 'Bordo impilabile', type: 'bool', def: true, help: 'Sopra la cassettiera puoi impilare contenitori o un\'altra cassettiera.' },
        { sec: 'Cassetti', id: 'righe', label: 'Cassetti in altezza', type: 'int', min: 1, max: 12, def: 3 },
        { sec: 'Cassetti', id: 'colonne', label: 'Cassetti in larghezza', type: 'int', min: 1, max: 8, def: 1 },
        { sec: 'Cassetti', id: 'maniglia', label: 'Maniglia', type: 'select', def: 'tacca', options: [['tacca', 'Tacca'], ['aletta', 'Aletta'], ['pomello', 'Pomello'], ['nessuna', 'Nessuna']] },
        { sec: 'Cassetti', id: 'cDivX', label: 'Vani in larghezza', type: 'int', min: 1, max: 12, def: 1 },
        { sec: 'Cassetti', id: 'cDivY', label: 'Vani in profondità', type: 'int', min: 1, max: 12, def: 2 },
        { sec: 'Cassetti', id: 'spDiv', label: 'Spessore divisori', type: 'num', min: 0.4, max: 3, step: 0.4, def: 0.8, unit: 'mm' },
        { sec: 'Cassetti', id: 'cPareti', label: 'Pareti cassetto', type: 'num', min: 0.8, max: 2.4, step: 0.4, def: 1.2, unit: 'mm' },
        { sec: 'Cassetti', id: 'cFondo', label: 'Fondo cassetto', type: 'num', min: 0.6, max: 3, step: 0.2, def: 1, unit: 'mm' },
        { sec: 'Struttura', id: 'pareti', label: 'Pareti mobile', type: 'num', min: 0.8, max: 4, step: 0.4, def: 1.6, unit: 'mm' },
        { sec: 'Struttura', id: 'spRipiani', label: 'Spessore ripiani', type: 'num', min: 0.8, max: 4, step: 0.4, def: 1.6, unit: 'mm' },
        { sec: 'Struttura', id: 'fondo', label: 'Spessore fondo', type: 'num', min: 0.6, max: 5, step: 0.2, def: 1.2, unit: 'mm' },
        { sec: 'Struttura', id: 'cielo', label: 'Spessore cielo', type: 'num', min: 0.8, max: 5, step: 0.2, def: 1.6, unit: 'mm' },
        ...common,
      ],
    },
    lego: {
      label: 'Cassetti modulari',
      params: [
        { sec: 'Dimensioni', id: 'unita', label: 'Unità della griglia', type: 'num', min: 30, max: 70, step: 1, def: 50, unit: 'mm', help: 'Il passo dei mattoncini (un bottoncino per unità): tutti i moduli da incastrare fra loro devono avere la stessa unità.' },
        { sec: 'Dimensioni', id: 'larghezza', label: 'Larghezza', type: 'int', min: 1, max: 6, def: 4, unit: 'unità' },
        { sec: 'Dimensioni', id: 'profondita', label: 'Profondità', type: 'int', min: 1, max: 6, def: 2, unit: 'unità' },
        { sec: 'Dimensioni', id: 'altezza', label: 'Altezza', type: 'num', min: 40, max: 150, step: 1, def: 60, unit: 'mm', help: 'Vaschetta con il coperchio, senza i bottoncini. Il cassetto è più basso di fondo e coperchio (circa 5 mm con i valori iniziali): in cima i fianchi sono smussati e salgono sotto il battente.' },
        { sec: 'Bottoncini', id: 'diamBott', label: 'Diametro bottoncini', type: 'num', min: 12, max: 50, step: 0.5, def: 30, unit: 'mm', help: 'Stampati sul coperchio. Entrano nei fori del fondo del modulo di sopra.' },
        { sec: 'Bottoncini', id: 'altBott', label: 'Altezza bottoncini', type: 'num', min: 1.2, max: 4, step: 0.2, def: 2, unit: 'mm', help: 'Il fondo della vaschetta deve essere spesso almeno 0,4 mm in più, così i bottoncini del modulo sotto entrano nei fori senza toccare il cassetto: se lo alzi, il fondo cresce da solo quando serve.' },
        { sec: 'Bottoncini', id: 'giocoIncastro', label: 'Gioco dell\'incastro', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', help: 'Quanto i fori del fondo sono più larghi dei bottoncini; i bottoncini non cambiano. Se balla diminuiscilo, se entra duro aumentalo.' },
        { sec: 'Cassetto', id: 'maniglia', label: 'Maniglia', type: 'select', def: 'tacca', options: [['tacca', 'Tacca per le dita'], ['nessuna', 'Nessuna']] },
        { sec: 'Cassetto', id: 'taccaProf', label: 'Profondità tacca', type: 'num', min: 5, max: 40, step: 1, def: 10, unit: 'mm', show: p => p.maniglia === 'tacca', help: 'Quanto scende dal bordo del frontale.' },
        { sec: 'Cassetto', id: 'guide', label: 'Guide', type: 'select', def: 'no', options: [['no', 'Senza guide'], ['si', 'Guide sui fianchi']], help: 'Senza guide il cassetto scorre sul pavimento: meno plastica. Con le guide non si inclina quando lo tiri fuori, ma i fianchi sono più spessi.' },
        { sec: 'Cassetto', id: 'cPareti', label: 'Pareti cassetto', type: 'num', min: 1.2, max: 4, step: 0.2, def: 1.4, unit: 'mm', help: 'Con le guide i fianchi del cassetto diventano più spessi, perché dentro hanno la scanalatura dove scorre la guida (circa 1,35 mm in più).' },
        { sec: 'Cassetto', id: 'cFondo', label: 'Fondo cassetto', type: 'num', min: 1.2, max: 4, step: 0.2, def: 1.4, unit: 'mm' },
        { sec: 'Cassetto', id: 'raccordo', label: 'Raccordo interno', type: 'num', min: 1, max: 15, step: 0.5, def: 5, unit: 'mm', help: 'Angoli interni arrotondati: le cose si prendono meglio.' },
        { sec: 'Cassetto', id: 'giocoCassetto', label: 'Gioco nel vano', type: 'num', min: 0.3, max: 1.5, step: 0.05, def: 0.75, unit: 'mm', help: 'Spazio fra cassetto e modulo, per lato.' },
        { sec: 'Separatori', id: 'separatori', label: 'Separatori', type: 'select', def: 'estraibili', options: [['estraibili', 'Estraibili'], ['fissi', 'Fissi nel cassetto'], ['nessuno', 'Nessuno']], help: 'Gli estraibili sono lamine stampate in piano che scorrono nelle scanalature del cassetto: li sposti quando vuoi.' },
        { sec: 'Separatori', id: 'sepTrasv', label: 'Trasversali', type: 'int', min: 0, max: 10, def: 1, help: 'Paralleli al frontale.', show: p => p.separatori !== 'nessuno' },
        { sec: 'Separatori', id: 'sepLong', label: 'Longitudinali', type: 'int', min: 0, max: 10, def: 2, help: 'Dal frontale al fondo.', show: p => p.separatori !== 'nessuno' },
        { sec: 'Separatori', id: 'spDiv', label: 'Spessore', type: 'num', min: 0.8, max: 2.4, step: 0.4, def: 1.2, unit: 'mm', show: p => p.separatori !== 'nessuno' },
        { sec: 'Separatori', id: 'passo', label: 'Passo scanalature', type: 'num', min: 10, max: 60, step: 1, def: 20, unit: 'mm', show: p => p.separatori === 'estraibili', help: 'Ogni quanti millimetri c\'è una scanalatura dove infilare un separatore.' },
        { sec: 'Struttura', id: 'fondoVasc', label: 'Fondo vaschetta', type: 'num', min: 1.6, max: 8, step: 0.2, def: 2.4, unit: 'mm', help: 'Minimo: altezza dei bottoncini + 0,4 mm. I fori del fondo sono passanti e il bottoncino del modulo sotto ci entra dentro: se il fondo fosse più sottile sporgerebbe nel vano e il cassetto ci sbatterebbe. Gli 0,4 in più lo tengono appena sotto il pavimento. Se metti meno, viene portato al minimo.' },
        { sec: 'Struttura', id: 'pareti', label: 'Pareti modulo', type: 'num', min: 1.2, max: 4, step: 0.2, def: 1.4, unit: 'mm', help: 'Fianchi e schiena della vaschetta. 1,4 mm sono circa tre passate con l\'ugello da 0,4.' },
        { sec: 'Coperchio', id: 'fissaggio', label: 'Fissaggio', type: 'select', def: 'scatto', options: [['scatto', 'A scatto'], ['colla', 'Colla']], help: 'A scatto: un dentino sulle pareti si aggancia sul bordo smussato del coperchio; si toglie facendo leva. Colla: il coperchio poggia sul battente e si incolla.' },
        { sec: 'Coperchio', id: 'cielo', label: 'Spessore coperchio', type: 'num', min: 1.2, max: 4, step: 0.2, def: 1.4, unit: 'mm' },
        { sec: 'Coperchio', id: 'giocoCoperchio', label: 'Gioco del coperchio', type: 'num', min: 0, max: 0.6, step: 0.05, def: 0.2, unit: 'mm', help: 'Spazio fra coperchio e pareti, per lato. Se non entra aumentalo, se a scatto non tiene diminuiscilo.' },
      ],
    },
    rack: {
      label: 'Rack telefoni',
      params: [
        { sec: 'Dispositivi', id: 'preset', label: 'Partenza rapida', type: 'select', def: 'telV', options: [['telV', 'Telefoni in piedi'], ['telO', 'Telefoni sdraiati'], ['tabV', 'Tablet in piedi'], ['tabO', 'Tablet sdraiati']],
          help: 'Imposta valori tipici; poi puoi cambiarli tutti.',
          onSet: (k) => ({ telV: { lunghezza: 80, altSep: 50, spessore: 11 }, telO: { lunghezza: 160, altSep: 35, spessore: 11 }, tabV: { lunghezza: 180, altSep: 80, spessore: 9 }, tabO: { lunghezza: 250, altSep: 60, spessore: 9 } })[k] },
        { sec: 'Dispositivi', id: 'fessure', label: 'Numero fessure', type: 'int', min: 1, max: 24, def: 5 },
        { sec: 'Dispositivi', id: 'spessore', label: 'Spessore dispositivo', type: 'num', min: 3, max: 40, step: 0.5, def: 11, unit: 'mm', help: 'Con la cover. Misura il più spesso che vuoi ospitare.' },
        { sec: 'Dispositivi', id: 'gioco', label: 'Gioco nella fessura', type: 'num', min: 0.5, max: 6, step: 0.5, def: 1.5, unit: 'mm', help: 'Spazio in più per infilarlo e toglierlo senza sforzo.' },
        { sec: 'Dispositivi', id: 'spessoriLista', label: 'Spessori diversi per fessura', type: 'text', def: '', placeholder: 'es. 9, 11, 11, 14', help: 'Facoltativo. Se lo compili, sostituisce numero fessure e spessore.' },
        { sec: 'Dispositivi', id: 'lunghezza', label: 'Lunghezza appoggio', type: 'num', min: 30, max: 300, step: 1, def: 80, unit: 'mm', help: 'Lato del dispositivo che poggia nel rack. Può sporgere ai lati. Con base Gridfinity si allarga alla griglia.' },
        { sec: 'Separatori', id: 'altSep', label: 'Altezza', type: 'num', min: 15, max: 160, step: 1, def: 50, unit: 'mm', help: 'Circa il 35–45% dell\'altezza del dispositivo basta a tenerlo dritto.' },
        { sec: 'Separatori', id: 'spSep', label: 'Spessore', type: 'num', min: 2.4, max: 6, step: 0.4, def: 3.2, unit: 'mm' },
        { sec: 'Separatori', id: 'inclinazione', label: 'Inclinazione indietro', type: 'num', min: 0, max: 20, step: 1, def: 8, unit: '°' },
        { sec: 'Separatori', id: 'raccordo', label: 'Rinforzo alla base', type: 'num', min: 0, max: 5, step: 0.5, def: 2, unit: 'mm', help: 'Raccordo curvo dove il separatore si attacca: evita che si spezzi.' },
        { sec: 'Separatori', id: 'tacca', label: 'Tacca per le dita', type: 'bool', def: true },
        { sec: 'Separatori', id: 'taccaProf', label: 'Profondità tacca', type: 'num', min: 10, max: 80, step: 5, def: 45, unit: '%', show: p => p.tacca },
        { sec: 'Separatori', id: 'taccaLarg', label: 'Larghezza tacca', type: 'num', min: 15, max: 80, step: 5, def: 45, unit: '%', show: p => p.tacca },
        { sec: 'Base', id: 'base', label: 'Tipo di base', type: 'select', def: 'gridfinity', options: [['gridfinity', 'Gridfinity'], ['libera', 'Libera (fondo piatto)']] },
        { sec: 'Base', id: 'spBase', label: 'Spessore base', type: 'num', min: 1.2, max: 8, step: 0.2, def: 3, unit: 'mm' },
        { sec: 'Base', id: 'piedini', label: 'Incavi per piedini in gomma', type: 'bool', def: true, show: p => p.base === 'libera', help: '4 incavi da 10 mm per piedini adesivi antiscivolo.' },
        ...common.filter(c => c.id !== 'viti').map(c => ({ ...c, sec: 'Base', show: c.show ? (p => p.base === 'gridfinity' && c.show(p)) : (p => p.base === 'gridfinity') })),
        { sec: 'Stampa', id: 'stampa', label: 'Orientamento di stampa', type: 'select', def: 'piedi', options: [['piedi', 'In piedi'], ['fianco', 'Sul fianco']], help: 'Sul fianco gli strati corrono lungo i separatori: molto più robusti, ma serve un piatto alto quanto il rack è largo.' },
      ],
    },
    cover: {
      label: 'Cover',
      artKey: 'disegno',
      params: [
        { sec: 'Telefono', id: 'modello', label: 'Modello', type: 'select', menu: true, def: 'iphone-16', options: PHONE_OPTS, onSet: (k) => (k === 'misure' ? null : phoneFields(k)),
          help: 'iPhone: misure prese dai disegni quotati che Apple pubblica per chi fa accessori. OnePlus Nord: scheda tecnica e foto ufficiale in scala, alcune quote stimate. "Misure mie" parte dall\'ultimo modello scelto e lascia cambiare tutto.' },
        ...PHONE_FIELDS.map(f => Object.assign({ sec: 'Telefono', type: 'num', step: 0.01, unit: 'mm', show: mine }, f)),
        { sec: 'Telefono', id: 'tipo', label: 'Tipo', type: 'select', def: 'completa', options: [['completa', 'Cover completa'], ['cavalletto', 'Con cavalletto']] },
        { sec: 'Materiale e gioco', id: 'materiale', label: 'Materiale', type: 'select', def: 'tpu', options: [['tpu', 'TPU (flessibile)'], ['pla', 'PLA o PETG (rigido)']],
          onSet: (k) => (k === 'tpu' ? { gioco: 0.15, giocoZ: 0.2, sporgenza: 1 } : { gioco: 0.3, giocoZ: 0.3, sporgenza: 0.6 }),
          help: 'TPU: il telefono entra a scatto sotto il bordo, come una cover comprata. PLA o PETG sono rigidi: il bordo sul vetro è più stretto e il telefono entra inclinato, prima la cima e poi il fondo, mentre le pareti si piegano un poco. Il PETG si piega meglio del PLA.' },
        { sec: 'Materiale e gioco', id: 'gioco', label: 'Gioco sui lati', type: 'num', min: -0.4, max: 1, step: 0.05, def: 0.15, unit: 'mm', help: 'Spazio tra telefono e pareti. Stampa la striscia di prova: se entra stretto aumentalo, se balla diminuiscilo. Se balla anche a 0 scendi sotto zero: il telefono è un po\' più piccolo delle misure dichiarate.' },
        { sec: 'Materiale e gioco', id: 'giocoZ', label: 'Gioco sullo spessore', type: 'num', min: -0.4, max: 1, step: 0.05, def: 0.2, unit: 'mm', help: 'Sotto zero se il telefono balla avanti e indietro anche a 0.' },
        { sec: 'Materiale e gioco', id: 'giocoTasti', label: 'Gioco attorno ai fori', type: 'num', min: 0.2, max: 2, step: 0.1, def: 0.5, unit: 'mm', help: 'Margine attorno a tasti, connettore e altoparlanti.' },
        { sec: 'Materiale e gioco', id: 'giocoCam', label: 'Gioco attorno alla fotocamera', type: 'num', min: 0, max: 3, step: 0.1, def: 0.6, unit: 'mm' },
        { sec: 'Bordi', id: 'pareti', label: 'Spessore pareti', type: 'num', min: 1, max: 3, step: 0.1, def: 1.6, unit: 'mm' },
        { sec: 'Bordi', id: 'retro', label: 'Spessore retro', type: 'num', min: 1, max: 3, step: 0.1, def: 1.6, unit: 'mm', help: 'Il retro diventa più spesso da solo se servono la tasca per la fotocamera, la guida del cavalletto o il retro più spesso per le lenti.' },
        { sec: 'Bordi', id: 'sporgenza', label: 'Bordo sul vetro', type: 'num', min: 0.4, max: 3, step: 0.1, def: 1, unit: 'mm', help: 'Quanto il bordo copre il vetro dello schermo, dal contorno del telefono verso l\'interno. Più largo tiene meglio il telefono.' },
        { sec: 'Bordi', id: 'bordoSchermo', label: 'Altezza sopra lo schermo', type: 'num', min: 0, max: 3, step: 0.1, def: 0.8, unit: 'mm', help: 'Quanto il bordo sporge sopra il vetro: appoggiato a faccia in giù, lo schermo non tocca il tavolo.' },
        { sec: 'Bordi', id: 'profilo', label: 'Spigoli', type: 'select', def: 'arrotondato', options: [['arrotondato', 'Arrotondati'], ['smussato', 'Smussati'], ['dritto', 'Vivi']] },
        { sec: 'Bordi', id: 'raggio', label: 'Misura spigoli', type: 'num', min: 0.2, max: 3, step: 0.1, def: 1.2, unit: 'mm', show: p => p.profilo !== 'dritto' },
        { sec: 'Fotocamera e tasti', id: 'protezione', label: 'Protezione lenti', type: 'select', def: 'cornice', options: [['cornice', 'Copertura a parte'], ['retro', 'Retro più spesso'], ['nessuna', 'Nessuna']],
          help: 'Copertura a parte: un pezzo stampato a parte (in PLA o PETG) che chiude la finestra della fotocamera, lascia aperti solo lenti, flash e sensori e sporge oltre le lenti. Si mette dentro la cover e la tiene ferma il telefono. Retro più spesso: niente pezzi in più, ma la cover diventa più spessa e pesante.' },
        { sec: 'Fotocamera e tasti', id: 'alzoCornice', label: 'Oltre le lenti', type: 'num', min: 0.2, max: 2, step: 0.1, def: 0.5, unit: 'mm', show: p => p.protezione !== 'nessuna', help: 'Quanto la protezione sporge oltre il vetro delle lenti.' },
        { sec: 'Fotocamera e tasti', id: 'giocoCornice', label: 'Gioco della copertura', type: 'num', min: 0, max: 0.5, step: 0.05, def: 0.15, unit: 'mm', show: p => p.protezione === 'cornice', help: 'Tra la copertura e la finestra della cover. Se entra dura aumentalo.' },
        { sec: 'Fotocamera e tasti', id: 'colCornice', label: 'Colore della copertura', type: 'select', def: '1', options: [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], show: p => p.protezione === 'cornice' },
        { sec: 'Fotocamera e tasti', id: 'tasti', label: 'Tasti', type: 'select', def: 'fori', options: [['fori', 'Scoperti (fianco aperto)'], ['coperti', 'Coperti (solo TPU)']], show: p => p.materiale !== 'pla',
          help: 'Scoperti: il fianco è aperto dal retro al bordo dove ci sono i tasti. Coperti: la parete si assottiglia sopra il tasto e fuori c\'è un rilievo da premere. Camera Control e interruttore restano sempre scoperti.' },
        { sec: 'MagSafe', id: 'magsafe', label: 'Incavo per anello magnetico', type: 'select', def: 'no', options: [['no', 'No'], ['dentro', 'Dentro la cover'], ['fuori', 'Sul retro']],
          help: 'Un incavo ad anello, centrato sul MagSafe, per un anello magnetico adesivo: così caricatori, supporti e accessori MagSafe si attaccano anche attraverso la cover. Dentro: l\'anello resta nascosto tra cover e telefono. Sul retro: resta a vista.' },
        { sec: 'MagSafe', id: 'magDe', label: 'Anello: diametro esterno', type: 'num', min: 40, max: 70, step: 0.5, def: 56, unit: 'mm', show: p => p.magsafe !== 'no' },
        { sec: 'MagSafe', id: 'magDi', label: 'Anello: diametro interno', type: 'num', min: 20, max: 65, step: 0.5, def: 46, unit: 'mm', show: p => p.magsafe !== 'no' },
        { sec: 'MagSafe', id: 'magSp', label: 'Anello: spessore', type: 'num', min: 0.2, max: 2, step: 0.1, def: 0.6, unit: 'mm', show: p => p.magsafe !== 'no', help: 'Misura l\'anello che compri: l\'incavo è 0,3 mm più largo e 0,1 mm più profondo.' },
        { sec: 'MagSafe', id: 'magCoda', label: 'Linguetta di orientamento', type: 'bool', def: false, show: p => p.magsafe !== 'no', help: 'Alcuni anelli hanno una linguetta sotto il cerchio che orienta gli accessori: l\'incavo la segue (11 × 6 mm).' },
        { sec: 'Cavalletto', id: 'orientamento', label: 'Telefono', type: 'select', def: 'verticale', options: [['verticale', 'In verticale'], ['orizzontale', 'In orizzontale']], show: p => p.tipo === 'cavalletto' },
        { sec: 'Cavalletto', id: 'inclinazione', label: 'Inclinazione', type: 'int', min: 10, max: 35, step: 1, def: 20, unit: '°', show: p => p.tipo === 'cavalletto', help: 'Quanto il telefono pende all\'indietro.' },
        { sec: 'Cavalletto', id: 'giocoCav', label: 'Gioco nella guida', type: 'num', min: 0, max: 0.6, step: 0.05, def: 0.2, unit: 'mm', show: p => p.tipo === 'cavalletto',
          help: 'Il cavalletto è un pezzo a parte che si infila in una guida a coda di rondine scavata nel retro. Stampalo in PLA o PETG.' },
        { sec: 'Retro', id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'disegno', use: { disegno: 'svg' }, unuse: { disegno: 'nessuno' }, using: p => p.disegno === 'svg' },
        { sec: 'Retro', id: 'disegno', label: 'Disegno', type: 'select', def: 'nessuno', options: [['nessuno', 'Nessuno'], ['svg', 'Il tuo SVG']], show: () => false },   // lo imposta il riquadro qui sopra
        { sec: 'Retro', id: 'altDisegno', label: 'Altezza disegno', type: 'num', min: 10, max: 120, step: 1, def: 45, unit: 'mm', show: p => p.disegno === 'svg' },
        { sec: 'Retro', id: 'posDisegno', label: 'Posizione disegno', type: 'pad', def: [0, 0], show: p => p.disegno === 'svg', help: 'Le frecce spostano il disegno sul retro; il centro lo rimette al suo posto. Fuori dalla zona libera viene tagliato.' },
        { sec: 'Retro', id: 'stileRetro', label: 'Stile', type: 'select', def: 'filo', options: [['filo', 'A filo (a colori)'], ['inciso', 'Inciso'], ['traforata', 'Traforato']],
          help: 'Il retro è sul piatto, quindi niente rilievo. A filo: i colori sono nei primi strati e la superficie resta liscia (multicolore, o cambio filamento). Traforato: si vede il retro del telefono.' },
        layerP({ sec: 'Retro', id: 'profRetro', label: 'Spessore', min: 0.2, max: 2, def: 0.6, show: p => p.stileRetro !== 'traforata' }),
        ...linesP('Scritta', '', '', 8, null, 60, 'Se la scritta non ci sta viene ridotta da sola.'),
        { sec: 'Scritta', id: 'carattere', label: 'Carattere', type: 'select', def: 'tondo', options: FONT_OPTS },
        Object.assign(nozzleP('Scritta'), { show: p => hasLogo(p) || isArtId(p.disegno) }),
        ...markP(true, null, [{ id: 'doveMarchio', label: 'Dove', type: 'select', def: 'retro', options: [['retro', 'Retro della cover'], ['lenti', 'Copertura delle lenti']], show: p => p.protezione === 'cornice',
          help: 'Sulla copertura delle lenti va tra i fori, sulla faccia esterna. Stesso stile della scritta del retro (a filo o inciso).' }]),
        ...colorsP(['Colore 1 · cover', 'Colore 2', 'Colore 3', 'Colore 4'], 'disegno'),
        { sec: 'Colori', id: 'colTesto', label: 'Colore della scritta', type: 'select', def: 'auto', options: [['auto', 'Auto'], ['2', '2'], ['3', '3'], ['4', '4']] },
        { sec: 'Stampa', id: 'prova', label: 'Striscia di prova', type: 'select', def: 'nessuna', options: [['nessuna', 'No, la cover intera'], ['cima', 'Solo la cima (22 mm)'], ['fondo', 'Solo il fondo (22 mm)']],
          help: 'Un pezzo della cover che si stampa in pochi minuti: provalo sul telefono e regola il gioco prima di stampare tutto.' },
      ],
    },
    vaso: {
      label: 'Vasi',
      params: [
        { sec: 'Forma', id: 'forma', label: 'Forma', type: 'select', def: 'tondo', options: [['tondo', 'Tondo'], ['quadrato', 'Quadrato'], ['esagonale', 'Esagonale'], ['rettangolare', 'Fioriera']],
          onSet: (k, v) => k === 'rettangolare' ? (v.larghezza < 180 ? { larghezza: 250, profondita: 110 } : null) : (v.larghezza > 200 ? { larghezza: 110 } : null) },
        { sec: 'Forma', id: 'larghezza', label: 'Larghezza bocca', type: 'num', min: 30, max: 350, step: 1, def: 110, unit: 'mm', help: 'Per il tondo è il diametro; per la fioriera la lunghezza.' },
        { sec: 'Forma', id: 'profondita', label: 'Profondità bocca', type: 'num', min: 30, max: 300, step: 1, def: 110, unit: 'mm', show: p => p.forma === 'rettangolare' },
        { sec: 'Forma', id: 'altezza', label: 'Altezza', type: 'num', min: 30, max: 300, step: 1, def: 100, unit: 'mm' },
        { sec: 'Forma', id: 'base', label: 'Base rispetto alla bocca', type: 'num', min: 50, max: 100, step: 5, def: 80, unit: '%', help: '100% = pareti dritte. Meno di 100% = vaso che si stringe verso il basso.' },
        { sec: 'Coperchio decorato', id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'disegno', use: { disegno: 'svg' }, unuse: { disegno: 'nessuno' }, using: p => p.disegno === 'svg' },
        { sec: 'Coperchio decorato', id: 'disegno', label: 'Disegno', type: 'select', def: 'nessuno', options: [['nessuno', 'Nessuno'], ['svg', 'Il tuo SVG']], show: () => false },   // lo imposta il riquadro qui sopra
        { sec: 'Coperchio decorato', id: 'altDisegno', label: 'Altezza disegno', type: 'num', min: 8, max: 80, step: 1, def: 30, unit: 'mm', show: p => p.disegno === 'svg' },
        { sec: 'Coperchio decorato', id: 'stileCop', label: 'Stile', type: 'select', def: 'filo', options: [['filo', 'A filo (a colori)'], ['inciso', 'Inciso'], ['traforata', 'Traforato']],
          help: 'Il coperchio si stampa capovolto, con la faccia di sopra sul piatto. A filo: i colori sono nei primi strati e la superficie resta liscia (multicolore, o cambio filamento). Inciso: scavato. Traforato: passa da parte a parte.' },
        layerP({ sec: 'Coperchio decorato', id: 'profCop', label: 'Spessore', min: 0.2, max: 1.6, def: 0.2, show: p => p.stileCop !== 'traforata' }),
        ...linesP('Scritta sul coperchio', '', '', 8, null, 60, 'Altezza delle maiuscole (i loghi sono alti 1,35 volte). Con i pulsanti sotto il campo metti il logo SP e i visi. Se non ci sta viene ridotta da sola.'),
        { sec: 'Scritta sul coperchio', id: 'carattere', label: 'Carattere', type: 'select', def: 'tondo', options: FONT_OPTS },
        Object.assign(nozzleP('Scritta sul coperchio'), { show: p => hasLogo(p) || p.disegno === 'svg' }),
        ...colorsP(['Colore 1 · coperchio', 'Colore 2', 'Colore 3', 'Colore 4'], 'disegno'),
        { sec: 'Colori', id: 'colTesto', label: 'Colore della scritta', type: 'select', def: 'auto', options: [['auto', 'Auto'], ['2', '2'], ['3', '3'], ['4', '4']], help: 'Solo con lo stile a filo. Auto: il colore che si legge meglio sul coperchio.' },
        { sec: 'Forma', id: 'raggio', label: 'Raggio angoli', type: 'num', min: 1, max: 50, step: 1, def: 10, unit: 'mm', show: p => p.forma === 'quadrato' || p.forma === 'rettangolare' },
        { sec: 'Forma', id: 'scomparti', label: 'Scomparti', type: 'int', min: 1, max: 8, def: 3, show: p => p.forma === 'rettangolare', help: 'Una pianta aromatica per scomparto.' },
        { sec: 'Forma', id: 'spDiv', label: 'Spessore divisori', type: 'num', min: 0.8, max: 4, step: 0.4, def: 1.6, unit: 'mm', show: p => p.forma === 'rettangolare' && p.scomparti > 1 },
        { sec: 'Forma', id: 'bordo', label: 'Bordo rinforzato', type: 'bool', def: true },
        { sec: 'Struttura', id: 'pareti', label: 'Spessore pareti', type: 'num', min: 1.2, max: 4, step: 0.4, def: 2, unit: 'mm' },
        { sec: 'Struttura', id: 'fondo', label: 'Spessore fondo', type: 'num', min: 1.2, max: 5, step: 0.2, def: 2.4, unit: 'mm' },
        { ...common[0], sec: 'Struttura', help: 'Gioco tra vaso interno ed esterno nell\'autoirrigante e per il cestello.' },
        { sec: 'Tipo', id: 'tipo', label: 'Tipo di vaso', type: 'select', def: 'normale', options: [['normale', 'Normale'], ['autoirrigante', 'Autoirrigante']] },
        { sec: 'Tipo', id: 'fori', label: 'Fori di drenaggio', type: 'bool', def: true, show: p => p.tipo === 'normale' },
        { sec: 'Tipo', id: 'nFori', label: 'Fori per scomparto', type: 'int', min: 1, max: 12, def: 5, show: p => p.tipo === 'normale' && p.fori },
        { sec: 'Tipo', id: 'diamFori', label: 'Diametro fori', type: 'num', min: 3, max: 15, step: 0.5, def: 8, unit: 'mm', show: p => p.tipo === 'normale' && p.fori },
        { sec: 'Tipo', id: 'canali', label: 'Canali di scolo sotto', type: 'bool', def: false, show: p => p.tipo === 'normale' && p.fori, help: 'Scanalature sotto il fondo: l\'acqua esce anche se il vaso poggia su un piano.' },
        { sec: 'Tipo', id: 'sottovaso', label: 'Sottovaso', type: 'bool', def: true, show: p => p.tipo === 'normale', help: 'Con rialzi interni: il vaso non resta nell\'acqua.' },
        { sec: 'Tipo', id: 'altSv', label: 'Altezza sottovaso', type: 'num', min: 8, max: 40, step: 1, def: 15, unit: 'mm', show: p => p.tipo === 'normale' && p.sottovaso },
        { sec: 'Tipo', id: 'margineSv', label: 'Margine sottovaso', type: 'num', min: 2, max: 20, step: 1, def: 5, unit: 'mm', show: p => p.tipo === 'normale' && p.sottovaso },
        { sec: 'Tipo', id: 'fondoSv', label: 'Fondo sottovaso', type: 'num', min: 1.2, max: 4, step: 0.2, def: 1.6, unit: 'mm', show: p => p.tipo === 'normale' && p.sottovaso },
        { sec: 'Tipo', id: 'riserva', label: 'Altezza riserva d\'acqua', type: 'num', min: 15, max: 120, step: 1, def: 35, unit: 'mm', show: p => p.tipo === 'autoirrigante', help: 'Spazio per l\'acqua sotto il vaso interno.' },
        { sec: 'Tipo', id: 'pescante', label: 'Diametro cestello pescante', type: 'num', min: 12, max: 40, step: 1, def: 20, unit: 'mm', show: p => p.tipo === 'autoirrigante', help: 'Cestello forato pieno di terra che pesca nell\'acqua e la porta alle radici.' },
        { sec: 'Tipo', id: 'tubo', label: 'Tubo per riempire', type: 'bool', def: true, show: p => p.tipo === 'autoirrigante' },
        { sec: 'Tipo', id: 'troppoPieno', label: 'Foro di troppo pieno', type: 'bool', def: true, show: p => p.tipo === 'autoirrigante', help: 'Impedisce che l\'acqua salga fino alla terra.' },
      ],
    },
    pallina: {
      label: 'Pallina',
      params: [
        { sec: 'Forma', id: 'forma', label: 'Forma', type: 'select', def: 'sfera', options: [['sfera', 'Sfera'], ['goccia', 'Goccia'], ['oliva', 'Oliva'], ['cipolla', 'Cipolla']] },
        { sec: 'Forma', id: 'diametro', label: 'Diametro', type: 'num', min: 40, max: 140, step: 1, def: 70, unit: 'mm' },
        { sec: 'Forma', id: 'spessore', label: 'Spessore guscio', type: 'num', min: 0.8, max: 3, step: 0.2, def: 1.2, unit: 'mm' },
        { sec: 'Forma', id: 'sfaccettata', label: 'Sfaccettata (low poly)', type: 'bool', def: false },
        { sec: 'Decorazione', id: 'decorazione', label: 'Decorazione', type: 'select', def: 'stelle', options: [['nessuna', 'Nessuna'], ['spicchi', 'Spicchi'], ['anelli', 'Anelli'], ['puntini', 'Puntini'], ['stelle', 'Stelle'], ['traforata', 'Stelle traforate']],
          help: 'Le traforate sono buchi: con un LED dentro la pallina si illumina.' },
        { sec: 'Decorazione', id: 'numero', label: 'Quantità', type: 'int', min: 2, max: 24, def: 8, show: p => p.decorazione !== 'nessuna', help: 'Spicchi o anelli in tutto; per puntini e stelle quanti per giro.' },
        { sec: 'Decorazione', id: 'rilievo', label: 'Rilievo', type: 'num', min: 0.4, max: 3, step: 0.2, def: 1, unit: 'mm', show: p => !['nessuna', 'traforata'].includes(p.decorazione) },
        ...ballTextP([['Buon Natale', 0, 0, 9], ['', 0, -35, 8], ['', 180, 0, 9], ['', 180, -35, 8]]),
        { sec: 'Scritte', id: 'carattere', label: 'Carattere', type: 'select', def: 'natalizio', options: FONT_OPTS },
        { sec: 'Scritte', id: 'stileTesto', label: 'Stile', type: 'select', def: 'rilievo', options: [['rilievo', 'In rilievo'], ['traforata', 'Traforata']], help: 'Traforata: le lettere sono buchi nel guscio, con un LED dentro si illuminano.' },
        nozzleP('Scritte'),
        { sec: 'Scritte', id: 'rilievoTesto', label: 'Rilievo scritte', type: 'num', min: 0.4, max: 4, step: 0.2, def: 1.4, unit: 'mm', show: p => p.stileTesto !== 'traforata' },
        { sec: 'Montaggio', id: 'costruzione', label: 'Costruzione', type: 'select', def: 'meta', options: [['meta', 'Due metà'], ['intera', 'Intera']], help: 'Due metà: si incollano su un anello; fuori non servono supporti, ma dentro la cupola è a sbalzo e lo slicer può chiederli. Intera: serve il supporto sotto.' },
        { sec: 'Montaggio', id: 'appendino', label: 'Appendino', type: 'select', def: 'cappuccio', options: [['cappuccio', 'Cappuccio'], ['occhiello', 'Occhiello']], help: 'Il cappuccio è un pezzo a parte, con il foro per il nastro.' },
        { sec: 'Montaggio', id: 'tolleranza', label: 'Tolleranza', type: 'num', min: 0, max: 0.8, step: 0.05, def: 0.2, unit: 'mm' },
        { sec: 'Luce', id: 'foroLed', label: 'Foro per il LED', type: 'select', def: 'nessuno', options: [['nessuno', 'Nessuno'], ['tappo', 'Sul fondo, con tappo'], ['aperto', 'Sul fondo, aperto']],
          help: 'Con tappo: per un LED a pila, che si mette e si toglie dal fondo. Aperto: per spingere dentro una lucina della catena dell\'albero.' },
        { sec: 'Luce', id: 'diamLed', label: 'Diametro foro', type: 'num', min: 6, max: 30, step: 0.5, def: 14, unit: 'mm', show: p => p.foroLed !== 'nessuno', help: 'Misura il LED o la lampadina e aggiungi 1 mm.' },
        { sec: 'Luce', id: 'filoLuci', label: 'Fessura per il filo', type: 'bool', def: false, show: p => p.appendino === 'cappuccio',
          help: 'Per le lucine su filo di rame: i LED entrano dal foro in cima e il filo esce da una fessura nel cappuccio.' },
        { sec: 'Luce', id: 'fessura', label: 'Larghezza fessura', type: 'num', min: 1, max: 4, step: 0.2, def: 2, unit: 'mm', show: p => p.appendino === 'cappuccio' && p.filoLuci },
        ...colorsP(['Colore 1 · pallina', 'Colore 2 · decorazioni e cappuccio', 'Colore 3 · scritta']),
      ],
    },
    spirale: {
      label: 'Pallina a spirale',
      params: [
        { sec: 'Forma', id: 'diametro', label: 'Diametro', type: 'num', min: 40, max: 120, step: 1, def: 70, unit: 'mm' },
        { sec: 'Forma', id: 'spessore', label: 'Spessore guscio', type: 'num', min: 0.8, max: 2.4, step: 0.2, def: 1.2, unit: 'mm' },
        { sec: 'Trama', id: 'trama', label: 'Trama', type: 'select', def: 'spirale', options: [['spirale', 'Spirale'], ['v', 'A V (spina di pesce)'], ['dritta', 'Spicchi dritti']],
          help: 'Sopra e sotto la pallina è fatta di spicchi pieghettati: è questo che la fa stampare intera senza supporti.' },
        { sec: 'Trama', id: 'spicchi', label: 'Spicchi', type: 'int', min: 16, max: 36, step: 2, def: 24, help: 'Più spicchi = pieghe più fitte e fascia più alta.' },
        { sec: 'Trama', id: 'inclinazione', label: 'Inclinazione', type: 'int', min: 5, max: 25, step: 1, def: 15, unit: '°', show: p => p.trama !== 'dritta', help: 'Più è inclinata, più la fascia per scritte e simboli si stringe.' },
        { sec: 'Trama', id: 'verso', label: 'Verso', type: 'select', def: 'destra', options: [['destra', 'Verso destra'], ['sinistra', 'Verso sinistra']], show: p => p.trama === 'spirale' },
        { sec: 'Fascia', id: 'fascia', label: 'Fascia liscia', type: 'select', def: 'continua', options: [['continua', 'Continua tutto intorno'], ['cartigli', 'Solo dove c\'è una scritta o un simbolo'], ['nessuna', 'Nessuna: spicchi dappertutto']],
          help: 'La fascia è la zona liscia a metà pallina dove vanno scritte e simboli traforati. Con "solo dove c\'è" gli spicchi continuano tutto intorno e lasciano liscio solo un riquadro attorno a ogni scritta.' },
        ...spirSideP([['Davanti', 'scritta', 'Anna', 'stella'], ['Destra', 'simbolo', '', 'fiocco'], ['Dietro', 'scritta', '2026', 'cuore'], ['Sinistra', 'simbolo', '', 'stella']]),
        { sec: 'Scritte e simboli', id: 'altSimbolo', label: 'Altezza simboli', type: 'num', min: 4, max: 40, step: 0.5, def: 14, unit: 'mm', show: p => p.fascia !== 'nessuna' },
        { sec: 'Scritte e simboli', id: 'carattere', label: 'Carattere', type: 'select', def: 'tondo', options: FONT_OPTS, show: p => p.fascia !== 'nessuna' },
        nozzleP('Scritte e simboli'),
        { sec: 'Forma', id: 'piedino', label: 'Piedino', type: 'select', def: 'piccolo', options: [['piccolo', 'Piccolo'], ['medio', 'Medio'], ['grande', 'Grande']],
          help: 'Il fondo piatto su cui poggia. Piccolo: la pallina resta rotonda. Grande: più stabile sul piatto e più spazio per il foro del LED.' },
        { sec: 'Luce', id: 'foroLed', label: 'Foro per il LED', type: 'select', def: 'tappo', options: [['nessuno', 'Nessuno'], ['tappo', 'Sul fondo, con tappo'], ['aperto', 'Sul fondo, aperto']],
          help: 'Il foro è al centro del piedino. Con tappo: per un LED a pila. Aperto: per una lucina della catena dell\'albero.' },
        { sec: 'Luce', id: 'diamLed', label: 'Diametro foro', type: 'num', min: 5, max: 25, step: 0.5, def: 10, unit: 'mm', show: p => p.foroLed !== 'nessuno', help: 'Misura il LED o la lampadina e aggiungi 1 mm.' },
        { sec: 'Luce', id: 'filoLuci', label: 'Fessura per il filo', type: 'bool', def: false, help: 'Per le lucine su filo di rame: i LED entrano dal foro in cima e il filo esce da una fessura nel cappuccio.' },
        { sec: 'Luce', id: 'fessura', label: 'Larghezza fessura', type: 'num', min: 1, max: 4, step: 0.2, def: 2, unit: 'mm', show: p => p.filoLuci },
        { sec: 'Montaggio', id: 'tolleranza', label: 'Tolleranza', type: 'num', min: 0, max: 0.8, step: 0.05, def: 0.2, unit: 'mm', help: 'Gioco del perno del cappuccio e del tappo.' },
        { sec: 'Colori', id: 'coloreFascia', label: 'Fascia di un altro colore', type: 'bool', def: false, show: p => p.fascia !== 'nessuna', help: 'Tutta la fascia centrale nel colore 3.' },
        { sec: 'Colori', id: 'righe', label: 'Righe colorate', type: 'int', min: 0, max: 6, def: 0, help: 'Righe orizzontali nel colore 4, sopra e sotto la fascia (quante per parte). Con una stampante a un colore il riquadro misure dice a che altezza cambiare filamento.' },
        { sec: 'Colori', id: 'altRighe', label: 'Altezza righe', type: 'num', min: 0.4, max: 10, step: 0.2, def: 2, unit: 'mm', show: p => p.righe > 0 },
        ...colorsP(['Colore 1 · pallina e tappo', 'Colore 2 · cappuccio', 'Colore 3 · fascia', 'Colore 4 · righe']),
      ],
    },
    piatto: {
      label: 'Decorazione',
      params: [
        ...shapeP('Forma', 75),
        layerP({ sec: 'Forma', id: 'spessore', label: 'Spessore', min: 1.6, max: 8, def: 3, help: 'I valori seguono gli strati: multipli di 0,2 e di 0,28 mm.' }),
        { sec: 'Forma', id: 'decorazioni', label: 'Disegno a colori', type: 'bool', def: true, help: 'Spento: resta solo la sagoma, del colore del pezzo (con bordo e scritta).' },
        { sec: 'Forma', id: 'bordo', label: 'Bordo', type: 'bool', def: true },
        { sec: 'Forma', id: 'bordoL', label: 'Larghezza bordo', type: 'num', min: 0.8, max: 5, step: 0.2, def: 1.6, unit: 'mm', show: p => p.bordo },
        { sec: 'Forma', id: 'stileDec', label: 'Stile decorazioni', type: 'select', def: 'uguale', options: [['uguale', 'Come la scritta'], ['rilievo', 'In rilievo'], ['filo', 'A filo'], ['inciso', 'Incisi'], ['traforata', 'Traforati']], show: p => p.decorazioni,
          help: 'Incisi: scavati nella superficie. Traforati: buchi passanti, con una cornice lungo il contorno e ponticelli dove servono. Il bordo resta in rilievo (o a filo).' },
        layerP({ sec: 'Forma', id: 'rilievo', label: 'Spessore decorazioni', min: 0.2, max: 8, def: 0.8, show: p => !(p.stileDec === 'traforata' || (p.stileDec === 'uguale' || !p.stileDec) && p.stile === 'traforata') || p.bordo,
          help: 'In rilievo: quanto sporgono. A filo e incisi: quanto entrano nel pezzo (a filo, se è pari allo spessore, passano da parte a parte).' }),
        ...textP('Giulia', '', 'corsivo', 9),
        ...markP(true),
        { sec: 'Scritta', id: 'posNome', label: 'Posizione', type: 'select', def: 'sotto', options: [['sotto', 'Targhetta sotto'], ['sopra', 'Targhetta sopra'], ['centro', 'Sul disegno']], show: p => isArtId(p.forma),
          help: 'Con la targhetta il nome sta su una striscia attaccata al disegno; sul disegno copre una parte dei colori.' },
        { sec: 'Scritta', id: 'stile', label: 'Stile', type: 'select', def: 'rilievo', options: [['rilievo', 'In rilievo'], ['filo', 'A filo'], ['inciso', 'Incisa'], ['traforata', 'Traforata']],
          help: 'In rilievo va bene anche con una stampante a un colore. A filo la superficie resta piana (serve una multicolore). Traforata: le lettere sono buchi, con ponticelli che tengono l\'interno di o, a, e.' },
        layerP({ sec: 'Scritta', id: 'profTesto', label: 'Spessore scritta', min: 0.2, max: 8, def: 0.84, show: p => p.stile === 'filo' || p.stile === 'inciso',
          help: 'Quanto entra la scritta nel pezzo: multipli di 0,2 o di 0,28 mm (0,28 · 0,56 · 0,84 · 1,12…). A filo, se è pari allo spessore, la scritta attraversa tutto e si vede dai due lati.' }),
        { sec: 'Appendere', id: 'appendino', label: 'Appendino', type: 'select', def: 'occhiello', options: [['occhiello', 'Occhiello'], ['foro', 'Foro'], ['nessuno', 'Nessuno']] },
        { sec: 'Appendere', id: 'supporto', label: 'Supporto da tavolo', type: 'bool', def: false, help: 'Base con fessura: la decorazione sta in piedi. Perfetto come segnaposto.' },
        { sec: 'Appendere', id: 'tolleranza', label: 'Gioco fessura', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', show: p => p.supporto },
        ...colorsP(['Colore 1 · pezzo', 'Colore 2', 'Colore 3', 'Colore 4'], 'forma'),
        { sec: 'Colori', id: 'colTesto', label: 'Colore della scritta', type: 'select', def: 'auto', options: [['auto', 'Auto'], ['2', '2'], ['3', '3'], ['4', '4']], help: 'Auto: il colore che si legge meglio sul pezzo. Il bordo usa il colore 2.' },
      ],
    },
    palla: {
      label: 'Palla piatta',
      params: [
        { sec: 'Forma', id: 'diametro', label: 'Diametro', type: 'num', min: 40, max: 160, step: 1, def: 80, unit: 'mm' },
        layerP({ sec: 'Forma', id: 'spessore', label: 'Spessore', min: 1.6, max: 8, def: 3, help: 'I valori seguono gli strati: multipli di 0,2 e di 0,28 mm.' }),
        { sec: 'Forma', id: 'cappuccio', label: 'Cappuccio a colori', type: 'bool', def: true, help: 'Il cappuccio in alto, con le scanalature, nel colore 2.' },
        { sec: 'Forma', id: 'bordo', label: 'Bordo', type: 'bool', def: true },
        { sec: 'Forma', id: 'bordoL', label: 'Larghezza bordo', type: 'num', min: 0.8, max: 5, step: 0.2, def: 1.6, unit: 'mm', show: p => p.bordo },
        layerP({ sec: 'Forma', id: 'rilievo', label: 'Rilievo cappuccio e bordo', min: 0.2, max: 8, def: 0.8,
          help: 'Cappuccio e bordo sono a filo solo se sfondo e figura sono entrambi a filo.' }),
        { sec: 'Sfondo', id: 'sfondo', label: 'Sfondo', type: 'select', menu: true, def: 'fiocchi', options: PALLA_OPTS,
          help: 'Riempie la palla attorno al nome (e attorno alla figura, se c\'è).' },
        { sec: 'Sfondo', id: 'quantita', label: 'Quantità', type: 'int', min: 3, max: 40, def: 14, show: p => ['fiocchi', 'stelle', 'cuori', 'pois', 'righe', 'cielo', 'bosco', 'paese', 'slitta', 'regali'].includes(p.sfondo), help: 'Quanti fiocchi, stelle o cuori.' },
        { sec: 'Sfondo', id: 'variante', label: 'Variante', type: 'int', min: 1, max: 999, def: 7, show: p => p.sfondo !== 'nessuno', help: 'Ogni numero sparge i disegni in modo diverso.' },
        { sec: 'Sfondo', id: 'fascia', label: 'Fascia dietro il nome', type: 'bool', def: false, help: 'Una striscia nel colore 2 attraversa la palla e il nome ci sta sopra.' },
        ...decoStyleP('Sfondo', 'stileSfondo', 'spSfondo', p => p.sfondo !== 'nessuno' || p.fascia),
        { sec: 'Figura', id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'figura', use: { figura: 'svg' }, unuse: { figura: 'nessuna' }, using: p => p.figura === 'svg' },
        { sec: 'Figura', id: 'figura', label: 'Figura', type: 'select', menu: true, def: 'nessuna', options: FIG_OPTS,
          help: 'Un disegno grande sopra il nome, a colori: pinguino, renna, Babbo Natale… o il tuo SVG. Lo sfondo gli lascia spazio attorno.' },
        ...decoStyleP('Figura', 'stileFigura', 'spFigura', p => p.figura !== 'nessuna'),
        ...textP('Giulia', '', 'corsivo', 12),
        ...markP(true),
        { sec: 'Scritta', id: 'stile', label: 'Stile', type: 'select', def: 'rilievo', options: [['rilievo', 'In rilievo'], ['filo', 'A filo'], ['inciso', 'Incisa'], ['traforata', 'Traforata']],
          help: 'In rilievo va bene anche con una stampante a un colore. A filo la superficie resta piana (serve una multicolore).' },
        layerP({ sec: 'Scritta', id: 'profTesto', label: 'Spessore scritta', min: 0.2, max: 8, def: 0.84, show: p => p.stile === 'filo' || p.stile === 'inciso',
          help: 'Quanto entra la scritta nel pezzo: multipli di 0,2 o di 0,28 mm (0,28 · 0,56 · 0,84 · 1,12…). A filo, se è pari allo spessore, la scritta si vede dai due lati.' }),
        { sec: 'Appendere', id: 'appendino', label: 'Appendino', type: 'select', def: 'occhiello', options: [['occhiello', 'Occhiello'], ['foro', 'Foro'], ['nessuno', 'Nessuno']] },
        { sec: 'Appendere', id: 'supporto', label: 'Supporto da tavolo', type: 'bool', def: false, help: 'Base con fessura: la palla sta in piedi, come segnaposto.' },
        { sec: 'Appendere', id: 'tolleranza', label: 'Gioco fessura', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', show: p => p.supporto },
        ...colorsP(['Colore 1 · palla', 'Colore 2 · cappuccio, disegni, bordo', 'Colore 3 · scritta e dettagli', 'Colore 4']),
        { sec: 'Colori', id: 'colTesto', label: 'Colore della scritta', type: 'select', def: '3', options: [['2', '2'], ['3', '3'], ['4', '4']] },
      ],
    },
    albero: {
      label: 'Albero',
      params: [
        { sec: 'Stile', id: 'stile', label: 'Stile', type: 'select', def: 'spirale', options: [['spirale', 'A spirale'], ['strati', 'A strati'], ['incastro', 'Da incastrare']],
          help: 'A spirale e a strati si stampano in piedi. Da incastrare: due sagome piatte che si infilano a croce.' },
        { sec: 'Misure', id: 'altezza', label: 'Altezza', type: 'num', min: 60, max: 300, step: 1, def: 140, unit: 'mm' },
        { sec: 'Misure', id: 'diametro', label: 'Diametro', type: 'num', min: 30, max: 220, step: 1, def: 90, unit: 'mm', show: p => p.stile !== 'incastro' },
        { sec: 'Misure', id: 'punte', label: 'Punte', type: 'int', min: 3, max: 12, def: 6, show: p => p.stile !== 'incastro' },
        { sec: 'Misure', id: 'torsione', label: 'Torsione', type: 'num', min: 0, max: 720, step: 15, def: 120, unit: '°', show: p => p.stile !== 'incastro' },
        { sec: 'Misure', id: 'strati', label: 'Strati', type: 'int', min: 3, max: 30, def: 10, show: p => p.stile === 'strati' },
        { sec: 'Misure', id: 'alterna', label: 'Strati a colori alterni', type: 'bool', def: true, show: p => p.stile === 'strati' },
        { sec: 'Misure', id: 'spessore', label: 'Spessore sagome', type: 'num', min: 1.6, max: 5, step: 0.2, def: 2.4, unit: 'mm', show: p => p.stile === 'incastro' },
        { sec: 'Misure', id: 'tolleranza', label: 'Gioco fessure', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', show: p => p.stile === 'incastro' },
        { sec: 'Misure', id: 'decorazioni', label: 'Palline e stella a colori', type: 'bool', def: true, show: p => p.stile === 'incastro' },
        { sec: 'Misure', id: 'rilievo', label: 'Rilievo decorazioni', type: 'num', min: 0.4, max: 3, step: 0.2, def: 0.8, unit: 'mm', show: p => p.stile === 'incastro' && p.decorazioni },
        { sec: 'Extra', id: 'stella', label: 'Stella in cima', type: 'bool', def: true, show: p => p.stile !== 'incastro' },
        { sec: 'Extra', id: 'base', label: 'Base con scritta', type: 'bool', def: true, show: p => p.stile !== 'incastro' },
        ...textP('Buon Natale', '', 'corsivo', 7, p => p.stile !== 'incastro' && p.base),
        ...markP(false),
        ...colorsP(['Colore 1 · albero', 'Colore 2 · stella, palline, scritta', 'Colore 3 · base']),
        ...markColorsP(3),
      ],
    },
    stella: {
      label: 'Stella',
      params: [
        { sec: 'Stella', id: 'uso', label: 'Uso', type: 'select', def: 'puntale', options: [['puntale', 'Puntale per l\'albero'], ['pendente', 'Da appendere']] },
        { sec: 'Stella', id: 'diametro', label: 'Diametro', type: 'num', min: 30, max: 220, step: 1, def: 110, unit: 'mm' },
        { sec: 'Stella', id: 'punte', label: 'Punte', type: 'int', min: 4, max: 12, def: 5 },
        { sec: 'Stella', id: 'rapporto', label: 'Larghezza punte', type: 'num', min: 25, max: 70, step: 1, def: 42, unit: '%', help: 'Basso = punte sottili, alto = stella paffuta.' },
        { sec: 'Stella', id: 'spessore', label: 'Spessore', type: 'num', min: 8, max: 50, step: 1, def: 22, unit: '%' },
        { sec: 'Attacco', id: 'attacco', label: 'Diametro cima dell\'albero', type: 'num', min: 6, max: 40, step: 0.5, def: 20, unit: 'mm', show: p => p.uso === 'puntale', help: 'Misura il ramo in cima: il tubo si stringe verso l\'alto e si adatta.' },
        { sec: 'Attacco', id: 'lunghezzaAttacco', label: 'Lunghezza tubo', type: 'num', min: 15, max: 90, step: 1, def: 40, unit: 'mm', show: p => p.uso === 'puntale' },
        { sec: 'Attacco', id: 'tolleranza', label: 'Tolleranza', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', show: p => p.uso === 'puntale' },
        { sec: 'Colori', id: 'col1', label: 'Colore', type: 'color', def: '#e3b341' },
      ],
    },
    lanterna: {
      label: 'Lanterna',
      params: [
        { sec: 'Forma', id: 'forma', label: 'Forma', type: 'select', def: 'tonda', options: [['tonda', 'Tonda'], ['esagonale', 'Esagonale']] },
        { sec: 'Forma', id: 'diametro', label: 'Diametro', type: 'num', min: 60, max: 180, step: 1, def: 80, unit: 'mm' },
        { sec: 'Forma', id: 'altezza', label: 'Altezza', type: 'num', min: 60, max: 250, step: 1, def: 110, unit: 'mm' },
        { sec: 'Forma', id: 'parete', label: 'Parete', type: 'num', min: 1.2, max: 4, step: 0.4, def: 2, unit: 'mm' },
        { sec: 'Motivi', id: 'disegno', label: 'Motivo traforato', type: 'select', def: 'stelle', options: [['stelle', 'Stelle'], ['fiocchi', 'Fiocchi di neve'], ['alberi', 'Alberi'], ['cuori', 'Cuori']] },
        { sec: 'Motivi', id: 'motivo', label: 'Dimensione', type: 'num', min: 8, max: 45, step: 1, def: 18, unit: 'mm' },
        { sec: 'Motivi', id: 'righe', label: 'Righe', type: 'int', min: 1, max: 8, def: 3 },
        { sec: 'Motivi', id: 'perRiga', label: 'Per riga', type: 'int', min: 3, max: 24, def: 7, help: 'Nella esagonale si arrotonda a uno per faccia.' },
        ...textP('Buone Feste', '', 'natalizio', 8),
        ...markP(false),
        { sec: 'Scritta', id: 'stileTesto', label: 'Stile', type: 'select', def: 'rilievo', options: [['rilievo', 'In rilievo'], ['traforata', 'Traforata']], help: 'Traforata: la luce del lumino passa attraverso le lettere.' },
        { sec: 'Lumino', id: 'tolleranza', label: 'Gioco lumino', type: 'num', min: 0, max: 2, step: 0.1, def: 0.6, unit: 'mm', help: 'Per lumini LED da 38 mm.' },
        ...colorsP(['Colore 1 · lanterna', 'Colore 2 · scritta']),
        ...markColorsP(2),
      ],
    },
    formina: {
      label: 'Formina',
      params: [
        ...shapeP('Forma', 70),
        { sec: 'Formina', id: 'profondita', label: 'Altezza taglio', type: 'num', min: 8, max: 30, step: 1, def: 14, unit: 'mm' },
        { sec: 'Formina', id: 'lama', label: 'Spessore lama', type: 'num', min: 0.4, max: 2, step: 0.2, def: 0.8, unit: 'mm', help: 'Due linee con ugello 0,4 mm: abbastanza sottile per tagliare.' },
        { sec: 'Formina', id: 'flangia', label: 'Bordo per premere', type: 'num', min: 2, max: 10, step: 0.5, def: 4, unit: 'mm' },
        { sec: 'Timbro', id: 'timbro', label: 'Timbro per decorare', type: 'bool', def: true, help: 'Una piastrina che entra nella formina e stampa disegni e scritta sul biscotto.' },
        { sec: 'Timbro', id: 'decorazioni', label: 'Disegni sul timbro', type: 'bool', def: true, show: p => p.timbro },
        ...textP('', '', 'tondo', 8, p => p.timbro || p.forma === 'nome').filter(q => q.id !== 'rilievoTesto'),
        ...markP(true),
        { sec: 'Timbro', id: 'tolleranza', label: 'Gioco timbro', type: 'num', min: 0, max: 1.5, step: 0.1, def: 0.4, unit: 'mm', show: p => p.timbro },
        ...colorsP(['Colore 1 · formina', 'Colore 2 · timbro']),
        ...markColorsP(2),
      ],
    },
    mensola: {
      label: 'Reggimensola',
      params: [
        { sec: 'Forma', id: 'tipo', label: 'Rinforzo', type: 'select', menu: true, def: 'triangolo', options: [['triangolo', 'Triangolo pieno'], ['alleggerito', 'Triangolo traforato'], ['diagonale', 'Puntone diagonale'], ['curvo', 'Raccordo curvo'], ['arco', 'Arco'], ['nessuno', 'Nessuno (squadra a L)']],
          help: 'Il triangolo pieno è il più robusto. Senza rinforzo va bene solo per pesi leggeri.' },
        { sec: 'Misure', id: 'profondita', label: 'Profondità (sotto la mensola)', type: 'num', min: 40, max: 400, step: 5, def: 150, unit: 'mm', help: 'Di solito 2/3 della profondità della mensola, o tutta.' },
        { sec: 'Misure', id: 'altezza', label: 'Altezza (sul muro)', type: 'num', min: 30, max: 400, step: 5, def: 120, unit: 'mm' },
        { sec: 'Misure', id: 'larghezza', label: 'Larghezza', type: 'num', min: 10, max: 80, step: 1, def: 25, unit: 'mm' },
        { sec: 'Misure', id: 'spessore', label: 'Spessore', type: 'num', min: 3, max: 15, step: 0.5, def: 7, unit: 'mm' },
        { sec: 'Misure', id: 'rinforzo', label: 'Estensione rinforzo', type: 'int', min: 30, max: 100, step: 5, def: 75, unit: '%', show: p => p.tipo !== 'nessuno', help: 'Quanta parte dei due bracci copre il rinforzo. Sotto resta lo spazio per le viti al muro.' },
        { sec: 'Misure', id: 'labbro', label: 'Labbro in punta', type: 'num', min: 0, max: 20, step: 1, def: 0, unit: 'mm', help: 'Un dentino sulla punta che impedisce alla mensola di scivolare (ottimo per il vetro). 0 = nessuno.' },
        { sec: 'Piastra al muro', id: 'sopra', label: 'Sale sopra la mensola', type: 'num', min: 0, max: 200, step: 5, def: 0, unit: 'mm', help: 'La parte contro il muro continua sopra la mensola, con altre viti al muro: la mensola si appoggia contro la piastra. 0 = non sale.' },
        { sec: 'Piastra al muro', id: 'spMensola', label: 'Spessore della mensola', type: 'num', min: 5, max: 60, step: 1, def: 18, unit: 'mm', show: p => p.sopra > 0, help: 'Serve solo per la mensola d\'esempio nell\'anteprima.' },
        { sec: 'Piastra al muro', id: 'larghPiastra', label: 'Larghezza piastra', type: 'num', min: 10, max: 200, step: 1, def: 25, unit: 'mm', help: 'Larga come la squadra o di più (non meno). Più larga della squadra si stampa sulla schiena.' },
        { sec: 'Viti', id: 'foriMuro', label: 'Viti al muro', type: 'int', min: 0, max: 4, def: 2 },
        { sec: 'Viti', id: 'foriSopra', label: 'Viti al muro sopra la mensola', type: 'int', min: 0, max: 6, def: 2, show: p => p.sopra > 0 },
        { sec: 'Viti', id: 'foriMensola', label: 'Viti sotto la mensola', type: 'int', min: 0, max: 4, def: 1 },
        { sec: 'Viti', id: 'vite', label: 'Diametro vite', type: 'num', min: 2.5, max: 8, step: 0.5, def: 4, unit: 'mm' },
        { sec: 'Viti', id: 'svasati', label: 'Fori svasati', type: 'bool', def: true, help: 'Per viti a testa piana: la testa resta a filo.' },
        { sec: 'Stampa', id: 'copie', label: 'Quante', type: 'int', min: 1, max: 8, def: 2 },
      ],
    },
    gancio: {
      label: 'Gancio',
      params: [
        { sec: 'Tipo', id: 'tipo', label: 'Tipo', type: 'select', menu: true, def: 'muro', options: [['muro', 'A muro (anche appendiabiti)'], ['porta', 'Sopra porta o anta'], ['tubo', 'Per tubo o bastone'], ['esse', 'A S']] },
        { sec: 'Gancio', id: 'numero', label: 'Numero di ganci', type: 'int', min: 1, max: 10, def: 1, show: p => p.tipo === 'muro' || p.tipo === 'porta' },
        { sec: 'Gancio', id: 'interasse', label: 'Distanza tra i ganci', type: 'num', min: 15, max: 200, step: 1, def: 60, unit: 'mm', show: p => (p.tipo === 'muro' || p.tipo === 'porta') && p.numero > 1 },
        { sec: 'Gancio', id: 'larghezza', label: 'Larghezza gancio', type: 'num', min: 6, max: 60, step: 1, def: 15, unit: 'mm' },
        { sec: 'Gancio', id: 'larghPiastra', label: 'Larghezza piastra', type: 'num', min: 0, max: 400, step: 1, def: 0, unit: 'mm', show: p => p.tipo === 'muro' || p.tipo === 'porta',
          help: 'A muro: la piastra contro il muro. Sopra porta: il ponte che si appoggia sulla porta. 0 = automatica (quanto serve per i ganci e per viti o magneti). I ganci restano centrati.' },
        { sec: 'Gancio', id: 'spessoreG', label: 'Spessore gancio', type: 'num', min: 2.5, max: 15, step: 0.5, def: 6, unit: 'mm' },
        { sec: 'Gancio', id: 'sporgenza', label: 'Sporgenza', type: 'num', min: 8, max: 150, step: 1, def: 40, unit: 'mm', show: p => p.tipo !== 'esse', help: 'Quanto esce il gancio prima di curvare.' },
        { sec: 'Gancio', id: 'raggio', label: 'Raggio curva', type: 'num', min: 3, max: 40, step: 0.5, def: 10, unit: 'mm', show: p => p.tipo !== 'esse' },
        { sec: 'Gancio', id: 'punta', label: 'Altezza punta', type: 'num', min: 4, max: 80, step: 1, def: 18, unit: 'mm', show: p => p.tipo !== 'esse', help: 'Quanto sale la punta: più alta, meno le cose scivolano via.' },
        { sec: 'Gancio', id: 'inclinazione', label: 'Inclinazione', type: 'int', min: 0, max: 45, step: 5, def: 0, unit: '°', show: p => p.tipo === 'muro' || p.tipo === 'porta', help: 'Il braccio sale verso l\'alto.' },
        { sec: 'Gancio', id: 'aperturaSopra', label: 'Apertura sopra', type: 'num', min: 8, max: 100, step: 1, def: 25, unit: 'mm', show: p => p.tipo === 'esse' },
        { sec: 'Gancio', id: 'aperturaSotto', label: 'Apertura sotto', type: 'num', min: 8, max: 100, step: 1, def: 30, unit: 'mm', show: p => p.tipo === 'esse' },
        { sec: 'Gancio', id: 'gambo', label: 'Lunghezza gambo', type: 'num', min: 0, max: 200, step: 1, def: 30, unit: 'mm', show: p => p.tipo === 'esse' || p.tipo === 'tubo' },
        { sec: 'Gancio', id: 'pomello', label: 'Pallino in punta', type: 'bool', def: true, help: 'Punta arrotondata: non graffia e non strappa i vestiti.' },
        { sec: 'Piastra', id: 'altezzaP', label: 'Altezza piastra', type: 'num', min: 15, max: 200, step: 1, def: 50, unit: 'mm', show: p => p.tipo === 'muro' },
        { sec: 'Piastra', id: 'spessoreP', label: 'Spessore piastra', type: 'num', min: 2, max: 12, step: 0.5, def: 5, unit: 'mm', show: p => p.tipo === 'muro' },
        { sec: 'Piastra', id: 'fissaggio', label: 'Fissaggio', type: 'select', def: 'viti', options: [['viti', 'Viti'], ['biadesivo', 'Biadesivo'], ['magneti', 'Magneti']], show: p => p.tipo === 'muro' },
        { sec: 'Piastra', id: 'viti', label: 'Viti', type: 'int', min: 1, max: 8, def: 2, show: p => p.tipo === 'muro' && p.fissaggio === 'viti' },
        { sec: 'Piastra', id: 'vite', label: 'Diametro vite', type: 'num', min: 2.5, max: 8, step: 0.5, def: 4, unit: 'mm', show: p => p.tipo === 'muro' && p.fissaggio === 'viti' },
        { sec: 'Piastra', id: 'svasati', label: 'Fori svasati', type: 'bool', def: true, show: p => p.tipo === 'muro' && p.fissaggio === 'viti' },
        { sec: 'Piastra', id: 'numMag', label: 'Magneti', type: 'int', min: 1, max: 8, def: 2, show: p => p.tipo === 'muro' && p.fissaggio === 'magneti' },
        { sec: 'Piastra', id: 'magnete', label: 'Diametro magnete', type: 'num', min: 4, max: 25, step: 0.5, def: 10, unit: 'mm', show: p => p.tipo === 'muro' && p.fissaggio === 'magneti' },
        { sec: 'Piastra', id: 'magneteH', label: 'Altezza magnete', type: 'num', min: 1, max: 6, step: 0.5, def: 3, unit: 'mm', show: p => p.tipo === 'muro' && p.fissaggio === 'magneti' },
        { sec: 'Porta', id: 'porta', label: 'Spessore porta o anta', type: 'num', min: 5, max: 70, step: 0.5, def: 40, unit: 'mm', show: p => p.tipo === 'porta', help: 'Misuralo con il metro in cima alla porta. Funziona anche sul bordo di una mensola o di un\'anta.' },
        { sec: 'Porta', id: 'ponte', label: 'Spessore sopra la porta', type: 'num', min: 1.2, max: 6, step: 0.2, def: 2.4, unit: 'mm', show: p => p.tipo === 'porta', help: 'Deve passare nella fessura tra porta e telaio.' },
        { sec: 'Porta', id: 'esterno', label: 'Lato esterno', type: 'num', min: 8, max: 120, step: 1, def: 25, unit: 'mm', show: p => p.tipo === 'porta', help: 'Quanto scende dal lato opposto ai ganci.' },
        { sec: 'Porta', id: 'interno', label: 'Lato dei ganci', type: 'num', min: 15, max: 300, step: 1, def: 70, unit: 'mm', show: p => p.tipo === 'porta' },
        { sec: 'Tubo', id: 'tubo', label: 'Diametro tubo', type: 'num', min: 6, max: 60, step: 0.5, def: 25, unit: 'mm', show: p => p.tipo === 'tubo' },
        { sec: 'Tubo', id: 'apertura', label: 'Apertura', type: 'int', min: 60, max: 98, step: 1, def: 85, unit: '%', show: p => p.tipo === 'tubo', help: 'Larghezza dell\'imbocco rispetto al tubo: più bassa, più forte lo scatto.' },
        { sec: 'Stampa', id: 'tolleranza', label: 'Gioco', type: 'num', min: 0, max: 2, step: 0.1, def: 0.4, unit: 'mm', show: p => p.tipo === 'porta' || p.tipo === 'tubo' || (p.tipo === 'muro' && p.fissaggio === 'magneti') },
        { sec: 'Stampa', id: 'stampa', label: 'Orientamento', type: 'select', def: 'fianco', options: [['fianco', 'Sul fianco'], ['schiena', 'Sulla schiena']], show: p => p.tipo === 'muro',
          help: 'Sul fianco gli strati seguono la curva: il gancio è molto più robusto. Sulla schiena è più comodo con tanti ganci.' },
      ],
    },
    vite: {
      label: 'Vite',
      params: [
        ...threadP(30),
        ...headP([...HEAD_OPTS, ['nessuna', 'Senza testa']], 'esagonale'),
        ...threadTail(SCREW_PRINT),
      ],
    },
    bullone: {
      label: 'Bullone',
      params: [
        ...threadP(40),
        ...headP(HEAD_OPTS, 'esagonale'),
        { sec: 'Dado e rondelle', id: 'dado', label: 'Dado', type: 'select', def: 'esagonale', options: [['esagonale', 'Esagonale'], ['zigrinato', 'Zigrinato'], ['alette', 'Ad alette']] },
        { sec: 'Dado e rondelle', id: 'dadoAlto', label: 'Dado alto', type: 'bool', def: false, help: 'Una volta e mezza l\'altezza normale: più filetti in presa, più resistente.' },
        { sec: 'Dado e rondelle', id: 'rondelle', label: 'Rondelle', type: 'select', def: '1', options: [['0', 'Nessuna'], ['1', 'Una'], ['2', 'Due']] },
        ...threadTail(SCREW_PRINT),
      ],
    },
    perno: {
      label: 'Perno',
      params: [
        { sec: 'Tipo', id: 'tipo', label: 'Tipo di perno', type: 'select', def: 'scatto', options: [['scatto', 'A scatto'], ['cilindrico', 'Spina liscia'], ['testa', 'Con testa']],
          help: 'A scatto: si infila nel foro e si aggancia da solo, per unire due pezzi stampati. Spina: perno di centraggio. Con testa: cerniere e snodi.' },
        { sec: 'Tipo', id: 'estremita', label: 'Estremità', type: 'select', def: 'doppio', options: [['doppio', 'Doppio (unisce due pezzi)'], ['testa', 'Con testa']], show: p => p.tipo === 'scatto' },
        { sec: 'Misure', id: 'diam', label: 'Diametro', type: 'num', min: 3, max: 30, step: 0.5, def: 8, unit: 'mm' },
        { sec: 'Misure', id: 'presa', label: 'Spessore da attraversare', type: 'num', min: 1, max: 60, step: 0.5, def: 6, unit: 'mm', show: p => p.tipo === 'scatto', help: 'Spessore del pezzo nel foro (per il doppio: di ciascun pezzo). Il dentino si aggancia sull\'altra faccia.' },
        { sec: 'Misure', id: 'lunghezza', label: 'Lunghezza', type: 'num', min: 4, max: 300, step: 1, def: 30, unit: 'mm', show: p => p.tipo !== 'scatto' },
        { sec: 'Misure', id: 'smusso', label: 'Estremità smussate', type: 'bool', def: true, show: p => p.tipo !== 'scatto' },
        { sec: 'Misure', id: 'coppiglia', label: 'Foro per coppiglia', type: 'bool', def: true, show: p => p.tipo === 'testa' },
        { sec: 'Prova', id: 'tolleranza', label: 'Tolleranza stampante', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', help: 'Gioco tra perno e foro: decide il foro consigliato e quello della piastrina.' },
        { sec: 'Prova', id: 'prova', label: 'Piastrina di prova', type: 'bool', def: true, help: 'Pezzo piccolo con il foro giusto, per provare l\'incastro prima di stampare il progetto vero.' },
        { sec: 'Stampa', id: 'stampa', label: 'Orientamento', type: 'select', def: 'sdraiata', options: [['sdraiata', 'Sdraiato'], ['piedi', 'In piedi']], show: p => p.tipo !== 'scatto', help: 'Sdraiato (con un lato piatto) gli strati corrono lungo il perno: molto più robusto.' },
      ],
    },
    base: {
      label: 'Base',
      params: [
        ...grid(4, 3, 0, false),
        { sec: 'Struttura', id: 'fondoBase', label: 'Spessore fondo', type: 'num', min: 0, max: 6, step: 0.2, def: 0, unit: 'mm', help: '0 = solo telaio, più leggero. Con i magneti il fondo viene aggiunto in automatico.' },
        ...common,
      ],
    },
    powerbank: {
      label: 'Powerbank',
      artKey: 'disegno',
      params: [
        { sec: 'Scheda', id: 'scheda', label: 'Scheda', type: 'select', menu: true, def: 'lcd24', options: [['lcd24', '18650 LCD 2.4A, 2 USB (display) · Amazon e AliExpress'], ['ip5328p', 'IP5328P 18 W QC · Amazon e AliExpress'], ['dusb21', 'Doppia USB 1 A + 2,1 A con LCD e torcia · Amazon e AliExpress'], ['sw6106', 'SW6106 18 W PD/QC · solo AliExpress'], ['sw6208', 'SW6208 22,5 W PD/QC · solo AliExpress']],
          help: 'Solo schede con le misure pubblicate dal venditore (disegno quotato o misure dichiarate). Le posizioni delle porte sono prese in scala dalle foto dall\'alto. Accanto al nome: dove si compra.' },
        { sec: 'Scheda', id: 'gioco', label: 'Gioco attorno alle porte', type: 'num', min: 0.2, max: 1.5, step: 0.1, def: 0.6, unit: 'mm', help: 'Le posizioni delle porte vengono dalle foto (±0,5 mm): con 0,6 mm per lato le spine entrano anche se la scheda è un po\' diversa.' },
        { sec: 'Scheda', id: 'fianchi', label: 'Porte sui fianchi', type: 'bool', def: true, help: 'Alcune schede hanno un ingresso anche sul lato corto (Lightning o micro-USB). Se ricarichi con la USB-C puoi chiuderlo.' },
        { sec: 'Scheda', id: 'pulsante', label: 'Pulsante', type: 'select', def: 'lamella', options: [['lamella', 'Linguetta da premere'], ['foro', 'Foro']],
          help: 'Linguetta: un pezzo della parete si piega e un dentino preme il tasto della scheda. Foro: il tasto si preme con una punta. La IP5328P non ha pulsante; sulla scheda con la torcia il pulsante accende la torcia.' },
        { sec: 'Celle', id: 'cella', label: 'Celle', type: 'select', def: 'normale', show: p => p.contatti !== 'portapile', options: [['normale', '18650 normali (65 mm)'], ['protetta', '18650 protette (fino a 70 mm)']],
          help: 'Le protette hanno un circuito sotto la guaina e sono più lunghe: se non sai quali hai, scegli protette.' },
        { sec: 'Celle', id: 'celle', label: 'Numero di celle', type: 'int', min: 1, max: 8, def: 2, show: p => p.contatti !== 'portapile', help: 'Tutte in parallelo, una accanto all\'altra. Ogni cella aggiunge circa 3000 mAh.' },
        { sec: 'Celle', id: 'posizione', label: 'Posizione celle', type: 'select', def: 'dietro', options: [['dietro', 'Dietro la scheda'], ['destra', 'A destra della scheda'], ['sinistra', 'A sinistra della scheda']],
          help: 'Dove stanno le celle rispetto alla scheda. Di fianco: il lato corto della scheda che guarda le celle resta chiuso (se lì c\'è il pulsante o una porta, il riquadro misure lo dice). Combinala con l\'orientamento e guarda le misure esterne.' },
        { sec: 'Celle', id: 'orientamento', label: 'Orientamento celle', type: 'select', def: 'lungo', options: [['lungo', 'Parallele alla scheda'], ['traverso', 'Perpendicolari alla scheda']],
          help: 'Parallele: le celle sono nello stesso verso della scheda (da sinistra a destra). Perpendicolari: le celle vanno dal davanti verso il retro. Il riquadro misure dice le dimensioni esterne: prova le combinazioni con la posizione.' },
        { sec: 'Celle', id: 'spazioFili', label: 'Spazio per i fili', type: 'num', min: 0, max: 30, step: 1, def: 8, unit: 'mm',
          help: 'Distanza tra la scheda e le celle (dietro o di fianco): lì passano i fili saldati sulle piazzole B+ e B− (e i morsetti, se ne usi). La scatola si allunga di altrettanto.' },
        { sec: 'Celle', id: 'contatti', label: 'Contatti', type: 'select', def: 'portapile', options: [['portapile', 'Portapile già pronto (senza saldare)'], ['molle', 'Piastrine a molla sciolte'], ['saldate', 'Pacco saldato']],
          help: 'Portapile già pronto: un portapile in parallelo con i fili, con le misure che scrivi tu; la scatola lo tiene in una cornice e non si salda niente sulle celle. Piastrine sciolte: fessure per le piastrine a molla da 16 × 16,5 mm (vanno saldati i fili). Pacco saldato: per un pacco già fatto con nastro di nichel.' },
        { sec: 'Celle', id: 'ppL', label: 'Lunghezza portapile', type: 'num', min: 30, max: 160, step: 0.5, def: 78, unit: 'mm', show: p => p.contatti === 'portapile', help: 'Misura del tuo portapile lungo le celle, fili esclusi. La scatola lascia 0,4 mm di gioco per lato.' },
        { sec: 'Celle', id: 'ppW', label: 'Larghezza portapile', type: 'num', min: 15, max: 160, step: 0.5, def: 40, unit: 'mm', show: p => p.contatti === 'portapile' },
        { sec: 'Celle', id: 'ppH', label: 'Altezza portapile', type: 'num', min: 15, max: 40, step: 0.5, def: 22, unit: 'mm', show: p => p.contatti === 'portapile' },
        { sec: 'Celle', id: 'ppN', label: 'Quanti portapile', type: 'int', min: 1, max: 6, def: 1, show: p => p.contatti === 'portapile', help: 'Uno accanto all\'altro dietro la scheda. Unisci tutti i fili rossi con un morsetto a leva e tutti i neri con un altro.' },
        { sec: 'Celle', id: 'ppCelle', label: 'Celle per portapile', type: 'int', min: 1, max: 6, def: 2, show: p => p.contatti === 'portapile', help: 'Serve solo per calcolare la capacità.' },
        { sec: 'Coperchio', id: 'coperchio', label: 'Chiusura', type: 'select', def: 'slitta', options: [['slitta', 'A slitta'], ['viti', 'A viti nascoste']],
          help: 'A slitta: il coperchio scorre nelle guide e si apre senza attrezzi. A viti nascoste: quattro viti svasate da sotto, sopra non si vede niente.' },
        { sec: 'Coperchio', id: 'vite', label: 'Viti', type: 'select', def: 'M3', options: [['M3', 'M3'], ['M2.5', 'M2,5']], show: p => p.coperchio === 'viti' && p.viteTipo !== 'stampata', help: 'Viti a testa svasata, lunghe 16–20 mm: si avvitano nel coperchio.' },
        { sec: 'Coperchio', id: 'viteTipo', label: 'Tipo di viti', type: 'select', def: 'metallica', show: p => p.coperchio === 'viti', options: [['metallica', 'Metalliche (le compri)'], ['stampata', 'Stampate (le stampi)']],
          help: 'Stampate: le 4 viti del coperchio escono come pezzi da stampare, con il filetto ISO del generatore Viti e bulloni. Si avvitano dal basso nel coperchio, che ha boccole filettate.' },
        { sec: 'Coperchio', id: 'viteM', label: 'Misura delle viti stampate', type: 'select', def: 'M6', show: p => p.coperchio === 'viti' && p.viteTipo === 'stampata', options: [['M6', 'M6 (la più piccola che viene)'], ['M8', 'M8 (più robusta)'], ['M10', 'M10']],
          help: 'Con ugello da 0,4 mm sotto M6 il filetto non viene (i fianchi sono più sottili di una passata). M6 va stampata con strati sottili e almeno 4 perimetri; M8 e M10 sono molto più resistenti. Più è grande la vite, più grosse sono le colonnine e più cresce la scatola.' },
        { sec: 'Coperchio', id: 'viteGioco', label: 'Gioco del filetto', type: 'num', min: 0.1, max: 0.8, step: 0.05, def: 0.3, unit: 'mm', show: p => p.coperchio === 'viti' && p.viteTipo === 'stampata', help: 'Spazio tra i fianchi della vite e del foro, come in Viti e bulloni. Se la vite è dura aumentalo, se balla diminuiscilo: stampa prima una vite sola.' },
        { sec: 'Coperchio', id: 'spCoperchio', label: 'Spessore coperchio', type: 'num', min: 1.6, max: 3, step: 0.2, def: 2, unit: 'mm' },
        { sec: 'Coperchio', id: 'tolleranza', label: 'Tolleranza', type: 'num', min: 0, max: 0.8, step: 0.05, def: 0.3, unit: 'mm', show: p => p.coperchio === 'slitta', help: 'Gioco del coperchio nelle guide. Se scorre duro aumentala, se balla diminuiscila.' },
        { sec: 'Coperchio decorato', id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'disegno', use: { disegno: 'svg' }, unuse: { disegno: 'nessuno' }, using: p => p.disegno === 'svg' },
        { sec: 'Coperchio decorato', id: 'disegno', label: 'Disegno', type: 'select', def: 'nessuno', options: [['nessuno', 'Nessuno'], ['svg', 'Il tuo SVG']], show: () => false },   // lo imposta il riquadro qui sopra
        { sec: 'Coperchio decorato', id: 'altDisegno', label: 'Altezza disegno', type: 'num', min: 8, max: 80, step: 1, def: 30, unit: 'mm', show: p => p.disegno === 'svg' },
        { sec: 'Coperchio decorato', id: 'rotDisegno', label: 'Rotazione disegno', type: 'int', min: 0, max: 345, step: 15, def: 0, unit: '°', wrap: true, show: p => p.disegno === 'svg' },
        { sec: 'Coperchio decorato', id: 'posDisegno', label: 'Posizione disegno', type: 'pad', def: [0, 0], show: p => p.disegno === 'svg', help: 'Le frecce spostano il disegno sul coperchio; il centro lo rimette al suo posto. Dove tocca finestre, fori o il bordo viene tagliato.' },
        { sec: 'Coperchio decorato', id: 'stileCop', label: 'Stile', type: 'select', def: 'filo', options: [['filo', 'A filo (a colori)'], ['inciso', 'Inciso'], ['traforata', 'Traforato']],
          help: 'Il coperchio si stampa capovolto, con la faccia di sopra sul piatto. A filo: i colori sono nei primi strati e la superficie resta liscia (multicolore, o cambio filamento). Inciso: scavato. Traforato: passa da parte a parte.' },
        layerP({ sec: 'Coperchio decorato', id: 'profCop', label: 'Spessore', min: 0.2, max: 1.6, def: 0.2, show: p => p.stileCop !== 'traforata' }),
        ...withRot(linesP('Scritta sul coperchio', '', '', 8, null, 60, 'Altezza delle maiuscole (i loghi sono alti 1,35 volte). Con i pulsanti sotto il campo metti il logo SP e i visi. Se non ci sta viene ridotta da sola.')),
        { sec: 'Scritta sul coperchio', id: 'carattere', label: 'Carattere', type: 'select', def: 'tondo', options: FONT_OPTS },
        Object.assign(nozzleP('Scritta sul coperchio'), { show: p => hasLogo(p) || p.disegno === 'svg' }),
        ...markP(true),
        ...colorsP(['Colore 1 · coperchio', 'Colore 2', 'Colore 3', 'Colore 4'], 'disegno'),
        { sec: 'Colori', id: 'colTesto', label: 'Colore della scritta', type: 'select', def: 'auto', options: [['auto', 'Auto'], ['2', '2'], ['3', '3'], ['4', '4']], help: 'Solo con lo stile a filo. Auto: il colore che si legge meglio sul coperchio.' },
        { sec: 'Forma', id: 'raggio', label: 'Raggio angoli', type: 'num', min: 1, max: 12, step: 0.5, def: 6, unit: 'mm' },
        { sec: 'Forma', id: 'pareti', label: 'Spessore pareti', type: 'num', min: 0.8, max: 3.2, step: 0.4, def: 2, unit: 'mm', help: 'Sotto 1,6 mm solo con il coperchio a viti (la slitta si scava nelle pareti). Con ugello 0,4: 0,8 = 2 passate, 1,2 = 3, 1,6 = 4. 1,2 basta; 0,8 si piega quando infili le spine.' },
        { sec: 'Forma', id: 'fondo', label: 'Spessore fondo', type: 'num', min: 0.8, max: 3, step: 0.2, def: 1.6, unit: 'mm', help: 'Sotto 1,2 mm solo con il coperchio a viti. 0,8 = 4 strati da 0,2: le celle pesano, meglio almeno 1 mm.' },
        { sec: 'Stampa', id: 'prova', label: 'Pezzi di prova', type: 'select', def: 'nessuna', options: [['nessuna', 'Nessuno: scatola intera'], ['fronte', 'Fronte con le porte'], ['chiusura', 'Chiusura (slitta o viti)'], ['tutte', 'Fronte e chiusura']],
          help: 'Pezzi piccoli che si stampano in pochi minuti prima della scatola intera. Fronte: la parete con porte e pulsante, per vedere se la scheda combacia. Chiusura: con la slitta un tratto di guida e un pezzo di coperchio da far scorrere; con le viti un angolo con la colonnina e il suo pezzo di coperchio da avvitare.' },
      ],
    },
    tablet: {
      label: 'Supporto tablet',
      params: [
        { sec: 'Tablet', id: 'modello', label: 'Modello', type: 'select', def: 'fire10_2021', options: [['fire10_2021', 'Fire HD 10 (11ª gen., 2021)'], ['fire8_2018', 'Fire HD 8 (8ª gen., 2018)'], ['fire7_2017', 'Fire 7 (7ª gen., 2017)'], ['misura', 'Misure mie']],
          help: 'Il modello è in Impostazioni → Opzioni dispositivo → Informazioni sul Fire Tablet. Misure ufficiali, senza custodia.' },
        { sec: 'Tablet', id: 'larghezza', label: 'Lato lungo', type: 'num', min: 80, max: 400, step: 0.1, def: 247, unit: 'mm', show: p => p.modello === 'misura' },
        { sec: 'Tablet', id: 'altezza', label: 'Lato corto', type: 'num', min: 60, max: 300, step: 0.1, def: 166, unit: 'mm', show: p => p.modello === 'misura' },
        { sec: 'Tablet', id: 'spessore', label: 'Spessore', type: 'num', min: 4, max: 20, step: 0.1, def: 9.2, unit: 'mm', show: p => p.modello === 'misura' },
        { sec: 'Posizione', id: 'orientamento', label: 'Orientamento', type: 'select', def: 'orizzontale', options: [['orizzontale', 'Orizzontale'], ['verticale', 'Verticale']] },
        { sec: 'Posizione', id: 'latoAperto', label: 'Lato aperto', type: 'select', def: 'destra', options: [['destra', 'Destra'], ['sinistra', 'Sinistra'], ['sopra', 'Sopra']],
          help: 'Da qui entra il tablet, e qui restano liberi presa di ricarica e tasti: mettilo dal lato dove il tuo tablet ha la presa (guardandolo da davanti, come lo userai).' },
        { sec: 'Posizione', id: 'inclinazione', label: 'Inclinazione', type: 'num', min: 5, max: 40, step: 1, def: 20, unit: '°', help: 'Quanto è piegato all\'indietro rispetto alla verticale.' },
        ...[['Sotto', 'sotto'], ['Sopra', 'sopra'], ['Sinistra', 'sinistra'], ['Destra', 'destra']].map(([n, k]) => ({ sec: 'Cornice', id: 'bordo' + n, label: 'Labbro ' + k, type: 'num', min: 0, max: 15, step: 0.5, def: 3.5, unit: 'mm', show: p => p.latoAperto !== k,
          help: k === 'sotto' ? 'Quanto ogni labbro copre il bordo nero attorno allo schermo, lato per lato, guardando il tablet da davanti come lo userai. Non deve arrivare sullo schermo. 0 = niente labbro.' : undefined })),
        { sec: 'Cornice', id: 'gioco', label: 'Gioco', type: 'num', min: 0, max: 1, step: 0.05, def: 0.3, unit: 'mm', help: 'Spazio attorno al tablet, per lato. Se non entra aumentalo, se balla diminuiscilo.' },
        { sec: 'Stampa', id: 'piatto', label: 'Lato del piatto', type: 'num', min: 150, max: 400, step: 1, def: 250, unit: 'mm', help: 'Anycubic Kobra S1: 250 mm. Se la cornice è più grande si divide in due metà con gli incastri.' },
      ],
    },
    barattolo: {
      label: 'Barattolo',
      artKey: 'disegno',
      params: [
        { sec: 'Misure', id: 'formato', label: 'Misura', type: 'select', def: 'medio', options: [['piccolo', 'Piccolo · Ø 50 × 45 mm'], ['medio', 'Medio · Ø 70 × 70 mm'], ['grande', 'Grande · Ø 90 × 100 mm'], ['alto', 'Alto · Ø 70 × 130 mm'], ['largo', 'Largo · Ø 120 × 80 mm'], ['misura', 'Misure mie']],
          help: 'Misure esterne, con il tappo chiuso. La capienza è nel riquadro delle misure.' },
        { sec: 'Misure', id: 'diametro', label: 'Diametro', type: 'num', min: 30, max: 200, step: 1, def: 70, unit: 'mm', show: p => p.formato === 'misura', help: 'Fuori, dove il tappo è a filo con il barattolo.' },
        { sec: 'Misure', id: 'altezza', label: 'Altezza', type: 'num', min: 30, max: 250, step: 1, def: 70, unit: 'mm', show: p => p.formato === 'misura', help: 'Con il tappo chiuso.' },
        { sec: 'Misure', id: 'pareti', label: 'Spessore pareti', type: 'num', min: 1.2, max: 4, step: 0.4, def: 2, unit: 'mm', help: 'Vale per il barattolo, il collo e la gonna del tappo. Con ugello 0,4: 1,2 = 3 passate, 1,6 = 4, 2 = 5.' },
        { sec: 'Misure', id: 'fondo', label: 'Spessore fondo', type: 'num', min: 1, max: 4, step: 0.2, def: 1.6, unit: 'mm' },
        { sec: 'Tappo', id: 'spCoperchio', label: 'Spessore tappo', type: 'num', min: 1.6, max: 5, step: 0.2, def: 2.4, unit: 'mm' },
        { sec: 'Tappo', id: 'passo', label: 'Passo del filetto', type: 'num', min: 4, max: 12, step: 0.5, def: 6, unit: 'mm',
          help: 'Quanto sale il tappo in un giro. Il filetto è lungo poco meno di un giro: si chiude con un giro solo. Più grande = si avvita prima a imboccare ma il collo è più alto.' },
        { sec: 'Tappo', id: 'profFiletto', label: 'Profondità filetto', type: 'num', min: 1, max: 3, step: 0.1, def: 1.6, unit: 'mm', help: 'Quanto sporge il filetto. Più profondo tiene di più, ma la bocca si stringe del doppio.' },
        { sec: 'Tappo', id: 'gioco', label: 'Gioco', type: 'num', min: 0.2, max: 0.8, step: 0.05, def: 0.4, unit: 'mm', help: 'Spazio tra il filetto del tappo e quello del barattolo. Se è duro aumentalo, se balla diminuiscilo.' },
        { sec: 'Tappo', id: 'zigrinatura', label: 'Righe per la presa', type: 'bool', def: true, help: 'Scanalature sulla gonna del tappo per svitarlo con le mani bagnate.' },
        { sec: 'Tappo decorato', id: 'svg', label: 'Il tuo disegno', type: 'svg', palKey: 'disegno', use: { disegno: 'svg' }, unuse: { disegno: 'nessuno' }, using: p => p.disegno === 'svg' },
        { sec: 'Tappo decorato', id: 'disegno', label: 'Disegno', type: 'select', def: 'nessuno', options: [['nessuno', 'Nessuno'], ['svg', 'Il tuo SVG']], show: () => false },   // lo imposta il riquadro qui sopra
        { sec: 'Tappo decorato', id: 'altDisegno', label: 'Altezza disegno', type: 'num', min: 6, max: 150, step: 1, def: 30, unit: 'mm', show: p => p.disegno === 'svg' },
        { sec: 'Tappo decorato', id: 'rotDisegno', label: 'Rotazione disegno', type: 'int', min: 0, max: 345, step: 15, def: 0, unit: '°', wrap: true, show: p => p.disegno === 'svg' },
        { sec: 'Tappo decorato', id: 'posDisegno', label: 'Posizione disegno', type: 'pad', def: [0, 0], show: p => p.disegno === 'svg', help: 'Le frecce spostano il disegno sul tappo; il centro lo rimette al suo posto. Fuori dal cerchio viene tagliato.' },
        { sec: 'Tappo decorato', id: 'stileCop', label: 'Stile', type: 'select', def: 'filo', options: [['filo', 'A filo (a colori)'], ['inciso', 'Inciso']],
          help: 'Il tappo si stampa capovolto, con la faccia di sopra sul piatto. A filo: i colori sono nei primi strati e la superficie resta liscia (multicolore, o cambio filamento). Inciso: scavato.' },
        layerP({ sec: 'Tappo decorato', id: 'profCop', label: 'Spessore', min: 0.2, max: 1.6, def: 0.6 }),
        ...withRot(linesP('Scritta sul tappo', '', '', 8, null, 40, 'Altezza delle maiuscole (i loghi sono alti 1,35 volte). Con i pulsanti sotto il campo metti il logo SP e i visi. Se non ci sta viene ridotta da sola.')),
        { sec: 'Scritta sul tappo', id: 'carattere', label: 'Carattere', type: 'select', def: 'tondo', options: FONT_OPTS },
        Object.assign(nozzleP('Scritta sul tappo'), { show: p => hasLogo(p) || p.disegno === 'svg' }),
        ...markP(true),
        ...colorsP(['Colore 1 · tappo e barattolo', 'Colore 2', 'Colore 3', 'Colore 4'], 'disegno'),
        { sec: 'Colori', id: 'colTesto', label: 'Colore della scritta', type: 'select', def: 'auto', options: [['auto', 'Auto'], ['2', '2'], ['3', '3'], ['4', '4']], help: 'Solo con lo stile a filo. Auto: il colore che si legge meglio sul tappo.' },
      ],
    },
    schede: {
      label: 'Box schede ESP',
      params: [
        { sec: 'Processore', id: 'cpu', label: 'Processore', type: 'select', menu: true, def: 'd1mini', options: schedeOpts('cpu'),
          help: 'Sta sul fondo, contro la parete sinistra da cui esce la USB, con i piedini in su.' },
        { sec: 'Processore', id: 'cpuAria', label: 'Prese d\'aria nel coperchio', type: 'select', def: 'no', options: [['no', 'No'], ['si', 'Sì']], help: 'Fessure da 2 mm nel coperchio sopra la scheda.' },
        { sec: 'Processore', id: 'cpuPin', label: 'Piedini saldati', type: 'select', def: 'componenti', options: [['componenti', 'Dal lato dei componenti'], ['sotto', 'Dal lato opposto (scheda capovolta)']],
          help: 'I piedini stanno sempre in su. Dal lato dei componenti: la scheda sta dritta. Dal lato opposto: la scheda è capovolta, i componenti e la USB stanno sotto. In tutti e due i casi il circuito poggia su un gradino. Serve anche a mettere la porta USB all\'altezza giusta.' },
        ...[1, 2, 3, 4, 5].flatMap(i => [
          { sec: 'Moduli', id: 'mod' + i, label: 'Modulo ' + i, type: 'select', menu: true, def: i === 1 ? 'mpu6050' : 'nessuno', options: [['nessuno', 'Nessuno'], ...schedeOpts('mod')],
            help: i === 1 ? 'In fila a destra del processore, sul fondo, componenti e piedini in su.' : undefined },
          { sec: 'Moduli', id: 'mod' + i + 'Liv', label: 'Modulo ' + i + ': dove', type: 'select', def: 'fondo', options: [['fondo', 'Sul fondo'], ['coperchio', 'Sotto il coperchio']], show: p => p['mod' + i] && p['mod' + i] !== 'nessuno',
            help: i === 1 ? 'Sotto il coperchio: per display e sensori di luce o d\'aria. Il modulo sta contro una parete, componenti in su e piedini in giù, appoggiato a una mensola della parete e a due gambe sottili; quando chiudi il coperchio il bordino e dei pioli lo bloccano. Nel coperchio sopra c\'è la finestra.' : undefined },
          { sec: 'Moduli', id: 'mod' + i + 'Parete', label: 'Modulo ' + i + ': parete', type: 'select', def: 'davanti', options: [['davanti', 'Davanti'], ['dietro', 'Dietro'], ['destra', 'Destra']], show: p => p['mod' + i] && p['mod' + i] !== 'nessuno' && p['mod' + i + 'Liv'] === 'coperchio',
            help: i === 1 ? 'La parete sinistra no: lì c\'è il processore con la USB. La fila sul fondo si allontana da questa parete quanto serve.' : undefined },
          { sec: 'Moduli', id: 'mod' + i + 'Lungo', label: 'Modulo ' + i + ': posizione lungo la parete', type: 'num', min: -150, max: 150, step: 0.5, def: 0, unit: 'mm', show: p => p['mod' + i] && p['mod' + i] !== 'nessuno' && p['mod' + i + 'Liv'] === 'coperchio',
            help: i === 1 ? 'Distanza del centro del modulo dal centro della parete: positiva verso destra, guardando la parete da fuori.' : undefined },
          { sec: 'Moduli', id: 'mod' + i + 'Aria', label: 'Modulo ' + i + ': prese d\'aria nel coperchio', type: 'select', def: 'no', options: [['no', 'No'], ['si', 'Sì']], show: p => p['mod' + i] && p['mod' + i] !== 'nessuno',
            help: i === 1 ? 'Fessure da 2 mm nel coperchio sopra il modulo (per esempio per l\'ENS160).' : undefined },
          { sec: 'Moduli', id: 'mod' + i + 'Rot', label: 'Modulo ' + i + ': rotazione', type: 'select', def: '0', options: [['0', '0°'], ['90', '90°'], ['180', '180°'], ['270', '270°']], show: p => p['mod' + i] && p['mod' + i] !== 'nessuno',
            help: i === 1 ? 'Gira l\'alloggio del modulo, visto dall\'alto in senso antiorario (con lui girano i piedini).' : undefined },
        ]),
        ...[1, 2, 3, 4].flatMap(i => [
          { sec: 'LED', id: 'led' + i, label: 'LED ' + i, type: 'select', def: 'nessuno', options: [['nessuno', 'Nessuno'], ['davanti', 'Parete davanti'], ['dietro', 'Parete dietro'], ['sinistra', 'Parete sinistra (USB)'], ['destra', 'Parete destra']],
            help: i === 1 ? 'Foro nella parete e, dentro, una culla che parte dal fondo e regge il LED con le saldature e i dupont. Il LED si infila da dentro con il collarino contro la parete.' : undefined },
          { sec: 'LED', id: 'led' + i + 'D', label: 'LED ' + i + ': diametro', type: 'select', def: '5', options: [['3', '3 mm'], ['5', '5 mm']], show: p => p['led' + i] && p['led' + i] !== 'nessuno' },
          { sec: 'LED', id: 'led' + i + 'Pos', label: 'LED ' + i + ': posizione lungo la parete', type: 'num', min: -150, max: 150, step: 0.5, def: 0, unit: 'mm', show: p => p['led' + i] && p['led' + i] !== 'nessuno',
            help: i === 1 ? 'Distanza del centro del LED dal centro della parete: positiva verso destra, guardando la parete da fuori.' : undefined },
          { sec: 'LED', id: 'led' + i + 'Z', label: 'LED ' + i + ': altezza', type: 'num', min: 0, max: 120, step: 0.5, def: 10, unit: 'mm', show: p => p['led' + i] && p['led' + i] !== 'nessuno',
            help: i === 1 ? 'Dal fondo interno al centro del LED. Se è troppo in basso o troppo in alto (sotto il bordino del coperchio) si ferma al limite.' : undefined },
        ]),
        { sec: 'LED', id: 'ledSpazio', label: 'Spazio dietro i LED', type: 'num', min: 5, max: 80, step: 0.5, def: 25, unit: 'mm', show: p => [1, 2, 3, 4].some(i => p['led' + i] && p['led' + i] !== 'nessuno'),
          help: 'Quanto serve dentro la scatola per LED, saldature e dupont, misurato dalla parete. La culla sotto è lunga così.' },
        { sec: 'Viti', id: 'viteM', label: 'Viti stampate', type: 'select', def: 'M6', options: [['M6', 'M6'], ['M8', 'M8'], ['M10', 'M10']],
          help: 'Il coperchio si chiude con 4 viti stampate a testa svasata: entrano da sotto il fondo, a filo, e si avvitano nelle boccole filettate sotto il coperchio.' },
        { sec: 'Viti', id: 'viteGioco', label: 'Gioco del filetto', type: 'num', min: 0.1, max: 0.6, step: 0.05, def: 0.3, unit: 'mm', help: 'Se la vite è dura aumentalo, se balla diminuiscilo.' },
        { sec: 'Scatola', id: 'altezza', label: 'Altezza interna', type: 'num', min: 5, max: 120, step: 0.5, def: 25, unit: 'mm', help: 'Dal fondo al coperchio, spessori esclusi. Sopra i piedini ci vogliono circa 20 mm per i dupont e la curva dei fili.' },
        { sec: 'Scatola', id: 'margine', label: 'Spazio attorno agli alloggi', type: 'num', min: 0, max: 40, step: 0.5, def: 3, unit: 'mm', help: 'Davanti, dietro e a destra (a sinistra il processore sta contro la parete).' },
        { sec: 'Scatola', id: 'distanza', label: 'Distanza tra gli alloggi', type: 'num', min: 0, max: 30, step: 0.5, def: 3, unit: 'mm' },
        { sec: 'Scatola', id: 'pareteAll', label: 'Pareti degli alloggi', type: 'num', min: 0.8, max: 3, step: 0.4, def: 1.2, unit: 'mm', help: 'Pareti piene attorno a ogni scheda, alte fino alla faccia di sopra del circuito.' },
        { sec: 'Scatola', id: 'gradinoH', label: 'Altezza del gradino', type: 'num', min: 0.6, max: 8, step: 0.1, def: 2.5, unit: 'mm', help: 'Dentro ogni alloggio il circuito poggia su un gradino lungo il bordo e sotto resta vuoto, per le punte dei piedini saldati e i componenti di sotto. Se la scheda è capovolta il gradino si alza da solo sopra i componenti.' },
        { sec: 'Scatola', id: 'gradinoL', label: 'Larghezza del gradino', type: 'num', min: 0.6, max: 3, step: 0.2, def: 1, unit: 'mm', help: 'Quanto il gradino entra sotto il bordo della scheda. Sotto le file di piedini si interrompe.' },
        { sec: 'Scatola', id: 'gioco', label: 'Gioco attorno alle schede', type: 'num', min: 0.1, max: 1, step: 0.1, def: 0.3, unit: 'mm', help: 'Per lato.' },
        { sec: 'Scatola', id: 'pareti', label: 'Spessore pareti', type: 'num', min: 0.8, max: 3.2, step: 0.4, def: 2, unit: 'mm' },
        { sec: 'Scatola', id: 'fondo', label: 'Spessore fondo', type: 'num', min: 0.8, max: 3, step: 0.2, def: 1.6, unit: 'mm' },
        { sec: 'Scatola', id: 'spCoperchio', label: 'Spessore coperchio', type: 'num', min: 1, max: 4, step: 0.2, def: 2, unit: 'mm' },
        { sec: 'Scatola', id: 'raggio', label: 'Raggio angoli', type: 'num', min: 1, max: 10, step: 0.5, def: 4, unit: 'mm' },
      ],
    },
    tennis: {
      label: 'Tennis',
      params: [
        { sec: 'Modello', id: 'modello', label: 'Modello', type: 'select', def: 'bottone', options: [['bottone', 'Bottone'], ['verme', 'Verme (lungo)']],
          help: 'Il bottone ha un disco davanti e uno dietro le corde, uniti da una parte centrale che si incastra tra le due corde verticali centrali: due pezzi che scattano insieme. Il verme appoggia su più corde verticali, con un tassello ogni due spazi, e ha più spazio per la scritta.' },
        ...dampShapeP('Forma', p => p.modello === 'bottone'),
        { sec: 'Misure', id: 'larghezza', label: 'Larghezza', type: 'num', min: 18, max: 35, step: 0.5, def: 24, unit: 'mm', show: p => p.modello === 'bottone', help: 'Di traverso alle corde. Più grande e più spesso smorza di più ma pesa di più.' },
        { sec: 'Misure', id: 'altezza', label: 'Spessore dei dischi', type: 'num', min: 3.5, max: 8, step: 0.5, def: 4, unit: 'mm', show: p => p.modello === 'bottone', help: 'Di ciascuno dei due dischi, davanti e dietro le corde: sono uguali.' },
        { sec: 'Misure', id: 'lunghezza', label: 'Lunghezza', type: 'num', min: 60, max: 130, step: 1, def: 100, unit: 'mm', show: p => p.modello === 'verme' },
        { sec: 'Misure', id: 'altVerme', label: 'Altezza', type: 'num', min: 8, max: 14, step: 0.5, def: 10, unit: 'mm', show: p => p.modello === 'verme' },
        { sec: 'Misure', id: 'spessore', label: 'Spessore', type: 'num', min: 2.4, max: 5, step: 0.2, def: 3.6, unit: 'mm', show: p => p.modello === 'verme' },
        { sec: 'Corde', id: 'schema', label: 'Schema corde', type: 'select', def: '16x19', options: [['16x19', '16×19 (aperto)'], ['18x20', '18×20 (fitto)'], ['misura', 'Misura tua']],
          help: 'È scritto sul telaio, di solito sul cuore della racchetta. Con "Misura tua" metti la distanza tra le corde centrali.' },
        { sec: 'Corde', id: 'interasse', label: 'Distanza tra le corde centrali', type: 'num', min: 8, max: 16, step: 0.1, def: 12.5, unit: 'mm', show: p => p.schema === 'misura',
          help: 'Da centro a centro delle due corde verticali centrali, sotto l\'ultima corda orizzontale.' },
        { sec: 'Corde', id: 'calibro', label: 'Calibro corda', type: 'num', min: 1.1, max: 1.45, step: 0.05, def: 1.25, unit: 'mm', help: 'È sulla confezione delle corde: 15L = 1,35, 16 = 1,30, 16L = 1,25, 17 = 1,20.' },
        { sec: 'Corde', id: 'presa', label: 'Presa', type: 'num', min: 0, max: 1, step: 0.1, def: 0.4, unit: 'mm', help: 'Quanto la parte che entra tra le corde è più larga dello spazio tra le corde: le corde la stringono. Se scivola via aumentala, se non entra diminuiscila.' },
        ...oneTextP('ACE', 4, [['rilievo', 'In rilievo'], ['filo', 'A filo, colorata'], ['incisa', 'Incisa']]),
        ...markP(true),
        ...dampColorsP(p => p.modello === 'bottone'),
      ],
    },
    padel: {
      label: 'Padel',
      params: [
        { sec: 'Modello', id: 'tipo', label: 'Modello', type: 'select', def: 'tappo', options: [['tappo', 'Tappo nel foro'], ['passante', 'Passante (tutto lo spessore)']],
          help: 'Il tappo entra da una faccia e ha la testa con la scritta. Il passante attraversa tutta la racchetta e fuori resta solo un colletto sottile.' },
        ...dampShapeP('Forma testa', p => p.tipo === 'tappo'),
        { sec: 'Foro', id: 'foro', label: 'Diametro foro', type: 'num', min: 8, max: 14, step: 0.1, def: 12, unit: 'mm', help: 'I fori delle racchette da padel sono da 9 a 13 mm: misurali con il calibro.' },
        { sec: 'Foro', id: 'presa', label: 'Presa', type: 'num', min: 0, max: 0.8, step: 0.1, def: 0.3, unit: 'mm', help: 'Quanto il gambo è più grosso del foro. Se esce da solo aumentala, se non entra diminuiscila.' },
        { sec: 'Misure', id: 'diamTesta', label: 'Larghezza testa', type: 'num', min: 12, max: 28, step: 0.5, def: 19, unit: 'mm', show: p => p.tipo === 'tappo' },
        { sec: 'Misure', id: 'spTesta', label: 'Spessore testa', type: 'num', min: 1.6, max: 3, step: 0.2, def: 2, unit: 'mm', show: p => p.tipo === 'tappo' },
        { sec: 'Misure', id: 'gambo', label: 'Lunghezza gambo', type: 'num', min: 6, max: 20, step: 0.5, def: 10, unit: 'mm', show: p => p.tipo === 'tappo' },
        { sec: 'Misure', id: 'spRacchetta', label: 'Spessore racchetta', type: 'num', min: 30, max: 40, step: 0.5, def: 38, unit: 'mm', show: p => p.tipo === 'passante', help: 'Quasi tutte sono da 38 mm; alcune leggere o da ragazzi da 36 o meno.' },
        ...oneTextP('SP', 4, [['filo', 'A filo, colorata'], ['incisa', 'Incisa']]),
        ...markP(true),
        { sec: 'Stampa', id: 'copie', label: 'Quanti', type: 'int', min: 1, max: 8, def: 2, help: 'Di solito si mettono a coppie, uno per faccia.' },
        ...dampColorsP(p => p.tipo === 'tappo'),
      ],
    },
  };

  // ================= GRUPPI (pagina iniziale) =================
  const GROUPS = [
    { id: 'natale', title: 'Natale', cat: 'Feste', desc: 'Palline (anche a spirale, intere senza supporti), palle piatte con disegni e nome, decorazioni con il nome, alberi, stelle puntale, lanterne e formine per biscotti. Fino a tre colori.', modes: ['pallina', 'spirale', 'palla', 'piatto', 'albero', 'stella', 'lanterna', 'formina'], thumb: 'pallina' },
    { id: 'gridfinity', title: 'Gridfinity', cat: 'Organizzazione', desc: 'Contenitori impilabili, cassettiere con cassetti e basi a griglia da 42 mm.', modes: ['bin', 'cab', 'base'], thumb: 'cab' },
    { id: 'lego', title: 'Cassetti modulari', cat: 'Organizzazione', desc: 'Mattoncini con cassetto che si impilano come i Lego: vaschetta e coperchio con i bottoncini, a scatto o incollato, cassetto con o senza guide e separatori estraibili. Poca plastica, tutto stampato dritto.', modes: ['lego'], thumb: 'lego' },
    { id: 'rack', title: 'Rack telefoni', cat: 'Organizzazione', desc: 'Rack a fessure per riporre telefoni e tablet, anche di spessori diversi.', modes: ['rack'], thumb: 'rack' },
    { id: 'cover', title: 'Cover telefono', cat: 'Accessori', desc: 'Cover per iPhone dal 12 al 17 con le misure dei disegni Apple, OnePlus Nord, o per qualsiasi telefono con le tue misure. TPU o PLA/PETG a scatto, cornice per le lenti, cavalletto, scritta e il tuo SVG sul retro.', modes: ['cover'], thumb: 'cover' },
    { id: 'vasi', title: 'Vasi', cat: 'Casa e giardino', desc: 'Vasi e fioriere per aromatiche, normali con sottovaso o autoirriganti.', modes: ['vaso'], thumb: 'vaso' },
    { id: 'barattoli', title: 'Barattoli', cat: 'Casa e giardino', desc: 'Barattoli tondi con tappo a vite: filetto grosso che si chiude con un giro solo, cinque misure o le tue, scritta, loghi e il tuo SVG sul tappo. Senza supporti.', modes: ['barattolo'], thumb: 'barattolo' },
    { id: 'supporti', title: 'Reggimensole e ganci', cat: 'Casa e giardino', desc: 'Squadre per mensole con rinforzo e viti, ganci a muro, appendiabiti, ganci sopra porta, per tubi e a S.', modes: ['mensola', 'gancio'], thumb: 'gancio' },
    { id: 'powerbank', title: 'Powerbank', cat: 'Elettronica', desc: 'Scatola per un powerbank fai-da-te: celle 18650 con contatti a molla come le pile, quattro schede di ricarica con le porte già al loro posto, coperchio a slitta o a viti nascoste.', modes: ['powerbank'], thumb: 'powerbank' },
    { id: 'schede', title: 'Box schede ESP', cat: 'Elettronica', desc: 'Scatola per un processore ESP e i suoi moduli, in fila sul fondo nei loro alloggi, piedini in su, USB che esce dalla parete. In costruzione, un passo alla volta.', modes: ['schede'], thumb: 'schede' },
    { id: 'tablet', title: 'Supporto tablet', cat: 'Elettronica', desc: 'Cornice con base per usare un tablet senza custodia come schermo di Home Assistant: Fire HD 10, HD 8, Fire 7 o misure tue, orizzontale o verticale, lato aperto per presa e tasti. Se non entra nel piatto si divide in due con gli incastri.', modes: ['tablet'], thumb: 'tablet' },
    { id: 'racchette', title: 'Antivibrazione', cat: 'Sport', desc: 'Antivibrazione con il tuo nome per racchette da tennis (bottone o verme, per corde 16×19 e 18×20) e da padel (tappo o passante per i fori della racchetta). Da stampare in TPU.', modes: ['tennis', 'padel'], thumb: 'tennis' },
    { id: 'viteria', title: 'Viti e bulloni', cat: 'Meccanica', desc: 'Viti e bulloni con filetto metrico ISO, dadi, rondelle e perni a scatto.', modes: ['vite', 'bullone', 'perno'], thumb: 'bullone' },
  ];
  const groupOf = (mode) => GROUPS.find(g => g.modes.includes(mode)) || GROUPS[0];

  // ================= STATO =================
  const LS = 'gp3d.v1';
  let state = { mode: 'bin', values: {}, open: 0.35 };
  try { const s = JSON.parse(localStorage.getItem(LS) || 'null'); if (s && MODES[s.mode]) state = Object.assign(state, s); } catch (e) {}
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} };
  function values(mode) {
    const v = {};
    for (const p of MODES[mode].params) {
      const stored = state.values[mode] && state.values[mode][p.id];
      v[p.id] = stored !== undefined ? stored : p.def;
      // valori salvati che non esistono più (es. i vecchi motivi): torno al valore iniziale
      if (p.type === 'select' && p.options && !p.options.some(o => o[0] === v[p.id])) v[p.id] = p.def;
    }
    // "Colori del disegno" senza colori scelti: prendo quelli del disegno
    if (v.tavolozza === 'disegno' && !(state.values[mode] && state.values[mode].col1 !== undefined)) Object.assign(v, artPal(v, MODES[mode].artKey) || {});
    return v;
  }

  // ================= UI CONTROLLI =================
  const $ = (s) => document.querySelector(s);
  const panel = $('#params');
  // ---- "Minima stampabile": la misura più piccola in cui le righe dei loghi (o i dettagli del disegno) restano larghe abbastanza ----
  // Larghezza minima di una riga: come il programma ingrossa i loghi (ugello × 1,05). A filo a colori il doppio abbondante (2,2 ×):
  // due passate del primo strato, sennò lo slicer non riempie le righe del colore della scritta.
  const LOGO_IDS = { sp: 'SP', viso: 'viso', visonatale: 'visoNatale' };
  const minLine = (v) => { const noz = +v.ugello || 0.4; return { w: noz * 1.05, r: noz * 0.45, noz }; };
  function minSizeOf(p, v, cheap) {
    const n = minLine(v), m = /^altTesto(\d?)$/.exec(p.id);
    if (m) {
      const i = m[1] || '1', tp = MODES[state.mode].params.find(q => q.type === 'text' && q.logos && (q.id === (i === '1' ? 'scritta' : 'scritta' + i) || q.id === 'testo' + i));
      const ids = [...String(tp ? v[tp.id] || '' : '').matchAll(/\{(visonatale|viso)\}/gi)].map(x => LOGO_IDS[x[1].toLowerCase()]);
      // come logoMinH in natale.js: linee + spazi almeno tre passate, spazi almeno una; i loghi sono alti 1,35 volte la riga
      const L = window.SPRECOLO_LOGOS || {}, hs = ids.map(id => L[id] && L[id].wl && Math.max(3 * n.w / (L[id].wl + L[id].wg), n.w / L[id].wg)).filter(Boolean);
      return hs.length ? Object.assign({ val: Math.max(...hs) / 1.35, kind: 'logo' }, n) : null;
    }
    const artId = p.id === 'altDisegno' ? (v.disegno === 'svg' ? 'svg' : null) : (p.id === 'altezza' && v.forma && isArtId(v.forma) ? v.forma : null);
    if (!artId || (artId === 'svg' && !(v.svg && v.svg.text))) return null;
    if (cheap) return { kind: 'art' };
    const h = G && G.artMin ? G.artMin(artId, v.svg, n.r) : null;
    return h ? Object.assign({ val: h, kind: 'art' }, n) : null;
  }
  const fmtNum = (v, step) => { const d = step < 1 ? (String(step).split('.')[1] || '').length : 0; return Number(v).toFixed(d); };

  function renderParams() {
    const mode = state.mode, v = values(mode);
    panel.innerHTML = '';
    const sections = new Map();
    for (const p of MODES[mode].params) {
      if (!sections.has(p.sec)) {
        const det = document.createElement('details');
        det.className = 'sec'; det.open = !(p.sec === 'Incastri e magneti' && state.collapsedMag);
        det.innerHTML = `<summary>${p.sec}</summary><div class="rows"></div>`;
        if (p.sec === 'Incastri e magneti') det.addEventListener('toggle', () => { state.collapsedMag = !det.open; save(); });
        panel.appendChild(det); sections.set(p.sec, det.querySelector('.rows'));
      }
      const row = document.createElement('div');
      row.className = 'row'; row.dataset.id = p.id;
      const idAttr = `p-${mode}-${p.id}`;
      if (p.type === 'color') {
        row.classList.add('bool');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><input type="color" id="${idAttr}" value="${esc(v[p.id])}">`;
        row.querySelector('input').addEventListener('input', (e) => set(p, e.target.value, true));
      } else if (p.type === 'bool') {
        row.classList.add('bool');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><input type="checkbox" role="switch" id="${idAttr}" ${v[p.id] ? 'checked' : ''}>`;
        row.querySelector('input').addEventListener('change', (e) => set(p, e.target.checked));
      } else if (p.type === 'text') {
        row.classList.add('sel');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><input class="txt" type="text" id="${idAttr}" value="${esc(v[p.id] || '')}" placeholder="${esc(p.placeholder || '')}" autocomplete="off">`;
        const ti = row.querySelector('input');
        ti.addEventListener('input', () => set(p, ti.value, true));
        if (p.logos) {
          // pulsanti per inserire i loghi dove c'è il cursore
          const bar = document.createElement('div');
          bar.className = 'logo-ins';
          bar.innerHTML = `<span>Inserisci</span><button type="button" class="chip" data-t="{viso}">Viso</button><button type="button" class="chip" data-t="{visoNatale}">Viso di Natale</button>`;
          bar.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            const a = ti.selectionStart ?? ti.value.length, z = ti.selectionEnd ?? a, t = b.dataset.t;
            ti.value = ti.value.slice(0, a) + t + ti.value.slice(z);
            ti.focus(); ti.setSelectionRange(a + t.length, a + t.length);
            set(p, ti.value);
          }));
          row.appendChild(bar);
        }
      } else if (p.type === 'svg') {
        // riquadro sempre visibile per caricare un proprio disegno SVG (anche trascinandolo);
        // il file resta salvato nel browser insieme agli altri valori
        row.classList.add('svg-row');
        const cur = v[p.id], using = cur && cur.name && p.using(v);
        row.innerHTML = `<div class="svg-card${using ? ' on' : ''}">
          <div class="svg-head"><b>${p.label} (SVG)</b>${using ? '<span class="tag">in uso</span>' : ''}</div>
          ${cur && cur.name ? `<div class="fname">${esc(cur.name)}</div>` : '<div class="svg-hint">Trascina qui un file .svg, oppure</div>'}
          <div class="svg-btns">
            <label class="btn${cur && cur.name ? '' : ' primary'}" for="${idAttr}">${cur && cur.name ? 'Cambia file…' : 'Carica SVG…'}</label>
            ${cur && cur.name && !using ? '<button type="button" class="btn primary use">Usa questo</button>' : ''}
            ${using ? '<button type="button" class="btn unuse">Usa la libreria</button>' : ''}
            ${cur && cur.name ? '<button type="button" class="btn clear">Togli</button>' : ''}
          </div>
          <input id="${idAttr}" type="file" accept=".svg,image/svg+xml" hidden>
          <p class="help">Il tuo disegno vettoriale al posto di quelli della libreria: i colori vanno sui tuoi filamenti, i tratti diventano linee piene.</p>
        </div>`;
        const apply = (val, extra) => {
          const cur2 = Object.assign({}, values(state.mode), { [p.id]: val }, extra || {});
          const upd = cur2.tavolozza === 'disegno' ? artPal(cur2, p.palKey) : null;
          Object.assign((state.values[state.mode] ||= {}), { [p.id]: val }, extra || {}, upd || {});
          save(); renderParams(); schedule(60);
        };
        const load = (file) => {
          if (!file) return;
          if (file.size > 1.5e6) { setStatus('File SVG troppo grande (massimo 1,5 MB)', 'err'); return; }
          const rd = new FileReader();
          rd.onload = () => {
            const text = String(rd.result || '');
            let pal = null;
            try { const pk = window.SPLAB_SVG.pack(window.SPLAB_SVG.parse(text)); pal = pk && pk.pal; } catch (err) { pal = null; }
            if (!pal) { setStatus('Nel file non ho trovato forme da usare: serve un SVG con aree colorate o tratti', 'err'); return; }
            apply({ name: file.name, text, pal }, p.use);
          };
          rd.readAsText(file);
        };
        row.querySelector('input').addEventListener('change', (e) => load(e.target.files && e.target.files[0]));
        const card = row.querySelector('.svg-card');
        card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag'); });
        card.addEventListener('dragleave', () => card.classList.remove('drag'));
        card.addEventListener('drop', (e) => { e.preventDefault(); card.classList.remove('drag'); load(e.dataTransfer.files && e.dataTransfer.files[0]); });
        const u = row.querySelector('.use'); if (u) u.addEventListener('click', () => apply(cur, p.use));
        const n = row.querySelector('.unuse'); if (n) n.addEventListener('click', () => apply(cur, p.unuse));
        const cl = row.querySelector('.clear'); if (cl) cl.addEventListener('click', () => apply(null, p.unuse));   // via il file: si torna al disegno di prima
      } else if (p.type === 'pad') {
        // croce di frecce per spostare la scritta: 1 mm a clic (0,2 mm tenendo premuto Maiusc), il centro la rimette al centro.
        // Con move/center (pallina) le frecce cambiano altri valori, per esempio lato e altezza sulla sfera
        row.classList.add('pad-row');
        const B = (d, cls, lbl, sym) => `<button type="button" class="${cls}" data-d="${d}" aria-label="${lbl}" title="${lbl}">${sym}</button>`;
        row.innerHTML = `<label>${p.label}</label><div class="pad-box"><div class="pad" role="group" aria-label="${esc(p.label)}">${B('0,1', 'up', 'Su', '▲')}${B('-1,0', 'lt', 'A sinistra', '◀')}${B('c', 'mid', 'Al centro', '●')}${B('1,0', 'rt', 'A destra', '▶')}${B('0,-1', 'dn', 'Giù', '▼')}</div><div class="pad-side"><span class="pad-val"></span>${p.move ? '' : `<div class="pad-step" role="group" aria-label="Passo delle frecce">${[0.5, 1, 5, 10].map(v => `<button type="button" data-st="${v}" title="${String(v).replace('.', ',')} mm a clic">${String(v).replace('.', ',')}</button>`).join('')}<span>mm</span></div>`}</div></div>`;
        const out = row.querySelector('.pad-val');
        const fmtMm = (n) => String(+Math.abs(n).toFixed(1)).replace('.', ',');
        const show = () => {
          const cv = values(state.mode);
          if (p.text) { out.textContent = p.text(cv); return; }
          const [x, y] = cv[p.id] || [0, 0], t = [];
          if (Math.abs(x) > 0.01) t.push(`${x > 0 ? 'destra' : 'sinistra'} ${fmtMm(x)}`);
          if (Math.abs(y) > 0.01) t.push(`${y > 0 ? 'su' : 'giù'} ${fmtMm(y)}`);
          out.textContent = t.length ? t.join(' · ') + ' mm' : 'al centro';
        };
        show();
        // passo delle frecce: lo stesso per tutte le croci (0,5 · 1 · 5 · 10 mm), Maiusc = 0,2 mm
        const markStep = () => row.querySelectorAll('.pad-step button').forEach(x => x.classList.toggle('on', +x.dataset.st === (+state.padStep || 1)));
        markStep();
        row.querySelectorAll('.pad-step button').forEach(b => b.addEventListener('click', () => { state.padStep = +b.dataset.st; save(); document.querySelectorAll('.pad-step button').forEach(x => x.classList.toggle('on', +x.dataset.st === state.padStep)); }));
        row.querySelectorAll('.pad button').forEach(b => b.addEventListener('click', (e) => {
          const cv = values(state.mode), d = b.dataset.d;
          if (p.move) {
            const upd = d === 'c' ? p.center(cv) : p.move(cv, ...d.split(',').map(Number));
            Object.assign((state.values[state.mode] ||= {}), upd);
            save(); renderParams(); schedule(60);
            return;
          }
          const st = e.shiftKey ? 0.2 : (+state.padStep || 1), [x, y] = cv[p.id] || [0, 0];
          const [dx, dy] = d === 'c' ? [0, 0] : d.split(',').map(Number);
          const clamp = (n) => +Math.max(-200, Math.min(200, n)).toFixed(1);
          set(p, d === 'c' ? [0, 0] : [clamp(x + dx * st), clamp(y + dy * st)]);
          show();
        }));
      } else if (p.type === 'select' && p.menu) {
        // elenco lungo: menu a tendina con i gruppi
        row.classList.add('sel');
        const groups = [...new Set(p.options.map(o => o[2] || ''))];
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><select class="txt" id="${idAttr}">${groups.map(g => `${g ? `<optgroup label="${esc(g)}">` : ''}${p.options.filter(o => (o[2] || '') === g).map(([k, l]) => `<option value="${k}"${v[p.id] === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}${g ? '</optgroup>' : ''}`).join('')}</select>`;
        row.querySelector('select').addEventListener('change', (e) => set(p, e.target.value));
      } else if (p.type === 'select') {
        row.classList.add('sel');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><div class="seg" id="${idAttr}" role="radiogroup">${p.options.map(([k, l]) => `<button type="button" role="radio" aria-checked="${v[p.id] === k}" data-k="${k}">${l}</button>`).join('')}</div>`;
        row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { set(p, b.dataset.k); row.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b)); }));
      } else {
        const step = p.type === 'int' ? (p.step || 1) : p.step, stops = p.stops;
        const show = (n) => (stops ? String(+(+n).toFixed(2)) : fmtNum(n, step));
        row.innerHTML = `<label for="${idAttr}">${p.label}</label>
          <div class="num"><button type="button" class="dec" aria-label="Diminuisci ${p.label}">−</button><input id="${idAttr}" type="number" inputmode="decimal" min="${p.min}" max="${p.max}" step="${stops ? 'any' : step}" value="${show(v[p.id])}"><button type="button" class="inc" aria-label="Aumenta ${p.label}">+</button></div>
          ${p.unit ? `<span class="unit">${p.unit}</span>` : '<span class="unit"></span>'}`;
        const inp = row.querySelector('input');
        const commit = (val) => {
          let n = parseFloat(String(val).replace(',', '.'));
          if (!isFinite(n)) n = p.def;
          if (p.wrap) n = ((Math.round(n / step) * step) % 360 + 360) % 360;   // angoli: dopo 345° torna a 0°
          n = Math.min(p.max, Math.max(p.min, n));
          if (stops) n = stops.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
          else n = Math.round(n / step) * step;
          n = +n.toFixed(4);
          inp.value = show(n); set(p, n);
        };
        // con i valori a strati, − e + passano al valore vicino dell'elenco
        const near = (dir) => { const c = values(state.mode)[p.id]; if (!stops) return c + dir * step; const l = dir > 0 ? stops.find(x => x > c + 1e-6) : [...stops].reverse().find(x => x < c - 1e-6); return l === undefined ? c : l; };
        inp.addEventListener('change', () => commit(inp.value));
        inp.addEventListener('input', () => { const n = parseFloat(inp.value); if (isFinite(n) && n >= p.min && n <= p.max) set(p, p.type === 'int' ? Math.round(n) : n, true); });
        row.querySelector('.dec').addEventListener('click', () => commit(near(-1)));
        row.querySelector('.inc').addEventListener('click', () => commit(near(1)));
        if (/^altTesto\d?$/.test(p.id) || p.id === 'altDisegno' || (p.id === 'altezza' && MODES[mode].params.some(q => q.id === 'forma'))) {
          const bar = document.createElement('div');
          bar.className = 'logo-ins min-ins';
          bar.innerHTML = '<button type="button" class="chip minbtn">Minima stampabile</button><span class="minmsg"></span>';
          bar.querySelector('button').addEventListener('click', () => {
            const r = minSizeOf(p, values(state.mode)), msg = bar.querySelector('.minmsg');
            if (!r) { msg.textContent = 'Non riesco a calcolarla'; return; }
            const st = step || 0.5, want = Math.ceil(r.val / st - 1e-9) * st;
            commit(want);
            const got = values(state.mode)[p.id], wtxt = fmtNum(r.kind === 'art' ? 2 * r.r : r.w, 0.01).replace('.', ',');
            msg.textContent = (want > p.max + 1e-9 ? `servirebbero ${fmtNum(want, st).replace('.', ',')} mm, qui il massimo è ${fmtNum(p.max, st).replace('.', ',')}: ` : '')
              + `${fmtNum(got, st).replace('.', ',')} mm, ${r.kind === 'logo' ? `linee del logo larghe almeno ${fmtNum(2 * r.w, 0.01).replace('.', ',')} mm (due passate) e spazi almeno ${wtxt} mm` : `dettagli del disegno larghi almeno ${wtxt} mm`}`;
          });
          row.appendChild(bar);
        }
      }
      if (p.help) { const h = document.createElement('p'); h.className = 'help'; h.textContent = p.help; row.appendChild(h); }
      sections.get(p.sec).appendChild(row);
    }
    updateVisibility();
    renderHeader();
    $('#openWrap').hidden = mode !== 'cab' && mode !== 'lego';
        $('#openLabel').textContent = 'Apri cassetti';
  }
  function updateVisibility() {
    const v = values(state.mode);
    for (const p of MODES[state.mode].params) {
      const row = panel.querySelector(`.row[data-id="${p.id}"]`);
      if (row) row.hidden = p.show ? !p.show(v) : false;
      const mb = row && row.querySelector('.min-ins');
      if (mb) {
        const r = minSizeOf(p, v, true);
        mb.hidden = !r;
        if (r && r.kind === 'logo') mb.querySelector('button').textContent = `Minima stampabile: ${fmtNum(Math.ceil(r.val * 2 - 1e-9) / 2, 0.5).replace('.', ',')} mm`;
      }
    }
    // nasconde le sezioni senza parametri visibili
    panel.querySelectorAll('details.sec').forEach(d => { d.hidden = ![...d.querySelectorAll('.row')].some(r => !r.hidden); });
  }
  function set(p, val, soft) {
    (state.values[state.mode] ||= {})[p.id] = val;
    if (p.onSet) { const upd = p.onSet(val, values(state.mode)); if (upd) { Object.assign(state.values[state.mode], upd); save(); renderParams(); schedule(60); return; } }
    save(); updateVisibility(); schedule(soft ? 350 : 60);
  }

  // ================= VIEWER 3D =================
  const view = $('#view');
  // senza WebGL (scheda video vecchia, accelerazione hardware spenta, PC aziendali) il sito
  // deve funzionare lo stesso: niente anteprima 3D, ma parametri ed esportazione sì
  let noGL = false, renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
  catch (e) {
    console.warn('WebGL non disponibile', e); noGL = true;
    renderer = { domElement: document.createElement('canvas'), setPixelRatio() {}, setSize() {}, render() {}, localClippingEnabled: false };
    const msg = document.createElement('div'); msg.className = 'nogl';
    msg.textContent = 'Anteprima 3D non disponibile in questo browser (WebGL disattivato). Puoi comunque regolare le misure e scaricare il file.';
    view.appendChild(msg);
  }
  renderer.localClippingEnabled = true;
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let sectionOn = false;
  const clipList = () => sectionOn ? [clipPlane] : [];
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  view.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
  camera.up.set(0, 0, 1);
  camera.position.set(-180, -260, 200);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 0.62));
  const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(-1, -1.6, 2.4); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.25); fill.position.set(1.5, 1, 0.6); scene.add(fill);
  const modelGroup = new THREE.Group(); scene.add(modelGroup);
  let gridObj = null;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  const mats = {};
  function material(role) {
    if (role === 'ghost') {
      if (!mats.ghost) mats.ghost = new THREE.MeshStandardMaterial({ color: '#5b8de0', transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.4 });
      mats.ghost.color.set(cssVar('--accent') || '#5b8de0');
      return mats.ghost;
    }
    const accentRole = role === 'drawer' || role === 'latch' || role === 'pin' || role === 'inner';
    const col = cssVar(accentRole ? '--model-2' : '--model-1') || (accentRole ? '#e0703a' : '#d9dcd6');
    if (!mats[role]) mats[role] = new THREE.MeshStandardMaterial({ color: col, roughness: 0.62, metalness: 0.0, flatShading: false });
    mats[role].color.set(col);
    mats[role].clippingPlanes = clipList(); mats[role].side = sectionOn ? THREE.DoubleSide : THREE.FrontSide; mats[role].needsUpdate = true;
    return mats[role];
  }
  // pezzi con un colore proprio (Natale): un materiale per colore
  function materialFor(part) {
    if (!part.color) return material(part.role);
    const k = 'c' + part.color;
    if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial({ color: part.color, roughness: 0.55, metalness: 0.0 });
    mats[k].color.set(part.color);
    mats[k].clippingPlanes = clipList(); mats[k].side = sectionOn ? THREE.DoubleSide : THREE.FrontSide; mats[k].needsUpdate = true;
    return mats[k];
  }
  function edgesMat() { return new THREE.LineBasicMaterial({ color: cssVar('--edge') || '#3b4148', transparent: true, opacity: 0.35, clippingPlanes: clipList() }); }

  // griglia in scala sul piano z = 0: quadretti da 10 mm e linee marcate ogni 50 mm con le misure
  // (per i generatori Gridfinity il passo è quello della griglia, 42 mm)
  let gridStep = 10;
  function makeGrid(bb) {
    if (gridObj) { scene.remove(gridObj); gridObj.traverse(o => { o.geometry && o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    const gf = ['bin', 'cab', 'base'].includes(state.mode);
    const P = gf ? 42 : 10, M = gf ? 42 : 50; gridStep = P;
    const x0 = Math.floor((Math.min(bb.min.x, 0) - 2 * P) / M) * M, x1 = Math.ceil((Math.max(bb.max.x, 0) + 2 * P) / M) * M;
    const y0 = Math.floor((Math.min(bb.min.y, 0) - 2 * P) / M) * M, y1 = Math.ceil((Math.max(bb.max.y, 0) + 2 * P) / M) * M;
    const minor = [], major = [];
    for (let x = x0; x <= x1 + 1e-6; x += P) (Math.abs(x / M - Math.round(x / M)) < 1e-6 ? major : minor).push(x, y0, -0.05, x, y1, -0.05);
    for (let y = y0; y <= y1 + 1e-6; y += P) (Math.abs(y / M - Math.round(y / M)) < 1e-6 ? major : minor).push(x0, y, -0.05, x1, y, -0.05);
    const col = cssVar('--grid') || '#b9c0c6';
    const lines = (pos, op) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })); };
    gridObj = new THREE.Group();
    if (!gf) gridObj.add(lines(minor, 0.45));
    if (gf) gridObj.add(lines(minor.concat(major), 0.95));
    else { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(major, 3)); gridObj.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: cssVar('--muted') || '#6b7280', transparent: true, opacity: 0.55 }))); }
    // misure lungo il bordo davanti (asse x) e a sinistra (asse y), in mm
    const txtCol = cssVar('--muted') || '#6b7280';
    const label = (txt, x, y) => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
      g.font = '600 52px system-ui, sans-serif'; g.fillStyle = txtCol; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 48);
      const t = new THREE.CanvasTexture(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
      const h = M * 0.16; sp.scale.set(h * 256 / 96, h, 1); sp.position.set(x, y, 0.5); gridObj.add(sp);
    };
    // numeri vicino al modello: davanti (asse x) e a sinistra (asse y)
    const yl = Math.floor((bb.min.y - P) / P) * P - M * 0.12, xl = Math.floor((bb.min.x - P) / P) * P - M * 0.25;
    const xa = Math.floor(bb.min.x / M) * M, xb = Math.ceil(bb.max.x / M) * M, ya = Math.floor(bb.min.y / M) * M, yb = Math.ceil(bb.max.y / M) * M;
    for (let x = xa; x <= xb + 1e-6; x += M) label(`${Math.round(x)}`, x, yl);
    for (let y = ya; y <= yb + 1e-6; y += M) if (Math.round(y) !== 0 || xa !== 0) label(`${Math.round(y)}`, xl, y);
    label('mm', xb + M * 0.45, yl);
    scene.add(gridObj);
  }

  const capGeo = new THREE.PlaneGeometry(1, 1);
  const geoCache = new WeakMap();
  function geomFor(mesh) {
    if (geoCache.has(mesh)) return geoCache.get(mesh);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(mesh.pos, 3));
    g.setIndex(new THREE.BufferAttribute(mesh.tri, 1));
    const flat = g.toNonIndexed(); flat.computeVertexNormals(); g.dispose();
    // spigoli: sopra gli 80 000 triangoli (viti stampate, filetti) sarebbero solo un groviglio di linee e costano centinaia di ms
    const edges = mesh.tri.length / 3 > 80000 ? new THREE.BufferGeometry() : new THREE.EdgesGeometry(flat, 28);
    const r = { flat, edges }; geoCache.set(mesh, r); return r;
  }

  let current = null;  // ultimo risultato
  const real = (parts) => parts.filter(p => p.role !== 'ghost');
  let fitted = null;
  let capIndex = 0, caps = [];
  function showResult(res) {
    for (const c of [...modelGroup.children]) { modelGroup.remove(c); if (c.userData.cap) c.material.dispose(); }
    capIndex = 0; caps = [];
    current = res;
    let bb = new THREE.Box3(), bbAll = new THREE.Box3();
    for (const part of res.parts) {
      const { flat, edges } = geomFor(part.mesh);
      const grp = new THREE.Group();
      const main = new THREE.Mesh(flat, materialFor(part));
      grp.add(main);
      if (part.role !== 'ghost') grp.add(new THREE.LineSegments(edges, edgesMat()));
      // sezione: maschera stencil dell'interno del pezzo, poi un tappo colorato sul piano di taglio
      if (sectionOn && part.role !== 'ghost') {
        const k = capIndex++;
        main.renderOrder = 1000;
        for (const [side, op] of [[THREE.BackSide, THREE.IncrementWrapStencilOp], [THREE.FrontSide, THREE.DecrementWrapStencilOp]]) {
          const m = new THREE.Mesh(flat, new THREE.MeshBasicMaterial({ side, clippingPlanes: [clipPlane], colorWrite: false, depthWrite: false, depthTest: false,
            stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilFail: op, stencilZFail: op, stencilZPass: op }));
          m.renderOrder = k * 3 + 1; grp.add(m);
        }
        caps.push({ k, part });
      }
      grp.userData.part = part;
      if (part.at) grp.position.set(part.at[0], part.at[1], part.at[2]);
      if (part.pivot) {
        const piv = new THREE.Group(); piv.position.set(0, part.pivot[0], part.pivot[1]);
        grp.position.set(0, -part.pivot[0], -part.pivot[1]);
        piv.add(grp); piv.userData.part = part; piv.userData.isPivot = true; modelGroup.add(piv);
      } else modelGroup.add(grp);
      if (part.role === 'body') { bb.expandByPoint(new THREE.Vector3(...part.mesh.min)); bb.expandByPoint(new THREE.Vector3(...part.mesh.max)); }
    }
    applyOpen();
    modelGroup.position.z = 0; modelGroup.updateMatrixWorld(true); bbAll.setFromObject(modelGroup);
    // il punto più basso tocca il piano z = 0, come nel file esportato
    if (isFinite(bbAll.min.z) && Math.abs(bbAll.min.z) > 1e-3) { modelGroup.position.z = -bbAll.min.z; modelGroup.updateMatrixWorld(true); bbAll.setFromObject(modelGroup); }
    // tappi: un piano y = 0 per pezzo, disegnato solo dove la maschera stencil dice "dentro"
    const span = Math.max(10, bbAll.getSize(new THREE.Vector3()).length() * 2), ctr = bbAll.getCenter(new THREE.Vector3());
    for (const { k, part } of caps) {
      const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: materialFor(part).color, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp }));
      cap.rotation.x = Math.PI / 2; cap.position.set(ctr.x, 0, ctr.z); cap.scale.set(span, span, 1);
      cap.renderOrder = k * 3 + 2; cap.userData.cap = true;
      cap.onAfterRender = (r) => r.clearStencil();
      modelGroup.add(cap);
    }
    const size = bb.getSize(new THREE.Vector3());
    makeGrid(bbAll);
    const key = state.mode;
    if (!fitted || fitted.key !== key || size.length() > fitted.len * 1.3 || size.length() < fitted.len / 1.5) { fitView(bbAll, res.view); fitted = { key, len: size.length() }; }
    // info
    const info = $('#info');
    // Nota = qualcosa da cambiare (rosso, con il suggerimento). Le informazioni senza modifiche da fare iniziano con "~" e escono neutre come "Info"
    const rows = res.info.map(([k, v]) => (k === 'Nota' && String(v)[0] === '~' ? ['Info', String(v).slice(1)] : [k, v]));
    info.innerHTML = rows.map(([k, v]) => {
      const cls = k === 'Spazio interno' ? 'key' : k.startsWith('  ') ? 'sub' : k === 'Nota' ? 'warn' : '';
      return `<div class="${cls}"><dt>${esc(k.trim())}</dt><dd>${esc(v)}</dd></div>`;
    }).join('');
    const vol = real(res.parts).reduce((s, p) => s + p.mesh.volume, 0) / 1000;
    info.innerHTML += `<div><dt>Volume materiale</dt><dd>${vol.toFixed(1).replace('.', ',')} cm³</dd></div>`;
    // le note restano visibili come numero sul pulsante, anche a riquadro chiuso
    const nNote = rows.filter(([k]) => k === 'Nota').length, badge = $('#infoBadge');
    badge.hidden = !nNote; badge.textContent = nNote; badge.title = nNote === 1 ? '1 nota' : `${nNote} note`;
    const rp = real(res.parts), bad = rp.find(p => p.mesh.status !== 'NoError');
    const ghosts = res.parts.length - rp.length;
    const nU = printUnits(res.parts).length, nC = new Set(rp.map(p => p.color).filter(Boolean)).size;
    setStatus(bad ? 'Geometria con errori: prova a cambiare i valori' : (nU === 1 ? '1 pezzo pronto' : `${nU} pezzi pronti`) + (nC > 1 ? ` · ${nC} colori` : '') + (ghosts ? ' · in azzurro gli oggetti di esempio' : '') + ` · griglia ${gridStep} mm`, bad ? 'err' : 'ok');
  }
  function applyOpen() {
    for (const grp of modelGroup.children) {
      const part = grp.userData.part;
      if (part && part.role === 'drawer') grp.position.y = part.at[1] - state.open * part.size[1] * 0.85;
      if (grp.userData.isPivot) grp.rotation.x = -state.open * 115 * Math.PI / 180;
    }
  }
  function fitView(bb, view) {
    const c = bb.getCenter(new THREE.Vector3()); const r = bb.getSize(new THREE.Vector3()).length() / 2;
    controls.target.copy(c);
    const dist = r / Math.sin((camera.fov * Math.PI / 180) / 2) * 1.05;
    const dir = new THREE.Vector3(...(view || [-0.55, -0.95, 0.75])).normalize();
    camera.position.copy(c).addScaledVector(dir, dist);
    camera.near = Math.max(0.5, dist / 100); camera.far = dist * 20; camera.updateProjectionMatrix();
    controls.update();
  }
  function resize() {
    const w = view.clientWidth, h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(view);
  (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

  // ================= GENERAZIONE =================
  let G = null, timer = null;
  function setStatus(t, cls) { const s = $('#status'); s.textContent = t; s.className = 'status ' + (cls || ''); }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(regen, ms); }
  function regen() {
    if (!G) return;
    setStatus('Generazione…', 'busy');
    requestAnimationFrame(() => setTimeout(() => {
      try { showResult(G.build(state.mode, values(state.mode))); }
      catch (e) { console.error(e); setStatus('Errore: ' + (e && e.message || e), 'err'); }
    }, 0));
  }

  // ================= EXPORT =================
  // pezzi da stampare: le parti con lo stesso `group` formano un solo oggetto (multicolore), le altre vanno da sole
  function printUnits(parts) {
    const units = [], byKey = new Map();
    for (const p of real(parts)) {
      const key = p.group || p;
      if (!byKey.has(key)) { const u = { name: p.group || p.name, members: [] }; byKey.set(key, u); units.push(u); }
      byKey.get(key).members.push({ part: p, mesh: p.printMesh || p.mesh });
    }
    for (const u of units) {
      u.min = [Infinity, Infinity, Infinity]; u.max = [-Infinity, -Infinity, -Infinity];
      for (const { mesh } of u.members) for (let i = 0; i < 3; i++) { u.min[i] = Math.min(u.min[i], mesh.min[i]); u.max[i] = Math.max(u.max[i], mesh.max[i]); }
    }
    return units;
  }
  function layoutForPrint(parts) {
    // primo pezzo in origine, gli altri in fila a destra (si possono riordinare nello slicer)
    const units = printUnits(parts), gap = 6;
    const first = units[0], bw = first.max[0] - first.min[0];
    first.tx = -first.min[0]; first.ty = -first.min[1]; first.tz = -first.min[2];
    let x = bw + gap * 2, y = 0, rowH = 0; const maxW = Math.max(bw * 2.2, 260);
    for (const u of units.slice(1)) {
      const w = u.max[0] - u.min[0], d = u.max[1] - u.min[1];
      if (x + w > maxW && x > bw + gap * 2) { x = bw + gap * 2; y += rowH + gap; rowH = 0; }
      u.tx = x - u.min[0]; u.ty = y - u.min[1]; u.tz = -u.min[2];
      x += w + gap; rowH = Math.max(rowH, d);
    }
    return units;
  }
  const n4 = (v) => { const s = (Math.round(v * 10000) / 10000).toString(); return s === '-0' ? '0' : s; };
  const hex8 = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() + 'FF' : '#808080FF');
  function build3MF(res, title) {
    const units = layoutForPrint(res.parts);
    // colori come materiali base: gli slicer li mostrano e li propongono come filamenti
    const colors = [...new Set(units.flatMap(u => u.members.map(m => m.part.color)).filter(Boolean))];
    let id = colors.length ? 1 : 0, objs = '', build = '';
    const mats = colors.length ? `<basematerials id="1">${colors.map((c, i) => `<base name="Colore ${i + 1}" displaycolor="${hex8(c)}"/>`).join('')}</basematerials>\n` : '';
    const meshObj = (part, mesh) => {
      const oid = ++id, { pos, tri } = mesh;
      const v = []; for (let k = 0; k < pos.length; k += 3) v.push(`<vertex x="${n4(pos[k])}" y="${n4(pos[k + 1])}" z="${n4(pos[k + 2])}"/>`);
      const t = []; for (let k = 0; k < tri.length; k += 3) t.push(`<triangle v1="${tri[k]}" v2="${tri[k + 1]}" v3="${tri[k + 2]}"/>`);
      const ci = colors.indexOf(part.color);
      objs += `<object id="${oid}" name="${esc(part.name)}" type="model"${ci >= 0 ? ` pid="1" pindex="${ci}"` : ''}><mesh><vertices>${v.join('')}</vertices><triangles>${t.join('')}</triangles></mesh></object>\n`;
      return oid;
    };
    // Gli slicer non leggono i colori del 3MF base: il filamento di ogni parte va scritto nei loro file di configurazione
    // (Bambu Studio / OrcaSlicer: model_settings.config, PrusaSlicer: Slic3r_PE_model.config). Senza, la scritta a filo ha lo stesso
    // filamento del resto e nello slicer non si vede.
    const multi = colors.length > 1, extOf = (m) => Math.max(1, colors.indexOf(m.part.color) + 1);
    let cfgB = '', cfgP = '';
    for (const u of units) {
      let oid, ids = [];
      if (u.members.length === 1) oid = meshObj(u.members[0].part, u.members[0].mesh);
      else {
        // oggetto con più parti: lo slicer lo apre come un solo pezzo e assegni un filamento a ogni parte
        ids = u.members.map(m => meshObj(m.part, m.mesh));
        oid = ++id;
        objs += `<object id="${oid}" name="${esc(u.name)}" type="model"><components>${ids.map(c => `<component objectid="${c}"/>`).join('')}</components></object>\n`;
      }
      if (multi) {
        const e0 = extOf(u.members[0]);
        cfgB += `<object id="${oid}"><metadata key="name" value="${esc(u.name)}"/><metadata key="extruder" value="${e0}"/>`;
        cfgP += `<object id="${oid}" instances_count="1"><metadata type="object" key="name" value="${esc(u.name)}"/><metadata type="object" key="extruder" value="${e0}"/>`;
        let first = 0;
        u.members.forEach((m, i) => {
          const n = m.mesh.tri.length / 3, e = extOf(m), nm = esc(m.part.name);
          if (u.members.length > 1) cfgB += `<part id="${ids[i]}" subtype="normal_part"><metadata key="name" value="${nm}"/><metadata key="extruder" value="${e}"/></part>`;
          cfgP += `<volume firstid="${first}" lastid="${first + n - 1}"><metadata type="volume" key="name" value="${nm}"/><metadata type="volume" key="volume_type" value="ModelPart"/><metadata type="volume" key="extruder" value="${e}"/></volume>`;
          first += n;
        });
        cfgB += '</object>\n'; cfgP += '</object>\n';
      }
      build += `<item objectid="${oid}" transform="1 0 0 0 1 0 0 0 1 ${n4(u.tx)} ${n4(u.ty)} ${n4(u.tz)}"/>\n`;
    }
    const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="it-IT" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Title">${esc(title)}</metadata>
<metadata name="Application">SP Lab</metadata>
<metadata name="CreationDate">${new Date().toISOString().slice(0, 10)}</metadata>
<resources>
${mats}${objs}</resources>
<build>
${build}</build>
</model>`;
    const ct = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="text/xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
    const files = [['[Content_Types].xml', ct], ['_rels/.rels', rels], ['3D/3dmodel.model', model]];
    if (multi) files.push(['Metadata/model_settings.config', `<?xml version="1.0" encoding="UTF-8"?>\n<config>\n${cfgB}</config>\n`], ['Metadata/Slic3r_PE_model.config', `<?xml version="1.0" encoding="UTF-8"?>\n<config>\n${cfgP}</config>\n`]);
    return zip(files);
  }
  function buildSTL(res) {
    // STL: un solo colore, tutte le parti insieme
    const items = layoutForPrint(res.parts).flatMap(u => u.members.map(m => ({ mesh: m.mesh, tx: u.tx, ty: u.ty, tz: u.tz })));
    let ntri = 0; for (const it of items) ntri += it.mesh.tri.length / 3;
    const buf = new ArrayBuffer(84 + ntri * 50); const dv = new DataView(buf);
    const hdr = 'SP Lab'; for (let i = 0; i < hdr.length; i++) dv.setUint8(i, hdr.charCodeAt(i));
    dv.setUint32(80, ntri, true); let o = 84;
    for (const it of items) {
      const { pos, tri } = it.mesh;
      for (let k = 0; k < tri.length; k += 3) {
        const a = tri[k] * 3, b = tri[k + 1] * 3, c = tri[k + 2] * 3;
        const ax = pos[a] + it.tx, ay = pos[a + 1] + it.ty, az = pos[a + 2] + it.tz;
        const bx = pos[b] + it.tx, by = pos[b + 1] + it.ty, bz = pos[b + 2] + it.tz;
        const cx = pos[c] + it.tx, cy = pos[c + 1] + it.ty, cz = pos[c + 2] + it.tz;
        let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay), ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az), nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        const l = Math.hypot(nx, ny, nz) || 1;
        for (const val of [nx / l, ny / l, nz / l, ax, ay, az, bx, by, bz, cx, cy, cz]) { dv.setFloat32(o, val, true); o += 4; }
        dv.setUint16(o, 0, true); o += 2;
      }
    }
    return new Uint8Array(buf);
  }
  function esc(s) { return String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])); }

  // ZIP (metodo store) con CRC32
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    const enc = new TextEncoder(); const chunks = []; const central = []; let offset = 0;
    const d = new Date(); const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1); const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const [name, content] of files) {
      const data = typeof content === 'string' ? enc.encode(content) : content; const nm = enc.encode(name); const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), nm, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nm);
      offset += 30 + nm.length + data.length;
    }
    const cSize = central.reduce((s, c) => s + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cSize, true); end.setUint32(16, offset, true);
    const all = [...chunks, ...central, new Uint8Array(end.buffer)]; const total = all.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(total); let p = 0; for (const c of all) { out.set(c, p); p += c.length; } return out;
  }

  function fileBase() {
    const v = values(state.mode);
    const s = state.mode === 'bin' ? `contenitore_${v.gridX}x${v.gridY}x${v.altU}` : state.mode === 'vaso' ? `vaso_${v.forma}_${Math.round(v.larghezza)}x${Math.round(v.altezza)}_${v.tipo}` : state.mode === 'rack' ? `rack_${String(v.spessoriLista || '').trim() ? 'misto' : v.fessure + 'x' + v.spessore + 'mm'}_${v.base}` : state.mode === 'cab' ? `cassettiera_${v.gridX}x${v.gridY}x${v.altU}_${v.righe * v.colonne}cassetti` : state.mode === 'base' ? `base_${v.gridX}x${v.gridY}` : null;
    if (state.mode === 'lego') return `cassetto-modulare_${v.larghezza}x${v.profondita}_${v.unita}mm_h${v.altezza}`;
    if (state.mode === 'cover') { const nm = String(v.scritta || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24); return `cover_${v.modello}_${v.materiale}${v.tipo === 'cavalletto' ? '_cavalletto' : ''}${v.prova !== 'nessuna' ? '_prova-' + v.prova : ''}${nm ? '_' + nm : ''}`; }
    if (state.mode === 'powerbank') return `powerbank_${v.scheda}_${v.contatti === 'portapile' ? v.ppN * v.ppCelle : v.celle}celle_${v.coperchio}${v.prova && v.prova !== 'nessuna' ? '_prova-' + v.prova : ''}`;
    if (state.mode === 'barattolo') { const nm = String(v.scritta || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24); return `barattolo_${v.formato === 'misura' ? Math.round(v.diametro) + 'x' + Math.round(v.altezza) : v.formato}${nm ? '_' + nm : ''}`; }
    if (state.mode === 'tablet') return `supporto-tablet_${v.modello === 'misura' ? Math.round(v.larghezza) + 'x' + Math.round(v.altezza) : v.modello}_${v.orientamento}`;
    if (state.mode === 'schede') return `box_${v.cpu}${[1, 2, 3, 4, 5].map(i => v['mod' + i]).filter(k => k && k !== 'nessuno').map(k => '_' + k).join('')}`;
    if (s) return s;
    const slug = (x) => String(x || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const nm = slug(v.scritta) ? '_' + slug(v.scritta) : '';
    if (state.mode === 'pallina') return `pallina_${v.forma}_${v.diametro}mm${nm}`;
    if (state.mode === 'spirale') { const n1 = [1, 2, 3, 4].map(i => v['lato' + i] === 'scritta' ? slug(v['testo' + i]) : '').find(Boolean); return `pallina-spirale_${v.diametro}mm${n1 ? '_' + n1 : ''}`; }
    if (state.mode === 'piatto') return `decorazione_${v.forma}${nm}`;
    if (state.mode === 'palla') return `palla-piatta_${v.figura && v.figura !== 'nessuna' ? v.figura : v.sfondo}${nm}`;
    if (state.mode === 'albero') return `albero_${v.stile}_${v.altezza}mm`;
    if (state.mode === 'stella') return `stella_${v.uso}_${v.diametro}mm`;
    if (state.mode === 'lanterna') return `lanterna_${v.forma}_${v.disegno}`;
    if (state.mode === 'formina') return `formina_${v.forma}${v.timbro && nm ? nm : ''}`;
    if (state.mode === 'tennis') return `antivibrazione-tennis_${v.modello}${v.modello === 'bottone' ? '_' + v.forma : ''}${nm}`;
    if (state.mode === 'padel') return `antivibrazione-padel_${v.tipo}_${String(v.foro).replace('.', ',')}mm${nm}`;
    const mis = v.misura === 'custom' ? `M${String(v.diam).replace('.', ',')}x${String(v.passo).replace('.', ',')}` : v.misura;
    if (state.mode === 'mensola') return `reggimensola_${v.profondita}x${v.altezza}_${v.tipo}`;
    if (state.mode === 'gancio') return `gancio_${v.tipo}${v.tipo === 'muro' || v.tipo === 'porta' ? '_' + v.numero : ''}`;
    if (state.mode === 'vite') return `vite_${mis}x${v.lunghezza}_${v.testa}`;
    if (state.mode === 'bullone') return `bullone_${mis}x${v.lunghezza}_dado-${v.dado}`;
    return v.tipo === 'scatto' ? `perno_scatto_${v.diam}mm_${v.estremita}` : `perno_${v.tipo}_${v.diam}x${v.lunghezza}`;
  }
  let downloadsCap;
  const inArtifact = !!window.claude && typeof window.claude.use === 'function';
  async function getDownloads() {
    if (!inArtifact) return null;
    if (downloadsCap === undefined) { try { downloadsCap = await window.claude.use('downloads'); } catch (e) { downloadsCap = null; } }
    return downloadsCap;
  }
  async function deliver(name, data, mime) {
    const dl = await getDownloads();
    if (dl) {
      // la pagina online accetta solo alcuni formati: il file va dentro uno zip
      const z = zip([[name, data]]);
      try { await dl.save({ filename: name.replace(/\.[a-z0-9]+$/i, '') + '.zip', data: z }); setStatus('File salvato (zip)', 'ok'); }
      catch (e) { setStatus(e && e.code === 'declined' ? 'Salvataggio annullato' : 'Salvataggio non disponibile qui: usa il file sul computer', 'err'); }
      return;
    }
    const blob = new Blob([data], { type: mime });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    setStatus('Scaricato ' + name, 'ok');
  }
  $('#exp3mf').addEventListener('click', () => { if (current) deliver(fileBase() + '.3mf', build3MF(current, fileBase()), 'model/3mf'); });
  $('#expstl').addEventListener('click', () => { if (current) deliver(fileBase() + '.stl', buildSTL(current), 'model/stl'); });
  if (inArtifact) { $('#exp3mf').title = 'Scarica uno zip con dentro il file .3mf'; $('#expstl').title = 'Scarica uno zip con dentro il file .stl'; }

  // ================= NAVIGAZIONE =================
  function renderHeader() {
    const g = groupOf(state.mode);
    $('#groupTitle').textContent = g.title;
    const tabs = $('#subtabs');
    tabs.hidden = g.modes.length < 2;
    tabs.innerHTML = g.modes.map(m => `<button class="tab" role="tab" type="button" data-mode="${m}" id="tab-${m}" aria-selected="${m === state.mode}">${MODES[m].label}</button>`).join('');
    tabs.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.mode)));
  }
  const hashFor = (mode) => { const g = groupOf(mode); return g.modes.length > 1 && mode !== g.modes[0] ? `${g.id}-${mode}` : g.id; };
  let wanted = null;  // scheda scelta: la prima di un gruppo ha come indirizzo quello del gruppo
  function go(mode) { wanted = mode; if (location.hash.slice(1) !== hashFor(mode)) location.hash = hashFor(mode); else route(); }
  let inHome = true;
  let fileH = null;                                           // ultimo file salvato o aperto: { mode, name }, si vede nell'header
  function route() {
    const h = location.hash.slice(1);
    let mode = null;
    for (const g of GROUPS) {
      if (h === g.id) mode = wanted && g.modes.includes(wanted) ? wanted : g.modes[0];
      for (const m of g.modes) if (h === `${g.id}-${m}`) mode = m;
    }
    wanted = null;
    inHome = !mode;
    $('#home').hidden = !inHome; $('#genView').hidden = inHome; $('#crumbs').hidden = inHome; $('#actions').hidden = inHome;
    $('#fmSaveAs').disabled = inHome; showFileName();
    if (inHome) { renderThumbs(); return; }
    if (mode !== state.mode || !current) { state.mode = mode; save(); renderParams(); fitted = null; schedule(0); } else renderHeader();
    requestAnimationFrame(resize);
  }
  window.addEventListener('hashchange', route);
  $('#back').addEventListener('click', () => { location.hash = ''; });
  $('#brand').addEventListener('click', (e) => { e.preventDefault(); location.hash = ''; });

  // pagina iniziale: schede con anteprima generata dal motore
  function renderHome() {
    // una sola griglia, tre schede per riga; la categoria è scritta sulla scheda
    $('#cats').innerHTML = `<div class="cards">${GROUPS.map(g => `
      <button class="card" type="button" data-group="${g.id}" id="card-${g.id}">
        <div class="thumb"><img alt="" hidden><span class="ph">anteprima…</span></div>
        <div class="body"><span class="kicker">${esc(g.cat)}</span><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p>${g.modes.length > 1 ? `<div class="chips">${g.modes.map(m => `<span class="chip">${esc(MODES[m].label)}</span>`).join('')}</div>` : ''}</div>
      </button>`).join('')}</div>`;
    // dalla pagina iniziale si torna all'ultima scheda usata nel gruppo
    document.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => {
      const g = GROUPS.find(x => x.id === c.dataset.group);
      go(g.modes.includes(state.mode) ? state.mode : g.modes[0]);
    }));
  }
  const thumbCache = {};
  let thumbR = null;
  function renderThumbs() {
    if (!G) return;
    for (const g of GROUPS) {
      const img = document.querySelector(`#card-${g.id} img`), ph = document.querySelector(`#card-${g.id} .ph`);
      if (!img) continue;
      if (!thumbCache[g.id]) {
        if (noGL) { if (ph) ph.textContent = 'anteprima non disponibile'; continue; }
        try { thumbCache[g.id] = makeThumb(g.thumb); } catch (e) { console.error(e); continue; }
      }
      img.src = thumbCache[g.id]; img.hidden = false; if (ph) ph.hidden = true;
    }
  }
  function makeThumb(mode) {
    const defs = {}; for (const p of MODES[mode].params) defs[p.id] = p.def;
    const res = G.build(mode, defs);
    if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setPixelRatio(1); thumbR.setSize(540, 360, false); }
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 0.62));
    const l1 = new THREE.DirectionalLight(0xffffff, 0.6); l1.position.set(-1, -1.6, 2.4); sc.add(l1);
    const l2 = new THREE.DirectionalLight(0xffffff, 0.25); l2.position.set(1.5, 1, 0.6); sc.add(l2);
    const grp = new THREE.Group(); sc.add(grp);
    const temp = [];
    for (const part of res.parts) {
      const { flat, edges } = geomFor(part.mesh);
      const o = new THREE.Group();
      o.add(new THREE.Mesh(flat, materialFor(part)));
      if (part.role !== 'ghost') o.add(new THREE.LineSegments(edges, edgesMat()));
      if (part.at) o.position.set(part.at[0], part.at[1], part.at[2]);
      if (part.role === 'drawer') o.position.y = part.at[1] - 0.35 * part.size[1] * 0.85;
      grp.add(o); temp.push(flat, edges);
    }
    grp.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(grp);
    const cam = new THREE.PerspectiveCamera(30, 1.5, 1, 5000); cam.up.set(0, 0, 1);
    const c = bb.getCenter(new THREE.Vector3()), r = bb.getSize(new THREE.Vector3()).length() / 2;
    const dist = r / Math.sin((cam.fov * Math.PI / 180) / 2) * 0.92;
    cam.position.copy(c).addScaledVector(new THREE.Vector3(...(res.view || [-0.55, -0.95, 0.75])).normalize(), dist);
    cam.near = dist / 100; cam.far = dist * 10; cam.lookAt(c); cam.updateProjectionMatrix();
    thumbR.render(sc, cam);
    return thumbR.domElement.toDataURL('image/png');
  }

  // ================= EVENTI =================
  $('#reset').addEventListener('click', () => { delete state.values[state.mode]; save(); renderParams(); schedule(0); });
  // ---- menu File: le impostazioni del generatore si salvano in un file .json, col nome scelto al momento di salvare.
  // Con le API dei file (Chrome, Edge) si apre la finestra di sistema; altrove (Safari, Firefox, claude.ai) si scarica
  const canPick = typeof window.showSaveFilePicker === 'function' && !inArtifact;
  const JSON_TYPES = [{ description: 'Impostazioni SP Lab', accept: { 'application/json': ['.json'] } }];
  const fileData = (name) => new TextEncoder().encode(JSON.stringify({ splab: 1, mode: state.mode, name, values: values(state.mode) }, null, 1));
  const baseName = (n) => String(n).replace(/\.json$/i, '').slice(0, 60);
  function showFileName() {
    const on = !inHome && fileH && fileH.mode === state.mode, el = $('#fmCur');
    el.hidden = !on; if (on) { el.textContent = fileH.name + '.json'; el.title = 'File salvato o aperto: ' + fileH.name + '.json'; }
  }
  function setFile(name) { fileH = { mode: state.mode, name }; showFileName(); }
  // senza le API dei file (Safari, Firefox) il nome si chiede in una finestrella e il file si scarica in Download.
  // Il download deve partire dentro il clic su "Salva": se parte dopo (alla chiusura della finestra) Safari lo blocca
  function download(name) {
    const data = fileData(name), fn = name.replace(/[\/\\:*?"<>|]+/g, '_') + '.json';
    setFile(name);
    if (inArtifact) { deliver(fn, data, 'application/json'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = fn;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    setStatus('Salvato in Download: ' + fn, 'ok');
  }
  $('#fmDlg').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = baseName($('#fmName').value.trim());
    if (!name) return;
    $('#fmDlg').close();
    download(name);
  });
  $('#fmNo').addEventListener('click', () => $('#fmDlg').close());
  async function saveAs() {
    if (inHome) return;
    const def = fileH && fileH.mode === state.mode ? fileH.name : fileBase();
    if (!canPick) {
      const dlg = $('#fmDlg'), inp = $('#fmName');
      if (typeof dlg.showModal !== 'function') { download(def); return; }
      inp.value = def; dlg.showModal(); inp.focus(); inp.select();
      return;
    }
    try {
      const h = await window.showSaveFilePicker({ suggestedName: def + '.json', types: JSON_TYPES });
      const name = baseName(h.name), w = await h.createWritable();
      await w.write(fileData(name)); await w.close();
      setFile(name); setStatus('Salvato: ' + name + '.json', 'ok');
    } catch (e) { if (e && e.name !== 'AbortError') setStatus('Salvataggio non riuscito', 'err'); }
  }
  function loadText(text, fname) {
    let d = null; try { d = JSON.parse(String(text || '')); } catch (err) { d = null; }
    if (!d || !d.values || !MODES[d.mode]) { setStatus('Il file non contiene impostazioni di SP Lab', 'err'); return; }
    const name = baseName(fname);
    state.values[d.mode] = JSON.parse(JSON.stringify(d.values));
    fileH = { mode: d.mode, name };
    save();
    if (inHome || d.mode !== state.mode) go(d.mode);            // dalla pagina iniziale o da un altro generatore: ci vado
    if (d.mode === state.mode) { renderParams(); schedule(0); }
    showFileName();
    setStatus('Aperto: ' + name + '.json', 'ok');
  }
  async function openFile() {
    if (typeof window.showOpenFilePicker !== 'function' || inArtifact) { $('#fmInput').click(); return; }
    try { const [h] = await window.showOpenFilePicker({ types: JSON_TYPES }); const f = await h.getFile(); loadText(await f.text(), f.name); }
    catch (e) { if (e && e.name !== 'AbortError') setStatus('Il file non si apre', 'err'); }
  }
  $('#fmInput').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => loadText(rd.result, f.name);
    rd.readAsText(f);
  });
  const showFileMenu = (on) => { $('#fileMenu').hidden = !on; $('#fileBtn').setAttribute('aria-expanded', on); if (on) $('#fileMenu button:not(:disabled)').focus(); };
  $('#fileBtn').addEventListener('click', () => showFileMenu($('#fileMenu').hidden));
  document.addEventListener('click', (e) => { if (!e.target.closest('.filemenu')) showFileMenu(false); });
  for (const [id, fn] of [['#fmSaveAs', saveAs], ['#fmOpen', openFile]]) $(id).addEventListener('click', () => { showFileMenu(false); fn(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#fileMenu').hidden) { showFileMenu(false); $('#fileBtn').focus(); return; }
    if (!(e.metaKey || e.ctrlKey) || e.altKey || $('#fmDlg').open) return;
    const k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); saveAs(); }
    else if (k === 'o' && !e.shiftKey) { e.preventDefault(); openFile(); }
  });
  $('#section').addEventListener('click', () => { sectionOn = !sectionOn; $('#section').setAttribute('aria-pressed', sectionOn); if (current) showResult(current); });
  $('#fit').addEventListener('click', () => { fitted = null; if (current) showResult(current); });
  // riquadro delle informazioni: si apre col pulsante in alto a destra, così non copre l'anteprima
  const showInfo = (on) => { state.info = on; $('#infoPanel').hidden = !on; $('#infoBtn').setAttribute('aria-pressed', on); save(); };
  $('#infoBtn').addEventListener('click', () => showInfo(!state.info));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.info) showInfo(false); });
  showInfo(!!state.info);
  const openIn = $('#open'); openIn.value = state.open;
  openIn.addEventListener('input', () => { state.open = +openIn.value; applyOpen(); save(); });
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const retheme = () => { for (const k in mats) if (k[0] !== 'c') material(k); if (current) showResult(current); };
  mq.addEventListener && mq.addEventListener('change', retheme);
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  renderHome();
  renderParams();
  route();
  setStatus('Avvio motore geometrico…', 'busy');
  const wasmBytes = Uint8Array.from(atob(window.__MANIFOLD_WASM__), c => c.charCodeAt(0));
  window.ManifoldModule({ wasmBinary: wasmBytes }).then((wasm) => {
    wasm.setup(); G = window.createGeom(wasm); window.__G = G;
    if (inHome) renderThumbs(); else regen();
  }).catch((e) => { console.error(e); setStatus('Il motore 3D non si è avviato in questo browser', 'err'); });
  window.__app = { build3MF, buildSTL, get current() { return current; }, state, MODES, values };
})();

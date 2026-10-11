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
  };
  // disegni: Fluent Emoji (libreria) e SVG caricati dall'utente
  const EMOJI = window.SPLAB_EMOJI || [], EMO_BY = Object.fromEntries(EMOJI.map(e => [e.id, e]));
  const isArtId = (k) => k === 'svg' || !!EMO_BY[k];
  // i 4 colori del disegno scelto (per l'abbinamento "Colori del disegno")
  const artPal = (v, key = 'forma') => {
    const k = v[key], pal = k === 'svg' ? (v.svg && v.svg.pal) : EMO_BY[k] && EMO_BY[k].pal;
    if (!pal || !pal.length) return null;
    const out = {}; pal.slice(0, 4).forEach((c, i) => { out['col' + (i + 1)] = c; });
    return out;
  };
  const colorsP = (labels, art) => [
    { sec: 'Colori', id: 'tavolozza', label: 'Abbinamenti pronti', type: 'select', def: art ? 'disegno' : 'rossoro',
      options: [...(art ? [['disegno', 'Colori del disegno']] : []), ['rossoro', 'Rosso e oro'], ['verde', 'Verde e rosso'], ['bianco', 'Bianco e argento'], ['blu', 'Blu e argento'], ['legno', 'Legno']],
      onSet: (k, v) => (k === 'disegno' ? artPal(v, art) : PALETTES[k]),
      help: art ? 'Al massimo 4 filamenti: il colore 1 è il pezzo. Ogni colore del disegno va sul filamento più simile; quelli uguali al colore 1 restano del colore del pezzo. "Colori del disegno" riduce i colori originali a 4.'
        : 'Nel 3MF ogni colore è una parte separata dello stesso oggetto: nello slicer dai un filamento a ciascuna.' },
    ...labels.map((l, i) => ({ sec: 'Colori', id: 'col' + (i + 1), label: l, type: 'color', def: PALETTES.rossoro['col' + (i + 1)] })),
  ];
  // spessori allineati agli strati: multipli di 0,2 e di 0,28 (primo strato a 0,28)
  const LAYER_STOPS = (() => { const v = new Set(); for (const h of [0.2, 0.28]) for (let k = 1; k * h <= 12.01; k++) v.add(+(k * h).toFixed(2)); return [...v].sort((a, b) => a - b); })();
  const layerP = (o) => Object.assign({ type: 'num', stops: LAYER_STOPS.filter(x => x >= o.min - 1e-6 && x <= o.max + 1e-6), step: 0.01, unit: 'mm' }, o);
  // loghi dentro le scritte: {SP} e {viso}. L'ugello decide quanto si ingrossano le linee quando il logo è piccolo
  const hasLogo = (p) => ['scritta', 'scritta2', 'scritta3', 'scritta4'].some(k => /\{(sp|viso)\}/i.test(String(p[k] || '')));
  const nozzleP = (sec, show) => ({ sec, id: 'ugello', label: 'Ugello', type: 'select', def: '0.4', options: [['0.2', '0,2'], ['0.4', '0,4'], ['0.6', '0,6'], ['0.8', '0,8']], unit: 'mm',
    show: p => (!show || show(p)) && (hasLogo(p) || isArtId(p.forma) || (p.disegno === 'motivo' && isArtId(p.motivo))), help: 'Diametro dell\'ugello della stampante. Se il logo è piccolo le sue linee vengono ingrossate fino a questa larghezza, così si stampano.' });
  const FONT_OPTS = [['tondo', 'Tondo'], ['corsivo', 'Corsivo'], ['natalizio', 'Natalizio']];
  const textP = (d1, d2, font, cap, show) => [
    { sec: 'Scritta', id: 'scritta', label: 'Riga 1', type: 'text', def: d1, placeholder: 'es. un nome', show, logos: true },
    { sec: 'Scritta', id: 'scritta2', label: 'Riga 2', type: 'text', def: d2, placeholder: 'facoltativa', show, logos: true },
    { sec: 'Scritta', id: 'carattere', label: 'Carattere', type: 'select', def: font, options: FONT_OPTS, show },
    { sec: 'Scritta', id: 'altTesto', label: 'Altezza lettere', type: 'num', min: 3, max: 40, step: 0.5, def: cap, unit: 'mm', help: 'Altezza delle maiuscole (i loghi sono alti 1,35 volte). Se la scritta non ci sta viene ridotta da sola.', show },
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
    ];
  });
  // motivi delle decorazioni piatte, divisi per gruppo nel menu
  const SHAPE_OPTS = [
    ['nome', 'Solo il nome', 'Con il nome'], ['medaglione', 'Medaglione', 'Con il nome'], ['targhetta', 'Targhetta', 'Con il nome'],
    ...EMOJI.map(e => [e.id, e.it, e.g]),
    ['stella', 'Stella a punte', 'Forme'], ['cuore', 'Cuore semplice', 'Forme'],
    ['svg', 'Carica un SVG…', 'Il tuo disegno'],
  ];
  // disegni della palla piatta
  const PALLA_OPTS = [
    ['fiocchi', 'Fiocchi di neve', 'Sfondi'], ['stelle', 'Stelle', 'Sfondi'], ['cuori', 'Cuori', 'Sfondi'], ['pois', 'Pois', 'Sfondi'],
    ['righe', 'Righe a bastoncino', 'Sfondi'], ['spicchi', 'Spicchi', 'Sfondi'], ['onde', 'Onde', 'Sfondi'], ['zigzag', 'Zig-zag', 'Sfondi'], ['nordico', 'Maglione nordico', 'Sfondi'],
    ['ghirlanda', 'Ghirlanda sul bordo', 'Natura'], ['agrifoglio', 'Agrifoglio', 'Natura'],
    ['cielo', 'Cielo stellato con luna', 'Scene'], ['bosco', 'Bosco innevato', 'Scene'], ['paese', 'Paesino con casette', 'Scene'], ['slitta', 'Luna con la slitta', 'Scene'], ['regali', 'Regali', 'Scene'],
    ['motivo', 'Un disegno (scegli sotto)', 'Disegno'], ['nessuno', 'Solo il nome', 'Solo il nome'],
  ];
  const shapeP = (sec, defH) => [
    { sec, id: 'forma', label: 'Motivo', type: 'select', menu: true, def: 'christmas-tree', options: SHAPE_OPTS, onSet: (k, v) => (v.tavolozza === 'disegno' && v.col1 !== undefined ? artPal(Object.assign({}, v, { forma: k })) : null),
      help: 'Disegni Fluent Emoji di Microsoft (licenza MIT). Con "Solo il nome" la decorazione è la scritta stessa; con "Carica un SVG" usi un tuo disegno.' },
    { sec, id: 'svg', label: 'File SVG', type: 'svg', show: p => p.forma === 'svg', palKey: 'forma',
      help: 'Un disegno vettoriale (.svg) a colori pieni. I colori vengono portati sui tuoi filamenti; i tratti diventano linee piene.' },
    { sec, id: 'punte', label: 'Punte', type: 'int', min: 4, max: 12, def: 5, show: p => p.forma === 'stella' },
    { sec, id: 'altezza', label: 'Altezza', type: 'num', min: 25, max: 250, step: 1, def: defH, unit: 'mm', show: p => p.forma !== 'nome' },
    { sec, id: 'contorno', label: 'Contorno', type: 'num', min: 0, max: 8, step: 0.2, def: 1.6, unit: 'mm', show: p => isArtId(p.forma),
      help: 'Margine attorno alla sagoma del disegno: tiene unite le parti vicine e rende il bordo più robusto.' },
  ];
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
    vaso: {
      label: 'Vasi',
      params: [
        { sec: 'Forma', id: 'forma', label: 'Forma', type: 'select', def: 'tondo', options: [['tondo', 'Tondo'], ['quadrato', 'Quadrato'], ['esagonale', 'Esagonale'], ['rettangolare', 'Fioriera']],
          onSet: (k, v) => k === 'rettangolare' ? (v.larghezza < 180 ? { larghezza: 250, profondita: 110 } : null) : (v.larghezza > 200 ? { larghezza: 110 } : null) },
        { sec: 'Forma', id: 'larghezza', label: 'Larghezza bocca', type: 'num', min: 30, max: 350, step: 1, def: 110, unit: 'mm', help: 'Per il tondo è il diametro; per la fioriera la lunghezza.' },
        { sec: 'Forma', id: 'profondita', label: 'Profondità bocca', type: 'num', min: 30, max: 300, step: 1, def: 110, unit: 'mm', show: p => p.forma === 'rettangolare' },
        { sec: 'Forma', id: 'altezza', label: 'Altezza', type: 'num', min: 30, max: 300, step: 1, def: 100, unit: 'mm' },
        { sec: 'Forma', id: 'base', label: 'Base rispetto alla bocca', type: 'num', min: 50, max: 100, step: 5, def: 80, unit: '%', help: '100% = pareti dritte. Meno di 100% = vaso che si stringe verso il basso.' },
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
        { sec: 'Montaggio', id: 'costruzione', label: 'Costruzione', type: 'select', def: 'meta', options: [['meta', 'Due metà'], ['intera', 'Intera']], help: 'Due metà: si stampano senza supporti e si incollano su un anello. Intera: serve il supporto sotto.' },
        { sec: 'Montaggio', id: 'appendino', label: 'Appendino', type: 'select', def: 'cappuccio', options: [['cappuccio', 'Cappuccio'], ['occhiello', 'Occhiello']], help: 'Il cappuccio è un pezzo a parte, con il foro per il nastro.' },
        { sec: 'Montaggio', id: 'tolleranza', label: 'Tolleranza', type: 'num', min: 0, max: 0.8, step: 0.05, def: 0.2, unit: 'mm' },
        ...colorsP(['Colore 1 · pallina', 'Colore 2 · decorazioni e cappuccio', 'Colore 3 · scritta']),
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
        { sec: 'Forma', id: 'stileDec', label: 'Stile disegni', type: 'select', def: 'uguale', options: [['uguale', 'Come la scritta'], ['rilievo', 'In rilievo'], ['filo', 'A filo'], ['inciso', 'Incisi'], ['traforata', 'Traforati']],
          help: 'Incisi: scavati nella superficie. Traforati: buchi passanti, con una cornice lungo il bordo e ponticelli dove servono. Cappuccio e bordo restano in rilievo (o a filo).' },
        layerP({ sec: 'Forma', id: 'rilievo', label: 'Spessore disegni', min: 0.2, max: 8, def: 0.8,
          help: 'In rilievo: quanto sporgono. A filo e incisi: quanto entrano nel pezzo (a filo, se è pari allo spessore, passano da parte a parte).' }),
        { sec: 'Disegno', id: 'disegno', label: 'Disegno', type: 'select', menu: true, def: 'fiocchi', options: PALLA_OPTS },
        { sec: 'Disegno', id: 'motivo', label: 'Quale disegno', type: 'select', menu: true, def: 'snowman', options: SHAPE_OPTS.filter(o => isArtId(o[0])), show: p => p.disegno === 'motivo' },
        { sec: 'Disegno', id: 'svg', label: 'File SVG', type: 'svg', show: p => p.disegno === 'motivo' && p.motivo === 'svg', palKey: 'motivo',
          help: 'Un disegno vettoriale (.svg) a colori pieni. I colori vengono portati sui tuoi filamenti.' },
        { sec: 'Disegno', id: 'quantita', label: 'Quantità', type: 'int', min: 3, max: 40, def: 14, show: p => !['spicchi', 'onde', 'zigzag', 'nordico', 'ghirlanda', 'nessuno'].includes(p.disegno), help: 'Quanti fiocchi, stelle o cuori.' },
        { sec: 'Disegno', id: 'variante', label: 'Variante', type: 'int', min: 1, max: 999, def: 7, show: p => p.disegno !== 'nessuno', help: 'Ogni numero sparge i disegni in modo diverso.' },
        { sec: 'Disegno', id: 'fascia', label: 'Fascia dietro il nome', type: 'bool', def: false, help: 'Una striscia nel colore 2 attraversa la palla e il nome ci sta sopra.' },
        ...textP('Giulia', '', 'corsivo', 12),
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
        ...colorsP(['Colore 1 · albero', 'Colore 2 · stella, palline, scritta', 'Colore 3 · base']),
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
        { sec: 'Scritta', id: 'stileTesto', label: 'Stile', type: 'select', def: 'rilievo', options: [['rilievo', 'In rilievo'], ['traforata', 'Traforata']], help: 'Traforata: la luce del lumino passa attraverso le lettere.' },
        { sec: 'Lumino', id: 'tolleranza', label: 'Gioco lumino', type: 'num', min: 0, max: 2, step: 0.1, def: 0.6, unit: 'mm', help: 'Per lumini LED da 38 mm.' },
        ...colorsP(['Colore 1 · lanterna', 'Colore 2 · scritta']),
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
        { sec: 'Timbro', id: 'tolleranza', label: 'Gioco timbro', type: 'num', min: 0, max: 1.5, step: 0.1, def: 0.4, unit: 'mm', show: p => p.timbro },
        ...colorsP(['Colore 1 · formina', 'Colore 2 · timbro']),
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
        { sec: 'Viti', id: 'foriMuro', label: 'Viti al muro', type: 'int', min: 0, max: 4, def: 2 },
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
  };

  // ================= GRUPPI (pagina iniziale) =================
  const GROUPS = [
    { id: 'natale', title: 'Natale', cat: 'Feste', desc: 'Palline, palle piatte con disegni e nome, decorazioni con il nome, alberi, stelle puntale, lanterne e formine per biscotti. Fino a tre colori.', modes: ['pallina', 'palla', 'piatto', 'albero', 'stella', 'lanterna', 'formina'], thumb: 'pallina' },
    { id: 'gridfinity', title: 'Gridfinity', cat: 'Organizzazione', desc: 'Contenitori impilabili, cassettiere con cassetti e basi a griglia da 42 mm.', modes: ['bin', 'cab', 'base'], thumb: 'cab' },
    { id: 'rack', title: 'Rack telefoni', cat: 'Organizzazione', desc: 'Rack a fessure per riporre telefoni e tablet, anche di spessori diversi.', modes: ['rack'], thumb: 'rack' },
    { id: 'vasi', title: 'Vasi', cat: 'Casa e giardino', desc: 'Vasi e fioriere per aromatiche, normali con sottovaso o autoirriganti.', modes: ['vaso'], thumb: 'vaso' },
    { id: 'supporti', title: 'Reggimensole e ganci', cat: 'Casa e giardino', desc: 'Squadre per mensole con rinforzo e viti, ganci a muro, appendiabiti, ganci sopra porta, per tubi e a S.', modes: ['mensola', 'gancio'], thumb: 'gancio' },
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
    if (v.tavolozza === 'disegno' && !(state.values[mode] && state.values[mode].col1 !== undefined)) Object.assign(v, artPal(v) || {});
    return v;
  }

  // ================= UI CONTROLLI =================
  const $ = (s) => document.querySelector(s);
  const panel = $('#params');
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
          bar.innerHTML = `<span>Inserisci</span><button type="button" class="chip" data-t="{SP}">Logo SP</button><button type="button" class="chip" data-t="{viso}">Viso</button>`;
          bar.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            const a = ti.selectionStart ?? ti.value.length, z = ti.selectionEnd ?? a, t = b.dataset.t;
            ti.value = ti.value.slice(0, a) + t + ti.value.slice(z);
            ti.focus(); ti.setSelectionRange(a + t.length, a + t.length);
            set(p, ti.value);
          }));
          row.appendChild(bar);
        }
      } else if (p.type === 'svg') {
        // disegno SVG caricato dall'utente: resta salvato nel browser insieme agli altri valori
        row.classList.add('sel');
        const cur = v[p.id];
        row.innerHTML = `<label>${p.label}</label><div class="svg-load"><label class="btn" for="${idAttr}">${cur && cur.name ? 'Cambia file…' : 'Carica SVG…'}</label><input id="${idAttr}" type="file" accept=".svg,image/svg+xml" hidden><span class="fname">${cur && cur.name ? esc(cur.name) : 'nessun file'}</span></div>`;
        row.querySelector('input').addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          if (file.size > 1.5e6) { setStatus('File SVG troppo grande (massimo 1,5 MB)', 'err'); return; }
          const rd = new FileReader();
          rd.onload = () => {
            const text = String(rd.result || '');
            let pal = null;
            try { const pk = window.SPLAB_SVG.pack(window.SPLAB_SVG.parse(text)); pal = pk && pk.pal; } catch (err) { pal = null; }
            if (!pal) { setStatus('Nel file non ho trovato forme da usare: serve un SVG con aree colorate o tratti', 'err'); return; }
            const val = { name: file.name, text, pal };
            const cur2 = values(state.mode), upd = cur2.tavolozza === 'disegno' ? artPal(Object.assign({}, cur2, { svg: val }), p.palKey) : null;
            Object.assign((state.values[state.mode] ||= {}), { [p.id]: val }, upd || {});
            save(); renderParams(); schedule(60);
          };
          rd.readAsText(file);
        });
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
      }
      if (p.help) { const h = document.createElement('p'); h.className = 'help'; h.textContent = p.help; row.appendChild(h); }
      sections.get(p.sec).appendChild(row);
    }
    updateVisibility();
    renderHeader();
    $('#openWrap').hidden = mode !== 'cab';
        $('#openLabel').textContent = 'Apri cassetti';
  }
  function updateVisibility() {
    const v = values(state.mode);
    for (const p of MODES[state.mode].params) {
      const row = panel.querySelector(`.row[data-id="${p.id}"]`);
      if (row) row.hidden = p.show ? !p.show(v) : false;
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
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
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

  function makeGrid(w, d) {
    if (gridObj) { modelGroup.parent.remove(gridObj); gridObj.traverse(o => { o.geometry && o.geometry.dispose(); }); }
    const P = 42;
    const nx = Math.ceil(w / P / 2) + 2, ny = Math.ceil(d / P / 2) + 2;
    const pos = [];
    for (let i = -nx; i <= nx; i++) pos.push(i * P, -ny * P, -0.05, i * P, ny * P, -0.05);
    for (let j = -ny; j <= ny; j++) pos.push(-nx * P, j * P, -0.05, nx * P, j * P, -0.05);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gridObj = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: cssVar('--grid') || '#b9c0c6', transparent: true, opacity: 0.9 }));
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
    const edges = new THREE.EdgesGeometry(flat, 28);
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
    modelGroup.updateMatrixWorld(true); bbAll.setFromObject(modelGroup);
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
    makeGrid(size.x, size.y);
    const key = state.mode;
    if (!fitted || fitted.key !== key || size.length() > fitted.len * 1.3 || size.length() < fitted.len / 1.5) { fitView(bbAll, res.view); fitted = { key, len: size.length() }; }
    // info
    const info = $('#info');
    info.innerHTML = res.info.map(([k, v]) => {
      const cls = k === 'Spazio interno' ? 'key' : k.startsWith('  ') ? 'sub' : k === 'Nota' ? 'warn' : '';
      return `<div class="${cls}"><dt>${esc(k.trim())}</dt><dd>${esc(v)}</dd></div>`;
    }).join('');
    const vol = real(res.parts).reduce((s, p) => s + p.mesh.volume, 0) / 1000;
    info.innerHTML += `<div><dt>Volume materiale</dt><dd>${vol.toFixed(1).replace('.', ',')} cm³</dd></div>`;
    const rp = real(res.parts), bad = rp.find(p => p.mesh.status !== 'NoError');
    const ghosts = res.parts.length - rp.length;
    const nU = printUnits(res.parts).length, nC = new Set(rp.map(p => p.color).filter(Boolean)).size;
    setStatus(bad ? 'Geometria con errori: prova a cambiare i valori' : (nU === 1 ? '1 pezzo pronto' : `${nU} pezzi pronti`) + (nC > 1 ? ` · ${nC} colori` : '') + (ghosts ? ' · in azzurro gli oggetti di esempio' : ''), bad ? 'err' : 'ok');
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
    for (const u of units) {
      let oid;
      if (u.members.length === 1) oid = meshObj(u.members[0].part, u.members[0].mesh);
      else {
        // oggetto con più parti: lo slicer lo apre come un solo pezzo e assegni un filamento a ogni parte
        const ids = u.members.map(m => meshObj(m.part, m.mesh));
        oid = ++id;
        objs += `<object id="${oid}" name="${esc(u.name)}" type="model"><components>${ids.map(c => `<component objectid="${c}"/>`).join('')}</components></object>\n`;
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
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
    return zip([['[Content_Types].xml', ct], ['_rels/.rels', rels], ['3D/3dmodel.model', model]]);
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
    if (s) return s;
    const slug = (x) => String(x || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const nm = slug(v.scritta) ? '_' + slug(v.scritta) : '';
    if (state.mode === 'pallina') return `pallina_${v.forma}_${v.diametro}mm${nm}`;
    if (state.mode === 'piatto') return `decorazione_${v.forma}${nm}`;
    if (state.mode === 'palla') return `palla-piatta_${v.disegno}${nm}`;
    if (state.mode === 'albero') return `albero_${v.stile}_${v.altezza}mm`;
    if (state.mode === 'stella') return `stella_${v.uso}_${v.diametro}mm`;
    if (state.mode === 'lanterna') return `lanterna_${v.forma}_${v.disegno}`;
    if (state.mode === 'formina') return `formina_${v.forma}${v.timbro && nm ? nm : ''}`;
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
  $('#section').addEventListener('click', () => { sectionOn = !sectionOn; $('#section').setAttribute('aria-pressed', sectionOn); if (current) showResult(current); });
  $('#fit').addEventListener('click', () => { fitted = null; if (current) showResult(current); });
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
  window.__app = { build3MF, buildSTL, get current() { return current; }, state };
})();

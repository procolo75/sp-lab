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
    { id: 'gridfinity', title: 'Gridfinity', cat: 'Organizzazione', desc: 'Contenitori impilabili, cassettiere con cassetti e basi a griglia da 42 mm.', modes: ['bin', 'cab', 'base'], thumb: 'cab' },
    { id: 'rack', title: 'Rack telefoni', cat: 'Organizzazione', desc: 'Rack a fessure per riporre telefoni e tablet, anche di spessori diversi.', modes: ['rack'], thumb: 'rack' },
    { id: 'vasi', title: 'Vasi', cat: 'Casa e giardino', desc: 'Vasi e fioriere per aromatiche, normali con sottovaso o autoirriganti.', modes: ['vaso'], thumb: 'vaso' },
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
    }
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
      if (p.type === 'bool') {
        row.classList.add('bool');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><input type="checkbox" role="switch" id="${idAttr}" ${v[p.id] ? 'checked' : ''}>`;
        row.querySelector('input').addEventListener('change', (e) => set(p, e.target.checked));
      } else if (p.type === 'text') {
        row.classList.add('sel');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><input class="txt" type="text" id="${idAttr}" value="${esc(v[p.id] || '')}" placeholder="${esc(p.placeholder || '')}" autocomplete="off">`;
        const ti = row.querySelector('input');
        ti.addEventListener('input', () => set(p, ti.value, true));
      } else if (p.type === 'select') {
        row.classList.add('sel');
        row.innerHTML = `<label for="${idAttr}">${p.label}</label><div class="seg" id="${idAttr}" role="radiogroup">${p.options.map(([k, l]) => `<button type="button" role="radio" aria-checked="${v[p.id] === k}" data-k="${k}">${l}</button>`).join('')}</div>`;
        row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { set(p, b.dataset.k); row.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b)); }));
      } else {
        const step = p.type === 'int' ? 1 : p.step;
        row.innerHTML = `<label for="${idAttr}">${p.label}</label>
          <div class="num"><button type="button" class="dec" aria-label="Diminuisci ${p.label}">−</button><input id="${idAttr}" type="number" inputmode="decimal" min="${p.min}" max="${p.max}" step="${step}" value="${fmtNum(v[p.id], step)}"><button type="button" class="inc" aria-label="Aumenta ${p.label}">+</button></div>
          ${p.unit ? `<span class="unit">${p.unit}</span>` : '<span class="unit"></span>'}`;
        const inp = row.querySelector('input');
        const commit = (val) => {
          let n = parseFloat(String(val).replace(',', '.'));
          if (!isFinite(n)) n = p.def;
          n = Math.min(p.max, Math.max(p.min, n));
          if (p.type === 'int') n = Math.round(n); else n = Math.round(n / step) * step;
          n = +n.toFixed(4);
          inp.value = fmtNum(n, step); set(p, n);
        };
        inp.addEventListener('change', () => commit(inp.value));
        inp.addEventListener('input', () => { const n = parseFloat(inp.value); if (isFinite(n) && n >= p.min && n <= p.max) set(p, p.type === 'int' ? Math.round(n) : n, true); });
        row.querySelector('.dec').addEventListener('click', () => commit(values(state.mode)[p.id] - step));
        row.querySelector('.inc').addEventListener('click', () => commit(values(state.mode)[p.id] + step));
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
  function showResult(res) {
    for (const c of [...modelGroup.children]) { modelGroup.remove(c); }
    current = res;
    let bb = new THREE.Box3(), bbAll = new THREE.Box3();
    for (const part of res.parts) {
      const { flat, edges } = geomFor(part.mesh);
      const grp = new THREE.Group();
      grp.add(new THREE.Mesh(flat, material(part.role)));
      if (part.role !== 'ghost') grp.add(new THREE.LineSegments(edges, edgesMat()));
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
    const size = bb.getSize(new THREE.Vector3());
    makeGrid(size.x, size.y);
    const key = state.mode;
    if (!fitted || fitted.key !== key || size.length() > fitted.len * 1.3 || size.length() < fitted.len / 1.5) { fitView(bbAll); fitted = { key, len: size.length() }; }
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
    setStatus(bad ? 'Geometria con errori: prova a cambiare i valori' : (rp.length === 1 ? '1 pezzo pronto' : `${rp.length} pezzi pronti`) + (ghosts ? ' · in azzurro i dispositivi di esempio' : ''), bad ? 'err' : 'ok');
  }
  function applyOpen() {
    for (const grp of modelGroup.children) {
      const part = grp.userData.part;
      if (part && part.role === 'drawer') grp.position.y = part.at[1] - state.open * part.size[1] * 0.85;
      if (grp.userData.isPivot) grp.rotation.x = -state.open * 115 * Math.PI / 180;
    }
  }
  function fitView(bb) {
    const c = bb.getCenter(new THREE.Vector3()); const r = bb.getSize(new THREE.Vector3()).length() / 2;
    controls.target.copy(c);
    const dist = r / Math.sin((camera.fov * Math.PI / 180) / 2) * 1.05;
    const dir = new THREE.Vector3(-0.55, -0.95, 0.75).normalize();
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
  function layoutForPrint(parts) {
    parts = real(parts);
    // corpo in origine, cassetti in fila a destra (si possono riordinare nello slicer)
    const gap = 6; const out = [];
    const M = (p) => p.printMesh || p.mesh;
    let body = parts.find(p => p.role === 'body');
    const bm = M(body), bw = bm.max[0] - bm.min[0];
    out.push({ part: body, mesh: bm, tx: -bm.min[0], ty: -bm.min[1], tz: -bm.min[2] });
    let x = bw + gap * 2, y = 0, rowH = 0; const maxW = Math.max(bw * 2.2, 260);
    for (const p of parts) {
      if (p === body) continue;
      const m = M(p), w = m.max[0] - m.min[0], d = m.max[1] - m.min[1];
      if (x + w > maxW && x > bw + gap * 2) { x = bw + gap * 2; y += rowH + gap; rowH = 0; }
      out.push({ part: p, mesh: m, tx: x - m.min[0], ty: y - m.min[1], tz: -m.min[2] });
      x += w + gap; rowH = Math.max(rowH, d);
    }
    return out;
  }
  const n4 = (v) => { const s = (Math.round(v * 10000) / 10000).toString(); return s === '-0' ? '0' : s; };
  function build3MF(res, title) {
    const items = layoutForPrint(res.parts);
    let objs = '', build = '';
    items.forEach((it, i) => {
      const { pos, tri } = it.mesh; const id = i + 1;
      const v = []; for (let k = 0; k < pos.length; k += 3) v.push(`<vertex x="${n4(pos[k])}" y="${n4(pos[k + 1])}" z="${n4(pos[k + 2])}"/>`);
      const t = []; for (let k = 0; k < tri.length; k += 3) t.push(`<triangle v1="${tri[k]}" v2="${tri[k + 1]}" v3="${tri[k + 2]}"/>`);
      objs += `<object id="${id}" name="${esc(it.part.name)}" type="model"><mesh><vertices>${v.join('')}</vertices><triangles>${t.join('')}</triangles></mesh></object>\n`;
      build += `<item objectid="${id}" transform="1 0 0 0 1 0 0 0 1 ${n4(it.tx)} ${n4(it.ty)} ${n4(it.tz)}"/>\n`;
    });
    const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="it-IT" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Title">${esc(title)}</metadata>
<metadata name="Application">Generatore progetti 3D</metadata>
<metadata name="CreationDate">${new Date().toISOString().slice(0, 10)}</metadata>
<resources>
${objs}</resources>
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
    const items = layoutForPrint(res.parts);
    let ntri = 0; for (const it of items) ntri += it.mesh.tri.length / 3;
    const buf = new ArrayBuffer(84 + ntri * 50); const dv = new DataView(buf);
    const hdr = 'Generatore progetti 3D'; for (let i = 0; i < hdr.length; i++) dv.setUint8(i, hdr.charCodeAt(i));
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
    const s = state.mode === 'bin' ? `contenitore_${v.gridX}x${v.gridY}x${v.altU}` : state.mode === 'vaso' ? `vaso_${v.forma}_${Math.round(v.larghezza)}x${Math.round(v.altezza)}_${v.tipo}` : state.mode === 'rack' ? `rack_${String(v.spessoriLista || '').trim() ? 'misto' : v.fessure + 'x' + v.spessore + 'mm'}_${v.base}` : state.mode === 'cab' ? `cassettiera_${v.gridX}x${v.gridY}x${v.altU}_${v.righe * v.colonne}cassetti` : `base_${v.gridX}x${v.gridY}`;
    return s;
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
  function go(mode) { if (location.hash.slice(1) !== hashFor(mode)) location.hash = hashFor(mode); else route(); }
  let inHome = true;
  function route() {
    const h = location.hash.slice(1);
    let mode = null;
    for (const g of GROUPS) { if (h === g.id) mode = (groupOf(state.mode) === g ? state.mode : g.modes[0]); for (const m of g.modes) if (h === `${g.id}-${m}`) mode = m; }
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
    const cats = [...new Set(GROUPS.map(g => g.cat))];
    $('#cats').innerHTML = cats.map(c => `<section class="cat"><h2>${esc(c)}</h2><div class="cards">${GROUPS.filter(g => g.cat === c).map(g => `
      <button class="card" type="button" data-group="${g.id}" id="card-${g.id}">
        <div class="thumb"><img alt="" hidden><span class="ph">anteprima…</span></div>
        <div class="body"><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p>${g.modes.length > 1 ? `<div class="chips">${g.modes.map(m => `<span class="chip">${esc(MODES[m].label)}</span>`).join('')}</div>` : ''}</div>
      </button>`).join('')}</div></section>`).join('');
    document.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { location.hash = c.dataset.group; }));
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
      o.add(new THREE.Mesh(flat, material(part.role)));
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
    cam.position.copy(c).addScaledVector(new THREE.Vector3(-0.55, -0.95, 0.75).normalize(), dist);
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
  const retheme = () => { for (const k in mats) material(k); if (current) showResult(current); };
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

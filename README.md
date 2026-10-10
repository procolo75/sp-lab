# Sprecolo

**Il talento sprecato della stampa 3D.**

Sprecolo è un generatore parametrico di oggetti da stampare in 3D che funziona interamente nel browser. Scegli cosa vuoi, regoli le misure, guardi l'anteprima 3D e scarichi il file **3MF** (o STL) pronto per lo slicer. Non serve installare niente e non serve internet: è un'unica pagina HTML.

![Pagina iniziale di Sprecolo](docs/img/home.png)

---

## Cosa puoi generare

La pagina iniziale mostra un riquadro per ogni generatore, diviso per categoria. Gridfinity raccoglie tre generatori in uno: contenitore, cassettiera e base.

| Generatore | Cos'è | Parti nel file |
|---|---|---|
| **Contenitore** | Contenitore [Gridfinity](https://gridfinity.xyz/) impilabile, con divisori, raccordo frontale e ripiano per l'etichetta | 1 |
| **Cassettiera** | Mobiletto Gridfinity con cassetti, impilabile, maniglie a scelta e divisori nei cassetti | mobile + un pezzo per cassetto |
| **Base** | Griglia Gridfinity su cui agganciare contenitori e cassettiere | 1 |
| **Rack telefoni** | Rack a fessure per riporre telefoni e tablet, con spessori diversi per ogni fessura | 1 |
| **Vasi** | Vasi per piante aromatiche: tondi, quadrati, esagonali o fioriera a scomparti; normali con sottovaso oppure autoirriganti | da 1 a 5 |

### Contenitore
![Contenitore Gridfinity](docs/img/contenitore.png)
- Dimensioni in unità Gridfinity: 42 mm di lato, 7 mm di altezza per unità.
- Bordo impilabile: un contenitore si incastra sopra l'altro.
- Spessore di pareti e fondo, divisori in larghezza e profondità.
- Raccordo curvo sul davanti, per prendere facilmente i pezzi piccoli.
- Ripiano per l'etichetta sulla parete di fondo.
- Fori per magneti e viti M3 sotto i piedini.

### Cassettiera
![Cassettiera](docs/img/cassettiera.png)
- Piedini Gridfinity sotto e bordo impilabile sopra: ci impili contenitori o un'altra cassettiera.
- Cassetti in altezza e in larghezza, con gioco regolabile tramite la tolleranza.
- Maniglia: tacca, aletta, pomello o nessuna.
- Divisori dentro i cassetti.
- Nell'anteprima uno slider apre i cassetti.

### Base
![Base](docs/img/base.png)
- Griglia di qualsiasi misura.
- Solo telaio (leggera) oppure con fondo pieno.
- Fori per magneti o viti.

### Rack telefoni
![Rack telefoni](docs/img/rack.png)
- Partenza rapida: telefoni o tablet, in piedi o sdraiati. Poi cambi tutto.
- Numero di fessure, spessore del dispositivo (con la cover) e gioco.
- Spessori diversi per ogni fessura, per esempio `9, 11, 11, 14`.
- Separatori con altezza, spessore e inclinazione regolabili, tacca per le dita e rinforzo curvo alla base.
- Base Gridfinity oppure libera, con incavi per piedini in gomma.
- Orientamento di stampa *in piedi* o *sul fianco*. Sul fianco i separatori sono molto più robusti.
- Nell'anteprima vedi dei dispositivi di esempio in azzurro, che non finiscono nel file.

### Vasi
![Vaso autoirrigante in sezione](docs/img/vaso-autoirrigante.png)
- **Forme:** tondo, quadrato, esagonale, oppure fioriera rettangolare con scomparti (una pianta per scomparto).
- **Misure:** bocca, altezza, quanto si stringe verso il basso, bordo rinforzato.
- **Vaso normale:** fori di drenaggio, canali di scolo sotto il fondo, sottovaso con rialzi.
- **Vaso autoirrigante:**
  - vaso esterno come riserva d'acqua, con foro di troppo pieno;
  - vaso interno che si appoggia sul bordo, con tubo per riempire;
  - cestello pescante forato, separato, che porta l'acqua alle radici.
- Il programma calcola **litri di terra** e **millilitri di riserva d'acqua**.

---

## Come si usa

1. Scarica `index.html` e aprilo con un browser (Chrome, Safari, Firefox, Edge). Funziona anche offline.
2. Nella pagina iniziale scegli cosa generare. Con Gridfinity, in alto passi da contenitore a cassettiera a base. **← Tutti** riporta alla pagina iniziale.
3. A sinistra regoli i parametri: l'anteprima si aggiorna subito.
4. Nel riquadro in basso leggi le misure reali (esterno, interno, volumi, avvisi).
5. Premi **Scarica 3MF**, oppure **STL**, e apri il file nello slicer.

**Comandi dell'anteprima**
- Trascina per ruotare, rotella per lo zoom, tasto destro per spostare.
- **Sezione** taglia il modello a metà per vedere com'è fatto dentro.
- **Centra vista** riporta la camera sul modello.

I valori che imposti restano salvati nel browser. **Ripristina valori** torna a quelli iniziali.

**Link diretti:** ogni generatore ha il suo indirizzo, da usare per linkarlo o salvarlo nei preferiti: `#gridfinity`, `#gridfinity-cab` (cassettiera), `#gridfinity-base`, `#rack`, `#vasi`.

### Il file 3MF
- Ogni pezzo è un oggetto separato e con il suo nome (per esempio "Cassetto 3" o "Cestello pescante 1").
- I pezzi sono già disposti sul piatto e orientati per la stampa senza supporti: coperchi e cestelli capovolti, cassetti accanto al mobile.
- Funziona con Bambu Studio, PrusaSlicer, OrcaSlicer, Cura e gli altri slicer che leggono il 3MF.

---

## Consigli di stampa

### Tarare la tolleranza
Ogni stampante è diversa. Il parametro **Tolleranza stampante** (0,3 mm all'inizio) è il gioco usato negli incastri: cassetti, fori per magneti, vaso interno e cestello.
1. Stampa un pezzo piccolo, per esempio una cassettiera 1×2 con un cassetto.
2. Se il cassetto entra troppo stretto, aumenta la tolleranza di 0,05–0,1 mm.
3. Se balla troppo, diminuiscila.

### Per tipo di oggetto
- **Gridfinity:** per la prima prova stampa un contenitore 1×1×3 e una base 2×2, così verifichi incastro e impilamento.
- **Pareti:** usa spessori multipli del diametro dell'ugello (con 0,4 mm: 0,8, 1,2, 1,6).
- **Rack:** se i separatori sono alti o sottili, stampalo *sul fianco*.
- **Vasi:** perché tengano l'acqua servono almeno 3 perimetri. Per il vaso esterno dell'autoirrigante e per il sottovaso, il PETG è meglio del PLA.

---

## Per sviluppatori

### Struttura

```
├── index.html      pagina finale (generata, non modificarla a mano)
├── build.py        unisce sorgenti e librerie in index.html
├── package.json    librerie: three.js e manifold-3d
├── src/
│   ├── page.html   interfaccia e stili
│   ├── app.js      parametri, anteprima 3D, esportazione 3MF/STL
│   └── geom.js     geometria di tutti i generatori
└── docs/img/       immagini per questo README
```

### Ricostruire `index.html`

```bash
npm install
python3 build.py
```

Lo script incorpora three.js, Manifold (compreso il file WebAssembly) e i sorgenti in un solo HTML da circa 1,5 MB, che funziona offline.

### Come funziona
- **Geometria:** [Manifold](https://github.com/elalish/manifold) (WebAssembly) costruisce solidi con operazioni booleane. I modelli escono sempre chiusi e senza errori.
- **Anteprima:** [three.js](https://threejs.org/).
- **Esportazione:** il 3MF è un file zip con dentro XML, scritto direttamente dal codice senza librerie esterne.

### Aggiungere un generatore
1. In `src/geom.js` scrivi una funzione `nome(p)` che riceve i parametri e restituisce:
   - `parts`: lista di `{ name, m, role, print?, at? }`
     - `m` è il solido Manifold;
     - `print` è la versione già orientata per la stampa;
     - `at` è la posizione nell'anteprima;
     - `role: 'ghost'` indica un oggetto solo di esempio, che non viene esportato.
   - `info`: lista di coppie `[etichetta, valore]` per il riquadro delle misure.
2. Collegala in `build()` dentro `geom.js`.
3. In `src/app.js` aggiungi una voce in `MODES` con l'elenco dei parametri: tipo `int`, `num`, `bool`, `select` o `text`, con `min`, `max`, `step`, `def`, `unit`, `help` e `show`.
4. Sempre in `src/app.js`, aggiungi il generatore a `GROUPS`: un nuovo gruppo diventa un nuovo riquadro nella pagina iniziale, con titolo, categoria e descrizione. Puoi anche aggiungerlo a un gruppo esistente, che mostra le sotto-schede in alto. L'anteprima del riquadro viene generata in automatico dal motore.
5. Esegui `python3 build.py`.

---

## Crediti

- **Gridfinity**, il sistema modulare creato da [Zack Freedman](https://www.youtube.com/@ZackFreedman). Sprecolo ne riproduce le misure standard.
- **[three.js](https://github.com/mrdoob/three.js)**, licenza MIT.
- **[Manifold](https://github.com/elalish/manifold)**, licenza Apache 2.0.
- Caratteri **IBM Plex**, licenza SIL Open Font License (caricati da Google Fonts quando c'è connessione).

## Licenza

Distribuito con licenza [MIT](LICENSE) © 2026 Procolo Carannante: chiunque può usare e modificare il progetto citando l'autore.

## Sito pubblico

Il generatore è online su **https://procolo75.github.io/sprecolo/**

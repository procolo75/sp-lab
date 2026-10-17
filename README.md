<p align="center"><img src="docs/img/logo.svg" alt="SP Lab" width="140"></p>

# SP Lab

**Generatore parametrico per la stampa 3D.**

SP Lab è un generatore parametrico di oggetti da stampare in 3D che funziona interamente nel browser. Scegli cosa vuoi, regoli le misure, guardi l'anteprima 3D e scarichi il file **3MF** (o STL) pronto per lo slicer. Non serve installare niente e non serve internet: è un'unica pagina HTML.

![Pagina iniziale di SP Lab](docs/img/home.png)

---

## Cosa puoi generare

La pagina iniziale mostra un riquadro per ogni generatore, tre per riga, con la categoria scritta sopra il titolo. Alcuni riquadri raccolgono più generatori, che trovi come schede in alto: Natale (pallina, pallina a spirale, palla piatta, decorazione, albero, stella, lanterna, formina), Gridfinity (contenitore, cassettiera, base), Reggimensole e ganci (reggimensola, gancio) e Viti e bulloni (vite, bullone, perno).

| Generatore | Cos'è | Parti nel file |
|---|---|---|
| **Pallina** | Pallina di Natale sferica, a goccia, a oliva o a cipolla, con decorazioni e scritta | 2 metà, anello, cappuccio, tappo del LED |
| **Pallina a spirale** | Pallina intera che si stampa senza supporti: spicchi a spirale, a V o dritti sopra e sotto, fascia liscia con scritte e simboli traforati, foro per il LED | pallina, cappuccio, tappo |
| **Palla piatta** | Palla di Natale piatta con cappuccio, sfondi (fiocchi, maglione nordico, bosco…), un disegno a colori o il tuo SVG, e il nome, anche su una fascia | 1, più il supporto da tavolo |
| **Decorazione** | Decorazione piatta da appendere con 57 disegni Fluent Emoji a colori (fino a 4 filamenti) o con il tuo SVG, nome su targhetta, oppure solo il nome | 1, più il supporto da tavolo |
| **Albero** | Albero a spirale, a strati o da incastrare, con stella in cima e base con scritta | 1 o 2 |
| **Stella** | Stella 3D a punte, come puntale dell'albero o da appendere | 2 metà |
| **Lanterna** | Lanterna traforata per lumini LED, con scritta | 1 |
| **Formina** | Formina per biscotti con tutti i disegni (anche a forma di nome o dal tuo SVG), con timbro per decorarli | 1 o 2 |
| **Contenitore** | Contenitore [Gridfinity](https://gridfinity.xyz/) impilabile, con divisori, raccordo frontale e ripiano per l'etichetta | 1 |
| **Cassettiera** | Mobiletto Gridfinity con cassetti, impilabile, maniglie a scelta e divisori nei cassetti | mobile + un pezzo per cassetto |
| **Base** | Griglia Gridfinity su cui agganciare contenitori e cassettiere | 1 |
| **Rack telefoni** | Rack a fessure per riporre telefoni e tablet, con spessori diversi per ogni fessura | 1 |
| **Cover telefono** | Cover per gli iPhone dal 12 al 17 (misure dei disegni Apple) o per qualsiasi telefono con le tue misure: TPU o PLA/PETG a scatto, cavalletto, scritta e il tuo SVG sul retro | 1, più copertura della fotocamera e cavalletto |
| **Vasi** | Vasi per piante aromatiche: tondi, quadrati, esagonali o fioriera a scomparti; normali con sottovaso oppure autoirriganti | da 1 a 5 |
| **Reggimensola** | Squadra per mensole con rinforzo a triangolo (pieno o traforato), puntone, raccordo curvo o arco, viti svasate e labbro antiscivolo | quante ne vuoi |
| **Gancio** | Gancio a muro o appendiabiti con più ganci, sopra porta o anta, per tubo o bastone, a S; fissaggio a viti, biadesivo o magneti | 1 |
| **Powerbank** | Scatola per un powerbank fai-da-te: portapile già pronto (o contatti a molla), cinque schede di ricarica con le porte già al loro posto, coperchio a slitta o a viti nascoste con scritta, loghi e il tuo SVG | scatola e coperchio (anche a colori) |
| **Box schede ESP** | Scatola per un processore ESP (NodeMCU, D1 mini, ESP32, ESP32-CAM, ESP32-C3 con OLED) e fino a 5 moduli: sensori, display e pannelli LED WS2812B. Schede con i piedini e dupont, senza saldare; finestre nel coperchio e fori per i LED | scatola e coperchio |
| **Vite** | Vite con filetto metrico ISO da M3 a M30 (o misura libera), cinque tipi di testa | 1 |
| **Bullone** | Vite con dado (esagonale, zigrinato o ad alette) e rondelle, già avvitabili tra loro | da 2 a 4 |
| **Perno** | Perno a scatto per unire pezzi stampati, spina liscia o perno con testa e foro per coppiglia | 1, più le piastrine di prova |

### Natale
![Pallina, calza con nome, albero a spirale e lanterna](docs/img/natale.png)
Tutti gli oggetti di Natale possono avere **fino a tre colori** (abbinamenti pronti oppure colori a scelta) e una **scritta** in tre caratteri: tondo, corsivo e natalizio. Se la scritta non ci sta, viene ridotta da sola e il riquadro misure lo dice.

- **Pallina:** sfera, goccia, oliva o cipolla, liscia o sfaccettata (low poly). Decorazioni: spicchi, anelli, puntini, stelle in rilievo o stelle traforate (con un LED dentro si illumina). Fino a **quattro scritte**, e ognuna la metti dove vuoi: *lato* (0° davanti, 90° a destra, 180° dietro, 270° a sinistra, a passi di 15°), *altezza* (0 = a metà pallina, positivo verso l'alto, negativo verso il basso) e *altezza lettere*. Per esempio il nome davanti, l'anno sotto e una dedica dietro. Le scritte seguono la curva della pallina e possono essere **in rilievo** o **traforate**; le decorazioni si spostano da sole per lasciarle libere. Con le due metà, se una scritta cade sulla giunzione (90° o 270°) il riquadro misure lo segnala.
  - Si stampa in **due metà**, che si incollano su un anello di giunzione: fuori non servono supporti, ma dentro la cupola è a sbalzo e lo slicer può chiederli. Oppure intera, con il supporto.
  - Appendino: **cappuccio** a parte con il foro per il nastro, oppure occhiello.
  - **Luce**, per illuminarla da dentro:
    - *foro per il LED sul fondo*, con diametro regolabile. **Con tappo** per un LED a pila, che si mette e si toglie dal fondo: il tappo ha la faccia piatta, si stampa senza supporti e la pallina ci sta in piedi (con la goccia il tappo è la punta). **Aperto** per spingere dentro una lucina della catena dell'albero. Con le due metà il foro ha due punte a 45°, così il suo bordo si stampa senza supporti;
    - *fessura per il filo* nel cappuccio, per le lucine su filo di rame: i LED entrano dal foro in cima e il filo esce dalla fessura.
- **Pallina a spirale:** pallina vuota che si stampa **intera e senza supporti**, niente incollaggi. Una sfera liscia non ci riesce: sotto le pareti sporgono nel vuoto e dentro la cupola in cima è un soffitto. Qui sopra e sotto la superficie è fatta di **spicchi pieghettati**: ogni faccia della piega resta entro 45° dalla verticale, quindi si regge da sola, fuori e dentro.
  - *Trama:* spirale (verso destra o sinistra), a V (spina di pesce) o spicchi dritti; numero di spicchi e inclinazione della spirale regolabili. La profondità delle pieghe viene calcolata da sola, partendo dai poli, per non superare mai i 45°.
  - *Fascia liscia* a metà pallina: continua tutto intorno, solo attorno a scritte e simboli (gli spicchi continuano con la stessa profondità e resta liscio un riquadro attorno a ognuno), oppure nessuna (spicchi dappertutto). Più la spirale è inclinata e meno sono gli spicchi, più la fascia è stretta: il riquadro misure ne dice l'altezza.
  - *Quattro lati* (davanti, destra, dietro, sinistra): su ognuno una **scritta** o un **simbolo** traforato (stella, cuore, fiocco di neve, albero, campana, luna, pupazzo di neve, regalo, stella cometa, candela, renna). Se non ci stanno nella fascia vengono ridotti da soli. Con un LED dentro si illuminano.
  - *Luce:* foro per il LED al centro del piedino, con diametro regolabile, chiuso da un **tappo** o aperto; fessura nel cappuccio per il filo delle lucine (i LED entrano dal foro in cima).
  - *Colori:* la fascia centrale tutta di un altro colore e/o **righe colorate** orizzontali sopra e sotto (numero e altezza regolabili). I tagli cadono su strati interi da 0,2 mm: con un multicolore sono parti dello stesso oggetto, con un solo colore il riquadro misure dice a che altezza dal piatto cambiare filamento.
  - *Stampa:* poggia su un piedino piatto **piccolo, medio o grande** (Ø 0,3, 0,45 o 0,6 del diametro): piccolo la lascia rotonda, grande è più stabile. **Supporti disattivati del tutto** nello slicer e brim. Lo slicer può avvisare che servono supporti: è normale, perché vede come sbalzo il bordo alto delle lettere (sono ponti) e i solchi interni in cima. Non usare "solo sul piatto": i supporti entrerebbero dal foro del LED e dalle lettere. Verificato con OrcaSlicer (profilo Anycubic Kobra 3) e con una stampa di prova.
- **Palla piatta:** la classica pallina vista di fronte, piatta, con il cappuccio scanalato e l'occhiello. Scrivi il nome (una o due righe, per esempio *Famiglia* e *Rossi 2026*) e componi la palla con due scelte indipendenti, che puoi combinare:
  - **Sfondo**, che riempie la palla attorno al nome: fiocchi di neve, stelle, cuori, pois, righe a bastoncino, spicchi, onde, zig-zag, maglione nordico, ghirlanda sul bordo, oppure una scena (cielo stellato con luna, bosco innevato, paesino con casette, luna con la slitta, regali). *Quantità* e *variante* cambiano quanti elementi ci sono e come sono sparsi; la *fascia dietro il nome* è una striscia che attraversa la palla.
  - **Figura**, un disegno grande sopra il nome, a colori: uno dei disegni Fluent Emoji (pinguino, renna, Babbo Natale…) oppure il tuo SVG, caricato dal riquadro *Il tuo disegno*. Lo sfondo le lascia spazio attorno.
  - Sfondo, figura e scritta hanno **ognuno il suo stile** (come la scritta, in rilievo, a filo, inciso o traforato) e **il suo spessore**: per esempio figura in rilievo su uno sfondo a righe incise, o fiocchi traforati attorno a un nome a filo.
  - Colori, al massimo 4: palla (1), cappuccio, disegni e bordo (2), scritta e dettagli come neve e fiocchi (3), più un quarto colore. I colori della figura vanno sul filamento più simile: quelli uguali alla palla restano del colore della palla.

  ![Palle piatte con disegni diversi](docs/img/palle.png)
- **Decorazione piatta:** scegli il **motivo** dal menu e scrivi il nome.
  - *Disegni* **Fluent Emoji** di Microsoft (licenza MIT), 57 soggetti: *Natale* (albero, Babbo Natale, Mamma Natale, renna, pupazzo di neve, elfo, angelo, campana, regalo, candela, stelle, slitta, fiocco, biscotto, caramelle, orsetto, matrioske, chiesa, case, cioccolata, luna), *Inverno* (fiocco di neve, nuvola, montagna, abete, guanti, sciarpa, cappotto, calze, sciatore, pattino), *Animali* (pinguino, orso polare, orso, volpe, gufo, gatto, cane, coniglio, riccio, uccellino, colomba) e *Feste* (cuori, quadrifoglio, corona, festa, coriandoli, palloncino, fuochi d'artificio).
  - *Il tuo disegno:* il riquadro **Il tuo disegno (SVG)**, in cima al pannello, carica un file **SVG** con il pulsante o trascinandolo sopra (forme piene, tratti, gradienti, trasformazioni). Il disegno si usa subito al posto di quello della libreria; *Usa la libreria* torna ai disegni Fluent e *Usa questo* lo riprende. Resta salvato nel browser. C'è anche nella palla piatta e nella formina.
  - *Con il nome:* solo il nome (la decorazione è la scritta stessa, con il contorno che unisce le lettere), medaglione, targhetta. *Forme:* stella a punte, cuore.
  - **Colori, al massimo 4 filamenti:** il colore 1 è il pezzo, poi 2, 3 e 4. Ogni colore del disegno va sul filamento più simile; quelli uguali al colore 1 restano del colore del pezzo. *Colori del disegno* riduce i colori originali a 4 (il più esteso diventa il pezzo). La scritta va sul colore scelto, o in automatico su quello che si legge meglio.
  - **Contorno:** margine attorno alla sagoma che tiene unite le parti vicine; le parti piccole staccate vengono tolte, quelle grandi unite con un ponticello. I dettagli più stretti dell'ugello vengono tolti (il riquadro misure dice quanti).
  - **Nome** su una targhetta sotto o sopra il disegno, oppure sul disegno.
  - In rilievo **tutto il disegno sporge dello stesso spessore**, comprese le parti del colore del pezzo; solo la scritta può essere più alta.
  - **Stile del disegno**, indipendente dalla scritta: *come la scritta*, in rilievo, a filo, inciso o traforato. Inciso e traforato usano la versione a linea dello stesso disegno (Fluent *High Contrast*), che viene molto più pulita; con lo **spessore** regolabile (in rilievo quanto sporgono, a filo e incise quanto entrano; a filo, se è pari allo spessore del pezzo, passano da parte a parte). Traforate: lungo il contorno resta una cornice di 1,2 mm e dei ponticelli tengono le parti che cadrebbero (il riquadro misure dice quanti). Il bordo resta in rilievo o a filo.
  - Scritta **in rilievo**, **a filo** (la superficie resta piana; lo *spessore della scritta* è regolabile in multipli di 0,2 o di 0,28 mm, cioè allineato agli strati anche con il primo strato a 0,28, e se è pari allo spessore del pezzo la scritta lo attraversa e si vede dai due lati), **incisa** o **traforata** (con i ponticelli che tengono l'interno di o, a, e). Occhiello, foro o nessun appendino.

  ![Decorazioni con i disegni Fluent Emoji e il nome](docs/img/motivi.png)
  - **Supporto da tavolo** con fessura: diventa un segnaposto.
- **Albero:** a spirale (si può stampare anche in modalità vaso), a strati sfalsati (anche a colori alterni) o da incastrare (due sagome piatte a croce). Stella 3D in cima e base con scritta.
- **Stella 3D:** numero e forma delle punte regolabili. Come **puntale**, con un tubo che si stringe verso l'alto e si adatta alla cima dell'albero, oppure da appendere. Si stampa in due metà piatte.
- **Lanterna** tonda o esagonale, traforata con stelle, fiocchi, alberi o cuori (sagome Fluent Emoji), con la sede per un lumino LED da 38 mm e una scritta sulla fascia in basso, in rilievo o traforata (la luce passa dalle lettere).
- **Formina per biscotti** con tutti i disegni, anche a forma di nome o dal tuo SVG, con lama sottile e bordo per premere. Il **timbro** entra nella formina e stampa le linee del disegno e la scritta sul biscotto (è già a specchio).

#### Scritte: altezza e posizione
- Ogni riga ha la **sua altezza** (*Altezza riga 1*, *Altezza riga 2*): per esempio un nome grande e la data piccola sotto. Nella pallina e nella pallina a spirale ogni scritta ha la sua.
- Sotto ogni riga c'è una **croce di frecce** per spostarla in su, in giù, a destra e a sinistra: 1 mm a clic, 0,2 mm tenendo premuto Maiusc. Il **pulsante al centro** la rimette al centro; accanto c'è di quanto è spostata. Spostandola la scritta non si rimpicciolisce: se esce dal pezzo (o, nella cover, dalla zona libera sotto la fotocamera) la parte fuori viene tagliata e il riquadro misure lo dice. Nella pallina a spirale la scritta sale e scende solo dentro la fascia liscia. Nella pallina le frecce la girano attorno alla sfera (15° a clic) e la alzano o abbassano (5% a clic); il centro la porta a metà altezza.
- Nella palla piatta lo sfondo arriva fino alla scritta, senza un contorno del colore della palla attorno alle lettere e ai loghi.

#### Loghi nelle scritte
In ogni scritta puoi mettere il **logo SP**, il **viso** e il **viso di Natale** (con cappello da Babbo Natale e barba piena), da soli o insieme al testo: sotto ogni campo di testo ci sono i pulsanti *Logo SP*, *Viso* e *Viso di Natale*, che inseriscono `{SP}`, `{viso}` e `{visoNatale}` dove c'è il cursore (per esempio `{SP} Lab` o `{visoNatale} Buon Natale`). Il logo è solo il disegno, senza sfondo: lo sfondo è il colore del pezzo.
- Il logo è alto 1,35 volte le lettere, quindi lo regoli con l'altezza della sua riga come il resto della scritta, e segue lo stile scelto (rilievo, a filo, incisa, traforata).
- **Ugello:** le linee dei loghi sono sottili (0,86 mm nel logo SP alto 46 mm, 0,70 mm nel viso alto 58 mm). Se il logo è più piccolo, le linee vengono ingrossate fino alla larghezza dell'ugello scelto (0,2 · 0,4 · 0,6 · 0,8 mm), così si stampano comunque. Il riquadro misure dice di quanto e da che altezza in su il logo esce con tutti i dettagli: con ugello da 0,4 mm circa 23 mm per il logo SP e 36 mm per il viso.

#### Colori nel file 3MF
- Ogni colore è una **parte separata dello stesso oggetto**: nello slicer (Bambu Studio, OrcaSlicer, PrusaSlicer) assegni un filamento a ciascuna parte. I colori scelti sono anche scritti nel file, e a ogni parte è già assegnato il suo filamento (1, 2, 3…) nei file di configurazione di Bambu Studio / OrcaSlicer e di PrusaSlicer: nello slicer servono almeno tanti filamenti quanti sono i colori, altrimenti la scritta a filo ha lo stesso filamento del resto e non si vede.
- **Stampante a un colore:** per le decorazioni piatte in rilievo il riquadro misure dice a che altezza cambiare filamento, quando i colori sono ad altezze diverse (per esempio un colore per il disegno e uno, più alto, per la scritta). Più colori alla stessa altezza richiedono una stampante multicolore: il riquadro lo segnala.
- **Al massimo 4 filamenti** per pezzo, compreso quello del pezzo.
- Lo **STL** ha un solo colore: per i colori usa il 3MF.

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

### Cover telefono
![Cover telefono](docs/img/cover.png)
- **Modelli:** tutti gli iPhone dal 12 al 17: 12 mini, 12, 12 Pro, 12 Pro Max, 13 mini, 13, 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16e, 16, 16 Plus, 16 Pro, 16 Pro Max, 17, 17 Pro, 17 Pro Max e Air. Le misure (corpo, curva degli angoli, profilo del bordo, tasti, fotocamera, connettore, altoparlanti) vengono dai disegni quotati che Apple pubblica per chi progetta accessori. Le poche quote che il disegno non scrive (il raggio del rialzo della fotocamera, dove finisce il rialzo largo dei 17 Pro e dell'Air) sono misurate in scala sul disegno.
- **Misure mie:** per qualsiasi altro telefono. I campi partono dalle misure dell'ultimo modello scelto e puoi cambiare tutto: larghezza, altezza, spessore, raggi di angoli e bordo, tasti (centro dalla cima e lunghezza, per esempio `34/7, 48/11`), fotocamera, connettore e fori sul fondo.
- **Materiale:**
  - *TPU:* il telefono entra a scatto sotto il bordo, che gira tutto attorno.
  - *PLA o PETG:* la cover è rigida ma chiusa tutto attorno come quella in TPU. Il bordo sul vetro è più stretto (0,6 mm) e il telefono entra inclinato: prima la cima sotto il bordo, poi si preme giù il fondo, mentre le pareti si piegano di pochi decimi. Il PETG si piega meglio del PLA.
- **Gioco** sui lati e sullo spessore (cambia da solo quando scegli il materiale), attorno a tasti e connettore e attorno alla fotocamera.
- **Bordi:** spessore di pareti e retro, quanto il bordo copre il vetro e quanto sporge sopra lo schermo; spigoli arrotondati, smussati o vivi.
- **Fotocamera:** le lenti degli iPhone sporgono più del retro di una cover sottile. Per proteggerle c'è una **copertura a parte**: chiude tutta la finestra della fotocamera e lascia aperti solo lenti, flash, microfono e sensori (con i fori svasati a 45°, fuori dal campo delle lenti), e sporge oltre le lenti di 0,5 mm (regolabile). Si infila da dentro la cover prima del telefono: passa nella finestra e il suo bordo largo 1 mm (la flangia) resta in un incavo scavato nel retro, dalla parte del telefono. Fuori non esce perché la finestra è più stretta, dentro la tiene ferma il telefono: niente colla. La flangia si allarga a 55°, così si stampa senza supporti. Si stampa con la faccia esterna sul piatto, come il retro della cover (così ha la stessa trama del piatto), senza supporti, in PLA o PETG opaco (un materiale chiaro fa passare la luce del flash nelle foto), anche di un altro colore. Con "Misure mie" le posizioni delle lenti non sono note e diventa un anello attorno alla fotocamera. In alternativa il *retro più spesso*, spesso quanto sporgono le lenti, senza pezzi in più. Su 17 Pro, 17 Pro Max e Air il rialzo della fotocamera è largo quanto il telefono: con la copertura il retro resta dello spessore scelto e la copertura abbraccia il rialzo, sporgendo fuori come una gobba; senza copertura il rialzo entra in una tasca e il retro, piatto fuori, diventa più spesso.
- **Aperture:** dove ci sono i tasti il fianco è aperto dal retro fino al bordo, come nelle cover in commercio (i tasti vicini, Azione e volume o interruttore e volume, in un'unica apertura): il dito arriva a tutto il tasto. Anche il fondo è aperto per cavo, altoparlante e microfoni, senza toccare gli angoli. Il Camera Control ha un'asola con i 25 mm liberi che chiede Apple. Con il TPU i tasti possono anche essere coperti: la parete si assottiglia sopra il tasto e fuori c'è un rilievo da premere.
- **Cavalletto:** un pezzo a parte che si infila in una guida a coda di rondine scavata nel retro e tiene il telefono in verticale o in orizzontale, con l'inclinazione che vuoi. Si stampa steso sul fianco.
- **Retro:** scritta (anche con `{SP}` e `{viso}`) e il tuo disegno SVG, caricato dal riquadro *Il tuo disegno*, *a filo* (a colori nei primi strati, la superficie resta liscia), *inciso* o *traforato*.
- **MagSafe:** un incavo ad anello per un anello magnetico adesivo (diametri e spessore regolabili, con o senza linguetta di orientamento), centrato sul MagSafe del telefono come nei disegni Apple (sul 17 Pro e sull'Air non è al centro). *Dentro la cover* l'anello resta nascosto tra cover e telefono; *sul retro* resta a vista. Così caricatori e accessori MagSafe si attaccano anche attraverso la cover, e anche sull'iPhone 16e, che ha la ricarica wireless ma non i magneti. Con il cavalletto in verticale la guida va da sola sotto l'anello.
- **Striscia di prova:** solo la cima o solo il fondo (22 mm), per controllare misure e gioco in pochi minuti prima di stampare tutta la cover.
- Il riquadro misure avvisa se le lenti sporgono dalla cover, se il retro supera i 2,1 mm (oltre, Apple non garantisce la ricarica MagSafe) e se il bordo entra nella parte piatta dello schermo.

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

### Reggimensole e ganci
![Reggimensole e ganci](docs/img/supporti.png)
Si stampano **sdraiati sul fianco**: gli strati seguono il profilo, così la squadra non si apre e il gancio non si spezza lungo gli strati.

- **Reggimensola:**
  - profondità (sotto la mensola), altezza sul muro, larghezza e spessore;
  - rinforzo a scelta: triangolo pieno (il più robusto), triangolo traforato, puntone diagonale, raccordo curvo, arco, oppure nessuno (squadra a L); l'*estensione* dice quanta parte dei bracci copre;
  - viti al muro e sotto la mensola, diametro e svasatura. I fori vanno solo dove arriva il cacciavite (non dietro il rinforzo): se non c'è spazio il riquadro misure lo dice. Fori a goccia, stampabili senza supporti;
  - *labbro* in punta che non fa scivolare la mensola (comodo per il vetro);
  - *piastra al muro* che può salire sopra la mensola con altre viti al muro (la mensola si appoggia contro la piastra), e può essere più larga della squadra: in quel caso si stampa sulla schiena;
  - numero di copie; nell'anteprima c'è una mensola d'esempio in azzurro.
- **Gancio:**
  - *a muro*: uno o più ganci (appendiabiti) con la distanza tra loro, su una piastra fissata con viti (sopra i ganci, dove arriva il cacciavite), biadesivo o magneti incassati sul retro;
  - *sopra porta o anta*: si aggancia sul bordo della porta; imposti spessore della porta, il ponte sottile che passa nella fessura del telaio e la lunghezza dei due lati;
  - *per tubo o bastone*: anello a scatto sul tubo (diametro e apertura regolabili) e gancio sotto;
  - *a S*: apertura sopra e sotto e lunghezza del gambo;
  - per tutti: larghezza e spessore del gancio, sporgenza, raggio della curva, altezza della punta, inclinazione e pallino in punta;
  - orientamento di stampa sul fianco (robusto) o sulla schiena (comodo per gli appendiabiti lunghi).

### Powerbank
- **Schede**, solo quelle con le misure pubblicate dal venditore. Le posizioni delle porte sono ricavate in scala dalle foto dall'alto, e i fori seguono le misure standard dei connettori con un **gioco** regolabile (0,6 mm per lato):

  | Scheda | Dove si compra | Misure | Porte |
  |---|---|---|---|
  | *18650 LCD 2.4A, 2 USB* | Amazon, AliExpress | 65 × 25 mm (venditore) | 2 USB-A, USB-C, micro-USB davanti, Lightning sul fianco, display, pulsante sul fianco |
  | *IP5328P 18 W QC* | Amazon, AliExpress | 64,6 × 32,3 mm (venditore) | 2 USB-A e USB-C davanti, micro-USB sul fianco, 4 LED |
  | *Doppia USB 1 A + 2,1 A con LCD e torcia* | Amazon, AliExpress | 58 × 27 × 15 mm (venditore) | 2 USB-A e micro-USB sotto la scheda (si monta con l'LCD in su), LED della torcia e pulsante sui fianchi |
  | *SW6106 18 W PD/QC* | AliExpress | 71,5 × 17,9 mm (disegno quotato) | USB-C, USB-A e pulsante davanti, 4 LED sopra |
  | *SW6208 22,5 W PD/QC* | AliExpress | 71,8 × 27 mm (disegno quotato) | micro-USB, USB-C, 2 USB-A davanti, pulsante sul fianco |
- **Pareti uniformi:** l'interno ha gli angoli arrotondati come l'esterno, così la parete è spessa uguale anche sulle curve; le guide della slitta seguono la curva degli angoli, e a destra il coperchio copre gli angoli.
- **Celle:** da 1 a 8 **18650 in parallelo**, *normali* (misure massime della Samsung 35E, 18,55 × 65,25 mm) o *protette* (fino a circa 19 × 70 mm). Il riquadro misure calcola capacità e wattora.
- **Portapile già pronto (scelta iniziale), senza saldare niente sulle celle:** un portapile **in parallelo (3,7 V) con i fili**, di cui scrivi tu **lunghezza, larghezza e altezza** (78 × 40 × 22 mm all'inizio, un portapile nero da 2 posti), quanti ne metti (uno accanto all'altro) e quante celle ha ognuno, per il calcolo della capacità. La scatola li tiene in una cornice con 0,4 mm di gioco per lato, aperta in testa per i fili; con più portapile si uniscono i fili con due morsetti a leva. Deve dire 3,7 V o Parallel: quelli da 7,4 V sono in serie.
- **Contatti a molla, come le pile:** ogni vano ha due fessure per le piastrine a molla da 16 × 16,5 mm (vanno bene anche quelle da 16 × 18,5) che si trovano per i portapile 18650: molla a sinistra (−), piastrina col bottone a destra (+), segnati sul fondo. Le celle si tolgono e si rimettono senza saldare. I fili delle piastrine passano dai fori in fondo alle fessure ai canali laterali, e si uniscono con due morsetti a leva. In alternativa, *pacco saldato*.
- **Posizione e orientamento delle celle:** *dietro la scheda*, *a destra* o *a sinistra*, e in ognuna *parallele alla scheda* (da sinistra a destra) o *perpendicolari* (dal davanti verso il retro): sei combinazioni. Il riquadro misure dà le dimensioni esterne, così si prova e si tiene la scatola più comoda. Di fianco, il lato corto della scheda che guarda le celle resta chiuso: se lì c'è il pulsante o una porta, il riquadro misure lo dice.
- **Spazio per i fili** tra il retro della scheda e le celle (8 mm all'inizio, regolabile): lì passano i fili saldati sulle piazzole B+ e B− e gli eventuali morsetti.
- **Fronte:** fori smussati per le porte e, fuori, un incavo grande quanto la spina che lascia la parete spessa 1 mm, così le spine entrano fino in fondo. Le porte sui fianchi hanno un foro grande quanto la spina.
- **Pulsante:** *linguetta* nella parete che si piega e preme il tasto con un dentino, oppure *foro*.
- **Display e LED:** finestra svasata nel coperchio per il display; sopra i LED il coperchio resta spesso 0,4 mm e la luce passa.
- **Coperchio:** *a slitta* (guide a coda di rondine, tacca per l'unghia) oppure *a viti nascoste*: quattro viti svasate da sotto che si avvitano nel coperchio, sopra non si vede niente. Scatola e coperchio sono un solo guscio arrotondato, con gli spigoli raccordati.
- **Coperchio decorato:** scritta su una o due righe con il **logo SP**, il **viso** e il **viso di Natale** (pulsanti sotto il campo, come nelle altre scritte) e il **tuo SVG** dal riquadro *Il tuo disegno*. Va nella zona sopra le celle. Il coperchio si stampa capovolto, quindi come il retro della cover: *a filo* (a colori nei primi strati, fino a 4 filamenti, la superficie resta liscia), *inciso* o *traforato*.
- **Pezzi di prova**, da stampare in pochi minuti prima della scatola: il *fronte* con porte e pulsante, per vedere se la scheda combacia; la *chiusura*, cioè con la slitta gli ultimi 30 mm di guida e un pezzo di coperchio da far scorrere (per regolare la tolleranza), con le viti un angolo con la colonnina e il suo pezzo di coperchio da avvitare.
- Le piazzole B+ e B− della scheda restano da saldare (sono le uniche due saldature).
- Nell'anteprima scheda, celle e piastrine sono in azzurro e non finiscono nel file.
- **Viti stampate:** con *Coperchio → a viti* puoi scegliere *Tipo di viti → Stampate* (M6, M8 o M10, gioco del filetto regolabile): le 4–5 viti escono come pezzo da stampare e il coperchio ha le boccole filettate. La scatola cresce di qualche mm per le colonnine più grosse.
- **Pareti e fondo sottili (solo coperchio a viti):** pareti da 0,8 mm e fondo da 0,8 mm in su; con il coperchio a slitta restano almeno 1,6 e 1,2 mm, perché le guide si scavano nelle pareti (se scrivi meno, il riquadro misure lo dice). Sotto 1,2 mm compare un avviso. Con pareti 1,2 e fondo 1,2 la scatola di default passa da circa 37 a circa 26 g di PLA.

### Box schede ESP
Una scatola sola per un **processore** e fino a **5 moduli**, pensata per schede con i piedini già montati e collegate con i **dupont, senza saldare**. Il riquadro misure dice, per ogni scheda scelta, da dove vengono le misure, come configurarla in **ESPHome** (piattaforma, board, componente, indirizzo I²C) e cosa è solo stimato.

| Processore | Misure | USB | ESPHome |
|---|---|---|---|
| *Wemos / LOLIN D1 mini* (ESP8266; "ESP8266 D1 mini" è la stessa scheda) | 34,2 × 25,6 mm | micro | `esp8266`, board `d1_mini` |
| *NodeMCU V3 LoLin* (ESP8266, CH340) | 58 × 31 mm | micro (USB-C nel modello recente) | `esp8266`, board `nodemcuv2` |
| *ESP32 D1 mini* (ESP32-WROOM-32) | 39 × 31,4 mm | USB-C | `esp32`, variant `esp32` |
| *ESP32-CAM* (AI-Thinker, OV2640) | 40,5 × 27 mm, 10 mm con la fotocamera | nessuna (5V + adattatore seriale) | `esp32` + `esp32_camera` (serve PSRAM) |
| *ESP32-CAM + base MB* (USB, circa 48 × 27 mm, antenna interna o esterna) | 48 × 27 mm | micro | `esp32`, `esp32_camera`; i piedini non escono dalla base |
| *ESP32-C3 SuperMini con OLED 0,42"* (antenna ceramica, AliExpress) | 22,5 × 18 mm | USB-C | `esp32`, variant `esp32c3`, `ssd1306_i2c` modello 72x40 |
| *ESP32-C3 con OLED 0,42"* (versione più grande) | 25 × 20,5 mm | USB-C o micro | come sopra |
| *Altra scheda* | le tue misure | a scelta | — |

| Modulo | Misure | Bus | ESPHome |
|---|---|---|---|
| *MPU6050* (GY-521) | 20,5 × 15,5 mm | I²C 0x68/0x69 | `sensor: mpu6050` |
| *BMI160* (GY-BMI160) | 12,8 × 12,1 mm | I²C 0x68/0x69 | `sensor: bmi160` |
| *RC522* RFID | 60 × 39 mm | SPI | `rc522_spi` + `binary_sensor: rc522` |
| *VEML7700* luce | 16,7 × 16,7 mm | I²C 0x10 | `sensor: veml7700` |
| *ENS160 + AHT21* aria | 16 × 11 mm | I²C 0x52/0x53 | `sensor: ens160_i2c` |
| *OLED SSD1306* 0,96" 128 × 64 | 27,3 × 27,8 mm | I²C 0x3C | `display: ssd1306_i2c` |
| *LCD TFT 1,8"* 128 × 160 (ST7735) | 34,5 × 58 mm | SPI | `display: st7735` |
| *Pannello WS2812B* 8 × 8 rigido, 16 × 16 e 8 × 32 flessibili | 65 × 65, 160 × 160, 320 × 80 mm | 1 filo dati | `esp32_rmt_led_strip` (ESP32) o `neopixelbus` (ESP8266) |
| *Altra scheda* | le tue misure | — | — |

- **Disposizione:** il processore per primo, a sinistra con la USB che esce dalla parete (apertura smussata e incavo per la spina, come nel Powerbank); i moduli di seguito. Superata la *larghezza massima interna* le schede vanno a capo su una nuova fila.
- **Piedini e dupont:** le schede stanno con i componenti in su e i piedini in giù. Sotto restano **22 mm liberi** (regolabili per ogni scheda: header 2,5 mm + connettore dupont 14 mm + curva dei fili), e i fili passano sotto le schede e tra una culla e l'altra.
- **Piedini sopra o sotto:** per ogni scheda scegli da che lato hai saldato i piedini. *Sotto*: i dupont stanno nel vano sotto la scheda. *Sopra*: la scheda scende e i dupont salgono verso il coperchio (16,5 mm più 3 mm per la curva dei fili); il display resta più lontano dalla finestra.
- **Quattro montaggi per il processore** (*Piedini saldati*): *Sotto* (componenti su, piedini giù), *Sopra* (componenti su, piedini su), *Sotto · capovolta* (saldata come da breadboard ma montata con i componenti verso il fondo: piedini su, dupont verso il coperchio) e *Sopra · capovolta* (saldata dal lato dei componenti e capovolta: componenti e piedini giù, sopra restano 3 mm per le punte saldate). Capovolta: la scheda appoggia sui bordi (0,8 mm di muretto), l'apertura della USB scende sotto il circuito, fronte e retro si scambiano, niente finestra nel coperchio.
- **Torri dei moduli:** ogni modulo sta su una torre con il muretto su tre lati e i piedini in giù (header saldato dal lato opposto ai componenti); il lato aperto è quello dei piedini, da cui escono i fili. Per ogni modulo scegli da che parte guarda l'apertura, vista dall'alto: *a destra*, *a sinistra*, *in su (dietro)* o *in giù (davanti)* (il modulo si gira di 90° o 180° per portarci i piedini; se è un display il riquadro misure dice che rotazione mettere in ESPHome), lo *spazio sotto* (22 mm di default) e se sta *sotto il coperchio*: in quel caso la torre lo porta a pochi mm dal coperchio (*Distanza dal coperchio*, 1,5 mm di default), per lettori RFID/NFC e sensori di luce, aria, temperatura. Con base + campana le torri sono sulla base.
- **Pezzo di prova "Solo base, culle e prese delle pareti":** in *Stampa → Pezzo di prova*, con qualsiasi montaggio delle schede. Esce un pezzo basso: fondo da 1 mm (bordo lungo il contorno, fondo sotto le culle bucato al centro, una traversina per scheda), le culle e i pezzi di parete con le aperture (USB del processore, antenna dell'ESP32-CAM), alla stessa posizione della scatola vera. Con i piedini in giù (Sotto, Sopra · capovolta) la culla è accorciata a 11 mm sotto la scheda e abbassata insieme alla sua presa: si prova senza i dupont. Circa 8–14 g di PLA invece di 50–65.
- **ESP32-CAM, antenna:** *interna* (sul circuito) oppure *esterna*: foro Ø 6,6 mm nella parete sinistra per un connettore SMA da pannello, con un cavo U.FL/IPEX–SMA; va spostata la resistenza da 0 Ω accanto al connettore IPEX.
- **Prese d'aria:** fessure, fori tondi o esagoni (nido d'ape), da mettere su coperchio, fondo e sulle quattro pareti (in alto, al centro, in basso o per tutta l'altezza; sul coperchio e sul fondo anche solo sopra il processore, sopra i moduli o sopra processore e moduli insieme). Le aperture saltano finestre, LED, viti, USB, antenna e passacavi; il riquadro misure dà l'area libera. Sul fondo servono piedini di gomma.
- **Posizione con le frecce:** le schede partono in fila; per ognuna (processore e moduli) quattro frecce la spostano di 1 mm a clic (0,2 mm con Maiusc), il centro rimette la posizione automatica. La scatola si allarga da sola e il riquadro misure avvisa se due schede si toccano o se un modulo blocca il cavo USB.
- **Supporto a sfera per la camera:** come nei progetti per ESP32-CAM più scaricati: una sfera (pezzo "Sfera", Ø 10–20 mm) si avvita sotto il fondo con due viti M3 svasate e si spinge in uno snodo a scatto (pezzo "Snodo", coppa con 4 tagli) con base a parete (due viti), magnetica (magnete 10 × 2 o 8 × 2 mm) o per treppiede (dado 1/4"-20). La posizione della sfera sul fondo si sposta con le frecce e parte dal punto libero più vicino al centro (non sotto i dupont).
- **Viti stampate (senza viti da comprare):** *Tipo di viti → Stampate* sostituisce le viti metalliche con viti stampate a testa svasata (taglio per il cacciavite) e filetto vero, fatte con lo stesso motore di *Viti e bulloni*. Misure M6, M8, M10: con ugello 0,4 mm M6 è la più piccola che viene (sotto il filetto è più sottile di una passata). Le viti entrano da sotto, con la testa a filo del fondo, e si avvitano in boccole filettate sotto il coperchio; lo stesso vale per le due viti della sfera. Il *gioco del filetto* (0,3 mm) si regola come in Viti e bulloni. Stampa le viti in piedi, strati sottili, 4 perimetri, PETG. Le colonnine sono più grosse, quindi la scatola cresce di qualche mm. Disponibile in Box schede ESP e Powerbank.
- **Culle:** ogni scheda ha un muretto sotto i bordi senza piedini, un contorno alto quanto il circuito e, sui bordi con i piedini, due dentini fuori dalla scheda. Niente muretti dove stanno i connettori. Gioco regolabile (0,3 mm per lato).
- **Altezza di ogni scheda:** ogni scheda sta sul fondo più il suo *spazio sotto* (processore e ogni modulo hanno il loro, 22 mm di default, in *Piedini saldati*; vale per le schede con i piedini in giù). La scatola è alta quanto serve alla scheda più alta. Le schede con i piedini in su stanno in basso. Se una scheda con finestra (display, fotocamera, sensore di luce) resta a più di 2,5 mm dal coperchio il riquadro misure avvisa: alza il suo spazio sotto o scegli *Sotto il coperchio*. Con meno di circa 17,5 mm i dupont dritti non ci stanno (avviso).
- **Finestre nel coperchio:** display svasati (margine regolabile), foro per l'obiettivo dell'ESP32-CAM, foro o pelle sottile per il VEML7700, fessure per l'aria dell'ENS160, finestra del pannello LED *aperta* o con **diffusore** da 0,6 mm.
- **LED:** da 0 a 4 LED da 3, 5 o 8 mm sulla fascia davanti del coperchio, con un anello che li tiene, oppure LED *diffuso* (la luce passa da 0,6 mm di coperchio, anche per un WS2812B singolo). Con *Il LED → Sporge / A filo / Incassato* scegli quanto esce: il collarino batte sotto un tubetto sotto il coperchio, più lungo per averlo a filo (5 mm: tubetto di circa 5,6 mm) o incassato di 1 mm. Sporgente, un LED da 5 mm esce di circa 4 mm (misure tipiche dei LED).
- **Passacavi** sulla parete dietro, per l'alimentazione o per sensori esterni.
- **Coperchio:** quattro viti M3 o M2,5 a testa svasata, in colonnine agli angoli.
- **Coperchio decorato:** scritta su due righe (con i loghi SP e i visi), carattere, il tuo SVG e i colori, come nel Powerbank: a filo (a colori, nei primi strati), inciso o traforato. Si può usare tutto il coperchio (fino a 1,5 mm dal bordo), anche negli angoli: la scritta parte al centro del rettangolo libero più grande e con le frecce va dove vuoi; dove tocca una finestra, un foro di LED o una vite dall'alto viene tagliata e il riquadro misure lo dice. *Rotazione riga 1*, *Rotazione riga 2* e *Rotazione disegno* a passi di 15° (anche nel Powerbank): ogni riga gira attorno al suo centro e le frecce la spostano sempre nel verso del coperchio.
- **Pareti e fondo sottili:** pareti da 0,8 mm (2 passate con ugello 0,4) in su, fondo da 0,8 mm (4 strati) in su. Sotto 1,2 il riquadro misure avvisa: la parete si piega quando infili la spina USB, il fondo si flette (soprattutto con le prese d'aria). Con pareti sottili l'incavo per la spina non c'è (non serve) e le culle contro la parete vengono tagliate a filo dell'esterno.
- **Avvisi automatici:** indirizzi I²C in comune (per esempio MPU6050 e BMI160), alimentazione a 5 V dei pannelli LED, GPIO3 dell'ESP8266 per i WS2812B, pin occupati dell'ESP32-CAM.
- **Cosa è stimato:** le misure delle schede vengono dai produttori e dai venditori; altezze dei componenti, distanza dei piedini dal bordo e posizione delle finestre sui moduli sono stimate (il riquadro lo dice per ogni scheda). Stampa prima il coperchio, che è sottile e veloce, e prova le schede nelle finestre; se una scheda ha misure diverse usa *Altra scheda*.

### Viti e bulloni
![Bullone M8 con rondella e dado](docs/img/bullone.png)
- **Filetto metrico ISO** a passo grosso, da M3 a M30; con *Altro* scegli diametro e passo liberi. Filetto destro o sinistro.
- Il filetto è un'elica vera, non un'approssimazione: vite e dado dello stesso file si avvitano.
- **Gioco filetto** regolabile (0,3 mm all'inizio): è lo spazio tra i fianchi di vite e dado.
- **Lunghezza filettata**: tutta, oppure solo in punta con il resto del gambo liscio.
- **Teste:** esagonale, cilindrica, svasata a 90°, zigrinata da girare a mano, oppure senza testa (grano o barra filettata). Impronta a esagono incassato o a taglio. Le misure della testa sono quelle standard ISO, oppure le scegli tu con *Misure testa su misura* (larghezza o chiave, e altezza).
- **Bullone:** dado esagonale, zigrinato o ad alette, dado alto (×1,5) e da zero a due rondelle. L'anteprima mostra il bullone montato e lo spessore che puoi serrare.
- **Orientamento di stampa:** *in piedi* (testa in basso, filetto più preciso) o *sdraiata*, con un lato piatto per appoggiarla: molto più resistente.

### Perni
![Perno a scatto con piastrine di prova](docs/img/perno.png)
- **A scatto:** si infila nel foro e si aggancia da solo con due dentini elastici. Doppio, per unire due pezzi, oppure con testa. Imposti diametro e spessore del pezzo da attraversare; il file è già orientato sdraiato sul lato piatto.
- **Spina liscia** con estremità smussate, per centrare due pezzi.
- **Con testa**, con foro per la coppiglia: per cerniere e snodi.
- Il riquadro misure indica il **foro da fare nei tuoi pezzi** (diametro + tolleranza).
- **Piastrina di prova:** un pezzetto con il foro giusto, per provare l'incastro prima di stampare il progetto vero.

---

## Come si usa

1. Scarica `index.html` e aprilo con un browser (Chrome, Safari, Firefox, Edge). Funziona anche offline.
2. Nella pagina iniziale scegli cosa generare. Con Gridfinity, in alto passi da contenitore a cassettiera a base. **← Tutti** riporta alla pagina iniziale.
3. A sinistra regoli i parametri: l'anteprima si aggiorna subito.
4. Con **Informazioni**, in alto a destra, apri il riquadro con le misure reali (esterno, interno, volumi, avvisi): così non copre l'anteprima. Il numero rosso sul pulsante dice quante note ci sono; **Esc** lo richiude.
5. Con **Salva impostazioni**, in fondo ai parametri, dai un nome alle regolazioni e le ritrovi nella lista: un clic le ricarica, ✕ le elimina. Restano nel browser; con **Scarica come file** ottieni un file `.json` da riaprire con **Apri file**, anche su un altro computer.
6. Premi **Scarica 3MF**, oppure **STL**, e apri il file nello slicer.

**Comandi dell'anteprima**
- Trascina per ruotare, rotella per lo zoom, tasto destro per spostare.
- **Sezione** taglia il modello a metà per vedere com'è fatto dentro.
- **Centra vista** riporta la camera sul modello.

I valori che imposti restano salvati nel browser. **Ripristina valori** torna a quelli iniziali.

**Se l'anteprima 3D non compare:** l'anteprima usa WebGL, la grafica 3D del browser. Su alcuni PC non è disponibile (scheda video vecchia, driver da aggiornare, accelerazione grafica disattivata, PC aziendali). Il sito funziona lo stesso: schede, parametri, misure ed esportazione ci sono, al posto delle anteprime compare un avviso. Per riaverle, in Chrome o Edge attiva *Impostazioni → Sistema → Usa l'accelerazione grafica se disponibile* e riavvia il browser, oppure prova un altro browser.

**Frecce di posizione:** sotto ogni croce di frecce scegli il passo, 0,5 · 1 · 5 · 10 mm a clic (vale per tutte le croci; con Maiusc 0,2 mm).

**Link diretti:** ogni generatore ha il suo indirizzo, da usare per linkarlo o salvarlo nei preferiti: `#natale` (pallina), `#natale-palla` (palla piatta), `#natale-piatto`, `#natale-albero`, `#natale-stella`, `#natale-lanterna`, `#natale-formina`, `#gridfinity`, `#gridfinity-cab` (cassettiera), `#gridfinity-base`, `#rack`, `#vasi`, `#supporti` (reggimensola), `#supporti-gancio`, `#powerbank`, `#schede` (box schede ESP), `#viteria` (vite), `#viteria-bullone`, `#viteria-perno`, `#cover`.

### Il file 3MF
- Ogni pezzo è un oggetto separato e con il suo nome (per esempio "Cassetto 3" o "Cestello pescante 1").
- Le parti di colori diversi dello stesso pezzo restano unite in un solo oggetto multicolore.
- I pezzi sono già disposti sul piatto e orientati per la stampa senza supporti: coperchi e cestelli capovolti, cassetti accanto al mobile, viti con la testa in basso o sdraiate sul lato piatto, dadi e rondelle accanto.
- Il riquadro misure separa le **Note** in rosso (c'è qualcosa da cambiare, con il suggerimento) dalle **Info** neutre (solo informazioni, niente da correggere).
- Funziona con Bambu Studio, PrusaSlicer, OrcaSlicer, Cura e gli altri slicer che leggono il 3MF.

---

## Consigli di stampa

### Tarare la tolleranza
Ogni stampante è diversa. Il parametro **Tolleranza stampante** (0,3 mm all'inizio) è il gioco usato negli incastri: cassetti, fori per magneti, vaso interno e cestello.
1. Stampa un pezzo piccolo, per esempio una cassettiera 1×2 con un cassetto.
2. Se il cassetto entra troppo stretto, aumenta la tolleranza di 0,05–0,1 mm.
3. Se balla troppo, diminuiscila.

### Per tipo di oggetto
- **Decorazioni piatte e palle piatte:** strati da 0,2 mm, 3 mm di spessore. Spessore, spessore della scritta e rilievo vanno a multipli di 0,2 e di 0,28 mm (0,28 · 0,56 · 0,84 · 1,12…): con − e + si passa al valore vicino, così ogni colore cade su strati interi anche se stampi il primo strato a 0,28. Per scritte piccole ugello da 0,4 mm e lettere di almeno 5 mm. La scritta in corsivo regge meglio se è almeno 8 mm.
- **Palline:** incolla le due metà sull'anello con colla cianoacrilica. Lo spessore del guscio va bene da 1,2 mm in su; con 0,8 mm la pallina è leggerissima ma delicata.
- **Formine:** usa PLA o PETG adatti agli alimenti e lavale a mano.
- **Lanterne:** solo lumini LED, mai candele vere.
- **Gridfinity:** per la prima prova stampa un contenitore 1×1×3 e una base 2×2, così verifichi incastro e impilamento.
- **Pareti:** usa spessori multipli del diametro dell'ugello (con 0,4 mm: 0,8, 1,2, 1,6).
- **Rack:** se i separatori sono alti o sottili, stampalo *sul fianco*.
- **Cover:** stampa prima la striscia di prova e regola il gioco. TPU (95A) lento, 20–30 mm/s, senza supporti; con PLA o PETG parti da 0,3 mm di gioco. Cavalletto e copertura della fotocamera vanno stampati in PLA o PETG; se la copertura entra dura nella finestra aumenta il suo gioco.
- **Vasi:** perché tengano l'acqua servono almeno 3 perimetri. Per il vaso esterno dell'autoirrigante e per il sottovaso, il PETG è meglio del PLA.
- **Reggimensole e ganci:** lasciali sul fianco come escono dal file. 4 o più perimetri e riempimento 40% o più; per pesi veri PETG. Per libri usa squadre da 7 mm di spessore e 25 mm di larghezza in su, con il rinforzo a triangolo pieno.
- **Viti e bulloni:** stampa prima un bullone M8 corto per tarare il *Gioco filetto*. Usa 4 o più perimetri (o riempimento 100%) e strati sottili (0,12–0,16 mm). Sotto M6 il filetto stampato è delicato. Per viti che lavorano, PETG o nylon.
- **Powerbank:** PETG o ASA, non PLA (in auto al sole si deforma). Stampa prima la *prova del fronte*. Prima di collegare le celle in parallelo portale alla stessa tensione e rispetta la polarità sulle piazzole B+ e B−: al contrario la scheda si brucia.
- **Box schede ESP:** PLA o PETG, scatola aperta in su e coperchio capovolto, senza supporti. Stampa prima il coperchio per controllare le finestre e prova una scheda nella sua culla. Il pannello LED vuole un alimentatore a 5 V a parte.
- **Perni a scatto:** se il perno entra troppo duro aumenta la tolleranza; se la fessura è corta (lo segnala il riquadro misure) il perno resta rigido.

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
│   ├── geom.js     geometria dei generatori (filetti compresi)
│   ├── natale.js   generatori di Natale: forme, scritte, colori
│   ├── supporti.js reggimensole e ganci
│   ├── cover.js    cover per telefoni
│   ├── telefoni.js misure dei telefoni per le cover
│   ├── powerbank.js scatola per powerbank: celle, schede e connettori
│   ├── schede.js   box per schede ESP e sensori: misure di processori, moduli e pannelli LED
│   ├── fonts.js    contorni dei caratteri (generato)
│   ├── logos.js    contorni dei loghi per le scritte (generato da assets/)
│   ├── svg.js      lettore SVG (disegni caricati e libreria)
│   └── emoji.js    disegni Fluent Emoji (generato)
├── assets/         loghi: SVG per la pagina (li incorpora build.py) e STL originali
├── tools/
│   ├── make-fonts.mjs  rigenera src/fonts.js dai caratteri
│   ├── make-logos.mjs  rigenera src/logos.js dagli STL dei loghi
│   └── make-emoji.mjs  rigenera src/emoji.js dai Fluent Emoji
└── docs/img/       immagini per questo README
```

### Ricostruire `index.html`

```bash
npm install
python3 build.py
```

Lo script incorpora three.js, Manifold (compreso il file WebAssembly), i caratteri e i sorgenti in un solo HTML da circa 1,8 MB, che funziona offline.

Per cambiare i caratteri delle scritte modifica l'elenco in `tools/make-fonts.mjs` e lancia `npm run fonts`. Per cambiare i loghi sostituisci gli STL e gli SVG in `assets/` e lancia `npm run logos`. Per aggiungere o togliere disegni dalla libreria modifica l'elenco in `tools/make-emoji.mjs` e lancia `npm run emoji`.

### Come funziona
- **Geometria:** [Manifold](https://github.com/elalish/manifold) (WebAssembly) costruisce solidi con operazioni booleane. I modelli escono sempre chiusi e senza errori.
- **Scritte:** i contorni dei caratteri sono salvati in `src/fonts.js`; al momento le curve diventano poligoni e poi solidi.
- **Colori:** un generatore può dare a ogni parte un `color` e un `group`. Le parti dello stesso gruppo diventano un solo oggetto con più parti (componenti 3MF), e i colori finiscono nei materiali del file.
- **Filetti:** la sezione trasversale del profilo ISO a 60° viene estrusa con una torsione di 360° per ogni passo, e ne esce un'elica esatta. Il foro del dado usa la stessa sezione allargata del gioco, con la stessa fase: per questo vite e dado combaciano.
- **Anteprima:** [three.js](https://threejs.org/).
- **Esportazione:** il 3MF è un file zip con dentro XML, scritto direttamente dal codice senza librerie esterne.

### Aggiungere un generatore
1. In `src/geom.js` scrivi una funzione `nome(p)` che riceve i parametri e restituisce quanto segue. Per un gruppo grande puoi usare un file a parte che si registra in `SPRECOLO_EXT`, come `src/natale.js`, e aggiungerlo a `build.py`.
   - `parts`: lista di `{ name, m, role, print?, at?, color?, group? }`
     - `m` è il solido Manifold;
     - `print` è la versione già orientata per la stampa;
     - `at` è la posizione nell'anteprima;
     - `role: 'ghost'` indica un oggetto solo di esempio, che non viene esportato.
     - `color` (es. `'#b3202a'`) e `group`: le parti con lo stesso gruppo diventano un unico oggetto multicolore.
   - `info`: lista di coppie `[etichetta, valore]` per il riquadro delle misure.
2. Collegala in `build()` dentro `geom.js`.
3. In `src/app.js` aggiungi una voce in `MODES` con l'elenco dei parametri: tipo `int`, `num`, `bool`, `select` o `text`, con `min`, `max`, `step`, `def`, `unit`, `help` e `show`.
4. Sempre in `src/app.js`, aggiungi il generatore a `GROUPS`: un nuovo gruppo diventa un nuovo riquadro nella pagina iniziale, con titolo, categoria e descrizione. Puoi anche aggiungerlo a un gruppo esistente, che mostra le sotto-schede in alto. L'anteprima del riquadro viene generata in automatico dal motore.
5. Esegui `python3 build.py`.

---

## Crediti

- **Gridfinity**, il sistema modulare creato da [Zack Freedman](https://www.youtube.com/@ZackFreedman). SP Lab ne riproduce le misure standard.
- **[three.js](https://github.com/mrdoob/three.js)**, licenza MIT.
- **[Manifold](https://github.com/elalish/manifold)**, licenza Apache 2.0.
- Caratteri **IBM Plex**, licenza SIL Open Font License (caricati da Google Fonts quando c'è connessione).
- Caratteri delle scritte **Fredoka**, **Pacifico** e **Mountains of Christmas**, licenza SIL Open Font License, incorporati nella pagina.

- Disegni **[Fluent Emoji](https://github.com/microsoft/fluentui-emoji)** © Microsoft Corporation, licenza MIT (testo completo in [LICENSE-fluent-emoji.txt](LICENSE-fluent-emoji.txt), riportato anche dentro la pagina).
- Misure degli iPhone dai disegni quotati di Apple (*Accessory Design Guidelines*, developer.apple.com). iPhone è un marchio di Apple Inc.; SP Lab non è collegato ad Apple.
- Loghi **SP** e ritratto © Procolo Carannante.

## Licenza

Distribuito con licenza [MIT](LICENSE) © 2026 Procolo Carannante: chiunque può usare e modificare il progetto citando l'autore.

## Sito pubblico

Il generatore è online su **https://procolo75.github.io/sp-lab/**

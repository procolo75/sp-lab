// Box per schede ESP e sensori: un processore e fino a 5 moduli (sensori, display, pannelli LED) in una scatola sola.
// Si aggancia al motore tramite SPRECOLO_EXT.
// Coordinate: x lungo la scatola (la USB del processore esce a sinistra), y in profondità (fronte verso -y), z in alto. mm.
//
// Le schede stanno con la faccia dei componenti in su e i piedini in giù (si usano i dupont senza saldare):
// sotto ogni scheda c'è un vano libero per i connettori e per i fili. Tutte le schede arrivano alla stessa quota
// sotto il coperchio, così display, fotocamera e sensore di luce sono vicini alla finestra.
// Ogni scheda ha una "culla": sui bordi senza piedini un muretto che la regge da sotto e la tiene ferma di lato.
// Sui bordi con i piedini ci sono solo due dentini alle estremità, fuori dalla scheda.
(function (root) {
  // connettori USB: larghezza, quote z dalla faccia superiore del circuito, ingombro della spina
  const CONN = {
    micro: { nome: 'micro-USB', w: 7.5, z0: -0.3, z1: 2.7, spina: [11.5, 8.0] },
    usbc: { nome: 'USB-C', w: 8.94, z0: -0.6, z1: 3.26, spina: [12.5, 7.0] },
  };
  // connettore dupont femmina su un header maschio: plastica dell'header 2,5 mm + corpo del connettore 14 mm
  const DUP = { plastica: 2.5, perno: 6.0, corpo: 14.0, passo: 2.54 };

  // Schede. Sistema di riferimento della scheda: x lungo il lato lungo (L), y lungo il lato corto (W), origine nell'angolo davanti a sinistra.
  // Lati: S = davanti (y = 0), N = dietro (y = W), W = sinistra (x = 0, dove esce la USB), E = destra (x = L).
  // pcb: spessore del circuito; hTop: altezza dei componenti più alti sopra il circuito;
  // pines: file di piedini [lato, quanti, distanza dal bordo al centro dei piedini], centrate sul bordo;
  // usb: connettore sul lato sinistro [tipo, y del centro]; finestra: dove si deve vedere o passare qualcosa (nel coperchio).
  // fonte: da dove vengono le misure; stima: quello che non è misurato; i2c: indirizzi (il primo è quello standard).
  const SCHEDE = {
    // ---------------- processori ----------------
    d1mini: {
      ruolo: 'cpu', nome: 'Wemos / LOLIN D1 mini (ESP8266)', piattaforma: 'esp8266',
      L: 34.2, W: 25.6, pcb: 1.0, hTop: 3.2,
      pines: [{ lato: 'S', n: 8, off: 1.4 }, { lato: 'N', n: 8, off: 1.4 }], usb: { tipo: 'micro', y: 12.8 },
      fonte: '34,2 × 25,6 mm, passo 2,54 mm (scheda tecnica LOLIN/Wemos)',
      stima: 'altezza dei componenti (3,2 mm) e distanza dei piedini dal bordo (1,4 mm)',
      dove: 'Amazon e AliExpress: "D1 mini ESP8266 ESP-12F" (è la stessa scheda di "Wemos D1 mini")',
      esphome: 'esp8266: board: d1_mini',
    },
    nodemcuv3: {
      ruolo: 'cpu', nome: 'NodeMCU V3 LoLin (ESP8266, CH340)', piattaforma: 'esp8266',
      L: 58, W: 31, pcb: 1.6, hTop: 3.2,
      pines: [{ lato: 'S', n: 15, off: 2.8 }, { lato: 'N', n: 15, off: 2.8 }], usb: { tipo: 'micro', y: 15.5 },
      fonte: '58 × 31 × 13 mm con i piedini (AZ-Delivery)',
      stima: 'altezza dei componenti, distanza dei piedini dal bordo e posizione della USB (al centro del lato corto). Il modello recente ha la USB-C: l\'apertura va bene per entrambe',
      dove: 'Amazon e AliExpress: "NodeMCU V3 Lolin ESP8266 CH340" (non confonderla con la Amica V2, 49 × 26 mm)',
      esphome: 'esp8266: board: nodemcuv2',
    },
    d1mini32: {
      ruolo: 'cpu', nome: 'ESP32 D1 mini (ESP32-WROOM-32)', piattaforma: 'esp32',
      L: 38.9, W: 31.4, pcb: 1.2, hTop: 3.5,
      pines: [{ lato: 'S', n: 15, off: 3.0 }, { lato: 'N', n: 15, off: 3.0 }], usb: { tipo: 'usbc', y: 15.7 },
      fonte: '39 × 31,5 mm (AZ-Delivery), 38,9 × 31,4 mm (uElectronics)',
      stima: 'numero dei piedini per fila, distanza dal bordo, altezza dei componenti. Alcune versioni hanno la micro-USB: l\'apertura va bene anche per quella',
      dove: 'Amazon: "ESP32 D1 Mini NodeMCU WiFi" (AZ-Delivery); AliExpress: "D1 mini ESP32"',
      esphome: 'esp32: variant: esp32',
    },
    esp32cam: {
      ruolo: 'cpu', nome: 'ESP32-CAM (AI-Thinker, fotocamera OV2640)', piattaforma: 'esp32',
      L: 40.5, W: 27, pcb: 1.6, hTop: 10,
      pines: [{ lato: 'S', n: 8, off: 2.1 }, { lato: 'N', n: 8, off: 2.1 }], usb: null,
      finestra: { tipo: 'camera', cx: 32.5, cy: 13.5, d: 8 },
      fonte: '40,5 × 27 mm (AI-Thinker); 4,5 mm senza fotocamera',
      stima: 'altezza con la fotocamera (10 mm), posizione dell\'obiettivo (al centro, a 8 mm dal lato destro), distanza dei piedini dal bordo. Non ha USB: si alimenta dal pin 5V e si programma con un adattatore USB-seriale (o con la base MB)',
      dove: 'Amazon e AliExpress: "ESP32-CAM OV2640" (con o senza base MB)',
      esphome: 'esp32: variant: esp32 + esp32_camera (serve PSRAM e I²C)',
    },
    esp32cammb: {
      ruolo: 'cpu', nome: 'ESP32-CAM + base MB (USB)', piattaforma: 'esp32',
      L: 48, W: 27, pcb: 1.6, hTop: 20,
      pines: [], usb: { tipo: 'micro', y: 13.5 },
      finestra: { tipo: 'camera', cx: 40, cy: 13.5, d: 8 },
      fonte: 'base ESP32-CAM-MB circa 48 × 27 mm (circuit.rocks, USB-C) o 39,8 × 27 mm (probots.co.in, micro USB): le fonti non concordano; ESP32-CAM 40,5 × 27 mm (AI-Thinker) infilata sulla base',
      stima: 'lunghezza della base (48 contro 39,8 mm secondo il venditore), tipo di USB (micro o USB-C), altezza totale (zoccoli ~8,5 mm + scheda + fotocamera = 20 mm), posizione dell\'obiettivo, e quanto la USB sporge dalla ESP32-CAM (qui 7,5 mm). Misura la tua coppia col calibro: oppure usa "Altra scheda"',
      dove: 'AliExpress / Amazon: "ESP32-CAM-MB" (spesso venduta insieme alla ESP32-CAM)',
      esphome: 'esp32: variant: esp32 + esp32_camera (serve PSRAM e I²C); si programma direttamente dalla USB della base (CH340)',
    },
    c3super: {
      ruolo: 'cpu', nome: 'ESP32-C3 SuperMini con OLED 0,42" (antenna ceramica)', piattaforma: 'esp32',
      L: 22.5, W: 18, pcb: 1.2, hTop: 3.3,
      pines: [{ lato: 'S', n: 8, off: 1.4 }, { lato: 'N', n: 8, off: 1.4 }], usb: { tipo: 'usbc', y: 9 },
      finestra: { tipo: 'display', x0: 7.4, y0: 3.8, x1: 14.8, y1: 14.2 },
      fonte: '22,5 × 18 mm (formato SuperMini), OLED 0,42" 72 × 40, USB-C, 2 file da 8 piedini, antenna ceramica (scheda AliExpress "ESP32-C3 OLED development board 0.42 inch ceramic antenna")',
      stima: 'le misure, che la pagina non scrive (sono quelle delle SuperMini): controllale col calibro. Posizione dell\'OLED presa in scala dalla foto (al centro, a 11 mm dalla USB), distanza dei piedini dal bordo e altezza dei componenti. L\'antenna è un chip ceramico sulla scheda: lascia libero quel lato e niente metallo vicino',
      dove: 'AliExpress: "ESP32-C3 OLED development board 0.42 inch ceramic antenna supermini" (circa 5 €)',
      esphome: 'esp32: variant: esp32c3, board: esp32-c3-devkitm-1, framework esp-idf; display ssd1306_i2c model "SSD1306 72x40"; I²C di solito SDA GPIO5, SCL GPIO6 (da verificare); LED blu sul GPIO8',
    },
    c3oled: {
      ruolo: 'cpu', nome: 'ESP32-C3 con OLED 0,42" (versione 25 × 20,5 mm)', piattaforma: 'esp32',
      L: 25, W: 20.5, pcb: 1.2, hTop: 3.2,
      pines: [{ lato: 'S', n: 8, off: 1.5 }, { lato: 'N', n: 8, off: 1.5 }], usb: { tipo: 'usbc', y: 10.25 },
      finestra: { tipo: 'display', x0: 9.5, y0: 6.25, x1: 21.5, y1: 14.25 },
      fonte: '25 × 20,5 mm, OLED 0,42" 72 × 40 SSD1306, 16 piedini (espboards.dev)',
      stima: 'posizione e misura della finestra dell\'OLED (al centro verso il lato destro). Altre schede ESP32-C3 con OLED misurano 22,5 × 18 mm: controllale col calibro e, se servono, usa "Altra scheda"',
      dove: 'AliExpress e Amazon: "ESP32-C3 0.42 OLED" / "ESP32-C3 OLED 0.42 inch"',
      esphome: 'esp32: variant: esp32c3, board: esp32-c3-devkitm-1, framework esp-idf; display ssd1306_i2c model "SSD1306 72x40"',
    },
    // ---------------- sensori ----------------
    mpu6050: {
      ruolo: 'mod', nome: 'MPU6050 (GY-521) accelerometro e giroscopio',
      L: 20.5, W: 15.5, pcb: 1.6, hTop: 2.0, pines: [{ lato: 'N', n: 8, off: 1.5 }], i2c: ['0x68', '0x69'],
      fonte: '20,5 × 15,5 mm, due fori da 3,2 mm (openelab)',
      stima: 'altezza dei componenti e posizione dei piedini (fila da 8 sul lato lungo)',
      dove: 'Amazon e AliExpress: "GY-521 MPU6050"',
      esphome: 'sensor: platform: mpu6050 · I²C 0x68 (0x69 con AD0 a 3,3 V)',
    },
    bmi160: {
      ruolo: 'mod', nome: 'BMI160 (GY-BMI160) accelerometro e giroscopio',
      L: 12.8, W: 12.1, pcb: 1.2, hTop: 1.5, pines: [{ lato: 'N', n: 5, off: 1.3 }], i2c: ['0x68', '0x69'],
      fonte: '12,8 × 12,1 mm con un foro di fissaggio (Funduino)',
      stima: 'la misura: altri moduli GY-BMI160 sono più grandi e hanno 12 contatti in due file. Controllala col calibro prima di stampare, oppure usa "Altra scheda"',
      dove: 'Amazon e AliExpress: "GY-BMI160"',
      esphome: 'sensor: platform: bmi160 · I²C 0x68 (0x69 con SDO a 3,3 V)',
    },
    rc522: {
      ruolo: 'mod', nome: 'RC522 lettore RFID 13,56 MHz', bus: 'SPI',
      L: 60, W: 39, pcb: 1.6, hTop: 3.0, pines: [{ lato: 'W', n: 8, off: 2.0 }],
      fonte: '60 × 39 mm (diffuso), 60 × 40 mm (Electrokit)',
      stima: 'altezza dei componenti e distanza dei piedini dal bordo. L\'antenna è la spirale del circuito: legge a 2–3 cm attraverso il coperchio (2 mm di plastica vanno bene), non metterci sopra metallo',
      dove: 'Amazon e AliExpress: "RC522 RFID kit"',
      esphome: 'rc522_spi + binary_sensor: platform: rc522 · SPI (clk, miso, mosi, cs)',
    },
    veml7700: {
      ruolo: 'mod', nome: 'VEML7700 luce ambiente (lux)',
      L: 16.7, W: 16.7, pcb: 1.0, hTop: 1.5, pines: [{ lato: 'S', n: 5, off: 1.3 }], i2c: ['0x10'],
      finestra: { tipo: 'luce', cx: 8.35, cy: 9.5, d: 4 },
      fonte: '16,7 × 16,7 mm con 5 contatti a passo 2,54 (Funduino)',
      stima: 'posizione del sensore (al centro, un po\' verso il dietro) e altezza dei componenti',
      dove: 'Amazon e AliExpress: "VEML7700 sensore luce I2C"',
      esphome: 'sensor: platform: veml7700 · I²C 0x10',
    },
    ens160: {
      ruolo: 'mod', nome: 'ENS160 + AHT21 qualità dell\'aria, temperatura e umidità',
      L: 16, W: 11, pcb: 1.2, hTop: 1.8, pines: [{ lato: 'S', n: 4, off: 1.3 }], i2c: ['0x52', '0x53', '0x38'],
      finestra: { tipo: 'aria', cx: 8, cy: 6, w: 9, h: 6 },
      fonte: '16 × 11 mm con 4 contatti a passo 2,54 (domoticx)',
      stima: 'la misura (altri moduli ENS160 sono più grandi: controllala col calibro) e la posizione del sensore. Il sensore di gas ha bisogno d\'aria: il coperchio ha delle fessure. L\'AHT21 misura la temperatura vicino al processore, che scalda: i valori risultano più alti del vero',
      dove: 'Amazon e AliExpress: "ENS160 AHT21 sensore qualità aria"',
      esphome: 'sensor: platform: ens160_i2c · I²C 0x52 (0x53) · compensation con un sensore di temperatura e umidità (AHT21: componente aht10)',
    },
    // ---------------- display ----------------
    ssd1306: {
      ruolo: 'mod', nome: 'OLED SSD1306 0,96" 128 × 64 (I²C)',
      L: 27.3, W: 27.8, pcb: 1.0, hTop: 1.5, pines: [{ lato: 'S', n: 4, off: 1.5 }], i2c: ['0x3C'],
      finestra: { tipo: 'display', x0: 2.15, y0: 12.5, x1: 25.15, y1: 25.1 },
      fonte: '27,3 × 27,8 mm, area attiva 21,74 × 10,86 mm (zbotic)',
      stima: 'posizione dell\'area attiva sul modulo (a 12,5 mm dal bordo dei piedini) e altezza del vetro. Stampa prima il coperchio per controllare la finestra',
      dove: 'Amazon e AliExpress: "OLED 0.96 I2C SSD1306 128x64"',
      esphome: 'display: platform: ssd1306_i2c · model: SSD1306 128x64 · I²C 0x3C',
    },
    st7735: {
      ruolo: 'mod', nome: 'LCD TFT 1,8" 128 × 160 SPI (ST7735)', bus: 'SPI',
      L: 58, W: 34.5, pcb: 1.2, hTop: 3.0, pines: [{ lato: 'W', n: 8, off: 1.5 }],
      finestra: { tipo: 'display', x0: 16, y0: 3.2, x1: 51, y1: 31.3 },
      fonte: '34,5 × 58 mm, area attiva 35,04 × 28,03 mm, 8 piedini (Eckstein); il modulo è messo per traverso',
      stima: 'posizione dell\'area attiva (a 16 mm dal bordo dei piedini) e altezza del vetro. Stampa prima il coperchio per controllare la finestra',
      dove: 'Amazon e AliExpress: "1.8 inch TFT LCD ST7735 128x160 SPI"',
      esphome: 'display: platform: st7735 · model INITR_18BLACKTAB · SPI (cs, dc, reset); il componente verrà sostituito dal driver mipi_spi',
    },
    // ---------------- pannelli LED ----------------
    ws8x8: {
      ruolo: 'mod', nome: 'Pannello LED WS2812B 8 × 8 (64 pixel, rigido)', led: true,
      L: 65, W: 65, pcb: 1.6, hTop: 1.6, pines: [{ lato: 'W', n: 3, off: 2.5 }],
      finestra: { tipo: 'pannello', x0: 2, y0: 2, x1: 63, y1: 63 },
      fonte: '65 × 65 mm, 3 mm di spessore, passo 8 mm (tinkered.ai)',
      stima: 'altezza dei LED (1,6 mm) e posizione dei 3 fili (DIN, 5V, GND) sul lato sinistro',
      dove: 'Amazon e AliExpress: "WS2812B 8x8 matrice LED"',
      esphome: 'light: platform: esp32_rmt_led_strip (ESP32) oppure neopixelbus (ESP8266) · chipset WS2812',
    },
    ws16x16: {
      ruolo: 'mod', nome: 'Pannello LED WS2812B 16 × 16 (256 pixel, flessibile)', led: true,
      L: 160, W: 160, pcb: 1.0, hTop: 1.6, pines: [{ lato: 'W', n: 3, off: 2.5 }],
      finestra: { tipo: 'pannello', x0: 3, y0: 3, x1: 157, y1: 157 },
      fonte: '16 × 16 cm (Makerlab), passo 10 mm',
      stima: 'spessore e altezza dei LED. È flessibile: appoggiala su una piastra o incollala al coperchio con del biadesivo',
      dove: 'Amazon e AliExpress: "WS2812B 16x16 pannello flessibile"',
      esphome: 'light: platform: esp32_rmt_led_strip (ESP32) oppure neopixelbus (ESP8266) · chipset WS2812',
    },
    ws8x32: {
      ruolo: 'mod', nome: 'Pannello LED WS2812B 8 × 32 (256 pixel, flessibile)', led: true,
      L: 320, W: 80, pcb: 1.0, hTop: 1.6, pines: [{ lato: 'W', n: 3, off: 2.5 }],
      finestra: { tipo: 'pannello', x0: 3, y0: 3, x1: 317, y1: 77 },
      fonte: '8 × 32 cm (Makerlab), passo 10 mm',
      stima: 'spessore e altezza dei LED. È flessibile: appoggiala su una piastra o incollala al coperchio con del biadesivo',
      dove: 'Amazon e AliExpress: "WS2812B 8x32 pannello flessibile"',
      esphome: 'light: platform: esp32_rmt_led_strip (ESP32) oppure neopixelbus (ESP8266) · chipset WS2812',
    },
  };
  for (const k of Object.keys(SCHEDE)) SCHEDE[k].id = k;
  // LED singoli sul coperchio: foro, anello che tiene il LED, diametro dell'anello
  const LED = {
    led3: { nome: 'LED 3 mm', r: 1.6, anello: 3.5, h: 4.5 },     // h: corpo sopra il collarino (misure tipiche)
    led5: { nome: 'LED 5 mm', r: 2.6, anello: 4.3, h: 7.6 },
    led8: { nome: 'LED 8 mm', r: 4.1, anello: 6.0, h: 10.5 },
    diffuso: { nome: 'LED diffuso (luce che passa dal coperchio)', r: 4.0, anello: 0, pelle: 0.6 },
  };

  (root.SPRECOLO_EXT = root.SPRECOLO_EXT || []).push(function schede(H) {
    const { Manifold, CrossSection, reg, union, sub, box, rr, hullPts, slab, fmt } = H;
    const U = (list) => { list = list.filter(Boolean); return !list.length ? null : list.length === 1 ? list[0] : union(list); };
    const X = (a, b) => reg(a.intersect(b));
    const hull = (list) => reg(Manifold.hull(list.filter(Boolean)));
    const cylZ = (x, y, z0, z1, r0, r1, seg = 40) => reg(reg(Manifold.cylinder(z1 - z0, r0, r1 === undefined ? r0 : r1, seg)).translate([x, y, z0]));
    const cylX = (x0, x1, y, z, r, seg = 40) => reg(reg(reg(Manifold.cylinder(x1 - x0, r, r, seg)).rotate([0, 90, 0])).translate([x0, y, z]));
    const cylY = (x, z, y0, y1, r, seg = 40) => reg(reg(reg(Manifold.cylinder(y1 - y0, r, r, seg)).rotate([-90, 0, 0])).translate([x, y0, z]));
    // prisma a sezione rettangolare arrotondata: (u0,v0)-(u1,v1) nel piano perpendicolare all'asse, da t0 a t1 lungo l'asse
    function prism(axis, u0, v0, u1, v1, r, t0, t1) {
      r = Math.max(0.05, Math.min(r, (u1 - u0) / 2 - 0.01, (v1 - v0) / 2 - 0.01));
      const cs = reg(reg(reg(CrossSection.ofPolygons([[[u0 + r, v0 + r], [u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r]]])).offset(r, 'Round', 2, 24)));
      const e = reg(cs.extrude(t1 - t0));
      if (axis === 'z') return reg(e.translate([0, 0, t0]));
      if (axis === 'x') return reg(reg(e.rotate([90, 0, 90])).translate([t0, 0, 0]));
      return reg(reg(e.rotate([90, 0, 0])).translate([0, t1, 0]));   // y: (u, v) = (x, z)
    }
    // prisma da molti poligoni (in senso antiorario) nel piano (u, v), da t0 a t1 lungo l'asse: stesse convenzioni di prism()
    function polyPrism(axis, polys, t0, t1) {
      const e = reg(reg(CrossSection.ofPolygons(polys)).extrude(t1 - t0));
      if (axis === 'z') return reg(e.translate([0, 0, t0]));
      if (axis === 'x') return reg(reg(e.rotate([90, 0, 90])).translate([t0, 0, 0]));
      return reg(reg(e.rotate([90, 0, 0])).translate([0, t1, 0]));   // y: (u, v) = (x, z)
    }
    // apertura con smusso a 45° sulla faccia esterna
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

    function schede(p) {
      const info = [], notes = [];
      const w = p.pareti, f = p.fondo, tl = p.spCoperchio, g = p.gioco;
      const dv = p.vite === 'M2.5' ? 2.5 : 3;
      // viti stampate (M6, M8 o M10): colonnine più grosse, viti dal basso nel coperchio con boccole filettate
      const campana = p.chiusura === 'campana';   // base con le culle + campana (pareti e coperchio in un pezzo), viti da sotto la base
      const VT = H.vite, vm = p.viteTipo === 'stampata' ? VT.spec(p.viteM || 'M6') : null, vg = Math.max(0.1, +p.viteGioco || 0.3);
      const prP = vm ? vm.D / 2 + 2.5 : 0, pc = vm ? prP + 0.3 : 3.2, bossLen = vm ? Math.max(6, 1.5 * vm.D) : 0;
      // scheda personalizzata: misure scritte da chi la usa
      const custom = () => {
        const L = +p.altL, W = +p.altW, n = Math.max(1, Math.floor((L - 4) / DUP.passo));
        return {
          ruolo: 'cpu', nome: 'Altra scheda (le tue misure)', piattaforma: 'esp32',
          L, W, pcb: +p.altPcb, hTop: +p.altH,
          pines: p.altPiedini === 'lunghi' ? [{ lato: 'S', n, off: 1.5 }, { lato: 'N', n, off: 1.5 }] : p.altPiedini === 'corti' ? [{ lato: 'W', n: Math.max(1, Math.floor((W - 4) / DUP.passo)), off: 1.5 }] : [],
          usb: p.altUsb && p.altUsb !== 'nessuna' ? { tipo: p.altUsb, y: W / 2 } : null,
          fonte: `le tue misure: ${fmt(L)} × ${fmt(W)} mm`, stima: '', dove: '', esphome: '',
        };
      };
      const get = (id) => (id === 'altro' ? custom() : SCHEDE[id]);
      // scheda capovolta: montata con i componenti in giù (piedini in su se saldati sotto, in giù se saldati sopra)
      // (ribaltata attorno all'asse lungo: la USB resta a sinistra, il lato davanti e quello dietro si scambiano)
      const capoNotes = [];
      const mount = (b, v) => {
        // quattro montaggi: piedini saldati sotto o sopra (rispetto ai componenti) × scheda normale o capovolta
        //   sotto: componenti su, piedini giù · sopra: componenti su, piedini su
        //   capovolta (saldata sotto): componenti giù, piedini su · capovoltaSopra (saldata sopra): componenti giù, piedini giù
        // sotto il coperchio (solo moduli): torre dal fondo che porta la scheda a pochi mm dal coperchio (distanza scelta), piedini in giù
        if (v === 'coperchio' && b.ruolo !== 'cpu') return Object.assign({}, b, { su: false, lidM: true });
        const lidC = v === 'coperchioCapo' && b.ruolo !== 'cpu';   // sotto il coperchio e capovolta: saldata sopra, componenti e piedini in giù, il retro verso il coperchio
        if (v !== 'capovolta' && v !== 'capovoltaSopra' && !lidC) return Object.assign({}, b, { su: v === 'sopra' });
        const sw = { S: 'N', N: 'S', W: 'W', E: 'E' };
        if (b.finestra) capoNotes.push(`~${b.nome} capovolta: i componenti guardano il fondo, quindi niente finestra nel coperchio`);
        return Object.assign({}, b, { su: v === 'capovolta', capo: true, lidM: lidC || undefined, finestra: null, usb: b.usb ? Object.assign({}, b.usb, { y: b.W - b.usb.y }) : null,
          pines: b.pines.map(q => Object.assign({}, q, { lato: sw[q.lato] })) });
      };
      // moduli: la torre è aperta solo dal lato dei piedini; per averlo a destra o a sinistra il modulo si gira (di 90° o 180°)
      const giraMod = (b, to) => {
        const e0 = b.pines && b.pines[0] && b.pines[0].lato;
        if (!e0 || e0 === to) return Object.assign({}, b, { giro: 0 });
        const L = b.L, W = b.W;
        const R = { ccw: { m: { S: 'E', E: 'N', N: 'W', W: 'S' }, rev: { S: 0, E: 1, N: 0, W: 1 }, pt: (x, y) => [W - y, x], sw: true, deg: 90 },
          cw: { m: { S: 'W', W: 'N', N: 'E', E: 'S' }, rev: { S: 1, W: 0, N: 1, E: 0 }, pt: (x, y) => [y, L - x], sw: true, deg: -90 },
          half: { m: { S: 'N', N: 'S', E: 'W', W: 'E' }, rev: { S: 1, N: 1, E: 1, W: 1 }, pt: (x, y) => [L - x, W - y], sw: false, deg: 180 } };
        const k = Object.keys(R).find(q => R[q].m[e0] === to), r = R[k];
        const pines = b.pines.map(q => Object.assign({}, q, { lato: r.m[q.lato], c: r.rev[q.lato] ? 1 - (q.c === undefined ? 0.5 : q.c) : q.c }));
        let fin = b.finestra;
        if (fin) {
          if (fin.x0 !== undefined) { const a = r.pt(fin.x0, fin.y0), c = r.pt(fin.x1, fin.y1); fin = Object.assign({}, fin, { x0: Math.min(a[0], c[0]), y0: Math.min(a[1], c[1]), x1: Math.max(a[0], c[0]), y1: Math.max(a[1], c[1]) }); }
          else { const a = r.pt(fin.cx, fin.cy); fin = Object.assign({}, fin, { cx: a[0], cy: a[1] }, fin.w && r.sw ? { w: fin.h, h: fin.w } : {}); }
        }
        return Object.assign({}, b, { L: r.sw ? W : L, W: r.sw ? L : W, pines, finestra: fin, giro: r.deg });
      };
      const cavOf = (k) => Math.max(8, Math.min(45, +p[k + 'Cav'] || +p.cavita || 22));   // spazio sotto la scheda, per ogni scheda
      const cpu = Object.assign(mount(get(p.cpu) || SCHEDE.d1mini, p.cpuPin), { cav: cavOf('cpu') });
      const mods = [];
      for (let i = 1; i <= 5; i++) { const id = p['mod' + i]; if (id && id !== 'nessuno' && get(id)) mods.push(Object.assign(giraMod(get(id), ({ sx: 'W', su: 'N', giu: 'S' })[p['mod' + i + 'Apre']] || 'E'), { su: false, lidM: p['mod' + i + 'Cop'] === 'si' || undefined, slot: i, cav: cavOf('mod' + i) })); }   // moduli: sempre sulla torre, piedini in giù
      const items = [cpu, ...mods];
      const dupH = DUP.plastica + DUP.corpo;

      // ---- LED sul coperchio ----
      const LT = LED[p.ledTipo] || LED.led5;
      const nLed = Math.max(0, Math.min(4, p.ledN | 0));
      const stripF = nLed ? 2 * Math.max(LT.anello, LT.r) + 3.5 : 0;   // fascia libera davanti
      const lx0 = vm ? Math.max(13, pc + prP + LT.anello + 1) : 13;     // primo LED: lontano dalle colonnine

      // ---- disposizione: righe da sinistra a destra, il processore per primo ----
      const gap = Math.max(5, p.distanza);
      const ymF = Math.max(7.0, stripF, vm ? pc + prP + 2.4 : 0), ymB = Math.max(7.0, vm ? pc + prP + 2.4 : 0);   // con le boccole sotto il coperchio serve anche lo spessore del muretto delle culle (1,6 mm)     // davanti e dietro restano liberi gli angoli per le colonnine delle viti
      const xFirst = cpu.usb ? 0.2 : 2.5, xNext = 2.5;
      const place = [];
      let cx = xFirst, cy = ymF, rowH = 0, maxX = 0;
      for (const it of items) {
        const le = it.L + 2 * g, we = it.W + 2 * g;
        if (place.length && cx > xNext + 0.01 && cx + le + 2.5 > p.largMax) { cy += rowH + gap; cx = xNext; rowH = 0; }
        place.push({ it, px: cx, py: cy, le, we });
        cx += le + gap; rowH = Math.max(rowH, we); maxX = Math.max(maxX, cx - gap);
      }
      // posizione scelta con le frecce: spostamento in mm rispetto alla fila automatica (destra e su = verso il retro); a sinistra e davanti non si esce dal bordo
      place.forEach((pl, k) => {
        const o = (k === 0 ? p.cpuPos : p['mod' + pl.it.slot + 'Pos']) || [0, 0];
        pl.dx = +o[0] || 0; pl.dy = +o[1] || 0;
        pl.px = Math.max(k === 0 ? xFirst : xNext, pl.px + pl.dx);
        pl.py = Math.max(ymF, pl.py + pl.dy);
      });
      const Xin = Math.max(Math.max(...place.map(q => q.px + q.le)) + 2.5, 16, nLed ? 2 * lx0 + (nLed - 1) * 9 : 0, vm ? 4 * prP + 4 : 0);
      const Yin = Math.max(...place.map(q => q.py + q.we)) + ymB;

      // ---- altezze ----
      // piedini sotto: sotto la scheda il vano dei dupont; piedini sopra: i dupont salgono verso il coperchio (16,5 mm + 3 mm per la curva dei fili)
      const above = (it) => (it.capo ? (it.su ? dupH + 3 : 3) : it.su ? Math.max(it.hTop, dupH + 3) : it.hTop);   // capovolta con i piedini giù: sopra restano solo le punte saldate (3 mm)
      // capovolta: sotto il circuito ci stanno i componenti e la USB, più 1 mm d'aria
      const under = (it) => (!it.su ? it.cav : it.capo ? Math.max(it.hTop, it.usb ? CONN[it.usb.tipo].z1 : 0) + 1.0 : 1.5);
      const gapCop = Math.max(0.3, Math.min(8, +p.distCop || 1.5));
      const Hin = Math.max(...items.map(i => under(i) + i.pcb + above(i) + (i.lidM ? gapCop : 0.6)));
      const R = Math.min(p.raggio, w + 4.5), ri = Math.max(0.5, R - w);
      const Xo = Xin + 2 * w, Yo = Yin + 2 * w, Zw = f + Hin, Htot = Zw + tl;
      const ox = w, oy = w;
      // ogni scheda sta alla sua altezza: sul fondo più il suo spazio sotto; quelle "sotto il coperchio" alla distanza scelta dal coperchio
      const zbOf = (it) => (it.lidM ? Zw - gapCop - above(it) - it.pcb : f + under(it));   // sotto il coperchio: i componenti arrivano alla distanza scelta       // faccia di sotto della scheda: i componenti più alti arrivano a 0,6 mm dal coperchio

      const S = shell(Xo, Yo, R, Htot, Math.min(1.2, f * 0.75), 0.8);
      const cuts = [slab(Xin, Yin, ri, f, Htot + 1, ox + Xin / 2, oy + Yin / 2)];
      const adds = [], lidCuts = [], lidAdds = [], ghost = [];
      const lip0 = 1.2, ft = 1.6, gOut = g;            // sotto la scheda 1,2 mm, fuori 1,6 mm di muretto

      // ---- culle ----
      for (const pl of place) {
        const it = pl.it, L = it.L, Wd = it.W;
        const bx = ox + pl.px + g, by = oy + pl.py + g, zb = zbOf(it), zt = zb + it.pcb;
        const pinEdges = new Set(it.su ? [] : it.pines.map(q => q.lato));
        const pegS = [];   // dentini fuori dal bordo con i piedini: non si tagliano con i vani dei dupont (resterebbero sospesi)
        const solids = [], keeps = [], lip = it.capo ? 0.8 : lip0;   // capovolta: sotto il bordo ci sono i componenti, il muretto entra solo 0,8 mm
        const longOf = (e) => (e === 'S' || e === 'N' ? L : Wd);
        // vani dei connettori dupont: niente muretti dove stanno i piedini
        for (const q of (it.su ? [] : it.pines)) {
          const half = q.n * DUP.passo / 2 + 0.3, len = longOf(q.lato), c = (q.c === undefined ? 0.5 : q.c) * len, dep = q.off + 1.5;
          if (q.lato === 'S') keeps.push(box(bx + c - half, by - gOut - ft - 1, f - 1, bx + c + half, by + dep, zb + 0.01));
          if (q.lato === 'N') keeps.push(box(bx + c - half, by + Wd - dep, f - 1, bx + c + half, by + Wd + gOut + ft + 1, zb + 0.01));
          if (q.lato === 'W') keeps.push(box(bx - gOut - ft - 1, by + c - half, f - 1, bx + dep, by + c + half, zb + 0.01));
          if (q.lato === 'E') keeps.push(box(bx + L - dep, by + c - half, f - 1, bx + L + gOut + ft + 1, by + c + half, zb + 0.01));
        }
        const wall = (e, a0, a1, fence) => {
          if (e === 'S') { solids.push(box(bx + a0, by - gOut - ft, f - 0.01, bx + a1, by + lip, zb)); if (fence) solids.push(box(bx + a0, by - gOut - ft, zb - 0.01, bx + a1, by - gOut, zb + it.pcb)); }
          if (e === 'N') { solids.push(box(bx + a0, by + Wd - lip, f - 0.01, bx + a1, by + Wd + gOut + ft, zb)); if (fence) solids.push(box(bx + a0, by + Wd + gOut, zb - 0.01, bx + a1, by + Wd + gOut + ft, zb + it.pcb)); }
          if (e === 'W') { solids.push(box(bx - gOut - ft, by + a0, f - 0.01, bx + lip, by + a1, zb)); if (fence) solids.push(box(bx - gOut - ft, by + a0, zb - 0.01, bx - gOut, by + a1, zb + it.pcb)); }
          if (e === 'E') { solids.push(box(bx + L - lip, by + a0, f - 0.01, bx + L + gOut + ft, by + a1, zb)); if (fence) solids.push(box(bx + L + gOut, by + a0, zb - 0.01, bx + L + gOut + ft, by + a1, zb + it.pcb)); }
        };
        for (const e of ['S', 'N', 'W', 'E']) {
          const len = longOf(e);
          if (!pinEdges.has(e)) wall(e, 0, len, !(e === 'W' && it.usb));       // muretto sotto e contorno attorno alla scheda
          else {                                                               // bordo con i piedini: due dentini fuori dalla scheda, alle estremità
            const pl5 = Math.min(5, len / 3);
            const pegs = (a0, a1) => {
              if (e === 'S') pegS.push(box(bx + a0, by - gOut - ft, f - 0.01, bx + a1, by - gOut, zb + it.pcb));
              if (e === 'N') pegS.push(box(bx + a0, by + Wd + gOut, f - 0.01, bx + a1, by + Wd + gOut + ft, zb + it.pcb));
              if (e === 'W') pegS.push(box(bx - gOut - ft, by + a0, f - 0.01, bx - gOut, by + a1, zb + it.pcb));
              if (e === 'E') pegS.push(box(bx + L + gOut, by + a0, f - 0.01, bx + L + gOut + ft, by + a1, zb + it.pcb));
            };
            pegs(0.8, 0.8 + pl5); pegs(len - 0.8 - pl5, len - 0.8);
          }
        }
        let cr = U(solids);
        if (cr && keeps.length) cr = sub(cr, U(keeps));
        if (cr) adds.push(cr);
        if (pegS.length) adds.push(U(pegS));

        // ---- USB del processore: apertura nella parete sinistra, con l'incavo per la spina ----
        if (it.usb && pl === place[0]) {
          const c = CONN[it.usb.tipo], g2 = 0.6, cyc = by + it.usb.y;
          const hw = c.w / 2 + g2, z0 = it.capo ? zb - c.z1 - g2 : zt + c.z0 - g2, z1 = it.capo ? zb - c.z0 + g2 : zt + c.z1 + g2, zc = (z0 + z1) / 2;
          cuts.push(opening('x', cyc - hw, z0, cyc + hw, z1, 0.8, -1, Math.max(w + 0.5, bx + 0.5), 0.6, 't0'));
          const sw = Math.max(c.spina[0], 2 * hw) / 2 + 0.4, sh = Math.max(c.spina[1], z1 - z0) / 2 + 0.4;
          if (w > 1.4) {
            const xr = Math.max(w - 1.0, bx - 1.5);       // se il processore è lontano dalla parete l'incavo arriva fino alla scheda
            const rec = opening('x', cyc - sw, Math.max(f + 0.6, zc - sh), cyc + sw, Math.min(Zw - 0.8, zc + sh), 1.6, -1, xr, 0.6, 't0');
            cuts.push(rec);
            pl.recesso = it.capo ? box(-2, cyc - sw, z0 - 1, bx + 7, cyc + sw, zt + 12) : box(-2, cyc - sw, zb - 8, xr, cyc + sw, zb + 12);   // capovolta: la USB sta sotto il bordo, il muretto lì non c'è   // il muretto non riempie l'incavo
          } else if (it.capo) pl.recesso = box(-2, cyc - sw, z0 - 1, bx + 7, cyc + sw, zt + 12);   // parete sottile: niente incavo, ma sotto il bordo il muretto va tolto lo stesso
        }
        // ---- ESP32-CAM con antenna esterna: foro per il connettore SMA da pannello nella parete sinistra ----
        if ((it.id === 'esp32cam' || it.id === 'esp32cammb') && p.antenna === 'esterna' && pl === place[0]) {
          const za = Math.min(Zw - 5, Math.max(f + 4, zt + 5));
          cuts.push(cylX(-1, w + 1, by + Wd / 2, za, 3.3, 40));
        }
        // ---- finestre nel coperchio ----
        const fin = it.finestra, m = p.margineFin;
        if (fin) {
          if (fin.tipo === 'display') {
            lidCuts.push(opening('z', bx + fin.x0 - m, by + fin.y0 - m, bx + fin.x1 + m, by + fin.y1 + m, 1, Zw - 1, Htot + 1, tl * 0.7, 't1'));
          } else if (fin.tipo === 'pannello') {
            if (p.pannelloFin === 'aperto') lidCuts.push(opening('z', bx + fin.x0, by + fin.y0, bx + fin.x1, by + fin.y1, 1.5, Zw - 1, Htot + 1, 0.4, 't1'));
            else lidCuts.push(prism('z', bx + fin.x0, by + fin.y0, bx + fin.x1, by + fin.y1, 1.5, Zw - 1, Htot - 0.6));   // resta una pelle da 0,6 mm: la luce passa
          } else if (fin.tipo === 'luce') {
            const r = Math.max(2.5, fin.d / 2 + m);
            if (p.finLuce === 'sottile') lidCuts.push(cylZ(bx + fin.cx, by + fin.cy, Zw - 1, Htot - 0.6, r + 0.5, r + 0.5, 40));
            else lidCuts.push(cylZ(bx + fin.cx, by + fin.cy, Zw - 1, Htot + 1, r, r, 40), cylZ(bx + fin.cx, by + fin.cy, Htot - 0.5, Htot + 0.6, r, r + 1.1, 40));
          } else if (fin.tipo === 'camera') {
            const r = fin.d / 2 + m;
            lidCuts.push(cylZ(bx + fin.cx, by + fin.cy, Zw - 1, Htot + 1, r, r, 48), cylZ(bx + fin.cx, by + fin.cy, Htot - 0.8, Htot + 0.8, r, r + 1.6, 48));
          } else if (fin.tipo === 'aria') {
            // fessure lunghe in y, per far passare l'aria al sensore di gas
            const ns = 3, pitch = 3.2;
            for (let k = 0; k < ns; k++) {
              const xx = bx + fin.cx + (k - (ns - 1) / 2) * pitch;
              lidCuts.push(prism('z', xx - 0.8, by + fin.cy - fin.h / 2 - m, xx + 0.8, by + fin.cy + fin.h / 2 + m, 0.7, Zw - 1, Htot + 1));
            }
          }
        }
        // ---- esempio (solo anteprima): circuito, componenti, header e connettori dupont ----
        ghost.push(box(bx, by, zb, bx + L, by + Wd, zt));
        ghost.push(it.capo ? box(bx + 1.2, by + 1.2, zb - it.hTop, bx + L - 1.2, by + Wd - 1.2, zb) : box(bx + 1.2, by + 1.2, zt, bx + L - 1.2, by + Wd - 1.2, zt + it.hTop));
        for (const q of it.pines) {
          const half = q.n * DUP.passo / 2, len = longOf(q.lato), c = (q.c === undefined ? 0.5 : q.c) * len, hw = 1.3;
          const gz0 = it.su ? zt : Math.max(f + 0.05, zb - dupH), gz1 = it.su ? zt + dupH : zb;   // con poco spazio sotto il dupont dritto non ci sta: l'esempio si ferma sul fondo
          if (q.lato === 'S') ghost.push(box(bx + c - half, by + q.off - hw, gz0, bx + c + half, by + q.off + hw, gz1));
          if (q.lato === 'N') ghost.push(box(bx + c - half, by + Wd - q.off - hw, gz0, bx + c + half, by + Wd - q.off + hw, gz1));
          if (q.lato === 'W') ghost.push(box(bx + q.off - hw, by + c - half, gz0, bx + q.off + hw, by + c + half, gz1));
          if (q.lato === 'E') ghost.push(box(bx + L - q.off - hw, by + c - half, gz0, bx + L - q.off + hw, by + c + half, gz1));
        }
        if (it.usb && pl === place[0]) { const c = CONN[it.usb.tipo]; ghost.push(it.capo ? box(bx - 0.8, by + it.usb.y - c.w / 2, zb - c.z1, bx + 4, by + it.usb.y + c.w / 2, zb - Math.max(0, c.z0)) : box(bx - 0.8, by + it.usb.y - c.w / 2, zt + Math.max(0, c.z0), bx + 4, by + it.usb.y + c.w / 2, zt + c.z1)); }
      }
      // gli incavi per le spine tolgono il muretto
      const recessi = place.map(pl => pl.recesso).filter(Boolean);
      const addsClean = adds.filter(Boolean).map(a => (recessi.length ? sub(a, U(recessi)) : a));

      // ---- colonnine delle viti ai quattro angoli ----
      const pr = vm ? prP : dv + 0.4, postXY = [[ox + pc, oy + pc], [ox + Xin - pc, oy + pc], [ox + pc, oy + Yin - pc], [ox + Xin - pc, oy + Yin - pc]];
      const posts = postXY.map(([x, y]) => cylZ(x, y, f - 0.01, vm ? Zw - bossLen - 0.2 : Zw, pr, pr, 40));
      const pilot = vm ? [] : postXY.map(([x, y]) => cylZ(x, y, Zw - 12, Zw + 0.1, dv === 3 ? 1.3 : 1.05, dv === 3 ? 1.3 : 1.05, 24));
      // viti stampate: foro passante con svasatura sotto il fondo, la testa resta a filo
      const postHoles = [];
      if (vm) for (const [x, y] of postXY) { const rh = (vm.D + 0.8) / 2, r0 = vm.D + 0.5; postHoles.push(cylZ(x, y, -1, Zw + 0.1, rh, rh, 32), cylZ(x, y, -0.01, r0 - rh, r0, rh, 40)); }
      // passacavi sulla parete dietro, nel vano sotto le schede
      const nCav = Math.max(0, Math.min(3, p.passacavi | 0)), cavR = p.cavoD / 2;
      const zCav = items.every(q => q.su) ? Math.max(f + cavR + 1.5, Zw - cavR - 4) : Math.max(f + cavR + 1.5, f + Math.min(Math.min(...items.filter(q => !q.su).map(q => q.cav)), 20) / 2);   // con i piedini tutti sopra i fili stanno in alto
      for (let i = 0; i < nCav; i++) {
        const xx = ox + 12 + (nCav === 1 ? (Xin - 24) / 2 : i * (Xin - 24) / (nCav - 1));
        cuts.push(cylY(xx, zCav, Yo - w - 1, Yo + 1, cavR, 40));
      }


      // ---- prese d'aria: fessure, fori o esagoni su coperchio, fondo e pareti ----
      const ariaTxt = [];
      const tipoA = p.ariaTipo || 'nessuna';
      if (tipoA !== 'nessuna') {
        const D = Math.max(1.6, +p.ariaD), gp = Math.max(1, +p.ariaGap), Ls = Math.max(D, +p.ariaL), mA = Math.max(3, +p.ariaMargine);
        const polyArea = (q) => { let a = 0; for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; a += x0 * y1 - x1 * y0; } return Math.abs(a) / 2; };
        const hit = (rects) => (u0, v0, u1, v1) => rects.some(r => u0 < r[2] && u1 > r[0] && v0 < r[3] && v1 > r[1]);
        // celle dentro il rettangolo (U0,V0)-(U1,V1); blocked() scarta quelle che toccano finestre, viti, passacavi
        const cellsIn = (U0, V0, U1, V1, blocked) => {
          const out = []; let area = 0;
          const put = (pts, bb) => { if (blocked && blocked(bb[0], bb[1], bb[2], bb[3])) return; out.push(pts); area += polyArea(pts); };
          if (U1 - U0 < D || V1 - V0 < D) return { out, area };
          if (tipoA === 'fessure') {
            const pitch = D + gp, nC = Math.floor((U1 - U0 + gp) / pitch), len = Math.min(Ls, V1 - V0), c = D * 0.3;
            if (nC < 1) return { out, area };
            const nR = Math.max(1, Math.floor((V1 - V0 + gp) / (len + gp)));
            const u00 = (U0 + U1) / 2 - ((nC - 1) * pitch) / 2, v00 = (V0 + V1) / 2 - ((nR - 1) * (len + gp)) / 2;
            for (let i = 0; i < nC; i++) for (let j = 0; j < nR; j++) {
              const u = u00 + i * pitch, v = v00 + j * (len + gp), a = D / 2, b = len / 2;
              put([[u - a + c, v - b], [u + a - c, v - b], [u + a, v - b + c], [u + a, v + b - c], [u + a - c, v + b], [u - a + c, v + b], [u - a, v + b - c], [u - a, v - b + c]], [u - a, v - b, u + a, v + b]);
            }
          } else {
            const hex = tipoA === 'esagoni', hu = hex ? D / Math.sqrt(3) : D / 2, hv = D / 2;
            const dd = D + gp, du = 0.866 * dd, dvv = dd;
            const nU = Math.floor((U1 - U0 - 2 * hu) / du) + 1, nV = Math.floor((V1 - V0 - 2 * hv - dvv / 2) / dvv) + 1;
            if (nU < 1 || nV < 1) return { out, area };
            const u00 = (U0 + U1) / 2 - ((nU - 1) * du) / 2, v00 = (V0 + V1) / 2 - ((nV - 1) * dvv + dvv / 2) / 2;
            const n = hex ? 6 : 20;
            for (let i = 0; i < nU; i++) for (let j = 0; j < nV; j++) {
              const u = u00 + i * du, v = v00 + j * dvv + (i % 2) * dvv / 2, pts = [];
              for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n; pts.push([u + hu * Math.cos(a), v + hu * Math.sin(a)]); }
              put(pts, [u - hu, v - hv, u + hu, v + hv]);
            }
          }
          return { out, area };
        };
        const cuadro = (r, q) => [Math.max(r[0], q[0]), Math.max(r[1], q[1]), Math.min(r[2], q[2]), Math.min(r[3], q[3])];
        const rectOf = (pl) => [ox + pl.px + g, oy + pl.py + g, ox + pl.px + g + pl.it.L, oy + pl.py + g + pl.it.W];
        const regioni = (modo, tot) => modo === 'processore' ? [cuadro(rectOf(place[0]), tot)] : modo === 'moduli' ? place.slice(1).map(q => cuadro(rectOf(q), tot)) : modo === 'schede' ? place.map(q => cuadro(rectOf(q), tot)) : [tot];
        const viteRects = (rr) => postXY.map(([x, y]) => [x - rr, y - rr, x + rr, y + rr]);
        const report = (nome, res) => { if (res.area > 0) ariaTxt.push(`${nome} ${fmt(res.area / 100)} cm²`); else ariaTxt.push(`${nome}: niente (non c'è spazio libero)`); };
        const unisci = (liste) => ({ out: liste.flatMap(l => l.out), area: liste.reduce((a, l) => a + l.area, 0) });

        // coperchio: salta finestre, fascia dei LED e viti
        if (p.ariaCop && p.ariaCop !== 'no') {
          const ex = viteRects(Math.max(7, pr + 3));
          if (nLed) ex.push([ox, oy, ox + Xin, oy + stripF + 1]);
          for (const pl of place) {
            const fin = pl.it.finestra; if (!fin) continue;
            const bx = ox + pl.px + g, by = oy + pl.py + g, m = p.margineFin + 2.5;
            if (fin.tipo === 'display') ex.push([bx + fin.x0 - m, by + fin.y0 - m, bx + fin.x1 + m, by + fin.y1 + m]);
            else if (fin.tipo === 'pannello') ex.push([bx + fin.x0 - 2, by + fin.y0 - 2, bx + fin.x1 + 2, by + fin.y1 + 2]);
            else if (fin.tipo === 'aria') ex.push([bx + fin.cx - 6, by + fin.cy - fin.h / 2 - m, bx + fin.cx + 6, by + fin.cy + fin.h / 2 + m]);
            else { const r = Math.max(2.5, fin.d / 2 + p.margineFin) + 3.5; ex.push([bx + fin.cx - r, by + fin.cy - r, bx + fin.cx + r, by + fin.cy + r]); }
          }
          const res = unisci(regioni(p.ariaCop, [ox + mA, oy + mA, ox + Xin - mA, oy + Yin - mA]).map(r => cellsIn(r[0], r[1], r[2], r[3], hit(ex))));
          if (res.out.length) lidCuts.push(polyPrism('z', res.out, Zw - 1, Htot + 1));
          report('coperchio', res);
        }
        // fondo: salta le colonnine delle viti
        if (p.ariaFondo && p.ariaFondo !== 'no') {
          const ex = viteRects(pr + 3);
          const res = unisci(regioni(p.ariaFondo, [ox + mA, oy + mA, ox + Xin - mA, oy + Yin - mA]).map(r => cellsIn(r[0], r[1], r[2], r[3], hit(ex))));
          if (res.out.length) cuts.push(polyPrism('z', res.out, -2, f + 0.02));
          report('fondo', res);
        }
        // pareti: altezza della zona con le fessure
        const zA = f + 3, zB = Zw - 3, HZ = Math.max(D, Math.min(+p.ariaAlt, zB - zA));
        const zona = (modo) => modo === 'alto' ? [zB - HZ, zB] : modo === 'basso' ? [zA, zA + HZ] : modo === 'centro' ? [(zA + zB - HZ) / 2, (zA + zB + HZ) / 2] : [zA, zB];
        const mw = Math.max(mA, pr + 4.5);
        const cavRects = [];
        for (let i = 0; i < nCav; i++) { const xx = ox + 12 + (nCav === 1 ? (Xin - 24) / 2 : i * (Xin - 24) / (nCav - 1)); cavRects.push([xx - cavR - 2, zCav - cavR - 2, xx + cavR + 2, zCav + cavR + 2]); }
        const sideRects = [];
        {
          const p0 = place[0], by0 = oy + p0.py + g;
          if (cpu.usb) { const c = CONN[cpu.usb.tipo]; sideRects.push([by0 + cpu.usb.y - c.w / 2 - 5, -1e3, by0 + cpu.usb.y + c.w / 2 + 5, 1e3]); }
          if ((cpu.id === 'esp32cam' || cpu.id === 'esp32cammb') && p.antenna === 'esterna') sideRects.push([by0 + cpu.W / 2 - 8, -1e3, by0 + cpu.W / 2 + 8, 1e3]);
        }
        const parete = (modo, nome, axis, u0, u1, t0, t1, ex) => {
          if (!modo || modo === 'no') return;
          const [z0, z1] = zona(modo);
          const res = cellsIn(u0, z0, u1, z1, ex && ex.length ? hit(ex) : null);
          if (res.out.length) cuts.push(polyPrism(axis, res.out, t0, t1));
          report(nome, res);
        };
        parete(p.ariaDietro, 'parete dietro', 'y', ox + mw, ox + Xin - mw, Yo - w - 1, Yo + 1, cavRects);
        parete(p.ariaDavanti, 'parete davanti', 'y', ox + mw, ox + Xin - mw, -1, w + 1, null);
        parete(p.ariaDestra, 'parete destra', 'x', oy + mw, oy + Yin - mw, Xo - w - 1, Xo + 1, null);
        parete(p.ariaSinistra, 'parete sinistra', 'x', oy + mw, oy + Yin - mw, -1, w + 1, sideRects);
      }


      // ---- supporto a sfera per la camera (giunto a scatto come nei progetti per ESP32-CAM più scaricati) ----
      // una sfera si avvita sotto il fondo; lo snodo a scatto ha la base per parete (viti), magnete o treppiede 1/4"
      const bossAdds = [], bossCuts = [];
      // una vite filettata combacia con il suo foro solo a certe rotazioni: provo 16 angoli e prendo il migliore
      // (provo solo su una fetta alta 3 passi: il filetto è un'elica, la fase si vede già lì e le intersezioni sono molto più veloci)
      // la fetta si ritaglia una volta sola; ruotarla attorno a z dà lo stesso risultato che ruotare la vite prima di capovolgerla (con angolo opposto)
      const turnBest = (mk, tgt, z0, z1, flipped) => {
        const crop = (m) => (z1 === undefined ? m : X(m, box(-60, -60, z0, 60, 60, z1)));
        const t = crop(tgt), s0 = crop(mk(0)); let best = null;
        for (let k = 0; k < 16; k++) { const vol = X(reg(s0.rotate([0, 0, (flipped ? -1 : 1) * k * 22.5])), t).volume(); if (!best || vol < best.vol) best = { th: k * 22.5, vol }; }
        return best.th;
      };
      let ballScrewAsm = null, ballScrewP = null, ballScrewL = 0;
      let ballM = null, sockM = null, ballP = null, sockP = null, ballTop = 0, sockLift = 0, ballXY = [0, 0];
      const supN = [];
      const sup = p.supporto || 'nessuno';
      if (sup !== 'nessuno') {
        const R = Math.max(5, Math.min(10, (+p.sfera || 14) / 2));
        const bo = p.spPos || [0, 0];
        const hs = vm ? Math.max(8, vm.D + 4) : 8, brR = vm ? vm.D + 1.5 : 4.5, brM = brR + 1.5, bh = vm ? vm.D / 2 + 1 : 3;
        // zone dei dupont sotto i piedini: la sfera parte dal punto libero più vicino al centro, poi si sposta con le frecce
        const dupRects = [];
        for (const pl of place) {
          if (pl.it.su) continue;
          const bx = ox + pl.px + g, by = oy + pl.py + g, it = pl.it;
          for (const q of it.pines) {
            const half = q.n * DUP.passo / 2 + 3, len = (q.lato === 'S' || q.lato === 'N' ? it.L : it.W), c = (q.c === undefined ? 0.5 : q.c) * len;
            dupRects.push({ pl, r: q.lato === 'S' ? [bx + c - half, by + q.off - 4, bx + c + half, by + q.off + 4] : q.lato === 'N' ? [bx + c - half, by + it.W - q.off - 4, bx + c + half, by + it.W - q.off + 4]
              : q.lato === 'W' ? [bx + q.off - 4, by + c - half, bx + q.off + 4, by + c + half] : [bx + it.L - q.off - 4, by + c - half, bx + it.L - q.off + 4, by + c + half] });
          }
        }
        const urta = (x, y) => dupRects.find(d => x + hs + brM > d.r[0] && x - hs - brM < d.r[2] && y + brM > d.r[1] && y - brM < d.r[3]);
        let ax = ox + Xin / 2, ay = oy + Yin / 2;
        if (urta(ax, ay)) {
          let best = null;
          for (let dx = -60; dx <= 60; dx += 2) for (let dy = -40; dy <= 40; dy += 2) {
            const x = ox + Xin / 2 + dx, y = oy + Yin / 2 + dy;
            if (x - hs - brM < ox + 2 || x + hs + brM > ox + Xin - 2 || y - brM < oy + 2 || y + brM > oy + Yin - 2 || urta(x, y)) continue;
            const d = Math.hypot(dx, dy); if (!best || d < best.d) best = { d, x, y };
          }
          if (best) { ax = best.x; ay = best.y; }
        }
        const tx = ax + (+bo[0] || 0), ty = ay + (+bo[1] || 0);
        // sul fondo: due rialzi con foro svasato per le viti M3 della flangia
        for (const sx of [-hs, hs]) {
          bossAdds.push(cylZ(tx + sx, ty, f - 0.01, f + bh, brR, brR, 40));
          if (vm) { const rh = (vm.D + 0.8) / 2, r0 = vm.D + 0.5; bossCuts.push(cylZ(tx + sx, ty, -1, f + bh + 0.1, rh, rh, 32), cylZ(tx + sx, ty, f + bh - (r0 - rh), f + bh + 0.01, rh, r0, 40)); }
          else bossCuts.push(cylZ(tx + sx, ty, -1, f + bh + 0.1, 1.7, 1.7, 24), cylZ(tx + sx, ty, f + 1.3, f + bh + 0.01, 1.7, 3.4, 24));
        }
        // sfera: flangia Ø 26, gambo Ø 7, cono a 45° e sfera tagliata in alto: si stampa senza supporti
        const rz = 0.707 * R, fl = vm ? Math.max(5, 1.4 * vm.D + 1) : 5, FR = Math.max(13, hs + 5), rs = 3.5, z1 = fl + 8, z2 = z1 + Math.max(0.5, rz - rs), zc = z2 + rz;
        const sph = reg(reg(Manifold.sphere(R, 64)).translate([0, 0, zc]));
        const ballS = X(sph, box(-R - 1, -R - 1, zc - R - 1, R + 1, R + 1, zc + rz));
        const cone = reg(reg(Manifold.cylinder(z2 - z1, rs, Math.max(rs + 0.1, rz), 48)).translate([0, 0, z1]));
        let ball = U([cylZ(0, 0, 0, fl, FR, FR, 64), cylZ(0, 0, fl - 0.01, z1 + 0.01, rs, rs, 40), cone, ballS]);
        ball = sub(ball, U([-hs, hs].map(sx => (vm ? reg(VT.hole(p.viteM, fl - 0.8, vg, true).translate([sx, 0, 0])) : cylZ(sx, 0, -0.5, 4.4, 1.3, 1.3, 20)))));
        ballP = ball; ballTop = zc + rz;
        ballM = reg(reg(ball.rotate([180, 0, 0])).translate([tx, ty, 0]));   // montata: la sfera pende sotto il fondo
        if (vm) {   // viti stampate per la flangia: dentro la scatola, testa a filo del rialzo
          const sc = VT.screw(p.viteM, Math.floor((f + bh + fl - 1.0) * 2) / 2, vg, 'taglio');
          const tg = sub(cylZ(0, 0, 0, fl, FR, FR, 48), reg(VT.hole(p.viteM, fl - 0.8, vg, true)));
          const mkS = (th) => reg(reg(sc.m.rotate([0, 0, th])).translate([0, 0, f + bh - sc.L]));
          const thB = turnBest(mkS, reg(tg.translate([0, 0, 0])));
          const put = (x) => reg(reg(sc.m.rotate([0, 0, thB])).translate([x, ty, f + bh - sc.L]));
          ballScrewAsm = U([put(tx - hs), put(tx + hs)]);
          ballScrewP = U([sc.print, reg(sc.print.translate([2 * vm.D + 3, 0, 0]))]);
          ballScrewL = sc.L;
        }
        // snodo: coppa a scatto con 4 tagli, sopra una base
        const Rc = R + 0.1, ro = 0.87 * R, hl = Math.sqrt(Rc * Rc - ro * ro), Ro = R + 5;
        let hb, base, baseCuts = [];
        if (sup === 'parete') {
          hb = 3; const hx = Ro + 5.5, hw = Math.max(14, Ro + 2);
          base = prism('z', -(hx + 5), -hw, hx + 5, hw, 5, 0, hb);
          for (const sx of [-hx, hx]) baseCuts.push(cylZ(sx, 0, -1, hb + 0.1, 1.7, 1.7, 24), cylZ(sx, 0, hb - 1.7, hb + 0.01, 1.7, 3.4, 24));
        } else if (sup === 'magnete') {
          const md = p.magnete === '8x2' ? 8 : 10, mt = 2;
          hb = mt + 1.4; base = cylZ(0, 0, 0, hb, Math.max(Ro, md / 2 + 3), Math.max(Ro, md / 2 + 3), 64);
          baseCuts.push(cylZ(0, 0, -0.5, mt + 0.3, md / 2 + 0.1, md / 2 + 0.1, 40));
        } else {
          hb = 8; base = cylZ(0, 0, 0, hb, 17, 17, 64);
          baseCuts.push(cylZ(0, 0, -0.5, 6.4, 11.4 / Math.sqrt(3), 11.4 / Math.sqrt(3), 6));
        }
        const zcs = hb + 1.2 + Rc, zTop = zcs + hl + 2.5;
        let sock = U([base, cylZ(0, 0, hb - 0.01, zTop, Ro, Ro, 64)]);
        const cav = [reg(reg(Manifold.sphere(Rc, 64)).translate([0, 0, zcs])), cylZ(0, 0, zcs, zTop + 1, ro, ro, 64), cylZ(0, 0, zTop - 2, zTop + 0.01, ro, ro + 2, 64),
          box(-0.6, -Ro - 1, zcs - 0.2 * R, 0.6, Ro + 1, zTop + 1), box(-Ro - 1, -0.6, zcs - 0.2 * R, Ro + 1, 0.6, zTop + 1)];
        sock = sub(sock, U([...cav, ...baseCuts]));
        sockP = sock; sockLift = zc + zcs;
        sockM = reg(reg(sock.translate([0, 0, -sockLift])).translate([tx, ty, 0]));
        ballXY = [tx, ty];
        supN.push(`sfera Ø ${fmt(2 * R)} mm (pezzo "Sfera") avvitata sotto il fondo con due viti ${vm ? vm.name + ' stampate (pezzo "Viti sfera")' : 'M3 svasate da 8 mm'} (a ${fmt(tx - ox)} mm da sinistra, ${fmt(ty - oy)} mm dal fronte), che entrano nella flangia da ${fmt(fl)} mm; poi si spinge nello snodo fino allo scatto`);
        supN.push(sup === 'parete' ? 'snodo a parete: due viti M3 a testa svasata per fissarlo' : sup === 'magnete' ? `snodo magnetico: sede per un magnete ${p.magnete === '8x2' ? '8 × 2' : '10 × 2'} mm dal lato della base (incollalo)` : 'snodo per treppiede: sede esagonale per un dado 1/4"-20 dal lato della base (11,4 mm tra i lati piani, 6,4 mm profonda)');
        { const h = urta(tx, ty); if (h) notes.push('Supporto: i rialzi per le viti della sfera cadono sotto i dupont di ' + (h.pl === place[0] ? 'il processore' : 'un modulo') + ': spostali con le frecce'); }
        notes.push('~Supporto: la sfera entra nello snodo con una spinta decisa (la coppa ha 4 tagli che si aprono): stampa lo snodo in PETG con 4 pareti. L\'inclinazione è limitata dalla larghezza della scatola: più è larga, prima tocca lo snodo.');
      }

      let box0 = X(S, box(-1, -1, -1, Xo + 1, Yo + 1, Zw));
      box0 = sub(box0, U(cuts));
      box0 = U([box0, ...addsClean, ...posts, ...bossAdds]);
      box0 = X(box0, S);   // con pareti sottili le culle contro la parete non devono uscire fuori
      box0 = sub(box0, U([...pilot, ...postHoles, ...bossCuts]));

      // ---- coperchio ----
      let lid = X(S, box(-1, -1, Zw + 0.01, Xo + 1, Yo + 1, Htot + 1));
      // LED: fori allineati sulla fascia davanti, con un anello sotto il coperchio che tiene il LED
      const ledXY = [];
      for (let i = 0; i < nLed; i++) ledXY.push([ox + (nLed === 1 ? Xin / 2 : lx0 + i * (Xin - 2 * lx0) / (nLed - 1)), oy + stripF / 2]);
      // sporgenza: il collarino del LED batte sotto il tubetto; più è lungo il tubetto, più il LED sta dentro
      const ledTop = { sporgente: null, filo: 0, incassato: -1 }[p.ledSporg || 'sporgente'];
      const ringLen = LT.pelle ? 0 : ledTop === null ? 1.8 : Math.min(Hin - 3, Math.max(1.8, LT.h - ledTop - tl));
      const ledOut = LT.pelle ? 0 : LT.h - tl - ringLen;   // quanto esce sopra il coperchio (negativo: incassato)
      for (const [x, y] of ledXY) {
        if (LT.pelle) lidCuts.push(cylZ(x, y, Zw - 1, Htot - LT.pelle, LT.r, LT.r, 40));
        else {
          lidAdds.push(cylZ(x, y, Zw - ringLen, Zw + 0.02, LT.anello, LT.anello, 40));
          lidCuts.push(cylZ(x, y, Zw - ringLen - 1, Htot + 1, LT.r, LT.r, 40), cylZ(x, y, Htot - 0.4, Htot + 0.6, LT.r, LT.r + 1.0, 40));
        }
      }
      // viti: fori svasati
      const screwHoles = [];
      if (!campana) for (const [x, y] of postXY) {
        if (vm) {   // boccola sotto il coperchio con il foro filettato (la vite arriva dal basso)
          lidAdds.push(X(cylZ(x, y, Zw - bossLen, Zw + 0.02, pr, pr, 40), cuts[0]));
          screwHoles.push(reg(VT.hole(p.viteM, bossLen + tl - 0.8, vg, true).translate([x, y, Zw - bossLen])));
          continue;
        }
        screwHoles.push(cylZ(x, y, Zw - 1, Htot + 1, dv / 2 + 0.25, dv / 2 + 0.25, 24));
        const r0 = dv * 1.0 + 0.2, r1 = dv / 2 + 0.25;
        screwHoles.push(cylZ(x, y, Htot - (r0 - r1), Htot + 0.01, r1, r0, 32));
      }
      if (lidAdds.length) lid = U([lid, ...lidAdds]);
      lid = sub(lid, U([...lidCuts, ...screwHoles]));

      // ---- coperchio decorato: scritta, loghi e il tuo SVG sulla faccia di sopra (come nel Powerbank) ----
      // il coperchio si stampa capovolto: a filo (colori nei primi strati), inciso o traforato. Evita viti, fascia dei LED e finestre.
      const DEC = H.decor, lidCol = {};
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
        // zona: tutto il coperchio (1,5 mm dal bordo esterno), meno i fori: viti dall'alto, LED, finestre. Le frecce portano la scritta dove vuoi, anche negli angoli
        const CC = (x, y, r) => R2(R2(CrossSection.circle(r, 32)).translate([x, y]));
        const Rb = Math.max(0.5, R - 1.5);
        const area0 = OFF(RECT(1.5 + Rb, 1.5 + Rb, Xo - 1.5 - Rb, Yo - 1.5 - Rb), Rb);
        const busy = [];
        if (!campana && !vm) for (const [x, y] of postXY) busy.push(CC(x, y, dv + 0.2 + 1.2));    // teste svasate delle viti sul coperchio
        if (nLed) for (const [x, y] of ledXY) busy.push(CC(x, y, (LT.pelle ? LT.r : LT.r + 1.0) + 1.0));
        for (const pl of place) {
          const fin = pl.it.finestra; if (!fin) continue;
          const bx = ox + pl.px + g, by = oy + pl.py + g, mm = (p.margineFin || 0) + 1.5;
          const r = fin.x0 !== undefined ? [fin.x0, fin.y0, fin.x1, fin.y1] : fin.w ? [fin.cx - fin.w / 2, fin.cy - fin.h / 2, fin.cx + fin.w / 2, fin.cy + fin.h / 2] : [fin.cx - fin.d / 2, fin.cy - fin.d / 2, fin.cx + fin.d / 2, fin.cy + fin.d / 2];
          busy.push(RECT(bx + r[0] - mm, by + r[1] - mm, bx + r[2] + mm, by + r[3] + mm));
        }
        const area = busy.length ? CD(area0, CU(busy)) : area0;
        const ax0 = 1.5, ax1 = Xo - 1.5, ay0 = 1.5, ay1 = Yo - 1.5;
        // misura e punto di partenza: il rettangolo libero più grande (poi le frecce la spostano ovunque nella zona)
        let best = null;
        { const bb = (c) => c.bounds(), xs = new Set([ax0, ax1, ax0 + Rb, ax1 - Rb]), ys = new Set([ay0, ay1, ay0 + Rb, ay1 - Rb]);   // anche i bordi rientrati degli angoli arrotondati: senza, con niente sul coperchio non trovava spazio
          for (const b of busy) { const q = bb(b); xs.add(Math.min(ax1, Math.max(ax0, q.min[0]))); xs.add(Math.min(ax1, Math.max(ax0, q.max[0]))); ys.add(Math.min(ay1, Math.max(ay0, q.min[1]))); ys.add(Math.min(ay1, Math.max(ay0, q.max[1]))); }
          const X_ = [...xs].sort((a, b) => a - b), Y_ = [...ys].sort((a, b) => a - b);
          for (let i = 0; i < X_.length; i++) for (let j = i + 1; j < X_.length; j++) for (let k = 0; k < Y_.length; k++) for (let l = k + 1; l < Y_.length; l++) {
            const a = (X_[j] - X_[i]) * (Y_[l] - Y_[k]); if (best && a <= best.a) continue;
            const rc = RECT(X_[i], Y_[k], X_[j], Y_[l]), out = CD(rc, area);
            if (emptyC(out) || out.area() < 0.5) best = { a, r: [X_[i], Y_[k], X_[j], Y_[l]] };
          } }
        if ((art || hasT) && best && best.r[2] - best.r[0] > 12 && best.r[3] - best.r[1] > 8) {
          // parte al centro del rettangolo libero più grande, ma può essere grande quanto tutto il coperchio: dove tocca finestre, fori o il bordo viene tagliata (c'è l'avviso)
          const zcx = (best.r[0] + best.r[2]) / 2, zcy = (best.r[1] + best.r[3]) / 2, lw = ax1 - ax0, lh = ay1 - ay0;
          const bx0 = zcx - lw / 2, by0 = zcy - lh / 2, bx1 = zcx + lw / 2, by1 = zcy + lh / 2, zone = RECT(best.r[0], best.r[1], best.r[2], best.r[3]);
          // il disegno si gira con "Rotazione disegno" attorno al suo centro; le righe di testo hanno ognuna la sua rotazione
          const thA = (((+p.rotDisegno || 0) % 360) + 360) % 360;
          const has1 = p.scritta && String(p.scritta).trim(), has2 = p.scritta2 && String(p.scritta2).trim();
          const tH = hasT ? 1.5 * ((has1 ? p.altTesto : 0) + (has2 ? +p.altTesto2 || p.altTesto : 0)) : 0, gap = art && hasT ? 3 : 0;
          const Sa = art ? Math.max(6, Math.min(p.altDisegno, by1 - by0 - tH - gap, bx1 - bx0)) : 0;
          const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2 + (Sa + gap + tH) / 2;
          let artCS = null, txt = null; const slots = {};
          if (art) {
            const g0 = DEC.artGeom(art, Sa, bx1 - bx0), acx = cx, acy = cy - Sa / 2;
            const ROT = (c) => (!c || !thA ? c : R2(R2(R2(c.translate([-acx, -acy])).rotate(thA)).translate([acx, acy])));
            const placeA = (c) => (c ? MV(c, acx, acy) : null);
            const sil = placeA(g0.sil);
            artCS = st === 'filo' ? sil : st === 'inciso' ? (g0.lines ? placeA(g0.lines) : sil) : (g0.lines ? placeA(CI(g0.lines, OFF(g0.sil, -1.3 * g0.k))) : sil);
            if (st === 'filo') { const sl = DEC.artSlots(g0, F, OFF(g0.sil, 0.01), noz, notes); for (const k of [2, 3, 4]) if (sl[k]) slots[k] = ROT(placeA(sl[k])); }
            artCS = ROT(artCS);
          }
          if (hasT) {
            txt = DEC.fitLines ? DEC.fitLines(p, { x: cx, y: cy - Sa - gap - tH / 2, w: bx1 - bx0, h: Math.max(4, tH), hMax: by1 - by0 }, [p.rotTesto, p.rotTesto2]) : DEC.fitText(p, { x: cx, y: cy - Sa - gap - tH / 2, w: bx1 - bx0, h: Math.max(4, tH) }, p.altTesto);
            if (txt && txt.reduced) notes.push(`~Scritta ridotta a ${fmt(txt.cap)} mm per starci`);
            if (txt) { const kc = CI(txt.cs, area); if (emptyC(kc) || kc.area() < txt.cs.area() * 0.98) notes.push('La scritta tocca una finestra, un foro o il bordo del coperchio: lì viene tagliata. Spostala con le frecce, girala o rimpiccioliscila'); }
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
            if (st === 'traforata' && artCS) { const r = DEC.perforate(hole, OFF(zone, -1)); hole = r.holes; if (r.bridges) notes.push(`${r.bridges} ponticell${r.bridges > 1 ? 'i tengono' : 'o tiene'} attaccate le parti del disegno`); }
            if (!emptyC(hole)) lid = sub(lid, st === 'traforata' ? EZ(hole, Zw - 1, Htot + 1) : EZ(hole, Htot - depth, Htot + 1));
            decoInfo = st === 'traforata' ? 'traforato: si vede dentro la scatola (attenzione alle schede sotto)' : `inciso ${fmt(depth)} mm`;
          }
          decoInfo += ` · zona usata ${fmt(bx1 - bx0)} × ${fmt(by1 - by0)} mm, lontano da viti, LED e finestre`;
          if (txt && txt.cap < 4) notes.push('Lettere sotto i 4 mm: vengono poco leggibili. Ingrandisci la scritta o accorcia il testo');
          if (p.ariaTipo && p.ariaTipo !== 'nessuna' && p.ariaCop && p.ariaCop !== 'no') notes.push('Coperchio decorato con le prese d\'aria sul coperchio: dove si incrociano la decorazione resta bucata. Metti le prese solo sopra le schede, sulle pareti, o toglile dal coperchio');
        } else if (art || hasT) notes.push('Sul coperchio non c\'è spazio libero per la decorazione (tra viti, LED e finestre): togli la scritta o il disegno, oppure rimpiccioliscili');
        if (hasT) DEC.logoNotes(noz);
        for (const k of [2, 3, 4]) if (lidCol[k]) lid = sub(lid, lidCol[k]);
      }

      // schede troppo vicine o sovrapposte (con le frecce si può)
      {
        const rc = place.map(q => [q.px + g, q.py + g, q.px + g + q.it.L, q.py + g + q.it.W]);
        const nm = (q, k) => (k === 0 ? 'il processore' : `il modulo ${q.it.slot}`);
        for (let a = 0; a < place.length; a++) for (let b = a + 1; b < place.length; b++) {
          const dxs = Math.max(rc[b][0] - rc[a][2], rc[a][0] - rc[b][2]), dys = Math.max(rc[b][1] - rc[a][3], rc[a][1] - rc[b][3]), dist = Math.max(dxs, dys);
          if (dist < 0) notes.push(`ATTENZIONE: ${nm(place[a], a)} e ${nm(place[b], b)} si sovrappongono: spostali con le frecce`);
          else if (dist < 4) notes.push(`${nm(place[a], a)} e ${nm(place[b], b)} sono a ${fmt(dist)} mm: le culle si fondono e i dupont non passano, meglio almeno 6 mm`);
        }
        if (cpu.usb) place.slice(1).forEach((q, i) => { const r = rc[i + 1], r0 = rc[0], yc = r0[1] + cpu.usb.y; if (r[0] < r0[0] && r[3] > yc - 8 && r[1] < yc + 8) notes.push(`${nm(q, i + 1)} sta tra il processore e la parete con la USB: il cavo non arriva: sposta la scheda`); });
      }
      // ---- pezzi ----
      const center = (q) => reg(q.translate([-Xo / 2, -Yo / 2, 0]));
      const flip = (q) => reg(q.rotate([180, 0, 0]));
      const ghostM = U(ghost);
      const parts = [];
      parts.push({ name: 'Scatola', m: center(box0), role: 'body' });
      const colored = Object.keys(lidCol).length > 0, atL = p.__closed ? undefined : [0, Yo + 12, -Zw];
      parts.push(Object.assign({ name: 'Coperchio', m: center(lid), role: 'inner', print: flip(center(lid)), at: atL }, colored ? { color: F[0], group: 'Coperchio' } : {}));
      for (const k of [2, 3, 4]) if (lidCol[k]) parts.push({ name: `Coperchio · colore ${k}`, m: center(lidCol[k]), role: 'inner', print: flip(center(lidCol[k])), at: atL, color: F[k - 1], group: 'Coperchio' });
      parts.push({ name: 'esempio', m: center(ghostM), role: 'ghost' });
      let lidScrewAsm = null;
      if (vm && !campana) {   // le quattro viti del coperchio: testa a filo sotto il fondo, punta nella boccola filettata del coperchio
        const Ls = Math.floor((Htot - 1.3) * 2) / 2, sc = VT.screw(p.viteM, Ls, vg, 'taglio');
        const mkF = (th) => reg(reg(reg(sc.m.rotate([0, 0, th])).rotate([180, 0, 0])).translate([0, 0, sc.L]));
        const tgL = sub(cylZ(0, 0, Zw - bossLen, Zw + tl, pr, pr, 48), reg(VT.hole(p.viteM, bossLen + tl - 0.8, vg, true).translate([0, 0, Zw - bossLen])));
        const flipS = mkF(turnBest(mkF, tgL, Zw - bossLen + 1, Zw - bossLen + 1 + 3 * vm.P, true));
        lidScrewAsm = U(postXY.map(([x, y]) => reg(flipS.translate([x, y, 0]))));
        const step = 2 * vm.D + 3;
        parts.push({ name: `Viti ${(p.viteM || 'M6')}×${fmt(sc.L)} (4 pezzi)`, m: center(lidScrewAsm), role: 'pin', print: U([0, 1, 2, 3].map(k => reg(sc.print.translate([(k - 1.5) * step, 0, 0])))), at: p.__closed ? undefined : [Xo + 24, 0, 0] });
        info.push(['Viti stampate', `${p.viteM} (passo ${fmt(vm.P)} mm), testa svasata Ø ${fmt(2 * vm.D)} mm con taglio per il cacciavite, lunghe ${fmt(sc.L)} mm. Gioco del filetto ${fmt(vg)} mm. Sono quattro pezzi uguali: stampali in piedi con la testa sul piatto, strati sottili (0,12–0,16 mm), almeno 4 perimetri, meglio PETG`]);
        notes.push(`~Viti stampate ${p.viteM}: con ugello da 0,4 mm la misura minima che viene è M6 (M8 è più robusta). Stampa prima una vite sola e provala nella boccola del coperchio: se è dura o balla cambia il gioco del filetto. Le colonnine sono più grosse di quelle per le viti M3, quindi la scatola cresce di qualche millimetro.`);
      }
      // ---- base + campana ----
      let baseM = null, hoodM = null, campScrews = null;
      if (campana) {
        for (let i = parts.length - 1; i >= 0; i--) if (/^(Scatola|Coperchio)/.test(parts[i].name)) parts.splice(i, 1);
        const cl = 0.25, cxI = ox + Xin / 2, cyI = oy + Yin / 2;   // gioco tra base e campana
        const inner = slab(Xin - 2 * cl, Yin - 2 * cl, Math.max(0.3, ri - cl), f - 0.02, Htot, cxI, cyI);
        const wallsN = sub(X(S, box(-1, -1, f, Xo + 1, Yo + 1, Zw + 0.02)), U(cuts));   // pareti come nella scatola normale (aperture e prese d'aria comprese)
        const notches = [], tabs = [], lipCuts = [];
        const c0 = place[0], it0 = c0.it, bx0 = ox + c0.px + g, by0 = oy + c0.py + g, zb0 = zbOf(it0), zt0 = zb0 + it0.pcb;
        // tacca aperta in basso sotto ogni apertura della parete sinistra: la campana scende sopra il connettore; il dentino della base la richiude
        const slot = (yc, hw, zTop, zTab) => {
          notches.push(box(-1, yc - hw, f - 0.5, ox + 0.3, yc + hw, zTop));
          if (zTab - f > 0.4) tabs.push(X(wallsN, box(-1, yc - hw + cl, f - 0.01, ox + 0.01, yc + hw - cl, zTab)));
          lipCuts.push(box(ox - 1, yc - hw - 2, f - 1, ox + 4, yc + hw + 2, f + 5));
        };
        if (it0.usb) {
          const c = CONN[it0.usb.tipo], g2 = 0.6, z0 = it0.capo ? zb0 - c.z1 - g2 : zt0 + c.z0 - g2;
          slot(by0 + it0.usb.y, c.w / 2 + g2, z0 + 0.01, z0 - cl);
        }
        if ((it0.id === 'esp32cam' || it0.id === 'esp32cammb') && p.antenna === 'esterna') {
          const za = Math.min(Zw - 5, Math.max(f + 4, zt0 + 5));
          slot(by0 + it0.W / 2, 3.3, za, za - 3.3 - cl);
        }
        // viti da sotto la base: svasatura sotto (a 45°, uguale a quella del coperchio normale), rialzo sulla base se la testa è più alta del fondo, colonnina della campana sopra
        const csk = true;
        const rH = vm ? (vm.D + 0.8) / 2 : dv / 2 + 0.25, r0 = vm ? vm.D + 0.5 : dv + 0.2;
        // svasatura a 55° invece di 45°: a 45° esatti alcune facce del cono superano il limite dello slicer, che ci mette dei supporti minuscoli.
        // La testa (90°) tocca il bordo del foro alla stessa quota di prima, quindi resta a filo
        const hcs = (r0 - rH) * Math.tan(55 * Math.PI / 180);
        const padH = csk ? Math.max(0, hcs + 0.6 - f) : 0, z0p = f + padH;
        const hoodPosts = postXY.map(([x, y]) => cylZ(x, y, z0p, Zw + 0.03, pr, pr, 40));
        let hood = U([sub(wallsN, U(notches)), lid, ...hoodPosts]);
        hood = sub(hood, U(postXY.map(([x, y]) => (vm ? reg(VT.hole(p.viteM, bossLen, vg, true).translate([x, y, z0p])) : cylZ(x, y, z0p - 0.01, z0p + Math.min(12, Zw - z0p - 1), dv === 3 ? 1.3 : 1.05, dv === 3 ? 1.3 : 1.05, 24)))));
        // base: fondo vero (con le prese d'aria), bordino di centraggio dentro le pareti, culle, dentini, rialzi delle viti
        const floorB = sub(X(S, box(-1, -1, -1, Xo + 1, Yo + 1, f)), U(cuts));
        const lipO = slab(Xin - 2 * cl, Yin - 2 * cl, Math.max(0.3, ri - cl), f - 0.01, f + 1.2, cxI, cyI);
        const lipI = slab(Xin - 2 * cl - 2.4, Yin - 2 * cl - 2.4, Math.max(0.3, ri - cl - 1.2), f - 1, f + 2, cxI, cyI);
        const lipB = sub(lipO, U([lipI, ...postXY.map(([x, y]) => cylZ(x, y, f - 1, f + 3, pr + cl, pr + cl, 40)), ...lipCuts]));
        const pads = padH > 0.01 ? postXY.map(([x, y]) => X(cylZ(x, y, f - 0.01, z0p, pr, pr, 40), inner)) : [];
        // le culle non devono toccare le colonnine della campana (nella scatola normale si fondevano)
        const cradB = sub(X(U(addsClean), inner), U(postXY.map(([x, y]) => cylZ(x, y, z0p - 0.01, Htot, pr + cl, pr + cl, 40))));
        let base = U([floorB, lipB, cradB, ...tabs, ...pads, ...bossAdds]);
        base = sub(base, U([...postXY.flatMap(([x, y]) => [cylZ(x, y, -1, z0p + 0.01, rH, rH, 32), csk ? cylZ(x, y, -0.01, hcs, r0, rH, 40) : null]), ...bossCuts]));
        baseM = base; hoodM = hood;
        const colored = Object.keys(lidCol).length > 0, atH = p.__closed ? undefined : [0, 0, Hin + 12];
        parts.unshift({ name: 'Base', m: center(base), role: 'body' });
        parts.splice(1, 0, Object.assign({ name: 'Campana', m: center(hood), role: 'inner', print: flip(center(hood)), at: atH }, colored ? { color: F[0], group: 'Campana' } : {}));
        for (const k of [2, 3, 4]) if (lidCol[k]) parts.splice(2, 0, { name: `Campana · colore ${k}`, m: center(lidCol[k]), role: 'inner', print: flip(center(lidCol[k])), at: atH, color: F[k - 1], group: 'Campana' });
        let scTxt;
        if (vm) {
          const Ls = Math.floor((z0p + bossLen - 0.8) * 2) / 2, sc = VT.screw(p.viteM, Ls, vg, 'taglio');
          const mkF = (th) => reg(reg(reg(sc.m.rotate([0, 0, th])).rotate([180, 0, 0])).translate([0, 0, sc.L]));
          const tg = sub(cylZ(0, 0, z0p, z0p + bossLen, pr, pr, 48), reg(VT.hole(p.viteM, bossLen, vg, true).translate([0, 0, z0p])));
          const flipS = mkF(turnBest(mkF, tg, z0p + 1, z0p + 1 + 3 * vm.P, true));
          campScrews = U(postXY.map(([x, y]) => reg(flipS.translate([x, y, 0]))));
          const step = 2 * vm.D + 3;
          parts.push({ name: `Viti ${(p.viteM || 'M6')}×${fmt(sc.L)} (4 pezzi)`, m: center(campScrews), role: 'pin', print: U([0, 1, 2, 3].map(k => reg(sc.print.translate([(k - 1.5) * step, 0, 0])))), at: p.__closed ? undefined : [Xo + 24, 0, 0] });
          info.push(['Viti stampate', `${p.viteM} (passo ${fmt(vm.P)} mm), testa svasata Ø ${fmt(2 * vm.D)} mm con taglio, lunghe ${fmt(sc.L)} mm, 4 pezzi. Gioco del filetto ${fmt(vg)} mm. In piedi con la testa sul piatto, strati sottili, almeno 4 perimetri, PETG`]);
          scTxt = `4 viti ${p.viteM} stampate`;
        } else scTxt = `4 viti ${p.vite} ${csk ? 'a testa svasata' : 'a testa tonda o svasata'} lunghe ${fmt(Math.ceil(z0p + 8))}–${fmt(Math.ceil(z0p + 12))} mm (autofilettanti, nel pre-foro da ${dv === 3 ? '2,6' : '2,1'} mm)`;
        info.push(['Base + campana', `base piatta con le culle e i 4 fori ${csk ? 'svasati' : 'dritti (le teste delle viti sporgono sotto: incolla 4 piedini in gomma alti almeno 3 mm)'}; campana con pareti, coperchio e colonnine in un pezzo. Monti e colleghi le schede sulla base aperta, abbassi la campana (${notches.length ? 'la tacca scende sopra ' + (it0.usb ? 'la USB' : 'il connettore') + ' e il dentino della base la richiude' : 'si centra sul bordino della base'}) e la fissi con ${scTxt} da sotto la base. Stampa: base com'è, campana capovolta con il coperchio sul piatto, senza supporti`]);
        if (padH > 0.01) notes.push(`~Base + campana: sotto le viti la base ha dei rialzi da ${fmt(padH)} mm, perché la testa svasata è più alta del fondo`);
      }
      if (ballScrewAsm) parts.push({ name: `Viti sfera ${(p.viteM || 'M6')}×${fmt(ballScrewL)} (2 pezzi)`, m: center(ballScrewAsm), role: 'pin', print: ballScrewP, at: p.__closed ? undefined : [Xo + 24, 0, 0] });
      if (ballM) {
        const yE = -(Yo / 2 + 32), cx0 = ballXY[0] - Xo / 2, cy0 = ballXY[1] - Yo / 2;
        parts.push({ name: 'Sfera', m: center(ballM), role: 'inner', print: ballP, at: p.__closed ? undefined : [-22 - cx0, yE - cy0, ballTop] });
        parts.push({ name: 'Snodo', m: center(sockM), role: 'inner', print: sockP, at: p.__closed ? undefined : [22 - cx0, yE - cy0, sockLift] });
      }

      // ---- misure e note ----
      info.push(['Esterno', `${fmt(Xo)} × ${fmt(Yo)} × ${fmt(Htot)} mm`]);
      const mtxt = (it) => (it.slot ? `torre aperta ${({ W: 'a sinistra', E: 'a destra', N: 'in su (dietro)', S: 'in giù (davanti)' })[it.pines && it.pines[0] && it.pines[0].lato] || ''} (lato dei piedini${it.giro ? `, modulo girato di ${Math.abs(it.giro)}°` : ''}), ${fmt(it.cav)} mm sotto${it.lidM ? `, sotto il coperchio (${fmt(gapCop)} mm)` : ''}` : it.lidM ? (it.capo ? `sotto il coperchio, capovolta (torre dal fondo, retro della scheda a ${fmt(gapCop + 3)} mm dal coperchio, componenti e piedini in giù)` : `sotto il coperchio (torre dal fondo, componenti a ${fmt(gapCop)} mm dal coperchio, piedini in giù)`) : it.capo ? `capovolta (componenti in giù, piedini ${it.su ? 'in su' : 'in giù'})` : 'piedini ' + (it.su ? 'sopra' : 'sotto'));
      info.push(['Processore', `${cpu.nome} · ${cpu.fonte} · ${mtxt(cpu)}`]);
      if (cpu.esphome) info.push(['ESPHome', cpu.esphome]);
      if (cpu.dove) info.push(['Dove si compra', cpu.dove]);
      mods.forEach((it, i) => {
        info.push([`Modulo ${i + 1}`, `${it.nome} · ${it.fonte} · ${mtxt(it)}`]);
        const esp = it.led ? (cpu.piattaforma === 'esp8266' ? 'light: platform: neopixelbus · variant: WS2812 · method: esp8266_dma sul GPIO3' : 'light: platform: esp32_rmt_led_strip · chipset: WS2812') : it.esphome;
        if (esp) info.push(['ESPHome', esp]);
      });
      info.push(['Disposizione', place.map((q, i) => `${i === 0 ? 'processore' : 'modulo ' + i}: a ${fmt(q.px)} mm da sinistra, a ${fmt(q.py)} mm dal fronte`).join(' · ')]);
      info.push(['Piedini e dupont', `componenti in su (tranne le schede capovolte). Piedini sotto: sotto ogni scheda resta il suo spazio (${items.filter(q => !q.su).map(q => fmt(q.cav)).join(', ') || '–'} mm) (header 2,5 mm + connettore dupont 14 mm + curva dei fili), i fili passano sotto le schede e tra una culla e l'altra. Piedini sopra: la scheda scende e i dupont salgono verso il coperchio (16,5 mm, più 3 mm per la curva dei fili). Il lato si sceglie per ogni scheda`]);
      for (const x of capoNotes) notes.push(x);
      for (const it of mods) if (it.giro && it.finestra && it.finestra.tipo === 'display') notes.push(`${it.nome.split(' (')[0]}: per avere i piedini ${({ W: 'a sinistra', E: 'a destra', N: 'dietro', S: 'davanti' })[it.pines[0].lato]} il display è girato di ${Math.abs(it.giro)}°: in ESPHome metti ${Math.abs(it.giro) === 180 ? 'rotation: 180°' : 'rotation: 90° o 270° (prova quale lo raddrizza)'}, oppure scegli l'altra apertura`);
      for (const it of items) if (!it.su && !it.lidM && it.cav < dupH + 1) notes.push(`${it.nome.split(' (')[0]}: con ${fmt(it.cav)} mm sotto la scheda i dupont dritti (${fmt(dupH)} mm con l'header) non ci stanno: usa dupont a 90°, fili saldati o header corti, oppure almeno ${fmt(Math.ceil(dupH + 3))} mm`);
      for (const pl of place) { const it = pl.it; if (!it.finestra || it.lidM) continue; const d = Zw - (zbOf(it) + it.pcb + it.hTop); if (d > 2.5) notes.push(`${it.nome.split(' (')[0]}: i componenti stanno ${fmt(d)} mm sotto il coperchio, lontano dalla finestra. Aumenta il suo spazio sotto o scegli "Sotto il coperchio"`); }
      if (items.some(it => it.lidM)) info.push(['Sotto il coperchio', `${items.filter(it => it.lidM).map(it => it.nome.split(' (')[0]).join(', ')}: sulla sua culla-torre che parte dal fondo (anche con base + campana: la torre è sulla base), con i componenti a ${fmt(gapCop)} mm dal coperchio (capovolta: il retro della scheda, con le punte saldate dei piedini a ${fmt(gapCop)} mm) e i piedini in giù. Si appoggia e si collega con la scatola aperta; il coperchio la tiene ferma dall'alto. ${mods.some(it => it.lidM && it.id === 'rc522') ? `L'RC522 legge attraverso ${fmt(tl)} mm di coperchio più ${fmt((m => m.capo ? 3 + gapCop : m.hTop + gapCop)(mods.find(it => it.id === 'rc522')))} mm (${mods.find(it => it.id === 'rc522').capo ? 'punte saldate' : 'componenti'} e aria): con pochi mm le tessere si leggono bene. ` : ''}I dupont stanno nel vano sotto la scheda`]);
      if (items.some(it => it.capo && it.su)) info.push(['Capovolta, piedini su', `componenti verso il fondo e piedini in su: la scheda appoggia sul bordo (0,8 mm di muretto sotto il bordo), sotto restano ${fmt(Math.max(...items.filter(it => it.capo && it.su).map(under)))} mm per i componenti; la USB esce sotto il circuito e i dupont salgono verso il coperchio`]);
      if (items.some(it => it.capo && !it.su)) info.push(['Capovolta, piedini giù', `componenti verso il fondo e piedini in giù: la scheda sta alta come con i piedini sotto (il suo spazio sotto, per header e dupont), i componenti stanno tra le file dei piedini; la USB esce sotto il circuito; sopra restano 3 mm per le punte saldate`]);
      for (const it of items) if (it.su && it.finestra) info.push(['Piedini sopra', `${it.nome}: con i dupont sopra la scheda sta a circa ${fmt(above(it) - it.hTop + 0.6)} mm più in basso del coperchio; la finestra funziona, ma display e sensori si vedono da più lontano`]);
      if (items.some(it => it.id === 'esp32cam' || it.id === 'esp32cammb')) info.push(['Antenna', p.antenna === 'esterna' ? 'antenna esterna: foro Ø 6,6 mm nella parete sinistra per un connettore SMA da pannello, con un cavo U.FL/IPEX–SMA (pigtail). Sull\'ESP32-CAM sposta la resistenza da 0 Ω (o fai un ponte di stagno) accanto al connettore IPEX nella posizione "esterna" (in basso, a "\\" nello schema delle tre piazzole): si usa una sola antenna alla volta' : 'antenna interna (sul circuito): la scatola di plastica va bene, ma tieni libero quel lato e niente metallo vicino. Per più portata scegli "esterna"']);
      if (ariaTxt.length) {
        const nome = { fessure: 'fessure', fori: 'fori tondi', esagoni: 'esagoni (nido d\'ape)' }[tipoA];
        info.push(['Prese d\'aria', `${nome} da ${fmt(+p.ariaD)} mm, bordo tra l'una e l'altra ${fmt(+p.ariaGap)} mm · area libera: ${ariaTxt.join(' · ')}`]);
        if (p.ariaFondo && p.ariaFondo !== 'no') notes.push('Prese d\'aria sul fondo: la scatola appoggiata sul tavolo le chiude. Incolla dei piedini di gomma (almeno 3 mm) o appoggiala su un supporto.');
        if (p.ariaCop && p.ariaCop !== 'no' && [p.ariaDietro, p.ariaDavanti, p.ariaDestra, p.ariaSinistra, p.ariaFondo].every(v => !v || v === 'no')) notes.push('Prese d\'aria solo sul coperchio: l\'aria calda esce ma ne entra poca. Aggiungi una presa in basso (parete o fondo) per far circolare l\'aria.');
        notes.push('~Prese d\'aria: l\'aria calda sale, quindi la presa che butta fuori va in alto e quella che fa entrare l\'aria va in basso, possibilmente su pareti diverse. Fessure e fori lasciano passare polvere e insetti: se serve, dietro ci va una reticella.');
      }
      if (supN.length) info.push(['Supporto', supN.join(' · ')]);
      if (vm && !campana) { const iC = info.findIndex(r => r[0] === 'Coperchio'); if (iC >= 0) info[iC][1] = `4 viti ${p.viteM} stampate dal basso, a filo sotto il fondo, che si avvitano in boccole filettate sotto il coperchio: sopra non si vede niente`; }
      info.push(['Culle', `ogni scheda ha un muretto sotto i bordi senza piedini (${fmt(lip0)} mm sotto la scheda) e un contorno alto quanto il circuito; sui bordi con i piedini solo due dentini; gioco ${fmt(g)} mm per lato`]);
      info.push(['Altezza', `tutte le schede arrivano a 0,6 mm dal coperchio, così display, fotocamera e sensori sono vicini alle finestre`]);
      if (!campana) info.push(['Coperchio', `4 viti ${p.vite} a testa svasata dall'alto, in colonnine agli angoli (pre-foro ${dv === 3 ? '2,6' : '2,1'} mm, per viti autofilettanti o da avvitare nel PETG)`]);
      if (nLed) info.push(['LED', `${nLed} × ${LT.nome} sulla fascia davanti del coperchio${LT.pelle ? `: resta una pelle da ${LT.pelle} mm sopra al LED, la luce passa (meglio se il coperchio è chiaro)` : `: foro Ø ${fmt(2 * LT.r)} mm e tubetto sotto il coperchio lungo ${fmt(ringLen)} mm: il collarino del LED batte sotto il tubetto, ${ledOut > 0.3 ? `il LED esce di circa ${fmt(ledOut)} mm` : ledOut < -0.3 ? `il LED resta ${fmt(-ledOut)} mm sotto la superficie` : 'il LED arriva a filo'} (misure tipiche dei LED: controlla i tuoi). Spingilo da dentro, una goccia di colla a caldo lo tiene fermo. Va collegato con i dupont`}`]);
      if (nCav) info.push(['Passacavi', `${nCav} × Ø ${fmt(p.cavoD)} mm sulla parete dietro, nel vano dei fili`]);
      for (const it of items) if (it.stima) info.push(['Da verificare', `${it.nome}: ${it.stima}`]);
      // indirizzi I²C
      const byAddr = {};
      for (const it of mods) if (it.i2c) (byAddr[it.i2c[0]] = byAddr[it.i2c[0]] || []).push(it);
      for (const a of Object.keys(byAddr)) if (byAddr[a].length > 1) {
        const alt = byAddr[a].find(q => q.i2c.length > 1 && q.i2c[1] !== '0x38');
        notes.push(`Indirizzo I²C ${a} in comune tra ${byAddr[a].map(q => q.nome.split(' (')[0]).join(' e ')}: ${alt ? `su uno dei due porta il pin AD0/SDO a 3,3 V per passare a ${alt.i2c[1]}` : 'usa un solo modulo o un multiplexer I²C (TCA9548A)'}`);
      }
      if (mods.some(q => q.bus === 'SPI') && mods.filter(q => q.bus === 'SPI').length > 1) notes.push('~RC522 e display SPI possono stare sullo stesso bus SPI (clk, miso, mosi), con un pin CS diverso per ciascuno');
      if (mods.some(q => q.led)) {
        notes.push('~Il pannello LED va alimentato a 5 V con un alimentatore a parte (un 8 × 8 può arrivare a quasi 4 A a tutto bianco), con la massa in comune col processore. Metti un condensatore da circa 1000 µF all\'ingresso e una resistenza da 300–500 Ω sul filo dei dati; con 3,3 V di segnale serve un adattatore di livello');
        if (cpu.piattaforma === 'esp8266') notes.push('~Su ESP8266 il pannello va sul GPIO3 (metodo esp8266_dma di neopixelbus): è il pin RX, quindi durante il caricamento via USB scollega il filo');
      }
      if (cpu.id === 'esp32cam' || cpu.id === 'esp32cammb') notes.push('~' + (cpu.id === 'esp32cammb' ? 'Base MB: i piedini della ESP32-CAM sono coperti dagli zoccoli e non escono dalla base, quindi i sensori non si collegano con i dupont a questa scheda (servono fili saldati ai piedini o un altro processore). ' : '') + 'ESP32-CAM: fotocamera e microSD occupano quasi tutti i pin. Se non usi la microSD si liberano i GPIO 2, 4, 12, 13, 14, 15; i pin I²C dell\'esempio ESPHome della fotocamera sono GPIO26 (SDA) e GPIO27 (SCL)');
      if (mods.some(q => q.id === 'ens160')) notes.push('~ENS160: dopo la prima accensione ESPHome aspetta un\'ora prima di dare valori buoni, poi 3 minuti a ogni avvio');
      if (mods.some(q => q.id === 'mpu6050' || q.id === 'bmi160')) notes.push('~Accelerometro: fissa bene la scheda (le culle la tengono, ma non è bloccata); gli assi X, Y, Z sono quelli stampati sul circuito');
      info.push(['Stampa', 'PLA o PETG. Scatola aperta in su, coperchio capovolto: senza supporti. Stampa prima il coperchio (è sottile e veloce) e prova le schede nelle finestre']);
      if (decoInfo) info.push(['Coperchio decorato', decoInfo]);
      if (w < 1.2) notes.push(`~Pareti da ${fmt(w)} mm (2 passate con ugello 0,4): leggere ma flessibili. Infila la spina USB tenendo la scatola, e stampa con almeno 2 perimetri pieni`);
      if (f < 1.0) notes.push(`~Fondo da ${fmt(f)} mm: si flette un po'. Le culle e le colonnine ci poggiano sopra; con le prese d'aria sul fondo diventa delicato`);
      for (const x of notes) info.push(['Nota', x]);
      if (DEC) { for (const x of DEC.NOTES) info.push(['Nota', x]); DEC.NOTES.clear(); }

      // ---- pezzo di prova: solo la base con le culle e le aperture delle pareti (USB, antenna) ----
      // con i piedini in giù la culla si accorcia: sotto la scheda restano 11 mm (header + punte), il resto si toglie e la culla si abbassa
      if (p.prova === 'culle') {
        parts.length = 0;
        const fp = Math.min(1.0, f), mar = gOut + ft + 0.6, zF = f - fp;   // fondo di prova 1 mm
        // fondo: solo un bordo di 5 mm lungo il contorno, il fondo sotto le culle e una traversina davanti-dietro per scheda
        const rim = 5, fl = (x0, y0, x1, y1) => box(x0, y0, zF, x1, y1, f + 0.01);
        const regF = [fl(-1, -1, Xo + 1, w + rim), fl(-1, Yo - w - rim, Xo + 1, Yo + 1), fl(-1, -1, w + rim, Yo + 1), fl(Xo - w - rim, -1, Xo + 1, Yo + 1)];
        const holesF = [], ups = [], ghs = [];
        let zMax = f + 1, corte = 0;
        for (const pl of place) {
          const it = pl.it, bx = ox + pl.px + g, by = oy + pl.py + g, zb = zbOf(it), zt = zb + it.pcb;
          const drop = it.su ? 0 : Math.max(0, zb - 11 - f), zc = f + drop;
          if (drop > 0) corte++;
          const regB = [box(bx - mar, by - mar, zc, bx + it.L + mar, by + it.W + mar, zt + 1.0)];
          regF.push(fl(bx - mar, by - mar, bx + it.L + mar, by + it.W + mar));
          const xm = bx + it.L / 2; regF.push(fl(xm - 2.5, -1, xm + 2.5, Yo + 1));
          zMax = Math.max(zMax, zt + 1.0 - drop);
          const inset = 5;   // il fondo sotto la scheda si buca: basta il bordo
          if (it.L > 2 * inset + 4 && it.W > 2 * inset + 4) holesF.push(box(bx + inset, by + inset, zF - 1, bx + it.L - inset, by + it.W - inset, f + 0.02));
          if (pl === place[0] && it.usb) {   // pezzo di parete con la presa USB e l'incavo per la spina
            const c = CONN[it.usb.tipo], cy = by + it.usb.y, zTop = (it.capo ? zb - c.z0 : zt + c.z1) + 3.5;
            regB.push(box(-1, cy - c.spina[0] / 2 - 3, zc, bx + 0.5, cy + c.spina[0] / 2 + 3, zTop));
            regF.push(fl(-1, cy - c.spina[0] / 2 - 3, bx + 0.5, cy + c.spina[0] / 2 + 3));
            zMax = Math.max(zMax, zTop - drop);
          }
          if (pl === place[0] && (it.id === 'esp32cam' || it.id === 'esp32cammb') && p.antenna === 'esterna') {
            const za = Math.min(Zw - 5, Math.max(f + 4, zt + 5));
            regB.push(box(-1, by + it.W / 2 - 6.5, zc, ox + 0.01, by + it.W / 2 + 6.5, za + 6));
            regF.push(fl(-1, by + it.W / 2 - 6.5, ox + 0.01, by + it.W / 2 + 6.5));
            zMax = Math.max(zMax, za + 6 - drop);
          }
          ups.push(reg(X(box0, U(regB)).translate([0, 0, -drop])));
          ghs.push(reg(X(ghostM, box(bx - 6, by - 6, -1, bx + it.L + 6, by + it.W + 6, Htot + 5)).translate([0, 0, -drop])));
        }
        let pc = U([X(box0, U(regF)), ...ups]);
        if (holesF.length) pc = sub(pc, U(holesF));
        pc = reg(pc.translate([0, 0, -zF]));
        parts.push({ name: 'Prova: base con culle e prese', m: center(pc), role: 'body' });
        parts.push({ name: 'esempio', m: center(X(reg(U(ghs).translate([0, 0, -zF])), box(-50, -50, 0.01, Xo + 50, Yo + 50, Htot + 5))), role: 'ghost' });   // i dupont sotto non si provano
        const peso = Math.round(pc.volume() * 1.24 / 100) / 10, pesoTot = Math.round((box0.volume() + lid.volume()) * 1.24 / 100) / 10;
        info.splice(1, 0, ['Prova', `solo la base (fondo di 1 mm: un bordo lungo il contorno, il fondo sotto le culle e una traversina per scheda), le culle e i pezzi di parete con le aperture (${[cpu.usb ? 'USB' : null, /esp32cam/.test(cpu.id || '') && p.antenna === 'esterna' ? 'antenna' : null].filter(Boolean).join(' e ') || 'nessuna'}), alto ${fmt(pc.boundingBox().max[2])} mm: circa ${fmt(peso)} g di PLA invece di ${fmt(pesoTot)} g.${corte ? ` Con i piedini in giù la culla è accorciata a 11 mm sotto la scheda (invece del suo spazio sotto): prova senza i dupont attaccati.` : ''} Appoggia le schede, controlla il gioco delle culle${cpu.usb ? ' e infila la spina USB' : ''}; poi stampa la scatola intera`]);
      }

      const res = { parts, info, view: [0.55, -0.95, 0.8] };
      if (p.__check && p.prova !== 'culle') {
        const v = (a, b) => +X(a, b).volume().toFixed(3);
        if (p.__dbg) { const q = X(box0, lid); const b = q.boundingBox(); res.dbg = [b.min, b.max]; }
        if (campana) {
          if (p.__dbg) { const q = X(baseM, hoodM); const b = q.boundingBox(); res.dbg = [b.min, b.max, q.decompose().map(m => { const bb = m.boundingBox(); return [bb.min.map(v => +v.toFixed(1)), bb.max.map(v => +v.toFixed(1)), +m.volume().toFixed(2)]; })]; }
          res.closed = [['base-campana', v(baseM, hoodM)], ['base-esempio', v(baseM, ghostM)], ['campana-esempio', v(hoodM, ghostM)]];
          if (campScrews) res.closed.push(['vite-base', v(baseM, campScrews)], ['vite-campana', v(hoodM, campScrews)]);
          if (ballScrewAsm) res.closed.push(['vite-sfera-base', v(baseM, ballScrewAsm)], ['vite-sfera-flangia', v(ballM, ballScrewAsm)]);
          if (ballM) res.closed.push(['sfera-base', v(baseM, ballM)], ['sfera-campana', v(hoodM, ballM)]);
          return res;
        }
        res.closed = [['scatola-coperchio', v(box0, lid)], ['scatola-esempio', v(box0, ghostM)], ['coperchio-esempio', v(lid, ghostM)]];
        if (lidScrewAsm) res.closed.push(['vite-scatola', v(box0, lidScrewAsm)], ['vite-coperchio', v(lid, lidScrewAsm)]);
        if (ballScrewAsm) res.closed.push(['vite-sfera-scatola', v(box0, ballScrewAsm)], ['vite-sfera-flangia', v(ballM, ballScrewAsm)]);
        if (ballM) res.closed.push(['sfera-scatola', v(box0, ballM)], ['sfera-snodo', v(ballM, sockM)], ['snodo-scatola', v(box0, sockM)], ['sfera-coperchio', v(lid, ballM)]);
      }
      return res;
    }

    return { schede };
  });
  root.SPLAB_SCHEDE = { SCHEDE, CONN, LED, DUP };
})(typeof globalThis !== 'undefined' ? globalThis : this);

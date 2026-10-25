// Misure delle schede ESP (processori e moduli) e dei LED per il Box schede (src/schede.js). Unità: mm.
(function (root) {
  // connettori USB: larghezza, quote z dalla faccia superiore del circuito, ingombro della spina
  const CONN = {
    micro: { nome: 'micro-USB', w: 7.5, z0: -0.3, z1: 2.7, spina: [11.5, 8.0] },
    usbc: { nome: 'USB-C', w: 8.94, z0: -0.6, z1: 3.26, spina: [12.5, 7.0] },
  };
  // connettore dupont femmina su un header maschio: plastica dell'header 2,5 mm + corpo del connettore 14 mm
  const DUP = { plastica: 2.5, perno: 6.0, corpo: 14.0, passo: 2.54 };
  // LED rotondi: diametro del corpo, del collarino alla base (spesso 1 mm), altezza dal collarino alla punta
  const LED = { 3: { d: 3.0, fl: 3.8, flH: 1.0, h: 5.3 }, 5: { d: 5.0, fl: 5.8, flH: 1.0, h: 8.6 } };

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
      L: 24, W: 19, pcb: 1.2, hTop: 1.8, pines: [{ lato: 'S', n: 4, off: 1.3 }], i2c: ['0x52', '0x53', '0x38'],
      finestra: { tipo: 'aria', cx: 8, cy: 6, w: 9, h: 6 },
      fonte: '24 × 19 mm (misurato dall\'utente), 4 contatti a passo 2,54',
      stima: 'la posizione del sensore e dei contatti. Il sensore di gas ha bisogno d\'aria: il coperchio ha delle fessure. L\'AHT21 misura la temperatura vicino al processore, che scalda: i valori risultano più alti del vero',
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
  root.SCHEDE_MISURE = { SCHEDE, CONN, DUP, LED };
  if (typeof module !== 'undefined' && module.exports) module.exports = { SCHEDE, CONN, DUP, LED };
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Lettore SVG: trasforma un file SVG in forme colorate (poligoni), nell'ordine in cui sono disegnate.
// Funziona sia nel browser (disegni caricati dall'utente) sia in Node (tools/make-emoji.mjs).
// Gestisce: path (tutti i comandi, archi compresi), rect, circle, ellipse, polygon, polyline, line,
// g, use, transform, fill / stroke / fill-rule / opacity (anche da style="" e da <style> con classi),
// gradienti (prende il colore medio). Niente maschere né filtri.
// Coordinate in uscita: quelle del disegno con y verso il basso, come nell'SVG.
(function (root) {
  // ---------- XML minimo ----------
  function parseXML(src) {
    src = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    const rootN = { tag: '#root', attrs: {}, children: [], text: '' }, stack = [rootN];
    const re = /<\/?([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[4] !== undefined) { stack[stack.length - 1].text += m[4]; continue; }
      const full = m[0], tag = m[1].replace(/^svg:/, '');
      if (full.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
      const attrs = {};
      const ra = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a;
      while ((a = ra.exec(m[2]))) attrs[a[1]] = (a[2] !== undefined ? a[2] : a[3]).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const node = { tag, attrs, children: [], text: '' };
      stack[stack.length - 1].children.push(node);
      if (!m[3]) stack.push(node);
    }
    return rootN;
  }

  // ---------- colori ----------
  const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00', orange: '#ffa500', gray: '#808080', grey: '#808080', silver: '#c0c0c0', gold: '#ffd700', brown: '#a52a2a', pink: '#ffc0cb', purple: '#800080', navy: '#000080', maroon: '#800000', olive: '#808000', teal: '#008080', lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', magenta: '#ff00ff', fuchsia: '#ff00ff', darkgreen: '#006400', darkred: '#8b0000', crimson: '#dc143c', tan: '#d2b48c', beige: '#f5f5dc', ivory: '#fffff0', khaki: '#f0e68c', salmon: '#fa8072', tomato: '#ff6347', coral: '#ff7f50', chocolate: '#d2691e', skyblue: '#87ceeb', royalblue: '#4169e1', forestgreen: '#228b22', firebrick: '#b22222', lightgray: '#d3d3d3', lightgrey: '#d3d3d3', darkgray: '#a9a9a9', darkgrey: '#a9a9a9', whitesmoke: '#f5f5f5', snow: '#fffafa' };
  const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  function parseColor(c, current) {
    if (!c) return null;
    c = String(c).trim().toLowerCase();
    if (c === 'none' || c === 'transparent') return 'none';
    if (c === 'currentcolor') return current || '#000000';
    if (NAMED[c]) return NAMED[c];
    let m;
    if ((m = c.match(/^#([0-9a-f]{3,4})$/))) return '#' + m[1].slice(0, 3).split('').map(x => x + x).join('');
    if ((m = c.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/))) return '#' + m[1];
    if ((m = c.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/))) return '#' + [m[1], m[2], m[3]].map(v => hex2(v.endsWith('%') ? parseFloat(v) * 2.55 : parseFloat(v))).join('');
    return null;
  }
  const rgb = (h) => { h = /^#[0-9a-f]{6}$/i.test(h || '') ? h : '#808080'; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  function lab(h) {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const [r, g, b] = rgb(h).map(f);
    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
    x = t(x); y = t(y); z = t(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  // il colore della lista più vicino (distanza percepita)
  const nearest = (h, list) => { let bi = 0, bd = Infinity; list.forEach((c, i) => { const d = dist(h, c); if (d < bd) { bd = d; bi = i; } }); return bi; };
  // riduce i colori (pesati per area) a k gruppi; restituisce i colori dei gruppi, il più esteso per primo
  function reduceColors(items, k) {
    items = items.filter(it => it.w > 0);
    const uniq = [...new Set(items.map(i => i.hex))];
    if (uniq.length <= k) {
      const w = {}; for (const it of items) w[it.hex] = (w[it.hex] || 0) + it.w;
      return uniq.sort((a, b) => w[b] - w[a]);
    }
    const pts = items.map(it => ({ l: lab(it.hex), w: it.w, hex: it.hex }));
    // centri iniziali: i colori più estesi e lontani tra loro
    const byW = pts.slice().sort((a, b) => b.w - a.w), cs = [byW[0].l];
    while (cs.length < k) {
      let best = null, bd = -1;
      for (const p of pts) { const d = Math.min(...cs.map(c => Math.hypot(c[0] - p.l[0], c[1] - p.l[1], c[2] - p.l[2]))) * Math.sqrt(p.w); if (d > bd) { bd = d; best = p; } }
      cs.push(best.l.slice());
    }
    let asg = [];
    for (let it = 0; it < 20; it++) {
      asg = pts.map(p => { let bi = 0, bd = Infinity; cs.forEach((c, i) => { const d = Math.hypot(c[0] - p.l[0], c[1] - p.l[1], c[2] - p.l[2]); if (d < bd) { bd = d; bi = i; } }); return bi; });
      for (let i = 0; i < k; i++) {
        const mem = pts.filter((p, j) => asg[j] === i), W = mem.reduce((s, p) => s + p.w, 0);
        if (W > 0) cs[i] = [0, 1, 2].map(d => mem.reduce((s, p) => s + p.l[d] * p.w, 0) / W);
      }
    }
    // per ogni gruppo prendo il colore vero più esteso (niente colori inventati)
    const groups = cs.map((c, i) => {
      const mem = pts.filter((p, j) => asg[j] === i), W = mem.reduce((s, p) => s + p.w, 0);
      const w = {}; for (const p of mem) w[p.hex] = (w[p.hex] || 0) + p.w;
      const top = Object.keys(w).sort((a, b) => w[b] - w[a])[0];
      return { hex: top, W };
    }).filter(g => g.hex && g.W > 0);
    return groups.sort((a, b) => b.W - a.W).map(g => g.hex);
  }

  // ---------- trasformazioni ----------
  const I = [1, 0, 0, 1, 0, 0];
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const nums = (s) => (String(s || '').match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
  function parseTransform(t) {
    let m = I.slice();
    const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
    let r;
    while ((r = re.exec(t || ''))) {
      const v = nums(r[2]);
      let k = I;
      if (r[1] === 'matrix' && v.length >= 6) k = v.slice(0, 6);
      else if (r[1] === 'translate') k = [1, 0, 0, 1, v[0] || 0, v[1] || 0];
      else if (r[1] === 'scale') k = [v[0], 0, 0, v.length > 1 ? v[1] : v[0], 0, 0];
      else if (r[1] === 'rotate') {
        const a = (v[0] || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        k = [c, s, -s, c, 0, 0];
        if (v.length >= 3) k = mul(mul([1, 0, 0, 1, v[1], v[2]], k), [1, 0, 0, 1, -v[1], -v[2]]);
      } else if (r[1] === 'skewX') k = [1, 0, Math.tan((v[0] || 0) * Math.PI / 180), 1, 0, 0];
      else if (r[1] === 'skewY') k = [1, Math.tan((v[0] || 0) * Math.PI / 180), 0, 1, 0, 0];
      m = mul(m, k);
    }
    return m;
  }

  // ---------- path ----------
  // restituisce una lista di contorni {pts, closed} già trasformati e appiattiti (curve → segmenti)
  function pathToPolys(d, M, tol) {
    const out = [];
    const toks = String(d || '').match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
    let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, qx = 0, qy = 0, cur = null, prev = '';
    const isCmd = (t) => /^[a-z]$/i.test(t);
    const num = () => parseFloat(toks[i++]);
    // l'arco "flag" può essere scritto attaccato (es. 0 01 → 0,0,1): li separo se serve
    const flag = () => { const t = toks[i]; if (t === '0' || t === '1') { i++; return +t; } if (/^[01]\d/.test(t)) { toks[i] = t.slice(1); return +t[0]; } i++; return +t ? 1 : 0; };
    const push = (px, py) => cur.push(ap(M, px, py));
    const segs = (len) => Math.max(2, Math.min(24, Math.ceil(len / tol)));
    const start = (px, py) => { if (cur && cur.length > 1) out.push({ pts: cur, closed: false }); cur = []; push(px, py); sx = px; sy = py; };
    const cubic = (x1, y1, x2, y2, x3, y3) => {
      const n = segs(Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2));
      for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3); }
      cx = x2; cy = y2; x = x3; y = y3;
    };
    const quad = (x1, y1, x2, y2) => {
      const n = segs(Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1));
      for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push(u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2); }
      qx = x1; qy = y1; x = x2; y = y2;
    };
    const arc = (rx, ry, phi, fa, fs, x2, y2) => {
      if (rx === 0 || ry === 0) { push(x2, y2); x = x2; y = y2; return; }
      rx = Math.abs(rx); ry = Math.abs(ry);
      const p = phi * Math.PI / 180, cp = Math.cos(p), sp = Math.sin(p);
      const dx = (x - x2) / 2, dy = (y - y2) / 2, x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
      let lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
      if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
      let co = Math.sqrt(Math.max(0, num2 / den)); if (fa === fs) co = -co;
      const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
      const ccx = cp * cxp - sp * cyp + (x + x2) / 2, ccy = sp * cxp + cp * cyp + (y + y2) / 2;
      const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
      const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
      let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
      if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
      const n = Math.max(2, Math.min(48, Math.ceil(Math.abs(dt) * Math.max(rx, ry) / tol)));
      for (let k = 1; k <= n; k++) { const t = t1 + dt * k / n; push(ccx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, ccy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp); }
      x = x2; y = y2;
    };
    while (i < toks.length) {
      if (isCmd(toks[i])) cmd = toks[i++];
      else if (!cmd) { i++; continue; }
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === 'Z') {
        if (cur && cur.length > 1) out.push({ pts: cur, closed: true });
        cur = null; x = sx; y = sy; prev = 'Z';
        continue;
      }
      if (i >= toks.length || isCmd(toks[i])) continue;
      if (C === 'M') { const nx = ox + num(), ny = oy + num(); start(nx, ny); x = nx; y = ny; cmd = rel ? 'l' : 'L'; }
      else {
        if (!cur) start(x, y);
        if (C === 'L') { x = ox + num(); y = oy + num(); push(x, y); }
        else if (C === 'H') { x = ox + num(); push(x, y); }
        else if (C === 'V') { y = oy + num(); push(x, y); }
        else if (C === 'C') { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; cubic(...a); }
        else if (C === 'S') { const r1x = /[CS]/.test(prev) ? 2 * x - cx : x, r1y = /[CS]/.test(prev) ? 2 * y - cy : y; const a = [ox + num(), oy + num(), ox + num(), oy + num()]; cubic(r1x, r1y, ...a); }
        else if (C === 'Q') { const a = [ox + num(), oy + num(), ox + num(), oy + num()]; quad(...a); }
        else if (C === 'T') { const r1x = /[QT]/.test(prev) ? 2 * x - qx : x, r1y = /[QT]/.test(prev) ? 2 * y - qy : y; quad(r1x, r1y, ox + num(), oy + num()); }
        else if (C === 'A') { const rx = num(), ry = num(), ph = num(), fa = flag(), fs = flag(); arc(rx, ry, ph, fa, fs, ox + num(), oy + num()); }
        else { i++; }
      }
      prev = C;
    }
    if (cur && cur.length > 1) out.push({ pts: cur, closed: false });
    return out;
  }
  function ellipsePts(cx, cy, rx, ry, M, tol) {
    const n = Math.max(12, Math.min(96, Math.ceil(2 * Math.PI * Math.max(rx, ry) / tol)));
    const p = []; for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n; p.push(ap(M, cx + rx * Math.cos(a), cy + ry * Math.sin(a))); }
    return p;
  }
  function rectPts(x, y, w, h, rx, ry, M, tol) {
    if (!(w > 0 && h > 0)) return null;
    rx = Math.min(rx || ry || 0, w / 2); ry = Math.min(ry || rx || 0, h / 2);
    if (!rx || !ry) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(q => ap(M, q[0], q[1]));
    const p = [], n = 6, corner = (ccx, ccy, a0) => { for (let k = 0; k <= n; k++) { const a = a0 + Math.PI / 2 * k / n; p.push(ap(M, ccx + rx * Math.cos(a), ccy + ry * Math.sin(a))); } };
    corner(x + w - rx, y + ry, -Math.PI / 2); corner(x + w - rx, y + h - ry, 0); corner(x + rx, y + h - ry, Math.PI / 2); corner(x + rx, y + ry, Math.PI);
    return p;
  }

  // ---------- documento ----------
  function parse(text, opts = {}) {
    const doc = parseXML(String(text || ''));
    const svg = (function find(n) { if (n.tag === 'svg') return n; for (const c of n.children) { const r = find(c); if (r) return r; } return null; })(doc) || doc;
    const ids = {}, css = {};
    (function walk(n) { if (n.attrs && n.attrs.id) ids[n.attrs.id] = n; if (n.tag === 'style') parseCSS(n.text, css); n.children.forEach(walk); })(svg);
    // dimensioni: viewBox, altrimenti width/height
    let vb = nums(svg.attrs.viewBox);
    if (vb.length !== 4) { const w = parseFloat(svg.attrs.width) || 0, h = parseFloat(svg.attrs.height) || 0; vb = w && h ? [0, 0, w, h] : null; }
    const tol = opts.tol || (vb ? Math.max(vb[2], vb[3]) / 120 : 0.5);
    const shapes = [];
    const gradColor = (id) => {
      const g = ids[id]; if (!g) return null;
      let stops = g.children.filter(c => c.tag === 'stop');
      if (!stops.length && g.attrs['xlink:href']) { const h = ids[g.attrs['xlink:href'].slice(1)]; if (h) stops = h.children.filter(c => c.tag === 'stop'); }
      const cols = stops.map(s => parseColor(styleOf(s)['stop-color'] || s.attrs['stop-color'])).filter(c => c && c !== 'none');
      if (!cols.length) return null;
      const avg = [0, 1, 2].map(k => cols.reduce((s, c) => s + rgb(c)[k], 0) / cols.length);
      return '#' + avg.map(hex2).join('');
    };
    const styleOf = (n) => {
      const st = {};
      if (n.attrs.class) for (const c of n.attrs.class.split(/\s+/)) Object.assign(st, css['.' + c] || {});
      Object.assign(st, css[n.tag] || {});
      if (n.attrs.style) for (const kv of n.attrs.style.split(';')) { const [k, v] = kv.split(':'); if (k && v) st[k.trim()] = v.trim(); }
      return st;
    };
    const paint = (v, cur) => {
      if (!v) return null;
      const m = String(v).match(/url\(\s*#([^)\s]+)\s*\)/);
      if (m) return gradColor(m[1]) || '#808080';
      return parseColor(v, cur);
    };
    function visit(n, inh, depth) {
      if (depth > 40) return;
      if (['defs', 'clipPath', 'mask', 'symbol', 'title', 'desc', 'metadata', 'style', 'linearGradient', 'radialGradient', 'pattern', 'filter', 'marker', 'text'].includes(n.tag)) return;
      const st = styleOf(n), A = (k) => (st[k] !== undefined ? st[k] : n.attrs[k]);
      if (A('display') === 'none' || A('visibility') === 'hidden') return;
      const s = Object.assign({}, inh);
      if (A('color')) s.color = parseColor(A('color')) || s.color;
      if (A('fill') !== undefined) s.fill = paint(A('fill'), s.color);
      if (A('stroke') !== undefined) s.stroke = paint(A('stroke'), s.color);
      if (A('fill-rule') !== undefined) s.rule = A('fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero';
      if (A('stroke-width') !== undefined) s.sw = parseFloat(A('stroke-width')) || 0;
      if (A('opacity') !== undefined) s.opacity = (s.opacity === undefined ? 1 : s.opacity) * parseFloat(A('opacity'));
      if (A('fill-opacity') !== undefined) s.fo = parseFloat(A('fill-opacity'));
      if (A('stroke-opacity') !== undefined) s.so = parseFloat(A('stroke-opacity'));
      if (n.attrs.transform) s.M = mul(s.M, parseTransform(n.attrs.transform));
      let polys = null;
      const f = (k) => parseFloat(n.attrs[k]) || 0;
      if (n.tag === 'g' || n.tag === 'svg' || n.tag === 'a' || n.tag === '#root') { n.children.forEach(c => visit(c, s, depth + 1)); return; }
      if (n.tag === 'use') {
        const id = (n.attrs.href || n.attrs['xlink:href'] || '').replace(/^#/, ''), ref = ids[id];
        if (ref) { const s2 = Object.assign({}, s, { M: mul(s.M, [1, 0, 0, 1, f('x'), f('y')]) }); visit(ref.tag === 'symbol' ? Object.assign({}, ref, { tag: 'g' }) : ref, s2, depth + 1); }
        return;
      }
      if (n.tag === 'path') polys = pathToPolys(n.attrs.d, s.M, tol);
      else if (n.tag === 'rect') { const p = rectPts(f('x'), f('y'), f('width'), f('height'), f('rx'), f('ry'), s.M, tol); polys = p ? [{ pts: p, closed: true }] : []; }
      else if (n.tag === 'circle') polys = [{ pts: ellipsePts(f('cx'), f('cy'), f('r'), f('r'), s.M, tol), closed: true }];
      else if (n.tag === 'ellipse') polys = [{ pts: ellipsePts(f('cx'), f('cy'), f('rx'), f('ry'), s.M, tol), closed: true }];
      else if (n.tag === 'polygon' || n.tag === 'polyline') {
        const v = nums(n.attrs.points), p = []; for (let k = 0; k + 1 < v.length; k += 2) p.push(ap(s.M, v[k], v[k + 1]));
        polys = [{ pts: p, closed: n.tag === 'polygon' }];
      } else if (n.tag === 'line') polys = [{ pts: [ap(s.M, f('x1'), f('y1')), ap(s.M, f('x2'), f('y2'))], closed: false }];
      if (!polys || !polys.length) return;
      const op = s.opacity === undefined ? 1 : s.opacity;
      const scale = Math.sqrt(Math.abs(s.M[0] * s.M[3] - s.M[1] * s.M[2]));
      const fill = s.fill === undefined ? '#000000' : s.fill;
      // le velature quasi trasparenti (ombre, riflessi) non si stampano
      if (fill && fill !== 'none' && op * (s.fo === undefined ? 1 : s.fo) >= 0.35 && n.tag !== 'line' && n.tag !== 'polyline')
        shapes.push({ fill, rule: s.rule || 'nonzero', polys: polys.map(q => q.pts).filter(q => q.length >= 3) });
      if (s.stroke && s.stroke !== 'none' && (s.sw === undefined ? 1 : s.sw) > 0 && op * (s.so === undefined ? 1 : s.so) >= 0.35)
        shapes.push({ stroke: s.stroke, width: (s.sw === undefined ? 1 : s.sw) * scale, lines: polys });
    }
    visit(svg, { M: I.slice(), color: '#000000' }, 0);
    // riquadro del disegno
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const sh of shapes) for (const q of (sh.polys || sh.lines.map(l => l.pts))) for (const [x, y] of q) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { shapes, viewBox: vb, bounds: isFinite(x0) ? [x0, y0, x1, y1] : null };
  }
  function parseCSS(text, css) {
    const re = /([^{}]+)\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(text || ''))) {
      const props = {};
      for (const kv of m[2].split(';')) { const [k, v] = kv.split(':'); if (k && v) props[k.trim()] = v.trim(); }
      for (const sel of m[1].split(',')) { const k = sel.trim(); css[k] = Object.assign(css[k] || {}, props); }
    }
  }

  // ---------- dati compatti ----------
  // Douglas-Peucker: toglie i punti inutili (tolleranza nelle unità del disegno)
  function simplify(pts, tol) {
    if (pts.length < 4) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(); let md = 0, mi = -1;
      const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1e-9;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (d > md) { md = d; mi = i; } }
      if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return pts.filter((p, i) => keep[i]);
  }
  // anello chiuso: lo spezzo nel punto più lontano dal primo, così le due metà hanno estremi distinti
  function simplifyRing(pts, tol) {
    if (pts.length < 6) return pts;
    let far = 0, fd = -1;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > fd) { fd = d; far = i; } });
    const a = simplify(pts.slice(0, far + 1), tol), b = simplify(pts.slice(far).concat([pts[0]]), tol);
    return a.concat(b.slice(1, -1));
  }
  const ringArea = (q) => { let a = 0; for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; a += x0 * y1 - x1 * y0; } return Math.abs(a / 2); };
  // forme in formato compatto, dentro un quadrato 32×32 con y verso l'alto:
  // [colore, tipo (0 nonzero, 1 evenodd, 2 tratto), [[x,y,x,y,…], …], spessore del tratto, chiusi]
  // + tavolozza a 4 colori (approssimata dalle aree, il colore più esteso per primo)
  function pack(parsed, tol = 0.015) {
    const b = parsed.bounds; if (!b) return null;
    const W = b[2] - b[0], Hh = b[3] - b[1], k = 32 / Math.max(W, Hh, 1e-9), ox = (32 - W * k) / 2, oy = (32 - Hh * k) / 2;
    const T = ([x, y]) => [+((x - b[0]) * k + ox).toFixed(2), +(32 - ((y - b[1]) * k + oy)).toFixed(2)];
    const f = [], w = {};
    for (const sh of parsed.shapes) {
      if (sh.polys) {
        const ps = sh.polys.map(q => simplifyRing(q.map(T), tol)).filter(q => q.length >= 3);
        if (!ps.length) continue;
        f.push([sh.fill, sh.rule === 'evenodd' ? 1 : 0, ps.map(q => q.flat())]);
        w[sh.fill] = (w[sh.fill] || 0) + ps.reduce((s, q) => s + ringArea(q), 0);
      } else if (sh.lines) {
        const ps = sh.lines.map(l => ({ q: simplify(l.pts.map(T), tol), c: l.closed })).filter(l => l.q.length >= 2);
        if (!ps.length) continue;
        f.push([sh.stroke, 2, ps.map(l => l.q.flat()), +(sh.width * k).toFixed(3), ps.map(l => (l.c ? 1 : 0))]);
        w[sh.stroke] = (w[sh.stroke] || 0) + ps.reduce((s, l) => s + l.q.length, 0) * sh.width * k * 0.5;
      }
    }
    if (!f.length) return null;
    return { f, h: [], pal: reduceColors(Object.entries(w).map(([hex, ww]) => ({ hex, w: ww })), 4) };
  }

  const API = { parse, parseColor, lab, nearest, reduceColors, dist, simplify, simplifyRing, pack };
  root.SPLAB_SVG = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);

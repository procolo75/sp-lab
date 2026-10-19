# Unisce sorgenti e librerie in un solo file index.html che funziona offline.
# Uso: npm install && python3 build.py
import base64, re, os
nm='node_modules/'
def rd(p): return open(p, encoding='utf-8').read()
man = rd(nm+'manifold-3d/manifold.js')
man = man.replace('import.meta.url', '(globalThis.location&&location.href||"")')
man = man.replace('export default Module', 'window.ManifoldModule=Module')
assert 'export ' not in man.split('window.ManifoldModule')[1]
wasm = base64.b64encode(open(nm+'manifold-3d/manifold.wasm','rb').read()).decode()
parts = [
  rd(nm+'three/build/three.min.js'),
  rd(nm+'three/examples/js/controls/OrbitControls.js'),
  man,
  'window.__MANIFOLD_WASM__="%s";' % wasm,
  rd('src/fonts.js'),
  rd('src/logos.js'),
  rd('src/svg.js'),
  rd('src/emoji.js'),
  rd('src/telefoni.js'),
  rd('src/geom.js'),
  rd('src/natale.js'),
  rd('src/supporti.js'),
  rd('src/cover.js'),
  rd('src/powerbank.js'),
  rd('src/schede.js'),
  rd('src/racchette.js'),
  rd('src/app.js'),
]
def tag(js): return '<script>\n' + js.replace('</script', '<\\/script') + '\n</script>'
vendor = '\n'.join(tag(p) for p in parts)
logo_sp, logo_volto = rd('assets/logo-sp.svg'), rd('assets/logo-volto.svg')
page = rd('src/page.html').replace('<!--VENDOR-->', vendor).replace('<!--LOGO_SP-->', logo_sp).replace('<!--LOGO_VOLTO-->', logo_volto)
# icona della scheda: il monogramma SP in blu
icon = 'data:image/svg+xml;base64,' + base64.b64encode(logo_sp.replace('currentColor', '#1f5fbf').encode()).decode()
full = '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="icon" type="image/svg+xml" href="' + icon + '">\n</head>\n<body>\n' + page + '\n</body>\n</html>\n'
open('index.html','w').write(full)  # pagina unica, funziona offline
print(len(page)//1024, 'KB')

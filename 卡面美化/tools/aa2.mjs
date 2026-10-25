// 矢量卡框与烘焙卡框在小尺寸下的对照。用法: node tools/aa2.mjs [vec|baked] → tools/aa2.html
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const { frameSvg, frameCss, overlay } = await import('../sv2.mjs?' + Date.now());
const mode = process.argv[2] || 'vec';
const art = '<rect x="67" y="118" width="399" height="480" fill="#24366e"/>';
const metal = 'data:image/webp;base64,' + readFileSync(join(here, '..', 'baked', 'frame-gold.webp')).toString('base64');
const ov = (s) => s.replace('$NAME', '铁誓骑士长·格兰').replace('$COST', '5').replace('$ATK', '4').replace('$LIFE', '5');
const layered = (mid) => `<svg class="svFrame" viewBox="0 0 530 687">${art}</svg>${mid}<svg class="svFrame" viewBox="0 0 530 687">${ov(overlay())}</svg>`;
const svg = mode === 'bg' ? layered(`<div style="position:absolute;inset:0;background:url(${metal}) 0 0/100% 100% no-repeat"></div>`) : mode === 'img' ? layered(`<img src="${metal}" style="position:absolute;inset:0;width:100%;height:100%">`) : (mode === 'vec' ? frameSvg(art)
  : `<svg class="svFrame" viewBox="0 0 530 687" xmlns="http://www.w3.org/2000/svg">${art}<image href="${metal}" x="0" y="0" width="530" height="687"/>${overlay()}</svg>`)
  .replace('$NAME', '铁誓骑士长·格兰').replace('$COST', '5').replace('$ATK', '4').replace('$LIFE', '5');
const cell = (w, x) => `<div style="position:absolute;left:${x}px;top:10px;width:${w}px;aspect-ratio:530/687;--gem:#f0b419">${svg}</div>`;
writeFileSync(join(here, 'aa2.html'), `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#f4ede0}${frameCss}</style></head><body>${cell(300, 10)}${cell(240, 330)}${cell(200, 590)}</body></html>`);

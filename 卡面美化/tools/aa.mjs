// 小尺寸锯齿测试页：同一卡框按 300/240px 显示。用法: node tools/aa.mjs → tools/aa.html
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const { frameSvg, frameCss } = await import('../sv2.mjs?' + Date.now());
const svg = frameSvg('<rect x="67" y="118" width="399" height="480" fill="#24366e"/>')
  .replace('$NAME', '铁誓骑士长·格兰').replace('$COST', '5').replace('$ATK', '4').replace('$LIFE', '5');
const cell = (w, x) => `<div style="position:absolute;left:${x}px;top:10px;width:${w}px;aspect-ratio:530/687">${svg}</div>`;
writeFileSync(join(here, 'aa.html'), `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#f4ede0}${frameCss}</style></head><body>${cell(+(process.env.W1 || 300), 10)}${cell(+(process.env.W2 || 240), 330)}</body></html>`);

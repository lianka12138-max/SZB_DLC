// 把卡框金属层（sv2.mjs 的 metalSvg）烘焙成 2 倍透明 WebP。
// SVG 光照滤镜在小尺寸下按设备像素计算，边缘会出现糙边和亮点；预渲染成大图后交给浏览器缩小，任何尺寸都平滑。
// 用法: node tools/bake.mjs → baked/frame-gold.webp（改了 sv2.mjs 后需重跑，再跑 card.mjs）
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const { metalSvg, frameCss } = await import('../sv2.mjs?' + Date.now());

const SCALE = 2, QUALITY = 85;
const html = join(here, 'bake.html');
writeFileSync(html, `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;background:transparent}${frameCss}</style></head>` +
  `<body><div style="position:relative;width:530px;height:687px">${metalSvg()}</div></body></html>`);

// Chrome 截图路径含中文时偶尔写不出文件，先输出到临时目录
const tmp = join(process.env.TEMP || here, 'sv-bake.png');
if (existsSync(tmp)) rmSync(tmp);
execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=530,687', `--force-device-scale-factor=${SCALE}`,
  '--default-background-color=00000000', `--screenshot=${tmp}`, 'file:///' + html.replace(/\\/g, '/'),
], { stdio: 'ignore' });
for (let i = 0; i < 20 && !existsSync(tmp); i++) execFileSync('powershell', ['-c', 'Start-Sleep -Milliseconds 300']);
if (!existsSync(tmp)) throw new Error('截图失败');

mkdirSync(join(root, 'baked'), { recursive: true });
const out = join(root, 'baked', 'frame-gold.webp');
execFileSync('python', ['-c', `
from PIL import Image
im = Image.open(r'''${tmp}''').convert('RGBA')
assert im.size == (${530 * SCALE}, ${687 * SCALE}), im.size
im.save(r'''${out}''', 'WEBP', quality=${QUALITY}, method=6)
`]);
console.log('已烘焙:', out);

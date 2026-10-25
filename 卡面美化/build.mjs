// 生成「影之诗卡面」正则 JSON 与本地预览页。用法: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---------- 职业纹章（作为 mask 使用，白色即可见区域） ----------
function gearPath(cx, cy, teeth, rOut, rIn, hole) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const w = step * 0.22;
    const p = (r, ang) => `${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`;
    pts.push(p(rIn, a - step / 2 + w), p(rOut, a - w), p(rOut, a + w), p(rIn, a + step / 2 - w));
  }
  const ring = `M${pts[0]} L${pts.slice(1).join(' L')}Z`;
  const h = `M${cx - hole} ${cy} a${hole} ${hole} 0 1 0 ${hole * 2} 0 a${hole} ${hole} 0 1 0 ${-hole * 2} 0Z`;
  return ring + h;
}
const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const EMBLEMS = {
  精灵: [
    ['M50 62 C30 60 16 42 20 20 C40 22 54 40 50 62Z', 'nonzero'],
    ['M50 62 C70 60 84 42 80 20 C60 22 46 40 50 62Z', 'nonzero'],
    ['M50 54 C41 42 41 22 50 6 C59 22 59 42 50 54Z', 'nonzero'],
    ['M47.5 58 H52.5 V94 H47.5Z M50 80 C40 78 32 72 28 64 C38 64 46 70 50 80Z M50 86 C60 84 68 78 72 70 C62 70 54 76 50 86Z', 'nonzero'],
  ],
  皇家: [
    ['M12 72 L18 30 L34 50 L50 20 L66 50 L82 30 L88 72Z M12 78 H88 V90 H12Z', 'nonzero'],
    [circle(18, 25, 6) + circle(50, 15, 6) + circle(82, 25, 6), 'nonzero'],
  ],
  巫师: [
    [circle(50, 50, 48) + circle(50, 50, 42) + 'M50 12 L82.9 69 L17.1 69Z M50 88 L17.1 31 L82.9 31Z', 'evenodd'],
  ],
  龙族: [
    ['M4 50 Q50 6 96 50 Q50 94 4 50Z M50 20 Q62 50 50 80 Q38 50 50 20Z', 'evenodd'],
  ],
  死灵法师: [
    ['M50 8 C25 8 13 27 13 46 C13 60 21 67 29 71 L29 88 L71 88 L71 71 C79 67 87 60 87 46 C87 27 75 8 50 8Z'
      + circle(36, 44, 9) + circle(64, 44, 9) + 'M50 55 L44 65 L56 65Z M41 74 H45 V88 H41Z M48 74 H52 V88 H48Z M55 74 H59 V88 H55Z', 'evenodd'],
  ],
  吸血鬼: [
    ['M50 40 L46 28 L43 40 C33 34 18 30 3 34 C10 40 12 45 12 52 C18 47 25 49 27 57 C31 53 37 55 39 63 C43 59 47 61 50 70 C53 61 57 59 61 63 C63 55 69 53 73 57 C75 49 82 47 88 52 C88 45 90 40 97 34 C82 30 67 34 57 40 L54 28 Z', 'nonzero'],
  ],
  主教: [
    ['M44 8 H56 V34 H82 V46 H56 V92 H44 V46 H18 V34 H44Z', 'nonzero'],
    ['M30 14 L35 21 L30 28 L25 21Z M70 14 L75 21 L70 28 L65 21Z M30 54 L35 61 L30 68 L25 61Z M70 54 L75 61 L70 68 L65 61Z', 'nonzero'],
  ],
  复仇者: [
    [gearPath(50, 50, 10, 47, 37, 15), 'evenodd'],
  ],
};

function svgDataUri(paths) {
  const body = paths.map(([d, rule]) => `<path fill='#fff' fill-rule='${rule}' d='${d}'/>`).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${body}</svg>`;
  const enc = svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E');
  return `url("data:image/svg+xml,${enc}")`;
}

const emblemCss = Object.entries(EMBLEMS)
  .map(([cls, paths]) => {
    const uri = svgDataUri(paths);
    return `.svc.c-${cls} .svc-emblem{-webkit-mask-image:${uri};mask-image:${uri}}`;
  })
  .join('');

// ---------- CSS 压缩与安全检查 ----------
function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}
const css = minify(readFileSync(join(here, 'card.css'), 'utf8')) + emblemCss;
const forbidden = css.match(/[*_<>&`~]/g);
if (forbidden) {
  throw new Error('CSS 含有禁用字符: ' + [...new Set(forbidden)].join(' '));
}

// ---------- 正则 ----------
// 头行: 品质|类型|职业|费用|名称|攻/生|标签|纹字|插画
// 其后: 效果行（任意多行），可选的「——描述」行
const H = '[ \\t]*';
const F = '([^|\\n]*?)';
const pattern =
  '<SVCard>\\s*' +
  F + H + '\\|' + H + // 1 品质
  F + H + '\\|' + H + // 2 类型
  F + H + '\\|' + H + // 3 职业
  F + H + '\\|' + H + // 4 费用
  F + H + '\\|' + H + // 5 名称
  '([^|\\n/]*?)' + H + '/?' + H + F + H + '\\|' + H + // 6 攻 7 生
  F + H + '\\|' + H + // 8 标签
  F + H + '\\|' + H + // 9 纹字
  F + H + '\\r?\\n' + // 10 插画
  '([\\s\\S]*?)' + // 11 效果
  '(?:\\r?\\n' + H + '——' + H + '([^\\n]*?))?' + // 12 描述
  '\\s*</SVCard>';
const findRegex = `/${pattern}/g`;

const html =
  '<div class="svc q-$1 t-$2 c-$3"><div class="svc-frame"><div class="svc-inner">' +
  '<div class="svc-head"><div class="svc-cost"><span>$4</span></div><div class="svc-name">$5</div></div>' +
  '<div class="svc-art"><div class="svc-bg"></div><div class="svc-emblem"></div><div class="svc-glyph">$9</div>' +
  '<div class="svc-illu" style="background-image:url(\'$10\')"></div>' +
  '<div class="svc-atk"><span>$6</span></div><div class="svc-life"><span>$7</span></div></div>' +
  '<div class="svc-gem"></div>' +
  '<div class="svc-meta"><span class="svc-type">$2 · $3</span><span class="svc-tags">$8</span><span class="svc-q">$1</span></div>' +
  '<div class="svc-fx">$11</div><div class="svc-desc">$12</div>' +
  '</div></div></div>';
const replaceString = `<style>${css}</style>${html}`;

const regexJson = {
  id: '7c2f4a1e-3b9d-4e8a-9f61-5d0c2b7e8a41',
  scriptName: '影之诗卡面',
  findRegex,
  replaceString,
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: true,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
};
writeFileSync(join(here, 'regex-影之诗卡面.json'), JSON.stringify(regexJson, null, 4), 'utf8');

// ---------- 预览页 ----------
const samples = readFileSync(join(here, 'samples.txt'), 'utf8');
const preview = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>影之诗卡面预览</title>
<style>body{margin:0;padding:24px;background:#e9e2d6;font-family:"Noto Serif SC",serif}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:18px 22px;align-items:start}
.dark{background:#1b1a1f}</style></head><body>
<div class="grid" id="out"></div>
<script>
const regexJson = ${JSON.stringify(regexJson)};
// 模拟 SillyTavern 的替换：$n 取捕获组，未匹配的组替换为空串
function runRegex(script, text) {
  const m = script.findRegex.match(/^\\/([\\s\\S]*)\\/([a-z]*)$/);
  const re = new RegExp(m[1], m[2]);
  return text.replace(re, function () {
    const args = arguments;
    return script.replaceString.replace(/\\$(\\d+)/g, (_, n) => args[Number(n)] || '');
  });
}
const raw = ${JSON.stringify(samples)};
const blocks = raw.split(/\\n(?=<SVCard>)/);
document.getElementById('out').innerHTML = blocks.map(b => '<div>' + runRegex(regexJson, b) + '</div>').join('');
</script></body></html>`;
writeFileSync(join(here, 'preview.html'), preview, 'utf8');

console.log('CSS 字符数:', css.length, '| replaceString 字符数:', replaceString.length);

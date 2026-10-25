// 影之诗风格卡面原型：皇家 · 金卡 · 从者。用法: node sv-frame.mjs → sv-preview.html
// 画布与参考图一致: 530 x 687
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const f = (n) => Number(n.toFixed(1));
const TAU = Math.PI * 2;
const WSCALE = 1.1; // 花雕整体粗细

// ---------- 花雕几何 ----------
// 渐细的涡卷: 沿对数螺线生成中心线，再按宽度向两侧偏移成闭合轮廓
function volute({ cx, cy, r0, r1, a0, turns, w0, w1, dir = 1, steps = 70, eye = true }) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + dir * t * turns * TAU;
    const r = r0 * Math.pow(r1 / r0, t);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), t]);
  }
  return ribbon(pts, w0, w1) + (eye ? dot(pts[steps][0], pts[steps][1], w1 * 1.5 * WSCALE) : '');
}
// 任意中心线 → 渐细带状轮廓
function ribbon(pts, w0, w1) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
    const t = p[2] ?? i / (pts.length - 1);
    const w = (w0 + (w1 - w0) * t) * WSCALE;
    L.push([p[0] - ty * w, p[1] + tx * w]);
    R.push([p[0] + ty * w, p[1] - tx * w]);
  }
  const s = (q) => `${f(q[0])} ${f(q[1])}`;
  return `M${s(L[0])}L${L.slice(1).map(s).join('L')}L${R.reverse().map(s).join('L')}Z`;
}
// 三次贝塞尔中心线采样
function bez(p0, p1, p2, p3, steps = 30) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      t,
    ]);
  }
  return out;
}
const dot = (x, y, r) => `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
// 尖叶
const leaf = (x0, y0, x1, y1, bulge) => {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
  const nx = (-dy / l) * bulge, ny = (dx / l) * bulge;
  return `M${f(x0)} ${f(y0)}Q${f(mx + nx)} ${f(my + ny)} ${f(x1)} ${f(y1)}Q${f(mx - nx)} ${f(my - ny)} ${f(x0)} ${f(y0)}Z`;
};
const mirror = (d, cx = 265) => `<g transform="translate(${cx * 2} 0) scale(-1 1)">${d}</g>`;
const gold = (d, extra = '') => `<path d="${d}" fill="url(#svGold)" filter="url(#svBevel)" ${extra}/>`;

// ---------- 顶部拱冠 ----------
const CX = 265;
const crestOuter = `M88 74 C100 30 172 4 ${CX} 4 C358 4 430 30 442 74 Z`;
const crestInner = `M104 74 C118 40 180 18 ${CX} 18 C350 18 412 40 426 74 Z`;
const crestRibs = `<path d="M104 74 C118 40 180 18 ${CX} 18 C350 18 412 40 426 74" fill="none" stroke="#3e2506" stroke-width="1.6" opacity=".7"/>`;

// 涡卷 + 引尾: 尾巴从 tail 起，沿贝塞尔接入螺线起点
function scrollWithTail(v, tail, c1, c2, wt0) {
  const sx = v.cx + v.r0 * Math.cos(v.a0), sy = v.cy + v.r0 * Math.sin(v.a0);
  return ribbon(bez(tail, c1, c2, [sx, sy]), wt0, v.w0) + volute(v);
}

function crestOrnament() {
  // 底部小穹顶
  const dome = ribbon(bez([CX - 58, 74], [CX - 52, 46], [CX + 52, 46], [CX + 58, 74]), 3.2, 3.2);
  const half =
    // 心形对卷: 从中心 V 尖向上外卷
    scrollWithTail({ cx: CX - 27, cy: 40, r0: 13, r1: 5.5, a0: 0.35, turns: 0.82, w0: 5, w1: 3, dir: -1 },
      [CX, 64], [CX - 3, 58], [CX - 9, 50], 2.4) +
    // 侧卷: 尾巴沿拱顶内侧向外下方
    scrollWithTail({ cx: CX - 80, cy: 43, r0: 15, r1: 6, a0: Math.PI * 0.8, turns: 0.85, w0: 5.2, w1: 3, dir: -1 },
      [CX - 146, 70], [CX - 126, 68], [CX - 104, 64], 1.6) +
    // 外卷
    scrollWithTail({ cx: CX - 142, cy: 52, r0: 11, r1: 4.6, a0: Math.PI * 0.2, turns: 0.8, w0: 4.2, w1: 2.6, dir: 1 },
      [CX - 112, 70], [CX - 116, 65], [CX - 121, 59], 1.6);
  return `<path d="${dome}" fill="url(#svGold)" filter="url(#svBevel)"/>` +
    gold(half) + mirror(gold(half)) +
    // 中心菱饰
    gold(`M${CX} 14 L${CX + 13} 32 L${CX} 52 L${CX - 13} 32 Z`) +
    `<path d="M${CX} 21 L${CX + 6.5} 32 L${CX} 44 L${CX - 6.5} 32 Z" fill="#fff4c8" opacity=".35"/>`;
}

// ---------- 外框 ----------
const frame = `M56 58 H478 Q486 58 486 66 V644 Q486 652 478 652 H56 Q48 652 48 644 V66 Q48 58 56 58 Z M66 126 V632 H468 V126 Z`;
// 横幅下方、画框内角的大涡卷（左右各一，左侧大半被费用宝石遮住）
function cornerScroll() {
  const d =
    scrollWithTail({ cx: 448, cy: 150, r0: 15, r1: 3, a0: Math.PI * 1.05, turns: 0.95, w0: 5.2, w1: 2, dir: 1 },
      [468, 132], [452, 128], [436, 136], 3) +
    ribbon(bez([462, 160], [460, 176], [462, 190], [468, 204]), 4.5, 0.8) +
    leaf(430, 134, 412, 130, 4);
  return gold(d) + mirror(gold(d));
}
// 横幅右端上翘的尖角
const hornTR = () => gold(ribbon(bez([466, 74], [474, 66], [478, 58], [474, 48]), 4, 0.6) + dot(474, 49, 1.6));

// ---------- 名称横幅 ----------
function banner() {
  const outer = 'M100 68 H464 L482 86 V110 L464 128 H100 Z';
  const inner = 'M104 74 H461 L475 88 V108 L461 122 H104 Z';
  return gold(outer) +
    `<path d="${inner}" fill="url(#svBanner)"/>` +
    `<path d="M104 74 H461 L466 79 H104 Z" fill="#fff" opacity=".14"/>` +
    `<path d="${inner}" fill="none" stroke="#2a0a10" stroke-width="1.6" opacity=".85"/>` +
    `<path d="${outer}" fill="none" stroke="#3a2306" stroke-width="1.4"/>`;
}

// ---------- 底部镶条与职业宝石 ----------
function bottomBar() {
  // 镶条: 两端高、向中心下沉，中心由宝石托顶起
  const band = `M104 594 C150 594 190 606 ${CX - 30} 606 L${CX} 588 L${CX + 30} 606 C340 606 380 594 426 594 L430 644 H100 Z`;
  const recess = `M118 604 C160 604 194 616 ${CX - 28} 616 L${CX} 602 L${CX + 28} 616 C336 616 370 604 412 604 L416 634 H114 Z`;
  const half =
    scrollWithTail({ cx: CX - 46, cy: 620, r0: 9.5, r1: 2.2, a0: Math.PI * 1.15, turns: 0.9, w0: 4, w1: 1.6, dir: -1 },
      [CX - 22, 628], [CX - 30, 632], [CX - 50, 634], 2) +
    ribbon(bez([CX - 50, 610], [CX - 80, 604], [CX - 110, 612], [CX - 146, 622]), 3.4, 0.8) +
    leaf(CX - 60, 628, CX - 96, 626, 4);
  return gold(band) +
    `<path d="${recess}" fill="url(#svGoldDeep)"/>` +
    `<path d="${band}" fill="none" stroke="#3a2306" stroke-width="1.4"/>` +
    gold(half) + mirror(gold(half)) +
    // 宝石托
    gold(`M${CX} 584 L${CX + 27} 614 L${CX} 644 L${CX - 27} 614 Z`) + gem(CX, 614, 19);
}
// 刻面宝石: 主色走 CSS 变量，明暗靠半透明刻面叠加
function gem(x, y, r) {
  const T = [x, y - r], R = [x + r, y], B = [x, y + r], L = [x - r, y], c = [x, y], ti = [x, y - r * 0.45], ri = [x + r * 0.45, y], bi = [x, y + r * 0.45], li = [x - r * 0.45, y];
  const p = (...q) => `M${q.map((a) => `${f(a[0])} ${f(a[1])}`).join('L')}Z`;
  return `<path d="${p(T, R, B, L)}" fill="var(--svGem)"/>` +
    `<path d="${p(T, ri, ti) + p(T, ti, li)}" fill="#fff" opacity=".55"/>` +
    `<path d="${p(L, ti, li) + p(T, L, li)}" fill="#fff" opacity=".22"/>` +
    `<path d="${p(R, bi, ri) + p(B, R, bi)}" fill="#000" opacity=".35"/>` +
    `<path d="${p(B, li, bi) + p(L, B, li)}" fill="#000" opacity=".18"/>` +
    `<path d="${p(ti, ri, bi, li)}" fill="var(--svGem)" opacity=".85"/>` +
    `<path d="${p(ti, ri, c)}" fill="#fff" opacity=".35"/>` +
    `<path d="${p(T, R, B, L)}" fill="none" stroke="#3a2306" stroke-width="1.2"/>`;
}

// ---------- 角标: 费用 / 攻击 / 生命 ----------
const num = (x, y, size, id) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" class="svNum">${id}</text>`;
function costBadge() {
  return `<circle cx="62" cy="90" r="57" fill="url(#svGold)" filter="url(#svBevel)"/>` +
    `<circle cx="62" cy="90" r="47.5" fill="#2a1a05" opacity=".6"/>` +
    `<circle cx="62" cy="90" r="46" fill="url(#svCost)"/>` +
    `<ellipse cx="62" cy="68" rx="34" ry="19" fill="url(#svGloss)"/>` +
    num(62, 119, 82, '$COST');
}
// 箭形: 尖顶 → 宽肩 → 收腰 → 横翼 → 下方短柄
const ATK = 'M50 0 L100 48 L84 62 V82 L100 96 H70 V118 H30 V96 H0 L16 82 V62 L0 48 Z';
const LIFE = 'M4 10 Q50 -4 96 10 V62 Q96 98 50 118 Q4 98 4 62 Z';
function statBadge(path, tx, ty, fillId, val) {
  return `<g transform="translate(${tx} ${ty})">` +
    `<path d="${path}" fill="url(#svGold)" filter="url(#svBevel)" transform="translate(-5 -5) scale(1.1)"/>` +
    `<path d="${path}" fill="url(#${fillId})" stroke="#2a1606" stroke-width="1.2"/>` +
    `<path d="${path}" fill="url(#svBadgeGloss)"/>` +
    num(50, 86, 70, val) + `</g>`;
}

// ---------- 组装 ----------
const defs = `<defs>
<linearGradient id="svGold" x1="0" y1="0" x2="0.35" y2="1">
 <stop offset="0" stop-color="#fff4c2"/><stop offset=".22" stop-color="#f0c95f"/><stop offset=".48" stop-color="#c38a2c"/>
 <stop offset=".66" stop-color="#9a6418"/><stop offset=".84" stop-color="#e2b555"/><stop offset="1" stop-color="#fbe7a6"/>
</linearGradient>
<linearGradient id="svGoldDeep" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#4a300a"/><stop offset=".35" stop-color="#7a5a22"/><stop offset=".8" stop-color="#a8853c"/><stop offset="1" stop-color="#c9a454"/>
</linearGradient>
<linearGradient id="svBanner" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#8a3440"/><stop offset=".55" stop-color="#6a2330"/><stop offset="1" stop-color="#4a1520"/>
</linearGradient>
<radialGradient id="svCost" cx=".45" cy=".7" r=".75">
 <stop offset="0" stop-color="#7fe05a"/><stop offset=".45" stop-color="#36ad2c"/><stop offset="1" stop-color="#146a14"/>
</radialGradient>
<linearGradient id="svGloss" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="svAtk" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#4a9df0"/><stop offset=".55" stop-color="#1f6ccc"/><stop offset="1" stop-color="#0f3f8c"/>
</linearGradient>
<linearGradient id="svLife" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#e05048"/><stop offset=".55" stop-color="#b52a2a"/><stop offset="1" stop-color="#7a1414"/>
</linearGradient>
<linearGradient id="svBadgeGloss" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<filter id="svBevel" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
 <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="b"/>
 <feSpecularLighting in="b" surfaceScale="3.2" specularConstant="1.05" specularExponent="16" lighting-color="#fff4d0" result="s">
  <feDistantLight azimuth="235" elevation="40"/>
 </feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
 <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k2="1" k3=".8" result="lit"/>
 <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="sh"/>
 <feOffset in="sh" dy="1.6" result="sho"/>
 <feFlood flood-color="#2a1400" flood-opacity=".75"/>
 <feComposite in2="sho" operator="in" result="shc"/>
 <feMerge><feMergeNode in="shc"/><feMergeNode in="lit"/></feMerge>
</filter>
</defs>`;

const svg = `<svg class="svFrame" viewBox="0 0 530 687" xmlns="http://www.w3.org/2000/svg">${defs}
<path d="${frame}" fill="url(#svGold)" fill-rule="evenodd" filter="url(#svBevel)"/>
<path d="${frame}" fill="none" stroke="#3a2306" stroke-width="1.5"/>
<rect x="54" y="64" width="426" height="582" rx="4" fill="none" stroke="#fff6cc" stroke-opacity=".6" stroke-width="1.2"/>
<rect x="62" y="122" width="410" height="514" fill="none" stroke="#6b4310" stroke-width="2"/>
<rect x="66" y="126" width="402" height="506" fill="none" stroke="#2a1606" stroke-width="1.6"/>
<path d="${crestOuter}" fill="url(#svGold)" filter="url(#svBevel)"/>
<path d="${crestOuter}" fill="none" stroke="#3a2306" stroke-width="1.4"/>
<path d="${crestInner}" fill="url(#svGoldDeep)"/>
${crestRibs}
${crestOrnament()}
${cornerScroll()}
${hornTR()}
${banner()}
<text x="290" y="107" text-anchor="middle" class="svName">$NAME</text>
${bottomBar()}
${costBadge()}
${statBadge(ATK, 12, 560, 'svAtk', '$ATK')}
${statBadge(LIFE, 418, 564, 'svLife', '$LIFE')}
</svg>`;

const css = `
.svCard{position:relative;width:min(100%,360px);aspect-ratio:530/687;margin:1em auto;--svGem:#e8a514}
.svCard.c-精灵{--svGem:#2fae4a}.svCard.c-皇家{--svGem:#e8a514}.svCard.c-巫师{--svGem:#2f6fe0}.svCard.c-龙族{--svGem:#d9661c}
.svCard.c-死灵法师{--svGem:#8a3fc8}.svCard.c-吸血鬼{--svGem:#c8203a}.svCard.c-主教{--svGem:#f2ead0}.svCard.c-复仇者{--svGem:#1fb8c0}
.svArt{position:absolute;left:12.45%;top:18.34%;width:75.85%;height:73.65%;overflow:hidden;background:
 radial-gradient(ellipse at 50% 38%,#fff6d6 0%,#f0c868 18%,#b97c2a 46%,#5a3410 80%,#2a1606 100%)}
.svArt::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 40px rgba(0,0,0,.55)}
.svGlyph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
 font:700 150px/1 "LXGW ZhenKai GB","KaiTi","STKaiti",serif;color:#fff3c8;opacity:.9;
 text-shadow:0 0 18px rgba(255,220,140,.9),0 4px 0 rgba(90,50,10,.6)}
.svFrame{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.svNum{font-family:"Times New Roman",Georgia,serif;font-weight:700;fill:#fffbea;stroke:#3a2a12;stroke-width:2.6;paint-order:stroke;stroke-linejoin:round;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55))}
.svName{font-family:"Noto Serif SC","Source Han Serif SC","SimSun",serif;font-size:25px;font-weight:700;letter-spacing:4px;fill:#fff8ec}
`;

const card = (name, cost, atk, life, glyph, cls) =>
  `<div class="svCard c-${cls}"><div class="svArt"><div class="svGlyph">${glyph}</div></div>` +
  svg.replace('$NAME', name).replace('$COST', cost).replace('$ATK', atk).replace('$LIFE', life) + `</div>`;

const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>影之诗卡面原型</title>
<style>body{margin:0;padding:24px;background:#fff;display:flex;gap:28px;flex-wrap:wrap;justify-content:center}
.ref{width:360px}
.zoom{width:560px;height:300px;overflow:hidden;position:relative;border:1px dashed #ccc}
.zoom>img,.zoom>.svCard{position:absolute;left:-200px;top:-10px;width:1060px;max-width:none;margin:0}
.zoom.low>img,.zoom.low>.svCard{left:-10px;top:-1100px}
${css}</style></head><body>
<img class="ref" src="../随从金卡.png">
${card('铁誓骑士长·格兰', 5, 4, 5, '盾', '皇家')}
<div class="zoom"><img src="../随从金卡.png"></div>
<div class="zoom">${card('铁誓骑士长·格兰', 5, 4, 5, '盾', '皇家')}</div>
<div class="zoom low"><img src="../随从金卡.png"></div>
<div class="zoom low">${card('铁誓骑士长·格兰', 5, 4, 5, '盾', '皇家')}</div>
</body></html>`;
writeFileSync(join(here, 'sv-preview.html'), html, 'utf8');
console.log('svg 字符数:', svg.length);

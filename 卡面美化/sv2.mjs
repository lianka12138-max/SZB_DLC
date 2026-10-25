// 影之诗风格卡面 v2 原型：皇家 · 金卡 · 从者
// 坐标系与参考图 随从金卡.png 一致（530 x 687），各部件位置按参考图实测。
// 用法: node sv2.mjs → sv2-preview.html（成品）与 sv2-compare.html（与参考图逐区对照）
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const r1 = (n) => Math.round(n * 10) / 10;
const P = (q) => `${r1(q[0])} ${r1(q[1])}`;
const TAU = Math.PI * 2;
const CX = 266.5;

// ================= 几何工具 =================
// Catmull-Rom 样条采样
function spline(pts, seg = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      const c = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// 对数螺线采样
function spiral(cx, cy, ra, rb, a0, turns, dir, steps = 44) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = a0 + dir * t * turns * TAU, r = ra * Math.pow(rb / ra, t);
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
// 中心线 → 变宽带状闭合轮廓；width(t) 给出半宽
function band(pts, width) {
  const n = pts.length, L = [], R = [];
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[n - 1] || 1;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const w = width(cum[i] / total);
    L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  return `<path d="M${P(L[0])}L${L.slice(1).map(P).join('L')}L${R.reverse().map(P).join('L')}Z"/>`;
}
const lin = (a, b) => (t) => a + (b - a) * t;
// 三段宽度: 起点 → 峰值(位置 m) → 终点
const swell = (a, peak, b, m = 0.5) => (t) => (t < m ? a + (peak - a) * (t / m) : peak + (b - peak) * ((t - m) / (1 - m)));
const disc = (x, y, r) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`;
const poly = (...q) => `M${q.map(P).join('L')}Z`;
// 涡卷: 引尾样条 + 螺线 + 卷心圆钮（各自独立 path，避免绕向相反挖洞）
// 返回 [外环, 卷心]：卷心单独成层，用自己的轮廓和落影压在外环上，才能看出卷与卷之间的缝
function scroll({ tail, c, ra, rb, a0, turns, dir, wTail, wMax, wEnd, knob = 1.4, peakAt = 0.35, split = 0.62 }) {
  const sp = spiral(c[0], c[1], ra, rb, a0, turns, dir);
  const tl = spline([...tail, sp[0]], 8);
  const line = [...tl.slice(0, -1), ...sp];
  const end = sp[sp.length - 1];
  const W = swell(wTail, wMax, wEnd, peakAt);
  const k = tl.length - 1 + Math.round(sp.length * split);
  // 用整条线的弧长参数取宽度，两段在接缝处宽度连续
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const T = cum[cum.length - 1], tk = cum[k] / T;
  const outer = band(line.slice(0, k + 2), (t) => W(t * cum[k + 1] / T));
  const inner = band(line.slice(k), (t) => W(tk + t * (1 - tk))) + disc(end[0], end[1], wEnd * knob);
  return [outer, inner];
}
// 两层合成：先画所有外环，再画所有卷心
const layers = (...items) => {
  const a = [], b = [];
  for (const it of items) { if (Array.isArray(it)) { a.push(it[0]); b.push(it[1]); } else a.push(it); }
  return [a.join(''), b.join('')];
};
const ornL = ([a, b]) => orn(sym(a)) + orn(sym(b));
// 沿 x = CX 镜像
const mirror = (inner) => `<g transform="translate(${CX * 2} 0) scale(-1 1)">${inner}</g>`;
const sym = (inner) => inner + mirror(inner);
// 法向偏移一条折线（用于从外拱得到内拱）
function offset(pts, d) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [p[0] - (ty / l) * d, p[1] + (tx / l) * d];
  });
}

// ================= 部件 =================
// embF: 平面金件（只有斜面光，无投影）；embO: 立体花雕（圆管光影 + 落影）
const G = (d, fill = 'gB', f = 'embF') => `<path d="${d}" fill="url(#${fill})" filter="url(#${f})"/>`;
const orn = (inner) => `<g filter="url(#embO)" fill="url(#gO)">${inner}</g>`;
const ink = (d, w = 1.1, c = '#3a2a10') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
const line = (d, c, w = 1, o = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;

// --- 外框: x 46~487，y 54~640；画窗 x 67~466；圆角 8 ---
function frame() {
  const outer = 'M54 54H479Q487 54 487 62V632Q487 640 479 640H54Q46 640 46 632V62Q46 54 54 54Z';
  const win = 'M67 118V598H466V118Z';
  return `<path d="${outer}${win}" fill="url(#gF)" fill-rule="evenodd" filter="url(#embF)"/>` +
    // 外缘整圈亮线
    line('M48.5 62V632M485.5 62V632M54 638.5H479', '#fff09e', 1.4, 0.9) +
    // 凹槽 + 槽内侧亮线
    line('M59.5 64V606H473.5V64Z', '#8e6832', 3.2) +
    line('M62.5 66V604M470.5 66V604', '#dec266', 1.2) +
    ink(outer, 1.2, '#393124') + ink(win, 1.6, '#393124');
}

// --- 顶部拱冠: 外带 + 暗线 + 内带 + 暗槽 + 凹陷底板 ---
const archOuterPts = spline([[92, 66], [114, 50], [131, 40], [151, 30], [176, 20], [212, 10], [246, 5], [CX, 3.6],
  [287, 5], [321, 10], [357, 20], [382, 30], [402, 40], [419, 50], [441, 66]], 8);
const archCut = (d) => offset(archOuterPts, d).filter((p) => p[1] < 70);
const closed = (pts) => `M${pts.map(P).join('L')}Z`;
function crest() {
  const outerD = closed(archOuterPts), in1 = closed(archCut(12.5)), in2 = closed(archCut(16.5));
  let s = G(outerD, 'gA') + G(in1, 'gB2') + ink(in1, 1.1, '#6a4c22') +
    `<path d="${in2}" fill="url(#gR)"/>` +
    `<path d="${in2}" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="3" clip-path="url(#cpCrest)"/>` +
    ink(in2, 1, '#503618') + ink(outerD, 1.2);
  // 内穹顶: 实心弓形，上缘中线 y56.3，下缘贴横幅顶
  const dome = `M206 66.5C222 58 240 56.3 ${CX} 56.3C293 56.3 311 58 327 66.5Z`;
  // 左半花雕。参考图实测: 侧卷环心(204.5,43.5)、心卷环心(239,41.5)
  const C = { rb: 2.6, turns: 1.0, wEnd: 2.1, knob: 1.5, peakAt: 0.45 };
  const half = layers(
    // 上尾叶片: 贴内带下沿向右上扫，在环顶接入侧卷
    band(spline([[126, 61], [150, 51.5], [178, 41.5], [198, 35]], 8), swell(0.5, 5.5, 3, 0.6)),
    // 侧卷: 从环顶接入，顺时针绕右、下、左卷入
    scroll({ ...C, tail: [[196, 35.2]], c: [204.5, 43.5], ra: 7.4, a0: -Math.PI / 2, dir: 1, wTail: 3, wMax: 3.2 }),
    // 下尾 + 月牙: 自左下沿环底向右，再沿环右侧上翻，尖端顶住内带
    // 宽度分段: 下尾渐粗 → 月牙中段最厚 → 尖端收细
    // 月牙尖端向左回卷，并进侧卷顶部，形成带外壳的 "6" 形
    band(spline([[138, 67], [160, 62.5], [182, 57.5], [198, 55.5], [210, 54.5], [219, 49], [223, 40], [220.5, 33.5], [214, 30.8], [207, 32.2]], 8),
      (t) => (t < 0.5 ? 0.6 + 3.6 * t / 0.5 : t < 0.8 ? 4.2 : 4.2 - (t - 0.8) / 0.2 * 3.4)),
    // 心卷: 尾从菱饰左角拱起再落进环顶，逆时针绕左、下、右卷入
    scroll({ ...C, tail: [[252.5, 37], [251, 31], [245.5, 31.2], [241, 33.2]], c: [239, 41.5], ra: 8.2, a0: -Math.PI / 2, dir: -1, wTail: 1.2, wMax: 3.9 }),
    // 心卷环底到菱饰下尖的托带
    band(spline([[235.5, 50.5], [244, 54], [255, 55.6], [CX, 54]], 6), swell(2.2, 3, 1.0, 0.3)));
  // 中心菱饰: 金框 + 四边内凹的亮金星形，上尖落在内带下沿
  const T = [CX, 22.5], Rr = [CX + 14.5, 37.5], B = [CX, 53.5], Ll = [CX - 14.5, 37.5], O = [CX, 37.5];
  const t2 = [CX, 26.5], r2 = [CX + 10.5, 37.5], b2 = [CX, 49.5], l2 = [CX - 10.5, 37.5];
  // 每条边的中点向中心收 3px 作为二次曲线控制点
  const pull = (a, b) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(O[0] - m[0], O[1] - m[1]); return [m[0] + (O[0] - m[0]) * 3 / d, m[1] + (O[1] - m[1]) * 3 / d]; };
  const star = `M${P(t2)}Q${P(pull(t2, r2))} ${P(r2)}Q${P(pull(r2, b2))} ${P(b2)}Q${P(pull(b2, l2))} ${P(l2)}Q${P(pull(l2, t2))} ${P(t2)}Z`;
  const dia = G(poly(T, Rr, B, Ll), 'gO', 'embO') +
    `<path d="${star}" fill="url(#gDia)"/>` +
    `<path d="M${P(t2)}Q${P(pull(t2, r2))} ${P(r2)}L${P(O)}Z" fill="#fff" opacity=".3"/>` +
    `<path d="M${P(b2)}Q${P(pull(r2, b2))} ${P(r2)}L${P(O)}Z" fill="#8a5a14" opacity=".18"/>` +
    ink(star, 0.8, '#8a6428');
  s += G(dome, 'gO') + ink(dome, 0.9, '#6a4c22');
  s += ornL(half);
  s += dia;
  return s;
}

// --- 名称横幅 ---
function banner() {
  const out = 'M96 67H466L478 79V116L466 128H96Z';
  const red = 'M100 75H461L471 85V113L461 123H100Z';
  return G(out, 'gBanG') + ink(out) +
    `<path d="${red}" fill="url(#gBan)"/>` +
    ink(red, 1, '#4a1820') +
    line('M100 74.2H461.3L471.8 84.7', '#fee284', 0.9) +
    line('M100 123.8H461.3L471.8 113.3', '#fde7a4', 0.9);
}
// 横幅右端与外框之间的阶梯托架 + 弯钩尖角（全部在框内）
function cornerCap() {
  // 阶梯托架：顶部带一个城垛缺口
  const cap = 'M465 69V62.5H468.5V65H472V61H477V69Z';
  // 横幅金边上的尖角，尖端约 (459,56.5)
  const horn = band(spline([[447, 69.5], [455, 63.5], [457.8, 60], [459, 56.5]], 6), lin(4.8, 0.5));
  return G(cap, 'gF') + ink(cap, 0.6, '#6a4c22') + orn(horn);
}
// 横幅下、画窗内角: 托架衬底 + 大涡卷 + 下垂尖叶
function innerCorner() {
  // 实心鼓包托架: 内缘经 (430,139)、(442,152)、(455,163) 落到画窗边 (466,178)
  const back = 'M418 127H466V178Q462 160 450 156Q430 150 418 127Z';
  const s = layers(
    // "@" 形大卷: 左端并进托架上沿，顺时针绕一圈卷入，环心 (447.5,140)
    // 托架凹边的金边，大卷尾从这条边升起
    band(spline([[420, 128], [430, 141], [442, 150], [452, 155]], 6), swell(1, 3, 2, 0.5)),
    scroll({ tail: [[436, 136], [439, 131.5]], c: [447.5, 140], ra: 12.5, rb: 3.5, a0: -Math.PI * 0.6, turns: 1.05, dir: 1, wTail: 2.6, wMax: 5.5, wEnd: 2.2, knob: 1.5, peakAt: 0.4 }),
    // 卷右下垂下的尖叶，尖端压在框内沿上
    band(spline([[452, 150], [461, 156], [468, 165], [471, 176]], 6), swell(3.6, 4.5, 0.6, 0.35)));
  return sym(`<path d="${back}" fill="url(#gR2)"/>` + ink(back, 1, '#4a3412')) + ornL(s);
}

// --- 底部镶条: 拱起上缘、透镜凹槽、月牙卷、葱形尖角、职业宝石 ---
function bottom() {
  const top = spline([[92, 617], [120, 612], [180, 601], [230, 597], [CX, 594], [303, 597], [353, 601], [413, 612], [441, 617]], 8);
  const barD = `M${top.map(P).join('L')}L441 640H92Z`;
  // 杏仁形凹槽: 夹在上弧带与下带之间
  const eye = sym('<path d="M165 631Q200 612 232 608Q237 612 236.5 618Q205 624 165 631Z"/>');
  const half =
    // 上弧带: 自左下扫起，越过弧顶后顺时针下翻，回头向左以舌尖收住
    band(spline([[116, 634], [148, 621], [180, 607], [205, 599.5], [222, 597.5], [232, 602], [233.5, 609], [226, 613.2], [215, 612.8], [209.5, 613]], 8), swell(1.2, 4.5, 2.6, 0.62)) +
    disc(209.5, 613, 2.2) +
    // 下带 + 尖刺: 一条 S 线，从杏仁凹槽下沿起，绕过卷底，陡立成葱形尖刺贴住宝石框
    band(spline([[164.5, 631], [192, 626], [216, 623.5], [232, 620.5], [240, 613.5], [245, 605.5], [250, 598.5]], 8), swell(0.6, 3.6, 0.3, 0.5));
  const gT = [CX, 597.5], gR2 = [CX + 16.5, 614], gB2 = [CX, 630], gL = [CX - 16.5, 614];
  return G(barD) + ink(barD, 1.2) +
    `<g fill="url(#gLens)">${eye}</g>` + `<g fill="none" stroke="#6b4e28" stroke-width=".8">${eye}</g>` +
    // 外侧斜凹线
    sym(line('M170 604.4Q132 613 102 627', '#6b4e28', 1.5) + line('M170 606.2Q132 614.8 103 628.8', '#fff0a0', 0.9, 0.7)) +
    // 底边亮带
    `<path d="M94 632H439V638H94Z" fill="url(#gEdge)"/>` +
    orn(sym(half)) +
    G(poly(gT, gR2, gB2, gL), 'gO', 'embO') + gem(CX, 614, 11.5);
}
function gem(x, y, r) {
  const T = [x, y - r], R = [x + r, y], B = [x, y + r], L = [x - r, y];
  const ti = [x, y - r * 0.42], ri = [x + r * 0.42, y], bi = [x, y + r * 0.42], li = [x - r * 0.42, y];
  return `<g class="svGem"><path d="${poly(T, R, B, L)}" fill="var(--gem)"/>` +
    `<path d="${poly(T, R, ri, ti)}" fill="#fff" opacity=".45"/>` +
    `<path d="${poly(T, ti, li, L)}" fill="#fff" opacity=".22"/>` +
    `<path d="${poly(R, B, bi, ri)}" fill="#000" opacity=".38"/>` +
    `<path d="${poly(B, L, li, bi)}" fill="#000" opacity=".18"/>` +
    `<path d="${poly(ti, ri, bi, li)}" fill="var(--gem)"/>` +
    `<path d="${poly(ti, ri, [x, y])}" fill="#fff" opacity=".4"/>` +
    `<path d="${poly(T, R, B, L)}" fill="none" stroke="#2a1806" stroke-width="1.1"/></g>`;
}

// --- 角标 ---
const numText = (x, y, size, v) => `<text x="${x}" y="${y}" class="svNum" font-size="${size}" text-anchor="middle">${v}</text>`;
function cost() {
  const cx = 63, cy = 95;
  return `<circle cx="${cx}" cy="${cy}" r="59.5" fill="url(#gCostRim)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="57.5" fill="none" stroke="#f4e2b0" stroke-width="1.2" opacity=".35"/>` +
    `<circle cx="${cx}" cy="${cy}" r="59.5" fill="none" stroke="#6b4f26" stroke-width="1"/>` +
    `<circle cx="${cx}" cy="${cy}" r="53.5" fill="#6b4f26"/>` +
    `<circle cx="${cx}" cy="${cy}" r="52.5" fill="url(#gCost)"/>` +
    `<path d="M${cx - 49} ${cy - 4}A49 49 0 0 1 ${cx + 49} ${cy - 4}Q${cx} ${cy + 6} ${cx - 49} ${cy - 4}Z" fill="url(#gGloss)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="52.5" fill="none" stroke="#0d3a0a" stroke-opacity=".25" stroke-width="2"/>` +
    numText(cx, cy + 33, 98, '$COST');
}
// 攻击: 尖顶 → 宽肩 → 收腰 → 厚翼板 → 内收 → 杆身平底（参考图逐行实测）
const ATK = 'M67.5 551L116 611L102 636L121.5 640L113.5 665L91 667L88.5 683L46.5 683L44 667L21.5 665L13.5 640L33 636L19 611Z';
// 生命: 直线顶边，近直两侧，尖拱底
const LIFE = 'M421 572L466 557L511 572Q514 606 512 628Q509 655 466 686Q423 655 420 628Q418 606 421 572Z';
// 等宽内金边: 用裁切 + 双倍宽描边实现，凹形轮廓也均匀
function badge(id, path, fill, val, nx, ny, ns) {
  const cl = `clip-path="url(#${id})"`;
  return `<path d="${path}" fill="url(#${fill})"/>` +
    `<path d="${path}" fill="url(#gVig)"/>` +
    // 由宽到窄: 内侧暗线 → 金 → 高光芯 → 外侧暗边
    `<path d="${path}" fill="none" stroke="#4e3412" stroke-width="18" stroke-linejoin="round" ${cl}/>` +
    `<path d="${path}" fill="none" stroke="url(#gRim)" stroke-width="16" stroke-linejoin="round" ${cl}/>` +
    `<path d="${path}" fill="none" stroke="#ffeeb0" stroke-width="11" stroke-linejoin="round" opacity=".35" ${cl}/>` +
    `<path d="${path}" fill="none" stroke="#8a6430" stroke-width="2.4" stroke-linejoin="round" ${cl}/>` +
    ink(path, 0.8, '#7a5a2a') +
    numText(nx, ny, ns, val);
}

// ================= 渐变与滤镜 =================
// k1: 漫射乘底色；k2: 暗部下限（保留底色比例，背光面呈棕而不发黑）
const lighting = (std, ss, kd, ks, se, lc, shadow, k3 = 0.6, k1 = 1.12, k2 = 0) => `
 <feGaussianBlur in="SourceAlpha" stdDeviation="${std}" result="a"/>
 <feDiffuseLighting in="a" surfaceScale="${ss}" diffuseConstant="${kd}" lighting-color="#fff" result="dif"><feDistantLight azimuth="235" elevation="48"/></feDiffuseLighting>
 <feComposite in="SourceGraphic" in2="dif" operator="arithmetic" k1="${k1}" k2="${k2}" result="sh"/>
 <feSpecularLighting in="a" surfaceScale="${ss}" specularConstant="${ks}" specularExponent="${se}" lighting-color="${lc}" result="sp"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting>
 <feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/>
 <feComposite in="sh" in2="sp2" operator="arithmetic" k2="1" k3="${k3}" result="lit"/>
 <feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/>` + (shadow ? `
 <feMorphology in="SourceAlpha" operator="dilate" radius=".5" result="ol"/>
 <feFlood flood-color="#8a6430"/><feComposite in2="ol" operator="in" result="olc"/>
 <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="ds"/><feOffset in="ds" dx=".4" dy="1" result="dso"/>
 <feFlood flood-color="#5a3a14" flood-opacity=".3"/><feComposite in2="dso" operator="in" result="dsc"/>
 <feMerge><feMergeNode in="dsc"/><feMergeNode in="olc"/><feMergeNode in="lit2"/></feMerge>` : '');
const lg = (id, stops, extra = 'x1="0" y1="0" x2="0" y2="1"') =>
  `<linearGradient id="${id}" ${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
const defs = `<defs>
${lg('gB', [[0, '#f3d683'], [0.35, '#ddb562'], [0.7, '#d2a654'], [1, '#c99b4c']])}
${lg('gB2', [[0, '#be9648'], [0.6, '#e8c870'], [1, '#fbe98d']])}
${lg('gF', [[0, '#dcb462'], [1, '#d4aa58']])}
${lg('gO', [[0, '#f8e08c'], [0.5, '#e6c068'], [1, '#d0a250']])}
${lg('gDia', [[0, '#fffbd0'], [0.5, '#fff0a0'], [1, '#f2d27a']])}
${lg('gBanG', [[0, '#d8ae60'], [0.5, '#c99a54'], [1, '#c49250']])}
${lg('gBan', [[0, '#682f35'], [0.5, '#6f3439'], [1, '#652e33']])}
${lg('gR', [[0, '#d8bc72'], [0.5, '#c2a25a'], [1, '#9c7a3c']])}
${lg('gA', [[0, '#fffcb4'], [0.55, '#f6e494'], [1, '#e2c070']])}
${lg('gR2', [[0, '#c99d52'], [1, '#b38a46']])}
${lg('gLens', [[0, '#c9a058'], [0.6, '#a87c3e'], [1, '#8a6430']])}
${lg('gEdge', [[0, '#ffdb77'], [1, '#ffffc5']])}
${lg('gGloss', [[0, '#fff', 0.05], [0.7, '#fff', 0.22], [1, '#fff', 0.3]])}
${lg('gAtk', [[0, '#0f4fbe'], [0.55, '#1d63c9'], [1, '#3b88d8']])}
${lg('gLife', [[0, '#9c2228'], [0.55, '#bc3236'], [1, '#cf4140']])}
${lg('gRim', [[0, '#f2d385'], [0.5, '#d8ae5a'], [1, '#b4863e']])}
${lg('gCostRim', [[0, '#f2d385'], [0.5, '#d4a957'], [1, '#9c7232']], 'x1="0" y1="0" x2="1" y2="1"')}
<radialGradient id="gCost" cx=".5" cy=".95" r=".95">
 <stop offset="0" stop-color="#8ef03c"/><stop offset=".35" stop-color="#4cc22a"/><stop offset=".75" stop-color="#22841c"/><stop offset="1" stop-color="#155e14"/>
</radialGradient>
<radialGradient id="gVig" cx=".5" cy=".55" r=".62">
 <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/>
</radialGradient>
<clipPath id="cpCrest"><path d="${closed(archCut(16.5))}"/></clipPath>
<filter id="embF" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">${lighting(1.5, 2.6, 1.18, 1.1, 40, '#fffbe2', false)}</filter>
<filter id="embO" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">${lighting(1.6, 2.4, 1.18, 0.5, 30, '#ffe3a0', true, 0.35, 0.72, 0.42)}</filter>
<clipPath id="cA"><path d="${ATK}"/></clipPath><clipPath id="cL"><path d="${LIFE}"/></clipPath>
</defs>`;
// 供外部单独放置：同页多张卡共用同名 id，defs 必须放在不会被隐藏（如折叠）的位置
export const frameDefs = defs;

// art: 画在边框之下的插画层（坐标同卡面，画窗 x67~466、y118~598），由 card.mjs 提供
// withDefs=false 时不内嵌 defs，由调用方用 frameDefs 另行放置
export const frameSvg = (art = '', withDefs = true) => `<svg class="svFrame" viewBox="0 0 530 687" xmlns="http://www.w3.org/2000/svg">${withDefs ? defs : ''}
${art}
${frame()}
${crest()}
${innerCorner()}
${banner()}
${cornerCap()}
<text x="286" y="109.5" text-anchor="middle" class="svName">$NAME</text>
${bottom()}
${cost()}
${badge('cA', ATK, 'gAtk', '$ATK', 67.5, 655, 92)}
${badge('cL', LIFE, 'gLife', '$LIFE', 466, 654, 100)}
</svg>`;
const svg = frameSvg();
const OVER = /<g class="svGem">[\s\S]*?<\/g>|<text[\s\S]*?<\/text>/g;
export const metalSvg = () => frameSvg('').replace(OVER, '');
export const overlay = () => (frameSvg('').match(OVER) || []).join('');
export { ATK, LIFE };

export const frameCss = `
.svFrame{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.svNum{font-family:"Times New Roman",Georgia,serif;font-weight:700;fill:#fffbe8;stroke:#fffbe8;stroke-width:1px;paint-order:stroke;filter:drop-shadow(0 0 2px rgba(20,10,0,.9)) drop-shadow(0 0 5px rgba(20,10,0,.5))}
.svName{font-family:"Noto Serif SC","Source Han Serif SC","SimSun",serif;font-size:27px;font-weight:600;letter-spacing:3px;fill:#fbf3ea;filter:drop-shadow(0 1px 1px rgba(30,0,6,.8))}
`;

// 以下仅在直接运行本文件时生成边框对照页
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
const css = `
.svCard{position:relative;width:min(100%,360px);aspect-ratio:530/687;margin:1em auto;--gem:#f0b419}
.svArt{position:absolute;left:12.45%;top:17.9%;width:75.7%;height:70.8%;overflow:hidden;background:
 radial-gradient(ellipse at 50% 42%,#fff7da 0%,#f2cd72 20%,#bd822c 48%,#5e3812 82%,#2c1806 100%)}
.svArt::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 42px rgba(0,0,0,.55)}
.svGlyph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
 font:700 150px/1 "LXGW ZhenKai GB","KaiTi","STKaiti",serif;color:#fff3c8;opacity:.9;text-shadow:0 0 18px rgba(255,220,140,.9),0 4px 0 rgba(90,50,10,.6)}
.svFrame{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.svNum{font-family:"Times New Roman",Georgia,serif;font-weight:700;fill:#fffbe8;stroke:#fffbe8;stroke-width:1px;paint-order:stroke;filter:drop-shadow(0 0 2px rgba(20,10,0,.9)) drop-shadow(0 0 5px rgba(20,10,0,.5))}
.svName{font-family:"Noto Serif SC","Source Han Serif SC","SimSun",serif;font-size:27px;font-weight:600;letter-spacing:3px;fill:#fbf3ea;filter:drop-shadow(0 1px 1px rgba(30,0,6,.8))}
`;

const card = (name, cost, atk, life, glyph) =>
  `<div class="svCard"><div class="svArt"><div class="svGlyph">${glyph}</div></div>` +
  svg.replace('$NAME', name).replace('$COST', cost).replace('$ATK', atk).replace('$LIFE', life) + `</div>`;
const mine = card('铁誓骑士长·格兰', 5, 4, 5, '盾');

writeFileSync(join(here, 'sv2-preview.html'), `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>body{margin:0;padding:24px;background:#fff}${css}</style></head><body>${mine}</body></html>`, 'utf8');

// 逐区对照: 参考图与成品按同一坐标裁切放大
const regions = [
  ['整卡', 0, 0, 530, 687, 0.75],
  ['顶部拱冠', 90, 0, 360, 135, 2],
  ['右上角', 400, 40, 130, 170, 3],
  ['左上费用', 0, 30, 140, 140, 3],
  ['底部镶条', 90, 580, 360, 70, 2],
  ['左下攻击', 0, 545, 160, 142, 3],
  ['右下生命', 400, 550, 130, 137, 3],
  ['拱冠细节', 150, 0, 120, 70, 5],
  ['内角细节', 400, 40, 90, 140, 4],
  ['底部细节', 150, 585, 120, 55, 5],
];
const cell = (inner, x, y, w, h, s) =>
  `<div class="cell" style="width:${w * s}px;height:${h * s}px"><div style="position:absolute;left:${-x * s}px;top:${-y * s}px;width:${530 * s}px;height:${687 * s}px">${inner}</div></div>`;
const refImg = `<img src="../随从金卡.png" style="width:100%;height:100%;display:block">`;
const mineFull = mine.replace('class="svCard"', 'class="svCard" style="width:100%;margin:0"');
// 对照页里同一份 SVG 出现多次，id 需按格子区分，避免裁切路径互相引用
let k = 0;
const uniq = (html) => { k++; return html.replace(/id="(\w+)"/g, `id="$1_${k}"`).replace(/url\(#(\w+)\)/g, `url(#$1_${k})`); };
const rows = regions.map(([n, x, y, w, h, s]) =>
  `<h3>${n}</h3><div class="row">${cell(refImg, x, y, w, h, s)}${cell(uniq(mineFull), x, y, w, h, s)}</div>`).join('');
writeFileSync(join(here, 'sv2-compare.html'), `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>
body{margin:0;padding:16px;background:#fff;font:14px sans-serif}h3{margin:14px 0 6px}.row{display:flex;gap:16px}
.cell{position:relative;overflow:hidden;outline:1px dashed #bbb}${css}</style></head><body>
<p>每行左侧为参考图，右侧为成品，同一坐标、同一倍率</p>${rows}</body></html>`, 'utf8');
console.log('svg 字节数:', Buffer.byteLength(svg, 'utf8'));
}

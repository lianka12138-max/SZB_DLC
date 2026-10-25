// 影之诗卡包面板：在最新一楼 </update> 后渲染，由酒馆助手把 ```text <body>…</body>``` 块渲染成前端界面，
// 脚本读取本楼 MVU 变量 /人物/资源技能 中带"影之诗"标签的卡。
// 单卡复用卡面正则（regex-影之诗卡面.json）的模板与样式，与正文里 <SVCard> 的渲染完全一致。
// 用法: 先 node card.mjs，再 node panel.mjs → regex-影之诗卡包.json、panel-preview.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cardRx = JSON.parse(readFileSync(join(here, 'regex-影之诗卡面.json'), 'utf8'));
const kwRx = JSON.parse(readFileSync(join(here, 'regex-影之诗卡面-关键词.json'), 'utf8'));

// 卡面模板：拆出样式；$N 占位符改成 §N§（酒馆会把替换文本里的 $数字 当捕获组替换掉）
let tpl = cardRx.replaceString;
const css = tpl.match(/<style>([\s\S]*?)<\/style>/)[1];
tpl = tpl.replace(/<style>[\s\S]*?<\/style>/, '').replace(/\$(\d+)/g, '§$1§');
const defs = tpl.match(/<svg class="svDefs"[\s\S]*?<\/svg>/)[0];
const kw = kwRx.findRegex.match(/^\/([\s\S]*)\/([a-z]*)$/);
const kwRep = kwRx.replaceString.replace(/\$(\d+)/g, '§$1§');

const packCss = `
body{margin:0;background:transparent;font-family:"Noto Sans SC","Source Han Sans SC","Microsoft YaHei",sans-serif}
#pk:empty{display:none}
.pkDet{position:relative;width:98%;box-sizing:border-box;margin:8px auto;border:1px solid #d6c39b;border-radius:10px;color:#3a3226;
 background:linear-gradient(180deg,#f9f5ec,#f2ecdf);box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),0 2px 10px rgba(70,50,20,.12)}
.pkSum{position:relative;display:flex;align-items:center;gap:14px;padding:11px 18px 11px 22px;cursor:pointer;list-style:none;user-select:none;line-height:1.2}
.pkSum::-webkit-details-marker{display:none}
.pkDia,.pkRule::after{width:7px;height:7px;border:1px solid #c4a86c;background:linear-gradient(135deg,#fff3c8,#d9b765 50%,#8a6e3c)}
.pkDia{position:absolute;top:50%;transform:translateY(-50%) rotate(45deg)}
.pkDiaL{left:-5px}
.pkDiaR{right:-5px}
.pkDet[open] .pkDia{display:none}
.pkTitle{font:700 18px/1.2 "Noto Serif SC","Source Han Serif SC","SimSun",serif;letter-spacing:3px;color:#2a241c}
.pkDet[open] .pkTitle{font-size:22px}
.pkDet[open] .pkSum{padding:15px 24px 13px 28px}
.pkCnt{display:inline-flex;align-items:center;gap:14px;font-size:14px;color:#5e5038}
.pkCnt b{color:#9a7a35;font-weight:700;margin-right:3px}
.pkCnt span+span{padding-left:14px;border-left:1px solid #d8c9a8}
.pkTog{display:inline-flex;align-items:center;gap:9px;margin-left:auto;padding-left:18px;border-left:1px solid #d8c9a8;font-size:14px;line-height:16px;color:#3a3226}
.pkTog::before{content:"展开"}
.pkDet[open] .pkTog::before{content:"收起"}
.pkTog::after{content:"";width:7px;height:7px;margin:-4px 2px 0 0;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);transition:transform .2s}
.pkDet[open] .pkTog::after{margin:4px 2px 0 0;transform:rotate(-135deg)}
.pkRule{position:relative;height:1px;margin:0 18px;background:linear-gradient(90deg,transparent,#d6c39b 6%,#d6c39b 94%,transparent)}
.pkRule::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(45deg)}
.pkBody{padding:18px 22px 20px}
.pkGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px}
.pkCell{position:relative;cursor:pointer;transition:transform .15s,filter .15s}
.pkCell:hover{transform:translateY(-3px);filter:drop-shadow(0 4px 6px rgba(70,50,20,.35))}
.pkCell.on{transform:translateY(-3px);filter:drop-shadow(0 0 6px rgba(200,150,40,.9))}
.pkCell .svBox{margin:0;max-width:none}
.pkCell .svCard{width:100%}
.pkCell.used .svCard{filter:grayscale(.85) brightness(.6)}
.pkCell.used::after{content:"已用";position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-12deg);padding:1px 8px;
 border:1px solid #b9a27a;border-radius:3px;background:rgba(24,20,16,.85);color:#ffe9a8;font-size:12px;font-weight:700;letter-spacing:2px}
.pkView:empty{display:none}
.pkView{margin-top:16px;padding-top:16px;border-top:1px solid #e0d2b2;animation:pkIn .22s ease-out}
@keyframes pkIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.pkView .svSum{display:none}
.pkView .svBox{margin:0;max-width:none}
.pkView .svDet{border:0;background:none;box-shadow:none}
.pkView .svRule{display:none}
.pkView .svBody{padding:0}
.pkView .svBody{flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;gap:16px}
.pkView .svCard{width:156px}
.pkView .svPanel{flex:1 1 auto;max-width:none}
.pkView .svPName{font-size:17px}
.pkView .svFx,.pkView .svFxRaw{font-size:14px;line-height:1.75;padding:8px 2px}
@media (max-width:520px){.pkView .svBody{flex-wrap:wrap;justify-content:center}.pkView .svCard{width:140px}.pkView .svPanel{flex-basis:100%}}
`.replace(/\s*\n\s*/g, '');

const script = `
(function () {
  // 关键词正则会对整条消息执行，也会扫到这段脚本。锚点 <!--svT 写成 <!--sv@T，运行时再还原，避免模板被它改写
  var U = function (s) { return s.split('<!--sv@T').join('<!--sv' + 'T'); };
  var TPL = U(${JSON.stringify(tpl).split('<!--svT').join('<!--sv@T')});
  var KW = new RegExp(U(${JSON.stringify(kw[1]).split('<!--svT').join('<!--sv@T')}), ${JSON.stringify(kw[2])});
  var KWREP = ${JSON.stringify(kwRep)};
  var CLASSES = ['精灵', '皇家', '皇家护卫', '巫师', '龙族', '梦魇', '主教', '复仇者', '超越者'];
  var QORDER = { 普通: 0, 精良: 1, 稀有: 2, 卓越: 3, 传说: 4, 史诗: 5, 神话: 6 };
  var root = document.getElementById('pk');
  var cards = [], picked = -1, opened = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fill(v) {
    var out = TPL.replace(/§(\\d+)§/g, function (m, n) { return v[n] == null ? '' : v[n]; });
    return out.replace(KW, function () {
      var a = arguments;
      return KWREP.replace(/§(\\d+)§/g, function (m, n) { return a[n] || ''; });
    });
  }
  // 资源技能条目 → 卡面模板的捕获组值（与 regex-影之诗卡面.json 的分组一致）
  function toGroups(name, c) {
    var tags = (c.标签 || []).filter(function (t) { return t !== '影之诗'; });
    var cls = tags.filter(function (t) { return CLASSES.indexOf(t) >= 0; })[0] || '';
    var rest = tags.filter(function (t) { return t !== cls && t !== c.类型; });
    var fx = c.效果 || {}, g = {};
    g[1] = cls; g[2] = c.品质 || ''; g[3] = c.类型 || ''; g[4] = parseInt(c.消耗, 10) || 0; g[5] = name; g[7] = rest.join('、');
    var m = String(fx.面板 || '').match(/(\\d+)\\s*\\/\\s*(\\d+).*?AC\\s*(\\d+).*?HP\\s*(.*)$/);
    if (m) { g[8] = m[1]; g[9] = m[2]; g[10] = m[3]; g[11] = m[4].trim().replace(/^生命值上限\\s*[×xX*]\\s*/, ''); }
    var sk = String(fx.技能 || '').match(/^\\s*[\\[【]([^\\]】]{1,12})[\\]】]\\s*([\\s\\S]*)$/);
    if (sk) { g[12] = sk[1]; g[13] = sk[2]; } else if (fx.技能) g[13] = fx.技能;
    var i = 14;
    Object.keys(fx).forEach(function (k) {
      if (k === '面板' || k === '技能' || i > 24) return;
      var key = k, val = fx[k];
      // 旧写法: 整条写在键名里、值为空，如 "爆能强化 7：…"
      if (!val && /[：:]/.test(k)) { var p = k.split(/[：:]/); key = p.shift(); val = p.join('：'); }
      g[i] = key; g[i + 1] = val; i += 2;
    });
    g[27] = c.描述 || '';
    Object.keys(g).forEach(function (k) { g[k] = esc(g[k]); });
    return g;
  }
  function mini(card) {
    var s = card.html, a = s.indexOf('<div class="svCard">'), b = s.indexOf('<div class="svPanel">');
    var head = s.match(/^<div class="svBox"[^>]*>/)[0];
    return head + s.slice(a, b) + '</div>';
  }

  function render() {
    if (!cards.length) { root.innerHTML = ''; return; }
    var left = cards.filter(function (c) { return !c.used; }).length;
    var grid = cards.map(function (c, i) {
      return '<div class="pkCell' + (c.used ? ' used' : '') + (i === picked ? ' on' : '') + '" data-i="' + i + '" title="' + esc(c.name) + '">' + mini(c) + '</div>';
    }).join('');
    var view = picked >= 0 ? cards[picked].html.replace('<details class="svDet">', '<details class="svDet" open>') : '';
    root.innerHTML = ${JSON.stringify(defs)} +
      '<details class="pkDet"' + (opened ? ' open' : '') + '><summary class="pkSum"><span class="pkDia pkDiaL"></span><span class="pkDia pkDiaR"></span><span class="pkTitle">影之诗卡包</span>' +
      '<span class="pkCnt"><span><b>' + cards.length + '</b>张</span><span>可用 <b>' + left + '</b></span></span><span class="pkTog"></span></summary>' +
      '<div class="pkRule"></div><div class="pkBody"><div class="pkGrid">' + grid + '</div><div class="pkView">' + view + '</div></div></details>';
  }
  root.addEventListener('click', function (e) {
    var cell = e.target.closest('.pkCell');
    if (!cell) return;
    var i = +cell.getAttribute('data-i');
    picked = picked === i ? -1 : i;
    render();
  });
  root.addEventListener('toggle', function (e) { if (e.target.classList.contains('pkDet')) opened = e.target.open; }, true);

  function load() {
    var data = {};
    try {
      var id = getCurrentMessageId();
      data = (Mvu.getMvuData({ type: 'message', message_id: id }) || {}).stat_data || {};
    } catch (err) { console.warn('[影之诗卡包] 读取变量失败', err); }
    var res = ((data.人物 || {}).资源技能) || {};
    cards = Object.keys(res).filter(function (k) {
      var c = res[k];
      return c && (c.标签 || []).indexOf('影之诗') >= 0;
    }).map(function (k) {
      var c = res[k];
      return { name: k, used: Number(c.剩余次数) <= 0, cost: parseInt(c.消耗, 10) || 0, q: QORDER[c.品质] || 0, html: fill(toGroups(k, c)) };
    }).sort(function (a, b) { return a.cost - b.cost || b.q - a.q || a.name.localeCompare(b.name); });
    if (picked >= cards.length) picked = -1;
    render();
  }

  function start() {
    // 只在最新一楼显示；有新楼层后本楼自动隐藏
    try { if (getCurrentMessageId() !== getLastMessageId()) return; } catch (err) {}
    load();
    try {
      eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, function () { setTimeout(load, 50); });
      eventOn(tavern_events.MESSAGE_RECEIVED, function () {
        try { if (getCurrentMessageId() !== getLastMessageId()) root.innerHTML = ''; } catch (err) {}
      });
    } catch (err) {}
  }
  if (typeof waitGlobalInitialized === 'function') waitGlobalInitialized('Mvu').then(start, start); else start();
})();
`;

const body = `<body>\n<style>${css}${packCss}</style>\n<div id="pk"></div>\n<script>${script}</script>\n</body>`;

// 安全检查：替换文本里不能出现酒馆会改写的 $数字 / 宏 / 代码围栏
if (/\$\d|\$</.test(body)) throw new Error('卡包脚本含 $数字，会被酒馆当成捕获组');
if (body.includes('{{')) throw new Error('卡包脚本含 {{，会被酒馆当成宏');
if (body.includes('```')) throw new Error('卡包脚本含代码围栏');

const regexJson = {
  id: 'e3a9c5d1-7f24-4b6e-8c10-9d2f6a4b3e57',
  scriptName: '影之诗卡包',
  // 保留 </update>（排在"变量更新美化"之前，它随后照常把 <update> 块折叠），在其后追加卡包界面
  findRegex: '/(<\\/(?:UpdateVariable(?:variable)?|update)>)/i',
  replaceString: '$1\n\n```text\n' + body + '\n```\n',
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: true,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: 0,
};
writeFileSync(join(here, 'regex-影之诗卡包.json'), JSON.stringify(regexJson, null, 4), 'utf8');

// ================= 本地预览：模拟酒馆助手接口与 MVU 数据 =================
const sample = {
  人物: {
    资源技能: {
      '铁誓骑士长·格兰': { 品质: '稀有', 类型: '从者', 消耗: '5 PP', 剩余次数: 1, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '皇家', '指挥官', '守护'],
        效果: { 面板: '4/5｜AC 14｜HP 生命值上限×50%', 技能: '[誓盾重击] 抵住塔盾突入敌阵，以盾缘猛砸1个近战目标，造成[120% + 1.4% × (玩家等级 - 1)]物理伤害', 入场曲: '铁剑敲响盾面发出战吼，使1个友方本轮攻击检定+1', '爆能强化 7': '吹响破损的号角召来旧部，额外召唤2个『骑士』' },
        描述: '败于你手的骑士长，如今把盾立在你身前。' },
      黑潮甲板枪卫: { 品质: '稀有', 类型: '从者', 消耗: '3 PP', 剩余次数: 0, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '皇家', '士兵', '突进'],
        效果: { 面板: '3/2｜AC 11｜HP 生命值上限×20%', 技能: '[排枪齐射] 依托甲板掩体稳住枪口，对近战或中距1个敌人造成[90% + 1.05% × (玩家等级 - 1)]物理伤害', 入场曲: '打亮肩头鲸油探照灯，使玩家本轮攻击检定+1' },
        描述: '老练的护航枪手，永远在浓雾与黑浪中为你看守侧舷。' },
      林梢守望者: { 品质: '精良', 类型: '从者', 消耗: '2 PP', 剩余次数: 1, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '精灵', '妖精', '突进'],
        效果: { 面板: '2/3｜AC 11｜HP 生命值上限×30%', 技能: '[藤矢] 从枝叶间放出缠着藤蔓的箭，对1个敌人造成[60% + 0.5% × (玩家等级 - 1)]穿刺伤害' }, 描述: '' },
      雷光爆裂: { 品质: '卓越', 类型: '法术', 消耗: '4 PP', 剩余次数: 1, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '巫师', '伤害'],
        效果: { 施放: '苍白电弧在潮湿空气中炸响，对全体敌人造成2点雷电伤害[60% + 0.8% × (玩家等级 - 1)]，DC15敏捷豁免，成功减半；【咏唱】时余雷收束成矛，再贯入1个敌人' }, 描述: '学徒们管这叫"开窗通风"。' },
      圣钟塔: { 品质: '传说', 类型: '护符', 消耗: '3 PP', 剩余次数: 1, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '主教', '回复'],
        效果: { 护符: '倒数 3：每轮结束时回复玩家生命值上限5%', 谢幕曲: '召唤1个『圣骑兵』' }, 描述: '钟声停下的地方，就是战线。' },
      '终焉海皇·利维坦': { 品质: '神话', 类型: '从者', 消耗: '10 PP', 剩余次数: 1, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '龙族', '海洋', '守护'],
        效果: { 面板: '10/12｜AC 17｜HP 生命值上限×120%', 技能: '[深渊潮吼] 掀起整片海面砸向敌阵，对至多3个敌人造成[210% + 5.95% × (玩家等级 - 1)]寒冷伤害', '激奏 3': '唤来一道巨浪，使1个敌人先攻-5（DC20感知豁免）', 入场曲: '本场PP上限+1' },
        描述: '海平线隆起的那一刻，舰队才明白自己航行在谁的背上。' },
      血月伯爵夫人: { 品质: '史诗', 类型: '从者', 消耗: '6 PP', 剩余次数: 0, 次数上限: 1, 恢复条件: '每场战斗开始恢复', 标签: ['影之诗', '梦魇', '夜族', '吸血'],
        效果: { 面板: '5/6｜AC 13｜HP 生命值上限×60%', 技能: '[血契之吻] 化作蝠群扑向敌人，造成[150% + 3.25% × (玩家等级 - 1)]暗蚀伤害', '入场曲：【复仇】时再召唤2个『蝙蝠』': '' }, 描述: '她从不道谢，只记账。' },
      // 非影之诗资源技能，不应出现在卡包里
      火球术: { 品质: '稀有', 类型: '法术', 消耗: '20 MP', 剩余次数: 2, 次数上限: 3, 恢复条件: '长休', 标签: ['火焰'], 效果: { 伤害: '...' }, 描述: '' },
    },
  },
};
const local = 'upload/sv';
const previewBody = body.split(cardRx.replaceString.match(/url\(([^)]*?)\/frame\//)[1]).join(local);
const mock = `<script>
window.getCurrentMessageId = function () { return 5; };
window.getLastMessageId = function () { return 5; };
window.waitGlobalInitialized = function () { return Promise.resolve(); };
window.eventOn = function () {};
window.tavern_events = { MESSAGE_RECEIVED: 'message_received' };
window.Mvu = { events: { VARIABLE_UPDATE_ENDED: 'mag_variable_update_ended' }, getMvuData: function () { return { stat_data: ${JSON.stringify(sample)} }; } };
</script>`;
writeFileSync(join(here, 'panel-preview.html'),
  `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>影之诗卡包预览</title>${mock}</head>` +
  previewBody.replace('<body>', '<body style="background:#e9e2d4;padding:18px">'), 'utf8');
console.log('卡包替换文本字节数:', Buffer.byteLength(regexJson.replaceString, 'utf8'));

// 校验 regex-影之诗卡面.json 对各种书写变体的捕获结果。用法: node test-regex.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { findRegex } = JSON.parse(readFileSync(join(here, 'regex-影之诗卡面.json'), 'utf8'));
const m = findRegex.match(/^\/([\s\S]*)\/([a-z]*)$/);
const re = () => new RegExp(m[1], m[2]);

const base = `<SVCard>
皇家|稀有|从者|5|铁誓骑士长·格兰|盾|指挥官、守护
面板：4/5｜AC 14｜HP 生命值上限×50%
技能：[誓盾重击] 举盾撞入敌阵，造成[120% + 1.4% × (玩家等级 - 1)]物理伤害
入场曲：高举战旗，使1个友方本轮攻击检定+1
爆能强化 7：号角召来旧部，额外召唤2个骑士
——败于你手的骑士长，如今把盾立在你身前。
</SVCard>`;
const cases = {
  标准: base,
  缩进4格: base.split('\n').map((l) => '    ' + l).join('\n'),
  CRLF: base.replace(/\n/g, '\r\n'),
  费用带PP: base.replace('|5|', '|5 PP|'),
  纹字两字: base.replace('|盾|', '|盾牌|'),
  标签留空: base.replace('|指挥官、守护', '|'),
  键名带括号: base.replace('入场曲：', '【入场曲】：'),
  描述键名: base.replace('——败于', '描述：败于'),
  无描述: base.replace(/\n——.*/, ''),
  描述与结束同行: base.replace('\n</SVCard>', '</SVCard>'),
  无面板法术: `<SVCard>
巫师|卓越|法术|4|雷光爆裂|雷|法术伤害
施放：雷光在敌阵炸开，对全体敌人造成2点雷电伤害
——
</SVCard>`,
  多一行空行: base.replace('\n入场曲', '\n\n入场曲'),
  实测输出: `<SVCard>  
  
皇家|稀有|从者|3|黑潮甲板枪卫|铳|士兵、突进  
  
面板：3/2｜AC 11｜HP 生命值上限×20%  
  
技能：[排枪齐射] 依托甲板掩体稳住枪口，对近战或中距1个敌人造成[90% + 1.05% × (玩家等级 - 1)]物理伤害  
  
入场曲：打亮肩头鲸油探照灯，使玩家本轮攻击检定+1  
  
——老练的护航枪手，永远在浓雾与黑浪中为你看守侧舷。  
  
</SVCard>`,
  技能无方括号: base.replace('[誓盾重击] ', ''),
  六栏新格式: base.replace('|盾|', '|'),
  六栏无标签: base.replace('|盾|指挥官、守护', '|'),
};
let fail = 0;
for (const [name, text] of Object.entries(cases)) {
  const g = re().exec(text);
  if (!g) { console.log(`✗ ${name}: 未匹配`); fail++; continue; }
  const fx = [];
  if (g[13]) fx.push(`技能[${g[12] ?? ''}]=${g[13].slice(0, 6)}`);
  for (let i = 14; i <= 24; i += 2) if (g[i]) fx.push(`${g[i]}=${g[i + 1].slice(0, 6)}`);
  const before = text.slice(0, g.index);
  console.log(`✓ ${name}: 职业${g[1]} 品质${g[2]} 费用${g[4]} 名${g[5]} 纹${g[6]} 标签[${g[7]}] 面板${g[8] ?? '-'}/${g[9] ?? '-'} AC${g[10] ?? '-'} | ${fx.join(' ')} | 剩余[${(g[26] || '').trim().slice(0, 12)}] | 描述[${(g[27] || '').slice(0, 8)}]${before ? ' | 前缀残留[' + JSON.stringify(before) + ']' : ''}`);
}
process.exitCode = fail ? 1 : 0;

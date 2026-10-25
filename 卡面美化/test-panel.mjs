// 模拟酒馆正则顺序：卡包 → 卡面 → 关键词 → 变量更新美化，检查卡包代码块原样保留、脚本语法有效。用法: node test-panel.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));
const pack = load('regex-影之诗卡包.json'), card = load('regex-影之诗卡面.json'), kw = load('regex-影之诗卡面-关键词.json');

// 与 SillyTavern 1.19 runRegexScript 相同的替换逻辑
function run(script, text) {
  const m = script.findRegex.match(/^\/([\s\S]*)\/([a-z]*)$/);
  return text.replace(new RegExp(m[1], m[2]), function () {
    const args = [...arguments];
    const rs = script.replaceString.replace(/{{match}}/gi, '$0');
    return rs.replaceAll(/\$(\d+)|\$<([^>]+)>/g, (_, num) => args[Number(num)] || '');
  });
}
const beautify = { findRegex: '/<(?:UpdateVariable(?:variable)?|update)>([\\s\\S]*?)<\\/(?:UpdateVariable(?:variable)?|update)>/gsi', replaceString: '<div class="modern-dark-log">$1</div>' };
const msg = '<now_plot>正文……</now_plot>\n<update>\n<json_patch>[]</json_patch>\n</update>\n';
const out = [pack, card, kw, beautify].reduce((t, s) => run(s, t), msg);
const body = pack.replaceString.slice(pack.replaceString.indexOf('<body>'), pack.replaceString.indexOf('</body>') + 7);
const ok1 = out.includes(body);
const ok2 = out.startsWith('<now_plot>') && out.includes('<div class="modern-dark-log">') && !out.includes('</update>');
const js = out.match(/<script>([\s\S]*?)<\/script>/)[1];
let ok3 = true;
try { new Function(js); } catch (e) { ok3 = false; console.log('脚本语法错误:', e.message); }
console.log('经过全部正则后代码块原样保留:', ok1, '| 变量更新美化仍生效:', ok2, '| 脚本语法有效:', ok3);
process.exitCode = ok1 && ok2 && ok3 ? 0 : 1;

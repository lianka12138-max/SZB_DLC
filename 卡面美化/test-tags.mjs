// 检查标签栏拆分：关键词与普通标签分开显示，效果文本中的【】仍正常。用法: node test-tags.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const c = JSON.parse(readFileSync(join(here, 'regex-影之诗卡面.json'), 'utf8'));
const k = JSON.parse(readFileSync(join(here, 'regex-影之诗卡面-关键词.json'), 'utf8'));
const R = (j) => { const m = j.findRegex.match(/^\/([\s\S]*)\/([a-z]*)$/); return new RegExp(m[1], m[2]); };
const run = (j, t) => t.replace(R(j), function () { const a = arguments; return j.replaceString.replace(/\$(\d+)/g, (_, n) => a[n] || ''); });
const cases = { '指挥官、守护': '指挥官 | [关键词]守护', '士兵、突进': '士兵 | [关键词]突进', '守护者、人偶': '守护者 | 人偶',
  '海洋，守护, 疾驰': '海洋 | [关键词]守护 | [关键词]疾驰', '夜族·吸血': '夜族 | [关键词]吸血', '': '', '无法被能力破坏': '[关键词]无法被能力破坏' };
let fail = 0;
for (const [tg, want] of Object.entries(cases)) {
  const o = run(k, run(c, `<SVCard>\n皇家|稀有|从者|5|格兰|${tg}\n面板：4/5｜AC 14｜HP 生命值上限×50%\n技能：[a] 获得【守护】\n</SVCard>`));
  const s = o.match(/<span class="svPTags">(.*?)<\/span><!--svTg-->/)[1];
  const got = [...s.matchAll(/data-k="([^"]*)"><span class="svKn">([^<]*)<\/span>([^<]*)<\/span>/g)]
    .map((m) => (m[1] ? '[关键词]' : '') + (m[2] || m[3]).trim()).join(' | ');
  const fx = /<span class="svKn">守护<\/span>】/.test(o);
  const ok = got === want && fx;
  if (!ok) fail++;
  console.log(ok ? '✓' : '✗', JSON.stringify(tg), '=>', got, '| 效果文本【】:', fx);
}
process.exitCode = fail ? 1 : 0;

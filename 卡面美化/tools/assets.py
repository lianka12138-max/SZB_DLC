# 把 shadowverse-assets（边框、宝石）、shadowverse-class-art-integrated（从者插画、穿框前景）
# 与 shadowverse-spells-amulets（法术、护符插画）整理成外链目录。
# 用法: python tools/assets.py → upload/sv/
#   frame/{类型}-{品质}.webp  gem/{职业}.webp  art/{职业}-{类型}.webp  fg/{职业}-{类型}.webp
#   art/{职业}.webp、fg/{职业}.webp 为旧版正则保留（从者插画）
# 文件名直接用卡面头行里的中文值，正则把 $1/$2/$3 拼进链接即可取到对应图片，无需映射。
import os
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
dlc = os.path.join(here, '..', '..')
src = os.path.join(dlc, 'shadowverse-assets')
art = os.path.join(dlc, 'shadowverse-class-art-integrated')
spell = os.path.join(dlc, 'shadowverse-spells-amulets', 'illustrations')
pattern = os.path.join(dlc, '新版花纹')
# 素材名 → (展开区右下角饰, 折叠条横饰)
DECO = {'精灵': ('淡雅鼠尾草叶角饰-1.png', '浅色风拂叶饰-2.png'),
        '皇家护卫': ('下角王冠流旗饰-3.png', '淡金皇冠长剑横饰-5.png'),
        '巫师': ('巫师淡紫月弧星轨装饰-4.png', '巫师淡紫轨道星芒装饰-7.png'),
        '龙族': ('浅琥珀龙影流饰-8.png', '浅琥珀龙翼横饰-6.png'),
        '梦魇': ('梦魇蔷薇弯月装饰-9.png', '淡粉月弧轻羽饰-10.png'),
        '主教': ('淡金太阳与流翼饰纹-11.png', '淡香槟太阳横向装饰-12.png'),
        '超越者': ('超越者淡青轨道晶环-14.png', '浅青碎环横向饰纹-13.png')}
out = os.path.join(here, '..', 'upload', 'sv')
for d in ('frame', 'gem', 'art', 'fg', 'deco', 'bar'):
    os.makedirs(os.path.join(out, d), exist_ok=True)
for d in ('gem',):  # 清掉旧职业名留下的文件
    for f in os.listdir(os.path.join(out, d)):
        os.remove(os.path.join(out, d, f))

# 品质 → 卡色：普通/精良铜，稀有/卓越银，传说/史诗金，神话虹（法术、护符没有虹卡，用金卡）
TIER = {'普通': '铜卡', '精良': '铜卡', '稀有': '银卡', '卓越': '银卡', '传说': '金卡', '史诗': '金卡', '神话': '虹卡'}
TYPE = {'从者': '随从', '法术': '法术', '护符': '护符'}
size, n = 0, 0
def save(im, dst, **kw):
    global size, n
    im.save(dst, 'WEBP', method=6, **kw)
    size += os.path.getsize(dst); n += 1

for t, tn in TYPE.items():
    for q, tier in TIER.items():
        f = os.path.join(src, 'frames', f'{tn}_{tier}_边框.png')
        if not os.path.exists(f):
            f = os.path.join(src, 'frames', f'{tn}_金卡_边框.png')
        save(Image.open(f).convert('RGBA'), os.path.join(out, 'frame', f'{t}-{q}.webp'), quality=90)

# 职业（规则用名）→ 素材名；同时提供官方称呼作别名，AI 写哪种都能取到图
CLASS = {'精灵': '精灵', '皇家': '皇家护卫', '皇家护卫': '皇家护卫', '巫师': '巫师', '龙族': '龙族',
         '梦魇': '梦魇', '主教': '主教', '复仇者': '超越者', '超越者': '超越者'}
# 插画 1000×1200，按 2 倍画窗尺寸（836×1008）存
def art_im(path):
    return Image.open(path).convert('RGB').resize((836, 1008), Image.LANCZOS)
# 法术、护符没有穿框前景，用 1×1 透明图占位，免得每张卡多一个 404 请求
blank = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
missing = set()
for c, a in CLASS.items():
    save(Image.open(os.path.join(src, 'gems', f'{a}_宝石.png')).convert('RGBA'), os.path.join(out, 'gem', f'{c}.webp'), lossless=True)
    servant = art_im(os.path.join(art, 'illustrations', f'{a}.png'))
    fg = Image.open(os.path.join(art, 'foreground', f'{a}_穿框.png')).convert('RGBA')
    for name in (c, f'{c}-从者'):
        save(servant, os.path.join(out, 'art', f'{name}.webp'), quality=84)
        save(fg, os.path.join(out, 'fg', f'{name}.webp'), quality=90)
    for t in ('法术', '护符'):
        hits = [f for f in os.listdir(spell) if f.startswith(f'{a}_{t}_') and f.endswith('.png')]
        if len(hits) != 1:
            raise SystemExit(f'{a} {t} 插画应有 1 张，实际 {len(hits)} 张')
        save(art_im(os.path.join(spell, hits[0])), os.path.join(out, 'art', f'{c}-{t}.webp'), quality=84)
        save(blank, os.path.join(out, 'fg', f'{c}-{t}.webp'), lossless=True)
    # 职业花纹（新版花纹/）：展开区为 4:3 右下角饰，整张缩到 640×480 贴右下角；
    # 折叠条为横饰，裁掉透明边后按高 120 缩放（显示高度约 30px 的 4 倍）
    # 源图缺失时保留 upload 里已生成的花纹，不中断其余素材的生成
    src_deco, src_bar = (os.path.join(pattern, f) for f in DECO[a])
    if not (os.path.exists(src_deco) and os.path.exists(src_bar)):
        missing.add(a)
        continue
    deco = Image.open(src_deco).convert('RGBA').resize((640, 480), Image.LANCZOS)
    save(deco, os.path.join(out, 'deco', f'{c}.webp'), quality=85)
    bar = Image.open(src_bar).convert('RGBA')
    bar = bar.crop(bar.getchannel('A').getbbox())
    bar = bar.resize((round(bar.width * 120 / bar.height), 120), Image.LANCZOS)
    save(bar, os.path.join(out, 'bar', f'{c}.webp'), quality=85)
if missing:
    print('⚠ 缺少花纹源图，沿用已生成的 deco/bar:', '、'.join(sorted(missing)), '→', os.path.normpath(pattern))
print(f'已生成 {n} 个文件，共 {size / 1024:.0f}KB → {os.path.normpath(out)}')

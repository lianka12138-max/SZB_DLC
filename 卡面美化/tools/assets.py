# 把 shadowverse-assets 的边框与宝石整理成可直接上传的外链目录。
# 用法: python tools/assets.py → upload/sv/frame/{类型}-{品质}.webp、upload/sv/gem/{职业}.webp
# 文件名直接用卡面头行里的中文值，正则把 $2/$3/$1 拼进链接即可取到对应图片，无需映射。
import os, colorsys
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, '..', '..', 'shadowverse-assets')
out = os.path.join(here, '..', 'upload', 'sv')
os.makedirs(os.path.join(out, 'frame'), exist_ok=True)
os.makedirs(os.path.join(out, 'gem'), exist_ok=True)

# 品质 → 卡色：普通/精良铜，稀有/卓越银，传说/史诗金，神话虹（法术、护符没有虹卡，用金卡）
TIER = {'普通': '铜卡', '精良': '铜卡', '稀有': '银卡', '卓越': '银卡', '传说': '金卡', '史诗': '金卡', '神话': '虹卡'}
TYPE = {'从者': '随从', '法术': '法术', '护符': '护符'}
size = 0
for t, tn in TYPE.items():
    for q, tier in TIER.items():
        f = os.path.join(src, 'frames', f'{tn}_{tier}_边框.png')
        if not os.path.exists(f):
            f = os.path.join(src, 'frames', f'{tn}_金卡_边框.png')
        dst = os.path.join(out, 'frame', f'{t}-{q}.webp')
        Image.open(f).convert('RGBA').save(dst, 'WEBP', quality=90, method=6)
        size += os.path.getsize(dst)

# 职业 → 宝石。死灵法师与吸血鬼在原作新版合并为梦魇；死灵法师改为紫色以便区分
GEM = {'精灵': '精灵', '皇家': '皇家护卫', '巫师': '巫师', '龙族': '龙族', '死灵法师': '梦魇', '死灵': '梦魇',
       '吸血鬼': '梦魇', '主教': '主教', '复仇者': '超越者'}
def hue(im, shift):
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if not a: continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            r2, g2, b2 = colorsys.hls_to_rgb((h + shift) % 1, l, s)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return im
for c, gn in GEM.items():
    im = Image.open(os.path.join(src, 'gems', f'{gn}_宝石.png')).convert('RGBA')
    if c.startswith('死灵'):
        im = hue(im, -0.17)  # 深红 → 紫
    dst = os.path.join(out, 'gem', f'{c}.webp')
    im.save(dst, 'WEBP', lossless=True)
    size += os.path.getsize(dst)
print(f'已生成 {len(TYPE) * len(TIER)} 张边框、{len(GEM)} 颗宝石，共 {size / 1024:.0f}KB → {out}')

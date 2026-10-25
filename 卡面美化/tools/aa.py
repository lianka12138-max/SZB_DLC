# 对比 1 倍渲染与 4 倍超采样缩回 1 倍的"理想"结果，量化锯齿与毛刺
# 用法: python aa.py 1倍图 4倍图 输出对照图
import sys
from PIL import Image, ImageChops, ImageStat
a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB').resize(a.size, Image.BOX)
# 两张卡: 300px 在 x10..310, 240px 在 x324..564（含 margin 与 inline 间隙，取近似）
regions = {
    '300 拱冠': (60, 10, 260, 47),
    '300 底部': (60, 343, 260, 373),
    '240 拱冠': (370, 10, 530, 40),
    '240 底部': (370, 276, 530, 300),
}
for k, r in regions.items():
    d = ImageChops.difference(a.crop(r), b.crop(r)).convert('L')
    st = ImageStat.Stat(d)
    big = sum(1 for p in d.get_flattened_data() if p > 40) / (d.size[0] * d.size[1])
    print(f'R{list(regions).index(k)} mean {st.mean[0]:.2f} big {big * 100:.2f}')
# 对照图: 上 1 倍(放大4倍看)，下理想
r = (40, 330, 280, 378)
top = a.crop(r).resize(((r[2] - r[0]) * 4, (r[3] - r[1]) * 4), Image.NEAREST)
bot = b.crop(r).resize(top.size, Image.NEAREST)
out = Image.new('RGB', (top.size[0], top.size[1] * 2 + 8), 'white')
out.paste(top, (0, 0)); out.paste(bot, (0, top.size[1] + 8))
out.save(sys.argv[3], quality=90)

# 差异热图：1 倍渲染相对超采样理想图的偏差（放大 4 倍、差值 ×4）
# 用法: python aa_heat.py 1倍图 4倍图 输出
import sys
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB').resize(a.size, Image.BOX)
rows = [(40, 8, 280, 50), (40, 335, 280, 378), (360, 270, 540, 302)]
tiles = []
for r in rows:
    w, h = (r[2] - r[0]) * 4, (r[3] - r[1]) * 4
    d = ImageChops.difference(a.crop(r), b.crop(r)).convert('L').point(lambda v: min(255, v * 4))
    tiles += [a.crop(r).resize((w, h), Image.NEAREST), d.convert('RGB').resize((w, h), Image.NEAREST)]
W = max(t.size[0] for t in tiles); H = sum(t.size[1] + 6 for t in tiles)
out = Image.new('RGB', (W, H), 'white'); y = 0
for t in tiles:
    out.paste(t, (0, y)); y += t.size[1] + 6
out.save(sys.argv[3], quality=88)

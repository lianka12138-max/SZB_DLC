# 用法: python crop.py 源图 x y w h 倍率 输出
from PIL import Image
import sys
src, x, y, w, h, s, out = sys.argv[1], *map(int, sys.argv[2:7]), sys.argv[7]
im = Image.open(src).convert('RGBA').crop((x, y, x + w, y + h))
bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
bg.resize((w * s, h * s), Image.LANCZOS).convert('RGB').save(out)

from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert('RGBA'); W, H = im.size; px = im.load()
def span(y):
    xs = [x for x in range(W) if px[x, y][3] > 128]
    return (xs[0], xs[-1]) if xs else None
def vspan(x):
    ys = [y for y in range(H) if px[x, y][3] > 128]
    return (ys[0], ys[-1]) if ys else None
for y in [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 160, 200, 400, 600, 620, 640, 650, 660, 670, 680, 686]:
    print('row', y, span(y))
for x in [0, 5, 10, 20, 40, 60, 80, 100, 120, 140, 200, 265, 330, 400, 440, 470, 490, 510, 520, 529]:
    print('col', x, vspan(x))
for p in [(265, 30), (265, 60), (200, 60), (330, 80), (265, 96), (120, 100), (300, 100), (62, 90), (100, 300), (108, 300), (515, 300), (505, 300), (265, 665), (265, 655), (200, 665), (40, 640), (490, 640), (470, 120)]:
    print('px', p, px[p])

from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert('RGBA'); px = im.load()
def h(y, x0, x1, step=2):
    print(f'row {y}:', ' '.join(f'{x}:{px[x,y][0]:02x}{px[x,y][1]:02x}{px[x,y][2]:02x}' for x in range(x0, x1, step)))
def v(x, y0, y1, step=2):
    print(f'col {x}:', ' '.join(f'{y}:{px[x,y][0]:02x}{px[x,y][1]:02x}{px[x,y][2]:02x}' for y in range(y0, y1, step)))
h(400, 44, 120); h(400, 440, 490)
v(265, 0, 170); v(300, 560, 645); v(200, 0, 130)

# 把三份正则与导入说明打包成 美化正则/影之诗美化正则.zip，便于分享一个链接一次下载。
# 用法: python tools/pack.py（先跑 node card.mjs、node panel.mjs）
import os, shutil, zipfile
here = os.path.dirname(os.path.abspath(__file__))
d = os.path.join(here, '..', '美化正则')
shutil.copy(os.path.join(here, '..', '导入说明.txt'), os.path.join(d, '导入说明.txt'))
names = ['regex-影之诗卡包.json', 'regex-影之诗卡面.json', 'regex-影之诗卡面-关键词.json', '导入说明.txt']
out = os.path.join(d, '影之诗美化正则.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.write(os.path.join(d, n), n)
print('已打包', os.path.normpath(out), os.path.getsize(out), 'B')

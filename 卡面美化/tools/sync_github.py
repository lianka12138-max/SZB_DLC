# 把本地卡面美化文件作为一次提交推到 GitHub 仓库（只新增/覆盖，不删除），再刷新 jsDelivr 缓存。
# 依赖: 已用 gh auth login 登录。用法: python tools/sync_github.py [提交说明]
import base64, glob, json, os, subprocess, sys, urllib.parse, urllib.request

REPO, BRANCH, PREFIX = 'lianka12138-max/SZB_DLC', 'main', '卡面美化'
root = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PATTERNS = ['upload/sv/art/*.webp', 'upload/sv/fg/*.webp', 'upload/sv/frame/*.webp', 'upload/sv/gem/*.webp',
            '美化正则/*.json', '美化正则/*.zip', 'card.mjs', 'panel.mjs', 'tools/assets.py', 'tools/pack.py',
            'tools/sync_github.py', 'card-preview.html', 'panel-preview.html']
msg = sys.argv[1] if len(sys.argv) > 1 else '更新卡面美化'
token = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, check=True).stdout.strip()


def api(method, path, body=None):
    req = urllib.request.Request(f'https://api.github.com/repos/{REPO}/{path}', method=method,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def git_sha(data):  # 与 git hash-object 相同，用来跳过未变化的文件
    import hashlib
    return hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()


head = api('GET', f'git/ref/heads/{BRANCH}')['object']['sha']
base_tree = api('GET', f'git/commits/{head}')['tree']['sha']
remote = {t['path']: t['sha'] for t in api('GET', f'git/trees/{base_tree}?recursive=1')['tree'] if t['type'] == 'blob'}

entries, changed = [], []
for pat in PATTERNS:
    for f in sorted(glob.glob(os.path.join(root, pat))):
        rel = PREFIX + '/' + os.path.relpath(f, root).replace(os.sep, '/')
        data = open(f, 'rb').read()
        if remote.get(rel) == git_sha(data):
            continue
        blob = api('POST', 'git/blobs', {'content': base64.b64encode(data).decode(), 'encoding': 'base64'})
        entries.append({'path': rel, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})
        changed.append(rel)

if not entries:
    print('没有需要更新的文件')
    sys.exit(0)
tree = api('POST', 'git/trees', {'base_tree': base_tree, 'tree': entries})['sha']
commit = api('POST', 'git/commits', {'message': msg, 'tree': tree, 'parents': [head]})['sha']
api('PATCH', f'git/refs/heads/{BRANCH}', {'sha': commit})
print(f'已提交 {commit[:7]}，{len(changed)} 个文件:')
for p in changed:
    print('  ' + p)

# 刷新 jsDelivr 缓存（失败不影响提交，缓存最迟 12 小时后自动更新）
bad = 0
for p in changed:
    url = f'https://purge.jsdelivr.net/gh/{REPO}@{BRANCH}/' + urllib.parse.quote(p)
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            json.load(r)
    except Exception:
        bad += 1
print(f'jsDelivr 缓存刷新: {len(changed) - bad} 成功, {bad} 失败')

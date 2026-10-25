# 参数扫描：每组参数生成 1 倍渲染，与固定的超采样参考图比较
param([string[]]$configs)
$ref = 'G:\CC_WorkSpace\svshots\aa4_ref.png'
foreach ($c in $configs) {
  $env:SS_K = ''; $env:OUTLINE = ''; $env:SPEC_BLUR = ''; $env:OW = ''
  foreach ($kv in $c.Split(' ')) { $k, $v = $kv.Split('='); Set-Item "env:$k" $v }
  node tools\aa.mjs
  .\tools\shot.ps1 tools\aa.html G:\CC_WorkSpace\svshots\t.png 600 420 1 2>$null | Out-Null
  $r = python tools\aa.py G:\CC_WorkSpace\svshots\t.png $ref G:\CC_WorkSpace\svshots\t.jpg 2>$null
  $m = ($r | ForEach-Object { if ($_ -match 'mean ([\d.]+)') { [double]$matches[1] } } | Measure-Object -Average).Average
  "{0,-40} {1:N2}  [{2}]" -f $c, $m, (($r | ForEach-Object { ($_ -split " ")[2] }) -join " ")
}
$env:SS_K = ''; $env:OUTLINE = ''; $env:SPEC_BLUR = ''; $env:OW = ''

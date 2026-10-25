# 用法: tools\shot.ps1 <html文件> <输出png> <宽> <高> [缩放倍率]
param([string]$html, [string]$out, [int]$w = 1200, [int]$h = 2400, [double]$scale = 1)
$p = (Resolve-Path $html).Path
$u = "file:///" + ($p -replace '\\', '/')
if (Test-Path $out) { Remove-Item $out }
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=$w,$h", "--force-device-scale-factor=$scale", "--virtual-time-budget=2000", "--screenshot=$out", $u -Wait -WindowStyle Hidden
Start-Sleep -Milliseconds 500
if (Test-Path $out) { "截图完成: $out" } else { "截图失败" }

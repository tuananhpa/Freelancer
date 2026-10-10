$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$runtimeDir=Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force $runtimeDir | Out-Null
$nodePath='C:\Program Files\nodejs\node.exe'
$cloudflarePath='C:\Program Files (x86)\cloudflared\cloudflared.exe'
if(-not (Test-Path (Join-Path $projectRoot 'dist/index.html'))){throw 'Chạy npm.cmd run build trước.'}
$port=Get-NetTCPConnection -LocalPort 4180 -State Listen -ErrorAction SilentlyContinue
if($port){throw 'Cổng 4180 đang chạy. Dùng link hiện tại trong docs/RUNNING.md hoặc dừng phiên cũ trước.'}
$server=Start-Process $nodePath -ArgumentList ('"'+(Join-Path $PSScriptRoot 'serve.mjs')+'"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'server.log') -RedirectStandardError (Join-Path $runtimeDir 'server-error.log') -PassThru
$tunnel=Start-Process $cloudflarePath -ArgumentList 'tunnel','--url','http://127.0.0.1:4180' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'tunnel.log') -RedirectStandardError (Join-Path $runtimeDir 'tunnel-error.log') -PassThru
@{serverPid=$server.Id;tunnelPid=$tunnel.Id;localUrl='http://127.0.0.1:4180'} | ConvertTo-Json | Set-Content (Join-Path $runtimeDir 'processes.json')
Write-Output 'Website: http://127.0.0.1:4180. Link Cloudflare xuất hiện trong .runtime/tunnel-error.log.'

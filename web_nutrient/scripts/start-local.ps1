param([switch]$SkipBuild)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$nodeBin=(Get-Command node.exe).Source
$npmBin=(Get-Command npm.cmd).Source
$tunnelBin=(Get-Command cloudflared.exe).Source
New-Item -ItemType Directory -Path (Join-Path $projectRoot '.local') -Force | Out-Null
if(Test-Path -LiteralPath '.local/runtime.json'){throw 'A saved local session exists. Run scripts/stop-local.ps1 before starting another.'}
& $npmBin run setup
if($LASTEXITCODE -ne 0){throw 'Local setup failed'}
if(-not $SkipBuild){& $npmBin run build;if($LASTEXITCODE -ne 0){throw 'Build failed'}}
& $npmBin run db:local
if($LASTEXITCODE -ne 0){throw 'Database setup failed'}
function Start-Hidden($exe,$argsList,$logName){
 return Start-Process -FilePath $exe -ArgumentList $argsList -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot ".local/$logName.out.log") -RedirectStandardError (Join-Path $projectRoot ".local/$logName.err.log")
}
$worker=Start-Hidden $nodeBin @("$projectRoot/node_modules/wrangler/bin/wrangler.js",'dev','--ip','127.0.0.1','--port','8787','--log-level','warn') 'worker'
$gateway=Start-Hidden $nodeBin @("$projectRoot/scripts/gateway.mjs") 'gateway'
$runtime=@{root=$projectRoot;worker=$worker.Id;gateway=$gateway.Id;startedAt=(Get-Date).ToUniversalTime().ToString('o')}
$runtime|ConvertTo-Json|Set-Content -LiteralPath '.local/runtime.json' -Encoding utf8
$ready=$false
for($i=0;$i -lt 40;$i++){try{if((Invoke-WebRequest -Uri 'http://127.0.0.1:8788/api/health' -TimeoutSec 2).StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 500}
if(-not $ready){throw 'Local server did not become ready. Inspect .local/worker.err.log and .local/gateway.err.log.'}
$jobs=Start-Hidden $nodeBin @("$projectRoot/scripts/local-jobs.mjs") 'jobs'
$tunnel=Start-Hidden $tunnelBin @('tunnel','--url','http://127.0.0.1:8788','--no-autoupdate') 'tunnel'
$runtime.jobs=$jobs.Id;$runtime.tunnel=$tunnel.Id
$runtime|ConvertTo-Json|Set-Content -LiteralPath '.local/runtime.json' -Encoding utf8
Write-Output 'Local app: http://127.0.0.1:8788'
Write-Output 'Admin access is saved privately in .local/admin-access.txt.'
Write-Output 'Tunnel URL will appear in .local/tunnel.err.log.'

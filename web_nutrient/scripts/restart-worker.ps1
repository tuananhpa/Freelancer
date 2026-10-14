param([switch]$SkipBuild)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$runtime=Get-Content -LiteralPath '.local/runtime.json' -Raw|ConvertFrom-Json
if([IO.Path]::GetFullPath($runtime.root) -ne [IO.Path]::GetFullPath($projectRoot)){throw 'Runtime directory mismatch.'}
if(-not $SkipBuild){& (Get-Command npm.cmd).Source run build;if($LASTEXITCODE -ne 0){throw 'Build failed'}}
$old=Get-CimInstance Win32_Process -Filter "ProcessId=$($runtime.worker)"
if($old){
 if(-not $old.CommandLine.Replace('/','\').Contains($projectRoot)){throw 'Worker process does not belong to this project.'}
 function Stop-WorkerChildren([int]$parentProcessId){foreach($child in Get-CimInstance Win32_Process -Filter "ParentProcessId=$parentProcessId"){Stop-WorkerChildren $child.ProcessId;Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue}}
 Stop-WorkerChildren $old.ProcessId
 Stop-Process -Id $old.ProcessId -Force -ErrorAction SilentlyContinue
}
$worker=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @("$projectRoot/node_modules/wrangler/bin/wrangler.js",'dev','--ip','127.0.0.1','--port','8787','--log-level','warn') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput "$projectRoot/.local/worker.out.log" -RedirectStandardError "$projectRoot/.local/worker.err.log"
$runtime.worker=$worker.Id
$runtime|ConvertTo-Json|Set-Content -LiteralPath '.local/runtime.json' -Encoding utf8
$ready=$false
for($i=0;$i -lt 40;$i++){try{if((Invoke-WebRequest -Uri 'http://127.0.0.1:8788/api/health' -TimeoutSec 2).StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 500}
if(-not $ready){throw 'Worker failed to become ready.'}
Write-Output 'Worker restarted; current tunnel URL retained.'

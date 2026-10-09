param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $taskRoot
$taskRuntime = Join-Path $taskRoot '.runtime'
New-Item -ItemType Directory -Path $taskRuntime -Force | Out-Null
$taskTunnelPidFile = Join-Path $taskRuntime 'tunnel.pid'
$taskUrlFile = Join-Path $taskRuntime 'tunnel-url.txt'
if ((Test-Path -LiteralPath $taskTunnelPidFile) -and (Test-Path -LiteralPath $taskUrlFile)) {
  $taskStoredId = [int](Get-Content -LiteralPath $taskTunnelPidFile)
  $taskExisting = Get-CimInstance Win32_Process -Filter "ProcessId = $taskStoredId" -ErrorAction SilentlyContinue
  if ($taskExisting -and $taskExisting.Name -eq 'cloudflared.exe' -and $taskExisting.CommandLine.Contains($taskRoot)) {
    Write-Output (Get-Content -LiteralPath $taskUrlFile)
    exit 0
  }
}
if (-not $SkipBuild) {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed; tunnel was not started.' }
}
$taskCloudflareCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
$taskCloudflare = if ($taskCloudflareCommand) { $taskCloudflareCommand.Source } else { 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
if (-not (Test-Path -LiteralPath $taskCloudflare)) { throw 'Install cloudflared first.' }
$taskNode = (Get-Command node).Source
$taskPreviewPidFile = Join-Path $taskRuntime 'preview.pid'
$taskPreviewProcess = $null
if (Test-Path -LiteralPath $taskPreviewPidFile) {
  $taskStoredId = [int](Get-Content -LiteralPath $taskPreviewPidFile)
  $taskPreviewProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $taskStoredId" -ErrorAction SilentlyContinue
  if ($taskPreviewProcess -and ($taskPreviewProcess.Name -ne 'node.exe' -or -not $taskPreviewProcess.CommandLine.Contains($taskRoot))) { $taskPreviewProcess = $null }
}
if (-not $taskPreviewProcess) {
  $taskVite = Join-Path $taskRoot 'node_modules\vite\bin\vite.js'
  $taskPreviewProcess = Start-Process -FilePath $taskNode -ArgumentList @(('"' + $taskVite + '"'),'preview','--host','127.0.0.1','--port','4173','--strictPort') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'preview.out.log') -RedirectStandardError (Join-Path $taskRuntime 'preview.err.log') -PassThru
  $taskPreviewProcess.Id | Set-Content -LiteralPath $taskPreviewPidFile
}
$taskReady = $false
for ($taskAttempt=0; $taskAttempt -lt 10; $taskAttempt++) {
  try {
    $taskResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:4173' -UseBasicParsing -TimeoutSec 3
    if ($taskResponse.StatusCode -eq 200) { $taskReady=$true; break }
  } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $taskReady) { throw 'Production preview could not start. Check .runtime/preview.err.log.' }
$taskEmptyConfig = Join-Path $taskRuntime 'cloudflared-empty.yml'
'{}' | Set-Content -LiteralPath $taskEmptyConfig -Encoding ascii
$taskTunnel = Start-Process -FilePath $taskCloudflare -ArgumentList @('--no-autoupdate','tunnel','--config',('"' + $taskEmptyConfig + '"'),'--url','http://127.0.0.1:4173','--protocol','http2') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'tunnel.out.log') -RedirectStandardError (Join-Path $taskRuntime 'tunnel.err.log') -PassThru
$taskTunnel.Id | Set-Content -LiteralPath $taskTunnelPidFile
for ($taskAttempt=0; $taskAttempt -lt 60; $taskAttempt++) {
  $taskLog = Get-Content -LiteralPath (Join-Path $taskRuntime 'tunnel.err.log') -Raw -ErrorAction SilentlyContinue
  if ($taskLog -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
    $taskMatches = $Matches[0]
    $taskMatches | Set-Content -LiteralPath $taskUrlFile
    Write-Output $taskMatches
    exit 0
  }
  if ($taskTunnel.HasExited) { throw 'Tunnel stopped. Check .runtime/tunnel.err.log.' }
  Start-Sleep -Milliseconds 500
}
throw 'Tunnel URL is not ready yet. Check .runtime/tunnel.err.log.'

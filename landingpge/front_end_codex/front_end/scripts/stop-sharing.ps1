$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskRuntime = Join-Path $taskRoot '.runtime'
foreach ($taskService in @('tunnel','preview')) {
  $taskPidFile = Join-Path $taskRuntime ($taskService + '.pid')
  if (-not (Test-Path -LiteralPath $taskPidFile)) { continue }
  $taskProcessId = [int](Get-Content -LiteralPath $taskPidFile)
  $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $taskProcessId" -ErrorAction SilentlyContinue
  $taskExpected = if ($taskService -eq 'tunnel') { 'cloudflared.exe' } else { 'node.exe' }
  if ($taskProcess -and $taskProcess.Name -eq $taskExpected -and $taskProcess.CommandLine.Contains($taskRoot)) {
    Stop-Process -Id $taskProcessId
    Write-Output "Stopped $taskService ($taskProcessId)."
  }
}

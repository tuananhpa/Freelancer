$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$runtimePath=Join-Path $projectRoot '.local/runtime.json'
if(-not(Test-Path -LiteralPath $runtimePath)){Write-Output 'No saved local session.';exit}
$runtime=Get-Content -LiteralPath $runtimePath -Raw|ConvertFrom-Json
if([IO.Path]::GetFullPath($runtime.root) -ne [IO.Path]::GetFullPath($projectRoot)){throw 'Runtime directory mismatch; refusing to stop processes.'}
foreach($key in @('tunnel','jobs','gateway','worker')){
 $processId=$runtime.$key
 if(-not $processId){continue}
 $proc=Get-CimInstance Win32_Process -Filter "ProcessId=$processId"
 if(-not $proc){continue}
 $command=$proc.CommandLine.Replace('/','\')
 $belongs=$command.Contains($projectRoot)
 if($key -eq 'tunnel'){$belongs=$proc.Name -eq 'cloudflared.exe' -and $command.Contains('127.0.0.1:8788')}
 if(-not $belongs){throw "Process $processId no longer belongs to this project."}
 # Stop descendants first, scoped to this verified project process tree.
 function Stop-Descendants([int]$parentProcessId){
  foreach($child in Get-CimInstance Win32_Process -Filter "ParentProcessId=$parentProcessId"){Stop-Descendants $child.ProcessId;Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue}
 }
 Stop-Descendants $processId
 Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}
Remove-Item -LiteralPath $runtimePath
Write-Output 'Stopped this project local services.'

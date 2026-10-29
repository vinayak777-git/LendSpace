# LendSpace Production Pre-Flight PowerShell Wrapper
$ErrorActionPreference = "Stop"

Write-Host "Starting LendSpace Production Pre-Flight Sanity Checks..." -ForegroundColor Cyan

$PythonExe = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

& $PythonExe ".\scripts\preflight.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pre-flight checks FAILED with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Pre-flight checks completed successfully!" -ForegroundColor Green
exit 0


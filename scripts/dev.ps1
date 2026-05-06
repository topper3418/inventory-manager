$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$venv = Join-Path $root "venv"

Set-Location $root

if (-not (Test-Path $venv)) {
	python -m venv $venv
}

$python = Join-Path $venv "Scripts\python.exe"

& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $root "requirements.txt")

Set-Location (Join-Path $root "frontend")
npm install

Set-Location $root
New-Item -ItemType Directory -Path (Join-Path $root "data") -Force | Out-Null

$api = Start-Process -FilePath $python -ArgumentList "-m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000" -PassThru
$web = Start-Process -FilePath "npm" -ArgumentList "run dev -- --host 127.0.0.1 --port 5173" -PassThru -WorkingDirectory (Join-Path $root "frontend")

Write-Host "Backend PID: $($api.Id)"
Write-Host "Frontend PID: $($web.Id)"
Write-Host "Press Enter to stop both processes..."
[void][System.Console]::ReadLine()

if (!$api.HasExited) { Stop-Process -Id $api.Id -Force }
if (!$web.HasExited) { Stop-Process -Id $web.Id -Force }

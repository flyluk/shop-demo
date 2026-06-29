param(
  [string]$RemoteHost = "dev-vm1.test.local",
  [string]$RemotePath = "/home/flyluk/development/shop-demo",
  [string]$LocalPath = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"

Write-Host "Pulling ${RemoteHost}:${RemotePath} -> ${LocalPath}"

$dirs = @('backend', 'frontend', 'db', 'k8s', 'k6', 'scripts')
foreach ($dir in $dirs) {
  scp -r "${RemoteHost}:${RemotePath}/$dir" $LocalPath
}

$files = @('docker-compose.yml', 'README.md', '.gitignore', '.gitattributes')
foreach ($file in $files) {
  scp "${RemoteHost}:${RemotePath}/$file" $LocalPath
}

Write-Host "Done. Local source updated at $LocalPath"

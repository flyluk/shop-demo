param(
  [string]$RemoteHost = "dev-vm1.test.local",
  [string]$RemotePath = "/home/flyluk/development/shop-demo",
  [string]$LocalPath = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"

Write-Host "Pushing ${LocalPath} -> ${RemoteHost}:${RemotePath}"

$dirs = @('backend', 'frontend', 'db', 'k8s', 'k6', 'scripts')
foreach ($dir in $dirs) {
  scp -r (Join-Path $LocalPath $dir) "${RemoteHost}:${RemotePath}/"
}

$files = @('docker-compose.yml', 'README.md', '.gitignore', '.gitattributes')
foreach ($file in $files) {
  scp (Join-Path $LocalPath $file) "${RemoteHost}:${RemotePath}/"
}

ssh $RemoteHost "sed -i 's/\r$//' ${RemotePath}/scripts/*.sh ${RemotePath}/k8s/*.sh 2>/dev/null; chmod +x ${RemotePath}/scripts/*.sh ${RemotePath}/k8s/*.sh 2>/dev/null; true"

Write-Host "Done. Remote source updated at ${RemoteHost}:${RemotePath}"

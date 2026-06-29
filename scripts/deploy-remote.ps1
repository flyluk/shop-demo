param(
  [string]$RemoteHost = "dev-vm1.test.local",
  [switch]$SkipSync
)

$ErrorActionPreference = "Stop"

if (-not $SkipSync) {
  & "$PSScriptRoot\sync-to-dev-vm1.ps1" -RemoteHost $RemoteHost
}

Write-Host "Deploying on $RemoteHost..."
ssh $RemoteHost "sed -i 's/\r$//' /home/flyluk/development/shop-demo/scripts/*.sh /home/flyluk/development/shop-demo/k8s/*.sh 2>/dev/null; bash /home/flyluk/development/shop-demo/scripts/redeploy-shop-demo.sh"

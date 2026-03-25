param(
  [Parameter(Mandatory=$false)]
  [string]$ManifestPath = "releases.json",

  [Parameter(Mandatory=$true)]
  [string]$WindowsZipPath,

  [Parameter(Mandatory=$true)]
  [string]$LinuxTarGzPath
)

$manifestFullPath = Join-Path $PSScriptRoot $ManifestPath

if (!(Test-Path $manifestFullPath)) {
  throw "Manifest not found: $manifestFullPath"
}
if (!(Test-Path $WindowsZipPath)) {
  throw "Windows binary not found: $WindowsZipPath"
}
if (!(Test-Path $LinuxTarGzPath)) {
  throw "Linux binary not found: $LinuxTarGzPath"
}

$json = Get-Content $manifestFullPath -Raw | ConvertFrom-Json

$winHash = (Get-FileHash -Path $WindowsZipPath -Algorithm SHA256).Hash.ToLower()
$linuxHash = (Get-FileHash -Path $LinuxTarGzPath -Algorithm SHA256).Hash.ToLower()

foreach ($r in $json.releases) {
  if ($r.platform -eq "windows-x64") { $r.sha256 = $winHash }
  if ($r.platform -eq "linux-x64") { $r.sha256 = $linuxHash }
}

$json | ConvertTo-Json -Depth 10 | Set-Content $manifestFullPath -Encoding utf8
Write-Host "Updated sha256 values in $manifestFullPath"

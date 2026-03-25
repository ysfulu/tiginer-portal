Add-Type -Assembly 'System.IO.Compression.FileSystem'

$base = $PSScriptRoot
$src = Join-Path $base "tiginer-v2.0.0"
$zip = Join-Path $base "tiginer-v2.0.0.zip"
$tar = Join-Path $base "tiginer-v2.0.0.tar.gz"

# ZIP
if (Test-Path $zip) { Remove-Item $zip -Force }
Write-Host "ZIP olusturuluyor..."
[System.IO.Compression.ZipFile]::CreateFromDirectory($src, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
$sizeMB = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "ZIP olusturuldu: $sizeMB MB"

# TAR.GZ
if (Test-Path $tar) { Remove-Item $tar -Force }
Write-Host "TAR.GZ olusturuluyor..."
tar -czf $tar -C (Split-Path $src) (Split-Path $src -Leaf)
$sizeTar = [math]::Round((Get-Item $tar).Length / 1MB, 1)
Write-Host "TAR.GZ olusturuldu: $sizeTar MB"

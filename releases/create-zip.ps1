Add-Type -Assembly 'System.IO.Compression.FileSystem'

$src = "C:\Users\ysful\Masaüstü\nemov2\tiginer.com\releases\tiginer-v2.0.0"
$zip = "C:\Users\ysful\Masaüstü\nemov2\tiginer.com\releases\tiginer-v2.0.0.zip"

if (Test-Path $zip) { Remove-Item $zip -Force }

Write-Host "ZIP olusturuluyor..."
[System.IO.Compression.ZipFile]::CreateFromDirectory($src, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

$sizeMB = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "ZIP olusturuldu: $sizeMB MB"

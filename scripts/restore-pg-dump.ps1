#Requires -Version 5.1
<#
  Restore file .dump (pg_dump -Fc) vào container website-postgres-dev.

  Từ thư mục Website:
    docker compose -f docker-compose.postgres.local.yml up -d
    .\scripts\restore-pg-dump.ps1
    # Lỗi "already exists" trên lần 2+:
    .\scripts\restore-pg-dump.ps1 -Clean
#>
[CmdletBinding()]
param(
  [string] $DumpPath = "",
  [switch] $Clean
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($DumpPath)) {
  $exact = Join-Path $root "db-backup-2026-04-24T17-01-00-045Z.dump"
  if (Test-Path -LiteralPath $exact) {
    $DumpPath = $exact
  } else {
    $f = Get-ChildItem -Path $root -Filter "db-backup*.dump" -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if ($f) { $DumpPath = $f.FullName }
  }
}

if (-not $DumpPath -or -not (Test-Path -LiteralPath $DumpPath)) {
  Write-Error "Không thấy file .dump trong $root. Truyền -DumpPath '...'."
}

$container = "website-postgres-dev"
$remotePath = "/tmp/restore.dump"

Write-Host "File: $DumpPath" -ForegroundColor Cyan
docker cp -- "$DumpPath" "${container}:${remotePath}"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$argList = @("exec", "-i", $container, "pg_restore", "-U", "postgres", "-d", "my-store", "--no-owner", "--no-acl", "--verbose")
if ($Clean) { $argList += @("--clean", "--if-exists") }
$argList += $remotePath

& docker @argList
$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Warning "pg_restore mã $code. Có thể cần: .\scripts\restore-pg-dump.ps1 -Clean"
  exit $code
}
Write-Host "`nOK. Trong my-store/apps/server/.env dùng:" -ForegroundColor Green
Write-Host "DATABASE_URL=postgresql://postgres:password@localhost:5432/my-store" -ForegroundColor Yellow

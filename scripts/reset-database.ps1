# Reset Database Script
# Script untuk mereset database dengan kredensial baru

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Reset Database Surat Desa" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Path MySQL Laragon
$mysqlPath = "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
$sqlFile = "c:\laragon\www\desa\database\surat_desa.sql"

# Cek apakah MySQL ada
if (-not (Test-Path $mysqlPath)) {
    Write-Host "Error: MySQL tidak ditemukan di $mysqlPath" -ForegroundColor Red
    Write-Host "Silakan sesuaikan path MySQL di script ini" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. Dropping database surat_desa..." -ForegroundColor Yellow
& $mysqlPath -u root -e "DROP DATABASE IF EXISTS surat_desa;"

Write-Host "2. Creating database surat_desa..." -ForegroundColor Yellow
& $mysqlPath -u root -e "CREATE DATABASE surat_desa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

Write-Host "3. Importing SQL file..." -ForegroundColor Yellow
Get-Content $sqlFile | & $mysqlPath -u root surat_desa

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Database berhasil direset!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Kredensial Login:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Super Admin:" -ForegroundColor Yellow
Write-Host "  Email    : superadmin@desa.com"
Write-Host "  Password : admin123"
Write-Host ""
Write-Host "Admin/Verifikator:" -ForegroundColor Yellow
Write-Host "  Email    : admin@desa.com"
Write-Host "  Password : admin123"
Write-Host ""
Write-Host "Warga:" -ForegroundColor Yellow
Write-Host "  Email    : warga@desa.com"
Write-Host "  Password : warga123"
Write-Host ""

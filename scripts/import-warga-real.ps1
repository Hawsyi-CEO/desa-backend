# Script untuk extract tabel warga dari file SQL besar
# Dan mengimportnya ke database surat_desa

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  IMPORT DATA WARGA DARI u390486773_cibadak.sql" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$sourceFile = "C:\laragon\www\desa\u390486773_cibadak.sql"
$tempFile = "C:\laragon\www\desa\database\warga_import.sql"
$mysqlPath = "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"

# Step 1: Extract CREATE TABLE warga dan INSERT statements
Write-Host "Step 1: Extracting warga table from SQL file..." -ForegroundColor Yellow
Write-Host "Source: $sourceFile" -ForegroundColor Gray
Write-Host ""

$inWargaSection = $false
$wargaSQL = @()
$wargaSQL += "-- Data Warga dari u390486773_cibadak.sql"
$wargaSQL += "-- Imported on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$wargaSQL += ""
$wargaSQL += "USE surat_desa;"
$wargaSQL += ""
$wargaSQL += "-- Hapus data warga lama (kecuali yang sudah ada)"
$wargaSQL += "-- DROP TABLE IF EXISTS warga;"
$wargaSQL += ""

$lineCount = 0
$insertCount = 0

Get-Content $sourceFile | ForEach-Object {
    $line = $_
    $lineCount++
    
    # Progress setiap 1000 baris
    if ($lineCount % 1000 -eq 0) {
        Write-Host "  Processing line $lineCount..." -ForegroundColor Gray
    }
    
    # Mulai section warga
    if ($line -match "CREATE TABLE.*warga") {
        $inWargaSection = $true
        Write-Host "  Found CREATE TABLE warga at line $lineCount" -ForegroundColor Green
    }
    
    # Tambahkan baris jika dalam section warga
    if ($inWargaSection) {
        $wargaSQL += $line
        
        # Hitung INSERT statements
        if ($line -match "INSERT INTO.*warga.*VALUES") {
            $insertCount++
        }
        
        # Akhir section warga (ketika menemukan CREATE TABLE lain atau LOCK TABLES lain)
        if ($line -match "(CREATE TABLE|LOCK TABLES)(?!.*warga)" -and $lineCount -gt 3850) {
            $inWargaSection = $false
            Write-Host "  Found end of warga section at line $lineCount" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Extraction complete!" -ForegroundColor Green
Write-Host "  Total lines processed: $lineCount" -ForegroundColor Cyan
Write-Host "  INSERT statements found: $insertCount" -ForegroundColor Cyan
Write-Host ""

# Step 2: Simpan ke file temporary
Write-Host "Step 2: Saving to temporary file..." -ForegroundColor Yellow
$wargaSQL | Out-File -FilePath $tempFile -Encoding UTF8
$fileSize = [math]::Round((Get-Item $tempFile).Length / 1KB, 2)
Write-Host "  Saved to: $tempFile" -ForegroundColor Green
Write-Host "  File size: $fileSize KB" -ForegroundColor Cyan
Write-Host ""

# Step 3: Import ke database
Write-Host "Step 3: Importing to database..." -ForegroundColor Yellow
Write-Host "  Database: surat_desa" -ForegroundColor Gray
Write-Host ""

try {
    Get-Content $tempFile | & $mysqlPath -u root surat_desa 2>&1 | Out-Null
    Write-Host "  Import successful!" -ForegroundColor Green
} catch {
    Write-Host "  Error during import: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Verifikasi data
Write-Host "Step 4: Verifying imported data..." -ForegroundColor Yellow
$result = & $mysqlPath -u root surat_desa -e "SELECT COUNT(*) as total FROM warga" 2>&1
Write-Host $result
Write-Host ""

# Step 5: Tampilkan sample data
Write-Host "Step 5: Sample data (first 5 records)..." -ForegroundColor Yellow
$sample = & $mysqlPath -u root surat_desa -e "SELECT nik, nama_anggota_keluarga, rt, rw, jenis_kelamin FROM warga LIMIT 5" 2>&1
Write-Host $sample
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ IMPORT COMPLETED!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run sync script to create user accounts" -ForegroundColor Yellow
Write-Host "  cd C:\laragon\www\desa\backend" -ForegroundColor White
Write-Host "  node sync-warga.js" -ForegroundColor White
Write-Host ""

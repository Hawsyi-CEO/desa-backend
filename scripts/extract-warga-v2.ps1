# Extract warga table dengan metode line-by-line
Write-Host "Extracting warga table (line by line method)..." -ForegroundColor Cyan

$sourceFile = "C:\laragon\www\desa\u390486773_cibadak.sql"
$outputFile = "C:\laragon\www\desa\database\warga_final.sql"

$inWargaCreate = $false
$inWargaInsert = $false
$output = @()

# Header
$output += "-- Data Warga dari u390486773_cibadak.sql"
$output += "-- Extracted: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += ""
$output += "USE surat_desa;"
$output += "DROP TABLE IF EXISTS warga;"
$output += ""

# Custom CREATE TABLE
$output += "CREATE TABLE ``warga`` ("
$output += "  ``id`` int(11) NOT NULL AUTO_INCREMENT,"
$output += "  ``rw`` varchar(10) NOT NULL,"
$output += "  ``rt`` varchar(10) NOT NULL,"
$output += "  ``dusun`` varchar(50) NOT NULL,"
$output += "  ``alamat`` text NOT NULL,"
$output += "  ``no_kk`` varchar(20) NOT NULL,"
$output += "  ``nama_kepala_keluarga`` varchar(100) NOT NULL,"
$output += "  ``no_anggota`` int(11) NOT NULL,"
$output += "  ``nik`` varchar(20) NOT NULL,"
$output += "  ``nama_anggota_keluarga`` varchar(100) NOT NULL,"
$output += "  ``jenis_kelamin`` enum('Laki-laki','Perempuan') NOT NULL DEFAULT 'Laki-laki',"
$output += "  ``hubungan_keluarga`` varchar(50) NOT NULL,"
$output += "  ``tempat_lahir`` varchar(50) NOT NULL,"
$output += "  ``tanggal_lahir`` date NOT NULL,"
$output += "  ``usia`` int(11) NOT NULL DEFAULT 0,"
$output += "  ``status_pernikahan`` varchar(50) NOT NULL,"
$output += "  ``agama`` varchar(20) NOT NULL,"
$output += "  ``golongan_darah`` varchar(5) NOT NULL,"
$output += "  ``kewarganegaraan`` varchar(50) NOT NULL,"
$output += "  ``etnis_suku`` varchar(50) NOT NULL,"
$output += "  ``pendidikan`` varchar(50) NOT NULL,"
$output += "  ``pekerjaan`` varchar(50) NOT NULL,"
$output += "  ``created_at`` timestamp NOT NULL DEFAULT current_timestamp(),"
$output += "  ``updated_at`` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),"
$output += "  PRIMARY KEY (``id``),"
$output += "  UNIQUE KEY ``nik`` (``nik``)"
$output += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;"
$output += ""

$lineNum = 0
$insertCount = 0

Write-Host "Reading source file..." -ForegroundColor Yellow

Get-Content $sourceFile | ForEach-Object {
    $line = $_
    $lineNum++
    
    if ($lineNum % 500 -eq 0) {
        Write-Host "  Line $lineNum..." -ForegroundColor Gray
    }
    
    # Skip CREATE TABLE warga (kita sudah buat custom)
    if ($line -match "CREATE TABLE.*warga") {
        $inWargaCreate = $true
        return
    }
    
    # Akhir CREATE TABLE warga
    if ($inWargaCreate -and $line -match "ENGINE=") {
        $inWargaCreate = $false
        return
    }
    
    # Skip jika masih dalam CREATE TABLE warga
    if ($inWargaCreate) {
        return
    }
    
    # Mulai INSERT warga
    if ($line -match "INSERT INTO.*warga.*VALUES") {
        $inWargaInsert = $true
        $insertCount++
        
        # Fix datetime values
        $line = $line -replace "'0000-00-00 00:00:00'", "NOW()"
        $line = $line -replace "'0000-00-00'", "NULL"
        
        $output += $line
        return
    }
    
    # Lanjutkan INSERT (baris dengan data VALUES)
    if ($inWargaInsert) {
        # Stop jika menemukan statement lain
        if ($line -match "^(INSERT INTO|CREATE|ALTER|COMMIT|UNLOCK|LOCK|\-\-)" -and $line -notmatch "INSERT INTO.*warga") {
            $inWargaInsert = $false
            return
        }
        
        # Fix datetime values
        $line = $line -replace "'0000-00-00 00:00:00'", "NOW()"
        $line = $line -replace "'0000-00-00'", "NULL"
        
        $output += $line
    }
}

# Footer
$output += ""
$output += "-- Verify import"
$output += "SELECT 'Import completed!' as Status;"
$output += "SELECT COUNT(*) as 'Total Warga' FROM warga;"
$output += "SELECT COUNT(DISTINCT rt) as 'Total RT', COUNT(DISTINCT rw) as 'Total RW' FROM warga;"

# Save
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "File: $outputFile" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
Write-Host "INSERT statements: $insertCount" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: Import to database" -ForegroundColor Yellow
Write-Host '  Get-Content "database\warga_final.sql" | mysql -u root surat_desa' -ForegroundColor White

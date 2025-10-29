# Script extract HANYA tabel warga dengan lebih akurat
Write-Host "Extracting WARGA table only..." -ForegroundColor Cyan

$sourceFile = "C:\laragon\www\desa\u390486773_cibadak.sql"
$outputFile = "C:\laragon\www\desa\database\warga_only.sql"

$content = Get-Content $sourceFile -Raw

# Extract CREATE TABLE warga dan semua INSERT INTO warga
# Stop sebelum COMMIT atau ALTER TABLE atau table lain
$pattern = "(?s)(CREATE TABLE ``warga``.*?INSERT INTO ``warga``.*?);(?=\s*(?:COMMIT|ALTER TABLE|CREATE TABLE|UNLOCK TABLES|/\*!))"
$match = [regex]::Match($content, $pattern)

if ($match.Success) {
    $wargaSQL = $match.Value
    
    # Replace CREATE TABLE warga dengan struktur yang sesuai
    $newCreateTable = @"
CREATE TABLE ``warga`` (
  ``id`` int(11) NOT NULL AUTO_INCREMENT,
  ``rw`` varchar(10) NOT NULL,
  ``rt`` varchar(10) NOT NULL,
  ``dusun`` varchar(50) NOT NULL,
  ``alamat`` text NOT NULL,
  ``no_kk`` varchar(20) NOT NULL,
  ``nama_kepala_keluarga`` varchar(100) NOT NULL,
  ``no_anggota`` int(11) NOT NULL,
  ``nik`` varchar(20) NOT NULL,
  ``nama_anggota_keluarga`` varchar(100) NOT NULL,
  ``jenis_kelamin`` enum('Laki-laki','Perempuan') NOT NULL DEFAULT 'Laki-laki',
  ``hubungan_keluarga`` varchar(50) NOT NULL,
  ``tempat_lahir`` varchar(50) NOT NULL,
  ``tanggal_lahir`` date NOT NULL,
  ``usia`` int(11) NOT NULL DEFAULT 0,
  ``status_pernikahan`` varchar(50) NOT NULL,
  ``agama`` varchar(20) NOT NULL,
  ``golongan_darah`` varchar(5) NOT NULL,
  ``kewarganegaraan`` varchar(50) NOT NULL,
  ``etnis_suku`` varchar(50) NOT NULL,
  ``pendidikan`` varchar(50) NOT NULL,
  ``pekerjaan`` varchar(50) NOT NULL,
  ``created_at`` timestamp NOT NULL DEFAULT current_timestamp(),
  ``updated_at`` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (``id``),
  UNIQUE KEY ``nik`` (``nik``)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

"@
    
    # Replace hanya bagian CREATE TABLE, keep INSERT statements
    $wargaSQL = [regex]::Replace($wargaSQL, "CREATE TABLE ``warga``.*?(?=INSERT INTO)", $newCreateTable, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    # Fix datetime issues
    $wargaSQL = $wargaSQL -replace "'0000-00-00 00:00:00'", "NOW()"
    $wargaSQL = $wargaSQL -replace "'0000-00-00'", "NULL"
    
    # Fix enum values - pastikan konsisten
    $wargaSQL = $wargaSQL -replace "'Perempuan'", "'Perempuan'"
    $wargaSQL = $wargaSQL -replace "'Laki-laki'", "'Laki-laki'"
    
    # Add header
    $finalSQL = @"
-- Tabel Warga untuk surat_desa
-- Extracted from u390486773_cibadak.sql
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

USE surat_desa;

DROP TABLE IF EXISTS warga;

$wargaSQL;

-- Verify
SELECT 'Import completed!' as Status;
SELECT COUNT(*) as 'Total Warga' FROM warga;
SELECT COUNT(DISTINCT rt) as 'Total RT', COUNT(DISTINCT rw) as 'Total RW' FROM warga;
"@
    
    $finalSQL | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "SUCCESS - Extracted successfully!" -ForegroundColor Green
    Write-Host "File: $outputFile" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
    
    # Count estimated records
    $recordCount = ([regex]::Matches($wargaSQL, '\(\d+,')).Count
    Write-Host "Estimated records: $recordCount" -ForegroundColor Yellow
    
} else {
    Write-Host "FAILED - Could not extract warga table!" -ForegroundColor Red
}

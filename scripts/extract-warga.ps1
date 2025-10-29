# Extract warga table from large SQL file
Write-Host "Extracting warga table from u390486773_cibadak.sql..." -ForegroundColor Green

$sourceFile = "C:\laragon\www\desa\u390486773_cibadak.sql"
$outputFile = "C:\laragon\www\desa\database\warga_table_only.sql"

# Read file
Write-Host "Reading file..." -ForegroundColor Yellow
$content = Get-Content $sourceFile -Raw

# Find CREATE TABLE warga
Write-Host "Finding CREATE TABLE warga..." -ForegroundColor Yellow
$createTablePattern = "CREATE TABLE `warga`.*?ENGINE=\w+.*?;"
$createTableMatch = [regex]::Match($content, $createTablePattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($createTableMatch.Success) {
    Write-Host "✓ Found CREATE TABLE warga" -ForegroundColor Green
} else {
    Write-Host "✗ CREATE TABLE warga not found!" -ForegroundColor Red
    exit 1
}

# Find INSERT INTO warga
Write-Host "Finding INSERT INTO warga..." -ForegroundColor Yellow
$insertPattern = "INSERT INTO `warga`.*?VALUES.*?(?=\n(?:INSERT|CREATE|ALTER|DROP|\/\*|LOCK|UNLOCK|$))"
$insertMatches = [regex]::Matches($content, $insertPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Write-Host "✓ Found $($insertMatches.Count) INSERT statements" -ForegroundColor Green

# Build output
$output = @"
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: $(Get-Date -Format "MMM dd, yyyy 'at' hh:mm tt")
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: surat_desa
--

-- --------------------------------------------------------

--
-- Table structure for table warga
--

DROP TABLE IF EXISTS warga;

$($createTableMatch.Value)

--
-- Dumping data for table warga
--


"@

# Add all INSERT statements
foreach ($match in $insertMatches) {
    $output += $match.Value + "`n`n"
}

$output += @"

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
"@

# Save to file
Write-Host "Saving to $outputFile..." -ForegroundColor Yellow
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "✅ SUCCESS!" -ForegroundColor Green
Write-Host "Created: $outputFile" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "mysql -u root -p surat_desa < database\warga_table_only.sql" -ForegroundColor White

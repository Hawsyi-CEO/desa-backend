# Script Instalasi Otomatis untuk Windows PowerShell
# Surat Digital Desa

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  INSTALASI SURAT DIGITAL DESA" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install Backend Dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install Frontend Dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Import database dari: database/surat_desa.sql" -ForegroundColor White
Write-Host "2. Run backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "3. Run frontend (terminal baru): cd frontend && npm run dev" -ForegroundColor White
Write-Host "4. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Yellow
Write-Host "Super Admin: superadmin@desa.com / admin123" -ForegroundColor White
Write-Host "Admin RT/RW: admin@desa.com / admin123" -ForegroundColor White
Write-Host "Warga: warga@desa.com / warga123" -ForegroundColor White
Write-Host ""

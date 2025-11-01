# Deployment Script - Upload Changed Files Only (PowerShell Version)
# Untuk update backend tanpa menimpa data existing

Write-Host "🚀 Starting deployment of updated backend files to VPS..." -ForegroundColor Cyan

# VPS Credentials
$VPS_IP = "72.61.140.193"
$VPS_USER = "root"
$VPS_PASSWORD = "Vertinova123#"
$VPS_PATH = "/var/www/surat-desa-backend"

# Fungsi untuk upload file via SCP
function Upload-FileToVPS {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    
    Write-Host "  → Uploading $LocalPath" -ForegroundColor Yellow
    
    # Menggunakan PSCP (PuTTY SCP) atau SCP native Windows
    # Jika belum ada PSCP, install dulu: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
    
    # Opsi 1: Menggunakan PSCP
    # pscp -pw "$VPS_PASSWORD" "$LocalPath" "${VPS_USER}@${VPS_IP}:${RemotePath}"
    
    # Opsi 2: Menggunakan scp (jika sudah install OpenSSH di Windows)
    scp "$LocalPath" "${VPS_USER}@${VPS_IP}:${RemotePath}"
}

# Step 1: Create directories on VPS
Write-Host "`n📁 Creating directories on VPS..." -ForegroundColor Blue
$sshCommand = @"
mkdir -p $VPS_PATH/controllers
mkdir -p $VPS_PATH/routes
mkdir -p $VPS_PATH/uploads/formulir
"@

# ssh ${VPS_USER}@${VPS_IP} $sshCommand

# Step 2: Upload files
Write-Host "`n📤 Uploading NEW and MODIFIED files..." -ForegroundColor Blue

# Upload controllers/formulirController.js
Upload-FileToVPS "controllers/formulirController.js" "$VPS_PATH/controllers/formulirController.js"

# Upload routes/formulir.js
Upload-FileToVPS "routes/formulir.js" "$VPS_PATH/routes/formulir.js"

# Upload server.js (modified)
Upload-FileToVPS "server.js" "$VPS_PATH/server.js"

# Upload generate-hash.js (modified)
Upload-FileToVPS "generate-hash.js" "$VPS_PATH/generate-hash.js"

# Upload .env.production sebagai .env
Upload-FileToVPS ".env.production" "$VPS_PATH/.env"

# Optional: Upload sample formulir files
Write-Host "`n📄 Uploading sample formulir files (optional)..." -ForegroundColor Yellow
if (Test-Path "uploads/formulir/*.PDF") {
    scp "uploads/formulir/*.PDF" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/uploads/formulir/" 2>$null
}
if (Test-Path "uploads/formulir/*.docx") {
    scp "uploads/formulir/*.docx" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/uploads/formulir/" 2>$null
}

# Step 3: Restart PM2
Write-Host "`n🔄 Restarting backend service..." -ForegroundColor Blue
$restartCommand = @"
cd $VPS_PATH
pm2 restart surat-desa-backend || pm2 start server.js --name surat-desa-backend
pm2 save
"@

# ssh ${VPS_USER}@${VPS_IP} $restartCommand

Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 Check logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs surat-desa-backend'" -ForegroundColor Cyan

# Instruksi manual jika belum install SSH tools
Write-Host "`n⚠️  CATATAN:" -ForegroundColor Yellow
Write-Host "Jika command ssh/scp belum tersedia, install OpenSSH for Windows:" -ForegroundColor Yellow
Write-Host "Settings → Apps → Optional Features → Add OpenSSH Client" -ForegroundColor White

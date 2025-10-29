# Script untuk mengganti Navbar dengan Layout di semua file
$files = @(
    "c:\laragon\www\desa\frontend\src\pages\SuperAdmin\JenisSurat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\SuperAdmin\FormJenisSurat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\SuperAdmin\KonfigurasiSurat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\SuperAdmin\Surat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\SuperAdmin\Users.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Verifikator\Dashboard.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Verifikator\Surat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Verifikator\Riwayat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Warga\Dashboard.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Warga\Surat.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Warga\History.jsx",
    "c:\laragon\www\desa\frontend\src\pages\Warga\Profile.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Replace import
        $content = $content -replace "import Navbar from '../../components/Navbar';", "import Layout from '../../components/Layout';"
        
        # Replace <Navbar /> with Layout wrapper (opening)
        $content = $content -replace "return \(\s*<>\s*<Navbar />", "return (`n    <Layout>"
        
        # Replace closing fragments
        $content = $content -replace "</>\s*\);", "</Layout>`n  );"
        
        # Save
        Set-Content $file -Value $content -NoNewline
        
        Write-Host "Updated: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! All files updated." -ForegroundColor Cyan

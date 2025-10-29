-- Tambahkan table konfigurasi_surat
USE surat_desa;

CREATE TABLE IF NOT EXISTS konfigurasi_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Header/Kop Surat
  nama_kabupaten VARCHAR(100) DEFAULT 'KABUPATEN BOGOR',
  nama_kecamatan VARCHAR(100) DEFAULT 'KECAMATAN CIAMPEA',
  nama_desa VARCHAR(100) DEFAULT 'DESA CIBADAK',
  alamat_kantor VARCHAR(500) DEFAULT 'Kp. Cibadak Balai Desa No.5 RT.005 RW.001',
  kota VARCHAR(100) DEFAULT 'Bogor - Jawa Barat',
  kode_pos VARCHAR(10) DEFAULT '16620',
  telepon VARCHAR(20) DEFAULT '0251-1234567',
  email VARCHAR(100) DEFAULT 'desacibadak@bogor.go.id',
  website VARCHAR(100) DEFAULT 'www.desacibadak.id',
  
  -- Logo
  logo_url VARCHAR(255) DEFAULT NULL,
  logo_width INT DEFAULT 80,
  logo_height INT DEFAULT 80,
  
  -- Format Nomor Surat
  format_nomor VARCHAR(100) DEFAULT '{{nomor}}/{{kode}}/{{bulan}}/{{tahun}}',
  nomor_urut_awal INT DEFAULT 1,
  reset_nomor_tiap_tahun BOOLEAN DEFAULT TRUE,
  
  -- Pejabat Penandatangan
  jabatan_ttd VARCHAR(100) DEFAULT 'Kepala Desa Cibadak',
  nama_ttd VARCHAR(100) DEFAULT 'LIYA MULIYA, S.Pd.I., M.Pd.',
  nip_ttd VARCHAR(50) DEFAULT NULL,
  
  -- Pejabat Verifikator Default
  jabatan_verifikator VARCHAR(100) DEFAULT 'Ketua RT/RW',
  
  -- Stempel
  gunakan_stempel BOOLEAN DEFAULT TRUE,
  stempel_url VARCHAR(255) DEFAULT NULL,
  
  -- Footer
  footer_text VARCHAR(500) DEFAULT NULL,
  
  -- Style
  border_color VARCHAR(20) DEFAULT '#000000',
  border_width INT DEFAULT 3,
  font_family VARCHAR(50) DEFAULT 'Times New Roman',
  font_size_header INT DEFAULT 14,
  font_size_body INT DEFAULT 12,
  
  -- Keterangan Tambahan
  keterangan VARCHAR(500) DEFAULT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO konfigurasi_surat (
  nama_kabupaten,
  nama_kecamatan,
  nama_desa,
  alamat_kantor,
  kota,
  kode_pos,
  jabatan_ttd,
  nama_ttd
) VALUES (
  'PEMERINTAH KABUPATEN BOGOR',
  'KECAMATAN CIAMPEA',
  'DESA CIBADAK',
  'Kp. Cibadak Balai Desa No.5 RT.005 RW.001 Desa Cibadak Kecamatan Ciampea Kabupaten Bogor',
  'Jawa Barat',
  '16620',
  'Kepala Desa Cibadak',
  'LIYA MULIYA, S.Pd.I., M.Pd.'
);

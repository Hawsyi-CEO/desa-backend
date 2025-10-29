-- Buat tabel warga untuk sistem surat desa
-- Database: surat_desa

CREATE TABLE IF NOT EXISTS `warga` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rw` varchar(10) DEFAULT NULL,
  `rt` varchar(10) DEFAULT NULL,
  `dusun` varchar(50) DEFAULT NULL,
  `alamat` text,
  `no_kk` varchar(20) DEFAULT NULL,
  `nama_kepala_keluarga` varchar(100) DEFAULT NULL,
  `no_anggota` int(11) DEFAULT NULL,
  `nik` varchar(20) NOT NULL,
  `nama_anggota_keluarga` varchar(100) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `hubungan_keluarga` varchar(50) DEFAULT NULL,
  `tempat_lahir` varchar(50) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `usia` int(11) DEFAULT NULL,
  `status_pernikahan` varchar(50) DEFAULT NULL,
  `agama` varchar(20) DEFAULT NULL,
  `golongan_darah` varchar(5) DEFAULT NULL,
  `kewarganegaraan` varchar(50) DEFAULT 'Indonesia',
  `etnis_suku` varchar(50) DEFAULT NULL,
  `pendidikan` varchar(50) DEFAULT NULL,
  `pekerjaan` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nik` (`nik`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data warga
-- Data ini adalah contoh, Anda bisa menambahkan data warga yang sebenarnya

INSERT INTO `warga` (`id`, `rw`, `rt`, `dusun`, `alamat`, `no_kk`, `nama_kepala_keluarga`, `no_anggota`, `nik`, `nama_anggota_keluarga`, `jenis_kelamin`, `hubungan_keluarga`, `tempat_lahir`, `tanggal_lahir`, `usia`, `status_pernikahan`, `agama`, `golongan_darah`, `kewarganegaraan`, `etnis_suku`, `pendidikan`, `pekerjaan`, `created_at`, `updated_at`) VALUES
(1, '01', '01', 'Cibadak', 'Jl. Raya Cibadak No. 1', '3201010101010001', 'Budi Santoso', 1, '3201010101680001', 'Budi Santoso', 'Laki-laki', 'Kepala Keluarga', 'Bogor', '1968-01-01', 56, 'Kawin', 'Islam', 'O', 'Indonesia', 'Sunda', 'S1', 'Wiraswasta', NOW(), NOW()),
(2, '01', '01', 'Cibadak', 'Jl. Raya Cibadak No. 1', '3201010101010001', 'Budi Santoso', 2, '3201010202720002', 'Siti Aminah', 'Perempuan', 'Istri', 'Bogor', '1972-02-02', 52, 'Kawin', 'Islam', 'A', 'Indonesia', 'Sunda', 'SMA', 'Ibu Rumah Tangga', NOW(), NOW()),
(3, '01', '01', 'Cibadak', 'Jl. Raya Cibadak No. 1', '3201010101010001', 'Budi Santoso', 3, '3201010303950003', 'Ahmad Fauzi', 'Laki-laki', 'Anak Kandung', 'Bogor', '1995-03-03', 29, 'Belum Kawin', 'Islam', 'O', 'Indonesia', 'Sunda', 'S1', 'Karyawan Swasta', NOW(), NOW()),

(4, '01', '02', 'Cibadak', 'Jl. Raya Cibadak No. 5', '3201010201020002', 'Joko Widodo', 1, '3201020101700004', 'Joko Widodo', 'Laki-laki', 'Kepala Keluarga', 'Surakarta', '1970-01-01', 54, 'Kawin', 'Islam', 'B', 'Indonesia', 'Jawa', 'S2', 'PNS', NOW(), NOW()),
(5, '01', '02', 'Cibadak', 'Jl. Raya Cibadak No. 5', '3201010201020002', 'Joko Widodo', 2, '3201020202750005', 'Iriana', 'Perempuan', 'Istri', 'Semarang', '1975-02-02', 49, 'Kawin', 'Islam', 'AB', 'Indonesia', 'Jawa', 'S1', 'Guru', NOW(), NOW()),

(6, '01', '03', 'Cibadak', 'Jl. Merdeka No. 10', '3201010301030003', 'Andi Wijaya', 1, '3201030101750006', 'Andi Wijaya', 'Laki-laki', 'Kepala Keluarga', 'Jakarta', '1975-03-15', 49, 'Kawin', 'Islam', 'A', 'Indonesia', 'Betawi', 'SMA', 'Pedagang', NOW(), NOW()),
(7, '01', '03', 'Cibadak', 'Jl. Merdeka No. 10', '3201010301030003', 'Andi Wijaya', 2, '3201030202780007', 'Dewi Lestari', 'Perempuan', 'Istri', 'Bogor', '1978-06-20', 46, 'Kawin', 'Islam', 'O', 'Indonesia', 'Sunda', 'SMA', 'Ibu Rumah Tangga', NOW(), NOW()),
(8, '01', '03', 'Cibadak', 'Jl. Merdeka No. 10', '3201010301030003', 'Andi Wijaya', 3, '3201030303980008', 'Rudi Wijaya', 'Laki-laki', 'Anak Kandung', 'Bogor', '1998-09-10', 26, 'Belum Kawin', 'Islam', 'A', 'Indonesia', 'Betawi', 'S1', 'IT Consultant', NOW(), NOW()),

(9, '02', '01', 'Cibadak', 'Jl. Pahlawan No. 7', '3201020101040004', 'Hendri Kusuma', 1, '3201040101650009', 'Hendri Kusuma', 'Laki-laki', 'Kepala Keluarga', 'Bogor', '1965-05-12', 59, 'Kawin', 'Kristen', 'B', 'Indonesia', 'Sunda', 'S1', 'Pensiunan', NOW(), NOW()),
(10, '02', '01', 'Cibadak', 'Jl. Pahlawan No. 7', '3201020101040004', 'Hendri Kusuma', 2, '3201040202680010', 'Maria Theresia', 'Perempuan', 'Istri', 'Jakarta', '1968-08-25', 56, 'Kawin', 'Kristen', 'O', 'Indonesia', 'Sunda', 'SMA', 'Ibu Rumah Tangga', NOW(), NOW()),

(11, '02', '02', 'Cibadak', 'Jl. Gatot Subroto No. 15', '3201020201050005', 'Yusuf Rahman', 1, '3201050101800011', 'Yusuf Rahman', 'Laki-laki', 'Kepala Keluarga', 'Bogor', '1980-07-18', 44, 'Kawin', 'Islam', 'A', 'Indonesia', 'Sunda', 'S1', 'Dokter', NOW(), NOW()),
(12, '02', '02', 'Cibadak', 'Jl. Gatot Subroto No. 15', '3201020201050005', 'Yusuf Rahman', 2, '3201050202850012', 'Farah Diba', 'Perempuan', 'Istri', 'Bandung', '1985-11-03', 39, 'Kawin', 'Islam', 'B', 'Indonesia', 'Sunda', 'S1', 'Perawat', NOW(), NOW()),
(13, '02', '02', 'Cibadak', 'Jl. Gatot Subroto No. 15', '3201020201050005', 'Yusuf Rahman', 3, '3201050303100013', 'Aliya Rahman', 'Perempuan', 'Anak Kandung', 'Bogor', '2010-04-22', 14, 'Belum Kawin', 'Islam', 'A', 'Indonesia', 'Sunda', 'SMP', 'Pelajar', NOW(), NOW()),

(14, '02', '03', 'Cibadak', 'Jl. Diponegoro No. 3', '3201020301060006', 'Agus Salim', 1, '3201060101720014', 'Agus Salim', 'Laki-laki', 'Kepala Keluarga', 'Bogor', '1972-12-05', 52, 'Kawin', 'Islam', 'O', 'Indonesia', 'Sunda', 'SMA', 'Tukang Bangunan', NOW(), NOW()),
(15, '02', '03', 'Cibadak', 'Jl. Diponegoro No. 3', '3201020301060006', 'Agus Salim', 2, '3201060202750015', 'Nur Halimah', 'Perempuan', 'Istri', 'Bogor', '1975-03-18', 49, 'Kawin', 'Islam', 'B', 'Indonesia', 'Sunda', 'SMA', 'Ibu Rumah Tangga', NOW(), NOW()),

(16, '03', '01', 'Cibadak', 'Jl. Ahmad Yani No. 20', '3201030101070007', 'Bambang Sutrisno', 1, '3201070101690016', 'Bambang Sutrisno', 'Laki-laki', 'Kepala Keluarga', 'Surabaya', '1969-09-14', 55, 'Kawin', 'Islam', 'AB', 'Indonesia', 'Jawa', 'S2', 'Dosen', NOW(), NOW()),
(17, '03', '01', 'Cibadak', 'Jl. Ahmad Yani No. 20', '3201030101070007', 'Bambang Sutrisno', 2, '3201070202730017', 'Sri Mulyani', 'Perempuan', 'Istri', 'Yogyakarta', '1973-06-30', 51, 'Kawin', 'Islam', 'A', 'Indonesia', 'Jawa', 'S2', 'Dosen', NOW(), NOW()),

(18, '03', '02', 'Cibadak', 'Jl. Sudirman No. 8', '3201030201080008', 'Dedi Supardi', 1, '3201080101880018', 'Dedi Supardi', 'Laki-laki', 'Kepala Keluarga', 'Bogor', '1988-02-14', 36, 'Kawin', 'Islam', 'O', 'Indonesia', 'Sunda', 'S1', 'Programmer', NOW(), NOW()),
(19, '03', '02', 'Cibadak', 'Jl. Sudirman No. 8', '3201030201080008', 'Dedi Supardi', 2, '3201080202920019', 'Rina Wati', 'Perempuan', 'Istri', 'Jakarta', '1992-11-22', 32, 'Kawin', 'Islam', 'A', 'Indonesia', 'Betawi', 'S1', 'Designer', NOW(), NOW()),
(20, '03', '02', 'Cibadak', 'Jl. Sudirman No. 8', '3201030201080008', 'Dedi Supardi', 3, '3201080303150020', 'Raffa Supardi', 'Laki-laki', 'Anak Kandung', 'Bogor', '2015-05-10', 9, 'Belum Kawin', 'Islam', 'O', 'Indonesia', 'Sunda', 'SD', 'Pelajar', NOW(), NOW());

-- Tampilkan hasil
SELECT 'Data warga berhasil diimport!' as Status;
SELECT COUNT(*) as 'Total Warga' FROM warga;
SELECT DISTINCT rt as 'RT', COUNT(*) as 'Jumlah Warga' FROM warga GROUP BY rt ORDER BY rt;

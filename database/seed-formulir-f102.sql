-- Seed untuk Formulir F-1.02 Pendaftaran Peristiwa Kependudukan
-- Formulir resmi Disdukcapil

INSERT INTO jenis_surat (
  nama_surat, 
  kode_surat, 
  deskripsi, 
  template_konten,
  fields,
  require_verification,
  status,
  format_nomor,
  kalimat_pembuka
) VALUES (
  'FORMULIR PENDAFTARAN PERISTIWA KEPENDUDUKAN',
  'F-1.02',
  'Formulir resmi Disdukcapil untuk pendaftaran peristiwa kependudukan',
  '',
  JSON_ARRAY(
    JSON_OBJECT('name', 'nama_lengkap', 'label', 'Nama Lengkap', 'type', 'text', 'required', true),
    JSON_OBJECT('name', 'nomor_induk_kependudukan', 'label', 'Nomor Induk Kependudukan', 'type', 'text', 'required', true),
    JSON_OBJECT('name', 'nomor_kartu_keluarga', 'label', 'Nomor Kartu Keluarga', 'type', 'text', 'required', true),
    JSON_OBJECT('name', 'nomor_handphone', 'label', 'Nomor Handphone', 'type', 'text', 'required', true),
    JSON_OBJECT('name', 'alamat_email', 'label', 'Alamat Email', 'type', 'email', 'required', false),
    
    -- Jenis Permohonan - HANYA Kartu Keluarga yang ada input checkbox
    -- Kolom KTP-el, KIA, dan Perubahan Data diisi manual di form cetak
    JSON_OBJECT('name', 'kk_membentuk_keluarga_baru', 'label', 'KK - Membentuk Keluarga Baru', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_penggantian_kepala_keluarga', 'label', 'KK - Penggantian Kepala Keluarga', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_pisah_kk', 'label', 'KK - Pisah KK', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_pindah_datang', 'label', 'KK - Pindah Datang', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_wni_ln_karena_pindahan', 'label', 'KK - WNI dari LN karena Pindahan', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_rentan_adminduk', 'label', 'KK - Rentan Adminduk', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_menumpang_dalam_kk', 'label', 'KK - Menumpang dalam KK', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_peristiwa_penting', 'label', 'KK - Peristiwa Penting', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_perubahan_elemen_data_tercantum', 'label', 'KK - Perubahan elemen data yang tercantum dalam KK', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_hilang_rusak_hilang', 'label', 'KK - Hilang', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    JSON_OBJECT('name', 'kk_hilang_rusak_rusak', 'label', 'KK - Rusak', 'type', 'checkbox', 'required', false, 'group', 'kartu_keluarga'),
    
    -- Persyaratan yang dilampirkan
    JSON_OBJECT('name', 'persyaratan_kk_lama', 'label', 'KK Lama/ KK Rusak/Hilang', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_buku_nikah', 'label', 'Buku Nikah/ Kutipan Akta Perkawinan', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_kutipan_akta_perceraian', 'label', 'Kutipan Akta Perceraian', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_kutipan_akta_kematian', 'label', 'Kutipan Akta Kematian', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_keterangan_pindah', 'label', 'Surat Keterangan Pindah Luar Negeri', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_ktp_el_rusak', 'label', 'KTP-El Rusak', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_dokumen_perjalanan', 'label', 'Dokumen Perjalanan', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_keterangan_hilang', 'label', 'Surat Keterangan Hilang dari Kepolisian', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_keterangan_bukti_perubahan', 'label', 'Surat Keterangan/Bukti Perubahan Peristiwa Kependudukan dan Peristiwa Penting', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_ktp_el_kewarganegaraan', 'label', 'KTP-El kewarganegaraan ganda/asing atau KTP-El pencabutan status kewarganegaraan', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_akta_kematian', 'label', 'Akta Kematian', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_pernyataan_pindah', 'label', 'Surat Pernyataan tersedia menerima sebagai anggota keluarga', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_pernyataan_hilang_rusak', 'label', 'Surat Keterangan Pindah dan Perwalian RI', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_pernyataan_kepala_daerah', 'label', 'Surat Pernyataan berdsama menerima sebagai anggota keluarga', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_surat_kuasa_pengasuhan', 'label', 'Surat kuasa pengasuhan anak dari orang tua/i wali', 'type', 'checkbox', 'required', false, 'group', 'persyaratan'),
    JSON_OBJECT('name', 'persyaratan_kartu_im_tinggal_tetap', 'label', 'Kartu Ijin Tinggal Tetap', 'type', 'checkbox', 'required', false, 'group', 'persyaratan')
  ),
  true,
  'aktif',
  'F-1.02/{nomor}/{bulan}/{tahun}',
  ''
);

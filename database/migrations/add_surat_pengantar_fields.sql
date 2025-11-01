-- Menambahkan field untuk surat pengantar RT dan RW
-- Migration untuk workflow verifikasi dengan surat pengantar

ALTER TABLE pengajuan_surat
ADD COLUMN surat_pengantar_rt VARCHAR(255) NULL COMMENT 'Path file surat pengantar dari RT' AFTER lampiran,
ADD COLUMN tanggal_upload_pengantar_rt DATETIME NULL COMMENT 'Tanggal upload surat pengantar RT' AFTER surat_pengantar_rt,
ADD COLUMN surat_pengantar_rw VARCHAR(255) NULL COMMENT 'Path file surat pengantar dari RW' AFTER tanggal_upload_pengantar_rt,
ADD COLUMN tanggal_upload_pengantar_rw DATETIME NULL COMMENT 'Tanggal upload surat pengantar RW' AFTER surat_pengantar_rw;

-- Index untuk performa query
CREATE INDEX idx_surat_pengantar_rt ON pengajuan_surat(surat_pengantar_rt);
CREATE INDEX idx_surat_pengantar_rw ON pengajuan_surat(surat_pengantar_rw);

-- Komentar untuk dokumentasi
ALTER TABLE pengajuan_surat COMMENT = 'Tabel pengajuan surat dengan workflow RT -> RW -> SuperAdmin, termasuk surat pengantar';

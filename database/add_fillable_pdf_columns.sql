-- Add columns for fillable PDF feature
ALTER TABLE formulir_cetak 
ADD COLUMN is_fillable BOOLEAN DEFAULT FALSE AFTER is_active,
ADD COLUMN field_mapping JSON DEFAULT NULL AFTER is_fillable;

-- Add comment
ALTER TABLE formulir_cetak 
MODIFY COLUMN is_fillable BOOLEAN DEFAULT FALSE COMMENT 'Apakah formulir PDF bisa diisi otomatis',
MODIFY COLUMN field_mapping JSON DEFAULT NULL COMMENT 'Mapping fields: {"autoFill": ["nama", "nik"], "manualInput": ["keperluan"]}';

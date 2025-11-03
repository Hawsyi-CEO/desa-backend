-- Ubah kolom email menjadi nullable
-- Karena login menggunakan NIK, email tidak wajib diisi

ALTER TABLE users 
MODIFY COLUMN email VARCHAR(255) NULL;

-- Update existing records yang email-nya kosong menjadi NULL
UPDATE users 
SET email = NULL 
WHERE email = '' OR email IS NULL;

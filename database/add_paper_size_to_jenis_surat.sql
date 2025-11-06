-- Add paper_size column to jenis_surat table
-- This ensures paper size selection is saved and consistent across preview and print

ALTER TABLE jenis_surat 
ADD COLUMN paper_size ENUM('a4', 'legal') DEFAULT 'a4' 
AFTER show_materai;

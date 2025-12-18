-- Add unit column to purchase_lines table
-- Run this migration to add support for unit tracking in purchase items

ALTER TABLE `purchase_lines` 
ADD COLUMN `unit` VARCHAR(50) DEFAULT 'Pieces' AFTER `quantity`;

-- Update existing records to have default unit
UPDATE `purchase_lines` SET `unit` = 'Pieces' WHERE `unit` IS NULL;

-- Add IsShowInPSR to BankMaster (Y = show this bank on PSR Tata report).
-- Safe to run on databases that already have the column.

SET @db := DATABASE();
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db
      AND TABLE_NAME = 'bankmaster'
      AND COLUMN_NAME = 'IsShowInPSR'
);

SET @sql := IF(
    @exists = 0,
    'ALTER TABLE bankmaster ADD COLUMN IsShowInPSR CHAR(1) NOT NULL DEFAULT ''N'' COMMENT ''Y=Show bank on PSR report; N=Hide'' AFTER DefaultCheck',
    'SELECT ''IsShowInPSR already exists'' AS Msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE bankmaster
SET IsShowInPSR = COALESCE(NULLIF(TRIM(IsShowInPSR), ''), 'N')
WHERE IsShowInPSR IS NULL OR TRIM(IsShowInPSR) = '';

-- Existing default bank: mark as show in PSR when not set yet
UPDATE bankmaster
SET IsShowInPSR = 'Y'
WHERE DefaultCheck = 'Y'
  AND IsActive = 'Y'
  AND IFNULL(IsShowInPSR, 'N') = 'N';

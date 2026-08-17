-- Ensure FixParameter.IsShowBankDetailInPSR exists (Y = show bank details on PSR Tata report).
-- Safe to run on databases that already have the column.

SET @db := DATABASE();
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db
      AND TABLE_NAME = 'FixParameter'
      AND COLUMN_NAME = 'IsShowBankDetailInPSR'
);

SET @sql := IF(
    @exists = 0,
    'ALTER TABLE FixParameter ADD COLUMN IsShowBankDetailInPSR CHAR(1) NOT NULL DEFAULT ''N'' COMMENT ''Y=Show bank details on PSR Tata report; N=Hide''',
    'SELECT ''IsShowBankDetailInPSR already exists'' AS Msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE FixParameter
SET IsShowBankDetailInPSR = COALESCE(NULLIF(TRIM(IsShowBankDetailInPSR), ''), 'N')
WHERE IsShowBankDetailInPSR IS NULL OR TRIM(IsShowBankDetailInPSR) = '';

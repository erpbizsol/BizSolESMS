-- Ensure FixParameter.IsPickingEnable exists (Y = Picking+Packing workflow, N = legacy Dispatch).
-- Safe to run on databases that already have the column.

SET @db := DATABASE();
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db
      AND TABLE_NAME = 'FixParameter'
      AND COLUMN_NAME = 'IsPickingEnable'
);

SET @sql := IF(
    @exists = 0,
    'ALTER TABLE FixParameter ADD COLUMN IsPickingEnable CHAR(1) NOT NULL DEFAULT ''N'' COMMENT ''Y=Picking then Packing workflow; N=legacy Dispatch''',
    'SELECT ''IsPickingEnable already exists'' AS Msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Default remains N so existing clients are unaffected.
UPDATE FixParameter
SET IsPickingEnable = COALESCE(NULLIF(TRIM(IsPickingEnable), ''), 'N')
WHERE IsPickingEnable IS NULL OR TRIM(IsPickingEnable) = '';

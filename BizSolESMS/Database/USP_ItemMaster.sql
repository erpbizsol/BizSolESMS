USE `webiz_demo`;
DROP PROCEDURE IF EXISTS `USP_ItemMaster`;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_ItemMaster`(
   IN p_Mode VARCHAR(20),
   IN p_Code INT,
   IN p_UserMaster_Code INT,
   IN p_jsonData JSON
)
BEGIN
    DECLARE v_ExistingCount INT DEFAULT 0;
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_LocationCodes TEXT;
    DECLARE v_FirstLocationCode INT DEFAULT NULL;
    DECLARE v_Pos INT DEFAULT 1;
    DECLARE v_NextPos INT DEFAULT 0;
    DECLARE v_CodeStr VARCHAR(50);

    SET v_LocationCodes = NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.locationMaster_Codes'))), '');
    SET v_FirstLocationCode = NULL;

    IF v_LocationCodes IS NOT NULL AND v_LocationCodes <> '' THEN
        SET v_CodeStr = TRIM(SUBSTRING_INDEX(v_LocationCodes, ',', 1));
        IF v_CodeStr <> '' THEN
            SET v_FirstLocationCode = CAST(v_CodeStr AS UNSIGNED);
        END IF;
    END IF;

  IF p_Mode = 'SAVE' THEN
      IF p_Code > 0 THEN
       SELECT MIN(Code) INTO v_ExistingCount FROM webiz_demo.itemmaster
       WHERE (itemmaster.ItemName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemName'))
       AND itemmaster.ItemBarCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemBarCode'))
       AND itemmaster.ItemCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemCode'))
       ) AND Code != p_Code AND IsActive = 'Y';
        IF v_ExistingCount > 0 THEN
            SELECT 'Duplicate Record not updated!.' AS Msg, 'N' AS Status;
        ELSE
        BEGIN
            IF v_FirstLocationCode IS NULL THEN
                SELECT MIN(Code) INTO v_FirstLocationCode
                FROM webiz_demo.locationmaster
                WHERE locationmaster.LocationName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.locationName'))
                  AND IsActive = 'Y';
            END IF;

            UPDATE webiz_demo.itemmaster SET
            ItemCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemCode')),
            ItemName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemName')),
            DisplayName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.displayName')),
            ItemBarCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemBarCode')),
            UOMMaster_Code = (SELECT Code FROM webiz_demo.uommaster WHERE uommaster.UOMName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.uOMName')) AND IsActive = 'Y'),
            HSNCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.hSNCode')),
            CategoryMaster_Code = (SELECT Code FROM webiz_demo.categorymaster WHERE categorymaster.CategoryName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.categoryName')) AND IsActive = 'Y'),
            GroupMaster_Code = (SELECT Code FROM webiz_demo.groupmaster WHERE groupmaster.GroupName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.groupName')) AND IsActive = 'Y'),
            SubGroupMaster_Code = (SELECT Code FROM webiz_demo.subgroupmaster WHERE subgroupmaster.SubGroupName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.subGroupName')) AND IsActive = 'Y'),
            BrandMaster_Code = (SELECT Code FROM webiz_demo.brandmaster WHERE brandmaster.BrandName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.brandName')) AND IsActive = 'Y'),
            ReorderLevel = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.reorderLevel')),
            ReorderQty = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.reorderQty')),
            LocationMaster_Code = v_FirstLocationCode,
            BatchApplicable = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.batchApplicable')),
            MaintainExpiry = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.maintainExpiry')),
            BoxPacking = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.boxPacking')),
            QtyInBox = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.qtyInBox')),
            ModifiedBy = p_UserMaster_Code,
            ModifiedOn = NOW(),
            DataImported = 'N',
            MRPNo = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.mRPNo')),
            IsActive = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.isActive'))
            WHERE Code = p_Code;

            SET v_ItemMaster_Code = p_Code;

            DELETE FROM webiz_demo.ItemLocationDetails
            WHERE ItemMaster_Code = v_ItemMaster_Code;

            IF v_LocationCodes IS NOT NULL AND v_LocationCodes <> '' THEN
                SET v_LocationCodes = CONCAT(v_LocationCodes, ',');
                SET v_Pos = 1;
                loc_update_loop: WHILE v_Pos <= CHAR_LENGTH(v_LocationCodes) DO
                    SET v_NextPos = LOCATE(',', v_LocationCodes, v_Pos);
                    IF v_NextPos = 0 THEN
                        LEAVE loc_update_loop;
                    END IF;

                    SET v_CodeStr = TRIM(SUBSTRING(v_LocationCodes, v_Pos, v_NextPos - v_Pos));
                    IF v_CodeStr <> '' THEN
                        INSERT INTO webiz_demo.ItemLocationDetails (ItemMaster_Code, LocationMaster_Code)
                        SELECT v_ItemMaster_Code, lm.Code
                        FROM webiz_demo.locationmaster lm
                        WHERE lm.Code = CAST(v_CodeStr AS UNSIGNED)
                          AND lm.IsActive = 'Y'
                        LIMIT 1;
                    END IF;

                    SET v_Pos = v_NextPos + 1;
                END WHILE;
            ELSEIF v_FirstLocationCode IS NOT NULL THEN
                INSERT INTO webiz_demo.ItemLocationDetails (ItemMaster_Code, LocationMaster_Code)
                VALUES (v_ItemMaster_Code, v_FirstLocationCode);
            END IF;

            SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, v_ItemMaster_Code AS Code;
        END;
        END IF;
      ELSE
       SELECT MIN(Code) INTO v_ExistingCount FROM webiz_demo.itemmaster
       WHERE (itemmaster.ItemName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemName'))
       AND itemmaster.ItemBarCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemBarCode'))
       AND itemmaster.ItemCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemCode'))
       )
       AND IsActive = 'Y';
        IF v_ExistingCount > 0 THEN
           SELECT 'Duplicate  Record not inserted!.' AS Msg, 'N' AS Status;
        ELSE
        BEGIN
            IF v_FirstLocationCode IS NULL THEN
                SELECT MIN(Code) INTO v_FirstLocationCode
                FROM webiz_demo.locationmaster
                WHERE locationmaster.LocationName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.locationName'))
                  AND IsActive = 'Y';
            END IF;

            INSERT INTO webiz_demo.itemmaster (
                ItemCode, ItemName, DisplayName, ItemBarCode, UOMMaster_Code, HSNCode,
                CategoryMaster_Code, GroupMaster_Code, SubGroupMaster_Code, BrandMaster_Code,
                ReorderLevel, ReorderQty, LocationMaster_Code, BatchApplicable, MaintainExpiry,
                BoxPacking, QtyInBox, CreatedBy, CreatedOn, IsActive, MRPNo
            )
            VALUES (
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemCode')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemName')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.displayName')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.itemBarCode')),
                (SELECT Code FROM webiz_demo.uommaster WHERE uommaster.UOMName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.uOMName')) AND IsActive = 'Y'),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.hSNCode')),
                (SELECT Code FROM webiz_demo.categorymaster WHERE categorymaster.CategoryName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.categoryName')) AND IsActive = 'Y'),
                (SELECT Code FROM webiz_demo.groupmaster WHERE groupmaster.GroupName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.groupName')) AND IsActive = 'Y'),
                (SELECT Code FROM webiz_demo.subgroupmaster WHERE subgroupmaster.SubGroupName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.subGroupName')) AND IsActive = 'Y'),
                (SELECT Code FROM webiz_demo.brandmaster WHERE brandmaster.BrandName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.brandName')) AND IsActive = 'Y'),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.reorderLevel')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.reorderQty')),
                v_FirstLocationCode,
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.batchApplicable')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.maintainExpiry')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.boxPacking')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.qtyInBox')),
                p_UserMaster_Code,
                NOW(),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.isActive')),
                JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.mRPNo'))
            );

            SET v_ItemMaster_Code = LAST_INSERT_ID();

            IF v_LocationCodes IS NOT NULL AND v_LocationCodes <> '' THEN
                SET v_LocationCodes = CONCAT(v_LocationCodes, ',');
                SET v_Pos = 1;
                loc_insert_loop: WHILE v_Pos <= CHAR_LENGTH(v_LocationCodes) DO
                    SET v_NextPos = LOCATE(',', v_LocationCodes, v_Pos);
                    IF v_NextPos = 0 THEN
                        LEAVE loc_insert_loop;
                    END IF;

                    SET v_CodeStr = TRIM(SUBSTRING(v_LocationCodes, v_Pos, v_NextPos - v_Pos));
                    IF v_CodeStr <> '' THEN
                        INSERT INTO webiz_demo.ItemLocationDetails (ItemMaster_Code, LocationMaster_Code)
                        SELECT v_ItemMaster_Code, lm.Code
                        FROM webiz_demo.locationmaster lm
                        WHERE lm.Code = CAST(v_CodeStr AS UNSIGNED)
                          AND lm.IsActive = 'Y'
                        LIMIT 1;
                    END IF;

                    SET v_Pos = v_NextPos + 1;
                END WHILE;
            ELSEIF v_FirstLocationCode IS NOT NULL THEN
                INSERT INTO webiz_demo.ItemLocationDetails (ItemMaster_Code, LocationMaster_Code)
                VALUES (v_ItemMaster_Code, v_FirstLocationCode);
            END IF;

            SELECT 'Data Save Successfully' AS Msg, 'Y' AS Status, v_ItemMaster_Code AS Code;
        END;
      END IF;
   END IF;
    ELSEIF p_Mode = 'DELETE' THEN
        DELETE FROM webiz_demo.ItemLocationDetails WHERE ItemMaster_Code = p_Code;
        DELETE FROM webiz_demo.itemmaster WHERE Code = p_Code;
        SELECT 'Data Deleted Successfully' AS Msg, 'Y' AS Status;
    ELSEIF p_Mode = 'SHOWDATA' THEN
        SELECT
            itemmaster.Code,
            itemmaster.ItemCode,
            itemmaster.ItemName,
            itemmaster.DisplayName,
            itemmaster.ItemBarCode,
            UOMMaster.UomName,
            itemmaster.HSNCode,
            categorymaster.CategoryName,
            GroupMaster.GroupName,
            subgroupmaster.SubGroupName,
            brandmaster.BrandName,
            itemmaster.ReorderLevel,
            itemmaster.ReorderQty,
            GROUP_CONCAT(DISTINCT locationmaster.LocationName ORDER BY locationmaster.LocationName SEPARATOR ', ') AS locationName,
            GROUP_CONCAT(DISTINCT ItemLocationDetails.LocationMaster_Code ORDER BY ItemLocationDetails.LocationMaster_Code SEPARATOR ', ') AS LocationMaster_Codes,
            itemmaster.BoxPacking,
            itemmaster.BatchApplicable,
            itemmaster.MaintainExpiry,
            itemmaster.QtyInBox,
            itemmaster.IsActive,
            itemmaster.MRPNo
        FROM webiz_demo.itemmaster
        LEFT JOIN webiz_demo.GroupMaster GroupMaster ON itemmaster.GroupMaster_Code = GroupMaster.Code
        LEFT JOIN webiz_demo.UOMMaster UOMMaster ON itemmaster.UOMMaster_Code = UOMMaster.Code
        LEFT JOIN webiz_demo.categorymaster categorymaster ON itemmaster.CategoryMaster_Code = categorymaster.Code
        LEFT JOIN webiz_demo.subgroupmaster subgroupmaster ON itemmaster.SubGroupMaster_Code = subgroupmaster.Code
        LEFT JOIN webiz_demo.brandmaster brandmaster ON itemmaster.BrandMaster_Code = brandmaster.Code
        LEFT JOIN webiz_demo.ItemLocationDetails ItemLocationDetails ON ItemLocationDetails.ItemMaster_Code = itemmaster.Code
        LEFT JOIN webiz_demo.locationmaster locationmaster ON ItemLocationDetails.LocationMaster_Code = locationmaster.Code
        WHERE itemmaster.Code = p_Code
        GROUP BY
            itemmaster.Code, itemmaster.ItemCode, itemmaster.ItemName, itemmaster.DisplayName,
            itemmaster.ItemBarCode, UOMMaster.UomName, itemmaster.HSNCode, categorymaster.CategoryName,
            GroupMaster.GroupName, subgroupmaster.SubGroupName, brandmaster.BrandName,
            itemmaster.ReorderLevel, itemmaster.ReorderQty, itemmaster.BoxPacking,
            itemmaster.BatchApplicable, itemmaster.MaintainExpiry, itemmaster.QtyInBox,
            itemmaster.IsActive, itemmaster.MRPNo;
    ELSEIF p_Mode = 'GetItemDetails' THEN
        SELECT
            itemmaster.Code,
            itemmaster.ItemCode,
            itemmaster.ItemName,
            itemmaster.ItemBarCode,
            UOMMaster.UomName,
            GROUP_CONCAT(DISTINCT locationmaster.locationName ORDER BY locationmaster.locationName SEPARATOR ', ') AS locationName,
            itemmaster.QtyInBox
        FROM webiz_demo.itemmaster
        LEFT JOIN webiz_demo.UOMMaster UOMMaster ON itemmaster.UOMMaster_Code = UOMMaster.Code
        LEFT JOIN webiz_demo.ItemLocationDetails ItemLocationDetails ON ItemLocationDetails.ItemMaster_Code = itemmaster.Code
        LEFT JOIN webiz_demo.locationmaster locationmaster ON ItemLocationDetails.LocationMaster_Code = locationmaster.Code
        WHERE itemmaster.IsActive = 'Y'
        GROUP BY
            itemmaster.Code, itemmaster.ItemCode, itemmaster.ItemName,
            itemmaster.ItemBarCode, UOMMaster.UomName, itemmaster.QtyInBox;
    ELSEIF p_Mode = 'LOCATE' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY itemmaster.DataImported DESC, itemmaster.ItemName, itemmaster.Code) AS `S.No`,
            itemmaster.Code,
            IFNULL(itemmaster.ItemCode,'') AS 'Item Code',
            IFNULL(itemmaster.ItemName,'') AS 'Item Name',
            IFNULL(itemmaster.DisplayName,'') AS 'Display Name',
            IFNULL(itemmaster.ItemBarCode,'') AS 'Item Bar Code',
            GROUP_CONCAT(DISTINCT IFNULL(locationmaster.LocationName, '')) AS 'Location Name',
            IFNULL(UOMMaster.UomName, '') AS 'UomName',
            IFNULL(itemmaster.HSNCode, '') AS 'HSN Code',
            IFNULL(categorymaster.CategoryName, '') AS 'Category Name',
            IFNULL(GroupMaster.GroupName, '') AS 'Group Name',
            IFNULL(subgroupmaster.SubGroupName, '') AS 'Sub Group Name',
            IFNULL(brandmaster.BrandName, '') AS 'Brand Name',
            itemmaster.ReorderLevel AS 'Reorder Level',
            itemmaster.ReorderQty AS 'Reorder Qty',
            IFNULL(itemmaster.BoxPacking, '') AS 'Box Packing',
            IFNULL(itemmaster.BatchApplicable, '') AS 'Batch Applicable',
            IFNULL(itemmaster.MaintainExpiry, '') AS 'Maintain Expiry',
            itemmaster.QtyInBox AS 'Qty In Box',
            itemmaster.DataImported,
            itemmaster.MRPNo AS MRP
        FROM webiz_demo.itemmaster
        LEFT JOIN webiz_demo.GroupMaster GroupMaster ON itemmaster.GroupMaster_Code = GroupMaster.Code
        LEFT JOIN webiz_demo.UOMMaster UOMMaster ON itemmaster.UOMMaster_Code = UOMMaster.Code
        LEFT JOIN webiz_demo.categorymaster categorymaster ON itemmaster.CategoryMaster_Code = categorymaster.Code
        LEFT JOIN webiz_demo.subgroupmaster subgroupmaster ON itemmaster.SubGroupMaster_Code = subgroupmaster.Code
        LEFT JOIN webiz_demo.brandmaster brandmaster ON itemmaster.BrandMaster_Code = brandmaster.Code
        LEFT JOIN webiz_demo.ItemLocationDetails ItemLocationDetails ON ItemLocationDetails.ItemMaster_Code = itemmaster.Code
        LEFT JOIN webiz_demo.locationmaster locationmaster ON ItemLocationDetails.LocationMaster_Code = locationmaster.Code
        GROUP BY itemmaster.Code;
   END IF;
END$$

DELIMITER ;

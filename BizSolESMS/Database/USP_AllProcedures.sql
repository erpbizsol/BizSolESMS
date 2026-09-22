-- =============================================================================
-- BizSol ESMS - Stored Procedures
-- Database : db_dadasales
-- Run in   : MySQL Workbench / mysql CLI
-- Note     : MySQL does not use GO (that is SQL Server). Run this file as-is.
-- =============================================================================

USE db_dadasales;

-- Ensure CreditDays column exists on AccountMaster (safe to re-run)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'db_dadasales'
      AND TABLE_NAME = 'AccountMaster'
      AND COLUMN_NAME = 'CreditDays'
);

SET @ddl = IF(
    @col_exists = 0,
    'ALTER TABLE db_dadasales.AccountMaster ADD COLUMN CreditDays INT NULL DEFAULT 0 AFTER ClientType',
    'SELECT ''CreditDays column already exists'' AS Info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- USP_AccountMaster
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_AccountMaster;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_AccountMaster`(
    IN p_Mode      VARCHAR(20),
    IN p_Code      INT,
    IN p_jsonData  JSON,
    IN p_jsonData1 JSON
)
BEGIN
    DECLARE v_CreatedByID INT;
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_total INT;
    DECLARE v_AccountMaster_code INT;
    DECLARE v_ExistingCount INT DEFAULT 0;
    DECLARE v_Index INT DEFAULT 0;
    DECLARE v_Totall INT;
    DECLARE v_BrandCode INT;
    DECLARE v_BrandList VARCHAR(255);
    DECLARE v_Pos INT DEFAULT 0;

    SELECT MIN(Code) INTO v_CreatedByID FROM db_dadasales.UserMaster;

    IF p_Mode = 'SAVE' THEN
        IF p_Code > 0 THEN
            SELECT Code INTO v_ExistingCount
            FROM db_dadasales.AccountMaster
            WHERE (
                    AccountMaster.AccountCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.accountCode'))
                AND AccountMaster.AccountName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.accountName'))
                OR AccountMaster.DisplayName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.displayName'))
            )
              AND Code != p_Code
              AND IsActive = 'Y';

            IF v_ExistingCount > 0 THEN
                SELECT 'Duplicate Account Name Record not allow!.' AS Msg, 'N' AS Status;
            ELSE
                BEGIN
                    UPDATE db_dadasales.AccountMaster
                    SET
                        AccountCode  = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].accountCode')),
                        AccountName  = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].accountName')),
                        DisplayName  = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].displayName')),
                        PANNo        = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].pANNo')),
                        IsVendor     = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].isVendor')),
                        IsClient     = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].isClient')),
                        ClientType   = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].clientType')),
                        CreditDays   = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].creditDays')),
                        ModifiedBy   = v_CreatedByID,
                        ModifiedOn   = NOW(),
                        DataImported = 'N'
                    WHERE Code = p_Code;

                    DELETE FROM MaltipalBrand WHERE AccountMaster_Code = p_Code;

                    SET v_Totall = JSON_LENGTH(p_jsonData);

                    WHILE v_Index < v_Totall DO
                        SET v_BrandList = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, CONCAT('$[', v_Index, '].brandMaster_Code')));

                        WHILE LOCATE(',', v_BrandList) > 0 DO
                            SET v_BrandCode = TRIM(SUBSTRING_INDEX(v_BrandList, ',', 1));
                            SET v_BrandList = SUBSTRING(v_BrandList, LOCATE(',', v_BrandList) + 1);

                            IF v_BrandCode IS NOT NULL AND v_BrandCode <> '' THEN
                                INSERT INTO MaltipalBrand (AccountMaster_Code, BrandMaster_Code)
                                VALUES (p_Code, CAST(v_BrandCode AS UNSIGNED));
                            END IF;
                        END WHILE;

                        IF v_BrandList IS NOT NULL AND v_BrandList <> '' THEN
                            INSERT INTO MaltipalBrand (AccountMaster_Code, BrandMaster_Code)
                            VALUES (p_Code, CAST(v_BrandList AS UNSIGNED));
                        END IF;

                        SET v_Index = v_Index + 1;
                    END WHILE;

                    DELETE FROM db_dadasales.AddressMaster
                    WHERE AddressMaster.AccountMaster_Code = p_Code;

                    SET v_total = JSON_LENGTH(p_jsonData1);
                    SELECT MAX(Code) INTO v_AccountMaster_code FROM db_dadasales.AccountMaster;

                    WHILE v_counter < v_total DO
                        INSERT INTO db_dadasales.AddressMaster (
                            AddressCode, AddressLine1, AddressLine2, CityMaster_Code, StateMaster_Code,
                            AccountMaster_Code, CountryMaster_Code, PIN, GSTIN, ContactPerson, PhoneNo, MobileNo, EmailID,
                            IsDefault, IsActive
                        ) VALUES (
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].addressCode'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].addressLine1'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].addressLine2'))),
                            (SELECT Code FROM db_dadasales.CityMaster WHERE Cityname = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].cityName')))),
                            (SELECT Code FROM db_dadasales.StateMaster WHERE Statename = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].stateName')))),
                            p_Code,
                            (SELECT Code FROM db_dadasales.countrymaster WHERE CountryName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].nation')))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].pIN'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].gSTIN'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].contactPerson'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].phoneNo'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].mobileNo'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].emailID'))),
                            JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].isDefault'))),
                            'Y'
                        );

                        SET v_counter = v_counter + 1;
                    END WHILE;

                    SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status;
                END;
            END IF;
        ELSE
            SELECT Code INTO v_ExistingCount
            FROM db_dadasales.AccountMaster
            WHERE (
                    AccountCode = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].accountCode'))
                AND AccountName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].accountName'))
                OR DisplayName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].displayName'))
            )
              AND IsActive = 'Y';

            IF v_ExistingCount > 0 THEN
                SELECT 'Duplicate Account Name  Record not inserted!.' AS Msg, 'N' AS Status;
            ELSE
                INSERT INTO db_dadasales.AccountMaster (
                    AccountCode, AccountName, DisplayName, PANNo, IsVendor, IsClient, ClientType,
                    CreatedBy, CreatedOn, IsActive, CreditDays
                ) VALUES (
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].accountCode')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].accountName')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].displayName')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].pANNo')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].isVendor')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].isClient')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].clientType')),
                    v_CreatedByID,
                    NOW(),
                    'Y',
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].creditDays'))
                );

                SET v_Totall = JSON_LENGTH(p_jsonData);

                WHILE v_Index < v_Totall DO
                    SET v_BrandList = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, CONCAT('$[', v_Index, '].brandMaster_Code')));

                    WHILE LOCATE(',', v_BrandList) > 0 DO
                        SET v_BrandCode = TRIM(SUBSTRING_INDEX(v_BrandList, ',', 1));
                        SET v_BrandList = SUBSTRING(v_BrandList, LOCATE(',', v_BrandList) + 1);

                        IF v_BrandCode IS NOT NULL AND v_BrandCode <> '' THEN
                            INSERT INTO MaltipalBrand (AccountMaster_Code, BrandMaster_Code)
                            VALUES ((SELECT LAST_INSERT_ID()), CAST(v_BrandCode AS UNSIGNED));
                        END IF;
                    END WHILE;

                    IF v_BrandList IS NOT NULL AND v_BrandList <> '' THEN
                        INSERT INTO MaltipalBrand (AccountMaster_Code, BrandMaster_Code)
                        VALUES ((SELECT LAST_INSERT_ID()), CAST(v_BrandList AS UNSIGNED));
                    END IF;

                    SET v_Index = v_Index + 1;
                END WHILE;

                SET v_total = JSON_LENGTH(p_jsonData1);
                SELECT MAX(Code) INTO v_AccountMaster_code FROM db_dadasales.AccountMaster;

                WHILE v_counter < v_total DO
                    INSERT INTO db_dadasales.AddressMaster (
                        AddressCode, AddressLine1, AddressLine2, CityMaster_Code, StateMaster_Code,
                        AccountMaster_Code, CountryMaster_Code, PIN, GSTIN, ContactPerson, PhoneNo, MobileNo, EmailID,
                        IsDefault, IsActive
                    ) VALUES (
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].addressCode'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].addressLine1'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].addressLine2'))),
                        (SELECT Code FROM db_dadasales.CityMaster WHERE Cityname = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].cityName')))),
                        (SELECT Code FROM db_dadasales.StateMaster WHERE Statename = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].stateName')))),
                        (SELECT LAST_INSERT_ID()),
                        (SELECT Code FROM db_dadasales.countrymaster WHERE CountryName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].nation')))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].pIN'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].gSTIN'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].contactPerson'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].phoneNo'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].mobileNo'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].emailID'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].isDefault'))),
                        'Y'
                    );

                    SET v_counter = v_counter + 1;
                END WHILE;

                SELECT 'Data Save Successfully' AS Msg, 'Y' AS Status;
            END IF;
        END IF;

    ELSEIF p_Mode = 'DELETE' THEN
        DELETE FROM db_dadasales.AccountMaster WHERE Code = p_Code;
        DELETE FROM db_dadasales.AddressMaster WHERE AccountMaster_Code = p_Code;
        DELETE FROM db_dadasales.MaltipalBrand WHERE AccountMaster_Code = p_Code;
        SELECT 'Data Deleted Successfully' AS Msg, 'Y' AS Status;

    ELSEIF p_Mode = 'SHOWDATA' THEN
        SELECT
            AccountMaster.Code,
            AccountMaster.AccountCode,
            AccountMaster.AccountName,
            AccountMaster.DisplayName,
            AccountMaster.PANNo,
            AccountMaster.IsMSME,
            AccountMaster.IsVendor,
            AccountMaster.IsClient,
            AccountMaster.ClientType,
            AccountMaster.CreditDays,
            GROUP_CONCAT(BM.BrandName ORDER BY BM.BrandName SEPARATOR ', ') AS BrandName
        FROM db_dadasales.AccountMaster
        LEFT JOIN db_dadasales.MaltipalBrand MB ON AccountMaster.Code = MB.AccountMaster_Code
        LEFT JOIN db_dadasales.BrandMaster BM ON MB.BrandMaster_Code = BM.Code
        WHERE AccountMaster.Code = p_Code
        GROUP BY AccountMaster.Code, AccountMaster.AccountName;

        SELECT
            AddressMaster.Code,
            AddressMaster.AddressCode,
            AddressMaster.AddressLine1,
            AddressMaster.AddressLine2,
            citymaster.CityName,
            statemaster.StateName,
            CountryMaster.CountryName,
            AddressMaster.PIN,
            AddressMaster.GSTIN,
            AddressMaster.ContactPerson,
            AddressMaster.PhoneNo,
            AddressMaster.MobileNo,
            AddressMaster.EmailID,
            AddressMaster.IsDefault
        FROM db_dadasales.AddressMaster
        LEFT JOIN db_dadasales.CountryMaster CountryMaster ON AddressMaster.CountryMaster_Code = CountryMaster.Code
        LEFT JOIN db_dadasales.statemaster statemaster ON AddressMaster.StateMaster_Code = statemaster.Code
        LEFT JOIN db_dadasales.citymaster citymaster ON AddressMaster.CityMaster_Code = citymaster.Code
        WHERE AddressMaster.AccountMaster_Code = p_Code;

    ELSEIF p_Mode = 'LOCATE' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY DataImported DESC, AccountMaster.Code) AS `S.No`,
            AccountMaster.Code,
            AccountMaster.AccountCode AS 'Account Code',
            AccountMaster.AccountName AS 'Account Name',
            AccountMaster.DisplayName AS 'Display Name',
            AccountMaster.DataImported,
            AccountMaster.PANNo AS 'PAN No',
            AccountMaster.ClientType AS 'Client Type',
            AccountMaster.CreditDays AS 'Credit Days',
            GROUP_CONCAT(BM.BrandName ORDER BY BM.BrandName SEPARATOR ', ') AS 'Brand Name'
        FROM db_dadasales.AccountMaster
        LEFT JOIN db_dadasales.MaltipalBrand MB ON AccountMaster.Code = MB.AccountMaster_Code
        LEFT JOIN db_dadasales.BrandMaster BM ON MB.BrandMaster_Code = BM.Code
        WHERE AccountMaster.IsClient = 'Y'
        GROUP BY AccountMaster.Code, AccountMaster.AccountName;

    ELSEIF p_Mode = 'LOCATE1' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY DataImported DESC, AccountMaster.Code) AS `S.No`,
            AccountMaster.Code,
            AccountMaster.AccountCode AS 'Account Code',
            AccountMaster.AccountName AS 'Account Name',
            AccountMaster.DisplayName AS 'Display Name',
            AccountMaster.DataImported,
            AccountMaster.PANNo AS 'PAN No',
            GROUP_CONCAT(BM.BrandName ORDER BY BM.BrandName SEPARATOR ', ') AS 'Brand Name'
        FROM db_dadasales.AccountMaster
        LEFT JOIN db_dadasales.MaltipalBrand MB ON AccountMaster.Code = MB.AccountMaster_Code
        LEFT JOIN db_dadasales.BrandMaster BM ON MB.BrandMaster_Code = BM.Code
        WHERE AccountMaster.IsVendor = 'Y'
        GROUP BY AccountMaster.Code, AccountMaster.AccountName;
    END IF;
END$$

DELIMITER ;


-- =============================================================================
-- USP_SalesReturnMaster
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_SalesReturnMaster;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SalesReturnMaster`(
    IN p_Code              INT,
    IN p_Mode              VARCHAR(20),
    IN p_UserMaster_Code   INT,
    IN p_ReasonMaster_Code INT
)
BEGIN
    IF p_Mode = 'LOCATE' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY om.Code DESC) AS `SNo`,
            om.Code,
            am.AccountName AS 'Client Name',
            CASE
                WHEN om.OrderMaster_Code > 0 THEN IFNULL(ordermaster.BuyerPONo, '')
                ELSE IFNULL(om.BuyerPONo, '')
            END AS 'Order No',
            DATE_FORMAT(om.OrderDate, '%d/%b/%Y') AS 'Return Date',
            IFNULL(rm.desp, '') AS 'Reason',
            SUM(srm.OrderQty) AS 'Return Item Qty'
        FROM db_dadasales.SalesReturnMaster AS om
        LEFT JOIN db_dadasales.ordermaster AS ordermaster ON ordermaster.Code = om.ordermaster_Code
        LEFT JOIN db_dadasales.SalesReturndetailmaster AS srm ON srm.SalesReturnMaster_Code = om.Code
        LEFT JOIN db_dadasales.ReasonMaster AS rm ON om.ReasonMaster_Code = rm.Code
        LEFT JOIN db_dadasales.AccountMaster AS am ON om.AccountMaster_Code = am.Code
        LEFT JOIN addressmaster AS ad ON ad.AccountMaster_Code = am.Code AND ad.IsDefault = 'Y'
        LEFT JOIN CityMaster AS cm ON ad.CityMaster_Code = cm.Code
        LEFT JOIN StateMaster AS sm ON ad.StateMaster_Code = sm.Code
        WHERE FIND_IN_SET(om.WarehouseMaster_Code, UDF_GetWarehouseMaster_Codes(p_UserMaster_Code))
        GROUP BY om.Code, am.AccountName, om.BuyerPONo, om.OrderDate, rm.desp;

    ELSEIF p_Mode = 'GETSALERETURNITEM' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY srm.updated_at DESC, om.Code DESC) AS `SNo`,
            om.Code,
            srm.Code AS 'SalesReturnDetailMaster_Code',
            am.AccountName AS 'Client Name',
            CASE
                WHEN om.OrderMaster_Code > 0 THEN IFNULL(ordermaster.BuyerPONo, '')
                ELSE IFNULL(om.BuyerPONo, '')
            END AS 'Order No',
            im.ItemCode AS 'Item Code',
            srm.OrderQty AS 'Qty',
            srm.ScanQty AS 'Scan Qty',
            srm.RecivedQty AS 'Recived Qty',
            rm.Code AS 'ReasonMaster_Code',
            IFNULL(rm.desp, '') AS 'Reason',
            rm1.desp AS 'ReasonDesp',
            im.ItemName AS 'Item Name',
            (
                CASE
                    WHEN IFNULL(srm.RecivedQty, 0) = srm.OrderQty THEN 'GREEN'
                    WHEN IFNULL(srm.RecivedQty, 0) < srm.OrderQty AND IFNULL(srm.RecivedQty, 0) <> 0 THEN 'YELLOW'
                    ELSE 'RED'
                END
            ) AS ROWSTATUS
        FROM db_dadasales.SalesReturnMaster AS om
        LEFT JOIN db_dadasales.ordermaster AS ordermaster ON ordermaster.Code = om.ordermaster_Code
        LEFT JOIN db_dadasales.SalesReturndetailmaster AS srm ON srm.SalesReturnMaster_Code = om.Code
        LEFT JOIN db_dadasales.ReasonMaster AS rm1 ON om.ReasonMaster_Code = rm1.Code
        LEFT JOIN db_dadasales.ReasonMaster AS rm ON srm.ReasonMaster_Code = rm.Code
        LEFT JOIN db_dadasales.ItemMaster AS im ON srm.ItemMaster_Code = im.Code
        LEFT JOIN db_dadasales.AccountMaster AS am ON om.AccountMaster_Code = am.Code
        LEFT JOIN addressmaster AS ad ON ad.AccountMaster_Code = am.Code AND ad.IsDefault = 'Y'
        LEFT JOIN CityMaster AS cm ON ad.CityMaster_Code = cm.Code
        LEFT JOIN StateMaster AS sm ON ad.StateMaster_Code = sm.Code
        WHERE om.Code = p_Code;

    ELSEIF p_Mode = 'UPDATEREASON' THEN
        UPDATE SalesReturndetailmaster
        SET ReasonMaster_Code = p_ReasonMaster_Code
        WHERE Code = p_Code;

        SELECT 'Data inserted successfully.' AS Msg, 'Y' AS Status;
    END IF;
END$$

DELIMITER ;


-- =============================================================================
-- USP_SaveScanSalesreturn
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_SaveScanSalesreturn;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveScanSalesreturn`(
    IN p_Mode                   VARCHAR(20),
    IN p_AccountMasterCode      INT,
    IN p_SalesReturnMaster_Code INT,
    IN p_ScanNo                 VARCHAR(200),
    IN p_UserMaster_Code        INT
)
proc_block: BEGIN
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_FinYear VARCHAR(10) DEFAULT '';
    DECLARE v_LastCode INT DEFAULT 0;
    DECLARE v_UPI_ID VARCHAR(25) DEFAULT '';
    DECLARE v_ItemCode VARCHAR(25) DEFAULT '';
    DECLARE v_ScanQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_Rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_Msg VARCHAR(255) DEFAULT '';
    DECLARE v_Status CHAR(1) DEFAULT 'N';
    DECLARE v_Separator VARCHAR(5) DEFAULT '/';
    DECLARE v_ItemCodePos INT DEFAULT 4;
    DECLARE v_MinParts INT DEFAULT 3;
    DECLARE v_warehousemaster_code INT;

    SELECT COALESCE(Separators, '/'), COALESCE(ItemCodePos, 4), COALESCE(MinParts, 3)
    INTO v_Separator, v_ItemCodePos, v_MinParts
    FROM ScanFormatConfig
    LIMIT 1;

    IF p_Mode = 'SCAN' THEN
        IF ((SELECT IF(LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo, v_Separator, '')) >= 3, 1, 0)) > 0) THEN
            CALL USP_GetItemCodeAndQty(p_ScanNo, @UPI_ID, @ItemCode, @Qty, @Rate);

            SET v_UPI_ID = @UPI_ID;
            SET v_ItemCode = @ItemCode;
            SET v_ScanQty = @Qty;
            SET v_Rate = @Rate;

            SELECT Code INTO v_ItemMaster_Code
            FROM ItemMaster
            WHERE TRIM(ItemCode) = TRIM(v_ItemCode)
            LIMIT 1;

            IF v_ItemMaster_Code IS NULL OR v_ItemMaster_Code = 0 THEN
                SET v_Msg = 'Invalid ItemCode!';
                SET v_Status = 'N';
                SELECT v_Msg AS Msg, v_Status AS Status, 0 AS Code;
                LEAVE proc_block;
            END IF;

            IF p_SalesReturnMaster_Code > 0 THEN
                IF EXISTS (SELECT 1 FROM salesreturnupidetails WHERE UPI_ID = v_UPI_ID) THEN
                    SET v_Msg = 'UPI already scanned!';
                    SET v_Status = 'N';
                    SELECT v_Msg AS Msg, v_Status AS Status, 0 AS Code;
                    LEAVE proc_block;
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM salesreturndetailmaster
                    WHERE ItemMaster_Code = v_ItemMaster_Code
                      AND SalesReturnMaster_Code = p_SalesReturnMaster_Code
                ) THEN
                    UPDATE salesreturndetailmaster
                    SET OrderQty = OrderQty + v_ScanQty,
                        ScanQty = ScanQty + v_ScanQty
                    WHERE ItemMaster_Code = v_ItemMaster_Code
                      AND SalesReturnMaster_Code = p_SalesReturnMaster_Code;

                    INSERT INTO salesreturnupidetails (
                        SalesReturnMaster_Code, SalesReturnDetailMaster_Code, UPI_ID, Qty, Rate
                    ) VALUES (
                        p_SalesReturnMaster_Code,
                        (
                            SELECT Code
                            FROM salesreturndetailmaster
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND SalesReturnMaster_Code = p_SalesReturnMaster_Code
                            LIMIT 1
                        ),
                        v_UPI_ID,
                        v_ScanQty,
                        v_Rate
                    );

                    SET v_Msg = 'Data updated successfully';
                    SET v_Status = 'Y';
                    SET v_LastCode = p_SalesReturnMaster_Code;
                ELSE
                    INSERT INTO salesreturndetailmaster (
                        SalesReturnMaster_Code, ItemMaster_Code, OrderQty, Rate, ManualQty, ScanQty, ReasonMaster_Code
                    ) VALUES (
                        p_SalesReturnMaster_Code, v_ItemMaster_Code, v_ScanQty, v_Rate, 0, v_ScanQty, 1
                    );

                    INSERT INTO salesreturnupidetails (
                        SalesReturnMaster_Code, SalesReturnDetailMaster_Code, UPI_ID, Qty, Rate
                    ) VALUES (
                        p_SalesReturnMaster_Code,
                        (
                            SELECT Code
                            FROM salesreturndetailmaster
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND SalesReturnMaster_Code = p_SalesReturnMaster_Code
                            LIMIT 1
                        ),
                        v_UPI_ID,
                        v_ScanQty,
                        v_Rate
                    );

                    SET v_Msg = 'Data saved successfully';
                    SET v_Status = 'Y';
                    SET v_LastCode = p_SalesReturnMaster_Code;
                END IF;
            ELSE
                IF EXISTS (SELECT 1 FROM salesreturnupidetails WHERE UPI_ID = v_UPI_ID) THEN
                    SET v_Msg = 'UPI already scanned!';
                    SET v_Status = 'N';
                    SELECT v_Msg AS Msg, v_Status AS Status, 0 AS Code;
                    LEAVE proc_block;
                END IF;

                SELECT UDF_GetCurentFinYear(CURRENT_DATE()) INTO v_FinYear;

                INSERT INTO SalesReturnMaster (OrderDate, AccountMaster_Code, CreatedBy, FinYear)
                VALUES (CURRENT_DATE(), p_AccountMasterCode, p_UserMaster_Code, v_FinYear);

                SET v_LastCode = LAST_INSERT_ID();

                INSERT INTO salesreturndetailmaster (
                    SalesReturnMaster_Code, ItemMaster_Code, OrderQty, Rate, ManualQty, ScanQty, ReasonMaster_Code
                ) VALUES (
                    v_LastCode, v_ItemMaster_Code, v_ScanQty, v_Rate, 0, v_ScanQty, 1
                );

                INSERT INTO salesreturnupidetails (
                    SalesReturnMaster_Code, SalesReturnDetailMaster_Code, UPI_ID, Qty, Rate
                ) VALUES (
                    v_LastCode,
                    (
                        SELECT Code
                        FROM salesreturndetailmaster
                        WHERE ItemMaster_Code = v_ItemMaster_Code
                          AND SalesReturnMaster_Code = v_LastCode
                        LIMIT 1
                    ),
                    v_UPI_ID,
                    v_ScanQty,
                    v_Rate
                );

                SET v_Msg = 'New Sales Return created successfully';
                SET v_Status = 'Y';
            END IF;
        ELSE
            SET v_Msg = 'Invalid Scan Format!';
            SET v_Status = 'N';
        END IF;
    ELSE
        SET v_Msg = 'Invalid Mode!';
        SET v_Status = 'N';
    END IF;

    SELECT v_Msg AS Msg, v_Status AS Status, v_LastCode AS Code;
END$$

DELIMITER ;


-- =============================================================================
-- USP_SaveScanSalesReturnMaster
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_SaveScanSalesReturnMaster;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveScanSalesReturnMaster`(
    IN p_Mode   VARCHAR(20),
    IN p_Code   INT,
    IN p_ScanNo VARCHAR(200)
)
BEGIN
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_OrderNo INT;
    DECLARE v_DispatchMaster_Code INT DEFAULT 0;
    DECLARE v_AccountMaster_Code INT DEFAULT 0;
    DECLARE v_ChallanNo INT DEFAULT 0;
    DECLARE v_FinYear VARCHAR(10) DEFAULT '';
    DECLARE v_LastCode INT;
    DECLARE v_SalesReturnMaster_Code INT DEFAULT 0;
    DECLARE v_UPI_ID VARCHAR(25) DEFAULT '';
    DECLARE v_ItemCode VARCHAR(25) DEFAULT '';
    DECLARE v_ScanQty INT DEFAULT 0;
    DECLARE v_Rate INT DEFAULT 0;
    DECLARE v_Separator VARCHAR(5) DEFAULT '/';
    DECLARE v_ItemCodePos INT DEFAULT 4;
    DECLARE v_MinParts INT DEFAULT 3;

    SELECT COALESCE(Separators, '/'), COALESCE(ItemCodePos, 4), COALESCE(MinParts, 3)
    INTO v_Separator, v_ItemCodePos, v_MinParts
    FROM ScanFormatConfig
    LIMIT 1;

    IF p_Mode = 'SCAN' THEN
        IF ((LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo, v_Separator, ''))) < 3) THEN
            SELECT 'INVALID SCAN NO !' AS Msg, 'N' AS Status;
        ELSE
            CALL USP_GetItemCodeAndQty(p_ScanNo, @UPI_ID, @ItemCode, @Qty, @Rate);

            SET v_UPI_ID = @UPI_ID;
            SET v_ItemCode = @ItemCode;
            SET v_ScanQty = @Qty;
            SET v_Rate = @Rate;

            SELECT Code INTO v_ItemMaster_Code
            FROM ItemMaster
            WHERE ItemCode = TRIM(v_ItemCode)
            LIMIT 1;

            IF (
                (SELECT COALESCE(SUM(RecivedQty), 0)
                 FROM SalesReturnDetailMaster
                 WHERE SalesReturnMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code) + v_ScanQty
                >
                (SELECT OrderQty
                 FROM SalesReturnDetailMaster
                 WHERE SalesReturnMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code)
            ) THEN
                SELECT 'INVALID SCAN QTY !' AS Msg, 'N' AS Status;

            ELSEIF EXISTS (
                SELECT 1
                FROM SalesReturnUPIDetails
                WHERE UPI_ID = v_UPI_ID
                  AND (SELECT UPIAutoGenerate FROM fixparameter LIMIT 1) = 'N'
            ) THEN
                SELECT 'UPI ALREADY SCANNED !' AS Msg, 'N' AS Status;

            ELSEIF (
                (SELECT UPIAutoGenerate FROM fixparameter LIMIT 1) = 'N'
                AND NOT EXISTS (
                    SELECT UPI_ID
                    FROM dispatchupiiddetails
                    INNER JOIN dispatchmaster ON dispatchmaster.code = dispatchupiiddetails.DispatchMaster_Code
                    WHERE UPI_ID = v_UPI_ID
                      AND AccountMaster_Code = (
                          SELECT AccountMaster_Code
                          FROM SalesReturnMaster
                          WHERE Code = p_Code
                          LIMIT 1
                      )
                )
            ) THEN
                SELECT 'ITEM DON''T MATCH AS PER THE ORDER !' AS Msg, 'N' AS Status;

            ELSEIF (
                (SELECT UPIAutoGenerate FROM fixparameter LIMIT 1) = 'Y'
                AND NOT EXISTS (
                    SELECT ItemMaster_Code
                    FROM dispatchdetailmaster
                    INNER JOIN dispatchmaster ON dispatchmaster.code = dispatchdetailmaster.DispatchMaster_Code
                    WHERE ItemMaster_Code = v_ItemMaster_Code
                      AND AccountMaster_Code = (
                          SELECT AccountMaster_Code
                          FROM SalesReturnMaster
                          WHERE Code = p_Code
                          LIMIT 1
                      )
                )
            ) THEN
                SELECT 'ITEM DON''T MATCH AS PER THE ORDER !' AS Msg, 'N' AS Status;

            ELSEIF EXISTS (
                SELECT 1
                FROM SalesReturnDetailMaster
                WHERE ItemMaster_Code = v_ItemMaster_Code
                  AND SalesReturnMaster_Code = p_Code
            ) THEN
                UPDATE SalesReturnDetailMaster
                SET RecivedQty = RecivedQty + v_ScanQty,
                    ScanQty = ScanQty + v_ScanQty
                WHERE ItemMaster_Code = v_ItemMaster_Code
                  AND SalesReturnMaster_Code = p_Code;

                INSERT INTO SalesReturnUPIDetails (
                    SalesReturnMaster_Code, SalesReturnDetailMaster_Code, UPI_ID, Qty, Rate
                ) VALUES (
                    p_Code,
                    (
                        SELECT Code
                        FROM SalesReturnDetailMaster
                        WHERE SalesReturnMaster_Code = p_Code
                          AND ItemMaster_Code = v_ItemMaster_Code
                        LIMIT 1
                    ),
                    v_UPI_ID,
                    v_ScanQty,
                    v_Rate
                );

                DELETE FROM dispatchupiiddetails WHERE UPI_ID = v_UPI_ID;

                SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, v_DispatchMaster_Code AS DispatchMaster_Code;
            ELSE
                SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;


-- =============================================================================
-- USP_ShowDashboardData
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_ShowDashboardData;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_ShowDashboardData`(
    IN p_Mode     VARCHAR(20),
    IN p_FromDate VARCHAR(30),
    IN p_ToDate   VARCHAR(30)
)
BEGIN
    -- Section 1: Status Summary
    SELECT
        'Order Received' AS OrderStatus,
        COUNT(DISTINCT OrderMaster.BuyerPONo) AS TotalOrderCount,
        FORMAT(IFNULL(SUM(itemopeningbalance.MRP * OrderDetailMaster.OrderQty), 0.00), 2) AS TotalAmount
    FROM OrderMaster
    LEFT JOIN OrderDetailMaster ON OrderDetailMaster.ordermaster_Code = OrderMaster.Code
    LEFT JOIN itemopeningbalance ON OrderDetailMaster.ItemMaster_Code = itemopeningbalance.ItemMaster_Code
    WHERE DATE(OrderMaster.OrderDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')

    UNION ALL

    SELECT
        'Order Packed',
        COUNT(DISTINCT OrderMaster.BuyerPONo),
        FORMAT(IFNULL(SUM(dispatchupiiddetails.Rate * dispatchupiiddetails.Qty), 0.00), 2) AS TotalAmount
    FROM OrderMaster
    LEFT JOIN DispatchMaster ON OrderMaster.Code = DispatchMaster.OrderMaster_Code
    LEFT JOIN DispatchDetailMaster ON DispatchMaster.Code = DispatchDetailMaster.DispatchMaster_Code
    LEFT JOIN dispatchupiiddetails ON DispatchDetailMaster.Code = dispatchupiiddetails.DispatchDetailMaster_Code
    WHERE DispatchMaster.Completed = 'Y'
      AND DATE(DispatchMaster.CompletedDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')

    UNION ALL

    SELECT
        'Order Dispatched',
        COUNT(DISTINCT OrderMaster.BuyerPONo),
        FORMAT(IFNULL(SUM(dispatchupiiddetails.Rate * DispatchDetailMaster.DispatchQty), 0.00), 2) AS TotalAmount
    FROM OrderMaster
    LEFT JOIN DispatchMaster ON OrderMaster.Code = DispatchMaster.OrderMaster_Code
    LEFT JOIN DispatchDetailMaster ON DispatchMaster.Code = DispatchDetailMaster.DispatchMaster_Code
    LEFT JOIN dispatchupiiddetails ON DispatchDetailMaster.Code = dispatchupiiddetails.DispatchDetailMaster_Code
    WHERE DispatchMaster.IsDispatched = 'Y'
      AND DATE(DispatchMaster.DispatchedDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')

    UNION ALL

    SELECT
        'Sales Return',
        COUNT(DISTINCT OrderNo),
        '0.00' AS TotalAmount
    FROM salesreturnmaster
    WHERE DATE(salesreturnmaster.OrderDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')

    UNION ALL

    SELECT
        'Purchased',
        COUNT(DISTINCT PicklistNo),
        FORMAT(IFNULL(SUM(itemopeningbalance.MRP * MRNDetailMaster.BillQty), '0.00'), 2) AS TotalAmount
    FROM MRNMaster
    LEFT JOIN MRNDetailMaster ON MRNDetailMaster.MRNMaster_Code = MRNMaster.Code
    LEFT JOIN itemopeningbalance ON itemopeningbalance.ItemMaster_Code = MRNDetailMaster.ItemMaster_Code
    WHERE DATE(MRNMASTER.MRNDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d');

    -- Section 2: Product Summary
    SELECT
        COUNT(*) AS TotalItems,
        SUM(CASE WHEN TotalQty > 0 THEN 1 ELSE 0 END) AS QtyGreaterThanZero,
        SUM(CASE WHEN TotalQty = 0 THEN 1 ELSE 0 END) AS QtyEqualToZero,
        SUM(CASE WHEN TotalQty < 0 THEN 1 ELSE 0 END) AS QtyLessThanZero,
        DATE_FORMAT(STR_TO_DATE(p_ToDate, '%Y-%m-%d'), '%d-%m-%Y') AS Date,
        DATE_FORMAT(STR_TO_DATE(p_ToDate, '%Y-%m-%d'), '%M') AS Month
    FROM (
        SELECT
            im.Code,
            COALESCE(iob.OpeningBalance, 0)
            + COALESCE(mrn.TotalBillQty, 0)
            + COALESCE(srd.TotalReceivedQty, 0)
            + COALESCE(odm.TotalCancelQty, 0)
            - COALESCE(odm.TotalDispatchQty, 0) AS TotalQty
        FROM ItemMaster im
        LEFT JOIN (
            SELECT ItemMaster_Code, SUM(OpeningBalance) AS OpeningBalance
            FROM itemopeningbalance
            GROUP BY ItemMaster_Code
        ) iob ON iob.ItemMaster_Code = im.Code
        LEFT JOIN (
            SELECT ItemMaster_Code, SUM(BillQty) AS TotalBillQty
            FROM mrndetailmaster
            WHERE Unloaded = 'Y'
            GROUP BY ItemMaster_Code
        ) mrn ON mrn.ItemMaster_Code = im.Code
        LEFT JOIN (
            SELECT ItemMaster_Code, SUM(RecivedQty) AS TotalReceivedQty
            FROM salesreturndetailmaster
            GROUP BY ItemMaster_Code
        ) srd ON srd.ItemMaster_Code = im.Code
        LEFT JOIN (
            SELECT ItemMaster_Code, SUM(CancelQty) AS TotalCancelQty, SUM(DispatchQty) AS TotalDispatchQty
            FROM orderdetailmaster
            GROUP BY ItemMaster_Code
        ) odm ON odm.ItemMaster_Code = im.Code
    ) AS ItemWithQty;

    -- Section 3: Top 10 Purchase but Not Dispatched
    SELECT
        im.code,
        im.ItemCode AS 'PartNo',
        im.ItemName AS 'PartDescription',
        (IFNULL(iob.OpeningQty, 0) + IFNULL(mrn.ReceivedQty, 0)) AS 'PurchaseQty',
        iob.Rate AS 'DTC',
        ((IFNULL(iob.OpeningQty, 0) + IFNULL(mrn.ReceivedQty, 0)) * Rate) AS 'TotalValue'
    FROM ItemMaster im
    LEFT JOIN (
        SELECT ItemMaster_Code, SUM(OpeningBalance) AS OpeningQty, IFNULL(ItemOpeningBalance.MRP, 1) AS Rate
        FROM ItemOpeningBalance
        GROUP BY ItemMaster_Code, ItemOpeningBalance.MRP
    ) iob ON iob.ItemMaster_Code = im.Code
    LEFT JOIN (
        SELECT ItemMaster_Code, SUM(BillQty) AS ReceivedQty
        FROM MRNDetailMaster
        GROUP BY ItemMaster_Code
    ) mrn ON mrn.ItemMaster_Code = im.Code
    LEFT JOIN (
        SELECT ItemMaster_Code, SUM(DispatchQty) AS DispatchQty
        FROM OrderDetailMaster
        GROUP BY ItemMaster_Code
    ) od ON od.ItemMaster_Code = im.Code
    WHERE IFNULL(od.DispatchQty, 0) = 0
      AND (IFNULL(iob.OpeningQty, 0) + IFNULL(mrn.ReceivedQty, 0)) > 0
    ORDER BY PurchaseQty DESC
    LIMIT 10;

    -- Section 4: Monthly Sales Chart
    WITH RECURSIVE MonthList AS (
        SELECT DATE_FORMAT(STR_TO_DATE(p_FromDate, '%Y-%m-%d'), '%Y-%m-01') AS MonthStart
        UNION ALL
        SELECT DATE_ADD(MonthStart, INTERVAL 1 MONTH)
        FROM MonthList
        WHERE MonthStart < DATE_FORMAT(STR_TO_DATE(p_ToDate, '%Y-%m-%d'), '%Y-%m-01')
    ),
    SalesData AS (
        SELECT
            DATE_FORMAT(DispatchMaster.ChallanDate, '%Y-%m-01') AS SaleMonth,
            SUM(dispatchupiiddetails.Rate) AS TotalAmount
        FROM DispatchMaster
        LEFT JOIN DispatchDetailMaster ON DispatchMaster.Code = DispatchDetailMaster.DispatchMaster_Code
        LEFT JOIN dispatchupiiddetails ON DispatchDetailMaster.Code = dispatchupiiddetails.DispatchDetailMaster_Code
        WHERE DispatchMaster.ChallanDate BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')
        GROUP BY DATE_FORMAT(DispatchMaster.ChallanDate, '%Y-%m-01')
    )
    SELECT
        DATE_FORMAT(m.MonthStart, '%b-%y') AS Month,
        FORMAT(IFNULL(s.TotalAmount, 0.00), 2) AS TotalMonthAmount
    FROM MonthList m
    LEFT JOIN SalesData s ON m.MonthStart = s.SaleMonth
    ORDER BY m.MonthStart;

    -- Section 5: Placeholder Summary
    SELECT
        im.ItemCode,
        im.ItemName AS 'PartDescription',
        sam.StockQTY,
        sam.ScanQty,
        iob.MRP AS 'DTC',
        ABS(sam.StockQTY - sam.ScanQty) AS Difference,
        (ABS(sam.StockQTY - sam.ScanQty) * iob.MRP) AS 'TotalValue',
        sam.IsAudit
    FROM stockauditmaster sam
    LEFT JOIN ItemMaster im ON im.Code = sam.ItemMaster_Code
    LEFT JOIN itemopeningbalance iob ON im.Code = iob.ItemMaster_Code
    WHERE DATE(im.AuditDate) = p_ToDate;

    -- Section 6: Top 10 Clients by Value
    SELECT
        SUM(dispatchupiiddetails.Rate * dispatchupiiddetails.Qty) AS 'TotalValue',
        COUNT(DISTINCT DispatchMaster.OrderMaster_Code) AS 'TotalOrder',
        accountmaster.AccountName AS 'PoClientName'
    FROM DispatchMaster
    LEFT JOIN DispatchDetailMaster ON DispatchDetailMaster.DispatchMaster_Code = DispatchMaster.Code
    LEFT JOIN dispatchupiiddetails ON dispatchupiiddetails.DispatchDetailMaster_Code = DispatchDetailMaster.Code
    LEFT JOIN AccountMaster ON AccountMaster.Code = DispatchMaster.AccountMaster_Code
    WHERE DATE(DispatchMaster.CompletedDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')
    GROUP BY AccountMaster.AccountName
    ORDER BY TotalValue DESC
    LIMIT 10;

    -- Section 7: Employee detail
    SELECT
        UM.UserName AS 'Name',
        IFNULL(mrndetailmaster.Unloaded, 0) AS Unloaded,
        IFNULL(PackedOrders.NoOfPackedOrders, 0) AS NoOfOrderPacked,
        IFNULL(DispatchedOrders.NoOfDispatchedOrders, 0) AS NoOfOrderDispatch
    FROM UserMaster UM
    LEFT JOIN (
        SELECT CreatedBy, COUNT(*) AS NoOfPackedOrders
        FROM dispatchmaster
        WHERE DATE(CompletedDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')
        GROUP BY CreatedBy
    ) AS PackedOrders ON UM.Code = PackedOrders.CreatedBy
    LEFT JOIN (
        SELECT CreateBy, COUNT(DISTINCT DispatchMaster_Code) AS NoOfDispatchedOrders
        FROM dispatchboxvalidationmaster
        LEFT JOIN DispatchMaster ON DispatchMaster.Code = dispatchboxvalidationmaster.DispatchMaster_Code
        WHERE DATE(DispatchedDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')
        GROUP BY CreateBy
    ) AS DispatchedOrders ON UM.Code = DispatchedOrders.CreateBy
    LEFT JOIN (
        SELECT UserMaster_Code, COUNT(DISTINCT MRNDate, VehicleNo) AS Unloaded
        FROM mrndetailmaster
        LEFT JOIN MRNMaster ON mrnmaster.code = mrndetailmaster.mrnmaster_code
        WHERE DATE(MRNDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')
        GROUP BY UserMaster_Code
    ) AS mrndetailmaster ON UM.Code = mrndetailmaster.UserMaster_Code
    WHERE UM.UserType = 'U';

    -- Section 8: Sale Loss detail
    SELECT
        COUNT(DISTINCT orderdetailmaster.ItemMaster_Code) AS TotalLineOfProduct,
        SUM(orderdetailmaster.OrderQty - orderdetailmaster.DispatchQty) AS TotalProductQty,
        SUM((orderdetailmaster.OrderQty - orderdetailmaster.DispatchQty) * IFNULL(ItemOpeningBalance.MRP, 0)) AS TotalValue
    FROM ordermaster
    LEFT JOIN orderdetailmaster ON ordermaster.Code = orderdetailmaster.OrderMaster_Code
    LEFT JOIN ItemOpeningBalance ON ItemOpeningBalance.ItemMaster_Code = orderdetailmaster.ItemMaster_Code
    LEFT JOIN dispatchmaster ON ordermaster.Code = dispatchmaster.OrderMaster_Code
    WHERE dispatchmaster.Completed = 'Y'
      AND orderdetailmaster.DispatchQty < orderdetailmaster.OrderQty
      AND DATE(dispatchmaster.CompletedDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d');

    -- Section 9: Sale Return detail
    SELECT
        accountmaster.AccountName AS PartyName,
        salesreturnmaster.OrderNoWithPrefix AS OrderNo,
        reasonmaster.Desp AS Reason,
        IFNULL(SUM(salesreturnupidetails.Rate), 0) AS Value,
        SUM(salesreturndetailmaster.OrderQty) AS TotalOrderQty,
        SUM(salesreturndetailmaster.RecivedQty) AS TotalRecivedQty
    FROM salesreturnmaster
    LEFT JOIN salesreturndetailmaster ON salesreturnmaster.Code = salesreturndetailmaster.SalesReturnMaster_Code
    LEFT JOIN salesreturnupidetails ON salesreturnupidetails.SalesReturnDetailMaster_Code = salesreturndetailmaster.Code
        AND salesreturnmaster.Code = salesreturnupidetails.SalesReturnMaster_Code
    LEFT JOIN accountmaster ON salesreturnmaster.AccountMaster_Code = accountmaster.Code
    LEFT JOIN reasonmaster ON salesreturnmaster.reasonmaster_Code = reasonmaster.Code
    WHERE MONTH(salesreturnmaster.BuyerPODate) = MONTH(p_ToDate)
      AND YEAR(salesreturnmaster.BuyerPODate) = YEAR(p_ToDate)
    GROUP BY accountmaster.AccountName, salesreturnmaster.OrderNoWithPrefix, reasonmaster.Desp;

    -- Section 10: TAT CONFIGURATION
    SELECT fp.CompanyCode, tc.*
    FROM tat_configuration tc
    CROSS JOIN (SELECT CompanyCode FROM Fixparameter LIMIT 1) fp;

    -- Section 11: TAT MASTER
    CALL USP_TATBenchmark(p_ToDate);

    -- Section 12: Audit Summery
    SELECT
        'Not Done' AS Status,
        GROUP_CONCAT(DateList SEPARATOR ', ') AS Date
    FROM (
        SELECT DATE_FORMAT(ItemMaster.AuditDate, '%d-%m-%Y') AS DateList
        FROM stockauditmaster
        LEFT JOIN ItemMaster ON stockauditmaster.ItemMaster_Code = ItemMaster.Code
        WHERE MONTH(ItemMaster.AuditDate) = MONTH(p_ToDate)
          AND YEAR(ItemMaster.AuditDate) = YEAR(p_ToDate)
        GROUP BY ItemMaster.AuditDate
        HAVING SUM(ScanQty) = 0
    ) AS T;

    -- Section 13: Company Name (ds.Tables[12])
    SELECT CompanyName
    FROM CompanyMaster
    WHERE IFNULL(IsActive, 'Y') = 'Y'
    ORDER BY Code
    LIMIT 1;
END$$

DELIMITER ;


-- =============================================================================
-- CompanyMaster table (safe to re-run)
-- Fields: Code, CompanyCode, CompanyName, AliasName, AddressLine1, AddressLine2,
--         CityMaster_Code, CountryMaster_Code, PIN, PANNo, GSTNo, Phone, MobileNo,
--         Email, MSMENo, UPIId (+ audit columns)
-- =============================================================================
CREATE TABLE IF NOT EXISTS db_dadasales.CompanyMaster (
    Code               INT NOT NULL AUTO_INCREMENT,
    CompanyCode        VARCHAR(50)  NULL,
    CompanyName        VARCHAR(100) NOT NULL,
    AliasName          VARCHAR(100) NULL,
    AddressLine1       VARCHAR(250) NULL,
    AddressLine2       VARCHAR(250) NULL,
    CityMaster_Code    INT          NULL,
    CountryMaster_Code INT          NULL,
    PIN                VARCHAR(10)  NULL,
    PANNo              VARCHAR(10)  NULL,
    GSTNo              VARCHAR(20)  NULL,
    Phone              VARCHAR(15)  NULL,
    MobileNo           VARCHAR(15)  NULL,
    Email              VARCHAR(100) NULL,
    MSMENo             VARCHAR(50)  NULL,
    UPIId              VARCHAR(100) NULL,
    CompanyAddress     VARCHAR(250) NULL,
    CreatedBy          INT          NULL,
    CreatedOn          DATETIME     NULL,
    ModifiedBy         INT          NULL,
    ModifiedOn         DATETIME     NULL,
    IsActive           CHAR(1)      NOT NULL DEFAULT 'Y',
    PRIMARY KEY (Code)
);

-- -----------------------------------------------------------------------------
-- Add any missing columns on existing CompanyMaster tables (safe to re-run)
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS USP_CompanyMaster_AddColumn;

DELIMITER $$
CREATE PROCEDURE USP_CompanyMaster_AddColumn(IN p_Col VARCHAR(64), IN p_Def VARCHAR(255))
BEGIN
    IF (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'db_dadasales'
          AND TABLE_NAME = 'CompanyMaster'
          AND COLUMN_NAME = p_Col) = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE db_dadasales.CompanyMaster ADD COLUMN ', p_Col, ' ', p_Def);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL USP_CompanyMaster_AddColumn('CompanyCode',        'VARCHAR(50) NULL AFTER Code');
CALL USP_CompanyMaster_AddColumn('AliasName',          'VARCHAR(100) NULL AFTER CompanyName');
CALL USP_CompanyMaster_AddColumn('AddressLine1',       'VARCHAR(250) NULL');
CALL USP_CompanyMaster_AddColumn('AddressLine2',       'VARCHAR(250) NULL');
CALL USP_CompanyMaster_AddColumn('CityMaster_Code',    'INT NULL');
CALL USP_CompanyMaster_AddColumn('CountryMaster_Code', 'INT NULL');
CALL USP_CompanyMaster_AddColumn('PIN',                'VARCHAR(10) NULL');
CALL USP_CompanyMaster_AddColumn('PANNo',              'VARCHAR(10) NULL');
CALL USP_CompanyMaster_AddColumn('GSTNo',              'VARCHAR(20) NULL');
CALL USP_CompanyMaster_AddColumn('Phone',              'VARCHAR(15) NULL');
CALL USP_CompanyMaster_AddColumn('MobileNo',           'VARCHAR(15) NULL');
CALL USP_CompanyMaster_AddColumn('Email',              'VARCHAR(100) NULL');
CALL USP_CompanyMaster_AddColumn('MSMENo',             'VARCHAR(50) NULL');
CALL USP_CompanyMaster_AddColumn('UPIId',              'VARCHAR(100) NULL');
CALL USP_CompanyMaster_AddColumn('CreatedBy',          'INT NULL');
CALL USP_CompanyMaster_AddColumn('CreatedOn',          'DATETIME NULL');
CALL USP_CompanyMaster_AddColumn('ModifiedBy',         'INT NULL');
CALL USP_CompanyMaster_AddColumn('ModifiedOn',         'DATETIME NULL');

DROP PROCEDURE IF EXISTS USP_CompanyMaster_AddColumn;

-- =============================================================================
-- USP_CompanyMaster
-- Modes : SAVE (insert/update), DELETE, SHOWDATA (single by code), LOCATE (grid)
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_CompanyMaster;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_CompanyMaster`(
    IN p_Mode     VARCHAR(20),
    IN p_Code     INT,
    IN p_jsonData JSON
)
BEGIN
    DECLARE v_CreatedByID INT;
    DECLARE v_ExistingCount INT DEFAULT 0;

    SELECT MIN(Code) INTO v_CreatedByID FROM db_dadasales.UserMaster;

    IF p_Mode = 'SAVE' THEN
        IF p_Code > 0 THEN
            SELECT COUNT(*) INTO v_ExistingCount
            FROM db_dadasales.CompanyMaster
            WHERE CompanyName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.companyName'))
              AND Code != p_Code
              AND IsActive = 'Y';

            IF v_ExistingCount > 0 THEN
                SELECT 'Duplicate Company Name Record not allow!.' AS Msg, 'N' AS Status;
            ELSE
                UPDATE db_dadasales.CompanyMaster
                SET
                    CompanyCode        = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.companyCode')),
                    CompanyName        = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.companyName')),
                    AliasName          = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.aliasName')),
                    AddressLine1       = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.addressLine1')),
                    AddressLine2       = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.addressLine2')),
                    CityMaster_Code    = (SELECT Code FROM db_dadasales.CityMaster WHERE Cityname = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.cityName')) LIMIT 1),
                    CountryMaster_Code = (SELECT Code FROM db_dadasales.countrymaster WHERE CountryName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.nation')) LIMIT 1),
                    PIN                = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.pin')),
                    PANNo              = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.pANNo')),
                    GSTNo              = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.gstNo')),
                    Phone              = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.phone')),
                    MobileNo           = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.mobileNo')),
                    Email              = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.email')),
                    MSMENo             = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.mSMENo')),
                    UPIId              = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.uPIId')),
                    ModifiedBy         = v_CreatedByID,
                    ModifiedOn         = NOW()
                WHERE Code = p_Code;

                SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status;
            END IF;
        ELSE
            SELECT COUNT(*) INTO v_ExistingCount
            FROM db_dadasales.CompanyMaster
            WHERE CompanyName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.companyName'))
              AND IsActive = 'Y';

            IF v_ExistingCount > 0 THEN
                SELECT 'Duplicate Company Name Record not inserted!.' AS Msg, 'N' AS Status;
            ELSE
                INSERT INTO db_dadasales.CompanyMaster (
                    CompanyCode, CompanyName, AliasName, AddressLine1, AddressLine2,
                    CityMaster_Code, CountryMaster_Code, PIN, PANNo, GSTNo, Phone,
                    MobileNo, Email, MSMENo, UPIId, CreatedBy, CreatedOn, IsActive
                ) VALUES (
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.companyCode')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.companyName')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.aliasName')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.addressLine1')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.addressLine2')),
                    (SELECT Code FROM db_dadasales.CityMaster WHERE Cityname = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.cityName')) LIMIT 1),
                    (SELECT Code FROM db_dadasales.countrymaster WHERE CountryName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.nation')) LIMIT 1),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.pin')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.pANNo')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.gstNo')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.phone')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.mobileNo')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.email')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.mSMENo')),
                    JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.uPIId')),
                    v_CreatedByID,
                    NOW(),
                    'Y'
                );

                SELECT 'Data Save Successfully' AS Msg, 'Y' AS Status;
            END IF;
        END IF;

    ELSEIF p_Mode = 'DELETE' THEN
        DELETE FROM db_dadasales.CompanyMaster WHERE Code = p_Code;
        SELECT 'Data Deleted Successfully' AS Msg, 'Y' AS Status;

    ELSEIF p_Mode = 'SHOWDATA' THEN
        SELECT
            CM.Code,
            CM.CompanyCode,
            CM.CompanyName,
            CM.AliasName,
            CM.AddressLine1,
            CM.AddressLine2,
            CY.Cityname    AS CityName,
            CO.CountryName AS Nation,
            CM.PIN,
            CM.PANNo,
            CM.GSTNo,
            CM.Phone,
            CM.MobileNo,
            CM.Email,
            CM.MSMENo,
            CM.UPIId,
            CM.CreatedBy,
            CU.UserName AS CreatedByName,
            CM.CreatedOn,
            CM.ModifiedBy,
            MU.UserName AS ModifiedByName,
            CM.ModifiedOn
        FROM db_dadasales.CompanyMaster CM
        LEFT JOIN db_dadasales.CityMaster    CY ON CM.CityMaster_Code = CY.Code
        LEFT JOIN db_dadasales.countrymaster CO ON CM.CountryMaster_Code = CO.Code
        LEFT JOIN db_dadasales.UserMaster    CU ON CM.CreatedBy = CU.Code
        LEFT JOIN db_dadasales.UserMaster    MU ON CM.ModifiedBy = MU.Code
        WHERE CM.Code = p_Code
          AND CM.IsActive = 'Y';

    ELSEIF p_Mode = 'LOCATE' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY CM.Code) AS `S.No`,
            CM.Code,
            CM.CompanyCode    AS 'Company Code',
            CM.CompanyName    AS 'Company Name',
            CM.AliasName      AS 'Alias Name',
            CM.AddressLine1   AS 'Address Line 1',
            CM.AddressLine2   AS 'Address Line 2',
            CY.Cityname       AS 'City',
            CO.CountryName    AS 'Nation',
            CM.PIN            AS 'Pin Code',
            CM.PANNo          AS 'PAN No',
            CM.GSTNo          AS 'GST No',
            CM.Phone          AS 'Phone',
            CM.MobileNo       AS 'Mobile',
            CM.Email          AS 'Email',
            CM.MSMENo         AS 'MSME No',
            CM.UPIId          AS 'UPI Id',
            CU.UserName       AS 'Created By',
            DATE_FORMAT(CM.CreatedOn, '%d-%m-%Y %H:%i') AS 'Created On',
            MU.UserName       AS 'Modified By',
            DATE_FORMAT(CM.ModifiedOn, '%d-%m-%Y %H:%i') AS 'Modified On'
        FROM db_dadasales.CompanyMaster CM
        LEFT JOIN db_dadasales.CityMaster    CY ON CM.CityMaster_Code = CY.Code
        LEFT JOIN db_dadasales.countrymaster CO ON CM.CountryMaster_Code = CO.Code
        LEFT JOIN db_dadasales.UserMaster    CU ON CM.CreatedBy = CU.Code
        LEFT JOIN db_dadasales.UserMaster    MU ON CM.ModifiedBy = MU.Code
        WHERE CM.IsActive = 'Y'
        ORDER BY CM.Code;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- USP_OrderCancellation
-- Modes :
--   LOCATE     - Order list (Pending + Partial Pending) for cancellation grid
--   GETLINES   - Item-level pending/partial lines (all orders, or one if p_Code > 0)
--   GETHEADER  - Order header by p_Code (OrderMaster_Code)
--   GETITEMS   - Cancellable item lines by p_Code
--   GETDETAIL  - GETHEADER + GETITEMS (two result sets for API detail screen)
--   SAVE       - Apply cancellation qty from p_jsonData
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_OrderCancellation;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_OrderCancellation`(
    IN p_Code              INT,
    IN p_Mode              VARCHAR(20),
    IN p_UserMaster_Code   INT,
    IN p_ReasonMaster_Code INT,
    IN p_Remark            VARCHAR(250),
    IN p_jsonData          JSON
)
proc_block: BEGIN
    DECLARE v_total          INT DEFAULT 0;
    DECLARE v_idx            INT DEFAULT 0;
    DECLARE v_DetailCode     INT DEFAULT 0;
    DECLARE v_CancelQty      DECIMAL(18, 4) DEFAULT 0;
    DECLARE v_PendingQty     DECIMAL(18, 4) DEFAULT 0;
    DECLARE v_OrderMaster_Code INT DEFAULT 0;
    DECLARE v_ReasonDesp     VARCHAR(255) DEFAULT '';
    DECLARE v_RemarkFinal    VARCHAR(500) DEFAULT '';
    DECLARE v_Msg            VARCHAR(255) DEFAULT '';
    DECLARE v_Status         CHAR(1) DEFAULT 'N';

    IF p_Mode = 'LOCATE' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY om.OrderDate DESC, om.Code DESC) AS `SNo`,
            om.Code,
            om.OrderNo                                           AS `Order No`,
            DATE_FORMAT(om.OrderDate, '%d-%m-%Y')                AS `Order Date`,
            om.BuyerPONo                                         AS `Buyer PO No`,
            DATE_FORMAT(om.BuyerPODate, '%d-%m-%Y')               AS `Buyer PO Date`,
            am.AccountName                                       AS `Client Name`,
            SUM(IFNULL(odm.OrderQty, 0))                         AS `Order Qty`,
            SUM(IFNULL(odm.DispatchQty, 0))                      AS `Dispatch Qty`,
            SUM(IFNULL(odm.CancelQty, 0))                          AS `Cancel Qty`,
            SUM(
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Pending Qty`,
            CASE
                WHEN SUM(IFNULL(odm.DispatchQty, 0)) = 0 THEN 'Pending'
                WHEN SUM(
                    IFNULL(odm.OrderQty, 0)
                  - IFNULL(odm.DispatchQty, 0)
                  - IFNULL(odm.CancelQty, 0)
                ) > 0 THEN 'Partial Pending'
                ELSE 'Completed'
            END                                                  AS `Order Status`
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        LEFT JOIN db_dadasales.AccountMaster am
            ON am.Code = om.AccountMaster_Code
        WHERE om.IsActive = 'Y'
        GROUP BY
            om.Code, om.OrderNo, om.OrderDate, om.BuyerPONo, om.BuyerPODate, am.AccountName
        HAVING SUM(
            IFNULL(odm.OrderQty, 0)
          - IFNULL(odm.DispatchQty, 0)
          - IFNULL(odm.CancelQty, 0)
        ) > 0
        ORDER BY om.OrderDate DESC, om.Code DESC;

    ELSEIF p_Mode = 'GETLINES' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY om.OrderDate DESC, om.Code DESC, im.ItemCode) AS `SNo`,
            om.Code                                              AS OrderMaster_Code,
            om.OrderNo,
            om.OrderNoWithPrefix,
            DATE_FORMAT(om.OrderDate, '%d-%m-%Y')                AS OrderDate,
            om.BuyerPONo,
            am.AccountName                                       AS ClientName,
            odm.Code                                             AS OrderDetailMaster_Code,
            odm.ItemMaster_Code,
            im.ItemCode,
            im.ItemName,
            IFNULL(odm.OrderQty, 0)                              AS OrderQty,
            IFNULL(odm.DispatchQty, 0)                           AS DispatchQty,
            IFNULL(odm.CancelQty, 0)                             AS CancelQty,
            (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS PendingQty,
            CASE
                WHEN IFNULL(odm.DispatchQty, 0) = 0
                 AND (
                    IFNULL(odm.OrderQty, 0)
                  - IFNULL(odm.DispatchQty, 0)
                  - IFNULL(odm.CancelQty, 0)
                 ) > 0 THEN 'Pending'
                WHEN IFNULL(odm.DispatchQty, 0) > 0
                 AND (
                    IFNULL(odm.OrderQty, 0)
                  - IFNULL(odm.DispatchQty, 0)
                  - IFNULL(odm.CancelQty, 0)
                 ) > 0 THEN 'Partial Pending'
                ELSE 'Completed'
            END                                                  AS OrderStatus
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        INNER JOIN db_dadasales.ItemMaster im
            ON im.Code = odm.ItemMaster_Code
        LEFT JOIN db_dadasales.AccountMaster am
            ON am.Code = om.AccountMaster_Code
        WHERE om.IsActive = 'Y'
          AND (p_Code = 0 OR om.Code = p_Code)
          AND (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
          ) > 0
        ORDER BY om.OrderDate DESC, om.Code DESC, im.ItemCode;

    ELSEIF p_Mode = 'GETHEADER' THEN
        SELECT
            om.Code,
            om.OrderNo,
            om.OrderNoWithPrefix,
            DATE_FORMAT(om.OrderDate, '%d-%m-%Y')                AS OrderDate,
            DATE_FORMAT(om.OrderDate, '%d/%b/%Y')                AS `Order Date`,
            om.BuyerPONo,
            om.BuyerPONo                                         AS `Buyer PO No`,
            DATE_FORMAT(om.BuyerPODate, '%d-%m-%Y')              AS BuyerPODate,
            DATE_FORMAT(om.BuyerPODate, '%d/%b/%Y')              AS `Buyer PO Date`,
            om.AccountMaster_Code,
            am.AccountName,
            am.AccountName                                       AS `Client Name`,
            om.Remark,
            SUM(IFNULL(odm.OrderQty, 0))                         AS `Order Qty`,
            SUM(IFNULL(odm.DispatchQty, 0))                      AS `Dispatch Qty`,
            SUM(IFNULL(odm.CancelQty, 0))                        AS `Cancel Qty`,
            SUM(
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Pending Qty`
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        LEFT JOIN db_dadasales.AccountMaster am
            ON am.Code = om.AccountMaster_Code
        WHERE om.Code = p_Code
          AND om.IsActive = 'Y'
        GROUP BY
            om.Code, om.OrderNo, om.OrderNoWithPrefix, om.OrderDate, om.BuyerPONo,
            om.BuyerPODate, om.AccountMaster_Code, am.AccountName, om.Remark;

    ELSEIF p_Mode = 'GETITEMS' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY im.ItemCode) AS `SNo`,
            odm.Code,
            odm.Code                                             AS OrderDetailMaster_Code,
            odm.ItemMaster_Code,
            im.ItemCode                                          AS `Item Code`,
            im.ItemName                                          AS `Item Name`,
            IFNULL(odm.OrderQty, 0)                              AS `Order Qty`,
            IFNULL(odm.DispatchQty, 0)                           AS `Dispatch Qty`,
            IFNULL(odm.CancelQty, 0)                             AS `Cancel Qty`,
            (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Pending Qty`,
            (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Balance Qty`,
            CASE
                WHEN IFNULL(odm.DispatchQty, 0) = 0 THEN 'Pending'
                ELSE 'Partial Pending'
            END                                                  AS `Line Status`
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        INNER JOIN db_dadasales.ItemMaster im
            ON im.Code = odm.ItemMaster_Code
        WHERE om.Code = p_Code
          AND om.IsActive = 'Y'
          AND (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
          ) > 0
        ORDER BY im.ItemCode;

    ELSEIF p_Mode = 'GETDETAIL' THEN
        SELECT
            om.Code,
            om.OrderNo,
            om.OrderNoWithPrefix,
            DATE_FORMAT(om.OrderDate, '%d-%m-%Y')                AS OrderDate,
            DATE_FORMAT(om.OrderDate, '%d/%b/%Y')                AS `Order Date`,
            om.BuyerPONo,
            om.BuyerPONo                                         AS `Buyer PO No`,
            DATE_FORMAT(om.BuyerPODate, '%d-%m-%Y')              AS BuyerPODate,
            DATE_FORMAT(om.BuyerPODate, '%d/%b/%Y')              AS `Buyer PO Date`,
            om.AccountMaster_Code,
            am.AccountName,
            am.AccountName                                       AS `Client Name`,
            om.Remark,
            SUM(IFNULL(odm.OrderQty, 0))                         AS `Order Qty`,
            SUM(IFNULL(odm.DispatchQty, 0))                      AS `Dispatch Qty`,
            SUM(IFNULL(odm.CancelQty, 0))                        AS `Cancel Qty`,
            SUM(
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Pending Qty`
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        LEFT JOIN db_dadasales.AccountMaster am
            ON am.Code = om.AccountMaster_Code
        WHERE om.Code = p_Code
          AND om.IsActive = 'Y'
        GROUP BY
            om.Code, om.OrderNo, om.OrderNoWithPrefix, om.OrderDate, om.BuyerPONo,
            om.BuyerPODate, om.AccountMaster_Code, am.AccountName, om.Remark;

        SELECT
            ROW_NUMBER() OVER (ORDER BY im.ItemCode) AS `SNo`,
            odm.Code,
            odm.Code                                             AS OrderDetailMaster_Code,
            odm.ItemMaster_Code,
            im.ItemCode                                          AS `Item Code`,
            im.ItemName                                          AS `Item Name`,
            IFNULL(odm.OrderQty, 0)                              AS `Order Qty`,
            IFNULL(odm.DispatchQty, 0)                           AS `Dispatch Qty`,
            IFNULL(odm.CancelQty, 0)                             AS `Cancel Qty`,
            (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Pending Qty`,
            (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Balance Qty`,
            CASE
                WHEN IFNULL(odm.DispatchQty, 0) = 0 THEN 'Pending'
                ELSE 'Partial Pending'
            END                                                  AS `Line Status`
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        INNER JOIN db_dadasales.ItemMaster im
            ON im.Code = odm.ItemMaster_Code
        WHERE om.Code = p_Code
          AND om.IsActive = 'Y'
          AND (
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
          ) > 0
        ORDER BY im.ItemCode;

    ELSEIF p_Mode = 'GETDISPATCH' THEN
        SELECT
            om.Code                                              AS OrderMaster_Code,
            om.OrderNo,
            dm.Code                                              AS DispatchMaster_Code,
            dm.ChallanNo,
            DATE_FORMAT(dm.ChallanDate, '%d-%m-%Y')              AS ChallanDate,
            dm.Completed,
            dm.IsDispatched,
            SUM(IFNULL(ddm.DispatchQty, 0))                      AS ChallanDispatchQty
        FROM db_dadasales.OrderMaster om
        LEFT JOIN db_dadasales.DispatchMaster dm
            ON dm.OrderMaster_Code = om.Code
           AND dm.IsActive = 'Y'
        LEFT JOIN db_dadasales.DispatchDetailMaster ddm
            ON ddm.DispatchMaster_Code = dm.Code
        WHERE om.Code = p_Code
        GROUP BY om.Code, om.OrderNo, dm.Code, dm.ChallanNo, dm.ChallanDate, dm.Completed, dm.IsDispatched
        ORDER BY dm.ChallanDate DESC, dm.Code DESC;

    ELSEIF p_Mode = 'SAVE' THEN
        SET v_OrderMaster_Code = IFNULL(
            CAST(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.OrderMaster_Code')) AS UNSIGNED),
            p_Code
        );

        IF v_OrderMaster_Code IS NULL OR v_OrderMaster_Code = 0 THEN
            SELECT 'Invalid order.' AS Msg, 'N' AS Status;
            LEAVE proc_block;
        END IF;

        IF p_ReasonMaster_Code IS NULL OR p_ReasonMaster_Code = 0 THEN
            SET p_ReasonMaster_Code = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.ReasonMaster_Code')) AS UNSIGNED);
        END IF;

        IF p_ReasonMaster_Code IS NOT NULL AND p_ReasonMaster_Code > 0 THEN
            SELECT IFNULL(Desp, '') INTO v_ReasonDesp
            FROM db_dadasales.ReasonMaster
            WHERE Code = p_ReasonMaster_Code
            LIMIT 1;
        END IF;

        IF p_Remark IS NULL OR TRIM(p_Remark) = '' THEN
            SET p_Remark = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$.Remark')), '');
        END IF;

        SET v_RemarkFinal = TRIM(CONCAT(
            IF(v_ReasonDesp <> '', CONCAT('Reason: ', v_ReasonDesp), ''),
            IF(v_ReasonDesp <> '' AND TRIM(IFNULL(p_Remark, '')) <> '', ' | ', ''),
            IFNULL(p_Remark, '')
        ));

        SET v_total = IFNULL(JSON_LENGTH(JSON_EXTRACT(p_jsonData, '$.Details')), 0);

        IF v_total = 0 THEN
            SELECT 'No cancellation lines found.' AS Msg, 'N' AS Status;
            LEAVE proc_block;
        END IF;

        SET v_idx = 0;
        save_loop: WHILE v_idx < v_total DO
            SET v_DetailCode = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, CONCAT('$.Details[', v_idx, '].OrderDetailMaster_Code'))) AS UNSIGNED);
            SET v_CancelQty = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, CONCAT('$.Details[', v_idx, '].CancelQty'))) AS DECIMAL(18, 4));

            IF v_DetailCode IS NOT NULL AND v_DetailCode > 0 AND IFNULL(v_CancelQty, 0) > 0 THEN
                SELECT
                    (
                        IFNULL(odm.OrderQty, 0)
                      - IFNULL(odm.DispatchQty, 0)
                      - IFNULL(odm.CancelQty, 0)
                    )
                INTO v_PendingQty
                FROM db_dadasales.OrderDetailMaster odm
                WHERE odm.Code = v_DetailCode
                  AND odm.OrderMaster_Code = v_OrderMaster_Code
                LIMIT 1;

                IF v_PendingQty IS NULL THEN
                    SELECT CONCAT('Invalid order line: ', v_DetailCode) AS Msg, 'N' AS Status;
                    LEAVE proc_block;
                END IF;

                IF v_CancelQty > v_PendingQty THEN
                    SELECT CONCAT('Cancel qty cannot exceed pending qty for line ', v_DetailCode, '.') AS Msg, 'N' AS Status;
                    LEAVE proc_block;
                END IF;

                UPDATE db_dadasales.OrderDetailMaster
                SET CancelQty = IFNULL(CancelQty, 0) + v_CancelQty
                WHERE Code = v_DetailCode
                  AND OrderMaster_Code = v_OrderMaster_Code;
            END IF;

            SET v_idx = v_idx + 1;
        END WHILE save_loop;

        IF v_RemarkFinal <> '' THEN
            UPDATE db_dadasales.OrderMaster
            SET Remark     = TRIM(CONCAT(IFNULL(Remark, ''), CASE WHEN IFNULL(Remark, '') <> '' THEN ' | ' ELSE '' END, v_RemarkFinal)),
                ModifiedBy = p_UserMaster_Code,
                ModifiedOn = NOW()
            WHERE Code = v_OrderMaster_Code;
        END IF;

        SELECT 'Order cancellation saved successfully.' AS Msg, 'Y' AS Status, v_OrderMaster_Code AS OrderMaster_Code;

    ELSEIF p_Mode = 'REOPEN_LIST' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY om.OrderDate DESC, om.Code DESC) AS `SNo`,
            om.Code,
            om.OrderNo                                           AS `Order No`,
            DATE_FORMAT(om.OrderDate, '%d-%m-%Y')                AS `Order Date`,
            om.BuyerPONo                                         AS `Buyer PO No`,
            DATE_FORMAT(om.BuyerPODate, '%d-%m-%Y')               AS `Buyer PO Date`,
            am.AccountName                                       AS `Client Name`,
            SUM(IFNULL(odm.OrderQty, 0))                         AS `Order Qty`,
            SUM(IFNULL(odm.DispatchQty, 0))                      AS `Dispatch Qty`,
            SUM(IFNULL(odm.CancelQty, 0))                        AS `Cancel Qty`,
            SUM(
                IFNULL(odm.OrderQty, 0)
              - IFNULL(odm.DispatchQty, 0)
              - IFNULL(odm.CancelQty, 0)
            )                                                    AS `Pending Qty`,
            CASE
                WHEN SUM(
                    IFNULL(odm.OrderQty, 0)
                  - IFNULL(odm.DispatchQty, 0)
                  - IFNULL(odm.CancelQty, 0)
                ) = 0 THEN 'Fully Cancelled'
                ELSE 'Partially Cancelled'
            END                                                  AS `Cancel Status`
        FROM db_dadasales.OrderMaster om
        INNER JOIN db_dadasales.OrderDetailMaster odm
            ON odm.OrderMaster_Code = om.Code
        LEFT JOIN db_dadasales.AccountMaster am
            ON am.Code = om.AccountMaster_Code
        WHERE om.IsActive = 'Y'
        GROUP BY
            om.Code, om.OrderNo, om.OrderDate, om.BuyerPONo, om.BuyerPODate, am.AccountName
        HAVING SUM(IFNULL(odm.CancelQty, 0)) > 0
        ORDER BY om.OrderDate DESC, om.Code DESC;

    ELSEIF p_Mode = 'REOPEN' THEN
        IF p_Code IS NULL OR p_Code = 0 THEN
            SELECT 'Invalid order code.' AS Msg, 'N' AS Status;
            LEAVE proc_block;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM db_dadasales.OrderMaster
            WHERE Code = p_Code AND IsActive = 'Y'
        ) THEN
            SELECT 'Order not found or already inactive.' AS Msg, 'N' AS Status;
            LEAVE proc_block;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM db_dadasales.OrderDetailMaster
            WHERE OrderMaster_Code = p_Code AND IFNULL(CancelQty, 0) > 0
        ) THEN
            SELECT 'No cancelled lines found for this order.' AS Msg, 'N' AS Status;
            LEAVE proc_block;
        END IF;

        UPDATE db_dadasales.OrderDetailMaster
        SET    CancelQty  = 0,
               ModifiedOn = NOW()
        WHERE  OrderMaster_Code = p_Code
          AND  IFNULL(CancelQty, 0) > 0;

        UPDATE db_dadasales.OrderMaster
        SET    Remark      = TRIM(CONCAT(
                                 IFNULL(Remark, ''),
                                 CASE WHEN IFNULL(Remark, '') <> '' THEN ' | ' ELSE '' END,
                                 CONCAT('Re-Opened by user ', p_UserMaster_Code)
                             )),
               ModifiedBy  = p_UserMaster_Code,
               ModifiedOn  = NOW()
        WHERE  Code = p_Code;

        SELECT 'Order re-opened successfully.' AS Msg, 'Y' AS Status, p_Code AS OrderMaster_Code;

    ELSE
        SELECT CONCAT('Invalid Mode: ', IFNULL(p_Mode, '')) AS Msg, 'N' AS Status;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- USP_SaleLossReport
-- Cancelled order line detail for Sale Loss Report (CancelQty > 0)
-- Params: p_FromDate, p_ToDate (yyyy-MM-dd), p_CancelStatus (All | Fully Cancelled | Partially Cancelled)
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_SaleLossReport;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaleLossReport`(
    IN p_FromDate     VARCHAR(20),
    IN p_ToDate       VARCHAR(20),
    IN p_CancelStatus VARCHAR(30)
)
BEGIN
    SELECT
        ROW_NUMBER() OVER (ORDER BY om.OrderDate DESC, om.Code DESC, im.ItemCode) AS `SNo`,
        am.AccountName                                       AS `Client Name`,
        om.BuyerPONo                                         AS `Buyer PO No`,
        im.ItemCode                                          AS `Item Code`,
        im.ItemName                                          AS `Item Name`,
        IFNULL(odm.OrderQty, 0)                              AS `Order Qty`,
        IFNULL(odm.DispatchQty, 0)                           AS `Dispatch Qty`,
        IFNULL(odm.CancelQty, 0)                             AS `Cancel Qty`,
        IFNULL(iob.MRP, 0)                                   AS `Rate`,
        (IFNULL(odm.CancelQty, 0) * IFNULL(iob.MRP, 0))     AS `Cancel Value`,
        oc.`Cancel Status`
    FROM db_dadasales.OrderMaster om
    INNER JOIN (
        SELECT
            odm_sum.OrderMaster_Code,
            CASE
                WHEN SUM(
                    IFNULL(odm_sum.OrderQty, 0)
                  - IFNULL(odm_sum.DispatchQty, 0)
                  - IFNULL(odm_sum.CancelQty, 0)
                ) = 0 THEN 'Fully Cancelled'
                ELSE 'Partially Cancelled'
            END AS `Cancel Status`
        FROM db_dadasales.OrderDetailMaster odm_sum
        GROUP BY odm_sum.OrderMaster_Code
        HAVING SUM(IFNULL(odm_sum.CancelQty, 0)) > 0
    ) oc
        ON oc.OrderMaster_Code = om.Code
    INNER JOIN db_dadasales.OrderDetailMaster odm
        ON odm.OrderMaster_Code = om.Code
    INNER JOIN db_dadasales.ItemMaster im
        ON im.Code = odm.ItemMaster_Code
    LEFT JOIN db_dadasales.AccountMaster am
        ON am.Code = om.AccountMaster_Code
    LEFT JOIN db_dadasales.ItemOpeningBalance iob
        ON iob.ItemMaster_Code = odm.ItemMaster_Code
    WHERE om.IsActive = 'Y'
      AND IFNULL(odm.CancelQty, 0) > 0
      AND DATE(om.OrderDate) BETWEEN STR_TO_DATE(p_FromDate, '%Y-%m-%d') AND STR_TO_DATE(p_ToDate, '%Y-%m-%d')
      AND (
            IFNULL(p_CancelStatus, 'All') = 'All'
         OR oc.`Cancel Status` = p_CancelStatus
      )
    ORDER BY om.OrderDate DESC, om.Code DESC, im.ItemCode;
END$$

DELIMITER ;

-- =============================================================================
-- USP_OrderDispatch
-- Modes :
--   LOCATE - Pending standalone dispatches (OrderMaster_Code = 0, not completed)
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_OrderDispatch;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_OrderDispatch`(
    IN p_Mode VARCHAR(20),
    IN p_Code INT
)
BEGIN
    IF p_Mode = 'LOCATE' THEN
        SELECT
            ROW_NUMBER() OVER (ORDER BY dm.ChallanDate, dm.Code DESC) AS `SNo`,
            dm.Code,
            IFNULL(dm.OrderNo, '')                                 AS `Order No`,
            am.AccountName                                         AS `Client Name`,
            DATE_FORMAT(dm.ChallanDate, '%d/%m/%Y')                AS `Order Date`,
            SUM(IFNULL(ddm.DispatchQty, 0))                        AS `Total Qty`
        FROM db_dadasales.dispatchmaster dm
        LEFT JOIN db_dadasales.dispatchdetailmaster ddm
            ON ddm.dispatchmaster_Code = dm.Code
        LEFT JOIN db_dadasales.AccountMaster am
            ON am.Code = dm.AccountMaster_Code
        WHERE (dm.Completed IS NULL OR dm.Completed <> 'Y')
          AND dm.OrderMaster_Code = 0
        GROUP BY
            dm.Code,
            dm.OrderNo,
            dm.OrderMaster_Code,
            dm.ChallanDate,
            am.AccountName
        ORDER BY dm.ChallanDate, dm.Code DESC;

    ELSE
        SELECT CONCAT('Invalid Mode: ', IFNULL(p_Mode, '')) AS Msg, 'N' AS Status;
    END IF;
END$$

DELIMITER ;


-- =============================================================================
-- USP_SaveScanDispatchOrder
-- Scan & Bill dispatch (no OrderMaster / OrderDetailMaster dependency)
-- p_Code = AccountMaster_Code when creating a new dispatch
-- =============================================================================
DROP PROCEDURE IF EXISTS USP_SaveScanDispatchOrder;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveScanDispatchOrder`(
    IN p_Mode VARCHAR(20),
    IN p_Code INT,
    IN p_DispatchMaster_Code INT,
    IN p_ScanNo VARCHAR(200),
    IN P_UserMaster_Code INT,
    IN p_ScanQty INT,
    IN p_ManualQty INT,
    IN p_DispatchQty INT,
    IN p_packedBy Varchar(100),
    IN p_InvoiceNo VARCHAR(100),
    IN p_WarehouseMaster_Code INT,
    IN p_BoxNo INT
)
proc_label: BEGIN

    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_DispatchMaster_Code INT;
    DECLARE v_AccountMaster_Code INT DEFAULT 0;
    DECLARE v_ChallanNo INT DEFAULT 0;
    DECLARE v_FinYear VARCHAR(10) DEFAULT '';
    DECLARE v_LastCode INT;
    DECLARE v_OrderMaster_Code INT DEFAULT 0;
    DECLARE v_UPI_ID VARCHAR(25) DEFAULT '';
    DECLARE v_ItemCode VARCHAR(250) DEFAULT '';
    DECLARE v_ScanQty INT DEFAULT 0;
    DECLARE v_Rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_MRP DECIMAL(10,2) DEFAULT 0;
    DECLARE v_BrandMaster_Code INT DEFAULT 0;
    DECLARE v_PicklistNo VARCHAR(1) DEFAULT 'N';
    DECLARE v_ScanFormatCheck INT DEFAULT 0;
    DECLARE v_ExistingDispatchDetailCode INT DEFAULT 0;
    DECLARE v_SlashCount INT DEFAULT 0;
    DECLARE v_CurrentRate INT DEFAULT 0;
    DECLARE v_Separator    VARCHAR(5)  DEFAULT '/';
    DECLARE v_ItemCodePos  INT DEFAULT 4;
    DECLARE v_MinParts     INT  DEFAULT 3;
    DECLARE v_warehousemaster_code INT DEFAULT 0;

    SELECT
        COALESCE(Separators,   '/'),
        COALESCE(ItemCodePos,  4),
        COALESCE(MinParts,     3)
    INTO
        v_Separator, v_ItemCodePos, v_MinParts
    FROM ScanFormatConfig
    LIMIT 1;

    IF p_Mode = 'SCAN' THEN
        IF TRIM(IFNULL(p_InvoiceNo, '')) = '' THEN
            SELECT 'PLEASE ENTER INVOICE NO !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        IF p_DispatchMaster_Code <= 0 AND IFNULL(p_Code, 0) <= 0 THEN
            SELECT 'PLEASE SELECT CLIENT !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        IF IFNULL(p_WarehouseMaster_Code, 0) <= 0 THEN
            SELECT 'PLEASE SELECT WAREHOUSE !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        IF TRIM(IFNULL(p_packedBy, '')) = '' THEN
            SELECT 'PLEASE ENTER PACKED BY !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        IF IFNULL(p_BoxNo, 0) <= 0 THEN
            SELECT 'PLEASE ENTER BOX NO !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        IF TRIM(IFNULL(p_ScanNo, '')) = '' THEN
            SELECT 'PLEASE SCAN PRODUCT !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        SET v_ScanFormatCheck = (SELECT IF(LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo, v_Separator, '')) >= 3, 1, 0));
        IF v_ScanFormatCheck > 0 THEN
            SELECT Code, BrandMaster_Code INTO v_ItemMaster_Code, v_BrandMaster_Code
            FROM ItemMaster
            WHERE ItemCode = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_ScanNo, v_Separator, v_ItemCodePos), v_Separator, -1))
            LIMIT 1;
        ELSE
            SELECT Code, BrandMaster_Code INTO v_ItemMaster_Code, v_BrandMaster_Code
            FROM ItemMaster
            WHERE ItemCode = TRIM(SUBSTRING_INDEX(p_ScanNo, v_Separator, 1))
            LIMIT 1;
        END IF;

        IF v_BrandMaster_Code > 0 THEN
            SELECT COALESCE(PicklistNo, 'N') INTO v_PicklistNo
            FROM BrandMaster
            WHERE Code = v_BrandMaster_Code LIMIT 1;
        END IF;

        IF v_PicklistNo = 'Y' THEN
            IF v_ScanFormatCheck = 0 THEN
                SELECT 'INVALID SCAN NO !' AS Msg, 'N' AS Status;
                LEAVE proc_label;
            ELSE
                CALL USP_GetItemCodeAndQty(p_ScanNo, @UPI_ID, @ItemCode, @Qty, @Rate);
                SET v_UPI_ID = @UPI_ID;
                SET v_ItemCode = @ItemCode;
                SET v_ScanQty = @Qty;
                SET v_Rate = @Rate;
                SET v_MRP = 0;
                SELECT Code INTO v_ItemMaster_Code
                FROM ItemMaster WHERE ItemCode = TRIM(v_ItemCode) LIMIT 1;
            END IF;
        ELSE
            SET v_SlashCount = LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo, v_Separator, ''));

            IF v_ScanFormatCheck > 0 THEN
                CALL USP_GetItemCodeAndQtyWithoutPickList(p_ScanNo, @ItemCode, @Qty);
                SET v_ItemCode = @ItemCode;
                SET v_ScanQty = @Qty;
                SET v_Rate = 0;
                SET v_MRP = 0;

                IF (p_DispatchMaster_Code > 0) THEN
                    SELECT CASE WHEN IFNULL(dd.Rate, 0) > 0 THEN dd.Rate ELSE IFNULL(im.MRPNo, 0) END
                    INTO v_MRP
                    FROM ItemMaster im
                    LEFT JOIN DispatchDetailMaster dd
                        ON dd.ItemMaster_Code = im.Code
                       AND dd.DispatchMaster_Code = p_DispatchMaster_Code
                    WHERE im.ItemCode = TRIM(v_ItemCode)
                    LIMIT 1;
                ELSE
                    SELECT IFNULL(MRPNo, 0)
                    INTO v_MRP
                    FROM ItemMaster
                    WHERE ItemCode = TRIM(v_ItemCode)
                    LIMIT 1;
                END IF;

                IF v_ItemMaster_Code = 0 THEN
                    SELECT Code INTO v_ItemMaster_Code
                    FROM ItemMaster WHERE ItemCode = TRIM(v_ItemCode) LIMIT 1;
                END IF;
            ELSEIF v_SlashCount = 1 THEN
                SET v_ItemCode = TRIM(SUBSTRING_INDEX(p_ScanNo, v_Separator, 1));
                SET v_ScanQty = CAST(TRIM(SUBSTRING_INDEX(p_ScanNo, v_Separator, -1)) AS UNSIGNED);
                IF v_ScanQty <= 0 THEN
                    SET v_ScanQty = 1;
                END IF;
                SELECT Code, COALESCE(MRPNo, 0) INTO v_ItemMaster_Code, v_MRP
                FROM ItemMaster
                WHERE ItemCode = v_ItemCode
                LIMIT 1;
                SET v_Rate = 0;
            ELSE
                SELECT 'INVALID SCAN FORMAT ! PLEASE USE ITEMCODE/1' AS Msg, 'N' AS Status;
                LEAVE proc_label;
            END IF;
        END IF;

        IF v_ItemMaster_Code > 0 THEN
            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y') THEN
                SET v_warehousemaster_code = p_WarehouseMaster_Code;
                CALL USP_Validate_UPI_FIFO(v_UPI_ID, v_ItemMaster_Code, v_warehousemaster_code, @Status, @Message, @Upi);
                SET v_UPI_ID = @Upi;
                IF (@Status = 'N') THEN
                    SELECT @Message AS Msg, 'N' AS Status;
                    LEAVE proc_label;
                END IF;
            END IF;

            IF EXISTS(SELECT Code FROM ITEMMASTER WHERE Code = v_ItemMaster_Code AND IsAudit = 'Y') THEN
                IF p_DispatchMaster_Code > 0 THEN
                    SELECT AccountMaster_Code INTO v_AccountMaster_Code
                    FROM DispatchMaster
                    WHERE Code = p_DispatchMaster_Code
                    LIMIT 1;
                ELSEIF p_Code > 0 THEN
                    SET v_AccountMaster_Code = p_Code;
                ELSE
                    SELECT 'INVALID CLIENT !' AS Msg, 'N' AS Status;
                    LEAVE proc_label;
                END IF;

                SET v_OrderMaster_Code = 0;

                IF v_PicklistNo = 'Y' THEN
                    IF p_DispatchMaster_Code > 0 THEN
                        IF EXISTS (SELECT DispatchMaster_Code FROM Dispatchupiiddetails WHERE UPI_ID = v_UPI_ID) THEN
                            SELECT 'UPI ALREADY SCANNED !' AS Msg, 'N' AS Status;
                        ELSEIF EXISTS (
                            SELECT Code FROM DispatchDetailMaster
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND DispatchMaster_Code = p_DispatchMaster_Code
                        ) THEN
                            UPDATE DispatchDetailMaster
                            SET DispatchQty = DispatchQty + v_ScanQty,
                                ScanQty = ScanQty + v_ScanQty
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND DispatchMaster_Code = p_DispatchMaster_Code;

                            INSERT INTO Dispatchupiiddetails(
                                DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                            ) VALUES (
                                p_DispatchMaster_Code,
                                (
                                    SELECT Code FROM DispatchDetailMaster
                                    WHERE ItemMaster_Code = v_ItemMaster_Code
                                      AND DispatchMaster_Code = p_DispatchMaster_Code
                                    LIMIT 1
                                ),
                                v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                            );

                            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y') THEN
                                UPDATE mrnupiiddetails SET IsDispatch = 'Y' WHERE UPI_ID = v_UPI_ID;
                            END IF;

                            SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                        ELSE
                            INSERT INTO DispatchDetailMaster (
                                DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                            ) VALUES (
                                p_DispatchMaster_Code,
                                v_ItemMaster_Code, 0, 0,
                                v_ScanQty, 0, 0, 0, '', p_ManualQty, v_ScanQty
                            );

                            INSERT INTO Dispatchupiiddetails(
                                DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                            ) VALUES (
                                p_DispatchMaster_Code,
                                (
                                    SELECT Code FROM DispatchDetailMaster
                                    WHERE ItemMaster_Code = v_ItemMaster_Code
                                      AND DispatchMaster_Code = p_DispatchMaster_Code
                                    LIMIT 1
                                ),
                                v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                            );

                            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y') THEN
                                UPDATE mrnupiiddetails SET IsDispatch = 'Y' WHERE UPI_ID = v_UPI_ID;
                            END IF;

                            SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                        END IF;
                    ELSE
                        IF EXISTS (SELECT DispatchMaster_Code FROM Dispatchupiiddetails WHERE UPI_ID = v_UPI_ID) THEN
                            SELECT 'UPI ALREADY SCANNED !' AS Msg, 'N' AS Status;
                        ELSE
                            SELECT UDF_GetCurentFinYear(CURRENT_DATE()) INTO v_FinYear;
                            SELECT COALESCE(MAX(CAST(ChallanNo AS UNSIGNED)), 0) INTO v_ChallanNo
                            FROM DispatchMaster
                            WHERE FinYear = v_FinYear;

                            INSERT INTO DispatchMaster (
                                ChallanNo, OrderNo, ChallanDate, AccountMaster_Code, FinYear, EmployeeMaster_Code,
                                CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code
                            ) VALUES (
                                v_ChallanNo + 1, p_InvoiceNo, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear,
                                (SELECT Code FROM employeemaster WHERE EmployeeName = p_packedBy LIMIT 1),
                                P_UserMaster_Code, NOW(), 'Y',
                                (SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), 0
                            );

                            SET v_LastCode = LAST_INSERT_ID();

                            INSERT INTO DispatchDetailMaster (
                                DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code,
                                DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                            ) VALUES (
                                v_LastCode, v_ItemMaster_Code, 0, 0,
                                v_ScanQty, 0, 0, 0, '', p_ManualQty, v_ScanQty
                            );

                            INSERT INTO Dispatchupiiddetails(
                                DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                            ) VALUES (
                                v_LastCode,
                                (
                                    SELECT Code FROM DispatchDetailMaster
                                    WHERE ItemMaster_Code = v_ItemMaster_Code
                                      AND DispatchMaster_Code = v_LastCode
                                    LIMIT 1
                                ),
                                v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                            );

                            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y') THEN
                                UPDATE mrnupiiddetails SET IsDispatch = 'Y' WHERE UPI_ID = v_UPI_ID;
                            END IF;

                            SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status, v_LastCode AS DispatchMaster_Code;
                        END IF;
                    END IF;
                ELSE
                    IF p_DispatchMaster_Code > 0 THEN
                        SELECT Code INTO v_ExistingDispatchDetailCode
                        FROM DispatchDetailMaster
                        WHERE ItemMaster_Code = v_ItemMaster_Code
                          AND DispatchMaster_Code = p_DispatchMaster_Code
                        LIMIT 1;

                        SELECT IFNULL(Rate, 0) INTO v_CurrentRate
                        FROM DispatchDetailMaster
                        WHERE Code = v_ExistingDispatchDetailCode;

                        IF v_CurrentRate > 0 THEN
                            SELECT 'MRP Not Update' AS Msg, 'N' AS Status;
                        ELSEIF v_ExistingDispatchDetailCode > 0 THEN
                            UPDATE DispatchDetailMaster
                            SET DispatchQty = DispatchQty + v_ScanQty,
                                ScanQty = ScanQty + v_ScanQty,
                                QtyBox = QtyBox + v_ScanQty,
                                Rate = CASE WHEN IFNULL(Rate, 0) = 0 THEN v_MRP ELSE Rate END
                            WHERE Code = v_ExistingDispatchDetailCode;

                            SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                        ELSE
                            SELECT Code INTO v_ExistingDispatchDetailCode
                            FROM DispatchDetailMaster
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND DispatchMaster_Code = p_DispatchMaster_Code
                              AND QtyBox > 0
                            LIMIT 1;

                            IF v_ExistingDispatchDetailCode > 0 THEN
                                INSERT INTO DispatchDetailMaster (
                                    DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                    QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                ) VALUES (
                                    p_DispatchMaster_Code,
                                    v_ItemMaster_Code, 0, 0,
                                    v_ScanQty, v_ScanQty, v_MRP, 0, '', p_ManualQty, v_ScanQty
                                );

                                SELECT 'Data Saved Successfully (New Box)' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                            ELSE
                                INSERT INTO DispatchDetailMaster (
                                    DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                    QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                ) VALUES (
                                    p_DispatchMaster_Code,
                                    v_ItemMaster_Code, 0, 0,
                                    v_ScanQty, v_ScanQty, v_MRP, 0, '', p_ManualQty, v_ScanQty
                                );

                                SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                            END IF;
                        END IF;
                    ELSE
                        IF v_MRP = 0 AND v_ItemMaster_Code > 0 THEN
                            SELECT COALESCE(MRPNo, 0) INTO v_MRP
                            FROM ItemMaster WHERE Code = v_ItemMaster_Code LIMIT 1;
                        END IF;

                        SELECT UDF_GetCurentFinYear(CURRENT_DATE()) INTO v_FinYear;
                        SELECT COALESCE(MAX(CAST(ChallanNo AS UNSIGNED)), 0) INTO v_ChallanNo
                        FROM DispatchMaster
                        WHERE FinYear = v_FinYear;

                        INSERT INTO DispatchMaster (
                            ChallanNo, OrderNo, ChallanDate, AccountMaster_Code, FinYear, EmployeeMaster_Code,
                            CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code
                        ) VALUES (
                            v_ChallanNo + 1, p_InvoiceNo, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear,
                            (SELECT Code FROM employeemaster WHERE EmployeeName = p_packedBy LIMIT 1),
                            P_UserMaster_Code, NOW(), 'Y',
                            (SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), 0
                        );

                        SET v_LastCode = LAST_INSERT_ID();

                        INSERT INTO DispatchDetailMaster (
                            DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code,
                            DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                        ) VALUES (
                            v_LastCode, v_ItemMaster_Code, 0, 0,
                            v_ScanQty, v_ScanQty, v_MRP, 0, '', p_ManualQty, v_ScanQty
                        );

                        SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status, v_LastCode AS DispatchMaster_Code;
                    END IF;
                END IF;
            ELSE
                SELECT 'THIS ITEM IN STOCK AUDIT !' AS Msg, 'N' AS Status;
            END IF;
        ELSE
            SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
        END IF;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- End of script
-- =============================================================================

-- USP_SaveScanSalesreturn
-- Manual Sales Return scan. Requires Warehouse + Reason.
-- On success, removes scanned UPI from dispatchupiiddetails for the client.

DROP PROCEDURE IF EXISTS USP_SaveScanSalesreturn;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveScanSalesreturn`(
    IN p_Mode                   VARCHAR(20),
    IN p_AccountMasterCode      INT,
    IN p_SalesReturnMaster_Code INT,
    IN p_ScanNo                 VARCHAR(200),
    IN p_UserMaster_Code        INT,
    IN p_WarehouseMaster_Code   INT,
    IN p_ReasonMaster_Code      INT
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
    DECLARE v_warehousemaster_code INT DEFAULT 0;
    DECLARE v_reasonmaster_code INT DEFAULT 0;
    DECLARE v_OrderNo VARCHAR(20) DEFAULT NULL;
    DECLARE v_selected_count INT DEFAULT 0;

    SELECT
        COALESCE(Separators,   '/'),
        COALESCE(ItemCodePos,  4),
        COALESCE(MinParts,     3)
    INTO
        v_Separator, v_ItemCodePos, v_MinParts
    FROM ScanFormatConfig
    LIMIT 1;

    IF p_Mode = 'SCAN' THEN
        IF IFNULL(p_WarehouseMaster_Code, 0) <= 0 THEN
            SET v_Msg = 'Please select Warehouse!';
            SET v_Status = 'N';
            SELECT v_Msg AS Msg, v_Status AS Status, 0 AS Code;
            LEAVE proc_block;
        END IF;

        IF IFNULL(p_ReasonMaster_Code, 0) <= 0 THEN
            SET v_Msg = 'Please select Reason!';
            SET v_Status = 'N';
            SELECT v_Msg AS Msg, v_Status AS Status, 0 AS Code;
            LEAVE proc_block;
        END IF;

        SET v_warehousemaster_code = p_WarehouseMaster_Code;
        SET v_reasonmaster_code = p_ReasonMaster_Code;

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

            SELECT COUNT(*) INTO v_selected_count
            FROM dispatchupiiddetails du
            JOIN dispatchmaster dm ON dm.Code = du.DispatchMaster_Code
            WHERE dm.AccountMaster_Code = p_AccountMasterCode
              AND du.UPI_ID = v_UPI_ID;

            IF v_selected_count = 0 THEN
                SET v_Msg = 'No matching selected items found for this invoice.';
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

                    DELETE FROM dispatchupiiddetails
                    WHERE UPI_ID = v_UPI_ID
                      AND DispatchMaster_Code IN (
                          SELECT Code FROM (
                              SELECT Code FROM dispatchmaster
                              WHERE AccountMaster_Code = p_AccountMasterCode
                          ) dm
                      );

                    SET v_Msg = 'Data updated successfully';
                    SET v_Status = 'Y';
                    SET v_LastCode = p_SalesReturnMaster_Code;
                ELSE
                    INSERT INTO salesreturndetailmaster (
                        SalesReturnMaster_Code, ItemMaster_Code, OrderQty, Rate, ManualQty, ScanQty, ReasonMaster_Code
                    ) VALUES (
                        p_SalesReturnMaster_Code, v_ItemMaster_Code, v_ScanQty, v_Rate, 0, v_ScanQty, v_reasonmaster_code
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

                    DELETE FROM dispatchupiiddetails
                    WHERE UPI_ID = v_UPI_ID
                      AND DispatchMaster_Code IN (
                          SELECT Code FROM (
                              SELECT Code FROM dispatchmaster
                              WHERE AccountMaster_Code = p_AccountMasterCode
                          ) dm
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

                SELECT LPAD(CAST(COALESCE(MAX(CAST(OrderNo AS UNSIGNED)), 0) + 1 AS UNSIGNED), 4, '0')
                INTO v_OrderNo
                FROM salesreturnmaster
                WHERE FinYear = v_FinYear;

                INSERT INTO SalesReturnMaster (
                    OrderDate, OrderNo, AccountMaster_Code, CreatedBy, CreatedOn,
                    FinYear, WarehouseMaster_Code, ReasonMaster_Code
                )
                VALUES (
                    CURRENT_DATE(), v_OrderNo, p_AccountMasterCode, p_UserMaster_Code, NOW(),
                    v_FinYear, v_warehousemaster_code, v_reasonmaster_code
                );

                SET v_LastCode = LAST_INSERT_ID();

                INSERT INTO salesreturndetailmaster (
                    SalesReturnMaster_Code, ItemMaster_Code, OrderQty, Rate, ManualQty, ScanQty, ReasonMaster_Code
                ) VALUES (
                    v_LastCode, v_ItemMaster_Code, v_ScanQty, v_Rate, 0, v_ScanQty, v_reasonmaster_code
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

                DELETE FROM dispatchupiiddetails
                WHERE UPI_ID = v_UPI_ID
                  AND DispatchMaster_Code IN (
                      SELECT Code FROM (
                          SELECT Code FROM dispatchmaster
                          WHERE AccountMaster_Code = p_AccountMasterCode
                      ) dm
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

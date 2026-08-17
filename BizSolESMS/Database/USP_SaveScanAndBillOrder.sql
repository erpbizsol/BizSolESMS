USE `webiz_demo`;
DROP PROCEDURE IF EXISTS `USP_SaveScanAndBillOrder`;

DELIMITER $$
USE `webiz_demo`$$
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveScanAndBillOrder`(
	IN p_Mode VARCHAR(30),
    IN p_Code INT,
    IN p_OrderNo VARCHAR(200),
    IN p_ScanNo VARCHAR(200),
    IN P_UserMaster_Code INT, 
    IN p_packedBy Varchar(100), 
    IN p_ClientName Varchar(500),
    IN p_BoxNo INT,
    IN p_WarehouseMaster_Code INT,
    IN p_IsManual CHAR(1)
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
	DECLARE v_QRType VARCHAR(100) DEFAULT 'OTHER';
    DECLARE v_IsCheckStock CHAR(1) DEFAULT 'N';
    DECLARE v_BalanceQty DECIMAL(18,4) DEFAULT 0;

    SET v_QRType = COALESCE(UDF_DetectQRType(p_ScanNo), 'OTHER');
    
    SELECT
        COALESCE(Separators,   '/'),
        COALESCE(ItemCodePos,  4),
        COALESCE(MinParts,     3)
    INTO
        v_Separator, v_ItemCodePos, v_MinParts
    FROM ScanFormatConfig WHere QRType=v_QRType
    LIMIT 1;

    IF p_Mode = 'SCAN' 
    THEN
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

        IF (v_PicklistNo = 'Y' OR v_QRType='UPITATA') THEN
            IF v_ScanFormatCheck = 0 THEN
                SELECT 'INVALID SCAN NO !' AS Msg, 'N' AS Status;
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

                IF (p_Code > 0) THEN
                    SELECT CASE WHEN IFNULL(dd.Rate, 0) > 0 THEN dd.Rate ELSE IFNULL(im.MRPNo, 0) END
                    INTO v_MRP
                    FROM ItemMaster im
                    LEFT JOIN DispatchDetailMaster dd
                        ON dd.ItemMaster_Code = im.Code
                       AND dd.DispatchMaster_Code = p_Code
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
            END IF;
        END IF;
 
        IF v_ItemMaster_Code > 0 THEN
            SET v_warehousemaster_code = p_WarehouseMaster_Code;

            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y' AND v_QRType<>'UPIHERO') THEN
                CALL USP_Validate_UPI_FIFO(v_UPI_ID, v_ItemMaster_Code, v_warehousemaster_code, @Status, @Message, @Upi);
                SET v_UPI_ID = @Upi;
                IF (@Status = 'N') THEN
                    SELECT @Message AS Msg, 'N' AS Status;
                    LEAVE proc_label;
                END IF;
            END IF;

            -- Stock is validated only when IsCheckStockForDispatch = 'Y'.
            -- If the flag is 'N', skip stock check and continue with save.
            SELECT COALESCE(IsCheckStockForDispatch, 'N') INTO v_IsCheckStock
            FROM FixParameter
            LIMIT 1;

            IF v_IsCheckStock = 'Y' THEN
                SET v_BalanceQty = IFNULL(UDF_GetItemBalanceQty(v_ItemMaster_Code, v_warehousemaster_code), 0);
                IF v_BalanceQty <= 0 THEN
                    SELECT 'This item out of stock.!' AS Msg, 'N' AS Status;
                    LEAVE proc_label;
                ELSEIF v_BalanceQty < v_ScanQty THEN
                    SELECT 'Please check item stock .!' AS Msg, 'N' AS Status;
                    LEAVE proc_label;
                END IF;
            END IF;

            IF EXISTS(SELECT Code FROM ITEMMASTER WHERE Code = v_ItemMaster_Code AND IsAudit = 'Y') THEN
                SET v_OrderMaster_Code = 0;
                IF(p_IsManual = 'N')
                THEN
                    Select Code INTO v_AccountMaster_Code From AccountMaster Where AccountName=p_ClientName;
                    SET p_ClientName='';
                ELSE
                    IF EXISTS(Select Code From AccountMaster Where AccountName=p_ClientName LIMIT 1) 
                    THEN
                        Select Code INTO v_AccountMaster_Code From AccountMaster Where AccountName=p_ClientName;
                    ELSE
                        INSERT INTO AccountMaster 
                        (AccountName,DisplayName,PANNo,IsMSME,IsVendor,IsClient,CreatedBy,CreatedOn,IsActive,AccountCode,DataImported,ClientType,CreditDays)
                        VALUES (p_ClientName,p_ClientName,'','N','N','Y',P_UserMaster_Code,NOW(),'Y','','Y','',0);
                        
                        Select Code INTO v_AccountMaster_Code From AccountMaster Where AccountName=p_ClientName;
                    END IF;
                END IF;
                IF (v_PicklistNo = 'Y' OR v_QRType='UPITATA')  THEN
                    IF p_Code > 0 THEN
                        IF EXISTS (SELECT DispatchMaster_Code FROM Dispatchupiiddetails WHERE UPI_ID = v_UPI_ID) THEN
                            SELECT 'UPI ALREADY SCANNED !' AS Msg, 'N' AS Status;
                        ELSEIF EXISTS (
                            SELECT Code FROM DispatchDetailMaster
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND DispatchMaster_Code = p_Code
                        ) THEN
                            UPDATE DispatchDetailMaster
                            SET DispatchQty = DispatchQty + v_ScanQty,
                                ScanQty = ScanQty + v_ScanQty
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND DispatchMaster_Code = p_Code;

                            INSERT INTO Dispatchupiiddetails(
                                DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                            ) VALUES (
                                p_Code,
                                (
                                    SELECT Code FROM DispatchDetailMaster
                                    WHERE ItemMaster_Code = v_ItemMaster_Code
                                      AND DispatchMaster_Code = p_Code
                                    LIMIT 1
                                ),
                                v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                            );

                            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y' AND v_QRType<>'UPIHERO') THEN
                                UPDATE mrnupiiddetails SET IsDispatch = 'Y' WHERE UPI_ID = v_UPI_ID;
                            END IF;

                            SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, p_Code AS DispatchMaster_Code;
                        ELSE
                            INSERT INTO DispatchDetailMaster (
                                DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                            ) VALUES (
                                p_Code,
                                v_ItemMaster_Code, 0, 0,
                                v_ScanQty, 0, 0, 0, '', 0, v_ScanQty
                            );

                            INSERT INTO Dispatchupiiddetails(
                                DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                            ) VALUES (
                                p_Code,
                                (
                                    SELECT Code FROM DispatchDetailMaster
                                    WHERE ItemMaster_Code = v_ItemMaster_Code
                                      AND DispatchMaster_Code = p_Code
                                    LIMIT 1
                                ),
                                v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                            );

                            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y' AND v_QRType='UPIHERO') THEN
                                UPDATE mrnupiiddetails SET IsDispatch = 'Y' WHERE UPI_ID = v_UPI_ID;
                            END IF;

                            SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_Code AS DispatchMaster_Code;
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
                                ChallanNo, ChallanDate, AccountMaster_Code, FinYear, EmployeeMaster_Code,
                                CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code,OrderNo,ClientName,WarehouseMaster_Code
                            ) VALUES (
                                v_ChallanNo + 1, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear,
                                (SELECT Code FROM employeemaster WHERE EmployeeName = p_packedBy LIMIT 1),
                                P_UserMaster_Code, NOW(), 'Y',
                                (SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), 0,p_OrderNo,p_ClientName,p_WarehouseMaster_Code
                            );

                            SET v_LastCode = LAST_INSERT_ID();
 
                            INSERT INTO DispatchDetailMaster (
                                DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code,
                                DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                            ) VALUES (
                                v_LastCode, v_ItemMaster_Code, 0, 0,
                                v_ScanQty, 0, 0, 0, '', 0, v_ScanQty
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

                            IF ((SELECT UPIAutoGenerate FROM Fixparameter LIMIT 1) = 'Y' AND v_QRType<>'UPIHERO') THEN
                                UPDATE mrnupiiddetails SET IsDispatch = 'Y' WHERE UPI_ID = v_UPI_ID;
                            END IF;

                            SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status, v_LastCode AS DispatchMaster_Code;
                        END IF;
                    END IF;
                ELSE
                    IF p_Code > 0 THEN
                        SELECT Code INTO v_ExistingDispatchDetailCode
                        FROM DispatchDetailMaster
                        WHERE ItemMaster_Code = v_ItemMaster_Code
                          AND DispatchMaster_Code = p_Code
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

                            SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, p_Code AS DispatchMaster_Code;
                        ELSE
                            SELECT Code INTO v_ExistingDispatchDetailCode
                            FROM DispatchDetailMaster
                            WHERE ItemMaster_Code = v_ItemMaster_Code
                              AND DispatchMaster_Code = p_Code
                              AND QtyBox > 0
                            LIMIT 1;

                            IF v_ExistingDispatchDetailCode > 0 THEN
                                INSERT INTO DispatchDetailMaster (
                                    DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                    QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                ) VALUES (
                                    p_Code,
                                    v_ItemMaster_Code, 0, 0,
                                    v_ScanQty, v_ScanQty, v_MRP, 0, '', 0, v_ScanQty
                                );

                                SELECT 'Data Saved Successfully (New Box)' AS Msg, 'Y' AS Status, p_Code AS DispatchMaster_Code;
                            ELSE
                                INSERT INTO DispatchDetailMaster (
                                    DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                    QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                ) VALUES (
                                    p_Code,
                                    v_ItemMaster_Code, 0, 0,
                                    v_ScanQty, v_ScanQty, v_MRP, 0, '', 0, v_ScanQty
                                );

                                SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_Code AS DispatchMaster_Code;
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
                            ChallanNo, ChallanDate, AccountMaster_Code, FinYear, EmployeeMaster_Code,
                            CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code,OrderNo,ClientName,WarehouseMaster_Code
                        ) VALUES (
                            v_ChallanNo + 1, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear,
                            (SELECT Code FROM employeemaster WHERE EmployeeName = p_packedBy LIMIT 1),
                            P_UserMaster_Code, NOW(), 'Y',
                            (SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), 0,p_OrderNo,p_ClientName,p_WarehouseMaster_Code
                        );

                        SET v_LastCode = LAST_INSERT_ID();

                        INSERT INTO DispatchDetailMaster (
                            DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code,
                            DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                        ) VALUES (
                            v_LastCode, v_ItemMaster_Code, 0, 0,
                            v_ScanQty, v_ScanQty, v_MRP, 0, '', 0, v_ScanQty
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

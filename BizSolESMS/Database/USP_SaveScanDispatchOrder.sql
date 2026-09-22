USE `webiz_demo`;
DROP PROCEDURE IF EXISTS `USP_SaveScanDispatchOrder`;

DELIMITER $$
USE `webiz_demo`$$
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveScanDispatchOrder`(
    IN p_Mode VARCHAR(20),
    IN p_Code INT,
    IN p_DispatchMaster_Code INT,
    IN p_ScanNo VARCHAR(200),
    IN p_UserMaster_Code INT,
    IN p_ScanQty INT,
    IN p_ManualQty INT,
    IN p_DispatchQty INT,
    IN p_packedBy VARCHAR(100),
    IN p_BoxNo INT
)
proc_label: BEGIN
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_OrderNo INT DEFAULT 0;
    DECLARE v_AccountMaster_Code INT DEFAULT 0;
    DECLARE v_ChallanNo INT DEFAULT 0;
    DECLARE v_FinYear VARCHAR(10) DEFAULT '';
    DECLARE v_LastCode INT DEFAULT 0;
    DECLARE v_OrderMaster_Code INT DEFAULT 0;
    DECLARE v_OrderDetailMaster_Code INT DEFAULT 0;
    DECLARE v_UPI_ID VARCHAR(25) DEFAULT '';
    DECLARE v_ItemCode VARCHAR(250) DEFAULT '';
    DECLARE v_ScanQty INT DEFAULT 0;
    DECLARE v_Rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_MRP DECIMAL(10,2) DEFAULT 0;
    DECLARE v_DispatchPartQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_OrderPartQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_CompareQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_TotalOrderQty DECIMAL(18,3) DEFAULT 0;
    DECLARE v_TotalDispatchQty DECIMAL(18,3) DEFAULT 0;
    DECLARE v_BrandMaster_Code INT DEFAULT 0;
    DECLARE v_PicklistNo VARCHAR(1) DEFAULT 'N';
    DECLARE v_ScanFormatCheck INT DEFAULT 0;
    DECLARE v_ExistingDispatchDetailCode INT DEFAULT 0;
    DECLARE v_SeparatorCount INT DEFAULT 0;
    DECLARE v_CurrentRate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_Separator VARCHAR(5) DEFAULT '/';
    DECLARE v_ItemCodePos INT DEFAULT 4;
    DECLARE v_MinParts INT DEFAULT 3;
    DECLARE v_WarehouseMaster_Code INT DEFAULT 0;
    DECLARE v_IsPickingEnable VARCHAR(1) DEFAULT 'N';
    DECLARE v_UPIAutoGenerate VARCHAR(1) DEFAULT 'N';
    DECLARE v_IsCheckStock CHAR(1) DEFAULT 'N';
    DECLARE v_BalanceQty DECIMAL(18,4) DEFAULT 0;
    DECLARE v_BarcodeType VARCHAR(100) DEFAULT '';
    DECLARE v_QRType VARCHAR(100) DEFAULT 'OTHER';
    DECLARE v_EmployeeMaster_Code INT DEFAULT 0;
    DECLARE v_ChallanNoPrefix VARCHAR(100) DEFAULT '';
    DECLARE v_ResultMsg VARCHAR(200) DEFAULT '';
    DECLARE v_ResultDispatchMaster_Code INT DEFAULT 0;
    DECLARE v_IsNewDispatchDetail VARCHAR(1) DEFAULT 'N';

    SELECT
        COALESCE(IsPickingEnable, 'N'),
        COALESCE(UPIAutoGenerate, 'N'),
        COALESCE(IsCheckStockForDispatch, 'N')
    INTO
        v_IsPickingEnable,
        v_UPIAutoGenerate,
        v_IsCheckStock
    FROM FixParameter
    LIMIT 1;

    SET v_QRType = COALESCE(UDF_DetectQRType(p_ScanNo), 'OTHER');

    SELECT
        COALESCE(Separators, '/'),
        COALESCE(ItemCodePos, 4),
        COALESCE(MinParts, 3)
    INTO
        v_Separator,
        v_ItemCodePos,
        v_MinParts
    FROM ScanFormatConfig
    WHERE QRType = v_QRType
    LIMIT 1;

    IF v_QRType <> 'OTHER' THEN
        CALL USP_GetItemCodeAndQty(p_ScanNo, @UPI_ID, @ItemCode, @Qty, @Rate);

        SET v_UPI_ID = COALESCE(@UPI_ID, '');
        SET v_ItemCode = COALESCE(@ItemCode, '');
        SET v_ScanQty = COALESCE(@Qty, 0);
        SET v_Rate = COALESCE(@Rate, 0);
        SET v_MRP = 0;

        SELECT
            Code,
            COALESCE(BrandMaster_Code, 0)
        INTO
            v_ItemMaster_Code,
            v_BrandMaster_Code 
        FROM ItemMaster
        WHERE ItemCode = TRIM(v_ItemCode)
        LIMIT 1;
    ELSE
        IF COALESCE(v_Separator, '') = '' THEN SET v_Separator = '/';
        END IF;
        
        SET v_SeparatorCount =
            (LENGTH(COALESCE(p_ScanNo, '')) - LENGTH(REPLACE(COALESCE(p_ScanNo, ''), v_Separator, '')))
            / NULLIF(LENGTH(v_Separator), 0);

        SET v_ScanFormatCheck = CASE
            WHEN v_SeparatorCount >= v_MinParts THEN 1
            ELSE 0
        END;

        IF v_ScanFormatCheck > 0 THEN
            CALL USP_GetItemCodeAndQtyWithoutPickList(p_ScanNo, @ItemCode, @Qty);

            SET v_ItemCode = COALESCE(@ItemCode, '');
            SET v_ScanQty = COALESCE(@Qty, 0);
            SET v_Rate = 0;
            SET v_MRP = 0;

            IF p_DispatchMaster_Code > 0 THEN
                SELECT
                    im.Code,
                    COALESCE(im.BrandMaster_Code, 0),
                    CASE
                        WHEN COALESCE(dd.Rate, 0) > 0 THEN dd.Rate
                        ELSE COALESCE(im.MRPNo, 0)
                    END
                INTO
                    v_ItemMaster_Code,
                    v_BrandMaster_Code,
                    v_MRP
                FROM ItemMaster im
                LEFT JOIN DispatchDetailMaster dd
                    ON dd.ItemMaster_Code = im.Code
                   AND dd.DispatchMaster_Code = p_DispatchMaster_Code
                WHERE im.ItemCode = TRIM(v_ItemCode)
                LIMIT 1;
            ELSE
                SELECT
                    Code,
                    COALESCE(BrandMaster_Code, 0),
                    COALESCE(MRPNo, 0)
                INTO
                    v_ItemMaster_Code,
                    v_BrandMaster_Code,
                    v_MRP
                FROM ItemMaster
                WHERE ItemCode = TRIM(v_ItemCode)
                LIMIT 1;
            END IF;
        ELSEIF v_SeparatorCount = 1 THEN
            SET v_ItemCode = TRIM(SUBSTRING_INDEX(p_ScanNo, v_Separator, 1));
            SET v_ScanQty = CAST(TRIM(SUBSTRING_INDEX(p_ScanNo, v_Separator, -1)) AS UNSIGNED);

            IF v_ScanQty <= 0 THEN
                SET v_ScanQty = 1;
            END IF;

            SELECT
                Code,
                COALESCE(BrandMaster_Code, 0),
                COALESCE(MRPNo, 0)
            INTO
                v_ItemMaster_Code,
                v_BrandMaster_Code,
                v_MRP
            FROM ItemMaster
            WHERE ItemCode = v_ItemCode
            LIMIT 1;

            SET v_Rate = 0;
        ELSE
            SELECT 'INVALID SCAN FORMAT ! PLEASE USE ITEMCODE/1' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;
    END IF;

    IF UPPER(TRIM(COALESCE(p_Mode, ''))) NOT IN ('SCAN', 'PICK') THEN
        LEAVE proc_label;
    END IF;

    IF UPPER(TRIM(COALESCE(p_Mode, ''))) = 'PICK' THEN
        SET p_BoxNo = 0;
    END IF;

    IF v_ItemMaster_Code <= 0 THEN
        SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
        LEAVE proc_label;
    END IF;

    IF v_BrandMaster_Code <= 0 THEN
        SELECT COALESCE(BrandMaster_Code, 0)
        INTO v_BrandMaster_Code
        FROM ItemMaster
        WHERE Code = v_ItemMaster_Code
        LIMIT 1;
    END IF;

    IF v_BrandMaster_Code > 0 THEN
        SELECT
            COALESCE(PicklistNo, 'N'),
            COALESCE(BarcodeType, '')
        INTO
            v_PicklistNo,
            v_BarcodeType
        FROM BrandMaster
        WHERE Code = v_BrandMaster_Code
        LIMIT 1;
    END IF;

    IF v_BarcodeType <> '' AND UPPER(v_BarcodeType) <> 'OTHER' AND UPPER(v_BarcodeType) <> UPPER(v_QRType) THEN
        SELECT 'INVALID BARCODE TYPE !' AS Msg, 'N' AS Status;
        LEAVE proc_label;
    END IF;

    SELECT COALESCE(WarehouseMaster_Code, 0)
    INTO v_WarehouseMaster_Code
    FROM OrderMaster
    WHERE Code = p_Code
    LIMIT 1;

    IF v_UPIAutoGenerate = 'Y' AND UPPER(v_QRType)='UPITATA' THEN
        CALL USP_Validate_UPI_FIFO(v_UPI_ID, v_ItemMaster_Code, v_WarehouseMaster_Code, @Status, @Message, @Upi );

        SET v_UPI_ID = COALESCE(@Upi, v_UPI_ID);

        IF COALESCE(@Status, 'N') = 'N' THEN
            SELECT COALESCE(@Message, 'INVALID UPI !') AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM ItemMaster
        WHERE Code = v_ItemMaster_Code
          AND IsAudit = 'Y'
        LIMIT 1
    ) THEN
        SELECT 'THIS ITEM IN STOCK AUDIT !' AS Msg, 'N' AS Status;
        LEAVE proc_label;
    END IF;

    -- Stock is validated only when IsCheckStockForDispatch = 'Y'.
    -- If the flag is 'N', skip stock check and continue with save.
    IF v_IsCheckStock = 'Y' THEN
        SET v_BalanceQty = IFNULL(UDF_GetItemBalanceQty(v_ItemMaster_Code, v_WarehouseMaster_Code), 0);
        IF v_BalanceQty <= 0 THEN
            SELECT 'This item out of stock.!' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        ELSEIF v_BalanceQty < v_ScanQty THEN
            SELECT 'Please check item stock .!' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;
    END IF;

    SELECT od.Code, om.AccountMaster_Code, om.Code, om.OrderNo, COALESCE(od.OrderQty, 0)
    INTO v_OrderDetailMaster_Code, v_AccountMaster_Code, v_OrderMaster_Code, v_OrderNo, v_OrderPartQty
    FROM vw_OrderDetails om
    INNER JOIN OrderDetailMaster od ON od.OrderMaster_Code = om.Code AND od.ItemMaster_Code = v_ItemMaster_Code
    WHERE om.Code = p_Code
    LIMIT 1;

    IF v_OrderDetailMaster_Code <= 0 THEN
        SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
        LEAVE proc_label;
    END IF;

    SELECT COALESCE(SUM(DispatchQty), 0)
    INTO v_DispatchPartQty
    FROM DispatchDetailMaster
    WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code;

    IF v_DispatchPartQty < v_OrderPartQty THEN
        SET v_CompareQty = v_OrderPartQty + v_ScanQty;
    ELSE
        SET v_CompareQty = v_OrderPartQty;
    END IF;

    IF (v_DispatchPartQty + v_ScanQty) > v_CompareQty THEN
        SELECT 'INVALID SCAN QTY !' AS Msg, 'N' AS Status;
        LEAVE proc_label;
    END IF;
    IF v_PicklistNo = 'Y' AND EXISTS (SELECT 1 FROM Dispatchupiiddetails WHERE UPI_ID = v_UPI_ID LIMIT 1) THEN
        SELECT 'UPI ALREADY SCANNED !' AS Msg, 'N' AS Status;
        LEAVE proc_label;
    END IF;

    IF p_DispatchMaster_Code > 0 THEN
        SET v_ExistingDispatchDetailCode = 0;
        SET v_CurrentRate = 0;

        SELECT Code, COALESCE(Rate, 0)
        INTO v_ExistingDispatchDetailCode, v_CurrentRate
        FROM DispatchDetailMaster
        WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code
        LIMIT 1;

        IF v_ExistingDispatchDetailCode > 0 THEN
            IF v_PicklistNo = 'Y' THEN
                UPDATE DispatchDetailMaster
                SET DispatchQty = COALESCE(DispatchQty, 0) + v_ScanQty,
                    ScanQty = COALESCE(ScanQty, 0) + v_ScanQty
                WHERE Code = v_ExistingDispatchDetailCode;
            ELSE
                UPDATE DispatchDetailMaster
                SET DispatchQty = COALESCE(DispatchQty, 0) + v_ScanQty,
                    ScanQty = COALESCE(ScanQty, 0) + v_ScanQty,
                    QtyBox = COALESCE(QtyBox, 0) + v_ScanQty,
                    Rate = CASE
                        WHEN COALESCE(Rate, 0) = 0 THEN v_MRP
                        ELSE Rate
                    END
                WHERE Code = v_ExistingDispatchDetailCode;
            END IF;

            SET v_ResultMsg = 'Data Updated Successfully';
        ELSE
            INSERT INTO DispatchDetailMaster (
                DispatchMaster_Code,
                ItemMaster_Code,
                OrderNo,
                OrderMaster_Code,
                DispatchQty,
                QtyBox,
                Rate,
                Amount,
                Remarks,
                ManualQty,
                ScanQty
            ) VALUES (
                p_DispatchMaster_Code,
                v_ItemMaster_Code,
                v_OrderNo,
                v_OrderMaster_Code,
                v_ScanQty,
                CASE WHEN v_PicklistNo = 'Y' THEN 0 ELSE v_ScanQty END,
                CASE WHEN v_PicklistNo = 'Y' THEN 0 ELSE v_MRP END,
                0,
                '',
                p_ManualQty,
                v_ScanQty
            );

            SET v_ExistingDispatchDetailCode = LAST_INSERT_ID();
            SET v_IsNewDispatchDetail = 'Y';
            SET v_ResultMsg = 'Data Saved Successfully';
        END IF;

        UPDATE OrderDetailMaster
        SET DispatchQty = COALESCE(DispatchQty, 0) + v_ScanQty
        WHERE Code = v_OrderDetailMaster_Code;

        IF (v_PicklistNo = 'Y' OR v_QRType='UPITATA') THEN
            INSERT INTO Dispatchupiiddetails (
                DispatchMaster_Code,
                DispatchDetailMaster_Code,
                UPI_ID,
                Qty,
                BoxNo,
                Rate
            ) VALUES (
                p_DispatchMaster_Code,
                v_ExistingDispatchDetailCode,
                v_UPI_ID,
                v_ScanQty,
                p_BoxNo,
                v_Rate
            );

            IF v_UPIAutoGenerate = 'Y' AND UPPER(v_QRType)='UPITATA' THEN
                UPDATE mrnupiiddetails SET IsDispatch = 'Y'
                WHERE UPI_ID = v_UPI_ID;
            END IF;
        END IF;

        SET v_ResultDispatchMaster_Code = p_DispatchMaster_Code;
    ELSE
        IF v_MRP = 0 AND v_PicklistNo <> 'Y' THEN
            SELECT COALESCE(MRPNo, 0)
            INTO v_MRP
            FROM ItemMaster
            WHERE Code = v_ItemMaster_Code
            LIMIT 1;
        END IF;

        SET v_FinYear = UDF_GetCurentFinYear(CURRENT_DATE());

        SELECT COALESCE(MAX(CAST(ChallanNo AS UNSIGNED)), 0)
        INTO v_ChallanNo
        FROM DispatchMaster
        WHERE FinYear = v_FinYear;

        SELECT COALESCE(Code, 0)
        INTO v_EmployeeMaster_Code
        FROM EmployeeMaster
        WHERE EmployeeName = p_packedBy
        LIMIT 1;

        SELECT COALESCE(ChallanNo, '')
        INTO v_ChallanNoPrefix
        FROM PrefixConfiguration
        LIMIT 1;

        INSERT INTO DispatchMaster (
            ChallanNo,
            ChallanDate,
            AccountMaster_Code,
            FinYear,
            EmployeeMaster_Code,
            CreatedBy,
            CreatedOn,
            IsActive,
            ChallanNoPrefix,
            OrderMaster_Code,
            IsPicked
        ) VALUES (
            v_ChallanNo + 1,
            CURRENT_DATE(),
            v_AccountMaster_Code,
            v_FinYear,
            v_EmployeeMaster_Code,
            p_UserMaster_Code,
            NOW(),
            'Y',
            v_ChallanNoPrefix,
            p_Code,
            CASE WHEN v_IsPickingEnable = 'Y' THEN 'N' ELSE 'Y' END
        );

        SET v_LastCode = LAST_INSERT_ID();

        INSERT INTO DispatchDetailMaster (
            DispatchMaster_Code,
            ItemMaster_Code,
            OrderNo,
            OrderMaster_Code,
            DispatchQty,
            QtyBox,
            Rate,
            Amount,
            Remarks,
            ManualQty,
            ScanQty
        ) VALUES (
            v_LastCode,
            v_ItemMaster_Code,
            v_OrderNo,
            v_OrderMaster_Code,
            v_ScanQty,
            CASE WHEN v_PicklistNo = 'Y' THEN 0 ELSE v_ScanQty END,
            CASE WHEN v_PicklistNo = 'Y' THEN 0 ELSE v_MRP END,
            0,
            '',
            p_ManualQty,
            v_ScanQty
        );

        SET v_ExistingDispatchDetailCode = LAST_INSERT_ID();

        UPDATE OrderDetailMaster
        SET DispatchQty = COALESCE(DispatchQty, 0) + v_ScanQty
        WHERE Code = v_OrderDetailMaster_Code;

        IF (v_PicklistNo = 'Y' OR v_QRType='UPITATA') THEN
            INSERT INTO Dispatchupiiddetails (
                DispatchMaster_Code,
                DispatchDetailMaster_Code,
                UPI_ID,
                Qty,
                BoxNo,
                Rate
            ) VALUES (
                v_LastCode,
                v_ExistingDispatchDetailCode,
                v_UPI_ID,
                v_ScanQty,
                p_BoxNo,
                v_Rate
            );

            IF v_UPIAutoGenerate = 'Y' AND UPPER(v_QRType)='UPITATA' THEN
                UPDATE mrnupiiddetails
                SET IsDispatch = 'Y'
                WHERE UPI_ID = v_UPI_ID;
            END IF;
        END IF;

        SET v_ResultMsg = 'New Dispatch Order Saved Successfully';
        SET v_ResultDispatchMaster_Code = v_LastCode;
    END IF;

    /* Completion status is checked only once after the successful save/update. */
    SELECT
        COALESCE(SUM(OrderQty), 0),
        COALESCE(SUM(DispatchQty), 0)
    INTO
        v_TotalOrderQty,
        v_TotalDispatchQty
    FROM OrderDetailMaster
    WHERE OrderMaster_Code = v_OrderMaster_Code;

    IF v_TotalOrderQty = v_TotalDispatchQty THEN
        IF v_IsPickingEnable = 'N' THEN
            UPDATE DispatchMaster
            SET Completed = 'Y',
                CompletedDate = NOW()
            WHERE Code = v_ResultDispatchMaster_Code;
        ELSE
            UPDATE DispatchMaster
            SET IsPicked = 'Y'
            WHERE Code = v_ResultDispatchMaster_Code;
        END IF;
    END IF;

    SELECT
        v_ResultMsg AS Msg,
        'Y' AS Status,
        v_ResultDispatchMaster_Code AS DispatchMaster_Code;
END$$

DELIMITER ;

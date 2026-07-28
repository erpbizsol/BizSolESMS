*************************** 1. row ***************************
USP_SaveScanDispatchOrder
ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
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
    IN p_BoxNo INT
)
proc_label: BEGIN

    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_OrderNo INT;
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
    DECLARE v_DispatchPartQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_OrderPartQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_CompareQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_BrandMaster_Code INT DEFAULT 0;
    DECLARE v_PicklistNo VARCHAR(1) DEFAULT 'N';
    DECLARE v_ScanFormatCheck INT DEFAULT 0;
    DECLARE v_ExistingDispatchDetailCode INT DEFAULT 0;
    DECLARE v_BoxPackingQty DECIMAL(10,2) DEFAULT 0;
    DECLARE v_SlashCount INT DEFAULT 0;
    DECLARE v_CurrentRate INT DEFAULT 0;
    DECLARE v_Separator    VARCHAR(5)  DEFAULT '/';
    DECLARE v_ItemCodePos  INT DEFAULT 4;
    DECLARE v_MinParts     INT  DEFAULT 3;
    DECLARE v_warehousemaster_code  INT ;
    SELECT
        COALESCE(Separators,   '/'),
        COALESCE(ItemCodePos,  4),
        COALESCE(MinParts,     3)
    INTO
        v_Separator, v_ItemCodePos, v_MinParts
    FROM ScanFormatConfig
    LIMIT 1;
    
    IF p_Mode = 'SCAN' THEN
		SET v_ScanFormatCheck = (SELECT IF(LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo,v_Separator, '')) >= 3, 1, 0));
        IF v_ScanFormatCheck > 0 THEN
            SELECT Code, BrandMaster_Code INTO v_ItemMaster_Code, v_BrandMaster_Code
            FROM ItemMaster
            WHERE ItemCode = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_ScanNo, v_Separator,v_ItemCodePos), v_Separator, -1))
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
                -- Reject scans without quantity (plain itemcode)
                SELECT 'INVALID SCAN FORMAT ! PLEASE USE ITEMCODE/1' AS Msg, 'N' AS Status;
            END IF;
        END IF;
        IF v_ItemMaster_Code > 0 THEN
			IF((Select UPIAutoGenerate From Fixparameter LIMIT 1)='Y')THEN
				Select warehousemaster_code into v_warehousemaster_code From OrderMaster Where Code = p_Code Limit 1;
				CALL USP_Validate_UPI_FIFO(v_UPI_ID,v_ItemMaster_Code,v_warehousemaster_code,@Status,@Message,@Upi);
                Set v_UPI_ID = @Upi;
				IF(@Status='N')THEN
					SELECT @Message AS Msg, 'N' AS Status;
                    LEAVE proc_label; 
                END IF;
            END IF;
            IF EXISTS(SELECT Code FROM ITEMMASTER WHERE Code = v_ItemMaster_Code AND IsAudit='Y') THEN
                IF v_PicklistNo = 'Y' 
                THEN
                    IF EXISTS(SELECT Code FROM OrderDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_Code LIMIT 1) THEN
                        SELECT om.AccountMaster_Code, om.Code AS OrderMaster_Code, om.OrderNo
                        INTO v_AccountMaster_Code, v_OrderMaster_Code, v_OrderNo
                        FROM OrderMaster om  
                        WHERE om.Code = p_Code;
                        
                        SELECT COALESCE(SUM(DispatchQty), 0) INTO v_DispatchPartQty 
                        FROM DispatchDetailMaster 
                        WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code;
                        
                        SELECT OrderQty INTO v_OrderPartQty 
                        FROM OrderDetailMaster 
                        WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code;
                        
                        IF v_DispatchPartQty < v_OrderPartQty THEN
                            SET v_CompareQty = v_OrderPartQty + v_ScanQty;
                        ELSE
                            SET v_CompareQty = v_OrderPartQty;
                        END IF;
                        
                        IF ((v_DispatchPartQty + v_ScanQty) > v_CompareQty) THEN
                            SELECT 'INVALID SCAN QTY !' AS Msg, 'N' AS Status;
                        ELSE
                            -- Rest of the existing logic for mandatory picklist
                            IF p_DispatchMaster_Code > 0 THEN
                                IF EXISTS (SELECT DispatchMaster_Code FROM Dispatchupiiddetails WHERE UPI_ID = v_UPI_ID) THEN
                                    SELECT 'UPI ALREADY SCANNED !' AS Msg, 'N' AS Status;
                                ELSE
                                    IF EXISTS (SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_Code AND DispatchMaster_Code = p_DispatchMaster_Code) THEN
                                        UPDATE DispatchDetailMaster
                                        SET DispatchQty = DispatchQty + v_ScanQty, 
                                            ScanQty = ScanQty + v_ScanQty
                                        WHERE ItemMaster_Code = v_ItemMaster_Code 
                                        AND OrderMaster_Code = v_OrderMaster_Code 
                                        AND DispatchMaster_Code = p_DispatchMaster_Code;
                                        
                                        UPDATE OrderDetailMaster 
                                        SET DispatchQty = DispatchQty + v_ScanQty
                                        WHERE ItemMaster_Code = v_ItemMaster_Code 
                                        AND OrderMaster_Code = v_OrderMaster_Code;
                                        
                                        INSERT INTO Dispatchupiiddetails(
                                            DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                                        ) VALUES (
                                            p_DispatchMaster_Code, 
                                            (SELECT Code FROM DispatchDetailMaster WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code LIMIT 1), 
                                            v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                                        );
                                        
                                        IF((Select UPIAutoGenerate From Fixparameter LIMIT 1)='Y')THEN
											UPDATE mrnupiiddetails SET IsDispatch='Y' WHERE UPI_ID=v_UPI_ID;
                                        END IF;
                                        
                                        IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code)) THEN
                                            UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = p_DispatchMaster_Code;
                                        END IF;
                                        
                                        SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                    ELSE
                                        INSERT INTO DispatchDetailMaster (
                                            DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                            QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                        ) VALUES (
                                            p_DispatchMaster_Code,
                                            v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
                                            v_ScanQty, 0, 0, 0, '', p_ManualQty, v_ScanQty
                                        );
                                        
                                        UPDATE OrderDetailMaster 
                                        SET DispatchQty = DispatchQty + v_ScanQty
                                        WHERE ItemMaster_Code = v_ItemMaster_Code 
                                        AND OrderMaster_Code = p_Code;
                                        
                                        INSERT INTO Dispatchupiiddetails(
                                            DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                                        ) VALUES (
                                            p_DispatchMaster_Code, 
                                            (SELECT Code FROM DispatchDetailMaster WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code LIMIT 1), 
                                            v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                                        );
                                        
                                        IF((Select UPIAutoGenerate From Fixparameter LIMIT 1)='Y')THEN
											UPDATE mrnupiiddetails SET IsDispatch='Y' WHERE UPI_ID=v_UPI_ID;
                                        END IF;
                                        
                                        IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code)) THEN
                                            UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = p_DispatchMaster_Code;
                                        END IF;
                                        
                                        SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                    END IF;
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
                                        CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code
                                    ) VALUES (
                                        v_ChallanNo + 1, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear, (SELECT Code FROM employeemaster WHERE EmployeeName = p_packedBy LIMIT 1),
                                        p_UserMaster_Code, NOW(), 'Y', 
                                        (SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), p_Code
                                    );
                                    
                                    SET v_LastCode = LAST_INSERT_ID();
                                    
                                    INSERT INTO DispatchDetailMaster (
                                        DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, 
                                        DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                    ) VALUES (
                                        v_LastCode, v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
                                        v_ScanQty, 0, 0, 0, '', p_ManualQty, v_ScanQty
                                    );
                                    
                                    UPDATE OrderDetailMaster 
                                    SET DispatchQty = DispatchQty + v_ScanQty
                                    WHERE ItemMaster_Code = v_ItemMaster_Code 
                                    AND OrderMaster_Code = v_OrderMaster_Code;
                                    
                                    INSERT INTO Dispatchupiiddetails(
                                        DispatchMaster_Code, DispatchDetailMaster_Code, UPI_ID, Qty, BoxNo, Rate
                                    ) VALUES (
                                        v_LastCode, 
                                        (SELECT Code FROM DispatchDetailMaster WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code AND dispatchmaster_Code = v_LastCode LIMIT 1), 
                                        v_UPI_ID, v_ScanQty, p_BoxNo, v_Rate
                                    );
                                    
                                    IF((Select UPIAutoGenerate From Fixparameter LIMIT 1)='Y')THEN
										UPDATE mrnupiiddetails SET IsDispatch='Y' WHERE UPI_ID=v_UPI_ID;
                                    END IF;
                                    
                                    IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = v_OrderMaster_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = v_OrderMaster_Code)) THEN
                                        UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = v_LastCode;
                                    END IF;
                                    
                                    SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status, v_LastCode AS DispatchMaster_Code;
                                END IF;
                            END IF;
                        END IF;
                    ELSE
                        SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
                    END IF;
                ELSE
                    -- Logic for non-mandatory picklist (PicklistNo = 'N')
                    IF EXISTS(SELECT Code FROM OrderDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_Code LIMIT 1) THEN
                        SELECT om.AccountMaster_Code, om.Code AS OrderMaster_Code, om.OrderNo
                        INTO v_AccountMaster_Code, v_OrderMaster_Code, v_OrderNo
                        FROM OrderMaster om  
                        WHERE om.Code = p_Code;
                        
                        SELECT COALESCE(SUM(DispatchQty), 0) INTO v_DispatchPartQty 
                        FROM DispatchDetailMaster 
                        WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code;
                        
                        SELECT OrderQty INTO v_OrderPartQty 
                        FROM OrderDetailMaster 
                        WHERE OrderMaster_Code = p_Code AND ItemMaster_Code = v_ItemMaster_Code;
                        
                        IF v_DispatchPartQty < v_OrderPartQty THEN
                            SET v_CompareQty = v_OrderPartQty + v_ScanQty;
                        ELSE
                            SET v_CompareQty = v_OrderPartQty;
                        END IF;
                        
                        IF ((v_DispatchPartQty + v_ScanQty) > v_CompareQty) THEN
                            SELECT 'INVALID SCAN QTY !' AS Msg, 'N' AS Status;
                        ELSE
                            IF p_DispatchMaster_Code > 0 THEN
                                -- Check if DispatchDetailMaster exists for this item and box combination
                                SELECT Code INTO v_ExistingDispatchDetailCode
                                FROM DispatchDetailMaster 
                                WHERE ItemMaster_Code = v_ItemMaster_Code 
                                AND OrderMaster_Code = p_Code 
                                AND DispatchMaster_Code = p_DispatchMaster_Code
                                LIMIT 1;
                                
								SELECT IFNULL(Rate,0) INTO v_CurrentRate FROM DispatchDetailMaster WHERE Code = v_ExistingDispatchDetailCode;
								IF v_CurrentRate > 0 THEN
								SELECT 'MRP Not Update' AS Msg, 'N' AS Status;
								
								END IF;
                                IF v_ExistingDispatchDetailCode > 0 THEN
                                    -- Update existing row: increment ScanQty and DispatchQty
                                    UPDATE DispatchDetailMaster
                                    SET DispatchQty = DispatchQty + v_ScanQty, 
                                        ScanQty = ScanQty + v_ScanQty,
                                        QtyBox = QtyBox + v_ScanQty,
                                        Rate = CASE WHEN IFNULL(Rate,0) = 0 THEN v_MRP ELSE Rate END
                                    WHERE Code = v_ExistingDispatchDetailCode;
                                    
                                    UPDATE OrderDetailMaster 
                                    SET DispatchQty = DispatchQty + v_ScanQty
                                    WHERE ItemMaster_Code = v_ItemMaster_Code 
                                    AND OrderMaster_Code = v_OrderMaster_Code;
                                    
                                    IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code)) THEN
                                        UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = p_DispatchMaster_Code;
                                    END IF;
                                    
                                    SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                ELSE
                                    SELECT Code INTO v_ExistingDispatchDetailCode
                                    FROM DispatchDetailMaster 
                                    WHERE ItemMaster_Code = v_ItemMaster_Code 
                                    AND OrderMaster_Code = p_Code 
                                    AND DispatchMaster_Code = p_DispatchMaster_Code
                                    AND QtyBox > 0
                                    LIMIT 1;
                                    
                                    IF v_ExistingDispatchDetailCode > 0 THEN
                                        -- Item exists in different box, create new row for new box
                                        INSERT INTO DispatchDetailMaster (
                                            DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                            QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                        ) VALUES (
                                            p_DispatchMaster_Code,
                                            v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
                                            v_ScanQty, v_ScanQty, v_MRP, 0, '', p_ManualQty, v_ScanQty
                                        );
                                        
                                        -- Update total DispatchQty in OrderDetailMaster
                                        UPDATE OrderDetailMaster 
                                        SET DispatchQty = DispatchQty + v_ScanQty
                                        WHERE ItemMaster_Code = v_ItemMaster_Code 
                                        AND OrderMaster_Code = p_Code;
                                        
                                        IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code)) THEN
                                            UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = p_DispatchMaster_Code;
                                        END IF;
                                        
                                        SELECT 'Data Saved Successfully (New Box)' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                    ELSE
                                        -- First time scanning this item, create new row
                                        INSERT INTO DispatchDetailMaster (
                                            DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
                                            QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                        ) VALUES (
                                            p_DispatchMaster_Code,
                                            v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
                                            v_ScanQty, v_ScanQty, v_MRP, 0, '', p_ManualQty, v_ScanQty
                                        );
                                        
                                        UPDATE OrderDetailMaster 
                                        SET DispatchQty = DispatchQty + v_ScanQty
                                        WHERE ItemMaster_Code = v_ItemMaster_Code 
                                        AND OrderMaster_Code = p_Code;
                                        
                                        IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = p_Code)) THEN
                                            UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = p_DispatchMaster_Code;
                                        END IF;
                                        
                                        SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                    END IF;
                                END IF;
                            ELSE
                             
                                -- Create new DispatchMaster for non-mandatory picklist
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
                                    CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code
                                ) VALUES (
                                    v_ChallanNo + 1, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear, (SELECT Code FROM employeemaster WHERE EmployeeName = p_packedBy LIMIT 1),
                                    p_UserMaster_Code, NOW(), 'Y', 
                                    (SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), p_Code
                                );
                                
                                SET v_LastCode = LAST_INSERT_ID();
                                
                                INSERT INTO DispatchDetailMaster (
                                    DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, 
                                    DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
                                ) VALUES (
                                    v_LastCode, v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
                                    v_ScanQty, v_ScanQty, v_MRP, 0, '', p_ManualQty, v_ScanQty
                                );
                                
                                UPDATE OrderDetailMaster 
                                SET DispatchQty = DispatchQty + v_ScanQty
                                WHERE ItemMaster_Code = v_ItemMaster_Code 
                                AND OrderMaster_Code = v_OrderMaster_Code;
                                
                                IF((SELECT SUM(OrderQty) FROM orderdetailmaster WHERE OrderMaster_Code = v_OrderMaster_Code) = (SELECT SUM(dispatchqty) FROM orderdetailmaster WHERE OrderMaster_Code = v_OrderMaster_Code)) THEN
                                    UPDATE DispatchMaster SET Completed='Y', CompletedDate = NOW() WHERE Code = v_LastCode;
                                END IF;
                                
                                SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status, v_LastCode AS DispatchMaster_Code;
                            END IF;
                        END IF;
                    ELSE
                        SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
                    END IF;
                END IF;
            ELSE
                SELECT 'THIS ITEM IN STOCK AUDIT !' AS Msg, 'N' AS Status;
            END IF;
        ELSE
            SELECT 'INVALID ITEM SCAN !' AS Msg, 'N' AS Status;
        END IF;
    END IF;
END
utf8mb4
utf8mb4_0900_ai_ci
utf8mb4_0900_ai_ci

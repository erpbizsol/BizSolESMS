USE `webiz_demo`;
DROP PROCEDURE IF EXISTS `USP_AddItemForSacnToBill`;

DELIMITER $$
USE `webiz_demo`$$
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_AddItemForSacnToBill`(
    IN p_Mode VARCHAR(20),
    IN p_DispatchMaster_Code INT,
    IN p_ItemMaster_Code INT,
    IN p_BoxNo INT,
    IN p_ManualQty INT, 
    IN p_Mrp INT,
    IN p_OrderNo VARCHAR(200),
    IN p_UserMaster_Code INT,
    IN p_packedBy VARCHAR(100),
    IN p_ClientName VARCHAR(500),
    IN p_ItemCode VARCHAR(500),
    IN p_WarehouseMaster_Code INT,
    IN p_IsManual CHAR(1)
)
proc_label: BEGIN
    DECLARE v_AccountMaster_Code INT DEFAULT 0;
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_FinYear VARCHAR(20) DEFAULT '';
    DECLARE v_ChallanNo INT DEFAULT 0;
    DECLARE v_LastCode INT DEFAULT 0;
    DECLARE v_DispatchDetailMaster_Code INT DEFAULT 0;
    DECLARE v_DispatchMaster_Code INT DEFAULT 0;
	DECLARE v_rowCount INT DEFAULT 0;
    DECLARE v_IsCheckStock CHAR(1) DEFAULT 'N';
    DECLARE v_BalanceQty DECIMAL(18,4) DEFAULT 0;
    DECLARE v_warehousemaster_code INT DEFAULT 0;
    
    IF p_Mode = 'AddItem' THEN
			 IF NOT EXISTS(SELECT Code FROM DispatchMaster WHERE OrderNo = p_OrderNo AND p_DispatchMaster_Code=0) 
			 THEN
					IF EXISTS( SELECT Code FROM ItemMaster WHERE Code = p_ItemMaster_Code AND IFNULL(IsAudit,'Y') = 'N') THEN
						SELECT 'THIS ITEM IN STOCK AUDIT !' AS Msg, 'N' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
					ELSE
                        SET v_warehousemaster_code = p_WarehouseMaster_Code;
                        SELECT COALESCE(IsCheckStockForDispatch, 'N') INTO v_IsCheckStock
                        FROM FixParameter
                        LIMIT 1;

                        IF v_IsCheckStock = 'Y' THEN
                            SET v_BalanceQty = IFNULL(UDF_GetItemBalanceQty(p_ItemMaster_Code, v_warehousemaster_code), 0);
                            IF v_BalanceQty <= 0 THEN
                                SELECT 'This item out of stock.!' AS Msg, 'N' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                LEAVE proc_label;
                            ELSEIF v_BalanceQty < p_ManualQty THEN
                                SELECT 'Please check item stock .!' AS Msg, 'N' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                                LEAVE proc_label;
                            END IF;
                        END IF;

						IF p_DispatchMaster_Code > 0 THEN
							IF EXISTS(SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = p_ItemMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code) THEN
								SELECT 'This item already exists !' AS Msg, 'N' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
							ELSE
								INSERT INTO DispatchDetailMaster
								(
									DispatchMaster_Code,ItemMaster_Code,OrderNo,OrderMaster_Code,
									DispatchQty,QtyBox,Rate,Amount,Remarks,ManualQty
								)
								VALUES
								(
									p_DispatchMaster_Code,p_ItemMaster_Code,0,0,
									p_ManualQty,0,p_Mrp,(p_ManualQty * p_Mrp),'',p_ManualQty
								);

								SET v_DispatchDetailMaster_Code = LAST_INSERT_ID();

								INSERT INTO Dispatchupiiddetails
								(
									DispatchMaster_Code,DispatchDetailMaster_Code,UPI_ID,Qty,BoxNo,Rate
								)
								SELECT
									p_DispatchMaster_Code,
									v_DispatchDetailMaster_Code,
									CONCAT('Manual-', IFNULL(MAX(CAST(SUBSTRING(UPI_ID,8) AS UNSIGNED)),0) + 1),
									p_ManualQty,
									p_BoxNo,
									p_Mrp
								FROM Dispatchupiiddetails
								WHERE UPI_ID LIKE 'Manual-%';

								SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
							END IF;
						ELSE
							SELECT UDF_GetCurentFinYear(CURRENT_DATE()) INTO v_FinYear;

							SELECT COALESCE(MAX(ChallanNo),0) INTO v_ChallanNo FROM DispatchMaster
							WHERE FinYear = v_FinYear;
							IF p_IsManual = 'N' THEN
								SELECT IFNULL(Code,0) INTO v_AccountMaster_Code FROM AccountMaster
								WHERE AccountName = p_ClientName  LIMIT 1;
								SET p_ClientName = '';
							ELSE
								IF EXISTS(Select Code From AccountMaster Where AccountName=p_ClientName LIMIT 1) 
								THEN
									Select Code INTO v_AccountMaster_Code From AccountMaster Where AccountName=p_ClientName;
								ELSE
									INSERT INTO AccountMaster 
									(AccountName,DisplayName,PANNo,IsMSME,IsVendor,IsClient,CreatedBy,CreatedOn,IsActive,AccountCode,DataImported,ClientType,CreditDays)
									VALUES (p_ClientName,p_ClientName,'','N','N','Y',p_UserMaster_Code,NOW(),'Y','','Y','',0);
									
									Select Code INTO v_AccountMaster_Code From AccountMaster Where AccountName=p_ClientName;
								END IF;
							END IF;

							INSERT INTO DispatchMaster
							(
								ChallanNo,ChallanDate,AccountMaster_Code,FinYear,EmployeeMaster_Code,
								CreatedBy,CreatedOn,IsActive,ChallanNoPrefix,OrderMaster_Code,
								OrderNo,ClientName,WarehouseMaster_Code
							)
							VALUES
							(
								v_ChallanNo + 1,CURRENT_DATE(),v_AccountMaster_Code,v_FinYear,
								(SELECT Code FROM EmployeeMaster WHERE EmployeeName = p_packedBy LIMIT 1),
								p_UserMaster_Code,NOW(),'Y',
								(SELECT ChallanNo FROM PrefixConfiguration LIMIT 1),
								0,p_OrderNo,p_ClientName,p_WarehouseMaster_Code
							);

							SET v_LastCode = LAST_INSERT_ID();

							INSERT INTO DispatchDetailMaster
							(
								DispatchMaster_Code,ItemMaster_Code,OrderNo,OrderMaster_Code,
								DispatchQty,QtyBox,Rate,Amount,Remarks,ManualQty
							)
							VALUES
							(
								v_LastCode,p_ItemMaster_Code,0,0,
								p_ManualQty,0,p_Mrp,(p_ManualQty * p_Mrp),'',p_ManualQty
							);

							SET v_DispatchDetailMaster_Code = LAST_INSERT_ID();

							INSERT INTO Dispatchupiiddetails
							(
								DispatchMaster_Code,DispatchDetailMaster_Code,UPI_ID,Qty,BoxNo,Rate
							)
							SELECT
								v_LastCode,
								v_DispatchDetailMaster_Code,
								CONCAT('Manual-', IFNULL(MAX(CAST(SUBSTRING(UPI_ID,8) AS UNSIGNED)),0) + 1),
								p_ManualQty,
								p_BoxNo,
								p_Mrp 
							FROM Dispatchupiiddetails
							WHERE UPI_ID LIKE 'Manual-%';
							SELECT 'New Dispatch Saved Successfully' AS Msg, 'Y' AS Status, v_LastCode AS DispatchMaster_Code;
						END IF;
					END IF;
				 ELSE
					SELECT 'This order no already exists.' AS Msg, 'Y' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
			    END IF;
	ELSEIF p_Mode = 'UPDATE' THEN
		SELECT Code INTO v_ItemMaster_Code From ItemMaster Where ItemCode=p_ItemCode LIMIT 1;

        SET v_warehousemaster_code = p_WarehouseMaster_Code;
        IF IFNULL(v_warehousemaster_code, 0) = 0 AND IFNULL(p_DispatchMaster_Code, 0) > 0 THEN
            SELECT WarehouseMaster_Code INTO v_warehousemaster_code
            FROM DispatchMaster
            WHERE Code = p_DispatchMaster_Code
            LIMIT 1;
        END IF;

        SELECT COALESCE(IsCheckStockForDispatch, 'N') INTO v_IsCheckStock
        FROM FixParameter
        LIMIT 1;

        IF v_IsCheckStock = 'Y' THEN
            SET v_BalanceQty = IFNULL(UDF_GetItemBalanceQty(v_ItemMaster_Code, v_warehousemaster_code), 0);
            IF v_BalanceQty <= 0 THEN
                SELECT 'This item out of stock.!' AS Msg, 'N' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                LEAVE proc_label;
            ELSEIF v_BalanceQty < p_ManualQty THEN
                SELECT 'Please check item stock .!' AS Msg, 'N' AS Status, p_DispatchMaster_Code AS DispatchMaster_Code;
                LEAVE proc_label;
            END IF;
        END IF;

		IF EXISTS (SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code  AND DispatchMaster_Code = p_DispatchMaster_Code) THEN
				UPDATE DispatchDetailMaster
				SET DispatchQty = (ScanQty + ManualQty + p_ManualQty), ManualQty = (ManualQty+ p_ManualQty)
				WHERE ItemMaster_Code = v_ItemMaster_Code  AND DispatchMaster_Code = p_DispatchMaster_Code;
				
				INSERT INTO Dispatchupiiddetails (DispatchMaster_Code,DispatchDetailMaster_Code,UPI_ID,Qty,BoxNo,Rate)
				SELECT p_DispatchMaster_Code,
						(SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code LIMIT 1),
						CONCAT('Manual-', IFNULL(max_no, 0) + 1),p_ManualQty,p_BoxNo,p_MRP
					FROM (SELECT MAX(CAST(SUBSTRING(UPI_ID, 8) AS UNSIGNED)) AS max_no
						FROM Dispatchupiiddetails WHERE UPI_ID LIKE 'Manual-%'
					) AS sub;
				SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status,p_DispatchMaster_Code As DispatchMaster_Code;
		ELSE
			SELECT 'Invalid item please check.' AS Msg, 'Y' AS Status,p_DispatchMaster_Code As DispatchMaster_Code;
        END IF;
	ELSEIF p_Mode = 'Delete' THEN
		SELECT DispatchMaster_Code INTO v_DispatchMaster_Code
		FROM DispatchDetailMaster WHERE Code = p_DispatchMaster_Code GROUP BY DispatchMaster_Code;
        SELECT Count(Code) INTO v_rowCount
		FROM DispatchDetailMaster WHERE DispatchMaster_Code = v_DispatchMaster_Code GROUP BY DispatchMaster_Code;
		DELETE FROM Dispatchupiiddetails WHERE  DispatchDetailMaster_Code=p_DispatchMaster_Code;
		DELETE FROM DispatchDetailMaster WHERE  Code=p_DispatchMaster_Code;
		SELECT 'Data deleted successfully.' AS Msg, 'Y' AS Status;
    END IF;
END$$

DELIMITER ;

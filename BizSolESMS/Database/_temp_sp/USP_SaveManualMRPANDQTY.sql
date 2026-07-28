*************************** 1. row ***************************
USP_SaveManualMRPANDQTY
ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveManualMRPANDQTY`(
    IN p_DispatchMaster_Code INT,
    IN P_UserMaster_Code INT,
    IN p_ManualQty INT,
    IN p_ItemCode VARCHAR(100),
    IN p_OrderMaster_Code INT,
    IN p_BoxNo INT ,
    IN p_MRP INT  
)
BEGIN
	DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_OrderNo INT;
    DECLARE v_DispatchMaster_Code INT;
    DECLARE v_AccountMaster_Code INT DEFAULT 0;
    DECLARE v_ChallanNo INT DEFAULT 0;
    DECLARE v_FinYear VARCHAR(10) DEFAULT '';
    DECLARE v_LastCode INT;
    DECLARE v_OrderMaster_Code INT DEFAULT 0;
    DECLARE v_DispatchPartQty DECIMAL(10,2) DEFAULT 0;
	DECLARE v_OrderPartQty DECIMAL(10,2) DEFAULT 0;
	DECLARE v_CompareQty DECIMAL(10,2) DEFAULT 0;
	DECLARE v_ManualPartQty INT DEFAULT 0;
    
	SELECT om.AccountMaster_Code, om.Code AS OrderMaster_Code, om.OrderNo, odm.ItemMaster_Code
    INTO v_AccountMaster_Code, v_OrderMaster_Code, v_OrderNo, v_ItemMaster_Code
    FROM OrderMaster om
    INNER JOIN OrderDetailMaster odm ON om.Code = odm.OrderMaster_Code
    WHERE odm.OrderMaster_Code = p_OrderMaster_Code And itemmaster_Code=(Select Code From itemmaster Where ItemCode=trim(p_ItemCode));

	IF EXISTS(SELECT Code FROM ITEMMASTER WHERE Code = v_ItemMaster_Code And IsAudit='Y')
	THEN
		-- SELECT IFNULL((SELECT d.Qty FROM Dispatchupiiddetails d WHERE d.DispatchDetailMaster_Code = (
		-- SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code And ItemMaster_Code<>(Select Code From ItemMaster Where ItemCode='20K710S' LIMIT 1) order by Code DESC LIMIT 1)AND d.UPI_ID NOT LIKE '%Manual%' LIMIT 1), p_ManualQty) INTO v_ManualPartQty;

		-- IF(v_ManualPartQty=p_ManualQty)
        -- THEN
			SELECT COALESCE(SUM(DispatchQty), 0) INTO v_DispatchPartQty FROM DispatchDetailMaster WHERE OrderMaster_Code = v_OrderMaster_Code AND ItemMaster_Code = v_ItemMaster_Code;
			SELECT (OrderQty - COALESCE(CancelQty, 0))  INTO v_OrderPartQty FROM OrderDetailMaster WHERE OrderMaster_Code = v_OrderMaster_Code AND ItemMaster_Code = v_ItemMaster_Code;
			IF v_DispatchPartQty < v_OrderPartQty THEN
				SET v_CompareQty = v_OrderPartQty + p_ManualQty;
			ELSE
				SET v_CompareQty = v_OrderPartQty;
			END IF;
			
			IF ((v_DispatchPartQty + p_ManualQty) > v_CompareQty) THEN
				SELECT 'INVALID SCAN QTY !' AS Msg, 'N' AS Status,p_DispatchMaster_Code As DispatchMaster_Code;
			ELSE
				IF p_DispatchMaster_Code > 0 THEN 
					IF EXISTS (SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code) THEN
						UPDATE DispatchDetailMaster
						SET DispatchQty = (ScanQty + ManualQty + p_ManualQty), ManualQty = (ManualQty+ p_ManualQty)
						WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code;
						
						UPDATE OrderDetailMaster  
						SET DispatchQty = (Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_OrderMaster_Code And DispatchMaster_Code=p_DispatchMaster_Code)
						WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code;
						
						INSERT INTO Dispatchupiiddetails (DispatchMaster_Code,DispatchDetailMaster_Code,UPI_ID,Qty,BoxNo,Rate)
						SELECT p_DispatchMaster_Code,
								(SELECT Code FROM DispatchDetailMaster WHERE OrderMaster_Code = p_OrderMaster_Code AND ItemMaster_Code = v_ItemMaster_Code
								AND DispatchMaster_Code = p_DispatchMaster_Code LIMIT 1),
								CONCAT('Manual-', IFNULL(max_no, 0) + 1),p_ManualQty,p_BoxNo,p_MRP
							FROM (SELECT MAX(CAST(SUBSTRING(UPI_ID, 8) AS UNSIGNED)) AS max_no
								FROM Dispatchupiiddetails WHERE UPI_ID LIKE 'Manual-%'
							) AS sub;

						IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=p_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=p_OrderMaster_Code))
						THEN
							UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=p_DispatchMaster_Code;
						END IF;
						SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status,p_DispatchMaster_Code As DispatchMaster_Code;
				ELSE
						INSERT INTO DispatchDetailMaster (DispatchMaster_Code, 
							ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
							QtyBox, Rate, Amount, Remarks, ManualQty
						) VALUES (
							p_DispatchMaster_Code,
							v_ItemMaster_Code, v_OrderNo, p_OrderMaster_Code, 
							p_ManualQty, 0, 0, 0, '', p_ManualQty
						);

						UPDATE OrderDetailMaster 
						SET DispatchQty =(Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_OrderMaster_Code And DispatchMaster_Code=p_DispatchMaster_Code)
						WHERE ItemMaster_Code = v_ItemMaster_Code 
						AND OrderMaster_Code = p_OrderMaster_Code;
						
						INSERT INTO Dispatchupiiddetails (DispatchMaster_Code,DispatchDetailMaster_Code,UPI_ID,Qty,BoxNo,Rate)
						SELECT p_DispatchMaster_Code,
								(SELECT Code FROM DispatchDetailMaster WHERE OrderMaster_Code = p_OrderMaster_Code AND ItemMaster_Code = v_ItemMaster_Code
								AND DispatchMaster_Code = p_DispatchMaster_Code LIMIT 1),
								CONCAT('Manual-', IFNULL(max_no, 0) + 1),p_ManualQty,p_BoxNo,p_MRP
							FROM (SELECT MAX(CAST(SUBSTRING(UPI_ID, 8) AS UNSIGNED)) AS max_no
								FROM Dispatchupiiddetails WHERE UPI_ID LIKE 'Manual-%'
							) AS sub;
						
					IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=p_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=p_OrderMaster_Code))
					THEN
						UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=p_DispatchMaster_Code;
					END IF;
						SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status,p_DispatchMaster_Code As DispatchMaster_Code;
					END IF;
			ELSE
				SELECT UDF_GetCurentFinYear(CURRENT_DATE()) INTO v_FinYear;
				SELECT COALESCE(MAX(ChallanNo), 0) INTO v_ChallanNo 
				FROM DispatchMaster 
				WHERE FinYear = v_FinYear;
			 
				INSERT INTO DispatchMaster (
					ChallanNo, ChallanDate, AccountMaster_Code, FinYear,
					CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code
				) VALUES (
					v_ChallanNo + 1, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear,p_UserMaster_Code 
					,NOW(), 'Y', COALESCE((SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), ''), p_OrderMaster_Code
				);

				SET v_LastCode = LAST_INSERT_ID();

				INSERT INTO DispatchDetailMaster (
					DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, 
					DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty
				) VALUES (
					v_LastCode, v_ItemMaster_Code, v_OrderNo, p_OrderMaster_Code, 
					p_ManualQty, 0, 0, 0, '', p_ManualQty
				);

				UPDATE OrderDetailMaster 
				SET DispatchQty = (Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = p_OrderMaster_Code And DispatchMaster_Code=v_LastCode)
				WHERE ItemMaster_Code = v_ItemMaster_Code 
				AND OrderMaster_Code = p_OrderMaster_Code;
				
			INSERT INTO Dispatchupiiddetails (DispatchMaster_Code,DispatchDetailMaster_Code,UPI_ID,Qty,BoxNo,Rate)
					SELECT v_LastCode,
								(SELECT Code FROM DispatchDetailMaster WHERE OrderMaster_Code = p_OrderMaster_Code AND ItemMaster_Code = v_ItemMaster_Code
								AND DispatchMaster_Code = v_LastCode LIMIT 1),
								CONCAT('Manual-', IFNULL(max_no, 0) + 1),p_ManualQty,p_BoxNo,p_MRP
							FROM (SELECT MAX(CAST(SUBSTRING(UPI_ID, 8) AS UNSIGNED)) AS max_no
								FROM Dispatchupiiddetails WHERE UPI_ID LIKE 'Manual-%'
							) AS sub;
				
				IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=p_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=p_OrderMaster_Code))
				THEN
					UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=v_LastCode;
				END IF;
					SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status,v_LastCode As DispatchMaster_Code;
				END IF;
			END IF;
		-- ELSE
			-- SELECT CONCAT('PLEASE ENTER ', v_ManualPartQty, ' QTY !') AS Msg, 'N' AS Status, p_DispatchMaster_Code As DispatchMaster_Code;
		-- END IF;	
	ELSE
		SELECT 'THIS ITEM IN STOCK AUDIT !' AS Msg, 'N' AS Status, p_DispatchMaster_Code As DispatchMaster_Code;
	END IF;
END
utf8mb4
utf8mb4_0900_ai_ci
utf8mb4_0900_ai_ci

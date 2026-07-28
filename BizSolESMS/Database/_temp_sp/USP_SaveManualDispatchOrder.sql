*************************** 1. row ***************************
USP_SaveManualDispatchOrder
ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_SaveManualDispatchOrder`(
    IN p_Mode VARCHAR(20),
    IN p_Code INT,
    IN p_DispatchMaster_Code INT,
    IN p_ScanNo VARCHAR(200),
    IN P_UserMaster_Code INT,
    IN p_ScanQty INT,
    IN p_ManualQty INT,
    IN p_DispatchQty INT,
    IN p_packedBy Varchar(100)
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
    
    SELECT om.AccountMaster_Code, om.Code AS OrderMaster_Code, om.OrderNo, odm.ItemMaster_Code
    INTO v_AccountMaster_Code, v_OrderMaster_Code, v_OrderNo, v_ItemMaster_Code
    FROM OrderMaster om
    INNER JOIN OrderDetailMaster odm ON om.Code = odm.OrderMaster_Code
    WHERE odm.Code = p_Code;

	IF EXISTS(SELECT Code FROM ITEMMASTER WHERE Code = v_ItemMaster_Code And IsAudit='Y')
	THEN
		IF p_Mode = 'NEW' THEN
			IF p_DispatchMaster_Code > 0 THEN 
				IF EXISTS (SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code) THEN
					UPDATE DispatchDetailMaster
					SET DispatchQty = ScanQty + p_ManualQty, ManualQty = p_ManualQty
					WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code;
					
					UPDATE OrderDetailMaster 
					SET DispatchQty = (Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code And DispatchMaster_Code=p_DispatchMaster_Code)
					WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code;
					
					IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code))
					THEN
						UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=p_DispatchMaster_Code;
					END IF;
					SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status,p_DispatchMaster_Code As DispatchMaster_Code;
				ELSE
					INSERT INTO DispatchDetailMaster (DispatchMaster_Code, 
						ItemMaster_Code, OrderNo, OrderMaster_Code, DispatchQty,
						QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
					) VALUES (
						p_DispatchMaster_Code,
						v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
						p_DispatchQty, 0, 0, 0, '', p_ManualQty, p_ScanQty
					);

					UPDATE OrderDetailMaster 
					SET DispatchQty =(Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code And DispatchMaster_Code=p_DispatchMaster_Code)
					WHERE ItemMaster_Code = v_ItemMaster_Code 
					AND OrderMaster_Code = v_OrderMaster_Code;
					
				IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code))
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
					ChallanNo, ChallanDate, AccountMaster_Code, FinYear,EmployeeMaster_Code,
					CreatedBy, CreatedOn, IsActive, ChallanNoPrefix, OrderMaster_Code
				) VALUES (
					v_ChallanNo + 1, CURRENT_DATE(), v_AccountMaster_Code, v_FinYear,(select Code from UserMaster Where UserName=p_packedBy),p_UserMaster_Code 
					,NOW(), 'Y', COALESCE((SELECT ChallanNo FROM PrefixConfiguration LIMIT 1), ''), v_OrderMaster_Code
				);

				SET v_LastCode = LAST_INSERT_ID();

				INSERT INTO DispatchDetailMaster (
					DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, 
					DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
				) VALUES (
					v_LastCode, v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
					p_DispatchQty, 0, 0, 0, '', p_ManualQty, p_ScanQty
				);

				UPDATE OrderDetailMaster 
				SET DispatchQty = (Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code And DispatchMaster_Code=v_LastCode)
				WHERE ItemMaster_Code = v_ItemMaster_Code 
				AND OrderMaster_Code = v_OrderMaster_Code;
				IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code))
				THEN
					UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=v_LastCode;
				END IF;
				SELECT 'New Dispatch Order Saved Successfully' AS Msg, 'Y' AS Status,v_LastCode As DispatchMaster_Code;
			END IF;
		ELSEIF p_Mode = 'EDIT' THEN
			IF EXISTS (SELECT Code FROM DispatchDetailMaster WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code) THEN
				UPDATE DispatchDetailMaster
				SET DispatchQty = ScanQty + p_ManualQty, ManualQty = p_ManualQty
				WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code;
				
				UPDATE OrderDetailMaster 
				SET DispatchQty = (Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code)
				WHERE ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code;
				
				IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code))
				THEN
					UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=p_DispatchMaster_Code;
				END IF;
				SELECT 'Data Updated Successfully' AS Msg, 'Y' AS Status;
			ELSE
				INSERT INTO DispatchDetailMaster (
					DispatchMaster_Code, ItemMaster_Code, OrderNo, OrderMaster_Code, 
					DispatchQty, QtyBox, Rate, Amount, Remarks, ManualQty, ScanQty
				) VALUES (
					p_DispatchMaster_Code, v_ItemMaster_Code, v_OrderNo, v_OrderMaster_Code, 
					p_DispatchQty, 0, 0, 0, '', p_ManualQty, p_ScanQty
				);

				UPDATE OrderDetailMaster 
				SET DispatchQty = (Select (Sum(ManualQty) + sum(ScanQty)) As DispatchQty From DispatchDetailMaster Where ItemMaster_Code = v_ItemMaster_Code AND OrderMaster_Code = v_OrderMaster_Code AND DispatchMaster_Code = p_DispatchMaster_Code)
				WHERE ItemMaster_Code = v_ItemMaster_Code 
				AND OrderDetailMaster.Code = p_Code;
				
				IF((Select sum(OrderQty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code)=(Select Sum(dispatchqty) From orderdetailmaster Where OrderMaster_Code=v_OrderMaster_Code))
				THEN
					UPDATE DispatchMaster SET Completed='Y',CompletedDate=Now() WHERE Code=p_DispatchMaster_Code;
				END IF;
				SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status;
			END IF;
		END IF;
	ELSE
		SELECT 'THIS ITEM IN STOCK AUDIT !' AS Msg, 'N' AS Status;
	END IF;
END
utf8mb4
utf8mb4_0900_ai_ci
utf8mb4_0900_ai_ci

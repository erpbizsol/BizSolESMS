*************************** 1. row ***************************
USP_UpdateBoxNo
ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_UpdateBoxNo`(
   IN p_Mode VARCHAR(100),
   IN p_Code INT,
   IN p_ScanNo VARCHAR(200),
   IN p_BoxNo INT
)
BEGIN  
    DECLARE v_UPI_ID VARCHAR(25) DEFAULT '';
    DECLARE v_ItemCode VARCHAR(25) DEFAULT '';
    DECLARE v_ScanQty INT DEFAULT 0;
    DECLARE v_Rate INT DEFAULT 0;
    DECLARE v_UPIQTY INT DEFAULT 0;
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_OrderMaster_Code INT DEFAULT 0;
    DECLARE v_DispatchMaster INT DEFAULT 0;

	IF p_Mode = 'SCAN' THEN
		IF ((LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo, '/', ''))) < 3) THEN
            SELECT 'INVALID SCAN NO !' AS Msg, 'N' AS Status;
        ELSE
            CALL USP_GetItemCodeAndQty(p_ScanNo, @UPI_ID, @ItemCode, @Qty, @Rate);
            SET v_UPI_ID = @UPI_ID;
            SET v_ItemCode = @ItemCode;
            SET v_ScanQty = @Qty;
            SET v_Rate = @Rate;
            IF EXISTS (Select UPI_ID From  dispatchupiiddetails
				INNER JOIN dispatchmaster On dispatchmaster.code=dispatchupiiddetails.DispatchMaster_Code 
				WHERE UPI_ID = v_UPI_ID And  dispatchmaster.Code=p_Code LIMIT 1 
            ) THEN
                UPDATE dispatchupiiddetails SET BoxNo=p_BoxNo WHERE UPI_ID = v_UPI_ID ;
                SELECT 'box updated successfully' AS Msg, 'Y' AS Status;
			ELSE
				SELECT 'Invalid item scan !' AS Msg, 'N' AS Status;  
            END IF;
       END IF;
	ELSEIF( p_Mode = 'DELETE')THEN
			SELECT ItemMaster_Code, OrderMaster_Code, DispatchQty 
			INTO v_ItemMaster_Code,v_OrderMaster_Code,v_UPIQTY
			FROM DispatchDetailMaster 
			WHERE Code = p_Code;
            
			UPDATE DispatchDetailMaster SET ScanQty=0,ManualQty=0,DispatchQty=0
			WHERE Code = p_Code;
            
			UPDATE OrderDetailMaster 
			SET DispatchQty = DispatchQty - v_UPIQTY 
			WHERE OrderMaster_Code = v_OrderMaster_Code 
			AND ItemMaster_Code = v_ItemMaster_Code;
			
			DELETE FROM Dispatchupiiddetails 
			WHERE DispatchDetailMaster_Code = p_Code;
			
			SELECT 'Qty updated successfully.' AS Msg, 'Y' AS Status;
    ELSE
		UPDATE Dispatchupiiddetails SET BoxNo=p_BoxNo WHERE Code=p_Code;
		SELECT 'Box no updated successfully.' AS Msg,'Y' AS Status;
    END IF; 
END
utf8mb4
utf8mb4_0900_ai_ci
utf8mb4_0900_ai_ci

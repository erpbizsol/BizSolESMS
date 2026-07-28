-- ============================================================
-- USP_UpdateBoxNo - Packing: cursor updates BoxNo only
-- Used when IsPickingEnable='Y' (Packing tab) and legacy Edit Box No.
-- Does not create duplicate rows; does not change Qty.
-- ============================================================

DROP PROCEDURE IF EXISTS `USP_UpdateBoxNo`;

DELIMITER $$

CREATE PROCEDURE `USP_UpdateBoxNo`(
   IN p_Mode VARCHAR(100),
   IN p_Code INT,
   IN p_ScanNo VARCHAR(200),
   IN p_BoxNo INT
)
proc_label: BEGIN
    DECLARE v_UPI_ID VARCHAR(25) DEFAULT '';
    DECLARE v_ItemCode VARCHAR(25) DEFAULT '';
    DECLARE v_ScanQty INT DEFAULT 0;
    DECLARE v_Rate INT DEFAULT 0;
    DECLARE v_UPIQTY INT DEFAULT 0; 
    DECLARE v_ItemMaster_Code INT DEFAULT 0;
    DECLARE v_OrderMaster_Code INT DEFAULT 0;
    DECLARE v_RowCode INT DEFAULT 0;
    DECLARE v_Done INT DEFAULT 0;
    DECLARE v_Updated INT DEFAULT 0;

    DECLARE cur_pack_scan CURSOR FOR
        SELECT d.Code
        FROM dispatchupiiddetails d
        INNER JOIN dispatchmaster dm ON dm.Code = d.DispatchMaster_Code
        WHERE d.UPI_ID = v_UPI_ID
          AND dm.Code = p_Code;

    DECLARE cur_pack_manual CURSOR FOR
        SELECT d.Code
        FROM dispatchupiiddetails d
        WHERE d.Code = p_Code;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_Done = 1;

    IF p_Mode = 'SCAN' THEN
        IF ((LENGTH(p_ScanNo) - LENGTH(REPLACE(p_ScanNo, '/', ''))) < 3) THEN
            SELECT 'INVALID SCAN NO !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        CALL USP_GetItemCodeAndQty(p_ScanNo, @UPI_ID, @ItemCode, @Qty, @Rate);
        SET v_UPI_ID = @UPI_ID;
        SET v_ItemCode = @ItemCode;
        SET v_ScanQty = @Qty;
        SET v_Rate = @Rate;

        IF NOT EXISTS (
            SELECT 1
            FROM dispatchupiiddetails d
            INNER JOIN dispatchmaster dm ON dm.Code = d.DispatchMaster_Code
            WHERE d.UPI_ID = v_UPI_ID
              AND dm.Code = p_Code
            LIMIT 1
        ) THEN
            SELECT 'Invalid item scan !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        SET v_Done = 0;
        SET v_Updated = 0;
        OPEN cur_pack_scan;
        pack_scan_loop: LOOP
            FETCH cur_pack_scan INTO v_RowCode;
            IF v_Done = 1 THEN
                LEAVE pack_scan_loop;
            END IF;
            UPDATE dispatchupiiddetails
            SET BoxNo = p_BoxNo
            WHERE Code = v_RowCode;
            SET v_Updated = v_Updated + 1;
        END LOOP;
        CLOSE cur_pack_scan;

        IF v_Updated > 0 THEN
            SELECT 'box updated successfully' AS Msg, 'Y' AS Status;
        ELSE
            SELECT 'Invalid item scan !' AS Msg, 'N' AS Status;
        END IF;

    ELSEIF p_Mode = 'DELETE' THEN
        SELECT ItemMaster_Code, OrderMaster_Code, DispatchQty
        INTO v_ItemMaster_Code, v_OrderMaster_Code, v_UPIQTY
        FROM DispatchDetailMaster
        WHERE Code = p_Code;

        UPDATE DispatchDetailMaster
        SET ScanQty = 0, ManualQty = 0, DispatchQty = 0
        WHERE Code = p_Code;

        UPDATE OrderDetailMaster
        SET DispatchQty = DispatchQty - v_UPIQTY
        WHERE OrderMaster_Code = v_OrderMaster_Code
          AND ItemMaster_Code = v_ItemMaster_Code;

        DELETE FROM Dispatchupiiddetails
        WHERE DispatchDetailMaster_Code = p_Code;

        SELECT 'Qty updated successfully.' AS Msg, 'Y' AS Status;

    ELSE
        /* Manual / Packing grid: update BoxNo only for the selected picking row */
        IF NOT EXISTS (SELECT 1 FROM dispatchupiiddetails WHERE Code = p_Code LIMIT 1) THEN
            SELECT 'Invalid record !' AS Msg, 'N' AS Status;
            LEAVE proc_label;
        END IF;

        SET v_Done = 0;
        SET v_Updated = 0;
        OPEN cur_pack_manual;
        pack_manual_loop: LOOP
            FETCH cur_pack_manual INTO v_RowCode;
            IF v_Done = 1 THEN
                LEAVE pack_manual_loop;
            END IF;
            UPDATE dispatchupiiddetails
            SET BoxNo = p_BoxNo
            WHERE Code = v_RowCode;
            SET v_Updated = v_Updated + 1;
        END LOOP;
        CLOSE cur_pack_manual;

        IF v_Updated > 0 THEN
            SELECT 'Box no updated successfully.' AS Msg, 'Y' AS Status;
        ELSE
            SELECT 'Invalid record !' AS Msg, 'N' AS Status;
        END IF;
    END IF;
END$$

DELIMITER ;

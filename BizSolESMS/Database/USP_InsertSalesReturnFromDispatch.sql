-- USP_InsertSalesReturnFromDispatch
-- Optional p_UPI_IDs (comma-separated). When provided, only those UPI items are inserted.
-- Empty / NULL = all items (backward compatible).

DROP PROCEDURE IF EXISTS USP_InsertSalesReturnFromDispatch;

DELIMITER $$
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_InsertSalesReturnFromDispatch`(
    IN p_AccountMaster_Code INT,
    IN p_OrderMaster_Code INT,
    IN p_ReasonMaster_Code INT,
    IN p_EntryType VARCHAR(20),
    IN p_CreatedBy INT,
    IN p_UPI_IDs TEXT,
    IN p_WarehouseMaster_Code INT
)
proc_body: BEGIN
    DECLARE v_SalesReturnMaster_Code INT DEFAULT 0;
    DECLARE v_OrderNo VARCHAR(20) DEFAULT NULL;
    DECLARE v_OrderNoPrefix VARCHAR(20);
    DECLARE v_OrderDate DATETIME;
    DECLARE v_FinYear VARCHAR(50) DEFAULT NULL;
    DECLARE v_TagPrefix VARCHAR(64);
    DECLARE v_now DATETIME;
    DECLARE v_dispatch_count INT DEFAULT 0;
    DECLARE v_duplicate_count INT DEFAULT 0;
    DECLARE v_selected_count INT DEFAULT 0;
    DECLARE v_Msg VARCHAR(255) DEFAULT '';
    DECLARE v_Status CHAR(1) DEFAULT 'N';
    DECLARE v_HasFilter TINYINT DEFAULT 0;

    SET v_now = NOW();

    IF IFNULL(p_WarehouseMaster_Code, 0) <= 0 THEN
        SET v_Msg = 'Please select Warehouse!';
        SELECT v_Status AS Status, v_Msg AS Msg, 0 AS SalesReturnMaster_Code, v_OrderNo AS SalesReturnNo, v_FinYear AS FinYear;
        LEAVE proc_body;
    END IF;

    IF IFNULL(p_ReasonMaster_Code, 0) <= 0 THEN
        SET v_Msg = 'Please select Reason!';
        SELECT v_Status AS Status, v_Msg AS Msg, 0 AS SalesReturnMaster_Code, v_OrderNo AS SalesReturnNo, v_FinYear AS FinYear;
        LEAVE proc_body;
    END IF;

    IF p_UPI_IDs IS NOT NULL AND TRIM(p_UPI_IDs) <> '' THEN
        SET v_HasFilter = 1;
    END IF;

    SELECT COUNT(*) INTO v_dispatch_count
    FROM dispatchmaster dm
    WHERE dm.AccountMaster_Code = p_AccountMaster_Code
      AND dm.OrderMaster_Code = p_OrderMaster_Code;

    IF v_dispatch_count = 0 THEN
        SET v_Msg = 'No dispatch records found for this order.';
        SELECT v_Status AS Status, v_Msg AS Msg, 0 AS SalesReturnMaster_Code, v_OrderNo AS SalesReturnNo, v_FinYear AS FinYear;
        LEAVE proc_body;
    END IF;

    IF v_HasFilter = 1 THEN
        SELECT COUNT(*) INTO v_selected_count
        FROM dispatchupiiddetails du
        JOIN dispatchmaster dm ON dm.Code = du.DispatchMaster_Code
        WHERE dm.AccountMaster_Code = p_AccountMaster_Code
          AND dm.OrderMaster_Code = p_OrderMaster_Code
          AND FIND_IN_SET(du.UPI_ID, p_UPI_IDs) > 0;

        IF v_selected_count = 0 THEN
            SET v_Msg = 'No matching selected items found for this invoice.';
            SELECT v_Status AS Status, v_Msg AS Msg, 0 AS SalesReturnMaster_Code, v_OrderNo AS SalesReturnNo, v_FinYear AS FinYear;
            LEAVE proc_body;
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_duplicate_count
    FROM dispatchupiiddetails du
    WHERE du.UPI_ID IN (SELECT UPI_ID FROM salesreturnupidetails)
      AND du.DispatchMaster_Code IN (
            SELECT Code FROM dispatchmaster
            WHERE AccountMaster_Code = p_AccountMaster_Code
              AND OrderMaster_Code = p_OrderMaster_Code
      )
      AND (v_HasFilter = 0 OR FIND_IN_SET(du.UPI_ID, p_UPI_IDs) > 0);

    IF v_duplicate_count > 0 THEN
        SET v_Msg = 'Selected UPI already returned!';
        SELECT v_Status AS Status, v_Msg AS Msg, 0 AS SalesReturnMaster_Code, v_OrderNo AS SalesReturnNo, v_FinYear AS FinYear;
        LEAVE proc_body;
    END IF;

    IF v_HasFilter = 0 AND EXISTS (
        SELECT 1 FROM salesreturnmaster
        WHERE AccountMaster_Code = p_AccountMaster_Code
          AND OrderMaster_Code = p_OrderMaster_Code
    ) THEN
        SET v_Msg = 'UPI already scanned!';
        SELECT v_Status AS Status, v_Msg AS Msg, 0 AS SalesReturnMaster_Code, v_OrderNo AS SalesReturnNo, v_FinYear AS FinYear;
        LEAVE proc_body;
    END IF;

    SELECT Code INTO v_SalesReturnMaster_Code
    FROM salesreturnmaster
    WHERE AccountMaster_Code = p_AccountMaster_Code
      AND OrderMaster_Code = p_OrderMaster_Code
    ORDER BY Code DESC
    LIMIT 1;

    IF v_SalesReturnMaster_Code IS NULL THEN
        SET v_SalesReturnMaster_Code = 0;
    END IF;

    IF v_SalesReturnMaster_Code = 0 THEN
        SELECT dm.ChallanDate, dm.FinYear, dm.ChallanNoPrefix
        INTO v_OrderDate, v_FinYear, v_OrderNoPrefix
        FROM dispatchmaster dm
        WHERE dm.AccountMaster_Code = p_AccountMaster_Code
          AND dm.OrderMaster_Code = p_OrderMaster_Code
        ORDER BY dm.Code
        LIMIT 1;

        SELECT LPAD(CAST(COALESCE(MAX(CAST(OrderNo AS UNSIGNED)), 0) + 1 AS UNSIGNED), 4, '0')
        INTO v_OrderNo
        FROM salesreturnmaster
        WHERE FinYear = v_FinYear;

        INSERT INTO salesreturnmaster
        (
            OrderNo, OrderDate, FinYear,
            AccountMaster_Code,
            BuyerPONo, BuyerPODate,
            IsActive, CreatedBy, ModifiedBy, CreatedOn, ModifiedOn,
            OrderNoPrefix, EntryType, ReasonMaster_Code, OrderMaster_Code,
            WarehouseMaster_Code
        )
        VALUES
        (
            v_OrderNo, v_now, v_FinYear,
            p_AccountMaster_Code,
            NULL, NULL,
            'Y', p_CreatedBy, p_CreatedBy, v_now, v_now,
            v_OrderNoPrefix, p_EntryType, p_ReasonMaster_Code, p_OrderMaster_Code,
            p_WarehouseMaster_Code
        );

        SET v_SalesReturnMaster_Code = LAST_INSERT_ID();
    ELSE
        SELECT OrderNo, FinYear
        INTO v_OrderNo, v_FinYear
        FROM salesreturnmaster
        WHERE Code = v_SalesReturnMaster_Code;
    END IF;

    SET v_TagPrefix = CONCAT('MAP-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 100000));

    IF v_HasFilter = 1 THEN
        INSERT INTO salesreturndetailmaster
        (
            ItemMaster_Code,
            SalesReturnMaster_Code,
            OrderQty, QtyBox, Rate,
            RecivedQty, ScanQty, ManualQty,
            Amount, ReasonMaster_Code, Remarks
        )
        SELECT
            ddm.ItemMaster_Code,
            v_SalesReturnMaster_Code,
            COALESCE(SUM(u.Qty), 0),
            COALESCE(ddm.QtyBox, 0),
            COALESCE(MAX(u.Rate), COALESCE(ddm.Rate, 0)),
            COALESCE(SUM(u.Qty), 0),
            COALESCE(SUM(u.Qty), 0),
            0,
            COALESCE(SUM(u.Qty), 0) * COALESCE(MAX(u.Rate), COALESCE(ddm.Rate, 0)),
            p_ReasonMaster_Code,
            CONCAT(COALESCE(ddm.Remarks, ''), '|', v_TagPrefix, ddm.Code)
        FROM dispatchdetailmaster ddm
        JOIN dispatchmaster dm ON dm.Code = ddm.DispatchMaster_Code
        JOIN dispatchupiiddetails u ON u.DispatchDetailMaster_Code = ddm.Code
                                  AND u.DispatchMaster_Code = dm.Code
        WHERE dm.AccountMaster_Code = p_AccountMaster_Code
          AND dm.OrderMaster_Code = p_OrderMaster_Code
          AND FIND_IN_SET(u.UPI_ID, p_UPI_IDs) > 0
        GROUP BY ddm.Code, ddm.ItemMaster_Code, ddm.QtyBox, ddm.Rate, ddm.Remarks;
    ELSE
        INSERT INTO salesreturndetailmaster
        (
            ItemMaster_Code,
            SalesReturnMaster_Code,
            OrderQty, QtyBox, Rate,
            RecivedQty, ScanQty, ManualQty,
            Amount, ReasonMaster_Code, Remarks
        )
        SELECT
            ddm.ItemMaster_Code,
            v_SalesReturnMaster_Code,
            COALESCE(ddm.DispatchQty, 0),
            COALESCE(ddm.QtyBox, 0),
            COALESCE(ddm.Rate, 0),
            COALESCE(ddm.DispatchQty, 0),
            COALESCE(ddm.ScanQty, 0),
            COALESCE(ddm.ManualQty, 0),
            COALESCE(ddm.Amount, 0),
            p_ReasonMaster_Code,
            CONCAT(COALESCE(ddm.Remarks, ''), '|', v_TagPrefix, ddm.Code)
        FROM dispatchdetailmaster ddm
        JOIN dispatchmaster dm ON dm.Code = ddm.DispatchMaster_Code
        WHERE dm.AccountMaster_Code = p_AccountMaster_Code
          AND dm.OrderMaster_Code = p_OrderMaster_Code;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_sr_map;
    CREATE TEMPORARY TABLE tmp_sr_map (
        DispatchDetailMaster_Code INT PRIMARY KEY,
        SalesReturnDetailMaster_Code INT NOT NULL
    ) ENGINE=Memory;

    INSERT INTO tmp_sr_map (DispatchDetailMaster_Code, SalesReturnDetailMaster_Code)
    SELECT
        ddm.Code,
        srd.Code
    FROM dispatchdetailmaster ddm
    JOIN salesreturndetailmaster srd
      ON srd.SalesReturnMaster_Code = v_SalesReturnMaster_Code
     AND srd.Remarks LIKE CONCAT('%|', v_TagPrefix, ddm.Code)
    JOIN dispatchmaster dm ON dm.Code = ddm.DispatchMaster_Code
    WHERE dm.AccountMaster_Code = p_AccountMaster_Code
      AND dm.OrderMaster_Code = p_OrderMaster_Code;

    INSERT INTO salesreturnupidetails
    (
        SalesReturnMaster_Code,
        SalesReturnDetailMaster_Code,
        UPI_ID,
        Qty,
        Rate
    )
    SELECT
        v_SalesReturnMaster_Code,
        m.SalesReturnDetailMaster_Code,
        u.UPI_ID,
        COALESCE(u.Qty, 0),
        u.Rate
    FROM dispatchupiiddetails u
    JOIN tmp_sr_map m ON m.DispatchDetailMaster_Code = u.DispatchDetailMaster_Code
    JOIN dispatchmaster dm ON dm.Code = u.DispatchMaster_Code
    WHERE dm.AccountMaster_Code = p_AccountMaster_Code
      AND dm.OrderMaster_Code = p_OrderMaster_Code
      AND (v_HasFilter = 0 OR FIND_IN_SET(u.UPI_ID, p_UPI_IDs) > 0);

    UPDATE salesreturndetailmaster srd
    SET srd.Remarks = TRIM(BOTH '|' FROM REPLACE(srd.Remarks, CONCAT('|', v_TagPrefix), ''))
    WHERE srd.SalesReturnMaster_Code = v_SalesReturnMaster_Code
      AND srd.Remarks LIKE CONCAT('%|', v_TagPrefix, '%');

    DELETE FROM dispatchupiiddetails
    WHERE DispatchMaster_Code IN (
        SELECT Code FROM (
            SELECT Code FROM dispatchmaster
            WHERE AccountMaster_Code = p_AccountMaster_Code
              AND OrderMaster_Code = p_OrderMaster_Code
        ) dm
    )
    AND (v_HasFilter = 0 OR FIND_IN_SET(UPI_ID, p_UPI_IDs) > 0);

    DROP TEMPORARY TABLE IF EXISTS tmp_sr_map;

    SET v_Msg = 'Sales return created successfully.';
    SET v_Status = 'Y';

    SELECT
        v_Status AS Status,
        v_Msg AS Msg,
        v_SalesReturnMaster_Code AS SalesReturnMaster_Code,
        v_OrderNo AS SalesReturnNo,
        v_FinYear AS FinYear;
END$$
DELIMITER ;

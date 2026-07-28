-- USP_GetSalesReturnDatabyOrderNo
-- Returns dispatch UPI rows for an order that are NOT already in sales return.
-- Exclude any UPI_ID that already exists in salesreturnupidetails.

DROP PROCEDURE IF EXISTS USP_GetSalesReturnDatabyOrderNo;

DELIMITER $$
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_GetSalesReturnDatabyOrderNo`(
    IN p_Code INT
)
BEGIN
    SELECT
        Itemmaster.ItemCode AS 'Part Code',
        Itemmaster.ItemName AS 'Part Name',
        IFNULL(dispatchupiiddetails.UPI_ID, '') AS 'UPI ID',
        OrderMaster.BuyerPONo AS 'Order No',
        accountMaster.AccountName AS 'Client Name'
    FROM Dispatchmaster
    LEFT JOIN dispatchdetailmaster
        ON dispatchdetailmaster.DispatchMaster_Code = Dispatchmaster.Code
    LEFT JOIN dispatchupiiddetails
        ON dispatchupiiddetails.DispatchMaster_Code = Dispatchmaster.Code
       AND dispatchupiiddetails.DispatchDetailMaster_Code = dispatchdetailmaster.Code
    LEFT JOIN OrderMaster
        ON OrderMaster.Code = Dispatchmaster.OrderMaster_Code
    LEFT JOIN Itemmaster
        ON Itemmaster.Code = dispatchdetailmaster.ItemMaster_Code
    LEFT JOIN accountMaster
        ON accountMaster.Code = OrderMaster.AccountMaster_Code
    WHERE Dispatchmaster.OrderMaster_Code = p_Code
      AND Dispatchmaster.Completed = 'Y'
      AND IFNULL(dispatchupiiddetails.UPI_ID, '') <> ''
      AND NOT EXISTS (
            SELECT 1
            FROM salesreturnupidetails sru
            WHERE sru.UPI_ID = dispatchupiiddetails.UPI_ID
      );
END$$
DELIMITER ;

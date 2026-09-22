-- Invoice Payment Report — add Client Name filter (AccountMaster_Code; 0 = all clients)
DROP PROCEDURE IF EXISTS USP_InvoicePaymentReport;

DELIMITER $$

CREATE DEFINER=`sa`@`%` PROCEDURE `USP_InvoicePaymentReport`(
    IN FromDate               VARCHAR(30),
    IN ToDate                 VARCHAR(30),
    IN PaymentStatus          VARCHAR(30),
    IN p_AccountMaster_Code   INT
)
BEGIN
    SELECT
        ROW_NUMBER() OVER (ORDER BY InvoiceMaster.InvoiceDate, InvoiceMaster.InvoiceNo) AS `S.No`,
        InvoiceMaster.InvoiceNo,
        InvoiceMaster.InvoiceDate,
        AccountMaster.AccountName,
        ROUND(IFNULL(InvoiceAmount.TotalAmount, 0), 2) AS InvoiceAmount,
        ROUND(IFNULL(PaymentAmount.TotalPayment, 0), 2) AS PaymentAmount,
        ROUND(IFNULL(InvoiceAmount.TotalAmount, 0) - IFNULL(PaymentAmount.TotalPayment, 0), 2) AS BalanceAmount,
        CASE
            WHEN IFNULL(PaymentAmount.TotalPayment, 0) = 0 THEN 'Pending'
            WHEN IFNULL(PaymentAmount.TotalPayment, 0) < IFNULL(InvoiceAmount.TotalAmount, 0) THEN 'Partial'
            WHEN IFNULL(PaymentAmount.TotalPayment, 0) >= IFNULL(InvoiceAmount.TotalAmount, 0) THEN 'Completed'
        END AS Status
    FROM InvoiceMaster
    INNER JOIN DispatchMaster
        ON DispatchMaster.Code = InvoiceMaster.DispatchMaster_Code
    INNER JOIN OrderMaster
        ON OrderMaster.Code = DispatchMaster.OrderMaster_Code
    INNER JOIN AccountMaster
        ON AccountMaster.Code = OrderMaster.AccountMaster_Code
    LEFT JOIN (
        SELECT InvoiceDetail.InvoiceMaster_Code, SUM(InvoiceDetail.Amount) AS TotalAmount
        FROM InvoiceDetail
        GROUP BY InvoiceDetail.InvoiceMaster_Code
    ) AS InvoiceAmount
        ON InvoiceAmount.InvoiceMaster_Code = InvoiceMaster.Code
    LEFT JOIN (
        SELECT PaymentDetails.InvoiceMaster_Code, SUM(PaymentDetails.PaymentAmount) AS TotalPayment
        FROM PaymentDetails
        GROUP BY PaymentDetails.InvoiceMaster_Code
    ) AS PaymentAmount
        ON PaymentAmount.InvoiceMaster_Code = InvoiceMaster.Code
    WHERE DATE(InvoiceMaster.InvoiceDate) BETWEEN FromDate AND ToDate
      AND (IFNULL(p_AccountMaster_Code, 0) = 0 OR OrderMaster.AccountMaster_Code = p_AccountMaster_Code)
      AND (
            PaymentStatus = 'All'
         OR (PaymentStatus = 'Pending'   AND IFNULL(PaymentAmount.TotalPayment, 0) = 0)
         OR (PaymentStatus = 'Partial'   AND IFNULL(PaymentAmount.TotalPayment, 0) > 0
                                        AND IFNULL(PaymentAmount.TotalPayment, 0) < IFNULL(InvoiceAmount.TotalAmount, 0))
         OR (PaymentStatus = 'Completed' AND IFNULL(PaymentAmount.TotalPayment, 0) >= IFNULL(InvoiceAmount.TotalAmount, 0))
      );
END$$

DELIMITER ;

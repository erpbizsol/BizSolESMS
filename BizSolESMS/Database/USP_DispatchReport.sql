DROP PROCEDURE IF EXISTS `USP_DispatchReport`;

DELIMITER $$
CREATE PROCEDURE `USP_DispatchReport`(
   IN p_Code INT
)
BEGIN
        SELECT
        (Select CompanyCode From FixParameter LIMIT 1) AS CompanyCode,
        (Select IsPSRQRShow From FixParameter LIMIT 1) AS IsPSRQRShow,
        (Select IsShowBankDetailInPSR From FixParameter LIMIT 1) AS IsShowBankDetailInPSR,
        (Select UPIId From FixParameter LIMIT 1) AS UPIId,
		(Select CompanyName From CompanyMaster LIMIT 1)  As 'From',
		(Select CompanyAddress From CompanyMaster LIMIT 1) As 'Address',
		(Select Phone From CompanyMaster LIMIT 1) As 'Phone',
		(Select Email From CompanyMaster LIMIT 1) As 'Email',
		accountmaster.AccountName As 'To',
		OrderMaster.BuyerPONo As 'OrderNo',
		DispatchMaster.ChallanNoWithPrefix As 'ChallanNo',
        Sum(itemopeningbalance.MRP*DispatchUpiidDetails.Qty) As 'OrgMRP',
		Sum(dispatchupiiddetails.Rate*DispatchUpiidDetails.Qty) As 'ScanMRP',
		Sum(itemopeningbalance.MRP*DispatchUpiidDetails.Qty)-Sum(dispatchupiiddetails.Rate*DispatchUpiidDetails.Qty) As 'Difference',
		COUNT(DISTINCT dispatchupiiddetails.BoxNo) AS 'NoOfBoxes',
		COUNT(DISTINCT orderdetailmaster.ItemMaster_Code) AS 'TotalLineItems',
		COUNT(DISTINCT dispatchdetailmaster.ItemMaster_Code) AS 'TotalScannedProducts',
        '' AS QRCode
		FROM orderdetailmaster
		LEFT JOIN vw_OrderDetails OrderMaster ON OrderMaster.Code = orderdetailmaster.OrderMaster_Code
		LEFT JOIN DispatchMaster ON DispatchMaster.OrderMaster_Code = OrderMaster.Code
		LEFT JOIN dispatchdetailmaster ON dispatchdetailmaster.DispatchMaster_Code = DispatchMaster.Code And dispatchdetailmaster.ItemMaster_Code =orderdetailmaster. ItemMaster_Code
		LEFT JOIN dispatchupiiddetails ON dispatchupiiddetails.DispatchMaster_Code = DispatchMaster.Code And dispatchdetailmaster.Code=dispatchupiiddetails.dispatchdetailmaster_Code
		LEFT JOIN accountmaster ON accountmaster.Code = OrderMaster.accountmaster_code
        LEFT JOIN itemopeningbalance ON itemopeningbalance.ItemMaster_Code = DispatchDetailMaster.ItemMaster_Code
		WHERE DispatchMaster.Code = p_Code
        Group By accountmaster.AccountName,accountmaster.AccountCode,OrderMaster.BuyerPONo,DispatchMaster.ChallanNoWithPrefix;

        SELECT DISTINCT
			ROW_NUMBER() OVER (ORDER BY ItemMaster.ItemCode) AS `SrNo`,
			ItemMaster.ItemCode AS `ItemCode`,
			DispatchUpiidDetails.BoxNo AS `BoxNo`,
			SUM(DispatchUpiidDetails.Qty) AS `ScannedQty`,
			orderdetailmaster.OrderQty AS `OrderedQty`,
			DispatchUpiidDetails.Rate AS `MRP`,
			Case When DispatchUpiidDetails.Rate=itemopeningbalance.MRP THEN '' Else itemopeningbalance.MRP END AS `OrgMRP`
			FROM DispatchMaster
			LEFT JOIN DispatchDetailMaster ON DispatchMaster.Code = DispatchDetailMaster.DispatchMaster_Code
			LEFT JOIN DispatchUpiidDetails ON DispatchDetailMaster.Code = DispatchUpiidDetails.DispatchDetailMaster_Code
			LEFT JOIN ItemMaster  ON ItemMaster.Code = DispatchDetailMaster.ItemMaster_Code
			LEFT JOIN vw_OrderDetails OrderMaster ON OrderMaster.Code = DispatchMaster.OrderMaster_Code
			LEFT JOIN orderdetailmaster ON orderdetailmaster.OrderMaster_Code = OrderMaster.Code
			AND DispatchDetailMaster.ItemMaster_Code = orderdetailmaster.ItemMaster_Code
            LEFT JOIN itemopeningbalance ON itemopeningbalance.ItemMaster_Code = DispatchDetailMaster.ItemMaster_Code
			WHERE DispatchMaster.Code =p_Code
			GROUP BY ItemMaster.ItemCode,
							orderdetailmaster.OrderQty,
							DispatchUpiidDetails.Rate,
                            itemopeningbalance.MRP,
							DispatchUpiidDetails.BoxNo;

			Select BankName,AccountNo,IFSCCode,Branch,Type
            From BankMaster
            Where IsShowInPSR='Y' AND IsActive='Y'
            Order By DefaultCheck DESC, Code;
END$$
DELIMITER ;

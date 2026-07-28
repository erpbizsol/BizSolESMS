*************************** 1. row ***************************
USP_ModeWiseDispatch
ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
CREATE DEFINER=`sa`@`%` PROCEDURE `USP_ModeWiseDispatch`(
   IN p_Mode VARCHAR(100),
   IN p_DispatchMaster_Code INT,
   IN p_Code INT
)
BEGIN 
   IF p_Mode = 'ORDERDETAILS' THEN
	IF p_DispatchMaster_Code > 0 THEN
		SELECT DISTINCT 
				dispatchupiiddetails.code As 'DispatchUPICode',
				OrderMaster.Code,
				ifnull(DispatchMaster.ChallanNoWithPrefix,'') As ChallanNo,
                DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%b/%Y')   AS 'ChallanDate',
				IFNULL(OrderMaster.BuyerPONo, '') AS 'OrderNo',
				Concat(accountmaster.AccountName,'(',IFNULL(accountmaster.AccountCode,''),',',IFNULL(CityMaster.CityName,''),')') As AccountName,
				UserMaster.UserName AS 'PackedBy',
                IFNULL(dispatchupiiddetails.BoxNo,'1') As BoxNo
			FROM OrderMaster 
			LEFT JOIN DispatchMaster ON OrderMaster.Code = DispatchMaster.OrderMaster_Code
            LEFT JOIN dispatchupiiddetails ON DispatchMaster.Code = dispatchupiiddetails.DispatchMaster_Code
			LEFT JOIN AccountMaster ON OrderMaster.AccountMaster_Code = AccountMaster.Code
			LEFT JOIN addressmaster ON addressmaster.AccountMaster_Code = AccountMaster.Code
			LEFT JOIN CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
		    LEFT JOIN UserMaster ON DispatchMaster.CreatedBy = Usermaster.Code
			WHERE DispatchMaster.Code = p_DispatchMaster_Code
            ORDER BY dispatchupiiddetails.Code DESC LIMIT 1; 
              
			SELECT ROW_NUMBER() OVER (ORDER BY DispatchDetailMaster.updated_at DESC, du.BoxNo Desc) AS SNo,
				DispatchDetailMaster.Code,
                itemmaster.ItemCode As 'Item Code',
                OrderDetailMaster.OrderQty As 'Ord Qty',
                (OrderDetailMaster.OrderQty-(OrderDetailMaster.DispatchQty+OrderDetailMaster.CancelQty)+ifnull(DispatchDetailMaster.DispatchQty,0)) As 'Bal Qty',
				CASE WHEN BrandMaster.picklistNo ='Y' THEN IFNULL(du.TotalScanQty, 0) ELSE IFNULL(DispatchDetailMaster.ScanQty, 0) END  AS 'Scan Qty',
				ifnull(DispatchDetailMaster.ManualQty,0) As 'Manual Qty',
				CASE WHEN BrandMaster.picklistNo ='Y' THEN IFNULL(du.Rate, 'NULL') ELSE IFNULL(DispatchDetailMaster.Rate, 0) END  AS 'MRP',
                
                ifnull(du.BoxNo,'NULL') As 'Box No',
                group_concat(IFNULL(LocationMaster.LocationName,'')) As 'Location',
				ifnull(DispatchDetailMaster.DispatchQty,0) As 'Packing Qty',
                (Case When (IFNULL(DispatchDetailMaster.DispatchQty,0)>=OrderDetailMaster.OrderQty) THEN 'GREEN' WHEN (IFNULL(DispatchDetailMaster.DispatchQty,0) < OrderDetailMaster.OrderQty) AND IFNULL(DispatchDetailMaster.DispatchQty,0)<>0 THEN 'YELLOW' ELSE 'RED' END ) AS ROWSTATUS,
				itemmaster.ItemName As 'Item Name'
			FROM OrderDetailMaster
            LEFT JOIN ordermaster ON OrderDetailMaster.OrderMaster_Code = ordermaster.Code
			LEFT JOIN DispatchMaster ON DispatchMaster.OrderMaster_Code = OrderDetailMaster.OrderMaster_Code
            LEFT JOIN DispatchDetailMaster ON DispatchMaster.Code = DispatchDetailMaster.DispatchMaster_Code 
			And DispatchDetailMaster.ItemMaster_Code=OrderDetailMaster.ItemMaster_Code 
			LEFT JOIN itemmaster ON OrderDetailMaster.ItemMaster_Code = itemmaster.Code
			LEFT JOIN BrandMaster ON itemmaster.BrandMaster_Code = BrandMaster.Code
			LEFT JOIN itemlocationdetails ON itemlocationdetails.ItemMaster_Code = itemmaster.Code 
            AND ordermaster.WarehouseMaster_Code = CASE WHEN ((Select IsWarehouseEnabled From Fixparameter)='Y') THEN itemlocationdetails.WarehouseMaster_Code ELSE ordermaster.WarehouseMaster_Code END
            LEFT JOIN LocationMaster ON itemlocationdetails.LocationMaster_Code = LocationMaster.Code
			LEFT JOIN (SELECT  DispatchDetailMaster_Code,  Rate,BoxNo, SUM(Qty) AS TotalScanQty FROM Dispatchupiiddetails
			GROUP BY DispatchDetailMaster_Code, Rate,BoxNo
			) AS du ON du.DispatchDetailMaster_Code = DispatchDetailMaster.Code
			GROUP BY OrderDetailMaster.Code,OrderDetailMaster.OrderQty, DispatchDetailMaster.DispatchQty,
			DispatchDetailMaster.ManualQty,ItemMaster.ItemCode,ItemMaster.ItemName,
			du.Rate,du.BoxNo, du.TotalScanQty,DispatchDetailMaster.updated_at,DispatchDetailMaster.Code
            HAVING MAX(DispatchMaster.Code) = p_DispatchMaster_Code;
    ELSE
    
	   SELECT DISTINCT
				OrderMaster.Code,
				IFNULL(OrderMaster.BuyerPONo, '') AS 'OrderNo',
				Concat(accountmaster.AccountName,'(',IFNULL(accountmaster.AccountCode,''),',',IFNULL(CityMaster.CityName,''),')') As AccountName,
                '1' As BoxNo
			FROM OrderMaster 
			LEFT JOIN AccountMaster ON OrderMaster.AccountMaster_Code = AccountMaster.Code
            LEFT JOIN addressmaster ON addressmaster.AccountMaster_Code = AccountMaster.Code
			LEFT JOIN CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
			WHERE OrderMaster.Code = p_Code;
			
			SELECT 
				ROW_NUMBER() OVER (ORDER BY OrderDetailMaster.Code) AS `SNo`,
				OrderDetailMaster.Code,
                itemmaster.ItemCode As 'Item Code',
                OrderDetailMaster.OrderQty As 'Ord Qty',
				(OrderDetailMaster.OrderQty-(OrderDetailMaster.DispatchQty+OrderDetailMaster.CancelQty)) As 'Bal Qty',
				0 As 'Scan Qty',
				0 As 'Manual Qty',
                'NULL' As 'MRP',
				'NULL' As 'Box No',
                group_concat(IFNULL(LocationMaster.LocationName,'')) As 'Location',
				0 As 'Packing Qty',
				itemmaster.ItemName As 'Item Name',
                'RED' As ROWSTATUS
			FROM OrderDetailMaster
            LEFT JOIN ordermaster ON OrderDetailMaster.OrderMaster_Code = ordermaster.Code
			LEFT JOIN itemmaster ON OrderDetailMaster.ItemMaster_Code = itemmaster.Code
			LEFT JOIN itemlocationdetails ON itemlocationdetails.ItemMaster_Code = itemmaster.Code
            AND ordermaster.WarehouseMaster_Code = CASE WHEN ((Select IsWarehouseEnabled From Fixparameter)='Y') THEN itemlocationdetails.WarehouseMaster_Code ELSE ordermaster.WarehouseMaster_Code END
			LEFT JOIN LocationMaster ON itemlocationdetails.LocationMaster_Code = LocationMaster.Code		
            WHERE OrderDetailMaster.OrderMaster_Code = p_Code
            GROUP BY OrderDetailMaster.Code,itemmaster.ItemName,itemmaster.ItemCode ;  
		END IF;
    ELSEIF p_Mode = 'DDETAILS' THEN
        SELECT DISTINCT
			dispatchupiiddetails.code As 'DispatchUPICode',
			OrderMaster.Code,
			ifnull(DispatchMaster.ChallanNoWithPrefix,'') As ChallanNo,
			DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%b/%Y')   AS 'ChallanDate',
			IFNULL(OrderMaster.BuyerPONo, '') AS 'OrderNo',
			OrderMaster.BuyerPONo,
			Concat(accountmaster.AccountName,'(',IFNULL(accountmaster.AccountCode,''),',',IFNULL(CityMaster.CityName,''),')') As AccountName,
            UserMaster.UserName AS 'PackedBy',
            IFNULL(dispatchupiiddetails.BoxNo,'1') As BoxNo
        FROM DispatchMaster 
        LEFT JOIN OrderMaster ON  DispatchMaster.OrderMaster_Code=OrderMaster.Code 
		LEFT JOIN dispatchupiiddetails ON DispatchMaster.Code = dispatchupiiddetails.DispatchMaster_Code
        LEFT JOIN AccountMaster ON OrderMaster.AccountMaster_Code = AccountMaster.Code
        LEFT JOIN addressmaster ON addressmaster.AccountMaster_Code = AccountMaster.Code
		LEFT JOIN CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
		LEFT JOIN UserMaster ON DispatchMaster.CreatedBy = Usermaster.Code
        WHERE DispatchMaster.Code = p_DispatchMaster_Code
        ORDER BY dispatchupiiddetails.Code DESC LIMIT 1;

        SELECT 
			ROW_NUMBER() OVER (ORDER BY DispatchDetailMaster.updated_at DESC, du.BoxNo Desc) AS `SNo`,
			DispatchDetailMaster.Code,
            itemmaster.ItemCode As 'Item Code', 
            OrderDetailMaster.OrderQty As 'Ord Qty',
            (OrderDetailMaster.OrderQty-(OrderDetailMaster.DispatchQty+OrderDetailMaster.CancelQty)+ifnull(DispatchDetailMaster.DispatchQty,0)) As 'Bal Qty',
			CASE WHEN BrandMaster.picklistNo='Y' THEN IFNULL(du.TotalScanQty, 0) ELSE IFNULL(DispatchDetailMaster.ScanQty, 0) END  AS 'Scan Qty',
			ifnull(DispatchDetailMaster.ManualQty,0) As 'Manual Qty',
			-- ifnull(du.Rate,'NULL') As 'MRP',
             CASE WHEN BrandMaster.picklistNo='Y' THEN IFNULL(du.Rate, 'NULL') ELSE IFNULL(DispatchDetailMaster.Rate, 0) END  AS 'MRP',
            ifnull(du.BoxNo,'NULL') As 'Box No',
            group_concat(IFNULL(LocationMaster.LocationName,'')) As 'Location',
			ifnull(DispatchDetailMaster.DispatchQty,0) As 'Packing Qty',
            (Case When (IFNULL(DispatchDetailMaster.DispatchQty,0)>=OrderDetailMaster.OrderQty) THEN 'GREEN' WHEN (IFNULL(DispatchDetailMaster.DispatchQty,0) < OrderDetailMaster.OrderQty) AND IFNULL(DispatchDetailMaster.DispatchQty,0)<>0 THEN 'YELLOW' ELSE 'RED' END ) AS ROWSTATUS,
			itemmaster.ItemName As 'Item Name'
        FROM DispatchDetailMaster
		LEFT JOIN OrderDetailMaster ON OrderDetailMaster.ItemMaster_Code = DispatchDetailMaster.ItemMaster_Code And DispatchDetailMaster.OrderMaster_Code=OrderDetailMaster.OrderMaster_Code
		LEFT JOIN ordermaster ON OrderDetailMaster.OrderMaster_Code = ordermaster.Code
        LEFT JOIN itemmaster ON DispatchDetailMaster.ItemMaster_Code = itemmaster.Code
		LEFT JOIN BrandMaster ON itemmaster.BrandMaster_Code = BrandMaster.Code
      	LEFT JOIN itemlocationdetails ON itemlocationdetails.ItemMaster_Code = itemmaster.Code
        AND ordermaster.WarehouseMaster_Code = CASE WHEN ((Select IsWarehouseEnabled From Fixparameter)='Y') THEN itemlocationdetails.WarehouseMaster_Code ELSE ordermaster.WarehouseMaster_Code END
		LEFT JOIN LocationMaster ON itemlocationdetails.LocationMaster_Code = LocationMaster.Code
		LEFT JOIN (SELECT  DispatchDetailMaster_Code,  Rate,BoxNo, SUM(Qty) AS TotalScanQty FROM Dispatchupiiddetails
		GROUP BY DispatchDetailMaster_Code, Rate,BoxNo
		) AS du ON du.DispatchDetailMaster_Code = DispatchDetailMaster.Code
		GROUP BY OrderDetailMaster.Code,OrderDetailMaster.OrderQty, DispatchDetailMaster.DispatchQty,
		DispatchDetailMaster.ManualQty,ItemMaster.ItemCode,ItemMaster.ItemName,
		du.Rate,du.BoxNo, du.TotalScanQty,DispatchDetailMaster.updated_at,DispatchDetailMaster.Code
		HAVING MAX(DispatchDetailMaster.DispatchMaster_Code) = p_DispatchMaster_Code;
    ELSEIF p_Mode = 'AllDDETAILS' THEN
       SELECT DISTINCT
			dispatchupiiddetails.code As 'DispatchUPICode',
			OrderMaster.Code,
			ifnull(DispatchMaster.ChallanNoWithPrefix,'') As ChallanNo,
			DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%b/%Y')   AS 'ChallanDate',
			IFNULL(OrderMaster.BuyerPONo, '') AS 'OrderNo',
			OrderMaster.BuyerPONo,
			Concat(accountmaster.AccountName,'(',IFNULL(accountmaster.AccountCode,''),',',IFNULL(CityMaster.CityName,''),')') As AccountName,
            UserMaster.UserName AS 'PackedBy',
            IFNULL(dispatchupiiddetails.BoxNo,'1') As BoxNo
        FROM DispatchMaster 
        LEFT JOIN OrderMaster ON  DispatchMaster.OrderMaster_Code=OrderMaster.Code 
		LEFT JOIN dispatchupiiddetails ON DispatchMaster.Code = dispatchupiiddetails.DispatchMaster_Code
        LEFT JOIN AccountMaster ON OrderMaster.AccountMaster_Code = AccountMaster.Code
        LEFT JOIN addressmaster ON addressmaster.AccountMaster_Code = AccountMaster.Code
		LEFT JOIN CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
		LEFT JOIN UserMaster ON DispatchMaster.CreatedBy = Usermaster.Code
        WHERE DispatchMaster.Code = p_DispatchMaster_Code
        ORDER BY dispatchupiiddetails.Code DESC LIMIT 1;

		SELECT 
				ROW_NUMBER() OVER (ORDER BY ddm.updated_at DESC, du.BoxNo Desc) AS SNo,
				ddm.Code,
                im.ItemCode AS 'Item Code',
                odm.OrderQty AS 'Ord Qty',
                (odm.OrderQty - (odm.DispatchQty + odm.CancelQty) + IFNULL(ddm.DispatchQty, 0)) AS 'Bal Qty',
				-- IFNULL(du.TotalScanQty, 0) AS 'Scan Qty',
                CASE WHEN BrandMaster.picklistNo='Y' THEN IFNULL(du.TotalScanQty, 0) ELSE IFNULL(ddm.ScanQty, 0) END  AS 'Scan Qty',
				IFNULL(ddm.ManualQty, 0) AS 'Manual Qty',
                -- ifnull(du.Rate,'NULL') As 'MRP',
                 CASE WHEN BrandMaster.picklistNo='Y' THEN IFNULL(du.Rate, 0) ELSE IFNULL(ddm.Rate, 0) END  AS 'MRP',
                ifnull(du.BoxNo,'NULL') As 'Box No',
                group_concat(IFNULL(LocationMaster.LocationName,'')) As 'Location',
				IFNULL(ddm.DispatchQty, 0) AS 'Packing Qty',
                (Case When (IFNULL(ddm.DispatchQty,0)>=odm.OrderQty) THEN 'GREEN' WHEN (IFNULL(ddm.DispatchQty,0) < odm.OrderQty) AND IFNULL(ddm.DispatchQty,0)<>0 THEN 'YELLOW' ELSE 'RED' END ) AS ROWSTATUS,
				im.ItemName AS 'Item Name'
			FROM OrderDetailMaster odm
            LEFT JOIN ordermaster ON odm.OrderMaster_Code = ordermaster.Code
			LEFT JOIN DispatchDetailMaster ddm
				ON odm.OrderMaster_Code = ddm.OrderMaster_Code
				AND odm.ItemMaster_Code = ddm.ItemMaster_Code
				AND ddm.dispatchmaster_Code = p_DispatchMaster_Code
			LEFT JOIN itemmaster im ON odm.ItemMaster_Code = im.Code
            LEFT JOIN BrandMaster ON im.BrandMaster_Code = BrandMaster.Code
          	LEFT JOIN itemlocationdetails ON itemlocationdetails.ItemMaster_Code = im.Code
            AND ordermaster.WarehouseMaster_Code = CASE WHEN ((Select IsWarehouseEnabled From Fixparameter)='Y') 
            THEN itemlocationdetails.WarehouseMaster_Code ELSE ordermaster.WarehouseMaster_Code END
			LEFT JOIN LocationMaster ON itemlocationdetails.LocationMaster_Code = LocationMaster.Code
			LEFT JOIN (SELECT  DispatchDetailMaster_Code,  Rate,BoxNo, SUM(Qty) AS TotalScanQty FROM Dispatchupiiddetails
			GROUP BY DispatchDetailMaster_Code, Rate,BoxNo
			) AS du ON du.DispatchDetailMaster_Code = ddm.Code
			GROUP BY odm.Code,odm.OrderQty, ddm.DispatchQty,
			ddm.ManualQty,im.ItemCode,im.ItemName,
			du.Rate,du.BoxNo, du.TotalScanQty,ddm.updated_at,ddm.Code
            HAVING Max(odm.OrderMaster_Code) = p_Code; 
  ELSEIF p_Mode = 'CDETAILS' THEN 
         SELECT DISTINCT
			dispatchupiiddetails.code As 'DispatchUPICode',
			OrderMaster.Code,
			ifnull(DispatchMaster.ChallanNoWithPrefix,'') As ChallanNo,
			DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%b/%Y')   AS 'ChallanDate',
			IFNULL(OrderMaster.BuyerPONo, '') AS 'OrderNo',
			OrderMaster.BuyerPONo,
			Concat(accountmaster.AccountName,'(',IFNULL(accountmaster.AccountCode,''),',',IFNULL(CityMaster.CityName,''),')') As AccountName,
           UserMaster.UserName AS 'PackedBy',
           IFNULL(dispatchupiiddetails.BoxNo,'1') As BoxNo
        FROM DispatchMaster 
        LEFT JOIN OrderMaster ON  DispatchMaster.OrderMaster_Code=OrderMaster.Code 
		LEFT JOIN dispatchupiiddetails ON DispatchMaster.Code = dispatchupiiddetails.DispatchMaster_Code
        LEFT JOIN AccountMaster ON OrderMaster.AccountMaster_Code = AccountMaster.Code
        LEFT JOIN addressmaster ON addressmaster.AccountMaster_Code = AccountMaster.Code
		LEFT JOIN CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
        LEFT JOIN UserMaster ON DispatchMaster.CreatedBy = Usermaster.Code
        WHERE DispatchMaster.Code = p_DispatchMaster_Code
        ORDER BY dispatchupiiddetails.Code DESC LIMIT 1;

        SELECT 
			ROW_NUMBER() OVER (ORDER BY DispatchDetailMaster.updated_at DESC,du.BoxNo Desc) AS `SNo`,
			DispatchDetailMaster.Code,
            itemmaster.ItemCode As 'Item Code',
            OrderDetailMaster.OrderQty As 'Ord Qty',
            (OrderDetailMaster.OrderQty-(OrderDetailMaster.DispatchQty+OrderDetailMaster.CancelQty)+ifnull(DispatchDetailMaster.DispatchQty,0)) As 'Bal Qty',
			-- IFNULL(du.TotalScanQty, 0) AS 'Scan Qty', 
            CASE WHEN BrandMaster.picklistNo = 'Y' THEN IFNULL(du.TotalScanQty, 0) ELSE IFNULL(DispatchDetailMaster.ScanQty, 0) END  AS 'Scan Qty',
			ifnull(DispatchDetailMaster.ManualQty,0) As 'Manual Qty',
            CASE WHEN BrandMaster.picklistNo = 'Y' THEN IFNULL(du.Rate, 0) ELSE IFNULL(DispatchDetailMaster.Rate, 0) END  AS 'MRP',
			-- ifnull(du.Rate,'NULL') As 'MRP',
            ifnull(du.BoxNo,'NULL') As 'Box No',
            group_concat(IFNULL(LocationMaster.LocationName,'')) As 'Location',
			ifnull(DispatchDetailMaster.DispatchQty,0) As 'Packing Qty',
            (Case When (IFNULL(DispatchDetailMaster.DispatchQty,0)>=OrderDetailMaster.OrderQty) THEN 'GREEN' WHEN (IFNULL(DispatchDetailMaster.DispatchQty,0) < OrderDetailMaster.OrderQty) AND IFNULL(DispatchDetailMaster.DispatchQty,0)<>0 THEN 'YELLOW' ELSE 'RED' END ) AS ROWSTATUS,
			itemmaster.ItemName As 'Item Name'
		FROM DispatchDetailMaster
		LEFT JOIN OrderDetailMaster ON OrderDetailMaster.ItemMaster_Code = DispatchDetailMaster.ItemMaster_Code And DispatchDetailMaster.OrderMaster_Code=OrderDetailMaster.OrderMaster_Code
		LEFT JOIN ordermaster ON OrderDetailMaster.OrderMaster_Code = ordermaster.Code
        LEFT JOIN itemmaster ON DispatchDetailMaster.ItemMaster_Code = itemmaster.Code
        LEFT JOIN BrandMaster ON itemmaster.BrandMaster_Code = BrandMaster.Code
      	LEFT JOIN itemlocationdetails ON itemlocationdetails.ItemMaster_Code = itemmaster.Code
        AND ordermaster.WarehouseMaster_Code = CASE WHEN ((Select IsWarehouseEnabled From Fixparameter)='Y') 
        THEN itemlocationdetails.WarehouseMaster_Code ELSE ordermaster.WarehouseMaster_Code END
		LEFT JOIN LocationMaster ON itemlocationdetails.LocationMaster_Code = LocationMaster.Code
		LEFT JOIN (SELECT  DispatchDetailMaster_Code,  Rate,BoxNo, SUM(Qty) AS TotalScanQty FROM Dispatchupiiddetails
			GROUP BY DispatchDetailMaster_Code, Rate,BoxNo
			) AS du ON du.DispatchDetailMaster_Code = DispatchDetailMaster.Code
			GROUP BY OrderDetailMaster.Code,OrderDetailMaster.OrderQty, DispatchDetailMaster.DispatchQty,
			DispatchDetailMaster.ManualQty,ItemMaster.ItemCode,ItemMaster.ItemName,
			du.Rate,du.BoxNo, du.TotalScanQty,DispatchDetailMaster.updated_at,DispatchDetailMaster.Code
            HAVING MAX(DispatchDetailMaster.DispatchMaster_Code) = p_DispatchMaster_Code;
	ELSEIF p_Mode = 'BOXDETAILS' THEN 
         SELECT DISTINCT
			OrderMaster.Code,
			ifnull(DispatchMaster.ChallanNoWithPrefix,'') As ChallanNo,
			DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%b/%Y')   AS 'ChallanDate',
			IFNULL(OrderMaster.BuyerPONo, '') AS 'OrderNo',
			OrderMaster.BuyerPONo,
			Concat(accountmaster.AccountName,'(',IFNULL(accountmaster.AccountCode,''),',',IFNULL(CityMaster.CityName,''),')') As AccountName,
			UserMaster.UserName AS 'PackedBy'
        FROM DispatchMaster 
        LEFT JOIN OrderMaster ON  DispatchMaster.OrderMaster_Code=OrderMaster.Code 
        LEFT JOIN AccountMaster ON OrderMaster.AccountMaster_Code = AccountMaster.Code
        LEFT JOIN addressmaster ON addressmaster.AccountMaster_Code = AccountMaster.Code
		LEFT JOIN CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
        LEFT JOIN UserMaster ON DispatchMaster.CreatedBy = Usermaster.Code
        WHERE DispatchMaster.Code = p_DispatchMaster_Code;
 
        SELECT 
			ROW_NUMBER() OVER (ORDER BY DispatchDetailMaster.updated_at DESC) AS `SNo`,
			dispatchupiiddetails.Code,itemmaster.ItemCode As 'Item Code',itemmaster.ItemName As 'Item Name',UPI_ID As 'UPI ID',Qty As 'Scan Qty',cast(dispatchupiiddetails.Rate AS double) As 'MRP',dispatchupiiddetails.BoxNo As 'Box No' From dispatchupiiddetails
			LEFT JOIN dispatchdetailmaster On dispatchdetailmaster.Code=dispatchupiiddetails.DispatchDetailMaster_Code
			LEFT JOIN itemmaster On itemmaster.Code=DispatchDetailMaster.itemmaster_Code
			Where dispatchdetailmaster.DispatchMaster_Code=p_DispatchMaster_Code;
    END IF; 
END
utf8mb4
utf8mb4_0900_ai_ci
utf8mb4_0900_ai_ci

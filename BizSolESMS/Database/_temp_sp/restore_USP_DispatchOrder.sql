*************************** 1. row ***************************
           Procedure: USP_DispatchOrder
            sql_mode: ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
    Create Procedure: CREATE DEFINER=`sa`@`%` PROCEDURE `USP_DispatchOrder`(
   IN p_Mode VARCHAR(20),
   IN P_UserMaster_Code INT,
   IN p_Code INT,
   IN p_jsonData JSON,
   IN p_jsonData1 JSON,
   IN p_AccountName Varchar(100),
   IN p_ItemName Varchar(100),
   IN p_OrderNoWithPrefix Varchar(100) 
)
BEGIN 
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_total INT;
    DECLARE v_DispatchMaster_Code INT;
    DECLARE v_ExistingCount INT DEFAULT 0;
    DECLARE v_ChallanNo INT DEFAULT 0;
    DECLARE v_DispatchQty INT DEFAULT 0;
    DECLARE v_FinYear varchar(10) DEFAULT '';
    DECLARE v_LastCode INT ;
    IF p_Mode = 'SAVE' THEN 
				SELECT UDF_GetCurentFinYear(JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].challanDate'))) INTO v_FinYear;
				SELECT COALESCE(MAX(ChallanNo), 0) INTO v_ChallanNo 
				FROM db_prabhu_main.DispatchMaster 
				WHERE FinYear = v_FinYear;
				-- Insert new DispatchMaster record
				INSERT INTO db_prabhu_main.DispatchMaster (
					ChallanNo,
					ChallanDate, 
					AccountMaster_Code, 
					VehicleNo, 
                    EmployeeMaster_Code,
					FinYear, 
					CreatedBy, 
					CreatedOn, 
					IsActive,
                    ChallanNoPrefix
				)
				VALUES (
					v_ChallanNo + 1, 
					JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].challanDate')), 
					(SELECT Code FROM db_prabhu_main.accountmaster WHERE AccountName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].clientName'))),
					JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].vehicleNo')), 
                    (SELECT Code FROM db_prabhu_main.employeemaster WHERE EmployeeName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData, '$[0].packedBy'))),
					v_FinYear, 
					p_UserMaster_Code, 
					NOW(),  
					'Y' ,
                    (SELECT ChallanNo FROM db_prabhu_main.PrefixConfiguration LIMIT 1)
				);
				 SET v_LastCode=LAST_INSERT_ID();
                SET v_total = JSON_LENGTH(p_jsonData1);

                WHILE v_counter < v_total DO
                    INSERT INTO db_prabhu_main.DispatchDetailMaster (
                        DispatchMaster_Code, ItemMaster_Code, OrderNo, DispatchQty,QtyBox, 
                        Rate, Amount, Remarks
                    )
                    VALUES (v_LastCode,
                        (SELECT Code 
                         FROM db_prabhu_main.itemmaster 
                         WHERE ItemName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].itemName')))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].orderNo'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].dispatchQty'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].qtyBox'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].rate'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].amount'))),
                        JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].remarks')))
                    );
					Select DispatchQty Into v_DispatchQty From db_prabhu_main.OrderDetailMaster
					WHERE ItemMaster_Code = (SELECT Code FROM db_prabhu_main.itemmaster WHERE ItemName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].itemName'))))
					AND OrderMaster_Code = (SELECT Code FROM db_prabhu_main.OrderMaster WHERE OrderNo = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].orderNo'))));
				    
                    UPDATE db_prabhu_main.OrderDetailMaster
					SET DispatchQty = (JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].dispatchQty')))+v_DispatchQty)
					WHERE ItemMaster_Code = (SELECT Code FROM db_prabhu_main.itemmaster WHERE ItemName = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].itemName'))))
					AND OrderMaster_Code = (SELECT Code FROM db_prabhu_main.OrderMaster WHERE OrderNo = JSON_UNQUOTE(JSON_EXTRACT(p_jsonData1, CONCAT('$[', v_counter, '].orderNo'))));

                    SET v_counter = v_counter + 1;
                END WHILE;
                SELECT 'Data Saved Successfully' AS Msg, 'Y' AS Status;
    ELSEIF p_Mode = 'DELETE' THEN
    
		UPDATE OrderDetailMaster
		JOIN DispatchDetailMaster ON OrderDetailMaster.OrderMaster_Code = DispatchDetailMaster.OrderMaster_Code
        And DispatchDetailMaster.ItemMaster_Code= OrderDetailMaster.ItemMaster_Code
		SET OrderDetailMaster.DispatchQty = (OrderDetailMaster.DispatchQty-DispatchDetailMaster.DispatchQty)
		WHERE DispatchDetailMaster.DispatchMaster_Code = p_Code;
        
        DELETE FROM db_prabhu_main.DispatchDetailMaster WHERE DispatchMaster_Code = p_Code;
        DELETE FROM db_prabhu_main.DispatchMaster WHERE Code = p_Code;
        SELECT 'Data Deleted Successfully' AS Msg, 'Y' AS Status;
        
    ELSEIF p_Mode = 'SHOWDATA' THEN
        SELECT 
            DispatchMaster.Code,
            DispatchMaster.ChallanNo,
            DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%m/%Y')ChallanDate,
            DispatchMaster.VehicleNo,
			accountmaster.AccountName, 
           employeemaster.EmployeeName AS 'PackedBy',
			CONCAT(addressmaster.AddressLine1,', ',CityMaster.CityName,', ',
			StateMaster.StateName,', ',addressmaster.GSTIN,', ',addressmaster.MobileNo) AS Address
        FROM db_prabhu_main.DispatchMaster 
        LEFT JOIN db_prabhu_main.AccountMaster ON DispatchMaster.AccountMaster_Code = AccountMaster.Code
        LEFT JOIN addressmaster  addressmaster ON addressmaster.AccountMaster_Code = accountmaster.Code
		LEFT JOIN CityMaster CityMaster ON addressmaster.CityMaster_Code = CityMaster.Code
		LEFT JOIN StateMaster StateMaster ON addressmaster.StateMaster_Code = StateMaster.Code
       LEFT JOIN db_prabhu_main.employeemaster ON DispatchMaster.EmployeeMaster_Code = employeemaster.Code
        WHERE DispatchMaster.Code = p_Code;

        SELECT 
            DispatchDetailMaster.Code,
            DispatchDetailMaster.OrderNo,
            DispatchDetailMaster.QtyBox,
            DispatchDetailMaster.DispatchQty,
            DispatchDetailMaster.Rate,
            DispatchDetailMaster.Amount,
            DispatchDetailMaster.Remarks,
            itemmaster.ItemBarCode,
            UOMMaster.UOMName,
            itemmaster.ItemCode,
            itemmaster.ItemName,
            locationMaster.LocationName
        FROM db_prabhu_main.DispatchDetailMaster
        LEFT JOIN db_prabhu_main.itemmaster ON DispatchDetailMaster.ItemMaster_Code = itemmaster.Code
        LEFT JOIN db_prabhu_main.UOMMaster ON itemmaster.UOMMaster_Code = UOMMaster.Code
        LEFT JOIN db_prabhu_main.locationMaster ON itemmaster.locationMaster_Code = locationMaster.Code
        WHERE DispatchDetailMaster.DispatchMaster_Code =p_Code;

    ELSEIF p_Mode = 'LOCATE' THEN
			SELECT 
			ROW_NUMBER() OVER (ORDER BY mm.Code) AS `SNo`,
			mm.Code,
			DATE_FORMAT(IFNULL(mm.ChallanDate, ''), '%d/%b/%Y') AS `Packing Date`,
			mm.ChallanNoWithPrefix AS `Packing No`,
			mm.VehicleNo AS `Vehicle No`,
			am.AccountName AS `Client Name`,
			COALESCE(employeemaster.EmployeeName, '') AS 'PackedBy',
			CONCAT(
			IFNULL(ad.AddressLine1, ''), ', ',
			IFNULL(cm.CityName, ''), ', ',
			IFNULL(sm.StateName, ''), ', ',
			IFNULL(ad.GSTIN, ''), ', ',
			IFNULL(ad.MobileNo, '')
			) AS `Address`
			FROM 
			db_prabhu_main.DispatchMaster AS mm
			LEFT JOIN  db_prabhu_main.AccountMaster AS am ON mm.AccountMaster_Code = am.Code
			LEFT JOIN  addressmaster AS ad ON ad.AccountMaster_Code = am.Code And ad.IsDefault='Y'
			LEFT JOIN  CityMaster AS cm ON ad.CityMaster_Code = cm.Code
			LEFT JOIN  StateMaster AS sm ON ad.StateMaster_Code = sm.Code
            LEFT JOIN db_prabhu_main.employeemaster ON DispatchMaster.EmployeeMaster_Code = employeemaster.Code;
	ELSEIF p_Mode = 'GETORDERNO' THEN
			Select OrderNo,OrderNoWithPrefix From db_prabhu_main.OrderMaster 
            LEFT JOIN AccountMaster On AccountMaster.Code=OrderMaster.AccountMaster_Code
            Where AccountName=p_AccountName;
            
	ELSEIF p_Mode = 'GETCLIENT' THEN
		 SELECT  
				ROW_NUMBER() OVER (ORDER BY om.OrderDate,om.Code DESC) AS `SNo`, 
				om.Code,
				IFNULL(om.BuyerPONo, '') AS 'Order No',
				am.AccountName AS 'Client Name',
				DATE_FORMAT(om.OrderDate, '%d/%m/%Y') AS 'Order Date',
				SUM(odm.OrderQty) AS 'TOQ',
				(SUM(odm.OrderQty) - (SUM(odm.DispatchQty) + SUM(odm.CancelQty))) AS 'TBQ',
                IFNULL(om.Remark,'') As Remark
			FROM OrderMaster om
			LEFT JOIN orderdetailmaster odm ON odm.OrderMaster_Code = om.Code
			LEFT JOIN AccountMaster am ON am.Code = om.AccountMaster_Code
			WHERE 
				NOT EXISTS (
					SELECT 1 
					FROM dispatchmaster d
					WHERE d.OrderMaster_Code = om.Code
					  AND (d.Completed IS NULL OR d.Completed <> 'Y')
				) AND FIND_IN_SET(om.WarehouseMaster_Code, UDF_GetWarehouseMaster_Codes(p_UserMaster_Code))
			GROUP BY om.Code, om.OrderNoWithPrefix, om.BuyerPONo, am.AccountName,om.WarehouseMaster_Code
			HAVING (SUM(odm.OrderQty) - (SUM(odm.DispatchQty) + SUM(odm.CancelQty))) > 0 AND am.AccountName <> '';
   ELSEIF p_Mode = 'DespatchTransit' THEN
    SELECT 
        ROW_NUMBER() OVER (ORDER BY OrderMaster.Code desc) AS `SNo`,
        OrderMaster.Code,
        IFNULL(OrderMaster.BuyerPONo, '') AS 'Order No',
		dispatchmaster.Code As 'D_Code',
        AccountMaster.AccountName AS 'Client Name',
        dispatchmaster.ChallanNoWithPrefix AS 'Packing No',
        DATE_FORMAT(dispatchmaster.ChallanDate, '%d/%m/%Y') AS 'Packing Date',
        -- OrderMaster.OrderNoWithPrefix AS 'Order No',
        SUM(dispatchdetailmaster.DispatchQty) AS 'TDQ',
        IFNULL(OrderMaster.Remark,'') As Remark
       -- COALESCE(employeemaster.EmployeeName, '') AS 'PackedBy'
		FROM db_prabhu_main.OrderMaster 
		LEFT JOIN dispatchmaster ON dispatchmaster.OrderMaster_Code = OrderMaster.Code
		LEFT JOIN dispatchdetailmaster ON dispatchdetailmaster.DispatchMaster_Code = dispatchmaster.Code
		LEFT JOIN AccountMaster ON AccountMaster.Code = OrderMaster.AccountMaster_Code
      --  LEFT JOIN db_prabhu_main.employeemaster ON dispatchmaster.EmployeeMaster_Code = employeemaster.Code
		WHERE 
       -- p_AccountName IS NULL OR p_AccountName = 'All'  OR AccountMaster.AccountName = p_AccountName AND 
        dispatchmaster.Completed='N' AND FIND_IN_SET(OrderMaster.WarehouseMaster_Code, UDF_GetWarehouseMaster_Codes(p_UserMaster_Code))
		GROUP BY 
        OrderMaster.Code,
        dispatchmaster.Code,
        OrderMaster.OrderNoWithPrefix,
        OrderMaster.BuyerPONo,
        AccountMaster.AccountName,
        dispatchmaster.ChallanNo,
        OrderMaster.WarehouseMaster_Code,
        dispatchmaster.ChallanDate;
      --  employeemaster.EmployeeName;
        
	ELSEIF p_Mode = 'CompletedDespatch' THEN
		SELECT 
		ROW_NUMBER() OVER (ORDER BY OrderMaster.Code desc) AS `SNo`,
		OrderMaster.Code,
		IFNULL(OrderMaster.BuyerPONo,'') AS 'Order No',
        dispatchmaster.Code As 'D_Code',
		AccountMaster.AccountName AS 'Client Name',
		dispatchmaster.ChallanNoWithPrefix AS 'Packing No',
		DATE_FORMAT(dispatchmaster.CompletedDate, '%d/%m/%Y') AS 'Packed Date',
		-- OrderMaster.OrderNoWithPrefix AS 'Order No',
		SUM(dispatchdetailmaster.DispatchQty) AS 'TDQ',
	    COALESCE(UserMaster.UserName, '') AS 'Packed By',
		'Ready For Dispatch' AS Status,
        IFNULL(OrderMaster.Remark,'') As Remark
		FROM db_prabhu_main.OrderMaster 
		LEFT JOIN dispatchmaster ON dispatchmaster.OrderMaster_Code = OrderMaster.Code
		LEFT JOIN dispatchdetailmaster ON dispatchdetailmaster.DispatchMaster_Code = dispatchmaster.Code
		LEFT JOIN AccountMaster ON AccountMaster.Code = OrderMaster.AccountMaster_Code
        LEFT JOIN UserMaster ON UserMaster.Code = dispatchmaster.CreatedBy
		-- LEFT JOIN db_prabhu_main.employeemaster ON dispatchmaster.EmployeeMaster_Code = employeemaster.Code
		WHERE
        -- p_AccountName IS NULL OR p_AccountName = 'All' OR AccountMaster.AccountName = p_AccountName  AND
        dispatchmaster.Completed='Y' AND FIND_IN_SET(OrderMaster.WarehouseMaster_Code, UDF_GetWarehouseMaster_Codes(p_UserMaster_Code))
		GROUP BY 
		OrderMaster.Code,
		dispatchmaster.Code,
		OrderMaster.OrderNoWithPrefix,
		OrderMaster.BuyerPONo,
		AccountMaster.AccountName,
		dispatchmaster.ChallanNo,
        OrderMaster.WarehouseMaster_Code,
		dispatchmaster.ChallanDate;
       -- employeemaster.EmployeeName;
        
    ELSEIF p_Mode = 'GETITEMDETAIL' THEN
			SELECT 
			itemmaster.Code,OrderMaster.OrderNo,
			itemmaster.ItemCode,
			itemmaster.ItemName,
			itemmaster.ItemBarCode,
			UOMMaster.UomName,
			locationmaster.locationName,
			orderdetailmaster.Rate,
            itemmaster.QtyInBox, 
			(orderdetailmaster.OrderQty+orderdetailmaster.CancelQty-orderdetailmaster.DispatchQty) As OrderQty
			FROM db_prabhu_main.OrderMaster 
			LEFT JOIN  db_prabhu_main.orderdetailmaster ON orderdetailmaster.OrderMaster_Code = OrderMaster.Code 
			LEFT JOIN db_prabhu_main.ItemMaster ON orderdetailmaster.ItemMaster_Code = ItemMaster.Code 
			LEFT JOIN  db_prabhu_main.UOMMaster ON itemMaster.UOMMaster_Code = UOMMaster.Code 
			LEFT JOIN db_prabhu_main.locationmaster ON itemmaster.LocationMaster_Code = locationmaster.Code 
			WHERE OrderMaster.OrderNoWithPrefix=p_OrderNoWithPrefix;
      ELSEIF p_Mode = 'GETCode' THEN
             update dispatchmaster set dispatchmaster.Completed ='Y',CompletedDate=Now()  Where dispatchmaster.Code = p_Code;
			 SELECT 'Updated Completed Successfully' AS Msg, 'Y' AS Status;
	  ELSEIF p_Mode = 'DISPATCHREPORT' THEN
			SELECT DISTINCT 
					OrderMaster.buyerPoNo AS `Order No`,
					CONCAT(AccountMaster.AccountName, '(', AccountMaster.AccountCode, ')') AS `Client Name`,
					DATE_FORMAT(DispatchMaster.ChallanDate, '%d/%m/%Y') AS `Packed Date`,
					ItemMaster.ItemCode AS `Item Code`,
					ItemMaster.ItemName AS `Item Name`,
					orderdetailmaster.OrderQty AS `Order Qty`,
					SUM(DispatchUpiidDetails.Qty) AS `Scan Qty`,
					DispatchUpiidDetails.Rate AS `MRP`,
                    SUM(DispatchUpiidDetails.Rate) As `Total Value`,
					DispatchUpiidDetails.BoxNo AS `Box No`,
					UserMaster.UserName AS `Packed By`,
                    IFNULL(OrderMaster.Remark,'') As Remark
				FROM DispatchMaster
				LEFT JOIN DispatchDetailMaster 
					ON DispatchMaster.Code = DispatchDetailMaster.DispatchMaster_Code
				LEFT JOIN DispatchUpiidDetails 
					ON DispatchDetailMaster.Code = DispatchUpiidDetails.DispatchDetailMaster_Code
				LEFT JOIN AccountMaster 
					ON AccountMaster.Code = DispatchMaster.AccountMaster_Code
				LEFT JOIN UserMaster 
					ON UserMaster.Code = DispatchMaster.CreatedBy
				LEFT JOIN ItemMaster  
					ON ItemMaster.Code = DispatchDetailMaster.ItemMaster_Code
				LEFT JOIN OrderMaster 
					ON OrderMaster.Code = DispatchMaster.OrderMaster_Code
				LEFT JOIN orderdetailmaster 
					ON orderdetailmaster.OrderMaster_Code = OrderMaster.Code 
					AND DispatchDetailMaster.ItemMaster_Code = orderdetailmaster.ItemMaster_Code
				WHERE DispatchMaster.Code = p_Code
				GROUP BY 
					OrderMaster.buyerPoNo,
					AccountMaster.AccountName,
					AccountMaster.AccountCode,
					DispatchMaster.ChallanDate,
					ItemMaster.ItemCode,
					ItemMaster.ItemName,
					orderdetailmaster.OrderQty,
					DispatchDetailMaster.DispatchQty,
					DispatchUpiidDetails.Rate,
					DispatchUpiidDetails.BoxNo,
					UserMaster.UserName,
                    OrderMaster.Remark;
    END IF; 
END
character_set_client: utf8mb4
collation_connection: utf8mb4_0900_ai_ci
  Database Collation: utf8mb4_0900_ai_ci

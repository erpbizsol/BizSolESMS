var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let JsonData = [];
let AccountList = [];
let ItemDetail = [];
let G_OrderData = [];
$(document).ready(function () {
    DatePicker();
    $("#ERPHeading").text("Order Entry");
    $('#txtOrderNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOrderDate").focus();
        }

    });

    $('#txtOrderDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtClientName").focus();
        }
    });
    $('#txtClientName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtBuyerPONo").focus();
        }
    });
    $('#txtBuyerPONo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtBuyerPODate").focus();
        }
    });
    $('#txtBuyerPODate').on('keydown', function (e) {
        if (e.key === "Enter") {
            let firstInput = $('#tblorderbooking #Orderdata tr:first input').first();
            firstInput.focus();
        }
    });
    GetAccountMasterList();
    GetWareHouseList();
    GetItemDetails();
    ShowOrderMasterlist('Load');
    $("#btnAddNewRow").click(function () {
        addNewRow();
    });
    GetModuleMasterCode();
    $("#txtClientName").on("change", function () {

        let value = $(this).val();
        let isValid = false;
        $("#txtClientName option").each(function () {
            if ($(this).val() === value) {
                const item = AccountList.find(entry => entry.AccountName == value);
                $("#txtAddress").val(item.Address)
                isValid = true;
                return false;
            }
        });
        
        if (!isValid) {
            $(this).val("");
            $("#txtAddress").val("")
        }
    });
    $("#txtExcelFile").on("change", function (e) {
        Import(e);
    });
    $("#txtClientType").on("change", function () {
        var value = $(this).val();
        if (value == 'S') {
            $("#txtImportClientName").prop("disabled", false);
            $("#txtImportOrderNo").prop("disabled", false);
        } else {
            SelectOptionByText('txtImportClientName', 'Select');
            $("#txtImportClientName").prop("disabled", true);
            $("#txtImportOrderNo").val("");
            $("#txtImportOrderNo").prop("disabled", true);
        }
    });
    $("#txtImportClientName").on("change", function () {
        $("#txtExcelFile").val('');
        JsonData = [];
    });
    $("#txtSearch").on("input", function () {
        const searchValue = $(this).val().toLowerCase().trim();
        filteredData = G_OrderData.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
        );
        const StringFilterColumn = ["Client Name"];
        const NumericFilterColumn = [];
        const DateFilterColumn = ["Order Date", "Buyer PO Date"];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        const ColumnAlignment = {
            "Reorder Level": 'right',
            "Reorder Qty": 'right',
            "Qty In Box": 'right',
        };
        const updatedResponse = filteredData.map(item => ({
            ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Order Date`]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    <button class="btn btn-info icon-height mb-1" title="Print" onclick="PrintOrderPicking('${item.Code}')"><i class="fa fa-print"></i></button>
                    `
        }));
        if (filteredData.length === 0) {
            $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
            return;
        }
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
            window.applyEsmsLevelOfOrderNoLabelsToDom();
        }
    });
    $("#thItemBarcode").text(G_ItemConfig[0].ItembarcodeHeader ? G_ItemConfig[0].ItembarcodeHeader : 'Item Barcode');
    $("#thItemCode").text(G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code');
    $("#thItemName").text(G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name');

    if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
        window.applyEsmsLevelOfOrderNoLabelsToDom();
    }

});
function ShowOrderMasterlist(Type) {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowOrderMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                G_OrderData = response;
                unblockUI();
                $("#txtordertable").show();
                const StringFilterColumn = ["Client Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["Order Date", "Buyer PO Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "Qty In Box": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Order Date`]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    <button class="btn btn-info icon-height mb-1" title="Print" onclick="PrintOrderPicking('${item.Code}')"><i class="fa fa-print"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
                    window.applyEsmsLevelOfOrderNoLabelsToDom();
                }

            } else {
                unblockUI();
                $("#txtordertable").hide();
                if (Type != 'Load') {
                    toastr.error("Record not found...!");
                }
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", error);
        }
    });

}

/** Keeps Save/Back toolbars in sync — list vs create/edit/view vs import (duplicate ids caused hidden buttons). */
function setOrderMasterNewToolbar(mode) {
    const isList = mode === 'list';
    const isImport = mode === 'import';
    const isCreateMode = mode === 'create' || mode === 'edit' || mode === 'view';

    $("#txtheaderdiv").toggle(isCreateMode);
    $("#txtheaderdiv2").toggle(isImport);

    if (isCreateMode) {
        $("#txtheaderdiv .icon-tab a").show().css({ display: '', pointerEvents: 'auto' });
        $("#btnBackCreate").show().css({ display: '', pointerEvents: 'auto' });
        if (mode === 'view') {
            $("#txtsave").hide();
        } else {
            $("#txtsave").show().prop("disabled", false);
        }
    }

    if (isImport) {
        $("#txtheaderdiv2 .icon-tab a").show().css({ display: '', pointerEvents: 'auto' });
        $("#btnImport").show().prop("disabled", false);
        $("#btnBackImport").show().css({ display: '', pointerEvents: 'auto' });
    }

    if (isList) {
        $("#txtheaderdiv").hide();
        $("#txtheaderdiv2").hide();
    }
}

async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tabOrderToolbar").text("NEW");
    $("#txtListpage").hide();
    $("#txtImportPage").hide();
    $("#txtCreatepage").show();
    setOrderMasterNewToolbar('create');
    $("#Orderdata").empty();
    addNewRow();
    disableFields(false);
    $("#txtOrderDate").prop("disabled", false);
    $("#txtClientName").prop("disabled", false);
    $("#txtBuyerPONo").prop("disabled", false);
    $("#txtBuyerPODate").prop("disabled", false);
    $("#txtRemark").prop("disabled", false);
    $("#txtWarehouse").prop("disabled", false);
    if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
        window.applyEsmsLevelOfOrderNoLabelsToDom();
    }
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtImportPage").hide();
    setOrderMasterNewToolbar('list');
    ClearData();
    disableFields(false);
    $("#txtOrderDate").prop("disabled", false);
    $("#txtClientName").prop("disabled", false);
    $("#txtBuyerPONo").prop("disabled", false);
    $("#txtBuyerPODate").prop("disabled", false);
    $("#txtRemark").prop("disabled", false);
    $("#txtWarehouse").prop("disabled", false);
    $("#txtsave").prop("disabled", false);
    $("#txtSearch").val("");
    ShowOrderMasterlist('Load');
}

async function Edit(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tabOrderToolbar").text("EDIT");
    $("#txtListpage").hide();
    $("#txtImportPage").hide();
    $("#txtCreatepage").show();
    setOrderMasterNewToolbar('edit');
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowOrderMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    $("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtOrderDate").val(OrderMaster.OrderDate || "");
                    SelectOptionByText('txtClientName', OrderMaster.AccountName);
                    $("#txtClientName").val(OrderMaster.AccountName || "");
                    $("#txtAddress").val(OrderMaster.Address || "");
                    $("#txtBuyerPONo").val(OrderMaster.BuyerPONo || "");
                    $("#txtBuyerPODate").val(OrderMaster.BuyerPODate || "");
                    $("#txtRemark").val(OrderMaster.Remark || "");
                    $("#txtWarehouse").val(OrderMaster.WarehouseMaster_Code || "").trigger('change').prop("disabled", false);
                    disableFields(false);
                    $("#txtsave").prop("disabled", false);
                    const item = AccountList.find(entry => entry.AccountName == OrderMaster.AccountName);
                    if (!item) {
                        var newData = { Code: 0, AccountName: OrderMaster.AccountName, Address: OrderMaster.Address }
                        AccountList.push(newData);
                    }
                    CreateVendorlist();
                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    response.OrderDetial.forEach(function (address, index) {

                        addNewRowEdit(index, address);
                    });
                } else {
                    toastr.info("No addresses available for this account.");
                }
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}

async function deleteItem(code, Order) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
        $(this).addClass('highlight');
    });
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'ordermaster');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this Order ${Order} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/DeleteOrderMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowOrderMasterlist('Get');
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:");

            }
        });
    }
    else {
        $('tr').removeClass('highlight');
    }
    $('tr').removeClass('highlight');
}
function GetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsClientDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                AccountList = response;
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["AccountName"] + '">' + val["AccountName"] + '</option>';
                });

                $('#txtImportClientName')[0].innerHTML = option;
                $('#txtClientName')[0].innerHTML = option;

                $('#txtImportClientName,#txtClientName').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtImportClientName').empty();
                $('#txtClientName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtImportClientName').empty();
            $('#txtClientName').empty();
        }
    });
}
function GetWareHouseList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetWareHouseDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                response.forEach(item => {
                    option += '<option value="' + item.Code + '">' + item.Name + '</option>';
                });
                $('#txtWarehouse')[0].innerHTML = option;
                $('#txtImportWarehouse')[0].innerHTML = option;
                $('#txtWarehouse,#txtImportWarehouse').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtWarehouse').empty();
                $('#txtImportWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').empty();
            $('#txtImportWarehouse').empty();
        }
    });
}
function GetItemDetails() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                ItemDetail = response;
                $('#txtItemBarCode').empty();
                $('#txtItemCode').empty();
                $('#txtItemName').empty();
                let options1 = '';
                let options2 = '';
                let options3 = '';
                response.forEach(item => {
                    options1 += '<option value="' + item.ItemBarCode + '" text="' + item.Code + '"></option>';
                    options2 += '<option value="' + item.ItemCode + '" text="' + item.Code + '"></option>';
                    options3 += '<option value="' + item.ItemName + ' (' + item.ItemCode + ')" text="' + item.Code + '"></option>';
                });
                $('#txtItemBarCode').html(options1);
                $('#txtItemCode').html(options2);
                $('#txtItemName').html(options3);
            } else {
                $('#txtItemBarCode').empty();
                $('#txtItemCode').empty();
                $('#txtItemName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryNameList').empty();
        }
    });
}
function isBuyerPONoMandatory() {
    if (typeof window.esmsIsBuyerPONoMandatory === 'function') {
        return window.esmsIsBuyerPONoMandatory();
    }
    try {
        var fp = JSON.parse(sessionStorage.getItem('Fixparameter'));
        var row = Array.isArray(fp) ? fp[0] : fp;
        if (!row) return true;
        var v = row.IsShowOrderNo != null ? row.IsShowOrderNo : row.isShowOrderNo;
        return String(v || '').trim().toUpperCase() !== 'Y';
    } catch (e) {
        return true;
    }
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtOrderNo").val("");
    $("#txtAddress").val("");
    $("#txtBuyerPONo").val("");
    $("#txtRemark").val("");
    $("#Orderdata").empty();
    SelectOptionByText('txtClientName', 'Select');
    $("#txtWarehouse").val("").trigger('change');
}
function Save() {
    var OrderNo = $("#txtOrderNo").val();
    var OrderDate = $("#txtOrderDate").val();
    var ClientName = $("#txtClientName").val();
    var BuyerPONo = $("#txtBuyerPONo").val();
    var BuyerPODate = $("#txtBuyerPODate").val();
    var Remark = $("#txtRemark").val();
    var Warehouse = $("#txtWarehouse").val();

    if (!OrderDate) {
        toastr.error(typeof window.esmsPleaseSelectOrderDateMsg === 'function' ? window.esmsPleaseSelectOrderDateMsg() : "Please Select an Order Date!");
        $("#txtOrderDate").focus();
        return;
    } else if (!ClientName) {
        toastr.error("Please enter a Client Name!");
        $("#txtClientName").focus();
        return;
    } else if (!Warehouse) {
        toastr.error("Please select a Warehouse!");
        $("#txtWarehouse").focus();
        return;
    }
    else if (isBuyerPONoMandatory() && !BuyerPONo) {
        toastr.error(typeof window.esmsPleaseEnterBuyerPONoMsg === 'function' ? window.esmsPleaseEnterBuyerPONoMsg() : "Please enter a Buyer PO No!");
        $("#txtBuyerPONo").focus();
        return;
    }
    else if (!BuyerPODate) {
        toastr.error(typeof window.esmsPleaseSelectBuyerPODateMsg === 'function' ? window.esmsPleaseSelectBuyerPODateMsg() : "Please Select a Buyer PO Date!");
        $("#txtBuyerPODate").focus();
        return;
    }
    let validationFailed = false;
    let CheckItemName = false;
    let lastRow = $('#tblorderbooking #Orderdata tr').length;
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        if (lastRow > 1) {
            CheckItemName = row.find(".txtItemName").val() !== '';
        }
        else if (lastRow === 1) {
            CheckItemName = true;
        }
        if (CheckItemName) {
            if (row.find(".txtItemBarCode").val() == '') {
                toastr.error("Please select Item Bar Code !");
                row.find(".txtItemBarCode").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtItemCode").val() == '') {
                toastr.error("Please select Item Code !");
                row.find(".txtItemCode").focus();
                validationFailed = true;
                return;
            }
            //else if (row.find(".txtItemAddress").val() == '') {
            //    toastr.error("Please select Item Address !");
            //    row.find(".txtItemAddress").focus();
            //    validationFailed = true;
            //    return;
            //}
            else if (row.find(".txtOrderQty").val() == '') {
                toastr.error("Please enter Order Qty !");
                row.find(".txtOrderQty").focus();
                validationFailed = true;
                return;
            }
        }
    });
    if (validationFailed) {
        return;
    }
    const accountPayload = [{
        Code: $("#hfCode").val(),
        OrderNo: $("#txtOrderNo").val(),
        OrderDate: convertDateFormat($("#txtOrderDate").val()),
        ClientName: $("#txtClientName").val(),
        BuyerPONo: $("#txtBuyerPONo").val(),
        BuyerPODate: convertDateFormat($("#txtBuyerPODate").val()),
        Remark: Remark,
        WarehouseMaster_Code: Warehouse
    }];
    const addressData = [];
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        if (row.find(".txtItemName").val() != '') {
            const addressRow = {
                ItemCode: row.find(".txtItemCode").val(),
                QtyBox: row.find(".txtQtyBox").val() || 0,
                OrderQty: row.find(".txtOrderQty").val(),
                Rate: row.find(".txtRate").val()||0,
                Amount: row.find(".txtAmount").val()||0,
                Remarks: row.find(".txtRemarks").val(),
            };
            addressData.push(addressRow);
        }
    });

    const payload = {
        OrderMaster: accountPayload,
        OrderDetial: addressData,
    };
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/InsertOrderMaster?UserMaster_Code=${UserMaster_Code}`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                unblockUI();
                setTimeout(() => {
                    toastr.success(response.Msg);
                    ShowOrderMasterlist('Get');
                    BackMaster();
                }, 1000);
            } else {
                unblockUI();
                toastr.error(response.Msg);
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function addNewRowEdit(index, address) {
    const rowCount = index + 1;
    const table = document.getElementById("Orderdata");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
           <td><input type="text" list="txtItemBarCode" onfocusout="CheckItemBarCode(this);" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" onfocusout="CheckItemCode(this);" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" onfocusout="CheckItemName(this);" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"oninput="SetvalueBillQtyBox(this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  oninput="CalculateAmount(this);" id="txtOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);"  id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" disabled/></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
              <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
    `;
    //<td><input type="button" class="btn btn-danger btn-sm deleteRow"/><i class="fa-regular fa-circle-xmark"></i></td>
    table.appendChild(newRow);

    if (address !== undefined) {
        const item = ItemDetail.find(entry => entry.ItemName == address.ItemName);
        const isDisabled = item ? item.QtyInBox === 0 : false;
        $("#txtUOM_" + rowCount).val(address.UOMName || "");
        $("#txtItemAddress_" + rowCount).val(address.LocationName || "");
        $("#txtItemBarCode_" + rowCount).val(address.ItemBarCode || "");
        $("#txtItemCode_" + rowCount).val(address.ItemCode || "");
        $("#txtItemName_" + rowCount).val(address.ItemName || "");
        $("#txtQtyBox_" + rowCount).val(address.QtyBox || "");
        $("#txtQtyBox_" + rowCount).prop("disabled", isDisabled);
        $("#txtOrderQty_" + rowCount).val(address.OrderQty || "");
        $("#txtRate_" + rowCount).val(address.Rate || "");
        $("#txtAmount_" + rowCount).val(address.Amount);
        $("#txtRemarks_" + rowCount).val(address.Remarks || "");
    }
}
function OnChangeNumericTextBox(element) {

    element.value = element.value.replace(/[^0-9]/g, "");
    if (Number.isInteger(parseInt(element.value)) == true) {
        element.setCustomValidity("");

    } else {
        element.setCustomValidity("Only allowed Numbers");
    }
    element.reportValidity();
}
function OnKeyDownPressFloatTextBox(event, element) {
    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Float Numbers");
        element.reportValidity();
        return false;
    }
}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}
function addNewRow() {
    let rowCount = 0;
    const table = document.getElementById("tblorderbooking").querySelector("tbody");
    const rows = table.querySelectorAll("tr");
    const lastRow = rows[rows.length - 1];
    if (rows.length > 0) {
        if (!isRowComplete(lastRow)) {
            alert("Please fill in all mandatory fields in the current row before adding a new row.");
        } else {
            rowCount = rows.length;
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
            <td><input type="text" list="txtItemBarCode" onfocusout="CheckItemBarCode(this);" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" onfocusout="CheckItemCode(this);" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" onfocusout="CheckItemName(this);" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"oninput="SetvalueBillQtyBox(this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  oninput="CalculateAmount(this);" id="txtOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" disabled/></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" list="txtItemBarCode" onfocusout="CheckItemBarCode(this);" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" onfocusout="CheckItemCode(this);" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" onfocusout="CheckItemName(this);" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm " id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm " id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"oninput="SetvalueBillQtyBox(this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  oninput="CalculateAmount(this);" id="txtOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm  text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);"  id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm  text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" disabled/></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
      `;
        table.appendChild(newRow);
    }
}

$(document).on("click", ".deleteRow", function () {
    const row = $(this).closest("tr");
    const table = document.getElementById("tblorderbooking").querySelector("tbody");

    if (table.querySelectorAll("tr").length > 1) {
        ConfrmationMaltipal(row);

    } else {
        alert("At least one row is required.");
    }
    //const table = document.getElementById("tblorderbooking").querySelector("tbody");
    //if (table.querySelectorAll("tr").length > 1) {
    //    $(this).closest("tr").remove();
    //} else {
    //    alert("At least one row is required.");
    //}
});
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Order Entry");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day} -${monthAbbreviation} -${year}`;
}
function setupDateInputFormatting() {
    $('#txtBuyerPODate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);
        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
    $('#txtOrderDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);
        if (value.length === 10) {
            validateChallanDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateChallanDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtBuyerPODate').val('');

        }
    } else {
        $('#txtBuyerPODate').val('');

    }
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtOrderDate').val('');

        }
    } else {
        $('#txtOrderDate').val('');

    }
}
function DatePicker() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            let apiDate = response[0].Date;
            $('#txtOrderDate, #txtBuyerPODate').val(apiDate);

            $('#txtOrderDate, #txtBuyerPODate').datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
                orientation: 'bottom auto',
                todayHighlight: true
            }).on('show', function () {
                let $input = $(this);
                let inputOffset = $input.offset();
                let inputHeight = $input.outerHeight();
                let inputWidth = $input.outerWidth();
                setTimeout(function () {
                    let $datepicker = $('.datepicker-dropdown');
                    $datepicker.css({
                        width: inputWidth + 'px',
                        top: (inputOffset.top + inputHeight) + 'px',
                        left: inputOffset.left + 'px'
                    });
                }, 10);
            });
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function FillallItemfield(inputElement, value) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const Amount = currentRow.querySelector(".txtAmount");
        const QtyBox = currentRow.querySelector(".txtQtyBox");
        const OrderQty = currentRow.querySelector(".txtOrderQty");
        if (value == 'BarCode') {
            $("#txtItemBarCode option").each(function () {
                if ($(this).val() === inputValue) {
                    const item = ItemDetail.find(entry => entry.ItemBarCode == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
                    Amount.value = '';
                    const isDisabled = item.QtyInBox === 0;
                    QtyBox.value = '';
                    OrderQty.value = '';
                    QtyBox.disabled = isDisabled;

                    isValid = true;
                    return false;
                } else {
                    itemBarCode.value = "";
                    itemCode.value = "";
                    itemName.value = "";
                    itemAddress.value = "";
                    itemUOM.value = "";
                }
            });
        }
        if (value == 'ItemCode') {
            $("#txtItemCode option").each(function () {
                if ($(this).val() === inputValue) {
                    const item = ItemDetail.find(entry => entry.ItemCode == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
                    Amount.value = '';
                    const isDisabled = item.QtyInBox === 0;
                    QtyBox.value = '';
                    OrderQty.value = '';
                    QtyBox.disabled = isDisabled;
                    isValid = true;
                    return false;
                } else {
                    itemBarCode.value = "";
                    itemCode.value = "";
                    itemName.value = "";
                    itemAddress.value = "";
                    itemUOM.value = "";
                }
            });
        }
        if (value == 'ItemName') {
            $("#txtItemName option").each(function () {
                if ($(this).val() === inputValue) {
                    const item = ItemDetail.find(entry => (entry.ItemName + ' (' + entry.ItemCode + ')') === inputValue)
                        || ItemDetail.find(entry => entry.ItemName == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
                    Amount.value = '';
                    const isDisabled = item.QtyInBox === 0;
                    QtyBox.value = '';
                    OrderQty.value = '';
                    QtyBox.disabled = isDisabled;
                    isValid = true;
                    return false;
                } else {
                    itemBarCode.value = "";
                    itemCode.value = "";
                    itemName.value = "";
                    itemAddress.value = "";
                    itemUOM.value = "";
                }
            });
        }
        const selectedItem = ItemDetail.find(entry => entry.ItemCode == itemCode.value);
        if (selectedItem && selectedItem.Code) {
            GetRate($("#txtClientName").val(), selectedItem.Code).then(response => {
                itemRate.value = response[0].Rate;
            }).catch(error => {
                console.error('Error fetching rate:', error);
            });
        }
    }
}
function CalculateAmount(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const BillQty = currentRow.querySelector('.txtOrderQty');
        const Rate = currentRow.querySelector('.txtRate');
        const Amount = currentRow.querySelector('.txtAmount');
        const billQtyValue = parseFloat(BillQty?.value) || 0;
        const rateValue = parseFloat(Rate?.value) || 0;
        const calculatedAmount = billQtyValue * rateValue;
        if (Amount) {
            Amount.value = calculatedAmount.toFixed(2);
        }
    }
}
function GetRate(VendorName, ItemMaster_Code) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/ClientWiseRate?ClientName=${VendorName}&ItemMaster_Code=${ItemMaster_Code}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.length > 0) {
                    resolve(response);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                reject(error);
            }
        });
    });
}
function focusblank(element) {
    $(element).val("");
}
function CheckItemName(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        $("#txtItemName option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            isValid = ItemDetail.some(entry => entry.ItemName === value
                || (entry.ItemName + ' (' + entry.ItemCode + ')') === value);
        }
        if (!isValid) {
            const inputs = currentRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
        }
    }
}
function CheckItemCode(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        $("#txtItemCode option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            const inputs = currentRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
        }
    }
}
function CheckItemBarCode(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        $("#txtItemBarCode option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            const inputs = currentRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
        }
    }
}
function isRowComplete(row) {
    const inputs = row.querySelectorAll("input.mandatory");
    for (const input of inputs) {
        if (input.value.trim() === "") {
            input.focus();
            return false;
        }
    }
    return true;
}
$(document).on('keydown', '#tblorderbooking input', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        let currentInput = $(this);
        let currentRow = currentInput.closest('tr')[0];

        let lastRow = $('#tblorderbooking #Orderdata tr').last();
        if (lastRow && currentInput.hasClass('txtRemarks')) {
            currentInput.hasClass('txtRemarks')
            let parentRow = currentInput.closest('tr');
            if (parentRow.is(lastRow)) {
                addNewRow();
                if (!isRowComplete(currentRow)) {
                    return;
                }
            }
        }
        let inputs = $('#tblorderbooking').find('input:not([disabled])');
        let currentIndex = inputs.index(currentInput);
        if (currentIndex + 1 < inputs.length) {
            inputs.eq(currentIndex + 1).focus();
        }
    }
});
function CreateVendorlist() {
    $('#txtClientNameList').empty();
    let options = '';
    AccountList.forEach(item => {
        options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
    });
    $('#txtClientNameList').html(options);
}
function SetvalueBillQtyBox(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const ItemName = currentRow.querySelector(".txtItemName");
        const QtyBox = currentRow.querySelector(".txtQtyBox");
        const OrderQty = currentRow.querySelector(".txtOrderQty");
        const Rate = currentRow.querySelector(".txtRate");
        const Amount = currentRow.querySelector(".txtAmount");
        const item = ItemDetail.find(entry => entry.ItemName == ItemName.value);
        OrderQty.value = item.QtyInBox * QtyBox.value;
        CalculateAmount(inputElement);
    }
}
async function View(code) {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tabOrderToolbar").text("VIEW");
    $("#txtListpage").hide();
    $("#txtImportPage").hide();
    $("#txtCreatepage").show();
    setOrderMasterNewToolbar('view');
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowOrderMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    $("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtOrderDate").val(OrderMaster.OrderDate || "").prop("disabled", true);
                    SelectOptionByText('txtClientName', OrderMaster.AccountName);
                    $("#txtClientName").val(OrderMaster.AccountName || "").prop("disabled", true);
                    $("#txtAddress").val(OrderMaster.Address || ""),
                    $("#txtBuyerPONo").val(OrderMaster.BuyerPONo || "").prop("disabled", true);
                    $("#txtBuyerPODate").val(OrderMaster.BuyerPODate || "").prop("disabled", true);
                    $("#txtRemark").val(OrderMaster.Remark || "").prop("disabled", true);
                    $("#txtWarehouse").val(OrderMaster.WarehouseMaster_Code || "").trigger('change').prop("disabled", true);
                    
                    const item = AccountList.find(entry => entry.AccountName == OrderMaster.AccountName);
                    if (!item) {
                        var newData = { Code: 0, AccountName: OrderMaster.AccountName, Address: OrderMaster.Address }
                        AccountList.push(newData);
                    }
                   
                    CreateVendorlist();
                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    response.OrderDetial.forEach(function (address, index) {

                        addNewRowEdit(index, address);
                    });
                } else {
                    toastr.info("No addresses available for this account.");
                }
                $("#txtsave").prop("disabled", true);
                disableFields(true);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}
function ClearDataImport() {
    SelectOptionByText('txtImportClientName','Select');
    $("#txtClientType").val("S");
    $("#txtExcelFile").val("");
    $("#txtImportOrderNo").val("");
    $("#Orderdata").empty();
    $("#txtImportRemark").val("");
    //GetCurrentDate();
    GetAccountMasterList();
}
function GetImportFile() {
    const ClientType = $("#txtClientType").val();
    const ClientName = $("#txtImportClientName").val();
    const OrderNo = $("#txtImportOrderNo").val();
    const Remark = $("#txtImportRemark").val();
    const ImportWarehouse = $("#txtImportWarehouse").val();
    if (ClientType == '') {
        toastr.error("Please select client type !");
        $("#txtClientType").focus();
        $("#txtExcelFile").val();
        JsonData = [];
        return;
    } else if (OrderNo == '' && ClientType == 'S') {
        toastr.error(typeof window.esmsPleaseEnterLevelOfOrderMsg === 'function' ? window.esmsPleaseEnterLevelOfOrderMsg() : "Please enter order no !");
        $("#txtImportOrderNo").focus();
        $("#txtExcelFile").val();
        JsonData = [];
        return;
    } else if (ClientName == '' && ClientType == 'S') {
        toastr.error("Please select client name !");
        $("#txtImportClientName").focus();
        $("#txtExcelFile").val();
        JsonData = [];
        return;
    } else if (!ImportWarehouse) {
        toastr.error("Please select a Warehouse !");
        $("#txtImportWarehouse").focus();
        $("#txtExcelFile").val();
        JsonData = [];
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        ClientType: ClientType,
        ClientName: ClientName,
        OrderNo: OrderNo,
        Remark: Remark,
        WarehouseMaster_Code: ImportWarehouse,
        UserMaster_Code: UserMaster_Code
    };
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportOrderForTemp`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.length >0) {
                createTable(response)
            } else if (response.Status === "N") {
                toastr.error(response.Msg);
            } else {
                toastr.error(response.Msg);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function SaveImportFile() {
    const ClientType = $("#txtClientType").val();
    const ClientName = $("#txtImportClientName").val();
    const OrderNo = $("#txtImportOrderNo").val();
    const Remark = $("#txtImportRemark").val();
    const ImportWarehouse = $("#txtImportWarehouse").val();
    if (ClientType == '') {
        toastr.error("Please select client type !");
        $("#txtClientType").focus();
        return;
    } else if (ClientName == '' && ClientType == 'S') {
        toastr.error("Please select client name !");
        $("#txtImportClientName").focus();
        return;
    } else if (!ImportWarehouse) {
        toastr.error("Please select a Warehouse !");
        $("#txtImportWarehouse").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        ClientType: ClientType,
        ClientName: ClientName,
        OrderNo: OrderNo,
        Remark: Remark,
        WarehouseMaster_Code: ImportWarehouse,
        UserMaster_Code: UserMaster_Code
    };
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportOrder`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                toastr.success(response.Msg);
                ShowOrderMasterlist('Get');
                BackMaster();
                BackImport();
            } else if (response.Status === "N") {
                toastr.error(response.Msg);
            } else {
                toastr.error(response.Msg);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}

async function ImportExcel() {
    $("#tabImportToolbar").text("IMPORT");
    $("#txtListpage").hide();
    $("#txtCreatepage").hide();
    $("#txtImportPage").show();
    setOrderMasterNewToolbar('import');
}
function BackImport() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtImportPage").hide();
    $("#ImportTable").hide();
    setOrderMasterNewToolbar('list');
    $("#txtSearch").val("");
    ClearDataImport();
    ShowOrderMasterlist('Load');
}
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertDateFormat2(dateString) {
    const [month, day, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-20${year}`;
}
function normalizeSheetCell(cell) {
    return cleanHeader(String(cell == null ? '' : cell));
}
function findPoNumberInOrderSheet(data) {
    for (let r = 0; r < data.length; r++) {
        const row = data[r] || [];
        let rowHasPoLabel = false;
        for (let c = 0; c < row.length; c++) {
            if (normalizeSheetCell(row[c]).toUpperCase() === 'PONUMBER') {
                rowHasPoLabel = true;
                break;
            }
        }
        if (!rowHasPoLabel) continue;
        for (let c = 0; c < row.length; c++) {
            let v = cleanValue(String(row[c] == null ? '' : row[c])).replace(/^:\s*/, '').trim();
            if (!v || normalizeSheetCell(v).toUpperCase() === 'PONUMBER') continue;
            const digits = v.replace(/\s/g, '');
            if (/^\d{4,}$/.test(digits)) return digits;
        }
    }
    return '';
}
function findTaxInvoiceItemHeaderRow(data) {
    for (let r = 0; r < data.length; r++) {
        const row = data[r] || [];
        const headers = row.map(cell => normalizeSheetCell(cell).toUpperCase());
        const hasPartNo = headers.some(h => h === 'PARTNO' || h === 'PART');
        const hasQty = headers.some(h => h === 'QTY' || h === 'ORDERQTY');
        const hasDesc = headers.some(h => h.indexOf('PARTDESC') >= 0 || h === 'PARTDESCRIPTION');
        const hasMrp = headers.some(h => h === 'MRP');
        if (hasPartNo && hasQty && hasDesc && hasMrp) return r;
    }
    return -1;
}
function validateMandatoryTaxInvoiceColumns(cols) {
    const missing = [];
    if (cols.partNo == null) missing.push('PartNo');
    if (cols.partDesc == null) missing.push('PartDescription');
    if (cols.qty == null) missing.push('Qty');
    if (cols.mrp == null) missing.push('MRP');
    if (missing.length) {
        return `Missing mandatory column(s): ${missing.join(', ')}`;
    }
    return null;
}
function pickImportRowValue(row, keyAliases) {
    if (!row || typeof row !== 'object') return '';
    const keys = Object.keys(row);
    for (let i = 0; i < keyAliases.length; i++) {
        const want = cleanHeader(keyAliases[i]).toLowerCase();
        for (let k = 0; k < keys.length; k++) {
            const hk = cleanHeader(keys[k]).toLowerCase();
            if (hk === want || (want.indexOf('partdesc') >= 0 && hk.indexOf('partdesc') >= 0)) {
                const v = cleanValue(String(row[keys[k]] == null ? '' : row[keys[k]]));
                if (v) return v;
            }
        }
    }
    return '';
}
function validateMandatoryFlatImportHeaders(headerRow) {
    const headers = (headerRow || []).map(cell => normalizeSheetCell(cell).toUpperCase());
    const hasPartNo = headers.some(h => h === 'PARTNO' || h === 'PART');
    const hasQty = headers.some(h => h === 'QTY' || h === 'ORDERQTY');
    const hasDesc = headers.some(h => h.indexOf('PARTDESC') >= 0 || h === 'PARTDESCRIPTION');
    const hasMrp = headers.some(h => h === 'MRP');
    const missing = [];
    if (!hasPartNo) missing.push('PartNo');
    if (!hasDesc) missing.push('PartDescription');
    if (!hasQty) missing.push('Qty');
    if (!hasMrp) missing.push('MRP');
    if (missing.length) {
        return `Missing mandatory column(s): ${missing.join(', ')}`;
    }
    return null;
}
function validateMandatoryFlatImportRows(rows) {
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const partNo = pickImportRowValue(row, ['Part#', 'PartNo', 'Part', 'PART NO.']);
        const partDesc = pickImportRowValue(row, ['PartDescription', 'Part Desc', 'PART DESC / HSN']);
        const qty = pickImportRowValue(row, ['OrderQty', 'Qty', 'QTY']);
        const mrp = pickImportRowValue(row, ['MRP', 'Mrp']);
        const empty = [];
        if (!partNo) empty.push('PartNo');
        if (!partDesc) empty.push('PartDescription');
        if (!qty) empty.push('Qty');
        if (!mrp) empty.push('MRP');
        if (empty.length === 4) continue;
        if (empty.length) {
            return `Row ${i + 2}: mandatory field(s) missing — ${empty.join(', ')}`;
        }
    }
    return null;
}
function mapTaxInvoiceItemColumns(headerRow) {
    const cols = {};
    (headerRow || []).forEach((cell, index) => {
        const h = normalizeSheetCell(cell).toUpperCase();
        if ((h === 'PARTNO' || h === 'PART') && cols.partNo == null) cols.partNo = index;
        else if ((h.indexOf('PARTDESC') >= 0 || h === 'PARTDESCRIPTION') && cols.partDesc == null) cols.partDesc = index;
        else if ((h === 'QTY' || h === 'ORDERQTY') && cols.qty == null) cols.qty = index;
        else if (h === 'RATE' && cols.rate == null) cols.rate = index;
        else if (h === 'MRP' && cols.mrp == null) cols.mrp = index;
    });
    return cols;
}
function rowLooksLikeInvoiceTotal(row) {
    return (row || []).some(cell => {
        const v = String(cell == null ? '' : cell).trim().toUpperCase();
        return v === 'TOTAL' || v === 'GRAND TOTAL' || v === 'ROUND OFF';
    });
}
/** POMS / tax-invoice layout: PART NO., PART DESC / HSN, Rate, QTY, MRP → import line fields */
function buildTaxInvoiceOrderLines(data, headerRowIdx, cols) {
    const lines = [];
    for (let r = headerRowIdx + 1; r < data.length; r++) {
        const row = data[r] || [];
        if (rowLooksLikeInvoiceTotal(row)) break;

        const partNo = cleanValue(String(row[cols.partNo] == null ? '' : row[cols.partNo]));
        const qty = cleanValue(String(row[cols.qty] == null ? '' : row[cols.qty]));
        const partDesc = cleanValue(String(row[cols.partDesc] == null ? '' : row[cols.partDesc]));
        const mrp = cleanValue(String(row[cols.mrp] == null ? '' : row[cols.mrp]));

        if (!partNo && !qty && !partDesc && !mrp) continue;

        const missingFields = [];
        if (!partNo) missingFields.push('PartNo');
        if (!partDesc) missingFields.push('PartDescription');
        if (!qty) missingFields.push('Qty');
        if (!mrp) missingFields.push('MRP');
        if (missingFields.length) {
            return { error: `Row ${r + 1}: mandatory field(s) missing — ${missingFields.join(', ')}` };
        }

        const line = {
            Part: partNo,
            OrderQty: qty,
            PartDescription: partDesc,
            MRP: mrp
        };
        if (cols.rate != null) {
            const rate = cleanValue(String(row[cols.rate] == null ? '' : row[cols.rate]));
            if (rate) line.Rate = rate;
        }
        lines.push(line);
    }

    if (!lines.length) {
        return { error: 'No valid item rows found in Excel.' };
    }
    return { lines: lines };
}
function parseOrderImportFromSheet(data) {
    const headerRowIdx = findTaxInvoiceItemHeaderRow(data);
    if (headerRowIdx >= 0) {
        const cols = mapTaxInvoiceItemColumns(data[headerRowIdx]);
        const colMsg = validateMandatoryTaxInvoiceColumns(cols);
        if (colMsg) return { ok: false, error: colMsg };

        const lineResult = buildTaxInvoiceOrderLines(data, headerRowIdx, cols);
        if (lineResult.error) return { ok: false, error: lineResult.error };

        const poNo = findPoNumberInOrderSheet(data);
        if (poNo && !$("#txtImportOrderNo").val()) {
            $("#txtImportOrderNo").val(poNo);
        }
        return { ok: true, data: lineResult.lines };
    }

    const flatHeaderMsg = validateMandatoryFlatImportHeaders(data[0]);
    if (flatHeaderMsg) return { ok: false, error: flatHeaderMsg };

    const flatRows = convertToKeyValuePairs(data);
    const flatRowMsg = validateMandatoryFlatImportRows(flatRows);
    if (flatRowMsg) return { ok: false, error: flatRowMsg };

    return { ok: true, data: flatRows };
}
function Import(event) {
    JsonData = [];
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        $("#ImportTable").hide();
        JsonData = [];
        return;
    }

    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload an Excel or CSV file (.xlsx, .xls, .csv).");
        event.target.value = '';
        $("#ImportTable").hide();
        JsonData = [];
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            if (fileExtension === 'csv') {
                JsonData = parseCSV(e.target.result);
                if (!JsonData.length) {
                    toastr.error('The file is empty or has no data rows.');
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                const csvHeaderMsg = validateMandatoryFlatImportHeaders(Object.keys(JsonData[0]));
                if (csvHeaderMsg) {
                    toastr.error(csvHeaderMsg);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                const csvRowMsg = validateMandatoryFlatImportRows(JsonData);
                if (csvRowMsg) {
                    toastr.error(csvRowMsg);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                GetImportFile();
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                if (workbook.SheetNames.length === 0) {
                    alert("Invalid Excel file: No sheets found.");
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, cellDates: true });

                const parsed = parseOrderImportFromSheet(jsonData);
                if (!parsed.ok) {
                    toastr.error(parsed.error);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                JsonData = parsed.data;
                GetImportFile();
            }
            
            
        } catch (error) {
            alert("Error reading the file. Ensure it is a valid format.");
            event.target.value = '';
            $("#ImportTable").hide();
            JsonData = [];
        }
    };

    if (fileExtension === 'csv') {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}
function parseCSV(csvData) {
    const rows = csvData.split(/\r?\n/).filter(row => row.trim() !== ""); // Ignore empty rows
    if (rows.length === 0) return [];

    const headers = rows[0].split(/\t/).map(header => cleanHeader(header)); // Clean headers

    const data = rows.slice(1).map(row => {
        const values = row.split(/\t/).map(val => cleanValue(val));

        return headers.reduce((obj, header, index) => {
            let value = values[index] || "";   
            if (header.toLowerCase().includes("date") && value) {
                value = value.split(/\s+/)[0];
                value = convertDateFormat1(value);
            }

            obj[header] = value;
            return obj;
        }, {});
    });

    return data;
}
function convertToKeyValuePairs(data) {
    if (!Array.isArray(data) || data.length === 0) return [];

    const headers = data[0].map(header => cleanHeader(header));

    return data.slice(1).map(row => {
        return headers.reduce((obj, header, index) => {
            let value = row[index] ? cleanValue(row[index].toString()) : "";

            if ($("#txtClientType").val() == 'S') {
                if (header.toLowerCase().includes("parentorderdate") && value) {
                    value = convertDateFormat2(value.split(/\s+/)[0]);
                }
            } else {
                if (header.toLowerCase().includes("date") && value) {
                    value = convertDateFormat2(value.split(/\s+/)[0]);
                }
            }
            obj[header] = value;
            return obj;
        }, {});
    });
}
function cleanHeader(header) {
    return header.replace(/[^a-zA-Z0-9]/g, ''); 
}
function cleanValue(value) {
    return value.replace(/^"|"$/g, '').trim();
}
function createTable(response) {
    if (response.length > 0) {
        $("#ImportTable").show();
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {};

        BizsolCustomFilterGrid.CreateDataTable(
            "table-header1",
            "table-body1",
            response,
            Button,
            showButtons,
            StringFilterColumn,
            NumericFilterColumn,
            DateFilterColumn,
            StringdoubleFilterColumn,
            hiddenColumns,
            ColumnAlignment,
            true
        );
    } else {
        $("#ImportTable").hide();
        toastr.error("Record not found...!");
    }
}
function disableFields(disabled) {
    if ($("#txtsave").is(":visible")) {
        $("#txtsave").prop("disabled", disabled);
    }
    $("#tblorderbooking")
        .find("input, select, textarea, button")
        .not("#btnBackCreate, #btnAddNewRow, .txtItemAddress, .txtUOM, .txtBillQtyBox, .txtReceivedQtyBox, .txtAmount")
        .prop("disabled", disabled)
        .css("pointer-events", disabled ? "none" : "auto");
    $("#txtheaderdiv, #btnBackCreate, #txtheaderdiv .icon-tab a").css("pointer-events", "auto");
    if (!disabled) {
        $("#btnAddNewRow").prop("disabled", false).css("pointer-events", "auto");
    }
}

/* Order Picking Print — client-side HTML → browser Print / Save as PDF */
function PrintOrderPicking(orderMasterCode) {
    function pick(row, keys) {
        if (!row) return '';
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]).trim();
        }
        return '';
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function displayDate(val) {
        /* Keep API format as-is (e.g. 31-Jul-2026 / 01-Aug-2026) */
        if (val == null || val === '') return '';
        return String(val).trim();
    }
    function loginUserName() {
        return (sessionStorage.getItem('UserName')
            || (authKeyData && (authKeyData.UserName || authKeyData.userName))
            || '').toString().trim();
    }
    function normalize(res) {
        if (!res) return null;
        var headers = res.OrderHeader || res.orderHeader || [];
        var details = res.OrderDetails || res.orderDetails || [];
        if (!headers.length) return null;
        var h = headers[0];
        var lines = (details || []).map(function (L, idx) {
            return {
                sr: pick(L, ['Sr No', 'SrNo', 'Sr', 'SNo']) || String(idx + 1),
                productName: pick(L, ['Product Name', 'ProductName', 'ItemCode', 'Item Code', 'ItemBarCode']),
                description: pick(L, ['Description', 'ItemName', 'Item Name', 'ProductDescription']),
                mrp: pick(L, ['MRP', 'Mrp', 'Rate', 'ScanMRP']),
                ordQty: pick(L, ['Ord Qty', 'OrdQty', 'OrderQty', 'Order Qty', 'Qty', 'Quantity']),
                pickQty: pick(L, ['Pick Qty', 'PickQty']),
                rackNo: pick(L, ['Rack No', 'RackNo', 'Rank No', 'RankNo']),
                location: pick(L, ['Location(Bin)', 'Location (Bin)', 'LocationName', 'Location', 'Bin', 'BinNo', 'Item Address', 'ItemAddress']),
                stock: pick(L, ['Stock', 'StockQty', 'ClosingStock', 'AvailableQty']),
                brand: pick(L, ['Brand', 'BrandName'])
            };
        });
        var qQty = pick(h, ['Q Qty', 'QQty', 'TotalQty', 'Total Order Qty', 'OrderQty']);
        if (!qQty) {
            var sum = 0;
            lines.forEach(function (ln) { var q = parseFloat(ln.ordQty); if (!isNaN(q)) sum += q; });
            if (sum) qQty = String(sum);
        }
        return {
            companyName: pick(h, ['CompanyName', 'Company Name', 'CompanyShortName', 'CompanyNameForShow']),
            orderNo: pick(h, ['Order No', 'OrderNo', 'orderNo']),
            partyName: pick(h, ['Party Name', 'PartyName', 'AccountName', 'ClientName', 'Client Name', 'Account Name']),
            address: pick(h, ['Address', 'ClientAddress', 'Client Address', 'PartyAddress']),
            pickedBy: loginUserName(),
            printDate: displayDate(pick(h, ['PrintDate', 'Print Date', 'PrintedOn'])),
            orderDate: displayDate(pick(h, ['Order Date', 'OrderDate'])),
            totalOrderQty: qQty,
            lines: lines
        };
    }
    function footerDateDdMmmYyyy() {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var d = new Date();
        return String(d.getDate()).padStart(2, '0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    }
    function buildHtml(snap) {
        if (typeof buildOrderPickingPrintHtml === 'function') {
            return buildOrderPickingPrintHtml(snap);
        }
        var rows = '';
        var footerDate = footerDateDdMmmYyyy();
        (snap.lines || []).forEach(function (ln) {
            rows += '<tr><td class="tc">' + esc(ln.sr) + '</td><td class="code">' + esc(ln.productName) + '</td><td>' + esc(ln.description)
                + '</td><td class="tr">' + esc(ln.mrp) + '</td><td class="tc qty">' + esc(ln.ordQty) + '</td><td class="pick"></td>'
                + '<td class="tc">' + esc(ln.rackNo) + '</td><td class="tc loc">' + esc(ln.location) + '</td>'
                + '<td class="tr">' + esc(ln.stock) + '</td><td>' + esc(ln.brand) + '</td></tr>';
        });
        if (!rows) rows = '<tr><td colspan="10" class="tc muted">No items found</td></tr>';
        var pdfName = String(snap.orderNo || 'Order').replace(/[\\\/:*?"<>|]+/g, '-').trim() || 'Order';
        return '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>' + esc(pdfName) + '</title>'
            + '<style>'
            + '*{box-sizing:border-box;margin:0;padding:0}'
            + 'body{font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:12px;color:#111;background:#fff;padding:8px 10px 30px}'
            + '.sheet{max-width:100%}'
            + '.brand{text-align:center;border-bottom:2px solid #111;padding:0 0 8px;margin:0 0 12px}'
            + '.brand h1{font-size:20px;font-weight:700;letter-spacing:.3px;line-height:1.2}'
            + '.brand .doc{margin-top:3px;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#333}'
            + '.meta-block{margin:0 0 12px;max-width:520px}'
            + '.row{display:flex;gap:8px;margin:0 0 4px;align-items:baseline}'
            + '.lbl{min-width:110px;color:#333;font-size:12px;font-weight:600}'
            + '.val{flex:1;font-size:12px}'
            + '.val.strong{font-weight:700}'
            + '.meta-gap{height:8px}'
            + '.sec{display:flex;align-items:center;gap:8px;margin:4px 0 6px}'
            + '.sec span{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px}'
            + '.sec:after{content:"";flex:1;height:1px;background:#999}'
            + 'table.items{width:100%;border-collapse:collapse;table-layout:fixed}'
            + 'table.items th,table.items td{border:1px solid #333;padding:5px 4px;vertical-align:middle;font-size:11px;word-wrap:break-word}'
            + 'table.items th{background:#e8e8e8;font-weight:700;text-align:center;font-size:10px}'
            + 'table.items tbody tr:nth-child(even){background:#fafafa}'
            + '.tc{text-align:center}.tr{text-align:right}.code{font-weight:600}.loc{font-weight:700}.qty{font-weight:700}'
            + '.pick{min-height:18px;background:#fff}.muted{color:#777}'
            + '.signs{display:flex;gap:16px;margin-top:28px}'
            + '.sign{flex:1;text-align:center}'
            + '.sign .line{border-top:1px solid #111;margin:28px 8px 4px;height:0}'
            + '.sign .cap{font-size:11px;font-weight:600}'
            + '.page-date{position:fixed;left:0;right:0;bottom:3px;text-align:center;font-size:10px;color:#333}'
            + '@page{margin:5mm;size:A4}'
            + '@media print{body{padding:4px 6px 24px}table.items th,table.items tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
            + '</style></head><body><div class="sheet">'
            + '<div class="brand"><h1>' + esc(snap.companyName || '') + '</h1><div class="doc">Order Picking List</div></div>'
            + '<div class="meta-block">'
            + '<div class="row"><div class="lbl">Order No</div><div class="val strong">' + esc(snap.orderNo) + '</div></div>'
            + '<div class="row"><div class="lbl">Party Name</div><div class="val strong">' + esc(snap.partyName) + '</div></div>'
            + '<div class="row"><div class="lbl">Address</div><div class="val">' + esc(snap.address) + '</div></div>'
            + '<div class="meta-gap"></div>'
            + '<div class="row"><div class="lbl">Print By</div><div class="val">' + esc(snap.pickedBy) + '</div></div>'
            + '<div class="row"><div class="lbl">Print Date</div><div class="val">' + esc(snap.printDate) + '</div></div>'
            + '<div class="row"><div class="lbl">Order Date</div><div class="val">' + esc(snap.orderDate) + '</div></div>'
            + '<div class="row"><div class="lbl">Total Order Qty</div><div class="val strong">' + esc(snap.totalOrderQty) + '</div></div>'
            + '</div>'
            + '<div class="sec"><span>Product Details</span></div>'
            + '<table class="items"><thead><tr>'
            + '<th style="width:5%">Sr</th><th style="width:12%">Product Name</th><th style="width:22%">Description</th>'
            + '<th style="width:7%">MRP</th><th style="width:7%">Ord Qty</th><th style="width:7%">Pick Qty</th>'
            + '<th style="width:8%">Rack No</th><th style="width:10%">Location (Bin)</th><th style="width:8%">Stock</th><th style="width:14%">Brand</th>'
            + '</tr></thead><tbody>' + rows + '</tbody></table>'
            + '<div class="signs">'
            + '<div class="sign"><div class="line"></div><div class="cap">Picked By</div></div>'
            + '<div class="sign"><div class="line"></div><div class="cap">Packed By</div></div>'
            + '<div class="sign"><div class="line"></div><div class="cap">Checked By</div></div>'
            + '</div></div>'
            + '<div class="page-date">' + esc(footerDate) + '</div>'
            + '</body></html>';
    }
    function printHtml(html, orderNo) {
        var iframe = document.getElementById('oppPrintFrame');
        if (iframe) iframe.remove();
        iframe = document.createElement('iframe');
        iframe.id = 'oppPrintFrame';
        iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
        document.body.appendChild(iframe);
        var win = iframe.contentWindow;
        var doc = win.document;
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(function () {
            var prevTitle = document.title;
            var name = String(orderNo || '').replace(/[\\\/:*?"<>|]+/g, '-').trim();
            try {
                if (name) {
                    document.title = name;
                    doc.title = name;
                }
                win.focus();
                win.print();
            } catch (e) { }
            setTimeout(function () {
                document.title = prevTitle;
                if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
            }, 1500);
        }, 300);
    }

    var code = parseInt(orderMasterCode, 10) || 0;
    if (!code) {
        toastr.error('Invalid order for print.');
        return;
    }
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderPickingPrint?OrderMaster_Code=${encodeURIComponent(code)}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            var snap = normalize(res);
            if (!snap) {
                toastr.warning('No picking data found for this order.');
                return;
            }
            printHtml(buildHtml(snap), snap.orderNo);
        },
        error: function (xhr) {
            unblockUI();
            toastr.error((xhr && xhr.responseText) ? xhr.responseText : 'Unable to load order picking print data.');
        }
    });
}
window.PrintOrderPicking = PrintOrderPicking;

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const DefaultWarehouse = sessionStorage.getItem('DefaultWarehouse');
let AccountList = [];
let ItemDetail = [];
let JsonData = [];
$(document).ready(function () {
    GetCurrentDate();
    $("#ERPHeading").text("Material Receipt Note");
    $("#txtImportWarehouse").val(DefaultWarehouse);
    $('#txtMRNDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtVendorName").focus();
        }
    });
    $('#txtVendorName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtChallanNo").focus();
        }
    });
    $('#txtChallanNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtChallanDate").focus();
        }
    });
    $('#txtChallanDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPickListNo").focus();
        }
    });
    $('#txtPickListNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtVehicleNo").focus();
        }
    });
    $('#txtVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            let firstInput = $('#tblorderbooking #Orderdata tr:first input').first();
            firstInput.focus();
        }
    });
    GetAccountMasterList();
    GetItemDetails();
    GetWareHouseList();
    $("#btnAddNewRow").click(function () {
        addNewRow();
    });
    GetModuleMasterCode();
    $("#txtVendorName").on("focus", function () {
         $("#txtVendorName").val("");
    });
    $("#txtImportVendorName").on("focus", function () {
        $("#txtImportVendorName").val("");
    });
    $("#txtImportWarehouse").on("focus", function () {
        $("#txtImportWarehouse").val("");
    });
    $("#txtVendorName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtVendorNameList option").each(function () {
            if ($(this).val().toUpperCase() === value.toUpperCase()) {
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
    $('#txtImportVendorName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtImportWarehouse").focus();
        }
    });
    $('#txtImportWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtImportVehicleNo").focus();
        }
    });
    $('#txtImportVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtExcelFile").focus();
        }
    });
    $('#txtExcelFile').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnImport").focus();
        }
    });
    $("#txtImportVendorName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtVendorNameList option").each(function () {
            if ($(this).val().toUpperCase() === value.toUpperCase()) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
        }
    });
    $("#txtImportWarehouse").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtImportWarehouseList option").each(function () {
            if ($(this).val().toUpperCase() === value.toUpperCase()) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
        }
    });
    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtShow").focus();
        }
    });
    $('#txtShow').on('keydown', function (e) {
        if (e.key === "Enter") {
            ShowMRNMasterlist();
        }
    });
    $('#txtShow').on('click', function (e) {
            ShowMRNMasterlist();
    });
});
function ShowMRNMasterlist() {
    var FromDate = convertDateFormat2($("#txtFromDate").val());
    var ToDate = convertDateFormat2($("#txtToDate").val());
    if (FromDate == '') {
        toastr.error("Please select from date !");
        $("#txtFromDate").focus();
        return;
    } else if (ToDate == '') {
        toastr.error("Please enter to date !");
        $("#txtToDate").focus();
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetMRNMasterList?FromDate=${FromDate}&ToDate=${ToDate}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#MRNTable").show();
                const StringFilterColumn = ["Vender Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["MRN Date","Challan Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Challan No"];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item,
                    "Unloading Status": `<a style="cursor:pointer;" onclick=ShowCaseNoData(${item.Code})>${item["Unloading Status"]}</a>`,
                    "Validation Status": `<a style="cursor:pointer;" onclick=ShowCaseNoDataQty(${item.Code})>${item["Validation Status"]}</a>`
                    ,Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}','${item["Unloading Status"]}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.Code}','${item[`Challan No`]}','${item["Unloading Status"]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                ChangecolorTr();
            } else {
                $("#MRNTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#txtMRNDate").prop("disabled", false);
    $("#txtChallanNo").prop("disabled", false);
    $("#txtVehicleNo").prop("disabled", false);
    $("#txtPickListNo").prop("disabled", false);
    $("#txtChallanDate").prop("disabled", false);
    $("#txtVendorName").prop("disabled", false);
    $("#txtAddress").prop("disabled", false);
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#Orderdata").empty();
    addNewRow();
    disableFields(false);
    $("#txtsave").prop("disabled", false);
}
async function ImportExcel() {
    $("#txtListpage").hide();
    $("#txtCreatepage").hide();
    $("#txtImportPage").show();
    $("#txtheaderdiv2").show();
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtImportPage").hide();
    $("#txtheaderdiv").hide();
    $("#txtMRNDate").prop("disabled", false);
    $("#txtChallanNo").prop("disabled", false);
    $("#txtVehicleNo").prop("disabled", false);
    $("#txtPickListNo").prop("disabled", false);
    $("#txtChallanDate").prop("disabled", false);
    $("#txtVendorName").prop("disabled", false);
    $("#txtAddress").prop("disabled", false);
    ClearData();
    disableFields(false);
    $("#txtsave").prop("disabled", false);

}
function BackImport() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtImportPage").hide();
    $("#ImportTable").hide();
    $("#txtheaderdiv2").hide();
    ClearDataImport();
}
async function Edit(code, Status) {
    if (Status !== 'UNLOADING PENDING') {
        toastr.error("Un-Loading start you can`t edit !.");
        return;
    }
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    
    $("#tab1").text("EDIT");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ShowMRNMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.MRNMaster && response.MRNMaster.length > 0) {
                    const MRNMaster = response.MRNMaster[0];
                    $("#hfCode").val(MRNMaster.Code || "");
                    $("#txtMRNNo").val(MRNMaster.MRNNo || "");
                    $("#txtMRNDate").val(MRNMaster.MRNDate || "");
                    $("#txtChallanNo").val(MRNMaster.Bill_ChallanNo || "");
                    $("#txtVehicleNo").val(MRNMaster.VehicleNo || "");
                    $("#txtPickListNo").val(MRNMaster.PickListNo || "");
                    $("#txtChallanDate").val(MRNMaster.Bill_ChallanDate || "");
                    $("#txtVendorName").val(MRNMaster.AccountName || "");
                    $("#txtAddress").val(MRNMaster.Address || "");
                    disableFields(false);
                    $("#txtsave").prop("disabled", false);
                    const item = AccountList.find(entry => entry.AccountName == MRNMaster.AccountName);
                    if (!item) {
                        var newData = { Code: 0, AccountName: MRNMaster.AccountName, Address: MRNMaster.Address }
                        AccountList.push(newData);
                    }
                    CreateVendorlist();
                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.MRNDetails && response.MRNDetails.length > 0) {
                    response.MRNDetails.forEach(function (Data, index) {
                        addNewRowEdit(index, Data);
                    });
                    updateTotalBillQty();
                    updateTotalRate();
                    updateTotalAmount();
                    updateTotalBillQtyBox();
                    updateTotalReceivedQtyBox();
                    updateTotalReceivedQty();
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
async function DeleteItem(code, Challan, status, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    if (status !== 'UNLOADING PENDING') {
        toastr.error("Un-Loading start you can`t delete !.");
        return;
    }
  
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    
    const { Status, msg1 } = await CheckRelatedRecord(code, 'mrnmaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this item ${Challan} ?.!`)) {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/DeleteMRNMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowMRNMasterlist();
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);

            }
        });
    }
    else {
            $('tr').removeClass('highlight')
    }
}
function GetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsVendorDropDown`,
        type: 'GET',    
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                AccountList = response;
                CreateVendorlist();
            } else {
                $('#txtVendorNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryNameList').empty();
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
                    options3 += '<option value="' + item.ItemName + '" text="' + item.Code + '"></option>';
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
function GetWareHouseList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetWareHouseDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtImportWarehouseList').empty();
                $('#txtWarehouse').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtImportWarehouseList').html(options);
                $('#txtWarehouse').html(options);
            } else {
                $('#txtImportWarehouseList').empty();
                $('#txtWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').empty();
        }
    });
}
function GetCurrentDate() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                DatePicker(response[0].Date);
                FromDatePicker(response[0].Date);
            } 
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtMRNNo").val("");
    $("#txtVendorName").val("");
    $("#txtAddress").val("");
    $("#txtVehicleNo").val("");
    $("#txtChallanNo").val("");
    $("#txtPickListNo").val("");
    $("#Orderdata").empty();
    GetCurrentDate();
    GetAccountMasterList();
}
function Save() {
    const Code = $("#hfCode").val();
    const MRNNo = $("#txtMRNNo").val();
    const VendorName = $("#txtVendorName").val();
    const VehicleNo = $("#txtVehicleNo").val();
    const MRNDate = convertDateFormat($("#txtMRNDate").val());
    const ChallanNo = $("#txtChallanNo").val();
    const PickListNo = $("#txtPickListNo").val();
    const ChallanDate = convertDateFormat($("#txtChallanDate").val());

    if (MRNDate == '') {
        toastr.error("Please select MRN Date !");
        $("#txtMRNDate").focus();
        return;
    } else if (VendorName == '') {
        toastr.error("Please enter vendor name !");
        $("#txtVendorName").focus();
        return;
    } else if (ChallanNo == '') {
        toastr.error("Please enter challan no !");
        $("#txtChallanNo").focus();
        return;
    } else if (ChallanDate == '') {
        toastr.error("Please select challan date !");
        $("#txtChallanDate").focus();
        return;
    } else if (PickListNo == '') {
        toastr.error("Please enter PickList No !");
        $("#txtPickListNo").focus();
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
                toastr.error("Please enter item bar code !");
                row.find(".txtItemBarCode").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtItemCode").val() == '') {
                toastr.error("Please enter item code !");
                row.find(".txtItemCode").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtItemName").val() == '') {
                toastr.error("Please enter item name !");
                row.find(".txtItemName").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtBillQty").val() == '') {
                toastr.error("Please enter Bill Qty !");
                row.find(".txtBillQty").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtReceivedQty").val() == '') {
                toastr.error("Please enter Received Qty!");
                row.find(".txtReceivedQty").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtRate").val() == '') {
                toastr.error("Please enter rate !");
                row.find(".txtRate").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtAmount").val() == '') {
                toastr.error("Please enter amount !");
                row.find(".txtAmount").focus();
                validationFailed = true;
                return;
            }
            else if (row.find(".txtWarehouse").val() == '') {
                toastr.error("Please enter Warehouse !");
                row.find(".txtWarehouse").focus();
                validationFailed = true;
                return;
            }
        }
    });
    if (validationFailed) {
        return;
    }
    const Payload = [{
        code: Code,
        mrnNo: MRNNo,
        mrnDate: MRNDate,
        vendorName: VendorName,
        challanNo: ChallanNo,
        challanDate: ChallanDate,
        vehicleNo: VehicleNo,
        PickListNo: PickListNo
    }];
    const Data = [];
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        if (row.find(".txtItemName").val() != '') {
            const RowData = {
                itemCode: row.find(".txtItemCode").val(),
                billQtyBox: row.find(".txtBillQtyBox").val() || 0,
                receivedQtyBox: row.find(".txtReceivedQtyBox").val() || 0,
                billQty: row.find(".txtBillQty").val(),
                receivedQty: row.find(".txtReceivedQty").val(),
                itemRate: row.find(".txtRate").val(),
                amount: row.find(".txtAmount").val(),
                warehouseName: row.find(".txtWarehouse").val(),
                remarks: row.find(".txtRemarks").val()
            };
            Data.push(RowData);
        }
    });

    const payload = {
        MRNMaster: Payload,
        MRNDetails: Data,
    };

    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/SaveMRNMaster?UserMaster_Code=${UserMaster_Code}`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                toastr.success(response.Msg);
                ShowMRNMasterlist();
                BackMaster();
            } else {
                toastr.error(response.Msg);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function addNewRowEdit(index, Data) {
    const rowCount = index + 1;
    const table = document.getElementById("Orderdata");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
            <td><input type="text" list="txtItemBarCode" onfocusout="CheckItemBarCode(this);" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" onfocusout="CheckItemCode(this);" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" onfocusout="CheckItemName(this);" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" disabled class="txtBillQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueBillQtyBox(this);" id="txtBillQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" disabled class="txtReceivedQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQtyBox(this);" id="txtReceivedQtyBox_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtBillQty box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQty(event, this);" oninput="CalculateAmount(this);" id="txtBillQty_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" oninput="updateTotalReceivedQty();" class="txtReceivedQty box_border form-control form-control-sm mandatory text-right"onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" disabled class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" list="txtWarehouse" onfocus="focusblank(this);" class="txtWarehouse box_border form-control form-control-sm mandatory" onfocusout="CheckWarehouse(this);" id="txtWarehouse_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>
    `;

    table.appendChild(newRow);

    if (Data !== undefined) {
        const item = ItemDetail.find(entry => entry.ItemName == Data.ItemName);
        const isDisabled = item.QtyInBox === 0;
        $("#txtItemBarCode_" + rowCount).val(Data.ItemBarCode || "");
        $("#txtItemCode_" + rowCount).val(Data.ItemCode || "");
        $("#txtItemName_" + rowCount).val(Data.ItemName || "");
        $("#txtItemAddress_" + rowCount).val(Data.LocationName || "");
        $("#txtUOM_" + rowCount).val(Data.UOMName || "");
        if (Data.BillQtyBox > 0) {
            $("#txtBillQty_" + rowCount).prop("disabled", true);
        } else {
            $("#txtBillQty_" + rowCount).prop("disabled", false);
        }
        if (Data.ReceivedQtyBox > 0) {
            $("#txtReceivedQty_" + rowCount).prop("disabled", true);
        } else {
            $("#txtReceivedQty_" + rowCount).prop("disabled", false);
        }
        $("#txtBillQtyBox_" + rowCount).val(Data.BillQtyBox || "");
        $("#txtReceivedQtyBox_" + rowCount).val(Data.ReceivedQtyBox || "");
        $("#txtBillQtyBox_" + rowCount).prop("disabled", isDisabled);
        $("#txtReceivedQtyBox_" + rowCount).prop("disabled", isDisabled);
        $("#txtBillQty_" + rowCount).val(Data.BillQty || "");
        $("#txtReceivedQty_" + rowCount).val(Data.ReceivedQty || "");
        $("#txtRate_" + rowCount).val(Data.ItemRate || "");
        $("#txtAmount_" + rowCount).val(Data.Amount || "");
        $("#txtWarehouse_" + rowCount).val(Data.WarehouseName || "");
        $("#txtRemarks_" + rowCount).val(Data.Remarks || "");
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
function SetvalueReceivedQty(event, element) {
    const currentRow = element.closest('tr');
    const ReceivedQty = currentRow.querySelector('.txtReceivedQty');
    if (currentRow) {
            const value = element.value;
            ReceivedQty.value = value;
        CalculateAmount(element);
        updateTotalReceivedQty();
    }
    else {
           
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
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm " id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm " id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" disabled class="txtBillQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueBillQtyBox(this);" id="txtBillQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" disabled class="txtReceivedQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQtyBox(this);" id="txtReceivedQtyBox_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtBillQty box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQty(event, this);" oninput="CalculateAmount(this);" id="txtBillQty_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" oninput="updateTotalReceivedQty();" class="txtReceivedQty box_border form-control form-control-sm mandatory text-right"onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" disabled class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" list="txtWarehouse" onfocus="focusblank(this);" class="txtWarehouse box_border form-control form-control-sm mandatory" onfocusout="CheckWarehouse(this);" id="txtWarehouse_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>
      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" list="txtItemBarCode" onfocusout="CheckItemBarCode(this);" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" onfocusout="CheckItemCode(this);" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" onfocusout="CheckItemName(this);" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" disabled class="txtBillQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueBillQtyBox(this);" id="txtBillQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" disabled class="txtReceivedQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQtyBox(this);" id="txtReceivedQtyBox_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtBillQty box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQty(event, this);" id="txtBillQty_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" oninput="updateTotalReceivedQty();" class="txtReceivedQty box_border form-control form-control-sm mandatory text-right"onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" disabled class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" list="txtWarehouse" onfocus="focusblank(this);" class="txtWarehouse box_border form-control form-control-sm mandatory" onfocusout="CheckWarehouse(this);" id="txtWarehouse_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>
      `;
        table.appendChild(newRow);
        updateTotalBillQty();
        updateTotalRate();
        updateTotalAmount();
        updateTotalBillQtyBox();
        updateTotalReceivedQtyBox();
        updateTotalReceivedQty();
    }
}
$(document).on("click", ".deleteRow", function () {
    const table = document.getElementById("tblorderbooking").querySelector("tbody");
    if (table.querySelectorAll("tr").length > 1) {
        $(this).closest("tr").remove();
    } else {
        alert("At least one row is required.");
    }
});
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Material Receipt Note");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function setupDateInputFormatting() {
    $('#txtMRNDate').on('input', function () {
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
    $('#txtChallanDate').on('input', function () {
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
    $('#txtFromDate').on('input', function () {
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
    $('#txtToDate').on('input', function () {
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
            $('#txtChallanDate').val('');

        }
    } else {
        $('#txtChallanDate').val('');

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
            $('#txtMRNDate').val('');

        }
    } else {
        $('#txtMRNDate').val('');

    }
}
function FillallItemfield(inputElement, value) {

    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const txtBillQty = currentRow.querySelector('.txtBillQty');
        const txtReceivedQty = currentRow.querySelector('.txtReceivedQty');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const ReceivedQtyBox = currentRow.querySelector('.txtReceivedQtyBox');
        const BillQtyBox = currentRow.querySelector('.txtBillQtyBox');
        txtBillQty.disabled = false;
        txtReceivedQty.disabled = false;
        if (value == 'BarCode') {
            $("#txtItemBarCode option").each(function () {
                if ($(this).val() === inputValue) {
                    const item = ItemDetail.find(entry => entry.ItemBarCode == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
                    const isDisabled = item.QtyInBox === 0;
                    ReceivedQtyBox.value = '' ;
                    BillQtyBox.value = '';
                    ReceivedQtyBox.disabled = isDisabled;
                    BillQtyBox.disabled = isDisabled;
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
                    const isDisabled = item.QtyInBox === 0;
                    ReceivedQtyBox.value = '';
                    BillQtyBox.value = '';
                    ReceivedQtyBox.disabled = isDisabled;
                    BillQtyBox.disabled = isDisabled;
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
                    const item = ItemDetail.find(entry => entry.ItemName == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
                    const isDisabled = item.QtyInBox === 0;
                    ReceivedQtyBox.value = '';
                    BillQtyBox.value = '';
                    ReceivedQtyBox.disabled = isDisabled;
                    BillQtyBox.disabled = isDisabled;
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
        GetRate($("#txtVendorName").val(), itemName.value).then(response => {
                itemRate.value = response[0].ItemRate;
            }).catch(error => {
                console.error('Error fetching rate:', error);
            });
      
    }
}
function CheckWarehouse(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        const Warehouse = currentRow.querySelector('.txtWarehouse');
        $("#txtWarehouse option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            Warehouse.value = "";
        }
    }

}
function CalculateAmount(inputElement) {
    const currentRow = inputElement.closest('tr'); 
    if (currentRow) {
        const BillQty = currentRow.querySelector('.txtBillQty');
        const Rate = currentRow.querySelector('.txtRate');
        const Amount = currentRow.querySelector('.txtAmount');
        const billQtyValue = parseFloat(BillQty?.value) || 0; 
        const rateValue = parseFloat(Rate?.value) || 0;
        const calculatedAmount = billQtyValue * rateValue;
        if (Amount) {
            Amount.value = calculatedAmount.toFixed(2);
            updateTotalBillQty();
            updateTotalRate();
            updateTotalAmount();
        }
     }
}
function GetRate(VendorName, ItemName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/GetRateByVendor?VendorName=${VendorName}&ItemName=${ItemName}`,
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
function CreateVendorlist(){
    $('#txtVendorNameList').empty();
    let options = '';
    AccountList.forEach(item => {
        options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
    });
    $('#txtVendorNameList').html(options);
}
function SetvalueBillQtyBox(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const BillQty = currentRow.querySelector('.txtBillQty');
        const ReceivedQty = currentRow.querySelector('.txtReceivedQty');
        const itemName = currentRow.querySelector('.txtItemName');
        const ReceivedQtyBox = currentRow.querySelector('.txtReceivedQtyBox');
        const BillQtyBox = currentRow.querySelector('.txtBillQtyBox');
        const isDisabled = parseInt(inputValue) > 0;
        BillQty.disabled = isDisabled;
        const item = ItemDetail.find(entry => entry.ItemName == itemName.value);
        BillQty.value = item.QtyInBox * BillQtyBox.value;
        CalculateAmount(inputElement);
        updateTotalReceivedQty();
        updateTotalBillQtyBox();
    }
}
function SetvalueReceivedQtyBox(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const BillQty = currentRow.querySelector('.txtBillQty');
        const ReceivedQty = currentRow.querySelector('.txtReceivedQty');
        const itemName = currentRow.querySelector('.txtItemName');
        const ReceivedQtyBox = currentRow.querySelector('.txtReceivedQtyBox');
        const BillQtyBox = currentRow.querySelector('.txtBillQtyBox');
        const isDisabled = parseInt(inputValue) > 0;
        ReceivedQty.disabled = isDisabled;
        const item = ItemDetail.find(entry => entry.ItemName == itemName.value);
        ReceivedQty.value = item.QtyInBox * ReceivedQtyBox.value;
        CalculateAmount(inputElement);
        updateTotalReceivedQty();
        updateTotalReceivedQtyBox();
    }
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}
function CreateTable(response) {
    if (response.length > 0) {
        $("#ImportTable").show();
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {
        };
        BizsolCustomFilterGrid.CreateDataTable("table-header1", "table-body1", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,true);
        ChangecolorTr();
    } else {
        $("#ImportTable").hide();
        toastr.error("Record not found...!");
    }
}
function SaveImportFile() {
    const VendorName = $("#txtImportVendorName").val();
    const VehicleNo = $("#txtImportVehicleNo").val();
    const ImportWarehouse = $("#txtImportWarehouse").val();
    if (VendorName == '') {
        toastr.error("Please enter vendor name !");
        $("#txtImportVendorName").focus();
        return;
    } else if (ImportWarehouse == '') {
        toastr.error("Please enter Warehouse !");
        $("#txtImportWarehouse").focus();
        return;
    } else if (VehicleNo == '') {
        toastr.error("Please enter Vehicle No !");
        $("#txtImportVehicleNo").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        VendorName: VendorName,
        WarehouseName: ImportWarehouse,
        VehicleNo: VehicleNo,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ImportMRNMaster`,
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
                ShowMRNMasterlist();
                BackImport();
            } else if (response.Status === "N") {
                toastr.error(response.Msg);
            } else {
                toastr.error(response.Msg);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('.');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertToKeyValuePairs(data) {
    if (data.length < 2) return [];
    const headers = data[0].map(header => header.replace(/[\s.]+/g, ''));
    const rows = data.slice(1);
    const mappedData = rows.map(row => {
        let obj = {};
        headers.forEach((header, index) => {
            let value = row[index] !== undefined ? row[index] : null;
            if (header.toLowerCase().includes('date') && value) {
                value = convertDateFormat1(value);
            }

            obj[header] = value;
        });
        return obj;
    });
    const uniqueData = [];
    const seenRows = new Set();

    mappedData.forEach(row => {
        const uniqueKey = headers.map(header => row[header]).join('|');

        if (!seenRows.has(uniqueKey)) {
            seenRows.add(uniqueKey);
            uniqueData.push(row);
        }
    });

    uniqueData.sort((a, b) => {
        const invoiceA = a["InvoiceNo"];
        const invoiceB = b["InvoiceNo"];
        if (typeof invoiceA === "string" && typeof invoiceB === "string") {
            return invoiceA.localeCompare(invoiceB, undefined, { numeric: true });
        }

        return invoiceA - invoiceB;
    });

    return uniqueData;
}
function ClearDataImport() {
    $("#txtImportVendorName").val("");
    $("#txtImportVehicleNo").val("");
    $("#txtExcelFile").val("");
    $("#txtImportWarehouse").val(DefaultWarehouse);
    $("#Orderdata").empty();
    GetCurrentDate();
    GetAccountMasterList();
}
function Import(event) {
    const file = event.target.files[0];

    if (!file) {
        alert("Please select an Excel file.");
        return;
    }

    const allowedExtensions = ['xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload an Excel file (.xlsx or .xls).");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            if (workbook.SheetNames.length === 0) {
                alert("Invalid Excel file: No sheets found.");
                event.target.value = '';
                return;
            }

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const validationResult = validateExcelFormat(jsonData);
            if (!validationResult.isValid) {
                alert(`Invalid Excel format: ${validationResult.message}`);
                event.target.value = ''; 
                return;
            }

            const formattedData = convertToKeyValuePairs(jsonData);
            JsonData = formattedData;
            GetImportFile();
        } catch (error) {
            alert("Error reading the Excel file. Ensure it is a valid Excel format.");
            console.error(error);
            event.target.value = '';
        }
    };

    reader.readAsArrayBuffer(file);
}
function validateExcelFormat(data) {
    if (data.length < 1) {
        return { isValid: false, message: "The Excel file is empty." };
    }
    const headers = data[0].map(header => header.replace(/[\s.]+/g, ''));
    const requiredColumns = ['PicklistNo', 'ItemLineNo', 'ItemCode', 'Description', 'InvoiceNo','OrderNo'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        return { isValid: false, message: `Missing required columns: ${missingColumns.join(', ')}` };
    }

    return { isValid: true, message: "Excel format is valid." };
}
function focusblank(element) {
    $(element).val("");
}
function GetImportFile() {
    const VendorName = $("#txtImportVendorName").val();
    const VehicleNo = $("#txtImportVehicleNo").val();
    const ImportWarehouse = $("#txtImportWarehouse").val();
    if (VendorName == '') {
        toastr.error("Please enter vendor name !");
        $("#txtImportVendorName").focus();
        return;
    } else if (ImportWarehouse == '') {
        toastr.error("Please enter Warehouse !");
        $("#txtImportWarehouse").focus();
        return;
    } else if (VehicleNo == '') {
        toastr.error("Please enter Vehicle No !");
        $("#txtImportVehicleNo").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        VendorName: VendorName,
        WarehouseName: ImportWarehouse,
        VehicleNo: VehicleNo,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ImportMRNMasterForTemp`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
                CreateTable(response);
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#table-body1 tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[0]?.textContent.trim();

        if (columnValue === 'Y') {
            row.style.backgroundColor = '#f5c0bf';
        } else {
            row.style.backgroundColor = '';
        }
    });
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
            const inputs = currentRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });;
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
function updateTotalBillQty() {
    let totalReceivedQty = 0;
    const receivedQtyElements = document.querySelectorAll('.txtBillQty');
    receivedQtyElements.forEach(input => {
        const value = parseFloat(input.value) || 0; 
        totalReceivedQty += value;
    });
    const txtReceivedQtyBoxFooter = document.querySelector("#txtBillQty");
    if (txtReceivedQtyBoxFooter) {
        txtReceivedQtyBoxFooter.textContent = totalReceivedQty.toFixed(2);
    }
}
function updateTotalReceivedQty() {
    let totalReceivedQty = 0;
    const receivedQtyElements = document.querySelectorAll('.txtReceivedQty');
    receivedQtyElements.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalReceivedQty += value;
    });
    const txtReceivedQtyBoxFooter = document.querySelector("#txtReceivedQty");
    if (txtReceivedQtyBoxFooter) {
        txtReceivedQtyBoxFooter.textContent = totalReceivedQty.toFixed(2);
    }
}
function updateTotalReceivedQtyBox() {
    let totalReceivedQty = 0;
    const receivedQtyElements = document.querySelectorAll('.txtReceivedQtyBox');
    receivedQtyElements.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalReceivedQty += value;
    });
    const txtReceivedQtyBoxFooter = document.querySelector("#txtReceivedQtyBox");
    if (txtReceivedQtyBoxFooter) {
        txtReceivedQtyBoxFooter.textContent = totalReceivedQty.toFixed(2);
    }
}
function updateTotalBillQtyBox() {
    let totalReceivedQty = 0;
    const receivedQtyElements = document.querySelectorAll('.txtBillQtyBox');
    receivedQtyElements.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalReceivedQty += value;
    });
    const txtReceivedQtyBoxFooter = document.querySelector("#txtBillQtyBox");
    if (txtReceivedQtyBoxFooter) {
        txtReceivedQtyBoxFooter.textContent = totalReceivedQty.toFixed(2);
    }
}
function updateTotalRate() {
    let totalReceivedQty = 0;
    const receivedQtyElements = document.querySelectorAll('.txtRate');
    receivedQtyElements.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalReceivedQty += value;
    });
    const txtReceivedQtyBoxFooter = document.querySelector("#txtRate");
    if (txtReceivedQtyBoxFooter) {
        txtReceivedQtyBoxFooter.textContent = totalReceivedQty.toFixed(2);
    }
}
function updateTotalAmount() {
    let totalReceivedQty = 0;
    const receivedQtyElements = document.querySelectorAll('.txtAmount');
    receivedQtyElements.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalReceivedQty += value;
    });
    const txtReceivedQtyBoxFooter = document.querySelector("#txtAmount");
    if (txtReceivedQtyBoxFooter) {
        txtReceivedQtyBoxFooter.textContent = totalReceivedQty.toFixed(2);
    }
}
function validateFromDate(value) {
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
            $('#txtFromDate').val('');

        }
    } else {
        $('#txtFromDate').val('');

    }
}
function DatePicker(date) {
    $('#txtMRNDate, #txtChallanDate,#txtToDate').val(date);
    $('#txtMRNDate, #txtChallanDate,#txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
    });
}
function FromDatePicker(dateStr) {
    let parts = dateStr.split('/');
    if (parts.length !== 3) return; 
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; 
    let year = parseInt(parts[2], 10);
    if (year < 100) {
        year += 2000;
    }
    let firstDateOfMonth = new Date(year, month, 1);
    let formattedDate = ('0' + firstDateOfMonth.getDate()).slice(-2) + '/' +
        ('0' + (firstDateOfMonth.getMonth() + 1)).slice(-2) + '/' +
        firstDateOfMonth.getFullYear();
    $('#txtFromDate').val(formattedDate);
    ShowMRNMasterlist();
    $('#txtFromDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
    });
}
function convertDateFormat2(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}/${monthAbbreviation}/${year}`;
}
async function View(code) {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("VIEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ShowMRNMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.MRNMaster && response.MRNMaster.length > 0) {
                   
                    const MRNMaster = response.MRNMaster[0];
                    $("#hfCode").val(MRNMaster.Code || "").prop("disabled", true);
                    $("#txtMRNNo").val(MRNMaster.MRNNo || "").prop("disabled", true);
                    $("#txtMRNDate").val(MRNMaster.MRNDate || "").prop("disabled", true);
                    $("#txtChallanNo").val(MRNMaster.Bill_ChallanNo || "").prop("disabled", true);
                    $("#txtVehicleNo").val(MRNMaster.VehicleNo || "").prop("disabled", true);
                    $("#txtPickListNo").val(MRNMaster.PickListNo || "").prop("disabled", true);
                    $("#txtChallanDate").val(MRNMaster.Bill_ChallanDate || "").prop("disabled", true);
                    $("#txtVendorName").val(MRNMaster.AccountName || "").prop("disabled", true);
                    $("#txtAddress").val(MRNMaster.Address || "").prop("disabled", true);
                    const item = AccountList.find(entry => entry.AccountName == MRNMaster.AccountName);
                    if (!item) {
                        var newData = { Code: 0, AccountName: MRNMaster.AccountName, Address: MRNMaster.Address }
                        AccountList.push(newData);
                    }
                    CreateVendorlist();
                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.MRNDetails && response.MRNDetails.length > 0) {
                    response.MRNDetails.forEach(function (Data, index) {
                     
                        addNewRowEdit(index, Data);
                    });
                    updateTotalBillQty();
                    updateTotalRate();
                    updateTotalAmount();
                    updateTotalBillQtyBox();
                    updateTotalReceivedQtyBox();
                    updateTotalReceivedQty();
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
function disableFields(disabled) {
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", disabled).css("pointer-events", disabled ? "none" : "auto");
}
function DataExport() {
    var FromDate = convertDateFormat2($("#txtFromDate").val());
    var ToDate = convertDateFormat2($("#txtToDate").val());
    if (FromDate == '') {
        toastr.error("Please select from date !");
        $("#txtFromDate").focus();
        return;
    } else if (ToDate == '') {
        toastr.error("Please enter to date !");
        $("#txtToDate").focus();
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ExportMRNMaster?FromDate=${FromDate}&ToDate=${ToDate}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                Export(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Export(jsonData) {
    var ws = XLSX.utils.json_to_sheet(jsonData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "MRNMaster.xlsx");
}
function ExportExcel() {
    DataExport();
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#table-body tr');

    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const targetTd = tds[9]; 
        const targetTd1 = tds[10]; 

        if (targetTd) { 
            const columnValue = targetTd.textContent.trim();
            const columnValue1 = targetTd1.textContent.trim();
            
            if (columnValue === 'UNLOADED') {
                targetTd.style.backgroundColor = '#009358';
                targetTd.style.color = '#fff';
            } else if (columnValue === "PARTIAL UNLOADED") {
                targetTd.style.backgroundColor = '#9ef3a5';
            } else {
                targetTd.style.backgroundColor = '#d5d5f5';
            }
            if (columnValue1 === 'VALIDATED') {
                targetTd1.style.backgroundColor = '#009358';
                targetTd1.style.color = '#fff';
            } else if (columnValue1 === "PARTIAL VALIDATE") {
                targetTd1.style.backgroundColor = '#9ef3a5';
            } else {
                targetTd1.style.backgroundColor = '#d5d5f5';
            }
            targetTd.style.fontWeight = 'bold';
            targetTd1.style.fontWeight = 'bold';
        }
    });
}

setInterval(ChangecolorTr, 100);
function ShowCaseNoData(Code) {
    openSavePopup();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ShowMRNMasterByCode?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.MRNDetails && response.MRNDetails.length > 0) {
                        $("#MRNTable").show();
                        const StringFilterColumn = ["CaseNo", "ItemBarCode", "ItemCode", "ItemName"];
                        const NumericFilterColumn = [];
                        const DateFilterColumn = [];
                        const Button = false;
                        const showButtons = [];
                        const StringdoubleFilterColumn = [];
                        const hiddenColumns = ["Code", "BillQtyBox","Status", "ReceivedQtyBox", "BillQty", "ReceivedQty", "ItemRate", "Amount", "Remarks", "UOMName","LocationName","WarehouseName"];
                        const ColumnAlignment = {
                        };
                    BizsolCustomFilterGrid.CreateDataTable("ModalTable-header", "ModalTable-body", response.MRNDetails, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false);
                } else {
                    toastr.error("Record not found...!");
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
function openSavePopup() {
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
    saveModal.show();
}
function ChangecolorTr1() {
    const rows = document.querySelectorAll('#ModalTable-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[9]?.textContent.trim();
        if (columnValue === 'Y') {
            row.style.backgroundColor = '#9ef3a5';
        } else {
            row.style.backgroundColor = '#f5c0bf';
        }
    });
}

setInterval(ChangecolorTr1, 100);
function ShowCaseNoDataQty(Code) {
    openSavePopupQty();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ShowMRNMasterByCode?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.MRNDetails && response.MRNDetails.length > 0) {
                    $("#MRNTable").show();
                    const StringFilterColumn = ["CaseNo", "ItemBarCode", "ItemCode", "ItemName"];
                    const NumericFilterColumn = ["BillQty", "ReceivedQty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code", "BillQtyBox", "Status", "ReceivedQtyBox","ItemRate", "Amount", "Remarks", "UOMName", "LocationName", "WarehouseName"];
                    const ColumnAlignment = {
                        BillQty:"right",
                        ReceivedQty:"right"
                    };
                    BizsolCustomFilterGrid.CreateDataTable("ModalTable-headerQty", "ModalTable-bodyQty", response.MRNDetails, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                } else {
                    toastr.error("Record not found...!");
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
function openSavePopupQty() {
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdropQty"));
    saveModal.show();
}
function ChangecolorTrQty() {
    const rows = document.querySelectorAll('#ModalTable-bodyQty tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const BillQty = tds[3]?.textContent.trim();
        const RecQty = tds[4]?.textContent.trim();
        if (parseInt(RecQty) === parseInt(BillQty)) {
            row.style.backgroundColor = '#009358';
        } else if (parseInt(RecQty) < parseInt(BillQty) && parseInt(RecQty) > 0) {
            row.style.backgroundColor = '#9ef3a5';
        } else {
            row.style.backgroundColor = '#f3d4d4';
        }
    });
}
setInterval(ChangecolorTrQty, 100);

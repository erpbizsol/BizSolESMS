var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var G_Fixparameter = JSON.parse(sessionStorage.getItem('Fixparameter'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const DefaultWarehouse = sessionStorage.getItem('DefaultWarehouse');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
 
let AccountList = [];
let BrandList = [];
let ItemDetail = [];
let JsonData = [];
let G_IsValidation = G_Fixparameter[0].IsValidation ? G_Fixparameter[0].IsValidation : 'Y';
let G_IsUnloading = G_Fixparameter[0].IsUnloading ? G_Fixparameter[0].IsUnloading : 'Y';

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
    GetItemDetail();
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
            ShowMRNMasterlist('Get');
        }
    });
    $('#txtShow').on('click', function (e) {
            ShowMRNMasterlist('Get');
    });
    $('#txtImportVehicleNo').on('focus', function () {
        VehicleNoList();
    });
    $("#thItemBarcode").text(G_ItemConfig[0].ItembarcodeHeader ? G_ItemConfig[0].ItembarcodeHeader : 'Item Barcode');
    $("#thItemCode").text(G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code');
    $("#thItemName").text(G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name');
 
    $('#txtBrandName').on('input', function () {
        var brandName = $(this).val().trim();
        if (!brandName) return;
        $.ajax({
            type: "POST",
            url: `${appBaseURL}/api/Master/GetBrandType?BrandName=${brandName}`,
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                var PicklistNot = response && response[0].PicklistNo;
                if (PicklistNot === "N") {
                    $('#txtPickListNo').prop('required', false);
                    $('#txtPickListNolab').text('PickList No (Optional)');
                } else if (PicklistNot === "Y") {
                    $('#txtPickListNo').prop('required', true);
                    $('#txtPickListNolab').html('PickList No <span style="color:red">*</span>');
                    toastr.error("PickList No required !");

                } else {
                    $('#txtPickListNo').prop('required', false);
                    $('#txtPickListNolab').text('PickList No');
                }
            },
            error: function (xhr, status, err) {
                console.warn("Could not fetch Pick list type", status, err);
            }
        });
    });
    $("#txtBrandName").on("focus", function () {
        $(this).val("");
    });
});

$(document).on("change", "#txtVendorName", function () {
    const vendorName = $(this).val().trim();
    const selectedVendor = AccountList.find(v => v.AccountName === vendorName);
    if (selectedVendor) {
        VendorWiseBrandList(selectedVendor.Code);
    }
});

$(document).on("change", "#txtBrandName", function () {
    const BrandName = $(this).val().trim();
    const selectedBrand = BrandList.find(r => r.BrandName === BrandName);
    if (selectedBrand) {
        GetItemDetails(selectedBrand.Code)
    }
});
function ShowMRNMasterlist(Type) {
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
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetMRNMasterList?FromDate=${FromDate}&ToDate=${ToDate}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                unblockUI();
                $("#MRNTable").show();
                const StringFilterColumn = ["Vender Name","Vehicle No"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["MRN Date","Challan Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Challan No"];
                let hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                if (G_IsValidation == 'N') {
                    hiddenColumns.push("Validation Status");
                }
                if (G_IsUnloading == 'N') {
                    hiddenColumns.push("Unloading Status");
                }
                const updatedResponse = response.map(item => ({
                    ...item,
                    "Unloading Status": `<a style="cursor:pointer;" onclick=ShowCaseNoData(${item.Code},${item["PickList No"]})>${item["Unloading Status"]}</a>`,
                    "Validation Status": `<a style="cursor:pointer;" onclick=ShowCaseNoDataQty(${item.Code})>${item["Validation Status"]}</a>`
                    ,Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}','${item["Unloading Status"]}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.Code}','${item[`Challan No`]}','${item["Unloading Status"]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    <button class="btn btn-success icon-height mb-1"  title="GENERATE QR" onclick="DownloadQR('${item.Code}')"><i class="fa fa-qrcode" aria-hidden="true"></i> </button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                ChangecolorTr();
            } else {
                unblockUI();
                $("#MRNTable").hide();
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
    if (Status !== 'UNLOADING PENDING' && G_IsUnloading == 'Y' && G_IsValidation == 'Y') {
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
                    $("#txtBrandName").val(MRNMaster.BrandName || "");
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
    if (status !== 'UNLOADING PENDING' && G_IsUnloading == 'Y' && G_IsValidation == 'Y') {
        toastr.error("Un-Loading start you can`t delete !.");
        return;
    }
  
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    
    const { Status, msg1 } = await CheckRelatedRecord(code, 'mrnmaster');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this item ${Challan} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/DeleteMRNMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowMRNMasterlist('Get');
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
    $('tr').removeClass('highlight');
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
function VendorWiseBrandList(Code) {
    $.ajax({
        url: `${appBaseURL}/api/Master/VendorWiseBrandList?VendorMaster_Code=${Code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtBrandList').empty();
                let options = '';
                BrandList = response; 
                BrandList.forEach(item => {
                    options += '<option value="' + item.BrandName + '" text="' + item.Code + '"></option>';
                });

                $('#txtBrandList').html(options);
            } else {
                $('#txtBrandList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtBrandList').empty();
        }
    });
}
function GetItemDetails(BrandMaster) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetailss?BrandMaster_Code=${BrandMaster}`,
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
function GetItemDetail() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                ItemDetail = response;
                
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
    const BrandName = $("#txtBrandName").val();
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
    }
    //} else if (PickListNo == '') {
    //    toastr.error("Please enter PickList No !");
    //    $("#txtPickListNo").focus();
    //    return;
    //}
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
        PickListNo: PickListNo,
        BrandName: BrandName
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
                ShowMRNMasterlist('Get');
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
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
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
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
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
    const row = $(this).closest("tr"); 
    const table = document.getElementById("tblorderbooking").querySelector("tbody");

    if (table.querySelectorAll("tr").length > 1) {
        ConfrmationMaltipal(row);

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
    blockUI();
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
                ShowMRNMasterlist('Get');
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
            //if (header.toLowerCase().includes('date') && value) {
            //    value = convertDateFormat1(value);
            //}

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
    blockUI();
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
                unblockUI();
                CreateTable(response);
        },
        error: function (xhr, status, error) {
            unblockUI();
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
    ShowMRNMasterlist('Load');
    $('#txtFromDate').datepicker({
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
                    $("#txtBrandName").val(MRNMaster.BrandName || "").prop("disabled", true);
                    $("#txtAddress").val(MRNMaster.Address || "");
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
    $("#txtsave").prop("disabled", disabled);
    $("#tblorderbooking")
        .find("input, select, textarea, button")
        .not("#btnBack, .txtItemAddress, .txtUOM, .txtBillQtyBox, .txtReceivedQtyBox, .txtAmount")
        .prop("disabled", disabled)
        .css("pointer-events", disabled ? "none" : "auto");
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
                ExportMRN(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function ExportMRN(jsonData) {
    const columnsToRemove = ["Code"];
    const renameMap = {
        "ItemName": G_ItemConfig[0].ItemNameHeader || 'Item Name',
        "ItemCode": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
    };

    if (!Array.isArray(columnsToRemove)) {
        console.error("columnsToRemove should be an array");
        return;
    }

    const filteredAndRenamedData = jsonData.map(row => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
            if (!columnsToRemove.includes(key)) {
                const newKey = renameMap[key] || key;
                newRow[newKey] = value;
            }
        }
        return newRow;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    const headers = Object.keys(filteredAndRenamedData[0] || {});
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
        cell.font = { bold: true };
    });
    filteredAndRenamedData.forEach(data => {
        worksheet.addRow(Object.values(data));
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "MRNMaster.xlsx";
    link.click();
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
function ShowCaseNoData(Code, PickListNo) {
    $("#hfMRNMaster_Code").val(Code);
    $("#hfPicklistNo").val(PickListNo)
    openSavePopup();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetExportBoxUnloading?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                        $("#MRNTable").show();
                        const StringFilterColumn = ["CaseNo", G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
                        const NumericFilterColumn = [];
                        const DateFilterColumn = [];
                        const Button = false;
                        const showButtons = [];
                        const StringdoubleFilterColumn = [];
                        const hiddenColumns = ["Code", "BillQtyBox", "Status", "ReceivedQtyBox","ItemBarCode", "ReceivedQty", "ItemRate", "Amount", "Remarks", "UOMName","LocationName","WarehouseName"];
                        const ColumnAlignment = {
                };
                const renameMap = {
                    "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                    "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                };
                const updatedResponse = response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
                        return renamedItem;
                    });
                BizsolCustomFilterGrid.CreateDataTable("ModalTable-header", "ModalTable-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false);
                 
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
        const columnValue = tds[8]?.textContent.trim();
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
                    const StringFilterColumn = ["CaseNo", G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code', G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name'];
                    const NumericFilterColumn = ["BillQty", "ReceivedQty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code", "BillQtyBox", "ItemBarCode", "Status", "ReceivedQtyBox","ItemRate", "Amount", "Remarks", "UOMName", "LocationName", "WarehouseName"];
                    const ColumnAlignment = {
                        BillQty:"right",
                        ReceivedQty:"right"
                    };
                    const renameMap = {
                        "ItemName": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "ItemCode": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = response.MRNDetails.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("ModalTable-headerQty", "ModalTable-bodyQty", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
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
async function DownloadInExcel() {
    try {
        const Code = $("#hfMRNMaster_Code").val();
        const response = await getDataWithAjax(Code);

        if (response.length > 0) {
            await Export(response);
        } else {
            alert("Record not found...!");
        }
    } catch (error) {
        console.error("AJAX error:", error);
    }
}
function getDataWithAjax(Code) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/GetExportBoxUnloading?Code=${Code}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                resolve(response);
            },
            error: function (xhr, status, error) {
                reject(error);
            }
        });
    });
}
function convertToArray(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(key => obj[key]));
    return [headers, ...rows];
}
function VehicleNoList() {
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetVehicleNoList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const $input = $('#txtImportVehicleNo');
            let $list = $('#txtImportVehicleNoList');
            if (!$list.parent().is('body')) {
                $list.appendTo('body');
            }

            if (response && response.length > 0) {
                const offset = $input.offset();

                $list.css({
                    position: 'absolute',
                    top: offset.top + $input.outerHeight(),
                    left: offset.left,
                    width: $input.outerWidth(),
                    zIndex: 99999,
                    display: 'block'
                });

                SetUpAutoSuggestion(
                    $input,
                    $list,
                    response.map(item => ({ Desp: item["VehicleNo"] })),
                    'StartWith'
                );
            } else {
                $list.empty().hide();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}

async function Export(Data) {
    const Picklist = $("#hfPicklistNo").val();
    const renameMap = {
        "Item Name": G_ItemConfig[0].ItemNameHeader || 'Item Name',
        "Item Code": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
    };

    const originalHeaders = Object.keys(Data[0] || {});
    const newHeaders = originalHeaders.map(key => renameMap[key] || key);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");

    // Add custom header row
    const headerRow = sheet.addRow(newHeaders);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Set AutoFilter for header row
    sheet.autoFilter = {
        from: 'A1',
        to: String.fromCharCode(65 + newHeaders.length - 1) + '1'
    };

    // Add data rows
    Data.forEach(rowObj => {
        const row = originalHeaders.map(key => rowObj[key]); // Keep column order consistent
        const addedRow = sheet.addRow(row);

        addedRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        const status = rowObj["Scan Status"]; // Use original key name
        const fillColor = status === 'Y' ? "FF9EF3A5" : "FFF5C0BF";

        addedRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: fillColor }
            };
        });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Unloading_${Picklist}.xlsx`;
    link.click();
}

function DownloadQR(Code) {
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetGenerateQR?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            if (response.length > 0) {
                
                $("#qrcode").html("");

                for (let i = 0; i < response.length; i++) {
                    const item = response[i];
                    const textValue = `${item.ItemCode}/${item.Rate}`;
                    const divId = `qrcode_${i}`;
                    $("#qrcode").append(`<div id="${divId}" style="display:none;"></div>`);
                    new QRCode(document.getElementById(divId), {
                        text: textValue,
                        width: 100,
                        height: 100,
                    });
                    await new Promise(resolve => setTimeout(resolve, 300));
                    const canvas = $(`#${divId} canvas`)[0];
                    if (canvas) {
                        const base64Image = canvas.toDataURL('image/png');
                        response[i].QRCode = base64Image;
                    }
                }

              
                DownloadQRPdf(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            
            console.error("Error:", error);
        }
    });
}

function DownloadQRPdf(response) {
    blockUI();
    $.ajax({
        url: `${AppBaseURLMenu}/RDLC/GPrintQR`,
        type: 'POST',
        xhrFields: {
            responseType: 'blob'
        },
        contentType: 'application/json',
        data: JSON.stringify(response),
        success: function (data, status, xhr) {
           
                let blob = new Blob([data], { type: 'application/pdf' });
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = "PrintQR.pdf";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                unblockUI();
           
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error('Error downloading report:', xhr.responseText);
        }
    });
}

////////////////////////////////////////
//var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
//var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
//let UserMaster_Code = authKeyData.UserMaster_Code;
//let UserType = authKeyData.UserType;
//let UserModuleMaster_Code = 0;
//let Data = [];
//const appBaseURL = sessionStorage.getItem('AppBaseURL');
//const G_UserName = sessionStorage.getItem('UserName');
//const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
//let AccountList = [];
//let ItemDetail = [];
//let G_OrderList = [];
//let G_DispatchMaster_Code = 0;
//let G_Tab = 1;
//let All = 0;
//let G_IDFORTRCOLOR = '';
//let G_UPDATEBOX = 'N';
//let originalDispatchData = [];
//let originalTransitData = [];
//let originalCompletedData = [];
//let G_OrderMaster = [];
//$(document).ready(function () {
//    DatePicker();
//    GetDispatchOrderLists('GETCLIENT');
//    GetOrderNoList1();
//    $("#ERPHeading").text("Order Packing");
//    $('#txtChallanDate').on('keydown', function (e) {
//        if (e.key === "Enter") {
//            $("#txtClientName").focus();
//        }
//    });
//    $('#txtClientName').on('keydown', function (e) {
//        if (e.key === "Enter") {
//            $("#txtPackedBy").focus();
//        }
//    });
//    $('#txtVehicleNo').on('keydown', function (e) {
//        if (e.key === "Enter") {
//            let firstInput = $('#tblorderbooking #Orderdata tr:first input').first();
//            firstInput.focus();
//        }
//    });
//    GetAccountMasterList();
//    GetModuleMasterCode();
//    $("#txtClientName").on("focus", function () {
//        $("#txtClientName").val("");
//    });
//    $("#txtClientName").on("change", function () {
//        let value = $(this).val();
//        let isValid = false;
//        $("#txtClientNameList option").each(function () {
//            if ($(this).val() === value) {
//                isValid = true;
//                return false;
//            }
//        });
//        if (!isValid) {
//            $(this).val("");
//            $("#txtAddress").val("")
//        }
//    });
//    $("#pendingOrder").click(function () {

//        GetDispatchOrderLists('GETCLIENT');
//        $("#txtshowhide").hide();
//        $("#txtDownload").show();
//        $("#txtToDate1").show();
//        $("#txtDownloadDate1").show();
//    });
//    $("#despatchTransit").click(function () {

//        GetDespatchTransitOrderList('DespatchTransit');
//        $("#txtshowhide").hide();
//        $("#txtDownload").hide();
//        $("#txtToDate1").hide();
//        $("#txtDownloadDate1").hide();
//    });
//    $("#completedDespatch").click(function () {

//        GetCompletedDespatchOrderList('CompletedDespatch');
//        $("#txtshowhide").hide();
//        $("#txtDownload").show();
//        $("#txtToDate1").show();
//        $("#txtDownloadDate1").show();
//    });
//    $('#txtScanProduct').on('input', function (e) {
//        if (G_UPDATEBOX == 'N') {
//            SaveScanQty();
//        } else {
//            ScanUpdateBoxNo();
//        }
//    });
//    $("#txtOrderNo").on("change", function () {
//        let value = $(this).val();
//        let isValid = false;
//        if ($(this).val() === value) {
//            const item = G_OrderList.find(entry => entry.OrderNoWithPrefix == value);
//            if (item.Code != undefined) {
//                CreateOrderNo(item.Code);

//            }
//            isValid = true;
//            return false;
//        }
//        if (!isValid) {
//            $(this).val("");
//        }
//    });
//    $("#ShowAll").click(function () {
//        All = 1;
//        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS")
//    });
//    //$('#txtScanProduct').on('focus', function (e) {
//    //    if ($("#txtIsManual").is(':checked')) {
//    //        var inputElement = this;
//    //        setTimeout(function () {
//    //            inputElement.setAttribute('inputmode', '');
//    //        }, 2);

//    //    } else {
//    //        var inputElement = this;
//    //        setTimeout(function () {
//    //            inputElement.setAttribute('inputmode', 'none');
//    //        }, 2);
//    //    }
//    //});
//    $('#txtScanProduct').on('focus', function () {
//        const inputElement = this;
//        const isManual = $("#txtIsManual").is(':checked');
//        setTimeout(function () {
//            inputElement.setAttribute('inputmode', isManual ? '' : 'none');
//        }, 2);
//    });
//    $('#txtScanProduct').on('blur', function () {
//        $(this).attr('inputmode', '');
//    });
//    $("#txtSearch").on("input", function () {
//        const searchValue = $(this).val().toLowerCase().trim();
//        let filteredData = [];
//        let updatedResponse = [];
//        let StringFilterColumn = [];
//        let NumericFilterColumn = [];
//        let DateFilterColumn = [];
//        const Button = false;
//        const showButtons = [];
//        const StringdoubleFilterColumn = [];
//        let hiddenColumns = [];
//        let ColumnAlignment = {};
//        if (G_Tab === 1) {
//            filteredData = originalDispatchData.filter(item =>
//                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
//            );
//            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
//            NumericFilterColumn = ["TOQ", "TBQ"];
//            DateFilterColumn = [];
//            hiddenColumns = (UserType === "A") ? ["Code"] : ["Code", "Order Date"];
//            ColumnAlignment = {
//                "TOQ": 'right',
//                "TBQ": 'right'
//            };

//            updatedResponse = filteredData.map(item => ({
//                ...item
//                , Action: `<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchPanding('${item.Code}','ORDERDETAILS')"><i class="fa-solid fa-pencil"></i></button>`
//            }));

//        } else if (G_Tab === 2) {
//            filteredData = originalTransitData.filter(item =>
//                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
//            );
//            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
//            NumericFilterColumn = ["Order Qty", "TDQty"];
//            DateFilterColumn = ["Despatch Date"];
//            hiddenColumns = (UserType === "A") ? ["Code", "D_Code"] : ["Code", "D_Code", "Dispatch Date"];
//            ColumnAlignment = {
//                "TDQ": 'right'
//            };

//            updatedResponse = filteredData.map(item => ({
//                ...item
//                , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchTransit('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
//                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>
//                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
//                    `
//            }));

//        } else if (G_Tab === 3) {
//            filteredData = originalCompletedData.filter(item =>
//                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
//            );

//            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
//            NumericFilterColumn = ["Order Qty", "TDQ"];
//            DateFilterColumn = [];
//            hiddenColumns = (UserType === "A") ? ["Code", "D_Code"] : ["Code", "D_Code", "Dispatch Date"];
//            ColumnAlignment = {
//                "TDQ": 'right'
//            };

//            updatedResponse = filteredData.map(item => ({
//                ...item
//                , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchCompleteTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa-pencil"></i></button>
//                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="Download" onclick="Report('${item.D_Code}')"><i class="fa-solid fa fa-download"></i></button>
//                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
//                    `
//            }));

//        }
//        if (filteredData.length === 0) {
//            $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
//            return;
//        }
//        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment
//        );
//    });
//    $('#txtManualProductQuantity').on('keydown', function (e) {
//        if (e.key === "Enter") {
//            $("#txtManualProductMRP").focus();
//        }
//    });
//    $('#txtManualProductMRP').on('keydown', function (e) {
//        if (e.key === "Enter") {
//            SaveManual();
//        }
//    });
//});
//function BackMaster() {
//    G_UPDATEBOX = 'N';
//    G_IDFORTRCOLOR = '';
//    $("#txtListpage").show();
//    $("#txtCreatepage").hide();
//    $("#txtheaderdiv").hide();
//    ClearData();
//    disableFields(false);
//    $("#btnShowAll").hide();
//    $("#txtOrderNo").prop("disabled", true);
//    $("#txtScanProduct").prop("disabled", false);
//    if (G_Tab == 3) {
//        GetCompletedDespatchOrderList('CompletedDespatch');
//    }
//    if (G_Tab == 2) {
//        GetDespatchTransitOrderList('DespatchTransit');
//    }
//    if (G_Tab == 1) {
//        GetDispatchOrderLists('GETCLIENT');
//    }
//}
//function GetAccountMasterList() {
//    $.ajax({
//        url: `${appBaseURL}/api/Master/GetAccountIsClientDropDown`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                AccountList = response;
//                $('#txtClientNameList').empty();
//                let options = '';
//                options += '<option value="All" text="0"></option>';
//                response.forEach(item => {
//                    options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
//                });
//                $('#txtClientNameList').html(options);
//            } else {
//                $('#txtClientNameList').empty();
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//            $('#txtClientNameList').empty();
//        }
//    });
//}
//function ClearData() {
//    G_DispatchMaster_Code = 0;
//    All = 0;
//    $("#hfCode").val("0");
//    $("#txtChallanNo").val("");
//    $("#txtScanProduct").val("");
//    $("#txtClientDispatchName").val("");
//    $("#tblDispatchData").hide();
//    $("#txtScanProduct").attr('inputmode', '');
//    SelectOptionByText('txtOrderNo', 'Select');
//}
//function OnChangeNumericTextBox(element) {

//    element.value = element.value.replace(/[^0-9]/g, "");
//    if (Number.isInteger(parseInt(element.value)) == true) {
//        element.setCustomValidity("");

//    } else {
//        element.setCustomValidity("Only allowed Numbers");
//    }
//    element.reportValidity();
//}
//function OnKeyDownPressFloatTextBox(event, element) {
//    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
//        element.setCustomValidity("");
//        element.reportValidity();
//        BizSolhandleEnterKey(event);
//        return true;
//    }
//    else {
//        element.setCustomValidity("Only allowed Float Numbers");
//        element.reportValidity();
//        return false;
//    }
//}
//function BizSolhandleEnterKey(event) {
//    if (event.key === "Enter") {
//        //const inputs = document.getElementsByTagName('input')
//        const inputs = $('.BizSolFormControl')
//        const index = [...inputs].indexOf(event.target);
//        if ((index + 1) == inputs.length) {
//            inputs[0].focus();
//        } else {
//            inputs[index + 1].focus();
//        }

//        event.preventDefault();
//    }
//}
//function GetModuleMasterCode() {
//    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
//    const result = Data.find(item => item.ModuleDesp === "Order Packing");
//    if (result) {
//        UserModuleMaster_Code = result.Code;
//    }
//}
//function convertDateFormat(dateString) {
//    const [day, month, year] = dateString.split('/');
//    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//    const monthAbbreviation = monthNames[parseInt(month) - 1];
//    return `${day}-${monthAbbreviation}-${year}`;
//}
//function setupDateInputFormatting() {
//    $('#txtChallanDate').on('input', function () {
//        let value = $(this).val().replace(/[^\d]/g, '');
//        if (value.length >= 2 && value.length < 4) {
//            value = value.slice(0, 2) + '/' + value.slice(2);
//        } else if (value.length >= 4) {
//            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
//        }
//        $(this).val(value);
//        if (value.length === 10) {
//            validateDate(value);
//        } else {
//            $(this).val(value);
//        }
//    });
//}
//function validateDate(value) {
//    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
//    let isValidFormat = regex.test(value);

//    if (isValidFormat) {
//        let parts = value.split('/');
//        let day = parseInt(parts[0], 10);
//        let month = parseInt(parts[1], 10);
//        let year = parseInt(parts[2], 10);

//        let date = new Date(year, month - 1, day);

//        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

//            $(this).val(value);
//        } else {
//            $('#txtChallanDate').val('');

//        }
//    } else {
//        $('#txtChallanDate').val('');

//    }
//}
////function DatePicker() {
////    $.ajax({
////        url: `${appBaseURL}/api/Master/GetCurrentDate`,
////        method: 'GET',
////        beforeSend: function (xhr) {
////            xhr.setRequestHeader('Auth-Key', authKeyData);
////        },
////        success: function (response) {
////            let apiDate = response[0].Date;
////            $('#txtChallanDate').val(apiDate);

////            $('#txtChallanDate').datepicker({
////                format: 'dd/mm/yyyy',
////                autoclose: true,
////            });
////            DatePickerForDownloadDate(apiDate);
////        },
////        error: function () {
////            console.error('Failed to fetch the date from the API.');
////        }
////    });
////}
//function convertToUppercase(element) {
//    element.value = element.value.toUpperCase();
//}
//function DataExport() {
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetDispatchOrderList`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                ExportData(response);
//            } else {
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });

//}
//function ExportData(jsonData) {
//    const columnsToRemove = ["Code"];
//    if (!Array.isArray(columnsToRemove)) {
//        console.error("columnsToRemove should be an array");
//        return;
//    }
//    const filteredData = jsonData.map(row =>
//        Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
//    );
//    const ws = XLSX.utils.json_to_sheet(filteredData);
//    const wb = XLSX.utils.book_new();
//    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//    XLSX.writeFile(wb, "DispatchOrder.xlsx");
//}
//function ScanItemForDispatch() {
//    if ($("#txtScanProduct").val() == '') {
//        toastr.error("Please scan product !");
//        $("#txtScanProduct").focus();
//        return;
//    }
//    const payload = {
//        Code: $("#hfCode").val(),
//        ScanNo: $("#txtScanProduct").val(),
//        UserMaster_Code: UserMaster_Code
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                StartDispatch($("#hfCode").val())
//                $("#txtScanProduct").focus();
//                $("#txtScanProduct").val("");
//            } else if (response[0].Status == 'N') {
//                showToast(response[0].Msg);
//                $("#txtScanProduct").focus();
//                $("#txtScanProduct").val("");
//            } else {
//                showToast(response[0].Msg);
//                $("#txtScanProduct").focus();
//                $("#txtScanProduct").val("");
//            }
//        },
//        error: function (xhr, status, error) {
//            showToast("INVALID SCAN NO !");
//            $("#txtScanProduct").focus();
//            $("#txtScanProduct").val("");
//        }
//    });

//}
//function showToast(Msg) {
//    let toast = document.getElementById("toast");
//    let overlay = document.getElementById("overlay");

//    toast.innerText = Msg;
//    overlay.style.display = "block";
//    toast.style.display = "block";
//    let alertSound = new Audio("https://www.fesliyanstudios.com/play-mp3/4387");
//    alertSound.play().catch(error => console.log("Audio playback failed:", error));
//    setTimeout(() => toast.style.opacity = "1", 10);
//    let blinkInterval = setInterval(() => {
//        toast.style.visibility = (toast.style.visibility === "hidden") ? "visible" : "hidden";
//    }, 3000);
//    setTimeout(() => {
//        clearInterval(blinkInterval);
//        toast.style.visibility = "visible";
//        toast.style.opacity = "0";
//        setTimeout(() => {
//            toast.style.display = "none";
//            overlay.style.display = "none";
//        }, 300);
//    }, 3000);
//}
//function GetDispatchOrderLists(Mode) {
//    $("#txtSearch").val("");
//    G_Tab = 1;
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                originalDispatchData = response;
//                G_OrderMaster = response[0]["Order Date"];
//                let Date = G_OrderMaster;
//                DatePickerForDownloadOld(Date);
//                $("#DataTable").show();
//                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
//                const NumericFilterColumn = ["TOQ", "TBQ"];
//                const DateFilterColumn = [];
//                const Button = false;
//                const showButtons = [];
//                const StringdoubleFilterColumn = [];
//                let hiddenColumns = [];
//                if (UserType == "A") {
//                    hiddenColumns = ["Code"];
//                } else {
//                    hiddenColumns = ["Code", "Order Date"];
//                }
//                const ColumnAlignment = {
//                    "TOQ": 'right',
//                    "TBQ": 'right'
//                };
//                const updatedResponse = response.map(item => ({
//                    ...item
//                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchPanding('${item.Code}','ORDERDETAILS')"><i class="fa-solid fa-pencil"></i></button>`
//                }));
//                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
//            } else {
//                $("#DataTable").hide();
//                toastr.error("Record not found...!");
//                originalDispatchData = [];
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//            originalDispatchData = [];
//        }
//    });
//}
//function DatePicker() {
//    $.ajax({
//        url: `${appBaseURL}/api/Master/GetCurrentDate`,
//        method: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            var apiDateRaw = null;
//            if (response && response.length > 0 && response[0] && response[0].Date) {
//                apiDateRaw = response[0].Date;
//            }

//            var apiDate = DatePickerForDownloadDate(apiDateRaw);
//            var challanDate = DatePickerForDownloadOld(Data);
//            var $challan = $('#txtChallanDate');
//            var $to = $('#txtToDate');

//            try { $challan.datepicker('destroy'); } catch (e) { }
//            try { $to.datepicker('destroy'); } catch (e) { }

//            var minDate = challanDate;

//            $challan.datepicker({
//                format: 'dd/mm/yyyy',
//                autoclose: true,
//                startDate: minDate
//            });

//            $to.datepicker({
//                format: 'dd/mm/yyyy',
//                autoclose: true,
//                startDate: minDate
//            });

//            if (apiDate) {
//                $challan.datepicker('setDate', apiDate);
//            }
//            if (challanDate) {
//                $to.datepicker('setDate', challanDate);
//            }
//        },
//        error: function () {
//            console.error('Failed to fetch the date from the API.');
//        }
//    });
//}
//async function StartDispatchPanding(Code, Mode) {
//    if (G_DispatchMaster_Code === 0) {
//        //GetUserNameList();
//    }
//    G_Tab = 1;
//    $("#btnShowAll").hide();
//    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    $("#tab1").text("NEW");
//    $("#txtListpage").hide();
//    $("#txtCreatepage").show();
//    $("#txtheaderdiv").show();
//    $("#dvIsDelete").hide();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
//        type: 'GET',
//        contentType: "application/json",
//        dataType: "json",
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response) {
//                if (response.OrderMaster && response.OrderMaster.length > 0) {
//                    const OrderMaster = response.OrderMaster[0];
//                    $("#hfCode").val(OrderMaster.Code || "");
//                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
//                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
//                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
//                    $("#txtPackedBy").val(G_UserName);
//                    $("#txtBoxNo").val(OrderMaster.BoxNo);
//                    GetTotalLineOfPart(OrderMaster.Code);
//                }
//                if (response.OrderDetial && response.OrderDetial.length > 0) {
//                    $("#tblDispatchData").show();
//                    var Response = response.OrderDetial;
//                    Data = response.OrderDetial;
//                    const StringFilterColumn = [];
//                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
//                    const DateFilterColumn = [];
//                    const Button = false;
//                    const showButtons = [];
//                    const StringdoubleFilterColumn = [G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
//                    let hiddenColumns = [];
//                    if (UserType == "A") {
//                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
//                    } else {
//                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
//                    }
//                    const ColumnAlignment = {
//                        "Ord Qty": "right;width:30px;",
//                        "Bal Qty": "right;width:30px;",
//                        "Scan Qty": "right;width:70px;",
//                        "Packing Qty": "right;width:70px;",
//                        "Manual Qty": "right;width:70px;",
//                        "MRP": "right;width:70px;",
//                    };
//                    const renameMap = {
//                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
//                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
//                    };
//                    const updatedResponse = Response.map(item => {
//                        const renamedItem = {};

//                        for (const key in item) {
//                            if (renameMap.hasOwnProperty(key)) {
//                                renamedItem[renameMap[key]] = item[key];
//                            } else {
//                                renamedItem[key] = item[key];
//                            }
//                        }
//                        renamedItem["MRP"] = ` <input type="text" id="txtMRPQty_${item.Code}" value="${item["MRP"]}"onclick="ManualUpdateQtyAndMRP('${item["MRP"] == "NULL" ? 0 : item["MRP"]})" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="MRP..">`;
//                        renamedItem["Scan Qty"] = `
//                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" readonly onclick="ManualUpdateQtyAndMRP('${item["Item Code"]}', ${item["Bal Qty"]}, ${item["MRP"] == "NULL" ? 0 : item["MRP"]})" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`;
//                        renamedItem["Manual Qty"] = `
//                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
//                            renamedItem["Packing Qty"] = `
//                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
//                        renamedItem["Action"] = item["ROWSTATUS"] == 'RED' ? '' : `<button class="btn btn-danger icon-height mb-1"  title="Delete item qty" onclick="DeleteItemQty('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
//                        return renamedItem;
//                    });
//                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

//                } else {
//                    $("#tblDispatchData").hide();
//                }
//            } else {
//                toastr.error("Record not found...!");
//                $("#tblDispatchData").hide();
//            }
//        },
//        error: function (xhr, status, error) {
//            toastr.error("Record not found...!");
//            $("#tblDispatchData").hide();
//        }
//    });
//}
//function checkValidateqty(element, Code) {
//    var manualQty = parseInt($(element).val());
//    var scanQty = parseInt($("#txtScanQty_" + Code).val());

//    const item = Data.find(entry => entry.Code == Code);
//    var total = scanQty + manualQty;

//    if (total > parseInt(item["Bal Qty"])) {
//        toastr.error("Invalid Packing Qty!");
//        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//        $("#txtManualQty_" + Code).focus();
//    } else {
//        var currentRow = $(element).closest("tr");
//        var nextRow = currentRow.next("tr");

//        if (nextRow.length > 0) {
//            var nextInput = nextRow.find(".txtManualQty").first();
//            if (nextInput.length > 0) {
//                nextInput.focus();
//            }
//        }
//    }
//}
//function checkValidateqty1(element, Code) {
//    var manualQty = parseInt($(element).val());
//    var scanQty = parseInt($("#txtScanQty_" + Code).val());

//    const item = Data.find(entry => entry.Code == Code);
//    var total = scanQty + manualQty;

//    if (total > parseInt(item["Bal Qty"])) {
//        toastr.error("Invalid Packing Qty!");
//        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//    } else {
//        if ($("#txtBoxNo").val() === '') {
//            toastr.error("Please enter box no..!");
//            StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//            return;
//        }
//        $("#txtDispatchQty_" + Code).val(total);
//        if (manualQty > 0) {
//            G_IDFORTRCOLOR = "txtDispatchQty_" + Code;
//            SaveNewManualQty(Code, scanQty, manualQty, total);
//        }
//    }
//}
//function OnChangeNumericTextBox(event, element) {
//    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
//        element.setCustomValidity("");
//        element.reportValidity();
//        BizSolhandleEnterKey(event);
//        return true;
//    }
//    else {
//        element.setCustomValidity("Only allowed Float Numbers");
//        element.reportValidity();
//        return false;
//    }
//}
//function BizSolhandleEnterKey(event) {
//    if (event.key === "Enter") {
//        const inputs = $('.BizSolFormControl')
//        const index = [...inputs].indexOf(event.target);
//        if ((index + 1) == inputs.length) {
//            inputs[0].focus();
//        } else {
//            inputs[index + 1].focus();
//        }

//        event.preventDefault();
//    }
//}
//function SaveEditManualQty(Code, ScanQty, ManualQty, DispatchQty) {
//    if ($("#txtBoxNo").val() === '') {
//        toastr.error("please enter box no..!");
//        return;
//    }
//    const payload = {
//        Code: Code,
//        DispatchMaster_Code: G_DispatchMaster_Code,
//        ScanNo: "",
//        ScanQty: ScanQty,
//        ManualQty: ManualQty,
//        DispatchQty: DispatchQty,
//        UserMaster_Code: UserMaster_Code,
//        PackedBy: ''
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch?Mode=Edit`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                if (G_Tab == 2) {
//                    if (All == 0) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//                    } else if (All == 1) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//                    }
//                } else if (G_Tab == 3) {
//                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//                }
//                G_IDFORTRCOLOR = 'GET';
//            } else {
//                showToast(response[0].Msg);
//                if (G_Tab == 2) {
//                    if (All == 0) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//                    } else if (All == 1) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//                    }
//                } else if (G_Tab == 3) {
//                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//                }
//                G_IDFORTRCOLOR = 'GET';
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });

//}
//function SaveNewManualQty(Code, ScanQty, ManualQty, DispatchQty) {
//    if ($("#txtBoxNo").val() === '') {
//        toastr.error("please enter box no..!");
//        return;
//    }
//    const payload = {
//        Code: Code,
//        DispatchMaster_Code: G_DispatchMaster_Code,
//        ScanNo: "",
//        ScanQty: ScanQty,
//        ManualQty: ManualQty,
//        DispatchQty: DispatchQty,
//        UserMaster_Code: UserMaster_Code,
//        PackedBy: ''
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch?Mode=New`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
//                StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//                G_IDFORTRCOLOR = 'GET';
//            } else {
//                showToast(response[0].Msg);
//                StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//                G_IDFORTRCOLOR = 'GET';
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });

//}
//function SaveScanQty() {
//    if ($("#txtScanProduct").val() == '') {
//        toastr.error("Please scan product !");
//        $("#txtScanProduct").focus();
//        return;
//    } else if ($("#txtBoxNo").val() === '') {
//        toastr.error("Please enter box no..!");
//        return;
//    }
//    const payload = {
//        Code: $("#hfCode").val(),
//        ScanNo: $("#txtScanProduct").val(),
//        ScanQty: 0,
//        ManualQty: 0,
//        DispatchQty: 0,
//        DispatchMaster_Code: G_DispatchMaster_Code,
//        UserMaster_Code: UserMaster_Code,
//        PackedBy: '',
//        BoxNo: $("#txtBoxNo").val()
//    }
//    blockUI();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch?Mode=Scan`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
//                $("#SuccessVoice")[0].play();
//                if (G_Tab == 1) {
//                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//                }
//                else if (G_Tab == 2) {
//                    if (All == 0) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//                    } else if (All == 1) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//                    }
//                } else if (G_Tab == 3) {
//                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//                }
//                G_IDFORTRCOLOR = 'GET';
//                $("#txtScanProduct").val("");
//                $("#txtScanProduct").focus();
//                unblockUI();
//            } else if (response[0].Status == 'N') {
//                G_IDFORTRCOLOR = '';
//                showToast(response[0].Msg);
//                $("#txtScanProduct").val("");
//                $("#txtScanProduct").focus();
//                unblockUI();
//            } else {
//                G_IDFORTRCOLOR = '';
//                showToast(response[0].Msg);
//                $("#txtScanProduct").val("");
//                $("#txtScanProduct").focus();
//                unblockUI();
//            }
//        },
//        error: function (xhr, status, error) {
//            showToast("INVALID SCAN NO !");
//            $("#txtScanProduct").val("");
//            $("#txtScanProduct").focus();
//            unblockUI();
//        }
//    });

//}
//async function StartDispatchTransit(Code, DispatchMaster_Code, Mode) {
//    G_DispatchMaster_Code = DispatchMaster_Code;
//    G_Tab = 2;
//    $("#hfCode").val(Code);
//    var Code1 = Code;
//    $("#btnShowAll").show();
//    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    $("#tab1").text("Edit");
//    $("#txtListpage").hide();
//    $("#txtCreatepage").show();
//    $("#txtheaderdiv").show();
//    $("#dvIsDelete").hide();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code1}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
//        type: 'GET',
//        contentType: "application/json",
//        dataType: "json",
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response) {
//                if (response.OrderMaster && response.OrderMaster.length > 0) {
//                    const OrderMaster = response.OrderMaster[0];

//                    $("#hfCode").val(OrderMaster.Code || "");
//                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
//                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
//                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
//                    $("#txtChallanDate").val(OrderMaster.ChallanDate || "");
//                    $("#txtPackedBy").val(OrderMaster.PackedBy);
//                    $("#txtBoxNo").val(OrderMaster.BoxNo);
//                    $("#txtScanProduct").prop("disabled", false);
//                    GetTotalLineOfPart(OrderMaster.Code);
//                    disableFields(false);
//                }
//                if (response.OrderDetial && response.OrderDetial.length > 0) {
//                    $("#tblDispatchData").show();
//                    var Response = response.OrderDetial;
//                    Data = response.OrderDetial;
//                    const StringFilterColumn = [];
//                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
//                    const DateFilterColumn = [];
//                    const Button = false;
//                    const showButtons = [];
//                    const StringdoubleFilterColumn = [G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code', G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name'];
//                    let hiddenColumns = [];
//                    if (UserType == "A") {
//                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
//                    } else {
//                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
//                    }
//                    const ColumnAlignment = {
//                        "Ord Qty": "right;width:30px;",
//                        "Bal Qty": "right;width:30px;",
//                        "Scan Qty": "right;width:70px;",
//                        "Packing Qty": "right;width:70px;",
//                        "Manual Qty": "right;width:70px;",
//                    };
//                    const renameMap = {
//                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
//                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
//                    };
//                    const updatedResponse = Response.map(item => {
//                        const renamedItem = {};

//                        for (const key in item) {
//                            if (renameMap.hasOwnProperty(key)) {
//                                renamedItem[renameMap[key]] = item[key];
//                            } else {
//                                renamedItem[key] = item[key];
//                            }
//                        }
//                        renamedItem["MRP"] = ` <input type="text" id="txtMRPQty_${item.Code}" value="${item["MRP"]}"onclick="ManualUpdateQtyAndMRP('${item["MRP"] == "NULL" ? 0 : item["MRP"]})" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="MRP..">`;
//                        renamedItem["Scan Qty"] = `
//                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" onclick="ManualUpdateQtyAndMRP('${item["Item Code"]}', ${item["Bal Qty"]}, ${item["MRP"] == "NULL" ? 0 : item["MRP"]})" readonly class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
//                            renamedItem["Manual Qty"] = `
//                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
//                            renamedItem["Packing Qty"] = `
//                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
//                        renamedItem["Action"] = item["ROWSTATUS"] == 'RED' ? '' : `<button class="btn btn-danger icon-height mb-1"  title="Delete item qty" onclick="DeleteItemQty('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
//                        return renamedItem;

//                        //const updatedResponse = Response.map(item => ({
//                        //    ...item,
//                        //    "Scan Qty": `
//                        //    <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
//                        //    "Manual Qty": `
//                        //    <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyTransit(this,${item.Code});" onfocusout="checkValidateqtyTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
//                        //    "Packing Qty": `
//                        //    <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`,
//                    });
//                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

//                } else {
//                    $("#tblDispatchData").hide();
//                }
//            } else {
//                toastr.error("Record not found...!");
//                $("#tblDispatchData").hide();
//            }
//        },
//        error: function (xhr, status, error) {
//            toastr.error("Record not found...!");
//            $("#tblDispatchData").hide();
//        }
//    });
//}
//function checkValidateqtyTransit(element, Code) {
//    var manualQty = parseInt($(element).val());
//    var scanQty = parseInt($("#txtScanQty_" + Code).val());

//    const item = Data.find(entry => entry.Code == Code);
//    var total = scanQty + manualQty;

//    if (total > parseInt(item["Bal Qty"])) {
//        toastr.error("Invalid Packing Qty!");
//        if (All == 0) {
//            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//        } else if (All == 1) {
//            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//        }
//        $("#txtManualQty_" + Code).focus();
//    } else {
//        var currentRow = $(element).closest("tr");
//        var nextRow = currentRow.next("tr");

//        if (nextRow.length > 0) {
//            var nextInput = nextRow.find(".txtManualQty").first();
//            if (nextInput.length > 0) {
//                nextInput.focus();
//            }
//        }
//    }
//}
//function checkValidateqtyTransit1(element, Code) {
//    var manualQty = parseInt($(element).val());
//    var scanQty = parseInt($("#txtScanQty_" + Code).val());

//    const item = Data.find(entry => entry.Code == Code);
//    var total = scanQty + manualQty;

//    if (total > parseInt(item["Bal Qty"])) {
//        toastr.error("Invalid Packing Qty!");
//        if (All == 0) {
//            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//        } else if (All == 1) {
//            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//        }
//    } else {
//        if ($("#txtBoxNo").val() === '') {
//            toastr.error("Please enter box no..!");
//            if (All == 0) {
//                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//            } else if (All == 1) {
//                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//            }
//            return;
//        }
//        $("#txtDispatchQty_" + Code).val(total);
//        if (manualQty > 0) {
//            SaveEditManualQty(Code, scanQty, manualQty, total);
//        }
//    }
//}
//function GetDespatchTransitOrderList(Mode) {
//    $("#txtSearch").val("");
//    G_Tab = 2;
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                originalTransitData = response;
//                $("#DataTable").show();
//                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
//                const NumericFilterColumn = ["Order Qty", "TDQty"];
//                const DateFilterColumn = ["Despatch Date"];
//                const Button = false;
//                const showButtons = [];
//                const StringdoubleFilterColumn = [];
//                let hiddenColumns = [];
//                if (UserType == "A") {
//                    hiddenColumns = ["Code", "D_Code"];
//                } else {
//                    hiddenColumns = ["Code", "D_Code", "Dispatch Date"];
//                }
//                const ColumnAlignment = {
//                    "TDQ": 'right'
//                };
//                const updatedResponse = response.map(item => ({
//                    ...item
//                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchTransit('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
//                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>
//                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
//                    `
//                }));
//                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
//            } else {
//                originalTransitData = [];
//                $("#DataTable").hide();
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });

//}
//function GetCompletedDespatchOrderList(Mode) {
//    $("#txtSearch").val("");
//    G_Tab = 3;
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                originalCompletedData = response;
//                $("#DataTable").show();
//                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
//                const NumericFilterColumn = ["Order Qty", "TDQ"];
//                const DateFilterColumn = [];
//                const Button = false;
//                const showButtons = [];
//                const StringdoubleFilterColumn = [];

//                let hiddenColumns = [];
//                if (UserType == "A") {
//                    hiddenColumns = ["Code", "D_Code"];
//                } else {
//                    hiddenColumns = ["Code", "D_Code", "Dispatch Date"];
//                }
//                const ColumnAlignment = {
//                    "TDQ": 'right'
//                };
//                const updatedResponse = response.map(item => ({
//                    ...item
//                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchCompleteTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa-pencil"></i></button>
//                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
//                        <button class="btn btn-primary icon-height mb-1"  title="Download" onclick="Report('${item.D_Code}')"><i class="fa-solid fa fa-download"></i></button>
//                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
//                    `
//                }));
//                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
//            } else {
//                originalCompletedData = [];
//                $("#DataTable").hide();
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });

//}
//async function StartDispatchCompleteTransit(Code, Mode) {
//    G_DispatchMaster_Code = Code;
//    G_Tab = 3;
//    $("#btnShowAll").hide();
//    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    $("#tab1").text("Edit");
//    $("#txtListpage").hide();
//    $("#txtCreatepage").show();
//    $("#txtheaderdiv").show();
//    $("#dvIsDelete").hide();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
//        type: 'GET',
//        contentType: "application/json",
//        dataType: "json",
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response) {
//                if (response.OrderMaster && response.OrderMaster.length > 0) {
//                    const OrderMaster = response.OrderMaster[0];
//                    $("#hfCode").val(OrderMaster.Code || "");
//                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
//                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
//                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
//                    $("#txtPackedBy").val(OrderMaster.PackedBy);
//                    $("#txtScanProduct").prop("disabled", false);
//                    $("#txtBoxNo").val(OrderMaster.BoxNo);
//                    GetTotalLineOfPart(OrderMaster.Code);
//                    disableFields(false);
//                }
//                if (response.OrderDetial && response.OrderDetial.length > 0) {
//                    $("#tblDispatchData").show();
//                    var Response = response.OrderDetial;
//                    Data = response.OrderDetial;
//                    const StringFilterColumn = [];
//                    const NumericFilterColumn = ["Ord Qty", "Bal Qty"];
//                    const DateFilterColumn = [];
//                    const Button = false;
//                    const showButtons = [];
//                    const StringdoubleFilterColumn = [G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
//                    let hiddenColumns = [];
//                    if (UserType == "A") {
//                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
//                    } else {
//                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
//                    }
//                    const ColumnAlignment = {
//                        "Ord Qty": "right;width:30px;",
//                        "Bal Qty": "right;width:30px;",
//                        "Scan Qty": "right;width:70px;",
//                        "Packing Qty": "right;width:70px;",
//                        "Manual Qty": "right;width:70px;",
//                    };
//                    const renameMap = {
//                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
//                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
//                    };
//                    const updatedResponse = Response.map(item => {
//                        const renamedItem = {};

//                        for (const key in item) {
//                            if (renameMap.hasOwnProperty(key)) {
//                                renamedItem[renameMap[key]] = item[key];
//                            } else {
//                                renamedItem[key] = item[key];
//                            }
//                        }
//                        renamedItem["MRP"] = ` <input type="text" id="txtMRPQty_${item.Code}" value="${item["MRP"]}"onclick="ManualUpdateQtyAndMRP('${item["MRP"] == "NULL" ? 0 : item["MRP"]})" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="MRP..">`;
//                        renamedItem["Scan Qty"] = `
//                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" onclick="ManualUpdateQtyAndMRP('${item["Item Code"]}', ${item["Bal Qty"]}, ${item["MRP"] == "NULL" ? 0 : item["MRP"]})" readonly class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
//                            renamedItem["Manual Qty"] = `
//                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyCompleteTransit(this,${item.Code});" onfocusout="checkValidateqtyCompleteTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
//                            renamedItem["Packing Qty"] = `
//                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
//                        renamedItem["Action"] = item["ROWSTATUS"] == 'RED' ? '' : `<button class="btn btn-danger icon-height mb-1"  title="Delete item qty" onclick="DeleteItemQty('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
//                        return renamedItem;
//                    });
//                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

//                } else {
//                    $("#tblDispatchData").hide();
//                }
//            } else {
//                toastr.error("Record not found...!");
//                $("#tblDispatchData").hide();
//            }
//        },
//        error: function (xhr, status, error) {
//            toastr.error("Record not found...!");
//            $("#tblDispatchData").hide();
//        }
//    });
//}
//function checkValidateqtyCompleteTransit(element, Code) {
//    var manualQty = parseInt($(element).val());
//    var scanQty = parseInt($("#txtScanQty_" + Code).val());

//    const item = Data.find(entry => entry.Code == Code);
//    var total = scanQty + manualQty;

//    if (total > parseInt(item["Bal Qty"])) {
//        toastr.error("Invalid Packing Qty!");
//        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//        $("#txtManualQty_" + Code).focus();
//    } else {
//        var currentRow = $(element).closest("tr");
//        var nextRow = currentRow.next("tr");

//        if (nextRow.length > 0) {
//            var nextInput = nextRow.find(".txtManualQty").first();
//            if (nextInput.length > 0) {
//                nextInput.focus();
//            }
//        }
//    }
//}
//function checkValidateqtyCompleteTransit1(element, Code) {
//    var manualQty = parseInt($(element).val());
//    var scanQty = parseInt($("#txtScanQty_" + Code).val());

//    const item = Data.find(entry => entry.Code == Code);
//    var total = scanQty + manualQty;

//    if (total > parseInt(item["Bal Qty"])) {
//        toastr.error("Invalid Packing Qty!");
//        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//    } else {
//        if ($("#txtBoxNo").val() === '') {
//            toastr.error("Please enter box no..!");
//            StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//            return;
//        }
//        $("#txtDispatchQty_" + Code).val(total);
//        if (manualQty > 0) {
//            SaveEditManualQty(Code, scanQty, manualQty, total);
//        }
//    }
//}
//async function StartDispatchOrderNo() {
//    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    ClearData();
//    $("#tab1").text("NEW");
//    $("#txtListpage").hide();
//    $("#txtCreatepage").show();
//    $("#txtheaderdiv").show();
//    $("#txtOrderNo").prop("disabled", false);
//    $("#txtScanProduct").prop("disabled", false);
//    $("#dvIsDelete").hide();
//    disableFields(false);
//}
//function CreateOrderNo(Code) {
//    StartDispatchPanding(Code, "ORDERDETAILS");
//    //GetUserNameList();
//}
//function GetOrderNoList1() {
//    $.ajax({
//        url: `${appBaseURL}/api/Master/GetOrderNoList`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            G_OrderList = response;
//            if (response.length > 0) {
//                let option = '<option value="">Select</option>';
//                $.each(response, function (key, val) {

//                    option += '<option value="' + val["OrderNoWithPrefix"] + '">' + val["OrderNoWithPrefix"] + '</option>';
//                });

//                $('#txtOrderNo')[0].innerHTML = option;
//                $('#txtOrderNo')[0].innerHTML = option;

//                $('#txtOrderNo').select2({
//                    width: '-webkit-fill-available'
//                });
//            } else {
//                $('#txtOrderNo').empty();
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//            $('#txtOrderNoList').empty();
//        }
//    });

//}
//async function ViewDespatchTransit(Code, Mode) {
//    G_DispatchMaster_Code = Code;
//    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    $("#tab1").text("View");
//    $("#txtListpage").hide();
//    $("#txtCreatepage").show();
//    $("#txtheaderdiv").show();
//    $("#dvIsDelete").hide();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
//        type: 'GET',
//        contentType: "application/json",
//        dataType: "json",
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response) {
//                if (response.OrderMaster && response.OrderMaster.length > 0) {
//                    const OrderMaster = response.OrderMaster[0];
//                    $("#hfCode").val(OrderMaster.Code || "");
//                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
//                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
//                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
//                    $("#txtChallanDate").val(OrderMaster.ChallanDate || "");
//                    $("#txtPackedBy").val(OrderMaster.PackedBy);
//                    $("#txtBoxNo").val(OrderMaster.BoxNo);
//                    GetTotalLineOfPart(OrderMaster.Code);
//                    $("#txtScanProduct").prop("disabled", true);
//                    disableFields(true);
//                }
//                if (response.OrderDetial && response.OrderDetial.length > 0) {
//                    $("#tblDispatchData").show();
//                    var Response = response.OrderDetial;
//                    Data = response.OrderDetial;
//                    const StringFilterColumn = [];
//                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
//                    const DateFilterColumn = [];
//                    const Button = false;
//                    const showButtons = [];
//                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
//                    let hiddenColumns = [];
//                    if (UserType == "A") {
//                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
//                    } else {
//                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
//                    }
//                    const ColumnAlignment = {
//                        "Ord Qty": "right;width:30px;",
//                        "Bal Qty": "right;width:30px;",
//                        "Scan Qty": "right;width:70px;",
//                        "Packing Qty": "right;width:70px;",
//                        "Manual Qty": "right;width:70px;",
//                    };
//                    const renameMap = {
//                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
//                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
//                    };
//                    const updatedResponse = Response.map(item => {
//                        const renamedItem = {};

//                        for (const key in item) {
//                            if (renameMap.hasOwnProperty(key)) {
//                                renamedItem[renameMap[key]] = item[key];
//                            } else {
//                                renamedItem[key] = item[key];
//                            }
//                        }
//                        renamedItem["Scan Qty"] = `
//                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
//                            renamedItem["Manual Qty"] = `
//                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" disabled value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyTransit(this,${item.Code});" onfocusout="checkValidateqtyTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
//                            renamedItem["Packing Qty"] = `
//                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
//                        return renamedItem;

//                    });
//                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

//                } else {
//                    $("#tblDispatchData").hide();
//                }
//            } else {
//                toastr.error("Record not found...!");
//                $("#tblDispatchData").hide();
//            }
//        },
//        error: function (xhr, status, error) {
//            toastr.error("Record not found...!");
//            $("#tblDispatchData").hide();
//        }
//    });
//}
//async function DeleteItem(code, Order, button) {
//    let tr = button.closest("tr");
//    tr.classList.add("highlight");
//    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    const { Status, msg1 } = await CheckRelatedRecord(code, 'DispatchMaster');
//    if (Status == true) {
//        toastr.error(msg1);
//        return;
//    }
//    if (confirm(`Are you sure you want to delete this Despatch ${Order} .?`)) {
//        $.ajax({
//            url: `${appBaseURL}/api/OrderMaster/DeleteDispatchOrder?Code=${code}`,
//            type: 'POST',
//            beforeSend: function (xhr) {
//                xhr.setRequestHeader('Auth-Key', authKeyData);
//            },
//            success: function (response) {
//                if (response.Status === 'Y') {
//                    toastr.success(response.Msg);
//                    if (G_Tab == 2) {
//                        GetDespatchTransitOrderList('DespatchTransit');
//                    } else if (G_Tab == 3) {
//                        GetCompletedDespatchOrderList('CompletedDespatch');
//                    }
//                } else {
//                    toastr.error("Unexpected response format.");
//                }

//            },
//            error: function (xhr, status, error) {
//                toastr.error("Error deleting item:", Msg);

//            }
//        });
//    }
//    else {
//        $('tr').removeClass('highlight');
//    }
//}
//async function MarkasCompete(code) {
//    const { hasPermission, msg } = await CheckOptionPermission('Complete', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetMarkasCompeteByOrderNo?Code=${code}`,
//        type: 'POST',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.Status === 'Y') {
//                toastr.success(response.Msg);
//                GetDespatchTransitOrderList('DespatchTransit');
//            } else {
//                toastr.error("Unexpected response format.");
//            }

//        },
//        error: function (xhr, status, error) {
//            toastr.error("Error deleting item:");

//        }
//    });
//}
//function disableFields(disable) {
//    $("#txtCreatepage").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
//}
//function changeValue(delta) {
//    $("#BoxNoVoice")[0].play();
//    const input = document.getElementById('txtBoxNo');
//    let value = parseInt(input.value) || 1;
//    value += delta;
//    if (value < 1) value = 1;
//    input.value = value;
//}
//function ManualChangeValue(delta) {
//    $("#BoxNoVoice")[0].play();
//    const input = document.getElementById('txtManualBoxNo');
//    let value = parseInt(input.value) || 1;
//    value += delta;
//    if (value < 1) value = 1;
//    input.value = value;
//}
//function ChangecolorTr() {
//    const rows = document.querySelectorAll('#DispatchTable-Body tr');
//    if (G_UPDATEBOX == 'N') {
//        rows.forEach((row) => {
//            const tds = row.querySelectorAll('td');
//            const columnValue = tds[11]?.textContent.trim();
//            if (columnValue === 'GREEN') {
//                row.style.backgroundColor = '#07bb72';

//            } else if (columnValue === 'YELLOW') {
//                row.style.backgroundColor = '#ebb861';

//            } else {
//                row.style.backgroundColor = '#f5c0bf';
//            }
//        });
//    }
//}

//setInterval(ChangecolorTr, 100);
//function DispatchReport() {
//    var Code = $("#hfDownloadCode").val();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetDispatchReport?Code=${Code}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                Export(response);
//            } else {
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });
//}
//async function ShowUpdateBoxNo(Code, Mode) {
//    G_DispatchMaster_Code = Code;
//    G_Tab = 3;
//    $("#btnShowAll").hide();
//    const { hasPermission, msg } = await CheckOptionPermission('EDITBOXNO', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    G_UPDATEBOX = 'Y';
//    $("#tab1").text("Edit BoxNo");
//    $("#txtListpage").hide();
//    $("#txtCreatepage").show();
//    $("#txtheaderdiv").show();
//    $("#dvIsDelete").show();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
//        type: 'GET',
//        contentType: "application/json",
//        dataType: "json",
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response) {
//                if (response.OrderMaster && response.OrderMaster.length > 0) {
//                    const OrderMaster = response.OrderMaster[0];
//                    $("#hfCode").val(OrderMaster.Code || "");
//                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
//                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
//                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
//                    $("#txtScanProduct").prop("disabled", false);
//                    GetTotalLineOfPart(OrderMaster.Code);
//                    disableFields(false);
//                }
//                if (response.OrderDetial && response.OrderDetial.length > 0) {
//                    $("#tblDispatchData").show();
//                    var Response = response.OrderDetial;
//                    Data = response.OrderDetial;
//                    const StringFilterColumn = [];
//                    const NumericFilterColumn = ["Ord Qty", "Bal Qty"];
//                    const DateFilterColumn = [];
//                    const Button = false;
//                    const showButtons = [];
//                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
//                    let hiddenColumns = [];
//                    if (UserType == "A") {
//                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
//                    } else {
//                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
//                    }
//                    const ColumnAlignment = {
//                        "Box No": "right;width:70px;",
//                        "Scan Qty": "right;width:70px;",
//                    };
//                    const renameMap = {
//                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
//                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
//                    };
//                    const updatedResponse = Response.map(item => {
//                        const renamedItem = {};

//                        for (const key in item) {
//                            if (renameMap.hasOwnProperty(key)) {
//                                renamedItem[renameMap[key]] = item[key];
//                            } else {
//                                renamedItem[key] = item[key];
//                            }
//                        }

//                        renamedItem["Scan Qty"] = `
//                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`;
//                        renamedItem["Box No"] = `
//                        <input type="text" onfocusout="UpdateBoxNo(this,${item.Code})" oninput="NumericValue(this)" id="txtBoxNo_${item.Code}" value="${item["Box No"]}" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Box No..">`;
//                        return renamedItem;
//                    });
//                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

//                } else {
//                    $("#tblDispatchData").hide();
//                }
//            } else {
//                toastr.error("Record not found...!");
//                $("#tblDispatchData").hide();
//            }
//        },
//        error: function (xhr, status, error) {
//            toastr.error("Record not found...!");
//            $("#tblDispatchData").hide();
//        }
//    });
//}
//function NumericValue(e) {
//    if (/\D/g.test(e.value)) e.value = e.value.replace(/[^0-9]/g, '')
//}
//function UpdateBoxNo(e, Code) {
//    var value = $("#txtBoxNo_" + Code).val();
//    if (value == '0' || value == '') {
//        toastr.error("please enter valid box no.");
//        return;
//    }
//    const payload = {
//        Code: Code,
//        ScanNo: "",
//        BoxNo: value
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/UpdateBoxNo?Mode=Manual`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                toastr.success(response[0].Msg);
//                ShowUpdateBoxNo(G_DispatchMaster_Code, "BOXDETAILS");
//            } else {

//            }
//        },
//        error: function (xhr, status, error) {
//            toastr.error("Error in Api/UpdateBoxNo");
//        }
//    });
//}
//function ScanUpdateBoxNo() {
//    if ($("#txtScanProduct").val() == '') {
//        toastr.error("Please scan product !");
//        $("#txtScanProduct").focus();
//        return;
//    } else if ($("#txtBoxNo").val() === '') {
//        toastr.error("Please enter box no..!");
//        return;
//    }
//    const payload = {
//        Code: G_DispatchMaster_Code,
//        ScanNo: $("#txtScanProduct").val(),
//        BoxNo: $("#txtBoxNo").val()
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/UpdateBoxNo?Mode=SCAN`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                $("#SuccessVoice")[0].play();
//                ShowUpdateBoxNo(G_DispatchMaster_Code, "BOXDETAILS");
//                $("#txtScanProduct").val("");
//                $("#txtScanProduct").focus();
//            } else if (response[0].Status == 'N') {
//                showToast(response[0].Msg);
//                $("#txtScanProduct").val("");
//                $("#txtScanProduct").focus();
//            } else {
//                showToast(response[0].Msg);
//                $("#txtScanProduct").val("");
//                $("#txtScanProduct").focus();
//            }
//        },
//        error: function (xhr, status, error) {
//            showToast("INVALID SCAN NO !");
//            $("#txtScanProduct").val("");
//            $("#txtScanProduct").focus();
//        }
//    });
//}
//async function Export(jsonData) {
//    const columnsToRemove = ["Code"];
//    const renameMap = {
//        "Item Name": G_ItemConfig[0].ItemNameHeader || 'Item Name',
//        "Item Code": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
//    };

//    if (!Array.isArray(columnsToRemove)) {
//        console.error("columnsToRemove should be an array");
//        return;
//    }

//    let totalMRP = 0;

//    const filteredAndRenamedData = jsonData.map(row => {
//        const newRow = {};
//        for (const [key, value] of Object.entries(row)) {
//            if (!columnsToRemove.includes(key)) {
//                const newKey = renameMap[key] || key;
//                newRow[newKey] = value;

//                if (key === "Total Value" && !isNaN(value)) totalMRP += Number(value);
//            }
//        }
//        return newRow;
//    });

//    const workbook = new ExcelJS.Workbook();
//    const worksheet = workbook.addWorksheet('Sheet1');

//    const headers = Object.keys(filteredAndRenamedData[0] || {});
//    const headerRow = worksheet.addRow(headers);

//    headerRow.eachCell(cell => {
//        cell.font = { bold: true };
//        cell.fill = {
//            type: 'pattern',
//            pattern: 'solid',
//            fgColor: { argb: 'FFB0C4DE' }
//        };
//    });

//    filteredAndRenamedData.forEach(data => {
//        const rowValues = headers.map(key => {
//            const val = data[key];
//            if (key === "Total Value" && !isNaN(val)) return Number(val).toFixed(2);
//            return val;
//        });
//        const row = worksheet.addRow(rowValues);
//        const mrpIndex = headers.indexOf("Total Value");
//        if (mrpIndex !== -1) row.getCell(mrpIndex + 1).numFmt = '0.00';
//    });

//    const totalRow = Array(headers.length).fill("");
//    const mrpIndex = headers.indexOf("Total Value");

//    if (mrpIndex !== -1) {
//        totalRow[0] = "Total :";
//        totalRow[mrpIndex] = totalMRP.toFixed(2);
//    }

//    const totalExcelRow = worksheet.addRow(totalRow);
//    totalExcelRow.font = { bold: true };
//    totalExcelRow.eachCell(cell => {
//        cell.fill = {
//            type: 'pattern',
//            pattern: 'solid',
//            fgColor: { argb: 'FFFFE4B5' } // Light orange
//        };
//    });

//    // Format total MRP cell
//    if (mrpIndex !== -1) {
//        totalExcelRow.getCell(mrpIndex + 1).numFmt = '0.00';
//    }

//    const buffer = await workbook.xlsx.writeBuffer();
//    const blob = new Blob([buffer], {
//        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//    });

//    const link = document.createElement("a");
//    link.href = URL.createObjectURL(blob);
//    link.download = "Dispatch_" + (jsonData[0]["Order No"] || "Export") + ".xlsx";
//    link.click();
//}
//async function DeleteItemQty(code) {
//    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    if (confirm(`Are you sure you want to delete this item qty.?`)) {
//        $.ajax({
//            url: `${appBaseURL}/api/OrderMaster/DeleteDispatchItemQty?Code=${code}`,
//            type: 'POST',
//            beforeSend: function (xhr) {
//                xhr.setRequestHeader('Auth-Key', authKeyData);
//            },
//            success: function (response) {
//                if (response.Status === 'Y') {
//                    toastr.success(response.Msg);
//                    if (G_Tab == 1) {
//                        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//                    }
//                    else if (G_Tab == 2) {
//                        if (All == 0) {
//                            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//                        } else if (All == 1) {
//                            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//                        }
//                    } else if (G_Tab == 3) {
//                        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//                    }
//                } else {
//                    toastr.error("Unexpected response format.");
//                }

//            },
//            error: function (xhr, status, error) {
//                toastr.error("Error deleting item:", Msg);

//            }
//        });
//    }
//}
//async function ManualUpdateQtyAndMRP(ItemCode, BalanceQty, MRP) {
//    const { hasPermission, msg } = await CheckOptionPermission('Manual', UserMaster_Code, UserModuleMaster_Code);
//    if (hasPermission == false) {
//        toastr.error(msg);
//        return;
//    }
//    $("#txtManualItemCode").text("PRODUCT NAME : " + ItemCode);
//    $("#hfManualProductCode").val(ItemCode);
//    $("#hfManualProductQuantity").val(BalanceQty);
//    $("#txtManualBalanceQuantity").text("EXPECTED QUANTITY : " + BalanceQty)
//    $("#txtManualProductMRP").val(MRP)
//    $("#txtMRPQty").val(MRP)
//    openSavePopup();
//}

//function openSavePopup() {
//    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
//    saveModal.show();
//}
//function SaveManual() {
//    var orderNo = $("#txtOrderNo").val();
//    var boxNo = $("#txtManualBoxNo").val();
//    var quantity = $("#txtManualProductQuantity").val();
//    var mrp = $("#txtManualProductMRP").val();
//    var itemCode = $("#hfManualProductCode").val();
//    var availableQty = $("#hfManualProductQuantity").val();
//    var quantityInt = parseInt(quantity);
//    var availableQtyInt = parseInt(availableQty);
//    if (!quantity || isNaN(quantityInt) || quantityInt <= 0) {
//        toastr.error("Please enter a valid quantity!");
//        return;
//    }
//    if (quantityInt > availableQtyInt) {
//        toastr.error("Entered quantity exceeds available balance!");
//        $("#txtManualProductQuantity").focus();
//        return;
//    }
//    if (!mrp || isNaN(parseFloat(mrp))) {
//        toastr.error("Please enter a valid MRP!");
//        $("#txtManualProductMRP").focus();
//        return;
//    }
//    if (!boxNo || isNaN(parseInt(boxNo)) || parseInt(boxNo) < 1) {
//        toastr.error("Please enter a valid box number!");
//        return;
//    }
//    const item = G_OrderList.find(entry => entry.OrderNoWithPrefix == orderNo);

//    const payload = {
//        DispatchMaster_Code: G_DispatchMaster_Code,
//        ManualQty: quantity,
//        UserMaster_Code: UserMaster_Code,
//        ItemCode: itemCode,
//        OrderMaster_Code: item.Code || 0,
//        Mrp: mrp,
//        BoxNo: boxNo
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/SaveManualRateAndQty`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response[0].Status == 'Y') {
//                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
//                if (G_Tab == 1) {
//                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//                }
//                else if (G_Tab == 2) {
//                    if (All == 0) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//                    } else if (All == 1) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//                    }
//                } else if (G_Tab == 3) {
//                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//                }
//                CloseManualModal();
//            } else if (response[0].Status == 'N') {
//                showToast(response[0].Msg);
//                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
//                if (G_Tab == 1) {
//                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
//                }
//                else if (G_Tab == 2) {
//                    if (All == 0) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
//                    } else if (All == 1) {
//                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
//                    }
//                } else if (G_Tab == 3) {
//                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
//                }
//            }
//        },
//        error: function (xhr, status, error) {
//            showToast("Error in api/OrderMaster/SaveManualRateAndQty");
//        }
//    });
//}
//function CloseManualModal() {
//    $('#txtManualProductQuantity').val("");
//    $('#txtManualProductMRP').val("");
//    var modal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
//    if (modal) {
//        modal.hide();
//    }
//}
//function GetDispatchReport() {
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?Month=${Month}&Year=${Year}&Type=GET`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                $("#txtTATTable").show();
//                const StringFilterColumn = ["INVOICE NO", "RETAILER CODE", "PARTY NAME", "SALES ORDER NO", "INVOICE VALUE", "ORDER TYPE", "PD NAME"];
//                const NumericFilterColumn = [];
//                const DateFilterColumn = ["INVOICE DATE", "ORDER DATE"];
//                const Button = false;
//                const showButtons = [];
//                const StringdoubleFilterColumn = [];
//                const hiddenColumns = ["Code"];
//                const ColumnAlignment = {
//                    "Reorder Level": 'right',
//                    "Reorder Qty": 'right',
//                    "REMARK": 'left;width:100px;',
//                };
//                const updatedResponse = response.map(item => {
//                    const isDisabled = item["DISPATCH DATE"] === '' ? 'disabled' : '';

//                    return {
//                        ...item,
//                        POD: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.POD}" id="txtPODDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
//                        REDISPATCH: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REDISPATCH}" id="txtRedispatch_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
//                        "VEHICLE NO": `<input type="text" maxlength="10" class="box_border form-control form-control-sm" ${isDisabled} value="${item["VEHICLE NO"]}" id="txtVehicleNo_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`,
//                        REMARK: `<input type="text" maxlength="100" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REMARK}" id="txtRemark_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`
//                    };
//                });
//                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

//            } else {
//                $("#txtTATTable").hide();
//                if (Type != 'Load') {
//                    toastr.error("Record not found...!");
//                }
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });

//}
//function Report(Code) {
//    $("#hfDownloadCode").val(Code);
//    var saveModal = new bootstrap.Modal(document.getElementById("DownloadModal"));
//    saveModal.show();
//}
//function CloseDownloadModal() {
//    var modal = bootstrap.Modal.getInstance(document.getElementById('DownloadModal'));
//    if (modal) {
//        modal.hide();
//    }
//}
//function DownloadReportPdf() {
//    var Code = $("#hfDownloadCode").val();
//    $.ajax({
//        url: `${AppBaseURLMenu}/RDLC/PSRReport?Code=${Code}&UserName=${G_UserName}&AuthKey=${authKeyData}`,
//        type: 'GET',
//        xhrFields: {
//            responseType: 'blob'
//        },
//        success: function (data, status, xhr) {
//            let blob = new Blob([data], { type: 'application/pdf' });
//            let url = window.URL.createObjectURL(blob);
//            let a = document.createElement('a');
//            a.href = url;
//            a.download = "PSRReport.pdf";
//            document.body.appendChild(a);
//            a.click();
//            document.body.removeChild(a);
//            window.URL.revokeObjectURL(url);
//        },
//        error: function (xhr, status, error) {
//            console.error('Error downloading report:', xhr.responseText);
//        }
//    });
//}

//async function DownloadDispatchQR() {
//    var Code = $("#hfDownloadCode").val();
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetDispatchQRDetail?Code=${Code}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: async function (response) {
//            if (response.length > 0) {
//                $("#qrcodeview").html("");

//                for (let i = 0; i < response.length; i++) {
//                    const item = response[i];
//                    const textValue = item.QRCode;
//                    const divId = `qrcode_${i}`;
//                    $("#qrcodeview").append(`<div id="${divId}" style="display:none;"></div>`);

//                    new QRCode(document.getElementById(divId), {
//                        text: textValue,
//                        width: 100,
//                        height: 100,
//                    });

//                    await new Promise(resolve => setTimeout(resolve, 300));

//                    const canvas = $(`#${divId} canvas`)[0];
//                    if (canvas) {
//                        const base64Image = canvas.toDataURL('image/png');
//                        response[i].QRCode = base64Image;
//                    }
//                }
//                DownloadQRPdf(response);
//            } else {
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });
//}
//function DownloadQRPdf(response) {
//    $.ajax({
//        url: `${AppBaseURLMenu}/RDLC/PrintDispatchQR`,
//        type: 'POST',
//        xhrFields: {
//            responseType: 'blob'
//        },
//        contentType: 'application/json',
//        data: JSON.stringify(response),
//        success: function (data, status, xhr) {
//            let blob = new Blob([data], { type: 'application/pdf' });
//            let url = window.URL.createObjectURL(blob);
//            let a = document.createElement('a');
//            a.href = url;
//            a.download = "DispatchQR_" + response[0]["OrderNo"] + ".pdf";
//            document.body.appendChild(a);
//            a.click();
//            document.body.removeChild(a);
//            window.URL.revokeObjectURL(url);
//        },
//        error: function (xhr, status, error) {
//            console.error('Error downloading report:', xhr.responseText);
//        }
//    });
//}

//async function DownloadInExcel() {
//    try {
//        const DownloadDate = convertDateFormat1($("#txtToDate").val());
//        const OldDate = convertDateFormat1($("#txtDownloadDate").val());
//        const OrderStatus = $("#ddlOrderStatus").val();
//        if (OldDate === '' || OldDate === undefined || OldDate === null) {
//            toastr.error("Please enter a valid date !");
//            $("#txtDownloadDate").focus()
//            return;
//        }
//        if (OrderStatus == '') {
//            toastr.error("Please select order status !");
//            $("#ddlOrderStatus").focus()
//            return;
//        }
//        const response = await getDataWithAjax(DownloadDate, OldDate, OrderStatus);

//        if (response.length > 0) {
//            await DownloadExport(response);
//        } else {
//            alert("Record not found...!");
//        }
//    } catch (error) {
//        console.error("AJAX error:", error);
//    }
//}
//function getDataWithAjax(FromDate, ToDate, OrderStatus) {
//    return new Promise(function (resolve, reject) {
//        $.ajax({
//            url: `${appBaseURL}/api/OrderMaster/GetOrderPackedDetail?Date=${ToDate}&ToDate=${FromDate}&OrderStatus=${OrderStatus}`,
//            type: 'GET',
//            beforeSend: function (xhr) {
//                xhr.setRequestHeader('Auth-Key', authKeyData);
//            },
//            success: function (response) {
//                resolve(response);
//            },
//            error: function (xhr, status, error) {
//                reject(error);
//            }
//        });
//    });
//}
//async function DownloadExport(Data) {
//    const Picklist = $("#txtDownloadDate").val();
//    const OrderStatus = $("#ddlOrderStatus").val();
//    const renameMap = {
//        "Item Name": G_ItemConfig[0].ItemNameHeader || 'Item Name',
//        "Item Code": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
//    };

//    const originalHeaders = Object.keys(Data[0] || {});
//    const newHeaders = originalHeaders.map(key => renameMap[key] || key);

//    const workbook = new ExcelJS.Workbook();
//    const sheet = workbook.addWorksheet("Data");
//    const headerRow = sheet.addRow(newHeaders);
//    headerRow.eachCell(cell => {
//        cell.font = { bold: true, color: { argb: "FF000000" } };
//        cell.fill = {
//            type: "pattern",
//            pattern: "solid",
//            fgColor: { argb: "FFD9E1F2" }
//        };
//        cell.border = {
//            top: { style: 'thin' },
//            left: { style: 'thin' },
//            bottom: { style: 'thin' },
//            right: { style: 'thin' }
//        };
//    });

//    sheet.autoFilter = {
//        from: 'A1',
//        to: String.fromCharCode(65 + newHeaders.length - 1) + '1'
//    };

//    Data.forEach(rowObj => {
//        const row = originalHeaders.map(key => rowObj[key]);
//        const addedRow = sheet.addRow(row);

//        addedRow.eachCell(cell => {
//            cell.border = {
//                top: { style: 'thin' },
//                left: { style: 'thin' },
//                bottom: { style: 'thin' },
//                right: { style: 'thin' }
//            };
//        });

//        const status = rowObj["Scan Status"]; // Use original key name
//        const fillColor = "FFFFFF";

//        addedRow.eachCell(cell => {
//            cell.fill = {
//                type: "pattern",
//                pattern: "solid",
//                fgColor: { argb: fillColor }
//            };
//        });
//    });
//    const buffer = await workbook.xlsx.writeBuffer();
//    const blob = new Blob([buffer], {
//        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//    });

//    const link = document.createElement("a");
//    link.href = URL.createObjectURL(blob);
//    link.download = `${OrderStatus}_${Picklist}.xlsx`;
//    link.click();
//}
//function convertDateFormat1(dateString) {
//    const [day, month, year] = dateString.split('/');
//    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//    const monthAbbreviation = monthNames[parseInt(month) - 1];
//    return `${year}-${month}-${day}`;
//}
//function setupDateInputFormatting() {
//    $('#txtDownloadDate').on('input', function () {
//        let value = $(this).val().replace(/[^\d]/g, '');

//        if (value.length >= 2 && value.length < 4) {
//            value = value.slice(0, 2) + '/' + value.slice(2);
//        } else if (value.length >= 4) {
//            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
//        }
//        $(this).val(value);

//        if (value.length === 10) {
//            validateChallanDate(value);
//        } else {
//            $(this).val(value);
//        }
//    });
//}
//function validateDate(value) {
//    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
//    let isValidFormat = regex.test(value);

//    if (isValidFormat) {
//        let parts = value.split('/');
//        let day = parseInt(parts[0], 10);
//        let month = parseInt(parts[1], 10);
//        let year = parseInt(parts[2], 10);

//        let date = new Date(year, month - 1, day);

//        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

//            $(this).val(value);
//        } else {
//            $('#txtDownloadDate').val('');

//        }
//    } else {
//        $('#txtDownloadDate').val('');

//    }
//}
//function DatePickerForDownloadDate(date) {
//    $('#txtToDate').val(date);
//    $('#txtToDate').datepicker({
//        format: 'dd/mm/yyyy',
//        autoclose: true,
//        orientation: 'bottom auto',
//        todayHighlight: true
//    }).on('show', function () {
//        let $input = $(this);
//        let inputOffset = $input.offset();
//        let inputHeight = $input.outerHeight();
//        let inputWidth = $input.outerWidth();
//        setTimeout(function () {
//            let $datepicker = $('.datepicker-dropdown');
//            $datepicker.css({
//                width: inputWidth + 'px',
//                top: (inputOffset.top + inputHeight) + 'px',
//                left: inputOffset.left + 'px',
//                'z-index': '1000',
//            });
//        }, 10);
//    });
//}
//function DatePickerForDownloadOld(date) {
//    $('#txtDownloadDate').val(date);
//    $('#txtDownloadDate').datepicker({
//        format: 'dd/mm/yyyy',
//        autoclose: true,
//        orientation: 'bottom auto',
//        todayHighlight: true
//    }).on('show', function () {
//        let $input = $(this);
//        let inputOffset = $input.offset();
//        let inputHeight = $input.outerHeight();
//        let inputWidth = $input.outerWidth();
//        setTimeout(function () {
//            let $datepicker = $('.datepicker-dropdown');
//            $datepicker.css({
//                width: inputWidth + 'px',
//                top: (inputOffset.top + inputHeight) + 'px',
//                left: inputOffset.left + 'px',
//                'z-index': '1000',
//            });
//        }, 10);
//    });
//}
//function GetTotalLineOfPart(OrderMaster_Code) {
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetTotalLineOfPart?OrderMaster_Code=${OrderMaster_Code}`,
//        type: 'GET',
//        contentType: "application/json",
//        dataType: "json",
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            $("#txtTotalPartLine").text(response[0].PartCount);
//        },
//        error: function (xhr, status, error) {
//            showToast("Error in api/OrderMaster/SaveManualRateAndQty");
//        }
//    });
//}

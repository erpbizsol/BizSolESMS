
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let Data = [];
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let AccountList = [];
let ItemDetail = [];
let G_OrderList = [];
$(document).ready(function () {
    DatePicker();
    GetDispatchOrderLists('GETCLIENT');
    GetOrderNoList1();
    $("#ERPHeading").text("Dispatch Entry");
    $('#txtChallanDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtClientName").focus();
        }
    });
    $('#txtClientName').on('keydown', function (e) {
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
    GetModuleMasterCode();
    $("#txtClientName").on("focus", function () {
        $("#txtClientName").val("");
    });
    $("#txtClientName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtClientNameList option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtAddress").val("")
        }
    });
   
    $(".pendingOrder").click(function () {
        GetDispatchOrderLists('GETCLIENT');
    });

    $(".despatchTransit").click(function () {
        
        GetDespatchTransitOrderList('DespatchTransit');
    });

    $(".completedDespatch").click(function () {

        GetCompletedDespatchOrderList('CompletedDespatch');
    });
    $('#txtScanProduct').on('keydown', function (e) {
        if (e.key === "Enter") {
            SaveScanQty();
        }
    });
   
    $("#txtOrderNo").on("change", function () {
        var inputValue = $(this).val();
        const item = G_OrderList.find(entry => entry.OrderNoWithPrefix == inputValue);
        if (item.Code != undefined) {
            CreateOrderNo(item.Code)
        }
    });
    $("#txtOrderNo").on("focus", function () {
        $("#txtOrderNo").val("");
    });

});
function GetDispatchOrderList() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchOrderList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["Challan Date"];
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
                    ...item
                    //, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    //<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
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
    ClearData();
    $("#tab1").text("NEW");

    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#Orderdata").empty();
    addNewRow();
    disableFields(false);
    $("#txtOrderNo").prop("disabled", true);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    disableFields(false);
    $("#txtOrderNo").prop("disabled", true);
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
                $('#txtClientNameList').empty();
                let options = '';
                options += '<option value="All" text="0"></option>';
                response.forEach(item => {
                    options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
                });
                $('#txtClientNameList').html(options);
            } else {
                $('#txtClientNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtClientNameList').empty();
        }
    });
}
function GetOrderNoList(ClientName) {
    if (ClientName != '') {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/GetClientWiseOrderNo?ClientName=${ClientName}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.length > 0) {
                    $('#txtOrderNo').empty();
                    let options = '';
                    response.forEach(item => {
                        options += '<option value="' + item.OrderNoWithPrefix + '" text="' + item.OrderNoWithPrefix + '"></option>';
                    });
                    $('#txtOrderNo').html(options);
                } else {
                    $('#txtOrderNo').empty();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                $('#txtClientNameList').empty();
            }
        });
    }
}
function GetItemDetails(element) {
    var OrderNo = $(element).val();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetItemDetailByOrderNo?OrderNo=${OrderNo}`,
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
function ClearData() {
    $("#hfCode").val("0");
    $("#txtChallanNo").val("");
    $("#txtAddress").val("");
    $("#txtVehicleNo").val("");
    $("#Orderdata").empty();

}
function Save() {
    var ChallanNo = $("#txtChallanNo").val();
    var ChallanDate = $("#txtChallanDate").val();
    var ClientName = $("#txtClientName").val();
    var VehicleNo = $("#txtVehicleNo").val();

    if (!ChallanDate) {
        toastr.error("Please Select an Challan Date!");
        $("#txtChallanDate").focus();
        return;
    } else if (!ClientName) {
        toastr.error("Please enter a Client Name!");
        $("#txtClientName").focus();
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
            if (row.find(".txtOrderNo").val() == '') {
                toastr.error("Please select Order No !");
                row.find(".txtOrderNo").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtItemBarCode").val() == '') {
                toastr.error("Please select Item Bar Code !");
                row.find(".txtItemBarCode").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtItemCode").val() == '') {
                toastr.error("Please select Item Code !");
                row.find(".txtItemCode").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtItemAddress").val() == '') {
                toastr.error("Please select Item Address !");
                row.find(".txtItemAddress").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtOrderQty").val() == '') {
                toastr.error("Please enter Order Qty !");
                row.find(".txtOrderQty").focus();
                validationFailed = true;
                return;
            } else if (row.find(".txtRate").val() == '') {
                toastr.error("Please enter Rate !");
                row.find(".txtRate").focus();
                validationFailed = true;
                return;
            }
        }
    });
    if (validationFailed) {
        return;
    }
    const Payload = [{
        Code: $("#hfCode").val(),
        ChallanNo: $("#txtChallanNo").val(),
        ChallanDate: convertDateFormat($("#txtChallanDate").val()),
        ClientName: $("#txtClientName").val(),
        VehicleNo: $("#txtVehicleNo").val()
    }];
    const Data = [];
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        if (row.find(".txtItemName").val() != '') {
            const addressRow = {
                OrderNo: row.find(".txtOrderNo").val(),
                ItemName: row.find(".txtItemName").val(),
                QtyBox: row.find(".txtQtyBox").val() || 0,
                DispatchQty: row.find(".txtDispatchQty").val(),
                Rate: row.find(".txtRate").val(),
                Amount: row.find(".txtAmount").val(),
                Remarks: row.find(".txtRemarks").val(),
            };
            Data.push(addressRow);
        }
    });

    const payload = {
        DispatchMaster: Payload,
        DispatchDetails: Data,
    };

    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/SaveDispatchOrderEntry?UserMaster_Code=${UserMaster_Code}`,
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
                GetDispatchOrderList();
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
                    <td><input type="text" list="txtOrderNo" onfocus="focusblank(this);" onfocusout="CheckOrderNo(this);" onchange="GetItemDetails(this);" class="txtOrderNo box_border form-control form-control-sm mandatory" id="txtOrderNo_${rowCount}" autocomplete="off" required maxlength="20" /></td>
                    <td><input type="text" list="txtItemBarCode" onfocus="focusblank(this);" onfocusout="CheckItemBarCode(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
                    <td><input type="text" list="txtItemCode" onfocus="focusblank(this);" onfocusout="CheckItemCode(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
                    <td><input type="text" list="txtItemName" onfocus="focusblank(this);" onfocusout="CheckItemName(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
                    <td><input type="text" class="txtItemAddress box_border form-control form-control-sm mandatory" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
                    <td><input type="text" class="txtUOM box_border form-control form-control-sm mandatory" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
                    <td><input type="text" disabled class="txtBalanceOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtBalanceOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
                    <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
                    <td><input type="text" class="txtDispatchQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtDispatchQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
                    <td><input type="text" disabled class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
                    <td><input type="text" disabled class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
                    <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
                    <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>
      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" list="txtOrderNo" onfocus="focusblank(this);" onfocusout="CheckOrderNo(this);" onchange="GetItemDetails(this);" class="txtOrderNo box_border form-control form-control-sm mandatory" id="txtOrderNo_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemBarCode" onfocus="focusblank(this);" onfocusout="CheckItemBarCode(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" onfocus="focusblank(this);" onfocusout="CheckItemCode(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" onfocus="focusblank(this);" onfocusout="CheckItemName(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm mandatory" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm mandatory" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" disabled class="txtBalanceOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtBalanceOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" oninput="SetvalueBillQtyBox(this);" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtDispatchQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtDispatchQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" disabled class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" disabled class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>
      `;
        table.appendChild(newRow);
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
    const result = Data.find(item => item.ModuleDesp === "Dispatch");
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
    $('#txtChallanDate').on('input', function () {
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
            $('#txtChallanDate').val('');

        }
    } else {
        $('#txtChallanDate').val('');

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
            $('#txtChallanDate').val(apiDate);

            $('#txtChallanDate').datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
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
        const itemOrderNo = currentRow.querySelector('.txtOrderNo');
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const BalanceOrderQty = currentRow.querySelector('.txtBalanceOrderQty');
        const QtyBox = currentRow.querySelector(".txtQtyBox");

        if (value == 'BarCode') {
            $("#txtItemBarCode option").each(function () {
                if ($(this).val() === inputValue) {
                    const item = ItemDetail.find(entry => entry.ItemBarCode == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
                    BalanceOrderQty.value = item.OrderQty;
                    itemRate.value = item.Rate;
                    const isDisabled = item.QtyInBox === 0;
                    QtyBox.value = '';
                    QtyBox.disabled = isDisabled;
                    isValid = true;
                    return false;
                } else {
                    itemBarCode.value = "";
                    itemCode.value = "";
                    itemName.value = "";
                    itemAddress.value = "";
                    itemUOM.value = "";
                    BalanceOrderQty.value = "";
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
                    BalanceOrderQty.value = item.OrderQty;
                    itemRate.value = item.Rate;
                    const isDisabled = item.QtyInBox === 0;
                    QtyBox.value = '';
                    QtyBox.disabled = isDisabled;
                    isValid = true;
                    return false;
                } else {
                    itemBarCode.value = "";
                    itemCode.value = "";
                    itemName.value = "";
                    itemAddress.value = "";
                    itemUOM.value = "";
                    BalanceOrderQty.value = "";
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
                    BalanceOrderQty.value = item.OrderQty;
                    itemRate.value = item.Rate;
                    const isDisabled = item.QtyInBox === 0;
                    QtyBox.value = '';
                    QtyBox.disabled = isDisabled;
                    isValid = true;
                    return false;
                } else {
                    itemBarCode.value = "";
                    itemCode.value = "";
                    itemName.value = "";
                    itemAddress.value = "";
                    itemUOM.value = "";
                    BalanceOrderQty.value = "";
                }
            });
        }

        let lastRow = $('#tblorderbooking #Orderdata tr').length;
        if (lastRow > 1) {
            var Check = checkDuplicateEntries(inputElement, itemCode, itemName, itemOrderNo);
            if (Check) {
                alert('Duplicate entry not allowed for Order No and Same Item Name!');
                itemBarCode.value = "";
                itemCode.value = "";
                itemName.value = "";
                itemAddress.value = "";
                itemUOM.value = "";
                itemRate.value = "";
                BalanceOrderQty.value = "";
                QtyBox.value = '';
                OrderQty.value = '';
            }
        }
    }
}
function CalculateAmount(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const BalanceOrderQty = currentRow.querySelector('.txtBalanceOrderQty');
        const BillQty = currentRow.querySelector('.txtDispatchQty');
        const Rate = currentRow.querySelector('.txtRate');
        const Amount = currentRow.querySelector('.txtAmount');
        const billQtyValue = parseFloat(BillQty?.value) || 0;
        const rateValue = parseFloat(Rate?.value) || 0;
        if (BalanceOrderQty.value > 0) {
            if (parseFloat(BalanceOrderQty.value) >= parseFloat(BillQty.value)) {
                const billQtyValue = parseFloat(BillQty.value) || 0;
                const rateValue = parseFloat(Rate.value) || 0;
                const calculatedAmount = billQtyValue * rateValue;
                if (Amount) {
                    Amount.value = calculatedAmount.toFixed(2);
                }
            } else {
                toastr.error("Please enter a valid quantity!");
                BillQty.value = '';
            }
        } else {
            toastr.error("Balance Qty 0: You have not dispatched this time!");
            BillQty.value = '';
        }


    }
}
function GetRate(VendorName, ItemName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/ClientWiseRate?ClientName=${VendorName}&ItemName=${ItemName}`,
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
function checkDuplicateEntries(inputElement, itemCode, itemName, OrderNo) {
    let isDuplicate = false;
    const currentRow = inputElement.closest('tr');
    document.querySelectorAll('#tblorderbooking tbody tr').forEach(row => {
        if (row === currentRow) return;

        const existingItemCode = row.querySelector('.txtItemCode')?.value || '';
        const existingItemName = row.querySelector('.txtItemName')?.value || '';
        const existingtxtOrderNo = row.querySelector('.txtOrderNo')?.value || '';

        if (existingItemCode === itemCode.value && existingItemName === itemName.value && existingtxtOrderNo === OrderNo.value) {
            isDuplicate = true;
        }
    });

    return isDuplicate;
}
function CheckItemName(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        const itemOrderNo = currentRow.querySelector('.txtOrderNo');
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const BalanceOrderQty = currentRow.querySelector('.txtBalanceOrderQty');
        $("#txtItemName option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            itemBarCode.value = "";
            itemCode.value = "";
            itemName.value = "";
            itemAddress.value = "";
            itemUOM.value = "";
            itemRate.value = "";
            BalanceOrderQty.value = "";
        }
    }
}
function CheckItemCode(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        const itemOrderNo = currentRow.querySelector('.txtOrderNo');
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const BalanceOrderQty = currentRow.querySelector('.txtBalanceOrderQty');
        $("#txtItemCode option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            itemBarCode.value = "";
            itemCode.value = "";
            itemName.value = "";
            itemAddress.value = "";
            itemUOM.value = "";
            itemRate.value = "";
            BalanceOrderQty.value = "";
        }
    }
}
function CheckItemBarCode(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        const itemOrderNo = currentRow.querySelector('.txtOrderNo');
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const BalanceOrderQty = currentRow.querySelector('.txtBalanceOrderQty');
        $("#txtItemBarCode option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            itemBarCode.value = "";
            itemCode.value = "";
            itemName.value = "";
            itemAddress.value = "";
            itemUOM.value = "";
            itemRate.value = "";
            BalanceOrderQty.value = "";
        }
    }
}
function CheckOrderNo(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const value = inputElement.value;
        let isValid = false;
        const itemOrderNo = currentRow.querySelector('.txtOrderNo');
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        const itemRate = currentRow.querySelector('.txtRate');
        const BalanceOrderQty = currentRow.querySelector('.txtBalanceOrderQty');
        $("#txtOrderNo option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            itemOrderNo.value = "";
            itemBarCode.value = "";
            itemCode.value = "";
            itemName.value = "";
            itemAddress.value = "";
            itemUOM.value = "";
            itemRate.value = "";
            BalanceOrderQty.value = "";
            GetItemDetails('');
        }
    }
}
function focusblank(element) {
    $(element).val("");
}
function SetvalueBillQtyBox(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const ItemName = currentRow.querySelector(".txtItemName");
        const QtyBox = currentRow.querySelector(".txtQtyBox");
        const OrderQty = currentRow.querySelector(".txtDispatchQty");
        const Rate = currentRow.querySelector(".txtRate");
        const Amount = currentRow.querySelector(".txtAmount");
        const item = ItemDetail.find(entry => entry.ItemName == ItemName.value);
        OrderQty.value = item.QtyInBox * QtyBox.value;
        CalculateAmount(inputElement);
    }
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchOrderList`,
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
    const columnsToRemove = ["Code"];
    if (!Array.isArray(columnsToRemove)) {
        console.error("columnsToRemove should be an array");
        return;
    }
    const filteredData = jsonData.map(row =>
        Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
    );
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "DispatchOrder.xlsx");
}
function ScanItemForDispatch() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code: $("#hfCode").val(),
        ScanNo: $("#txtScanProduct").val(),
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                StartDispatch($("#hfCode").val())
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else if (response[0].Status == 'N') {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").focus();
            $("#txtScanProduct").val("");
        }
    });

}
function showToast(Msg) {
    let toast = document.getElementById("toast");
    let overlay = document.getElementById("overlay");

    toast.innerText = Msg;
    overlay.style.display = "block";
    toast.style.display = "block";
    let alertSound = new Audio("https://www.fesliyanstudios.com/play-mp3/4387");
    alertSound.play().catch(error => console.log("Audio playback failed:", error));
    setTimeout(() => toast.style.opacity = "1", 10);
    let blinkInterval = setInterval(() => {
        toast.style.visibility = (toast.style.visibility === "hidden") ? "visible" : "hidden";
    }, 300);
    setTimeout(() => {
        clearInterval(blinkInterval);
        toast.style.visibility = "visible";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    }, 3000);
}
function checkValidateqty(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Order Quantity"])) {
        toastr.error("Invalid Dispatch Qty!");
        $("#txtManualQty_" + Code).focus();
        StartDispatch($("#hfCode").val());
    } else {
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveManualQty(Code, scanQty, manualQty, total);
        }
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqty1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Order Quantity"])) {
        toastr.error("Invalid Dispatch Qty!");
        StartDispatch($("#hfCode").val());
    } else {
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveManualQty(Code, scanQty, manualQty, total);
        }
    }
}
function OnChangeNumericTextBox(event, element) {
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
function SaveManualQty(Code, ScanQty, ManualQty, DispatchQty) {
    const payload = {
        Code: Code,
        ScanNo: "",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        DispatchQty: DispatchQty,
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                StartDispatch($("#hfCode").val());
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function AutoUpdateReceivedQty() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: 0,
        ScanNo: ""
    }
    if (confirm("Are you sure you want to auto update received qty ?")) {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/AutoUpdateReceivedQty`,
            type: 'POST',
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status == 'Y') {
                    BoxValidationDetail();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    }
}
function SaveScanQty() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code: $("#hfCode").val(),
        ScanNo: $("#txtScanProduct").val(),
        ScanQty: 0,
        ManualQty: 0,
        DispatchQty: 0,
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                StartDispatch($("#hfCode").val());
                $("#txtScanProduct").focus();
                //$("#txtScanProduct").val("");
            } else if (response[0].Status == 'N') {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                //$("#txtScanProduct").val("");
            } else {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                //$("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").focus();
            //$("#txtScanProduct").val("");
        }
    });

}
function GetDispatchOrderLists(Mode) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["Order Qty", "Balance Qty"];
                const DateFilterColumn = ["Order Date"];
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
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Create Despatch" onclick="StartDispatch('${item.Code}','ORDERDETAILS')"><i class="fa-solid fa-pencil"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function GetDespatchTransitOrderList(Mode) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["Order Qty", "Dispatch Qty"];
                const DateFilterColumn = ["Despatch Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "D_Code"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "Qty In Box": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatch('${item.Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function GetCompletedDespatchOrderList(Mode) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["Order Qty", "Dispatch Qty"];
                const DateFilterColumn = ["Despatch Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "D_Code"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "Qty In Box": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatch('${item.Code}','CDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function StartDispatch(Code, Mode) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtOrderNo").prop("disabled", true);
    disableFields(false);
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    $("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");

                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    const hiddenColumns = ["Code"];
                    const ColumnAlignment = {
                        "Order Quantity": "right"
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Dispatch Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Dispatch Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Dispatch Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                }
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
        }
    });
}
async function StartDispatchOrderNo(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtOrderNo").prop("disabled", false);
    $("#txtScanProduct").prop("disabled", false);
    disableFields(false);
}
function CreateOrderNo(Code) {
    $("#txtOrderNo").prop("disabled", false);
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=ORDERDETAILS`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    $("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");

                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    const hiddenColumns = ["Code"];
                    const ColumnAlignment = {
                        "Order Quantity": "right"
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Dispatch Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Dispatch Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Dispatch Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                }
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
        }
    });
}
function GetOrderNoList1() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetOrderNoList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_OrderList = response;
            if (response.length > 0) {

                $('#txtOrderNoList').empty();
                let options = '';
                response.forEach(item => {

                    options += '<option value="' + item.OrderNoWithPrefix + '" text="' + item.OrderNoWithPrefix + '"></option>';
                });
                //firstCode = response[0].Code;
                //alert(firstCode);
                //if (firstCode) {
                //    CreateOrderNo(firstCode);
                //}
                $('#txtOrderNoList').html(options);
            } else {
                $('#txtOrderNoList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtOrderNoList').empty();
        }
    });

}
async function ViewDespatchTransit(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    disableFields(true);
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    $("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtScanProduct").val(OrderMaster.ChallanNo || "").prop("disabled", true);


                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    const hiddenColumns = ["Code"];
                    const ColumnAlignment = {
                        "Order Quantity": "right"
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code},'T');" onfocusout="checkValidateqty1(this,${item.Code},'T');" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Dispatch Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Dispatch Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Dispatch Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                }

            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
        }
    });
}
async function deleteItem(code, Order, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'DispatchMaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this Despatch ${Order} .?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/DeleteDispatchOrder?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    GetDespatchTransitOrderList();
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
        $('tr').removeClass('highlight');
    }
}
function MarkasCompete(code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetMarkasCompeteByOrderNo?Code=${code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                GetDespatchTransitOrderList();
            } else {
                toastr.error("Unexpected response format.");
            }

        },
        error: function (xhr, status, error) {
            toastr.error("Error deleting item:");

        }
    });
}
function disableFields(disable) {
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}

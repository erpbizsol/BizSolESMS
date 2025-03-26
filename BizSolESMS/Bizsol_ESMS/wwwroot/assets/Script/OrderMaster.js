
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let JsonData = [];
let AccountList = [];
let ItemDetail = [];
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
    GetItemDetails();
    ShowOrderMasterlist('Load');
    $("#btnAddNewRow").click(function () {
        addNewRow();
    });
    GetModuleMasterCode();
    $("#txtClientName").on("focus", function () {
        $("#txtClientName").val("");
    });
    $("#txtImportClientName").on("focus", function () {
        $("#txtImportClientName").val("");
    });
    $("#txtClientName").on("change", function () {

        let value = $(this).val();
        let isValid = false;
        $("#txtClientNameList option").each(function () {
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
        } else {
            $("#txtImportClientName").val("");
            $("#txtImportClientName").prop("disabled", true);
        }
    });
});
function ShowOrderMasterlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowOrderMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
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
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtordertable").hide();
                if (Type != 'Load') {
                    toastr.error("Record not found...!");
                }
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
    $("#txtOrderDate").prop("disabled", false);
    $("#txtClientName").prop("disabled", false);
    $("#txtBuyerPONo").prop("disabled", false);
    $("#txtBuyerPODate").prop("disabled", false);
    $("#txtsave").prop("disabled", false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    disableFields(false);
    $("#txtOrderDate").prop("disabled", false);
    $("#txtClientName").prop("disabled", false);
    $("#txtBuyerPONo").prop("disabled", false);
    $("#txtBuyerPODate").prop("disabled", false);
    $("#txtsave").prop("disabled", false);
}
async function Edit(code) {
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
                    $("#txtClientName").val(OrderMaster.AccountName || "");
                    $("#txtAddress").val(OrderMaster.Address || "");
                    $("#txtBuyerPONo").val(OrderMaster.BuyerPONo || "");
                    $("#txtBuyerPODate").val(OrderMaster.BuyerPODate || "");
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
                CreateVendorlist();
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
function ClearData() {
    $("#hfCode").val("0");
    $("#txtOrderNo").val("");
    $("#txtClientName").val("");
    $("#txtAddress").val("");
    $("#txtBuyerPONo").val("");
    $("#Orderdata").empty();

}
function Save() {
    var OrderNo = $("#txtOrderNo").val();
    var OrderDate = $("#txtOrderDate").val();
    var ClientName = $("#txtClientName").val();
    var BuyerPONo = $("#txtBuyerPONo").val();
    var BuyerPODate = $("#txtBuyerPODate").val();

    if (!OrderDate) {
        toastr.error("Please Select an Order Date!");
        $("#txtOrderDate").focus();
        return;
    } else if (!ClientName) {
        toastr.error("Please enter a Client Name!");
        $("#txtClientName").focus();
        return;
    }
    else if (!BuyerPONo) {
        toastr.error("Please enter a Buyer PO No!");
        $("#txtBuyerPONo").focus();
        return;
    }
    else if (!BuyerPODate) {
        toastr.error("Please Select a Buyer PO Date!");
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
    const accountPayload = [{
        Code: $("#hfCode").val(),
        OrderNo: $("#txtOrderNo").val(),
        OrderDate: convertDateFormat($("#txtOrderDate").val()),
        ClientName: $("#txtClientName").val(),
        BuyerPONo: $("#txtBuyerPONo").val(),
        BuyerPODate: convertDateFormat($("#txtBuyerPODate").val())
    }];
    const addressData = [];
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        if (row.find(".txtItemName").val() != '') {
            const addressRow = {
                ItemCode: row.find(".txtItemCode").val(),
                QtyBox: row.find(".txtQtyBox").val() || 0,
                OrderQty: row.find(".txtOrderQty").val(),
                Rate: row.find(".txtRate").val(),
                Amount: row.find(".txtAmount").val(),
                Remarks: row.find(".txtRemarks").val(),
            };
            addressData.push(addressRow);
        }
    });

    const payload = {
        OrderMaster: accountPayload,
        OrderDetial: addressData,
    };

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
                setTimeout(() => {
                    toastr.success(response.Msg);
                    ShowOrderMasterlist('Get');
                    BackMaster();
                }, 1000);
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
function addNewRowEdit(index, address) {
    const rowCount = index + 1;
    const table = document.getElementById("Orderdata");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
           <td><input type="text" list="txtItemBarCode" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"oninput="SetvalueBillQtyBox(this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  oninput="CalculateAmount(this);" id="txtOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);"  id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" disabled/></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
              <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
    `;
    //<td><input type="button" class="btn btn-danger btn-sm deleteRow"/><i class="fa-regular fa-circle-xmark"></i></td>
    table.appendChild(newRow);

    if (address !== undefined) {
        const item = ItemDetail.find(entry => entry.ItemName == address.ItemName);
        const isDisabled = item.QtyInBox === 0;
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
            <td><input type="text" list="txtItemBarCode" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"oninput="SetvalueBillQtyBox(this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  oninput="CalculateAmount(this);" id="txtOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" disabled/></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" list="txtItemBarCode" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm " id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm " id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"oninput="SetvalueBillQtyBox(this);" id="txtQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtOrderQty box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);"  oninput="CalculateAmount(this);" id="txtOrderQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="CalculateAmount(this);"  id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" disabled/></td>
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
                    const item = ItemDetail.find(entry => entry.ItemName == inputValue);
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
        GetRate($("#txtClientName").val(), itemName.value).then(response => {
            itemRate.value = response[0].Rate;
        }).catch(error => {
            console.error('Error fetching rate:', error);
        });
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
    $("#tab1").text("VIEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
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
                    $("#txtClientName").val(OrderMaster.AccountName || "").prop("disabled", true);
                    $("#txtAddress").val(OrderMaster.Address || ""),
                    $("#txtBuyerPONo").val(OrderMaster.BuyerPONo || "").prop("disabled", true);
                    $("#txtBuyerPODate").val(OrderMaster.BuyerPODate || "").prop("disabled", true);
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
    $("#txtImportClientName").val("");
    $("#txtClientType").val("");
    $("#txtExcelFile").val("");
    $("#Orderdata").empty();
    GetCurrentDate();
    GetAccountMasterList();
}
function validateExcelFormat(data) {
    if (data.length < 1) {
        return { isValid: false, message: "The Excel file is empty." };
    }
    const headers = data[0].map(header => header.replace(/[\s.]+/g, ''));
    const requiredColumns = ['PicklistNo', 'ItemLineNo', 'ItemCode', 'Description', 'InvoiceNo', 'OrderNo'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        return { isValid: false, message: `Missing required columns: ${missingColumns.join(', ')}` };
    }

    return { isValid: true, message: "Excel format is valid." };
}
function GetImportFile() {
    const ClientType = $("#txtClientType").val();
    const ClientName = $("#txtImportClientName").val();
    if (ClientType == '') {
        toastr.error("Please select client type !");
        $("#txtClientType").focus();
        return;
    } else if (ClientName == '' && ClientType == 'S') {
        toastr.error("Please select client name !");
        $("#txtImportClientName").focus();
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
        UserMaster_Code: UserMaster_Code
    };
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
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function SaveImportFile() {
    const ClientType = $("#txtClientType").val();
    const ClientName = $("#txtImportClientName").val();
    if (ClientType == '') {
        toastr.error("Please select client type !");
        $("#txtClientType").focus();
        return;
    } else if (ClientName == '' && ClientType == 'S') {
        toastr.error("Please select client name !");
        $("#txtImportClientName").focus();
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
        UserMaster_Code: UserMaster_Code
    };
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
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
async function ImportExcel() {
    $("#txtListpage").hide();
    $("#txtCreatepage").hide();
    $("#txtImportPage").show();
    $("#txtheaderdiv2").show();
}
function BackImport() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtImportPage").hide();
    $("#ImportTable").hide();
    $("#txtheaderdiv2").hide();
    ClearDataImport();
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
                validateCSV(event, function (isValidCSV) {
                    if (!isValidCSV) {
                        event.target.value = ''; 
                        $("#ImportTable").hide();
                        JsonData = [];
                        return false;
                    }
                    GetImportFile();
                });
                JsonData = parseCSV(e.target.result);
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

                JsonData = convertToKeyValuePairs(jsonData);
                const validationResult = validateExcelFormat(jsonData);
                if (!validationResult.isValid) {
                    alert(`Invalid Excel format: ${validationResult.message}`);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
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
function validateExcelFormat(data) {
    var ClientType = $("#txtClientType").val();
    if (data.length < 1) {
        return { isValid: false, message: "The Excel file is empty." };
    }
    const headers = data[0].map(header => header.replace(/[\s.]+/g, ''));
    if (ClientType === 'S'){
        const requiredColumns = ['Part#', 'OrderQty', 'PartDescription'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            return { isValid: false, message: `Missing required columns: ${missingColumns.join(', ')}` };
        }
    }
    else {
        const requiredColumns = ['Order', 'Part', 'PartDescription', 'Date','AccountName'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            return { isValid: false, message: `Missing required columns: ${missingColumns.join(', ')}` };
        }
    }
    

    return { isValid: true, message: "Excel format is valid." };
}
function cleanHeader(header) {
    return header.replace(/[^a-zA-Z0-9]/g, "").trim(); 
}
function validateCSV(event, callback) {
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        callback(false);
        return;
    }

    let expectedHeaders = [];
    if ($("#txtClientType").val() == 'S') {
        expectedHeaders = ["Part", "OrderQty", "PartDescription"];
    } else {
        expectedHeaders = ["Order", "Part", "Date", "PartDescription", "AccountName", "Code", "OrderQuantity", "ReservedQty", "Status", "ContactLastName", "CashCustomerName"];
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const csvData = e.target.result;
        const rows = csvData.split(/\r?\n/);
        const headers = rows[0].split(/\t|,/).map(h => cleanHeader(h));

        if (JSON.stringify(headers) === JSON.stringify(expectedHeaders)) {
            console.log("CSV Headers Matched ✅");
            callback(true);
        } else {
            alert("Invalid file. Headers do not match!");
            console.log("Expected:", expectedHeaders);
            console.log("Found:", headers);
            callback(false);
        }
    };

    reader.readAsText(file);
}
function disableFields(disabled) {
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", disabled).css("pointer-events", disabled ? "none" : "auto");
}



   




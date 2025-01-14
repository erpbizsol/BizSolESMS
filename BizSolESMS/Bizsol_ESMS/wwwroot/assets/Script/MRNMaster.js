var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let AccountList = [];
let ItemDetail = [];
$(document).ready(function () {
    DatePicker();
    $("#ERPHeading").text("MRN Master");
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
            $("#txtVehicleNo").focus();
        }
    });
    $('#txtVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtIsMSME").focus();
        }
    });
    GetAccountMasterList();
    GetItemDetails();
    GetWareHouseList();
    $("#btnAddNewRow").click(function () {
        addNewRow();
    });
    GetModuleMasterCode();
    $("#txtVendorName").on("focusout", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtVendorNameList option").each(function () {
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
    $("#txtVendorName").on("focus", function () {
         $("#txtVendorName").val("");
    });
    $("#txtVendorName").on("focusout", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtVendorNameList option").each(function () {
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
});
function ShowMRNMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowAccountMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["Account Name", "Display Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
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
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#Orderdata").empty();
    addNewRow();
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
}
async function Edit(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#txtListpage").hide();
    $("#txtCreatepage").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowAccountMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.AccountMaster && response.AccountMaster.length > 0) {
                    const accountMaster = response.AccountMaster[0];
                    $("#hfCode").val(accountMaster.Code || "");
                    $("#txtAccountName").val(accountMaster.AccountName || "");
                    $("#txtDisplayName").val(accountMaster.DisplayName || "");
                    $("#txtPANNo").val(accountMaster.PANNo || "");
                    $("#txtIsMSME").val(accountMaster.IsMSME || "");
                    if (accountMaster.IsClient == 'N') {
                        $("#txtIsClient").prop("checked", false);
                    }
                    if (accountMaster.IsVendor == 'N') {
                        $("#txtIsVendor").prop("checked", false);
                    }
                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.AccountAddress && response.AccountAddress.length > 0) {
                    response.AccountAddress.forEach(function (address, index) {

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
async function deleteItem(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteAccountMaster?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowAccountMasterlist();
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);

            }
        });
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
                $('#txtVendorNameList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
                });
                $('#txtVendorNameList').html(options);
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
                $('#txtWarehouse').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtWarehouse').html(options);
            } else {
                $('#txtWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').empty();
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
    $("#Orderdata").empty();
}
function Save() {
    const AccountName = $("#txtAccountName").val();
    const DisplayName = $("#txtDisplayName").val();

    if (!AccountName) {
        toastr.error("Please enter an Account Name!");
        $("#txtAccountName").focus();
        return;
    } else if (!DisplayName) {
        toastr.error("Please enter a Display Name!");
        $("#txtDisplayName").focus();
        return;
    } else if (!isValidPAN($("#txtPANNo").val())) {
        toastr.error("Please enter valid PAN No!");
        $("#txtPANNo").focus();
        return;
    }
    else if (getCheckedCount('chkIsDefault') == 0) {
        toastr.error("At least one default field is correctly checked!");
        return;
    }
    let validationFailed = false;
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        if (row.find(".txtAddressCode").val() == '') {
            toastr.error("Please enter Address Code !");
            row.find(".txtAddressCode").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtAddressLine1").val() == '') {
            toastr.error("Please enter Address Line1 !");
            row.find(".txtAddressLine1").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtCity").val() == '') {
            toastr.error("Please select City !");
            row.find(".txtCity").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtState").val() == '') {
            toastr.error("Please select State !");
            row.find(".txtState").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtNation").val() == '') {
            toastr.error("Please select Nation !");
            row.find(".txtNation").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtNation").val() == '') {
            toastr.error("Please select Nation !");
            row.find(".txtNation").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtPIN").val() == '') {
            toastr.error("Please enter Pin!");
            row.find(".txtPIN").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtMobile").val() == '') {
            toastr.error("Please enter Mobile No!");
            row.find(".txtMobile").focus();
            validationFailed = true;
            return;
        } else if (!IsMobileNumber(row.find(".txtMobile").val())) {
            toastr.error("Please enter valid Mobile No!");
            row.find(".txtMobile").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtEmail").val() == '') {
            toastr.error("Please enter Email !");
            row.find(".txtEmail").focus();
            validationFailed = true;
            return;
        } else if (!isEmail(row.find(".txtEmail").val())) {
            toastr.error("Please enter valid Email !");
            row.find(".txtEmail").focus();
            validationFailed = true;
            return;
        }
    });
    if (validationFailed) {
        return;
    }
    const accountPayload = [{
        Code: $("#hfCode").val(),
        AccountName: AccountName,
        DisplayName: DisplayName,
        PANNo: $("#txtPANNo").val(),
    }];
    const addressData = [];
    $("#tblorderbooking tbody tr").each(function () {
        const row = $(this);
        const addressRow = {
            AddressCode: row.find(".txtAddressCode").val(),
            AddressLine1: row.find(".txtAddressLine1").val(),
            AddressLine2: row.find(".txtAddressLine2").val(),
            CityName: row.find(".txtCity").val(),
            StateName: row.find(".txtState").val(),
            Nation: row.find(".txtNation").val(),
            PIN: row.find(".txtPIN").val(),
            GSTIN: row.find(".txtGSTIN").val(),
            ContactPerson: row.find(".txtContactPerson").val(),
            PhoneNo: row.find(".txtPhone").val(),
            MobileNo: row.find(".txtMobile").val(),
            EmailID: row.find(".txtEmail").val(),
            IsDefault: row.find(".chkIsDefault").is(":checked") ? "Y" : "N",
        };
        addressData.push(addressRow);
    });

    const payload = {
        AccountMaster: accountPayload,
        accountAddress: addressData,
    };

    $.ajax({
        url: `${appBaseURL}/api/Master/InsertAccountMaster`,
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
                    ShowAccountMasterlist();
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
            <td><input type="text" list="txtItemCode" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm mandatory" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm mandatory" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtBillQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtBillQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtReceivedQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQtyBox_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtBillQty box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQty(event, this);" onfocusout="CalculateAmount(this);" id="txtBillQty_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtReceivedQty box_border form-control form-control-sm mandatory text-right"onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" onfocusout="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" list="txtWarehouse" class="txtWarehouse box_border form-control form-control-sm mandatory" onfocusout="CheckWarehouse(this);" id="txtWarehouse_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="button" class="btn btn-danger btn-sm deleteRow" value="Delete"/></td>
    `;

    table.appendChild(newRow);

    if (address !== undefined) {
        $("#txtAddressCode_" + rowCount).val(address.AddressCode || "");
        $("#txtAddressLine1_" + rowCount).val(address.AddressLine1 || "");
        $("#txtAddressLine2_" + rowCount).val(address.AddressLine2 || "");
        $("#txtCity_" + rowCount).val(address.CityName || "");
        $("#txtState_" + rowCount).val(address.StateName || "");
        $("#txtNation_" + rowCount).val(address.CountryName || "");
        $("#txtPIN_" + rowCount).val(address.PIN || "");
        $("#txtGSTIN_" + rowCount).val(address.GSTIN || "");
        $("#txtContactPerson_" + rowCount).val(address.ContactPerson || "");
        $("#txtPhone_" + rowCount).val(address.PhoneNo || "");
        $("#txtMobile_" + rowCount).val(address.MobileNo || "");
        $("#txtEmail_" + rowCount).val(address.EmailID || "");
        $("#chkIsDefault_" + rowCount).prop('checked', address.IsDefault === 'Y');
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
    return Array.from(inputs).every(input => input.value.trim() !== "");
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
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm mandatory" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm mandatory" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtBillQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtBillQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtReceivedQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQtyBox_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtBillQty box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQty(event, this);" onfocusout="CalculateAmount(this);" id="txtBillQty_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtReceivedQty box_border form-control form-control-sm mandatory text-right"onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" onfocusout="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" list="txtWarehouse" class="txtWarehouse box_border form-control form-control-sm mandatory" onfocusout="CheckWarehouse(this);" id="txtWarehouse_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="button" class="btn btn-danger btn-sm deleteRow" value="Delete"/></td>
      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" list="txtItemBarCode" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" id="txtItemBarCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" list="txtItemCode" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" id="txttxtItemCode_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" list="txtItemName" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" id="txtItemName_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" class="txtItemAddress box_border form-control form-control-sm mandatory" id="txtItemAddress_${rowCount}" autocomplete="off" disabled /></td>
            <td><input type="text" class="txtUOM box_border form-control form-control-sm mandatory" id="txtUOM_${rowCount}"  autocomplete="off" disabled/></td>
            <td><input type="text" class="txtBillQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtBillQtyBox_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtReceivedQtyBox box_border form-control form-control-sm text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQtyBox_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtBillQty box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="SetvalueReceivedQty(event, this);" onfocusout="CalculateAmount(this);" id="txtBillQty_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtReceivedQty box_border form-control form-control-sm mandatory text-right"onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtReceivedQty_${rowCount}" autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtRate box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" onfocusout="CalculateAmount(this);" id="txtRate_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtAmount box_border form-control form-control-sm mandatory text-right" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" id="txtAmount_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" list="txtWarehouse" class="txtWarehouse box_border form-control form-control-sm mandatory" onfocusout="CheckWarehouse(this);" id="txtWarehouse_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="text" class="txtRemarks box_border form-control form-control-sm" id="txtRemarks_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="button" class="btn btn-danger btn-sm deleteRow" value="Delete"/></td>
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
    const result = Data.find(item => item.ModuleDesp === "MRN Master");
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
function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtMRNDate, #txtChallanDate').val(`${day}/${month}/${year}`);
    $('#txtMRNDate, #txtChallanDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
    });
}
function FillallItemfield(inputElement,value) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const itemBarCode = currentRow.querySelector('.txtItemBarCode');
        const itemCode = currentRow.querySelector('.txtItemCode');
        const itemName = currentRow.querySelector('.txtItemName');
        const itemAddress = currentRow.querySelector('.txtItemAddress');
        const itemUOM = currentRow.querySelector('.txtUOM');
        if (value == 'BarCode') {
            $("#txtItemBarCode option").each(function () {
                if ($(this).val() === inputValue) {
                    const item = ItemDetail.find(entry => entry.ItemBarCode == inputValue);
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
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
                    $("#txtAddress").val(item.Address)
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
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
                    $("#txtAddress").val(item.Address)
                    itemBarCode.value = item.ItemBarCode;
                    itemCode.value = item.ItemCode;
                    itemName.value = item.ItemName;
                    itemAddress.value = item.locationName;
                    itemUOM.value = item.UomName;
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
        }
     }
}

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let CityList = [];
$(document).ready(function () {
    $("#ERPHeading").text("Client/Vendor Master");
    $('#txtAccountName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDisplayName").focus();
        }
    });
    $('#txtDisplayName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPANNo").focus();
        }
    });
    $('#txtPANNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            let firstInput = $('#tblorderbooking #Orderdata tr:first input').first();
            firstInput.focus();
        }
    });
  
    ShowAccountMasterlist();
    GetGroupMasterList();
    GetCountryMasterList();
    GetCityDropDownList();

    GetGroupMasterList1();
    GetCountryMasterList1();
    GetCityDropDownList1();
    $(document).on("change", ".chkIsDefault", function () {
        if (this.checked) {
            $(".chkIsDefault").not(this).prop("checked", false);
        }
    });
    $("#tdsCitysList").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#tdsCitysAllList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#tdsCitysAllList").val("")
        }
    });
    $("#tdsStatelist").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#tdsStateAlllist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#tdsStateAlllist").val("")
        }
    });
    $("#tdsNationlist").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#tdsNationAlllist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#tdsNationAlllist").val("")
        }
    });

    $("#tdsCitysList").on("focus", function () {
        $(this).val("");
    });
    $("#tdsStatelist").on("focus", function () {
        $(this).val("");
    });
    $("#tdsNationlist").on("focus", function () {
        $(this).val("");
    });
    $("#btnAddNewRow").click(function(){
        addNewRow();
    });
    $(".btnAddNewRow").click(function (e) {
        DeleteRow(e);
    });
    GetModuleMasterCode();
    ShowCityMasterlist();
});
function ShowAccountMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowAccountMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtAccounttable").show();
                const StringFilterColumn = ["Account Name","Display Name"];
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Account Name`]}')"><i class="fa-regular fa-circle-xmark"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtAccounttable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function CreateItemMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
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
    $("#tab1").text("EDIT");
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
                        $("#txtIsClient").prop("checked",false);
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
async function deleteItem(code, account) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
        $(this).addClass('highlight');
    });
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'accountmaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this account ${account} .?`)) {
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
function updateDisplayName() {
    const itemName = document.getElementById('txtAccountName').value;
    document.getElementById('txtDisplayName').value = itemName;
}
function GetGroupMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetStateDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtStateNameList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtStateNameList').html(options);
            } else {
                $('#txtStateNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryNameList').empty();
        }
    });
}
function GetCityDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCityDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtCityList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtCityList').html(options);
            } else {
                $('#txtCityList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCityList').empty();
        }
    });
}
function GetCountryMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCountryDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtCountryList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtCountryList').html(options);
            } else {
                $('#txtCountryList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryList').empty();
        }
    });
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtAccountName").val("");
    $("#txtDisplayName").val("");
    $("#txtPANNo").val("");
    $("#txtIsClient").prop("checked",true);
    $("#txtIsVendor").prop("checked", true);
    $("#txtIsMSME").val("");
    $("#Orderdata").empty();
}
function Save() {
    // Collect Account Master Data
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
        } else if (row.find(".txtMobile").val()=='') {
            toastr.error("Please enter Mobile No!");
            row.find(".txtMobile").focus();
            validationFailed = true;
            return;
        } else if (!IsMobileNumber(row.find(".txtMobile").val())) {
            toastr.error("Please enter valid Mobile No!");
            row.find(".txtMobile").focus();
            validationFailed = true;
            return;
        } else if (row.find(".txtEmail").val()=='') {
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
        IsClient: $("#txtIsClient").is(":checked") ? "Y" : "N", 
        IsVendor: $("#txtIsVendor").is(":checked") ? "Y" : "N", 
    }];
    // Collect Address Details Data
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
    const rowCount = index + 1;  // Generate a unique row count for each address
    const table = document.getElementById("Orderdata");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" class="txtAddressCode box_border form-control form-control-sm mandatory" id="txtAddressCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
        <td><input type="text" class="txtAddressLine1 box_border form-control form-control-sm mandatory" id="txtAddressLine1_${rowCount}" autocomplete="off"  maxlength="225"/></td>
        <td><input type="text" class="txtAddressLine2 box_border form-control form-control-sm" id="txtAddressLine2_${rowCount}" autocomplete="off" maxlength="225" /></td>
        <td><input type="text" list="txtCityList" onchange="FillallItemfield(this);" class="txtCity box_border form-control form-control-sm mandatory" id="txtCity_${rowCount}" autocomplete="off" /></td>
        <td><input type="text" list="txtStateNameList" disabled class="txtState box_border form-control form-control-sm mandatory" id="txtState_${rowCount}" autocomplete="off"  /></td>
        <td><input type="text" list="txtCountryList" disabled class="txtNation box_border form-control form-control-sm mandatory" id="txtNation_${rowCount}" autocomplete="off" /></td>
        <td><input type="text" class="txtPIN box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtPIN_${rowCount}" autocomplete="off"  maxlength="6"/></td>
        <td><input type="text" class="txtGSTIN box_border form-control form-control-sm" id="txtGSTIN_${rowCount}" autocomplete="off"  maxlength="20"/></td>
        <td><input type="text" class="txtContactPerson box_border form-control form-control-sm" id="txtContactPerson_${rowCount}" autocomplete="off" maxlength="50" /></td>
        <td><input type="text" class="txtPhone box_border form-control form-control-sm" onkeypress="return OnChangeNumericTextBox(this);" id="txtPhone_${rowCount}" autocomplete="off"  maxlength="15"/></td>
        <td><input type="text" class="txtMobile box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtMobile_${rowCount}" autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtEmail box_border form-control form-control-sm mandatory" id="txtEmail_${rowCount}" autocomplete="off"maxlength="100" /></td>
        <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}" autocomplete="off" /></td>
        <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>
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
function getCheckedCount(className) {
    return $(`.${className}:checked`).length;
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
function isValidPAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panRegex.test(pan)) {
        return true;
    } else {
        return false; 
    }
}
function IsMobileNumber(txtMobId) {
    var mob = /^[6-9]{1}[0-9]{9}$/;
    if (mob.test(txtMobId) == false) {
        return false;
    }
    return true;
}
function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
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
            <td><input type="text" class="txtAddressCode box_border form-control form-control-sm mandatory" id="txtAddressCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" class="txtAddressLine1 box_border form-control form-control-sm mandatory" id="txtAddressLine1_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" class="txtAddressLine2 box_border form-control form-control-sm" id="txtAddressLine2_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" list="txtCityList" onchange="FillallItemfield(this);" class="txtCity box_border form-control form-control-sm mandatory" id="txtCity_${rowCount}" autocomplete="off"  /></td>
            <td><input type="text" list="txtStateNameList" disabled class="txtState box_border form-control form-control-sm mandatory" id="txtState_${rowCount}"  autocomplete="off" /></td>
            <td><input type="text" list="txtCountryList" disabled class="txtNation box_border form-control form-control-sm mandatory" id="txtNation_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtPIN box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtPIN_${rowCount}" autocomplete="off" maxlength="6" /></td>
            <td><input type="text" class="txtGSTIN box_border form-control form-control-sm" id="txtGSTIN_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtContactPerson box_border form-control form-control-sm" id="txtContactPerson_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" class="txtPhone box_border form-control form-control-sm" onkeypress="return OnChangeNumericTextBox(this);" id="txtPhone_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtMobile box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtMobile_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtEmail box_border form-control form-control-sm mandatory" id="txtEmail_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}"autocomplete="off"  /></td>
            
            <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button></td>

      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" class="txtAddressCode box_border form-control form-control-sm mandatory" id="txtAddressCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" class="txtAddressLine1 box_border form-control form-control-sm mandatory" id="txtAddressLine1_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" class="txtAddressLine2 box_border form-control form-control-sm" id="txtAddressLine2_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" list="txtCityList" onchange="FillallItemfield(this);" class="txtCity box_border form-control form-control-sm mandatory" id="txtCity_${rowCount}" autocomplete="off"  /></td>
            <td><input type="text" list="txtStateNameList" disabled class="txtState box_border form-control form-control-sm mandatory" id="txtState_${rowCount}"  autocomplete="off" /></td>
            <td><input type="text" list="txtCountryList" disabled class="txtNation box_border form-control form-control-sm mandatory" id="txtNation_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtPIN box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtPIN_${rowCount}" autocomplete="off" maxlength="6" /></td>
            <td><input type="text" class="txtGSTIN box_border form-control form-control-sm" id="txtGSTIN_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtContactPerson box_border form-control form-control-sm" id="txtContactPerson_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" class="txtPhone box_border form-control form-control-sm" onkeypress="return OnChangeNumericTextBox(this);" id="txtPhone_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtMobile box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtMobile_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtEmail box_border form-control form-control-sm mandatory" id="txtEmail_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}"autocomplete="off"  /></td>
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
    const result = Data.find(item => item.ModuleDesp === "Client/Vendor Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
$(document).on('keydown', '#tblorderbooking input', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        let currentInput = $(this);
        let lastRow = $('#tblorderbooking #Orderdata tr').last();
        if (lastRow && currentInput.hasClass('chkIsDefault')) {
            currentInput.hasClass('chkIsDefault')
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
function FillallItemfield(inputElement) {
    const currentRow = inputElement.closest('tr');
    if (currentRow) {
        const inputValue = inputElement.value;
        const Nation = currentRow.querySelector('.txtNation');
        const State = currentRow.querySelector('.txtState');
        if (inputValue != "") {
            const item = CityList.find(entry => entry["City Name"] == inputValue);
            Nation.value = item.CountryName;
            State.value = item["State Name"];
        } else {
            Nation.value = "";
            State.value = "";
        }
    }
}
function ShowCityMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowCityMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                CityList = response;
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}

function updateAddressCode() {
    const inputMappings = {
        tdsAddressCode1: "txtAddressCode",
        tdsAddressLine1: "txtAddressLine1",
        tdsAddressLine2: "txtAddressLine2",
        tdsCitysList: "txtCity",
        tdsStatelist: "txtState",
        tdsNationlist: "txtNation",
        tdsPIN: "txtPIN",
        tdsGSTIN: "txtGSTIN",
        tdsContactPerson: "txtContactPerson",
        tdsPhone: "txtPhone",
        tdsMobile: "txtMobile",
        tdsEmail: "txtEmail",
    };

    Object.keys(inputMappings).forEach(inputId => {
        let inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.addEventListener("input", function () {
                updateLatestRow(inputId, inputMappings[inputId]);
            });
        }
    });
    function updateLatestRow(inputId, tableFieldClass) {
        const table = document.getElementById("tblorderbooking").querySelector("tbody");
        const rows = table.querySelectorAll("tr");
        if (rows.length === 0) return;
        const lastRow = rows[rows.length - 1];
        const targetInput = lastRow.querySelector(`.${tableFieldClass}`);
        if (targetInput) {
            if (targetInput.type === "checkbox") {
                targetInput.checked = document.getElementById(inputId).checked;
            } else {
               
                targetInput.value = document.getElementById(inputId).value;
            }
        }
    }
   
};


function GetGroupMasterList1() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetStateDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#tdsStateAlllist').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#tdsStateAlllist').html(options);
            } else {
                $('#tdsStateAlllist').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryNameList').empty();
        }
    });
}
function GetCityDropDownList1() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCityDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#tdsCitysAllList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#tdsCitysAllList').html(options);
            } else {
                $('#tdsCitysAllList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCityList').empty();
        }
    });
}
function GetCountryMasterList1() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCountryDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#tdsNationAlllist').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#tdsNationAlllist').html(options);
            } else {
                $('#tdsNationAlllist').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryList').empty();
        }
    });
}

function FillallItemfield1(inputElement) {
    const inputValue = inputElement.value.trim(); 
    const Nation = document.querySelector('#tdsStatelist');
    const State = document.querySelector('#tdsNationlist');

    if (!Nation || !State) return;
        const item = CityList.find(entry => entry["City Name"] === inputValue);
        if (item) {
            Nation.value = item.CountryName || "";
            State.value = item["State Name"] || "";
        } else {
            Nation.value = "";
            State.value = "";
        }
    
}



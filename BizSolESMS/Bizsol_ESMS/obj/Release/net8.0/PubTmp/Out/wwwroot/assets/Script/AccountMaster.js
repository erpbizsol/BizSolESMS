var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let CityList = [];
$(document).ready(function () {
    $("#ERPHeading").text("Client/Vendor Master");
    $('#txtAccounCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAccountName").focus();
        }
    });
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
            $("#tdsAddressCode1").focus();
        }
    });
    $('#tdsAddressCode1').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsAddressLine1").focus();
        }
    });
    $('#tdsAddressLine1').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsAddressLine2").focus();
        }
    });
    $('#tdsAddressLine2').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsCitysList").focus();
        }
    });
    $('#tdsCitysList').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsGSTIN").focus();
        }
    });
    $('#tdsGSTIN').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsContactPerson").focus();
        }
    });
    $('#tdsContactPerson').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsPhone").focus();
        }
    });
    $('#tdsPhone').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsMobile").focus();
        }
    });
    $('#tdsMobile').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#tdsEmail").focus();
        }
    });
    $('#tdsEmail').on('keydown', function (e) {
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
        FillValue(this);
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Account Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
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
    $("#txtsave").prop("disabled", false);
    $("#txtNationby").prop("disabled", false);
    $("#txtStateby").prop("disabled", false);
    $("#tdsAddressCode1").prop("disabled", false);
    $("#tdsAddressLine1").prop("disabled", false);
    $("#tdsAddressLine2").prop("disabled", false);
    $("#tdsCitysList").prop("disabled", false);
    //$("#tdsStatelist").prop("disabled", false);
    //$("#tdsNationlist").prop("disabled", false);
    //$("#tdsPIN").prop("disabled", false);
    $("#tdsGSTIN").prop("disabled", false);
    $("#tdsContactPerson").prop("disabled", false);
    $("#tdsPhone").prop("disabled", false);
    $("#tdsMobile").prop("disabled", false);
    $("#tdsEmail").prop("disabled", false);
    $("#txtAccounCode").prop("disabled", false);
    $("#txtAccountName").prop("disabled", false);
    $("#txtDisplayName").prop("disabled", false);
    $("#txtPANNo").prop("disabled", false);
    $("#txtIsClient").prop("disabled", false);
    $("#txtIsVendor").prop("disabled", false);
    disableFields(false);
    $("#txtheaderdiv").show();
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    ClearData1();
    $("#txtsave").prop("disabled", false);
    disableFields(false);
    $("#txtheaderdiv").hide();
    $("#txtsave").prop("disabled", false);
    $("#txtNationby").prop("disabled", false);
    $("#txtStateby").prop("disabled", false);
    $("#tdsAddressCode1").prop("disabled", false);
    $("#tdsAddressLine1").prop("disabled", false);
    $("#tdsAddressLine2").prop("disabled", false);
    $("#tdsCitysList").prop("disabled", false);
    //$("#tdsStatelist").prop("disabled", false);
    //$("#tdsNationlist").prop("disabled", false);
    //$("#tdsPIN").prop("disabled", false);
    $("#tdsGSTIN").prop("disabled", false);
    $("#tdsContactPerson").prop("disabled", false);
    $("#tdsPhone").prop("disabled", false);
    $("#tdsMobile").prop("disabled", false);
    $("#tdsEmail").prop("disabled", false);
    $("#txtAccounCode").prop("disabled", false);
    $("#txtAccountName").prop("disabled", false);
    $("#txtDisplayName").prop("disabled", false);
    $("#txtPANNo").prop("disabled", false);
    $("#txtIsClient").prop("disabled", false);
    $("#txtIsVendor").prop("disabled", false);
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
                    $("#txtAccounCode").val(accountMaster.AccountCode || "");
                    $("#txtAccountName").val(accountMaster.AccountName || "");
                    $("#txtDisplayName").val(accountMaster.DisplayName || "");
                    $("#txtPANNo").val(accountMaster.PANNo || "");
                    $("#txtIsMSME").val(accountMaster.IsMSME || "");
                    disableFields(false);
                    $("#tdsAddressCode1").prop("disabled", false);
                    $("#tdsAddressLine1").prop("disabled", false);
                    $("#tdsAddressLine2").prop("disabled", false);
                    $("#tdsCitysList").prop("disabled", false);
                    //$("#tdsStatelist").prop("disabled", false);
                    //$("#tdsNationlist").prop("disabled", false);
                    //$("#tdsPIN").prop("disabled", false);
                    $("#tdsGSTIN").prop("disabled", false);
                    $("#tdsContactPerson").prop("disabled", false);
                    $("#tdsPhone").prop("disabled", false);
                    $("#tdsMobile").prop("disabled", false);
                    $("#tdsEmail").prop("disabled", false);
                    $("#tdsEmail").prop("disabled", false);
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
async function deleteItem(code, account, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
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
    else {
        $('tr').removeClass('highlight');
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
    const AccounCode = $("#txtAccounCode").val();
    if (!AccounCode) {
        toastr.error("Please enter  Account Code!");
        $("#txtAccounCode").focus();
        return;
    }
    else if (!AccountName) {
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
        }
        else if (row.find(".txtState").val() == '') {
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
        }
        else if (row.find(".txtMobile").val() == '') {
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
        AccountCode: $("#txtAccounCode").val(),
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
        <td><input type="text" class="txtAddressCode box_border form-control form-control-sm mandatory" id="txtAddressCodeby_${rowCount}" autocomplete="off" required maxlength="20" /></td>
        <td><input type="text" class="txtAddressLine1 box_border form-control form-control-sm mandatory" id="txtAddressLine1by_${rowCount}" autocomplete="off"  maxlength="225"/></td>
        <td><input type="text" class="txtAddressLine2 box_border form-control form-control-sm" id="txtAddressLine2by_${rowCount}" autocomplete="off" maxlength="225" /></td>
        <td><input type="text" list="txtCityList" onchange="FillallItemfield(this);" class="txtCity box_border form-control form-control-sm mandatory" id="txtCityby_${rowCount}" autocomplete="off" /></td>
        <td><input type="text" list="txtStateNameList" disabled class="txtState box_border form-control form-control-sm mandatory" id="txtStateby_${rowCount}" autocomplete="off"  /></td>
        <td><input type="text" list="txtCountryList" disabled class="txtNation box_border form-control form-control-sm mandatory" id="txtNationby_${rowCount}" autocomplete="off" /></td>
        <td><input type="text" disabled class="txtPIN  box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtPINby_${rowCount}" autocomplete="off"  maxlength="6"/></td>
        <td><input type="text" class="txtGSTIN box_border form-control form-control-sm" id="txtGSTINby_${rowCount}" autocomplete="off"  maxlength="20"/></td>
        <td><input type="text" class="txtContactPerson box_border form-control form-control-sm" id="txtContactPersonby_${rowCount}" autocomplete="off" maxlength="50" /></td>
        <td><input type="text" class="txtPhone box_border form-control form-control-sm" onkeypress="return OnChangeNumericTextBox(this);" id="txtPhoneby_${rowCount}" autocomplete="off"  maxlength="15"/></td>
        <td><input type="text" class="txtMobile box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtMobileby_${rowCount}" autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtEmail box_border form-control form-control-sm mandatory" id="txtEmailby_${rowCount}" autocomplete="off"maxlength="100" /></td>
        <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}" autocomplete="off" /></td>
        <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
    `;

    table.appendChild(newRow);

    if (address !== undefined) {
        $("#txtAddressCodeby_" + rowCount).val(address.AddressCode || "");
        $("#txtAddressLine1by_" + rowCount).val(address.AddressLine1 || "");
        $("#txtAddressLine2by_" + rowCount).val(address.AddressLine2 || "");
        $("#txtCityby_" + rowCount).val(address.CityName || "");
        $("#txtStateby_" + rowCount).val(address.StateName || "");
        $("#txtNationby_" + rowCount).val(address.CountryName || "");
        $("#txtPINby_" + rowCount).val(address.PIN || "");
        $("#txtGSTINby_" + rowCount).val(address.GSTIN || "");
        $("#txtContactPersonby_" + rowCount).val(address.ContactPerson || "");
        $("#txtPhoneby_" + rowCount).val(address.PhoneNo || "");
        $("#txtMobileby_" + rowCount).val(address.MobileNo || "");
        $("#txtEmailby_" + rowCount).val(address.EmailID || "");
        $("#chkIsDefault_" + rowCount).prop('checked', address.IsDefault === 'Y');
    }

    if (address.IsDefault === 'Y') {
     
        document.getElementById("tdsAddressCode1").value = address.AddressCode;
        document.getElementById("tdsAddressLine1").value = address.AddressLine1;
        document.getElementById("tdsAddressLine2").value = address.AddressLine2;
        document.getElementById("tdsCitysList").value = address.CityName;
        document.getElementById("tdsStatelist").value = address.StateName;
        document.getElementById("tdsNationlist").value = address.CountryName;
        document.getElementById("tdsPIN").value = address.PIN;
        document.getElementById("tdsGSTIN").value = address.GSTIN;
        document.getElementById("tdsContactPerson").value = address.ContactPerson;
        document.getElementById("tdsPhone").value = address.PhoneNo;
        document.getElementById("tdsMobile").value = address.MobileNo;
        document.getElementById("tdsEmail").value = address.EmailID;
       
        $("#txtAddressCodeby_" + rowCount).val(address.AddressCode || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtAddressLine1by_" + rowCount).val(address.AddressLine1 || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtAddressLine2by_" + rowCount).val(address.AddressLine2 || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtCityby_" + rowCount).val(address.CityName || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtStateby_" + rowCount).val(address.StateName || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtNationby_" + rowCount).val(address.CountryName || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtPINby_" + rowCount).val(address.PIN || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtGSTINby_" + rowCount).val(address.GSTIN || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtContactPersonby_" + rowCount).val(address.ContactPerson || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtPhoneby_" + rowCount).val(address.PhoneNo || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtMobileby_" + rowCount).val(address.MobileNo || "").prop('disabled', address.IsDefault === 'Y');
        $("#txtEmailby_" + rowCount).val(address.EmailID || "").prop('disabled', address.IsDefault === 'Y');
      /*  $("#chkIsDefault_" + rowCount).prop('checked', address.IsDefault === 'Y').prop('disabled', address.IsDefault === 'Y');*/
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
        <td><input type="text" class="txtAddressCode box_border form-control form-control-sm mandatory" id="txtAddressCodeby_${rowCount}" autocomplete="off" required maxlength="20" /></td>
        <td><input type="text" class="txtAddressLine1 box_border form-control form-control-sm mandatory" id="txtAddressLine1by_${rowCount}" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" class="txtAddressLine2 box_border form-control form-control-sm" id="txtAddressLine2by_${rowCount}" autocomplete="off" maxlength="200"/></td>
        <td><input type="text" list="txtCityList" onchange="FillallItemfield(this);" class="txtCity box_border form-control form-control-sm mandatory" id="txtCityby_${rowCount}" autocomplete="off"  /></td>
        <td><input type="text" list="txtStateNameList" disabled class="txtState box_border form-control form-control-sm mandatory" id="txtStateby_${rowCount}"  autocomplete="off" /></td>
        <td><input type="text" list="txtCountryList" disabled class="txtNation box_border form-control form-control-sm mandatory" id="txtNationby_${rowCount}"autocomplete="off"  /></td>
        <td><input type="text" disabled class="txtPIN  box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtPINby_${rowCount}" autocomplete="off" maxlength="6" /></td>
        <td><input type="text" class="txtGSTIN box_border form-control form-control-sm" id="txtGSTINby_${rowCount}"autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtContactPerson box_border form-control form-control-sm" id="txtContactPersonby_${rowCount}" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" class="txtPhone box_border form-control form-control-sm" onkeypress="return OnChangeNumericTextBox(this);" id="txtPhoneby_${rowCount}" autocomplete="off"maxlength="15" /></td>
        <td><input type="text" class="txtMobile box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtMobileby_${rowCount}"autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtEmail box_border form-control form-control-sm mandatory" id="txtEmailby_${rowCount}" autocomplete="off" maxlength="100" /></td>
        <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}"autocomplete="off"  /></td>
            
        <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>

    `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
        <td><input type="text" class="txtAddressCode box_border form-control form-control-sm mandatory" id="txtAddressCodeby_${rowCount}" autocomplete="off" required maxlength="20" /></td>
        <td><input type="text" class="txtAddressLine1 box_border form-control form-control-sm mandatory" id="txtAddressLine1by_${rowCount}" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" class="txtAddressLine2 box_border form-control form-control-sm" id="txtAddressLine2by_${rowCount}" autocomplete="off" maxlength="200"/></td>
        <td><input type="text" list="txtCityList" onchange="FillallItemfield(this);" class="txtCity box_border form-control form-control-sm mandatory" id="txtCityby_${rowCount}" autocomplete="off"  /></td>
        <td><input type="text" list="txtStateNameList" disabled class="txtState box_border form-control form-control-sm mandatory" id="txtStateby_${rowCount}"  autocomplete="off" /></td>
        <td><input type="text" list="txtCountryList" disabled class="txtNation box_border form-control form-control-sm mandatory" id="txtNationby_${rowCount}"autocomplete="off"  /></td>
        <td><input type="text" disabled class="txtPIN box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtPINby_${rowCount}" autocomplete="off" maxlength="6" /></td>
        <td><input type="text" class="txtGSTIN box_border form-control form-control-sm" id="txtGSTIN_${rowCount}"autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtContactPerson box_border form-control form-control-sm" id="txtContactPersonby_${rowCount}" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" class="txtPhone box_border form-control form-control-sm" onkeypress="return OnChangeNumericTextBox(this);" id="txtPhoneby_${rowCount}" autocomplete="off"maxlength="15" /></td>
        <td><input type="text" class="txtMobile box_border form-control form-control-sm mandatory" onkeypress="return OnChangeNumericTextBox(this);" id="txtMobileby_${rowCount}"autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtEmail box_border form-control form-control-sm mandatory" id="txtEmailby_${rowCount}" autocomplete="off" maxlength="100" /></td>
        <td><input type="checkbox" checked class="chkIsDefault" id="chkIsDefault_${rowCount}"autocomplete="off"  /></td>
        <td><button class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>
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
        const PIN = currentRow.querySelector('.txtPIN');
        if (inputValue != "") {
            const item = CityList.find(entry => entry["City Name"] == inputValue);
            Nation.value = item.CountryName;
            State.value = item["State Name"];
            PIN.value = item["Pin Code"];
        } else {
            Nation.value = "";
            State.value = "";
            PIN.value = "";
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
    const PIN = document.querySelector('#tdsPIN');

    if (!Nation || !State) return;
    const item = CityList.find(entry => entry["City Name"] === inputValue);
    if (item) {
        Nation.value = item.CountryName || "";
        State.value = item["State Name"] || "";
        PIN.value = item["Pin Code"] || "";
        $("#txtCityby_0").val(inputValue);
        $("#txtNationby_0").val(item.CountryName);
        $("#txtStateby_0").val(item["State Name"]);
        $("#txtPINby_0").val(item["Pin Code"]);
    } else {
        Nation.value = "";
        State.value = "";
        PIN.value = "";
        $("#txtNationby_0").val("");
        $("#txtStateby_0").val("");
        $("#txtCityby_0").val("");
        $("#txtPINby_0").val("");
    }

}
function FillValue(element) {
    const currentRow = element.closest('tr');
    const inputs = document.querySelectorAll('#Orderdata input');
    inputs.forEach(input => {
        if (!input.classList.contains('txtState') && !input.classList.contains('txtNation') && !input.classList.contains('txtPIN')) {
            input.disabled = false;
        }
    });
  ;
    if ($(element).prop('checked')) {
        if (currentRow) {
            const txtAddressCode = currentRow.querySelector('.txtAddressCode');
            const txtAddressLine1 = currentRow.querySelector('.txtAddressLine1');
            const txtAddressLine2 = currentRow.querySelector('.txtAddressLine2');
            const txtCity = currentRow.querySelector('.txtCity');
            const txtState = currentRow.querySelector('.txtState');
            const txtNation = currentRow.querySelector('.txtNation');
            const txtPIN = currentRow.querySelector('.txtPIN');
            const txtGSTIN = currentRow.querySelector('.txtGSTIN');
            const txtContactPerson = currentRow.querySelector('.txtContactPerson');
            const txtPhone = currentRow.querySelector('.txtPhone');
            const txtMobile = currentRow.querySelector('.txtMobile');
            const txtEmail = currentRow.querySelector('.txtEmail');
            $("#tdsAddressCode1").val(txtAddressCode.value),
            $("#tdsAddressLine1").val(txtAddressLine1.value),
            $("#tdsAddressLine2").val(txtAddressLine2.value),
            $("#tdsCitysList").val(txtCity.value),
            $("#tdsStatelist").val(txtState.value),
            $("#tdsNationlist").val(txtNation.value),
            $("#tdsPIN").val(txtPIN.value),
            $("#tdsGSTIN").val(txtGSTIN.value),
            $("#tdsContactPerson").val(txtContactPerson.value),
            $("#tdsPhone").val(txtPhone.value),
            $("#tdsMobile").val(txtMobile.value),
            $("#tdsEmail").val(txtEmail.value)
            const inputs = currentRow.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.type !== 'checkbox') {
                    input.disabled = true;
                }
            });
        }
    } else {
        const inputs = currentRow.querySelectorAll('input');
        inputs.forEach(input => {
            if (
                input.type !== 'checkbox' && !input.classList.contains('txtState') && !input.classList.contains('txtNation') && !input.classList.contains('txtPIN')){
                input.disabled = false;
                ClearData1();
            }
        });

    }
}

function getCheckedRows(element) {
    var value = $(element).val();
    var inputid = element.id;
    let isChecked = false;

    document.querySelectorAll("#Orderdata tr").forEach((row, index) => {
        const checkbox = row.querySelector(".chkIsDefault");

        if (checkbox && checkbox.checked) {
            isChecked = true;
            const input = row.querySelector(`#${inputid}`);
            if (input) {
                input.value = value;
            }
            fillFields(inputid, row, value);
        }
        if (!isChecked && index === 0) {
            const input = row.querySelector(`#${inputid}`);
            if (input) {
                input.value = value;
            }
            fillFields(inputid, row, value);
        }
    });
}
function fillFields(inputid, row, value) {
    if (inputid === "tdsAddressCode1") {
        let txtAddressCode = row.querySelector('.txtAddressCode');
        if (txtAddressCode) txtAddressCode.value = value;
    }

    if (inputid === "tdsAddressLine1") {
        let txtAddressLine1 = row.querySelector('.txtAddressLine1');
        if (txtAddressLine1) txtAddressLine1.value = value;
    }

    if (inputid === "tdsAddressLine2") {
        let txtAddressLine2 = row.querySelector('.txtAddressLine2');
        if (txtAddressLine2) txtAddressLine2.value = value;
    }

    if (inputid === "tdsCitysList") {
        let txtCity = row.querySelector('.txtCity');
        if (txtCity) txtCity.value = value;
    }

    if (inputid === "tdsStatelist") {
        let txtState = row.querySelector('.txtState');
        if (txtState) txtState.value = value;
    }

    if (inputid === "tdsNationlist") {
        let txtNation = row.querySelector('.txtNation');
        if (txtNation) txtNation.value = value;
    }

    if (inputid === "tdsPIN") {
        let txtPIN = row.querySelector('.txtPIN');
        if (txtPIN) txtPIN.value = value;
    }

    if (inputid === "tdsGSTIN") {
        let txtGSTIN = row.querySelector('.txtGSTIN');
        if (txtGSTIN) txtGSTIN.value = value;
    }

    if (inputid === "tdsContactPerson") {
        let txtContactPerson = row.querySelector('.txtContactPerson');
        if (txtContactPerson) txtContactPerson.value = value;
    }

    if (inputid === "tdsPhone") {
        let txtPhone = row.querySelector('.txtPhone');
        if (txtPhone) txtPhone.value = value;
    }

    if (inputid === "tdsMobile") {
        let txtMobile = row.querySelector('.txtMobile');
        if (txtMobile) txtMobile.value = value;
    }

    if (inputid === "tdsEmail") {
        let txtEmail = row.querySelector('.txtEmail');
        if (txtEmail) txtEmail.value = value;
    }
}
function ClearData1() {
    $("#tdsAddressCode1").val(""),
    $("#tdsAddressLine1").val(""),
    $("#tdsAddressLine2").val(""),
    $("#tdsCitysList").val(""),
    $("#tdsStatelist").val(""),
    $("#tdsNationlist").val(""),
    $("#tdsPIN").val(""),
    $("#tdsGSTIN").val(""),
    $("#tdsContactPerson").val(""),
    $("#tdsPhone").val(""),
    $("#tdsMobile").val(""),
    $("#tdsEmail").val("")
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
        url: `${appBaseURL}/api/Master/ShowAccountMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.AccountMaster && response.AccountMaster.length > 0) {
                    disableFields(true);
                    const accountMaster = response.AccountMaster[0];
                    $("#hfCode").val(accountMaster.Code || "").prop("disabled", true);
                    $("#txtAccounCode").val(accountMaster.AccounCode || "").prop("disabled", true);
                    $("#txtAccountName").val(accountMaster.AccountName || "").prop("disabled", true);
                    $("#txtDisplayName").val(accountMaster.DisplayName || "").prop("disabled", true);
                    $("#txtPANNo").val(accountMaster.PANNo || "").prop("disabled", true);
                    $("#txtIsMSME").val(accountMaster.IsMSME || "").prop("disabled", true);
                    $("#txtIsClient").prop("disabled", true);
                    $("#txtIsVendor").prop("disabled", true);
                    $("#txtsave").prop("disabled", true);
                    $("#tdsAddressCode1").prop("disabled", true);
                    $("#tdsAddressLine1").prop("disabled", true);
                    $("#tdsAddressLine2").prop("disabled", true);
                    $("#tdsCitysList").prop("disabled", true);
                    $("#tdsStatelist").prop("disabled", true);
                    $("#tdsNationlist").prop("disabled", true);
                    $("#tdsPIN").prop("disabled", true);
                    $("#tdsGSTIN").prop("disabled", true);
                    $("#tdsContactPerson").prop("disabled", true);
                    $("#tdsPhone").prop("disabled", true);
                    $("#tdsMobile").prop("disabled", true);
                    $("#tdsEmail").prop("disabled", true);
                    $("#tdsEmail").prop("disabled", true);
                    disableFields(true);

                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.AccountAddress && response.AccountAddress.length > 0) {
                    response.AccountAddress.forEach(function (address, index) {

                        $("#txtAddressCode").val(index, address).prop("disabled", true);
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
function disableFields(disable) {
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowAccountMaster`,
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
    XLSX.writeFile(wb, "Client/VendorMaster.xlsx");
}

function ChangecolorTr() {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[5]?.textContent.trim();
        if (columnValue === 'Y') {
            row.style.backgroundColor = '#f5c0bf';
        } else {
            row.style.backgroundColor = '';
        }
    });
}
setInterval(ChangecolorTr, 100);
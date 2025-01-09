
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');

$(document).ready(function () {
    $("#ERPHeading").text("Account Master");
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
            $("#txtIsClient").focus();
        }
    });
    $('#txtIsClient').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtIsVendor").focus();
        }
    });
    $('#txtIsVendor').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtIsMSME").focus();
        }
    });
    $('#txtIsMSME').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    ShowAccountMasterlist();
    GetGroupMasterList();
    GetCountryMasterList();
    GetCityDropDownList();
});
document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("tblorderbooking").querySelector("tbody");
    let rowCount = 0;
    function isRowComplete(row) {
        const inputs = row.querySelectorAll("input[type='text']");
        return Array.from(inputs).every(input => input.value.trim() !== "");
    }

    
    //document.addEventListener("input", function (event) {
    //    const input = event.target;
    //    const maxLength = input.getAttribute("maxlength");
    //    if (maxLength && input.value.length > maxLength) {
    //        input.value = input.value.slice(0, maxLength);
    //    }
    //});
    //document.querySelectorAll("input").forEach(input => {
    //    console.log(input.id, input.getAttribute("maxlength"));
    //});

    function addNewRow() {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" class="txtAddressCode form-control" id="txtAddressCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
            <td><input type="text" class="txtAddressLine1 form-control" id="txtAddressLine1_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" class="txtAddressLine2 form-control" id="txtAddressLine2_${rowCount}" autocomplete="off" maxlength="200"/></td>
            <td><input type="text" list="txtCityList" class="txtCity form-control" id="txtCity_${rowCount}" autocomplete="off"  /></td>
            <td><input type="text" list="txtStateNameList" class="txtState form-control" id="txtState_${rowCount}"  autocomplete="off" /></td>
            <td><input type="text" list="txtCountryList" class="txtNation form-control" id="txtNation_${rowCount}"autocomplete="off"  /></td>
            <td><input type="text" class="txtPIN form-control" id="txtPIN_${rowCount}" autocomplete="off" maxlength="6" /></td>
            <td><input type="text" class="txtGSTIN form-control" id="txtGSTIN_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtContactPerson form-control" id="txtContactPerson_${rowCount}" autocomplete="off" maxlength="200" /></td>
            <td><input type="text" class="txtPhone form-control" id="txtPhone_${rowCount}" autocomplete="off"maxlength="15" /></td>
            <td><input type="text" class="txtMobile form-control" id="txtMobile_${rowCount}"autocomplete="off" maxlength="15" /></td>
            <td><input type="text" class="txtEmail form-control" id="txtEmail_${rowCount}" autocomplete="off" maxlength="100" /></td>
            <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}"autocomplete="off"  /></td>
            <td><button type="button" class="btn btn-danger btn-sm deleteRow">Delete</button></td>
      `;
        table.appendChild(newRow);
    }

    document.getElementById("btnAddNewRow").addEventListener("click", function () {
        const rows = table.querySelectorAll("tr");
        const lastRow = rows[rows.length - 1];

        if (!isRowComplete(lastRow)) {
            alert("Please fill in all fields in the current row before adding a new row.");
        } else {
            addNewRow();
        }
    });
    // Add the event listener for delete row using event delegation
    table.addEventListener("click", function (event) {
        // Check if the clicked element is a delete button
        if (event.target && event.target.classList.contains("deleteRow")) {
            const row = event.target.closest("tr");

            // Ensure that at least one row remains in the table
            if (table.querySelectorAll("tr").length > 1) {
                row.remove(); // Remove the clicked row
            } else {
                alert("At least one row is required."); // Prevent row removal if it's the only one
            }
        }
    });

    addNewRow();
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

function CreateItemMaster() {
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
function Edit(code) {
    $("#txtListpage").hide();
    $("#txtCreatepage").show();

    // Make the AJAX request to fetch data
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
                    $("#txtIsClient").val(accountMaster.IsClient || "");
                    $("#txtIsVendor").val(accountMaster.IsVendor || "");
                } else {
                    toastr.warning("Account master data is missing.");
                }
                $("#Orderdata").empty();
                if (response.AccountAddress && response.AccountAddress.length > 0) {
                    response.AccountAddress.forEach(function (address, index) {
                      
                        addNewRow(index, address);
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

function deleteItem(code) {
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
    $("#txtIsClient").val("");
    $("#txtIsVendor").val("");
    $("#txtIsMSME").val("");
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
    }

    const accountPayload = [{
        Code: $("#hfCode").val(),
        AccountName: AccountName,
        DisplayName: DisplayName,
        PANNo: $("#txtPANNo").val(),
        IsClient: $("#chkIsClient").is(":checked") ? "Y" : "N", 
        IsVendor: $("#chkIsVendor").is(":checked") ? "Y" : "N", 
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
    console
    // Combine all data into a single payload
    const payload = {
        AccountMaster: accountPayload,
        accountAddress: addressData,
    };

    // Save the data using AJAX
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

function addNewRow(index, address) {
    const rowCount = index + 1;  // Generate a unique row count for each address
    const table = document.getElementById("Orderdata");

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" class="txtAddressCode form-control" id="txtAddressCode_${rowCount}" autocomplete="off" required maxlength="20" /></td>
        <td><input type="text" class="txtAddressLine1 form-control" id="txtAddressLine1_${rowCount}" autocomplete="off"  maxlength="225"/></td>
        <td><input type="text" class="txtAddressLine2 form-control" id="txtAddressLine2_${rowCount}" autocomplete="off" maxlength="225" /></td>
        <td><input type="text" list="txtCityList" class="txtCity form-control" id="txtCity_${rowCount}" autocomplete="off" /></td>
        <td><input type="text" list="txtStateNameList" class="txtState form-control" id="txtState_${rowCount}" autocomplete="off"  /></td>
        <td><input type="text" list="txtCountryList" class="txtNation form-control" id="txtNation_${rowCount}" autocomplete="off" /></td>
        <td><input type="text" class="txtPIN form-control" id="txtPIN_${rowCount}" autocomplete="off"  maxlength="6"/></td>
        <td><input type="text" class="txtGSTIN form-control" id="txtGSTIN_${rowCount}" autocomplete="off"  maxlength="20"/></td>
        <td><input type="text" class="txtContactPerson form-control" id="txtContactPerson_${rowCount}" autocomplete="off" maxlength="50" /></td>
        <td><input type="text" class="txtPhone form-control" id="txtPhone_${rowCount}" autocomplete="off"  maxlength="15"/></td>
        <td><input type="text" class="txtMobile form-control" id="txtMobile_${rowCount}" autocomplete="off" maxlength="15" /></td>
        <td><input type="text" class="txtEmail form-control" id="txtEmail_${rowCount}" autocomplete="off"maxlength="100" /></td>
        <td><input type="checkbox" class="chkIsDefault" id="chkIsDefault_${rowCount}" autocomplete="off" /></td>
        <td><button type="button" class="btn btn-danger btn-sm deleteRow">Delete</button></td>
    `;

    // Append the row to the table
    table.appendChild(newRow);

    // Populate the row with data from the API response
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


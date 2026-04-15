var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
$(document).ready(function () {
    $("#ERPHeading").text("General Configuration");
    GetModuleMasterCode();
    Edit();
    $('#txtPageSizeOption').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPageSize").focus();
        }
    });
    $('#txtPageSize').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    $('#txtSave').on('keydown', function (e) {
        if (e.key === "Enter") {
            Save();
        }
    });
    $('#txtSave').click(function () {
            Save();
    });
});
async function Save() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#txtheaderdiv").show();
    if ($("#txtPageSizeOption").val() === '') {
        toastr.error('Please enter Page Size with comma separated value !');
        $("#txtPageSizeOption").focus();
    } else if ($("#txtPageSize").val() === '') {
        toastr.error('Please enter par page value !');
        $("#txtPageSize").focus();
    } else {
        const payload = {
            Code: 0,
            perPageOption: $("#txtPageSizeOption").val(),
            perPage: $("#txtPageSize").val(),
        };
        $.ajax({
            url: `${appBaseURL}/api/Configuration/SavePerPageSizeConfiguration`,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    Edit();
                }
                else {
                    toastr.error(response.Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            }
        });
    }
}
async function Edit() {
    $("#tab1").text("NEW");
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/Configuration/GetPerPageSizeList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (items) {

            if (Array.isArray(items) && items.length > 0) {
                items.forEach(function (item, index) {
                    if (index === 0) {
                        $("#txtPageSizeOption").val(item.PerPageOption || "");
                        $("#txtPageSize").val(item.PerPage || "");
                    }
                });
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch item data. Please try again.");
        }
    });
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "General Configuration");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function OnChangeNumericWithCommaTextBox(event, element) {
    if (event.charCode == 44 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Numbers");
        element.reportValidity();
        return false;
    }
}
function OnChangeNumericTextBox(event, element) {
        if (event.charCode >= 48 && event.charCode <= 57) {
            element.setCustomValidity("");
            element.reportValidity();
            BizSolhandleEnterKey(event);
            return true;
        }
        else {
            element.setCustomValidity("Only allowed Numbers");
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
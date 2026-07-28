
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let CityList = [];

$(document).ready(function () {
    $("#ERPHeading").text("Company Master");
    GetModuleMasterCode();
    GetCityDropDownList();
    GetCountryMasterList();
    ShowCityMasterlist();
    Edit();

    $('#txtsave').on('keydown', function (e) {
        if (e.key === "Enter") {
            Save();
        }
    });
});

async function Save() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }

    const CompanyCode = $("#txtCompanyCode").val();
    const CompanyName = $("#txtCompanyName").val();
    const AddressLine1 = $("#txtAddressLine1").val();
    const Email = $("#txtEmail").val();
    const PANNo = $("#txtPANNo").val();
    const Mobile = $("#txtMobile").val();

    if (CompanyCode === "") {
        toastr.error('Please enter Company Code.');
        $("#txtCompanyCode").focus();
        return;
    }
    else if (CompanyName === "") {
        toastr.error('Please enter Company Name.');
        $("#txtCompanyName").focus();
        return;
    }
    else if (AddressLine1 === "") {
        toastr.error('Please enter Address Line 1.');
        $("#txtAddressLine1").focus();
        return;
    }
    else if (PANNo !== "" && !isValidPAN(PANNo)) {
        toastr.error('Please enter a valid PAN No.');
        $("#txtPANNo").focus();
        return;
    }
    else if (Mobile !== "" && !IsMobileNumber(Mobile)) {
        toastr.error('Please enter a valid Mobile No.');
        $("#txtMobile").focus();
        return;
    }
    else if (Email !== "" && !isEmail(Email)) {
        toastr.error('Please enter a valid Email.');
        $("#txtEmail").focus();
        return;
    }

    const payload = {
        code: $("#hftextCode").val(),
        companyCode: CompanyCode,
        companyName: CompanyName,
        aliasName: $("#txtAliasName").val(),
        addressLine1: AddressLine1,
        addressLine2: $("#txtAddressLine2").val(),
        cityName: $("#txtCity").val(),
        nation: $("#txtNation").val(),
        pin: $("#txtPinCode").val(),
        pANNo: PANNo,
        gstNo: $("#txtGSTNo").val(),
        phone: $("#txtPhone").val(),
        mobileNo: Mobile,
        email: Email,
        mSMENo: $("#txtMSMENo").val(),
        uPIId: $("#txtUPIId").val(),
    };

    $.ajax({
        url: `${appBaseURL}/api/Master/InsertCompanyMaster?UserMaster_Code=${UserMaster_Code}`,
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

function Edit() {
    $("#tab1").text("NEW");
    $("#txtheaderdiv").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowCompanyMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (Array.isArray(response) && response.length > 0) {
                FillCompanyFields(response[0]);
            } else {
                ClearData();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch company data. Please try again.");
        }
    });
}

function FillCompanyFields(item) {
    $("#hftextCode").val(item.Code || "0");
    $("#txtCompanyCode").val(item["Company Code"] || item.CompanyCode || "");
    $("#txtCompanyName").val(item["Company Name"] || item.CompanyName || "");
    $("#txtAliasName").val(item["Alias Name"] || item.AliasName || "");
    $("#txtAddressLine1").val(item["Address Line 1"] || item.AddressLine1 || "");
    $("#txtAddressLine2").val(item["Address Line 2"] || item.AddressLine2 || "");
    $("#txtCity").val(item.City || item.CityName || "");
    $("#txtNation").val(item.Nation || "");
    $("#txtPinCode").val(item["Pin Code"] || item.PIN || "");
    $("#txtPANNo").val(item["PAN No"] || item.PANNo || "");
    $("#txtGSTNo").val(item["GST No"] || item.GSTNo || "");
    $("#txtPhone").val(item.Phone || "");
    $("#txtMobile").val(item.Mobile || item.MobileNo || "");
    $("#txtEmail").val(item.Email || "");
    $("#txtMSMENo").val(item["MSME No"] || item.MSMENo || "");
    $("#txtUPIId").val(item["UPI Id"] || item.UPIId || "");
}

function ClearData() {
    $("#hftextCode").val("0");
    $("#txtCompanyCode").val("");
    $("#txtCompanyName").val("");
    $("#txtAliasName").val("");
    $("#txtAddressLine1").val("");
    $("#txtAddressLine2").val("");
    $("#txtCity").val("");
    $("#txtNation").val("");
    $("#txtPinCode").val("");
    $("#txtPANNo").val("");
    $("#txtGSTNo").val("");
    $("#txtPhone").val("");
    $("#txtMobile").val("");
    $("#txtEmail").val("");
    $("#txtMSMENo").val("");
    $("#txtUPIId").val("");
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Company Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
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
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}

function FillCityFields(inputElement) {
    const inputValue = inputElement.value.trim();
    if (inputValue !== "") {
        const item = CityList.find(entry => entry["City Name"] == inputValue);
        if (item) {
            $("#txtNation").val(item.CountryName || "");
            $("#txtPinCode").val(item["Pin Code"] || "");
        }
    } else {
        $("#txtNation").val("");
        $("#txtPinCode").val("");
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
        const inputs = $('.BizSolFormControl');
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }
        event.preventDefault();
    }
}

function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}

function isValidPAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}

function IsMobileNumber(txtMobId) {
    var mob = /^[6-9]{1}[0-9]{9}$/;
    return mob.test(txtMobId);
}

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

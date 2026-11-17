var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');

$(document).ready(function () {
    $("#ERPHeading").text("App Config");
    GetModuleMasterCode();
    Edit();

    $('#txtAppConfigId').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCompanyName").focus();
        }
    });
    $('#txtCompanyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtUnitName").focus();
        }
    });
    $('#txtUnitName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtTallyCompCode").focus();
        }
    });
    $('#txtTallyCompCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAppName").focus();
        }
    });
    $('#txtAppName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAppType").focus();
        }
    });
    $('#txtAppType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAppSoftwareSerialNo").focus();
        }
    });
    $('#txtAppSoftwareSerialNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
});

function getAppConfigValue(item, names, fallback) {
    if (!item) {
        return fallback;
    }
    for (var i = 0; i < names.length; i++) {
        if (item[names[i]] != null && item[names[i]] !== "") {
            return item[names[i]];
        }
    }
    return fallback;
}

function getSaveStatus(response) {
    if (!response) {
        return { status: "", msg: "" };
    }
    if (Array.isArray(response) && response.length > 0) {
        response = response[0];
    }
    return {
        status: getAppConfigValue(response, ["Status", "status"], ""),
        msg: getAppConfigValue(response, ["Msg", "msg", "Message", "message"], "")
    };
}

async function Save() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }

    if ($("#txtCompanyName").val() === '') {
        toastr.error('Please enter Company Name !');
        $("#txtCompanyName").focus();
        return;
    }
    if ($("#txtUnitName").val() === '') {
        toastr.error('Please enter Unit Name !');
        $("#txtUnitName").focus();
        return;
    }
    if ($("#txtTallyCompCode").val() === '') {
        toastr.error('Please enter Tally Comp Code !');
        $("#txtTallyCompCode").focus();
        return;
    }
    if ($("#txtAppName").val() === '') {
        toastr.error('Please enter App Name !');
        $("#txtAppName").focus();
        return;
    }
    if ($("#txtAppType").val() === '') {
        toastr.error('Please enter App Type !');
        $("#txtAppType").focus();
        return;
    }
    if ($("#txtAppSoftwareSerialNo").val() === '') {
        toastr.error('Please enter App Software Serial No !');
        $("#txtAppSoftwareSerialNo").focus();
        return;
    }

    const payload = {
        appconfigId: parseInt($("#txtAppConfigId").val(), 10) || 0,
        CompanyName: $("#txtCompanyName").val(),
        UnitName: $("#txtUnitName").val(),
        TallyCompCode: $("#txtTallyCompCode").val(),
        AppName: $("#txtAppName").val(),
        AppType: $("#txtAppType").val(),
        AppSoftwareSerialNo: $("#txtAppSoftwareSerialNo").val()
    };

    $.ajax({
        url: `${appBaseURL}/api/Configuration/SaveAppConfigConfiguration`,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const result = getSaveStatus(response);
            if (result.status === 'Y') {
                toastr.success(result.msg || 'App Config saved successfully.');
                Edit();
            }
            else {
                toastr.error(result.msg || 'App Config save failed.');
            }
        },
        error: function (xhr) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        }
    });
}

async function Edit() {
    $("#tab1").text("NEW");

    $.ajax({
        url: `${appBaseURL}/api/Configuration/GetAppConfigList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (items) {
            if (Array.isArray(items) && items.length > 0) {
                sessionStorage.setItem('AppConfig', JSON.stringify(items));
                var item = items[0];
                $("#txtAppConfigId").val(getAppConfigValue(item, ["appconfigId", "AppConfigId", "AppconfigId", "Code"], "0"));
                $("#txtCompanyName").val(getAppConfigValue(item, ["CompanyName", "companyName"], ""));
                $("#txtUnitName").val(getAppConfigValue(item, ["UnitName", "unitName"], ""));
                $("#txtTallyCompCode").val(getAppConfigValue(item, ["TallyCompCode", "tallyCompCode"], ""));
                $("#txtAppName").val(getAppConfigValue(item, ["AppName", "appName"], ""));
                $("#txtAppType").val(getAppConfigValue(item, ["AppType", "appType"], ""));
                $("#txtAppSoftwareSerialNo").val(getAppConfigValue(item, ["AppSoftwareSerialNo", "appSoftwareSerialNo"], ""));
            } else {
                $("#txtAppConfigId").val("0");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch App Config data. Please try again.");
        }
    });
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    if (!Data) {
        return;
    }
    const result = Data.find(item => item.ModuleDesp === "App Config" || item.ModuleDesp === "App Config Configuration");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}

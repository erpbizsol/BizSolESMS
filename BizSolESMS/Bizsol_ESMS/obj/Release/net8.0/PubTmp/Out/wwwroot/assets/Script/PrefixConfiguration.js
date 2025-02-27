﻿var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
$(document).ready(function () {
    $("#ERPHeading").text("Prefix Configuration");
    GetModuleMasterCode();
    Edit();
    $('#txtMRNNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOrderNo").focus();
        }
    });
    $('#txtOrderNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtChallanNo").focus();
        }
    });
    $('#txtChallanNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
});
async function Save() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if ($("#txtMRNNo").val() === '') {
        toastr.error('Please enter Prefix MRN No !');
        $("#txtMRNNo").focus();
    } else if ($("#txtOrderNo").val() === '') {
        toastr.error('Please enter Prefix Order No !');
        $("#txtOrderNo").focus();
    } else if ($("#txtChallanNo").val() === '') {
        toastr.error('Please enter Prefix Challan No !');
        $("#txtChallanNo").focus();
    } else {
        const payload = {
            MRNNo: $("#txtMRNNo").val(),
            OrderNo: $("#txtOrderNo").val(),
            ChallanNo: $("#txtChallanNo").val(),
        };
        $.ajax({
            url: `${appBaseURL}/api/Configuration/SavePrefixConfiguration`,
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
 
    $.ajax({
        url: `${appBaseURL}/api/Configuration/GetPrefixConfigurationList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (items) {

            if (Array.isArray(items) && items.length > 0) {
                items.forEach(function (item, index) {
                    if (index === 0) {
                        $("#txtMRNNo").val(item.MRNNo || "");
                        $("#txtOrderNo").val(item.OrderNo || "");
                        $("#txtChallanNo").val(item.ChallanNo || "");
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
    const result = Data.find(item => item.ModuleDesp === "Prefix Configuration");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
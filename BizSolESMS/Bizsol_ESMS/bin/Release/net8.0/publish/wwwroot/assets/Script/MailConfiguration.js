var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Mail Configuration");
    ShowMailConfigurationlist('Load');
    GetModuleMasterCode();
    $("#txtSMSType").on("change",function (e){
        if ($(this).val() == 'Email') {
            $("#dvEmail").show();
            $("#dvWhatsApp").hide();
            $("#txtWhatsAppNo").val ('')
        } else {
            $("#dvWhatsApp").show();
            $("#dvEmail").hide();
            $("#txtEmail").val('')
        };
    })
    $('#txtForType').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtSMSType').focus();
        }
    });
    $('#txtSMSType').on('keydown', function (e) {
        if (e.key === 'Enter') {
            if ($(this).val() === 'Email') {
                $('#txtEmail').focus();
            } else {
                $('#txtWhatsAppNo').focus();
            }
        }
    });

});
function ShowMailConfigurationlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowMailConfiguration`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Email", "Mobile No", "For Type","SMS Type"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtTable").hide();
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
function Save() {
    var ForType = $("#txtForType").val();
    var SMSType = $("#txtSMSType").val();
    var Email = $("#txtEmail").val();
    var WhatsAppNo = $("#txtWhatsAppNo").val();
    
    if (SMSType == 'Email' && Email === '') {
        toastr.error('Please enter email !');
        $("#txtEmail").focus();
    } else if (SMSType == 'Email' && areEmailsValid($("#txtEmail").val()) == false) {
        toastr.error('Please enter valid email !');
        $("#txtEmail").focus();
    } else if (SMSType == 'WhatsApp' && WhatsAppNo === '') {
        toastr.error('Please enter WhatsApp No !');
        $("#txtWhatsAppNo").focus();
    }
    else {
        const payload = {
            Code: $("#hfCode").val(),
            EmailID: Email,
            MobileNo: WhatsAppNo,
            ForType: ForType,
            EmailSMSType: SMSType,
            UserMaster_Code: UserMaster_Code
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveMailConfiguration`,
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
                    ShowMailConfigurationlist('Get');
                    BackMaster();
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
async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtEmail").prop("disabled", false),
    $("#txtWhatsAppNo").prop("disabled", false)
    $("#txtSMSType").prop("disabled", false)
    $("#txtForType").prop("disabled", false)
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#txtEmail").prop("disabled", false),
    $("#txtWhatsAppNo").prop("disabled", false)
    $("#txtSMSType").prop("disabled", false)
    $("#txtForType").prop("disabled", false)
    $("#txtheaderdiv").hide();
}
async function deleteItem(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'EmailSMSConfigurationMaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteMailConfiguration?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowMailConfigurationlist('Get');
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
        url: `${appBaseURL}/api/Master/ShowMailConfigurationByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                $("#txtEmail").val(item.EmailID),
                $("#txtSMSType").val(item.EmailSMSType),
                $("#txtForType").val(item.ForType)
                if (item.EmailSMSType == 'Email') {
                    $("#dvEmail").show();
                    $("#dvWhatsApp").hide();
                    $("#txtEmail").val(item.EmailID)
                } else {
                    $("#dvEmail").hide();
                    $("#dvWhatsApp").show();
                    $("#txtWhatsAppNo").val(item.MobileNo)
                }
                $("#txtsave").prop("disabled", false)
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtSMSType").val("Email");
    $("#dvWhatsApp").hide();
    $("#dvEmail").show();
    $("#txtEmail").val("");
    $("#txtWhatsAppNo").val("");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Mail Configuration");
    if (result) {
        UserModuleMaster_Code = result.Code;
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
        url: `${appBaseURL}/api/Master/ShowMailConfigurationByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                    $("#txtEmail").val(item.EmailID).attr("disabled", true),
                    $("#txtSMSType").val(item.EmailSMSType).attr("disabled", true),
                    $("#txtForType").val(item.ForType).attr("disabled" ,true)
                 if (item.EmailSMSType == 'Email') {
                    $("#dvEmail").show();
                    $("#dvWhatsApp").hide();
                     $("#txtEmail").val(item.EmailID).attr("disabled", true)
                } else {
                    $("#dvEmail").hide();
                    $("#dvWhatsApp").show();
                     $("#txtWhatsAppNo").val(item.MobileNo).attr("disabled", true)
                }
                $("#txtsave").attr("disabled", true);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function areEmailsValid(inputText) {
    let emails = inputText.split(';').map(email => email.trim()).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email));
}

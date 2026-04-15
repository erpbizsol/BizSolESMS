var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Helpdesk");
    DefaultPageList();
    ShowHelpdesklist('Load');
    GetModuleMasterCode();
    $('#ddlPage').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtDescription').focus();
        }
    });
});
function ShowHelpdesklist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowHelpdesk`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Page","Description","Raised By","Status"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["Raised Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item,
                    Status: item.Status == 'Pending' ? `<button class="btn btn-danger icon-height mb-1" title="Status" onclick="ChangeStatus('${item.Code}')">${item.Status}</button>`:`<button class="btn btn-success icon-height mb-1" title="Status">${item.Status}</button>`,
                    Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
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
    var Description = $("#txtDescription").val();
    var Page = $("#ddlPage").val();

    if (Page == '') {
        toastr.error('Please select page !');
        $("#ddlPage").focus();
    } else if (Description == '') {
        toastr.error('Please enter description !');
        $("#txtDescription").focus();
    }
    else {
        const payload = {
            Code: $("#hfCode").val(),
            UserModuleMaster_Code: Page,
            Description: Description,
            UserMaster_Code: UserMaster_Code
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveHelpdesk`,
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
                    ShowHelpdesklist('GET');
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
    $("#ddlPage").prop("disabled", false),
    $("#txtDescription").prop("disabled", false)
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#ddlPage").prop("disabled", false),
    $("#txtDescription").prop("disabled", false),
    $("#txtheaderdiv").hide()
}
async function deleteItem(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'Helpdesk');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteHelpdesk?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowHelpdesklist('Get');
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
        url: `${appBaseURL}/api/Master/ShowHelpdeskByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                $("#ddlPage").val(item.UserModuleMaster_Code),
                $("#txtDescription").val(item.Description),
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
    $("#ddlPage").val($("#ddlPage option:first").val());
    $("#txtDescription").val("");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Helpdesk");
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
        url: `${appBaseURL}/api/Master/ShowHelpdeskByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                $("#ddlPage").val(item.UserModuleMaster_Code).attr("disabled", true),
                $("#txtDescription").val(item.Description).attr("disabled", true),
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
function DefaultPageList() {
    $.ajax({
        url: `${appBaseURL}/api/UserMaster/GetUserModuleMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const select = $('#ddlPage');
                response.forEach(item => {
                    if (item.MasterModuleCode != 0) {
                        select.append(`<option value="${item.Code}">${item.ModuleDesp}</option>`);
                    }
                });
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
async function ChangeStatus(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Complete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (confirm(`Are you sure you want to complete this ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/CompleteTicket?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowHelpdesklist('Get');
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

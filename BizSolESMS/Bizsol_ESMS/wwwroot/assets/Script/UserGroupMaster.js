var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("User Group Master");
    UserGroupMasterList();
    $("#btnSave").click(function () {
        SaveUserGroupMaster();
    })
    $("#btnBack").click(function () {
        Back();
    })
    $('#txtGroupName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlGroupType").focus();
        }
    });
    $('#ddlGroupType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnSave").focus();
        }
    });
    GetModuleMasterCode();
});
function UserGroupMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserGroupMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtUserGroupMaster").show();
                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Group Name","Group Type"];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}','${item[`Group Name`]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                     <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtUserGroupMaster").hide();
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
    $("#tab1").text("NEW");
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
    disableFields(false);
    $("#btnSave").prop("disabled", false);
}
function Back() {
    $("#FrmUserMaster").hide();
    $("#tblUserMaster").show();
    ClearData();
    disableFields(false);
    $("#btnSave").prop("disabled", false);
}
async function Delete(code, userGroup) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
        $(this).addClass('highlight');
    });
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'usergroupmaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this item? ${userGroup}`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteUserGroupMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}&Reason=Test`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    UserGroupMasterList();
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", error);

            }
        });
    }
}
async function Edit(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("EDIT");
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
    UserGroupMasterByCode(Code);
    disableFields(false);
    $("#btnSave").prop("disabled", false);
}
function UserGroupMasterByCode(Code) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserGroupMasterByCode?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                $("#ddlGroupType").val(response.GroupType);
                $("#txtGroupName").val(response.GroupName);
                $("#hfCode").val(response.Code);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function SaveUserGroupMaster() {
    const GroupName = $("#txtGroupName").val();
    const GroupType = $("#ddlGroupType").val();
    const Code = $("#hfCode").val();
    if (GroupName === "") {
        toastr.error('Please enter Group Name.');
        $("#txtGroupName").focus();
    } else if (GroupType === "") {
        toastr.error('Please select Group Type.');
        $("#ddlGroupType").focus();
    }
    else {
        const payload = {
            Code: Code,
            GroupName: GroupName,
            GroupType: GroupType,
            UserMaster_Code: 0
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveUserGroupMaster?UserMaster_Code=${UserMaster_Code}`,
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
                    Back();
                    UserGroupMasterList();
                } else if (response.Status === 'N') {
                    toastr.error(response.Msg);
                }
                else {
                    toastr.error("Unexpected response format.");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            }
        });
    }
};
function ClearData() {
    $("#ddlGroupType").val("A");
    $("#txtGroupName").val("");
    $("#hfCode").val("0");
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "User Group Master");
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
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserGroupMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                disableFields(true);
                $("#ddlGroupType").val(response.GroupType);
                $("#txtGroupName").val(response.GroupName);
                $("#hfCode").val(response.Code);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}

function disableFields(disable) {
    $("input, select, button").not("#btnBack").prop("disabled", disable);
}

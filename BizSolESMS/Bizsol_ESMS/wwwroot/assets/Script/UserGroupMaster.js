var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
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
function Create() {
    ClearData();
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
}
function Back() {
    $("#FrmUserMaster").hide();
    $("#tblUserMaster").show();
    ClearData();
}
function Delete(code) {
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteUserGroupMaster?Code=${code}&UserMaster_Code=1&Reason=Test`,
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
function Edit(Code) {
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
    UserGroupMasterByCode(Code);
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
            url: `${appBaseURL}/api/Master/SaveUserGroupMaster`,
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
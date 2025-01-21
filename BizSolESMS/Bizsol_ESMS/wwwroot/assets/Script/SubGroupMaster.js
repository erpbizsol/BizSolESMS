
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Sub Group");
    $('#txtSubGroupName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtGroupName").focus();
        }
    });
    $('#txtGroupName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    ShowSubGroupMasterlist();
    GetMainLocationList();
    $("#txtGroupName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtGroupNameList option").each(function () {
            if ($(this).val() === value) {
              
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtGroupNameList").val("")
        }
    });
    GetModuleMasterCode();
   
});

function Save() {
        const SubGroupName = $("#txtSubGroupName").val();
        const GroupName = $("#txtGroupName").val();
        if (SubGroupName === "") {
            toastr.error('Please enter a Sub Group Name.');
            $("#txtSubGroupName").focus();
        } else if (GroupName==="") {
            toastr.error('Please Select Group Name.');
            $("#txtGroupName").focus();
        }
        else {
            const payload = {
                code: $("#hftextCode").val(),
                subGroupName: SubGroupName,
                groupName: GroupName,
            };
            $.ajax({
                url: `${appBaseURL}/api/Master/InsertSubGroupMaster?UserMaster_Code=${UserMaster_Code}`,
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
                        BackMaster();
                        ShowSubGroupMasterlist();
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
function ShowSubGroupMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowSubGroupMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key',authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["Sub Group Name","Group Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "CreatedOn": 'center',
                    "DigitAfterDecimal": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteSubGroupMaster('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
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
async function CreateSubgroupMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("New");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();

}

function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
}

async function deleteSubGroupMaster(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteSubGroupMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowSubGroupMasterlist();
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
    $("#tab1").text("Edit");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowSubGroupMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftextCode").val(item.Code);
                    $("#txtSubGroupName").val(item.SubGroupName);
                    $("#txtGroupName").val(item.GroupName);
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

function GetMainLocationList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtGroupNameList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtGroupNameList').html(options);
            } else {
                $('#txtGroupNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtGroupNameList').empty();
        }
    });
}

function ClearData() {
    $("#txtSubGroupName").val("");
    $("#txtGroupName").val("");
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Sub Group Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
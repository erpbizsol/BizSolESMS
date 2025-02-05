
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    GetModuleMasterCode();

    $("#ERPHeading").text("Group Master");
    $('#txtGroupName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    ShowMasterlist();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
});
function Save() {
    const GroupName = $("#txtGroupName").val();
    if (GroupName === "") {
        toastr.error('Please enter a Group Name.');
        $("#txtGroupName").focus();
    } else {
        const payload = {
            code: $("#hftxtCode").val(),
            GroupName: GroupName
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertGroupMaster?UserMaster_Code=${UserMaster_Code}`,
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
                    ShowMasterlist();
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
function ShowMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowGroupMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtgrouptable").show();
                const StringFilterColumn = ["Group Name"];
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteGroup('${item.Code}','${item[`Group Name`]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtgrouptable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function CreateGroupMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#hftxtCode").prop("disabled", false);
    $("#txtGroupName").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#hftxtCode").prop("disabled", false);
    $("#txtGroupName").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
}
async function deleteGroup(code, group) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
        $(this).addClass('highlight');
    });
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'groupmaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this group ? ${group}`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteGroupMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowMasterlist();
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:");

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
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowGroupMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftxtCode").val(item.Code);
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
function ClearData() {
    $("#hftxtCode").val("0");
    $("#txtGroupName").val("");

}
function exportTableToExcel() {
    var table = document.getElementById("table");
    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.table_to_sheet(table);
    var hiddenColumns = ["Action"];
    for (var row in worksheet) {
        if (row.startsWith('!')) continue;
        var cellIndex = parseInt(row.match(/\d+/));
        if (!isNaN(cellIndex)) {
            hiddenColumns.forEach(colIdx => {
                var colLetter = XLSX.utils.encode_col(colIdx);
                delete worksheet[colLetter + cellIndex];
            });
        }
    }
    var range = XLSX.utils.decode_range(worksheet['!ref']);
    range.e.c -= hiddenColumns.length; // Adjust end column
    worksheet['!ref'] = XLSX.utils.encode_range(range);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "UOMMaster.xlsx");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Group  Master");
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

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowGroupMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftxtCode").val(item.Code).prop("disabled", true);
                    $("#txtGroupName").val(item.GroupName).prop("disabled", true);
                    $("#txtbtnSave").prop("disabled", true);
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
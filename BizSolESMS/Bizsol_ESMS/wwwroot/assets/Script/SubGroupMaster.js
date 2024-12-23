
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
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
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
  

    if (SGMode === 'Edit') {
        $.ajax({
            url: `${appBaseURL}/api/Master/ShowSubGroupMasterByCode?Code=` + SGCode,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
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
});

function Save() {
        const SubGroupName = $("#txtSubGroupName").val();
        const GroupName = $("#txtGroupName").val();
        if (SubGroupName === "") {
            toastr.error('Please enter a UOM Name.');
            $("#txtSubGroupName").focus();
        }
        else {
            const payload = {
                code: parseInt(SGCode) || 0,
                subGroupName: SubGroupName,
                groupName: GroupName,
            };
            const isUpdate = payload.code > 0;
            const url = isUpdate
            $.ajax({
                url: `${appBaseURL}/api/Master/InsertSubGroupMaster`,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(payload),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Auth-Key', authKeyData);
                },
                success: function (response) {
                    if (response.Status === 'Y') {
                        if (SGMode > 'Edit' && SGCode > 0) {
                            toastr.success(response.Msg);
                            ShowSubGroupMasterlist();
                        }
                        else {
                            toastr.success(response.Msg);
                            ShowSubGroupMasterlist();
                        }

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
function CreateSubgroupMaster() {
    window.location.href = '/Master/CreateSubGroupMaster?Mode=New';

}

function BackMaster() {
    window.location.href = '/Master/SubGroupMasterList';

}

function deleteSubGroupMaster(code) {
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteSubGroupMaster?Code=${code}`,
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
function Edit(code) {
    window.location.href = `/Master/CreateSubGroupMaster?Code=${code}&Mode=Edit`;
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

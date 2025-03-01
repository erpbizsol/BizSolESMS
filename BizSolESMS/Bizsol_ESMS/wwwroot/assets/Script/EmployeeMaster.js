
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Employee Master");
    $('#txtEmployeeCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtEmployeeName").focus();
        }
    });
    $('#txtEmployeeName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDesignationName").focus();
        }
    });
    $('#txtDesignationName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtUserID").focus();
        }
    });
    $('#txtUserID').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    $("#txtDesignationName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtDesignationlist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtDesignationlist").val("")
        }
    });
    $('#txtDesignationName').on('focus', function (e) {

        $('#txtDesignationName').val("");

    });
    $("#txtUserID").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtUserlist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtUserlist").val("")
        }
    });
    $('#txtUserID').on('focus', function (e) {

        $('#txtUserID').val("");

    });
    ShowEmployeeMaster('Load');
    GetModuleMasterCode();
    GetDesignationlist();
    GetUserNameList();
});
function ShowEmployeeMaster(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowEmployeeMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtEmployeeTable").show();
                const StringFilterColumn = ["Employee Code", "Employee Name", "	User Name","Designation Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "CreatedOn": 'center',
                    "Digit After Decimal": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1"  title="Delete" onclick="deleteItem('${item.Code}', '${item[`Employee Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1" title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtEmployeeTable").hide();
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
    var EmployeeName = $("#txtEmployeeName").val();
    if ($("#txtUOM").val() == "") {
        toastr.error('Please enter a Employee Name.');
        $("#txtEmployeeName").focus();
    }
    else {
        const payload = {
            Code: $("#hftxtCode").val(),
            EmployeeCode: $("#txtEmployeeCode").val(),
            EmployeeName: $("#txtEmployeeName").val(),
            Designation: $("#txtDesignationName").val(),
            UserName: $("#txtUserID").val(),
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertEmployeeMaster?UserMaster_Code=${UserMaster_Code}`,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Auth-Key", authKeyData);
            },
            success: function (response) {
                if (response.Status === "Y") {
                    setTimeout(() => {
                        toastr.success(response.Msg);
                        ShowEmployeeMaster('Get');
                        BackMaster();
                    }, 1000);
                } else {
                    toastr.error(response.Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            },
        });
    }
}
async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#hftxtCode").prop("disabled", false);
    $("#txtEmployeeCode").prop("disabled", false);
    $("#txtEmployeeName").prop("disabled", false);
    $("#txtDesignationName").prop("disabled", false);
    $("#txtUserID").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
    disableFields(false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    $("#hftxtCode").prop("disabled", false);
    $("#txtEmployeeCode").prop("disabled", false);
    $("#txtEmployeeName").prop("disabled", false);
    $("#txtDesignationName").prop("disabled", false);
    $("#txtUserID").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
    disableFields(false);
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
        url: ` ${appBaseURL}/api/Master/ShowEmployeeMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {  
            $("#hftxtCode").val(response.Code);
            $("#txtEmployeeCode").val(response.EmployeeCode);
            $("#txtEmployeeName").val(response.EmployeeName);
            $("#txtDesignationName").val(response.DesignationName);
            $("#txtUserID").val(response.UserID);
            $("#txtbtnSave").prop("disabled", false);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}
function ClearData() {
    $("#hftxtCode").val("0");
    $("#txtEmployeeCode").val("");
    $("#txtEmployeeName").val("");
    $("#txtDesignationName").val("");
    $("#txtUserID").val("");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Employee Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function deleteItem(code, Employee, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");

    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (!hasPermission) {
        toastr.error(msg);
        return;
    }

    const { Status, msg1 } = await CheckRelatedRecord(code, 'UomMaster');
    if (Status) {
        toastr.error(msg1);
        return;
    }

    if (confirm(`Are you sure you want to delete this Employee ${Employee}?`)) {

        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteEmployeeMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowEmployeeMaster('Get');
                } else {
                    toastr.error("Unexpected response format.");
                }
            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:");
            }
        });
        return;
    }
    else {
        $('tr').removeClass('highlight');
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
        url: `${appBaseURL}/api/Master/ShowEmployeeMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.Code) {  
                $("#hftxtCode").val(response.Code).prop("disabled", true);
                $("#txtEmployeeCode").val(response.EmployeeCode).prop("disabled", true);
                $("#txtEmployeeName").val(response.EmployeeName).prop("disabled", true);
                $("#txtDesignationName").val(response.DesignationName).prop("disabled", true);
                $("#txtUserID").val(response.UserID).prop("disabled", true);
                $("#txtbtnSave").prop("disabled", true);
                disableFields(true);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}
function disableFields(disable) {
    $("#txtCreatepage,#txtbtnSave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowEmployeeMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                Export(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Export(jsonData) {
    const columnsToRemove = ["Code"];
    if (!Array.isArray(columnsToRemove)) {
        console.error("columnsToRemove should be an array");
        return;
    }
    const filteredData = jsonData.map(row =>
        Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
    );
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "EmployeeMaster.xlsx");
}
function GetDesignationlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetDesignationList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtDesignationlist').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.DesignationName + '" text="' + item.Code + '"></option>';
                });
                $('#txtDesignationlist').html(options);
            } else {
                $('#txtDesignationlist').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtDesignationlist').empty();
        }
    });
}
function GetUserNameList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserNameList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtUserlist').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.UserID + '" text="' + item.Code + '"></option>';
                });
                $('#txtUserlist').html(options);
            } else {
                $('#txtUserlist').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtUserlist').empty();
        }
    });
}





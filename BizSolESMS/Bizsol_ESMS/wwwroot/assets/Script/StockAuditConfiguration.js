var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Stock Audit Configuration");
    CategoryList();
    ShowStockAuditConfiglist("Load");
    $('#ddlCategory').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtValue").focus();
        }
    });
    $('#txtValue').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCycleCountDays").focus();
        }
    });
    $('#txtCycleCountDays').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPartLineCount").focus();
        }
    });
    GetModuleMasterCode();
});
function ShowStockAuditConfiglist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetStockAuditConfigList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["CategoryName","Value","CycleCountDays","PartLineCount"];
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
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
    var Category = $("#ddlCategory").val();
    var Value = $("#txtValue").val();
    var CycleCountDays = $("#txtCycleCountDays").val();
    var PartLineCount = $("#txtPartLineCount").val();

    if (Category == '') {
        toastr.error('Please select category!');
        $("#ddlCategory").focus();
    } else if (Value == '') {
        toastr.error('Please enter value!');
        $("#txtValue").focus();
    }
    else if (CycleCountDays == '' || CycleCountDays == '0') {
        toastr.error('Please enter cycle count days!');
        $("#txtCycleCountDays").focus();
    }
    else if (PartLineCount == '' || PartLineCount == '0') {
        toastr.error('Please enter part line count!');
        $("#txtPartLineCount").focus();
    }
    else {
        const payload = {
            Code: $("#hfCode").val(),
            CategoryMaster_Code: Category,
            Value: Value,
            CycleCountDays: CycleCountDays,
            PartLineCount: PartLineCount,
            UserMaster_Code: UserMaster_Code
        };
        blockUI();
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveStockAuditConfig`,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status === 'Y') {
                    toastr.success(response[0].Msg);
                    ShowStockAuditConfiglist('Get');
                    BackMaster();
                }
                else {
                    toastr.error(response[0].Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
                unblockUI();
            }
        });
        unblockUI();
    }
}
async function CreateStockAuditConfig() {
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
    $("#hfCode").prop("disabled", false);
    $("#txtValue").prop("disabled", false);
    $("#txtPartLineCount").prop("disabled", false);
    $("#txtCycleCountDays").prop("disabled", false);
    $("#ddlCategory").prop("disabled", false);
    $("#txtsave").prop("disabled", false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#hfCode").prop("disabled", false),
    $("#txtValue").prop("disabled", false),
    $("#txtPartLineCount").prop("disabled", false),
    $("#txtCycleCountDays").prop("disabled", false),
    $("#ddlCategory").prop("disabled", false),
    $("#txtsave").prop("disabled", false);
    $("#txtheaderdiv").hide();
    ShowStockAuditConfiglist("Load");
}
async function Delete(code, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this vacation ?`)) {
        blockUI();
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteStockAuditConfig?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status === 'Y') {
                    toastr.success(response[0].Msg);
                    ShowStockAuditConfiglist("Get");
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);
                unblockUI();
            }
        });
        unblockUI();
    }
    else {
        $('table tr').removeClass('highlight');
    }
    $('tr').removeClass('highlight');
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
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetStockAuditConfigByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item[0].Code),
                $("#ddlCategory").val(item[0].CategoryMaster_Code),
                $("#txtPartLineCount").val(item[0].PartLineCount),
                $("#txtCycleCountDays").val(item[0].CycleCountDays),
                $("#txtValue").val(item[0].Value),
                $("#txtsave").prop("disabled", false)
            } else {
                toastr.error("Record not found...!");
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}
function ClearData() {
    $("#hfCode").val("0");
    $("#ddlCategory").val('1');
    $("#txtPartLineCount").val("");
    $("#txtCycleCountDays").val("");
    $("#txtValue").val("");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Stock Audit Config");
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
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetStockAuditConfigByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item[0].Code).prop("disabled", true),
                $("#ddlCategory").val(item[0].CategoryMaster_Code),
                $("#txtPartLineCount").val(item[0].PartLineCount),
                $("#txtCycleCountDays").val(item[0].CycleCountDays),
                $("#txtValue").val(item[0].Value),
                $("#txtsave").prop("disabled", true);
            } else {
                toastr.error("Record not found...!");
            }
            unblockUI();

        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}
function CategoryList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowCategoryMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const select = $('#ddlCategory');
                response.forEach(item => {
                    select.append(`<option value="${item.Code}">${item["Category Name"]}</option>`);
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
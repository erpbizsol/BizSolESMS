
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');

$(document).ready(function () {
    $('#ERPHeading').text('Bank Master');
    $('#txtBankName').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtAccountNo').focus();
        }
    });
    $('#txtAccountNo').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtIFSCCode').focus();
        }
    });
    $('#txtIFSCCode').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtBranch').focus();
        }
    });
    $('#txtBranch').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#ddlType').focus();
        }
    });
    $('#ddlType').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtDefaultCheck').focus();
        }
    });
    $('#txtDefaultCheck').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtbtnSave').focus();
        }
    });
    ShowBankMasterlist('Load');
    GetModuleMasterCode();
});

function convertToUppercase(el) {
    el.value = el.value.toUpperCase();
}

function OnlyNumeric(el) {
    el.value = el.value.replace(/[^0-9]/g, '');
}

function Save() {
    const BankName = $("#txtBankName").val().trim();
    const AccountNo = $("#txtAccountNo").val().trim();
    const IFSCCode = $("#txtIFSCCode").val().trim();
    const Branch = $("#txtBranch").val().trim();
    const Type = $("#ddlType").val();
    const DefaultCheck = $("#txtDefaultCheck").is(":checked") ? "Y" : "N";

    if (BankName === "") {
        toastr.error('Please enter a Bank Name.');
        $("#txtBankName").focus();
        return;
    }
    if (AccountNo === "") {
        toastr.error('Please enter an Account No.');
        $("#txtAccountNo").focus();
        return;
    }
    if (!/^\d+$/.test(AccountNo)) {
        toastr.error('Account No. must contain only numbers.');
        $("#txtAccountNo").focus();
        return;
    }
    if (IFSCCode === "") {
        toastr.error('Please enter an IFSC Code.');
        $("#txtIFSCCode").focus();
        return;
    }
    if (Branch === "") {
        toastr.error('Please enter a Branch.');
        $("#txtBranch").focus();
        return;
    }
    if (Type === "") {
        toastr.error('Please select a Type.');
        $("#ddlType").focus();
        return;
    }

    const payload = {
        code: $("#hftxtCode").val(),
        bankName: BankName,
        accountNo: AccountNo,
        ifscCode: IFSCCode,
        branch: Branch,
        type: Type,
        defaultCheck: DefaultCheck
    };
    $.ajax({
        url: `${appBaseURL}/api/Master/InsertBankMaster?UserMaster_Code=${UserMaster_Code}`,
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
                ShowBankMasterlist('Get');
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

function ShowBankMasterlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowBankMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtbanktable").show();
                const StringFilterColumn = ["Bank Name", "Account No", "IFSC Code", "Branch", "Type"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "CreatedOn": 'center'
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteBank('${item.Code}','${item[`Bank Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtbanktable").hide();
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

async function CreateBankMaster() {
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
    $("#txtbtnSave").prop("disabled", false);
    $("#txtheaderdiv").show();
    disableFields(false);
    $("#txtBankName").focus();
}

function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#txtbtnSave").prop("disabled", false);
    $("#txtheaderdiv").hide();
    disableFields(false);
}

async function deleteBank(code, bankName, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'bankmaster');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this bank ${bankName}?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteBankMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowBankMasterlist('Get');
                } else {
                    toastr.error(response.Msg || "Unexpected response format.");
                }
            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:");
            }
        });
    } else {
        $('tr').removeClass('highlight');
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
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowBankMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftxtCode").val(item.Code);
                    $("#txtBankName").val(item.BankName);
                    $("#txtAccountNo").val(item.AccountNo);
                    $("#txtIFSCCode").val(item.IFSCCode);
                    $("#txtBranch").val(item.Branch);
                    $("#ddlType").val(item.Type);
                    $("#txtDefaultCheck").prop("checked", item.DefaultCheck != 'N');
                    $("#txtbtnSave").prop("disabled", false);
                    disableFields(false);
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
    $("#txtBankName").val("");
    $("#txtAccountNo").val("");
    $("#txtIFSCCode").val("");
    $("#txtBranch").val("");
    $("#ddlType").val("");
    $("#txtDefaultCheck").prop("checked", false);
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Bank Master");
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
        url: `${appBaseURL}/api/Master/ShowBankMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftxtCode").val(item.Code).prop("disabled", true);
                    $("#txtBankName").val(item.BankName);
                    $("#txtAccountNo").val(item.AccountNo);
                    $("#txtIFSCCode").val(item.IFSCCode);
                    $("#txtBranch").val(item.Branch);
                    $("#ddlType").val(item.Type);
                    $("#txtDefaultCheck").prop("checked", item.DefaultCheck != 'N');
                    $("#txtbtnSave").prop("disabled", true);
                    disableFields(true);
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

function disableFields(disable) {
    $("#txtCreatepage,#txtbtnSave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}

function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowBankMaster`,
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
    XLSX.writeFile(wb, "BankMaster.xlsx");
}

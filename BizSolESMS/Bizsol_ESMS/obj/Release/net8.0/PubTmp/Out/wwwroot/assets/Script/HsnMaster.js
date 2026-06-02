
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
function normalizeHsnGridRow(item) {
    var hsn = String(item.HSNCode ?? item["HSN Code"] ?? '').trim();
    var gst = item.GSTRate ?? item["GST Rate"];
    if (gst === null || gst === undefined || gst === '') gst = 0;
    return {
        Code: item.Code,
        "HSN Code": hsn,
        "GST Rate": typeof gst === 'number' ? gst : parseFloat(String(gst).replace(/,/g, '')) || 0,
        CreatedOn: item.CreatedOn,
        ModifiedOn: item.ModifiedOn
    };
}
$(document).ready(function () {
    $("#ERPHeading").text("HSN Master");
    $('#txtHSNCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtGSTRate").focus();
        }
    });
    $('#txtGSTRate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    ShowHsnMasterlist('Load');
    GetModuleMasterCode();
});
function ShowHsnMasterlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowHSNMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtHsnTable").show();
                const StringFilterColumn = ["HSN Code"];
                const NumericFilterColumn = ["GST Rate"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "GST Rate": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item,
                    Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1"  title="Delete" onclick="deleteItem('${item.Code}', '${(item["HSN Code"] || '').replace(/'/g, "\\'")}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1" title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtHsnTable").hide();
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
function parseGstRate(val) {
    if (val === null || val === undefined || String(val).trim() === '') return NaN;
    var n = parseFloat(String(val).replace(/,/g, '').trim());
    return isFinite(n) ? n : NaN;
}

function Save() {
    var hsnCode = $("#txtHSNCode").val().trim();
    var gstVal = parseGstRate($("#txtGSTRate").val());
    if (hsnCode === "") {
        toastr.error('Please enter HSN Code.');
        $("#txtHSNCode").focus();
    } else if (!isFinite(gstVal) || gstVal < 0 || gstVal > 999.99) {
        toastr.error('Please enter a valid GST Rate % (0–999.99).');
        $("#txtGSTRate").focus();
    }
    else {
        const payload = {
            Code: $("#hftxtCode").val(),
            HSNCode: hsnCode,
            GSTRate: gstVal,
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertHSNMaster?UserMaster_Code=${UserMaster_Code}`,
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
                        ShowHsnMasterlist('Get');
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
    $("#txtHSNCode").prop("disabled", false);
    $("#txtGSTRate").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
    disableFields(false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    $("#hftxtCode").prop("disabled", false);
    $("#txtHSNCode").prop("disabled", false);
    $("#txtGSTRate").prop("disabled", false);
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
        url: `${appBaseURL}/api/Master/ShowHSNMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
                        $("#hftxtCode").val(item.Code);
                        $("#txtHSNCode").val(item.HSNCode ?? item["HSN Code"] ?? '');
                        var g = item.GSTRate ?? item["GST Rate"];
                        $("#txtGSTRate").val(g === null || g === undefined ? '' : g);
                        $("#txtbtnSave").prop("disabled", false);
                    });
                } else {
                    toastr.error("Record not found...!");
                }

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
    $("#txtHSNCode").val("");
    $("#txtGSTRate").val("");
    $("#hftxtCode").val("0");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "HSN Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function deleteItem(code, hsnName, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");

    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (!hasPermission) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }

    const { Status, msg1 } = await CheckRelatedRecord(code, 'HSNMaster');
    if (Status) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }

    if (confirm(`Are you sure you want to delete this HSN ${hsnName}?`)) {

        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteHSNMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowHsnMasterlist('Get');
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
    $('tr').removeClass('highlight');
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
        url: `${appBaseURL}/api/Master/ShowHSNMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
                        $("#hftxtCode").val(item.Code).prop("disabled", true);
                        $("#txtHSNCode").val(item.HSNCode ?? item["HSN Code"] ?? '').prop("disabled", true);
                        var g = item.GSTRate ?? item["GST Rate"];
                        $("#txtGSTRate").val(g === null || g === undefined ? '' : g).prop("disabled", true);
                        $("#txtbtnSave").prop("disabled", true);
                        disableFields(true);
                    });
                } else {
                    toastr.error("Record not found...!");
                }

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
        url: `${appBaseURL}/api/Master/ShowHSNMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const normalized = response.map(normalizeHsnGridRow);
                Export(normalized);
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
    XLSX.writeFile(wb, "HSNMaster.xlsx");
}

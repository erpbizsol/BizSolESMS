
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
        $("#ERPHeading").text("UOM Master");
        $(".Number").keyup(function (e) {
            if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
        });
        $('#txtUOM').on('keydown', function (e) {
            if (e.key === "Enter") {
                $("#txtDigitAfterDecimal").focus();
            }
        });
        $('#txtDigitAfterDecimal').on('keydown', function (e) {
            if (e.key === "Enter") {
                $("#txtbtnSave").focus();
            }
        });
    ShowUomMasterlist();
    GetModuleMasterCode();
});
function ShowUomMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowUOM`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key',authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtUomTable").show();
                const StringFilterColumn = ["UOM Name"];
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
                    <button class="btn btn-danger icon-height mb-1"  title="Delete" onclick="deleteItem('${item.Code}', '${item[`UOM Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1" title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                
            } else {
                $("#txtUomTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Save() {
    var uomName = $("#txtUOM").val();
    var digitAfterDecimal = $("#txtDigitAfterDecimal").val();
    if ($("#txtUOM").val() == "") {
        toastr.error('Please enter a UOM Name.');
        $("#txtUOM").focus();
    } else if ($("#txtDigitAfterDecimal").val() == "" || isNaN($("#txtDigitAfterDecimal").val()) || parseInt($("#txtDigitAfterDecimal").val()) < 0) {
        toastr.error('Please enter a valid digit after decimal is 0.');
        $("#txtDigitAfterDecimal").focus();
    }
    else {
        var digitAfterDecimalValue = digitAfterDecimal === "" ? 0 : parseInt(digitAfterDecimal);
        const payload = {
            Code: $("#hftxtCode").val(),
            uomName: uomName,
            digitAfterDecimal: digitAfterDecimalValue,
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertUOMMaster?UserMaster_Code=${UserMaster_Code}`,
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
                        ShowUomMasterlist();
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
    $("#txtUOM").prop("disabled", false);
    $("#txtDigitAfterDecimal").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
    disableFields(false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    $("#hftxtCode").prop("disabled", false);
    $("#txtUOM").prop("disabled", false);
    $("#txtDigitAfterDecimal").prop("disabled", false);
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
        url: `${appBaseURL}/api/Master/ShowUOMMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                    if (response.length > 0) {
                        response.forEach(function (item) {
                            $("#hftxtCode").val(item.Code);
                            $("#txtUOM").val(item.UOMName);
                            $("#txtDigitAfterDecimal").val(item.DigitAfterDecimal);
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
    $("#txtUOM").val("");
    $("#txtDigitAfterDecimal").val("0");
    $("#hftxtCode").val("0");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "UOM Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function deleteItem(code, uomName, button) {
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

    if (confirm(`Are you sure you want to delete this Uom ${uomName}?`)) {
      
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteUOM?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowUomMasterlist();
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
        url: `${appBaseURL}/api/Master/ShowUOMMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
                        $("#hftxtCode").val(item.Code).prop("disabled", true);
                        $("#txtUOM").val(item.UOMName).prop("disabled", true);
                        $("#txtDigitAfterDecimal").val(item.DigitAfterDecimal).prop("disabled", true);
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
        url: `${appBaseURL}/api/Master/ShowUOM`,
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
    XLSX.writeFile(wb, "UOMMaster.xlsx");
}





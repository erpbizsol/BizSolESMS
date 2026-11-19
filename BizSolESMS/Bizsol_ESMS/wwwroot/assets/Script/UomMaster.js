
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let uomTallyList = [];
let uomTallyLoaded = false;
let uomTallyRequest = null;
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
                if (isTallyAppType()) {
                    var $ddl = $("#txtUOMTallyConfiguration");
                    if ($ddl.data("select2")) {
                        $ddl.select2("open");
                    } else {
                        $ddl.focus();
                    }
                } else {
                    $("#txtbtnSave").focus();
                }
            }
        });
        $('#txtUOMTallyConfiguration').on('change', function () {
            fillUomTallyDescription($(this).val());
        });
    waitForFixparameter(function () {
        applyUomTallyVisibility();
        if (isTallyAppType()) {
            loadUomTallyConfiguration();
        }
    });
    ShowUomMasterlist('Load');
    GetModuleMasterCode();
});
function getFixParamRow() {
    try {
        var parsed = JSON.parse(sessionStorage.getItem('Fixparameter'));
        if (!parsed) return null;
        return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
        return null;
    }
}
function getFixParamTransferTallyValue() {
    var row = getFixParamRow();
    if (!row) return '';
    var keys = ['IsTransferApplicableInTally', 'IsTransferAbplicableInTally'];
    for (var i = 0; i < keys.length; i++) {
        var camel = keys[i].charAt(0).toLowerCase() + keys[i].slice(1);
        var value = row[keys[i]] != null ? row[keys[i]] : row[camel];
        if (value != null && String(value).trim() !== '') return String(value).trim();
    }
    var matchedKey = Object.keys(row).find(function (key) {
        return /transfer/i.test(key) && /tally/i.test(key);
    });
    if (matchedKey && row[matchedKey] != null) return String(row[matchedKey]).trim();
    return '';
}
// Y => show Tally fields, N => hide
function isTallyAppType() {
    return getFixParamTransferTallyValue().toUpperCase() === 'Y';
}
// Fixparameter is loaded asynchronously by Menu.js; wait briefly for it.
function waitForFixparameter(done) {
    var tries = 0;
    (function check() {
        if (getFixParamRow() || tries >= 30) {
            if (typeof done === 'function') done();
            return;
        }
        tries++;
        setTimeout(check, 100);
    })();
}
function pickField(item, names) {
    if (!item) return '';
    var keys = Object.keys(item);
    for (var i = 0; i < names.length; i++) {
        if (item[names[i]] != null && item[names[i]] !== '') return item[names[i]];
        var found = keys.find(function (key) { return key.toLowerCase() === names[i].toLowerCase(); });
        if (found && item[found] != null && item[found] !== '') return item[found];
    }
    return '';
}
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function applyUomTallyVisibility() {
    if (isTallyAppType()) {
        $("#divUOMTallyConfiguration,#divUOMTallyDescription").show();
    } else {
        $("#divUOMTallyConfiguration,#divUOMTallyDescription").hide();
        clearUomTallySelection();
    }
}
function fillUomTallyDescription(code) {
    if (!code) {
        $("#txtUOMTallyDescription").val("");
        return;
    }
    var item = uomTallyList.find(function (row) {
        return String(pickField(row, ["Code", "code"])) === String(code);
    });
    $("#txtUOMTallyDescription").val(item ? pickField(item, ["Description", "description", "Desp"]) : "");
}
function bindUomTallyOptions() {
    var $ddl = $("#txtUOMTallyConfiguration");
    var option = '<option value="">Select</option>';
    uomTallyList.forEach(function (item) {
        var code = pickField(item, ["Code", "code"]);
        var uom = pickField(item, ["UOM", "UOMName", "uom", "uomName"]);
        option += '<option value="' + escapeHtml(code) + '">' + escapeHtml(uom) + '</option>';
    });
    if ($ddl.data("select2")) {
        $ddl.select2("destroy");
    }
    $ddl.html(option);
    $ddl.select2({
        width: '-webkit-fill-available'
    });
}
function setUomTallyValue(selectedCode, disabled) {
    var $ddl = $("#txtUOMTallyConfiguration");
    var code = (selectedCode != null && selectedCode !== '' && String(selectedCode) !== '0') ? String(selectedCode) : '';
    if (!$ddl.data("select2")) {
        $("#txtUOMTallyDescription").val("");
        return;
    }
    $ddl.prop("disabled", !!disabled);
    $ddl.val(code).trigger("change");
}
function clearUomTallySelection() {
    var $ddl = $("#txtUOMTallyConfiguration");
    if ($ddl.data("select2")) {
        $ddl.val("").trigger("change");
    } else {
        $ddl.val("");
        $("#txtUOMTallyDescription").val("");
    }
}
function getUomTallyCodeFromItem(item) {
    return pickField(item, ["F_UOMTallyConfiguration_Code", "f_UOMTallyConfiguration_Code", "UOMTallyConfiguration_Code", "UOMTallyConfigurationCode"]);
}
function resolveUomTallyCode(item) {
    var code = getUomTallyCodeFromItem(item);
    if (code) return String(code);
    var uomName = pickField(item, ["UOM", "uom"]);
    if (!uomName) return "";
    var match = uomTallyList.find(function (row) {
        return String(pickField(row, ["UOM", "uom"])).trim().toUpperCase() === String(uomName).trim().toUpperCase();
    });
    if (match) return String(pickField(match, ["Code", "code"]));
    var optionCode = "";
    $("#txtUOMTallyConfiguration option").each(function () {
        if (String($(this).text()).trim().toUpperCase() === String(uomName).trim().toUpperCase()) {
            optionCode = $(this).val();
            return false;
        }
    });
    return optionCode ? String(optionCode) : "";
}
function setUomTallyFromRecord(item, disabled) {
    var code = resolveUomTallyCode(item);
    var description = pickField(item, ["Description", "description", "Desp"]);
    setUomTallyValue(code, disabled);
    if (description) {
        $("#txtUOMTallyDescription").val(description);
    }
}
function loadUomTallyConfiguration(done) {
    if (!isTallyAppType()) {
        applyUomTallyVisibility();
        if (typeof done === 'function') done();
        return;
    }
    $("#divUOMTallyConfiguration,#divUOMTallyDescription").show();
    if (uomTallyLoaded) {
        if (typeof done === 'function') done();
        return;
    }
    if (uomTallyRequest) {
        uomTallyRequest.always(function () {
            if (typeof done === 'function') done();
        });
        return;
    }
    uomTallyRequest = $.ajax({
        url: `${appBaseURL}/api/Master/GetUOMTallyConfiguration`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        }
    });
    uomTallyRequest.done(function (response) {
        uomTallyList = Array.isArray(response) ? response : [];
        uomTallyLoaded = true;
        bindUomTallyOptions();
    });
    uomTallyRequest.fail(function (xhr, status, error) {
        console.error("Error:", error);
        uomTallyList = [];
        toastr.error("Failed to load UOM Tally Configuration.");
    });
    uomTallyRequest.always(function () {
        if (!uomTallyLoaded) {
            uomTallyRequest = null;
        }
        if (typeof done === 'function') done();
    });
}
function ShowUomMasterlist(Type) {
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
    var uomName = $("#txtUOM").val();
    var digitAfterDecimal = $("#txtDigitAfterDecimal").val();
    var tallyCode = 0;
    if (isTallyAppType()) {
        tallyCode = parseInt($("#txtUOMTallyConfiguration").val(), 10) || 0;
    }
    if ($("#txtUOM").val() == "") {
        toastr.error('Please enter a UOM Name.');
        $("#txtUOM").focus();
    } else if ($("#txtDigitAfterDecimal").val() == "" || isNaN($("#txtDigitAfterDecimal").val()) || parseInt($("#txtDigitAfterDecimal").val()) < 0) {
        toastr.error('Please enter a valid digit after decimal is 0.');
        $("#txtDigitAfterDecimal").focus();
    } else if (isTallyAppType() && tallyCode <= 0) {
        toastr.error('Please select UOM Tally Configuration.');
        if ($("#txtUOMTallyConfiguration").data("select2")) {
            $("#txtUOMTallyConfiguration").select2("open");
        } else {
            $("#txtUOMTallyConfiguration").focus();
        }
    }
    else {
        var digitAfterDecimalValue = digitAfterDecimal === "" ? 0 : parseInt(digitAfterDecimal);
        const payload = {
            Code: $("#hftxtCode").val(),
            uomName: uomName,
            digitAfterDecimal: digitAfterDecimalValue,
            F_UOMTallyConfiguration_Code: tallyCode,
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
                        ShowUomMasterlist('Get');
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
    loadUomTallyConfiguration(function () {
        setUomTallyValue("", false);
    });
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
    $("#txtUOM").prop("disabled", false);
    $("#txtDigitAfterDecimal").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
    disableFields(false);

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
                            loadUomTallyConfiguration(function () {
                                setUomTallyFromRecord(item, false);
                            });
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
    clearUomTallySelection();
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
        $('tr').removeClass('highlight');
        return;
    }

    const { Status, msg1 } = await CheckRelatedRecord(code, 'UomMaster');
    if (Status) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
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
                    ShowUomMasterlist('Get');
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
                        loadUomTallyConfiguration(function () {
                            setUomTallyFromRecord(item, true);
                        });
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
    $("#txtUOMTallyDescription").prop("readonly", true);
    var $ddl = $("#txtUOMTallyConfiguration");
    if ($ddl.data("select2")) {
        $ddl.prop("disabled", disable);
    }
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

function Report() {
    $.ajax({
        url: '/Home/Index1',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ ReportType: "PDF", newConnectionString: authKeyData }),
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data) {
            let blob = new Blob([data], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);

            // Open the PDF in a new Chrome tab
            window.open(url, '_blank');

        },
        error: function (xhr, status, error) {
            console.error('Error:', xhr.responseText);
        }
    });
}





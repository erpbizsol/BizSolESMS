var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const LOCATION_NAME_MAX = 50;

function updateDerivedLocationName() {
    const g = ($("#txtLocationGroup").val() || "").trim();
    const l = ($("#txtLocation").val() || "").trim();
    let name = "";
    if (l) {
        name = g ? `${g}/${l}` : l;
    }
    $("#txtLocationName").val(name.slice(0, LOCATION_NAME_MAX));
}

$(document).ready(function () {
    $("#ERPHeading").text("Location Master (Bin)");
    $("#txtLocationGroup, #txtLocation").on("input", updateDerivedLocationName);
    $('#txtLocationGroup, #txtLocation').on('keydown', function (e) {
        if (e.key === "Enter") {
            if (this.id === "txtLocationGroup") {
                $("#txtLocation").focus();
            } else {
                $("#txtsave").focus();
            }
        }
    });
    LocationList('Load');
    GetModuleMasterCode();
    GetWareHouseList();
    $("#txtLocationExcelFile").on("change", ImportLocationFile);
});
function autoSelectSingleWarehouse() {
    const $wh = $('#txtWarehouse');
    const options = $wh.find('option').filter(function () {
        return ($(this).val() || "").trim() !== "";
    });
    if (options.length === 1) {
        $wh.val(options.first().val()).trigger('change');
    }
}
function GetWareHouseList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetWareHouseDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                response.forEach(item => {
                    option += '<option value="' + item.Code + '">' + item.Name + '</option>';
                });
                $('#txtWarehouse')[0].innerHTML = option;
                $('#txtWarehouse').select2({
                    width: '-webkit-fill-available'
                });
                if (response.length === 1) {
                    $('#txtWarehouse').val(response[0].Code).trigger('change');
                }
            } else {
                $('#txtWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').empty();
        }
    });
}
function LocationList(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowLocationMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtlocationtable").show();
                const StringFilterColumn = ["Warehouse Name", "Location Group", "Location", "Location Name", "LocationGroup", "LocationName"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "WarehouseMaster_Code"];
                const ColumnAlignment = {
                    "CreatedOn": 'center',
                    "DigitAfterDecimal": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteLocation('${item.Code}','${item[`Location Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#txtlocationtable").hide();
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
        const Warehouse = $("#txtWarehouse").val();
        const LocationGroup = ($("#txtLocationGroup").val() || "").trim();
        updateDerivedLocationName();
        const Location = ($("#txtLocation").val() || "").trim();
        const LocationName = ($("#txtLocationName").val() || "").trim();
        if (!Warehouse) {
            toastr.error('Please select a Warehouse.');
            $("#txtWarehouse").focus();
        } else if (Location === "") {
            toastr.error('Please enter Location.');
            $("#txtLocation").focus();
        } else if (LocationName === "") {
            toastr.error('Location Name could not be built. Enter Location.');
            $("#txtLocation").focus();
        } else {
            const payload = {
                Code: $("#hftxtCode").val(),
                WarehouseMaster_Code: Warehouse,
                LocationGroup: LocationGroup,
                Location: Location,
                LocationName: LocationName
            };
            $.ajax({
                url: `${appBaseURL}/api/Master/InsertLocationMaster?UserMaster_Code=${UserMaster_Code}`,
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
                        LocationList('Get');
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
}
async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    autoSelectSingleWarehouse();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtLocationImportPage").hide();
    $("#LocationImportTable").hide();
    $("#txtheaderdiv2").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#hftxtCode").prop("disabled", false);
    disableFields(false);
    $("#txtsave").prop("disabled", false);
    updateDerivedLocationName();

}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtLocationImportPage").hide();
    $("#LocationImportTable").hide();
    $("#txtheaderdiv").hide();
    $("#txtheaderdiv2").hide();
    ClearData();
    $("#hftxtCode").prop("disabled", false);
    disableFields(false);
    $("#txtsave").prop("disabled", false);
}
async function deleteLocation(code, location, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'locationmaster');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this location ${location}?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteLocationMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    LocationList('Get');
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:");

            }
        });
    }
    else {
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
    $("#txtLocationImportPage").hide();
    $("#LocationImportTable").hide();
    $("#txtheaderdiv2").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowLocationMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
                        $("#hftxtCode").val(item.Code);
                        $("#txtWarehouse").val(item.WarehouseMaster_Code || item["WarehouseMaster_Code"] || "").trigger('change').prop("disabled", false);
                        $("#txtLocationGroup").val(item.LocationGroup != null ? item.LocationGroup : item["Location Group"] || "");
                        $("#txtLocation").val(item.Location != null ? item.Location : "");
                        $("#txtLocationName").val(item.LocationName != null ? item.LocationName : item["Location Name"] || "").prop("disabled", true);
                        $("#txtsave").prop("disabled", false);
                        disableFields(false);
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
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Location Master (Bin)");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function ClearData() {
    $("#hftxtCode").val("0");
    $("#txtLocationGroup, #txtLocation, #txtLocationName").val("");
    $("#txtWarehouse").val("").trigger('change');
}
async function View(code) {

    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("VIEW");
    $("#txtListpage").hide();
    $("#txtLocationImportPage").hide();
    $("#LocationImportTable").hide();
    $("#txtheaderdiv2").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowLocationMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
                        $("#hftxtCode").val(item.Code).prop("disabled", true);
                        $("#txtWarehouse").val(item.WarehouseMaster_Code || item["WarehouseMaster_Code"] || "").trigger('change').prop("disabled", true);
                        $("#txtLocationGroup").val(item.LocationGroup != null ? item.LocationGroup : item["Location Group"] || "").prop("disabled", true);
                        $("#txtLocation").val(item.Location != null ? item.Location : "").prop("disabled", true);
                        $("#txtLocationName").val(item.LocationName != null ? item.LocationName : item["Location Name"] || "").prop("disabled", true);
                        $("#txtsave").prop("disabled", true);
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
function disableFields(viewOnly) {
    if (viewOnly) {
        $("#txtWarehouse, #txtLocationGroup, #txtLocation, #txtLocationName").prop("disabled", true);
    } else {
        $("#txtWarehouse, #txtLocationGroup, #txtLocation").prop("disabled", false);
        $("#txtLocationName").prop("disabled", true);
    }
    if ($("#txtWarehouse").data('select2')) {
        $("#txtWarehouse").trigger('change.select2');
    }
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", viewOnly).css("pointer-events", viewOnly ? "none" : "auto");
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowLocationMaster`,
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
    XLSX.writeFile(wb, "LocationMaster.xlsx");
}

let LocationImportJsonData = [];

/* Template columns: Part # | Description | Qty | PG | Location
   After locImportCleanHeader: Part, Description, Qty, PG, Location ("Part #" → "Part") */
const LOCATION_IMPORT_REQUIRED_CLEAN = ["Part", "Description", "Qty", "PG", "Location"];
const LOCATION_IMPORT_HEADER_LABELS = {
    Part: "Part #",
    Description: "Description",
    Qty: "Qty",
    PG: "PG",
    Location: "Location"
};

function locImportCleanHeader(header) {
    return String(header == null ? "" : header).replace(/[^a-zA-Z0-9]/g, "").trim();
}
function convertLocationImportSheetToRows(data) {
    if (!Array.isArray(data) || data.length === 0) return [];
    const headers = data[0].map(h => locImportCleanHeader(h));
    return data.slice(1).map(row =>
        headers.reduce((obj, header, index) => {
            const raw = row[index];
            let value = raw !== undefined && raw !== null && raw !== "" ? String(raw).replace(/^"|"$/g, "").trim() : "";
            obj[header] = value;
            return obj;
        }, {})
    ).filter(row => Object.values(row).some(v => String(v).trim() !== ""));
}
function validateLocationImportExcelFormat(data) {
    if (!Array.isArray(data) || data.length < 1) {
        return { isValid: false, message: "The Excel file is empty." };
    }
    const headers = data[0].map(h => locImportCleanHeader(String(h == null ? "" : h)));
    const missing = LOCATION_IMPORT_REQUIRED_CLEAN.filter(req => !headers.includes(req));
    if (missing.length) {
        const labels = missing.map(k => LOCATION_IMPORT_HEADER_LABELS[k] || k);
        return { isValid: false, message: `Missing required columns: ${labels.join(", ")}` };
    }
    return { isValid: true, message: "" };
}
function DownloadLocationImportTemplate() {
    if (typeof XLSX === "undefined") {
        toastr.error("Excel library not loaded.");
        return;
    }
    const ws = XLSX.utils.aoa_to_sheet([
        ["Part #", "Description", "Qty", "PG", "Location"],
        ["269126204650", "SYNCHRO-CONE 1/2-3/4.(CARBON) BS3/4", "0", "PG4", "N-144 Q"],
        ["282933403115", "THRUST PAD BEARING STD", "3", "PG3", "N-131 C"],
        ["207746800160", "FUEL GAUGE 24V (BACKLIT)", "18", "PG2", "N-99 J"]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "LocationMaster_Import_Template.xlsx");
}
function enrichLocationImportRowForApi(row) {
    const r = row || {};
    return {
        Part: r.Part || "",
        PartNo: r.Part || "",
        Description: r.Description || "",
        Qty: r.Qty || "",
        PG: r.PG || "",
        LocationGroup: r.PG || "",
        Location: r.Location || ""
    };
}
/** Same row tint as Item Master (ChangecolorTr): highlight import preview rows that need attention. */
const LOCATION_IMPORT_PREVIEW_HIGHLIGHT = "#f5c0bf";
function applyLocationImportPreviewRowHighlight() {
    const tbody = document.getElementById("table-body-location-import");
    if (!tbody || !tbody.querySelector("tr")) return;
    const table = tbody.closest("table");
    const headerRow = table && table.querySelector("#table-header-location-import tr");
    if (!headerRow) return;
    const headers = Array.from(headerRow.querySelectorAll("th")).map((th) => {
        const heading = th.querySelector(".filter-table-heading");
        const raw = heading ? heading.textContent : th.textContent;
        return String(raw || "").trim();
    });
    const ixLoc = headers.indexOf("IsExistsLocation");
    const ixItem = headers.indexOf("IsExistsItem");
    const ixChg = headers.indexOf("IsChangeLocation");
    if (ixLoc < 0 || ixItem < 0 || ixChg < 0) return;
    const norm = (v) => String(v == null ? "" : v).trim().toUpperCase();
    tbody.querySelectorAll("tr").forEach((row) => {
        const tds = row.querySelectorAll("td");
        if (norm(tds[ixLoc]?.textContent) === "N" || norm(tds[ixItem]?.textContent) === "N" || norm(tds[ixChg]?.textContent) === "Y") {
            row.style.backgroundColor = LOCATION_IMPORT_PREVIEW_HIGHLIGHT;
        } else {
            row.style.backgroundColor = "";
        }
    });
}
function createLocationImportPreviewTable(response) {
    if (!response || !response.length) {
        $("#LocationImportTable").hide();
        toastr.error("No data to preview.");
        return;
    }
    $("#LocationImportTable").show();
    const StringFilterColumn = ["ItemCode","ItemName","LocationGroup","Location","LocationName","IsExistsLocation","IsExistsItem","IsChangeLocation"];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ["UserMaster_Code","LocationMaster_Code","ItemMaster_Code","LocationNameNorm"];
    const ColumnAlignment = {};
    BizsolCustomFilterGrid.CreateDataTable(
        "table-header-location-import",
        "table-body-location-import",
        response,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );
}
function locationImportOptionPayload() {
    return {
        InsertNewItem: $("#chkInsertNewItem").prop("checked") ? "Y" : "N",
        InsertNewLocation: $("#chkInsertNewLocation").prop("checked") ? "Y" : "N"
    };
}

function GetLocationImportForTemp() {
    if (!LocationImportJsonData.length) {
        toastr.error("Please choose an Excel file.");
        $("#txtLocationExcelFile").focus();
        return;
    }
    const requestData = Object.assign({
        JsonData: LocationImportJsonData.map(enrichLocationImportRowForApi),
        UserMaster_Code: UserMaster_Code
    }, locationImportOptionPayload());
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/ImportLocationMasterForTemp`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            unblockUI();
            if (Array.isArray(response) && response.length > 0) {
                createLocationImportPreviewTable(response);
            } else if (response && response.Status === "N" && response.Msg) {
                toastr.error(response.Msg);
                $("#LocationImportTable").hide();
            } else if (Array.isArray(response)) {
                toastr.warning("No rows returned from import validation.");
                $("#LocationImportTable").hide();
            } else if (response && response.Msg) {
                toastr.error(response.Msg);
                $("#LocationImportTable").hide();
            } else {
                toastr.error("Import preview failed.");
                $("#LocationImportTable").hide();
            }
        },
        error: function (xhr) {
            unblockUI();
            console.error("ImportLocationMasterForTemp:", xhr.responseText);
            toastr.error("An error occurred while validating the import file.");
        }
    });
}
function SaveLocationImportFile() {
    if (!LocationImportJsonData.length) {
        toastr.error("Please choose an Excel file.");
        $("#txtLocationExcelFile").focus();
        return;
    }
    const requestData = Object.assign({
        JsonData: LocationImportJsonData.map(enrichLocationImportRowForApi),
        UserMaster_Code: UserMaster_Code
    }, locationImportOptionPayload());
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/ImportLocationMaster`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            unblockUI();
            if (response && response.Status === "Y") {
                toastr.success(response.Msg || "Import saved.");
                LocationList("Get");
                BackLocationImport();
            } else if (response && response.Status === "N") {
                toastr.error(response.Msg || "Import failed.");
            } else if (response && response.Msg) {
                toastr.error(response.Msg);
            } else {
                toastr.error("Import failed.");
            }
        },
        error: function (xhr) {
            unblockUI();
            console.error("ImportLocationMaster:", xhr.responseText);
            toastr.error("An error occurred while saving the import.");
        }
    });
}

async function ImportLocationExcel() {
    const { hasPermission, msg } = await CheckOptionPermission("New", UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission === false) {
        toastr.error(msg);
        return;
    }
    $("#txtListpage").hide();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    $("#txtLocationImportPage").show();
    $("#txtheaderdiv2").show();
    $("#LocationImportTable").hide();
}
function BackLocationImport() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtLocationImportPage").hide();
    $("#LocationImportTable").hide();
    $("#txtheaderdiv").hide();
    $("#txtheaderdiv2").hide();
    ClearLocationImportData();
    LocationList("Load");
}
function ClearLocationImportData() {
    LocationImportJsonData = [];
    $("#txtLocationExcelFile").val("");
    $("#chkInsertNewItem").prop("checked", true);
    $("#chkInsertNewLocation").prop("checked", true);
}
function ImportLocationFile(event) {
    LocationImportJsonData = [];
    const file = event.target.files[0];
    if (!file) {
        $("#LocationImportTable").hide();
        return;
    }
    const allowedExtensions = ["xlsx", "xls", "csv"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload .xlsx, .xls, or .csv.");
        event.target.value = "";
        $("#LocationImportTable").hide();
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            if (fileExtension === "csv") {
                const text = e.target.result;
                const rows = text.split(/\r?\n/).filter(r => r.trim() !== "");
                if (!rows.length) {
                    alert("The file is empty.");
                    event.target.value = "";
                    $("#LocationImportTable").hide();
                    return;
                }
                const matrix = rows.map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, "").trim()));
                const validation = validateLocationImportExcelFormat(matrix);
                if (!validation.isValid) {
                    alert(`Invalid file: ${validation.message}`);
                    event.target.value = "";
                    $("#LocationImportTable").hide();
                    return;
                }
                LocationImportJsonData = convertLocationImportSheetToRows(matrix);
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                if (!workbook.SheetNames.length) {
                    alert("Invalid Excel file: No sheets found.");
                    event.target.value = "";
                    $("#LocationImportTable").hide();
                    return;
                }
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, cellDates: true });
                const validation = validateLocationImportExcelFormat(matrix);
                if (!validation.isValid) {
                    alert(`Invalid Excel format: ${validation.message}`);
                    event.target.value = "";
                    $("#LocationImportTable").hide();
                    return;
                }
                LocationImportJsonData = convertLocationImportSheetToRows(matrix);
            }
            GetLocationImportForTemp();
        } catch (err) {
            console.error(err);
            alert("Error reading the file. Ensure it is a valid format.");
            event.target.value = "";
            $("#LocationImportTable").hide();
            LocationImportJsonData = [];
        }
    };

    if (fileExtension === "csv") {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

setInterval(applyLocationImportPreviewRowHighlight, 100);
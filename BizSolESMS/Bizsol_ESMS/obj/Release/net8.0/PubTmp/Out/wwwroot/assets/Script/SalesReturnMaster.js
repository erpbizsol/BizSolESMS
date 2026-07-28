var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let JsonData = [];
let AccountList = [];
let ItemDetail = [];
$(document).ready(function () {

    $("#ERPHeading").text("Sales Return");
    GetAccountMasterList();
    GetWareHouseList();
    GetReasonMasterList();
    ShowSalesReturnMasterlist('Load');
    GetModuleMasterCode();
    $('#txtOrderNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtClientName").focus();
        }
    });

    $('#txtClientName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReason").focus();
        }
    });
    $('#txtReason').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtImportWarehouse").focus();
        }
    });
    $('#txtImportWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtExcelFile").focus();
        }
    });
    $('#txtExcelFile').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtImportWarehouse").focus();
        }
    });
    $("#txtClientName").on("change", function () {
        $("#txtExcelFile").val("")
        JsonData = [];
    });
    $("#txtExcelFile").on("change", function (e) {
        Import(e);
    });
    $("#txtReason").on("change", function () {
        $("#txtExcelFile").val("");
        JsonData = [];
    });
    $("#txtImportWarehouse").on("change", function () {
        $("#txtExcelFile").val("");
        JsonData = [];
    });
    $('#txtScanProduct').on('input', function (e) {
        SaveScanValidationDetail();
    });
    $('#txtScanProduct').on('focus', function () {
        const inputElement = this;
        const isManual = $("#txtIsManual").is(':checked');
        setTimeout(function () {
            inputElement.setAttribute('inputmode', isManual ? '' : 'none');
        }, 2);
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
});
function SrEscHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function SrStatusBadge(status) {
    var raw = String(status == null ? '' : status).trim();
    var key = raw.toLowerCase();
    var cls = 'od-status-badge--default';
    var icon = 'fa-circle-info';

    if (key === 'pending scaning' || key === 'pending scanning' || key === 'pending') {
        cls = 'od-status-badge--scanning';
        icon = 'fa-barcode';
    } else if (key === 'invoice pending' || key === 'in progress' || key === 'partial') {
        cls = 'od-status-badge--invoice-pending';
        icon = 'fa-clock';
    } else if (key === 'invoice generated' || key === 'completed' || key === 'complete') {
        cls = 'od-status-badge--invoice-generated';
        icon = 'fa-circle-check';
    }

    if (!raw) return "<span class='od-status-badge od-status-badge--default'>—</span>";
    return "<span class='od-status-badge " + cls + "'><i class='fa-solid " + icon + "'></i>" + SrEscHtml(raw) + "</span>";
}

function ShowSalesReturnMasterlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowSalesReturnMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtordertable").show();
                const StringFilterColumn = ["Client Name","Order No","Status"];
                const NumericFilterColumn = ["Return Item Qty"];
                const DateFilterColumn = ["Return Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Reason"];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Return Item Qty":"right"
                };
                const updatedResponse = response.map(item => {
                    const statusRaw = item.Status != null ? item.Status : '';
                    const isCompleted = String(statusRaw).trim().toLowerCase() === 'completed';
                    const actionBtn = isCompleted
                        ? `<button class="btn btn-primary icon-height mb-1" title="View" onclick="ViewSalesValidation('${item.Code}')"><i class="fa fa-eye"></i></button>`
                        : `<button class="btn btn-success icon-height mb-1" title="sales return validation" onclick="StartSalesValidation('${item.Code}')"><i class="fa fa-hourglass-start"></i></button>`;
                    return { ...item, Status: SrStatusBadge(statusRaw), Action: actionBtn };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtordertable").hide();
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
function GetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsClientDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                AccountList = response;
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val.Code + '">' + val["AccountName"] + '</option>';
                });

                $('#txtClientName')[0].innerHTML = option;

                $('#txtClientName').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtClientName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtClientName').empty();
        }
    });
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
                $('#txtImportWarehouse')[0].innerHTML = option;
                $('#txtImportWarehouse').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtImportWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtImportWarehouse').empty();
        }
    });
}
function GetReasonMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetReasonMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                AccountList = response;
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {
                    option += '<option value="' + val.Code + '">' + val["Desp"] + '</option>';
                });

                $('#txtReason')[0].innerHTML = option;

                $('#txtReason').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtReason').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtReason').empty();
        }
    });
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Sales Return");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function normalizeHeaderKey(header) {
    return String(header == null ? '' : header).replace(/[^a-zA-Z0-9]/g, '').trim();
}

var SALES_RETURN_EXCEL_RULES = [
    {
        canonical: 'PartDescription',
        label: 'Part Description',
        matches: function (raw, norm) {
            if (/^(partdescription|description|itemdescription|itemname|partdesc)$/i.test(norm)) return true;
            return /description|desc/i.test(raw);
        }
    },
    {
        canonical: 'Part',
        label: 'Part#',
        matches: function (raw, norm) {
            if (/^(part|parts|partno|partsno|partsnumber|partsnum|partnumber|partcode|itemcode)$/i.test(norm)) return true;
            if (/parts?\s*no|part\s*no|part\s*#/i.test(raw)) return true;
            return /part/i.test(raw) && !/description|desc/i.test(raw);
        }
    },
    {
        canonical: 'InvoiceQuantity',
        label: 'Qty',
        matches: function (raw, norm) {
            if (/^(invoicequantity|invoiceqty|orderqty|orderedqty|qty|quantity|returnqty)$/i.test(norm)) return true;
            return /invoiceqty|orderqty|orderedqty/i.test(norm) || /^qty$/i.test(norm) || /^quantity$/i.test(norm);
        }
    }
];
function resolveSalesReturnExcelColumns(headerRow) {
    var headers = (headerRow || []).map(function (h) { return String(h == null ? '' : h).trim(); });
    var normalized = headers.map(normalizeHeaderKey);
    var mapping = {};
    var used = {};

    SALES_RETURN_EXCEL_RULES.forEach(function (rule) {
        for (var i = 0; i < headers.length; i++) {
            if (used[i]) continue;
            if (rule.matches(headers[i], normalized[i])) {
                mapping[rule.canonical] = i;
                used[i] = true;
                break;
            }
        }
    });

    return { headers: headers, mapping: mapping };
}
function getMissingSalesReturnColumns(mapping) {
    return SALES_RETURN_EXCEL_RULES
        .filter(function (rule) { return mapping[rule.canonical] == null; })
        .map(function (rule) { return rule.label; });
}
function findSalesReturnHeaderRowIndex(data, maxScan) {
    var limit = Math.min((data || []).length, maxScan || 30);
    for (var i = 0; i < limit; i++) {
        var row = data[i];
        if (!Array.isArray(row) || !row.length) continue;
        var resolved = resolveSalesReturnExcelColumns(row);
        if (getMissingSalesReturnColumns(resolved.mapping).length === 0) {
            return { index: i, columnMap: resolved.mapping };
        }
    }
    return { index: -1, columnMap: null };
}
function validateExcelFormat(data) {
    if (!data || data.length < 1) {
        return { isValid: false, message: 'The Excel file is empty.' };
    }
    var found = findSalesReturnHeaderRowIndex(data);
    if (found.index < 0) {
        return { isValid: false, message: 'Missing required columns: Part#, Part Description, Qty' };
    }

    return {
        isValid: true,
        message: 'Excel format is valid.',
        columnMap: found.columnMap,
        headerRowIndex: found.index
    };
}
function getExcelRowCellValue(row, idx) {
    if (idx == null || idx < 0 || row == null) return '';
    var raw;
    if (Array.isArray(row)) {
        raw = row[idx];
    } else if (typeof row === 'object') {
        raw = row[idx] != null ? row[idx] : row[String(idx)];
    }
    if (raw == null || raw === '') return '';
    if (typeof raw === 'number' && isFinite(raw)) {
        if (raw === Math.floor(raw)) {
            return cleanValue(String(Math.trunc(raw)));
        }
        return cleanValue(String(raw));
    }
    return cleanValue(String(raw));
}
function buildCanonicalSalesReturnRows(data, columnMap, headerRowIndex) {
    if (!Array.isArray(data) || !columnMap) return [];
    var startIdx = headerRowIndex == null ? 0 : headerRowIndex;
    if (data.length <= startIdx + 1) return [];

    return data.slice(startIdx + 1).map(function (row) {
        var obj = {};
        SALES_RETURN_EXCEL_RULES.forEach(function (rule) {
            var idx = columnMap[rule.canonical];
            obj[rule.canonical] = getExcelRowCellValue(row, idx);
        });
        return obj;
    }).filter(function (row) {
        return SALES_RETURN_EXCEL_RULES.some(function (rule) {
            return String(row[rule.canonical] || '').trim() !== '';
        });
    });
}
function remapParsedRowsToCanonical(rows) {
    if (!rows || !rows.length) {
        return { error: 'The file has no data rows.' };
    }

    var headerRow = Object.keys(rows[0] || {});
    var resolved = resolveSalesReturnExcelColumns(headerRow);
    var missingColumns = getMissingSalesReturnColumns(resolved.mapping);
    if (missingColumns.length > 0) {
        return { error: 'Missing required columns: ' + missingColumns.join(', ') };
    }

    var data = rows.map(function (row) {
        var obj = {};
        SALES_RETURN_EXCEL_RULES.forEach(function (rule) {
            var idx = resolved.mapping[rule.canonical];
            var key = headerRow[idx];
            var value = key != null && row[key] != null ? cleanValue(String(row[key])) : '';
            obj[rule.canonical] = value;
        });
        return obj;
    }).filter(function (row) {
        return SALES_RETURN_EXCEL_RULES.some(function (rule) {
            return String(row[rule.canonical] || '').trim() !== '';
        });
    });

    return { data: data };
}
function GetImportFile() {
    const OrderNo = $("#txtOrderNo").val();
    const ClientName = $("#txtClientName").val();
    const Reason = $("#txtReason").val();
    const ImportWarehouse = $("#txtImportWarehouse").val();
    if (OrderNo == '') {
        toastr.error(typeof window.esmsPleaseSelectLevelOfOrderMsg === 'function' ? window.esmsPleaseSelectLevelOfOrderMsg() : "Please select order no.!");
        $("#txtOrderNo").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    }  else if (ClientName == '') {
        toastr.error("Please select client name.!");
        $("#txtClientName").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    } else if (!Reason || Reason == '0') {
        toastr.error("Please select reason.!");
        $("#txtReason").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    } else if (!ImportWarehouse) {
        toastr.error("Please select a Warehouse !");
        $("#txtImportWarehouse").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        ReasonMaster_Code: Reason,
        ClientMaster_Code: ClientName,
        OrderNo: OrderNo,
        WarehouseMaster_Code: ImportWarehouse,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportSalesReturnForTemp`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                createTable(response)
            } else if (response.Status === "N") {
                toastr.error(response.Msg);
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
function SaveImportFile() {
    const OrderNo = $("#txtOrderNo").val();
    const ClientName = $("#txtClientName").val();
    const Reason = $("#txtReason").val();
    const ImportWarehouse = $("#txtImportWarehouse").val();
    if (OrderNo == '') {
        toastr.error(typeof window.esmsPleaseSelectLevelOfOrderMsg === 'function' ? window.esmsPleaseSelectLevelOfOrderMsg() : "Please select order no.!");
        $("#txtOrderNo").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    } else if (ClientName == '') {
        toastr.error("Please select client name.!");
        $("#txtClientName").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    } else if (!Reason || Reason == '0') {
        toastr.error("Please select reason.!");
        $("#txtReason").focus();
        $("#txtExcelFile").val("");
        JsonData = [];
        return;
    } else if (!ImportWarehouse) {
        toastr.error("Please select a Warehouse !");
        $("#txtImportWarehouse").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        ReasonMaster_Code: Reason,
        ClientMaster_Code: ClientName,
        OrderNo: OrderNo,
        WarehouseMaster_Code: ImportWarehouse,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportSalesReturn`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                toastr.success(response.Msg);
                ShowSalesReturnMasterlist('Get');
                BackMaster();
                BackImport();
            } else if (response.Status === "N") {
                toastr.error(response.Msg);
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
async function ImportExcel() {
    const { hasPermission, msg } = await CheckOptionPermission('Import', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#txtListpage").hide();
    $("#txtCreatepage").hide();
    $("#txtManualPage").hide();
    $("#txtheaderdivManual").hide();
    $("#txtImportPage").show();
    $("#txtheaderdiv2").show();
}
function BackImport() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtImportPage").hide();
    $("#ImportTable").hide();
    $("#txtheaderdiv2").hide();
    $("#txtManualPage").hide();
    $("#txtheaderdivManual").hide();
    $("#txtSalesValidate").hide();
    ClearDataImport();
}
function ClearDataImport() {
    SelectOptionByText('txtClientName', 'Select');
    SelectOptionByText('txtReason', 'Select');
    $("#txtImportWarehouse").val("").trigger('change');
    $("#txtOrderNo").val("");
    $("#txtExcelFile").val("");
    $("#Orderdata").empty();
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtheaderdiv").hide();
    $("#txtSalesValidate").hide();
    $("#SalesTable").hide();
    ClearData();
    SetSalesValidationViewMode(false);
}
function ClearData() {
    $('#txtSalesOrderNo').val("");
    $('#txtSalesClientName').val("");
    $('#txtScanProduct').val("");
    $('#txtScanProduct').attr('inputmode', '');
    $('#txtSalesReason').val("0");
    $("#txthfCode").val("0");
    $("#SalesTable-body").empty();
}
function SetSalesValidationViewMode(isView) {
    $("#txtScanProduct").prop("disabled", isView);
    $("#txtIsManual").prop("disabled", isView);
    if (isView) {
        $("#txtIsManual").prop("checked", false);
        $('#txtScanProduct').attr('inputmode', '');
    }
}
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertDateFormat2(dateString) {
    const [month, day, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-20${year}`;
}
function Import(event) {
    JsonData = [];
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        $("#ImportTable").hide();
        JsonData = [];
        return;
    }

    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload an Excel or CSV file (.xlsx, .xls, .csv).");
        event.target.value = '';
        $("#ImportTable").hide();
        JsonData = [];
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            if (fileExtension === 'csv') {
                var parsedRows = parseCSV(e.target.result);
                var csvMapped = remapParsedRowsToCanonical(parsedRows);
                if (csvMapped.error) {
                    alert('Invalid file. ' + csvMapped.error);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                JsonData = csvMapped.data;
                if (!JsonData.length) {
                    alert('Invalid file. No data rows found.');
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                GetImportFile();
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                if (workbook.SheetNames.length === 0) {
                    alert("Invalid Excel file: No sheets found.");
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, cellDates: true, defval: '' });

                const validationResult = validateExcelFormat(jsonData);
                if (!validationResult.isValid) {
                    alert(`Invalid Excel format: ${validationResult.message}`);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                JsonData = buildCanonicalSalesReturnRows(jsonData, validationResult.columnMap, validationResult.headerRowIndex);
                if (!JsonData.length) {
                    alert('Invalid Excel format: No data rows found.');
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                GetImportFile();
            }


        } catch (error) {
            alert("Error reading the file. Ensure it is a valid format.");
            event.target.value = '';
            $("#ImportTable").hide();
            JsonData = [];
        }
    };

    if (fileExtension === 'csv') {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}
function parseCSV(csvData) {
    const rows = csvData.split(/\r?\n/).filter(row => row.trim() !== ""); // Ignore empty rows
    if (rows.length === 0) return [];

    const headers = rows[0].split(/\t/).map(header => normalizeHeaderKey(header));

    const data = rows.slice(1).map(row => {
        const values = row.split(/\t/).map(val => cleanValue(val));

        return headers.reduce((obj, header, index) => {
            let value = values[index] || "";
            if (header.toLowerCase().includes("date") && value) {
                value = value.split(/\s+/)[0];
                value = convertDateFormat1(value);
            }

            obj[header] = value;
            return obj;
        }, {});
    });

    return data;
}
function convertToKeyValuePairs(data) {
    if (!Array.isArray(data) || data.length === 0) return [];

    var found = findSalesReturnHeaderRowIndex(data);
    if (found.index < 0) {
        return [];
    }
    return buildCanonicalSalesReturnRows(data, found.columnMap, found.index);
}
function cleanHeader(header) {
    return normalizeHeaderKey(header);
}
function cleanValue(value) {
    return value.replace(/^"|"$/g, '').trim();
}
function createTable(response) {
    if (response.length > 0) {
        $("#ImportTable").show();
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {};

        BizsolCustomFilterGrid.CreateDataTable(
            "table-header1",
            "table-body1",
            response,
            Button,
            showButtons,
            StringFilterColumn,
            NumericFilterColumn,
            DateFilterColumn,
            StringdoubleFilterColumn,
            hiddenColumns,
            ColumnAlignment,
            true
        );
    } else {
        $("#ImportTable").hide();
        toastr.error("Record not found...!");
    }
}
function validateCSV(event, callback) {
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        callback(false);
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const csvData = e.target.result;
        const rows = csvData.split(/\r?\n/).filter(function (row) { return row.trim() !== ''; });
        if (rows.length === 0) {
            alert("Empty file.");
            callback(false);
            return;
        }

        const headers = rows[0].split(/\t|,/).map(function (h) { return h.trim(); });
        const missingHeaders = getMissingSalesReturnColumns(resolveSalesReturnExcelColumns(headers).mapping);

        if (missingHeaders.length === 0) {
            callback(true);
        } else {
            alert("Invalid file. Missing required headers: " + missingHeaders.join(", "));
            callback(false);
        }
    };

    reader.readAsText(file);
}
function disableFields(disabled) {
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", disabled).css("pointer-events", disabled ? "none" : "auto");
}
async function ViewSalesValidation(Code) {
    await StartSalesValidation(Code, 'VIEW');
}
async function StartSalesValidation(Code, mode = 'NEW') {
    const isView = String(mode || 'NEW').toUpperCase() === 'VIEW';
    const { hasPermission, msg } = await CheckOptionPermission(isView ? 'View' : 'New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text(isView ? "View" : "NEW");
    $("#txtListpage").hide();
    $("#txtSalesValidate").show();
    $("#txtheaderdiv").show();
    SetSalesValidationViewMode(isView);
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowSalesReturnMasterDetail?Code=${Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.length > 0) {
                    $("#SalesTable").show();
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "SalesReturnDetailMaster_Code", "Client Name", "Order No", "ReasonMaster_Code","ReasonDesp"];
                    } else {
                        hiddenColumns = ["Code", "ROWSTATUS", "SalesReturnDetailMaster_Code", "Client Name", "Order No", "ReasonMaster_Code","ReasonDesp"];
                    }
                    const ColumnAlignment = {
                        "Qty": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Recived Qty": "right;width:70px;",
                    };
                    $("#txtSalesOrderNo").val(response[0]["Order No"]);
                    $("#txthfCode").val(response[0]["Code"]);
                    $("#txtSalesClientName").val(response[0]["Client Name"]);
                    $("#txtSalesReason").val(response[0]["ReasonDesp"]);
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
                        renamedItem["Scan Qty"]= `
                        <input type="text" id="txtScanQty_${item.SalesReturnDetailMaster_Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                            renamedItem["Recived Qty"] = `
                        <input type="text" id="txtRecivedQty_${item.SalesReturnDetailMaster_Code}" value="${item["Recived Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Recived Qty..">`,
                            renamedItem["Reason"]= isView
                                ? `<select disabled value="${item.ReasonMaster_Code}" id="txtReason_${item.SalesReturnDetailMaster_Code}" class="txtReason box_border form-control form-control-sm"></select>`
                                : `<select onchange="UpdateReason(this);" value="${item.ReasonMaster_Code}" id="txtReason_${item.SalesReturnDetailMaster_Code}" class="txtReason box_border form-control form-control-sm"></select>`;
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("SalesTable-header", "SalesTable-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                    GetReasonMasterListForTable();

                } else {
                    $("#SalesTable").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#SalesTable").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#SalesTable").hide();
        }
    });
}
function OnChangeNumericTextBox(event, element) {
    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Float Numbers");
        element.reportValidity();
        return false;
    }
}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}
function checkValidateqty(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item.Qty)) {
        toastr.error("Invalid Received Qty!");
        $("#txtReceivedQty_" + Code).val(0);
        $("#txtManualQty_" + Code).focus();
        $(element).val(0);
    } else {
        $("#txtReceivedQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveManualValidationDetail(Code, scanQty, manualQty, total);
        }
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqty1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item.Qty)) {
        toastr.error("Invalid Received Qty!");
        $("#txtReceivedQty_" + Code).val(0);
        $(element).val(0);
    } else {
        $("#txtReceivedQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveManualValidationDetail(Code, scanQty, manualQty, total);
        }
    }
}
function SaveManualValidationDetail(Code, ScanQty, ManualQty, ReceivedQty) {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: Code,
        ScanNo: "",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        ReceivedQty: ReceivedQty,
        PickListNo: $("#txtPickListNo").val(),
        IsManual: $("#txtIsManual").is(":checked") ? 'Y' : 'N'
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/SaveManualBoxValidateDetail`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                BoxValidationDetail();
                G_IDFORTRCOLOR = 'GET';
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function SaveScanValidationDetail() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code: $("#txthfCode").val(),
        ScanNo: $("#txtScanProduct").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/SaveSalesReturnScanDetail`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status == 'Y') {
                $("#SuccessVoice")[0].play();
                StartSalesValidation($("#txthfCode").val());
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else if (response.Status == 'N') {
                showToast(response.Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else {
                showToast(response.Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").focus();
            $("#txtScanProduct").val("");
        }
    });

}
function showToast(Msg) {
    let toast = document.getElementById("toast");
    let overlay = document.getElementById("overlay");

    toast.innerText = Msg;
    overlay.style.display = "block";
    toast.style.display = "block";
    let alertSound = new Audio("https://www.fesliyanstudios.com/play-mp3/4387");
    alertSound.play().catch(error => console.log("Audio playback failed:", error));
    setTimeout(() => toast.style.opacity = "1", 10);
    let blinkInterval = setInterval(() => {
        toast.style.visibility = (toast.style.visibility === "hidden") ? "visible" : "hidden";
    }, 300);
    setTimeout(() => {
        clearInterval(blinkInterval);
        toast.style.visibility = "visible";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    }, 3000);
}
function GetReasonMasterListForTable() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetReasonMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (reasonList) {
            if (reasonList.length > 0) {
                document.querySelectorAll('.txtReason').forEach(select => {
                    const selectedValue = select.getAttribute('value');  // Get ReasonMaster_Code from the select tag
                    select.innerHTML = '';

                    reasonList.forEach(reason => {
                        const option = document.createElement('option');
                        option.value = reason.Code;
                        option.textContent = reason.Desp;
                        select.appendChild(option);
                    });
                    if (selectedValue) {
                        select.value = selectedValue;
                    }
                });
            }
        },
        error: function (xhr, status, error) {
            console.error("Error loading reason list:", error);
            document.querySelectorAll('.txtReason').forEach(select => {
                select.innerHTML = '';
            });
        }
    });
}
function UpdateReason(element) {
    var str = element.id;
    let parts = str.split("_");
    var Code = parts[1];
    var ReasonMaster_Code = element.value;
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateReasonMaster_CodeInSaleReturn?Code=${Code}&ReasonMaster_Code=${ReasonMaster_Code}`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status == 'Y') {
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#SalesTable-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[13]?.textContent.trim();
        if (columnValue === 'GREEN') {
            row.style.backgroundColor = '#07bb72';
            
        } else if (columnValue === 'YELLOW') {
            row.style.backgroundColor = '#ebb861';
        } else {
            row.style.backgroundColor = '#f5c0bf';

        }
    });
}

setInterval(ChangecolorTr, 100);
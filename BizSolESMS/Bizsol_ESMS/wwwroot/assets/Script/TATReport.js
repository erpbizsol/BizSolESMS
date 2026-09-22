var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let JsonData = [];
let G_IsCheck = 'N';
let G_originalData = [];

const TAT_IMPORT_TEMPLATE_HEADERS = [
    'INVOICE NO', 'ORDER DATE', 'RETAILER CODE', 'SALES ORDER NO', 'PARTY NAME',
    'INVOICE VALUE', 'ORDER TYPE', 'INVOICE DATE'
];

const TAT_IMPORT_HEADER_MAP = {
    INVOICE: 'invoice',
    INVOICENO: 'invoice',
    ORDERDATE: 'orderDate',
    CODE: 'code',
    RETAILERCODE: 'code',
    ORDER: 'order',
    ORDERNO: 'order',
    SALESORDERNO: 'order',
    ACCOUNTNAME: 'accountName',
    PARTYNAME: 'accountName',
    INVOICEVALUE: 'invoiceRoundOffAmount',
    INVOICEROUNDOFFAMOUNT: 'invoiceRoundOffAmount',
    B2BORDERTYPE: 'b2BOrderType',
    ORDERTYPE: 'b2BOrderType',
    INVOICEDATE: 'invoiceDate',
    INVOCEDATE: 'invoiceDate'
};

const TAT_IMPORT_REQUIRED_JSON_KEYS = [
    'invoice', 'orderDate', 'code', 'order', 'accountName',
    'invoiceRoundOffAmount', 'b2BOrderType', 'invoiceDate'
];

const TAT_IMPORT_JSON_KEY_LABELS = {
    invoice: 'INVOICE NO',
    orderDate: 'ORDER DATE',
    code: 'RETAILER CODE',
    order: 'SALES ORDER NO',
    accountName: 'PARTY NAME',
    invoiceRoundOffAmount: 'INVOICE VALUE',
    b2BOrderType: 'ORDER TYPE',
    invoiceDate: 'INVOICE DATE'
};

function getTATImportColumnLabel(jsonKey) {
    return TAT_IMPORT_JSON_KEY_LABELS[jsonKey] || jsonKey;
}
$(document).ready(function () {
    GetCurrentDate();
    $("#ERPHeading").text("TAT Report");
    GetModuleMasterCode();
    $("#txtExcelFile").on("change", function (e) {
        Import(e);
    });
    MonthAndYearDropDown();
    $("#ddlMonth").on("change", function (e) {
        var Month = $(this).val();
        GetTATReportList('Get', Month, $("#ddlYear").val());
    });
    $("#ddlYear").on("change", function (e) {
        var Year = $(this).val();
        GetTATReportList('Get', $("#ddlMonth").val(), Year);
    });
    $("#txtSearch").on("input", function () {
        let updatedResponse = [];
        let filteredData = [];
        const searchValue = $(this).val().toLowerCase().trim();
        filteredData = G_originalData.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
        );
        let StringFilterColumn = ["INVOICE NO", "RETAILER CODE", "PARTY NAME", "SALES ORDER NO", "INVOICE VALUE", "ORDER TYPE", "PD NAME"];
        let NumericFilterColumn = [];
        let DateFilterColumn = ["INVOICE DATE", "ORDER DATE"];
        let Button = false;
        let showButtons = [];
        let StringdoubleFilterColumn = [];
        let hiddenColumns = ["Code"];
        let ColumnAlignment = {
            "Reorder Level": 'right',
            "Reorder Qty": 'right',
            "REMARK": 'left;width:100px;',
        };
        if (filteredData.length > 0) {
           
            updatedResponse = filteredData.map(item => {
                const isDisabled = item["DISPATCH DATE"] === '' ? 'disabled' : '';

                return {
                    ...item,
                    "DISPATCH DATE": `<input type="date" class="box_border form-control form-control-sm" value="${item["DISPATCH DATE"]}" id="txtDispatchDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                    POD: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.POD}" id="txtPODDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                    REDISPATCH: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REDISPATCH}" id="txtRedispatch_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                    "VEHICLE NO": `<input type="text" maxlength="10" class="box_border form-control form-control-sm" ${isDisabled} value="${item["VEHICLE NO"]}" id="txtVehicleNo_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`,
                    REMARK: `<input type="text" maxlength="100" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REMARK}" id="txtRemark_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`
                };
            });
        }
        if (filteredData.length === 0) {
            $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
            return;
        }
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
    });
});
function GetTATReportList(Type, Month,Year) {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?Month=${Month}&Year=${Year}&Type=GET`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                G_originalData = response;
                unblockUI();
                $("#txtTATTable").show();
                const StringFilterColumn = ["INVOICE NO","RETAILER CODE","PARTY NAME","SALES ORDER NO","INVOICE VALUE","ORDER TYPE","PD NAME"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["INVOICE DATE", "ORDER DATE"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "INVOICE VALUE": 'right',
                    "TAT ORDER TO INVOICE (DAY)": 'right',
                    "TAT ORDER TO PACKED (DAY)": 'right',
                    "TAT INVOICE TO DISPATCH": 'right',
                    "TOTAL BOXES": 'right',
                    "TAT ORDER RECEIVED TO DISPATCH": 'right',
                    "Reorder Qty": 'right',
                    "REMARK": 'left;width:100px;',
                };
                const updatedResponse = response.map(item => {
                    const isDisabled = item["DISPATCH DATE"] === '' ? 'disabled' : '';

                    return {
                        ...item,
                        "DISPATCH DATE": `<input type="date" class="box_border form-control form-control-sm" value="${item["DISPATCH DATE"]}" id="txtDispatchDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        POD: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.POD}" id="txtPODDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        REDISPATCH: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REDISPATCH}" id="txtRedispatch_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        "VEHICLE NO": `<input type="text" maxlength="10" class="box_border form-control form-control-sm" ${isDisabled} value="${item["VEHICLE NO"]}" id="txtVehicleNo_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`,
                        REMARK: `<input type="text" maxlength="100" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REMARK}" id="txtRemark_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`
                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                unblockUI();
                $("#txtTATTable").hide();
                if (Type != 'Load') {
                    toastr.error("Record not found...!");
                }
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", error);
        }
    });

}
async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListPage").hide();
    $("#txtCreatePage").show();
    $("#txtheaderdiv").show();
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "TAT Report");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function ClearData() {
    $("#txtExcelFile").val("");
    GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
}
function GetImportFile() {
    if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        UserMaster_Code: UserMaster_Code
    };
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportTATReportForTemp`,
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
            unblockUI();
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function SaveImportFile() {
    var TATDate = convertDateFormat($("#txtTATDate").val());
    if (TATDate == '' || TATDate == undefined) {
        toastr.error("Please select date !");
        $("#txtTATDate").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        Date: TATDate,
        IsCheck: G_IsCheck,
        JsonData: JsonData,
        UserMaster_Code: UserMaster_Code
    };
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportTATReport`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                G_IsCheck = 'N';
                toastr.success(response.Msg);
                BackImport();
                GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
            } else if (response.Status === "N") {
                if (confirm(`${response.Msg} Do you want to replace.!`)) {
                    G_IsCheck = 'Y';
                    SaveImportFile();
                }
            } else {
                toastr.error(response.Msg);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            unblockUI();
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
    $("#txtListPage").hide();
    $("#txtCreatePage").hide();
    $("#txtImportPage").show();
    $("#txtheaderdiv2").show();
}
function BackImport() {
    $("#txtListPage").show();
    $("#txtCreatePage").hide();
    $("#txtImportPage").hide();
    $("#ImportTable").hide();
    $("#txtheaderdiv2").hide();
    ClearData();
    JsonData = [];
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
function convertDateFormat3(dateString) {
    const [year, month,day] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertDateFormat4(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
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
                const csvText = e.target.result;
                const csvRows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');
                if (csvRows.length === 0) {
                    alert('Empty file.');
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                const delimiter = csvRows[0].indexOf('\t') >= 0 ? '\t' : ',';
                const matrix = csvRows.map(row => row.split(delimiter));
                const validationResult = validateExcelFormat(matrix);
                if (!validationResult.isValid) {
                    alert(`Invalid file format: ${validationResult.message}`);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                JsonData = mapTATImportRows(matrix);
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
                jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, cellDates: true });

                JsonData = mapTATImportRows(jsonData);
                const validationResult = validateExcelFormat(jsonData);
                if (!validationResult.isValid) {
                    alert(`Invalid Excel format: ${validationResult.message}`);
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
function normalizeTATImportHeader(header) {
    return String(header || '')
        .replace(/\u00A0/g, ' ')
        .trim()
        .replace(/[\s.#_\-]+/g, '')
        .toUpperCase();
}

function formatTATImportDate(value) {
    if (value === undefined || value === null || value === '') return '';
    if (value instanceof Date && !isNaN(value.getTime())) {
        const day = String(value.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${monthNames[value.getMonth()]}-${value.getFullYear()}`;
    }

    let s = String(value).trim();
    if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(s)) {
        const p = s.split('-');
        return `${p[0].padStart(2, '0')}-${p[1].charAt(0).toUpperCase()}${p[1].slice(1).toLowerCase()}-${p[2]}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return convertDateFormat3(s.slice(0, 10));
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
        const parts = s.split('/');
        if (parts[2] && parts[2].length === 2) {
            return convertDateFormat2(s);
        }
        return convertDateFormat1(s);
    }
    return s;
}

function cleanValue(value) {
    return String(value == null ? '' : value).replace(/^"|"$/g, '').trim();
}

function mapTATImportRows(data) {
    if (!Array.isArray(data) || data.length < 2) return [];

    const headers = data[0];
    return data.slice(1)
        .filter(row => row && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
        .map(row => {
            const item = {};
            headers.forEach((header, index) => {
                const jsonKey = TAT_IMPORT_HEADER_MAP[normalizeTATImportHeader(header)];
                if (!jsonKey) return;

                let value = row[index] !== undefined && row[index] !== null ? cleanValue(row[index]) : '';
                if (jsonKey.toLowerCase().includes('date') && value) {
                    value = formatTATImportDate(value);
                }
                item[jsonKey] = value;
            });
            return item;
        })
        .filter(row => TAT_IMPORT_REQUIRED_JSON_KEYS.some(key => row[key]));
}

function validateExcelFormat(data) {
    if (!data || data.length < 1) {
        return { isValid: false, message: 'The Excel file is empty.' };
    }

    const normalized = (data[0] || []).map(header => normalizeTATImportHeader(header));
    const foundKeys = {};
    normalized.forEach(header => {
        if (TAT_IMPORT_HEADER_MAP[header]) {
            foundKeys[TAT_IMPORT_HEADER_MAP[header]] = true;
        }
    });

    const missing = TAT_IMPORT_REQUIRED_JSON_KEYS.filter(key => !foundKeys[key]);
    if (missing.length > 0) {
        const missingLabels = missing.map(key => getTATImportColumnLabel(key));
        return { isValid: false, message: `Missing required columns: ${missingLabels.join(', ')}` };
    }

    return { isValid: true, message: 'Excel format is valid.' };
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
async function SaveData(element) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
        return;
    }
    Save(element);
}
function Save(element) {
    if ($(element).val() !== '' && $(element).val() !== null) {
        let id = element.id;
        let Code = id.split('_')[1];
        let POD = $("#txtPODDate_" + Code).val();
        if (POD != '') {
            POD = convertDateFormat3($("#txtPODDate_" + Code).val());
        }
        let Redispatch = $("#txtRedispatch_" + Code).val()
        if (Redispatch != '') {
            Redispatch = convertDateFormat3($("#txtRedispatch_" + Code).val());
        }
        let DispatchedDate = $("#txtDispatchDate_" + Code).val()
        if (DispatchedDate != '') {
            DispatchedDate = convertDateFormat4($("#txtDispatchDate_" + Code).val());
        }
        var VehicleNo = $("#txtVehicleNo_" + Code).val();
        var Remark = $("#txtRemark_" + Code).val();

        const requestData = {
            Code: Code,
            POD: POD,
            Redispatch: Redispatch,
            VehicleNo: VehicleNo,
            DispatchedDate: DispatchedDate,
            Remark: Remark,
            UserMaster_Code: UserMaster_Code
        };
        blockUI();
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/SaveTATDetails`,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(requestData),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Auth-Key", authKeyData);
            },
            success: function (response) {
                if (response.Status === "Y") {
                    unblockUI();
                    toastr.success(response.Msg);
                    GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
                } else {
                    unblockUI();
                    toastr.error(response.Msg);
                }
            },
            error: function (xhr, status, error) {
                unblockUI();
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            },
        });
    }
}
function DataExport() {
    var Month = $("#ddlMonth").val();
    var Year = $("#ddlYear").val();
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?Month=${Month}&Year=${Year}&Type=EXPORT`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                unblockUI();
                Export(response);
            } else {
                 unblockUI();
                 toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", error);
        }
    });
}

async function DownloadImportTemplate() {
    if (typeof ExcelJS === 'undefined') {
        toastr.error('Excel library not loaded.');
        return;
    }

    const headers = TAT_IMPORT_TEMPLATE_HEADERS.slice();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Import Template');
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FF000000' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' }
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    worksheet.addRow([
        'INV001', '21-Aug-2026', 'RET001', 'SO001', 'Sample Party',
        '1000.00', 'B2B', '21-Aug-2026'
    ]);

    worksheet.columns = headers.map(() => ({ width: 24 }));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'TATReport_Import_Template.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
}
function MonthAndYearDropDown() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    let qntYears = 5;
    let selectMonth = $("#ddlMonth");
    let selectYear = $("#ddlYear");

    selectMonth.empty();
    selectYear.empty();

    let currentYear = new Date().getFullYear();
    for (let y = 0; y < qntYears; y++) {
        let yearValue = currentYear - y;

        let yearElem1 = $("<option>").val(yearValue).text(yearValue);
        let yearElem2 = $("<option>").val(yearValue).text(yearValue);

        selectYear.append(yearElem1);
    }
    for (let m = 0; m < 12; m++) {
        let monthName = monthNames[m];

        let monthElem1 = $("<option>").val(m+1).text(monthName);

        selectMonth.append(monthElem1);
    }
    let now = new Date();
    selectYear.val(now.getFullYear());
    selectMonth.val(now.getMonth()+1);
    GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
}
async function Export(jsonData) {
    var Month = $("#ddlMonth").val();
    var Year = $("#ddlYear").val();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    const filteredAndRenamedData = jsonData;

    const headers = Object.keys(filteredAndRenamedData[0] || {});
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB0C4DE' }
        };
    });

    filteredAndRenamedData.forEach(data => {
        worksheet.addRow(Object.values(data));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "TATReport_" +Month+'_'+Year + ".xlsx";
    link.click();
}
function GetCurrentDate() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                //DatePicker(response[0].Date);
                TATDatePicker(response[0].Date)
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function setupDateInputFormatting() {
    $('#txtTATDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateTATDate(value);
        } else {
            $(this).val(value);
        }
    });
    //$('#txtDate').on('input', function () {
    //    let value = $(this).val().replace(/[^\d]/g, '');

    //    if (value.length >= 2 && value.length < 4) {
    //        value = value.slice(0, 2) + '/' + value.slice(2);
    //    } else if (value.length >= 4) {
    //        value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
    //    }
    //    $(this).val(value);

    //    if (value.length === 10) {
    //        validateDate(value);
    //    } else {
    //        $(this).val(value);
    //    }
    //});
}
function validateTATDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtTATDate').val('');

        }
    } else {
        $('#txtTATDate').val('');

    }
}
//function validateDate(value) {
//    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
//    let isValidFormat = regex.test(value);

//    if (isValidFormat) {
//        let parts = value.split('/');
//        let day = parseInt(parts[0], 10);
//        let month = parseInt(parts[1], 10);
//        let year = parseInt(parts[2], 10);

//        let date = new Date(year, month - 1, day);

//        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

//            $(this).val(value);
//        } else {
//            $('#txtDate').val('');

//        }
//    } else {
//        $('#txtDate').val('');

//    }
//}
//function DatePicker(date) {
//    $('#txtDate').val(date);
//    GetTATReportList('Get', convertDateFormat(date));
//    $('#txtDate').datepicker({
//        format: 'dd/mm/yyyy',
//        autoclose: true,
//        orientation: 'bottom auto',
//        todayHighlight: true
//    }).on('show', function () {
//        let $input = $(this);
//        let inputOffset = $input.offset();
//        let inputHeight = $input.outerHeight();
//        let inputWidth = $input.outerWidth();
//        setTimeout(function () {
//            let $datepicker = $('.datepicker-dropdown');
//            $datepicker.css({
//                width: inputWidth + 'px',
//                top: (inputOffset.top + inputHeight) + 'px',
//                left: inputOffset.left + 'px'
//            });
//        }, 10);
        
//    }).on('changeDate', function (e) {
//        GetTATReportList('Get', convertDateFormat($("#txtDate").val()));
//    });;
//}
function TATDatePicker(date) {
    $('#txtTATDate').val(date);
    $('#txtTATDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true
    }).on('show', function () {
        let $input = $(this);
        let inputOffset = $input.offset();
        let inputHeight = $input.outerHeight();
        let inputWidth = $input.outerWidth();
        setTimeout(function () {
            let $datepicker = $('.datepicker-dropdown');
            $datepicker.css({
                width: inputWidth + 'px',
                top: (inputOffset.top + inputHeight) + 'px',
                left: inputOffset.left + 'px'
            });
        }, 10);
    });
}
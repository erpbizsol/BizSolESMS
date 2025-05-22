var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let JsonData = [];
let G_IsCheck = 'N';
$(document).ready(function () {
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
});
function GetTATReportList(Type,Month,Year) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?Month=${Month}&Year=${Year}&Type=GET`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
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
                    "Reorder Qty": 'right',
                    "REMARK": 'left;width:100px;',
                };
                const updatedResponse = response.map(item => {
                    const isDisabled = item["DISPATCH DATE"] === '' ? 'disabled' : '';

                    return {
                        ...item,
                        POD: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.POD}" id="txtPODDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        REDISPATCH: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REDISPATCH}" id="txtRedispatch_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        "VEHICLE NO": `<input type="text" maxlength="10" class="box_border form-control form-control-sm" ${isDisabled} value="${item["VEHICLE NO"]}" id="txtVehicleNo_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`,
                        REMARK: `<input type="text" maxlength="100" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REMARK}" id="txtRemark_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`
                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtTATTable").hide();
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
    return `${day} -${monthAbbreviation} -${year}`;
}
function ClearData() {
    $("#txtExcelFile").val("");
    MonthAndYearDropDown();
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
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        },
    });
}
function SaveImportFile() {
    var Month = $("#ddlTATMonth").val();
    var Year = $("#ddlTATYear").val();
    if (Month == '') {
        toastr.error("Please select month !");
        $("#ddlTATMonth").focus();
        return;
    } if (Year == '') {
        toastr.error("Please select year !");
        $("#ddlTATYear").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtExcelFile").focus();
        return;
    }
    const requestData = {
        Month: Month,
        Year: Year,
        IsCheck: G_IsCheck,
        JsonData: JsonData,
        UserMaster_Code: UserMaster_Code
    };
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
                validateCSV(event, function (isValidCSV) {
                    if (!isValidCSV) {
                        event.target.value = '';
                        $("#ImportTable").hide();
                        JsonData = [];
                        return false;
                    }
                    GetImportFile();
                });
                JsonData = parseCSV(e.target.result);
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

                JsonData = convertToKeyValuePairs(jsonData);
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
function parseCSV(csvData) {
    const rows = csvData.split(/\r?\n/).filter(row => row.trim() !== ""); // Ignore empty rows
    if (rows.length === 0) return [];

    const headers = rows[0].split(/\t/).map(header => cleanHeader(header)); // Clean headers

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

    const headers = data[0].map(header => cleanHeader(header));

    return data.slice(1).map(row => {
        return headers.reduce((obj, header, index) => {
            let value = row[index] ? cleanValue(row[index].toString()) : "";

            if (header.toLowerCase().includes("date") && value) {
                value = convertDateFormat2(value.split(/\s+/)[0]);
            }
            obj[header] = value;
            return obj;
        }, {});
    });
}
function cleanHeader(header) {
    return header.replace(/[^a-zA-Z0-9]/g, '');
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
function validateExcelFormat(data) {
    if (data.length < 1) {
        return { isValid: false, message: "The Excel file is empty." };
    }
    const headers = data[0].map(header => header.replace(/[\s.]+/g, '').toUpperCase());
    if ("S" === 'S') {
        const requiredColumns = ['INVOICENO', 'ORDERDATE', 'RETAILERCODE', 'SALESORDERNO','INVOICEVALUE'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            return { isValid: false, message: `Missing required columns: ${missingColumns.join(', ')}` };
        }
    }
    return { isValid: true, message: "Excel format is valid." };
}
function cleanHeader(header) {
    return header.replace(/[^a-zA-Z0-9]/g, "").trim();
}
function validateCSV(event, callback) {
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        callback(false);
        return;
    }

    let expectedHeaders = [];
    if ('S' === 'S') {
        expectedHeaders = ['INVOICENO', 'ORDERDATE', 'RETAILERCODE', 'SALESORDERNO', 'INVOICEVALUE'];
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const csvData = e.target.result;
        const rows = csvData.split(/\r?\n/);
        if (rows.length === 0) {
            alert("Empty file.");
            callback(false);
            return;
        }

        const headers = rows[0].split(/\t|,/).map(h => cleanHeader(h.trim()));

        const missingHeaders = expectedHeaders.filter(expected =>
            !headers.includes(expected)
        );

        if (missingHeaders.length === 0) {
            console.log("CSV Headers Matched ✅");
            callback(true);
        } else {
            alert("Invalid file. Missing required headers: " + missingHeaders.join(", "));
            console.log("Expected:", expectedHeaders);
            console.log("Found:", headers);
            callback(false);
        }
    };

    reader.readAsText(file);
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
    if ($(element).val() !== '') {
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
        var VehicleNo = $("#txtVehicleNo_" + Code).val();
        var Remark = $("#txtRemark_" + Code).val();

        const requestData = {
            Code: Code,
            POD: POD,
            Redispatch: Redispatch,
            VehicleNo: VehicleNo,
            Remark: Remark,
            UserMaster_Code: UserMaster_Code
        };
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
                    toastr.success(response.Msg);
                    GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
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
function DataExport() {
    var Month = $("#ddlMonth").val();
    var Year = $("#ddlYear").val();
    if (Month == '') {
        toastr.error("Please select month !");
        $("#ddlMonth").focus();
        return;
    } else if (Year == '') {
        toastr.error("Please select year !");
        $("#ddlYear").focus();
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?Month=${Month}&Year=${Year}&Type=EXPORT`,
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
    var date = $("#txtDate").val();
    var ws = XLSX.utils.json_to_sheet(jsonData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "TATReport_" + date + ".xlsx");
}
function MonthAndYearDropDown() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    let qntYears = 5;
    let selectTATMonth = $("#ddlTATMonth");
    let selectTATYear = $("#ddlTATYear");
    let selectMonth = $("#ddlMonth");
    let selectYear = $("#ddlYear");
    let currentYear = new Date().getFullYear();
    for (let y = 0; y < qntYears; y++) {
        let yearValue = currentYear - y;

        let yearElem1 = $("<option>").val(yearValue).text(yearValue);
        let yearElem2 = $("<option>").val(yearValue).text(yearValue);

        selectYear.append(yearElem1);
        selectTATYear.append(yearElem2);
    }
    for (let m = 0; m < 12; m++) {
        let monthName = monthNames[m];

        let monthElem1 = $("<option>").val(m).text(monthName);
        let monthElem2 = $("<option>").val(m).text(monthName);

        selectMonth.append(monthElem1);
        selectTATMonth.append(monthElem2);
    }
    let now = new Date();
    selectYear.val(now.getFullYear());
    selectTATYear.val(now.getFullYear());
    selectMonth.val(now.getMonth());
    selectTATMonth.val(now.getMonth());
    GetTATReportList('Get', $("#ddlMonth").val(), $("#ddlYear").val());
}

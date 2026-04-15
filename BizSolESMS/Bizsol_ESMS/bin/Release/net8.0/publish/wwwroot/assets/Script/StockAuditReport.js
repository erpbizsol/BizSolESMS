var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
$(document).ready(function () {
    $("#ERPHeading").text("Stock Audit Report");
    GetCurrentDate();
});
function GetCurrentDate() {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                DatePicker(response[0].Date);
                FromDatePicker(response[0].Date);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Stock Audit Report");
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
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function setupDateInputFormatting() {
    $('#txtFromDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateChallanDate(value);
        } else {
            $(this).val(value);
        }
    });
    $('#txtToDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateChallanDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
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
            $('#txtMRNDate').val('');

        }
    } else {
        $('#txtMRNDate').val('');

    }
}
function validateFromDate(value) {
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
            $('#txtFromDate').val('');

        }
    } else {
        $('#txtFromDate').val('');

    }
}
function DatePicker(date) {
    $('#txtToDate').val(date);
    $('#txtToDate').datepicker({
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
function FromDatePicker(dateStr) {
    let parts = dateStr.split('/');
    if (parts.length !== 3) return;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) {
        year += 2000;
    }
    let firstDateOfMonth = new Date(year, month, 1);
    let formattedDate = ('0' + firstDateOfMonth.getDate()).slice(-2) + '/' +
        ('0' + (firstDateOfMonth.getMonth() + 1)).slice(-2) + '/' +
        firstDateOfMonth.getFullYear();
    $('#txtFromDate').val(formattedDate);
    $('#txtFromDate').datepicker({
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
async function Report() {
    const { hasPermission, msg } = await CheckOptionPermission('Download', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    GetStockAuditMaster();
}
function GetStockAuditMaster() {
    var FromDate = convertDateFormat($("#txtFromDate").val());
    var ToDate = convertDateFormat($("#txtToDate").val());
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Report/GetStockAuditMaster?FromDate=${FromDate}&ToDate=${ToDate}&Mode=LOCATE`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                unblockUI();
                $("#DataTable").show();
                const StringFilterColumn = ["STATUS"];
                const NumericFilterColumn = ["Difference"   ];
                const DateFilterColumn = ["Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = [];
                const ColumnAlignment = {
                    
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-success icon-height mb-1"  title="Start Un-Loading" onclick="GetStockAuditMasterList('${item["Date"]}')"><i class="fa fa-hourglass-start"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                unblockUI();
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", error);
        }
    });

}
function GetStockAuditMasterList(Date) {
    $("#hfDate").val(Date);
    var ToDate = convertDateFormat1(Date);
    openSavePopup();
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Report/GetStockAuditMaster?FromDate=''&ToDate=${ToDate}&Mode=SHOWDATA`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                unblockUI();
                $("#DataTable").show();
                const StringFilterColumn = ["Part Code", "Location", "Difference"];
                const NumericFilterColumn = ["Stock Qty", "Scan Qty"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Status"];

                const ColumnAlignment = {
                    "Stock Qty": 'right',
                    "Scan Qty": 'right',
                    "Difference": 'right'
                };
                BizsolCustomFilterGrid.CreateDataTable("ModalTable-header", "ModalTable-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                unblockUI();
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", error);
        }
    });

}
async function Download() {
    const FromDate = convertDateFormat($("#txtFromDate").val());
    const ToDate = convertDateFormat($("#txtToDate").val());
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Report/GetStockAuditMaster?FromDate=${FromDate}&ToDate=${ToDate}&Mode=LOCATE`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            if (response.length > 0) {
                await Export(response);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}
async function Export(Data) {
    const renameMap = {
    };
    const columnToRemove = "Status";

    const originalHeaders = Object.keys(Data[0] || {}).filter(key => key !== columnToRemove);
    const newHeaders = originalHeaders.map(key => renameMap[key] || key);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");
    const headerRow = sheet.addRow(newHeaders);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    sheet.autoFilter = {
        from: 'A1',
        to: String.fromCharCode(65 + newHeaders.length - 1) + '1'
    };

    Data.forEach(rowObj => {
        const row = originalHeaders.map(key => rowObj[key]);
        const addedRow = sheet.addRow(row);

        addedRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        const status = rowObj["Status"];
        const fillColor = status === 'GREEN' ? "FF9EF3A5" : "FFF5C0BF";

        addedRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: fillColor }
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `StockAuditReport.xlsx`;
    link.click();
}
async function DownloadDetails() {
    const ToDate = convertDateFormat1($("#hfDate").val());
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Report/GetStockAuditMaster?FromDate=''&ToDate=${ToDate}&Mode=SHOWDATA`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            if (response.length > 0) {
                await ExportDetails(response);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}
async function ExportDetails(Data) {
    const renameMap = {
    };
    const columnToRemove = "Status";

    const originalHeaders = Object.keys(Data[0] || {}).filter(key => key !== columnToRemove);
    const newHeaders = originalHeaders.map(key => renameMap[key] || key);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");
    const headerRow = sheet.addRow(newHeaders);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    sheet.autoFilter = {
        from: 'A1',
        to: String.fromCharCode(65 + newHeaders.length - 1) + '1'
    };

    Data.forEach(rowObj => {
        const row = originalHeaders.map(key => rowObj[key]);
        const addedRow = sheet.addRow(row);

        addedRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        const status = rowObj["Status"];
        const fillColor = status === 'GREEN' ? "FF9EF3A5" : "FFF5C0BF";

        addedRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: fillColor }
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `StockAuditReportDetails.xlsx`;
    link.click();
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const td = tds[5];
        const td1 = tds[6];
        if (!td) return;
        const columnValue = td.textContent.trim();

        if (columnValue === 'GREEN') {
            td1.style.backgroundColor = '#07bb72';
        } else {
            td1.style.backgroundColor = '#f5c0bf';
        }
    });
}

setInterval(ChangecolorTr, 100);
function openSavePopup() {
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
    saveModal.show();
}

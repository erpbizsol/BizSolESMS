var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
const appBaseURL = sessionStorage.getItem('AppBaseURL') || '';
/** API: GetSaleLossReport — cancelled order line detail from Order Cancellation */
var API_SALE_LOSS_REPORT = '/api/Report/GetSaleLossReport';
var G_SlrReportRows = [];
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;

$(document).ready(function () {
    $("#ERPHeading").text("Sale Loss Report");
    GetModuleMasterCode();
    GetCurrentDate();
    $('#btnSlrShow').on('click', Report);
    $('#btnSlrDownload').on('click', Download);
});

function GetModuleMasterCode() {
    try {
        var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = Data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'sale loss report' || d === 'saleloss report';
        });
        if (result) {
            UserModuleMaster_Code = result.Code;
        }
    } catch (e) {
        UserModuleMaster_Code = 0;
    }
}

function GetCurrentDate() {
    blockUI();
    $.ajax({
        url: appBaseURL + '/api/Master/GetCurrentDate',
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
            Report();
        },
        error: function (xhr, status, error) {
            console.error('GetCurrentDate', error);
            unblockUI();
        }
    });
}

function convertDateFormat(dateString) {
    var parts = (dateString || '').split('/');
    if (parts.length !== 3) return dateString;
    var day = String(parts[0]).padStart(2, '0');
    var month = String(parts[1]).padStart(2, '0');
    var year = parts[2];
    return year + '-' + month + '-' + day;
}

function slrParseAmount(v) {
    if (v == null || v === '') return 0;
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function slrFormatRupee(v) {
    return '\u20B9 ' + slrParseAmount(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function slrStatusBadge(status) {
    var s = String(status || '').trim().toLowerCase();
    var cls = 'slr-status-badge--partial';
    var icon = 'fa-circle-half-stroke';
    if (s.indexOf('fully') >= 0) {
        cls = 'slr-status-badge--full';
        icon = 'fa-circle-xmark';
    }
    return '<span class="slr-status-badge ' + cls + '"><i class="fa-solid ' + icon + '"></i>' +
        (status || '—') + '</span>';
}

function DatePicker(date) {
    $('#txtToDate').val(date);
    $('#txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true
    }).on('show', function () {
        slrPositionDatepicker($(this));
    });
}

function FromDatePicker(dateStr) {
    let parts = dateStr.split('/');
    if (parts.length !== 3) return;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
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
        slrPositionDatepicker($(this));
    });
}

function slrPositionDatepicker($input) {
    let inputOffset = $input.offset();
    let inputHeight = $input.outerHeight();
    let inputWidth = $input.outerWidth();
    setTimeout(function () {
        $('.datepicker-dropdown').css({
            width: inputWidth + 'px',
            top: (inputOffset.top + inputHeight) + 'px',
            left: inputOffset.left + 'px'
        });
    }, 10);
}

function slrExtractRows(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.Table)) return res.Table;
    return [];
}

function slrValidateFilters() {
    var fromUi = ($('#txtFromDate').val() || '').trim();
    var toUi = ($('#txtToDate').val() || '').trim();
    var cancelStatus = ($('#ddlCancelStatus').val() || 'All').trim();

    if (!fromUi) {
        toastr.error('Please select From Date.');
        $('#txtFromDate').focus();
        return null;
    }
    if (!toUi) {
        toastr.error('Please select To Date.');
        $('#txtToDate').focus();
        return null;
    }

    return {
        FromDate: convertDateFormat(fromUi),
        ToDate: convertDateFormat(toUi),
        CancelStatus: cancelStatus
    };
}

function slrShowPlaceholder() {
    $('#slrReportContent').hide();
    $('#slrReportPlaceholder').show();
    $('#btnSlrDownload').prop('disabled', true);
}

function slrShowContent() {
    $('#slrReportPlaceholder').hide();
    $('#slrReportContent').show();
    $('#btnSlrDownload').prop('disabled', false);
}

var SLR_GRID_COLUMNS = [
    'S.No', 'Client Name', 'Buyer PO No', 'Item Code', 'Item Name',
    'Order Qty', 'Dispatch Qty', 'Cancel Qty', 'Rate', 'Cancel Value', 'Cancel Status'
];

function slrPickField(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function slrNormalizeGridRow(r, idx) {
    var sno = slrPickField(r, ['SNo', 'S.No', 'SrNo']);
    if (sno === '' || sno == null) sno = (idx != null ? idx : 0) + 1;
    return {
        'S.No': sno,
        'Client Name': slrPickField(r, ['AccountName', 'Client Name', 'Account Name']),
        'Buyer PO No': slrPickField(r, ['BuyerPONo', 'Buyer PO No']),
        'Item Code': slrPickField(r, ['ItemCode', 'Item Code']),
        'Item Name': slrPickField(r, ['ItemName', 'Item Name']),
        'Order Qty': slrParseAmount(slrPickField(r, ['OrderQty', 'Order Qty'])),
        'Dispatch Qty': slrParseAmount(slrPickField(r, ['DispatchQty', 'Dispatch Qty'])),
        'Cancel Qty': slrParseAmount(slrPickField(r, ['CancelQty', 'Cancel Qty'])),
        'Rate': slrParseAmount(slrPickField(r, ['Rate'])),
        'Cancel Value': slrParseAmount(slrPickField(r, ['CancelValue', 'Cancel Value'])),
        'Cancel Status': slrPickField(r, ['CancelStatus', 'Cancel Status'])
    };
}

function slrBuildDisplayRows(rows) {
    return rows.map(function (r, idx) {
        var copy = slrNormalizeGridRow(r, idx);
        if (copy['Cancel Status'] != null && copy['Cancel Status'] !== '') {
            copy['Cancel Status'] = slrStatusBadge(copy['Cancel Status']);
        }
        return copy;
    });
}

function slrRenderFooterTotals(rows) {
    var cancelQtyTotal = 0;
    var cancelValueTotal = 0;
    rows.forEach(function (r) {
        cancelQtyTotal += slrParseAmount(r.CancelQty != null ? r.CancelQty : r['Cancel Qty']);
        cancelValueTotal += slrParseAmount(r['Cancel Value'] != null ? r['Cancel Value'] : r.CancelValue);
    });

    var $footer = $('#table-footer');
    $footer.empty();
    if (!rows.length) return;

    var keys = SLR_GRID_COLUMNS;
    var html = '<tr class="slr-grid-total-row">';
    keys.forEach(function (key) {
        var val = '';
        if (key === 'S.No') val = 'Total';
        else if (key === 'Cancel Qty') val = cancelQtyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        else if (key === 'Cancel Value') val = slrFormatRupee(cancelValueTotal);
        var align = (key === 'S.No' || key === 'Order Qty' || key === 'Dispatch Qty' ||
            key === 'Cancel Qty' || key === 'Rate' || key === 'Cancel Value') ? ' text-end' : '';
        html += '<td class="' + align.trim() + '">' + val + '</td>';
    });
    html += '</tr>';
    $footer.html(html);
}

function slrRenderGrid(rows) {
    if (!rows.length) {
        slrShowPlaceholder();
        $('#table-header').empty();
        $('#table-body').empty();
        $('#table-footer').empty();
        $('#paginator-table').empty();
        toastr.error('Record not found...!');
        return;
    }

    slrShowContent();

    var StringFilterColumn = [
        'Client Name', 'Buyer PO No', 'Item Code', 'Item Name', 'Cancel Status'
    ];
    var NumericFilterColumn = [
        'S.No', 'Order Qty', 'Dispatch Qty', 'Cancel Qty', 'Rate', 'Cancel Value'
    ];
    var DateFilterColumn = [];
    var hiddenCols = [];
    var align = {
        'S.No': 'right',
        'Order Qty': 'right',
        'Dispatch Qty': 'right',
        'Cancel Qty': 'right',
        'Rate': 'right',
        'Cancel Value': 'right'
    };

    var displayRows = slrBuildDisplayRows(rows);

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header',
        'table-body',
        displayRows,
        false,
        [],
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        [],
        hiddenCols,
        align,
        true
    );

    slrRenderFooterTotals(rows);
}

async function Report() {
    if (typeof CheckOptionPermission === 'function') {
        const { hasPermission, msg } = await CheckOptionPermission('Download', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission === false) {
            toastr.error(msg);
            return;
        }
    }
    GetSaleLossReport();
}

function GetSaleLossReport() {
    var filters = slrValidateFilters();
    if (!filters) return;

    blockUI();
    $.ajax({
        url: appBaseURL + API_SALE_LOSS_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate,
            CancelStatus: filters.CancelStatus
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_SlrReportRows = slrExtractRows(response);
            slrRenderGrid(G_SlrReportRows);
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetSaleLossReport', xhr.status, xhr.responseText || error);
            G_SlrReportRows = [];
            slrShowPlaceholder();
            toastr.error('Unable to load sale loss report.');
            unblockUI();
        }
    });
}

async function Download() {
    if (typeof CheckOptionPermission === 'function') {
        const { hasPermission, msg } = await CheckOptionPermission('Download', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission === false) {
            toastr.error(msg);
            return;
        }
    }

    var filters = slrValidateFilters();
    if (!filters) return;

    if (G_SlrReportRows.length > 0) {
        await slrExportExcel(G_SlrReportRows, filters);
        return;
    }

    blockUI();
    $.ajax({
        url: appBaseURL + API_SALE_LOSS_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate,
            CancelStatus: filters.CancelStatus
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            var rows = slrExtractRows(response);
            if (rows.length > 0) {
                await slrExportExcel(rows, filters);
            } else {
                toastr.error('Record not found...!');
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetSaleLossReport', xhr.status, xhr.responseText || error);
            toastr.error('Unable to download sale loss report.');
            unblockUI();
        }
    });
}

async function slrExportExcel(Data, filters) {
    var displayRows = Data.map(function (r, idx) { return slrNormalizeGridRow(r, idx); });
    var originalHeaders = SLR_GRID_COLUMNS.slice();

    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet('Sale Loss Report');
    var headerRow = sheet.addRow(originalHeaders);
    headerRow.eachCell(function (cell) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } };
    });

    displayRows.forEach(function (item) {
        var row = originalHeaders.map(function (key) { return item[key]; });
        sheet.addRow(row);
    });

    var cancelQtyTotal = 0;
    var cancelValueTotal = 0;
    displayRows.forEach(function (r) {
        cancelQtyTotal += slrParseAmount(r['Cancel Qty']);
        cancelValueTotal += slrParseAmount(r['Cancel Value']);
    });
    var totalRow = originalHeaders.map(function (key) {
        if (key === 'S.No') return 'Total';
        if (key === 'Cancel Qty') return cancelQtyTotal;
        if (key === 'Cancel Value') return cancelValueTotal;
        return '';
    });
    var tr = sheet.addRow(totalRow);
    tr.eachCell(function (cell) {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
    });

    sheet.columns.forEach(function (column) {
        var maxLength = 12;
        column.eachCell({ includeEmpty: true }, function (cell) {
            var len = cell.value ? String(cell.value).length : 0;
            if (len > maxLength) maxLength = len;
        });
        column.width = Math.min(maxLength + 2, 40);
    });

    var buffer = await workbook.xlsx.writeBuffer();
    var blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'SaleLossReport_' + (filters.CancelStatus || 'All') + '_' + filters.ToDate.replace(/-/g, '') + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

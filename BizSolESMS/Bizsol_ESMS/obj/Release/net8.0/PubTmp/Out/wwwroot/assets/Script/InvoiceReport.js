var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
const appBaseURL = sessionStorage.getItem('AppBaseURL') || '';
/** API: GetInvoicePaymentReport — grid: S.No, Invoice No, Invoice Date, Client Name, Invoice Amount, Payment Amount, Balance Amount, Status */
var API_INVOICE_PAYMENT_REPORT = '/api/Report/GetInvoicePaymentReport';
var G_InvReportRows = [];
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;

$(document).ready(function () {
    $("#ERPHeading").text("Invoice Payment Report");
    GetModuleMasterCode();
    GetCurrentDate();
    $('#btnIprShow').on('click', Report);
    $('#btnIprDownload').on('click', Download);
});

function GetModuleMasterCode() {
    try {
        var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = Data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'invoice payment report' || d === 'invoice report';
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

function iprParseAmount(v) {
    if (v == null || v === '') return 0;
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function iprFormatRupee(v) {
    return '\u20B9 ' + iprParseAmount(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function iprFormatUiDate(dateStr) {
    if (!dateStr) return '';
    var s = String(dateStr).trim();
    if (s.indexOf(' ') >= 0) s = s.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        var p = s.slice(0, 10).split('-');
        return p[2] + '-' + p[1] + '-' + p[0];
    }
    return s;
}

function iprStatusBadge(status) {
    var s = String(status || '').trim().toLowerCase();
    var cls = 'ipr-status-badge--pending';
    var icon = 'fa-clock';
    if (s === 'partial') {
        cls = 'ipr-status-badge--partial';
        icon = 'fa-circle-half-stroke';
    } else if (s === 'completed') {
        cls = 'ipr-status-badge--completed';
        icon = 'fa-circle-check';
    }
    return '<span class="ipr-status-badge ' + cls + '"><i class="fa-solid ' + icon + '"></i>' +
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
        iprPositionDatepicker($(this));
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
        iprPositionDatepicker($(this));
    });
}

function iprPositionDatepicker($input) {
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

function invReportExtractRows(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.Table)) return res.Table;
    return [];
}

function invReportValidateFilters() {
    var fromUi = ($('#txtFromDate').val() || '').trim();
    var toUi = ($('#txtToDate').val() || '').trim();
    var paymentStatus = ($('#ddlPaymentStatus').val() || 'All').trim();

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
    if (!paymentStatus) {
        toastr.error('Please select Payment Status.');
        $('#ddlPaymentStatus').focus();
        return null;
    }

    return {
        FromDate: convertDateFormat(fromUi),
        ToDate: convertDateFormat(toUi),
        PaymentStatus: paymentStatus
    };
}

function iprShowPlaceholder() {
    $('#iprReportContent').hide();
    $('#iprReportPlaceholder').show();
    $('#btnIprDownload').prop('disabled', true);
}

function iprShowContent() {
    $('#iprReportPlaceholder').hide();
    $('#iprReportContent').show();
    $('#btnIprDownload').prop('disabled', false);
}

function iprPickField(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

/** Map API row → grid columns: S.No, Invoice No, Invoice Date, Client Name, Invoice Amount, Payment Amount, Balance Amount, Status */
function iprNormalizeGridRow(r, idx) {
    var sno = iprPickField(r, ['S.No', 'SNo', 'SrNo']);
    if (sno === '' || sno == null) sno = (idx != null ? idx : 0) + 1;
    return {
        'S.No': sno,
        'Invoice No': iprPickField(r, ['InvoiceNo', 'Invoice No']),
        'Invoice Date': iprPickField(r, ['InvoiceDate', 'Invoice Date']),
        'Client Name': iprPickField(r, ['AccountName', 'Client Name', 'Account Name']),
        'Invoice Amount': iprParseAmount(iprPickField(r, ['InvoiceAmount', 'Invoice Amount'])),
        'Payment Amount': iprParseAmount(iprPickField(r, ['PaymentAmount', 'Payment Amount'])),
        'Balance Amount': iprParseAmount(iprPickField(r, ['BalanceAmount', 'Balance Amount'])),
        Status: iprPickField(r, ['Status'])
    };
}

function iprBuildDisplayRows(rows) {
    return rows.map(function (r, idx) {
        var copy = iprNormalizeGridRow(r, idx);
        if (copy.Status != null && copy.Status !== '') {
            copy.Status = iprStatusBadge(copy.Status);
        }
        return copy;
    });
}

function iprRenderFooterTotals(rows) {
    var invoiceTotal = 0;
    var paymentTotal = 0;
    var balanceTotal = 0;
    rows.forEach(function (r) {
        invoiceTotal += iprParseAmount(r.InvoiceAmount != null ? r.InvoiceAmount : r['Invoice Amount']);
        paymentTotal += iprParseAmount(r.PaymentAmount != null ? r.PaymentAmount : r['Payment Amount']);
        balanceTotal += iprParseAmount(r.BalanceAmount != null ? r.BalanceAmount : r['Balance Amount']);
    });

    var $footer = $('#table-footer');
    $footer.empty();
    if (!rows.length) return;

    var keys = ['S.No', 'Invoice No', 'Invoice Date', 'Client Name', 'Invoice Amount', 'Payment Amount', 'Balance Amount', 'Status'];
    var html = '<tr class="ipr-grid-total-row">';
    keys.forEach(function (key) {
        var val = '';
        if (key === 'S.No') val = 'Total';
        else if (key === 'Invoice Amount') val = iprFormatRupee(invoiceTotal);
        else if (key === 'Payment Amount') val = iprFormatRupee(paymentTotal);
        else if (key === 'Balance Amount') val = iprFormatRupee(balanceTotal);
        var align = (key === 'S.No' || key === 'Invoice Amount' || key === 'Payment Amount' || key === 'Balance Amount') ? ' text-end' : '';
        html += '<td class="' + align.trim() + '">' + val + '</td>';
    });
    html += '</tr>';
    $footer.html(html);
}

function invReportRenderGrid(rows) {
    if (!rows.length) {
        iprShowPlaceholder();
        $('#table-header').empty();
        $('#table-body').empty();
        $('#table-footer').empty();
        $('#paginator-table').empty();
        toastr.error('Record not found...!');
        return;
    }

    iprShowContent();

    var StringFilterColumn = ['Invoice No', 'Client Name', 'Status'];
    var NumericFilterColumn = ['S.No', 'Invoice Amount', 'Payment Amount', 'Balance Amount'];
    var DateFilterColumn = ['Invoice Date'];
    var hiddenCols = [];
    var align = {
        'S.No': 'right',
        'Invoice Amount': 'right',
        'Payment Amount': 'right',
        'Balance Amount': 'right'
    };

    var displayRows = iprBuildDisplayRows(rows);

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

    iprRenderFooterTotals(rows);
}

async function Report() {
    if (typeof CheckOptionPermission === 'function') {
        const { hasPermission, msg } = await CheckOptionPermission('Download', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission === false) {
            toastr.error(msg);
            return;
        }
    }
    GetInvoicePaymentReport();
}

function GetInvoicePaymentReport() {
    var filters = invReportValidateFilters();
    if (!filters) return;

    blockUI();
    $.ajax({
        url: appBaseURL + API_INVOICE_PAYMENT_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate,
            PaymentStatus: filters.PaymentStatus
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_InvReportRows = invReportExtractRows(response);
            invReportRenderGrid(G_InvReportRows);
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetInvoicePaymentReport', xhr.status, xhr.responseText || error);
            G_InvReportRows = [];
            iprShowPlaceholder();
            toastr.error('Unable to load invoice payment report.');
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

    var filters = invReportValidateFilters();
    if (!filters) return;

    if (G_InvReportRows.length > 0) {
        await invReportExportExcel(G_InvReportRows, filters);
        return;
    }

    blockUI();
    $.ajax({
        url: appBaseURL + API_INVOICE_PAYMENT_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate,
            PaymentStatus: filters.PaymentStatus
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            var rows = invReportExtractRows(response);
            if (rows.length > 0) {
                await invReportExportExcel(rows, filters);
            } else {
                toastr.error('Record not found...!');
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetInvoicePaymentReport', xhr.status, xhr.responseText || error);
            toastr.error('Unable to download invoice payment report.');
            unblockUI();
        }
    });
}

async function invReportExportExcel(Data, filters) {
    var displayRows = Data.map(function (r, idx) { return iprNormalizeGridRow(r, idx); });
    var originalHeaders = ['S.No', 'Invoice No', 'Invoice Date', 'Client Name', 'Invoice Amount', 'Payment Amount', 'Balance Amount', 'Status'];

    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet('Invoice Payment Report');
    var headerRow = sheet.addRow(originalHeaders);
    headerRow.eachCell(function (cell) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    });

    displayRows.forEach(function (item) {
        var row = originalHeaders.map(function (key) { return item[key]; });
        sheet.addRow(row);
    });

    var totals = { 'Invoice Amount': 0, 'Payment Amount': 0, 'Balance Amount': 0 };
    displayRows.forEach(function (r) {
        totals['Invoice Amount'] += iprParseAmount(r['Invoice Amount']);
        totals['Payment Amount'] += iprParseAmount(r['Payment Amount']);
        totals['Balance Amount'] += iprParseAmount(r['Balance Amount']);
    });
    var totalRow = originalHeaders.map(function (key) {
        if (key === 'S.No') return 'Total';
        if (key === 'Invoice Amount') return totals['Invoice Amount'];
        if (key === 'Payment Amount') return totals['Payment Amount'];
        if (key === 'Balance Amount') return totals['Balance Amount'];
        return '';
    });
    var tr = sheet.addRow(totalRow);
    tr.eachCell(function (cell) {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
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
    a.download = 'InvoicePaymentReport_' + (filters.PaymentStatus || 'All') + '_' + filters.ToDate.replace(/-/g, '') + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

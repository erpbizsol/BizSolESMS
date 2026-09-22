var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
const appBaseURL = sessionStorage.getItem('AppBaseURL') || '';
/** API: GetMRNRateComparisonReport — USP_MRNRateComparisonReports */
var API_MRN_RATE_REPORT = '/api/Report/GetMRNRateComparisonReport';
var G_MrcReportRows = [];
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;

$(document).ready(function () {
    $("#ERPHeading").text("MRN Report");
    GetModuleMasterCode();
    GetCurrentDate();
    $('#btnMrcShow').on('click', Report);
    $('#btnMrcDownload').on('click', Download);
});

function GetModuleMasterCode() {
    try {
        var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = Data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'mrn report' || d === 'mrn rate comparison report';
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

function mrcParseAmount(v) {
    if (v == null || v === '') return 0;
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function mrcFormatRupee(v) {
    return '\u20B9 ' + mrcParseAmount(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function mrcCompactRupee(v) {
    var n = mrcParseAmount(v);
    var sign = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (n >= 1e7) return sign + '\u20B9' + (n / 1e7).toFixed(2).replace(/\.00$/, '') + 'Cr';
    if (n >= 1e5) return sign + '\u20B9' + (n / 1e5).toFixed(2).replace(/\.00$/, '') + 'L';
    return sign + '\u20B9' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function mrcSetText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null ? '' : String(text);
}

function mrcResetKpis() {
    mrcSetText('mrcKpiLines', '—');
    mrcSetText('mrcKpiQty', '—');
    mrcSetText('mrcKpiDiff', '—');
    mrcSetText('mrcKpiVendors', '—');
    mrcSetText('mrcKpiLinesSub', '');
    mrcSetText('mrcKpiQtySub', '');
    mrcSetText('mrcKpiDiffSub', '');
    mrcSetText('mrcKpiVendorsSub', '');
}

function mrcUpdateKpis(rows) {
    if (!rows || !rows.length) {
        mrcResetKpis();
        return;
    }

    var billQty = 0;
    var receivedQty = 0;
    var mrpDiff = 0;
    var validated = 0;
    var partial = 0;
    var pending = 0;
    var vendors = {};
    var mrns = {};

    rows.forEach(function (r, idx) {
        var n = mrcNormalizeGridRow(r, idx);
        billQty += mrcParseAmount(n['Bill Qty']);
        receivedQty += mrcParseAmount(n['Received Qty']);
        mrpDiff += mrcParseAmount(n['MRP Diff']);

        var status = String(n['Validation Status'] || '').trim().toUpperCase();
        if (status.indexOf('PARTIAL') >= 0) partial++;
        else if (status.indexOf('PENDING') >= 0) pending++;
        else if (status.indexOf('VALIDATED') >= 0) validated++;

        var vendor = String(n['Vendor Name'] || '').trim();
        if (vendor) vendors[vendor] = true;
        var mrn = String(n['MRN No'] || '').trim();
        if (mrn) mrns[mrn] = true;
    });

    var vendorCount = Object.keys(vendors).length;
    var mrnCount = Object.keys(mrns).length;

    mrcSetText('mrcKpiLines', rows.length.toLocaleString('en-IN'));
    mrcSetText('mrcKpiLinesSub', validated + ' Validated · ' + partial + ' Partial · ' + pending + ' Pending');
    mrcSetText('mrcKpiQty', receivedQty.toLocaleString('en-IN', { maximumFractionDigits: 2 }));
    mrcSetText('mrcKpiQtySub', 'Bill ' + billQty.toLocaleString('en-IN', { maximumFractionDigits: 2 }));
    mrcSetText('mrcKpiDiff', mrcCompactRupee(mrpDiff));
    mrcSetText('mrcKpiDiffSub', mrcFormatRupee(mrpDiff));
    mrcSetText('mrcKpiVendors', vendorCount.toLocaleString('en-IN'));
    mrcSetText('mrcKpiVendorsSub', mrnCount + ' MRN' + (mrnCount === 1 ? '' : 's'));
}

function mrcStatusBadge(status) {
    var s = String(status || '').trim().toUpperCase();
    var cls = 'mrc-status-badge--pending';
    var icon = 'fa-clock';
    if (s.indexOf('PARTIAL') >= 0) {
        cls = 'mrc-status-badge--partial';
        icon = 'fa-circle-half-stroke';
    } else if (s.indexOf('VALIDATED') >= 0) {
        cls = 'mrc-status-badge--validated';
        icon = 'fa-circle-check';
    }
    return '<span class="mrc-status-badge ' + cls + '"><i class="fa-solid ' + icon + '"></i>' +
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
        mrcPositionDatepicker($(this));
    });
}

function FromDatePicker(dateStr) {
    let parts = dateStr.split('/');
    if (parts.length !== 3) return;
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
        mrcPositionDatepicker($(this));
    });
}

function mrcPositionDatepicker($input) {
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

function mrcExtractRows(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.Table)) return res.Table;
    return [];
}

function mrcValidateFilters() {
    var fromUi = ($('#txtFromDate').val() || '').trim();
    var toUi = ($('#txtToDate').val() || '').trim();
    var validationStatus = ($('#ddlValidationStatus').val() || 'All').trim();

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
        ValidationStatus: validationStatus
    };
}

function mrcShowPlaceholder() {
    mrcResetKpis();
    $('#mrcReportContent').hide();
    $('#mrcReportPlaceholder').show();
    $('#btnMrcDownload').prop('disabled', true);
}

function mrcShowContent() {
    $('#mrcReportPlaceholder').hide();
    $('#mrcReportContent').show();
    $('#btnMrcDownload').prop('disabled', false);
}

var MRC_GRID_COLUMNS = [
    'S.No', 'MRN No', 'MRN Date', 'Bill No', 'Vendor Name', 'Part Code',
    'Bill Qty', 'Received Qty', 'Bill MRP', 'Receive MRP', 'MRP Diff', 'Validation Status'
];

function mrcPickField(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function mrcNormalizeGridRow(r, idx) {
    var sno = mrcPickField(r, ['SNo', 'S.No', 'SrNo']);
    if (sno === '' || sno == null) sno = (idx != null ? idx : 0) + 1;
    return {
        'S.No': sno,
        'MRN No': mrcPickField(r, ['MRN No', 'MRNNo']),
        'MRN Date': mrcPickField(r, ['MRN Date', 'MRNDate']),
        'Bill No': mrcPickField(r, ['Bill No', 'BillNo', 'Bill_ChallanNo']),
        'Vendor Name': mrcPickField(r, ['Vendor Name', 'VendorName', 'AccountName']),
        'Part Code': mrcPickField(r, ['Part Code', 'PartCode', 'ItemCode']),
        'Bill Qty': mrcParseAmount(mrcPickField(r, ['Bill Qty', 'BillQty'])),
        'Received Qty': mrcParseAmount(mrcPickField(r, ['Received Qty', 'ReceivedQty', 'ReceivedQTY'])),
        'Bill MRP': mrcParseAmount(mrcPickField(r, ['Bill MRP', 'BillMRP', 'ItemRate'])),
        'Receive MRP': mrcParseAmount(mrcPickField(r, ['Receive MRP', 'ReceiveMRP', 'MRP'])),
        'MRP Diff': mrcParseAmount(mrcPickField(r, ['MRP Diff', 'MRP Deff', 'MRPDiff', 'MRPDeff'])),
        'Validation Status': mrcPickField(r, ['Validation Status', 'ValidationStatus'])
    };
}

function mrcFilterByStatus(rows, status) {
    if (!status || status === 'All') return rows;
    var want = String(status).trim().toUpperCase();
    return rows.filter(function (r, idx) {
        var n = mrcNormalizeGridRow(r, idx);
        return String(n['Validation Status'] || '').trim().toUpperCase() === want;
    });
}

function mrcBuildDisplayRows(rows) {
    return rows.map(function (r, idx) {
        var copy = mrcNormalizeGridRow(r, idx);
        if (copy['Validation Status'] != null && copy['Validation Status'] !== '') {
            copy['Validation Status'] = mrcStatusBadge(copy['Validation Status']);
        }
        return copy;
    });
}

function mrcRenderFooterTotals(rows) {
    var billQtyTotal = 0;
    var receivedQtyTotal = 0;
    var mrpDiffTotal = 0;
    rows.forEach(function (r, idx) {
        var n = mrcNormalizeGridRow(r, idx);
        billQtyTotal += mrcParseAmount(n['Bill Qty']);
        receivedQtyTotal += mrcParseAmount(n['Received Qty']);
        mrpDiffTotal += mrcParseAmount(n['MRP Diff']);
    });

    var $footer = $('#table-footer');
    $footer.empty();
    if (!rows.length) return;

    var keys = MRC_GRID_COLUMNS;
    var html = '<tr class="mrc-grid-total-row">';
    keys.forEach(function (key) {
        var val = '';
        if (key === 'S.No') val = 'Total';
        else if (key === 'Bill Qty') val = billQtyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        else if (key === 'Received Qty') val = receivedQtyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        else if (key === 'MRP Diff') val = mrcFormatRupee(mrpDiffTotal);
        var align = (key === 'S.No' || key === 'Bill Qty' || key === 'Received Qty' ||
            key === 'Bill MRP' || key === 'Receive MRP' || key === 'MRP Diff') ? ' text-end' : '';
        html += '<td class="' + align.trim() + '">' + val + '</td>';
    });
    html += '</tr>';
    $footer.html(html);
}

function mrcRenderGrid(rows) {
    if (!rows.length) {
        mrcShowPlaceholder();
        $('#table-header').empty();
        $('#table-body').empty();
        $('#table-footer').empty();
        $('#paginator-table').empty();
        toastr.error('Record not found...!');
        return;
    }

    mrcShowContent();
    mrcUpdateKpis(rows);

    var StringFilterColumn = [
        'MRN No', 'MRN Date', 'Bill No', 'Vendor Name', 'Part Code', 'Validation Status'
    ];
    var NumericFilterColumn = [
        'S.No', 'Bill Qty', 'Received Qty', 'Bill MRP', 'Receive MRP', 'MRP Diff'
    ];
    var DateFilterColumn = [];
    var hiddenCols = [];
    var align = {
        'S.No': 'right',
        'Bill Qty': 'right',
        'Received Qty': 'right',
        'Bill MRP': 'right',
        'Receive MRP': 'right',
        'MRP Diff': 'right'
    };

    var displayRows = mrcBuildDisplayRows(rows);

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

    mrcRenderFooterTotals(rows);
}

async function Report() {
    if (typeof CheckOptionPermission === 'function') {
        const { hasPermission, msg } = await CheckOptionPermission('Download', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission === false) {
            toastr.error(msg);
            return;
        }
    }
    GetMRNRateComparisonReport();
}

function GetMRNRateComparisonReport() {
    var filters = mrcValidateFilters();
    if (!filters) return;

    blockUI();
    $.ajax({
        url: appBaseURL + API_MRN_RATE_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_MrcReportRows = mrcFilterByStatus(mrcExtractRows(response), filters.ValidationStatus);
            mrcRenderGrid(G_MrcReportRows);
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetMRNRateComparisonReport', xhr.status, xhr.responseText || error);
            G_MrcReportRows = [];
            mrcShowPlaceholder();
            toastr.error('Unable to load MRN report.');
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

    var filters = mrcValidateFilters();
    if (!filters) return;

    if (G_MrcReportRows.length > 0) {
        await mrcExportExcel(G_MrcReportRows, filters);
        return;
    }

    blockUI();
    $.ajax({
        url: appBaseURL + API_MRN_RATE_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            var rows = mrcFilterByStatus(mrcExtractRows(response), filters.ValidationStatus);
            if (rows.length > 0) {
                await mrcExportExcel(rows, filters);
            } else {
                toastr.error('Record not found...!');
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetMRNRateComparisonReport', xhr.status, xhr.responseText || error);
            toastr.error('Unable to download MRN report.');
            unblockUI();
        }
    });
}

async function mrcExportExcel(Data, filters) {
    var displayRows = Data.map(function (r, idx) { return mrcNormalizeGridRow(r, idx); });
    var originalHeaders = MRC_GRID_COLUMNS.slice();

    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet('MRN Report');
    var headerRow = sheet.addRow(originalHeaders);
    headerRow.eachCell(function (cell) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
    });

    displayRows.forEach(function (item) {
        var row = originalHeaders.map(function (key) { return item[key]; });
        sheet.addRow(row);
    });

    var billQtyTotal = 0;
    var receivedQtyTotal = 0;
    var mrpDiffTotal = 0;
    displayRows.forEach(function (r) {
        billQtyTotal += mrcParseAmount(r['Bill Qty']);
        receivedQtyTotal += mrcParseAmount(r['Received Qty']);
        mrpDiffTotal += mrcParseAmount(r['MRP Diff']);
    });
    var totalRow = originalHeaders.map(function (key) {
        if (key === 'S.No') return 'Total';
        if (key === 'Bill Qty') return billQtyTotal;
        if (key === 'Received Qty') return receivedQtyTotal;
        if (key === 'MRP Diff') return mrpDiffTotal;
        return '';
    });
    var tr = sheet.addRow(totalRow);
    tr.eachCell(function (cell) {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFEFF' } };
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
    a.download = 'MRNReport_' + (filters.ValidationStatus || 'All').replace(/\s+/g, '') + '_' + filters.ToDate.replace(/-/g, '') + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
if (!authKeyData || typeof authKeyData !== 'object') authKeyData = {};
const appBaseURL = sessionStorage.getItem('AppBaseURL') || '';
/** API: GetDispatchOrderRateComparisonReport — FromDate, ToDate, AccountMaster_Code */
var API_ORDER_REPORT = '/api/Report/GetDispatchOrderRateComparisonReport';
var API_CLIENT_LIST = '/api/Master/GetAccountIsClientDropDown';
var G_OrdReportRows = [];
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;

$(document).ready(function () {
    $("#ERPHeading").text("Order Report");
    GetModuleMasterCode();
    ordInitSelect2();
    ordLoadClientDropdown();
    GetCurrentDate();
    $('#btnOrdShow').on('click', Report);
    $('#btnOrdDownload').on('click', Download);
});

function ordInitSelect2() {
    $('#ddlOrdClient').select2({ theme: 'default', width: '100%', allowClear: true });
}

function ordLoadClientDropdown() {
    $.ajax({
        url: appBaseURL + API_CLIENT_LIST,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            var opts = '<option value="0">All clients</option>';
            if (res && res.length) {
                $.each(res, function (i, item) {
                    opts += '<option value="' + item.Code + '">' + (item.AccountName || '') + '</option>';
                });
            }
            $('#ddlOrdClient').html(opts).val('0').trigger('change');
        },
        error: function (xhr, status, error) {
            console.error('GetAccountIsClientDropDown', xhr.status, xhr.responseText || error);
        }
    });
}

function GetModuleMasterCode() {
    try {
        var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = Data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'order report';
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

function ordParseAmount(v) {
    if (v == null || v === '') return 0;
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function ordFormatRupee(v) {
    return '\u20B9 ' + ordParseAmount(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function ordCompactRupee(v) {
    var n = ordParseAmount(v);
    var sign = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (n >= 1e7) return sign + '\u20B9' + (n / 1e7).toFixed(2).replace(/\.00$/, '') + 'Cr';
    if (n >= 1e5) return sign + '\u20B9' + (n / 1e5).toFixed(2).replace(/\.00$/, '') + 'L';
    return sign + '\u20B9' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function ordSetText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null ? '' : String(text);
}

function ordResetKpis() {
    ordSetText('ordKpiLines', '—');
    ordSetText('ordKpiQty', '—');
    ordSetText('ordKpiAmount', '—');
    ordSetText('ordKpiClients', '—');
    ordSetText('ordKpiLinesSub', '');
    ordSetText('ordKpiQtySub', '');
    ordSetText('ordKpiAmountSub', '');
    ordSetText('ordKpiClientsSub', '');
}

function ordUpdateKpis(rows) {
    if (!rows || !rows.length) {
        ordResetKpis();
        return;
    }

    var dispatchQty = 0;
    var mrpDiff = 0;
    var clients = {};
    var orders = {};

    rows.forEach(function (r, idx) {
        var n = ordNormalizeGridRow(r, idx);
        dispatchQty += ordParseAmount(n['Dispatch Qty']);
        mrpDiff += ordParseAmount(n['MRP Deff']);

        var client = String(n['Client Name'] || '').trim();
        if (client) clients[client] = true;
        var orderNo = String(n['Order No'] || '').trim();
        if (orderNo) orders[orderNo] = true;
    });

    var clientCount = Object.keys(clients).length;
    var orderCount = Object.keys(orders).length;

    ordSetText('ordKpiLines', rows.length.toLocaleString('en-IN'));
    ordSetText('ordKpiLinesSub', orderCount + ' order' + (orderCount === 1 ? '' : 's'));
    ordSetText('ordKpiQty', dispatchQty.toLocaleString('en-IN', { maximumFractionDigits: 2 }));
    ordSetText('ordKpiQtySub', '');
    ordSetText('ordKpiAmount', ordCompactRupee(mrpDiff));
    ordSetText('ordKpiAmountSub', ordFormatRupee(mrpDiff));
    ordSetText('ordKpiClients', clientCount.toLocaleString('en-IN'));
    ordSetText('ordKpiClientsSub', orderCount + ' order' + (orderCount === 1 ? '' : 's'));
}

function DatePicker(date) {
    $('#txtToDate').val(date);
    $('#txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true
    }).on('show', function () {
        ordPositionDatepicker($(this));
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
        ordPositionDatepicker($(this));
    });
}

function ordPositionDatepicker($input) {
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

function ordExtractRows(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.Table)) return res.Table;
    return [];
}

function ordValidateFilters() {
    var fromUi = ($('#txtFromDate').val() || '').trim();
    var toUi = ($('#txtToDate').val() || '').trim();
    var accountCode = parseInt($('#ddlOrdClient').val(), 10);
    if (isNaN(accountCode)) accountCode = 0;

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
        AccountMaster_Code: accountCode
    };
}

function ordShowPlaceholder() {
    ordResetKpis();
    $('#ordReportContent').hide();
    $('#ordReportPlaceholder').show();
    $('#btnOrdDownload').prop('disabled', true);
}

function ordShowContent() {
    $('#ordReportPlaceholder').hide();
    $('#ordReportContent').show();
    $('#btnOrdDownload').prop('disabled', false);
}

var ORD_GRID_COLUMNS = [
    'S.No', 'Order No', 'Order Date', 'Client Name', 'Part Code', 'Part Name',
    'Dispatch Qty', 'Order Rate', 'Dispatch Rate', 'MRP Deff'
];

function ordPickField(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function ordNormalizeGridRow(r, idx) {
    var sno = ordPickField(r, ['S.No', 'SNo', 'SrNo']);
    if (sno === '' || sno == null) sno = (idx != null ? idx : 0) + 1;
    return {
        'S.No': sno,
        'Order No': ordPickField(r, ['Order No', 'OrderNo', 'Order_No']),
        'Order Date': ordPickField(r, ['Order Date', 'OrderDate']),
        'Client Name': ordPickField(r, ['Client Name', 'ClientName', 'AccountName']),
        'Part Code': ordPickField(r, ['Part Code', 'PartCode', 'Item Code', 'ItemCode']),
        'Part Name': ordPickField(r, ['Part Name', 'PartName', 'Item Name', 'ItemName']),
        'Dispatch Qty': ordParseAmount(ordPickField(r, ['Dispatch Qty', 'DispatchQty'])),
        'Order Rate': ordParseAmount(ordPickField(r, ['Order Rate', 'OrderRate'])),
        'Dispatch Rate': ordParseAmount(ordPickField(r, ['Dispatch Rate', 'DispatchRate'])),
        'MRP Deff': ordParseAmount(ordPickField(r, ['MRP Deff', 'MRP Diff', 'MRPDeff', 'MRPDiff']))
    };
}

function ordBuildDisplayRows(rows) {
    return rows.map(function (r, idx) {
        return ordNormalizeGridRow(r, idx);
    });
}

function ordRenderFooterTotals(rows) {
    var dispatchQtyTotal = 0;
    var mrpDiffTotal = 0;
    rows.forEach(function (r, idx) {
        var n = ordNormalizeGridRow(r, idx);
        dispatchQtyTotal += ordParseAmount(n['Dispatch Qty']);
        mrpDiffTotal += ordParseAmount(n['MRP Deff']);
    });

    var $footer = $('#table-footer');
    $footer.empty();
    if (!rows.length) return;

    var numericKeys = {
        'S.No': true,
        'Dispatch Qty': true,
        'Order Rate': true,
        'Dispatch Rate': true,
        'MRP Deff': true
    };
    var keys = ORD_GRID_COLUMNS;
    var html = '<tr class="ord-grid-total-row">';
    keys.forEach(function (key) {
        var val = '';
        if (key === 'S.No') val = 'Total';
        else if (key === 'Dispatch Qty') val = dispatchQtyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        else if (key === 'MRP Deff') val = ordFormatRupee(mrpDiffTotal);
        var align = numericKeys[key] ? ' text-end' : '';
        html += '<td class="' + align.trim() + '">' + val + '</td>';
    });
    html += '</tr>';
    $footer.html(html);
}

function ordRenderGrid(rows) {
    if (!rows.length) {
        ordShowPlaceholder();
        $('#table-header').empty();
        $('#table-body').empty();
        $('#table-footer').empty();
        $('#paginator-table').empty();
        toastr.error('Record not found...!');
        return;
    }

    ordShowContent();
    ordUpdateKpis(rows);

    var StringFilterColumn = [
        'Order No', 'Order Date', 'Client Name', 'Part Code', 'Part Name'
    ];
    var NumericFilterColumn = [
        'S.No', 'Dispatch Qty', 'Order Rate', 'Dispatch Rate', 'MRP Deff'
    ];
    var DateFilterColumn = [];
    var hiddenCols = [];
    var align = {
        'S.No': 'right',
        'Dispatch Qty': 'right',
        'Order Rate': 'right',
        'Dispatch Rate': 'right',
        'MRP Deff': 'right'
    };

    var displayRows = ordBuildDisplayRows(rows);

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

    ordRenderFooterTotals(rows);
}

async function Report() {
    if (typeof CheckOptionPermission === 'function') {
        const { hasPermission, msg } = await CheckOptionPermission('Download', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission === false) {
            toastr.error(msg);
            return;
        }
    }
    GetOrderReport();
}

function GetOrderReport() {
    var filters = ordValidateFilters();
    if (!filters) return;

    blockUI();
    $.ajax({
        url: appBaseURL + API_ORDER_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate,
            AccountMaster_Code: filters.AccountMaster_Code
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_OrdReportRows = ordExtractRows(response);
            ordRenderGrid(G_OrdReportRows);
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetOrderReport', xhr.status, xhr.responseText || error);
            G_OrdReportRows = [];
            ordShowPlaceholder();
            toastr.error('Unable to load Order report.');
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

    var filters = ordValidateFilters();
    if (!filters) return;

    if (G_OrdReportRows.length > 0) {
        await ordExportExcel(G_OrdReportRows, filters);
        return;
    }

    blockUI();
    $.ajax({
        url: appBaseURL + API_ORDER_REPORT,
        type: 'GET',
        data: {
            FromDate: filters.FromDate,
            ToDate: filters.ToDate,
            AccountMaster_Code: filters.AccountMaster_Code
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            var rows = ordExtractRows(response);
            if (rows.length > 0) {
                await ordExportExcel(rows, filters);
            } else {
                toastr.error('Record not found...!');
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('GetOrderReport', xhr.status, xhr.responseText || error);
            toastr.error('Unable to download Order report.');
            unblockUI();
        }
    });
}

async function ordExportExcel(Data, filters) {
    var displayRows = Data.map(function (r, idx) { return ordNormalizeGridRow(r, idx); });
    var originalHeaders = ORD_GRID_COLUMNS.slice();

    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet('Order Report');
    var headerRow = sheet.addRow(originalHeaders);
    headerRow.eachCell(function (cell) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    });

    displayRows.forEach(function (item) {
        var row = originalHeaders.map(function (key) { return item[key]; });
        sheet.addRow(row);
    });

    var dispatchQtyTotal = 0;
    var mrpDiffTotal = 0;
    displayRows.forEach(function (r) {
        dispatchQtyTotal += ordParseAmount(r['Dispatch Qty']);
        mrpDiffTotal += ordParseAmount(r['MRP Deff']);
    });
    var totalRow = originalHeaders.map(function (key) {
        if (key === 'S.No') return 'Total';
        if (key === 'Dispatch Qty') return dispatchQtyTotal;
        if (key === 'MRP Deff') return mrpDiffTotal;
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
    var clientText = ($('#ddlOrdClient option:selected').text() || 'All').trim();
    var clientSuffix = filters.AccountMaster_Code
        ? '_' + (clientText.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || filters.AccountMaster_Code)
        : '';
    a.download = 'OrderReport' + clientSuffix + '_' + filters.ToDate.replace(/-/g, '') + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
const appBaseURL = sessionStorage.getItem('AppBaseURL') || '';
var API_PENDING_INVOICE_REPORT = '/api/PaymentEntry/GetPendingInvoiceReport';
var API_PARTY_LIST = '/api/Master/GetAccountIsClientDropDown';
var G_OsRawRows = [];
var G_OsFilteredRows = [];
var G_OsCharts = {};

var OS_CHART_COLORS = {
    primary:   '#6366f1',
    secondary: '#0ea5e9',
    accent:    '#8b5cf6',
    highlight: '#a855f7',
    ageing:    ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    grouped:   ['#0ea5e9', '#10b981'],
    area:      '#8b5cf6',
    horizontal: {
        chartOsTopParties:  '#7c3aed',
        chartOsCreditDelay: '#f43f5e'
    }
};

function osPad2(n) { return String(n).padStart(2, '0'); }

function osParseAmount(v) {
    if (v == null || v === '') return 0;
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function osFormatAmt(v) {
    v = parseFloat(v);
    if (isNaN(v)) return '0.00';
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function osFormatRupee(v) {
    return '\u20B9 ' + osFormatAmt(v);
}

function osPick(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function osParseDelayDays(row) {
    var d = osPick(row, ['DealyDays', 'DelayDays', 'Delay Days']);
    var n = parseInt(String(d).replace(/[^0-9-]/g, ''), 10);
    return isNaN(n) ? 0 : Math.max(0, n);
}

function osParseCreditDays(row) {
    var c = osPick(row, ['CreditDays', 'Credit Days']);
    var n = parseInt(String(c).replace(/[^0-9-]/g, ''), 10);
    return isNaN(n) ? 0 : Math.max(0, n);
}

/** API: GetPendingInvoiceReport — Code, InvoiceDate, DealyDays, Amount, PaymentAmount, AccountName, AccountMaster_Code, CreditDays */
function osNormalizeRow(r, idx) {
    var amount = osParseAmount(r.Amount);
    var paymentAmount = osParseAmount(r.PaymentAmount);
    var outstanding = Math.max(0, amount - paymentAmount);
    var delayDays = osParseDelayDays(r);
    var creditDays = osParseCreditDays(r);
    var invoiceDateRaw = r.InvoiceDate != null ? String(r.InvoiceDate) : '';

    return {
        __index: idx,
        Code: r.Code != null ? r.Code : '',
        AccountMaster_Code: r.AccountMaster_Code != null ? r.AccountMaster_Code : 0,
        InvoiceDate: invoiceDateRaw,
        InvoiceDateDisplay: osFormatInvoiceDate(invoiceDateRaw),
        AccountName: String(r.AccountName || '').trim() || '—',
        Amount: amount,
        PaymentAmount: paymentAmount,
        OutstandingAmount: outstanding,
        DelayDays: delayDays,
        CreditDays: creditDays,
        OverdueAmount: delayDays > creditDays ? outstanding : 0,
        raw: r
    };
}

function osFormatInvoiceDate(dateVal) {
    if (!dateVal) return '—';
    var s = String(dateVal).trim();
    if (s.indexOf(' ') >= 0) s = s.split(' ')[0];
    var d = osParseDateDmy(s);
    if (!d) return s;
    return osPad2(d.getDate()) + '-' + osPad2(d.getMonth() + 1) + '-' + d.getFullYear();
}

/** Convert UI date (dd-mm-yyyy) to API format yyyy-MM-dd e.g. 2026-05-25 */
function osToApiDate(dateStr) {
    if (!dateStr) return '';
    var s = String(dateStr).trim();
    if (s.indexOf(' ') >= 0) s = s.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var sep = s.indexOf('-') >= 0 ? '-' : (s.indexOf('/') >= 0 ? '/' : null);
    if (!sep) return s;
    var p = s.split(sep);
    if (p.length < 3) return s;
    var day, month, year;
    if (p[0].length === 4) {
        year = parseInt(p[0], 10);
        month = parseInt(p[1], 10);
        day = parseInt(p[2], 10);
    } else {
        day = parseInt(p[0], 10);
        month = parseInt(p[1], 10);
        year = parseInt(p[2], 10);
    }
    if (year < 100) year += 2000;
    return osPad2(year) + '-' + osPad2(month) + '-' + osPad2(day);
}

function osParseDateDmy(str) {
    if (!str) return null;
    var s = String(str).trim();
    if (s.indexOf(' ') >= 0) s = s.split(' ')[0];
    if (s.indexOf('T') >= 0) {
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }
    var sep = s.indexOf('-') >= 0 ? '-' : (s.indexOf('/') >= 0 ? '/' : null);
    if (!sep) return null;
    var p = s.split(sep);
    if (p.length < 3) return null;
    var day, month, year;
    if (p[0].length === 4) {
        year = parseInt(p[0], 10);
        month = parseInt(p[1], 10) - 1;
        day = parseInt(p[2], 10);
    } else {
        day = parseInt(p[0], 10);
        month = parseInt(p[1], 10) - 1;
        year = parseInt(p[2], 10);
    }
    if (year < 100) year += 2000;
    var dt = new Date(year, month, day);
    return isNaN(dt.getTime()) ? null : dt;
}

function osExtractRows(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.data)) return res.data;
    if (res.Data && Array.isArray(res.Data.List)) return res.Data.List;
    if (res.data && Array.isArray(res.data.List)) return res.data.List;
    return [];
}

function osToastError(msg) {
    if (typeof toastr !== 'undefined') toastr.error(msg);
    else alert(msg);
}

function osDestroyCharts() {
    Object.keys(G_OsCharts).forEach(function (key) {
        try {
            if (G_OsCharts[key]) G_OsCharts[key].destroy();
        } catch (e) { /* ignore */ }
        G_OsCharts[key] = null;
    });
}

function osShowEmptyChart(elId, msg) {
    $('#' + elId).html('<div class="os-empty-chart">' + (msg || 'No data') + '</div>');
}

function osEnsurePerPageSize() {
    try {
        var raw = sessionStorage.getItem('PerPageSize');
        if (!raw || raw === 'null') {
            sessionStorage.setItem('PerPageSize', JSON.stringify([
                { PerPage: 10, PerPageOption: '10,25,50,100' }
            ]));
        }
    } catch (e) { /* ignore */ }
}

$(document).ready(function () {
    $('#ERPHeading').text('Bill Wise Outstanding');
    osEnsurePerPageSize();
    osInitDatepicker();
    osInitSelect2();
    osLoadPartyDropdown();
    osBindGridFooterUpdates();

    $('#btnOsShow').on('click', function () { osLoadReport(); });
    $('#btnOsDownload').on('click', function () { osDownloadExcel(); });
});

function osInitDatepicker() {
    $('#txtOsAsonDate').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        todayHighlight: true
    });
    $.ajax({
        url: appBaseURL + '/api/Master/GetCurrentDate',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            if (res && res.length > 0 && res[0].Date) {
                $('#txtOsAsonDate').datepicker('setDate', res[0].Date);
            } else {
                $('#txtOsAsonDate').datepicker('setDate', new Date());
            }
        },
        error: function () {
            $('#txtOsAsonDate').datepicker('setDate', new Date());
        }
    });
}

function osInitSelect2() {
    $('#ddlOsParty').select2({ theme: 'default', width: '100%', allowClear: true });
}

function osLoadPartyDropdown() {
    $.ajax({
        url: appBaseURL + API_PARTY_LIST,
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            var opts = '<option value="">All parties</option>';
            if (res && res.length) {
                $.each(res, function (i, item) {
                    opts += '<option value="' + item.Code + '">' + (item.AccountName || '') + '</option>';
                });
            }
            $('#ddlOsParty').html(opts).trigger('change');
        }
    });
}

function osLoadReport() {
    var asonDateUi = ($('#txtOsAsonDate').val() || '').trim();
    var asonDateApi = osToApiDate(asonDateUi);
    var accountCode = $('#ddlOsParty').val() || '0';

    if (!asonDateUi) {
        osToastError('Please select As on Date.');
        $('#txtOsAsonDate').focus();
        return;
    }

    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: appBaseURL + API_PENDING_INVOICE_REPORT,
        type: 'GET',
        data: {
            AsonDate: asonDateApi,
            AccountMaster_Code: accountCode || 0
        },
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            if (typeof unblockUI === 'function') unblockUI();
            G_OsRawRows = osExtractRows(res).map(osNormalizeRow);
            if (!G_OsRawRows.length) {
                osToastError('Record not found.');
                osUpdateReportMeta([]);
                $('#osReportContent').hide();
                $('#osReportPlaceholder').show();
                $('#btnOsDownload').prop('disabled', true);
                osDestroyCharts();
                return;
            }
            $('#osReportPlaceholder').hide();
            $('#osReportContent').show();
            $('#btnOsDownload').prop('disabled', false);
            osApplyFiltersAndRender();
        },
        error: function (xhr) {
            if (typeof unblockUI === 'function') unblockUI();
            console.error('GetPendingInvoiceReport', xhr.status, xhr.responseText);
            osToastError('Unable to load outstanding report.');
            G_OsRawRows = [];
            $('#osReportContent').hide();
            $('#osReportPlaceholder').show();
            $('#btnOsDownload').prop('disabled', true);
        }
    });
}

function osUpdateReportMeta(rows) {
    var asOn = ($('#txtOsAsonDate').val() || '').trim();
    var partySel = $('#ddlOsParty option:selected');
    var partyLabel = (partySel.val() ? partySel.text() : 'All parties').trim();
    if (!rows || !rows.length) {
        $('#osReportMeta').text('No records · As on ' + asOn);
        return;
    }
    $('#osReportMeta').text(rows.length + ' bill(s) · ' + osTruncateLabel(partyLabel, 28) + ' · As on ' + asOn);
}

function osApplyFiltersAndRender() {
    G_OsFilteredRows = G_OsRawRows.slice();

    osUpdateReportMeta(G_OsFilteredRows);
    osUpdateKpis(G_OsFilteredRows);
    osRenderCharts(G_OsFilteredRows);
    osRenderDetailGrid(G_OsFilteredRows);
}

function osUpdateKpis(rows) {
    var total = 0, delaySum = 0, overdue = 0, cnt = 0;
    $.each(rows, function (i, r) {
        total += r.OutstandingAmount;
        delaySum += r.DelayDays;
        if (r.DelayDays > r.CreditDays) {
            overdue += r.OutstandingAmount;
        }
        cnt++;
    });
    $('#osKpiTotal').text(osFormatRupee(total));
    $('#osKpiAvgDelay').text(cnt ? Math.round(delaySum / cnt) : '0');
    $('#osKpiOverdue').text(osFormatRupee(overdue));
}

function osBucketLabel(days) {
    if (days <= 30) return '0–30 days';
    if (days <= 60) return '31–60 days';
    if (days <= 90) return '61–90 days';
    if (days <= 120) return '91–120 days';
    return '120+ days';
}

function osAggregateByKey(rows, keyFn, valFn, limit) {
    var map = {};
    $.each(rows, function (i, r) {
        var k = String(keyFn(r) || '').trim();
        if (!k || k === '—') return;
        map[k] = (map[k] || 0) + valFn(r);
    });
    var arr = Object.keys(map).map(function (k) {
        return { label: k, value: map[k] };
    });
    arr.sort(function (a, b) { return b.value - a.value; });
    if (limit) arr = arr.slice(0, limit);
    return arr;
}

function osFormatAxisAmount(v) {
    var n = parseFloat(v);
    if (isNaN(n)) return v;
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return Math.round(n).toString();
}

function osTruncateLabel(text, maxLen) {
    var s = String(text || '');
    if (s.length <= maxLen) return s;
    return s.substring(0, maxLen - 1) + '…';
}

function osSanitizeNumbers(arr) {
    return (arr || []).map(function (v) {
        var n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    });
}

function osChartDataLabels(position) {
    return {
        enabled: true,
        formatter: function (val) { return osFormatRupee(val); },
        offsetX: position === 'right' ? 6 : 0,
        offsetY: position === 'top' ? -18 : 0,
        style: { fontSize: '10px', fontWeight: 600, colors: ['#334155'] }
    };
}

function osChartTooltip() {
    return {
        y: { formatter: function (v) { return osFormatRupee(v); } }
    };
}

function osRenderChartBar(elId, categories, seriesData, horizontal) {
    var el = document.querySelector('#' + elId);
    if (!el || typeof ApexCharts === 'undefined') {
        osShowEmptyChart(elId, 'Chart library not available');
        return;
    }
    if (G_OsCharts[elId]) {
        G_OsCharts[elId].destroy();
        G_OsCharts[elId] = null;
    }
    if (!categories.length) {
        osShowEmptyChart(elId, 'No data for chart');
        return;
    }
    el.innerHTML = '';

    categories = categories.map(function (c) { return String(c || '—'); });
    seriesData = osSanitizeNumbers(seriesData);

    var barColors = horizontal
        ? (OS_CHART_COLORS.horizontal[elId] || OS_CHART_COLORS.highlight)
        : (elId === 'chartOsAgeing' ? OS_CHART_COLORS.ageing : OS_CHART_COLORS.primary);

    var xyData = categories.map(function (cat, i) {
        return { x: cat, y: seriesData[i] };
    });

    var opts = {
        chart: {
            type: 'bar',
            height: horizontal ? Math.max(300, categories.length * 38 + 70) : 280,
            toolbar: { show: false },
            fontFamily: 'DM Sans, system-ui, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: !!horizontal,
                borderRadius: 4,
                columnWidth: horizontal ? undefined : '55%',
                barHeight: horizontal ? '72%' : undefined,
                distributed: !horizontal && elId === 'chartOsAgeing',
                dataLabels: { position: horizontal ? 'right' : 'top' }
            }
        },
        dataLabels: osChartDataLabels(horizontal ? 'right' : 'top'),
        colors: barColors,
        series: [{ name: 'Outstanding', data: xyData }],
        grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
        tooltip: osChartTooltip()
    };

    if (horizontal) {
        opts.xaxis = {
            type: 'numeric',
            labels: {
                formatter: function (v) { return osFormatAxisAmount(v); },
                style: { fontSize: '11px', colors: '#64748b' }
            }
        };
        opts.yaxis = {
            labels: {
                style: { fontSize: '11px', colors: '#334155' },
                maxWidth: 240,
                formatter: function (val) { return osTruncateLabel(val, 32); }
            }
        };
    } else {
        opts.xaxis = {
            type: 'category',
            labels: {
                rotate: -25,
                style: { fontSize: '10px', colors: '#64748b' },
                formatter: function (val) { return osTruncateLabel(val, 14); }
            }
        };
        opts.yaxis = {
            labels: {
                formatter: function (v) { return osFormatAxisAmount(v); },
                style: { fontSize: '11px', colors: '#64748b' }
            }
        };
    }

    G_OsCharts[elId] = new ApexCharts(el, opts);
    G_OsCharts[elId].render();
}

function osRenderChartGroupedBar(elId, categories, series) {
    var el = document.querySelector('#' + elId);
    if (!el || typeof ApexCharts === 'undefined') {
        osShowEmptyChart(elId, 'Chart library not available');
        return;
    }
    if (G_OsCharts[elId]) {
        G_OsCharts[elId].destroy();
        G_OsCharts[elId] = null;
    }
    if (!categories.length) {
        osShowEmptyChart(elId, 'No data for chart');
        return;
    }
    el.innerHTML = '';

    categories = categories.map(function (c) { return String(c || '—'); });
    var normalizedSeries = (series || []).map(function (s) {
        return {
            name: s.name,
            data: categories.map(function (cat, i) {
                return { x: cat, y: osSanitizeNumbers([s.data[i]])[0] };
            })
        };
    });

    var opts = {
        chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'DM Sans, system-ui, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 3,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: osChartDataLabels('top'),
        colors: OS_CHART_COLORS.grouped,
        series: normalizedSeries,
        xaxis: {
            type: 'category',
            labels: {
                rotate: -35,
                style: { fontSize: '10px', colors: '#64748b' },
                formatter: function (val) { return osTruncateLabel(val, 16); }
            }
        },
        yaxis: {
            labels: {
                formatter: function (v) { return osFormatAxisAmount(v); },
                style: { fontSize: '11px', colors: '#64748b' }
            }
        },
        legend: { position: 'top', fontSize: '12px' },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
        tooltip: osChartTooltip()
    };
    G_OsCharts[elId] = new ApexCharts(el, opts);
    G_OsCharts[elId].render();
}

function osRenderChartLine(elId, categories, seriesData) {
    var el = document.querySelector('#' + elId);
    if (!el || typeof ApexCharts === 'undefined') {
        osShowEmptyChart(elId, 'Chart library not available');
        return;
    }
    if (G_OsCharts[elId]) {
        G_OsCharts[elId].destroy();
        G_OsCharts[elId] = null;
    }
    if (!categories.length) {
        osShowEmptyChart(elId, 'No data for chart');
        return;
    }
    el.innerHTML = '';

    categories = categories.map(function (c) { return String(c || '—'); });
    seriesData = osSanitizeNumbers(seriesData);
    var xyData = categories.map(function (cat, i) {
        return { x: cat, y: seriesData[i] };
    });

    var opts = {
        chart: {
            type: 'area',
            height: 280,
            toolbar: { show: false },
            fontFamily: 'DM Sans, system-ui, sans-serif'
        },
        stroke: { curve: 'smooth', width: 2 },
        colors: [OS_CHART_COLORS.area],
        dataLabels: osChartDataLabels('top'),
        series: [{ name: 'Outstanding', data: xyData }],
        xaxis: {
            type: 'category',
            labels: {
                rotate: -30,
                style: { fontSize: '10px', colors: '#64748b' },
                formatter: function (val) { return osTruncateLabel(val, 12); }
            }
        },
        yaxis: {
            labels: {
                formatter: function (v) { return osFormatAxisAmount(v); },
                style: { fontSize: '11px', colors: '#64748b' }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 0.4,
                opacityFrom: 0.55,
                opacityTo: 0.08,
                stops: [0, 90, 100]
            }
        },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
        tooltip: osChartTooltip(),
        markers: { size: 4, strokeWidth: 2, hover: { size: 6 } }
    };
    G_OsCharts[elId] = new ApexCharts(el, opts);
    G_OsCharts[elId].render();
}

function osRenderCharts(rows) {
    osDestroyCharts();

    var bucketOrder = ['0–30 days', '31–60 days', '61–90 days', '91–120 days', '120+ days'];
    var bucketMap = {};
    bucketOrder.forEach(function (b) { bucketMap[b] = 0; });
    $.each(rows, function (i, r) {
        var b = osBucketLabel(r.DelayDays);
        bucketMap[b] = (bucketMap[b] || 0) + r.OutstandingAmount;
    });
    osRenderChartBar('chartOsAgeing', bucketOrder, bucketOrder.map(function (b) { return bucketMap[b] || 0; }), false);

    var topParties = osAggregateByKey(rows, function (r) { return r.AccountName; }, function (r) { return r.OutstandingAmount; }, 10);
    osRenderChartBar(
        'chartOsTopParties',
        topParties.map(function (x) { return x.label; }),
        topParties.map(function (x) { return x.value; }),
        true
    );

    var monthMap = {};
    $.each(rows, function (i, r) {
        var d = osParseDateDmy(r.InvoiceDate);
        if (!d) return;
        var key = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + '-' + d.getFullYear();
        monthMap[key] = (monthMap[key] || 0) + r.OutstandingAmount;
    });
    var monthKeys = Object.keys(monthMap).sort(function (a, b) {
        var pa = a.split('-'), pb = b.split('-');
        var ma = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(pa[0]);
        var mb = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(pb[0]);
        if (pa[1] !== pb[1]) return parseInt(pa[1], 10) - parseInt(pb[1], 10);
        return ma - mb;
    });
    osRenderChartLine('chartOsMonthlyTrend', monthKeys, monthKeys.map(function (k) { return monthMap[k]; }));

    var topBillColl = osAggregateByKey(rows, function (r) { return r.AccountName; }, function (r) { return r.OutstandingAmount; }, 10);
    var billed = [], collected = [], labels = [];
    $.each(topBillColl, function (i, x) {
        labels.push(x.label);
        var partyRows = rows.filter(function (r) { return r.AccountName === x.label; });
        var b = 0, c = 0;
        $.each(partyRows, function (j, r) {
            b += r.Amount;
            c += r.PaymentAmount;
        });
        billed.push(b);
        collected.push(c);
    });
    osRenderChartGroupedBar('chartOsBilledCollected', labels, [
        { name: 'Amount', data: billed },
        { name: 'Payment', data: collected }
    ]);

    var creditDelayParties = osAggregateByKey(
        rows.filter(function (r) {
            return r.DelayDays > r.CreditDays;
        }),
        function (r) { return r.AccountName; },
        function (r) { return r.OutstandingAmount; },
        10
    );
    osRenderChartBar(
        'chartOsCreditDelay',
        creditDelayParties.map(function (x) { return x.label; }),
        creditDelayParties.map(function (x) { return x.value; }),
        true
    );
}

function osBindGridFooterUpdates() {
    if (window._osGridFooterHooked) return;
    window._osGridFooterHooked = true;

    var origRender = window.renderTable;
    var origRenderPag = window.renderTableWithPagination;
    var origClear = window.ClearFilter;

    window.renderTable = function (items, bodyId) {
        if (origRender) origRender.apply(this, arguments);
        if (bodyId === 'table-body') osUpdateGridFooter();
    };
    window.renderTableWithPagination = function (tableId, bodyId) {
        if (origRenderPag) origRenderPag.apply(this, arguments);
        if (bodyId === 'table-body') osUpdateGridFooter();
    };
    window.ClearFilter = function (bodyId) {
        if (origClear) origClear.apply(this, arguments);
        if (bodyId === 'table-body') osUpdateGridFooter();
    };
}

function osUpdateGridFooter() {
    var tableId = 'table';
    var bodyId = 'table-body';
    var data = window['filteredData_' + tableId] || [];
    var $foot = $('#table-footer');

    if (!data.length) {
        $foot.empty();
        return;
    }

    var hiddenCols = window['hiddenColumns_' + bodyId] || [];
    var cols = Object.keys(data[0]);
    var sumAmt = 0, sumPay = 0, sumOut = 0, sumDelay = 0, sumCredit = 0;

    $.each(data, function (i, row) {
        sumAmt += osParseAmount(row.Amount_Num);
        sumPay += osParseAmount(row.Payment_Num);
        sumOut += osParseAmount(row.Outstanding_Num);
        sumDelay += parseInt(row['Delay Days'], 10) || 0;
        sumCredit += parseInt(row['Credit Days'], 10) || 0;
    });

    var html = '<tr class="os-grid-total-row">';
    $.each(cols, function (i, col) {
        var val = '';
        var alignClass = '';
        var hide = hiddenCols.indexOf(col) >= 0;

        if (col === 'S.No') {
            val = 'Total (' + data.length + ')';
        } else if (col === 'Amount') {
            val = osFormatRupee(sumAmt);
            alignClass = 'text-end';
        } else if (col === 'Payment Amount') {
            val = osFormatRupee(sumPay);
            alignClass = 'text-end';
        } else if (col === 'Outstanding') {
            val = osFormatRupee(sumOut);
            alignClass = 'text-end';
        } else if (col === 'Delay Days') {
            val = sumDelay;
            alignClass = 'text-end';
        } else if (col === 'Credit Days') {
            val = sumCredit;
            alignClass = 'text-end';
        }

        var style = hide ? 'display:none;' : '';
        html += '<td class="' + alignClass + '" style="' + style + '">' + val + '</td>';
    });
    html += '</tr>';
    $foot.html(html);
}

function osRenderDetailGrid(rows) {
    if (typeof BizsolCustomFilterGrid === 'undefined' || !BizsolCustomFilterGrid.CreateDataTable) {
        osToastError('Filter grid script not loaded. Please refresh the page.');
        console.error('Include ~/assets/js/filter.js before OutstandingReport.js');
        return;
    }

    if (!rows.length) {
        $('#osDetailTable').hide();
        $('#table-header').empty();
        $('#table-body').html('<tr><td colspan="9" class="text-center text-muted py-4">No records found.</td></tr>');
        $('#table-footer').empty();
        $('#paginator-table').empty();
        return;
    }

    $('#osDetailTable').show();

    var StringFilterColumn = [
        'Account Name', 'Invoice Date', 'Amount', 'Payment Amount', 'Outstanding'
    ];
    var NumericFilterColumn = ['Delay Days', 'Credit Days'];
    var DateFilterColumn = [];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['AccountMaster_Code', 'Code', 'Amount_Num', 'Payment_Num', 'Outstanding_Num'];
    var ColumnAlignment = {
        'S.No': 'right',
        'Amount': 'right',
        'Payment Amount': 'right',
        'Outstanding': 'right',
        'Delay Days': 'right',
        'Credit Days': 'right'
    };

    var gridRows = rows.map(function (r, i) {
        return {
            'S.No': i + 1,
            Code: r.Code,
            AccountMaster_Code: r.AccountMaster_Code,
            'Invoice Date': r.InvoiceDateDisplay,
            'Account Name': r.AccountName,
            Amount: osFormatRupee(r.Amount),
            'Payment Amount': osFormatRupee(r.PaymentAmount),
            Outstanding: osFormatRupee(r.OutstandingAmount),
            'Delay Days': r.DelayDays,
            'Credit Days': r.CreditDays,
            Amount_Num: r.Amount,
            Payment_Num: r.PaymentAmount,
            Outstanding_Num: r.OutstandingAmount
        };
    });

    osBindGridFooterUpdates();

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header',
        'table-body',
        gridRows,
        false,
        [],
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        true
    );

    osUpdateGridFooter();
}

function osDownloadExcel() {
    if (!G_OsFilteredRows.length) {
        osToastError('No data to download.');
        return;
    }
    var exportData = G_OsFilteredRows.map(function (r, i) {
        return {
            'S.No': i + 1,
            'Code': r.Code,
            'InvoiceDate': r.InvoiceDateDisplay,
            'AccountName': r.AccountName,
            'AccountMaster_Code': r.AccountMaster_Code,
            'Amount': r.Amount,
            'PaymentAmount': r.PaymentAmount,
            'Outstanding': r.OutstandingAmount,
            'DealyDays': r.DelayDays,
            'CreditDays': r.CreditDays
        };
    });
    var ws = XLSX.utils.json_to_sheet(exportData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding');
    var date = ($('#txtOsAsonDate').val() || 'report').replace(/\//g, '-');
    XLSX.writeFile(wb, 'BillWiseOutstanding_' + date + '.xlsx');
}

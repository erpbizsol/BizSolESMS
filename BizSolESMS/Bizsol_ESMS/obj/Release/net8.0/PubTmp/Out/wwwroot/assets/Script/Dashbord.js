/* ============================================================================
 * Dashboard — dynamic data loader with FromDate / ToDate filter.
 *
 * Backed by the stored procedure USP_DailyStockReport via the API:
 *   GET {appBaseURL}/api/Dashbord/GetDailyStockReport?FromDate=yyyy-MM-dd&ToDate=yyyy-MM-dd
 *   Header: Auth-Key
 *   (If your API exposes this on a different controller, change API_DAILY_STOCK
 *    below — e.g. '/api/Report/GetDailyStockReport'.)
 *
 * Response = VM_DailyStockReport:
 * {
 *   "DailyOrderReport":  [{ OrderStatus, TotalOrderCount, TotalAmount }],
 *   "LossOrderReport":   [{ TotalItems, QtyGreaterThanZero, QtyEqualToZero, Date, Month, QtyLessThanZero }],
 *   "DeadStock":         [{ PartNo, PurchaseQty, PartDescription, DTC, TotalValue }],
 *   "MonthWiseSale":     [{ Month, TotalMonthAmount }],
 *   "AverageTrunAround": [{ ItemCode, StockQTY, ScanQty, Difference, IsAudit, DTC, PartDescription, TotalValue }],
 *   "Top10MaximumOrderParty": [{ AccountMaster_Code, AccountName, Ocount, order_count, ... }],
 *   "Top10MinimumOrderParty": [{ AccountMaster_Code, AccountName, Ocount, order_count, ... }],
 *   "Employee":          [{ Name, Unloaded, NoOfOrderPacked, NoOfOrderDispatch }],
 *   "UserWeeklyReport":  [{ Name, 2026_Aug_Week1_Unloaded, 2026_Aug_Week1_Packed, ... }],
 *   "SaleLossOrder":     [{ TotalLineOfProduct, TotalProductQty, TotalValue }],
 *   "ReorderLevelData":  [{ Item Code, Item Name, Reorder Level, Balance Qty, ... }],
 *   "SaleReturn":        [{ PartyName, OrderNo, Reason, Value }],
 *   "TatConfig":         [{ MinKM, MaxKM }],
 *   "TatMaster":         [{ Division, InvoiceA..D, ActualA..D }],
 *   "StockSummary":      [{ Status, Date }]
 * }
 * ==========================================================================*/

var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = null; }
var appBaseURL = sessionStorage.getItem('AppBaseURL') || (typeof AppBaseURL !== 'undefined' ? AppBaseURL : '');

var API_DAILY_STOCK = '/api/OrderMaster/GetDailyStockReport';
var API_CURRENT_DATE = '/api/Master/GetCurrentDate';
var API_PENDING_INVOICE_REPORT = '/api/PaymentEntry/GetPendingInvoiceReport';
var G_DashCharts = {};

$(document).ready(function () {
    $('#ERPHeading').text('Dashboard');

    $('#txtDashFromDate, #txtDashToDate').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        todayHighlight: true
    });

    $('#btnDashApply').on('click', function () { LoadDashboard(); });
    $('#btnDashReset').on('click', function () { SetDefaultDates(true); });

    InitDefaultDatesAndLoad();
});

/* ── Date helpers ──────────────────────────────────────────────────────── */
function dashPad2(n) { return String(n).padStart(2, '0'); }

function dashToApiDate(uiDate) {
    if (!uiDate) return '';
    var p = uiDate.split('-');
    if (p.length !== 3) return uiDate;
    return p[2] + '-' + p[1] + '-' + p[0];
}

function dashParseApiDate(str) {
    if (str == null || str === '') return null;
    var s = String(str).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return new Date(s.slice(0, 10) + 'T12:00:00');
    }
    var m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) {
        return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), 12, 0, 0);
    }
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
        return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), 12, 0, 0);
    }
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function SetDefaultDates(reload) {
    var today = new Date();
    var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtDashFromDate').datepicker('setDate', firstOfMonth);
    $('#txtDashToDate').datepicker('setDate', today);
    if (reload) { LoadDashboard(); }
}

function InitDefaultDatesAndLoad() {
    $.ajax({
        url: appBaseURL + API_CURRENT_DATE,
        type: 'GET',
        beforeSend: function (xhr) { if (authKeyData) xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            var today;
            if (res && res.length > 0 && res[0].Date) {
                today = dashParseApiDate(res[0].Date);
                if (!today || isNaN(today.getTime())) { today = new Date(); }
            } else {
                today = new Date();
            }
            var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            $('#txtDashFromDate').datepicker('setDate', firstOfMonth);
            $('#txtDashToDate').datepicker('setDate', today);
            LoadDashboard();
        },
        error: function () {
            SetDefaultDates(false);
            LoadDashboard();
        }
    });
}

/* ── Generic helpers ───────────────────────────────────────────────────── */
function dashGet(obj, keys, fallback) {
    if (obj == null) return fallback;
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return fallback;
}

function dashSetText(id, val) {
    var el = document.getElementById(id);
    if (el) { el.textContent = (val === undefined || val === null || val === '') ? '—' : val; }
}

function dashArr(res, keys) {
    var v = dashGet(res, keys, []);
    return Array.isArray(v) ? v : [];
}

function dashResolveData(res) {
    if (res == null) return {};
    if (typeof res === 'string') {
        try { return dashResolveData(JSON.parse(res)); } catch (e) { return {}; }
    }
    if (Array.isArray(res)) return res.length ? res[0] : {};
    return res;
}

function dashToast(type, msg) {
    if (typeof toastr !== 'undefined' && toastr[type]) { toastr[type](msg); }
}

function dashNum(v) {
    if (v === undefined || v === null) return 0;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
}

function dashInt(v) {
    return Math.round(dashNum(v));
}

/** Indian-grouped number, no decimals for whole values. */
function dashIndian(n) {
    n = dashNum(n);
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Full rupee, e.g. ₹ 1,24,500.00 */
function dashRupee(v) {
    return '\u20B9 ' + dashNum(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Compact rupee for KPI tiles: ₹84.2L / ₹9.2Cr / ₹4,500 */
function dashCompactRupee(v) {
    var n = dashNum(v);
    var sign = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (n >= 1e7) return sign + '\u20B9' + (n / 1e7).toFixed(2).replace(/\.00$/, '') + 'Cr';
    if (n >= 1e5) return sign + '\u20B9' + (n / 1e5).toFixed(2).replace(/\.00$/, '') + 'L';
    if (n >= 1e3) return sign + '\u20B9' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return sign + '\u20B9' + n.toLocaleString('en-IN');
}

function dashEscape(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function dashDestroyChart(id) {
    if (G_DashCharts[id]) {
        G_DashCharts[id].destroy();
        G_DashCharts[id] = null;
    }
}

function dashFormatAxisAmount(v) {
    var n = dashNum(v);
    if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return String(Math.round(n));
}

function dashShowChartEmpty(elId, msg) {
    var el = document.getElementById(elId);
    if (el) {
        el.innerHTML = '<div class="text-muted d-flex align-items-center justify-content-center" style="font-size:0.8rem;min-height:260px;">' + dashEscape(msg || 'No data') + '</div>';
    }
}

/* ── Main loader ───────────────────────────────────────────────────────── */
function LoadDashboard() {
    var fromUi = ($('#txtDashFromDate').val() || '').trim();
    var toUi = ($('#txtDashToDate').val() || '').trim();

    if (!fromUi || !toUi) {
        dashToast('warning', 'Please select both From Date and To Date.');
        return;
    }

    var fromApi = dashToApiDate(fromUi);
    var toApi = dashToApiDate(toUi);

    if (new Date(fromApi) > new Date(toApi)) {
        dashToast('warning', 'From Date cannot be later than To Date.');
        return;
    }

    $('#dashFilterMeta').text(fromUi + '  →  ' + toUi);

    if (typeof blockUI === 'function') blockUI();
    var pendingRequests = 2;

    function finishDashboardRequest() {
        pendingRequests--;
        if (pendingRequests <= 0 && typeof unblockUI === 'function') {
            unblockUI();
        }
    }

    $.ajax({
        url: appBaseURL + API_DAILY_STOCK,
        type: 'GET',
        data: { FromDate: fromApi, ToDate: toApi },
        beforeSend: function (xhr) { if (authKeyData) xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            RenderDashboard(dashResolveData(res));
        },
        error: function (xhr) {
            console.error('GetDailyStockReport', xhr.status, xhr.responseText);
            if (xhr.status !== 0) {
                dashToast('error', 'Unable to load dashboard data.');
            }
            RenderDashboard({});
        },
        complete: finishDashboardRequest
    });

    LoadOutstandingSummary(toApi, toUi, finishDashboardRequest);
}

function dashExtractRows(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.data)) return res.data;
    if (res.Data && Array.isArray(res.Data.List)) return res.Data.List;
    if (res.data && Array.isArray(res.data.List)) return res.data.List;
    return [];
}

function dashPick(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function dashParseDelayDays(row) {
    var d = dashPick(row, ['DealyDays', 'DelayDays', 'Delay Days']);
    var n = parseInt(String(d).replace(/[^0-9-]/g, ''), 10);
    return isNaN(n) ? 0 : Math.max(0, n);
}

function dashParseCreditDays(row) {
    var c = dashPick(row, ['CreditDays', 'Credit Days']);
    var n = parseInt(String(c).replace(/[^0-9-]/g, ''), 10);
    return isNaN(n) ? 0 : Math.max(0, n);
}

function dashNormalizeOutstandingRow(r) {
    var amount = dashNum(dashGet(r, ['Amount'], 0));
    var paymentAmount = dashNum(dashGet(r, ['PaymentAmount'], 0));
    var outstanding = Math.max(0, amount - paymentAmount);
    var delayDays = dashParseDelayDays(r);
    var creditDays = dashParseCreditDays(r);
    return {
        OutstandingAmount: outstanding,
        DelayDays: delayDays,
        CreditDays: creditDays,
        OverdueAmount: delayDays > creditDays ? outstanding : 0
    };
}

function LoadOutstandingSummary(asonDateApi, asonDateUi, onComplete) {
    $.ajax({
        url: appBaseURL + API_PENDING_INVOICE_REPORT,
        type: 'GET',
        data: {
            AsonDate: asonDateApi,
            AccountMaster_Code: 0
        },
        beforeSend: function (xhr) { if (authKeyData) xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            var rows = dashExtractRows(res).map(dashNormalizeOutstandingRow);
            RenderOutstandingKpis(rows, asonDateUi);
        },
        error: function (xhr) {
            console.error('GetPendingInvoiceReport', xhr.status, xhr.responseText);
            RenderOutstandingKpis([], asonDateUi);
        },
        complete: function () {
            if (typeof onComplete === 'function') onComplete();
        }
    });
}

function RenderOutstandingKpis(rows, asonDateUi) {
    var total = 0, overdue = 0, billCount = 0;
    rows.forEach(function (r) {
        total += r.OutstandingAmount;
        overdue += r.OverdueAmount;
        billCount++;
    });

    dashSetText('kpiOutstanding', total ? dashRupee(total) : '—');
    dashSetText('kpiOutstandingSub', billCount
        ? billCount + ' bill(s) · As on ' + (asonDateUi || '—')
        : 'No bills · As on ' + (asonDateUi || '—'));
    dashSetText('kpiOverdue', overdue ? dashRupee(overdue) : '—');
    dashSetText('kpiOverdueSub', total
        ? Math.round((overdue / total) * 100) + '% of outstanding'
        : 'Beyond credit days');
}

/* ── Renderers ─────────────────────────────────────────────────────────── */
function RenderDashboard(data) {
    var dailyOrders = dashArr(data, ['DailyOrderReport', 'dailyOrderReport']);
    var saleReturns = dashArr(data, ['SaleReturn', 'saleReturn']);
    var saleLoss = dashArr(data, ['SaleLossOrder', 'saleLossOrder']);

    RenderKpis(dailyOrders, saleReturns);
    RenderPipeline(dailyOrders);
    RenderStatusSummary(dailyOrders);
    RenderTopOrderParties(
        dashArr(data, ['Top10MaximumOrderParty', 'top10MaximumOrderParty']),
        dashArr(data, ['Top10MinimumOrderParty', 'top10MinimumOrderParty'])
    );
    RenderPerformance(dailyOrders, saleReturns);
    RenderMonthWiseSale(dashArr(data, ['MonthWiseSale', 'monthWiseSale']));
    RenderDeadStock(dashArr(data, ['DeadStock', 'deadStock']));
    RenderEmployee(dashArr(data, ['Employee', 'employee']));
    RenderUserWeeklyReport(dashArr(data, ['UserWeeklyReport', 'userWeeklyReport']));
    RenderSaleReturn(saleReturns);
    RenderSaleLossOrder(saleLoss);
    RenderReorderLevel(dashArr(data, ['ReorderLevelData', 'reorderLevelData']));
}

/** Classify an OrderStatus string into a flow bucket. */
function dashStatusBucket(status) {
    var s = String(status || '').toLowerCase();
    if (s.indexOf('dispatch') >= 0) return 'dispatch';
    if (s.indexOf('pack') >= 0) return 'pack';
    if (s.indexOf('pick') >= 0) return 'pick';
    if (s.indexOf('sort') >= 0 || s.indexOf('qc') >= 0) return 'sort';
    if (s.indexOf('unload') >= 0 || s.indexOf('inward') >= 0 || s.indexOf('receiv') >= 0) return 'unload';
    return 'other';
}

function dashExcludeFromTotalOrders(bucket) {
    return bucket === 'pack' || bucket === 'dispatch';
}

function RenderKpis(dailyOrders, saleReturns) {
    var totalOrders = 0, totalAmount = 0, dispatched = 0, totalOrderGroups = 0;
    dailyOrders.forEach(function (r) {
        var cnt = dashInt(dashGet(r, ['TotalOrderCount'], 0));
        var amt = dashNum(dashGet(r, ['TotalAmount'], 0));
        var bucket = dashStatusBucket(dashGet(r, ['OrderStatus'], ''));
        if (!dashExcludeFromTotalOrders(bucket)) {
            totalOrders += cnt;
            totalAmount += amt;
            totalOrderGroups++;
        }
        if (bucket === 'dispatch') { dispatched += cnt; }
    });

    var returnCount = saleReturns.length;
    var returnValue = 0;
    saleReturns.forEach(function (r) { returnValue += dashNum(dashGet(r, ['Value'], 0)); });

    dashSetText('kpiTotalOrders', dashIndian(totalOrders));
    dashSetText('kpiTotalOrdersSub', totalOrderGroups + ' status group(s)');
    dashSetText('kpiTotalSale', dashCompactRupee(totalAmount));
    dashSetText('kpiTotalSaleSub', dashRupee(totalAmount));
    dashSetText('kpiDispatched', dashIndian(dispatched));
    dashSetText('kpiDispatchedSub', totalOrders ? Math.round((dispatched / totalOrders) * 100) + '% of orders' : '');
    dashSetText('kpiReturns', dashIndian(returnCount));
    dashSetText('kpiReturnsSub', returnValue ? dashCompactRupee(returnValue) : '');
}

var DASH_STEP_CLASSES = ['wd-step-unload', 'wd-step-sort', 'wd-step-pick', 'wd-step-pack', 'wd-step-dispatch'];

function RenderPipeline(dailyOrders) {
    var $row = $('#dashPipeline');
    if (!dailyOrders.length) {
        $row.html('<div class="wd-pipeline-step wd-step-unload"><div class="wd-ps-label">No data</div><div class="wd-ps-num">—</div><div class="wd-ps-sub">orders</div><div class="wd-ps-bar"><div class="wd-ps-fill" style="width:0"></div></div></div>');
        return;
    }
    var max = 0;
    dailyOrders.forEach(function (r) { max = Math.max(max, dashInt(dashGet(r, ['TotalOrderCount'], 0))); });

    var html = '';
    dailyOrders.forEach(function (r, idx) {
        var label = dashGet(r, ['OrderStatus'], 'Status');
        var cnt = dashInt(dashGet(r, ['TotalOrderCount'], 0));
        var pct = max > 0 ? Math.round((cnt / max) * 100) : 0;
        var stepCls = DASH_STEP_CLASSES[idx % DASH_STEP_CLASSES.length];
        html += '<div class="wd-pipeline-step ' + stepCls + '">' +
            '<div class="wd-ps-label">' + dashEscape(label) + '</div>' +
            '<div class="wd-ps-num">' + dashIndian(cnt) + '</div>' +
            '<div class="wd-ps-sub">orders</div>' +
            '<div class="wd-ps-bar"><div class="wd-ps-fill" style="width:' + pct + '%"></div></div>' +
            '</div>';
    });
    $row.html(html);
}

var DASH_STATUS_PILL = {
    dispatch: 'wd-pill--green',
    pack: 'wd-pill--blue',
    pick: 'wd-pill--amber',
    sort: 'wd-pill--purple',
    unload: 'wd-pill--gray',
    other: 'wd-pill--gray'
};

function RenderStatusSummary(dailyOrders) {
    var $tb = $('#dashStatusSummary');
    if (!dailyOrders.length) {
        $tb.html('<tr><td colspan="3" class="text-center text-muted py-3">No orders for this period</td></tr>');
        return;
    }
    var html = '';
    dailyOrders.forEach(function (r) {
        var status = dashGet(r, ['OrderStatus'], '');
        var pill = DASH_STATUS_PILL[dashStatusBucket(status)] || 'wd-pill--gray';
        html += '<tr>' +
            '<td><span class="wd-pill ' + pill + '"><span class="wd-pill-dot"></span>' + dashEscape(status) + '</span></td>' +
            '<td class="text-end">' + dashIndian(dashInt(dashGet(r, ['TotalOrderCount'], 0))) + '</td>' +
            '<td class="text-end wd-mono">' + dashRupee(dashGet(r, ['TotalAmount'], 0)) + '</td>' +
            '</tr>';
    });
    $tb.html(html);
}

function dashRenderPartyRows(rows) {
    if (!rows || !rows.length) {
        return '<tr><td colspan="3" class="text-center text-muted py-3">No parties for this period</td></tr>';
    }

    var html = '';
    rows.forEach(function (it, idx) {
        var name = dashGet(it, ['AccountName', 'PoClientName', 'Name'], '—');
        var oCount = dashInt(dashGet(it, ['Ocount', 'OCount', 'ocount', 'order_count', 'OrderCount', 'TotalOrder'], 0));
        html += '<tr>' +
            '<td class="wd-party-rank">' + (idx + 1) + '</td>' +
            '<td>' + dashEscape(name) + '</td>' +
            '<td class="text-end">' + dashIndian(oCount) + '</td>' +
            '</tr>';
    });
    return html;
}

function RenderTopOrderParties(maxRows, minRows) {
    var maxList = maxRows || [];
    var minList = minRows || [];
    var $max = $('#dashPartyMaxList');
    var $min = $('#dashPartyMinList');

    $('#dashPartyMaxCount').text(maxList.length);
    $('#dashPartyMinCount').text(minList.length);

    $max.html(dashRenderPartyRows(maxList));
    $min.html(dashRenderPartyRows(minList));

    if (!maxList.length && minList.length) {
        var minTab = document.getElementById('dashPartyMinTab');
        if (minTab && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            bootstrap.Tab.getOrCreateInstance(minTab).show();
        }
    } else {
        var maxTab = document.getElementById('dashPartyMaxTab');
        if (maxTab && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            bootstrap.Tab.getOrCreateInstance(maxTab).show();
        }
    }
}

function RenderPerformance(dailyOrders, saleReturns) {
    var totalOrders = 0, totalAmount = 0, dispatched = 0;
    dailyOrders.forEach(function (r) {
        var cnt = dashInt(dashGet(r, ['TotalOrderCount'], 0));
        var bucket = dashStatusBucket(dashGet(r, ['OrderStatus'], ''));
        if (!dashExcludeFromTotalOrders(bucket)) {
            totalOrders += cnt;
            totalAmount += dashNum(dashGet(r, ['TotalAmount'], 0));
        }
        if (bucket === 'dispatch') { dispatched += cnt; }
    });
    dashSetText('perfOrders', dashIndian(totalOrders));
    dashSetText('perfRevenue', dashCompactRupee(totalAmount));
    dashSetText('perfDispatched', dashIndian(dispatched));
    dashSetText('perfReturns', dashIndian(saleReturns.length));
}

function RenderMonthWiseSale(rows) {
    var elId = 'chartDashMonthWiseSale';
    dashDestroyChart(elId);

    if (!rows || !rows.length) {
        dashShowChartEmpty(elId, 'No sale data for this period');
        return;
    }

    if (typeof ApexCharts === 'undefined') {
        dashShowChartEmpty(elId, 'Chart library not available');
        return;
    }

    var categories = [];
    var amounts = [];
    rows.forEach(function (r) {
        categories.push(String(dashGet(r, ['Month'], '—')));
        amounts.push(dashNum(dashGet(r, ['TotalMonthAmount'], 0)));
    });

    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = '';

    var chartData = categories.map(function (cat, i) {
        return { x: cat, y: amounts[i] };
    });

    G_DashCharts[elId] = new ApexCharts(el, {
        chart: {
            type: 'bar',
            height: 320,
            toolbar: { show: false },
            fontFamily: 'DM Sans, system-ui, sans-serif',
            animations: { enabled: true, easing: 'easeinout', speed: 500 }
        },
        plotOptions: {
            bar: {
                borderRadius: 5,
                columnWidth: '62%',
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            offsetY: -18,
            style: { fontSize: '10px', fontWeight: 700, colors: ['#059669'] },
            formatter: function (val) {
                return val > 0 ? dashCompactRupee(val) : '';
            }
        },
        series: [{ name: 'Sale', data: chartData }],
        colors: ['#10b981'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.35,
                gradientToColors: ['#06b6d4'],
                opacityFrom: 1,
                opacityTo: 0.85,
                stops: [0, 100]
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 3,
            padding: { top: 8, right: 8, left: 4, bottom: 0 }
        },
        xaxis: {
            type: 'category',
            labels: {
                rotate: -35,
                rotateAlways: categories.length > 6,
                style: { fontSize: '10px', colors: '#64748b' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: function (v) { return dashFormatAxisAmount(v); },
                style: { fontSize: '10px', colors: '#64748b' }
            }
        },
        tooltip: {
            theme: 'light',
            y: { formatter: function (v) { return dashRupee(v); } }
        }
    });

    G_DashCharts[elId].render();
}

var DASH_DTC_PILL = function (days) {
    var d = dashInt(days);
    if (d >= 120) return 'wd-pill--red';
    if (d >= 60) return 'wd-pill--amber';
    return 'wd-pill--gray';
};

function RenderDeadStock(rows) {
    var $c = $('#dashDeadStock');
    if (!rows || !rows.length) {
        $c.html('<div class="text-muted" style="font-size: 0.8rem;">No non-moving stock</div>');
        return;
    }
    var sorted = rows.slice().sort(function (a, b) {
        return dashNum(dashGet(b, ['DTC'], 0)) - dashNum(dashGet(a, ['DTC'], 0));
    });
    var html = '';
    sorted.slice(0, 8).forEach(function (r) {
        var days = dashGet(r, ['DTC'], '');
        var name = dashGet(r, ['PartDescription', 'PartNo'], '—');
        html += '<div class="wd-nm-row">' +
            '<span class="wd-nm-name">' + dashEscape(name) + '</span>' +
            '<span class="wd-nm-days">' + (days !== '' ? dashIndian(dashInt(days)) + ' days' : '—') + '</span>' +
            '<span class="wd-pill ' + DASH_DTC_PILL(days) + '" style="font-size: 10px;">' + dashCompactRupee(dashGet(r, ['TotalValue'], 0)) + '</span>' +
            '</div>';
    });
    $c.html(html);
}

function dashEmployeeNameCellHtml(name) {
    return '<td class="wd-emp-name-col">' +
        '<div class="wd-weekly-emp">' +
        '<span class="wd-weekly-emp__avatar" aria-hidden="true">' + dashEscape(dashWeeklyEmpInitial(name)) + '</span>' +
        '<span class="wd-weekly-emp__name">' + dashEscape(name) + '</span>' +
        '</div></td>';
}

function dashEmployeeMetricCellHtml(val, metricKey) {
    var n = dashInt(val);
    if (n === 0) {
        return '<td class="wd-emp-val wd-emp-val--zero"><span class="wd-weekly-val__dash">—</span></td>';
    }
    return '<td class="wd-emp-val wd-emp-val--' + metricKey + '">' +
        '<span class="wd-weekly-val__num">' + dashIndian(n) + '</span></td>';
}

function dashEmployeeTotal(row) {
    return dashInt(dashGet(row, ['Unloaded'], 0)) +
        dashInt(dashGet(row, ['NoOfOrderPacked'], 0)) +
        dashInt(dashGet(row, ['NoOfOrderDispatch'], 0));
}

function RenderEmployee(rows) {
    var $tb = $('#dashEmployee');
    if (!rows || !rows.length) {
        $tb.html('<tr><td colspan="4" class="text-center text-muted py-3">No employee activity</td></tr>');
        return;
    }

    var sorted = rows.slice().sort(function (a, b) {
        return dashEmployeeTotal(b) - dashEmployeeTotal(a);
    });

    var html = '';
    sorted.forEach(function (r, rowIdx) {
        var name = dashGet(r, ['Name'], '—');
        html += '<tr class="' + (rowIdx % 2 === 1 ? 'wd-emp-row--alt' : '') + '">';
        html += dashEmployeeNameCellHtml(name);
        html += dashEmployeeMetricCellHtml(dashGet(r, ['Unloaded'], 0), 'unload');
        html += dashEmployeeMetricCellHtml(dashGet(r, ['NoOfOrderPacked'], 0), 'pack');
        html += dashEmployeeMetricCellHtml(dashGet(r, ['NoOfOrderDispatch'], 0), 'dispatch');
        html += '</tr>';
    });
    $tb.html(html);
}

var DASH_WEEKLY_METRICS = ['Unloaded', 'Packed', 'Dispatched'];
var DASH_MONTH_ORDER = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

function dashMonthIndex(month) {
    var m = String(month || '').trim().slice(0, 3);
    if (!m) return 0;
    var key = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
    return DASH_MONTH_ORDER[key] || 0;
}

function dashParseUserWeeklyColumns(rows) {
    var weekMap = {};
    var fallbackKeys = [];

    (rows || []).forEach(function (row) {
        Object.keys(row || {}).forEach(function (key) {
            if (/^name$/i.test(key)) return;
            var match = String(key).match(/^(\d{4})_([A-Za-z]+)_Week(\d+)_(Unloaded|Packed|Dispatched)$/i);
            if (match) {
                var weekKey = match[1] + '_' + match[2] + '_Week' + match[3];
                if (!weekMap[weekKey]) {
                    weekMap[weekKey] = {
                        year: match[1],
                        month: match[2],
                        weekNum: parseInt(match[3], 10),
                        fields: {}
                    };
                }
                weekMap[weekKey].fields[match[4].charAt(0).toUpperCase() + match[4].slice(1).toLowerCase()] = key;
            } else if (fallbackKeys.indexOf(key) < 0) {
                fallbackKeys.push(key);
            }
        });
    });

    var weeks = Object.keys(weekMap).map(function (k) { return weekMap[k]; });
    weeks.sort(function (a, b) {
        var yearA = parseInt(a.year, 10);
        var yearB = parseInt(b.year, 10);
        if (yearA !== yearB) return yearB - yearA;
        var monthDiff = dashMonthIndex(b.month) - dashMonthIndex(a.month);
        if (monthDiff !== 0) return monthDiff;
        return a.weekNum - b.weekNum;
    });

    return { weeks: weeks, fallbackKeys: fallbackKeys };
}

function dashWeeklyWeekLabel(week) {
    return week.month + ' ' + week.year + ' — Week ' + week.weekNum;
}

function dashWeeklyMetricKey(metric) {
    return String(metric || '').toLowerCase();
}

function dashWeeklyMetricShort(metric) {
    if (metric === 'Unloaded') return 'Unload';
    if (metric === 'Packed') return 'Pack';
    if (metric === 'Dispatched') return 'Dispatch';
    return metric;
}

function dashWeeklyMetricDotClass(metric) {
    if (metric === 'Unloaded') return 'unload';
    if (metric === 'Packed') return 'pack';
    if (metric === 'Dispatched') return 'dispatch';
    return 'unload';
}

function dashWeeklyEmpInitial(name) {
    var s = String(name || '').trim();
    return s ? s.charAt(0).toUpperCase() : '?';
}

function dashWeeklyGroupHeaderHtml(week, groupIdx) {
    var alt = groupIdx % 2 === 1 ? ' wd-weekly-group-col--alt' : '';
    return '<th class="wd-weekly-group-col' + alt + '" colspan="' + DASH_WEEKLY_METRICS.length + '">' +
        '<div class="wd-weekly-week-badge">' +
        '<span class="wd-weekly-week-badge__month">' + dashEscape(week.month + ' ' + week.year) + '</span>' +
        '<span class="wd-weekly-week-badge__num">W' + week.weekNum + '</span>' +
        '</div></th>';
}

function dashWeeklyMetricHeaderHtml(metric, groupIdx, metricIdx) {
    var alt = groupIdx % 2 === 1 ? ' wd-weekly-metric-col--alt' : '';
    var sep = metricIdx === 0 ? ' wd-weekly-metric-col--group-start' : '';
    var key = dashWeeklyMetricKey(metric);
    return '<th class="wd-weekly-metric-col wd-weekly-metric-col--' + key + alt + sep + '">' +
        '<span class="wd-weekly-metric-label">' +
        '<span class="wd-weekly-dot wd-weekly-dot--' + dashWeeklyMetricDotClass(metric) + '"></span>' +
        dashEscape(dashWeeklyMetricShort(metric)) +
        '</span></th>';
}

function dashWeeklyValueCellHtml(val, metric, groupIdx, metricIdx) {
    var n = dashInt(val);
    var alt = groupIdx % 2 === 1 ? ' wd-weekly-val--alt' : '';
    var sep = metricIdx === 0 ? ' wd-weekly-val--group-start' : '';
    var key = dashWeeklyMetricKey(metric);
    if (n === 0) {
        return '<td class="wd-weekly-val wd-weekly-val--zero' + alt + sep + '"><span class="wd-weekly-val__dash">—</span></td>';
    }
    return '<td class="wd-weekly-val wd-weekly-val--' + key + alt + sep + '">' +
        '<span class="wd-weekly-val__num">' + dashIndian(n) + '</span></td>';
}

function dashWeeklyNameCellHtml(name) {
    return '<td class="wd-weekly-name-col">' +
        '<div class="wd-weekly-emp">' +
        '<span class="wd-weekly-emp__avatar" aria-hidden="true">' + dashEscape(dashWeeklyEmpInitial(name)) + '</span>' +
        '<span class="wd-weekly-emp__name">' + dashEscape(name) + '</span>' +
        '</div></td>';
}

function RenderUserWeeklyReport(rows) {
    var $head = $('#dashUserWeeklyHead');
    var $body = $('#dashUserWeeklyBody');

    if (!rows || !rows.length) {
        $head.html('<tr><th>Employee</th></tr>');
        $body.html('<tr><td class="text-center text-muted py-3">No weekly report data for this period</td></tr>');
        return;
    }

    var parsed = dashParseUserWeeklyColumns(rows);
    var weeks = parsed.weeks;
    var fallbackKeys = parsed.fallbackKeys;
    var headHtml = '';
    var bodyHtml = '';

    if (weeks.length) {
        headHtml += '<tr><th class="wd-weekly-name-col wd-weekly-name-col--head" rowspan="2">Employee</th>';
        weeks.forEach(function (week, groupIdx) {
            headHtml += dashWeeklyGroupHeaderHtml(week, groupIdx);
        });
        headHtml += '</tr><tr>';
        weeks.forEach(function (week, groupIdx) {
            DASH_WEEKLY_METRICS.forEach(function (metric, metricIdx) {
                headHtml += dashWeeklyMetricHeaderHtml(metric, groupIdx, metricIdx);
            });
        });
        headHtml += '</tr>';

        rows.forEach(function (row, rowIdx) {
            var name = dashGet(row, ['Name'], '—');
            bodyHtml += '<tr class="' + (rowIdx % 2 === 1 ? 'wd-weekly-row--alt' : '') + '">';
            bodyHtml += dashWeeklyNameCellHtml(name);
            weeks.forEach(function (week, groupIdx) {
                DASH_WEEKLY_METRICS.forEach(function (metric, metricIdx) {
                    var fieldKey = week.fields[metric];
                    var val = fieldKey ? row[fieldKey] : 0;
                    bodyHtml += dashWeeklyValueCellHtml(val, metric, groupIdx, metricIdx);
                });
            });
            bodyHtml += '</tr>';
        });
    } else if (fallbackKeys.length) {
        headHtml += '<tr><th class="wd-weekly-name-col">Employee</th>';
        fallbackKeys.forEach(function (key) {
            headHtml += '<th class="text-end">' + dashEscape(key.replace(/_/g, ' ')) + '</th>';
        });
        headHtml += '</tr>';

        rows.forEach(function (row) {
            bodyHtml += '<tr><td class="wd-weekly-name-col">' + dashEscape(dashGet(row, ['Name'], '—')) + '</td>';
            fallbackKeys.forEach(function (key) {
                bodyHtml += '<td class="text-end">' + dashIndian(dashInt(row[key])) + '</td>';
            });
            bodyHtml += '</tr>';
        });
    } else {
        $head.html('<tr><th>Employee</th></tr>');
        $body.html('<tr><td class="text-center text-muted py-3">No weekly report columns found</td></tr>');
        return;
    }

    $head.html(headHtml);
    $body.html(bodyHtml);
}

function RenderSaleReturn(rows) {
    var $tb = $('#dashSaleReturn');
    if (!rows || !rows.length) {
        $tb.html('<tr><td colspan="4" class="text-center text-muted py-3">No sale returns</td></tr>');
        return;
    }
    var html = '';
    rows.forEach(function (r) {
        html += '<tr>' +
            '<td>' + dashEscape(dashGet(r, ['PartyName'], '—')) + '</td>' +
            '<td class="wd-mono">' + dashEscape(dashGet(r, ['OrderNo'], '—')) + '</td>' +
            '<td>' + dashEscape(dashGet(r, ['Reason'], '—')) + '</td>' +
            '<td class="text-end wd-mono">' + dashRupee(dashGet(r, ['Value'], 0)) + '</td>' +
            '</tr>';
    });
    $tb.html(html);
}

function RenderSaleLossOrder(rows) {
    if (!rows || !rows.length) {
        dashSetText('sloTotalLines', '—');
        dashSetText('sloTotalQty', '—');
        dashSetText('sloTotalValue', '—');
        return;
    }
    var totalLines = 0, totalQty = 0, totalValue = 0;
    rows.forEach(function (r) {
        totalLines += dashInt(dashGet(r, ['TotalLineOfProduct'], 0));
        totalQty += dashInt(dashGet(r, ['TotalProductQty'], 0));
        totalValue += dashNum(dashGet(r, ['TotalValue'], 0));
    });
    dashSetText('sloTotalLines', dashIndian(totalLines));
    dashSetText('sloTotalQty', dashIndian(totalQty));
    dashSetText('sloTotalValue', dashCompactRupee(totalValue));
}

function RenderReorderLevel(rows) {
    var list = rows || [];
    var $tb = $('#dashReorderLevelList');
    $('#dashReorderLevelCount').text(list.length);

    if (!list.length) {
        $tb.html('<tr><td colspan="4" class="text-center text-muted py-3">No items at or below reorder level</td></tr>');
        return;
    }

    var html = '';
    list.forEach(function (r) {
        var reorder = dashInt(dashGet(r, ['Reorder Level', 'ReorderLevel', 'reorderLevel'], 0));
        var balance = dashInt(dashGet(r, ['Balance Qty', 'BalanceQty', 'balanceQty'], 0));
        var lowStock = balance <= reorder;
        html += '<tr>' +
            '<td class="wd-mono">' + dashEscape(dashGet(r, ['Item Code', 'ItemCode', 'itemCode'], '—')) + '</td>' +
            '<td>' + dashEscape(dashGet(r, ['Item Name', 'ItemName', 'itemName'], '—')) + '</td>' +
            '<td class="text-end">' + dashIndian(reorder) + '</td>' +
            '<td class="text-end' + (lowStock ? ' wd-stat-tile-val--danger' : '') + '">' + dashIndian(balance) + '</td>' +
            '</tr>';
    });
    $tb.html(html);
}

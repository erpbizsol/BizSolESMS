var G_ItemConfig;
try {
    G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
} catch (e) {
    G_ItemConfig = null;
}
if (!G_ItemConfig || !Array.isArray(G_ItemConfig)) {
    G_ItemConfig = [{}];
}
var authKeyData;
try {
    authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
} catch (e) {
    authKeyData = {};
}

var FixParameter;
try {
    FixParameter = JSON.parse(sessionStorage.getItem('Fixparameter'));
} catch (e) {
    FixParameter = null;
}
var G_CompanyCode = (FixParameter && FixParameter[0] && FixParameter[0].CompanyCode != null) ? FixParameter[0].CompanyCode : '';
var UserMaster_Code = authKeyData.UserMaster_Code;
var UserType = authKeyData.UserType;
var UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const G_UserName = sessionStorage.getItem('UserName');

var G_InvoiceItemDetailCache = [];
var G_HsnMasterRows = [];
var G_PackedOrdersRaw = [];
var G_PrintSnapshots = {};
var PRINT_OPTS_KEY = 'webiz_invoice_print_opts';
/** List HSNS for invoice lines (expects rows like api/Master/ShowHSNMaster: HSN Code, GST Rate, Code PK, IsActive). */
var API_HSN_MASTER_LIST = '/api/Master/ShowHSNMaster';
var API_INVOICE_MASTER_SAVE_DATA = '/api/OrderMaster/InvoiceMasterSaveData';
var API_GET_GST_PRINT = '/api/OrderMaster/GetGstInvoiceForPrint';
/** Same payload as invoice modal: InvoiceHeader[] + InvoiceLines[] */
var API_GET_INVOICE_GENERATE = '/api/OrderMaster/GetInvoiceGenerateData';
var API_PREFILL_INVOICE = '/api/OrderMaster/GetGstInvoicePrefill';
var API_GET_PENDING_INVOICE = '/api/OrderMaster/GetPendingDataForInvoice';

var modalGenEl = null;
var modalPrintEl = null;
var bsModalGen = null;
var bsModalPrint = null;
var printOrderDispatchCode = null;
var G_InvModalCtx = null;
function GetModuleMasterCodeForInvoice() {
    try {
        var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = Data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d.indexOf('invoice') >= 0 && d.indexOf('gst') >= 0;
        });
        if (!result) {
            result = Data.find(function (item) { return (item.ModuleDesp || '') === 'Invoice (GST)'; });
        }
        if (!result) {
            result = Data.find(function (item) { return (item.ModuleDesp || '').indexOf('invoice') >= 0; });
        }
        if (result) {
            UserModuleMaster_Code = result.Code;
        }
    } catch (e) {
        UserModuleMaster_Code = 0;
    }
}
function invGetItemCodeHeader() {
    return (G_ItemConfig[0] && G_ItemConfig[0].ItemCodeHeader) ? G_ItemConfig[0].ItemCodeHeader : 'Item Code';
}
function invGetItemNameHeader() {
    return (G_ItemConfig[0] && G_ItemConfig[0].ItemNameHeader) ? G_ItemConfig[0].ItemNameHeader : 'Item Name';
}
function pad2(n) {
    return String(n).padStart(2, '0');
}
function todayYmd() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function todayDmy() {
    var d = new Date();
    return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function monthStartDmy() {
    var d = new Date();
    return pad2(1) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function dateToYmd(d) {
    if (!d || isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function dateToDmy(d) {
    if (!d || isNaN(d.getTime())) return '';
    return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function parseApiDate(str) {
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
    m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/i);
    if (m) {
        var months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        var mon = months[m[2].toLowerCase()];
        if (mon == null) mon = 0;
        return new Date(parseInt(m[3], 10), mon, parseInt(m[1], 10), 12, 0, 0);
    }
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}
function formatDateDmyFromApi(str) {
    var d = parseApiDate(str);
    if (!d) return '';
    return dateToDmy(d);
}
function invFormatDateForInvoiceApi(dateStr) {
    var s = (dateStr || '').trim();
    if (!s) return todayYmd();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var d = parseApiDate(s);
    if (d && !isNaN(d.getTime())) return dateToYmd(d);
    return s;
}
function invUiDateToApiYmd(val) {
    var s = (val || '').trim();
    if (!s) return todayYmd();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var d = parseApiDate(s);
    if (d && !isNaN(d.getTime())) return dateToYmd(d);
    return todayYmd();
}
function invAnyDateToPickerDmy(str) {
    var d = parseApiDate(str);
    return d && !isNaN(d.getTime()) ? dateToDmy(d) : todayDmy();
}
function getInvoiceListQueryParams() {
    var fromD = invFormatDateForInvoiceApi($('#txtInvFromDate').val());
    var toD = invFormatDateForInvoiceApi($('#txtInvToDate').val());
    var clientCode = ($('#ddlInvClientName').val() || '').trim();
    if (clientCode === '' || clientCode === '0') {
        clientCode = '0';
    }
    return {
        FromDate: fromD,
        ToDate: toD,
        ClientMaster_Code: clientCode
    };
}
function buildPendingInvoiceListUrl() {
    var p = getInvoiceListQueryParams();
    return appBaseURL + API_GET_PENDING_INVOICE
        + '?FromDate=' + encodeURIComponent(p.FromDate)
        + '&ToDate=' + encodeURIComponent(p.ToDate)
        + '&ClientMaster_Code=' + encodeURIComponent(p.ClientMaster_Code);
}
function formatMoney(n) {
    var x = Number(n);
    if (!isFinite(x)) x = 0;
    return x.toFixed(2);
}
function parseNum(v) {
    if (v == null || v === '' || v === 'NULL') return 0;
    var x = parseFloat(String(v).replace(/,/g, ''));
    return isFinite(x) ? x : 0;
}
function clientNextInvoiceNo() {
    var d = new Date();
    var r = String(Math.floor(Math.random() * 9000) + 1000);
    return 'INV/' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '/' + r;
}
function getBootstrapModal(el) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        return new bootstrap.Modal(el);
    }
    return null;
}
function rowHsnDisplayCode(r) {
    return String(pickLineField(r || {}, ['HSN Code', 'HSNCode', 'HSN', 'HsnCode']) || '').trim();
}
function rowGstPctFromMasterRow(r) {
    var v = parseNum(pickLineField(r || {}, ['GST Rate', 'GSTRate', 'GSTPer', 'GST', 'IGST']));
    return isFinite(v) ? v : NaN;
}
function lookupGstPct(hsnCode) {
    var c = String(hsnCode || '').trim();
    if (!c) return null;
    var row = G_HsnMasterRows.find(function (h) { return String(h.code) === c; });
    return row ? row.gst : null;
}
function normalizeHsnMasterRowsFromApi(res) {
    if (!Array.isArray(res)) return [];
    var byCode = {};
    res.forEach(function (r) {
        var act = String(r.IsActive || 'Y').toUpperCase();
        if (r.IsActive != null && act !== 'Y') return;
        var code = rowHsnDisplayCode(r);
        if (!code) return;
        var g = rowGstPctFromMasterRow(r);
        if (!isFinite(g)) g = 18;
        byCode[code] = { code: code, gst: g };
    });
    return Object.keys(byCode).map(function (k) { return byCode[k]; });
}
function mergeHsnFromItems(items) {
    var map = {};
    (items || []).forEach(function (it) {
        var h = rowHsnDisplayCode(it) || String(it.HSNCode || it.HSN || it.HsnCode || '').trim();
        if (!h) return;
        var g = parseNum(
            pickLineField(it, ['GST Rate', 'GSTRate', 'GSTPer', 'GST']) || it.IGST || it.CGSTRate
        );
        if (!isFinite(g) || !(g >= 0)) g = map[h] || 18;
        map[h] = g;
    });
    var keys = Object.keys(map);
    keys.forEach(function (k) {
        if (!G_HsnMasterRows.some(function (r) { return String(r.code) === k; })) {
            G_HsnMasterRows.push({ code: k, gst: map[k] });
        }
    });
}
function loadItemDetailsForInvoice(callback) {
    $.ajax({
        url: appBaseURL + '/api/Master/GetItemDetails',
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_InvoiceItemDetailCache = Array.isArray(response) ? response : [];
            mergeHsnFromItems(G_InvoiceItemDetailCache);
            if (callback) callback();
        },
        error: function () {
            G_InvoiceItemDetailCache = [];
            if (callback) callback();
        }
    });
}
function loadHsnMasterFromApi(callback) {
    $.ajax({
        url: appBaseURL + API_HSN_MASTER_LIST,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            if (Array.isArray(res) && res.length > 0) {
                G_HsnMasterRows = normalizeHsnMasterRowsFromApi(res);
            }
            mergeHsnFromItems(G_InvoiceItemDetailCache);
            if (callback) callback();
        },
        error: function () {
            mergeHsnFromItems(G_InvoiceItemDetailCache);
            if (callback) callback();
        }
    });
}
function getItemMetaByCode(itemCode) {
    var ic = String(itemCode || '').trim();
    if (!ic || !G_InvoiceItemDetailCache.length) return null;
    return G_InvoiceItemDetailCache.find(function (x) {
        return String(x.ItemCode || '').trim() === ic || String(x.ItemBarCode || '').trim() === ic;
    }) || null;
}
function loadInvoiceClientDropDown(callback) {
    $.ajax({
        url: appBaseURL + '/api/Master/GetAccountIsClientDropDown',
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var $sel = $('#ddlInvClientName');
            if ($sel.length === 0) {
                if (callback) callback();
                return;
            }
            if ($sel.data('select2')) {
                $sel.select2('destroy');
            }
            var option = '<option value="">All clients</option>';
            if (Array.isArray(response) && response.length > 0) {
                $.each(response, function (key, val) {
                    var code = val.Code != null ? String(val.Code) : '';
                    var name = val.AccountName != null ? String(val.AccountName) : '';
                    option += '<option value="' + code + '">' + name + '</option>';
                });
            }
            $sel[0].innerHTML = option;
            $sel.select2({
                width: '100%',
                placeholder: 'All clients',
                allowClear: true
            });
            if (callback) callback();
        },
        error: function (xhr, status, error) {
            console.error('GetAccountIsClientDropDown', error);
            toastr.error('Unable to load client list.');
            if (callback) callback();
        }
    });
}
function mapApiRowsToInvoiceModels(filteredApiRows) {
    return filteredApiRows.map(function (item, i) {
        var orderCode = item.Code != null ? String(item.Code) : '';
        var dispatchCode = item.D_Code != null ? String(item.D_Code) : '';
        var invRaw = item['Invoice No'] || item['InvoiceNo'] || item['GSTInvoiceNo'] || item['GST Invoice No'] || '';
        var invStr = String(invRaw || '').trim();
        var hasInv = invStr !== '' && invStr !== '—';
        return {
            __rowIndex: i,
            OrderMaster_Code: orderCode,
            DispatchMaster_Code: dispatchCode,
            orderNo: item['Order No'] || item.OrderNo || '',
            clientName: item['Client Name'] || item.AccountName || item.ClientName || '',
            packingNo: item['Challan No'] || item.ChallanNo || '',
            packedDateDmy: formatDateDmyFromApi(item['Dispatch Date'] || item['Packed Date'] || item.DispatchDate || ''),
            tdq: item.TDQ != null ? item.TDQ : (item['Order Qty'] != null ? item['Order Qty'] : ''),
            packedBy: item['Packed By'] || item.PackedBy || '—',
            invoiceNo: hasInv ? invStr : '',
            invoiceSaved: hasInv,
            vehicleNoList: item['Vehicle No'] || item.VehicleNo || '',
            rawApiRow: item
        };
    });
}
function buildGridTableRows(models) {
    return models.map(function (o, i) {
        var d = o.DispatchMaster_Code;
        var esc = String(d).replace(/'/g, "\\'");
        var actionHtml = o.invoiceSaved
            ? '<button type="button" title="Print Invoice" class="btn btn-info btn-height" onclick="invoiceMasterOpenPrint(\'' + esc + '\')"><i class="fa-solid fa fa-download"></i></button>&nbsp;<button type="button" title="Edit Invoice" class="btn btn-primary btn-height" onclick="invoiceMasterOpenGenerate(\'' + esc + '\')"><i class="fa-solid fa-pencil"></i></button>'
            : '<button type="button" title="Generate Invoice" class="btn btn-primary btn-height" onclick="invoiceMasterOpenGenerate(\'' + esc + '\')"><i class="fa fa-plus" aria-hidden="true"></i></button>';

        return {
            OrderMaster_Code: o.OrderMaster_Code,
            DispatchMaster_Code: o.DispatchMaster_Code,
            InvoiceSaved: o.invoiceSaved ? 'Y' : 'N',
            'S.No': i + 1,
            'Order No': o.orderNo,
            'Client Name': o.clientName,
            'Packing No': o.packingNo,
            'Packed Date': o.packedDateDmy || '—',
            TDQ: o.tdq,
            'Packed By': o.packedBy,
            'Invoice No': o.invoiceNo || '—',
            Action: actionHtml
        };
    });
}
function renderInvoiceMainGridFromModels(models) {
    var rows = buildGridTableRows(models);
    if (!rows.length) {
        $('#table-header').empty();
        $('#table-body').html('<tr><td class="text-center text-muted py-4" colspan="14">No packed orders match the filter.</td></tr>');
        $('#paginator-table').empty();
        return;
    }

    var StringFilterColumn = ['Order No', 'Client Name', 'Packing No', 'Packed By'];
    var NumericFilterColumn = ['TDQ'];
    var DateFilterColumn = ['Packed Date'];
    var StringdoubleFilterColumn = [];
    var HiddenColumns = ['OrderMaster_Code', 'DispatchMaster_Code', 'InvoiceSaved'];
    var ColumnAlignment = { TDQ: 'right', 'S.No': 'right' };

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header',
        'table-body',
        rows,
        false,
        [],
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        HiddenColumns,
        ColumnAlignment,
        true
    );
}
function findModelByDispatchCode(dispatchCode) {
    var d = String(dispatchCode);
    var models = mapApiRowsToInvoiceModels(G_PackedOrdersRaw);
    return models.find(function (m) { return m.DispatchMaster_Code === d; });
}
function fetchPackedOrdersAndRender() {
    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: buildPendingInvoiceListUrl(),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_PackedOrdersRaw = Array.isArray(response) ? response : [];
            if (!G_PackedOrdersRaw.length) {
                toastr.error('Record not found...!');
            }
            renderInvoiceMainGridFromModels(mapApiRowsToInvoiceModels(G_PackedOrdersRaw));
        },
        error: function (xhr) {
            console.error('GetPendingDataForInvoice', xhr.status, xhr.responseText);
            G_PackedOrdersRaw = [];
            toastr.error('Unable to load packed orders.');
            $('#table-header').empty();
            $('#table-body').html('<tr><td class="text-center text-muted py-4" colspan="14">Failed to load data. Check API / network.</td></tr>');
            $('#paginator-table').empty();
        },
        complete: function () {
            if (typeof unblockUI === 'function') unblockUI();
        }
    });
}
function pickLineField(row, keys) {
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}
function mapOrderDetailLineToInvoiceLine(row) {
    var icKey = invGetItemCodeHeader();
    var inKey = invGetItemNameHeader();
    var itemCode = String(pickLineField(row, [icKey, 'Item Code', 'ItemCode']) || '');
    var itemName = String(pickLineField(row, [inKey, 'Item Name', 'ItemName']) || '');
    var qty = parseNum(pickLineField(row, ['Packing Qty', 'Scan Qty', 'Bal Qty', 'Ord Qty']));
    var mrp = parseNum(row['MRP']);
    var meta = getItemMetaByCode(itemCode);
    var hsn = String(
        pickLineField(row, ['HSN Code', 'HSNCode', 'HSN']) ||
        (meta ? (meta.HSNCode || meta.HSN || '') : '')
    ).trim();
    var gstFromMetaVal = meta ? parseNum(meta.GSTPer || meta.GSTRate || meta.IGST || meta.GST) : NaN;
    var lm = lookupGstPct(hsn);
    var gstPct = null;
    if (hsn) {
        if (lm !== null && !isNaN(lm)) gstPct = lm;
        else if (!isNaN(gstFromMetaVal) && gstFromMetaVal > 0) gstPct = gstFromMetaVal;
    }
    if (hsn && lookupGstPct(hsn) == null && !isNaN(gstFromMetaVal) && gstFromMetaVal > 0) {
        if (!G_HsnMasterRows.some(function (r) { return String(r.code) === hsn; })) {
            G_HsnMasterRows.push({ code: hsn, gst: gstFromMetaVal });
        }
    }
    return {
        itemCode: itemCode,
        itemName: itemName,
        qty: qty,
        mrp: mrp,
        scanMrp: mrp,
        discPct: 0,
        hsn: hsn,
        gstPct: gstPct
    };
}
function mapInvoiceGenerateApiLineToInvoiceLine(row) {
    var itemCode = String(pickLineField(row, ['Item Code', 'ItemCode']) || '');
    var itemName = String(pickLineField(row, ['Item Name', 'ItemName']) || '');
    var qty = parseNum(row['Qty']);
    var mrp = parseNum(row['MRP']);
    var scanMrp = parseNum(pickLineField(row, ['Scan MRP', 'ScanMRP', 'SCANMRP']));
    if (!(scanMrp > 0) && mrp > 0) {
        scanMrp = mrp;
    }
    var discPct = parseNum(
        row['DiscountPercent'] != null ? row['DiscountPercent'] : row['Discount']
    );
    var hsn = String(pickLineField(row, ['HSNCode', 'HSN Code', 'HSN']) || '').trim();
    var lm = lookupGstPct(hsn);
    var gstRow = parseNum(pickLineField(row, ['GST', 'GSTRate', 'GST Rate', 'GSTRATE']));
    var meta = getItemMetaByCode(itemCode);
    var gstMeta = meta ? parseNum(meta.GSTPer || meta.GSTRate || meta.IGST || meta.GST) : NaN;
    var gst = null;
    if (lm !== null && !isNaN(lm)) gst = lm;
    else if (gstRow > 0) gst = gstRow;
    else if (!isNaN(gstMeta) && gstMeta > 0) gst = gstMeta;
    if (hsn && lookupGstPct(hsn) == null && gst != null && !isNaN(gst)) {
        if (!G_HsnMasterRows.some(function (r) { return String(r.code) === hsn; })) {
            G_HsnMasterRows.push({ code: hsn, gst: gst });
        }
    }
    return {
        itemCode: itemCode,
        itemName: itemName,
        qty: qty,
        mrp: mrp,
        scanMrp: scanMrp,
        discPct: discPct,
        hsn: hsn,
        gstPct: gst
    };
}
function escInvoiceOptAttr(t) {
    return String(t)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}
/** GST % for input at grid fill — only when line has HSN and a known rate (master / model); no blanket 18. */
function gstPercentForInvoiceLine(it) {
    var h = String(it.hsn || '').trim();
    if (!h) return '';
    var lm = lookupGstPct(h);
    if (lm !== null && !isNaN(lm)) return String(lm);
    if (it.gstPct == null || it.gstPct === '') return '';
    var g = parseNum(it.gstPct);
    return isFinite(g) && !isNaN(g) ? String(g) : '';
}
/** Searchable dropdown for HSN; first option prompts selection. gstHint fills orphan row rate when unknown in master (no default 18). */
function hsnOptionsHtml(selected, gstHintOpt) {
    var sel = String(selected || '').trim();
    var list = G_HsnMasterRows.slice().sort(function (a, b) {
        return String(a.code).localeCompare(String(b.code));
    });
    if (sel && !list.some(function (x) { return String(x.code) === sel; })) {
        var gOr = lookupGstPct(sel);
        if (gOr == null || isNaN(gOr)) {
            if (gstHintOpt != null && gstHintOpt !== '') {
                var ph = parseNum(gstHintOpt);
                if (isFinite(ph) && ph >= 0) gOr = ph;
            }
        }
        list.push({ code: sel, gst: gOr != null && !isNaN(gOr) ? gOr : 0 });
    }
    var opts =
        '<option value="">' +
        escInvoiceOptAttr('Select HSN') +
        '</option>' +
        list.map(function (h) {
            var v = escInvoiceOptAttr(h.code);
            return (
                '<option value="' +
                v +
                '"' +
                (String(h.code) === sel ? ' selected' : '') +
                '>' +
                escInvoiceOptAttr(h.code) +
                '</option>'
            );
        }).join('');
    return '<select class="form-select form-select-sm inv-hsn-select box_border">' + opts + '</select>';
}
/** Select2 inside modal — required for searchable HSN above backdrop. */
function destroyInvoiceLineHsnSelect2() {
    $('#tblInvoiceItemsBody .inv-hsn-select').each(function () {
        var $el = $(this);
        if ($el.data('select2')) {
            try {
                $el.select2('destroy');
            } catch (e1) {}
        }
    });
}
function initInvoiceLineHsnSelect2() {
    destroyInvoiceLineHsnSelect2();
    var $modal = $('#modalInvoiceGen');
    $('#tblInvoiceItemsBody .inv-hsn-select').each(function () {
        var $el = $(this);
        $el.select2({
            width: '100%',
            placeholder: 'Search HSN...',
            allowClear: true,
            dropdownParent: $modal.length ? $modal : $(document.body)
        });
    });
}
function recalcRow($tr) {
    var mrp = parseNum($tr.find('.inv-mrp').text());
    var scanMrp = parseNum($tr.find('.inv-scan-mrp').val());
    var discPct = parseNum($tr.find('.inv-disc-pct').val());
    /** Disc % is off list MRP when present; when MRP is 0 (e.g. dispatch-only data) use Scan MRP as base. */
    var discBase = mrp > 0 ? mrp : scanMrp;
    var discAmt = discBase * (discPct / 100);
    var taxable = scanMrp - discAmt;
    var gstRaw = ($tr.find('.inv-gst').val() || '').trim();
    var gstPct = gstRaw === '' ? 0 : parseNum(gstRaw);
    if (!isFinite(gstPct) || isNaN(gstPct) || gstPct < 0) gstPct = 0;
    var taxAmt = taxable * (gstPct / 100);
    var amount = taxable + taxAmt;
    $tr.find('.inv-disc-amt').text(formatMoney(discAmt));
    $tr.find('.inv-tax-amt').text(formatMoney(taxAmt));
    $tr.find('.inv-line-amt').text(formatMoney(amount));
    $tr.data('taxable', taxable);
    return { taxable: taxable, taxAmt: taxAmt, amount: amount };
}
function recalcInvoiceTotal() {
    var sum = 0;
    $('#tblInvoiceItemsBody tr').each(function () {
        var r = recalcRow($(this));
        sum += r.amount;
    });
    $('#lblInvoiceTotal').text(formatMoney(sum));
}
function bindInvoiceItemEvents() {
    $('#tblInvoiceItemsBody').off('input change', '.inv-scan-mrp, .inv-disc-pct, .inv-gst');
    $('#tblInvoiceItemsBody').on('input', '.inv-scan-mrp, .inv-disc-pct, .inv-gst', function () {
        recalcInvoiceTotal();
    });
    $('#tblInvoiceItemsBody')
        .off('change.invHsn', '.inv-hsn-select')
        .on('change.invHsn', '.inv-hsn-select', function () {
            var $sel = $(this);
            var $tr = $sel.closest('tr');
            var newHsn = String($sel.val() || '').trim();
            var $gstIn = $tr.find('.inv-gst');
            if (!newHsn) {
                $gstIn.val('');
                $tr.data('gstUserEdited', false);
                recalcInvoiceTotal();
                return;
            }
            var gst = lookupGstPct(newHsn);
            if (gst === null || isNaN(gst)) {
                toastr.warning('No GST rate in HSN Master for ' + newHsn + '. Enter GST % manually.');
                $gstIn.val('');
                $tr.data('gstUserEdited', true);
            } else {
                $gstIn.val(String(gst));
                $tr.data('gstUserEdited', false);
            }
            recalcInvoiceTotal();
        });
    $('#tblInvoiceItemsBody').off('change', '.inv-gst').on('change', '.inv-gst', function () {
        $(this).closest('tr').data('gstUserEdited', true);
    });
}
function tryPrefillInvoiceFields(dispatchCode) {
    $.ajax({
        url: appBaseURL + API_PREFILL_INVOICE + '?DispatchMaster_Code=' + encodeURIComponent(dispatchCode),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            if (res && res.InvoiceNo) {
                $('#txtInvInvoiceNo').val(res.InvoiceNo);
            }
            if (res && res.InvoiceDate) {
                try {
                    $('#txtInvInvoiceDate').datepicker('update', invAnyDateToPickerDmy(res.InvoiceDate));
                } catch (e) {
                    $('#txtInvInvoiceDate').val(invAnyDateToPickerDmy(res.InvoiceDate));
                }
            }
        },
        error: function () { /* optional API */ }
    });
}
async function invoiceMasterOpenGenerate(dispatchCode) {
    const { hasPermission, msg } = await CheckOptionPermission('Generate Invoice', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    var rowModel = findModelByDispatchCode(dispatchCode);
    if (!rowModel) {
        toastr.error('Row not found. Apply filter and try again.');
        return;
    }

    G_InvModalCtx = {
        orderMasterCode: rowModel.OrderMaster_Code,
        dispatchMasterCode: rowModel.DispatchMaster_Code,
        orderNo: rowModel.orderNo,
        clientName: rowModel.clientName,
        packingNo: rowModel.packingNo
    };

    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: appBaseURL + API_GET_INVOICE_GENERATE + '?DispatchMaster_Code=' + encodeURIComponent(dispatchCode),
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var lines = [];
            var invHeaders = response && (response.InvoiceHeader || response.invoiceHeader);
            var useInvoiceGenerateShape = Array.isArray(invHeaders) && invHeaders.length > 0;

            if (useInvoiceGenerateShape) {
                var hdr = invHeaders[0];
                var invMc = parseNum(hdr.InvoiceMaster_Code);
                if (invMc > 0) {
                    G_InvModalCtx.invoiceMasterCode = invMc;
                } else {
                    delete G_InvModalCtx.invoiceMasterCode;
                }

                $('#lblInvModalClient').text(hdr.ClientName || rowModel.clientName || '—');
                $('#txtInvVehicleNo').val(String(hdr.VehicleNo || rowModel.vehicleNoList || '').trim());
                if (hdr.InvoiceDate) {
                    try {
                        $('#txtInvInvoiceDate').datepicker('update', invAnyDateToPickerDmy(hdr.InvoiceDate));
                    } catch (e) {
                        $('#txtInvInvoiceDate').val(invAnyDateToPickerDmy(hdr.InvoiceDate));
                    }
                } else {
                    $('#txtInvInvoiceDate').datepicker('update', todayDmy());
                }
                if ((hdr.InvoiceNo || '').toString().trim()) {
                    $('#txtInvInvoiceNo').val(String(hdr.InvoiceNo).trim());
                } else {
                    $('#txtInvInvoiceNo').val(clientNextInvoiceNo());
                }
                $('#txtInvTerms').val(hdr.TermsAndconditions != null ? String(hdr.TermsAndconditions) : '');
                $('#txtInvBank').val(hdr.Bankdetails != null ? String(hdr.Bankdetails) : '');

                G_InvModalCtx.packedBy = rowModel.packedBy || '—';

                lines = (response.InvoiceLines || response.invoiceLines || [])
                    .map(mapInvoiceGenerateApiLineToInvoiceLine)
                    .filter(function (L) { return L.itemCode; });
            } else {
                if (!response || !response.OrderMaster || !response.OrderMaster.length) {
                    toastr.error('Order details not found.');
                    return;
                }
                delete G_InvModalCtx.invoiceMasterCode;
                var om = response.OrderMaster[0];
                G_InvModalCtx.orderMasterCode = String(om.Code || G_InvModalCtx.orderMasterCode || '');
                G_InvModalCtx.packedBy = om.PackedBy || rowModel.packedBy || '—';

                $('#lblInvModalClient').text(om.AccountName || rowModel.clientName || '—');
                $('#txtInvVehicleNo').val((rowModel.vehicleNoList || om.VehicleNo || '').toString());
                $('#txtInvInvoiceDate').datepicker('update', todayDmy());
                $('#txtInvInvoiceNo').val(clientNextInvoiceNo());
                $('#txtInvTerms').val('');
                $('#txtInvBank').val('');

                lines = (response.OrderDetial || response.OrderDetail || [])
                    .map(mapOrderDetailLineToInvoiceLine)
                    .filter(function (L) { return L.itemCode; });
            }

            if (!lines.length) {
                toastr.error('No line items for this dispatch.');
                return;
            }

            var body = '';
            lines.forEach(function (it, idx) {
                var gstDisplayed = gstPercentForInvoiceLine(it);
                var scanInit = it.scanMrp != null && parseNum(it.scanMrp) > 0 ? parseNum(it.scanMrp) : parseNum(it.mrp);
                var discInit = it.discPct != null ? parseNum(it.discPct) : 0;
                body += '<tr data-idx="' + idx + '">';
                body +=
                    '<td class="inv-cell-readonly inv-item-code text-nowrap"><span class="d-inline-block text-truncate" style="max-width:11rem;">' +
                    String(it.itemCode || '') +
                    '</span></td>';
                body +=
                    '<td class="inv-cell-readonly inv-item-name"><span class="d-inline-block text-truncate" style="max-width:18rem;" title="' +
                    escInvoiceOptAttr(it.itemName) +
                    '">' +
                    String(it.itemName || '') +
                    '</span></td>';
                body += '<td class="inv-cell-readonly text-end inv-qty text-nowrap">' + it.qty + '</td>';
                body += '<td class="inv-cell-readonly text-end inv-mrp text-nowrap">' + formatMoney(it.mrp) + '</td>';
                body +=
                    '<td class="text-end align-middle"><input type="number" step="0.01" class="form-control form-control-sm text-end inv-scan-mrp inv-line-input box_border" value="' +
                    formatMoney(scanInit) +
                    '" /></td>';
                body +=
                    '<td class="text-end align-middle"><input type="number" step="0.01" min="0" max="100" class="form-control form-control-sm text-end inv-disc-pct inv-line-input box_border" value="' +
                    formatMoney(discInit) +
                    '" /></td>';
                body += '<td class="inv-cell-readonly text-end inv-disc-amt text-nowrap">0.00</td>';
                body += '<td class="inv-hsn-cell align-middle">' + hsnOptionsHtml(it.hsn, it.gstPct) + '</td>';
                body +=
                    '<td class="text-end align-middle inv-gst-cell">' +
                    '<div class="input-group inv-gst-wrap flex-nowrap">' +
                    '<span class="input-group-text user-select-none" style="height:28px">%</span>' +
                    '<input type="number" step="0.01" min="0" max="999.99" class="form-control form-control-sm text-end inv-gst inv-line-input" value="' +
                    gstDisplayed +
                    '" />' +
                    '</div>' +
                    '</td>';
                body += '<td class="inv-cell-readonly text-end inv-tax-amt text-nowrap">0.00</td>';
                body +=
                    '<td class="inv-cell-readonly text-end inv-line-amt text-nowrap fw-semibold">' + '0.00' + '</td>';
                body += '</tr>';
            });
            $('#tblInvoiceItemsBody').html(body);
            bindInvoiceItemEvents();
            initInvoiceLineHsnSelect2();
            $('#tblInvoiceItemsBody tr').each(function () {
                recalcRow($(this));
            });
            recalcInvoiceTotal();

            if (!useInvoiceGenerateShape) {
                tryPrefillInvoiceFields(dispatchCode);
            }
            if (bsModalGen) bsModalGen.show();
        },
        error: function (xhr) {
            console.error('GetOrderDetailsForDispatch', xhr.status, xhr.responseText);
            toastr.error('Unable to load order lines.');
        },
        complete: function () {
            if (typeof unblockUI === 'function') unblockUI();
        }
    });
}
function validateBeforeSave() {
    if (!($('#txtInvVehicleNo').val() || '').trim()) {
        toastr.error('Vehicle number is required.');
        return false;
    }
    var invDateStr = ($('#txtInvInvoiceDate').val() || '').trim();
    if (!invDateStr) {
        toastr.error('Invoice date is required.');
        return false;
    }
    var parsedInv = parseApiDate(invDateStr);
    if (!parsedInv || isNaN(parsedInv.getTime())) {
        toastr.error('Invoice date is invalid. Use DD-MM-YYYY.');
        return false;
    }
    var invNoStr = ($('#txtInvInvoiceNo').val() || '').trim();
    if (!invNoStr) {
        toastr.error('Invoice number is required.');
        return false;
    }
    var ok = true;
    $('#tblInvoiceItemsBody tr').each(function () {
        var $tr = $(this);
        var scan = parseNum($tr.find('.inv-scan-mrp').val());
        if (scan <= 0) ok = false;
        var d = parseNum($tr.find('.inv-disc-pct').val());
        if (d < 0 || d > 100) ok = false;
        var taxable = parseNum($tr.data('taxable'));
        if (taxable < 0) ok = false;
        var hsnLine = ($tr.find('.inv-hsn-select').val() || '').trim();
        if (!hsnLine) ok = false;
        var gstStr = ($tr.find('.inv-gst').val() || '').trim();
        var gstPct = gstStr === '' ? NaN : parseNum(gstStr);
        if (!isFinite(gstPct) || isNaN(gstPct) || gstPct < 0) ok = false;
    });
    if (!ok) {
        toastr.error(
            'Check lines: Scan MRP > 0, discount 0–100%, taxable not negative, each line needs HSN and GST %.'
        );
        return false;
    }
    return true;
}
function collectInvoiceJsonLinesForSave() {
    var lines = [];
    $('#tblInvoiceItemsBody tr').each(function () {
        var $tr = $(this);
        recalcRow($tr);
        var hsnRaw = ($tr.find('.inv-hsn-select').val() || '').trim();
        lines.push({
            ItemCode: String($tr.find('.inv-item-code').text() || '').trim(),
            Qty: parseNum($tr.find('.inv-qty').text()),
            MRP: parseNum($tr.find('.inv-mrp').text()),
            ScanMRP: parseNum($tr.find('.inv-scan-mrp').val()),
            DiscountPercent: parseNum($tr.find('.inv-disc-pct').val()),
            DiscountAmount: parseNum($tr.find('.inv-disc-amt').text()),
            GSTRate: parseNum($tr.find('.inv-gst').val()),
            HSNCode: hsnRaw === '' ? 0 : hsnRaw,
            TaxAmount: parseNum($tr.find('.inv-tax-amt').text()),
            Amount: parseNum($tr.find('.inv-line-amt').text())
        });
    });
    return lines;
}
function buildClientSnapshotFromForm() {
    var lines = [];
    $('#tblInvoiceItemsBody tr').each(function () {
        var $tr = $(this);
        recalcRow($tr);
        lines.push({
            itemCode: $tr.find('.inv-item-code').text(),
            itemName: $tr.find('.inv-item-name').text(),
            qty: parseNum($tr.find('.inv-qty').text()),
            mrp: parseNum($tr.find('.inv-mrp').text()),
            scanMrp: parseNum($tr.find('.inv-scan-mrp').val()),
            discPct: parseNum($tr.find('.inv-disc-pct').val()),
            discAmt: parseNum($tr.find('.inv-disc-amt').text()),
            hsn: $tr.find('.inv-hsn-select').val(),
            gstPct: parseNum($tr.find('.inv-gst').val()),
            taxAmt: parseNum($tr.find('.inv-tax-amt').text()),
            amount: parseNum($tr.find('.inv-line-amt').text())
        });
    });
    return {
        clientName: $('#lblInvModalClient').text(),
        orderNo: G_InvModalCtx ? G_InvModalCtx.orderNo : '',
        packingNo: G_InvModalCtx ? G_InvModalCtx.packingNo : '',
        vehicleNo: $('#txtInvVehicleNo').val().trim(),
        invoiceDate: ($('#txtInvInvoiceDate').val() || '').trim(),
        invoiceNo: ($('#txtInvInvoiceNo').val() || '').trim(),
        terms: $('#txtInvTerms').val() || '',
        bank: $('#txtInvBank').val() || '',
        lines: lines,
        total: parseNum($('#lblInvoiceTotal').text())
    };
}
function saveGstInvoice() {
    if (!validateBeforeSave() || !G_InvModalCtx) return;

    var uid = UserMaster_Code != null ? parseInt(String(UserMaster_Code), 10) : NaN;
    if (isNaN(uid) || uid <= 0) {
        toastr.error('User session invalid (UserMaster_Code). Sign in again.');
        return;
    }

    /** Matches API body: code, jsonHeader, jsonLines → USP_InvoiceMasterSaveData P_Code, p_jsonHeader, p_jsonLines. */
    var invoiceNo = ($('#txtInvInvoiceNo').val() || '').trim();
    var jsonHeader = {
        DispatchMaster_Code: parseInt(String(G_InvModalCtx.dispatchMasterCode), 10) || 0,
        InvoiceNo: invoiceNo,
        InvoiceDate: invUiDateToApiYmd($('#txtInvInvoiceDate').val()),
        VehicleNo: $('#txtInvVehicleNo').val().trim(),
        TermsAndConditions: $('#txtInvTerms').val() || '',
        BankDetails: $('#txtInvBank').val() || ''
    };

    var invCodeParsed = G_InvModalCtx.invoiceMasterCode != null
        ? parseInt(String(G_InvModalCtx.invoiceMasterCode), 10)
        : 0;
    var saveMasterCode = isFinite(invCodeParsed) && invCodeParsed > 0 ? invCodeParsed : 0;

    var payload = {
        code: saveMasterCode,
        jsonHeader: jsonHeader,
        jsonLines: collectInvoiceJsonLinesForSave()
    };

    var snapshot = buildClientSnapshotFromForm();
    snapshot.invoiceNo = invoiceNo;

    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: appBaseURL + API_INVOICE_MASTER_SAVE_DATA + '?UserMaster_Code=' + encodeURIComponent(uid),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var row = Array.isArray(response) ? response[0] : response;
            if (row && (row.Status === 'Y' || row.status === 'Y')) {
                if (row.InvoiceNo) {
                    snapshot.invoiceNo = row.InvoiceNo;
                    $('#txtInvInvoiceNo').val(row.InvoiceNo);
                }
                if (row.InvoiceMaster_Code != null && G_InvModalCtx) {
                    G_InvModalCtx.invoiceMasterCode = row.InvoiceMaster_Code;
                }
                toastr.success((row.Msg || row.msg || 'Invoice saved.') + '');
                G_PrintSnapshots[G_InvModalCtx.dispatchMasterCode] = snapshot;
                if (bsModalGen) bsModalGen.hide();
                fetchPackedOrdersAndRender();
            } else {
                toastr.error((row && (row.Msg || row.msg)) ? row.Msg || row.msg : 'Save failed.');
            }
        },
        error: function (xhr) {
            var msg = 'Save API failed. Implement ' + API_INVOICE_MASTER_SAVE_DATA + ' on server.';
            if (xhr.status === 404) {
                toastr.warning(msg);
            } else {
                try {
                    var j = JSON.parse(xhr.responseText);
                    if (j && j.message) msg = j.message;
                } catch (e) { /* ignore */ }
                toastr.error(msg);
            }
        },
        complete: function () {
            if (typeof unblockUI === 'function') unblockUI();
        }
    });
}
function loadPrintOptionsUi() {
    try {
        var raw = sessionStorage.getItem(PRINT_OPTS_KEY);
        if (!raw) return;
        var o = JSON.parse(raw);
        $('#chkPrintHsn').prop('checked', !!o.hsn);
        $('#chkPrintDiscount').prop('checked', !!o.discount);
        $('#chkPrintMrp').prop('checked', !!o.mrp);
        $('#chkPrintTax').prop('checked', !!o.tax);
    } catch (e) { /* ignore */ }
}
function persistPrintOptionsUi() {
    sessionStorage.setItem(
        PRINT_OPTS_KEY,
        JSON.stringify({
            hsn: $('#chkPrintHsn').is(':checked'),
            discount: $('#chkPrintDiscount').is(':checked'),
            mrp: $('#chkPrintMrp').is(':checked'),
            tax: $('#chkPrintTax').is(':checked')
        })
    );
}
function updatePrintButtonEnabled() {
    var n = 0;
    if ($('#chkPrintHsn').is(':checked')) n++;
    if ($('#chkPrintDiscount').is(':checked')) n++;
    if ($('#chkPrintMrp').is(':checked')) n++;
    if ($('#chkPrintTax').is(':checked')) n++;
    $('#btnInvPrintConfirm').prop('disabled', n < 1);
}
function tryFetchPrintSnapshot(dispatchCode, done) {
    $.ajax({
        url: appBaseURL + API_GET_INVOICE_GENERATE + '?DispatchMaster_Code=' + encodeURIComponent(dispatchCode),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            if (res) {
                var snap = normalizeServerPrintPayload(res);
                if (snap) {
                    G_PrintSnapshots[dispatchCode] = snap;
                }
            }
            done();
        },
        error: function () {
            done();
        }
    });
}
/** Map GetInvoiceGenerateData JSON to the snapshot shape used by buildPrintHtml. */
function normalizeInvoiceGenerateShapeForPrint(res) {
    var invHeaders = res && (res.InvoiceHeader || res.invoiceHeader);
    var invLines = res && (res.InvoiceLines || res.invoiceLines);
    if (!Array.isArray(invHeaders) || invHeaders.length === 0) {
        return null;
    }
    var h = invHeaders[0];
    var lines = (invLines || []).map(function (L) {
        var itemCode = String(L['Item Code'] || L.ItemCode || '').trim();
        if (!itemCode) return null;
        var itemName = String(L['Item Name'] || L.ItemName || '').trim();
        var qty = parseNum(L.Qty);
        var mrp = parseNum(L.MRP);
        var scanMrp = parseNum(L['Scan MRP'] != null ? L['Scan MRP'] : L.ScanMRP);
        if (!(scanMrp > 0) && mrp > 0) {
            scanMrp = mrp;
        }
        var discPct = parseNum(L.DiscountPercent != null ? L.DiscountPercent : L.Discount);
        var discBase = mrp > 0 ? mrp : scanMrp;
        var discAmt = parseNum(L.DiscountAmount);
        if (!(discAmt > 0) && discPct > 0 && discBase > 0) {
            discAmt = discBase * (discPct / 100);
        }
        var hsn = String(L.HSNCode || L.HSN || '').trim();
        var gstPct = parseNum(L.GST != null ? L.GST : L.GSTRate);
        if (!(gstPct > 0)) {
            gstPct = 18;
        }
        var taxable = scanMrp - discAmt;
        var taxAmt = parseNum(L.TaxAmount);
        var amount = parseNum(L.Amount);
        if (!(taxAmt > 0) && !(amount > 0) && taxable >= 0) {
            taxAmt = taxable * (gstPct / 100);
            amount = taxable + taxAmt;
        } else if (!(amount > 0) && taxable >= 0) {
            amount = taxable + taxAmt;
        }
        return {
            itemCode: itemCode,
            itemName: itemName,
            qty: qty,
            mrp: mrp,
            scanMrp: scanMrp,
            discPct: discPct,
            discAmt: discAmt,
            hsn: hsn,
            gstPct: gstPct,
            taxAmt: taxAmt,
            amount: amount
        };
    }).filter(Boolean);

    var total = lines.reduce(function (s, ln) {
        return s + parseNum(ln.amount);
    }, 0);

    var orderFromHdr = String(
        h.OrderNo != null ? h.OrderNo : (h.orderNo || h['Order No'] || '')
    ).trim();
    var packFromHdr = String(
        h.PackingNo != null ? h.PackingNo :
            h.ChallanNo != null ? h.ChallanNo :
                h['Challan No'] != null ? h['Challan No'] : ''
    ).trim();

    return {
        clientName: String(h.ClientName || '').trim(),
        clientAddress: String(h.ClientAddress || '').trim(),
        orderNo: orderFromHdr,
        packingNo: packFromHdr,
        vehicleNo: String(h.VehicleNo || '').trim(),
        invoiceDate: formatDateDmyFromApi(h.InvoiceDate || ''),
        invoiceNo: String(h.InvoiceNo || '').trim(),
        terms: h.TermsAndconditions != null ? String(h.TermsAndconditions) : (h.TermsAndConditions != null ? String(h.TermsAndConditions) : ''),
        bank: h.Bankdetails != null ? String(h.Bankdetails) : (h.BankDetails != null ? String(h.BankDetails) : ''),
        total: total,
        lines: lines,
        companyName:    String(h.CompanyName || '').trim(),
        companyAddress: String(h.Address || h.WarehouseAddress || '').trim(),
        companyPhone:   String(h.Phone || h.ContactNo || h.MobileNo || '').trim(),
        companyEmail:   String(h.Email || h.EmailId || '').trim(),
        companyGstin:   String(h.GSTIN || h.GSTNo || h.GstNo || h.GSTNumber || '').trim(),
        bankACName:     String(h.ACName || h.BankACName || h.AccountName || '').trim(),
        bankName:       String(h.BankName || h.Bank || '').trim(),
        bankACNo:       String(h.ACNo || h.AccountNo || h.BankACNo || '').trim(),
        bankIFSC:       String(h.IFSCCode || h.IFSC || h.IFSCode || '').trim()
    };
}
function normalizeServerPrintPayload(res) {
    if (!res) return null;
    if (res.clientName && res.lines) return res;
    var fromGenerate = normalizeInvoiceGenerateShapeForPrint(res);
    if (fromGenerate) return fromGenerate;
    if (res.ClientName) {
        return {
            clientName:     String(res.ClientName || '').trim(),
            clientAddress:  String(res.ClientAddress || '').trim(),
            orderNo:        String(res.OrderNo || '').trim(),
            packingNo:      String(res.PackingNo || res.ChallanNo || '').trim(),
            vehicleNo:      String(res.VehicleNo || '').trim(),
            invoiceDate:    formatDateDmyFromApi(res.InvoiceDate || ''),
            invoiceNo:      String(res.InvoiceNo || '').trim(),
            terms:          res.TermsAndconditions != null ? String(res.TermsAndconditions) : (res.TermsAndConditions || res.Terms || ''),
            bank:           res.Bankdetails != null ? String(res.Bankdetails) : (res.BankDetails || res.Bank || ''),
            total:          parseNum(res.Total || res.InvoiceTotal),
            lines: (res.Lines || []).map(function (L) {
                return {
                    itemCode: String(L['Item Code'] || L.ItemCode || L.itemCode || '').trim(),
                    itemName: String(L['Item Name'] || L.ItemName || L.itemName || '').trim(),
                    qty:      parseNum(L.Qty || L.qty),
                    mrp:      parseNum(L.MRP || L.mrp),
                    scanMrp:  parseNum(L['Scan MRP'] != null ? L['Scan MRP'] : (L.ScanMRP || L.scanMrp)),
                    discPct:  parseNum(L.DiscountPercent || L.discPct),
                    discAmt:  parseNum(L.DiscountAmount || L.discAmt),
                    hsn:      String(L.HSNCode || L.HSN || L.hsn || '').trim(),
                    gstPct:   parseNum(L.GST != null ? L.GST : (L.GSTRate || L.gstPct)),
                    taxAmt:   parseNum(L.TaxAmount || L.taxAmt),
                    amount:   parseNum(L.Amount || L.amount)
                };
            }),
            companyName:    String(res.CompanyName || '').trim(),
            companyAddress: String(res.Address || res.WarehouseAddress || '').trim(),
            companyPhone:   String(res.Phone || res.ContactNo || '').trim(),
            companyEmail:   String(res.Email || res.EmailId || '').trim(),
            companyGstin:   String(res.GSTIN || res.GSTNo || '').trim(),
            bankACName:     String(res.ACName || res.AccountName || '').trim(),
            bankName:       String(res.BankName || '').trim(),
            bankACNo:       String(res.ACNo || res.AccountNo || '').trim(),
            bankIFSC:       String(res.IFSCCode || res.IFSC || '').trim()
        };
    }
    return null;
}
function buildPrintHtml(snap) {
    if (!snap) return '';
    var showHsn = $('#chkPrintHsn').is(':checked');
    var showDisc = $('#chkPrintDiscount').is(':checked');
    var showMrp = $('#chkPrintMrp').is(':checked');
    var showTax = $('#chkPrintTax').is(':checked');

    /* ── Company info: snap (from API header) takes priority; FixParameter is fallback ── */
    var fp = (FixParameter && FixParameter[0]) ? FixParameter[0] : {};
    function fpVal() {
        for (var _i = 0; _i < arguments.length; _i++) {
            var v = fp[arguments[_i]];
            if (v != null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    }
    function snapOrFp(snapField) {
        var sv = snap[snapField];
        if (sv != null && String(sv).trim() !== '') return String(sv).trim();
        for (var _j = 1; _j < arguments.length; _j++) { var fv = fp[arguments[_j]]; if (fv != null && String(fv).trim() !== '') return String(fv).trim(); }
        return '';
    }
    var companyName    = snapOrFp('companyName','CompanyName','companyName','CompanyShortName','CompanyNameForShow') || G_CompanyCode || '';
    var companyAddr    = snapOrFp('companyAddress','Address','address','WarehouseAddress','warehouseAddress','Warehouse','warehouse');
    var companyPhone   = snapOrFp('companyPhone','Phone','phone','ContactNo','contactNo','MobileNo','mobileNo');
    var companyEmail   = snapOrFp('companyEmail','Email','email','EmailId','emailId','EmailAddress');
    var companyGstin   = snapOrFp('companyGstin','GSTIN','gstin','GSTNo','gstNo','GSTNumber','gstNumber');
    var bankACName     = snapOrFp('bankACName','ACName','acName','BankACName','bankACName','AccountName','accountName') || companyName;
    var bankName       = snapOrFp('bankName','BankName','bankName') || '';
    var bankACNo       = snapOrFp('bankACNo','ACNo','acNo','AccountNo','accountNo','BankACNo','bankACNo') || '';
    var bankIFSC       = snapOrFp('bankIFSC','IFSCCode','ifscCode','IFSC','ifsc','IFSCode') || '';
    var clientAddress  = String(snap.clientAddress || '').trim();

    /* ── Table header ── */
    var th = '<th class="tc">Sr<br>No</th>';
    th += '<th>Description</th>';
    th += '<th>Products</th>';
    th += '<th class="tr">Quantity</th>';
    if (showMrp) th += '<th class="tr">MRP<br>Per Unit</th>';
    if (showDisc) th += '<th class="tr">Discount%</th>';
    if (showHsn)  th += '<th class="tc">HSN</th>';
    if (showTax)  th += '<th class="tr">GST%</th><th class="tr">Tax Amt</th>';
    th += '<th class="tr">Total<br>Amount</th>';

    /* ── Table rows ── */
    var rows = '';
    (snap.lines || []).forEach(function (ln, i) {
        rows += '<tr>';
        rows += '<td class="tc">' + (i + 1) + '</td>';
        rows += '<td>' + (ln.itemName || '') + '</td>';
        rows += '<td class="tc">' + (ln.itemCode || '') + '</td>';
        rows += '<td class="tr">' + ln.qty + '</td>';
        if (showMrp)  rows += '<td class="tr">' + formatMoney(ln.mrp) + '</td>';
        if (showDisc) rows += '<td class="tr">' + formatMoney(ln.discPct) + '</td>';
        if (showHsn)  rows += '<td class="tc">' + (ln.hsn || '') + '</td>';
        if (showTax)  rows += '<td class="tr">' + formatMoney(ln.gstPct) + '</td>' + '<td class="tr">' + formatMoney(ln.taxAmt) + '</td>';
        rows += '<td class="tr fw">' + formatMoney(ln.amount) + '</td>';
        rows += '</tr>';
    });

    var finalAmt = parseNum(snap.total);

    /* ── Styles ── */
    var css = [
        '@page{size:A4;margin:10mm}',
        '*{box-sizing:border-box}',
        'body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#000;margin:0;padding:8px}',
        '@media print{body{padding:0}}',
        '.wrap{border:1.5px solid #000}',
        /* Header */
        '.hdr{border-bottom:1px solid #000;padding:10px 14px;text-align:center}',
        '.hdr .doc-type{font-size:16px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}',
        '.hdr .co-name{font-size:26px;font-weight:bold;text-transform:uppercase;margin-bottom:4px;letter-spacing:.5px}',
        '.hdr .co-addr{font-size:13px;margin-bottom:3px}',
        '.hdr .co-contact{font-size:13px;margin-bottom:2px}',
        '.hdr .co-gstin{font-size:13px;margin-top:3px}',
        /* Client / Invoice info row */
        '.info-row{display:flex;border-bottom:1px solid #000}',
        '.info-left{flex:1;padding:9px 14px;border-right:1px solid #000}',
        '.info-right{width:250px;padding:9px 14px}',
        '.info-line{margin-bottom:4px;font-size:13px}',
        '.lbl{font-weight:bold}',
        /* Section title */
        '.sec-title{background:#efefef;border-bottom:1px solid #000;padding:5px 14px;font-weight:bold;font-size:13px;letter-spacing:.4px}',
        /* Product table */
        'table.prod{border-collapse:collapse;width:100%;font-size:12px}',
        'table.prod th,table.prod td{border:1px solid #000;padding:5px 7px;vertical-align:top}',
        'table.prod th{background:#efefef;text-align:center;font-size:12px}',
        '.tc{text-align:center!important}',
        '.tr{text-align:right!important}',
        '.fw{font-weight:bold}',
        /* Totals */
        '.totals-area{border-bottom:1px solid #000;padding:6px 14px}',
        'table.tot{width:100%;border-collapse:collapse;font-size:13px}',
        'table.tot td{padding:3px 7px;border:none}',
        /* Footer */
        '.footer-row{display:flex;border-bottom:1px solid #000}',
        '.footer-left{flex:1;padding:9px 14px;border-right:1px solid #000;font-size:12px;line-height:1.7}',
        '.footer-right{width:200px;padding:9px 14px;font-size:13px;text-align:center;font-weight:bold}',
        /* Signature */
        '.sig-row{display:flex}',
        '.sig-left{flex:1;padding:32px 14px 10px;border-right:1px solid #000;font-size:12px;text-align:center}',
        '.sig-right{width:200px;padding:32px 14px 10px;font-size:12px;text-align:center}'
    ].join('');

    var esc = function (s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    };

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Tax Invoice ' + esc(snap.invoiceNo || '') + '</title>';
    html += '<style>' + css + '</style></head><body>';
    html += '<div class="wrap">';

    /* ── 1. Company header ── */
    html += '<div class="hdr">';
    html += '<div class="doc-type">Tax Invoice (GST)</div>';
    if (companyName) html += '<div class="co-name">' + esc(companyName) + '</div>';
    if (companyAddr)    html += '<div class="co-addr">' + esc(companyAddr) + '</div>';
    var contactParts = [];
    if (companyPhone) contactParts.push('Ph.:- ' + esc(companyPhone));
    if (companyEmail) contactParts.push('E-mail:- ' + esc(companyEmail));
    if (contactParts.length) html += '<div class="co-contact">' + contactParts.join(', ') + '</div>';
    if (companyGstin) html += '<div class="co-gstin">GSTIN :- <strong>' + esc(companyGstin) + '</strong></div>';
    html += '</div>';

    /* ── 2. Client + Invoice info ── */
    html += '<div class="info-row">';
    html += '<div class="info-left">';
    html += '<div class="info-line"><span class="lbl">Client Name :-</span> ' + esc(snap.clientName || '') + '</div>';
    if (clientAddress && clientAddress.toLowerCase() !== 'n/a') {
        html += '<div class="info-line"><span class="lbl">ADDRESS :-</span> ' + esc(clientAddress) + '</div>';
    }
    if (snap.orderNo)   html += '<div class="info-line"><span class="lbl">Order No :-</span> ' + esc(snap.orderNo) + '</div>';
    if (snap.packingNo) html += '<div class="info-line"><span class="lbl">Challan No :-</span> ' + esc(snap.packingNo) + '</div>';
    html += '</div>';
    html += '<div class="info-right">';
    html += '<div class="info-line"><span class="lbl">Invoice No :-</span> ' + esc(snap.invoiceNo || '') + '</div>';
    html += '<div class="info-line"><span class="lbl">Date :-</span> ' + esc(snap.invoiceDate || '') + '</div>';
    if (snap.vehicleNo) html += '<div class="info-line"><span class="lbl">Vehicle No :-</span> ' + esc(snap.vehicleNo) + '</div>';
    html += '</div>';
    html += '</div>';

    /* ── 3. Product details table ── */
    html += '<div class="sec-title">Product Details</div>';
    html += '<table class="prod"><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table>';

    /* ── 4. Totals ── */
    html += '<div class="totals-area">';
    html += '<table class="tot"><tbody>';
    html += '<tr><td style="width:70%"></td><td class="tr fw">Final Amt:</td><td class="tr fw" style="font-size:15px">&#8377;&nbsp;' + formatMoney(finalAmt) + '</td></tr>';
    html += '</tbody></table>';
    html += '</div>';

    /* ── 6. Terms & footer ── */
    html += '<div class="footer-row">';
    html += '<div class="footer-left">';
    html += '<strong>Terms and Conditions</strong><br>';
    if (snap.terms && snap.terms.trim()) {
        html += esc(snap.terms).replace(/\n/g,'<br>') + '<br>';
    } else {
        html += 'The above mentioned good/material received in good intact condition.<br>';
        html += 'Goods once sold will not be taken back. E.&amp;O.E. Subject to .....<br>';
    }
    var hasStructuredBank = bankACNo || bankIFSC;
    if (hasStructuredBank) {
        html += '<strong style="display:block;border-top:1px solid #ccc;margin-top:5px;padding-top:4px;">Bank Details :-</strong>';
        html += 'A/C Name :- ' + esc(bankACName) + '<br>';
        html += 'Bank Name :- ' + esc(bankName || 'NA') + '<br>';
        html += 'A/C No. :- ' + esc(bankACNo) + '<br>';
        html += 'IFSC Code :- ' + esc(bankIFSC);
    } else if (bankName) {
        html += '<strong style="display:block;border-top:1px solid #ccc;margin-top:5px;padding-top:4px;">Bank Details :-</strong>';
        html += 'A/C Name :- ' + esc(bankACName) + '<br>';
        html += 'Bank Name :- ' + esc(bankName) + '<br>';
        html += 'A/C No. :- ' + esc(bankACNo) + '<br>';
        html += 'IFSC Code :- ' + esc(bankIFSC);
    } else if (snap.bank && snap.bank.trim()) {
        html += '<strong style="display:block;border-top:1px solid #ccc;margin-top:5px;padding-top:4px;">Bank Details :-</strong>';
        html += esc(snap.bank).replace(/\n/g,'<br>');
    }
    html += '</div>';
    html += '<div class="footer-right">For ' + esc(companyName) + '</div>';
    html += '</div>';

    /* ── 7. Signature row ── */
    html += '<div class="sig-row">';
    html += '<div class="sig-left">Receiver\'s Signature</div>';
    html += '<div class="sig-right">Authorized Signatory</div>';
    html += '</div>';

    html += '</div>'; /* .wrap */
    html += '<script>window.onload=function(){window.print();}<\/script>';
    html += '</body></html>';
    return html;
}
function mergePrintSnapshotOrderPackingFromGrid(dispatchCode, snap) {
    if (!snap) return snap;
    var m = findModelByDispatchCode(dispatchCode);
    if (!m) return snap;
    if (!String(snap.orderNo || '').trim() && m.orderNo) {
        snap.orderNo = m.orderNo;
    }
    if (!String(snap.packingNo || '').trim() && m.packingNo) {
        snap.packingNo = m.packingNo;
    }
    return snap;
}
function invoiceMasterOpenPrint(dispatchCode) {
    printOrderDispatchCode = dispatchCode;
    loadPrintOptionsUi();
    updatePrintButtonEnabled();

    if (typeof blockUI === 'function') blockUI();
    tryFetchPrintSnapshot(dispatchCode, function () {
        if (typeof unblockUI === 'function') unblockUI();
        var snap = G_PrintSnapshots[dispatchCode];
        snap = mergePrintSnapshotOrderPackingFromGrid(dispatchCode, snap);
        if (snap) {
            G_PrintSnapshots[dispatchCode] = snap;
        }
        if (!G_PrintSnapshots[dispatchCode]) {
            toastr.warning('No invoice data for print. Save invoice first or implement ' + API_GET_GST_PRINT + '.');
            return;
        }
        if (bsModalPrint) bsModalPrint.show();
    });
}
function confirmInvoicePrint() {
    persistPrintOptionsUi();
    var d = printOrderDispatchCode;
    var snap = G_PrintSnapshots[d];
    if (!snap) {
        toastr.error('Nothing to print.');
        return;
    }
    var html = buildPrintHtml(snap);
    var w = window.open('', '_blank');
    if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
    } else {
        toastr.warning('Allow pop-ups to print.');
    }
    if (bsModalPrint) bsModalPrint.hide();
}
function initInvoiceDatePickers() {
    var common = {
        format: 'dd-mm-yyyy',
        autoclose: true,
        clearBtn: true,
        todayHighlight: true
    };
    $('#txtInvFromDate, #txtInvToDate, #txtInvInvoiceDate').datepicker(common);
    $('#txtInvFromDate').datepicker('setDate', monthStartDmy());
    $('#txtInvToDate').datepicker('setDate', todayDmy());
}

$(document).ready(function () {
    $('#ERPHeading').text('Invoice (GST)');
    GetModuleMasterCodeForInvoice();

    modalGenEl = document.getElementById('modalInvoiceGen');
    modalPrintEl = document.getElementById('modalPrintInvoice');
    bsModalGen = getBootstrapModal(modalGenEl);
    bsModalPrint = getBootstrapModal(modalPrintEl);

    initInvoiceDatePickers();

    loadInvoiceClientDropDown(function () {
        loadItemDetailsForInvoice(function () {
            loadHsnMasterFromApi(function () {
                fetchPackedOrdersAndRender();
            });
        });
    });

    $('#btnInvApplyFilter').on('click', function () {
        fetchPackedOrdersAndRender();
    });

    $('#btnInvResetFilter').on('click', function () {
        $('#ddlInvClientName').val('').trigger('change');
        $('#txtInvFromDate').datepicker('update', monthStartDmy());
        $('#txtInvToDate').datepicker('update', todayDmy());
        fetchPackedOrdersAndRender();
    });

    $('#btnInvSave').on('click', saveGstInvoice);

    $('#chkPrintHsn, #chkPrintDiscount, #chkPrintMrp, #chkPrintTax').on('change', updatePrintButtonEnabled);
    $('#btnInvPrintConfirm').on('click', confirmInvoicePrint);

    $('#modalInvoiceGen').on('hidden.bs.modal', function () {
        destroyInvoiceLineHsnSelect2();
    });

    window.invoiceMasterOpenGenerate = invoiceMasterOpenGenerate;
    window.invoiceMasterOpenPrint = invoiceMasterOpenPrint;
});

/**
 * Order Picking Print — client-side HTML → browser Print / Save as PDF.
 * Layout matches warehouse picking slip (company, order header, Product Details, signatures).
 * GET /api/OrderMaster/GetOrderPickingPrint?OrderMaster_Code=
 */
var API_GET_ORDER_PICKING_PRINT = '/api/OrderMaster/GetOrderPickingPrint';

function oppPickField(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]).trim();
    }
    return '';
}

function oppEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function oppPad2(n) {
    return String(n).padStart(2, '0');
}

/** Keep API date as-is (e.g. 31-Jul-2026 / 01-Aug-2026). */
function oppDisplayDate(val) {
    if (val == null || val === '') return '';
    return String(val).trim();
}

function oppLoginUserName() {
    var fromSession = sessionStorage.getItem('UserName');
    if (fromSession && String(fromSession).trim()) return String(fromSession).trim();
    var auth = (typeof authKeyData !== 'undefined' && authKeyData) ? authKeyData : null;
    if (!auth) {
        try { auth = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { auth = null; }
    }
    return (auth && (auth.UserName || auth.userName)) ? String(auth.UserName || auth.userName).trim() : '';
}

function normalizeOrderPickingPrintPayload(res) {
    if (!res) return null;
    var headers = res.OrderHeader || res.orderHeader || [];
    var details = res.OrderDetails || res.orderDetails || [];
    if (!Array.isArray(headers) || headers.length === 0) return null;

    var h = headers[0];
    var lines = (Array.isArray(details) ? details : []).map(function (L, idx) {
        var sr = oppPickField(L, ['Sr No', 'SrNo', 'Sr', 'SNo', 'RowNo']);
        return {
            sr: sr || String(idx + 1),
            productName: oppPickField(L, ['Product Name', 'ProductName', 'ItemCode', 'Item Code', 'ItemBarCode']),
            description: oppPickField(L, ['Description', 'ItemName', 'Item Name', 'ProductDescription']),
            mrp: oppPickField(L, ['MRP', 'Mrp', 'Rate', 'ScanMRP']),
            ordQty: oppPickField(L, ['Ord Qty', 'OrdQty', 'OrderQty', 'Order Qty', 'Qty', 'Quantity']),
            pickQty: oppPickField(L, ['Pick Qty', 'PickQty']),
            rackNo: oppPickField(L, ['Rack No', 'RackNo', 'Rank No', 'RankNo']),
            location: oppPickField(L, ['Location(Bin)', 'Location (Bin)', 'LocationName', 'Location', 'Bin', 'BinNo', 'Item Address', 'ItemAddress']),
            stock: oppPickField(L, ['Stock', 'StockQty', 'ClosingStock', 'AvailableQty']),
            brand: oppPickField(L, ['Brand', 'BrandName', 'brand'])
        };
    });

    var qQty = oppPickField(h, ['Q Qty', 'QQty', 'TotalQty', 'Total Order Qty', 'OrderQty']);
    if (!qQty && lines.length) {
        var sum = 0;
        lines.forEach(function (ln) {
            var q = parseFloat(ln.ordQty);
            if (!isNaN(q)) sum += q;
        });
        if (sum) qQty = String(sum);
    }

    return {
        companyName: oppPickField(h, ['CompanyName', 'Company Name', 'CompanyShortName', 'CompanyNameForShow']),
        orderNo: oppPickField(h, ['Order No', 'OrderNo', 'orderNo']),
        partyName: oppPickField(h, ['Party Name', 'PartyName', 'AccountName', 'ClientName', 'Client Name', 'Account Name']),
        address: oppPickField(h, ['Address', 'ClientAddress', 'Client Address', 'PartyAddress']),
        pickedBy: oppLoginUserName(),
        printDate: oppDisplayDate(oppPickField(h, ['PrintDate', 'Print Date', 'PrintedOn'])),
        orderDate: oppDisplayDate(oppPickField(h, ['Order Date', 'OrderDate'])),
        totalOrderQty: qQty,
        lines: lines
    };
}

function oppFooterDateDdMmmYyyy() {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
}

function buildOrderPickingPrintHtml(snap) {
    if (!snap) return '';

    var rows = '';
    var footerDate = oppFooterDateDdMmmYyyy();
    (snap.lines || []).forEach(function (ln) {
        rows += '<tr>'
            + '<td class="tc">' + oppEsc(ln.sr) + '</td>'
            + '<td class="code">' + oppEsc(ln.productName) + '</td>'
            + '<td>' + oppEsc(ln.description) + '</td>'
            + '<td class="tr">' + oppEsc(ln.mrp) + '</td>'
            + '<td class="tc qty">' + oppEsc(ln.ordQty) + '</td>'
            + '<td class="pick">' + oppEsc(ln.pickQty) + '</td>'
            + '<td class="tc">' + oppEsc(ln.rackNo) + '</td>'
            + '<td class="tc loc">' + oppEsc(ln.location) + '</td>'
            + '<td class="tr">' + oppEsc(ln.stock) + '</td>'
            + '<td>' + oppEsc(ln.brand) + '</td>'
            + '</tr>';
    });
    if (!rows) {
        rows = '<tr><td colspan="10" class="tc muted">No items found</td></tr>';
    }

    var company = snap.companyName || '';
    var pdfName = String(snap.orderNo || 'Order').replace(/[\\\/:*?"<>|]+/g, '-').trim() || 'Order';
    return '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>' + oppEsc(pdfName) + '</title>'
        + '<style>'
        + '*{box-sizing:border-box;margin:0;padding:0}'
        + 'body{font-family:Segoe UI,Tahoma,Arial,sans-serif;font-size:12px;color:#111;background:#fff;padding:8px 10px 30px}'
        + '.sheet{max-width:100%}'
        + '.brand{text-align:center;border-bottom:2px solid #111;padding:0 0 8px;margin:0 0 12px}'
        + '.brand h1{font-size:20px;font-weight:700;letter-spacing:.3px;line-height:1.2}'
        + '.brand .doc{margin-top:3px;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#333}'
        + '.meta-block{margin:0 0 12px;max-width:520px}'
        + '.row{display:flex;gap:8px;margin:0 0 4px;align-items:baseline}'
        + '.lbl{min-width:110px;color:#333;font-size:12px;font-weight:600}'
        + '.val{flex:1;font-size:12px}'
        + '.val.strong{font-weight:700}'
        + '.meta-gap{height:8px}'
        + '.sec{display:flex;align-items:center;gap:8px;margin:4px 0 6px}'
        + '.sec span{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px}'
        + '.sec:after{content:"";flex:1;height:1px;background:#999}'
        + 'table.items{width:100%;border-collapse:collapse;table-layout:fixed}'
        + 'table.items th,table.items td{border:1px solid #333;padding:5px 4px;vertical-align:middle;font-size:11px;word-wrap:break-word}'
        + 'table.items th{background:#e8e8e8;font-weight:700;text-align:center;font-size:10px}'
        + 'table.items tbody tr:nth-child(even){background:#fafafa}'
        + '.tc{text-align:center}.tr{text-align:right}.code{font-weight:600}.loc{font-weight:700}.qty{font-weight:700}'
        + '.pick{min-height:18px;background:#fff;text-align:center}.muted{color:#777}'
        + '.signs{display:flex;gap:16px;margin-top:28px}'
        + '.sign{flex:1;text-align:center}'
        + '.sign .line{border-top:1px solid #111;margin:28px 8px 4px;height:0}'
        + '.sign .cap{font-size:11px;font-weight:600}'
        + '.page-date{position:fixed;left:0;right:0;bottom:3px;text-align:center;font-size:10px;color:#333}'
        + '@page{margin:5mm;size:A4}'
        + '@media print{body{padding:4px 6px 24px}table.items th,table.items tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
        + '</style></head><body><div class="sheet">'
        + '<div class="brand"><h1>' + oppEsc(company) + '</h1><div class="doc">Order Picking List</div></div>'
        + '<div class="meta-block">'
        + '<div class="row"><div class="lbl">Order No</div><div class="val strong">' + oppEsc(snap.orderNo) + '</div></div>'
        + '<div class="row"><div class="lbl">Party Name</div><div class="val strong">' + oppEsc(snap.partyName) + '</div></div>'
        + '<div class="row"><div class="lbl">Address</div><div class="val">' + oppEsc(snap.address) + '</div></div>'
        + '<div class="meta-gap"></div>'
        + '<div class="row"><div class="lbl">Print By</div><div class="val">' + oppEsc(snap.pickedBy) + '</div></div>'
        + '<div class="row"><div class="lbl">Print Date</div><div class="val">' + oppEsc(snap.printDate) + '</div></div>'
        + '<div class="row"><div class="lbl">Order Date</div><div class="val">' + oppEsc(snap.orderDate) + '</div></div>'
        + '<div class="row"><div class="lbl">Total Order Qty</div><div class="val strong">' + oppEsc(snap.totalOrderQty) + '</div></div>'
        + '</div>'
        + '<div class="sec"><span>Product Details</span></div>'
        + '<table class="items"><thead><tr>'
        + '<th style="width:5%">Sr</th><th style="width:12%">Product Name</th><th style="width:22%">Description</th>'
        + '<th style="width:7%">MRP</th><th style="width:7%">Ord Qty</th><th style="width:7%">Pick Qty</th>'
        + '<th style="width:8%">Rack No</th><th style="width:10%">Location (Bin)</th><th style="width:8%">Stock</th><th style="width:14%">Brand</th>'
        + '</tr></thead><tbody>' + rows + '</tbody></table>'
        + '<div class="signs">'
        + '<div class="sign"><div class="line"></div><div class="cap">Picked By</div></div>'
        + '<div class="sign"><div class="line"></div><div class="cap">Packed By</div></div>'
        + '<div class="sign"><div class="line"></div><div class="cap">Checked By</div></div>'
        + '</div></div>'
        + '<div class="page-date">' + oppEsc(footerDate) + '</div>'
        + '</body></html>';
}

function printOrderPickingHtml(html, orderNo) {
    var iframe = document.getElementById('oppPrintFrame');
    if (iframe) iframe.remove();
    iframe = document.createElement('iframe');
    iframe.id = 'oppPrintFrame';
    iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
    document.body.appendChild(iframe);
    var win = iframe.contentWindow;
    var doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(function () {
        var prevTitle = document.title;
        var name = String(orderNo || '').replace(/[\\\/:*?"<>|]+/g, '-').trim();
        try {
            if (name) {
                document.title = name;
                doc.title = name;
            }
            win.focus();
            win.print();
        } catch (e) { }
        setTimeout(function () {
            document.title = prevTitle;
            if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1500);
    }, 300);
}

function getOrderPickingPrintSessionCtx() {
    var appUrl = (typeof appBaseURL !== 'undefined' && appBaseURL) ? appBaseURL : sessionStorage.getItem('AppBaseURL');
    var auth = (typeof authKeyData !== 'undefined' && authKeyData)
        ? authKeyData
        : (function () {
            try { return JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { return null; }
        })();
    if (!appUrl || !auth) {
        toastr.error('Session expired. Please sign in again.');
        return null;
    }
    return { appUrl: appUrl, auth: auth };
}

function openOrderPickingPrint(orderMasterCode) {
    var code = parseInt(orderMasterCode, 10) || 0;
    if (!code) {
        toastr.error('Invalid order for print.');
        return;
    }
    var ctx = getOrderPickingPrintSessionCtx();
    if (!ctx) return;

    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: ctx.appUrl + API_GET_ORDER_PICKING_PRINT + '?OrderMaster_Code=' + encodeURIComponent(code),
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', ctx.auth); },
        success: function (res) {
            if (typeof unblockUI === 'function') unblockUI();
            var snap = normalizeOrderPickingPrintPayload(res);
            if (!snap) {
                toastr.warning('No picking data found for this order.');
                return;
            }
            printOrderPickingHtml(buildOrderPickingPrintHtml(snap), snap.orderNo);
        },
        error: function (xhr) {
            if (typeof unblockUI === 'function') unblockUI();
            var msg = (xhr && xhr.responseText) ? xhr.responseText : 'Unable to load order picking print data.';
            toastr.error(msg);
        }
    });
}

window.openOrderPickingPrint = openOrderPickingPrint;
window.PrintOrderPicking = openOrderPickingPrint;
window.normalizeOrderPickingPrintPayload = normalizeOrderPickingPrintPayload;
window.buildOrderPickingPrintHtml = buildOrderPickingPrintHtml;

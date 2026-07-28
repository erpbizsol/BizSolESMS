var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig') || '[]');
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');

var API_OC_LIST        = '/api/OrderCancellation/GetOrderCancellationList';
var API_OC_DETAIL      = '/api/OrderCancellation/GetOrderCancellationDetail';
var API_OC_SAVE        = '/api/OrderCancellation/SaveOrderCancellation';
var API_OC_REOPEN_LIST = '/api/OrderCancellation/GetReOpenOrderList';
var API_OC_REOPEN      = '/api/OrderCancellation/ReOpenOrderCancellation';

let G_OcListData   = [];
let G_OcDetailRows = [];

$(document).ready(function () {
    $('#ERPHeading').text('Back Order/Cancel');
    GetModuleMasterCode();
    GetReasonMasterList();
    ShowOrderCancellationList('Load');
});

function GetModuleMasterCode() {
    try {
        var data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'order cancellation' || d === 'order cancel';
        });
        if (result) UserModuleMaster_Code = result.Code;
    } catch (e) {
        UserModuleMaster_Code = 0;
    }
}

function GetReasonMasterList() {
    $.ajax({
        url: appBaseURL + '/api/Master/GetReasonMasterByForUse?ForUse=OrderCancel',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            var html = '<option value="">-- Select Reason --</option>';
            if (response && response.length > 0) {
                $.each(response, function (i, val) {
                    // handle both Code/code and Desp/desp from API
                    var code = val.Code !== undefined ? val.Code : (val.code || '');
                    var desp = val.Desp || val.desp || '';
                    html += '<option value="' + code + '">' + desp + '</option>';
                });
            }
            var $sel = $('#txtOcReason');
            $sel[0].innerHTML = html;
            if ($.fn.select2) {
                $sel.select2({ width: '100%', placeholder: '-- Select Reason --' });
            }
        },
        error: function () {
            $('#txtOcReason').empty();
        }
    });
}

function ShowOrderCancellationList(type) {
    blockUI();
    $.ajax({
        url: appBaseURL + API_OC_LIST,
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            var $table    = $('#ocOrderTable');
            var $empty    = $('#ocEmptyState');
            var $badge    = $('#ocListCountBadge');

            if (response && response.length > 0) {
                G_OcListData = response;
                var cnt = response.length;
                $badge.text(cnt + ' order' + (cnt !== 1 ? 's' : '')).show();
                $empty.hide();
                $table.show();

                const updatedResponse = response.map(function (item) {
                    return Object.assign({}, item, {
                        Action: '<button class="btn btn-sm btn-danger esms-oc-action-btn" title="Cancel items" onclick="OpenOrderCancellation(\'' + item.Code + '\')">'
                               + '<i class="fa-solid fa-ban me-1"></i>Cancel</button>'
                    });
                });

                BizsolCustomFilterGrid.CreateDataTable(
                    'table-header', 'table-body', updatedResponse,
                    false, [],
                    ['Order No', 'Client Name', 'Buyer PO No', 'Order Status'],
                    ['Pending Qty', 'Order Qty', 'Dispatch Qty', 'Cancel Qty'],
                    ['Order Date', 'Buyer PO Date'],
                    [],
                    ['Code'],
                    { 'Pending Qty': 'right', 'Order Qty': 'right', 'Dispatch Qty': 'right', 'Cancel Qty': 'right' }
                );
            } else {
                G_OcListData = [];
                $badge.hide();
                $table.hide();
                $empty.show();
                if (type !== 'Load') toastr.info('No pending orders for cancellation.');
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            $('#ocOrderTable').hide();
            $('#ocEmptyState').show();
            console.error('ShowOrderCancellationList:', error);
            if (type !== 'Load') toastr.error('Unable to load order list.');
        }
    });
}

async function OpenOrderCancellation(code) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission === false) { toastr.error(msg); return; }

    blockUI();
    $.ajax({
        url: appBaseURL + API_OC_DETAIL + '?Code=' + encodeURIComponent(code),
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            if (!response) { toastr.error('Record not found.'); return; }

            var header  = null;
            var details = [];

            // Resolve header — try all common casing variants
            var headerKeys = ['OrderMaster', 'orderMaster', 'OrderHeader', 'orderHeader'];
            for (var i = 0; i < headerKeys.length; i++) {
                if (response[headerKeys[i]] && response[headerKeys[i]].length) {
                    header = response[headerKeys[i]][0]; break;
                }
            }

            // Resolve details — try all common casing variants
            var detailKeys = ['OrderDetial', 'orderDetial', 'OrderDetail', 'orderDetail', 'OrderItems', 'orderItems'];
            for (var j = 0; j < detailKeys.length; j++) {
                if (response[detailKeys[j]] && response[detailKeys[j]].length) {
                    details = response[detailKeys[j]]; break;
                }
            }

            if (!header) { toastr.error('Order header not found.'); return; }
            if (!details.length) { toastr.error('No cancellable line items found for this order.'); return; }

            G_OcDetailRows = details;

            $('#hfOrderMasterCode').val(header.Code || code);
            $('#txtOcOrderNo').val(header.OrderNo      || header['Order No']      || '');
            $('#txtOcClientName').val(header.AccountName  || header['Client Name']   || '');
            $('#txtOcOrderDate').val(header.OrderDate    || header['Order Date']    || '');
            $('#txtOcBuyerPONo').val(header.BuyerPONo    || header['Buyer PO No']   || '');

            // Reset cancellation fields safely
            var $reason = $('#txtOcReason');
            if ($.fn.select2 && $reason.data('select2')) {
                $reason.val('').trigger('change');
            } else {
                $reason.val('');
            }
            $('#txtOcRemark').val('');

            RenderOrderCancellationItems(details);
            $('#ocListPage').hide();
            $('#ocDetailPage').show();
            $('#ocToolbar').show();
        },
        error: function () {
            unblockUI();
            toastr.error('Unable to load order details.');
        }
    });
}

function RenderOrderCancellationItems(rows) {
    $('#ocItemTable').show();

    var itemNameHeader = (G_ItemConfig[0] && G_ItemConfig[0].ItemNameHeader) ? G_ItemConfig[0].ItemNameHeader : 'Item Name';
    var itemCodeHeader = (G_ItemConfig[0] && G_ItemConfig[0].ItemCodeHeader) ? G_ItemConfig[0].ItemCodeHeader : 'Item Code';

    const hiddenColumns   = ['Code', 'OrderDetailMaster_Code', 'ItemMaster_Code', 'Line Status'];
    const ColumnAlignment = {
        'Order Qty':      'right;width:72px;',
        'Dispatch Qty':   'right;width:72px;',
        'Cancel Qty':     'right;width:72px;',
        'Pending Qty':    'right;width:72px;',
        'Balance Qty':    'right;width:72px;',
        'New Cancel Qty': 'right;width:105px;'
    };
    const renameMap = { 'Item Name': itemNameHeader, 'Item Code': itemCodeHeader };

    const updatedResponse = rows.map(function (item) {
        var renamed = {};
        for (var key in item) {
            renamed[renameMap.hasOwnProperty(key) ? renameMap[key] : key] = item[key];
        }

        var detailCode = item.Code || item.OrderDetailMaster_Code || 0;
        var pending    = item['Pending Qty'] != null ? item['Pending Qty']
                       : (item['Balance Qty'] != null ? item['Balance Qty'] : (item['Bal Qty'] || 0));

        renamed['New Cancel Qty'] =
            '<input type="text" inputmode="numeric" id="txtNewCancelQty_' + detailCode + '"'
            + ' data-detail-code="' + detailCode + '" data-pending-qty="' + (pending || 0) + '"'
            + ' onkeydown="return OcQtyKeyDown(event);"'
            + ' oninput="OcQtyInput(this);"'
            + ' class="form-control form-control-sm text-end oc-cancel-qty"'
            + ' autocomplete="off" placeholder="0" value="">';
        return renamed;
    });

    BizsolCustomFilterGrid.CreateDataTable(
        'ocItemTable-header', 'ocItemTable-body', updatedResponse,
        false, [],
        [],
        ['Order Qty', 'Dispatch Qty', 'Cancel Qty', 'Pending Qty', 'Balance Qty'],
        [],
        [itemNameHeader, itemCodeHeader],
        hiddenColumns,
        ColumnAlignment
    );
}

// Allow only digits + navigation keys (fixes backspace not working in onkeypress)
function OcQtyKeyDown(event) {
    var key = event.key;
    if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return true;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) return true;
    if (!/^\d$/.test(key)) { event.preventDefault(); return false; }
    return true;
}

// Live validation against pending qty — also strips non-digits on paste
function OcQtyInput(el) {
    var raw     = el.value.replace(/\D/g, '');
    var pending = parseFloat(el.dataset.pendingQty) || 0;
    el.value    = raw;
    if (raw !== '' && pending > 0 && parseFloat(raw) > pending) {
        el.classList.add('is-invalid');
        el.title = 'Max allowed: ' + pending;
    } else {
        el.classList.remove('is-invalid');
        el.title = '';
    }
}

// Live search across all visible columns of the list grid
function OcListSearch(term) {
    var tableId = 'table';
    var bodyId  = 'table-body';
    var full    = window['filteredDataTemp_' + tableId];
    if (!full) return;

    term = (term || '').toLowerCase().trim();

    var result = term === ''
        ? full
        : full.filter(function (row) {
            return Object.values(row).some(function (val) {
                return val != null && String(val).toLowerCase().indexOf(term) !== -1;
            });
        });

    window['filteredData_' + tableId] = result;
    window['currentPage_' + tableId]  = 1;
    if (typeof renderTableWithPagination === 'function') {
        renderTableWithPagination(tableId, bodyId);
    }
}

function BackToList() {
    $('#ocDetailPage').hide();
    $('#ocToolbar').hide();
    $('#ocListPage').show();
    $('#txtOcListSearch').val('');
    G_OcDetailRows = [];
    ShowOrderCancellationList('Get');
}

async function SaveOrderCancellation() {
    const { hasPermission, msg } = await CheckOptionPermission('Save', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission === false) { toastr.error(msg); return; }

    var reasonCode = $('#txtOcReason').val();
    if (!reasonCode) {
        toastr.warning('Please select a cancellation reason.');
        $('#txtOcReason').focus();
        return;
    }

    var orderMasterCode = $('#hfOrderMasterCode').val();
    var lines    = [];
    var hasError = false;

    $('.oc-cancel-qty').each(function () {
        var qty     = parseFloat((this.value || '').trim());
        var pending = parseFloat(this.dataset.pendingQty) || 0;
        if (isNaN(qty) || qty <= 0) return;
        if (qty > pending) {
            hasError = true;
            toastr.error('Cancel qty (' + qty + ') exceeds pending qty (' + pending + ').');
            this.focus();
            return false;
        }
        lines.push({
            OrderDetailMaster_Code: parseInt(this.dataset.detailCode, 10) || 0,
            CancelQty: qty
        });
    });

    if (hasError) return;
    if (!lines.length) {
        toastr.warning('Enter cancel quantity for at least one item.');
        return;
    }

    var payload = {
        OrderMaster_Code:  parseInt(orderMasterCode, 10) || 0,
        ReasonMaster_Code: parseInt(reasonCode, 10) || 0,
        Remark: ($('#txtOcRemark').val() || '').trim(),
        Details: lines.map(function (l) {
            return { OrderDetailMaster_Code: l.OrderDetailMaster_Code, CancelQty: l.CancelQty };
        })
    };

    blockUI();
    $.ajax({
        url: appBaseURL + API_OC_SAVE + '?UserMaster_Code=' + encodeURIComponent(UserMaster_Code),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            var result = Array.isArray(response) && response.length ? response[0] : (response || {});
            if (result.Status === 'Y') {
                toastr.success(result.Msg || 'Order cancellation saved successfully.');
                BackToList();
            } else {
                toastr.error(result.Msg || 'Unable to save cancellation.');
            }
        },
        error: function (xhr) {
            unblockUI();
            var errMsg = 'Unable to save order cancellation.';
            try { var p = JSON.parse(xhr.responseText); if (p && p.Msg) errMsg = p.Msg; } catch (e) {}
            toastr.error(errMsg);
        }
    });
}

// ── Tab switching ──────────────────────────────────────────────────────────
var G_OcActiveTab = 'active';

function SwitchOcTab(tab) {
    G_OcActiveTab = tab;
    if (tab === 'active') {
        $('#tabBtnActive').addClass('active');
        $('#tabBtnCancelled').removeClass('active');
        $('#ocActiveSection').show();
        $('#ocCancelledSection').hide();
        $('#txtOcListSearch').val('');
        ShowOrderCancellationList('Get');
    } else {
        $('#tabBtnCancelled').addClass('active');
        $('#tabBtnActive').removeClass('active');
        $('#ocCancelledSection').show();
        $('#ocActiveSection').hide();
        ShowReOpenOrderList('Load');
    }
}

// ── Re-Open list ───────────────────────────────────────────────────────────
function ShowReOpenOrderList(type) {
    blockUI();
    $.ajax({
        url: appBaseURL + API_OC_REOPEN_LIST,
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            var $table = $('#ocReOpenTable');
            var $empty = $('#ocReOpenEmptyState');
            var $badge = $('#ocReOpenCountBadge');

            if (response && response.length > 0) {
                var cnt = response.length;
                $badge.text(cnt + ' order' + (cnt !== 1 ? 's' : '')).show();
                $empty.hide();
                $table.show();

                var updatedResponse = response.map(function (item) {
                    return Object.assign({}, item, {
                        Action: '<button class="btn btn-sm esms-oc-reopen-btn" title="Re-open this order"'
                              + ' onclick="ConfirmReOpenOrder(\'' + item.Code + '\', \'' + (item['Order No'] || '') + '\')">'
                              + '<i class="fa-solid fa-rotate-left me-1"></i>Re-Open</button>'
                    });
                });

                BizsolCustomFilterGrid.CreateDataTable(
                    'reOpenTable-header', 'reOpenTable-body', updatedResponse,
                    false, [],
                    ['Order No', 'Client Name', 'Buyer PO No', 'Cancel Status'],
                    ['Order Qty', 'Dispatch Qty', 'Cancel Qty', 'Pending Qty'],
                    ['Order Date', 'Buyer PO Date'],
                    [],
                    ['Code'],
                    { 'Order Qty': 'right', 'Dispatch Qty': 'right', 'Cancel Qty': 'right', 'Pending Qty': 'right' }
                );
            } else {
                $badge.hide();
                $table.hide();
                $empty.show();
                if (type !== 'Load') toastr.info('No cancelled orders found.');
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            $('#ocReOpenTable').hide();
            $('#ocReOpenEmptyState').show();
            console.error('ShowReOpenOrderList:', error);
            if (type !== 'Load') toastr.error('Unable to load cancelled order list.');
        }
    });
}

// Live search for the re-open grid
function OcReOpenSearch(term) {
    var tableId = 'reOpenTable';
    var bodyId  = 'reOpenTable-body';
    var full    = window['filteredDataTemp_' + tableId];
    if (!full) return;

    term = (term || '').toLowerCase().trim();

    var result = term === ''
        ? full
        : full.filter(function (row) {
            return Object.values(row).some(function (val) {
                return val != null && String(val).toLowerCase().indexOf(term) !== -1;
            });
        });

    window['filteredData_' + tableId] = result;
    window['currentPage_' + tableId]  = 1;
    if (typeof renderTableWithPagination === 'function') {
        renderTableWithPagination(tableId, bodyId);
    }
}

// Confirm and execute re-open
function ConfirmReOpenOrder(code, orderNo) {
    var label = orderNo ? '"' + orderNo + '"' : 'this order';
    if (!confirm('Re-open order ' + label + '?\n\nThis will restore all cancelled quantities back to pending.')) {
        return;
    }
    ReOpenOrder(code);
}

async function ReOpenOrder(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission === false) { toastr.error(msg); return; }

    blockUI();
    $.ajax({
        url: appBaseURL + API_OC_REOPEN
            + '?Code=' + encodeURIComponent(code)
            + '&UserMaster_Code=' + encodeURIComponent(UserMaster_Code),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            var result = Array.isArray(response) && response.length ? response[0] : (response || {});
            if (result.Status === 'Y') {
                toastr.success(result.Msg || 'Order re-opened successfully.');
                $('#txtOcReOpenSearch').val('');
                ShowReOpenOrderList('Get');
            } else {
                toastr.error(result.Msg || 'Unable to re-open order.');
            }
        },
        error: function (xhr) {
            unblockUI();
            var errMsg = 'Unable to re-open order.';
            try { var p = JSON.parse(xhr.responseText); if (p && p.Msg) errMsg = p.Msg; } catch (e) {}
            toastr.error(errMsg);
        }
    });
}

var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig') || '[]');
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const G_UserName = sessionStorage.getItem('UserName');
const API_ORDER_BILL_SAVE = '/api/ScanToBill/SaveItemScanToBill';
const API_ORDER_BILL_DETAIL = '/api/ScanToBill/GetDetailsItemScanToBill';
const API_ORDER_BILL_LIST = '/api/OrderMaster/GetScanAndBillData';
const API_SAVE_MANUAL_RATE = '/api/ScanToBill/SaveManualRateAndQtySacnToBill';
const API_DELETE_DISPATCH_QTY = '/api/ScanToBill/DeleteItemFormScanToBill';
const API_UPDATE_DISPATCH_MRP = '/api/OrderMaster/UpdateDispatchMRPByItemAsync';
const API_ADD_DISPATCH_ITEM = '/api/ScanToBill/AddItemScanToBill';
const OD_DIRECT_BILLING_INVOICE_NO = 'Direct Billing';

let G_OdDispatchMaster_Code = 0;
let G_OdDetailRows = [];
let G_OdListData = [];
let G_OdClientList = [];
let G_OdItemList = [];
let G_OdAddItemSelect2Ready = false;
let G_OdLastScannedLineCode = 0;
let G_OdScanBusy = false;
let G_OdViewMode = false;

$(document).ready(function () {
    $('#ERPHeading').text('Scan To Bill');
    GetOdModuleMasterCode();
    OdLoadClientList();
    OdLoadWarehouseList();
    OdLoadList();
    OdPrefetchItemList();

    $('#btnOdCreateNew').on('click', OdOpenCreatePage);
    $('#btnOdMarkComplete').on('click', OdMarkCompleteFromPage);
    $('#btnOdAddItem').on('click', OdOpenAddItemModal);
    if (typeof initInvoicePrintModal === 'function') {
        initInvoicePrintModal();
    }
    $('#txtOdClientName').on('change', OdOnClientSelected);
    $('#ddlOdClientName').on('change', function () {
        $('#hfOdClientCode').val($(this).val() || '0');
    });
    $('#chkOdManualClient').on('change', function () {
        var isManual = $(this).is(':checked');
        $('#txtOdClientWrap').toggle(isManual);
        $('#ddlOdClientWrap').toggle(!isManual);
        $('#txtOdClientName').val('');
        $('#ddlOdClientName').val('').trigger('change');
        $('#hfOdClientCode').val('0');
    });

    $('#txtOdScanProduct').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            OdProcessScan();
        }
    });
    $('#txtOdScanProduct').on('input', function () {
        clearTimeout(window._odScanTimer);
        window._odScanTimer = setTimeout(OdProcessScan, 300);
    });
    $('#txtOdScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });

    $('#tblOdItems-body').on('click', '.od-scan-qty-input', function () {
        var $row = $(this).closest('tr');
        var mrpVal = parseFloat($row.find('.od-mrp-input').val());
        if (isNaN(mrpVal)) mrpVal = parseFloat($row.attr('data-mrp')) || 0;
        OdManualUpdateQtyAndMRP(
            $row.attr('data-item-code') || '',
            mrpVal
        );
    });

    OdSetupEnterNavigation();
});
function OdGetDetailFocusOrder() {
    var order = [];
    if ($('#chkOdManualClient').is(':checked')) {
        order.push('txtOdClientName');
    } else {
        order.push('ddlOdClientName');
    }
    order.push('ddlOdWarehouse', 'txtOdScanProduct', 'txtOdBoxNo');
    return order;
}
function OdGetAddItemFocusOrder() {
    return ['ddlOdAddItemName', 'txtOdAddItemQty', 'txtOdAddItemMRP', 'txtOdAddItemBoxNo'];
}
function OdGetManualFocusOrder() {
    return ['odTxtManualBoxNo', 'odTxtManualProductQuantity', 'odTxtManualProductMRP'];
}
function OdTryFocusField(fieldId) {
    var $el = $('#' + fieldId);
    if (!$el.length || $el.is(':disabled')) return false;
    if (fieldId === 'txtOdClientName' && !$('#txtOdClientWrap').is(':visible')) return false;
    if (fieldId === 'ddlOdClientName' && !$('#ddlOdClientWrap').is(':visible')) return false;

    if ($el.hasClass('select2-hidden-accessible')) {
        $el.select2('open');
    } else {
        $el.focus();
        if ($el.is('input')) {
            try { $el.select(); } catch (ex) { /* ignore */ }
        }
    }
    return true;
}
function OdFocusNextInOrder(currentId, order, wrapSelector) {
    var idx = order.indexOf(currentId);
    if (idx < 0) return;

    for (var i = idx + 1; i < order.length; i++) {
        if (OdTryFocusField(order[i])) return;
    }

    if (wrapSelector === '#odAddItemModal') {
        OdSaveAddItem();
        return;
    }
    if (wrapSelector === '#odManualModal') {
        OdSaveManual();
        return;
    }
    if (wrapSelector === '#odDetailPage') {
        OdTryFocusField('txtOdScanProduct');
        return;
    }

    for (var j = 0; j <= idx; j++) {
        if (OdTryFocusField(order[j])) return;
    }
}
function OdSetupEnterNavigation() {
    $('#txtOdOrderNo, #txtOdClientName, #ddlOdClientName, #ddlOdWarehouse, #txtOdBoxNo').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        OdFocusNextInOrder(this.id, OdGetDetailFocusOrder(), '#odDetailPage');
    });

    $('#txtOdAddItemQty, #txtOdAddItemMRP').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        OdFocusNextInOrder(this.id, OdGetAddItemFocusOrder(), '#odAddItemModal');
    });

    $('#txtOdAddItemBoxNo').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        OdSaveAddItem();
    });

    $('#ddlOdAddItemName').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if ($(this).val()) {
            e.preventDefault();
            OdTryFocusField('txtOdAddItemQty');
        }
    });

    $('#odTxtManualBoxNo, #odTxtManualProductQuantity').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        OdFocusNextInOrder(this.id, OdGetManualFocusOrder(), '#odManualModal');
    });

    $('#odTxtManualProductMRP').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        OdSaveManual();
    });
}
function GetOdModuleMasterCode() {
    try {
        var data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'order dispatch' || d === 'dispatch' || d === 'order packing' || d === 'scan to bill';
        });
        if (result) UserModuleMaster_Code = result.Code;
    } catch (e) {
        UserModuleMaster_Code = 0;
    }
}
function OdChangeBoxNo(delta) {
    if (G_OdViewMode) return;
    var input = document.getElementById('txtOdBoxNo');
    if (!input) return;
    var value = parseInt(input.value, 10) || 1;
    value += delta;
    if (value < 1) value = 1;
    input.value = value;
}
function OdLoadClientList() {
    $.ajax({
        url: appBaseURL + '/api/Master/GetAccountIsClientDropDown',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            G_OdClientList = response || [];
            var html = '<option value="">Select</option>';
            G_OdClientList.forEach(function (item) {
                html += '<option value="' + OdEscAttr(item.Code) + '">' + OdEscHtml(item.AccountName) + '</option>';
            });
            var $sel = $('#ddlOdClientName');
            if ($sel.data('select2')) {
                $sel.select2('destroy');
            }
            $sel.html(html);
            if ($.fn.select2) {
                $sel.select2({ width: '-webkit-fill-available', placeholder: 'Select client', allowClear: false, minimumResultsForSearch: 0 });
            }
        }
    });
}
function OdLoadWarehouseList() {
    $.ajax({
        url: appBaseURL + '/api/Master/GetWareHouseDropDown',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            var html = '<option value="">Select</option>';
            (response || []).forEach(function (item) {
                html += '<option value="' + OdEscAttr(item.Code) + '">' + OdEscHtml(item.Name) + '</option>';
            });
            $('#ddlOdWarehouse').html(html);
            if ($.fn.select2) {
                $('#ddlOdWarehouse').select2({ width: '-webkit-fill-available', allowClear: false, minimumResultsForSearch: 0 });
            }
        },
        error: function () {
            $('#ddlOdWarehouse').html('<option value="">Select</option>');
        }
    });
}
function OdOnClientSelected() {
    var val = ($('#txtOdClientName').val() || '').trim();
    $('#hfOdClientCode').val('0');
    if (!val) return;
    var client = G_OdClientList.find(function (item) { return item.AccountName === val; });
    if (client && client.Code != null) {
        $('#hfOdClientCode').val(client.Code);
    }
}
function OdGetFirstResult(response) {
    if (Array.isArray(response)) return response[0] || {};
    if (response && Array.isArray(response.Table)) return response.Table[0] || {};
    if (response && Array.isArray(response.OrderMaster)) return response.OrderMaster[0] || {};
    return response || {};
}
function OdGetHeaderRows(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.OrderMaster)) return response.OrderMaster;
    if (response && Array.isArray(response.OrderBillMaster)) return response.OrderBillMaster;
    if (response && Array.isArray(response.Table)) return response.Table;
    return [];
}
function OdGetDetailRows(response) {
    if (response && Array.isArray(response.OrderDetial)) return response.OrderDetial;
    if (response && Array.isArray(response.OrderDetail)) return response.OrderDetail;
    if (response && Array.isArray(response.OrderBillDetail)) return response.OrderBillDetail;
    if (response && Array.isArray(response.Table1)) return response.Table1;
    return [];
}
function OdBuildOrderBillPayload(scanNo) {
    var isManual = $('#chkOdManualClient').is(':checked');
    var accountName = '';
    var accountCode = 0;
    if (isManual) {
        accountName = ($('#txtOdClientName').val() || '').trim();
    } else {
        var $opt = $('#ddlOdClientName option:selected');
        accountName = ($opt.text() || '').trim();
        accountCode = parseInt($('#ddlOdClientName').val(), 10) || 0;
        if (accountName === 'Select') accountName = '';
    }
    return {
        Code: G_OdDispatchMaster_Code || 0,
        AccountName: accountName,
        ClientName: accountName,
        AccountMaster_Code: isManual ? 0 : accountCode,
        Ismanual: isManual ? 'Y' : 'N',
        InvoiceNo: ($('#txtOdOrderNo').val() || '').trim(),
        WarehouseMaster_Code: $('#ddlOdWarehouse').val() || 0,
        PackedBy: $('#txtOdPackedBy').val() || G_UserName || '',
        BoxNo: parseInt($('#txtOdBoxNo').val(), 10) || 0,
        ScanNo: scanNo || '',
        UserMaster_Code: UserMaster_Code
    };
}
function OdBuildAddItemPayload(dispatchCode, itemMasterCode, manualQty, mrp, boxNo) {
    var isManualClient = $('#chkOdManualClient').is(':checked');
    var clientName = '';
    if (isManualClient) {
        clientName = ($('#txtOdClientName').val() || '').trim();
    } else {
        clientName = ($('#ddlOdClientName option:selected').text() || '').trim();
        if (clientName === 'Select') clientName = '';
    }
    return {
        DispatchMaster_Code: parseInt(dispatchCode, 10) || 0,
        ItemMaster_Code: parseInt(itemMasterCode, 10) || 0,
        BoxNo: parseInt(boxNo, 10) || 0,
        ManualQty: parseInt(manualQty, 10) || 0,
        Mrp: parseFloat(mrp) || 0,
        OrderNo: ($('#txtOdOrderNo').val() || '').trim(),
        PackedBy: ($('#txtOdPackedBy').val() || G_UserName || '').trim(),
        ClientName: clientName,
        WarehouseMaster_Code: parseInt($('#ddlOdWarehouse').val(), 10) || 0,
        IsManual: isManualClient ? 'Y' : 'N'
    };
}
function OdFillHeaderFromResponse(header) {
    if (!header) return;

    if (header.Code) {
        G_OdDispatchMaster_Code = parseInt(header.Code, 10) || 0;
        $('#hfOdDispatchCode').val(G_OdDispatchMaster_Code);
        $('#hfOdOrderCode').val(header.Code);
    }

    $('#txtOdOrderNo').val(header.OrderNo || header.InvoiceNo || header['Invoice No'] || OD_DIRECT_BILLING_INVOICE_NO);

    var clientName = header.ClientName || header.AccountName || header['Client Name'] || '';
    var isManual = header.Ismanual === 'Y' || header.IsManual === 'Y' || header.Ismanual === true;
    if (header.Ismanual === undefined && header.IsManual === undefined) {
        isManual = !(header.AccountMaster_Code || header.AccountMasterCode);
    }
    $('#chkOdManualClient').prop('checked', isManual);
    $('#txtOdClientWrap').toggle(isManual);
    $('#ddlOdClientWrap').toggle(!isManual);

    var clientCode = header.AccountMaster_Code || header.AccountMasterCode || '0';
    if (isManual) {
        $('#txtOdClientName').val(clientName);
        $('#hfOdClientCode').val('0');
    } else {
        $('#ddlOdClientName').val(String(clientCode)).trigger('change');
        if (!$('#ddlOdClientName').val() && clientName) {
            $('#txtOdClientName').val(clientName);
        }
        $('#hfOdClientCode').val(clientCode);
    }

    if (header.WarehouseMaster_Code || header.WarehouseMasterCode) {
        $('#ddlOdWarehouse').val(header.WarehouseMaster_Code || header.WarehouseMasterCode).trigger('change');
    }
    $('#txtOdPackedBy').val(header.PackedBy || G_UserName || '');
    if (header.BoxNo != null && header.BoxNo !== '') {
        $('#txtOdBoxNo').val(header.BoxNo);
    }

    OdApplyHeaderFieldLock();
}

function OdApplyHeaderFieldLock() {
    var locked = parseInt(G_OdDispatchMaster_Code, 10) > 0;
    $('#txtOdOrderNo').prop('disabled', true);
    $('#txtOdClientName').prop('disabled', locked);
    $('#chkOdManualClient').prop('disabled', locked);
    $('#ddlOdClientName, #ddlOdWarehouse').prop('disabled', locked);
    $('#txtOdPackedBy').prop('disabled', true);

    if ($('#ddlOdClientName').data('select2')) {
        $('#ddlOdClientName').trigger('change.select2');
    }
    if ($('#ddlOdWarehouse').data('select2')) {
        $('#ddlOdWarehouse').trigger('change.select2');
    }
}
function OdShowListPage() {
    $('#odListPage').show();
    $('#odDetailPage').hide();
    $('#odToolbar').hide();
}
function OdShowDetailPage(title) {
    $('#odListPage').hide();
    $('#odDetailPage').show();
    $('#odToolbar').show();
    $('#tabOdMode').text(title || 'DISPATCH');
}
function OdBackToList() {
    OdResetDetailFields();
    OdShowListPage();
    OdLoadList();
}
function OdValidateOrderBillFields(requireScan) {
    if ($('#chkOdManualClient').is(':checked')) {
        if (!$('#txtOdClientName').val().trim()) {
            toastr.error('Please enter Client Name.');
            $('#txtOdClientName').focus();
            return false;
        }
    } else if (!$('#ddlOdClientName').val()) {
        toastr.error('Please select Client Name.');
        $('#ddlOdClientName').focus();
        return false;
    }
    if (!$('#ddlOdWarehouse').val()) {
        toastr.error('Please select Warehouse.');
        $('#ddlOdWarehouse').focus();
        return false;
    }
    if (!($('#txtOdPackedBy').val() || G_UserName || '').trim()) {
        toastr.error('Please enter Packed By.');
        $('#txtOdPackedBy').focus();
        return false;
    }
    if ((parseInt($('#txtOdBoxNo').val(), 10) || 0) <= 0) {
        toastr.error('Please enter Box No.');
        $('#txtOdBoxNo').focus();
        return false;
    }
    if (requireScan && !$('#txtOdScanProduct').val().trim()) {
        toastr.error('Please scan product.');
        $('#txtOdScanProduct').focus();
        return false;
    }
    return true;
}
function OdLoadList() {
    blockUI();
    $.ajax({
        url: appBaseURL + API_ORDER_BILL_LIST,
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            G_OdListData = OdGetHeaderRows(response);
            if (!G_OdListData.length && Array.isArray(response)) G_OdListData = response;
            OdRenderList(G_OdListData);
        },
        error: function () {
            unblockUI();
            G_OdListData = [];
            OdRenderList([]);
        }
    });
}
function OdLoadDetailData(code, highlightLineCode) {
    var dispatchCode = parseInt(code, 10) || G_OdDispatchMaster_Code || 0;
    blockUI();
    $.ajax({
        url: appBaseURL + API_ORDER_BILL_DETAIL + '?Code=' + encodeURIComponent(dispatchCode),
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            if (!response) {
                toastr.error('Record not found.');
                OdBackToList();
                return;
            }

            var header = (response.OrderMaster && response.OrderMaster.length > 0 && response.OrderMaster[0])
                || OdGetHeaderRows(response)[0]
                || OdGetFirstResult(response);
            var details = response.OrderDetial || OdGetDetailRows(response);

            OdFillHeaderFromResponse(header);
            G_OdDetailRows = details;

            var hl = highlightLineCode || G_OdLastScannedLineCode;
            if (hl && !G_OdViewMode) {
                var item = details.find(function (r) { return String(r.Code) === String(hl); });
                if (item) OdShowScannedBanner(item);
            }

            OdRenderItemGrid(details, hl);
            if (G_OdViewMode) {
                OdApplyViewModeChrome();
            } else {
                setTimeout(function () { $('#txtOdScanProduct').focus(); }, 250);
            }
        },
        error: function () {
            unblockUI();
            toastr.error('Unable to load dispatch details.');
            OdBackToList();
        }
    });
}
function OdStatusBadge(status) {
    var raw = String(status == null ? '' : status).trim();
    var key = raw.toLowerCase();
    var cls = 'od-status-badge--default';
    var icon = 'fa-circle-info';

    if (key === 'pending scaning' || key === 'pending scanning') {
        cls = 'od-status-badge--scanning';
        icon = 'fa-barcode';
    } else if (key === 'invoice pending') {
        cls = 'od-status-badge--invoice-pending';
        icon = 'fa-clock';
    } else if (key === 'invoice generated') {
        cls = 'od-status-badge--invoice-generated';
        icon = 'fa-circle-check';
    }

    if (!raw) return "<span class='od-status-badge od-status-badge--default'>—</span>";
    return "<span class='od-status-badge " + cls + "'><i class='fa-solid " + icon + "'></i>" + OdEscHtml(raw) + "</span>";
}

function OdIsPendingScaning(status) {
    var key = String(status == null ? '' : status).trim().toLowerCase();
    return key === 'pending scaning' || key === 'pending scanning';
}

function OdIsInvoiceGenerated(status) {
    var key = String(status == null ? '' : status).trim().toLowerCase();
    return key === 'invoice generated';
}

function OdRenderList(rows) {
    var $tableWrap = $('#odTableWrap');
    var $empty = $('#odEmptyState');
    var $badge = $('#odListCountBadge');

    if (!rows.length) {
        $tableWrap.hide();
        $empty.show();
        $badge.hide();
        return;
    }

    $empty.hide();
    $tableWrap.show();
    $badge.text(rows.length + ' order' + (rows.length !== 1 ? 's' : '')).show();

    var updated = rows.map(function (item) {
        var dispatchCode = item.Code || 0;
        var invoiceNo = item['Invoice No'] || item.InvoiceNo || item['Order No'] || item.OrderNo || '';
        var invoiceNoAttr = OdEscAttr(invoiceNo);
        var statusRaw = item.Status != null ? item.Status : '';
        var canEditComplete = OdIsPendingScaning(statusRaw);

        var actions = '<div class="od-list-actions">';
        if (canEditComplete) {
            actions += '<button type="button" class="btn btn-sm btn-primary esms-oc-action-btn od-list-action-btn icon-height" title="Edit" onclick="OdOpenDispatch(' + dispatchCode + ')">'
                + '<i class="fa-solid fa-pencil"></i></button>'
                + '<button type="button" class="btn btn-sm btn-danger od-list-action-btn icon-height" title="Delete" onclick="OdDeleteDispatch(' + dispatchCode + ',\'' + invoiceNoAttr + '\',this)">'
                + '<i class="fa-regular fa-circle-xmark"></i></button>'
                + '<button type="button" class="btn btn-sm btn-success od-list-action-btn icon-height" title="Mark As Complete" onclick="OdMarkComplete(' + dispatchCode + ')">'
                + '<i class="fa fa-check"></i></button>';
        } else {
            actions += '<button type="button" class="btn btn-sm btn-info od-list-action-btn icon-height" title="View" onclick="OdViewDispatch(' + dispatchCode + ')">'
                + '<i class="fa-solid fa-eye"></i></button>';
            if (OdIsInvoiceGenerated(statusRaw)) {
                actions += '<button type="button" class="btn btn-sm btn-success od-list-action-btn icon-height" title="Download Invoice" onclick="invoiceMasterOpenPrint(\'' + dispatchCode + '\')">'
                    + '<i class="fa-solid fa fa-download"></i></button>';
            }
        }
        actions += '</div>';

        var row = Object.assign({}, item, {
            'Invoice No': invoiceNo,
            Status: OdStatusBadge(statusRaw),
            Action: actions
        });
        // Avoid duplicate Order No column in Direct Billing list
        delete row['Order No'];
        delete row.OrderNo;
        return row;
    });

    var hidden = UserType === 'A' ? ['Code', 'AccountMaster_Code'] : ['Code', 'AccountMaster_Code', 'Order Date'];
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header', 'table-body', updated,
        false, [],
        ['Challan No', 'Client Name', 'Vehicle No', 'Invoice No', 'BuyerPO No', 'Status'],
        ['TOQ', 'TBQ'],
        [], [], hidden,
        { TOQ: 'right', TBQ: 'right' }
    );
}
function OdEscAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function OdEscHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function OdOpenCreatePage() {
    var perm = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) { toastr.error(perm.msg); return; }
    OdOpenDispatch(0);
}

async function OdOpenDispatch(dispatchMasterCode) {
    G_OdViewMode = false;
    G_OdDispatchMaster_Code = parseInt(dispatchMasterCode, 10) || 0;
    G_OdLastScannedLineCode = 0;
    $('#hfOdDispatchCode').val(G_OdDispatchMaster_Code);

    var perm = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) { toastr.error(perm.msg); return; }

    OdShowDetailPage(G_OdDispatchMaster_Code === 0 ? 'NEW DISPATCH' : 'DISPATCH');
    $('#btnOdSave').show();
    $('#btnOdMarkComplete').css('display', 'inline-flex');
    OdApplyEditModeChrome();

    if (G_OdDispatchMaster_Code === 0) {
        OdResetDetailFields();
        $('#txtOdOrderNo').val(OD_DIRECT_BILLING_INVOICE_NO);
        $('#txtOdPackedBy').val(G_UserName || '');
        OdApplyHeaderFieldLock();
        setTimeout(function () {
            if ($('#chkOdManualClient').is(':checked')) {
                $('#txtOdClientName').focus();
            } else {
                $('#ddlOdClientName').focus();
            }
        }, 200);
        return;
    }

    OdApplyHeaderFieldLock();
    OdLoadDetailData(G_OdDispatchMaster_Code);
}

async function OdViewDispatch(dispatchMasterCode) {
    var code = parseInt(dispatchMasterCode, 10) || 0;
    if (!code) {
        toastr.error('Invalid dispatch record.');
        return;
    }

    var perm = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) { toastr.error(perm.msg); return; }

    G_OdViewMode = true;
    G_OdDispatchMaster_Code = code;
    G_OdLastScannedLineCode = 0;
    $('#hfOdDispatchCode').val(G_OdDispatchMaster_Code);

    OdShowDetailPage('VIEW');
    $('#btnOdSave').hide();
    $('#btnOdMarkComplete').hide();
    OdApplyViewModeChrome();
    OdLoadDetailData(G_OdDispatchMaster_Code);
}

function OdApplyEditModeChrome() {
    $('#btnOdAddItem').show();
    $('#txtOdScanProduct, #txtOdBoxNo').prop('disabled', false);
    $('#txtOdOrderNo, #txtOdPackedBy').prop('disabled', true);
    $('.clsbox button').prop('disabled', false);
    OdApplyHeaderFieldLock();
}

function OdApplyViewModeChrome() {
    $('#btnOdAddItem').hide();
    $('#btnOdMarkComplete').hide();
    $('#txtOdOrderNo, #txtOdClientName, #txtOdScanProduct, #txtOdBoxNo').prop('disabled', true);
    $('#txtOdPackedBy').prop('disabled', true);
    $('#chkOdManualClient').prop('disabled', true);
    $('#ddlOdClientName, #ddlOdWarehouse').prop('disabled', true);
    $('.clsbox button').prop('disabled', true);
    if ($('#ddlOdClientName').data('select2')) $('#ddlOdClientName').trigger('change.select2');
    if ($('#ddlOdWarehouse').data('select2')) $('#ddlOdWarehouse').trigger('change.select2');
}

function OdResetDetailFields() {
    G_OdViewMode = false;
    G_OdDispatchMaster_Code = 0;
    G_OdDetailRows = [];
    G_OdLastScannedLineCode = 0;
    $('#hfOdOrderCode').val('0');
    $('#hfOdClientCode').val('0');
    $('#hfOdDispatchCode').val('0');
    $('#chkOdManualClient').prop('checked', true);
    $('#txtOdClientWrap').show();
    $('#ddlOdClientWrap').hide();
    $('#txtOdClientName, #txtOdPackedBy, #txtOdScanProduct').val('');
    $('#txtOdOrderNo').val(OD_DIRECT_BILLING_INVOICE_NO);
    $('#ddlOdClientName').val('').trigger('change');
    $('#ddlOdWarehouse').val('').trigger('change');
    $('#txtOdBoxNo').val('1');
    $('#tblOdItems-body, #tblOdItems-header').empty();
    $('#odLastScannedBanner').hide();
    $('#odLastScannedText').text('');
    OdApplyEditModeChrome();
}
function OdItemLabel(key) {
    if (!G_ItemConfig.length) return key;
    if (key === 'Item Name') return G_ItemConfig[0].ItemNameHeader || 'Item Name';
    if (key === 'Item Code') return G_ItemConfig[0].ItemCodeHeader || 'Item Code';
    return key;
}
function OdRenderItemGrid(details, highlightLineCode) {
    if (!details.length) {
        $('#tblOdItems-header').html('');
        $('#tblOdItems-body').html('<tr><td colspan="9" class="text-center text-muted py-3">No items found. Scan a product to start dispatch.</td></tr>');
        return;
    }

    var itemCodeKey = 'Item Code';
    var itemNameKey = 'Item Name';
    var hlCode = highlightLineCode || G_OdLastScannedLineCode;

    var headerHtml = '<tr>'
        + '<th>' + OdItemLabel(itemCodeKey) + '</th>'
        + '<th>' + OdItemLabel(itemNameKey) + '</th>'
        + '<th class="text-end">Scan Qty</th>'
        + '<th class="text-end">Packing Qty</th>'
        + '<th class="text-end">Box No</th>'
        + '<th class="text-end">MRP</th>'
        + '<th>Location</th>'
        + '<th class="text-end">Stock Qty</th>'
        + '<th></th>'
        + '</tr>';
    $('#tblOdItems-header').html(headerHtml);

    var bodyHtml = '';
    details.forEach(function (item) {
        var scanQty = item['Scan Qty'] != null ? item['Scan Qty'] : 0;
        var packingQty = item['Packing Qty'] != null ? item['Packing Qty'] : 0;
        var boxNo = item['Box No'] != null ? item['Box No'] : (item.BoxNo != null ? item.BoxNo : '');
        var mrp = item.MRP != null && item.MRP !== 'NULL' ? item.MRP : '';
        var mrpNum = mrp !== '' ? parseFloat(mrp) : 0;
        var location = item.Location || '';
        var stockQty = item['Stock Qty'] != null ? item['Stock Qty'] : '';
        var itemCode = item[itemCodeKey] || '';
        var balQty = item['Bal Qty'] != null ? item['Bal Qty']
            : (item['Balance Quantity'] != null ? item['Balance Quantity']
                : (item['Ord Qty'] != null ? item['Ord Qty'] : 1));
        var rowClass = OdRowStatusClass(item.ROWSTATUS);
        if (hlCode && String(item.Code) === String(hlCode)) {
            rowClass += ' od-row-scanned';
        }

        bodyHtml += '<tr id="odRow_' + item.Code + '" class="' + rowClass + '"'
            + ' data-line-code="' + item.Code + '"'
            + ' data-item-code="' + OdEscAttr(itemCode) + '"'
            + ' data-bal-qty="' + balQty + '"'
            + ' data-mrp="' + (isNaN(mrpNum) ? 0 : mrpNum) + '">'
            + '<td>' + OdEscHtml(itemCode) + '</td>'
            + '<td>' + OdEscHtml(item[itemNameKey]) + '</td>'
            + '<td class="text-end">'
            + '<input type="text" id="txtOdScanQty_' + item.Code + '" value="' + scanQty + '" readonly '
            + (G_OdViewMode ? 'disabled ' : '')
            + 'class="box_border form-control form-control-sm text-right BizSolFormControl'
            + (G_OdViewMode ? '' : ' od-scan-qty-input')
            + '" autocomplete="off" placeholder="Scan Qty..">'
            + '</td>'
            + '<td class="text-end"><span id="txtOdPackingQty_' + item.Code + '">' + packingQty + '</span></td>'
            + '<td class="text-end"><span id="txtOdBoxNo_' + item.Code + '">' + OdEscHtml(boxNo) + '</span></td>'
            + '<td class="text-end">'
            + '<input type="text" id="txtOdMRPQty_' + item.Code + '" value="' + OdEscAttr(mrp) + '" '
            + 'data-old-mrp="' + OdEscAttr(mrp) + '" '
            + (G_OdViewMode
                ? 'disabled '
                : 'onkeypress="return OdOnChangeNumericTextBox(event,this);" '
                    + 'onkeyup="if(event.key===\'Enter\') OdOpenManualForMRP(this,\'' + OdEscAttr(itemCode) + '\');" '
                    + 'onfocusout="OdOpenManualForMRP(this,\'' + OdEscAttr(itemCode) + '\');" ')
            + 'class="box_border form-control form-control-sm text-right BizSolFormControl od-mrp-input" autocomplete="off" placeholder="MRP..">'
            + '</td>'
            + '<td>' + OdEscHtml(location) + '</td>'
            + '<td class="text-end">' + OdEscHtml(stockQty) + '</td>'
            + '<td class="text-center">'
            + (G_OdViewMode || item.ROWSTATUS === 'RED' ? '' : '<button type="button" class="btn btn-sm btn-danger icon-height mb-1" title="Delete item qty" onclick="OdDeleteLineQty(' + item.Code + ')"><i class="fa-solid fa-trash"></i></button>')
            + '</td>'
            + '</tr>';
    });
    $('#tblOdItems-body').html(bodyHtml);

    if (hlCode) {
        OdScrollToRow(hlCode);
    }
}
function OdRowStatusClass(status) {
    if (status === 'GREEN') return 'table-success';
    if (status === 'YELLOW') return 'table-warning';
    if (status === 'RED') return 'table-danger';
    return '';
}
function OdScrollToRow(lineCode) {
    var row = document.getElementById('odRow_' + lineCode);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
function OdShowScannedBanner(item) {
    if (!item) return;
    var code = item['Item Code'] || '';
    var name = item['Item Name'] || '';
    $('#odLastScannedText').text('Scanned: ' + code + ' — ' + name);
    $('#odLastScannedBanner').show();
}
function OdFindLineByScan(scanNo) {
    var s = String(scanNo || '').trim().toLowerCase();
    if (!s) return null;
    return G_OdDetailRows.find(function (item) {
        var code = String(item['Item Code'] || '').toLowerCase();
        var name = String(item['Item Name'] || '').toLowerCase();
        return code === s || name === s || code.indexOf(s) >= 0;
    }) || null;
}

function OdShowScanToast(msg) {
    var toast = document.getElementById('toast');
    var overlay = document.getElementById('overlay');
    if (!toast || !overlay) {
        toastr.error(msg || 'INVALID SCAN NO !');
        return;
    }

    toast.innerText = msg || 'INVALID SCAN NO !';
    overlay.style.display = 'block';
    toast.style.display = 'block';
    toast.style.opacity = '0';
    toast.style.visibility = 'visible';

    var alertSound = new Audio('https://www.fesliyanstudios.com/play-mp3/4387');
    alertSound.play().catch(function () { /* ignore */ });

    setTimeout(function () { toast.style.opacity = '1'; }, 10);

    if (window._odScanToastBlink) clearInterval(window._odScanToastBlink);
    window._odScanToastBlink = setInterval(function () {
        toast.style.visibility = (toast.style.visibility === 'hidden') ? 'visible' : 'hidden';
    }, 2000);

    setTimeout(function () {
        clearInterval(window._odScanToastBlink);
        window._odScanToastBlink = null;
        toast.style.visibility = 'visible';
        toast.style.opacity = '0';
        setTimeout(function () {
            toast.style.display = 'none';
            overlay.style.display = 'none';
        }, 100);
    }, 2000);
}

function OdPlayScanSuccessSound() {
    try {
        var voice = document.getElementById('SuccessVoice');
        if (voice) voice.play();
    } catch (ex) { /* ignore */ }
}

function OdProcessScan() {
    if (G_OdViewMode || G_OdScanBusy) return;

    var scanNo = ($('#txtOdScanProduct').val() || '').trim();
    if (!OdValidateOrderBillFields(true)) return;

    var matched = OdFindLineByScan(scanNo);
    if (matched) {
        G_OdLastScannedLineCode = matched.Code;
    }

    var payload = OdBuildOrderBillPayload(scanNo);

    G_OdScanBusy = true;
    blockUI();
    $.ajax({
        url: appBaseURL + API_ORDER_BILL_SAVE,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            G_OdScanBusy = false;
            var result = OdGetFirstResult(response);
            if (result.Status === 'Y' || (!result.Status && result.Code)) {
                if (result.DispatchMaster_Code || result.Code) {
                    G_OdDispatchMaster_Code = parseInt(result.DispatchMaster_Code || result.Code, 10) || 0;
                    $('#hfOdDispatchCode').val(G_OdDispatchMaster_Code);
                    OdApplyHeaderFieldLock();
                }
                OdPlayScanSuccessSound();
                G_OdLastScannedLineCode = G_OdLastScannedLineCode || 0;
                OdLoadDetailData(G_OdDispatchMaster_Code, G_OdLastScannedLineCode);
            } else {
                G_OdLastScannedLineCode = 0;
                $('#odLastScannedBanner').hide();
                OdShowScanToast(result.Msg || 'INVALID SCAN NO !');
                if (G_OdDispatchMaster_Code > 0) {
                    OdLoadDetailData(G_OdDispatchMaster_Code);
                }
            }
            $('#txtOdScanProduct').val('').focus();
        },
        error: function () {
            unblockUI();
            G_OdScanBusy = false;
            G_OdLastScannedLineCode = 0;
            $('#odLastScannedBanner').hide();
            OdShowScanToast('INVALID SCAN NO !');
            if (G_OdDispatchMaster_Code > 0) {
                OdLoadDetailData(G_OdDispatchMaster_Code);
            }
            $('#txtOdScanProduct').val('').focus();
        }
    });
}
function OdManualChangeValue(delta) {
    var input = document.getElementById('odTxtManualBoxNo');
    if (!input) return;
    var value = parseInt(input.value, 10) || 1;
    value += delta;
    if (value < 1) value = 1;
    input.value = value;
}

async function OdManualUpdateQtyAndMRP(itemCode, mrp) {
    if (G_OdViewMode) return;
    var perm = await CheckOptionPermission('Manual', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) {
        toastr.error(perm.msg);
        return;
    }
    $('#odTxtManualItemCode').text('PRODUCT NAME : ' + itemCode);
    $('#odHfManualProductCode').val(itemCode);
    $('#odTxtManualProductMRP').val(mrp || 0);
    $('#odTxtManualBoxNo').val($('#txtOdBoxNo').val() || '1');
    $('#odTxtManualProductQuantity').val('');
    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('odManualModal'));
    modal.show();
}
function OdSaveManual() {
    var boxNo = $('#odTxtManualBoxNo').val();
    var quantity = $('#odTxtManualProductQuantity').val();
    var mrp = $('#odTxtManualProductMRP').val();
    var itemCode = $('#odHfManualProductCode').val();
    var quantityInt = parseInt(quantity, 10);

    if (!quantity || isNaN(quantityInt) || quantityInt <= 0) {
        toastr.error('Please enter a valid quantity!');
        return;
    }
    if (!mrp || isNaN(parseFloat(mrp))) {
        toastr.error('Please enter a valid MRP!');
        $('#odTxtManualProductMRP').focus();
        return;
    }
    if (!boxNo || isNaN(parseInt(boxNo, 10)) || parseInt(boxNo, 10) < 1) {
        toastr.error('Please enter a valid box number!');
        return;
    }

    var payload = {
        DispatchMaster_Code: G_OdDispatchMaster_Code,
        ManualQty: quantity,
        UserMaster_Code: UserMaster_Code,
        ItemCode: itemCode,
        OrderMaster_Code: 0,
        Mrp: mrp,
        BoxNo: boxNo
    };

    blockUI();
    $.ajax({
        url: appBaseURL + API_SAVE_MANUAL_RATE,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            var result = (Array.isArray(response) && response.length) ? response[0] : OdGetFirstResult(response);
            if (result.Status === 'Y') {
                if (result.Code) {
                    G_OdDispatchMaster_Code = parseInt(result.Code, 10) || G_OdDispatchMaster_Code;
                    $('#hfOdDispatchCode').val(G_OdDispatchMaster_Code);
                    OdApplyHeaderFieldLock();
                }
                toastr.success(result.Msg || 'Saved.');
                OdCloseManualModal();
                OdLoadDetailData(G_OdDispatchMaster_Code);
            } else {
                toastr.error(result.Msg || 'Unable to save manual qty.');
                OdLoadDetailData(G_OdDispatchMaster_Code);
            }
        },
        error: function () {
            unblockUI();
            toastr.error('Error saving manual qty.');
        }
    });
}
function OdCloseManualModal() {
    $('#odTxtManualProductQuantity').val('');
    $('#odTxtManualProductMRP').val('');
    var modalEl = document.getElementById('odManualModal');
    var modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}
function OdOnChangeNumericTextBox(event, element) {
    if (event.charCode === 13 || event.charCode === 46 || event.charCode === 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity('');
        element.reportValidity();
        if (event.charCode === 13) {
            var addItemOrder = OdGetAddItemFocusOrder();
            var manualOrder = OdGetManualFocusOrder();
            if (addItemOrder.indexOf(element.id) >= 0) {
                event.preventDefault();
                if (element.id === 'txtOdAddItemBoxNo') OdSaveAddItem();
                else OdFocusNextInOrder(element.id, addItemOrder, '#odAddItemModal');
            } else if (manualOrder.indexOf(element.id) >= 0) {
                event.preventDefault();
                if (element.id === 'odTxtManualProductMRP') OdSaveManual();
                else OdFocusNextInOrder(element.id, manualOrder, '#odManualModal');
            } else if (element.id === 'txtOdBoxNo') {
                event.preventDefault();
                OdFocusNextInOrder(element.id, OdGetDetailFocusOrder(), '#odDetailPage');
            }
        }
        return true;
    }
    element.setCustomValidity('Only allowed Float Numbers');
    element.reportValidity();
    return false;
}
function OdSaveMRPByItemInput(element, itemCode) {
    var newMrp = ($(element).val() || '').trim();
    if (newMrp === '') return;
    if (isNaN(parseFloat(newMrp))) {
        toastr.error('Please enter a valid MRP!');
        $(element).focus();
        return;
    }
    var oldMrp = ($(element).attr('data-old-mrp') || $(element).closest('tr').attr('data-mrp') || '').trim();
    if (parseFloat(oldMrp || 0) === parseFloat(newMrp)) return;

    if (!G_OdDispatchMaster_Code || parseInt(G_OdDispatchMaster_Code, 10) <= 0) {
        toastr.error('Invalid Dispatch reference!');
        return;
    }
    var payload = {
        DispatchMaster_Code: G_OdDispatchMaster_Code,
        ItemCode: itemCode,
        OldMRP: oldMrp,
        NewMRP: newMrp,
        Mrp: newMrp,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: appBaseURL + API_UPDATE_DISPATCH_MRP,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            var res = Array.isArray(response) ? response[0] : response;
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'MRP updated.');
                OdLoadDetailData(G_OdDispatchMaster_Code);
            } else {
                toastr.error((res && res.Msg) ? res.Msg : 'Unable to update MRP.');
            }
        },
        error: function () {
            toastr.error('Error updating MRP.');
        }
    });
}
function OdOpenManualForMRP(element, itemCode) {
    if (G_OdViewMode) return;
    var mrp = $(element).val();
    if (mrp === undefined || mrp === null || mrp === '') return;
    if (isNaN(parseFloat(mrp))) {
        toastr.error('Please enter a valid MRP!');
        $(element).focus();
        return;
    }
    OdSaveMRPByItemInput(element, itemCode);
}
function OdAddItemChangeBoxNo(delta) {
    var input = document.getElementById('txtOdAddItemBoxNo');
    if (!input) return;
    var value = parseInt(input.value, 10) || 1;
    value += delta;
    if (value < 1) value = 1;
    input.value = value;
}
function OdResetAddItemModalFields() {
    $('#txtOdAddItemQty, #txtOdAddItemMRP').val('');
    $('#txtOdAddItemBoxNo').val($('#txtOdBoxNo').val() || '1');
}
function OdOnAddItemSelected() {
    var code = parseInt($('#ddlOdAddItemName').val(), 10) || 0;
    if (!code) return;
    var item = G_OdItemList.find(function (row) { return parseInt(row.Code, 10) === code; });
    if (!item) return;
    var mrp = item.MRP != null && item.MRP !== 'NULL' ? item.MRP : (item.MRPNo != null ? item.MRPNo : '');
    if (mrp !== '' && !isNaN(parseFloat(mrp))) {
        $('#txtOdAddItemMRP').val(mrp);
    }
}
function OdPrefetchItemList() {
    if (G_OdItemList.length) return;
    $.ajax({
        url: appBaseURL + '/api/Master/GetItemDetails',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            G_OdItemList = response || [];
        }
    });
}

function OdGetAddItemSelect2Page(data) {
    var term = String((data && data.term) || '').toLowerCase().trim();
    var page = parseInt(data && data.page, 10) || 1;
    var pageSize = 40;
    var filtered = G_OdItemList;

    if (term) {
        filtered = G_OdItemList.filter(function (item) {
            var name = String(item.ItemName || '').toLowerCase();
            var code = String(item.ItemCode || '').toLowerCase();
            return name.indexOf(term) >= 0 || code.indexOf(term) >= 0;
        });
    }

    var start = (page - 1) * pageSize;
    var slice = filtered.slice(start, start + pageSize);

    return {
        results: slice.map(function (item) {
            return {
                id: String(item.Code),
                text: (item.ItemName || '') + ' (' + (item.ItemCode || '') + ')'
            };
        }),
        pagination: { more: start + pageSize < filtered.length }
    };
}

function OdLoadItemListForAdd(callback) {
    var finish = function () {
        setTimeout(function () {
            OdRenderAddItemDropdown();
            if (callback) callback();
        }, 0);
    };

    if (G_OdItemList.length) {
        finish();
        return;
    }

    $.ajax({
        url: appBaseURL + '/api/Master/GetItemDetails',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            G_OdItemList = response || [];
            finish();
        },
        error: function () {
            G_OdItemList = [];
            toastr.error('Unable to load item list.');
            finish();
        }
    });
}

function OdRenderAddItemDropdown() {
    var $sel = $('#ddlOdAddItemName');
    if (!$sel.length || !$.fn.select2) return;

    if (G_OdAddItemSelect2Ready && $sel.data('select2')) {
        $sel.val(null).trigger('change');
        return;
    }

    if ($sel.data('select2')) {
        $sel.select2('destroy');
    }

    $sel.html('<option value=""></option>');
    $sel.select2({
        width: '100%',
        placeholder: 'Search item by name or code...',
        allowClear: false,
        dropdownParent: $('#odAddItemModal'),
        dropdownCssClass: 'od-add-item-select2-drop',
        minimumInputLength: 0,
        ajax: {
            delay: 150,
            data: function (params) {
                return {
                    term: params.term || '',
                    page: params.page || 1
                };
            },
            transport: function (params, success) {
                success(OdGetAddItemSelect2Page(params.data || {}));
            }
        }
    });

    $sel.off('select2:open.odAddItem').on('select2:open.odAddItem', function () {
        var $drop = $('.od-add-item-select2-drop');
        $drop.css('z-index', '10250');
        $('#odAddItemModal .select2-container--open').css('z-index', '10251');
        setTimeout(function () {
            var $search = $drop.find('.select2-search__field');
            $search.prop('disabled', false).prop('readonly', false).attr('aria-disabled', 'false').focus();
        }, 0);
    });
    $sel.off('change.odAddItem').on('change.odAddItem', OdOnAddItemSelected);
    G_OdAddItemSelect2Ready = true;
}

async function OdOpenAddItemModal() {
    if (G_OdViewMode) return;
    if (!OdValidateOrderBillFields(false)) return;

    var perm = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) {
        toastr.error(perm.msg);
        return;
    }

    OdResetAddItemModalFields();
    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('odAddItemModal'));
    modal.show();

    OdLoadItemListForAdd(function () {
        $('#ddlOdAddItemName').val(null).trigger('change');
        setTimeout(function () { $('#txtOdAddItemQty').focus(); }, 200);
    });
}
function OdCloseAddItemModal() {
    var $sel = $('#ddlOdAddItemName');
    if ($sel.data('select2')) {
        $sel.select2('close');
        $sel.val(null).trigger('change');
    } else {
        $sel.val('');
    }
    OdResetAddItemModalFields();
    var modalEl = document.getElementById('odAddItemModal');
    var modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}
function OdSaveAddItem() {
    if (!OdValidateOrderBillFields(false)) return;

    var itemMasterCode = parseInt($('#ddlOdAddItemName').val(), 10) || 0;
    var qty = ($('#txtOdAddItemQty').val() || '').trim();
    var mrp = ($('#txtOdAddItemMRP').val() || '').trim();
    var boxNo = ($('#txtOdAddItemBoxNo').val() || '').trim();
    var qtyInt = parseInt(qty, 10);

    if (!itemMasterCode) {
        toastr.error('Please select Item Name.');
        $('#ddlOdAddItemName').focus();
        return;
    }
    if (!qty || isNaN(qtyInt) || qtyInt <= 0) {
        toastr.error('Please enter a valid Qty.');
        $('#txtOdAddItemQty').focus();
        return;
    }
    if (!mrp || isNaN(parseFloat(mrp))) {
        toastr.error('Please enter a valid MRP.');
        $('#txtOdAddItemMRP').focus();
        return;
    }
    if (!boxNo || isNaN(parseInt(boxNo, 10)) || parseInt(boxNo, 10) < 1) {
        toastr.error('Please enter a valid Box No.');
        $('#txtOdAddItemBoxNo').focus();
        return;
    }

    var payload = OdBuildAddItemPayload(G_OdDispatchMaster_Code, itemMasterCode, qtyInt, mrp, boxNo);

    blockUI();
    $.ajax({
        url: appBaseURL + API_ADD_DISPATCH_ITEM,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            var result = OdGetFirstResult(response);
            if (result.Status === 'Y') {
                if (result.DispatchMaster_Code) {
                    G_OdDispatchMaster_Code = parseInt(result.DispatchMaster_Code, 10) || G_OdDispatchMaster_Code;
                    $('#hfOdDispatchCode').val(G_OdDispatchMaster_Code);
                    OdApplyHeaderFieldLock();
                }
                OdCloseAddItemModal();
                OdLoadDetailData(G_OdDispatchMaster_Code);
            } else {
                toastr.error(result.Msg || 'Unable to add item.');
            }
        },
        error: function () {
            unblockUI();
            toastr.error('Error adding item.');
        }
    });
}

async function OdDeleteLineQty(lineCode) {
    if (G_OdViewMode) return;
    var perm = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) {
        toastr.error(perm.msg);
        return;
    }
    if (!confirm('Are you sure you want to delete this item qty.?')) return;

    blockUI();
    $.ajax({
        url: appBaseURL + API_DELETE_DISPATCH_QTY + '?Code=' + encodeURIComponent(lineCode),
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            if (response[0].Status === 'Y') {
                toastr.success(response[0].Msg || 'Line qty removed.');
                OdLoadDetailData(G_OdDispatchMaster_Code);
            } else {
                toastr.error(response[0].Msg || 'Unable to delete line qty.');
            }
        },
        error: function () {
            unblockUI();
            toastr.error('Unable to delete line qty.');
        }
    });
}
function OdMarkCompleteFromPage() {
    if (!G_OdDispatchMaster_Code) {
        toastr.error('Please scan or add at least one item before marking as complete.');
        return;
    }
    OdMarkComplete(G_OdDispatchMaster_Code);
}

async function OdDeleteDispatch(code, orderNo, button) {
    var tr = button.closest('tr');
    if (tr) tr.classList.add('highlight');

    var perm = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) {
        toastr.error(perm.msg);
        if (tr) tr.classList.remove('highlight');
        return;
    }

    var related = await CheckRelatedRecord(code, 'DispatchMaster');
    if (related.Status === true) {
        toastr.error(related.msg1);
        if (tr) tr.classList.remove('highlight');
        return;
    }

    if (!confirm('Are you sure you want to delete this Despatch ' + (orderNo || '') + ' .?')) {
        $('tr').removeClass('highlight');
        return;
    }

    blockUI();
    $.ajax({
        url: appBaseURL + '/api/OrderMaster/DeleteDispatchOrder?Code=' + encodeURIComponent(code),
        type: 'POST',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                OdLoadList();
            } else {
                toastr.error(response.Msg || 'Unable to delete dispatch.');
                $('tr').removeClass('highlight');
            }
        },
        error: function () {
            unblockUI();
            toastr.error('Error deleting dispatch.');
            $('tr').removeClass('highlight');
        }
    });
}

async function OdMarkComplete(dispatchCode) {
    var perm = await CheckOptionPermission('Complete', UserMaster_Code, UserModuleMaster_Code);
    if (!perm.hasPermission) { toastr.error(perm.msg); return; }

    if (!confirm('Do you want to Complete and Save & Print Invoice?')) return;

    blockUI();
    $.ajax({
        url: appBaseURL + '/api/OrderMaster/GetMarkasCompeteByOrderNo?Code=' + encodeURIComponent(dispatchCode),
        type: 'POST',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            unblockUI();
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                if (typeof saveInvoiceMasterThenPrint === 'function') {
                    saveInvoiceMasterThenPrint(dispatchCode, function () {
                        OdBackToList();
                    });
                } else {
                    OdBackToList();
                }
            } else {
                toastr.error(response.Msg || 'Unable to mark as complete.');
            }
        },
        error: function () {
            unblockUI();
            toastr.error('Error completing dispatch.');
        }
    });
}

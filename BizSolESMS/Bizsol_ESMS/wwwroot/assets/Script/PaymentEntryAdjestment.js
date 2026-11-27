var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
var FixParameter;
try { FixParameter = JSON.parse(sessionStorage.getItem('Fixparameter')); } catch (e) { FixParameter = null; }
var G_CompanyCode         = (FixParameter && FixParameter[0] && FixParameter[0].CompanyCode != null) ? FixParameter[0].CompanyCode : '';
var UserMaster_Code       = authKeyData ? authKeyData.UserMaster_Code : 0;
var UserType              = authKeyData && authKeyData.UserType != null ? authKeyData.UserType : '';
var UserModuleMaster_Code = 0;
const appBaseURL          = sessionStorage.getItem('AppBaseURL') || '';
const AppBaseURLMenu      = sessionStorage.getItem('AppBaseURLMenu') || '';
const G_UserName          = sessionStorage.getItem('UserName') || '';
const authKeyRaw          = sessionStorage.getItem('authKey') || '';
var API_GET_PAYMENT_LIST = '/api/PaymentEntry/GetPaymentAdjustmentMasterlist';
var API_SAVE_PAYMENT = '/api/PaymentEntry/SavePaymentEntryAdjustment';
var API_DELETE_PAYMENT = '/api/PaymentEntry/DeletePaymentEntryAdjustment';
var API_GET_PAYMENT_BY_CODE = '/api/PaymentEntry/ShowPaymentEntryAdjustmentByCode';
var API_GET_PARTY_LIST      = '/api/Master/GetAccountIsClientDropDown';
var API_GET_INVOICE_BY_ACC  = '/api/PaymentEntry/GetInvoiceDetailsByAccountMaster';
var API_GET_PAYMENT_MODE_LIST = '/api/PaymentEntry/GetPaymentModeList';
var G_PEAEditCode     = 0;
var G_PEAViewMode     = false;
var G_PEADeleteCode   = 0;
var G_PEAInvoiceRows  = [];
var G_PEAListRows     = [];
var G_PEAIsBindingEdit = false;
var G_PEAEntryNoSave   = 0;
var G_PEAAdvanceManual = false;
var G_PEAPayModeOptions = [
    'Sale Return',
    'Post Sale Discount',
    'Correction in Invoice',
    'Purchase Return',
    'Other'
];

function pad2(n) { return String(n).padStart(2, '0'); }
function parseAmountStr(s) {
    if (s == null || s === '') return 0;
    var v = parseFloat(String(s).replace(/,/g, ''));
    return isNaN(v) ? 0 : v;
}
function formatAmt(v) {
    v = parseFloat(v);
    if (isNaN(v)) return '0.00';
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatRupee(v) {
    return '\u20B9 ' + formatAmt(v);
}
function PEAGetPayableFromRow(r) {
    if (r['Payable Amt'] != null && r['Payable Amt'] !== '') return parseAmountStr(r['Payable Amt']);
    if (r['Payable Amount'] != null && r['Payable Amount'] !== '') return parseAmountStr(r['Payable Amount']);
    if (r.PayableAmount != null && r.PayableAmount !== '') return parseAmountStr(r.PayableAmount);
    if (r.PayableAmt != null && r.PayableAmt !== '') return parseAmountStr(r.PayableAmt);
    if (r.PendingAmount != null && r.PendingAmount !== '') return parseAmountStr(r.PendingAmount);
    if (r['Pending Amount'] != null && r['Pending Amount'] !== '') return parseAmountStr(r['Pending Amount']);
    if (r.BalanceAmount != null && r.BalanceAmount !== '') return parseAmountStr(r.BalanceAmount);
    if (r['Balance Amount'] != null && r['Balance Amount'] !== '') return parseAmountStr(r['Balance Amount']);
    var billAmt = parseAmountStr(r.BillAmount || r['BillAmount'] || 0);
    var adjAmt  = parseAmountStr(r.AmountAdjusted || r['AmountAdjusted'] || 0);
    return parseAmountStr(billAmt - adjAmt);
}
function PEAGetPaymentAmtFromRow(r) {
    if (r.PaymentAmt != null && r.PaymentAmt !== '') return parseAmountStr(r.PaymentAmt);
    if (r['Payment Amt'] != null && r['Payment Amt'] !== '') return parseAmountStr(r['Payment Amt']);
    if (r.PaymentAmount != null && r.PaymentAmount !== '') return parseAmountStr(r.PaymentAmount);
    if (r.paymentAmount != null && r.paymentAmount !== '') return parseAmountStr(r.paymentAmount);
    if (r.Amount != null && r.Amount !== '') return parseAmountStr(r.Amount);
    return 0;
}
function PEAFormatAmountInput(el) {
    var raw = el.value.replace(/[^0-9.]/g, '');
    var parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    el.value = raw;
}
function PEAAmountBlur() {
    var el = document.getElementById('txtPEAmount');
    var v = parseAmountStr(el.value);
    el.value = v > 0 ? formatAmt(v) : '';
    G_PEAAdvanceManual = false;
    PEAUpdateGridFooter();
    if (v > 0 && PEAGetBillPaymentTotal() > v) {
        PEAToastError('Bill payment total exceeds Amount. Please reduce payment amounts.');
    }
}
function PEAGetBillPaymentTotal() {
    var total = 0;
    $.each(G_PEAInvoiceRows, function (i, r) { total += r.PaymentAmount; });
    return total;
}
function PEAApplyBillPaymentCap(idx, proposedAmt) {
    var amount = parseAmountStr($('#txtPEAAmount').val());
    if (amount <= 0) return proposedAmt;

    var otherTotal = 0;
    $.each(G_PEAInvoiceRows, function (i, r) {
        if (i !== idx) otherTotal += r.PaymentAmount;
    });
    var maxForRow = Math.max(0, amount - otherTotal);
    if (proposedAmt > maxForRow) {
        PEAToastError('Total payment cannot exceed Amount (' + formatAmt(amount) + ').');
        return maxForRow;
    }
    return proposedAmt;
}
function PEALockAdvanceField() {
    $('#txtPEAAdvance').prop('readonly', true).addClass('pea-readonly');
}
function PEAGetAdvanceFromMaster(pm) {
    if (!pm) return 0;
    return parseAmountStr(
        pm.AdvanceAmount != null ? pm.AdvanceAmount
            : (pm.advanceAmount != null ? pm.advanceAmount
                : (pm['Advance Amount'] != null ? pm['Advance Amount'] : 0))
    );
}
function PEASetAdvanceDisplay(value) {
    var v = parseAmountStr(value);
    $('#txtPEAAdvance').val(v > 0 ? formatAmt(v) : '');
}
function PEAToastError(msg) {
    if (typeof toastr !== 'undefined') { toastr.error(msg); }
    else { alert(msg); }
}
function PEAGetListRowByCode(code) {
    var found = null;
    $.each(G_PEAListRows, function (i, r) {
        var c = r.Code || r.code || r.PaymentEntryCode || r.billMaster_Code || 0;
        if (String(c) === String(code)) {
            found = r;
            return false;
        }
    });
    return found;
}

function PEAFormatApiDate(dateVal) {
    if (!dateVal) return '';
    var s = String(dateVal);
    if (s.indexOf('T') >= 0 || s.indexOf('-') === 4) {
        var d = new Date(s);
        if (!isNaN(d.getTime())) {
            return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
        }
    }
    return s;
}
function PEAGetModuleCode() {
    try {
        var data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = data.find(function (item) {
            var d = (item.ModuleDesp || '').toLowerCase();
            return d === 'credit note'
                || d.indexOf('credit note') >= 0
                || d.indexOf('payment entry adjustment') >= 0
                || d.indexOf('payment entry adjestment') >= 0
                || d.indexOf('adjestment') >= 0
                || d.indexOf('adjustment') >= 0;
        });
        if (result) UserModuleMaster_Code = result.Code;
    } catch (e) { UserModuleMaster_Code = 0; }
}

$(document).ready(function () {
    $("#ERPHeading").text("Credit Note");
    PEAGetModuleCode();
    PEAInitDatepickers();
    PEAInitSelect2();
    PEALockAdvanceField();
    PEALoadPartyDropdown();
    PEALoadPaymentModeList();
    PEALoadList('Load');

    $('#btnPEAApplyFilter').on('click', function () { PEALoadList(); });
    $('#btnPEAResetFilter').on('click', function () {
        var today = new Date();
        var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        $('#txtPEAFromDate').datepicker('setDate', monthStart);
        $('#txtPEAToDate').datepicker('setDate', today);
        $('#ddlPEAPartyFilter').val('').trigger('change');
        $('#ddlPEAPayModeFilter').val('').trigger('change');
        PEALoadList();
    });


});
function PEAInitDatepickers() {
    var opts = { format: 'dd-mm-yyyy', autoclose: true, todayHighlight: true };
    $('#txtPEAFromDate, #txtPEAToDate, #txtPEADate').datepicker(opts);

    var today = new Date();
    var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    $('#txtPEAFromDate').datepicker('setDate', monthStart);
    $('#txtPEAToDate').datepicker('setDate', today);
    $('#txtPEADate').datepicker('setDate', today);
}
function PEASetPartyFieldDisabled(disabled) {
    var $ddl = $('#ddlPEAPartyName');
    $ddl.prop('disabled', !!disabled);
    $ddl.trigger('change.select2');
}
function PEAInitSelect2() {
    $('#ddlPEAPartyFilter').select2({ theme: 'default', width: '100%' });
    $('#ddlPEAPartyName').select2({ theme: 'default', width: '100%' });
    $('#ddlPEAPayMode').select2({ theme: 'default', width: '100%', placeholder: '-- Select --', allowClear: true });
    $('#ddlPEAPayModeFilter').select2({ theme: 'default', width: '100%' });

    $('#ddlPEAPartyName').on('change', function () {
        if (G_PEAIsBindingEdit) return;
        var code = $(this).val();
        if (code) {
            PEAFillGrid();
        } else {
            G_PEAInvoiceRows = [];
            $('#peaInvoiceGridSection').hide();
            $('#tblPEAInvoiceFoot').hide();
            $('#tblPEAInvoiceBody').html(
                '<tr><td colspan="7" class="text-center text-muted py-3">Select a party to load bills.</td></tr>'
            );
        }
    });
}
function PEALoadPartyDropdown() {
    $.ajax({
        url:  appBaseURL + API_GET_PARTY_LIST,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            var opts = '<option value=""></option>';
            if (res && res.length > 0) {
                $.each(res, function (i, item) {
                    opts += '<option value="' + item.Code + '">' + item.AccountName + '</option>';
                });
            }
            $('#ddlPEAPartyName, #ddlPEAPartyFilter').html(opts).trigger('change');
        },
        error: function () {
            $('#ddlPEAPartyName, #ddlPEAPartyFilter').html('<option value=""></option>').trigger('change');
        }
    });
}
function PEAMapPaymentModeDesp(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.Desp || item['Credit Note Type'] || item['Payment Mode'] || item.PaymentMode || item.paymentMode
        || item.Mode || item.Name || item.CreditNote || '';
}
function PEARenamePaymentModeColumn(item, extras) {
    var creditNoteType = PEAMapPaymentModeDesp(item);
    var row = {};
    Object.keys(item || {}).forEach(function (k) {
        if (k === 'Payment Mode' || k === 'PaymentMode') {
            row['Credit Note Type'] = creditNoteType;
            return;
        }
        row[k] = item[k];
    });
    if (row['Credit Note Type'] === undefined) {
        row['Credit Note Type'] = creditNoteType;
    }
    return Object.assign(row, extras || {});
}
function PEAPositionPayModeSuggestion($input, $list) {
    if (!$input || !$input.length) return;
    if (!$list || !$list.length) return;
    if (!$list.parent().is('body')) {
        $list.appendTo('body');
    }
    var offset = $input.offset();
    if (!offset) return;
    $list.css({
        position: 'absolute',
        top: offset.top + $input.outerHeight(),
        left: offset.left,
        width: $input.outerWidth(),
        zIndex: 99999
    });
}
function PEASetupPayModeAutoSuggestion(inputSelector, listSelector, data, focusNs) {
    var $input = $(inputSelector);
    var $list = $(listSelector);
    if (!$input.length || !$list.length || !data.length) {
        if ($list.length) $list.empty().hide();
        return;
    }
    PEAPositionPayModeSuggestion($input, $list);
    SetUpAutoSuggestion($input, $list, data, 'StartWith');
    $input.off('focus.' + focusNs).on('focus.' + focusNs, function () {
        PEAPositionPayModeSuggestion($input, $list);
    });
}
function PEABuildPayModeSelectOptions(names, emptyLabel) {
    var html = '<option value="">' + (emptyLabel || '') + '</option>';
    var seen = {};
    (names || []).forEach(function (name) {
        var desp = (name || '').toString().trim();
        if (!desp || seen[desp]) return;
        seen[desp] = true;
        var safe = $('<div>').text(desp).html();
        html += '<option value="' + safe + '">' + safe + '</option>';
    });
    return html;
}
function PEABindPayModeDropdown(names) {
    var selected = ($('#ddlPEAPayMode').val() || '').trim();
    var list = (names || []).slice();
    if (selected && list.indexOf(selected) < 0) list.push(selected);
    $('#ddlPEAPayMode').html(PEABuildPayModeSelectOptions(list));
    if (selected) $('#ddlPEAPayMode').val(selected);
    $('#ddlPEAPayMode').trigger('change');
}
function PEASetPayModeValue(value) {
    var v = (value || '').toString().trim();
    if (v) {
        var exists = false;
        $('#ddlPEAPayMode option').each(function () {
            if ($(this).val() === v) { exists = true; return false; }
        });
        if (!exists) {
            var safe = $('<div>').text(v).html();
            $('#ddlPEAPayMode').append('<option value="' + safe + '">' + safe + '</option>');
        }
    }
    $('#ddlPEAPayMode').val(v).trigger('change');
}
function PEABindPayModeFilter(names) {
    var selected = ($('#ddlPEAPayModeFilter').val() || '').trim();
    $('#ddlPEAPayModeFilter').html(PEABuildPayModeSelectOptions(names, 'All'));
    if (selected) $('#ddlPEAPayModeFilter').val(selected);
    $('#ddlPEAPayModeFilter').trigger('change');
}
function PEALoadPaymentModeList() {
    PEABindPayModeDropdown(G_PEAPayModeOptions);
    PEABindPayModeFilter(G_PEAPayModeOptions);
}
function PEAFillGrid() {
    var accountCode = $('#ddlPEAPartyName').val();
    if (!accountCode) { alert('Please select a party first.'); return; }

    G_PEAInvoiceRows = [];
    $('#tblPEAInvoiceBody').html(
        '<tr><td colspan="7" class="text-center text-muted py-3">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading bills...</td></tr>'
    );
    $('#peaInvoiceGridSection').show();
    $('#tblPEAInvoiceFoot').hide();

    blockUI();
    $.ajax({
        url:  appBaseURL + API_GET_INVOICE_BY_ACC,
        type: 'GET',
        data: { AccountMaster_Code: accountCode },
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            unblockUI();
            PEARenderInvoiceGrid(res);
        },
        error: function () {
            unblockUI();
            PEARenderInvoiceGrid(null);
        }
    });
}
function PEARenderInvoiceGrid(res) {
    var rows = [];
    if (res && Array.isArray(res))           rows = res;
    else if (res && Array.isArray(res.Data)) rows = res.Data;
    else if (res && Array.isArray(res.data)) rows = res.data;

    if (!rows.length) {
        $('#tblPEAInvoiceBody').html(
            '<tr><td colspan="7" class="text-center text-muted py-3">' +
            '<i class="fa fa-inbox me-2"></i>No pending bills found for selected party.</td></tr>'
        );
        $('#tblPEAInvoiceFoot').hide();
        return;
    }

    G_PEAInvoiceRows = $.map(rows, function (r) {
        var billAmt  = parseAmountStr(r.BillAmount || r['BillAmount'] || 0);
        var adjAmt   = parseAmountStr(r.AmountAdjusted || r['AmountAdjusted'] || 0);
        var payable  = PEAGetPayableFromRow(r);
        return {
            BillNo:           r['Bill No']  || r.BillNo   || r.InvoiceNo || r.OrderNo  || '',
            PONo:             r['PO No']    || r.PONo     || r.PO_No     || '',
            BillDate:         r['Bill Date']|| r.BillDate || r.InvoiceDate|| r.OrderDate|| '',
            BillAmount:       billAmt,
            Deduction:        parseAmountStr(r.Deduction || r['Deduction'] || 0),
            AmountAdjusted:   adjAmt,
            PayableAmount:    payable,
            PaymentAmount:     parseAmountStr(r.Amount || r['Amount'] || 0),
            AccountMasterCode: r.AccountMaster_Code || r['AccountMaster_Code'] || 0,
            InvoiceMaster_Code: r.InvoiceMaster_Code || r['InvoiceMaster_Code'] || r.InvoiceCode || r.BillCode || 0
        };
    });

    PEARefreshInvoiceTable();
}
function PEARefreshInvoiceTable() {
    if (!G_PEAInvoiceRows.length) {
        $('#tblPEAInvoiceBody').html(
            '<tr><td colspan="7" class="text-center text-muted py-3">' +
            '<i class="fa fa-inbox me-2"></i>No bills in grid.</td></tr>'
        );
        $('#tblPEAInvoiceFoot').hide();
        return;
    }

    var html = '';
    $.each(G_PEAInvoiceRows, function (i, r) {
        html += '<tr>'
            + '<td>' + (i + 1) + '</td>'
            + '<td>' + r.BillNo + '</td>'
            + '<td>' + r.BillDate + '</td>'
            + '<td class="text-end">' + formatAmt(r.BillAmount) + '</td>'
            + '<td class="text-end">' + formatAmt(r.AmountAdjusted || r.Deduction) + '</td>'
            + '<td class="text-end">' + formatAmt(r.PayableAmount) + '</td>'
            + '<td class="text-end">'
            + (G_PEAViewMode
                ? (r.PaymentAmount > 0 ? formatAmt(r.PaymentAmount) : '—')
                : ('<input type="text" maxlength="15" class="pea-input text-end pea-payamt-inp" style="font-size:.83rem;max-width:115px;display:inline-block;"'
                    + ' data-idx="' + i + '" value="' + (r.PaymentAmount > 0 ? formatAmt(r.PaymentAmount) : '') + '"'
                    + ' placeholder="0.00" oninput="PEARowPayAmtInput(this,' + i + ')" onblur="PEARowAmtBlur(this,' + i + ')">'))
            + '</td>'
            + '</tr>';
    });
    $('#tblPEAInvoiceBody').html(html);
    $('#tblPEAInvoiceFoot').show();
    PEAUpdateGridFooter();
}
function PEARowPayAmtInput(el, idx) {
    PEAFormatAmountInput(el);
    if (G_PEAInvoiceRows[idx] === undefined) return;

    var payable = parseAmountStr(G_PEAInvoiceRows[idx].PayableAmount);
    var v       = parseAmountStr(el.value);

    if (payable <= 0 && v > 0) {
        PEAToastError('Cannot enter payment when Payable amount is zero or less.');
        v = 0;
        el.value = '';
    } else if (payable > 0 && v > payable) {
        PEAToastError('Payment amount cannot be greater than Payable amount (' + formatAmt(payable) + ').');
        v = payable;
        el.value = String(v);
    }

    G_PEAInvoiceRows[idx].PaymentAmount = v;
    G_PEAAdvanceManual = false;
    PEAUpdateGridFooter();
}
function PEARowAmtBlur(el, idx) {
    if (G_PEAInvoiceRows[idx] === undefined) return;

    var payable = parseAmountStr(G_PEAInvoiceRows[idx].PayableAmount);
    var v       = parseAmountStr(el.value);

    if (payable > 0 && v > payable) {
        PEAToastError('Payment amount cannot be greater than Payable amount (' + formatAmt(payable) + ').');
        v = payable;
    } else if (payable <= 0 && v > 0) {
        v = 0;
    }

    v = PEAApplyBillPaymentCap(idx, v);

    el.value = v > 0 ? formatAmt(v) : '';
    G_PEAInvoiceRows[idx].PaymentAmount = v;
    G_PEAAdvanceManual = false;
    PEAUpdateGridFooter();
}
function PEAUpdateGridFooter() {
    var totalPayable = 0, totalPayment = 0;
    $.each(G_PEAInvoiceRows, function (i, r) {
        totalPayable += r.PayableAmount;
        totalPayment += r.PaymentAmount;
    });
    var amount = parseAmountStr($('#txtPEAAmount').val());

    $('#tdPEATotalPayable').text(formatAmt(totalPayable));
    $('#tdPEATotalPayment').text(formatAmt(totalPayment));

    if (!G_PEAAdvanceManual) {
        var advance = Math.max(0, amount - totalPayment);
        PEASetAdvanceDisplay(amount > 0 || totalPayment > 0 ? advance : '');
    }
}
function PEAAutoAllocatePayment() {
    var amount = parseAmountStr($('#txtPEAAmount').val());
    if (amount <= 0) {
        PEAToastError('Please enter Amount before allocating to bills.');
        $('#txtPEAAmount').focus();
        return;
    }
    if (!G_PEAInvoiceRows.length) {
        PEAToastError('No bills in grid. Select a party to load bills.');
        return;
    }

    var remaining = amount;
    $.each(G_PEAInvoiceRows, function (i, r) {
        var payable = parseAmountStr(r.PayableAmount);
        if (payable <= 0 || remaining <= 0) {
            r.PaymentAmount = 0;
            return;
        }
        var alloc = Math.min(payable, remaining);
        r.PaymentAmount = alloc;
        remaining -= alloc;
    });

    G_PEAAdvanceManual = false;
    PEARefreshInvoiceTable();
}
function PEALoadList(type) {
    var fromDate      = ($('#txtPEAFromDate').val() || '').trim();
    var toDate        = ($('#txtPEAToDate').val() || '').trim();
    var accountCode   = $('#ddlPEAPartyFilter').val() || '';
    var paymentMode   = ($('#ddlPEAPayModeFilter').val() || '').trim();

    if (!fromDate) {
        PEAToastError('Please select from date.');
        $('#txtPEAFromDate').focus();
        return;
    }
    if (!toDate) {
        PEAToastError('Please enter to date.');
        $('#txtPEAToDate').focus();
        return;
    }

    blockUI();
    $.ajax({
        url:  appBaseURL + API_GET_PAYMENT_LIST
            + '?FromDate=' + encodeURIComponent(fromDate)
            + '&ToDate=' + encodeURIComponent(toDate)
            + '&AccountMaster_Code=' + encodeURIComponent(accountCode || '0')
            + '&PaymentMode=' + encodeURIComponent(paymentMode),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            G_PEAListRows = [];
            if (res && Array.isArray(res))                    G_PEAListRows = res;
            else if (res && Array.isArray(res.Data))          G_PEAListRows = res.Data;
            else if (res && res.Data && Array.isArray(res.Data.List)) G_PEAListRows = res.Data.List;
            PEARenderList(type);
        },
        error: function () {
            unblockUI();
            G_PEAListRows = [];
            PEARenderList(type);
        }
    });
}
function PEARenderList(type) {
    var rows = G_PEAListRows.slice();

    if (!rows.length) {
        $('#peaListTable').hide();
        if (type !== 'Load') {
            PEAToastError('Record not found.');
        }
        return;
    }

    $('#peaListTable').show();

    var StringFilterColumn      = ['Party Name', 'Account Name', 'Credit Note Type', 'Ref No', 'Narration'];
    var NumericFilterColumn     = [];
    var DateFilterColumn        = ['Entry Date', 'Date'];
    var StringdoubleFilterColumn = ['Ref No'];
    var Button                  = false;
    var showButtons             = [];
    var hiddenColumns           = ['Code', 'Status'];
    var ColumnAlignment         = { 'Amount': 'right', 'Advance Amount': 'right' };

    var updatedResponse = rows.map(function (item) {
        var peCode  = item.Code || item.code || item.PaymentEntryCode || item.billMaster_Code || 0;
        var entryNo = (item.EntryNo || item.entryNo || item['Entry No'] || '').toString().replace(/'/g, "\\'");
        var amount  = parseAmountStr(item.Amount != null ? item.Amount : (item.amount != null ? item.amount : item['Amount']));
        var advance = parseAmountStr(
            item.AdvanceAmount != null ? item.AdvanceAmount
                : (item.advanceAmount != null ? item.advanceAmount : item['Advance Amount'])
        );

        return PEARenamePaymentModeColumn(item, {
            Amount: formatRupee(amount),
            'Advance Amount': formatRupee(advance),
            Action: '<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="PEAEditEntry(' + peCode + ')"><i class="fa-solid fa-pencil"></i></button>&nbsp;'
                + '<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="PEAShowDeleteModal(' + peCode + ',\'' + entryNo + '\')"><i class="fa-regular fa-circle-xmark"></i></button>&nbsp;'
                + '<button class="btn btn-primary icon-height mb-1" title="View" onclick="PEAViewEntry(' + peCode + ')"><i class="fa-solid fa fa-eye"></i></button>&nbsp;'
                + '<button class="btn btn-info icon-height mb-1" title="Download PDF" onclick="DownloadCreditNotePdf(' + peCode + ')"><i class="fa-solid fa-download"></i></button>'
        });
    });

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header', 'table-body', updatedResponse,
        Button, showButtons, StringFilterColumn, NumericFilterColumn,
        DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,true
    );
}
function PEASetFormViewMode(isView) {
    G_PEAViewMode = !!isView;
    $('#btnPEASave').toggle(!isView);
    $('#btnPEAReset').toggle(!isView);
    $('#btnPEAAutoAllocate').toggle(!isView);
    $('#peaCreatePage .pea-note').toggle(!isView);
    if (isView) {
        $('#txtPEADate').prop('disabled', true).addClass('pea-readonly');
        $('#txtPEARefNo, #txtPEAAmount, #txtPEANarration').prop('readonly', true).addClass('pea-readonly');
        $('#ddlPEAPayMode').prop('disabled', true).trigger('change.select2');
        PEASetPartyFieldDisabled(true);
    } else {
        $('#txtPEADate').prop('disabled', false).removeClass('pea-readonly');
        $('#txtPEARefNo, #txtPEAAmount, #txtPEANarration').prop('readonly', false).removeClass('pea-readonly');
        $('#ddlPEAPayMode').prop('disabled', false).trigger('change.select2');
    }
}
function PEAShowCreatePage() {
    G_PEAEditCode = 0;
    G_PEAViewMode = false;
    PEASetFormViewMode(false);
    PEAResetForm();
    $('#peaListPage').hide();
    $('#peaCreatePage').show();
    $('#peaToolbar').show();
    $('#lblPEAFormBadge').text('NEW').attr('class', 'tabSec tab active');
    window.scrollTo(0, 0);
}
function PEAShowListPage() {
    $('#peaCreatePage').hide();
    $('#peaToolbar').hide();
    $('#peaListPage').show();
    G_PEAViewMode = false;
    PEASetFormViewMode(false);
    PEALoadList();
}
function PEAResetForm() {
    G_PEAViewMode = false;
    PEASetFormViewMode(false);
    G_PEAIsBindingEdit = false;
    G_PEAEntryNoSave = 0;
    G_PEAAdvanceManual = false;
    PEASetPartyFieldDisabled(false);
    $('#txtPEAEntryNo').val('');
    $('#txtPEADate').datepicker('setDate', new Date());
    $('#ddlPEAPartyName').val('').trigger('change');
    $('#ddlPEAPayMode').val('').trigger('change');
    $('#txtPEARefNo').val('');
    $('#txtPEAAmount').val('');
    $('#txtPEANarration').val('');
    G_PEAInvoiceRows = [];
    $('#peaInvoiceGridSection').hide();
    $('#tblPEAInvoiceFoot').hide();
    $('#txtPEAAdvance').val('');
    $('#tblPEAInvoiceBody').html(
        '<tr><td colspan="7" class="text-center text-muted py-3">Select a party to load bills.</td></tr>'
    );
}
function PEABindEntryFromApi(res, code, formMode) {
    if (!res) {
        PEAToastError('Record not found.');
        return false;
    }
    var masterRows = [];
    if (res.BillMaster && res.BillMaster.length)               masterRows = res.BillMaster;
    else if (res.PaymentMaster && res.PaymentMaster.length)    masterRows = res.PaymentMaster;
    else if (Array.isArray(res) && res.length)                 masterRows = res;
    if (!masterRows.length) {
        PEAToastError('Record not found.');
        return false;
    }
    var pm = masterRows[0];
    var details = [];
    if (res.BillAdjustmentDetails && res.BillAdjustmentDetails.length) details = res.BillAdjustmentDetails;
    else if (res.PaymentDetails && res.PaymentDetails.length)          details = res.PaymentDetails;
    var listRow = PEAGetListRowByCode(code);
    var isView = formMode === 'VIEW';

    G_PEAEditCode = pm.Code || code;
    G_PEAIsBindingEdit = true;
    PEASetFormViewMode(isView);

    G_PEAEntryNoSave = pm.EntryNo != null ? pm.EntryNo : (pm.entryNo != null ? pm.entryNo : 0);
    var entryNoDisplay = (listRow && (listRow['Entry No'] || listRow.EntryNo || listRow.entryNo))
        || (pm.EntryNo && pm.EntryNo !== 0 ? pm.EntryNo : '')
        || (pm.EntryNoStr || pm.entryNoStr || pm['Entry No'] || '');
    $('#txtPEAEntryNo').val(entryNoDisplay);

    var payMode = pm.PaymentMode || pm.paymentMode || pm.Payment_Mode || pm.PayMode || '';
    if (!payMode && listRow) {
        payMode = listRow['Credit Note Type'] || listRow['Payment Mode'] || listRow.PaymentMode || listRow.PayMode || '';
    }
    $('#txtPEADate').datepicker('update', PEAFormatApiDate(pm.EntryDate || pm.entryDate || ''));
    $('#ddlPEAPartyName').val(pm.AccountMaster_Code || pm.accountMaster_Code || '').trigger('change.select2');
    PEASetPartyFieldDisabled(true);
    PEASetPayModeValue(payMode);
    $('#txtPEARefNo').val(pm.RefNo || pm.refno || pm.Refno || '');
    $('#txtPEAAmount').val(formatAmt(pm.Amount || pm.amount || 0));
    $('#txtPEANarration').val(pm.Narration || pm.narration || '');

    $('#peaListPage').hide();
    $('#peaCreatePage').show();
    $('#peaToolbar').show();
    $('#lblPEAFormBadge').text(isView ? 'VIEW' : 'EDIT').attr('class', 'tabSec tab active');
    window.scrollTo(0, 0);

    PEARenderEditBillGrid(details, pm.AccountMaster_Code || pm.accountMaster_Code);
    if (!G_PEAInvoiceRows.length) {
        PEASetAdvanceDisplay(PEAGetAdvanceFromMaster(pm));
    }
    PEALockAdvanceField();
    if (isView) {
        PEASetFormViewMode(true);
        PEARefreshInvoiceTable();
    }
    return true;
}
function PEAEditEntry(code) {
    blockUI();
    $.ajax({
        url:  appBaseURL + API_GET_PAYMENT_BY_CODE + '?Code=' + encodeURIComponent(code),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            PEABindEntryFromApi(res, code, 'EDIT');
        },
        error: function () {
            unblockUI();
            PEAToastError('Failed to load payment entry.');
        }
    });
}
function DownloadCreditNotePdf(code) {
    $.ajax({
        url: AppBaseURLMenu + '/RDLC/PrintCreditNote?Code=' + encodeURIComponent(code)
            + '&UserName=' + encodeURIComponent(G_UserName || '')
            + '&AuthKey=' + encodeURIComponent(authKeyRaw || ''),
        type: 'GET',
        xhrFields: { responseType: 'blob' },
        success: function (data) {
            var blob = new Blob([data], { type: 'application/pdf' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'CreditNote.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },
        error: function (xhr) {
            PEAToastError('PDF download failed.');
            console.error('PrintCreditNote', xhr.responseText || xhr.status);
        }
    });
}
async function PEAViewEntry(code) {
    try {
        if (typeof CheckOptionPermission === 'function') {
            if (!UserModuleMaster_Code) PEAGetModuleCode();
            if (UserModuleMaster_Code > 0) {
                var perm = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
                if (!perm.hasPermission) {
                    PEAToastError(perm.msg || 'You do not have permission to view this entry.');
                    return;
                }
            }
        }
    } catch (e) {
        console.error('PEAViewEntry permission check failed', e);
        PEAToastError('Unable to verify view permission. Please try again.');
        return;
    }
    blockUI();
    $.ajax({
        url:  appBaseURL + API_GET_PAYMENT_BY_CODE + '?Code=' + encodeURIComponent(code),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            if (!PEABindEntryFromApi(res, code, 'VIEW')) {
                return;
            }
        },
        error: function () {
            unblockUI();
            PEAToastError('Failed to load credit note.');
        }
    });
}
function PEARenderEditBillGrid(paymentDetails, accountCode) {
    G_PEAIsBindingEdit = false;

    if (!paymentDetails || !paymentDetails.length) {
        G_PEAInvoiceRows = [];
        $('#tblPEAInvoiceBody').html(
            '<tr><td colspan="7" class="text-center text-muted py-3">' +
            '<i class="fa fa-inbox me-2"></i>No bill allocation found for this entry.</td></tr>'
        );
        $('#peaInvoiceGridSection').show();
        $('#tblPEAInvoiceFoot').hide();
        return;
    }

    G_PEAInvoiceRows = $.map(paymentDetails, function (pd) {
        return {
            BillNo:             pd['Bill No']   || pd.BillNo   || '',
            BillDate:           pd['Bill Date'] || pd.BillDate || '',
            BillAmount:         parseAmountStr(pd.BillAmount || pd['BillAmount'] || 0),
            Deduction:          parseAmountStr(pd.Deduction || pd['Deduction'] || 0),
            AmountAdjusted:     parseAmountStr(pd.AmountAdjusted || pd['AmountAdjusted'] || 0),
            PayableAmount:      PEAGetPayableFromRow(pd),
            PaymentAmount:      PEAGetPaymentAmtFromRow(pd),
            AdjustmentCode:     pd.Code || pd.code || 0,
            BillMaster_Code:    pd.BillMaster_Code || pd.billMaster_Code || G_PEAEditCode || 0,
            AccountMasterCode:  accountCode || pd.AccountMaster_Code || pd.accountMaster_Code || 0,
            InvoiceMaster_Code: pd.InvoiceMaster_Code || pd.invoiceMaster_Code || 0
        };
    });

    $('#peaInvoiceGridSection').show();
    PEARefreshInvoiceTable();
}
function PEASavePaymentEntry() {
    var date      = $('#txtPEADate').val().trim();
    var amount    = parseAmountStr($('#txtPEAAmount').val());
    var partyCode = $('#ddlPEAPartyName').val();

    var payMode   = ($('#ddlPEAPayMode').val() || '').trim();
    var refNo     = $('#txtPEARefNo').val().trim();
    var narration = $('#txtPEANarration').val().trim();

    if (!date) {
        PEAToastError('Please select entry date.');
        $('#txtPEADate').focus();
        return;
    }
    if (!partyCode) {
        PEAToastError('Please select a party.');
        return;
    }
    if (!payMode) {
        PEAToastError('Please select Credit Note.');
        return;
    }
    if (!refNo) {
        PEAToastError('Please enter Ref No / CH No.');
        $('#txtPEARefNo').focus();
        return;
    }
    if (!narration) {
        PEAToastError('Please enter narration.');
        $('#txtPEANarration').focus();
        return;
    }
    if (amount <= 0) {
        PEAToastError('Please enter a valid amount.');
        $('#txtPEAAmount').focus();
        return;
    }

    /* Sync any payment-amount inputs that haven't fired blur yet */
    $('.pea-payamt-inp').each(function () {
        var idx = parseInt($(this).data('idx'));
        if (!isNaN(idx) && G_PEAInvoiceRows[idx] !== undefined) {
            G_PEAInvoiceRows[idx].PaymentAmount = parseAmountStr($(this).val());
        }
    });

    var totalBillPayment = PEAGetBillPaymentTotal();
    if (totalBillPayment > amount) {
        PEAToastError('Total bill payment (' + formatAmt(totalBillPayment) + ') cannot exceed Amount (' + formatAmt(amount) + ').');
        return;
    }

    if (!G_PEAAdvanceManual) {
        var autoAdvance = Math.max(0, amount - totalBillPayment);
        PEASetAdvanceDisplay(autoAdvance);
    }
    var advance = parseAmountStr($('#txtPEAAdvance').val());
    var grandTotal = totalBillPayment + advance;

    if (totalBillPayment <= 0 && advance <= 0) {
        alert('Please enter a payment amount for at least one bill, or enter an Advance / On account amount.');
        return;
    }
    if (grandTotal > amount) {
        alert('Total payment ' + formatAmt(grandTotal) + ' + Advance exceeds Amount ' + formatAmt(amount) + '.\nPlease adjust the payment amounts.');
        return;
    }

    var entryNo = G_PEAEditCode > 0
        ? G_PEAEntryNoSave
        : (parseInt($('#txtPEAEntryNo').val().trim(), 10) || 0);

    var billAdjustmentDetails = [];
    $.each(G_PEAInvoiceRows, function (i, r) {
        if (r.PaymentAmount > 0) {
            billAdjustmentDetails.push({
                code:               r.AdjustmentCode || 0,
                billMaster_Code:    G_PEAEditCode || 0,
                invoiceMaster_Code: r.InvoiceMaster_Code || 0,
                paymentAmount:      r.PaymentAmount
            });
        }
    });

    var payload = {
        billMaster: [{
            code:               G_PEAEditCode || 0,
            entryNo:            entryNo,
            entryDate:          date,
            accountMaster_Code: parseInt(partyCode, 10) || 0,
            paymentMode:        payMode,
            refno:              refNo,
            amount:             amount,
            advanceAmount:      advance,
            narration:          narration
        }],
        billAdjustmentDetails: billAdjustmentDetails
    };

    blockUI();
    $.ajax({
        url:         appBaseURL + API_SAVE_PAYMENT + '?UserMaster_Code=' + UserMaster_Code,
        type:        'POST',
        contentType: 'application/json',
        dataType:    'json',
        data:        JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            if (res && (res.Status === 'Y' || res.Status === 1 || res.status === 'Y')) {
                if (typeof toastr !== 'undefined') {
                    toastr.success(res.Message || 'Saved successfully.');
                } else {
                    alert(res.Message || 'Saved successfully.');
                }
                PEAShowListPage();
            } else {
                var msg = (res && res.Message) ? res.Message : 'Save failed. Please try again.';
                if (typeof toastr !== 'undefined') { toastr.error(msg); } else { alert(msg); }
            }
        },
        error: function (xhr) {
            unblockUI();
            var msg = (xhr.responseJSON && xhr.responseJSON.Message) ? xhr.responseJSON.Message : 'Server error. Please try again.';
            if (typeof toastr !== 'undefined') { toastr.error(msg); } else { alert(msg); }
        }
    });
}
function PEAShowDeleteModal(code, entryNo) {
    G_PEADeleteCode = code;
    $('#lblPEADeleteEntry').text(entryNo || code);
    new bootstrap.Modal(document.getElementById('modalPEADelete')).show();
}
function PEAConfirmDelete() {
    if (!G_PEADeleteCode) return;

    blockUI();
    $.ajax({
        url:  appBaseURL + API_DELETE_PAYMENT
            + '?Code=' + encodeURIComponent(G_PEADeleteCode)
            + '&UserMaster_Code=' + encodeURIComponent(UserMaster_Code),
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            bootstrap.Modal.getInstance(document.getElementById('modalPEADelete')).hide();
            if (res && (res.Status === 'Y' || res.Status === 1 || res.status === 'Y')) {
                if (typeof toastr !== 'undefined') {
                    toastr.success(res.Msg || res.Message || 'Deleted successfully.');
                }
                PEALoadList();
            } else {
                var msg = (res && (res.Msg || res.Message)) ? (res.Msg || res.Message) : 'Delete failed.';
                if (typeof toastr !== 'undefined') { toastr.error(msg); } else { alert(msg); }
            }
        },
        error: function (xhr) {
            unblockUI();
            var msg = (xhr.responseJSON && (xhr.responseJSON.Msg || xhr.responseJSON.Message))
                ? (xhr.responseJSON.Msg || xhr.responseJSON.Message)
                : 'Server error. Please try again.';
            if (typeof toastr !== 'undefined') { toastr.error(msg); } else { alert(msg); }
        }
    });
}

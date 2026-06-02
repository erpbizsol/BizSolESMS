var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
var FixParameter;
try { FixParameter = JSON.parse(sessionStorage.getItem('Fixparameter')); } catch (e) { FixParameter = null; }
var G_CompanyCode         = (FixParameter && FixParameter[0] && FixParameter[0].CompanyCode != null) ? FixParameter[0].CompanyCode : '';
var UserMaster_Code       = authKeyData ? authKeyData.UserMaster_Code : 0;
var UserModuleMaster_Code = 0;
const appBaseURL          = sessionStorage.getItem('AppBaseURL') || '';
var API_GET_PAYMENT_LIST    = '/api/PaymentEntry/GetPaymentMasterlist';
var API_SAVE_PAYMENT        = '/api/PaymentEntry/SavePaymentEntry';
var API_DELETE_PAYMENT      = '/api/PaymentEntry/DeletePaymentEntry';
var API_GET_PAYMENT_BY_CODE = '/api/PaymentEntry/ShowPaymentEntryByCode';
var API_GET_PARTY_LIST      = '/api/Master/GetAccountIsClientDropDown';
var API_GET_INVOICE_BY_ACC  = '/api/PaymentEntry/GetInvoiceDetailsByAccountMaster';
var API_GET_PAYMENT_MODE_LIST = '/api/PaymentEntry/GetPaymentModeList';
var G_PEEditCode     = 0;
var G_PEDeleteCode   = 0;
var G_PEInvoiceRows  = [];
var G_PEListRows     = [];
var G_PEIsBindingEdit = false;
var G_PEEntryNoSave   = 0;
var G_PEAdvanceManual = false;

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
/** Payable Amt from API row (supports spaced keys like "Payable Amt"). */
function PEGetPayableFromRow(r) {
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
function PEGetPaymentAmtFromRow(r) {
    if (r.PaymentAmt != null && r.PaymentAmt !== '') return parseAmountStr(r.PaymentAmt);
    if (r['Payment Amt'] != null && r['Payment Amt'] !== '') return parseAmountStr(r['Payment Amt']);
    if (r.PaymentAmount != null && r.PaymentAmount !== '') return parseAmountStr(r.PaymentAmount);
    if (r.paymentAmount != null && r.paymentAmount !== '') return parseAmountStr(r.paymentAmount);
    if (r.Amount != null && r.Amount !== '') return parseAmountStr(r.Amount);
    return 0;
}
function PEFormatAmountInput(el) {
    var raw = el.value.replace(/[^0-9.]/g, '');
    var parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    el.value = raw;
}
function PEAmountBlur() {
    var el = document.getElementById('txtPEAmount');
    var v = parseAmountStr(el.value);
    el.value = v > 0 ? formatAmt(v) : '';
    G_PEAdvanceManual = false;
    PEUpdateGridFooter();
    if (v > 0 && PEGetBillPaymentTotal() > v) {
        PEToastError('Bill payment total exceeds Amount. Please reduce payment amounts.');
    }
}
function PEGetBillPaymentTotal() {
    var total = 0;
    $.each(G_PEInvoiceRows, function (i, r) { total += r.PaymentAmount; });
    return total;
}
function PEApplyBillPaymentCap(idx, proposedAmt) {
    var amount = parseAmountStr($('#txtPEAmount').val());
    if (amount <= 0) return proposedAmt;

    var otherTotal = 0;
    $.each(G_PEInvoiceRows, function (i, r) {
        if (i !== idx) otherTotal += r.PaymentAmount;
    });
    var maxForRow = Math.max(0, amount - otherTotal);
    if (proposedAmt > maxForRow) {
        PEToastError('Total payment cannot exceed Amount (' + formatAmt(amount) + ').');
        return maxForRow;
    }
    return proposedAmt;
}
function PELockAdvanceField() {
    $('#txtPEAdvance').prop('readonly', true).addClass('pe-readonly');
}
function PEGetAdvanceFromMaster(pm) {
    if (!pm) return 0;
    return parseAmountStr(
        pm.AdvanceAmount != null ? pm.AdvanceAmount
            : (pm.advanceAmount != null ? pm.advanceAmount
                : (pm['Advance Amount'] != null ? pm['Advance Amount'] : 0))
    );
}
function PESetAdvanceDisplay(value) {
    var v = parseAmountStr(value);
    $('#txtPEAdvance').val(v > 0 ? formatAmt(v) : '');
}
function PEToastError(msg) {
    if (typeof toastr !== 'undefined') { toastr.error(msg); }
    else { alert(msg); }
}

function PEGetListRowByCode(code) {
    var found = null;
    $.each(G_PEListRows, function (i, r) {
        var c = r.Code || r.code || r.PaymentEntryCode || r.billMaster_Code || 0;
        if (String(c) === String(code)) {
            found = r;
            return false;
        }
    });
    return found;
}

function PEFormatApiDate(dateVal) {
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
function PEGetModuleCode() {
    try {
        var data = JSON.parse(sessionStorage.getItem('UserModuleMaster') || '[]');
        var result = data.find(function (item) {
            return (item.ModuleDesp || '').toLowerCase().indexOf('payment') >= 0;
        });
        if (result) UserModuleMaster_Code = result.Code;
    } catch (e) { UserModuleMaster_Code = 0; }
}

$(document).ready(function () {
    $("#ERPHeading").text("Payment Entry");
    PEGetModuleCode();
    PEInitDatepickers();
    PEInitSelect2();
    PELockAdvanceField();
    PELoadPartyDropdown();
    PELoadPaymentModeList();
    PELoadList('Load');

    $('#btnPEApplyFilter').on('click', function () { PELoadList(); });
    $('#btnPEResetFilter').on('click', function () {
        var today = new Date();
        var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        $('#txtPEFromDate').datepicker('setDate', monthStart);
        $('#txtPEToDate').datepicker('setDate', today);
        $('#ddlPEPartyFilter').val('').trigger('change');
        $('#txtPEPayModeFilter').val('');
        PELoadList();
    });

});
function PEInitDatepickers() {
    var opts = { format: 'dd-mm-yyyy', autoclose: true, todayHighlight: true };
    $('#txtPEFromDate, #txtPEToDate, #txtPEDate').datepicker(opts);

    var today = new Date();
    var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    $('#txtPEFromDate').datepicker('setDate', monthStart);
    $('#txtPEToDate').datepicker('setDate', today);
    $('#txtPEDate').datepicker('setDate', today);
}
function PESetPartyFieldDisabled(disabled) {
    var $ddl = $('#ddlPEPartyName');
    $ddl.prop('disabled', !!disabled);
    $ddl.trigger('change.select2');
}
function PEInitSelect2() {
    $('#ddlPEPartyFilter').select2({ theme: 'default', width: '100%' });
    $('#ddlPEPartyName').select2({ theme: 'default', width: '100%' });

    $('#ddlPEPartyName').on('change', function () {
        if (G_PEIsBindingEdit) return;
        var code = $(this).val();
        if (code) {
            PEFillGrid();
        } else {
            G_PEInvoiceRows = [];
            $('#peInvoiceGridSection').hide();
            $('#tblPEInvoiceFoot').hide();
            $('#tblPEInvoiceBody').html(
                '<tr><td colspan="7" class="text-center text-muted py-3">Select a party to load bills.</td></tr>'
            );
        }
    });
}
function PELoadPartyDropdown() {
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
            $('#ddlPEPartyName, #ddlPEPartyFilter').html(opts).trigger('change');
        },
        error: function () {
            $('#ddlPEPartyName, #ddlPEPartyFilter').html('<option value=""></option>').trigger('change');
        }
    });
}
function PEMapPaymentModeDesp(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.Desp || item['Payment Mode'] || item.PaymentMode || item.paymentMode
        || item.Mode || item.Name || item.CreditNote || '';
}
function PEPositionPayModeSuggestion($input, $list) {
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
function PESetupPayModeAutoSuggestion(inputSelector, listSelector, data, focusNs) {
    var $input = $(inputSelector);
    var $list = $(listSelector);
    if (!$input.length || !$list.length || !data.length) {
        if ($list.length) $list.empty().hide();
        return;
    }
    PEPositionPayModeSuggestion($input, $list);
    SetUpAutoSuggestion($input, $list, data, 'StartWith');
    $input.off('focus.' + focusNs).on('focus.' + focusNs, function () {
        PEPositionPayModeSuggestion($input, $list);
    });
}
function PELoadPaymentModeList() {
    $.ajax({
        url: appBaseURL + API_GET_PAYMENT_MODE_LIST,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (!response || !response.length) {
                $('#txtPEPayModeList, #txtPEPayModeFilterList').empty().hide();
                return;
            }
            var data = $.map(response, function (item) {
                var desp = PEMapPaymentModeDesp(item);
                return desp ? { Desp: desp } : null;
            }).filter(Boolean);

            if (!data.length) {
                $('#txtPEPayModeList, #txtPEPayModeFilterList').empty().hide();
                return;
            }

            PESetupPayModeAutoSuggestion('#txtPEPayMode', '#txtPEPayModeList', data, 'pePayMode');
            PESetupPayModeAutoSuggestion('#txtPEPayModeFilter', '#txtPEPayModeFilterList', data, 'pePayModeFilter');
        },
        error: function () {
            $('#txtPEPayModeList, #txtPEPayModeFilterList').empty().hide();
        }
    });
}
function PEFillGrid() {
    var accountCode = $('#ddlPEPartyName').val();
    if (!accountCode) { alert('Please select a party first.'); return; }

    G_PEInvoiceRows = [];
    $('#tblPEInvoiceBody').html(
        '<tr><td colspan="7" class="text-center text-muted py-3">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading bills...</td></tr>'
    );
    $('#peInvoiceGridSection').show();
    $('#tblPEInvoiceFoot').hide();

    blockUI();
    $.ajax({
        url:  appBaseURL + API_GET_INVOICE_BY_ACC,
        type: 'GET',
        data: { AccountMaster_Code: accountCode },
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            unblockUI();
            PERenderInvoiceGrid(res);
        },
        error: function () {
            unblockUI();
            PERenderInvoiceGrid(null);
        }
    });
}
function PERenderInvoiceGrid(res) {
    var rows = [];
    if (res && Array.isArray(res))           rows = res;
    else if (res && Array.isArray(res.Data)) rows = res.Data;
    else if (res && Array.isArray(res.data)) rows = res.data;

    if (!rows.length) {
        $('#tblPEInvoiceBody').html(
            '<tr><td colspan="7" class="text-center text-muted py-3">' +
            '<i class="fa fa-inbox me-2"></i>No pending bills found for selected party.</td></tr>'
        );
        $('#tblPEInvoiceFoot').hide();
        return;
    }

    G_PEInvoiceRows = $.map(rows, function (r) {
        var billAmt  = parseAmountStr(r.BillAmount || r['BillAmount'] || 0);
        var adjAmt   = parseAmountStr(r.AmountAdjusted || r['AmountAdjusted'] || 0);
        var payable  = PEGetPayableFromRow(r);
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

    PERefreshInvoiceTable();
}
function PERefreshInvoiceTable() {
    if (!G_PEInvoiceRows.length) {
        $('#tblPEInvoiceBody').html(
            '<tr><td colspan="7" class="text-center text-muted py-3">' +
            '<i class="fa fa-inbox me-2"></i>No bills in grid.</td></tr>'
        );
        $('#tblPEInvoiceFoot').hide();
        return;
    }

    var html = '';
    $.each(G_PEInvoiceRows, function (i, r) {
        html += '<tr>'
            + '<td>' + (i + 1) + '</td>'
            + '<td>' + r.BillNo + '</td>'
            + '<td>' + r.BillDate + '</td>'
            + '<td class="text-end">' + formatAmt(r.BillAmount) + '</td>'
            + '<td class="text-end">' + formatAmt(r.AmountAdjusted || r.Deduction) + '</td>'
            + '<td class="text-end">' + formatAmt(r.PayableAmount) + '</td>'
            + '<td class="text-end">'
            +   '<input type="text" maxlength="15" class="pe-input text-end pe-payamt-inp" style="font-size:.83rem;max-width:115px;display:inline-block;"'
            +   ' data-idx="' + i + '" value="' + (r.PaymentAmount > 0 ? formatAmt(r.PaymentAmount) : '') + '"'
            +   ' placeholder="0.00" oninput="PERowPayAmtInput(this,' + i + ')" onblur="PERowAmtBlur(this,' + i + ')">'
            + '</td>'
            + '</tr>';
    });
    $('#tblPEInvoiceBody').html(html);
    $('#tblPEInvoiceFoot').show();
    PEUpdateGridFooter();
}
function PERowPayAmtInput(el, idx) {
    PEFormatAmountInput(el);
    if (G_PEInvoiceRows[idx] === undefined) return;

    var payable = parseAmountStr(G_PEInvoiceRows[idx].PayableAmount);
    var v       = parseAmountStr(el.value);

    if (payable <= 0 && v > 0) {
        PEToastError('Cannot enter payment when Payable amount is zero or less.');
        v = 0;
        el.value = '';
    } else if (payable > 0 && v > payable) {
        PEToastError('Payment amount cannot be greater than Payable amount (' + formatAmt(payable) + ').');
        v = payable;
        el.value = String(v);
    }

    G_PEInvoiceRows[idx].PaymentAmount = v;
    G_PEAdvanceManual = false;
    PEUpdateGridFooter();
}

function PERowAmtBlur(el, idx) {
    if (G_PEInvoiceRows[idx] === undefined) return;

    var payable = parseAmountStr(G_PEInvoiceRows[idx].PayableAmount);
    var v       = parseAmountStr(el.value);

    if (payable > 0 && v > payable) {
        PEToastError('Payment amount cannot be greater than Payable amount (' + formatAmt(payable) + ').');
        v = payable;
    } else if (payable <= 0 && v > 0) {
        v = 0;
    }

    v = PEApplyBillPaymentCap(idx, v);

    el.value = v > 0 ? formatAmt(v) : '';
    G_PEInvoiceRows[idx].PaymentAmount = v;
    G_PEAdvanceManual = false;
    PEUpdateGridFooter();
}
function PEUpdateGridFooter() {
    var totalPayable = 0, totalPayment = 0;
    $.each(G_PEInvoiceRows, function (i, r) {
        totalPayable += r.PayableAmount;
        totalPayment += r.PaymentAmount;
    });
    var amount = parseAmountStr($('#txtPEAmount').val());

    $('#tdPETotalPayable').text(formatAmt(totalPayable));
    $('#tdPETotalPayment').text(formatAmt(totalPayment));

    if (!G_PEAdvanceManual) {
        var advance = Math.max(0, amount - totalPayment);
        PESetAdvanceDisplay(amount > 0 || totalPayment > 0 ? advance : '');
    }
}
/** Allocate txtPEAmount to Payment Amt from top row; each row capped at Payable Amt. */
function PEAutoAllocatePayment() {
    var amount = parseAmountStr($('#txtPEAmount').val());
    if (amount <= 0) {
        PEToastError('Please enter Amount before allocating to bills.');
        $('#txtPEAmount').focus();
        return;
    }
    if (!G_PEInvoiceRows.length) {
        PEToastError('No bills in grid. Select a party to load bills.');
        return;
    }

    var remaining = amount;
    $.each(G_PEInvoiceRows, function (i, r) {
        var payable = parseAmountStr(r.PayableAmount);
        if (payable <= 0 || remaining <= 0) {
            r.PaymentAmount = 0;
            return;
        }
        var alloc = Math.min(payable, remaining);
        r.PaymentAmount = alloc;
        remaining -= alloc;
    });

    G_PEAdvanceManual = false;
    PERefreshInvoiceTable();
}
function PELoadList(type) {
    var fromDate      = ($('#txtPEFromDate').val() || '').trim();
    var toDate        = ($('#txtPEToDate').val() || '').trim();
    var accountCode   = $('#ddlPEPartyFilter').val() || '';
    var paymentMode   = ($('#txtPEPayModeFilter').val() || '').trim();

    if (!fromDate) {
        PEToastError('Please select from date.');
        $('#txtPEFromDate').focus();
        return;
    }
    if (!toDate) {
        PEToastError('Please enter to date.');
        $('#txtPEToDate').focus();
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
            G_PEListRows = [];
            if (res && Array.isArray(res))                    G_PEListRows = res;
            else if (res && Array.isArray(res.Data))          G_PEListRows = res.Data;
            else if (res && res.Data && Array.isArray(res.Data.List)) G_PEListRows = res.Data.List;
            PERenderList(type);
        },
        error: function () {
            unblockUI();
            G_PEListRows = [];
            PERenderList(type);
        }
    });
}
function PERenderList(type) {
    var rows = G_PEListRows.slice();

    if (!rows.length) {
        $('#peListTable').hide();
        if (type !== 'Load') {
            PEToastError('Record not found.');
        }
        return;
    }

    $('#peListTable').show();

    var StringFilterColumn      = ['Party Name', 'Account Name', 'Payment Mode', 'Ref No', 'Narration'];
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

        return Object.assign({}, item, {
            Amount: formatRupee(amount),
            'Advance Amount': formatRupee(advance),
            Action: '<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="PEEditEntry(' + peCode + ')"><i class="fa-solid fa-pencil"></i></button>&nbsp;'
                + '<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="PEShowDeleteModal(' + peCode + ',\'' + entryNo + '\')"><i class="fa-regular fa-circle-xmark"></i></button>'
        });
    });

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header', 'table-body', updatedResponse,
        Button, showButtons, StringFilterColumn, NumericFilterColumn,
        DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,true
    );
}
function PEShowCreatePage() {
    G_PEEditCode = 0;
    PEResetForm();
    $('#peListPage').hide();
    $('#peCreatePage').show();
    $('#peToolbar').show();
    $('#lblPEFormBadge').text('NEW').attr('class', 'tabSec tab active');
    window.scrollTo(0, 0);
}
function PEShowListPage() {
    $('#peCreatePage').hide();
    $('#peToolbar').hide();
    $('#peListPage').show();
    PELoadList();
}
function PEResetForm() {
    G_PEIsBindingEdit = false;
    G_PEEntryNoSave = 0;
    G_PEAdvanceManual = false;
    PESetPartyFieldDisabled(false);
    $('#txtPEEntryNo').val('');
    $('#txtPEDate').datepicker('setDate', new Date());
    $('#ddlPEPartyName').val('').trigger('change');
    $('#txtPEPayMode').val('');
    $('#txtPERefNo').val('');
    $('#txtPEAmount').val('');
    $('#txtPENarration').val('');
    G_PEInvoiceRows = [];
    $('#peInvoiceGridSection').hide();
    $('#tblPEInvoiceFoot').hide();
    $('#txtPEAdvance').val('');
    $('#tblPEInvoiceBody').html(
        '<tr><td colspan="7" class="text-center text-muted py-3">Select a party to load bills.</td></tr>'
    );
}
function PEEditEntry(code) {
    blockUI();
    $.ajax({
        url:  appBaseURL + API_GET_PAYMENT_BY_CODE + '?Code=' + encodeURIComponent(code),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            if (!res) {
                unblockUI();
                PEToastError('Record not found.');
                return;
            }

            var masterRows = [];
            if (res.BillMaster && res.BillMaster.length)               masterRows = res.BillMaster;
            else if (res.PaymentMaster && res.PaymentMaster.length)    masterRows = res.PaymentMaster;
            else if (Array.isArray(res) && res.length)                 masterRows = res;

            if (!masterRows.length) {
                unblockUI();
                PEToastError('Record not found.');
                return;
            }

            var pm = masterRows[0];
            var details = [];
            if (res.BillAdjustmentDetails && res.BillAdjustmentDetails.length) details = res.BillAdjustmentDetails;
            else if (res.PaymentDetails && res.PaymentDetails.length)          details = res.PaymentDetails;

            var listRow = PEGetListRowByCode(code);

            G_PEEditCode = pm.Code || code;
            G_PEIsBindingEdit = true;

            G_PEEntryNoSave = pm.EntryNo != null ? pm.EntryNo : (pm.entryNo != null ? pm.entryNo : 0);
            var entryNoDisplay = (listRow && (listRow['Entry No'] || listRow.EntryNo || listRow.entryNo))
                || (pm.EntryNo && pm.EntryNo !== 0 ? pm.EntryNo : '')
                || (pm.EntryNoStr || pm.entryNoStr || pm['Entry No'] || '');
            $('#txtPEEntryNo').val(entryNoDisplay);

            var payMode = pm.PaymentMode || pm.paymentMode || pm.Payment_Mode || pm.PayMode || '';
            if (!payMode && listRow) {
                payMode = listRow['Payment Mode'] || listRow.PaymentMode || listRow.PayMode || '';
            }
            $('#txtPEDate').datepicker('update', PEFormatApiDate(pm.EntryDate || pm.entryDate || ''));
            $('#ddlPEPartyName').val(pm.AccountMaster_Code || pm.accountMaster_Code || '').trigger('change.select2');
            PESetPartyFieldDisabled(true);
            $('#txtPEPayMode').val(payMode);
            $('#txtPERefNo').val(pm.RefNo || pm.refno || pm.Refno || '');
            $('#txtPEAmount').val(formatAmt(pm.Amount || pm.amount || 0));
            $('#txtPENarration').val(pm.Narration || pm.narration || '');

            $('#peListPage').hide();
            $('#peCreatePage').show();
            $('#peToolbar').show();
            $('#lblPEFormBadge').text('EDIT').attr('class', 'tabSec tab active');
            window.scrollTo(0, 0);

            PERenderEditBillGrid(details, pm.AccountMaster_Code || pm.accountMaster_Code);
            if (!G_PEInvoiceRows.length) {
                PESetAdvanceDisplay(PEGetAdvanceFromMaster(pm));
            }
            PELockAdvanceField();
            unblockUI();
        },
        error: function () {
            unblockUI();
            PEToastError('Failed to load payment entry.');
        }
    });
}

/** On edit: bind bill grid from ShowPaymentEntryByCode BillAdjustmentDetails only (no second API). */
function PERenderEditBillGrid(paymentDetails, accountCode) {
    G_PEIsBindingEdit = false;

    if (!paymentDetails || !paymentDetails.length) {
        G_PEInvoiceRows = [];
        $('#tblPEInvoiceBody').html(
            '<tr><td colspan="7" class="text-center text-muted py-3">' +
            '<i class="fa fa-inbox me-2"></i>No bill allocation found for this entry.</td></tr>'
        );
        $('#peInvoiceGridSection').show();
        $('#tblPEInvoiceFoot').hide();
        return;
    }

    G_PEInvoiceRows = $.map(paymentDetails, function (pd) {
        return {
            BillNo:             pd['Bill No']   || pd.BillNo   || '',
            BillDate:           pd['Bill Date'] || pd.BillDate || '',
            BillAmount:         parseAmountStr(pd.BillAmount || pd['BillAmount'] || 0),
            Deduction:          parseAmountStr(pd.Deduction || pd['Deduction'] || 0),
            AmountAdjusted:     parseAmountStr(pd.AmountAdjusted || pd['AmountAdjusted'] || 0),
            PayableAmount:      PEGetPayableFromRow(pd),
            PaymentAmount:      PEGetPaymentAmtFromRow(pd),
            AdjustmentCode:     pd.Code || pd.code || 0,
            BillMaster_Code:    pd.BillMaster_Code || pd.billMaster_Code || G_PEEditCode || 0,
            AccountMasterCode:  accountCode || pd.AccountMaster_Code || pd.accountMaster_Code || 0,
            InvoiceMaster_Code: pd.InvoiceMaster_Code || pd.invoiceMaster_Code || 0
        };
    });

    $('#peInvoiceGridSection').show();
    PERefreshInvoiceTable();
}
function PESavePaymentEntry() {
    var date      = $('#txtPEDate').val().trim();
    var amount    = parseAmountStr($('#txtPEAmount').val());
    var partyCode = $('#ddlPEPartyName').val();

    var payMode   = ($('#txtPEPayMode').val() || '').trim();
    var refNo     = $('#txtPERefNo').val().trim();
    var narration = $('#txtPENarration').val().trim();

    if (!date) {
        PEToastError('Please select entry date.');
        $('#txtPEDate').focus();
        return;
    }
    if (!partyCode) {
        PEToastError('Please select a party.');
        return;
    }
    if (!payMode) {
        PEToastError('Please select payment mode.');
        return;
    }
    if (!refNo) {
        PEToastError('Please enter Ref No / CH No.');
        $('#txtPERefNo').focus();
        return;
    }
    if (!narration) {
        PEToastError('Please enter narration.');
        $('#txtPENarration').focus();
        return;
    }
    if (amount <= 0) {
        PEToastError('Please enter a valid amount.');
        $('#txtPEAmount').focus();
        return;
    }

    /* Sync any payment-amount inputs that haven't fired blur yet */
    $('.pe-payamt-inp').each(function () {
        var idx = parseInt($(this).data('idx'));
        if (!isNaN(idx) && G_PEInvoiceRows[idx] !== undefined) {
            G_PEInvoiceRows[idx].PaymentAmount = parseAmountStr($(this).val());
        }
    });

    var totalBillPayment = PEGetBillPaymentTotal();
    if (totalBillPayment > amount) {
        PEToastError('Total bill payment (' + formatAmt(totalBillPayment) + ') cannot exceed Amount (' + formatAmt(amount) + ').');
        return;
    }

    if (!G_PEAdvanceManual) {
        var autoAdvance = Math.max(0, amount - totalBillPayment);
        PESetAdvanceDisplay(autoAdvance);
    }
    var advance = parseAmountStr($('#txtPEAdvance').val());
    var grandTotal = totalBillPayment + advance;

    if (totalBillPayment <= 0 && advance <= 0) {
        alert('Please enter a payment amount for at least one bill, or enter an Advance / On account amount.');
        return;
    }
    if (grandTotal > amount) {
        alert('Total payment ' + formatAmt(grandTotal) + ' + Advance exceeds Amount ' + formatAmt(amount) + '.\nPlease adjust the payment amounts.');
        return;
    }

    var entryNo = G_PEEditCode > 0
        ? G_PEEntryNoSave
        : (parseInt($('#txtPEEntryNo').val().trim(), 10) || 0);

    var billAdjustmentDetails = [];
    $.each(G_PEInvoiceRows, function (i, r) {
        if (r.PaymentAmount > 0) {
            billAdjustmentDetails.push({
                code:               r.AdjustmentCode || 0,
                billMaster_Code:    G_PEEditCode || 0,
                invoiceMaster_Code: r.InvoiceMaster_Code || 0,
                paymentAmount:      r.PaymentAmount
            });
        }
    });

    var payload = {
        billMaster: [{
            code:               G_PEEditCode || 0,
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
                PEShowListPage();
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
function PEShowDeleteModal(code, entryNo) {
    G_PEDeleteCode = code;
    $('#lblPEDeleteEntry').text(entryNo || code);
    new bootstrap.Modal(document.getElementById('modalPEDelete')).show();
}

function PEConfirmDelete() {
    if (!G_PEDeleteCode) return;

    blockUI();
    $.ajax({
        url:  appBaseURL + API_DELETE_PAYMENT
            + '?Code=' + encodeURIComponent(G_PEDeleteCode)
            + '&UserMaster_Code=' + encodeURIComponent(UserMaster_Code),
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            unblockUI();
            bootstrap.Modal.getInstance(document.getElementById('modalPEDelete')).hide();
            if (res && (res.Status === 'Y' || res.Status === 1 || res.status === 'Y')) {
                if (typeof toastr !== 'undefined') {
                    toastr.success(res.Msg || res.Message || 'Deleted successfully.');
                }
                PELoadList();
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

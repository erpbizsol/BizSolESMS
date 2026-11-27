var authKeyData;
try { authKeyData = JSON.parse(sessionStorage.getItem('authKey')); } catch (e) { authKeyData = {}; }
if (!authKeyData) authKeyData = {};

const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AAI_API = appBaseURL + '/api/AccountAppIntegration';

const AAI_KEY_COLUMN = 'Code';         

let G_AaiRows = [];                   
let G_AaiSelected = new Set();        

/* ============================== helpers ============================== */
function aaiPad2(n) { return String(n).padStart(2, '0'); }
function aaiTodayDmy() {
    var d = new Date();
    return aaiPad2(d.getDate()) + '-' + aaiPad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function aaiMonthStartDmy() {
    var d = new Date();
    return '01-' + aaiPad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
/** dd-mm-yyyy -> yyyy-mm-dd (API format) */
function aaiDmyToIso(dmy) {
    var p = String(dmy || '').trim().split('-');
    return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : '';
}
function aaiDmyToDate(dmy) {
    var p = String(dmy || '').trim().split('-');
    return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]) : null;
}
function aaiEsc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function aaiAuthHeader(xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); }

/** "UOM Master", "Inventory Master", "Party Master" = master (date lagti nahi). Baaki vouchers = date wale. */
function aaiIsMasterTemplate() {
    var desp = ($('#ddlAaiTemplate option:selected').text() || '').trim();
    return /master$/i.test(desp);
}

/* ============================== filters ============================== */
function aaiInitDatePickers() {
    $('#txtAaiFromDate, #txtAaiToDate').datepicker({
        format: 'dd-mm-yyyy', autoclose: true, todayHighlight: true
    });
    $('#txtAaiFromDate').datepicker('setDate', aaiMonthStartDmy());
    $('#txtAaiToDate').datepicker('setDate', aaiTodayDmy());
}

/** Date filter sabhi templates (master + voucher) me enable rehta hai */
function aaiApplyTemplateState() {
    $('#txtAaiFromDate, #txtAaiToDate').prop('disabled', false);
}

function aaiValidateDates() {
    var from = aaiDmyToDate($('#txtAaiFromDate').val());
    var to = aaiDmyToDate($('#txtAaiToDate').val());
    if (!from) { toastr.error('Please select From Date.'); $('#txtAaiFromDate').focus(); return false; }
    if (!to) { toastr.error('Please select To Date.'); $('#txtAaiToDate').focus(); return false; }
    if (from > to) { toastr.error('From Date cannot be greater than To Date.'); return false; }
    return true;
}

/* ============================== API 1 : template dropdown ============================== */
function aaiLoadTemplates() {
    $.ajax({
        url: `${AAI_API}/GetTallybusyTempletConfigrution`,
        type: 'GET',
        dataType: 'json',
        beforeSend: aaiAuthHeader,
        success: function (response) {
            var opts = '<option value="">Select Template</option>';
            (Array.isArray(response) ? response : []).forEach(function (item) {
                var code = item.Code != null ? item.Code : item.code;
                var desp = item.Desp != null ? item.Desp : item.desp;
                if (desp == null || desp === '') return;
                opts += '<option value="' + aaiEsc(code) + '">' + aaiEsc(desp) + '</option>';
            });
            $('#ddlAaiTemplate').html(opts);
        },
        error: function () {
            toastr.error('Error in api/AccountAppIntegration/GetTallybusyTempletConfigrution');
        }
    });
}

/* ============================== API 2 : grid data ============================== */
function aaiLoadGrid(showMsg) {
    var template = $('#ddlAaiTemplate').val();
    if (!template) {
        aaiClearGrid();
        if (showMsg) toastr.error('Please select Template.');
        return;
    }
    if (!aaiValidateDates()) return;

    var fromDate = aaiDmyToIso($('#txtAaiFromDate').val());
    var toDate = aaiDmyToIso($('#txtAaiToDate').val());

    blockUI();
    $.ajax({
        url: `${AAI_API}/GetTemplateData?Template=${encodeURIComponent(template)}&FromDate=${fromDate}&ToDate=${toDate}`,
        type: 'GET',
        dataType: 'json',
        beforeSend: aaiAuthHeader,
        success: function (response) {
            if (Array.isArray(response) && response.length > 0 && response[0].Status !== 'N') {
                G_AaiRows = response;
                G_AaiSelected.clear();
                $('#aaiTemplateTitle').text($('#ddlAaiTemplate option:selected').text());
                aaiRenderGrid();
                $('#aaiGridCard').show();
            } else {
                aaiClearGrid();
                toastr.error((response && response[0] && response[0].Msg) || 'Record not found...!');
            }
        },
        error: function () {
            aaiClearGrid();
            toastr.error('Error in api/AccountAppIntegration/GetTemplateData');
        },
        complete: function () { unblockUI(); }
    });
}

function aaiClearGrid() {
    G_AaiRows = [];
    G_AaiSelected.clear();
    $('#aaiHead, #aaiBody').empty();
    $('#aaiGridCard').hide();
    aaiUpdateSelectedInfo();
}

/* ============================== render ============================== */
function aaiFormatCell(v) {
    if (v == null) return '';
    // API date (2026-11-24T00:00:00) -> dd-mm-yyyy
    var m = /^(\d{4})-(\d{2})-(\d{2})T00:00:00/.exec(String(v));
    return m ? m[3] + '-' + m[2] + '-' + m[1] : v;
}

function aaiRenderGrid() {
    // backend se jitne columns aaye sab bind honge (koi hide nahi)
    var columns = Object.keys(G_AaiRows[0]);

    var head = '<tr><th class="aai-chk-col"><input type="checkbox" id="chkAaiSelectAll" title="Select All" /></th>';
    columns.forEach(function (c) { head += '<th>' + aaiEsc(c) + '</th>'; });
    head += '</tr>';
    $('#aaiHead').html(head);

    var body = '';
    G_AaiRows.forEach(function (row, idx) {
        var st = String(row.StatusTransfer == null ? '' : row.StatusTransfer).trim().toUpperCase();
        var rowCls = st === 'TRANSFER' ? ' class="aai-status-transfer"'
            : st === 'PENDING' ? ' class="aai-status-pending"' : '';
        body += '<tr data-idx="' + idx + '"' + rowCls + '>'
            + '<td class="aai-chk-col"><input type="checkbox" class="chkAaiRow" value="' + idx + '" title="Select" /></td>';
        columns.forEach(function (c) {
            var v = row[c];
            var cls = (typeof v === 'number') ? ' class="aai-right"' : '';
            body += '<td' + cls + '>' + aaiEsc(aaiFormatCell(v)) + '</td>';
        });
        body += '</tr>';
    });
    $('#aaiBody').html(body);
    aaiUpdateSelectedInfo();
}

/* ============================== selection ============================== */
function aaiUpdateSelectedInfo() {
    var total = G_AaiRows.length;
    var sel = G_AaiSelected.size;
    $('#aaiSelectedInfo').text('Selected : ' + sel + ' / ' + total);
    $('#chkAaiSelectAll').prop('checked', total > 0 && sel === total);
}

function aaiToggleAll(checked) {
    G_AaiSelected.clear();
    if (checked) {
        G_AaiRows.forEach(function (r, i) { G_AaiSelected.add(i); });
    }
    $('#aaiBody .chkAaiRow').prop('checked', checked);
    $('#aaiBody tr').toggleClass('aai-row-selected', checked);
    aaiUpdateSelectedInfo();
}

function aaiToggleRow($chk) {
    var idx = parseInt($chk.val(), 10);
    if ($chk.is(':checked')) G_AaiSelected.add(idx); else G_AaiSelected.delete(idx);
    $chk.closest('tr').toggleClass('aai-row-selected', $chk.is(':checked'));
    aaiUpdateSelectedInfo();
}

/** Selected rows (grid ki poori row data) */
function aaiGetSelectedRows() {
    return G_AaiRows.filter(function (r, i) { return G_AaiSelected.has(i); });
}
/** Selected distinct master Codes - export/send ke liye */
function aaiGetSelectedCodes() {
    var codes = [];
    aaiGetSelectedRows().forEach(function (r) {
        var c = r[AAI_KEY_COLUMN];
        if (c != null && codes.indexOf(c) === -1) codes.push(c);
    });
    return codes;
}

/* ============================== API 3 : send selected to SQL Server ============================== */
function aaiSyncToSql() {
    var template = $('#ddlAaiTemplate').val();
    if (!template) { toastr.error('Please select Template.'); return; }

    var codes = aaiGetSelectedCodes();
    if (codes.length === 0) { toastr.error('Please select at least one record.'); return; }

    if (!aaiValidateDates()) return;

    var payload = {
        Template: template,
        TemplateName: ($('#ddlAaiTemplate option:selected').text() || '').trim(),
        FromDate: aaiDmyToIso($('#txtAaiFromDate').val()),
        ToDate: aaiDmyToIso($('#txtAaiToDate').val()),
        Codes: codes.map(String),
        UserCode: parseInt(authKeyData.UserMaster_Code) || 0
    };

    if (!confirm('Send ' + codes.length + ' record(s) to Application?')) return;

    var synced = false;
    blockUI();
    $.ajax({
        url: `${AAI_API}/SyncToSql`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json',
        beforeSend: aaiAuthHeader,
        success: function (response) {
            var r = Array.isArray(response) ? response[0] : null;
            if (r && r.Status === 'Y') {
                synced = true;
                var ins = Number(r.Inserted || 0), upd = Number(r.Updated || 0), skp = Number(r.Skipped || 0);
                if (ins === 0 && upd === 0 && skp > 0) {
                    toastr.info('Already transferred. ' + skp + ' record(s) are already up to date in SQL Server.');
                } else {
                    toastr.success(r.Msg || 'Synced successfully.');
                }
            } else {
                toastr.error((r && r.Msg) || 'Sync failed.');
            }
        },
        error: function (xhr) {
            var msg = 'Error in api/AccountAppIntegration/SyncToSql';
            try { var j = JSON.parse(xhr.responseText); if (j && j[0] && j[0].Msg) msg = j[0].Msg; } catch (e) { }
            toastr.error(msg);
        },
        complete: function () {
            unblockUI();
            // transfer ke baad grid refresh (StatusTransfer / row color update)
            if (synced) aaiLoadGrid(false);
        }
    });
}

/* ============================== reset ============================== */
function aaiReset() {
    $('#ddlAaiTemplate').val('');
    $('#txtAaiFromDate').datepicker('update', aaiMonthStartDmy());
    $('#txtAaiToDate').datepicker('update', aaiTodayDmy());
    aaiApplyTemplateState();
    aaiClearGrid();
}

/* ============================== init ============================== */
$(document).ready(function () {
    aaiInitDatePickers();
    aaiLoadTemplates();

    // template select hote hi grid bind
    $('#ddlAaiTemplate').on('change', function () {
        aaiApplyTemplateState();
        aaiLoadGrid(false);
    });
    // date badalne par grid refresh
    $('#txtAaiFromDate, #txtAaiToDate').on('changeDate', function () {
        if ($('#ddlAaiTemplate').val()) aaiLoadGrid(false);
    });
    $('#btnAaiShow').on('click', function () { aaiLoadGrid(true); });
    $('#btnAaiReset').on('click', aaiReset);
    $('#btnAaiSync').on('click', aaiSyncToSql);

    // select all / single (dynamic rows ke liye delegated)
    $(document).on('change', '#chkAaiSelectAll', function () { aaiToggleAll($(this).is(':checked')); });
    $(document).on('change', '.chkAaiRow', function () { aaiToggleRow($(this)); });
});

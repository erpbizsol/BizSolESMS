var authKeyData;
try {
    authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
} catch (e) {
    authKeyData = {};
}
if (!authKeyData) authKeyData = {};

const appBaseURL = sessionStorage.getItem('AppBaseURL');
const WT_API = appBaseURL + '/api/WarehouseStockTransfer';

// CheckOptionPermission.js in globals ko use karta hai
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;

var G_ItemConfig;
try { G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig')); } catch (e) { G_ItemConfig = null; }

// ---- entry page state ----
let G_WtCode = 0;            // WarehouseStockTransferMaster.Code (0 = abhi save nahi hua)
let G_WtCompleted = false;
let G_WtLoading = false;     // header fill ke time change events ignore karne ke liye
let G_WtBusy = false;        // scan chal raha ho to dobara scan na ho
let G_WtScanTimer = null;
let G_WtData = [];           // grid rows (API response)
let G_WtListData = [];
/* ============================== small helpers ============================== */
function wtPad2(n) {
    return String(n).padStart(2, '0');
}
function wtTodayDmy() {
    var d = new Date();
    return wtPad2(d.getDate()) + '-' + wtPad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function wtMonthStartDmy() {
    var d = new Date();
    return '01-' + wtPad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
/** dd-mm-yyyy -> yyyy-mm-dd (API format) */
function wtDmyToIso(dmy) {
    var p = String(dmy || '').trim().split('-');
    if (p.length !== 3) return '';
    return p[2] + '-' + p[1] + '-' + p[0];
}
/** API kabhi array [ {Status,Msg} ] deti hai kabhi object - dono handle */
function wtResult(response) {
    return Array.isArray(response) ? (response[0] || {}) : (response || {});
}
function wtJsStr(val) {
    return String(val == null ? '' : val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function wtItemHeader(key) {
    if (G_ItemConfig && G_ItemConfig[0]) {
        var h = key === 'Item Name' ? G_ItemConfig[0].ItemNameHeader : G_ItemConfig[0].ItemCodeHeader;
        if (h) return h;
    }
    return key;
}
function wtAuthHeader(xhr) {
    xhr.setRequestHeader('Auth-Key', authKeyData);
}

function showToast(Msg) {
    let toast = document.getElementById("toast");
    let overlay = document.getElementById("overlay");
    if (!toast || !overlay) {
        toastr.error(Msg);
        return;
    }
    toast.innerText = Msg;
    overlay.style.display = "block";
    toast.style.display = "block";
    let alertSound = new Audio("https://www.fesliyanstudios.com/play-mp3/4387");
    alertSound.play().catch(error => console.log("Audio playback failed:", error));
    setTimeout(() => toast.style.opacity = "1", 10);
    let blinkInterval = setInterval(() => {
        toast.style.visibility = (toast.style.visibility === "hidden") ? "visible" : "hidden";
    }, 3000);
    setTimeout(() => {
        clearInterval(blinkInterval);
        toast.style.visibility = "visible";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    }, 3000);
}

/* ============================== permissions ============================== */
function wtLoadModuleCode() {
    try {
        var modules = JSON.parse(sessionStorage.getItem('UserModuleMaster')) || [];
        var names = ['warehouse stock transfer', 'warehouse transfer', 'warehousestocktransfer'];
        var found = modules.find(function (m) {
            return names.indexOf(String(m.ModuleDesp || '').trim().toLowerCase()) !== -1;
        });
        if (found) UserModuleMaster_Code = found.Code;
    } catch (e) { /* ignore */ }
}
/** Module menu me register nahi hai (code 0) to block nahi karte. */
async function wtCheckPermission(option) {
    if (!UserModuleMaster_Code) return true;
    try {
        const { hasPermission, msg } = await CheckOptionPermission(option, UserMaster_Code, UserModuleMaster_Code);
        if (!hasPermission) toastr.error(msg);
        return hasPermission;
    } catch (e) {
        toastr.error('Unable to check permission.');
        return false;
    }
}

/* ============================== filters / dropdowns ============================== */
function wtInitDatePickers() {
    var common = { format: 'dd-mm-yyyy', autoclose: true, clearBtn: true, todayHighlight: true };
    $('#txtWtFromDate, #txtWtToDate, #txtWtDate').datepicker(common);
    $('#txtWtFromDate').datepicker('setDate', wtMonthStartDmy());
    $('#txtWtToDate').datepicker('setDate', wtTodayDmy());
    $('#txtWtDate').datepicker('setDate', wtTodayDmy());
}

function wtLoadWarehouses() {
    $.ajax({
        url: appBaseURL + '/api/Master/GetWareHouseDropDown',
        type: 'GET',
        beforeSend: wtAuthHeader,
        success: function (response) {
            var list = Array.isArray(response) ? response : [];
            var opts = '';
            list.forEach(function (item) {
                opts += '<option value="' + item.Code + '">' + item.Name + '</option>';
            });
            $('#ddlWtFilterWarehouse').html('<option value="">All warehouses</option>' + opts);
            $('#ddlWtFromWarehouse').html('<option value="">Select</option>' + opts);
            $('#ddlWtToWarehouse').html('<option value="">Select</option>' + opts);
            $('#ddlWtFilterWarehouse, #ddlWtFromWarehouse, #ddlWtToWarehouse').each(function () {
                var $el = $(this);
                if ($el.data('select2')) $el.select2('destroy');
                $el.select2({
                    width: '100%',
                    placeholder: $el.data('placeholder') || 'Select',
                    allowClear: false
                });
            });
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            $('#ddlWtFilterWarehouse, #ddlWtFromWarehouse, #ddlWtToWarehouse').empty();
        }
    });
}

/**
 * From aur To Warehouse same nahi ho sakte.
 * Same select karne par message dikhta hai aur abhi select kiya hua warehouse clear ho jaata hai.
 */
function wtValidateWarehouseSelection(changedId) {
    var fromVal = $('#ddlWtFromWarehouse').val() || '';
    var toVal = $('#ddlWtToWarehouse').val() || '';

    if (fromVal && fromVal === toVal) {
        toastr.error('From Warehouse and To Warehouse cannot be the same!');
        $('#' + changedId).val('').trigger('change.select2');
    }
}

/* ============================== LIST PAGE ============================== */
function wtLoadList(showNotFound) {
    var fromDate = wtDmyToIso($('#txtWtFromDate').val());
    var toDate = wtDmyToIso($('#txtWtToDate').val());
    var warehouseCode = $('#ddlWtFilterWarehouse').val() || 0;

    blockUI();
    $.ajax({
        url: `${WT_API}/GetList?FromDate=${fromDate}&ToDate=${toDate}&WarehouseMaster_Code=${warehouseCode}&UserMaster_Code=${UserMaster_Code}`,
        type: 'GET',
        beforeSend: wtAuthHeader,
        success: function (response) {
            if (Array.isArray(response) && response.length > 0) {
                G_WtListData = response;
                $('#wtGridCard').show();

                const StringFilterColumn = ["Entry No", "From Warehouse", "To Warehouse", "Ref No", "Status", "Created By"];
                const NumericFilterColumn = ["Total Qty"];
                const DateFilterColumn = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code","Total Amount"];
                const ColumnAlignment = {
                    "Total Qty": 'right',
                    "Total Amount": 'right'
                };

                const updatedResponse = response.map(item => {
                    var isCompleted = item["Status"] === 'Completed';
                    // Completed par sirf Print. Pending par Print + Edit + Complete + Delete
                    var printBtn = `<button class="btn btn-info icon-height mb-1" title="Print Preview" onclick="wtOpenPrint('${item.Code}')"><i class="fa-solid fa-print"></i></button>`;
                    var actions = isCompleted
                        ? printBtn
                        : printBtn + `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="wtOpenTransfer('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>`
                        + `<button class="btn btn-success icon-height mb-1" title="Complete" onclick="wtCompleteTransfer('${item.Code}', '${wtJsStr(item["Entry No"])}')"><i class="fa-solid fa-check"></i></button>`
                        + `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="wtDeleteTransfer('${item.Code}', '${wtJsStr(item["Entry No"])}')"><i class="fa-solid fa-trash"></i></button>`;
                    return { ...item, Action: `<div style="white-space:nowrap;display:inline-flex;gap:4px;">${actions}</div>` };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, false, [], StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                G_WtListData = [];
                $('#wtGridCard').hide();
                if (showNotFound) toastr.error("Record not found...!");
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            G_WtListData = [];
            $('#wtGridCard').hide();
            unblockUI();
            toastr.error('Error in api/WarehouseStockTransfer/GetList');
        }
    });
}

/** Action button: pending transfer ko Complete karna */
async function wtCompleteTransfer(code, entryNo) {
    if (!(await wtCheckPermission('Edit'))) return;
    if (!confirm('Are you sure you want to complete Warehouse Transfer Entry No ' + entryNo + ' ?\nAfter completing, it cannot be edited.')) return;

    blockUI();
    $.ajax({
        url: `${WT_API}/Complete`,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ Code: parseInt(code, 10) || 0, UserMaster_Code: UserMaster_Code }),
        beforeSend: wtAuthHeader,
        success: function (response) {
            var res = wtResult(response);
            if (res.Status === 'Y') {
                toastr.success(res.Msg || 'Completed successfully.');
                wtLoadList();
            } else {
                toastr.error(res.Msg || 'Unable to complete.');
            }
        },
        error: function () {
            toastr.error('Error in api/WarehouseStockTransfer/Complete');
        },
        complete: function () {
            unblockUI();
        }
    });
}

/** Action button: pending transfer delete karna */
async function wtDeleteTransfer(code, entryNo) {
    if (!(await wtCheckPermission('Delete'))) return;
    if (!confirm('Are you sure you want to delete Warehouse Transfer Entry No ' + entryNo + ' ?')) return;

    blockUI();
    $.ajax({
        url: `${WT_API}/Delete`,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ Code: parseInt(code, 10) || 0, UserMaster_Code: UserMaster_Code }),
        beforeSend: wtAuthHeader,
        success: function (response) {
            var res = wtResult(response);
            if (res.Status === 'Y') {
                toastr.success(res.Msg || 'Deleted successfully.');
                wtLoadList();
            } else {
                toastr.error(res.Msg || 'Unable to delete.');
            }
        },
        error: function () {
            toastr.error('Error in api/WarehouseStockTransfer/Delete');
        },
        complete: function () {
            unblockUI();
        }
    });
}

/* ============================== ENTRY PAGE ============================== */
/** Header ki state (disable/enable, buttons, badge) G_WtCode / G_WtCompleted ke hisaab se */
function wtApplyState() {
    var hasCode = G_WtCode > 0;

    // Warehouses sirf pehli scan se pehle badal sakte hain
    $('#ddlWtFromWarehouse, #ddlWtToWarehouse').prop('disabled', hasCode);
    $('#txtWtDate, #txtWtRefNo').prop('disabled', G_WtCompleted);
    $('#txtWtScanProduct').prop('disabled', G_WtCompleted);
    $('#btnWtPrint').toggleClass('d-none', !hasCode);

    var $badge = $('#wtStatusBadge');
    if (!hasCode) {
        $badge.addClass('d-none');
    } else if (G_WtCompleted) {
        $badge.removeClass('d-none bg-warning text-dark').addClass('bg-success text-white').text('Completed');
    } else {
        $badge.removeClass('d-none bg-success text-white').addClass('bg-warning text-dark').text('Pending');
    }
}

function wtResetEntry() {
    G_WtCode = 0;
    G_WtCompleted = false;
    G_WtData = [];
    G_WtLoading = true;
    $('#hfWtCode').val(0);
    $('#txtWtEntryNo').val('');
    $('#txtWtDate').datepicker('update', wtTodayDmy());
    $('#ddlWtFromWarehouse, #ddlWtToWarehouse').val('').trigger('change.select2');
    $('#txtWtRefNo').val('');
    $('#txtWtScanProduct').val('');
    $('#wtDetailCard').hide();
    $('#WtTable-Header, #WtTable-Body').empty();
    $('#wtTotalItems, #wtTotalQty').text('0');
    G_WtLoading = false;
    wtApplyState();
}

async function wtShowEntryPage() {
    if (!(await wtCheckPermission('New'))) return;
    wtResetEntry();
    $('#wtListPage').addClass('d-none');
    $('#wtEntryPage').removeClass('d-none');
    $('#txtWtScanProduct').trigger('focus');
}

function wtShowListPage() {
    $('#wtEntryPage').addClass('d-none');
    $('#wtListPage').removeClass('d-none');
    wtLoadList();
}

/** Pending transfer edit karna (scan allowed) */
async function wtOpenTransfer(code) {
    if (!(await wtCheckPermission('Edit'))) return;
    wtResetEntry();
    G_WtCode = parseInt(code, 10) || 0;
    $('#wtListPage').addClass('d-none');
    $('#wtEntryPage').removeClass('d-none');
    wtLoadDetails(false);
}

function wtFillHeader(master) {
    G_WtLoading = true;
    G_WtCode = parseInt(master.Code, 10) || 0;
    G_WtCompleted = String(master.Completed || 'N').toUpperCase() === 'Y';
    $('#hfWtCode').val(G_WtCode);
    $('#txtWtEntryNo').val(master.EntryNo || '');
    $('#txtWtDate').datepicker('update', master.EntryDate || wtTodayDmy());
    $('#ddlWtFromWarehouse').val(String(master.FromWarehouseMaster_Code || '')).trigger('change.select2');
    $('#ddlWtToWarehouse').val(String(master.ToWarehouseMaster_Code || '')).trigger('change.select2');
    $('#txtWtRefNo').val(master.RefNo || '');
    G_WtLoading = false;
    wtApplyState();
}

/** Header + scanned items grid reload */
function wtLoadDetails(highlightFirst) {
    if (!G_WtCode) {
        $('#wtDetailCard').hide();
        return;
    }
    $.ajax({
        url: `${WT_API}/GetDetails?Code=${G_WtCode}&UserMaster_Code=${UserMaster_Code}`,
        type: 'GET',
        dataType: 'json',
        beforeSend: wtAuthHeader,
        success: function (response) {
            if (!response || !response.Master || response.Master.length === 0) {
                toastr.error("Record not found...!");
                $('#wtDetailCard').hide();
                return;
            }
            wtFillHeader(response.Master[0]);
            wtBindDetailGrid(response.Detail || [], highlightFirst);
        },
        error: function () {
            toastr.error("Record not found...!");
            $('#wtDetailCard').hide();
        }
    });
}

function wtBindDetailGrid(rows, highlightFirst) {
    G_WtData = Array.isArray(rows) ? rows : [];

    var totalQty = 0;
    G_WtData.forEach(function (r) { totalQty += parseFloat(r["Scan Qty"]) || 0; });
    $('#wtTotalItems').text(G_WtData.length);
    $('#wtTotalQty').text(totalQty);

    if (G_WtData.length === 0) {
        $('#wtDetailCard').hide();
        return;
    }
    $('#wtDetailCard').show();

    const itemCodeHeader = wtItemHeader('Item Code');
    const itemNameHeader = wtItemHeader('Item Name');

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const StringdoubleFilterColumn = [itemCodeHeader, itemNameHeader];
    const hiddenColumns = ["Code"];
    const ColumnAlignment = {
        "Scan Qty": "right;width:70px;",
        "MRP": "right;width:90px;",
        "Amount": "right;width:90px;"
    };

    const updatedResponse = G_WtData.map(item => {
        const row = {};
        for (const key in item) {
            if (key === 'Item Code') row[itemCodeHeader] = item[key];
            else if (key === 'Item Name') row[itemNameHeader] = item[key];
            else row[key] = item[key];
        }
        return row;
    });

    BizsolCustomFilterGrid.CreateDataTable("WtTable-Header", "WtTable-Body", updatedResponse, false, [], StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

    if (highlightFirst) {
        $('#WtTable-Body tr:first').addClass('table-success');
    }
}

/* ---------- header validation (scan se pehle) ---------- */
function wtValidateHeader() {
    if (G_WtCode > 0) return true;

    if (!$('#txtWtDate').val()) {
        toastr.error('Please select entry date.');
        $('#txtWtDate').focus();
        return false;
    }
    var fromVal = $('#ddlWtFromWarehouse').val() || '';
    var toVal = $('#ddlWtToWarehouse').val() || '';
    if (!fromVal) {
        toastr.error('Please select From Warehouse.');
        $('#ddlWtFromWarehouse').select2('open');
        return false;
    }
    if (!toVal) {
        toastr.error('Please select To Warehouse.');
        $('#ddlWtToWarehouse').select2('open');
        return false;
    }
    if (fromVal === toVal) {
        toastr.error('From Warehouse and To Warehouse cannot be the same!');
        return false;
    }
    return true;
}

function wtHeaderPayload() {
    return {
        Code: G_WtCode,
        UserMaster_Code: UserMaster_Code,
        EntryDate: wtDmyToIso($('#txtWtDate').val()),
        FromWarehouseMaster_Code: parseInt($('#ddlWtFromWarehouse').val(), 10) || 0,
        ToWarehouseMaster_Code: parseInt($('#ddlWtToWarehouse').val(), 10) || 0,
        RefNo: ($('#txtWtRefNo').val() || '').trim()
    };
}

/** Ref No / Date change -> existing transfer ka header update */
function wtUpdateHeader() {
    if (G_WtLoading || G_WtCode <= 0 || G_WtCompleted) return;
    var payload = {
        Code: G_WtCode,
        UserMaster_Code: UserMaster_Code,
        EntryDate: wtDmyToIso($('#txtWtDate').val()),
        RefNo: ($('#txtWtRefNo').val() || '').trim()
    };
    $.ajax({
        url: `${WT_API}/UpdateHeader`,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: wtAuthHeader,
        success: function (response) {
            var res = wtResult(response);
            if (res.Status !== 'Y') {
                toastr.error(res.Msg || 'Unable to update.');
                // duplicate Ref No etc. - purani saved value wapas dikhao
                wtLoadDetails(false);
            }
        },
        error: function () {
            toastr.error('Error in api/WarehouseStockTransfer/UpdateHeader');
        }
    });
}

/* ---------- SCAN ---------- */
function wtScan() {
    var scanNo = ($('#txtWtScanProduct').val() || '').trim();
    if (scanNo === '' || G_WtBusy) return;

    if (G_WtCompleted) {
        toastr.error('This transfer is already completed.');
        $('#txtWtScanProduct').val('');
        return;
    }
    if (!wtValidateHeader()) {
        $('#txtWtScanProduct').val('');
        return;
    }

    var payload = wtHeaderPayload();
    payload.ScanNo = scanNo;

    G_WtBusy = true;
    blockUI();
    $.ajax({
        url: `${WT_API}/ScanItem`,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: wtAuthHeader,
        success: function (response) {
            var res = wtResult(response);
            var masterCode = parseInt(res.WarehouseStockTransferMaster_Code, 10) || 0;
            if (masterCode > 0 && G_WtCode === 0) {
                G_WtCode = masterCode;
                $('#hfWtCode').val(G_WtCode);
                wtApplyState();
            }
            if (res.EntryNo) $('#txtWtEntryNo').val(res.EntryNo);

            if (res.Status === 'Y') {
                var voice = document.getElementById('wtSuccessVoice');
                if (voice && voice.play) voice.play().catch(function () { });
                wtLoadDetails(true);
            } else {
                showToast(res.Msg || 'INVALID SCAN NO !');
            }
        },
        error: function () {
            showToast('INVALID SCAN NO !');
        },
        complete: function () {
            G_WtBusy = false;
            unblockUI();
            $('#txtWtScanProduct').val('').trigger('focus');
        }
    });
}

/* ============================== PRINT PREVIEW ============================== */
function wtEsc(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/** blank values hata kar separator se join (e.g. "Line1, Line2") */
function wtJoin(parts, sep) {
    return parts.map(function (p) { return String(p == null ? '' : p).trim(); })
        .filter(function (p) { return p !== '' && p !== '0'; }).join(sep);   // blank / 0 (pin) skip
}
function wtFmtQty(n) {
    var v = parseFloat(n) || 0;
    return (Math.round(v * 1000) / 1000).toString();
}
function wtFmtMoney(n) {
    return (parseFloat(n) || 0).toFixed(2);
}

/** Print HTML (image wala format). Preview iframe aur print dono isi HTML ko use karte hain. */
function wtBuildPrintHtml(h, items) {
    var company = wtEsc(h.CompanyName);

    var coAddr = wtJoin([h.CompanyAddressLine1, h.CompanyAddressLine2], ', ');
    var coCity = wtJoin([h.CompanyCity, h.CompanyNation, h.CompanyPin], ', ');
    // Label bold, value normal
    var coContactParts = [];
    if (h.CompanyEmail) coContactParts.push('<b>Mail:</b> ' + wtEsc(h.CompanyEmail));
    if (h.CompanyMobile) coContactParts.push('<b>Mobile No:</b> ' + wtEsc(h.CompanyMobile));
    var coContact = coContactParts.join(' | ');
    var coGst = h.CompanyGSTNo ? '<b>GST No.:</b> ' + wtEsc(h.CompanyGSTNo) : '';

    function whBlock(prefix) {
        var addr = wtJoin([h[prefix + 'AddressLine1'], h[prefix + 'AddressLine2']], ', ');
        var city = wtJoin([h[prefix + 'City'], h[prefix + 'State'], h[prefix + 'Pin']], ', ');
        return '<div class="wh-name">' + wtEsc(h[prefix + 'DisplayName']) + '</div>'
            + '<div>' + (wtEsc(addr) || '&nbsp;') + '</div>'
            + '<div>' + (wtEsc(city) || '&nbsp;') + '</div>';
    }

    // Items table aur Total table ke columns same width ke liye
    var wtColGroup = '<colgroup><col style="width:45px"><col style="width:110px"><col>'
        + '<col style="width:80px"><col style="width:60px"><col style="width:80px"><col style="width:90px"></colgroup>';

    var totalQty = 0, totalValue = 0, rows = '';
    (items || []).forEach(function (it, i) {
        totalQty += parseFloat(it.Qty) || 0;
        totalValue += parseFloat(it.Value) || 0;
        rows += '<tr>'
            + '<td class="tc">' + (it.SNo != null ? it.SNo : (i + 1)) + '</td>'
            + '<td>' + wtEsc(it.ItemCode) + '</td>'
            + '<td>' + wtEsc(it.ItemName) + '</td>'
            + '<td>' + wtEsc(it.HSNCode) + '</td>'
            + '<td class="tr">' + wtFmtQty(it.Qty) + '</td>'
            + '<td class="tr">' + wtFmtMoney(it.Rate) + '</td>'
            + '<td class="tr">' + wtFmtMoney(it.Value) + '</td>'
            + '</tr>';
    });

    var css = ''
        + '@page{size:A4;margin:8mm}'
        + '*{box-sizing:border-box}'
        // body fixed A4 width (794px) - preview me parent isko modal ki width ke hisaab se zoom karta hai
        // Preview : A4 sheet = 210mm x 297mm (794 x 1123 px), 8mm margin (30px), grey background + shadow
        + 'html{background:#d9dce1}'
        + 'body{font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;margin:12px auto;padding:30px;background:#fff;'
        + 'width:794px;min-height:1123px;box-shadow:0 0 6px rgba(0,0,0,.35)}'
        // Print : real A4 page, @page margin ke andar ek hi page
        + '@media print{html{background:#fff}body{width:auto;min-height:0;margin:0;padding:0;box-shadow:none;zoom:1!important}}'
        + '.box{border:1px solid #000;display:flex;flex-direction:column;min-height:1063px}'
        + '@media print{.box{min-height:1045px}}'
        + '.sec{padding:4px 8px}'
        + '.hdr{text-align:center;border-bottom:1px solid #000}'
        + '.hdr div{line-height:1.5}'
        + '.co-name{font-size:20px;font-weight:bold}'
        + '.title{text-align:center;font-weight:bold;font-size:16px;border-bottom:1px solid #000;padding:4px 8px}'
        + '.entry{border-bottom:1px solid #000}'
        + '.entry div{line-height:1.6}'
        + '.lbl{display:inline-block;min-width:80px;font-weight:bold}'
        + '.wh{display:flex;border-bottom:1px solid #000}'
        + '.wh>div{flex:1;padding:4px 8px;line-height:1.6}'
        + '.wh-title{font-weight:bold}'
        + '.wh-name{font-weight:bold}'
        + '.items{flex:1;display:flex;flex-direction:column}'
        + 'table.it{width:100%;border-collapse:collapse}'
        + 'table.it th{text-align:left;font-weight:bold;padding:4px 6px;border-bottom:1px solid #000;border-top:1px solid #000}'
        + 'table.it td{padding:3px 6px;vertical-align:top}'
        + '.tc{text-align:center!important}.tr{text-align:right!important}'
        + 'table.it{table-layout:fixed}'
        + '.items-body{flex:1}'
        + 'table.it.tot td{border-top:1px solid #000;font-weight:bold}'
        + '.ft{border-top:1px solid #000;margin-top:auto}'
        + '.ft-top{display:flex;justify-content:flex-end;padding:30px 8px 18px}'
        + '.ft-bot{display:flex;justify-content:space-between;padding:4px 8px 6px}'
        + '.ft-bot span{display:inline-block;min-width:120px}'
        + '.ft-co{text-align:right;font-weight:bold}'
        + '.ft-sign{text-align:right;min-width:200px}';

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Item Godown Transfer</title>'
        + '<style>' + css + '</style></head><body><div class="box">'

        // ---- company header
        + '<div class="sec hdr">'
        + '<div class="co-name">' + (company || '&nbsp;') + '</div>'
        + '<div>' + (wtEsc(coAddr) || '&nbsp;') + '</div>'
        + '<div>' + (wtEsc(coCity) || '&nbsp;') + '</div>'
        + '<div>' + (coContact || '&nbsp;') + '</div>'
        + '<div>' + (coGst || '&nbsp;') + '</div>'
        + '</div>'

        // ---- title
        + '<div class="title">Item Godown Transfer</div>'

        // ---- entry details
        + '<div class="sec entry">'
        + '<div><span class="lbl">Entry No.</span>: ' + wtEsc(h.EntryNo) + '</div>'
        + '<div><span class="lbl">Entry Date</span>: ' + wtEsc(h.EntryDate) + '</div>'
        + '<div><span class="lbl">Ref No.</span>: ' + wtEsc(h.RefNo) + '</div>'
        + '</div>'

        // ---- from / to warehouse
        + '<div class="wh">'
        + '<div><div class="wh-title">From Warehouse:</div>' + whBlock('From') + '</div>'
        + '<div><div class="wh-title">To Warehouse:</div>' + whBlock('To') + '</div>'
        + '</div>'

        // ---- items
        + '<div class="items"><div class="items-body"><table class="it">'
        + wtColGroup
        + '<thead><tr>'
        + '<th class="tc" style="width:45px">S.No.</th>'
        + '<th style="width:110px">Item Code</th>'
        + '<th>Item Name</th>'
        + '<th style="width:80px">HSN Code</th>'
        + '<th class="tr" style="width:60px">Qty</th>'
        + '<th class="tr" style="width:80px">Rate</th>'
        + '<th class="tr" style="width:90px">Value</th>'
        + '</tr></thead>'
        + '<tbody>' + rows + '</tbody>'
        + '</table></div>'

        // ---- total : items ke niche, ek line draw karke
        + '<table class="it tot">'
        + wtColGroup
        + '<tr>'
        + '<td colspan="4" class="tr">Total</td>'
        + '<td class="tr">' + wtFmtQty(totalQty) + '</td>'
        + '<td></td>'
        + '<td class="tr">' + wtFmtMoney(totalValue) + '</td>'
        + '</tr></table>'
        + '</div>'

        // ---- footer
        + '<div class="ft">'
        + '<div class="ft-top"><div class="ft-co">For ' + company + '</div></div>'
        + '<div class="ft-bot">'
        + '<div><span>Checked By</span><span>Verified By</span></div>'
        + '<div class="ft-sign">Authorized Signatory</div>'
        + '</div></div>'

        + '</div></body></html>';
    return html;
}

/** List / entry page se Print Preview kholna */
async function wtOpenPrint(code) {
    var transferCode = parseInt(code, 10) || 0;
    if (transferCode <= 0) {
        toastr.error('Please save the transfer first.');
        return;
    }
    if (!(await wtCheckPermission('View'))) return;

    blockUI();
    $.ajax({
        url: `${WT_API}/GetPrintData?Code=${transferCode}&UserMaster_Code=${UserMaster_Code}`,
        type: 'GET',
        dataType: 'json',
        beforeSend: wtAuthHeader,
        success: function (response) {
            var header = (response && response.Header && response.Header[0]) || null;
            var items = (response && response.Items) || [];
            if (!header) {
                toastr.error('Record not found...!');
                return;
            }
            if (items.length === 0) {
                toastr.error('No item scanned in this transfer, nothing to print.');
                return;
            }
            var iframe = document.getElementById('wtPrintFrame');
            iframe.srcdoc = wtBuildPrintHtml(header, items);

            var modalEl = document.getElementById('modalWtPrint');
            if (modalEl.parentElement !== document.body) document.body.appendChild(modalEl);
            (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).show();
        },
        error: function () {
            toastr.error('Error in api/WarehouseStockTransfer/GetPrintData');
        },
        complete: function () {
            unblockUI();
        }
    });
}

/** Preview page (A4 = 810px) ko modal/iframe ki width me fit karna (bada + scroll nahi) */
function wtFitPrintPreview() {
    var iframe = document.getElementById('wtPrintFrame');
    if (!iframe) return;
    var doc = iframe.contentDocument;
    if (!doc || !doc.body) return;
    var w = iframe.clientWidth;
    if (!w) return;
    var scale = Math.min(Math.max((w - 40) / 794, 0.4), 1.5);   // 794px = A4 width, 40px = scrollbar + side gap
    doc.body.style.zoom = scale;
}

function wtPrintNow() {
    var iframe = document.getElementById('wtPrintFrame');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentDocument.body.style.zoom = 1;     // print par zoom nahi chahiye
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    wtFitPrintPreview();
}

/* ============================== page init ============================== */
$(document).ready(function () {
    $('#ERPHeading').text('Warehouse Transfer');

    wtLoadModuleCode();
    wtInitDatePickers();
    wtLoadWarehouses();
    wtApplyState();

    $('#ddlWtFromWarehouse, #ddlWtToWarehouse').on('change', function () {
        if (G_WtLoading) return;
        wtValidateWarehouseSelection(this.id);
    });

    // Scan Product: default me mobile keyboard band (scanner use), "Show Keyboard" tick karne par khulega
    $('#txtWtScanProduct').on('focus', function () {
        var inputElement = this;
        var isManual = $('#txtIsManual').is(':checked');
        setTimeout(function () {
            inputElement.setAttribute('inputmode', isManual ? '' : 'none');
        }, 2);
    });
    $('#txtWtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    $('#txtIsManual').on('change', function () {
        $('#txtWtScanProduct').trigger('blur').trigger('focus');
    });

    // Scanner: input aate hi (thoda ruk kar) scan. Keyboard mode me sirf Enter se scan.
    $('#txtWtScanProduct').on('input', function () {
        clearTimeout(G_WtScanTimer);
        if ($('#txtIsManual').is(':checked')) return;
        G_WtScanTimer = setTimeout(wtScan, 250);
    });
    $('#txtWtScanProduct').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(G_WtScanTimer);
            wtScan();
        }
    });

    // Header edit (existing transfer)
    $('#txtWtRefNo').on('blur', wtUpdateHeader);
    $('#txtWtDate').on('changeDate', wtUpdateHeader);

    $('#btnWtShow').on('click', function () { wtLoadList(true); });

    $('#btnWtReset').on('click', function () {
        $('#ddlWtFilterWarehouse').val('').trigger('change');
        $('#txtWtFromDate').datepicker('update', wtMonthStartDmy());
        $('#txtWtToDate').datepicker('update', wtTodayDmy());
        wtLoadList(true);
    });

    $('#btnWtCreateNew').on('click', wtShowEntryPage);
    $('#btnWtBack').on('click', wtShowListPage);
    $('#btnWtPrint').on('click', function () { wtOpenPrint(G_WtCode); });
    $('#btnWtPrintNow').on('click', wtPrintNow);
    $('#wtPrintFrame').on('load', wtFitPrintPreview);
    $('#modalWtPrint').on('shown.bs.modal', wtFitPrintPreview);
    $(window).on('resize', wtFitPrintPreview);
    wtLoadList(false);
});

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;

function authKeyHeader() {
    return sessionStorage.getItem('authKey') || '';
}
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let G_PriceListData = [];
let ItemDetail = [];
let lastValidEffectiveDate = '';
let G_SystemCurrentDate = '';
let effectiveDateLoadSeq = 0;
function isPriceListNewEntryMode() {
    const tab = ($("#tab1").text() || '').trim();
    return tab === 'NEW' || tab === 'IMPORT';
}

function isPriceListImportMode() {
    return ($("#tab1").text() || '').trim() === 'IMPORT';
}
function resolveItemMasterCodeForSaveRow($row) {
    let code = parseInt($row.find(".hfItemMasterCode").val(), 10) || 0;
    if (code > 0) {
        return code;
    }
    const itemCode = ($row.find(".txtItemCode").val() || '').trim();
    const barCode = ($row.find(".txtItemBarCode").val() || '').trim();
    if (itemCode) {
        const upper = itemCode.toUpperCase();
        const item = ItemDetail.find(function (entry) {
            return String(entry.ItemCode || '').trim().toUpperCase() === upper;
        });
        if (item) {
            return parseInt(item.Code ?? item.code, 10) || 0;
        }
    }
    if (barCode) {
        const item = ItemDetail.find(function (entry) {
            return String(entry.ItemBarCode || '').trim() === barCode;
        });
        if (item) {
            return parseInt(item.Code ?? item.code, 10) || 0;
        }
    }
    return 0;
}

function parseAppDate(str) {
    if (!str || typeof str !== 'string') return null;
    str = str.trim();
    let m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    m = str.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})$/i);
    if (m) {
        const d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

function formatDdMmYyyy(date) {
    const d = date.getDate();
    const mo = date.getMonth() + 1;
    const y = date.getFullYear();
    return (d < 10 ? '0' : '') + d + '/' + (mo < 10 ? '0' : '') + mo + '/' + y;
}

function getMinMaxEffectiveDates() {
    let min = null;
    let max = null;
    G_PriceListData.forEach(function (item) {
        const dt = parseAppDate(String(pickField(item, 'EffectiveDate', 'effectiveDate')));
        if (!dt) return;
        if (!min || dt.getTime() < min.getTime()) min = dt;
        if (!max || dt.getTime() > max.getTime()) max = dt;
    });
    return { min: min, max: max };
}
function getMaxEffectiveDateKey() {
    const range = getMinMaxEffectiveDates();
    return range.max ? formatDdMmYyyy(range.max) : '';
}

function isLatestEffectiveDateRow(item) {
    const maxKey = getMaxEffectiveDateKey();
    if (!maxKey) return true;
    const dt = parseAppDate(String(pickField(item, 'EffectiveDate', 'effectiveDate')));
    return !!(dt && formatDdMmYyyy(dt) === maxKey);
}

function getPriceListRowByCode(code) {
    return G_PriceListData.find(function (item) {
        return String(pickField(item, 'Code', 'code')) === String(code);
    });
}

function getSystemCurrentDateForCompare() {
    return parseAppDate(G_SystemCurrentDate) || parseAppDate($("#txtEntryDate").val());
}

function effectiveDateKeyExistsInMasterList(key) {
    if (!key || !G_PriceListData || !G_PriceListData.length) {
        return false;
    }
    return G_PriceListData.some(function (item) {
        const dt = parseAppDate(String(pickField(item, 'EffectiveDate', 'effectiveDate')));
        if (!dt) {
            return false;
        }
        return formatDdMmYyyy(dt) === key;
    });
}
function getDefaultEffectiveDateForImport() {
    const maxKey = getMaxEffectiveDateKey();
    const today = parseAppDate(G_SystemCurrentDate);
    if (!maxKey) {
        return G_SystemCurrentDate || '';
    }
    const maxDt = parseAppDate(maxKey);
    if (!maxDt) {
        return maxKey;
    }
    const nextDay = new Date(maxDt.getFullYear(), maxDt.getMonth(), maxDt.getDate() + 1);
    if (!today) {
        return formatDdMmYyyy(nextDay);
    }
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (nextDay.getTime() < todayStart.getTime()) {
        return formatDdMmYyyy(todayStart);
    }
    return formatDdMmYyyy(nextDay);
}

function isEffectiveDateAllowedForImport(selectedStr) {
    const selected = parseAppDate(selectedStr);
    if (!selected) {
        return false;
    }
    const selStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    const key = formatDdMmYyyy(selStart);
    const today = getSystemCurrentDateForCompare();
    const range = getMinMaxEffectiveDates();

    if (effectiveDateKeyExistsInMasterList(key)) {
        return false;
    }

    if (!range.max) {
        if (!today) {
            return true;
        }
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return selStart.getTime() >= todayStart.getTime();
    }

    const minStart = new Date(range.min.getFullYear(), range.min.getMonth(), range.min.getDate());
    const maxStart = new Date(range.max.getFullYear(), range.max.getMonth(), range.max.getDate());

    if (selStart.getTime() > maxStart.getTime()) {
        if (!today) {
            return true;
        }
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return selStart.getTime() >= todayStart.getTime();
    }
    if (selStart.getTime() > minStart.getTime() && selStart.getTime() < maxStart.getTime()) {
        return false;
    }
    return false;
}

function isEffectiveDateAllowedForNew(selectedStr) {
    const selected = parseAppDate(selectedStr);
    if (!selected) return false;
    const selStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    const key = formatDdMmYyyy(selStart);
    const today = getSystemCurrentDateForCompare();
    const range = getMinMaxEffectiveDates();

    if (!range.max) {
        if (!today) return true;
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return selStart.getTime() >= todayStart.getTime();
    }

    const maxKey = formatDdMmYyyy(range.max);
    const minStart = new Date(range.min.getFullYear(), range.min.getMonth(), range.min.getDate());
    const maxStart = new Date(range.max.getFullYear(), range.max.getMonth(), range.max.getDate());

    if (key === maxKey) {
        return true;
    }
    if (selStart.getTime() > maxStart.getTime()) {
        if (!today) return true;
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return selStart.getTime() >= todayStart.getTime();
    }
    if (selStart.getTime() > minStart.getTime() && selStart.getTime() < maxStart.getTime()) {
        return false;
    }
    return false;
}

function isEffectiveDateAllowedForEntry(selectedStr) {
    if (isPriceListImportMode()) {
        return isEffectiveDateAllowedForImport(selectedStr);
    }
    return isEffectiveDateAllowedForNew(selectedStr);
}

function isEffectiveDateDaySelectable(date) {
    if (!isPriceListNewEntryMode()) {
        return true;
    }
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return isEffectiveDateAllowedForEntry(formatDdMmYyyy(day));
}

function ensureEffectiveDatePickerNavOpen() {
    const dp = $('#txtEffectiveDate').data('datepicker');
    if (!dp) {
        return;
    }
    dp.o.startDate = -Infinity;
    dp.o.endDate = Infinity;
    if (dp._o) {
        dp._o.startDate = -Infinity;
        dp._o.endDate = Infinity;
    }
    if (typeof dp.updateNavArrows === 'function') {
        dp.updateNavArrows();
    }
}

function refreshEffectiveDatePickerDays() {
    const dp = $('#txtEffectiveDate').data('datepicker');
    if (!dp || typeof dp.fill !== 'function') {
        return;
    }
    const pickerOpen = dp.picker && dp.picker.is(':visible');
    const preservedView = pickerOpen && dp.viewDate ? new Date(dp.viewDate.getTime()) : null;
    ensureEffectiveDatePickerNavOpen();
    if (preservedView) {
        dp.viewDate = preservedView;
    }
    dp.fill();
}

function resetNewFormLinesOnly() {
    $("#hfCode").val("0");
    $("#txtEntryNo").val("");
    $("#PriceListData").empty();
    addNewRow();
}

function effectiveDateBeforeShowDay(date) {
    if (isEffectiveDateDaySelectable(date)) {
        return [true, ''];
    }
    return [false, 'disabled', 'Effective Date not allowed'];
}

$(document).ready(function () {
    DatePicker();
    $("#ERPHeading").text("Price List Master");
    GetItemDetails();
    ShowPriceListMasterList('Load');
    GetModuleMasterCode();
    $("#btnAddNewRow").click(function () {
        addNewRow();
    });
    $(document).on('click', '.deleteRow', function () {
        $(this).closest('tr').remove();
        refreshPriceListSerialNumbers();
        if ($('#PriceListData tr').length === 0) {
            addNewRow();
        }
    });
    $("#filePriceListPdfImport").on('change', function () {
        const file = this.files && this.files[0];
        if (file) {
            uploadPriceListPdfExtract(file);
        }
    });
});

function GetModuleMasterCode() {
    try {
        var raw = sessionStorage.getItem('UserModuleMaster');
        if (!raw) return;
        var Data = JSON.parse(raw);
        if (!Array.isArray(Data)) return;
        const result = Data.find(item => item.ModuleDesp === "Price List Master");
        if (result) {
            UserModuleMaster_Code = result.Code;
        }
    } catch (e) {
        console.error("GetModuleMasterCode:", e);
    }
}

function bindListGrid(data, showNoRecords) {
    const StringFilterColumn = ["EntryNo"];
    const NumericFilterColumn = [];
    const DateFilterColumn = ["EntryDate", "EffectiveDate"];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ["Code"];
    const ColumnAlignment = {};
    if (showNoRecords) {
        $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
        return;
    }
    const updatedResponse = data.map(item => {
        const code = pickField(item, 'Code', 'code');
        const entryNo = pickField(item, 'EntryNo', 'entryNo');
        const canModify = isLatestEffectiveDateRow(item);
        const actionHtml = canModify
            ? `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="Edit('${code}')"><i class="fa-solid fa-pencil"></i></button>
            <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${code}','${entryNo}')"><i class="fa-regular fa-circle-xmark"></i></button>
            <button class="btn btn-primary icon-height mb-1" title="View" onclick="View('${code}')"><i class="fa-solid fa fa-eye"></i></button>`
            : `<button class="btn btn-secondary icon-height mb-1" title="Only latest Effective Date can be edited" disabled><i class="fa-solid fa-pencil"></i></button>
            <button class="btn btn-secondary icon-height mb-1" title="Only latest Effective Date can be deleted" disabled><i class="fa-solid fa-circle-xmark"></i></button>
            <button class="btn btn-primary icon-height mb-1" title="View" onclick="View('${code}')"><i class="fa-solid fa fa-eye"></i></button>`;
        return {
            ...item,
            Action: actionHtml
        };
    });
    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
}

function ShowPriceListMasterList(type) {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/PriceListMaster/ShowPriceListMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            unblockUI();
            if (response.length > 0) {
                G_PriceListData = response;
                $("#txtListTable").show();
                bindListGrid(response, false);
                refreshEffectiveDatePickerDays();
            } else {
                $("#txtListTable").hide();
                if (type !== 'Load') {
                    toastr.error("Record not found...!");
                }
            }
        },
        error: function () {
            unblockUI();
        }
    });
}

function togglePriceListImportUi(tabLabel) {
    const isImport = tabLabel === 'IMPORT';
    $("#divPriceListImportFile").toggle(isImport);
    setPriceListImportGridMode(isImport);
    if (!isImport) {
        $("#filePriceListPdfImport").val('');
    }
}

function setPriceListImportGridMode(isImport) {
    $("#tblPriceListDetail").toggleClass("price-list-import-grid", !!isImport);
    if (!isImport) {
        $("#PriceListData tr").removeClass("pl-import-row");
    }
}

function refreshPriceListSerialNumbers() {
    if (!$("#tblPriceListDetail").hasClass("price-list-import-grid")) {
        return;
    }
    $("#PriceListData tr").each(function (index) {
        const cell = this.querySelector(".pl-sno-text");
        if (cell) {
            cell.textContent = String(index + 1);
        }
    });
}

function setPriceListImportRowLocked(row, locked) {
    if (!row) {
        return;
    }
    row.classList.toggle("pl-import-row", !!locked);
    const itemCode = row.querySelector(".txtItemCode");
    const itemName = row.querySelector(".txtItemName");
    const itemBarCode = row.querySelector(".txtItemBarCode");
    [itemCode, itemName, itemBarCode].forEach(function (input) {
        if (!input) {
            return;
        }
        input.disabled = !!locked;
        if (locked) {
            input.removeAttribute("list");
        } else {
            if (input.classList.contains("txtItemCode")) {
                input.setAttribute("list", "txtItemCode");
            } else if (input.classList.contains("txtItemName")) {
                input.setAttribute("list", "txtItemName");
            } else if (input.classList.contains("txtItemBarCode")) {
                input.setAttribute("list", "txtItemBarCode");
            }
        }
    });
}

function reapplyPriceListImportRowLocks() {
    $("#PriceListData tr.pl-import-row").each(function () {
        setPriceListImportRowLocked(this, true);
    });
}

function preparePriceListEntryForm(tabLabel, afterDates) {
    ClearData();
    effectiveDateLoadSeq += 1;
    $("#tab1").text(tabLabel);
    togglePriceListImportUi(tabLabel);
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#PriceListData").empty();
    if (tabLabel !== 'IMPORT') {
        addNewRow();
    }
    disableFields(false);
    $("#txtEntryDate, #txtEffectiveDate").prop("disabled", false);
    $("#txtEffectiveDate").prop("readonly", tabLabel === 'NEW');
    $("#txtsave").prop("disabled", false).show();
    fetchAndSetCurrentDates(function () {
        if (tabLabel === 'IMPORT') {
            $('#txtEffectiveDate').val(getDefaultEffectiveDateForImport());
        } else {
            const maxKey = getMaxEffectiveDateKey();
            const today = parseAppDate(G_SystemCurrentDate);
            const maxDt = maxKey ? parseAppDate(maxKey) : null;
            if (maxKey && maxDt && today && today.getTime() > maxDt.getTime()) {
                $('#txtEffectiveDate').val(G_SystemCurrentDate);
            } else if (maxKey) {
                $('#txtEffectiveDate').val(maxKey);
            }
        }
        lastValidEffectiveDate = $("#txtEffectiveDate").val();
        if (typeof afterDates === 'function') {
            afterDates();
        }
    });
}

async function Create() {
    let hasPermission = true;
    let msg = '';
    try {
        ({ hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code));
    } catch (e) {
        toastr.error("Unable to verify permission. Please refresh and try again.");
        return;
    }
    if (hasPermission === false) {
        toastr.error(msg);
        return;
    }
    preparePriceListEntryForm('NEW', function () {
        onEffectiveDateChanged();
    });
}

function pickPdfGridField(obj, key) {
    if (!obj || !key) {
        return '';
    }
    if (obj[key] != null && obj[key] !== '') {
        return obj[key];
    }
    return pickField(obj, key.charAt(0).toUpperCase() + key.slice(1), key);
}

async function ImportFromPdf() {
    let hasPermission = false;
    let msg = '';
    try {
        ({ hasPermission, msg } = await CheckOptionPermission('Import', UserMaster_Code, UserModuleMaster_Code));
        if (!hasPermission) {
            ({ hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code));
        }
    } catch (e) {
        toastr.error("Unable to verify permission. Please refresh and try again.");
        return;
    }
    if (hasPermission === false) {
        toastr.error(msg);
        return;
    }
    preparePriceListEntryForm('IMPORT', function () {
        refreshEffectiveDatePickerDays();
        onEffectiveDateChanged();
    });
}

function uploadPriceListPdfExtract(file) {
    if (!file) {
        return;
    }
    if (($("#tab1").text() || '').trim() !== 'IMPORT' || !$("#txtCreatepage").is(':visible')) {
        toastr.error('Open Import from the list page, then select a PDF file.');
        return;
    }
    const name = (file.name || '').trim();
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    if (ext !== 'pdf') {
        toastr.error('Please select a PDF file.');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Pdf/extract`, 
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            unblockUI();
            if (typeof response === 'string') {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    toastr.error('Invalid response from PDF extract.');
                    return;
                }
            }
            applyPdfExtractToImportForm(response);
        },
        error: function (xhr) {
            unblockUI();
            let errMsg = 'Failed to extract data from PDF.';
            const body = xhr && xhr.responseText ? String(xhr.responseText).trim() : '';
            if (body) {
                try {
                    const json = JSON.parse(body);
                    errMsg = pickField(json, 'Msg', 'msg') || pickField(json, 'Message', 'message') || json.title || body;
                } catch (e) {
                    errMsg = body.length > 300 ? body.substring(0, 300) : body;
                }
            } else if (xhr && xhr.status === 404) {
                errMsg = 'PDF extract proxy not found. Rebuild and restart the ESMS web app.';
            } else if (xhr && xhr.status === 502) {
                errMsg = 'Could not reach PDF extract API. Check AppBaseURL in appsettings.';
            }
            toastr.error(errMsg);
        }
    });
}

function showInvalidPdfImport() {
    toastr.error('Invalid Pdf');
    $("#PriceListData").empty();
    $("#filePriceListPdfImport").val('');
}

function hasImportablePdfGridRows(extractLines) {
    if (!extractLines || !extractLines.length) {
        return false;
    }
    return extractLines.some(function (raw) {
        const code = String(
            pickField(raw, 'ItemCode', 'itemCode')
            || pickField(raw, 'ProductCode', 'productCode')
            || pickPdfGridField(raw, 'ffpl_p_n')
            || ''
        ).trim();
        return code.length > 0;
    });
}

function applyPdfExtractToImportForm(response) {
    if (!response) {
        showInvalidPdfImport();
        return;
    }
    const rawLines = normalizePdfExtractResponse(response);
    if (response.success === false || !hasImportablePdfGridRows(rawLines)) {
        showInvalidPdfImport();
        return;
    }
    if (Array.isArray(response.errors) && response.errors.length) {
        toastr.warning(response.errors.join(' '));
    }
    if (!applyImportedDetailLines(rawLines)) {
        showInvalidPdfImport();
    }
}

function parsePdfGridRate(val) {
    if (val == null || val === '') {
        return '';
    }
    const n = parseFloat(String(val).replace(/,/g, '').trim());
    return isNaN(n) ? '' : n;
}

function normalizePdfExtractResponse(response) {
    if (!response) {
        return [];
    }
    if (Array.isArray(response)) {
        return response;
    }
    if (Array.isArray(response.grid)) {
        return response.grid;
    }
    const listKeys = ['Grid', 'Items', 'items', 'PriceListDetail', 'priceListDetail', 'Lines', 'lines', 'Data', 'data', 'Result', 'result'];
    for (let i = 0; i < listKeys.length; i++) {
        const key = listKeys[i];
        if (Array.isArray(response[key])) {
            return response[key];
        }
    }
    return [];
}

function buildDetailLineFromExtract(raw) {
    let itemCode = String(pickField(raw, 'ItemCode', 'itemCode') || pickField(raw, 'ProductCode', 'productCode') || pickPdfGridField(raw, 'ffpl_p_n') || '').trim();
    let itemBarCode = String(pickField(raw, 'ItemBarCode', 'itemBarCode') || pickField(raw, 'BarCode', 'barCode') || '').trim();
    let itemName = String(pickField(raw, 'ItemName', 'itemName') || pickField(raw, 'ProductName', 'productName') || pickPdfGridField(raw, 'description') || '').trim();
    let rate = parsePdfGridRate(pickPdfGridField(raw, 'revised_dap'));
    if (rate === '') {
        rate = parsePdfGridRate(pickField(raw, 'Rate', 'rate') || pickField(raw, 'Price', 'price') || pickPdfGridField(raw, 'revised_mrp') || pickField(raw, 'MRP', 'mrp'));
    }
    let itemMasterCode = pickField(raw, 'ItemMaster_Code', 'itemMaster_Code');

    let item = null;
    if (itemCode) {
        const codeUpper = itemCode.toUpperCase();
        item = ItemDetail.find(function (entry) {
            return String(entry.ItemCode || '').trim().toUpperCase() === codeUpper;
        });
    }
    if (!item && itemBarCode) {
        item = ItemDetail.find(function (entry) { return entry.ItemBarCode === itemBarCode; });
    }
    if (!item && itemName) {
        item = ItemDetail.find(function (entry) {
            return entry.ItemName === itemName || (entry.ItemName + ' (' + entry.ItemCode + ')') === itemName;
        });
    }
    if (item) {
        itemMasterCode = item.Code != null ? item.Code : item.code;
        itemCode = item.ItemCode;
        if (!itemName) {
            itemName = item.ItemName;
        }
    }
    if (itemCode) {
        itemBarCode = itemCode;
    }
    if (!(parseInt(itemMasterCode, 10) > 0) && itemCode) {
        const codeUpper = itemCode.toUpperCase();
        const byCodeOrBar = ItemDetail.find(function (entry) {
            const c = String(entry.ItemCode || '').trim().toUpperCase();
            const b = String(entry.ItemBarCode || '').trim().toUpperCase();
            return c === codeUpper || b === codeUpper;
        });
        if (byCodeOrBar) {
            itemMasterCode = byCodeOrBar.Code != null ? byCodeOrBar.Code : byCodeOrBar.code;
            itemCode = byCodeOrBar.ItemCode;
            itemBarCode = itemCode;
        }
    }

    return {
        ItemMaster_Code: itemMasterCode || 0,
        ItemCode: itemCode,
        ItemName: itemName,
        ItemBarCode: itemBarCode,
        Rate: rate
    };
}

function applyImportedDetailLines(extractLines) {
    $("#PriceListData").empty();
    const lines = [];
    const seenMaster = {};
    extractLines.forEach(function (raw) {
        const line = buildDetailLineFromExtract(raw);
        if (!line.ItemCode) {
            return;
        }
        const masterKey = String(line.ItemMaster_Code || line.ItemCode).toUpperCase();
        if (seenMaster[masterKey]) {
            return;
        }
        seenMaster[masterKey] = true;
        lines.push(line);
    });
    if (!lines.length) {
        return false;
    }
    lines.forEach(function (line, index) {
        addNewRowEdit(index, line, true);
    });
    refreshPriceListSerialNumbers();
    toastr.success(lines.length + ' item(s) loaded from PDF (Rate = Revised DAP). Please verify and save.');
    return true;
}

function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    togglePriceListImportUi('');
    ClearData();
    disableFields(false);
    $("#txtEffectiveDate").prop("readonly", false);
    ShowPriceListMasterList('Load');
    $("#txtsave").show();
}

function ClearData() {
    $("#hfCode").val("0");
    $("#txtEntryNo").val("");
    $("#PriceListData").empty();
    $("#filePriceListPdfImport").val('');
}

function fetchAndSetCurrentDates(afterSet) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            const apiDate = response[0].Date;
            G_SystemCurrentDate = apiDate;
            $('#txtEntryDate, #txtEffectiveDate').val(apiDate);
            if (typeof afterSet === 'function') {
                afterSet();
            }
        }
    });
}

function DatePicker() {
    fetchAndSetCurrentDates(function () {
        $('#txtEntryDate').datepicker({
            format: 'dd/mm/yyyy',
            autoclose: true,
            orientation: 'bottom auto',
            todayHighlight: true
        });
        $('#txtEffectiveDate').datepicker({
            format: 'dd/mm/yyyy',
            autoclose: true,
            orientation: 'bottom auto',
            todayHighlight: true,
            beforeShowDay: effectiveDateBeforeShowDay,
            enableOnReadonly: true,
            startDate: null,
            endDate: null
        });
        $('#txtEffectiveDate').on('changeDate', function () {
            onEffectiveDateChanged();
        }).on('show', function () {
            ensureEffectiveDatePickerNavOpen();
            refreshEffectiveDatePickerDays();
        }).on('changeMonth changeYear', function () {
            ensureEffectiveDatePickerNavOpen();
        });
    });
}

function rejectImportEffectiveDateSelection(seq) {
    const importMsg = 'For import, Effective Date must be a new date after the latest existing list (e.g. if 13 exists, select 14 or later).';
    unblockUI();
    toastr.error(importMsg);
    if (seq != null) {
        $("#txtEffectiveDate").val(lastValidEffectiveDate);
        $('#txtEffectiveDate').datepicker('update', lastValidEffectiveDate);
    }
}

function validateEffectiveDateViaApi(effectiveDate, seq, onSuccess) {
    if (isPriceListImportMode() && !isEffectiveDateAllowedForImport(effectiveDate)) {
        rejectImportEffectiveDateSelection(seq);
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/PriceListMaster/ValidatePriceListEffectiveDate?EffectiveDate=${encodeURIComponent(effectiveDate)}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            if (seq != null && seq !== effectiveDateLoadSeq) {
                return;
            }
            const payload = Array.isArray(response) && response.length ? response[0] : response;
            const status = pickField(payload, 'Status', 'status');
            const msg = pickField(payload, 'Msg', 'msg');
            if (status === 'N') {
                unblockUI();
                toastr.error(msg || 'Effective Date not allowed.');
                if (seq != null) {
                    $("#txtEffectiveDate").val(lastValidEffectiveDate);
                    $('#txtEffectiveDate').datepicker('update', lastValidEffectiveDate);
                    if (!isPriceListImportMode()) {
                        resetNewFormLinesOnly();
                    }
                }
                return;
            }
            if (isPriceListImportMode() && !isEffectiveDateAllowedForImport(effectiveDate)) {
                rejectImportEffectiveDateSelection(seq);
                return;
            }
            if (typeof onSuccess === 'function') {
                onSuccess();
            }
        },
        error: function (xhr) {
            if (seq != null && seq !== effectiveDateLoadSeq) {
                return;
            }
            unblockUI();
            let errMsg = 'Failed to validate Effective Date.';
            const body = xhr && xhr.responseText ? String(xhr.responseText).trim() : '';
            if (body) {
                errMsg = body.length > 300 ? body.substring(0, 300) : body;
            } else if (xhr && xhr.status === 404) {
                errMsg = 'Validate API not found. Rebuild and restart Bizsol ESMS API.';
            }
            toastr.error(errMsg);
        }
    });
}

function onEffectiveDateChanged() {
    if (!$("#txtCreatepage").is(':visible') || !isPriceListNewEntryMode()) {
        return;
    }
    const val = ($("#txtEffectiveDate").val() || '').trim();
    if (!val) {
        return;
    }
    effectiveDateLoadSeq += 1;
    const seq = effectiveDateLoadSeq;
    validateEffectiveDateViaApi(val, seq, function () {
        lastValidEffectiveDate = val;
        if (!isPriceListImportMode()) {
            loadByEffectiveDate(val, seq);
        }
    });
}
function GetItemDetails() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            if (response.length > 0) {
                ItemDetail = response;
                let options1 = '', options2 = '', options3 = '';
                response.forEach(item => {
                    options1 += '<option value="' + item.ItemBarCode + '"></option>';
                    options2 += '<option value="' + item.ItemCode + '"></option>';
                    options3 += '<option value="' + item.ItemName + ' (' + item.ItemCode + ')"></option>';
                });
                $('#txtItemBarCode').html(options1);
                $('#txtItemCode').html(options2);
                $('#txtItemName').html(options3);
            }
        }
    });
}

function pickField(obj, pascalKey, camelKey) {
    if (!obj) return '';
    if (obj[pascalKey] != null && obj[pascalKey] !== '') return obj[pascalKey];
    if (camelKey && obj[camelKey] != null && obj[camelKey] !== '') return obj[camelKey];
    return '';
}

function rowHtml() {
    return `
        <td class="col-pl-sno text-center"><span class="pl-sno-text"></span></td>
        <td><input type="hidden" class="hfItemMasterCode" value="0" /><input type="text" list="txtItemCode" onfocusout="validateItemInput(this,'ItemCode');" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" list="txtItemName" onfocusout="validateItemInput(this,'ItemName');" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" autocomplete="off" maxlength="200"/></td>
        <td><input type="text" list="txtItemBarCode" onfocusout="validateItemInput(this,'BarCode');" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" autocomplete="off" maxlength="20" /></td>
        <td><input type="text" class="txtRate box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="restrictRateInput(this);" onfocusout="formatRateOnBlur(this);" autocomplete="off" maxlength="15" /></td>
        <td><button type="button" class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>`;
}

function addNewRow() {
    const table = document.getElementById("tblPriceListDetail").querySelector("tbody");
    const rows = table.querySelectorAll("tr");
    const lastRow = rows[rows.length - 1];
    if (rows.length > 0 && !isRowComplete(lastRow)) {
        alert("Please fill in all mandatory fields in the current row before adding a new row.");
        return;
    }
    const newRow = document.createElement("tr");
    newRow.innerHTML = rowHtml();
    table.appendChild(newRow);
    setPriceListImportRowLocked(newRow, false);
    refreshPriceListSerialNumbers();
}

function addNewRowEdit(index, line, lockImportRow) {
    const table = document.getElementById("PriceListData");
    const newRow = document.createElement("tr");
    newRow.innerHTML = rowHtml();
    table.appendChild(newRow);
    const row = table.rows[table.rows.length - 1];
    const hf = row.querySelector('.hfItemMasterCode');
    if (hf) hf.value = pickField(line, 'ItemMaster_Code', 'itemMaster_Code') || 0;
    row.querySelector('.txtItemBarCode').value = pickField(line, 'ItemBarCode', 'itemBarCode');
    row.querySelector('.txtItemCode').value = pickField(line, 'ItemCode', 'itemCode');
    row.querySelector('.txtItemName').value = pickField(line, 'ItemName', 'itemName');
    const rate = pickField(line, 'Rate', 'rate');
    row.querySelector('.txtRate').value = rate !== '' ? formatRateTwoDecimals(rate) : '';
    if (lockImportRow) {
        setPriceListImportRowLocked(row, true);
    } else {
        setPriceListImportRowLocked(row, false);
    }
}

function isRowComplete(row) {
    const inputs = row.querySelectorAll("input.mandatory");
    for (const input of inputs) {
        if (input.value.trim() === "") {
            input.focus();
            return false;
        }
    }
    return true;
}

function focusblank(element) {
    $(element).val("");
}

function OnKeyDownPressFloatTextBox(event, element) {
    if (event.charCode === 13 || event.charCode === 46 || event.charCode === 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        return true;
    }
    element.setCustomValidity("Only allowed Float Numbers");
    element.reportValidity();
    return false;
}

function restrictRateInput(element) {
    let val = element.value.replace(/[^0-9.]/g, '');
    const dotIdx = val.indexOf('.');
    if (dotIdx >= 0) {
        val = val.slice(0, dotIdx + 1) + val.slice(dotIdx + 1).replace(/\./g, '');
        const frac = val.slice(dotIdx + 1);
        if (frac.length > 2) {
            val = val.slice(0, dotIdx + 1) + frac.slice(0, 2);
        }
    }
    element.value = val;
}

function formatRateTwoDecimals(val) {
    if (val === '' || val == null) return '';
    const n = parseFloat(String(val).replace(/,/g, ''));
    if (isNaN(n)) return '';
    return n.toFixed(2);
}

function formatRateOnBlur(element) {
    if (!element || element.value.trim() === '') return;
    element.value = formatRateTwoDecimals(element.value);
}

function isItemSelectedInOtherRow(item, currentRow) {
    const itemCode = String(item.ItemCode || '').trim();
    const itemMasterCode = String(item.Code ?? item.code ?? '');
    let selected = false;
    $('#PriceListData tr').each(function () {
        if (this === currentRow) {
            return;
        }
        const otherCode = ($(this).find('.txtItemCode').val() || '').trim();
        if (!otherCode) {
            return;
        }
        if (itemCode && otherCode === itemCode) {
            selected = true;
            return false;
        }
        const otherItem = ItemDetail.find(entry => entry.ItemCode === otherCode);
        if (otherItem && itemMasterCode && String(otherItem.Code ?? otherItem.code ?? '') === itemMasterCode) {
            selected = true;
            return false;
        }
    });
    return selected;
}

function clearPriceListItemRow(row) {
    if (!row) return;
    row.querySelectorAll('input').forEach(function (input) {
        if (input.classList.contains('hfItemMasterCode')) {
            input.value = '0';
        } else {
            input.value = '';
        }
    });
}

function FillallItemfield(inputElement, value) {
    const currentRow = inputElement.closest('tr');
    if (!currentRow) return;
    if (isPriceListImportMode() && currentRow.classList.contains('pl-import-row')) {
        return;
    }
    const inputValue = inputElement.value;
    const itemBarCode = currentRow.querySelector('.txtItemBarCode');
    const itemCode = currentRow.querySelector('.txtItemCode');
    const itemName = currentRow.querySelector('.txtItemName');
    const itemRate = currentRow.querySelector('.txtRate');
    let item = null;

    if (value === 'BarCode') {
        item = ItemDetail.find(entry => entry.ItemBarCode === inputValue);
    } else if (value === 'ItemCode') {
        item = ItemDetail.find(entry => entry.ItemCode === inputValue);
    } else if (value === 'ItemName') {
        item = ItemDetail.find(entry => (entry.ItemName + ' (' + entry.ItemCode + ')') === inputValue)
            || ItemDetail.find(entry => entry.ItemName === inputValue);
    }

    if (item) {
        if (isItemSelectedInOtherRow(item, currentRow)) {
            clearPriceListItemRow(currentRow);
            toastr.error('Same item is already selected in another row.');
            return;
        }
        const hf = currentRow.querySelector('.hfItemMasterCode');
        if (hf) hf.value = item.Code || 0;
        itemBarCode.value = item.ItemBarCode || '';
        itemCode.value = item.ItemCode || '';
        itemName.value = item.ItemName || '';
        if (item.Rate != null && item.Rate !== '') {
            itemRate.value = formatRateTwoDecimals(item.Rate);
        } else if (item.SaleRate != null && item.SaleRate !== '') {
            itemRate.value = formatRateTwoDecimals(item.SaleRate);
        }
    } else {
        const hf = currentRow.querySelector('.hfItemMasterCode');
        if (hf) hf.value = 0;
        itemBarCode.value = '';
        itemCode.value = '';
        itemName.value = '';
        itemRate.value = '';
    }
}

function validateItemInput(inputElement, mode) {
    const currentRow = inputElement.closest('tr');
    if (!currentRow) return;
    if (isPriceListImportMode()) {
        return;
    }
    const value = inputElement.value;
    let isValid = false;
    if (mode === 'BarCode') {
        isValid = ItemDetail.some(entry => entry.ItemBarCode === value);
    } else if (mode === 'ItemCode') {
        isValid = ItemDetail.some(entry => entry.ItemCode === value);
    } else {
        isValid = ItemDetail.some(entry => entry.ItemName === value || (entry.ItemName + ' (' + entry.ItemCode + ')') === value);
    }
    if (!isValid) {
        currentRow.querySelectorAll('input').forEach(input => {
            if (input.classList.contains('hfItemMasterCode')) {
                input.value = '0';
            } else {
                input.value = '';
            }
        });
    }
}

function applyShowResponse(response, mode, options) {
    options = options || {};
    const masterList = response.PriceListMaster || response.priceListMaster;
    const detailList = response.PriceListDetail || response.priceListDetail;
    if (!masterList || masterList.length === 0 || pickField(masterList[0], 'Code', 'code') === '') {
        if (options.allowEmpty) {
            $("#hfCode").val("0");
            $("#txtEntryNo").val("");
            return false;
        }
        toastr.error("Record not found...!");
        return false;
    }
    const master = masterList[0];
    $("#hfCode").val(pickField(master, 'Code', 'code') || "0");
    $("#txtEntryNo").val(pickField(master, 'EntryNo', 'entryNo'));
    $("#txtEntryDate").val(pickField(master, 'EntryDate', 'entryDate'));
    $("#txtEffectiveDate").val(pickField(master, 'EffectiveDate', 'effectiveDate'));
    $("#PriceListData").empty();
    if (detailList && detailList.length > 0) {
        detailList.forEach(function (line, index) {
            addNewRowEdit(index, line);
        });
    } else {
        addNewRow();
    }
    if (mode === 'VIEW') {
        $("#txtsave").hide().prop("disabled", true);
        disableFields(true);
        $("#txtEntryDate, #txtEffectiveDate").prop("disabled", true);
    } else {
        $("#txtsave").show().prop("disabled", false);
        disableFields(false);
        $("#txtEntryDate, #txtEffectiveDate").prop("disabled", false);
    }
    return true;
}

function loadByEffectiveDate(effectiveDate, loadSeq) {
    if (!effectiveDate || !effectiveDate.trim()) {
        return;
    }
    const requestedDate = effectiveDate.trim();
    const seq = loadSeq == null ? ++effectiveDateLoadSeq : loadSeq;
    $.ajax({
        url: `${appBaseURL}/api/PriceListMaster/ShowPriceListMasterByEffectiveDate?EffectiveDate=${encodeURIComponent(requestedDate)}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            if (seq !== effectiveDateLoadSeq) {
                return;
            }
            const currentEffective = ($("#txtEffectiveDate").val() || '').trim();
            if (currentEffective !== requestedDate) {
                return;
            }
            const isNew = isPriceListNewEntryMode();
            const loaded = applyShowResponse(response, isNew ? 'EDIT' : $("#tab1").text(), { allowEmpty: isNew });
            if (loaded && isNew) {
                lastValidEffectiveDate = $("#txtEffectiveDate").val();
                if (G_SystemCurrentDate) {
                    $("#txtEntryDate").val(G_SystemCurrentDate);
                }
                refreshEffectiveDatePickerDays();
            } else if (!loaded && isNew) {
                resetNewFormLinesOnly();
            }
        },
        error: function () {
            if (seq !== effectiveDateLoadSeq) {
                return;
            }
            toastr.error("Failed to fetch data for Effective Date.");
        }
    });
}

function loadByCode(code, mode) {
    $.ajax({
        url: `${appBaseURL}/api/PriceListMaster/ShowPriceListMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            applyShowResponse(response, mode);
        },
        error: function () {
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}

async function Edit(code) {
    let hasPermission = true;
    let msg = '';
    try {
        ({ hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code));
    } catch (e) {
        toastr.error("Unable to verify permission. Please refresh and try again.");
        return;
    }
    if (hasPermission === false) {
        toastr.error(msg);
        return;
    }
    const row = getPriceListRowByCode(code);
    if (row && !isLatestEffectiveDateRow(row)) {
        toastr.error("Only the latest Effective Date price list can be edited.");
        return;
    }
    $("#tab1").text("EDIT");
    $("#txtEffectiveDate").prop("readonly", false);
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    loadByCode(code, 'EDIT');
}

async function View(code) {
    let hasPermission = true;
    let msg = '';
    try {
        ({ hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code));
    } catch (e) {
        toastr.error("Unable to verify permission. Please refresh and try again.");
        return;
    }
    if (hasPermission === false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("VIEW");
    $("#txtEffectiveDate").prop("readonly", false);
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    loadByCode(code, 'VIEW');
}

async function deleteItem(code, entryNo) {
    let hasPermission = true;
    let msg = '';
    try {
        ({ hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code));
    } catch (e) {
        toastr.error("Unable to verify permission. Please refresh and try again.");
        return;
    }
    if (hasPermission === false) {
        toastr.error(msg);
        return;
    }
    const row = getPriceListRowByCode(code);
    if (row && !isLatestEffectiveDateRow(row)) {
        toastr.error("Only the latest Effective Date price list can be deleted.");
        return;
    }
    if (!confirm(`Are you sure you want to delete Entry No ${entryNo}?`)) {
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/PriceListMaster/DeletePriceListMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyHeader());
        },
        success: function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                ShowPriceListMasterList('Get');
            } else {
                toastr.error(response.Msg || "Delete failed.");
            }
        }
    });
}

function Save() {
    const entryDate = $("#txtEntryDate").val();
    const effectiveDate = $("#txtEffectiveDate").val();
    if (!entryDate) {
        toastr.error("Please select Entry Date!");
        $("#txtEntryDate").focus();
        return;
    }
    if (!effectiveDate) {
        toastr.error("Please select Effective Date!");
        $("#txtEffectiveDate").focus();
        return;
    }
    if (isPriceListNewEntryMode()) {
        blockUI();
        validateEffectiveDateViaApi(effectiveDate, null, function () {
            unblockUI();
            savePriceListAfterValidate(entryDate, effectiveDate);
        });
        return;
    }

    savePriceListAfterValidate(entryDate, effectiveDate);
}

function savePriceListAfterValidate(entryDate, effectiveDate) {
    let validationFailed = false;
    let hasLine = false;
    const seenItemKeys = {};
    const isImport = isPriceListImportMode();
    $("#PriceListData tr").each(function () {
        const row = $(this);
        const itemCode = row.find(".txtItemCode").val();
        const rate = row.find(".txtRate").val();
        if (itemCode) {
            hasLine = true;
            if (!row.find(".txtItemBarCode").val()) {
                toastr.error("Please select Item Bar code!");
                validationFailed = true;
                return false;
            }
            if (!row.find(".txtItemName").val()) {
                toastr.error("Please select Item Name!");
                validationFailed = true;
                return false;
            }
            if (rate === '' || rate == null) {
                toastr.error("Please enter Rate!");
                validationFailed = true;
                return false;
            }
            const itemMasterCode = resolveItemMasterCodeForSaveRow(row);
            if (!isImport && itemMasterCode <= 0) {
                toastr.error("Please select a valid item from the list!");
                validationFailed = true;
                return false;
            }
            const dupKey = itemMasterCode > 0
                ? 'm:' + itemMasterCode
                : 'c:' + String(itemCode).trim().toUpperCase();
            if (seenItemKeys[dupKey]) {
                toastr.error("Same item is already selected in another row.");
                row.find(".txtItemCode").focus();
                validationFailed = true;
                return false;
            }
            seenItemKeys[dupKey] = true;
        }
    });
    if (validationFailed) return;
    if (!hasLine) {
        toastr.error("Please add at least one item.");
        return;
    }

    const header = [{
        Code: parseInt($("#hfCode").val(), 10) || 0,
        EntryNo: $("#txtEntryNo").val(),
        EntryDate: entryDate,
        EffectiveDate: effectiveDate
    }];
    const details = [];
    $("#PriceListData tr").each(function () {
        const row = $(this);
        const itemCode = row.find(".txtItemCode").val();
        if (itemCode) {
            details.push({
                ItemMaster_Code: resolveItemMasterCodeForSaveRow(row),
                ItemCode: String(itemCode).trim(),
                ItemName: (row.find(".txtItemName").val() || '').trim(),
                ItemBarCode: (row.find(".txtItemBarCode").val() || '').trim(),
                Rate: parseFloat(formatRateTwoDecimals(row.find(".txtRate").val())) || 0
            });
        }
    });

    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/PriceListMaster/SavePriceListMaster?UserMaster_Code=${UserMaster_Code}`,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ PriceListMaster: header, PriceListDetail: details }),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyHeader());
        },
        success: function (response) {
            unblockUI();
            if (response.Status === "Y") {
                toastr.success(response.Msg);
                ShowPriceListMasterList('Get');
                BackMaster();
            } else {
                toastr.error(response.Msg || "Save failed.");
            }
        },
        error: function (xhr) {
            unblockUI();
            const msg = xhr.responseText || xhr.statusText || "An error occurred while saving the data.";
            toastr.error(msg.length > 200 ? "An error occurred while saving the data." : msg);
        }
    });
}

function disableFields(disabled) {
    $("#txtsave").prop("disabled", disabled);
    $("#tblPriceListDetail")
        .find("input, select, textarea, button")
        .not("#btnBack")
        .prop("disabled", disabled)
        .css("pointer-events", disabled ? "none" : "auto");
    $("#btnAddNewRow").prop("disabled", disabled);
    if (!disabled) {
        reapplyPriceListImportRowLocks();
    }
}

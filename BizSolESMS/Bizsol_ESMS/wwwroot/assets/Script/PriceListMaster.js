// Price List Master — list, create/edit/view, Effective Date rules, item detail grid.
var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType; // Used by CheckOptionPermission.js (global)

// Returns Auth-Key header string for API calls.
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

// Parses dd/mm/yyyy (or legacy dd/Mon/yyyy from list) to Date; null if invalid.
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

// Formats Date as dd/mm/yyyy for compare and API.
function formatDdMmYyyy(date) {
    const d = date.getDate();
    const mo = date.getMonth() + 1;
    const y = date.getFullYear();
    return (d < 10 ? '0' : '') + d + '/' + (mo < 10 ? '0' : '') + mo + '/' + y;
}

// Min and max EffectiveDate from current list data.
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

// Latest Effective Date in list as dd/mm/yyyy string.
function getMaxEffectiveDateKey() {
    const range = getMinMaxEffectiveDates();
    return range.max ? formatDdMmYyyy(range.max) : '';
}

// True if row is the price list with the latest Effective Date (Edit/Delete allowed).
function isLatestEffectiveDateRow(item) {
    const maxKey = getMaxEffectiveDateKey();
    if (!maxKey) return true;
    const dt = parseAppDate(String(pickField(item, 'EffectiveDate', 'effectiveDate')));
    return !!(dt && formatDdMmYyyy(dt) === maxKey);
}

// Finds list row by master Code from G_PriceListData.
function getPriceListRowByCode(code) {
    return G_PriceListData.find(function (item) {
        return String(pickField(item, 'Code', 'code')) === String(code);
    });
}

// Server today for date rules (falls back to Entry Date field).
function getSystemCurrentDateForCompare() {
    return parseAppDate(G_SystemCurrentDate) || parseAppDate($("#txtEntryDate").val());
}

// NEW mode: allowed dates = latest existing, or after max (>= today); not between min–max.
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

// Calendar day selectable on NEW form (uses isEffectiveDateAllowedForNew).
function isEffectiveDateDaySelectable(date) {
    if ($("#tab1").text() !== 'NEW') {
        return true;
    }
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return isEffectiveDateAllowedForNew(formatDdMmYyyy(day));
}

// Redraws Effective Date picker to refresh enabled/disabled days.
function refreshEffectiveDatePickerDays() {
    const val = $("#txtEffectiveDate").val();
    if (val && $('#txtEffectiveDate').data('datepicker')) {
        $('#txtEffectiveDate').datepicker('update', val);
    }
}

// Clears header ids and detail grid; one empty row (invalid date / no prefill).
function resetNewFormLinesOnly() {
    $("#hfCode").val("0");
    $("#txtEntryNo").val("");
    $("#PriceListData").empty();
    addNewRow();
}

// Datepicker hook: enable day or mark disabled with message.
function effectiveDateBeforeShowDay(date) {
    if (isEffectiveDateDaySelectable(date)) {
        return [true, ''];
    }
    return [false, 'disabled', 'Effective Date not allowed'];
}

// Page init: dates, items, list grid, module code, detail row handlers.
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
        if ($('#PriceListData tr').length === 0) {
            addNewRow();
        }
    });
});

// Sets UserModuleMaster_Code for "Price List Master" option rights.
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

// Builds grid with Edit/Delete only on latest Effective Date; View on all rows.
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

// Loads price list header rows from API into the list table.
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

// Opens NEW form after permission; sets Effective Date and prefills latest if exists.
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
    ClearData();
    effectiveDateLoadSeq += 1;
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#PriceListData").empty();
    addNewRow();
    disableFields(false);
    $("#txtEntryDate, #txtEffectiveDate").prop("disabled", false);
    $("#txtEffectiveDate").prop("readonly", true);
    $("#txtsave").prop("disabled", false).show();
    fetchAndSetCurrentDates(function () {
        const maxKey = getMaxEffectiveDateKey();
        const today = parseAppDate(G_SystemCurrentDate);
        const maxDt = maxKey ? parseAppDate(maxKey) : null;
        if (maxKey && maxDt && today && today.getTime() > maxDt.getTime()) {
            $('#txtEffectiveDate').val(G_SystemCurrentDate);
        } else if (maxKey) {
            $('#txtEffectiveDate').val(maxKey);
        }
        lastValidEffectiveDate = $("#txtEffectiveDate").val();
        onEffectiveDateChanged();
    });
}

// Returns to list view and reloads grid.
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    disableFields(false);
    $("#txtEffectiveDate").prop("readonly", false);
    ShowPriceListMasterList('Load');
    $("#txtsave").show();
}

// Resets form header fields and detail tbody.
function ClearData() {
    $("#hfCode").val("0");
    $("#txtEntryNo").val("");
    $("#PriceListData").empty();
}

// Gets server current date; sets Entry/Effective fields; optional callback.
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

// Initializes datepickers; Effective Date uses gap/latest rules on NEW.
function DatePicker() {
    fetchAndSetCurrentDates(function () {
        const datepickerOpts = {
            format: 'dd/mm/yyyy',
            autoclose: true,
            orientation: 'bottom auto',
            todayHighlight: true
        };
        $('#txtEntryDate').datepicker(datepickerOpts);
        $('#txtEffectiveDate').datepicker(Object.assign({}, datepickerOpts, {
            beforeShowDay: effectiveDateBeforeShowDay
        }));
        $('#txtEffectiveDate').on('changeDate', function () {
            onEffectiveDateChanged();
        }).on('show', function () {
            refreshEffectiveDatePickerDays();
        });
    });
}

// Calls API to validate Effective Date for NEW; onSuccess runs next step.
function validateEffectiveDateViaApi(effectiveDate, seq, onSuccess) {
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
                    resetNewFormLinesOnly();
                }
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

// On NEW Effective Date change: API validate, then load lines by that date.
function onEffectiveDateChanged() {
    if (!$("#txtCreatepage").is(':visible') || $("#tab1").text() !== 'NEW') {
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
        loadByEffectiveDate(val, seq);
    });
}

// Loads items for datalist lookup on detail grid.
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

// Reads API field whether PascalCase or camelCase.
function pickField(obj, pascalKey, camelKey) {
    if (!obj) return '';
    if (obj[pascalKey] != null && obj[pascalKey] !== '') return obj[pascalKey];
    if (camelKey && obj[camelKey] != null && obj[camelKey] !== '') return obj[camelKey];
    return '';
}

// HTML for one detail grid row (item + rate + delete).
function rowHtml() {
    return `
        <td><input type="hidden" class="hfItemMasterCode" value="0" /><input type="text" list="txtItemCode" onfocusout="validateItemInput(this,'ItemCode');" onfocus="focusblank(this);" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemCode');" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" list="txtItemName" onfocusout="validateItemInput(this,'ItemName');" onfocus="focusblank(this);" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'ItemName');" autocomplete="off" maxlength="200"/></td>
        <td><input type="text" list="txtItemBarCode" onfocusout="validateItemInput(this,'BarCode');" onfocus="focusblank(this);" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillallItemfield(this,'BarCode');" autocomplete="off" maxlength="20" /></td>
        <td><input type="text" class="txtRate box_border form-control form-control-sm text-right mandatory" onkeypress="return OnKeyDownPressFloatTextBox(event, this);" oninput="restrictRateInput(this);" onfocusout="formatRateOnBlur(this);" autocomplete="off" maxlength="15" /></td>
        <td><button type="button" class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>`;
}

// Appends empty detail row if current row is complete.
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
}

// Appends detail row and fills from API line (edit/view/prefill).
function addNewRowEdit(index, line) {
    const table = document.getElementById("PriceListData");
    const newRow = document.createElement("tr");
    newRow.innerHTML = rowHtml();
    table.appendChild(newRow);
    const row = table.rows[index];
    const hf = row.querySelector('.hfItemMasterCode');
    if (hf) hf.value = pickField(line, 'ItemMaster_Code', 'itemMaster_Code') || 0;
    row.querySelector('.txtItemBarCode').value = pickField(line, 'ItemBarCode', 'itemBarCode');
    row.querySelector('.txtItemCode').value = pickField(line, 'ItemCode', 'itemCode');
    row.querySelector('.txtItemName').value = pickField(line, 'ItemName', 'itemName');
    const rate = pickField(line, 'Rate', 'rate');
    row.querySelector('.txtRate').value = rate !== '' ? formatRateTwoDecimals(rate) : '';
}

// True if all mandatory inputs in the row are filled.
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

// Clears input on focus (shared UI pattern).
function focusblank(element) {
    $(element).val("");
}

// Allows numeric/float keys only on rate field.
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

// Rate: max 2 digits after decimal while typing.
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

// Fills row from ItemDetail by barcode, code, or name; sets ItemMaster_Code.
function FillallItemfield(inputElement, value) {
    const currentRow = inputElement.closest('tr');
    if (!currentRow) return;
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

// On blur, clears row if value is not a valid item from datalist.
function validateItemInput(inputElement, mode) {
    const currentRow = inputElement.closest('tr');
    if (!currentRow) return;
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

// Binds Show API header + detail to form; VIEW disables editing.
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

// GET master + detail by Effective Date (NEW prefill); ignores stale requests.
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
            const isNew = $("#tab1").text() === 'NEW';
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

// GET master + detail by Code for Edit or View.
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

// Opens EDIT for latest Effective Date row only, after permission check.
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

// Opens read-only VIEW after permission check.
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

// Deletes latest Effective Date row only, after permission and confirm.
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

// Validates form and POSTs header + detail to SavePriceListMaster API.
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
    if ($("#tab1").text() === 'NEW') {
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
            const itemMasterCode = parseInt(row.find(".hfItemMasterCode").val(), 10) || 0;
            if (itemMasterCode <= 0) {
                toastr.error("Please select a valid item from the list!");
                validationFailed = true;
                return false;
            }
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
                ItemMaster_Code: parseInt(row.find(".hfItemMasterCode").val(), 10) || 0,
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

// Enables/disables detail grid and save (used in VIEW mode).
function disableFields(disabled) {
    $("#txtsave").prop("disabled", disabled);
    $("#tblPriceListDetail")
        .find("input, select, textarea, button")
        .not("#btnBack")
        .prop("disabled", disabled)
        .css("pointer-events", disabled ? "none" : "auto");
    $("#btnAddNewRow").prop("disabled", disabled);
}

/* Scan To Bill — Generate / Edit GST Invoice (same screen as Invoice page). */
var G_InvoiceItemDetailCache = [];
var G_HsnMasterRows = [];
var G_BankMasterList = [];
var G_InvModalCtx = null;
var G_InvDiscSyncFromZero = false;
var G_OdInvoiceFromComplete = false;
var modalGenEl = null;
var bsModalGen = null;
var API_HSN_MASTER_LIST = '/api/Master/ShowHSNMaster';
var API_INVOICE_MASTER_SAVE_DATA = '/api/OrderMaster/InvoiceMasterSaveData';
var API_PREFILL_INVOICE = '/api/OrderMaster/GetGstInvoicePrefill';

function odInvUiDateToApiYmd(val) {
    var s = (val || '').trim();
    if (!s) return todayYmd();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var d = parseApiDate(s);
    if (d && !isNaN(d.getTime())) return dateToYmd(d);
    return todayYmd();
}
function odInvAnyDateToPickerDmy(str) {
    var d = parseApiDate(str);
    return d && !isNaN(d.getTime()) ? dateToDmy(d) : todayDmy();
}
function odInvNextInvoiceNo() {
    var d = new Date();
    var r = String(Math.floor(Math.random() * 9000) + 1000);
    return 'INV/' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '/' + r;
}
function odInvPickField(row, keys) {
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row && row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}
function odInvItemCodeHeader() {
    return (G_ItemConfig && G_ItemConfig[0] && G_ItemConfig[0].ItemCodeHeader) ? G_ItemConfig[0].ItemCodeHeader : 'Item Code';
}
function odInvItemNameHeader() {
    return (G_ItemConfig && G_ItemConfig[0] && G_ItemConfig[0].ItemNameHeader) ? G_ItemConfig[0].ItemNameHeader : 'Item Name';
}
function odInvHsnDisplayCode(r) {
    return String(odInvPickField(r || {}, ['HSN Code', 'HSNCode', 'HSN', 'HsnCode']) || '').trim();
}
function odInvGstFromMasterRow(r) {
    var v = parseNum(odInvPickField(r || {}, ['GST Rate', 'GSTRate', 'GSTPer', 'GST', 'IGST']));
    return isFinite(v) ? v : NaN;
}
function odInvLookupGstPct(hsnCode) {
    var c = String(hsnCode || '').trim();
    if (!c) return null;
    var row = G_HsnMasterRows.find(function (h) { return String(h.code) === c; });
    return row ? row.gst : null;
}
function odInvNormalizeHsn(res) {
    if (!Array.isArray(res)) return [];
    var byCode = {};
    res.forEach(function (r) {
        var act = String(r.IsActive || 'Y').toUpperCase();
        if (r.IsActive != null && act !== 'Y') return;
        var code = odInvHsnDisplayCode(r);
        if (!code) return;
        var g = odInvGstFromMasterRow(r);
        if (!isFinite(g)) g = 18;
        byCode[code] = { code: code, gst: g };
    });
    return Object.keys(byCode).map(function (k) { return byCode[k]; });
}
function odInvMergeHsnFromItems(items) {
    var map = {};
    (items || []).forEach(function (it) {
        var h = odInvHsnDisplayCode(it) || String(it.HSNCode || it.HSN || it.HsnCode || '').trim();
        if (!h) return;
        var g = parseNum(odInvPickField(it, ['GST Rate', 'GSTRate', 'GSTPer', 'GST']) || it.IGST || it.CGSTRate);
        if (!isFinite(g) || !(g >= 0)) g = map[h] || 18;
        map[h] = g;
    });
    Object.keys(map).forEach(function (k) {
        if (!G_HsnMasterRows.some(function (r) { return String(r.code) === k; })) {
            G_HsnMasterRows.push({ code: k, gst: map[k] });
        }
    });
}
function odInvItemMeta(itemCode) {
    var ic = String(itemCode || '').trim();
    if (!ic || !G_InvoiceItemDetailCache.length) return null;
    return G_InvoiceItemDetailCache.find(function (x) {
        return String(x.ItemCode || '').trim() === ic || String(x.ItemBarCode || '').trim() === ic;
    }) || null;
}
function odInvLoadItems(callback) {
    $.ajax({
        url: appBaseURL + '/api/Master/GetItemDetails',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            G_InvoiceItemDetailCache = Array.isArray(response) ? response : [];
            odInvMergeHsnFromItems(G_InvoiceItemDetailCache);
            if (callback) callback();
        },
        error: function () {
            G_InvoiceItemDetailCache = [];
            if (callback) callback();
        }
    });
}
function odInvLoadHsn(callback) {
    $.ajax({
        url: appBaseURL + API_HSN_MASTER_LIST,
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            if (Array.isArray(res) && res.length > 0) G_HsnMasterRows = odInvNormalizeHsn(res);
            odInvMergeHsnFromItems(G_InvoiceItemDetailCache);
            if (callback) callback();
        },
        error: function () {
            odInvMergeHsnFromItems(G_InvoiceItemDetailCache);
            if (callback) callback();
        }
    });
}
function odInvBankField(bank, key, altKey) {
    if (!bank) return '';
    var v = bank[key];
    if (v == null && altKey) v = bank[altKey];
    return v != null ? String(v).trim() : '';
}
function odInvFormatBank(bank) {
    if (!bank) return '';
    var lines = [];
    var name = odInvBankField(bank, 'Bank Name', 'BankName');
    var acNo = odInvBankField(bank, 'Account No', 'AccountNo');
    var ifsc = odInvBankField(bank, 'IFSC Code', 'IFSCCode');
    var branch = odInvBankField(bank, 'Branch', 'Branch');
    var type = odInvBankField(bank, 'Type', 'Type');
    if (name) lines.push(name);
    if (acNo) lines.push('ACCOUNT No-' + acNo);
    if (ifsc) lines.push('IFSC Code-' + ifsc);
    if (branch) lines.push('Branch-' + branch);
    if (type) lines.push('Type-' + type);
    return lines.join('\n');
}
function odInvFillBankDropdown() {
    var $ddl = $('#ddlInvBankName');
    if (!$ddl.length) return;
    var current = $ddl.val() || '';
    $ddl.empty().append('<option value="">Select Bank</option>');
    (G_BankMasterList || []).forEach(function (bank) {
        var code = bank.Code != null ? String(bank.Code) : '';
        var name = odInvBankField(bank, 'Bank Name', 'BankName');
        if (!code || !name) return;
        $ddl.append($('<option></option>').attr('value', code).text(name));
    });
    if (current && $ddl.find('option[value="' + current + '"]').length) $ddl.val(current);
}
function odInvIsDefaultBank(bank) {
    var d = odInvBankField(bank, 'Default Check', 'DefaultCheck');
    return d === 'Y' || d.toLowerCase() === 'yes';
}
function odInvApplyBankOnOpen(existingBankText, isExistingInvoice) {
    odInvFillBankDropdown();
    existingBankText = (existingBankText || '').trim();
    if (isExistingInvoice && existingBankText) {
        var matched = (G_BankMasterList || []).find(function (b) {
            var name = odInvBankField(b, 'Bank Name', 'BankName');
            return name && existingBankText.toUpperCase().indexOf(name.toUpperCase()) >= 0;
        });
        $('#ddlInvBankName').val(matched ? String(matched.Code) : '');
        return;
    }
    var defBank = (G_BankMasterList || []).find(function (b) { return odInvIsDefaultBank(b); }) || null;
    if (defBank) {
        $('#ddlInvBankName').val(String(defBank.Code));
        $('#txtInvBank').val(odInvFormatBank(defBank));
    } else {
        $('#ddlInvBankName').val('');
        if (!existingBankText) $('#txtInvBank').val('');
    }
}
function odInvLoadBank(callback) {
    $.ajax({
        url: appBaseURL + '/api/Master/ShowBankMaster',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            G_BankMasterList = Array.isArray(response) ? response : [];
            odInvFillBankDropdown();
            if (callback) callback();
        },
        error: function () {
            G_BankMasterList = [];
            odInvFillBankDropdown();
            if (callback) callback();
        }
    });
}
function odInvEnsureMasters(done) {
    odInvLoadBank(function () {
        odInvLoadItems(function () {
            odInvLoadHsn(function () { if (done) done(); });
        });
    });
}
function odInvMapOrderLine(row) {
    var itemCode = String(odInvPickField(row, [odInvItemCodeHeader(), 'Item Code', 'ItemCode']) || '');
    var itemName = String(odInvPickField(row, [odInvItemNameHeader(), 'Item Name', 'ItemName']) || '');
    var qty = parseNum(odInvPickField(row, ['Packing Qty', 'Scan Qty', 'Bal Qty', 'Ord Qty', 'Qty']));
    var mrp = parseNum(row['MRP']);
    var meta = odInvItemMeta(itemCode);
    var hsn = String(odInvPickField(row, ['HSN Code', 'HSNCode', 'HSN']) || (meta ? (meta.HSNCode || meta.HSN || '') : '')).trim();
    var gstFromMeta = meta ? parseNum(meta.GSTPer || meta.GSTRate || meta.IGST || meta.GST) : NaN;
    var lm = odInvLookupGstPct(hsn);
    var gstPct = null;
    if (hsn) {
        if (lm !== null && !isNaN(lm)) gstPct = lm;
        else if (!isNaN(gstFromMeta) && gstFromMeta > 0) gstPct = gstFromMeta;
    }
    if (hsn && odInvLookupGstPct(hsn) == null && !isNaN(gstFromMeta) && gstFromMeta > 0) {
        if (!G_HsnMasterRows.some(function (r) { return String(r.code) === hsn; })) {
            G_HsnMasterRows.push({ code: hsn, gst: gstFromMeta });
        }
    }
    return { itemCode: itemCode, itemName: itemName, qty: qty, mrp: mrp, basicRate: (function () { var b = parseNum(odInvPickField(row, ['Basic Rate', 'BasicRate', 'BASICRATE'])); return b > 0 ? b : mrp; })(), scanMrp: mrp, discPct: 0, hsn: hsn, gstPct: gstPct };
}
function odInvMapGenerateLine(row) {
    var itemCode = String(odInvPickField(row, ['Item Code', 'ItemCode']) || '');
    var itemName = String(odInvPickField(row, ['Item Name', 'ItemName']) || '');
    var qty = parseNum(row['Qty']);
    var mrp = parseNum(row['MRP']);
    var basicRate = parseNum(odInvPickField(row, ['Basic Rate', 'BasicRate', 'BASICRATE']));
    var scanMrp = parseNum(odInvPickField(row, ['Scan MRP', 'ScanMRP', 'SCANMRP']));
    if (!(scanMrp > 0) && mrp > 0) scanMrp = mrp;
    if (!(basicRate > 0)) basicRate = scanMrp > 0 ? scanMrp : mrp;
    var discPct = parseNum(row['DiscountPercent'] != null ? row['DiscountPercent'] : row['Discount']);
    var hsn = String(odInvPickField(row, ['HSNCode', 'HSN Code', 'HSN']) || '').trim();
    var lm = odInvLookupGstPct(hsn);
    var gstRow = parseNum(odInvPickField(row, ['GST', 'GSTRate', 'GST Rate', 'GSTRATE']));
    var meta = odInvItemMeta(itemCode);
    var gstMeta = meta ? parseNum(meta.GSTPer || meta.GSTRate || meta.IGST || meta.GST) : NaN;
    var gst = null;
    if (lm !== null && !isNaN(lm)) gst = lm;
    else if (gstRow > 0) gst = gstRow;
    else if (!isNaN(gstMeta) && gstMeta > 0) gst = gstMeta;
    if (hsn && odInvLookupGstPct(hsn) == null && gst != null && !isNaN(gst)) {
        if (!G_HsnMasterRows.some(function (r) { return String(r.code) === hsn; })) {
            G_HsnMasterRows.push({ code: hsn, gst: gst });
        }
    }
    return { itemCode: itemCode, itemName: itemName, qty: qty, mrp: mrp, basicRate: basicRate, scanMrp: scanMrp, discPct: discPct, hsn: hsn, gstPct: gst };
}
function odInvEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function odInvGstPercent(it) {
    var h = String(it.hsn || '').trim();
    if (!h) return '';
    var lm = odInvLookupGstPct(h);
    if (lm !== null && !isNaN(lm)) return String(lm);
    if (it.gstPct == null || it.gstPct === '') return '';
    var g = parseNum(it.gstPct);
    return isFinite(g) && !isNaN(g) ? String(g) : '';
}
function odInvHsnOptions(selected, gstHintOpt) {
    var sel = String(selected || '').trim();
    var list = G_HsnMasterRows.slice().sort(function (a, b) {
        return String(a.code).localeCompare(String(b.code));
    });
    if (sel && !list.some(function (x) { return String(x.code) === sel; })) {
        var gOr = odInvLookupGstPct(sel);
        if (gOr == null || isNaN(gOr)) {
            if (gstHintOpt != null && gstHintOpt !== '') {
                var ph = parseNum(gstHintOpt);
                if (isFinite(ph) && ph >= 0) gOr = ph;
            }
        }
        list.push({ code: sel, gst: gOr != null && !isNaN(gOr) ? gOr : 0 });
    }
    var opts = '<option value="">Select HSN</option>' + list.map(function (h) {
        var v = odInvEsc(h.code);
        return '<option value="' + v + '"' + (String(h.code) === sel ? ' selected' : '') + '>' + odInvEsc(h.code) + '</option>';
    }).join('');
    return '<select class="form-select form-select-sm inv-hsn-select box_border">' + opts + '</select>';
}
function odInvDestroyHsnSelect2() {
    $('#tblInvoiceItemsBody .inv-hsn-select').each(function () {
        var $el = $(this);
        if ($el.data('select2')) {
            try { $el.select2('destroy'); } catch (e1) { /* ignore */ }
        }
    });
}
function odInvInitHsnSelect2() {
    odInvDestroyHsnSelect2();
    var $modal = $('#modalInvoiceGen');
    $('#tblInvoiceItemsBody .inv-hsn-select').each(function () {
        $(this).select2({
            width: '100%',
            placeholder: 'Search HSN...',
            allowClear: true,
            dropdownParent: $modal.length ? $modal : $(document.body)
        });
    });
}
function odInvRecalcRow($tr) {
    var qty = parseNum($tr.find('.inv-qty').text());
    if (!(qty > 0)) qty = 1;
    var mrp = parseNum($tr.find('.inv-mrp').text());
    var basicRate = parseNum($tr.find('.inv-basic-rate').val());
    var discPct = parseNum($tr.find('.inv-disc-pct').val());
    var discBase = mrp > 0 ? mrp : basicRate;
    var discAmtUnit = discBase * (discPct / 100);
    var taxableUnit = basicRate - discAmtUnit;
    var gstRaw = ($tr.find('.inv-gst').val() || '').trim();
    var gstPct = gstRaw === '' ? 0 : parseNum(gstRaw);
    if (!isFinite(gstPct) || isNaN(gstPct) || gstPct < 0) gstPct = 0;
    var taxAmtUnit = taxableUnit * (gstPct / 100);
    var amount = (taxableUnit + taxAmtUnit) * qty;
    $tr.find('.inv-disc-amt').text(formatMoney(discAmtUnit * qty));
    $tr.find('.inv-tax-amt').text(formatMoney(taxAmtUnit * qty));
    $tr.find('.inv-line-amt').text(formatMoney(amount));
    $tr.data('taxable', taxableUnit);
    return { taxable: taxableUnit, taxAmt: taxAmtUnit * qty, amount: amount };
}
function odInvRecalcTotal() {
    var sum = 0;
    $('#tblInvoiceItemsBody tr').each(function () {
        sum += odInvRecalcRow($(this)).amount;
    });
    $('#lblInvoiceTotal').text(formatMoney(sum));
}
function odInvRefreshDiscFlag() {
    G_InvDiscSyncFromZero = true;
    $('#tblInvoiceItemsBody tr').each(function () {
        if (parseNum($(this).find('.inv-disc-pct').val()) !== 0) {
            G_InvDiscSyncFromZero = false;
            return false;
        }
    });
}
function odInvMaybeSyncDisc($sourceInput) {
    if (!G_InvDiscSyncFromZero) return;
    var val = parseNum($sourceInput.val());
    if (val <= 0) return;
    $('#tblInvoiceItemsBody .inv-disc-pct').val(formatMoney(val));
    G_InvDiscSyncFromZero = false;
}
function odInvApplyPendingDisc() {
    if (!G_InvDiscSyncFromZero) return;
    var pendingVal = 0;
    $('#tblInvoiceItemsBody .inv-disc-pct').each(function () {
        var v = parseNum($(this).val());
        if (v > 0) { pendingVal = v; return false; }
    });
    if (pendingVal > 0) {
        $('#tblInvoiceItemsBody .inv-disc-pct').val(formatMoney(pendingVal));
        G_InvDiscSyncFromZero = false;
    }
}
function odInvBindLineEvents() {
    $('#tblInvoiceItemsBody').off('input change', '.inv-basic-rate, .inv-disc-pct, .inv-gst');
    $('#tblInvoiceItemsBody').on('input', '.inv-basic-rate, .inv-gst', function () { odInvRecalcTotal(); });
    $('#tblInvoiceItemsBody').off('input change.invDiscBulk', '.inv-disc-pct');
    $('#tblInvoiceItemsBody').on('input', '.inv-disc-pct', function () { odInvRecalcTotal(); });
    $('#tblInvoiceItemsBody').on('change.invDiscBulk', '.inv-disc-pct', function () {
        odInvMaybeSyncDisc($(this));
        odInvRecalcTotal();
    });
    $('#tblInvoiceItemsBody').off('change.invHsn', '.inv-hsn-select').on('change.invHsn', '.inv-hsn-select', function () {
        var $tr = $(this).closest('tr');
        var newHsn = String($(this).val() || '').trim();
        var $gstIn = $tr.find('.inv-gst');
        if (!newHsn) {
            $gstIn.val('');
            $tr.data('gstUserEdited', false);
            odInvRecalcTotal();
            return;
        }
        var gst = odInvLookupGstPct(newHsn);
        if (gst === null || isNaN(gst)) {
            toastr.warning('No GST rate in HSN Master for ' + newHsn + '. Enter GST % manually.');
            $gstIn.val('');
            $tr.data('gstUserEdited', true);
        } else {
            $gstIn.val(String(gst));
            $tr.data('gstUserEdited', false);
        }
        odInvRecalcTotal();
    });
    $('#tblInvoiceItemsBody').off('change', '.inv-gst').on('change', '.inv-gst', function () {
        $(this).closest('tr').data('gstUserEdited', true);
    });
}
function odInvFindListRow(dispatchCode) {
    var d = String(dispatchCode);
    return (typeof G_OdListData !== 'undefined' ? G_OdListData : []).find(function (item) {
        return String(item.Code || item.D_Code || '') === d;
    }) || {};
}
function odInvFinishOpenFail(msg) {
    if (typeof unblockUI === 'function') unblockUI();
    if (msg) toastr.error(msg);
    if (G_OdInvoiceFromComplete) {
        G_OdInvoiceFromComplete = false;
        if (typeof OdBackToList === 'function') OdBackToList();
    }
}
function odInvShowModal() {
    if (typeof unblockUI === 'function') unblockUI();
    $('#block-overlay').remove();
    if (!modalGenEl) modalGenEl = document.getElementById('modalInvoiceGen');
    if (modalGenEl && modalGenEl.parentElement && modalGenEl.parentElement !== document.body) {
        document.body.appendChild(modalGenEl);
    }
    if (!bsModalGen && modalGenEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bsModalGen = bootstrap.Modal.getInstance(modalGenEl) || new bootstrap.Modal(modalGenEl);
    }
    if (bsModalGen) bsModalGen.show();
}
function odInvPrefill(dispatchCode) {
    $.ajax({
        url: appBaseURL + API_PREFILL_INVOICE + '?DispatchMaster_Code=' + encodeURIComponent(dispatchCode),
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (res) {
            if (res && res.InvoiceNo) $('#txtInvInvoiceNo').val(res.InvoiceNo);
            if (res && res.InvoiceDate) {
                try { $('#txtInvInvoiceDate').datepicker('update', odInvAnyDateToPickerDmy(res.InvoiceDate)); }
                catch (e) { $('#txtInvInvoiceDate').val(odInvAnyDateToPickerDmy(res.InvoiceDate)); }
            }
        }
    });
}
function odInvFillAndShow(dispatchCode, response, rowModel) {
    var lines = [];
    var invHeaders = response && (response.InvoiceHeader || response.invoiceHeader);
    var useInvoiceShape = Array.isArray(invHeaders) && invHeaders.length > 0;

    if (useInvoiceShape) {
        var hdr = invHeaders[0];
        var invMc = parseNum(hdr.InvoiceMaster_Code);
        if (invMc > 0) G_InvModalCtx.invoiceMasterCode = invMc;
        else delete G_InvModalCtx.invoiceMasterCode;

        $('#modalInvoiceGenLabel').text(invMc > 0 ? 'Edit GST Invoice' : 'Generate GST Invoice');
        $('#lblInvModalClient').text(hdr.ClientName || rowModel.clientName || '—');
        $('#txtInvVehicleNo').val(String(hdr.VehicleNo || rowModel.vehicleNoList || '').trim());
        if (hdr.InvoiceDate) {
            try { $('#txtInvInvoiceDate').datepicker('update', odInvAnyDateToPickerDmy(hdr.InvoiceDate)); }
            catch (e) { $('#txtInvInvoiceDate').val(odInvAnyDateToPickerDmy(hdr.InvoiceDate)); }
        } else {
            try { $('#txtInvInvoiceDate').datepicker('update', todayDmy()); }
            catch (e2) { $('#txtInvInvoiceDate').val(todayDmy()); }
        }
        $('#txtInvInvoiceNo').val((hdr.InvoiceNo || '').toString().trim() || odInvNextInvoiceNo());
        $('#txtInvTerms').val(hdr.TermsAndconditions != null ? String(hdr.TermsAndconditions) : '');
        var existingBank = hdr.Bankdetails != null ? String(hdr.Bankdetails) : '';
        $('#txtInvBank').val(existingBank);
        odInvApplyBankOnOpen(existingBank, !!(invMc > 0));
        G_InvModalCtx.packedBy = rowModel.packedBy || '—';
        G_InvModalCtx.upiId = String(hdr.UPIId || hdr.UPIID || hdr['UPI Id'] || '').trim();
        lines = (response.InvoiceLines || response.invoiceLines || []).map(odInvMapGenerateLine).filter(function (L) { return L.itemCode; });
    } else {
        if (!response || !response.OrderMaster || !response.OrderMaster.length) {
            odInvFinishOpenFail('Order details not found.');
            return;
        }
        delete G_InvModalCtx.invoiceMasterCode;
        var om = response.OrderMaster[0];
        G_InvModalCtx.orderMasterCode = String(om.Code || G_InvModalCtx.orderMasterCode || '');
        G_InvModalCtx.packedBy = om.PackedBy || rowModel.packedBy || '—';
        $('#modalInvoiceGenLabel').text('Generate GST Invoice');
        $('#lblInvModalClient').text(om.AccountName || rowModel.clientName || '—');
        $('#txtInvVehicleNo').val((rowModel.vehicleNoList || om.VehicleNo || '').toString());
        try { $('#txtInvInvoiceDate').datepicker('update', todayDmy()); }
        catch (e3) { $('#txtInvInvoiceDate').val(todayDmy()); }
        $('#txtInvInvoiceNo').val(odInvNextInvoiceNo());
        $('#txtInvTerms').val('');
        $('#txtInvBank').val('');
        odInvApplyBankOnOpen('', false);
        lines = (response.OrderDetial || response.OrderDetail || []).map(odInvMapOrderLine).filter(function (L) { return L.itemCode; });
    }

    if (!lines.length) {
        odInvFinishOpenFail('No line items for this dispatch.');
        return;
    }

    var body = '';
    lines.forEach(function (it, idx) {
        var gstDisplayed = odInvGstPercent(it);
        var scanInit = it.scanMrp != null && parseNum(it.scanMrp) > 0 ? parseNum(it.scanMrp) : parseNum(it.mrp);
        var discInit = it.discPct != null ? parseNum(it.discPct) : 0;
        body += '<tr data-idx="' + idx + '">';
        body += '<td class="inv-cell-readonly inv-item-code text-nowrap"><span class="d-inline-block text-truncate" style="max-width:11rem;">' + String(it.itemCode || '') + '</span></td>';
        body += '<td class="inv-cell-readonly inv-item-name"><span class="d-inline-block text-truncate" style="max-width:18rem;" title="' + odInvEsc(it.itemName) + '">' + String(it.itemName || '') + '</span></td>';
        body += '<td class="inv-cell-readonly text-end inv-qty text-nowrap">' + it.qty + '</td>';
        body += '<td class="inv-cell-readonly text-end inv-mrp text-nowrap">' + formatMoney(it.mrp) + '</td>';
        body += '<td class="text-end align-middle"><input type="number" step="0.01" class="form-control form-control-sm text-end inv-basic-rate inv-line-input box_border" value="' + formatMoney(it.basicRate) + '" /></td>';
        body += '<td class="inv-cell-readonly text-end inv-scan-mrp text-nowrap">' + formatMoney(scanInit) + '</td>';
        body += '<td class="text-end align-middle"><input type="number" step="0.01" min="0" max="100" class="form-control form-control-sm text-end inv-disc-pct inv-line-input box_border" value="' + formatMoney(discInit) + '" /></td>';
        body += '<td class="inv-cell-readonly text-end inv-disc-amt text-nowrap">0.00</td>';
        body += '<td class="inv-hsn-cell align-middle">' + odInvHsnOptions(it.hsn, it.gstPct) + '</td>';
        body += '<td class="text-end align-middle inv-gst-cell"><div class="input-group inv-gst-wrap flex-nowrap"><span class="input-group-text user-select-none" style="height:28px">%</span><input type="number" step="0.01" min="0" max="999.99" class="form-control form-control-sm text-end inv-gst inv-line-input" value="' + gstDisplayed + '" /></div></td>';
        body += '<td class="inv-cell-readonly text-end inv-tax-amt text-nowrap">0.00</td>';
        body += '<td class="inv-cell-readonly text-end inv-line-amt text-nowrap fw-semibold">0.00</td>';
        body += '</tr>';
    });
    $('#tblInvoiceItemsBody').html(body);
    odInvBindLineEvents();
    odInvRefreshDiscFlag();
    odInvInitHsnSelect2();
    $('#tblInvoiceItemsBody tr').each(function () { odInvRecalcRow($(this)); });
    odInvRecalcTotal();
    if (!useInvoiceShape) odInvPrefill(dispatchCode);
    if (typeof unblockUI === 'function') unblockUI();
    odInvShowModal();
}

async function OdOpenInvoiceEditor(dispatchCode, mode) {
    var code = parseInt(dispatchCode, 10) || 0;
    if (!code) {
        odInvFinishOpenFail('Invalid dispatch for invoice.');
        return;
    }
    var permKey = mode === 'edit' ? 'Edit' : 'Complete';
    if (typeof CheckOptionPermission === 'function') {
        var perm = await CheckOptionPermission(permKey, UserMaster_Code, UserModuleMaster_Code);
        if (!perm.hasPermission) {
            toastr.error(perm.msg);
            if (G_OdInvoiceFromComplete) {
                G_OdInvoiceFromComplete = false;
                if (typeof OdBackToList === 'function') OdBackToList();
            }
            return;
        }
    }

    var row = odInvFindListRow(code);
    G_InvModalCtx = {
        orderMasterCode: row.OrderMaster_Code || row.Code || '',
        dispatchMasterCode: String(code),
        orderNo: row['Order No'] || row.OrderNo || row['Invoice No'] || '',
        clientName: row['Client Name'] || row.ClientName || row.AccountName || '',
        packingNo: row['Challan No'] || row.ChallanNo || '',
        vehicleNoList: row['Vehicle No'] || row.VehicleNo || '',
        packedBy: row['Packed By'] || row.PackedBy || ''
    };

    if (typeof blockUI === 'function') blockUI();
    odInvEnsureMasters(function () {
        $.ajax({
            url: appBaseURL + API_GET_INVOICE_GENERATE + '?DispatchMaster_Code=' + encodeURIComponent(code),
            type: 'GET',
            dataType: 'json',
            beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
            success: function (response) {
                odInvFillAndShow(code, response, G_InvModalCtx);
            },
            error: function () {
                odInvFinishOpenFail('Unable to load order lines.');
            }
        });
    });
}

function odInvValidate() {
    odInvApplyPendingDisc();
    odInvRecalcTotal();
    var invDateStr = ($('#txtInvInvoiceDate').val() || '').trim();
    if (!invDateStr) { toastr.error('Invoice date is required.'); return false; }
    var parsedInv = parseApiDate(invDateStr);
    if (!parsedInv || isNaN(parsedInv.getTime())) {
        toastr.error('Invoice date is invalid. Use DD-MM-YYYY.');
        return false;
    }
    if (!($('#txtInvInvoiceNo').val() || '').trim()) {
        toastr.error('Invoice number is required.');
        return false;
    }
    var ok = true;
    $('#tblInvoiceItemsBody tr').each(function () {
        var $tr = $(this);
        if (parseNum($tr.find('.inv-basic-rate').val()) <= 0) ok = false;
        var d = parseNum($tr.find('.inv-disc-pct').val());
        if (d < 0 || d > 100) ok = false;
        if (parseNum($tr.data('taxable')) < 0) ok = false;
        if (!($tr.find('.inv-hsn-select').val() || '').trim()) ok = false;
        var gstStr = ($tr.find('.inv-gst').val() || '').trim();
        var gstPct = gstStr === '' ? NaN : parseNum(gstStr);
        if (!isFinite(gstPct) || isNaN(gstPct) || gstPct < 0) ok = false;
    });
    if (!ok) {
        toastr.error('Check lines: Basic Rate > 0, discount 0–100%, taxable not negative, each line needs HSN and GST %.');
        return false;
    }
    return true;
}
function odInvCollectLines() {
    var lines = [];
    $('#tblInvoiceItemsBody tr').each(function () {
        var $tr = $(this);
        odInvRecalcRow($tr);
        var hsnRaw = ($tr.find('.inv-hsn-select').val() || '').trim();
        lines.push({
            ItemCode: String($tr.find('.inv-item-code').text() || '').trim(),
            Qty: parseNum($tr.find('.inv-qty').text()),
            MRP: parseNum($tr.find('.inv-mrp').text()),
            ScanMRP: parseNum($tr.find('.inv-scan-mrp').text()),
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
function OdSaveGstInvoice() {
    if (!odInvValidate() || !G_InvModalCtx) return;
    var uid = UserMaster_Code != null ? parseInt(String(UserMaster_Code), 10) : NaN;
    if (isNaN(uid) || uid <= 0) {
        toastr.error('User session invalid (UserMaster_Code). Sign in again.');
        return;
    }
    var invoiceNo = ($('#txtInvInvoiceNo').val() || '').trim();
    var invCodeParsed = G_InvModalCtx.invoiceMasterCode != null ? parseInt(String(G_InvModalCtx.invoiceMasterCode), 10) : 0;
    var payload = {
        code: isFinite(invCodeParsed) && invCodeParsed > 0 ? invCodeParsed : 0,
        jsonHeader: {
            DispatchMaster_Code: parseInt(String(G_InvModalCtx.dispatchMasterCode), 10) || 0,
            InvoiceNo: invoiceNo,
            InvoiceDate: odInvUiDateToApiYmd($('#txtInvInvoiceDate').val()),
            VehicleNo: $('#txtInvVehicleNo').val().trim(),
            TermsAndConditions: $('#txtInvTerms').val() || '',
            BankDetails: $('#txtInvBank').val() || ''
        },
        jsonLines: odInvCollectLines()
    };
    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: appBaseURL + API_INVOICE_MASTER_SAVE_DATA + '?UserMaster_Code=' + encodeURIComponent(uid),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', authKeyData); },
        success: function (response) {
            var row = Array.isArray(response) ? response[0] : response;
            if (row && (row.Status === 'Y' || row.status === 'Y')) {
                if (row.InvoiceNo) $('#txtInvInvoiceNo').val(row.InvoiceNo);
                if (row.InvoiceMaster_Code != null && G_InvModalCtx) G_InvModalCtx.invoiceMasterCode = row.InvoiceMaster_Code;
                toastr.success((row.Msg || row.msg || 'Invoice saved.') + '');
                if (!G_OdInvoiceFromComplete && typeof OdLoadList === 'function') OdLoadList();
                if (bsModalGen) bsModalGen.hide();
            } else {
                toastr.error((row && (row.Msg || row.msg)) ? (row.Msg || row.msg) : 'Save failed.');
            }
        },
        error: function (xhr) {
            var msg = 'Unable to save invoice.';
            if (xhr && xhr.status === 404) msg = 'Invoice save API not found.';
            else if (xhr && xhr.responseText) {
                try {
                    var j = JSON.parse(xhr.responseText);
                    if (j && (j.message || j.Msg)) msg = j.message || j.Msg;
                } catch (e) { /* ignore */ }
            }
            toastr.error(msg);
        },
        complete: function () {
            if (typeof unblockUI === 'function') unblockUI();
        }
    });
}

$(document).ready(function () {
    modalGenEl = document.getElementById('modalInvoiceGen');
    if (modalGenEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bsModalGen = bootstrap.Modal.getInstance(modalGenEl) || new bootstrap.Modal(modalGenEl);
    }
    if ($.fn.datepicker) {
        $('#txtInvInvoiceDate').datepicker({
            format: 'dd-mm-yyyy',
            autoclose: true,
            clearBtn: true,
            todayHighlight: true
        });
    }
    $('#ddlInvBankName').on('change', function () {
        if (!$(this).val()) return;
        var bank = (G_BankMasterList || []).find(function (b) { return String(b.Code) === String($('#ddlInvBankName').val()); });
        if (bank) $('#txtInvBank').val(odInvFormatBank(bank));
    });
    $('#btnInvSave').on('click', OdSaveGstInvoice);
    $('#modalInvoiceGen').on('shown.bs.modal', function () {
        if (typeof unblockUI === 'function') unblockUI();
        $('#block-overlay').remove();
        var gen = document.getElementById('modalInvoiceGen');
        if (gen && gen.parentElement !== document.body) {
            document.body.appendChild(gen);
        }
    });
    $('#modalInvoiceGen').on('hidden.bs.modal', function () {
        odInvDestroyHsnSelect2();
        if (typeof unblockUI === 'function') unblockUI();
        $('#block-overlay').remove();
        if (G_OdInvoiceFromComplete) {
            G_OdInvoiceFromComplete = false;
            if (typeof OdBackToList === 'function') OdBackToList();
        }
    });
    window.OdOpenInvoiceEditor = OdOpenInvoiceEditor;
});

/* Shared GST invoice print helpers (same format as Invoice Master print). */
var PRINT_OPTS_KEY = typeof PRINT_OPTS_KEY !== 'undefined' ? PRINT_OPTS_KEY : 'webiz_invoice_print_opts';
var API_GET_INVOICE_GENERATE = typeof API_GET_INVOICE_GENERATE !== 'undefined'
    ? API_GET_INVOICE_GENERATE
    : '/api/OrderMaster/GetInvoiceGenerateData';
var G_PrintSnapshots = typeof G_PrintSnapshots !== 'undefined' ? G_PrintSnapshots : {};
var printOrderDispatchCode = typeof printOrderDispatchCode !== 'undefined' ? printOrderDispatchCode : null;
var bsModalPrint = typeof bsModalPrint !== 'undefined' ? bsModalPrint : null;
var FixParameter;
try {
    FixParameter = JSON.parse(sessionStorage.getItem('Fixparameter'));
} catch (e) {
    FixParameter = null;
}
var G_CompanyCode = (FixParameter && FixParameter[0] && FixParameter[0].CompanyCode != null)
    ? FixParameter[0].CompanyCode
    : '';

function getInvoicePrintFlags() {
    var hasUi = $('#chkPrintHsn').length > 0;
    if (hasUi) {
        return {
            hsn: $('#chkPrintHsn').is(':checked'),
            discount: $('#chkPrintDiscount').is(':checked'),
            mrp: $('#chkPrintMrp').is(':checked'),
            tax: $('#chkPrintTax').is(':checked'),
            roundOff: $('#chkPrintRoundOff').is(':checked'),
            terms: $('#chkPrintTerms').is(':checked'),
            bank: $('#chkPrintBank').is(':checked'),
            upiQr: $('#chkPrintUpiQr').is(':checked')
        };
    }
    try {
        var raw = sessionStorage.getItem(PRINT_OPTS_KEY);
        if (raw) {
            var o = JSON.parse(raw);
            return {
                hsn: o.hsn !== false,
                discount: o.discount !== false,
                mrp: o.mrp !== false,
                tax: o.tax !== false,
                roundOff: o.roundOff !== false,
                terms: o.terms !== false,
                bank: o.bank !== false,
                upiQr: o.upiQr !== false
            };
        }
    } catch (e) { /* ignore */ }
    return {
        hsn: true,
        discount: true,
        mrp: true,
        tax: true,
        roundOff: true,
        terms: true,
        bank: true,
        upiQr: true
    };
}

function pad2(n) {
    return String(n).padStart(2, '0');
}
function todayYmd() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function todayDmy() {
    var d = new Date();
    return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function monthStartDmy() {
    var d = new Date();
    return pad2(1) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function dateToYmd(d) {
    if (!d || isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function dateToDmy(d) {
    if (!d || isNaN(d.getTime())) return '';
    return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear();
}
function parseApiDate(str) {
    if (str == null || str === '') return null;
    var s = String(str).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return new Date(s.slice(0, 10) + 'T12:00:00');
    }
    var m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) {
        return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), 12, 0, 0);
    }
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
        return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), 12, 0, 0);
    }
    m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/i);
    if (m) {
        var months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        var mon = months[m[2].toLowerCase()];
        if (mon == null) mon = 0;
        return new Date(parseInt(m[3], 10), mon, parseInt(m[1], 10), 12, 0, 0);
    }
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}
function formatDateDmyFromApi(str) {
    var d = parseApiDate(str);
    if (!d) return '';
    return dateToDmy(d);
}
function formatMoney(n) {
    var x = Number(n);
    if (!isFinite(x)) x = 0;
    return x.toFixed(2);
}
function calcAmountRoundOff(amount) {
    var amt = parseNum(amount);
    var rounded = Math.round(amt);
    var roundOff = Math.round((rounded - amt) * 100) / 100;
    return { gross: amt, rounded: rounded, roundOff: roundOff };
}
/** Print summary: MRP, discount, taxable (excl. tax), tax split. */
function calcInvoiceSummaryFromLines(lines) {
    var totalMrp = 0;
    var totalDiscount = 0;
    var taxableAmount = 0;
    var totalTax = 0;
    (lines || []).forEach(function (ln) {
        var qty = parseNum(ln.qty);
        if (!(qty > 0)) qty = 1;
        var scanMrp = parseNum(ln.scanMrp);
        var mrp = parseNum(ln.mrp);
        var discAmt = parseNum(ln.discAmt);
        var taxAmt = parseNum(ln.taxAmt);
        var amount = parseNum(ln.amount);
        var discPct = parseNum(ln.discPct);
        var gstPct = parseNum(ln.gstPct);

        totalMrp += scanMrp * qty;
        if (discAmt > 0) {
            totalDiscount += discAmt;
        } else if (discPct > 0) {
            var discBase = mrp > 0 ? mrp : scanMrp;
            totalDiscount += discBase * (discPct / 100) * qty;
        }

        if (amount > 0) {
            taxableAmount += amount - taxAmt;
            totalTax += taxAmt;
        } else {
            var discBase2 = mrp > 0 ? mrp : scanMrp;
            var discUnit = discBase2 * (discPct / 100);
            var taxableUnit = scanMrp - discUnit;
            taxableAmount += taxableUnit * qty;
            totalTax += taxableUnit * (gstPct / 100) * qty;
        }
    });
    return {
        totalMrp: totalMrp,
        totalDiscount: totalDiscount,
        taxableAmount: taxableAmount,
        totalTax: totalTax,
        cgst: totalTax / 2,
        sgst: totalTax / 2
    };
}
function resolveUpiIdFromSnap(snap) {
    if (!snap) return '';
    var fromSnap = String(snap.upiId || snap.UPIId || snap.UPIID || snap['UPI Id'] || '').trim();
    if (fromSnap) return fromSnap;
    var fp = (FixParameter && FixParameter[0]) ? FixParameter[0] : {};
    return String(fp.UPIId || fp.UPIID || fp['UPI Id'] || '').trim();
}
function buildUpiPayUri(upiId, payeeName, amount, note) {
    var id = String(upiId || '').trim();
    if (!id) return '';
    var params = ['pa=' + encodeURIComponent(id)];
    var pn = String(payeeName || '').trim();
    if (pn) params.push('pn=' + encodeURIComponent(pn.substring(0, 50)));
    var amt = parseNum(amount);
    if (amt > 0) params.push('am=' + encodeURIComponent(formatMoney(amt)));
    params.push('cu=INR');
    var tn = String(note || '').trim();
    if (tn) params.push('tn=' + encodeURIComponent(tn.substring(0, 80)));
    return 'upi://pay?' + params.join('&');
}
function generateUpiQrDataUrl(text, size) {
    return new Promise(function (resolve, reject) {
        if (typeof QRCode === 'undefined') {
            reject(new Error('QRCode library not loaded'));
            return;
        }
        var holder = document.getElementById('invoiceUpiQrGen');
        if (!holder) {
            reject(new Error('QR holder missing'));
            return;
        }
        holder.innerHTML = '';
        var div = document.createElement('div');
        holder.appendChild(div);
        try {
            new QRCode(div, {
                text: text,
                width: size || 130,
                height: size || 130,
                correctLevel: QRCode.CorrectLevel.M
            });
            setTimeout(function () {
                var canvas = div.querySelector('canvas');
                var dataUrl = '';
                if (canvas) {
                    dataUrl = canvas.toDataURL('image/png');
                } else {
                    var img = div.querySelector('img');
                    dataUrl = img ? img.src : '';
                }
                holder.innerHTML = '';
                if (dataUrl) resolve(dataUrl);
                else reject(new Error('QR render failed'));
            }, 120);
        } catch (err) {
            holder.innerHTML = '';
            reject(err);
        }
    });
}
function getInvoicePrintPayAmount(snap) {
    var finalAmt = parseNum(snap && snap.total);
    var flags = getInvoicePrintFlags();
    if (flags.roundOff) {
        return calcAmountRoundOff(finalAmt).rounded;
    }
    return finalAmt;
}
function parseNum(v) {
    if (v == null || v === '' || v === 'NULL') return 0;
    var x = parseFloat(String(v).replace(/,/g, ''));
    return isFinite(x) ? x : 0;
}
function loadPrintOptionsUi() {
    try {
        var raw = sessionStorage.getItem(PRINT_OPTS_KEY);
        if (!raw) return;
        var o = JSON.parse(raw);
        $('#chkPrintHsn').prop('checked', !!o.hsn);
        $('#chkPrintDiscount').prop('checked', !!o.discount);
        $('#chkPrintMrp').prop('checked', !!o.mrp);
        $('#chkPrintTax').prop('checked', !!o.tax);
        $('#chkPrintRoundOff').prop('checked', o.roundOff !== false);
        $('#chkPrintTerms').prop('checked', o.terms !== false);
        $('#chkPrintBank').prop('checked', o.bank !== false);
        $('#chkPrintUpiQr').prop('checked', o.upiQr !== false);
    } catch (e) { /* ignore */ }
}
function persistPrintOptionsUi() {
    if (!$('#chkPrintHsn').length) return;
    sessionStorage.setItem(
        PRINT_OPTS_KEY,
        JSON.stringify({
            hsn: $('#chkPrintHsn').is(':checked'),
            discount: $('#chkPrintDiscount').is(':checked'),
            mrp: $('#chkPrintMrp').is(':checked'),
            tax: $('#chkPrintTax').is(':checked'),
            roundOff: $('#chkPrintRoundOff').is(':checked'),
            terms: $('#chkPrintTerms').is(':checked'),
            bank: $('#chkPrintBank').is(':checked'),
            upiQr: $('#chkPrintUpiQr').is(':checked')
        })
    );
}
function forceClearPageBlockers() {
    if (typeof unblockUI === 'function') {
        unblockUI();
    }
    $('#block-overlay').remove();
    var openModals = document.querySelectorAll('.modal.show').length;
    var backdrops = document.querySelectorAll('.modal-backdrop');
    if (openModals === 0 && backdrops.length > 0) {
        backdrops.forEach(function (b) { b.remove(); });
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
    } else if (backdrops.length > openModals) {
        for (var i = openModals; i < backdrops.length; i++) {
            backdrops[i].remove();
        }
    }
}
function setPrintModalBusy(busy) {
    var $opts = $('#printModalOptions');
    var $checks = $opts.find('.form-check-input');
    $('#printModalLoading').toggleClass('d-none', !busy);
    $opts.toggleClass('pe-none opacity-50', !!busy);
    $checks.prop('disabled', !!busy);
    if (busy) {
        $('#btnInvPrintConfirm').prop('disabled', true);
    } else {
        updatePrintButtonEnabled();
    }
}
function onPrintOptionChange(ev) {
    var $columnChecks = $('#chkPrintHsn, #chkPrintDiscount, #chkPrintMrp, #chkPrintTax');
    if ($columnChecks.filter(':checked').length < 1) {
        if (ev && ev.target) {
            $(ev.target).prop('checked', true);
        }
        toastr.warning('At least one print column must stay on.');
    }
    updatePrintButtonEnabled();
}
function updatePrintButtonEnabled() {
    var n = 0;
    if ($('#chkPrintHsn').is(':checked')) n++;
    if ($('#chkPrintDiscount').is(':checked')) n++;
    if ($('#chkPrintMrp').is(':checked')) n++;
    if ($('#chkPrintTax').is(':checked')) n++;
    var busy = !$('#printModalLoading').hasClass('d-none');
    $('#btnInvPrintConfirm').prop('disabled', busy || n < 1);
}
function tryFetchPrintSnapshot(dispatchCode, done) {
    $.ajax({
        url: appBaseURL + API_GET_INVOICE_GENERATE + '?DispatchMaster_Code=' + encodeURIComponent(dispatchCode),
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            if (res) {
                var snap = normalizeServerPrintPayload(res);
                if (snap) {
                    G_PrintSnapshots[dispatchCode] = snap;
                }
            }
            done();
        },
        error: function () {
            done();
        }
    });
}
/** Map GetInvoiceGenerateData JSON to the snapshot shape used by buildPrintHtml. */
function normalizeInvoiceGenerateShapeForPrint(res) {
    var invHeaders = res && (res.InvoiceHeader || res.invoiceHeader);
    var invLines = res && (res.InvoiceLines || res.invoiceLines);
    if (!Array.isArray(invHeaders) || invHeaders.length === 0) {
        return null;
    }
    var h = invHeaders[0];
    var lines = (invLines || []).map(function (L) {
        var itemCode = String(L['Item Code'] || L.ItemCode || '').trim();
        if (!itemCode) return null;
        var itemName = String(L['Item Name'] || L.ItemName || '').trim();
        var qty = parseNum(L.Qty);
        var mrp = parseNum(L.MRP);
        var scanMrp = parseNum(L['Scan MRP'] != null ? L['Scan MRP'] : L.ScanMRP);
        if (!(scanMrp > 0) && mrp > 0) {
            scanMrp = mrp;
        }
        var discPct = parseNum(L.DiscountPercent != null ? L.DiscountPercent : L.Discount);
        var discBase = mrp > 0 ? mrp : scanMrp;
        var discAmtUnit = discBase * (discPct / 100);
        var discAmt = parseNum(L.DiscountAmount);
        if (!(qty > 0)) qty = 1;
        if (!(discAmt > 0) && discPct > 0 && discBase > 0) {
            discAmt = discAmtUnit * qty;
        }
        var hsn = String(L.HSNCode || L.HSN || '').trim();
        var gstPct = parseNum(L.GST != null ? L.GST : L.GSTRate);
        if (!(gstPct > 0)) {
            gstPct = 18;
        }
        var taxableUnit = scanMrp - discAmtUnit;
        var taxAmt = parseNum(L.TaxAmount);
        var amount = parseNum(L.Amount);
        if (!(taxAmt > 0) && !(amount > 0) && taxableUnit >= 0) {
            var taxAmtUnit = taxableUnit * (gstPct / 100);
            taxAmt = taxAmtUnit * qty;
            amount = (taxableUnit + taxAmtUnit) * qty;
        } else if (!(amount > 0) && taxableUnit >= 0) {
            if (!(taxAmt > 0)) {
                taxAmt = taxableUnit * (gstPct / 100) * qty;
            }
            amount = taxableUnit * qty + taxAmt;
        }
        return {
            itemCode: itemCode,
            itemName: itemName,
            qty: qty,
            mrp: mrp,
            scanMrp: scanMrp,
            discPct: discPct,
            discAmt: discAmt,
            hsn: hsn,
            gstPct: gstPct,
            taxAmt: taxAmt,
            amount: amount
        };
    }).filter(Boolean);

    var total = lines.reduce(function (s, ln) {
        return s + parseNum(ln.amount);
    }, 0);

    var orderFromHdr = String(
        h.OrderNo != null ? h.OrderNo : (h.orderNo || h['Order No'] || '')
    ).trim();
    var packFromHdr = String(
        h.PackingNo != null ? h.PackingNo :
            h.ChallanNo != null ? h.ChallanNo :
                h['Challan No'] != null ? h['Challan No'] : ''
    ).trim();

    return {
        clientName: String(h.ClientName || '').trim(),
        clientAddress: String(h.ClientAddress || '').trim(),
        orderNo: orderFromHdr,
        packingNo: packFromHdr,
        vehicleNo: String(h.VehicleNo || '').trim(),
        invoiceDate: formatDateDmyFromApi(h.InvoiceDate || ''),
        invoiceNo: String(h.InvoiceNo || '').trim(),
        terms: h.TermsAndconditions != null ? String(h.TermsAndconditions) : (h.TermsAndConditions != null ? String(h.TermsAndConditions) : ''),
        bank: h.Bankdetails != null ? String(h.Bankdetails) : (h.BankDetails != null ? String(h.BankDetails) : ''),
        total: total,
        lines: lines,
        companyName:    String(h.CompanyName || '').trim(),
        companyAddress: String(h.Address || h.WarehouseAddress || '').trim(),
        companyPhone:   String(h.Phone || h.ContactNo || h.MobileNo || '').trim(),
        companyEmail:   String(h.Email || h.EmailId || '').trim(),
        companyGstin:   String(h.GSTIN || h.GSTNo || h.GstNo || h.GSTNumber || '').trim(),
        bankACName:     String(h.ACName || h.BankACName || h.AccountName || '').trim(),
        bankName:       String(h.BankName || h.Bank || '').trim(),
        bankACNo:       String(h.ACNo || h.AccountNo || h.BankACNo || '').trim(),
        bankIFSC:       String(h.IFSCCode || h.IFSC || h.IFSCode || '').trim(),
        upiId:          String(h.UPIId || h.UPIID || h['UPI Id'] || '').trim()
    };
}
function normalizeServerPrintPayload(res) {
    if (!res) return null;
    if (res.clientName && res.lines) return res;
    var fromGenerate = normalizeInvoiceGenerateShapeForPrint(res);
    if (fromGenerate) return fromGenerate;
    if (res.ClientName) {
        return {
            clientName:     String(res.ClientName || '').trim(),
            clientAddress:  String(res.ClientAddress || '').trim(),
            orderNo:        String(res.OrderNo || '').trim(),
            packingNo:      String(res.PackingNo || res.ChallanNo || '').trim(),
            vehicleNo:      String(res.VehicleNo || '').trim(),
            invoiceDate:    formatDateDmyFromApi(res.InvoiceDate || ''),
            invoiceNo:      String(res.InvoiceNo || '').trim(),
            terms:          res.TermsAndconditions != null ? String(res.TermsAndconditions) : (res.TermsAndConditions || res.Terms || ''),
            bank:           res.Bankdetails != null ? String(res.Bankdetails) : (res.BankDetails || res.Bank || ''),
            total:          parseNum(res.Total || res.InvoiceTotal),
            lines: (res.Lines || []).map(function (L) {
                return {
                    itemCode: String(L['Item Code'] || L.ItemCode || L.itemCode || '').trim(),
                    itemName: String(L['Item Name'] || L.ItemName || L.itemName || '').trim(),
                    qty:      parseNum(L.Qty || L.qty),
                    mrp:      parseNum(L.MRP || L.mrp),
                    scanMrp:  parseNum(L['Scan MRP'] != null ? L['Scan MRP'] : (L.ScanMRP || L.scanMrp)),
                    discPct:  parseNum(L.DiscountPercent || L.discPct),
                    discAmt:  parseNum(L.DiscountAmount || L.discAmt),
                    hsn:      String(L.HSNCode || L.HSN || L.hsn || '').trim(),
                    gstPct:   parseNum(L.GST != null ? L.GST : (L.GSTRate || L.gstPct)),
                    taxAmt:   parseNum(L.TaxAmount || L.taxAmt),
                    amount:   parseNum(L.Amount || L.amount)
                };
            }),
            companyName:    String(res.CompanyName || '').trim(),
            companyAddress: String(res.Address || res.WarehouseAddress || '').trim(),
            companyPhone:   String(res.Phone || res.ContactNo || '').trim(),
            companyEmail:   String(res.Email || res.EmailId || '').trim(),
            companyGstin:   String(res.GSTIN || res.GSTNo || '').trim(),
            bankACName:     String(res.ACName || res.AccountName || '').trim(),
            bankName:       String(res.BankName || '').trim(),
            bankACNo:       String(res.ACNo || res.AccountNo || '').trim(),
            bankIFSC:       String(res.IFSCCode || res.IFSC || '').trim(),
            upiId:          String(res.UPIId || res.UPIID || res['UPI Id'] || '').trim()
        };
    }
    return null;
}
function buildPrintHtml(snap, upiQrDataUrl) {
    if (!snap) return '';
    var flags = getInvoicePrintFlags();
    var showHsn = flags.hsn;
    var showDisc = flags.discount;
    var showMrp = flags.mrp;
    var showTax = flags.tax;
    var showRoundOff = flags.roundOff;
    var showTerms = flags.terms;
    var showBank = flags.bank;
    var showUpiQr = flags.upiQr;

    /* ── Company info: snap (from API header) takes priority; FixParameter is fallback ── */
    var fp = (FixParameter && FixParameter[0]) ? FixParameter[0] : {};
    function fpVal() {
        for (var _i = 0; _i < arguments.length; _i++) {
            var v = fp[arguments[_i]];
            if (v != null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    }
    function snapOrFp(snapField) {
        var sv = snap[snapField];
        if (sv != null && String(sv).trim() !== '') return String(sv).trim();
        for (var _j = 1; _j < arguments.length; _j++) { var fv = fp[arguments[_j]]; if (fv != null && String(fv).trim() !== '') return String(fv).trim(); }
        return '';
    }
    var companyName    = snapOrFp('companyName','CompanyName','companyName','CompanyShortName','CompanyNameForShow') || G_CompanyCode || '';
    var companyAddr    = snapOrFp('companyAddress','Address','address','WarehouseAddress','warehouseAddress','Warehouse','warehouse');
    var companyPhone   = snapOrFp('companyPhone','Phone','phone','ContactNo','contactNo','MobileNo','mobileNo');
    var companyEmail   = snapOrFp('companyEmail','Email','email','EmailId','emailId','EmailAddress');
    var companyGstin   = snapOrFp('companyGstin','GSTIN','gstin','GSTNo','gstNo','GSTNumber','gstNumber');
    var bankACName     = snapOrFp('bankACName','ACName','acName','BankACName','bankACName','AccountName','accountName') || companyName;
    var bankName       = snapOrFp('bankName','BankName','bankName') || '';
    var bankACNo       = snapOrFp('bankACNo','ACNo','acNo','AccountNo','accountNo','BankACNo','bankACNo') || '';
    var bankIFSC       = snapOrFp('bankIFSC','IFSCCode','ifscCode','IFSC','ifsc','IFSCode') || '';
    var clientAddress  = String(snap.clientAddress || '').trim();
    var upiId          = resolveUpiIdFromSnap(snap);
    var payAmount      = getInvoicePrintPayAmount(snap);

    /* ── Table header ── */
    var th = '<th class="tc">Sr<br>No</th>';
    th += '<th>Description</th>';
    th += '<th>Products</th>';
    th += '<th class="tr">Quantity</th>';
    if (showMrp) th += '<th class="tr">MRP<br>Per Unit</th>';
    if (showDisc) th += '<th class="tr">Discount%</th>';
    if (showHsn)  th += '<th class="tc">HSN</th>';
    if (showTax)  th += '<th class="tr">GST<br>%</th><th class="tr">Tax<br>Amt</th>';
    th += '<th class="tr">Total<br>Amount</th>';

    var prodColCount = 4;
    if (showMrp) prodColCount++;
    if (showDisc) prodColCount++;
    if (showHsn) prodColCount++;
    if (showTax) prodColCount += 2;
    prodColCount++;

    /* ── Table rows ── */
    var rows = '';
    var totTax = 0;
    (snap.lines || []).forEach(function (ln, i) {
        var taxAmt = parseNum(ln.taxAmt);
        if (showTax) totTax += taxAmt;
        rows += '<tr>';
        rows += '<td class="tc">' + (i + 1) + '</td>';
        rows += '<td>' + (ln.itemName || '') + '</td>';
        rows += '<td class="tc">' + (ln.itemCode || '') + '</td>';
        rows += '<td class="tr">' + ln.qty + '</td>';
        if (showMrp) rows += '<td class="tr">' + formatMoney(ln.scanMrp) + '</td>';
        if (showDisc) rows += '<td class="tr">' + formatMoney(ln.discPct) + '</td>';
        if (showHsn)  rows += '<td class="tc">' + (ln.hsn || '') + '</td>';
        if (showTax) {
            rows += '<td class="tr">' + formatMoney(ln.gstPct) + '</td>';
            rows += '<td class="tr">' + formatMoney(taxAmt) + '</td>';
        }
        rows += '<td class="tr fw">' + formatMoney(ln.amount) + '</td>';
        rows += '</tr>';
    });

    var sumQty = 0;
    var sumLineAmt = 0;
    (snap.lines || []).forEach(function (ln) {
        sumQty += parseNum(ln.qty);
        sumLineAmt += parseNum(ln.amount);
    });

    var totCgst = totTax / 2;
    var totSgst = totTax / 2;
    var finalAmt = parseNum(snap.total);
    var invSummary = calcInvoiceSummaryFromLines(snap.lines || []);
    if (totTax <= 0 && invSummary.totalTax > 0) {
        totTax = invSummary.totalTax;
        totCgst = invSummary.cgst;
        totSgst = invSummary.sgst;
    }
    if (!(finalAmt > 0)) {
        finalAmt = invSummary.taxableAmount + invSummary.totalTax;
    }
    var roundCalc = calcAmountRoundOff(finalAmt);
    var displayFinalAmt = showRoundOff ? roundCalc.rounded : finalAmt;
    var sideColW = '240px';

    var lineTotalRow = '<tr class="line-total-row">';
    lineTotalRow += '<td colspan="3" class="tl">Total</td>';
    lineTotalRow += '<td class="tr">' + sumQty + '</td>';
    if (showMrp) lineTotalRow += '<td></td>';
    if (showDisc) lineTotalRow += '<td></td>';
    if (showHsn) lineTotalRow += '<td></td>';
    if (showTax) {
        lineTotalRow += '<td></td>';
        lineTotalRow += '<td class="tr">&#8377;&nbsp;' + formatMoney(totTax) + '</td>';
    }
    lineTotalRow += '<td class="tr">&#8377;&nbsp;' + formatMoney(sumLineAmt) + '</td>';
    lineTotalRow += '</tr>';

    function buildSummaryRowHtml(label, value, isNet) {
        var cls = isNet ? ' class="net"' : '';
        return '<tr' + cls + '><td class="lbl">' + label + '</td><td class="val">&#8377;&nbsp;' + formatMoney(value) + '</td></tr>';
    }
    var summaryRows = '';
    summaryRows += buildSummaryRowHtml('Total MRP', invSummary.totalMrp, false);
    summaryRows += buildSummaryRowHtml('Total Discount', invSummary.totalDiscount, false);
    summaryRows += buildSummaryRowHtml('Taxable Amount', invSummary.taxableAmount, false);
    if (showTax) {
        summaryRows += buildSummaryRowHtml('CGST', totCgst, false);
        summaryRows += buildSummaryRowHtml('SGST', totSgst, false);
    }
    if (showRoundOff) {
        summaryRows += buildSummaryRowHtml('Round Off', roundCalc.roundOff, false);
    }
    summaryRows += buildSummaryRowHtml('Net Amount', displayFinalAmt, true);

    /* ── Styles ── */
    var css = [
        '@page{size:A4;margin:8mm}',
        '*{box-sizing:border-box;margin:0;padding:0}',
        'html,body{height:100%;margin:0;padding:0}',
        'body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;padding:5px;display:flex;flex-direction:column;min-height:100%}',
        '@media print{body{padding:0;min-height:100%}}',

        /* Outer frame — fills page height via flex so footer reaches bottom */
        '.wrap{border:1.5px solid #000;width:100%;display:flex;flex-direction:column;flex:1}',

        /* Spacer between product table and footer — grows to fill empty space */
        '.table-spacer{flex:1}',

        /* Company header */
        '.hdr{border-bottom:1.5px solid #000;padding:8px 12px;text-align:center}',
        '.hdr .doc-type{font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase}',
        '.hdr .co-name{font-size:22px;font-weight:bold;text-transform:uppercase;letter-spacing:.4px;margin:3px 0}',
        '.hdr .co-addr,.hdr .co-contact,.hdr .co-gstin{font-size:11px;margin-top:2px}',

        /* Client / Invoice info */
        '.info-row{display:table;width:100%;border-collapse:collapse;border-bottom:1px solid #000}',
        '.info-left{display:table-cell;padding:7px 12px;border-right:1px solid #000;vertical-align:top;width:60%}',
        '.info-right{display:table-cell;padding:7px 12px;vertical-align:top}',
        '.info-line{margin-bottom:3px;font-size:12px;line-height:1.4}',
        '.lbl{font-weight:bold}',

        /* Product table */
        'table.prod{border-collapse:collapse;width:100%;font-size:11px}',
        'table.prod th,table.prod td{border:1px solid #000;padding:4px 6px}',
        'table.prod th{background:#e0e0e0;text-align:center;font-size:11px;font-weight:bold;vertical-align:middle}',
        'table.prod th.sec-title-th{text-align:left;font-size:12px;padding:5px 12px;background:#e0e0e0}',
        'table.prod tbody td{vertical-align:top}',
        '.tc{text-align:center!important}',
        '.tr{text-align:right!important}',
        '.tl{text-align:left!important}',
        '.fw{font-weight:bold}',
        'tr.line-total-row td{vertical-align:middle}',

        /* Summary panel — right-aligned box */
        '.summary-row{display:table;width:100%;border-collapse:collapse}',
        '.summary-spacer{display:table-cell;border-right:1px solid #000}',
        '.summary-box{display:table-cell;width:230px;vertical-align:top}',
        'table.sum{border-collapse:collapse;width:100%;font-size:11.5px}',
        'table.sum td{padding:4px 8px;border-bottom:1px solid #ddd;vertical-align:middle}',
        'table.sum td.lbl{border-right:1px solid #000;white-space:nowrap;text-align:left}',
        'table.sum td.val{text-align:right;min-width:90px}',
        'table.sum tr:last-child td{border-bottom:none}',
        'table.sum tr.net td{border-top:2px solid #000;border-bottom:2px solid #000}',

        /* Footer */
        '.footer-row{display:table;width:100%;border-collapse:collapse;border-top:1.5px solid #000}',
        '.footer-left{display:table-cell;padding:8px 12px;border-right:1px solid #000;font-size:11px;line-height:1.7;vertical-align:top}',
        '.footer-right{display:table-cell;width:230px;padding:8px;text-align:center;vertical-align:top;font-size:11px}',
        '.for-co{font-weight:bold;font-size:12px;margin-bottom:6px;line-height:1.4}',
        '.footer-bank{margin-top:6px;padding-top:6px;border-top:1px solid #ccc}',
        '.upi-box{border:1px solid #999;padding:6px;width:100%}',
        '.upi-box .upi-title{font-size:10px;font-weight:bold;margin-bottom:4px}',
        '.upi-box img{width:100px;height:100px;display:block;margin:0 auto 4px}',
        '.upi-box .upi-id{font-size:9px;word-break:break-all;margin-bottom:2px}',
        '.upi-box .upi-amt{font-size:11px;font-weight:bold}',

        /* Signature row */
        '.sig-row{display:table;width:100%;border-collapse:collapse;border-top:1px solid #000}',
        '.sig-left{display:table-cell;padding:26px 12px 10px;border-right:1px solid #000;text-align:center;font-size:11px}',
        '.sig-right{display:table-cell;width:230px;padding:26px 12px 10px;text-align:center;font-size:11px;font-weight:bold}',

        /* Footer block: keep together, always at bottom */
        '.footer-block{margin-top:auto}',
        '@media print{.footer-block{break-inside:avoid;page-break-inside:avoid}',
        'table.prod tbody tr{break-inside:avoid;page-break-inside:avoid}}'
    ].join('');

    var esc = function (s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    };

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Tax Invoice ' + esc(snap.invoiceNo || '') + '</title>';
    html += '<style>' + css + '</style></head><body>';
    html += '<div class="wrap">';

    /* ── 1. Company header ── */
    html += '<div class="hdr">';
    html += '<div class="doc-type">Tax Invoice (GST)</div>';
    if (companyName) html += '<div class="co-name">' + esc(companyName) + '</div>';
    if (companyAddr)    html += '<div class="co-addr">' + esc(companyAddr) + '</div>';
    var contactParts = [];
    if (companyPhone) contactParts.push('Ph.:- ' + esc(companyPhone));
    if (companyEmail) contactParts.push('E-mail:- ' + esc(companyEmail));
    if (contactParts.length) html += '<div class="co-contact">' + contactParts.join(', ') + '</div>';
    if (companyGstin) html += '<div class="co-gstin">GSTIN :- <strong>' + esc(companyGstin) + '</strong></div>';
    html += '</div>';

    /* ── 2. Client + Invoice info ── */
    html += '<div class="info-row">';
    html += '<div class="info-left">';
    html += '<div class="info-line"><span class="lbl">Client Name :-</span> ' + esc(snap.clientName || '') + '</div>';
    if (clientAddress && clientAddress.toLowerCase() !== 'n/a') {
        html += '<div class="info-line"><span class="lbl">ADDRESS :-</span> ' + esc(clientAddress) + '</div>';
    }
    if (snap.orderNo)   html += '<div class="info-line"><span class="lbl">Order No :-</span> ' + esc(snap.orderNo) + '</div>';
    if (snap.packingNo) html += '<div class="info-line"><span class="lbl">Challan No :-</span> ' + esc(snap.packingNo) + '</div>';
    html += '</div>';
    html += '<div class="info-right">';
    html += '<div class="info-line"><span class="lbl">Invoice No :-</span> ' + esc(snap.invoiceNo || '') + '</div>';
    html += '<div class="info-line"><span class="lbl">Date :-</span> ' + esc(snap.invoiceDate || '') + '</div>';
    if (snap.vehicleNo) html += '<div class="info-line"><span class="lbl">Vehicle No :-</span> ' + esc(snap.vehicleNo) + '</div>';
    html += '</div>';
    html += '</div>';

    /* ── 3. Product details table ── */
    html += '<table class="prod"><thead>';
    html += '<tr><th colspan="' + prodColCount + '" class="sec-title-th">Product Details</th></tr>';
    html += '<tr>' + th + '</tr></thead><tbody>' + rows + lineTotalRow + '</tbody></table>';

    /* Summary panel — right below the product table */
    html += '<div class="summary-row">';
    html += '<div class="summary-spacer"></div>';
    html += '<div class="summary-box"><table class="sum"><tbody>' + summaryRows + '</tbody></table></div>';
    html += '</div>';

    /* Spacer — fills empty space, pushes footer to page bottom */
    html += '<div class="table-spacer"></div>';

    /* ── 4. Footer + signatures (pinned to bottom) ── */
    html += '<div class="footer-block">';

    /* Footer: terms/bank LEFT | company/QR RIGHT */
    html += '<div class="footer-row">';
    html += '<div class="footer-left">';
    if (showTerms) {
        html += '<strong>Terms and Conditions</strong><br>';
        if (snap.terms && snap.terms.trim()) {
            html += esc(snap.terms).replace(/\n/g, '<br>');
        } else {
            html += '100% AFTER THE RECEIPT OF MATERIALS WITHIN 45 DAYS BY CHEQUE';
        }
    }
    if (showBank) {
        html += '<div class="footer-bank">';
        html += '<strong>Bank Details :-</strong><br>';
        var hasBankAC = bankACNo || bankIFSC;
        if (hasBankAC) {
            html += 'A/C Name :- ' + esc(bankACName) + '<br>';
            html += 'Bank Name :- ' + esc(bankName || 'NA') + '<br>';
            html += 'Account No. :- ' + esc(bankACNo) + '<br>';
            html += 'IFSC Code :- ' + esc(bankIFSC);
        } else if (bankName) {
            html += 'Bank Name :- ' + esc(bankName) + '<br>';
            html += 'A/C Name :- ' + esc(bankACName);
        } else if (snap.bank && snap.bank.trim()) {
            html += esc(snap.bank).replace(/\n/g, '<br>');
        }
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="footer-right">';
    html += '<div class="for-co">For ' + esc(companyName) + '</div>';
    if (showUpiQr && upiId && upiQrDataUrl) {
        html += '<div class="upi-box">';
        html += '<div class="upi-title">Scan &amp; Pay via UPI</div>';
        html += '<img src="' + upiQrDataUrl + '" alt="UPI QR" />';
        html += '<div class="upi-id">UPI ID: ' + esc(upiId) + '</div>';
        html += '<div class="upi-amt">&#8377;&nbsp;' + formatMoney(payAmount) + '</div>';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    /* Signature row */
    html += '<div class="sig-row">';
    html += '<div class="sig-left">Receiver\'s Signature</div>';
    html += '<div class="sig-right">Authorized Signatory</div>';
    html += '</div>';

    html += '</div>'; /* .footer-block */

    html += '</div>'; /* .wrap */
    html += '<script>window.onload=function(){window.print();}<\/script>';
    html += '</body></html>';
    return html;
}
function mergePrintSnapshotOrderPackingFromGrid(dispatchCode, snap) {
    if (!snap) return snap;
    if (typeof findModelByDispatchCode !== 'function') return snap;
    var m = findModelByDispatchCode(dispatchCode);
    if (!m) return snap;
    if (!String(snap.orderNo || '').trim() && m.orderNo) {
        snap.orderNo = m.orderNo;
    }
    if (!String(snap.packingNo || '').trim() && m.packingNo) {
        snap.packingNo = m.packingNo;
    }
    return snap;
}
function confirmInvoicePrint() {
    persistPrintOptionsUi();
    var d = printOrderDispatchCode;
    var snap = G_PrintSnapshots[d];
    if (!snap) {
        toastr.error('Nothing to print.');
        return;
    }
    var openPrintWindow = function (upiQrDataUrl) {
        var html = buildPrintHtml(snap, upiQrDataUrl || '');
        var w = window.open('', '_blank');
        if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
        } else {
            toastr.warning('Allow pop-ups to print.');
        }
        if (bsModalPrint) bsModalPrint.hide();
    };
    var upiId = resolveUpiIdFromSnap(snap);
    var flags = getInvoicePrintFlags();
    if (!upiId || !flags.upiQr) {
        openPrintWindow('');
        return;
    }
    var fp = (FixParameter && FixParameter[0]) ? FixParameter[0] : {};
    var companyName = String(snap.companyName || fp.CompanyName || G_CompanyCode || '').trim();
    var payAmount = getInvoicePrintPayAmount(snap);
    var upiUri = buildUpiPayUri(upiId, companyName, payAmount, 'Invoice ' + (snap.invoiceNo || ''));
    generateUpiQrDataUrl(upiUri, 130).then(function (dataUrl) {
        openPrintWindow(dataUrl);
    }).catch(function () {
        toastr.warning('UPI QR could not be generated. Printing invoice without QR.');
        openPrintWindow('');
    });
}

/** Direct print (no options modal) — same invoice HTML format as Invoice Master. */
function openInvoicePrintDirect(dispatchCode, done) {
    var code = parseInt(dispatchCode, 10) || 0;
    if (!code) {
        toastr.error('Invalid dispatch for invoice print.');
        if (typeof done === 'function') done(false);
        return;
    }

    var ctx = getInvoicePrintSessionCtx();
    if (!ctx) {
        if (typeof done === 'function') done(false);
        return;
    }

    if (typeof blockUI === 'function') blockUI();
    $.ajax({
        url: ctx.appUrl + API_GET_INVOICE_GENERATE + '?DispatchMaster_Code=' + encodeURIComponent(code),
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', ctx.auth); },
        success: function (res) {
            if (typeof unblockUI === 'function') unblockUI();
            var snap = normalizeServerPrintPayload(res);
            snap = mergePrintSnapshotOrderPackingFromGrid(code, snap);
            if (!snap) {
                toastr.warning('No invoice data for print. Please generate/save invoice first.');
                if (typeof done === 'function') done(false);
                return;
            }
            G_PrintSnapshots[code] = snap;
            printOrderDispatchCode = code;
            confirmInvoicePrint();
            if (typeof done === 'function') done(true);
        },
        error: function () {
            if (typeof unblockUI === 'function') unblockUI();
            toastr.error('Unable to load invoice data for print.');
            if (typeof done === 'function') done(false);
        }
    });
}

function getInvoicePrintSessionCtx() {
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
    var uid = (typeof UserMaster_Code !== 'undefined' && UserMaster_Code != null)
        ? parseInt(String(UserMaster_Code), 10)
        : parseInt(String(auth.UserMaster_Code || 0), 10);
    if (!uid || uid <= 0) {
        toastr.error('User session invalid. Please sign in again.');
        return null;
    }
    return { appUrl: appUrl, auth: auth, userMasterCode: uid };
}

function invPrintPadInvoiceNo() {
    var d = new Date();
    var r = String(Math.floor(Math.random() * 9000) + 1000);
    return 'INV/' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '/' + r;
}

function invPrintPickField(row, keys) {
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (row && row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function invPrintCalcLineAmounts(qty, mrp, scanMrp, discPct, gstPct) {
    qty = parseNum(qty);
    if (!(qty > 0)) qty = 1;
    mrp = parseNum(mrp);
    scanMrp = parseNum(scanMrp);
    discPct = parseNum(discPct);
    gstPct = parseNum(gstPct);
    if (!(scanMrp > 0) && mrp > 0) scanMrp = mrp;
    if (!(gstPct >= 0)) gstPct = 18;
    var discBase = mrp > 0 ? mrp : scanMrp;
    var discAmtUnit = discBase * (discPct / 100);
    var taxableUnit = scanMrp - discAmtUnit;
    var taxAmtUnit = taxableUnit * (gstPct / 100);
    return {
        qty: qty,
        mrp: mrp,
        scanMrp: scanMrp,
        discPct: discPct,
        gstPct: gstPct,
        DiscountAmount: discAmtUnit * qty,
        TaxAmount: taxAmtUnit * qty,
        Amount: (taxableUnit + taxAmtUnit) * qty
    };
}

function invPrintFormatBankDetails(bank) {
    if (!bank) return '';
    function f(key, alt) {
        var v = bank[key];
        if (v == null && alt) v = bank[alt];
        return v != null ? String(v).trim() : '';
    }
    var lines = [];
    var name = f('Bank Name', 'BankName');
    var acNo = f('Account No', 'AccountNo');
    var ifsc = f('IFSC Code', 'IFSCCode');
    var branch = f('Branch', 'Branch');
    var type = f('Type', 'Type');
    if (name) lines.push(name);
    if (acNo) lines.push('ACCOUNT No-' + acNo);
    if (ifsc) lines.push('IFSC Code-' + ifsc);
    if (branch) lines.push('Branch-' + branch);
    if (type) lines.push('Type-' + type);
    return lines.join('\n');
}

function invPrintGetDefaultBankText(banks) {
    var list = Array.isArray(banks) ? banks : [];
    var def = list.find(function (b) {
        var d = String(b['Default Check'] || b.DefaultCheck || '').trim();
        return d === 'Y' || d.toLowerCase() === 'yes';
    });
    return def ? invPrintFormatBankDetails(def) : '';
}

function invPrintMapGenerateLineToSave(row) {
    var itemCode = String(invPrintPickField(row, ['Item Code', 'ItemCode']) || '').trim();
    if (!itemCode) return null;
    var qty = parseNum(invPrintPickField(row, ['Qty', 'Packing Qty', 'Scan Qty', 'Bal Qty', 'Ord Qty']));
    var mrp = parseNum(invPrintPickField(row, ['MRP']));
    var scanMrp = parseNum(invPrintPickField(row, ['Scan MRP', 'ScanMRP', 'SCANMRP']));
    var discPct = parseNum(invPrintPickField(row, ['DiscountPercent', 'Discount', 'Discount %']));
    var hsn = String(invPrintPickField(row, ['HSNCode', 'HSN Code', 'HSN']) || '').trim();
    var gstPct = parseNum(invPrintPickField(row, ['GST', 'GSTRate', 'GST Rate', 'GSTRATE']));
    if (!(gstPct > 0)) gstPct = 18;
    var calc = invPrintCalcLineAmounts(qty, mrp, scanMrp, discPct, gstPct);
    var discAmtApi = parseNum(invPrintPickField(row, ['DiscountAmount', 'Discount Amount']));
    var taxAmtApi = parseNum(invPrintPickField(row, ['TaxAmount', 'Tax Amount']));
    var amountApi = parseNum(invPrintPickField(row, ['Amount', 'Total Amount']));
    return {
        ItemCode: itemCode,
        Qty: calc.qty,
        MRP: calc.mrp,
        ScanMRP: calc.scanMrp,
        DiscountPercent: calc.discPct,
        DiscountAmount: discAmtApi > 0 ? discAmtApi : calc.DiscountAmount,
        GSTRate: calc.gstPct,
        HSNCode: hsn === '' ? 0 : hsn,
        TaxAmount: taxAmtApi > 0 ? taxAmtApi : calc.TaxAmount,
        Amount: amountApi > 0 ? amountApi : calc.Amount
    };
}

function invPrintBuildSavePayloadFromGenerate(dispatchCode, res, defaultBankText) {
    var invHeaders = res && (res.InvoiceHeader || res.invoiceHeader);
    var invLines = res && (res.InvoiceLines || res.invoiceLines);
    var invoiceMasterCode = 0;
    var invoiceNo = '';
    var invoiceDate = todayYmd();
    var vehicleNo = '';
    var terms = '';
    var bank = '';
    var lines = [];

    if (Array.isArray(invHeaders) && invHeaders.length > 0) {
        var hdr = invHeaders[0];
        invoiceMasterCode = parseNum(hdr.InvoiceMaster_Code);
        invoiceNo = String(hdr.InvoiceNo || '').trim();
        if (hdr.InvoiceDate) {
            var d = parseApiDate(hdr.InvoiceDate);
            if (d && !isNaN(d.getTime())) invoiceDate = dateToYmd(d);
        }
        vehicleNo = String(hdr.VehicleNo || '').trim();
        terms = hdr.TermsAndconditions != null
            ? String(hdr.TermsAndconditions)
            : (hdr.TermsAndConditions != null ? String(hdr.TermsAndConditions) : '');
        bank = hdr.Bankdetails != null
            ? String(hdr.Bankdetails)
            : (hdr.BankDetails != null ? String(hdr.BankDetails) : '');
        lines = (invLines || []).map(invPrintMapGenerateLineToSave).filter(Boolean);
    } else {
        var om = (res && (res.OrderMaster || res.orderMaster) || [])[0] || {};
        vehicleNo = String(om.VehicleNo || '').trim();
        lines = (res.OrderDetial || res.OrderDetail || res.orderDetail || [])
            .map(invPrintMapGenerateLineToSave)
            .filter(Boolean);
    }

    if (!invoiceNo) invoiceNo = invPrintPadInvoiceNo();
    if (!(invoiceMasterCode > 0) && !bank && defaultBankText) {
        bank = defaultBankText;
    }
    if (!terms) {
        terms = '100% AFTER THE RECEIPT OF MATERIALS WITHIN 45 DAYS BY CHEQUE';
    }

    return {
        code: invoiceMasterCode > 0 ? invoiceMasterCode : 0,
        jsonHeader: {
            DispatchMaster_Code: parseInt(dispatchCode, 10) || 0,
            InvoiceNo: invoiceNo,
            InvoiceDate: invoiceDate,
            VehicleNo: vehicleNo,
            TermsAndConditions: terms,
            BankDetails: bank
        },
        jsonLines: lines
    };
}

/**
 * Save invoice via Invoice Master API first, then print (same format as Invoice Print).
 * Does not touch InvoiceMaster page UI.
 */
function saveInvoiceMasterThenPrint(dispatchCode, done) {
    var code = parseInt(dispatchCode, 10) || 0;
    if (!code) {
        toastr.error('Invalid dispatch for invoice save/print.');
        if (typeof done === 'function') done(false);
        return;
    }

    var ctx = getInvoicePrintSessionCtx();
    if (!ctx) {
        if (typeof done === 'function') done(false);
        return;
    }

    var apiSave = (typeof API_INVOICE_MASTER_SAVE_DATA !== 'undefined' && API_INVOICE_MASTER_SAVE_DATA)
        ? API_INVOICE_MASTER_SAVE_DATA
        : '/api/OrderMaster/InvoiceMasterSaveData';

    function finishFail(msg) {
        if (typeof unblockUI === 'function') unblockUI();
        if (msg) toastr.error(msg);
        if (typeof done === 'function') done(false);
    }

    function printAfterSave() {
        openInvoicePrintDirect(code, done);
    }

    function postSave(payload) {
        if (!payload.jsonLines || !payload.jsonLines.length) {
            finishFail('No invoice line items found to save.');
            return;
        }
        $.ajax({
            url: ctx.appUrl + apiSave + '?UserMaster_Code=' + encodeURIComponent(ctx.userMasterCode),
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(payload),
            beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', ctx.auth); },
            success: function (response) {
                var row = Array.isArray(response) ? response[0] : response;
                if (row && (row.Status === 'Y' || row.status === 'Y')) {
                    toastr.success(row.Msg || row.msg || 'Invoice saved.');
                    printAfterSave();
                } else {
                    finishFail((row && (row.Msg || row.msg)) ? (row.Msg || row.msg) : 'Invoice save failed.');
                }
            },
            error: function (xhr) {
                var msg = 'Unable to save invoice.';
                if (xhr && xhr.status === 404) {
                    msg = 'Invoice save API not found.';
                } else if (xhr && xhr.responseText) {
                    try {
                        var j = JSON.parse(xhr.responseText);
                        if (j && (j.message || j.Msg)) msg = j.message || j.Msg;
                    } catch (e) { /* ignore */ }
                }
                finishFail(msg);
            }
        });
    }

    if (typeof blockUI === 'function') blockUI();

    $.ajax({
        url: ctx.appUrl + '/api/Master/ShowBankMaster',
        type: 'GET',
        beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', ctx.auth); },
        complete: function (bankXhr) {
            var banks = [];
            try {
                var bankRes = bankXhr.responseJSON;
                if (!bankRes && bankXhr.responseText) bankRes = JSON.parse(bankXhr.responseText);
                banks = Array.isArray(bankRes) ? bankRes : [];
            } catch (e) { banks = []; }
            var defaultBankText = invPrintGetDefaultBankText(banks);

            $.ajax({
                url: ctx.appUrl + API_GET_INVOICE_GENERATE + '?DispatchMaster_Code=' + encodeURIComponent(code),
                type: 'GET',
                beforeSend: function (xhr) { xhr.setRequestHeader('Auth-Key', ctx.auth); },
                success: function (res) {
                    var payload = invPrintBuildSavePayloadFromGenerate(code, res, defaultBankText);
                    postSave(payload);
                },
                error: function () {
                    finishFail('Unable to load invoice data for save.');
                }
            });
        }
    });
}

window.openInvoicePrintDirect = openInvoicePrintDirect;
window.saveInvoiceMasterThenPrint = saveInvoiceMasterThenPrint;
window.confirmInvoicePrint = confirmInvoicePrint;
window.buildPrintHtml = buildPrintHtml;
window.invoiceMasterOpenPrint = invoiceMasterOpenPrint;
window.initInvoicePrintModal = initInvoicePrintModal;

function invoiceMasterOpenPrint(dispatchCode) {
    var code = String(dispatchCode == null ? '' : dispatchCode).trim();
    if (!code || code === '0') {
        toastr.error('Invalid dispatch for invoice print.');
        return;
    }

    printOrderDispatchCode = code;
    delete G_PrintSnapshots[code];
    loadPrintOptionsUi();
    updatePrintButtonEnabled();
    forceClearPageBlockers();

    var openPrintModal = function () {
        var modalPrintEl = document.getElementById('modalPrintInvoice');
        if (!modalPrintEl) {
            toastr.error('Print options modal not found.');
            return;
        }
        if (modalPrintEl.parentElement && modalPrintEl.parentElement !== document.body) {
            document.body.appendChild(modalPrintEl);
        }
        if (!bsModalPrint && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bsModalPrint = bootstrap.Modal.getInstance(modalPrintEl) || new bootstrap.Modal(modalPrintEl);
        }
        if (bsModalPrint) bsModalPrint.show();
    };

    setPrintModalBusy(true);
    openPrintModal();

    tryFetchPrintSnapshot(code, function () {
        forceClearPageBlockers();
        var snap = G_PrintSnapshots[code];
        snap = mergePrintSnapshotOrderPackingFromGrid(code, snap);
        if (snap) {
            G_PrintSnapshots[code] = snap;
        }
        setPrintModalBusy(false);
        if (!G_PrintSnapshots[code]) {
            if (bsModalPrint) bsModalPrint.hide();
            toastr.warning('No invoice data for print. Save invoice first.');
            return;
        }
        updatePrintButtonEnabled();
    });
}

function initInvoicePrintModal() {
    var modalPrintEl = document.getElementById('modalPrintInvoice');
    if (!modalPrintEl) return;

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bsModalPrint = bootstrap.Modal.getInstance(modalPrintEl) || new bootstrap.Modal(modalPrintEl);
    }

    $('#btnInvPrintConfirm').off('click.odPrint').on('click.odPrint', confirmInvoicePrint);
    $('#printModalOptions .form-check-input').off('change.odPrint').on('change.odPrint', onPrintOptionChange);
    $('#modalPrintInvoice').off('shown.bs.modal.odPrint hidden.bs.modal.odPrint')
        .on('shown.bs.modal.odPrint', forceClearPageBlockers)
        .on('hidden.bs.modal.odPrint', forceClearPageBlockers);

    loadPrintOptionsUi();
    updatePrintButtonEnabled();
}

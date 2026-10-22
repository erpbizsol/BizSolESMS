/* GST tax invoice print — ARU-style layout (TAX INVOICE / billed-shipped / CGST-SGST columns). */
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
        var basicRate = parseNum(ln.basicRate);
        var rate = basicRate > 0 ? basicRate : scanMrp;
        var mrp = parseNum(ln.mrp);
        var discAmt = parseNum(ln.discAmt);
        var taxAmt = parseNum(ln.taxAmt);
        var amount = parseNum(ln.amount);
        var discPct = parseNum(ln.discPct);
        var gstPct = parseNum(ln.gstPct);

        totalMrp += rate * qty;
        if (discAmt > 0) {
            totalDiscount += discAmt;
        } else if (discPct > 0) {
            var discBase = mrp > 0 ? mrp : rate;
            totalDiscount += discBase * (discPct / 100) * qty;
        }

        if (amount > 0) {
            taxableAmount += amount - taxAmt;
            totalTax += taxAmt;
        } else {
            var discBase2 = mrp > 0 ? mrp : rate;
            var discUnit = discBase2 * (discPct / 100);
            var taxableUnit = rate - discUnit;
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
        var basicRate = parseNum(L['Basic Rate'] != null ? L['Basic Rate'] : (L.BasicRate != null ? L.BasicRate : L.basicRate));
        var scanMrp = parseNum(L['Scan MRP'] != null ? L['Scan MRP'] : L.ScanMRP);
        if (!(scanMrp > 0) && mrp > 0) {
            scanMrp = mrp;
        }
        if (!(basicRate > 0)) basicRate = scanMrp;
        var rate = basicRate > 0 ? basicRate : scanMrp;
        var discPct = parseNum(L.DiscountPercent != null ? L.DiscountPercent : L.Discount);
        var discBase = mrp > 0 ? mrp : rate;
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
        var taxableUnit = rate - discAmtUnit;
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
            basicRate: basicRate,
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
        /* Party (addressmaster) fields returned by GetInvoiceGenerateData */
        partyMobile:    String(h.MobileNo || h.PartyMobileNo || h.ClientMobileNo || '').trim(),
        partyGstin:     String(h.GSTIN || h.PartyGSTIN || h.ClientGSTIN || '').trim(),
        partyPan:       String(h.PartyPAN || h.PANNo || h.ClientPAN || '').trim(),
        placeOfSupply:  String(h.PlaceOfSupply || h.StateName || '').trim(),
        companyName:    String(h.CompanyName || '').trim(),
        companyAddress: String(h.Address || h.WarehouseAddress || '').trim(),
        companyPhone:   String(h.Phone || h.ContactNo || h.CompanyMobileNo || '').trim(),
        companyEmail:   String(h.Email || h.EmailId || '').trim(),
        /* `GSTIN` is now the party's GSTIN — company GSTIN must come from a company-specific alias (or FixParameter). */
        companyGstin:   String(h.CompanyGSTIN || h.GSTNo || h.GstNo || h.GSTNumber || '').trim(),
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
                    basicRate: parseNum(L['Basic Rate'] != null ? L['Basic Rate'] : (L.BasicRate != null ? L.BasicRate : (L.basicRate || 0))),
                    scanMrp:  parseNum(L['Scan MRP'] != null ? L['Scan MRP'] : (L.ScanMRP || L.scanMrp)),
                    discPct:  parseNum(L.DiscountPercent || L.discPct),
                    discAmt:  parseNum(L.DiscountAmount || L.discAmt),
                    hsn:      String(L.HSNCode || L.HSN || L.hsn || '').trim(),
                    gstPct:   parseNum(L.GST != null ? L.GST : (L.GSTRate || L.gstPct)),
                    taxAmt:   parseNum(L.TaxAmount || L.taxAmt),
                    amount:   parseNum(L.Amount || L.amount)
                };
            }),
            partyMobile:    String(res.MobileNo || res.PartyMobileNo || '').trim(),
            partyGstin:     String(res.GSTIN || res.PartyGSTIN || '').trim(),
            partyPan:       String(res.PartyPAN || res.PANNo || '').trim(),
            placeOfSupply:  String(res.PlaceOfSupply || res.StateName || '').trim(),
            companyName:    String(res.CompanyName || '').trim(),
            companyAddress: String(res.Address || res.WarehouseAddress || '').trim(),
            companyPhone:   String(res.Phone || res.ContactNo || '').trim(),
            companyEmail:   String(res.Email || res.EmailId || '').trim(),
            companyGstin:   String(res.CompanyGSTIN || res.GSTNo || '').trim(),
            bankACName:     String(res.ACName || res.AccountName || '').trim(),
            bankName:       String(res.BankName || '').trim(),
            bankACNo:       String(res.ACNo || res.AccountNo || '').trim(),
            bankIFSC:       String(res.IFSCCode || res.IFSC || '').trim(),
            upiId:          String(res.UPIId || res.UPIID || res['UPI Id'] || '').trim()
        };
    }
    return null;
}
function invPrint2PadTime(n) {
    return String(n).padStart(2, '0');
}
function invPrint2FormatDatedWithTime(dmyStr) {
    var d = new Date();
    var datePart = String(dmyStr || '').trim();
    if (datePart) {
        var parsed = parseApiDate(datePart);
        if (parsed && !isNaN(parsed.getTime())) d = parsed;
    }
    var h = d.getHours();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return datePart + ' ( ' + invPrint2PadTime(h) + ':' + invPrint2PadTime(d.getMinutes()) + ' ' + ampm + ' )';
}
function invPrint2WordsBelow100(n) {
    var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    n = Math.floor(n);
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return '';
}
function invPrint2WordsNumber(n) {
    n = Math.floor(n);
    if (n === 0) return 'Zero';
    var parts = [];
    if (n >= 10000000) {
        parts.push(invPrint2WordsBelow100(Math.floor(n / 10000000)) + ' Crore');
        n %= 10000000;
    }
    if (n >= 100000) {
        parts.push(invPrint2WordsBelow100(Math.floor(n / 100000)) + ' Lakh');
        n %= 100000;
    }
    if (n >= 1000) {
        parts.push(invPrint2WordsBelow100(Math.floor(n / 1000)) + ' Thousand');
        n %= 1000;
    }
    if (n >= 100) {
        parts.push(invPrint2WordsBelow100(Math.floor(n / 100)) + ' Hundred');
        n %= 100;
    }
    if (n > 0) parts.push(invPrint2WordsBelow100(n));
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}
function invPrint2AmountInWords(amount) {
    var amt = parseNum(amount);
    if (!(amt >= 0)) amt = 0;
    var rupees = Math.floor(amt);
    var paise = Math.round((amt - rupees) * 100);
    var text = invPrint2WordsNumber(rupees);
    if (paise > 0) {
        text += ' and ' + invPrint2WordsNumber(paise) + ' Paise';
    }
    return 'Rupees ' + text + ' Only';
}
function invPrint2TaxBreakdownByRate(lines) {
    var map = {};
    (lines || []).forEach(function (ln) {
        var gstPct = parseNum(ln.gstPct);
        if (!(gstPct > 0)) gstPct = 18;
        var taxAmt = parseNum(ln.taxAmt);
        var amount = parseNum(ln.amount);
        var taxable = amount - taxAmt;
        if (!(taxable > 0) && taxAmt > 0) taxable = taxAmt / (gstPct / 100);
        var key = String(gstPct);
        if (!map[key]) {
            map[key] = { gstPct: gstPct, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
        }
        map[key].taxable += taxable;
        map[key].cgst += taxAmt / 2;
        map[key].sgst += taxAmt / 2;
        map[key].totalTax += taxAmt;
    });
    return Object.keys(map).sort(function (a, b) { return parseFloat(a) - parseFloat(b); }).map(function (k) { return map[k]; });
}
/**
 * Bank block, one field per line:
 *   YES BANK
 *   ACCOUNT No-030292000003650
 *   IFSC Code-YESB00302
 *   Branch-NOIDA
 *   Type-Current
 * Uses structured fields when present, otherwise the saved multi-line bank text.
 */
function invPrint2BuildBankLines(snap, bankName, bankACNo, bankIFSC, bankBranch, bankType) {
    if (bankName || bankACNo || bankIFSC || bankBranch || bankType) {
        var out = [];
        if (bankName) out.push(bankName);
        if (bankACNo) out.push('ACCOUNT No-' + bankACNo);
        if (bankIFSC) out.push('IFSC Code-' + bankIFSC);
        if (bankBranch) out.push('Branch-' + bankBranch);
        if (bankType) out.push('Type-' + bankType);
        return out;
    }
    var raw = snap && snap.bank ? String(snap.bank).trim() : '';
    if (!raw) return [];
    return raw.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
}
function invPrint2DefaultTermsHtml() {
    return '1. Goods once sold will not be taken back after 3 months<br>'
        + '2. Interest @18% p.a. will be charged if the payment is delayed<br>'
        + '3. Subject to local jurisdiction only';
}
function buildPrintHtml(snap, upiQrDataUrl) {
    if (!snap) return '';
    var flags = getInvoicePrintFlags();
    /* Fixed GST invoice column set (matches supplied PDF/screenshot). */
    var showHsn = true;
    var showDisc = true;
    var showTax = true;
    var showRoundOff = flags.roundOff;
    var showTerms = flags.terms;
    var showBank = flags.bank;
    var showUpiQr = flags.upiQr;

    var fp = (FixParameter && FixParameter[0]) ? FixParameter[0] : {};
    function snapOrFp(snapField) {
        var sv = snap[snapField];
        if (sv != null && String(sv).trim() !== '') return String(sv).trim();
        for (var _j = 1; _j < arguments.length; _j++) {
            var fv = fp[arguments[_j]];
            if (fv != null && String(fv).trim() !== '') return String(fv).trim();
        }
        return '';
    }
    var companyName = snapOrFp('companyName', 'CompanyName', 'CompanyShortName', 'CompanyNameForShow') || G_CompanyCode || '';
    var companyAddr = snapOrFp('companyAddress', 'Address', 'WarehouseAddress', 'warehouseAddress', 'Warehouse', 'warehouse');
    var companyPhone = snapOrFp('companyPhone', 'Phone', 'ContactNo', 'MobileNo');
    var companyEmail = snapOrFp('companyEmail', 'Email', 'EmailId', 'EmailAddress');
    var companyGstin = snapOrFp('companyGstin', 'GSTIN', 'GSTNo', 'GSTNumber');
    var partyMobile = String(snap.partyMobile || '').trim();
    var partyGstin = String(snap.partyGstin || '').trim();
    var partyPan = String(snap.partyPan || '').trim();
    var companyCin = snapOrFp('', 'CIN', 'CINNo', 'cin');
    var companyPan = snapOrFp('', 'PAN', 'PANNo', 'PanNo');
    var placeOfSupply = snapOrFp('placeOfSupply', 'PlaceOfSupply', 'StateName', 'State');
    var bankName = snapOrFp('bankName', 'BankName') || '';
    var bankACNo = snapOrFp('bankACNo', 'ACNo', 'AccountNo', 'BankACNo') || '';
    var bankIFSC = snapOrFp('bankIFSC', 'IFSCCode', 'IFSC', 'IFSCode') || '';
    var bankBranch = snapOrFp('', 'Branch', 'BankBranch', 'branch');
    var bankType = snapOrFp('', 'Type', 'AccountType', 'BankType');
    var clientName = String(snap.clientName || '').trim() || 'COUNTER CUSTOMER';
    var clientAddress = String(snap.clientAddress || '').trim();
    var upiId = resolveUpiIdFromSnap(snap);
    var payAmount = getInvoicePrintPayAmount(snap);
    var transportName = companyName;
    var datedStr = invPrint2FormatDatedWithTime(snap.invoiceDate || todayDmy());

    var esc = function (s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    var colCount = 11;
    if (!showHsn) colCount--;
    if (!showDisc) colCount--;
    if (!showTax) colCount -= 4;

    var rows = '';
    var sumQty = 0;
    var sumAmt = 0;
    (snap.lines || []).forEach(function (ln, i) {
        var qty = parseNum(ln.qty);
        if (!(qty > 0)) qty = 1;
        sumQty += qty;
        var discPct = parseNum(ln.discPct);
        var taxAmt = parseNum(ln.taxAmt);
        var amount = parseNum(ln.amount);
        sumAmt += amount;
        var gstPct = parseNum(ln.gstPct);
        if (!(gstPct > 0)) gstPct = 18;
        var listPrice = parseNum(ln.basicRate);
        if (!(listPrice > 0)) listPrice = parseNum(ln.scanMrp);
        if (!(listPrice > 0)) listPrice = parseNum(ln.mrp);
        if (!(listPrice > 0) && qty > 0) {
            var taxableLine = amount - taxAmt;
            if (!(taxableLine > 0) && amount > 0) taxableLine = amount / (1 + gstPct / 100);
            listPrice = taxableLine / qty;
        }
        var halfRate = gstPct / 2;
        var cgstAmt = taxAmt / 2;
        var sgstAmt = taxAmt / 2;
        var desc = (ln.itemCode ? esc(ln.itemCode) + ' ' : '') + esc(ln.itemName || '');

        rows += '<tr>';
        rows += '<td class="tc">' + (i + 1) + '.</td>';
        rows += '<td class="desc">' + desc + '</td>';
        if (showHsn) rows += '<td class="tc">' + esc(ln.hsn || '') + '</td>';
        rows += '<td class="tr">' + formatMoney(qty) + '</td>';
        rows += '<td class="tc">Pcs.</td>';
        rows += '<td class="tr">' + formatMoney(listPrice) + '</td>';
        if (showDisc) rows += '<td class="tr">' + formatMoney(discPct) + ' %</td>';
        if (showTax) {
            rows += '<td class="tr">' + formatMoney(halfRate) + ' %</td>';
            rows += '<td class="tr">' + formatMoney(cgstAmt) + '</td>';
            rows += '<td class="tr">' + formatMoney(halfRate) + ' %</td>';
            rows += '<td class="tr">' + formatMoney(sgstAmt) + '</td>';
        }
        rows += '<td class="tr">' + formatMoney(amount) + '</td>';
        rows += '</tr>';
    });

    var finalAmt = parseNum(snap.total);
    var invSummary = calcInvoiceSummaryFromLines(snap.lines || []);
    if (!(finalAmt > 0)) finalAmt = invSummary.taxableAmount + invSummary.totalTax;
    var roundCalc = calcAmountRoundOff(finalAmt);
    var displayFinalAmt = showRoundOff ? roundCalc.rounded : finalAmt;
    if (sumAmt > 0 && Math.abs(sumAmt - finalAmt) > 0.01) {
        displayFinalAmt = showRoundOff ? calcAmountRoundOff(sumAmt).rounded : sumAmt;
    }

    var taxRows = '';
    invPrint2TaxBreakdownByRate(snap.lines || []).forEach(function (tb) {
        taxRows += '<tr>';
        var rateLabel = (Math.abs(tb.gstPct - Math.round(tb.gstPct)) < 0.001)
            ? (String(Math.round(tb.gstPct)) + '%')
            : (formatMoney(tb.gstPct) + '%');
        taxRows += '<td class="tc">' + rateLabel + '</td>';
        taxRows += '<td class="tr">' + formatMoney(tb.taxable) + '</td>';
        taxRows += '<td class="tr">' + formatMoney(tb.cgst) + '</td>';
        taxRows += '<td class="tr">' + formatMoney(tb.sgst) + '</td>';
        taxRows += '<td class="tr">' + formatMoney(tb.totalTax) + '</td>';
        taxRows += '</tr>';
    });

    var grandCells = '<td colspan="3" class="tc">Grand Total</td>';
    grandCells += '<td colspan="2" class="tr">' + formatMoney(sumQty) + ' Pcs.</td>';
    grandCells += '<td></td><td></td><td></td><td></td><td></td><td></td>';
    grandCells += '<td class="tc">&#8377;</td>';
    grandCells += '<td class="tr">' + formatMoney(displayFinalAmt) + '</td>';

    /* Blank grid row — stretches to fill space between items and Grand Total so the footer stays at the page bottom. */
    var fillRow = '<tr class="fill">';
    for (var fc = 0; fc < 12; fc++) fillRow += '<td></td>';
    fillRow += '</tr>';

    var partyLines = '<div class="cust-name">' + esc(clientName) + '</div>';
    if (clientAddress && clientAddress.toLowerCase() !== 'n/a') {
        partyLines += '<div>' + esc(clientAddress) + '</div>';
    }
    partyLines += '<div class="party-gap"></div>';
    partyLines += '<div>Party PAN : ' + esc(partyPan) + '</div>';
    partyLines += '<div>Party Mobile No : ' + esc(partyMobile) + '</div>';
    partyLines += '<div>Party AadhaarNo :</div>';
    partyLines += '<div>GSTIN / UIN : ' + esc(partyGstin) + '</div>';

    var css = [
        '@page{size:A4;margin:6mm}',
        '*{box-sizing:border-box;margin:0;padding:0}',
        'html,body{height:100%}',
        'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000}',
        'table.sheet{width:100%;height:100%;border-collapse:collapse;border:1px solid #000}',
        'table.sheet>tbody>tr>td{border-bottom:1px solid #000;vertical-align:top}',
        'table.sheet>tbody>tr:last-child>td{border-bottom:none}',
        'tr.grow{height:100%}',
        'tr.grow>td{border-bottom:none!important;height:100%;padding:0}',
        '.goods-stack{height:100%;display:flex;flex-direction:column}',
        'table.goods.head,table.goods.total{flex:0 0 auto;height:auto}',
        'table.goods.lines{flex:1 1 auto;height:100%}',
        '.hdr{padding:4px 8px 6px;text-align:center;line-height:1.35}',
        '.hdr-top{width:100%;border-collapse:collapse;margin-bottom:2px}',
        '.hdr-top td{border:none;padding:0;font-size:11px;vertical-align:middle}',
        '.gstin{text-align:left;font-weight:bold;width:33%}',
        '.doc-title{text-align:center;font-weight:bold;font-size:13px;width:34%}',
        '.orig{text-align:right;font-style:italic;font-size:11px;width:33%}',
        '.co-name{font-size:16px;font-weight:bold;text-transform:uppercase;margin-top:2px}',
        '.co-addr{font-size:10.5px}',
        '.co-email{font-size:10.5px;font-style:italic}',
        'table.split{width:100%;border-collapse:collapse;font-size:11px}',
        'table.split td{width:50%;border:none;border-right:1px solid #000;padding:4px 8px;vertical-align:top;line-height:1.45}',
        'table.split td:last-child{border-right:none}',
        '.lbl{font-weight:bold}',
        '.cust-name{font-weight:bold;margin-top:2px}',
        '.party-gap{height:8px}',
        'table.goods{width:100%;border-collapse:collapse;font-size:10px;table-layout:fixed}',
        'table.goods th,table.goods td{border-right:1px solid #000;padding:2px 3px;vertical-align:middle;line-height:1.3}',
        'table.goods th:last-child,table.goods td:last-child{border-right:none}',
        'table.goods thead tr:nth-child(2) th:last-child{border-right:1px solid #000}',
        'table.goods th{text-align:center;font-weight:bold;font-size:10px;border-bottom:1px solid #000}',
        'table.goods.head tbody td{border-bottom:none;height:16px}',
        'table.goods td.desc{text-align:left;word-wrap:break-word}',
        'table.goods tr.fill{height:100%}',
        'table.goods tr.fill td{height:100%;border-bottom:none;vertical-align:top}',
        'table.goods tr.grand td{height:20px;border-top:1px solid #000;border-bottom:1px solid #000;font-weight:bold;vertical-align:middle}',
        '.tc{text-align:center!important}',
        '.tr{text-align:right!important}',
        '.sum-wrap{padding:6px 8px 4px}',
        'table.tax-sum{border-collapse:collapse;width:420px;font-size:10.5px;margin-bottom:6px}',
        'table.tax-sum th,table.tax-sum td{border:1px solid #000;padding:2px 6px}',
        'table.tax-sum th{text-align:center;font-weight:bold}',
        '.words{font-weight:bold;margin:4px 0 6px;font-size:12px}',
        '.bank-block{font-size:11px;line-height:1.45;margin-bottom:2px}',
        'table.foot{width:100%;border-collapse:collapse;height:130px}',
        'table.foot td{border:none;vertical-align:top;padding:8px 10px;font-size:11px;line-height:1.45}',
        'table.foot td.fl{width:50%;border-right:1px solid #000}',
        'table.foot td.fr{position:relative;height:130px}',
        '.terms-hdr{font-weight:bold;text-decoration:underline;margin-bottom:4px}',
        '.recv{font-weight:bold}',
        '.sign-block{position:absolute;right:12px;bottom:10px;text-align:right}',
        '.for-co{font-weight:bold}',
        '.sig-line{font-weight:bold;margin-top:2px}',
        '@media print{html,body{height:100%}table.sheet{height:100%}}'
    ].join('');

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>TAX INVOICE ' + esc(snap.invoiceNo || '') + '</title>';
    html += '<style>' + css + '</style></head><body>';
    html += '<table class="sheet"><tbody>';

    html += '<tr><td class="hdr">';
    html += '<table class="hdr-top"><tr>';
    html += '<td class="gstin">GSTIN : ' + esc(companyGstin) + '</td>';
    html += '<td class="doc-title">TAX INVOICE</td>';
    html += '<td class="orig">Original Copy</td>';
    html += '</tr></table>';
    if (companyName) html += '<div class="co-name">' + esc(companyName) + '</div>';
    if (companyAddr) html += '<div class="co-addr">' + esc(companyAddr) + '</div>';
    if (companyPhone && String(companyAddr || '').indexOf(companyPhone) < 0) {
        html += '<div class="co-addr">MOB NO.' + esc(companyPhone) + '</div>';
    }
    var cinPan = [];
    if (companyCin) cinPan.push('CIN : ' + esc(companyCin));
    if (companyPan) cinPan.push('PAN : ' + esc(companyPan));
    if (cinPan.length) html += '<div class="co-addr">' + cinPan.join(' ; ') + '</div>';
    if (companyEmail) html += '<div class="co-email">email : ' + esc(companyEmail) + '</div>';
    html += '</td></tr>';

    html += '<tr><td style="padding:0"><table class="split"><tr>';
    html += '<td>';
    html += '<div><span class="lbl">Invoice No. :</span> ' + esc(snap.invoiceNo || '') + '</div>';
    html += '<div><span class="lbl">Dated :</span> ' + esc(datedStr) + '</div>';
    html += '<div><span class="lbl">Place of Supply :</span> ' + esc(placeOfSupply) + '</div>';
    html += '<div><span class="lbl">Reverse Charge :</span> N</div>';
    html += '<div><span class="lbl">GR/RR No. :</span></div>';
    html += '</td><td>';
    html += '<div><span class="lbl">Transport :</span> ' + esc(transportName) + '</div>';
    html += '<div><span class="lbl">Vehicle No. :</span> ' + esc(snap.vehicleNo || '') + '</div>';
    html += '<div><span class="lbl">Station :</span></div>';
    html += '<div><span class="lbl">E-Way Bill No. :</span></div>';
    html += '</td></tr></table></td></tr>';

    html += '<tr><td style="padding:0"><table class="split"><tr>';
    html += '<td><div class="lbl">Billed to :</div>' + partyLines + '</td>';
    html += '<td><div class="lbl">Shipped to :</div>' + partyLines + '</td>';
    html += '</tr></table></td></tr>';

    /* 11 shared columns; Amount column is 13% in item rows, split 3% (₹) + 10% (value) in the Grand Total row. */
    var baseCols = '<col style="width:4%"><col style="width:18%"><col style="width:8%">'
        + '<col style="width:6%"><col style="width:5%"><col style="width:8%"><col style="width:8%">'
        + '<col style="width:7%"><col style="width:8%"><col style="width:7%"><col style="width:8%">';
    var goodsCols = '<colgroup>' + baseCols + '<col style="width:13%"></colgroup>';
    var totalCols = '<colgroup>' + baseCols + '<col style="width:3%"><col style="width:10%"></colgroup>';

    html += '<tr class="grow"><td>';
    html += '<div class="goods-stack">';
    html += '<table class="goods head">' + goodsCols + '<thead>';
    html += '<tr>';
    html += '<th rowspan="2">S.N.</th>';
    html += '<th rowspan="2">Description of Goods</th>';
    html += '<th rowspan="2">HSN/SAC<br>Code</th>';
    html += '<th rowspan="2">Qty.</th>';
    html += '<th rowspan="2">Unit</th>';
    html += '<th rowspan="2">List Price</th>';
    html += '<th rowspan="2">Discount</th>';
    html += '<th colspan="2">CGST</th>';
    html += '<th colspan="2">SGST</th>';
    html += '<th rowspan="2">Amount(&#8377;)</th>';
    html += '</tr><tr>';
    html += '<th>Rate</th><th>Amount</th>';
    html += '<th>Rate</th><th>Amount</th>';
    html += '</tr></thead><tbody>' + rows + '</tbody></table>';
    html += '<table class="goods lines">' + goodsCols + '<tbody>' + fillRow + '</tbody></table>';
    html += '<table class="goods total">' + totalCols + '<tbody><tr class="grand">' + grandCells + '</tr></tbody></table>';
    html += '</div></td></tr>';

    html += '<tr><td class="sum-wrap">';
    if (showTax && taxRows) {
        html += '<table class="tax-sum"><thead><tr>';
        html += '<th>Tax Rate</th><th>Taxable Amt.</th><th>CGST Amt.</th><th>SGST Amt.</th><th>Total Tax</th>';
        html += '</tr></thead><tbody>' + taxRows + '</tbody></table>';
    }
    html += '<div class="words">' + esc(invPrint2AmountInWords(displayFinalAmt)) + '</div>';
    if (showBank) {
        var bankLines = invPrint2BuildBankLines(snap, bankName, bankACNo, bankIFSC, bankBranch, bankType);
        if (bankLines.length) {
            html += '<div class="bank-block"><span class="lbl">Bank Details :</span> ' + esc(bankLines[0]);
            for (var bi = 1; bi < bankLines.length; bi++) {
                html += '<br>' + esc(bankLines[bi]);
            }
            html += '</div>';
        }
    }
    html += '</td></tr>';

    html += '<tr><td style="padding:0"><table class="foot"><tr>';
    html += '<td class="fl">';
    if (showTerms) {
        html += '<div class="terms-hdr">Terms &amp; Conditions</div>';
        if (snap.terms && snap.terms.trim()) {
            html += esc(snap.terms).replace(/\n/g, '<br>');
        } else {
            html += invPrint2DefaultTermsHtml();
        }
    }
    html += '</td><td class="fr">';
    html += '<div class="recv">Receiver\'s Signature :</div>';
    html += '<div class="sign-block">';
    html += '<div class="for-co">For ' + esc(companyName) + '</div>';
    html += '<div class="sig-line">Authorised Signatory</div>';
    html += '</div></td></tr></table></td></tr>';

    html += '</tbody></table>';
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

function invPrintCalcLineAmounts(qty, mrp, scanMrp, discPct, gstPct, basicRate) {
    qty = parseNum(qty);
    if (!(qty > 0)) qty = 1;
    mrp = parseNum(mrp);
    scanMrp = parseNum(scanMrp);
    basicRate = parseNum(basicRate);
    discPct = parseNum(discPct);
    gstPct = parseNum(gstPct);
    if (!(scanMrp > 0) && mrp > 0) scanMrp = mrp;
    if (!(basicRate > 0)) basicRate = scanMrp;
    var rate = basicRate > 0 ? basicRate : scanMrp;
    if (!(gstPct >= 0)) gstPct = 18;
    var discBase = mrp > 0 ? mrp : rate;
    var discAmtUnit = discBase * (discPct / 100);
    var taxableUnit = rate - discAmtUnit;
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
    var basicRate = parseNum(invPrintPickField(row, ['Basic Rate', 'BasicRate', 'BASICRATE']));
    var discPct = parseNum(invPrintPickField(row, ['DiscountPercent', 'Discount', 'Discount %']));
    var hsn = String(invPrintPickField(row, ['HSNCode', 'HSN Code', 'HSN']) || '').trim();
    var gstPct = parseNum(invPrintPickField(row, ['GST', 'GSTRate', 'GST Rate', 'GSTRATE']));
    if (!(gstPct > 0)) gstPct = 18;
    var calc = invPrintCalcLineAmounts(qty, mrp, scanMrp, discPct, gstPct, basicRate);
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

    if (G_PrintSnapshots[code]) {
        setPrintModalBusy(false);
        openPrintModal();
        return;
    }

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

/**
 * Reads SessionStorage Fixparameter (from GetFixparameter in Menu.js) and applies:
 * - LevelOfOrderNo → Order No captions / placeholders
 * - LevelOfOrderDate → Order Date captions / placeholders
 * - LevelOfBuyerPONo → Buyer PO No captions / placeholders
 * - LevelOfBuyerPODate → Buyer PO Date captions / placeholders
 * - IsShowOrderNo = Y → Buyer PO No is optional on OrderMaster (hide required *)
 *
 * Hooks used by Filter.js (unchanged): window.esmsGridHeaderHtmlText(columnKey)
 */
(function () {
    'use strict';

    var DEFAULT_ORDER_LABEL = 'Order No';
    var DEFAULT_ORDER_DATE_LABEL = 'Order Date';
    var DEFAULT_BUYER_PO_NO_LABEL = 'Buyer PO No';
    var DEFAULT_BUYER_PO_DATE_LABEL = 'Buyer PO Date';
    var patchedCreateDataTable = false;

    function parseFixparameter() {
        try {
            var raw = sessionStorage.getItem('Fixparameter');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    /** ASP.NET Core JSON often uses camelCase; legacy payloads may use PascalCase. */
    function fixParameterString(row, pascalKey) {
        if (!row || typeof row !== 'object') return '';
        var camelKey = pascalKey.charAt(0).toLowerCase() + pascalKey.slice(1);
        var keys = [pascalKey, camelKey];
        for (var i = 0; i < keys.length; i++) {
            var v = row[keys[i]];
            if (typeof v === 'string' && v.trim()) return v.trim();
        }
        return '';
    }

    window.getLevelOfOrderNoLabel = function getLevelOfOrderNoLabel() {
        var parsed = parseFixparameter();
        if (!parsed) return DEFAULT_ORDER_LABEL;
        var row = Array.isArray(parsed) ? parsed[0] : parsed;
        var v = fixParameterString(row, 'LevelOfOrderNo');
        return v || DEFAULT_ORDER_LABEL;
    };

    /** Validation/toastr copy keyed off Fixparameter LevelOfOrderNo (see OrderMaster.js). */
    window.esmsPleaseEnterLevelOfOrderMsg = function esmsPleaseEnterLevelOfOrderMsg() {
        var label = window.getLevelOfOrderNoLabel();
        return 'Please enter ' + label.toLowerCase() + ' !';
    };

    window.getLevelOfOrderDateLabel = function getLevelOfOrderDateLabel() {
        var parsed = parseFixparameter();
        if (!parsed) return DEFAULT_ORDER_DATE_LABEL;
        var row = Array.isArray(parsed) ? parsed[0] : parsed;
        var v = fixParameterString(row, 'LevelOfOrderDate');
        return v || DEFAULT_ORDER_DATE_LABEL;
    };

    /** Validation/toastr for Order Date (see OrderMaster.js Save). */
    window.esmsPleaseSelectOrderDateMsg = function esmsPleaseSelectOrderDateMsg() {
        return 'Please Select an ' + window.getLevelOfOrderDateLabel() + '!';
    };

    window.getLevelOfBuyerPONoLabel = function getLevelOfBuyerPONoLabel() {
        var parsed = parseFixparameter();
        if (!parsed) return DEFAULT_BUYER_PO_NO_LABEL;
        var row = Array.isArray(parsed) ? parsed[0] : parsed;
        var v = fixParameterString(row, 'LevelOfBuyerPONo');
        return v || DEFAULT_BUYER_PO_NO_LABEL;
    };

    window.getLevelOfBuyerPODateLabel = function getLevelOfBuyerPODateLabel() {
        var parsed = parseFixparameter();
        if (!parsed) return DEFAULT_BUYER_PO_DATE_LABEL;
        var row = Array.isArray(parsed) ? parsed[0] : parsed;
        var v = fixParameterString(row, 'LevelOfBuyerPODate');
        return v || DEFAULT_BUYER_PO_DATE_LABEL;
    };

    window.esmsIsShowOrderNo = function esmsIsShowOrderNo() {
        var parsed = parseFixparameter();
        if (!parsed) return false;
        var row = Array.isArray(parsed) ? parsed[0] : parsed;
        var v = fixParameterString(row, 'IsShowOrderNo');
        return v.toUpperCase() === 'Y';
    };

    /** Buyer PO No is mandatory unless Fixparameter IsShowOrderNo = Y. */
    window.esmsIsBuyerPONoMandatory = function esmsIsBuyerPONoMandatory() {
        return !window.esmsIsShowOrderNo();
    };

    window.esmsPleaseEnterBuyerPONoMsg = function esmsPleaseEnterBuyerPONoMsg() {
        return 'Please enter a ' + window.getLevelOfBuyerPONoLabel() + '!';
    };

    window.esmsPleaseSelectBuyerPODateMsg = function esmsPleaseSelectBuyerPODateMsg() {
        return 'Please Select a ' + window.getLevelOfBuyerPODateLabel() + '!';
    };

    function isOrderNoColumnKey(col) {
        if (col == null || col === '') return false;
        var s = String(col).trim();
        return s === 'Order No' || s === 'OrderNo' || s === 'ORDER NO';
    }

    window.esmsGridHeaderHtmlText = function esmsGridHeaderHtmlText(col) {
        if (isOrderNoColumnKey(col)) return window.getLevelOfOrderNoLabel();
        if (col === 'Order Date' || col === 'OrderDate') return window.getLevelOfOrderDateLabel();
        if (col === 'Buyer PO No' || col === 'BuyerPONo') return window.getLevelOfBuyerPONoLabel();
        if (col === 'Buyer PO Date' || col === 'BuyerPODate') return window.getLevelOfBuyerPODateLabel();
        return col;
    };

    /**
     * Idempotent text replace: skip nodes that already contain the applied label,
     * otherwise repeated runs (draw.dt, CreateDataTable patch, etc.) keep re-prepending
     * the label when it itself contains the original phrase (e.g. "DMS Order No.").
     */
    function replaceTextInLabelElement(el, re, testRe, label) {
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType !== 3) continue;
            if (label && node.nodeValue.indexOf(label) !== -1) continue;
            if (testRe.test(node.nodeValue)) {
                node.nodeValue = node.nodeValue.replace(re, label);
            }
        }
    }

    function replaceOrderNoTextInLabelElement(el, label) {
        replaceTextInLabelElement(el, /\bOrder\s*No\b/gi, /\bOrder\s*No\b/i, label);
    }

    function replaceOrderDateTextInLabelElement(el, label) {
        replaceTextInLabelElement(el, /\bOrder\s*Date\b/gi, /\bOrder\s*Date\b/i, label);
    }

    function replaceBuyerPONoTextInLabelElement(el, label) {
        replaceTextInLabelElement(el, /\bBuyer\s*PO\s*No\b/gi, /\bBuyer\s*PO\s*No\b/i, label);
    }

    function replaceBuyerPODateTextInLabelElement(el, label) {
        replaceTextInLabelElement(el, /\bBuyer\s*PO\s*Date\b/gi, /\bBuyer\s*PO\s*Date\b/i, label);
    }

    function shouldReplaceHeaderCaption(t, prevApplied) {
        if (t === 'Order No' || t === 'OrderNo') return true;
        if (prevApplied && t === prevApplied) return true;
        return false;
    }

    function shouldReplaceOrderDateCaption(t, prevApplied) {
        if (t === 'Order Date' || t === 'OrderDate') return true;
        if (prevApplied && t === prevApplied) return true;
        return false;
    }

    function shouldReplaceBuyerPONoCaption(t, prevApplied) {
        if (t === 'Buyer PO No' || t === 'BuyerPONo') return true;
        if (prevApplied && t === prevApplied) return true;
        return false;
    }

    function shouldReplaceBuyerPODateCaption(t, prevApplied) {
        if (t === 'Buyer PO Date' || t === 'BuyerPODate') return true;
        if (prevApplied && t === prevApplied) return true;
        return false;
    }

    function setThPlainTextIfMatch($th, tOnly, matchSet, newLabel) {
        if (!matchSet.some(function (m) { return tOnly === m; })) return;
        if ($th.contents().filter(function () { return this.nodeType === 3; }).length === 1) {
            var tn = $th.contents().filter(function () { return this.nodeType === 3; })[0];
            if (tn) tn.nodeValue = newLabel;
            return;
        }
        var $fc = $th.contents().first();
        if ($fc.length && $fc[0].nodeType === 3) {
            $fc[0].nodeValue = newLabel;
        }
    }

    function applyLevelOfOrderNoLabelsCore($) {
        if (!$ || !$.fn) return;
        var label = window.getLevelOfOrderNoLabel();
        var prev = typeof window.__esmsLastLevelOfOrderNo !== 'undefined' ? window.__esmsLastLevelOfOrderNo : null;
        var orderDateLabel = window.getLevelOfOrderDateLabel();
        var prevOrderDate = typeof window.__esmsLastLevelOfOrderDate !== 'undefined' ? window.__esmsLastLevelOfOrderDate : null;
        var buyerPoNoLabel = window.getLevelOfBuyerPONoLabel();
        var prevBuyerPoNo = typeof window.__esmsLastLevelOfBuyerPONo !== 'undefined' ? window.__esmsLastLevelOfBuyerPONo : null;
        var buyerPoDateLabel = window.getLevelOfBuyerPODateLabel();
        var prevBuyerPoDate = typeof window.__esmsLastLevelOfBuyerPODate !== 'undefined' ? window.__esmsLastLevelOfBuyerPODate : null;

        $('.esms-order-level-field-label').each(function () {
            replaceOrderNoTextInLabelElement(this, label);
        });

        $('.esms-order-level-placeholder').each(function () {
            $(this).attr('placeholder', label + '..');
        });

        $('.esms-order-level-placeholder-long').each(function () {
            var low = label.toLowerCase();
            $(this).attr('placeholder', 'Please enter ' + low + '..');
        });

        $('.esms-order-date-field-label').each(function () {
            replaceOrderDateTextInLabelElement(this, orderDateLabel);
        });

        $('.esms-order-date-placeholder').each(function () {
            $(this).attr('placeholder', orderDateLabel + '..');
        });

        $('.esms-buyer-po-no-field-label').each(function () {
            replaceBuyerPONoTextInLabelElement(this, buyerPoNoLabel);
        });

        $('.esms-buyer-po-no-placeholder').each(function () {
            $(this).attr('placeholder', buyerPoNoLabel + '..');
        });

        $('.esms-buyer-po-no-required').toggle(window.esmsIsBuyerPONoMandatory());

        $('.esms-buyer-po-date-field-label').each(function () {
            replaceBuyerPODateTextInLabelElement(this, buyerPoDateLabel);
        });

        $('.esms-buyer-po-date-placeholder').each(function () {
            $(this).attr('placeholder', buyerPoDateLabel + '..');
        });

        $('.filter-table-heading').each(function () {
            var $span = $(this);
            var t = $span.text().replace(/\s+/g, ' ').trim();
            if (shouldReplaceHeaderCaption(t, prev)) {
                $span.text(label);
                return;
            }
            if (shouldReplaceOrderDateCaption(t, prevOrderDate)) {
                $span.text(orderDateLabel);
                return;
            }
            if (shouldReplaceBuyerPONoCaption(t, prevBuyerPoNo)) {
                $span.text(buyerPoNoLabel);
                return;
            }
            if (shouldReplaceBuyerPODateCaption(t, prevBuyerPoDate)) {
                $span.text(buyerPoDateLabel);
            }
        });

        $('table thead th').each(function () {
            var $th = $(this);
            if ($th.find('.filter-table-heading').length) return;
            if ($th.find('.dropdown-content').length || $th.find('.filter-dropdown').length) return;
            var clone = $th.clone();
            clone.find('.sorting, .sorting_asc, .sorting_desc, .dataTables_sizing').remove();
            var tOnly = clone.text().replace(/\s+/g, ' ').trim();
            if (tOnly === 'Order No' || tOnly === 'OrderNo' || (prev && tOnly === prev)) {
                setThPlainTextIfMatch($th, tOnly, ['Order No', 'OrderNo', prev], label);
                return;
            }
            if (tOnly === 'Order Date' || tOnly === 'OrderDate' || (prevOrderDate && tOnly === prevOrderDate)) {
                setThPlainTextIfMatch($th, tOnly, ['Order Date', 'OrderDate', prevOrderDate], orderDateLabel);
                return;
            }
            if (tOnly === 'Buyer PO No' || tOnly === 'BuyerPONo' || (prevBuyerPoNo && tOnly === prevBuyerPoNo)) {
                setThPlainTextIfMatch($th, tOnly, ['Buyer PO No', 'BuyerPONo', prevBuyerPoNo], buyerPoNoLabel);
                return;
            }
            if (tOnly === 'Buyer PO Date' || tOnly === 'BuyerPODate' || (prevBuyerPoDate && tOnly === prevBuyerPoDate)) {
                setThPlainTextIfMatch($th, tOnly, ['Buyer PO Date', 'BuyerPODate', prevBuyerPoDate], buyerPoDateLabel);
            }
        });

        window.__esmsLastLevelOfOrderNo = label;
        window.__esmsLastLevelOfOrderDate = orderDateLabel;
        window.__esmsLastLevelOfBuyerPONo = buyerPoNoLabel;
        window.__esmsLastLevelOfBuyerPODate = buyerPoDateLabel;
    }

    function ensureBizsolCreateDataTablePatch($) {
        if (patchedCreateDataTable || !$ || !$.fn) return;
        var grid = window.BizsolCustomFilterGrid;
        if (!grid || typeof grid.CreateDataTable !== 'function') return;
        patchedCreateDataTable = true;
        var orig = grid.CreateDataTable;
        grid.CreateDataTable = function () {
            var ret = orig.apply(this, arguments);
            window.setTimeout(function () {
                applyLevelOfOrderNoLabelsCore(window.jQuery);
            }, 0);
            return ret;
        };
    }

    window.applyEsmsLevelOfOrderNoLabelsToDom = function applyEsmsLevelOfOrderNoLabelsToDom() {
        var $ = window.jQuery;
        if (!$ || !$.fn) return;
        ensureBizsolCreateDataTablePatch($);
        applyLevelOfOrderNoLabelsCore($);
    };

    if (typeof window.jQuery !== 'undefined' && window.jQuery.fn) {
        var $ = window.jQuery;
        $(document).on('draw.dt column-visibility.dt', function () {
            applyLevelOfOrderNoLabelsCore($);
        });
        $(function () {
            ensureBizsolCreateDataTablePatch($);
            applyLevelOfOrderNoLabelsCore($);
        });
    }
})();

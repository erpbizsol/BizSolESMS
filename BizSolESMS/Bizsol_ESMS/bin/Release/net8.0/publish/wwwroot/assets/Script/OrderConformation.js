var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let UserMaster_Code = authKeyData.UserMaster_Code;
function formatDdMmYyyy(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return dd + '/' + mm + '/' + yy;
}
function initDateRangePickers() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(formatDdMmYyyy(monthStart));
    $('#txtToDate').val(formatDdMmYyyy(today));
    loadOrderList();
    $('#txtFromDate, #txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true,
        container: 'body'
    }).on('show', function () {
        var $input = $(this);
        var w = $input.outerWidth();
        setTimeout(function () {
            var $dp = $('.datepicker-dropdown').last();
            if ($dp.length) {
                $dp.css({ minWidth: w + 'px', zIndex: 10090 });
            }
        }, 0);
    });
}
function clearOtpModal() {
    $('#ocOtpInputs .oc-otp-digit').val('').removeClass('oc-otp-digit--err');
    $('#ocOtpErrorMsg').text('');
    $('#ocOtpCard').removeClass('oc-otp-card--error');
    $('#btnOcOtpVerify').prop('disabled', false);
}
function showOtpError(msg) {
    $('#ocOtpErrorMsg').text(msg || 'Invalid OTP. Please try again.');
    $('#ocOtpCard').addClass('oc-otp-card--error');
    $('#ocOtpInputs .oc-otp-digit').addClass('oc-otp-digit--err');
    setTimeout(function () {
        $('#ocOtpCard').removeClass('oc-otp-card--error');
    }, 450);
}
function getOtpDigits() {
    return $('#ocOtpInputs .oc-otp-digit').map(function () {
        return ($(this).val() || '').replace(/\D/g, '');
    }).get().join('');
}
function getOcOtpModalBs() {
    var el = document.getElementById('ocOtpModal');
    if (!el || typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        return null;
    }
    /* No full-screen dim (.modal-backdrop) — matches data-bs-backdrop="false" on markup */
    return bootstrap.Modal.getOrCreateInstance(el, { backdrop: false, keyboard: true });
}
function showOcOtpModal() {
    var m = getOcOtpModalBs();
    if (m) {
        m.show();
    } else if (typeof $ !== 'undefined' && $.fn.modal) {
        $('#ocOtpModal').modal('show');
    }
}
function hideOcOtpModal() {
    var m = getOcOtpModalBs();
    if (m) {
        m.hide();
    } else if (typeof $ !== 'undefined' && $.fn.modal) {
        $('#ocOtpModal').modal('hide');
    }
}
function setupOtpModalInputs() {
    var $wrap = $('#ocOtpInputs');
    var $inputs = $wrap.find('.oc-otp-digit');

    $inputs.on('input', function () {
        var v = ($(this).val() || '').replace(/\D/g, '').slice(0, 1);
        $(this).val(v);
        if (v && $(this).next('.oc-otp-digit').length) {
            $(this).next('.oc-otp-digit').focus();
        }
    });

    $inputs.on('keydown', function (e) {
        if (e.key === 'Backspace' && !$(this).val()) {
            $(this).prev('.oc-otp-digit').focus();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            submitOcOtpValidation();
        }
    });

    $inputs.first().on('paste', function (e) {
        e.preventDefault();
        var text = (e.originalEvent.clipboardData || window.clipboardData).getData('text') || '';
        var digits = text.replace(/\D/g, '').slice(0, 6);
        $inputs.each(function (i) {
            $(this).val(digits.charAt(i) || '');
        });
        if (digits.length >= 6) {
            $inputs.last().focus();
        } else {
            $inputs.eq(Math.min(digits.length, 5)).focus();
        }
    });
}
function openOtpModal(orderCode) {
    $('#ocOtpModal').data('orderCode', orderCode);
    $('#ocOtpOrderLabel').text(orderCode);
    clearOtpModal();
    showOcOtpModal();
    setTimeout(function () {
        $('#ocOtpInputs .oc-otp-digit').first().focus();
    }, 450);
}
function submitOcOtpValidation() {
    var orderCode = $('#ocOtpModal').data('orderCode');
    var otp = getOtpDigits();
    $('#ocOtpErrorMsg').text('');
    $('#ocOtpInputs .oc-otp-digit').removeClass('oc-otp-digit--err');

    if (otp.length !== 6) {
        showOtpError('Please enter the complete 6-digit OTP.');
        return;
    }

    $('#btnOcOtpVerify').prop('disabled', true);
    var q = [
        'Code=' + encodeURIComponent(orderCode),
        'OTP=' + encodeURIComponent(otp),
        'UserMaster_Code=' + encodeURIComponent(UserMaster_Code != null ? String(UserMaster_Code) : '')
    ].join('&');
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ValidateOrderConformation?${q}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (res) {
            $('#btnOcOtpVerify').prop('disabled', false);
            var row = Array.isArray(res) && res.length ? res[0] : null;
            if (!row) {
                showOtpError('Unexpected response from server.');
                return;
            }
            var status = row.Status;
            var msg = row.Msg || '';
            if (status === 'Y' || status === 'y') {
                hideOcOtpModal();
                toastr.success(msg || 'Order verified successfully.');
                loadOrderList();
            } else if (status === 'N' || status === 'n') {
                showOtpError(msg || 'Incorrect OTP. Try again.');
            } else {
                showOtpError(msg || 'Could not verify OTP.');
            }
        },
        error: function (xhr) {
            $('#btnOcOtpVerify').prop('disabled', false);
            var msg = 'Could not verify OTP. Please try again.';
            try {
                var j = xhr.responseJSON;
                if (!j && xhr.responseText) {
                    j = JSON.parse(xhr.responseText);
                }
                if (j && (j.message || j.Message)) {
                    msg = j.message || j.Message;
                }
            } catch (e) { }
            showOtpError(msg);
        }
    });
}

$(document).ready(function () {
    $("#ERPHeading").text("Order Confirmation");
    initDateRangePickers();
    $("#txtShow").on("click", function () {
        loadOrderList();
    });
    setupOtpModalInputs();
    $('#btnOcOtpVerify').on('click', submitOcOtpValidation);
    $('#ocOtpModal').on('hidden.bs.modal', function () {
        clearOtpModal();
    });
});
function loadOrderList() {
    var FromDate = ($("#txtFromDate").val() || "").trim();
    var ToDate = ($("#txtToDate").val() || "").trim();
    if (!FromDate) {
        toastr.error('Please enter from date');
        return;
    }
    if (!ToDate) {
        toastr.error('Please enter to date');
        return;
    }
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderConformationList?FromDate=${encodeURIComponent(FromDate)}&ToDate=${encodeURIComponent(ToDate)}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            unblockUI();
            if (response && response.length > 0) {
                renderGrid(response);
            } else {
                $("#table-body").html("<tr><td colspan='20' class='text-center py-4 text-muted'>No orders found.</td></tr>");
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error('Error:', error);
            toastr.error('Could not load orders.');
        }
    });
}
function renderGrid(data) {
    if (!data || data.length === 0) {
        $("#table-body").html("<tr><td colspan='20' class='text-center py-4 text-muted'>No records found.</td></tr>");
        $("#table-header").empty();
        $("#paginator-table").empty();
        return;
    }

    const StringFilterColumn = ['Client Name'];
    const NumericFilterColumn = [];
    const DateFilterColumn = ['Order Date', 'Buyer PO Date'];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ['Code'];
    const ColumnAlignment = {};

    const updatedResponse = data.map(function (item) {
        return {
            ...item,
            OTP: item.OTP == 'Validate' ? `<button type="button" class="btn btn-success icon-height mb-1" title="Validate" onclick="openOtpModal(${item.Code})">${item.OTP}</button>` : `${item.OTP}`
        };
    });

    BizsolCustomFilterGrid.CreateDataTable('table-header', 'table-body', updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
}
function viewOrder(code) {
    const base = appBaseURL || '';
    window.location.href = `${base}/Order/OrderMaster`;
}
function ExportExcel() {
    var FromDate = ($("#txtFromDate").val() || "").trim();
    var ToDate = ($("#txtToDate").val() || "").trim();
    if (!FromDate || !ToDate) {
        toastr.warning('Please select From date and To date before export.');
        return;
    }
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderConformationList?FromDate=${encodeURIComponent(FromDate)}&ToDate=${encodeURIComponent(ToDate)}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            unblockUI();
            if (!response || response.length === 0) {
                toastr.warning('No data to export.');
                return;
            }
            const exportRows = response.map(function (r) {
                const copy = { ...r };
                delete copy.Action;
                return copy;
            });
            const ws = XLSX.utils.json_to_sheet(exportRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'OrderConfirmation');
            XLSX.writeFile(wb, 'OrderConfirmation.xlsx');
            toastr.success('Download started.');
        },
        error: function () {
            unblockUI();
            toastr.error('Could not export. Please try again.');
        }
    });
}

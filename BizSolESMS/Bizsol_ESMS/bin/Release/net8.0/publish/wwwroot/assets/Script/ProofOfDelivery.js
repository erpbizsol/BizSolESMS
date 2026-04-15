(function () {
    'use strict';

    var AppBaseURLMenu = window.location.href.toLowerCase().indexOf('local') >= 0 ? 'https://localhost:7072' : 'https://web.bizsol.in/esms';
    var podCode = '';
    var podCompanyCode = '';

    var $qr = $('#txtQrScan');
    var $section = $('#podDetailsSection');
    var $tbody = $('#tblPodDetailsBody');
    var $btnOtp = $('#btnSendOtp');
    var $cameraModal = $('#podCameraModal');
    var $otpBanner = $('#podOtpBanner');
    var $otpCode = $('#podOtpCode');
    var lastQrCode = '';
    var podHtml5QrCode = null;
    var podQrInvalidDebounce = null;
    var POD_QR_KEYS = ['Code', 'OrderNo', 'ChallanNo', 'NoOfBoxes', 'TotalScannedProducts', 'ClientName', 'CompanyCode'];
    function parsePodQrPayload(raw) {
        var s = (raw || '').trim();
        if (!s) {
            return null;
        }
        if (s.charAt(0) === '?') {
            s = s.substring(1);
        }
        var params;
        try {
            params = new URLSearchParams(s);
        } catch (e) {
            return null;
        }
        var out = {};
        var i;
        for (i = 0; i < POD_QR_KEYS.length; i++) {
            var k = POD_QR_KEYS[i];
            var v = params.get(k);
            if (v === null) {
                return null;
            }
            v = String(v).trim();
            if (v === '') {
                return null;
            }
            out[k] = v;
        }
        return out;
    }
    function buildRowsFromParsedPod(parsed) {
        return [
            { label: 'Client name', value: parsed.ClientName, primary: true },
            { label: 'Order No.', value: parsed.OrderNo },
            { label: 'Challan No.', value: parsed.ChallanNo },
            { label: 'No. of boxes', value: parsed.NoOfBoxes },
            { label: 'Total scanned products', value: parsed.TotalScannedProducts }
        ];
    }
    function hideOtpBanner() {
        $otpBanner.removeClass('is-visible');
        $otpCode.text('');
    }
    function showOtpBanner(code) {
        $otpCode.text(code);
        $otpBanner.addClass('is-visible');
    }
    function getQrValue() {
        return ($qr.val() || '').trim();
    }

    /** Same UX as BoxUnloading `showToast` — overlay + blink + sound for invalid scan */
    function showPodScanToast(msg) {
        var toast = document.getElementById('podScanToast');
        var overlay = document.getElementById('podScanOverlay');
        if (!toast || !overlay) {
            toastr.error(msg || 'INVALID QR CODE !');
            return;
        }
        toast.innerText = msg;
        toast.style.visibility = 'visible';
        toast.style.opacity = '0';
        overlay.style.display = 'block';
        toast.style.display = 'block';
        var alertSound = new Audio('https://www.fesliyanstudios.com/play-mp3/4387');
        alertSound.play().catch(function () { /* ignore */ });
        setTimeout(function () { toast.style.opacity = '1'; }, 10);
        var blinkInterval = setInterval(function () {
            toast.style.visibility = (toast.style.visibility === 'hidden') ? 'visible' : 'hidden';
        }, 250);
        setTimeout(function () {
            clearInterval(blinkInterval);
            toast.style.visibility = 'visible';
            toast.style.opacity = '0';
            setTimeout(function () {
                toast.style.display = 'none';
                overlay.style.display = 'none';
            }, 300);
        }, 3000);
    }

    function clearPodQrInvalidDebounce() {
        if (podQrInvalidDebounce) {
            clearTimeout(podQrInvalidDebounce);
            podQrInvalidDebounce = null;
        }
    }

    function clearDetails() {
        $tbody.empty();
        $section.removeClass('is-visible');
        $btnOtp.prop('disabled', true);
        lastQrCode = '';
        podCode = '';
        podCompanyCode = '';
        hideOtpBanner();
    }

    /**
     * @returns {Array|null} detail rows, or null if the string is not a valid POD QR payload.
     */
    function buildDetailsFromQr(code) {
        var parsed = parsePodQrPayload(code);
        if (!parsed) {
            return null;
        }
        return buildRowsFromParsedPod(parsed);
    }

    function renderDetails(rows) {
        $tbody.empty();
        if (!rows || !rows.length) {
            clearDetails();
            return;
        }
        rows.forEach(function (row) {
            var label = row.label != null ? String(row.label) : '';
            var value = row.value != null ? String(row.value) : '';
            var tr = $('<tr></tr>');
            if (row.primary) {
                tr.addClass('pod-table-row--client');
            }
            tr.append($('<th scope="row"></th>').text(label));
            tr.append($('<td></td>').text(value));
            $tbody.append(tr);
        });
        $section.addClass('is-visible');
        $btnOtp.prop('disabled', false);
    }

    /**
     * @param {boolean} [fromInput] - When true (wedge scanner / typing), invalid QR uses debounced overlay (like BoxUnloading API error) so partial input does not spam.
     */
    function resolveQr(fromInput) {
        var code = getQrValue();
        if (!code) {
            clearPodQrInvalidDebounce();
            if (!fromInput) {
                /* Match BoxUnloading: `toastr.error("Please enter a Box No !")` */
                toastr.error('Please scan or enter a QR code!');
            }
            return;
        }
        hideOtpBanner();
        var rows = buildDetailsFromQr(code);
        if (!rows) {
            lastQrCode = '';
            clearDetails();
            if (!fromInput) {
                /* Match BoxUnloading error: `showToast("INVALID BOX NO !")` + clear field */
                showPodScanToast('INVALID QR CODE !');
                $qr.val('');
                $qr.focus();
            } else {
                clearPodQrInvalidDebounce();
                podQrInvalidDebounce = setTimeout(function () {
                    podQrInvalidDebounce = null;
                    var v = getQrValue();
                    if (!v) {
                        return;
                    }
                    if (!buildDetailsFromQr(v)) {
                        showPodScanToast('INVALID QR CODE !');
                        $qr.val('');
                        $qr.focus();
                        clearDetails();
                    }
                }, 400);
            }
            return;
        }
        clearPodQrInvalidDebounce();
        lastQrCode = code;
        var parsed = parsePodQrPayload(code);
        podCode = parsed ? parsed.Code : '';
        podCompanyCode = parsed ? parsed.CompanyCode : '';
        renderDetails(rows);
        $qr.val('');
    }

    function sendOtp() {
        if (!podCode || !podCompanyCode) {
            toastr.error('Please scan or enter a valid QR code first.');
            return;
        }
        $.ajax({
            url: AppBaseURLMenu + '/Login/SendPodOtp',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ Code: podCode, CompanyCode: podCompanyCode }),
            success: function (response) {
                if (response.success && response.otp) {
                    showOtpBanner(String(response.otp));
                    toastr.success(response.message || 'OTP generated.');
                } else {
                    toastr.error(response.message || 'Could not send OTP.');
                }
            },
            error: function () {
                toastr.error('Could not reach server. Try again.');
            }
        });
    }

    function pickCameraId(devices) {
        if (!devices || !devices.length) {
            return null;
        }
        var i;
        for (i = 0; i < devices.length; i++) {
            var l = (devices[i].label || '').toLowerCase();
            if (l.indexOf('back') >= 0 || l.indexOf('rear') >= 0 || l.indexOf('environment') >= 0) {
                return devices[i].id;
            }
        }
        return devices[0].id;
    }

    function qrBoxSize() {
        var w = Math.min(280, Math.max(200, window.innerWidth - 80));
        return { width: w, height: w };
    }

    function stopPodCamera() {
        if (!podHtml5QrCode) {
            return;
        }
        var instance = podHtml5QrCode;
        podHtml5QrCode = null;
        instance.stop().then(function () {
            instance.clear();
        }).catch(function () {
            try {
                instance.clear();
            } catch (e) { /* ignore */ }
        });
    }

    function onCameraDecode(decodedText) {
        if (!podHtml5QrCode) {
            return;
        }
        var instance = podHtml5QrCode;
        podHtml5QrCode = null;
        instance.stop().then(function () {
            instance.clear();
            var el = document.getElementById('podCameraModal');
            var bs = bootstrap.Modal.getInstance(el);
            if (bs) {
                bs.hide();
            }
            $qr.val(decodedText);
            resolveQr(false);
        }).catch(function () {
            try {
                instance.clear();
            } catch (e) { /* ignore */ }
            var el = document.getElementById('podCameraModal');
            var bs = bootstrap.Modal.getInstance(el);
            if (bs) {
                bs.hide();
            }
            $qr.val(decodedText);
            resolveQr(false);
        });
    }

    function startPodCamera() {
        if (typeof Html5Qrcode === 'undefined') {
            toastr.error('QR scanner library failed to load.');
            return;
        }
        var readerEl = document.getElementById('podQrReader');
        if (!readerEl) {
            return;
        }
        readerEl.innerHTML = '';
        stopPodCamera();
        podHtml5QrCode = new Html5Qrcode('podQrReader');

        Html5Qrcode.getCameras().then(function (devices) {
            var cameraId = pickCameraId(devices);
            if (!cameraId) {
                toastr.error('No camera found.');
                try {
                    podHtml5QrCode.clear();
                } catch (e) { /* ignore */ }
                podHtml5QrCode = null;
                var m = document.getElementById('podCameraModal');
                var bs = bootstrap.Modal.getInstance(m);
                if (bs) {
                    bs.hide();
                }
                return;
            }
            var config = {
                fps: 10,
                qrbox: qrBoxSize(),
                aspectRatio: 1
            };
            return podHtml5QrCode.start(
                cameraId,
                config,
                onCameraDecode,
                function () { /* per-frame parse miss — ignore */ }
            );
        }).catch(function (err) {
            toastr.error('Camera error: ' + (err && err.message ? err.message : String(err)));
            if (podHtml5QrCode) {
                try {
                    podHtml5QrCode.clear();
                } catch (e) { /* ignore */ }
                podHtml5QrCode = null;
            }
            var m = document.getElementById('podCameraModal');
            var bs = bootstrap.Modal.getInstance(m);
            if (bs) {
                bs.hide();
            }
        });
    }

    $(document).ready(function () {
        $qr.trigger('focus');

        /* Same pattern as BoxUnloading txtBoxNo: process on input, keep focus for wedge scanners */
        $qr.on('input', function () {
            var value = $(this).val();
            if (value !== '') {
                resolveQr(true);
            } else {
                clearPodQrInvalidDebounce();
            }
            $(this).focus();
        });

        $qr.on('focus', function () {
            var inputElement = this;
            setTimeout(function () {
                inputElement.setAttribute('inputmode', 'none');
            }, 2);
        });
        $qr.on('blur', function () {
            $(this).attr('inputmode', '');
        });

        $qr.on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                resolveQr(false);
            }
        });

        $btnOtp.on('click', sendOtp);

        $cameraModal.on('shown.bs.modal', function () {
            startPodCamera();
        });

        $cameraModal.on('hidden.bs.modal', function () {
            stopPodCamera();
        });
    });
})();

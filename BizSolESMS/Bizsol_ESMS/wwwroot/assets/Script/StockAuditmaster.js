var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Stock Audit Master");
    ShowStockAuditmasterList('Load');
    $('#txtScanProduct').on('focus', function () {
        const inputElement = this;
        setTimeout(function () {
            inputElement.setAttribute('inputmode', 'none');
        }, 2);
    });
    $('#txtScanProduct').on('input', function () {
        ScanStockAuditmaster();
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
});

function itemHeader(name, fallback) {
    if (!G_ItemConfig || !G_ItemConfig.length || !G_ItemConfig[0]) return fallback;
    return G_ItemConfig[0][name] ? G_ItemConfig[0][name] : fallback;
}

function ShowStockAuditmasterList(Type) {
    $.ajax({
        url: `${appBaseURL}/api/StockAuditmaster/GetStockAuditmasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0) {
                $("#txtordertable").show();
                const itemCodeHeader = itemHeader('ItemCodeHeader', 'Item Code');
                const StringFilterColumn = [itemCodeHeader, "Location"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = ["Code", "ItemMaster_Code", "IsAudit", "IsManual","AuditDate"];
                if (UserType != 'A') {
                    hiddenColumns.push("Stock Qty");
                }
                const ColumnAlignment = {
                    "Stock Qty": "right;width:25px;",
                    "Scan Qty": "right;width:25px;"
                };
                const renameMap = {
                    "Item Name": itemHeader('ItemNameHeader', 'Item Name'),
                    "Item Code": itemCodeHeader
                };
                const updatedResponse = response.map(item => {
                    const renamedItem = {};
                    for (const key in item) {
                        const value = item[key] == null ? '' : item[key];
                        if (renameMap.hasOwnProperty(key)) {
                            renamedItem[renameMap[key]] = value;
                        } else {
                            renamedItem[key] = value;
                        }
                    }
                    renamedItem["Scan Qty"] = `<input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"] == null ? '' : item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right" autocomplete="off" placeholder="Scan Qty..">`;
                    return renamedItem;
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#txtordertable").hide();
                if (Type != 'Load') {
                    toastr.error("Record not found...!");
                }
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Unable to load stock audit list.");
        }
    });
}

function ScanStockAuditmaster() {
    const scanNo = ($("#txtScanProduct").val() || '').trim();
    if (scanNo === '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        ScanNo: scanNo,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/StockAuditmaster/ScanStockAuditmaster`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const row = response && response.length ? response[0] : response;
            if (row && row.Status == 'Y') {
                const voice = $("#SuccessVoice")[0];
                if (voice) voice.play().catch(function () { });
                ShowStockAuditmasterList("Get");
            } else {
                showToast(row && row.Msg ? row.Msg : "INVALID SCAN NO !");
            }
            $("#txtScanProduct").val("").focus();
        },
        error: function () {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("").focus();
        }
    });
}

function showToast(Msg) {
    let toast = document.getElementById("toast");
    let overlay = document.getElementById("overlay");
    toast.innerText = Msg;
    overlay.style.display = "block";
    toast.style.display = "block";
    let alertSound = new Audio("https://www.fesliyanstudios.com/play-mp3/4387");
    alertSound.play().catch(error => console.log("Audio playback failed:", error));
    setTimeout(() => toast.style.opacity = "1", 10);
    let blinkInterval = setInterval(() => {
        toast.style.visibility = (toast.style.visibility === "hidden") ? "visible" : "hidden";
    }, 300);
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


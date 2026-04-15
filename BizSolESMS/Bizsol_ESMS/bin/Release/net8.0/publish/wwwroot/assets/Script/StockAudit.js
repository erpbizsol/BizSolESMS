var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Stock Audit");
    ShowStockAuditlist('Load');
    GetModuleMasterCode();
    $('#txtScanProduct').on('focus', function () {
        const inputElement = this;
        const isManual = $("#txtIsManual").is(':checked');
        setTimeout(function () {
            inputElement.setAttribute('inputmode', isManual ? '' : 'none');
        }, 2);
    });
    $('#txtScanProduct').on('input', function (e) {
            SaveScanValidationDetail();
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
});
function ShowStockAuditlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetStockAuditList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtordertable").show();
                const StringFilterColumn = [G_ItemConfig[0].ItemCodeHeader,"Location"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = [];
                if (UserType == 'A') {
                    hiddenColumns = ["Code"];
                } else {
                    hiddenColumns = ["Code", "Stock Qty"];
                }
                const ColumnAlignment = {
                    "Stock Qty": "right;width:25px;",
                    "Scan Qty": "right;width:25px;"
                };
                const renameMap = {
                    "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                    "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                };
                const updatedResponse = response.map(item => {
                    const renamedItem = {};

                    for (const key in item) {
                        if (renameMap.hasOwnProperty(key)) {
                            renamedItem[renameMap[key]] = item[key];
                        } else {
                            renamedItem[key] = item[key];
                        }
                    }
                    
                    renamedItem["Action"]= `<button class="btn btn-success icon-height mb-1"  title="Complete audit" onclick="ManualAudit('${item.Code}')"><i class="fa fa-check"></i></button>`,
                    renamedItem["Scan Qty"]= `<input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right" autocomplete="off" placeholder="Scan Qty..">
                    `;
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
        }
    });

}
function SaveScanValidationDetail() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        ScanNo: $("#txtScanProduct").val(),
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanStockAudit`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                $("#SuccessVoice")[0].play();
                ShowStockAuditlist("Get");
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else if (response[0].Status == 'N') {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").focus();
            $("#txtScanProduct").val("");
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
function ChangecolorTr() {
    const rows = document.querySelectorAll('#SalesTable-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[13]?.textContent.trim();
        if (columnValue === 'GREEN') {
            row.style.backgroundColor = '#07bb72';

        } else if (columnValue === 'YELLOW') {
            row.style.backgroundColor = '#ebb861';
        } else {
            row.style.backgroundColor = '#f5c0bf';

        }
    });
}

setInterval(ChangecolorTr, 100);
async function ManualAudit(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('Complete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (confirm(`Are you sure you want to complete this audit.?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/ManualStockAudit?Code=${Code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            contentType: "application/json",
            dataType: "json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status == 'Y') {
                    toastr.success(response[0].Msg);
                    ShowStockAuditlist("Get");
                }
            },
            error: function (xhr, status, error) {

            }
        });
    }
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Stock Audit");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let Data = [];
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const G_UserName = sessionStorage.getItem('UserName');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
let G_OrderList = [];
let G_OrderNoList = [];
let G_SalesReturnMaster_Code = 0;
let G_orderCode = 0;
let G_selectedVendorcode = "";
let G_value = 0;
let G_SelectedUPIs = new Set();
let G_InvoiceItemList = [];
let G_ScanItemList = [];

$(document).ready(function () {
    $("#ERPHeading").text("Manual Sales Return");
    $("#txtPackedBy").val(G_UserName);
    $("#DataTable").hide();
    $('#txtScanProduct').on('input', function () {
        const scanNo = String($(this).val() || "").trim();
        if (!scanNo) return;
        SaveManualSalesReturnScanQty();
    });
    DatePicker();
    GetAccountMasterList();
    GetWareHouseList();
    GetReasonMasterList();

    $(document).on("change", "#txtClientName", function () {
        const selectedVendorCode = String($(this).val() || "").trim();
        const selectedVendor = G_OrderList.find(x => String(x.Code) === selectedVendorCode);
        G_selectedVendorcode = selectedVendorCode;
        G_SalesReturnMaster_Code = 0;
        G_value = 0;
        clearSalesReturnSelection();
        $("#txtshow").hide();
        $("#txtSaveAll").hide();
        $("#txtshowa").hide();
        $("#txtSaveAlls").hide();
        $("#DataTable").hide();
        $("#txtScanProduct").val('');

        if (selectedVendor) {
            $("#txtAddress").val(selectedVendor.Address || '');
            GetOrderNoList(G_selectedVendorcode);
        } else {
            // Client blank/Select → clear order + disable scan
            $("#txtAddress").val('');
            resetOrderNoDropdown();
            setScanProductEnabledByOrderNo();
        }
    });

    $(document).on("change", "#txtOrderNo", function () {
        G_value = $(this).val();
        G_SalesReturnMaster_Code = 0;
        $("#txtScanProduct").val('');
        setScanProductEnabledByOrderNo();

        if (hasOrderNoSelected(G_value)) {
            // Order selected → invoice checkbox mode (scan disabled)
            GetDispatchOrderLists(G_value);
        } else {
            // Order Select / blank / 0 → scan mode (scan enabled if client selected)
            $("#txtshowa").hide();
            $("#txtSaveAlls").hide();
            $("#txtshow").hide();
            $("#txtSaveAll").hide();
            $("#DataTable").hide();
            clearSalesReturnSelection();
        }
    });

    $(document).on("change", "#chkSelectAllSalesReturn", function () {
        const isChecked = $(this).is(":checked");
        toggleSelectAllSalesReturn(isChecked);
    });

    $(document).on("change", ".chkSalesReturnItem", function () {
        const upi = String($(this).data("upi") || "");
        if (!upi) return;
        if ($(this).is(":checked")) {
            G_SelectedUPIs.add(upi);
        } else {
            G_SelectedUPIs.delete(upi);
        }
        syncSelectAllHeader();
    });
});

function hasOrderNoSelected(orderNo) {
    const value = String(orderNo ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function hasClientSelected() {
    const value = String($("#txtClientName").val() ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function hasWarehouseSelected() {
    const value = String($("#txtWarehouse").val() ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function hasReasonSelected() {
    const value = String($("#txtReason").val() ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function GetReasonMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetReasonMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {
                    option += '<option value="' + val.Code + '">' + val["Desp"] + '</option>';
                });
                $('#txtReason').html(option);
                $('#txtReason').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtReason').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtReason').empty();
        }
    });
}

function GetWareHouseList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetWareHouseDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                response.forEach(item => {
                    option += '<option value="' + item.Code + '">' + item.Name + '</option>';
                });
                $('#txtWarehouse')[0].innerHTML = option;
                $('#txtWarehouse').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').empty();
        }
    });
}

function resetOrderNoDropdown() {
    if ($("#txtOrderNo").hasClass("select2-hidden-accessible")) {
        $("#txtOrderNo").select2('destroy');
    }
    $("#txtOrderNo").html('<option value="">Select</option>');
    $("#txtOrderNo").select2({
        width: '-webkit-fill-available'
    });
}

function setScanProductEnabledByOrderNo() {
    // Scan Product enabled only when Client is selected AND Order No is Select/blank/0
    const clientOk = hasClientSelected();
    const orderSelected = hasOrderNoSelected($("#txtOrderNo").val());

    if (clientOk && !orderSelected) {
        $("#txtScanProduct").prop("disabled", false);
        $("#txtScanProduct").focus();
    } else {
        $("#txtScanProduct").prop("disabled", true);
    }
}

function escapeHtmlAttr(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildSelectCheckbox(upi) {
    const upiVal = String(upi || "");
    const checked = G_SelectedUPIs.has(upiVal) ? "checked" : "";
    return `<input type="checkbox" class="chkSalesReturnItem" data-upi="${escapeHtmlAttr(upiVal)}" ${checked} title="Select" />`;
}

function mapRowsWithSelect(response) {
    return response.map(item => {
        const upi = item["UPI ID"] ?? item.UPI_ID ?? "";
        return {
            Select: buildSelectCheckbox(upi),
            ...item
        };
    });
}

function bindSelectAllHeader() {
    const $firstTh = $("#table-header th").first();
    if ($firstTh.length && ($firstTh.text().trim() === "Select" || $firstTh.find("#chkSelectAllSalesReturn").length || $firstTh.html().indexOf("chkSelectAll") >= 0)) {
        $firstTh.html('<input type="checkbox" id="chkSelectAllSalesReturn" title="Select All" />');
        syncSelectAllHeader();
    }
}

function getCurrentItemUpiList() {
    const source = G_InvoiceItemList.length ? G_InvoiceItemList : G_ScanItemList;
    return source
        .map(item => String(item["UPI ID"] ?? item.UPI_ID ?? ""))
        .filter(upi => upi !== "");
}

function toggleSelectAllSalesReturn(isChecked) {
    const upiList = getCurrentItemUpiList();
    if (isChecked) {
        upiList.forEach(upi => G_SelectedUPIs.add(upi));
    } else {
        upiList.forEach(upi => G_SelectedUPIs.delete(upi));
    }
    $(".chkSalesReturnItem").prop("checked", isChecked);
    syncSelectAllHeader();
}

function syncSelectAllHeader() {
    const upiList = getCurrentItemUpiList();
    const allChecked = upiList.length > 0 && upiList.every(upi => G_SelectedUPIs.has(upi));
    $("#chkSelectAllSalesReturn").prop("checked", allChecked);
}

function getSelectedUpiIds() {
    return Array.from(G_SelectedUPIs).filter(upi => upi);
}

function clearSalesReturnSelection() {
    G_SelectedUPIs.clear();
    G_InvoiceItemList = [];
    G_ScanItemList = [];
    $("#chkSelectAllSalesReturn").prop("checked", false);
}
function DatePicker() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var apiDateRaw = null;
            if (response && response.length > 0 && response[0] && response[0].Date) {
                apiDateRaw = response[0].Date;
            }
            DatePickerForDownloadDate(apiDateRaw);
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function DatePickerForDownloadDate(date) {
    var $date = $('#txtDate');
    try { $date.datepicker('destroy'); } catch (e) { }

    $date.val(date || '');
    $date.datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true
    }).on('show', function () {
        let $input = $(this);
        let inputOffset = $input.offset();
        let inputHeight = $input.outerHeight();
        let inputWidth = $input.outerWidth();
        setTimeout(function () {
            let $datepicker = $('.datepicker-dropdown');
            $datepicker.css({
                width: inputWidth + 'px',
                top: (inputOffset.top + inputHeight) + 'px',
                left: inputOffset.left + 'px',
                'z-index': '1000',
            });
        }, 10);
    });

    if (date) {
        $date.datepicker('setDate', date);
    }
}
function GetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsClientDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_OrderList = response;
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["AccountName"] + '</option>';
                });

                $('#txtClientName').html(option);
                $('#txtClientName').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtClientName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtClientName').empty();
        }
    });

}
function GetOrderNoList(VendorMaster_Code) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetVendorWiseOrderNo?VendorMaster_Code=${VendorMaster_Code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_OrderNoList = response;
            if (response.length > 0) {
               
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["OrderNoWithPrefix"] + '</option>';
                });

                if ($('#txtOrderNo').hasClass("select2-hidden-accessible")) {
                    $('#txtOrderNo').select2('destroy');
                }
                $('#txtOrderNo').html(option);
                $('#txtOrderNo').select2({
                    width: '-webkit-fill-available'
                });
                // Order defaults to Select/blank → enable Scan Product
                setScanProductEnabledByOrderNo();
            } else {
                resetOrderNoDropdown();
                $("#txtshowa").hide();
                $("#txtSaveAlls").hide();
                $("#DataTable").hide();
                // No orders → Order is blank → enable Scan Product (client already selected)
                setScanProductEnabledByOrderNo();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            resetOrderNoDropdown();
            setScanProductEnabledByOrderNo();
        }
    });

}
function SaveManualSalesReturnScanQty() {
    if (!hasClientSelected()) {
        toastr.error("Please select Client Name!");
        $("#txtClientName").focus();
        return;
    }
    if (!hasWarehouseSelected()) {
        toastr.error("Please select Warehouse!");
        $("#txtWarehouse").focus();
        return;
    }
    if (!hasReasonSelected()) {
        toastr.error("Please select Reason!");
        $("#txtReason").focus();
        return;
    }
    if (hasOrderNoSelected($("#txtOrderNo").val())) {
        toastr.error("Please clear Order No to use Scan Product!");
        $("#txtScanProduct").val("");
        return;
    }
    if ($("#txtScanProduct").val() === '') {
        toastr.error("Please scan product!");
        $("#txtScanProduct").focus();
        return;
    }
    const ManualSalesReturn ={
        Code: G_SalesReturnMaster_Code,
        ScanNo: $("#txtScanProduct").val(),
        ClientMasterCode: G_selectedVendorcode,
        UserMaster_Code: UserMaster_Code,
        WarehouseMaster_Code: $("#txtWarehouse").val(),
        ReasonMaster_Code: $("#txtReason").val(),
    }
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/SaveManualSalesReturn`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(ManualSalesReturn),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status == 'Y') {
                G_SalesReturnMaster_Code = response.Code;
                $("#SuccessVoice")[0].play();
                $("#txtScanProduct").val("").focus();
                GetSalesDispatchData(G_SalesReturnMaster_Code);
                unblockUI();
            } else if (response.Status == 'N') {
                showToast(response.Msg);
                $("#txtScanProduct").val("").focus();
                if (G_SalesReturnMaster_Code) {
                    GetSalesDispatchData(G_SalesReturnMaster_Code);
                }
                unblockUI();
            } else {
                showToast(response.Msg);
                $("#txtScanProduct").val("").focus();
                unblockUI();
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("").focus();
            unblockUI();
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
    }, 3000);
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
function GetSalesDispatchData(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetSalesDispatchData?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                // Order No blank (scan mode) → hide Save + checkboxes
                $("#txtshowa").hide();
                $("#txtSaveAlls").hide();
                $("#txtshow").hide();
                $("#txtSaveAll").hide();
                $("#DataTable").show();
                G_ScanItemList = response;
                G_InvoiceItemList = [];
                G_SelectedUPIs.clear();
                const StringFilterColumn = ["Part Code", "Part Name", "UPI ID", "Client Name", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["TOQ", "TBQ"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = [];
                if (UserType == "A") {
                    hiddenColumns = ["Code"];
                } else {
                    hiddenColumns = ["Code", "Order Date"];
                }
                const ColumnAlignment = {
                    "TOQ": 'right',
                    "TBQ": 'right'
                };
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#txtshow").hide();
                $("#txtSaveAll").hide();
                $("#DataTable").hide();
                clearSalesReturnSelection();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function StartDispatchPanding(UPIID) {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateSalesUPIID?UPIID=${UPIID}`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
       // data: JSON.stringify(ManualSalesReturn),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status == 'Y') {
                G_SalesReturnMaster_Code = response.Code;
                $("#SuccessVoice")[0].play();
                GetSalesDispatchData(G_SalesReturnMaster_Code);
                unblockUI();
            } else if (response.Status == 'N') {
                showToast(response.Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
                GetSalesDispatchData(G_SalesReturnMaster_Code);
                unblockUI();
            } else {
                showToast(response.Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
                unblockUI();
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("");
            $("#txtScanProduct").focus();
            unblockUI();
        }
    });
    
}

$("#txtSaveAll").click(function () {
    StartDispatchAll(G_SalesReturnMaster_Code);
});
$("#txtSaveAlls").click(function () {
    StartDispatchOrderNo();
});
async function StartDispatchAll(G_SalesReturnMaster_Code) {
    const selectedUpis = getSelectedUpiIds();
    if (selectedUpis.length === 0) {
        toastr.error("Please select at least one item.");
        return;
    }
    if (!hasWarehouseSelected()) {
        toastr.error("Please select Warehouse!");
        $("#txtWarehouse").focus();
        return;
    }
    if (!hasReasonSelected()) {
        toastr.error("Please select Reason!");
        $("#txtReason").focus();
        return;
    }

    blockUI();
    try {
        let lastCode = G_SalesReturnMaster_Code;
        let lastMsg = "Data Updated Successfully";
        let hasError = false;

        for (const upi of selectedUpis) {
            const response = await $.ajax({
                url: `${appBaseURL}/api/OrderMaster/UpdateSalesUPIID?UPIID=${encodeURIComponent(upi)}`,
                type: 'POST',
                contentType: "application/json",
                dataType: "json",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Auth-Key', authKeyData);
                }
            });

            if (response.Status == 'Y') {
                lastCode = response.Code;
                lastMsg = response.Msg;
            } else {
                hasError = true;
                lastMsg = response.Msg || "Unable to save selected item.";
                break;
            }
        }

        showToast(lastMsg);
        if (!hasError) {
            $("#SuccessVoice")[0].play();
        }
        G_SalesReturnMaster_Code = lastCode;
        GetSalesDispatchData(G_SalesReturnMaster_Code);
    } catch (error) {
        showToast("INVALID SCAN NO !");
        $("#txtScanProduct").val("").focus();
    } finally {
        unblockUI();
    }
}
function GetDispatchOrderLists(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetSalesData?p_Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtshow").hide();
                $("#txtSaveAll").hide();
                $("#txtshowa").show();
                $("#txtSaveAlls").show();
                $("#DataTable").show();
                G_InvoiceItemList = response;
                G_ScanItemList = [];
                G_SelectedUPIs.clear();
                const StringFilterColumn = ["Part Code", "Part Name", "UPI ID", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["TOQ", "TBQ"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = [];
                if (UserType == "A") {
                    hiddenColumns = ["Code"];
                } else {
                    hiddenColumns = ["Code", "Order Date"];
                }
                const ColumnAlignment = {
                    "TOQ": 'right',
                    "TBQ": 'right'
                };
                const updatedResponse = mapRowsWithSelect(response);
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                bindSelectAllHeader();
            } else {
                $("#txtshowa").hide();
                $("#txtSaveAlls").hide();
                $("#DataTable").hide();
                clearSalesReturnSelection();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function StartDispatchOrderNo() {
    const selectedUpis = getSelectedUpiIds();
    if (selectedUpis.length === 0) {
        toastr.error("Please select at least one item.");
        return;
    }
    if (!hasWarehouseSelected()) {
        toastr.error("Please select Warehouse!");
        $("#txtWarehouse").focus();
        return;
    }
    if (!hasReasonSelected()) {
        toastr.error("Please select Reason!");
        $("#txtReason").focus();
        return;
    }

    blockUI();
    var orderCode = $("#txtOrderNo").val();
    var ClientMasterCode = $("#txtClientName").val();
    var WarehouseMaster_Code = $("#txtWarehouse").val();
    var ReasonMaster_Code = $("#txtReason").val();
    const upiIds = encodeURIComponent(selectedUpis.join(","));
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/StartDispatchOrderNo?ScanBy=${UserMaster_Code}&OrderMasterCode=${orderCode}&ClientMasterCode=${ClientMasterCode}&UPIIds=${upiIds}&WarehouseMaster_Code=${WarehouseMaster_Code}&ReasonMaster_Code=${ReasonMaster_Code}`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const data = response.data || response;

            if (data.Status === 'Y') {
                toastr.success(data.Msg);
                clearSalesReturnSelection();
                GetDispatchOrderLists(G_value);
            } else {
                toastr.error(data.Msg);
                $("#txtScanProduct").val("").focus();
                GetDispatchOrderLists(G_value);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Dispatch error:", error);
            $("#txtScanProduct").val("").focus();
            unblockUI();
        }
    });
}

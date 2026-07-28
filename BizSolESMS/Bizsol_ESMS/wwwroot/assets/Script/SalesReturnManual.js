// Manual Sales Return panel (embedded in Sales Return Master)
// Uses msr* element IDs to avoid clashes with Import/Validate screens.
const msrG_UserName = sessionStorage.getItem('UserName');
let msrG_OrderList = [];
let msrG_OrderNoList = [];
let msrG_SalesReturnMaster_Code = 0;
let msrG_orderCode = 0;
let msrG_selectedVendorcode = "";
let msrG_value = 0;
let msrG_SelectedUPIs = new Set();
let msrG_InvoiceItemList = [];
let msrG_ScanItemList = [];

$(document).ready(function () {
    $("#msrPackedBy").val(msrG_UserName);
    $("#msrDataTable").hide();
    $("#msrScanProduct").on("input", function () {
        const scanNo = String($(this).val() || "").trim();
        if (!scanNo) return;
        msrSaveManualSalesReturnScanQty();
    });
    $(document).on("change", "#msrClientName", function () {
        const selectedVendorCode = String($(this).val() || "").trim();
        const selectedVendor = msrG_OrderList.find(x => String(x.Code) === selectedVendorCode);
        msrG_selectedVendorcode = selectedVendorCode;
        msrG_SalesReturnMaster_Code = 0;
        msrG_value = 0;
        msrClearSalesReturnSelection();
        $("#msrshow").hide();
        $("#msrSaveAll").hide();
        $("#msrshowa").hide();
        $("#msrSaveAlls").hide();
        $("#msrDataTable").hide();
        $("#msrScanProduct").val("");
        if (selectedVendor) {
            $("#msrAddress").val(selectedVendor.Address || "");
            msrGetOrderNoList(msrG_selectedVendorcode);
        } else {
            $("#msrAddress").val("");
            msrResetOrderNoDropdown();
            msrSetScanProductEnabledByOrderNo();
        }
    });
    $(document).on("change", "#msrOrderNo", function () {
        msrG_value = $(this).val();
        msrG_SalesReturnMaster_Code = 0;
        $("#msrScanProduct").val("");
        msrSetScanProductEnabledByOrderNo();
        if (msrHasOrderNoSelected(msrG_value)) {
            msrGetDispatchOrderLists(msrG_value);
        } else {
            $("#msrshowa").hide();
            $("#msrSaveAlls").hide();
            $("#msrshow").hide();
            $("#msrSaveAll").hide();
            $("#msrDataTable").hide();
            msrClearSalesReturnSelection();
        }
    });
    $(document).on("change", "#msrChkSelectAll", function () {
        msrToggleSelectAllSalesReturn($(this).is(":checked"));
    });
    $(document).on("change", ".msrChkSalesReturnItem", function () {
        const upi = String($(this).data("upi") || "");
        if (!upi) return;
        if ($(this).is(":checked")) msrG_SelectedUPIs.add(upi);
        else msrG_SelectedUPIs.delete(upi);
        msrSyncSelectAllHeader();
    });
    $("#msrSaveAll").click(function () { msrStartDispatchAll(msrG_SalesReturnMaster_Code); });
    $("#msrSaveAlls").click(function () { msrStartDispatchOrderNo(); });
});

function OpenManualSalesReturnPage() {
    $("#txtListpage").hide();
    $("#txtImportPage").hide();
    $("#txtSalesValidate").hide();
    $("#txtheaderdiv").hide();
    $("#txtheaderdiv2").hide();
    $("#txtManualPage").show();
    $("#txtheaderdivManual").show();
    $("#ERPHeading").text("Manual Sales Return");
    msrResetManualPage();
    msrDatePicker();
    msrGetAccountMasterList();
    msrGetWareHouseList();
    msrGetReasonMasterList();
}

function BackManualSalesReturnPage() {
    $("#txtManualPage").hide();
    $("#txtheaderdivManual").hide();
    $("#msrDataTable").hide();
    $("#msrshow").hide();
    $("#msrshowa").hide();
    $("#txtListpage").show();
    $("#ERPHeading").text("Sales Return");
    msrResetManualPage();
    ShowSalesReturnMasterlist("Get");
}

function msrResetManualPage() {
    msrG_SalesReturnMaster_Code = 0;
    msrG_value = 0;
    msrG_selectedVendorcode = "";
    msrClearSalesReturnSelection();
    $("#msrAddress").val("");
    $("#msrScanProduct").val("").prop("disabled", true);
    $("#msrPackedBy").val(msrG_UserName);
    $("#msrshow, #msrSaveAll, #msrshowa, #msrSaveAlls, #msrDataTable").hide();
    if ($("#msrClientName").hasClass("select2-hidden-accessible")) {
        $("#msrClientName").val("").trigger("change");
    } else {
        $("#msrClientName").val("");
    }
    msrResetOrderNoDropdown();
    if ($("#msrWarehouse").hasClass("select2-hidden-accessible")) {
        $("#msrWarehouse").val("").trigger("change");
    } else {
        $("#msrWarehouse").val("");
    }
    if ($("#msrReason").hasClass("select2-hidden-accessible")) {
        $("#msrReason").val("").trigger("change");
    } else {
        $("#msrReason").val("");
    }
}

function msrHasOrderNoSelected(orderNo) {
    const value = String(orderNo ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function msrHasClientSelected() {
    const value = String($("#msrClientName").val() ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function msrHasWarehouseSelected() {
    const value = String($("#msrWarehouse").val() ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function msrHasReasonSelected() {
    const value = String($("#msrReason").val() ?? "").trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "select";
}

function msrGetReasonMasterList() {
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
                $('#msrReason').html(option);
                $('#msrReason').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#msrReason').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#msrReason').empty();
        }
    });
}

function msrGetWareHouseList() {
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
                $('#msrWarehouse')[0].innerHTML = option;
                $('#msrWarehouse').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#msrWarehouse').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#msrWarehouse').empty();
        }
    });
}

function msrResetOrderNoDropdown() {
    if ($("#msrOrderNo").hasClass("select2-hidden-accessible")) {
        $("#msrOrderNo").select2('destroy');
    }
    $("#msrOrderNo").html('<option value="">Select</option>');
    $("#msrOrderNo").select2({
        width: '-webkit-fill-available'
    });
}

function msrSetScanProductEnabledByOrderNo() {
    // Scan Product enabled only when Client is selected AND Order No is Select/blank/0
    const clientOk = msrHasClientSelected();
    const orderSelected = msrHasOrderNoSelected($("#msrOrderNo").val());

    if (clientOk && !orderSelected) {
        $("#msrScanProduct").prop("disabled", false);
        $("#msrScanProduct").focus();
    } else {
        $("#msrScanProduct").prop("disabled", true);
    }
}

function msrEscapeHtmlAttr(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function msrBuildSelectCheckbox(upi) {
    const upiVal = String(upi || "");
    const checked = msrG_SelectedUPIs.has(upiVal) ? "checked" : "";
    return `<input type="checkbox" class="msrChkSalesReturnItem" data-upi="${msrEscapeHtmlAttr(upiVal)}" ${checked} title="Select" />`;
}

function msrMapRowsWithSelect(response) {
    return response.map(item => {
        const upi = item["UPI ID"] ?? item.UPI_ID ?? "";
        return {
            Select: msrBuildSelectCheckbox(upi),
            ...item
        };
    });
}

function msrBindSelectAllHeader() {
    const $firstTh = $("#msr-table-header th").first();
    if ($firstTh.length && ($firstTh.text().trim() === "Select" || $firstTh.find("#msrChkSelectAll").length || $firstTh.html().indexOf("chkSelectAll") >= 0)) {
        $firstTh.html('<input type="checkbox" id="msrChkSelectAll" title="Select All" />');
        msrSyncSelectAllHeader();
    }
}

function msrGetCurrentItemUpiList() {
    const source = msrG_InvoiceItemList.length ? msrG_InvoiceItemList : msrG_ScanItemList;
    return source
        .map(item => String(item["UPI ID"] ?? item.UPI_ID ?? ""))
        .filter(upi => upi !== "");
}

function msrToggleSelectAllSalesReturn(isChecked) {
    const upiList = msrGetCurrentItemUpiList();
    if (isChecked) {
        upiList.forEach(upi => msrG_SelectedUPIs.add(upi));
    } else {
        upiList.forEach(upi => msrG_SelectedUPIs.delete(upi));
    }
    $(".msrChkSalesReturnItem").prop("checked", isChecked);
    msrSyncSelectAllHeader();
}

function msrSyncSelectAllHeader() {
    const upiList = msrGetCurrentItemUpiList();
    const allChecked = upiList.length > 0 && upiList.every(upi => msrG_SelectedUPIs.has(upi));
    $("#msrChkSelectAll").prop("checked", allChecked);
}

function msrGetSelectedUpiIds() {
    return Array.from(msrG_SelectedUPIs).filter(upi => upi);
}

function msrClearSalesReturnSelection() {
    msrG_SelectedUPIs.clear();
    msrG_InvoiceItemList = [];
    msrG_ScanItemList = [];
    $("#msrChkSelectAll").prop("checked", false);
}
function msrDatePicker() {
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
            msrDatePickerForDownloadDate(apiDateRaw);
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function msrDatePickerForDownloadDate(date) {
    var $date = $('#msrDate');
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
function msrGetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsClientDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            msrG_OrderList = response;
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["AccountName"] + '</option>';
                });

                $('#msrClientName').html(option);
                $('#msrClientName').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#msrClientName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#msrClientName').empty();
        }
    });

}
function msrGetOrderNoList(VendorMaster_Code) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetVendorWiseOrderNo?VendorMaster_Code=${VendorMaster_Code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            msrG_OrderNoList = response;
            if (response.length > 0) {
               
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["OrderNoWithPrefix"] + '</option>';
                });

                if ($('#msrOrderNo').hasClass("select2-hidden-accessible")) {
                    $('#msrOrderNo').select2('destroy');
                }
                $('#msrOrderNo').html(option);
                $('#msrOrderNo').select2({
                    width: '-webkit-fill-available'
                });
                // Order defaults to Select/blank → enable Scan Product
                msrSetScanProductEnabledByOrderNo();
            } else {
                msrResetOrderNoDropdown();
                $("#msrshowa").hide();
                $("#msrSaveAlls").hide();
                $("#msrDataTable").hide();
                // No orders → Order is blank → enable Scan Product (client already selected)
                msrSetScanProductEnabledByOrderNo();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            msrResetOrderNoDropdown();
            msrSetScanProductEnabledByOrderNo();
        }
    });

}
function msrSaveManualSalesReturnScanQty() {
    if (!msrHasClientSelected()) {
        toastr.error("Please select Client Name!");
        $("#msrClientName").focus();
        return;
    }
    if (!msrHasWarehouseSelected()) {
        toastr.error("Please select Warehouse!");
        $("#msrWarehouse").focus();
        return;
    }
    if (!msrHasReasonSelected()) {
        toastr.error("Please select Reason!");
        $("#msrReason").focus();
        return;
    }
    if (msrHasOrderNoSelected($("#msrOrderNo").val())) {
        toastr.error("Please clear Order No to use Scan Product!");
        $("#msrScanProduct").val("");
        return;
    }
    if ($("#msrScanProduct").val() === '') {
        toastr.error("Please scan product!");
        $("#msrScanProduct").focus();
        return;
    }
    const ManualSalesReturn ={
        Code: msrG_SalesReturnMaster_Code,
        ScanNo: $("#msrScanProduct").val(),
        ClientMasterCode: msrG_selectedVendorcode,
        UserMaster_Code: UserMaster_Code,
        WarehouseMaster_Code: $("#msrWarehouse").val(),
        ReasonMaster_Code: $("#msrReason").val(),
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
                msrG_SalesReturnMaster_Code = response.Code;
                $("#msrSuccessVoice")[0].play();
                $("#msrScanProduct").val("").focus();
                msrGetSalesDispatchData(msrG_SalesReturnMaster_Code);
                unblockUI();
            } else if (response.Status == 'N') {
                msrShowToast(response.Msg);
                $("#msrScanProduct").val("").focus();
                if (msrG_SalesReturnMaster_Code) {
                    msrGetSalesDispatchData(msrG_SalesReturnMaster_Code);
                }
                unblockUI();
            } else {
                msrShowToast(response.Msg);
                $("#msrScanProduct").val("").focus();
                unblockUI();
            }
        },
        error: function (xhr, status, error) {
            msrShowToast("INVALID SCAN NO !");
            $("#msrScanProduct").val("").focus();
            unblockUI();
        }
    });

}
function msrShowToast(Msg) {
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
function msrGetSalesDispatchData(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetSalesDispatchData?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                // Order No blank (scan mode) → hide Save + checkboxes
                $("#msrshowa").hide();
                $("#msrSaveAlls").hide();
                $("#msrshow").hide();
                $("#msrSaveAll").hide();
                $("#msrDataTable").show();
                msrG_ScanItemList = response;
                msrG_InvoiceItemList = [];
                msrG_SelectedUPIs.clear();
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
                BizsolCustomFilterGrid.CreateDataTable("msr-table-header", "msr-table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#msrshow").hide();
                $("#msrSaveAll").hide();
                $("#msrDataTable").hide();
                msrClearSalesReturnSelection();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function msrStartDispatchPanding(UPIID) {
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
                msrG_SalesReturnMaster_Code = response.Code;
                $("#msrSuccessVoice")[0].play();
                msrGetSalesDispatchData(msrG_SalesReturnMaster_Code);
                unblockUI();
            } else if (response.Status == 'N') {
                msrShowToast(response.Msg);
                $("#msrScanProduct").val("");
                $("#msrScanProduct").focus();
                msrGetSalesDispatchData(msrG_SalesReturnMaster_Code);
                unblockUI();
            } else {
                msrShowToast(response.Msg);
                $("#msrScanProduct").val("");
                $("#msrScanProduct").focus();
                unblockUI();
            }
        },
        error: function (xhr, status, error) {
            msrShowToast("INVALID SCAN NO !");
            $("#msrScanProduct").val("");
            $("#msrScanProduct").focus();
            unblockUI();
        }
    });
    
}

async function msrStartDispatchAll(msrG_SalesReturnMaster_Code) {
    const selectedUpis = msrGetSelectedUpiIds();
    if (selectedUpis.length === 0) {
        toastr.error("Please select at least one item.");
        return;
    }
    if (!msrHasWarehouseSelected()) {
        toastr.error("Please select Warehouse!");
        $("#msrWarehouse").focus();
        return;
    }
    if (!msrHasReasonSelected()) {
        toastr.error("Please select Reason!");
        $("#msrReason").focus();
        return;
    }

    blockUI();
    try {
        let lastCode = msrG_SalesReturnMaster_Code;
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

        if (!hasError) {
            $("#msrSuccessVoice")[0].play();
            msrG_SalesReturnMaster_Code = lastCode;
            BackManualSalesReturnPage();
        } else {
            msrShowToast(lastMsg);
            msrG_SalesReturnMaster_Code = lastCode;
            if (msrG_SalesReturnMaster_Code) {
                msrGetSalesDispatchData(msrG_SalesReturnMaster_Code);
            }
        }
    } catch (error) {
        msrShowToast("INVALID SCAN NO !");
        $("#msrScanProduct").val("").focus();
    } finally {
        unblockUI();
    }
}
function msrGetDispatchOrderLists(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetSalesData?p_Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#msrshow").hide();
                $("#msrSaveAll").hide();
                $("#msrshowa").show();
                $("#msrSaveAlls").show();
                $("#msrDataTable").show();
                msrG_InvoiceItemList = response;
                msrG_ScanItemList = [];
                msrG_SelectedUPIs.clear();
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
                const updatedResponse = msrMapRowsWithSelect(response);
                BizsolCustomFilterGrid.CreateDataTable("msr-table-header", "msr-table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                msrBindSelectAllHeader();
            } else {
                $("#msrshowa").hide();
                $("#msrSaveAlls").hide();
                $("#msrDataTable").hide();
                msrClearSalesReturnSelection();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function msrStartDispatchOrderNo() {
    const selectedUpis = msrGetSelectedUpiIds();
    if (selectedUpis.length === 0) {
        toastr.error("Please select at least one item.");
        return;
    }
    if (!msrHasWarehouseSelected()) {
        toastr.error("Please select Warehouse!");
        $("#msrWarehouse").focus();
        return;
    }
    if (!msrHasReasonSelected()) {
        toastr.error("Please select Reason!");
        $("#msrReason").focus();
        return;
    }

    blockUI();
    var orderCode = $("#msrOrderNo").val();
    var ClientMasterCode = $("#msrClientName").val();
    var WarehouseMaster_Code = $("#msrWarehouse").val();
    var ReasonMaster_Code = $("#msrReason").val();
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
                msrClearSalesReturnSelection();
                BackManualSalesReturnPage();
            } else {
                toastr.error(data.Msg);
                $("#msrScanProduct").val("").focus();
                msrGetDispatchOrderLists(msrG_value);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Dispatch error:", error);
            $("#msrScanProduct").val("").focus();
            unblockUI();
        }
    });
}



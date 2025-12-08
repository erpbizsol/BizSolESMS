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
let G_selectedVendorcode = [];
let G_value = 0;

$(document).ready(function () {
    $("#ERPHeading").text("Manual Sales Return");
    $("#txtPackedBy").val(G_UserName);
    $('#txtScanProduct').on('input', function (e) {
        SaveManualSalesReturnScanQty();
        $("#txtSaveAll").show();
    });
    DatePicker();
    GetAccountMasterList();
    $(document).on("change", "#txtVendorName", function () {
        let selectedVendorName = $(this).val().trim();
        let selectedVendorCode = $(this).val().trim();
        const selectedVendor = G_OrderList.find(x => x.Code == selectedVendorCode);
        G_selectedVendorcode = selectedVendorCode;
        if (selectedVendor) {
            $("#txtAddress").val(selectedVendor.Address || '');
            GetOrderNoList(G_selectedVendorcode);
            $("#txtSaveAll").hide();
            $("#txtSaveAlls").show();
         
            setTimeout(() => {
                let orderNo = $("#txtOrderNo").val();
                if (orderNo === "") {
                    $("#txtScanProduct").prop("disabled", true);
                    
                } else {
                    $("#txtScanProduct").prop("disabled", false);
                    $("#txtScanProduct").focus();
                }
            }, 500);
        } else {
                $("#txtSaveAlls").hide();
                $("#DataTable").hide();
                $("#txtAddress").val('');
                $("#txtOrderNo").html('<option value="">Select</option>');
                $("#txtScanProduct").prop("disabled", true);
        }

    });

    //$("#txtOrderNo").on("change", function () {
    //    let orderValue = $(this).val().trim();

    //    if (orderValue !== "") {
    //        // If value is selected
    //        $("#txtScanProduct").prop("disabled", true);
    //    } else {
    //        // If no value
    //        $("#txtScanProduct").prop("disabled", true);
    //    }
    //});

    $("#txtOrderNo").on("change", function () {
         G_value = $(this).val();
        if ($(this).val() === G_value) {
            GetDispatchOrderLists(G_value); 
            let orderNo = $("#txtOrderNo").val();
            if (orderNo === "") {
                $("#txtScanProduct").prop("disabled", true);
            } else {
                $("#txtScanProduct").prop("disabled", true);
                $("#txtScanProduct").focus();
            }
            return false;
        }
    });

    $("#txtVendorName").on("focus", function () {
        $(this).val("");
        $("#txtAddress").val("");
        $("#txtOrderNo").html('<option value="">Select</option>');
        $("#txtScanProduct").prop("disabled", true);
    });
});
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

            var apiDate = DatePickerForDownloadDate(apiDateRaw);
            var $to = $('#txtDate');

            try { $to.datepicker('destroy'); } catch (e) { }

            $to.datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
                startDate: $to
            });

            if (apiDate) {
                $challan.datepicker('setDate', apiDate);
            }
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function DatePickerForDownloadDate(date) {
    $('#txtDate').val(date);
    $('#txtDate').datepicker({
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

                $('#txtVendorName')[0].innerHTML = option;
                $('#txtVendorName')[0].innerHTML = option;

                $('#txtVendorName').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtVendorName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtVendorName').empty();
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

                $('#txtOrderNo')[0].innerHTML = option;
                $('#txtOrderNo')[0].innerHTML = option;
              
                $('#txtOrderNo').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtOrderNo').empty();
                $("#txtSaveAlls").hide();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtOrderNoList').empty();
        }
    });

}
function SaveManualSalesReturnScanQty() {
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
                showToast(response.Msg);
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
                $("#txtshow").show();
                $("#DataTable").show();
                const StringFilterColumn = ["UPI ID", "Client Name", "Order No", "BuyerPO No"];
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
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchPanding('${item["UPI ID"]}')"><i class="fa-solid fa-save"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
                originalDispatchData = [];
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            originalDispatchData = [];
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
                showToast(response.Msg);
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
function StartDispatchAll(G_SalesReturnMaster_Code) {
    blockUI();
    
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateSalesUPIIDAll?Code=${G_SalesReturnMaster_Code}`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        // data: JSON.stringify(ManualSalesReturn),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status == 'Y') {
                showToast(response.Msg);
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

function GetDispatchOrderLists(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetSalesData?p_Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtshowa").show();

                $("#DataTable").show();
                const StringFilterColumn = ["UPI ID", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
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
                //const updatedResponse = response.map(item => ({
                //    ...item
                //    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchOrderNo('${item["UPI ID"]}')"><i class="fa-solid fa-save"></i></button>`
                //}));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
                originalDispatchData = [];
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            originalDispatchData = [];
        }
    });
}
function StartDispatchOrderNo() {
    blockUI();
    var orderCode = $("#txtOrderNo").val();
    var ClientMasterCode = $("#txtVendorName").val();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/StartDispatchOrderNo?ScanBy=${UserMaster_Code}&OrderMasterCode=${orderCode}&ClientMasterCode=${ClientMasterCode}`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const data = response.data || response;

            if (data.Status === 'Y') {
                showToast(data.Msg);
                $("#SuccessVoice")[0].play();
                GetDispatchOrderLists(G_value); 
            } else {
                showToast(data.Msg);
                $("#txtScanProduct").val("").focus();
                GetDispatchOrderLists(G_value); 
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Dispatch error:", error);
            //showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("").focus();
            unblockUI();
        }
    });
}

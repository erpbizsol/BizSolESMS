
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let Data = [];
let UserName = authKeyData.UserID;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
let AccountList = [];
let ItemDetail = [];
let G_OrderList = [];
let G_DispatchMaster_Code = 0;
let G_Tab = 1;
let All = 0;
let G_IDFORTRCOLOR = '';

$(document).ready(function () {
   
    DatePicker();
    GetDispatchOrderLists('GETCLIENT');
    GetOrderNoList1();
    $("#ERPHeading").text("Dispatch Entry");
    $('#txtChallanDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtClientName").focus();
        }
    });
    $('#txtClientName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPackedBy").focus();
        }
    });
    
    $('#txtVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            let firstInput = $('#tblorderbooking #Orderdata tr:first input').first();
            firstInput.focus();
        }
    });
    GetAccountMasterList();
    GetModuleMasterCode();
    $("#txtClientName").on("focus", function () {
        $("#txtClientName").val("");
    });
    $("#txtClientName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtClientNameList option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtAddress").val("")
        }
    });
   
    $("#pendingOrder").click(function () {
      
        GetDispatchOrderLists('GETCLIENT');
   
    });

    $("#despatchTransit").click(function () {
        
        GetDespatchTransitOrderList('DespatchTransit');
       
    });

    $("#completedDespatch").click(function () {
        
        GetCompletedDespatchOrderList('CompletedDespatch');
      
    });

    $('#txtScanProduct').on('keydown', function (e) {
        if (e.key === "Enter") {
            SaveScanQty();
          
        }
    });
   
    $("#txtOrderNo").on("change", function () {
        let value = $(this).val();
        let isValid = false;
            if ($(this).val() === value) {
                const item = G_OrderList.find(entry => entry.OrderNoWithPrefix == value);
                if (item.Code != undefined) {
                    CreateOrderNo(item.Code);

                }
                isValid = true;
                return false;
            }
        if (!isValid) {
            $(this).val("");
        }
    });
    $("#ShowAll").click(function () {
        All = 1;
        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS")
    });
  
    $('#txtScanProduct').on('focus', function (e) {
        if ($("#txtIsManual").is(':checked')) {
            var inputElement = this;
            setTimeout(function () {
                inputElement.setAttribute('inputmode', '');
            }, 2);
            
        } else {
            var inputElement = this;
            setTimeout(function () {
                inputElement.setAttribute('inputmode', 'none');
            }, 2);
        }
    });
  
    GetUserNameList();
});
function BackMaster() {
    G_IDFORTRCOLOR = '';
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    disableFields(false);
    $("#btnShowAll").hide();
    $("#txtOrderNo").prop("disabled", true);
    $("#txtPackedBy").prop("disabled", false);
    if (G_Tab == 3) {
        GetCompletedDespatchOrderList('CompletedDespatch');
        GetUserNameList();
    }
    if (G_Tab == 2) {
        GetDespatchTransitOrderList('DespatchTransit');
        GetUserNameList();

    }
    if (G_Tab == 1) {
        GetDispatchOrderLists('GETCLIENT');
        GetUserNameList();
        
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
            if (response.length > 0) {
                AccountList = response;
                $('#txtClientNameList').empty();
                let options = '';
                options += '<option value="All" text="0"></option>';
                response.forEach(item => {
                    options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
                });
                $('#txtClientNameList').html(options);
            } else {
                $('#txtClientNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtClientNameList').empty();
        }
    });
}
function ClearData() {
    G_DispatchMaster_Code = 0;
    All = 0;
    $("#hfCode").val("0");
    $("#txtChallanNo").val("");
    //$("#txtOrderNo").val("");
    $("#txtScanProduct").val("");
    $("#txtClientDispatchName").val("");
    $("#tblDispatchData").hide();
    $("#txtScanProduct").attr('inputmode', '');
    //$("#txtPackedBy").val("");
    SelectOptionByText('txtOrderNo','Select');
    SelectOptionByText('txtPackedBy','Select');
}
function OnChangeNumericTextBox(element) {

    element.value = element.value.replace(/[^0-9]/g, "");
    if (Number.isInteger(parseInt(element.value)) == true) {
        element.setCustomValidity("");

    } else {
        element.setCustomValidity("Only allowed Numbers");
    }
    element.reportValidity();
}
function OnKeyDownPressFloatTextBox(event, element) {
    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Float Numbers");
        element.reportValidity();
        return false;
    }
}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Dispatch");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function setupDateInputFormatting() {
    $('#txtChallanDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);
        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtChallanDate').val('');

        }
    } else {
        $('#txtChallanDate').val('');

    }
}
function DatePicker() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            let apiDate = response[0].Date;
            $('#txtChallanDate').val(apiDate);

            $('#txtChallanDate').datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
            });
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchOrderList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                Export(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Export(jsonData) {
    const columnsToRemove = ["Code"];
    if (!Array.isArray(columnsToRemove)) {
        console.error("columnsToRemove should be an array");
        return;
    }
    const filteredData = jsonData.map(row =>
        Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
    );
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "DispatchOrder.xlsx");
}
function ScanItemForDispatch() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code: $("#hfCode").val(),
        ScanNo: $("#txtScanProduct").val(),
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                StartDispatch($("#hfCode").val())
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
function GetDispatchOrderLists(Mode) {
    G_Tab = 1;
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["Total Order Qty", "Total Balance Qty"];
                const DateFilterColumn = ["Order Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Total Order Qty": 'right',
                    "Total Balance Qty": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchPanding('${item.Code}','ORDERDETAILS')"><i class="fa-solid fa-pencil"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function StartDispatchPanding(Code, Mode) {
    if (G_DispatchMaster_Code === 0) {
        GetUserNameList();
    }
    G_Tab = 1;
    $("#btnShowAll").hide();
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    //$("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    //$("#txtPackedBy").val(OrderMaster.PackedBy);
                    SelectOptionByText('txtPackedBy', OrderMaster.PackedBy || "");
                    if (G_DispatchMaster_Code > 0) {
                        $("#txtPackedBy").prop("disabled", true);
                    } else {
                        $("#txtPackedBy").prop("disabled", false);
                    }
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Scan Qty":"right;width:70px;",
                        "Packing Qty":"right;width:70px;",
                        "Manual Qty":"right;width:70px;",
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Packing Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function checkValidateqty(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
        $("#txtManualQty_" + Code).focus();
    } else {
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqty1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
    } else {
        if ($("#txtPackedBy").val() === '') {
            toastr.error("Please select packed by..!");
            StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
            return;
        }else if ($("#txtBoxNo").val() === '') {
            toastr.error("Please enter box no..!");
            StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
            return;
        }
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            G_IDFORTRCOLOR = "txtDispatchQty_" + Code;
            SaveNewManualQty(Code, scanQty, manualQty, total);
        }
    }
}
function OnChangeNumericTextBox(event, element) {
    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Float Numbers");
        element.reportValidity();
        return false;
    }
}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}
function SaveEditManualQty(Code, ScanQty, ManualQty, DispatchQty) {
    if ($("#txtBoxNo").val() === '') {
        toastr.error("please enter box no..!");
        return;
    }
    const payload = {
        Code: Code,
        DispatchMaster_Code: G_DispatchMaster_Code,
        ScanNo: "",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        DispatchQty: DispatchQty,
        UserMaster_Code: UserMaster_Code,
        PackedBy: $("#txtPackedBy").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch?Mode=Edit`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                if (G_Tab == 2) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3){
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
                G_IDFORTRCOLOR = 'GET';
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function SaveNewManualQty(Code, ScanQty, ManualQty, DispatchQty) {
    if ($("#txtBoxNo").val() === '') {
        toastr.error("please enter box no..!");
        return;
    }
    const payload = {
        Code: Code,
        DispatchMaster_Code:G_DispatchMaster_Code,
        ScanNo: "",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        DispatchQty: DispatchQty,
        UserMaster_Code: UserMaster_Code,
        PackedBy: $("#txtPackedBy").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch?Mode=New`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
                StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                G_IDFORTRCOLOR = 'GET';
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function SaveScanQty() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    } else if ($("#txtPackedBy").val() === '') {
        toastr.error("Please select packed by..!");
        return;
    } else if ($("#txtBoxNo").val() === '') {
        toastr.error("Please enter box no..!");
        return;
    }
    const payload = {
        Code: $("#hfCode").val(),
        ScanNo: $("#txtScanProduct").val(),
        ScanQty: 0,
        ManualQty: 0,
        DispatchQty: 0,
        DispatchMaster_Code: G_DispatchMaster_Code,
        UserMaster_Code: UserMaster_Code,
        PackedBy: $("#txtPackedBy").val(),
        BoxNo: $("#txtBoxNo").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch?Mode=Scan`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
                $("#SuccessVoice")[0].play();
                if (G_Tab == 1) {
                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                }
                else if (G_Tab == 2) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3) {
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
                G_IDFORTRCOLOR = 'GET';
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            } else if (response[0].Status == 'N') {
                G_IDFORTRCOLOR = '';
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            } else {
                G_IDFORTRCOLOR = '';
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("");
            $("#txtScanProduct").focus();
        }
    });

}
async function StartDispatchTransit(Code,DispatchMaster_Code, Mode) {
    G_DispatchMaster_Code = DispatchMaster_Code;
    G_Tab = 2;
    $("#hfCode").val(Code);
    var Code1 = Code;
    $("#btnShowAll").show();
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code1}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    //$("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtChallanDate").val(OrderMaster.ChallanDate || "");
                    //$("#txtPackedBy").val(OrderMaster.PackedBy);
                    SelectOptionByText('txtPackedBy', OrderMaster.PackedBy);
                    $("#txtPackedBy").prop("disabled", true);
                    $("#txtScanProduct").prop("disabled", false);
                    disableFields(false);
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty","ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
                        "Manual Qty": "right;width:70px;",
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyTransit(this,${item.Code});" onfocusout="checkValidateqtyTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Packing Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function checkValidateqtyTransit(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        if (All == 0) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
        } else if (All == 1) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
        }
        $("#txtManualQty_" + Code).focus();
    } else {
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqtyTransit1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        if (All == 0) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
        } else if (All == 1) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
        }
    } else {
        if ($("#txtPackedBy").val() === '') {
            toastr.error("Please select packed by..!");
            if (All == 0) {
                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
            } else if (All == 1) {
                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
            }
            return;
        } else if ($("#txtBoxNo").val() === '') {
            toastr.error("Please enter box no..!");
            if (All == 0) {
                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
            } else if (All == 1) {
                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
            }
            return;
        }
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveEditManualQty(Code, scanQty, manualQty, total);
        }
    }
}
function GetDespatchTransitOrderList(Mode) {
    G_Tab = 2;
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["Order Qty", "Total Dispatch Qty"];
                const DateFilterColumn = ["Despatch Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "D_Code"];
                const ColumnAlignment = {
                    "Total Dispatch Qty": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchTransit('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function GetCompletedDespatchOrderList(Mode) {
    G_Tab = 3;
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["Order Qty", "Total Dispatch Qty"];
                const DateFilterColumn = ["Despatch Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "D_Code"];
                const ColumnAlignment = {
                    "Total Dispatch Qty": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchCompleteTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="Report('${item.D_Code}','CDETAILS')"><i class="fa fa-download" aria-hidden="true"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function StartDispatchCompleteTransit(Code, Mode) {
    G_DispatchMaster_Code = Code;
    G_Tab = 3;
    $("#btnShowAll").hide();
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    //$("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    SelectOptionByText('txtPackedBy', OrderMaster.PackedBy || "");
                    //$("#txtPackedBy").val(OrderMaster.PackedBy);
                    $("#txtPackedBy").prop("disabled", true);
                    $("#txtScanProduct").prop("disabled", false);
                    disableFields(false);
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Ord Qty", "Bal Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
                        "Manual Qty": "right;width:70px;",
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyCompleteTransit(this,${item.Code});" onfocusout="checkValidateqtyCompleteTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Packing Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function checkValidateqtyCompleteTransit(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
        $("#txtManualQty_" + Code).focus();
    } else {
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqtyCompleteTransit1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
    } else {
        if ($("#txtPackedBy").val() === '') {
            toastr.error("Please select packed by..!");
            StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
            return;
        } else if ($("#txtBoxNo").val() === '') {
            toastr.error("Please enter box no..!");
            StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
            return;
        }
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveEditManualQty(Code, scanQty, manualQty, total);
        }
    }
}
async function StartDispatchOrderNo() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtOrderNo").prop("disabled", false);
    $("#txtScanProduct").prop("disabled", false);
    $("#txtPackedBy").prop("disabled", false);
    GetUserNameList();
    disableFields(false);
}
function CreateOrderNo(Code) {
    StartDispatchPanding(Code, "ORDERDETAILS");
    GetUserNameList();
}
function GetOrderNoList1() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetOrderNoList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_OrderList = response;
            if (response.length > 0) {
                    let option = '<option value="">Select</option>';
                    $.each(response, function (key, val) {

                        option += '<option value="' + val["OrderNoWithPrefix"] + '">' + val["OrderNoWithPrefix"] + '</option>';
                    });

                    $('#txtOrderNo')[0].innerHTML = option;
                    $('#txtOrderNo')[0].innerHTML = option;

                $('#txtOrderNo').select2({
                        width: '-webkit-fill-available'
                    });
                } else {
                    $('#txtOrderNo').empty();
                }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtOrderNoList').empty();
        }
    });

}
async function ViewDespatchTransit(Code, Mode) {
    G_DispatchMaster_Code = Code;
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    $("#txtOrderNo").val(OrderMaster.OrderNo || "");
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtChallanDate").val(OrderMaster.ChallanDate || "");
                    SelectOptionByText('txtPackedBy', OrderMaster.PackedBy);
                    //$("#txtPackedBy").val(OrderMaster.PackedBy);
                    $("#txtPackedBy").prop("disabled", true);
                    $("#txtScanProduct").prop("disabled", true);
                    disableFields(true);
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
                        "Manual Qty": "right;width:70px;",
                    };
                    const updatedResponse = Response.map(item => ({
                        ...item,
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" disabled value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyTransit(this,${item.Code});" onfocusout="checkValidateqtyTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Packing Qty": `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`,
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
async function DeleteItem(code, Order, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'DispatchMaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this Despatch ${Order} .?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/DeleteDispatchOrder?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    if (G_Tab == 2) {
                        GetDespatchTransitOrderList('DespatchTransit');
                    } else if (G_Tab == 3) {
                        GetCompletedDespatchOrderList('CompletedDespatch');
                    }
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);

            }
        });
    }
    else {
        $('tr').removeClass('highlight');
    }
}
function MarkasCompete(code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetMarkasCompeteByOrderNo?Code=${code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                GetDespatchTransitOrderList('DespatchTransit');
            } else {
                toastr.error("Unexpected response format.");
            }

        },
        error: function (xhr, status, error) {
            toastr.error("Error deleting item:");

        }
    });
}
function disableFields(disable) {
    $("#txtCreatepage").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
function GetUserNameList() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetEmployeeList?UserMaster_Code=${UserMaster_Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["EmployeeName"] + '">' + val["EmployeeName"] + '</option>';
                });

                $('#txtPackedBy')[0].innerHTML = option;
                $('#txtPackedBy')[0].innerHTML = option;

                $('#txtPackedBy').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtPackedBy').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtPackedBy').empty();
        }
    });
}
function Report(C_Code) {
    $.ajax({
        url: `${AppBaseURLMenu}/Home/OrderMaster`,
        type: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        data: {
            ReportType: "PDF",
            newConnectionString: authKeyData,
            p_Code: C_Code,
            UserName: UserName
        },
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data) {
            let blob = new Blob([data], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = "DispatchReport.pdf"; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },
        error: function (xhr, status, error) {
            console.error('Error:', xhr.responseText);
        }
    });
}
function changeValue(delta) {
    const input = document.getElementById('txtBoxNo');
    let value = parseInt(input.value) || 1;
    value += delta;
    if (value < 1) value = 1;
    input.value = value;
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#DispatchTable-Body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[11]?.textContent.trim();
        if (columnValue === 'GREEN') {
            row.style.backgroundColor = '#07bb72';
            tds.forEach(td => {
                td.style.color = '#ffffff';
            });
        } else if (columnValue === 'YELLOW') {
            row.style.backgroundColor = '#ebb861';
            tds.forEach(td => {
                td.style.color = '#ffffff';
            });
        } else {
            row.style.backgroundColor = '#f5c0bf';
            
        }
    });
}

setInterval(ChangecolorTr, 100);
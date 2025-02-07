
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let Data = [];
$(document).ready(function () {
    $("#ERPHeading").text("Box-Validation");
    $('#txtBoxNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            BoxValidationDetail();
            $("#txtScanProduct").focus();
        }
    });
    $('#txtScanProduct').on('keydown', function (e) {
        if (e.key === "Enter") {
            SaveScanValidationDetail();
        }
    });
    $("#btnAutoUpdate").click(function () {
        AutoUpdateReceivedQty();
    });
    MRNDetail();
});
function BoxValidationDetail() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: $("#txtCode").val(),
        ScanNo: $("#txtScanProduct").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetBoxValidateDetail`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                Data = response;
                if (response[0].Status == 'Y') {
                    $("#UnloadingTable").show();
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code", "Item Bar Code"];
                    const hiddenColumns = ["Msg", "Status","Code"];
                    const ColumnAlignment = {
                        Qty: "right"
                    };
                    const updatedResponse = response.map(item => ({
                        ...item, 
                        "Scan Qty": `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        "Manual Qty": `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        "Received Qty":`
                        <input type="text" id="txtReceivedQty_${item.Code}" value="${item["Received Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Received Qty..">`
                    }));
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                } else {
                    $("#txtBoxNo").focus();
                    showToast(response[0].Msg);
                    $("#UnloadingTable").hide();
                }
            } else {
                $("#txtBoxNo").focus();
                $("#UnloadingTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
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
function checkValidateqty(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item.Qty)) {
        toastr.error("Invalid Received Qty!");
        $("#txtReceivedQty_" + Code).val(0);
        $("#txtManualQty_" + Code).focus();
        $(element).val(0);
    } else {
        $("#txtReceivedQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveManualValidationDetail(Code, scanQty, manualQty, total );
        }
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

    if (total > parseInt(item.Qty)) {
        toastr.error("Invalid Received Qty!");
        $("#txtReceivedQty_" + Code).val(0);
        $(element).val(0);
    } else {
        $("#txtReceivedQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveManualValidationDetail(Code, scanQty, manualQty, total);
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
function SaveManualValidationDetail(Code,ScanQty,ManualQty,ReceivedQty) {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: Code,
        ScanNo:"",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        ReceivedQty: ReceivedQty
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/SaveManualBoxValidateDetail`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status=='Y') {
                BoxValidationDetail();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function SaveScanValidationDetail() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    } if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: 0,
        ScanNo: $("#txtScanProduct").val(),
        ScanQty: 0,
        ManualQty: 0,
        ReceivedQty: 0
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/SaveScanBoxValidateDetail`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                BoxValidationDetail();
                $("#txtScanProduct").focus();
            } else if (response[0].Status == 'N') {
                toastr.error(response[0].Msg);
                $("#txtScanProduct").focus();
            } else {
                toastr.error("No Data found");
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Error:", error);
        }
    });

}
function AutoUpdateReceivedQty() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: 0,
        ScanNo:""
    }
    if (confirm("Are you sure you want to auto update received qty ?")) {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/AutoUpdateReceivedQty`,
            type: 'POST',
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status == 'Y') {
                    BoxValidationDetail();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    }
}
function MRNDetail() {
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetMRNDetailForValidate`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#UnloadingTable1").show();
                const StringFilterColumn = ["PickList No", "Vehicle No"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "Validation Status"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-success icon-height mb-1"  title="Start Un-Loading" onclick="StartValidation('${item["PickList No"]}','${item["Vehicle No"]}','${item.Code}')"><i class="fa fa-hourglass-start"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header1", "table-body1", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#UnloadingTable1").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function StartValidation(PickListNo, VehicleNo, Code) {
    $("#ValidateFrom").show();
    $("#UnloadingTable1").hide();
    $("#txtPickListNo").val(PickListNo);
    $("#txtVehicleNo").val(VehicleNo);
    $("#txtCode").val(Code);
}
function Back() {
    $("#UnloadingTable1").show();
    $("#UnloadingTable").hide();
    $("#ValidateFrom").hide();
    $("#txtPickListNo").val("");
    $("#txtVehicleNo").val("");
    $("#txtCode").val("0");
    $("#txtBoxNo").val("");
}

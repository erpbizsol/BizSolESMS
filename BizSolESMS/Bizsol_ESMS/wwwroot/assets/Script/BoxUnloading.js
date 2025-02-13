
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Box-Unloading");
    $('#txtBoxNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            BoxUnloading();
            $("#txtBoxNo").focus();
        }
    });
    MRNDetail();
    
});
function BoxUnloading() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    var Code =parseInt($("#txtCode").val())
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        Code: Code
    }
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/BoxUnloading`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                if (response[0].Status == 'Y') {
                    $("#UnloadingTable").show();
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code","Item Bar Code"];
                    const hiddenColumns = ["Msg","Status"];
                    const ColumnAlignment = {
                        Qty: "right"
                    };
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                    $("#txtBoxNo").focus();
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
            showToast("INVALID BOX NO !");
            $("#UnloadingTable").hide();
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
    }, 250);
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
function MRNDetail() {
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetMRNDetailForUnloading`,
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
                    const hiddenColumns = ["Code","Status"];
                    const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-success icon-height mb-1"  title="Start Un-Loading" onclick="StartUnloading('${item["PickList No"]}','${item["Vehicle No"]}','${item.Code}')"><i class="fa fa-hourglass-start"></i></button>
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
function StartUnloading(PickListNo, VehicleNo,Code) {
    $("#UnloadingForm").show();
    $("#txtheaderdiv").show();
    $("#UnloadingTable1").hide();
    $("#txtPickListNo").val(PickListNo);
    $("#txtVehicleNo").val(VehicleNo);
    $("#txtCode").val(Code);
}
function Back() {
    $("#UnloadingTable1").show();
    $("#UnloadingTable").hide();
    $("#UnloadingForm").hide();
    $("#txtPickListNo").val("");
    $("#txtVehicleNo").val("");
    $("#txtCode").val("0");
    $("#txtBoxNo").val("");
    $("#txtheaderdiv").hide();
}
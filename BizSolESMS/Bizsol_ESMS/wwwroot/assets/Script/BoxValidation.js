
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Box-Validation");
    $('#txtBoxNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            BoxUnloading();
            $("#txtBoxNo").focus();
        }
    });
    $("#txtScanToggle").on("change", function () {
        let value = $(this).prop("checked") ? "Scan" : "Manual";
        if (value == 'Scan') {
            //$("#txtScanProduct").prop("disabled", false);
            $("#divScanProduct").show();
        } else {
            //$("#txtScanProduct").prop("disabled", true);
            $("#divScanProduct").hide();
        }
    });
});
function BoxUnloading() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    const payload = {
        BoxNo: $("#txtBoxNo").val()
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
                    const StringdoubleFilterColumn = ["Item Name", "Item Code", "Item Bar Code"];
                    const hiddenColumns = ["Msg", "Status"];
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
    }, 80);
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

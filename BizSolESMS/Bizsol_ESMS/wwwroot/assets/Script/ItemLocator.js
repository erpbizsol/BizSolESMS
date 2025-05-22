
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let Data = [];
$(document).ready(function () {
    $("#ERPHeading").text("Item Locator");
    $('#txtScanProduct').on('keydown', function (e) {
        if (e.key === "Enter") {
            BoxValidationDetail();
        }
    });
    $('#txtScanProduct').on('focus', function (e) {
        var inputElement = this;
        setTimeout(function () {
            inputElement.setAttribute('inputmode', 'none');
        }, 2);
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    GetModuleMasterCode();
    $("#btnSaveLocation").on("click", function () {
        Savelocation();
    });
});
function BoxValidationDetail() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan box/item !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code: document.querySelector('input[name="txtScan"]:checked').value,
        ScanNo: $("#txtScanProduct").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowItemDetailsOnScan`,
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
                    $("#SuccessVoice")[0].play();
                    $("#UnloadingTable").show();
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code", "Item Bar Code"];
                    let hiddenColumns = ["Code","Msg","Status"];
                    const ColumnAlignment = {
                    };
                    const updatedResponse = response.map(item => ({
                        ...item,
                        "Item Location": item["Item Location"] == '' ? `<button class="btn btn-primary icon-height mb-1"  title="Create location" onclick="CreateLocation('${item.Code}')"><i class="fa-solid fa-plus"></i></button>` : `${item["Item Location"]}`,
                      }));
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                    $("#txtScanProduct").focus();
                } else {
                    $("#txtScanProduct").focus();
                    $("#txtScanProduct").val("");
                    showToast(response[0].Msg);
                    $("#UnloadingTable").hide();
                }
            } else {
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
                $("#UnloadingTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID BOX NO !");
            $("#UnloadingTable").hide();
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
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Box Validation");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function CreateLocation(Code) {
    LocationList();
    $("#hfItemCode").val(Code);
    $("#LocationModal").modal({
        backdrop: 'static',
    });
    $('#LocationModal').modal('show');
}
function LocationList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowLocationMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0) {
                SetUpAutoSuggestion($('#txtLocationName'), $('#txtLocationNameList'), response.map((item) => ({ Desp: item["Location Name"] })), 'StartWith');
            } else {
                $('#txtLocationNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function ClearLocationData() {
    G_IsCheckExists = 'N';
    $("#hfItemCode").val('0'),
        $("#txtLocationName").val('')
    $('#LocationModal').modal('hide');
}

let G_IsCheckExists = 'N';
function Savelocation() {
    var LocationName = $("#txtLocationName").val();
    if (LocationName === '') {
        toastr.error('Please enter location name !');
        $("#txtLocationName").focus();
    }
    else {
        const payload = {
            Code: $("#hfItemCode").val(),
            LocationName: $("#txtLocationName").val()
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/CreateLocationFromItemMaster?UserMaster_Code=${UserMaster_Code}&IsCheckExists=${G_IsCheckExists}`,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status === 'Y') {
                    toastr.success(response[0].Msg);
                    G_IsCheckExists = 'N';
                    ClearLocationData();
                    BoxValidationDetail();
                } else if (response[0].Status === 'N') {
                    if (confirm(`${response[0].Msg}`)) {
                        G_IsCheckExists = 'Y';
                        Savelocation();
                    }
                }
                else {
                    toastr.error(response[0].Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            }
        });

    }
}
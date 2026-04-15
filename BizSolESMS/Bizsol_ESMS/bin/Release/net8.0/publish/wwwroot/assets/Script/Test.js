
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let CaseNo = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
$(document).ready(function () {
    DownloadDispatchQR(70)
    $("#ERPHeading").text("Box-Unloading");
    $('#txtBoxNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            BoxUnloading();
            $("#txtBoxNo").focus();
        }
    });
    $('#txtBoxNo').on('focus', function (e) {
        var inputElement = this;

        if ($("#chkScan").is(":checked")) {
            setTimeout(function () {
                inputElement.setAttribute('inputmode', 'none');
            }, 2);
        }
    });
    $('#txtBoxNo').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    //MRNDetail();
    $("#txtCode").on('change keydown paste input', function () {

        let textValue = $("#txtCode").val();
        $("#qrcodeview").html("");

        var qrcode = new QRCode("qrcodeview", {
            text: textValue,
            width: 100,
            height: 100,
        });
    });

});
//function BoxUnloading() {
//    if ($("#txtBoxNo").val() == '') {
//        toastr.error("Please enter a Box No !");
//        $("#txtBoxNo").focus();
//        return;
//    }
//    var Code =parseInt($("#txtCode").val())
//    const payload = {
//        BoxNo: $("#txtBoxNo").val(),
//        Code: Code
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/MRNMaster/BoxUnloading`,
//        type: 'POST',
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                if (response[0].Status == 'Y') {
//                    $("#UnloadingTable").show();
//                    const StringFilterColumn = [];
//                    const NumericFilterColumn = ["Qty"];
//                    const DateFilterColumn = [];
//                    const Button = false;
//                    const showButtons = [];
//                    const StringdoubleFilterColumn = ["Item Name", "Item Code","Item Bar Code"];
//                    const hiddenColumns = ["Msg","Status"];
//                    const ColumnAlignment = {
//                        Qty: "right"
//                    };
//                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
//                    $("#txtBoxNo").focus();
//                } else {
//                    $("#txtBoxNo").focus();
//                    showToast(response[0].Msg);
//                    $("#UnloadingTable").hide();
//                }
//            } else {
//                $("#txtBoxNo").focus();
//                $("#UnloadingTable").hide();
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            showToast("INVALID BOX NO !");
//            $("#UnloadingTable").hide();
//        }
//    });

//}
function BoxUnloading() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    var Code = parseInt($("#txtCode").val())
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
                    GetDataByPicklist();
                    CaseNo = response[0].CaseNo;
                    goToRow(CaseNo);
                    $("#txtBoxNo").focus();
                } else {
                    CaseNo = 0;
                    $("#txtBoxNo").focus();
                    showToast(response[0].Msg);
                }
            } else {
                $("#txtBoxNo").focus();
                toastr.error("Record not found...!");
                CaseNo = 0;
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID BOX NO !");
            CaseNo = 0;
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
function DataExport() {
    $.ajax({
        url: `/Report/Test1`,
        type: 'Post',
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            if (response.length > 0) {
                alert("Ok")
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function StartUnloading(PickListNo, VehicleNo, Code) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#UnloadingForm").show();
    $("#txtheaderdiv").show();
    $("#UnloadingTable1").hide();
    $("#txtPickListNo").val(PickListNo);
    $("#txtVehicleNo").val(VehicleNo);
    $("#txtCode").val(Code);
    //$('#txtBoxNo').focus();
    GetDataByPicklist();
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
    CaseNo = 0;
}
function GetDataByPicklist() {
    var Code = $("#txtCode").val();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/MRNDetailsByCode?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.MRNDetails && response.MRNDetails.length > 0) {
                    $("#UnloadingTable").show();
                    const StringFilterColumn = ["CaseNo", "ItemBarCode", "ItemCode", "ItemName"];
                    const NumericFilterColumn = [];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code", "BillQtyBox", "Status", "ReceivedQtyBox", "BillQty", "ReceivedQty", "ItemRate", "Amount", "Remarks", "UOMName", "LocationName", "WarehouseName"];
                    const ColumnAlignment = {
                    };
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response.MRNDetails, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                } else {
                    toastr.error("Record not found...!");
                    $("#UnloadingTable").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#UnloadingTable").hide();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}
function ChangecolorTr1() {
    const rows = $('#table-body tr');
    rows.each(function () {
        const columnValue = $(this).find('td').eq(9).text().trim();
        const columnValue1 = $(this).find('td').eq(8).text().trim();
        if (parseInt(columnValue1) !== parseInt(CaseNo)) {
            if (columnValue === 'Y') {
                $(this).css('background-color', '#c3f1c7');
            } else {
                $(this).css('background-color', '');
            }
        }
    });
    if (parseInt(CaseNo) > 0) {
        var td = rows.find('td').filter(function () {
            return $(this).text().trim() === String(CaseNo);
        });
        if (td.length > 0) {
            var tr = td.closest("tr");
            tr.css('background-color', '#2be399');
        } else {
            console.log('No matching row found for CaseNo:', CaseNo);
        }
    }
}

setInterval(ChangecolorTr1, 100);
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Box Unloading");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
//function DownloadDispatchQR(Code) {
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetDispatchQRDetail?Code=${Code}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: function (response) {
//            if (response.length > 0) {
//                $("#qrcodeview").html("");
//                response.forEach(function (item, index) {
//                    var textValue = item.QRCode ;
//                    var divId = `qrcode_${index}`;
//                    $("#qrcodeview").append(`<div id="${divId}" style="display:inline-block; margin:10px;"></div><br/>`);

//                    new QRCode(document.getElementById(divId), {
//                        text: textValue,
//                        width: 100,
//                        height: 100,
//                    });
//                });
//            } else {
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });
//}
//async function DownloadDispatchQR(Code) {
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/GetDispatchQRDetail?Code=${Code}`,
//        type: 'GET',
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader('Auth-Key', authKeyData);
//        },
//        success: async function (response) {
//            if (response.length > 0) {
//                $("#qrcodeview").html("");

//                for (let i = 0; i < response.length; i++) {
//                    const item = response[i];
//                    const textValue = item.QRCode;
//                    const divId = `qrcode_${i}`;
//                    $("#qrcodeview").append(`<div id="${divId}" style="display:none;"></div>`);

//                    new QRCode(document.getElementById(divId), {
//                        text: textValue,
//                        width: 100,
//                        height: 100,
//                    });
//                    await new Promise(resolve => setTimeout(resolve, 300));
//                    const canvas = $(`#${divId} canvas`)[0];
//                    if (canvas) {
//                        const base64Image = canvas.toDataURL('image/png');
//                        response[i].QRCode = base64Image;
//                    }
//                }
//                DownloadReportPdf(response);
//            } else {
//                toastr.error("Record not found...!");
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", error);
//        }
//    });
//}
//function DownloadReportPdf(response) {
//    var Code = $("#hfDownloadCode").val();
//    $.ajax({
//        url: `${AppBaseURLMenu}/RDLC/PSRReport?Code=${Code}&AuthKey=${authKeyData}`,
//        type: 'GET',
//        xhrFields: {
//            responseType: 'blob'
//        },
//        data: JSON.stringify(response),
//        success: function (data, status, xhr) {
//            let blob = new Blob([data], { type: 'application/pdf' });
//            let url = window.URL.createObjectURL(blob);
//            let a = document.createElement('a');
//            a.href = url;
//            a.download = "Report.pdf";
//            document.body.appendChild(a);
//            a.click();
//            document.body.removeChild(a);
//            window.URL.revokeObjectURL(url);
//        },
//        error: function (xhr, status, error) {
//            console.error('Error downloading report:', xhr.responseText);
//        }
//    });
//}

async function DownloadDispatchQR(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchQRDetail?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            if (response.length > 0) {
                $("#qrcodeview").html("");

                for (let i = 0; i < response.length; i++) {
                    const item = response[i];
                    const textValue = item.QRCode;
                    const divId = `qrcode_${i}`;
                    $("#qrcodeview").append(`<div id="${divId}" style="display:none;"></div>`);

                    new QRCode(document.getElementById(divId), {
                        text: textValue,
                        width: 100,
                        height: 100,
                    });

                    await new Promise(resolve => setTimeout(resolve, 300));

                    const canvas = $(`#${divId} canvas`)[0];
                    if (canvas) {
                        const base64Image = canvas.toDataURL('image/png');
                        response[i].QRCode = base64Image;
                    }
                }
                DownloadReportPdf(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function DownloadReportPdf(response) {
    $.ajax({
        url: `${AppBaseURLMenu}/RDLC/PrintDispatchQR`,
        type: 'POST',
        xhrFields: {
            responseType: 'blob'
        },
        contentType: 'application/json',
        data: JSON.stringify(response),
        success: function (data, status, xhr) {
            let blob = new Blob([data], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = "DispatchReport.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },
        error: function (xhr, status, error) {
            console.error('Error downloading report:', xhr.responseText);
        }
    });
}


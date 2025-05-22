
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let CaseNo = 0;
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
    $('#txtBoxNo').on('focus', function (e) {
        var inputElement = this;
            setTimeout(function () {
                inputElement.setAttribute('inputmode', 'none');
            }, 2);
    });
    $('#txtBoxNo').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    $('#txtBoxNo').on('focus', function (e) {
        if ($("#txtIsManual").is(':checked')) {
            var inputElement = this;
            setTimeout(function () {
                inputElement.setAttribute('inputmode', '');
            }, 2);
            ShowBoxNumberList($("#txtMRNDate").val());
        } else {
            var inputElement = this;
            setTimeout(function () {
                inputElement.setAttribute('inputmode', 'none');
            }, 2);
            $("#txtBoxNoList").empty();
        }
    });
    GetModuleMasterCode();
    $("#txtSearch").on("input", function () {
        G_Value = $(this).val().toLowerCase().trim();
        $("#table1 tbody tr").each(function () {
            var matched = false;
            $(this).find("td").each(function () {
                if ($(this).text().toLowerCase().includes(G_Value)) {
                    matched = true;
                }
            });
            $(this).toggle(matched);
        });
    });
});
function BoxUnloading() {
    if ($("#txtBoxNo").val() == '') {
        toastr.error("Please enter a Box No !");
        $("#txtBoxNo").focus();
        return;
    }
    var Code = parseInt($("#txtCode").val())
    const payload = {
        BoxNo: $("#txtBoxNo").val(),
        MRNDate: convertDateFormat($("#txtMRNDate").val()),
        VehicleNo: $("#txtVehicleNo").val(),
        IsManual: $("#txtIsManual").is(":checked") ? 'Y' :'N'
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
                    $("#SuccessVoice")[0].play();
                    GetDataByPicklist('Res');
                   $("#txtBoxNo").val("");
                    $("#txtBoxNo").focus();
                    $("#txtPicklistNo").val(response[0].PickListNo);
                } else {
                    $("#txtBoxNo").val("");
                    $("#txtBoxNo").focus();
                    showToast(response[0].Msg);
                }
            } else {
                $("#txtBoxNo").val("");
                $("#txtBoxNo").focus();
                toastr.error("Record not found...!");
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
                    const StringFilterColumn = ["Vehicle No"];
                    const NumericFilterColumn = [];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "Status", "Total Box"];
                    const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-success icon-height mb-1"  title="Start Un-Loading" onclick="StartUnloading('${item["MRN Date"]}','${item["Vehicle No"]}')"><i class="fa fa-hourglass-start"></i></button>
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
async function StartUnloading(MRNDate, VehicleNo) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#UnloadingForm").show();
    $("#txtheaderdiv").show();
    $("#UnloadingTable1").hide();
    $("#dvSearch").hide();
    $("#txtMRNDate").val(MRNDate);
    $("#txtVehicleNo").val(VehicleNo);
    $('#txtBoxNo').focus();
    GetDataByPicklist('Load');
}
function Back() {
    $("#UnloadingTable1").show();
    $("#UnloadingTable").hide();
    $("#UnloadingForm").hide();
    $("#txtMRNDate").val("");
    $("#txtVehicleNo").val("");
    $("#txtCode").val("0");
    $("#txtBoxNo").val("");
    $("#txtPicklistNo").val("");
    $("#txtheaderdiv").hide();
    $("#dvSearch").show();
}
function GetDataByPicklist(Orderby) {
    var MRNDate = convertDateFormat($("#txtMRNDate").val());
    var VehicleNo = $("#txtVehicleNo").val();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/MRNDetailsByVehicleNo?MRNDate=${MRNDate}&VehicleNo=${VehicleNo}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                    $("#UnloadingTable").show();
                    const StringFilterColumn = ["CaseNo"];
                    const NumericFilterColumn = [];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["SNo", "Code","SummaryCaseNo"];
                    const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item,
                    "Status": `<a style="cursor:pointer;" onclick=ShowCaseNoData(${item.Code},${item["PickList No"]})>${item["Status"]}</a>`,
                }));
                
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true);
                $("#txtBoxQty").text(response[0].SummaryCaseNo);
                
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
function ChangecolorTr() {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[3]?.textContent.trim();
        if (columnValue === 'FULLY UNLOADED') {
            row.style.backgroundColor = '#07bb72';

        } else if (columnValue === 'PARTIAL UNLOADED') {
            row.style.backgroundColor = '#ebb861';

        } else {
            row.style.backgroundColor = '#f5c0bf';

        }
    });
}

setInterval(ChangecolorTr, 100);
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Box Unloading");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function ShowBoxNumberList(PickListNo) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowBoxNumber?PickListNo=${PickListNo}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtBoxNoList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.BoxNo + '" text="' + item.BoxNo + '"></option>';
                });
                $('#txtBoxNoList').html(options);
            } else {
                $('#txtBoxNoList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtBoxNoList').empty();
        }
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function ShowCaseNoData(Code, PickListNo) {
    $("#hfMRNMaster_Code").val(Code);
    $("#hfPicklistNo").val(PickListNo)
    openSavePopup();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/ShowMRNMasterByCode?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.MRNDetails && response.MRNDetails.length > 0) {
                    $("#MRNTable").show();
                    const StringFilterColumn = ["CaseNo", "ItemBarCode", "ItemCode", "ItemName"];
                    const NumericFilterColumn = [];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code", "BillQtyBox", "Status", "ReceivedQtyBox", "ReceivedQty", "ItemRate", "Amount", "Remarks", "UOMName", "LocationName", "WarehouseName"];
                    const ColumnAlignment = {
                    };
                    BizsolCustomFilterGrid.CreateDataTable("ModalTable-header", "ModalTable-body", response.MRNDetails, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                } else {
                    toastr.error("Record not found...!");
                }
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch data. Please try again.");
        }
    });
}
function openSavePopup() {
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
    saveModal.show();
}
function ChangecolorTr1() {
    const rows = document.querySelectorAll('#ModalTable-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[9]?.textContent.trim();
        if (columnValue === 'Y') {
            row.style.backgroundColor = '#9ef3a5';
        } else {
            row.style.backgroundColor = '#f5c0bf';
        }
    });
}

setInterval(ChangecolorTr1, 100);
function DownloadInExcel() {
    var Code = $("#hfMRNMaster_Code").val();
    $.ajax({
        url: `${appBaseURL}/api/MRNMaster/GetExportBoxUnloading?Code=${Code}`,
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
    var Picklist = $("#hfPicklistNo").val();
    var ws = XLSX.utils.json_to_sheet(jsonData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "UnloadingReport_" + Picklist +".xlsx");
}
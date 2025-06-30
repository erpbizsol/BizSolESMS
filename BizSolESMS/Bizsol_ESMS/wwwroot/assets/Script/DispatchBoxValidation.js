var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let G_DispatchData = [];
const G_UserName = sessionStorage.getItem('UserName');
let G_DispatchMaster_Code = 0;
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
$(document).ready(function () {
    $("#ERPHeading").text("Dispatch Box Validation");
    GetModuleMasterCode();
    DispatchDetail();
    $('#txtScanProduct').on('input', function (e) {
        SaveDispatchBox();
    });
    $('#txtScanProduct').on('focus', function () {
        const inputElement = this;
        setTimeout(function () {
            inputElement.setAttribute('inputmode','none');
        }, 2);
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    $("#txtSearch").on("input", function () {
        const searchValue = $(this).val().toLowerCase().trim();

        const filteredData = G_DispatchData.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
        );

        const StringFilterColumn = ["Order No", "Party Name", "Status"];
        const NumericFilterColumn = ["BoxNo"];
        const DateFilterColumn = ["Packed Date"];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code", "Address"];
        const ColumnAlignment = {};
        const Button = false;
        const showButtons = [];

        const updatedResponse = filteredData.map(item => ({
            ...item,
            Action: `
            <button class="btn btn-primary icon-height mb-1" title="View" onclick="ViewData('${item["Code"]}')">
                <i class="fa fa-eye"></i>
            </button>
            <button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditData('${item["Code"]}')">
                <i class="fa fa-pencil"></i>
            </button>
        `
        }));

        if (filteredData.length === 0) {
            $("#table-body1").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
            return;
        }

        BizsolCustomFilterGrid.CreateDataTable("table-header1","table-body1",updatedResponse, Button,showButtons,StringFilterColumn,NumericFilterColumn,DateFilterColumn,StringdoubleFilterColumn,hiddenColumns,ColumnAlignment);
    });
    $('#txtVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtInvoiceNo").focus();
        }
    });
    $('#txtInvoiceNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDriverName").focus();
        }
    });
    $('#txtDriverName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDriverNumber").focus();
        }
    });
    $('#txtDriverNumber').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtLorryMeter").focus();
        }
    });
    $('#txtLorryMeter').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtScanProduct").focus();
        }
    });
    $('#txtModalVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDate").focus();
        }
    });
    $('#txtDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnModelShow").focus();
        }
    });
});
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
function DispatchDetail() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchValidationDetail`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                G_DispatchData = response;
                $("#UnloadingTable1").show();
                const StringFilterColumn = ["Order No", "Party Name","Status"];
                const NumericFilterColumn = ["BoxNo"];
                const DateFilterColumn = ["Packed Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code","Address"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewData('${item["Code"]}')"><i class="fa fa-eye"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="EditData('${item["Code"]}')"><i class="fa fa-pencil"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header1", "table-body1", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                G_DispatchData = [];
                $("#UnloadingTable1").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function ViewData(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const item = G_DispatchData.find(entry => entry.Code == Code);
    if (item.Code != undefined) {
        $("#txtOrderNo").val(item["Order No"]);
        $("#txtPartyName").val(item["Party Name"]);
        $("#txtAddress").val(item["Address"]);
    }
    $("#UnloadingForm").show();
    $("#txtheaderdiv").show();
    $("#UnloadingTable1").hide();
    $("#dvSearch").hide();
    $("#tab1").text("View");
    $("#txtUserName").val("");
    View(Code);
}
function Back() {
    $("#UnloadingTable1").show();
    $("#UnloadingTable").hide();
    $("#UnloadingForm").hide();
    $("#txtOrderNo").val("");
    $("#txtVehicleNo").val("");
    $("#txtAddress").val("");
    $("#txtPartyName").val("");
    $("#txtInvoiceNo").val("");
    $("#txtDriverName").val("");
    $("#txtDriverNumber").val("");
    $("#txtLorryMeter").val("");
    $("#txtScanProduct").val("");
    $("#txtUserName").val("");
    $("#txtheaderdiv").hide();
    $("#dvSearch").show();
    $("#EditForm").hide();
    G_DispatchMaster_Code = 0;
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Box Unloading");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function View(Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchValidationViewData?Code=${Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Box No","Qty","MRP"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Part Name", "Part Code"];
                    let hiddenColumns = [];
                    const ColumnAlignment = {
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                }
            },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
async function EditData(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#EditForm").show();
    $("#txtheaderdiv").show();
    $("#UnloadingTable1").hide();
    $("#dvSearch").hide();
    $("#tab1").text("Edit");
    Edit(Code);
}
async function Edit(Code) {
    G_DispatchMaster_Code = Code;
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchValidationEditData?Code=${Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                $("#txtVehicleNo").val(response[0]["VehicleNo"]);
                $("#txtInvoiceNo").val(response[0]["InvoiceNo"]);
                $("#txtDriverName").val(response[0]["DriverName"]);
                $("#txtDriverNumber").val(response[0]["DriverContactNo"]);
                $("#txtLorryMeter").val(response[0]["LorryMeter"]);
                $("#txtUserName").val(response[0]["UserName"] == '' ? G_UserName : response[0]["UserName"]);
                const StringFilterColumn = [];
                const NumericFilterColumn = ["Box No", "Qty", "MRP"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Part Name", "Part Code"];
                let hiddenColumns = ["Status","VehicleNo","InvoiceNo","DriverName","DriverContactNo","LorryMeter","UserName"];
                const ColumnAlignment = {
                };
                const renameMap = {
                    "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                    "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                };
                const updatedResponse = response.map(item => {
                    const renamedItem = {};

                    for (const key in item) {
                        if (renameMap.hasOwnProperty(key)) {
                            renamedItem[renameMap[key]] = item[key];
                        } else {
                            renamedItem[key] = item[key];
                        }
                    }
                    return renamedItem;
                });
                BizsolCustomFilterGrid.CreateDataTable("EditTable-header", "EditTable-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function SaveDispatchBox() {
    if ($("#txtVehicleNo").val() == '') {
        toastr.error("Please enter vehicle no. !");
        $("#txtVehicleNo").focus();
        $("#txtScanProduct").val("");
        return;
    } else if ($("#txtInvoiceNo").val() === '') {
        toastr.error("Please enter invoice no..!");
        $("#txtInvoiceNo").focus();
        $("#txtScanProduct").val("");
        return;
    } else if ($("#txtDriverName").val() == '') {
        toastr.error("Please enter driver name. !");
        $("#txtDriverName").focus();
        $("#txtScanProduct").val("");
        return;
    } else if ($("#txtDriverNumber").val() === '') {
        toastr.error("Please enter driver contact number..!");
        $("#txtDriverNumber").focus();
        $("#txtScanProduct").val("");
        return;
    } else if (!IsMobileNumber($("#txtDriverNumber").val())) {
        toastr.error("Please enter valid contact number..!");
        $("#txtDriverNumber").focus();
        $("#txtScanProduct").val("");
        return;
    } else if ($("#txtLorryMeter").val() == '0' || $("#txtLorryMeter").val() == '') {
        toastr.error("Please enter lorry meter reading !");
        $("#txtLorryMeter").focus();
        $("#txtScanProduct").val("");
        return;
    }else if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code:G_DispatchMaster_Code,
        VehicleNo: $("#txtVehicleNo").val(),
        BoxNo: $("#txtScanProduct").val(),
        InvoiceNo: $("#txtInvoiceNo").val(),
        DriverName: $("#txtDriverName").val(),
        DriverContactNo: $("#txtDriverNumber").val(),
        LorryMeter: $("#txtLorryMeter").val(),
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/SaveDispatchBoxValidation`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                $("#SuccessVoice")[0].play();
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
                Edit(G_DispatchMaster_Code);
            } else if (response[0].Status == 'N') {
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            } else {
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
function IsMobileNumber(txtMobId) {
    var mob = /^[6-9]{1}[0-9]{9}$/;
    if (mob.test(txtMobId) == false) {
        return false;
    }
    return true;
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#EditTable-body tr');
        rows.forEach((row) => {
            const tds = row.querySelectorAll('td');
            const columnValue = tds[11]?.textContent.trim();
            if (columnValue === 'Y') {
                row.style.backgroundColor = '#07bb72';
            }else {
                row.style.backgroundColor = '#f5c0bf';
            }
        });
}

setInterval(ChangecolorTr, 100);
function GetGatePass() {
    GetCurrentDate();
    openSavePopup();
    $("#txtModalVehicleNo").val("");
}
function openSavePopup() {
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
    saveModal.show();
}
function CloseModal() {
    var modal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
    if (modal) {
        modal.hide();
    }
    $("#PrintTable").hide();

}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function setupDateInputFormatting() {
    $('#txtDate').on('input', function () {
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
            $('#txtDate').val('');
        }
    } else {
        $('#txtDate').val('');
    }
}
function GetCurrentDate() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            let apiDate = response[0].Date;
            DatePicker(apiDate)
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function DatePicker(date) {
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
                left: inputOffset.left + 'px'
            });
        }, 10);
    });
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}
function ShowData() {
    var VehicleNo = $("#txtModalVehicleNo").val();
    var Date = convertDateFormat($("#txtDate").val());
    if ($("#txtModalVehicleNo").val() == '') {
        toastr.error("Please enter vehicle no. !");
        $("#txtModalVehicleNo").focus();
        return;
    }else if ($("#txtDate").val() == '') {
        toastr.error("Please enter date. !");
        $("#txtDate").focus();
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetGatePassData?VehicleNo=${VehicleNo}&Date=${Date}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#PrintTable").show();
                const StringFilterColumn = ["Party Name"];
                const NumericFilterColumn = ["Total Order"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Codes", "vehicleNo"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Print" onclick="Print('${item["Codes"]}')"><i class="fa fa-print"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("PrintTable-header", "PrintTable-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                G_DispatchData = [];
                $("#PrintTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Print(Code) {
    $.ajax({
        url: `${AppBaseURLMenu}/RDLC/PrintGatePass?Code=${Code}&AuthKey=${authKeyData}`,
        type: 'GET',
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data, status, xhr) {
            let blob = new Blob([data], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = "PrintGatePass.pdf";
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
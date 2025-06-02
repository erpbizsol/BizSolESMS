var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let CaseNo = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Box-Unloading");
    $('#txtBoxNo').on('input', function (e) {
        const value = $(this).val();
        if (value !== "") {
            BoxUnloading();
        }
        $(this).focus();
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
            //ShowBoxNumberList($("#txtMRNDate").val());
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
            $("#txtBoxNo").val("");
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
                    "Status": `<a style="cursor:pointer;" onclick=ShowCaseNoData(${item.Code},${item["PicklistNo"]})>${item["Status"]}</a>`,
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
        const td = tds[3];
        if (!td) return;
        const columnValue = td.textContent.trim();

        if (columnValue === 'FULLY UNLOADED') {
            td.style.backgroundColor = '#07bb72';
        } else if (columnValue === 'PARTIAL UNLOADED') {
            td.style.backgroundColor = '#ebb861';
        } else {
            td.style.backgroundColor = '#f5c0bf';
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
        url: `${appBaseURL}/api/MRNMaster/GetExportBoxUnloading?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                    $("#MRNTable").show();
                    const StringFilterColumn = ["CaseNo", G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
                    const NumericFilterColumn = [];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code", "BillQtyBox", "Status", "ReceivedQtyBox", "ItemBarCode", "ReceivedQty", "ItemRate", "Amount", "Remarks", "UOMName", "LocationName", "WarehouseName"];
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
                BizsolCustomFilterGrid.CreateDataTable("ModalTable-header", "ModalTable-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
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
        const columnValue = tds[7]?.textContent.trim();
        if (columnValue === 'Y') {
            row.style.backgroundColor = '#9ef3a5';
        } else {
            row.style.backgroundColor = '#f5c0bf';
        }
    });
}
setInterval(ChangecolorTr1, 100);
async function DownloadInExcel() {
    try {
        const Code = $("#hfMRNMaster_Code").val();
        const response = await getDataWithAjax(Code);

        if (response.length > 0) {
            await Export(response);
        } else {
            alert("Record not found...!");
        }
    } catch (error) {
        console.error("AJAX error:", error);
    }
}
function getDataWithAjax(Code) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: `${appBaseURL}/api/MRNMaster/GetExportBoxUnloading?Code=${Code}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                resolve(response);
            },
            error: function (xhr, status, error) {
                reject(error);
            }
        });
    });
}
function convertToArray(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(key => obj[key]));
    return [headers, ...rows]; 
}
async function Export(Data) {
    const Picklist = $("#hfPicklistNo").val();
    const renameMap = {
        "Item Name": G_ItemConfig[0].ItemNameHeader || 'Item Name',
        "Item Code": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
    };

    const originalHeaders = Object.keys(Data[0] || {});
    const newHeaders = originalHeaders.map(key => renameMap[key] || key);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");

    // Add custom header row
    const headerRow = sheet.addRow(newHeaders);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Set AutoFilter for header row
    sheet.autoFilter = {
        from: 'A1',
        to: String.fromCharCode(65 + newHeaders.length - 1) + '1'
    };

    // Add data rows
    Data.forEach(rowObj => {
        const row = originalHeaders.map(key => rowObj[key]); // Keep column order consistent
        const addedRow = sheet.addRow(row);

        addedRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        const status = rowObj["Scan Status"]; // Use original key name
        const fillColor = status === 'Y' ? "FF9EF3A5" : "FFF5C0BF";

        addedRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: fillColor }
            };
        });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Unloading_${Picklist}.xlsx`;
    link.click();
}

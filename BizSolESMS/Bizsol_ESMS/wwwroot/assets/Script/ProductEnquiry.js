var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let G_Value = [];
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Product Enquiry");
    GetReportList();
    GetModuleMasterCode();
    $('#txtTemplet').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txSerach").focus();
        }
    });
    $('#txSearch').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtShow").focus();
        }
    });
    $("#TempletsList").on("change", function () {
        let value = $(this).val().toUpperCase(); 

        $("#txtUPI").val("");
        $("#dvTable, #dvTable2").hide();

        if (value == "LOCATION") {
            $("#dvUPI_ID").hide();
            $("#dvScan").hide();
            $("#txtReset").hide();
            $("#txtShow").show();
        } else if (value == 'PRODUCT DETAILS') {
            $("#dvScan").show();
            $("#dvUPI_ID").hide();
            $("#txtReset").show();
            $("#txtShow").hide();
            GetGoldenCruiserQRDetails();
        } else {
            $("#dvUPI_ID").show();
            $("#dvScan").hide();
            $("#txtReset").hide();
            $("#txtShow").show();
        }
    });
    $("#txtReset").hide();
    $("#dvUPI_ID").hide();
    $('#txtShow').on('click', function (e) {
        ShowProductlist();
    });
    Serch();
    $('#txtScanProduct').on('input', function (e) {
        SaveGoldenCruiserQRDetails();
    });
    $('#txtScanProduct').on('focus', function () {
        const inputElement = this;
        const isManual = $("#txtIsManual").is(':checked');
        setTimeout(function () {
            inputElement.setAttribute('inputmode', isManual ? '' : 'none');
        }, 2);
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
});
function Serch() {
    $("#txSearch").on("input", function () {
        const searchValue = $(this).val().toLowerCase().trim();
        filteredData = G_Value.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
        );
        const StringFilterColumn = ["Part Code", "Location"];
        const NumericFilterColumn = ["QTY"];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        const ColumnAlignment = {
            "Reorder Level": 'right',
        };
        if (filteredData.length === 0) {
            $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
            return;
        }
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", filteredData, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
   });
}

async function ShowProductlist() {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    var ReportName = $("#TempletsList").val().toUpperCase().trim();
    var UPI = $("#txtUPI").val();
    if (ReportName == '') {
        toastr.error("Please select Report Type !..");
        $("#TempletsList").focus();
        return;
    }
    if (ReportName == 'UPI DETAILS' && UPI == '') {
        toastr.error("Please enter UPI ID !..");
        $("#txtUPI").focus();
        return;
    }
    if (ReportName == 'UPI DETAILS') {
        $.ajax({
            url: `${appBaseURL}/api/Report/GetUPIIDReport?UPI_ID=${UPI}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response) {
                    $("#dvTable2").show();
                    const StringFilterColumn = ["Part Code", "Location"];
                    const NumericFilterColumn = ["QTY"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code"];
                    const ColumnAlignment = {
                       
                    };
                    if (response.DispatchMaster.length > 0) {
                        $("#tblPackingTable").show();
                        BizsolCustomFilterGrid.CreateDataTable("table1-header", "table1-body", response.DispatchMaster, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                    } else {
                        $("#tblPackingTable").hide();
                    }
                    if (response.MRNMaster.length > 0) {
                        $("#tblMRNTable").hide();
                        BizsolCustomFilterGrid.CreateDataTable("table2-header", "table2-body", response.MRNMaster, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                    } else {
                        $("#tblMRNTable").hide();
                    }
                    if (response.SalesReturn.length > 0) {
                        $("#tblSalesTable").hide();
                        BizsolCustomFilterGrid.CreateDataTable("table3-header", "table3-body", response.SalesReturn, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                    } else {
                        $("#tblSalesTable").hide();
                    }
                } else {
                    toastr.error("Record not found...!");
                    $("#dvTable2").hide();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    } else {
        $.ajax({
            url: `${appBaseURL}/api/Report/GetLocationReport?Templete=${ReportName}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.length > 0) {
                    $("#dvTable").show();
                    G_Value = response;
                    const StringFilterColumn = ["Part Code", "Location"];
                    const NumericFilterColumn = ["QTY"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [];
                    const hiddenColumns = ["Code"];
                    const ColumnAlignment = {
                        "Reorder Level": 'right',
                    };
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                } else {
                    toastr.error("Record not found...!");
                    $("#dvTable").hide();
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    }
}
function GetReportList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetReportType`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#TempletsList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.ReportName + '">' + item.ReportName + '</option>';
                });
                $('#TempletsList').html(options);
            } else {
                $('#TempletsList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#TempletsList').empty();
        }
    });
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Product Enquiry");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function DataExport() {
    var ReportName = $("#TempletsList").val().toUpperCase().trim();
    if (ReportName == 'LOCATION') {
        $.ajax({
            url: `${appBaseURL}/api/Report/GetLocationReport?Templete=location`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.length > 0) {
                    Export(response,"Location_Information");
                } else {
                    toastr.error("Record not found...!");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    }
    if (ReportName == 'PRODUCT DETAILS') {
        $.ajax({
            url: `${appBaseURL}/api/Report/GetGoldenCruiserQRDetails`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.length > 0) {
                    Export(response,"Product_Details");
                } else {
                    toastr.error("Record not found...!");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    }
}

//function Export(jsonData,Name) {
//    const columnsToRemove = ["Code"];
//    if (!Array.isArray(columnsToRemove)) {
//        console.error("columnsToRemove should be an array");
//        return;
//    }
//    const filteredData = jsonData.map(row =>
//        Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
//    );
//    const ws = XLSX.utils.json_to_sheet(filteredData);
//    const wb = XLSX.utils.book_new();
//    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//    XLSX.writeFile(wb, Name+".xlsx");
//}

async function Export(jsonData, Name) {
    const columnsToRemove = ["Code"];
    if (!Array.isArray(columnsToRemove)) {
        console.error("columnsToRemove should be an array");
        return;
    }

    // remove unwanted columns
    const filteredData = jsonData.map(row =>
        Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
    );

    // create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // define columns from object keys
    const columns = Object.keys(filteredData[0] || {}).map(key => ({
        header: key,
        key: key,
        width: 20
    }));

    worksheet.columns = columns;

    // add rows
    filteredData.forEach(row => worksheet.addRow(row));

    // make header row bold
    worksheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "Left" };
    });

    // save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = Name + ".xlsx";
    link.click();
}
function ChangecolorTr() {
    var ReportName = $("#TempletsList").val().toUpperCase().trim();
    if (ReportName == 'LOCATION') { 
        const rows = document.querySelectorAll('#table-body tr');
        rows.forEach((row) => {
            const tds = row.querySelectorAll('td');
            const columnValue = tds[3]?.textContent.trim();
            if (columnValue > '0') {
                row.style.backgroundColor = '';
            } else {
                row.style.backgroundColor = '#f5c0bf';
            }
        });
    }
}
function SaveGoldenCruiserQRDetails() {
    if ($("#txtScanProduct").val() === '') {
        toastr.error("Please enter box no..!");
        return;
    }
    const payload = {
        ScanNo: $("#txtScanProduct").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/Report/SaveGoldenCruiserQRDetails`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                GetGoldenCruiserQRDetails();
                $("#txtScanProduct").val("");
                $("#SuccessVoice")[0].play();
            } else {
                showToast(response[0].Msg);
                GetGoldenCruiserQRDetails();
                $("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function GetGoldenCruiserQRDetails() {
    $.ajax({
        url: `${appBaseURL}/api/Report/GetGoldenCruiserQRDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#dvTable").show();
                G_Value = response;
                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = [];
                const ColumnAlignment = {
                };
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                toastr.error("Record not found...!");
                $("#dvTable").hide();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function Reset() {
    if (confirm(`Are you sure you want to reset .?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Report/ResetGoldenCruiserQRDetails`,
            type: 'GET',
            contentType: "application/json",
            dataType: "json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status == 'Y') {
                    GetGoldenCruiserQRDetails();
                    $("#txtScanProduct").val("");
                } else {
                    toastr.error(response[0].Msg);
                    GetGoldenCruiserQRDetails();
                    $("#txtScanProduct").val("");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
            }
        });
    }
}

setInterval(ChangecolorTr, 100);
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
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
    $("#txTemplet").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#TempletsList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#TempletsList").val("")
        }
    });
    $("#txTemplet").on("focus", function () {
        $(this).val("");
    });
    $('#txtShow').on('click', function (e) {
        ShowProductlist();
    });
    Serch();
  
});
function Serch() {
    $("#txSearch").on("input", function () {
        G_Value = $(this).val().toLowerCase().trim();
        $("#table tbody tr").each(function () {
            var matched = false;
            $(this).find("td").each(function () {
                if ($(this).text().toLowerCase().includes(G_Value)) {
                    matched = true;
                }
            });
            $(this).toggle(matched);
        });
    });
}
async function ShowProductlist() {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    var ReportName = $("#txTemplet").val();
    if (ReportName == '') {
        toastr.error("Please select Report Type !..");
        $("#txTemplet").focus();
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/Report/GetLocationReport?Templete=${ReportName}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                G_Value = response;

                const StringFilterColumn = ["Item Product Code", "Location"];
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
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

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
                    options += '<option value="' + item.ReportName + '" text="' + item.Code + '"></option>';
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
    const result = Data.find(item => item.ModuleDesp === "Location_information");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Report/GetLocationReport?Templete=location`,
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
    XLSX.writeFile(wb, "Location_information.xlsx");
}
function ChangecolorTr() {
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

setInterval(ChangecolorTr, 100);

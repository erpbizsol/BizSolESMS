﻿
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
$(document).ready(function () {
    $("#ERPHeading").text("UOM");
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $('#txtUOM').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDigitAfterDecimal").focus();
        }
    });
    $('#txtDigitAfterDecimal').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    ShowUomMasterlist();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
  

    if (param_UomMode === 'Edit') {
            $.ajax({
                url: `${appBaseURL}/api/Master/ShowUOMMasterByCode?Code=` + param_UCode,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Auth-Key', authKeyData);
                },
                success: function (response) {
                    if (response.length > 0) {
                        response.forEach(function (item) {
                            $("#txtUOM").val(item.UOMName);
                            $("#txtDigitAfterDecimal").val(item.DigitAfterDecimal);
                        });
                    } else {
                        toastr.error("Record not found...!");
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error:", error);
                }
            });

        }
});

function Save() {
      var uomName = $("#txtUOM").val().trim();
      var digitAfterDecimal = $("#txtDigitAfterDecimal").val().trim();
        if (uomName === "") {
            toastr.error('Please enter a UOM Name.');
            $("#txtUOM").focus();
        } else if (digitAfterDecimal === "" || isNaN(digitAfterDecimal) || parseInt(digitAfterDecimal) < 0) {
            toastr.error('Please enter a valid digit after decimal is 0.');
            $("#txtDigitAfterDecimal").focus();
        }
        else {
            var digitAfterDecimalValue = digitAfterDecimal === "" ? 0 : parseInt(digitAfterDecimal);
            const payload = {
                code: parseInt(param_UCode) || 0,
                uomName: uomName,
                digitAfterDecimal: digitAfterDecimalValue,
            };
            $.ajax({
                url: `${appBaseURL}/api/Master/InsertUOMMaster`,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(payload),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Auth-Key', authKeyData);
                },
                success: function (response) {
                    if (response.Status === 'Y') {
                            toastr.success(response.Msg);
                            BackUOMMaster();
                            ShowUomMasterlist();
                        }
                        else {
                            toastr.success(response.Msg);
                        }
                },
                error: function (xhr, status, error) {
                    console.error("Error:", xhr.responseText);
                    toastr.error("An error occurred while saving the data.");
                }
            });
        }
}

function ShowUomMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowUOM`, 
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key',authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["UOM Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "CreatedOn": 'center',
                    "Digit After Decimal": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteUOM('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
               
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function CreateUOMMaster() {
    ClearData();
    window.location.href = `${AppBaseURLMenu}/Master/CreateUOMMaster?Mode=New`;
}

function BackUOMMaster() {
   
    window.location.href = `${AppBaseURLMenu}/Master/UOMMasterList`;
    ClearData();

}

function deleteUOM(code) {
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteUOM?Code=${code}`, 
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowUomMasterlist();
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);

            }
        });
    }
}

function Edit(code) {
    window.location.href = `${AppBaseURLMenu}/Master/CreateUOMMaster?Code=${code}&Mode=Edit`;
}

function ClearData() {
    $("#txtUOM").val("");
    $("#txtDigitAfterDecimal").val("");
}
function exportTableToExcel() {
    var table = document.getElementById("table");
    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.table_to_sheet(table);
    var hiddenColumns = ["Action"];
    for (var row in worksheet) {
        if (row.startsWith('!')) continue;
        var cellIndex = parseInt(row.match(/\d+/));
        if (!isNaN(cellIndex)) {
            hiddenColumns.forEach(colIdx => {
                var colLetter = XLSX.utils.encode_col(colIdx);
                delete worksheet[colLetter + cellIndex];
            });
        }
    }
    var range = XLSX.utils.decode_range(worksheet['!ref']);
    range.e.c -= hiddenColumns.length; // Adjust end column
    worksheet['!ref'] = XLSX.utils.encode_range(range);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "UOMMaster.xlsx");
}

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');

$(document).ready(function () {
    $("#ERPHeading").text("Warehouse");
    $(".Number").on("keypress", function (e) {
        // Allow only digits (0-9)
        if (e.which < 48 || e.which > 57) {
            e.preventDefault(); // Prevent the character from being entered
        }
    });

    $(".Number").on("input", function () {
        // Ensure no non-numeric characters exist in the field
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    $('#txtWarehouseName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtWarehouseType").focus();
        }
    });
    $('#txtWarehouseType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAddress").focus();
        }
    });
    $('#txtAddress').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPin").focus();
        }
    });
    $('#txtPin').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCity").focus();
        }
    });
    $('#txtCity').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtGSTIN").focus();
        }
    });
    $('#txtGSTIN').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDefaultWarehouse").focus();
        }
    });
    $('#txtDefaultWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtStoreWarehouse").focus();
        }
    });
    $('#txtStoreWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtInTransitwarehouse").focus();
        }
    });
    $('#txtInTransitwarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    GetCityDropDownList();
    ShowItemMasterlist();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
    if (WMode === 'Edit') {
        $.ajax({
            url: `${appBaseURL}/api/Master/ShowWarehouseMasterByCode?Code=` + WCode,
            type: 'GET',
            success: function (response) {
                if (response.length > 0) {
                    response.forEach(function (item) {
                        $("#txtWarehouseName").val(item.warehouseName);
                        $("#txtWarehouseType").val(item.WarehouseType);
                        $("#txtAddress").val(item.Address);
                        $("#txtPin").val(item.Pin);
                        $("#txtCity").val(item.CityName);
                        $("#txtGSTIN").val(item.GSTIN);
                        $("#txtDefaultWarehouse").val(item.DefaultWarehouse);
                        $("#txtStoreWarehouse").val(item.StoreWarehouse);
                        $("#txtInTransitwarehouse").val(item.InTransitwarehouse);
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
    // Collect input values
    var WarehouseName = $("#txtWarehouseName").val();
    var WarehouseType = $("#txtWarehouseType").val();
    var Address = $("#txtAddress").val();
    var Pin = $("#txtPin").val();
    var City = $("#txtCity").val();
    var GSTIN = $("#txtGSTIN").val();
    var DefaultWarehouse = $("#txtDefaultWarehouse").val();
    var StoreWarehouse = $("#txtStoreWarehouse").val();
    var InTransitwarehouse = $("#txtInTransitwarehouse").val();

    // Client-side validation
    if (!WarehouseName) {
        toastr.error('Please enter a Warehouse Name.');
        $("#txtWarehouseName").focus();
        return;
    }
    if (!WarehouseType) {
        toastr.error('Please select a Warehouse Type.');
        $("#txtWarehouseType").focus();
        return;
    }
    if (!Address) {
        toastr.error('Please enter the Address.');
        $("#txtAddress").focus();
        return;
    }
    if (!Pin) {
        toastr.error('Please enter the Pin.');
        $("#txtPin").focus();
        return;
    }
    if (!City) {
        toastr.error('Please enter the City.');
        $("#txtCity").focus();
        return;
    }
    if (!GSTIN) {
        toastr.error('Please enter the GSTIN.');
        $("#txtGSTIN").focus();
        return;
    }
    if (!DefaultWarehouse) {
        toastr.error('Please specify if it is the Default Warehouse.');
        $("#txtDefaultWarehouse").focus();
        return;
    }
    if (!StoreWarehouse) {
        toastr.error('Please specify if it is a Store Warehouse.');
        $("#txtStoreWarehouse").focus();
        return;
    }
    if (!InTransitwarehouse) {
        toastr.error('Please specify if it is an In-Transit Warehouse.');
        $("#txtInTransitwarehouse").focus();
        return;
    }

    // Prepare payload
    const payload = {
        code: parseInt(WCode) || 0,
        WarehouseName: WarehouseName,
        WarehouseType: WarehouseType,
        Address: Address,
        Pin: Pin,
        City: City,
        GSTIN: GSTIN,
        DefaultWarehouse: DefaultWarehouse,
        StoreWarehouse: StoreWarehouse,
        InTransitwarehouse: InTransitwarehouse,
    };

    // Make AJAX request
    $.ajax({
        url: `${appBaseURL}/api/Master/InsertWarehouseMaster`,
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
                ShowItemMasterlist();
            } else {
                toastr.error(response.Msg);
            }
        },
        error: function (xhr) {
            if (xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.errors) {
                // Handle validation errors from the server
                const errors = xhr.responseJSON.errors;
                for (const field in errors) {
                    if (errors.hasOwnProperty(field)) {
                        toastr.error(`${field}: ${errors[field].join(', ')}`);
                    }
                }
            } else {
                // Generic error handler
                toastr.error("An error occurred while saving the data.");
                console.error("Error:", xhr.responseText);
            }
        }
    });
}

function ShowItemMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowWarehouseMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteWarehouse('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
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
function CreateWarehouseMaster() {
    window.location.href = `${AppBaseURLMenu}/Master/CreateWarehouseMaster?Mode=New`;

}

function BackMaster() {
    window.location.href = `${AppBaseURLMenu}/Master/WarehouseMasterList`;

}

function deleteWarehouse(code) {
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteWarehouseMaster?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowItemMasterlist();
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
    window.location.href = `${AppBaseURLMenu}/Master/CreateWarehouseMaster?Code=${code}&Mode=Edit`;
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

function GetCityDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCityDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtCityList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtCityList').html(options);
            } else {
                $('#txtCityList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCityList').empty();
        }
    });
}

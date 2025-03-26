var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Warehouse  Master");
    $(".Number").on("keypress", function (e) {
        // Allow only digits (0-9)
        if (e.which < 48 || e.which > 57) {
            e.preventDefault(); // Prevent the character from being entered
        }
    });
    $(".Number").on("input", function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    $('#txtWarehouseName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCity").focus();
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
            $("#txtDefaultWarehouse").focus();
        }
    });
    $('#txtDefaultWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    GetCityDropDownList();
    ShowWarehouseMaster('Load');
    $("#txtCity").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtCityList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtCityList").val("")
        }
    });
    GetModuleMasterCode();
});
function Save() {
    var WarehouseName = $("#txtWarehouseName").val();
    var WarehouseType = $("#txtWarehouseType").val();
    var Address = $("#txtAddress").val();
    var Pin = $("#txtPin").val();
    var City = $("#txtCity").val();
    var GSTIN = $("#txtGSTIN").val();
    const DefaultWarehouse = $('#txtDefaultWarehouse').is(":checked");
    if (!WarehouseName) {
        toastr.error('Please enter a Warehouse Name.');
        $("#txtWarehouseName").focus();
        return;
    } else if (!City) {
        toastr.error('Please enter the City.');
        $("#txtCity").focus();
        return;
    }
    const payload = {
        code: $("#hftxtCode").val(),
        WarehouseName: WarehouseName,
        WarehouseType: WarehouseType,
        Address: Address,
        Pin: 0,
        City: City,
        GSTIN: GSTIN,
        DefaultWarehouse: DefaultWarehouse == true ? 'Y' : 'N',
    };
    $.ajax({
        url: `${appBaseURL}/api/Master/InsertWarehouseMaster?UserMaster_Code=${UserMaster_Code}`,
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
                ShowWarehouseMaster('Get');
                BackMaster();
                
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
function ShowWarehouseMaster(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowWarehouseMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtwarehousetable").show();
                const StringFilterColumn = ["Warehouse Name","City Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code", "Warehouse Type", "Address", "Pin","GST IN"];
                const ColumnAlignment = {
                    "CreatedOn": 'center',
                    "Digit After Decimal": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteWarehouse('${item.Code}','${item[`Warehouse Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtwarehousetable").hide();
                if (Type != 'Load') {
                    toastr.error("Record not found...!");
                }
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function CreateWarehouseMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#hftxtCode").prop("disabled", false);
    $("#txtWarehouseName").prop("disabled", false);
    $("#txtWarehouseType").prop("disabled", false);
    $("#txtAddress").prop("disabled", false);
    $("#txtPin").prop("disabled", false);
    $("#txtCity").prop("disabled", false);
    $("#txtGSTIN").prop("disabled", false);
    $("#txtDefaultWarehouse").prop("disabled", false);
    disableFields(false); 
    $("#txtbtnSave").prop("disabled", false);

}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    $("#hftxtCode").prop("disabled", false);
    $("#txtWarehouseName").prop("disabled", false);
    $("#txtWarehouseType").prop("disabled", false);
    $("#txtAddress").prop("disabled", false);
    $("#txtPin").prop("disabled", false);
    $("#txtCity").prop("disabled", false);
    $("#txtGSTIN").prop("disabled", false);
    $("#txtDefaultWarehouse").prop("disabled", false);
    $("#txtbtnSave").prop("disabled", false);
    disableFields(false);
}
async function deleteWarehouse(code, warehouse,button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'warehousemaster');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this warehouse ${warehouse} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteWarehouseMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowWarehouseMaster('Get');
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);

            }
        });
    }
    else {
        $('tr').removeClass('highlight');
    }
    $('tr').removeClass('highlight');
}
async function Edit(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#txtheaderdiv").show();
    $("#tab1").text("EDIT");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowWarehouseMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftxtCode").val(item.Code);
                    $("#txtWarehouseName").val(item.warehouseName);
                    $("#txtWarehouseType").val(item.WarehouseType);
                    $("#txtAddress").val(item.Address);
                    $("#txtPin").val(item.Pin);
                    $("#txtCity").val(item.CityName);
                    $("#txtGSTIN").val(item.GSTIN);
                    if (item.DefaultWarehouse == 'N') {
                        $('#txtDefaultWarehouse').prop("checked", false);
                    } else {
                        $('#txtDefaultWarehouse').prop("checked", true);
                    }
                    $("#txtbtnSave").prop("disabled", false);
                    disableFields(false); 
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
function ClearData() {
    $("#hftxtCode").val("0");
    $("#txtWarehouseName").val("");
    $("#txtWarehouseType").val("");
    $("#txtAddress").val("");
    $("#txtPin").val("");
    $("#txtCity").val("");
    $("#txtGSTIN").val("");
    $("#txtDefaultWarehouse").val("");
    $("#txtStoreWarehouse").val("");
    $("#txtInTransitwarehouse").val("");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Warehouse Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function View(code) {

    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#txtheaderdiv").show();
    $("#tab1").text("VIEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowWarehouseMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(function (item) {
                    $("#hftxtCode").val(item.Code).prop("disabled", true);
                    $("#txtWarehouseName").val(item.warehouseName).prop("disabled", true);
                    $("#txtWarehouseType").val(item.WarehouseType).prop("disabled", true);
                    $("#txtAddress").val(item.Address).prop("disabled", true);
                    $("#txtPin").val(item.Pin).prop("disabled", true);
                    $("#txtCity").val(item.CityName).prop("disabled", true);
                    $("#txtGSTIN").val(item.GSTIN).prop("disabled", true);
                    if (item.DefaultWarehouse == 'N') {
                        $('#txtDefaultWarehouse').prop("checked", false);
                    } else {
                        $('#txtDefaultWarehouse').prop("checked", true);
                    }
                    $("#txtDefaultWarehouse").prop("disabled", false);
                    $("#txtbtnSave").prop("disabled", true);
                    disableFields(true); 
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
function disableFields(disable) {
    $("#txtCreatepage,#txtbtnSave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowWarehouseMaster`,
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
    XLSX.writeFile(wb, "WarehouseMaster.xlsx");
}

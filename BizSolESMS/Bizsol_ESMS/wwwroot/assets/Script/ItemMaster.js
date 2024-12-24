var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Item");
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $(".Amount").keyup(function (e) {
        if (/\D/g.test(this.value)) {
            if (this.value.length == 1) this.value = this.value.replace(/[.]/g, '0.');
            this.value = this.value.replace(/[^0-9\.{2}[0-9]]/g, '');
            this.value = this.value.replace(/[^0-9\.]/g, '');
            if (this.value.split(".").length > 2) this.value = this.value.replace(/\.+?$/, '')
            if (this.value.split(".").length > 2) this.value = this.value.replace(this.value, '')
            if (this.value.charAt(0) == ".") this.value = this.value.replace(this.value, '0' + this.value)
        }
    });
    $('#txtItemName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDisplayName").focus();
        }
    });
    $('#txtDisplayName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItembarcode").focus();
        }
    });
    $('#txtItembarcode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtUOM").focus();
        }
    });
    $('#txtUOM').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtHSNCode").focus();
        }
    });
    $('#txtHSNCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCategory").focus();
        }
    });
    $('#txtCategory').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtGroupItem").focus();
        }
    });
    $('#txtGroupItem').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtSubGroupItem").focus();
        }
    });
    $('#txtSubGroupItem').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtBrand").focus();
        }
    });
    $('#txtBrand').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtMRP").focus();
        }
    });
    $('#txtMRP').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReorderLevel").focus();
        }
    });
    $('#txtReorderLevel').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReorderQty").focus();
        }
    });
    $('#txtReorderQty').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItemLocation").focus();
        }
    });
    $('#txtItemLocation').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtBoxPacking").focus();
        }
    });
    $('#txtBoxPacking').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtQtyinBox").focus();
        }
    });
    $('#txtQtyinBox').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    ShowItemMasterlist();
    GetGroupMasterList();
    GetUOMDropDownList();
    GetCategoryDropDownList();
    GetSubGroupDropDownList();
    GetBrandDropDownList();
    GetLocationDropDownList();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
 
});

function ShowItemMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowItemMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["Item Name", "Display Name", "Category Name", "Group Name", "Sub Group Name", "Brand Name","Location Name"];
                const NumericFilterColumn = ["MRP", "Reorder Level", "Reorder Qty","Qty In Box"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "MRP":'right',
                    "Reorder Level":'right',
                    "Reorder Qty":'right',
                    "Qty In Box":'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
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
function Save() {
    var ItemName = $("#txtItemName").val();
    var BoxPacking = $("#txtBoxPacking").val();
    var QtyInBox = $("#txtQtyinBox").val();

    if (!ItemName) {
        toastr.error('Please enter an Item Name!');
        $("#txtItemName").focus();
    } else if (BoxPacking === "Y" && (!QtyInBox || QtyInBox === "0")) {
        toastr.error('Please enter a valid Qty in Box!');
        $("#txtQtyinBox").focus();
    } else {
        const payload = {
            Code:$("#hfCode").val(),
            ItemName: $("#txtItemName").val(),
            DisplayName: $("#txtDisplayName").val(),
            ItemBarCode: $("#txtItembarcode").val(),
            UOMName: $("#txtUOM").val(),
            HSNCode: $("#txtHSNCode").val(),
            CategoryName: $("#txtCategory").val(),
            GroupName: $("#txtGroupItem").val(),
            SubGroupName: $("#txtSubGroupItem").val(),
            BrandName: $("#txtBrand").val(),
            MRP: parseFloat($("#txtMRP").val()),
            ReorderLevel: parseInt($("#txtReorderLevel").val()),
            ReorderQty: parseInt($("#txtReorderQty").val()),
            LocationName: $("#txtItemLocation").val(),
            BoxPacking: $("#txtBoxPacking").val(),
            QtyInBox: $("#txtQtyinBox").val()
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertItemMaster`,
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
                }
                else {
                    toastr.error(response.Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            }
        });
    
    }
}
function CreateItemMaster() {
    $("#txtListpage").hide();
    $("#txtCreatepage").show();

}

function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();

}

function deleteItem(code) {
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteItem?Code=${code}`,
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
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
        $.ajax({
            url: `${appBaseURL}/api/Master/ShowItemByCode?Code=` + code,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (item) {
                if (item) {
                    $("#hfCode").val(item.Code),
                    $("#txtItemName").val(item.ItemName),
                    $("#txtDisplayName").val(item.DisplayName),
                    $("#txtItembarcode").val(item.ItemBarCode),
                    $("#txtUOM").val(item.UomName),
                    $("#txtHSNCode").val(item.HSNCode),
                    $("#txtCategory").val(item.CategoryName),
                    $("#txtGroupItem").val(item.GroupName),
                    $("#txtSubGroupItem").val(item.SubGroupName),
                    $("#txtBrand").val(item.BrandName),
                    $("#txtMRP").val(item.MRP),
                    $("#txtReorderLevel").val(item.ReorderLevel),
                    $("#txtReorderQty").val(item.ReorderQty),
                    $("#txtItemLocation").val(item.locationName),
                    $("#txtBoxPacking").val(item.BoxPacking),
                    $("#txtQtyinBox").val(item.QtyInBox)
                   
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


function GetGroupMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtGroupItemList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtGroupItemList').html(options);
            } else {
                $('#txtGroupItemList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtGroupItemList').empty();
        }
    });
}

function GetUOMDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUOMDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtUOMList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtUOMList').html(options);
            } else {
                $('#txtUOMList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtUOMList').empty();
        }
    });
}

function GetCategoryDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCategoryDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtCategoryList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtCategoryList').html(options);
            } else {
                $('#txtCategoryList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCategoryList').empty();
        }
    });
}

function GetSubGroupDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetSubGroupDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtSubGroupItemList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtSubGroupItemList').html(options);
            } else {
                $('#txtSubGroupItemList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtSubGroupItemList').empty();
        }
    });
}

function GetBrandDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetBrandDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtBrandList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtBrandList').html(options);
            } else {
                $('#txtBrandList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtBrandList').empty();
        }
    });
}

function GetLocationDropDownList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetLocationDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtItemLocationList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtItemLocationList').html(options);
            } else {
                $('#txtItemLocationList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtItemLocationList').empty();
        }
    });
}
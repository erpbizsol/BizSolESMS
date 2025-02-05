var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {

    $("#ERPHeading").text("Item Master");
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
    $('#txtItemCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItemName").focus();
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
            $("#txtReorderLevel").focus();
        }
    });
    $('#txtReorderLevel').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItemLocation").focus();
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
            $("#txtBatchApplicable").focus();
        }
    });
    $('#txtBatchApplicable').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtMaintainExpiry").focus();
        }
    });
    $('#txtMaintainExpiry').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    $('#txtGroupItem').on('change', function (e) {
        if ($(this).val() != '') {
            GetSubGroupDropDownList($(this).val());
        }
    });
  
    ShowItemMasterlist();
    GetGroupMasterList();
    GetUOMDropDownList();
    GetCategoryDropDownList();
    GetBrandDropDownList();
    GetLocationDropDownList();
    GetModuleMasterCode();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
    UpdateLabelforItemMaster();
    $("#txtUOM").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtUOMList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtUOMList").val("")
        }
    });
    $("#txtCategory").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtCategoryList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtCategoryList").val("")
        }
    });
    $("#txtGroupItem").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtGroupItemList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtGroupItemList").val("")
        }
    });
    $("#txtSubGroupItem").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtSubGroupItemList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtSubGroupItemList").val("")
        }
    });
    $("#txtBrand").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtBrandList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtBrandList").val("")
        }
    });
    $("#txtItemLocation").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtItemLocationList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtItemLocationList").val("")
        }
    });
    $("#txtUOM").on("focus", function () {
         $(this).val("");
    });
    $("#txtCategory").on("focus", function () {
        $(this).val("");
    });
    $("#txtGroupItem").on("focus", function () {
        $(this).val("");
    });
    $("#txtSubGroupItem").on("focus", function () {
        $(this).val("");
    });
    $("#txtBrand").on("focus", function () {
        $(this).val("");
    });
    $("#txtItemLocation").on("focus", function () {
        $(this).val("");
    });
    $("#txtBoxPacking").on("change", function () {
        var a = $("#txtBoxPacking").is(":checked");
        if (a) {
            $("#txtQtyinBox").prop("disabled",false);
        } else {
            $("#txtQtyinBox").prop("disabled", true);
            $("#txtQtyinBox").val("0");
        }
    });
});
function UpdateLabelforItemMaster() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowItemConfig`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (Array.isArray(response) && response.length > 0) {
                response.forEach(function (item) {
                    if (item.ItemNameHeader) {
                        $("#txtItemNamelab").text(item.ItemNameHeader);
                    } else {
                        $("#txtItemNamelab").text("Item Name");
                    }
                    if (item.ItembarcodeHeader) {
                        $("#txtItembarcodelab").text(item.ItembarcodeHeader);
                    } else {
                        $("#txtItembarcodelab").text("Item Bar Code");
                    }
                    if (item.GroupItemHeader) {
                        $("#GroupItemHeaderlab").text(item.GroupItemHeader);
                    } else {
                        $("#GroupItemHeaderlab").text("Group Item");
                    }
                    if (item.SubGroupItemHeader) {
                        $("#SubGroupItemHeaderlab").text(item.SubGroupItemHeader);
                    } else {
                        $("#SubGroupItemHeaderlab").text("Sub Group Item");
                    }
                    if (item.SubLocationItemHeader) {
                        $("#SubLocationItemHeaderlab").text(item.SubLocationItemHeader);
                    }
                    else {
                        $("#SubLocationItemHeaderlab").text("Location Item");
                    }
                    if (item.ItemCode) {
                        const escapedItemCode = item.ItemCode.replace("[\/\\^$*+?.()|[\]{}]/g, ''");
                        const itemCodeRegex = new RegExp(`^[a-zA-Z0-9${escapedItemCode}]*$`);

                        $('#txtItemCode').on('input', function () {
                            const currentValue = $(this).val();
                            let isInvalid = false; 
                            const validValue = currentValue.replace(new RegExp(`[^a-zA-Z0-9${escapedItemCode}]`, 'g'), (match) => {
                                isInvalid = true; 
                                return ''; 
                            });

                            if (currentValue !== validValue) {
                                $(this).val(validValue);

                                if (isInvalid) {
                                    toastr.error(`This character is not allowed ${currentValue } then change other special characters allowe in item config page.!`);
                                }
                            }
                        });
                    }

                });
            } else {
                $("#txtItemNamelab").text("Static Label for Item Name");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $("#txtItemNamelab").text("Error fetching label data");
        }
    });
}
function ShowItemMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowItemMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtitemtable").show();
               
                const StringFilterColumn = ["Item Name", "Display Name", "Category Name", "Group Name", "Sub Group Name", "Brand Name", "Location Name"];
                const NumericFilterColumn = ["Reorder Level", "Reorder Qty", "Qty In Box"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code","DataImported"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "Qty In Box": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Item Name`]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                ChangecolorTr();
            } else {
                $("#txtitemtable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Save() {
    var ItemCode = $("#txtItemCode").val();
    var ItemName = $("#txtItemName").val();
    var BoxPacking = $("#txtBoxPacking").val();
    var QtyInBox = $("#txtQtyinBox").val();
    var DisplayName = $("#txtDisplayName").val();
    var UOM = $("#txtUOM").val();
    var HSNCode = $("#txtHSNCode").val();
    var Category = $("#txtCategory").val();
    var Brand = $("#txtBrand").val();
    var ReorderLevel = $("#txtReorderLevel").val();
    var ReorderQty = $("#txtReorderQty").val();
    var GroupItem = $("#txtGroupItem").val();
    var SubGroupItem = $("#txtSubGroupItem").val();
    var ItemLocation = $("#txtItemLocation").val();
    if (!ItemCode) {
        toastr.error('Please enter an Item Code!');
        $("#txtItemCode").focus();
    }
    else if (!ItemName) {
        toastr.error('Please enter an Item Name!');
        $("#txtItemName").focus();
    }
    else if (DisplayName === "") {
        toastr.error('Please enter a Display Name!');
        $("#txtDisplayName").focus();
    }
    else if (UOM === "") {
        toastr.error('Please select a UOM Name!');
        $("#txtUOM").focus();
    }
    else if (Category === "") {
        toastr.error('Please select a Category!');
        $("#txtCategory").focus();
    }
    else if (GroupItem === "") {
        toastr.error('Please select a Group Item!');
        $("#txtGroupItem").focus();
    }
    else if (SubGroupItem === "") {
        toastr.error('Please select a Sub Group Item!');
        $("#txtSubGroupItem").focus();
    }
    else if (Brand === "") {
        toastr.error('Please select a Brand!');
        $("#txtBrand").focus();
    }
    else if (ReorderLevel === "" || isNaN(ReorderLevel) || parseInt(ReorderLevel) < 0) {
        toastr.error('Please enter a valid digit after decimal is 0.');
        $("#txtReorderLevel").focus();
    }
    else if (ItemLocation === "") {
        toastr.error('Please select a Item Location!');
        $("#ItemLocation").focus();
    }
    else if (ReorderQty === "" || isNaN(ReorderQty) || parseInt(ReorderQty) < 0) {
        toastr.error('Please enter a valid digit after decimal is 0.');
        $("#txtReorderQty").focus();
    }
    else if (BoxPacking === "Y" && (!QtyInBox || QtyInBox === "0")) {
        toastr.error('Please enter a valid Qty in Box!');
        $("#txtQtyinBox").focus();
    }
    else {
        var ReorderLevels = ReorderLevel === "" ? 0 : parseInt(ReorderLevel);
        var ReorderQtys = ReorderQty === "" ? 0 : parseInt(ReorderQty);
        const payload = {
            Code: $("#hfCode").val(),
            ItemCode: $("#txtItemCode").val(),
            ItemName: $("#txtItemName").val(),
            DisplayName: $("#txtDisplayName").val(),
            ItemBarCode: $("#txtItembarcode").val(),
            UOMName: $("#txtUOM").val(),
            HSNCode: $("#txtHSNCode").val(),
            CategoryName: $("#txtCategory").val(),
            GroupName: $("#txtGroupItem").val(),
            SubGroupName: $("#txtSubGroupItem").val(),
            BrandName: $("#txtBrand").val(),
            ReorderLevel: ReorderLevels,
            ReorderQty: ReorderQtys,
            LocationName: $("#txtItemLocation").val(),
            BoxPacking: $("#txtBoxPacking").is(":checked") ? "Y" : "N",
            batchApplicable: $("#txtBatchApplicable").is(":checked") ? "Y" : "N",
            maintainExpiry: $("#txtMaintainExpiry").is(":checked") ? "Y" : "N",
            QtyInBox: $("#txtQtyinBox").val()
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertItemMaster?UserMaster_Code=${UserMaster_Code}`,
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
                    BackMaster();
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
async function CreateItemMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();

    $("#hfCode").prop("disabled", false);
    $("#txtItemCode").prop("disabled", false);
    $("#txtItemName").prop("disabled", false);
    $("#txtItemName").prop("disabled", false);
    $("#txtDisplayName").prop("disabled", false);
    $("#txtItembarcode").prop("disabled", false);
    $("#txtUOM").prop("disabled", false);
    $("#txtHSNCode").prop("disabled", false);
    $("#txtCategory").prop("disabled", false);
    $("#txtGroupItem").prop("disabled", false);
    $("#txtSubGroupItem").prop("disabled", false);
    $("#txtBrand").prop("disabled", false);
    $("#txtReorderLevel").prop("disabled", false);
    $("#txtReorderQty").prop("disabled", false);
    $("#txtItemLocation").prop("disabled", false);
    $("#txtBoxPacking").prop("disabled", false);
    $("#txtQtyinBox").prop("disabled", false);
    $("#txtMaintainExpiry").prop("disabled", false);
    $("#txtsave").prop("disabled", false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#hfCode").prop("disabled", false);
    $("#txtItemCode").prop("disabled", false);
    $("#txtItemName").prop("disabled", false);
    $("#txtItemName").prop("disabled", false);
    $("#txtDisplayName").prop("disabled", false);
    $("#txtItembarcode").prop("disabled", false);
    $("#txtUOM").prop("disabled", false);
    $("#txtHSNCode").prop("disabled", false);
    $("#txtCategory").prop("disabled", false);
    $("#txtGroupItem").prop("disabled", false);
    $("#txtSubGroupItem").prop("disabled", false);
    $("#txtBrand").prop("disabled", false);
    $("#txtReorderLevel").prop("disabled", false);
    $("#txtReorderQty").prop("disabled", false);
    $("#txtItemLocation").prop("disabled", false);
    $("#txtBoxPacking").prop("disabled", false);
    $("#txtQtyinBox").prop("disabled", false);
    $("#txtMaintainExpiry").prop("disabled", false);
    $("#txtsave").prop("disabled", false);
}
async function deleteItem(code, ItemName) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
        $(this).addClass('highlight');
    });
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'itemmaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this item ${ItemName} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteItem?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
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
async function Edit(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("EDIT");
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
                $("#txtItemCode").val(item.ItemCode);
                $("#txtItemName").val(item.ItemName);
                $("#txtDisplayName").val(item.DisplayName);
                $("#txtItembarcode").val(item.ItemBarCode);
                $("#txtUOM").val(item.UomName);
                $("#txtHSNCode").val(item.HSNCode);
                $("#txtCategory").val(item.CategoryName);
                $("#txtGroupItem").val(item.GroupName);
                $("#txtSubGroupItem").val(item.SubGroupName);
                $("#txtBrand").val(item.BrandName);
                $("#txtReorderLevel").val(item.ReorderLevel);
                $("#txtReorderQty").val(item.ReorderQty);
                $("#txtItemLocation").val(item.locationName);
                //$("#txtBoxPacking").val(item.BoxPacking);
             
                if (item.BoxPacking == 'N') {
                    $("#txtBoxPacking").prop("checked", false);
                } else {
                    $("#txtBoxPacking").prop("checked", true);
                }
                if (item.BoxPacking == 'Y') {
                    $("#txtQtyinBox").prop("disabled", false);
                }
                $("#txtQtyinBox").val(item.QtyInBox)
                if (item.BatchApplicable == 'N') {
                    $("#txtBatchApplicable").prop("checked", false);
                }
                if (item.MaintainExpiry == 'N') {
                    $("#txtMaintainExpiry").prop("checked", false);
                }

                $("#txtsave").prop("disabled", false);

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
function GetSubGroupDropDownList(GroupName) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowSubGroupByGroupName?GroupName=${GroupName}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtSubGroupItemList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.SubGroupName + '" text="' + item.Code + '"></option>';
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
function updateDisplayName() {
    const itemName = document.getElementById('txtItemName').value;
    document.getElementById('txtDisplayName').value = itemName;
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtItemCode").val("");
    $("#txtItemName").val("");
    $("#txtDisplayName").val("");
    $("#txtItembarcode").val("");
    $("#txtUOM").val("");
    $("#txtHSNCode").val("");
    $("#txtCategory").val("");
    $("#txtGroupItem").val("");
    $("#txtSubGroupItem").val("");
    $("#txtBrand").val("");
    $("#txtReorderLevel").val("0");
    $("#txtReorderQty").val("0");
    $("#txtItemLocation").val("");
    $("#txtBoxPacking").val("N");
    $("#txtQtyinBox").val("0");

}
function updateQtyBox(boxPackingValue) {
    document.getElementById("txtQtyinBox").disabled = boxPackingValue === "N";
    document.getElementById("txtQtyinBox").value = "0";
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Item Master");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach((row) => {
        const tds = row.querySelectorAll('td');
        const columnValue = tds[19]?.textContent.trim();

        if (columnValue === 'Y') {
            row.style.backgroundColor = '#f5c0bf';
        } else {
            row.style.backgroundColor = '';
        }
    });
}
async function View(code) {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("VIEW");
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
                $("#hfCode").val(item.Code).prop("disabled", true);
                $("#txtItemCode").val(item.ItemCode).prop("disabled", true);
                $("#txtItemName").val(item.ItemName).prop("disabled", true);
                $("#txtItemName").val(item.ItemName).prop("disabled", true);
                $("#txtDisplayName").val(item.DisplayName).prop("disabled", true);
                $("#txtItembarcode").val(item.ItemBarCode).prop("disabled", true);
                $("#txtUOM").val(item.UomName).prop("disabled", true);
                $("#txtHSNCode").val(item.HSNCode).prop("disabled", true);
                $("#txtCategory").val(item.CategoryName).prop("disabled", true);
                $("#txtGroupItem").val(item.GroupName).prop("disabled", true);
                $("#txtSubGroupItem").val(item.SubGroupName).prop("disabled", true);
                $("#txtBrand").val(item.BrandName).prop("disabled", true);
                $("#txtReorderLevel").val(item.ReorderLevel).prop("disabled", true);
                $("#txtReorderQty").val(item.ReorderQty).prop("disabled", true);
                $("#txtItemLocation").val(item.locationName).prop("disabled", true);
                $("#txtBoxPacking").val(item.BoxPacking).prop("disabled", true);
                $("#txtQtyinBox").val(item.QtyInBox).prop("disabled", true);
                $("#txtMaintainExpiry").val(item.MaintainExpiry).prop("disabled", true);
                $("#txtsave").prop("disabled", true);
                //$("#txtBoxPacking").val(item.BoxPacking);
                if (item.BoxPacking == 'N') {
                    $("#txtBoxPacking").prop("checked", false);
                } else {
                    $("#txtBoxPacking").prop("checked", true);
                }
                if (item.BoxPacking == 'Y') {
                    $("#txtQtyinBox").prop("disabled", false);
                }
                $("#txtQtyinBox").val(item.QtyInBox)
                if (item.BatchApplicable == 'N') {
                    $("#txtBatchApplicable").prop("checked", false);
                }
                if (item.MaintainExpiry == 'N') {
                    $("#txtMaintainExpiry").prop("checked", false);
                }

            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
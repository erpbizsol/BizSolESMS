
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const WarehouseDefultName = sessionStorage.getItem('DefaultWarehouse');
let ItemDetail = [];
let ItemList = [];
$(document).ready(function () {
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $("#ERPHeading").text("Item Opening Balance");
    $("#txtWarehouse").val(WarehouseDefultName);
    ShowItemOpeningBalancelist();
    GetItemDetails();
    GetWareHouseList();
    ShowItemMasterlist();
    GetModuleMasterCode();
    $("#txtWarehouse").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtWarehouseList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtWarehouse").val("")
        }
    });
    $("#txtItemBarCode").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtItemBarCodelist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtItemBarCode").val("")
            $("#txtItemCode").val("")
            $("#txtItemName").val("")
        }
    });
    $("#txtItemCode").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtItemCodelist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtItemCode").val("")
        }
    });
    $("#txtItemName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtItemNamelist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtItemName").val("")
        }
    });
    //$("#txtOpeningBalance").on("change", function () {
    //    let value = $(this).val();
    //    let isValid = false;
    //    $("#txtOpeningBalance option").each(function () {
    //        if ($(this).val() === value) {

    //            isValid = true;
    //            return false;
    //        }
    //    });
    //    if (!isValid) {
    //        $(this).val("");
    //        $("#txtOpeningBalance").val("")
    //    }
    //});
    $('#txtItemBarCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOpeningBalance").focus();
        }
    });
    $('#txtOpeningBalance').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    $("#txtheaderdiv").show();

    $('#txtItemBarCode').on('focus', function (e) {
        $("#txtItemBarCode").val("")
        $("#txtItemCode").val("")
        $("#txtItemName").val("")
    });
});
function ShowItemOpeningBalancelist() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetItemOpeningBalance`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = [];
                const NumericFilterColumn = ["Opening Balance"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Category", "Group", "Sub Group", "Brand", "Warehouse", "Item Code", "Item Name", "UOM"];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Opening Balance": "right"
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Item Code`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
                addNewRow();
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function GetItemDetails() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                ItemDetail = response;
                $('#txtItemBarCodelist').empty();
                $('#txtItemCodelist').empty();
                $('#txtItemNamelist').empty();
                let options1 = '';
                let options2 = '';
                let options3 = '';
                response.forEach(item => {
                    options1 += '<option value="' + item.ItemBarCode + '" text="' + item.Code + '"></option>';
                    options2 += '<option value="' + item.ItemCode + '" text="' + item.Code + '"></option>';
                    options3 += '<option value="' + item.ItemName + '" text="' + item.Code + '"></option>';
                });
                $('#txtItemBarCodelist').html(options1);
                $('#txtItemCodelist').html(options2);
                $('#txtItemNamelist').html(options3);
            } else {
                $('#txtItemBarCodelist').empty();
                $('#txtItemCodelist').empty();
                $('#txtItemNamelist').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtItemBarCode').empty();
            $('#txtItemCode').empty();
            $('#txtItemName').empty();
        }
    });
}
function GetWareHouseList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetWareHouseDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtWarehouseList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtWarehouseList').html(options);
            } else {
                $('#txtWarehouseList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').empty();
        }
    });
}
function OnChangeNumericTextBox(event, element) {
    if (event.charCode >= 48 && event.charCode <= 57) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Numbers");
        element.reportValidity();
        return false;
    }
}
function OnKeyDownPressFloatTextBox(event, element) {
    if (event.charCode == 13 || event.charCode == 46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57)) {
        element.setCustomValidity("");
        element.reportValidity();
        BizSolhandleEnterKey(event);
        return true;
    }
    else {
        element.setCustomValidity("Only allowed Float Numbers");
        element.reportValidity();
        return false;
    }
}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}
function isRowComplete(row) {
    const inputs = row.querySelectorAll("input.mandatory");
    for (const input of inputs) {
        if (input.value.trim() === "") {
            input.focus();
            return false;
        }
    }
    return true;
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Material Receipt Note");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function deleteItem(Code, ItemCode, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(Code, 'ItemOpeningBalance');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this  ${ItemCode}.?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/DeleteOpeningBalance?Code=${Code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status === 'Y') {
                    toastr.success(response[0].Msg);
                    ShowItemOpeningBalancelist();

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
}
function addNewRow() {
    let rowCount = 0;
    const table = document.getElementById("table").querySelector("tbody");
    const rows = table.querySelectorAll("tr");
    const lastRow = rows[rows.length - 1];
    if (rows.length > 0) {
        if (!isRowComplete(lastRow)) {
            alert("Please fill in all mandatory fields in the current row before adding a new row.");
        } else {
            rowCount = rows.length;
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
            <td id="txtItemCategory"></td>
            <td id="txtItemCategory"></td>
            <td id="txtItemGroup"></td>
            <td id="txtItemSubGroup"></td>
            <td id="txtItemBrand"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td><button id="btnSave" onclick="openSavePopup(this)" class="btn btn-success icon-height mb-1 Save" title="New-Entry"><i class="fa fa-plus" aria-hidden="true"></i></button></td>

      `;
            table.appendChild(newRow);
        }
    } else {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td id="txtItemCategory"></td>
            <td id="txtItemCategory"></td>
            <td id="txtItemGroup"></td>
            <td id="txtItemSubGroup"></td>
            <td id="txtItemBrand"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td id="txtItemUOM"></td>
            <td><button id="btnSave" class="btn btn-success icon-height mb-1 Save" title="Save"><i class="fas fa-save"></i></button></td>

            `;
        table.appendChild(newRow);
    }
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
                ItemList = response;
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}

//function Save(itemName, OpeningBalance, Warehouse) {
//    var payload = {
//        ItemName: itemName,
//        WarehouseName: Warehouse,
//        OpeningBalance: OpeningBalance
//    }
//    $.ajax({
//        url: `${appBaseURL}/api/OrderMaster/SaveItemOpeningBalance?UserMaster_Code=${UserMaster_Code}`,
//        type: "POST",
//        contentType: "application/json",
//        dataType: "json",
//        data: JSON.stringify(payload),
//        beforeSend: function (xhr) {
//            xhr.setRequestHeader("Auth-Key", authKeyData);
//        },
//        success: function (response) {
//            if (response.Status === "Y") {
//                toastr.success(response.Msg);
//                ShowItemOpeningBalancelist();
//                addNewRow();
//            } else if (response.Status === "N") {
//                toastr.error(response.Msg);
//            } else {
//                toastr.error(response.Msg);
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error:", xhr.responseText);
//            toastr.error("An error occurred while saving the data.");
//        },
//    });
//}

//$(document).on('keydown', '#table input', function (e) {
//    if (e.key === 'Enter') {
//        e.preventDefault();
//        const currentRow1 = $(this).closest('tr');
//        let currentInput = $(this);
//        let currentRow = currentInput.closest('tr')[0];
//        let lastRow = $('#table #table-body tr').last();
//        if (lastRow && currentInput.hasClass('txtOpeningBalance')) {
//            currentInput.hasClass('txtOpeningBalance')
//            let parentRow = currentInput.closest('tr');
//            if (parentRow.is(lastRow)) {
//                if (!isRowComplete(currentRow)) {
//                    toastr.error("Please fill in all mandatory fields in the current row before adding a new row.");
//                    return;
//                }
//                const itemName = currentRow1[0].querySelector('.txtItemName');
//                const OpeningBalance = currentRow1[0].querySelector('.txtOpeningBalance');
//                const Warehouse = currentRow1[0].querySelector('.txtWarehouse');
//                Save(itemName.value, OpeningBalance.value, Warehouse.value);
//            }
//        }
//        let inputs = $('#table').find('input:not([disabled])');
//        let currentIndex = inputs.index(currentInput);
//        if (currentIndex + 1 < inputs.length) {
//            inputs.eq(currentIndex + 1).focus();
//        }
//    }
//});
//function SaveData(element) {
//    const currentRow1 = $(element).closest('tr');
//    let currentInput = $(element);
//    let currentRow = currentInput.closest('tr')[0];
//    let lastRow = $('#table #table-body tr').last();

//    if (!isRowComplete(currentRow)) {
//        toastr.error("Please fill in all mandatory fields in the current row before adding a new row.");
//        return;
//    }
//    console.log(currentRow1);
//    const itemName = currentRow1[0].querySelector('.txtItemName');
//    const OpeningBalance = currentRow1[0].querySelector('.txtOpeningBalance');
//    const Warehouse = currentRow1[0].querySelector('.txtWarehouse');
//    Save(itemName.value, OpeningBalance.value, Warehouse.value);

//    let inputs = $('#table').find('input:not([disabled])');
//    let currentIndex = inputs.index(currentInput);
//    if (currentIndex + 1 < inputs.length) {
//        inputs.eq(currentIndex + 1).focus();
//    }
//};
//function FillallItemfield(inputElement, Value) {
//    let isValid = false;
//    const currentRow = inputElement.closest('tr');
//    if (currentRow) {
//        const inputValue = inputElement.value;
//        const itemCategory = currentRow.querySelector('.txtItemCategory');
//        const itemName = currentRow.querySelector('.txtItemName');
//        const itemCode = currentRow.querySelector('.txtItemCode');
//        const itemGroup = currentRow.querySelector('.txtItemGroup');
//        const itemSubGroup = currentRow.querySelector('.txtItemSubGroup');
//        const itemBrand = currentRow.querySelector('.txtItemBrand');
//        const itemUOM = currentRow.querySelector('.txtItemUOM');
//        if ("ItemName" === Value) {
//            const item = ItemList.find(entry => entry["Item Name"] == inputValue);
//            $("#txtItemCategory").text(item["Category Name"]);
//            $("#txtItemGroup").text(item["Group Name"]);
//            $("#txtItemSubGroup").text(item["Sub Group Name"]);
//            $("#txtItemBrand").text(item["Brand Name"]);
//            $("#txtItemUOM").text(item["UomName"]);
//            itemCode.value = item["Item Code"];
//            return false;
//        } else if ('Code' === Value) {
//            const item = ItemList.find(entry => entry["Item Code"] == inputValue);
//            $("#txtItemCategory").text(item["Category Name"]);
//            $("#txtItemGroup").text(item["Group Name"]);
//            $("#txtItemSubGroup").text(item["Sub Group Name"]);
//            $("#txtItemBrand").text(item["Brand Name"]);
//            $("#txtItemUOM").text(item["UomName"]);
//            itemName.value = item["Item Name"];
//            return false;
//        }

//    }
//}

//function focusblank(element) {
//    $(element).val("");
//}
//function CheckItemBarCode(inputElement) {
//    const currentRow = inputElement.closest('tr');
//    if (currentRow) {
//        const value = inputElement.value;
//        let isValid = false;
//        const itemName = currentRow.querySelector('.txtItemName');
//        const itemCode = currentRow.querySelector('.txtItemCode');
//        $("#txtItemName option").each(function () {
//            if ($(this).val() === value) {
//                isValid = true;
//                return false;
//            }
//        });
//        if (!isValid) {
//            $("#txtItemCategory").text("");
//            $("#txtItemGroup").text("");
//            $("#txtItemSubGroup").text("");
//            $("#txtItemBrand").text("");
//            $("#txtItemUOM").text("");
//            itemName.value = "";
//            itemCode.value = "";
//        }
//    }

//}
//function CheckItemName(inputElement) {
//    const currentRow = inputElement.closest('tr');
//    if (currentRow) {
//        const value = inputElement.value;
//        let isValid = false;
//        const itemName = currentRow.querySelector('.txtItemName');
//        const itemCode = currentRow.querySelector('.txtItemCode');
//        $("#txtItemName option").each(function () {
//            if ($(this).val() === value) {
//                isValid = true;
//                return false;
//            }
//        });
//        if (!isValid) {
//            $("#txtItemCategory").text("");
//            $("#txtItemGroup").text("");
//            $("#txtItemSubGroup").text("");
//            $("#txtItemBrand").text("");
//            $("#txtItemUOM").text("");
//            itemName.value = "";
//            itemCode.value = "";
//        }
//    }

//}
//function CheckItemCode(inputElement) {
//    const currentRow = inputElement.closest('tr');
//    if (currentRow) {
//        const value = inputElement.value;
//        let isValid = false;
//        const itemName = currentRow.querySelector('.txtItemName');
//        const itemCode = currentRow.querySelector('.txtItemCode');

//        $("#txtItemCode option").each(function () {
//            if ($(this).val() === value) {
//                isValid = true;
//                return false;
//            }
//        });
//        if (!isValid) {
//            $("#txtItemCategory").text("");
//            $("#txtItemGroup").text("");
//            $("#txtItemSubGroup").text("");
//            $("#txtItemBrand").text("");
//            $("#txtItemUOM").text("");
//            itemName.value = "";
//            itemCode.value = "";

//        }
//    }

//}

//function CheckWarehouse(inputElement) {
//    const currentRow = inputElement.closest('tr');
//    if (currentRow) {
//        const value = inputElement.value;
//        let isValid = false;
//        const Warehouse = currentRow.querySelector('.txtWarehouse');
//        $("#txtWarehouse option").each(function () {
//            if ($(this).val() === value) {
//                isValid = true;
//                return false;
//            }
//        });
//        if (!isValid) {
//            Warehouse.value = "";
//        }
//    }

//}
function openSavePopup(button) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
    });
    window.currentSaveButton = button;
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
    saveModal.show();
    ClearData();
}
function confirmSave() {

    var ItemBarCode = $("#txtItemName").val();
    var Warehouse = $("#txtWarehouse").val();
    var OpeningBalance = $("#txtOpeningBalance").val();
    if (ItemBarCode === "") {
        toastr.error('Please select a Item Bar Code.!');
        $("#txtItemCode").focus();
    }
    else if (Warehouse ==="") {
        toastr.error('Please select a Warehouse.!');
        $("#txtWarehouse").focus();
    }
    else if (OpeningBalance === "") {
        toastr.error('Please enter a OpeningBalance.!');
        $("#txtOpeningBalance").focus();
    }
    else {
        var itemName = $("#txtItemName").val();
        var Warehouse = $("#txtWarehouse").val();
        var OpeningBalance = $("#txtOpeningBalance").val();
        var payload = {
            ItemName: itemName,
            WarehouseName: Warehouse,
            OpeningBalance: OpeningBalance
        }
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/SaveItemOpeningBalance?UserMaster_Code=${UserMaster_Code}`,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Auth-Key", authKeyData);
            },
            success: function (response) {
                if (response.Status === "Y") {
                    //toastr.success(response.Msg);
                    ClearData();
                    ShowItemOpeningBalancelist();

                    addNewRow();

                } else if (response.Status === "N") {
                    toastr.error(response.Msg);
                } else {
                    toastr.error(response.Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            },
        });
    }
}
function ClearData() {
    $("#txtOpeningBalance").val("");
    $("#txtItemName").val("");
    $("#txtItemCode").val("");
    $("#txtItemBarCode").val("");
}
function FillallItemfield(inputElement) {
    var inputValue = $(inputElement).val();
    const item = ItemList.find(entry => entry["Item Bar Code"] == inputValue);
    $("#txtItemCode").val(item["Item Code"]);
    $("#txtItemName").val(item["Item Name"]);;
}
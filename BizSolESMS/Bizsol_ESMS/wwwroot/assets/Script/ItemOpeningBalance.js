var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const MenuURL = sessionStorage.getItem('AppBaseURLMenu');
const WarehouseDefultName = sessionStorage.getItem('DefaultWarehouse');
let ItemDetail = [];
let JsonData = [];
let ItemList = [];
$(document).ready(function () {
    UpdateLabelforItemMaster();
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
    $("#txtFile").on("change", function (e) {
        Import(e);
    });
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
                        $("#txtItemName").attr("placeholder", item.ItemNameHeader);
                    } else {
                        $("#txtItemNamelab").text("Item Name");
                        $("#txtItemName").attr("placeholder", "Item Name");
                    }
                    if (item.ItembarcodeHeader) {
                        $("#txtItembarcodelab").text(item.ItembarcodeHeader);
                        $("#txtItembarcode").attr("placeholder", item.ItembarcodeHeader);
                    } else {
                        $("#txtItembarcodelab").text("Item Bar Code");
                        $("#txtItembarcode").attr("placeholder", "Item Bar Code");
                    }
                    if (item.ItemCodeHeader) {
                        $("#txtItemCodelab").text(item.ItemCodeHeader);
                        $("#txtItemCode").attr("placeholder", item.ItemCodeHeader);
                    }
                    else {
                        $("#txtItemCodelab").text("Item Code");
                        $("#txtItemCode").attr("placeholder", "Item Code");
                    }

                });
            } else {
                $("#txtItemNamelab").text("Item Name");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $("#txtItemNamelab").text("Error fetching label data");
        }
    });
}
function ShowItemOpeningBalancelist() {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetItemOpeningBalance`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                unblockUI();
                const StringFilterColumn = [G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
                const NumericFilterColumn = ["Opening Balance"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["Category", "Group", "Sub Group", "Brand", "Warehouse",G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', , "UOM"];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Opening Balance": "right"
                };
                //let updatedResponse = "";
                //if (response.length > 0 && response[0]["Item Code"] !== '') {
                //    updatedResponse = response.map(item => ({
                //        ...item, Action: `
                //        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Item Code`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>`
                //    }));
                //}
                //else {
                //    updatedResponse = response.map(item => ({
                //        ...item, Action: `
                //        <button id="btnSave" onclick="openSavePopup(this)" class="btn btn-success icon-height mb-1 Save" title="New-Entry"><i class="fa fa-plus" aria-hidden="true"></i></button>`
                //    }));
                //}
                const renameMap = {
                    "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                    "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    "Item Bar Code": G_ItemConfig[0].ItembarcodeHeader ? G_ItemConfig[0].ItembarcodeHeader : 'Item Bar Code',
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

                    if (response.length > 0 && response[0]["Item Code"] !== '') {
                        renamedItem["Action"] = `
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`Item Code`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>`
                       ;
                    } else {
                        renamedItem["Action"] = `
                             <button id="btnSave" onclick="openSavePopup(this)" class="btn btn-success icon-height mb-1 Save" title="New-Entry"><i class="fa fa-plus" aria-hidden="true"></i></button>`;
                    }
                     return renamedItem;
                });

                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true);
                if (response.length > 0 && response[0]["Item Code"] !== '') {
                    addNewRow();
                }
            } else {
                unblockUI();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
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
            const $select = $('#txtWarehouse');
            const $select1 = $('#txtImportWarehouse');
            $select.empty();

            if (response.length > 0) {
                let options = '<option value="0">-- Select ---</option>';
                response.forEach(item => {
                    options += `<option value="${item.Name}">${item.Name}</option>`;
                });
                $select.html(options);
                $select1.html(options);
                $("#txtWarehouse").val(WarehouseDefultName);
                $("#txtImportWarehouse").val(WarehouseDefultName);
            } else {
                $select.html('<option value="">No warehouses found</option>');
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtWarehouse').html('<option value="">Error loading warehouses</option>');
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
    const result = Data.find(item => item.ModuleDesp === "Item Opening Balance");
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
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(Code, 'ItemOpeningBalance');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
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
    $('tr').removeClass('highlight');
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

    var ItemCode = $("#txtItemCode").val();
    var Warehouse = $("#txtWarehouse").val();
    var OpeningBalance = $("#txtOpeningBalance").val();
    if (ItemCode === "") {
        toastr.error('Please select a Item Code.!');
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
        var itemCode = $("#txtItemCode").val();
        var Warehouse = $("#txtWarehouse").val();
        var OpeningBalance = $("#txtOpeningBalance").val();
        var payload = {
            ItemCode: itemCode,
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
    $("#txtFile").val("");
}
function FillallItemfield(inputElement) {
    var inputValue = $(inputElement).val();
    const item = ItemList.find(entry => entry["Item Code"] == inputValue);
    $("#txtItemBarCode").val(item["Item Bar Code"]);
    $("#txtItemName").val(item["Item Name"]);;
}
function ImportExcel() {
    $("#txtImport").show();
    $("#txtCreatePage").hide();
    $("#txtHeaderDv1").hide();
    $("#txtHeaderDv2").show();
    ClearData();
}
function BackMaster() {
    JsonData = [];
    $("#txtImport").hide();
    $("#txtCreatePage").show();
    $("#txtHeaderDv1").show();
    $("#txtHeaderDv2").hide();
    $("#dvImportTable").hide();
    $("#txtWarehouse").val(WarehouseDefultName);
    $("#txtImportWarehouse").val(WarehouseDefultName);
    ShowItemOpeningBalancelist();
    ClearData();
}
function DownloadTemplate() {
    const link = document.createElement('a');
    link.href = `${MenuURL}/assets/Template/Template_ItemOpening.xlsx`;
    link.target = '_blank';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function validateExcelFormat(data) {
    if (data.length < 1) {
        return { isValid: false, message: "The Excel file is empty." };
    }
    const headers = data[0].map(header => header.replace(/[\s.]+/g, ''));
    const requiredColumns = ['ItemCode', 'OpeningBalance', 'MRP'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        return { isValid: false, message: `Missing required columns: ${missingColumns.join(', ')}` };
    }

    return { isValid: true, message: "Excel format is valid." };
}
function GetImportFile() {
    const Warehouse = $("#txtImportWarehouse").val();
    if (Warehouse == '0') {
        toastr.error("Please select Warehouse !");
        $("#txtImportWarehouse").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        WarehouseName: Warehouse,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportOpeningBalanceForTemp`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                createTable(response)
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
function SaveImport() {
    const Warehouse = $("#txtImportWarehouse").val();
    if (Warehouse == '0') {
        toastr.error("Please select Warehouse !");
        $("#txtImportWarehouse").focus();
        return;
    } else if (JsonData.length == 0) {
        toastr.error("Please select xlx file !");
        $("#txtFile").focus();
        return;
    }
    const requestData = {
        JsonData: JsonData,
        WarehouseName: Warehouse,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ImportOpeningBalance`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                toastr.success(response.Msg);
                BackMaster();
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
function Import(event) {
    JsonData = [];
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        $("#ImportTable").hide();
        JsonData = [];
        return;
    }

    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload an Excel or CSV file (.xlsx, .xls, .csv).");
        event.target.value = '';
        $("#ImportTable").hide();
        JsonData = [];
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            if (fileExtension === 'csv') {
                validateCSV(event, function (isValidCSV) {
                    if (!isValidCSV) {
                        event.target.value = '';
                        $("#ImportTable").hide();
                        JsonData = [];
                        return false;
                    }
                    GetImportFile();
                });
                JsonData = parseCSV(e.target.result);
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                if (workbook.SheetNames.length === 0) {
                    alert("Invalid Excel file: No sheets found.");
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, cellDates: true });

                JsonData = convertToKeyValuePairs(jsonData);
                const validationResult = validateExcelFormat(jsonData);
                if (!validationResult.isValid) {
                    alert(`Invalid Excel format: ${validationResult.message}`);
                    event.target.value = '';
                    $("#ImportTable").hide();
                    JsonData = [];
                    return;
                }
                GetImportFile();
            }


        } catch (error) {
            alert("Error reading the file. Ensure it is a valid format.");
            event.target.value = '';
            $("#ImportTable").hide();
            JsonData = [];
        }
    };

    if (fileExtension === 'csv') {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}
function cleanHeader(header) {
    return header.replace(/[^a-zA-Z0-9]/g, '');
}
function cleanValue(value) {
    return value.replace(/^"|"$/g, '').trim();
}
function createTable(response) {
    if (response.length > 0) {
        $("#dvImportTable").show();
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {};

        BizsolCustomFilterGrid.CreateDataTable(
            "ImportTable-header",
            "ImportTable-body",
            response,
            Button,
            showButtons,
            StringFilterColumn,
            NumericFilterColumn,
            DateFilterColumn,
            StringdoubleFilterColumn,
            hiddenColumns,
            ColumnAlignment,
            true
        );
    } else {
        $("#dvImportTable").hide();
        toastr.error("Record not found...!");
    }
}
function validateCSV(event, callback) {
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a file.");
        callback(false);
        return;
    }
    let expectedHeaders = ["ItemCode","OpeningBalance", "MRP"];

    const reader = new FileReader();
    reader.onload = function (e) {
        const csvData = e.target.result;
        const rows = csvData.split(/\r?\n/);
        if (rows.length === 0) {
            alert("Empty file.");
            callback(false);
            return;
        }

        const headers = rows[0].split(/\t|,/).map(h => cleanHeader(h.trim()));

        const missingHeaders = expectedHeaders.filter(expected =>
            !headers.includes(expected)
        );

        if (missingHeaders.length === 0) {
            console.log("CSV Headers Matched ✅");
            callback(true);
        } else {
            alert("Invalid file. Missing required headers: " + missingHeaders.join(", "));
            console.log("Expected:", expectedHeaders);
            console.log("Found:", headers);
            callback(false);
        }
    };

    reader.readAsText(file);
}
function convertToKeyValuePairs(data) {
    if (!Array.isArray(data) || data.length === 0) return [];

    const headers = data[0].map(header => cleanHeader(header));

    return data.slice(1).map(row => {
        return headers.reduce((obj, header, index) => {
            let value = row[index] ? cleanValue(row[index].toString()) : "";

            obj[header] = value;
            return obj;
        }, {});
    });
}
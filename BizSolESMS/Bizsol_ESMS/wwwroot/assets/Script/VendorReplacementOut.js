var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let AccountList = [];
let BrandList = [];
let ItemDetail = [];
let G_ListData = [];
let G_CurrentDate = "";
let skipHeadItemLoad = false;

$(document).ready(function () {
    $("#ERPHeading").text("Vendor Replacement Out");
    applyItemHeaders();
    DatePicker();
    GetAccountMasterList();
    GetBrandMasterListForReplacement();
    ShowVendorReplacementOutList('Load');
    GetModuleMasterCode();

    $("#btnAddNewRow").click(function () {
        addNewRow();
    });

    initSelect2($("#txtVendorName"));
    initSelect2($("#txtHead"));

    $('#txtHead').on('change', function () {
        if (skipHeadItemLoad) {
            return;
        }
        const selectedBrand = BrandList.find(entry => brandName(entry) == $(this).val());
        GetItemDetails(selectedBrand ? brandCode(selectedBrand) : 0);
    });
});
function applyItemHeaders() {
    if (!$("#thItemBarCode").length) {
        $("#tblVendorReplacement thead tr").prepend('<th id="thItemBarCode" style="min-width:160px;">Part Bar Code <span class="text-danger">*</span></th>');
    }
    const $qtyTh = $("#thQty").length ? $("#thQty") : $("#tblVendorReplacement thead th").filter(function () {
        return $(this).text().indexOf("Qty") >= 0;
    });
    $qtyTh.css({ width: "70px", minWidth: "70px", maxWidth: "80px" });
    try {
        const config = JSON.parse(sessionStorage.getItem('ItemConfig'));
        if (config && config.length > 0) {
            $("#thItemBarCode").html((config[0].ItembarcodeHeader || "Part Bar Code") + ' <span class="text-danger">*</span>');
            $("#thItemCode").html((config[0].ItemCodeHeader || "Item Code") + ' <span class="text-danger">*</span>');
            $("#thItemName").html((config[0].ItemNameHeader || "Item Name") + ' <span class="text-danger">*</span>');
        }
    } catch (e) { }
}
function ShowVendorReplacementOutList(Type) {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/VendorReplacementOut/ShowVendorReplacementOut`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            unblockUI();
            if (response && response.length > 0) {
                G_ListData = response;
                $("#txtVendorReplacementTable").show();
                bindListGrid(G_ListData);
            } else {
                G_ListData = [];
                showEmptyGrid();
                if (Type != 'Load') {
                    toastr.error("Record not found...!");
                }
            }
        },
        error: function (xhr, status, error) {
            unblockUI();
            console.error("Error:", error);
            G_ListData = [];
            showEmptyGrid();
        }
    });
}

function showEmptyGrid() {
    $("#txtVendorReplacementTable").show();
    $("#table-header").html(`<tr>
        <th>Entry No</th>
        <th>Entry Date</th>
        <th>Vendor Name</th>
        <th>Head</th>
        <th>Out Qty</th>
        <th>In Qty</th>
        <th>Balance Qty</th>
        <th>Status</th>
        <th>Remark</th>
        <th>Action</th>
    </tr>`);
    $("#table-body").html(`<tr><td colspan="10" style="text-align:center;">No records found</td></tr>`);
    $("#paginator-table").empty();
}
function bindListGrid(rows) {
    const StringFilterColumn = ["Entry No", "Vendor Name", "Head", "Status"];
    const NumericFilterColumn = ["Out Qty", "In Qty", "Balance Qty"];
    const DateFilterColumn = ["Entry Date"];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ["Code"];
    const ColumnAlignment = {};
    const updatedResponse = rows.map(item => {
        const status = rowStatus(item);
        return {
            ...item,
            Status: status,
            Action: `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="Edit('${item.Code}','${escapeAttr(status)}')"><i class="fa-solid fa-pencil"></i></button>
            <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${escapeAttr(item["Entry No"])}','${escapeAttr(status)}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
            <button class="btn btn-primary icon-height mb-1" title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>`
        };
    });
    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
}
function escapeAttr(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function rowStatus(item) {
    const raw = item.Status ?? item["Status"] ?? "";
    if (String(raw).trim()) {
        return String(raw).trim();
    }
    const inQty = parseFloat(item["In Qty"] ?? item.InQty ?? 0) || 0;
    return inQty > 0 ? "Completed" : "Pending";
}
function isStatusPending(status) {
    const key = String(status ?? "").trim().toLowerCase();
    return key === "pending" || key === "n";
}

async function CreateVendorReplacementOut() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtbtnSave").show().prop("disabled", false);
    $("#btnAddNewRow").show();
    setEntryDate(G_CurrentDate);
    $("#VendorReplacementData").empty();
    addNewRow();
    disableFields(false);
    $("#txtEntryNo").prop("disabled", true);
    $("#txtEntryDate").focus();
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    disableFields(false);
    $("#txtbtnSave").show().prop("disabled", false);
    ShowVendorReplacementOutList('Load');
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtEntryNo").val("");
    setEntryDate(G_CurrentDate);
    $("#txtVendorName").val("").trigger("change");
    $("#txtHead").val("").trigger("change");
    $("#txtRemark").val("");
    $("#VendorReplacementData").empty();
}
function Save() {
    const entryDate = $("#txtEntryDate").val();
    const vendorName = $("#txtVendorName").val();
    const head = $("#txtHead").val();
    const remark = $("#txtRemark").val();

    if (!entryDate) {
        toastr.error("Please select an Entry Date.");
        $("#txtEntryDate").focus();
        return;
    }
    if (!vendorName) {
        toastr.error("Please enter a Vendor Name.");
        $("#txtVendorName").focus();
        return;
    }
    const selectedVendor = AccountList.find(entry => entry.AccountName == vendorName);
    if (!selectedVendor) {
        toastr.error("Please select a valid Vendor Name.");
        $("#txtVendorName").focus();
        return;
    }
    if (!head) {
        toastr.error("Please select a Head.");
        openSelect2("#txtHead");
        return;
    }
    if (!BrandList.some(entry => brandName(entry) == head)) {
        toastr.error("Please select a valid Head.");
        openSelect2("#txtHead");
        return;
    }
    const selectedBrand = BrandList.find(entry => brandName(entry) == head);

    const details = [];
    let validationFailed = false;
    $("#tblVendorReplacement tbody tr").each(function () {
        const row = $(this);
        const itemBarCode = (row.find(".txtItemBarCode").val() || "").trim();
        const itemCode = (row.find(".txtItemCode").val() || "").trim();
        const itemName = (row.find(".txtItemName").val() || "").trim();
        const qty = (row.find(".txtQty").val() || "").trim();
        if (!itemBarCode && !itemCode && !itemName && !qty) {
            return;
        }
        if (!itemBarCode) {
            toastr.error("Please select Part Bar Code.");
            row.find(".txtItemBarCode").focus();
            validationFailed = true;
            return false;
        }
        if (!itemCode) {
            toastr.error("Please select Item Code.");
            row.find(".txtItemCode").focus();
            validationFailed = true;
            return false;
        }
        if (!itemName) {
            toastr.error("Please select Item Name.");
            row.find(".txtItemName").focus();
            validationFailed = true;
            return false;
        }
        if (!/^\d{1,5}$/.test(qty) || parseInt(qty, 10) <= 0) {
            toastr.error("Qty accepts only up to 5 digits and no decimal.");
            row.find(".txtQty").focus();
            validationFailed = true;
            return false;
        }
        const item = ItemDetail.find(entry => entry.ItemCode == itemCode);
        if (!item || !item.Code) {
            toastr.error("Please select a valid Item Code.");
            row.find(".txtItemCode").focus();
            validationFailed = true;
            return false;
        }
        if (isItemSelectedInOtherRow(item, this)) {
            toastr.error("Same item is already selected in another row.");
            row.find(".txtItemCode").focus();
            validationFailed = true;
            return false;
        }
        details.push({
            qty: parseInt(qty, 10),
            itemMaster_Code: item.Code
        });
    });
    if (validationFailed) {
        return;
    }
    if (details.length === 0) {
        toastr.error("Please enter at least one item.");
        return;
    }

    const payload = {
        vendorReplacementOut: [{
            code: parseInt($("#hfCode").val(), 10) || 0,
            entryNo: $("#txtEntryNo").val() || "",
            entryDate: entryDate,
            accountMaster_Code: selectedVendor.Code || selectedVendor.code || 0,
            brandMaster_Code: selectedBrand ? brandCode(selectedBrand) : 0,
            remark: remark || ""
        }],
        vendorReplacementOutDetail: details
    };

    $.ajax({
        url: `${appBaseURL}/api/VendorReplacementOut/SaveVendorReplacementOut?UserMaster_Code=${UserMaster_Code}`,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Auth-Key", authKeyData);
        },
        success: function (response) {
            if (response.Status === "Y") {
                toastr.success(response.Msg);
                BackMaster();
            } else {
                toastr.error(response.Msg || "Unable to save.");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText || error);
            toastr.error("An error occurred while saving the data.");
        }
    });
}

async function Edit(code, status) {
    if (!isStatusPending(status)) {
        toastr.error("You can't edit because status is not Pending.");
        return;
    }
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    openRecord(code, false);
}

async function View(code) {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    openRecord(code, true);
}
function openRecord(code, isView) {
    $("#tab1").text(isView ? "VIEW" : "EDIT");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/VendorReplacementOut/ShowVendorReplacementOutByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const headerList = (response && (response.VendorReplacementOut || response.Header)) || [];
            const detailList = (response && (response.VendorReplacementOutDetail || response.Detail)) || [];
            if (!headerList.length) {
                toastr.error("Record not found...!");
                return;
            }
            const header = headerList[0];
            const accountCode = header.AccountMaster_Code || header.accountMaster_Code || 0;
            const brandMasterCode = header.BrandMaster_Code || header.brandMaster_Code || 0;
            $("#hfCode").val(header.Code || header.code || 0);
            $("#txtEntryNo").val(header.EntryNo || header.entryNo || header["Entry No"] || "");
            setEntryDate(header.EntryDate || header.entryDate || header["Entry Date"] || "");
            $("#txtRemark").val(header.Remark || header.remark || "");
            selectVendorByCode(accountCode);
            selectHeadByCode(brandMasterCode);
            $("#VendorReplacementData").empty();
            GetItemDetails(brandMasterCode, function () {
                if (detailList.length > 0) {
                    detailList.forEach(function (line) {
                        addNewRow(line);
                    });
                } else {
                    addNewRow();
                }
                disableFields(isView);
                $("#txtEntryNo").prop("disabled", true);
                $("#txtbtnSave").toggle(!isView).prop("disabled", isView);
                $("#btnAddNewRow").toggle(!isView);
                if (isView) {
                    $("#tblVendorReplacement .deleteRow").hide();
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Record not found...!");
        }
    });
}

async function deleteItem(code, entryNo, status, button) {
    const tr = button.closest("tr");
    tr.classList.add("highlight");
    if (!isStatusPending(status)) {
        toastr.error("You can't delete because status is not Pending.");
        $('tr').removeClass('highlight');
        return;
    }
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this item ${entryNo} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/VendorReplacementOut/DeleteVendorReplacementOut?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowVendorReplacementOutList('Get');
                } else {
                    toastr.error(response.Msg || "Unexpected response format.");
                }
                $('tr').removeClass('highlight');
            },
            error: function () {
                toastr.error("Error deleting item.");
                $('tr').removeClass('highlight');
            }
        });
    } else {
        $('tr').removeClass('highlight');
    }
}
function GetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsVendorDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0) {
                AccountList = response;
            } else {
                AccountList = [];
            }
            CreateVendorlist();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            AccountList = [];
            CreateVendorlist();
        }
    });
}
function CreateVendorlist() {
    const current = $("#txtVendorName").val();
    let options = '<option value="">Select</option>';
    AccountList.forEach(item => {
        const name = item.AccountName || "";
        if (name) {
            options += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
        }
    });
    $("#txtVendorName").html(options);
    if (current) {
        $("#txtVendorName").val(current);
    }
    initSelect2($("#txtVendorName"));
}
function brandName(item) {
    return item.BrandName ?? item.brandName ?? item["Brand Name"] ?? item.Head ?? item.head ?? "";
}
function brandCode(item) {
    return item.Code ?? item.code ?? item.BrandMaster_Code ?? item.brandMaster_Code ?? 0;
}
function GetBrandMasterListForReplacement() {
    $.ajax({
        url: `${appBaseURL}/api/VendorReplacementOut/GetBrandMasterListForReplacement`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            BrandList = (response && response.length > 0) ? response : [];
            CreateHeadList();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            BrandList = [];
            CreateHeadList();
        }
    });
}
function CreateHeadList() {
    const current = $("#txtHead").val();
    let options = '<option value="">Select</option>';
    BrandList.forEach(item => {
        const name = brandName(item);
        if (name) {
            options += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
        }
    });
    $("#txtHead").html(options);
    if (current) {
        $("#txtHead").val(current);
    }
    initSelect2($("#txtHead"));
}
function selectVendorByCode(code) {
    const match = AccountList.find(entry => String(entry.Code ?? entry.code ?? "") === String(code));
    $("#txtVendorName").val(match ? (match.AccountName || "") : "").trigger("change");
}
function selectHeadByCode(code) {
    const match = BrandList.find(entry => String(brandCode(entry)) === String(code));
    skipHeadItemLoad = true;
    $("#txtHead").val(match ? brandName(match) : "").trigger("change");
    skipHeadItemLoad = false;
}
function GetItemDetails(brandMasterCode, callback) {
    if (!brandMasterCode) {
        ItemDetail = [];
        $('#txtItemBarCodeList').empty();
        $('#txtItemCodeList').empty();
        $('#txtItemNameList').empty();
        if (typeof callback === 'function') {
            callback();
        }
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetailss?BrandMaster_Code=${brandMasterCode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0) {
                ItemDetail = response;
                let barCodeOptions = '';
                let codeOptions = '';
                let nameOptions = '';
                response.forEach(item => {
                    barCodeOptions += '<option value="' + (item.ItemBarCode || "") + '" text="' + (item.Code || "") + '"></option>';
                    codeOptions += '<option value="' + (item.ItemCode || "") + '" text="' + (item.Code || "") + '"></option>';
                    nameOptions += '<option value="' + (item.ItemName || "") + ' (' + (item.ItemCode || "") + ')" text="' + (item.Code || "") + '"></option>';
                });
                $('#txtItemBarCodeList').html(barCodeOptions);
                $('#txtItemCodeList').html(codeOptions);
                $('#txtItemNameList').html(nameOptions);
            } else {
                ItemDetail = [];
                $('#txtItemBarCodeList').empty();
                $('#txtItemCodeList').empty();
                $('#txtItemNameList').empty();
            }
            if (typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            ItemDetail = [];
            $('#txtItemBarCodeList').empty();
            $('#txtItemCodeList').empty();
            $('#txtItemNameList').empty();
            if (typeof callback === 'function') {
                callback();
            }
        }
    });
}
function DatePicker() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_CurrentDate = response && response.length > 0 ? response[0].Date : "";
            if (!$("#txtEntryDate").val() && G_CurrentDate) {
                setEntryDate(G_CurrentDate);
            }
        },
        error: function () {
            console.error("Failed to fetch the date from the API.");
        }
    });
}
function toInputDate(value) {
    const text = String(value || "").trim();
    if (!text) {
        return "";
    }
    let match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
        return match[3] + "-" + match[2] + "-" + match[1];
    }
    match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return match[1] + "-" + match[2] + "-" + match[3];
    }
    return "";
}
function setEntryDate(date) {
    $("#txtEntryDate").val(toInputDate(date));
}
function initSelect2($el) {
    const disabled = $el.prop("disabled");
    if ($el.hasClass("select2-hidden-accessible")) {
        $el.select2("destroy");
    }
    $el.prop("disabled", disabled);
    $el.select2({
        width: "-webkit-fill-available",
        placeholder: "Select",
        allowClear: true
    });
}
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function addNewRow(line) {
    const table = document.getElementById("VendorReplacementData");
    const rows = table.querySelectorAll("tr");
    if (!line && rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        const itemBarCode = lastRow.querySelector(".txtItemBarCode").value.trim();
        const itemCode = lastRow.querySelector(".txtItemCode").value.trim();
        const itemName = lastRow.querySelector(".txtItemName").value.trim();
        const qty = lastRow.querySelector(".txtQty").value.trim();
        if (!itemBarCode || !itemCode || !itemName || !qty) {
            toastr.error("Please fill Part Bar Code, Item Code, Item Name and Qty in the current row before adding a new row.");
            return;
        }
    }
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" list="txtItemBarCodeList" class="txtItemBarCode box_border form-control form-control-sm mandatory" onchange="FillItemField(this,'BarCode');" autocomplete="off" maxlength="50" /></td>
        <td><input type="text" list="txtItemCodeList" class="txtItemCode box_border form-control form-control-sm mandatory" onchange="FillItemField(this,'ItemCode');" autocomplete="off" maxlength="200" /></td>
        <td><input type="text" list="txtItemNameList" class="txtItemName box_border form-control form-control-sm mandatory" onchange="FillItemField(this,'ItemName');" autocomplete="off" maxlength="200" /></td>
        <td style="width:70px;"><input type="text" inputmode="numeric" class="txtQty box_border form-control form-control-sm text-end mandatory" onkeypress="return OnKeyDownPressQty(event, this);" oninput="sanitizeQty(this);" autocomplete="off" maxlength="5" /></td>
        <td><button type="button" class="btn btn-danger icon-height mb-1 deleteRow" title="Delete"><i class="fa-regular fa-circle-xmark"></i></button></td>`;
    table.appendChild(newRow);
    if (line) {
        const itemMasterCode = line.ItemMaster_Code || line.itemMaster_Code || 0;
        const itemCode = line.ItemCode || line.itemCode || "";
        const itemName = line.ItemName || line.itemName || "";
        const qty = line.Qty ?? line.qty ?? "";
        const matched = ItemDetail.find(entry =>
            String(entry.Code ?? entry.code ?? "") === String(itemMasterCode) ||
            (itemCode && entry.ItemCode == itemCode)
        );
        newRow.querySelector(".txtItemBarCode").value = line.ItemBarCode || line.itemBarCode || (matched ? matched.ItemBarCode : "") || "";
        newRow.querySelector(".txtItemCode").value = itemCode || (matched ? matched.ItemCode : "") || "";
        newRow.querySelector(".txtItemName").value = itemName || (matched ? matched.ItemName : "") || "";
        newRow.querySelector(".txtQty").value = String(qty).split(".")[0].replace(/\D/g, "").slice(0, 5);
    }
}
function FillItemField(inputElement, type) {
    const row = inputElement.closest('tr');
    const inputValue = (inputElement.value || "").trim();
    const itemBarCode = row.querySelector('.txtItemBarCode');
    const itemCode = row.querySelector('.txtItemCode');
    const itemName = row.querySelector('.txtItemName');
    if (!inputValue) {
        return;
    }
    let item = null;
    if (type === 'BarCode') {
        item = ItemDetail.find(entry => entry.ItemBarCode == inputValue);
    } else if (type === 'ItemCode') {
        item = ItemDetail.find(entry => entry.ItemCode == inputValue);
    } else {
        item = ItemDetail.find(entry => (entry.ItemName + ' (' + entry.ItemCode + ')') === inputValue)
            || ItemDetail.find(entry => entry.ItemName == inputValue);
    }
    if (!item) {
        inputElement.value = "";
        toastr.error(type === 'BarCode' ? "Please select a valid Part Bar Code." : (type === 'ItemCode' ? "Please select a valid Item Code." : "Please select a valid Item Name."));
        return;
    }
    if (isItemSelectedInOtherRow(item, row)) {
        itemBarCode.value = "";
        itemCode.value = "";
        itemName.value = "";
        toastr.error("Same item is already selected in another row.");
        return;
    }
    itemBarCode.value = item.ItemBarCode || "";
    itemCode.value = item.ItemCode || "";
    itemName.value = item.ItemName || "";
}
function isItemSelectedInOtherRow(item, currentRow) {
    const itemCode = String(item.ItemCode || "").trim();
    const itemMasterCode = String(item.Code ?? item.code ?? "");
    let selected = false;
    $("#tblVendorReplacement tbody tr").each(function () {
        if (this === currentRow) {
            return;
        }
        const otherCode = ($(this).find(".txtItemCode").val() || "").trim();
        if (!otherCode) {
            return;
        }
        if (itemCode && otherCode === itemCode) {
            selected = true;
            return false;
        }
        const otherItem = ItemDetail.find(entry => entry.ItemCode == otherCode);
        if (otherItem && itemMasterCode && String(otherItem.Code ?? otherItem.code ?? "") === itemMasterCode) {
            selected = true;
            return false;
        }
    });
    return selected;
}
function OnKeyDownPressQty(event, element) {
    const isDigit = event.charCode >= 48 && event.charCode <= 57;
    if (event.charCode == 13 || event.charCode == 8) {
        return true;
    }
    if (!isDigit) {
        return false;
    }
    const value = element.value || "";
    const selectedLength = (element.selectionEnd || 0) - (element.selectionStart || 0);
    if (selectedLength === 0 && value.length >= 5) {
        return false;
    }
    return true;
}
function sanitizeQty(element) {
    element.value = String(element.value || "").replace(/\D/g, "").slice(0, 5);
}

$(document).on("click", "#tblVendorReplacement .deleteRow", function () {
    const row = $(this).closest("tr");
    const table = document.getElementById("VendorReplacementData");
    if (table.querySelectorAll("tr").length > 1) {
        ConfrmationMaltipal(row);
    } else {
        toastr.error("At least one row is required.");
    }
});
function disableFields(disable) {
    $("#txtEntryDate, #txtRemark").prop("disabled", disable);
    $("#txtVendorName, #txtHead").prop("disabled", disable);
    initSelect2($("#txtVendorName"));
    initSelect2($("#txtHead"));
    $("#tblVendorReplacement tbody input").prop("disabled", disable);
    $("#txtCreatepage").css("pointer-events", disable ? "none" : "auto");
    $("#btnBack, #txtheaderdiv").css("pointer-events", "auto");
}
function openSelect2(selector) {
    const $el = $(selector);
    if ($el.hasClass("select2-hidden-accessible")) {
        $el.select2("open");
    }
}
function GetModuleMasterCode() {
    try {
        const Data = JSON.parse(sessionStorage.getItem('UserModuleMaster')) || [];
        const result = Data.find(item => item.ModuleDesp === "Vendor Replacement Out");
        if (result) {
            UserModuleMaster_Code = result.Code;
        }
    } catch (e) {
        UserModuleMaster_Code = 0;
    }
}
function DataExport() {
    if (!G_ListData.length) {
        toastr.error("Record not found...!");
        return;
    }
    const filteredData = G_ListData.map(row => {
        const copy = { ...row };
        delete copy.Code;
        return copy;
    });
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "VendorReplacementOut.xlsx");
}

var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_Fixparameter;
try { G_Fixparameter = JSON.parse(sessionStorage.getItem('Fixparameter')); } catch (e) { G_Fixparameter = null; }
let G_LocationModalWarehouseList = [];
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let Data = [];
function getFixParamValue(key) {
    if (!G_Fixparameter || !G_Fixparameter[0]) return '';
    const row = G_Fixparameter[0];
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    const v = row[key] != null ? row[key] : row[camelKey];
    return (v != null && String(v).trim() !== '') ? String(v).trim() : '';
}

function isWarehouseEnabled() {
    return getFixParamValue('IsWarehouseEnabled') === 'Y';
}

function clearLocationModalWarehouse() {
    const $wh = $('#ddlLocationModalWarehouse');
    if ($wh.data('select2')) {
        $wh.val('').trigger('change');
    } else {
        $wh.val('');
    }
}

function autoSelectSingleLocationModalWarehouse() {
    const $wh = $('#ddlLocationModalWarehouse');
    const options = $wh.find('option').filter(function () {
        return ($(this).val() || '').trim() !== '';
    });
    if (options.length === 1) {
        $wh.val(options.first().val()).trigger('change');
    }
}

function populateLocationModalWarehouseDropdown(list) {
    const $select = $('#ddlLocationModalWarehouse');
    if ($select.data('select2')) {
        $select.select2('destroy');
    }
    $select.empty().append('<option value="">Select Warehouse</option>');
    if (list && list.length) {
        list.forEach(function (item) {
            const code = item.Code != null ? item.Code : item.code;
            const name = item.Name != null ? item.Name
                : (item['Warehouse Name'] != null ? item['Warehouse Name'] : (item.WarehouseName || ''));
            $select.append(new Option(name, code));
        });
    }
    $select.select2({
        width: '100%',
        placeholder: 'Select Warehouse',
        allowClear: true,
        dropdownParent: $('#LocationModal')
    });
    autoSelectSingleLocationModalWarehouse();
}

function loadLocationModalWarehouseDropdown() {
    if (G_LocationModalWarehouseList.length) {
        populateLocationModalWarehouseDropdown(G_LocationModalWarehouseList);
        return $.Deferred().resolve().promise();
    }
    return $.ajax({
        url: `${appBaseURL}/api/Master/GetWareHouseDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        }
    }).done(function (response) {
        G_LocationModalWarehouseList = response || [];
        populateLocationModalWarehouseDropdown(G_LocationModalWarehouseList);
    }).fail(function () {
        $('#ddlLocationModalWarehouse').empty();
    });
}

function applyLocationModalWarehouseMode() {
    if (isWarehouseEnabled()) {
        $('#divLocationModalWarehouse').removeClass('d-none').show();
        loadLocationModalWarehouseDropdown();
    } else {
        $('#divLocationModalWarehouse').addClass('d-none').hide();
        clearLocationModalWarehouse();
    }
}

function getItemLocatorMode() {
    var el = document.querySelector('input[name="txtScan"]:checked');
    return el ? String(el.value) : '1';
}
function toggleItemLocatorInputMode() {
    var mode = getItemLocatorMode();
    var itemMode = mode === '3';
    $('#wrapperScanProduct').toggleClass('d-none', itemMode);
    $('#wrapperItemLocatorItem').toggleClass('d-none', !itemMode);
    if (itemMode) {
        $('#txtScanProduct').val('');
    } else {
        var $ddl = $('#ddlItemLocatorItem');
        if ($ddl.data('select2')) {
            $ddl.val(null).trigger('change');
        } else {
            $ddl.val('');
        }
    }
}
function esmsApplyItemLocatorScanFocus() {
    if (location.hash !== '#esms-scan-focus') return;
    if (getItemLocatorMode() === '3') return;
    var scanEl = document.getElementById('txtScanProduct');
    if (scanEl) {
        scanEl.focus();
        try { scanEl.select(); } catch (e) { }
    }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
}

$(document).ready(function () {
    $("#ERPHeading").text("Product Rack Information");
    esmsApplyItemLocatorScanFocus();
    $(window).on('hashchange', esmsApplyItemLocatorScanFocus);
    $('input[name="txtScan"]').on('change', function () {
        toggleItemLocatorInputMode();
    });
    PopulateItemLocatorItemDropdown();
    $('#ddlItemLocatorItem').on('change', function () {
        if (getItemLocatorMode() !== '3') return;
        var v = ($(this).val() || '').toString().trim();
        if (v) BoxValidationDetail();
    });
    $('#txtScanProduct').on('input', function (e) {
            BoxValidationDetail();
    });
    $('#txtScanProduct').on('focus', function (e) {
        var inputElement = this;
        setTimeout(function () {
            inputElement.setAttribute('inputmode', 'none');
        }, 2);
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    GetModuleMasterCode();
    toggleItemLocatorInputMode();
    $("#btnCreateNew").on("click", function () {
        CreateNewlocation();
    });
    $("#btnSaveLocation").on("click", function () {
        Savelocation();
    });
});

function PopulateItemLocatorItemDropdown() {
    var $ddl = $('#ddlItemLocatorItem');
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowItemMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            $ddl.empty().append('<option value="">Search by name or item code…</option>');
            if (response && response.length > 0) {
                $.each(response, function (key, val) {
                    var itemCode = val["ItemCode"] != null ? String(val["ItemCode"]).trim()
                        : (val["Item Code"] != null ? String(val["Item Code"]).trim() : '');
                    var itemName = val["ItemName"] != null ? val["ItemName"] : (val["Item Name"] != null ? val["Item Name"] : '');
                    var disp = itemName + (itemCode ? ' (' + itemCode + ')' : '');
                    var scanVal = itemCode !== '' ? itemCode : String(val["Code"]);
                    $ddl.append(new Option(disp, scanVal));
                });
            }
            if ($ddl.data('select2')) {
                $ddl.select2('destroy');
            }
            $ddl.select2({
                width: '100%',
                placeholder: 'Search item or code…',
                allowClear: true
            });
        },
        error: function (xhr, status, error) {
            console.error("ItemLocator ShowItemMaster:", error);
            toastr.error("Could not load item list.");
        }
    });
}
function BoxValidationDetail() {
    var uiMode = getItemLocatorMode();
    var apiCode = uiMode;
    var scanNo = '';
    if (uiMode === '3') {
        scanNo = ($('#ddlItemLocatorItem').val() || '').toString().trim();
        if (!scanNo) {
            toastr.error("Please select item !");
            $('#ddlItemLocatorItem').trigger('focus');
            return;
        }
    } else {
        if ($("#txtScanProduct").val() == '') {
            toastr.error("Please scan box/item !");
            $("#txtScanProduct").focus();
            return;
        }
        scanNo = $("#txtScanProduct").val();
    }
    const payload = {
        Code: apiCode,
        ScanNo: scanNo
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ShowItemDetailsOnScan`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                Data = response;
                if (response[0].Status == 'Y') {
                    $("#SuccessVoice")[0].play();
                    $("#UnloadingTable").show();
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code", "Item Bar Code"];
                    let hiddenColumns = ["Code","Msg","Status"];
                    const ColumnAlignment = {
                    };
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
                        renamedItem["Item Location"] = item["Item Location"] == '' ? `<button class="btn btn-primary icon-height mb-1"  title="Create location" onclick="CreateLocation('${item.Code}')"><i class="fa-solid fa-plus"></i></button>` : `${item["Item Location"]} <button class="btn btn-primary icon-height mb-1"  title="Edit location" onclick="EditLocation('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>`;
                      return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                    if (uiMode !== '3') {
                        $("#txtScanProduct").focus();
                    }
                } else {
                    if (uiMode === '3') {
                        $('#ddlItemLocatorItem').trigger('focus');
                    } else {
                        $("#txtScanProduct").focus();
                        $("#txtScanProduct").val("");
                    }
                    showToast(response[0].Msg);
                    $("#UnloadingTable").hide();
                }
            } else {
                if (uiMode === '3') {
                    $('#ddlItemLocatorItem').trigger('focus');
                } else {
                    $("#txtScanProduct").focus();
                    $("#txtScanProduct").val("");
                }
                $("#UnloadingTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID BOX NO !");
            $("#UnloadingTable").hide();
            if (uiMode === '3') {
                $('#ddlItemLocatorItem').trigger('focus');
            } else {
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            }
        }
    });

}
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
    }, 300);
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
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Location Master (Bin)");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}

async function CreateLocation(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    LocationList();
    applyLocationModalWarehouseMode();
    $("#hfItemCode").val(Code);
    $("#LocationModal").modal({
        backdrop: 'static',
    });
    $('#LocationModal').modal('show');
}
function ClearLocationData() {
    G_IsCheckExists = 'N';
    $("#hfItemCode").val('0'),
        $("#txtLocationName").val('')
    clearLocationModalWarehouse();
    $('#LocationModal').modal('hide');
    LocationList();
}

let G_IsCheckExists = 'N';
function Savelocation() {
    var LocationName = $("#mySelect2").val().join(", ");
    if (LocationName === '') {
        toastr.error('Please select location name !');
        $("#mySelect2").focus();
    }
    else {
        const payload = {
            Code: $("#hfItemCode").val(),
            LocationName: $("#mySelect2").val().join(", "),
            Mode: "EDIT"
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/CreateLocationFromItemMaster?UserMaster_Code=${UserMaster_Code}&IsCheckExists=${G_IsCheckExists}`,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status === 'Y') {
                    toastr.success(response[0].Msg);
                    G_IsCheckExists = 'N';
                    ClearLocationData();
                    BoxValidationDetail();
                } else if (response[0].Status === 'N') {
                    if (response[0].Msg == null) {
                        G_IsCheckExists = 'Y';
                        Savelocation();
                    } else {
                        if (confirm(`${response[0].Msg}`)) {
                            G_IsCheckExists = 'Y';
                            Savelocation();
                        }
                    }
                }
                else {
                    toastr.error(response[0].Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            }
        });

    }
}
async function LocationList() {
    try {
        const response = await $.ajax({
            url: `${appBaseURL}/api/Master/ShowLocationMaster`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            }
        });

        const $select = $('#mySelect2');
        if ($select.data('select2')) {
            $select.select2('destroy');
        }
        $select.empty();

        if (response.length > 0) {
            $.each(response, function (key, val) {
                $select.append(new Option(val["Location Name"], val.Code));
            });

            $select.select2({
                width: '100%',
                closeOnSelect: false,
                placeholder: "Select location...",
                allowClear: true,
                dropdownParent: $('#LocationModal')
            });
        } else {
            $select.empty();
        }

    } catch (error) {
        console.error("Error:", error);
    }
}
function GetLocationCodes() {
    var Code = $("#hfItemCode").val();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemLocationMaster_Code?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let codesRaw = response[0].Codes;

                if (typeof codesRaw === "string") {
                    let fixed = codesRaw.trim().replace(/^\[|\]$/g, '').replace(/'/g, '"');
                    let finalJson = "[" + fixed + "]";
                    let codes = JSON.parse(finalJson);
                    $('#mySelect2').val(codes).trigger('change');
                }
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
async function EditLocation(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    await LocationList();
    applyLocationModalWarehouseMode();
    $("#hfItemCode").val(Code);
    $("#LocationModal").modal({
        backdrop: 'static',
    });
    $('#LocationModal').modal('show');
    GetLocationCodes();
}
async function CreateNewlocation() {
    const LocationName = $("#txtLocationName").val().trim();

    if (LocationName === '') {
        toastr.error('Please enter location name !');
        $("#txtLocationName").focus();
        return;
    }

    let warehouseCode = '';
    if (isWarehouseEnabled()) {
        warehouseCode = ($("#ddlLocationModalWarehouse").val() || '').trim();
        if (!warehouseCode) {
            toastr.error('Please select Warehouse.');
            $("#ddlLocationModalWarehouse").focus();
            return;
        }
    }

    const payload = {
        Code: $("#hfItemCode").val(),
        LocationName: LocationName,
        Mode: "NEW"
    };
    if (isWarehouseEnabled()) {
        payload.WarehouseMaster_Code = warehouseCode;
    }

    try {
        const response = await $.ajax({
            url: `${appBaseURL}/api/Master/CreateLocationFromItemMaster?UserMaster_Code=${UserMaster_Code}&IsCheckExists=${G_IsCheckExists}`,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            }
        });

        if (response[0].Status === 'Y') {
            toastr.success(response[0].Msg);
            await LocationList(); // ✅ Await this
            GetLocationCodes();   // 🟡 You can await this too if it’s async
        } else {
            toastr.error(response[0].Msg);
        }

    } catch (error) {
        console.error("Error:", error.responseText || error);
        toastr.error("An error occurred while saving the data.");
    }
}
var G_ItemConfig = JSON.parse(sessionStorage.getItem('ItemConfig'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var FixParameter;
try { FixParameter = JSON.parse(sessionStorage.getItem('Fixparameter')); } catch (e) { FixParameter = null; }
function getFixParamValue(key) {
    if (!FixParameter || !FixParameter[0]) return '';
    var row = FixParameter[0];
    var camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    var v = row[key] != null ? row[key] : row[camelKey];
    return (v != null && String(v).trim() !== '') ? String(v).trim() : '';
}
function wrapDispatchAction(html) {
    return `<div class="webiz-dispatch-action-group">${(html || '').trim()}</div>`;
}
let G_CompanyCode = getFixParamValue('CompanyCode');
let G_CompanyName = getFixParamValue('CompanyName')
    || getFixParamValue('CompanyNameForShow')
    || getFixParamValue('CompanyShortName')
    || (sessionStorage.getItem('EsmsCompanyName') || '').trim();
let G_IsPickingEnable = getFixParamValue('IsPickingEnable') === 'Y';
let G_IsPSRMailOnOrderPacked = getFixParamValue('IsPSRMailOnOrderPacked') === 'Y';
let G_WorkflowTab = 'picking'; 
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
let Data = [];
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const G_UserName = sessionStorage.getItem('UserName');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
let AccountList = [];
let ItemDetail = [];
let G_OrderList = [];
let G_DispatchMaster_Code = 0;
let G_Tab = 1;
let All = 0;
let G_IDFORTRCOLOR = '';
let G_UPDATEBOX = 'N'; 
let originalDispatchData = [];
let originalTransitData = [];
let originalCompletedData = [];
let originalOrderPackingData = [];

let G_OrderMaster = [];
let G_ManualUpiDetails = [];
let G_ManualUpiItemCode = '';

$(document).ready(function () {
    DatePicker();
    GetDispatchOrderLists('GETCLIENT');
    GetOrderNoList1();
    $("#ERPHeading").text("Order Packing");
    // IsPickingEnable = Y: show Order Packing tab; rename Partial Packed → Partial Picked
    if (G_IsPickingEnable) {
        $("#orderPacking").show();
        $("#tabPartialPacked").text("Partial Picked");
    } else {
        $("#orderPacking").hide();
        $("#tabPartialPacked").text("Partial Packed");
    }
    $('#txtChallanDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtClientName").focus();
        }
    });
    $('#txtClientName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPackedBy").focus();
        }
    });
    $('#txtVehicleNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            let firstInput = $('#tblorderbooking #Orderdata tr:first input').first();
            firstInput.focus();
        }
    });
    GetAccountMasterList();
    GetModuleMasterCode();
    $("#txtClientName").on("focus", function () {
        $("#txtClientName").val("");
    });
    $("#txtClientName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtClientNameList option").each(function () {
            if ($(this).val() === value) {
                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtAddress").val("")
        }
    });
    $("#pendingOrder").click(function () {

        GetDispatchOrderLists('GETCLIENT');
        $("#txtshowhide").hide();
        $("#txtDownload").show();
        $("#txtToDate1").show();
        $("#txtDownloadDate1").show();
    });
    $("#despatchTransit").click(function () {

        GetDespatchTransitOrderList('DespatchTransit');
        $("#txtshowhide").hide();
        $("#txtDownload").hide();
        $("#txtToDate1").hide();
        $("#txtDownloadDate1").hide();
    });
    $("#orderPacking").click(function () {
        GetOrderPackingList('OrderPacking');
        $("#txtshowhide").hide();
        $("#txtDownload").hide();
        $("#txtToDate1").hide();
        $("#txtDownloadDate1").hide();
    });
    $("#completedDespatch").click(function () {

        GetCompletedDespatchOrderList('CompletedDespatch');
        $("#txtshowhide").hide();
        $("#txtDownload").show();
        $("#txtToDate1").show();
        $("#txtDownloadDate1").show();
    });
    $('#txtScanProduct').on('input', function (e) {
        if (G_IsPickingEnable && G_WorkflowTab === 'packing') {
            ScanUpdateBoxNo();
        } else if (G_UPDATEBOX == 'N') {
            SaveScanQty();
        } else {
            ScanUpdateBoxNo();
        }
    });
    applyPickingWorkflowChrome();
    $("#txtOrderNo").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        if ($(this).val() === value) {
            const item = G_OrderList.find(entry => entry.OrderNoWithPrefix == value);
            if (item.Code != undefined) {
                CreateOrderNo(item.Code);

            }
            isValid = true;
            return false;
        }
        if (!isValid) {
            $(this).val("");
        }
    });
    $("#ShowAll").click(function () {
        All = 1;
        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
    });
    //$('#txtScanProduct').on('focus', function (e) {
    //    if ($("#txtIsManual").is(':checked')) {
    //        var inputElement = this;
    //        setTimeout(function () {
    //            inputElement.setAttribute('inputmode', '');
    //        }, 2);

    //    } else {
    //        var inputElement = this;
    //        setTimeout(function () {
    //            inputElement.setAttribute('inputmode', 'none');
    //        }, 2);
    //    }
    //});
    $('#txtScanProduct').on('focus', function () {
        const inputElement = this;
        const isManual = $("#txtIsManual").is(':checked');
        setTimeout(function () {
            inputElement.setAttribute('inputmode', isManual ? '' : 'none');
        }, 2);
    });
    $('#txtScanProduct').on('blur', function () {
        $(this).attr('inputmode', '');
    });
    $("#txtSearch").on("input", function () {
        const searchValue = $(this).val().toLowerCase().trim();
        let filteredData = [];
        let updatedResponse = [];
        let StringFilterColumn = [];
        let NumericFilterColumn = [];
        let DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        let hiddenColumns = [];
        let ColumnAlignment = {};
        if (G_Tab === 1) {
            filteredData = originalDispatchData.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
            );
            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
            NumericFilterColumn = ["TOQ", "TBQ"];
            DateFilterColumn = [];
            hiddenColumns = (UserType === "A") ? ["Code"] : ["Code", "Order Date"];
            ColumnAlignment = {
                "TOQ": 'right',
                "TBQ": 'right'
            };

            updatedResponse = filteredData.map(item => ({
                ...item
                , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchPanding('${item.Code}','ORDERDETAILS')"><i class="fa-solid fa-pencil"></i></button>`)
            }));

        } else if (G_Tab === 2) {
            filteredData = originalTransitData.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
            );
            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
            NumericFilterColumn = ["Order Qty", "TDQty"];
            DateFilterColumn = ["Despatch Date"];
            hiddenColumns = (UserType === "A") ? ["Code", "D_Code"] : ["Code", "D_Code", "Dispatch Date"];
            ColumnAlignment = {
                "TDQ": 'right'
            };

            updatedResponse = filteredData.map(item => ({
                ...item
                , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchTransit('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        ${G_IsPickingEnable
                            ? `<button class="btn btn-primary icon-height mb-1"  title="Picking Complete" onclick="MarkasPickingCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>`
                            : `<button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>`}
                        ${G_IsPickingEnable ? '' : `<button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>`}
                    `)
            }));

        } else if (G_Tab === 4) {
            filteredData = originalOrderPackingData.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
            );
            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
            NumericFilterColumn = ["Order Qty", "TDQty"];
            DateFilterColumn = ["Despatch Date"];
            hiddenColumns = (UserType === "A") ? ["Code", "D_Code"] : ["Code", "D_Code", "Dispatch Date"];
            ColumnAlignment = {
                "TDQ": 'right'
            };

            updatedResponse = filteredData.map(item => ({
                ...item
                , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Order Packing" onclick="StartOrderPackingFromList('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        ${G_IsPickingEnable
                            ? `<button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>`
                            : ''}
                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
                    `)
            }));

        } else if (G_Tab === 3) {
            filteredData = originalCompletedData.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
            );

            StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
            NumericFilterColumn = ["Order Qty", "TDQ"];
            DateFilterColumn = [];
            hiddenColumns = (UserType === "A") ? ["Code", "D_Code"] : ["Code", "D_Code", "Dispatch Date"];
            ColumnAlignment = {
                "TDQ": 'right'
            };

            updatedResponse = filteredData.map(item => ({
                ...item
                , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchCompleteTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="Download" onclick="Report('${item.D_Code}')"><i class="fa-solid fa fa-download"></i></button>
                        ${G_IsPSRMailOnOrderPacked ? `<button class="btn btn-success icon-height mb-1"  title="Send Mail" onclick="CheckMailSendBeforeSend('${item.D_Code}','Send')"><i class="fa-solid fa-envelope"></i></button>` : ''}
                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
                    `)
            }));

        }
        if (filteredData.length === 0) {
            $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
            return;
        }
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment
        );
    });
    $('#txtManualProductQuantity').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtManualProductMRP").focus();
        }
    });
    $('#txtManualProductMRP').on('keydown', function (e) {
        if (e.key === "Enter") {
            SaveManual();
        }
    });
    $('#txtManualUpiSearch').on('input', function () {
        FilterManualUpiGrid();
    });
});
function BackMaster() {
    G_IDFORTRCOLOR = '';
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    disableFields(false);
    $("#btnShowAll").hide();
    $("#txtOrderNo").prop("disabled", true);
    $("#txtScanProduct").prop("disabled", false);
    // Reset workflow from parameter + current list tab (not sticky previous edit mode)
    applyPickingWorkflowChrome();
    if (G_Tab == 3) {
        GetCompletedDespatchOrderList('CompletedDespatch');
    }
    if (G_Tab == 4) {
        GetOrderPackingList('OrderPacking');
    }
    if (G_Tab == 2) {
        GetDespatchTransitOrderList('DespatchTransit');
    }
    if (G_Tab == 1) {
        GetDispatchOrderLists('GETCLIENT');
    }
}
function syncWorkflowFromListTab() {
    if (!G_IsPickingEnable) {
        G_WorkflowTab = 'picking';
        return;
    }
    if (G_Tab == 4 || G_Tab == 3) {
        G_WorkflowTab = 'packing';
    } else {
        G_WorkflowTab = 'picking';
    }
}
function applyPickingWorkflowChrome(syncFromTab) {
    if (syncFromTab !== false) {
        syncWorkflowFromListTab();
    }
    // Parameter off: keep OLD behavior — Box No visible, normal scan via SaveScanQty (G_UPDATEBOX=N)
    // Only Edit Box No screen uses G_UPDATEBOX=Y → ScanUpdateBoxNo
    if (!G_IsPickingEnable) {
        $("#dvBoxNoField").show();
        $("#dvManualBoxNoField").show();
        if ($("#tab1").text() === "Edit BoxNo") {
            G_UPDATEBOX = 'Y';
        } else {
            G_UPDATEBOX = 'N';
        }
        return;
    }
    // Parameter on: Box No by list tab (picking hide / packing show)
    if (G_WorkflowTab === 'picking') {
        G_UPDATEBOX = 'N';
        $("#dvBoxNoField").hide();
        $("#dvManualBoxNoField").hide();
        $("#txtBoxNo").val(0);
        $("#txtManualBoxNo").val(0);
    } else {
        G_UPDATEBOX = 'Y';
        $("#dvBoxNoField").show();
        $("#dvManualBoxNoField").show();
        ensureOrderPackingBoxNoDefault();
    }
}
function SwitchDispatchWorkflowTab(tab, skipReload) {
    if (!G_IsPickingEnable) return;
    G_WorkflowTab = (tab === 'packing') ? 'packing' : 'picking';
    applyPickingWorkflowChrome(false);

    if (G_WorkflowTab === 'picking') {
        if (!skipReload && G_DispatchMaster_Code > 0) {
            reloadDispatchDetailGrid();
        } else if (!skipReload && $("#hfCode").val() && $("#hfCode").val() !== '0') {
            reloadDispatchDetailGrid();
        }
    } else {
        // Order Packing uses same DDETAILS grid as edit/view (not BOXDETAILS)
        if (!skipReload && G_DispatchMaster_Code > 0) {
            reloadDispatchDetailGrid();
        } else if (!skipReload) {
            toastr.info("Pick items first, then open Packing to assign Box No.");
        }
    }
    $("#txtScanProduct").focus();
}
function reloadDispatchDetailGrid() {
    var code = $("#hfCode").val();
    if (!code || code === '0') return;
    if (G_Tab == 1) {
        StartDispatchPanding(code, "ORDERDETAILS");
    } else if (G_Tab == 2 || G_Tab == 4) {
        StartDispatchTransit(code, G_DispatchMaster_Code, All == 1 ? "AllDDETAILS" : "DDETAILS");
    } else if (G_Tab == 3) {
        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
    }
}
function GetOrderPackingList(Mode) {
    $("#txtSearch").val("");
    G_Tab = 4;
    G_WorkflowTab = 'packing';
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                originalOrderPackingData = response;
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No", "Status"];
                const NumericFilterColumn = ["Order Qty", "TDQty"];
                const DateFilterColumn = ["Despatch Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = [];
                if (UserType == "A") {
                    hiddenColumns = ["Code", "D_Code"];
                } else {
                    hiddenColumns = ["Code", "D_Code", "Dispatch Date"];
                }
                const ColumnAlignment = {
                    "TDQ": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Order Packing" onclick="StartOrderPackingFromList('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        ${G_IsPickingEnable
                            ? `<button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>`
                            : ''}
                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
                    `)
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                originalOrderPackingData = [];
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}

async function StartOrderPackingFromList(Code, DispatchMaster_Code, Mode) {
    G_Tab = 4;
    G_WorkflowTab = 'packing';
    // IsPickingEnable=Y → "Start packing"; else → "Edit"
    const optionName = G_IsPickingEnable ? 'Start packing' : 'Edit';
    const { hasPermission, msg } = await CheckOptionPermission(optionName, UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    await StartDispatchTransit(Code, DispatchMaster_Code, Mode, true);
    ensureOrderPackingBoxNoDefault();
}
function isPickingMode() {
    return G_IsPickingEnable && G_WorkflowTab === 'picking';
}
function isPackingMode() {
    return G_IsPickingEnable && G_WorkflowTab === 'packing';
}
function getWorkflowBoxNo() {
    if (isPickingMode()) return 0;
    return $("#txtBoxNo").val();
}
function ensureOrderPackingBoxNoDefault() {
    if (G_Tab != 4 && !isPackingMode()) return;
    var n = parseInt($("#txtBoxNo").val(), 10);
    if (!n || n < 1) {
        $("#txtBoxNo").val(1);
    }
    var m = parseInt($("#txtManualBoxNo").val(), 10);
    if (!m || m < 1) {
        $("#txtManualBoxNo").val(1);
    }
}
function GetAccountMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetAccountIsClientDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                AccountList = response;
                $('#txtClientNameList').empty();
                let options = '';
                options += '<option value="All" text="0"></option>';
                response.forEach(item => {
                    options += '<option value="' + item.AccountName + '" text="' + item.Code + '"></option>';
                });
                $('#txtClientNameList').html(options);
            } else {
                $('#txtClientNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtClientNameList').empty();
        }
    });
}
function ClearData() {
    G_DispatchMaster_Code = 0;
    All = 0;
    $("#hfCode").val("0");
    $("#txtChallanNo").val("");
    $("#txtScanProduct").val("");
    $("#txtClientDispatchName").val("");
    $("#tblDispatchData").hide();
    $("#txtScanProduct").attr('inputmode', '');
    SelectOptionByText('txtOrderNo', 'Select');
}
function OnChangeNumericTextBox(element) {

    element.value = element.value.replace(/[^0-9]/g, "");
    if (Number.isInteger(parseInt(element.value)) == true) {
        element.setCustomValidity("");

    } else {
        element.setCustomValidity("Only allowed Numbers");
    }
    element.reportValidity();
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
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Order Packing");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function setupDateInputFormatting() {
    $('#txtChallanDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);
        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtChallanDate').val('');

        }
    } else {
        $('#txtChallanDate').val('');

    }
}
function convertToUppercase(element) {
    element.value = element.value.toUpperCase();
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchOrderList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                ExportData(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function ExportData(jsonData) {
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
    XLSX.writeFile(wb, "DispatchOrder.xlsx");
}
function ScanItemForDispatch() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    const payload = {
        Code: $("#hfCode").val(),
        ScanNo: $("#txtScanProduct").val(),
        UserMaster_Code: UserMaster_Code
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                StartDispatch($("#hfCode").val())
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else if (response[0].Status == 'N') {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            } else {
                showToast(response[0].Msg);
                $("#txtScanProduct").focus();
                $("#txtScanProduct").val("");
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").focus();
            $("#txtScanProduct").val("");
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
    }, 3000);
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
function GetDispatchOrderLists(Mode) {
    $("#txtSearch").val("");
    G_Tab = 1;
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                originalDispatchData = response;
                G_OrderMaster = response[0]["Order Date"];
                let Date = G_OrderMaster;
                DatePickerForDownloadOld(Date);
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No"];
                const NumericFilterColumn = ["TOQ", "TBQ"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = [];
                if (UserType == "A") {
                    hiddenColumns = ["Code"];
                } else {
                    hiddenColumns = ["Code", "Order Date"];
                }
                const ColumnAlignment = {
                    "TOQ": 'right',
                    "TBQ": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Create Dispatch" onclick="StartDispatchPanding('${item.Code}','ORDERDETAILS')"><i class="fa-solid fa-pencil"></i></button>`)
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                $("#DataTable").hide();
                toastr.error("Record not found...!");
                originalDispatchData = [];
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            originalDispatchData = [];
            unblockUI();
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
            var apiDateRaw = null;
            if (response && response.length > 0 && response[0] && response[0].Date) {
                apiDateRaw = response[0].Date;
            }

            var apiDate = DatePickerForDownloadDate(apiDateRaw);
            var challanDate = DatePickerForDownloadOld(Data);
            var $challan = $('#txtChallanDate');
            var $to = $('#txtToDate');

            try { $challan.datepicker('destroy'); } catch (e) { }
            try { $to.datepicker('destroy'); } catch (e) { }

            var minDate = challanDate;

            $challan.datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
                startDate: minDate
            });

            $to.datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
                startDate: minDate
            });

            if (apiDate) {
                $challan.datepicker('setDate', apiDate);
            }
            if (challanDate) {
                $to.datepicker('setDate', challanDate);
            }
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}

async function StartDispatchPanding(Code, Mode, skipPermissionCheck) {
    if (G_DispatchMaster_Code === 0) {
        //GetUserNameList();
    }
    G_Tab = 1;
    $("#btnShowAll").hide();
    if (!skipPermissionCheck) {
        const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission == false) {
            toastr.error(msg);
            return;
        }
    }
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#dvIsDelete").hide();
    applyPickingWorkflowChrome();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtPackedBy").val(G_UserName);
                    $("#txtBoxNo").val(isPickingMode() ? 0 : (OrderMaster.BoxNo || 1));
                    GetTotalLineOfPart(OrderMaster.Code);
                }
                applyPickingWorkflowChrome();
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Order Quantity": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Balance Quantity": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
						"Manual Qty": "right;width:70px;",
						"MRP": "right;min-width:120px;width:120px;",
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = Response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
						renamedItem["MRP"] = ` <input type="text" id="txtMRPQty_${item.Code}" value="${item["MRP"] == "NULL" ? "" : item["MRP"]}" data-old-mrp="${item["MRP"] == "NULL" ? "" : item["MRP"]}" onkeypress="return OnChangeNumericTextBox(event,this);" onkeyup="if(event.key==='Enter') OpenManualForMRP(this,'${item["Item Code"]}', ${item["Bal Qty"]});" onfocusout="OpenManualForMRP(this,'${item["Item Code"]}', ${item["Bal Qty"]});" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="MRP..">`;
                        renamedItem["Scan Qty"] = `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" readonly onclick="ManualUpdateQtyAndMRP('${item["Item Code"]}', ${item["Bal Qty"]}, ${item["MRP"] == "NULL" ? 0 : item["MRP"]})" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`;
                        renamedItem["Manual Qty"] = `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                            renamedItem["Packing Qty"] = `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
                        renamedItem["Action"] = item["ROWSTATUS"] == 'RED' ? '' : `<button class="btn btn-danger icon-height mb-1"  title="Delete item qty" onclick="DeleteItemQty('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function checkValidateqty(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
        $("#txtManualQty_" + Code).focus();
    } else {
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqty1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
    } else {
        if ($("#txtBoxNo").val() === '') {
            toastr.error("Please enter box no..!");
            StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
            return;
        }
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            G_IDFORTRCOLOR = "txtDispatchQty_" + Code;
            SaveNewManualQty(Code, scanQty, manualQty, total);
        }
    }
}
function OnChangeNumericTextBox(event, element) {
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
function SaveEditManualQty(Code, ScanQty, ManualQty, DispatchQty) {
    if ($("#txtBoxNo").val() === '') {
        toastr.error("please enter box no..!");
        return;
    }
    const payload = {
        Code: Code,
        DispatchMaster_Code: G_DispatchMaster_Code,
        ScanNo: "",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        DispatchQty: DispatchQty,
        UserMaster_Code: UserMaster_Code,
        PackedBy: ''
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch?Mode=Edit`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                if (G_Tab == 2 || G_Tab == 4) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3) {
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
                G_IDFORTRCOLOR = 'GET';
            } else {
                showToast(response[0].Msg);
                if (G_Tab == 2 || G_Tab == 4) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3) {
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
                G_IDFORTRCOLOR = 'GET';
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function SaveNewManualQty(Code, ScanQty, ManualQty, DispatchQty) {
    if ($("#txtBoxNo").val() === '') {
        toastr.error("please enter box no..!");
        return;
    }
    const payload = {
        Code: Code,
        DispatchMaster_Code: G_DispatchMaster_Code,
        ScanNo: "",
        ScanQty: ScanQty,
        ManualQty: ManualQty,
        DispatchQty: DispatchQty,
        UserMaster_Code: UserMaster_Code,
        PackedBy: ''
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ManualItemForDispatch?Mode=New`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
                StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                G_IDFORTRCOLOR = 'GET';
            } else {
                showToast(response[0].Msg);
                StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                G_IDFORTRCOLOR = 'GET';
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function SaveScanQty() {
    if (isPackingMode()) {
        ScanUpdateBoxNo();
        return;
    }
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    }
    var boxNo = getWorkflowBoxNo();
    if (!isPickingMode() && (boxNo === '' || boxNo === null || boxNo === undefined)) {
        toastr.error("Please enter box no..!");
        return;
    }
    if (isPickingMode()) {
        boxNo = 0;
    }
    const payload = {
        Code: $("#hfCode").val(),
        ScanNo: $("#txtScanProduct").val(),
        ScanQty: 0,
        ManualQty: 0,
        DispatchQty: 0,
        DispatchMaster_Code: G_DispatchMaster_Code,
        UserMaster_Code: UserMaster_Code,
        PackedBy: '',
        BoxNo: boxNo
    }
    var scanMode = isPickingMode() ? 'PICK' : 'Scan';
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/ScanItemForDispatch?Mode=${scanMode}`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
                $("#SuccessVoice")[0].play();
                if (G_Tab == 1) {
                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                }
                else if (G_Tab == 2 || G_Tab == 4) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3) {
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
                G_IDFORTRCOLOR = 'GET';
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
                unblockUI();
                if (G_IsPSRMailOnOrderPacked) {
                    SendPSRReportMail(G_DispatchMaster_Code);
                }
            } else if (response[0].Status == 'N') {
                G_IDFORTRCOLOR = '';
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
                unblockUI();
            } else {
                G_IDFORTRCOLOR = '';
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
                unblockUI();
            }
        },
        error: function (xhr, status, error) {
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("");
            $("#txtScanProduct").focus();
            unblockUI();
        }
    });

}

async function StartDispatchTransit(Code, DispatchMaster_Code, Mode, skipPermissionCheck) {
    G_DispatchMaster_Code = DispatchMaster_Code;
    // Preserve Order Packing list tab (G_Tab=4); otherwise treat as Partial Packed
    if (G_Tab !== 4) {
        G_Tab = 2;
    }
    $("#hfCode").val(Code);
    var Code1 = Code;
    if (!skipPermissionCheck) {
        const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission == false) {
            toastr.error(msg);
            return;
        }
    }
    $("#tab1").text("Edit");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#dvIsDelete").hide();
    // Order Packing: always hide SHOW ALL; Partial Packed: always show it
    if (G_Tab == 4) {
        $("#btnShowAll").hide();
    } else {
        $("#btnShowAll").show();
    }
    applyPickingWorkflowChrome();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code1}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];

                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtChallanDate").val(OrderMaster.ChallanDate || "");
                    $("#txtPackedBy").val(OrderMaster.PackedBy);
                    $("#txtBoxNo").val(isPickingMode() ? 0 : (OrderMaster.BoxNo || 1));
                    ensureOrderPackingBoxNoDefault();
                    $("#txtScanProduct").prop("disabled", false);
                    GetTotalLineOfPart(OrderMaster.Code);
                    disableFields(false);
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code', G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name'];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Order Quantity": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Balance Quantity": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
						"Manual Qty": "right;width:70px;",
						"MRP": "right;min-width:120px;width:120px;",
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = Response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
						renamedItem["MRP"] = ` <input type="text" id="txtMRPQty_${item.Code}" value="${item["MRP"] == "NULL" ? "" : item["MRP"]}" data-old-mrp="${item["MRP"] == "NULL" ? "" : item["MRP"]}" onkeypress="return OnChangeNumericTextBox(event,this);" onkeyup="if(event.key==='Enter') OpenManualForMRP(this,'${item["Item Code"]}', ${item["Bal Qty"]});" onfocusout="OpenManualForMRP(this,'${item["Item Code"]}', ${item["Bal Qty"]});" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="MRP..">`;
                        renamedItem["Scan Qty"] = `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" onclick="ManualUpdateQtyAndMRP('${item["Item Code"]}', ${item["Bal Qty"]}, ${item["MRP"] == "NULL" ? 0 : item["MRP"]})" readonly class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                            renamedItem["Manual Qty"] = `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqty(this,${item.Code});" onfocusout="checkValidateqty1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                            renamedItem["Packing Qty"] = `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
                        renamedItem["Action"] = item["ROWSTATUS"] == 'RED' ? '' : `<button class="btn btn-danger icon-height mb-1"  title="Delete item qty" onclick="DeleteItemQty('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
                        return renamedItem;

                        //const updatedResponse = Response.map(item => ({
                        //    ...item,
                        //    "Scan Qty": `
                        //    <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                        //    "Manual Qty": `
                        //    <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyTransit(this,${item.Code});" onfocusout="checkValidateqtyTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                        //    "Packing Qty": `
                        //    <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`,
                    });
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function checkValidateqtyTransit(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        if (All == 0) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
        } else if (All == 1) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
        }
        $("#txtManualQty_" + Code).focus();
    } else {
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqtyTransit1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        if (All == 0) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
        } else if (All == 1) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
        }
    } else {
        if ($("#txtBoxNo").val() === '') {
            toastr.error("Please enter box no..!");
            if (All == 0) {
                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
            } else if (All == 1) {
                StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
            }
            return;
        }
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveEditManualQty(Code, scanQty, manualQty, total);
        }
    }
}
function GetDespatchTransitOrderList(Mode) {
    $("#txtSearch").val("");
    G_Tab = 2;
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                originalTransitData = response;
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No","Status"];
                const NumericFilterColumn = ["Order Qty", "TDQty"];
                const DateFilterColumn = ["Despatch Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                let hiddenColumns = [];
                if (UserType == "A") {
                    hiddenColumns = ["Code", "D_Code"];
                } else {
                    hiddenColumns = ["Code", "D_Code", "Dispatch Date"];
                }
                const ColumnAlignment = {
                    "TDQ": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchTransit('${item.Code}','${item.D_Code}','DDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','DDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        ${G_IsPickingEnable
                            ? `<button class="btn btn-primary icon-height mb-1"  title="Picking Complete" onclick="MarkasPickingCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>`
                            : `<button class="btn btn-primary icon-height mb-1"  title="Mark As Compete" onclick="MarkasCompete('${item.D_Code}')"><i class="fa fa-check"></i></button>`}
                        ${G_IsPickingEnable ? '' : `<button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>`}
                    `)
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                originalTransitData = [];
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });

}
function GetCompletedDespatchOrderList(Mode) {
    $("#txtSearch").val("");
    G_Tab = 3;
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetClientWiseShowOrder?Mode=${Mode}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                originalCompletedData = response;
                $("#DataTable").show();
                const StringFilterColumn = ["Challan No", "Client Name", "Vehicle No", "Order No", "BuyerPO No","Status"];
                const NumericFilterColumn = ["Order Qty", "TDQ"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];

                let hiddenColumns = [];
                if (UserType == "A") {
                    hiddenColumns = ["Code", "D_Code"];
                } else {
                    hiddenColumns = ["Code", "D_Code", "Dispatch Date"];
                }
                const ColumnAlignment = {
                    "TDQ": 'right'
                };
                const updatedResponse = response.map(item => ({
                    ...item
                    , Action: wrapDispatchAction(`<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="StartDispatchCompleteTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteItem('${item.D_Code}','${item[`Order No`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="View" onclick="ViewDespatchTransit('${item.D_Code}','CDETAILS')"><i class="fa-solid fa fa-eye"></i></button>
                        <button class="btn btn-primary icon-height mb-1"  title="Download" onclick="Report('${item.D_Code}')"><i class="fa-solid fa fa-download"></i></button>
                        ${G_IsPSRMailOnOrderPacked ? `<button class="btn btn-success icon-height mb-1"  title="Send Mail" onclick="CheckMailSendBeforeSend('${item.D_Code}','Send')"><i class="fa-solid fa-envelope"></i></button>` : ''}
                        <button class="btn btn-info icon-height mb-1"  title="Update Box No" onclick="ShowUpdateBoxNo('${item.D_Code}','BOXDETAILS')"><i class="fa-solid fa fa-box"></i></button>
                    `)
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            } else {
                originalCompletedData = [];
                $("#DataTable").hide();
                toastr.error("Record not found...!");
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });

}

async function StartDispatchCompleteTransit(Code, Mode, skipPermissionCheck) {
    G_DispatchMaster_Code = Code;
    G_Tab = 3;
    $("#btnShowAll").hide();
    if (!skipPermissionCheck) {
        const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
        if (hasPermission == false) {
            toastr.error(msg);
            return;
        }
    }
    $("#tab1").text("Edit");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#dvIsDelete").hide();
    applyPickingWorkflowChrome();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtPackedBy").val(OrderMaster.PackedBy);
                    $("#txtScanProduct").prop("disabled", false);
                    $("#txtBoxNo").val(isPickingMode() ? 0 : (OrderMaster.BoxNo || 1));
                    GetTotalLineOfPart(OrderMaster.Code);
                    disableFields(false);
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Ord Qty", "Bal Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = [G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name', G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code'];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Order Quantity": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Balance Quantity": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
						"Manual Qty": "right;width:70px;",
						"MRP": "right;min-width:120px;width:120px;",
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = Response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
						renamedItem["MRP"] = ` <input type="text" id="txtMRPQty_${item.Code}" value="${item["MRP"] == "NULL" ? "" : item["MRP"]}" data-old-mrp="${item["MRP"] == "NULL" ? "" : item["MRP"]}" onkeypress="return OnChangeNumericTextBox(event,this);" onkeyup="if(event.key==='Enter') OpenManualForMRP(this,'${item["Item Code"]}', ${item["Bal Qty"]});" onfocusout="OpenManualForMRP(this,'${item["Item Code"]}', ${item["Bal Qty"]});" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="MRP..">`;
                        renamedItem["Scan Qty"] = `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" onclick="ManualUpdateQtyAndMRP('${item["Item Code"]}', ${item["Bal Qty"]}, ${item["MRP"] == "NULL" ? 0 : item["MRP"]})" readonly class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                            renamedItem["Manual Qty"] = `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyCompleteTransit(this,${item.Code});" onfocusout="checkValidateqtyCompleteTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                            renamedItem["Packing Qty"] = `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
                        renamedItem["Action"] = item["ROWSTATUS"] == 'RED' ? '' : `<button class="btn btn-danger icon-height mb-1"  title="Delete item qty" onclick="DeleteItemQty('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function checkValidateqtyCompleteTransit(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
        $("#txtManualQty_" + Code).focus();
    } else {
        var currentRow = $(element).closest("tr");
        var nextRow = currentRow.next("tr");

        if (nextRow.length > 0) {
            var nextInput = nextRow.find(".txtManualQty").first();
            if (nextInput.length > 0) {
                nextInput.focus();
            }
        }
    }
}
function checkValidateqtyCompleteTransit1(element, Code) {
    var manualQty = parseInt($(element).val());
    var scanQty = parseInt($("#txtScanQty_" + Code).val());

    const item = Data.find(entry => entry.Code == Code);
    var total = scanQty + manualQty;

    if (total > parseInt(item["Bal Qty"])) {
        toastr.error("Invalid Packing Qty!");
        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
    } else {
        if ($("#txtBoxNo").val() === '') {
            toastr.error("Please enter box no..!");
            StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
            return;
        }
        $("#txtDispatchQty_" + Code).val(total);
        if (manualQty > 0) {
            SaveEditManualQty(Code, scanQty, manualQty, total);
        }
    }
}

async function StartDispatchOrderNo() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    ClearData();
    G_Tab = 1;
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtOrderNo").prop("disabled", false);
    $("#txtScanProduct").prop("disabled", false);
    $("#dvIsDelete").hide();
    disableFields(false);
    applyPickingWorkflowChrome();
}
function CreateOrderNo(Code) {
    StartDispatchPanding(Code, "ORDERDETAILS");
    //GetUserNameList();
}
function GetOrderNoList1() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetOrderNoList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            G_OrderList = response;
            if (response.length > 0) {
                let option = '<option value="">Select</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["OrderNoWithPrefix"] + '">' + val["OrderNoWithPrefix"] + '</option>';
                });

                $('#txtOrderNo')[0].innerHTML = option;
                $('#txtOrderNo')[0].innerHTML = option;

                $('#txtOrderNo').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#txtOrderNo').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtOrderNoList').empty();
        }
    });

}

async function ViewDespatchTransit(Code, Mode) {
    G_DispatchMaster_Code = Code;
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("View");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#dvIsDelete").hide();
    applyPickingWorkflowChrome();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtChallanDate").val(OrderMaster.ChallanDate || "");
                    $("#txtPackedBy").val(OrderMaster.PackedBy);
                    $("#txtBoxNo").val(isPickingMode() ? 0 : (OrderMaster.BoxNo || 1));
                    ensureOrderPackingBoxNoDefault();
                    GetTotalLineOfPart(OrderMaster.Code);
                    $("#txtScanProduct").prop("disabled", true);
                    disableFields(true);
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Order Quantity", "Balance Quantity"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Ord Qty": "right;width:30px;",
                        "Order Quantity": "right;width:30px;",
                        "Bal Qty": "right;width:30px;",
                        "Balance Quantity": "right;width:30px;",
                        "Scan Qty": "right;width:70px;",
                        "Packing Qty": "right;width:70px;",
                        "Manual Qty": "right;width:70px;",
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = Response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
                        renamedItem["Scan Qty"] = `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`,
                            renamedItem["Manual Qty"] = `
                        <input type="text" id="txtManualQty_${item.Code}" onkeypress="return OnChangeNumericTextBox(event,this);" disabled value="${item["Manual Qty"]}" onkeyup="if(event.key === 'Enter') checkValidateqtyTransit(this,${item.Code});" onfocusout="checkValidateqtyTransit1(this,${item.Code});" class="box_border form-control form-control-sm text-right BizSolFormControl txtManualQty" autocomplete="off" placeholder="Manual Qty..">`,
                            renamedItem["Packing Qty"] = `
                        <input type="text" id="txtDispatchQty_${item.Code}" value="${item["Packing Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Packing Qty..">`;
                        return renamedItem;

                    });
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}

async function DeleteItem(code, Order, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'DispatchMaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this Despatch ${Order} .?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/DeleteDispatchOrder?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    if (G_Tab == 2) {
                        GetDespatchTransitOrderList('DespatchTransit');
                    } else if (G_Tab == 4) {
                        GetOrderPackingList('OrderPacking');
                    } else if (G_Tab == 3) {
                        GetCompletedDespatchOrderList('CompletedDespatch');
                    }
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

async function MarkasCompete(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Complete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetMarkasCompeteByOrderNo?Code=${code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                if (G_Tab == 4) {
                    GetOrderPackingList('OrderPacking');
                } else {
                    GetDespatchTransitOrderList('DespatchTransit');
                }
            } else {
                toastr.error(response.Msg || "Unexpected response format.");
            }

        },
        error: function (xhr, status, error) {
            toastr.error("Error marking as complete.");

        }
    });
}

async function MarkasPickingCompete(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Picking Complete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetMarkasPickingCompeteByOrderNo?Code=${code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                GetDespatchTransitOrderList('DespatchTransit');
            } else {
                toastr.error(response.Msg || "Unexpected response format.");
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Error marking picking complete.");
        }
    });
}
function disableFields(disable) {
    $("#txtCreatepage").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
function changeValue(delta) {
    $("#BoxNoVoice")[0].play();
    const input = document.getElementById('txtBoxNo');
    let value = parseInt(input.value) || 1;
    value += delta;
    if (value < 1) value = 1;
    input.value = value;
}
function ManualChangeValue(delta) {
    $("#BoxNoVoice")[0].play();
    const input = document.getElementById('txtManualBoxNo');
    let value = parseInt(input.value) || 1;
    value += delta;
    if (value < 1) value = 1;
    input.value = value;
}
function getDispatchGridColumnIndex(headerText) {
    let idx = -1;
    const want = String(headerText || '').trim().toLowerCase();
    document.querySelectorAll('#DispatchTable-Header th').forEach((th, i) => {
        if ((th.textContent || '').trim().toLowerCase() === want) idx = i;
    });
    return idx;
}
function getRowBoxNoValue(row, boxNoIdx) {
    if (boxNoIdx >= 0) {
        const cell = row.querySelectorAll('td')[boxNoIdx];
        if (cell) {
            const input = cell.querySelector('input');
            const raw = input ? input.value : cell.textContent;
            const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
            return isNaN(n) ? 0 : n;
        }
    }
    const codeEl = row.querySelector('[id^="txtScanQty_"], [id^="txtDispatchQty_"], [id^="txtBoxNo_"]');
    if (codeEl && typeof Data !== 'undefined' && Array.isArray(Data)) {
        const code = codeEl.id.split('_').pop();
        const item = Data.find(d => String(d.Code) === String(code));
        if (item) {
            const n = parseInt(item["Box No"], 10);
            return isNaN(n) ? 0 : n;
        }
    }
    return 0;
}
function ChangecolorTr() {
    const rows = document.querySelectorAll('#DispatchTable-Body tr');
    if (!rows.length) return;

    // Order Packing: current/packed rows green when Box No > 0, others red (same colors as other tabs)
    if (G_Tab == 4) {
        const boxNoIdx = getDispatchGridColumnIndex('Box No');
        rows.forEach((row) => {
            const boxVal = getRowBoxNoValue(row, boxNoIdx);
            row.style.backgroundColor = boxVal > 0 ? '#07bb72' : '#f5c0bf';
        });
        return;
    }

    if (G_UPDATEBOX == 'N') {
        rows.forEach((row) => {
            const tds = row.querySelectorAll('td');
            const columnValue = tds[11]?.textContent.trim();
            if (columnValue === 'GREEN') {
                row.style.backgroundColor = '#07bb72';

            } else if (columnValue === 'YELLOW') {
                row.style.backgroundColor = '#ebb861';

            } else {
                row.style.backgroundColor = '#f5c0bf';
            }
        });
    }
}

setInterval(ChangecolorTr, 100);
function DispatchReport() {
    var Code = $("#hfDownloadCode").val();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchReport?Code=${Code}`,
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

async function ShowUpdateBoxNo(Code, Mode) {
    G_DispatchMaster_Code = Code;
    G_Tab = 3;
    $("#btnShowAll").hide();
    const { hasPermission, msg } = await CheckOptionPermission('EDITBOXNO', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("Edit BoxNo");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#dvIsDelete").show();
    G_UPDATEBOX = 'Y';
    applyPickingWorkflowChrome();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=${Mode}&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || "");
                    SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || "");
                    $("#txtScanProduct").prop("disabled", false);
                    GetTotalLineOfPart(OrderMaster.Code);
                    disableFields(false);
                    G_UPDATEBOX = 'Y';
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Ord Qty", "Bal Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Box No": "right;width:70px;",
                        "Scan Qty": "right;width:70px;",
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = Response.map(item => {
                        const renamedItem = {};

                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }

                        renamedItem["Scan Qty"] = `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`;
                        renamedItem["Box No"] = `
                        <input type="text" onfocusout="UpdateBoxNo(this,${item.Code})" oninput="NumericValue(this)" id="txtBoxNo_${item.Code}" value="${item["Box No"]}" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Box No..">`;
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

                } else {
                    $("#tblDispatchData").hide();
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}
function NumericValue(e) {
    if (/\D/g.test(e.value)) e.value = e.value.replace(/[^0-9]/g, '')
}
function UpdateBoxNo(e, Code) {
    var value = $("#txtBoxNo_" + Code).val();
    if (value == '0' || value == '') {
        toastr.error("please enter valid box no.");
        return;
    }
    const payload = {
        Code: Code,
        ScanNo: "",
        BoxNo: value
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateBoxNo?Mode=Manual`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                toastr.success(response[0].Msg);
                refreshGridAfterBoxNoUpdate();
            } else {

            }
        },
        error: function (xhr, status, error) {
            toastr.error("Error in Api/UpdateBoxNo");
        }
    });
}
function ScanUpdateBoxNo() {
    if ($("#txtScanProduct").val() == '') {
        toastr.error("Please scan product !");
        $("#txtScanProduct").focus();
        return;
    } else if ($("#txtBoxNo").val() === '' || $("#txtBoxNo").val() === '0') {
        toastr.error("Please enter box no..!");
        return;
    }
    if (G_DispatchMaster_Code <= 0) {
        toastr.error("No picked items found. Complete Picking first.");
        return;
    }
    const payload = {
        Code: G_DispatchMaster_Code,
        ScanNo: $("#txtScanProduct").val(),
        BoxNo: $("#txtBoxNo").val()
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateBoxNo?Mode=SCAN`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                $("#SuccessVoice")[0].play();
                G_IDFORTRCOLOR = 'GET';
                refreshGridAfterBoxNoUpdate();
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            } else if (response[0].Status == 'N') {
                G_IDFORTRCOLOR = '';
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            } else {
                G_IDFORTRCOLOR = '';
                showToast(response[0].Msg);
                $("#txtScanProduct").val("");
                $("#txtScanProduct").focus();
            }
        },
        error: function (xhr, status, error) {
            G_IDFORTRCOLOR = '';
            showToast("INVALID SCAN NO !");
            $("#txtScanProduct").val("");
            $("#txtScanProduct").focus();
        }
    });
}
function refreshGridAfterBoxNoUpdate() {
    if ($("#tab1").text() === "Edit BoxNo") {
        ShowUpdateBoxNo(G_DispatchMaster_Code, "BOXDETAILS");
        return;
    }
    reloadDispatchDetailGrid();
}
function LoadPickedItemsForPacking(Code) {
    if (!Code || Code <= 0) {
        toastr.info("Pick items first, then open Packing to assign Box No.");
        return;
    }
    G_DispatchMaster_Code = Code;
    G_UPDATEBOX = 'Y';
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetOrderDetailsForDispatch?Code=${Code}&Mode=BOXDETAILS&DispatchMaster_Code=${G_DispatchMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                if (response.OrderMaster && response.OrderMaster.length > 0) {
                    const OrderMaster = response.OrderMaster[0];
                    $("#hfCode").val(OrderMaster.Code || $("#hfCode").val() || "");
                    if (OrderMaster.OrderNo) {
                        SelectOptionByText('txtOrderNo', OrderMaster.OrderNo);
                    }
                    $("#txtClientDispatchName").val(OrderMaster.AccountName || $("#txtClientDispatchName").val() || "");
                    $("#txtChallanNo").val(OrderMaster.ChallanNo || $("#txtChallanNo").val() || "");
                    $("#txtScanProduct").prop("disabled", false);
                    if (OrderMaster.Code) {
                        GetTotalLineOfPart(OrderMaster.Code);
                    }
                }
                if (response.OrderDetial && response.OrderDetial.length > 0) {
                    $("#tblDispatchData").show();
                    var Response = response.OrderDetial;
                    Data = response.OrderDetial;
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Ord Qty", "Bal Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code"];
                    let hiddenColumns = [];
                    if (UserType == "A") {
                        hiddenColumns = ["Code", "ROWSTATUS", "Manual Qty"];
                    } else {
                        hiddenColumns = ["Code", "Manual Qty", "ROWSTATUS"];
                    }
                    const ColumnAlignment = {
                        "Box No": "right;width:70px;",
                        "Scan Qty": "right;width:70px;",
                    };
                    const renameMap = {
                        "Item Name": G_ItemConfig[0].ItemNameHeader ? G_ItemConfig[0].ItemNameHeader : 'Item Name',
                        "Item Code": G_ItemConfig[0].ItemCodeHeader ? G_ItemConfig[0].ItemCodeHeader : 'Item Code',
                    };
                    const updatedResponse = Response.map(item => {
                        const renamedItem = {};
                        for (const key in item) {
                            if (renameMap.hasOwnProperty(key)) {
                                renamedItem[renameMap[key]] = item[key];
                            } else {
                                renamedItem[key] = item[key];
                            }
                        }
                        renamedItem["Scan Qty"] = `
                        <input type="text" id="txtScanQty_${item.Code}" value="${item["Scan Qty"]}" disabled class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Scan Qty..">`;
                        renamedItem["Box No"] = `
                        <input type="text" onfocusout="UpdateBoxNo(this,${item.Code})" oninput="NumericValue(this)" id="txtBoxNo_${item.Code}" value="${item["Box No"]}" class="box_border form-control form-control-sm text-right BizSolFormControl" autocomplete="off" placeholder="Box No..">`;
                        return renamedItem;
                    });
                    BizsolCustomFilterGrid.CreateDataTable("DispatchTable-Header", "DispatchTable-Body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                } else {
                    $("#tblDispatchData").hide();
                    toastr.info("No picked items found for packing.");
                }
            } else {
                toastr.error("Record not found...!");
                $("#tblDispatchData").hide();
            }
        },
        error: function () {
            toastr.error("Record not found...!");
            $("#tblDispatchData").hide();
        }
    });
}

async function Export(jsonData) {
    const columnsToRemove = ["Code"];
    const renameMap = {
        "Item Name": G_ItemConfig[0].ItemNameHeader || 'Item Name',
        "Item Code": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
    };

    if (!Array.isArray(columnsToRemove)) {
        console.error("columnsToRemove should be an array");
        return;
    }

    let totalMRP = 0;

    const filteredAndRenamedData = jsonData.map(row => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
            if (!columnsToRemove.includes(key)) {
                const newKey = renameMap[key] || key;
                newRow[newKey] = value;

                if (key === "Total Value" && !isNaN(value)) totalMRP += Number(value);
            }
        }
        return newRow;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    const headers = Object.keys(filteredAndRenamedData[0] || {});
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB0C4DE' }
        };
    });

    filteredAndRenamedData.forEach(data => {
        const rowValues = headers.map(key => {
            const val = data[key];
            if (key === "Total Value" && !isNaN(val)) return Number(val).toFixed(2);
            return val;
        });
        const row = worksheet.addRow(rowValues);
        const mrpIndex = headers.indexOf("Total Value");
        if (mrpIndex !== -1) row.getCell(mrpIndex + 1).numFmt = '0.00';
    });

    const totalRow = Array(headers.length).fill("");
    const mrpIndex = headers.indexOf("Total Value");

    if (mrpIndex !== -1) {
        totalRow[0] = "Total :";
        totalRow[mrpIndex] = totalMRP.toFixed(2);
    }

    const totalExcelRow = worksheet.addRow(totalRow);
    totalExcelRow.font = { bold: true };
    totalExcelRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE4B5' } // Light orange
        };
    });

    // Format total MRP cell
    if (mrpIndex !== -1) {
        totalExcelRow.getCell(mrpIndex + 1).numFmt = '0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Dispatch_" + (jsonData[0]["Order No"] || "Export") + ".xlsx";
    link.click();
}

async function DeleteItemQty(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (confirm(`Are you sure you want to delete this item qty.?`)) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/DeleteDispatchItemQty?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    if (G_Tab == 1) {
                        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                    }
                    else if (G_Tab == 2 || G_Tab == 4) {
                        if (All == 0) {
                            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                        } else if (All == 1) {
                            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                        }
                    } else if (G_Tab == 3) {
                        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                    }
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

function GetUpiDetailsByItemCode(DispatchMaster_Code, ItemCode) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/GetUpiDetailsByItemCode?DispatchMaster_Code=${DispatchMaster_Code}&ItemCode=${encodeURIComponent(ItemCode || '')}`,
            type: 'POST',
            contentType: "application/json",
            dataType: "json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                resolve(response);
            },
            error: function (xhr, status, error) {
                reject(error);
            }
        });
    });
}

function BindManualUpiDetailsGrid(upiDetails, itemCode, isFilteredView) {
    if (itemCode !== undefined) {
        G_ManualUpiItemCode = itemCode || '';
    }
    if (!isFilteredView) {
        G_ManualUpiDetails = Array.isArray(upiDetails) ? upiDetails : (upiDetails ? [upiDetails] : []);
        $("#txtManualUpiSearch").val("");
    }

    const rows = isFilteredView
        ? (Array.isArray(upiDetails) ? upiDetails : [])
        : G_ManualUpiDetails;
    const $section = $("#dvManualUpiGrid");

    if (!G_ManualUpiDetails.length) {
        $section.hide();
        $("#ManualUpiTable-header").empty();
        $("#ManualUpiTable-body").empty();
        return;
    }

    $section.show();
    if (!rows.length) {
        $("#ManualUpiTable-header").empty();
        $("#ManualUpiTable-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
        return;
    }

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ["Code"];
    const ColumnAlignment = {
        "Qty": "right;width:70px;",
        "MRP": "right;width:70px;",
        "Box No": "right;width:70px;",
        "Action": "center;width:70px;"
    };
    const safeItemCode = (G_ManualUpiItemCode || '').replace(/'/g, "\\'");
    const updatedResponse = rows.map(item => {
        const renamedItem = { ...item };
        if (!renamedItem["UPI ID"] && renamedItem.UPI_ID) {
            renamedItem["UPI ID"] = renamedItem.UPI_ID;
        }
        if (!renamedItem["Box No"] && renamedItem.BoxNo != null) {
            renamedItem["Box No"] = renamedItem.BoxNo;
        }
        if ((renamedItem.MRP == null || renamedItem.MRP === "" || renamedItem.MRP === "NULL") && renamedItem.Rate != null) {
            renamedItem.MRP = renamedItem.Rate;
        }
        renamedItem["Action"] = `<button class="btn btn-danger icon-height mb-1" title="Delete UPI" onclick="DeleteManualUpiDetail('${item.Code}')"><i class="fa-solid fa-trash"></i></button>`;
        return renamedItem;
    });

    BizsolCustomFilterGrid.CreateDataTable(
        "ManualUpiTable-header",
        "ManualUpiTable-body",
        updatedResponse,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        false
    );
}

function FilterManualUpiGrid() {
    const searchValue = ($("#txtManualUpiSearch").val() || "").toLowerCase().trim();
    if (!searchValue) {
        BindManualUpiDetailsGrid(G_ManualUpiDetails, G_ManualUpiItemCode, true);
        return;
    }
    const filteredRows = G_ManualUpiDetails.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(searchValue))
    );
    BindManualUpiDetailsGrid(filteredRows, G_ManualUpiItemCode, true);
}

function RefreshManualUpiGrid(itemCode) {
    const productCode = itemCode || G_ManualUpiItemCode || $("#hfManualProductCode").val() || '';
    if (!G_DispatchMaster_Code || parseInt(G_DispatchMaster_Code, 10) <= 0 || !productCode) {
        BindManualUpiDetailsGrid([], productCode);
        return Promise.resolve([]);
    }
    return GetUpiDetailsByItemCode(G_DispatchMaster_Code, productCode).then(function (upiDetails) {
        upiDetails = Array.isArray(upiDetails) ? upiDetails : (upiDetails ? [upiDetails] : []);
        BindManualUpiDetailsGrid(upiDetails, productCode);
        return upiDetails;
    }).catch(function () {
        showToast("Error in api/OrderMaster/GetUpiDetailsByItemCode");
        return [];
    });
}

function RefreshDispatchAfterManualChange() {
    if (G_Tab == 1) {
        StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS", true);
    } else if (G_Tab == 2 || G_Tab == 4) {
        if (All == 0) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS", true);
        } else if (All == 1) {
            StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS", true);
        }
    } else if (G_Tab == 3) {
        StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS", true);
    }
}

function getDeleteApiResult(response) {
    const result = Array.isArray(response) && response.length ? response[0] : response;
    const status = result && (result.Status || result.status || result.STATUS);
    return {
        result: result,
        isSuccess: status === 'Y' || status === 'y'
    };
}

async function DeleteManualUpiDetail(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (!confirm("Are you sure you want to delete this UPI detail?")) {
        return;
    }

    const itemCode = G_ManualUpiItemCode || $("#hfManualProductCode").val() || '';

    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/DeleteDispatchUpiDetail?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            const { result, isSuccess } = getDeleteApiResult(response);
            if (isSuccess) {
                toastr.success((result && result.Msg) || "Deleted successfully.");
                RefreshManualUpiGrid(itemCode).finally(function () {
                    RefreshDispatchAfterManualChange();
                });
            } else {
                toastr.error((result && result.Msg) || "Unable to delete UPI detail.");
            }
        },
        error: function () {
            showToast("Error in api/OrderMaster/DeleteDispatchUpiDetail");
        }
    });
}

async function ManualUpdateQtyAndMRP(ItemCode, BalanceQty, MRP) {
    const { hasPermission, msg } = await CheckOptionPermission('Manual', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }

    let upiDetails = [];
    if (G_DispatchMaster_Code && parseInt(G_DispatchMaster_Code, 10) > 0) {
        try {
            upiDetails = await GetUpiDetailsByItemCode(G_DispatchMaster_Code, ItemCode);
            upiDetails = Array.isArray(upiDetails) ? upiDetails : (upiDetails ? [upiDetails] : []);
        } catch (error) {
            showToast("Error in api/OrderMaster/GetUpiDetailsByItemCode");
        }
    }

    BindManualUpiDetailsGrid(upiDetails, ItemCode);

    $("#txtManualItemCode").text("PRODUCT NAME : " + ItemCode);
    $("#hfManualProductCode").val(ItemCode);
    $("#hfManualProductQuantity").val(BalanceQty);
    $("#txtManualBalanceQuantity").text("EXPECTED QUANTITY : " + BalanceQty)
    $("#txtManualProductMRP").val(MRP)
    openSavePopup();
}
function openSavePopup() {
    var saveModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
    saveModal.show();
}
function SaveManual() {
    //if (isPackingMode()) {
    //    toastr.error("Manual quantity save is not allowed in Packing. Only Box No can be updated.");
    //    return;
    //}
    var orderNo = $("#txtOrderNo").val();
    var boxNo = isPickingMode() ? 0 : $("#txtManualBoxNo").val();
    var quantity = $("#txtManualProductQuantity").val();
    var mrp = $("#txtManualProductMRP").val();
    var itemCode = $("#hfManualProductCode").val();
    var availableQty = $("#hfManualProductQuantity").val();
    var quantityInt = parseInt(quantity);
    var availableQtyInt = parseInt(availableQty);
    if (!quantity || isNaN(quantityInt) || quantityInt <= 0) {
        toastr.error("Please enter a valid quantity!");
        return;
    }
    if (quantityInt > availableQtyInt) {
        toastr.error("Entered quantity exceeds available balance!");
        $("#txtManualProductQuantity").focus();
        return;
    }
    if (!mrp || isNaN(parseFloat(mrp))) {
        toastr.error("Please enter a valid MRP!");
        $("#txtManualProductMRP").focus();
        return;
    }
    if (!isPickingMode() && (!boxNo || isNaN(parseInt(boxNo)) || parseInt(boxNo) < 1)) {
        toastr.error("Please enter a valid box number!");
        return;
    }
    const item = G_OrderList.find(entry => entry.OrderNoWithPrefix == orderNo);

    const payload = {
        DispatchMaster_Code: G_DispatchMaster_Code,
        ManualQty: quantity,
        UserMaster_Code: UserMaster_Code,
        ItemCode: itemCode,
        OrderMaster_Code: item.Code || 0,
        Mrp: mrp,
        BoxNo: boxNo
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/SaveManualRateAndQty`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response[0].Status == 'Y') {
                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
                if (G_Tab == 1) {
                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                }
                else if (G_Tab == 2 || G_Tab == 4) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3) {
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
                CloseManualModal();
                if (G_IsPSRMailOnOrderPacked) {
                    SendPSRReportMail(G_DispatchMaster_Code);
                }
            } else if (response[0].Status == 'N') {
                CloseManualModal();
                showToast(response[0].Msg);
                G_DispatchMaster_Code = response[0].DispatchMaster_Code;
                if (G_Tab == 1) {
                    StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
                }
                else if (G_Tab == 2 || G_Tab == 4) {
                    if (All == 0) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
                    } else if (All == 1) {
                        StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
                    }
                } else if (G_Tab == 3) {
                    StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
                }
            }
        },
        error: function (xhr, status, error) {
            showToast("Error in api/OrderMaster/SaveManualRateAndQty");
        }
    });
}
function CloseManualModal() {
    $('#txtManualProductQuantity').val("");
    $('#txtManualProductMRP').val("");
    $('#txtManualUpiSearch').val("");
    G_ManualUpiDetails = [];
    G_ManualUpiItemCode = '';
    BindManualUpiDetailsGrid([], '');
    var modal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
    if (modal) {
        modal.hide();
    }
}
function GetDispatchReport() {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?Month=${Month}&Year=${Year}&Type=GET`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTATTable").show();
                const StringFilterColumn = ["INVOICE NO", "RETAILER CODE", "PARTY NAME", "SALES ORDER NO", "INVOICE VALUE", "ORDER TYPE", "PD NAME"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["INVOICE DATE", "ORDER DATE"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "REMARK": 'left;width:100px;',
                };
                const updatedResponse = response.map(item => {
                    const isDisabled = item["DISPATCH DATE"] === '' ? 'disabled' : '';

                    return {
                        ...item,
                        POD: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.POD}" id="txtPODDate_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        REDISPATCH: `<input type="date" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REDISPATCH}" id="txtRedispatch_${item.Code}" onchange="SaveData(this);" autocomplete="off"/>`,
                        "VEHICLE NO": `<input type="text" maxlength="10" class="box_border form-control form-control-sm" ${isDisabled} value="${item["VEHICLE NO"]}" id="txtVehicleNo_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`,
                        REMARK: `<input type="text" maxlength="100" class="box_border form-control form-control-sm" ${isDisabled} value="${item.REMARK}" id="txtRemark_${item.Code}" onfocusout="SaveData(this);" autocomplete="off"/>`
                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtTATTable").hide();
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
function Report(Code) {
    $("#hfDownloadCode").val(Code);
    showDispatchDownloadChooser();
    showDispatchModal('DownloadModal');
}
function CloseDownloadModal() {
    hideDispatchModalThen(document.getElementById('DownloadModal'), function () {
        showDispatchDownloadChooser();
        resetDispatchPdfAmountModal();
    });
}
function DownloadReportPdf() {
    var Code = $("#hfDownloadCode").val();
    $.ajax({
        url: `${AppBaseURLMenu}/RDLC/PSRReportQR?Code=${Code}&UserName=${G_UserName}&AuthKey=${authKeyData}&CompanyCode=${G_CompanyCode}`,
        type: 'GET',
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data, status, xhr) {
            let blob = new Blob([data], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = "PSRReport.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },
        error: function (xhr, status, error) {
            console.error('Error downloading report:', xhr.responseText);
        }
    });
}
function applyDispatchCompanyName(rows) {
    if (!rows || !rows.length) return rows;
    rows.forEach(function (item) {
        item.CompanyName = G_CompanyName;
    });
    return rows;
}

async function DownloadDispatchQR() {
    var Code = $("#hfDownloadCode").val();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchQRDetail?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: async function (response) {
            if (response.length > 0) {
                $("#qrcodeview").html("");

                for (let i = 0; i < response.length; i++) {
                    const item = response[i];
                    const textValue = item.QRCode;
                    const divId = `qrcode_${i}`;
                    $("#qrcodeview").append(`<div id="${divId}" style="display:none;"></div>`);

                    new QRCode(document.getElementById(divId), {
                        text: textValue,
                        width: 100,
                        height: 100,
                    });

                    await new Promise(resolve => setTimeout(resolve, 300));

                    const canvas = $(`#${divId} canvas`)[0];
                    if (canvas) {
                        const base64Image = canvas.toDataURL('image/png');
                        response[i].QRCode = base64Image;
                    }
                }
                applyDispatchCompanyName(response);
                DownloadQRPdf(response);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function DownloadQRPdf(response) {
    $.ajax({
        url: `${AppBaseURLMenu}/RDLC/PrintDispatchQR`,
        type: 'POST',
        xhrFields: {
            responseType: 'blob'
        },
        contentType: 'application/json',
        data: JSON.stringify(response),
        success: function (data, status, xhr) {
            let blob = new Blob([data], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = "DispatchQR_" + response[0]["OrderNo"] + ".pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },
        error: function (xhr, status, error) {
            console.error('Error downloading report:', xhr.responseText);
        }
    });
}

async function DownloadInExcel() {
    try {
        const DownloadDate = convertDateFormat1($("#txtToDate").val());
        const OldDate = convertDateFormat1($("#txtDownloadDate").val());
        const OrderStatus = $("#ddlOrderStatus").val();
        if (OldDate === '' || OldDate === undefined || OldDate === null) {
            toastr.error("Please enter a valid date !");
            $("#txtDownloadDate").focus()
            return;
        }
        if (OrderStatus == '') {
            toastr.error("Please select order status !");
            $("#ddlOrderStatus").focus()
            return;
        }
        const response = await getDataWithAjax(DownloadDate, OldDate, OrderStatus);

        if (response.length > 0) {
            await DownloadExport(response);
        } else {
            alert("Record not found...!");
        }
    } catch (error) {
        console.error("AJAX error:", error);
    }
}
function getDataWithAjax(FromDate, ToDate, OrderStatus) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: `${appBaseURL}/api/OrderMaster/GetOrderPackedDetail?Date=${ToDate}&ToDate=${FromDate}&OrderStatus=${OrderStatus}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                resolve(response);
            },
            error: function (xhr, status, error) {
                reject(error);
            }
        });
    });
}

async function DownloadExport(Data) {
    const Picklist = $("#txtDownloadDate").val();
    const OrderStatus = $("#ddlOrderStatus").val();
    const renameMap = {
        "Item Name": G_ItemConfig[0].ItemNameHeader || 'Item Name',
        "Item Code": G_ItemConfig[0].ItemCodeHeader || 'Item Code',
    };

    const originalHeaders = Object.keys(Data[0] || {});
    const newHeaders = originalHeaders.map(key => renameMap[key] || key);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");
    const headerRow = sheet.addRow(newHeaders);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    sheet.autoFilter = {
        from: 'A1',
        to: String.fromCharCode(65 + newHeaders.length - 1) + '1'
    };

    Data.forEach(rowObj => {
        const row = originalHeaders.map(key => rowObj[key]);
        const addedRow = sheet.addRow(row);

        addedRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        const status = rowObj["Scan Status"]; // Use original key name
        const fillColor = "FFFFFF";

        addedRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: fillColor }
            };
        });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${OrderStatus}_${Picklist}.xlsx`;
    link.click();
}
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function setupDateInputFormatting() {
    $('#txtDownloadDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateChallanDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtDownloadDate').val('');

        }
    } else {
        $('#txtDownloadDate').val('');

    }
}
function DatePickerForDownloadDate(date) {
    $('#txtToDate').val(date);
    $('#txtToDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true
    }).on('show', function () {
        let $input = $(this);
        let inputOffset = $input.offset();
        let inputHeight = $input.outerHeight();
        let inputWidth = $input.outerWidth();
        setTimeout(function () {
            let $datepicker = $('.datepicker-dropdown');
            $datepicker.css({
                width: inputWidth + 'px',
                top: (inputOffset.top + inputHeight) + 'px',
                left: inputOffset.left + 'px',
                'z-index': '1000',
            });
        }, 10);
    });
}
function DatePickerForDownloadOld(date) {
    $('#txtDownloadDate').val(date);
    $('#txtDownloadDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        orientation: 'bottom auto',
        todayHighlight: true
    }).on('show', function () {
        let $input = $(this);
        let inputOffset = $input.offset();
        let inputHeight = $input.outerHeight();
        let inputWidth = $input.outerWidth();
        setTimeout(function () {
            let $datepicker = $('.datepicker-dropdown');
            $datepicker.css({
                width: inputWidth + 'px',
                top: (inputOffset.top + inputHeight) + 'px',
                left: inputOffset.left + 'px',
                'z-index': '1000',
            });
        }, 10);
    });
}
function GetTotalLineOfPart(OrderMaster_Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTotalLineOfPart?OrderMaster_Code=${OrderMaster_Code}`,
        type: 'GET',
        contentType: "application/json",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            $("#txtTotalPartLine").text(response[0].PartCount);
        },
        error: function (xhr, status, error) {
            showToast("Error in api/OrderMaster/GetTotalLineOfPart");
        }
    });
}
function SaveMRPByItemInput(element, itemCode) {
    var newMrp = ($(element).val() || '').trim();
    if (newMrp === '') {
        return;
    }
    if (isNaN(parseFloat(newMrp))) {
        toastr.error("Please enter a valid MRP!");
        $(element).focus();
        return;
    }
    var oldMrp = ($(element).attr('data-old-mrp') || $(element).closest('tr').attr('data-mrp') || '').trim();
    if (parseFloat(oldMrp || 0) === parseFloat(newMrp)) return;

    if (!G_DispatchMaster_Code || parseInt(G_DispatchMaster_Code) <= 0) {
        toastr.error("Invalid Dispatch reference!");
        return;
    }
    var payload = {
        DispatchMaster_Code: G_DispatchMaster_Code,
        ItemCode: itemCode,
        OldMRP: oldMrp,
        NewMRP: newMrp,
        Mrp: newMrp,
        UserMaster_Code: UserMaster_Code
    };
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateDispatchMRPByItemAsync`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
		success: function (response) {
			var res = response;
			if (Array.isArray(response)) {
				res = response[0];
			}
			if (res && res.Status == 'Y') {
				if (G_Tab == 1) {
					StartDispatchPanding($("#hfCode").val(), "ORDERDETAILS");
				} else if (G_Tab == 2 || G_Tab == 4) {
					if (All == 0) {
						StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "DDETAILS");
					} else {
						StartDispatchTransit($("#hfCode").val(), G_DispatchMaster_Code, "AllDDETAILS");
					}
				} else if (G_Tab == 3) {
					StartDispatchCompleteTransit(G_DispatchMaster_Code, "CDETAILS");
				}
			} else {
				var msg = "Unable to update MRP";
				if (res && res.Msg) {
					msg = res.Msg;
				}
				showToast(msg);
			}
		},
        error: function () {
            showToast("Error in api/OrderMaster/UpdateDispatchMRPByItem");
        }
    });
}
function OpenManualForMRP(element, itemCode) {
	var mrp = $(element).val();
	if (mrp === undefined || mrp === null || mrp === '') {
		return;
	}
	if (isNaN(parseFloat(mrp))) {
		toastr.error("Please enter a valid MRP!");
		$(element).focus();
		return;
	}
	SaveMRPByItemInput(element, itemCode);
}
function SendPSRReportMail(DispatchMaster_Code) {
    if (!G_IsPSRMailOnOrderPacked) {
        return;
    }
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/CheckOrderPacked?DispatchMaster_Code=${DispatchMaster_Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0 && response[0].Completed === 'Y') {
                CheckMailSendBeforeSend(DispatchMaster_Code, 'Hide');
            } else {
                unblockUI();
            }
        },
        error: function () {
            unblockUI();
        }
    });
}
function CheckMailSendBeforeSend(DispatchMaster_Code, Mode) {
    var isHideMode = Mode === 'Hide';
    if (!isHideMode) {
        blockUI();
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/CheckMailSend?DispatchMaster_Code=${DispatchMaster_Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0 && response[0].IsMailSend === 'Y') {
                if (isHideMode) {
                    unblockUI();
                } else if (confirm("Mail has already been sent. Do you want to send it again?")) {
                    SendPSRReportMailRequest(DispatchMaster_Code, Mode);
                } else {
                    unblockUI();
                }
            } else {
                SendPSRReportMailRequest(DispatchMaster_Code, Mode);
            }
        },
        error: function () {
            unblockUI();
            if (!isHideMode) {
                toastr.error("Error checking mail send status.");
            }
        }
    });
}
function SendPSRReportMailRequest(DispatchMaster_Code, Mode) {
    var isHideMode = Mode === 'Hide';
    $.ajax({
        url: `${AppBaseURLMenu}/Mail/SendPSRReportMail?Code=${DispatchMaster_Code}&UserName=${G_UserName}&AuthKey=${authKeyData}&CompanyCode=${G_CompanyCode}`,
        type: 'GET',
        success: function (response) {
            UpdateMailSendStatus(DispatchMaster_Code, response, Mode);
        },
        error: function (xhr) {
            unblockUI();
            if (!isHideMode) {
                var msg = "Failed to send PSR Report.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    msg = xhr.responseText;
                }
                toastr.error(msg);
            }
        }
    });
}
function UpdateMailSendStatus(DispatchMaster_Code, mailResponse, Mode) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/UpdateMailSend?DispatchMaster_Code=${DispatchMaster_Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            unblockUI();
            if (response.Status === 'Y') {
                if (Mode !== 'Hide') {
                    toastr.success((mailResponse && mailResponse.message) ? mailResponse.message : "PSR Report sent successfully.");
                }
            } else if (Mode !== 'Hide') {
                toastr.warning(response.Msg || "PSR Report sent but mail status update failed.");
            }
        },
        error: function () {
            unblockUI();
            if (Mode !== 'Hide') {
                toastr.warning("PSR Report sent but failed to update mail status.");
            }
        }
    });
}

function pickDispatchPdfAmtVal(row, keys, defVal) {
    if (!row) return defVal;
    for (var i = 0; i < keys.length; i++) {
        var v = row[keys[i]];
        if (v != null && String(v).trim() !== '') {
            return v;
        }
    }
    return defVal;
}
function parseDispatchPdfAmt(val) {
    var n = parseFloat(String(val == null ? '' : val).replace(/,/g, '').trim());
    return isNaN(n) ? 0 : n;
}
function formatDispatchPdfAmt(val) {
    return parseDispatchPdfAmt(val).toFixed(2);
}
function calcDispatchPdfAdjAmount(total, type, value) {
    var amt = parseDispatchPdfAmt(value);
    if (String(type || '') === '%') {
        return total * amt / 100;
    }
    return amt;
}
function isDispatchPdfManual() {
    return $('#chkPdfIsManual').is(':checked');
}
function applyDispatchPdfManualMode(isManual) {
    $('#chkPdfIsManual').prop('checked', !!isManual);
    $('#ddlPdfAddType, #txtPdfAddValue, #ddlPdfLessType, #txtPdfLessValue').prop('disabled', !!isManual);
    $('#txtPdfNetAmount').prop('readonly', !isManual);
    if (isManual) {
        $('#txtPdfAddValue').val(formatDispatchPdfAmt(0));
        $('#txtPdfLessValue').val(formatDispatchPdfAmt(0));
    }
}
function OnDispatchPdfIsManualChange() {
    var isManual = isDispatchPdfManual();
    var currentNet = $('#txtPdfNetAmount').val();
    applyDispatchPdfManualMode(isManual);
    if (isManual) {
        if (String(currentNet || '').trim() === '') {
            $('#txtPdfNetAmount').val(formatDispatchPdfAmt($('#txtPdfTotal').val()));
        } else {
            $('#txtPdfNetAmount').val(formatDispatchPdfAmt(currentNet));
        }
    } else {
        CalculateDispatchPdfNetAmount();
    }
}
function CalculateDispatchPdfNetAmount() {
    if (isDispatchPdfManual()) {
        return;
    }
    var total = parseDispatchPdfAmt($('#txtPdfTotal').val());
    var addAmt = calcDispatchPdfAdjAmount(total, $('#ddlPdfAddType').val(), $('#txtPdfAddValue').val());
    var lessAmt = calcDispatchPdfAdjAmount(total, $('#ddlPdfLessType').val(), $('#txtPdfLessValue').val());
    $('#txtPdfNetAmount').val(formatDispatchPdfAmt(total + addAmt - lessAmt));
}
function resetDispatchPdfAmountModal() {
    $('#hfPdfDispatchMaster_Code').val('0');
    $('#txtPdfTotal').val('');
    $('#txtPdfAddValue').val('');
    $('#txtPdfLessValue').val('');
    $('#txtPdfNetAmount').val('');
    $('#ddlPdfAddType').val('%');
    $('#ddlPdfLessType').val('%');
    applyDispatchPdfManualMode(false);
}
function cleanupDispatchModalBackdrops() {
    var openModals = document.querySelectorAll('.modal.show').length;
    var backdrops = Array.prototype.slice.call(document.querySelectorAll('.modal-backdrop'));
    if (openModals === 0) {
        backdrops.forEach(function (b) { b.remove(); });
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('pointer-events');
    }
}
function showDispatchModal(id) {
    var el = document.getElementById(id);
    if (!el) {
        return;
    }
    bootstrap.Modal.getOrCreateInstance(el).show();
}
function hideDispatchModalThen(el, callback) {
    var done = typeof callback === 'function' ? callback : function () { };
    if (!el) {
        cleanupDispatchModalBackdrops();
        done();
        return;
    }
    var isOpen = el.classList.contains('show');
    var inst = bootstrap.Modal.getInstance(el);
    if (!inst || !isOpen) {
        cleanupDispatchModalBackdrops();
        done();
        return;
    }
    $(el).off('hidden.bs.modal.dispatchSeq').one('hidden.bs.modal.dispatchSeq', function () {
        cleanupDispatchModalBackdrops();
        done();
    });
    inst.hide();
}
function showDispatchDownloadChooser() {
    $('#downloadModalTitle').text('Download');
    $('#dispatchDownloadChooser').removeClass('d-none');
    $('#dispatchPdfAmountPanel').addClass('d-none');
}
function OpenDispatchPdfAmountModal() {
    var code = parseInt($('#hfDownloadCode').val(), 10) || 0;
    if (code <= 0) {
        toastr.error('Dispatch code not found.');
        return;
    }
    resetDispatchPdfAmountModal();
    $('#hfPdfDispatchMaster_Code').val(code);
    $('#hfDownloadCode').val(code);
    $('#downloadModalTitle').text('Amount');
    $('#dispatchDownloadChooser').addClass('d-none');
    $('#dispatchPdfAmountPanel').removeClass('d-none');
    GetDispatchPdfAmountDetail(code);
}
function CloseDispatchPdfAmountModal() {
    var code = parseInt($('#hfPdfDispatchMaster_Code').val(), 10) || parseInt($('#hfDownloadCode').val(), 10) || 0;
    resetDispatchPdfAmountModal();
    if (code > 0) {
        $('#hfDownloadCode').val(code);
    }
    showDispatchDownloadChooser();
}
function fillDispatchPdfAmountModal(row) {
    var addType = String(pickDispatchPdfAmtVal(row, ['AddType', 'addType', 'AddValueType'], '%'));
    var lessType = String(pickDispatchPdfAmtVal(row, ['LessType', 'lessType', 'LessValueType'], '%'));
    if (addType.toLowerCase() === 'lumsum' || addType.toLowerCase() === 'lumpsum') {
        addType = 'LumSum';
    } else if (addType !== '%') {
        addType = '%';
    }
    if (lessType.toLowerCase() === 'lumsum' || lessType.toLowerCase() === 'lumpsum') {
        lessType = 'LumSum';
    } else if (lessType !== '%') {
        lessType = '%';
    }
    var isManualRaw = String(pickDispatchPdfAmtVal(row, ['IsManual', 'isManual', 'Ismanual'], 'N')).toUpperCase();
    var isManual = isManualRaw === 'Y' || isManualRaw === '1' || isManualRaw === 'TRUE';
    $('#ddlPdfAddType').val(addType);
    $('#ddlPdfLessType').val(lessType);
    $('#txtPdfTotal').val(formatDispatchPdfAmt(pickDispatchPdfAmtVal(row, ['Total', 'total', 'TotalAmount', 'totalAmount'], 0)));
    $('#txtPdfAddValue').val(formatDispatchPdfAmt(pickDispatchPdfAmtVal(row, ['AddValue', 'addValue', 'AddAmount', 'addAmount'], 0)));
    $('#txtPdfLessValue').val(formatDispatchPdfAmt(pickDispatchPdfAmtVal(row, ['LessValue', 'lessValue', 'LessAmount', 'lessAmount'], 0)));
    var netVal = pickDispatchPdfAmtVal(row, ['NetAmount', 'netAmount'], '');
    if (isManual) {
        if (netVal === '') {
            $('#txtPdfNetAmount').val(formatDispatchPdfAmt($('#txtPdfTotal').val()));
        } else {
            $('#txtPdfNetAmount').val(formatDispatchPdfAmt(netVal));
        }
        applyDispatchPdfManualMode(true);
    } else {
        applyDispatchPdfManualMode(false);
        CalculateDispatchPdfNetAmount();
    }
}
function GetDispatchPdfAmountDetail(DispatchMaster_Code) {
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetDispatchPdfAmountDetail?DispatchMaster_Code=${DispatchMaster_Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var row = Array.isArray(response) ? response[0] : response;
            if (row) {
                fillDispatchPdfAmountModal(row);
            } else {
                CalculateDispatchPdfNetAmount();
            }
        },
        error: function () {
            toastr.error('Error in api/OrderMaster/GetDispatchPdfAmountDetail');
            CalculateDispatchPdfNetAmount();
        }
    });
}
function SaveDispatchPdfAmount(downloadAfterSave) {
    var DispatchMaster_Code = parseInt($('#hfPdfDispatchMaster_Code').val(), 10) || parseInt($('#hfDownloadCode').val(), 10) || 0;
    if (DispatchMaster_Code <= 0) {
        toastr.error('DispatchMaster_Code not found.');
        return;
    }
    var isManual = isDispatchPdfManual();
    if (isManual) {
        $('#txtPdfAddValue').val(formatDispatchPdfAmt(0));
        $('#txtPdfLessValue').val(formatDispatchPdfAmt(0));
        $('#txtPdfNetAmount').val(formatDispatchPdfAmt($('#txtPdfNetAmount').val()));
    } else {
        CalculateDispatchPdfNetAmount();
    }
    var payload = {
        DispatchMaster_Code: DispatchMaster_Code,
        Total: parseDispatchPdfAmt($('#txtPdfTotal').val()),
        AddType: $('#ddlPdfAddType').val(),
        AddValue: isManual ? 0 : parseDispatchPdfAmt($('#txtPdfAddValue').val()),
        LessType: $('#ddlPdfLessType').val(),
        LessValue: isManual ? 0 : parseDispatchPdfAmt($('#txtPdfLessValue').val()),
        NetAmount: parseDispatchPdfAmt($('#txtPdfNetAmount').val()),
        IsManual: isManual ? 'Y' : 'N'
    };
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/SaveDispatchPdfAmountDetail`,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var row = Array.isArray(response) ? response[0] : response;
            if (row && (row.Status === 'Y' || row.status === 'Y')) {
                toastr.success((row.Msg || row.msg || 'Data Saved Successfully') + '');
                CloseDispatchPdfAmountModal();
                if (downloadAfterSave) {
                    DownloadReportPdf();
                }
            } else {
                toastr.error((row && (row.Msg || row.msg)) ? (row.Msg || row.msg) : 'Save failed.');
            }
        },
        error: function () {
            toastr.error('Error in api/OrderMaster/SaveDispatchPdfAmountDetail');
        }
    });
}


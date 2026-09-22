
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let G_selectedCodes = [];
var TAT_CITY_DROPDOWN_MAX_H = 260;

function positionCityDropdown() {
    var $list = $('#dropdownList');
    var $trigger = $('#dropdownButton');
    if (!$list.length || !$trigger.length || !$list.hasClass('is-open')) return;

    var rect = $trigger[0].getBoundingClientRect();
    var gap = 4;
    var maxH = TAT_CITY_DROPDOWN_MAX_H;
    var spaceBelow = window.innerHeight - rect.bottom - gap - 8;
    var spaceAbove = rect.top - gap - 8;
    var openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    var avail = openUp ? spaceAbove : spaceBelow;
    var height = Math.max(120, Math.min(maxH, avail));

    $list.css({
        position: 'fixed',
        left: rect.left + 'px',
        width: rect.width + 'px',
        top: openUp ? (rect.top - height - gap) + 'px' : (rect.bottom + gap) + 'px',
        maxHeight: height + 'px',
        right: 'auto'
    });
}

function restoreCityDropdown() {
    var $list = $('#dropdownList');
    var $parent = $list.data('tat-portal-parent');
    if ($parent && $parent.length && $list.parent()[0] !== $parent[0]) {
        $parent.append($list);
    }
    $list.css({ position: '', left: '', top: '', width: '', maxHeight: '', right: '' });
}

function toggleCityDropdown(forceOpen) {
    var $list = $('#dropdownList');
    var $trigger = $('#dropdownButton');
    if (!$list.data('tat-portal-parent')) {
        $list.data('tat-portal-parent', $list.parent());
    }

    var open = forceOpen === true ? true : (forceOpen === false ? false : !$list.hasClass('is-open'));
    if (open) {
        if ($list.parent()[0] !== document.body) {
            $('body').append($list);
        }
        $list.addClass('is-open').show();
        $trigger.addClass('is-open');
        positionCityDropdown();
    } else {
        $list.removeClass('is-open').hide();
        $trigger.removeClass('is-open');
        restoreCityDropdown();
    }
}

$(document).ready(function () {
    GetModuleMasterCode();

    $("#ERPHeading").text("TAT Configuration");
    $('#txtDivision').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtMinKM").focus();
        }
    });
    $('#txtMinKM').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtMaxKM").focus();
        }
    });
    $('#txtMaxKM').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtInvoice").focus();
        }
    });
    $('#txtInvoice').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPacking").focus();
        }
    });
    $('#txtPacking').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDispatch").focus();
        }
    });
    $('#txtDispatch').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDelivered").focus();
        }
    });

    $('#txtDelivered').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#dropdownButton").focus();
        }
    });
   

    TATConfigurationList('Load');

    GetCityMasterList();

    $('.select-checkbox-multi').on('click', function (e) {
        e.stopPropagation();
        toggleCityDropdown();
    });

    $('#dropdownList').on('click', function (e) {
        e.stopPropagation();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.dropdown-container, #dropdownList').length) {
            toggleCityDropdown(false);
        }
    });

    $(window).on('resize scroll', function () {
        positionCityDropdown();
    });

    $('#selectAll').on('change', function () {
        $('.option').prop('checked', this.checked);
        updateSelected();
    });

    $(document).on('change', '.option', function () {
        if ($('.option:checked').length === $('.option').length) {
            $('#selectAll').prop('checked', true);
        } else {
            $('#selectAll').prop('checked', false);
        }
        updateSelected();
    });
});
function TATConfigurationList(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowTATConfiguration`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTATConfigurationtable").show();
                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["ID"];
                const ColumnAlignment = {
                    "CreatedOn": 'center',
                    "DigitAfterDecimal": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}','${item[`City`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtTATConfigurationtable").hide();
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
async function Create() {
    const { haspermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (haspermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("new");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#hftxtcode").prop("disabled", false);
    $("#txtCity").prop("disabled", false);
    $("#txtDispatch").prop("disabled", false);
    $("#txtPacking").prop("disabled", false);
    $("#txtDelivered").prop("disabled", false);
    $("#txtbtnsave").prop("disabled", false);
    $("#txtheaderdiv").show();
    disableFields(false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
    ClearData();
    $("#hftxtcode").prop("disabled", false);
    $("#txtCity").prop("disabled", false);
    $("#txtDispatch").prop("disabled", false);
    $("#txtPacking").prop("disabled", false);
    $("#txtDelivered").prop("disabled", false);
    $("#txtbtnsave").prop("disabled", false);
    disablefields(false);
}
function Save() {
    var Division = $("#txtDivision").val();
    var MinKM = $("#txtMinKM").val();
    var MaxKM = $("#txtMaxKM").val();
    var Invoice = $("#txtInvoice").val();
    var Dispatch = $("#txtDispatch").val();
    var Packing = $("#txtPacking").val();
    var Delivered = $("#txtDelivered").val();
    var codes = GetEmpCodes();
    let City = Array.isArray(codes) ? codes.join(',') : JSON.parse(codes.replace(/'/g, '"')).join(',');
    if (Division === "") {
        toastr.error('Please select Division.');
        $("#txtDivision").focus();
    } else if (MinKM === "" ) {
        toastr.error('Please enter Min KM.');
        $("#txtMinKM").focus();
    } else if (MaxKM === "") {
        toastr.error('Please enter Max KM.');
        $("#txtMaxKM").focus();
    } else if (Invoice === "") {
        toastr.error('Please enter Order To Invoice.');
        $("#txtInvoice").focus();
    } else if (Packing === "") {
        toastr.error('Please enter Order To Packing.');
        $("#txtPacking").focus();
    } else if (Dispatch === "") {
        toastr.error('Please enter Order To Dispatch.');
        $("#txtDispatch").focus();
    } else if (Delivered === "") {
        toastr.error('Please enter Order To Delivered.');
        $("#txtDelivered").focus();
    }else if (City === "") {
        toastr.error('Please select City.');
        $("#dropdownButton").focus();
        toggleCityDropdown(true);
    }
    else {
        const payload = {
            Code: $("#hftxtCode").val(),
            Division: Division,
            CityMaster_Code: City,
            MinKM: MinKM,
            MaxKM: MaxKM,
            Invoice: Invoice,
            Packing: Packing,
            Dispatch: Dispatch,
            Delivered: Delivered,
            UserMaster_Code:UserMaster_Code
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveTATConfiguration`,
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
                    TATConfigurationList('Get');
                    BackMaster();
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
async function Edit(Code) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (!hasPermission) {
        toastr.error(msg);
        return;
    }

    $("#tab1").text("EDIT");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#txtbtnsave").prop("disabled", false);
    disableFields(false);
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowTATConfigurationByCode?Code=` + Code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response) {
                $("#hftxtCode").val(response.Code);
                $("#txtDivision").val(response.Division);
                $("#txtMinKM").val(response.MinKM);
                $("#txtMaxKM").val(response.MaxKM);
                $("#txtInvoice").val(response.Invoice);
                $("#txtDispatch").val(response.Dispatch);
                $("#txtPacking").val(response.Packing);
                $("#txtDelivered").val(response.Delivered);
                let codesRaw = response.CityMaster_Codes;
                let codes = [];
                let fixed = codesRaw.trim().replace(/^\[|\]$/g, '').replace(/'/g, '"');
                let finalJson = "[" + fixed + "]";
                codes = JSON.parse(finalJson);
                setTimeout(function () {
                    $('.option').each(function () {
                        if (codes.includes(parseInt($(this).val()))) {
                            $(this).prop('checked', true);
                            updateSelectedText();
                        } else {
                            $(this).prop('checked', false);
                        }
                    });
                }, 300);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function updateSelectedText() {
    let selectedNames = $('.option:checked').map(function () {
        return $(this).data('name');
    }).get().join(', ');
    $('#dropdownButton').val(selectedNames);
}
async function Delete(code, group, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'TAT_Configuration');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this TAT Configuration  ${group} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteTATConfiguration?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    TATConfigurationList('Get');
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:");

            }
        });
    }
    else {
        $('tr').removeClass('highlight');
    }
    $('tr').removeClass('highlight');
}
function ClearData() {
    $("#hftxtCode").val("0");
    $("#txtDispatch").val("");
    $("#txtPacking").val("");
    $("#txtDelivered").val("");
    $("#txtMinKM").val("");
    $("#txtMaxKM").val("");
    $("#txtInvoice").val("");
    $("#txtDivision").val("A");
    $('#dropdownButton').val('');
    $('#selectAll').prop('checked', false);
    toggleCityDropdown(false);
    G_selectedCodes = [];
    $('.option').prop('checked', false);
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "TAT Configuration");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
async function View(code) {
    const { hasPermission, msg } = await CheckOptionPermission('View', UserMaster_Code, UserModuleMaster_Code);
    if (!hasPermission) {
        toastr.error(msg);
        return;
    }

    $("#tab1").text("VIEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowTATConfigurationByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            console.log("View Response:", response);

            if (response) {
                $("#hftxtCode").val(response.Code);
                $("#txtCity").val(response.CityName);
                $("#txtDivision").val(response.Division);
                $("#txtMinKM").val(response.MinKM);
                $("#txtMaxKM").val(response.MaxKM);
                $("#txtInvoice").val(response.Invoice);
                $("#txtDispatch").val(response.Dispatch);
                $("#txtPacking").val(response.Packing);
                $("#txtDelivered").val(response.Delivered);
                $("#txtbtnSave").prop("disabled", true);
                disableFields(true);
                let codesRaw = response.CityMaster_Codes;
                let codes = [];
                let fixed = codesRaw.trim().replace(/^\[|\]$/g, '').replace(/'/g, '"');
                let finalJson = "[" + fixed + "]";
                codes = JSON.parse(finalJson);

                setTimeout(function () {
                    $('.option').each(function () {
                        if (codes.includes(parseInt($(this).val()))) {
                            $(this).prop('checked', true);
                            updateSelectedText();
                        } else {
                            $(this).prop('checked', false);
                        }
                    });
                }, 300);
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
function GetCityMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCityDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let html = '';
                response.forEach(item => {
                    html += `<label>
                    <input type="checkbox" class="option" value="${item.Code}" data-name="${item.Name.trim()}">
                    <span>${item.Name.trim()}</span>
                    </label>`;
                });
                $('#checkboxOptions').html(html);
            }
        },
        error: function () {
            alert('Error loading work types');
        }
    });
}
function updateSelected() {
    let selectedNames = $('.option:checked').map(function () {
        return $(this).data('name');
    }).get().join(', ');
    $('#dropdownButton').val(selectedNames);
}
function GetEmpCodes() {
    G_selectedCodes = [];
    $('.option:checked').each(function () {
        G_selectedCodes.push($(this).val());
    });
    return G_selectedCodes;
}
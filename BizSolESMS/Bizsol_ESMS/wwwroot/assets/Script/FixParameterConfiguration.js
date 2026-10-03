var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
let fixParameterColumns = [];
let fixParameterData = {};
let fixParameterAccessPassword = '';

$(document).ready(function () {
    $("#ERPHeading").text("Fixed Parameter Configuration");
    GetModuleMasterCode();
    verifyFixParameterPageAccess();
});

function hideFixParameterPage() {
    $("#txtCreatepage").hide();
    $("#txtheaderdiv").hide();
}

function getAccessResponseProp(response, name) {
    if (!response) return null;
    if (response[name] != null) return response[name];
    var camelKey = name.charAt(0).toLowerCase() + name.slice(1);
    return response[camelKey];
}

function showFixParameterPasswordPrompt() {
    $('#txtFixParameterAccessPassword').val('');
    var modalEl = document.getElementById('fixParameterPasswordModal');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
        var modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        if (!modalEl.classList.contains('show')) {
            modalInstance.show();
        }
        setTimeout(function () { $('#txtFixParameterAccessPassword').focus(); }, 200);
        return;
    }
    var password = window.prompt('Enter password to access Fix parameter Config.');
    if (password === null) {
        hideFixParameterPage();
        goBackToPreviousMenu();
        return;
    }
    validateFixParameterPassword(String(password || '').trim());
}

function closeFixParameterPasswordAndGoBack() {
    var modalEl = document.getElementById('fixParameterPasswordModal');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    }
    hideFixParameterPage();
    goBackToPreviousMenu();
}

function goBackToPreviousMenu() {
    var currentPath = window.location.pathname + window.location.search;
    var previousUrl = sessionStorage.getItem('esmsPreviousMenuUrl') || '';
    if (previousUrl) {
        try {
            var previousPath = new URL(previousUrl, window.location.origin).pathname + new URL(previousUrl, window.location.origin).search;
            if (previousPath && previousPath !== currentPath) {
                window.location.href = previousUrl;
                return;
            }
        } catch (e) { }
    }

    if (document.referrer && document.referrer !== window.location.href && window.history.length > 1) {
        window.history.back();
        return;
    }

    var menuUrl = (typeof AppBaseURLMenu === 'string' && AppBaseURLMenu)
        ? AppBaseURLMenu
        : (sessionStorage.getItem('AppBaseURLMenu') || '');
    window.location.href = String(menuUrl).replace(/\/$/, '') + '/Dashbord/Dashbord';
}

$(document).on('click', '#btnFixParameterAccessClose', function () {
    closeFixParameterPasswordAndGoBack();
});

$(document).on('click', '#btnFixParameterAccessSubmit', function () {
    validateFixParameterPassword(String($('#txtFixParameterAccessPassword').val() || '').trim());
});

$(document).on('keydown', '#txtFixParameterAccessPassword', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        $('#btnFixParameterAccessSubmit').click();
    }
});

function validateFixParameterPassword(password) {
    if (!password) {
        toastr.warning('Please enter password.');
        showFixParameterPasswordPrompt();
        return;
    }

    $.ajax({
        url: `${appBaseURL}/api/Master/VerifyFixParameterConfigAccess?UserMaster_Code=${UserMaster_Code}&Password=${encodeURIComponent(password)}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var status = getAccessResponseProp(response, 'Status');
            if (status === 'Y') {
                var modalEl = document.getElementById('fixParameterPasswordModal');
                if (modalEl && window.bootstrap && bootstrap.Modal) {
                    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
                }
                fixParameterAccessPassword = password;
                Edit();
                return;
            }

            toastr.error(getAccessResponseProp(response, 'Msg') || 'Access denied.');
            var isBizSolUser = getAccessResponseProp(response, 'IsBizSolUser');
            if (isBizSolUser === 'N') {
                hideFixParameterPage();
                return;
            }
            showFixParameterPasswordPrompt();
        },
        error: function () {
            toastr.error('Failed to verify access.');
            showFixParameterPasswordPrompt();
        }
    });
}

function verifyFixParameterPageAccess() {
    hideFixParameterPage();

    $.ajax({
        url: `${appBaseURL}/api/Master/VerifyFixParameterConfigAccess?UserMaster_Code=${UserMaster_Code}`,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (getAccessResponseProp(response, 'Status') !== 'Y') {
                toastr.error(getAccessResponseProp(response, 'Msg') || 'Don\'t have right to access this page.');
                hideFixParameterPage();
                return;
            }
            showFixParameterPasswordPrompt();
        },
        error: function () {
            toastr.error('Failed to verify access.');
            hideFixParameterPage();
        }
    });
}

function formatColumnLabel(columnName) {
    return String(columnName || '')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .trim();
}

function getFieldValue(data, columnName) {
    if (!data) return '';
    if (data[columnName] != null) return data[columnName];
    var camelKey = columnName.charAt(0).toLowerCase() + columnName.slice(1);
    if (data[camelKey] != null) return data[camelKey];
    return '';
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getColumnName(column) {
    if (typeof column === 'string') return column;
    if (!column) return '';
    return column.columnName || column.ColumnName || '';
}

function isCheckboxColumn(columnName, value) {
    if (/^Is[A-Z]/.test(columnName)) return true;
    var normalized = String(value == null ? '' : value).trim().toUpperCase();
    return normalized === 'Y' || normalized === 'N';
}

function isFixParameterFieldDisabled(columnName) {
    return String(columnName || '').toLowerCase() === 'companyname';
}

function buildFixParameterForm(columns, data) {
    var $container = $("#fixParameterFieldsContainer");
    $container.empty();

    var fieldIndex = 0;

    columns.forEach(function (column) {
        var columnName = getColumnName(column);
        if (!columnName) return;
        if (String(columnName).toLowerCase() === 'id') return;
        if (String(columnName).toLowerCase() === 'companycode') return;

        var fieldId = 'fp_' + columnName;
        var label = formatColumnLabel(columnName);
        var value = getFieldValue(data, columnName);
        var isCheckbox = isCheckboxColumn(columnName, value);
        var isFirstRow = fieldIndex < 3;
        fieldIndex++;

        if (isCheckbox) {
            var checked = String(value).trim().toUpperCase() === 'Y' ? ' checked' : '';
            var checkboxMargin = isFirstRow ? '' : ' style="margin-top:34px;"';
            $container.append(
                '<div class="col-md-4 col-sm-6"' + checkboxMargin + '>' +
                '<input type="checkbox" class="box_border fix-parameter-field BizSolFormControl" id="' + fieldId + '" data-column="' + escapeHtml(columnName) + '" data-checkbox="Y"' + checked + ' />' +
                '<label for="' + fieldId + '" class="col-form-label-sm fw-bold ms-1">' + escapeHtml(label) + '</label>' +
                '</div>'
            );
            return;
        }

        var disabledAttr = isFixParameterFieldDisabled(columnName) ? ' disabled readonly' : '';
        $container.append(
            '<div class="col-md-4 col-sm-6">' +
            '<label for="' + fieldId + '" class="col-form-label-sm fw-bold">' + escapeHtml(label) + '</label>' +
            '<input type="text" class="box_border form-control form-control-sm BizSolFormControl fix-parameter-field" id="' + fieldId + '" data-column="' + escapeHtml(columnName) + '" value="' + escapeHtml(value) + '" autocomplete="off"' + disabledAttr + ' />' +
            '</div>'
        );
    });
}

function collectFixParameterPayload() {
    var payload = {
        Id: $("#hfFixParameterId").val()
    };

    $(".fix-parameter-field").each(function () {
        var columnName = $(this).data("column");
        if (!columnName) return;

        if ($(this).data("checkbox") === "Y") {
            payload[columnName] = $(this).is(":checked") ? "Y" : "N";
        } else {
            payload[columnName] = $(this).val();
        }
    });

    return payload;
}

async function Save() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }

    if (!$("#hfFixParameterId").val() || $("#hfFixParameterId").val() === "0") {
        toastr.error("Fix Parameter record not found.");
        return;
    }

    const payload = collectFixParameterPayload();

    if (!fixParameterAccessPassword) {
        toastr.error('Session expired. Please reopen Fix parameter Config.');
        verifyFixParameterPageAccess();
        return;
    }

    $.ajax({
        url: `${appBaseURL}/api/Master/SaveFixParameter?UserMaster_Code=${UserMaster_Code}&Password=${encodeURIComponent(fixParameterAccessPassword)}`,
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
                if (typeof GetFixparameter === 'function') {
                    GetFixparameter();
                }
                Edit();
            } else {
                toastr.error(response.Msg || 'Fix Parameter update failed.');
            }
        },
        error: function (xhr) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving Fix Parameter.");
        }
    });
}

async function Edit() {
    $("#tab1").text("EDIT");
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/GetFixParameter`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (!Array.isArray(response) || response.length === 0) {
                toastr.error("Fix Parameter record not found.");
                return;
            }

            fixParameterData = response[0];
            fixParameterColumns = Object.keys(fixParameterData || {});

            var idValue = getFieldValue(fixParameterData, 'Id');
            $("#hfFixParameterId").val(idValue || 0);

            if (!fixParameterColumns.length) {
                toastr.error("Fix Parameter columns not found.");
                return;
            }

            buildFixParameterForm(fixParameterColumns, fixParameterData);
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch Fix Parameter data. Please try again.");
        }
    });
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Fixed Parameter Configuration");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}

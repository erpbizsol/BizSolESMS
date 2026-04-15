var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Holiday Master");
    GetCurrentDate();
    ShowHolidayMasterlist("Load");
    $('#txtVacation').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDate").focus();
        }
    });
    GetModuleMasterCode();
});
function ShowHolidayMasterlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetHolidayMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Vacation"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtTable").hide();
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
function Save() {
    var Vacation = $("#txtVacation").val();
    var Date = convertDateFormat($("#txtDate").val());

    if (Vacation == '') {
        toastr.error('Please enter Vacation!');
        $("#txtVacation").focus();
    } else if (Date == '' || Date == undefined || Date == null) {
        toastr.error('Please enter Date!');
        $("#txtDate").focus();
    }
    else {
        const payload = {
            Code : $("#hfCode").val(),
            Vacation : Vacation,
            Date : Date,
            UserMaster_Code: UserMaster_Code
        };
        blockUI();
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveHolidayMaster`,
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
                    ShowHolidayMasterlist('Get');
                    BackMaster();
                }
                else {
                    toastr.error(response[0].Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
                unblockUI();
            }
        });
        unblockUI();
    }
}
async function CreateHolidayMaster() {
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
    $("#hfCode").prop("disabled", false),
    $("#txtVacation").prop("disabled", false),
    $("#txtDate").prop("disabled", false),
    $("#txtsave").prop("disabled", false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#hfCode").prop("disabled", false),
    $("#txtVacation").prop("disabled", false),
    $("#txtDate").prop("disabled", false),
    $("#txtsave").prop("disabled", false);
    $("#txtheaderdiv").hide();
    GetCurrentDate();
    ShowHolidayMasterlist("Load");
}
async function Delete(code,button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this vacation ?`)) {
        blockUI();
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteHolidayMaster?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response[0].Status === 'Y') {
                    toastr.success(response[0].Msg);
                    ShowHolidayMasterlist("Get");
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", Msg);
                unblockUI();
            }
        });
        unblockUI();
    }
    else {
        $('table tr').removeClass('highlight');
    }
    $('tr').removeClass('highlight');
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
    $("#txtheaderdiv").show();
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetHolidayMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item[0].Code),
                $("#txtVacation").val(item[0].Vacation),
                $("#txtDate").val(item[0].Date),
                $("#txtsave").prop("disabled", false)
            } else {
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
function ClearData() {
    $("#hfCode").val("0");
    $("#txtVacation").val("");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Holiday Master");
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
    $("#tab1").text("VIEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetHolidayMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item[0].Code).prop("disabled", true),
                $("#txtVacation").val(item[0].Vacation).prop("disabled", true),
                $("#txtDate").val(item[0].Date).prop("disabled", true),
                $("#txtsave").prop("disabled", true);
            } else {
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
function GetCurrentDate() {
    blockUI();
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                DatePicker(response[0].Date);
            }
            unblockUI();
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            unblockUI();
        }
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function setupDateInputFormatting() {
    $('#txtDate').on('input', function () {
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
            $('#txtDate').val('');

        }
    } else {
        $('#txtDate').val('');

    }
}
function DatePicker(date) {
    $('#txtDate').val(date);
    $('#txtDate').datepicker({
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
                left: inputOffset.left + 'px'
            });
        }, 10);
    });
}
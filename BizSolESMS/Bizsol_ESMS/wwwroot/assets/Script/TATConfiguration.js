
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');

$(document).ready(function () {
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    GetModuleMasterCode();

    $("#ERPHeading").text("TAT Configuration");
    $('#txtCity').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDispatch").focus();
        }
    });
    $('#txtDispatch').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPacking").focus();
        }
    });
    $('#txtPacking').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDelivered").focus();
        }
    });
    $('#txtDelivered').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtbtnSave").focus();
        }
    });
    TATConfigurationList('Load');
    GetCityMasterList();
    $("#txtCity").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtCitylist option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtCitylist").val("")
        }
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
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.ID}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.ID}','${item[`City`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.ID}')"><i class="fa-solid fa fa-eye"></i></button>
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
    //const { haspermission, msg } = await checkoptionpermission('new', usermaster_code, usermodulemaster_code);
    //if (haspermission == false) {
    //    toastr.error(msg);
    //    return;
    //}
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
    var City = $("#txtCity").val();
    var Dispatch = $("#txtDispatch").val();
    var Packing = $("#txtPacking").val();
    var Delivered = $("#txtDelivered").val();
    if (City === "") {
        toastr.error('Please select a City.');
        $("#txtCity").focus();
    } else if (Dispatch === "") {
        toastr.error('Please enter a Dispatch.');
        $("#txtDispatch").focus();
    } else if (Packing === "") {
        toastr.error('Please enter a Packing.');
        $("#txtPacking").focus();
    } else if (Delivered === "") {
        toastr.error('Please enter a Delivered.');
        $("#txtDelivered").focus();
    }
    else {
        const payload = {
            code: $("#hftxtCode").val(),
            CityName: City,
            Packing: Packing,
            Dispatch: Dispatch,
            Delivered: Delivered
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveTATConfiguration?UserMaster_Code=${UserMaster_Code}`,
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
async function Edit(ID) {
    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (!hasPermission) {
        toastr.error(msg);
        return;
    }

    $("#tab1").text("EDIT");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();

    $.ajax({
        url: `${appBaseURL}/api/Master/ShowTATConfigurationByCode?Code=` + ID,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            console.log("API Response:", response); // Optional debug

            if (response && response.ID) {
                $("#hftxtCode").val(response.ID);
                $("#txtCity").val(response.CityName);
                $("#txtDispatch").val(response.Dispatch);
                $("#txtPacking").val(response.Packing);
                $("#txtDelivered").val(response.Delivered);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
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
    $("#txtCity").val("");
    $("#txtDispatch").val("");
    $("#txtPacking").val("");
    $("#txtDelivered").val("");
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
            console.log("View Response:", response); // ✅ Debug output

            if (response && response.ID) {
                $("#hftxtCode").val(response.ID).prop("disabled", true);
                $("#txtCity").val(response.CityName).prop("disabled", true);
                $("#txtDispatch").val(response.Dispatch).prop("disabled", true);
                $("#txtPacking").val(response.Packing).prop("disabled", true);
                $("#txtDelivered").val(response.Delivered).prop("disabled", true);
                $("#txtbtnSave").prop("disabled", true);

                disableFields(true); // ✅ Optional: disables more fields
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
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
                $('#txtCitylist').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtCitylist').html(options);
            } else {
                $('#txtCitylist').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCitylist').empty();
        }
    });
}
function disableFields(disable) {
    $("#txtCreatepage,#txtbtnSave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
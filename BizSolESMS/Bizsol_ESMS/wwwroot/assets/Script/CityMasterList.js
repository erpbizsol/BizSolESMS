
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("City");
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $('#txtCityName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPinCode").focus();
        }
    });
    $('#txtPinCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtStateName").focus();
        }
    });
    $('#txtStateName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    ShowCityMasterlist();
    GetGroupMasterList();
    $("#txtStateName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtStateNameList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtStateNameList").val("")
        }
    });
    GetModuleMasterCode();
});
function ShowCityMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowCityMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtCityTable").show();
                const StringFilterColumn = ["City Name","State Name"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code","CountryName"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "Qty In Box": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`City Name`]}')"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtCityTable").hide();
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function Save() {
    var CityName = $("#txtCityName").val();
    var PinCode = $("#txtPinCode").val();
    var StateName = $("#txtStateName").val();

    if (!CityName) {
        toastr.error('Please enter an City Name!');
        $("#txtCityName").focus();
    } else if (!PinCode) {
        toastr.error('Please enter an Pin Code!');
        $("#txtPinCode").focus();
    }
    else if (!StateName) {
        toastr.error('Please enter an State Name!');
        $("#txtStateName").focus();
    }
    else {
        const payload = {
            Code: $("#hfCode").val(),
            CityName: $("#txtCityName").val(),
            PinCode: $("#txtPinCode").val(),
            StateName: $("#txtStateName").val()
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertCityMaster`,
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
                    ShowCityMasterlist();
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
async  function CreateCityMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#hfCode").prop("disabled", false),
    $("#txtCityName").prop("disabled", false),
    $("#txtPinCode").prop("disabled", false),
    $("#txtStateName").prop("disabled", false),
    $("#txtsave").prop("disabled", false);

}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#hfCode").prop("disabled", false),
    $("#txtCityName").prop("disabled", false),
    $("#txtPinCode").prop("disabled", false),
    $("#txtStateName").prop("disabled", false),
    $("#txtsave").prop("disabled", false);
}
async function deleteItem(code, city) {
    $('table').on('click', 'tr', function () {
        $('table tr').removeClass('highlight');
        $(this).addClass('highlight');
    });
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'citymaster');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this city? ${city}`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteCityMaster?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowCityMasterlist();
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
        url: `${appBaseURL}/api/Master/ShowCityMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                $("#txtCityName").val(item.CityName),
                $("#txtPinCode").val(item.PinCode),
                $("#txtStateName").val(item.StateName),
                $("#txtsave").prop("disabled", false)
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function GetGroupMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetStateDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtStateNameList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtStateNameList').html(options);
            } else {
                $('#txtStateNameList').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#txtCountryNameList').empty();
        }
    });
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtCityName").val("");
    $("#txtPinCode").val("");
    $("#txtStateName").val("");

}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "City Master");
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
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowCityMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code).prop("disabled", true),
                $("#txtCityName").val(item.CityName).prop("disabled", true),
                $("#txtPinCode").val(item.PinCode).prop("disabled", true),
                $("#txtStateName").val(item.StateName).prop("disabled", true),
                $("#txtsave").prop("disabled", true);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
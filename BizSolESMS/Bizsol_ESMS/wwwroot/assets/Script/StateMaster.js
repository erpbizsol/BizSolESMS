﻿var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("State Master");
    $(".Number").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $('#txtStateCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtStateName").focus();
        }
    });
    $('#txtStateName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtCountryName").focus();
        }
    });
    $('#txtCountryName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    ShowStateMasterlist('Load');
    GetGroupMasterList();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
    $("#txtCountryName").on("change", function () {
        let value = $(this).val();
        let isValid = false;
        $("#txtCountryNameList option").each(function () {
            if ($(this).val() === value) {

                isValid = true;
                return false;
            }
        });
        if (!isValid) {
            $(this).val("");
            $("#txtCountryNameList").val("")
        }
    });
    GetModuleMasterCode();
});
function ShowStateMasterlist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowStateMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtstate").show();
              
                const StringFilterColumn = ["State Name","Countery Name"];
                const NumericFilterColumn = ["Reorder Level", "Reorder Qty", "Qty In Box"];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Reorder Level": 'right',
                    "Reorder Qty": 'right',
                    "Qty In Box": 'right',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}','${item[`State Name`]}',this)"><i class="fa-regular fa-circle-xmark"></i></button>
                    <button class="btn btn-primary icon-height mb-1"  title="View" onclick="View('${item.Code}')"><i class="fa-solid fa fa-eye"></i></button>
                    `
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtstate").hide();
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
    var CountryName = $("#txtCountryName").val();
    var StateName = $("#txtStateName").val();
    var StateCode = $("#txtStateCode").val();

    if (!StateCode) {
        toastr.error('Please enter an State Code!');
        $("#txtStateCode").focus();
    } else if (!StateName) {
        toastr.error('Please enter a State Name!');
        $("#txtStateName").focus();
    } else if (!CountryName) {
        toastr.error('Please select a Country Name!');
        $("#txtCountryName").focus();
    }
    else {
        const payload = {
            Code: $("#hfCode").val(),
            StateCode: $("#txtStateCode").val(),
            StateName: $("#txtStateName").val(),
            CountryName: $("#txtCountryName").val()
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertStateMaster?UserMaster_Code=${UserMaster_Code}`,
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
                    ShowStateMasterlist('Get');
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
async function deleteItem(code, state, button) {
    let tr = button.closest("tr");
    tr.classList.add("highlight");
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        $('tr').removeClass('highlight');
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'statemaster');
    if (Status == true) {
        toastr.error(msg1);
        $('tr').removeClass('highlight');
        return;
    }
    if (confirm(`Are you sure you want to delete this state ${state} ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteStateMaster?Code=${code}&UserMaster_Code=${UserMaster_Code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowStateMasterlist('Get');
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
        url: `${appBaseURL}/api/Master/ShowStateMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                $("#txtStateCode").val(item.StateCode),
                $("#txtStateName").val(item.StateName),
                $("#txtCountryName").val(item.CountryName),
                $("#txtsave").prop("disabled", false),
                $("#txtheaderdiv").show();
                disableFields(false);
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
        url: `${appBaseURL}/api/Master/GetCountryDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $('#txtCountryNameList').empty();
                let options = '';
                response.forEach(item => {
                    options += '<option value="' + item.Name + '" text="' + item.Code + '"></option>';
                });
                $('#txtCountryNameList').html(options);
            } else {
                $('#txtCountryNameList').empty();
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
    $("#txtCountryName").val("");
    $("#txtStateName").val("");
    $("#txtStateCode").val("");

}
async function CreateStateMaster() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtheaderdiv").show();
    $("#txtCreatepage").show();
    $("#hfCode").val(item.Code).prop("disabled", false),
    $("#txtStateCode").val(item.StateCode).prop("disabled", false),
    $("#txtStateName").val(item.StateName).prop("disabled", false),
    $("#txtCountryName").val(item.CountryName).prop("disabled", false),
    $("#txtsave").prop("disabled", false);
    disableFields(false);
    
  
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#hfCode").val(item.Code).prop("disabled", false),
    $("#txtStateCode").val(item.StateCode).prop("disabled", false),
    $("#txtStateName").val(item.StateName).prop("disabled", false),
    $("#txtCountryName").val(item.CountryName).prop("disabled", false),
    $("#txtsave").prop("disabled", false);
    $("#txtheaderdiv").hide();
    disableFields(false);
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "State Master");
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
        url: `${appBaseURL}/api/Master/ShowStateMasterByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code).prop("disabled", true),
                    $("#txtStateCode").val(item.StateCode).prop("disabled", true),
                    $("#txtStateName").val(item.StateName).prop("disabled", true),
                    $("#txtCountryName").val(item.CountryName).prop("disabled", true),
                    $("#txtsave").prop("disabled", true),
                    $("#txtheaderdiv").show();
                    disableFields(true);
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
    $("#txtCreatepage,#txtsave").not("#btnBack").prop("disabled", disable).css("pointer-events", disable ? "none" : "auto");
}
function DataExport() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowStateMaster`,
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
function Export(jsonData) {
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
    XLSX.writeFile(wb, "StateMaster.xlsx");
}

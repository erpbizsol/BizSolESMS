﻿var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
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
                const StringFilterColumn = ["Item Name", "Display Name", "Category Name", "Group Name", "Sub Group Name", "Brand Name", "Location Name"];
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
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="deleteItem('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
                }));
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
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
function CreateCityMaster() {
    $("#txtListpage").hide();
    $("#txtCreatepage").show();

}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();

}
function deleteItem(code) {
    if (confirm("Are you sure you want to delete this item?")) {
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
function Edit(code) {
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
                $("#txtStateName").val(item.StateName)
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
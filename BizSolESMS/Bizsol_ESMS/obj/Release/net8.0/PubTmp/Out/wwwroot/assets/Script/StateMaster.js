var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("State");
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
    ShowStateMasterlist();
    GetGroupMasterList();
    $('#exportExcel').click(function () {
        exportTableToExcel();
    });
   
});
function ShowStateMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowStateMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
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
            url: `${appBaseURL}/api/Master/InsertStateMaster`,
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
                    ShowStateMasterlist();
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
function CreateStateMaster() {
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
            url: `${appBaseURL}/api/Master/DeleteStateMaster?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowStateMasterlist();
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
                $("#txtCountryName").val(item.CountryName)
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




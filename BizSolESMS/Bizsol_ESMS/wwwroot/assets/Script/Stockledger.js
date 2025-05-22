var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let G_GroupList = [];
let G_SubGroupList = [];
$(document).ready(function () {
    DatePicker();
    $("#ERPHeading").text("Stock Ledger");
    GetModuleMasterCode();
    GetItemMasterList();
    GetGroupMasterList();
    GetSubGroupMasterBlank();
    GetReportType();
    $("#ddlGroup").on("change", function (e) {
        var Code = $(this).val();
        const item = G_GroupList.find(entry => entry["Code"] == Code);
        if (item) {
            GetSubGroupMasterList(item["Name"]);
        } else {
            $("#ddlSubGroup").empty();
            GetSubGroupMasterBlank();
        }
    });
    $("#ddlSubGroup").on("change", function (e) {
        var Code = $(this).val();
        var GroupCode = $("#ddlGroup").val();
        const item = G_SubGroupList.find(entry => entry["Code"] == Code);
        const GroupItem = G_GroupList.find(entry => entry["Code"] == GroupCode);
        if (item !== undefined && GroupItem == undefined) {
            ShowItemMasterlist(0,item["Sub Group Name"]);
        } if (item == undefined && GroupItem !== undefined) {
            ShowItemMasterlist(GroupItem["Name"],0 );
        } if (item !== undefined && GroupItem !== undefined) {
            ShowItemMasterlist(GroupItem["Name"], item["Sub Group Name"]);
        } else {
            $("#ddlItemName").empty();
            GetItemMasterList();
        }
    });
    $("#txtShow").on("click", function () {
        GetStockLedger();
    });
});
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "TAT Report");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function setupDateInputFormatting() {
    $('#txtFromDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);
        if (value.length === 10) {
            validateFromDate(value);
        } else {
            $(this).val(value);
        }
    });
    $('#txtToDate').on('input', function () {
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
            $('#txtToDate').val('');

        }
    } else {
        $('#txtToDate').val('');

    }
}
function validateFromDate(value) {
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
            $('#txtFromDate').val('');
        }
    } else {
        $('#txtFromDate').val('');
    }
}
function DatePicker() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        method: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            let apiDate = response[0].Date;
            let parts = apiDate.split('/');
            if (parts.length !== 3) return;
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2], 10);
            if (year < 100) {
                year += 2000;
            }
            let firstDateOfMonth = new Date(year, month, 1);
            let formattedDate = ('0' + firstDateOfMonth.getDate()).slice(-2) + '/' +
                ('0' + (firstDateOfMonth.getMonth() + 1)).slice(-2) + '/' +
                firstDateOfMonth.getFullYear();
            $('#txtFromDate').val(formattedDate);
            $('#txtToDate').val(apiDate);
            $('#txtFromDate, #txtToDate').datepicker({
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

            $('#txtDate').on('change', function () {
                let selectedDate = $(this).val();
                GetTATReportList('GET', selectedDate);
            });
        },
        error: function () {
            console.error('Failed to fetch the date from the API.');
        }
    });
}
function GetGroupMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetDropDown`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                G_GroupList = response;
                let option = '<option value="0">All</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["Name"] + '</option>';
                });

                $('#ddlGroup')[0].innerHTML = option;

                $('#ddlGroup').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#ddlGroup').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#ddlGroup').empty();
        }
    });
}
function GetSubGroupMasterList(GroupName) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowSubGroupByGroupName?GroupName=${GroupName}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="0">All</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["SubGroupName"] + '</option>';
                });

                $('#ddlSubGroup')[0].innerHTML = option;

                $('#ddlSubGroup').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#ddlSubGroup').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#ddlSubGroup').empty();
        }
    });
}
function GetSubGroupMasterBlank() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowSubGroupMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                G_SubGroupList = response;
                let option = '<option value="0">All</option>';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["Sub Group Name"] + '</option>';
                });

                $('#ddlSubGroup')[0].innerHTML = option;

                $('#ddlSubGroup').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#ddlSubGroup').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#ddlSubGroup').empty();
        }
    });
}
function GetItemMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetItemDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["Code"] + '">' + val["ItemName"] + '(' + val["ItemCode"]+')' + '</option>';
                });

                $('#ddlItemName')[0].innerHTML = option;

                $('#ddlItemName').select2({
                    width: '-webkit-fill-available'
                });
            } else {
                $('#ddlItemName').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#ddlItemName').empty();
        }
    });
} 
function GetReportType() {
    $.ajax({
        url: `${appBaseURL}/api/Report/GetReportType?ModuleDesp=Stock Ledger`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                var option = '';
                $.each(response, function (key, val) {

                    option += '<option value="' + val["DisplayName"] + '">' + val["DisplayName"] +'</option>';
                });

                $('#ddlReportType')[0].innerHTML = option;

               
            } else {
                $('#ddlReportType').empty();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            $('#ddlReportType').empty();
        }
    });
}
function DataExport() {
    var TATDate = convertDateFormat($("#txtDate").val());
    if ($("#txtDate").val() == '') {
        toastr.error("Please select date !");
        $("#txtDate").focus();
        return;
    }
    $.ajax({
        url: `${appBaseURL}/api/OrderMaster/GetTATReportList?TATDate=${TATDate}&Type=EXPORT`,
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
    var date = $("#txtDate").val();
    var ws = XLSX.utils.json_to_sheet(jsonData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "TATReport_" + date + ".xlsx");
}
function GetStockLedger() {
    var GroupMaster_Code = $("#ddlGroup").val();
    var SubGroupMaster_Code = $("#ddlSubGroup").val();
    var ItemMaster_Code = $("#ddlItemName").val();
    var FromDate = $("#txtFromDate").val();
    var ToDate = $("#txtToDate").val();
    var ReportType = $("#ddlReportType").val();
    if (GroupMaster_Code == '' || GroupMaster_Code == null) {
        toastr.error("Please select group!");
        $("#ddlGroupMaster").focus();
        return;
    } else if (SubGroupMaster_Code == '' || SubGroupMaster_Code == null) {
        toastr.error("Please select subgroup!");
        $("#ddlSubGroupMaster").focus();
        return;
    } else if (ItemMaster_Code == '' || ItemMaster_Code == null) {
        toastr.error("Please select item!");
        $("#ddlItemMaster").focus();
        return;
    } else if (FromDate == '' || FromDate == null) {
        toastr.error("Please select from date !");
        $("#txtFromDate").focus();
        return;
    } else if (ToDate == '' || ToDate == null) {
        toastr.error("Please select to date !");
        $("#txtFromDate").focus();
        return;
    } else if (ReportType == '' || ReportType == null) {
        toastr.error("Please select to report type !");
        $("#ddlReportType").focus();
        return;
    }
    const payload = {
        GroupMaster: GroupMaster_Code,
        SubGroupMaster: SubGroupMaster_Code,
        ItemMaster_Code: ItemMaster_Code,
        FromDate: convertDateFormat(FromDate),
        ToDate: convertDateFormat(ToDate),
        ReportType: ReportType,
    }
    $.ajax({
        url: `${appBaseURL}/api/Report/GetStockLedgerList`,
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                    $("#tblStockLedger").show();
                    const StringFilterColumn = [];
                    const NumericFilterColumn = ["Qty"];
                    const DateFilterColumn = [];
                    const Button = false;
                    const showButtons = [];
                    const StringdoubleFilterColumn = ["Item Name", "Item Code", "Item Bar Code"];
                    let hiddenColumns = [];
                    const ColumnAlignment = {
                        Qty: "right"
                    };
                    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
                } else {
                    toastr.error("Record not found...!");
                $("#tblStockLedger").hide();
            }
        },
        error: function (xhr, status, error) {
            $("#tblStockLedger").hide();
        }
    });

}
function ShowItemMasterlist(Group, SubGroup) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowItemMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                let option = '<option value="">Select Item</option>';
                let filteredItems = [];

                if (Group === '0' && SubGroup !== '0') {
                    filteredItems = response.filter(entry => entry["Sub Group Name"] === SubGroup);
                } else if (Group !== '0' && SubGroup === '0') {
                    filteredItems = response.filter(entry => entry["Group Name"] === Group);
                } else if (Group !== '0' && SubGroup !== '0') {
                    filteredItems = response.filter(entry =>
                        entry["Group Name"] === Group && entry["Sub Group Name"] === SubGroup
                    );
                } else {
                    filteredItems = response; 
                }
                $.each(filteredItems, function (key, val) {
                    option += `<option value="${val["Code"]}">${val["ItemName"]} (${val["ItemCode"]})</option>`;
                });

                $('#ddlItemName').html(option).trigger('change');

                $('#ddlItemName').select2({
                    width: '100%'
                });
            } else {
                $('#ddlItemName').empty().trigger('change');
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}


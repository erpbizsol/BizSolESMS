var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');

$(document).ready(function () {
    $("#ERPHeading").text("Item Config");
    $('#txtItemName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItembarcode").focus();
        }

    });

    $('#txtItembarcode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtGroupItem").focus();
        }
    });
    $('#txtGroupItem').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtSubGroupItem").focus();
        }
    });
    $('#txtSubGroupItem').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItemLocation").focus();
        }
    });
    $('#txtItemLocation').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtItemCode").focus();
        }
    });
    $('#txtItemCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
    
    Edit();
    GetModuleMasterCode();
});
function BackMaster() {
    $("#txtCreatepage").show();
    $("#txtheaderdiv").hide();
    window.location.href = `${AppBaseURLMenu}/Master/ItemMasterList`;
}

async function Save() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    
 
    //var ItemName = $("#txtItemName").val();
    //var Itembarcode = $("#txtItembarcode").val();
    //var GroupItem = $("#txtGroupItem").val();
    //var SubGroupItem = $("#txtSubGroupItem").val();
    //var ItemLocation = $("#txtItemLocation").val();
    //if (!ItemName) {
    //    toastr.error('Please enter an Item Name!');
    //    $("#txtItemName").focus();
    //} else if (txtItembarcode ="") {
    //    toastr.error('Please enter Item bar code!');
    //    $("#txtItembarcode").focus();
    //}
    //else if (GroupItem = "") {
    //    toastr.error('Please enter Group Item!');
    //    $("#txtGroupItem").focus();
    //}
    //else if (SubGroupItem = "") {
    //    toastr.error('Please enter Sub Group Item!');
    //    $("#txtSubGroupItem").focus();
    //}
    //else if (ItemLocation = "") {
    //    toastr.error('Please enter  Location Item!');
    //    $("#txtItemLocation").focus();
    //}
    /* else {*/
        const payload = {
            Code: $("#hfCode").val(),
            ItemNameHeader: $("#txtItemName").val(),
            ItembarcodeHeader : $("#txtItembarcode").val(),
            GroupItemHeader: $("#txtGroupItem").val(),
            SubGroupItemHeader: $("#txtSubGroupItem").val(),
            LocationItemHeader: $("#txtItemLocation").val(),
            itemCode: $("#txtItemCode").val(),
            itemCodeHeader: $("#txtItemCodeHeader").val(),
            MRPNo: $("#txtMRPNo").val(),
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/SaveConfig`,
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

    //}
}

async function Edit() {
    $("#tab1").text("NEW");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowItemConfig`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (items) {
           
            if (Array.isArray(items) && items.length > 0) {
                items.forEach(function (item, index) {
                    if (index === 0) {
                        $("#hfCode").val(item.Code || "");
                        $("#txtItemName").val(item.ItemNameHeader || "");
                        $("#txtItembarcode").val(item.ItembarcodeHeader || "");
                        $("#txtGroupItem").val(item.GroupItemHeader || "");
                        $("#txtSubGroupItem").val(item.SubGroupItemHeader || "");
                        $("#txtItemLocation").val(item.SubLocationItemHeader || "");
                        $("#txtItemCode").val(item.ItemCode);
                        $("#txtItemCodeHeader").val(item.ItemCodeHeader);
                        $("#txtMRPNo").val(item.MRPNo);
                    } 
                });
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch item data. Please try again.");
        }
    });
}

function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Item Config");
    if (result) {
        UserModuleMaster_Code = result.Code;
    }
}

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');

$(document).ready(function () {
    $("#ERPHeading").text("Account Master");
    $('#txtAccountName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtDisplayName").focus();
        }
    });
    $('#txtDisplayName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPANNo").focus();
        }
    });
    $('#txtPANNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtIsClient").focus();
        }
    });
    $('#txtIsClient').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtIsVendor").focus();
        }
    });
    $('#txtIsVendor').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtIsMSME").focus();
        }
    });
    $('#txtIsMSME').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtsave").focus();
        }
    });
   ShowAccountMasterlist();
});

function ShowAccountMasterlist() {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowAccountMaster`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["Account Name","Display Name"];
                const NumericFilterColumn = [];
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
    var AccountName = $("#txtAccountName").val();
    if (!AccountName) {
        toastr.error('Please enter an Account Name!');
        $("#txtAccountName").focus();
    } else {
        const payload = {
            Code: $("#hfCode").val(),
            AccountName: $("#txtAccountName").val(),
            DisplayName: $("#txtDisplayName").val(),
            PANNo: $("#txtPANNo").val(),
            IsClient: $("#txtIsClient").val(),
            IsVendor: $("#txtIsVendor").val(),
            IsMSME: $("#txtIsMSME").val()
        };
        $.ajax({
            url: `${appBaseURL}/api/Master/InsertAccountMaster`,
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
                    ShowAccountMasterlist();
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
function CreateItemMaster() {
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
            url: `${appBaseURL}/api/Master/DeleteAccountMaster?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowAccountMasterlist();
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
        url: `${appBaseURL}/api/Master/ShowAccountMasterByCode?Code=` + code,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                    $("#txtAccountName").val(item.AccountName),
                    $("#txtDisplayName").val(item.DisplayName),
                    $("#txtPANNo").val(item.PANNo),
                    $("#txtIsMSME").val(item.IsMSME),
                    $("#txtIsClient").val(item.IsClient),
                    $("#txtIsVendor").val(item.IsVendor)
                 
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
//function openTab(event, tabId) {
//    const tabs = document.querySelectorAll('.tab-header div');
//    const contents = document.querySelectorAll('.tab-content');

//    tabs.forEach(tab => tab.classList.remove('active'));
//    contents.forEach(content => content.classList.remove('active'));

//    event.currentTarget.classList.add('active');
//    document.getElementById(tabId).classList.add('active');
//}

function updateDisplayName() {
    const itemName = document.getElementById('txtAccountName').value;
    document.getElementById('txtDisplayName').value = itemName;
}


document.getElementById("saveTab1").addEventListener("click", function () {
    const accountName = document.getElementById("accountName").value.trim();
    const displayName = document.getElementById("displayName").value.trim();
    const panNo = document.getElementById("panNo").value.trim();
    if (!accountName || !displayName || !panNo) {
        alert("Please fill in all required fields before saving.");
        return;
    }
    const tab2 = document.getElementById("tab2");
    tab2.disabled = false;

    tab2.classList.add("active");
    document.getElementById("tab1Content").style.display = "none";
    document.getElementById("tab2Content").style.display = "block";

    document.getElementById("tab1").classList.remove("active");
    tab2.classList.add("active");
});

document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function () {
        if (tab.disabled) return;
        document.querySelectorAll(".tab-content").forEach(content => {
            content.style.display = "none";
        });
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const contentId = tab.id + "Content";
        document.getElementById(contentId).style.display = "block";
    });
});

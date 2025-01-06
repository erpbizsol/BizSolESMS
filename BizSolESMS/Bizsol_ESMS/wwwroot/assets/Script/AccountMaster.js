
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
//function Save() {
//    var AccountName = $("#txtAccountName").val();
//    if (!AccountName) {
//        toastr.error('Please enter an Account Name!');
//        $("#txtAccountName").focus();
//    } else {
//        const payload = {
//            Code: $("#hfCode").val(),
//            AccountName: $("#txtAccountName").val(),
//            DisplayName: $("#txtDisplayName").val(),
//            PANNo: $("#txtPANNo").val(),
//            IsClient: $("#txtIsClient").val(),
//            IsVendor: $("#txtIsVendor").val(),
//            IsMSME: $("#txtIsMSME").val()
//        };
//        $.ajax({
//            url: `${appBaseURL}/api/Master/InsertAccountMaster`,
//            type: 'POST',
//            contentType: 'application/json',
//            dataType: 'json',
//            data: JSON.stringify(payload),
//            beforeSend: function (xhr) {
//                xhr.setRequestHeader('Auth-Key', authKeyData);
//            },
//            success: function (response) {
//                if (response.Status === 'Y') {
//                    setTimeout(() => {
//                        toastr.success(response.Msg);
//                        ShowAccountMasterlist();
//                        enableAndSwitchToSecondTab(); // Enable and open the second tab
//                    }, 1000);
                    
//                }
//                else {
//                    toastr.error(response.Msg);
//                }
//            },
//            error: function (xhr, status, error) {
//                console.error("Error:", xhr.responseText);
//                toastr.error("An error occurred while saving the data.");
//            }
//        });

//    }
//}
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

function updateDisplayName() {
    const itemName = document.getElementById('txtAccountName').value;
    document.getElementById('txtDisplayName').value = itemName;
}

document.addEventListener("DOMContentLoaded", () => {
    // Function to enable and switch to the second tab
    window.enableAndSwitchToSecondTab = function () {
        const tab2 = document.getElementById("tab2");
        const tab1 = document.getElementById("tab1");
        const tab2Content = document.getElementById("tab2Content");
        const tab1Content = document.getElementById("tab1Content");

        if (!tab2 || !tab1 || !tab2Content || !tab1Content) {
            console.error("One or more tabs or contents are missing in the DOM.");
            return;
        }

        tab2.removeAttribute("disabled");
        tab2.classList.add("active");
        tab2Content.style.display = "block";
        tab2Content.classList.add("active");

        tab1.classList.remove("active");
        tab1Content.style.display = "none";
        tab1Content.classList.remove("active");
    };

    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    if (tabs.length === 0 || contents.length === 0) {
        console.error("No tabs or contents found in the DOM.");
        return;
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            if (tab.hasAttribute("disabled")) return;

            tabs.forEach((t) => t.classList.remove("active"));
            contents.forEach((content) => {
                content.classList.remove("active");
                content.style.display = "none";
            });

            tab.classList.add("active");
            const contentId = tab.id + "Content";
            const content = document.getElementById(contentId);
            if (content) {
                content.style.display = "block";
                content.classList.add("active");
            } else {
                console.error(`Content for ${contentId} not found.`);
            }
        });
    });
});

function Save() {
    const AccountName = $("#txtAccountName").val();
    const DisplayName = $("#txtDisplayName").val();
    if (!AccountName) {
        toastr.error("Please enter an Account Name!");
        $("#txtAccountName").focus();
    } else if (!DisplayName) {
        toastr.error("Please enter an Display Name!");
        $("#txtDisplayName").focus();
    }
    else {
        const payload = {
            Code: $("#hfCode").val(),
            AccountName: AccountName,
            DisplayName: $("#txtDisplayName").val(),
            PANNo: $("#txtPANNo").val(),
            IsClient: $("#txtIsClient").val(),
            IsVendor: $("#txtIsVendor").val(),
            IsMSME: $("#txtIsMSME").val(),
        };

        $.ajax({
            url: `${appBaseURL}/api/Master/InsertAccountMaster`,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(payload),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Auth-Key", authKeyData);
            },
            success: function (response) {
                if (response.Status === "Y") {
                    setTimeout(() => {
                        toastr.success(response.Msg);
                        window.enableAndSwitchToSecondTab(); // Call the function
                        ShowAccountMasterlist();
                    }, 1000);
                } else {
                    toastr.error(response.Msg);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            },
        });
    }
}

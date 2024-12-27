var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("User Menu Rights");
    UserMenuRightsList();
    GetUserGroupMasterList();
    populateTable();

});
function UserMenuRightsList() {
    $.ajax({
        url: `${appBaseURL}/api/UserMaster/GetUserModuleMasterList`,
        type: 'GET',
        success: function (response) {
            if (response.length > 0) {
               
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function GetUserGroupMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserGroupMasterList`,
        type: 'GET',
        success: function (response) {
            if (response.length > 0) {
                $.ajax({
                    url: `${appBaseURL}/api/UserMaster/GetUserModuleMasterList`,
                    type: 'GET',
                    success: function (Result) {
                        if (Result.length > 0) {
                            populateTable(response, Result)
                        } else {
                            toastr.error("Record not found...!");
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error("Error:", error);
                    }
                });
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
//function populateTable(response, Result) {
//    const tableBody = $("#table-header");
//    let tr = "<tr>";

//    response.forEach(rowData => {
//        tr += `<th>${rowData["Group Name"]}</th>`;
//    });

//    tr += "</tr>";
//    tableBody.html(tr);
//}
function populateTable(response, Result) {
    const tableHeader = $("#table-header");
    const tableBody = $("#table-body"); // Assuming you have a tbody with id 'table-body'

    // Create table header
    let headerRow = "<tr>";
        headerRow += `<th>Module description</th>`;
    response.forEach(rowData => {
        headerRow += `<th>${rowData["Group Name"]}</th>`;
    });
    headerRow += "</tr>";
    tableHeader.html(headerRow);
    let bodyContent = "";
    Result.forEach(rowData => {
        bodyContent += "<tr>";
        bodyContent += `<td><button class="toggle-btn" data-index="">+</button>${rowData["ModuleDesp"]}</td>`;
        response.forEach(header => {
            const key = header["Group Name"];
            bodyContent += `<td><input type="checkbox"/></td>`;
        });
        bodyContent += "<td>";
        var OptionDescriptions = rowData["OptionDescriptions"]
        OptionDescriptions.split(", ").forEach(option => {
            bodyContent += `<button class="action-btn" data-action="${option.toLowerCase()}">${option}</button>`;
        });
        bodyContent += "</td>";

        bodyContent += "</tr>";
    });
    tableBody.html(bodyContent);
}






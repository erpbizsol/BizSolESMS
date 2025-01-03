var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("User Menu Rights");
    UserMenuRightsList();
    GetUserGroupMasterList();
    populateTable();
});
function GetUserListByGroupCode(Code) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserMasterListByGroupCode?Code=${Code}`,
        type: 'GET',
        success: function (response) {
            if (response.length > 0) {
                $("#txtUserName").show();
                $("#txtUserName").text(response[0].UserName);
            } else {
                $("#txtUserName").hide();
                $("#txtUserName").text('');
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
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $.ajax({
                    url: `${appBaseURL}/api/UserMaster/GetUserModuleMasterList`,
                    type: 'GET',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Auth-Key', authKeyData);
                    },
                    success: function (Result) {
                        if (Result.length > 0) {
                            populateTable(response, Result);
                            GetUserOptionsDetails();
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

let result = [];
let options = [];
function populateTable(response, Result) {
    const tableHeader = $("#table-header");
    const tableBody = $("#table-body");
    result = Result;
    let headerRow = "<tr>";
    headerRow += `<th>Module Description</th>`;
    response.forEach(rowData => {
        headerRow += `<th onclick="GetUserListByGroupCode(${rowData["Code"]})">${rowData["Group Name"]}</th>`;
    });
    headerRow += "</tr>";
    tableHeader.html(headerRow);
    let tableRows = "";
    Result.forEach(rowData => {
        options = rowData.OptionDescriptions;
        if (rowData.MasterModuleCode === 0) {
            tableRows += createRow(rowData, response, 0, Result);
            tableRows += getChildRows(Result, rowData.Code, response, 20);
        }
    });

    tableBody.html(tableRows);
    $(".toggle-icon").on("click", function () {
        const code = $(this).data("code"); // Current row's code
        const childRows = $(`.child-row-${code}`);
        const subChildRows = $(`.sub-child-row-${code}`);
        const subChildOfChildRows = $(`.child-of-child-row-${code}`);

        if ($(this).hasClass("fa-plus")) {
            // Expand current row and its direct children
            $(this).removeClass("fa-plus").addClass("fa-minus");
            childRows.show();
            subChildRows.show();
            subChildOfChildRows.show();
        } else {
            // Collapse current row and all nested children
            $(this).removeClass("fa-minus").addClass("fa-plus");
            collapseChildren(code);
        }
    });
    function collapseChildren(parentCode) {
        const childRows = $(`.child-row-${parentCode}`);
        const subChildRows = $(`.sub-child-row-${parentCode}`);
        const subChildOfChildRows = $(`.child-of-child-row-${parentCode}`);

        // Hide all child rows
        childRows.hide();
        subChildRows.hide();
        subChildOfChildRows.hide();

        // Reset toggle icons for all children
        childRows.find(".toggle-icon").removeClass("fa-minus").addClass("fa-plus");
        subChildRows.find(".toggle-icon").removeClass("fa-minus").addClass("fa-plus");
        subChildOfChildRows.find(".toggle-icon").removeClass("fa-minus").addClass("fa-plus");

        // Recursively collapse deeper levels
        childRows.each(function () {
            const childCode = $(this).data("code");
            collapseChildren(childCode); // Collapse all nested children
        });
    }
    }
function createRow(rowData, response, paddingLeft, Result) {
    let row = `
        <tr class="${paddingLeft === 0 ? "parent-row" : `child-row child-row-${rowData.MasterModuleCode}`}" 
            data-code="${rowData.Code}" 
            style="${paddingLeft > 0 ? "display: none;" : ""}">
            <td style="padding-left: ${paddingLeft}px !important;">
                ${rowData.MasterModuleCode === 0 || rowData.OptionDescriptions  ? `
                <label style="cursor: pointer;">
                    <i class="fa fa-plus toggle-icon" data-code="${rowData.Code}"></i>
                </label>` : ""}
                ${rowData.ModuleDesp}
            </td>`;

    response.forEach(response => {
        row += `<td><input type="checkbox" id="chk_${rowData.Code}_${response['Code']}" class="chk_${rowData.MasterModuleCode}_${response['Code']}" onclick="checkbox(this)"/></td>`;
    });

    row += `</tr>`;

    if (rowData.OptionDescriptions && !isParent(rowData.Code)) {
        let optionsArray = rowData.OptionDescriptions.split(",").map(option => option.trim());

        optionsArray.forEach(option => {
            row += `
            <tr class="child-of-child-row child-of-child-row-${rowData.Code}" 
                style="display: none;" 
                data-child-code="${rowData.Code}">
                <td style="padding-left: ${paddingLeft + 30}px !important;">${option}</td>`;

            response.forEach(response => {
                row += `<td><input type="checkbox" id="chk_${rowData.Code}_${response['Code']}_${option}" class="chk_${rowData.MasterModuleCode}_${response['Code']} chk_${rowData.Code}_${response['Code']}" onclick="checkbox1(this)"/></td>`;
            });

            row += `</tr>`;
        });
    }

    return row;
}
function getChildRows(data, parentCode, response, paddingLeft) {
    let childRows = "";
    data.forEach(rowData => {
        if (rowData.MasterModuleCode === parentCode) {
            childRows += createRow(rowData, response, paddingLeft); // Create child row
            childRows += getSubChildRows(data, rowData.Code, response, paddingLeft + 20); // Recursively add sub-child rows
        }
    });

    return childRows;
}
function getSubChildRows(data, parentCode, response, paddingLeft) {
    let subChildRows = "";
    data.forEach(rowData => {
        if (rowData.MasterModuleCode === parentCode) {
            subChildRows += createRow(rowData, response, paddingLeft);
        }
    });
    return subChildRows;
}
function isParent(code) {
    return result.some(row => parseInt(row.MasterModuleCode) === parseInt(code));
}
let chk = false;
function checkParents(childCheckbox) {
    const childId = childCheckbox.attr("id"); 
    const childclass = childCheckbox.attr("class"); 
    const parentCheckbox = $(`.${childId}`);
    const Code = childId.split("_")[1];
    const GroupCode = childId.split("_")[2];
    if (parentCheckbox.length) {
        if (chk) {
            parentCheckbox.prop("checked", true);
            checkParents(parentCheckbox);
        } else {
            parentCheckbox.prop("checked", false);
            checkParents(parentCheckbox); 
        }
    }
}
let Data = [];
function checkbox(ele) {
    const childId = $(ele).attr("id");
    const childclass = $(ele).attr("class");
    const parentCheckbox = $(`.${childId}`);
    const Code = childId.split("_")[1];
    const GroupCode = childId.split("_")[2];
    if ($(ele).is(":checked")) {
        chk = true;
        checkParents($(ele));
        getParentCode(Code, GroupCode);
    } else {
        chk = false;
        checkParents($(ele));
        if (getCheckedCount(childclass) === 0) {
            getParentCode(Code, GroupCode);
        }
    }
    Data = getCheckedIdsContainingChk();
    SaveUserModuleMaster();
}
function checkbox1(childCheckbox) {
    const childId = $(childCheckbox).attr("id");
    const childclass = $(childCheckbox).attr("class");
    const parentCheckbox = $(`.${childId}`);
    const Code = childId.split("_")[1];
    const GroupCode = childId.split("_")[2];
    if ($(childCheckbox).is(":checked")) {
        chk = true;
        $("#chk_" + Code + "_" + GroupCode).prop("checked", true)
        getParentCode(Code, GroupCode);
    } else {
        chk = false;
        if (getCheckedCount(childclass.split(' ')[1]) === 0){
            $("#chk_" + Code + "_" + GroupCode).prop("checked", false)
            if (getCheckedCount(childclass.split(' ')[0]) === 0) {
                getParentCode(Code, GroupCode);
            }
        }
    }
    Data = getCheckedIdsContainingChk();
    SaveUserModuleMaster();
}
function getMasterModuleCodeByCode(code) {
    const item = result.find(entry => entry.Code == code);
    return item.MasterModuleCode ? item.MasterModuleCode : '0';
}

let Group_Code = 0;
function getParentCode(code, GroupCode) {
    Group_Code = GroupCode;
    const item = result.find(entry => entry.Code == code);
    if (!item) {
        return null;
    }
    const parentCode = item.MasterModuleCode;
    if (parentCode === '0') {
        return code;
    }
    if (chk) {
        $("#chk_" + parentCode + "_" + GroupCode).prop("checked", chk);
    } else {
        $("#chk_" + parentCode + "_" + GroupCode).prop("checked", chk);
    }
    return getParentCode(parentCode, Group_Code);
}
function getCheckedCount(className) {
    return $(`.${className}:checked`).length;
}
function getCheckedIdsContainingChk() {
    const data = []; 
    $(":checked").each(function () {
        const id = $(this).attr("id");
        if (id && id.includes("chk_")) {
            const parts = id.split("_");
            const ModuleCode = parts[1];
            const Group_Code = parts[2];
            const option = parts[3];

            data.push({
                ModuleCode: ModuleCode,
                GroupCode: Group_Code,
                Option: option ? option : ""
            });
        }
    });
    return data; 
}
function SaveUserModuleMaster() {
        $.ajax({
            url: `${appBaseURL}/api/UserMaster/SaveUserModuleMaster`,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(Data),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    GetUserOptionsDetails();
                } else if (response.Status === 'N') {
                    toastr.error("Something is wrong !");
                }
                else {
                    toastr.error("Unexpected response format.");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", xhr.responseText);
                toastr.error("An error occurred while saving the data.");
            }
        });
};
function GetUserOptionsDetails() {
    $.ajax({
        url: `${appBaseURL}/api/UserMaster/GetUserOptionsDetails`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                response.forEach(itam => {
                    if (itam['OptionDesp'] === '') {
                        $(`#chk_${itam['UserModuleMaster_Code']}_${itam['GroupMaster_Code']}`).prop("checked",true);
                    } else {
                        let optionsArray = itam['OptionDesp'].split(",").map(option => option.trim());
                        optionsArray.forEach(option => {
                            $(`#chk_${itam['UserModuleMaster_Code']}_${itam['GroupMaster_Code']}_${option}`).prop("checked", true);
                        });
                    }
                });
            } else {
                
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}






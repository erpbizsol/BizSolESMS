var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("User Menu Rights");
    UserMenuRightsList();
    GetUserGroupMasterList();
    populateTable();
    const thElements = document.querySelectorAll("th");

    thElements.forEach(th => {
        const text = th.textContent;
        if (text.length > 5) {
            th.classList.add("tooltip"); // Add tooltip class
            th.setAttribute("data-tooltip", text); // Set the full text as the tooltip
        }
    });
});
function GetUserListByGroupCode(Code) {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserMasterListByGroupCode?Code=${Code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
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
        url: `${appBaseURL}/api/Master/GetGroupListUserType`,
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
    let Col= `MODULE DESCRIPTION`;
    headerRow += `<th style="text-transform: uppercase;" class="">
            <div class="filter-table-heading-div">
                <span class="filter-table-heading">${Col}</span>
                <span class="">
                    <i class="fa-solid fa-angle-down fafilter" onclick="toggleFilter('${Col.replace(/\s+/g, '')}')" style="cursor: pointer;"></i>
                </span>
            </div>
            <div class="filter-dropdown" id="filterDropdown-${Col.replace(/\s+/g, '')}">
                <input type="text" id="filterInput-${Col.replace(/\s+/g, '')}" placeholder="Search..." class="filter-input form-control form-control-sm" data-column="${Col.replace(/\s+/g, '')}" />
                <hr>
                    <input type="button" class="btn btn-success btn-height" onclick="applyStringFilters1('${Col}','table-body')" data-column="${Col.replace(/\s+/g, '')}" value="Apply"/>
                    <input type="button" class="btn btn-success btn-height" onclick="ClearFilter('table-body')" value="Clear"/>
            </div>
        </div>
        </th>`;
    response.forEach(rowData => {
        headerRow += `<th style="text-transform: uppercase;" onclick="GetUserListByGroupCode(${rowData["Code"]})">
            <div class="filter-table-heading-div">
                <span class="filter-table-heading" style="text-algin:center ! important;">${rowData["Group Name"]}</span>
                <span class="">
                    <i class="fa-solid fa-angle-down fafilter" onclick="toggleFilter('${rowData["Group Name"].replace(/\s+/g, '')}')" style="cursor: pointer;"></i>
                </span>
                
            </div>
            <div class="filter-dropdown" id="filterDropdown-${rowData["Group Name"].replace(/\s+/g, '')}">
                <div class="checkbox-container" id="checkbox-container-${rowData["Group Name"].replace(/\s+/g, '')}"></div>
                <hr>
                    <input type="button" class="btn btn-success btn-height" onclick="applyStringFilters('${rowData["Group Name"]}','table-body')" data-column="${rowData["Group Name"].replace(/\s+/g, '')}" value="Apply"/>
                    <input type="button" class="btn btn-success btn-height" onclick="ClearFilter('table-body')" value="Clear"/>
            </div>
        </div>
        </th >`; 
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
    Tooltip();
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
            <td style="padding-left: ${paddingLeft}px !important;text-transform: uppercase;"  data-column="MODULEDESCRIPTION">
                ${rowData.MasterModuleCode === 0 || rowData.OptionDescriptions  ? `
                <label style="cursor: pointer;">
                    <i class="fa fa-plus toggle-icon" data-code="${rowData.Code}"></i>
                </label>` : ""}
                ${rowData.ModuleDesp}
            </td>`;

    response.forEach(response => {
        row += `<td style="text-align: center !important;"><input type="checkbox" id="chk_${rowData.Code}_${response['Code']}" class="chk_${rowData.MasterModuleCode}_${response['Code']} chk_${response['Group Name'].replace(/\s+/g, '')} " onclick="checkbox(this)"/></td>`;
    });

    row += `</tr>`;

    if (rowData.OptionDescriptions && !isParent(rowData.Code)) {
        let optionsArray = rowData.OptionDescriptions.split(",").map(option => option.trim());

        optionsArray.forEach(option => {
            row += `
            <tr class="child-of-child-row child-of-child-row-${rowData.Code}" 
                style="display: none;" 
                data-child-code="${rowData.Code}" >
                <td style="padding-left: ${paddingLeft + 30}px !important;text-transform: uppercase;" data-column="MODULEDESCRIPTION">${option}</td>`;

            response.forEach(response => {
                row += `<td style="text-align: center !important;"><input type="checkbox" id="chk_${rowData.Code}_${response['Code']}_${option}" class="chk_${rowData.MasterModuleCode}_${response['Code']} chk_${rowData.Code}_${response['Code']} chk_${response['Group Name'].replace(/\s+/g, '')}" onclick="checkbox1(this)"/></td>`;
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
                    ChangecolorTd();
                });
            } else {
                
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function OpenFilter(columnName) {
    $(".filter-division").hide();
    $("#filterDropdown-" + columnName).show();
}
function CloseFilter() {
    $(".filter-division").hide();
}
function populateFilterOptions(columnName, bodyId) {
    var uniqueValues = new Set();
    $(`#${bodyId} tr`).each(function () {
        var cellValue = $(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim();
        uniqueValues.add(cellValue);
    });

    var checkboxContainer = $('#checkbox-container-' + columnName.replace(/\s+/g, ''));
    checkboxContainer.empty();
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="All"> All</label>');
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="Y">Y</label>');
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="N">N</label>');

    checkboxContainer.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });

    checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer.find('input[type="checkbox"]:checked').not('input[value="All"]').length;

        checkboxContainer.find('input[value="All"]').prop('checked', allChecked);
    });
}
function toggleFilter(columnName) {
    closeAllFilters();
    populateFilterOptions(columnName,'table-body');
    $('#filter-' + columnName.replace(/\s+/g, '')).toggle();
    $('#filterDropdown-' + columnName.replace(/\s+/g, '')).toggle();
};
function closeAllFilters() {
    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-dropdown-double').hide();
    $('.checkbox-container-double').hide();
}
function applyStringFilters(column, bodyId) {
    const checkboxFilter = $('#checkbox-container-' + column.replace(/\s+/g, '') + ' input:checked').val(); 
    const gridRows = document.querySelectorAll(`#${bodyId} tr`); 
    gridRows.forEach(row => {
        const checkbox = row.querySelector("td input.chk_" + column.replace(/\s+/g, '')); 
        if (checkboxFilter) {
            if (checkboxFilter === 'N' && checkbox.checked) {
                row.style.display = "none";
            } else if (checkboxFilter === 'Y' && !checkbox.checked) {
                row.style.display = "none";
            } else {
                row.style.display = "";
                $(".toggle-icon").removeClass("fa-plus").addClass("fa-minus");
            }
        } else {
            row.style.display = "";
            $(".toggle-icon").removeClass("fa-plus").addClass("fa-minus");
        }
    });
    closeAllFilters();
}
$(document).click(function (event) {
    if (!$(event.target).closest('.filter-dropdown, .fafilter').length) {
        closeAllFilters();
    }
});
$('.filter-dropdown').click(function (event) {
    event.stopPropagation();
});
function ClearFilter1(bodyId) {
    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-input-double').val('');
    $('.filter-dropdown-double').hide();
}
function applyStringFilters1(column, bodyId) {
    const inputValue = document.getElementById(`filterInput-${column.replace(/\s+/g, '')}`).value.toLowerCase();
    const gridRows = document.querySelectorAll(`#${bodyId} tr`);

    gridRows.forEach(row => {
        const cell = row.querySelector(`td[data-column="${column.replace(/\s+/g, '')}"]`);
        if (cell) {
            const cellText = cell.textContent.toLowerCase();
            if (cellText.includes(inputValue)) {
                row.style.display = "";
                $(".toggle-icon").removeClass("fa-plus").addClass("fa-minus");
            } else {
                row.style.display = "none"; 
            }
        }
    });
    closeAllFilters();
}
function ClearFilter(bodyId) {
    //const gridRows = document.querySelectorAll(`#${bodyId} tr`);
    //gridRows.forEach(row => {
    //    row.style.display = "";
    //});
    //document.querySelectorAll('.filter-input').forEach(input => {
    //    input.value = "";
    //});
    ClearFilter1(bodyId);
    GetUserGroupMasterList();
}
function ChangecolorTd() {
    const inputs = document.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((input) => {
        const parentTd = input.closest('td');
        if (input.checked && parentTd) {
            parentTd.style.backgroundColor = '#c1ffc1';
        } else if (parentTd) {
            parentTd.style.backgroundColor = ''; 
        }
    });
}
function Tooltip() {
    const thElements = Array.from(document.getElementsByClassName("filter-table-heading"));
    thElements.forEach(th => {
        const text = th.textContent.trim(); // Get text and trim spaces
        if (text.length > 5) {
            th.classList.add("tooltip1"); // Add tooltip class
            th.setAttribute("data-tooltip", text); // Set the full text as the tooltip
            th.textContent = text.substring(0, 10) + "..."; // Truncate text to 5 characters
        }
    });
}
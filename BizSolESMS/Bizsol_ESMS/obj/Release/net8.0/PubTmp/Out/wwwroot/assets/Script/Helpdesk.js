var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
let UserMaster_Code = authKeyData.UserMaster_Code;
let UserType = authKeyData.UserType;
let UserModuleMaster_Code = 0;
const appBaseURL = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    $("#ERPHeading").text("Helpdesk");
    DefaultPageList();
    ShowHelpdesklist('Load');
    GetModuleMasterCode();
    $('#ddlPage').on('keydown', function (e) {
        if (e.key === 'Enter') {
            $('#txtDescription').focus();
        }
    });
    $('#txtFiles').on('change', function () {
        var files = this.files;
        var $info = $("#txtFilesInfo");
        if (!files || files.length === 0) {
            $info.text("").removeClass("has-files");
            return;
        }
        var names = [];
        for (var i = 0; i < files.length; i++) {
            names.push(files[i].name);
        }
        $info.addClass("has-files").text(files.length + " file(s) selected: " + names.join(", "));
    });
});
function ShowHelpdesklist(Type) {
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowHelpdesk`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                $("#txtTable").show();
                const StringFilterColumn = ["Page","Description","Raised By","Status"];
                const NumericFilterColumn = [];
                const DateFilterColumn = ["Raised Date"];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                };
                const updatedResponse = response.map(item => {
                    const statusText = (item.Status || "").toString().trim();
                    const isPending = statusText.toLowerCase() === "pending";
                    const ticketNo = item["Ticket No"] || item.TicketNo || "";
                    const hasTicketNo = ticketNo !== "" && ticketNo !== "-" && ticketNo !== "0" && ticketNo !== "-1";
                    const statusHtml = isPending
                        ? `<span class="hd-status hd-status-pending" role="button" title="Click to mark complete" onclick="ChangeStatus('${item.Code}')">Pending</span>`
                        : `<span class="hd-status hd-status-done">${statusText || "Completed"}</span>`;
                    const attachBtn = hasTicketNo
                        ? `<button type="button" class="hd-action-btn hd-action-attach" title="View Attachments" onclick="ShowTicketAttachments('${ticketNo}')"><i class="fa-solid fa-paperclip"></i></button>`
                        : "";

                    return {
                        ...item,
                        "Ticket No": !hasTicketNo
                            ? `<span class="text-muted">-</span>`
                            : `<span class="hd-ticket-no">${ticketNo}</span>`,
                        Status: statusHtml,
                        Action: `<span class="hd-action-wrap">
                            ${attachBtn}
                            <button type="button" class="hd-action-btn hd-action-view" title="View" onclick="View('${item.Code}')"><i class="fa-solid fa-eye"></i></button>
                        </span>`
                    };
                });
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                $("#txtTable").hide();
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
    var Description = $("#txtDescription").val();
    var Page = $("#ddlPage").val();

    if (Page == '') {
        toastr.error('Please select page !');
        $("#ddlPage").focus();
        return;
    }
    if (Description == '') {
        toastr.error('Please enter description !');
        $("#txtDescription").focus();
        return;
    }
    CreateTicketMaster();
}
function SaveHelpdesk(TicketNo) {
    var Description = $("#txtDescription").val();
    var Page = $("#ddlPage").val();

    const payload = {
        Code: $("#hfCode").val(),
        UserModuleMaster_Code: Page,
        Description: Description,
        UserMaster_Code: UserMaster_Code,
        TicketNo: TicketNo || ""
    };

    $.ajax({
        url: `${appBaseURL}/api/Master/SaveHelpdesk`,
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
                ShowHelpdesklist('GET');
                BackMaster();
            } else {
                toastr.error(response.Msg);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            toastr.error("An error occurred while saving the data.");
        }
    });
}

async function Create() {
    const { hasPermission, msg } = await CheckOptionPermission('New', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("NEW");
    ClearData();
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $("#ddlPage").prop("disabled", false);
    $("#txtDescription").prop("disabled", false);
    $("#txtFiles").prop("disabled", false);
}
function BackMaster() {
    $("#txtListpage").show();
    $("#txtCreatepage").hide();
    ClearData();
    $("#ddlPage").prop("disabled", false);
    $("#txtDescription").prop("disabled", false);
    $("#txtFiles").prop("disabled", false);
    $("#txtheaderdiv").hide();
}

async function deleteItem(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Delete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    const { Status, msg1 } = await CheckRelatedRecord(code, 'Helpdesk');
    if (Status == true) {
        toastr.error(msg1);
        return;
    }
    if (confirm(`Are you sure you want to delete this ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/DeleteHelpdesk?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowHelpdesklist('Get');
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

async function Edit(code) {

    const { hasPermission, msg } = await CheckOptionPermission('Edit', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    $("#tab1").text("EDIT");
    $("#txtListpage").hide();
    $("#txtCreatepage").show();
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowHelpdeskByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code),
                $("#ddlPage").val(item.UserModuleMaster_Code),
                $("#txtDescription").val(item.Description),
                $("#txtsave").prop("disabled", false)
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function ClearData() {
    $("#hfCode").val("0");
    $("#ddlPage").val($("#ddlPage option:first").val());
    $("#txtDescription").val("");
    $("#txtFiles").val("");
    $("#txtFilesInfo").text("").removeClass("has-files");
}
function GetModuleMasterCode() {
    var Data = JSON.parse(sessionStorage.getItem('UserModuleMaster'));
    const result = Data.find(item => item.ModuleDesp === "Helpdesk");
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
    $("#txtheaderdiv").show();
    $.ajax({
        url: `${appBaseURL}/api/Master/ShowHelpdeskByCode?Code=${code}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (item) {
            if (item) {
                $("#hfCode").val(item.Code);
                $("#ddlPage").val(item.UserModuleMaster_Code).attr("disabled", true);
                $("#txtDescription").val(item.Description).attr("disabled", true);
                $("#txtFiles").attr("disabled", true);
                $("#txtsave").attr("disabled", true);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });
}
function DefaultPageList() {
    $.ajax({
        url: `${appBaseURL}/api/UserMaster/GetUserModuleMasterList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                const select = $('#ddlPage');
                response.forEach(item => {
                    if (item.MasterModuleCode != 0) {
                        select.append(`<option value="${item.Code}">${item.ModuleDesp}</option>`);
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

async function ChangeStatus(code) {
    const { hasPermission, msg } = await CheckOptionPermission('Complete', UserMaster_Code, UserModuleMaster_Code);
    if (hasPermission == false) {
        toastr.error(msg);
        return;
    }
    if (confirm(`Are you sure you want to complete this ?`)) {
        $.ajax({
            url: `${appBaseURL}/api/Master/CompleteTicket?Code=${code}`,
            type: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    ShowHelpdesklist('Get');
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
function getAttachmentMimeType(fileName) {
    var ext = (fileName || "").split(".").pop().toLowerCase();
    var map = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        bmp: "image/bmp",
        webp: "image/webp",
        pdf: "application/pdf",
        txt: "text/plain",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };
    return map[ext] || "application/octet-stream";
}
function ShowTicketAttachments(ticketNo) {
    if (!ticketNo || ticketNo === "-" || ticketNo === "0" || ticketNo === "-1") {
        toastr.error("Ticket No not found.");
        return;
    }

    var companyCode = "BIZSOLCRM";
    $("#hdAttachmentTitle").text("Attachments - Ticket " + ticketNo);
    $("#hdAttachmentBody").html('<div class="text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Loading attachments...</div>');

    var modalEl = document.getElementById("hdAttachmentModal");
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    $.ajax({
        url: `${appBaseURL}/api/TicketMaster/AttechedFileChecks?companyCode=${encodeURIComponent(companyCode)}&ticketNo=${encodeURIComponent(ticketNo)}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var list = Array.isArray(response) ? response : (response?.data || response?.Data || []);
            if (!list || list.length === 0) {
                $("#hdAttachmentBody").html('<div class="text-center text-muted py-4">No attachments found for this ticket.</div>');
                return;
            }

            var html = '<div class="hd-attach-grid">';
            list.forEach(function (file, index) {
                var name = file.name || file.Name || ("Attachment_" + (index + 1));
                var base64 = file.Attachment || file.attachment || "";
                if (!base64) {
                    html += `<div class="hd-attach-item"><div class="hd-attach-name">${name}</div><div class="text-muted small">File data not available</div></div>`;
                    return;
                }
                var mime = getAttachmentMimeType(name);
                var dataUrl = "data:" + mime + ";base64," + base64;
                html += `<div class="hd-attach-item">
                    <div class="hd-attach-name">${name}</div>
                    <a class="btn btn-sm btn-success" href="${dataUrl}" download="${name}">
                        <i class="fa-solid fa-download me-1"></i>Download
                    </a>
                </div>`;
            });
            html += '</div>';
            $("#hdAttachmentBody").html(html);
        },
        error: function (xhr) {
            var errMsg = "Failed to load attachments.";
            try {
                var errResponse = xhr.responseJSON || JSON.parse(xhr.responseText);
                if (errResponse?.errors?.TicketNo && errResponse.errors.TicketNo.length) {
                    errMsg = errResponse.errors.TicketNo[0];
                } else {
                    errMsg = errResponse.Message || errResponse.title || errResponse.Msg || errResponse.msg || errMsg;
                }
            } catch (e) { }
            $("#hdAttachmentBody").html('<div class="text-center text-danger py-4">' + errMsg + '</div>');
            toastr.error(errMsg);
        }
    });
}
function formatLogDate(apiDate) {
    if (!apiDate) return "";
    // API returns dd/mm/yyyy → convert to yyyy-MM-dd
    var parts = String(apiDate).split('/');
    if (parts.length === 3) {
        var day = parts[0].padStart(2, '0');
        var month = parts[1].padStart(2, '0');
        var year = parts[2];
        return year + "-" + month + "-" + day;
    }
    // Already yyyy-MM-dd or similar
    if (String(apiDate).indexOf('-') > -1) {
        return String(apiDate).substring(0, 10);
    }
    return "";
}
function CreateTicketMaster() {
    var Description = $("#txtDescription").val();
    var Page = $("#ddlPage").val();
    var ModuleName = $("#ddlPage option:selected").text();
    var fileInput = document.getElementById("txtFiles");
    var files = [];
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        for (var i = 0; i < fileInput.files.length; i++) {
            files.push(fileInput.files[i]);
        }
    }

    if (Page == '') {
        toastr.error('Please select page !');
        $("#ddlPage").focus();
        return;
    }
    if (Description == '') {
        toastr.error('Please enter description !');
        $("#txtDescription").focus();
        return;
    }

    $.ajax({
        url: `${appBaseURL}/api/Master/GetCurrentDate`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            var apiDate = (response && response.length > 0 && response[0].Date) ? response[0].Date : "";
            var logDate = formatLogDate(apiDate);
            if (!logDate) {
                toastr.error("Unable to get current date.");
                return;
            }
            SubmitTicketMaster(ModuleName, Description, files, logDate);
        },
        error: function () {
            toastr.error("Failed to fetch current date.");
        }
    });
}
function SubmitTicketMaster(ModuleName, Description, files, logDate) {
    var formData = new FormData();
    formData.append("CompanyCode", "BIZSOLCRM");
    formData.append("TicketType", "1");
    formData.append("TicketNo", "-1");
    formData.append("Priority", "2");
    formData.append("ProjectClient", "Webiz");
    formData.append("LogDate", logDate);
    formData.append("Module", "5");
    formData.append("RaisedBy", "Manu Goel");
    formData.append("ContactNo", "7520242943");
    formData.append("ContactEMail", "manu.goel@bizsol.in");
    formData.append("Source", "6");
    formData.append("Description", ModuleName + ' - ' + Description);
    formData.append("CreateTicketBy", "92");
    formData.append("TestedBy", "92");
    formData.append("UserModuleMaster_Code", "0");

    if (files && files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            formData.append("Files", files[i], files[i].name);
        }
    }

    $.ajax({
        url: `${appBaseURL}/api/TicketMaster/Create`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.Success === true || response.success === true || response.Status === 'Y' || response.status === 'Y') {
                toastr.success(response.Message || response.Msg || response.msg || "Ticket created successfully.");
                var ticketNo = response.TicketNo || response.ticketNo || "";
                SaveHelpdesk(ticketNo);
            } else {
                toastr.error(response.Message || response.Msg || response.msg || "Unable to create ticket.");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", xhr.responseText);
            var errMsg = "An error occurred while creating the ticket.";
            try {
                var errResponse = xhr.responseJSON || JSON.parse(xhr.responseText);
                errMsg = errResponse.Message || errResponse.Msg || errResponse.msg || errMsg;
            } catch (e) { }
            toastr.error(errMsg);
        }
    });
}

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
const appBaseURL = sessionStorage.getItem('AppBaseURL');
let imageBase64Data = [];
$(document).ready(function () {
    $("#ERPHeading").text("User Master");
    UserGroupList();
    DesignationList();
    UserMasterList();
    $('#btnBrowse').on('click', function (e) {
        $("#txtUserImg").click();
    });
    $('#txtUserImg').change(function (event) {
        //SetImage();
        if (validateFileType()) {
            const target = event.target;
            const files = target.files;
            const fileName = files?.[0]?.name;

            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const arrayBuffer = e.target?.result;
                    const byteArray = new Uint8Array(arrayBuffer);
                    imageBase64Data = Array.from(byteArray);
                };
                reader.readAsArrayBuffer(file);
            }
            if (files) {
                fileToBase64(files)
                    .then(function (base64String) {
                        // Display the Base64 string in the output div
                        $('#hfUserImg').val(removeBase64Prefix(base64String));
                        $('#imgSelfie').attr('src', base64String);
                        console.log('Base64 String:', base64String);  // For debugging
                    })
                    .catch(function (error) {
                        console.error('Error:', error);
                    });

            } else {
                $('#hfUserImg').val('No file selected');
            }
        }
    });
    $("#btnSave").click(function () {
        SaveUserMaster();
    })
    $("#btnBack").click(function () {
        Back();
    })
    $('#txtUserID').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtUserName").focus();
        }
    });
    $('#txtUserName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtMobileNo").focus();
        }
    });
    $('#txtMobileNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPassword").focus();
        }
    });
    $('#txtPassword').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtConfirmPassword").focus();
        }
    });
    $('#txtConfirmPassword').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtEmailId").focus();
        }
    });
    $('#txtEmailId').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlGroupName").focus();
        }
    });
    $('#ddlGroupName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlDesignation").focus();
        }
    });
    $('#ddlDesignation').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAddress").focus();
        }
    });
    $('#txtAddress').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtSystemName").focus();
        }
    });
    $('#txtSystemName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkActive").focus();
        }
    });
    $('#chkActive').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkIsBizSolUser").focus();
        }
    });
    $('#chkIsBizSolUser').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkOTPApplicable").focus();
        }
    });
    $('#chkOTPApplicable').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkShowClientInProductionReport").focus();
        }
    });
    $('#chkShowClientInProductionReport').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkChangePasswordForNextLogIn").focus();
        }
    }); $('#chkChangePasswordForNextLogIn').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#chkShowRatesInQuotation").focus();
        }
    });
    $('#chkShowRatesInQuotation').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnSave").focus();
        }
    });

});
function UserGroupList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetUserGroupMasterList`,
        type: 'GET',
        success: function (response) {
            if (response.length > 0) {
                const select = $('#ddlGroupName');
                response.forEach(item => {
                    select.append(`<option value="${item.Code}">${item.GroupName}</option>`);
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
function DesignationList() {
    $.ajax({
        url: `${appBaseURL}/api/Master/GetDesignationMasterList`,
        type: 'GET',
        success: function (response) {
            if (response.length > 0) {
                const select = $('#ddlDesignation');
                response.forEach(item => {
                    select.append(`<option value="${item.Code}">${item.DesignationName}</option>`);
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
function UserMasterList() {
    $.ajax({
        url: `${appBaseURL}/api/UserMaster/GetUserMasterList`,
        type: 'GET',
        success: function (response) {
            if (response.length > 0) {
                const StringFilterColumn = ["ShowRatesInQuotation", "User Type", "LoginAllowFromSystem", "User Group", "Status", "Mobile No", "Designation", "ShowClientInProductionReport","ChangePasswordForNextLogIn","OTPApplicable","Bizsol User"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = ["User Id", "User Name", "Email","Address"];
                const hiddenColumns = ["Code","FixedParameter_Code", "NoOfSessionAllowed","CreatedBy", "CreateDate", "UpdatedBy", "UpdateDate", "Password","UserImage"];
                const ColumnAlignment = {
                    "Status": 'center',
                    "User Type": 'center',
                    "ShowRatesInQuotation": 'center',
                    "ShowClientInProductionReport": 'center',
                    "ChangePasswordForNextLogIn": 'center',
                    "Bizsol User": 'center',
                    "OTPApplicable": 'center',
                };
                const updatedResponse = response.map(item => ({
                    ...item, Action: `<button class="btn btn-primary icon-height mb-1"  title="Edit" onclick="Edit('${item.Code}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
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
function Create() {
    ClearData();
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
}
function Back() {
    $("#FrmUserMaster").hide();
    $("#tblUserMaster").show();
    ClearData();
}
function Delete(code) {
    if (confirm("Are you sure you want to delete this item?")) {
        $.ajax({
            url: `${appBaseURL}/api/UserMaster/DeleteUserMaster?Code=${code}&UserMaster_Code=1&Reason=Test`,
            type: 'POST',
            success: function (response) {
                if (response.Status === 'Y') {
                    toastr.success(response.Msg);
                    UserMasterList();
                } else {
                    toastr.error("Unexpected response format.");
                }

            },
            error: function (xhr, status, error) {
                toastr.error("Error deleting item:", error);

            }
        });
    }
}
function Edit(Code) {
    $("#tblUserMaster").hide();
    $("#FrmUserMaster").show();
    UserMasterByCode(Code);
}
function UserMasterByCode(Code) {
    $.ajax({
        url: `${appBaseURL}/api/UserMaster/GetUserMasterListByCode?Code=${Code}`,
        type: 'GET',
        success: function (response) {
            if (response) {
                $("#txtUserID").val(response.UserID);
                $("#txtUserName").val(response.UserName);
                $("#hfCode").val(response.Code);
                $("#txtMobileNo").val(response.UserMobileNo);
                $("#txtPassword").val('********');
                $("#txtConfirmPassword").val('********');
                $("#txtEmailId").val(response.EmailID);
                $("#ddlGroupName").val(response.GroupMaster_Code);
                $("#ddlDefaultCompany").val(response.FixedParameter_Code);
                $("#ddlDesignation").val(response.DesignationMaster_Code);
                $("#txtAddress").val(response.UserLocation);
                $("#txtSystemName").val(response.LoginAllowFromSystem);
               
                if(response.Status == 'N')
                {
                    $('#chkActive').prop("checked",false);
                }
                if (response.OTPApplicable == 'N')
                {
                    $('#chkOTPApplicable').prop("checked", false);
                }
                if (response.IsBizSolUser == 'N')
                {
                    $('#chkIsBizSolUser').prop("checked", false);
                }
                if(response.ShowClientInProductionReport == 'N')
                {
                    $('#chkShowClientInProductionReport').prop("checked", false);
                }
                if (response.ChangePasswordForNextLogIn == 'N')
                {
                    $('#chkChangePasswordForNextLogIn').prop("checked", false);
                }
                if (response.ShowRatesInQuotation == 'N')
                {
                    $('#chkShowRatesInQuotation').prop("checked", false);
                }
               
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

}
function validateFileType() {
    var IsValid = true;
    var fileName = document.getElementById("txtUserImg").value;
    var SizeOverload = false;
    if (fileName.trim() != '') {

        var idxDot = fileName.lastIndexOf(".") + 1;
        var extFile = fileName.substr(idxDot, fileName.length).toLowerCase();
        if (extFile == "jpg" || extFile == "jpeg" || extFile == "png" || extFile == "gif") {
            //TO DO
        } else {

            IsValid = false;
        }

        var file = $('#txtUserImg')[0].files[0];
        var Size = parseFloat(parseInt(file.size) / 1000);
        if (Size > 4096) {

            fileName.value = '';
            IsValid = false;
            SizeOverload = true;

        }
    }
    if (IsValid == true && SizeOverload == false) {
        const elements = document.querySelectorAll(`[id^="Photo_"]`);

        elements.forEach(element => {

            var photo_FileName = element.value;
            if (photo_FileName.trim() != '') {

                var idxDot1 = photo_FileName.lastIndexOf(".") + 1;
                var extFile = photo_FileName.substr(idxDot1, photo_FileName.length).toLowerCase();
                if (extFile == "jpg" || extFile == "jpeg" || extFile == "png" || extFile == "gif") {
                    //TO DO
                } else {

                    IsValid = false;
                }
                var photo_Size = parseFloat(parseInt(element.files[0].size) / 1000);
                if (photo_Size > 4096) {

                    element.value = '';
                    IsValid = false;
                    SizeOverload = true;

                }
            }
        });
    }
    if (IsValid == false && SizeOverload == false) {
        toastr.error("Only jpg, jpeg, png and gif files are allowed as Attachment!");
    }
    else if (IsValid == false && SizeOverload == true) {
        toastr.error("Please upload an image less than 4MB!");
    }
    return IsValid;
}
function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();

        reader.onload = function (e) {
            resolve(e.target.result);  // Resolve with the Base64 string
        };

        reader.onerror = function (e) {
            reject('Error reading file: ' + e.target.error);  // Reject if an error occurs
        };

        reader.readAsDataURL(file);  // Read the file as Base64
    });
}
function removeBase64Prefix(base64String) {

    // Regex to match the prefix 'data:image/*;base64,' and remove it
    var regex = /^data:image\/[a-zA-Z]*;base64,/;
    return base64String.replace(regex, '');
}
function SaveUserMaster(){
    const UserID = $("#txtUserID").val();
    const UserName = $("#txtUserName").val();
    const Code = $("#hfCode").val();
    const MobileNo = $("#txtMobileNo").val();
    const Password = $("#txtPassword").val();
    const ConfirmPassword = $("#txtConfirmPassword").val();
    const EmailId = $("#txtEmailId").val();
    const GroupName = $("#ddlGroupName").val();
    const DefaultCompany = $("#ddlDefaultCompany").val();
    const Designation = $("#ddlDesignation").val();
    const Address = $("#txtAddress").val();
    const SystemName = $("#txtSystemName").val();
    const UserImage = imageBase64Data;
    const Active = $('#chkActive').is(":checked");
    const IsBizSolUser = $('#chkIsBizSolUser').is(":checked");
    const OTPApplicable = $('#chkOTPApplicable').is(":checked");
    const ShowClientInProductionReport = $('#chkShowClientInProductionReport').is(":checked");
    const ChangePasswordForNextLogIn = $('#chkChangePasswordForNextLogIn').is(":checked");
    const ShowRatesInQuotation = $('#chkShowRatesInQuotation').is(":checked");
    if (UserID === "") {
        toastr.error('Please enter User Id.');
        $("#txtUserID").focus();
    } else if (UserName === "") {
        toastr.error('Please enter User Name.');
        $("#txtUserName").focus();
    } else if (Password === "") {
        toastr.error('Please enter Password.');
        $("#txtPassword").focus();
    } else if (ConfirmPassword === "") {
        toastr.error('Please enter Confirm Password.');
        $("#txtConfirmPassword").focus();
    } else if (ConfirmPassword !== Password) {
        toastr.error('Your password and confirmation password do not match.');
        $("#txtPassword").focus();
    }else if (!isEmail(EmailId)) {
        toastr.error('Please enter valid Email !.');
        $("#txtEmailId").focus();
    }else if (GroupName === "") {
        toastr.error('Please select User Group !.');
        $("#ddlGroupName").focus();
    } else if (Designation === "") {
        toastr.error('Please select designation.');
        $("#ddlDesignation").focus();
    }
    else {
        const payload = {
           Code:Code, 
           UserID:UserID,
           UserName :UserName, 
           UserMobileNo:MobileNo ,
           Password:Password,
           ConfirmPassword:ConfirmPassword ,
           EmailId:EmailId ,
           GroupMaster_Code: GroupName,
           FixedParameter_Code: DefaultCompany == null ? 0 : DefaultCompany,
           DesignationMaster_Code:Designation ,
           UserLocation:Address, 
           LoginAllowFromSystem:SystemName ,
           Status:Active == true?'Y':'N' ,
           IsBizSolUser: IsBizSolUser == true ? 'Y' : 'N',
           OTPApplicable: OTPApplicable == true ? 'Y' : 'N',
           ShowClientInProductionReport: ShowClientInProductionReport == true ? 'Y' : 'N',
           ChangePasswordForNextLogIn: ChangePasswordForNextLogIn == true ? 'Y' : 'N',
           ShowRatesInQuotation: ShowRatesInQuotation == true ? 'Y' : 'N',
           UserImage: UserImage,
           UserMaster_Code:0
        };
        $.ajax({
            url: `${appBaseURL}/api/UserMaster/SaveUserMaster`,
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
                    Back();
                    UserMasterList();
                } else if (response.Status === 'N') {
                    toastr.error(response.Msg);
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
    }
};
function FileUploadChange(event) {
    const target = event.target;
    files = target.files;
    fileName = files?.[0]?.name;

    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target?.result;
            const byteArray = new Uint8Array(arrayBuffer);
            imageBase64Data = Array.from(byteArray);
        };
        reader.readAsArrayBuffer(file);
    }
}
function ClearData()
{
    $("#txtUserID").val("");
    $("#txtUserName").val("");
    $("#hfCode").val("0");
    $("#txtMobileNo").val("");
    $("#txtPassword").val('');
    $("#txtConfirmPassword").val('');
    $("#txtEmailId").val("");
    $("#ddlGroupName").val("");
    $("#ddlDefaultCompany").val("");
    $("#ddlDesignation").val();
    $("#txtAddress").val("");
    $("#txtSystemName").val("");
    $('#chkActive').prop("checked", true);
    $('#chkOTPApplicable').prop("checked", true);
    $('#chkIsBizSolUser').prop("checked", true);
    $('#chkShowClientInProductionReport').prop("checked", true);
    $('#chkChangePasswordForNextLogIn').prop("checked", true);
    $('#chkShowRatesInQuotation').prop("checked", true);
}
function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}
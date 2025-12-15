let AppBaseURLMenu=window.location.href.toLowerCase().includes('local') == true ? 'https://localhost:7072' : 'https://web.bizsol.in/esms'
$(document).ready(function () {

    $('#txtCompanyCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnValidateCompany").focus();
        }
    });
    $('#txtUserID').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPassword").focus();
        }
    });
    $('#txtPassword').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnProceed").focus();
        }
    });
    $('#btnValidateCompany').click(function () {
            CheckCompany();
    });
    $('#btnProceed').click(function () {
        Login();
    });

  
    let companyCode = getCookie('CompanyCode');
    if (companyCode) {
        $('#txtCompanyCode').val(companyCode);
        console.log("CompanyCode Set:", companyCode);
    } else {
        console.warn("CompanyCode cookie not found!");
    }

});
function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}
function CheckCompany() {
    let companyCode = $("#txtCompanyCode").val();
    if (companyCode.trim() === "") {
        toastr.error("Please enter a Company Code.!");
        return;
    }
    $.ajax({
        url: `${AppBaseURLMenu}/Login/ValidateCompanyCode`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ CompanyCode: companyCode }),
        success: function (response) {
            if (response.success) {
                toastr.success("Company code validated successfully!");
                $('#userCredentials').show();
                $('#btnValidateCompany').hide();
                $('#txtCompanyCode').prop('readonly', true);
                $("#txtUserID").focus();
            } else {
                toastr.error(response.message);
            }
        },
        error: function () {
            toastr.error("An error occurred while validating the company code. Please try again.");
        }
    });
}
function Login() {
    let formData = {
        CompanyCode: $('#txtCompanyCode').val(),
        UserID: $('#txtUserID').val(),
        Password: $('#txtPassword').val()
    };
    $.ajax({
        url: `${AppBaseURLMenu}/Login/Authenticate`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            if (response.success) {
                CheckUserStatus(function (statusData) { 
                    if (statusData && statusData.status === 'Y') {
                        if (confirm("You are already logged in. Do you want to logout and login again?")) {
                            CurrentUserLogOut(statusData.code);
                            proceedWithLogin(response);
                        } else {
                            return;
                        }
                    } else {
                        proceedWithLogin(response);
                    }
                });
            } else {
                toastr.error(response.message);
            }
        },
        error: function () {
            toastr.error("An error occurred. Please try again.");
        }
    });
}
function proceedWithLogin(response) {
    GetActiveUserLimit(function (userData) {
        if (userData) {
            if (response.userType === 'A' && userData.status == 'N') {
                GetUsersWithEmptyIsActive(function () {
                });
            } else if (userData.status == 'N') {
                toastr.error(userData.msg);
            } else {
                window.location.href = `${AppBaseURLMenu}/Dashbord/Dashbord`;
            }
        } else {
            window.location.href = `${AppBaseURLMenu}/Dashbord/Dashbord`;
        }
    });
}
function GetUsersWithEmptyIsActive(callback) {
    $.ajax({
        url: `${AppBaseURLMenu}/Login/GetUsersWithEmptyIsActive`,
        type: 'GET',
        success: function (response) {
            console.log("GetUsersWithEmptyIsActive response:", response);
            
            // Check if response is an error object
            if (response && response.success === false) {
                toastr.error(response.message || "Failed to fetch users.");
                if (callback) callback();
                return;
            }
            
            // Clear table body first
            var tbody = $('#usersEmptyIsActiveTableBody');
            tbody.empty();
            
            // Check if response is an array and has data
            if (Array.isArray(response) && response.length > 0) {
                var SNo = 1; 
                response.forEach(function(user) {
                    var row = '<tr>' +
                        '<td>' + SNo + '</td>' +
                        '<td>' + (user.userID || '') + '</td>' +
                        '<td>' + (user.userName || '') + '</td>' +
                        '<td>' + (user.userMobileNo || '') + '</td>' +
                        '<td>' + (user.emailID || '') + '</td>' +
                        '<td><button class="btn btn-sm btn-danger" onclick="LogoutUser(' + (user.code || '0') + ')">LogOut</button></td>' +
                        '</tr>';
                    tbody.append(row);
                    SNo++; 
                });

                $('#noUsersMessage').hide();
                $('#usersEmptyIsActiveTable').show();
            } else { 
                $('#usersEmptyIsActiveTable').hide();
                $('#noUsersMessage').show();
            } 
            
            setTimeout(function() {
                var modalElement = document.getElementById('usersEmptyIsActiveModal');
                if (modalElement) {
                    if (typeof bootstrap !== 'undefined') {
                        try {
                            var modal = bootstrap.Modal.getInstance(modalElement);
                            if (!modal) {
                                modal = new bootstrap.Modal(modalElement);
                            }
                            modal.show();
                            modalElement.addEventListener('hidden.bs.modal', function() {
                                var backdrop = document.querySelector('.modal-backdrop');
                                if (backdrop) {
                                    backdrop.remove();
                                }
                                document.body.classList.remove('modal-open');
                                document.body.style.overflow = '';
                                document.body.style.paddingRight = '';
                                if (callback) callback();
                            }, { once: true });
                        } catch (e) {
                            if (typeof $ !== 'undefined' && $.fn.modal) {
                                $(modalElement).modal('show');
                            }
                        }
                    } 
                    else if (typeof $ !== 'undefined' && $.fn.modal) {
                        $(modalElement).modal('show');
                        console.log("Modal shown with jQuery");
                        $(modalElement).on('hidden.bs.modal', function() {
                            $('.modal-backdrop').remove();
                            $('body').removeClass('modal-open');
                            $('body').css('padding-right', '');
                            if (callback) callback();
                        });
                    } else {
                        modalElement.style.display = 'block';
                        modalElement.classList.add('show');
                        modalElement.setAttribute('aria-hidden', 'false');
                        document.body.classList.add('modal-open');
                        document.body.style.overflow = 'hidden';
                        
                        var backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        backdrop.id = 'modalBackdrop';
                        document.body.appendChild(backdrop);
                        
                        var closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], [data-dismiss="modal"], .btn-close, .btn-secondary');
                        closeButtons.forEach(function(btn) {
                            btn.addEventListener('click', function() {
                                modalElement.style.display = 'none';
                                modalElement.classList.remove('show');
                                modalElement.setAttribute('aria-hidden', 'true');
                                document.body.classList.remove('modal-open');
                                document.body.style.overflow = '';
                                var backdropEl = document.getElementById('modalBackdrop');
                                if (backdropEl) {
                                    backdropEl.remove();
                                }
                                if (callback) callback();
                            });
                        });
                        
                        backdrop.addEventListener('click', function() {
                            modalElement.style.display = 'none';
                            modalElement.classList.remove('show');
                            modalElement.setAttribute('aria-hidden', 'true');
                            document.body.classList.remove('modal-open');
                            document.body.style.overflow = '';
                            backdrop.remove();
                            if (callback) callback();
                        });
                    }
                } else {
                    if (callback) callback();
                }
            }, 100);
        },
        error: function (xhr, status, error) {
            toastr.error("Failed to fetch users. Please try again."); 
            if (callback) callback();
        }
    });
}  
function LogoutUser(userCode) {
    GetActiveUserLimit(function (userData) {
        if (userData) {
            UpdateIsActiveUser(userCode) 
        }
    });
}
function GetActiveUserLimit(callback) {
    $.ajax({
        url: `${AppBaseURLMenu}/Login/GetIsActiveUser`,
        type: 'GET',
        success: function (response) {
            if (response && response.length > 0) {
                if (callback) callback(response[0]);
            } else {
                if (callback) callback(null);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error fetching active user limit:", error);
            if (callback) callback(null);
        }
    });
}
function UpdateIsActiveUser(userMasterCode) {
    $.ajax({
        url: `${AppBaseURLMenu}/Login/UpdateUserMasterField`,
        type: 'GET',
        data: { UserMaster_Code: userMasterCode },
        success: function (response) {
            if (response && response.success) {
                toastr.success(response.message || "User status updated successfully.");
                GetUsersWithEmptyIsActive(function () {
                });
            } else {
                toastr.error(response.message || "Failed to update user status.");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error updating user status:", error);
            toastr.error("Failed to update user status. Please try again.");
        }
    });
}
function CurrentUserLogOut(userMasterCode) {
    $.ajax({
        url: `${AppBaseURLMenu}/Login/UpdateUserMasterField`,
        type: 'GET',
        data: { UserMaster_Code: userMasterCode },
        success: function (response) {
            if (response && response.success) {
                toastr.success(response.message || "Logout successfully.");
            } else {
                toastr.error(response.message || "Failed to Logout user.");
            }
        },
        error: function (xhr, status, error) {
            toastr.error("Failed to Logout user.");
        }
    });
}
function CheckUserStatus(callback) {
    $.ajax({
        url: `${AppBaseURLMenu}/Login/CheckUserStatus`,
        type: 'GET',
        success: function (response) {
            if (response && response.length > 0) {
                if (callback) callback(response[0]);
            } else {
                if (callback) callback(null);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error fetching active user limit:", error);
            if (callback) callback(null);
        }
    });
}
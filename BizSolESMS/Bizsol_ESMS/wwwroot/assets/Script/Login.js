const appBaseURL = sessionStorage.getItem('AppBaseURL');
const AppBaseURLMenu = sessionStorage.getItem('AppBaseURLMenu');
$(document).ready(function () {
    $('#btnValidateCompany').click(function () {
        let companyCode = $("#txtCompanyCode").val();

        if (companyCode.trim() === "") {
            toastr.error("Please enter a Company Code.!");
                return;
            }
            $.ajax({
                url: '/Login/ValidateCompanyCode',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ CompanyCode: companyCode }),
                success: function (response) {
                    if (response.success) {
                        toastr.success("Company code validated successfully!");
                        $('#userCredentials').show();
                        $('#btnValidateCompany').hide();
                        $('#txtCompanyCode').prop('readonly', true);
                    } else {
                        toastr.error(response.message);
                    }
                },
                error: function () {
                    toastr.error("An error occurred while validating the company code. Please try again.");
                }
            });
        });

    $('#btnProceed').click(function () {
        let formData = {
            CompanyCode: $('#txtCompanyCode').val(),
            UserID: $('#txtUserID').val(),
            Password: $('#txtPassword').val()
        };
        $.ajax({
            url: '/Login/Authenticate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                if (response.success) {
                    
                    window.location.href = '/Dashbord/Dashbord';
                } else {
                    toastr.error(response.message);
                }
            },
            error: function () {
                toastr.error("An error occurred. Please try again.");
            }
        });
    });
});


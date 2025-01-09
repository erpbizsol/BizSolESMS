//let AppBaseURLMenu = "https://web.bizsol.in/esms";
let AppBaseURLMenu = "https://localhost:7072";
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
   
});

function CheckCompany() {
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
        url: '/Login/Authenticate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            if (response.success) {
                window.location.href = `${AppBaseURLMenu}/Dashbord/Dashbord`;
            } else {
                toastr.error(response.message);
            }
        },
        error: function () {
            toastr.error("An error occurred. Please try again.");
        }
    });
}
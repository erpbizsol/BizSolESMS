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
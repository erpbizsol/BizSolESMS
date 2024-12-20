$(document).ready(function () {
    $('#btnProceed').click(function () {
        let formData = {
            CompanyCode: $('#txtCompanyCode').val(),
            UserID: $('#txtUserID').val(),
            Password: $('#txtPassword').val()
        };

        if (!formData.CompanyCode || !formData.UserID || !formData.Password) {
            alert("All fields are required!");
            return;
        }

        $.ajax({
            url: '/Login/Authenticate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                if (response.success) {
                    window.location.href = '/Home/Index'; 
                } else {
                    alert(response.message);
                }
            },
            error: function () {
                alert("An error occurred. Please try again.");
            }
        });
    });
});

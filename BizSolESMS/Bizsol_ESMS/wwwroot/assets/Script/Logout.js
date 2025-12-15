var baseUrl = sessionStorage.getItem('AppBaseURLMenu');
function logoutUser() {
    UpdateIsActiveUser();
    sessionStorage.clear();
    window.location.href = `${baseUrl}/Login/Login`;
}
window.logoutUser = logoutUser;


function UpdateIsActiveUser() {
    $.ajax({
        url: `${baseUrl1}/api/Master/UpdateIsActiveUser?UserMaster_Code=${userMasterCode}&IsActive=N&IPAddress=''`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                
            }
        },
        error: function (xhr, status, error) {
            toastr.error('Error Api/ShowItemConfig');
        }
    });
}

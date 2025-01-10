var baseUrl = sessionStorage.getItem('AppBaseURLMenu');
function logoutUser() {
    sessionStorage.clear();
    window.location.href = `${baseUrl}/Login/Login`;
}
window.logoutUser = logoutUser;



function logoutUser() {
    sessionStorage.clear();
    window.location.href = '/Login/Login';
}
window.logoutUser = logoutUser;



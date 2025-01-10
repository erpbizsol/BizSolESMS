$(".Number,.Amount,.Weight").css('text-align', 'left');
$(".Number").keyup(function (e) {
    if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
});
$(".Phone").keyup(function (e) {
    if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
});
$(".Phone").css('text-align', 'left');
$(".Amount").keyup(function (e) {
    if (/\D/g.test(this.value)) {
        if (this.value.length == 1) this.value = this.value.replace(/[.]/g, '0.');
        this.value = this.value.replace(/[^0-9\.{2}[0-9]]/g, '');
        this.value = this.value.replace(/[^0-9\.]/g, '');
        if (this.value.split(".").length > 2) this.value = this.value.replace(/\.+?$/, '')
        if (this.value.split(".").length > 2) this.value = this.value.replace(this.value, '')
        if (this.value.charAt(0) == ".") this.value = this.value.replace(this.value, '0' + this.value)
    }
});
$(".Weight").keyup(function (e) {
    if (/\D/g.test(this.value)) {
        if (this.value.length == 1) this.value = this.value.replace(/[.]/g, '0.');
        this.value = this.value.replace(/[^0-9\.]/g, '')
        if (this.value.split(".").length > 2) this.value = this.value.replace(/\.+?$/, '')
        if (this.value.split(".").length > 2) this.value = this.value.replace(this.value, '')
        if (this.value.charAt(0) == ".") this.value = this.value.replace(this.value, '0' + this.value)
    }
});
$(".Number").blur(function (e) {
    if ($.isNumeric(this.value))
        this.value = parseFloat(this.value).toFixed(0);
});
$(".Amount").blur(function (e) {
    if ($.isNumeric(this.value))
        this.value = parseFloat(this.value).toFixed(2);
});
$(".Weight").blur(function (e) {
    if ($.isNumeric(this.value))
        this.value = parseFloat(this.value).toFixed(3);
});

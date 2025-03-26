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
function ConfrmationMaltipal(row) {
    swal({
        text: "Are you sure you want to delete this item !..",
        icon: "warning",
        buttons: {
            cancel: {
                text: "Cancel",
                value: false,
                visible: true,
                closeModal: true,
                className: "swal-button-danger"
            },
            confirm: {
                text: "OK",
                value: true,
                visible: true,
                closeModal: true,
                className: "swal-button-success"
            }
        },
        dangerMode: true,
        className: "custom-swal-size",
        className: "swal-footer",
        className: "swal-modal",

    }).then((willDelete) => {
        if (willDelete) {
            row.remove();
            swal("Item Deleted !..", {
                icon: "success",
            });
        } else {
            swal("Item Deleted Cancel !..");
        }
      
    });
   
}
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const cancelButton = document.querySelector(".swal-button--cancel");
        if (cancelButton) {
            cancelButton.focus();
        }
    }, 50);
});


window.ConfrmationMaltipal = ConfrmationMaltipal;

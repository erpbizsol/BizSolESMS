$(document).ready(function () {
    UserMenuRightsList();
});
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var baseUrl1 = sessionStorage.getItem('AppBaseURL');
    var baseUrl = sessionStorage.getItem('AppBaseURLMenu');
    //CRMDashboardService.GetUserDetails()
    //    .then(function (res) {
    //        sessionStorage.setItem('UserDetails', JSON.stringify(res));
    //        let UserDetailsobj = JSON.parse(sessionStorage.getItem('UserDetails'));

    //        $('#ERPUserName')[0].innerHTML = UserDetailsobj[0].UserID;
    //        $('#ERPCompanyCode')[0].innerHTML = `(${UserDetailsobj[0].CompanyNameForShow})`;

    function UserMenuRightsList() {
        $.ajax({
            url: `${baseUrl1}/api/UserMaster/GetUserModuleMasterList`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (value) {
                if (value.length > 0) {
                    var menuHtml = '';
                    $.each(value, function (index, item) {
                        if (item.MasterModuleCode === 0) {
                            var childMenuHtml = getChildMenu(value, item.Code);
                            var hasArrow = childMenuHtml ? 'has-arrow' : '';
                            menuHtml += '<li>';
                            menuHtml += '<a href="javascript:void(0);" class="menu-toggle ' + hasArrow + '">';
                            menuHtml += '<span class="iconBg"><i class="side-menu-icon" data-feather="grid"></i></span>';
                            menuHtml += '<span>' + item.ModuleDesp + '</span>';
                            // Add arrow if submenu exists (always point right initially)
                            //menuHtml += childMenuHtml ? '<i class="arrow-icon" data-feather="chevron-right"></i>' : '';
                            menuHtml += '</a>';
                            if (childMenuHtml) {
                                menuHtml += '<ul class="sub-menu" style="display: none;">' + childMenuHtml + '</ul>'; // Submenus hidden by default
                            }
                            menuHtml += '</li>';
                        }
                    });

                    $('#side-menu').html(menuHtml);

                    feather.replace();
                    setActiveMenu();
                    //$('.menu-toggle').click(function (e) {
                    //    var parentLi = $(this).parent();

                    //    if (!$(this).hasClass('has-arrow')) {

                    //        return;
                    //    }

                    //    e.preventDefault();
                    //    parentLi.toggleClass('mm-active');
                    //    parentLi.children('ul.sub-menu').slideToggle();

                    //    var arrowIcon = $(this).find('.arrow-icon');
                    //    if (parentLi.hasClass('active')) {
                    //        arrowIcon.attr('data-feather', 'chevron-down');
                    //    } else {
                    //        arrowIcon.attr('data-feather', 'chevron-right');
                    //    }
                    //    feather.replace();
                    //});
                    $('.menu-toggle').click(function (e) {
                        var parentLi = $(this).parent();
                        var subMenu = parentLi.children('ul');

                        if (!$(this).hasClass('has-arrow')) {
                            return;
                        }

                        e.preventDefault();

                        if (subMenu.is(":visible")) {
                            subMenu.slideUp();
                            parentLi.removeClass('mm-active');
                        } else {
                            //$('#side-menu ul.sub-menu').slideUp();
                            $('#side-menu li').removeClass('mm-active');

                            subMenu.slideDown();
                            parentLi.addClass('mm-active');
                        }

                        feather.replace();
                    });
                }
            }
        });
    }

function getChildMenu(value, masterCode) {
    // var baseUrl = `${window.location.protocol}//${window.location.host}`;
    var childMenuHtml = '';
    $.each(value, function (index, item) {
        if (item.MasterModuleCode === masterCode) {
            var subChildMenuHtml = getChildMenu(value, item.Code);
            var hasArrow = subChildMenuHtml ? 'has-arrow' : '';
            childMenuHtml += '<li>';
            childMenuHtml += '<a href="' + baseUrl + '/' + item.FormToOpen + '" class="menu-toggle ' + hasArrow + '">';
            childMenuHtml += '<span>' + item.ModuleDesp + '</span>';
            // Add arrow if submenu exists (always point right initially)
            //childMenuHtml += subChildMenuHtml ? '<i class="arrow-icon" data-feather="chevron-right"></i>' : '';
            childMenuHtml += '</a>';
            if (subChildMenuHtml) {
                childMenuHtml += '<ul class="sub-menu" style="display: none;">' + subChildMenuHtml + '</ul>';
            }
            childMenuHtml += '</li>';
        }
    });
    return childMenuHtml;
}

function setActiveMenu() {
    var currentUrl = window.location.pathname;

    $('#side-menu ul.sub-menu').hide();

    $('#side-menu li').removeClass('mm-active last-active');
    $('#side-menu a').removeClass('active');

    $('#side-menu a').each(function () {
        var menuLink = $(this).attr('href');
        if (menuLink && (currentUrl === new URL(menuLink, window.location.origin).pathname) && currentUrl !== "/") {
            $(this).addClass('active');
            $(this).parents('li').last().addClass('last-active');
            $(this).parents('ul.sub-menu').show();
        }
    });
}


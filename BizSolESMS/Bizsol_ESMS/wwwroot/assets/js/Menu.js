

$(document).ready(function () {
    UserMenuRightsList();
    GetPerPageSize();
    WarehouseNameForDefault();
    ItemMasterConfig();
    AppConfigLoad();
    GetIsActiveDetails();
    GetFixparameter();
    if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
        window.applyEsmsLevelOfOrderNoLabelsToDom();
    }
    bindVerticalMenuScrollPersistence();
});

/** Persist left-rail scroll (SimpleBar) so it does not jump to top after navigation or submenu toggle. */
var ESMS_MENU_SCROLL_KEY = 'esmsVerticalMenuScroll';

function getVerticalMenuScrollHost() {
    var root = document.querySelector('#layout-wrapper .vertical-menu [data-simplebar]');
    if (!root) return null;
    return root.querySelector('.simplebar-content-wrapper');
}

function readSavedMenuScroll() {
    var v = sessionStorage.getItem(ESMS_MENU_SCROLL_KEY);
    var n = v == null ? NaN : parseInt(v, 10);
    return isFinite(n) && n >= 0 ? n : 0;
}

function saveVerticalMenuScroll() {
    var host = getVerticalMenuScrollHost();
    if (host) {
        sessionStorage.setItem(ESMS_MENU_SCROLL_KEY, String(host.scrollTop));
    }
}

function scheduleRestoreVerticalMenuScroll() {
    var y = readSavedMenuScroll();
    if (y <= 0) return;

    function apply() {
        var host = getVerticalMenuScrollHost();
        if (host) {
            host.scrollTop = y;
        }
    }

    requestAnimationFrame(function () {
        requestAnimationFrame(apply);
    });
    setTimeout(apply, 0);
    setTimeout(apply, 50);
    setTimeout(apply, 150);
}

function bindVerticalMenuScrollPersistence() {
    var host = getVerticalMenuScrollHost();
    if (!host || host.dataset.esmsScrollBound === '1') return;
    host.dataset.esmsScrollBound = '1';
    var t = null;
    host.addEventListener(
        'scroll',
        function () {
            if (t) clearTimeout(t);
            t = setTimeout(saveVerticalMenuScroll, 120);
        },
        { passive: true }
    );
}

function getFixParamTransferTallyValue() {
    try {
        var parsed = JSON.parse(sessionStorage.getItem('Fixparameter') || 'null');
        if (!parsed) return '';
        var row = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!row) return '';
        var keys = ['IsTransferApplicableInTally', 'IsTransferAbplicableInTally'];
        for (var i = 0; i < keys.length; i++) {
            var camel = keys[i].charAt(0).toLowerCase() + keys[i].slice(1);
            var value = row[keys[i]] != null ? row[keys[i]] : row[camel];
            if (value != null && String(value).trim() !== '') return String(value).trim();
        }
        var matchedKey = Object.keys(row).find(function (key) {
            return /transfer/i.test(key) && /tally/i.test(key);
        });
        if (matchedKey && row[matchedKey] != null && String(row[matchedKey]).trim() !== '') {
            return String(row[matchedKey]).trim();
        }
    } catch (e) { }
    return '';
}

function isAccountAppConfigBlocked() {
    return getFixParamTransferTallyValue().toUpperCase() === 'N';
}

function isAccountAppConfigLink($link) {
    var href = ($link.attr('href') || '').toLowerCase();
    var label = ($link.find('.esms-menu-label').text() || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (label === 'account app config' || label === 'app config' || label === 'app config configuration') return true;
    return href.indexOf('appconfig') >= 0;
}

function showAccountAppConfigBlockedMessage() {
    var message = 'You cannot access this page because it is not available in the current Tally Integration.';
    var existing = document.getElementById('esmsTallyAccessModal');
    if (existing) {
        var existingBtn = existing.querySelector('.esms-tally-access__ok');
        if (existingBtn) existingBtn.focus();
        return;
    }

    var wrap = document.createElement('div');
    wrap.id = 'esmsTallyAccessModal';
    wrap.className = 'esms-tally-access';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'esmsTallyAccessTitle');
    wrap.innerHTML =
        '<div class="esms-tally-access__backdrop" data-close="1"></div>' +
        '<div class="esms-tally-access__card">' +
            '<div class="esms-tally-access__icon" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" fill="none">' +
                    '<path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
                    '<rect x="5" y="11" width="14" height="9" rx="2.2" stroke="currentColor" stroke-width="1.8"/>' +
                    '<path d="M12 15v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
                '</svg>' +
            '</div>' +
            '<p class="esms-tally-access__kicker">Tally Integration</p>' +
            '<h3 id="esmsTallyAccessTitle">Access unavailable</h3>' +
            '<p class="esms-tally-access__text"></p>' +
            '<button type="button" class="esms-tally-access__ok">OK</button>' +
        '</div>';

    wrap.querySelector('.esms-tally-access__text').textContent = message;
    document.body.appendChild(wrap);

    function closeModal() {
        wrap.classList.remove('is-open');
        document.removeEventListener('keydown', onKey);
        setTimeout(function () {
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        }, 180);
    }
    function onKey(e) {
        if (e.key === 'Escape' || e.key === 'Enter') closeModal();
    }

    wrap.querySelector('.esms-tally-access__ok').addEventListener('click', closeModal);
    wrap.querySelector('[data-close]').addEventListener('click', closeModal);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () {
        wrap.classList.add('is-open');
        wrap.querySelector('.esms-tally-access__ok').focus();
    });
}

$(document).on('click', '#sidebar-menu a[href]', function (e) {
    var href = ($(this).attr('href') || '').trim();
    if (!href || href.indexOf('javascript:') === 0 || href === '#') return;
    saveVerticalMenuScroll();
    if (isAccountAppConfigLink($(this)) && isAccountAppConfigBlocked()) {
        e.preventDefault();
        showAccountAppConfigBlockedMessage();
    }
});

var authKeyData1 = JSON.parse(sessionStorage.getItem('authKey'));
var authKeyData = sessionStorage.getItem('authKey');
    //const jsonString = '{"DefultMysqlTemp":"Server=220.158.165.98;Port = 65448;database=bizsolesms_test;user=sa;password=biz1981;","AuthToken":"xyz","UserMaster_Code":"4","UserID":"Ankit"}';
    const userMasterCode = authKeyData1.UserMaster_Code;
    var baseUrl1 = sessionStorage.getItem('AppBaseURL');
    var baseUrl = sessionStorage.getItem('AppBaseURLMenu');

    /**
     * Feather icons pool (each menu label maps to one; same label => same icon every time).
     * Different labels usually get different icons via hash; semantic hints override when useful.
     */
    var MENU_FEATHER_ICONS = [
        'home', 'grid', 'layers', 'package', 'box', 'archive', 'database', 'server', 'hard-drive', 'cpu',
        'file-text', 'file', 'folder', 'clipboard', 'list', 'book-open', 'book',
        'bar-chart-2', 'bar-chart', 'pie-chart', 'trending-up', 'trending-down', 'activity',
        'shopping-cart', 'shopping-bag', 'truck', 'map-pin', 'map', 'navigation',
        'users', 'user', 'user-check', 'shield', 'lock', 'unlock', 'key',
        'settings', 'tool', 'sliders', 'filter', 'search', 'crosshair',
        'bell', 'mail', 'message-circle', 'calendar', 'clock', 'watch',
        'tag', 'bookmark', 'star', 'award', 'gift', 'target',
        'monitor', 'smartphone', 'tablet', 'tv', 'camera', 'image',
        'credit-card', 'dollar-sign', 'percent', 'briefcase',
        'share-2', 'link', 'link-2', 'external-link', 'globe',
        'download', 'upload', 'cloud', 'refresh-cw', 'repeat', 'shuffle',
        'edit-3', 'edit-2', 'eye', 'printer', 'save', 'copy',
        'trash-2', 'scissors', 'paperclip', 'inbox', 'send', 'phone',
        'feather', 'anchor', 'compass', 'flag', 'life-buoy', 'umbrella',
        'sun', 'moon', 'zap', 'aperture', 'hexagon', 'triangle'
    ];

    function menuLabelHash(str) {
        var s = String(str || '');
        var h = 0;
        for (var i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    }

    /**
     * Distinct feather icon per menu name (stable). Optional salt shifts nested items so names match fewer collisions.
     * @param semanticOnlyRoot - if true, apply keyword hints only for main module groups (not every "… Master" child).
     */
    function featherIconForLabel(name, salt, semanticOnlyRoot) {
        var s = (name || '').trim();
        if (!s) return 'circle';
        var lower = s.toLowerCase();
        if (semanticOnlyRoot) {
            if (lower === 'master' || lower.indexOf('master') === 0) return 'layers';
            if (lower.indexOf('transaction') === 0) return 'tool';
            if (lower.indexOf('report') === 0) return 'bar-chart-2';
            if (lower.indexOf('config') === 0) return 'settings';
            if (lower.indexOf('admin') === 0) return 'shield';
            if (lower.indexOf('dispatch') === 0) return 'truck';
            if (lower.indexOf('order') === 0) return 'shopping-cart';
        }

        var idx = menuLabelHash(lower + (salt != null ? ':' + salt : '')) % MENU_FEATHER_ICONS.length;
        return MENU_FEATHER_ICONS[idx];
    }

    //CRMDashboardService.GetUserDetails()
    //    .then(function (res) {
    //        sessionStorage.setItem('UserDetails', JSON.stringify(res));
    //        let UserDetailsobj = JSON.parse(sessionStorage.getItem('UserDetails'));

    //        $('#ERPUserName')[0].innerHTML = UserDetailsobj[0].UserID;
    //        $('#ERPCompanyCode')[0].innerHTML = `(${UserDetailsobj[0].CompanyNameForShow})`;

function UserMenuRightsList() {
        $.ajax({
            url: `${baseUrl1}/api/UserMaster/GetUserModuleRightsList?CompanyCode=0&UserCode=${userMasterCode}`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Key', authKeyData);
            },
            success: function (value) {
                if (value.length > 0) {
                    sessionStorage.setItem('UserModuleMaster', JSON.stringify(value));
                    var menuHtml = '';
                    menuHtml += '<li class="esms-webiz-menu-heading" role="presentation"><span class="esms-webiz-menu-heading-inner">Main menu</span></li>';
                    $.each(value, function (index, item) {
                        if (item.MasterModuleCode === 0) {
                            var childMenuHtml = getChildMenu(value, item.Code);
                            var hasArrow = childMenuHtml ? 'has-arrow' : '';
                            var chevron = childMenuHtml ? '<span class="esms-menu-chevron" aria-hidden="true"><i data-feather="chevron-right"></i></span>' : '';
                            menuHtml += '<li>';
                            menuHtml += '<a href="javascript:void(0);" class="menu-toggle ' + hasArrow + '">';
                            menuHtml += '<span class="iconBg"><i class="side-menu-icon" data-feather="' + featherIconForLabel(item.ModuleDesp, 'root', true) + '"></i></span>';
                            menuHtml += '<span class="esms-menu-label">' + item.ModuleDesp + '</span>';
                            menuHtml += chevron;
                            menuHtml += '</a>';
                            if (childMenuHtml) {
                                menuHtml += '<ul class="sub-menu" style="display: none;">' + childMenuHtml + '</ul>'; // Submenus hidden by default
                            }
                            menuHtml += '</li>';
                        }
                    });

                    $('#side-menu').html(menuHtml);

                    setActiveMenu();
                    feather.replace();
                    bindVerticalMenuScrollPersistence();
                    scheduleRestoreVerticalMenuScroll();
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

                        var host = getVerticalMenuScrollHost();
                        var st = host ? host.scrollTop : 0;
                        var finish = function () {
                            if (host) {
                                host.scrollTop = st;
                            }
                            saveVerticalMenuScroll();
                            feather.replace();
                        };

                        if (subMenu.is(':visible')) {
                            subMenu.slideUp(200, function () {
                                parentLi.removeClass('mm-active');
                                finish();
                            });
                        } else {
                            $('#side-menu li').removeClass('mm-active');
                            subMenu.slideDown(200, finish);
                            parentLi.addClass('mm-active');
                        }
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
            var subIcon = featherIconForLabel(item.ModuleDesp, 'c' + item.Code);
            var subChevron = subChildMenuHtml ? '<span class="esms-menu-chevron esms-menu-chevron--nested" aria-hidden="true"><i data-feather="chevron-right"></i></span>' : '';
            childMenuHtml += '<li>';
            childMenuHtml += '<a href="' + baseUrl + '/' + item.FormToOpen + '" class="menu-toggle ' + hasArrow + '">';
            childMenuHtml += '<span class="esms-submenu-icon"><i data-feather="' + subIcon + '"></i></span>';
            childMenuHtml += '<span class="esms-menu-label">' + item.ModuleDesp + '</span>';
            childMenuHtml += subChevron;
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
    var host = getVerticalMenuScrollHost();
    var holdScroll = readSavedMenuScroll();

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

    if (host && holdScroll > 0) {
        requestAnimationFrame(function () {
            if (host) {
                host.scrollTop = holdScroll;
            }
        });
    }
}
async function GetPerPageSize() {
    $.ajax({
        url: `${baseUrl1}/api/Configuration/GetPerPageSizeList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (value) {
            if (value.length > 0) {
                sessionStorage.setItem('PerPageSize', JSON.stringify(value));
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch item data. Please try again.");
        }
    });
}
async function WarehouseNameForDefault() {
    $.ajax({
        url: `${baseUrl1}/api/Master/WarehouseNameForDefault`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (value) {
            if (value.length > 0) {
                sessionStorage.setItem('DefaultWarehouse', value[0].WarehouseName);
            } else {
                toastr.error("Record not found...!");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
            toastr.error("Failed to fetch item data. Please try again.");
        }
    });
}
function ItemMasterConfig() {
    $.ajax({
        url: `${baseUrl1}/api/Master/ShowItemConfig`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                sessionStorage.setItem('ItemConfig', JSON.stringify(response));
            }
        },
        error: function (xhr, status, error) {
            toastr.error('Error Api/ShowItemConfig');
        }
    });
}

function AppConfigLoad() {
    $.ajax({
        url: `${baseUrl1}/api/Configuration/GetAppConfigList`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response && response.length > 0) {
                sessionStorage.setItem('AppConfig', JSON.stringify(response));
            }
        },
        error: function () {
            console.error('Error Api/GetAppConfigList');
        }
    });
}

async function GetIsActiveDetails() {
    let systemIP = '';

    await GetPublicIPAsync()
        .then(ip => {
            systemIP = ip;
        });
    $.ajax({
        url: `${baseUrl1}/api/Master/GetIsActiveDetails?UserMaster_Code=${userMasterCode}&IPAddress=${systemIP}`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                if (response[0].IsActive == 'N') {
                    logoutUser();
                }
            }
        },
        error: function (xhr, status, error) {
            toastr.error('Error Api/ShowItemConfig');
        }
    });
}

async function GetPublicIPAsync() {
    try {
        const response = await fetch('https://api.ipify.org');
        const ip = await response.text();
        return ip.trim();
    }
    catch (error) {
        return '';
    }
}

function GetFixparameter() {
    $.ajax({
        url: `${baseUrl1}/api/Master/GetFixparameter`,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authKeyData);
        },
        success: function (response) {
            if (response.length > 0) {
                sessionStorage.setItem('Fixparameter', JSON.stringify(response));
            }
            if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
                window.applyEsmsLevelOfOrderNoLabelsToDom();
            }
            if (isAccountAppConfigBlocked() && /appconfig/i.test(window.location.pathname || '')) {
                $("#txtCreatepage").hide();
                showAccountAppConfigBlockedMessage();
            }
        },
        error: function (xhr, status, error) {
            toastr.error('Error Api/Fixparameter');
            if (typeof window.applyEsmsLevelOfOrderNoLabelsToDom === 'function') {
                window.applyEsmsLevelOfOrderNoLabelsToDom();
            }
        }
    });
}
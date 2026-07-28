function blockUI() {
    /* Do not cover open Bootstrap modals (modal z-index ~10100). */
    if (document.querySelector('.modal.show')) {
        return;
    }

    /* Never stack a page blocker while a modal is opening. */
    if (document.querySelector('.modal.showing')) {
        return;
    }

    // Remove any existing overlay
    $('#block-overlay').remove();

    $('body').append(`
    <div id="block-overlay" style="
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        z-index: 10090;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;">
        
        <div class="loader"></div>
        <div style="margin-top: 16px; color: white; font-size: 20px;">
            Loading...
        </div>
    </div>
`);
}

function unblockUI() {
    $('#block-overlay').remove();
}

/* Loading overlay must not sit above Bootstrap modals (z-index ~10100). */
document.addEventListener('show.bs.modal', function () {
    unblockUI();
}, true);

function toggleDropdown(input) {
    const container = input.parentElement;
    const dropdown = container.querySelector(".select-dropdown");
    document.querySelectorAll(".select-dropdown").forEach(d => {
        if (d !== dropdown) d.style.display = "none";
    });

    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";

    if (dropdown.style.display === "block") {
        dropdown.style.width = input.offsetWidth + "px";
        setTimeout(() => {
            const search = dropdown.querySelector(".searchBox");
            if (search) {
                search.focus();
                search.value = "";
                filterCheckboxes(search);
            }
        }, 10);
    }
}

function updateSelectedOptions(changedCheckbox) {
    const dropdown = changedCheckbox.closest(".select-dropdown");
    const allChk = dropdown.querySelector(".allchk");
    const checkboxes = dropdown.querySelectorAll(".allcheckbox");
    const input = dropdown.previousElementSibling;

    if (changedCheckbox === allChk && allChk.checked) {
        checkboxes.forEach(cb => {
            cb.checked = true;
            cb.disabled = true;
        });
        input.value = "All";
    } else if (changedCheckbox === allChk && !allChk.checked) {
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = false;
        });
        input.value = "";
    } else {
        allChk.checked = false;
        allChk.disabled = false;
        checkboxes.forEach(cb => cb.disabled = false);

        const selected = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.parentElement.textContent.trim());

        input.value = selected.length > 0 ? selected.join(", ") : "";
    }
}

function filterCheckboxes(searchInput) {
    const query = searchInput.value.toLowerCase();
    const dropdown = searchInput.closest(".select-dropdown");
    const labels = dropdown.querySelectorAll(".checkbox-item");

    labels.forEach(label => {
        const text = label.textContent.toLowerCase();
        label.style.display = text.includes(query) ? "block" : "none";
    });
}
document.addEventListener("click", function (e) {
    if (!e.target.closest(".col-md-3")) {
        document.querySelectorAll(".select-dropdown").forEach(d => d.style.display = "none");
    }
});

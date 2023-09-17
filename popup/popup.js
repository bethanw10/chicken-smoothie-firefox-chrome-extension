// TODO split up

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function restoreSettings() {
    chrome.storage.local.get(null, async function (res) {
        $("#group-page-size").attr("value", res.groupPageSize || '100');
        $("#archive-page-size").attr("value", res.archivePageSize || '100');

        if (res.selectedRarities && res.selectedRarities.length != 0) {
            $(`#${res.selectedRarities.join(", #")}`).prop("checked", true);
        }

        if (res.selectedRenameRarities && res.selectedRenameRarities.length != 0) {
            $(`#${res.selectedRenameRarities.join(", #")}`).prop("checked", true);
        }

        $('#exclude-unknown').prop('checked', res.excludeUnknown);
        $('#keep-oldest').prop('checked', res.keepOldest);

        if (res.closedAccordions && res.closedAccordions.length != 0) {
            res.closedAccordions.forEach(function (el) {
                toggleAccordion($(`#${el}`)[0]);
            });
        }

        if (res.fromDate) {
            $('#from-date').datepicker('setDate', res.fromDate);
        }

        if (res.toDate) {
            $('#to-date').datepicker('setDate', res.toDate);
        }

        if (res.renameFromDate) {
            $('#rename-from-date').datepicker('setDate', res.renameFromDate);
        }

        if (res.renameToDate) {
            $('#rename-to-date').datepicker('setDate', res.renameToDate);
        }

        $('#rename-rarity').prop('checked', res.renameRarity);
        $('#rename-date').prop('checked', res.renameDate);

        $('#enable-group-page-size').prop('checked', res.enableGroupPageSize);
        $('#enable-archive-page-size').prop('checked', res.enableArchivePageSize);

        // Show or hide checkboxes (?)
        saveRenameRarity();
        saveRenameDate();
        saveEnableGroupPageSize();
        saveEnableArchivePageSize();

        let tab = await getCurrentTab();

        chrome.tabs
            .sendMessage(tab.id, { "message": "getRarityCounts" }, displayRarityCount);

        chrome.tabs
            .sendMessage(tab.id, { "message": "getWishlistCounts" }, displayWishlistCounts);

        updateDuplicateCount();
        updateDateCount();
    });
}

/* 
    The content scripts defined in manifest.json will only be injected when reloading a page AFTER installing the extension
    If the user installs the extension and tries to use it immediately on an already open CS page
    The content script will not be there and won't work

    So load the scripts manually if they don't exist
*/
async function checkContentScript() {
    let tab = await getCurrentTab();

    chrome.tabs.sendMessage(tab.id, { "message": "checkScriptExists" }, function (msg) {
        msg = msg || {};
        if (msg !== true) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["/library/jquery.js", "content-script.js"]
            });

            restoreSettings();
        }
    });
}

/*DUPLICATES */
async function selectDuplicates() {
    checkContentScript();
    let tab = await getCurrentTab();

    chrome.tabs.sendMessage(tab.id, {
        "message": "selectDuplicates",
        "excludeUnknown": $('#exclude-unknown').prop('checked'),
        "keepOldest": $('#keep-oldest').prop('checked')
    });

    return false;
}

async function updateDuplicateCount() {
    let tab = await getCurrentTab();

    chrome.tabs
        .sendMessage(tab.id, {
            "message": "getDuplicateCount",
            "excludeUnknown": $('#exclude-unknown').prop('checked')
        }, function (count) {
            if (count !== undefined) {
                $('#duplicates-button').text(`Select ${count} ${count == 1 ? 'pet' : 'pets'}`);
            }
        });
}

function saveExcludeUnknown() {
    updateDuplicateCount();

    chrome.storage.local.set({
        excludeUnknown: $('#exclude-unknown').prop('checked')
    });
}

function saveKeepOldest() {
    chrome.storage.local.set({
        keepOldest: $('#keep-oldest').prop('checked')
    });
}

/* DATES */
function setupDatepickers() {
    $('[data-toggle="datepicker"]').datepicker({
        inline: true,
        startDate: new Date(2008, 6, 1),
        endDate: new Date(),
        weekStart: 1,
        autoHide: true,
        format: 'yyyy-mm-dd'
    });

    $('#from-date').on('pick.datepicker', function (e) {
        $('#to-date').datepicker('setStartDate', e.date);
        updateDateCount();
        chrome.storage.local.set({ fromDate: e.date.toString() });
    });

    $('#to-date').on('pick.datepicker', function (e) {
        $('#from-date').datepicker('setEndDate', e.date);
        updateDateCount();
        chrome.storage.local.set({ toDate: e.date.toString() });
    });

    $('#rename-from-date').on('pick.datepicker', function (e) {
        $('#rename-to-date').datepicker('setStartDate', e.date);
        chrome.storage.local.set({ renameFromDate: e.date.toString() });
    });

    $('#rename-to-date').on('pick.datepicker', function (e) {
        $('#rename-from-date').datepicker('setEndDate', e.date);
        chrome.storage.local.set({ renameToDate: e.date.toString() });
    });
}

async function selectDates() {
    let tab = await getCurrentTab();

    chrome.tabs.sendMessage(tab.id, {
        "message": "selectDates",
        "fromDate": $("#from-date").datepicker("getDate"),
        "toDate": $("#to-date").datepicker("getDate")
    });
}

async function updateDateCount() {
    let tab = await getCurrentTab();

    chrome.tabs
        .sendMessage(tab.id, {
            "message": "getDateCount",
            "fromDate": $("#from-date").datepicker("getDate"),
            "toDate": $("#to-date").datepicker("getDate")
        }, function (count) {
            if (count !== undefined) {
                $('#date-button').text(`Select ${count} ${count == 1 ? 'pet' : 'pets'}`);
            }
        });
}

/*RENAME */
async function renamePets(e) {
    e.preventDefault();

    let tab = await getCurrentTab();
    chrome.tabs.sendMessage(tab.id, {
        "message": "renamePets",
        "name": $("#rename-name").val(),
        "rarities": $('#rename-rarity').prop('checked') ? getSelectedRenameRarities('value') : null,
        "fromDate": $('#rename-date').prop('checked') ? $("#rename-from-date").datepicker("getDate") : null,
        "toDate": $('#rename-date').prop('checked') ? $("#rename-to-date").datepicker("getDate") : null
    });
}

function getSelectedRenameRarities(attribute) {
    var selected = [];
    $('#rename-rarity-form input:checked').each(function () {
        selected.push($(this).attr(attribute));
    });

    return selected;
}

function saveRenameDate() {
    var panel = $('#rename-date-row')[0].nextElementSibling;
    if ($('#rename-date').prop('checked')) {
        $(panel).addClass('active');
    } else {
        $(panel).removeClass('active');
    }

    chrome.storage.local.set({
        renameDate: $('#rename-date').prop('checked')
    });
}

function saveRenameRarity() {
    var panel = $('#rename-rarity-row')[0].nextElementSibling;

    if ($('#rename-rarity').prop('checked')) {
        $(panel).addClass('active');
    } else {
        $(panel).removeClass('active');
    }

    chrome.storage.local.set({
        renameRarity: $('#rename-rarity').prop('checked')
    });
}

/*SELECT BY RARITY */
function updateRarityCount(rarityCounts) {
    if (!rarityCounts) {
        return;
    };

    var values = getSelectedRarities("value");

    var total = 0;
    for (var value of values) {
        if (rarityCounts[value]) {
            total += rarityCounts[value];
        }
    }

    $('#rarity-button').text(`Select ${total} ${total == 1 ? 'pet' : 'pets'}`);
}

async function selectRarities() {
    let tab = await getCurrentTab();
    chrome.tabs.sendMessage(tab.id, {
        "message": "selectRarities",
        "rarities": getSelectedRarities('value')
    });

    return false;
}

function getSelectedRarities(attribute) {
    var selected = [];
    $('#rarity-form input:checked').each(function () {
        selected.push($(this).attr(attribute));
    });

    return selected;
}

function displayRarityCount(rarityCounts) {
    if (!rarityCounts) {
        return;
    }

    updateRarityCount(rarityCounts);

    $(".unknown-count").text(rarityCounts["Unknown"]);
    $(".omg-common-count").text(rarityCounts["OMG so common"]);
    $(".extremely-common-count").text(rarityCounts["Extremely common"]);
    $(".very-common-count").text(rarityCounts["Very common"]);
    $(".common-count").text(rarityCounts["Common"]);
    $(".uncommon-count").text(rarityCounts["Uncommon"]);
    $(".very-uncommon-count").text(rarityCounts["Very uncommon"]);
    $(".extremely-uncommon-count").text(rarityCounts["Extremely uncommon"]);
    $(".rare-count").text(rarityCounts["Rare"]);
    $(".very-rare-count").text(rarityCounts["Very rare"]);
    $(".extremely-rare-count").text(rarityCounts["Extremely rare"]);
    $(".omg-rare-count").text(rarityCounts["OMG so rare!"]);
}

function saveRenameRaritySelections() {
    chrome.storage.local.set({
        selectedRenameRarities: getSelectedRenameRarities('id')
    });
}

async function saveRaritySelections() {
    chrome.storage.local.set({
        selectedRarities: getSelectedRarities('id')
    });

    let tab = await getCurrentTab();
    chrome.tabs
        .sendMessage(tab.id, { "message": "getRarityCounts" }, updateRarityCount);
}

/*WISHLIST*/
function displayWishlistCounts(wishlistCounts) {
    if (!wishlistCounts) {
        return;
    }

    $("#num-owned").text(` ${wishlistCounts["ownedPets"]}/${wishlistCounts["totalPets"]} `);
    $("#num-wishlisted").text(` ${wishlistCounts["wishlistedPets"]}/${wishlistCounts["totalPets"]} `);
}

async function changeWishlist(mode, type) {
    let tab = await getCurrentTab();
    chrome.tabs.sendMessage(tab.id, {
        "message": "changeWishlist",
        "mode": mode,
        "petType": type,
    });

    chrome.tabs
    .sendMessage(tab.id, { "message": "getWishlistCounts" }, displayWishlistCounts);
}

/* ACCORDIONS */

function handleAccordionClick(e) {
    toggleAccordion(this);
}

function toggleAccordion(el) {
    el.classList.toggle("active");
    var panel = el.nextElementSibling;
    panel.style.display = panel.style.display === "none" ? "block" : "none";

    chrome.storage.local.set({
        closedAccordions: getClosedAccordions()
    });
}

function getClosedAccordions() {
    var selected = [];
    $('.accordion.active').each(function () {
        selected.push($(this).attr('id'));
    });

    return selected;
}

/* SETTINGS */
function saveSettings(e) {
    var groupSize = $("#group-page-size").val() || '100';

    chrome.storage.local.set({
        groupPageSize: groupSize
    });

    var archiveSize = $("#archive-page-size").val() || '100';

    chrome.storage.local.set({
        archivePageSize: archiveSize
    });

    addGroupPageSizeRule(groupSize);
    addArchivePageSizeRule(archiveSize);

    e.preventDefault();
}

const GroupPageSizeRuleId = 1;
const ArchivePageSizeRuleId = 2;

function addGroupPageSizeRule(groupSize) {
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            addRules: [{
                "id": GroupPageSizeRuleId,
                "priority": 1,
                "action": {
                    "type": "redirect",
                    "redirect": {
                        "transform": {
                            "queryTransform": {
                                "addOrReplaceParams": [{
                                    "key": "pageSize",
                                    "value": groupSize
                                }]
                            }
                        }
                    }
                },
                "condition": {
                    "urlFilter": "https://www.chickensmoothie.com/accounts/viewgroup.php*",
                    "resourceTypes": ["main_frame"]
                }
            }],
            removeRuleIds: [GroupPageSizeRuleId]
        }
    );
}

function addArchivePageSizeRule(archiveSize) {
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            addRules: [{
                "id": ArchivePageSizeRuleId,
                "priority": 1,
                "action": {
                    "type": "redirect",
                    "redirect": {
                        "transform": {
                            "queryTransform": {
                                "addOrReplaceParams": [{
                                    "key": "pageSize",
                                    "value": archiveSize
                                }]
                            }
                        }
                    }
                },
                "condition": {
                    "urlFilter": "https://www.chickensmoothie.com/archive/*/*",
                    "resourceTypes": ["main_frame"]
                }
            }],
            removeRuleIds: [ArchivePageSizeRuleId]
        }
    );
}

function saveEnableGroupPageSize() {
    var panel = $('#group-page-size-row')[0].nextElementSibling;

    if ($('#enable-group-page-size').prop('checked')) {
        $(panel).addClass('active');

        var groupSize = $("#group-page-size").val() || '100';
        addGroupPageSizeRule(groupSize);

    } else {
        $(panel).removeClass('active');
        chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [GroupPageSizeRuleId] });
    }

    chrome.storage.local.set({
        enableGroupPageSize: $('#enable-group-page-size').prop('checked')
    });
}

function saveEnableArchivePageSize() {
    var panel = $('#archive-page-size-row')[0].nextElementSibling;

    if ($('#enable-archive-page-size').prop('checked')) {
        $(panel).addClass('active');

        var archiveSize = $("#archive-page-size").val() || '100';
        addArchivePageSizeRule(archiveSize);
    } else {
        $(panel).removeClass('active');
        chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [ArchivePageSizeRuleId] });
    }

    chrome.storage.local.set({
        enableArchivePageSize: $('#enable-archive-page-size').prop('checked')
    });
}

function setupPageSizes() {
    if ($('#enable-group-page-size').prop('checked')) {
        var groupSize = $("#group-page-size").val() || '100';
        addGroupPageSizeRule(groupSize);
    } else {
        chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [GroupPageSizeRuleId] });
    }

    if ($('#enable-archive-page-size').prop('checked')) {
        var archiveSize = $("#archive-page-size").val() || '100';
        addArchivePageSizeRule(archiveSize);
    } else {
        chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [ArchivePageSizeRuleId] });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    checkContentScript();

    // Saving state
    $('#rarity-form .custom-checkbox').on('change', saveRaritySelections);
    $('#rename-rarity-form .custom-checkbox').on('change', saveRenameRaritySelections);
    $('#exclude-unknown').change(saveExcludeUnknown);
    $('#keep-oldest').change(saveKeepOldest);
    $('#rename-rarity').on('change', saveRenameRarity);
    $('#rename-date').on('change', saveRenameDate);

    $('#enable-group-page-size').on('change', saveEnableGroupPageSize);
    $('#enable-archive-page-size').on('change', saveEnableArchivePageSize);

    // Restoring state
    restoreSettings();
    setupDatepickers();
    setupPageSizes();

    $(".accordion").on("click", handleAccordionClick);
    $('[data-toggle="tooltip"]').tooltip();

    // Buttons
    $("#date-button").on("click", selectDates);
    $("#rarity-button").on("click", selectRarities);
    $("#duplicates-button").on("click", selectDuplicates);

    $("#wishlist-add-all").on("click", () => changeWishlist("add", "all"));
    $("#wishlist-remove-all").on("click", () => changeWishlist("remove", "all"));
    $("#wishlist-add-unowned").on("click", () => changeWishlist("add", "unowned"));
    $("#wishlist-remove-owned").on("click", () => changeWishlist("remove", "owned"));

    $("#rename-form").on("submit", renamePets);
    $("#settings-form").on("submit", saveSettings);

    $('#rarity-form').find(".checkbox-row").shiftcheckbox({
        checkboxSelector: ':checkbox'
    });

    $('#rename-rarity-form').find(".checkbox-row").shiftcheckbox({
        checkboxSelector: ':checkbox'
    });
});

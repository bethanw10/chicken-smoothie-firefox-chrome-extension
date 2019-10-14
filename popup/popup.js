function saveSettings(e) {
  var value = document.querySelector("#page-size").value;

  browser.storage.local.set({
    pageSize: value
  });

  browser.tabs.reload();

  e.preventDefault();
}

function restoreSettings() {
   var getSettings = browser.storage.local.get(['selectedRarities', 'excludeUnknown', 'closedAccordions', 'pageSize']);
   getSettings.then((res) => {
		$("#page-size").attr("value", res.pageSize || '100');

	   if (res.selectedRarities.length != 0) {
			$(`#${res.selectedRarities.join(", #")}`).prop("checked", true);
	   }

	   $('#exclude-unknown').prop('checked', res.excludeUnknown);

	   if (res.closedAccordions.length != 0) {
		   res.closedAccordions.forEach(function (el) {
				toggleAccordion($(`#${el}`)[0]);
			});
	   }

  });
}

function selectRarities() {
	getActiveTab().then((tab) => {
		browser.tabs.sendMessage(tab[0].id, {
			"message": "selectRarities",
			"rarities": getSelectedRarities('value')
		});
	});

	return false;
}

function selectDuplicates() {
	getActiveTab().then((tab) => {
		browser.tabs.sendMessage(tab[0].id, {
			"message": "selectDuplicates",
			"excludeUnknown" : $('#exclude-unknown').prop('checked')
		});
	});

	return false;
}

function handleAccordionClick(e) {
	toggleAccordion(this);
}

function toggleAccordion(el) {
	el.classList.toggle("active");
	var panel = el.nextElementSibling;
	panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function saveSelections() {
	debugger
	browser.storage.local.set({
		selectedRarities: getSelectedRarities('id'),
		excludeUnknown: $('#exclude-unknown').prop('checked'),
		closedAccordions: getClosedAccordions()
	});
}

function getSelectedRarities(attribute) {
	var selected = [];
	$('#rarity-form input:checked').each(function() {
		selected.push($(this).attr(attribute));
	});

	return selected;
}

function getClosedAccordions() {
	var selected = [];
	$('.accordion.active').each(function() {
		selected.push($(this).attr('id'));
	});

	return selected;
}

function getActiveTab() {
  return browser.tabs.query({active: true, currentWindow: true});
}

function processMessage(request, sender, sendResponse) {
	
}

document.addEventListener("DOMContentLoaded", function() {
    restoreSettings();

	$(".accordion").on("click", handleAccordionClick);

	$('[data-toggle="tooltip"]').tooltip();

	$("#settings-form").on("submit", saveSettings);

	$('#rarity-form').find(".checkbox-row").shiftcheckbox({
		checkboxSelector : ':checkbox'
	});

	$("#rarity-button").on("click", selectRarities);

	$("#duplicates-button").on("click", selectDuplicates);

	
	
	browser.runtime.onMessage.addListener(processMessage);
});

browser.tabs.onActivated.addListener((activeInfo) => {
	browser.tabs.getCurrent().then((tab) => {
		console.log(tab);
	});
});

window.addEventListener("pagehide", saveSelections);

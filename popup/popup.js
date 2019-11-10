function restoreSettings() {
   var getSettings = browser.storage.local.get();
   getSettings.then((res) => {
		$("#page-size").attr("value", res.pageSize || '100');

	    if (res.selectedRarities && res.selectedRarities.length != 0) {
			$(`#${res.selectedRarities.join(", #")}`).prop("checked", true);
	    }

	    $('#exclude-unknown').prop('checked', res.excludeUnknown);

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
		
		getActiveTab().then((tab) => {
			browser.tabs
				.sendMessage(tab[0].id, {"message": "getRarityCounts"})
				.then(displayRarityCount);
	
		updateDuplicateCount();
		updateDateCount();
	});
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

function selectDates() {	
	getActiveTab().then((tab) => {
		browser.tabs.sendMessage(tab[0].id, {
			"message": "selectDates",
			"fromDate": $("#from-date").datepicker("getDate"),
			"toDate": $("#to-date").datepicker("getDate")
		});
	});
}

function getSelectedRarities(attribute) {
	var selected = [];
	$('#rarity-form input:checked').each(function() {
		selected.push($(this).attr(attribute));
	});

	return selected;
}

function displayRarityCount(rarityCounts) {
	updateRarityCount(rarityCounts);
	
	$("#unknown-count").text(rarityCounts["Unknown"]);
	$("#omg-common-count").text(rarityCounts["OMG so common"]);
	$("#very-common-count").text(rarityCounts["Very common"]);
	$("#common-count").text(rarityCounts["Common"]);
	$("#uncommon-count").text(rarityCounts["Uncommon"]);
	$("#rare-count").text(rarityCounts["Rare"]);
	$("#very-rare-count").text(rarityCounts["Very rare"]);
	$("#omg-rare-count").text(rarityCounts["OMG so rare!"]);
}

function handleAccordionClick(e) {
	toggleAccordion(this);
}

function toggleAccordion(el) {
	el.classList.toggle("active");
	var panel = el.nextElementSibling;
	panel.style.display = panel.style.display === "none" ? "block" : "none";
	
	browser.storage.local.set({
		closedAccordions: getClosedAccordions()
	});
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

function setupDatepickers() {
	$('[data-toggle="datepicker"]').datepicker({
		startDate: new Date(2008, 6, 1),
		endDate: new Date(),
		weekStart: 1,
		autoHide: true,
		format: 'yyyy-mm-dd'
	});
	
	$('#from-date').on('pick.datepicker', function (e) {
		$('#to-date').datepicker('setStartDate', e.date);
	    updateDateCount();
	   	browser.storage.local.set({fromDate: e.date});
	});
	
	$('#to-date').on('pick.datepicker', function (e) {
		$('#from-date').datepicker('setEndDate', e.date);	   
		updateDateCount();
		browser.storage.local.set({toDate: e.date});
	});
}

function saveExcludeUnknown() {
	updateDuplicateCount();
	
	browser.storage.local.set({
		excludeUnknown: $('#exclude-unknown').prop('checked')
	});
}

function saveRaritySelections() {		
	browser.storage.local.set({
		selectedRarities: getSelectedRarities('id')
	});
	
	getActiveTab().then((tab) => {
		browser.tabs
			.sendMessage(tab[0].id, {"message": "getRarityCounts"})
			.then(updateRarityCount);
	});
}

function saveSettings(e) {
  var value = document.querySelector("#page-size").value || '100';

  browser.storage.local.set({
    pageSize: value
  });

  e.preventDefault();
}

function updateDuplicateCount() {
	getActiveTab().then((tab) => {	
		browser.tabs
			.sendMessage(tab[0].id, {
				"message": "getDuplicateCount",
				"excludeUnknown" : $('#exclude-unknown').prop('checked')
			})
			.then(function(count) {
				if (count !== undefined) {
					$('#duplicates-button').text(`Select ${count} ${count == 1? 'pet' : 'pets'}`);
				}				
			});
	});
}

function updateDateCount() {
	getActiveTab().then((tab) => {	
		browser.tabs
			.sendMessage(tab[0].id, {
				"message": "getDateCount",
				"fromDate": $("#from-date").datepicker("getDate"),
				"toDate": $("#to-date").datepicker("getDate")
			})
			.then(function(count) {
				if (count !== undefined) {
					$('#date-button').text(`Select ${count} ${count == 1? 'pet' : 'pets'}`);		
				}							 
			});
	});
}

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
	
	$('#rarity-button').text(`Select ${total} ${total == 1? 'pet' : 'pets'}`);	
}

document.addEventListener("DOMContentLoaded", function() {
	// Saving changes
	$('#rarity-form .custom-checkbox').on('change', saveRaritySelections);
	
	$('#exclude-unknown').change(saveExcludeUnknown);
	
    restoreSettings();

	setupDatepickers();
	
	$(".accordion").on("click", handleAccordionClick);

	$('[data-toggle="tooltip"]').tooltip();

	$("#date-button").on("click", selectDates);
	
	$("#settings-form").on("submit", saveSettings);

	$('#rarity-form').find(".checkbox-row").shiftcheckbox({
		checkboxSelector : ':checkbox'
	});

	$("#rarity-button").on("click", selectRarities);

	$("#duplicates-button").on("click", selectDuplicates);	
});

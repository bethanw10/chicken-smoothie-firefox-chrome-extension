function restoreSettings() {
   var getSettings = chrome.storage.local.get(null, function (res) {	   
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
		
		getActiveTab(function(tab) {
			chrome.tabs
				.sendMessage(tab[0].id, {"message": "getRarityCounts"}, displayRarityCount);

			updateDuplicateCount();
			updateDateCount();
		});
  });
}

function selectRarities() {
	getActiveTab(function(tab) {
		chrome.tabs.sendMessage(tab[0].id, {
			"message": "selectRarities",
			"rarities": getSelectedRarities('value')
		});
	});

	return false;
}

function selectDuplicates() {
	getActiveTab(function(tab) {
		chrome.tabs.sendMessage(tab[0].id, {
			"message": "selectDuplicates",
			"excludeUnknown" : $('#exclude-unknown').prop('checked')
		});
	});

	return false;
}

function selectDates() {	
	getActiveTab(function(tab) {
		chrome.tabs.sendMessage(tab[0].id, {
			"message": "selectDates",
			"fromDate": $("#from-date").datepicker("getDate"),
			"toDate": $("#to-date").datepicker("getDate")
		});
	});
}

function renamePets(e) {
	e.preventDefault();
	getActiveTab(function(tab) {
		chrome.tabs.sendMessage(tab[0].id, {
			"message": "renamePets",
			"name": $("#rename-name").val()
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
	if (!rarityCounts) {
		return;
	}
	
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
	
	chrome.storage.local.set({
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

function getActiveTab(callback) {
  return chrome.tabs.query({active: true, currentWindow: true}, callback);
}

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
	   	chrome.storage.local.set({fromDate: e.date.toString()});
	});
	
	$('#to-date').on('pick.datepicker', function (e) {
		$('#from-date').datepicker('setEndDate', e.date);	   
		updateDateCount();
		chrome.storage.local.set({toDate: e.date.toString()});
	});
}

function saveExcludeUnknown() {
	updateDuplicateCount();
	
	chrome.storage.local.set({
		excludeUnknown: $('#exclude-unknown').prop('checked')
	});
}

function saveRaritySelections() {
	chrome.storage.local.set({
		selectedRarities: getSelectedRarities('id')
	});
	
	getActiveTab(function(tab) {
		chrome.tabs
			.sendMessage(tab[0].id, {"message": "getRarityCounts"}, updateRarityCount);
	});
}

function saveSettings(e) {
  var value = $("#page-size").val() || '100';

  chrome.storage.local.set({
    pageSize: value
  });
  
  chrome.tabs.reload();

  e.preventDefault();
}

function updateDuplicateCount() {
	getActiveTab(function(tab) {	
		chrome.tabs
			.sendMessage(tab[0].id, {
				"message": "getDuplicateCount",
				"excludeUnknown" : $('#exclude-unknown').prop('checked')
			}, function(count) {
				if (count !== undefined) {
					$('#duplicates-button').text(`Select ${count} ${count == 1? 'pet' : 'pets'}`);
				}
			});
	});
}

function updateDateCount() {
	getActiveTab(function (tab) {	
		chrome.tabs
			.sendMessage(tab[0].id, {
				"message": "getDateCount",
				"fromDate": $("#from-date").datepicker("getDate"),
				"toDate": $("#to-date").datepicker("getDate")
			}, function(count) {
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

/* 
The content scripts defined in manifest.json will only be injected when reloading a page AFTER installing the extension
If the user installs the extension and tries to use it immediately on an already open CS page
The content script will not be there and won't work

So load the scripts manually if they don't exist
*/
function checkContentScript() {
	getActiveTab(function (tab) {	
		chrome.tabs.sendMessage(tab[0].id, { "message": "checkScriptExists" }, function(msg) {
			msg = msg || {};
			if (msg != true) {
				chrome.tabs.executeScript(tab[0].id, {file: "/library/jquery.js"});
				chrome.tabs.executeScript(tab[0].id, {file: "content-script.js"});
			}
		});
	});

}

document.addEventListener("DOMContentLoaded", function() {
	checkContentScript();
	
	// Saving state
	$('#rarity-form .custom-checkbox').on('change', saveRaritySelections);
	$('#exclude-unknown').change(saveExcludeUnknown);
	
	// Restoring state
    restoreSettings();
	setupDatepickers();
	
	$(".accordion").on("click", handleAccordionClick);
	$('[data-toggle="tooltip"]').tooltip();

	// Buttons
	$("#date-button").on("click", selectDates);	
	$("#rename-form").on("submit", renamePets);	
	$("#settings-form").on("submit", saveSettings);	
	$("#rarity-button").on("click", selectRarities);
	$("#duplicates-button").on("click", selectDuplicates);	

	$('#rarity-form').find(".checkbox-row").shiftcheckbox({
		checkboxSelector : ':checkbox'
	});

});

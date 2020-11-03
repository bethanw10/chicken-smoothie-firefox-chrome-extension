chrome.runtime.onMessage.addListener(processMessage);

function processMessage(request, sender, sendResponse) {
	switch(request.message) {
	  case "checkScriptExists":
		sendResponse(true);
		break;
		
	  case "selectDates":
		selectDates(request);
		break;

	  case "selectRarities":
		selectRarities(request);
		break;

	  case "selectDuplicates":
		selectDuplicates(request);
		break;

	  case "renamePets":
		renamePets(request);
		break;

	  case "getRarityCounts":
		var rarityCounts = getRarityCounts(request);
		sendResponse(rarityCounts);
		break;

	  case "getDuplicateCount":
		var dupeCount = getDuplicateCount(request);
		sendResponse(dupeCount);
		break;

	  case "getDateCount":
		var dateCount = getDateCount(request);
		sendResponse(dateCount);
		break;

	  default:
		break;
	}	
}

function getRarityCounts() {
	var rarityCounts = {};

	for (var pet of $(".pet")) {
		var rarity = getRarity(pet);
		
		if (rarityCounts[rarity]) {
			rarityCounts[rarity] += 1;
		} else {
			rarityCounts[rarity] = 1;
		}
	}

	return rarityCounts;
}

function getDuplicateCount(request) {
	const set = new Set();
	var count = 0;

	for (var pet of $(".pet")) {
		var petImage = $(pet).find("a").find("img");
		var src = petImage.attr('src');
		var imgUrl = src.split('&bg=')[0];
		
		if (!request.excludeUnknown || getRarity(pet) != 'Unknown') {			
			if(!set.has(imgUrl)) {
				set.add(imgUrl);
			} else {
				count++;
			}
		}
	}
	return count;
}

function getDateCount(request) {
	var count = 0;
	
	for (var pet of $(".pet")) {
		var petDate = getDate(pet);
	
		if (dateInRange(new Date(request.fromDate), new Date(request.toDate), petDate)) {
			count++;
		}
	}
	
	return count;
}

function selectRarities(request) {
	for (var pet of $(".pet")) {
		var rarity = getRarity(pet);
		
		var isSelectedRarity = request.rarities.includes(rarity);
		
		var petCheckbox = $(pet).find(".pet-date-row, .pet-name-row").find("input");		
		petCheckbox.prop( "checked", isSelectedRarity );		
	}
}

function selectDates(request) {
	for (var pet of $(".pet")) {
		var petDate = getDate(pet);

		var inRange = dateInRange(new Date(request.fromDate), new Date(request.toDate), petDate);

		var petCheckbox = $(pet).find(".pet-date-row, .pet-name-row").find("input");		
		petCheckbox.prop( "checked", inRange );
	}
}

function selectDuplicates(request) {
	const set = new Set();
		
	for (var pet of $(".pet")) {
		var petImage = $(pet).find("a").find("img");
		var src = petImage.attr('src');
		var imgUrl = src.split('&bg=')[0];
		
		var petCheckbox = $(pet).find(".pet-date-row, .pet-name-row").find("input");

		if (request.excludeUnknown && getRarity(pet) == 'Unknown') {
			petCheckbox.prop( "checked", false );
		} else if(!set.has(imgUrl)) {
			set.add(imgUrl);
			petCheckbox.prop( "checked", false );
		} else {
			petCheckbox.prop( "checked", true );
		}
	}
}

function renamePets(request) {
	var renameButton = $(".rename-pets");
	
	if (!renameButton.hasClass("pet-rename-mode")) {
		$(renameButton[0]).find(".btn-rename-pets").trigger("click");
	}
	
	for (var pet of $(".pet")) {
		var renameInput = $(pet).find(".pet-rename-row").find("input");
		renameInput.val(request.name);
	}
}

function getDate(pet) {
	var petDate = $(pet).find(".pet-adoption-date");
	
	if (petDate.length === 0) {
		return null;
	}
	
	var dateText = petDate[0].innerHTML;
	
	return new Date(dateText);
}

function getRarity(pet) {
	var petRarity = $(pet).find(".pet-rarity");
	
	if (petRarity.length === 0) {
		return "Unknown";
	}
	
	var rarityImage = petRarity.find("img");
	
	if (rarityImage.length === 0) {
		return petRarity[0].innerHTML;
	} else {
		return rarityImage.attr("alt") || "Unknown";
	}	
}

function dateInRange(fromDate, toDate, date) {
	return +fromDate <= +date && +date <= +toDate;
}
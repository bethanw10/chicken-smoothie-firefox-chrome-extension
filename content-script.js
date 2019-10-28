browser.runtime.onMessage.addListener(processMessage);
console.log('injected');

function processMessage(request, sender, sendResponse) {
	switch(request.message) {
	  case "selectRarities":
		selectRarities(request);
		break;
		
	  case "selectDuplicates":
		selectDuplicates(request);
		break;
		
	  case "getRarityCounts":
		var rarityCounts = getRarityCounts(request);
		return Promise.resolve(rarityCounts)
		
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

function selectRarities(request) {		
	for (var pet of $(".pet")) {
		var rarity = getRarity(pet);
		
		var isSelectedRarity = request.rarities.includes(rarity);
		
		var petCheckbox = $(pet).find(".pet-date-row, .pet-name-row").find("input");		
		petCheckbox.prop( "checked", isSelectedRarity );		
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

function getRarity(pet) {
	var rarityImage = $(pet).find(".pet-rarity").find("img");
	return rarityImage.attr("alt") || "Unknown";
}
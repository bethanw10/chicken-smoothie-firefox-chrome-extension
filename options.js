function saveOptions(e) {
  var value = document.querySelector("#page-size").value;
	
  browser.storage.local.set({
    pageSize: value
  });
  e.preventDefault();
}

function restoreOptions() {

}

function getActiveTab() {

}

function selectRarities() {
	var selected = [];
	$('#rarity-form input:checked').each(function() {
		selected.push($(this).attr('value'));
	});
		
	getActiveTab().then((tab) => {
		browser.tabs.sendMessage(tab[0].id, {"rarities": selected});
	});
	
	return false;
}

document.addEventListener("DOMContentLoaded", function() { 
    restoreOptions();

	$('#rarity-form').find(".checkbox-row").shiftcheckbox({
		checkboxSelector : ':checkbox'
	});
	
	document.querySelector("#options-form")
		.addEventListener("submit", saveOptions);
		
	document.querySelector("#rarity-button")
		.addEventListener("click", selectRarities);	
});
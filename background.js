// No query string parameters - add ?test=test
// Other query string parameters - add &test=test
// Existing query string - replace 'test=other' with 'test=test'
var petGroupsUrl = "https://www.chickensmoothie.com/accounts/viewgroup.php*";

var archiveUrl = "https://www.chickensmoothie.com/archive/*/*";

async function redirect(details) {
	chrome.storage.local.get(null, function(result) {
		var pageSize = 0

		if (details.url.includes('archive') && result.enableArchivePageSize) {
			pageSize = result.archivePageSize
		} else if (result.enableGroupPageSize) {
			pageSize = result.groupPageSize
		} else {
			return
		}

		var redirect = addQueryString(details, "pageSize", pageSize || '100');
		
		if (redirect) {
			chrome.tabs.update(details.tabId, {url: redirect.redirectUrl});
		}
	});
}

function addQueryString(details, key, value) {
	var re = new RegExp(`\\?.*(${key}=[^&]+)`)
	var queryString = details.url.match(re);

	if (queryString) {
		if (queryString[1] != `${key}=${value}`) {
			return {
				redirectUrl: details.url.replace(queryString[1], `${key}=${value}`)
			}
		}
	} else {
		var seperator = details.url.includes("?") ? "&" : "?";
			
		return {
			redirectUrl: `${details.url}${seperator}${key}=${value}`
		};	
	}
}

function handleClick() {
  chrome.runtime.openOptionsPage();
}

chrome.browserAction.onClicked.addListener(handleClick);

chrome.webRequest.onBeforeRequest.addListener(
  redirect,
  {urls:[petGroupsUrl, archiveUrl], types:["main_frame"]},
  ["blocking"]
);
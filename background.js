// No query string parameters - add ?test=test
// Other query string parameters - add &test=test
// Existing query string - replace 'test=other' with 'test=test'
var pattern = "https://www.chickensmoothie.com/accounts/viewgroup.php*";

async function redirect(details) {	
	var gettingItem = chrome.storage.local.get('pageSize', function(result) {
		var result = addQueryString(details, "pageSize", result.pageSize || '100');
		
		if (result) {
			chrome.tabs.update(details.tabId, {url: result.redirectUrl});
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
  {urls:[pattern], types:["main_frame"]},
  ["blocking"]
);
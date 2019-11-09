// No query string parameters - add ?test=test
// Other query string parameters - add &test=test
// Existing query string - replace 'test=other' with 'test=test'
var pattern = "https://www.chickensmoothie.com/accounts/viewgroup.php*";

async function redirect(details) {	
	var gettingItem = await browser.storage.local.get('pageSize');
	return addQueryString(details, "pageSize", gettingItem.pageSize || '100');
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
  browser.runtime.openOptionsPage();
}

browser.browserAction.onClicked.addListener(handleClick);

browser.webRequest.onBeforeRequest.addListener(
  redirect,
  {urls:[pattern], types:["main_frame"]},
  ["blocking"]
);
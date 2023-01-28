var cookie_set = true;
document.body.onload = function() {
	setTimeout(function() {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		    chrome.tabs.sendMessage(tabs[0].id, { msg: "isgameselected", data: 'ok' });
		});
	}, 2500);
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request) {
        if (request.msg == "gameselected") {
        	location.href = 'play.html';
        }
    }
});
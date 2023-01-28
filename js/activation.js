document.getElementById("activate").onclick = function() {
	let key = document.getElementById("key").value;
	if (key.length < 25 || key.trim() == "") {
		showerror(`The license key you provided is invalid or empty! Please purchase a correct one and try again! Don't have a clue? Visit <a style="color:cornflowerblue" href="https://victorcasino.com.ng/#activation" target="_blank">https://victorcasino.com.ng/#activation</a>`);
	}
	else {
		let xhttp;
		let formdata = new FormData();
		formdata.append("key", key);
		formdata.append("mt_24", new Date().toString());
		if (XMLHttpRequest) {
			xhttp = new XMLHttpRequest();
		}
		else {
			xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText == "error") {
					showerror(`The license key you provided has expired or is invalid. Please purchase a correct one and try again! Don't have a clue? Visit <a style="color:cornflowerblue" href="https://victorcasino.com.ng/#activation" target="_blank">https://victorcasino.com.ng/#activation</a>`);
				}
				else {
					put_key();
				}
			}
		}
		xhttp.open("POST", "https://victorcasino.com.ng/config.php", true);
		xhttp.send(formdata);
	}
}
let put_key = function() {
	let timestamp = Math.floor(new Date().getTime() / 1000);
	let enc = encrypt(timestamp.toString());
	chrome.storage.sync.set({activation:enc}, ()=> {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		    chrome.tabs.sendMessage(tabs[0].id, { msg: "isgameselected", data: 'ok' });
		});
	});
}
let showerror = (msg)=> {
	let error_dom = document.getElementById("error-display");
	error_dom.innerHTML = msg;
	error_dom.style.display = "block";
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request) {
        if (request.msg == "gameselected") {
        	location.href = 'play.html';
        }
    }
});
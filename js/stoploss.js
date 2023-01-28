document.getElementById("cancel-game").onclick = function() {
	chrome.storage.sync.set({is_stoploss:"false"}, ()=>{
		location.href = "gamewindow.html";
	});
}
document.getElementById("proceed-game").onclick = function() {
	let maxprofit = document.getElementById("max-profit").value;
	let maxloss = document.getElementById("max-loss").value;
	if (maxprofit.match(/^[0-9]+$/) == null || maxloss.match(/^[0-9]+$/) == null) {
		//Failed
	}
	else {
		chrome.storage.sync.set({is_stoploss:"true", maxprofit:parseInt(maxprofit), maxloss:parseInt(maxloss)}, ()=>{
			location.href = "gamewindow.html";
		});
	}
}
document.getElementById("start-game").onclick = function() {
    let mode = document.getElementById("gamemode").value;
    let drawtype = document.getElementById("drawtype").value;
    if (mode.trim() != "" && drawtype.trim() != "") {
        chrome.storage.sync.set({
            gamemode: mode,
            drawtype: drawtype,
            is_stoploss: "false"
        }, () => {
            if (mode == "Manual") {
                location.href = "gamewindow.html";
            } else if (mode == "Auto") {
                location.href = "stoploss.html";
            }
        });
    } else {
        //Failed
    }
}
document.getElementById("close-game").onclick = function() {
    window.close();
}
document.body.onload = function() {
    chrome.storage.sync.get(['activation'], (data) => {
        try {
            let timestamp = Math.floor(new Date().getTime() / 1000);
            let activation_key = data.activation;
            let dec = decrypt(activation_key);
            let timeleft = timestamp - parseInt(dec);
            var days_left = 28 - Math.floor(parseInt(timeleft) / 864000);
            var color = "tomato";
            switch (true) {
                case (days_left <= 10):
                    color = "tomato"
                    break;
                case (days_left <= 18):
                    color = "orange"
                    break;
                case (days_left <= 28):
                    color = "green"
                    break;
            }
            document.getElementById("banner").style.backgroundColor = color;
            document.getElementById("banner").innerHTML = '<i class="fas fa-key"></i> ' + days_left + " day(s) left";
        } catch (error) {}
    });
}
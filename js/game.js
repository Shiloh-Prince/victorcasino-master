var old_ball = "--";
var picked_val = 0;
var profit_made = 0;
var consecutive_losses = 0;
var maxprofit = 0;
var initial_stake = 50;
var tocheckwin = "RED";
var maxloss = 0;
var gamemode = "Auto";
let draws_count = -1;
var drawtype = "3+";
var all_balls = [];
var current_balls = [];
var old_suggestion = "RED";
var is_stoploss = false;
var islost = false;
var inc_counter = 0;
var stakeincrement = "x2";
var ballcolor = "RED";
var current_stake = 50;
var same = false;
var drawid = "";
var timing = 0;
var suggested_color = "RED";
var current_drawid = "";
var total_draws = 0;
var is_playing = false;
var isthree = false;
var begin_increment = false;
var is_staked = false;

function togglemode(x) {
    if (x == "Auto") {
        document.getElementById("game-mode").style.color = "green";
        document.getElementById("game-mode").innerHTML = "Auto";
        document.getElementById("display").innerHTML = `
			<div class="row m-1">
				<h6><b>Stake amount</b></h6>
			</div>
			<div class="row m-1">
				<div class="row">
					<div class="col-sm-9 mb-1">
						<input class="form-control" id="stake" value="50">
					</div>
					<div class="col-sm-3 mb-1">
						<button class="ui green button" id="update-stake">Update</button>
					</div>
				</div>
			</div>
			<div class="row m-1">
				<div class="col-sm-12">
					<span style="color:gray;font-size:12px">
						<i class="fas fa-info-circle"></i> The system will play your game automatically for you when in auto mode
					</span>
				</div>
			</div>
		`;
    } else {
        document.getElementById("game-mode").style.color = "orange";
        document.getElementById("game-mode").innerHTML = "Manual";
        document.getElementById("display").innerHTML = `
			<div class="row m-1">
				<h6><b>Suggestion</b></h6>
			</div>
			<div class="row m-1">
				<div class="row">
					<div class="col-sm-9 mb-1">
						<input class="form-control" style="background-color:gray" readonly="readonly" id="suggestion" value="XXXX">
					</div>
				</div>
			</div>
			<div class="row m-1">
				<div class="col-sm-12">
					<span style="color:gray;font-size:12px">
						<i class="fas fa-info-circle"></i> Suggestions will start appearing after a few draws...
					</span>
				</div>
			</div>
		`;
    }
}
document.body.onload = function() {
    chrome.storage.sync.get(['gamemode', 'drawtype', 'is_stoploss'], (data) => {
        gamemode = data.gamemode;
        drawtype = data.drawtype;
        document.getElementById("draw-type").innerHTML = drawtype.toString();
        selectball();
        is_stoploss = (data.is_stoploss == "true") ? true : false;
        if (data.gamemode == "Auto") {
            if (data.is_stoploss == "true") {
                chrome.storage.sync.get(['maxprofit', 'maxloss'], (presets) => {
                    maxloss = presets.maxloss;
                    maxprofit = presets.maxprofit;
                    setInterval(stoploss, 500);
                });
                document.getElementById("stop-loss").style.backgroundColor = "lawngreen";
            } else {
                document.getElementById("stop-loss").style.backgroundColor = "tomato";
            }
            togglemode("Auto");
            document.getElementById("update-stake").onclick = function() {
                try {
                    setstake(parseInt(document.getElementById("stake").value), 1);
                    initial_stake = parseInt(document.getElementById("stake").value);
                    current_stake = initial_stake;
                } catch (error) {

                }
            }
        } else {
            document.getElementById("stoploss-parent").remove();
            togglemode("Manual");
        }
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: "getdata"
            });
        });
    });
}

function stoploss() {
    if (consecutive_losses >= maxloss || profit_made >= maxprofit) {
        window.close();
    }
}

var countdown;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request) {
        if (request.msg == "_getballs") {
            if (timing <= 40 && timing >= 30) {
                getballs(request.data);
            }
        } else if (request.msg == "_getdata") {
            timing = request.timing;
            if (timing <= 0) {
                document.getElementById("clock").innerHTML = "--";
            } else {
                let timeformat = (timing <= 9) ? "0" + timing : timing;
                document.getElementById("clock").innerHTML = timeformat.toString();
            }
            try {
                clearInterval(countdown);
            } catch (error) {
                //Do nothing
            }
            countdown = setInterval(function() {
                timing--;
                if (timing <= 0) {
                    document.getElementById("clock").innerHTML = "--";
                } else {
                    let timeformat = (timing <= 9) ? "0" + timing : timing;
                    document.getElementById("clock").innerHTML = timeformat.toString();
                }
                if (timing <= -3) {
                    timing = 0;
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    }, (tabs) => {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            msg: "getdata"
                        });
                    });
                }
            }, 1000);
        } else if (request.msg == "_drawid") {
            drawid = request.drawid;
        } else if (request.msg == "_placebet") {
            additemstolist("| PLACED #" + current_stake.toString() + " FOR " + ballcolor.toUpperCase() + " | (" + drawtype + ")");
        } else if (request.msg == "_setstake") {
            current_stake = request.amount;
        }
    }
});

function is_same(list_a, list_b) {
    if (this.current_balls.length != 0) {
        if (list_a.length == list_b.length) {
            let x = -1;
            let result = 0;
            for (let i in list_a) {
                x++;
                if (list_a[x] == list_b[x]) {
                    result++;
                }
            }
            if (result == list_a.length) {
                same = true;
            } else {
                same = false;
            }
        } else {
            same = false;
        }
    } else {
        same = false;
    }
}
//Main Game Logic
function selectball(x = 0) {
    try {
        if (old_ball == ballcolor) {
            //Do nothing
        } else {
            let selector = "";
            let index = 0;
            switch (drawtype) {
                case "0":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 0;
                    break;
                case "2+ (Slow)":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 1;
                    break;
                case "2+ (Rapid)":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 1;
                    break;
                case "3+":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 2;
                    break;
                case "4+":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 3;
                    break;
                case "5+":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 4;
                    break;
                case "6":
                    selector = "div.rainbow__ball." + ballcolor.toLowerCase();
                    index = 5;
                    break;
                default:
                    selector = "div.rainbow__ball.red";
                    index = 0;
                    break;
            }
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    msg: "selectball",
                    index: index,
                    selector: selector
                });
            });
        }
        if (x == 1) {
            placebet();
        }
    } catch (error) {
        //Do nothing
    }
}

function getballs(new_balls) {

    is_same(current_balls, new_balls);

    if (same == false) {

        current_drawid = drawid.toString();

        current_balls = new_balls;

        all_balls.push(current_balls);

        let _map = {
            "RED": "tomato",
            "BLUE": "steelblue",
            "GREEN": "lawngreen",
            "YELLOW": "gold"
        };

        let _balls = [_map[current_balls[0]], _map[current_balls[1]], _map[current_balls[2]], _map[current_balls[3]], _map[current_balls[4]], _map[current_balls[5]], _map[current_balls[6]]];

        let output = `< <span style="color:${_balls[0].toLowerCase()}">${current_balls[0]}</span> <span style="color:${_balls[1].toLowerCase()}">${current_balls[1]}</span> <span style="color:${_balls[2].toLowerCase()}">${current_balls[2]}</span> <span style="color:${_balls[3].toLowerCase()}">${current_balls[3]}</span> <span style="color:${_balls[4].toLowerCase()}">${current_balls[4]}</span> <span style="color:${_balls[5].toLowerCase()}">${current_balls[5]}</span> >`;

        old_ball = ballcolor;

        if (drawtype == "0") {
            if (draws_count >= 48) {

                let prevlist = [0, 0, 0];

                let balllist = ["RED", "GREEN", "BLUE"];

                for (let k = all_balls.length - 50; k < all_balls.length; k++) {
                    let c = [0, 0, 0];
                    for (let s of all_balls[k]) {
                        if (s == "RED") {
                            c[0] = c[0] + 1;
                        } else if (s == "GREEN") {
                            c[1] = c[1] + 1;
                        } else if (s == "BLUE") {
                            c[2] = c[2] + 1;
                        }
                    }
                    prevlist[0] = prevlist[0] + ((c[0] > 0) ? 1 : 0);
                    prevlist[1] = prevlist[1] + ((c[1] > 0) ? 1 : 0);
                    prevlist[2] = prevlist[2] + ((c[2] > 0) ? 1 : 0);
                }
                let ch = 0;
                for (let k = 0; k < prevlist.length; k++) {
                    if (prevlist[k] == 50) {
                        ch++;
                        old_ball = suggested_color;
                        suggested_color = balllist[k];
                        ballcolor = suggested_color;
                        break;
                    }
                }
                if (ch >= 1) {
                    total_draws++;
                    is_staked = true;
                } else {
                    is_staked = false;
                }
            } else {
                draws_count++;
                is_staked = false;
            }
        }



        if (drawtype == "2+ (Slow)") {
            if (draws_count >= 2) {

                let prevlist = [0, 0, 0];

                let balllist = ["RED", "GREEN", "BLUE"];

                for (let k = all_balls.length - 4; k < all_balls.length; k++) {
                    let c = [0, 0, 0];
                    for (let s of all_balls[k]) {
                        if (s == "RED") {
                            c[0] = c[0] + 1;
                        } else if (s == "GREEN") {
                            c[1] = c[1] + 1;
                        } else if (s == "BLUE") {
                            c[2] = c[2] + 1;
                        }
                    }
                    prevlist[0] = prevlist[0] + ((c[0] < 2) ? 1 : 0);
                    prevlist[1] = prevlist[1] + ((c[1] < 2) ? 1 : 0);
                    prevlist[2] = prevlist[2] + ((c[2] < 2) ? 1 : 0);
                }
                let ch = 0;
                for (let k = 0; k < prevlist.length; k++) {
                    if (prevlist[k] == 4) {
                        ch++;
                        old_ball = suggested_color;
                        suggested_color = balllist[k];
                        ballcolor = suggested_color;
                        break;
                    }
                }
                if (ch >= 1) {
                    total_draws++;
                    is_staked = true;
                } else {
                    is_staked = false;
                }
            } else {
                draws_count++;
                is_staked = false;
            }
        }



        if (drawtype == "2+ (Rapid)") {
            ballcolor = suggested_color;
            is_staked = true;
        }


        if (drawtype == "3+") {
            if (draws_count >= 10) {

                let prevlist = [0, 0, 0];

                let balllist = ["RED", "GREEN", "BLUE"];

                for (let k = all_balls.length - 12; k < all_balls.length; k++) {
                    let c = [0, 0, 0];
                    for (let s of all_balls[k]) {
                        if (s == "RED") {
                            c[0] = c[0] + 1;
                        } else if (s == "GREEN") {
                            c[1] = c[1] + 1;
                        } else if (s == "BLUE") {
                            c[2] = c[2] + 1;
                        }
                    }
                    prevlist[0] = prevlist[0] + ((c[0] < 3) ? 1 : 0);
                    prevlist[1] = prevlist[1] + ((c[1] < 3) ? 1 : 0);
                    prevlist[2] = prevlist[2] + ((c[2] < 3) ? 1 : 0);
                }
                let ch = 0;
                for (let k = 0; k < prevlist.length; k++) {
                    if (prevlist[k] == 12) {
                        ch++;
                        old_ball = suggested_color;
                        suggested_color = balllist[k];
                        ballcolor = suggested_color;
                        break;
                    }
                }
                if (ch >= 1) {
                    total_draws++;
                    is_staked = true;
                } else {
                    is_staked = false;
                }
            } else {
                draws_count++;
                is_staked = false;
            }
        }


        if (drawtype == "4+") {
            if (draws_count >= 48) {

                let prevlist = [0, 0, 0];

                let balllist = ["RED", "GREEN", "BLUE"];

                for (let k = all_balls.length - 50; k < all_balls.length; k++) {
                    let c = [0, 0, 0];
                    for (let s of all_balls[k]) {
                        if (s == "RED") {
                            c[0] = c[0] + 1;
                        } else if (s == "GREEN") {
                            c[1] = c[1] + 1;
                        } else if (s == "BLUE") {
                            c[2] = c[2] + 1;
                        }
                    }
                    prevlist[0] = prevlist[0] + ((c[0] < 4) ? 1 : 0);
                    prevlist[1] = prevlist[1] + ((c[1] < 4) ? 1 : 0);
                    prevlist[2] = prevlist[2] + ((c[2] < 4) ? 1 : 0);
                }
                let ch = 0;
                for (let k = 0; k < prevlist.length; k++) {
                    if (prevlist[k] == 50) {
                        ch++;
                        old_ball = suggested_color;
                        suggested_color = balllist[k];
                        ballcolor = suggested_color;
                        break;
                    }
                }
                if (ch >= 1) {
                    total_draws++;
                    is_staked = true;
                } else {
                    is_staked = false;
                }
            } else {
                draws_count++;
                is_staked = false;
            }
        }


        if (drawtype == "5+") {
            if (draws_count >= 308) {

                let prevlist = [0, 0, 0];

                let balllist = ["RED", "GREEN", "BLUE"];

                for (let k = all_balls.length - 310; k < all_balls.length; k++) {
                    let c = [0, 0, 0];
                    for (let s of all_balls[k]) {
                        if (s == "RED") {
                            c[0] = c[0] + 1;
                        } else if (s == "GREEN") {
                            c[1] = c[1] + 1;
                        } else if (s == "BLUE") {
                            c[2] = c[2] + 1;
                        }
                    }
                    prevlist[0] = prevlist[0] + ((c[0] < 5) ? 1 : 0);
                    prevlist[1] = prevlist[1] + ((c[1] < 5) ? 1 : 0);
                    prevlist[2] = prevlist[2] + ((c[2] < 5) ? 1 : 0);
                }
                let ch = 0;
                for (let k = 0; k < prevlist.length; k++) {
                    if (prevlist[k] == 310) {
                        ch++;
                        old_ball = suggested_color;
                        suggested_color = balllist[k];
                        ballcolor = suggested_color;
                        break;
                    }
                }
                if (ch >= 1) {
                    total_draws++;
                    is_staked = true;
                } else {
                    is_staked = false;
                }
            } else {
                draws_count++;
                is_staked = false;
            }
        }


        if (drawtype == "6") {
            if (draws_count >= 9498) {

                let prevlist = [0, 0, 0];

                let balllist = ["RED", "GREEN", "BLUE"];

                for (let k = all_balls.length - 9500; k < all_balls.length; k++) {
                    let c = [0, 0, 0];
                    for (let s of all_balls[k]) {
                        if (s == "RED") {
                            c[0] = c[0] + 1;
                        } else if (s == "GREEN") {
                            c[1] = c[1] + 1;
                        } else if (s == "BLUE") {
                            c[2] = c[2] + 1;
                        }
                    }
                    prevlist[0] = prevlist[0] + ((c[0] == 6) ? 1 : 0);
                    prevlist[1] = prevlist[1] + ((c[1] == 6) ? 1 : 0);
                    prevlist[2] = prevlist[2] + ((c[2] == 6) ? 1 : 0);
                }
                let ch = 0;
                for (let k = 0; k < prevlist.length; k++) {
                    if (prevlist[k] == 9500) {
                        ch++;
                        old_ball = suggested_color;
                        suggested_color = balllist[k];
                        ballcolor = suggested_color;
                        break;
                    }
                }
                if (ch >= 1) {
                    total_draws++;
                    is_staked = true;
                } else {
                    is_staked = false;
                }
            } else {
                draws_count++;
                is_staked = false;
            }
        }

        assertValues(output);

    }
}

function placebet() {
    try {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: "placebet"
            });
        });
    } catch (Exception) {
        //Do nothing
    }
}

function setstake(amount, y = 0) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            msg: "setstake",
            amount: amount
        });
    });
}

function assertValues(output) {
    document.getElementById("board").innerHTML += `${output}<br/>`;
    document.getElementById("board").scrollTop += document.getElementById("board").scrollHeight;
    performlogic();
}

function performlogic() {

    if (drawtype == "0") {
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt == 0) {
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    switch (true) {
                        case (consecutive_losses < 7):
                            current_stake = current_stake;
                            break;
                        case (consecutive_losses < 13):
                            current_stake = initial_stake + 50;
                            break;
                        case (consecutive_losses < 19):
                            current_stake = initial_stake + 150;
                            break;
                        case (consecutive_losses < 22):
                            current_stake = initial_stake + 250;
                            break;
                        case (consecutive_losses < 25):
                            current_stake = initial_stake + 350;
                            break;
                        case (consecutive_losses < 28):
                            current_stake = initial_stake + 450;
                            break;
                        case (consecutive_losses < 31):
                            current_stake = initial_stake + 650;
                            break;
                        case (consecutive_losses < 34):
                            current_stake = initial_stake + 850;
                            break;
                        case (consecutive_losses >= 34):
                            inc_counter++;
                            if (inc_counter % 7 == 0) {
                                current_stake = current_stake + 200;
                            } else {
                                current_stake = current_stake + 100;
                            }
                            break;
                    }
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    inc_counter = 0;
                    consecutive_losses = 0;
                    profit_made += parseInt(current_stake * 12);
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }

            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }



    if (drawtype == "2+ (Slow)") {
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt < 2) {
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    current_stake = parseInt(current_stake * 3);
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    consecutive_losses = 0;
                    profit_made += parseInt(current_stake * 3.2);
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }

            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }


    if (drawtype == "2+ (Rapid)") {
        let id = current_drawid.split("");
        let lastid = parseInt(id[id.length - 1]) + 1;

        switch (lastid) {
            case 0:
                suggested_color = "RED";
                break;
            case 1:
                suggested_color = "RED";
                break;
            case 2:
                suggested_color = "BLUE";
                break;
            case 3:
                suggested_color = "GREEN";
                break;
            case 4:
                suggested_color = "RED";
                break;
            case 5:
                suggested_color = "BLUE";
                break;
            case 6:
                suggested_color = "GREEN";
                break;
            case 7:
                suggested_color = "RED";
                break;
            case 8:
                suggested_color = "BLUE";
                break;
            case 9:
                suggested_color = "GREEN";
                break;
        }
        ballcolor = suggested_color;
        is_staked = true;
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt < 2) {
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    current_stake = parseInt(current_stake * 3);
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    consecutive_losses = 0;
                    profit_made += parseInt(current_stake * 3.2);
                    initial_stake = parseInt(document.getElementById("stake").value);
                    current_stake = initial_stake;
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }

            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }



    if (drawtype == "3+") {
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt < 3) {
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    current_stake = parseInt(current_stake * 1.5);
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    consecutive_losses = 0;
                    profit_made += parseInt(current_stake * 3.2);
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }

            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }


    if (drawtype == "4+") {
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt < 4) {
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    switch (true) {
                        case (consecutive_losses < 7):
                            current_stake = current_stake;
                            break;
                        case (consecutive_losses < 13):
                            current_stake = initial_stake + 50;
                            break;
                        case (consecutive_losses < 19):
                            current_stake = initial_stake + 150;
                            break;
                        case (consecutive_losses < 22):
                            current_stake = initial_stake + 250;
                            break;
                        case (consecutive_losses < 25):
                            current_stake = initial_stake + 350;
                            break;
                        case (consecutive_losses < 28):
                            current_stake = initial_stake + 450;
                            break;
                        case (consecutive_losses < 31):
                            current_stake = initial_stake + 650;
                            break;
                        case (consecutive_losses < 34):
                            current_stake = initial_stake + 850;
                            break;
                        case (consecutive_losses >= 34):
                            inc_counter++;
                            if (inc_counter % 7 == 0) {
                                current_stake = current_stake + 200;
                            } else {
                                current_stake = current_stake + 100;
                            }
                            break;
                    }
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    consecutive_losses = 0;
                    inc_counter = 0;
                    profit_made += parseInt(current_stake * 12);
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }
            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }


    if (drawtype == "5+") {
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt < 5) {
                    stakeincrement = "x1.5";
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    switch (true) {
                        case (consecutive_losses < 31):
                            current_stake = current_stake;
                            break;
                        case (consecutive_losses < 61):
                            current_stake = initial_stake + 25;
                            break;
                        case (consecutive_losses < 91):
                            current_stake = initial_stake + 50;
                            break;
                        case (consecutive_losses < 121):
                            current_stake = initial_stake + 100;
                            break;
                        case (consecutive_losses < 151):
                            current_stake = initial_stake + 200;
                            break;
                        case (consecutive_losses < 171):
                            current_stake = initial_stake + 250;
                            break;
                        case (consecutive_losses < 181):
                            current_stake = initial_stake + 300;
                            break;
                        case (consecutive_losses < 191):
                            current_stake = initial_stake + 350;
                            break;
                        case (consecutive_losses >= 191):
                            current_stake = current_stake + 50;
                            break;
                    }
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    inc_counter = 0;
                    consecutive_losses = 0;
                    profit_made += parseInt(current_stake * 85);
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }

            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }


    if (drawtype == "6") {
        if (picked_val == 2) {
            if (gamemode == "Auto") {
                let cnt = 0;

                for (let i of current_balls) {
                    if (tocheckwin.toLowerCase() == i.toLowerCase()) {
                        cnt++;
                    }
                }
                if (cnt == 6) {
                    stakeincrement = "x1.5";
                    consecutive_losses += 1;
                    profit_made -= current_stake;
                    switch (true) {
                        case (consecutive_losses < 501):
                            current_stake = current_stake;
                            break;
                        case (consecutive_losses < 1001):
                            current_stake = initial_stake + 50;
                            break;
                        case (consecutive_losses < 1501):
                            current_stake = initial_stake + 150;
                            break;
                    }
                    setstake(current_stake, 1);
                    additemstolist("--  YOU LOST 😭 !!!  --");
                    islost = true;
                } else {
                    consecutive_losses = 0;
                    profit_made += parseInt(current_stake * 1500);
                    setstake(initial_stake, 1);
                    additemstolist("--  YOU WON 😨 !!!  --");
                    islost = false;
                }

            }
            picked_val = 0;
        }
        if (is_staked == true) {
            if (gamemode == "Auto") {
                selectball(1);
            } else {
                setsuggestion(suggested_color);
                additemstolist("| RECOMMEDED: " + suggested_color + " (" + drawtype + ")|");
            }
            is_staked = false;
            tocheckwin = suggested_color;
            picked_val = 2;
        }
    }
}

function additemstolist(output) {
    document.getElementById("board").innerHTML += `${output}<br/>`;
    document.getElementById("board").scrollTop += document.getElementById("board").scrollHeight;
}

function setsuggestion(x) {

    document.getElementById("suggestion").value = x;

    switch (x.toUpperCase()) {
        case "RED":
            document.getElementById("suggestion").style.backgroundColor = "tomato";
            break;
        case "GREEN":
            document.getElementById("suggestion").style.backgroundColor = "green";
            break;
        case "BLUE":
            document.getElementById("suggestion").style.backgroundColor = "cornflowerblue";
            break;
    }
    setTimeout(function() {
        document.getElementById("suggestion").value = "XXXX";
        document.getElementById("suggestion").style.backgroundColor = "gray";
    }, 4000);
}
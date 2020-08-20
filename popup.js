var mainDataObj = null;
var settingsObj = null;

function open_settings() {
    mainDataObj.innerHTML = '';

    let tableObj = document.createElement('table');
    tableObj.classList.add("table_settings_table");

    let tr1 = document.createElement('tr');
    let td1 = document.createElement('td');
    let td_label = document.createElement('label');
    td_label.innerText = "Timer Default (sec)";

    let td2 = document.createElement('td');
    let time_input = document.createElement('input');
    time_input.id = "timer_default_sec";

    td2.append(time_input);
    td1.append(td_label);
    tableObj.append(tr1);
    tr1.append(td1);
    tr1.append(td2);

    mainDataObj.append(tableObj);
}

function render(p_challenges) {
    let main = document.getElementById("main_data");

    main.innerHTML = '';
    console.log(p_challenges);

    p_challenges.forEach(function (ele) {
        let closingTime = new Date(ele["close_time"] * 1000);
        console.log(ele["close_time"]);
        let div = document.createElement("div");
        div.setAttribute("c_id", ele['id']);
        div.class = "row";

        let span_title = document.createElement("span");
        span_title.classList.add("column");
        span_title.innerText = ele["title"];
        span_title.classList.add("column_title");
        span_title.classList.add("floatleft");

        let span_time = document.createElement("span");
        span_time.classList.add("column");
        span_time.innerText = closingTime.toLocaleString();
        span_time.classList.add("column_date");
        span_time.classList.add("floatleft");

        let span_count = document.createElement("span");
        span_count.classList.add("column");
        span_count.innerText = renderCountDown(closingTime);
        span_count.classList.add("column_count");
        span_count.classList.add("floatleft");

        let span_button = document.createElement("span");
        span_button.classList.add("column");
        span_button.classList.add("column_button");

        let alarm_button = document.createElement("button");
        let alarm_button_i = document.createElement("i");
        alarm_button.addEventListener("click", function() {
            changeAlarmStatus(ele["close_time"], ele["id"]);
        });

        if(ele['alarm'] == true) {
            alarm_button_i.classList.add("fas");
        } else {
            alarm_button_i.classList.add("far");
        }

        alarm_button_i.classList.add("fa-bell");

        alarm_button_i.id = "bell_icon_" + ele['id'];
        alarm_button.append(alarm_button_i);
        span_button.append(alarm_button);
        div.append(span_title);
        div.append(span_time);
        div.append(span_count);
        div.append(span_button);

        main.append(div);
    });

}

function renderCountDown(dateObj) {
    let returnVal = "";
    let now = new Date().getTime();
    let distance = dateObj - now;
    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    returnVal = days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";

    if (distance < 0) {
        returnVal = "EXPIRED";
    }
    return returnVal;
}

function callbackChangeAlarm(p_challange) {
    console.log(p_challange);
    let alarmStatus = p_challange['alarm'];
    let iconObj = document.getElementById("bell_icon_" + p_challange['id']);

    if(alarmStatus) {
        iconObj.classList.remove("fas");
        iconObj.classList.add("far");

        localGuruDb.setAlarmStatus(p_challange['close_time'],p_challange['id'], false);
    } else {
        iconObj.classList.remove("far");
        iconObj.classList.add("fas");

        localGuruDb.setAlarmStatus(p_challange['close_time'],p_challange['id'], true);
    }

}

function changeAlarmStatus(p_unixstamp, p_id) {
    localGuruDb.getChallenge(p_unixstamp, p_id, callbackChangeAlarm);
}


window.onload = function () {
    localGuruDb.openDatabase();

    currentChallenges = localGuruDb.getCurrentChallenges(this.render);

    //setInterval(localGuruDb.getCurrentChallenges.bind(this, this.render), 1000);

    mainDataObj = document.getElementById("main_data");
    settingsObj = document.getElementById("settings_open");

    settingsObj.onclick = function() {

        open_settings();
    }
}

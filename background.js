let audioNotification = new Audio();
let timerSecDefault = 0;
function initAlarms(p_challenges) {

    for(let i = 0; i < p_challenges.length; i++) {
        let loc_challenge = p_challenges[i];

        let loc_closetime = loc_challenge['close_time'];
        let loc_id = loc_challenge['id'];
        if(loc_challenge['alarm']) {
            localGuruDb.readData(localGuruDb.TABLE.ALARM, localGuruDb.INDEX.ALARM.CLOSE_TIME_ID, [loc_closetime,loc_id], checkChallengeAlarm, false);
        }
    }
}

function checkChallengeAlarm(p_alarm, p_keys) {
    let alarmDate = 0;
    if(p_alarm.length == 0 ) {
        console.log('default alarm settings');
        console.log(p_keys);
        console.log(timerSecDefault);
        let alarmDate = (p_keys[0] - timerSecDefault) * 1000;
        if (Date.now() < alarmDate) {
            let alarmName = p_keys[0] + '_' + p_keys[1];

            chrome.alarms.create(alarmName, {when: alarmDate});
        }

    } else {
        for (let i = 0; i < p_alarm.length; i++) {
            if (p_alarm[i]['done']) {
                continue;
            }

            let alarmDate = (p_alarm[i]["close_time"] - p_alarm[i]['timer_sec']) * 1000;

            if (Date.now() > alarmDate) {
                continue;
            }

            let alarmName = p_alarm[i]['close_time'] + '_' + p_alarm[i]['id'] + '_' + p_alarm[i]['timer_count'];

            chrome.alarms.create(alarmName, {when: alarmDate});

        }
    }
}

function sendNotification(p_closeTime, p_id) {
    console.log('sendNotification');
    console.log(p_closeTime);
    console.log(p_id);
    audioNotification.src = 'alarm.mp3';
    audioNotification.play();
    localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, null, [p_closeTime, p_id], function(p_challengeObj) {
        console.log(p_challengeObj);
        chrome.notifications.create('ChallengeReminder', {
            type: 'basic',
            iconUrl: 'images/get_started128.png',
            title: 'Don\'t forget ' + p_challengeObj['title'] + ' is ending!',
            message: 'You have things to do. Wake up, dude!'
        }, function(notificationId) {

        });

    }, true);

}

document.addEventListener('DOMContentLoaded', (event) => {
    localGuruDb.openDatabase(function() {
        reloadTimer();
    });

});

chrome.alarms.onAlarm.addListener(function (alarm) {

    if(typeof alarm == "undefined" || alarm.name == "") return;

    let alarmName = alarm.name;
    let alarmKeys = alarmName.split('_');
    let close_time = parseInt(alarmKeys[0]);
    let id = parseInt(alarmKeys[1]);
    let count = parseInt(alarmKeys[2]);

    sendNotification(close_time,id);

    localGuruDb.readData(localGuruDb.TABLE.ALARM, null, [close_time,id,count], function(p_singleAlarm) {
        let alarm = p_singleAlarm;
        alarm['done'] = true;
        localGuruDb.putData(localGuruDb.TABLE.ALARM, alarm);
    }, true);

});

chrome.notifications.onClicked.addListener(function() {
    audioNotification.pause();
    audioNotification.currentTime = 0;
})

function reloadTimer() {
    localGuruDb.readData(localGuruDb.TABLE.SETTINGS, null, 'timer_default_sec',function(p_dataSettings) {
        console.log(p_dataSettings);
        timerSecDefault = parseInt(p_dataSettings['value']);
            chrome.alarms.clearAll(function( wasCleared) {
                localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, localGuruDb.INDEX.CHALLENGE.TIMESTAMP, IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000)), initAlarms, false);
            });

    }, true);



}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        type = request.type;

        switch (type) {
            case 'reloadTimer':
                reloadTimer();
                break;
            default:
                url = request.url;
                if (url.includes("get_member_joined_active_challenges")) {

                    console.log(request);
                    data = JSON.parse(request.data_body);

                    challenges = data.challenges;

                    challenges.forEach(function (ele) {
                        localGuruDb.putData(localGuruDb.TABLE.CHALLENGE, {id: ele.id, title: ele.title, close_time: ele.close_time, alarm: true })

                    });
                    reloadTimer();

                }
                break;
        }



    });





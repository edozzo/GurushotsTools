let audioNotification = new Audio();

chrome.alarms.create({periodInMinutes: 1.0});

chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log('alarm trigger');
    localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, localGuruDb.INDEX.CHALLENGE.TIMESTAMP, IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000)), checkEndingChallenges, false);

});

localGuruDb.openDatabase();

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        url = request.url;
        if (url.includes("get_member_joined_active_challenges")) {

            console.log(request);
            data = JSON.parse(request.data_body);

            challenges = data.challenges;

            challenges.forEach(function (ele) {
                localGuruDb.putData(localGuruDb.TABLE.CHALLENGE, {id: ele.id, title: ele.title, close_time: ele.close_time, alarm: true })

            });


        }

    });

function checkEndingChallenges(p_challenges) {
    console.log('checkEndingChallenges');
    console.log(p_challenges);
    for(let i = 0; i < p_challenges.length; i++) {
        let loc_challenge = p_challenges[i];
        console.log(loc_challenge);

        let loc_closetime = loc_challenge['close_time'];
        let loc_id = loc_challenge['id'];

        console.log(loc_closetime);
        console.log(loc_id);
        localGuruDb.readData(localGuruDb.TABLE.ALARM, localGuruDb.INDEX.ALARM.CLOSE_TIME_ID, [loc_closetime,loc_id], checkChallengeAlarm, false);
    }
}

function checkChallengeAlarm(p_alarm) {
    console.log('checkChallengeAlarm');
    console.log(p_alarm);
    for(let i = 0; i < p_alarm.length; i++) {
        if(p_alarm[i]['done']) {
            continue;
        }

        let close_date = new Date(p_alarm[i]["close_time"] * 1000);
        let alarmDate =  new Date((p_alarm[i]["close_time"] - p_alarm[i]['timer_sec'] ) * 1000);

        console.log(new Date());
        console.log(alarmDate);
        console.log(new Date() > alarmDate);
        if(new Date() > alarmDate) {
            sendNotification(p_alarm[i]['close_time'],p_alarm[i]['id']);
            let alarm = p_alarm[i];
            alarm['done'] = true;
            localGuruDb.putData(localGuruDb.TABLE.ALARM, alarm);
        }
    }
}

chrome.notifications.onClicked.addListener(function() {
    audioNotification.pause();
    audioNotification.currentTime = 0;
})

function sendNotification(p_closeTime, p_id) {
    console.log('sendNotification');

    audioNotification.src = 'alarm.mp3';
    audioNotification.play();
    localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, null, [p_closeTime, p_id], function(p_challengeObj) {
        chrome.notifications.create('ChallengeReminder', {
            type: 'basic',
            iconUrl: 'images/get_started128.png',
            title: 'Don\'t forget ' + p_challengeObj['title'] + ' is ending!',
            message: 'You have things to do. Wake up, dude!'
        }, function(notificationId) {

        });

    }, true);

}




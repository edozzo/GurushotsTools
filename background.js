chrome.alarms.create({delayInMinutes: 3.0})

chrome.alarms.onAlarm.addListener(function (alarm) {


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





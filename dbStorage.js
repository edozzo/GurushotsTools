var callMeBack = null;
if (!('indexedDB' in window)) {
    window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}

var localGuruDb = {};
localGuruDb.openDatabase = function() {
    console.log('open db');
    var req = indexedDB.open("guruDB", 1);

    console.log(req);
    req.onsuccess = function(e) {
        localGuruDb.db = e.target.result;
        console.log('opened');
        console.log(localGuruDb.db);

        if (callMeBack != null) {
            callMeBack();
        }
    };

    req.onupgradeneeded = function(e) {
        localGuruDb.db = e.target.result;

        localGuruDb.initDb();


    };
}

localGuruDb.initDb = function () {
    if (!localGuruDb.db.objectStoreNames.contains("challenges")) {
        let challenges = localGuruDb.db.createObjectStore("challenges", {keyPath: ['close_time','id']} );
        let index = challenges.createIndex('timestamp_idx', 'close_time');
    }

}

localGuruDb.addOrUpdateChallenges = function (p_id, p_title, p_close_time, p_alarm) {
    if(!localGuruDb.db) {
        callMeBack = localGuruDb.addOrUpdateChallenges.bind(this, p_id, p_title, p_close_time);
        localGuruDb.openDatabase();
        return;
    } else {
        if(callMeBack == this ) callMeBack = null;
    }

    let challenge = { id: p_id, title: p_title, close_time: p_close_time, alarm: p_alarm  };

    let transaction = localGuruDb.db.transaction('challenges', 'readwrite');
    let challenges = transaction.objectStore('challenges');

    let responseOperation = challenges.put(challenge);

    responseOperation.onerror = function() {
        console.error("Error", responseOperation.error);
    };

    transaction.complete;


}

localGuruDb.getCurrentChallenges = function (callbackFunction) {

    if(!localGuruDb.db) {
        callMeBack = localGuruDb.getCurrentChallenges.bind(this, callbackFunction);
        localGuruDb.openDatabase();
        return;
    } else {
        if(callMeBack == this ) callMeBack = null;
    }

    let transaction = localGuruDb.db.transaction('challenges', 'readonly');
    let challenges = transaction.objectStore('challenges');
    let timestampIndex = challenges.index("timestamp_idx");

    if ('getAll' in challenges) {
        timestampIndex.getAll(IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000), true)).onsuccess = function(event) {
            console.log(callbackFunction);
            if(typeof callbackFunction == "function") {
                callbackFunction(event.target.result);
            }
        };
    }

}

localGuruDb.getChallenge = function (p_unixstamp, p_id, callbackFunction) {
    if(!localGuruDb.db) {
        callMeBack = localGuruDb.getChallenge.bind(this, p_unixstamp, p_id, callbackFunction);
        localGuruDb.openDatabase();
        return;
    } else {
        if(callMeBack == this ) callMeBack = null;
    }

    let transaction = localGuruDb.db.transaction('challenges', 'readonly');
    let challenges = transaction.objectStore('challenges');

    let operation = challenges.get([p_unixstamp, p_id]);
    operation.onerror = function() {
        console.log("button 30");
        callbackFunction(null);
    }

    operation.onsuccess = function(event) {
        console.log(operation.result);

        if(callbackFunction) callbackFunction(operation.result);
    }
}

localGuruDb.setAlarmStatus = function (p_unixstamp, p_id, p_status) {
    if(!localGuruDb.db) {
        callMeBack = localGuruDb.setAlarmStatus.bind(this, p_unixstamp, p_id, p_status);
        localGuruDb.openDatabase();
        return;
    } else {
        if(callMeBack == this ) callMeBack = null;
    }

    let transaction = localGuruDb.db.transaction('challenges', 'readwrite');
    let challenges = transaction.objectStore('challenges');
    let read_operation = challenges.get([p_unixstamp, p_id]);

    read_operation.onsuccess = function() {
        let data = read_operation.result;
        data['alarm'] = p_status;
        let responseOperation = challenges.put(data);

        responseOperation.onerror = function() {
            console.error("Error", responseOperation.error);
        };
        transaction.complete;
    }

    read_operation.onerror = function() {
        console.error("Error", responseOperation.error);
    };

}
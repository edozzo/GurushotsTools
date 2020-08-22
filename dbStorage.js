var localGuruDb = {};
localGuruDb.initSettings = false;
localGuruDb.openDatabase = function(p_callbackFunction) {
    if(localGuruDb.db)
        return;

    console.log('open db');
    var req = indexedDB.open("guruDB", 5);

    console.log(req);
    req.onsuccess = function(e) {
        localGuruDb.db = e.target.result;

        if(localGuruDb.initSettings) {
            localGuruDb.initSettings = false;

            let initSettings = {keyCode: 'timer_default_sec', value: 1200, label: 'Timer Default (sec)' }
            localGuruDb.putData(localGuruDb.TABLE.SETTINGS, initSettings);
        }

        if(typeof p_callbackFunction == "function")
            p_callbackFunction();
    };

    req.onupgradeneeded = function(e) {
        localGuruDb.db = e.target.result;

        localGuruDb.initDb(e.target.transaction);


    };
}

localGuruDb.initDb = function (p_transaction) {
    let challenges = null;
    let alarms = null;
    if (!localGuruDb.db.objectStoreNames.contains("challenges")) {
        challenges = localGuruDb.db.createObjectStore("challenges", {keyPath: ['close_time','id']} );
        let index = challenges.createIndex('timestamp_idx', 'close_time');
    }

    if (!localGuruDb.db.objectStoreNames.contains("alarms")) {
        alarms = localGuruDb.db.createObjectStore("alarms", {keyPath: ['close_time','id','timer_count']} );

    }

    let storeAlarms = p_transaction.objectStore(localGuruDb.TABLE.ALARM);

    if(!storeAlarms.indexNames.contains("alarms_idx")) {
        let alarms_index = storeAlarms.createIndex('alarms_idx', ['close_time','id']);
    }

    if (!localGuruDb.db.objectStoreNames.contains("settings")) {
        let settings = localGuruDb.db.createObjectStore("settings", {keyPath: 'keyCode'} );
        localGuruDb.initSettings = true;


    }
}

localGuruDb.deleteData = function (p_table, p_keys, p_callbackFuction) {
    let transaction = localGuruDb.db.transaction(p_table, 'readwrite');
    let storeObj = transaction.objectStore(p_table);
    let responseOperation = storeObj.delete(p_keys);
    responseOperation.onerror = function() {
        console.error("Error", responseOperation.error);
    };
    responseOperation.onsuccess = function() {
        transaction.complete;

        if(typeof p_callbackFuction == "function") {
            p_callbackFuction();
        }
    }
}

localGuruDb.putData = function(p_table, p_record) {

    let transaction = localGuruDb.db.transaction(p_table, 'readwrite');
    let storeObj = transaction.objectStore(p_table);
    let responseOperation = storeObj.put(p_record);
    responseOperation.onerror = function() {
        console.error("Error", responseOperation.error);
    };
    responseOperation.onsuccess = function() {
        transaction.complete;
    }
}

localGuruDb.readData = function(p_table, p_index, p_keys, p_callbackFunction, p_single) {
    console.log('readData');

    let transaction = localGuruDb.db.transaction(p_table, 'readonly');
    let storeObj = transaction.objectStore(p_table);
    let indexObj = (p_index)?storeObj.index(p_index):null;
    let operation = null;

    if(p_single) {
        console.log('single');
        operation = (indexObj)?indexObj.get(p_keys):storeObj.get(p_keys);
    } else {
        // here that we are getting multiple data p_keys is not only an array that contains primary key but could be a key condition ex. IDBKeyRange
        console.log('multiple')
        operation = (p_index)?indexObj.getAll(p_keys) :storeObj.getAll(p_keys );
    }
    operation.onerror = function() {
        p_callbackFunction(null);
    }

    operation.onsuccess = function(event) {
        console.log('success');
        console.log(event.target.result);
        console.log(p_single);
        if(typeof p_callbackFunction == "function") p_callbackFunction((p_single)?operation.result:event.target.result,p_keys);
    }
}

localGuruDb.getCurrentChallenges = function (callbackFunction) {
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

localGuruDb.TABLE = { CHALLENGE: 'challenges', ALARM: 'alarms', SETTINGS: 'settings' }
localGuruDb.INDEX = { CHALLENGE: { TIMESTAMP: 'timestamp_idx'}, ALARM: { CLOSE_TIME_ID: 'alarms_idx'}}


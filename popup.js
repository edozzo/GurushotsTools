var guruToolsApp = {
    mainDataObj: null,
    settingsObj: null,

    open_settings: function(p_settings, p_keys) {
        guruToolsApp.mainDataObj.innerHTML = '';

        let tableObj = document.createElement('table');
        tableObj.classList.add("table_settings_table");

        p_settings.forEach(function (ele) {
            let tr1 = document.createElement('tr');
            let td1 = document.createElement('td');
            let td_label = document.createElement('label');
            td_label.innerText = ele.label;

            let td2 = document.createElement('td');
            let time_input = document.createElement('input');
            time_input.id = ele.keyCode;
            time_input.value = ele.value;
            time_input.classList.add('settings_inputs');
            time_input.setAttribute('label', ele.label);

            td2.append(time_input);
            td1.append(td_label);
            tableObj.append(tr1);
            tr1.append(td1);
            tr1.append(td2);

            }
        );

        guruToolsApp.mainDataObj.append(tableObj);

        let saveButton = document.createElement('button');
        saveButton.classList.add('save_settings');
        saveButton.innerText = 'Save';
        saveButton.onclick = function() {
            let settings_inputs_objs = document.getElementsByClassName('settings_inputs');
            for (var i = 0; i < settings_inputs_objs.length; i++) {
                let inputEle = settings_inputs_objs[i];
                let value = {keyCode: inputEle.id, value: inputEle.value, label:inputEle.getAttribute('label') }
                localGuruDb.putData(localGuruDb.TABLE.SETTINGS,value);
            }

            localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, localGuruDb.INDEX.CHALLENGE.TIMESTAMP, IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000)), guruToolsApp.render, false);
        }

        guruToolsApp.mainDataObj.append(saveButton);

    },
    render: function render(p_challenges, p_keys) {
        console.log('render');
        console.log(p_challenges);
        let main = document.getElementById("main_data");

        main.innerHTML = '';

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
            span_title.classList.add("float-left");

            let span_time = document.createElement("span");
            span_time.classList.add("column");
            span_time.innerText = closingTime.toLocaleString();
            span_time.classList.add("column_date");
            span_time.classList.add("float-left");

            let span_count = document.createElement("span");
            span_count.classList.add("column");
            span_count.innerText = guruToolsApp.renderCountDown(closingTime);
            span_count.classList.add("column_count");
            span_count.classList.add("float-left");

            let span_button = document.createElement("span");
            span_button.classList.add("column");
            span_button.classList.add("column_button");

            let alarm_button = document.createElement("button");
            let alarm_button_i = document.createElement("i");
            alarm_button.addEventListener("click", function() {
                guruToolsApp.changeAlarmStatus(ele["close_time"], ele["id"]);
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

            let span_button2 = document.createElement("span");
            span_button2.classList.add("column");
            span_button2.classList.add("column_button");

            let list_button = document.createElement("button");
            let list_button_i = document.createElement("i");
            list_button.addEventListener("click", function() {
                localGuruDb.readData(localGuruDb.TABLE.ALARM,localGuruDb.INDEX.ALARM.CLOSE_TIME_ID,[ele["close_time"], ele["id"]], guruToolsApp.openAlarmMgr,false);
            });

            list_button_i.classList.add("fas");
            list_button_i.classList.add("fa-list");

            list_button_i.id = "list_icon_" + ele['id'];
            list_button.append(list_button_i);
            span_button.append(list_button);


            div.append(span_title);
            div.append(span_time);
            div.append(span_count);
            div.append(span_button);
            div.append(span_button2);

            main.append(div);
        });

    },
    renderCountDown: function renderCountDown(dateObj) {
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
    },
    callbackChangeAlarm: function callbackChangeAlarm(p_challange, p_keys) {
        console.log('callbackChangeAlarm');
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
        chrome.runtime.sendMessage({type:'reloadTimer'});
    },
    changeAlarmStatus: function changeAlarmStatus(p_unixstamp, p_id) {
        localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, null, [p_unixstamp, p_id], guruToolsApp.callbackChangeAlarm, true);
    },
    appInit: function appInit() {
        console.log('appInit');
        console.log(localGuruDb.db);
        currentChallenges = localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, localGuruDb.INDEX.CHALLENGE.TIMESTAMP, IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000)), guruToolsApp.render, false);

        //setInterval(localGuruDb.getCurrentChallenges.bind(this, this.render), 1000);

        guruToolsApp.mainDataObj = document.getElementById("main_data");
        guruToolsApp.settingsObj = document.getElementById("settings_open");

        guruToolsApp.settingsObj.onclick = function() {
            localGuruDb.readData(localGuruDb.TABLE.SETTINGS, null, null,guruToolsApp.open_settings, false);

        }
    },
    openAlarmMgr: function(p_alarmsData, p_keys) {
        let main = document.getElementById("main_data");
        main.innerHTML ="";

        let tableObj = document.createElement('table');
        tableObj.classList.add("table_settings_table");

        if(p_alarmsData.length == 0) {
            let alarm1 = guruToolsApp.generateTr('alarm 1','alarm_1', 1200,['alarm_data'], false);
            tableObj.append(alarm1);
        } else {
            for (var i = 0; i < p_alarmsData.length; i++) {
                let alarmIdx = i + 1;
                let alarmNextLabel = 'alarm ' + alarmIdx;
                let alarmNextId = 'alarm_' + alarmIdx;
                let classList = ['alarm_data','input_readonly'];
                let alarm_obj = guruToolsApp.generateTr(alarmNextLabel,alarmNextId, p_alarmsData[i]['timer_sec'],classList, true);
                tableObj.append(alarm_obj);
            }
        }

        guruToolsApp.mainDataObj.append(tableObj);

        let backButton = guruToolsApp.generateButton('back',['back_button' , 'dialog_buttons'],function() {
            localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, localGuruDb.INDEX.CHALLENGE.TIMESTAMP, IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000)), guruToolsApp.render, false);
        });

        let addButton = guruToolsApp.generateButton('Add new row',['Add_row' , 'dialog_buttons'],function() {
            let elements = tableObj.getElementsByTagName('tr');
            let nextiIdNumber = elements.length + 1;
            let alarmNextLabel = 'alarm ' + nextiIdNumber;
            let alarmNextId = 'alarm_' + nextiIdNumber;
            let alarm_obj = guruToolsApp.generateTr(alarmNextLabel,alarmNextId, 1200,['alarm_data'], true);
            tableObj.append(alarm_obj);
        });

        let saveButton = guruToolsApp.generateButton('Save',['save_settings', 'dialog_buttons'],async function() {
            localGuruDb.deleteData(localGuruDb.TABLE.ALARM, p_keys, function() {
                let elements = tableObj.getElementsByClassName('alarm_data');
                for (var i = 0; i < elements.length; i++) {

                    if(elements[i].tagName.toUpperCase() == 'INPUT' ) {
                        let record = "";
                        if (elements[i].readOnly) {
                            record = { close_time: p_keys[0], id: p_keys[1], timer_count: i,timer_sec: elements[i].value, done: true };
                        }
                        record = { close_time: p_keys[0], id: p_keys[1], timer_count: i,timer_sec: elements[i].value, done: false };
                        localGuruDb.putData(localGuruDb.TABLE.ALARM, record);
                    }
                }
                chrome.runtime.sendMessage({type:'reloadTimer'});
                localGuruDb.readData(localGuruDb.TABLE.CHALLENGE, localGuruDb.INDEX.CHALLENGE.TIMESTAMP, IDBKeyRange.lowerBound(Math.floor(Date.now() / 1000)), guruToolsApp.render, false);
            });

        });
        guruToolsApp.mainDataObj.append(saveButton);
        guruToolsApp.mainDataObj.append(addButton);
        guruToolsApp.mainDataObj.append(backButton);


    },
    generateTr: function(p_label, p_id, p_value,p_inputClassList,p_remove) {
        let tr1 = document.createElement('tr');
        let td1 = document.createElement('td');
        let td_label = document.createElement('label');
        td_label.innerText = p_label;
        td1.classList.add("td_label");
        let td2 = document.createElement('td');
        td2.classList.add("td_input");
        let time_input = document.createElement('input');
        time_input.id = p_id;
        time_input.value = p_value;
        if(p_inputClassList) {
            for (var i = 0; i < p_inputClassList.length; i++) {

                time_input.classList.add(p_inputClassList[i]);

                if(p_inputClassList[i] == "input_readonly") {
                    time_input.readOnly = true;
                }
            }
        }

        time_input.setAttribute('label', p_label);

        td2.append(time_input);

        td1.append(td_label);
        tr1.append(td1);

        tr1.append(td2);
        let td3 = document.createElement('td');
        if(p_remove) {

            if(!time_input.readOnly) {
                let spanButton = document.createElement('span');
                spanButton.innerHTML = "<i class=\"far fa-trash-alt\"></i>";
                spanButton.onclick = function (e) {
                    console.log(e.srcElement.parentElement.parentElement.parentElement);
                    let element = e.srcElement;
                    let elementToBeDeleted = null;
                    let table = null;
                    do {
                        if(element.tagName.toUpperCase() == "TR") {
                            elementToBeDeleted = element;

                        }

                        if(element.tagName.toUpperCase() == "TABLE") {
                            elementToBeDeleted.remove();
                            table = element;
                            break;
                        }
                        element = element.parentElement;
                    } while (1==1);

                    let inputArr = table.getElementsByTagName('INPUT');
                    for (var i = 0; i < inputArr.length; i++) {
                        console.log(inputArr[i]);
                    }

                }

                td3.append(spanButton);
            }

        }
        tr1.append(td3);

        return tr1;
    },
    generateButton: function (p_name ,p_classList, p_function) {
        let saveButton = document.createElement('button');
        //'save_settings'
        for (var i = 0; i < p_classList.length; i++) {

            saveButton.classList.add(p_classList[i]);
        }
        //'Save'
        saveButton.innerText = p_name;
        saveButton.onclick = p_function;

        return saveButton;
    }



}
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM completamente caricato e analizzato');
    localGuruDb.openDatabase(guruToolsApp.appInit);
});











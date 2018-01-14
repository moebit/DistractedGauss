"use strict";

window.addEventListener('load', () => {
    //get setting info from local storage when page loads
    //chrome.storage.local.get(['isRunning', 'removeSug', 'theaterMode', 'removeComments', 'replayMode', 'stopAutoPlayMode'], value => {
    chrome.storage.local.get(['isRunning', 'removeSug', 'theaterMode', 'removeComments', 'replayMode'], value => {
        document.getElementById('control-button').innerText = (value["isRunning"] ? "Pause" : "Resume");
        value['removeSug'] != null ? document.getElementById('remove-suggestions').checked = value["removeSug"] : null;
        value['theaterMode'] != null ? document.getElementById('theatermode').checked = value["theaterMode"] : null;
        value['removeComments'] != null ? document.getElementById('remove-comments').checked = value["removeComments"] : null;
        value['replayMode'] != null ? document.getElementById('replaymode').checked = value["replayMode"] : null;
        //value['stopAutoPlayMode'] != null ? document.getElementById('stopautoplaymode').checked = value["stopAutoPlayMode"] : null;

    });
    //get element info of loaded page
    document.getElementById('control-button').addEventListener('click', () => {chrome.storage.local.get(["isRunning"], value => {controlCommand("control", value["isRunning"]);}) });
    document.getElementById('save-settings-button').addEventListener('click', () => (saveSettings(), document.getElementById('save-settings-button').disabled = true));
    //any changes in checkboxes  
    Array.prototype.map.call(document.getElementsByClassName('settings'), checkbox => checkbox.addEventListener('change', () => document.getElementById('save-settings-button').disabled = false)); 

});

var saveSettings = () => {
    chrome.storage.local.set({
        "removeSug": document.getElementById('remove-suggestions').checked,
        "theaterMode": document.getElementById('theatermode').checked,
        "removeComments": document.getElementById('remove-comments').checked,
        "replayMode": document.getElementById('replaymode').checked
        //"stopAutoPlayeMode": document.getElementById('stopautoplaymode').checked
    });
    controlCommand("save_settings");
};

var controlCommand = (type, value) => {
    switch (type) {
        case "control":
            value ? chrome.runtime.sendMessage({command: "pause"}) : chrome.runtime.sendMessage({command: "resume"});
            document.getElementById('control-button').innerText = (value ? "Resume" : "Pause");
            break;
        case "save_settings":
            chrome.runtime.sendMessage({command: "refreshSettings"})
            break;
    }
};





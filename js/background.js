"use strict";

//initialization
chrome.storage.local.set({'isRunning': true, 'removeSug': true, 'theaterMode': true, 'removeComments': true, 'replayMode': false, 'stopAutoPlayMode': true});
var isRunning = true;
var removeSug = true;
var theaterMode = true;
var removeCom = true;
var replayMode = false;
var stopAutoPlayMode = true;

//inject code
const removeSuggestions = ` 
    var suggest = document.querySelector("ytd-watch-next-secondary-results-renderer");
    suggest != null ? suggest.remove() : null;`;
const removeComments = `
    var comments = document.querySelector("ytd-comments");
    comments != null ? comments.remove() : null;`;
//We set wide = 1 or 0 in cookies for theater mode

const replay = `
    if (document.getElementsByClassName('ytp-play-button ytp-button')[0]) {
        document.getElementsByClassName('ytp-play-button ytp-button')[0].click();
    }`;
const autoplay = `
    if (document.querySelector('.ytp-upnext-cancel-button')) { 
        document.querySelector('.ytp-upnext-cancel-button').click();
    }`;
    
//popup
chrome.browserAction.onClicked.addListener(() => { chrome.tabs.create({url: chrome.extension.getURL('attentionCenter.html'), "active": true}) });

//check message
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    switch (request.command){
        case 'pause':
            isRunning = false;
            chrome.storage.local.set({"isRunning": isRunning});
            break;
        case 'resume':
            isRunning = true;
            chrome.storage.local.set({"isRunning": isRunning});
            break;
        case 'refreshSettings':
            refreshSettings();
            console.log(isRunning)
            break;
    }
});

//injection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete'){ 
        var injectedJSCode = 'document.addEventListener("DOMSubtreeModified", () => {';
        if (isSubstring('.youtube.', tab.url) &&  isRunning) {
            var SAP = (stopAutoPlayMode && !replayMode ? autoplay : 'console.log("stop autoplay disabled");');
            var RM = (replayMode ? replay : 'console.log("replay is disabled");');
            var observerNextButtonJSCode = `
            if (typeof(observerNextBtn) !== 'undefined' ) { observerNextBtn.disconnect(); }
            var next_btn_node = document.querySelector('#movie_player > div.ytp-upnext.ytp-suggestion-set.ytp-upnext-autoplay-paused');
            var nxt_btn_config = { attributes: true };
            if(next_btn_node != null && document.querySelector('.ytp-upnext-cancel-button') != null){
                var observerNextBtn = new MutationObserver((mutationsList) => {
                    for(let mutation of mutationsList) {
                        if (mutation.type == 'attributes') {
                            console.log("before");
                            console.log(mutation.target.style.display);
                            if (mutation.attributeName !== 'style') return;
                            if (mutation.target.style.display !== "none") {
                                console.log("after");
                                console.log(mutation.target.style.display);
                               ` + SAP + `
                            }
                        }
                    }
                });
            }`;
            var observerAutoReplayJSCode = `
            if (typeof(observerAutoReplay) !== 'undefined' ) { observerAutoReplay.disconnect(); }
            var button_node = document.getElementsByClassName('ytp-play-button ytp-button')[0];
            var replay_config = { attributes: true };
            if(button_node != null && document.querySelector('.ytp-upnext-cancel-button') != null){
                var observerAutoReplay = new MutationObserver((mutationsList) => {
                    for(let mutation of mutationsList) {
                        if (mutation.type == 'attributes') {
                            if (button_node.getAttribute(mutation.attributeName) == 'Replay'){
                            ` + RM + `
                            }
                        }
                    }
                });
            }`;
            injectedJSCode += (removeSug ? removeSuggestions : '');
            injectedJSCode += (removeCom ? removeComments : '');
            injectedJSCode += (stopAutoPlayMode ? observerNextButtonJSCode + `
                if (typeof(observerNextBtn) !== "undefined") { observerNextBtn.observe(next_btn_node, nxt_btn_config) };
                ` 
                : `
                if (typeof(observerNextBtn) !== "undefined") { observerNextBtn.disconnect(); };
                `);
            injectedJSCode += (replayMode ? observerAutoReplayJSCode + `
                if (typeof(observerAutoReplay) !== "undefined") { observerAutoReplay.observe(button_node, replay_config) };
                `
                : `
                if (typeof(observerAutoReplay) !== "undefined") { observerAutoReplay.disconnect(); }
                `);
            
            injectedJSCode += '});'
            chrome.tabs.executeScript(tabId, {code: injectedJSCode});
            //set wide = 1 for theater mode, wide = 0 for non-theater mode
            theaterMode ? (chrome.cookies.remove({url: tab.url, name: "wide"}), chrome.cookies.set({url: tab.url, name: "wide", value: "1"})) 
            : (chrome.cookies.remove({url: tab.url, name: "wide"}), chrome.cookies.set({utl: tab.url, name: "wide", value: "0"}));
        };
    };
});
//update settings
var refreshSettings = () => {
    chrome.storage.local.get(['isRunning', 'removeSug', 'theaterMode', 'removeComments', 'replayMode', 'stopAutoPlayMode'], value => 
    {
      isRunning = value["isRunning"];
      removeSug = value["removeSug"];
      theaterMode = value["theaterMode"];
      removeCom = value["removeComments"];
      replayMode = value["replayMode"];
      stopAutoPlayMode = value["stopAutoPlayMode"];
    });
  };
//check string
var isSubstring = (subString, string) => {
    return String.prototype.includes.call(string, subString) ? true : false;
};


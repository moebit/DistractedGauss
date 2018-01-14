"use strict";

//initialization
chrome.storage.local.set({'isRunning': true, 'removeSug': true, 'theaterMode': true, 'removeComments': true, 'replayMode': false});
var isRunning = true;
var removeSug = true;
var theaterMode = true;
var removeCom = true;
var replayMode = false;

//inject code
const removeSuggestions = ` 
    var suggest = document.querySelector("ytd-watch-next-secondary-results-renderer");
    suggest != null ? suggest.remove() : null;`;
const removeComments = `
    var comments = document.querySelector("ytd-comments");
    comments != null ? comments.remove() : null;`;
//We set wide = 1 or 0 in cookies for theater mode

const replay = `document.getElementsByClassName('ytp-play-button ytp-button')[0].click();`;


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
            var observerJSCode = `
            if (observer) { observer.disconnect(); }
            var button_node = document.getElementsByClassName('ytp-play-button ytp-button')[0];
            var config = { attributes: true };
            var observer = new MutationObserver((mutationsList) => {
                for(var mutation of mutationsList) {
                    if (mutation.type == 'attributes') {
                        if (button_node.getAttribute(mutation.attributeName) == 'Replay'){`
                        + (replayMode ? replay : 'console.log("disabled");') +
                       `}
                    }
                }
            });`;
            injectedJSCode += (removeSug ? removeSuggestions : '');
            injectedJSCode += (removeCom ? removeComments : '');
            injectedJSCode += (replayMode ? observerJSCode + 'observer.observe(button_node, config);' : 'if (observer) { observer.disconnect(); }');
            injectedJSCode += '});'
            console.log(injectedJSCode);
            chrome.tabs.executeScript(tabId, {code: injectedJSCode});
            console.log(tab.url);
            //set wide = 1 for theater mode, wide = 0 for non-theater mode
            theaterMode ? (chrome.cookies.remove({url: tab.url, name: "wide"}), chrome.cookies.set({url: tab.url, name: "wide", value: "1"})) 
            : (chrome.cookies.remove({url: tab.url, name: "wide"}), chrome.cookies.set({utl: tab.url, name: "wide", value: "0"}));
        };
    };
});
//update settings
var refreshSettings = () => {
    chrome.storage.local.get(['isRunning', 'removeSug', 'theaterMode', 'removeComments', 'replayMode'], value => 
    {
      isRunning = value["isRunning"];
      removeSug = value["removeSug"];
      theaterMode = value["theaterMode"];
      removeCom = value["removeComments"];
      replayMode = value["replayMode"];
    });
  };
//check string
var isSubstring = (subString, string) => {
    return String.prototype.includes.call(string, subString) ? true : false;
};


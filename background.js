/***********************************************************************
  
  https://github.com/VinodLiyanage/Beatly-lyrics-extractor
  -------------------------------- (C) ---------------------------------
                           Author: Vinod Liyanage

************************************************************************/


async function fetchLyrics(url) {
    try {
        return fetch(url).then((res) => res.text());
    } catch (e) {
        return null;
    }
 
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.tabs.onActivated.addListener(async info => {
    const tab = await chrome.tabs.get(info.tabId);
    
    const isAzlyrics = tab.url.startsWith('*://*.azlyrics.com/*');
    isAzlyrics 
      ? chrome.action.enable(tab.tabId) 
      : chrome.action.disable(tab.tabId);
  });
});

chrome.runtime.onMessage.addListener(({ url }, sender, sendResponse) => {
  
  fetchLyrics(url).then((textHTML) => {
    sendResponse({ textHTML: textHTML || null});
  });
  return true;
});


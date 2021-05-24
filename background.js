async function fetchLyrics(url) {
    try {
        return fetch(url).then((res) => res.text());
    } catch (e) {
        console.error(e)
        return null;
    }
 
}

chrome.runtime.onMessage.addListener(({ url }, sender, sendResponse) => {
  console.log("im in background", url);
  fetchLyrics(url).then((textHTML) => {
    sendResponse({ textHTML: textHTML || null});
  });
  return true;
});

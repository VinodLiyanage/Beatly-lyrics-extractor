/***********************************************************************
  
  https://github.com/VinodLiyanage/Beatly-lyrics-extractor
  -------------------------------- (C) ---------------------------------
                           Author: Vinod Liyanage
                         <vinodsliyanage@gmail.com>
************************************************************************/

function alertHandler(type, message = null) {
  const alertSuccess = document.getElementById("alert-success");
  const alertDanger = document.getElementById("alert-danger");

  switch (type) {
    case "success":
      alertSuccess.classList.add("show");
      if (message) {
        alertSuccess.innerText = message;
      }
      break;
    case "danger":
      alertDanger.classList.add("show");
      if (message) {
        alertDanger.innerText = message;
      }
      break;
  }
  setTimeout(() => {
    if (alertSuccess.classList.contains("show")) {
      alertSuccess.classList.remove("show");
    }
    if (alertDanger.classList.contains("show")) {
      alertDanger.classList.remove("show");
    }
  }, 1500);
}

function handleWait() {
  const img = document.createElement("img");
  img.id = "loading-btn";
  img.style.width = "30px";
  img.style.height = "30px";
  img.style.position = "absolute";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%, -50%)";

  try {
    const imageURL = chrome.runtime.getURL("./assets/images/loading.gif");
    img.src = imageURL;
  } catch (e) {
    img.alt = "waiting...";
    null;
  }

  function addWait(btnElement) {
    if (!(btnElement instanceof HTMLElement)) return;

    try {
      if (!btnElement.querySelector("#loading-btn")) {
        btnElement.appendChild(img);
        btnElement.style.opacity = "0.4";
        btnElement.style.cursor = "default";
      } else {
        return;
      }
    } catch {
      null;
    }
  }
  function removeWait(btnElement) {
    if (!(btnElement instanceof HTMLElement)) return;

    const loadingBtn = btnElement.querySelector("#loading-btn");
    if (loadingBtn) {
      try {
        btnElement.removeChild(loadingBtn);
        btnElement.style.opacity = "unset";
        btnElement.style.cursor = "unset";
      } catch (e) {
        null;
      }
    } else {
      return;
    }
  }
  return {
    addWait,
    removeWait,
  };
}

function lyricsElementFinder(parentElement = null) {
  /**
   * * find the container element of the lyrics
   * @param {HTMLElement} parentElement - lyrics container element's parent element.
   * @returns {HTMLElement} lyricsContainer - container of the lyrics.
   */

  let banner;

  if (parentElement instanceof HTMLElement) {
    banner = parentElement.querySelector("#azmxmbanner");
  } else {
    banner = document.querySelector("#azmxmbanner");
  }

  if (!(banner instanceof HTMLElement)) return null;
  if (!(banner && banner.parentElement instanceof HTMLElement)) return null;

  //finding lyrics container using its css selector. - first method
  let element = banner.parentElement.querySelector(
    "div.container.main-page > div > div.col-xs-12.col-lg-8.text-center > div:nth-child(8)"
  );


  // cleaned the elment array. this array only contains banner.parentElement > div elements only.

  const lyricsElementArray = Array.from(
    banner.parentElement.querySelectorAll("div")
  ).filter((div) => {
    if (div instanceof HTMLElement) {
      return div.parentElement === banner.parentElement;
    }
    return false;
  });

  if (!lyricsElementArray.length) return;

  //finding lyrics container using its sibilings - Second method
  if (!(element instanceof HTMLElement)) {
    lyricsElementArray.forEach((div, index) => {
      if (!(div instanceof HTMLElement)) return;
      if (index === 0) return;
      if (index === lyricsElementArray.length - 1) return;

      const prevDivElement = lyricsElementArray[index - 1];
      const nextDivElement = lyricsElementArray[index + 1];

      if (!(prevDivElement instanceof HTMLElement)) return;
      if (!(nextDivElement instanceof HTMLElement)) return;

      if (prevDivElement.getAttribute("class") === "ringtone") {
        if (nextDivElement.getAttribute("id") === "azmxmbanner") {
        
          element = div;
          return;
        }
      }
    });
  }

  //finding lyrics element using its content (comment) and its attribute count - third method
  if (!(element instanceof HTMLElement)) {
    lyricsElementArray.forEach((div) => {
      if (!(div instanceof HTMLElement)) return;

      if (div && div.innerHTML) {
        const re =
          /<!-- Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that. -->/gim;
        if (re.test(div.innerHTML) || !div.hasAttributes()) {
          
          element = div;
        }
      }
    });
  }

  if (!(element instanceof HTMLElement)) {
    return null;
  } else {
    if (element && element.innerText) {
      if (element.innerText.length) {
        element.setAttribute("id", "lyrics-container");
        return element;
      }
    }
  }
}

function albemListFinder() {
  /**
   * *find the containers (array) of the anchor tag that contains the lyrics page url (href)
   * @returns {HTMLElement[]} domNodeArray;
   */

  const listAlbumItemArr = [
    ...Array.from(document.querySelectorAll(".list-group-item") || []),
    ...Array.from(document.querySelectorAll(".listalbum-item") || []),
  ];

  if (!(listAlbumItemArr && listAlbumItemArr.length)) {
    return null;
  }
  return listAlbumItemArr;
}

function albemListFindFromSearchResults() {
  const currentUrl = window.location.href;
  if (!(currentUrl && currentUrl.length)) return null;

  const urlRe = /https?:\/\/search\.azlyrics\.com/gim;
  if (!urlRe.test(currentUrl)) {
  
    return null;
  } else {
    null;
  }

  const searchResultContainer = document.querySelector(".container.main-page");
  if (!(searchResultContainer instanceof HTMLElement)) return null;

  const songAnchors = Array.from(
    searchResultContainer.querySelectorAll("a") || []
  );

  if (!(songAnchors && songAnchors.length)) return null;

  const songAnchorsParentMap = songAnchors
    .filter((anchor) => {
      if (!(anchor instanceof HTMLElement)) return false;

      if (anchor.hasAttribute("href")) {
        const hrefCheckRe = /https?:\/\/www\.azlyrics\.com\/lyrics/gim;
        if (hrefCheckRe.test(anchor.href || "")) {
          return true;
        }
      }
      return false;
    })
    .map((anchor) => anchor instanceof HTMLElement && anchor.parentElement);

  if (songAnchorsParentMap && songAnchorsParentMap.length) {
    return songAnchorsParentMap;
  }

  return null;
}

let copyImageURL = null;
try {
  copyImageURL = chrome.runtime.getURL("./assets/images/copy.svg");
} catch (e) {
  null
}

function addCopyButton(element, { id, url }) {
  if (!element) return;
  if (!(element instanceof HTMLElement)) return;
  if (!(id || url)) return;

  element.style.position = "relative";
  element.classList.add("my-1");

  const copybtn = document.createElement("button");
  copybtn.classList.add("btn", "btn-sm", "btn-primary", "m-0", "p-0");
  copybtn.style.position = "absolute";
  copybtn.style.zIndex = "1000";
  copybtn.style.top = "0";
  copybtn.style.right = "0";

  //?

  const img = document.createElement("img");
  img.classList.add("copy-btn-img");
  img.style.width = "24px";
  img.style.height = "24px";

  if (url && url.length) {
    img.dataset.url = url;
    copybtn.dataset.url = url;
  }
  if (id && id.length) {
    img.dataset.id = id;
    copybtn.dataset.id = id;
  }

  try {
    if (copyImageURL) {
      img.src = copyImageURL;
    } else {
      img.src = "";
      img.alt = "copy";
    }
  } catch (e) {
    null;
  }
  copybtn.appendChild(img);

  //?

  try {
    if (id !== null) {
      try {
        const songTitleElement =
          element.parentElement.querySelector(".ringtone").nextElementSibling;
        copybtn.style.top = "unset";
        copybtn.style.right = "unset";
        if (songTitleElement instanceof HTMLElement) {
          songTitleElement.insertAdjacentElement("afterend", copybtn);
        }
      } catch (e) {
        element.insertBefore(copybtn, element.firstChild);
      }
    }
    if (url !== null) {
      element.insertBefore(copybtn, element.firstChild);
    }
  } catch (e) {
    null
  }
}

function copyButtonListener() {
  const copyBtnImageElementArray = Array.from(
    document.querySelectorAll(".copy-btn-img") || []
  );
  const hw = handleWait();
  copyBtnImageElementArray.forEach((imgElement) => {
    if (!(imgElement instanceof HTMLElement)) return;

    imgElement.addEventListener(
      "click",
      async (e) => {
        hw.addWait(imgElement.parentElement);
        await handleButtonClick(e);
        hw.removeWait(imgElement.parentElement);
      },
      false
    );
  });
}

async function handleButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!(chrome.runtime && chrome.runtime.id)) {
    alertHandler("danger", "Please reload the page!");
    return;
  }

  try {
    let id = null;
    let url = null;
    try {
      id = e.target.dataset.id;
      url = e.target.dataset.url;
    } catch (e) {
      id = e.target.parentElement.dataset.id;
      url = e.target.parentElement.dataset.url;
    }

    if (!(url || id)) return;

    let text;

    if (id && id.length) {
      const lyricsElement = document.getElementById(id);
      if (lyricsElement instanceof HTMLElement) {
        text = lyricsElement.innerText || null;
      }
    }

    if (url && url.length) {
      try {
        const songObject = await new Promise((resolve) => {
          chrome.storage.local.get(["songObject"], ({ songObject }) => {
            resolve(songObject);
          });
        });
        if (typeof songObject === "object" && songObject[url]) {
          
          text = songObject[url];
        } else {
         
          text = await fetchLyricsOnline(url);
        }
      } catch (e) {
        null;
      }
    }

    if (text && text.length) {
      text = text.trim();
     
      copyContent(text);
      alertHandler("success");
    }
  } catch (e) {
    alertHandler("danger");
    null;
  }
}

async function fetchLyricsOnline(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ url }, (response) => {
      if (!response || typeof response !== "object") {
        return;
      }
      const textHTML = response.textHTML;

      if (!(textHTML && textHTML.length)) return;

      const tempDiv = document.createElement("div");
      tempDiv.insertAdjacentHTML("beforeend", textHTML);

      const lyricsElement = lyricsElementFinder(tempDiv);

      if (!(lyricsElement instanceof HTMLElement)) return;

      if (lyricsElement) {
        const text = lyricsElement.innerText || null;
        if (typeof text === "string" && text.length) {
          try {
            chrome.storage.local.get("songObject", ({ songObject }) => {
              let newSongObject = {
                [url]: text,
              };
              if (songObject) {
                newSongObject = {
                  ...songObject,
                  ...newSongObject,
                };
              }
              chrome.storage.local.set({ songObject: newSongObject }, () => {
                
                resolve(text);
              });
            });
          } catch (e) {
            resolve(text);
          }
        } else {
          reject(null);
        }
      }
    });
  });
}

function copyContent(text) {
  if (!(text && text.length)) return;
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      null;
    }

    document.body.removeChild(textArea);
  }
  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () {
        //?edit these
        null;
      },
      function (err) {
        null;
      }
    );
  }
  copyTextToClipboard(text);
}

(() => {
  const alertSuccess = document.createElement("div");
  const alertDanger = document.createElement("div");

  for (let elm of [alertSuccess, alertDanger]) {
    if (!(elm instanceof HTMLElement)) continue;

    elm.style.position = "fixed";
    elm.style.top = "0";
    elm.style.left = "50%";
    elm.style.transform = "translate(-50%, 0)";
    elm.style.zIndex = "9999999";
  }
  alertSuccess.classList.add("alert", "alert-success", "hide");
  alertSuccess.setAttribute("id", "alert-success");
  alertSuccess.setAttribute("role", "alert");
  alertSuccess.innerText = "Successfully copied to clipboard";
  document.body.insertBefore(alertSuccess, document.body.firstChild);

  alertDanger.setAttribute("id", "alert-danger");
  alertDanger.classList.add("alert", "alert-danger", "hide");
  alertDanger.setAttribute("role", "alert");
  alertDanger.innerText = "Failed! An error occurred.";
  document.body.insertBefore(alertDanger, document.body.firstChild);
})();

(() => {

  try {
    chrome.storage.local.clear();
  
  } catch (e) {
    null;
  }

  /**
   ** find the container element of the lyrics
   * @returns {HTMLElement}
   */

  const lyricsElement = lyricsElementFinder();
  

  /**
   ** find the containers (array) of the anchor tag that contains the lyrics page url (href)
   *  @returns {HTMLElement[]}
   */
  const listAlbumItemArr = albemListFinder();
 

  const searchResultArr = albemListFindFromSearchResults();
 

  let combinedItemArr = [];
  if (listAlbumItemArr && listAlbumItemArr.length) {
    combinedItemArr.push(...listAlbumItemArr);
  }
  if (searchResultArr && searchResultArr.length) {
    combinedItemArr.push(...searchResultArr);
  }

  if (lyricsElement instanceof HTMLElement) {
    const id = lyricsElement.hasAttribute("id")
      ? lyricsElement.getAttribute("id")
      : null;
    addCopyButton(lyricsElement, { id, url: null });
  }

  if (combinedItemArr && combinedItemArr.length) {
    combinedItemArr
      .filter((listAlbumItem) => {
        return listAlbumItem instanceof HTMLElement;
      })
      .forEach((listAlbumItem) => {
        let url = null;
        if (listAlbumItem.hasAttribute("href")) {
          //*use .href instead of .getAttribute(href), because getAttribute only gets local value, but the href gets the full path.
          url = listAlbumItem.href;
        } else {
          const anchor = listAlbumItem.querySelector("a");
          if (anchor instanceof HTMLElement && anchor.hasAttribute("href")) {
            //*use .href instead of .getAttribute(href), because getAttribute only gets local value, but the href gets the full path.
            url = anchor.href;
          } else {
            return;
          }
        }

        //* test if the lyrics url is valid or not.

        if (!url) return;

        const hrefCheckRe = /https?:\/\/www\.azlyrics\.com\/lyrics/gim;
        if (hrefCheckRe.test(url)) {
          addCopyButton(listAlbumItem, { id: null, url });
        } else {
          return;
        }
      });
  }
  copyButtonListener();
})();

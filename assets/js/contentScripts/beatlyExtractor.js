function alertHandler(type) {
  const alertSuccess = document.getElementById("alert-success");
  const alertDanger = document.getElementById("alert-danger");

  switch (type) {
    case "success":
      alertSuccess.classList.add("show");
      break;
    case "danger":
      alertDanger.classList.add("show");
      break;
  }
  setTimeout(() => {
    if (alertSuccess.classList.contains("show")) {
      alertSuccess.classList.remove("show");
    }
    if (alertDanger.classList.contains("show")) {
      alertDanger.classList.remove("show");
    }
  }, 1000);
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

  if (element instanceof HTMLElement) {
    console.log("element found in method 0");
  }

  // cleaned the elment array. this array only contains banner.parentElement > div elements only.

  const lyricsElementArray = Array.from(
    banner.parentElement.querySelectorAll("div")
  ).filter((div) => div.parentElement === banner.parentElement);

  if (!lyricsElementArray.length) return;

  //finding lyrics container using sibilings - Second method
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
          console.log("element found on method 1");
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
          console.log("element found on method 2");
          element = div;
        }
      }
    });
  }

  if (!(element instanceof HTMLElement)) {
    console.error("element not found or the element is not a HTML element!");
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

function albemListFindFromSearchResults() {
  const currentUrl = window.location.href;
  const urlRe = /https:\/\/search\.azlyrics\.com/gim;
  if (!urlRe.test(currentUrl)) {
    console.log("you are not in search result page");
    return;
  }
  console.log("you are in a song search page");
  const searchResultContainer = document.querySelector(".container.main-page");
  if (!(searchResultContainer instanceof HTMLElement)) return;

  const songAnchors = Array.from(searchResultContainer.querySelectorAll("a"));

  if (songAnchors && songAnchors.length) {
    const songAnchorsParentMap = songAnchors
      .filter((anchor) => {
        if (anchor instanceof HTMLElement) {
          if (anchor.hasAttribute("href")) {
            const hrefCheckRe = /https:\/\/www\.azlyrics\.com\/lyrics/gim;
            if (hrefCheckRe.test(anchor.getAttribute("href"))) {
              return true;
            }
          }
        }
      })
      .map((anchor) => anchor instanceof HTMLElement && anchor.parentElement);
    return songAnchorsParentMap;
  }
  return null;
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

async function fetchLyricsOnline(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ url }, ({ textHTML }) => {
      if (!(textHTML && textHTML.length)) return;

      const tempDiv = document.createElement("div");
      tempDiv.setAttribute("id", "temp-div");
      tempDiv.style.display = "none";
      tempDiv.insertAdjacentHTML("beforeend", textHTML);

      const lyricsElement = lyricsElementFinder(tempDiv);

      if (!(lyricsElement instanceof HTMLElement)) return;

      if (lyricsElement) {
        const text = lyricsElement.innerText || null;
        if (text && text.length) {
          try {
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
                  console.log("added to the sync storage!");
                  resolve(text);
                });
              });
            } catch (e) {
              resolve(text);
            }
          } catch (e) {
            reject(null);
          }
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

const copyImageURL = chrome.runtime.getURL("./assets/images/copy.svg");
function addCopyButton(element, { id, url }) {
  console.log("coy btn");
  if (!element) return;
  if (!(element instanceof HTMLElement)) return;
  if (!(id || url)) return;

  element.style.position = "relative";
  element.classList.add("my-1");

  const copybtn = document.createElement("button");
  copybtn.classList.add("btn", "btn-sm", "btn-primary", "m-0", "p-0");
  copybtn.style.position = "absolute";
  if (id !== null) {
    copybtn.style.top = "0";
  }
  if (url !== null) {
    copybtn.style.top = "50%";
    copybtn.style.transform = "translate(0, -50%)";
  }
  copybtn.style.right = "0";
  copybtn.style.zIndex = "1000";

  const img = document.createElement("img");
  try {
    img.classList.add("copy-btn");
    img.src = copyImageURL;
    img.style.width = "24px";
    img.style.height = "24px";
  } catch (e) {
    null;
  }
  copybtn.appendChild(img);

  if (url && url.length) {
    copybtn.dataset.url = url;
  }
  if (id && id.length) {
    copybtn.dataset.id = id;
  }

  try {
    if(id !== null) {
      try {
        const songTitleElement = element.parentElement.querySelector('.ringtone').nextElementSibling
        copybtn.style.top = 'unset'
        copybtn.style.right = 'unset'
        songTitleElement.insertAdjacentElement('afterend', copybtn)
      } catch(e) {
        element.insertBefore(copybtn, element.firstChild);
      }
    }
    if(url !== null) {
      element.insertBefore(copybtn, element.firstChild);
    }
    console.log("element append succefull!");
  } catch (e) {
    console.error(e);
  }
}

async function handleButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();

  try {
    const id = e.target.parentElement.dataset.id;
    const url = e.target.parentElement.dataset.url;

    if (!(url || id)) return;

    let text;

    if (url && url.length) {
      try {
        const songObject = await new Promise((resolve) => {
          chrome.storage.local.get(["songObject"], ({ songObject }) => {
            resolve(songObject);
          });
        });
        if (typeof songObject === "object" && songObject[url]) {
          console.log("new url is same as prev url!");
          text = songObject[url];
        } else {
          console.log("not found in sync storage.");
          text = await fetchLyricsOnline(url);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (id && id.length) {
      const lyricsElement = document.getElementById(id);
      if (lyricsElement instanceof HTMLElement) {
        text = lyricsElement.innerText || null;
      }
    }
    console.log("song lyrics", text);
    text = text.trim();
    copyContent(text);
    alertHandler("success");
  } catch (e) {
    alertHandler("danger");
    null;
  }
}

function buttonListener() {
  const copyBtnArray = Array.from(document.querySelectorAll(".copy-btn"));
  const hw = handleWait();
  copyBtnArray.forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;

    btn.addEventListener(
      "click",
      async (e) => {
        hw.addWait(btn.parentElement);
        await handleButtonClick(e);
        hw.removeWait(btn.parentElement);
      },
      false
    );
  });
}

(() => {
  console.log("added");

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
          url = listAlbumItem.href;
        } else {
          const anchor = listAlbumItem.querySelector("a");
          if (anchor instanceof HTMLElement && anchor.hasAttribute("href")) {
            url = anchor.href;
          } else {
            return;
          }
        }
        addCopyButton(listAlbumItem, { id: null, url });
      });
  }

  buttonListener();
})();

function handleWait() {
  function addWait(btnElement) {
    const img = document.createElement("img");
    img.id = "loading-btn";
    img.style.width = "30px";
    img.style.height = "30px";
    img.style.position = "absolute";
    img.style.top = "50%";
    img.style.left = "50%";
    img.style.transform = "translate(-50%, -50%)";
    const imageURL = chrome.runtime.getURL("/assets/images/loading.gif");
    try {
      img.src = imageURL;
      if (!btnElement.querySelector("#loading-btn")) {
        btnElement.appendChild(img);
      }
    } catch {
      null;
    }
    btnElement.style.opacity = "0.4";
    btnElement.style.cursor = "default";
  }
  function removeWait(btnElement) {
    const loadingBtn = btnElement.querySelector("#loading-btn");
    if (loadingBtn) {
      btnElement.removeChild(loadingBtn);

      btnElement.style.opacity = "unset";
      btnElement.style.cursor = "unset";
    }
  }
  return {
    addWait,
    removeWait,
  };
}

function lyricsElementFinder(parentElement = null) {
  /**
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

  let element = banner.parentElement.querySelector(
    "div.container.main-page > div > div.col-xs-12.col-lg-8.text-center > div:nth-child(8)"
  );

  console.log('element', element)
  if(element instanceof HTMLElement) {
    console.log('element found in method 0')
  }
  
  // cleaned the elment array. this array only contains banner.parentElement > div elements only.

  const lyricsElementArray = Array.from(
    banner.parentElement.querySelectorAll("div")
  ).filter((div) => div.parentElement === banner.parentElement);

  if (!lyricsElementArray.length) return;

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

  if(!(element instanceof HTMLElement)) {
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
    console.error("element is not a HTML element!");
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
      console.log(lyricsElement);
      if (lyricsElement) {
        const text = lyricsElement.innerText || null;
        if (text && text.length) {
          console.log("song lyrics fetch", text);
          try {
            copyContent(text);
            resolve(text);
          } catch (e) {
            reject(e);
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

function addCopyButton(element, { id, url }) {
  console.log("coy btn");
  if (!element) return;
  if (!(element instanceof HTMLElement)) return;
  if (!id && !url) return;

  element.style.position = "relative";
  element.classList.add("my-2");

  const copybtn = document.createElement("button");
  copybtn.classList.add("copy-btn", "btn", "btn-sm", "btn-primary");
  copybtn.innerText = "copy";
  copybtn.style.position = "absolute";
  copybtn.style.top = "0";
  copybtn.style.right = "0";
  copybtn.style.zIndex = "1000";

  if (url && url.length) {
    copybtn.dataset.url = url;
  }
  if (id && id.length) {
    copybtn.dataset.id = id;
  }

  try {
    element.insertBefore(copybtn, element.firstChild);
    console.log("element append succefull!");
  } catch (e) {
    console.error(e);
  }
}

async function handleButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();

  try {
    const id = e.target.dataset.id;
    const url = e.target.dataset.url;

    if (!url && !id) return;

    if (url && url.length) {
      await fetchLyricsOnline(url);
    }
    if (id && id.length) {
      const lyricsElement = document.getElementById(id);

      if (lyricsElement instanceof HTMLElement) {
        const text = lyricsElement.innerText || null;

        if (text && text.length) {
          console.log("song lyrics local", text);
          try {
            copyContent(text);
          } catch (e) {
            null;
          }
        }
      }
    }
  } catch (e) {
    null;
  }
}

function buttonListener() {
  const copyBtnArray = Array.from(document.querySelectorAll(".copy-btn"));
  const hw = handleWait();
  copyBtnArray.forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;

    btn.addEventListener("click", async (e) => {
      hw.addWait(btn);
      await handleButtonClick(e);
      hw.removeWait(btn);
    });
  });
}

(() => {
  console.log("added");

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

  if (lyricsElement instanceof HTMLElement) {
    const id = lyricsElement.hasAttribute("id")
      ? lyricsElement.getAttribute("id")
      : null;
    addCopyButton(lyricsElement, { id, url: null });
  }

  if (listAlbumItemArr && listAlbumItemArr.length) {
    listAlbumItemArr
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

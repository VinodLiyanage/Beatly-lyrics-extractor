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

function lyricsElementFinder() {
  /**
   * @returns {DOM Element} domNode;
   */
  //!need to be updated...
  // body > div.container.main-page > div > div.col-xs-12.col-lg-8.text-center > div:nth-child(10)
  const methodOne = () => {
    const banner = document.getElementById("azmxmbanner");
    if(!(banner && banner.parentElement)) return;

    const lyricsElementArray = Array.from(
      banner.parentElement.querySelectorAll("div") || []
    ).filter(div => {
        if(div && div.innerHTML) {
            const re = /<!-- Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that. -->/gmi;
            
            if(re.test(div.innerHTML) || !div.hasAttributes()) {
                return true;
            }
        }  
    });
    if(lyricsElementArray && lyricsElementArray.length) {
        const element = lyricsElementArray[0];
        console.log('element', element)
        if (element && element.innerText) {
            if (element.innerText.length) {
              element.setAttribute("id", "lyrics-container");
              return element;
            }
          }
    }
    return null;
  };

  return methodOne();
}

function albemListFinder() {
  /**
   * @returns {DomElement[]} domNodeArray;
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
      tempDiv.innerHTML = textHTML;
      document.body.appendChild(tempDiv);
      console.log("done!");
      const lyricsElement = lyricsElementFinder();
      console.log(lyricsElement);
      if (lyricsElement) {
        const text = lyricsElement.innerText || null;
        if (text && text.length) {
          console.log("song lyrics", text);
          try {
            copyContent(text);
            resolve(text);
          } catch (e) {
            reject(e);
          } finally {
            document.body.removeChild(tempDiv);
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

function addCopyButton(element, val = null) {
  if (!element) return;

  element.style.position = "relative";
  element.classList.add("my-2");

  const copybtn = document.createElement("button");
  copybtn.classList.add("copy-btn", "btn", "btn-sm", "btn-primary");
  copybtn.innerText = "copy";
  copybtn.style.position = "absolute";
  copybtn.style.top = "0";
  copybtn.style.right = "0";
  copybtn.style.zIndex = "1000";
  copybtn.dataset.val = val;

  try {
    element.insertBefore(copybtn, element.firstChild);
    console.log("element append succefull!");
  } catch (e) {
    console.error(e);
  }
}

function buttonListener() {
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const val = e.target.dataset.val;
      if (val && val.length) {
        await fetchLyricsOnline(val);
      } else {
        const lyricsElement = lyricsElementFinder();
        if (lyricsElement) {
          const text = lyricsElement.innerText || null;
          if (text && text.length) {
            console.log("song lyrics", text);
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
  };

  const copyBtnArray = Array.from(document.querySelectorAll(".copy-btn"));
  copyBtnArray.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const hw = handleWait();
      hw.addWait(btn);
      await handleClick(e);
      hw.removeWait(btn);
    });
  });
}

(() => {
  console.log("added");
  const lyricsElement = lyricsElementFinder();
  const listAlbumItemArr = albemListFinder();

  if (lyricsElement) {
    addCopyButton(lyricsElement);
  }

  if (listAlbumItemArr && listAlbumItemArr.length) {
    listAlbumItemArr
      .filter((listAlbumItem) => {
        return listAlbumItem;
      })
      .forEach((listAlbumItem) => {
        let val = null;
        if (listAlbumItem && listAlbumItem.href) {
          val = listAlbumItem.href;
        } else {
          const anchor = listAlbumItem.querySelector("a");
          if (anchor && anchor.href) {
            val = anchor.href;
          } else {
            return;
          }
        }
        addCopyButton(listAlbumItem, val);
      });
  }

  buttonListener();
})();

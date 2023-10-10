import { isUrl } from "./helpers.js";

chrome.commands.onCommand.addListener(function (command) {
  if (command === "search_selection_in_new_tab") {
    openSearchTab_RightClickBehaviour();
  }
});

function getCurrentTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    console.log("getCurrentTab", "tabs", tabs, "tabId", tab.id);
    if (callback) {
      callback(tab);
    }
  });
}

// TODO: Se way to get selected text from PDF
function getPdfSelectedText() {
  // get PDF selected text in chrome internal plugin
  // refer to: https://stackoverflow.com/questions/61076303/how-can-i-get-selected-text-in-pdf-in-javascript
  return new Promise((resolve) => {
    window.addEventListener("message", function onMessage(e) {
      if (
        e.origin === "chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai" &&
        e.data &&
        e.data.type === "getSelectedTextReply"
      ) {
        window.removeEventListener("message", onMessage);
        resolve(e.data.selectedText);
      }
    });
    // runs code in page context to access postMessage of the embedded plugin
    const script = document.createElement("script");
    if (chrome.runtime.getManifest().manifest_version > 2) {
      script.src = chrome.runtime.getURL("query-pdf.js");
    } else {
      script.textContent = `(${() => {
        document
          .querySelector("embed")
          .postMessage({ type: "getSelectedText" }, "*");
      }})()`;
    }
    document.documentElement.appendChild(script);
    script.remove();
  });
}

function injection() {
  //console.log("injection")
  // get DOM selected text
  const domSelectionText = decodeURI(
    encodeURI(
      document.selection
        ? document.selection.createRange().text
        : window.getSelection
        ? window.getSelection()
        : document.getSelection
        ? document.getSelection()
        : ""
    )
  );
  //console.log("injection", "domSelectionText", domSelectionText);
  if (domSelectionText) {
    //console.log("injection", "return domSelectionText", domSelectionText);
    return new Promise((resolve) => resolve(domSelectionText));
  } else if (document.querySelector("embed")) {
    // get PDF selected text in chrome internal plugin
    // refer to: https://stackoverflow.com/questions/61076303/how-can-i-get-selected-text-in-pdf-in-javascript
    //console.log("PDFINJECTION")
    return new Promise((resolve) => {
      window.addEventListener("message", function onMessage(e) {
        if (
          e.origin === "chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai" &&
          e.data &&
          e.data.type === "getSelectedTextReply"
        ) {
          window.removeEventListener("message", onMessage);
          resolve(e.data.selectedText);
        }
      });
      // runs code in page context to access postMessage of the embedded plugin
      const script = document.createElement("script");
      if (chrome.runtime.getManifest().manifest_version > 2) {
        script.src = chrome.runtime.getURL("query-pdf.js");
      } else {
        script.textContent = `(${() => {
          document
            .querySelector("embed")
            .postMessage({ type: "getSelectedText" }, "*");
        }})()`;
      }
      document.documentElement.appendChild(script);
      script.remove();
    });
  } else {
    return "";
  }
}

function getSelectedText(tabId) {
  const injectionResults = chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: injection,
  });

  console.debug("getSelectedText", "injectionaResults", injectionResults);
  const text = injectionResults[0].result;

  return text;
}

// This is the right click bevahiour on selected text
// - If selected text is an URL(The right click show "Go to <text>" in the options),
//     it opens the URL in a new tab, just right after the current tab, and not at the end of all tabs.
// - Else (Search <Google> for <text> in the options), it searches for the text.
function openSearchTab_RightClickBehaviour() {
  getCurrentTab((tab) =>
    getSelectedText(tab.id, (text) => {
      console.log("opening search tab with right click behaviour", tab);

      let url = text;
      if (!isUrl(text)) {
        // TODO: Find a way to replace with default search provider
        url = "https://www.google.com/search?q=" + text;
      }

      chrome.tabs.create({
        url: url,
        active: true,
        openerTabId: tab.id,
        index: tab.index + 1, // This opens the tab just after the current tab
      });
    })
  );

  return true;
}

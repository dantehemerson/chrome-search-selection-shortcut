import { isUrl } from "./helpers.js";

chrome.commands.onCommand.addListener((command, tab) => {
  console.log("TAB IS", tab)
  if (command === "search_selection_in_new_tab") {
    openSearchTab_RightClickBehaviour();
  }
});

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("getCurrentTab", "tabs", tabs);

  return tabs[0];
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

async function getSelectedText(tabId) {
  const injectionResults = await chrome.scripting.executeScript({
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
async function openSearchTab_RightClickBehaviour() {
  const tab = await getCurrentTab();

  const text = await getSelectedText(tab.id);

  console.debug("Opening search tab with right click behaviour", tab);

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

  return true;
}

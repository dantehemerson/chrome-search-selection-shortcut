import { isUrl } from "./helpers.js";

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "search_selection_in_new_tab") {
    openSearchInNewTab(tab);
  } else if (command === "new_tab_to_the_right") {
    newTabToTheRight(tab);
  }
});

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
  if (domSelectionText) {
    //console.log("injection", "return domSelectionText", domSelectionText);
    return new Promise((resolve) => resolve(domSelectionText));
  } else if (document.querySelector("embed")) {
    // get PDF selected text in chrome internal plugin
    // refer to: https://stackoverflow.com/questions/61076303/how-can-i-get-selected-text-in-pdf-in-javascript
    console.log("PDFINJECTION")
    return new Promise((resolve) => {
      window.addEventListener("message", function onMessage(e) {
        console.log('On message', e)
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
      script.src = chrome.runtime.getURL("query-pdf.js");

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

  // console.debug("getSelectedText", "injectionaResults", injectionResults);
  const text = injectionResults[0].result;

  return text;
}

// This is the right click bevahiour on selected text
// - If selected text is an URL(The right click show "Go to <text>" in the options),
//     it opens the URL in a new tab, just right after the current tab, and not at the end of all tabs.
// - Else (Search <Google> for <text> in the options), it searches for the text.
async function openSearchInNewTab(tab) {
  const text = await getSelectedText(tab.id);

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
}


async function newTabToTheRight(tab) {
  chrome.tabs.create({
    url: "chrome://newtab",
    active: true,
    openerTabId: tab.id,
    index: tab.index + 1, // This opens the tab just after the current tab
  });
}
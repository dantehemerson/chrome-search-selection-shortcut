function injection() {
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
    return new Promise((resolve) => resolve(domSelectionText));
  } else {
    return "";
  }
}

export async function getSelectedText(tabId) {
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: injection,
  });

  return injectionResults?.[0]?.result;
}

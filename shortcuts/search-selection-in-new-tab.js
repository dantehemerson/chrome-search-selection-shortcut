import { isUrl, getSelectedText } from "../helpers/index.js";

// This is the right click behaviour on selected text
// - If selected text is an URL (The right click show "Go to <text>" in the options),
//     it opens the URL in a new tab, just right after the current tab, and not at the end of all tabs.
// - Else (Search <Google> for <text> in the options), it searches for the text.
export async function searchSelectionInNewTab(tab) {
  const text = await getSelectedText(tab.id);

  let url = text;
  if (!isUrl(text)) {
    // TODO: Find a way to replace with default search provider
    url = "https://www.google.com/search?q=" + encodeURIComponent(text);
  }

  chrome.tabs.create({
    url: url,
    active: true,
    openerTabId: tab.id,
    index: tab.index + 1, // This opens the tab just after the current tab
  });
}

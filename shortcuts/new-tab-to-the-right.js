export async function newTabToTheRight(tab) {
  chrome.tabs.create({
    url: "chrome://newtab",
    active: true,
    openerTabId: tab.id,
    index: tab.index + 1, // This opens the tab just after the current tab
  });
}

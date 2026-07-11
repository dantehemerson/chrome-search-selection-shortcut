import { searchSelectionInNewTab, newTabToTheRight } from "./shortcuts/index.js";

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "search_selection_in_new_tab") {
    searchSelectionInNewTab(tab);
  } else if (command === "new_tab_to_the_right") {
    newTabToTheRight(tab);
  }
});

// Create one test item for each context type.
var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];

contexts = ["selection"];

for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Test '" + context + "' menu item";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "onclick": genericOnClick
    });

    debugger;

    console.log("'" + context + "' item:" + id);
}

function genericOnClick(info, tab) {
    debugger;

    console.log("item " + info.menuItemId + " was clicked");
    console.log("info: " + JSON.stringify(info));
    console.log("tab: " + JSON.stringify(tab));
}
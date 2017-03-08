document.addEventListener('DOMContentLoaded', function() {

    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, function(selection) {

        document.getElementById("mapIFrame").src =
            "http://maxint.mynetgear.com/?start=" + encodeURIComponent(selection[0].trim());
    });
});
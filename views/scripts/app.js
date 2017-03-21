// 'jquery' returns the jQuery object into '$'
require(['jquery', 'jquery-ui'], function($) {

    if (location.protocol !== "chrome-extension:") {
        $("html").css("min-width", "0px");
        $("#toolbarRight").show();
    } else {
        $("#toolbarRight").hide();
    }

    // DOM ready
    $(function() {
        $.widget("custom.combobox", {
            _create: function() {
                this.wrapper = $("<span>")
                    .addClass("custom-combobox")
                    .insertAfter(this.element);

                this.element.hide();
                this._createAutocomplete();
                this._createShowAllButton();
            },

            _createAutocomplete: function() {
                var selected = this.element.children(":selected"),
                    value = selected.val() ? selected.text() : "";

                this.input = $("<input>")
                    .appendTo(this.wrapper)
                    .val(value)
                    .attr("id", "word")
                    .attr("title", "")
                    .addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
                    // create the widget
                    .autocomplete({
                        delay: 0,
                        minLength: 0,
                        source: $.proxy(this, "_source")
                    })
                    .tooltip({
                        classes: {
                            "ui-tooltip": "ui-state-highlight"
                        }
                    });

                this.input.keyup(function(e) {
                    // Enter works as the Add button
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        return $("#addButton").trigger("click");
                    }
                    // ^Delete removes the word from the list
                    if (e.keyCode == $.ui.keyCode.DELETE && e.ctrlKey) {
                        return $("#delButton").trigger("click");
                    }
                });

                this._on(this.input, {
                    autocompleteselect: function(event, ui) {
                        ui.item.option.selected = true;
                        this._trigger("select", event, {
                            item: ui.item.option
                        });
                    },
                    // autocompletechange: "_removeIfInvalid"
                    autocompletechange: "_addIfMissing"
                });
            },

            _createShowAllButton: function() {
                var input = this.input,
                    wasOpen = false;

                $("<a>")
                    .attr("tabIndex", -1)
                    .attr("title", "Show All Items")
                    .tooltip()
                    .appendTo(this.wrapper)
                    .button({
                        icons: {
                            primary: "ui-icon-triangle-1-s"
                        },
                        text: false
                    })
                    .removeClass("ui-corner-all")
                    .addClass("custom-combobox-toggle ui-corner-right")
                    .on("mousedown", function() {
                        wasOpen = input.autocomplete("widget").is(":visible");
                    })
                    .on("click", function() {
                        input.trigger("focus");

                        // Close if already visible
                        if (wasOpen) {
                            return;
                        }

                        // Pass empty string as value to search for, displaying all results
                        input.autocomplete("search", "");
                    });
            },

            _source: function(request, response) {
                var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
                response(this.element.children("option").map(function() {
                    var text = $(this).text();
                    if (this.value && (!request.term || matcher.test(text)))
                        return {
                            label: text,
                            value: text,
                            option: this
                        };
                }));
            },

            _canFindInList: function(ui) {

                // Selected an item, nothing to do
                if (ui.item) {
                    return true;
                }

                // Search for a match (case-insensitive)
                var value = this.input.val(),
                    valueLowerCase = value.toLowerCase(),
                    valid = false;
                this.element.children("option").each(function() {
                    if ($(this).text().toLowerCase() === valueLowerCase) {
                        this.selected = valid = true;
                        return false;
                    }
                });

                // Found a match, nothing to do
                if (valid) {
                    return true;
                }
            },

            _addIfMissing: function(event, ui) {

                if (this._canFindInList(ui)) {
                    return;
                }

                this.element.append($('<option>', {
                    value: this.input.val(),
                    text: this.input.val()
                }));

            },

            _removeIfInvalid: function(event, ui) {

                if (this._canFindInList(ui)) {
                    return;
                }

                // Remove invalid value
                this.input
                    .val("")
                    .attr("title", value + " didn't match any item")
                    .tooltip("open");
                this.element.val("");
                this._delay(function() {
                    this.input.tooltip("close").attr("title", "");
                }, 2500);
                this.input.autocomplete("instance").term = "";
            },

            _destroy: function() {
                this.wrapper.remove();
                this.element.show();
            }
        });

        $("#wordHistoryCombo").combobox();
        $("#toggle").on("click", function() {
            $("#combobox").toggle();
        });

        // connect the buttons        
        $("#fullScreenButton").on("click", function() {
            fullScreen(fe.outer[0][0], () => fe.fullScreenCancel());
            fe.zoomToFit();
        });

        $("#zoomToFitButton").on("click", function() {
            fe.zoomToFit();
        });

        $(".jlptBtn").on("click", function() {
            fe.jlptSelect(this.title.slice(-1));
        });

        $("#delButton").on("click", function() {
            fe.removeWord('wordHistoryCombo', $('#word').val());
            $('#word').val('');
        });

        $("#addButton").on("click", function() {
            fe.navigateToWord($('#word').val());
        });

        $("#clearButton").on("click", function() {
            fe.clearAll();
        });

    });

});

var fe = {};


function zoomToFit() {

    Frontend.Frontend.prototype.zoomToFit();
}


function fly(word, asExtension, useLocalDictionary = true) {

    var dictionary = useLocalDictionary ? 'localDictionary' : 'serverDictionary';

    // 'bootstrap' does not return an object. Must appear at the end
    require(['jquery', dictionary, 'kanjiNav', 'frontend', 'cola', 'd3', 'js-cookie', 'bootstrap'],
        function($, lookupEngine, kanjiNav, frontend, webColaLibraray, d3, js_cookie) {

            if (asExtension) {
                if (!word || "" == word) {
                    $("#mainDiv").hide();
                    $("#helpDiv").show();
                    $("html").css("min-width", "230px");
                    $("body").css("height", "30px");

                    return;
                } else {
                    $("#helpDiv").hide();
                    $("#mainDiv").show();
                    $("html").css("min-width", "800px");
                    $("body").css("height", "350px");
                }
            }

            fe = new frontend.Frontend(
                new kanjiNav.Graph(lookupEngine.Dictionary),
                webColaLibraray.d3adaptor(d3),
                js_cookie);

            fe.loadWordHistory('#wordHistoryCombo');

            $("#hiddenWordsCombo").change(() => {

                var wordSelected = $("#hiddenWordsCombo").val();
                if (wordSelected) {

                    fe.unhideWord(wordSelected);
                }
            });

            // get first node
            fe.main(word || fe.getParameterByName('start') || '楽しい');
        });
}


// using the "native" api, somehow require-api comes too late for the chrome extension to take off
document.addEventListener('DOMContentLoaded', function() {

    if (!chrome.tabs) {

        // fly "locally" if loaded as a file://..
        fly("", false, location.protocol == "file:");

    } else {
        chrome.tabs.executeScript({
            code: "window.getSelection().toString();"
        }, function(selection) {

            var word = !selection || "" === selection[0] ? "" : selection[0].trim();

            fly(word, true);
        });
    }
});
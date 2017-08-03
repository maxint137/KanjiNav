var fe = {};

var requireConfig = {
    waitSeconds: 120,
    shim: {
        "jquery-ui": {
            deps: ["jquery"],
            exports: "jQuery.ui"
        },
        "bootstrap": { deps: ["jquery", "jquery-ui"] },
        "js-cookie": {}
    },
    paths: {
        "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min",
        "jquery-ui": "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min",
        "d3": "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min",
        "d3-request": "https://cdnjs.cloudflare.com/ajax/libs/d3-request/1.0.5/d3-request.min",
        "d3-collection": "https://cdnjs.cloudflare.com/ajax/libs/d3-collection/1.0.4/d3-collection.min",
        "d3-dispatch": "https://cdnjs.cloudflare.com/ajax/libs/d3-dispatch/1.0.3/d3-dispatch.min",
        "d3-dsv": "https://cdnjs.cloudflare.com/ajax/libs/d3-dsv/1.0.5/d3-dsv.min",
        "bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min",
        "js-cookie": "https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.1.3/js.cookie.min",
        "cola": "./node_modules/webcola/WebCola/cola.min",
        "localDictionary": "./js/scripts/localDictionary",
        "serverDictionary": "./js/scripts/serverDictionary",
        "frontend": "./js/scripts/frontend",
        "knModel": "./js/scripts/knModel",
        "knGraph": "./js/scripts/knGraph",
        "graphStorage": "./js/scripts/graphStorage",
        "data": "./js/scripts/data",
        "reflect-metadata": "./node_modules/reflect-metadata/Reflect",
        "class-transformer": "./node_modules/class-transformer/class-transformer.amd",
    }
};

require.config(requireConfig);

function setupPageControllers() {
    // "jquery" returns the jQuery object into "$"
    require(["jquery", "jquery-ui"], function($) {

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

                    this.element.append($("<option>", {
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
                        .attr("title", value + " didn't match any item ")
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


            $(window).resize(function() {
                fe.onWindowResized();
            });

            $("#wordHistoryCombo").combobox();
            $("#toggle").on("click", function() {
                $("#combobox").toggle();
            });

            // connect the buttons        
            $("#fullScreenButton").on("click", function() {
                fullScreen(fe.outer[0][0], function() { fe.fullScreenCancel(); });
                fe.zoomToFit();
            });

            $("#zoomToFitButton").on("click", function() {
                fe.zoomToFit();
            });

            $(".jlptBtn").on("click", function() {
                fe.jlptSelect(this.title.slice(-1));
            });

            $("#delButton").on("click", function() {
                fe.removeWord("wordHistoryCombo", $("#word").val());
                $("#word").val("");
            });

            $("#addButton").on("click", function() {
                fe.navigateToWord($("#word").val());
            });

            $("#clearButton").on("click", function() {
                fe.clearAll();
            });

            $("#saveButton").on("click", function() {
                fe.saveGraph();
            });

            $("#loadButton").on("click", function() {
                fe.loadGraph();
            });
        });

    });
}

function zoomToFit() {

    Frontend.Frontend.prototype.zoomToFit();
}

// using the "native" api, somehow require-api comes too late for the chrome extension to take off
document.addEventListener("DOMContentLoaded", function() {

    if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.executeScript({
            code: "window.getSelection().toString();"
        }, function(selection) {

            var word = !selection || "" === selection[0] ? "" : selection[0].trim();

            fly(word, true);
        });

    } else {

        // fly "locally" if loaded as a file://..
        fly("", false, location.protocol == "file:");
    }
});

function fly(word, asExtension, useLocalDictionary) {

    var dictionary = useLocalDictionary ? "localDictionary" : "serverDictionary";

    // "bootstrap" does not return an object. Must appear at the end
    var libs = ["jquery",
        dictionary,
        "knGraph",
        "frontend",
        "cola",
        "js-cookie",
        // "MetadataStorage",
        //"serializerTs",
        //"graphStorage",
        "bootstrap"
    ];

    require(libs, function($, lookupEngine, knGraph, frontend, webColaLibrary, d3, d3_request, js_cookie) {

        if (asExtension) {
            if (!word || "" == word) {
                $("#mainDiv").hide();
                $("#helpDiv").show();
                $("html").css("min-width", "230px");
                $("body").css("height", "30px");
            } else {
                $("#helpDiv").hide();
                $("#mainDiv").show();
                $("html").css("min-width", "800px");
                $("body").css("height", "350px");
            }
        }

        fe = new frontend.Frontend(
            new knGraph.Graph(lookupEngine.Dictionary),
            webColaLibrary,
            js_cookie);

        fe.loadWordHistory("#wordHistoryCombo");

        $("#hiddenWordsCombo").change(function() {

            var wordSelected = $("#hiddenWordsCombo").val();
            if (wordSelected) {

                fe.unHideWord(wordSelected);
            }
        });

        setupPageControllers();

        // get first node
        fe.main(word || fe.getParameterByName("start") || "楽しい");
    });
}
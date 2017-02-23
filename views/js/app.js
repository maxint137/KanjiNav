// File: /js/app.js

// 'jquery' returns the jQuery object into '$'
//
// 'bootstrap' does not return an object. Must appear at the end

require(['jquery', 'jquery-ui'], function($) {

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

    });

    // the variables that manage everything, basically
    require(['jquery', 'js/kanjiNav', 'js/frontend', 'cola', 'js-cookie', 'bootstrap'], function($, kanjiNav, frontend, cola, js_cookie) {

        fe = new frontend(new kanjiNav.Graph(), cola, js_cookie);

        fe.loadWordHistory('#wordHistoryCombo');

        // get first node
        fe.main(fe.getParameterByName('start') || '楽しい');
    });
});


var fe = {};
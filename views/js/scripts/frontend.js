/// <reference path="../node_modules/@types/webcola/index.d.ts" />
/// <reference path="../node_modules/@types/js-cookie/index.d.ts" />
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="knApi.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "d3"], function (require, exports, d3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ViewNodeBase = (function () {
        function ViewNodeBase(mn) {
            this.mn = mn;
        }
        Object.defineProperty(ViewNodeBase.prototype, "text", {
            get: function () { return this.mn.text; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "type", {
            get: function () { return this.mn.type; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "id", {
            get: function () { return this.mn.id; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "title", {
            get: function () { return this.mn.title; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "subscript", {
            get: function () { return this.mn.subscript; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "superscript", {
            get: function () { return this.mn.superscript; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "hint", {
            get: function () { return this.mn.hint; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "JLPT", {
            get: function () { return this.mn.JLPT; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "isKanji", {
            get: function () { return this.mn.isKanji; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "hood", {
            get: function () { return this.mn.hood; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewNodeBase.prototype, "degree", {
            get: function () { return this.mn.degree; },
            enumerable: true,
            configurable: true
        });
        return ViewNodeBase;
    }());
    var ViewNode = (function (_super) {
        __extends(ViewNode, _super);
        function ViewNode(mn) {
            var _this = _super.call(this, mn) || this;
            _this.hidden = false;
            return _this;
        }
        return ViewNode;
    }(ViewNodeBase));
    var ViewLink = (function () {
        function ViewLink() {
        }
        return ViewLink;
    }());
    var ViewGraph = (function () {
        function ViewGraph() {
        }
        return ViewGraph;
    }());
    var Frontend = (function () {
        function Frontend(modelGraph, webColaLibrary, cookies) {
            this.modelGraph = modelGraph;
            this.webColaLibrary = webColaLibrary;
            this.cookies = cookies;
            this.calcMySize();
            this.red = "rgb(125, 0, 0)";
            this.viewGraph = {
                nodes: [],
                links: []
            };
            this.viewGraphSaved = {
                nodes: [],
                links: []
            };
            (this.layout = webColaLibrary.d3adaptor(d3))
                .linkDistance(80)
                .avoidOverlaps(true)
                .size([this.width, this.height]);
            // alternatively just use the D3 built-in force layout
            // var layout = d3.layout.force()
            //     .charge(-520)
            //     .linkDistance(80)
            //     .size([width, height]);
            this.outer = d3.select("svg")
                .attr("width", this.width)
                .attr("height", this.height)
                .attr("pointer-events", "all");
            this.nodeMouseDown = false;
            this.setupZooming();
            this.defineGradients();
            this.setupJlptChecks();
        }
        // add layers and zooming to the outer SVG
        Frontend.prototype.setupZooming = function () {
            var _this = this;
            // https://github.com/d3/d3-3.x-api-reference/blob/master/Zoom-Behavior.md
            // Construct a new zoom behavior:
            this.zoom = d3.behavior.zoom();
            this.outer.append('rect')
                .attr('class', 'background')
                .attr('width', "100%")
                .attr('height', "100%")
                .call(this.zoom.on("zoom", function () { return _this.redraw(); }))
                .on("dblclick.zoom", function () { return _this.zoomToFit(); });
            // the layers in play
            this.vis = this.outer.append('g');
            this.edgesLayer = this.vis.append("g");
            this.nodesLayer = this.vis.append("g");
        };
        // define the gradients used down the road: SpikeGradient & (Reverse)EdgeGradient
        Frontend.prototype.defineGradients = function () {
            var defs = this.outer.append("svg:defs");
            function addGradient(id, color1, opacity1, color2, opacity2) {
                var gradient = defs.append("svg:linearGradient")
                    .attr("id", id)
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "0%")
                    .attr("spreadMethod", "pad");
                gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", color1)
                    .attr("stop-opacity", opacity1);
                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", color2)
                    .attr("stop-opacity", opacity2);
            }
            addGradient("SpikeGradient", "red", 1, "red", 0);
            addGradient("EdgeGradient", this.red, 1, "darkGray", 1);
            addGradient("ReverseEdgeGradient", "darkGray", 1, this.red, 1);
        };
        // UF: these are not sufficient anymore, we must (de)serialize the model data as well
        Frontend.prototype.saveGraph = function () {
            this.viewGraphSaved.nodes = this.viewGraph.nodes;
            this.refreshViewGraph();
        };
        Frontend.prototype.loadGraph = function () {
            this.viewGraph.nodes = this.viewGraphSaved.nodes;
            this.refreshViewGraph();
        };
        // adds a word to graph
        Frontend.prototype.main = function (word) {
            var _this = this;
            // Note: http://piotrwalat.net/arrow-function-expressions-in-typescript/
            // Standard functions will dynamically bind this depending on execution context (just like in JavaScript)
            // Arrow functions on the other hand will preserve this of enclosing context. 
            //var d = this.modelGraph.loadNode(word.length == 1 ? KNModel_NodeType.Char : KNModel_NodeType.Word, word, v => this.addViewNode(v));
            var d = this.modelGraph.loadNode(word.length == 1 ? "Kanji" : "Word", word, function (v) { return _this.addViewNode(v); });
            $.when(d).then(function (loadedNode) { _this.refocus(loadedNode); });
        };
        // adds the node to the viewGraph, picks the initial position based on the startPos and assigns viewGraphId
        // used to schedule the images rendering
        Frontend.prototype.addViewNode = function (mn, startPos) {
            var vn = new ViewNode(mn);
            vn.viewGraphId = this.viewGraph.nodes.length;
            if (typeof startPos !== 'undefined') {
                vn.x = startPos.x;
                vn.y = startPos.y;
            }
            this.viewGraph.nodes.push(vn);
        };
        // expands the selected node, renders the updated graph
        Frontend.prototype.refocus = function (node) {
            var _this = this;
            // find the corresponding view-node:
            //let focus: ViewNode = this.viewGraph.nodes.filter((vn: ViewNode) => vn.id == node.id)[0];
            var focus = this.viewGraph.nodes.filter(function (vn) { return vn.mn.id == node.id; })[0];
            var neighborsExpanded = this.modelGraph.expandNeighbors(focus.mn, function (mn) {
                if (!_this.inView(_this.findNode(mn))) {
                    _this.addViewNode(mn, focus);
                }
            });
            // not sure why do we want to have it here in addition to the line just below...
            this.refreshViewGraph();
            $.when(neighborsExpanded).then(function (hood) { return _this.addViewLinks(node, hood); });
        };
        Frontend.prototype.addViewLinks = function (node, hood) {
            var _this = this;
            var u = this.findNode(node);
            typeof hood === 'undefined' ||
                hood.forEach(function (h) {
                    var newLink = { source: u, target: _this.findNode(h) };
                    // make sure it is a new one
                    var oldLinks1 = _this.viewGraph.links.filter(function (l) { return l.source.id == newLink.source.id && l.target.id == newLink.target.id; });
                    var oldLinks2 = _this.viewGraph.links.filter(function (l) { return l.target.id == newLink.source.id && l.source.id == newLink.target.id; });
                    if (0 === oldLinks1.length && 0 === oldLinks2.length) {
                        _this.viewGraph.links.push(newLink);
                    }
                });
            this.refreshViewGraph();
        };
        // sync the viewGraph with the modelGraph
        Frontend.prototype.refreshViewGraph = function () {
            var _this = this;
            // set the color of each node in the viewGraph, based on the fully-expanded status
            this.filteredNodes()
                .forEach(function (v) {
                v.color = _this.modelGraph.isFullyExpanded(v.mn) ? "black" : _this.red;
            });
            // this.update();
            // return;
            // drop the links from the viewGraph first
            this.viewGraph.links = [];
            // create a link in the view for each edge in the model
            Object.keys(this.modelGraph.edges).forEach(function (e) {
                var l = _this.modelGraph.edges[e];
                var u = _this.findNode(_this.modelGraph.nodes[l.source]);
                var v = _this.findNode(_this.modelGraph.nodes[l.target]);
                if (_this.inView(u) && _this.inView(v)) {
                    _this.viewGraph.links.push({
                        source: u,
                        target: v
                    });
                }
                // UF: not sure about these:
                if (_this.inView(u) && !_this.inView(v)) {
                    console.log("inView(u) && !inView(v)");
                    u.color = _this.red;
                }
                if (!_this.inView(u) && _this.inView(v)) {
                    console.log("!inView(u) && inView(v)");
                    v.color = _this.red;
                }
            });
            this.update();
        };
        Frontend.prototype.nodeIsNotFilteredOut = function (n) {
            return n.mn.isKanji
                || (false == n.hidden && this.isSelectedJlpt(n.mn.JLPT));
        };
        Frontend.prototype.filteredNodes = function () {
            var _this = this;
            return this.viewGraph.nodes.filter(function (n) { return _this.nodeIsNotFilteredOut(n); });
        };
        Frontend.prototype.isSelectedJlpt = function (level) {
            return '' == this.jlpts || 0 <= this.jlpts.indexOf(level.toString());
        };
        Frontend.prototype.filteredLinks = function () {
            var _this = this;
            // only the links which connect to visible nodes
            return this.viewGraph.links.filter(function (l) {
                return _this.nodeIsNotFilteredOut(l.source)
                    && _this.nodeIsNotFilteredOut(l.target);
            });
        };
        // pushes the viewGraph data into the adapter and starts rendering process
        Frontend.prototype.update = function () {
            this.layout
                .nodes(this.filteredNodes())
                .links(this.filteredLinks())
                .start();
            var node = this.updateNodes();
            var link = this.updateLinks();
            this.layout.on("tick", function () {
                // setting the transform attribute to the array will result in synchronous calls to the callback provided for each node/link
                // so that these will move to the designated positions
                node.attr("transform", function (d) {
                    if (!d.mn.text || '' == d.mn.text)
                        return "translate(" + (d.x - Frontend.nodeWidth / 2) + ", " + (d.y - Frontend.nodeHeight / 2) + ")";
                    else
                        return "translate(" + d.x + "," + d.y + ")";
                });
                link.attr("transform", function (d) {
                    var dx = d.source.x - d.target.x, dy = d.source.y - d.target.y;
                    var r = 180 * Math.atan2(dy, dx) / Math.PI;
                    return "translate(" + d.target.x + "," + d.target.y + ") rotate(" + r + ")";
                })
                    .attr("width", function (d) {
                    var dx = d.source.x - d.target.x, dy = d.source.y - d.target.y;
                    return Math.sqrt(dx * dx + dy * dy);
                });
            });
        };
        // re-populates edgesLayer with links
        Frontend.prototype.updateLinks = function () {
            var _this = this;
            // use the viewGraph's links to populate the edges-layer with objects based on the data:
            var link = this.edgesLayer.selectAll(".link")
                .data(this.filteredLinks());
            // for every new entry insert a rect of class .link and initial height and position
            link.enter().append("rect")
                .attr("x", 0).attr("y", 0)
                .attr("height", 2)
                .attr("class", "link");
            // get rid of those which aren't listed anymore
            link.exit().remove();
            // update the fill of each of the elements, based on their state
            link
                .attr("fill", function (d) {
                if (d.source.color === _this.red && d.target.color === _this.red) {
                    // UF never happens?
                    return _this.red;
                }
                if (d.source.color !== _this.red && d.target.color !== _this.red) {
                    // the link between "resolved" nodes
                    return "darkGray";
                }
                return d.source.color === _this.red ? "url(#ReverseEdgeGradient)" : "url(#EdgeGradient)";
            });
            return link;
        };
        // re-populate the nodesLayer with nodes
        Frontend.prototype.updateNodes = function () {
            var _this = this;
            var node = this.nodesLayer.selectAll(".node")
                .data(this.filteredNodes(), function (d) {
                return d.viewGraphId;
            });
            // erase the nodes which aren't here anymore
            node.exit().remove();
            // remember the last place/time the mouse/touch event has occurred, so we can distinguish between a move and a click/tap
            var mouseDownEvent;
            var mouseUpEvent;
            var touchstartEvent;
            var doubleTap;
            // insert the parent group - it  tracks the user interaction
            var nodeEnter = node.enter().append("g")
                .attr("id", function (d) {
                return d.mn.id;
            })
                .attr("class", "node")
                .on("mousedown", function () {
                mouseDownEvent = d3.event;
                _this.nodeMouseDown = true;
            }) // recording the mousedown state allows us to differentiate dragging from panning
                .on("mouseup", function () {
                mouseUpEvent = d3.event;
                _this.nodeMouseDown = false;
            })
                .on("touchstart", function () {
                doubleTap = event.timeStamp - touchstartEvent < 500;
                touchstartEvent = event.timeStamp;
            })
                .on("touchmove", function () {
                event.preventDefault();
            })
                .on("mouseenter", function (d) {
                _this.hintNeighbors(d);
            }) // on mouse over nodes we show "spikes" indicating there are hidden neighbors
                .on("mouseleave", function (d) {
                _this.unHintNeighbors(d);
            })
                .on("wheel", function (d) {
                // UF: need to send that event to the canvas, but how?!
            })
                .on("touchend", function (d) {
                if (doubleTap) {
                    doubleTap = false;
                    _this.dblclick(d);
                }
            })
                .call(this.layout.drag);
            // the bubble for the word/kanji
            var wordCard = nodeEnter
                .append("g")
                .attr('style', function (n) { return "fill: " + _this.jlpt2color(n.mn.JLPT); })
                .append("use")
                .attr("xlink:href", function (n) { return n.mn.isKanji ? '#kanjiBG' : "#wc_" + n.mn.text.length; });
            wordCard
                .on("click", function (n) { _this.hideNode(n); });
            // the spikes
            nodeEnter.append("g")
                .attr("id", function (n) { return n.mn.id + "_spikes"; })
                .attr("transform", "translate(0,3)");
            var text = nodeEnter.append("text")
                .attr('class', 'text word')
                .attr('dy', '8px')
                .text(function (n) { return n.mn.text; });
            // the superscript
            text.append("tspan")
                .attr('class', 'ruby')
                .attr('x', '0')
                .attr('y', '-11px')
                .text(function (n) { return n.superscript[0] == "" ? " " : n.mn.superscript; });
            // the subscript
            text.append("tspan")
                .attr('class', 'translation')
                .attr("x", "0")
                .attr("dy", "30px")
                .text(function (n) { return n.mn.subscript; });
            text.on("dblclick", function (d) {
                if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                    Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                    _this.dblclick(d);
                }
            });
            // the tooltip
            nodeEnter.append("title")
                .text(function (n) { return n.mn.hint; });
            node.style("fill", function (n) { return n.color; });
            return node;
        };
        // animates the mouse-over hint
        Frontend.prototype.hintNeighbors = function (v) {
            var _this = this;
            if (!v.mn.hood)
                return;
            var hiddenEdges = v.mn.hood.length + 1 - v.mn.degree;
            var r = 2 * Math.PI / hiddenEdges;
            for (var i = 0; i < hiddenEdges; ++i) {
                var w = Frontend.nodeWidth - 6, h = Frontend.nodeHeight - 6, x = w / 2 + 25 * Math.cos(r * i), y = h / 2 + 30 * Math.sin(r * i);
                var rect = new this.webColaLibrary.Rectangle(0, w, 0, h);
                var vi = rect.rayIntersection(x, y);
                var dataView = d3.select("#" + v.mn.id + "_spikes");
                dataView.append("rect")
                    .attr("class", "spike")
                    .attr("rx", 1).attr("ry", 1)
                    .attr("x", 0).attr("y", 0)
                    .attr("width", 10).attr("height", 2)
                    .attr("transform", "translate(" + vi.x + "," + vi.y + ") rotate(" + 360 * i / hiddenEdges + ")")
                    .on("dblclick", function () { return _this.dblclick(v); });
            }
        };
        // stopping the hint
        Frontend.prototype.unHintNeighbors = function (v) {
            var dataView = d3.select('#${v.mn.id}_spikes');
            dataView.selectAll(".spike").remove();
        };
        Frontend.prototype.hideNode = function (n) {
            // don't hide kanji
            if (n.mn.isKanji) {
                return;
            }
            n.hidden = true;
            this.update();
            // add the word to the combo, if it's not there yet
            var hiddenWordsCombo = $('#hiddenWordsCombo');
            if (0 == hiddenWordsCombo.find("option[value=\"" + n.id + "\"]").length) {
                hiddenWordsCombo.append($('<option>', {
                    value: n.id,
                    text: n.mn.text
                }));
            }
        };
        Frontend.prototype.findNode = function (n) {
            var fen = this.viewGraph.nodes.filter(function (fen) { return fen.id === n.id; });
            return fen[0];
        };
        // was the viewNode already added?
        Frontend.prototype.inView = function (v) {
            return typeof v !== 'undefined'
                && typeof v.viewGraphId !== 'undefined';
        };
        Frontend.prototype.collapseNode = function (node) {
            var _this = this;
            // for each linked node
            node.mn.hood.forEach(function (c) {
                // see how many links it has at the moment:
                var neighbor = _this.filteredNodes().filter(function (nn) { return nn.id == c.id; })[0];
                if (neighbor) {
                    var links = _this.viewGraph.links.filter(function (l) { return l.source == neighbor || l.target == neighbor; });
                    if (links.length == 1) {
                        // this node is only connected with one link - hide it
                        _this.hideNode(neighbor);
                    }
                }
            });
            this.update();
        };
        Frontend.prototype.unCollapseNode = function (node) {
            var _this = this;
            this.viewGraph.links
                .filter(function (l) { return l.target.mn == node; })
                .map(function (l) { return l.source; })
                .forEach(function (n) { return _this.unHideWord(n.id); });
            this.viewGraph.links
                .filter(function (l) { return l.source.mn == node; })
                .map(function (l) { return l.target; })
                .forEach(function (n) { return _this.unHideWord(n.id); });
        };
        // handle the mouse-dblclick, tap
        Frontend.prototype.dblclick = function (node) {
            var _this = this;
            if (node.color !== this.red) {
                // collapse the node
                this.collapseNode(node);
                // paint it red
                node.color = this.red;
                return;
            }
            else {
                // un-collapse the node
                this.unCollapseNode(node.mn);
                var d = this.modelGraph.loadNode(node.mn.type, node.mn.text);
                $.when(d).then(function (focus) { _this.refocus(focus); });
            }
        };
        Frontend.prototype.graphBounds = function () {
            var x = Number.POSITIVE_INFINITY, X = Number.NEGATIVE_INFINITY, y = Number.POSITIVE_INFINITY, Y = Number.NEGATIVE_INFINITY;
            this.nodesLayer.selectAll(".node").each(function (v) {
                x = Math.min(x, v.x - Frontend.nodeWidth / 2);
                X = Math.max(X, v.x + Frontend.nodeWidth / 2);
                y = Math.min(y, v.y - Frontend.nodeHeight / 2);
                Y = Math.max(Y, v.y + Frontend.nodeHeight / 2);
            });
            return {
                x: x,
                X: X,
                y: y,
                Y: Y
            };
        };
        Frontend.prototype.clearAll = function () {
            this.viewGraph = {
                nodes: [],
                links: []
            };
            this.update();
            this.modelGraph.reset();
        };
        Frontend.prototype.navigateToWord = function (word) {
            this.updateWordInHistory(word);
            this.main(word);
        };
        Frontend.prototype.calcMySize = function () {
            // take into account the height of the toolbar
            this.height = $(window).height() - 37;
            // somehow we can't avoid a margin, so make it symmetric at least
            this.width = $(window).width() - 7;
        };
        Frontend.prototype.onWindowResized = function () {
            this.calcMySize();
            this.outer.attr("width", this.width).attr("height", this.height);
        };
        Frontend.prototype.fullScreenCancel = function () {
            this.outer.attr("width", this.width).attr("height", this.height);
            this.zoomToFit();
        };
        // setup the translation based on the move/zoom, as it comes from 
        Frontend.prototype.redraw = function (transition) {
            // if mouse down then we are dragging not panning
            if (this.nodeMouseDown) {
                //debugger;
                return;
            }
            // read the current zoom translation vector and the current zoom scale
            (transition ? this.vis.transition() : this.vis)
                .attr("transform", "translate(" + this.zoom.translate() + ") scale(" + this.zoom.scale() + ")");
        };
        Frontend.prototype.zoomToFit = function () {
            var b = this.graphBounds();
            var w = b.X - b.x, h = b.Y - b.y;
            var cw = parseInt(this.outer.attr("width")), ch = parseInt(this.outer.attr("height"));
            var s = Math.min(cw / w, ch / h);
            var tx = (-b.x * s + (cw / s - w) * s / 2), ty = (-b.y * s + (ch / s - h) * s / 2);
            this.zoom.translate([tx, ty]).scale(s);
            this.redraw(true);
        };
        Frontend.prototype.getParameterByName = function (name, url) {
            if (!url) {
                url = window.location.href;
            }
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
            if (!results)
                return null;
            if (!results[2])
                return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        };
        Frontend.prototype.storageGet = function (paramName) {
            if (typeof (Storage) !== "undefined") {
                return localStorage.getItem(paramName);
            }
            else {
                return this.cookies.get(paramName);
            }
        };
        Frontend.prototype.storageSet = function (paramName, value) {
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem(paramName, value);
            }
            else {
                this.cookies.set(paramName, value);
            }
        };
        Frontend.prototype.setupJlptChecks = function () {
            this.jlpts = this.storageGet(Frontend.jlptSelectedLevelsCookieName);
            if (!this.jlpts) {
                this.jlptSelect(5);
                this.jlptSelect(4);
            }
            this.jlpts.split('').forEach(function (n) {
                $("#JLPT" + n).prop('checked', true);
                $("#JLPT" + n).parents('label').addClass('active');
            });
        };
        Frontend.prototype.removeWordFromHistory = function (selectBoxId, word) {
            // delete it from the drop-down
            $("#" + selectBoxId + " option[value='" + word + "']").remove();
            // and the history
            this.updateWordInHistory(word, false);
        };
        Frontend.prototype.loadWordHistory = function (selectBoxId) {
            var selectBox = $(selectBoxId);
            selectBox
                .find('option')
                .remove()
                .end();
            var oldHistory = this.storageGet(Frontend.wordsHistoryCookieName);
            if (!oldHistory || '' === oldHistory) {
                oldHistory = '楽しい 普通 産業';
            }
            var oldHistoryArray = oldHistory.split(' ');
            oldHistoryArray.forEach(function (word) {
                selectBox.append($('<option>', {
                    value: word,
                    text: word
                }));
            });
        };
        Frontend.prototype.updateWordInHistory = function (word, add) {
            if (add === void 0) { add = true; }
            var oldHistory = this.storageGet(Frontend.wordsHistoryCookieName);
            var oldHistoryArray = oldHistory ? oldHistory.split(' ') : [];
            var foundIndex = oldHistoryArray.indexOf(word);
            // to add, and wasn't found?
            if (add && foundIndex < 0) {
                oldHistoryArray.push(word);
            }
            // to delete, and was found?
            if (!add && 0 <= foundIndex) {
                oldHistoryArray.splice(foundIndex, 1);
            }
            this.storageSet(Frontend.wordsHistoryCookieName, oldHistoryArray.join(' '));
        };
        Frontend.prototype.jlptSelect = function (n) {
            var curSel = this.storageGet(Frontend.jlptSelectedLevelsCookieName);
            curSel = curSel ? curSel : '';
            // we land here before the control has reflected the new status
            var willBecomeChecked = !$("#JLPT" + n).is(':checked');
            this.jlpts = curSel.replace(new RegExp(n.toString(), 'g'), '') + (willBecomeChecked ? n.toString() : '');
            this.storageSet(Frontend.jlptSelectedLevelsCookieName, this.jlpts);
            this.refreshViewGraph();
        };
        Frontend.prototype.jlpt2color = function (level) {
            switch (level) {
                case 1: return "#d43f3a";
                case 2: return "#f0ad4e";
                case 3: return "#337ab7";
                case 4: return "#eae548";
                case 5: return "#5cb85c";
                default:
                    return "#cccccc";
            }
        };
        Frontend.prototype.unHideWord = function (word) {
            $("#hiddenWordsCombo option[value='" + word + "']").remove();
            this.viewGraph.nodes.filter(function (n) { return n.id == word; })[0].hidden = false;
            this.update();
        };
        return Frontend;
    }());
    Frontend.jlptSelectedLevelsCookieName = "jlptSelectedLevels";
    Frontend.wordsHistoryCookieName = "wordsHistory";
    // node size
    Frontend.fontSize = 22;
    Frontend.nodeWidth = 30;
    Frontend.nodeHeight = Frontend.fontSize;
    exports.Frontend = Frontend;
});
//# sourceMappingURL=frontend.js.map
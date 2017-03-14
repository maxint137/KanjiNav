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
define(["require", "exports", "jquery", "d3", "kanjiNavBase", "kanjiNav"], function (require, exports, $, d3, kanjiNavBase_1, kanjiNav_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ViewNode = (function (_super) {
        __extends(ViewNode, _super);
        function ViewNode(kn) {
            var _this = _super.call(this, kn.type, kn.id) || this;
            _this.copyData(kn);
            _this.hidden = false;
            return _this;
        }
        return ViewNode;
    }(kanjiNav_1.Node));
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
        function Frontend(modelgraph, coke, cookies) {
            this.modelgraph = modelgraph; // new Graph(getParameterByName('JLPT'));
            this.cookies = cookies;
            this.width = $(window).width();
            this.height = $(window).height();
            this.red = "rgb(125, 0, 0)";
            this.viewgraph = {
                nodes: [],
                links: []
            };
            this.cola = coke;
            this.d3cola = this.cola.d3adaptor(d3)
                .linkDistance(80)
                .avoidOverlaps(true)
                .size([this.width, this.height]);
            // alternatively just use the D3 built-in force layout
            // var d3cola = d3.layout.force()
            //     .charge(-520)
            //     .linkDistance(80)
            //     .size([width, height]);
            this.outer = d3.select("#kanjiMap").append("svg")
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
            function addGradient(id, colour1, opacity1, colour2, opacity2) {
                var gradient = defs.append("svg:linearGradient")
                    .attr("id", id)
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "0%")
                    .attr("spreadMethod", "pad");
                gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", colour1)
                    .attr("stop-opacity", opacity1);
                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", colour2)
                    .attr("stop-opacity", opacity2);
            }
            addGradient("SpikeGradient", "red", 1, "red", 0);
            addGradient("EdgeGradient", this.red, 1, "darkgray", 1);
            addGradient("ReverseEdgeGradient", "darkgray", 1, this.red, 1);
        };
        // adds a word to graph
        Frontend.prototype.main = function (word) {
            var _this = this;
            // Note: http://piotrwalat.net/arrow-function-expressions-in-typescript/
            // Standard functions will dynamically bind this depending on execution context (just like in JavaScript)
            // Arrow functions on the other hand will preserve this of enclosing context. 
            var d = this.modelgraph.getNode(kanjiNavBase_1.NodeType.Word, word, function (v) { return _this.addViewNode(new ViewNode(v)); });
            $.when(d).then(function (startNode) { _this.refocus(startNode); });
        };
        // adds the node to the viewgraph, picks the initial position based on the startpos and assignes viewgraphid
        // used to schedule the images rendering
        Frontend.prototype.addViewNode = function (v, startpos) {
            v.viewgraphid = this.viewgraph.nodes.length;
            if (typeof startpos !== 'undefined') {
                v.x = startpos.x;
                v.y = startpos.y;
            }
            this.viewgraph.nodes.push(v);
        };
        // setup the transiation based on the move/zoom, as it comes from 
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
        // expands the selected node, renders the updated graph
        Frontend.prototype.refocus = function (focus) {
            var _this = this;
            var neighboursExpanded = this.modelgraph.expandNeighbours(focus, function (v) {
                if (!_this.inView(_this.findNode(v)))
                    _this.addViewNode(new ViewNode(v), focus);
            });
            // not sure why do we want to have it here in addition to the lines just below...
            this.refreshViewGraph();
            $.when(neighboursExpanded).then(function () { return _this.refreshViewGraph(); });
        };
        // sync the viewgraph with the modelgraph
        Frontend.prototype.refreshViewGraph = function () {
            var _this = this;
            // drop the links from the viewgraph first
            this.viewgraph.links = [];
            // set the color of each node in the viewgraph, based on the fully-expanded status
            this.filteredNodes()
                .forEach(function (v) {
                var fullyExpanded = _this.modelgraph.fullyExpanded(v);
                v.colour = fullyExpanded ? "black" : _this.red;
            });
            // create a link in the view for each edge in the model
            Object.keys(this.modelgraph.edges).forEach(function (e) {
                var l = _this.modelgraph.edges[e];
                var u = _this.findNode(_this.modelgraph.nodes[l.source]);
                var v = _this.findNode(_this.modelgraph.nodes[l.target]);
                if (_this.inView(u) && _this.inView(v)) {
                    _this.viewgraph.links.push({
                        source: u,
                        target: v
                    });
                }
                // UF: not sure about these:
                if (_this.inView(u) && !_this.inView(v)) {
                    console.log("inView(u) && !inView(v)");
                    u.colour = _this.red;
                }
                if (!_this.inView(u) && _this.inView(v)) {
                    console.log("!inView(u) && inView(v)");
                    v.colour = _this.red;
                }
            });
            this.update();
        };
        Frontend.prototype.nodeIsNotFilteredOut = function (n) {
            return n.isKanji()
                || (this.isSelectedJlpt(n.JLPT) && false == n.hidden);
        };
        Frontend.prototype.filteredNodes = function () {
            var _this = this;
            return this.viewgraph.nodes.filter(function (n) { return _this.nodeIsNotFilteredOut(n); });
        };
        Frontend.prototype.isSelectedJlpt = function (level) {
            return '' == this.jlpts || 0 <= this.jlpts.indexOf(level.toString());
        };
        Frontend.prototype.filteredLinks = function () {
            var _this = this;
            // only the links which connect to visible nodes
            return this.viewgraph.links.filter(function (l) {
                return _this.nodeIsNotFilteredOut(l.source)
                    && _this.nodeIsNotFilteredOut(l.target);
            });
        };
        // pushes the viewgraph data into the adapter and starts rendering process
        Frontend.prototype.update = function () {
            this.d3cola
                .nodes(this.filteredNodes())
                .links(this.filteredLinks())
                .start();
            var node = this.updateNodes();
            var link = this.updateLinks();
            this.d3cola.on("tick", function () {
                // setting the transform attribute to the array will result in syncronous calls to the callback provided for each node/link
                // so that these will move to the designated positions
                node.attr("transform", function (d) {
                    if (!d.id || '' == d.id)
                        return "translate(" + (d.x - Frontend.nodeWidth / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
                    else
                        return "translate(" + (d.x - 1.5 * d.id.length * Frontend.fontSize / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
                });
                link.attr("transform", function (d) {
                    var dx = d.source.x - d.target.x, dy = d.source.y - d.target.y;
                    var r = 180 * Math.atan2(dy, dx) / Math.PI;
                    return "translate(" + d.target.x + "," + d.target.y + ") rotate(" + r + ") ";
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
            // use the viewgrap's links to populate the edges-layer with objects based on the data:
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
                if (d.source.colour === _this.red && d.target.colour === _this.red) {
                    // UF never happens?
                    return _this.red;
                }
                if (d.source.colour !== _this.red && d.target.colour !== _this.red) {
                    // the link between "resolved" nodes
                    return "darkgray";
                }
                return d.source.colour === _this.red ? "url(#ReverseEdgeGradient)" : "url(#EdgeGradient)";
            });
            return link;
        };
        // re-populate the nodesLayer with nodes
        Frontend.prototype.updateNodes = function () {
            var _this = this;
            var node = this.nodesLayer.selectAll(".node")
                .data(this.filteredNodes(), function (d) {
                return d.viewgraphid;
            });
            // erase the nodes which aren't here anymore
            node.exit().remove();
            // remember the last place/time the mouse/touch event has occured, so we can distinguish between a move and a click/tap
            var mouseDownEvent;
            var mouseUpEvent;
            var touchstartEvent;
            var doubleTap;
            // insert the parent group - it  tracks the user interaction
            var nodeEnter = node.enter().append("g")
                .attr("id", function (d) {
                return d.name();
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
                _this.hintNeighbours(d);
            }) // on mouse over nodes we show "spikes" indicating there are hidden neighbours
                .on("mouseleave", function (d) {
                _this.unhintNeighbours(d);
            })
                .on("wheel", function (d) {
                // UF: need to send that event to the canvas, but how?!
                //debugger;
            })
                .on("touchend", function (d) {
                if (doubleTap) {
                    doubleTap = false;
                    _this.dblclick(d);
                }
            })
                .call(this.d3cola.drag);
            // the background for the word/kangi
            var wordCard = nodeEnter
                .append("g")
                .attr('style', function (n) { return "fill: " + _this.jlpt2color(n.JLPT); })
                .attr('transform', function (n) { return n.isKanji() ? 'translate(-5, -20)' : 'translate(-10, -20)'; })
                .append("use")
                .attr("xlink:href", function (n) { return n.isKanji() ? '#kanjiBG' : '#g12' + n.id.length; });
            wordCard
                .on("click", function (n) { _this.hideNode(n); });
            // the spikes
            nodeEnter.append("g")
                .attr("id", function (n) {
                return n.name() + "_spikes";
            })
                .attr("transform", "translate(0,3)");
            // the word itself
            var text = nodeEnter.append("text")
                .attr('class', 'text')
                .attr('dx', function (n) { return n.isKanji() ? '0.2em' : '0.0em'; })
                .attr('dy', function (n) { return n.isKanji() ? '-0.0em' : '0.0em'; })
                .text(function (d) { return d.id; });
            text.on("dblclick", function (d) {
                if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                    Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                    _this.dblclick(d);
                }
            });
            // the rubi
            nodeEnter.append("text")
                .attr("dy", "-1px")
                .text(function (n) { return n.hiragana ? n.hiragana : ''; });
            // the english translation
            nodeEnter.append("text")
                .attr("dy", "3.0em")
                .text(function (n) { return n.isKanji() ? '' : (n.english && 0 in n.english ? n.english[0] : '?'); });
            // the tooltip
            nodeEnter.append("title")
                .text(function (d) { return d.english && 0 in d.english ? d.english[0] : '?'; });
            node.style("fill", function (n) { return n.colour; });
            return node;
        };
        // animates the mouse-over hint
        Frontend.prototype.hintNeighbours = function (v) {
            var _this = this;
            if (!v.cast)
                return;
            var hiddenEdges = v.cast.length + 1 - v.degree;
            var r = 2 * Math.PI / hiddenEdges;
            for (var i = 0; i < hiddenEdges; ++i) {
                var w = Frontend.nodeWidth - 6, h = Frontend.nodeHeight - 6, x = w / 2 + 25 * Math.cos(r * i), y = h / 2 + 30 * Math.sin(r * i);
                var rect = new cola.vpsc.Rectangle(0, w, 0, h);
                var vi = rect.rayIntersection(x, y);
                var dview = d3.select("#" + v.name() + "_spikes");
                dview.append("rect")
                    .attr("class", "spike")
                    .attr("rx", 1).attr("ry", 1)
                    .attr("x", 0).attr("y", 0)
                    .attr("width", 10).attr("height", 2)
                    .attr("transform", "translate(" + vi.x + "," + vi.y + ") rotate(" + (360 * i / hiddenEdges) + ")")
                    .on("dblclick", function () { return _this.dblclick(v); });
            }
        };
        // stopping the hint
        Frontend.prototype.unhintNeighbours = function (v) {
            var dview = d3.select("#" + v.name() + "_spikes");
            dview.selectAll(".spike").remove();
        };
        Frontend.prototype.hideNode = function (n) {
            // don't hide kanji
            if (n.isKanji()) {
                return;
            }
            n.hidden = true;
            this.update();
            // add the word to the combo, if it's not there yet
            var hiddenWordsCombo = $('#hiddenWordsCombo');
            if (0 == hiddenWordsCombo.find('option[value="' + n.id + '"]').length) {
                hiddenWordsCombo.append($('<option>', {
                    value: n.id,
                    text: n.id
                }));
            }
        };
        Frontend.prototype.findNode = function (n) {
            var fen = this.viewgraph.nodes.filter(function (fen) { return fen.id === n.id; });
            return fen[0];
        };
        // was the viewnode already added?
        Frontend.prototype.inView = function (v) {
            return typeof v !== 'undefined'
                && typeof v.viewgraphid !== 'undefined';
        };
        Frontend.prototype.collapseNode = function (node) {
            var _this = this;
            // for each linked node
            node.cast.forEach(function (c) {
                // see how many links it has at the moment:
                var neighbour = _this.filteredNodes().filter(function (nn) { return nn.id == c.word; })[0];
                if (neighbour) {
                    var links = _this.viewgraph.links.filter(function (l) { return l.source == neighbour || l.target == neighbour; });
                    if (links.length == 1) {
                        // this node is only connected with one link - hide it
                        _this.hideNode(neighbour);
                    }
                }
            });
            this.update();
        };
        Frontend.prototype.uncollapseNode = function (node) {
            var _this = this;
            this.viewgraph.links
                .filter(function (l) { return l.target == node; })
                .map(function (l) { return l.source; })
                .forEach(function (n) { return _this.unhideWord(n.id); });
            this.viewgraph.links
                .filter(function (l) { return l.source == node; })
                .map(function (l) { return l.target; })
                .forEach(function (n) { return _this.unhideWord(n.id); });
        };
        // handle the mouse-dblclick, tap
        Frontend.prototype.dblclick = function (node) {
            var _this = this;
            if (node.colour !== this.red) {
                // collapse the node
                this.collapseNode(node);
                // paint it red
                node.colour = this.red;
                return;
            }
            else {
                // uncollapse the node
                this.uncollapseNode(node);
                var d = this.modelgraph.getNode(node.type, node.id);
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
            this.viewgraph = {
                nodes: [],
                links: []
            };
            this.update();
            this.modelgraph.reset();
        };
        Frontend.prototype.navigateToWord = function (word) {
            this.updateWordInHistory(word);
            this.main(word);
        };
        Frontend.prototype.fullScreenCancel = function () {
            this.outer.attr("width", this.width).attr("height", this.height);
            this.zoomToFit();
        };
        Frontend.prototype.zoomToFit = function () {
            var b = this.graphBounds();
            var w = b.X - b.x, h = b.Y - b.y;
            var cw = this.outer.attr("width"), ch = this.outer.attr("height");
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
                $('#JLPT' + n).prop('checked', true);
                $('#JLPT' + n).parents('label').addClass('active');
            });
        };
        Frontend.prototype.removeWordFromHistory = function (selectBoxId, word) {
            // delete it from the dropdown
            $('#' + selectBoxId + " option[value='" + word + "']").remove();
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
            var willBecomeChecked = !$('#JLPT' + n).is(':checked');
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
        Frontend.prototype.unhideWord = function (word) {
            $("#hiddenWordsCombo option[value='" + word + "']").remove();
            this.viewgraph.nodes.filter(function (n) { return n.id == word; })[0].hidden = false;
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
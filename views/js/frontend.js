/// <reference path="../node_modules/@types/webcola/index.d.ts" />.
/// <reference path="../node_modules/@types/js-cookie/index.d.ts" />.
define(["require", "exports", "jquery", "d3", "./kanjiNav"], function (require, exports, $, d3, kanjiNav) {
    "use strict";
    var Frontend;
    (function (Frontend_1) {
        var FELink = (function () {
            function FELink() {
            }
            return FELink;
        }());
        var ViewGraph = (function () {
            function ViewGraph() {
            }
            return ViewGraph;
        }());
        var Frontend = (function () {
            function Frontend(modelgraph, cola, cookies) {
                this.modelgraph = modelgraph; // new kanjiNav.Graph(getParameterByName('JLPT'));
                this.cookies = cookies;
                this.width = $(window).width();
                this.height = $(window).height();
                this.red = "rgb(125, 0, 0)";
                this.viewgraph = {
                    nodes: [],
                    links: []
                };
                this.cola = cola;
                this.d3cola = cola.d3adaptor(d3)
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
                var d = this.modelgraph.getNode(kanjiNav.Word, word, function (v) { return _this.addViewNode(v); });
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
                    if (!_this.inView(v))
                        _this.addViewNode(v, focus);
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
                    var u = _this.modelgraph.nodes[l.source], v = _this.modelgraph.nodes[l.target];
                    if (_this.inView(u) && _this.inView(v))
                        _this.viewgraph.links.push({
                            source: u,
                            target: v
                        });
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
                    || (this.isSelectedJlpt(n.jlpt) && false == n.hidden);
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
                return this.viewgraph.links.filter(function (l) { return _this.nodeIsNotFilteredOut(l.source) && _this.nodeIsNotFilteredOut(l.target); });
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
                var touchmoveEvent;
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
                    .on("touchmove", function () {
                    event.preventDefault();
                    touchmoveEvent = event.timeStamp;
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
                    if (event.timeStamp - touchmoveEvent < 100) {
                        _this.dblclick(d);
                    }
                })
                    .call(this.d3cola.drag);
                // the background for the word/kangi
                var wordCard = nodeEnter
                    .append("g")
                    .attr('style', function (n) { return "fill: " + _this.jlpt2color(n.jlpt); })
                    .attr('transform', 'translate(-10, -20)')
                    .append("use")
                    .attr("xlink:href", function (n) { return !n.isKanji() ? '#g12' + n.id.length : '#kanjiBG'; });
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
                    .text(function (d) { return d.id; });
                text
                    .on("dblclick", function (d) {
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
                    var rect = new this.cola.Rectangle(0, w, 0, h);
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
            };
            // was the viewnode added?
            Frontend.prototype.inView = function (v) {
                return typeof v.viewgraphid !== 'undefined';
            };
            // handle the mouse-dblclick, tap
            Frontend.prototype.dblclick = function (node) {
                var _this = this;
                if (node.colour !== this.red)
                    return;
                //var focus = this.modelgraph.getNode(node.type, node.id);
                //this.refocus(focus);
                var d = this.modelgraph.getNode(node.type, node.id);
                $.when(d).then(function (focus) { _this.refocus(focus); });
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
            Frontend.prototype.setupJlptChecks = function () {
                this.jlpts = this.cookies.get(Frontend.jlptSelectedLevelsCookieName);
                if (!this.jlpts) {
                    this.jlptSelect(5);
                    this.jlptSelect(4);
                }
                this.jlpts.split('').forEach(function (n) {
                    $('#JLPT' + n).prop('checked', true);
                    $('#JLPT' + n).parents('label').addClass('active');
                });
            };
            Frontend.prototype.removeWord = function (selectBoxId, word) {
                // both from the dropdown
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
                var oldHistory = this.cookies.get(Frontend.wordsHistoryCookieName);
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
                var oldHistory = this.cookies.get(Frontend.wordsHistoryCookieName);
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
                this.cookies.set(Frontend.wordsHistoryCookieName, oldHistoryArray.join(' '));
            };
            Frontend.prototype.jlptSelect = function (n) {
                var curSel = this.cookies.get(Frontend.jlptSelectedLevelsCookieName);
                curSel = curSel ? curSel : '';
                // we land here before the control has reflected the new status
                var willBecomeChecked = !$('#JLPT' + n).is(':checked');
                this.jlpts = curSel.replace(new RegExp(n.toString(), 'g'), '') + (willBecomeChecked ? n.toString() : '');
                this.cookies.set(Frontend.jlptSelectedLevelsCookieName, this.jlpts);
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
            return Frontend;
        }());
        Frontend.jlptSelectedLevelsCookieName = "jlptSelectedLevels";
        Frontend.wordsHistoryCookieName = "wordsHistory";
        // node size
        Frontend.fontSize = 22;
        Frontend.nodeWidth = 30;
        Frontend.nodeHeight = Frontend.fontSize;
        Frontend_1.Frontend = Frontend;
    })(Frontend || (Frontend = {}));
    function zoomToFit() {
        Frontend.Frontend.prototype.zoomToFit();
    }
    return Frontend.Frontend;
});
//# sourceMappingURL=frontend.js.map
/// <reference path="../node_modules/@types/webcola/index.d.ts" />.
define(["require", "exports", "jquery", "d3", "./kanjiNav"], function (require, exports, $, d3, kanjiNav) {
    "use strict";
    var Frontend;
    (function (Frontend_1) {
        var Frontend = (function () {
            function Frontend(modelgraph, cola) {
                this.modelgraph = modelgraph; // new kanjiNav.Graph(getParameterByName('JLPT'));
                this.width = 960;
                this.height = 500;
                this.red = "rgb(125, 0, 0)";
                this.nodeWidth = 30;
                this.nodeHeight = 35;
                this.viewgraph = {
                    nodes: [],
                    links: []
                };
                this.d3cola = cola.d3adaptor() //.d3adaptor(d3)
                    .linkDistance(80)
                    .avoidOverlaps(true)
                    .size([this.width, this.height]);
                // alternatively just use the D3 built-in force layout
                // var d3cola = d3.layout.force()
                //     .charge(-520)
                //     .linkDistance(80)
                //     .size([width, height]);
                // the D3 engine
                this.outer = d3.select("body").append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    .attr("pointer-events", "all");
                this.nodeMouseDown = false;
                this.setupZooming();
                this.defineGradients();
            }
            // add layers and zooming to the outer SVG
            Frontend.prototype.setupZooming = function () {
                // https://github.com/d3/d3-3.x-api-reference/blob/master/Zoom-Behavior.md
                // Construct a new zoom behavior:
                this.zoom = d3.behavior.zoom();
                this.outer.append('rect')
                    .attr('class', 'background')
                    .attr('width', "100%")
                    .attr('height', "100%")
                    .call(this.zoom.on("zoom", this.redraw))
                    .on("dblclick.zoom", this.zoomToFit);
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
                // var d = v.getImage();
                // $.when(d).then(function(node) {
                //     d3.select("#" + node.name()).append("image")
                //         .attr("transform", "translate(2,2)")
                //         .attr("xlink:href", function(v) {
                //             var url = v.imgurl;
                //             var simg = this;
                //             var img = new Image();
                //             img.onload = function() {
                //                 simg.setAttribute("width", this.nodeWidth - 4);
                //                 simg.setAttribute("height", nodeHeight - 4);
                //             }
                //             return img.src = url;
                //         }).on("click", function() {
                //             click(node)
                //         })
                // });
            };
            // setup the transiation based on the move/zoom, as it comes from 
            Frontend.prototype.redraw = function (transition) {
                // if mouse down then we are dragging not panning
                if (this.nodeMouseDown) {
                    debugger;
                    return;
                }
                debugger;
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
                this.viewgraph.nodes.forEach(function (v) {
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
            // pushes the viewgraph data into the adapter and starts rendering process
            Frontend.prototype.update = function () {
                var _this = this;
                this.d3cola.nodes(this.viewgraph.nodes)
                    .links(this.viewgraph.links)
                    .start();
                var node = this.updateNodes(this.viewgraph);
                var link = this.updateLinks(this.viewgraph);
                this.d3cola.on("tick", function () {
                    // setting the transform attribute to the array will result in syncronous calls to the callback provided for each node/link
                    // so that these will move to the designated positions
                    node.attr("transform", function (d) {
                        return "translate(" + (d.x - _this.nodeWidth / 2) + "," + (d.y - _this.nodeHeight / 2) + ")";
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
            Frontend.prototype.updateLinks = function (viewgraph) {
                var _this = this;
                // use the viewgrap's links to populate the edges-layer with objects based on the data:
                var link = this.edgesLayer.selectAll(".link")
                    .data(viewgraph.links);
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
            // re-populates the nodesLayer with nodes
            Frontend.prototype.updateNodes = function (viewgraph) {
                var _this = this;
                var node = this.nodesLayer.selectAll(".node")
                    .data(viewgraph.nodes, function (d) {
                    return d.viewgraphid;
                });
                // erase the nodes which aren't here anymore
                node.exit().remove();
                // remember the last place/time the mouse/touch event has occured, so we can distinguish between a move and a click/tap
                var mouseDownEvent;
                var mouseUpEvent;
                var touchmoveEvent;
                // insert a group that tracks the user interaction
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
                    d3.event.preventDefault();
                    touchmoveEvent = d3.event.timeStamp;
                })
                    .on("mouseenter", function (d) {
                    _this.hintNeighbours(d);
                }) // on mouse over nodes we show "spikes" indicating there are hidden neighbours
                    .on("mouseleave", function (d) {
                    _this.unhintNeighbours(d);
                })
                    .on("wheel", function (d) {
                    // UF: need to send that event to the canvas, but how?!
                    debugger;
                })
                    .on("click", function (d) {
                    if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                        Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                        _this.click(d);
                    }
                })
                    .on("touchend", function (d) {
                    if (d3.event.timeStamp - touchmoveEvent < 100) {
                        _this.click(d);
                    }
                })
                    .call(this.d3cola.drag);
                nodeEnter.append("g")
                    .attr("id", function (d) {
                    return d.name() + "_spikes";
                })
                    .attr("transform", "translate(3,3)");
                // nodeEnter.append("rect")
                //     .attr("rx", 5).attr("ry", 5)
                //     .style("stroke-width", "0")
                //     .attr("width", this.nodeWidth).attr("height", nodeHeight)
                //     .on("click", function (d) { click(d) })
                //     .on("touchend", function (d) { click(d) });
                nodeEnter.append("text")
                    .attr('class', 'text')
                    .attr("dx", "0.7em")
                    .attr("dy", "1.0em")
                    .text(function (d) { return d.id; });
                nodeEnter.append("text")
                    .attr('class', 'furigana')
                    .attr("dx", "-1.0em")
                    .attr("dy", "0.0em")
                    .text(function (d) { return d.hiragana ? d.hiragana : ''; });
                nodeEnter.append("text")
                    .attr('class', 'english')
                    .attr("dx", "1.5em")
                    .attr("dy", "3.2em")
                    .text(function (d) { return d.english && 0 in d.english ? d.english[0] : '?'; });
                nodeEnter.append("title")
                    .text(function (d) { return d.id; });
                node.style("fill", function (d) { return d.colour; });
                return node;
            };
            // animates the mouse-over hint
            Frontend.prototype.hintNeighbours = function (v) {
                if (!v.cast)
                    return;
                var hiddenEdges = v.cast.length + 1 - v.degree;
                var r = 2 * Math.PI / hiddenEdges;
                for (var i = 0; i < hiddenEdges; ++i) {
                    var w = this.nodeWidth - 6, h = this.nodeHeight - 6, x = w / 2 + 25 * Math.cos(r * i), y = h / 2 + 30 * Math.sin(r * i);
                    //??rect = new cola.Rectangle(0, w, 0, h),
                    //??vi = rect.rayIntersection(x, y);
                    var dview = d3.select("#" + v.name() + "_spikes");
                    dview.append("rect")
                        .attr("class", "spike")
                        .attr("rx", 1).attr("ry", 1)
                        .attr("x", 0).attr("y", 0)
                        .attr("width", 10).attr("height", 2)
                        .on("click", function () {
                        //??this.click(v)
                    });
                }
            };
            // stopping the hint
            Frontend.prototype.unhintNeighbours = function (v) {
                var dview = d3.select("#" + v.name() + "_spikes");
                dview.selectAll(".spike").remove();
            };
            // was the viewnode added?
            Frontend.prototype.inView = function (v) {
                return typeof v.viewgraphid !== 'undefined';
            };
            // handle the mouse-click, tap
            Frontend.prototype.click = function (node) {
                if (node.colour !== this.red)
                    return;
                var focus = this.modelgraph.getNode(node.type, node.id);
                this.refocus(focus);
            };
            Frontend.prototype.graphBounds = function () {
                var _this = this;
                var x = Number.POSITIVE_INFINITY, X = Number.NEGATIVE_INFINITY, y = Number.POSITIVE_INFINITY, Y = Number.NEGATIVE_INFINITY;
                this.nodesLayer.selectAll(".node").each(function (v) {
                    x = Math.min(x, v.x - _this.nodeWidth / 2);
                    X = Math.max(X, v.x + _this.nodeWidth / 2);
                    y = Math.min(y, v.y - _this.nodeHeight / 2);
                    Y = Math.max(Y, v.y + _this.nodeHeight / 2);
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
            return Frontend;
        }());
        Frontend_1.Frontend = Frontend;
    })(Frontend || (Frontend = {}));
    return Frontend.Frontend;
});
//# sourceMappingURL=frontend.js.map
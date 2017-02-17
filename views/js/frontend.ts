/// <reference path="../node_modules/@types/webcola/index.d.ts" />.

import * as $ from 'jquery'
import * as d3 from 'd3'
import kanjiNav = require("./kanjiNav");


module Frontend {
    
    export class Frontend {
        
        // canvas size
        width: number;
        height: number;
        
        // node size
        nodeWidth: number;
        nodeHeight: number;
        
        red: string;
        
        // the engine
        cola: any;
        d3cola: any;
        // zooming behaviour
        zoom: any;

        
        // the object that communicates with the server to bring all the data
        modelgraph: kanjiNav.Graph;
        
        // WebCola will render that graph, and we'll try to keep it updated with the modelgraph
        viewgraph: any;
        
        // the SVG to play with
        outer: any;
        
        // the visuals group
        vis: any;
        edgesLayer: any;
        nodesLayer: any;
        
        // ??
        nodeMouseDown: boolean;
        
        constructor(modelgraph: kanjiNav.Graph, cola: any) {
            
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
            
            this.cola = cola;
            this.d3cola = cola.d3adaptor()//.d3adaptor(d3)
            .linkDistance(80)
            .avoidOverlaps(true)
            //  computes ideal lengths on each link to make extra space around high-degree nodes, using 5 as the basic length.
            // Alternately, you can pass your own function f into linkDistance(f) that returns a specific length for each link (e.g. based on your data).
            //.symmetricDiffLinkLengths(15)
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
        setupZooming()
        {
            // https://github.com/d3/d3-3.x-api-reference/blob/master/Zoom-Behavior.md
            // Construct a new zoom behavior:
            this.zoom = (d3 as any).behavior.zoom();
            this.outer.append('rect')
                .attr('class', 'background')
                .attr('width', "100%")
                .attr('height', "100%")
                // apply the behavior to selected element:
                .call(this.zoom.on("zoom", ()=>this.redraw()))
                // enable the zoom behavior’s dblclick event listener
                .on("dblclick.zoom", ()=>this.zoomToFit());

            // the layers in play
            this.vis = this.outer.append('g');
            this.edgesLayer = this.vis.append("g");
            this.nodesLayer = this.vis.append("g");

        }

        // define the gradients used down the road: SpikeGradient & (Reverse)EdgeGradient
        defineGradients()
        {
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
        }

        // adds a word to graph
        main(word: string) {

            // Note: http://piotrwalat.net/arrow-function-expressions-in-typescript/
            // Standard functions will dynamically bind this depending on execution context (just like in JavaScript)
            // Arrow functions on the other hand will preserve this of enclosing context. 
            var d = this.modelgraph.getNode(kanjiNav.Word, word, (v)=>this.addViewNode(v));
            
            $.when(d).then((startNode) => {this.refocus(startNode)});
        }

    // adds the node to the viewgraph, picks the initial position based on the startpos and assignes viewgraphid
    // used to schedule the images rendering
        addViewNode(v: any, startpos?: any) {
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
        }

        // setup the transiation based on the move/zoom, as it comes from 
        redraw(transition?: boolean) {
            // if mouse down then we are dragging not panning
            if (this.nodeMouseDown) {
                debugger;
                return;
            }

            // read the current zoom translation vector and the current zoom scale
            (transition ? this.vis.transition() : this.vis)
            .attr("transform", "translate(" + this.zoom.translate() + ") scale(" + this.zoom.scale() + ")");
        }

        // expands the selected node, renders the updated graph
        refocus(focus: any) {
            var neighboursExpanded = this.modelgraph.expandNeighbours(focus, (v) => {
                if (!this.inView(v))
                    this.addViewNode(v, focus);
            });

            // not sure why do we want to have it here in addition to the lines just below...
            this.refreshViewGraph();

            $.when(neighboursExpanded).then(()=>this.refreshViewGraph());
        }

        // sync the viewgraph with the modelgraph
        refreshViewGraph() {
            // drop the links from the viewgraph first
            this.viewgraph.links = [];

            // set the color of each node in the viewgraph, based on the fully-expanded status
            this.viewgraph.nodes.forEach((v) => {
                var fullyExpanded = this.modelgraph.fullyExpanded(v);
                v.colour = fullyExpanded ? "black" : this.red;
            });

            // create a link in the view for each edge in the model
            Object.keys(this.modelgraph.edges).forEach((e) => {

                var l = this.modelgraph.edges[e];
                var u = this.modelgraph.nodes[l.source],
                    v = this.modelgraph.nodes[l.target];

                if (this.inView(u) && this.inView(v))
                    this.viewgraph.links.push({
                        source: u,
                        target: v
                    });

                // UF: not sure about these:
                if (this.inView(u) && !this.inView(v)) {
                    console.log("inView(u) && !inView(v)");
                    u.colour = this.red;
                }

                if (!this.inView(u) && this.inView(v)) {
                    console.log("!inView(u) && inView(v)");
                    v.colour = this.red;
                }
            });

            this.update();
        }

        // pushes the viewgraph data into the adapter and starts rendering process
        update() {
            this.d3cola.nodes(this.viewgraph.nodes)
                .links(this.viewgraph.links)
                .start();

            var node = this.updateNodes(this.viewgraph);
            var link = this.updateLinks(this.viewgraph);

            this.d3cola.on("tick", () => {

                // setting the transform attribute to the array will result in syncronous calls to the callback provided for each node/link
                // so that these will move to the designated positions
                node.attr("transform", (d) => {
                    return "translate(" + (d.x - this.nodeWidth / 2) + "," + (d.y - this.nodeHeight / 2) + ")";
                });

                link.attr("transform", (d) => {
                        var dx = d.source.x - d.target.x,
                            dy = d.source.y - d.target.y;

                        var r = 180 * Math.atan2(dy, dx) / Math.PI;

                        return "translate(" + d.target.x + "," + d.target.y + ") rotate(" + r + ") ";
                    })
                    .attr("width", (d) => {
                        var dx = d.source.x - d.target.x,
                            dy = d.source.y - d.target.y;

                        return Math.sqrt(dx * dx + dy * dy);
                    });
            });
        }

        // re-populates edgesLayer with links
        updateLinks(viewgraph) {
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
                .attr("fill", (d) => {
                    if (d.source.colour === this.red && d.target.colour === this.red) {
                        // UF never happens?
                        return this.red;
                    }

                    if (d.source.colour !== this.red && d.target.colour !== this.red) {
                        // the link between "resolved" nodes
                        return "darkgray";
                    }

                    return d.source.colour === this.red ? "url(#ReverseEdgeGradient)" : "url(#EdgeGradient)";
                });

            return link;
        }

        // re-populates the nodesLayer with nodes
        updateNodes(viewgraph) {
            var node = this.nodesLayer.selectAll(".node")
                .data(viewgraph.nodes, (d) => {
                    return d.viewgraphid;
                })

            // erase the nodes which aren't here anymore
            node.exit().remove();

            // remember the last place/time the mouse/touch event has occured, so we can distinguish between a move and a click/tap
            let mouseDownEvent: any;
            let mouseUpEvent: any;
            let touchmoveEvent: number;

            // insert a group that tracks the user interaction
            var nodeEnter = node.enter().append("g")
                .attr("id", (d) => {
                    return d.name()
                })
                .attr("class", "node")
                .on("mousedown", () => {
                    mouseDownEvent = d3.event;
                    this.nodeMouseDown = true;
                }) // recording the mousedown state allows us to differentiate dragging from panning
                .on("mouseup", () => {
                    mouseUpEvent = d3.event;
                    this.nodeMouseDown = false;
                })
                .on("touchmove", () => {
                    d3.event.preventDefault();
                    touchmoveEvent = d3.event.timeStamp;
                })
                .on("mouseenter", (d) => {
                    this.hintNeighbours(d)
                }) // on mouse over nodes we show "spikes" indicating there are hidden neighbours
                .on("mouseleave", (d) => {
                    this.unhintNeighbours(d)
                })
                .on("wheel", (d) => {
                    // UF: need to send that event to the canvas, but how?!
                    debugger;
                })
                .on("click", (d) => {
                    if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                        Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                        this.click(d);
                    }
                })
                .on("touchend", (d) => {
                    if (d3.event.timeStamp - touchmoveEvent < 100) {
                        this.click(d)
                    }
                })
                .call(this.d3cola.drag);

            nodeEnter.append("g")
                .attr("id", (d) => {
                    return d.name() + "_spikes"
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
                .text((d) =>d.id);

            nodeEnter.append("text")
                .attr('class', 'furigana')
                .attr("dx", "-1.0em")
                .attr("dy", "0.0em")
                .text((d) => d.hiragana ? d.hiragana : '');

            nodeEnter.append("text")
                .attr('class', 'english')
                .attr("dx", "1.5em")
                .attr("dy", "3.2em")
                .text((d) =>d.english && 0 in d.english ? d.english[0] : '?');

            nodeEnter.append("title")
                .text((d) =>d.id);

            node.style("fill", (d) => d.colour);

            return node;
        }

        // animates the mouse-over hint
        hintNeighbours(v) {
            if (!v.cast) return;
            var hiddenEdges = v.cast.length + 1 - v.degree;
            var r = 2 * Math.PI / hiddenEdges;
            for (var i = 0; i < hiddenEdges; ++i) {
                var w = this.nodeWidth - 6,
                    h = this.nodeHeight - 6,
                    x = w / 2 + 25 * Math.cos(r * i),
                    y = h / 2 + 30 * Math.sin(r * i);
                    
                let rect = new this.cola.Rectangle(0, w, 0, h);
                let vi = rect.rayIntersection(x, y);
                
                var dview = d3.select("#" + v.name() + "_spikes");

                dview.append("rect")
                    .attr("class", "spike")
                    .attr("rx", 1).attr("ry", 1)
                    .attr("x", 0).attr("y", 0)
                    .attr("width", 10).attr("height", 2)
                    .attr("transform", "translate(" + vi.x + "," + vi.y + ") rotate(" + (360 * i / hiddenEdges) + ")")
                    .on("click", () => this.click(v));
            }
        }

        // stopping the hint
        unhintNeighbours(v) {
            var dview = d3.select("#" + v.name() + "_spikes");
            dview.selectAll(".spike").remove();
        }

        // was the viewnode added?
        inView(v) {
            return typeof v.viewgraphid !== 'undefined';
        }

        // handle the mouse-click, tap
        click(node: any) {
            if (node.colour !== this.red)
                return;

            var focus = this.modelgraph.getNode(node.type, node.id);
            this.refocus(focus);
        }

        graphBounds() {
            var x = Number.POSITIVE_INFINITY,
                X = Number.NEGATIVE_INFINITY,
                y = Number.POSITIVE_INFINITY,
                Y = Number.NEGATIVE_INFINITY;
            this.nodesLayer.selectAll(".node").each((v) => {
                x = Math.min(x, v.x - this.nodeWidth / 2);
                X = Math.max(X, v.x + this.nodeWidth / 2);
                y = Math.min(y, v.y - this.nodeHeight / 2);
                Y = Math.max(Y, v.y + this.nodeHeight / 2);
            });
            return {
                x: x,
                X: X,
                y: y,
                Y: Y
            };
        }

        clearAll() {

            this.viewgraph = {
                nodes: [],
                links: []
            };

            this.update();

            this.modelgraph.reset();
        }

        navigateToWord(word: string) {

            this.main(word);
        }

        fullScreenCancel() {
            this.outer.attr("width", this.width).attr("height", this.height);
            this.zoomToFit();
        }

        zoomToFit() {
            var b = this.graphBounds();
            var w = b.X - b.x,
                h = b.Y - b.y;
            var cw = this.outer.attr("width"),
                ch = this.outer.attr("height");
            var s = Math.min(cw / w, ch / h);
            var tx = (-b.x * s + (cw / s - w) * s / 2),
                ty = (-b.y * s + (ch / s - h) * s / 2);
            this.zoom.translate([tx, ty]).scale(s);
            this.redraw(true);
        }

        getParameterByName(name, url) {
            if (!url) {
                url = window.location.href;
            }
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
	}	
}

function zoomToFit() {
    
    Frontend.Frontend.prototype.zoomToFit();
}
export = Frontend.Frontend;
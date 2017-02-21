/// <reference path="../node_modules/@types/webcola/index.d.ts" />.
/// <reference path="../node_modules/@types/js-cookie/index.d.ts" />.

import * as $ from 'jquery'
import * as d3 from 'd3'
import kanjiNav = require("./kanjiNav");


module Frontend {

    class FELink {
        source: kanjiNav.Node;
        target: kanjiNav.Node;
    }

    class ViewGraph {

        nodes: kanjiNav.Node[];
        links: FELink[];
    }

    export class Frontend {
        static readonly jlptSelectedLevelsCookieName = "jlptSelectedLevels";


        // canvas size
        width: number;
        height: number;

        // node size
        static fontSize: number = 22;
        static nodeWidth: number = 30;
        static nodeHeight: number = Frontend.fontSize;

        red: string;

        // cookie monster
        cookies: Cookies.CookiesStatic;

        // the engine
        cola: any;
        d3cola: any;
        // zooming behaviour
        zoom: any;

        // the object that communicates with the server to bring all the data
        modelgraph: kanjiNav.Graph;

        // WebCola will render that graph, and we'll try to keep it updated with the modelgraph
        viewgraph: ViewGraph;

        // the SVG to play with
        outer: any;

        // the visuals group
        vis: any;
        edgesLayer: any;
        nodesLayer: any;

        // selected JLPTs
        jlpts: string;

        // ??
        nodeMouseDown: boolean;

        constructor(modelgraph: kanjiNav.Graph, cola: any, cookies: Cookies.CookiesStatic) {

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
                //  computes ideal lengths on each link to make extra space around high-degree nodes, using 5 as the basic length.
                // Alternately, you can pass your own function f into linkDistance(f) that returns a specific length for each link (e.g. based on your data).
                //.symmetricDiffLinkLengths(15)
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
        setupZooming() {
            // https://github.com/d3/d3-3.x-api-reference/blob/master/Zoom-Behavior.md
            // Construct a new zoom behavior:
            this.zoom = d3.behavior.zoom();
            this.outer.append('rect')
                .attr('class', 'background')
                .attr('width', "100%")
                .attr('height', "100%")
                // apply the behavior to selected element:
                .call(this.zoom.on("zoom", () => this.redraw()))
                // enable the zoom behavior’s dblclick event listener
                .on("dblclick.zoom", () => this.zoomToFit());

            // the layers in play
            this.vis = this.outer.append('g');
            this.edgesLayer = this.vis.append("g");
            this.nodesLayer = this.vis.append("g");

        }

        // define the gradients used down the road: SpikeGradient & (Reverse)EdgeGradient
        defineGradients() {
            let defs = this.outer.append("svg:defs");

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
            var d = this.modelgraph.getNode(kanjiNav.Word, word, (v) => this.addViewNode(v));

            $.when(d).then((startNode) => { this.refocus(startNode) });
        }

        // adds the node to the viewgraph, picks the initial position based on the startpos and assignes viewgraphid
        // used to schedule the images rendering
        addViewNode(v: kanjiNav.Node, startpos?: any) {

            v.viewgraphid = this.viewgraph.nodes.length;

            if (typeof startpos !== 'undefined') {
                v.x = startpos.x;
                v.y = startpos.y;
            }

            this.viewgraph.nodes.push(v);
        }

        // setup the transiation based on the move/zoom, as it comes from 
        redraw(transition?: boolean) {
            // if mouse down then we are dragging not panning
            if (this.nodeMouseDown) {
                //debugger;
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

            $.when(neighboursExpanded).then(() => this.refreshViewGraph());
        }

        // sync the viewgraph with the modelgraph
        refreshViewGraph() {
            // drop the links from the viewgraph first
            this.viewgraph.links = [];

            // set the color of each node in the viewgraph, based on the fully-expanded status
            this.filteredNodes()
                .forEach((v) => {
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

        filteredNodes(): kanjiNav.Node[] {
            return this.viewgraph.nodes.filter(n => this.isSelectedJlpt(n.jlpt) &&
                false == n.hidden);
        }

        isSelectedJlpt(level: number) {
            return '' == this.jlpts || 0 <= this.jlpts.indexOf(level.toString());
        }

        filteredLinks() {
            // only the links which connect to visible nodes
            return this.viewgraph.links.filter(l => this.isSelectedJlpt(l.source.jlpt)
                && !l.source.hidden && !l.target.hidden
                && this.isSelectedJlpt(l.target.jlpt)
            );
        }

        // pushes the viewgraph data into the adapter and starts rendering process
        update() {
            this.d3cola
                .nodes(this.filteredNodes())
                .links(this.filteredLinks())
                .start();

            var node = this.updateNodes();
            var link = this.updateLinks();

            this.d3cola.on("tick", () => {

                // setting the transform attribute to the array will result in syncronous calls to the callback provided for each node/link
                // so that these will move to the designated positions
                node.attr("transform", (d) => {

                    if (!d.id || '' == d.id)
                        return "translate(" + (d.x - Frontend.nodeWidth / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
                    else
                        return "translate(" + (d.x - d.id.length * Frontend.fontSize / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
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
        updateLinks() {
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

        // re-populate the nodesLayer with nodes
        updateNodes() {
            var node = this.nodesLayer.selectAll(".node")
                .data(this.filteredNodes(), (d) => {
                    return d.viewgraphid;
                })

            // erase the nodes which aren't here anymore
            node.exit().remove();

            // remember the last place/time the mouse/touch event has occured, so we can distinguish between a move and a click/tap
            let mouseDownEvent: any;
            let mouseUpEvent: any;
            let touchmoveEvent: number;

            // insert the parent group - it  tracks the user interaction
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
                    event.preventDefault();
                    touchmoveEvent = event.timeStamp;
                })
                .on("mouseenter", (d) => {
                    this.hintNeighbours(d)
                }) // on mouse over nodes we show "spikes" indicating there are hidden neighbours
                .on("mouseleave", (d) => {
                    this.unhintNeighbours(d)
                })
                .on("wheel", (d) => {
                    // UF: need to send that event to the canvas, but how?!
                    //debugger;
                })
                // .on("click", (d) => {
                //     if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                //         Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                //         this.click(d);
                //     }
                // })
                .on("touchend", (d) => {
                    if (event.timeStamp - touchmoveEvent < 100) {
                        this.dblclick(d)
                    }
                })
                .call(this.d3cola.drag);



            // the background for the word/kangi
            let wordCard = nodeEnter
                .append("g")
                .attr('style', (n) => "fill: " + this.jlpt2color(n.jlpt))
                .attr('transform', 'translate(-10, -20)')
                // create a reference to the <g> id sections defined in the existing svg markup exported from Inkscape
                .append("use")
                .attr("xlink:href", (n) => !n.isKanji() ? '#g12' + n.id.length : '#kanjiBG')
                ;

            wordCard
                .on("click", (n: kanjiNav.Node) => { this.hideNode(n); });

            // the spikes
            nodeEnter.append("g")
                .attr("id", (n) => {
                    return n.name() + "_spikes"
                })
                .attr("transform", "translate(0,3)");

            // the word itself
            let text = nodeEnter.append("text")
                .attr('class', 'text')
                // .attr('dx', (n) => !n.isKanji() ? '-0.2em' : '0.0em')
                // .attr('dy', (n) => !n.isKanji() ? '-0.2em' : '0.0em')
                .text((d) => d.id)
                ;
            text
                .on("dblclick", (d) => {
                    if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                        Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                        this.dblclick(d);
                    }
                })

            // the rubi
            nodeEnter.append("text")
                .attr("dy", "-1px")
                .text((n: kanjiNav.Node) => n.hiragana ? n.hiragana : '');

            // the english translation
            nodeEnter.append("text")
                .attr("dy", "3.0em")
                .text((n: kanjiNav.Node) => n.isKanji() ? '' : (n.english && 0 in n.english ? n.english[0] : '?'))
                ;

            // the tooltip
            nodeEnter.append("title")
                .text((d) => d.english && 0 in d.english ? d.english[0] : '?')
                ;

            node.style("fill", (n: kanjiNav.Node) => n.colour);

            return node;
        }

        // animates the mouse-over hint
        hintNeighbours(v) {
            if (!v.cast) return;
            var hiddenEdges = v.cast.length + 1 - v.degree;
            var r = 2 * Math.PI / hiddenEdges;
            for (var i = 0; i < hiddenEdges; ++i) {
                var w = Frontend.nodeWidth - 6,
                    h = Frontend.nodeHeight - 6,
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
                    .on("dblclick", () => this.dblclick(v));
            }
        }

        // stopping the hint
        unhintNeighbours(v) {
            var dview = d3.select("#" + v.name() + "_spikes");
            dview.selectAll(".spike").remove();
        }

        hideNode(n: kanjiNav.Node) {
            // don't hide kanji
            if (n.isKanji()) {
                return;
            }

            n.hidden = true;

            this.update();
        }

        // was the viewnode added?
        inView(v) {
            return typeof v.viewgraphid !== 'undefined';
        }

        // handle the mouse-dblclick, tap
        dblclick(node: any) {
            if (node.colour !== this.red)
                return;




            //var focus = this.modelgraph.getNode(node.type, node.id);
            //this.refocus(focus);

            var d = this.modelgraph.getNode(node.type, node.id);

            $.when(d).then((focus) => { this.refocus(focus) });

        }

        graphBounds() {
            var x = Number.POSITIVE_INFINITY,
                X = Number.NEGATIVE_INFINITY,
                y = Number.POSITIVE_INFINITY,
                Y = Number.NEGATIVE_INFINITY;
            this.nodesLayer.selectAll(".node").each((v) => {
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

        setupJlptChecks() {

            this.jlpts = this.cookies.get(Frontend.jlptSelectedLevelsCookieName);
            if (!this.jlpts) {
                this.jlptSelect(5);
                this.jlptSelect(4);
            }

            this.jlpts.split('').forEach(n => {

                $('#JLPT' + n).prop('checked', true);
                $('#JLPT' + n).parents('label').addClass('active');
            });
        }

        jlptSelect(n: number) {

            let curSel: string = this.cookies.get(Frontend.jlptSelectedLevelsCookieName);
            curSel = curSel ? curSel : '';

            // we land here before the control has reflected the new status
            let willBecomeChecked: boolean = !$('#JLPT' + n).is(':checked');
            this.jlpts = curSel.replace(new RegExp(n.toString(), 'g'), '') + (willBecomeChecked ? n.toString() : '');

            this.cookies.set(Frontend.jlptSelectedLevelsCookieName, this.jlpts);

            this.refreshViewGraph();
        }

        jlpt2color(level: number) {
            switch (level) {
                case 1: return "#d43f3a";
                case 2: return "#f0ad4e";
                case 3: return "#337ab7";
                case 4: return "#eae548";
                case 5: return "#5cb85c";
                default:
                    return "#cccccc";
            }
        }
    }
}

function zoomToFit() {

    Frontend.Frontend.prototype.zoomToFit();
}
export = Frontend.Frontend;
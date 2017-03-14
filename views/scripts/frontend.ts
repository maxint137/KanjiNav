/// <reference path="../node_modules/@types/webcola/index.d.ts" />.
/// <reference path="../node_modules/@types/js-cookie/index.d.ts" />.
import * as $ from 'jquery'
import * as d3 from 'd3'

//import kanjiNav = require("./kanjiNav");
import {JLPTDictionary, NodeType, ApiNode} from 'kanjiNavBase'
import {Graph, Node} from 'kanjiNav'

class ViewNode extends Node implements cola.Node {
    constructor(kn: Node) {
        super(kn.type, kn.id);
        this.copyData(kn);

        this.hidden = false;
    }

    // cola.Node's implementation
    x: number;
    y: number;
    width?: number;
    height?: any;
    number: any;

    // app specific:
    colour: string;
    viewgraphid: number;
    hidden: boolean;
}

class ViewLink {
    source: ViewNode;
    target: ViewNode;
}

class ViewGraph {

    nodes: Array<ViewNode>;
    links: Array<ViewLink>;
}

interface ColaMachine {
    d3adaptor(d3: any): cola.D3StyleLayoutAdaptor;
}

export class Frontend {
    static readonly jlptSelectedLevelsCookieName = "jlptSelectedLevels";
    static readonly wordsHistoryCookieName = "wordsHistory";

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
    cola: ColaMachine;
    d3cola: cola.D3StyleLayoutAdaptor;
    // zooming behaviour
    zoom: any;

    // the object that communicates with the server to bring all the data
    modelgraph: Graph;

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

    constructor(modelgraph: Graph, coke: ColaMachine, cookies: Cookies.CookiesStatic) {

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
        this.d3cola = <cola.D3StyleLayoutAdaptor>this.cola.d3adaptor(d3)
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
        var d = this.modelgraph.getNode(NodeType.Word, word, v => this.addViewNode(new ViewNode(v)));

        $.when(d).then(startNode => { this.refocus(startNode) });
    }

    // adds the node to the viewgraph, picks the initial position based on the startpos and assignes viewgraphid
    // used to schedule the images rendering
    addViewNode(v: ViewNode, startpos?: any) {

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
        var neighboursExpanded = this.modelgraph.expandNeighbours(focus, v => {
            if (!this.inView(this.findNode(v)))
                this.addViewNode(new ViewNode(v), focus);
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
            .forEach(v => {
                var fullyExpanded = this.modelgraph.fullyExpanded(v);
                v.colour = fullyExpanded ? "black" : this.red;
            });

        // create a link in the view for each edge in the model
        Object.keys(this.modelgraph.edges).forEach(e => {

            var l = this.modelgraph.edges[e];
            let u: ViewNode = this.findNode(this.modelgraph.nodes[l.source]);
            let v: ViewNode = this.findNode(this.modelgraph.nodes[l.target]);

            if (this.inView(u) && this.inView(v)) {

                this.viewgraph.links.push({
                    source: u,
                    target: v
                });
            }

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

    nodeIsNotFilteredOut(n: ViewNode) {

        return n.isKanji()
            || (this.isSelectedJlpt(n.JLPT) && false == n.hidden);
    }

    filteredNodes(): Array<ViewNode> {
        return this.viewgraph.nodes.filter(n => { return this.nodeIsNotFilteredOut(n); });
    }

    isSelectedJlpt(level: number) {
        return '' == this.jlpts || 0 <= this.jlpts.indexOf(level.toString());
    }

    filteredLinks() {
        // only the links which connect to visible nodes
        return this.viewgraph.links.filter(l => {
            return this.nodeIsNotFilteredOut(l.source)
                && this.nodeIsNotFilteredOut(l.target);
        });
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
            node.attr("transform", d => {

                if (!d.id || '' == d.id)
                    return "translate(" + (d.x - Frontend.nodeWidth / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
                else
                    return "translate(" + (d.x - 1.5 * d.id.length * Frontend.fontSize / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
            });

            link.attr("transform", d => {
                var dx = d.source.x - d.target.x,
                    dy = d.source.y - d.target.y;

                var r = 180 * Math.atan2(dy, dx) / Math.PI;

                return "translate(" + d.target.x + "," + d.target.y + ") rotate(" + r + ") ";
            })
                .attr("width", d => {
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
            .attr("fill", d => {
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
            .data(this.filteredNodes(), d => {
                return d.viewgraphid;
            })

        // erase the nodes which aren't here anymore
        node.exit().remove();

        // remember the last place/time the mouse/touch event has occured, so we can distinguish between a move and a click/tap
        let mouseDownEvent: any;
        let mouseUpEvent: any;
        let touchstartEvent: number;
        let doubleTap: boolean;

        // insert the parent group - it  tracks the user interaction
        var nodeEnter = node.enter().append("g")

            .attr("id", d => {
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
            .on("touchstart", () => {
                doubleTap = event.timeStamp - touchstartEvent < 500;
                touchstartEvent = event.timeStamp;
            })
            .on("touchmove", () => {
                event.preventDefault();
            })
            .on("mouseenter", d => {
                this.hintNeighbours(d)
            }) // on mouse over nodes we show "spikes" indicating there are hidden neighbours
            .on("mouseleave", d => {
                this.unhintNeighbours(d)
            })
            .on("wheel", d => {
                // UF: need to send that event to the canvas, but how?!
                //debugger;
            })
            .on("touchend", d => {
                if (doubleTap) {
                    doubleTap = false;
                    this.dblclick(d);
                }
            })
            .call(this.d3cola.drag)
            ;

        // the background for the word/kangi
        let wordCard = nodeEnter
            .append("g")
            .attr('style', n => "fill: " + this.jlpt2color(n.JLPT))
            .attr('transform', 'translate(-10, -20)')
            // create a reference to the <g> id sections defined in the existing svg markup exported from Inkscape
            .append("use")
            // g123 or kanjiBG
            .attr("xlink:href", n => !n.isKanji() ? '#g12' + n.id.length : '#kanjiBG')
            ;

        wordCard
            .on("click", (n: ViewNode) => { this.hideNode(n); });

        // the spikes
        nodeEnter.append("g")
            .attr("id", n => {
                return n.name() + "_spikes"
            })
            .attr("transform", "translate(0,3)");

        // the word itself
        let text = nodeEnter.append("text")
            .attr('class', 'text')
            // .attr('dx', n => !n.isKanji() ? '-0.2em' : '0.0em')
            // .attr('dy', n => !n.isKanji() ? '-0.2em' : '0.0em')
            .text(d => d.id)
            ;
        text
            .on("dblclick", d => {
                if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                    Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                    this.dblclick(d);
                }
            })

        // the rubi
        nodeEnter.append("text")
            .attr("dy", "-1px")
            .text((n: ViewNode) => n.hiragana ? n.hiragana : '');

        // the english translation
        nodeEnter.append("text")
            .attr("dy", "3.0em")
            .text((n: ViewNode) => n.isKanji() ? '' : (n.english && 0 in n.english ? n.english[0] : '?'))
            ;

        // the tooltip
        nodeEnter.append("title")
            .text(d => d.english && 0 in d.english ? d.english[0] : '?')
            ;

        node.style("fill", (n: ViewNode) => n.colour);

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

            let rect = new cola.vpsc.Rectangle(0, w, 0, h);
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

    hideNode(n: ViewNode) {
        // don't hide kanji
        if (n.isKanji()) {
            return;
        }

        n.hidden = true;

        this.update();

        // add the word to the combo, if it's not there yet
        let hiddenWordsCombo: JQuery = $('#hiddenWordsCombo');
        if (0 == hiddenWordsCombo.find('option[value="' + n.id + '"]').length) {
            hiddenWordsCombo.append($('<option>', {
                value: n.id,
                text: n.id
            }));
        }
    }

    findNode(n: Node): ViewNode {
        let fen = this.viewgraph.nodes.filter((fen) => fen.id === n.id);
        return fen[0];

    }

    // was the viewnode already added?
    inView(v: ViewNode) {

        return typeof v !== 'undefined'
            && typeof v.viewgraphid !== 'undefined';
    }

    collapseNode(node: ViewNode) {

        // for each linked node
        node.cast.forEach(c => {
            // see how many links it has at the moment:
            let neighbour: ViewNode = this.filteredNodes().filter((nn) => nn.id == c.word)[0];
            if (neighbour) {
                let links = this.viewgraph.links.filter((l) => l.source == neighbour || l.target == neighbour);

                if (links.length == 1) {
                    // this node is only connected with one link - hide it
                    this.hideNode(neighbour);
                }
            }
        });

        this.update();
    }

    uncollapseNode(node: Node) {

        this.viewgraph.links
            .filter((l) => l.target == node)
            .map((l) => l.source)
            .forEach(n => this.unhideWord(n.id))
            ;

        this.viewgraph.links
            .filter((l) => l.source == node)
            .map((l) => l.target)
            .forEach(n => this.unhideWord(n.id))
            ;
    }

    // handle the mouse-dblclick, tap
    dblclick(node: ViewNode) {
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

            $.when(d).then((focus) => { this.refocus(focus) });
        }


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

        this.updateWordInHistory(word);

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

    storageGet(paramName: string) {
        if (typeof (Storage) !== "undefined") {
            return localStorage.getItem(paramName);
        }
        else {
            return this.cookies.get(paramName);
        }
    }

    storageSet(paramName: string, value: string) {

        if (typeof (Storage) !== "undefined") {
            localStorage.setItem(paramName, value);
        }
        else {
            this.cookies.set(paramName, value);
        }

    }

    setupJlptChecks() {

        this.jlpts = this.storageGet(Frontend.jlptSelectedLevelsCookieName);
        if (!this.jlpts) {
            this.jlptSelect(5);
            this.jlptSelect(4);
        }

        this.jlpts.split('').forEach(n => {

            $('#JLPT' + n).prop('checked', true);
            $('#JLPT' + n).parents('label').addClass('active');
        });
    }

    removeWordFromHistory(selectBoxId: string, word: string) {

        // delete it from the dropdown
        $('#' + selectBoxId + " option[value='" + word + "']").remove();

        // and the history
        this.updateWordInHistory(word, false);
    }

    loadWordHistory(selectBoxId: string) {

        let selectBox = $(selectBoxId);

        selectBox
            .find('option')
            .remove()
            .end()
            ;

        let oldHistory: string = this.storageGet(Frontend.wordsHistoryCookieName);
        if (!oldHistory || '' === oldHistory) {
            oldHistory = '楽しい 普通 産業';
        }

        let oldHistoryArray: Array<string> = oldHistory.split(' ');
        oldHistoryArray.forEach(word => {
            selectBox.append($('<option>', {
                value: word,
                text: word
            }));
        });
    }

    updateWordInHistory(word: string, add: boolean = true) {
        let oldHistory: string = this.storageGet(Frontend.wordsHistoryCookieName);
        let oldHistoryArray: Array<string> = oldHistory ? oldHistory.split(' ') : [];

        let foundIndex: number = oldHistoryArray.indexOf(word);

        // to add, and wasn't found?
        if (add && foundIndex < 0) {
            oldHistoryArray.push(word);
        }

        // to delete, and was found?
        if (!add && 0 <= foundIndex) {
            oldHistoryArray.splice(foundIndex, 1);
        }

        this.storageSet(Frontend.wordsHistoryCookieName, oldHistoryArray.join(' '));
    }


    jlptSelect(n: number) {

        let curSel: string = this.storageGet(Frontend.jlptSelectedLevelsCookieName);
        curSel = curSel ? curSel : '';

        // we land here before the control has reflected the new status
        let willBecomeChecked: boolean = !$('#JLPT' + n).is(':checked');
        this.jlpts = curSel.replace(new RegExp(n.toString(), 'g'), '') + (willBecomeChecked ? n.toString() : '');

        this.storageSet(Frontend.jlptSelectedLevelsCookieName, this.jlpts);

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

    unhideWord(word: string) {

        $("#hiddenWordsCombo option[value='" + word + "']").remove();

        this.viewgraph.nodes.filter(n => n.id == word)[0].hidden = false;
        this.update();
    }
}

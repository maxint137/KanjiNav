/// <reference path="../node_modules/@types/webcola/index.d.ts" />
/// <reference path="../node_modules/@types/js-cookie/index.d.ts" />
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="knApi.ts" />

// UF: can't use the reference: 'd3' refers to a UMD global, but the current file is a module. Consider adding an import instead.
// see http://garrettn.github.io/blog/2014/02/19/write-modular-javascript-that-works-anywhere-with-umd/
/// <reference path="../node_modules/@types/d3/index.d.ts" />.
import * as d3 from 'd3'

//import { D3StyleLayoutAdaptor as ColaD3StyleLayoutAdaptor } from '../node_modules/webcola/WebCola/src/d3v3adaptor'

import { INode as KNModel_INode, Graph as KNModel_Graph, NodeTypes as KNModel_NodeTypes } from './knModel'

class ViewNodeBase implements KNModel_INode {

    constructor(public mn: KNModel_INode) {
    }

    get text(): string { return this.mn.text; }
    get type(): KNModel_NodeTypes { return this.mn.type; }
    get id(): string { return this.mn.id; }
    get title(): string[] { return this.mn.title; }
    get subscript(): string[] { return this.mn.subscript; }
    get superscript(): string[] { return this.mn.superscript; }
    get hint(): string[] { return this.mn.hint; }
    get JLPT(): KNApi.JlptLevel { return this.mn.JLPT; }
    get isKanji(): boolean { return this.mn.isKanji; }
    get hood(): KNModel_INode[] { return this.mn.hood; }
    get degree(): number { return this.mn.degree; }
}

class ViewNode extends ViewNodeBase implements cola.Node {

    constructor(mn: KNModel_INode) {
        super(mn);
        this.hidden = false;
    }
    // cola.Node's implementation
    index?: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    fixed: number;
    number: number;

    // app specific:
    color: string;
    viewGraphId: number;
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

    // the engine
    layout: any; //ColaD3StyleLayoutAdaptor;
    // zooming behavior
    zoom: any;

    // WebCola will render that graph, and we'll try to keep it updated with the modelGraph
    viewGraph: ViewGraph;
    viewGraphSaved: ViewGraph;

    // the SVG to play with
    outer: d3.Selection<any>;

    // the visuals group
    vis: any;
    edgesLayer: any;
    nodesLayer: any;

    // selected JLPTs
    jlpts: string;

    // ??
    nodeMouseDown: boolean;

    constructor(public modelGraph: KNModel_Graph, public webColaLibrary: any, public cookies: Cookies.CookiesStatic) {

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
            //  computes ideal lengths on each link to make extra space around high-degree nodes, using 5 as the basic length.
            // Alternately, you can pass your own function f into linkDistance(f) that returns a specific length for each link (e.g. based on your data).
            //.symmetricDiffLinkLengths(15)
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

        function addGradient(id: string, color1: string, opacity1: number, color2: string, opacity2: number) {
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
    }

    // UF: these are not sufficient anymore, we must (de)serialize the model data as well
    saveGraph() {
        this.viewGraphSaved.nodes = this.viewGraph.nodes;
        this.refreshViewGraph();
    }

    loadGraph() {
        this.viewGraph.nodes = this.viewGraphSaved.nodes;
        this.refreshViewGraph();
    }

    // adds a word to graph
    main(word: string) {

        // Note: http://piotrwalat.net/arrow-function-expressions-in-typescript/
        // Standard functions will dynamically bind this depending on execution context (just like in JavaScript)
        // Arrow functions on the other hand will preserve this of enclosing context. 
        //var d = this.modelGraph.loadNode(word.length == 1 ? KNModel_NodeType.Char : KNModel_NodeType.Word, word, v => this.addViewNode(v));
        var d = this.modelGraph.loadNode(word.length == 1 ? "Kanji" : "Word", word, v => this.addViewNode(v));

        $.when(d).then(loadedNode => { this.refocus(loadedNode) });
    }

    // adds the node to the viewGraph, picks the initial position based on the startPos and assigns viewGraphId
    // used to schedule the images rendering
    addViewNode(mn: KNModel_INode, startPos?: cola.Node) {

        let vn: ViewNode = new ViewNode(mn);

        vn.viewGraphId = this.viewGraph.nodes.length;

        if (typeof startPos !== 'undefined') {
            vn.x = startPos.x;
            vn.y = startPos.y;
        }

        this.viewGraph.nodes.push(vn);
    }

    // expands the selected node, renders the updated graph
    refocus(node: KNModel_INode) {

        // find the corresponding view-node:
        //let focus: ViewNode = this.viewGraph.nodes.filter((vn: ViewNode) => vn.id == node.id)[0];
        let focus: ViewNode = this.viewGraph.nodes.filter((vn: ViewNode) => vn.mn.id == node.id)[0];

        let neighborsExpanded: JQueryPromise<KNModel_INode[]> = this.modelGraph.expandNeighbors(focus.mn, (mn: KNModel_INode) => {
            if (!this.inView(this.findNode(mn))) {
                this.addViewNode(mn, focus);
            }
        });

        // not sure why do we want to have it here in addition to the line just below...
        this.refreshViewGraph();

        $.when(neighborsExpanded).then((hood) => this.addViewLinks(node, hood));
    }

    addViewLinks(node: KNModel_INode, hood: KNModel_INode[]) {
        let u: ViewNode = this.findNode(node);

        typeof hood === 'undefined' ||
            hood.forEach(h => {
                let newLink: ViewLink = { source: u, target: this.findNode(h) };

                // make sure it is a new one
                let oldLinks1: ViewLink[] = this.viewGraph.links.filter((l) => l.source.id == newLink.source.id && l.target.id == newLink.target.id);
                let oldLinks2: ViewLink[] = this.viewGraph.links.filter((l) => l.target.id == newLink.source.id && l.source.id == newLink.target.id);

                if (0 === oldLinks1.length && 0 === oldLinks2.length) {
                    this.viewGraph.links.push(newLink);
                }
            });

        this.refreshViewGraph();
    }


    // sync the viewGraph with the modelGraph
    refreshViewGraph() {
        // set the color of each node in the viewGraph, based on the fully-expanded status
        this.filteredNodes()
            .forEach(v => {
                v.color = this.modelGraph.isFullyExpanded(v.mn) ? "black" : this.red;
            });

        // this.update();
        // return;

        // drop the links from the viewGraph first
        this.viewGraph.links = [];

        // create a link in the view for each edge in the model
        Object.keys(this.modelGraph.edges).forEach(e => {

            var l = this.modelGraph.edges[e];
            let u: ViewNode = this.findNode(this.modelGraph.nodes[l.source]);
            let v: ViewNode = this.findNode(this.modelGraph.nodes[l.target]);

            if (this.inView(u) && this.inView(v)) {

                this.viewGraph.links.push({
                    source: u,
                    target: v
                });
            }

            // UF: not sure about these:
            if (this.inView(u) && !this.inView(v)) {
                console.log("inView(u) && !inView(v)");
                u.color = this.red;
            }

            if (!this.inView(u) && this.inView(v)) {
                console.log("!inView(u) && inView(v)");
                v.color = this.red;
            }
        });

        this.update();
    }

    nodeIsNotFilteredOut(n: ViewNode) {

        return n.mn.isKanji
            || (false == n.hidden && this.isSelectedJlpt(n.mn.JLPT));
    }

    filteredNodes(): Array<ViewNode> {
        return this.viewGraph.nodes.filter(n => { return this.nodeIsNotFilteredOut(n); });
    }

    isSelectedJlpt(level: KNApi.JlptLevel) {
        return '' == this.jlpts || 0 <= this.jlpts.indexOf(level.toString());
    }

    filteredLinks() {
        // only the links which connect to visible nodes
        return this.viewGraph.links.filter(l => {
            return this.nodeIsNotFilteredOut(l.source)
                && this.nodeIsNotFilteredOut(l.target);
        });
    }

    // pushes the viewGraph data into the adapter and starts rendering process
    update() {
        this.layout
            .nodes(this.filteredNodes())
            .links(this.filteredLinks())
            .start();

        var node = this.updateNodes();
        var link = this.updateLinks();

        this.layout.on("tick", () => {

            // setting the transform attribute to the array will result in synchronous calls to the callback provided for each node/link
            // so that these will move to the designated positions
            node.attr("transform", (d: ViewNode) => {

                if (!d.mn.text || '' == d.mn.text)
                    return "translate(" + (d.x - Frontend.nodeWidth / 2) + "," + (d.y - Frontend.nodeHeight / 2) + ")";
                else
                    return `translate(${d.x},${d.y})`;
            });

            link.attr("transform", (d: ViewLink) => {
                var dx = d.source.x - d.target.x,
                    dy = d.source.y - d.target.y;

                var r = 180 * Math.atan2(dy, dx) / Math.PI;

                return `translate(${d.target.x},${d.target.y}) rotate(${r})`;

            })
                .attr("width", (d: ViewLink) => {
                    var dx = d.source.x - d.target.x,
                        dy = d.source.y - d.target.y;

                    return Math.sqrt(dx * dx + dy * dy);
                });
        });
    }

    // re-populates edgesLayer with links
    updateLinks() {
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
            .attr("fill", (d: ViewLink) => {
                if (d.source.color === this.red && d.target.color === this.red) {
                    // UF never happens?
                    return this.red;
                }

                if (d.source.color !== this.red && d.target.color !== this.red) {
                    // the link between "resolved" nodes
                    return "darkGray";
                }

                return d.source.color === this.red ? "url(#ReverseEdgeGradient)" : "url(#EdgeGradient)";
            });

        return link;
    }

    // re-populate the nodesLayer with nodes
    updateNodes() {
        var node = this.nodesLayer.selectAll(".node")
            .data(this.filteredNodes(), (d: ViewNode) => {
                return d.viewGraphId;
            })

        // erase the nodes which aren't here anymore
        node.exit().remove();

        // remember the last place/time the mouse/touch event has occurred, so we can distinguish between a move and a click/tap
        let mouseDownEvent: MouseEvent;
        let mouseUpEvent: MouseEvent;
        let touchstartEvent: number;
        let doubleTap: boolean;

        // insert the parent group - it  tracks the user interaction
        var nodeEnter = node.enter().append("g")

            .attr("id", (d: ViewNode) => {
                return d.mn.id;
            })
            .attr("class", "node")
            .on("mousedown", () => {
                mouseDownEvent = d3.event as MouseEvent;
                this.nodeMouseDown = true;
            }) // recording the mousedown state allows us to differentiate dragging from panning
            .on("mouseup", () => {
                mouseUpEvent = d3.event as MouseEvent;
                this.nodeMouseDown = false;
            })
            .on("touchstart", () => {
                doubleTap = event.timeStamp - touchstartEvent < 500;
                touchstartEvent = event.timeStamp;
            })
            .on("touchmove", () => {
                event.preventDefault();
            })
            .on("mouseenter", (d: ViewNode) => {
                this.hintNeighbors(d)
            }) // on mouse over nodes we show "spikes" indicating there are hidden neighbors
            .on("mouseleave", (d: ViewNode) => {
                this.unHintNeighbors(d)
            })
            .on("wheel", (d: ViewNode) => {
                // UF: need to send that event to the canvas, but how?!
            })
            .on("touchend", (d: ViewNode) => {
                if (doubleTap) {
                    doubleTap = false;
                    this.dblclick(d);
                }
            })
            .call(this.layout.drag)
            ;

        // the bubble for the word/kanji
        let wordCard = nodeEnter
            .append("g")
            .attr('style', (n: ViewNode) => "fill: " + this.jlpt2color(n.mn.JLPT))
            // create a reference to the <g> id sections defined in the existing svg markup exported from Inkscape
            .append("use")
            // kanjiBG or g12??
            .attr("xlink:href", (n: ViewNode) => n.mn.isKanji ? '#kanjiBG' : '#wc_' + n.mn.text.length)
            ;

        wordCard
            .on("click", (n: ViewNode) => { this.hideNode(n); })
            ;

        // the spikes
        nodeEnter.append("g")
            .attr("id", (n: ViewNode) => n.mn.id + "_spikes")
            .attr("transform", "translate(0,3)")
            ;

        let text = nodeEnter.append("text")
            .attr('class', 'text word')
            .attr('dy', '8px')
            .text((n: ViewNode) => n.mn.text)
            ;

        // the superscript
        text.append("tspan")
            .attr('class', 'ruby')
            .attr('x', '0')
            .attr('y', '-11px')
            .text((n: ViewNode) => n.superscript[0] == "" ? " " : n.mn.superscript)
            ;

        // the subscript
        text.append("tspan")
            .attr('class', 'translation')
            .attr("x", "0")
            .attr("dy", "30px")
            .text((n: ViewNode) => n.mn.subscript)
            ;

        text.on("dblclick", (d: ViewNode) => {
            if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                this.dblclick(d);
            }
        });


        // the tooltip
        nodeEnter.append("title")
            .text((n: ViewNode) => n.mn.hint)
            ;

        node.style("fill", (n: ViewNode) => n.color);

        return node;
    }

    // animates the mouse-over hint
    hintNeighbors(v: ViewNode) {
        if (!v.mn.hood) return;
        var hiddenEdges = v.mn.hood.length + 1 - v.mn.degree;
        var r = 2 * Math.PI / hiddenEdges;
        for (var i = 0; i < hiddenEdges; ++i) {
            var w = Frontend.nodeWidth - 6,
                h = Frontend.nodeHeight - 6,
                x = w / 2 + 25 * Math.cos(r * i),
                y = h / 2 + 30 * Math.sin(r * i);


            let rect = new this.webColaLibrary.Rectangle(0, w, 0, h);
            let vi = rect.rayIntersection(x, y);

            var dataView = d3.select("#" + v.mn.id + "_spikes");

            dataView.append("rect")
                .attr("class", "spike")
                .attr("rx", 1).attr("ry", 1)
                .attr("x", 0).attr("y", 0)
                .attr("width", 10).attr("height", 2)
                .attr("transform", "translate(" + vi.x + "," + vi.y + ") rotate(" + (360 * i / hiddenEdges) + ")")
                .on("dblclick", () => this.dblclick(v));
        }
    }

    // stopping the hint
    unHintNeighbors(v: ViewNode) {
        var dataView = d3.select("#" + v.mn.id + "_spikes");
        dataView.selectAll(".spike").remove();
    }

    hideNode(n: ViewNode) {
        // don't hide kanji
        if (n.mn.isKanji) {
            return;
        }

        n.hidden = true;

        this.update();

        // add the word to the combo, if it's not there yet
        let hiddenWordsCombo: JQuery = $('#hiddenWordsCombo');
        if (0 == hiddenWordsCombo.find('option[value="' + n.id + '"]').length) {
            hiddenWordsCombo.append($('<option>', {
                value: n.id,
                text: n.mn.text
            }));
        }
    }

    findNode(n: KNModel_INode): ViewNode {
        let fen = this.viewGraph.nodes.filter(fen => fen.id === n.id);
        return fen[0];

    }

    // was the viewNode already added?
    inView(v: ViewNode) {

        return typeof v !== 'undefined'
            && typeof v.viewGraphId !== 'undefined';
    }

    collapseNode(node: ViewNode) {

        // for each linked node
        node.mn.hood.forEach(c => {
            // see how many links it has at the moment:
            let neighbor: ViewNode = this.filteredNodes().filter((nn) => nn.id == c.id)[0];
            if (neighbor) {
                let links = this.viewGraph.links.filter((l) => l.source == neighbor || l.target == neighbor);

                if (links.length == 1) {
                    // this node is only connected with one link - hide it
                    this.hideNode(neighbor);
                }
            }
        });

        this.update();
    }

    unCollapseNode(node: KNModel_INode) {

        this.viewGraph.links
            .filter((l) => l.target.mn == node)
            .map((l) => l.source)
            .forEach((n: ViewNode) => this.unHideWord(n.id))
            ;

        this.viewGraph.links
            .filter((l) => l.source.mn == node)
            .map((l) => l.target)
            .forEach((n: ViewNode) => this.unHideWord(n.id))
            ;
    }

    // handle the mouse-dblclick, tap
    dblclick(node: ViewNode) {
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

            $.when(d).then((focus) => { this.refocus(focus) });
        }
    }

    graphBounds() {
        var x = Number.POSITIVE_INFINITY,
            X = Number.NEGATIVE_INFINITY,
            y = Number.POSITIVE_INFINITY,
            Y = Number.NEGATIVE_INFINITY;
        this.nodesLayer.selectAll(".node").each((v: ViewNode) => {
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

        this.viewGraph = {
            nodes: [],
            links: []
        };

        this.update();

        this.modelGraph.reset();
    }

    navigateToWord(word: string) {

        this.updateWordInHistory(word);

        this.main(word);
    }

    calcMySize() {
        // take into account the height of the toolbar
        this.height = $(window).height() - 37;
        // somehow we can't avoid a margin, so make it symmetric at least
        this.width = $(window).width() - 7;
    }

    onWindowResized() {
        this.calcMySize();

        this.outer.attr("width", this.width).attr("height", this.height);
    }

    fullScreenCancel() {
        this.outer.attr("width", this.width).attr("height", this.height);
        this.zoomToFit();
    }

    // setup the translation based on the move/zoom, as it comes from 
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

    zoomToFit() {
        var b = this.graphBounds();
        var w = b.X - b.x,
            h = b.Y - b.y;
        var cw = parseInt(this.outer.attr("width")),
            ch = parseInt(this.outer.attr("height"));
        var s = Math.min(cw / w, ch / h);
        var tx = (-b.x * s + (cw / s - w) * s / 2),
            ty = (-b.y * s + (ch / s - h) * s / 2);
        this.zoom.translate([tx, ty]).scale(s);
        this.redraw(true);
    }

    getParameterByName(name: string, url: string) {
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

        // delete it from the drop-down
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

    unHideWord(word: string) {

        $("#hiddenWordsCombo option[value='" + word + "']").remove();

        this.viewGraph.nodes.filter(n => n.id == word)[0].hidden = false;
        this.update();
    }
}

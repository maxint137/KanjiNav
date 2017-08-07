define(["require", "exports", "d3", "IStorage"], function (require, exports, d3, IStorage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewNodeBase {
        constructor(mn) {
            this.mn = mn;
        }
        get text() { return this.mn.text; }
        get type() { return this.mn.type; }
        get id() { return this.mn.id; }
        get title() { return this.mn.title; }
        get subscript() { return this.mn.subscript; }
        get superscript() { return this.mn.superscript; }
        get hint() { return this.mn.hint; }
        get JLPT() { return this.mn.JLPT; }
        get isKanji() { return this.mn.isKanji; }
        get hood() { return this.mn.hood; }
        get degree() { return this.mn.degree; }
    }
    class ViewNode extends ViewNodeBase {
        constructor(mn) {
            super(mn);
            this.hidden = false;
        }
    }
    class ViewLink {
    }
    class ViewGraph {
    }
    class LocalPersistentStorage {
        serialize(o) {
            console.log(o);
            localStorage.setItem("KanjiNav", o);
        }
        deserialize() {
            const s = localStorage.getItem("KanjiNav");
            return s;
        }
    }
    // tslint:disable-next-line:max-classes-per-file
    class Frontend {
        constructor(modelGraph, webColaLibrary, cookies, ssDB) {
            this.modelGraph = modelGraph;
            this.webColaLibrary = webColaLibrary;
            this.cookies = cookies;
            this.ssDB = ssDB;
            this.storage = new LocalPersistentStorage();
            this.ssDB.deserialize(this.storage);
            this.calcMySize();
            this.red = "rgb(125, 0, 0)";
            this.viewGraph = {
                links: [],
                nodes: [],
            };
            this.viewGraphSaved = {
                links: [],
                nodes: [],
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
        // adds a word to graph
        navigateToWord(word) {
            this.updateWordInHistory(word);
            this.loadWord(word);
        }
        deleteGraph() {
            this.deleteGraphImp(this.currentWord);
        }
        saveGraph() {
            this.saveGraphImp(this.currentWord);
        }
        loadGraph() {
            this.loadGraphImp(this.currentWord);
        }
        clearAll() {
            this.viewGraph = {
                links: [],
                nodes: [],
            };
            this.update();
            this.modelGraph.reset();
        }
        fullScreenCancel() {
            this.outer.attr("width", this.width).attr("height", this.height);
            this.zoomToFit();
        }
        // add layers and zooming to the outer SVG
        setupZooming() {
            // https://github.com/d3/d3-3.x-api-reference/blob/master/Zoom-Behavior.md
            // Construct a new zoom behavior:
            this.zoom = d3.behavior.zoom();
            this.outer.append("rect")
                .attr("class", "background")
                .attr("width", "100%")
                .attr("height", "100%")
                .call(this.zoom.on("zoom", () => this.redraw()))
                .on("dblclick.zoom", () => this.zoomToFit());
            // the layers in play
            this.vis = this.outer.append("g");
            this.edgesLayer = this.vis.append("g");
            this.nodesLayer = this.vis.append("g");
        }
        // define the gradients used down the road: SpikeGradient & (Reverse)EdgeGradient
        defineGradients() {
            const defs = this.outer.append("svg:defs");
            function addGradient(id, color1, opacity1, color2, opacity2) {
                const gradient = defs.append("svg:linearGradient")
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
        saveGraphImp(id) {
            let key;
            const ss = new IStorage_1.Snapshot(id);
            this.viewGraph.nodes.forEach((vn) => {
                ss.nodes.push(new IStorage_1.NodeDescriptor(vn.mn.id, vn.x, vn.y, this.modelGraph.nodes[vn.mn.id]));
            });
            for (key of Object.keys(this.modelGraph.edges)) {
                ss.edges.push(new IStorage_1.EdgeDescriptor(key, this.modelGraph.edges[key]));
            }
            this.ssDB.saveSnapshot(ss);
            this.ssDB.serialize(this.storage);
        }
        loadGraphImp(id) {
            const ss = this.ssDB.loadSnapshot(id);
            // setup the model
            ss.nodes.forEach((n) => { this.modelGraph.nodes[n.name] = n.node; });
            ss.edges.forEach((e) => { this.modelGraph.edges[e.name] = e.edge; });
            // setup the view:
            for (const nodeKey of Object.keys(ss.nodes)) {
                this.addViewNode(ss.nodes[nodeKey].node, { x: ss.nodes[nodeKey].x, y: ss.nodes[nodeKey].y });
            }
            this.refreshViewGraph();
        }
        deleteGraphImp(id) {
            // this.storage.deleteNodesPosition(id);
        }
        // adds the node to the viewGraph, picks the initial position based on the startPos and assigns viewGraphId
        // used to schedule the images rendering
        addViewNode(mn, startPos) {
            const vn = new ViewNode(mn);
            vn.viewGraphId = this.viewGraph.nodes.length;
            if (typeof startPos !== "undefined") {
                vn.x = startPos.x;
                vn.y = startPos.y;
            }
            this.viewGraph.nodes.push(vn);
        }
        // expands the selected node, renders the updated graph
        refocus(node) {
            // find the corresponding view-node:
            // let focus: ViewNode = this.viewGraph.nodes.filter((vn: ViewNode) => vn.id == node.id)[0];
            const focus = this.viewGraph.nodes.filter((vn) => vn.mn.id === node.id)[0];
            const neighborsExpanded = this.modelGraph.expandNeighbors(focus.mn, (mn) => {
                if (!this.inView(this.findNode(mn))) {
                    this.addViewNode(mn, focus);
                }
            });
            // not sure why do we want to have it here in addition to the line just below...
            this.refreshViewGraph();
            $.when(neighborsExpanded).then((hood) => this.addViewLinks(node, hood));
        }
        addViewLinks(node, hood) {
            const u = this.findNode(node);
            if (typeof hood !== "undefined") {
                hood.forEach((h) => {
                    const newLink = { source: u, target: this.findNode(h) };
                    // make sure it is a new one
                    const oldLinks1 = this.viewGraph.links.filter((l) => l.source.id === newLink.source.id && l.target.id === newLink.target.id);
                    const oldLinks2 = this.viewGraph.links.filter((l) => l.target.id === newLink.source.id && l.source.id === newLink.target.id);
                    if (0 === oldLinks1.length && 0 === oldLinks2.length) {
                        this.viewGraph.links.push(newLink);
                    }
                });
            }
            this.refreshViewGraph();
        }
        // sync the viewGraph with the modelGraph
        refreshViewGraph() {
            // set the color of each node in the viewGraph, based on the fully-expanded status
            this.filteredNodes()
                .forEach((v) => {
                v.color = this.modelGraph.isFullyExpanded(v.mn) ? "black" : this.red;
            });
            // this.update();
            // return;
            // drop the links from the viewGraph first
            this.viewGraph.links = [];
            // create a link in the view for each edge in the model
            Object.keys(this.modelGraph.edges).forEach((e) => {
                const l = this.modelGraph.edges[e];
                const u = this.findNode(this.modelGraph.nodes[l.source]);
                const v = this.findNode(this.modelGraph.nodes[l.target]);
                if (this.inView(u) && this.inView(v)) {
                    this.viewGraph.links.push({
                        source: u,
                        target: v,
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
        nodeIsNotFilteredOut(n) {
            return n.isKanji
                || (false === n.hidden && this.isSelectedJlpt(n.mn.JLPT));
        }
        filteredNodes() {
            return this.viewGraph.nodes.filter((n) => this.nodeIsNotFilteredOut(n));
        }
        isSelectedJlpt(level) {
            return "" === this.jlpts || 0 <= this.jlpts.indexOf(level.toString());
        }
        filteredLinks() {
            // only the links which connect to visible nodes
            return this.viewGraph.links.filter((l) => {
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
            const node = this.updateNodes();
            const link = this.updateLinks();
            this.layout.on("tick", () => {
                // setting the transform attribute to the array will result in
                // synchronous calls to the callback provided for each node/link
                // so that these will move to the designated positions
                node.attr("transform", (d) => {
                    if (!d.mn.text || "" === d.mn.text) {
                        return `translate(${d.x - Frontend.nodeWidth / 2}, ${d.y - Frontend.nodeHeight / 2})`;
                    }
                    else {
                        return `translate(${d.x},${d.y})`;
                    }
                });
                link.attr("transform", (d) => {
                    const dx = d.source.x - d.target.x;
                    const dy = d.source.y - d.target.y;
                    const r = 180 * Math.atan2(dy, dx) / Math.PI;
                    return `translate(${d.target.x},${d.target.y}) rotate(${r})`;
                })
                    .attr("width", (d) => {
                    const dx = d.source.x - d.target.x;
                    const dy = d.source.y - d.target.y;
                    return Math.sqrt(dx * dx + dy * dy);
                });
            });
        }
        // re-populates edgesLayer with links
        updateLinks() {
            // use the viewGraph's links to populate the edges-layer with objects based on the data:
            const link = this.edgesLayer.selectAll(".link")
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
            const node = this.nodesLayer.selectAll(".node")
                .data(this.filteredNodes(), (d) => {
                return d.viewGraphId;
            });
            // erase the nodes which aren't here anymore
            node.exit().remove();
            // remember the last place/time the mouse/touch event has occurred,
            // so we can distinguish between a move and a click/tap
            let mouseDownEvent;
            let mouseUpEvent;
            let touchstartEvent;
            let doubleTap;
            // insert the parent group - it  tracks the user interaction
            const nodeEnter = node.enter().append("g")
                .attr("id", (d) => {
                return d.mn.id;
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
                .on("mouseenter", (d) => {
                this.hintNeighbors(d);
            }) // on mouse over nodes we show "spikes" indicating there are hidden neighbors
                .on("mouseleave", (d) => {
                this.unHintNeighbors(d);
            })
                .on("wheel", (d) => {
                // UF: need to send that event to the canvas, but how?!
            })
                .on("touchend", (d) => {
                if (doubleTap) {
                    doubleTap = false;
                    this.dblclick(d);
                }
            })
                .call(this.layout.drag);
            // the bubble for the word/kanji
            const wordCard = nodeEnter
                .append("g")
                .attr("style", (n) => `fill: ${this.jlpt2color(n.mn.JLPT)}`)
                .append("use")
                .attr("xlink:href", (n) => n.isKanji ? "#kanjiBG" : `#wc_${n.mn.text.length}`);
            wordCard
                .on("click", (n) => { this.hideNode(n); });
            // the spikes
            nodeEnter.append("g")
                .attr("id", (n) => `${n.mn.id}_spikes`)
                .attr("transform", "translate(0,3)");
            const text = nodeEnter.append("text")
                .attr("class", "text word")
                .attr("dy", "8px")
                .text((n) => n.mn.text);
            // the superscript
            text.append("tspan")
                .attr("class", "ruby")
                .attr("x", "0")
                .attr("y", "-11px")
                .text((n) => n.superscript[0] === "" ? " " : n.mn.superscript);
            // the subscript
            text.append("tspan")
                .attr("class", "translation")
                .attr("x", "0")
                .attr("dy", "30px")
                .text((n) => n.mn.subscript);
            text.on("dblclick", (d) => {
                if (Math.abs(mouseDownEvent.screenX - mouseUpEvent.screenX) +
                    Math.abs(mouseDownEvent.screenY - mouseUpEvent.screenY) < 2) {
                    this.dblclick(d);
                }
            });
            // the tooltip
            nodeEnter.append("title")
                .text((n) => n.mn.hint);
            node.style("fill", (n) => n.color);
            return node;
        }
        // animates the mouse-over hint
        hintNeighbors(v) {
            if (!v.mn.hood) {
                return;
            }
            const hiddenEdges = v.mn.hood.length + 1 - v.mn.degree;
            const r = 2 * Math.PI / hiddenEdges;
            for (let i = 0; i < hiddenEdges; ++i) {
                const w = Frontend.nodeWidth - 6;
                const h = Frontend.nodeHeight - 6;
                const x = w / 2 + 25 * Math.cos(r * i);
                const y = h / 2 + 30 * Math.sin(r * i);
                const rect = new this.webColaLibrary.Rectangle(0, w, 0, h);
                const vi = rect.rayIntersection(x, y);
                const dataView = d3.select(`#${v.mn.id}_spikes`);
                dataView.append("rect")
                    .attr("class", "spike")
                    .attr("rx", 1).attr("ry", 1)
                    .attr("x", 0).attr("y", 0)
                    .attr("width", 10).attr("height", 2)
                    .attr("transform", `translate(${vi.x},${vi.y}) rotate(${360 * i / hiddenEdges})`)
                    .on("dblclick", () => this.dblclick(v));
            }
        }
        // stopping the hint
        unHintNeighbors(v) {
            const dataView = d3.select(`#${v.mn.id}_spikes`);
            dataView.selectAll(".spike").remove();
        }
        hideNode(n) {
            // don"t hide kanji
            if (n.mn.isKanji) {
                return;
            }
            n.hidden = true;
            this.update();
            // add the word to the combo, if it's not there yet
            const hiddenWordsCombo = $("#hiddenWordsCombo");
            if (0 === hiddenWordsCombo.find(`option[value="${n.id}"]`).length) {
                hiddenWordsCombo.append($("<option>", {
                    text: n.mn.text,
                    value: n.id,
                }));
            }
        }
        findNode(n) {
            return this.viewGraph.nodes.filter((fen) => fen.id === n.id)[0];
        }
        // was the viewNode already added?
        inView(v) {
            return typeof v !== "undefined"
                && typeof v.viewGraphId !== "undefined";
        }
        collapseNode(node) {
            // for each linked node
            node.mn.hood.forEach((c) => {
                // see how many links it has at the moment:
                const neighbor = this.filteredNodes().filter((nn) => nn.id === c.id)[0];
                if (neighbor) {
                    const links = this.viewGraph.links.filter((l) => l.source === neighbor || l.target === neighbor);
                    if (links.length === 1) {
                        // this node is only connected with one link - hide it
                        this.hideNode(neighbor);
                    }
                }
            });
            this.update();
        }
        unCollapseNode(node) {
            this.viewGraph.links
                .filter((l) => l.target.mn === node)
                .map((l) => l.source)
                .forEach((n) => this.unHideWord(n.id));
            this.viewGraph.links
                .filter((l) => l.source.mn === node)
                .map((l) => l.target)
                .forEach((n) => this.unHideWord(n.id));
        }
        // handle the mouse-dblclick, tap
        dblclick(node) {
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
                const d = this.modelGraph.loadNode(node.mn.type, node.mn.text);
                $.when(d).then((focus) => { this.refocus(focus); });
            }
        }
        graphBounds() {
            let x = Number.POSITIVE_INFINITY;
            let X = Number.NEGATIVE_INFINITY;
            let y = Number.POSITIVE_INFINITY;
            let Y = Number.NEGATIVE_INFINITY;
            this.nodesLayer.selectAll(".node").each((v) => {
                x = Math.min(x, v.x - Frontend.nodeWidth / 2);
                X = Math.max(X, v.x + Frontend.nodeWidth / 2);
                y = Math.min(y, v.y - Frontend.nodeHeight / 2);
                Y = Math.max(Y, v.y + Frontend.nodeHeight / 2);
            });
            return {
                X,
                Y,
                x,
                y,
            };
        }
        loadWord(word) {
            // Note: http://piotrwalat.net/arrow-function-expressions-in-typescript/
            // Standard functions will dynamically bind this depending on execution context (just like in JavaScript)
            // Arrow functions on the other hand will preserve this of enclosing context.
            // var d = this.modelGraph.loadNode(word.length == 1
            //  ? NodeType.Char
            //  : NodeType.Word, word, v => this.addViewNode(v));
            const modelNodeLoaded = this.modelGraph.loadNode(word.length === 1 ? "Kanji" : "Word", word);
            $.when(modelNodeLoaded).then((modelNode) => {
                // if this word has a snapshot, load it
                if (!this.canLoadSnapshot(modelNode)) {
                    this.addViewNode(modelNode);
                    this.refocus(modelNode);
                }
                this.currentWord = modelNode.id;
            });
        }
        canLoadSnapshot(modelNode) {
            const ss = this.ssDB.loadSnapshot(modelNode.id);
            if (!ss) {
                return false;
            }
            this.loadGraphImp(modelNode.id);
            return true;
        }
        calcMySize() {
            // take into account the height of the toolbar
            this.height = $(window).height() - 37;
            // somehow we can"t avoid a margin, so make it symmetric at least
            this.width = $(window).width() - 7;
        }
        onWindowResized() {
            this.calcMySize();
            this.outer.attr("width", this.width).attr("height", this.height);
        }
        // setup the translation based on the move/zoom, as it comes from
        redraw(transition) {
            // if mouse down then we are dragging not panning
            if (this.nodeMouseDown) {
                return;
            }
            // read the current zoom translation vector and the current zoom scale
            (transition ? this.vis.transition() : this.vis)
                .attr("transform", `translate(${this.zoom.translate()}) scale(${this.zoom.scale()})`);
        }
        zoomToFit() {
            const b = this.graphBounds();
            const w = b.X - b.x;
            const h = b.Y - b.y;
            const cw = parseInt(this.outer.attr("width"), 10);
            const ch = parseInt(this.outer.attr("height"), 10);
            const s = Math.min(cw / w, ch / h);
            const tx = (-b.x * s + (cw / s - w) * s / 2);
            const ty = (-b.y * s + (ch / s - h) * s / 2);
            this.zoom.translate([tx, ty]).scale(s);
            this.redraw(true);
        }
        getParameterByName(name, url) {
            if (!url) {
                url = window.location.href;
            }
            name = name.replace(/[\[\]]/g, "\\$&");
            const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
            const results = regex.exec(url);
            if (!results) {
                return null;
            }
            if (!results[2]) {
                return "";
            }
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
        storageGet(paramName) {
            if (typeof (Storage) !== "undefined") {
                return localStorage.getItem(paramName);
            }
            else {
                return this.cookies.get(paramName);
            }
        }
        storageSet(paramName, value) {
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
            this.jlpts.split("").forEach((n) => {
                $(`#JLPT${n}`).prop("checked", true);
                $(`#JLPT${n}`).parents("label").addClass("active");
            });
        }
        removeWordFromHistory(selectBoxId, word) {
            // delete it from the drop-down
            $(`#${selectBoxId} option[value="${word}"]`).remove();
            // and the history
            this.updateWordInHistory(word, false);
        }
        loadWordHistory(selectBoxId) {
            const selectBox = $(selectBoxId);
            selectBox
                .find("option")
                .remove()
                .end();
            let oldHistory = this.storageGet(Frontend.wordsHistoryCookieName);
            if (!oldHistory || "" === oldHistory) {
                oldHistory = "楽しい 普通 産業";
            }
            const oldHistoryArray = oldHistory.split(" ");
            oldHistoryArray.forEach((word) => {
                selectBox.append($("<option>", {
                    text: word,
                    value: word,
                }));
            });
        }
        updateWordInHistory(word, add = true) {
            const oldHistory = this.storageGet(Frontend.wordsHistoryCookieName);
            const oldHistoryArray = oldHistory ? oldHistory.split(" ") : [];
            const foundIndex = oldHistoryArray.indexOf(word);
            // to add, and wasn't found?
            if (add && foundIndex < 0) {
                oldHistoryArray.push(word);
            }
            // to delete, and was found?
            if (!add && 0 <= foundIndex) {
                oldHistoryArray.splice(foundIndex, 1);
            }
            this.storageSet(Frontend.wordsHistoryCookieName, oldHistoryArray.join(" "));
        }
        jlptSelect(n) {
            let curSel = this.storageGet(Frontend.jlptSelectedLevelsCookieName);
            curSel = curSel ? curSel : "";
            // we land here before the control has reflected the new status
            const willBecomeChecked = !$(`#JLPT${n}`).is(":checked");
            this.jlpts = curSel.replace(new RegExp(n.toString(), "g"), "") + (willBecomeChecked ? n.toString() : "");
            this.storageSet(Frontend.jlptSelectedLevelsCookieName, this.jlpts);
            this.refreshViewGraph();
        }
        jlpt2color(level) {
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
        unHideWord(word) {
            $(`#hiddenWordsCombo option[value="${word}"]`).remove();
            this.viewGraph.nodes.filter((n) => n.id === word)[0].hidden = false;
            this.update();
        }
    }
    Frontend.jlptSelectedLevelsCookieName = "jlptSelectedLevels";
    Frontend.wordsHistoryCookieName = "wordsHistory";
    // node size
    Frontend.fontSize = 22;
    Frontend.nodeWidth = 30;
    Frontend.nodeHeight = Frontend.fontSize;
    exports.Frontend = Frontend;
});
//# sourceMappingURL=frontend.js.map
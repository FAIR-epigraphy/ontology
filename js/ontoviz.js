/* ============================================================
   ontoviz.js
   Ontology graph visualiser — D3 + N3 (no dynamic loading).

   Depends on (must be loaded BEFORE this file in index.html):
     - d3.min.js
     - n3.min.js
     - bootstrap.bundle.min.js

   Public API (callable after jQuery .load() completes):
     processText(ttlText, name)        — parse raw Turtle text then render
     renderFromStore(store, pfx, name) — render from an already-built N3.Store
   ============================================================ */

'use strict';

/* ── Namespace colour palette ─────────────────────────────── */
var ONTO_PALETTE = [
    '#1a6bbf', '#1a3f6f', '#0891b2', '#7c3aed',
    '#0d6e6e', '#166534', '#b45309', '#9f1239',
    '#1d4ed8', '#6d28d9', '#0f766e', '#a16207'
];

/* ── Well-known namespace → short prefix ─────────────────── */
var ONTO_KNOWN_NS = {
    'http://www.w3.org/2002/07/owl#': 'owl',
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
    'http://www.cidoc-crm.org/cidoc-crm/': 'crm',
    'http://www.cidoc-crm.org/extensions/crmsci/': 'crmsci',
    'http://www.cidoc-crm.org/extensions/crmtex/': 'crmtex',
    'http://iflastandards.info/ns/lrm/lrmoo/': 'lrmoo',
    'http://purl.org/dc/terms/': 'dcterms',
    'http://purl.org/dc/elements/1.1/': 'dc',
    'http://www.w3.org/2004/02/skos/core#': 'skos',
    'http://xmlns.com/foaf/0.1/': 'foaf',
    'http://www.w3.org/ns/prov#': 'prov',
    'http://schema.org/': 'schema'
};

/* ── RDF/OWL predicate URIs ───────────────────────────────── */
var U = {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    first: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
    rest: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
    nil: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil',
    subClassOf: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
    label: 'http://www.w3.org/2000/01/rdf-schema#label',
    domain: 'http://www.w3.org/2000/01/rdf-schema#domain',
    range: 'http://www.w3.org/2000/01/rdf-schema#range',
    Class: 'http://www.w3.org/2002/07/owl#Class',
    rdfsClass: 'http://www.w3.org/2000/01/rdf-schema#Class',
    ObjProp: 'http://www.w3.org/2002/07/owl#ObjectProperty',
    unionOf: 'http://www.w3.org/2002/07/owl#unionOf',
    Thing: 'http://www.w3.org/2002/07/owl#Thing',
    Resource: 'http://www.w3.org/2000/01/rdf-schema#Resource',
    prefLabel: 'http://www.w3.org/2004/02/skos/core#prefLabel',
    altLabel: 'http://www.w3.org/2004/02/skos/core#altLabel',
    definition: 'http://www.w3.org/2004/02/skos/core#definition'
};

/* ── Module-level state ───────────────────────────────────── */
var ontoStore = null;   // N3.Store
var ontoPfx = {};     // parsed prefixes
var ontoNsColorMap = {};     // ns → { color, count }
var ontoNsVis = {};     // ns → boolean
var ontoShowSC = true;
var ontoShowOP = true;
var ontoShowEL = false;
var ontoLocked = false;
var ontoSelectedId = null;
var ontoSim = null;
var ontoCG = null;   // current graph handles
var ontoConnListenerAttached = false;
var ontoCurrentURI = '';

/* ============================================================
   PUBLIC API
   ============================================================ */

/**
 * Entry point 1 — parse raw Turtle/OWL text then render.
 * Call this from your jQuery .load() callback:
 *   await processText(fileText, "My Ontology");
 */
async function processText(ttlText, name) {
    _ontoSetLoading('Parsing Turtle\u2026', 'Building triple store');
    await _ontoRaf();
    try {
        ontoStore = new N3.Store();
        ontoPfx = {};
        await new Promise(function (res, rej) {
            new N3.Parser({ format: 'Turtle' }).parse(ttlText, function (err, quad, pfx) {
                if (err) { rej(err); return; }
                if (quad) { ontoStore.addQuad(quad); }
                else { if (pfx) ontoPfx = pfx; res(); }
            });
        });
        await _ontoBuildAndRender(name);
    } catch (err) {
        _ontoHideLoading();
        _ontoShowError('Parse error: ' + err.message);
        console.error('[ontoviz]', err);
    }
}

/**
 * Entry point 2 — render from an already-built N3.Store.
 * Use this when you have already parsed the TTL in your own code:
 *   await renderFromStore(store, allPrefixes, "My Ontology");
 */
async function renderFromStore(n3Store, prefixes, name) {
    _ontoSetLoading('Reading store\u2026', '');
    await _ontoRaf();
    try {
        ontoStore = n3Store;
        ontoPfx = prefixes || {};
        await _ontoBuildAndRender(name);
    } catch (err) {
        _ontoHideLoading();
        _ontoShowError('Render error: ' + err.message);
        console.error('[ontoviz]', err);
    }
}

/* ============================================================
   SHARED RENDER PIPELINE
   ============================================================ */
async function _ontoBuildAndRender(name) {
    _ontoSetLoading('Extracting ontology\u2026', ontoStore.size + ' triples');
    await _ontoRaf();

    var result = _ontoExtractGraph();
    var nodes = result.nodes;
    var links = result.links;

    if (!nodes.length) {
        _ontoHideLoading();
        _ontoShowError('No OWL/RDFS classes found. Is this a valid ontology?');
        return;
    }

    _ontoSetLoading('Rendering\u2026', nodes.length + ' classes \u00b7 ' + links.length + ' edges');
    await _ontoRaf();

    _ontoRenderGraph(nodes, links);

    /* Show the graph, hide the waiting state */
    if (name) {
        var badge = document.getElementById('brand-badge');
        if (badge) {
            badge.textContent = name.split('/').pop().replace(/\.[^.]+$/, '') || name;
            badge.style.display = '';
        }
    }
    var dz = document.getElementById('dropzone');
    if (dz) dz.classList.add('hidden');

    var graphEl = document.getElementById('graph');
    if (graphEl) graphEl.classList.remove('hidden');

    var zpanel = document.getElementById('zpanel');
    if (zpanel) zpanel.style.display = 'flex';

    var statsEl = document.getElementById('stats');
    if (statsEl) statsEl.style.display = 'flex';

    var hintEl = document.getElementById('hint');
    if (hintEl) hintEl.style.display = 'block';

    _ontoEnableControls();
    _ontoRebuildNsPills();
    _ontoHideLoading();
}

/* ============================================================
   GRAPH EXTRACTION  (pure N3 store.getQuads — no SPARQL)
   ============================================================ */
function _ontoExtractGraph() {
    var classMap = new Map();
    var linkSet = new Set();
    var links = [];

    /* A — all OWL/RDFS classes */
    [U.Class, U.rdfsClass].forEach(function (typeURI) {
        ontoStore.getQuads(null, U.type, typeURI).forEach(function (q) {
            var uri = q.subject.value;
            if (q.subject.termType === 'BlankNode') return;
            if (uri === U.Thing || uri === U.Resource) return;
            if (!classMap.has(uri)) classMap.set(uri, _ontoMakeNode(uri));
        });
    });

    /* B — subClassOf */
    ontoStore.getQuads(null, U.subClassOf, null).forEach(function (q) {
        if (q.subject.termType === 'BlankNode' || q.object.termType === 'BlankNode') return;
        var ch = q.subject.value, pa = q.object.value;
        if (ch === pa || pa === U.Thing || pa === U.Resource) return;
        _ontoEnsureNode(classMap, ch);
        _ontoEnsureNode(classMap, pa);
        var key = 'SC|' + ch + '|' + pa;
        if (!linkSet.has(key)) {
            linkSet.add(key);
            links.push({ source: ch, target: pa, type: 'subclass', label: 'subClassOf' });
        }
    });

    /* C — object properties */
    ontoStore.getQuads(null, U.type, U.ObjProp).forEach(function (q) {
        var prop = q.subject.value;
        var label = _ontoGetBestLabel(prop);
        var doms = _ontoGetDirectOrUnion(prop, U.domain);
        var rngs = _ontoGetDirectOrUnion(prop, U.range);
        if (!doms.length || !rngs.length) return;
        doms.forEach(function (d) {
            rngs.forEach(function (r) {
                if (d === U.Thing || r === U.Thing) return;
                _ontoEnsureNode(classMap, d);
                _ontoEnsureNode(classMap, r);
                var key = 'OP|' + prop + '|' + d + '|' + r;
                if (!linkSet.has(key)) {
                    linkSet.add(key);
                    links.push({ source: d, target: r, type: 'objprop', label: label, propUri: prop });
                }
            });
        });
    });

    var nodes = Array.from(classMap.values());
    _ontoBuildNsColorMap(nodes);
    return { nodes: nodes, links: links };
}

function _ontoGetDirectOrUnion(subj, pred) {
    var result = [];
    ontoStore.getQuads(subj, pred, null).forEach(function (q) {
        if (q.object.termType === 'NamedNode') {
            result.push(q.object.value);
        } else if (q.object.termType === 'BlankNode') {
            var uq = ontoStore.getQuads(q.object.value, U.unionOf, null);
            if (uq.length) _ontoWalkList(uq[0].object.value, result);
        }
    });
    return result;
}

function _ontoWalkList(id, acc) {
    if (!id || id === U.nil) return;
    var fq = ontoStore.getQuads(id, U.first, null);
    if (fq.length && fq[0].object.termType === 'NamedNode') acc.push(fq[0].object.value);
    var rq = ontoStore.getQuads(id, U.rest, null);
    if (rq.length) _ontoWalkList(rq[0].object.value, acc);
}

function _ontoMakeNode(uri) {
    return { id: uri, uri: uri, label: _ontoGetBestLabel(uri), def: _ontoGetDefinition(uri), ns: _ontoDetectNS(uri), deg: 0 };
}

function _ontoEnsureNode(map, uri) {
    if (!map.has(uri) && uri && uri !== U.Thing && uri !== U.Resource) {
        map.set(uri, _ontoMakeNode(uri));
    }
}

function _ontoGetBestLabel(uri) {
    var preds = [U.prefLabel, U.label, U.altLabel];
    for (var i = 0; i < preds.length; i++) {
        var quads = ontoStore.getQuads(uri, preds[i], null);
        var en = quads.find(function (q) { return q.object.language === 'en'; });
        if (en) return en.object.value;
        var any = quads.find(function (q) { return q.object.language === '' || q.object.language === 'en'; });
        if (any) return any.object.value;
        if (quads.length) return quads[0].object.value;
    }
    return _ontoLocalName(uri);
}

function _ontoGetDefinition(uri) {
    var q = ontoStore.getQuads(uri, U.definition, null)
        .find(function (q) { return q.object.language === 'en' || q.object.language === ''; });
    return q ? q.object.value : '';
}

function _ontoDetectNS(uri) {
    var k, ns;
    for (k in ontoPfx) {
        if (k && uri.indexOf(ontoPfx[k]) === 0) return k;
    }
    for (ns in ONTO_KNOWN_NS) {
        if (uri.indexOf(ns) === 0) return ONTO_KNOWN_NS[ns];
    }
    var cut = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/'));
    if (cut > 8) {
        try {
            var host = new URL(uri.substring(0, cut + 1)).hostname;
            var parts = host.split('.');
            return parts.length >= 2 ? parts[parts.length - 2] : host;
        } catch (e) { }
    }
    return 'other';
}

function _ontoLocalName(uri) {
    if (!uri) return '?';
    return uri.substring(Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/')) + 1) || uri;
}

function _ontoBuildNsColorMap(nodes) {
    var cnt = {};
    nodes.forEach(function (n) { cnt[n.ns] = (cnt[n.ns] || 0) + 1; });
    ontoNsColorMap = {};
    Object.entries(cnt)
        .sort(function (a, b) { return b[1] - a[1]; })
        .forEach(function (entry, i) {
            ontoNsColorMap[entry[0]] = { color: ONTO_PALETTE[i % ONTO_PALETTE.length], count: entry[1] };
        });
}

/* ============================================================
   D3 GRAPH RENDER
   ============================================================ */
var ONTO_CHAR_W = 7.3, ONTO_PAD_X = 20, ONTO_NODE_H = 38;

function _ontoRenderGraph(rawNodes, rawLinks) {
    var nodes = rawNodes.map(function (n) { return Object.assign({}, n); });
    var links = rawLinks.map(function (l) { return Object.assign({}, l); });
    var byId = new Map(nodes.map(function (n) { return [n.id, n]; }));

    nodes.forEach(function (n) {
        n.w = Math.max(100, Math.min(220, n.label.length * ONTO_CHAR_W + ONTO_PAD_X * 2));
        n.h = ONTO_NODE_H;
        n.hw = n.w / 2;
        n.hh = n.h / 2;
        n.deg = 0;
    });
    links.forEach(function (l) {
        var s = byId.get(l.source), t = byId.get(l.target);
        if (s) s.deg++;
        if (t) t.deg++;
    });

    /* Curvature for parallel edges */
    var pm = new Map();
    links.forEach(function (l, i) {
        var k = [l.source, l.target].slice().sort().join('||');
        if (!pm.has(k)) pm.set(k, []);
        pm.get(k).push(i);
    });
    links.forEach(function (l, i) {
        var grp = pm.get([l.source, l.target].slice().sort().join('||'));
        l.cv = (grp.indexOf(i) - (grp.length - 1) / 2) * 34;
    });

    var svg = d3.select('#graph');
    var G = d3.select('#gg');
    G.selectAll('*').remove();
    if (ontoSim) ontoSim.stop();
    ontoSelectedId = null;

    var lgG = G.append('g'), lhG = G.append('g');
    var elG = G.append('g'), ngG = G.append('g');

    /* Zoom */
    var zoom = d3.zoom().scaleExtent([0.04, 7])
        .on('zoom', function (e) { G.attr('transform', e.transform); });
    svg.call(zoom);
    svg.on('dblclick.zoom', null); /* prevent D3 dblclick zoom reset */

    /* ── Links ── */
    var lPath = lgG.selectAll('path').data(links).join('path')
        .attr('class', function (d) { return 'link-path ' + d.type; })
        .attr('marker-end', function (d) {
            return 'url(#arr-' + (d.type === 'subclass' ? 'sub' : 'obj') + ')';
        });

    var lHit = lhG.selectAll('path').data(links).join('path')
        .attr('class', 'link-hit')
        .on('mouseenter', _ontoEdgeIn)
        .on('mousemove', _ontoTipMove)
        .on('mouseleave', function (e, d) {
            _ontoHideTip();
            if (!ontoSelectedId) lPath.filter(function (l) { return l === d; }).classed('hl', false);
        });

    var eLbl = elG.selectAll('text').data(links).join('text')
        .attr('class', 'elabel')
        .text(function (d) { return d.label; })
        .style('display', 'none');

    /* ── Nodes ── */
    var didDrag = false;
    var nodeEl = ngG.selectAll('g').data(nodes).join('g')
        .attr('class', 'node-g')
        .call(d3.drag()
            .on('start', function (e, d) {
                didDrag = false;
                d.fx = d.x; d.fy = d.y;
            })
            .on('drag', function (e, d) {
                if (!didDrag) {
                    didDrag = true;
                    if (!e.active) sim.alphaTarget(0.3).restart();
                }
                d.fx = e.x; d.fy = e.y;
            })
            .on('end', function (e, d) {
                if (!e.active) sim.alphaTarget(0);
                if (!didDrag) { d.fx = null; d.fy = null; }
            }))
        .on('click', function (e, d) { _ontoNodeClick(e, d, nodeEl, lPath, links, byId); })
        .on('dblclick', function (e, d) { e.stopPropagation(); d.fx = null; d.fy = null; sim.alphaTarget(0.08).restart(); setTimeout(function () { sim.alphaTarget(0); }, 2000); })
        .on('mouseenter', function (e, d) { _ontoNodeHover(e, d, links); })
        .on('mousemove', _ontoTipMove)
        .on('mouseleave', _ontoHideTip);

    /* Node rect */
    nodeEl.append('rect').attr('class', 'node-rect')
        .attr('rx', 7).attr('ry', 7)
        .attr('width', function (d) { return d.w; })
        .attr('height', function (d) { return d.h; })
        .attr('x', function (d) { return -d.hw; })
        .attr('y', function (d) { return -d.hh; })
        .attr('stroke', function (d) { return (ontoNsColorMap[d.ns] || {}).color || '#888'; });

    /* Coloured top bar */
    nodeEl.append('rect')
        .attr('rx', 7).attr('ry', 7)
        .attr('width', function (d) { return d.w - 2; })
        .attr('height', 11)
        .attr('x', function (d) { return -d.hw + 1; })
        .attr('y', function (d) { return -d.hh + 1; })
        .attr('fill', function (d) { return (ontoNsColorMap[d.ns] || {}).color || '#888'; })
        .style('pointer-events', 'none');

    nodeEl.append('rect')
        .attr('width', function (d) { return d.w - 2; })
        .attr('height', 5)
        .attr('x', function (d) { return -d.hw + 1; })
        .attr('y', function (d) { return -d.hh + 7; })
        .attr('fill', function (d) { return (ontoNsColorMap[d.ns] || {}).color || '#888'; })
        .style('pointer-events', 'none');

    nodeEl.append('text').attr('class', 'node-label').attr('y', 3).text(function (d) { return d.label; });
    nodeEl.append('text').attr('class', 'node-badge').attr('y', function (d) { return d.hh - 6; }).text(function (d) { return d.ns; });

    /* ── Force simulation ── */
    var sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(function (d) { return d.type === 'subclass' ? 140 : 180; }).strength(0.55))
        .force('charge', d3.forceManyBody().strength(-620).distanceMax(650))
        .force('center', d3.forceCenter(0, 0))
        .force('collide', d3.forceCollide().radius(function (d) { return Math.hypot(d.hw, d.hh) + 20; }).strength(0.9))
        .alphaDecay(0.022);

    ontoSim = sim;

    /* ── Geometry helpers ── */
    function rectEdge(cx, cy, hw, hh, ox, oy) {
        var dx = ox - cx, dy = oy - cy;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return [cx, cy];
        var t = Math.min(hw / Math.abs(dx || 0.001), hh / Math.abs(dy || 0.001));
        return [cx + t * dx, cy + t * dy];
    }

    function buildPath(d) {
        var sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
        if (sx == null || tx == null) return '';
        var dx = tx - sx, dy = ty - sy, dist = Math.hypot(dx, dy) || 1;
        var cv = d.cv || 0;
        var px = -dy / dist, py = dx / dist;
        var qx = (sx + tx) / 2 + px * cv, qy = (sy + ty) / 2 + py * cv;
        var p1 = rectEdge(sx, sy, d.source.hw + 2, d.source.hh + 2, qx, qy);
        var p2 = rectEdge(tx, ty, d.target.hw + 2, d.target.hh + 2, qx, qy);
        var adx = p2[0] - qx, ady = p2[1] - qy, ad = Math.hypot(adx, ady) || 1;
        return 'M' + p1[0] + ' ' + p1[1] + ' Q' + qx + ' ' + qy + ' ' + (p2[0] - adx / ad * 10) + ' ' + (p2[1] - ady / ad * 10);
    }

    function midPt(d) {
        if (!d.source.x) return [0, 0];
        var sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
        var dx = tx - sx, dy = ty - sy, dist = Math.hypot(dx, dy) || 1;
        var cv = d.cv || 0;
        var qx = (sx + tx) / 2 + (-dy / dist) * cv, qy = (sy + ty) / 2 + (dx / dist) * cv;
        return [0.25 * sx + 0.5 * qx + 0.25 * tx, 0.25 * sy + 0.5 * qy + 0.25 * ty];
    }

    sim.on('tick', function () {
        lPath.attr('d', buildPath);
        lHit.attr('d', buildPath);
        eLbl.each(function (d) {
            var mp = midPt(d);
            d3.select(this).attr('x', mp[0]).attr('y', mp[1]);
        });
        nodeEl.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
    });

    /* ── Fit view once after initial layout ── */
    var gwEl = document.getElementById('gw');
    sim.on('end.fit', function () {
        sim.on('end.fit', null); /* self-remove — only fires once */
        setTimeout(function () { _ontoFitAll(svg, zoom, nodes, gwEl); }, 80);
    });
    setTimeout(function () { _ontoFitAll(svg, zoom, nodes, gwEl); }, 3500);

    /* ── Canvas click clears selection ── */
    svg.on('click', function () {
        ontoSelectedId = null;
        _ontoClearHL(nodeEl, lPath);
        _ontoClosePanel();
    });

    /* ── Visibility helper (closure over local vars) ── */
    function isLV(l) {
        var s = byId.get(l.source.id || l.source);
        var t = byId.get(l.target.id || l.target);
        if (!s || !t) return false;
        if (!ontoNsVis[s.ns] || !ontoNsVis[t.ns]) return false;
        if (l.type === 'subclass' && !ontoShowSC) return false;
        if (l.type === 'objprop' && !ontoShowOP) return false;
        return true;
    }

    /* Store handles for controls */
    ontoCG = {
        sim: sim, nodeEl: nodeEl, lPath: lPath, lHit: lHit, eLbl: eLbl,
        nodes: nodes, links: links, byId: byId, svg: svg, zoom: zoom, isLV: isLV
    };

    _ontoApplyVisibility();

    /* Initial zoom */
    svg.call(zoom.transform,
        d3.zoomIdentity.translate(gwEl.clientWidth / 2, gwEl.clientHeight / 2).scale(0.48));

    /* Zoom button wiring */
    document.getElementById('zb-in').onclick = function () { svg.transition().duration(280).call(zoom.scaleBy, 1.5); };
    document.getElementById('zb-out').onclick = function () { svg.transition().duration(280).call(zoom.scaleBy, 1 / 1.5); };
    document.getElementById('zb-fit').onclick = function () { _ontoFitAll(svg, zoom, nodes, gwEl); };
}

/* ── Node click ── */
function _ontoNodeClick(e, d, nodeEl, lPath, links, byId) {
    e.stopPropagation();
    if (ontoSelectedId === d.id) {
        ontoSelectedId = null;
        _ontoClearHL(nodeEl, lPath);
        _ontoClosePanel();
        return;
    }
    ontoSelectedId = d.id;
    _ontoHighlightNode(d, nodeEl, lPath, links);
    _ontoShowNodeInfo(d, links, byId);
}

/* ── Highlight helpers ── */
function _ontoHighlightNode(d, nodeEl, lPath, links) {
    var nb = new Set([d.id]);
    var ls = new Set();
    links.forEach(function (l, i) {
        var s = l.source.id || l.source, t = l.target.id || l.target;
        if (s === d.id || t === d.id) { nb.add(s); nb.add(t); ls.add(i); }
    });
    nodeEl.classed('hl', function (n) { return nb.has(n.id); })
        .classed('dm', function (n) { return !nb.has(n.id); });
    lPath.classed('hl', function (l, i) { return ls.has(i); })
        .classed('dm', function (l, i) { return !ls.has(i); })
        .attr('marker-end', function (l, i) {
            var base = l.type === 'subclass' ? 'sub' : 'obj';
            return 'url(#arr-' + base + (ls.has(i) ? '-h' : '') + ')';
        });
}

function _ontoClearHL(nodeEl, lPath) {
    nodeEl.classed('hl dm', false);
    lPath.classed('hl dm', false)
        .attr('marker-end', function (d) {
            return 'url(#arr-' + (d.type === 'subclass' ? 'sub' : 'obj') + ')';
        });
}

/* ── Fit view ── */
function _ontoFitAll(svg, zoom, nodes, gwEl) {
    var W = gwEl.clientWidth, H = gwEl.clientHeight, pad = 80;
    var vn = nodes.filter(function (n) { return ontoNsVis[n.ns] && n.x != null; });
    if (!vn.length) return;
    var xs = vn.map(function (n) { return n.x; });
    var ys = vn.map(function (n) { return n.y; });
    var x0 = Math.min.apply(null, xs) - 80, x1 = Math.max.apply(null, xs) + 80;
    var y0 = Math.min.apply(null, ys) - 50, y1 = Math.max.apply(null, ys) + 50;
    var sc = Math.min(0.9, (W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    svg.transition().duration(660).call(
        zoom.transform,
        d3.zoomIdentity.translate(W / 2 - sc * (x0 + x1) / 2, H / 2 - sc * (y0 + y1) / 2).scale(sc)
    );
}

/* ============================================================
   INFO PANEL
   ============================================================ */
function togglePanel() {
    var panel = document.getElementById('info-panel');
    panel.classList.toggle('collapsed');
}

function _ontoOpenPanel() {
    document.getElementById('info-panel').classList.remove('collapsed');
}

function _ontoClosePanel() {
    document.getElementById('info-panel').classList.add('collapsed');
    document.getElementById('panel-node').style.display = 'none';
    document.getElementById('panel-empty').style.display = 'flex';
}

/* closePanel is called from the HTML close button */
function closePanel() {
    ontoSelectedId = null;
    _ontoClosePanel();
    if (ontoCG) _ontoClearHL(ontoCG.nodeEl, ontoCG.lPath);
}

function copyURI() {
    var btn = document.getElementById('copy-btn');
    function _onCopied() {
        if (!btn) return;
        btn.classList.add('copied');
        btn.title = 'Copied!';
        btn.children[0].classList.replace('bi-copy', 'bi-check')
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.children[0].classList.replace('bi-check', 'bi-copy')
            btn.title = 'Copy URI';
        },
            1800);
    }
    /* Try modern Clipboard API; if it throws (document not focused / no permission)
       fall back to the execCommand approach which works in all contexts. */
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ontoCurrentURI).then(_onCopied).catch(function () {
            _ontoCopyFallback(ontoCurrentURI, _onCopied);
        });
    } else {
        _ontoCopyFallback(ontoCurrentURI, _onCopied);
    }
}

/* Fallback copy: temporary textarea + execCommand.
   Works when the document is not focused, e.g. inside an iframe. */
function _ontoCopyFallback(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); if (cb) cb(); } catch (e) { }
    document.body.removeChild(ta);
}

function _ontoShowNodeInfo(d, links, byId) {
    ontoCurrentURI = d.uri;
    var c = (ontoNsColorMap[d.ns] || {}).color || '#888';

    /* Header */
    document.getElementById('pn-color-bar').style.background = c;
    var badge = document.getElementById('pn-ns-badge');
    badge.textContent = d.ns;
    badge.style.background = c + '1a';
    badge.style.color = c;
    badge.style.border = '1px solid ' + c + '44';
    document.getElementById('pn-title').textContent = d.label;

    /* URI */
    document.getElementById('pn-uri').textContent = d.uri;

    /* Definition */
    var defSec = document.getElementById('pn-def-section');
    var defEl = document.getElementById('pn-def');
    if (d.def) {
        defEl.textContent = d.def;
        defSec.style.display = '';
    } else {
        defSec.style.display = 'none';
    }

    /* Connection counts */
    var outLinks = links.filter(function (l) { return (l.source.id || l.source) === d.id; });
    var incLinks = links.filter(function (l) { return (l.target.id || l.target) === d.id; });
    document.getElementById('pn-total').textContent = outLinks.length + incLinks.length;
    document.getElementById('pn-out').textContent = outLinks.length;
    document.getElementById('pn-in').textContent = incLinks.length;
    document.getElementById('badge-out').textContent = outLinks.length;
    document.getElementById('badge-in').textContent = incLinks.length;

    /* Connection lists */
    function buildList(arr, dir) {
        if (!arr.length) return '<div class="conn-empty">None</div>';
        return arr.map(function (l) {
            var otherId = dir === 'out' ? (l.target.id || l.target) : (l.source.id || l.source);
            var other = byId.get(otherId);
            var oc = ((ontoNsColorMap[(other || {}).ns]) || {}).color || '#888';
            var arrowSvg = dir === 'out'
                ? '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>'
                : '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/>';
            return '<div class="conn-row" data-node-id="' + _ontoEscH(otherId) + '">'
                + '<div class="cr-dir ' + dir + '"><svg viewBox="0 0 24 24">' + arrowSvg + '</svg></div>'
                + '<div class="cr-info">'
                + '<div class="cr-prop">' + _ontoEscH(l.label) + '</div>'
                + '<div class="cr-node">' + _ontoEscH((other || {}).label || otherId) + '</div>'
                + '</div>'
                + '<div class="cr-dot" style="background:' + oc + '"></div>'
                + '</div>';
        }).join('');
    }

    document.getElementById('list-out').innerHTML = buildList(outLinks, 'out');
    document.getElementById('list-in').innerHTML = buildList(incLinks, 'in');

    /* Attach delegation listener once */
    if (!ontoConnListenerAttached) {
        ontoConnListenerAttached = true;
        document.getElementById('panel-body').addEventListener('click', function (e) {
            var row = e.target.closest('.conn-row');
            if (!row) return;
            var uri = row.dataset.nodeId;
            if (!uri || !ontoCG) return;
            var nd = ontoCG.byId.get(uri);
            if (!nd) return;
            ontoSelectedId = uri;
            _ontoHighlightNode(nd, ontoCG.nodeEl, ontoCG.lPath, ontoCG.links);
            _ontoShowNodeInfo(nd, ontoCG.links, ontoCG.byId);
        });
    }

    /* Show panel */
    document.getElementById('panel-empty').style.display = 'none';
    document.getElementById('panel-node').style.display = 'block';
    _ontoOpenPanel();
}

/* ============================================================
   TOOLTIP
   ============================================================ */
function _ontoNodeHover(e, d, links) {
    var c = (ontoNsColorMap[d.ns] || {}).color || '#888';
    var deg = links.filter(function (l) {
        return (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id;
    }).length;
    _ontoShowTip(
        '<div class="ti-head">'
        + '<div class="ti-ns" style="background:' + c + '18;color:' + c + ';border:1px solid ' + c + '44">'
        + '<svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="' + c + '"/></svg>'
        + _ontoEscH(d.ns) + '</div>'
        + '<div class="ti-name">' + _ontoEscH(d.label) + '</div>'
        + '</div>'
        + '<div class="ti-body">' + deg + ' connection' + (deg !== 1 ? 's' : '') + ' \u00b7 click to inspect</div>'
    );
}

function _ontoEdgeIn(e, d) {
    if (!ontoCG) return;
    var sl = d.source.label || (ontoCG.byId.get(d.source) || {}).label || d.source;
    var tl = d.target.label || (ontoCG.byId.get(d.target) || {}).label || d.target;
    var sub = d.type === 'subclass';
    var ec = sub ? '#1a3f6f' : '#1a6bbf';
    _ontoShowTip(
        '<div class="ti-head">'
        + '<div class="ti-elabel">' + _ontoEscH(d.label) + '</div>'
        + '<div class="ti-erel">' + _ontoEscH(sl) + ' \u2192 ' + _ontoEscH(tl) + '</div>'
        + '<div class="ti-etype" style="background:' + ec + '18;color:' + ec + ';border:1px solid ' + ec + '40">'
        + (sub ? 'SubClass' : 'Object Property') + '</div>'
        + '</div>'
    );
    if (ontoCG) ontoCG.lPath.filter(function (l) { return l === d; }).classed('hl', true);
}

var _ontoTipEl = null;
function _ontoGetTip() {
    if (!_ontoTipEl) _ontoTipEl = document.getElementById('tip');
    return _ontoTipEl;
}
function _ontoShowTip(html) {
    var t = _ontoGetTip();
    document.getElementById('ti-inner').innerHTML = html;
    t.classList.add('show');
}
function _ontoHideTip() { _ontoGetTip().classList.remove('show'); }
function _ontoTipMove(e) {
    var t = _ontoGetTip();
    var W = window.innerWidth, H = window.innerHeight;
    var tw = t.offsetWidth || 240, th = t.offsetHeight || 120;
    var l = e.clientX + 16, top = e.clientY - 10;
    if (l + tw + 8 > W) l = e.clientX - tw - 14;
    if (top + th + 8 > H) top = e.clientY - th - 10;
    t.style.left = l + 'px';
    t.style.top = top + 'px';
}

/* ============================================================
   VISIBILITY & STATS
   ============================================================ */
function _ontoApplyVisibility() {
    if (!ontoCG) return;
    ontoCG.nodeEl.style('display', function (d) { return ontoNsVis[d.ns] ? null : 'none'; });
    ontoCG.lPath.style('display', function (d) { return ontoCG.isLV(d) ? null : 'none'; });
    ontoCG.lHit.style('display', function (d) { return ontoCG.isLV(d) ? null : 'none'; });
    ontoCG.eLbl.style('display', function (d) { return (ontoShowEL && ontoCG.isLV(d)) ? null : 'none'; });
    _ontoUpdateStats();
    if (ontoSelectedId) {
        var nd = ontoCG.byId.get(ontoSelectedId);
        if (nd) _ontoHighlightNode(nd, ontoCG.nodeEl, ontoCG.lPath, ontoCG.links);
        else _ontoClearHL(ontoCG.nodeEl, ontoCG.lPath);
    }
}

function _ontoUpdateStats() {
    if (!ontoCG) return;
    var vl = ontoCG.links.filter(function (l) { return ontoCG.isLV(l); });
    document.getElementById('s-cls').textContent = ontoCG.nodes.filter(function (n) { return ontoNsVis[n.ns]; }).length;
    document.getElementById('s-edg').textContent = vl.length;
    document.getElementById('s-sub').textContent = vl.filter(function (l) { return l.type === 'subclass'; }).length;
    document.getElementById('s-obj').textContent = vl.filter(function (l) { return l.type === 'objprop'; }).length;
}

function _ontoRebuildNsPills() {
    var row = document.getElementById('ns-row');
    row.innerHTML = '';
    Object.entries(ontoNsColorMap)
        .sort(function (a, b) { return b[1].count - a[1].count; })
        .forEach(function (entry) {
            var k = entry[0], m = entry[1];
            ontoNsVis[k] = true;
            var el = document.createElement('div');
            el.className = 'nf';
            el.textContent = k + ' (' + m.count + ')';
            el.style.background = m.color + '22';
            el.style.color = m.color;
            el.style.borderColor = m.color + '66';
            el.addEventListener('click', function () {
                ontoNsVis[k] = !ontoNsVis[k];
                el.classList.toggle('off', !ontoNsVis[k]);
                _ontoApplyVisibility();
            });
            row.appendChild(el);
        });
}

function _ontoEnableControls() {
    ['btn-sc', 'btn-op', 'btn-el', 'btn-rl', 'btn-lk', 'search'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.disabled = false;
    });
}

/* ============================================================
   HEADER BUTTON WIRING
   (safe to call multiple times — idempotent via _ontoWired flag)
   ============================================================ */
var _ontoWired = false;
function _ontoWireControls() {
    if (_ontoWired) return;
    _ontoWired = true;

    document.addEventListener('click', function (e) {
        var id = e.target && e.target.id;
        if (id === 'btn-sc') {
            ontoShowSC = !ontoShowSC;
            e.target.classList.toggle('on', ontoShowSC);
            _ontoApplyVisibility();
        } else if (id === 'btn-op') {
            ontoShowOP = !ontoShowOP;
            e.target.classList.toggle('on', ontoShowOP);
            _ontoApplyVisibility();
        } else if (id === 'btn-el') {
            ontoShowEL = !ontoShowEL;
            e.target.classList.toggle('on', ontoShowEL);
            _ontoApplyVisibility();
        } else if (id === 'btn-rl') {
            if (!ontoCG) return;
            ontoCG.nodes.forEach(function (n) { n.fx = null; n.fy = null; });
            ontoCG.sim.alpha(0.8).restart();
            setTimeout(function () { ontoCG.sim.alphaTarget(0); }, 4000);
        } else if (id === 'btn-lk') {
            if (!ontoCG) return;
            ontoLocked = !ontoLocked;
            e.target.classList.toggle('on', ontoLocked);
            e.target.textContent = ontoLocked ? '\u229E Unlock' : '\u229E Lock';
            if (ontoLocked) {
                ontoCG.nodes.forEach(function (n) { n.fx = n.x; n.fy = n.y; });
                ontoCG.sim.stop();
            } else {
                ontoCG.nodes.forEach(function (n) { n.fx = null; n.fy = null; });
                ontoCG.sim.alphaTarget(0.08).restart();
                setTimeout(function () { ontoCG.sim.alphaTarget(0); }, 2000);
            }
        }
    });

    document.addEventListener('input', function (e) {
        if (!e.target || e.target.id !== 'search') return;
        if (!ontoCG) return;
        var q = e.target.value.trim().toLowerCase();
        if (!q) {
            _ontoClearHL(ontoCG.nodeEl, ontoCG.lPath);
            ontoSelectedId = null;
            return;
        }
        var m = new Set(ontoCG.nodes.filter(function (n) {
            return n.label.toLowerCase().indexOf(q) >= 0 ||
                n.id.toLowerCase().indexOf(q) >= 0 ||
                n.ns.toLowerCase().indexOf(q) >= 0;
        }).map(function (n) { return n.id; }));
        ontoCG.nodeEl.classed('hl', function (n) { return m.has(n.id); })
            .classed('dm', function (n) { return !m.has(n.id); });
        ontoCG.lPath.classed('hl', false).classed('dm', true);
    });
}

/* Wire controls as soon as DOM is ready */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ontoWireControls);
} else {
    _ontoWireControls();
}

/* ============================================================
   LOADING / ERROR UI HELPERS
   ============================================================ */
function _ontoSetLoading(msg, sub) {
    var el = document.getElementById('loading');
    if (el) {
        document.getElementById('ld-msg').textContent = msg || 'Loading\u2026';
        document.getElementById('ld-sub').textContent = sub || '';
        el.classList.add('show');
    }
}
function _ontoHideLoading() {
    var el = document.getElementById('loading');
    if (el) el.classList.remove('show');
}
function _ontoShowError(msg) {
    var el = document.getElementById('error-toast');
    if (!el) { console.error('[ontoviz]', msg); return; }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 5000);
}
function _ontoRaf() { return new Promise(function (r) { requestAnimationFrame(r); }); }
function _ontoEscH(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
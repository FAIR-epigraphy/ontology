/////////////////////////////////////////////////////////////
////////////////// RDF
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
var store = new N3.Store();
var allPrefixes = {};
var fileName = "";
var fileText = "";
var voidFileName = "";
var isDataLoaded = false;
var hasTree = false;

/////////////////////////////////////////////////////////////////
// Initialize the treeview
$.fn.extend({
    treed: function (o) {
        // Kept the 'bi' class separate to make toggling cleaner
        var openedClass = 'bi-caret-down-fill';
        var closedClass = 'bi-caret-right-fill';

        if (typeof o != 'undefined') {
            if (typeof o.openedClass != 'undefined') openedClass = o.openedClass;
            if (typeof o.closedClass != 'undefined') closedClass = o.closedClass;
        }

        var tree = $(this);
        tree.addClass("tree");

        // Clean up old events to prevent double-firing if initialized multiple times
        tree.off('click');

        // 1. Initialize DOM structure safely
        tree.find('li').has("ul").each(function () {
            var branch = $(this);
            branch.addClass('branch');

            var button = branch.children('button').first();

            // Check if this is a top-level root node
            var isRoot = branch.parent().is(tree);

            // If it's the root node, leave it OPEN by default
            if (isRoot) {
                if (button.length > 0) {
                    button.prepend(`<i class='indicator bi ${openedClass}'></i>`);
                } else {
                    branch.prepend(`<i class='indicator bi ${openedClass}'></i>`);
                }
                branch.children('ul').show(); // Keep the root expanded
            }
            // If it's a nested node, COLLAPSE it by default
            else {
                if (button.length > 0) {
                    button.prepend(`<i class='indicator bi ${closedClass}'></i>`);
                } else {
                    branch.prepend(`<i class='indicator bi ${closedClass}'></i>`);
                }
                branch.children('ul').hide(); // Collapse the nested lists safely
            }
        });

        // 2. Click event: The Indicator (expands/collapses folder)
        tree.on('click', '.indicator', function (e) {
            e.preventDefault();
            e.stopPropagation(); // Prevents the button highlight event from triggering

            var icon = $(this);
            icon.toggleClass(`${openedClass} ${closedClass}`);

            // Toggle the visibility of the nested list
            icon.closest('li').children('ul').toggle();
        });

        // 3. Click event: The Button (highlights row and fetches data)
        tree.on('click', 'button', function (e) {
            e.preventDefault();
            var button = $(this);
            var parentLi = button.closest('li');

            // Set active highlight state visually
            $('.tree button').removeClass('active');
            button.addClass('active');

            // Trigger your custom RDF detail fetching function
            getVocDetails(parentLi.attr('id'), parentLi.attr('value'));
        });

        hasTree = true;
        return this; // Standard jQuery practice to allow chaining
    }
});
//////////////////////////////////////////////////////////////////////////////

async function callVocabulary(voc) {
    $('#divLanding').hide();
    $('div#divLanding').next().show();
    $('#divVocContent').show();
    $('#divBig').prev().show();
    $('.voc-details').html(`<p class="text-center" style="color: rgb(200 200 200);
                font-size: 30px;
                text-align: center;
                top: 45%;
                height: 1em;
                bottom: 0;
                left: 0;
                right: 0;
                position: absolute;">Please select any type to view detail</p>
                    </div>`);
    $('#divBig').removeClass('col-md-12');
    $('#divBig').addClass('col-md-7');
    $('#root').html(`<ul id="ulClasses">
                                    <div class="text-center" style="text-align: center;
                            top: 45%;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            position: absolute;">
                                        <div class="spinner-border text-primary" style="width: 5rem; height: 5rem;"
                                            role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </ul>`);
    //$('#spVocHeading').text(`${voc.replaceAll('/', '').replaceAll('_', ' ')} Vocabulary`);
    $('#spVocDownload').html(`<span onclick="download('${voc}')" title="Download Vocabulary"
                            class="float-end fs-4 bi bi-download fw-bold" style="cursor: pointer;"></span>`);

    fileName = `../${voc}/data/rdf_data.ttl`;
    voidFileName = `../${voc}/data/VoID.ttl`;


    ////// Load RDF data
    if (fileName !== "")
        await loadData(fileName);
    else {
        isDataLoaded = true;
    }
}

(async () => {
    let isShowIRI = false;
    if (window.location.hash !== '') {
        let voc = '';
        if (window.location.hash.split('#').length === 2) {

            voc = window.location.hash.split('#')[1].replace('#', '');
            fileName = `../${voc}/data/rdf_data.ttl`;
            isShowIRI = true;
        } else {
            $('#root').html(`<ul id="ulClasses">
                <div class="text-center" style="text-align: center;
        top: 45%;
        bottom: 0;
        left: 0;
        right: 0;
        position: absolute;">
                    <div class="spinner-border text-primary" style="width: 5rem; height: 5rem;"
                        role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </ul>`);
            //$('#spVocHeading').text(`${voc.replaceAll('/', '').replaceAll('_', ' ')} Vocabulary`);
            $('#spVocDownload').html(`<span onclick="download('${voc}')" title="Download Vocabulary"
                                    class="float-end fs-4 bi bi-download fw-bold" style="cursor: pointer;"></span>`);

            voc = window.location.hash.replace('#', '');
            fileName = `../${voc}/data/rdf_data.ttl`;
            voidFileName = `../${voc}/data/VoID.ttl`;
            $('div#divLanding').hide();
            $('div#divLanding').next().show();
            $('div#divVocContent').show();
        }
    }
    ////// Load RDF data
    if (fileName !== "") {
        await loadData(fileName);
        if (isShowIRI) {
            $('div#divLanding').hide();
            $('div#divLanding').next().show();
            $('div#divVocContent').show();
            $('div#divBig').prev().show(); // Keep tree visible
            $('div#divBig').removeClass('col-md-12').addClass('col-md-7');

            // Use the new tree expansion logic
            let currentIri = window.location.href.replace('#', '');
            expandAndSelectTreeNode(currentIri);
        }
    }
    else {
        isDataLoaded = true;
    }
})();


/////////////////////////////////////////////////
async function runQuery(query) {
    let myEngine = new Comunica.QueryEngine();
    let result = await myEngine.query(query, {
        sources: [store],
    });
    let bindingsStream = await result.execute();
    const bindings = await bindingsStream.toArray();
    return bindings;
}

/////////////////////////////////////////////////////////////////////////////////
async function loadData(file) {
    $.ajaxSetup({ cache: false });
    store = new N3.Store();
    //$('#tree').treed();
    let rdfData = await fetch(file);
    let data = await rdfData.text();
    fileText = data;
    if (data !== '') {
        const parser_for_graphs = new N3.Parser();
        let records = [];

        parser_for_graphs.parse(data,
            async (error, quad, prefixes) => {
                if (quad) {
                    store.addQuad(
                        quad.subject.id,
                        quad.predicate.id,
                        quad.object.id
                        //namedNode(graph)
                    )
                }
                //    console.log(quad);
                else {
                    allPrefixes = prefixes;
                    isDataLoaded = true;
                    await call();
                }
            });
    }
}

async function call() {
    await updateList();
}


async function getVocDetails(iri, title = '') {
    let appendPrefixes = '';

    for (const [key, value] of Object.entries(allPrefixes)) {
        //console.log(`${key}: ${value}`);
        appendPrefixes += `PREFIX ${key}: <${value}>\n`;
    }
    let query = `
        ${appendPrefixes}
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        SELECT ?pred ?obj 
        WHERE {
            <${iri}> ?pred ?obj .
            FILTER NOT EXISTS {
                <${iri}> a ?obj .
            }
        }`
    let detailsArray = await runQuery(query);
    //debugger;
    if (detailsArray.length === 0) {
        let query = `
        ${appendPrefixes}
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        SELECT ?pred ?obj 
        WHERE {
            <${iri}> ?pred ?obj .
            FILTER NOT EXISTS {
                <${iri}> a ?obj .
            }
        }`
        detailsArray = await runQuery(query);
    }
    ////////////////////////////////////////////
    let parts = iri.split('/');
    let lastEle = parts[parts.length - 1];
    let label = detailsArray.filter(x => x.get('pred').value.includes('prefLabel'));
    let description = detailsArray.filter(x => x.get('pred').value.includes('definition'));

    let detailHTML = `
                    <div class="eyebrow"><i class="bi bi-box me-1"></i>Term</div>
                    <div class="det-title" id="det-label-placeholder">${label.length > 0 ? label[0].get('obj').value : 'No preferred label available.'}</div>
                    <div class="det-iri">
                        <i class="bi bi-link-45deg me-1"></i>
                        <a href="${iri}" target="_blank">${iri} <i class="bi bi-box-arrow-up-right" style="font-size:10px"></i></a>
                    </div>
                    <div class="det-def" bis_skin_checked="1">${description.length > 0 ? `${description[0].get('obj').value.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}` : 'No description available.'}</div>
                    <table class="info-tbl"><tbody>`;

    for (let d of detailsArray) {
        if (!d.get('pred').value.includes('prefLabel') && !d.get('pred').value.includes('definition')) {
            let key, value = '';
            if (d.get('pred').value.split('/').pop().split('#').pop() === 'subClassOf') {
                key = 'Parent';
                parts = d.get('obj').value.split('/');
                lastEle = parts[parts.length - 1];
                value = `<a href="${d.get('obj').value}" target="_blank">${await getResourceLabel(d.get('obj').value)} <i class="bi bi-box-arrow-up-right"></i></a>`;
            }
            else {
                key = d.get('pred').value.split('/').pop().split('#').pop().replace(/([A-Z])/g, ' $1').trim();
                value = d.get('obj').value.includes('http') ? `<a href="${d.get('obj').value}" target="_blank">${d.get('obj').value} <i class="bi bi-box-arrow-up-right"></i></a>` : d.get('obj').id;
            }

            if (value && !value.includes('owl#Thing')) {
                detailHTML += `
                        <tr>
                            <td class="ik" scope="row" style="width: 20%;" class="text-capitalize">
                                ${key}
                            </td>
                            <td class="iv" style="overflow-wrap: break-word;">${value}</td>
                        </tr>
                `;
            }
        }
    }

    detailHTML += ` </tbody>
        </table>`;

    // ── 3. OPTIONAL — Properties where this class is the DOMAIN ─────────────
    //    i.e. "what can I assert about instances of this class?"
    let outPropQuery = `
        ${appendPrefixes}
        SELECT ?prop ?propLabel ?propDef ?range ?rangeLabel
        WHERE {
            ?prop a owl:ObjectProperty .
            ?prop rdfs:domain <${iri}> .
            OPTIONAL { ?prop skos:prefLabel  ?propLabel  . FILTER(LANG(?propLabel)  = 'en') }
            OPTIONAL { ?prop skos:definition ?propDef    . FILTER(LANG(?propDef)    = 'en') }
            OPTIONAL {
                ?prop rdfs:range ?range .
                OPTIONAL { ?range skos:prefLabel ?rangeLabel . FILTER(LANG(?rangeLabel) = 'en') }
            }
        } ORDER BY ?propLabel`;

    let outProps = await runQuery(outPropQuery);

    if (outProps.length > 0) {
        detailHTML += `
            <div class="sec-hd">
                <i class="bi bi-arrow-right-circle me-1"></i>Properties
                <span class="cnt">${outProps.length} propert${outProps.length === 1 ? 'y' : 'ies'}</span>
            </div>`;

        for (let p of outProps) {
            let propIri = p.get('prop').value;
            let propLabel = p.get('propLabel') ? p.get('propLabel').value : propIri.split('/').pop().split('#').pop();
            let propDef = p.get('propDef') ? p.get('propDef').value : '';
            let rangeIri = p.get('range') ? p.get('range').value : '';
            let rangeLabel = p.get('rangeLabel') ? p.get('rangeLabel').value : (rangeIri ? rangeIri.split('/').pop().split('#').pop() : '—');

            let rangeCell = rangeIri
                ? `<a href="${rangeIri}" target="_blank">${rangeLabel} <i class="bi bi-box-arrow-up-right"></i></a>`
                : '—';

            detailHTML += `
                        <div class="prop-card">
                            <div class="pc-head">
                                <span class="pc-name"><i class="bi bi-arrow-right me-1"></i>${propLabel}</span>
                            </div>
                            <div class="pc-body">
                                <div class="row g-2">
                                    ${propIri ? `<div class="col-12 col-sm-6">
                                        <div class="pc-fl"><i class="bi bi-link-45deg me-1"></i>IRI</div>
                                        <div class="pc-fv"><a href="${propIri}" target="_blank">${propIri} <i class="bi bi-box-arrow-up-right"></i></a></div>
                                    </div>` : ''}
                                    ${rangeIri ? `<div class="col-12 col-sm-6">
                                        <div class="pc-fl"><i class="bi bi-arrow-right me-1"></i>Range</div>
                                        <div class="pc-fv">${rangeCell}</div>
                                    </div>` : ''}
                                </div> <!-- close row g-2 -->

                                ${propDef ? `<div class="row mt-2">
                                    <div class="col-12">
                                        <div class="prop-def">
                                            <span class="prop-def-title"><i class="bi bi-card-text me-1"></i> Definition</span>
                                            <span>${propDef}</span>
                                        </div>
                                    </div>
                                </div>` : ''}
                            </div>
                        </div>`;
        }

        detailHTML += `</tbody></table>`;
    }

    // ── 4. OPTIONAL — Properties where this class is the RANGE ──────────────
    //    i.e. "what properties point to this class?"
    let inPropQuery = `
        ${appendPrefixes}
        SELECT ?prop ?propLabel ?domain ?domainLabel
        WHERE {
            ?prop a owl:ObjectProperty .
            ?prop rdfs:range <${iri}> .
            OPTIONAL { ?prop skos:prefLabel ?propLabel   . FILTER(LANG(?propLabel)   = 'en') }
            OPTIONAL {
                ?prop rdfs:domain ?domain .
                OPTIONAL { ?domain skos:prefLabel ?domainLabel . FILTER(LANG(?domainLabel) = 'en') }
            }
        } ORDER BY ?propLabel`;

    let inProps = await runQuery(inPropQuery);

    if (inProps.length > 0) {
        detailHTML += `
            <div class="sec-hd mt-4">
                <i class="bi bi-arrow-left-circle me-1"></i>Incoming Properties
                <span class="cnt">${inProps.length} propert${inProps.length === 1 ? 'y' : 'ies'}</span>
            </div>`;

        for (let p of inProps) {
            let propIri = p.get('prop').value;
            let propLabel = p.get('propLabel') ? p.get('propLabel').value : propIri.split('/').pop().split('#').pop();
            let domainIri = p.get('domain') ? p.get('domain').value : '';
            let domainLabel = p.get('domainLabel') ? p.get('domainLabel').value : (domainIri ? domainIri.split('/').pop().split('#').pop() : '—');

            let domainCell = domainIri
                ? `<a href="${domainIri}" target="_blank">${domainLabel} <i class="bi bi-box-arrow-up-right"></i></a>`
                : '—';

            detailHTML += `
                    <div class="prop-card">
                        <div class="pc-head">
                            <span class="pc-name"><i class="bi bi-arrow-left me-1"></i>${propLabel}</span>
                        </div>
                        <div class="pc-body">
                            <div class="pc-fl"><i class="bi bi-arrow-left me-1"></i>Domain</div>
                            <div class="pc-fv">${domainCell}</div>
                        </div>
                    </div>`;
        }

        detailHTML += `</tbody></table>`;
    }

    $('.voc-details').html(detailHTML);

    if ($('#divBig').css('display') === 'none') {
        $('#btnVocDetails').click()
    } else {
        $('#btnVocDetailsClose').click();
    }
}

//// Filter
$("#myInput").on("input", async function () {
    //debugger;
    var value = $(this).val().toLowerCase();
    $(".tree li").filter(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });

    if (value === '') {
        $('#root i').removeClass('bi bi-caret-right-fill')
        $('#root i').addClass('bi bi-caret-down-fill')
        $('#root li').click();
    }
});

$("#myInputProp").on("input", async function () {
    //debugger;
    var value = $(this).val().toLowerCase();
    $("#treeProp li").filter(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });

    if (value === '') {
        $('#rootProp i').removeClass('bi bi-caret-right-fill')
        $('#rootProp i').addClass('bi bi-caret-down-fill')
        $('#rootProp li').click();
    }
});

async function updateList() {
    let appendPrefixes = '';
    for (const [key, value] of Object.entries(allPrefixes)) {
        //console.log(`${key}: ${value}`);
        appendPrefixes += `PREFIX ${key}: <${value}>\n`;
    }

    let sparql_query = `${appendPrefixes}
                         SELECT DISTINCT ?class ?label ?description
                                WHERE { 
                                    ?class a owl:Class .
                                    ?class skos:prefLabel ?label .
                                    ?class skos:definition ?description .
                                    ?class rdfs:subClassOf owl:Thing .
                            }
                            ORDER BY ?label
                        `;
    //debugger;
    let mainClasses = await runQuery(sparql_query);

    sparql_query = `${appendPrefixes}
                    SELECT DISTINCT ?subject ?label ?description ?supertype
                    WHERE {
                        { ?subject a owl:Class . } UNION { ?individual a ?subject . } .
                        OPTIONAL { 
                                ?subject rdfs:subClassOf ?supertype .
                                FILTER (str(?supertype) !='')
                                } .
                        OPTIONAL { 
                                ?subject skos:prefLabel ?label .
                                FILTER (str(?label) != '')
                                }.
                        OPTIONAL { 
                                ?subject skos:definition ?description .
                                FILTER (str(?description) != '')
                                }.

                    } ORDER BY ?label
    `;

    let allClasses = await runQuery(sparql_query);
    displayMainClasses(mainClasses, allClasses);

    sparql_query = `${appendPrefixes}
                    SELECT DISTINCT ?prop ?label ?description
                                WHERE { 
                                    ?prop a owl:ObjectProperty .
                                    ?prop skos:prefLabel ?label .
                                    ?prop skos:definition ?description .
                                    FILTER NOT EXISTS { 
                                          ?prop rdfs:subPropertyOf ?parent .
                                      }
                            }
                            ORDER BY ?label`;

    let mainProperties = await runQuery(sparql_query);
    sparql_query = `${appendPrefixes}
                    SELECT DISTINCT ?subject ?label ?description ?supertype
                                WHERE { 
                                    ?subject a owl:ObjectProperty .
                                    ?subject skos:prefLabel ?label .
                                    ?subject skos:definition ?description .
                                    ?subject rdfs:subPropertyOf ?supertype .
                            }
                            ORDER BY ?label`;

    let allProperties = await runQuery(sparql_query);
    displayMainProperties(mainProperties, allProperties);
}

async function getAllAlternateLables(iri) {
    let allLables = await runQuery(`
        SELECT ?altLabels 
            WHERE {
                <${iri}> <http://www.w3.org/2004/02/skos/core#altLabel> ?altLabels .
            }
        `);

    let altLabels = '';

    if (allLables.length > 0) {
        // I need to combine this array to single string
        for (let al of allLables) {
            altLabels += al.get('altLabels').value + ', ';
        }
    }
    return altLabels.slice(0, -2);
}

async function getResourceLabel(iri) {
    let label = await runQuery(`
        SELECT ?label
        WHERE {
            <${iri}> <http://www.w3.org/2004/02/skos/core#prefLabel> ?label .
        }
    `);

    if (label.length > 0) {
        return label[0].get('label').value;
    }
    return iri;
}

async function displayMainClasses(classes, allClasses) {

    let divClasses = '<ul id="ulClasses">';
    for (let c of classes) {
        let altLabels = await getAllAlternateLables(c.get('class').value);
        divClasses += await manageParentChildRel(c.get('class').value, c.get('label').value, c.get('description').value, allClasses, altLabels);
    }
    divClasses += '</ul>';

    $('#root').html(divClasses);

    $('li').mouseover(function (e) {
        e.stopPropagation();
        $(this).addClass('currentHover');
    });

    $('li').mouseout(function () {
        $(this).removeClass('currentHover');
    });

    //Initialization of treeviews
    $('#tree').treed();
    $('#root').first().click();
}

async function displayMainProperties(properties, allProps) {

    if (properties.length === 0) {
        $('#nav-properties-tab').hide();
        return;
    }

    $('#nav-properties-tab').show();
    let divProperties = '<ul id="ulClasses">';
    for (let c of properties) {
        let altLabels = await getAllAlternateLables(c.get('prop').value);
        divProperties += await manageParentChildRel(c.get('prop').value, c.get('label').value, c.get('description').value, allProps, altLabels);
    }
    divProperties += '</ul>';

    $('#rootProp').html(divProperties);

    $('li').mouseover(function (e) {
        e.stopPropagation();
        $(this).addClass('currentHover');
    });

    $('li').mouseout(function () {
        $(this).removeClass('currentHover');
    });

    //Initialization of treeviews
    $('#treeProp').treed();
    $('#rootProp').first().click();
}

async function manageParentChildRel(c, label, des, allClasses, altLabels) {
    let list = '';
    let children = allClasses.filter(x => x.get('supertype').value === c)
    list += `<li id="${c}" value="${label}">
                    <button>
                        ${label}
                        <span class="d-none">${des}</span>
                        <span class="d-none">${altLabels.length !== '' ? altLabels : ''}</span>
                    </button>
            `;
    if (children.length > 0) {
        list += `<ul>`
        for (let ch = 0; ch < children.length; ch++) {
            //debugger;
            let altLabels = await getAllAlternateLables(children[ch].get('subject').value);
            list += `<li>${await manageParentChildRel(children[ch].get('subject').value, children[ch].get('label')?.value ?? '', children[ch].get('description')?.value ?? '', allClasses, altLabels)}</li>`;
        }
        list += '</ul>'
    }

    list += '</li>'
    return list;
}

async function getVoc_Ont_Name() {
    let appendPrefixes = '';
    for (const [key, value] of Object.entries(allPrefixes)) {
        //console.log(`${key}: ${value}`);
        appendPrefixes += `PREFIX ${key}: <${value}>\n`;
    }
    let query = `${appendPrefixes}
                         SELECT DISTINCT ?label
                                WHERE { 
                                    ?ontology a owl:Ontology .
                                    ?ontology skos:prefLabel ?label .
                            }`
    result = await runQuery(query);
    if(result){
        let voc_ont_name = result[0].get('label').value;
        return voc_ont_name;
    }
    return '';
}
///////////////////////////////////////////////////////////////
// Menu
// const menuToggle = document.querySelector('.menu-toggle');
// const menuList = document.querySelector('.menu-list');

// document.addEventListener('DOMContentLoaded', function () {
//     menuToggle.addEventListener('click', function () {
//         menuToggle.classList.toggle('active');
//         menuList.classList.toggle('active');
//     });
// });

async function download() {
    $.ajaxSetup({ cache: false });

    const zip = new JSZip();

    try {
        // Wait for both files to load asynchronously
        const file1Content = await (await fetch(fileName)).text();
        const file2Content = await (await fetch(voidFileName)).text();

        // Add files to the ZIP container
        zip.file("Type_of_Inscription.ttl", file1Content);
        zip.file("VoID.ttl", file2Content);

        // Generate the ZIP file as a blob
        const content = await zip.generateAsync({ type: "blob" });

        // Trigger the download
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = "Type_of_Inscription.zip"; // Name of the ZIP file
        a.click();

        // Clean up the URL object
        URL.revokeObjectURL(a.href);

    } catch (error) {
        console.error(error); // Handle any error that might occur during file loading
    }

}

async function expandAndSelectTreeNode(iri, attempts = 0) {
    // 1. Safely find the node. document.getElementById handles complex URL strings perfectly.
    var targetLi = $(document.getElementById(iri));

    // 2. If the node exists, do the expansion!
    if (targetLi.length > 0) {
        // Expand all parent <ul> wrappers
        targetLi.parents('ul').show();

        // Flip all parent folder icons to the 'open' state
        targetLi.parents('li.branch').each(function () {
            var icon = $(this).find('.indicator').first();
            icon.removeClass('bi-caret-right-fill').addClass('bi-caret-down-fill');
        });

        // Highlight the target button
        var targetButton = targetLi.children('button').first();
        if (targetButton.length > 0) {
            $('.tree button').removeClass('active');
            targetButton.addClass('active');
            targetButton.click()

            // Scroll the tree so the item is visible
            var treeContainer = $('#tree').closest('.card-body');
            if (treeContainer.length > 0) {
                treeContainer.animate({
                    scrollTop: targetButton.offset().top - treeContainer.offset().top + treeContainer.scrollTop() - 50
                }, 500);
            }
        }
    }
    // 3. IF NOT FOUND: The DOM is still rendering. Try again!
    else if (attempts < 20) {
        // Wait 100 milliseconds, then run this exact function again.
        // It will try up to 20 times (2 seconds total) before giving up.
        setTimeout(() => {
            expandAndSelectTreeNode(iri, attempts + 1);
        }, 100);
    }
    // 4. FALLBACK: If 2 seconds pass and it STILL isn't there, just load the details
    else {
        console.warn("Tree node not found after rendering: " + iri);
        getVocDetails(iri);
    }
}
/////////////////////////////////////////////////////////////
////////////////// RDF
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
var store = new N3.Store();
var allPrefixes = {};
var fileName = "";
var voidFileName = "";
var isDataLoaded = false;
var hasTree = false;

/////////////////////////////////////////////////////////////////
// Initialize the treeview
$.fn.extend({
    treed: function (o) {

        var openedClass = 'bi bi-caret-down-fill';
        var closedClass = 'bi bi-caret-right-fill';

        if (typeof o != 'undefined') {
            if (typeof o.openedClass != 'undefined') {
                openedClass = o.openedClass;
            }
            if (typeof o.closedClass != 'undefined') {
                closedClass = o.closedClass;
            }
        };

        //initialize each of the top levels
        var tree = $(this);
        tree.children().off();

        //tree.html('')
        tree.addClass("tree");
        tree.find('li').has("ul").each(function () {
            var branch = $(this); //li with children ul
            branch.prepend(`<i class='indicator ${closedClass}'></i>`);
            branch.addClass('branch');
            branch.on('click', function (e) {
                e.preventDefault();
                if (this == e.target) {
                    var icon = $(this).children('i:first');
                    icon.toggleClass(openedClass + " " + closedClass);
                    $(this).children().children().toggle();
                }
            })
            branch.children().children().toggle();
        });
        //fire event from the dynamically added icon
        tree.find('.branch .indicator').each(function () {
            $(this).on('click', function () {
                $(this).closest('li').click();
            });
        });
        //fire event to open branch if the li contains an anchor instead of text
        tree.find('.branch>a').each(function () {
            $(this).on('click', function (e) {
                $(this).closest('li').click();
                e.preventDefault();
            });
        });
        //fire event to open branch if the li contains a button instead of text
        tree.find('.branch>button').each(function () {
            $(this).on('click', function (e) {
                $(this).closest('li').click();
                e.preventDefault();
            });
        });

        tree.find('button').each(function () {
            $(this).on('click', function (e) {
                $('.tree button').removeClass('active')
                $(this).closest('button').addClass('active');
                //console.log($(this).parent().attr('id'))
                getVocDetails($(this).parent().attr('id'))
                e.preventDefault();
            });
        });

        hasTree = true;
    }
});
//////////////////////////////////////////////////////////////////////////////

function callVocabulary(voc) {
    $('#divLanding').hide();
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
    $('#spVocHeading').text(`${voc.replaceAll('/', '').replaceAll('_', ' ')} Vocabulary`);
    $('#spVocDownload').html(`<span onclick="download('${voc}')" title="Download Vocabulary"
                            class="float-end fs-4 bi bi-download fw-bold" style="cursor: pointer;"></span>`);

    fileName = `../${voc}/data/rdf_data.ttl`;
    voidFileName = `../${voc}/data/VoID.ttl`;


    ////// Load RDF data
    if (fileName !== "")
        loadData(fileName);
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
            $('#spVocHeading').text(`${voc.replaceAll('/', '').replaceAll('_', ' ')} Vocabulary`);
            $('#spVocDownload').html(`<span onclick="download('${voc}')" title="Download Vocabulary"
                                    class="float-end fs-4 bi bi-download fw-bold" style="cursor: pointer;"></span>`);

            voc = window.location.hash.replace('#', '');
            fileName = `../${voc}/data/rdf_data.ttl`;
            voidFileName = `../${voc}/data/VoID.ttl`;
            $('div#divLanding').hide();
            $('div#divVocContent').show();
        }
    }
    ////// Load RDF data
    if (fileName !== "") {
        await loadData(fileName);
        if (isShowIRI) {
            getVocDetails(window.location.href.replace('#', ''));
            $('div#divLanding').hide();
            $('div#divVocContent').show();
            $('div#divBig').prev().hide();
            $('div#divBig').removeClass('col-md-7');
            $('div#divBig').addClass('col-md-12');
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


async function getVocDetails(iri) {
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
    let detailHTML = `<h6 class="fw-bold">IRI</h6>
                    <p><a href="${iri}" target="_blank"> ${iri} <i class="bi bi-box-arrow-up-right"></i></a></p>
                    <table class="table table-hover">
                    <tbody>`;
    let label = detailsArray.filter(x => x.get('pred').value.includes('prefLabel'));

    if (label.length > 0) {
        key = label[0].get('pred').value.split('/').pop().split('#').pop().replace(/([A-Z])/g, ' $1').trim();
        value = label[0].get('obj').id;
        detailHTML += `
                        <tr>
                            <th scope="row" style="width: 20%;" class="text-capitalize">${key}</th>
                            <td>${value}</td>
                        </tr>
                    `;
    }

    let description = detailsArray.filter(x => x.get('pred').value.includes('definition'));

    if (description.length > 0) {
        key = description[0].get('pred').value.split('/').pop().split('#').pop().replace(/([A-Z])/g, ' $1').trim();
        value = description[0].get('obj').value;
        detailHTML += `
                        <tr>
                            <th scope="row" style="width: 20%;" class="text-capitalize">${key}</th>
                            <td>${value}</td>
                        </tr>
                    `;
    }

    for (let d of detailsArray) {
        if (!d.get('pred').value.includes('prefLabel') && !d.get('pred').value.includes('definition')) {
            let key, value = '';
            if (d.get('pred').value.split('/').pop().split('#').pop() === 'subClassOf') {
                key = 'Parent';
                parts = d.get('obj').value.split('/');
                lastEle = parts[parts.length - 1];
                value = `<a href="${d.get('obj').value}" target="_blank">${d.get('obj').value.split('/').pop().split('#').pop()} <i class="bi bi-box-arrow-up-right"></i></a>`;
            }
            else {
                key = d.get('pred').value.split('/').pop().split('#').pop().replace(/([A-Z])/g, ' $1').trim();
                value = d.get('obj').value.includes('http') ? `<a href="${d.get('obj').value}" target="_blank">${d.get('obj').value} <i class="bi bi-box-arrow-up-right"></i></a>` : d.get('obj').id;
            }
            detailHTML += `
                        <tr>
                            <th scope="row" style="width: 20%;" class="text-capitalize">
                                ${key}
                            </th>
                            <td style="overflow-wrap: break-word;">${value}</td>
                        </tr>
                `;
        }
    }

    detailHTML += ` </tbody>
        </table>`;

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

async function updateList() {
    let appendPrefixes = '';
    for (const [key, value] of Object.entries(allPrefixes)) {
        //console.log(`${key}: ${value}`);
        appendPrefixes += `PREFIX ${key}: <${value}>\n`;
    }

    let sparql_query = `${appendPrefixes}
                         PREFIX dc: <http://purl.org/dc/elements/1.1/>
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
                    PREFIX dc: <http://purl.org/dc/elements/1.1/>
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

async function manageParentChildRel(c, label, des, allClasses, altLabels) {
    let list = '';
    let children = allClasses.filter(x => x.get('supertype').value === c)
    list += `<li id="${c}">
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
            list += `<li>${await manageParentChildRel(children[ch].get('subject').value, children[ch].get('label').value, children[ch].get('description').value, allClasses, altLabels)}</li>`;
        }
        list += '</ul>'
    }

    list += '</li>'
    return list;
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
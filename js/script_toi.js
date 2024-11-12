
///////////////////////////////////////////////////////////////////////////////////

//console.log($('#divBig').css('display'))

async function call() {
    await updateList();
}
call();

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
        tree.addClass("tree");
        tree.find('li').has("ul").each(function () {
            var branch = $(this); //li with children ul
            branch.prepend(`<i class='indicator ${closedClass}'></i>`);
            branch.addClass('branch');
            branch.on('click', function (e) {
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
    }
});

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
    debugger;
    ////////////////////////////////////////////
    let parts = iri.split('/');
    let lastEle = parts[parts.length - 1];
    let detailHTML = `<h6 class="fw-bold">IRI</h6>
                    <p><a href="${parts.slice(0, -1).join('/') + '/#' + lastEle}" target="_blank"> ${iri} <i class="bi bi-box-arrow-up-right"></i></a></p>
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
                value = `<a href="${parts.slice(0, -1).join('/') + '/#' + lastEle}" target="_blank">${d.get('obj').value.split('/').pop().split('#').pop()} <i class="bi bi-box-arrow-up-right"></i></a>`;
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
    debugger;
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
                                }
                        OPTIONAL { 
                                ?subject skos:definition ?description .
                                FILTER (str(?description) != '')
                                }
                    
                    } ORDER BY ?label
    `;

    let allClasses = await runQuery(sparql_query);
    displayMainClasses(mainClasses, allClasses);
}

function displayMainClasses(classes, allClasses) {
    let divClasses = '';
    for (let c of classes) {
        divClasses += manageParentChildRel(c.get('class').value, c.get('label').value, c.get('description').value, allClasses);
    }
    $('#ulClasses').html(divClasses);

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

function manageParentChildRel(c, label, des, allClasses) {
    let list = '';
    let children = allClasses.filter(x => x.get('supertype').value === c)
    list += `<li id="${c}">
                    <button>
                        ${label}
                        <span class="d-none">${des}</span>
                    </button>
            `;
    if (children.length > 0) {
        list += `<ul>`
        for (let ch of children) {
            list += `<li>${manageParentChildRel(ch.get('subject').value, ch.get('label').value, ch.get('description').value, allClasses)}</li>`;
        }
        list += '</ul>'
    }

    list += '</li>'
    return list;
}

function download() {
    $.ajaxSetup({ cache: false });
    $("#data").load(fileName, function (responseTxt, statusTxt, xhr) {
        if (statusTxt == "success") {

            const contentType = 'text/plain';
            const a = document.createElement('a');
            const file = new Blob([responseTxt], { type: contentType });
            const fName = `Type_of_Inscription.ttl`;

            a.href = URL.createObjectURL(file);
            a.download = fName;
            a.click();

            URL.revokeObjectURL(a.href);
        }
        if (statusTxt == "error")
            console.log("Error: " + xhr.status + ": " + xhr.statusText + ": <br />" + responseTxt);
    });

}
async function getVocDetails() {
    let iri = window.location.href;
    let className = iri.split('#')[1];
    document.getElementById('divVocName').innerHTML = `Detail of ${className}`
    iri = iri.replace('#', '');
    let query = `
    SELECT ?pred ?obj 
    WHERE {
        <${iri}> ?pred ?obj .
        FILTER NOT EXISTS {
            <${iri}> a ?obj .
        }
    }`
    let detailsArray = await runQuery(query);

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
}
getVocDetails();
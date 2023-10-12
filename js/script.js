let bilingualism = `
{
	"Bilingualism": {
		"id": "bilingualism",
        "name": "Bilingualism",
		"authors": [{
			"FullName": "",
			"ORCID": "",
			"WikidataID": ""
		}],
		"contributors": [{
			"FullName": "",
			"ORCID": "",
			"WikidataID": ""
		}],
		"categories": [{
				"id": "biversion",
				"name": "Biversion",
				"description": "Two separate parts in different languages and a content which is usually at least in part common to both",
				"example": "",
				"categories": [{
						"id": "biversion.duplicating",
						"name": "Duplicating",
						"description": "Same content in each version",
						"example": "https://gis.latinnow.eu/object/171846",
						"categories": []
					},
					{
						"id": "biversion.partial",
						"name": "Partial",
						"description": "Versions say partly the same thing, but one says more",
						"example": "https://gis.latinnow.eu/object/207067",
						"categories": []
					},
					{
						"id": "biversion.overlapping",
						"name": "Overlapping",
						"description": "Versions say different things, but part of it is the same in both",
						"example": "https://gis.latinnow.eu/object/190250",
						"categories": []
					},
					{
						"id": "biversion.complementary",
						"name": "Complementary",
						"description": "Versions say different things, but part of the same text ",
						"example": "https://gis.latinnow.eu/object/189168",
						"categories": []
					}
				]
			},
			{
				"id": "bilingual-phenomena",
				"name": "Bilingual Phenomena",
				"description": "Composed in one language but showing bilingual phenomena from another",
				"example": "",
				"categories": [{
						"id": "bilingual-phenomena.code-switching",
						"name": "Code Switching",
						"description": "Full blown switch from one language into another",
						"example": "https://gis.latinnow.eu/object/233183",
						"categories": [{
								"id": "bilingual-phenomena.code-switching.tag-switching",
								"name": "Tag Switching",
								"description": "Switch for e.g. a formula such as VSLM",
								"example": "https://gis.latinnow.eu/object/233167"
							},
							{
								"id": "bilingual-phenomena.code-switching.inter-sentential",
								"name": "inter-sentential",
								"description": "Between sentence/clause boundaries",
								"example": "https://gis.latinnow.eu/object/201464"
							},
							{
								"id": "bilingual-phenomena.code-switching.intra-sentential",
								"name": "Intra Sentential",
								"description": "Within sentence/clause boundaries",
								"example": "https://gis.latinnow.eu/object/212300",
								"categories": [{
										"id": "bilingual-phenomena.code-switching.intra-sentential.lexical",
										"name": "Lexical",
										"description": "",
										"example": ""
									},
									{
										"id": "bilingual-phenomena.code-switching.intra-sentential.syntactic",
										"name": "Syntactic",
										"description": "",
										"example": ""
									},
									{
										"id": "bilingual-phenomena.code-switching.intra-sentential.morphological",
										"name": "Morphological",
										"description": "",
										"example": "e.g. the ‘Greek Latin’ deployed in the res gestae or senatus consulta etc.?"
									},
									{
										"id": "bilingual-phenomena.code-switching.intra-sentential.phonetic",
										"name": "Phonetic",
										"description": "",
										"example": "e.g. Lusitanian word endings in Latin texts"
									}
								]
							}
						]
					},
					{
						"id": "bilingual-phenomena.interference",
						"name": "Interference",
						"description": "Features from another language unintentionally transferred into the main language of the text",
						"example": "",
						"categories": [{
								"id": "bilingual-phenomena.interference.lexical",
								"name": "Lexical",
								"description": "",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.interference.syntactic",
								"name": "Syntactic",
								"description": "",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.interference.morphological",
								"name": "Morphological",
								"description": "",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.interference.phonetic",
								"name": "Phonetic",
								"description": "",
								"example": "",
								"categories": []
							}
						]
					},
					{
						"id": "bilingual-phenomena.borrowing",
						"name": "Borrowing",
						"description": "Adoption of any linguistic element from one language into another. The items function in the adopting language as native elements, often with some degree of integration",
						"example": "https://gis.latinnow.eu/object/190250",
						"categories": [{
								"id": "bilingual-phenomena.borrowing.lexical",
								"name": "Lexical",
								"description": "",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.borrowing.syntactic",
								"name": "Syntactic",
								"description": "",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.borrowing.morphological",
								"name": "Morphological",
								"description": "",
								"example": ""
							},
							{
								"id": "bilingual-phenomena.borrowing.phonetic",
								"name": "Phonetic",
								"description": "",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.borrowing.calque",
								"name": "Calque",
								"description": "Translation of a foreign expression by a new native form which matches the foreign, e.g. sky-scraper, gratte-ciel",
								"example": "",
								"categories": []
							},
							{
								"id": "bilingual-phenomena.borrowing.loan-shifting",
								"name": "Loan Shifting",
								"description": "When a word undergoes semantic extension on the model of a foreign counterpart",
								"example": "",
								"categories": []
							}
						]
					},
					{
						"id": "bilingual-phenomena.translingualism",
						"name": "Translingualism",
						"description": "When forms chosen seem to be expressing more than one language at the same time, e.g. nata. This is a tricky one because sometimes it is simply the case that we cannot work out which language to assign something to, but in some cases it seems there is a desire to use translingualism (e.g. some of the Gaulish-Latin spindle whorls)",
						"example": "",
						"categories": []
					}
				]
			},
			{
				"id": "mixed-language",
				"name": "Mixed Language",
				"description": "In genetically mixed languages or codes that are so mixed that it is impossible to identify the dominant language.",
				"example": "https://gis.latinnow.eu/object/218752",
				"categories": []
			},
			{
				"id": "translingual",
				"name": "Translingual",
				"description": "Different from Text with bilingual phenomena: translingualism, as the whole text would be translingual.",
				"example": "https://gis.latinnow.eu/object/233074",
				"categories": []
			},
			{
				"id": "bigraphic",
				"name": "Bigraphic",
				"description": "Same language but using two script systems",
				"example": "https://gis.latinnow.eu/object/193069",
				"categories": []
			},
			{
				"id": "transliterated",
				"name": "Transliterated",
				"description": "Whole text is in a script which is not the primary one used for that language.",
				"example": "https://gis.latinnow.eu/object/145440",
				"categories": []
			},
			{
				"id": "biscriptal-phenomena",
				"name": "Biscriptal Phenomena",
				"description": "e.g. Velleron stele is Gaulish in Greek script but with valete which is Latin written in Greek script, so that text could be tagged with Text with bilingual phenomena: Code-switching: intra-sentential: lexical AND Text with graphic phenomena: Transliteration",
				"example": "https://gis.latinnow.eu/object/233183",
				"categories": [{
						"id": "biscriptal-phenomena.graphic-interference",
						"name": "Graphic Interference",
						"description": "(‘accidental’) letter forms/orthographic rules from the script with which the author is more familiar intrude into the script of the text.",
						"example": "",
						"categories": []
					},
					{
						"id": "biscriptal-phenomena.transliteration",
						"name": "Transliteration",
						"description": "either by choice or because author doesn’t know the other script of another language being used e.g. for code-switching in the primary",
						"example": "",
						"categories": []
					},
					{
						"id": "biscriptal-phenomena.graphic-borrowing",
						"name": "Graphic Borrowing",
						"description": "when a script form is used from another set used to write a different language, for example to represent a sound in a name, e.g. tau gallicum forms in Gaulish names in Latin texts.",
						"example": "",
						"categories": []
					}
				]
			}
		]
	}
}
`;

function buildTree(node, parentId)
{
    let html = '';
    for (const categoryKey in node) {
        const category = node[categoryKey];
        const categoryId = category.id;
        let example = category.example !== '' ? `<p>Example: <a href="${category.example}" target="_blank"> ${category.example} </a></p>` : '';

        // Create a new list item for this category
        html += `<div id="bilingualism.${category.id}" class="entity">
                      <h4><a href="#bilingualism.${category.id}">${category.name}</a></h4>
                      <p><strong>IRI: </strong><code>https://ontology.inscriptiones.org/bilingualism#bilingualism.${category.id}</code></p>
                      <div class="comment">
                          <p>
                              ${category.description}
                          </p>
                          ${example}
                          
                      </div>
                `;

        // Check if this category has subcategories
        if (category.categories && category.categories.length > 0) {
            html += `<h5 data-bs-target="#coll-${categoryId}" data-bs-toggle="collapse" style=cursor:pointer; aria-expanded="true">
                        <i class="bi bi-chevron-right"></i>
                        <i class="bi bi-chevron-down"></i>
                        Categories
                    </h5>`;
            // Create an ordered list for subcategories
            html += `<div id="coll-${categoryId}" class="collapse show">`;
            html += `<ul class="list-group ms-5">`;
            html += buildTree(category.categories, categoryId); // Recursively build subcategories
            html += `</ul>`;
            html += `</div>`;
        }
        html += `</div>`
    }
    return html;

}

// Toggle tree items when clicked
// function toggleCollapse(eleId)
// {
//     const $ul = $(`#${eleId}`).children('ul');
//     if ($ul.length > 0) {
//         $ul.toggle();
//         $(this).toggleClass('collapsed');
//     }
// }
// $('#tree-container').on('click', function () {
//     const $ul = $(this).children('ul');
//     if ($ul.length > 0) {
//         $ul.toggle();
//         $(this).toggleClass('collapsed');
//     }
// });

// Call the buildTree function with your JSON data
const jsonData = JSON.parse(bilingualism);
const treeHtml = buildTree(jsonData['Bilingualism']['categories'], ''); // Pass an empty parentId for the root level

// Append the generated tree structure to an element with a specific ID (e.g., 'tree-container')
document.getElementById('tree-container').innerHTML = `<ul class="tree">${treeHtml}</ul>`;


// let query = encodeURIComponent(`
// PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
// PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
// PREFIX owl: <http://www.w3.org/2002/07/owl#>
// PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

// SELECT ?child ?parent ?definition ?example
// WHERE {
//    ?child rdfs:subClassOf ?parent ;
//           skos:definition ?definition ;
//     OPTIONAL {
//         ?child skos:example ?example .
//     }
// }
// `);

// let remoteURL = `https://fair.classics.ox.ac.uk/wsgi?method=sparql&repo=bilingualism&query=${query}`
// let url = remoteURL;
// // Send the get request
// axios.get(url).then(response => {
//         //console.log('GET request successful:', response.data);
//         let bindings = response.data.results.bindings;
//         let div = '';
//         let prefix = 'https://ontology.inscriptiones.org/bilingualism#';
//         for(let i = 0; i< bindings.length; i++)
//         {
//           let className = bindings[i].child.value.split(prefix)[1];
//           let classIRI = bindings[i].child.value;
//           let def = bindings[i].definition.value;
//           let parent = bindings[i].parent.value.split(prefix);
//           if(parent.length > 1)
//           {
//             parent = `<a href="#${parent[1]}">bi:${parent[1]}</a>`
//           }
//           else
//           {
//             parent = parent[0];
//           }

//         div += `<a href="#bilingualism.biversion.duplicating">Duplicating</a>`;
//           let example = bindings[i].example !== undefined ? `<p>Example: ${bindings[i].example.value} </p>` : '';
//             div += `
//                       <div id="${className}" class="entity">
//                       <h4>Class: <a href="#${className}">bi:${className}</a></h4>
//                       <p><strong>IRI: </strong><code>${classIRI}</code></p>
//                       <div class="comment">
//                           <p>
//                               ${def}
//                           </p>
//                           ${example}
//                       </div>
//                       <div class="description">
//                           <dl>
//                               <dt>Subclass of</dt>
//                               <dd>${parent}</dd>
//                           </dl>
//                       </div>
//                   </div>
//             `
//         }
//         document.getElementById('classes').innerHTML = div;
//     })
//     .catch(error => {
//         console.error('Error sending POST request:', error);
//     });
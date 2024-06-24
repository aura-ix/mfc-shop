import { merchants } from "./merchants";
import { Terms } from "./scrape";

const categorySortOrder = [
    'Category',
    'Origins',
    'Classifications',
    'Characters',
    'Name',
    'Title',
    'Version',
    'Aliases',
    'Adaptations/Translations',
    'Product Type',
    'Companies',
];

const termStyle = `
.mfc-shop-input-field {
    padding: 0;
    margin: 1em 0;
}
.mfc-shop-translation {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
}
.mfc-shop-translation span::before {
    content: '[';
}
.mfc-shop-translation span::after {
    content: ']';
}
.mfc-shop-translation span:hover {
    text-decoration: underline;
}
.mfc-shop-merchant{
    padding: .2em .8em;
    margin-top: .5em;
    margin-right: .8em;
}
.mfc-shop-merchant div {
    display: flex;
    align-items: center;
}
.mfc-shop-merchant img {
    height: 1.5em;
    margin-right: .5em;
}
.mfc-shop-term-container {
    padding: .5em 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
}
.mfc-shop-no-translation {
    font-style: italic;
}
.mfc-shop-term-container .mfc-shop-term:not(:last-child)::after {
     content: ',';
}
.mfc-shop-help summary {
    font-weight: bold;
}
.mfc-shop-help p {
    margin-top: 1em;
}
`;

const helpParagraphs = [
// TODO: change name here, and provide link
`Shop functionality is provided by the MFC-Shop extension, and is not an
official part of MFC.`,

`This extension is designed to make it easier to search Japanese marketplaces 
for items such as figures and keychains by making it easier to create and edit
Japanese search queries using data from MFC without requiring any knowledge of 
Japanese from the user.`,

`Text may be added to the search query by clicking on terms in the Search Terms
section, which are based on the current page you are viewing on MFC. Terms that
have translations will appear in a normal font, without quotes, while terms that
do not have a translation will be enclosed in quotes and appear in italics.
Terms that have translations will always appear in English, but will insert the
Japanese equivalent into the search query when clicked.`,

`When the Search Query box contains text, a best-effort translation will appear
below it, based on the terms collected from the page. Each term will be enclosed
in brackets, and clicking the bracketed translation will remove it from the
query.`,

`The search query may also be edited directly, in cases where the terms
collected from the page are not sufficient.`,

`Once you are happy with your search query, you can search your marketplace of
choice by clicking on the appropriate button, and a new window will open with
the appropriate search.`,
];

export function addStyles() {
    const termStyleElement = document.createElement('style');
    termStyleElement.innerText = termStyle;
    document.head.appendChild(termStyleElement);
}

function E(tag: string, props: any, children: (string | HTMLElement)[]): HTMLElement {
    const element = document.createElement(tag);
    Object.assign(element, props);
    element.replaceChildren(...children);
    return element;
}

function queryTranslator(termMap: Terms, input: HTMLInputElement, translation: HTMLDivElement) {
    // jp to english translation object
    const dict: Record<string, string> = {};

    for (const terms of Object.values(termMap)) {
        for (const term of terms) {
            if (typeof term === 'string') continue;
            dict[term.jp] = term.en;
        }
    }

    return function updateTranslation() {
        // jp, english pairs
        const termTranslations: [string, string][] = [];

        let query = input.value;
        let unmatched = "";
        while (query.length) {
            let match = "";
            let matchTranslation = "";

            for (const [term, translation] of Object.entries(dict)) {
                if (term.length > match.length && query.startsWith(term)) {
                    match = term;
                    matchTranslation = translation;
                }
            }

            if (match === "") {
                unmatched += query.slice(0, 1);
                query = query.slice(1);
                continue;
            }

            if (unmatched.length != 0) {
                termTranslations.push([unmatched, unmatched]);
                unmatched = "";
            }

            termTranslations.push([match, matchTranslation]);
            query = query.slice(match.length).trim();
        }

        if (unmatched.length != 0) {
            termTranslations.push([unmatched, unmatched]);
            unmatched = "";
        }

        const termElements: HTMLSpanElement[] = [];
        for (let i = 0; i < termTranslations.length; i++) {
            const [_, translation] = termTranslations[i];

            const termElement = E('span', {}, [translation]);
            termElements.push(termElement);

            const skipTermIdx = i;
            termElement.addEventListener('click', () => {
                const query = [];
                
                for (let j = 0; j < termTranslations.length; j++) {
                    if (j === skipTermIdx) continue;
                    query.push(termTranslations[j][0]);
                }

                input.value = query.join(" ");
                updateTranslation();
            });
        }

        translation.replaceChildren(...termElements);
    }
}

function createQuerySection(terms: Terms) {
    const input = E('input', {type: 'text'}, []) as HTMLInputElement;
    const translation = E('div', {className: 'mfc-shop-translation'}, []) as HTMLDivElement;

    const updateTranslation = queryTranslator(terms, input, translation);
    input.addEventListener('input', updateTranslation);

    return {
        tree: [
            E('h3', {}, ['Search Query']),
            E('div', {className: 'form-field bigchar mfc-shop-input-field'}, [
                E('div', {className: 'form-input'}, [
                    input,
                ]),
            ]),
            translation
        ],

        getQuery(): string {
            return input.value;
        },

        addTerm(term: string) {
            let newQuery = input.value;
            newQuery += ' ' + term;
            input.value = newQuery.trim();
            updateTranslation();
        }
    };
}

function createMerchantSection(getQuery: () => string): HTMLElement[] {
    const buttons: HTMLElement[] = [];

    for (const merchant of Object.values(merchants)) {
        const element = E('button', {className: 'mfc-shop-merchant'}, [
            E('div', {}, [
                E('img', {src: merchant.imageURL}, []),
                merchant.displayName
            ]),
        ]);
        buttons.push(element);
        element.addEventListener('click', () => {
            window.open(merchant.queryURL(getQuery()), '_blank');
        });
    }

    return [
        E('h3', {}, ['Search Marketplace']),
        ...buttons,
    ];
}

function createTermSection(termMap: Terms, addTerm: (term: string) => void): HTMLElement[] {
    const categoryElements: HTMLElement[] = [];

    for (const category of categorySortOrder) {
        if (!(category in termMap)) continue;

        const terms = termMap[category];
        const termElements: HTMLElement[] = [];

        for (const term of terms) {
            let label: string;
            let value: string;
            let hasTranslation: boolean;

            if (typeof term == 'string') {
                hasTranslation = false;
                label = `"${term}"`;
                value = term;
            } else {
                hasTranslation = true;
                label = term.en;
                value = term.jp;
            }

            const termElement = E('a', {className: 'mfc-shop-term'}, [label]);
            termElements.push(termElement);
            termElement.addEventListener('click', () => addTerm(value));

            if (!hasTranslation) {
                termElement.classList.add('mfc-shop-no-translation');
            }
        }

        categoryElements.push(E('div', {className: 'mfc-shop-term-container'}, [
            E('strong', {className: 'information'}, [category + " "]),
            ...termElements,
        ]));
    }

    return [
        E('h3', {}, ['Search Terms (click to add to query)']),
        ...categoryElements,
    ];
}

export function addShopSection(termMap: Terms) {
    const querySection = createQuerySection(termMap);
    const merchantSection = createMerchantSection(querySection.getQuery);
    const termSection = createTermSection(termMap, querySection.addTerm);
    const shopSection = E('section', {}, [
        E('h2', {}, ['Shop']),
        E('div', {className: 'object-description'}, [
            ...querySection.tree,
            ...merchantSection,
            ...termSection,
            E('hr', {}, []),
            E('details', {className: 'mfc-shop-help'}, [
                E('summary', {}, ['Information/Help']),
                ...helpParagraphs.map(text => E('p', {}, [text]))
            ]),
        ])
    ]);
    

    const mainDataElement = document.querySelector('section.object');
    if (!mainDataElement) {
        return;
    }
    mainDataElement.insertAdjacentElement('afterend', shopSection);
}
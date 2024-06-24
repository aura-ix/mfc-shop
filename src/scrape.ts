
// TODO: live test cases against MFC
// title: https://myfigurecollection.net/item/1147
// multiple origins: https://myfigurecollection.net/item/1333840
// multiple companies: https://myfigurecollection.net/item/520673
// multiple versions: https://myfigurecollection.net/item/2230836
// aliases: https://myfigurecollection.net/entry/1631
// adaptations/translations: https://myfigurecollection.net/entry/213631

export type ItemText = string | {
    en: string,
    jp: string,
};

// maps from category label to list of terms in that category
export type Terms = Record<string, ItemText[]>;

function createTextScraper() {
    // determine the current language of data fields
    const languageSwitch = document.querySelector<HTMLAnchorElement>('.item-switch-alphabet');
    // if no language switch, default to english
    let isJp = languageSwitch && languageSwitch.innerText !== 'Japanese';

    return function(element: HTMLElement): ItemText | undefined {
        if (!(element instanceof HTMLSpanElement)) {
            const spanElement = element.querySelector('span');
            if (spanElement) element = spanElement;
        }

        const currentText = element.innerText;
        const switchedText = element.getAttribute('switch');

        if (!switchedText) return currentText;

        if (isJp) return {en: switchedText, jp: currentText};
        return {en: currentText, jp: switchedText};
    }
}

function scanRows(): Record<string, HTMLElement> {
    const scannedRows: Record<string, HTMLElement> = {};

    const rows = document.querySelectorAll('.data-field');
    for (const row of rows) {
        const keyElement = row.querySelector<HTMLElement>('.data-label');
        const valElement = row.querySelector<HTMLElement>('.data-value');

        if (!keyElement || !valElement) continue;

        scannedRows[keyElement.innerText] = valElement;
    }

    return scannedRows;
}

function scrapeNameList(nameContainer: HTMLElement): ItemText[] {
    const names: ItemText[] = [];

    for (let i = 0; i < nameContainer.childNodes.length; i++) {
        // we assume that this list is formatted in the following manner
        //   textNode <small>Description</small>
        // with <br> nodes between each alias
        if (nameContainer.childNodes[i].nodeName === 'BR') continue;

        const firstNode = nameContainer.childNodes[i];
        if (firstNode.nodeName === '#text') {
            names.push((firstNode.nodeValue as string).trim());
        } else continue;

        if (i + 1 < nameContainer.childNodes.length) {
            if (nameContainer.childNodes[i+1].nodeName === 'SMALL') i++;
        }
    }

    return names;
}

export function scrapeTerms(): Terms {
    const scrapeText = createTextScraper();
    const rows = scanRows();
    const terms: Terms = {};

    function setCategory(k: string, v: (ItemText | undefined)[]) {
        v = v.filter(x => x !== undefined);
        if (v.length === 0) return;
        terms[k] = v as ItemText[];
    };

    // category requires special handling because it has a span for the icon,
    // which breaks the scraping logic that works for the rest of the fields
    if ('Category' in rows) {
        setCategory('Category', [rows['Category'].innerText]);
    }   

    // handle name/original name on character pages
    const name = rows['Name'];
    const originalName = rows['Original name'];
    if (name && originalName) {
        setCategory('Name', [{en: name.innerText, jp: originalName.innerText}]);
    } else if (name) {
        setCategory('Name', [name.innerText]);
    } else if (originalName) {
        setCategory('Name', [originalName.innerText]);
    }

    const categoryKeys = [
        // first key in array is the canonical name
        ['Origins', 'Origin'],
        ['Characters', 'Character'],
        ['Version'],
        ['Companies', 'Company'],
        ['Classifications', 'Classification'],
        ['Title'],
    ];

    for (const keys of categoryKeys) {
        const canonicalKey = keys[0];
        for (const key of keys) {
            if (!(key in rows)) continue;
            setCategory(canonicalKey, Array.from(rows[key].querySelectorAll<HTMLElement>('a:not(:has(span)), span')).map(scrapeText));
        }
    }

    // handle aliases and adaptations/translations
    const nameListKeys = ['Aliases', 'Adaptations/Translations'];
    for (const nameListKey of nameListKeys) {
        if (!(nameListKey in rows)) continue;
        const list = scrapeNameList(rows[nameListKey]);
        if (list.length > 1) setCategory(nameListKey, list);
    }

    addContextualTerms(terms);

    return terms;
}

function hasTerms(termMap: Terms, category: string, ...matchTerms: string[]): boolean {
    if (!(category in termMap)) return false;

    for (const term of termMap[category]) {
        if (typeof term === 'string') {
            if (matchTerms.includes(term)) return true;
        } else {
            if (matchTerms.includes(term.en) || matchTerms.includes(term.jp)) return true;
        }
    }

    return false;
}

function addContextualTerms(termMap: Terms) {
    // add "figure" if applicable
    if (hasTerms(termMap, 'Category', 'Prepainted', 'Action/Dolls', 'Trading', 'Garage Kits', 'Model Kits')) {
        termMap['Category'].push({en: 'Figure', jp: 'フィギュア'});
    }

    // add keychain related terms
    if (hasTerms(termMap, 'Category', 'Hanged up')) {
        termMap['Category'].push(
            {en: 'Keychain', jp: 'キーチェーン'},
            {en: 'Strap', jp: 'ストラップ'},
        );
    }

    // for character pages, add terms for generic types of items
    if (hasTerms(termMap, 'Category', 'Characters')) {
        termMap['Product Type'] = [
            {en: 'Figure', jp: 'フィギュア'},
            {en: 'Keychain', jp: 'キーチェーン'},
            {en: 'Strap', jp: 'ストラップ'},
        ];
    }
}
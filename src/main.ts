// TODO: set up linter
// TODO: make it only show the shop menu when clicked by default,
// but have an optional mode to insert it by default
import { scrapeTerms } from './scrape.js';
import { addShopSection, addStyles } from './ui.js';

try {
    const terms = scrapeTerms();
    addStyles();
    addShopSection(terms);
} catch (err) {
    console.log('MFC Shop: bailed on adding shop section to page', err);
}

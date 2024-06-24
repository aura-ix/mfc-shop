declare const chrome: any;
declare const browser: any;

function getAssetURL(url: string) {
    switch (import.meta.env.VITE_PLATFORM) {
        case 'chrome':
            return chrome.runtime.getURL(url);
        case 'firefox':
            return browser.runtime.getURL(url);
        case 'userscript':
            // already a data URI
            return url;
    }
}

import neokyoIconPath from './neokyo.png';
export const neokyoIconURL = getAssetURL(neokyoIconPath);
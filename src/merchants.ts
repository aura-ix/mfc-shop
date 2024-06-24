import { neokyoIconURL } from "./assets";

export type MerchantInfo = {
    // name of the merchant to display in the UI
    displayName: string,
    imageURL: string,
    // returns the URL associated with the search for the text `query`
    queryURL(query: string): string
};

// TODO: english queries for merchants
// TODO: ability to swap between english and japanese query modes depending on
// the merchant

export const merchants: Record<string, MerchantInfo> = {};

function addProxyMerchants(proxyId: string, map: (serviceName: string, serviceId: string) => MerchantInfo, newMerchants: Record<string, string>) {
    for (const [serviceId, serviceName] of Object.entries(newMerchants)) {
        merchants[`${proxyId}-${serviceId}`] = map(serviceName, serviceId);
    }
}

function neokyoMerchantA(serviceName: string, serviceId: string): MerchantInfo {
    return {
        displayName: `${serviceName}`,
        imageURL: neokyoIconURL,
        queryURL(query: string) {
            const url = new URL(serviceId, 'https://neokyo.com/en/search/');
            url.searchParams.append('keyword', query);
            return url.toString();
        }
    }
}

addProxyMerchants('neokyo', neokyoMerchantA, {
    rakuma: 'Rakuma',
    mercari: 'Mercari',
    yahoo: 'Yahoo Auction JP',
    surugaya: 'Surugaya',
});

function neokyoMerchantB(serviceName: string, serviceId: string) {
    return {
        displayName: `${serviceName}`,
        imageURL: neokyoIconURL,
        queryURL(query: string) {
            const url = new URL('https://neokyo.com/en/search-results');
            url.searchParams.append('keyword', query);
            url.searchParams.append('provider', serviceId);
            return url.toString();
        }
    }
}

addProxyMerchants('neokyo', neokyoMerchantB, {
    rakuten: 'Rakuten',
    amazonJapan: 'Amazon JP',
    magi: 'Magi',
});
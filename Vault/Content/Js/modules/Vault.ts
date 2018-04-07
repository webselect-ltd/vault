import { Credential, ICryptoProvider } from '../types/all';
import { trim } from './Common';

// A map of the properties which can be searched for using the fieldName:query syntax
// We need this because the search is not case-sensitive, whereas JS properties are!
const queryablePropertyMap: any = {
    description: 'Description',
    username: 'Username',
    password: 'Password',
    url: 'Url',
    filter: 'FILTER'
};

interface ISearchQuery {
    property: string;
    text: string;
}

export class Vault {
    // Bit value below which password is deemed weak
    public readonly weakPasswordThreshold = 40;

    private cryptoProvider: ICryptoProvider;

    constructor(cryptoProvider: ICryptoProvider) {
        this.cryptoProvider = cryptoProvider;
    }

    public isWeakPassword(item: Credential) {
        return item.Password && this.cryptoProvider.getPasswordBits(item.Password) <= this.weakPasswordThreshold;
    }

    public parseSearchQuery(queryText: string): ISearchQuery {
        const parsedQuery: ISearchQuery = {
            property: queryablePropertyMap.description,
            text: null
        };

        const rawQuery = trim(queryText).toLowerCase();

        if (!rawQuery || !rawQuery.length) {
            return parsedQuery;
        }

        if (rawQuery.indexOf(':') === -1) {
            parsedQuery.text = rawQuery;
        } else {
            // Support queries in the form fieldName:query (e.g. username:me@email.com)
            const [property, query] = rawQuery.split(':').map(trim);

            if (property && queryablePropertyMap[property] && query) {
                parsedQuery.property = queryablePropertyMap[property];
                parsedQuery.text = query;
            }
        }

        return parsedQuery;
    }

    public search(query: string, list: Credential[]): Credential[] {
        const q = this.parseSearchQuery(query);

        if (!q.text) {
            return [];
        }

        if (q.property === 'FILTER') {
            switch (q.text) {
                case 'all':
                    return list;
                case 'weak':
                    return list.filter(i => this.isWeakPassword(i));
                default:
                    return [];
            }
        }

        return list.filter(item => item[q.property].toLowerCase().indexOf(q.text) > -1);
    }
}

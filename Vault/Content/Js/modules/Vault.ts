import { Credential, ICredentialSearchQuery, ICredentialSummary, ICryptoProvider } from '../types/all';
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

// Bit value below which password is deemed weak
export const weakPasswordThreshold = 40;

export function parseSearchQuery(queryText: string): ICredentialSearchQuery {
    const parsedQuery: ICredentialSearchQuery = {
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

export function searchCredentials(query: ICredentialSearchQuery, isWeakPassword: (c: Credential) => boolean, list: Credential[]): Credential[] {
    if (!query || !query.property || !query.text) {
        return [];
    }

    if (query.property === 'FILTER') {
        switch (query.text) {
            case 'all':
                return list;
            case 'weak':
                return list.filter(isWeakPassword);
            default:
                return [];
        }
    }

    return list.filter(item => item[query.property].toLowerCase().indexOf(query.text) > -1);
}

export function mapToSummary(masterKey: string, userId: string, isWeakPassword: (c: Credential) => boolean, credential: Credential): ICredentialSummary {
    return {
        credentialid: credential.CredentialID,
        masterkey: masterKey,
        userid: userId,
        description: credential.Description,
        username: credential.Username,
        password: credential.Password,
        url: credential.Url,
        weak: isWeakPassword(credential)
    };
}

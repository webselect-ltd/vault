import { Credential } from '../types/all';

// A map of the properties which can be searched for using the fieldName:query syntax
// We need this because the search is not case-sensitive, whereas JS properties are!
const queryablePropertyMap: any = {
    description: 'Description',
    username: 'Username',
    password: 'Password',
    url: 'Url',
    filter: 'FILTER'
};

export function search(query: string, list: Credential[], isWeakPassword: (item: Credential) => boolean): Credential[] {
    let results: Credential[] = [];
    let queryField: string;
    let queryData: string[];
    // Tidy up the query text
    query = $.trim(query).toLowerCase();
    if (query !== null && query !== '' && query.length > 1) {
        queryField = queryablePropertyMap.description;
        // Support queries in the form fieldName:query (e.g. username:me@email.com)
        if (query.indexOf(':') !== -1) {
            queryData = query.split(':');
            // Safeguard against spaces either side of colon, query part not
            // having been typed yet and searches on a non-existent property
            if (queryData.length === 2 && queryData[0] !== '' && queryData[1] !== '') {
                // If the fieldName part exists in the property map
                if (queryablePropertyMap[queryData[0]]) {
                    queryField = queryablePropertyMap[queryData[0]];
                    query = queryData[1];
                }
            }
        }
        if (queryField === 'FILTER') {
            if (query === 'all') {
                results = list;
            } else if (query === 'weak') {
                results = list.filter(isWeakPassword);
            }
        } else {
            results = list.filter((item: Credential): boolean => {
                return item[queryField].toLowerCase().indexOf(query) > -1;
            });
        }
    }
    return results;
}

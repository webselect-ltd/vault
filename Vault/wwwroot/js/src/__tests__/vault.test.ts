import 'fast-text-encoding';
import {
    getPasswordSpecificationFromPassword,
    parsePasswordSpecificationString,
    parseSearchQuery,
    searchCredentials,
    sortCredentialSummaries
} from '../modules/all';
import { ICredential, ICredentialSummary, ITag, ITagIndex, PasswordSpecification } from '../types/all';
import { FakeRepository } from '../types/FakeRepository';

const testCredentialPlainText: ICredential = {
    credentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
    userID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    description: 'Test Credential',
    username: '_testuser123',
    password: '8{s?(\'7.171h)3H',
    url: 'http://www.test.com?id=23&param=TEST+VALUE',
    userDefined1Label: 'Custom 1',
    userDefined1: 'CUSTOM1',
    userDefined2Label: 'Custom 2',
    userDefined2: 'CUSTOM2',
    notes: 'Test Notes:\n\nThese are test notes.',
    pwdOptions: '16|1|1|1|1',
    tagIDs: 'a|b|c'
};

async function getTestCredentials(): Promise<ICredentialSummary[]> {
    return new FakeRepository().loadCredentialSummaryList();
}

async function getTestTagIndex() {
    return await new FakeRepository().loadTagIndex();
}

const nw = (password: string) => false;

describe('Vault', () => {

    test('parseSearchQuery', () => {
        const parsed = parseSearchQuery(' EmAil ');

        expect(parsed.property).toBe('description');
        expect(parsed.text).toBe('email');
    });

    test('parseSearchQuery bad queries', () => {
        expect(parseSearchQuery(null).text).toBe(null);
        expect(parseSearchQuery('').text).toBe(null);
        expect(parseSearchQuery('INVALID:description').text).toBe(null);
    });

    test('parseSearchQuery specific field', () => {
        const parsed = parseSearchQuery(' useRName : BoB ');

        expect(parsed.property).toBe('username');
        expect(parsed.text).toBe('bob');
    });

    test('parseSearchQuery show weak', () => {
        const parsed = parseSearchQuery(' filtER : WeAk ');

        expect(parsed.property).toBe('FILTER');
        expect(parsed.text).toBe('weak');
    });

    test('parseSearchQuery show all', () => {
        const parsed = parseSearchQuery(' Filter: aLl ');

        expect(parsed.property).toBe('FILTER');
        expect(parsed.text).toBe('all');
    });

    test('searchCredentials bad queries', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();

        const noresults1 = searchCredentials(null, testTagIndex, [], nw, testCredentials);
        const noresults2 = searchCredentials({ property: null, text: 'ABC' }, testTagIndex, [], nw, testCredentials);
        const noresults3 = searchCredentials({ property: 'description', text: null }, testTagIndex, [], nw, testCredentials);
        const noresults4 = searchCredentials({ property: 'description', text: 'Z' }, testTagIndex, [], nw, testCredentials);
        const noresults5 = searchCredentials({ property: 'FILTER', text: 'ABC' }, testTagIndex, [], nw, testCredentials);

        expect(noresults1.length).toBe(0);
        expect(noresults2.length).toBe(0);
        expect(noresults3.length).toBe(0);
        expect(noresults4.length).toBe(0);
        expect(noresults5.length).toBe(0);
    });

    test('searchCredentials standard query', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();
        const results = searchCredentials({ property: 'description', text: 'do' }, testTagIndex, [], nw, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].description).toBe('Dog');
        expect(results[1].description).toBe('Dogfish');
    });

    test('searchCredentials username query', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();
        const results = searchCredentials({ property: 'username', text: 'dog' }, testTagIndex, [], nw, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].description).toBe('Dog');
        expect(results[1].description).toBe('Dogfish');
    });

    test('searchCredentials password query', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();
        const results = searchCredentials({ property: 'password', text: 'cat' }, testTagIndex, [], nw, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].description).toBe('Cat');
        expect(results[1].description).toBe('Catfish');
    });

    test('searchCredentials all query', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();
        const results = searchCredentials({ property: 'FILTER', text: 'all' }, testTagIndex, [], nw, testCredentials);
        expect(results.length).toBe(6);
        expect(results[0].description).toBe('Cat');
        expect(results[5].description).toBe('Owl');
    });

    test('searchCredentials weak password query', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();
        testCredentials.push({
            credentialID: 'TEST',
            description: 'NOPASSWORD',
            url: null,
            username: null,
            password: null,
            weak: false
        });
        const isWeakPwd = (password: string) => !password || password.length < 7;
        const results = searchCredentials({ property: 'FILTER', text: 'weak' }, testTagIndex, [], isWeakPwd, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].description).toBe('Cat');
        expect(results[1].description).toBe('Dog');
    });

    test('searchCredentials tag query', async () => {
        const testCredentials = await getTestCredentials();
        const testTagIndex = await getTestTagIndex();
        const results = searchCredentials({ property: 'description', text: '' }, testTagIndex, ['cat', 'fish'], nw, testCredentials);
        expect(results.length).toBe(1);
        expect(results[0].description).toBe('Catfish');
    });

    test('parsePasswordSpecificationString bad inputs', () => {
        expect(parsePasswordSpecificationString(null)).toBeNull();
        expect(parsePasswordSpecificationString('')).toBeNull();
        expect(parsePasswordSpecificationString('1|2|3')).toBeNull();
    });

    test('parsePasswordSpecificationString valid inputs', () => {
        const spec1 = new PasswordSpecification(16, true, true, true, true);
        const spec2 = new PasswordSpecification(32, false, true, false, true);
        const spec3 = new PasswordSpecification(64, true, false, true, false);

        expect(parsePasswordSpecificationString('16|1|1|1|1')).toEqual(spec1);
        expect(parsePasswordSpecificationString('32|0|1|0|1')).toEqual(spec2);
        expect(parsePasswordSpecificationString('64|1|0|1|0')).toEqual(spec3);
    });

    test('getPasswordSpecificationFromPassword bad inputs', () => {
        expect(getPasswordSpecificationFromPassword(null)).toBeNull();
        expect(getPasswordSpecificationFromPassword('')).toBeNull();
    });

    test('getPasswordSpecificationFromPassword valid inputs', () => {
        const spec1 = new PasswordSpecification(8, true, false, true, false);
        const spec2 = new PasswordSpecification(10, true, true, true, true);
        const spec3 = new PasswordSpecification(12, false, false, true, false);
        const spec4 = new PasswordSpecification(14, false, true, false, true);

        expect(getPasswordSpecificationFromPassword('abcd1234')).toEqual(spec1);
        expect(getPasswordSpecificationFromPassword('!aBcd1234^')).toEqual(spec2);
        expect(getPasswordSpecificationFromPassword('123456789012')).toEqual(spec3);
        expect(getPasswordSpecificationFromPassword('ABCD*EFG?H&JK-')).toEqual(spec4);
    });

    test('sortCredentialSummaries', async () => {
        const testCredentials = await getTestCredentials();
        testCredentials.push({
            credentialID: 'TEST',
            description: 'Fish',
            url: null,
            username: null,
            password: null,
            weak: false
        });
        const sortedCredentials = sortCredentialSummaries(testCredentials);
        expect(sortedCredentials.length).toBe(7);
        expect(sortedCredentials[0].description).toBe('Cat');
        expect(sortedCredentials[1].description).toBe('Catfish');
        expect(sortedCredentials[2].description).toBe('Dog');
        expect(sortedCredentials[3].description).toBe('Dogfish');
        expect(sortedCredentials[4].description).toBe('Fish');
        expect(sortedCredentials[5].description).toBe('Fish');
        expect(sortedCredentials[6].description).toBe('Owl');
    });

});

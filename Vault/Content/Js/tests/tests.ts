import { assert } from 'chai';
import { beforeEach, suite, test } from 'mocha';
import { mapToSummary, parseSearchQuery, rateLimit, searchCredentials, truncate, weakPasswordThreshold } from '../modules/all';
import { Credential, CryptoProvider, ICredentialSummary, IPasswordSpecification, IRepository, Repository } from '../types/all';
import { FakeRepository } from './FakeRepository';

const testCredentialPlainText = new Credential(
    '361fe91a-3dca-4871-b69e-c41c31507c8c',
    'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    'Test Credential',
    '_testuser123',
    '8{s?(\'7.171h)3H',
    'http://www.test.com?id=23&param=TEST+VALUE',
    'Custom 1',
    'CUSTOM1',
    'Custom 2',
    'CUSTOM2',
    'Test Notes:\n\nThese are test notes.',
    '16|1|1|1|1'
);

const testCredentialEncrypted = new Credential(
    '361fe91a-3dca-4871-b69e-c41c31507c8c',
    'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    'EcOPw4TDj0gBITAhITAhLSExMCFQITEwIWJHQcK9wpJtXHQgRMKtaw==',
    'EsOPw4TDj0gBITAhITAhLcKHw7LChcOKwpUHbsOIw60iYXs=',
    'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
    'E8OPw4TDj0gBITAhITAhLRnDh8KUG8O5dlVZZ8OBwrwgO8KQNDctecKbM8KGworDmzoUbsOrSEnCrMKSDyMtNkhZw6/Cgyp5ZSExMiEG',
    'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmM=',
    'FMOPw4TDj0gBITAhITAhLW88TTrDrEXDvw==',
    'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmA=',
    'FcOPw4TDj0gBITAhITAhLcOeJDjCncKcw47DqA==',
    'FcOPw4TDj0gBITAhITAhLcOJFBjCvcOzw43CtVxmwoJzw4pAw63CpcKRLSkDwpg5LiE0NSHCmwNTajjCmVbCtMKAwq0tw43CvQ==',
    '16|1|1|1|1'
);

function checkEncryption(credential: Credential, masterKeyPlainText: string) {
    assert.equal(credential.CredentialID, '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.equal(credential.UserID, 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.equal(Passpack.decode('AES', credential.Description, masterKeyPlainText), 'Test Credential');
    assert.equal(Passpack.decode('AES', credential.Username, masterKeyPlainText), '_testuser123');
    assert.equal(Passpack.decode('AES', credential.Password, masterKeyPlainText), '8{s?(\'7.171h)3H');
    assert.equal(Passpack.decode('AES', credential.Url, masterKeyPlainText), 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.equal(Passpack.decode('AES', credential.UserDefined1, masterKeyPlainText), 'CUSTOM1');
    assert.equal(Passpack.decode('AES', credential.UserDefined1Label, masterKeyPlainText), 'Custom 1');
    assert.equal(Passpack.decode('AES', credential.UserDefined2, masterKeyPlainText), 'CUSTOM2');
    assert.equal(Passpack.decode('AES', credential.UserDefined2Label, masterKeyPlainText), 'Custom 2');
    assert.equal(Passpack.decode('AES', credential.Notes, masterKeyPlainText), 'Test Notes:\n\nThese are test notes.');
}

function checkDecryption(credential: Credential) {
    assert.equal(credential.CredentialID, '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.equal(credential.UserID, 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.equal(credential.Description, 'Test Credential');
    assert.equal(credential.Username, '_testuser123');
    assert.equal(credential.Password, '8{s?(\'7.171h)3H');
    assert.equal(credential.Url, 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.equal(credential.UserDefined1, 'CUSTOM1');
    assert.equal(credential.UserDefined1Label, 'Custom 1');
    assert.equal(credential.UserDefined2, 'CUSTOM2');
    assert.equal(credential.UserDefined2Label, 'Custom 2');
    assert.equal(credential.Notes, 'Test Notes:\n\nThese are test notes.');
}

// Created with Vault.utf8ToBase64(Vault.createMasterKey('test123'))
const testMasterKeyBase64Encoded = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
const testMasterKeyPlainText = unescape(decodeURIComponent(atob(testMasterKeyBase64Encoded)));

let testCredentials: Credential[];
// let testRepository: IRepository;

const nw = (c: Credential) => false;

suite('Common', () => {

    test('rateLimit', function(done) {
        this.slow(1000);
        // TODO: Does this actually test the function?
        const func = rateLimit(e => {
            assert.ok(true);
            done();
        }, 100);
        func();
    });

    test('truncate', () => {
        const testString = 'This Is A Test';
        assert.equal(truncate(testString, 10), 'This Is...');
        assert.equal(truncate(testString, 20), 'This Is A Test');
    });

});

suite('CryptoProvider', () => {

    test('base64ToUtf8', () => {
        const utf8 = new CryptoProvider().base64ToUtf8('VEVTVA==');
        assert.equal(utf8, 'TEST');
    });

    test('utf8ToBase64', () => {
        const b64 = new CryptoProvider().utf8ToBase64('TEST');
        assert.equal(b64, 'VEVTVA==');
    });

    test('decryptCredential', () => {
        const decrypted = new CryptoProvider().decryptCredential(testCredentialEncrypted, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
        checkDecryption(decrypted);
    });

    test('decryptCredentials', () => {
        const credentials = [testCredentialEncrypted, testCredentialEncrypted];
        const decrypted = new CryptoProvider().decryptCredentials(credentials, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
        decrypted.forEach(c => checkDecryption(c));
    });

    test('encryptCredential', () => {
        const encrypted = new CryptoProvider().encryptCredential(testCredentialPlainText, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
        checkEncryption(encrypted, testMasterKeyPlainText);
    });

    test('encryptCredentials', () => {
        const credentials = [testCredentialPlainText, testCredentialPlainText];
        const encrypted = new CryptoProvider().encryptCredentials(credentials, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
        encrypted.forEach(c => checkEncryption(c, testMasterKeyPlainText));
    });

    test('generateMasterKey', () => {
        const k = Passpack.utils.hashx('test123' + Passpack.utils.hashx('test123', true, true), true, true);
        assert.equal(k, new CryptoProvider().generateMasterKey('test123'));
    });

    test('generatePassword', () => {
        const cp = new CryptoProvider();

        const spec: IPasswordSpecification = {
            length: 0,
            lowerCase: false,
            upperCase: false,
            numbers: false,
            symbols: false
        };

        const empty = cp.generatePassword(spec);
        spec.length = 32;
        const empty2 = cp.generatePassword(spec);
        assert.equal(empty, null);
        assert.equal(empty2, null);

        spec.lowerCase = true;
        const lc = cp.generatePassword(spec);
        assert.equal(lc.toLowerCase(), lc);

        spec.lowerCase = false;
        spec.upperCase = true;
        const uc = cp.generatePassword(spec);
        assert.equal(uc.toUpperCase(), uc);

        spec.upperCase = false;
        spec.numbers = true;
        const nums = cp.generatePassword(spec);
        assert.ok(nums.match(/\d+/gi));

        spec.numbers = false;
        spec.symbols = true;
        const sym = cp.generatePassword(spec);
        assert.ok(sym.match(/[^a-z0-9]+/gi));
    });

});

suite('Vault', () => {

    beforeEach(() => {
        /* tslint:disable:max-line-length */
        testCredentials = [
            new Credential('cr1', 'user1', 'Cat', 'cat', 'cat123', 'http://cat.com', 'Cat UD 1', 'catud1', 'Cat UD 1', 'catud1', 'Cat notes', '12|1|1|1|1'),
            new Credential('cr2', 'user1', 'Dog', 'dog', 'dog123', 'http://dog.com', 'Dog UD 1', 'dogud1', 'Dog UD 1', 'dogud1', 'Dog notes', '12|1|1|1|1'),
            new Credential('cr3', 'user1', 'Fish', 'fish', 'fish123', 'http://fish.com', 'Fish UD 1', 'fishud1', 'Fish UD 1', 'fishud1', 'Fish notes', '12|1|1|1|1'),
            new Credential('cr4', 'user1', 'Catfish', 'catfish', 'catfish123', 'http://catfish.com', 'Catfish UD 1', 'catfishud1', 'Catfish UD 1', 'catfishud1', 'Catfish notes', '12|1|1|1|1'),
            new Credential('cr5', 'user1', 'Dogfish', 'dogfish', 'dogfish123', 'http://dogfish.com', 'Dogfish UD 1', 'dogfishud1', 'Dogfish UD 1', 'dogfishud1', 'Dogfish notes', '12|1|1|1|1'),
            new Credential('cr6', 'user1', 'Owl', 'owl', '_nT:NP?uovID8,TE', 'http://owl.com', 'Owl UD 1', 'owlud1', 'Owl UD 1', 'owlud1', 'Owl notes', '12|1|1|1|1')
        ];
        /* tslint:enable:max-line-length */
    });

    test('parseQuery', () => {
        const parsed = parseSearchQuery(' EmAil ');

        assert.equal(parsed.property, 'Description');
        assert.equal(parsed.text, 'email');
    });

    test('parseSearchQuery specific field', () => {
        const parsed = parseSearchQuery(' useRName : BoB ');

        assert.equal(parsed.property, 'Username');
        assert.equal(parsed.text, 'bob');
    });

    test('parseSearchQuery show weak', () => {
        const parsed = parseSearchQuery(' filtER : WeAk ');

        assert.equal(parsed.property, 'FILTER');
        assert.equal(parsed.text, 'weak');
    });

    test('parseSearchQuery show all', () => {
        const parsed = parseSearchQuery(' Filter: aLl ');

        assert.equal(parsed.property, 'FILTER');
        assert.equal(parsed.text, 'all');
    });

    test('searchCredentials bad queries', () => {
        const noresults1 = searchCredentials(null, nw, testCredentials);
        const noresults2 = searchCredentials({ property: null, text: 'ABC' }, nw, testCredentials);
        const noresults3 = searchCredentials({ property: 'Description', text: null }, nw, testCredentials);
        const noresults4 = searchCredentials({ property: 'Description', text: 'Z' }, nw, testCredentials);
        const noresults5 = searchCredentials({ property: 'FILTER', text: 'ABC' }, nw, testCredentials);

        assert.lengthOf(noresults1, 0);
        assert.lengthOf(noresults2, 0);
        assert.lengthOf(noresults3, 0);
        assert.lengthOf(noresults4, 0);
        assert.lengthOf(noresults4, 0);
    });

    test('searchCredentials standard query', () => {
        const results = searchCredentials({ property: 'Description', text: 'do' }, nw, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Dog');
        assert.equal(results[1].Description, 'Dogfish');
    });

    test('searchCredentials username query', () => {
        const results = searchCredentials({ property: 'Username', text: 'dog' }, nw, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Dog');
        assert.equal(results[1].Description, 'Dogfish');
    });

    test('searchCredentials password query', () => {
        const results = searchCredentials({ property: 'Password', text: 'cat' }, nw, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Cat');
        assert.equal(results[1].Description, 'Catfish');
    });

    test('searchCredentials all query', () => {
        const results = searchCredentials({ property: 'FILTER', text: 'all' }, nw, testCredentials);
        assert.lengthOf(results, 6);
        assert.equal(results[0].Description, 'Cat');
        assert.equal(results[5].Description, 'Owl');
    });

    test('searchCredentials weak password query', () => {
        const isWeakPassword = (c: Credential) => c.Password.length < 7;
        const results = searchCredentials({ property: 'FILTER', text: 'weak' }, isWeakPassword, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Cat');
        assert.equal(results[1].Description, 'Dog');
    });

    test('mapToSummary', () => {
        const summary = mapToSummary(testMasterKeyPlainText, 'user1', c => true, testCredentialPlainText);
        assert.equal(summary.credentialid, '361fe91a-3dca-4871-b69e-c41c31507c8c');
        assert.equal(summary.description, 'Test Credential');
        assert.equal(summary.masterkey, testMasterKeyPlainText);
        assert.equal(summary.password, '8{s?(\'7.171h)3H');
        assert.equal(summary.url, 'http://www.test.com?id=23&param=TEST+VALUE');
        assert.equal(summary.userid, 'user1');
        assert.equal(summary.username, '_testuser123');
        assert.isTrue(summary.weak);
    });

});

// suite('Main', () => {
// });

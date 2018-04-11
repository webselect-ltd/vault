import { assert } from 'chai';
import { beforeEach, suite, test } from 'mocha';
import {
    getPasswordSpecificationFromPassword,
    mapToSummary,
    parsePasswordSpecificationString,
    parseSearchQuery,
    rateLimit,
    searchCredentials,
    truncate,
    validateCredential,
    weakPasswordThreshold
} from '../modules/all';
import { CryptoProvider, ICredential, ICredentialSummary, IPasswordSpecification, IRepository, Repository } from '../types/all';
import { FakeRepository } from './FakeRepository';

// Created with Vault.utf8ToBase64(Vault.createMasterKey('test123'))
const testMasterKeyBase64Encoded = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
const testMasterKeyPlainText = unescape(decodeURIComponent(atob(testMasterKeyBase64Encoded)));

const testCredentialPlainText: ICredential = {
    CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
    UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    Description: 'Test Credential',
    Username: '_testuser123',
    Password: '8{s?(\'7.171h)3H',
    Url: 'http://www.test.com?id=23&param=TEST+VALUE',
    UserDefined1Label: 'Custom 1',
    UserDefined1: 'CUSTOM1',
    UserDefined2Label: 'Custom 2',
    UserDefined2: 'CUSTOM2',
    Notes: 'Test Notes:\n\nThese are test notes.',
    PwdOptions: '16|1|1|1|1'
};

const testCredentialEncrypted: ICredential = {
    CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
    UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    Description: 'EcOPw4TDj0gBITAhITAhLSExMCFQITEwIWJHQcK9wpJtXHQgRMKtaw==',
    Username: 'EsOPw4TDj0gBITAhITAhLcKHw7LChcOKwpUHbsOIw60iYXs=',
    Password: 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
    Url: 'E8OPw4TDj0gBITAhITAhLRnDh8KUG8O5dlVZZ8OBwrwgO8KQNDctecKbM8KGworDmzoUbsOrSEnCrMKSDyMtNkhZw6/Cgyp5ZSExMiEG',
    UserDefined1Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmM=',
    UserDefined1: 'FMOPw4TDj0gBITAhITAhLW88TTrDrEXDvw==',
    UserDefined2Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmA=',
    UserDefined2: 'FcOPw4TDj0gBITAhITAhLcOeJDjCncKcw47DqA==',
    Notes: 'FcOPw4TDj0gBITAhITAhLcOJFBjCvcOzw43CtVxmwoJzw4pAw63CpcKRLSkDwpg5LiE0NSHCmwNTajjCmVbCtMKAwq0tw43CvQ==',
    PwdOptions: '16|1|1|1|1'
};

function checkEncryption(credential: ICredential, masterKeyPlainText: string) {
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

function checkDecryption(credential: ICredential) {
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

function getTestCredentials(): ICredential[] {
    return new FakeRepository(new CryptoProvider(), testMasterKeyBase64Encoded).credentials;
}

const nw = (c: ICredential) => false;

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
            lowercase: false,
            uppercase: false,
            numbers: false,
            symbols: false
        };

        const empty = cp.generatePassword(spec);
        spec.length = 32;
        const empty2 = cp.generatePassword(spec);
        assert.equal(empty, null);
        assert.equal(empty2, null);

        spec.lowercase = true;
        const lc = cp.generatePassword(spec);
        assert.equal(lc.toLowerCase(), lc);

        spec.lowercase = false;
        spec.uppercase = true;
        const uc = cp.generatePassword(spec);
        assert.equal(uc.toUpperCase(), uc);

        spec.uppercase = false;
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
        const testCredentials = getTestCredentials();

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
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'Description', text: 'do' }, nw, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Dog');
        assert.equal(results[1].Description, 'Dogfish');
    });

    test('searchCredentials username query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'Username', text: 'dog' }, nw, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Dog');
        assert.equal(results[1].Description, 'Dogfish');
    });

    test('searchCredentials password query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'Password', text: 'cat' }, nw, testCredentials);
        assert.lengthOf(results, 2);
        assert.equal(results[0].Description, 'Cat');
        assert.equal(results[1].Description, 'Catfish');
    });

    test('searchCredentials all query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'FILTER', text: 'all' }, nw, testCredentials);
        assert.lengthOf(results, 6);
        assert.equal(results[0].Description, 'Cat');
        assert.equal(results[5].Description, 'Owl');
    });

    test('searchCredentials weak password query', () => {
        const testCredentials = getTestCredentials();
        const isWeakPassword = (c: ICredential) => c.Password.length < 7;
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

    test('validateCredential', () => {
        const validCredential = { CredentialID: 'ID', UserID: 'USER', Description: 'VALID CREDENTIAL' };
        const invalidCredential = { CredentialID: 'ID', UserID: 'USER', Description: '' };

        assert.lengthOf(validateCredential(validCredential), 0);
        assert.lengthOf(validateCredential(invalidCredential), 1);
    });

    test('parsePasswordSpecificationString bad inputs', () => {
        assert.isNull(parsePasswordSpecificationString(null));
        assert.isNull(parsePasswordSpecificationString(''));
        assert.isNull(parsePasswordSpecificationString('1|2|3'));
    });

    test('parsePasswordSpecificationString valid inputs', () => {
        const spec1: IPasswordSpecification = {
            length: 16,
            lowercase: true,
            uppercase: true,
            numbers: true,
            symbols: true
        };
        const spec2: IPasswordSpecification = {
            length: 32,
            lowercase: false,
            uppercase: true,
            numbers: false,
            symbols: true
        };
        const spec3: IPasswordSpecification = {
            length: 64,
            lowercase: true,
            uppercase: false,
            numbers: true,
            symbols: false
        };

        assert.deepEqual(parsePasswordSpecificationString('16|1|1|1|1'), spec1);
        assert.deepEqual(parsePasswordSpecificationString('32|0|1|0|1'), spec2);
        assert.deepEqual(parsePasswordSpecificationString('64|1|0|1|0'), spec3);
    });

    test('getPasswordSpecificationFromPassword bad inputs', () => {
        assert.isNull(getPasswordSpecificationFromPassword(null));
        assert.isNull(getPasswordSpecificationFromPassword(''));
    });

    test('getPasswordSpecificationFromPassword valid inputs', () => {
        const spec1: IPasswordSpecification = {
            length: 8,
            lowercase: true,
            uppercase: false,
            numbers: true,
            symbols: false
        };
        const spec2: IPasswordSpecification = {
            length: 10,
            lowercase: true,
            uppercase: true,
            numbers: true,
            symbols: true
        };
        const spec3: IPasswordSpecification = {
            length: 12,
            lowercase: false,
            uppercase: false,
            numbers: true,
            symbols: false
        };
        const spec4: IPasswordSpecification = {
            length: 14,
            lowercase: false,
            uppercase: true,
            numbers: false,
            symbols: true
        };

        assert.deepEqual(getPasswordSpecificationFromPassword('abcd1234'), spec1);
        assert.deepEqual(getPasswordSpecificationFromPassword('!aBcd1234^'), spec2);
        assert.deepEqual(getPasswordSpecificationFromPassword('123456789012'), spec3);
        assert.deepEqual(getPasswordSpecificationFromPassword('ABCD*EFG?H&JK-'), spec4);
    });

});

// suite('Main', () => {
// });

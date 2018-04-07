import { assert } from 'chai';
import { beforeEach, suite, test } from 'mocha';
import * as Vlt from '../main';
import { CryptoProvider, rateLimit, truncate, Vault } from '../modules/all';
import { Credential, CredentialSummary, IPasswordSpecification, IRepository } from '../types/all';
import { FakeRepository } from './FakeRepository';

const testCredentialPlainText = new Credential(
    '361fe91a-3dca-4871-b69e-c41c31507c8c',
    'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    'Test Credential',
    '_testuser123',
    '8{s?(\'7.171h)3H',
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
    assert.equal(Passpack.decode('AES', credential.PasswordConfirmation, masterKeyPlainText), '8{s?(\'7.171h)3H');
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
    assert.equal(credential.PasswordConfirmation, '8{s?(\'7.171h)3H');
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
let testRepository: IRepository;

suite('Common', () => {

    test('rateLimit', function(done) {
        this.slow(1000);
        // TODO: Does this actually test the function?
        const func = rateLimit(() => {
            assert.ok(true);
            done();
        }, 100);
        func(new Event('click'));
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

    test('decryptObject', () => {
        const decrypted = new CryptoProvider().decryptCredential(testCredentialEncrypted, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
        checkDecryption(decrypted);
    });

    test('encryptObject', () => {
        const encrypted = new CryptoProvider().encryptCredential(testCredentialPlainText, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
        checkEncryption(encrypted, testMasterKeyPlainText);
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
            new Credential('cr1', 'user1', 'Cat', 'cat', 'cat123', 'cat123', 'http://cat.com', 'Cat UD 1', 'catud1', 'Cat UD 1', 'catud1', 'Cat notes', '12|1|1|1|1'),
            new Credential('cr2', 'user1', 'Dog', 'dog', 'dog123', 'dog123', 'http://dog.com', 'Dog UD 1', 'dogud1', 'Dog UD 1', 'dogud1', 'Dog notes', '12|1|1|1|1'),
            new Credential('cr3', 'user1', 'Fish', 'fish', 'fish123', 'fish123', 'http://fish.com', 'Fish UD 1', 'fishud1', 'Fish UD 1', 'fishud1', 'Fish notes', '12|1|1|1|1'),
            new Credential('cr4', 'user1', 'Catfish', 'catfish', 'catfish123', 'catfish123', 'http://catfish.com', 'Catfish UD 1', 'catfishud1', 'Catfish UD 1', 'catfishud1', 'Catfish notes', '12|1|1|1|1'),
            new Credential('cr5', 'user1', 'Dogfish', 'dogfish', 'dogfish123', 'dogfish123', 'http://dogfish.com', 'Dogfish UD 1', 'dogfishud1', 'Dogfish UD 1', 'dogfishud1', 'Dogfish notes', '12|1|1|1|1'),
            new Credential('cr6', 'user1', 'Owl', 'owl', '_nT:NP?uovID8,TE', '_nT:NP?uovID8,TE', 'http://owl.com', 'Owl UD 1', 'owlud1', 'Owl UD 1', 'owlud1', 'Owl notes', '12|1|1|1|1')
        ];
        /* tslint:enable:max-line-length */
    });

    test('parseQuery', () => {
        const vault = new Vault(new CryptoProvider());

        const parsed = vault.parseSearchQuery(' EmAil ');

        assert.equal(parsed.property, 'Description');
        assert.equal(parsed.text, 'email');
    });

    test('parseSearchQuery specific field', () => {
        const vault = new Vault(new CryptoProvider());

        const parsed = vault.parseSearchQuery(' useRName : BoB ');

        assert.equal(parsed.property, 'Username');
        assert.equal(parsed.text, 'bob');
    });

    test('parseSearchQuery show weak', () => {
        const vault = new Vault(new CryptoProvider());

        const parsed = vault.parseSearchQuery(' filtER : WeAk ');

        assert.equal(parsed.property, 'FILTER');
        assert.equal(parsed.text, 'weak');
    });

    test('parseSearchQuery show all', () => {
        const vault = new Vault(new CryptoProvider());

        const parsed = vault.parseSearchQuery(' Filter: aLl ');

        assert.equal(parsed.property, 'FILTER');
        assert.equal(parsed.text, 'all');
    });

    test('search', () => {
        const vault = new Vault(new CryptoProvider());

        const noresults1 = vault.search(null, testCredentials);
        const noresults2 = vault.search('', testCredentials);
        const noresults3 = vault.search('Z', testCredentials);
        const noresults4 = vault.search('filter:ABC', testCredentials);
        assert.lengthOf(noresults1, 0);
        assert.lengthOf(noresults2, 0);
        assert.lengthOf(noresults3, 0);
        assert.lengthOf(noresults4, 0);
        const results1 = vault.search('do', testCredentials);
        assert.lengthOf(results1, 2);
        assert.equal(results1[0].Description, 'Dog');
        assert.equal(results1[1].Description, 'Dogfish');
        const results2 = vault.search('username:dog', testCredentials);
        assert.lengthOf(results2, 2);
        assert.equal(results2[0].Description, 'Dog');
        assert.equal(results2[1].Description, 'Dogfish');
        const results3 = vault.search('password:cat', testCredentials);
        assert.lengthOf(results3, 2);
        assert.equal(results3[0].Description, 'Cat');
        assert.equal(results3[1].Description, 'Catfish');
        const results4 = vault.search('filter:all', testCredentials);
        assert.lengthOf(results4, 6);
        assert.equal(results4[0].Description, 'Cat');
        assert.equal(results4[5].Description, 'Owl');
        const results5 = vault.search('filter:weak', testCredentials);
        assert.lengthOf(results5, 3);
        assert.equal(results5[0].Description, 'Cat');
        assert.equal(results5[2].Description, 'Fish');
    });

});

suite('Main', () => {

    beforeEach(() => {
        /* tslint:disable:max-line-length */
        testCredentials = [
            new Credential('cr1', 'user1', 'Cat', 'cat', 'cat123', 'cat123', 'http://cat.com', 'Cat UD 1', 'catud1', 'Cat UD 1', 'catud1', 'Cat notes', '12|1|1|1|1'),
            new Credential('cr2', 'user1', 'Dog', 'dog', 'dog123', 'dog123', 'http://dog.com', 'Dog UD 1', 'dogud1', 'Dog UD 1', 'dogud1', 'Dog notes', '12|1|1|1|1'),
            new Credential('cr3', 'user1', 'Fish', 'fish', 'fish123', 'fish123', 'http://fish.com', 'Fish UD 1', 'fishud1', 'Fish UD 1', 'fishud1', 'Fish notes', '12|1|1|1|1'),
            new Credential('cr4', 'user1', 'Catfish', 'catfish', 'catfish123', 'catfish123', 'http://catfish.com', 'Catfish UD 1', 'catfishud1', 'Catfish UD 1', 'catfishud1', 'Catfish notes', '12|1|1|1|1'),
            new Credential('cr5', 'user1', 'Dogfish', 'dogfish', 'dogfish123', 'dogfish123', 'http://dogfish.com', 'Dogfish UD 1', 'dogfishud1', 'Dogfish UD 1', 'dogfishud1', 'Dogfish notes', '12|1|1|1|1'),
            new Credential('cr6', 'user1', 'Owl', 'owl', '_nT:NP?uovID8,TE', '_nT:NP?uovID8,TE', 'http://owl.com', 'Owl UD 1', 'owlud1', 'Owl UD 1', 'owlud1', 'Owl notes', '12|1|1|1|1')
        ];
        /* tslint:enable:max-line-length */

        const cryptoProvider = new CryptoProvider();
        testRepository = new FakeRepository(testCredentials, cryptoProvider, testMasterKeyBase64Encoded);

        Vlt.testInit(testRepository, cryptoProvider);
    });

    test('buildDataTable', done => {
        const userId = 'user1';
        const list = testCredentials.slice(0, 3);
        const check = (row: CredentialSummary, id: string, desc: string) =>
            row.credentialid === id && row.description === desc && row.masterkey === testMasterKeyBase64Encoded && row.userid === 'user1';
        const result = Vlt.buildDataTable(list, rows => {
            assert.lengthOf(rows, 3);
            assert.ok(check(rows[0], 'cr1', 'Cat'));
            assert.ok(check(rows[1], 'cr2', 'Dog'));
            assert.ok(check(rows[2], 'cr3', 'Fish'));
            done();
        }, testMasterKeyBase64Encoded, userId);
    });

    test('changePassword', async () => {
        const cryptoProvider = new CryptoProvider();
        const userId = 'user1';
        const newPassword = 'test321';
        const newMasterKey = cryptoProvider.utf8ToBase64(cryptoProvider.generateMasterKey(newPassword));
        const excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];
        const check = (c: Credential, id: string, desc: string, uname: string, pwd: string) =>
            c.CredentialID === id && c.Description === desc && c.Username === uname && c.Password === pwd && c.UserID === 'user1';

        await Vlt.changePassword(userId, testMasterKeyBase64Encoded, 'test123', 'test321');

        const credentials = await testRepository.loadCredentialsForUserFull(userId);

        const decrypted = credentials.map(c => cryptoProvider.decryptCredential(c, newMasterKey, excludes));

        assert.ok(check(decrypted[0], 'cr1', 'Cat', 'cat', 'cat123'));
        assert.ok(check(decrypted[1], 'cr2', 'Dog', 'dog', 'dog123'));
        assert.ok(check(decrypted[2], 'cr3', 'Fish', 'fish', 'fish123'));
        assert.ok(check(decrypted[3], 'cr4', 'Catfish', 'catfish', 'catfish123'));
        assert.ok(check(decrypted[4], 'cr5', 'Dogfish', 'dogfish', 'dogfish123'));
        assert.ok(check(decrypted[5], 'cr6', 'Owl', 'owl', '_nT:NP?uovID8,TE'));
    });

    test('checkIf', () => {
        const checkbox1 = $('<input type="checkbox">');
        const checkbox2 = $('<input type="checkbox" checked="checked">');
        Vlt.checkIf(checkbox1, () => true);
        Vlt.checkIf(checkbox2, () => false);
        assert.isTrue((checkbox1[0] as HTMLInputElement).checked);
        assert.isFalse((checkbox2[0] as HTMLInputElement).checked);
    });

    test('createCredentialDisplayData', () => {
        const credential = new Credential('cr1', 'user1', 'Item Description');
        const data = Vlt.createCredentialDisplayData(credential, testMasterKeyBase64Encoded, 'user1');
        assert.equal(data.credentialid, 'cr1');
        assert.equal(data.description, 'Item Description');
        assert.equal(data.userid, 'user1');
        assert.equal(data.masterkey, testMasterKeyBase64Encoded);
    });

    test('createCredentialFromFormFields', () => {
        const html = '<form>'
            + '<input type="text" name="CredentialID" value="CredentialID">'
            + '<input type="text" name="UserID" value="UserID">'
            + '<input type="text" name="Description" value="Description">'
            + '<input type="text" name="Username" value="Username">'
            + '<input type="text" name="Password" value="Password">'
            + '<input type="text" name="PwdOptions" value="PwdOptions">'
            + '<input type="text" name="PasswordConfirmation" value="PasswordConfirmation">'
            + '<input type="text" name="Url" value="Url">'
            + '<input type="text" name="UserDefined1Label" value="UserDefined1Label">'
            + '<input type="text" name="UserDefined1" value="UserDefined1">'
            + '<input type="text" name="UserDefined2Label" value="UserDefined2Label">'
            + '<input type="text" name="UserDefined2" value="UserDefined2">'
            + '<textarea name="Notes">Notes</textarea>'
            + '<input type="text" name="chromeusername" class="chrome-autocomplete-fake" value="ABC">'
            + '<input type="text" name="chromepassword" class="chrome-autocomplete-fake" value="123">'
            + '<input type="text" name="len" value="16">'
            + '<input type="text" name="ucase" value="1">'
            + '<input type="text" name="lcase" value="1">'
            + '<input type="text" name="nums" value="1">'
            + '<input type="text" name="symb" value="1">'
            + '<input type="submit" name="submit" class="submit" value="Save">'
            + '</form>';

        const form = $(html);
        const obj = Vlt.createCredentialFromFormFields(form);

        assert.equal(obj.CredentialID, 'CredentialID');
        assert.equal(obj.UserID, 'UserID');
        assert.equal(obj.Description, 'Description');
        assert.equal(obj.Username, 'Username');
        assert.equal(obj.Password, 'Password');
        assert.equal(obj.PwdOptions, 'PwdOptions');
        assert.equal(obj.PasswordConfirmation, 'PasswordConfirmation');
        assert.equal(obj.Url, 'Url');
        assert.equal(obj.UserDefined1Label, 'UserDefined1Label');
        assert.equal(obj.UserDefined1, 'UserDefined1');
        assert.equal(obj.UserDefined2Label, 'UserDefined2Label');
        assert.equal(obj.UserDefined2, 'UserDefined2');
        assert.equal(obj.Notes, 'Notes');
        assert.equal(typeof obj.chromeusername, 'undefined');
        assert.equal(typeof obj.chromepassword, 'undefined');
        assert.equal(typeof obj.submit, 'undefined');
    });

    // test('createCredentialTable', () => {
    //     Vlt.uiSetup();
    //     const data = testCredentials.map(c => Vlt.createCredentialDisplayData(c, testMasterKeyBase64Encoded, 'user1'));
    //     const table = $(Vlt.createCredentialTable(data));
    //     const rows = table.filter('.row');
    //     assert.lengthOf(rows, 6);
    //     assert.equal($(rows[0]).attr('id'), 'cr1');
    //     assert.equal($(rows[1]).find('.full').text(), 'Dog');
    // });

    test('exportData', async () => {
        const check = (c: Credential, id: string, desc: string, uname: string, pwd: string) =>
            c.CredentialID === id && c.Description === desc && c.Username === uname && c.Password === pwd && c.UserID === 'user1';

        const exportedData = await Vlt.exportData('user1', testMasterKeyBase64Encoded);

        assert.ok(check(exportedData[0], 'cr1', 'Cat', 'cat', 'cat123'));
        assert.ok(check(exportedData[1], 'cr2', 'Dog', 'dog', 'dog123'));
        assert.ok(check(exportedData[2], 'cr3', 'Fish', 'fish', 'fish123'));
        assert.ok(check(exportedData[3], 'cr4', 'Catfish', 'catfish', 'catfish123'));
        assert.ok(check(exportedData[4], 'cr5', 'Dogfish', 'dogfish', 'dogfish123'));
        assert.ok(check(exportedData[5], 'cr6', 'Owl', 'owl', '_nT:NP?uovID8,TE'));
    });

    test('getPasswordGenerationOptions', () => {
        const html = '<div>'
            + '<input type="text" class="generate-password-option" id="len" name="len" value="32">'
            + '<input type="checkbox" class="generate-password-option" id="ucase" name="ucase" value="1" checked="checked">'
            + '<input type="checkbox" class="generate-password-option" id="lcase" name="lcase" value="1">'
            + '<input type="checkbox" class="generate-password-option" id="nums" name="nums" value="1" checked="checked">'
            + '<input type="checkbox" class="generate-password-option" id="symb" name="symb" value="1">'
            + '</div>';

        const el = $(html);
        const options = Vlt.getPasswordGenerationOptionValues(el.find('input.generate-password-option'), Vlt.isChecked);
        assert.equal(options.length, 32);
        assert.isTrue(options.upperCase);
        assert.isFalse(options.lowerCase);
        assert.isTrue(options.numbers);
        assert.isFalse(options.symbols);
    });

    test('parseImportData', () => {
        const userId = 'user1';
        const importData = `[{
        "CredentialID": "NEW",
        "UserID": "user1_old",
        "Description": "IMPORTED",
        "Username": "im1",
        "Password": "im123",
        "PasswordConfirmation": "im123",
        "Url": "http://imported.com",
        "UserDefined1Label": "",
        "UserDefined1": "",
        "UserDefined2Label": "",
        "UserDefined2": "",
        "Notes": "",
        "PwdOptions": ""
    }]`;
        const newData = Vlt.parseImportData(userId, testMasterKeyBase64Encoded, importData);
        assert.lengthOf(newData, 1);
        assert.equal(newData[0].UserID, userId);
        assert.isNull(newData[0].CredentialID);
        assert.isUndefined(newData[0].PasswordConfirmation);
    });

    test('isChecked', () => {
        const checkbox1 = $('<input type="checkbox">');
        const checkbox2 = $('<input type="checkbox" checked="checked">');
        assert.isFalse(Vlt.isChecked(checkbox1));
        assert.isTrue(Vlt.isChecked(checkbox2));
    });

    test('sortCredentials', () => {
        Vlt.sortCredentials(testCredentials);
        assert.equal(testCredentials[0].Description, 'Cat');
        assert.equal(testCredentials[1].Description, 'Catfish');
        assert.equal(testCredentials[2].Description, 'Dog');
        assert.equal(testCredentials[3].Description, 'Dogfish');
        assert.equal(testCredentials[4].Description, 'Fish');
        assert.equal(testCredentials[5].Description, 'Owl');
    });

    test('updateProperties', () => {
        const updated = Vlt.updateProperties({
            Description: 'ITEM2UPDATE',
            Username: 'item2new',
            Password: 'abcd',
            Url: 'http://test4.com'
        }, testCredentials[1]);
        assert.equal(updated.Description, 'ITEM2UPDATE');
        assert.equal(updated.Username, 'item2new');
        assert.equal(updated.Password, 'abcd');
        assert.equal(updated.Url, 'http://test4.com');
    });

    test('validateRecord', () => {
        const form = $('<form><input id="Description" name="Description" />' +
            '<input id="Password" name="Password" />' +
            '<input id="PasswordConfirmation" name="PasswordConfirmation" /></form>');
        form.find('#Password').val('A');
        const noDesc = Vlt.validateRecord(form);
        form.find('#Description').val('A');
        const passwordNoMatch = Vlt.validateRecord(form);
        form.find('#PasswordConfirmation').val('A');
        const valid = Vlt.validateRecord(form);
        assert.lengthOf(noDesc, 2);
        assert.equal(noDesc[0].field.attr('id'), 'Description');
        assert.equal(noDesc[1].field.attr('id'), 'PasswordConfirmation');
        assert.lengthOf(passwordNoMatch, 1);
        assert.equal(passwordNoMatch[0].field.attr('id'), 'PasswordConfirmation');
        assert.lengthOf(valid, 0);
    });

});

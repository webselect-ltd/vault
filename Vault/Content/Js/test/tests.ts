import { suite, test, beforeEach } from 'mocha';
import { assert } from 'chai';
import { CryptoProvider, Credential, CredentialSummary } from '../Concrete';
import { IPasswordSpecification, IRepository } from '../Abstract';
import * as Vault from '../Vault';
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

        const cryptoProvider = new CryptoProvider();
        testRepository = new FakeRepository(testCredentials, cryptoProvider, testMasterKeyBase64Encoded);

        Vault.testInit(testRepository, cryptoProvider);
    });

    test('buildDataTable', done => {
        const userId = 'user1';
        const list = testCredentials.slice(0, 3);
        const check = (row: CredentialSummary, id: string, desc: string) =>
            row.credentialid === id && row.description === desc && row.masterkey === testMasterKeyBase64Encoded && row.userid === 'user1';
        const result = Vault.buildDataTable(list, rows => {
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

        await Vault.changePassword(userId, testMasterKeyBase64Encoded, 'test123', 'test321');

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
        Vault.checkIf(checkbox1, () => true);
        Vault.checkIf(checkbox2, () => false);
        assert.isTrue((checkbox1[0] as HTMLInputElement).checked);
        assert.isFalse((checkbox2[0] as HTMLInputElement).checked);
    });

    test('createCredentialDisplayData', () => {
        const credential = new Credential('cr1', 'user1', 'Item Description');
        const data = Vault.createCredentialDisplayData(credential, testMasterKeyBase64Encoded, 'user1');
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
        const obj = Vault.createCredentialFromFormFields(form);

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

    test('createCredentialTable', () => {
        Vault.uiSetup();
        const data = testCredentials.map(c => Vault.createCredentialDisplayData(c, testMasterKeyBase64Encoded, 'user1'));
        const table = $(Vault.createCredentialTable(data));
        const rows = table.filter('.row');
        assert.lengthOf(rows, 6);
        assert.equal($(rows[0]).attr('id'), 'cr1');
        assert.equal($(rows[1]).find('.full').text(), 'Dog');
    });

    test('exportData', async () => {
        const check = (c: Credential, id: string, desc: string, uname: string, pwd: string) =>
            c.CredentialID === id && c.Description === desc && c.Username === uname && c.Password === pwd && c.UserID === 'user1';

        const exportedData = await Vault.exportData('user1', testMasterKeyBase64Encoded);

        assert.ok(check(exportedData[0], 'cr1', 'Cat', 'cat', 'cat123'));
        assert.ok(check(exportedData[1], 'cr2', 'Dog', 'dog', 'dog123'));
        assert.ok(check(exportedData[2], 'cr3', 'Fish', 'fish', 'fish123'));
        assert.ok(check(exportedData[3], 'cr4', 'Catfish', 'catfish', 'catfish123'));
        assert.ok(check(exportedData[4], 'cr5', 'Dogfish', 'dogfish', 'dogfish123'));
        assert.ok(check(exportedData[5], 'cr6', 'Owl', 'owl', '_nT:NP?uovID8,TE'));
    });

});

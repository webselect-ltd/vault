﻿/// <reference types="qunit" />
/// <reference path="../types/hacks.d.ts" />

﻿/* tslint:disable:no-console */

const { module, testStart, testDone, test } = QUnit;

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

function checkEncryption(assert: Assert, credential: Credential, masterKeyPlainText: string) {
    assert.ok(credential.CredentialID === '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.ok(credential.UserID === 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.ok(Passpack.decode('AES', credential.Description, masterKeyPlainText) === 'Test Credential');
    assert.ok(Passpack.decode('AES', credential.Username, masterKeyPlainText) === '_testuser123');
    assert.ok(Passpack.decode('AES', credential.Password, masterKeyPlainText) === '8{s?(\'7.171h)3H');
    assert.ok(Passpack.decode('AES', credential.PasswordConfirmation, masterKeyPlainText) === '8{s?(\'7.171h)3H');
    assert.ok(Passpack.decode('AES', credential.Url, masterKeyPlainText) === 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.ok(Passpack.decode('AES', credential.UserDefined1, masterKeyPlainText) === 'CUSTOM1');
    assert.ok(Passpack.decode('AES', credential.UserDefined1Label, masterKeyPlainText) === 'Custom 1');
    assert.ok(Passpack.decode('AES', credential.UserDefined2, masterKeyPlainText) === 'CUSTOM2');
    assert.ok(Passpack.decode('AES', credential.UserDefined2Label, masterKeyPlainText) === 'Custom 2');
    assert.ok(Passpack.decode('AES', credential.Notes, masterKeyPlainText) === 'Test Notes:\n\nThese are test notes.');
}

function checkDecryption(assert: Assert, credential: Credential) {
    assert.ok(credential.CredentialID === '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.ok(credential.UserID === 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.ok(credential.Description === 'Test Credential');
    assert.ok(credential.Username === '_testuser123');
    assert.ok(credential.Password === '8{s?(\'7.171h)3H');
    assert.ok(credential.PasswordConfirmation === '8{s?(\'7.171h)3H');
    assert.ok(credential.Url === 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.ok(credential.UserDefined1 === 'CUSTOM1');
    assert.ok(credential.UserDefined1Label === 'Custom 1');
    assert.ok(credential.UserDefined2 === 'CUSTOM2');
    assert.ok(credential.UserDefined2Label === 'Custom 2');
    assert.ok(credential.Notes === 'Test Notes:\n\nThese are test notes.');
}

// Created with Vault.utf8ToBase64(Vault.createMasterKey('test123'))
const testMasterKeyBase64Encoded = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
const testMasterKeyPlainText = unescape(decodeURIComponent(atob(testMasterKeyBase64Encoded)));

let testCredentials: Credential[];

module('CryptoProvider');

test('base64ToUtf8', assert => {
    const utf8 = new CryptoProvider().base64ToUtf8('VEVTVA==');
    assert.ok(utf8 === 'TEST');
});

test('decryptObject', assert => {
    const decrypted = new CryptoProvider().decryptCredential(testCredentialEncrypted, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
    checkDecryption(assert, decrypted);
});

test('encryptObject', assert => {
    const encrypted = new CryptoProvider().encryptCredential(testCredentialPlainText, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
    checkEncryption(assert, encrypted, testMasterKeyPlainText);
});

test('generateMasterKey', assert => {
    const k = Passpack.utils.hashx('test123' + Passpack.utils.hashx('test123', true, true), true, true);
    assert.ok(k === new CryptoProvider().generateMasterKey('test123'));
});

test('generatePassword', assert => {
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
    assert.ok(empty === null);
    assert.ok(empty2 === null);

    spec.lowerCase = true;
    const lc = cp.generatePassword(spec);
    assert.ok(lc.toLowerCase() === lc);

    spec.lowerCase = false;
    spec.upperCase = true;
    const uc = cp.generatePassword(spec);
    assert.ok(uc.toUpperCase() === uc);

    spec.upperCase = false;
    spec.numbers = true;
    const nums = cp.generatePassword(spec);
    assert.ok(nums.match(/\d+/gi));

    spec.numbers = false;
    spec.symbols = true;
    const sym = cp.generatePassword(spec);
    assert.ok(sym.match(/[^a-z0-9]+/gi));
});

test('utf8ToBase64', assert => {
    const b64 = new CryptoProvider().utf8ToBase64('TEST');
    assert.ok(b64 === 'VEVTVA==');
});

module('Vault');

testStart(details => {
    ﻿/* tslint:disable:max-line-length */
    testCredentials = [
        new Credential('cr1', 'user1', 'Cat', 'cat', 'cat123', 'cat123', 'http://cat.com', 'Cat UD 1', 'catud1', 'Cat UD 1', 'catud1', 'Cat notes', '12|1|1|1|1'),
        new Credential('cr2', 'user1', 'Dog', 'dog', 'dog123', 'dog123', 'http://dog.com', 'Dog UD 1', 'dogud1', 'Dog UD 1', 'dogud1', 'Dog notes', '12|1|1|1|1'),
        new Credential('cr3', 'user1', 'Fish', 'fish', 'fish123', 'fish123', 'http://fish.com', 'Fish UD 1', 'fishud1', 'Fish UD 1', 'fishud1', 'Fish notes', '12|1|1|1|1'),
        new Credential('cr4', 'user1', 'Catfish', 'catfish', 'catfish123', 'catfish123', 'http://catfish.com', 'Catfish UD 1', 'catfishud1', 'Catfish UD 1', 'catfishud1', 'Catfish notes', '12|1|1|1|1'),
        new Credential('cr5', 'user1', 'Dogfish', 'dogfish', 'dogfish123', 'dogfish123', 'http://dogfish.com', 'Dogfish UD 1', 'dogfishud1', 'Dogfish UD 1', 'dogfishud1', 'Dogfish notes', '12|1|1|1|1'),
        new Credential('cr6', 'user1', 'Owl', 'owl', '_nT:NP?uovID8,TE', '_nT:NP?uovID8,TE', 'http://owl.com', 'Owl UD 1', 'owlud1', 'Owl UD 1', 'owlud1', 'Owl notes', '12|1|1|1|1')
    ];
    ﻿/* tslint:enable:max-line-length */

    const cryptoProvider = new CryptoProvider();

    Vault.repository = new FakeRepository(testCredentials, cryptoProvider, testMasterKeyBase64Encoded);
    Vault.cryptoProvider = cryptoProvider;
});

test('buildDataTable', assert => {
    assert.expect(4);
    const userId = 'user1';
    const list = testCredentials.slice(0, 3);
    const check = (row: CredentialSummary, id: string, desc: string) =>
        row.credentialid === id && row.description === desc && row.masterkey === testMasterKeyBase64Encoded && row.userid === 'user1';
    const result = Vault.buildDataTable(list, rows => {
        assert.ok(rows.length === 3);
        assert.ok(check(rows[0], 'cr1', 'Cat'));
        assert.ok(check(rows[1], 'cr2', 'Dog'));
        assert.ok(check(rows[2], 'cr3', 'Fish'));
    }, testMasterKeyBase64Encoded, userId);
});

test('changePassword', async assert => {
    assert.expect(6);
    const cryptoProvider = new CryptoProvider();
    const userId = 'user1';
    const newPassword = 'test321';
    const newMasterKey = cryptoProvider.utf8ToBase64(cryptoProvider.generateMasterKey(newPassword));
    const excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];
    const check = (c: Credential, id: string, desc: string, uname: string, pwd: string) =>
        c.CredentialID === id && c.Description === desc && c.Username === uname && c.Password === pwd && c.UserID === 'user1';

    await Vault.changePassword(userId, testMasterKeyBase64Encoded, 'test123', 'test321');

    const credentials = await Vault.repository.loadCredentialsForUserFull(userId);

    const decrypted = credentials.map(c => cryptoProvider.decryptCredential(c, newMasterKey, excludes));

    assert.ok(check(decrypted[0], 'cr1', 'Cat', 'cat', 'cat123'));
    assert.ok(check(decrypted[1], 'cr2', 'Dog', 'dog', 'dog123'));
    assert.ok(check(decrypted[2], 'cr3', 'Fish', 'fish', 'fish123'));
    assert.ok(check(decrypted[3], 'cr4', 'Catfish', 'catfish', 'catfish123'));
    assert.ok(check(decrypted[4], 'cr5', 'Dogfish', 'dogfish', 'dogfish123'));
    assert.ok(check(decrypted[5], 'cr6', 'Owl', 'owl', '_nT:NP?uovID8,TE'));
});

test('checkIf', assert => {
    const checkbox1 = $('<input type="checkbox">');
    const checkbox2 = $('<input type="checkbox" checked="checked">');
    Vault.checkIf(checkbox1, () => true);
    Vault.checkIf(checkbox2, () => false);
    assert.ok((checkbox1[0] as HTMLInputElement).checked === true);
    assert.ok((checkbox2[0] as HTMLInputElement).checked === false);
});

test('createCredentialDisplayData', assert => {
    const credential = new Credential('cr1', 'user1', 'Item Description');
    const data = Vault.createCredentialDisplayData(credential, testMasterKeyBase64Encoded, 'user1');
    assert.ok(data.credentialid === 'cr1');
    assert.ok(data.description === 'Item Description');
    assert.ok(data.userid === 'user1');
    assert.ok(data.masterkey === testMasterKeyBase64Encoded);
});

test('createCredentialFromFormFields', assert => {
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
    assert.ok(obj.CredentialID === 'CredentialID');
    assert.ok(obj.UserID === 'UserID');
    assert.ok(obj.Description === 'Description');
    assert.ok(obj.Username === 'Username');
    assert.ok(obj.Password === 'Password');
    assert.ok(obj.PwdOptions === 'PwdOptions');
    assert.ok(obj.PasswordConfirmation === 'PasswordConfirmation');
    assert.ok(obj.Url === 'Url');
    assert.ok(obj.UserDefined1Label === 'UserDefined1Label');
    assert.ok(obj.UserDefined1 === 'UserDefined1');
    assert.ok(obj.UserDefined2Label === 'UserDefined2Label');
    assert.ok(obj.UserDefined2 === 'UserDefined2');
    assert.ok(obj.Notes === 'Notes');
    assert.ok(typeof obj.chromeusername === 'undefined');
    assert.ok(typeof obj.chromepassword === 'undefined');
    assert.ok(typeof obj.submit === 'undefined');
});

test('createCredentialTable', assert => {
    Vault.uiSetup();
    const data = testCredentials.map(c => Vault.createCredentialDisplayData(c, testMasterKeyBase64Encoded, 'user1'));
    const table = $(Vault.createCredentialTable(data));
    const rows = table.filter('.row');
    assert.ok(rows.length === 6);
    assert.ok($(rows[0]).attr('id') === 'cr1');
    assert.ok($(rows[1]).find('.full').text() === 'Dog');
});

test('exportData', async assert => {
    assert.expect(6);
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

test('findIndex', assert => {
    const idx = Vault.findIndex('cr2', testCredentials);
    assert.ok(idx === 1);
    const idx2 = Vault.findIndex('not-there', testCredentials);
    assert.ok(idx2 === -1);
});

test('rateLimit', assert => {
    const done = assert.async();
    const func = Vault.rateLimit(() => {
        assert.ok(true);
        done();
    }, 100);
    func(new Event('click'));
});

test('getPasswordGenerationOptions', assert => {
    const html = '<div>'
        + '<input type="text" class="generate-password-option" id="len" name="len" value="32">'
        + '<input type="checkbox" class="generate-password-option" id="ucase" name="ucase" value="1" checked="checked">'
        + '<input type="checkbox" class="generate-password-option" id="lcase" name="lcase" value="1">'
        + '<input type="checkbox" class="generate-password-option" id="nums" name="nums" value="1" checked="checked">'
        + '<input type="checkbox" class="generate-password-option" id="symb" name="symb" value="1">'
        + '</div>';

    const el = $(html);
    const options = Vault.getPasswordGenerationOptionValues(el.find('input.generate-password-option'), Vault.isChecked);
    assert.ok(options.length === 32);
    assert.ok(options.upperCase);
    assert.ok(!options.lowerCase);
    assert.ok(options.numbers);
    assert.ok(!options.symbols);
});

test('parseImportData', assert => {
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
    const newData = Vault.parseImportData(userId, testMasterKeyBase64Encoded, importData);
    assert.ok(newData.length === 1);
    assert.ok(newData[0].UserID === userId);
    assert.ok(newData[0].CredentialID === null);
    assert.ok(!newData[0].PasswordConfirmation);
});

test('isChecked', assert => {
    const checkbox1 = $('<input type="checkbox">');
    const checkbox2 = $('<input type="checkbox" checked="checked">');
    assert.ok(Vault.isChecked(checkbox1) === false);
    assert.ok(Vault.isChecked(checkbox2) === true);
});

test('removeFromList', assert => {
    const list2 = Vault.removeFromList('cr2', testCredentials);
    assert.ok(list2.length === 5);
    assert.ok(list2[0].Description === 'Cat');
    assert.ok(list2[1].Description === 'Fish');
});

test('search', assert => {
    const noresults1 = Vault.search(null, testCredentials);
    const noresults2 = Vault.search('', testCredentials);
    const noresults3 = Vault.search('Z', testCredentials);
    assert.ok(noresults1.length === 0 && noresults2.length === 0 && noresults3.length === 0);
    const results1 = Vault.search('do', testCredentials);
    assert.ok(results1.length === 2);
    assert.ok(results1[0].Description === 'Dog');
    assert.ok(results1[1].Description === 'Dogfish');
    const results2 = Vault.search('username:dog', testCredentials);
    assert.ok(results2.length === 2);
    assert.ok(results2[0].Description === 'Dog');
    assert.ok(results2[1].Description === 'Dogfish');
    const results3 = Vault.search('password:cat', testCredentials);
    assert.ok(results3.length === 2);
    assert.ok(results3[0].Description === 'Cat');
    assert.ok(results3[1].Description === 'Catfish');
    const results4 = Vault.search('filter:all', testCredentials);
    assert.ok(results4.length === 6);
    assert.ok(results4[0].Description === 'Cat');
    assert.ok(results4[5].Description === 'Owl');
    const results5 = Vault.search('filter:weak', testCredentials);
    assert.ok(results5.length === 3);
    assert.ok(results5[0].Description === 'Cat');
    assert.ok(results5[2].Description === 'Fish');
});

test('sortCredentials', assert => {
    Vault.sortCredentials(testCredentials);
    assert.ok(testCredentials[0].Description === 'Cat');
    assert.ok(testCredentials[1].Description === 'Catfish');
    assert.ok(testCredentials[2].Description === 'Dog');
    assert.ok(testCredentials[3].Description === 'Dogfish');
    assert.ok(testCredentials[4].Description === 'Fish');
    assert.ok(testCredentials[5].Description === 'Owl');
});

test('truncate', assert => {
    const testString = 'This Is A Test';
    assert.ok(Vault.truncate(testString, 10) === 'This Is...');
    assert.ok(Vault.truncate(testString, 20) === 'This Is A Test');
});

test('updateProperties', assert => {
    const updated = Vault.updateProperties({
        Description: 'ITEM2UPDATE',
        Username: 'item2new',
        Password: 'abcd',
        Url: 'http://test4.com'
    }, testCredentials[1]);
    assert.ok(updated.Description === 'ITEM2UPDATE');
    assert.ok(updated.Username === 'item2new');
    assert.ok(updated.Password === 'abcd');
    assert.ok(updated.Url === 'http://test4.com');
});

test('validateRecord', assert => {
    const form = $('<form><input id="Description" name="Description" />' +
        '<input id="Password" name="Password" />' +
        '<input id="PasswordConfirmation" name="PasswordConfirmation" /></form>');
    form.find('#Password').val('A');
    const noDesc = Vault.validateRecord(form);
    form.find('#Description').val('A');
    const passwordNoMatch = Vault.validateRecord(form);
    form.find('#PasswordConfirmation').val('A');
    const valid = Vault.validateRecord(form);
    assert.ok(noDesc.length === 2 && noDesc[0].field.attr('id') === 'Description' && noDesc[1].field.attr('id') === 'PasswordConfirmation');
    assert.ok(passwordNoMatch.length === 1 && passwordNoMatch[0].field.attr('id') === 'PasswordConfirmation');
    assert.ok(valid.length === 0);
});
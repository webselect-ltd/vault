/// <reference types="qunit" />
/// <reference path="../types/hacks.d.ts" />
/* tslint:disable:no-console */
var testCredentialPlainText = new Credential('361fe91a-3dca-4871-b69e-c41c31507c8c', 'ef0ee37f-2ace-417c-b30d-ccfaf4450906', 'Test Credential', '_testuser123', '8{s?(\'7.171h)3H', '8{s?(\'7.171h)3H', 'http://www.test.com?id=23&param=TEST+VALUE', 'Custom 1', 'CUSTOM1', 'Custom 2', 'CUSTOM2', 'Test Notes:\n\nThese are test notes.', '16|1|1|1|1');
var testCredentialEncrypted = new Credential('361fe91a-3dca-4871-b69e-c41c31507c8c', 'ef0ee37f-2ace-417c-b30d-ccfaf4450906', 'EcOPw4TDj0gBITAhITAhLSExMCFQITEwIWJHQcK9wpJtXHQgRMKtaw==', 'EsOPw4TDj0gBITAhITAhLcKHw7LChcOKwpUHbsOIw60iYXs=', 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI', 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI', 'E8OPw4TDj0gBITAhITAhLRnDh8KUG8O5dlVZZ8OBwrwgO8KQNDctecKbM8KGworDmzoUbsOrSEnCrMKSDyMtNkhZw6/Cgyp5ZSExMiEG', 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmM=', 'FMOPw4TDj0gBITAhITAhLW88TTrDrEXDvw==', 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmA=', 'FcOPw4TDj0gBITAhITAhLcOeJDjCncKcw47DqA==', 'FcOPw4TDj0gBITAhITAhLcOJFBjCvcOzw43CtVxmwoJzw4pAw63CpcKRLSkDwpg5LiE0NSHCmwNTajjCmVbCtMKAwq0tw43CvQ==', '16|1|1|1|1');
function checkEncryption(assert, credential, masterKeyPlainText) {
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
function checkDecryption(assert, credential) {
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
var testMasterKeyBase64Encoded = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
var testMasterKeyPlainText = unescape(decodeURIComponent(atob(testMasterKeyBase64Encoded)));
var testCredentials;
QUnit.testStart(function (details) {
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
    Vault.repository = new FakeRepository(testCredentials, testMasterKeyBase64Encoded);
});
QUnit.test('base64ToUtf8', function (assert) {
    var utf8 = Vault.base64ToUtf8('VEVTVA==');
    assert.ok(utf8 === 'TEST');
});
QUnit.test('buildDataTable', function (assert) {
    assert.expect(4);
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var userId = 'user1';
    var list = testCredentials.slice(0, 3);
    var result = Vault.buildDataTable(list, function (rows) {
        assert.ok(rows.length === 3);
        assert.ok(rows[0].credentialid === 'cr1' && rows[0].description === 'Cat' && rows[0].masterkey === masterKey && rows[0].userid === 'user1');
        assert.ok(rows[1].credentialid === 'cr2' && rows[1].description === 'Dog' && rows[1].masterkey === masterKey && rows[1].userid === 'user1');
        assert.ok(rows[2].credentialid === 'cr3' && rows[2].description === 'Fish' && rows[2].masterkey === masterKey && rows[2].userid === 'user1');
    }, masterKey, userId);
});
QUnit.test('checkIf', function (assert) {
    var checkbox1 = $('<input type="checkbox">');
    var checkbox2 = $('<input type="checkbox" checked="checked">');
    Vault.checkIf(checkbox1, function () { return true; });
    Vault.checkIf(checkbox2, function () { return false; });
    assert.ok(checkbox1[0].checked === true);
    assert.ok(checkbox2[0].checked === false);
});
QUnit.test('createCredentialDisplayData', function (assert) {
    // base64encode('test123' + passpackhash('test123'))
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var credential = new Credential('cr1', 'user1', 'Item Description');
    var data = Vault.createCredentialDisplayData(credential, masterKey, 'user1');
    assert.ok(data.credentialid === 'cr1');
    assert.ok(data.description === 'Item Description');
    assert.ok(data.userid === 'user1');
    assert.ok(data.masterkey === masterKey);
});
QUnit.test('createCredentialFromFormFields', function (assert) {
    var html = '<form>'
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
    var form = $(html);
    var obj = Vault.createCredentialFromFormFields(form);
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
QUnit.test('createCredentialTable', function (assert) {
    Vault.uiSetup();
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var data = testCredentials.map(function (c) { return Vault.createCredentialDisplayData(c, masterKey, 'user1'); });
    var table = $(Vault.createCredentialTable(data));
    var rows = table.filter('.row');
    assert.ok(rows.length === 6);
    assert.ok($(rows[0]).attr('id') === 'cr1');
    assert.ok($(rows[1]).find('.full').text() === 'Dog');
});
QUnit.test('createMasterKey', function (assert) {
    assert.ok(Passpack.utils.hashx('test123' + Passpack.utils.hashx('test123', true, true), true, true) === Vault.createMasterKey('test123'));
});
QUnit.test('crypt(Passpack.encode)', function (assert) {
    var encrypted = Vault.crypt(Passpack.encode, testCredentialPlainText, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
    checkEncryption(assert, encrypted, testMasterKeyPlainText);
});
QUnit.test('crypt(Passpack.decode)', function (assert) {
    var decrypted = Vault.crypt(Passpack.decode, testCredentialEncrypted, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
    checkDecryption(assert, decrypted);
});
QUnit.test('encryptObject', function (assert) {
    var encrypted = Vault.encryptObject(testCredentialPlainText, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
    checkEncryption(assert, encrypted, testMasterKeyPlainText);
});
QUnit.test('findIndex', function (assert) {
    var idx = Vault.findIndex('cr2', testCredentials);
    assert.ok(idx === 1);
    var idx2 = Vault.findIndex('not-there', testCredentials);
    assert.ok(idx2 === -1);
});
QUnit.test('rateLimit', function (assert) {
    var done = assert.async();
    var func = Vault.rateLimit(function () {
        assert.ok(true);
        done();
    }, 100);
    func(new Event('click'));
});
QUnit.test('decryptObject', function (assert) {
    var decrypted = Vault.decryptObject(testCredentialEncrypted, testMasterKeyBase64Encoded, ['CredentialID', 'UserID']);
    checkDecryption(assert, decrypted);
});
QUnit.test('getPasswordGenerationOptions', function (assert) {
    var html = '<div>'
        + '<input type="checkbox" class="generate-password-option" id="ucase" name="ucase" value="1" checked="checked">'
        + '<input type="checkbox" class="generate-password-option" id="lcase" name="lcase" value="1">'
        + '<input type="checkbox" class="generate-password-option" id="nums" name="nums" value="1" checked="checked">'
        + '<input type="checkbox" class="generate-password-option" id="symb" name="symb" value="1">'
        + '</div>';
    var el = $(html);
    var options = Vault.getPasswordGenerationOptions(el.find('input.generate-password-option'), Vault.isChecked);
    assert.ok(options.ucase === 1);
    assert.ok(typeof options.lcase === 'undefined');
    assert.ok(options.nums === 1);
    assert.ok(typeof options.symb === 'undefined');
});
QUnit.test('getPasswordLength', function (assert) {
    var val1 = Vault.getPasswordLength(null);
    var val2 = Vault.getPasswordLength('');
    var val3 = Vault.getPasswordLength('10');
    assert.ok(val1 === 16);
    assert.ok(val2 === 16);
    assert.ok(val3 === 10);
});
QUnit.test('isChecked', function (assert) {
    var checkbox1 = $('<input type="checkbox">');
    var checkbox2 = $('<input type="checkbox" checked="checked">');
    assert.ok(Vault.isChecked(checkbox1) === false);
    assert.ok(Vault.isChecked(checkbox2) === true);
});
QUnit.test('loadCredentials', function (assert) {
    assert.expect(1);
    Vault.loadCredentials('user1', testMasterKeyBase64Encoded, function (cs) {
        assert.ok(cs.length === 6);
    });
});
QUnit.test('removeFromList', function (assert) {
    var list2 = Vault.removeFromList('cr2', testCredentials);
    assert.ok(list2.length === 5);
    assert.ok(list2[0].Description === 'Cat');
    assert.ok(list2[1].Description === 'Fish');
});
QUnit.test('search', function (assert) {
    var noresults1 = Vault.search(null, testCredentials);
    var noresults2 = Vault.search('', testCredentials);
    var noresults3 = Vault.search('Z', testCredentials);
    assert.ok(noresults1.length === 0 && noresults2.length === 0 && noresults3.length === 0);
    var results1 = Vault.search('do', testCredentials);
    assert.ok(results1.length === 2);
    assert.ok(results1[0].Description === 'Dog');
    assert.ok(results1[1].Description === 'Dogfish');
    var results2 = Vault.search('username:dog', testCredentials);
    assert.ok(results2.length === 2);
    assert.ok(results2[0].Description === 'Dog');
    assert.ok(results2[1].Description === 'Dogfish');
    var results3 = Vault.search('password:cat', testCredentials);
    assert.ok(results3.length === 2);
    assert.ok(results3[0].Description === 'Cat');
    assert.ok(results3[1].Description === 'Catfish');
    var results4 = Vault.search('filter:all', testCredentials);
    assert.ok(results4.length === 6);
    assert.ok(results4[0].Description === 'Cat');
    assert.ok(results4[5].Description === 'Owl');
    var results5 = Vault.search('filter:weak', testCredentials);
    assert.ok(results5.length === 3);
    assert.ok(results5[0].Description === 'Cat');
    assert.ok(results5[2].Description === 'Fish');
});
QUnit.test('sortCredentials', function (assert) {
    Vault.sortCredentials(testCredentials);
    assert.ok(testCredentials[0].Description === 'Cat');
    assert.ok(testCredentials[1].Description === 'Catfish');
    assert.ok(testCredentials[2].Description === 'Dog');
    assert.ok(testCredentials[3].Description === 'Dogfish');
    assert.ok(testCredentials[4].Description === 'Fish');
    assert.ok(testCredentials[5].Description === 'Owl');
});
QUnit.test('truncate', function (assert) {
    var testString = 'This Is A Test';
    assert.ok(Vault.truncate(testString, 10) === 'This Is...');
    assert.ok(Vault.truncate(testString, 20) === 'This Is A Test');
});
QUnit.test('updateProperties', function (assert) {
    var updated = Vault.updateProperties({
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
QUnit.test('utf8ToBase64', function (assert) {
    var b64 = Vault.utf8ToBase64('TEST');
    assert.ok(b64 === 'VEVTVA==');
});
QUnit.test('validateRecord', function (assert) {
    var form = $('<form><input id="Description" name="Description" />' +
        '<input id="Password" name="Password" />' +
        '<input id="PasswordConfirmation" name="PasswordConfirmation" /></form>');
    form.find('#Password').val('A');
    var noDesc = Vault.validateRecord(form);
    form.find('#Description').val('A');
    var passwordNoMatch = Vault.validateRecord(form);
    form.find('#PasswordConfirmation').val('A');
    var valid = Vault.validateRecord(form);
    assert.ok(noDesc.length === 2 && noDesc[0].field.attr('id') === 'Description' && noDesc[1].field.attr('id') === 'PasswordConfirmation');
    assert.ok(passwordNoMatch.length === 1 && passwordNoMatch[0].field.attr('id') === 'PasswordConfirmation');
    assert.ok(valid.length === 0);
});
//# sourceMappingURL=tests.js.map
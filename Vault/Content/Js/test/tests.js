/// <reference types="qunit" />
/* tslint:disable:no-console */
var TestGlobals = {
    // Vault.utf8_to_b64(Vault.createMasterKey('test123'))
    masterKey: 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==',
    masterKeyDecoded: unescape(decodeURIComponent(window.atob('JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg=='))),
    testCredential: {
        CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
        Description: 'Test Credential',
        Notes: 'Test Notes:\n\nThese are test notes.',
        Password: '8{s?(\'7.171h)3H',
        PasswordConfirmation: '8{s?(\'7.171h)3H',
        Url: 'http://www.test.com?id=23&param=TEST+VALUE',
        UserDefined1: 'CUSTOM1',
        UserDefined1Label: 'Custom 1',
        UserDefined2: 'CUSTOM2',
        UserDefined2Label: 'Custom 2',
        UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
        Username: '_testuser123'
    },
    testCredentialEncrypted: {
        CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
        Description: 'EcOPw4TDj0gBITAhITAhLSExMCFQITEwIWJHQcK9wpJtXHQgRMKtaw==',
        Notes: 'FcOPw4TDj0gBITAhITAhLcOJFBjCvcOzw43CtVxmwoJzw4pAw63CpcKRLSkDwpg5LiE0NSHCmwNTajjCmVbCtMKAwq0tw43CvQ==',
        Password: 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
        PasswordConfirmation: 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
        Url: 'E8OPw4TDj0gBITAhITAhLRnDh8KUG8O5dlVZZ8OBwrwgO8KQNDctecKbM8KGworDmzoUbsOrSEnCrMKSDyMtNkhZw6/Cgyp5ZSExMiEG',
        UserDefined1: 'FMOPw4TDj0gBITAhITAhLW88TTrDrEXDvw==',
        UserDefined1Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmM=',
        UserDefined2: 'FcOPw4TDj0gBITAhITAhLcOeJDjCncKcw47DqA==',
        UserDefined2Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmA=',
        UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
        Username: 'EsOPw4TDj0gBITAhITAhLcKHw7LChcOKwpUHbsOIw60iYXs='
    }
};
function checkEncryption(assert, credential) {
    assert.ok(credential.CredentialID === '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.ok(Passpack.decode('AES', credential.Description, TestGlobals.masterKeyDecoded) === 'Test Credential');
    assert.ok(Passpack.decode('AES', credential.Notes, TestGlobals.masterKeyDecoded) === 'Test Notes:\n\nThese are test notes.');
    assert.ok(Passpack.decode('AES', credential.Password, TestGlobals.masterKeyDecoded) === '8{s?(\'7.171h)3H');
    assert.ok(Passpack.decode('AES', credential.PasswordConfirmation, TestGlobals.masterKeyDecoded) === '8{s?(\'7.171h)3H');
    assert.ok(Passpack.decode('AES', credential.Url, TestGlobals.masterKeyDecoded) === 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.ok(Passpack.decode('AES', credential.UserDefined1, TestGlobals.masterKeyDecoded) === 'CUSTOM1');
    assert.ok(Passpack.decode('AES', credential.UserDefined1Label, TestGlobals.masterKeyDecoded) === 'Custom 1');
    assert.ok(Passpack.decode('AES', credential.UserDefined2, TestGlobals.masterKeyDecoded) === 'CUSTOM2');
    assert.ok(Passpack.decode('AES', credential.UserDefined2Label, TestGlobals.masterKeyDecoded) === 'Custom 2');
    assert.ok(credential.UserID === 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.ok(Passpack.decode('AES', credential.Username, TestGlobals.masterKeyDecoded) === '_testuser123');
}
function checkDecryption(assert, credential) {
    assert.ok(credential.CredentialID === '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.ok(credential.Description === 'Test Credential');
    assert.ok(credential.Notes === 'Test Notes:\n\nThese are test notes.');
    assert.ok(credential.Password === '8{s?(\'7.171h)3H');
    assert.ok(credential.PasswordConfirmation === '8{s?(\'7.171h)3H');
    assert.ok(credential.Url === 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.ok(credential.UserDefined1 === 'CUSTOM1');
    assert.ok(credential.UserDefined1Label === 'Custom 1');
    assert.ok(credential.UserDefined2 === 'CUSTOM2');
    assert.ok(credential.UserDefined2Label === 'Custom 2');
    assert.ok(credential.UserID === 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.ok(credential.Username === '_testuser123');
}
function getTestCredentialList() {
    return [
        new Credential('cr1', 'user1', 'Cat', 'cat', 'cat123'),
        new Credential('cr2', 'user1', 'Dog', 'dog', 'dog123'),
        new Credential('cr3', 'user1', 'Fish', 'fish', 'fish123'),
        new Credential('cr4', 'user1', 'Catfish', 'catfish', 'catfish123'),
        new Credential('cr5', 'user1', 'Dogfish', 'dogfish', 'dogfish123'),
        new Credential('cr6', 'user1', 'Owl', 'owl', '_nT:NP?uovID8,TE')
    ];
}
function getTestCredentialSummaryList(masterKey) {
    return getTestCredentialList().map(function (c) { return new CredentialSummary(c.CredentialID, masterKey, c.UserID, c.Description, c.Username, c.Password, c.Url, Passpack.utils.getBits(c.Password) < 40); });
}
QUnit.test('base64ToUtf8', function (assert) {
    var utf8 = Vault.base64ToUtf8('VEVTVA==');
    assert.ok(utf8 === 'TEST');
});
QUnit.test('buildDataTable', function (assert) {
    assert.expect(4);
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var userId = 'user1';
    var list = getTestCredentialList().slice(0, 3);
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
    var data = getTestCredentialSummaryList(masterKey);
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
    var encrypted = Vault.crypt(Passpack.encode, TestGlobals.testCredential, TestGlobals.masterKey, ['CredentialID', 'UserID']);
    checkEncryption(assert, encrypted);
});
QUnit.test('crypt(Passpack.decode)', function (assert) {
    var decrypted = Vault.crypt(Passpack.decode, TestGlobals.testCredentialEncrypted, TestGlobals.masterKey, ['CredentialID', 'UserID']);
    checkDecryption(assert, decrypted);
});
QUnit.test('encryptObject', function (assert) {
    var encrypted = Vault.encryptObject(TestGlobals.testCredential, TestGlobals.masterKey, ['CredentialID', 'UserID']);
    checkEncryption(assert, encrypted);
});
QUnit.test('findIndex', function (assert) {
    var data = getTestCredentialList();
    var idx = Vault.findIndex('cr2', data);
    assert.ok(idx === 1);
    var idx2 = Vault.findIndex('not-there', data);
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
    var decrypted = Vault.decryptObject(TestGlobals.testCredentialEncrypted, TestGlobals.masterKey, ['CredentialID', 'UserID']);
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
QUnit.test('removeFromList', function (assert) {
    var list = getTestCredentialList();
    var list2 = Vault.removeFromList('cr2', list);
    assert.ok(list2.length === 5);
    assert.ok(list2[0].Description === 'Cat');
    assert.ok(list2[1].Description === 'Fish');
});
QUnit.test('search', function (assert) {
    var list = getTestCredentialList();
    var noresults1 = Vault.search(null, list);
    var noresults2 = Vault.search('', list);
    var noresults3 = Vault.search('Z', list);
    assert.ok(noresults1.length === 0 && noresults2.length === 0 && noresults3.length === 0);
    var results1 = Vault.search('do', list);
    assert.ok(results1.length === 2);
    assert.ok(results1[0].Description === 'Dog');
    assert.ok(results1[1].Description === 'Dogfish');
    var results2 = Vault.search('username:dog', list);
    assert.ok(results2.length === 2);
    assert.ok(results2[0].Description === 'Dog');
    assert.ok(results2[1].Description === 'Dogfish');
    var results3 = Vault.search('password:cat', list);
    assert.ok(results3.length === 2);
    assert.ok(results3[0].Description === 'Cat');
    assert.ok(results3[1].Description === 'Catfish');
    var results4 = Vault.search('filter:all', list);
    assert.ok(results4.length === 6);
    assert.ok(results4[0].Description === 'Cat');
    assert.ok(results4[5].Description === 'Owl');
    var results5 = Vault.search('filter:weak', list);
    assert.ok(results5.length === 3);
    assert.ok(results5[0].Description === 'Cat');
    assert.ok(results5[2].Description === 'Fish');
});
QUnit.test('sortCredentials', function (assert) {
    var list = getTestCredentialList();
    Vault.sortCredentials(list);
    assert.ok(list[0].Description === 'Cat');
    assert.ok(list[1].Description === 'Catfish');
    assert.ok(list[2].Description === 'Dog');
    assert.ok(list[3].Description === 'Dogfish');
    assert.ok(list[4].Description === 'Fish');
    assert.ok(list[5].Description === 'Owl');
});
QUnit.test('truncate', function (assert) {
    var testString = 'This Is A Test';
    assert.ok(Vault.truncate(testString, 10) === 'This Is...');
    assert.ok(Vault.truncate(testString, 20) === 'This Is A Test');
});
QUnit.test('updateProperties', function (assert) {
    var list = getTestCredentialList();
    list[1] = Vault.updateProperties({ Description: 'ITEM2UPDATE', Username: 'item2new', Password: 'abcd', Url: 'http://test4.com' }, list[1]);
    assert.ok(list[1].Description === 'ITEM2UPDATE');
    assert.ok(list[1].Username === 'item2new');
    assert.ok(list[1].Password === 'abcd');
    assert.ok(list[1].Url === 'http://test4.com');
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
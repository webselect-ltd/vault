


//test('findIndex', assert => {
//    const idx = Vault.findIndex('cr2', testCredentials);
//    assert.ok(idx === 1);
//    const idx2 = Vault.findIndex('not-there', testCredentials);
//    assert.ok(idx2 === -1);
//});

//test('rateLimit', assert => {
//    const done = assert.async();
//    const func = Vault.rateLimit(() => {
//        assert.ok(true);
//        done();
//    }, 100);
//    func(new Event('click'));
//});

//test('getPasswordGenerationOptions', assert => {
//    const html = '<div>'
//        + '<input type="text" class="generate-password-option" id="len" name="len" value="32">'
//        + '<input type="checkbox" class="generate-password-option" id="ucase" name="ucase" value="1" checked="checked">'
//        + '<input type="checkbox" class="generate-password-option" id="lcase" name="lcase" value="1">'
//        + '<input type="checkbox" class="generate-password-option" id="nums" name="nums" value="1" checked="checked">'
//        + '<input type="checkbox" class="generate-password-option" id="symb" name="symb" value="1">'
//        + '</div>';

//    const el = $(html);
//    const options = Vault.getPasswordGenerationOptionValues(el.find('input.generate-password-option'), Vault.isChecked);
//    assert.ok(options.length === 32);
//    assert.ok(options.upperCase);
//    assert.ok(!options.lowerCase);
//    assert.ok(options.numbers);
//    assert.ok(!options.symbols);
//});

//test('parseImportData', assert => {
//    const userId = 'user1';
//    const importData = `[{
//        "CredentialID": "NEW",
//        "UserID": "user1_old",
//        "Description": "IMPORTED",
//        "Username": "im1",
//        "Password": "im123",
//        "PasswordConfirmation": "im123",
//        "Url": "http://imported.com",
//        "UserDefined1Label": "",
//        "UserDefined1": "",
//        "UserDefined2Label": "",
//        "UserDefined2": "",
//        "Notes": "",
//        "PwdOptions": ""
//    }]`;
//    const newData = Vault.parseImportData(userId, testMasterKeyBase64Encoded, importData);
//    assert.ok(newData.length === 1);
//    assert.ok(newData[0].UserID === userId);
//    assert.ok(newData[0].CredentialID === null);
//    assert.ok(!newData[0].PasswordConfirmation);
//});

//test('isChecked', assert => {
//    const checkbox1 = $('<input type="checkbox">');
//    const checkbox2 = $('<input type="checkbox" checked="checked">');
//    assert.ok(Vault.isChecked(checkbox1) === false);
//    assert.ok(Vault.isChecked(checkbox2) === true);
//});

//test('removeFromList', assert => {
//    const list2 = Vault.removeFromList('cr2', testCredentials);
//    assert.ok(list2.length === 5);
//    assert.ok(list2[0].Description === 'Cat');
//    assert.ok(list2[1].Description === 'Fish');
//});

//test('search', assert => {
//    const noresults1 = Vault.search(null, testCredentials);
//    const noresults2 = Vault.search('', testCredentials);
//    const noresults3 = Vault.search('Z', testCredentials);
//    assert.ok(noresults1.length === 0 && noresults2.length === 0 && noresults3.length === 0);
//    const results1 = Vault.search('do', testCredentials);
//    assert.ok(results1.length === 2);
//    assert.ok(results1[0].Description === 'Dog');
//    assert.ok(results1[1].Description === 'Dogfish');
//    const results2 = Vault.search('username:dog', testCredentials);
//    assert.ok(results2.length === 2);
//    assert.ok(results2[0].Description === 'Dog');
//    assert.ok(results2[1].Description === 'Dogfish');
//    const results3 = Vault.search('password:cat', testCredentials);
//    assert.ok(results3.length === 2);
//    assert.ok(results3[0].Description === 'Cat');
//    assert.ok(results3[1].Description === 'Catfish');
//    const results4 = Vault.search('filter:all', testCredentials);
//    assert.ok(results4.length === 6);
//    assert.ok(results4[0].Description === 'Cat');
//    assert.ok(results4[5].Description === 'Owl');
//    const results5 = Vault.search('filter:weak', testCredentials);
//    assert.ok(results5.length === 3);
//    assert.ok(results5[0].Description === 'Cat');
//    assert.ok(results5[2].Description === 'Fish');
//});

//test('sortCredentials', assert => {
//    Vault.sortCredentials(testCredentials);
//    assert.ok(testCredentials[0].Description === 'Cat');
//    assert.ok(testCredentials[1].Description === 'Catfish');
//    assert.ok(testCredentials[2].Description === 'Dog');
//    assert.ok(testCredentials[3].Description === 'Dogfish');
//    assert.ok(testCredentials[4].Description === 'Fish');
//    assert.ok(testCredentials[5].Description === 'Owl');
//});

//test('truncate', assert => {
//    const testString = 'This Is A Test';
//    assert.ok(Vault.truncate(testString, 10) === 'This Is...');
//    assert.ok(Vault.truncate(testString, 20) === 'This Is A Test');
//});

//test('updateProperties', assert => {
//    const updated = Vault.updateProperties({
//        Description: 'ITEM2UPDATE',
//        Username: 'item2new',
//        Password: 'abcd',
//        Url: 'http://test4.com'
//    }, testCredentials[1]);
//    assert.ok(updated.Description === 'ITEM2UPDATE');
//    assert.ok(updated.Username === 'item2new');
//    assert.ok(updated.Password === 'abcd');
//    assert.ok(updated.Url === 'http://test4.com');
//});

//test('validateRecord', assert => {
//    const form = $('<form><input id="Description" name="Description" />' +
//        '<input id="Password" name="Password" />' +
//        '<input id="PasswordConfirmation" name="PasswordConfirmation" /></form>');
//    form.find('#Password').val('A');
//    const noDesc = Vault.validateRecord(form);
//    form.find('#Description').val('A');
//    const passwordNoMatch = Vault.validateRecord(form);
//    form.find('#PasswordConfirmation').val('A');
//    const valid = Vault.validateRecord(form);
//    assert.ok(noDesc.length === 2 && noDesc[0].field.attr('id') === 'Description' && noDesc[1].field.attr('id') === 'PasswordConfirmation');
//    assert.ok(passwordNoMatch.length === 1 && passwordNoMatch[0].field.attr('id') === 'PasswordConfirmation');
//    assert.ok(valid.length === 0);
//});

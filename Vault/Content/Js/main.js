/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="handlebars" />
/// <reference types="js-cookie" />
/// <reference path="types/passpack.d.ts" />
/// <reference path="types/hacks.d.ts" />
var Vault;
(function (Vault) {
    var weakPasswordThreshold = 40; // Bit value below which password is deemed weak
    var cachedList = []; // Hold the credential summary list in memory to avoid requerying/decrypting after save
    var internal = {
        basePath: null,
        masterKey: '',
        password: '',
        userId: '' // GUID identifying logged-in user
    };
    // A map of the properties which can be searched for using the fieldName:query syntax
    // We need this because the search is not case-sensitive, whereas JS properties are!
    var queryablePropertyMap = {
        description: 'Description',
        username: 'Username',
        password: 'Password',
        url: 'Url',
        filter: 'FILTER'
    };
    var ui = {
        loginFormDialog: null,
        loginForm: null,
        container: null,
        controls: null,
        modal: null,
        modalContent: null,
        records: null,
        newButton: null,
        adminButton: null,
        clearSearchButton: null,
        searchInput: null,
        spinner: null
    };
    var templates = {
        urlLink: null,
        urlText: null,
        detail: null,
        credentialForm: null,
        deleteConfirmationDialog: null,
        optionsDialog: null,
        credentialTable: null,
        credentialTableRow: null,
        validationMessage: null,
        modalHeader: null,
        modalBody: null,
        modalFooter: null,
        copyLink: null,
        exportedDataWindow: null
    };
    // Decode Base64 string
    function base64ToUtf8(str) {
        return unescape(decodeURIComponent(atob(str)));
    }
    Vault.base64ToUtf8 = base64ToUtf8;
    // Build the data table
    function buildDataTable(data, callback, masterKey, userId) {
        // Create a table row for each record and add it to the rows array
        var rows = data.map(function (item) { return createCredentialDisplayData(item, masterKey, userId); });
        // Fire the callback and pass it the array of rows
        callback(rows);
    }
    Vault.buildDataTable = buildDataTable;
    // Change the password and re-encrypt all credentials with the new password
    function changePassword(userId, masterKey, oldPassword, newPassword, onUpdated) {
        var newPasswordHash = Passpack.utils.hashx(newPassword);
        var newMasterKey = utf8ToBase64(createMasterKey(newPassword));
        // Get all the credentials, decrypt each with the old password
        // and re-encrypt it with the new one
        Vault.repository.loadCredentialsForUserFull(userId, function (data) {
            var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];
            var reEncrypt = function (item) { return encryptObject(decryptObject(item, masterKey, excludes), newMasterKey, excludes); };
            var newData = data.map(reEncrypt);
            Vault.repository.updateMultiple(newData, function () {
                // Store the new password in hashed form
                Vault.repository.updatePassword(userId, Passpack.utils.hashx(oldPassword), newPasswordHash, onUpdated);
            });
        });
    }
    Vault.changePassword = changePassword;
    function checkIf(el, condition) {
        el[0].checked = condition();
    }
    Vault.checkIf = checkIf;
    // Show delete confirmation dialog
    function confirmDelete(id, masterKey) {
        showModal({
            title: 'Delete Credential',
            content: templates.deleteConfirmationDialog(),
            showDelete: true,
            deleteText: 'Yes, Delete This Credential',
            ondelete: function (e) {
                e.preventDefault();
                deleteCredential(id, internal.userId, masterKey);
            }
        });
    }
    // Create a single table row for a credential
    function createCredentialDisplayData(credential, masterKey, userId) {
        return {
            credentialid: credential.CredentialID,
            masterkey: masterKey,
            userid: userId,
            description: credential.Description,
            username: credential.Username,
            password: credential.Password,
            url: credential.Url,
            weak: $.trim(credential.Password) !== '' && Passpack.utils.getBits(credential.Password) < weakPasswordThreshold
        };
    }
    Vault.createCredentialDisplayData = createCredentialDisplayData;
    function createCredentialFromFormFields(form) {
        var obj = {};
        // Serialize the form inputs into an object
        form.find('input:not(.submit, .chrome-autocomplete-fake), textarea').each(function (i, el) {
            obj[el.name] = $(el).val();
        });
        return obj;
    }
    Vault.createCredentialFromFormFields = createCredentialFromFormFields;
    // Create the credential table
    function createCredentialTable(rows) {
        return templates.credentialTable({ rows: rows });
    }
    Vault.createCredentialTable = createCredentialTable;
    function createMasterKey(password) {
        return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
    }
    Vault.createMasterKey = createMasterKey;
    /**
     * Encrypt/decrypt the properties of an object literal using Passpack.
     * @param {IPasspackCryptoFunction} action - The Passpack function to use for encryption/decryption
     * @param {any} obj - The object literal to be encrypted/decrypted
     * @param {string} masterKey - A Passpack master key
     * @param {string[]} excludes - An array of object property names whose values should not be encrypted
     * @returns {Credential}
     */
    function crypt(action, obj, masterKey, excludes) {
        var newCredential = {};
        Object.keys(obj).forEach(function (k) {
            if (excludes.indexOf(k) === -1) {
                newCredential[k] = action('AES', obj[k], base64ToUtf8(masterKey));
            }
            else {
                newCredential[k] = obj[k];
            }
        });
        return newCredential;
    }
    Vault.crypt = crypt;
    function decryptObject(obj, masterKey, excludes) {
        return crypt(Passpack.decode, obj, masterKey, excludes);
    }
    Vault.decryptObject = decryptObject;
    function encryptObject(obj, masterKey, excludes) {
        return crypt(Passpack.encode, obj, masterKey, excludes);
    }
    Vault.encryptObject = encryptObject;
    // Default action for modal accept button
    function defaultAcceptAction(e) {
        e.preventDefault();
        ui.modal.modal('hide');
    }
    // Default action for modal close button
    function defaultCloseAction(e) {
        e.preventDefault();
        ui.modal.modal('hide');
    }
    // Delete a record
    function deleteCredential(credentialId, userId, masterKey) {
        Vault.repository.deleteCredential(userId, credentialId, function (data) {
            if (data.Success) {
                // Remove the deleted item from the cached list before reload
                cachedList = removeFromList(credentialId, cachedList);
                // For now we just reload the entire table in the background
                loadCredentials(userId, masterKey, function () {
                    ui.modal.modal('hide');
                    var results = search(ui.searchInput.val(), cachedList);
                    buildDataTable(results, function (rows) {
                        ui.container.html(createCredentialTable(rows));
                    }, masterKey, userId);
                });
            }
        });
    }
    // Export all credential data as JSON
    function exportData(userId, masterKey, onDecrypted) {
        // Get all the credentials, decrypt each one
        Vault.repository.loadCredentialsForUserFull(userId, function (data) {
            var exportItems = data.map(function (item) {
                var o = decryptObject(item, masterKey, ['CredentialID', 'UserID', 'PasswordConfirmation']);
                delete o.PasswordConfirmation; // Remove the password confirmation as it's not needed for export
                return o;
            });
            onDecrypted(exportItems);
        });
    }
    Vault.exportData = exportData;
    // Find the index of a credential within an array
    function findIndex(id, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].CredentialID === id) {
                return i;
            }
        }
        return -1;
    }
    Vault.findIndex = findIndex;
    function getPasswordLength(val) {
        var len = parseInt(val, 10);
        return isNaN(len) ? 16 : len;
    }
    Vault.getPasswordLength = getPasswordLength;
    function getPasswordGenerationOptions(inputs, predicate) {
        var options = {};
        inputs.each(function (i, el) {
            var checkbox = $(el);
            if (predicate(checkbox)) {
                options[checkbox.attr('name')] = 1;
            }
        });
        return options;
    }
    Vault.getPasswordGenerationOptions = getPasswordGenerationOptions;
    // Import unencrypted JSON credential data
    function importData(userId, masterKey, rawData) {
        var jsonImportData = JSON.parse(rawData);
        var excludes = ['CredentialID', 'UserID'];
        var newData = jsonImportData.map(function (item) {
            // Remove the confirmation property
            delete item.PasswordConfirmation;
            // Null out the old credential ID so UpdateMultiple knows this is a new record
            item.CredentialID = null;
            // Set the user ID to the ID of the new (logged in) user
            item.UserID = userId;
            return encryptObject(item, base64ToUtf8(masterKey), excludes);
        });
        Vault.repository.updateMultiple(newData, function () {
            // Just reload the whole page when we're done to force login
            location.href = internal.basePath.length > 1 ? internal.basePath.slice(0, -1) : internal.basePath;
        });
    }
    Vault.importData = importData;
    function isChecked(el) {
        return el[0].checked;
    }
    Vault.isChecked = isChecked;
    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    function loadCredential(credentialId, masterKey) {
        if (credentialId !== null) {
            Vault.repository.loadCredential(credentialId, function (data) {
                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = decryptObject(data, masterKey, ['CredentialID', 'UserID']);
                showModal({
                    title: 'Edit Credential',
                    content: templates.credentialForm(data),
                    showAccept: true,
                    acceptText: 'Save',
                    onaccept: function () {
                        $('#credential-form').submit();
                    }
                });
                ui.modal.find('#Description').focus();
                showPasswordStrength(ui.modal.find('#Password'));
                setPasswordOptions(ui.modal, data.PwdOptions);
            });
        }
        else {
            showModal({
                title: 'Add Credential',
                content: templates.credentialForm({ UserID: internal.userId }),
                showAccept: true,
                acceptText: 'Save',
                onaccept: function () {
                    $('#credential-form').submit();
                }
            });
            ui.modal.find('#Description').focus();
            showPasswordStrength(ui.modal.find('#Password'));
        }
    }
    // Load all records for a specific user
    function loadCredentials(userId, masterKey, callback) {
        if (cachedList !== null && cachedList.length) {
            buildDataTable(cachedList, callback, masterKey, userId);
        }
        else {
            Vault.repository.loadCredentialsForUser(userId, function (data) {
                // At this point we only actually need to decrypt a few things for display/search
                // which speeds up client-side table construction time dramatically
                var items = data.map(function (item) {
                    return decryptObject(item, masterKey, ['CredentialID', 'UserID']);
                });
                // Cache the whole (decrypted) list on the client
                cachedList = items;
                sortCredentials(cachedList);
                buildDataTable(cachedList, callback, masterKey, userId);
            });
        }
    }
    Vault.loadCredentials = loadCredentials;
    // Show the options dialog
    function optionsDialog() {
        var dialogHtml = templates.optionsDialog({
            userid: internal.userId,
            masterkey: utf8ToBase64(internal.masterKey)
        });
        showModal({
            title: 'Admin',
            content: dialogHtml
        });
    }
    // Rate-limit calls to the supplied function
    function rateLimit(func, wait) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            var later = function () {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    Vault.rateLimit = rateLimit;
    // Remove the credential with a specific ID from an array
    function removeFromList(id, list) {
        return list.filter(function (item) { return item.CredentialID !== id; });
    }
    Vault.removeFromList = removeFromList;
    // Hide credential rows which don't contain a particular string
    function search(query, list) {
        var results = [];
        var queryField;
        var queryData;
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
                }
                else if (query === 'weak') {
                    results = list.filter(function (item) {
                        var pwd = item.Password;
                        return pwd && Passpack.utils.getBits(pwd) <= weakPasswordThreshold;
                    });
                }
            }
            else {
                results = list.filter(function (item) {
                    return item[queryField].toLowerCase().indexOf(query) > -1;
                });
            }
        }
        return results;
    }
    Vault.search = search;
    function setPasswordOptions(form, opts) {
        var optArray = opts.split('|');
        form.find('[name=len]').val(optArray[0]);
        checkIf(form.find('[name=ucase]'), function () { return optArray[1] === '1'; });
        checkIf(form.find('[name=lcase]'), function () { return optArray[2] === '1'; });
        checkIf(form.find('[name=nums]'), function () { return optArray[3] === '1'; });
        checkIf(form.find('[name=symb]'), function () { return optArray[4] === '1'; });
    }
    // Show the read-only details modal
    function showDetail(credentialId, masterKey) {
        Vault.repository.loadCredential(credentialId, function (data) {
            // CredentialID and UserID are not currently encrypted so don't try to decode them
            data = decryptObject(data, masterKey, ['CredentialID', 'UserID']);
            // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
            var urlText = templates.urlText({ Url: data.Url });
            var urlHtml = data.Url.indexOf('//') === -1 ? urlText : templates.urlLink({ Url: data.Url, UrlText: urlText });
            var detailHtml = templates.detail({
                Url: data.Url,
                UrlHtml: urlHtml,
                Username: data.Username,
                Password: data.Password,
                UserDefined1: data.UserDefined1,
                UserDefined1Label: data.UserDefined1Label,
                UserDefined2: data.UserDefined2,
                UserDefined2Label: data.UserDefined2Label,
                Notes: data.Notes
            });
            showModal({
                credentialId: credentialId,
                title: data.Description,
                content: detailHtml,
                showEdit: true,
                showDelete: true,
                onedit: function () { return loadCredential(credentialId, masterKey); },
                ondelete: function () { return confirmDelete(credentialId, masterKey); }
            });
        });
    }
    // Show a Bootstrap modal with options as below
    // let modalOptions = {
    //     credentialId: '9c75660b-13ae-4c4f-b1d7-6770498a2466',
    //     title: 'TEST',
    //     content: '<p>TEST</p>',
    //     showAccept: true,
    //     showClose: true,
    //     showEdit: true,
    //     showDelete: true,
    //     acceptText: 'OK',
    //     accept: function() {}
    //     closeText: 'Close',
    //     close: function() {}
    //     editText: 'Edit',
    //     edit: function() {}
    //     deleteText: 'Delete',
    //     delete: function() {}
    // };
    function showModal(options) {
        var showAccept = options.showAccept || false;
        var showClose = options.showClose || true;
        var showEdit = options.showEdit || false;
        var showDelete = options.showDelete || false;
        var html = templates.modalHeader({
            title: options.title,
            closeText: options.closeText || 'Close',
            showAccept: showAccept,
            showClose: showClose,
            showEdit: showEdit,
            showDelete: showDelete
        }) + templates.modalBody({
            content: options.content
        });
        if (showAccept || showClose || showEdit || showDelete) {
            html += templates.modalFooter({
                credentialId: options.credentialId,
                acceptText: options.acceptText || 'OK',
                closeText: options.closeText || 'Close',
                editText: options.editText || 'Edit',
                deleteText: options.deleteText || 'Delete',
                showAccept: showAccept,
                showClose: showClose,
                showEdit: showEdit,
                showDelete: showDelete
            });
        }
        ui.modalContent.html(html);
        ui.modal.off('click', 'button.btn-accept');
        ui.modal.off('click', 'button.btn-close');
        ui.modal.off('click', 'button.btn-edit');
        ui.modal.off('click', 'button.btn-delete');
        ui.modal.on('click', 'button.btn-accept', options.onaccept || defaultAcceptAction);
        ui.modal.on('click', 'button.btn-close', options.onclose || defaultCloseAction);
        ui.modal.on('click', 'button.btn-edit', options.onedit || (function () { return alert('NOT BOUND'); }));
        ui.modal.on('click', 'button.btn-delete', options.ondelete || (function () { return alert('NOT BOUND'); }));
        ui.modal.modal();
    }
    // Show password strength visually
    function showPasswordStrength(field) {
        var strengthIndicator = field.next('div.password-strength');
        var status = strengthIndicator.find('> span');
        var bar = strengthIndicator.find('> div');
        var strength = Passpack.utils.getBits(field.val());
        bar.removeClass();
        if (strength === 0) {
            status.html('No Password');
            bar.css('width', 0);
        }
        else if (strength <= 100) {
            bar.css('width', strength + '%');
            if (strength <= 10) {
                bar.addClass('extremely-weak');
                status.html('Extremely Weak (' + strength + ')');
            }
            else if (strength <= 25) {
                bar.addClass('very-weak');
                status.html('Very Weak (' + strength + ')');
            }
            else if (strength <= weakPasswordThreshold) {
                bar.addClass('weak');
                status.html('Weak (' + strength + ')');
            }
            else if (strength <= 55) {
                bar.addClass('average');
                status.html('Average (' + strength + ')');
            }
            else if (strength <= 75) {
                bar.addClass('strong');
                status.html('Strong (' + strength + ')');
            }
            else {
                bar.addClass('very-strong');
                status.html('Very Strong (' + strength + ')');
            }
        }
        else {
            bar.addClass('extremely-strong');
            status.html('Extremely Strong (' + strength + ')');
            bar.css('width', '100%');
        }
    }
    // Sort credentials alphabetically by description
    function sortCredentials(credentials) {
        credentials.sort(function (a, b) {
            var desca = a.Description.toUpperCase();
            var descb = b.Description.toUpperCase();
            return desca < descb ? -1 : desca > descb ? 1 : 0;
        });
    }
    Vault.sortCredentials = sortCredentials;
    // Truncate a string at a specified length
    function truncate(str, len) {
        return str.length > len ? str.substring(0, len - 3) + '...' : str;
    }
    Vault.truncate = truncate;
    // Update properties of the item with a specific ID in a list
    function updateProperties(properties, credential) {
        return $.extend({}, credential, properties);
    }
    Vault.updateProperties = updateProperties;
    // Encode string to Base64
    function utf8ToBase64(str) {
        return btoa(encodeURIComponent(escape(str)));
    }
    Vault.utf8ToBase64 = utf8ToBase64;
    // Validate a credential record form
    function validateRecord(f) {
        var errors = [];
        var description = f.find('#Description');
        var password = f.find('#Password');
        var passwordConfirmation = f.find('#PasswordConfirmation');
        if (description.val() === '') {
            errors.push({ field: description, msg: 'You must fill in a Description' });
        }
        // We don't mind if these are blank, but they must be the same!
        if (password.val() !== passwordConfirmation.val()) {
            errors.push({ field: passwordConfirmation, msg: 'Password confirmation does not match' });
        }
        return errors;
    }
    Vault.validateRecord = validateRecord;
    function uiSetup() {
        // Cache UI selectors
        ui.loginFormDialog = $('#login-form-dialog');
        ui.loginForm = $('#login-form');
        ui.container = $('#container');
        ui.controls = $('#controls');
        ui.modal = $('#modal');
        ui.modalContent = $('#modal-content');
        ui.newButton = $('#new');
        ui.adminButton = $('#admin');
        ui.clearSearchButton = $('#clear-search');
        ui.searchInput = $('#search');
        ui.spinner = $('#spinner');
        templates.urlLink = Handlebars.compile($('#tmpl-urllink').html());
        templates.urlText = Handlebars.compile($('#tmpl-urltext').html());
        templates.detail = Handlebars.compile($('#tmpl-detail').html());
        templates.credentialForm = Handlebars.compile($('#tmpl-credentialform').html());
        templates.deleteConfirmationDialog = Handlebars.compile($('#tmpl-deleteconfirmationdialog').html());
        templates.optionsDialog = Handlebars.compile($('#tmpl-optionsdialog').html());
        templates.exportedDataWindow = Handlebars.compile($('#tmpl-exporteddatawindow').html());
        templates.credentialTable = Handlebars.compile($('#tmpl-credentialtable').html());
        templates.credentialTableRow = Handlebars.compile($('#tmpl-credentialtablerow').html());
        templates.validationMessage = Handlebars.compile($('#tmpl-validationmessage').html());
        templates.modalHeader = Handlebars.compile($('#tmpl-modalheader').html());
        templates.modalBody = Handlebars.compile($('#tmpl-modalbody').html());
        templates.modalFooter = Handlebars.compile($('#tmpl-modalfooter').html());
        templates.copyLink = Handlebars.compile($('#tmpl-copylink').html());
        Handlebars.registerPartial('credentialtablerow', templates.credentialTableRow);
        Handlebars.registerPartial('copylink', templates.copyLink);
        Handlebars.registerHelper('breaklines', function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br />');
            return new Handlebars.SafeString(text);
        });
        Handlebars.registerHelper('truncate', function (text, size) {
            text = text.length > size ? text.substring(0, size - 3) + '...' : text;
            text = Handlebars.Utils.escapeExpression(text);
            return new Handlebars.SafeString(text);
        });
    }
    Vault.uiSetup = uiSetup;
    // Initialise the app
    function init(basePath, devMode) {
        // Set the base path for AJAX requests/redirects
        internal.basePath = basePath;
        Vault.repository = new Repository(internal.basePath);
        uiSetup();
        ui.container.on('click', '.btn-credential-show-detail', function (e) {
            e.preventDefault();
            var id = $(e.currentTarget).parent().parent().attr('id');
            showDetail(id, internal.masterKey);
        });
        ui.newButton.on('click', function (e) {
            e.preventDefault();
            loadCredential(null, internal.masterKey);
        });
        ui.adminButton.on('click', function (e) {
            e.preventDefault();
            optionsDialog();
        });
        ui.clearSearchButton.on('click', function (e) {
            e.preventDefault();
            var results = search(null, cachedList);
            buildDataTable(results, function (rows) {
                ui.container.html(createCredentialTable(rows));
            }, internal.masterKey, internal.userId);
            ui.searchInput.val('').focus();
        });
        ui.searchInput.on('keyup', rateLimit(function (e) {
            var results = search(e.currentTarget.value, cachedList);
            buildDataTable(results, function (rows) {
                ui.container.html(createCredentialTable(rows));
            }, internal.masterKey, internal.userId);
        }, 200));
        // Initialise globals and load data on correct login
        ui.loginForm.on('submit', function (e) {
            e.preventDefault();
            var username = ui.loginForm.find('#UN1209').val();
            var password = ui.loginForm.find('#PW9804').val();
            Vault.repository.login(Passpack.utils.hashx(username), Passpack.utils.hashx(password), function (data) {
                // If the details were valid
                if (data.result === 1 && data.id !== '') {
                    // Set some private variables so that we can reuse them for encryption during this session
                    internal.userId = data.id;
                    internal.password = password;
                    internal.masterKey = utf8ToBase64(createMasterKey(internal.password));
                    loadCredentials(internal.userId, internal.masterKey, function () {
                        // Successfully logged in. Hide the login form
                        ui.loginForm.hide();
                        ui.loginFormDialog.modal('hide');
                        ui.controls.show();
                        ui.searchInput.focus();
                    });
                }
            });
        });
        // Save the new details on edit form submit
        $('body').on('submit', '#credential-form', function (e) {
            e.preventDefault();
            var form = $(e.currentTarget);
            var errorMsg = [];
            $('#validation-message').remove();
            form.find('div.has-error').removeClass('has-error');
            var errors = validateRecord(form);
            if (errors.length > 0) {
                errors.forEach(function (error) {
                    errorMsg.push(error.msg);
                    error.field.parent().parent().addClass('has-error');
                });
                ui.modal.find('div.modal-body').prepend(templates.validationMessage({ errors: errorMsg.join('<br />') }));
                return;
            }
            var credential = createCredentialFromFormFields(form);
            // Hold the modified properties so we can update the list if the update succeeds
            var properties = {
                Description: form.find('#Description').val(),
                Username: form.find('#Username').val(),
                Password: form.find('#Password').val(),
                Url: form.find('#Url').val()
            };
            // CredentialID and UserID are not currently encrypted so don't try to decode them
            credential = encryptObject(credential, internal.masterKey, ['CredentialID', 'UserID']);
            Vault.repository.updateCredential(credential, function (data) {
                var idx = findIndex(data.CredentialID, cachedList);
                if (idx === -1) {
                    cachedList.push($.extend({ CredentialID: data.CredentialID, UserID: internal.userId }, properties));
                }
                else {
                    cachedList[idx] = updateProperties(properties, cachedList[idx]);
                }
                // Re-sort the list in case the order should change
                sortCredentials(cachedList);
                // For now we just reload the entire table in the background
                loadCredentials(internal.userId, internal.masterKey, function () {
                    var results = search(ui.searchInput.val(), cachedList);
                    ui.modal.modal('hide');
                    buildDataTable(results, function (rows) {
                        ui.container.html(createCredentialTable(rows));
                    }, internal.masterKey, internal.userId);
                });
            });
            return;
        });
        // Show password strength as it is typed
        $('body').on('keyup', '#Password', rateLimit(function (e) {
            showPasswordStrength($(e.currentTarget));
        }));
        // Generate a nice strong password
        $('body').on('click', 'button.generate-password', function (e) {
            e.preventDefault();
            var passwordOptions = getPasswordGenerationOptions($('input.generate-password-option'), isChecked);
            var passwordLength = getPasswordLength($('#len').val());
            var password = Passpack.utils.passGenerator(passwordOptions, passwordLength);
            $('#Password').val(password);
            $('#PasswordConfirmation').val(password);
            var opts = [$('#len').val(),
                isChecked($('#ucase')) ? 1 : 0,
                isChecked($('#lcase')) ? 1 : 0,
                isChecked($('#nums')) ? 1 : 0,
                isChecked($('#symb')) ? 1 : 0];
            $('#PwdOptions').val(opts.join('|'));
            showPasswordStrength($('#Password'));
        });
        // Toggle password generation option UI visibility
        $('body').on('click', 'a.generate-password-options-toggle', function (e) {
            e.preventDefault();
            $('div.generate-password-options').toggle();
        });
        // Copy content to clipboard when copy icon is clicked
        $('body').on('click', 'a.copy-link', function (e) {
            e.preventDefault();
            var a = $(e.currentTarget);
            $('a.copy-link').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');
            a.next('input.copy-content').select();
            try {
                if (document.execCommand('copy')) {
                    a.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
                }
            }
            catch (ex) {
                alert('Copy operation is not supported by the current browser: ' + ex.message);
            }
        });
        $('body').on('click', 'button.btn-credential-open', function (e) {
            e.preventDefault();
            open($(e.currentTarget).data('url'));
        });
        $('body').on('click', 'button.btn-credential-copy', function (e) {
            e.preventDefault();
            var allButtons = $('button.btn-credential-copy');
            var button = $(e.currentTarget);
            allButtons.removeClass('btn-success').addClass('btn-primary');
            allButtons.find('span').addClass('fa-clone').removeClass('fa-check-square');
            button.next('input.copy-content').select();
            try {
                if (document.execCommand('copy')) {
                    button.addClass('btn-success').removeClass('btn-primary');
                    button.find('span').removeClass('fa-clone').addClass('fa-check-square');
                }
            }
            catch (ex) {
                alert('Copy operation is not supported by the current browser: ' + ex.message);
            }
        });
        // Automatically focus the search field if a key is pressed from the credential list
        $('body').on('keydown', function (e) {
            var event = e;
            var eventTarget = e.target;
            if (eventTarget.nodeName === 'BODY') {
                e.preventDefault();
                // Cancel the first mouseup event which will be fired after focus
                ui.searchInput.one('mouseup', function (me) {
                    me.preventDefault();
                });
                ui.searchInput.focus();
                var char = String.fromCharCode(event.keyCode);
                if (/[a-zA-Z0-9]/.test(char)) {
                    ui.searchInput.val(event.shiftKey ? char : char.toLowerCase());
                }
                else {
                    ui.searchInput.select();
                }
            }
        });
        $('body').on('click', '#change-password-button', function (e) {
            var newPassword = $('#NewPassword').val();
            var newPasswordConfirm = $('#NewPasswordConfirm').val();
            var confirmationMsg = 'When the password change is complete you will be logged out and will need to log back in.\n\n'
                + 'Are you SURE you want to change the master password?';
            if (newPassword === '') {
                alert('Password cannot be left blank.');
                return;
            }
            if (newPassword !== newPasswordConfirm) {
                alert('Password confirmation does not match password.');
                return;
            }
            if (!confirm(confirmationMsg)) {
                return;
            }
            changePassword(internal.userId, internal.masterKey, internal.password, newPassword, function () {
                // Just reload the whole page when we're done to force login
                location.href = internal.basePath.length > 1 ? internal.basePath.slice(0, -1) : internal.basePath;
            });
        });
        var openExportPopup = function (data) {
            var exportWindow = open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
            if (exportWindow && exportWindow.top) {
                exportWindow.document.write(templates.exportedDataWindow({ json: JSON.stringify(data, undefined, 4) }));
            }
            else {
                alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
            }
        };
        $('body').on('click', '#export-button', function (e) {
            e.preventDefault();
            exportData(internal.userId, internal.masterKey, openExportPopup);
        });
        // If we're in dev mode, automatically log in with a cookie manually created on the dev machine
        if (devMode) {
            ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
            ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
            ui.loginForm.submit();
        }
        else {
            ui.loginForm.find('#UN1209').focus();
        }
    }
    Vault.init = init;
})(Vault || (Vault = {}));
//# sourceMappingURL=main.js.map
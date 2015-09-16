//////////////////////////////////////////////////////////////////////////////////
// Vault client app code
//////////////////////////////////////////////////////////////////////////////////

var Vault = (function ($, Passpack, Handlebars, Cookies, window, document, undefined) {
    'use strict';
    // Private member variables
    var _userId = '', // GUID identifying logged-in user
    _username = '', // Current user's username
    _password = '', // Current user's password
    _masterKey = '', // Master key for Passpack encryption (Base64 encoded hash of (password + hashed pasword))
    _artificialAjaxDelay = false, // Introduce an artificial delay for AJAX calls so we can test loaders locally
    _cachedList = [], // Hold the list of credential summaries in memory to avoid requerying and decrypting after each save
    _weakPasswordThreshold = 40, // Bit value below which password is deemed weak
    _basePath = null,
    // A map of the properties which can be searched for using the fieldName:query syntax
    // We need this because the search is not case-sensitive, whereas JS properties are!
    _queryablePropertyMap = {
        description: 'Description',
        username: 'Username',
        password: 'Password',
        url: 'Url',
        filter: 'FILTER'
    },
    _ui = {
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
    },
    _templates = {
        urlLink: null,
        urlText: null,
        detail: null,
        credentialForm: null,
        deleteConfirmationDialog: null,
        optionsDialog: null,
        expouserrtedDataWindow: null,
        credentialTable: null,
        credentialTableRow: null,
        validationMessage: null,
        modalHeader: null,
        modalBody: null,
        modalFooter: null
    };

    // Encrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    var _encryptObject = function (obj, masterKey, excludes) {
        for (var p in obj) {
            if (!_contains(excludes, p)) {
                obj[p] = Passpack.encode('AES', obj[p], _b64_to_utf8(masterKey));
            }
        }
        return obj;
    };

    // Decrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    var _decryptObject = function (obj, masterKey, excludes) {
        for (var p in obj) {
            if (!_contains(excludes, p)) {
                obj[p] = Passpack.decode('AES', obj[p], _b64_to_utf8(masterKey));
            }
        }
        return obj;
    };

    // Remove the item with a specific ID from an array
    var _removeFromList = function (id, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].CredentialID === id) {
                list.splice(i, 1);
            }
        }
    };

    // Update properties of the item with a specific ID in a list
    var _updateProperties = function (id, properties, userId, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].CredentialID === id) {
                for (var propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName)) {
                        list[i][propertyName] = properties[propertyName];
                    }
                }
                return;
            }
        }
        list.push($.extend({ CredentialID: id, UserID: userId }, properties));
    };

    var _defaultAjaxErrorCallback = function (request, status, error) {
        return alert('Http Error: ' + status + ' - ' + error);
    };

    var _ajaxPost = function (url, data, successCallback, errorCallback, contentType) {
        _ui.spinner.show();

        if (typeof errorCallback === 'undefined' || errorCallback === null) {
            errorCallback = _defaultAjaxErrorCallback;
        }

        var options = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) { _ui.spinner.hide(); successCallback(data, status, request); },
            error: function (request, status, error) { _ui.spinner.hide(); errorCallback(request, status, error); }
        };

        if (typeof contentType !== 'undefined') {
            options.contentType = contentType;
        }

        if (!_artificialAjaxDelay) {
            $.ajax(options);
        } else {
            setTimeout(function () {
                $.ajax(options);
            }, 2000);
        }
    };

    // Load all records for a specific user
    var _loadCredentials = function (userId, masterKey, callback) {
        if (_cachedList !== null && _cachedList.length) {
            _buildDataTable(_cachedList, callback, masterKey, userId);
        } else {
            _ajaxPost(_basePath + 'Main/GetAll', { userId: userId }, function (data, status, request) {
                var items = [];
                // At this point we only actually need to decrypt a few things for display/search
                // which speeds up client-side table construction time dramatically
                $.each(data, function (i, item) {
                    items.push(_decryptObject(item, masterKey, ['CredentialID', 'UserID']));
                });
                // Cache the whole (decrypted) list on the client
                _cachedList = items;
                _sortCredentials(_cachedList);
                _buildDataTable(_cachedList, callback, masterKey, userId);
            });
        }
    };

    // Show the read-only details modal
    var _showDetail = function (credentialId, masterKey) {
        _ajaxPost(_basePath + 'Main/Load', { id: credentialId }, function (data, status, request) {
            // CredentialID and UserID are not currently encrypted so don't try to decode them
            data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);
            // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
            var urlText = _templates.urlText({ Url: data.Url });
            var urlHtml = data.Url.indexOf('//') === -1 ? urlText : _templates.urlLink({ Url: data.Url, UrlText: urlText });

            var detailHtml = _templates.detail({
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

            _showModal({
                credentialId: credentialId,
                title: data.Description,
                content: detailHtml,
                showAccept: false,
                showEdit: true,
                showDelete: true,
                edit: function (e) { _loadCredential($(this).data('credentialid'), masterKey, _userId); },
                delete: function (e) { _confirmDelete($(this).data('credentialid'), masterKey, _userId); }
            });
        });
    };

    // Default action for modal accept button
    var _defaultAcceptAction = function (e) {
        e.preventDefault();
        _ui.modal.modal('hide');
        _ui.searchInput.focus();
    };

    // Default action for modal close button
    var _defaultCloseAction = function (e) {
        e.preventDefault();
        _ui.modal.modal('hide');
        _ui.searchInput.focus();
    };

    // Show a Bootstrap modal with options as below
    // var modalOptions = {
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
    var _showModal = function (options) {
        var showAccept = options.showAccept === false ? false : true;
        var showClose = options.showClose === false ? false : true;
        var showEdit = options.showEdit === true ? true : false;
        var showDelete = options.showDelete === true ? true : false;

        var html = _templates.modalHeader({
            title: options.title,
            closeText: options.closeText || 'Close',
            showAccept: showAccept,
            showClose: showClose,
            showEdit: showEdit,
            showDelete: showDelete,
        }) + _templates.modalBody({
            content: options.content
        });

        if (showAccept || showClose || showEdit || showDelete) {
            html += _templates.modalFooter({
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

        _ui.modalContent.html(html);
        _ui.modal.off('click', 'button.btn-accept');
        _ui.modal.off('click', 'button.btn-close');
        _ui.modal.off('click', 'button.btn-edit');
        _ui.modal.off('click', 'button.btn-delete');
        _ui.modal.on('click', 'button.btn-accept', options.accept || _defaultAcceptAction);
        _ui.modal.on('click', 'button.btn-close', options.close || _defaultCloseAction);
        _ui.modal.on('click', 'button.btn-edit', options.edit || function (e) { window.alert('NOT BOUND'); });
        _ui.modal.on('click', 'button.btn-delete', options.delete || function (e) { window.alert('NOT BOUND'); });
        _ui.modal.modal();
    };

    var _getPasswordLength = function () {
        var len = parseInt($('#len').val(), 10);
        return isNaN(len) ? 16 : len;
    };

    var _getPasswordGenerationOptions = function () {
        var options = {};
        $('input.generate-password-option').each(function (i, item) {
            var checkbox = $(this);
            if (checkbox[0].checked) {
                options[checkbox.attr('name')] = 1;
            }
        });
        return options;
    };

    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    var _loadCredential = function (credentialId, masterKey, userId) {
        if (credentialId !== null) {
            _ajaxPost(_basePath + 'Main/Load', { id: credentialId }, function (data, status, request) {
                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);
                _showModal({
                    title: 'Edit Credential',
                    content: _templates.credentialForm(data),
                    acceptText: 'Save',
                    accept: function (e) {
                        $('#credential-form').submit();
                    }
                });
                _ui.modal.find('#Description').focus();
                _showPasswordStrength(_ui.modal.find('#Password'));
            });
        } else { // New record setup
            _showModal({
                title: 'Add Credential',
                content: _templates.credentialForm({ UserID: _userId }),
                acceptText: 'Save',
                accept: function (e) {
                    $('#credential-form').submit();
                }
            });
            _ui.modal.find('#Description').focus();
            _showPasswordStrength(_ui.modal.find('#Password'));
        }
    };

    // Delete a record
    var _deleteCredential = function (credentialId, userId, masterKey) {
        _ajaxPost(_basePath + 'Main/Delete', { credentialId: credentialId, userId: userId }, function (data, status, request) {
            if (data.Success) {
                // Remove the deleted item from the cached list before reload
                _removeFromList(credentialId, _cachedList);
                // For now we just reload the entire table in the background
                _loadCredentials(userId, masterKey, function (rows) {
                    _ui.modal.modal('hide');
                    var results = _search(_ui.searchInput.val(), _cachedList);
                    _buildDataTable(results, function (rows) {
                        _ui.container.html(_createCredentialTable(rows));
                        _ui.searchInput.focus();
                    }, _masterKey, _userId);
                });
            }
        });
    };

    // Show delete confirmation dialog
    var _confirmDelete = function (id, masterKey, userId) {
        _showModal({
            title: 'Delete Credential',
            content: _templates.deleteConfirmationDialog(),
            accept: function (e) {
                e.preventDefault();
                _deleteCredential(id, userId, masterKey);
            }
        });
    };

    // Generate standard hash for a password
    var _generatePasswordHash = function (password) {
        return Passpack.utils.hashx(password);
    };

    // Generate 64-bit hash for a password
    var _generatePasswordHash64 = function (password) {
        // The hash is now a full 64 char string
        return Passpack.utils.hashx(password, false, true);
    };

    // Change the password and re-encrypt all credentials with the new password
    var _changePassword = function (userId, masterKey) {
        var newPassword = $('#NewPassword').val();
        var newPasswordConfirm = $('#NewPasswordConfirm').val();

        if (newPassword === '') {
            alert('Password cannot be left blank.');
            return false;
        }

        if (newPassword !== newPasswordConfirm) {
            alert('Password confirmation does not match password.');
            return false;
        }

        if (!confirm('When the password change is complete you will be logged out and will need to log back in.\n\nAre you sure you want to change the master password?')) {
            return false;
        }

        var newPasswordHash = Passpack.utils.hashx(newPassword);
        // Convert the new master key to Base64 so that encryptObject() gets what it's expecting
        var newMasterKey = _utf8_to_b64(Passpack.utils.hashx(newPassword + Passpack.utils.hashx(newPassword, 1, 1), 1, 1));
        var newData = [];
        // Get all the credentials, decrypt each with the old password
        // and re-encrypt it with the new one
        _ajaxPost(_basePath + 'Main/GetAllComplete', { userId: userId }, function (data, status, request) {
            var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];
            $.each(data, function (i, item) {
                newData.push(_encryptObject(_decryptObject(item, _b64_to_utf8(masterKey), excludes), newMasterKey, excludes));
            });

            _ajaxPost(_basePath + 'Main/UpdateMultiple', Passpack.JSON.stringify(newData), function (data, status, request) {
                // Store the new password in hashed form
                _ajaxPost(_basePath + 'Main/UpdatePassword', {
                    newHash: newPasswordHash,
                    userid: userId,
                    oldHash: Passpack.utils.hashx(_password)
                }, function (data, status, request) {
                    // Just reload the whole page when we're done to force login
                    window.location.href = _basePath.length > 1 ? _basePath.slice(0, -1) : _basePath; 
                });
            }, null, 'application/json; charset=utf-8');
        });

        return false;
    };

    // Export all credential data as JSON
    var _exportData = function (userId, masterKey) {
        var exportItems = [];
        // Get all the credentials, decrypt each one
        _ajaxPost(_basePath + 'Main/GetAllComplete', { userId: userId }, function (data, status, request) {
            $.each(data, function (i, item) {
                var o = _decryptObject(item, _b64_to_utf8(masterKey), ['CredentialID', 'UserID', 'PasswordConfirmation']);
                delete o.PasswordConfirmation; // Remove the password confirmation as it's not needed for export
                exportItems.push(o);
            });

            var exportWindow = window.open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
            if (exportWindow && exportWindow.top) {
                exportWindow.document.write(_templates.exportedDataWindow({ json: JSON.stringify(exportItems, undefined, 4) }));
            } else {
                alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
            }
        });

        return false;
    };

    // Import unencrypted JSON credential data
    var _importData = function (userId, masterKey, rawData) {
        var jsonImportData = JSON.parse(rawData);
        var newData = [];
        var excludes = ['CredentialID', 'UserID'];

        $.each(jsonImportData, function (i, item) {
            // Remove the confirmation property
            delete item.PasswordConfirmation;
            // Null out the old credential ID so UpdateMultiple knows this is a new record
            item.CredentialID = null;
            // Set the user ID to the ID of the new (logged in) user
            item.UserID = userId;
            newData.push(_encryptObject(item, _b64_to_utf8(masterKey), excludes));
        });

        _ajaxPost(_basePath + 'Main/UpdateMultiple', Passpack.JSON.stringify(newData), function (data, status, request) {
            // Just reload the whole page when we're done to force login
            window.location.href = _basePath.length > 1 ? _basePath.slice(0, -1) : _basePath;
        }, null, 'application/json; charset=utf-8');

        return false;
    };

    // Show the options dialog
    var _options = function () {
        var dialogHtml = _templates.optionsDialog({
            userid: _userId,
            masterkey: _utf8_to_b64(_masterKey)
        });

        _showModal({
            title: 'Admin',
            content: dialogHtml,
            showAccept: false
        });
    };

    // Build the data table
    var _buildDataTable = function (data, callback, masterKey, userId) {
        var rows = [];

        // Create a table row for each record and add it to the rows array
        $.each(data, function (i, item) {
            rows.push(_createCredentialDisplayData(item, masterKey, userId));
        });

        // Fire the callback and pass it the array of rows
        callback(rows);
    };

    // Create the credential table
    var _createCredentialTable = function (rows) {
        return _templates.credentialTable({ rows: rows });
    };

    // Create a single table row for a credential
    var _createCredentialDisplayData = function (credential, masterKey, userId) {
        return {
            credentialid: credential.CredentialID,
            masterkey: masterKey,
            userid: userId,
            description: credential.Description,
            username: credential.Username,
            password: credential.Password,
            url: credential.Url,
            weak: ($.trim(credential.Password) !== '' && Passpack.utils.getBits(credential.Password) < _weakPasswordThreshold)
        };
    };

    // Validate a credential record form
    var _validateRecord = function (f) {
        var errors = [];
        var description = $('#Description', f);
        var password = $('#Password', f);
        var passwordConfirmation = $('#PasswordConfirmation', f);

        if (description.val() === '') {
            errors.push({ field: description, msg: 'You must fill in a Description' });
        }

        // We don't mind if these are blank, but they must be the same!
        if (password.val() !== passwordConfirmation.val()) {
            errors.push({ field: passwordConfirmation, msg: 'Password confirmation does not match' });
        }

        return errors;
    };

    // Encode string to Base64
    var _utf8_to_b64 = function (str) {
        return window.btoa(encodeURIComponent(window.escape(str)));
    };

    // Decode Base64 string
    var _b64_to_utf8 = function (str) {
        return window.unescape(decodeURIComponent(window.atob(str)));
    };

    // Utility function to check a value exists in an array
    var _contains = function (arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) {
                return true;
            }
        }
        return false;
    };

    // Truncate a string at a specified length
    var _truncate = function (str, len) {
        return (str.length > len) ? str.substring(0, (len - 3)) + '...' : str;
    };

    // Hide credential rows which don't contain a particular string
    var _search = function (query, list) {
        query = $.trim(query).toLowerCase();
        var results = [];
        if (query !== null && query !== '' && query.length > 1) {
            var queryField = _queryablePropertyMap.description;
            // Support queries in the form fieldName:query (e.g. username:me@email.com)
            if(query.indexOf(':') !== -1) {
                var queryData = query.split(':');
                // Safeguard against spaces either side of colon, query part not 
                // having been typed yet and searches on a non-existent property
                if(queryData.length === 2 && queryData[0] !== '' && queryData[1] !== '') {
                    // If the fieldName part exists in the property map
                    if(typeof _queryablePropertyMap[queryData[0]] !== 'undefined') {
                        queryField = _queryablePropertyMap[queryData[0]];
                        query = queryData[1];
                    }
                }
            }
            if (queryField === 'FILTER') {
                if (query === 'all') {
                    results = list;
                }
            } else {
                for (var i = 0; i < list.length; i++) {
                    if (list[i][queryField].toLowerCase().indexOf(query) > -1) {
                        results.push(list[i]);
                    }
                }
            }
        }
        return results;
    };

    // Rate-limit calls to the supplied function
    var _debounce = function (func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    };

    // Sort credentials alphabetically by description
    var _sortCredentials = function (credentials) {
        credentials.sort(function(a, b) {
            var desca = a.Description.toUpperCase();
            var descb = b.Description.toUpperCase();
            return (desca < descb) ? -1 : (desca > descb) ? 1 : 0;
        });
    };

    // Show password strength visually
    var _showPasswordStrength = function (field) {
        var strengthIndicator = field.next('div.password-strength');
        var status = strengthIndicator.find('> span');
        var bar = strengthIndicator.find('> div');
        var strength = Passpack.utils.getBits(field.val());
        bar.removeClass();
        if (strength === 0) {
            status.html('No Password');
            bar.css('width', 0);
        } else if (strength <= 100) {
            bar.css('width', strength + '%');
            if (strength <= 10) {
                bar.addClass('extremely-weak');
                status.html('Extremely Weak (' + strength + ')');
            } else if (strength <= 25) {
                bar.addClass('very-weak');
                status.html('Very Weak (' + strength + ')');
            } else if (strength <= _weakPasswordThreshold) {
                bar.addClass('weak');
                status.html('Weak (' + strength + ')');
            } else if (strength <= 55) {
                bar.addClass('average');
                status.html('Average (' + strength + ')');
            } else if (strength <= 75) {
                bar.addClass('strong');
                status.html('Strong (' + strength + ')');
            } else {
                bar.addClass('very-strong');
                status.html('Very Strong (' + strength + ')');
            }
        } else {
            bar.addClass('extremely-strong');
            status.html('Extremely Strong (' + strength + ')');
            bar.css('width', '100%');
        }
    };

    // Initialise the app
    var _init = function (basePath, testMode, devMode) {
        // Set the base path for AJAX requests/redirects
        _basePath = basePath;
        // Determine whether we're testing or not
        if (testMode) {
            var testMethods = {
                encryptObject: _encryptObject,
                decryptObject: _decryptObject,
                removeFromList: _removeFromList,
                updateProperties: _updateProperties,
                defaultAjaxErrorCallback: _defaultAjaxErrorCallback,
                ajaxPost: _ajaxPost,
                loadCredentials: _loadCredentials,
                showDetail: _showDetail,
                defaultAcceptAction: _defaultAcceptAction,
                defaultCloseAction: _defaultCloseAction,
                showModal: _showModal,
                loadCredential: _loadCredential,
                deleteCredential: _deleteCredential,
                confirmDelete: _confirmDelete,
                generatePasswordHash: _generatePasswordHash,
                generatePasswordHash64: _generatePasswordHash64,
                changePassword: _changePassword,
                exportData: _exportData,
                options: _options,
                buildDataTable: _buildDataTable,
                createCredentialTable: _createCredentialTable,
                createCredentialDisplayData: _createCredentialDisplayData,
                validateRecord: _validateRecord,
                utf8_to_b64: _utf8_to_b64,
                b64_to_utf8: _b64_to_utf8,
                contains: _contains,
                truncate: _truncate,
                search: _search,
                debounce: _debounce,
                sortCredentials: _sortCredentials,
                init: _init
            };
            $.extend(vault, testMethods);
        }

        // Cache UI selectors
        _ui.loginFormDialog = $('#login-form-dialog');
        _ui.loginForm = $('#login-form');
        _ui.container = $('#container');
        _ui.controls = $('#controls');
        _ui.modal = $('#modal');
        _ui.modalContent = $('#modal-content');
        _ui.newButton = $('#new');
        _ui.adminButton = $('#admin');
        _ui.clearSearchButton = $('#clear-search');
        _ui.searchInput = $('#search');
        _ui.spinner = $('#spinner');

        _templates.urlLink = Handlebars.compile($('#tmpl-urllink').html());
        _templates.urlText = Handlebars.compile($('#tmpl-urltext').html());
        _templates.detail = Handlebars.compile($('#tmpl-detail').html());
        _templates.credentialForm = Handlebars.compile($('#tmpl-credentialform').html());
        _templates.deleteConfirmationDialog = Handlebars.compile($('#tmpl-deleteconfirmationdialog').html());
        _templates.optionsDialog = Handlebars.compile($('#tmpl-optionsdialog').html());
        _templates.exportedDataWindow = Handlebars.compile($('#tmpl-exporteddatawindow').html());
        _templates.credentialTable = Handlebars.compile($('#tmpl-credentialtable').html());
        _templates.credentialTableRow = Handlebars.compile($('#tmpl-credentialtablerow').html());
        Handlebars.registerPartial('credentialtablerow', _templates.credentialTableRow);
        _templates.validationMessage = Handlebars.compile($('#tmpl-validationmessage').html());
        _templates.modalHeader = Handlebars.compile($('#tmpl-modalheader').html());
        _templates.modalBody = Handlebars.compile($('#tmpl-modalbody').html());
        _templates.modalFooter = Handlebars.compile($('#tmpl-modalfooter').html());

        Handlebars.registerHelper('breaklines', function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br />');
            return new Handlebars.SafeString(text);
        });

        Handlebars.registerHelper('truncate', function (text, size) {
            text = (text.length > size) ? text.substring(0, (size - 3)) + '...' : text
            text = Handlebars.Utils.escapeExpression(text);
            return new Handlebars.SafeString(text);
        });

        // Don't set up event handlers in test mode
        if (!testMode) {
            _ui.container.on('click', '.btn-credential-show-detail', function (e) {
                e.preventDefault();
                var id = $(this).parent().parent().attr('id');
                _showDetail(id, _masterKey);
            });

            _ui.newButton.on('click', function (e) {
                e.preventDefault();
                _loadCredential(null, _masterKey, _userId);
            });

            _ui.adminButton.on('click', function (e) {
                e.preventDefault();
                _options();
            });

            _ui.clearSearchButton.on('click', function (e) {
                e.preventDefault();
                var results = _search(null, _cachedList);
                _buildDataTable(results, function (rows) {
                    _ui.container.html(_createCredentialTable(rows));
                }, _masterKey, _userId);
                _ui.searchInput.val('').focus();
            });

            _ui.searchInput.on('keyup', _debounce(function () {
                var results = _search(this.value, _cachedList);
                _buildDataTable(results, function (rows) {
                    _ui.container.html(_createCredentialTable(rows));
                }, _masterKey, _userId);
            }, 200));

            // Initialise globals and load data on correct login
            _ui.loginForm.on('submit', function () {
                var username = _ui.loginForm.find('#UN1209').val();
                var password = _ui.loginForm.find('#PW9804').val();

                _ajaxPost(_basePath + 'Main/Login', {
                    UN1209: Passpack.utils.hashx(username),
                    PW9804: Passpack.utils.hashx(password)
                }, function (data, status, request) {
                    // If the details were valid
                    if (data.result === 1 && data.id !== '') {
                        // Set some private variables so that we can reuse them for encryption during this session
                        _userId = data.id;
                        _username = username;
                        _password = password;
                        _masterKey = _utf8_to_b64(window.Passpack.utils.hashx(_password + Passpack.utils.hashx(_password, 1, 1), 1, 1));

                        _loadCredentials(_userId, _masterKey, function (rows) {

                            // Successfully logged in. Hide the login form
                            _ui.loginForm.hide();
                            _ui.loginFormDialog.modal('hide');

                            _ui.controls.show();

                            _ui.searchInput.focus();

                        });
                    }
                });

                return false;
            });

            // Save the new details on edit form submit
            $('body').on('submit', '#credential-form', function (e) {
                var form = $(this);
                $('#validation-message').remove();
                form.find('div.has-error').removeClass('has-error');

                var errors = _validateRecord(form);
                var errorMsg = [];

                if (errors.length > 0) {
                    for (var i = 0; i < errors.length; i++) {
                        errorMsg.push(errors[i].msg);
                        errors[i].field.parent().parent().addClass('has-error');
                    }

                    _ui.modal.find('div.modal-body').prepend(_templates.validationMessage({ errors: errorMsg.join('<br />') }));
                    return false;
                }

                var credential = {};

                // Serialize the form inputs into an object
                form.find('input[class!=submit], textarea').each(function () {
                    credential[this.name] = $(this).val();
                });

                // Hold the modified properties so we can update the list if the update succeeds
                var properties = { 
                    Description: form.find('#Description').val(), 
                    Username: form.find('#Username').val(), 
                    Password: form.find('#Password').val() 
                };

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                credential = _encryptObject(credential, _masterKey, ['CredentialID', 'UserID']);

                _ajaxPost(_basePath + 'Main/Update', credential, function (data, status, request) {
                    // Update the cached credential list with the new property values, so it is correct when we rebuild
                    _updateProperties(data.CredentialID, properties, _userId, _cachedList);
                    // Re-sort the list in case the order should change
                    _sortCredentials(_cachedList);
                    // For now we just reload the entire table in the background
                    _loadCredentials(_userId, _masterKey, function (rows) {
                        _ui.modal.modal('hide');
                        var results = _search(_ui.searchInput.val(), _cachedList);
                        _buildDataTable(results, function (rows) {
                            _ui.container.html(_createCredentialTable(rows));
                            _ui.searchInput.focus();
                        }, _masterKey, _userId);
                    });
                });

                return false;
            });

            // Show password strength as it is typed
            $('body').on('keyup', '#Password', _debounce(function (e) {
                _showPasswordStrength($(this));
            }));

            // Generate a nice strong password
            $('body').on('click', 'button.generate-password', function (e) {
                e.preventDefault();
                var password = Passpack.utils.passGenerator(_getPasswordGenerationOptions(), _getPasswordLength());
                $('#Password').val(password);
                $('#PasswordConfirmation').val(password);
                _showPasswordStrength($('#Password'));
            });

            // Toggle password generation option UI visibility
            $('body').on('click', 'a.generate-password-options-toggle', function (e) {
                e.preventDefault();
                $('div.generate-password-options').toggle();
            });

            // Copy content to clipboard when copy icon is clicked
            $('body').on('click', 'a.copy-link', function (e) {
                e.preventDefault();
                $('a.copy-link').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');
                var a = $(this);
                a.next('input.copy-content').select();
                var copySuccess;
                try {
                    copySuccess = document.execCommand("copy");
                } catch (e) {
                    copySuccess = false;
                }
                if (copySuccess) {
                    a.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
                } else {
                    window.alert('Copy operation is not supported by the current browser.');
                }
            });

            $('body').on('click', 'button.btn-credential-open', function (e) {
                e.preventDefault();
                var url = $(this).data('url');
                window.open(url);
            });

            $('body').on('click', 'button.btn-credential-copy', function (e) {
                e.preventDefault();
                $('button.btn-credential-copy').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');;
                var button = $(this);
                button.next('input.copy-content').select();
                var copySuccess;
                try {
                    copySuccess = document.execCommand("copy");
                } catch (e) {
                    copySuccess = false;
                }
                if (copySuccess) {
                    button.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
                } else {
                    window.alert('Copy operation is not supported by the current browser.');
                }
            });

            // If we're in dev mode, automatically log in with a cookie manually created on the dev machine
            if (devMode) {
                _ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
                _ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
                _ui.loginForm.submit();
            }
            else
            {
                _ui.loginForm.find('#UN1209').focus();
            }
        }
    };

    // Expose public methods
    var vault = {
        init: _init,
        changePassword: _changePassword,
        exportData: _exportData,
        importData: _importData
    };

    return vault;

}(jQuery, Passpack, Handlebars, Cookies, window, document, undefined));

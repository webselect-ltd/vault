/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="handlebars" />
/// <reference types="js-cookie" />
/// <reference path="types/passpack.d.ts" />
/// <reference path="types/vault.d.ts" />

namespace Vault {
    const weakPasswordThreshold: number = 40;      // Bit value below which password is deemed weak
    const artificialAjaxDelay: boolean = false;    // Introduce an artificial delay for AJAX calls so we can test loaders locally

    let cachedList: Credential[] = []; // Hold the credential summary list in memory to avoid requerying/decrypting after save

    const internal: any = {
        basePath: null,  // Base URL (used mostly for XHR requests, particularly when app is hosted as a sub-application)
        masterKey: '',  // Master key for Passpack encryption (Base64 encoded hash of (password + hashed pasword))
        password: '',   // Current user's password
        userId: ''     // GUID identifying logged-in user
    };

    // A map of the properties which can be searched for using the fieldName:query syntax
    // We need this because the search is not case-sensitive, whereas JS properties are!
    const queryablePropertyMap: any = {
        description: 'Description',
        username: 'Username',
        password: 'Password',
        url: 'Url',
        filter: 'FILTER'
    };

    const ui: any = {
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

    const templates: any = {
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

    function ajaxPost(url: string, data: any, successCallback: IXHRSuccess, errorCallback?: IXHRError, contentType?: string): void {
        ui.spinner.show();

        if (!errorCallback) {
            errorCallback = defaultAjaxErrorCallback;
        }

        const options: any = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: function(responseData: any, status: string, request: JQueryXHR): void {
                ui.spinner.hide();
                successCallback(responseData, status, request);
            },
            error: function(request: JQueryXHR, status: string, error: string): void {
                ui.spinner.hide();
                errorCallback(request, status, error);
            }
        };

        if (contentType) {
            options.contentType = contentType;
        }

        if (!artificialAjaxDelay) {
            $.ajax(options);
        } else {
            window.setTimeout(function(): void {
                $.ajax(options);
            }, 2000);
        }
    }

    // Decode Base64 string
    function base64ToUtf8(str: string): string {
        return unescape(decodeURIComponent(window.atob(str)));
    }

    // Build the data table
    function buildDataTable(data: Credential[], callback: (c: CredentialSummary[]) => void, masterKey: string, userId: string) {
        // Create a table row for each record and add it to the rows array
        const rows = data.map(function(item) {
            return createCredentialDisplayData(item, masterKey, userId);
        });
        // Fire the callback and pass it the array of rows
        callback(rows);
    }

    // Change the password and re-encrypt all credentials with the new password
    export function changePassword(userId: string, masterKey: string): void {
        const newPassword: string = $('#NewPassword').val();
        const newPasswordConfirm: string = $('#NewPasswordConfirm').val();
        const confirmationMsg: string = 'When the password change is complete you will be logged out and will need to log back in.\n\n'
                + 'Are you SURE you want to change the master password?';

        if (newPassword === '') {
            window.alert('Password cannot be left blank.');
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            window.alert('Password confirmation does not match password.');
            return;
        }

        if (!window.confirm(confirmationMsg)) {
            return;
        }

        const newPasswordHash: string = Passpack.utils.hashx(newPassword);
        const newMasterKey: string = utf8ToBase64(createMasterKey(newPassword));

        // Get all the credentials, decrypt each with the old password
        // and re-encrypt it with the new one
        ajaxPost(internal.basePath + 'Main/GetAllComplete', { userId: userId }, function(data: Credential[]): void {
            const excludes: string[] = ['CredentialID', 'UserID', 'PasswordConfirmation'];
            const newData: Credential[] = data.map(function(item: Credential): Credential {
                return encryptObject(decryptObject(item, base64ToUtf8(masterKey), excludes), newMasterKey, excludes);
            });

            ajaxPost(internal.basePath + 'Main/UpdateMultiple', JSON.stringify(newData), function(): void {
                // Store the new password in hashed form
                ajaxPost(internal.basePath + 'Main/UpdatePassword', {
                    newHash: newPasswordHash,
                    userid: userId,
                    oldHash: Passpack.utils.hashx(internal.password)
                }, function(): void {
                    // Just reload the whole page when we're done to force login
                    window.location.href = internal.basePath.length > 1 ? internal.basePath.slice(0, -1) : internal.basePath;
                });
            }, null, 'application/json; charset=utf-8');
        });
    }

    function checkIf(el: JQuery, condition: () => boolean): void {
        (el[0] as HTMLInputElement).checked = condition();
    }

    // Show delete confirmation dialog
    function confirmDelete(id: string, masterKey: string): void {
        showModal({
            title: 'Delete Credential',
            content: templates.deleteConfirmationDialog(),
            showDelete: true,
            deleteText: 'Yes, Delete This Credential',
            ondelete: function(e: Event): void {
                e.preventDefault();
                deleteCredential(id, internal.userId, masterKey);
            }
        });
    }

    // Create a single table row for a credential
    function createCredentialDisplayData(credential: Credential, masterKey: string, userId: string): CredentialSummary {
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

    function createCredentialFromFormFields(form: JQuery): Credential {
        const obj: any = {};
        // Serialize the form inputs into an object
        form.find('input:not(.submit, .chrome-autocomplete-fake), textarea').each(function(): void {
            obj[this.name] = $(this).val();
        });
        return obj;
    }

    // Create the credential table
    function createCredentialTable(rows: CredentialSummary[]): string {
        return templates.credentialTable({ rows: rows });
    }

    function createMasterKey(password: string): string {
        return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
    }

    /**
     * Encrypt/decrypt the properties of an object literal using Passpack.
     * @param {IPasspackCryptoFunction} action - The Passpack function to use for encryption/decryption
     * @param {any} obj - The object literal to be encrypted/decrypted
     * @param {string} masterKey - A Passpack master key
     * @param {string[]} excludes - An array of object property names whose values should not be encrypted
     * @returns {Credential}
     */
    function crypt(action: IPasspackCryptoFunction, obj: any, masterKey: string, excludes: string[]): Credential {
        const newCredential: any = {};
        Object.keys(obj).forEach(function(k: string): void {
            if (excludes.indexOf(k) === -1) {
                newCredential[k] = action('AES', obj[k], base64ToUtf8(masterKey));
            } else {
                newCredential[k] = obj[k];
            }
        });
        return newCredential;
    }

    // Rate-limit calls to the supplied function
    function debounce(func: Function, wait?: number, immediate?: boolean): (e: Event) => void {
        let timeout: number;
        return function(): void {
            const context: Function = this;
            const args: IArguments = arguments;
            const later: Function = function(): void {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            const callNow: boolean = immediate && !timeout;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    function decryptObject(obj: any, masterKey: string, excludes: string[]): Credential {
        return crypt(Passpack.decode, obj, masterKey, excludes);
    }

    function encryptObject(obj: any, masterKey: string, excludes: string[]): Credential {
        return crypt(Passpack.encode, obj, masterKey, excludes);
    }

    // Default action for modal accept button
    function defaultAcceptAction(e: Event): void {
        e.preventDefault();
        ui.modal.modal('hide');
    }

    function defaultAjaxErrorCallback(ignore: JQueryXHR, status: string, error: string): void {
        return window.alert('Http Error: ' + status + ' - ' + error);
    }

    // Default action for modal close button
    function defaultCloseAction(e: Event): void {
        e.preventDefault();
        ui.modal.modal('hide');
    }

    // Delete a record
    function deleteCredential(credentialId: string, userId: string, masterKey: string): void {
        ajaxPost(internal.basePath + 'Main/Delete', { credentialId: credentialId, userId: userId }, function(data: any): void {
            if (data.Success) {
                // Remove the deleted item from the cached list before reload
                cachedList = removeFromList(credentialId, cachedList);
                // For now we just reload the entire table in the background
                loadCredentials(userId, masterKey, function(): void {
                    ui.modal.modal('hide');
                    const results: Credential[] = search(ui.searchInput.val(), cachedList);
                    buildDataTable(results, function(rows: CredentialSummary[]): void {
                        ui.container.html(createCredentialTable(rows));
                    }, masterKey, userId);
                });
            }
        });
    }

    // Export all credential data as JSON
    export function exportData(userId: string, masterKey: string): void {
        // Get all the credentials, decrypt each one
        ajaxPost(internal.basePath + 'Main/GetAllComplete', { userId: userId }, function(data: Credential[]): void {
            const exportItems: Credential[] = data.map(function(item: Credential): Credential {
                const o: Credential = decryptObject(item, base64ToUtf8(masterKey), ['CredentialID', 'UserID', 'PasswordConfirmation']);
                delete o.PasswordConfirmation; // Remove the password confirmation as it's not needed for export
                return o;
            });

            const exportWindow: Window = window.open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
            if (exportWindow && exportWindow.top) {
                exportWindow.document.write(templates.exportedDataWindow({ json: JSON.stringify(exportItems, undefined, 4) }));
            } else {
                window.alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
            }
        });
    }

    // Find the index of a credential within an array
    function findIndex(id: string, list: Credential[]): number {
        for (let i = 0; i < list.length; i++) {
            if (list[i].CredentialID === id) {
                return i;
            }
        }
        return -1;
    }

    // Generate standard hash for a password
    function generatePasswordHash(password: string): string {
        return Passpack.utils.hashx(password);
    }

    // Generate 64-bit hash for a password
    function generatePasswordHash64(password: string): string {
        // The hash is now a full 64 char string
        return Passpack.utils.hashx(password, false, true);
    }

    function getPasswordLength(val: any): number {
        const len: number = parseInt(val, 10);
        return isNaN(len) ? 16 : len;
    }

    function getPasswordGenerationOptions(inputs: JQuery, predicate: (element: JQuery) => boolean): any {
        const options: any = {};
        inputs.each(function(): void {
            const checkbox: JQuery = $(this);
            if (predicate(checkbox)) {
                options[checkbox.attr('name')] = 1;
            }
        });
        return options;
    }

    // Import unencrypted JSON credential data
    export function importData(userId: string, masterKey: string, rawData: string): void {
        const jsonImportData: Credential[] = JSON.parse(rawData);
        const excludes: string[] = ['CredentialID', 'UserID'];

        const newData: Credential[] = jsonImportData.map(function(item: Credential): Credential {
            // Remove the confirmation property
            delete item.PasswordConfirmation;
            // Null out the old credential ID so UpdateMultiple knows this is a new record
            item.CredentialID = null;
            // Set the user ID to the ID of the new (logged in) user
            item.UserID = userId;
            return encryptObject(item, base64ToUtf8(masterKey), excludes);
        });

        ajaxPost(internal.basePath + 'Main/UpdateMultiple', JSON.stringify(newData), function(): void {
            // Just reload the whole page when we're done to force login
            window.location.href = internal.basePath.length > 1 ? internal.basePath.slice(0, -1) : internal.basePath;
        }, null, 'application/json; charset=utf-8');
    }

    function isChecked(el: JQuery): boolean {
        return (el[0] as HTMLInputElement).checked;
    }

    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    function loadCredential(credentialId: string, masterKey: string): void {
        if (credentialId !== null) {
            ajaxPost(internal.basePath + 'Main/Load', { id: credentialId }, function(data: Credential): void {
                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = decryptObject(data, masterKey, ['CredentialID', 'UserID']);
                showModal({
                    title: 'Edit Credential',
                    content: templates.credentialForm(data),
                    showAccept: true,
                    acceptText: 'Save',
                    onaccept: function(): void {
                        $('#credential-form').submit();
                    }
                });
                ui.modal.find('#Description').focus();
                showPasswordStrength(ui.modal.find('#Password'));
                setPasswordOptions(ui.modal, data.PwdOptions);
            });
        } else { // New record setup
            showModal({
                title: 'Add Credential',
                content: templates.credentialForm({ UserID: internal.userId }),
                showAccept: true,
                acceptText: 'Save',
                onaccept: function(): void {
                    $('#credential-form').submit();
                }
            });
            ui.modal.find('#Description').focus();
            showPasswordStrength(ui.modal.find('#Password'));
        }
    }

    // Load all records for a specific user
    function loadCredentials(userId: string, masterKey: string, callback: (c: CredentialSummary[]) => void): void {
        if (cachedList !== null && cachedList.length) {
            buildDataTable(cachedList, callback, masterKey, userId);
        } else {
            ajaxPost(internal.basePath + 'Main/GetAll', { userId: userId }, function(data: Credential[]): void {
                // At this point we only actually need to decrypt a few things for display/search
                // which speeds up client-side table construction time dramatically
                const items: Credential[] = data.map(function(item: Credential): Credential {
                    return decryptObject(item, masterKey, ['CredentialID', 'UserID']);
                });
                // Cache the whole (decrypted) list on the client
                cachedList = items;
                sortCredentials(cachedList);
                buildDataTable(cachedList, callback, masterKey, userId);
            });
        }
    }

    // Show the options dialog
    function optionsDialog(): void {
        const dialogHtml: string = templates.optionsDialog({
            userid: internal.userId,
            masterkey: utf8ToBase64(internal.masterKey)
        });

        showModal({
            title: 'Admin',
            content: dialogHtml
        });
    }

    // Remove the credential with a specific ID from an array
    function removeFromList(id: string, list: Credential[]): Credential[] {
        return list.filter( item => item.CredentialID !== id);
    }

    // Hide credential rows which don't contain a particular string
    function search(query: string, list: Credential[]): Credential[] {
        let results: Credential[] = [];
        let queryField: string;
        let queryData: string[];
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
                } else if (query === 'weak') {
                    results = list.filter(function(item: Credential): boolean {
                        const pwd: string = item.Password;
                        return pwd && Passpack.utils.getBits(pwd) <= weakPasswordThreshold;
                    });
                }
            } else {
                results = list.filter(function(item: Credential): boolean {
                    return item[queryField].toLowerCase().indexOf(query) > -1;
                });
            }
        }
        return results;
    }

    function setPasswordOptions(form: JQuery, opts: string): void {
        const optArray: string[] = opts.split('|');
        form.find('[name=len]').val(optArray[0]);
        checkIf(form.find('[name=ucase]'), () => optArray[1] === '1');
        checkIf(form.find('[name=lcase]'), () => optArray[2] === '1');
        checkIf(form.find('[name=nums]'), () => optArray[3] === '1');
        checkIf(form.find('[name=symb]'), () => optArray[4] === '1');
    }

    // Show the read-only details modal
    function showDetail(credentialId: string, masterKey: string): void {
        ajaxPost(internal.basePath + 'Main/Load', { id: credentialId }, function(data: Credential): void {
            // CredentialID and UserID are not currently encrypted so don't try to decode them
            data = decryptObject(data, masterKey, ['CredentialID', 'UserID']);
            // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
            const urlText: string = templates.urlText({ Url: data.Url });
            const urlHtml: string = data.Url.indexOf('//') === -1 ? urlText : templates.urlLink({ Url: data.Url, UrlText: urlText });

            const detailHtml: string = templates.detail({
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
                onedit: function(): void { loadCredential($(this).data('credentialid'), masterKey); },
                ondelete: function(): void { confirmDelete($(this).data('credentialid'), masterKey); }
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
    function showModal(options: any): void {
        const showAccept: boolean = options.showAccept || false;
        const showClose: boolean = options.showClose || true;
        const showEdit: boolean = options.showEdit || false;
        const showDelete: boolean = options.showDelete || false;
        let html: string = templates.modalHeader({
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
        ui.modal.on('click', 'button.btn-edit', options.onedit || function(): void { window.alert('NOT BOUND'); });
        ui.modal.on('click', 'button.btn-delete', options.ondelete || function(): void { window.alert('NOT BOUND'); });
        ui.modal.modal();
    }

    // Show password strength visually
    function showPasswordStrength(field: JQuery): void {
        const strengthIndicator: JQuery = field.next('div.password-strength');
        const status: JQuery = strengthIndicator.find('> span');
        const bar: JQuery = strengthIndicator.find('> div');
        const strength: number = Passpack.utils.getBits(field.val());
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
            } else if (strength <= weakPasswordThreshold) {
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
    }

    // Sort credentials alphabetically by description
    function sortCredentials(credentials: Credential[]): void {
        credentials.sort(function(a: Credential, b: Credential): number {
            const desca: string = a.Description.toUpperCase();
            const descb: string = b.Description.toUpperCase();
            return desca < descb ? -1 : desca > descb ? 1 : 0;
        });
    }

    // Truncate a string at a specified length
    function truncate(str: string, len: number): string {
        return str.length > len ? str.substring(0, len - 3) + '...' : str;
    }

    // Update properties of the item with a specific ID in a list
    function updateProperties(properties: any, credential: Credential): Credential {
        return $.extend({}, credential, properties);
    }

    // Encode string to Base64
    function utf8ToBase64(str: string): string {
        return window.btoa(encodeURIComponent(escape(str)));
    }

    // Validate a credential record form
    function validateRecord(f: JQuery): any[] {
        const errors: any[] = [];
        const description: JQuery = f.find('#Description');
        const password: JQuery = f.find('#Password');
        const passwordConfirmation: JQuery = f.find('#PasswordConfirmation');

        if (description.val() === '') {
            errors.push({ field: description, msg: 'You must fill in a Description' });
        }

        // We don't mind if these are blank, but they must be the same!
        if (password.val() !== passwordConfirmation.val()) {
            errors.push({ field: passwordConfirmation, msg: 'Password confirmation does not match' });
        }

        return errors;
    }

    // Initialise the app
    export function init(basePath: string, testMode: boolean, devMode: boolean): void {
        // Set the base path for AJAX requests/redirects
        internal.basePath = basePath;
        // Determine whether we're testing or not
        if (testMode) {
            const testMethods: any = {
                createCredentialFromFormFields: createCredentialFromFormFields,
                isChecked: isChecked,
                checkIf: checkIf,
                crypt: crypt,
                encryptObject: encryptObject,
                decryptObject: decryptObject,
                getPasswordLength: getPasswordLength,
                getPasswordGenerationOptions: getPasswordGenerationOptions,
                findIndex: findIndex,
                createMasterKey: createMasterKey,
                removeFromList: removeFromList,
                updateProperties: updateProperties,
                defaultAjaxErrorCallback: defaultAjaxErrorCallback,
                ajaxPost: ajaxPost,
                loadCredentials: loadCredentials,
                showDetail: showDetail,
                defaultAcceptAction: defaultAcceptAction,
                defaultCloseAction: defaultCloseAction,
                showModal: showModal,
                loadCredential: loadCredential,
                deleteCredential: deleteCredential,
                confirmDelete: confirmDelete,
                generatePasswordHash: generatePasswordHash,
                generatePasswordHash64: generatePasswordHash64,
                changePassword: changePassword,
                exportData: exportData,
                options: optionsDialog,
                buildDataTable: buildDataTable,
                createCredentialTable: createCredentialTable,
                createCredentialDisplayData: createCredentialDisplayData,
                validateRecord: validateRecord,
                utf8ToBase64: utf8ToBase64,
                base64ToUtf8: base64ToUtf8,
                truncate: truncate,
                search: search,
                debounce: debounce,
                sortCredentials: sortCredentials,
                init: init
            };
            // $.extend(_public, testMethods);
        }

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

        Handlebars.registerHelper('breaklines', function(text: string): hbs.SafeString {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br />');
            return new Handlebars.SafeString(text);
        });

        Handlebars.registerHelper('truncate', function(text: string, size: number): hbs.SafeString {
            text = text.length > size ? text.substring(0, size - 3) + '...' : text;
            text = Handlebars.Utils.escapeExpression(text);
            return new Handlebars.SafeString(text);
        });

        // Don't set up event handlers in test mode
        if (!testMode) {
            ui.container.on('click', '.btn-credential-show-detail', function(e: Event): void {
                e.preventDefault();
                const id: string = $(this).parent().parent().attr('id');
                showDetail(id, internal.masterKey);
            });

            ui.newButton.on('click', function(e: Event): void {
                e.preventDefault();
                loadCredential(null, internal.masterKey);
            });

            ui.adminButton.on('click', function(e: Event): void {
                e.preventDefault();
                optionsDialog();
            });

            ui.clearSearchButton.on('click', function(e: Event): void {
                e.preventDefault();
                const results: Credential[] = search(null, cachedList);
                buildDataTable(results, function(rows: CredentialSummary[]): void {
                    ui.container.html(createCredentialTable(rows));
                }, internal.masterKey, internal.userId);
                ui.searchInput.val('').focus();
            });

            ui.searchInput.on('keyup', debounce(function(): void {
                const results: Credential[] = search(this.value, cachedList);
                buildDataTable(results, function(rows: CredentialSummary[]): void {
                    ui.container.html(createCredentialTable(rows));
                }, internal.masterKey, internal.userId);
            }, 200));

            // Initialise globals and load data on correct login
            ui.loginForm.on('submit', function(e: Event): void {
                e.preventDefault();

                const username: string = ui.loginForm.find('#UN1209').val();
                const password: string = ui.loginForm.find('#PW9804').val();

                ajaxPost(basePath + 'Main/Login', {
                    UN1209: Passpack.utils.hashx(username),
                    PW9804: Passpack.utils.hashx(password)
                }, function(data: any): void {
                    // If the details were valid
                    if (data.result === 1 && data.id !== '') {
                        // Set some private variables so that we can reuse them for encryption during this session
                        internal.userId = data.id;
                        internal.password = password;
                        internal.masterKey = utf8ToBase64(createMasterKey(internal.password));

                        loadCredentials(internal.userId, internal.masterKey, function(): void {
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
            $('body').on('submit', '#credential-form', function(e: Event): void {
                e.preventDefault();

                const form: JQuery = $(this);
                const errorMsg: string[] = [];

                $('#validation-message').remove();
                form.find('div.has-error').removeClass('has-error');

                const errors = validateRecord(form);

                if (errors.length > 0) {
                    errors.forEach(function(error: any): void {
                        errorMsg.push(error.msg);
                        error.field.parent().parent().addClass('has-error');
                    });

                    ui.modal.find('div.modal-body').prepend(templates.validationMessage({ errors: errorMsg.join('<br />') }));
                    return;
                }

                let credential = createCredentialFromFormFields(form);

                // Hold the modified properties so we can update the list if the update succeeds
                const properties = {
                    Description: form.find('#Description').val(),
                    Username: form.find('#Username').val(),
                    Password: form.find('#Password').val(),
                    Url: form.find('#Url').val()
                };

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                credential = encryptObject(credential, internal.masterKey, ['CredentialID', 'UserID']);

                ajaxPost(basePath + 'Main/Update', credential, function(data: Credential): void {
                    const idx = findIndex(data.CredentialID, cachedList);
                    if (idx === -1) {
                        cachedList.push($.extend({ CredentialID: data.CredentialID, UserID: internal.userId }, properties));
                    } else {
                        cachedList[idx] = updateProperties(properties, cachedList[idx]);
                    }
                    // Re-sort the list in case the order should change
                    sortCredentials(cachedList);
                    // For now we just reload the entire table in the background
                    loadCredentials(internal.userId, internal.masterKey, function(): void {
                        const results: Credential[] = search(ui.searchInput.val(), cachedList);
                        ui.modal.modal('hide');
                        buildDataTable(results, function(rows: CredentialSummary[]): void {
                            ui.container.html(createCredentialTable(rows));
                        }, internal.masterKey, internal.userId);
                    });
                });

                return;
            });

            // Show password strength as it is typed
            $('body').on('keyup', '#Password', debounce(function(): void {
                showPasswordStrength($(this));
            }));

            // Generate a nice strong password
            $('body').on('click', 'button.generate-password', function(e: Event): void {
                e.preventDefault();
                const passwordOptions = getPasswordGenerationOptions($('input.generate-password-option'), isChecked);
                const passwordLength = getPasswordLength($('#len').val());
                const password: string = Passpack.utils.passGenerator(passwordOptions, passwordLength);
                $('#Password').val(password);
                $('#PasswordConfirmation').val(password);
                const opts: any[] = [$('#len').val(),
                isChecked($('#ucase')) ? 1 : 0,
                isChecked($('#lcase')) ? 1 : 0,
                isChecked($('#nums')) ? 1 : 0,
                isChecked($('#symb')) ? 1 : 0];
                $('#PwdOptions').val(opts.join('|'));
                showPasswordStrength($('#Password'));
            });

            // Toggle password generation option UI visibility
            $('body').on('click', 'a.generate-password-options-toggle', function(e: Event): void {
                e.preventDefault();
                $('div.generate-password-options').toggle();
            });

            // Copy content to clipboard when copy icon is clicked
            $('body').on('click', 'a.copy-link', function(e: Event): void {
                e.preventDefault();
                const a: JQuery = $(this);
                $('a.copy-link').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');
                a.next('input.copy-content').select();
                try {
                    if (document.execCommand('copy')) {
                        a.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
                    }
                } catch (ex) {
                    window.alert('Copy operation is not supported by the current browser: ' + ex.message);
                }

            });

            $('body').on('click', 'button.btn-credential-open', function(e: Event): void {
                e.preventDefault();
                window.open($(this).data('url'));
            });

            $('body').on('click', 'button.btn-credential-copy', function(e: Event): void {
                e.preventDefault();
                const allButtons: JQuery = $('button.btn-credential-copy');
                const button: JQuery = $(this);
                allButtons.removeClass('btn-success').addClass('btn-primary');
                allButtons.find('span').addClass('fa-clone').removeClass('fa-check-square');
                button.next('input.copy-content').select();
                try {
                    if (document.execCommand('copy')) {
                        button.addClass('btn-success').removeClass('btn-primary');
                        button.find('span').removeClass('fa-clone').addClass('fa-check-square');
                    }
                } catch (ex) {
                    window.alert('Copy operation is not supported by the current browser: ' + ex.message);
                }
            });

            // Automatically focus the search field if a key is pressed from the credential list
            $('body').on('keydown', function(e: Event): void {
                const event: KeyboardEvent = e as KeyboardEvent;
                const eventTarget: HTMLElement = e.target as HTMLElement;
                if (eventTarget.nodeName === 'BODY') {
                    e.preventDefault();
                    // Cancel the first mouseup event which will be fired after focus
                    ui.searchInput.one('mouseup', function(me: Event): void {
                        me.preventDefault();
                    });
                    ui.searchInput.focus();
                    const char: string = String.fromCharCode(event.keyCode);
                    if (/[a-zA-Z0-9]/.test(char)) {
                        ui.searchInput.val(event.shiftKey ? char : char.toLowerCase());
                    } else {
                        ui.searchInput.select();
                    }
                }
            });

            // If we're in dev mode, automatically log in with a cookie manually created on the dev machine
            if (devMode) {
                ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
                ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
                ui.loginForm.submit();
            } else {
                ui.loginForm.find('#UN1209').focus();
            }
        }
    }
}

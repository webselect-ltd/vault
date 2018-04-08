import * as Handlebars from 'handlebars';
import * as $ from 'jquery';
import * as Cookies from 'js-cookie';
import { CryptoProvider, rateLimit, Repository, truncate, Vault } from './modules/all';
import { Credential, CredentialSummary, ICryptoProvider, IPasswordSpecification, IRepository } from './types/all';

let repository: IRepository;
const cryptoProvider = new CryptoProvider();

const vault = new Vault(cryptoProvider);

const internal: any = {
    basePath: null,     // Base URL (used mostly for XHR requests, particularly when app is hosted as a sub-application)
    masterKey: '',      // Master key for Passpack encryption (Base64 encoded hash of (password + hashed pasword))
    password: '',       // Current user's password
    userId: ''          // GUID identifying logged-in user
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

// Change the password and re-encrypt all credentials with the new password
export async function changePassword(userId: string, masterKey: string, oldPassword: string, newPassword: string): Promise<void> {
    const newPasswordHash: string = cryptoProvider.hash(newPassword);
    const newMasterKey: string = cryptoProvider.utf8ToBase64(cryptoProvider.generateMasterKey(newPassword));

    // Get all the user's credentials, decrypt each with the old password and re-encrypt it with the new one
    const credentials = await repository.loadCredentialsForUserFull(userId);

    const excludes: string[] = ['CredentialID', 'UserID', 'PasswordConfirmation'];

    const reEncrypt = (item: Credential) => {
        const decrypted = cryptoProvider.decryptCredential(item, masterKey, excludes);
        return cryptoProvider.encryptCredential(decrypted, newMasterKey, excludes);
    };

    const newData: Credential[] = credentials.map(reEncrypt);

    await repository.updateMultiple(newData);

    await repository.updatePassword(userId, cryptoProvider.hash(oldPassword), newPasswordHash);
}

export function checkIf(el: JQuery, condition: () => boolean): void {
    (el[0] as HTMLInputElement).checked = condition();
}

// Show delete confirmation dialog
function confirmDelete(id: string, masterKey: string): void {
    showModal({
        title: 'Delete Credential',
        content: templates.deleteConfirmationDialog(),
        showDelete: true,
        deleteText: 'Yes, Delete This Credential',
        ondelete: async (e: Event) => {
            e.preventDefault();

            await repository.deleteCredential(internal.userId, id);

            const updatedCredentials = await repository.loadCredentialsForUser(internal.userId);

            const decrypted = cryptoProvider.decryptCredentials(updatedCredentials, internal.masterKey, ['CredentialID', 'UserID']);

            const results = vault.search(ui.searchInput.val(), decrypted);
            updateCredentialListUI(ui.container, results, internal.userId, internal.masterKey);

            ui.modal.modal('hide');
        }
    });
}

// Create a single table row for a credential
export function createCredentialDisplayData(credential: Credential, masterKey: string, userId: string): CredentialSummary {
    return {
        credentialid: credential.CredentialID,
        masterkey: masterKey,
        userid: userId,
        description: credential.Description,
        username: credential.Username,
        password: credential.Password,
        url: credential.Url,
        weak: vault.isWeakPassword(credential)
    };
}

export function createCredentialFromFormFields(form: JQuery): Credential {
    const obj: any = {};
    // Serialize the form inputs into an object
    form.find('input:not(.submit, .chrome-autocomplete-fake), textarea').each((i, el): void => {
        obj[(el as HTMLInputElement).name] = $(el).val();
    });
    return obj;
}

// Create the credential table
export function createCredentialTable(rows: CredentialSummary[]): string {
    return templates.credentialTable({ rows: rows });
}

export function updateCredentialListUI(container: JQuery, data: Credential[], userId: string, masterKey: string): void {
    const rows = data.map(c => createCredentialDisplayData(c, masterKey, userId));
    container.html(createCredentialTable(rows));
}

// Default action for modal accept button
function defaultAcceptAction(e: Event): void {
    e.preventDefault();
    ui.modal.modal('hide');
}

// Default action for modal close button
function defaultCloseAction(e: Event): void {
    e.preventDefault();
    ui.modal.modal('hide');
}

// Export all credential data as JSON
export async function exportData(userId: string, masterKey: string): Promise<Credential[]> {
    const credentials = await repository.loadCredentialsForUserFull(userId);

    const exportItems: Credential[] = credentials.map((item: Credential): Credential => {
        const o: Credential = cryptoProvider.decryptCredential(item, masterKey, ['CredentialID', 'UserID', 'PasswordConfirmation']);
        delete o.PasswordConfirmation; // Remove the password confirmation as it's not needed for export
        return o;
    });

    return exportItems;
}

export function getPasswordGenerationOptionValues(inputs: JQuery, predicate: (element: JQuery) => boolean): IPasswordSpecification {
    const len = inputs.filter('[name=len]').val() as number;
    return {
        length: isNaN(len) ? 16 : len,
        lowerCase: predicate(inputs.filter('[name=lcase]')),
        upperCase: predicate(inputs.filter('[name=ucase]')),
        numbers: predicate(inputs.filter('[name=nums]')),
        symbols: predicate(inputs.filter('[name=symb]'))
    };
}

// Import unencrypted JSON credential data
export function parseImportData(userId: string, masterKey: string, rawData: string): Credential[] {
    const jsonImportData: Credential[] = JSON.parse(rawData);
    const excludes: string[] = ['CredentialID', 'UserID'];

    const newData: Credential[] = jsonImportData.map((item: Credential): Credential => {
        // Remove the confirmation property
        delete item.PasswordConfirmation;
        // Null out the old credential ID so UpdateMultiple knows this is a new record
        item.CredentialID = null;
        // Set the user ID to the ID of the new (logged in) user
        item.UserID = userId;
        return cryptoProvider.encryptCredential(item, masterKey, excludes);
    });

    return newData;
}

export function isChecked(el: JQuery): boolean {
    return (el[0] as HTMLInputElement).checked;
}

// Load a record into the edit form
// If null is passed as the credentialId, we set up the form for adding a new record
async function loadCredential(credentialId: string, masterKey: string): Promise<void> {
    if (credentialId !== null) {
        const encryptedCredential = await repository.loadCredential(credentialId);
        // CredentialID and UserID are not currently encrypted so don't try to decode them
        const credential = cryptoProvider.decryptCredential(encryptedCredential, masterKey, ['CredentialID', 'UserID']);
        showModal({
            title: 'Edit Credential',
            content: templates.credentialForm(credential),
            showAccept: true,
            acceptText: 'Save',
            onaccept: (): void => {
                $('#credential-form').submit();
            }
        });
        ui.modal.find('#Description').focus();
        showPasswordStrength(ui.modal.find('#Password'));
        setPasswordOptions(ui.modal, credential.PwdOptions);
    } else { // New record setup
        showModal({
            title: 'Add Credential',
            content: templates.credentialForm({ UserID: internal.userId }),
            showAccept: true,
            acceptText: 'Save',
            onaccept: (): void => {
                $('#credential-form').submit();
            }
        });
        ui.modal.find('#Description').focus();
        showPasswordStrength(ui.modal.find('#Password'));
    }
}

export function openExportPopup(data: Credential[]): void {
    const exportWindow: Window = open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
    if (exportWindow && exportWindow.top) {
        exportWindow.document.write(templates.exportedDataWindow({ json: JSON.stringify(data, undefined, 4) }));
    } else {
        alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
    }
}

// Show the options dialog
function optionsDialog(): void {
    const dialogHtml: string = templates.optionsDialog({
        userid: internal.userId,
        masterkey: cryptoProvider.utf8ToBase64(internal.masterKey)
    });

    showModal({
        title: 'Admin',
        content: dialogHtml
    });
}

export function reloadApp(): void {
    // Just reload the whole page when we're done to force login
    location.href = internal.basePath.length > 1 ? internal.basePath.slice(0, -1) : internal.basePath;
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
async function showDetail(credentialId: string, masterKey: string): Promise<void> {
    const encryptedCredential = await repository.loadCredential(credentialId);

    // CredentialID and UserID are not currently encrypted so don't try to decode them
    const credential = cryptoProvider.decryptCredential(encryptedCredential, masterKey, ['CredentialID', 'UserID']);

    // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
    const urlText: string = templates.urlText({ Url: credential.Url });
    const urlHtml: string = credential.Url.indexOf('//') === -1 ? urlText : templates.urlLink({ Url: credential.Url, UrlText: urlText });

    const detailHtml: string = templates.detail({
        Url: credential.Url,
        UrlHtml: urlHtml,
        Username: credential.Username,
        Password: credential.Password,
        UserDefined1: credential.UserDefined1,
        UserDefined1Label: credential.UserDefined1Label,
        UserDefined2: credential.UserDefined2,
        UserDefined2Label: credential.UserDefined2Label,
        Notes: credential.Notes
    });

    showModal({
        credentialId: credentialId,
        title: credential.Description,
        content: detailHtml,
        showEdit: true,
        showDelete: true,
        onedit: () => loadCredential(credentialId, masterKey),
        ondelete: () => confirmDelete(credentialId, masterKey)
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
    ui.modal.on('click', 'button.btn-edit', options.onedit || ((): void => alert('NOT BOUND')));
    ui.modal.on('click', 'button.btn-delete', options.ondelete || ((): void => alert('NOT BOUND')));
    ui.modal.modal();
}

// Show password strength visually
function showPasswordStrength(field: JQuery): void {
    const strengthIndicator = field.next('div.password-strength');
    const status = strengthIndicator.find('> span');
    const bar = strengthIndicator.find('> div');
    const password = field.val() as string;
    const strength: number = cryptoProvider.getPasswordBits(password);
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
        } else if (strength <= vault.weakPasswordThreshold) {
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
export function sortCredentials(credentials: Credential[]): void {
    credentials.sort((a: Credential, b: Credential): number => {
        const desca: string = a.Description.toUpperCase();
        const descb: string = b.Description.toUpperCase();
        return desca < descb ? -1 : desca > descb ? 1 : 0;
    });
}

// Update properties of the item with a specific ID in a list
export function updateProperties(properties: any, credential: Credential): Credential {
    return $.extend({}, credential, properties);
}

// Validate a credential record form
export function validateRecord(f: JQuery): any[] {
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

export function uiSetup(): void {
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

    Handlebars.registerHelper('breaklines', (text: string): hbs.SafeString => {
        const escapedText = Handlebars.Utils.escapeExpression(text);
        return new Handlebars.SafeString(escapedText.replace(/(\r\n|\n|\r)/gm, '<br />'));
    });

    Handlebars.registerHelper('truncate', (text: string, size: number): hbs.SafeString => {
        const escapedText = Handlebars.Utils.escapeExpression(truncate(text, size));
        return new Handlebars.SafeString(escapedText);
    });
}

// Initialise the app
export function init(basePath: string, devMode: boolean): void {
    // Set the base path for AJAX requests/redirects
    internal.basePath = basePath;

    repository = new Repository(internal.basePath);

    uiSetup();

    ui.container.on('click', '.btn-credential-show-detail', (e: Event): void => {
        e.preventDefault();
        const id: string = $(e.currentTarget).parent().parent().attr('id');
        showDetail(id, internal.masterKey);
    });

    ui.newButton.on('click', (e: Event): void => {
        e.preventDefault();
        loadCredential(null, internal.masterKey);
    });

    ui.adminButton.on('click', (e: Event): void => {
        e.preventDefault();
        optionsDialog();
    });

    ui.clearSearchButton.on('click', async (e: Event): Promise<void> => {
        e.preventDefault();
        const credentials = await repository.loadCredentialsForUser(internal.userId);
        const decrypted = cryptoProvider.decryptCredentials(credentials, internal.masterKey, ['CredentialID', 'UserID']);
        const results = vault.search(null, decrypted);
        updateCredentialListUI(ui.container, results, internal.userId, internal.masterKey);
        ui.searchInput.val('').focus();
    });

    ui.searchInput.on('keyup', rateLimit(async e => {
        const credentials = await repository.loadCredentialsForUser(internal.userId);
        const decrypted = cryptoProvider.decryptCredentials(credentials, internal.masterKey, ['CredentialID', 'UserID']);
        const results = vault.search((e.currentTarget as HTMLInputElement).value, decrypted);
        updateCredentialListUI(ui.container, results, internal.userId, internal.masterKey);
    }, 200));

    // Initialise globals and load data on correct login
    ui.loginForm.on('submit', async (e: Event): Promise<void> => {
        e.preventDefault();

        const username: string = ui.loginForm.find('#UN1209').val();
        const password: string = ui.loginForm.find('#PW9804').val();

        const loginResult = await repository.login(cryptoProvider.hash(username), cryptoProvider.hash(password));

        // If the details were valid
        if (loginResult.result === 1 && loginResult.id !== '') {
            // Set some private variables so that we can reuse them for encryption during this session
            internal.userId = loginResult.id;
            internal.password = password;
            internal.masterKey = cryptoProvider.utf8ToBase64(cryptoProvider.generateMasterKey(internal.password));

            await repository.loadCredentialsForUser(internal.userId);
            // Successfully logged in. Hide the login form
            ui.loginForm.hide();
            ui.loginFormDialog.modal('hide');
            ui.controls.show();
            ui.searchInput.focus();
        }
    });

    // Save the new details on edit form submit
    $('body').on('submit', '#credential-form', async e => {
        e.preventDefault();

        const form: JQuery = $(e.currentTarget);
        const errorMsg: string[] = [];

        $('#validation-message').remove();
        form.find('div.has-error').removeClass('has-error');

        const errors = validateRecord(form);

        if (errors.length > 0) {
            errors.forEach((error: any): void => {
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
        credential = cryptoProvider.encryptCredential(credential, internal.masterKey, ['CredentialID', 'UserID']);

        await repository.updateCredential(credential);

        const updatedCredentials = await repository.loadCredentialsForUser(internal.userId);

        const decrypted = cryptoProvider.decryptCredentials(updatedCredentials, internal.masterKey, ['CredentialID', 'UserID']);
        const results = vault.search(ui.searchInput.val(), decrypted);

        ui.modal.modal('hide');

        updateCredentialListUI(ui.container, results, internal.userId, internal.masterKey);

        return;
    });

    // Show password strength as it is typed
    $('body').on('keyup', '#Password', rateLimit(e => {
        showPasswordStrength($(e.currentTarget));
    }, 200));

    // Generate a nice strong password
    $('body').on('click', 'button.generate-password', e => {
        e.preventDefault();
        const passwordSpecification = getPasswordGenerationOptionValues($('input.generate-password-option'), isChecked);
        const password: string = cryptoProvider.generatePassword(passwordSpecification);
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
    $('body').on('click', 'a.generate-password-options-toggle', e => {
        e.preventDefault();
        $('div.generate-password-options').toggle();
    });

    // Copy content to clipboard when copy icon is clicked
    $('body').on('click', 'a.copy-link', e => {
        e.preventDefault();
        const a: JQuery = $(e.currentTarget);
        $('a.copy-link').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');
        a.next('input.copy-content').select();
        try {
            if (document.execCommand('copy')) {
                a.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
            }
        } catch (ex) {
            alert('Copy operation is not supported by the current browser: ' + ex.message);
        }
    });

    $('body').on('click', 'button.btn-credential-open', e => {
        e.preventDefault();
        open($(e.currentTarget).data('url'));
    });

    $('body').on('click', 'button.btn-credential-copy', e => {
        e.preventDefault();
        const allButtons: JQuery = $('button.btn-credential-copy');
        const button: JQuery = $(e.currentTarget);
        allButtons.removeClass('btn-success').addClass('btn-primary');
        allButtons.find('span').addClass('fa-clone').removeClass('fa-check-square');
        button.next('input.copy-content').select();
        try {
            if (document.execCommand('copy')) {
                button.addClass('btn-success').removeClass('btn-primary');
                button.find('span').removeClass('fa-clone').addClass('fa-check-square');
            }
        } catch (ex) {
            alert('Copy operation is not supported by the current browser: ' + ex.message);
        }
    });

    // Automatically focus the search field if a key is pressed from the credential list
    $('body').on('keydown', e => {
        const eventTarget = e.target as HTMLElement;
        if (eventTarget.nodeName === 'BODY') {
            e.preventDefault();
            // Cancel the first mouseup event which will be fired after focus
            ui.searchInput.one('mouseup', (me: Event) => {
                me.preventDefault();
            });
            ui.searchInput.focus();
            const char: string = String.fromCharCode(e.keyCode);
            if (/[a-zA-Z0-9]/.test(char)) {
                ui.searchInput.val(e.shiftKey ? char : char.toLowerCase());
            } else {
                ui.searchInput.select();
            }
        }
    });

    $('body').on('click', '#change-password-button', e => {
        const newPassword = $('#NewPassword').val() as string;
        const newPasswordConfirm = $('#NewPasswordConfirm').val() as string;

        const confirmationMsg = 'When the password change is complete you will be logged out and will need to log back in.\n\n'
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

        changePassword(internal.userId, internal.masterKey, internal.password, newPassword).then(() => {
            // Just reload the whole page when we're done to force login
            location.href = internal.basePath.length > 1 ? internal.basePath.slice(0, -1) : internal.basePath;
        });
    });

    $('body').on('click', '#export-button', async e => {
        e.preventDefault();
        const exportedData = await exportData(internal.userId, internal.masterKey);
        openExportPopup(exportedData);
    });

    $('body').on('click', '#import-button', async e => {
        e.preventDefault();
        const rawData = $('#import-data').val() as string;
        const parsedData = parseImportData(internal.userId, internal.masterKey, rawData);
        await repository.updateMultiple(parsedData);
        reloadApp();
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

export function testInit(testRepository: IRepository, testCryptoProvider: ICryptoProvider): void {
    repository = testRepository;
}

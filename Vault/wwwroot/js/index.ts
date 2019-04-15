import 'bootstrap/js/modal';
import * as Handlebars from 'handlebars';
import $ from 'jquery';
import * as Cookies from 'js-cookie';
import {
    generatePassword,
    getPasswordBits,
    getPasswordSpecificationFromPassword,
    isWeakPassword,
    mapToSummary,
    parsePasswordSpecificationString,
    parseSearchQuery,
    rateLimit,
    searchCredentials,
    sortCredentials,
    truncate,
    validateCredential,
    weakPasswordThreshold
} from './modules/all';
import {
    ICredential,
    ISecurityKeyDetails,
    PasswordSpecification,
    Repository
} from './types/all';

interface IVaultGlobals {
    // Base URL (used mostly for XHR requests, particularly when app is hosted as a sub-application)
    baseUrl: string;
    // Current absolute URL (used for app refresh and auto-logout)
    absoluteUrl: string;
    sessionTimeoutInSeconds: number;
    securityKey?: ISecurityKeyDetails;
    devMode: boolean;
}

interface IVaultUIElements {
    body: JQuery;
    loginFormDialog: JQuery;
    loginForm: JQuery;
    loginErrorMessage: JQuery;
    container: JQuery;
    controls: JQuery;
    modal: JQuery;
    modalContent: JQuery;
    newButton: JQuery;
    adminButton: JQuery;
    clearSearchButton: JQuery;
    searchInput: JQuery;
    spinner: JQuery;
}

interface IVaultUITemplates {
    urlLink: HandlebarsTemplateDelegate;
    urlText: HandlebarsTemplateDelegate;
    detail: HandlebarsTemplateDelegate;
    credentialForm: HandlebarsTemplateDelegate;
    deleteConfirmationDialog: HandlebarsTemplateDelegate;
    optionsDialog: HandlebarsTemplateDelegate;
    credentialTable: HandlebarsTemplateDelegate;
    credentialTableRow: HandlebarsTemplateDelegate;
    validationMessage: HandlebarsTemplateDelegate;
    modalHeader: HandlebarsTemplateDelegate;
    modalBody: HandlebarsTemplateDelegate;
    modalFooter: HandlebarsTemplateDelegate;
    copyLink: HandlebarsTemplateDelegate;
    exportedDataWindow: HandlebarsTemplateDelegate;
}

interface IVaultModalOptions {
    title: string;
    content: string;
    credentialId?: string;
    showAccept?: boolean;
    acceptText?: string;
    onaccept?: (e: JQuery.Event) => void;
    showClose?: boolean;
    closeText?: string;
    onclose?: (e: JQuery.Event) => void;
    showEdit?: boolean;
    editText?: string;
    onedit?: (e: JQuery.Event) => void;
    showDelete?: boolean;
    deleteText?: string;
    ondelete?: (e: JQuery.Event) => void;
}

declare var _VAULT_GLOBALS: IVaultGlobals;

const sessionTimeoutMs = _VAULT_GLOBALS.sessionTimeoutInSeconds * 1000;

const repository = new Repository(_VAULT_GLOBALS.securityKey);

const defaultPasswordSpecification = new PasswordSpecification(16, true, true, true, true);

const ui: IVaultUIElements = {
    body: $('body'),
    loginFormDialog: $('#login-form-dialog'),
    loginForm: $('#login-form'),
    loginErrorMessage: $('#login-form-dialog').find('.validation-message'),
    container: $('#container'),
    controls: $('#controls'),
    modal: $('#modal'),
    modalContent: $('#modal-content'),
    newButton: $('#new'),
    adminButton: $('#admin'),
    clearSearchButton: $('#clear-search'),
    searchInput: $('#search'),
    spinner: $('#spinner')
};

const templates: IVaultUITemplates = {
    urlLink: Handlebars.compile($('#tmpl-urllink').html()),
    urlText: Handlebars.compile($('#tmpl-urltext').html()),
    detail: Handlebars.compile($('#tmpl-detail').html()),
    credentialForm: Handlebars.compile($('#tmpl-credentialform').html()),
    deleteConfirmationDialog: Handlebars.compile($('#tmpl-deleteconfirmationdialog').html()),
    optionsDialog: Handlebars.compile($('#tmpl-optionsdialog').html()),
    exportedDataWindow: Handlebars.compile($('#tmpl-exporteddatawindow').html()),
    credentialTable: Handlebars.compile($('#tmpl-credentialtable').html()),
    credentialTableRow: Handlebars.compile($('#tmpl-credentialtablerow').html()),
    validationMessage: Handlebars.compile($('#tmpl-validationmessage').html()),
    modalHeader: Handlebars.compile($('#tmpl-modalheader').html()),
    modalBody: Handlebars.compile($('#tmpl-modalbody').html()),
    modalFooter: Handlebars.compile($('#tmpl-modalfooter').html()),
    copyLink: Handlebars.compile($('#tmpl-copylink').html())
};

Handlebars.registerPartial('credentialtablerow', templates.credentialTableRow);

Handlebars.registerPartial('copylink', templates.copyLink);

Handlebars.registerHelper('breaklines', (text: string) => {
    const escapedText = Handlebars.Utils.escapeExpression(text);
    return new Handlebars.SafeString(escapedText.replace(/(\r\n|\n|\r)/gm, '<br />'));
});

Handlebars.registerHelper('truncate', (text: string, size: number) => {
    const escapedText = Handlebars.Utils.escapeExpression(truncate(text, size));
    return new Handlebars.SafeString(escapedText);
});

let currentSession: any = null;

// Pure functions

export function isChecked(el: JQuery) {
    return (el[0] as HTMLInputElement).checked;
}

export function checkIf(el: JQuery, condition: boolean) {
    (el[0] as HTMLInputElement).checked = condition;
}

export function getPasswordSpecificationFromUI(container: JQuery, predicate: (element: JQuery) => boolean) {
    const len = parseInt(container.find('[name=len]').val() as string, 10);
    const specification = new PasswordSpecification(
        isNaN(len) ? 16 : len,
        predicate(container.find('[name=lcase]')),
        predicate(container.find('[name=ucase]')),
        predicate(container.find('[name=nums]')),
        predicate(container.find('[name=symb]'))
    );
    return specification;
}

export function updatePasswordSpecificationOptionUI(container: JQuery, specification: PasswordSpecification) {
    container.find('[name=len]').val(specification.length);
    checkIf(container.find('[name=ucase]'), specification.uppercase);
    checkIf(container.find('[name=lcase]'), specification.lowercase);
    checkIf(container.find('[name=nums]'), specification.numbers);
    checkIf(container.find('[name=symb]'), specification.symbols);
}

export function getCredentialFromUI(container: JQuery) {
    const obj: any = {};
    // Serialize the form inputs into an object
    container.find('input:not(.submit, .chrome-autocomplete-fake), textarea').each((i, el) => {
        obj[(el as HTMLInputElement).name] = $(el).val();
    });
    return (obj as ICredential);
}

export function parseImportData(rawData: string) {
    const jsonImportData = JSON.parse(rawData) as ICredential[];

    const newData = jsonImportData.map(item => {
        // Null out any existing credential ID so that the UpdateMultipleCredentials
        // endpoint knows that this is a new record, not an update
        item.CredentialID = null;
        return item;
    });

    return newData;
}

// Impure functions

const reloadApp = () => location.href = _VAULT_GLOBALS.absoluteUrl;

function setSession() {
    clearTimeout(currentSession);
    currentSession = setTimeout(reloadApp, sessionTimeoutMs);
}

function search(query: string, credentials: ICredential[]) {
    const parsedQuery = parseSearchQuery(query);
    const results = searchCredentials(parsedQuery, isWeakPassword, credentials);
    return sortCredentials(results);
}

function updateCredentialListUI(container: JQuery, data: ICredential[]) {
    const rows = data.map(c => mapToSummary(c, isWeakPassword));
    container.html(templates.credentialTable({ rows: rows }));
}

function confirmDelete(id: string) {
    showModal({
        title: 'Delete Credential',
        content: templates.deleteConfirmationDialog({}),
        showDelete: true,
        deleteText: 'Yes, Delete This Credential',
        ondelete: async e => {
            e.preventDefault();

            ui.spinner.show();

            await repository.deleteCredential(id);

            const updatedCredentials = await repository.loadCredentialSummaryList();

            ui.spinner.hide();

            const results = search(ui.searchInput.val() as string, updatedCredentials);
            updateCredentialListUI(ui.container, results);

            ui.modal.modal('hide');
        }
    });
}

function hideModal(e: JQuery.Event) {
    e.preventDefault();
    ui.modal.modal('hide');
}

async function editCredential(credentialId: string) {
    ui.spinner.show();

    const credential = await repository.loadCredential(credentialId);

    ui.spinner.hide();

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

    const savedPasswordSpecification = parsePasswordSpecificationString(credential.PwdOptions);
    const currentPasswordSpecification = getPasswordSpecificationFromPassword(credential.Password);

    // Rather convoluted, but this is why:
    // - If there's a valid password spec stored against the credential, use that
    // - If there isn't a stored spec, work out the spec from the current password and use that
    // - If there isn't a password, use the default specification
    const passwordSpecification = savedPasswordSpecification
        || currentPasswordSpecification
        || defaultPasswordSpecification;

    updatePasswordSpecificationOptionUI(ui.modal, passwordSpecification);
}

function openExportPopup(data: ICredential[]) {
    const exportWindow = open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
    if (exportWindow && exportWindow.top) {
        exportWindow.document.write(templates.exportedDataWindow({ json: JSON.stringify(data, undefined, 4) }));
    } else {
        alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
    }
}

function optionsDialog() {
    showModal({
        title: 'Admin',
        content: templates.optionsDialog({})
    });
}

async function showDetail(credentialId: string) {
    ui.spinner.show();

    const credential = await repository.loadCredential(credentialId);

    ui.spinner.hide();

    // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
    const urlText = templates.urlText({ Url: credential.Url });
    const urlHtml = credential.Url.indexOf('//') === -1 ? urlText : templates.urlLink({ Url: credential.Url, UrlText: urlText });

    const detailHtml = templates.detail({
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
        onedit: () => editCredential(credentialId),
        ondelete: () => confirmDelete(credentialId)
    });
}

function showModal(options: IVaultModalOptions) {
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
    ui.modal.on('click', 'button.btn-accept', options.onaccept || hideModal);
    ui.modal.on('click', 'button.btn-close', options.onclose || hideModal);
    ui.modal.on('click', 'button.btn-edit', options.onedit || (() => alert('NOT BOUND')));
    ui.modal.on('click', 'button.btn-delete', options.ondelete || (() => alert('NOT BOUND')));
    ui.modal.modal();
}

function showPasswordStrength(field: JQuery) {
    const strengthIndicator = field.next('div.password-strength');
    const status = strengthIndicator.find('> span');
    const bar = strengthIndicator.find('> div');
    const password = field.val() as string;
    const strength = getPasswordBits(password);
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

// Event handlers

ui.container.on('click', '.btn-credential-show-detail', e => {
    e.preventDefault();
    const id = $(e.currentTarget).parent().parent().attr('id');
    showDetail(id);
});

ui.newButton.on('click', e => {
    e.preventDefault();
    showModal({
        title: 'Add Credential',
        content: templates.credentialForm({}),
        showAccept: true,
        acceptText: 'Save',
        onaccept: (): void => {
            $('#credential-form').submit();
        }
    });
    ui.modal.find('#Description').focus();
    showPasswordStrength(ui.modal.find('#Password'));
    updatePasswordSpecificationOptionUI(ui.modal, defaultPasswordSpecification);
});

ui.adminButton.on('click', e => {
    e.preventDefault();
    optionsDialog();
});

ui.clearSearchButton.on('click', async e => {
    e.preventDefault();
    updateCredentialListUI(ui.container, []);
    ui.searchInput.val('').focus();
});

ui.searchInput.on('keyup', rateLimit(async e => {
    ui.spinner.show();
    const credentials = await repository.loadCredentialSummaryList();
    ui.spinner.hide();
    const results = search((e.currentTarget as HTMLInputElement).value, credentials);
    updateCredentialListUI(ui.container, results);
}, 200));

ui.loginForm.on('submit', async e => {
    e.preventDefault();

    ui.spinner.show();

    const username = ui.loginForm.find('#UN1209').val() as string;
    const password = ui.loginForm.find('#PW9804').val() as string;

    ui.loginErrorMessage.text('');

    const loginResult = await repository.login(username, password);

    if (loginResult.Success) {
        ui.loginForm.hide();
        ui.loginFormDialog.modal('hide');
        ui.controls.show();
        ui.searchInput.focus();
        setSession();
        ui.body.on('click keyup', setSession);
    } else {
        ui.loginErrorMessage.text('Login failed');
    }

    ui.spinner.hide();
});

ui.body.on('submit', '#credential-form', async e => {
    e.preventDefault();

    const form = $(e.currentTarget);
    const errorMsg: string[] = [];

    $('.validation-message').remove();
    form.find('div.has-error').removeClass('has-error');

    const credential = getCredentialFromUI(form);

    const errors = validateCredential(credential);

    if (errors.length > 0) {
        errors.forEach(err => {
            errorMsg.push(err.errorMessage);
            $(`${err.property}`).parent().parent().addClass('has-error');
        });

        ui.modal.find('div.modal-body').prepend(templates.validationMessage({ errors: errorMsg.join('<br />') }));
        return;
    }

    ui.spinner.show();

    if (!credential.CredentialID) {
        await repository.createCredential(credential);
    } else {
        await repository.updateCredential(credential);
    }

    const updatedCredentials = await repository.loadCredentialSummaryList();

    const results = search(ui.searchInput.val() as string, updatedCredentials);

    ui.spinner.hide();

    ui.modal.modal('hide');

    updateCredentialListUI(ui.container, results);
});

// Show password strength as it is typed
ui.body.on('keyup', '#Password', rateLimit(e => {
    showPasswordStrength($(e.target));
}, 200));

ui.body.on('click', 'button.generate-password', e => {
    e.preventDefault();
    const passwordSpecification = getPasswordSpecificationFromUI(ui.modal, isChecked);
    const password = generatePassword(passwordSpecification);
    $('#Password').val(password);
    const opts = [$('#len').val() as number,
    isChecked($('#ucase')) ? 1 : 0,
    isChecked($('#lcase')) ? 1 : 0,
    isChecked($('#nums')) ? 1 : 0,
    isChecked($('#symb')) ? 1 : 0];
    $('#PwdOptions').val(opts.join('|'));
    showPasswordStrength($('#Password'));
});

// Toggle password generation option UI visibility
ui.body.on('click', 'a.generate-password-options-toggle', e => {
    e.preventDefault();
    $('div.generate-password-options').toggle();
});

ui.body.on('click', 'a.copy-link', e => {
    e.preventDefault();
    const a = $(e.currentTarget);
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

ui.body.on('click', 'button.btn-credential-open', e => {
    e.preventDefault();
    open($(e.currentTarget).data('url'));
});

ui.body.on('click', 'button.btn-credential-copy', e => {
    e.preventDefault();
    const allButtons = $('button.btn-credential-copy');
    const button = $(e.currentTarget);
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
ui.body.on('keydown', e => {
    const eventTarget = e.target as HTMLElement;
    if (eventTarget.nodeName === 'BODY') {
        e.preventDefault();
        // Cancel the first mouseup event which will be fired after focus
        ui.searchInput.one('mouseup', me => {
            me.preventDefault();
        });
        ui.searchInput.focus();
        const char = String.fromCharCode(e.keyCode);
        if (/[a-zA-Z0-9]/.test(char)) {
            ui.searchInput.val(e.shiftKey ? char : char.toLowerCase());
        } else {
            ui.searchInput.select();
        }
    }
});

ui.body.on('click', '#change-password-button', async e => {
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

    ui.spinner.show();

    await repository.updatePassword(newPassword);

    ui.spinner.hide();

    reloadApp();
});

ui.body.on('click', '#export-button', async e => {
    e.preventDefault();
    ui.spinner.show();
    const exportedData = await repository.loadCredentials();
    ui.spinner.hide();
    openExportPopup(exportedData);
});

ui.body.on('click', '#import-button', async e => {
    e.preventDefault();
    ui.spinner.show();
    const rawData = $('#import-data').val() as string;
    const parsedData = parseImportData(rawData);
    await repository.import(parsedData);
    ui.spinner.hide();
    reloadApp();
});

// If we're in dev mode, automatically log in with a cookie manually created on the dev machine
if (_VAULT_GLOBALS.devMode) {
    ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
    ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
    ui.loginForm.submit();
} else {
    ui.loginForm.find('#UN1209').focus();
}

ui.loginFormDialog.modal({ keyboard: false, backdrop: 'static' });

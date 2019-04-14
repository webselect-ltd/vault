import $ from 'jquery';
import { hash } from './modules/all';

const dialog = $('#generate-form-dialog');

async function generatePassword(e: JQuery.Event) {
    e.preventDefault();

    const usernameHash = await hash($('#Username').val() as string);
    const passwordHash = await hash($('#Password').val() as string);

    $('#HashedUsername').attr('value', usernameHash);
    $('#HashedPassword').attr('value', passwordHash);
}

dialog.find('.btn-primary').on('click', generatePassword);

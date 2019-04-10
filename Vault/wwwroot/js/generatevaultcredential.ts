import $ from 'jquery';
import { hash } from './modules/all';

const dialog = $('#generate-form-dialog');

function generatePassword(e: JQuery.Event) {
    e.preventDefault();

    $('#HashedUsername').attr('value', hash($('#Username').val() as string));
    $('#HashedPassword').attr('value', hash($('#Password').val() as string));
}

dialog.find('.btn-primary').on('click', generatePassword);

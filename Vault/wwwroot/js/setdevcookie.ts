import $ from 'jquery';
import * as Cookies from 'js-cookie';

const dialog = $('#set-dev-cookie-form-dialog');

function setDevCookie(e: JQuery.Event) {
    e.preventDefault();

    Cookies.set('vault-dev-username', $('#Username').val() as string);
    Cookies.set('vault-dev-password', $('#Password').val() as string);

    alert('Cookie set');
}

dialog.find('.btn-primary').on('click', setDevCookie);

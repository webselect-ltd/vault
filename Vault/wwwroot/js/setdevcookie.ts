import $ from 'jquery';
import * as Cookies from 'js-cookie';

const dialog = $('#set-dev-cookie-form-dialog');

const cookieOptions: Cookies.CookieAttributes = {
    sameSite: 'strict',
    secure: true
};

function setDevCookie(e: JQuery.Event) {
    e.preventDefault();

    Cookies.set('vault-dev-username', $('#Username').val() as string, cookieOptions);
    Cookies.set('vault-dev-password', $('#Password').val() as string, cookieOptions);

    alert('Cookie set');
}

dialog.find('.btn-primary').on('click', setDevCookie);

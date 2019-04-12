# About Vault

Vault is a very simple ASP.NET MVC web application for storing encrypted personal login details (usernames, passwords etc). It uses the [Passpack Host-Proof Hosting package](http://code.google.com/p/passpack/) to do all encryption and decryption on the client and avoid passing vulnerable plain-text data to the server. 

Although all data is encrypted before transmission over HTTP, **this application should *always* be used over an SSL-encrypted connection**.

*Please Note:* Due to the use of the native `window.atob` and `window.btoa` functions, Vault only works in Firefox, Chrome, Safari or Internet Explorer *10+*.

## External Libraries/Dependencies

* Vault uses [jQuery](http://jquery.com/), [Handlebars.js](http://handlebarsjs.com/) for client-side templating and [Bootstrap](http://getbootstrap.com/) for layout/UI widgets. 
* Encryption is handled by the [Passpack Host-Proof Hosting package](http://code.google.com/p/passpack/).

## Database

Vault supports both SQLite and SQL Server databases. Set the type and connection string accordingly in `appsettings.json`:

### SQL Server

    "DbType": "SQLServer",
    "ConnectionStrings": {
        "Main": "Server=YOUR_SERVER_NAME;Database=vault;Trusted_Connection=yes;"
    }

### SQLite

    "DbType": "SQLite",
    "ConnectionStrings": {
        "Main": "Data Source=C:\\PATH_TO_YOUR_DB\\vault.sqlite;Version=3;"
    }

## Filters

You can filter credential search results by using query prefixes. Currently available prefixes are:

* `username:XXXX`: shows all credentials where username matches `XXXX`
* `password:XXXX`: shows all credentials where password matches `XXXX`
* `description:XXXX`: shows all credentials where description matches `XXXX`
* `url:XXXX`: shows all credentials where URL matches `XXXX`
* `filter:weak`: shows all credentials where the password strength is lower than the weak password threshold
* `filter:all`: shows *all* credentials

## Bookmarklet

This bookmarklet will log you in (use at your own risk, and obviously not on shared computers):

    javascript:(function(){document.getElementById('UN1209').value='YOUR_USER_NAME';document.getElementById('PW9804').value='YOUR_PASSWORD';document.querySelectorAll('#login-form .btn-primary')[0].click();})();


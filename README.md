# About Vault

Vault is a very simple ASP.NET web application for storing encrypted personal login details (usernames, passwords etc). It uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) to do all encryption and decryption on the client and avoid passing vulnerable plain-text data to the server.

Although all data is encrypted before transmission over HTTP, **this application should *always* be used over an SSL-encrypted connection** to avoid interception of the password hash.

*Please Note:* Due to the use of the Web Crypto API, Vault only works in [recent versions of modern browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API#Browser_compatibility).

## External Libraries/Dependencies

* Vault uses [Handlebars.js](http://handlebarsjs.com/) for client-side templating and [Bootstrap](http://getbootstrap.com/) for layout/UI widgets.

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

## Development

### `/Home/GenerateVaultCredential`

This endpoint lets you generate a new hashed credential pair for manual insertion into your Vault database (which is currently the only way to create a new user).

# Manual Testing

Although there is an automated test suite for the TypeScript code, this runs under [jsdom](https://github.com/jsdom/jsdom), so there could potentially be discrepancies between the test environment and actual web browsers. Unfortunately, at the time of writing there is no good browser testing story for [Jest](https://jestjs.io/).

Luckily, Vault is a very simple app, so it's easy to manually test all the features. The basic list is:

 - Log in
 - Test search
 - Test search filters
    - `username:XXXX`
    - `password:XXXX`
    - `description:XXXX`
    - `url:XXXX`
    - `filter:weak`
    - `filter:all`
 - Add a new credential (fill in all fields and generate password) and save
 - Search for the new credential
 - Edit the new credential (alter all fields) and save
 - Search for the edited credential
 - Delete the edited credential
 - Open admin and change the master password
 - Log in again
 - Open admin and import credentials (copy/paste the contents of `test-credentials.json`)
 - Search for imported credentials
 - Open admin and export

 This should cover all the basic application functions.

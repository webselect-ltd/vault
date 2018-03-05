var FakeRepository = (function () {
    function FakeRepository(credentials, masterKey) {
        this.credentials = credentials;
        this.encryptedCredentials = credentials.map(function (c) { return Vault.encryptObject(c, masterKey, ['CredentialID', 'UserID']); });
    }
    FakeRepository.prototype.login = function (hashedUsername, hashedPassword, onLoad) {
    };
    FakeRepository.prototype.loadCredential = function (credentialId, onLoad) {
        onLoad(this.encryptedCredentials.filter(function (c) { return c.CredentialID === credentialId; })[0]);
    };
    FakeRepository.prototype.loadCredentialsForUser = function (userId, onLoad) {
        onLoad(this.encryptedCredentials.filter(function (c) { return c.UserID === userId; }));
    };
    FakeRepository.prototype.loadCredentialsForUserFull = function (userId, onLoad) {
        onLoad(this.encryptedCredentials.filter(function (c) { return c.UserID === userId; }));
    };
    FakeRepository.prototype.updateCredential = function (credential, onUpdated) {
    };
    FakeRepository.prototype.updatePassword = function (userId, oldHash, newHash, onUpdated) {
    };
    FakeRepository.prototype.updateMultiple = function (credentials, onUpdated) {
    };
    FakeRepository.prototype.deleteCredential = function (userId, credentialId, onDeleted) {
    };
    return FakeRepository;
}());
//# sourceMappingURL=FakeRepository.js.map
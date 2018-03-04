var Credential = (function () {
    function Credential(credentialID, userID, description, username, password, passwordConfirmation, url, userDefined1Label, userDefined1, userDefined2Label, userDefined2, notes, pwdOptions) {
        this.CredentialID = credentialID;
        this.UserID = userID;
        this.Description = description;
        this.Username = username;
        this.Password = password;
        this.PasswordConfirmation = passwordConfirmation;
        this.Url = url;
        this.UserDefined1Label = userDefined1Label;
        this.UserDefined1 = userDefined1;
        this.UserDefined2Label = userDefined2Label;
        this.UserDefined2 = userDefined2;
        this.Notes = notes;
        this.PwdOptions = pwdOptions;
    }
    return Credential;
}());
//# sourceMappingURL=Credential.js.map
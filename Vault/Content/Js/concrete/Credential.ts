export class Credential {
    public CredentialID: string;
    public UserID: string;
    public Description: string;
    public Username: string;
    public Password: string;
    public PasswordConfirmation: string;
    public Url: string;
    public UserDefined1Label: string;
    public UserDefined1: string;
    public UserDefined2Label: string;
    public UserDefined2: string;
    public Notes: string;
    public PwdOptions: string;
    [propertyName: string]: string;

    constructor(credentialID: string, userID: string, description: string)
    constructor(credentialID: string, userID: string, description: string, username: string, password: string)
    constructor(
        credentialID: string,
        userID: string,
        description: string,
        username: string,
        password: string,
        passwordConfirmation: string,
        url: string,
        userDefined1Label: string,
        userDefined1: string,
        userDefined2Label: string,
        userDefined2: string,
        notes: string,
        pwdOptions: string)
    constructor(
        credentialID: string,
        userID: string,
        description: string,
        username?: string,
        password?: string,
        passwordConfirmation?: string,
        url?: string,
        userDefined1Label?: string,
        userDefined1?: string,
        userDefined2Label?: string,
        userDefined2?: string,
        notes?: string,
        pwdOptions?: string) {
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
}

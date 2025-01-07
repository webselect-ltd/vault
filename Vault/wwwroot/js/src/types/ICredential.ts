export interface ICredential {
    credentialID: string;
    userID: string;
    description: string;
    username?: string;
    password?: string;
    url?: string;
    userDefined1Label?: string;
    userDefined1?: string;
    userDefined2Label?: string;
    userDefined2?: string;
    notes?: string;
    pwdOptions?: string;
    tagIDs?: string;
    tagLabels?: string[];
}

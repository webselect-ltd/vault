import { ICredential, ICryptoProvider, IRepository } from '../types/all';

export class FakeRepository implements IRepository {
    public cryptoProvider: ICryptoProvider;
    public credentials: ICredential[];
    public encryptedCredentials: ICredential[];

    constructor(cryptoProvider: ICryptoProvider, masterKey: string) {
        this.credentials = [{
            CredentialID: 'cr1',
            UserID: 'user1',
            Description: 'Cat',
            Username: 'cat',
            Password: 'cat123',
            Url: 'http://cat.com',
            UserDefined1Label: 'Cat UD 1',
            UserDefined1: 'catud1',
            UserDefined2Label: 'Cat UD 1',
            UserDefined2: 'catud1',
            Notes: 'Cat notes',
            PwdOptions: '12|1|1|1|1'
        }, {
            CredentialID: 'cr2',
            UserID: 'user1',
            Description: 'Dog',
            Username: 'dog',
            Password: 'dog123',
            Url: 'http://dog.com',
            UserDefined1Label: 'Dog UD 1',
            UserDefined1: 'dogud1',
            UserDefined2Label: 'Dog UD 1',
            UserDefined2: 'dogud1',
            Notes: 'Dog notes',
            PwdOptions: '12|1|1|1|1'
        }, {
            CredentialID: 'cr3',
            UserID: 'user1',
            Description: 'Fish',
            Username: 'fish',
            Password: 'fish123',
            Url: 'http://fish.com',
            UserDefined1Label: 'Fish UD 1',
            UserDefined1: 'fishud1',
            UserDefined2Label: 'Fish UD 1',
            UserDefined2: 'fishud1',
            Notes: 'Fish notes',
            PwdOptions: '12|1|1|1|1'
        }, {
            CredentialID: 'cr4',
            UserID: 'user1',
            Description: 'Catfish',
            Username: 'catfish',
            Password: 'catfish123',
            Url: 'http://catfish.com',
            UserDefined1Label: 'Catfish UD 1',
            UserDefined1: 'catfishud1',
            UserDefined2Label: 'Catfish UD 1',
            UserDefined2: 'catfishud1',
            Notes: 'Catfish notes',
            PwdOptions: '12|1|1|1|1'
        }, {
            CredentialID: 'cr5',
            UserID: 'user1',
            Description: 'Dogfish',
            Username: 'dogfish',
            Password: 'dogfish123',
            Url: 'http://dogfish.com',
            UserDefined1Label: 'Dogfish UD 1',
            UserDefined1: 'dogfishud1',
            UserDefined2Label: 'Dogfish UD 1',
            UserDefined2: 'dogfishud1',
            Notes: 'Dogfish notes',
            PwdOptions: '12|1|1|1|1'
        }, {
            CredentialID: 'cr6',
            UserID: 'user1',
            Description: 'Owl',
            Username: 'owl',
            Password: '_nT:NP?uovID8,TE',
            Url: 'http://owl.com',
            UserDefined1Label: 'Owl UD 1',
            UserDefined1: 'owlud1',
            UserDefined2Label: 'Owl UD 1',
            UserDefined2: 'owlud1',
            Notes: 'Owl notes',
            PwdOptions: '12|1|1|1|1'
        }];

        this.encryptedCredentials = cryptoProvider.encryptCredentials(this.credentials, masterKey, ['CredentialID', 'UserID']);
    }

    public async login(hashedUsername: string, hashedPassword: string): Promise<any> {
        // TODO: Implement
    }

    public async loadCredential(credentialId: string): Promise<ICredential> {
        return this.encryptedCredentials.filter(c => c.CredentialID === credentialId)[0];
    }

    public async loadCredentialsForUser(userId: string): Promise<ICredential[]> {
        return this.encryptedCredentials.filter(c => c.UserID === userId);
    }

    public async loadCredentialsForUserFull(userId: string): Promise<ICredential[]> {
        return new Promise<ICredential[]>(resolve => resolve(this.encryptedCredentials.filter(c => c.UserID === userId)));
    }

    public async updateCredential(credential: ICredential): Promise<ICredential> {
        return new Promise<ICredential>(resolve => resolve());
    }

    public async updatePassword(userId: string, oldHash: string, newHash: string): Promise<void> {
        return new Promise<void>(resolve => resolve());
    }

    public async updateMultiple(credentials: ICredential[]): Promise<void> {
        this.encryptedCredentials = credentials;
        return new Promise<void>(resolve => resolve());
    }

    public async deleteCredential(userId: string, credentialId: string): Promise<void> {
        this.credentials = this.credentials.filter(c => c.CredentialID !== credentialId);
        this.encryptedCredentials = this.encryptedCredentials.filter(c => c.CredentialID !== credentialId);
        return new Promise<void>(resolve => resolve());
    }
}

import { ICryptoProvider, IRepository } from '../Abstract';
import { Credential } from '../Concrete';

export class FakeRepository implements IRepository {
    private cryptoProvider: ICryptoProvider;
    private credentials: Credential[];
    private encryptedCredentials: Credential[];

    constructor(credentials: Credential[], cryptoProvider: ICryptoProvider, masterKey: string) {
        this.credentials = credentials;
        this.encryptedCredentials = cryptoProvider.encryptCredentials(credentials, masterKey, ['CredentialID', 'UserID']);
    }

    public async login(hashedUsername: string, hashedPassword: string): Promise<any> {
        // TODO: Implement
    }

    public async loadCredential(credentialId: string): Promise<Credential> {
        return this.encryptedCredentials.filter(c => c.CredentialID === credentialId)[0];
    }

    public async loadCredentialsForUser(userId: string): Promise<Credential[]> {
        return this.encryptedCredentials.filter(c => c.UserID === userId);
    }

    public async loadCredentialsForUserFull(userId: string): Promise<Credential[]> {
        return new Promise<Credential[]>(resolve => resolve(this.encryptedCredentials.filter(c => c.UserID === userId)));
    }

    public async updateCredential(credential: Credential): Promise<Credential> {
        return new Promise<Credential>(resolve => resolve());
    }

    public async updatePassword(userId: string, oldHash: string, newHash: string): Promise<void> {
        return new Promise<void>(resolve => resolve());
    }

    public async updateMultiple(credentials: Credential[]): Promise<void> {
        this.encryptedCredentials = credentials;
        return new Promise<void>(resolve => resolve());
    }

    public async deleteCredential(userId: string, credentialId: string): Promise<void> {
        this.credentials = this.credentials.filter(c => c.CredentialID !== credentialId);
        this.encryptedCredentials = this.encryptedCredentials.filter(c => c.CredentialID !== credentialId);
        return new Promise<void>(resolve => resolve());
    }
}

class FakeRepository implements IRepository {
    private encryptedCredentials: Credential[];

    constructor(private credentials: Credential[], masterKey: string) {
        this.encryptedCredentials = credentials.map(c => Vault.encryptObject(c, masterKey, ['CredentialID', 'UserID']));
    }

    public login(hashedUsername: string, hashedPassword: string, onLoad: (data: any) => void): void {
        
    }

    public loadCredential(credentialId: string, onLoad: (data: Credential) => void): void {
        onLoad(this.encryptedCredentials.filter(c => c.CredentialID === credentialId)[0]);
    }

    public loadCredentialsForUser(userId: string, onLoad: (data: Credential[]) => void): void {
        onLoad(this.encryptedCredentials.filter(c => c.UserID === userId));
    }

    public loadCredentialsForUserFull(userId: string, onLoad: (data: Credential[]) => void): void {
        onLoad(this.encryptedCredentials.filter(c => c.UserID === userId));
    }

    public updateCredential(credential: Credential, onUpdated: (data: Credential) => void): void {
        
    }

    public updatePassword(userId: string, oldHash: string, newHash: string, onUpdated: () => void): void {
        onUpdated();
    }

    public updateMultiple(credentials: Credential[], onUpdated: () => void): void {
        this.encryptedCredentials = credentials;
        onUpdated();
    }

    public deleteCredential(userId: string, credentialId: string, onDeleted: () => void) {
        this.credentials = this.credentials.filter(c => c.CredentialID !== credentialId);
        this.encryptedCredentials = this.encryptedCredentials.filter(c => c.CredentialID !== credentialId);
        onDeleted();
    }
}

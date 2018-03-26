interface IRepository {
    login(hashedUsername: string, hashedPassword: string): Promise<any>;

    loadCredential(credentialId: string): Promise<Credential>;
    loadCredentialsForUser(userId: string): Promise<Credential[]>;
    loadCredentialsForUserFull(userId: string): Promise<Credential[]>;

    updateCredential(credential: Credential): Promise<Credential>;
    updatePassword(userId: string, oldHash: string, newHash: string): Promise<void>;
    updateMultiple(credentials: Credential[]): Promise<void>;

    deleteCredential(userId: string, credentialId: string): Promise<void>;
}

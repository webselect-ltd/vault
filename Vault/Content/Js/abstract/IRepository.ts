interface IRepository {
    login(hashedUsername: string, hashedPassword: string, onLogin: (data: any) => void): void;

    loadCredential(credentialId: string, onLoad: (data: Credential) => void): void;
    loadCredentialsForUser(userId: string, onLoad: (data: Credential[]) => void): void;
    loadCredentialsForUserFull(userId: string, onLoad: (data: Credential[]) => void): void;

    updateCredential(credential: Credential, onUpdated: (data: Credential) => void): void;
    updatePassword(userId: string, oldHash: string, newHash: string, onUpdated: () => void): void;
    updateMultiple(credentials: Credential[], onUpdated: () => void): void;

    deleteCredential(userId: string, credentialId: string, onDeleted: () => void): void;
}

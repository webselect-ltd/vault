import { ICredential } from './all';

export interface IRepository {
    login(hashedUsername: string, hashedPassword: string): Promise<any>;

    loadCredential(credentialId: string): Promise<ICredential>;
    loadCredentialsForUser(userId: string): Promise<ICredential[]>;
    loadCredentialsForUserFull(userId: string): Promise<ICredential[]>;

    updateCredential(credential: ICredential): Promise<ICredential>;
    updatePassword(userId: string, oldHash: string, newHash: string): Promise<void>;
    updateMultiple(credentials: ICredential[]): Promise<void>;

    deleteCredential(userId: string, credentialId: string): Promise<void>;
}

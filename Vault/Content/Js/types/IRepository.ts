import { ICredential, ILoginResult } from './all';

export interface IRepository {
    login(hashedUsername: string, hashedPassword: string): Promise<ILoginResult>;

    loadCredential(credentialId: string): Promise<ICredential>;
    loadCredentialSummaryList(userId: string): Promise<ICredential[]>;
    loadCredentials(userId: string): Promise<ICredential[]>;

    updateCredential(credential: ICredential): Promise<ICredential>;
    updatePassword(userId: string, oldHash: string, newHash: string): Promise<void>;
    updateMultiple(credentials: ICredential[]): Promise<void>;

    deleteCredential(userId: string, credentialId: string): Promise<void>;
}

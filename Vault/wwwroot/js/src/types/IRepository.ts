import { ICredential, ICredentialSummary, ILoginResult, ITag, ITagIndex } from './all';

export interface IRepository {
    login(hashedUsername: string, hashedPassword: string): Promise<ILoginResult>;

    loadTagIndex(): Promise<ITagIndex>;
    createTag(tag: ITag): Promise<ITag>;
    deleteTags(tags: ITag[]): Promise<void>;

    loadCredential(credentialId: string): Promise<ICredential>;
    loadCredentialSummaryList(): Promise<ICredentialSummary[]>;
    loadCredentials(): Promise<ICredential[]>;

    createCredential(credential: ICredential): Promise<ICredential>;
    updateCredential(credential: ICredential): Promise<ICredential>;
    updatePassword(newPassword: string): Promise<void>;
    import(credentials: ICredential[]): Promise<void>;

    deleteCredential(credentialId: string): Promise<void>;
}

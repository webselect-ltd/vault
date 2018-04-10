import { ICredential, IPasswordSpecification } from './all';

export interface ICryptoProvider {
    base64ToUtf8(str: string): string;
    utf8ToBase64(str: string): string;
    generatePassword(specification: IPasswordSpecification): string;
    generateMasterKey(password: string): string;
    hash(str: string): string;
    getPasswordBits(password: string): number;
    encryptCredential(credential: ICredential, masterKey: string, excludes: string[]): ICredential;
    encryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]): ICredential[];
    decryptCredential(credential: ICredential, masterKey: string, excludes: string[]): ICredential;
    decryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]): ICredential[];
}

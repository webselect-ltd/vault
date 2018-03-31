import { Credential } from '../Concrete';
import { IPasswordSpecification } from './IPasswordSpecification';

export interface ICryptoProvider {
    base64ToUtf8(str: string): string;
    utf8ToBase64(str: string): string;
    generatePassword(specification: IPasswordSpecification): string;
    generateMasterKey(password: string): string;
    hash(str: string): string;
    getPasswordBits(password: string): number;
    encryptCredential(credential: Credential, masterKey: string, excludes: string[]): Credential;
    encryptCredentials(credentials: Credential[], masterKey: string, excludes: string[]): Credential[];
    decryptCredential(credential: Credential, masterKey: string, excludes: string[]): Credential;
    decryptCredentials(credentials: Credential[], masterKey: string, excludes: string[]): Credential[];
}

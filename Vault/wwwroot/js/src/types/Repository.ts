import {
    decryptCredential,
    decryptCredentials,
    encryptCredential,
    encryptCredentials,
    generateMasterKey,
    hash,
    hex
} from '../modules/all';
import { decryptCredentialSummaries, decryptTags, encryptTag } from '../modules/Cryptography';
import { ICredential, ICredentialSummary, ILoginResult, IRepository, ISecurityKeyDetails, ITag, ITagIndex } from '../types/all';

export class Repository implements IRepository {
    private userID: string;
    private password: string;
    private masterKey: ArrayBuffer;
    private cache: ICredentialSummary[];
    private securityKey: ISecurityKeyDetails;
    private securityKeyParameter: any;

    constructor(securityKey: ISecurityKeyDetails) {
        this.userID = null;
        this.password = null;
        this.masterKey = null;
        this.cache = [];

        this.securityKey = securityKey;
        this.securityKeyParameter = {};

        if (securityKey) {
            this.securityKeyParameter[securityKey.parameterName] = securityKey.key;
        }
    }

    public async login(username: string, password: string) {
        const usernameHash = await hash(username);
        const passwordHash = await hash(password);

        const data = {
            Username: hex(usernameHash),
            Password: hex(passwordHash)
        };

        const loginResult = await this.post<ILoginResult>('Home/Login', data);

        if (loginResult.success) {
            this.userID = loginResult.userID;
            this.password = password;
            this.masterKey = await generateMasterKey(this.password);
        }

        return loginResult;
    }

    public async loadTagIndex() {
        interface Temp {
            tags: ITag[];
            index: { [key: string]: string[] };
        }

        const data = await this.get<Temp>('Credentials/ReadTagIndex', { userID: this.userID });

        const map = new Map();

        for (const k in data.index) {
            map.set(k, data.index[k]);
        }

        const index: ITagIndex = {
            tags: await decryptTags(data.tags, this.masterKey),
            index: map
        };

        return new Promise<ITagIndex>(resolve => resolve(index));
    }

    public async createTag(tag: ITag) {
        const encryptedTag = await encryptTag(tag, this.masterKey);
        await this.post<ITag>('Credentials/CreateTag', { ...encryptedTag, userID: this.userID });
        return tag;
    }

    public async deleteTags(tags: ITag[]) {
        return await this.post<void>('Credentials/DeleteTags', tags);
    }

    public async loadCredential(credentialID: string) {
        const encryptedCredential = await this.get<ICredential>('Credentials/Read', { id: credentialID });
        return await decryptCredential(encryptedCredential, this.masterKey);
    }

    public async loadCredentialSummaryList() {
        if (!this.cache.length) {
            const encryptedCredentialSummaries = await this.get<ICredentialSummary[]>('Credentials/ReadSummaries', { userID: this.userID });
            this.cache = await decryptCredentialSummaries(encryptedCredentialSummaries, this.masterKey);
        }
        return this.cache;
    }

    public async loadCredentials() {
        const encryptedCredentials = await this.get<ICredential[]>('Credentials/ReadAll', { userID: this.userID });
        return await decryptCredentials(encryptedCredentials, this.masterKey);
    }

    public async createCredential(credential: ICredential) {
        this.cache.length = 0;
        credential.userID = this.userID;
        const encryptedCredential = await encryptCredential(credential, this.masterKey);
        return this.post<ICredential>('Credentials/Create', encryptedCredential);
    }

    public async updateCredential(credential: ICredential) {
        this.cache.length = 0;
        credential.userID = this.userID;
        const encryptedCredential = await encryptCredential(credential, this.masterKey);
        return this.post<ICredential>('Credentials/Update', encryptedCredential);
    }

    public async updatePassword(newPassword: string) {
        this.cache.length = 0;

        const credentials = await this.loadCredentials();

        const oldPasswordHash = await hash(this.password);
        const newPasswordHash = await hash(newPassword);

        this.password = newPassword;
        this.masterKey = await generateMasterKey(newPassword);

        const reEncryptedCredentials = await encryptCredentials(credentials, this.masterKey);

        const model = {
            UpdatedCredentials: reEncryptedCredentials,
            UserID: this.userID,
            OldPasswordHash: hex(oldPasswordHash),
            NewPasswordHash: hex(newPasswordHash)
        };

        await this.post<void>('Home/UpdatePassword', model);
    }

    public async import(credentials: ICredential[]) {
        credentials.forEach(c => c.userID = this.userID);

        this.cache.length = 0;
        const encryptedCredentials = await encryptCredentials(credentials, this.masterKey);

        const model = {
            Credentials: encryptedCredentials
        };

        return this.post<void>('Credentials/Import', model);
    }

    public async deleteCredential(credentialID: string) {
        this.cache.length = 0;
        const data = {
            userID: this.userID,
            credentialID: credentialID
        };
        return this.post<void>('Credentials/Delete', data);
    }

    private async get<T>(url: string, data: any) {
        const dataWithSecurityKey = Object.assign({}, data, this.securityKeyParameter);

        const queryString = Object.keys(dataWithSecurityKey)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(dataWithSecurityKey[k]))
            .join('&');

        const urlAndQueryString = data
            ? `${url}?${queryString}`
            : url;

        const response = await fetch(urlAndQueryString);
        const json = await response.json() as T;

        return response.ok ? json : Promise.reject(json);
    }

    private async post<T>(url: string, data: any) {
        const urlWithSecurityKey = this.securityKey
            ? `${url}?${this.securityKey.parameterName}=${this.securityKey.key}`
            : url;

        const options: any = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(urlWithSecurityKey, options);
        const json = await response.json() as T;

        return response.ok ? json : Promise.reject(json);
    }
}

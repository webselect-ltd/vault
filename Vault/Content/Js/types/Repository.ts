import {
    decryptCredential,
    decryptCredentials,
    encryptCredential,
    encryptCredentials,
    generateMasterKey,
    hash
} from '../modules/all';
import { ICredential, ILoginResult, IRepository } from '../types/all';

export type XHRSuccessCallback = (data: any, status?: string, request?: JQueryXHR) => void;
export type XHRErrorCallback = (request: JQueryXHR, status: string, error: string) => void;

export class Repository implements IRepository {
    private readonly jsonContentType = 'application/json; charset=utf-8';
    private readonly encryptionExcludes = ['CredentialID', 'UserID'];

    private basePath: string;
    private userID: string;
    private password: string;
    private masterKey: string;
    private cache: ICredential[];

    constructor(basePath: string) {
        this.basePath = basePath;
        this.userID = null;
        this.password = null;
        this.masterKey = null;
        this.cache = [];
    }

    public async login(username: string, password: string) {
        const data = {
            UN1209: hash(username),
            PW9804: hash(password)
        };

        const loginResult = await this.post<ILoginResult>('Main/Login', data);

        if (loginResult.Success) {
            this.userID = loginResult.UserID;
            this.password = password;
            this.masterKey = generateMasterKey(this.password);
        }

        return loginResult;
    }

    public async loadCredential(credentialId: string) {
        const encryptedCredential = await this.post<ICredential>('Main/LoadCredential', { id: credentialId });
        return decryptCredential(encryptedCredential, this.masterKey, this.encryptionExcludes);
    }

    public async loadCredentialSummaryList() {
        if (!this.cache.length) {
            const encryptedCredentials = await this.post<ICredential[]>('Main/GetCredentialSummaryList', { userId: this.userID });
            this.cache = decryptCredentials(encryptedCredentials, this.masterKey, this.encryptionExcludes);
        }
        return this.cache;
    }

    public async loadCredentials() {
        const encryptedCredentials = await this.post<ICredential[]>('Main/GetCredentials', { userId: this.userID });
        return decryptCredentials(encryptedCredentials, this.masterKey, this.encryptionExcludes);
    }

    public async updateCredential(credential: ICredential) {
        this.cache.length = 0;
        credential.UserID = this.userID;
        const encryptedCredential = encryptCredential(credential, this.masterKey, this.encryptionExcludes);
        return this.post<ICredential>('Main/UpdateCredential', encryptedCredential);
    }

    public async updatePassword(newPassword: string) {
        this.cache.length = 0;

        const credentials = await this.loadCredentials();

        const oldPasswordHash = hash(this.password);
        const newPasswordHash = hash(newPassword);

        this.password = newPassword;
        this.masterKey = generateMasterKey(newPassword);

        await this.updateMultiple(credentials);

        const data = {
            userid: this.userID,
            oldHash: oldPasswordHash,
            newHash: newPasswordHash
        };

        await this.post<void>('Main/UpdatePassword', data);
    }

    public async updateMultiple(credentials: ICredential[]) {
        this.cache.length = 0;
        const encryptedCredentials = encryptCredentials(credentials, this.masterKey, this.encryptionExcludes);
        return this.post<void>('Main/UpdateMultipleCredentials', JSON.stringify(encryptedCredentials), this.jsonContentType);
    }

    public async deleteCredential(credentialId: string) {
        this.cache.length = 0;
        const data = {
            userId: this.userID,
            credentialId: credentialId
        };
        return this.post<void>('Main/DeleteCredential', data);
    }

    private post<T>(url: string, data: any, contentType: string = null) {
        return new Promise<T>((resolve, reject) => {
            return this.__xhr(this.basePath + url, data, result => resolve(result), error => reject(error), contentType);
        });
    }

    private __xhr(url: string, data: any, success: XHRSuccessCallback, error: XHRErrorCallback, contentType?: string) {
        const options: any = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: success,
            error: error
        };

        if (contentType) {
            options.contentType = contentType;
        }

        $.ajax(options);
    }
}

import { ICredential, ILoginResult, IRepository } from '../types/all';

export type XHRSuccessCallback = (data: any, status?: string, request?: JQueryXHR) => void;
export type XHRErrorCallback = (request: JQueryXHR, status: string, error: string) => void;

export class Repository implements IRepository {
    private readonly jsonContentType = 'application/json; charset=utf-8';

    private basePath: string;
    private cache: ICredential[];

    constructor(basePath: string) {
        this.basePath = basePath;
        this.cache = [];
    }

    public async login(hashedUsername: string, hashedPassword: string) {
        const data = {
            UN1209: hashedUsername,
            PW9804: hashedPassword
        };
        return this.post<ILoginResult>('Main/Login', data);
    }

    public async loadCredential(credentialId: string) {
        return this.post<ICredential>('Main/LoadCredential', { id: credentialId });
    }

    public async loadCredentialSummaryList(userId: string) {
        if (!this.cache.length) {
            this.cache = await this.post<ICredential[]>('Main/GetCredentialSummaryList', { userId: userId });
        }
        return this.cache;
    }

    public async loadCredentials(userId: string) {
        return this.post<ICredential[]>('Main/GetCredentials', { userId: userId });
    }

    public async updateCredential(credential: ICredential) {
        this.cache.length = 0;
        return this.post<ICredential>('Main/UpdateCredential', credential);
    }

    public async updatePassword(userId: string, oldHash: string, newHash: string) {
        this.cache.length = 0;
        const data = {
            userid: userId,
            oldHash: oldHash,
            newHash: newHash
        };
        return this.post<void>('Main/UpdatePassword', data);
    }

    public async updateMultiple(credentials: ICredential[]) {
        this.cache.length = 0;
        return this.post<void>('Main/UpdateMultipleCredentials', JSON.stringify(credentials), this.jsonContentType);
    }

    public async deleteCredential(userId: string, credentialId: string) {
        this.cache.length = 0;
        const data = {
            userId: userId,
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

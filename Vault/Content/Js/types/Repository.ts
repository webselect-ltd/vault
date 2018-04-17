import { ICredential, ILoginResult, IRepository } from '../types/all';

// TODO: Implement caching

export type XHRSuccessCallback = (data: any, status?: string, request?: JQueryXHR) => void;
export type XHRErrorCallback = (request: JQueryXHR, status: string, error: string) => void;

export class Repository implements IRepository {
    private jsonContentType = 'application/json; charset=utf-8';

    constructor(private basePath: string) {
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
        return this.post<ICredential[]>('Main/GetCredentialSummaryList', { userId: userId });
    }

    public async loadCredentials(userId: string) {
        return this.post<ICredential[]>('Main/GetCredentials', { userId: userId });
    }

    public async updateCredential(credential: ICredential) {
        return this.post<ICredential>('Main/UpdateCredential', credential);
    }

    public async updatePassword(userId: string, oldHash: string, newHash: string) {
        const data = {
            userid: userId,
            oldHash: oldHash,
            newHash: newHash
        };
        return this.post<void>('Main/UpdatePassword', data);
    }

    public async updateMultiple(credentials: ICredential[]) {
        return this.post<void>('Main/UpdateMultipleCredentials', JSON.stringify(credentials), this.jsonContentType);
    }

    public async deleteCredential(userId: string, credentialId: string) {
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

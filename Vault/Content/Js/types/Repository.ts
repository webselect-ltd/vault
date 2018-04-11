import { ICredential, IRepository, XHRError, XHRSuccess } from '../types/all';

// TODO: Implement caching

export class Repository implements IRepository {
    private jsonContentType = 'application/json; charset=utf-8';

    constructor(private basePath: string) {
    }

    public async login(hashedUsername: string, hashedPassword: string) {
        const data = {
            UN1209: hashedUsername,
            PW9804: hashedPassword
        };
        return this.ajaxPostPromise<any>('Main/Login', data);
    }

    public async loadCredential(credentialId: string) {
        return this.ajaxPostPromise<ICredential>('Main/Load', { id: credentialId });
    }

    public async loadCredentialsForUser(userId: string) {
        return this.ajaxPostPromise<ICredential[]>('Main/GetAll', { userId: userId });
    }

    public async loadCredentialsForUserFull(userId: string) {
        return this.ajaxPostPromise<ICredential[]>('Main/GetAllComplete', { userId: userId });
    }

    public async updateCredential(credential: ICredential) {
        return this.ajaxPostPromise<ICredential>('Main/Update', credential);
    }

    public async updatePassword(userId: string, oldHash: string, newHash: string) {
        const data = {
            userid: userId,
            oldHash: oldHash,
            newHash: newHash
        };
        return this.ajaxPostPromise<void>('Main/UpdatePassword', data);
    }

    public async updateMultiple(credentials: ICredential[]) {
        return this.ajaxPostPromiseJson<void>('Main/UpdateMultiple', JSON.stringify(credentials));
    }

    public async deleteCredential(userId: string, credentialId: string) {
        const data = {
            userId: userId,
            credentialId: credentialId
        };
        return this.ajaxPostPromise<void>('Main/Delete', data);
    }

    // TODO: Rename and add error path
    private ajaxPostPromise<T>(url: string, data: any, json: boolean = false) {
        return new Promise<T>(resolve => this.ajaxPost(this.basePath + url, data, result => resolve(result)));
    }

    private ajaxPostPromiseJson<T>(url: string, data: any, json: boolean = false) {
        return new Promise<T>(resolve => this.ajaxPost(this.basePath + url, data, result => resolve(result), null, this.jsonContentType));
    }

    private defaultAjaxErrorCallback(ignore: JQueryXHR, status: string, error: string) {
        return alert('Http Error: ' + status + ' - ' + error);
    }

    private ajaxPost(url: string, data: any, successCallback: XHRSuccess, errorCallback?: XHRError, contentType?: string) {
        // TODO: Reinstate spinners in main.ts
        // ui.spinner.show();

        if (!errorCallback) {
            errorCallback = this.defaultAjaxErrorCallback;
        }

        const options: any = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: (responseData: any, status: string, request: JQueryXHR) => {
                // ui.spinner.hide();
                successCallback(responseData, status, request);
            },
            error: (request: JQueryXHR, status: string, error: string) => {
                // ui.spinner.hide();
                errorCallback(request, status, error);
            }
        };

        if (contentType) {
            options.contentType = contentType;
        }

        $.ajax(options);
    }
}

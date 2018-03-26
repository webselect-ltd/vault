class Repository implements IRepository {
    private jsonContentType = 'application/json; charset=utf-8';

    constructor(private basePath: string) {
    }

    public async login(hashedUsername: string, hashedPassword: string): Promise<any> {
        const data = {
            UN1209: hashedUsername,
            PW9804: hashedPassword
        };
        return this.ajaxPostPromise<any>('Main/Login', data);
    }

    public async loadCredential(credentialId: string): Promise<Credential> {
        return this.ajaxPostPromise<Credential>('Main/Load', { id: credentialId });
    }

    public async loadCredentialsForUser(userId: string): Promise<Credential[]> {
        return this.ajaxPostPromise<Credential[]>('Main/GetAll', { userId: userId });
    }

    public async loadCredentialsForUserFull(userId: string): Promise<Credential[]> {
        return this.ajaxPostPromise<Credential[]>('Main/GetAllComplete', { userId: userId });
    }

    public async updateCredential(credential: Credential): Promise<Credential> {
        return this.ajaxPostPromise<Credential>('Main/Update', credential);
    }

    public async updatePassword(userId: string, oldHash: string, newHash: string): Promise<void> {
        const data = {
            userid: userId,
            oldHash: oldHash,
            newHash: newHash
        };
        return this.ajaxPostPromise<void>('Main/UpdatePassword', data);
    }

    public async updateMultiple(credentials: Credential[]): Promise<void> {
        return this.ajaxPostPromiseJson<void>('Main/UpdateMultiple', JSON.stringify(credentials));
    }

    public async deleteCredential(userId: string, credentialId: string): Promise<void> {
        const data = {
            userId: userId,
            credentialId: credentialId
        };
        return this.ajaxPostPromise<void>('Main/Delete', data);
    }

    private ajaxPostPromise<T>(url: string, data: any, json: boolean = false): Promise<T> {
        return new Promise<T>(resolve => this.ajaxPost(this.basePath + url, data, result => resolve(result)));
    }

    private ajaxPostPromiseJson<T>(url: string, data: any, json: boolean = false): Promise<T> {
        return new Promise<T>(resolve => this.ajaxPost(this.basePath + url, data, result => resolve(result), null, this.jsonContentType));
    }

    private defaultAjaxErrorCallback(ignore: JQueryXHR, status: string, error: string): void {
        return alert('Http Error: ' + status + ' - ' + error);
    }

    private ajaxPost(url: string, data: any, successCallback: XHRSuccess, errorCallback?: XHRError, contentType?: string): void {
        // ui.spinner.show();

        if (!errorCallback) {
            errorCallback = this.defaultAjaxErrorCallback;
        }

        const options: any = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: (responseData: any, status: string, request: JQueryXHR): void => {
                // ui.spinner.hide();
                successCallback(responseData, status, request);
            },
            error: (request: JQueryXHR, status: string, error: string): void => {
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

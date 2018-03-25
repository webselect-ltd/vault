class Repository implements IRepository {
    constructor(private basePath: string) {
    }

    public login(hashedUsername: string, hashedPassword: string, onLoad: (data: any) => void): void {
        this.ajaxPost(this.basePath + 'Main/Login', {
            UN1209: hashedUsername,
            PW9804: hashedPassword
        }, onLoad);
    }

    public loadCredential(credentialId: string, onLoad: (data: Credential) => void): void {
        this.ajaxPost(this.basePath + 'Main/Load', { id: credentialId }, onLoad);
    }

    public loadCredentialsForUser(userId: string, onLoad: (data: Credential[]) => void): void {
        this.ajaxPost(this.basePath + 'Main/GetAll', { userId: userId }, onLoad);
    }

    public loadCredentialsForUserFull(userId: string, onLoad: (data: Credential[]) => void): void {
        this.ajaxPost(this.basePath + 'Main/GetAllComplete', { userId: userId }, onLoad);
    }

    public updateCredential(credential: Credential, onUpdated: (data: Credential) => void): void {
        this.ajaxPost(this.basePath + 'Main/Update', credential, onUpdated);
    }

    public updatePassword(userId: string, oldHash: string, newHash: string, onUpdated: () => void): void {
        this.ajaxPost(this.basePath + 'Main/UpdatePassword', {
            userid: userId,
            oldHash: oldHash,
            newHash: newHash
        }, onUpdated);
    }

    public updateMultiple(credentials: Credential[], onUpdated: () => void): void {
        this.ajaxPost(this.basePath + 'Main/UpdateMultiple', JSON.stringify(credentials), onUpdated, null, 'application/json; charset=utf-8');
    }

    public deleteCredential(userId: string, credentialId: string, onDeleted: () => void) {
        this.ajaxPost(this.basePath + 'Main/Delete', {
            userId: userId,
            credentialId: credentialId
        }, onDeleted);
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

var Repository = (function () {
    function Repository(basePath) {
        this.basePath = basePath;
    }
    Repository.prototype.login = function (hashedUsername, hashedPassword, onLoad) {
        this.ajaxPost(this.basePath + 'Main/Login', {
            UN1209: hashedUsername,
            PW9804: hashedPassword
        }, onLoad);
    };
    Repository.prototype.loadCredential = function (credentialId, onLoad) {
        this.ajaxPost(this.basePath + 'Main/Load', { id: credentialId }, onLoad);
    };
    Repository.prototype.loadCredentialsForUser = function (userId, onLoad) {
        this.ajaxPost(this.basePath + 'Main/GetAll', { userId: userId }, onLoad);
    };
    Repository.prototype.loadCredentialsForUserFull = function (userId, onLoad) {
        this.ajaxPost(this.basePath + 'Main/GetAllComplete', { userId: userId }, onLoad);
    };
    Repository.prototype.update = function (credential, onUpdated) {
        this.ajaxPost(this.basePath + 'Main/Update', credential, onUpdated);
    };
    Repository.prototype.updatePassword = function (userId, oldHash, newHash, onUpdated) {
        this.ajaxPost(this.basePath + 'Main/UpdatePassword', {
            userid: userId,
            oldHash: oldHash,
            newHash: newHash
        }, onUpdated);
    };
    Repository.prototype.updateMultiple = function (credentials, onUpdated) {
        this.ajaxPost(this.basePath + 'Main/UpdateMultiple', JSON.stringify(credentials), onUpdated, null, 'application/json; charset=utf-8');
    };
    Repository.prototype["delete"] = function (userId, credentialId, onDeleted) {
        this.ajaxPost(this.basePath + 'Main/Delete', {
            userId: userId,
            credentialId: credentialId
        }, onDeleted);
    };
    Repository.prototype.defaultAjaxErrorCallback = function (ignore, status, error) {
        return alert('Http Error: ' + status + ' - ' + error);
    };
    Repository.prototype.ajaxPost = function (url, data, successCallback, errorCallback, contentType) {
        // ui.spinner.show();
        if (!errorCallback) {
            errorCallback = this.defaultAjaxErrorCallback;
        }
        var options = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: function (responseData, status, request) {
                // ui.spinner.hide();
                successCallback(responseData, status, request);
            },
            error: function (request, status, error) {
                // ui.spinner.hide();
                errorCallback(request, status, error);
            }
        };
        if (contentType) {
            options.contentType = contentType;
        }
        $.ajax(options);
    };
    return Repository;
}());
//# sourceMappingURL=Repository.js.map
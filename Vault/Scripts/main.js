window.$_VAULT = {
    USER_ID: '',
    USERNAME: '',
    PASSWORD: '',
    MASTER_KEY: ''
};

function loadCredentials(userId, masterKey, callback) {

    $.ajax({
        url: '/Main/GetAll',
        data: { userId: userId },
        dataType: 'json',
        type: 'POST',
        success: function (data, status, request) {

            var rows = [];

            // Show the matching credential information
            $.each(data, function (i, item) {

                for (var p in item)
                    if (p == 'Description' || p == 'Url')
                        item[p] = Passpack.decode('AES', item[p], masterKey);

                rows.push(createCredentialRow(item));

            });

            callback(rows);

        },
        error: function (request, status, error) {

            alert('Http Error: ' + status + ' - ' + error);

        }
    });

}

function showDetail(credentialId, masterKey) {

    $.ajax({
        url: '/Main/Load',
        data: { id: credentialId },
        dataType: 'json',
        type: 'POST',
        success: function (data, status, request) {

            for (var p in data)
                data[p] = Passpack.decode('AES', data[p], masterKey);

            var details = [];

            details.push('<table>');

            if(data.Username != '')
                details.push('<tr><th>Username</th><td>' + data.Username + '</td></tr>');

            if (data.Password != '')
                details.push('<tr><th>Password</th><td>' + data.Password + '</td></tr>');

            if (data.UserDefined1 != '')
                details.push('<tr><th>' + data.UserDefined1Label + '</th><td>' + data.UserDefined1 + '</td></tr>');

            if (data.UserDefined2 != '')
                details.push('<tr><th>' + data.UserDefined2Label + '</th><td>' + data.UserDefined2 + '</td></tr>');

            if (data.Notes != '')
                details.push('<tr><th>Notes</th><td class="notes">' + data.Notes + '</td></tr>');

            details.push('</table>');

            $('#modal-dialog').html(details.join('')).dialog({ title: data.Description, width: 500, minHeight: 50, modal: true });

        },
        error: function (request, status, error) {

            alert('Http Error: ' + status + ' - ' + error);

        }
    });

}

function loadCredential(credentialId, masterKey) {

    if (credentialId != null) {

        $.ajax({
            url: '/Main/Load',
            data: { id: credentialId },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                // CredentialID and UserID are not encrypted so don't try to decode them
                for (var p in data)
                    if (p != 'CredentialID' && p != 'UserID')
                        data[p] = Passpack.decode('AES', data[p], masterKey);

                var details = [];

                details.push('<table>');

                var f = $('#credential-form');

                $('#CredentialID', f).val(data.CredentialID);
                $('#Description', f).val(data.Description);
                $('#Username', f).val(data.Username);
                $('#Password', f).val(data.Password);
                $('#Url', f).val(data.Url);
                $('#UserDefined1Label', f).val(data.UserDefined1Label);
                $('#UserDefined1', f).val(data.UserDefined1);
                $('#UserDefined2Label', f).val(data.UserDefined2Label);
                $('#UserDefined2', f).val(data.UserDefined2);
                $('#Notes', f).val(data.Notes);
                $('#UserID', f).val(data.UserID);

                $('#credential-form-dialog').dialog({ title: 'Edit Credential', width: 500, modal: true });

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

            }
        });

    }
    else {

        $('#credential-form-dialog input:not(.submit), #credential-form-dialog textarea').val('');
        $('#credential-form #UserID').val($_VAULT.USER_ID);

        $('#credential-form-dialog').dialog({ title: 'Edit Credential', width: 500, modal: true });

    }

}

function dodeleteCredential(id) {

    alert(id);
    $('#modal-dialog').dialog('destroy');

}

function deleteCredential(id) {

    var dialogHtml = '<p>Are you sure you want to delete this credential?</p>' +
                     '<form>' +
                     '<p><button onclick="$(\'#modal-dialog\').dialog(\'destroy\'); return false;">No</button> <button onclick="dodeleteCredential(\'' + id + '\'); return false;">Yes</button></p>' +
                     '</form>';

    $('#modal-dialog').html(dialogHtml).dialog({
        title: 'Delete Credential',
        width: 500, 
        modal: true,
        minHeight: 50
    });

}

function createCredentialTable(rows) {

    return '<table id="records" class="display">' +
	       '    <thead>' +
	       '	    <tr>' +
	       '		    <th>Description</th>' +
	       '		    <th>Details</th>' +
	       '		    <th>Edit</th>' +
           '            <th>Delete</th>' +
	       '	    </tr>' +
	       '    </thead>' +
	       '    <tbody>' +
                   rows.join('') + 
	       '    </tbody>' +
           '</table>';

}

function createCredentialRow(credential) {

    var row = [];

    row.push('<tr id=\"' + credential.CredentialID + '\">');
    row.push('<td>');
    row.push();

    // Only show the URL link if there's a URL
    if (credential.Url != '')
        row.push(' <a href="' + credential.Url + '" onclick="window.open(this.href); return false;">' + credential.Description + '</a>');
    else
        row.push(credential.Description);

    row.push('</td>');
    row.push('<td class="center"><a href="#" onclick="showDetail(\'' + credential.CredentialID + '\', \'' + $_VAULT.MASTER_KEY + '\'); return false;" title="View Details"><img src="/content/img/key.png" width="16" height="16" alt="View Details" /></a></td>');
    row.push('<td class="center"><a href="#" onclick="loadCredential(\'' + credential.CredentialID + '\', \'' + $_VAULT.MASTER_KEY + '\'); return false;" title="Edit Details"><img src="/content/img/edit.png" width="16" height="16" alt="Edit Details" /></a></td>');
    row.push('<td class="center"><a href="#" onclick="deleteCredential(\'' + credential.CredentialID + '\'); return false;" title="Delete"><img src="/content/img/delete.png" width="16" height="16" alt="Delete" /></a></td>');
    row.push('</tr>');

    return row.join('');

}

$(function () {

    $('body').append('<div id="modal-dialog"></div>');

    $('#login-form').bind('submit', function () {

        var _username = $('#login-form #Username').val();
        var _password = $('#login-form #Password').val();

        $('#login-form-dialog .submit').after('<img id="spinner" src="/content/img/ajax-loader.gif" width="16" height="16" />');

        $.ajax({
            url: '/Main/Login',
            data: {
                Username: Passpack.utils.hashx(_username),
                Password: Passpack.utils.hashx(_password)
            },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                if (data.result == 1 && data.id != '') {

                    // Set some global variables so that we can use them to encrypt in this session
                    $_VAULT.USER_ID = data.id;
                    $_VAULT.USERNAME = _username;
                    $_VAULT.PASSWORD = _password;
                    $_VAULT.MASTER_KEY = Passpack.utils.hashx($_VAULT.PASSWORD + Passpack.utils.hashx($_VAULT.PASSWORD, 1, 1), 1, 1);

                    loadCredentials($_VAULT.USER_ID, $_VAULT.MASTER_KEY, function (rows) {

                        $('#container').append(createCredentialTable(rows));

                        $('#records').dataTable({
                            'bJQueryUI': true,
                            'sPaginationType': 'full_numbers',
                            'bAutoWidth': false,
                            'bLengthChange': false,
                            'iDisplayLength': 20,
                            'sScrollY': 442,
                            'aaSorting': [[0, 'asc']],
                            'aoColumns': [
			                    { 'sType': 'html' },
			                    { 'sTitle': '', 'sWidth': 20, 'bSortable': false },
			                    { 'sTitle': '', 'sWidth': 20, 'bSortable': false },
			                    { 'sTitle': '', 'sWidth': 20, 'bSortable': false }
		                    ]
                        });

                        // Successfully logged in. Hide the login form
                        $('#container').append('<p><a href="#" onclick="loadCredential(null, \'' + $_VAULT.MASTER_KEY + '\'); return false;">Add Item</a></p>');
                        $('#login-form').hide();
                        $('#login-form-dialog').dialog('destroy');
                        $('#records_filter input:first').focus();

                    });

                }

                $('#spinner').remove();

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

                $('#spinner').remove();

            }
        });

        return false;

    });

    $('#credential-form').bind('submit', function () {

        var credential = {};

        $('input[class!=submit], textarea', $(this)).each(function () {
            credential[this.name] = $(this).val();
        });

        // Encode everything except Credential and User ID
        for (var p in credential)
            if (p != 'CredentialID' && p != 'UserID')
                credential[p] = Passpack.encode('AES', credential[p], $_VAULT.MASTER_KEY);

        $.ajax({
            url: '/Main/Update',
            data: credential,
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

            }
        });

        //Passpack.encode("AES", $(this).val(), masterKey)

        return false;

    });

    $('#login-form-dialog').dialog({ title: 'Log In', width: 500, modal: true });

});
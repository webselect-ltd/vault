<%@ Page Title="" Language="C#" MasterPageFile="~/Views/Shared/Main.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ID="TitleContent" ContentPlaceHolderID="TitleContent" runat="server">
	
    Index

</asp:Content>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">

    <script type="text/javascript">

        window.$_VAULT = {
            USER_ID: '',
            USERNAME: '',
            PASSWORD: '',
            MASTER_KEY: ''
        };

        function loadCredentials(userId, masterKey) {

            $.ajax({
                url: '/Main/GetAll',
                data: { id: userId },
                dataType: 'json',
                type: 'POST',
                success: function (data, status, request) {

                    var output = [];

                    // Show the matching credential information
                    $.each(data, function (i, item) {

                        for (var p in item)
                            item[p] = Passpack.decode('AES', item[p], masterKey);

                        output.push(createCredentialView(item));

                    });

                    $('#query-form').after('<div id="list"></div>').append('<table id="records">' + output.join('') + '</table>');

                },
                error: function (request, status, error) {

                    alert('Http Error: ' + status + ' - ' + error);

                }
            });

        }

        function createCredentialView(credential) {

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
            row.push('<td>');

            // Only show a link for the credentials that this record has - so for example,
            // don't show a password link if the password is blank
            var credentialArray = new Array();

            if (credential.Username != '')
                credentialArray.push('<a href="#" onclick="alert(\'' + credential.Username + '\'); return false;">' + credential.Username + '</a>');

            if (credential.Password != '')
                credentialArray.push('<a href="#" onclick="alert(\'' + credential.Password + '\'); return false;">' + credential.Password + '</a>');

            if (credential.UserDefined1 != '')
                credentialArray.push('<a href="#" onclick="alert(\'' + credential.UserDefined1 + '\'); return false;">' + credential.UserDefined1 + '</a>');

            if (credential.UserDefined2 != '')
                credentialArray.push('<a href="#" onclick="alert(\'' + credential.UserDefined2 + '\'); return false;">' + credential.UserDefined2 + '</a>');

            row.push(credentialArray.join(' | '));
        
            row.push('</td>');
            row.push('<td><a href="#" onclick="loadCredential(\'' + credential.CredentialID + '\'); return false;">Edit</a> | <a href="#" onclick="deleteCredential(\'' + credential.CredentialID + '\'); return false;">Delete</a></td>');
            row.push('</tr>');

            return row.join('');

        }

        $(function () {

            $('#login-form').bind('submit', function () {

                var _username = $('#login-form #Username').val();
                var _password = $('#login-form #Password').val();

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

                            // Successfully logged in. Hide the login form
                            $('#login-form').hide();

                            // Set some global variables so that we can use them to encrypt in this session
                            $_VAULT.USER_ID = data.id;
                            $_VAULT.USERNAME = _username;
                            $_VAULT.PASSWORD = _password;
                            $_VAULT.MASTER_KEY = Passpack.utils.hashx($_VAULT.PASSWORD + Passpack.utils.hashx($_VAULT.PASSWORD, 1, 1), 1, 1);

                            loadCredentials($_VAULT.USER_ID, $_VAULT.MASTER_KEY);

                            $('#query-form').show();
                        }

                    },
                    error: function (request, status, error) {

                        alert('Http Error: ' + status + ' - ' + error);

                    }
                });

                return false;

            });

            $('#query-form').bind('submit', function () {

                $.ajax({
                    url: '/Main/Login',
                    data: $('#query-form').serialize(),
                    dataType: 'json',
                    type: 'POST',
                    success: function (data, status, request) {

                        // Show the matching credential information
                        $.each(data, function (i, item) {

                            console.log(item);

                        });

                    },
                    error: function (request, status, error) {

                        alert('Http Error: ' + status + ' - ' + error);

                    }
                });

                return false;

            });

            $('#credential-form').bind('submit', function () {

                $.ajax({
                    url: '/Main/Update',
                    data: $('#credential-form').serialize(),
                    dataType: 'json',
                    type: 'POST',
                    success: function (data, status, request) {

                        alert(data);

                    },
                    error: function (request, status, error) {

                        alert('Http Error: ' + status + ' - ' + error);

                    }
                });

                return false;

            });

        });

    </script>

</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">

    <% using(Html.BeginForm("Query", "Main", FormMethod.Post, new { id = "query-form" })) { %>

    <p><%= Html.TextBox("query") %> <input type="submit" value="Find" /></p>

    <% } %>

    <% Html.RenderPartial("Credential"); %>
    
    <script type="text/javascript">$('#query-form, #credential-form').hide();</script>

    <% Html.RenderPartial("Login"); %>

</asp:Content>

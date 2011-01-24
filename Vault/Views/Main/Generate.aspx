<%@ Page Title="" Language="C#" MasterPageFile="~/Views/Shared/Main.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ID="TitleContent" ContentPlaceHolderID="TitleContent" runat="server">
	Generate
</asp:Content>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    
    <script type="text/javascript">

        function generatePassword() {
            $('#Hashed').attr('value', Passpack.utils.hashx($('#Password').val()));
        }

        // The hash is now a full 64 char string
        function generatePassword64() {
            $('#Hashed').attr('value', Passpack.utils.hashx($('#Password').val(), false, true));
        }

    </script>

</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">

    <h2>Generate</h2>

    <form id="generate-form" action="" method="post">
        <p><label for="Password">Password</label> 
        <input type="text" size="40" id="Password" name="Password" value="" /></p>
        <p><label for="Hashed">Hashed</label> 
        <input type="text" size="40" id="Hashed" name="Hashed" value="" /></p>
        <p><input type="button" onclick="generatePassword();" value="Generate" /></p>
	</form>

</asp:Content>

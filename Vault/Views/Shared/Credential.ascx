<%@ Control Language="C#" Inherits="System.Web.Mvc.ViewUserControl<Vault.Models.CredentialViewModel>" %>

<div id="credential-form-dialog">

<% using(Html.BeginForm("Update", "Main", FormMethod.Post, new { id = "credential-form" })) { %>

<p><%= Html.LabelFor(x => x.Description) %> 
<%= Html.TextBoxFor(x => x.Description)%></p>

<p><input type="submit" value="Save" /></p>

<% } %>

</div>
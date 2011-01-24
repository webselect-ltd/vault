<%@ Control Language="C#" Inherits="System.Web.Mvc.ViewUserControl<Vault.Models.LoginViewModel>" %>

<% using(Html.BeginForm("Login", "Main", FormMethod.Post, new { id = "login-form" })) { %>

<p><%= Html.LabelFor(model => model.Username)%> 
<%= Html.TextBoxFor(model => model.Username)%></p>

<p><%= Html.LabelFor(model => model.Password)%> 
<%= Html.TextBoxFor(model => model.Password)%></p>

<p><input type="submit" value="Log In" /></p>

<% } %>
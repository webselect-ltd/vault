<%@ Page Title="" Language="C#" MasterPageFile="~/Views/Shared/Main.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ID="TitleContent" ContentPlaceHolderID="TitleContent" runat="server">
	
    Index

</asp:Content>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">

    <script type="text/javascript" src="<%= ResolveUrl("~/") %>scripts/jquery.dataTables.min.js"></script>
    <script type="text/javascript" src="<%= ResolveUrl("~/") %>scripts/main.js"></script>

</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">

    <% Html.RenderPartial("Credential"); %>
    
    <script type="text/javascript">$('#credential-form-dialog').hide();</script>

    <% Html.RenderPartial("Login"); %>

</asp:Content>

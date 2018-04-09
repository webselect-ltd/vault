using System.Web.Optimization;

namespace Vault
{
    public static class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/js/external").Include(
                "~/Content/Js/dist/external/jquery.js",
                "~/Content/Js/dist/external/handlebars.js",
                "~/Content/Js/dist/external/js.cookie.js",
                "~/Content/Js/dist/external/modal.js"));

            bundles.Add(new ScriptBundle("~/js/main").Include(
                "~/Content/Js/dist/main.js"));

            bundles.Add(new StyleBundle("~/css").Include(
                "~/Content/Css/external/bootstrap.css",
                "~/Content/Css/main.css"));
        }
    }
}

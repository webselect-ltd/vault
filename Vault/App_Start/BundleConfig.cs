using System.Web;
using System.Web.Optimization;

namespace Vault
{
    public static class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Content/Js/main").Include(
                      "~/Content/Js/vendor/bootstrap.js",
                      "~/Content/Js/vendor/passpack-v1.1.js",
                      "~/Content/Js/vendor/handlebars-v4.0.5.js",
                      "~/Content/Js/vendor/hide-address-bar.js",
                      "~/Content/Js/vendor/js.cookie.js",
                      "~/Content/Js/concrete/Credential.js",
                      "~/Content/Js/concrete/CredentialSummary.js",
                      "~/Content/Js/concrete/Repository.js",
                      "~/Content/Js/main.js"));

            bundles.Add(new ScriptBundle("~/Content/Js/tests").Include(
                      "~/Content/Js/test/qunit-2.5.1.js",
                      "~/Content/Js/test/blanket.js",
                      "~/Content/Js/test/tests.js"));

            bundles.Add(new StyleBundle("~/Content/Css/main").Include(
                      "~/Content/Css/vendor/bootstrap.css",
                      "~/Content/Css/main.css"));

            bundles.Add(new StyleBundle("~/Content/Css/tests").Include(
                      "~/Content/Css/test/qunit-2.5.1.css"));
        }
    }
}

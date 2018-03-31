using System.Web;
using System.Web.Optimization;

namespace Vault
{
    public static class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/Content/Css/main").Include(
                      "~/Content/Css/vendor/bootstrap.css",
                      "~/Content/Css/main.css"));
        }
    }
}

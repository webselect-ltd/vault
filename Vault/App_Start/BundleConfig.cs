using System.Web.Optimization;

namespace Vault
{
    public static class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/Content/Css/main").Include(
                      "~/Content/Css/vendor/bootstrap.css",
                      "~/Content/Css/main.css"));
        }
    }
}

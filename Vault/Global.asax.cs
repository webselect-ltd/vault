using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Microsoft.Practices.Unity;
using Vault.Models;
using Vault.Support;

namespace Vault
{
    public class MvcApplication : HttpApplication
    {
        private bool profiling = Convert.ToBoolean(ConfigurationManager.AppSettings["Profiling"]);

        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            // Set up object mappings for Unity DI
            var container = new UnityContainer();

            // Inject the correct connection factory depending on the DB type
            if(ConfigurationManager.AppSettings["DbType"] == "SQLite")
                container.RegisterType<IConnectionFactory>(new HttpContextLifetimeManager<SQLiteConnectionFactory>(), new InjectionFactory(c => new SQLiteConnectionFactory(ConfigurationManager.ConnectionStrings["Vault"].ConnectionString)));
            else
                container.RegisterType<IConnectionFactory>(new HttpContextLifetimeManager<SqlConnectionFactory>(), new InjectionFactory(c => new SqlConnectionFactory(ConfigurationManager.ConnectionStrings["Vault"].ConnectionString)));

            var resolver = new UnityDependencyResolver(container);

            DependencyResolver.SetResolver(resolver);
        }

        protected void Application_BeginRequest()
        {
        }

        protected void Application_EndRequest()
        {
        }
    }
}

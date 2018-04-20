using System;
using System.Configuration;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace Vault.Support
{
    public class ProtectWithSecurityKeyAttribute : FilterAttribute, IActionFilter
    {
        public static readonly string PARAMETER_NAME = "sk";

        public void OnActionExecuted(ActionExecutedContext filterContext) { }

        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var httpContext = filterContext?.HttpContext;

            if (httpContext != null)
            {
                var key = httpContext.Request?.QueryString[PARAMETER_NAME]
                       ?? httpContext.Request?.Form[PARAMETER_NAME]
                       ?? null;

                if (key == null || key != ConfigurationManager.AppSettings["SecurityKey"])
                    throw new HttpException((int)HttpStatusCode.NotFound, "Page Not Found");
            }
        }
    }
}

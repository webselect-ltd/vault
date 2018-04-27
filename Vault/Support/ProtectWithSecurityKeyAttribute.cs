using System.Configuration;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace Vault.Support
{
    public class ProtectWithSecurityKeyAttribute : FilterAttribute, IActionFilter
    {
        public static readonly string PARAMETER_NAME = ConfigurationManager.AppSettings["SecurityKeyParameterName"];
        public static readonly string KEY = ConfigurationManager.AppSettings["SecurityKey"];

        public void OnActionExecuted(ActionExecutedContext filterContext) { }

        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if (!string.IsNullOrWhiteSpace(KEY))
            {
                var httpContext = filterContext?.HttpContext;

                if (httpContext != null)
                {
                    var key = httpContext.Request?.QueryString[PARAMETER_NAME]
                           ?? httpContext.Request?.Form[PARAMETER_NAME]
                           ?? null;

                    if (key == null || key != KEY)
                        throw new HttpException((int)HttpStatusCode.NotFound, "Page Not Found");
                }
            }
        }
    }
}

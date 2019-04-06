using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

namespace Vault.Support
{
    public class ProtectWithSecurityKeyFilter : IActionFilter
    {
        private readonly IConfiguration _configuration;

        public ProtectWithSecurityKeyFilter(IConfiguration configuration) =>
            _configuration = configuration;

        public void OnActionExecuted(ActionExecutedContext filterContext)
        {
        }

        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var securityKey = _configuration["SecurityKey"];
            var parameterName = _configuration["SecurityKeyParameterName"];

            if (!string.IsNullOrWhiteSpace(securityKey))
            {
                var httpContext = filterContext?.HttpContext;

                if (httpContext?.Request != null)
                {
                    var key = httpContext.Request.Query[parameterName];

                    if (key.SingleOrDefault() != securityKey)
                    {
                        filterContext.Result = new StatusCodeResult(404);
                    }
                }
            }
        }
    }
}

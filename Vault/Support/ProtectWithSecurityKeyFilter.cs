using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Vault.Support
{
    public class ProtectWithSecurityKeyFilter : IActionFilter
    {
        private readonly Settings _cfg;

        public ProtectWithSecurityKeyFilter(IOptionsMonitor<Settings> optionsMonitor) =>
            _cfg = optionsMonitor.CurrentValue;

        public void OnActionExecuted(ActionExecutedContext filterContext)
        {
        }

        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var securityKey = _cfg.SecurityKey;
            var parameterName = _cfg.SecurityKeyParameterName;

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

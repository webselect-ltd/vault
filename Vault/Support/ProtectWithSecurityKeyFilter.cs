using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Vault.Support
{
    public class ProtectWithSecurityKeyFilter : IActionFilter
    {
        private readonly Settings _cfg;

        public ProtectWithSecurityKeyFilter(IOptionsMonitor<Settings> optionsMonitor)
        {
            Guard.AgainstNull(optionsMonitor, nameof(optionsMonitor));

            _cfg = optionsMonitor.CurrentValue;
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            var securityKey = _cfg.SecurityKey;
            var parameterName = _cfg.SecurityKeyParameterName;

            if (!string.IsNullOrWhiteSpace(securityKey))
            {
                var httpContext = context?.HttpContext;

                if (httpContext?.Request != null)
                {
                    var key = httpContext.Request.Query[parameterName];

                    if (key.SingleOrDefault() != securityKey)
                    {
                        context.Result = new StatusCodeResult(404);
                    }
                }
            }
        }
    }
}

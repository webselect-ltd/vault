using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Vault.Support
{
    public class ProtectWithSecurityKeyFilter : IActionFilter
    {
        private readonly Settings _cfg;

        public ProtectWithSecurityKeyFilter(IOptions<Settings> options)
        {
            ArgumentNullException.ThrowIfNull(options);

            _cfg = options.Value;
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

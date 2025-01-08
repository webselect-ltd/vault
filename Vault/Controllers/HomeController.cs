using System;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Vault.Models;
using Vault.Support;
using static Vault.Support.CloudflareAccessSecurity;

namespace Vault.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly Settings _cfg;
        private readonly SqlExecutor _db;

        public HomeController(
            ILogger<HomeController> logger,
            IOptions<Settings> options,
            IConnectionFactory cf)
        {
            ArgumentNullException.ThrowIfNull(options);

            _logger = logger;
            _cfg = options.Value;
            _db = new SqlExecutor(cf);
        }

        public async Task<IActionResult> Index()
        {
            var req = HttpContext.Request;
            var securityKey = default(object);
            var cloudflareAccessUser = default(string);
            var cloudflareAccessToken = default(string);

            if (req.Headers.TryGetValue("Cf-Access-Jwt-Assertion", out var value))
            {
                var jwt = value.ToString();

                _logger.LogDebug("CF JWT: Token {jwt}", jwt);

                var signingKeys = await RetrieveSigningKeys(_logger, _cfg.CloudflareAccessTeamDomain);

                if (TryValidateToken(
                    logger: _logger,
                    token: jwt,
                    issuer: $"https://{_cfg.CloudflareAccessTeamDomain}",
                    audience: _cfg.CloudflareAccessAUDTag,
                    signingKeys: signingKeys,
                    jwt: out var validToken))
                {
                    cloudflareAccessUser = validToken.Payload["email"].ToString();
                    cloudflareAccessToken = validToken.Payload["sub"].ToString();

                    _logger.LogDebug("CF JWT: Token successfully validated ({Email})", cloudflareAccessUser);
                }
            }

            if (!string.IsNullOrWhiteSpace(_cfg.SecurityKey))
            {
                securityKey = new {
                    ParameterName = _cfg.SecurityKeyParameterName,
                    Key = req.Query[_cfg.SecurityKeyParameterName].ToString()
                };
            }

            var model = new IndexViewModel {
                BaseUrl = new Uri(Url.Action(nameof(Index)), UriKind.Relative),
                AbsoluteUrl = new Uri($"{req.Scheme}://{req.Host}{req.Path}{req.QueryString}"),
                EnableSessionTimeout = _cfg.EnableSessionTimeout,
                SessionTimeoutInSeconds = _cfg.SessionTimeoutInSeconds,
                SecurityKey = securityKey,
                CloudflareAccessUser = cloudflareAccessUser,
                CloudflareAccessToken = cloudflareAccessToken,
            };

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            ArgumentNullException.ThrowIfNull(model);

            var loginResult = await _db.Result(conn => conn.QuerySingleOrDefaultAsync<LoginResult>(SqlStatements.Login, model));

            return Json(loginResult ?? LoginResult.Failed);
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordViewModel model) =>
            await _db.ResultAsJson(async (conn, tran) => {
                foreach (var credential in model.UpdatedCredentials)
                {
                    await conn.ExecuteAsync(SqlStatements.Update, credential, tran);
                }

                foreach (var tag in model.UpdatedTags)
                {
                    await conn.ExecuteAsync(SqlStatements.UpdateTagLabel, tag, tran);
                }

                var passwordUpdateData = new {
                    model.UserID,
                    model.OldPasswordHash,
                    model.NewPasswordHash
                };

                return await conn.ExecuteAsync(SqlStatements.UpdatePassword, passwordUpdateData, tran);
            });

        public IActionResult GenerateVaultCredential()
        {
            var model = new GenerateVaultCredentialViewModel();

            return View(model);
        }
    }
}

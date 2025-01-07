﻿using System;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Vault.Models;
using Vault.Support;

namespace Vault.Controllers
{
    public class HomeController : Controller
    {
        private readonly Settings _cfg;
        private readonly SqlExecutor _db;

        public HomeController(
            IOptions<Settings> options,
            IConnectionFactory cf)
        {
            ArgumentNullException.ThrowIfNull(options);

            _cfg = options.Value;
            _db = new SqlExecutor(cf);
        }

        public IActionResult Index()
        {
            var req = HttpContext.Request;
            var securityKey = default(object);

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
                SecurityKey = securityKey
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

using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Vault.Models;
using Vault.Support;

namespace Vault.Controllers
{
    public class HomeController : Controller
    {
        private readonly SqlExecutor _db;

        public HomeController(IConnectionFactory cf) =>
            _db = new SqlExecutor(cf);

        public IActionResult Index() =>
            View();

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            var credentials = new {
                Username = model.UN1209,
                Password = model.PW9804
            };

            var loginResult = await _db.Result(conn => conn.QuerySingleOrDefaultAsync<LoginResult>(SqlStatements.Login, credentials));

            return Json(loginResult ?? LoginResult.Failed);
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordViewModel model) =>
            await _db.ResultAsJson(async (conn, tran) => {
                foreach (var credential in model.UpdatedCredentials)
                {
                    await conn.ExecuteAsync(SqlStatements.Update, credential, tran);
                }

                var passwordUpdateData = new {
                    model.UserID,
                    model.OldPasswordHash,
                    model.NewPasswordHash
                };

                return await conn.ExecuteAsync(SqlStatements.UpdatePassword, passwordUpdateData, tran);
            });

        public IActionResult GenerateVaultCredential() =>
            View(new GenerateVaultCredentialViewModel());

        public IActionResult SetDevCookie() =>
            View();
    }
}

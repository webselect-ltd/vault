using System.Threading.Tasks;
using System.Web.Mvc;
using Dapper;
using Vault.Models;
using Vault.Support;

namespace Vault.Controllers
{
    public class MainController : Controller
    {
        private SqlExecutor _db;

        public MainController(IConnectionFactory cf) => _db = new SqlExecutor(cf);

        public ActionResult Index() => View();

        [HttpPost]
        public async Task<ActionResult> Login(LoginViewModel model) =>
            await _db.ResultAsJson(conn => conn.QuerySingleOrDefaultAsync<LoginResult>(SqlStatements.Login, new { Username = model.UN1209, Password = model.PW9804 }));

        [HttpPost]
        public async Task<ActionResult> UpdatePassword(UpdatePasswordViewModel model) =>
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

        public ActionResult GenerateVaultCredential() => View(new GenerateVaultCredentialViewModel());

        public ActionResult SetDevCookie() => View();

        public ActionResult Tests() => View();
    }
}

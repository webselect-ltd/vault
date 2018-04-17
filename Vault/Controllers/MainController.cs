using System;
using System.Collections.Generic;
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

        public ActionResult GenerateVaultCredential() => View(new GenerateVaultCredentialViewModel());

        public ActionResult SetDevCookie() => View();

        [HttpPost]
        public async Task<ActionResult> GetCredentialSummaryList(string userId)
        {
            var sql = @"SELECT 
                            CredentialID, 
                            UserID, 
                            Description, 
                            Username, 
                            Password, 
                            Url 
                        FROM 
                            Credentials 
                        WHERE 
                            UserID = @UserID";

            return await _db.ResultAsJson(conn => conn.QueryAsync<CredentialSummary>(sql, new { UserID = userId }));
        }

        [HttpPost]
        public async Task<ActionResult> GetCredentials(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<Credential>("SELECT * FROM Credentials WHERE UserID = @UserID", new { UserID = userId }));

        [HttpPost]
        public async Task<ActionResult> LoadCredential(string id) =>
            await _db.ResultAsJson(conn => conn.QuerySingleOrDefaultAsync<Credential>("SELECT * FROM Credentials WHERE CredentialID = @CredentialID", new { CredentialID = id }));

        [HttpPost]
        public async Task<ActionResult> DeleteCredential(string credentialId, string userId) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync("DELETE FROM Credentials WHERE UserID = @UserID AND CredentialID = @CredentialID", new { UserID = userId, CredentialID = credentialId }));

        [HttpPost]
        public async Task<ActionResult> UpdateCredential(Credential model) => await DoUpdateCredential(model);

        [HttpPost]
        public async Task<ActionResult> UpdateMultipleCredentials(IList<Credential> model)
        {
            foreach (var item in model)
                await DoUpdateCredential(item);

            return Json(new { Updated = model.Count });
        }

        private async Task<ActionResult> DoUpdateCredential(Credential model)
        {
            var sql = @"INSERT INTO 
                            Credentials (
                                CredentialID, 
                                UserID, 
                                Description, 
                                Username, 
                                Password, 
                                Url, 
                                UserDefined1Label, 
                                UserDefined1, 
                                UserDefined2Label, 
                                UserDefined2, 
                                Notes, 
                                PwdOptions
                            ) 
                        VALUES (
                            @CredentialID, 
                            @UserID, 
                            @Description, 
                            @Username, 
                            @Password, 
                            @Url, 
                            @UserDefined1Label, 
                            @UserDefined1, 
                            @UserDefined2Label, 
                            @UserDefined2, 
                            @Notes, 
                            @PwdOptions
                        )";

            if (model.CredentialID != null)
            {
                sql = @"UPDATE 
                            Credentials 
                        SET 
                            UserID = @UserID, 
                            Description = @Description, 
                            Username = @Username, 
                            Password = @Password, 
                            Url = @Url, 
                            UserDefined1Label = @UserDefined1Label, 
                            UserDefined1 = @UserDefined1, 
                            UserDefined2Label = @UserDefined2Label, 
                            UserDefined2 = @UserDefined2, 
                            Notes = @Notes, 
                            PwdOptions = @PwdOptions 
                        WHERE 
                            CredentialID = @CredentialID";
            }

            if (model.CredentialID == null)
                model.CredentialID = Guid.NewGuid().ToString();


            return await _db.ResultAsJson(conn => conn.ExecuteAsync(sql, model));
        }

        [HttpPost]
        public async Task<ActionResult> UpdatePassword(string userId, string oldHash, string newHash) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync("UPDATE Users SET Password = @NewHash WHERE UserID = @UserID AND Password = @OldHash", new { UserID = userId, OldHash = oldHash, NewHash = newHash }));

        [HttpPost]
        public async Task<ActionResult> Login(LoginViewModel model) =>
            await _db.ResultAsJson(conn => conn.QuerySingleOrDefaultAsync<LoginResult>("SELECT UserID FROM Users WHERE Username = @Username AND Password = @Password", new { Username = model.UN1209, Password = model.PW9804 }));

        public ActionResult Tests() => View();
    }
}

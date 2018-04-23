using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Mvc;
using Dapper;
using Vault.Models;
using Vault.Support;

namespace Vault.Controllers
{
    [ProtectWithSecurityKey]
    public class CredentialsController : Controller
    {
        private SqlExecutor _db;

        public CredentialsController(IConnectionFactory cf) => _db = new SqlExecutor(cf);

        [HttpPost]
        public async Task<ActionResult> Create(Credential model) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Insert, model.WithNewID()));

        [HttpPost]
        public async Task<ActionResult> Read(string id) =>
            await _db.ResultAsJson(conn => conn.QuerySingleOrDefaultAsync<Credential>(SqlStatements.SelectSingle, new { CredentialID = id }));

        [HttpPost]
        public async Task<ActionResult> ReadAll(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<Credential>(SqlStatements.Select, new { UserID = userId }));

        [HttpPost]
        public async Task<ActionResult> ReadSummaries(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<CredentialSummary>(SqlStatements.SelectSummary, new { UserID = userId }));

        [HttpPost]
        public async Task<ActionResult> Update(Credential model) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Update, model));

        [HttpPost]
        public async Task<ActionResult> UpdateMultiple(IList<Credential> model) =>
            await _db.ResultAsJson(async (conn, tran) => {
                foreach (var credential in model)
                {
                    credential.CredentialID = Guid.NewGuid().ToString();
                    await conn.ExecuteAsync(SqlStatements.Insert, credential, tran);
                }
                return Json(new { done = true });
            });

        [HttpPost]
        public async Task<ActionResult> Delete(string credentialId, string userId) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Delete, new { UserID = userId, CredentialID = credentialId }));
    }
}

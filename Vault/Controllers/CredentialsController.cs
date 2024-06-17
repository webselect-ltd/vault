using System;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Vault.Models;
using Vault.Support;

namespace Vault.Controllers
{
    public class CredentialsController : Controller
    {
        private readonly SqlExecutor _db;

        public CredentialsController(IConnectionFactory cf) =>
            _db = new SqlExecutor(cf);

        public async Task<ActionResult> ReadTagIndex(string userId) =>
            await _db.ResultAsJson(async conn => {
                var reader = await conn.QueryMultipleAsync(SqlStatements.TagIndex, new { UserID = userId });

                var tags = await reader.ReadAsync<(string TagID, string Label)>();
                var index = await reader.ReadAsync<(string TagID, string CredentialID)>();

                return new {
                    tags = tags.Select(t => new {
                        t.TagID,
                        t.Label,
                    }),
                    index = index
                        .GroupBy(i => i.TagID)
                        .ToDictionary(g => g.Key, g => g.Select(i => i.CredentialID))
                };
            });

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Credential model) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Insert, model.WithNewID()));

        public async Task<ActionResult> Read(string id) =>
            await _db.ResultAsJson(conn => conn.QuerySingleOrDefaultAsync<Credential>(SqlStatements.SelectSingle, new { CredentialID = id }));

        public async Task<ActionResult> ReadAll(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<Credential>(SqlStatements.Select, new { UserID = userId }));

        public async Task<ActionResult> ReadSummaries(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<CredentialSummary>(SqlStatements.SelectSummary, new { UserID = userId }));

        [HttpPost]
        public async Task<ActionResult> Update([FromBody] Credential model) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Update, model));

        [HttpPost]
        public async Task<ActionResult> Import([FromBody] ImportViewModel model) =>
            await _db.ResultAsJson(async (conn, tran) => {
                foreach (var credential in model.Credentials)
                {
                    credential.CredentialID = Guid.NewGuid().ToString();
                    await conn.ExecuteAsync(SqlStatements.Insert, credential, tran);
                }

                return Json(new { done = true });
            });

        [HttpPost]
        public async Task<ActionResult> Delete([FromBody] DeleteCredentialViewModel model) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Delete, new { model.UserID, model.CredentialID }));
    }
}

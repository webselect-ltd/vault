﻿using System;
using System.Collections.Generic;
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

        public async Task<ActionResult> ReadTagIndex(string userID) =>
            await _db.ResultAsJson(async conn => {
                var reader = await conn.QueryMultipleAsync(SqlStatements.TagIndex, new { UserID = userID });

                var tags = await reader.ReadAsync<(string TagID, string Label)>();
                var index = await reader.ReadAsync<(string TagID, string CredentialID)>();

                return new {
                    tags = tags.Select(t => new {
                        tagID = t.TagID,
                        label = t.Label,
                    }),
                    index = index
                        .GroupBy(i => i.TagID)
                        .ToDictionary(g => g.Key, g => g.Select(i => i.CredentialID))
                };
            });

        [HttpPost]
        public async Task<ActionResult> CreateTag([FromBody] Tag model) =>
            await _db.ResultAsJson(async conn => {
                await conn.ExecuteAsync(SqlStatements.InsertNewTags, new[] { model });
                return model;
            });

        [HttpPost]
        public async Task<ActionResult> DeleteTags([FromBody] Tag[] model) =>
            await _db.ResultAsJson(async conn => await conn.ExecuteAsync(SqlStatements.DeleteTags, new { TagIDs = model.Select(t => t.TagID) }));

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Credential model) =>
            await _db.ResultAsJson(async conn => {
                var c = model.WithNewID();
                var a = await conn.ExecuteAsync(SqlStatements.Insert, c);
                var b = await conn.ExecuteAsync(SqlStatements.TagsToCredential, c.TagAssociations);
                return a + b;
            });

        public async Task<ActionResult> Read(string userID, string id) =>
            await _db.ResultAsJson(async conn => {
                var reader = await conn.QueryMultipleAsync(SqlStatements.SelectSingle, new { UserID = userID, CredentialID = id });

                var credential = await reader.ReadSingleAsync<Credential>();
                var tags = await reader.ReadAsync<(string TagID, string Label)>();

                credential.TagIDs = string.Join('|', tags.Select(t => t.TagID));
                credential.TagLabels = tags.Select(t => t.Label).ToArray();

                return credential;
            });

        public async Task<ActionResult> ReadAll(string userID) =>
            await _db.ResultAsJson(async conn => {
                var reader = await conn.QueryMultipleAsync(SqlStatements.Select, new { UserID = userID });

                var credentials = (await reader.ReadAsync<Credential>()).ToList();
                var tagAssociations = await reader.ReadAsync<(string CredentialID, string TagID, string Label)>();

                credentials.ForEach(c => {
                    var tags = tagAssociations.Where(ta => ta.CredentialID == c.CredentialID);

                    // TODO: Support tag data in import
                    // c.TagIDs = string.Join('|', tags.Select(t => t.TagID));
                    c.TagLabels = tags.Select(t => t.Label).ToArray();
                });

                return credentials;
            });

        public async Task<ActionResult> ReadSummaries(string userID) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<CredentialSummary>(SqlStatements.SelectSummary, new { UserID = userID }));

        [HttpPost]
        public async Task<ActionResult> Update([FromBody] Credential model) =>
            await _db.ResultAsJson(async conn => {
                var a = await conn.ExecuteAsync(SqlStatements.Update, model);
                var b = await conn.ExecuteAsync(SqlStatements.DeleteTagsFromCredential, model);
                var c = await conn.ExecuteAsync(SqlStatements.TagsToCredential, model.TagAssociations);
                return a + b + c;
            });

        [HttpPost]
        public async Task<ActionResult> Import([FromBody] ImportViewModel model) =>
            await _db.ResultAsJson(async (conn, tran) => {
                foreach (var credential in model.Credentials)
                {
                    // TODO: Support tag data in import
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

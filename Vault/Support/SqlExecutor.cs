using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Vault.Support
{
    public class SqlExecutor
    {
        private readonly IConnectionFactory _connectionFactory;

        public SqlExecutor(IConnectionFactory connectionFactory) =>
            _connectionFactory = connectionFactory;

        public async Task<T> Result<T>(Func<IDbConnection, Task<T>> action)
        {
            ArgumentNullException.ThrowIfNull(action);

            using (var conn = _connectionFactory.GetConnection())
            {
                conn.Open();

                return await action(conn);
            }
        }

        public async Task<T> Result<T>(Func<IDbConnection, IDbTransaction, Task<T>> action)
        {
            ArgumentNullException.ThrowIfNull(action);

            using (var conn = _connectionFactory.GetConnection())
            {
                conn.Open();

                using (var tran = conn.BeginTransaction())
                {
                    try
                    {
                        var result = await action(conn, tran);

                        tran.Commit();

                        return result;
                    }
                    catch
                    {
                        tran.Rollback();

                        throw;
                    }
                }
            }
        }

        public async Task<JsonResult> ResultAsJson<T>(Func<IDbConnection, Task<T>> action)
        {
            var result = await Result(action);

            return new JsonResult(result);
        }

        public async Task<JsonResult> ResultAsJson<T>(Func<IDbConnection, IDbTransaction, Task<T>> action)
        {
            var result = await Result(action);

            return new JsonResult(result);
        }
    }
}

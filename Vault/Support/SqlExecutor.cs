using System;
using System.Data;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Vault.Support
{
    public class SqlExecutor
    {
        private IConnectionFactory _connectionFactory;

        public SqlExecutor(IConnectionFactory connectionFactory) => _connectionFactory = connectionFactory;

        public async Task<T> Result<T>(Func<IDbConnection, Task<T>> action)
        {
            using (var conn = _connectionFactory.GetConnection())
            {
                conn.Open();
                return await action(conn);
            }
        }

        public async Task<JsonResult> ResultAsJson<T>(Func<IDbConnection, Task<T>> action)
        {
            var result = await Result(action);

            return new JsonResult {
                Data = result
            };
        }
    }
}

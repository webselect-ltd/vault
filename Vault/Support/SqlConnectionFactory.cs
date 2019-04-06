using System.Data;
using System.Data.SqlClient;

namespace Vault.Support
{
    public class SqlConnectionFactory : IConnectionFactory
    {
        private readonly string _connectionString;

        public SqlConnectionFactory(string connectionString) =>
            _connectionString = connectionString;

        public IDbConnection GetConnection() =>
            new SqlConnection(_connectionString);
    }
}

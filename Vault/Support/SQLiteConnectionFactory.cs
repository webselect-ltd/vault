using System.Data;
using System.Data.SQLite;

namespace Vault.Support
{
    public class SQLiteConnectionFactory : IConnectionFactory
    {
        private string _connectionString;

        public SQLiteConnectionFactory(string connectionString) => _connectionString = connectionString;

        public IDbConnection GetConnection() => new SQLiteConnection(_connectionString);
    }
}
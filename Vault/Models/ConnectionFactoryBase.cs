using System.Data;

namespace Vault.Models
{
    public abstract class ConnectionFactoryBase
    {
        protected string _connectionString;

        protected ConnectionFactoryBase(string connectionString)
        {
            _connectionString = connectionString;
        }

        public abstract IDbConnection GetConnection();
    }
}
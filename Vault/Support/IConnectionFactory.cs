using System.Data;

namespace Vault.Support
{
    public interface IConnectionFactory
    {
        IDbConnection GetConnection();
    }
}

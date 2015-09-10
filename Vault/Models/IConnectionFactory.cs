using System.Data;

namespace Vault.Models
{
    public interface IConnectionFactory
    {
        IDbConnection GetConnection();
    }
}

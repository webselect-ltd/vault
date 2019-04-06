using System;

namespace Vault.Models
{
    public class GenerateVaultCredentialViewModel
    {
        public GenerateVaultCredentialViewModel() =>
            UserID = Guid.NewGuid().ToString();

        public string UserID { get; }
    }
}

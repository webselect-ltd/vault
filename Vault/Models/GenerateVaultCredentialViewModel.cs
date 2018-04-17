using System;

namespace Vault.Models
{
    public class GenerateVaultCredentialViewModel
    {
        public GenerateVaultCredentialViewModel() => GUID = Guid.NewGuid().ToString();

        public string GUID { get; }
    }
}

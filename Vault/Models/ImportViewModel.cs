using System.Collections.Generic;

namespace Vault.Models
{
    public class ImportViewModel
    {
        public IList<Credential> Credentials { get; }
            = new List<Credential>();
    }
}

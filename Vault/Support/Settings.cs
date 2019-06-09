using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Vault.Support
{
    public class Settings
    {
        public int SessionTimeoutInSeconds { get; set; }

        public string SecurityKey { get; set; }

        public string SecurityKeyParameterName { get; set; }

        public bool DevMode { get; set; }
    }
}

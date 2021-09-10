using System;

namespace Vault.Models
{
    public class IndexViewModel
    {
        public Uri BaseUrl { get; set; }

        public Uri AbsoluteUrl { get; set; }

        public bool EnableSessionTimeout { get; set; }

        public int SessionTimeoutInSeconds { get; set; }

        public object SecurityKey { get; set; }
    }
}

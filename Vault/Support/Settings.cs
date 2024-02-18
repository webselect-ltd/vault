namespace Vault.Support
{
    public class Settings
    {
        public bool EnableSessionTimeout { get; set; }

        public int SessionTimeoutInSeconds { get; set; }

        public string SecurityKey { get; set; }

        public string SecurityKeyParameterName { get; set; }
    }
}

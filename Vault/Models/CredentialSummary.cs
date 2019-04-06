namespace Vault.Models
{
    public class CredentialSummary
    {
        public string CredentialID { get; set; }

        public string UserID { get; set; }

        public string Description { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }

#pragma warning disable CA1056 // Uri properties should not be strings
        public string Url { get; set; }
#pragma warning restore CA1056 // Uri properties should not be strings
    }
}

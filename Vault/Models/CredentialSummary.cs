using Newtonsoft.Json;

namespace Vault.Models
{
    public class CredentialSummary
    {
        [JsonProperty("credentialID")]
        public string CredentialID { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("username")]
        public string Username { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }
    }
}

using Newtonsoft.Json;

namespace Vault.Models
{
    public class LoginResult
    {
        public LoginResult(string userID) =>
            UserID = userID;

        public static LoginResult Failed =>
            new(null);

        [JsonProperty("userID")]
        public string UserID { get; }

        [JsonProperty("success")]
        public bool Success =>
            !string.IsNullOrWhiteSpace(UserID);
    }
}

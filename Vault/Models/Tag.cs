using Newtonsoft.Json;

namespace Vault.Models
{
    public class Tag
    {
        [JsonProperty("tagID")]
        public string TagID { get; set; }

        [JsonProperty("userID")]
        public string UserID { get; set; }

        [JsonProperty("label")]
        public string Label { get; set; }
    }
}

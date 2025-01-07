using Newtonsoft.Json;

namespace Vault.Models
{
    public class TagDeletionList
    {
        [JsonProperty("tagIDs")]
        public string[] TagIDs { get; set; }
    }
}

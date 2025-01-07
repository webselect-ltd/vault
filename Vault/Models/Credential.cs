using System;
using System.ComponentModel;
using System.Linq;
using Newtonsoft.Json;

namespace Vault.Models
{
    public class Credential
    {
        public Credential()
        {
            CredentialID = "{{credentialID}}";
            UserID = "{{userID}}";
            Description = "{{description}}";
            Username = "{{username}}";
            Password = "{{password}}";
            Url = "{{url}}";
            UserDefined1Label = "{{userDefined1Label}}";
            UserDefined1 = "{{userDefined1}}";
            UserDefined2Label = "{{userDefined2Label}}";
            UserDefined2 = "{{userDefined2}}";
            Notes = "{{notes}}";
            PwdOptions = "{{pwdOptions}}";
            TagIDs = "{{tagIDs}}";
        }

        [JsonProperty("credentialID")]
        public string CredentialID { get; set; }

        [JsonProperty("userID")]
        public string UserID { get; set; }

        [DisplayName("Description")]
        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("username")]
        public string Username { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }

        [DisplayName("Custom 1 Label")]
        [JsonProperty("userDefined1Label")]
        public string UserDefined1Label { get; set; }

        [DisplayName("Custom 1")]
        [JsonProperty("userDefined1")]
        public string UserDefined1 { get; set; }

        [DisplayName("Custom 2 Label")]
        [JsonProperty("userDefined2Label")]
        public string UserDefined2Label { get; set; }

        [DisplayName("Custom 2")]
        [JsonProperty("userDefined2")]
        public string UserDefined2 { get; set; }

        [JsonProperty("notes")]
        public string Notes { get; set; }

        [JsonProperty("pwdOptions")]
        public string PwdOptions { get; set; }

        [DisplayName("Tags")]
        [JsonProperty("tagIDs")]
        public string TagIDs { get; set; }

        [JsonProperty("tagLabels")]
        public string TagLabels { get; set; }

        [JsonIgnore]
        public object[] TagAssociations =>
            TagIDs?
                .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => new { TagID = t, CredentialID }).ToArray() ?? [];

        public Credential WithNewID()
        {
            var credentialWithGuid = (Credential)MemberwiseClone();
            credentialWithGuid.CredentialID = Guid.NewGuid().ToString();
            return credentialWithGuid;
        }
    }
}

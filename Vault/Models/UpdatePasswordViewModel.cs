using System.Collections.Generic;

namespace Vault.Models
{
    public class UpdatePasswordViewModel
    {
        public IList<Credential> UpdatedCredentials { get; }
            = new List<Credential>();

        public IList<Tag> UpdatedTags { get; }
            = new List<Tag>();

        public string UserID { get; set; }

        public string OldPasswordHash { get; set; }

        public string NewPasswordHash { get; set; }
    }
}

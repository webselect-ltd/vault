using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Vault.Models
{
    public class CredentialViewModel
    {
        public string CredentialID { get; set; }
        public string UserID { get; set; }
        public string Description { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string PasswordConfirmation { get; set; }
        public string Url { get; set; }
        public string UserDefined1Label { get; set; }
        public string UserDefined1 { get; set; }
        public string UserDefined2Label { get; set; }
        public string UserDefined2 { get; set; }
        public string Notes { get; set; }
    }
}